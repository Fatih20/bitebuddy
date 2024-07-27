import weaviate, { DataObject } from "weaviate-client";
import fs from "fs/promises";
import { ActuallyFinal } from "./type.ts";

const COLLECTION_NAME = "Menu";

(async function main() {
  const client = await weaviate.connectToLocal();

  console.log("old deleted");

  await client.collections.delete(COLLECTION_NAME);

  await client.collections.create({
    name: COLLECTION_NAME,
  });

  const raw = await fs.readFile("cleaned.json", { encoding: "utf-8" });

  const parsed = JSON.parse(raw) as ActuallyFinal[];

  const convertedData = parsed.map((each) => {
    return {
      properties: each,
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
