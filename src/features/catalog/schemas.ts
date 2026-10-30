import { z } from "zod";
import {
  BOARD_VALUES,
  CLASS_VALUES,
  STREAM_VALUES,
  type ValidationKey,
} from "@/features/profile/schemas";

const key = <K extends ValidationKey>(value: K) => value;

export const subjectNameSchema = z.object({
  name: z.string().trim().min(1, key("subject")).max(60, key("subject")),
});

export const topicNameSchema = z.object({
  name: z.string().trim().min(1, key("topic")).max(120, key("topic")),
});

/** The board, class and stream a teacher is currently managing. */
export const catalogScopeSchema = z.object({
  board: z.enum(BOARD_VALUES),
  class: z.enum(CLASS_VALUES),
  stream: z.union([z.enum(STREAM_VALUES), z.literal("")]),
});

export type NameFormInput = z.input<typeof subjectNameSchema>;
