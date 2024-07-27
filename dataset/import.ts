import weaviate, { DataObject } from "weaviate-client";
import { generateUuid5 } from "weaviate-client";
import { parse } from "csv-parse/sync";
import fs from "fs/promises";
import { FinalData, FinalDataCsv } from "./type.ts";

const COLLECTION_NAME = "Menu";

function convertData(data: FinalDataCsv): FinalData {
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

(async function main() {
  const client = await weaviate.connectToLocal();

  console.log("old deleted");

  await client.collections.delete(COLLECTION_NAME);

  await client.collections.create({
    name: COLLECTION_NAME,
  });

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

  const convertedData = parsed.map((each) => {
    return {
      properties: convertData(each),
      id: generateUuid5(COLLECTION_NAME, each.menuId),
    };
  }) as unknown as DataObject<undefined>[];

  const myCollection = client.collections.get(COLLECTION_NAME);

  const length = convertedData.length;
  const batchSize = 50;
  const batchCount = Math.ceil(length / batchSize);

  let imported = 0;

  for (let i = 0; i < batchCount; i++) {
    const slice = convertedData.slice(
      i * batchSize,
      Math.min((i + 1) * batchSize, length)
    );
    await myCollection.data.insertMany(slice);
    imported += slice.length;

    console.log(`Data imported ${imported}`);
  }
})();
