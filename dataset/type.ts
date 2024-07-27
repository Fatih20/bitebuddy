import { z } from "zod";

export interface FinalData {
  restaurantId: string;
  restaurantCuisine: string[];
  restaurantTags: string[];
  restaurantName: string;
  menuId: string;
  menuName: string;
  menuDescription: string;
  menuSections: string[];
  menuPrice: string;
  menuTag: string[];
  dishType: string[];
  menuType: string;
  cuisine: string;
  associatedKeywords: string[];
  flavor: string[];
  mealTime: string[];
  occasion: string;
  portion: string;
}

export interface FinalDataCsv {
  restaurantId: string;
  restaurantCuisine: string;
  restaurantTags: string;
  restaurantName: string;
  menuId: string;
  menuName: string;
  menuDescription: string;
  menuSections: string;
  menuPrice: number;
  menuTag: string;
  dishType: string;
  menuType: string;
  cuisine: string;
  associatedKeywords: string;
  flavor: string;
  mealTime: string;
  occasion: string;
  portion: string;
}

export interface ActuallyFinal {
  restaurantName: string;
  menuName: string;
  menuDescription: string;
  menuPrice: number;
  menuTag: string[];
  dishType: string[];
  cuisine: string[];
  flavor: string[];
  portion: number;
}

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
