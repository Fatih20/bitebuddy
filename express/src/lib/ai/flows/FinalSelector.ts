import envVar from "../../../envVar";
import { ChatAnthropic } from "@langchain/anthropic";
import { wrapSDK } from "langsmith/wrappers";
import {
  FinalOutputMessage,
  FoodFinderAgentState,
  FoodFinderAgentStatePartial,
  HardLimitState,
  SoftLimitState,
} from "../state";
import { convertTextToMessage } from "../utils/messageProcessing";
import { Runnable, RunnableConfig } from "@langchain/core/runnables";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { QueryResult } from "../../search/types";
import { assistantIdentity } from "../prompts/commons";
import { traceable } from "langsmith/traceable";

const finalSelectorPrompt = `
${assistantIdentity}


You will be given food/beverage preference from the user (input #1) and the food/beverage selections that has been selected by another team of assistant (input #2). 

You are tasked to give the final selection of food to be handed to the user, through consideration in input #1 and input 2.

The format of your input #1 and input #2 will be given below.
----
## Format of input #1
The input #1 (user preference for the food/beverage) is given in this JSON format:
{{
  price: {{
    min: number | null // the minimum price of food/beverage that the user wants. null if not specified.
    max: number | null // the maximum price of food/beverage that the user wants. null if not specified.
  }},
  dishType: ("food" | "drink")[] // an array containing the string "food" or "drink". marks the type of dish that the user wants. it could contain both food and drink.
  portionSize: number | null // ignore this property
  "restaurant" : string | null, // The name and description of the restaurant preferred by the user. null if it is not specified.
  "menu" : string // The name of the food/beverage preferred by the user, the description of the food/beverage preferred by the user, any trait or characteristic of the food/beverage. null if it is not specified.
  "cuisine" : string[] // The origins of the food. Is empty if it can't be inferred.
  "flavor" : string[], // The flavors of the food. Is empty if it can't be inferred.
}}
----
## Format of input #2
The input #2 (the selection of food/beverage to draw from) is given in an array in JSON format. Each element of the array is formatted like the following:
{{
  menuName: string, // the name of the food/beverage
  menuDescription: string, // the description of the food/beverage
  menuPrice: number, // the price of the menu
  portion: number // ignore this property
  restaurantName: string // the name of the restaurant where the food comes from
}}
----
The following is the food/beverage preference from the user (input #1) in the aforementioned format:
{userPreference}

The following is the food/beverage that has been pre-selected by another part of the team (input #2) in the aforementioned format:
{queriedFood}
----
You are tasked to make your selection by giving the index of the element of the array of foods/beverages in input #2 that you're choosing. Make sure that the index is within bound! Output STRICTLY in the following format with no other messages:
{{
  index: number // the index of the foods/beverages in the array element from input #2 that you're choosing
}}
----
Respond ONLY with the JSON format message with no other messages:
`;

export type FinalSelectorInput = {
  userPreference: HardLimitState & SoftLimitState;
  queriedFood: QueryResult[];
};

export type FinalSelectorOutput = {
  index: number;
};

export class FinalSelector {
  private static instance: FinalSelector;
  private chain: Runnable<
    { userPreference: string; queriedFood: string },
    FinalSelectorOutput,
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

    console.log("Constructing final selector prompt template");

    const finalSelectorPromptTemplate =
      PromptTemplate.fromTemplate(finalSelectorPrompt);

    console.log("Constructing final selector chains");

    const finalSelectorChain = finalSelectorPromptTemplate
      .pipe(llm)
      .pipe(new JsonOutputParser<FinalSelectorOutput>());
    this.chain = finalSelectorChain;
  }

  static getInstance() {
    if (!FinalSelector.instance) {
      console.log("Constructing the final selector");
      FinalSelector.instance = new FinalSelector();
      console.log("Constructed the final selector");
    }
    return FinalSelector.instance;
  }

  public async finalSelector(
    input: FinalSelectorInput,
    chain: Runnable<
      { userPreference: string; queriedFood: string },
      FinalSelectorOutput,
      RunnableConfig
    >
  ) {
    return await chain.invoke({
      queriedFood: JSON.stringify(input.queriedFood),
      userPreference: JSON.stringify(input.userPreference),
    });
  }

  public async finalSelect(input: FinalSelectorInput) {
    if (!this.chain) {
      throw new Error("Composed chain not formed!");
    }
    return traceable(this.finalSelector, {
      name: "FinalSelector",
    })(input, this.chain);
  }
}

export async function graphFinalSelector(
  state: FoodFinderAgentState
): Promise<FoodFinderAgentStatePartial> {
  console.log("In graph: FinalSelector");
  if (
    state.queryOutput.data.length === 0 &&
    state.queryOutput.message !== null
  ) {
    return {
      finalSelection: {
        index: -1,
        message: undefined,
      },
    };
  }

  if (state.queryOutput.data.length === 0) {
    return {
      finalSelection: {
        index: -1,
        message: "No food/beverages found!",
      },
    };
  }
  const finalSelector = FinalSelector.getInstance();
  const { index: indexRaw } = await finalSelector.finalSelect({
    queriedFood: state.queryOutput.data,
    userPreference: {
      ...state.hardLimitQuery,
      ...state.softLimitQuery,
    },
  });

  let indexProcessed = indexRaw;
  console.log("Query output length: ", state.queryOutput.data.length);
  console.log("Found index: ", indexRaw);
  const indexOutOfBound = indexRaw > state.queryOutput.data.length - 1;

  if (indexOutOfBound) {
    console.warn("Index chosen is out of bound!");
    indexProcessed = -1;
  }

  const message: FinalOutputMessage = indexOutOfBound
    ? "Index out of bound"
    : undefined;

  return {
    finalSelection: {
      index: indexProcessed,
      message,
    },
  };
}
