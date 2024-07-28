import weaviate, {
  BaseBm25Options,
  BaseHybridOptions,
  BaseNearTextOptions,
  Collection,
  Filters,
  FilterValue,
  WeaviateClient,
} from "weaviate-client";

import util from "util";

import { QueryInput, QueryOutput, QueryResult } from "./type.ts";
import {
  ayamGoreng,
  chickenWings,
  espresso,
  friedChicken,
  japaneseFood,
  martabakTelor,
  mcd,
  onionRing,
  spaghetti,
} from "./querySample.ts";

util.inspect.defaultOptions.depth = null;
const COLLECTION_NAME = "Menu";
const RESTAURANT_COLLECTION = "Restaurant";

class QueryProcessor {
  private client: WeaviateClient;
  private collection: Collection<undefined, "Menu">;
  private restaurantCollection: Collection<undefined, "Restaurant">;

  public constructor() {}

  public async init() {
    this.client = await weaviate.connectToLocal();
    this.collection = await this.client.collections.get(COLLECTION_NAME);
    this.restaurantCollection = await this.client.collections.get(
      RESTAURANT_COLLECTION
    );
  }

  private async queryRestaurant(name: string): Promise<string[]> {
    const result = await this.restaurantCollection.query.bm25(name, {
      limit: 5,
    });
    return result.objects.map((o) => o.uuid);
  }

  public async query(input: QueryInput): Promise<QueryOutput> {
    let explainMessage: string | null = null;

    const collection = this.collection;
    const queries: string[] = [];
    const options: BaseNearTextOptions<undefined> = {
      limit: 10,
      returnReferences: [
        {
          linkOn: "hasRestaurant",
          returnProperties: ["name"],
        },
      ],
      returnMetadata: ["distance"],
      distance: 0.4,
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
      const includeRestaurants = await this.queryRestaurant(
        input.query.restaurant.toLocaleLowerCase()
      );

      if (includeRestaurants.length !== 0) {
        filters.push(
          this.collection.filter
            .byRef("hasRestaurant")
            .byId()
            .containsAny(includeRestaurants)
        );
      } else {
        explainMessage = `no restaurant ${input.query.restaurant} found`;
        filters.push(
          this.collection.filter
            .byRef("hasRestaurant")
            .byProperty("name")
            .equal("laskjdlkasjdsa") // intentional empty result query
        );
      }
    }

    if (input.query.menu) {
      queries.push(`name ${input.query.menu.toLowerCase()}`);
    }

    if (input.query.flavor) {
      // queries.push(`flavor ${input.query.flavor.toLowerCase()}`);
      moveToConcepts.push(`flavor ${input.query.flavor.toLowerCase()}`);
    }

    if (input.query.cuisine) {
      // moveToConcepts.push(`cuisine ${input.query.cuisine.toLowerCase()}`);
      queries.push(`cuisine ${input.query.cuisine.toLowerCase()}`);
    }

    // handle exclusion
    if (input.exclusionQuery) {
      if (input.exclusionQuery.restaurant) {
        const excludeRestaurants = await this.queryRestaurant(
          input.exclusionQuery.restaurant.toLocaleLowerCase()
        );

        excludeRestaurants.forEach((e) => {
          filters.push(
            this.restaurantCollection.filter
              .byRef("hasRestaurant")
              .byId()
              .notEqual(e)
          );
        });
      }

      if (input.exclusionQuery.menu) {
        moveAwayConcepts.push(`${input.exclusionQuery.menu.toLowerCase()}`);
      }

      if (input.exclusionQuery.flavor) {
        // queries.push(`flavor not ${input.exclusionQuery.flavor.toLowerCase()}`);
        moveAwayConcepts.push(`${input.exclusionQuery.flavor.toLowerCase()}`);
      }

      if (input.exclusionQuery.cuisine) {
        // queries.push(
        //   `cuisine not ${input.exclusionQuery.cuisine.toLowerCase()}`
        // );
        moveAwayConcepts.push(`${input.exclusionQuery.cuisine.toLowerCase()}`);
      }
    }

    // build query
    if (queries.length === 0) {
      queries.push("food");
    }

    if (filters.length > 0) {
      if (filters.length === 1) {
        options.filters = filters[0];
      } else {
        options.filters = Filters.and(...filters);
      }
    }

    // handle portion
    if (input.portion) {
      moveToConcepts.push(`portion almost ${input.portion}`);
    }

    if (moveAwayConcepts.length > 0) {
      options.moveAway = {
        force: 1,
        concepts: moveAwayConcepts,
      };
    }

    if (moveToConcepts.length > 0) {
      options.moveTo = {
        force: 0.5,
        concepts: moveToConcepts,
      };
    }

    console.log(`queries`);
    console.log(queries);
    console.log("options");
    console.log(options);

    const result = await this.collection.query.nearText(
      queries.join(" and "),
      options
    );

    if (result.objects.length === 0) {
      explainMessage = "no menu meets the query criteria";
    }

    console.log(result);

    const resultData = result.objects.map((o) => {
      o.properties;
      return {
        menuName: o.properties.menuName,
        menuDescription: o.properties.menuDescription,
        menuPrice: o.properties.menuPrice,
        portion: o.properties.portion,
        restaurantName: o.references.hasRestaurant.objects[0].properties.name,
      };
    });

    return {
      data: resultData as QueryResult[],
      message: explainMessage,
    };
  }
}

(async function main() {
  const processor = new QueryProcessor();
  await processor.init();

  const names = [
    // "espresso",
    // "spaghetti",
    // "friedChicken",
    "japaneseFood",
    // "ayamGoreng",
    // "onionRing",
    // "chickenWings",
    // "martabakTelor",
    // "mcd",
  ];

  const vars: QueryInput[] = [
    // espresso,
    // spaghetti,
    // friedChicken,
    japaneseFood,
    // ayamGoreng,
    // onionRing,
    // chickenWings,
    // martabakTelor,
    // mcd,
  ];

  for (let i = 0; i < vars.length; i++) {
    const name = names[i];
    console.time(name);
    console.log(vars[i]);
    console.log(name);
    const result = await processor.query(vars[i]);
    // console.log(result);
    console.timeEnd(name);
  }
})();
