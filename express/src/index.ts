import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { ChatSchema } from "./validationSchema/chat";
import { getZodParsingErrorFields } from "./validationSchema/zod";
import { prisma } from "./lib/prisma";
import { parseHistory } from "../deprecate/history";
import { QuestionRephraser } from "./lib/ai/flows/questionRephraser";
import { HardLimitFinder } from "./lib/ai/flows/hardLimitFinder";
import envVar from "./envVar";
import { FoodFinderAgent } from "./lib/ai/graph";
import { convertStateToResponse } from "./lib/ai/utils/messageProcessing";
import { FeedbackSchema } from "./validationSchema/feedback";
import { queryClient } from "./lib/search/client";

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

app.post("/api/chat", async (req, res) => {
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

  const messageObject = bodyParsed.data;
  const { text, conversationId: conversationIdRaw } = messageObject;
  const newChat = !conversationIdRaw;
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

  return res.status(200).json({
    messages: aiMessage.map(({ content, role, conversationId }) => {
      return {
        ...(content as object),
        role,
        conversationId,
      };
    }),
  });
});

app.get("/api/messages/:conversationId", async (req, res) => {
  const conversationId = req.params.conversationId;
  if (!conversationId) {
    return res.status(400).json({ error: "Conversation id must exist." });
  }

  try {
    const result = await prisma.message.findMany({
      where: { conversationId: { equals: conversationId } },
      orderBy: {
        createdAt: "asc",
      },
    });
    return res.status(200).json({ messages: result });
  } catch (e) {
    return res.json({ error: e }).status(500);
  }
});

app.get("/api/message/:conversationId/:messageId", async (req, res) => {
  const conversationId = req.params.conversationId;
  const messageId = req.params.messageId;

  if (!messageId && !conversationId) {
    return res
      .status(400)
      .json({ error: "Message id and conversation id must exist." });
  }

  try {
    const result = await prisma.message.findFirst({
      where: { conversationId: { equals: conversationId }, id: messageId },
    });

    if (!result) {
      return res.status(400).json({ error: "No message found!" });
    }
    return res.status(200).json({ message: result });
  } catch (e) {
    return res.json({ error: e }).status(500);
  }
});

app.put("/api/feedback/:conversationId/:messageId", async (req, res) => {
  const conversationId = req.params.conversationId;
  const messageId = req.params.messageId;

  if (!messageId && !conversationId) {
    return res
      .status(400)
      .json({ error: "Message id and conversation id must exist." });
  }

  const message = await prisma.message.findFirst({
    where: { conversationId: { equals: conversationId }, id: messageId },
  });

  if (!message) {
    return res.status(400).json({ error: "Message does not exist." });
  }

  const bodyParsed = await FeedbackSchema.safeParseAsync(req.body);
  if (!bodyParsed.success) {
    const errorFields = getZodParsingErrorFields(bodyParsed);
    return res.status(400).json({
      message: "Invalid feedback format!",
      errorFields: errorFields,
    });
  }

  const { comment, isPositive, reason } = bodyParsed.data;

  const feedbackParsed = {
    comment: isPositive ? null : comment,
    reason: isPositive ? [] : reason ?? [],
    isPositive,
  };

  try {
    const result = await prisma.message.update({
      where: { id: messageId, conversationId: conversationId },
      data: {
        feedbackIsPositive: feedbackParsed.isPositive,
        feedbackComment: feedbackParsed.comment,
        feedbackReason: feedbackParsed.reason,
      },
    });

    return res.status(200).json({ message: result });
  } catch (e) {
    return res.json({ error: e }).status(500);
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running at http://0.0.0.0:${port}`);
  // queryClient.init() // todo enable this
});
