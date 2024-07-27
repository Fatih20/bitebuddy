export interface FinalData {
  restaurantId: string;
  restaurantCuisine: string[];
  restaurantTags: string[];
  restaurantName: string;
  menuId: string;
  menuName: string;
  menuDescription: string;
  menuSections: string[];
  menuPrice: number;
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
