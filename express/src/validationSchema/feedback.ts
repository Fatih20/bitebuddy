import { z } from "zod";

export const FeedbackSchema = z.object({
  isPositive: z.boolean().nullable(),
  reason: z.array(z.string()).nullable(),
  comment: z.string().nullable(),
});
