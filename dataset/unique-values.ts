import { FinalDataCsv } from "./type.ts";
import { parse } from "csv-parse/sync";
import fs from "fs/promises";
import { convertData } from "./common.ts";

function setArrayAdd(set: Set<string>, values: string[] | string) {
  if (Array.isArray(values)) {
    values.forEach((val) => {
      set.add(val);
    });
  } else {
    set.add(values);
  }
}

(async function main() {
  const raw = await fs.readFile("dataset.csv", { encoding: "utf-8" });

  const parsed = parse(raw as string, {
    delimiter: ";",
    relaxQuotes: true,
    columns: [
      "restaurantId",
      "restaurantCuisine",
      "restaurantTags",
      "restaurantName",
      "menuId",
      "menuName",
      "menuDescription",
      "menuSections",
      "menuPrice",
      "menuTag",
      "dishType",
      "menuType",
      "cuisine",
      "associatedKeywords",
      "flavor",
      "mealTime",
      "occasion",
      "portion",
    ],
  }) as FinalDataCsv[];

  parsed.shift();

  const data = parsed.map((e) => convertData(e));

  const restaurantCuisine = new Set<string>();
  const restaurantTags = new Set<string>();
  const menuSections = new Set<string>();
  const menuTag = new Set<string>();
  const dishType = new Set<string>();
  const menuType = new Set<string>();
  const cuisine = new Set<string>();
  const associatedKeywords = new Set<string>();
  const flavor = new Set<string>();
  const mealTime = new Set<string>();
  const occasion = new Set<string>();

  data.forEach((e) => {
    setArrayAdd(restaurantCuisine, e.restaurantCuisine);
    setArrayAdd(restaurantTags, e.restaurantTags);
    setArrayAdd(menuSections, e.menuSections);
    setArrayAdd(menuTag, e.menuTag);
    setArrayAdd(dishType, e.dishType);
    setArrayAdd(menuType, e.menuType);
    setArrayAdd(cuisine, e.cuisine);
    setArrayAdd(associatedKeywords, e.associatedKeywords);
    setArrayAdd(flavor, e.flavor);
    setArrayAdd(mealTime, e.mealTime);
    setArrayAdd(occasion, e.occasion);
  });

  const result = {
    restaurantCuisine: [...restaurantCuisine.values()],
    restaurantTags: [...restaurantTags.values()],
    menuSections: [...menuSections.values()],
    menuTag: [...menuTag.values()],
    dishType: [...dishType.values()],
    menuType: [...menuType.values()],
    cuisine: [...cuisine.values()],
    associatedKeywords: [...associatedKeywords.values()],
    flavor: [...flavor.values()],
    mealTime: [...mealTime.values()],
    occasion: [...occasion.values()],
  };

  await fs.writeFile("unique-values.json", JSON.stringify(result), {
    encoding: "utf-8",
  });
})();
