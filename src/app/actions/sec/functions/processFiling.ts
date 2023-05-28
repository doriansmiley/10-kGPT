const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const debug = require('debug')('10k');
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import {extract10QSections} from './extract10QSections';
import { Document } from "langchain/document";
import { CharacterTextSplitter } from "langchain/text_splitter";
import { promise } from 'zod';

const CHUNK_SIZE = 4000;
const CHUNK_OVERLAP = 50;
const vectorStore = new MemoryVectorStore(new OpenAIEmbeddings());

export default async function processFiling({url, type,sectionIds, ticker}: {url: string, type: string, sectionIds: Record<string, string>, ticker: string}){
    console.log(`processFiling called with debug setting: ${process.env.DEBUG}`);
    debug(`url: ${url}`);
    debug(`type: ${type}`);
    debug(`ticker: ${ticker}`);
    const splitter = new CharacterTextSplitter({
      separator: " ",
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
    });
    const result = await extract10QSections(process.env.SEC_API_KEY!, url, sectionIds);
    let index = 0;
    const promises: Promise<Document<Record<string, any>>[]>[] = [];
    // iterate over all the extracted secions of the report, check the data and get a response from GTPT
    for (const [key, value] of Object.entries(result)) {
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
    debug(`processing filing for ${type} documents retreieved ${promises.length}`);
    const resolved = await Promise.all(promises);
    resolved.forEach((documents) => {
      vectorStore.addDocuments(documents);
    });
    return `Seccucfully processes the ${type} for ${ticker}`;
  }