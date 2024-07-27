import { z } from "zod";

export const QueryInputSchema = z.object({
  query: z
    .object({
      restaurant: z.string().optional().describe("Query for restaurant"),
      menu: z
        .string()
        .optional()
        .describe(
          "Query for menu. This will search based on menuName, menuDescription, and menuTag"
        ),
      cuisine: z
        .string()
        .optional()
        .describe(
          "Query for cuisine. This will search menu based on preferred cuisines"
        ),
      flavor: z
        .string()
        .optional()
        .describe(
          "Query for flavor. This will search menu based on preferred base flavor"
        ),
    })
    .describe("Query for restaurant, menu, cuisine, and flavor properties"),
  exclusionQuery: z
    .object({
      restaurant: z
        .string()
        .optional()
        .describe("Exclusion query for restaurant"),
      menu: z
        .string()
        .optional()
        .describe(
          "Exclusion query for menu. This will search based on menuName, menuDescription, and menuTag"
        ),
      cuisine: z
        .string()
        .optional()
        .describe(
          "Exclusion query for cuisine. This will search menu based on preferred cuisines"
        ),
      flavor: z
        .string()
        .optional()
        .describe(
          "Exclusion query for flavor. This will search menu based on preferred base flavor"
        ),
    })
    .optional()
    .describe(
      "Exclusion query for restaurant, menu, cuisine, and flavor properties"
    ),
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
  portion: z.number().min(1).optional().describe("Preferred portion size"),
});

export type QueryInput = z.infer<typeof QueryInputSchema>;

export const QueryResultSchema = z.object({
  menuName: z.string(),
  menuDescription: z.string(),
  menuPrice: z.number(),
  portion: z.number(),
  restaurantName: z.string(),
});

export type QueryResult = z.infer<typeof QueryResultSchema>;

export const QueryOutputSchema = z.object({
  data: QueryResultSchema.array(),
  message: z.string().nullable(),
});

export type QueryOutput = z.infer<typeof QueryOutputSchema>;
