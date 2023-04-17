const fs = require('fs');
const { JSDOM } = require('jsdom');
const { v4: uuidv4 } = require('uuid');
const { Configuration, OpenAIApi } = require("openai");

const debug = require('debug')('10k');
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

async function fetch10qs(q10Urls) {
  for (const url of q10Urls) {
    const response = await fetch(url, { mode: 'no-cors' });
    const html = await response.text();
    const pages = parse10QPages(html);
    const promises = []
    pages.forEach((page, index)=>{
      debug(`stripping page`);
      const stripped = removeAttributes(page);
      promises.push(getOpenAIResponse(stripped, index));
    });
    await Promise.all(promises);
  }
}

function parse10QPages(html) {
  const pages = [];
  const dom = new JSDOM(html);
  const pageDivs = dom.window.document.querySelectorAll('*');

  let currentPage = null;
  let tocFound = false;

  for (let i = 0; i < pageDivs.length; i++) {
    const div = pageDivs[i];

    if (!tocFound && div.textContent.toLowerCase().includes('table of contents')) {
      tocFound = true;
      currentPage = dom.window.document.createElement('div');
      currentPage.appendChild(div.cloneNode(true));
    } else if (tocFound && div.tagName === 'HR') {
      currentPage.appendChild(div.cloneNode(true));
      const optimized = htmlToTextExceptTables(currentPage.outerHTML);
      pages.push(optimized);
      currentPage = null;
      tocFound = false;
    } else if (tocFound) {
      currentPage.appendChild(div.cloneNode(true));
    }
  }

  return pages;
}


function htmlToTextExceptTables(html) {
  const dom = new JSDOM();
  const doc = dom.window.document;
  const div = doc.createElement('div');
  div.innerHTML = html;
  let output = '';
  const Node = new JSDOM('').window.Node;
  function extractNode(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName === 'TABLE') {
        // debug('found a table');
        output += node.outerHTML;
      } else if (node.childNodes.length > 0) {
        // debug('found a child node');
        for (let i = 0; i < node.childNodes.length; i++) {
          extractNode(node.childNodes[i]);
        }
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      // debug('found a text node');
      output += node.nodeValue;
    }
  }

  for (let i = 0; i < div.childNodes.length; i++) {
    extractNode(div.childNodes[i]);
  }
  // debug('retuning output')
  return output;
}

function removeAttributes(html) {
  return html.replace(/<[^>]*>/g, (match) => {
    return match.replace(/\S+="[^"]+"/g, '');
  });
}

async function getOpenAIResponse(html, fileName) {
  if (fileName > 9) {
    // save time and money, there could be a ton of pages! 10 is fine
    return;
  }
  let prompt = `Please analyze the extracted page from the 10-Q filling in an HTML table listing positives and negatives. Indicate the page number using ${fileName}. Format the output as HTML.`;
  const question = html;
  prompt += `\nYou: ${question}\n`;

  await fs.promises.writeFile(`./pages/${fileName}-${uuidv4()}.html`, html);

  const count = prompt.split(' ').length + html.split(' ').length;
  if (count > 4000) {
    debug(`Token count: ${count} exceeds maximum`);
    return;
  }

  debug(`Calling OpenAI API with count: ${count}`);
  try {
    const gptResponse = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { "role": "system", "content": "I am a financial analyst working at PwC. I am doing due dilligence of SEC 10-Q and 10-K fillings." },
        { "role": "user", "content": prompt },
      ]
    });
    const uniqueId = uuidv4();
    const file = `<html><body><h1>${fileName}</h1>${gptResponse.data?.choices[0]?.message?.content}</body></html>`;
    await fs.promises.writeFile(`./responses/${fileName}-${uniqueId}.html`, file);
  } catch (e) {
    debug(e.message);
  }
}

async function main() {
  const edgarUrl = 'https://data.sec.gov/submissions/CIK0001321655.json';
  const jsdom = require('jsdom');
  const { JSDOM } = jsdom;

  const { q10Url, k10Url } = await extract10Qand10KUrls(edgarUrl);
  const reports = await fetch10qs(
    q10Url || []
  );
  return true;
}
main();
