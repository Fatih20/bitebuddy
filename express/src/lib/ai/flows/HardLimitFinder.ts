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
  HardLimitState,
  MessageType,
} from "../state";
import { assistantIdentity } from "../prompts/commons";
import {
  convertTextToMessage,
  getMessageIntermediates,
  getUserLastMessageString,
} from "../utils/messageProcessing";

export const hardLimitFinderPrompt = `
${assistantIdentity}

Your task in the team is to convert a description of the food/drink description that they would like into a JSON object describing the food/drink preferred by the user. This task is very important because the object will then be used by the search engine to find the user's food/drink.
----
The description of the food/drink:
{summary}
----
The JSON object you should be outputting is in the following shape:
{{
  "price": {{
    "min": number | null, // the minimum price of food demanded by the user. fill with null if there are no minimum
    "max" : number | null // the maximum price of food demanded by the user. fill with null if there are no maximum
  }},
  isFood: boolean // does the customer want food? fill with null if it can't be inferred.
  isDrink: boolean // does the customer want beverage? fill with null if it can't be inferred.
  portionSize: number | null // the number of people that the food is for. fill with null if it cannot be inferred.
}}

Outside of the obvious rule from the description of each object's property. There are other important rules to follow:
- The two property isFood and isDrink is not mutually exclusive. User can want both food and drink. Both can be true at the same time.
- The minimum and maximum price is in IDR (Indonesian Rupiah).
- If the user would like to have food/drink with an exact price, fill the price.min and price.max with the same value, which is the exact price that the user would like to have.

----
Respond solely with the answer formatted in JSON:
`;

export type HardLimitLLMOutput = {
  price: {
    min: number | null;
    max: number | null;
  };
  isFood: boolean | null;
  isDrink: boolean | null;
  portionSize: number | null;
};

export class HardLimitFinder {
  private static instance: HardLimitFinder;
  private chain: Runnable<
    { summary: string },
    HardLimitLLMOutput,
    RunnableConfig
  >;

  private constructor() {
    const llm = wrapSDK(
      new ChatAnthropic({
        model: "claude-3-5-sonnet-20240620",
        temperature: 0.3,
        anthropicApiKey: envVar.anthropicAPIKey,
      })
    );

    console.log("Constructing hard limit finder prompt template");

    const answerGreetingsPromptTemplate = PromptTemplate.fromTemplate(
      hardLimitFinderPrompt
    );

    console.log("Constructing hard limit finder chains");

    const answerGreetingsChain = answerGreetingsPromptTemplate
      .pipe(llm)
      .pipe(new JsonOutputParser<HardLimitLLMOutput>());
    this.chain = answerGreetingsChain;
  }

  static getInstance() {
    if (!HardLimitFinder.instance) {
      console.log("Constructing the hard limit finder");
      HardLimitFinder.instance = new HardLimitFinder();
      console.log("Constructed the hard limit finder");
    }
    return HardLimitFinder.instance;
  }

  async findHardLimitUnwrapped(
    input: { summary: string },
    chain: typeof this.chain
  ) {
    return await chain.invoke(input);
  }

  public async findHardLimit(input: { summary: string }) {
    if (!this.chain) {
      throw new Error("Composed chain not formed!");
    }
    return traceable(this.findHardLimitUnwrapped, {
      name: "FindHardLimit",
    })(input, this.chain);
  }
}

export async function graphFindHardLimit(
  state: FoodFinderAgentState
): Promise<FoodFinderAgentStatePartial> {
  console.log("In Graph: HardLimitFinder");
  const hardLimitFinder = HardLimitFinder.getInstance();
  const hardLimitRaw = await hardLimitFinder.findHardLimit({
    summary: state.summary,
  });
  const { max: maxPrice, min: minPrice } = hardLimitRaw.price;

  const PRICE_INTERVAL = 5000;
  if (!!maxPrice && !!minPrice && maxPrice === minPrice) {
    let minPriceTemp = minPrice - PRICE_INTERVAL / 2;
    let maxPriceTemp = maxPrice + PRICE_INTERVAL / 2;

    const zeroShift = Math.max(0 - minPriceTemp, 0);
    minPriceTemp += zeroShift;
    maxPriceTemp += zeroShift;

    hardLimitRaw.price.min = minPriceTemp;
    hardLimitRaw.price.max = maxPriceTemp;
  }

  if (!hardLimitRaw.portionSize) {
    hardLimitRaw.portionSize = 1;
  }

  if (!hardLimitRaw.isDrink && !hardLimitRaw.isFood) {
    hardLimitRaw.isFood = true;
  }

  const dishType: ("food" | "drink")[] = [];

  if (hardLimitRaw.isFood) {
    dishType.push("food");
  }

  if (hardLimitRaw.isDrink) {
    dishType.push("drink");
  }

  const hardLimitProcessed = {
    portionSize: hardLimitRaw.portionSize,
    price: { ...hardLimitRaw.price },
    dishType: dishType,
  } as HardLimitState;
  return { hardLimitQuery: hardLimitProcessed };
}
