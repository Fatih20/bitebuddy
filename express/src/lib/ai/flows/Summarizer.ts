import envVar from "../../../envVar";
import { ChatAnthropic } from "@langchain/anthropic";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

import { traceable } from "langsmith/traceable";
import { wrapSDK } from "langsmith/wrappers";
import { Runnable, RunnableConfig } from "@langchain/core/runnables";
import { FoodFinderAgentState, FoodFinderAgentStatePartial } from "../state";
import { BaseMessage } from "@langchain/core/messages";
import {
  getMessageIntermediates,
  MessageIntermediate,
  MessageIntermediateRole,
  parseHistory,
} from "../utils/messageProcessing";
import { assistantIdentity } from "../prompts/commons";

export const summarizePrompt = `
${assistantIdentity}

Your task in the team is to summarize the chat history that you will be given into the description of food or beverage from the user.

Please understand that during the conversation, the user's preference could change overtime. Focus on what is desired by the user's NOW, NOT what the user's had desired previously.

Be as descriptive and contextual as possible by paying attention to previous suggestion by the assistant. For example, if the food previously recommended by the assistant has a price of 30.000, but then the user wants cheaper food, then say that the user demands food with the price below 30.000. The same also applies when the user is asking for more expensive stuff.

You should also pay attention to the menu name and restaurant name previously suggested by the assistant. If after the assistant suggested a food, the user demands to get something else, then mention that the user do not want food from the menu name and menu restaurant previously suggested by the assistant.

if the user had previously been suggested foods/beverages by the assistant, but then the user decides to want something else, put that in very clearly in your summary.

This description will be used down the line by other members of your team, so be as descriptive as necessary to accurately reflect the user's preference. Multiple and many sentences are very much allowed.

Ignore things said by the user that is not related to what they want for food or beverage.
----
User's chat history:

{chatHistory}
----
## Example response
### Example response 1
Meatball with hot spicy broth made out of beef. The meatball should have yellow noodles and vermicelli. Large meatballs are preferred.

### Example response 2
Italian noodles using fettucini noodles with small slices of meat sprinkled in. Soft thick sauces are preferred over thin ones. It's preferred to have a sweet taste over spicy one.

### Example response 3
Fried chicken with spicy sambal and softly fried. Soft thick sauces are preferred over thin ones. Spicy chicken is preferred, do not make it sweet. The user wants the price to be lower than 40.000 and a different menu than the Hangry Cajun Fried Chicken from the Hangry Food Restaurant

### Example response 4
Sweet chocolate milkshake. Make it as sweet as possible with a lot of sugar. It should cost more 10.000 and is not the Sweet Chocolate Milkshake from Circle K.
----
Respond with your answer, don't use quotation marks to enclose it:
`;

export class Summarizer {
  private static instance: Summarizer;
  private chain: Runnable<{ chatHistory: string }, string, RunnableConfig>;

  private constructor() {
    const llm = wrapSDK(
      new ChatAnthropic({
        model: "claude-3-5-sonnet-20240620",
        temperature: 0.4,
        anthropicApiKey: envVar.anthropicAPIKey,
      })
    );

    console.log("Constructing summarizer prompt template");

    const summarizerPromptTemplate =
      PromptTemplate.fromTemplate(summarizePrompt);

    console.log("Constructing summarizer chains");

    const summarizationChain = summarizerPromptTemplate
      .pipe(llm)
      .pipe(new StringOutputParser());
    this.chain = summarizationChain;
  }

  static getInstance() {
    if (!Summarizer.instance) {
      console.log("Constructing the summarizer");
      Summarizer.instance = new Summarizer();
      console.log("Constructed the summarizer");
    }
    return Summarizer.instance;
  }

  async summarizeUnwrapped(
    input: { chatHistory: string },
    chain: Runnable<{}, string, RunnableConfig>
  ) {
    return await chain.invoke(input);
  }

  public async summarize(input: { chatHistory: string }) {
    if (!this.chain) {
      throw new Error("Composed chain not formed!");
    }
    return traceable(this.summarizeUnwrapped, { name: "Summarize" })(
      input,
      this.chain
    );
  }
}

export async function graphSummarize(
  state: FoodFinderAgentState
): Promise<FoodFinderAgentStatePartial> {
  console.log("In Graph: Summarizer");
  const messagesIntermediate: MessageIntermediate[] = getMessageIntermediates(
    state.messages
  );

  console.log("Message Intermediate: ");
  console.log(messagesIntermediate);

  const chatHistory = parseHistory(messagesIntermediate);
  const summarizer = Summarizer.getInstance();

  const summary = await summarizer.summarize({ chatHistory: chatHistory });
  console.log("Summary result:\n", summary);
  return { summary: summary };
}
