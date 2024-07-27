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
  SoftLimitState,
} from "../state";
import { assistantIdentity } from "../prompts/commons";
import {
  convertTextToMessage,
  getMessageIntermediates,
  getUserLastMessageString,
} from "../utils/messageProcessing";

export const uniqueValues = {
  flavor: [
    "sweet",
    "sour",
    "creamy",
    "bitter",
    "aromatic",
    "various",
    "crunchy",
    "savory",
    "spicy",
    "tangy",
    "rich",
    "umami",
    "crispy",
    "fragrant",
    "earthy",
    "fruity",
    "strong",
    "plain",
    "smoky",
    "fresh",
    "spiced",
    "refreshing",
    "unsweetened",
    "floral",
    "mild",
    "neutral",
    "nutty",
    "salty",
    "meaty",
    "chocolatey",
    "varied",
    "na",
    "none",
    "garlicky",
    "cheesy",
    "citrusy",
    "mixed",
    "warm",
    "cold",
    "citrus",
    "n/a",
    "buttery",
    "fizzy",
    "minty",
    "tannic",
    "bitter-sweet",
    "tart",
    "herbal",
    "smooth",
    "pungent",
    "alcoholic",
    "starchy",
    "unknown",
    "bold",
    "varies",
    "roasted",
    "bittersweet",
    "mellow",
    "chewy",
    "flaky",
    "very spicy",
    "numbing",
  ],
  cuisine: [
    "fusion",
    "brazilian",
    "american",
    "asian",
    "japanese",
    "british",
    "taiwanese",
    "thai",
    "italian",
    "australian",
    "indonesian",
    "various",
    "swiss",
    "indian",
    "korean",
    "mediterranean",
    "western",
    "chinese",
    "middle eastern",
    "universal",
    "malaysian",
    "filipino",
    "french",
    "southeast asian",
    "european",
    "turkish",
    "unspecified",
    "mexican",
    "greek",
    "dutch",
    "irish",
    "german",
    "fruit",
    "international",
    "asian fusion",
    "belgian",
    "spanish",
    "varied",
    "none",
    "danish",
    "vietnamese",
    "japanese fusion",
    "swiss fusion",
    "indonesian fusion",
    "generic",
  ],
};

export const softLimitFinderPrompt = `
${assistantIdentity}

Your task in the team is to convert a description of the food/drink description that they would like into a JSON object describing the food/drink preferred by the user. This task is very important because the object will then be used by the search engine to find the user's food/drink.
----
The description of the food/drink:
{summary}
----
The JSON object you should be outputting is in the following shape:
{{
  "restaurant" : string | null, // The name and description of the restaurant preferred by the user. Fill with null if it can't be inferred.
  "menu" : string // The name of the food/beverage preferred by the customer, the description of the food/beverage preferred by the customer, any trait or characteristic of the food/beverage. Fill with null if it can't be inferred.
  "cuisine" : string[] // The origins of the food. Add appropriate values into the array from the list of values given below. Fill with empty array if it can't be inferred.
  "flavor" : string[], // The flavors of the food. Add appropriate values into the array from the list of values given below. Fill with empty array if it can't be inferred.
}}

Values for cuisine:
${uniqueValues.cuisine
  .map((cuisine) => {
    return `- ${cuisine}`;
  })
  .join("\n")}

Values for flavor:
${uniqueValues.flavor
  .map((flavor) => {
    return `- ${flavor}`;
  })
  .join("\n")}

Be concise but accurate in doing your task. Stick faithfully to the given summary in making your description.
----
Respond solely with the answer formatted in JSON:
`;

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

export type SoftLimitLLMOutput = {
  restaurant: string | null;
  menu: string | null;
  cuisine: string[];
  flavor: string[];
};

export type HardLimitLLMOutput = {
  price: {
    min: number | null;
    max: number | null;
  };
  isFood: boolean | null;
  isDrink: boolean | null;
  portionSize: number | null;
};

export type ExclusionLLMOutput = SoftLimitLLMOutput;

export class LimitFinder {
  private static instance: LimitFinder;
  private hardLimitChain: Runnable<
    { summary: string },
    HardLimitLLMOutput,
    RunnableConfig
  >;
  private softLimitchain: Runnable<
    { summary: string },
    SoftLimitLLMOutput,
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

    console.log("Constructing limit finder prompt template");

    const hardLimitFinderPromptTemplate = PromptTemplate.fromTemplate(
      hardLimitFinderPrompt
    );

    console.log("Constructing limit finder chains");

    const hardLimitChain = hardLimitFinderPromptTemplate
      .pipe(llm)
      .pipe(new JsonOutputParser<HardLimitLLMOutput>());
    this.hardLimitChain = hardLimitChain;

    console.log("Constructing soft limit finder prompt template");

    const softLimitFinderPromptTemplate = PromptTemplate.fromTemplate(
      softLimitFinderPrompt
    );

    console.log("Constructing soft limit finder chains");

    const softLimitChain = softLimitFinderPromptTemplate
      .pipe(llm)
      .pipe(new JsonOutputParser<SoftLimitLLMOutput>());
    this.softLimitchain = softLimitChain;
  }

  static getInstance() {
    if (!LimitFinder.instance) {
      console.log("Constructing the hard limit finder");
      LimitFinder.instance = new LimitFinder();
      console.log("Constructed the hard limit finder");
    }
    return LimitFinder.instance;
  }

  async findHardLimitUnwrapped(
    input: { summary: string },
    chain: typeof this.hardLimitChain
  ) {
    return await chain.invoke(input);
  }

  public async findHardLimit(input: { summary: string }) {
    if (!this.hardLimitChain) {
      throw new Error("Composed chain not formed!");
    }
    return traceable(this.findHardLimitUnwrapped, {
      name: "FindHardLimit",
    })(input, this.hardLimitChain);
  }

  async findSoftLimitUnwrapped(
    input: { summary: string },
    chain: typeof this.softLimitchain
  ) {
    return await chain.invoke(input);
  }

  public async findSoftLimit(input: { summary: string }) {
    if (!this.softLimitchain) {
      throw new Error("Composed chain not formed!");
    }
    return traceable(this.findSoftLimitUnwrapped, {
      name: "FindSoftLimit",
    })(input, this.softLimitchain);
  }
}

export async function graphFindLimit(
  state: FoodFinderAgentState
): Promise<FoodFinderAgentStatePartial> {
  console.log("In Graph: LimitFinder");
  const limitFinder = LimitFinder.getInstance();

  const [hardLimitRaw, softLimitRaw] = await Promise.all([
    limitFinder.findHardLimit({ summary: state.summary }),
    limitFinder.findSoftLimit({ summary: state.summary }),
  ]);

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

  const hardLimitParsed: HardLimitState = {
    portionSize: hardLimitRaw.portionSize,
    price: { ...hardLimitRaw.price },
    dishType: dishType,
  };

  const { menu, restaurant, cuisine, flavor } = softLimitRaw;

  const softLimitParsed: SoftLimitState = {
    cuisine: cuisine.join("\n"),
    flavor: flavor.join("\n"),
    menu,
    restaurant,
  };

  console.log("Hard limit:");
  console.log(hardLimitParsed);

  console.log("Soft limit:");
  console.log(softLimitParsed);

  return {
    hardLimitQuery: hardLimitParsed,
    softLimitQuery: softLimitParsed,
  };
}
