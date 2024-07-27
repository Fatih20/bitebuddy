import { ActuallyFinal, FinalData, FinalDataCsv } from "./type.ts";
import { parse } from "csv-parse/sync";
import fs from "fs/promises";
import { convertData } from "./common.ts";

function cleanData(data: FinalData): ActuallyFinal {
  const tags = data.menuTag.map((e) => e.toLocaleLowerCase());
  const keywords = data.associatedKeywords.map((e) => e.toLocaleLowerCase());
  const dishType = data.dishType.map((e) => e.toLocaleLowerCase());
  const cuisine = data.cuisine.split(",").map((e) => e.toLocaleLowerCase());

  return {
    restaurantName: data.restaurantName.toLowerCase(),
    menuName: data.menuName.toLowerCase(),
    menuDescription: data.menuDescription.toLocaleLowerCase(),
    menuPrice: data.menuPrice,
    menuTag: [...tags, ...keywords],
    dishType,
    cuisine,
    flavor: data.flavor.map((e) => e.toLocaleLowerCase()),
    portion: parseInt(data.portion),
  };
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

  console.log(`initial data length ${parsed.length}`);

  const data = parsed
    .map((e) => cleanData(convertData(e)))
    .filter((e) => {
      if (e.dishType.includes("non-food") || e.dishType.includes("n/a")) {
        return false;
      }

      return true;
    });

  console.log(`final data length ${data.length}`);

  await fs.writeFile("cleaned.json", JSON.stringify(data), {
    encoding: "utf-8",
  });
})();
