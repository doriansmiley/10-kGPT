'use server';
import { OpenAI } from "langchain/llms/openai";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { ChainTool } from "langchain/tools";
import { VectorDBQAChain } from "langchain/chains";
import { vectorStore } from './sec/functions';
const debug = require('debug')('10k');

export async function queryStock(query: string) {
    debug(`queryStock: ${query}`);
    const model = new OpenAI({ temperature: .5 });
    const chain = VectorDBQAChain.fromLLM(model, vectorStore);
    const secTool = new ChainTool({
        name: "sec-filing-analysis",
        description:
          "SEC Filing Analysis - useful for when you need to ask questions about the SEC filings for a particular stock. This includes analysis of financial statements.",
        chain: chain,
      });
      const tools = [
        secTool,
      ];
      const executor = await initializeAgentExecutorWithOptions(tools, model, {
        agentType: "zero-shot-react-description",
      });
      const result = await executor.call({ input: query });
      return result.output;
}