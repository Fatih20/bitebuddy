import { z } from "zod";

export const ChatSchema = z.object({
  message: z
    .string({ message: "Message is mandatory!" })
    .min(1, { message: "Message must not be an empty string" }),
  conversationId: z.string().optional(),
});
