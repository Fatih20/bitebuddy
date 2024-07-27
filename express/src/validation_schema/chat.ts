import { z } from "zod";

export const ChatSchema = z.object({
  type: z.literal("text"),
  text: z.string({ required_error: "Text required!" }),
  conversationId: z.string().optional(),
});
