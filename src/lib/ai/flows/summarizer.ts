import envVar from "../../../envVar";
import { ChatAnthropic } from "@langchain/anthropic";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

import { traceable } from "langsmith/traceable";
import { wrapSDK } from "langsmith/wrappers";
import { summarizeHistoryPrompt } from "../prompts/utils";
import { Runnable, RunnableConfig } from "@langchain/core/runnables";

export class Summarizer {
  private static instance: Summarizer;
  private chain: Runnable<{ chat_history: string }, string, RunnableConfig>;

  private constructor() {
    const llm = wrapSDK(
      new ChatAnthropic({
        model: "claude-3-5-sonnet-20240620",
        temperature: 0.3,
        anthropicApiKey: envVar.anthropicAPIKey,
      })
    );

    console.log("Constructing prompt template");

    const summarizerPromptTemplate = PromptTemplate.fromTemplate(
      summarizeHistoryPrompt
    );

    console.log("Constructing chains");

    const summarizationChain = summarizerPromptTemplate
      .pipe(llm)
      .pipe(new StringOutputParser());
    this.chain = summarizationChain;
  }

  static async getInstance() {
    if (!Summarizer.instance) {
      console.log("Constructing the summarizer");
      Summarizer.instance = new Summarizer();
      console.log("Constructed the summarizer");
    }
    return Summarizer.instance;
  }

  public async summarizeUnwrapped(
    input: { chat_history: string },
    chain: Runnable<{}, string, RunnableConfig>
  ) {
    return await chain.invoke(input);
  }

  public async summarize(input: { chat_history: string }) {
    if (!this.chain) {
      throw new Error("Composed chain not formed!");
    }
    return traceable(this.summarizeUnwrapped, { name: "Summarize" })(
      input,
      this.chain
    );
  }
}
