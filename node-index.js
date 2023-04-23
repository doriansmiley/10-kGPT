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

async function extract10Qand10KUrls(cik) {
  const query = {
    query: {
      query_string: {
        query: `ticker:(${cik}) AND formType:(10-Q OR 10-K)`
      }
    },
    from: "0",
    size: "20",
    sort: [{ filedAt: { order: "desc" } }]
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.SEC_API_KEY}`
  };
  debug(process.env.SEC_API_ENDPOINT);
  debug(process.env.SEC_API_KEY);
  debug({
    method: 'POST',
    headers,
    body: JSON.stringify(query)
  })
  const response = await fetch(`${process.env.SEC_API_ENDPOINT}?token=${process.env.SEC_API_KEY}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(query)
  });

  const data = await response.json();
  const filings = data?.filings ?? [];
  const q10Url = [];
  const k10Url = [];

  debug(filings.length)
  filings.forEach(f => {
    if (f.formType === '10-Q') {
      q10Url.push(f.linkToFilingDetails);
    }
    if (f.formType === '10-K') {
      k10Url.push(f.linkToFilingDetails);
    }
  });

  return { q10Url, k10Url };
}

async function getOpenAIResponse(text, fileName, sourceUrl) {
  if (fileName > 9) {
    // save time and money, there could be a ton of pages! 10 is fine
    return;
  }
  let prompt = `I am a financial analyst working at PwC reviewing the 10-Q and 10-K filings. Below is a page extracted from one of the filings. Please summarize the information as positive or negative (to a perspective investor) with a score. For example if the information appears to be positive to a potential investor include a table at the top of the response with "Rating: Positive, Score: Average" in the output. Evaluate Score based on the performance of an average high growth company.`;
  const question = text;
  prompt += `\nYou: ${question}\n`;

  await fs.promises.writeFile(`./pages/${fileName}-${uuidv4()}.html`, text);

  const count = prompt.split(' ').length + text.split(' ').length;
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
    const file = `<html><body><h1>${fileName}</h1><p> <a href="${sourceUrl}">Source: ${sourceUrl}</a></p>${gptResponse.data?.choices[0]?.message?.content}</body></html>`;
    await fs.promises.writeFile(`./responses/${fileName}.html`, file);
  } catch (e) {
    debug(e.message);
  }
}

async function extract10QSections(apiToken, edgarUrl, partIdentifierMap) {
  const sectionPromises = Object.entries(partIdentifierMap).map(async ([partName, identifier]) => {
    const url = `https://api.sec-api.io/extractor?url=${edgarUrl}&item=${identifier}&type=text&token=${apiToken}`;
    const response = await fetch(url);
    const data = await response.text();
    return [partName, data];
  });

  const sections = await Promise.all(sectionPromises);
  return Object.fromEntries(sections);
}

async function chunkText(text, fileName) {
  const CHUNK_SIZE = 1500;
  const regex = new RegExp(`(.{1,${CHUNK_SIZE}})\\s+`, 'g');
  let partNumber = 0;
  const chunks = [];
  const results = [];
  let match;
  const promises = [];
  while ((match = regex.exec(text)) !== null) {
    chunks.push(match[1]); // store the chunk in the array
    if (chunks.join(' ').split(/\s+/).length > CHUNK_SIZE) {
      // if the total number of tokens exceeds the max chunk size, write to file and reset
      promises.push(
        fs.promises.writeFile(`./responses/secAPI/${fileName}-${partNumber}.txt`, chunks.join(' '))
      );
      results.push(chunks.join(' '));
      partNumber += 1;
      chunks.length = 0;
    }
  }
  if (chunks.length > 0) {
    // write any remaining chunks to file
    promises.push(
      fs.promises.writeFile(`./responses/secAPI/${fileName}-${partNumber}.txt`, chunks.join(' '))
    );
    results.push(chunks.join(' '));
  }
  await Promise.all(promises);
  return results;
}



async function main() {
  const sectionIds = {
    'Financial Statements': 'part1item1',
    'Management\'s Discussion and Analysis of Financial Condition and Results of Operations': 'part1item2',
    'Quantitative and Qualitative Disclosures About Market Risk': 'part1item3',
    'Controls and Procedures': 'part1item4',
    'Legal Proceedings': 'part2item1',
    'Risk Factors': 'part2item1a',
    'Unregistered Sales of Equity Securities and Use of Proceeds': 'part2item2',
    'Defaults Upon Senior Securities': 'part2item3',
    'Mine Safety Disclosures': 'part2item4',
    'Other Information': 'part2item5',
    'Exhibits': 'part2item6'
  };
  const ticker = process.argv[2];
  debug("command: " + ticker);
  debug("argv: " + process.argv);
  const { q10Url, k10Url } = await extract10Qand10KUrls(ticker);
  debug(q10Url);
  debug(k10Url);
  const parts = [];
/*
  q10Url.forEach(async url => {
    const results = await extract10QSections(process.env.SEC_API_KEY, url, sectionIds);
    results.forEach(async result => {
      for (const [key, value] of Object.entries(result)) {
        parts.push(await chunkText(value, key));
      }
    })
  });
*/
  // for now just get the most rescent 10-Q rather than parsing them all
  const result = await extract10QSections(process.env.SEC_API_KEY, q10Url[0], sectionIds);
  let index = 0;
  const promises = [];
  // iterate over all the extracted secions of the report, check the data and get a response from GTPT
  for (const [key, value] of Object.entries(result)) {
    const chunks = await chunkText(value, key);
    chunks.forEach((chunk, index) => promises.push(getOpenAIResponse(chunk, `${key} ${index}`, q10Url[0])));
  }
  await Promise.all(promises);
}
main();
