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
import {
  FoodFinderAgentState,
  FoodFinderAgentStatePartial,
  MessageType,
} from "../state";
import { assistantIdentity } from "../prompts/commons";
import {
  convertTextToMessage,
  getMessageIntermediates,
  getUserLastMessageString,
} from "../utils/messageProcessing";
import { ChatOpenAI, OpenAI } from "@langchain/openai";

export const answerGreetingsPrompt = `
${assistantIdentity}

Your task in the team is to answer the latests message of greetings/gratitude/small talk/closing that has been made by the customer appropriately.
----
## Examples of input and response ##
### Examples 1 ###
Greetings: Hi there!
Your answer: Hello there! What kind of food are you looking for today?

### Examples 2 ###
Greetings: Thanks a lot! I can now eat something for dinner.
Your answer: You are welcome, I am glad to have helped you. Enjoy your dinner!

### Examples 3 ###
Greetings: Okay that should be it.
Your answer: I am glad that I have been of an assistance. Enjoy your food!
----
The customer's last message:
{lastMessage}
----
Respond solely with your answer and don't use quotation marks to enclose it:
`;

export class GreetingsAnswerer {
  private static instance: GreetingsAnswerer;
  private chain: Runnable<{ lastMessage: string }, string, RunnableConfig>;

  private constructor() {
    const llm = wrapSDK(
      new ChatOpenAI({
        model: "gpt-4o-mini",
        temperature: 0.3,
        apiKey: envVar.openAIAPIKey,
      })
    );

    console.log("Constructing answer greetings prompt template");

    const answerGreetingsPromptTemplate = PromptTemplate.fromTemplate(
      answerGreetingsPrompt
    );

    console.log("Constructing answer greetings chains");

    const answerGreetingsChain = answerGreetingsPromptTemplate
      .pipe(llm)
      .pipe(new StringOutputParser());
    this.chain = answerGreetingsChain;
  }

  static getInstance() {
    if (!GreetingsAnswerer.instance) {
      console.log("Constructing the answer greetings");
      GreetingsAnswerer.instance = new GreetingsAnswerer();
      console.log("Constructed the answer greetings");
    }
    return GreetingsAnswerer.instance;
  }

  async answerGreetingsUnwrapped(
    input: { lastMessage: string },
    chain: typeof this.chain
  ) {
    return await chain.invoke(input);
  }

  public async answerGreetings(input: { lastMessage: string }) {
    if (!this.chain) {
      throw new Error("Composed chain not formed!");
    }
    return traceable(this.answerGreetingsUnwrapped, {
      name: "ClassifyMessageType",
    })(input, this.chain);
  }
}

export async function graphAnswerGreetings(
  state: FoodFinderAgentState
): Promise<FoodFinderAgentStatePartial> {
  console.log("In Graph: AnswerGreetings");
  const greetingsAnswerer = GreetingsAnswerer.getInstance();
  const messageIntermediates = getMessageIntermediates(state.messages);
  const lastMessage = getUserLastMessageString(
    messageIntermediates[messageIntermediates.length - 1]
  );
  const answer = await greetingsAnswerer.answerGreetings({
    lastMessage,
  });
  return { messages: [convertTextToMessage(answer)] };
}
