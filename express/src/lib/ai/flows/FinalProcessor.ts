import envVar from "../../../envVar";
import { ChatAnthropic } from "@langchain/anthropic";
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
import { PromptTemplate } from "@langchain/core/prompts";
import {
  JsonOutputParser,
  StringOutputParser,
} from "@langchain/core/output_parsers";
import { QueryResult } from "../../search/types";
import { AIMessage } from "@langchain/core/messages";

const finalProcessorPrompt = `
${assistantIdentity}

You are working at the end stage of your team process. You will be given the food/beverage for the user has been selected (input #1), the original description of the foods/beverages that the user want (input #2), the last message from the user (input #3).

Now you are tasked to give some simple response text that is a part of the final reply to the user. Keep in mind the following rules in doing your task:
- The user will have their selected food (input #1) sent separately, thus DO NOT repeat to much the information input #1 because it would be redundant.
- Focus more on input #3 in forming your reply since it's the most recent reply that you must respond to.
- DO NOT reveal too much info from input #2 in your reply because it is not meant to be revealed directly to the user.

The format of the input #1 will be given below. The format of input #2 and #3 is in plain text.
----
## Format of input #1
{{
  menuName: string, // the name of the food/beverage
  menuDescription: string, // the name of the food/beverage
  menuPrice: number, // the price of the menu
  portion: number // ignore this property
  restaurantName: string // the name of the restaurant where the food comes from
}}
----
The following is the food/beverage that has been selected for the user (input #1) in the aforementioned format:
{selectedFood}

The original description of the foods/beverages that the user want (input #2):
{summary}

The last message from the user (input #3):
{lastMessage}
----
## Example response ##
### Example response 1 ###
Input #1:
{{
  menuName: "Pepperoni Pizza"
  menuDescription: "A pizza with a base of round, flat bread base topped with tomato sauce, melted mozzarella cheese, and thin slices of spicy cured sausage, baked until the crust is crispy and the cheese is bubbly."
  menuPrice: 120.000
  portion: 1
  restaurantName: "Pizza Place"
}}
Input #2: An italian pizza that are cheaper than 150.000, mostly consists of meat sausage, and some mozarella cheese.
Input #3: I like that. But I think I would prefer pizza that mostly consists of meat?
Your answer: Here's pepperoni pizza, a pizza that mostly consists of meat, coming from Pizza Place!

### Example response 2 ###
Input #2:
{{
  menuName: "Sushi Tuna Roll"
  menuDescription: "A Japanese dish consisting of vinegared rice, nori seaweed, and raw tuna, typically rolled into a cylindrical shape and sliced into bite-sized pieces"
  menuPrice: 60.000
  portion: 1
  restaurantName: "Sushi Tei"
}}
Input #2: A japanese cuisine that are more expensive than 30.000.
Input #3: Hmmmmm. I think I would prefer something more expensive and fancy. 30.000 seems to cheap for me.
Your answer: Hopefully you'll like sushi, which is surely a more fancy and expensive japanese food!
----
Respond solely with your answer:
`;

const finalProcessorNotFoundPrompt = `
${assistantIdentity}

You are working at the end stage of your team process. You will be given the last message from the user (input #1) and the description of the food/beverage that the user is looking for (input #2).

Unfortunately, the food/beverage that the user is seeking is not available. You are now tasked to inform them of that unavaibality in a fairly contextual manner based on the input #1 and input #2. Then, you must ask the user to try again with a different type of food.

In doing your task, there are several rule that you must obey:
- Focus more on using input #1 in forming your reply since it's the most recent reply that you must respond to.
- DO NOT reveal too much info from input #2 in your reply because it is not meant to be revealed directly to the user.
----
## Example response ##
### Example response 1 ###
Input #1: I want something like that but more expensive.
Input #2: A sushi filled with crab eggs and premium rice along with premium seaweed that is of the utmost quality.
Your answer: Unfortunately, we have not been able to find the premium exquisite sushi that you're looking for. Perhaps you'd like to try other menus? We're still here to help.

### Example response 2 ###
Input #1: Do you have that but have it be more Indonesian?
Input #2: Spaghetti bolognaise that have an Indonesian touch to them with juicy and delicious tomate sauce as well as tender strands of noodle.
Your answer: Unfortunately, we have not been able to find the Indonesian spaghetti that you're looking for. Would you be willing to try other menus? We're still here to help.
----
The last message from the user (input #1):
{lastMessage}

The description of the food/beverage that the user is looking for (input #2):
{summary}
----
Respond solely with your answer:
`;

export type FinalProcessorNotFoundInput = {
  summary: string;
  lastMessage: string;
};

export type FinalProcessorFoundInput = {
  selectedFood: QueryResult;
  summary: string;
  lastMessage: string;
};
export class FinalProcessor {
  private static instance: FinalProcessor;
  private finalProcessorFoundChain: Runnable<
    { selectedFood: string; summary: string; lastMessage: string },
    string,
    RunnableConfig
  >;

  private finalProcessorNotFoundChain: Runnable<
    { lastMessage: string; summary: string },
    string,
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

    console.log("Constructing final processor prompt template");

    const finalProcessorPromptTemplate =
      PromptTemplate.fromTemplate(finalProcessorPrompt);

    const finalProcessorNotFoundPromptTemplate = PromptTemplate.fromTemplate(
      finalProcessorNotFoundPrompt
    );

    console.log("Constructing final processor chains");

    const finalProcessorFoundChain = finalProcessorPromptTemplate
      .pipe(llm)
      .pipe(new StringOutputParser());

    const finalProcessorNotFoundChain = finalProcessorNotFoundPromptTemplate
      .pipe(llm)
      .pipe(new StringOutputParser());

    this.finalProcessorFoundChain = finalProcessorFoundChain;
    this.finalProcessorNotFoundChain = finalProcessorNotFoundChain;
  }

  static getInstance() {
    if (!FinalProcessor.instance) {
      console.log("Constructing the final processor");
      FinalProcessor.instance = new FinalProcessor();
      console.log("Constructed the final processor");
    }
    return FinalProcessor.instance;
  }

  public async finalProcessFoundUnwrapped(
    input: FinalProcessorFoundInput,
    chain: typeof this.finalProcessorFoundChain
  ) {
    return await chain.invoke({
      lastMessage: input.lastMessage,
      selectedFood: JSON.stringify(input.selectedFood),
      summary: input.summary,
    });
  }

  public async finalProcessFound(input: FinalProcessorFoundInput) {
    if (!this.finalProcessorFoundChain) {
      throw new Error("Composed chain not formed!");
    }
    return traceable(this.finalProcessFoundUnwrapped, {
      name: "FinalProcessFound",
    })(input, this.finalProcessorFoundChain);
  }

  public async finalProcessNotFoundUnwrapped(
    input: FinalProcessorNotFoundInput,
    chain: typeof this.finalProcessorNotFoundChain
  ) {
    return await chain.invoke(input);
  }

  public async finalProcessNotFound(input: FinalProcessorNotFoundInput) {
    if (!this.finalProcessorFoundChain) {
      throw new Error("Composed chain not formed!");
    }
    return traceable(this.finalProcessNotFoundUnwrapped, {
      name: "FinalProcessNotFound",
    })(input, this.finalProcessorNotFoundChain);
  }
}

export function getSelectionError(state: FoodFinderAgentStatePartial): boolean {
  if (!!state.queryOutput?.message) {
    return true;
  }

  if (state.finalSelection?.message === "No food/beverages found!") {
    return true;
  }

  if (state.finalSelection?.message === "Index out of bound") {
    return true;
  }

  if (state.finalSelection?.index === -1) {
    return true;
  }
  return false;
}

export async function graphFinalProcessor(
  state: FoodFinderAgentState
): Promise<FoodFinderAgentStatePartial> {
  const isSelectionError = getSelectionError(state);
  const finalProcessor = FinalProcessor.getInstance();
  let message = "";
  const messageIntermediates = getMessageIntermediates(state.messages);
  const lastMessage = getUserLastMessageString(
    messageIntermediates[messageIntermediates.length - 1]
  );
  if (!isSelectionError && !!state.finalSelection.index) {
    const selectedFood = state.queryOutput.data[state.finalSelection.index];
    message = await finalProcessor.finalProcessFound({
      lastMessage: lastMessage,
      selectedFood: selectedFood,
      summary: state.summary,
    });
    return {
      messages: [
        convertTextToMessage(message),
        new AIMessage(JSON.stringify(selectedFood)),
      ],
    };
  } else {
    message = await finalProcessor.finalProcessNotFound({
      lastMessage: lastMessage,
      summary: state.summary,
    });
    return { messages: [convertTextToMessage(message)] };
  }
}
