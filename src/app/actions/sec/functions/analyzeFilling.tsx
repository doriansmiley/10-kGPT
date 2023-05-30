import { OpenAI } from "langchain/llms/openai";
import { loadSummarizationChain, AnalyzeDocumentChain } from "langchain/chains";
import {
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    PromptTemplate,
    SystemMessagePromptTemplate,
} from "langchain/prompts";
const debug = require('debug')('10k');
import * as fs from "fs";


function getPrompt(text: string, fileName: string) {
    debug(`getPrompt fileName: ${fileName}`);
    const base = 'Please summarize the information as positive or negative (to a perspective investor) with a score.' +
        'For example if the information appears to be positive to a potential investor include a table at the top of the response' +
        ' with "Rating: Positive, Score: Average" in the output. Evaluate Score based on the performance of an average high growth company.';
    // TODO add handling for all financial documents (ie cash flow etc)
    // create one prompt for each calcuation we want to run, ie https://www.investopedia.com/articles/basics/06/assetperformance.asp
    if (fileName.indexOf('Financial Statements') >= 0 && text.toLowerCase().indexOf('condensed consolidated balance sheets') >= 0) {
        debug(` getPromptfileName: ${fileName} generating prompt for financial statements`);
        return base +
            ` Use common GAAP approved methods to evaluate the quality of the fincial statement.`
    }
    return base;
}

export default async function analyzeFilling(text: string, ticker: string, filingType: string, fileName: string) {

    // create the required directories
    try {
        // TODO add a model factory to get the model we are using
        const model = new OpenAI({
            temperature: 0.7,
            openAIApiKey: process.env.OPENAI_API_KEY,
        });

        const prompt = ChatPromptTemplate.fromPromptMessages([
            SystemMessagePromptTemplate.fromTemplate(
                `You a financial analyst working at PwC reviewing the 10-Q and 10-K filings. You are analyzing the ${fileName} secion of the ${filingType} filing.`
            ),
            HumanMessagePromptTemplate.fromTemplate(getPrompt(text, fileName)),
        ]);

        const params = {
            prompt,
            type: 'map_reduce'
        }
        const combineDocsChain = loadSummarizationChain(model, params);
        const chain = new AnalyzeDocumentChain({
            combineDocumentsChain: combineDocsChain,
        });
        const res = await chain.call({
            input_document: text,
        });
        await fs.promises.mkdir(`./responses/${ticker}/${filingType}`, { recursive: true });
        await fs.promises.writeFile(`./responses/${ticker}/${filingType}/${fileName}-summary.txt`, res.text);
        return res.text;
    } catch (e) {
        debug(e);
        throw e;
    }
    
};