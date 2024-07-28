import { FoodMessage } from "./api/MessageReturn";

export enum ChatType {
  TEXT = "text",
  FOOD = "foods",
  WAIT = "wait",
  QUICK = "quick",
}

export type Chat = {
  type: string;
  isUser?: boolean;
  text?: string;
  foods?: FoodMessage[];
  quickChats?: string[];
  messageId?: string;
};
