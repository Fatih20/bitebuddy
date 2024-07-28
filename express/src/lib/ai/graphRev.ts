import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { ChatAnthropic } from "@langchain/anthropic";
import {
  CompiledStateGraph,
  END,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph";
import { wrapSDK } from "langsmith/wrappers";
import envVar from "../../envVar";
import { traceable } from "langsmith/traceable";
import { graphSummarize } from "./flows/Summarizer";
import { graphFinalProcessor } from "./flows/FinalProcessor";
import {
  graphMessageTypeClassifier,
  graphMessageTypeRouter,
} from "./flows/MessageTypeClassifier";
import { graphAnswerUnrelatedInquiry } from "./flows/UnrelatedInquiryAnswerer";
import { graphAnswerGreetings } from "./flows/GreetingsAnswerer";
import { MessageIntermediate } from "./utils/messageProcessing";
import { FoodFinderAgentState, graphState, stateDefault } from "./state";
import { graphFindLimit } from "./flows/LimitFinder";
import { graphFinder } from "./flows/Finder";
import { graphFinalSelector } from "./flows/FinalSelector";
import { graphSuggest as graphSuggester } from "./flows/Suggester";

const llm = wrapSDK(
  new ChatAnthropic({
    model: "claude-3-5-sonnet-20240620",
    temperature: 0.4,
    anthropicApiKey: envVar.anthropicAPIKey,
  })
);

// Create the workflow
const workflow = new StateGraph<FoodFinderAgentState>({
  channels: graphState,
})
  .addNode("Summarizer", graphSummarize)
  .addNode("AnswerGreetings", graphAnswerGreetings)
  .addNode("AnswerUnrelatedInquiry", graphAnswerUnrelatedInquiry)
  .addNode("MessageTypeClassifier", graphMessageTypeClassifier)
  .addNode("LimitFinder", graphFindLimit)
  .addNode("Finder", graphFinder)
  .addNode("FinalSelector", graphFinalSelector)
  .addNode("FinalProcessor", graphFinalProcessor)
  .addNode("Suggester", graphSuggester)
  .addEdge(START, "MessageTypeClassifier")
  .addConditionalEdges("MessageTypeClassifier", graphMessageTypeRouter)
  .addEdge("Summarizer", "LimitFinder")
  .addEdge("LimitFinder", "Finder")
  .addEdge("Finder", "FinalSelector")
  .addEdge("FinalSelector", "FinalProcessor")
  .addEdge("FinalProcessor", END)
  .addEdge("AnswerGreetings", END)
  .addEdge("AnswerUnrelatedInquiry", END)
  .addEdge("Suggester", END);

const checkpointer = new MemorySaver();

export const appConstructed = workflow.compile({ checkpointer });

export async function findUnwrapped(
  input: FoodFinderAgentState,
  app: typeof appConstructed,
  conversationId: string
) {
  console.log("In findUnwrapped.");
  console.log("Running with conversationId: ", conversationId);
  return (await app.invoke(input, {
    configurable: { threadId: conversationId },
  })) as FoodFinderAgentState;
}

export async function find(
  input: { messageObject: MessageIntermediate },
  conversationId: string
) {
  const addedMessage = new HumanMessage(JSON.stringify(input.messageObject));
  return traceable(findUnwrapped, { name: "Food Finder" })(
    {
      messages: [addedMessage],
      summary: stateDefault.summary,
      messageType: stateDefault.messageType,
      hardLimitQuery: stateDefault.hardLimitQuery,
      softLimitQuery: stateDefault.softLimitQuery,
      finalSelection: stateDefault.finalSelection,
      queryOutput: stateDefault.queryOutput,
      exclusion: stateDefault.exclusion,
    },
    appConstructed,
    conversationId
  );
}
