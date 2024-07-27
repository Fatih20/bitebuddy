import { ChatAnthropic } from "@langchain/anthropic";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

import { traceable } from "langsmith/traceable";
import { wrapSDK } from "langsmith/wrappers";
import { Runnable, RunnableConfig } from "@langchain/core/runnables";
import envVar from "../../../envVar";
import {
  CompiledStateGraph,
  END,
  MemorySaver,
  START,
  StateGraph,
  StateGraphArgs,
} from "@langchain/langgraph";

interface AgentStateMessage {
  role: "ai" | "user";
  content: object;
}

interface AgentState {
  messages: AgentStateMessage[];
  summary: string;
}

// Define the graph state
const graphState: StateGraphArgs<AgentState>["channels"] = {
  messages: {
    value: (x: AgentStateMessage[], y: AgentStateMessage[]) => x.concat(y),
    default: () => [],
  },
  summary: {
    reducer: (a: string, b: string) => b,
    default: () => "",
  },
};

export class FoodFinder {
  private static instance: FoodFinder;
  private app: CompiledStateGraph<
    AgentState,
    Partial<Record<keyof AgentState, any>>,
    "__start__" | "llm"
  >;

  private constructor() {
    const llm = wrapSDK(
      new ChatAnthropic({
        model: "claude-3-5-sonnet-20240620",
        temperature: 0.4,
        anthropicApiKey: envVar.anthropicAPIKey,
      })
    );

    console.log("Constructing prompt template");

    const promptTemplate = PromptTemplate.fromTemplate("");

    console.log("Constructing chains");

    const chain = promptTemplate.pipe(llm).pipe(new StringOutputParser());

    async function callLLM(state: AgentState) {
      const result = await chain.invoke({});

      return { messages: [result] };
    }

    const workflow = new StateGraph<AgentState>({ channels: graphState })
      .addNode("llm", callLLM)
      .addEdge(START, "llm")
      .addEdge("llm", END);

    const checkpointer = new MemorySaver();

    const app = workflow.compile({ checkpointer });
    this.app = app;
  }

  static async getInstance() {
    if (!FoodFinder.instance) {
      console.log("Constructing the summarizer");
      FoodFinder.instance = new FoodFinder();
      console.log("Constructed the summarizer");
    }
    return FoodFinder.instance;
  }

  public async findUnwrapped(input: {}, app: typeof this.app) {
    return await app.invoke(input);
  }

  public async find(input: {}) {
    return traceable(this.findUnwrapped, { name: "Food Finder" })(
      input,
      this.app
    );
  }
}
