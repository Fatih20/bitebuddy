import { FoodMessage } from "./api/MessageReturn";

export enum ChatType {
  TEXT = "text",
  FOOD = "foods"
}

export type Chat = {
    type: string,
    isUser: boolean
    text?: string,
    foods?: FoodMessage[],
}