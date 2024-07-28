export type FoodMessage = {
  restaurantName: string;
  menuDescription: string;
  menuName: string;
  menuPrice: number;
  menuSections: string;
  portion: number;
};

export type MessageReturn = (
  | {
      type: "foods";
      foods: FoodMessage[];
    }
  | {
      type: "text";
      text: string;
    }
)[];
