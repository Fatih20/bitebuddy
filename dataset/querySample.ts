import { QueryInput } from "./type.ts";

export const friedChicken: QueryInput = {
  query: {
    menu: "fried chicken",
    flavor: "spicy",
  },
  exclusionQuery: {
    flavor: "sweet",
  },
  price: {
    max: 200000,
  },
};

export const martabakAsin: QueryInput = {
  query: {
    menu: "martabak",
    flavor: "salty",
  },
  exclusionQuery: {
    menu: "roti bakar",
  },
};

export const martabakManis: QueryInput = {
  query: {
    menu: "martabak",
    flavor: "sweet",
  },
  exclusionQuery: {
    restaurant: "pecenongan",
    menu: "roti bakar",
  },
  price: {
    max: 60000,
  },
};

export const martabakFaulty: QueryInput = {
  query: {
    menu: "martabak",
    restaurant: "pecenongan",
    flavor: "sweet",
  },
  exclusionQuery: {
    restaurant: "pecenongan",
    menu: "roti bakar",
  },
  price: {
    max: 6000000,
  },
};

export const rotiBakar: QueryInput = {
  query: {
    menu: "roti bakar",
    flavor: "sweet",
  },
  exclusionQuery: {
    menu: "roti",
  },
  price: {
    min: 100000,
  },
};

export const bebas: QueryInput = {
  query: {
    cuisine: "Indonesian",
  },
};

export const makananSpesifik: QueryInput = {
  query: {
    restaurant: "mie gacoan",
    menu: "mie suit",
  },
};

export const yangPentingBrazil: QueryInput = {
  query: {
    cuisine: "italian",
  },
};

export const japaneseShushi: QueryInput = {
  query: {
    menu: "sushi",
    cuisine: "japanese",
  },
};

export const espresso: QueryInput = {
  dishType: ["drink"],
  query: {
    menu: "espresso",
  },
};
