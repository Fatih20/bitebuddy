import weaviate, {
  BaseNearTextOptions,
  Collection,
  Filters,
  FilterValue,
  WeaviateClient,
} from "weaviate-client";

import util from "util";

import { z } from "zod";
import { QueryInput } from "./type.ts";
import {
  bebas,
  friedChicken,
  makananSpesifik,
  martabakAsin,
  martabakFaulty,
  martabakManis,
  rotiBakar,
  yangPentingBrazil,
} from "./querySample.ts";

util.inspect.defaultOptions.depth = null;
const COLLECTION_NAME = "Menu";

class QueryProcessor {
  private client: WeaviateClient;
  private collection: Collection<undefined, "Menu">;

  public constructor() {}

  public async init() {
    this.client = await weaviate.connectToLocal();
    this.collection = await this.client.collections.get(COLLECTION_NAME);
  }

  public async query(input: QueryInput) {
    const collection = this.collection;
    const queries: string[] = [];
    const options: BaseNearTextOptions<undefined> = {
      limit: 5,
    };

    const filters: FilterValue[] = [];
    const moveAwayConcepts: string[] = [];
    const moveToConcepts: string[] = [];

    // handle query for price
    if (input.price) {
      if (input.price.min) {
        filters.push(
          collection.filter
            .byProperty("menuPrice")
            .greaterOrEqual(input.price.min)
        );
      }

      if (input.price.max) {
        filters.push(
          collection.filter.byProperty("menuPrice").lessOrEqual(input.price.max)
        );
      }
    }

    // handle portion
    if (input.portion) {
      moveToConcepts.push(`portion almost ${input.portion}`);
    }

    // handle dishType
    if (input.dishType && input.dishType.length !== 0) {
      if (input.dishType.length === 2) {
        filters.push(
          collection.filter
            .byProperty("dishType")
            .containsAll(["food", "drink"])
        );
      } else if (input.dishType.length === 1) {
        filters.push(
          collection.filter.byProperty("dishType").containsAll(input.dishType)
        );
      }
    }

    // handle queries
    if (input.query.restaurant) {
      queries.push(`restaurant ${input.query.restaurant.toLowerCase()}`);
    }

    if (input.query.menu) {
      queries.push(`menu ${input.query.menu.toLowerCase()}`);
    }

    if (input.query.flavor) {
      queries.push(`flavor ${input.query.flavor.toLowerCase()}`);
    }

    if (input.query.cuisine) {
      queries.push(`cuisine ${input.query.cuisine.toLowerCase()}`);
    }

    // handle exclusion
    if (input.exclusionQuery) {
      if (input.exclusionQuery.restaurant) {
        moveAwayConcepts.push(
          `restaurant ${input.exclusionQuery.restaurant.toLowerCase()}`
        );
      }

      if (input.exclusionQuery.menu) {
        moveAwayConcepts.push(
          `menu ${input.exclusionQuery.menu.toLowerCase()}`
        );
      }

      if (input.exclusionQuery.flavor) {
        moveAwayConcepts.push(
          `flavor ${input.exclusionQuery.flavor.toLowerCase()}`
        );
      }

      if (input.exclusionQuery.cuisine) {
        moveAwayConcepts.push(
          `cuisine ${input.exclusionQuery.cuisine.toLowerCase()}`
        );
      }
    }

    // build query
    if (queries.length === 0) {
      queries.push("food");
    }

    if (filters.length > 0) {
      if (filters.length === 1) {
        // console.log("one filter");
        options.filters = filters[0];
      } else {
        options.filters = Filters.and(...filters);
      }
    }

    if (moveAwayConcepts.length > 0) {
      options.moveAway = {
        force: 0.5,
        concepts: moveAwayConcepts,
      };
    }
    if (moveToConcepts.length > 0) {
      options.moveTo = {
        force: 0.5,
        concepts: moveToConcepts,
      };
    }

    // console.log(`queries`);
    // console.log(queries);
    // console.log("options");
    // console.log(options);

    return await this.collection.query.nearText(queries.join(" "), options);
  }
}

(async function main() {
  const processor = new QueryProcessor();
  await processor.init();

  const names = [
    "friedChicken",
    "martabakAsin",
    "martabakManis",
    "martabakFaulty",
    "rotiBakar",
    "bebas",
    "makananSpesifik",
    "yangPentingBrazil",
  ];

  const vars: QueryInput[] = [
    friedChicken,
    martabakAsin,
    martabakManis,
    martabakFaulty,
    rotiBakar,
    bebas,
    makananSpesifik,
    yangPentingBrazil,
  ];

  for (let i = 0; i < vars.length; i++) {
    const name = names[i];
    console.time(name);
    console.log(vars[i]);
    const result = await processor.query(vars[i]);
    console.log(name);
    console.log(result);
    console.timeEnd(name);
  }
})();
