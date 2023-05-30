const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const debug = require('debug')('10k');
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { extract10QSections } from './extract10QSections';
import { Document } from "langchain/document";
import { CharacterTextSplitter } from "langchain/text_splitter";
import { promise } from 'zod';
import analyzeFilling from './analyzeFilling';

const CHUNK_SIZE = 4000;
const CHUNK_OVERLAP = 50;
const vectorStore = new MemoryVectorStore(new OpenAIEmbeddings());

export default async function processFiling({ urls, type, sectionIds, ticker }: { urls: string[], type: string, sectionIds: Record<string, string>, ticker: string }) {
  debug(`processFiling called with debug setting: ${process.env.DEBUG}`);
  debug(`urls: ${urls}`);
  debug(`type: ${type}`);
  debug(`ticker: ${ticker}`);

  //TODO check our document databaseto see if we have proccessed this type and ticker in the last 30 days
  /* 
    const documents = vectorStore.similaritySearch(`DOCUMENT TYPE: SEC filing Type: ${type} for Stock Ticker Symbol: ${ticker}`)
    debug(`documents ${(await documents).length}`);
    if ((await documents).length > 0) {
      return `Retrieved processed documents from the vector store for ${ticker}`;
    }
  */
  const sectionPromises: Promise<[partName: string, data: string]>[] = [];

  const splitter = new CharacterTextSplitter({
    separator: " ",
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });

  urls.forEach((url) => sectionPromises.push(extract10QSections(process.env.SEC_API_KEY!, url, sectionIds)));
  const results = await Promise.all(sectionPromises);

  const promises: Promise<Document<Record<string, any>>[]>[] = [];
  const summaryPomises: Promise<string>[] = [];

  results.forEach((result) => {
    // iterate over all the extracted secions of the report, check the data and get a response from GTPT
    for (const [key, value] of Object.entries(result)) {
      summaryPomises.push(analyzeFilling(value, ticker, type, key));
      // TODO generate summary
      //const chunks = await chunkText(value, key, type, ticker);
      //TODO split the text and load into the document store
      promises.push(splitter.createDocuments(
        [value as string],
        [],
        {
          chunkHeader: `DOCUMENT TYPE: SEC filing Type: ${type} for Stock Ticker Symbol: ${ticker}\n\n---\n\n`,
          appendChunkOverlapHeader: true,
        }
      ));
    }
  });

  debug(`processing summaries for ${type} number of summaries is ${summaryPomises.length}`);
  const summaries = await Promise.all(summaryPomises);

  summaries.forEach((result) => {
    for (const [key, value] of Object.entries(result)) {
      promises.push(splitter.createDocuments(
        [value as string],
        [],
        {
          chunkHeader: `SUMMARY DOCUMENT: Summary of SEC filing Type: ${type} for Stock Ticker Symbol: ${ticker}\n\n---\n\n`,
          appendChunkOverlapHeader: true,
        }
      ));
    }
  });

  debug(`processing filing for ${type} documents retreieved ${promises.length}`);
  const resolved = await Promise.all(promises);
  resolved.forEach((documents) => {
    vectorStore.addDocuments(documents);
  });
  return `Seccucfully processes the ${type} for ${ticker}`;
}