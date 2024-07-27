import { BaseMessage } from "@langchain/core/messages";
import { StateGraphArgs } from "@langchain/langgraph";

export const messageTypes = [
  "foodDescription",
  "smallTalk",
  "closing",
  "unrelatedInquiry",
] as const;

export type MessageType = (typeof messageTypes)[number];

export type HardLimitState = {
  price: {
    min: number | null;
    max: number | null;
  };
  dishType: ("food" | "drink")[];
  portionSize: number | null;
};

export type SoftLimitState = {
  restaurant: string | null;
  menu: string | null;
  cuisine: string | null;
  flavor: string | null;
};

// Define the state interface
export interface FoodFinderAgentState {
  messages: BaseMessage[];
  summary: string;
  messageType: MessageType[];
  hardLimitQuery: HardLimitState;
  softLimitQuery: SoftLimitState;
}

export const stateDefault: FoodFinderAgentState = {
  hardLimitQuery: {
    dishType: [],
    portionSize: null,
    price: {
      max: null,
      min: null,
    },
  },
  softLimitQuery: {
    cuisine: "",
    flavor: "",
    menu: "",
    restaurant: "",
  },
  messageType: [],
  messages: [],
  summary: "",
};

export type FoodFinderAgentStatePartial = Partial<FoodFinderAgentState>;

// Define the graph state
export const graphState: StateGraphArgs<FoodFinderAgentState>["channels"] = {
  messages: {
    reducer: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
    default: () => stateDefault.messages,
  },
  summary: {
    reducer: (x: string, y: string) => y || x,
    default: () => stateDefault.summary,
  },
  messageType: {
    reducer: (x: MessageType[], y: MessageType[]) => y,
    default: () => stateDefault.messageType,
  },
  hardLimitQuery: {
    reducer: (x: HardLimitState, y: HardLimitState) => y,
    default: () => stateDefault.hardLimitQuery,
  },
  softLimitQuery: {
    reducer: (x: SoftLimitState, y: SoftLimitState) => y,
    default: () => stateDefault.softLimitQuery,
  },
};
