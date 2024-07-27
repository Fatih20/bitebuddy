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

import { QueryInput } from "./type.ts";
import {
  ayamGoreng,
  chickenWings,
  espresso,
  friedChicken,
  japaneseFood,
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

  public async queryExact(input: QueryInput) {
    const collection = this.collection;
    const queries: string[] = [];
    const options: BaseBm25Options<undefined> = {
      limit: 5,
      returnReferences: [
        {
          linkOn: "hasRestaurant",
          returnProperties: ["name"],
        },
      ],
      returnMetadata: ["score"],
      queryProperties: [
        "menuName^3",
        "menuTag^2",
        "menuDescription",
        "cuisine",
        "flavor",
      ],
    };

    const filters: FilterValue[] = [];

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
      filters.push(
        Filters.or(
          this.collection.filter.byProperty("portion").equal(1),
          this.collection.filter.byProperty("portion").equal(input.portion)
        )
      );
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
          this.restaurantCollection.filter
            .byRef("hasRestaurant")
            .byId()
            .containsAny(includeRestaurants)
        );
      } else {
        filters.push(
          this.restaurantCollection.filter
            .byRef("hasRestaurant")
            .byProperty("name")
            .equal("laksjdaslkjdas") // intentional empty result
        );
      }
    }

    if (input.query.menu) {
      queries.push(`${input.query.menu.toLowerCase()}`);
    }

    if (input.query.flavor) {
      queries.push(`${input.query.flavor.toLowerCase()}`);
    }

    if (input.query.cuisine) {
      queries.push(`${input.query.cuisine.toLowerCase()}`);
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
        filters.push(
          this.collection.filter
            .byProperty("menuName")
            .notEqual(`${input.exclusionQuery.menu.toLowerCase()}`)
        );
      }

      if (input.exclusionQuery.flavor) {
        filters.push(
          this.collection.filter
            .byProperty("flavor")
            .notEqual(input.exclusionQuery.flavor.toLowerCase())
        );
      }

      if (input.exclusionQuery.cuisine) {
        filters.push(
          this.collection.filter
            .byProperty("cuisine")
            .notEqual(input.exclusionQuery.cuisine)
        );
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

    const query = queries.join(" ");

    console.log(`queries`);
    console.log(queries);
    console.log("options");
    console.log(options);

    return await this.collection.query.bm25(query, options);
  }

  public async queryVector(input: QueryInput) {
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

    return await this.collection.query.nearText(queries.join(" and "), options);
  }

  public async queryHybrid(input: QueryInput) {
    const collection = this.collection;
    const queries: string[] = [];
    const options: BaseHybridOptions<undefined> = {
      limit: 5,
      returnReferences: [
        {
          linkOn: "hasRestaurant",
          returnProperties: ["name"],
        },
      ],
      // returnMetadata: ["distance"],
      returnMetadata: ["score", "explainScore"],
      queryProperties: [
        "menuName^3",
        "menuTag^2",
        "menuDescription",
        "cuisine",
        "flavor",
      ],

      // distance: 0.5,
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
      moveToConcepts.push(`portion ${input.portion}`);
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
      // queries.push(`restaurant ${input.query.restaurant.toLowerCase()}`);
      const includeRestaurants = await this.queryRestaurant(
        input.query.restaurant.toLocaleLowerCase()
      );

      // console.log(includeRestaurants);

      if (includeRestaurants.length !== 0) {
        filters.push(
          this.restaurantCollection.filter
            .byRef("hasRestaurant")
            .byId()
            .containsAny(includeRestaurants)
        );
      } else {
        return [];
      }
    }

    if (input.query.menu) {
      // queries.push(`menu with menuName ${input.query.menu.toLowerCase()}`);
      queries.push(`${input.query.menu.toLowerCase()}`);
    }

    if (input.query.flavor) {
      // queries.push(`flavor ${input.query.flavor.toLowerCase()}`);
      moveToConcepts.push(`flavor ${input.query.flavor.toLowerCase()}`);
    }

    if (input.query.cuisine) {
      // queries.push(`cuisine ${input.query.cuisine.toLowerCase()}`);
      moveToConcepts.push(`cuisine ${input.query.cuisine.toLowerCase()}`);
    }

    // handle exclusion
    if (input.exclusionQuery) {
      if (input.exclusionQuery.restaurant) {
        // moveAwayConcepts.push(
        //   `restaurant ${input.exclusionQuery.restaurant.toLowerCase()}`
        // );
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

    // options.vector = {};

    const query = queries.join(" ");

    // if (moveAwayConcepts.length > 0 || moveToConcepts.length > 0) {
    //   options.vector.query = query as any;
    // }

    // if (moveAwayConcepts.length > 0) {
    //   options.vector.moveAway = {
    //     force: 0.5,
    //     concepts: moveAwayConcepts,
    //   } as any;
    // }

    // if (moveToConcepts.length > 0) {
    //   options.vector.moveTo = {
    //     force: 0.5,
    //     concepts: moveToConcepts,
    //   } as any;
    // }

    console.log(`queries`);
    console.log(queries);
    console.log("options");
    console.log(options);

    return await this.collection.query.hybrid(query, options);
  }

  public async query(input: QueryInput) {
    return this.queryVector(input);
  }
}

(async function main() {
  const processor = new QueryProcessor();
  await processor.init();

  const names = [
    "espresso",
    "spaghetti",
    // "friedChicken",
    // "japaneseFood",
    // "ayamGoreng",
    // "onionRing",
    // "chickenWings",
  ];

  const vars: QueryInput[] = [
    espresso,
    spaghetti,
    // friedChicken,
    // japaneseFood,
    // ayamGoreng,
    // onionRing,
    // chickenWings,
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
