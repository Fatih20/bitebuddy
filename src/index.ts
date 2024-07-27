import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { ChatSchema } from "./validation_schema/chat";
import { getZodParsingErrorFields } from "./validation_schema/zod";
import { prisma } from "./lib/prisma";
import { parseHistory } from "./lib/history";
import { Summarizer } from "./lib/ai/flows/summarizer";
import { QuestionRephraser } from "./lib/ai/flows/questionRephraser";
import { HardLimitFinder } from "./lib/ai/flows/hardLimitFinder";
import envVar from "./envVar";

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

  const { message, conversationId: conversationIdRaw } = bodyParsed.data;
  newChat = !conversationIdRaw;
  console.log(conversationIdRaw);
  if (!conversationIdRaw) {
    try {
      const { id } = await prisma.conversation.create({
        data: { summary: message },
      });
      conversationId = id;
      await prisma.message.create({
        data: {
          content: {
            type: "text",
            text: message,
          },
          role: "user",
          conversationId,
        },
      });
      parsedHistory = `User: ${message}`;
    } catch (e) {
      return res.json({ error: e }).status(500);
    }
  } else {
    conversationId = conversationIdRaw;
    await prisma.message.create({
      data: {
        content: {
          type: "text",
          text: message,
        },
        role: "user",
        conversationId,
      },
    });
    const history = await prisma.message.findMany({
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true },
      where: { conversationId: { equals: conversationId } },
    });
    parsedHistory = parseHistory(history).join("\n");
  }

  const summarizer = await Summarizer.getInstance();
  const rephraser = await QuestionRephraser.getInstance();
  const hardLimitFinder = await HardLimitFinder.getInstance();

  const summary = await summarizer.summarize({ chat_history: parsedHistory });
  console.log("Summary: ", summary);
  const rephrasedQuestion = await rephraser.rephraseQuestion({
    user_preference: summary,
  });
  console.log("Rephrased question: ", rephrasedQuestion);
  const hardLimits = await hardLimitFinder.findHardLimit({
    food_description: rephrasedQuestion,
  });
  console.log("Hard limits: ", hardLimits);

  const aiMessage = await prisma.message.create({
    data: {
      content: {
        type: "text",
        text: "Saya catat dulu.",
      },
      role: "ai",
      conversationId,
    },
  });

  return res.status(200).json(aiMessage);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
