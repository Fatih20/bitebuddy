import { BaseMessage } from "@langchain/core/messages";

export const messageTypes = [
  "foodDescription",
  "smallTalk",
  "closing",
  "unrelatedInquiry",
] as const;

export type MessageType = (typeof messageTypes)[number];

// Define the state interface
export interface FoodFinderAgentState {
  messages: BaseMessage[];
  summary: string;
  messageType: MessageType[];
}

export type FoodFinderAgentStatePartial = Partial<FoodFinderAgentState>;
