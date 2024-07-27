import weaviate, { DataObject } from "weaviate-client";
import { generateUuid5 } from "weaviate-client";
import { parse } from "csv-parse/sync";
import fs from "fs/promises";
import { FinalData, FinalDataCsv } from "./type.ts";
import { z } from "zod";

const COLLECTION_NAME = "Menu";

const QueryInputSchema = z.object({
  softAttributes: z
    .object({})
    .optional()
    .describe("Attributes that is soft filtered by vector similarity"),
  hardAttributes: z
    .object({
      price: z
        .object({
          min: z.number().optional().describe("Minimum price limit"),
          max: z.number().optional().describe("Maximum price limit"),
        })
        .optional()
        .describe("Query price parameters"),
      dishType: z
        .enum(["food", "drink"])
        .array()
        .optional()
        .describe("Dish type, could be `food`, `drink`, or both"),
      portion: z
        .object({
          min: z.number().optional().describe("Minimum portion size"),
          max: z.number().optional().describe("Maximum portion size"),
        })
        .optional(),
    })
    .optional()
    .describe("Attributes that is hard filtered by value"),
});

(async function main() {
  const client = await weaviate.connectToLocal();

  const collection = await client.collections.get(COLLECTION_NAME);

  collection.query.nearText("what", {
    // moveAway: {},
  });
})();
