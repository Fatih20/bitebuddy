import envVar from "../../../envVar";
import { ChatAnthropic } from "@langchain/anthropic";
import {
  JsonOutputParser,
  StringOutputParser,
} from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

import { traceable } from "langsmith/traceable";
import { wrapSDK } from "langsmith/wrappers";
import { Runnable, RunnableConfig } from "@langchain/core/runnables";
import { FoodFinderAgentState, FoodFinderAgentStatePartial } from "../state";
import { assistantIdentity } from "../prompts/commons";
import {
  convertTextToMessage,
  getMessageIntermediates,
  getUserLastMessageString,
} from "../utils/messageProcessing";
import { ChatOpenAI, OpenAI } from "@langchain/openai";

export const answerUnrelatedInquiryPrompt = `
${assistantIdentity}

You've been given inquiry or instructions unrelated to your task as an assistant to choose food. Answer by being apologetic that the inquiry is outside of your ability, and redirect the user elsewhere.
----
User's unrelated inquiry:

{lastMessage}
----
Respond solely with your answer and don't use quotation marks to enclose it:
`;

export class UnrelatedInquiryAnswerer {
  private static instance: UnrelatedInquiryAnswerer;
  private chain: Runnable<{ lastMessage: string }, string, RunnableConfig>;

  private constructor() {
    const llm = wrapSDK(
      new ChatOpenAI({
        model: "gpt-4o-mini",
        temperature: 0.3,
        apiKey: envVar.openAIAPIKey,
      })
    );

    console.log("Constructing answer unrelated inquiry prompt template");

    const answerUnrelatedInquiryPromptTemplate = PromptTemplate.fromTemplate(
      answerUnrelatedInquiryPrompt
    );

    console.log("Constructing answer unrelated inquiry chains");

    const messageClassifierTypeChain = answerUnrelatedInquiryPromptTemplate
      .pipe(llm)
      .pipe(new StringOutputParser());
    this.chain = messageClassifierTypeChain;
  }

  static getInstance() {
    if (!UnrelatedInquiryAnswerer.instance) {
      console.log("Constructing the answer unrelated inquiry");
      UnrelatedInquiryAnswerer.instance = new UnrelatedInquiryAnswerer();
      console.log("Constructed the answer unrelated inquiry");
    }
    return UnrelatedInquiryAnswerer.instance;
  }

  async answerUnrelatedInquiryUnwrapped(
    input: { lastMessage: string },
    chain: typeof this.chain
  ) {
    return await chain.invoke(input);
  }

  public async answerUnrelatedInquiry(input: { lastMessage: string }) {
    if (!this.chain) {
      throw new Error("Composed chain not formed!");
    }
    return traceable(this.answerUnrelatedInquiryUnwrapped, {
      name: "AnswerUnrelatedInquiry",
    })(input, this.chain);
  }
}

export async function graphAnswerUnrelatedInquiry(
  state: FoodFinderAgentState
): Promise<FoodFinderAgentStatePartial> {
  console.log("In Graph: AnswerUnrelatedInquiry");
  const answerUnrelatedInquiry = UnrelatedInquiryAnswerer.getInstance();
  const messageIntermediates = getMessageIntermediates(state.messages);
  const lastMessage = getUserLastMessageString(
    messageIntermediates[messageIntermediates.length - 1]
  );
  const answer = await answerUnrelatedInquiry.answerUnrelatedInquiry({
    lastMessage,
  });
  return { messages: [convertTextToMessage(answer)] };
}
