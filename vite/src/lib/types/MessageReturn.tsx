export type FoodMessage = {
  restaurantId: string;
  restaurantName: string;
  menuId: string;
  menuName: string;
  menuPrice: string;
  menuSections: string;
};

type MessageReturn = (
  | {
      type: "foods";
      foods: FoodMessage[];
    }
  | {
      type: "text";
      text: string;
    }
)[];