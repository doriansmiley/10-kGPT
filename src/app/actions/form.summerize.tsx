'use server';
import { createMachine, interpret, assign } from 'xstate';
import { debug } from 'console';
import { OpenAI } from "langchain/llms/openai";
import { loadSummarizationChain } from "langchain/chains";
import { vectorStore } from './sec/functions';

export async function summerizeFiling(query: string) {
    const model = new OpenAI({ temperature: .5 });
    const docs = await vectorStore.asRetriever().getRelevantDocuments(query);
    const chain = loadSummarizationChain(model, { type: "map_reduce" });
    const res = await chain.call({
        input_documents: docs,
    });
    return res;
}
