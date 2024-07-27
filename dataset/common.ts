import { FinalData, FinalDataCsv } from "./type.ts";

export function convertData(data: FinalDataCsv): FinalData {
  return {
    ...data,
    restaurantCuisine: data.restaurantCuisine.split(","),
    restaurantTags: data.restaurantCuisine.split(","),
    menuSections: data.restaurantCuisine.split(","),
    menuTag: data.menuTag.split(","),
    dishType: data.dishType.split(","),
    associatedKeywords: data.associatedKeywords.split(","),
    flavor: data.flavor.split(","),
    mealTime: data.mealTime.split(","),
  };
}
