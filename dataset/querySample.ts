import { QueryInput } from "./type.ts";

export const espresso: QueryInput = {
  dishType: ["drink"],
  exclusionQuery: {
    menu: "latte",
  },
  query: {
    menu: "espresso only",
  },
};

export const spaghetti: QueryInput = {
  dishType: ["food"],
  query: {
    menu: "spaghetti carbonara",
  },
};

export const friedChicken: QueryInput = {
  dishType: ["food"],
  query: {
    menu: "fried chicken",
    flavor: "spicy",
    restaurant: "hangry",
  },
};

export const japaneseFood: QueryInput = {
  dishType: ["food"],
  query: {
    menu: "sushi",
    cuisine: "japanese",
  },
};

export const ayamGoreng: QueryInput = {
  dishType: ["food"],
  query: {
    menu: "fried chicken",
  },
  exclusionQuery: {
    flavor: "spicy",
    cuisine: "chinese",
  },
  price: {
    max: 50000,
  },
};

export const onionRing: QueryInput = {
  dishType: ["food"],
  query: {
    menu: "onion ring",
  },
  portion: 4,
};

export const chickenWings: QueryInput = {
  dishType: ["food"],
  query: {
    menu: "chicken wings",
    flavor: "spicy",
  },
  portion: 4,
};

export const martabakTelor: QueryInput = {
  dishType: ["food"],
  query: {
    menu: "martabak telor",
    flavor: "savory",
  },
};

export const mcd: QueryInput = {
  dishType: ["food"],
  query: {
    restaurant: "McDonald",
  },
};
