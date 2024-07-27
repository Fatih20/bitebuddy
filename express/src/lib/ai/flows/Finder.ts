import { QueryProcessor } from "../../search/client";
import { FoodFinderAgentState, FoodFinderAgentStatePartial } from "../state";

export async function graphFinder(
  state: FoodFinderAgentState
): Promise<FoodFinderAgentStatePartial> {
  const queryProcessor = new QueryProcessor();
  queryProcessor.init();
  const result = await queryProcessor.query({
    query: state.softLimitQuery,
    dishType: state.hardLimitQuery.dishType,
    portion: state.hardLimitQuery.portionSize,
    price:
      !state.hardLimitQuery.price.max && !state.hardLimitQuery.price.min
        ? null
        : state.hardLimitQuery.price,
    exclusionQuery: {
      cuisine: null,
      flavor: null,
      menu: null,
      restaurant: null,
    },
  });

  return {
    queryOutput: result,
  };
}
