import { queryClient } from "../../search/client";
import { FoodFinderAgentState, FoodFinderAgentStatePartial } from "../state";

export async function graphFinder(
  state: FoodFinderAgentState
): Promise<FoodFinderAgentStatePartial> {
  const result = await queryClient.query({
    query: state.softLimitQuery,
    dishType: state.hardLimitQuery.dishType,
    portion: state.hardLimitQuery.portionSize,
    price:
      !state.hardLimitQuery.price.max && !state.hardLimitQuery.price.min
        ? null
        : state.hardLimitQuery.price,
    exclusionQuery: state.exclusion,
  });

  return {
    queryOutput: result,
  };
}
