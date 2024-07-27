import envVar from "../../../envVar";
import { ChatAnthropic } from "@langchain/anthropic";
import {
  JsonOutputParser,
  StringOutputParser,
} from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

import { traceable } from "langsmith/traceable";
import { wrapSDK } from "langsmith/wrappers";
import { hardLimitPrompt, summarizeHistoryPrompt } from "../prompts/utils";
import { Runnable, RunnableConfig } from "@langchain/core/runnables";

export class HardLimitFinder {
  private static instance: HardLimitFinder;
  private chain: Runnable<
    { food_description: string },
    {
      price: {
        under: number | undefined;
        above: number | undefined;
        equal: number | undefined;
      };
    },
    RunnableConfig
  >;

  private constructor() {
    const llm = wrapSDK(
      new ChatAnthropic({
        model: "claude-3-5-sonnet-20240620",
        temperature: 0,
        anthropicApiKey: envVar.anthropicAPIKey,
      })
    );

    console.log("Constructing prompt template");

    const hardLimitPromptTemplate =
      PromptTemplate.fromTemplate(hardLimitPrompt);

    console.log("Constructing chains");

    const hardLimitChain = hardLimitPromptTemplate.pipe(llm).pipe(
      new JsonOutputParser<{
        price: {
          under: number | undefined;
          above: number | undefined;
          equal: number | undefined;
        };
      }>()
    );
    this.chain = hardLimitChain;
  }

  static async getInstance() {
    if (!HardLimitFinder.instance) {
      console.log("Constructing the hard limit finder");
      HardLimitFinder.instance = new HardLimitFinder();
      console.log("Constructed the hard limit finder");
    }
    return HardLimitFinder.instance;
  }

  public async findHardLimitUnwrapped(
    input: { food_description: string },
    chain: Runnable<
      {},
      {
        price: {
          under: number | undefined;
          above: number | undefined;
          equal: number | undefined;
        };
      },
      RunnableConfig
    >
  ) {
    return await chain.invoke(input);
  }

  public async findHardLimit(input: { food_description: string }) {
    if (!this.chain) {
      throw new Error("Composed chain not formed!");
    }
    return traceable(this.findHardLimitUnwrapped, { name: "FindHardLimit" })(
      input,
      this.chain
    );
  }
}
