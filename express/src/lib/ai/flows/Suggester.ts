import envVar from "../../../envVar";
import { ChatAnthropic } from "@langchain/anthropic";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

import { traceable } from "langsmith/traceable";
import { wrapSDK } from "langsmith/wrappers";
import { Runnable, RunnableConfig } from "@langchain/core/runnables";
import { FoodFinderAgentState, FoodFinderAgentStatePartial } from "../state";
import {
  convertTextToMessage,
  getMessageIntermediates,
  getUserLastMessageString,
} from "../utils/messageProcessing";
import { assistantIdentity } from "../prompts/commons";

export const suggesterPrompt = `
${assistantIdentity}


The user just asked for some suggestion as to what they should get from the application. Your task in the team is to try to suggest something to the user based on their question for suggeestion.

In making your response, obey the following rules:
- Give contextual suggestion from the user based on the user's question for suggestion. Pay attention to their question.
----
User's question for suggestion:

{lastMessage}
----
## Example response
### Example response 1
User's question for suggestion: Suggest me something for dinner.
Your answer: I would suggest for you to have a good bowl of meatball with hot and thick broth.

### Example response 2
User's question for suggestion: I am very hungry right now because I've been in a hackathon for the past 24 hours. Can you suggest something that is very caloric-heavy and that will satisfy me?
Your answer: That's very much noted. I would suggest a beef steak with extra portion, which should really satiate your need.
----
Respond with your answer, don't use quotation marks to enclose it:
`;

export class Suggester {
  private static instance: Suggester;
  private chain: Runnable<{ lastMessage: string }, string, RunnableConfig>;

  private constructor() {
    const llm = wrapSDK(
      new ChatAnthropic({
        model: "claude-3-5-sonnet-20240620",
        temperature: 0.4,
        anthropicApiKey: envVar.anthropicAPIKey,
      })
    );

    console.log("Constructing suggester prompt template");

    const suggesterPromptTemplate =
      PromptTemplate.fromTemplate(suggesterPrompt);

    console.log("Constructing suggester chains");

    const suggesterChain = suggesterPromptTemplate
      .pipe(llm)
      .pipe(new StringOutputParser());
    this.chain = suggesterChain;
  }

  static getInstance() {
    if (!Suggester.instance) {
      console.log("Constructing the suggester");
      Suggester.instance = new Suggester();
      console.log("Constructed the suggester");
    }
    return Suggester.instance;
  }

  async suggestUnwrapped(
    input: { lastMessage: string },
    chain: Runnable<{}, string, RunnableConfig>
  ) {
    return await chain.invoke(input);
  }

  public async suggest(input: { lastMessage: string }) {
    if (!this.chain) {
      throw new Error("Composed chain not formed!");
    }
    return traceable(this.suggestUnwrapped, { name: "Suggester" })(
      input,
      this.chain
    );
  }
}

export async function graphSuggest(
  state: FoodFinderAgentState
): Promise<FoodFinderAgentStatePartial> {
  console.log("In Graph: Suggester");

  const messageIntermediates = getMessageIntermediates(state.messages);
  const lastMessage = getUserLastMessageString(
    messageIntermediates[messageIntermediates.length - 1]
  );

  const suggester = Suggester.getInstance();

  const suggestion = await suggester.suggest({ lastMessage });
  console.log("Suggestion result:\n", suggestion);
  return { messages: [convertTextToMessage(suggestion)] };
}
