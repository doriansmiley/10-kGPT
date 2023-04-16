const fs = require('fs');
const yargs = require('yargs');
const { JSDOM } = require('jsdom');
const { v4: uuidv4 } = require('uuid');
const { Node } = require('jsdom');
const { Configuration, OpenAIApi } = require("openai");

const debug = require('debug')('10k');
debug.log = console.info.bind(console);
require('dotenv').config()

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

async function extract10Qand10KUrls(
  edgarUrl
) {
  const response = await fetch(edgarUrl);
  const data = await response.json();

  const filings = data?.filings?.recent ?? {};
  const q10Url = [];
  const k10Url = [];

  filings?.form?.forEach((f, index) => {
    if (f === '10-Q') {
      const accessionNumber = filings.accessionNumber[index].replace(/-/g, '');
      q10Url.push(
        `https://www.sec.gov/Archives/edgar/data/${data.cik}/${accessionNumber}/${filings.primaryDocument[index]}`
      );
    }
    if (f === '10-K') {
      const accessionNumber = filings.accessionNumber[index].replace(/-/g, '');
      k10Url.push(
        `https://www.sec.gov/Archives/edgar/data/${data.cik}/${accessionNumber}/${filings.primaryDocument[index]}`
      );
    }
  });

  return { q10Url, k10Url };
}

async function fetch10qs(reportTypes, q10Urls, companyName) {
  const reports = [];

  q10Urls.forEach(async (url) => {
    const response = await fetch(url, { mode: 'no-cors' });
    const html = await response.text();
    reportTypes.forEach(async (report) => {
      await findTableByTargetText(html, report, url, companyName);
    });
  });
  return reports;
}

async function findTableByTargetText(html, targetText, url, companyName) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  // Find all TOC links containing the target text
  const tocLinks = [...document.querySelectorAll('a[href^="#"]')].filter((link) => {
    const href = link.getAttribute('href').slice(1); // Remove the '#' symbol
    if (href.length <= 9) { // Check href length
      return false;
    }
    return link.textContent.includes(targetText);
  });
  if (!tocLinks) {
    return;
  }
  // Find the corresponding divs for the TOC links
  const targetDivs = tocLinks.map((link) => {
    const href = link.getAttribute('href').slice(1); // Remove the '#' symbol
    const targetDiv = document.getElementById(href);
    return targetDiv;
  });

  // Find the tables following each target div
  const tables = targetDivs.flatMap(async (targetDiv) => {
    if (!targetDiv) {
      return null;
    }
    let sibling = targetDiv.nextElementSibling;
    while (sibling) {
      if (sibling.innerHTML.includes('<table')) {
        debug(`Table found for "${targetText}"`);
        await getOpenAIResponse(removeAttributes(sibling.outerHTML), targetText, companyName);
        return sibling;
      }
      sibling = sibling.nextElementSibling;
    }
    return null;
  });

  return tables.filter((table) => table !== null);
}

function removeAttributes(html) {
  return html.replace(/<[^>]*>/g, (match) => {
    return match.replace(/\S+="[^"]+"/g, '');
  });
}

async function getOpenAIResponse(table, targetText, companyName) {
  console.log("doing ai stuff");
  let prompt = `I am a financial analyst working at PwC. Please summerize the extracted table data from the ${companyName} 10-Q filling in an HTML table listing positives and negatives. Format the output as HTML.`;
  const question = table;
  prompt += `\nYou: ${question}\n`;

  const count = prompt.split(' ').length + table.split(' ').length;
  if (count > 4000) {
    debug(`Token count: ${count} exceeds maximum`);
    return;
  }

  //debug(`Calling OpenAI API with prompt: ${prompt}`);
  try {
    const gptResponse = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { "role": "system", "content": "I am a financial analyst working at PwC. I am doing due dilligence of SEC 10-Q and 10-K fillings." },
        { "role": "user", "content": `Please summerize the extracted financial data from the ${companyName} 10-Q filling in an HTML table listing positives and negatives. \r\n ${table}` },
      ]
    });
    const uniqueId = uuidv4();
    const file = `<html><body><h1>${targetText}</h1>${gptResponse.data.choices[0].message.content}</body></html>`;
    const fileName = targetText.replace(' ', '-');
    await fs.promises.writeFile(`./responses/${fileName}-${uniqueId}.html`, file);
  } catch (e) {
    debug(e.message);
  }
}

async function getTickerDetails(ticker) {
  const tickerUrl = 'https://www.sec.gov/files/company_tickers.json';

  const response = await fetch(tickerUrl);
  const data = await response.json();

  for (const key in data) {
    if (data[key].ticker === ticker) {
      const cik = data[key].cik_str.toString().padStart(10, '0');
      const companyName = data[key].title;
      return [cik, companyName];
    }
  }

  console.error(`Could not find CIK for ticker ${ticker}. Aborting`);
  process.exit(1);
}

async function main() {
  const options = yargs
    .usage("Usage: -t <ticker>")
    .option("t", { alias: "ticker", describe: "Company ticker", type: "string", default: "PLTR" })
    .argv;
  debug(`Input ticker: ${options.ticker}`);
  
  const [cik, companyName] = await getTickerDetails(options.ticker);
  debug(`Mapped ticker ${options.ticker} to ${companyName} - CIK ${cik}`);
  const edgarUrl = `https://data.sec.gov/submissions/CIK${cik}.json`;
  
  const jsdom = require('jsdom');
  const { JSDOM } = jsdom;

  const { q10Url, k10Url } = await extract10Qand10KUrls(edgarUrl);
  const reports = await fetch10qs(
    [
      'Financial Statements (Unaudited)',
      'Condensed Consolidated Balance Sheets',
      'Condensed Consolidated Statements of Operations',
      'Condensed Consolidated Statements of Comprehensive Loss',
      'Condensed Consolidated Statements of Stockholders’ Equity',
      'Condensed Consolidated Statements of Cash Flows',
    ],
    q10Url || [],
    companyName
  );
  return true;
}
main();
