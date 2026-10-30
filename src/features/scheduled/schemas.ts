import { z } from "zod";
import {
  classField,
  resolveStream,
  streamField,
  titleField,
} from "@/features/content/schemas";
import type { ValidationKey } from "@/features/profile/schemas";
import { parseIstLocal } from "@/lib/schedule";

const key = <K extends ValidationKey>(value: K) => value;

export const MAX_SCHEDULED_QUESTIONS = 100;

export const scheduledTestFormSchema = z
  .object({
    title: titleField,
    class: classField,
    stream: streamField,
    /** From `<input type="datetime-local">`, read as India time. */
    startsAt: z.string().trim(),
    duration: z.string().trim().regex(/^\d{1,3}$/, key("duration")),
  })
  .superRefine((v, ctx) => {
    if (!parseIstLocal(v.startsAt)) {
      ctx.addIssue({ code: "custom", path: ["startsAt"], message: key("startTime") });
    }
    const minutes = Number(v.duration);
    if (minutes < 5 || minutes > 300) {
      ctx.addIssue({ code: "custom", path: ["duration"], message: key("duration") });
    }
  })
  .transform((v) => ({
    title: v.title,
    class: Number(v.class),
    stream: resolveStream(v.class, v.stream),
    starts_at: parseIstLocal(v.startsAt)!.toISOString(),
    duration_minutes: Number(v.duration),
  }));

export const answersSchema = z.array(z.number().int().min(-1).max(3)).max(MAX_SCHEDULED_QUESTIONS);

export type ScheduledTestFormInput = z.input<typeof scheduledTestFormSchema>;
export type ScheduledTestFormValues = z.output<typeof scheduledTestFormSchema>;
