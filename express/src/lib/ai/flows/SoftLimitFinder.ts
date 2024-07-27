import envVar from "../../../envVar";
import { ChatAnthropic } from "@langchain/anthropic";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

import { traceable } from "langsmith/traceable";
import { wrapSDK } from "langsmith/wrappers";
import { Runnable, RunnableConfig } from "@langchain/core/runnables";
import {
  FoodFinderAgentState,
  FoodFinderAgentStatePartial,
  HardLimitState,
  SoftLimitState,
} from "../state";
import { assistantIdentity } from "../prompts/commons";

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

export type SoftLimitLLMOutput = {
  restaurant: string | null;
  menu: string | null;
  cuisine: string[];
  flavor: string[];
};

export class SoftLimitFinder {
  private static instance: SoftLimitFinder;
  private chain: Runnable<
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

    console.log("Constructing soft limit finder prompt template");

    const softLimitFinderPromptTemplate = PromptTemplate.fromTemplate(
      softLimitFinderPrompt
    );

    console.log("Constructing soft limit finder chains");

    const softLimitFinderChain = softLimitFinderPromptTemplate
      .pipe(llm)
      .pipe(new JsonOutputParser<SoftLimitLLMOutput>());
    this.chain = softLimitFinderChain;
  }

  static getInstance() {
    if (!SoftLimitFinder.instance) {
      console.log("Constructing the soft limit finder");
      SoftLimitFinder.instance = new SoftLimitFinder();
      console.log("Constructed the soft limit finder");
    }
    return SoftLimitFinder.instance;
  }

  async findSoftLimitUnwrapped(
    input: { summary: string },
    chain: typeof this.chain
  ) {
    return await chain.invoke(input);
  }

  public async findSoftLimit(input: { summary: string }) {
    if (!this.chain) {
      throw new Error("Composed chain not formed!");
    }
    return traceable(this.findSoftLimitUnwrapped, {
      name: "FindSoftLimit",
    })(input, this.chain);
  }
}

export async function graphFindSoftLimit(
  state: FoodFinderAgentState
): Promise<FoodFinderAgentStatePartial> {
  console.log("In Graph: SoftLimitFinder");
  const softLimitFinder = SoftLimitFinder.getInstance();
  const { menu, restaurant, cuisine, flavor } =
    await softLimitFinder.findSoftLimit({
      summary: state.summary,
    });
  const softLimitParsed: SoftLimitState = {
    cuisine: cuisine.join("\n"),
    flavor: flavor.join("\n"),
    menu,
    restaurant,
  };
  return { softLimitQuery: softLimitParsed };
}
