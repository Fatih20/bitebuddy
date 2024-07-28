import { AIMessage, BaseMessage } from "@langchain/core/messages";
import { FoodFinderAgentState } from "../state";
import { $Enums, Prisma } from "@prisma/client";

export type FoodMessage = {
  restaurantId: string;
  restaurantName: string;
  menuId: string;
  menuName: string;
  menuPrice: string;
  menuSections: string;
};

export type MessageIntermediateRole = "ai" | "human";

type MessageIntermediateFood = {
  type: "foods";
  foods: FoodMessage[];
  role: MessageIntermediateRole;
};

type MessageIntermediateText = {
  type: "text";
  text: string;
  role: MessageIntermediateRole;
};

export type MessageIntermediate = (
  | MessageIntermediateText
  | MessageIntermediateFood
)[];

export function parseHistory(messages: MessageIntermediate[]): string {
  const flattenedMessages = messages.flat(1);

  // console.log("Flattened messages:");
  // console.log(flattenedMessages);

  const messageString = flattenedMessages.map((message) => {
    const role =
      message.role === "ai"
        ? "Assistant"
        : message.role === "human"
        ? "User"
        : "";
    if (message.type === "text") {
      return `${role}: ${message.text}`;
    } else if (message.type === "foods") {
      return convertMessageIntermediateFood(message);
    } else {
      return "";
    }
  });

  return messageString.join("\n");
}

export function convertMessageIntermediateFood(
  message: MessageIntermediateFood
) {
  const foods = message.foods;
  const foodRepresentations = foods.map(
    ({ menuName, menuPrice, menuSections, restaurantId, restaurantName }) => {
      return `
        ${
          restaurantName === undefined
            ? ``
            : `Restaurant name: ${restaurantName}`
        }
        Food name: ${menuName}
        ${menuPrice === undefined ? `` : `Menu price: ${menuPrice}`}
        Price: ${menuPrice}
        ${
          menuSections === undefined
            ? ``
            : `Menu section in restaurant: ${menuSections}`
        }
        `;
    }
  );
  const role =
    message.role === "ai"
      ? "Assistant"
      : message.role === "human"
      ? "User"
      : "";
  return `${role}: Below are my food recommendation. 
  ${foodRepresentations.join("----\n")}`;
}

export function getUserLastMessageString(message: MessageIntermediate) {
  // console.log("In Graph getUserLastMessageString. Message:");
  // console.log(message);
  const lastMessage = message[(message.length - 1).toString() as any];
  // console.log("In Graph getUserLastMessageString. Last Message:");
  // console.log(lastMessage);
  if (lastMessage.type === "foods" || lastMessage.role === "ai") {
    throw new Error(
      "Get user last message found food message as the last message"
    );
  }

  return lastMessage.text;
}

export function getMessageIntermediates(messages: BaseMessage[]) {
  const messagesIntermediate: MessageIntermediate[] = messages.map(
    (baseMessage) => {
      const role = baseMessage._getType();
      const content = JSON.parse(
        baseMessage.content as string
      ) as MessageIntermediate;
      const contentParsed = content.map((content) => {
        return {
          ...content,
          role,
        };
      });
      return contentParsed as MessageIntermediate;
    }
  );

  // console.log("getMessageIntermediates.Message Intermediate: ");
  // console.log(messagesIntermediate);
  // .map((processedMessage) => {
  //   return {
  //     ...processedMessage.content,
  //     role: processedMessage.role,
  //   } as MessageIntermediate;
  // });

  return messagesIntermediate;
}

export function convertTextToMessage(content: string) {
  return new AIMessage(
    JSON.stringify([
      {
        type: "text",
        text: content,
      },
    ])
  );
}

export function convertStateToResponse(
  state: FoodFinderAgentState,
  conversationId: string
): Prisma.MessageCreateManyInput[] {
  const lastMessage = state.messages[state.messages.length - 1];
  // console.log("In convertStateToResponse. Last Message: ");
  // console.log(lastMessage);

  const lastMessageParsed = getMessageIntermediates([lastMessage])[0];
  // console.log("In convertStateToResponse. Last Message Parsed: ");
  // console.log(lastMessageParsed);

  const messages = getMessageIntermediates([lastMessage])[0].flat(1);
  // console.log("In convertStateToResponse. Messages: ");
  // console.log(messages);

  const result = messages.map((message) => {
    return {
      content: message,
      role: message.role === "human" ? ("user" as const) : ("ai" as const),
      conversationId,
    };
  });

  return result;
}
