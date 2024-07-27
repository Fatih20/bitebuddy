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
import { graphFinalProcess } from "./flows/FinalProcessor";
import {
  graphMessageTypeClassifier,
  graphMessageTypeRouter,
} from "./flows/MessageTypeClassifier";
import { graphAnswerUnrelatedInquiry } from "./flows/UnrelatedInquiryAnswerer";
import { graphAnswerGreetings } from "./flows/GreetingsAnswerer";
import { MessageIntermediate } from "./utils/messageProcessing";
import { FoodFinderAgentState, graphState, stateDefault } from "./state";
import { graphFindLimit } from "./flows/LimitFinder";

export class FoodFinderAgent {
  private static instance: FoodFinderAgent;
  private app: CompiledStateGraph<
    FoodFinderAgentState,
    Partial<Record<keyof FoodFinderAgentState, any>>,
    | "__start__"
    | "Summarizer"
    | "AnswerGreetings"
    | "AnswerUnrelatedInquiry"
    | "LimitFinder"
    | "FinalProcessor"
    | "MessageTypeClassifier"
  >;

  private constructor() {
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
      .addNode("FinalProcessor", graphFinalProcess)
      .addNode("MessageTypeClassifier", graphMessageTypeClassifier)
      .addNode("LimitFinder", graphFindLimit)
      .addEdge(START, "MessageTypeClassifier")
      .addConditionalEdges("MessageTypeClassifier", graphMessageTypeRouter)
      .addEdge("Summarizer", "LimitFinder")
      .addEdge("LimitFinder", "FinalProcessor")
      .addEdge("FinalProcessor", END)
      .addEdge("AnswerGreetings", END)
      .addEdge("AnswerUnrelatedInquiry", END);

    const checkpointer = new MemorySaver();

    const app = workflow.compile({ checkpointer });
    this.app = app;
  }

  static getInstance() {
    if (!FoodFinderAgent.instance) {
      console.log("Constructing the finder agent");
      FoodFinderAgent.instance = new FoodFinderAgent();
      console.log("Constructed the finder agent");
    }
    return FoodFinderAgent.instance;
  }

  private async findUnwrapped(
    input: FoodFinderAgentState,
    app: typeof this.app,
    conversationId: string
  ) {
    return (await app.invoke(input, {
      configurable: { threadId: conversationId },
    })) as FoodFinderAgentState;
  }

  public async find(
    input: { messageObject: MessageIntermediate },
    conversationId: string
  ) {
    const addedMessage = new HumanMessage(JSON.stringify(input.messageObject));
    return traceable(this.findUnwrapped, { name: "Food Finder" })(
      {
        messages: [addedMessage],
        summary: stateDefault.summary,
        messageType: stateDefault.messageType,
        hardLimitQuery: stateDefault.hardLimitQuery,
        softLimitQuery: stateDefault.softLimitQuery,
      },
      this.app,
      conversationId
    );
  }
}
