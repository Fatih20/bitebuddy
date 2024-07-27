import weaviate, {
  BaseBm25Options,
  BaseHybridOptions,
  Collection,
  Filters,
  FilterValue,
  WeaviateClient,
} from "weaviate-client";
import { QueryInput } from "./types";

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

  public async query(input: QueryInput) {
    return this.queryExact(input);
  }
}

export const queryClient = new QueryProcessor();
