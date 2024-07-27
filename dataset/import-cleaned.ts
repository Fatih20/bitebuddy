import weaviate, { DataObject, dataType, generateUuid5 } from "weaviate-client";
import fs from "fs/promises";
import { ActuallyFinal } from "./type.ts";

const COLLECTION_NAME = "Menu";
const RESTAURANT_COLLECTION = "Restaurant";

(async function main() {
  const client = await weaviate.connectToLocal();

  console.log("old deleted");

  await client.collections.delete(COLLECTION_NAME);
  await client.collections.delete(RESTAURANT_COLLECTION);

  await client.collections.create({
    name: RESTAURANT_COLLECTION,
  });

  await client.collections.create({
    name: COLLECTION_NAME,
    references: [
      {
        name: "hasRestaurant",
        targetCollection: RESTAURANT_COLLECTION,
      } as any,
    ],
  });

  const raw = await fs.readFile("cleaned.json", { encoding: "utf-8" });

  const parsed = JSON.parse(raw) as ActuallyFinal[];

  const restaurantSet = new Set<string>();

  parsed.forEach((each) => {
    restaurantSet.add(each.restaurantName);
  });

  const restaurantCollection = client.collections.get(RESTAURANT_COLLECTION);

  const restaurantData = [...restaurantSet.values()].map((each) => {
    return {
      properties: {
        name: each,
      },
      id: generateUuid5(RESTAURANT_COLLECTION, each),
    };
  }) as unknown as DataObject<undefined>[];

  await restaurantCollection.data.insertMany(restaurantData);

  const convertedData = parsed.map(({ restaurantName, ...each }) => {
    return {
      properties: each,
      references: {
        hasRestaurant: generateUuid5(RESTAURANT_COLLECTION, restaurantName),
      },
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
