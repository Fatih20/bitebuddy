import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { ChatSchema } from "./validation_schema/chat";
import { getZodParsingErrorFields } from "./validation_schema/zod";
import { prisma } from "./lib/prisma";
import { parseHistory } from "../deprecate/history";
import { QuestionRephraser } from "./lib/ai/flows/questionRephraser";
import { HardLimitFinder } from "./lib/ai/flows/hardLimitFinder";
import envVar from "./envVar";
import { FoodFinderAgent } from "./lib/ai/graph";
import { convertStateToResponse } from "./lib/ai/utils/messageProcessing";

const app = express();
const port = envVar.port;

// Middleware to enable CORS
app.use(cors());

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Middleware to parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/chat", async (req, res) => {
  const body = req.body;

  const bodyParsed = await ChatSchema.safeParseAsync(body);
  if (!bodyParsed.success) {
    const errorFields = getZodParsingErrorFields(bodyParsed);
    return res.status(400).json({
      message: "Invalid input.",
      errorFields: errorFields,
    });
  }

  let conversationId: string = "";
  let newChat = false;
  let parsedHistory: string = "";

  const messageObject = bodyParsed.data;
  const { text, conversationId: conversationIdRaw } = messageObject;
  newChat = !conversationIdRaw;
  console.log("Conversation Id accepted:", conversationIdRaw);
  if (!conversationIdRaw) {
    try {
      const { id } = await prisma.conversation.create({
        data: { summary: text },
      });
      conversationId = id;
      await prisma.message.create({
        data: {
          content: {
            type: "text",
            text,
          },
          role: "user",
          conversationId,
        },
      });
      parsedHistory = `User: ${text}`;
    } catch (e) {
      return res.json({ error: e }).status(500);
    }
  } else {
    conversationId = conversationIdRaw;
    await prisma.message.create({
      data: {
        content: {
          type: "text",
          text: text,
        },
        role: "user",
        conversationId,
      },
    });
  }

  const foodFinderAgent = FoodFinderAgent.getInstance();

  const result = await foodFinderAgent.find(
    {
      messageObject: [{ text, type: "text", role: "human" }],
    },
    conversationId
  );

  const insertedMessage = convertStateToResponse(result, conversationId);

  const aiMessage = await prisma.message.createManyAndReturn({
    data: insertedMessage,
  });

  return res.status(200).json(aiMessage);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
