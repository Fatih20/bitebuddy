import envVar from "../../../envVar";
import { ChatAnthropic } from "@langchain/anthropic";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

import { traceable } from "langsmith/traceable";
import { wrapSDK } from "langsmith/wrappers";

import { Runnable, RunnableConfig } from "@langchain/core/runnables";
import { rephraseQuestionPrompt } from "../prompts/commons";

export class QuestionRephraser {
  private static instance: QuestionRephraser;
  private chain: Runnable<{ user_preference: string }, string, RunnableConfig>;

  private constructor() {
    const llm = wrapSDK(
      new ChatAnthropic({
        model: "claude-3-5-sonnet-20240620",
        temperature: 0.3,
        anthropicApiKey: envVar.anthropicAPIKey,
      })
    );

    console.log("Constructing prompt template");

    const questionRephraserPromptTemplate = PromptTemplate.fromTemplate(
      rephraseQuestionPrompt
    );

    console.log("Constructing chains");

    const rephraseChain = questionRephraserPromptTemplate
      .pipe(llm)
      .pipe(new StringOutputParser());
    this.chain = rephraseChain;
  }

  static async getInstance() {
    if (!QuestionRephraser.instance) {
      console.log("Constructing the question rephraser");
      QuestionRephraser.instance = new QuestionRephraser();
      console.log("Constructed the question rephraser");
    }
    return QuestionRephraser.instance;
  }

  public async rephraseQuestionUnwrapped(
    input: { user_preference: string },
    chain: Runnable<{}, string, RunnableConfig>
  ) {
    return await chain.invoke(input);
  }

  public async rephraseQuestion(input: { user_preference: string }) {
    if (!this.chain) {
      throw new Error("Composed chain not formed!");
    }
    return traceable(this.rephraseQuestionUnwrapped, { name: "FindHardLimit" })(
      input,
      this.chain
    );
  }
}
