import envVar from "../../../envVar";
import { ChatAnthropic } from "@langchain/anthropic";
import { traceable } from "langsmith/traceable";
import { wrapSDK } from "langsmith/wrappers";
import { Runnable, RunnableConfig } from "@langchain/core/runnables";
import { FoodFinderAgentState, FoodFinderAgentStatePartial } from "../state";
import { convertTextToMessage } from "../utils/messageProcessing";

export class FinalProcessor {
  private static instance: FinalProcessor;

  private constructor() {
    const llm = wrapSDK(
      new ChatAnthropic({
        model: "claude-3-5-sonnet-20240620",
        temperature: 0,
        anthropicApiKey: envVar.anthropicAPIKey,
      })
    );
  }

  static async getInstance() {
    if (!FinalProcessor.instance) {
      console.log("Constructing the summarizer");
      FinalProcessor.instance = new FinalProcessor();
      console.log("Constructed the summarizer");
    }
    return FinalProcessor.instance;
  }

  //   public async finalProcessUnwrapped(
  //     input: { chat_history: string },
  //     chain: Runnable<{}, string, RunnableConfig>
  //   ) {
  //     return await chain.invoke(input);
  //   }

  //   public async finalProcess(input: { chat_history: string }) {
  //     if (!this.chain) {
  //       throw new Error("Composed chain not formed!");
  //     }
  //     return traceable(this.finalProcessUnwrapped, { name: "Summarize" })(
  //       input,
  //       this.chain
  //     );
  //   }
}

export function graphFinalProcess(
  state: FoodFinderAgentState
): FoodFinderAgentStatePartial {
  return { messages: [convertTextToMessage("I'll take note of that.")] };
}
