import { z } from "zod";

/** Keys into the `validation` message namespace. Schemas return keys, never English text. */
export type ValidationKey =
  | "name"
  | "class"
  | "stream"
  | "age"
  | "mobile"
  | "email"
  | "message"
  | "title"
  | "description"
  | "url"
  | "youtube"
  | "subject"
  | "topic"
  | "question"
  | "option"
  | "answer"
  | "board"
  | "duration"
  | "startTime";

export const CLASS_VALUES = ["6", "7", "8", "9", "10", "11", "12"] as const;
export const STREAM_VALUES = ["science", "commerce", "arts"] as const;
export const BOARD_VALUES = ["cbse", "bseb"] as const;

export const needsStream = (classValue: string | number) => Number(classValue) >= 11;

export const profileFormSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "name" satisfies ValidationKey)
      .max(80, "name" satisfies ValidationKey),
    board: z.enum(BOARD_VALUES, "board" satisfies ValidationKey),
    class: z.enum(CLASS_VALUES, "class" satisfies ValidationKey),
    stream: z.union([z.enum(STREAM_VALUES), z.literal("")]),
    age: z.string().trim().regex(/^\d{1,2}$/, "age" satisfies ValidationKey),
    mobile: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, "mobile" satisfies ValidationKey),
  })
  .superRefine((value, ctx) => {
    const age = Number(value.age);
    if (age < 8 || age > 30) {
      ctx.addIssue({ code: "custom", path: ["age"], message: "age" satisfies ValidationKey });
    }
    if (needsStream(value.class) && !value.stream) {
      ctx.addIssue({
        code: "custom",
        path: ["stream"],
        message: "stream" satisfies ValidationKey,
      });
    }
  })
  .transform((value) => ({
    fullName: value.fullName,
    board: value.board,
    class: Number(value.class),
    stream: needsStream(value.class) && value.stream ? value.stream : null,
    age: Number(value.age),
    mobile: value.mobile,
  }));

export type ProfileFormInput = z.input<typeof profileFormSchema>;
export type ProfileFormValues = z.output<typeof profileFormSchema>;

const fullNameField = z
  .string()
  .trim()
  .min(2, "name" satisfies ValidationKey)
  .max(80, "name" satisfies ValidationKey);

/** Details a student may edit at any time: name, age and mobile. */
export const detailsFormSchema = z
  .object({
    fullName: fullNameField,
    age: z.string().trim().regex(/^\d{1,2}$/, "age" satisfies ValidationKey),
    mobile: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, "mobile" satisfies ValidationKey),
  })
  .superRefine((value, ctx) => {
    const age = Number(value.age);
    if (age < 8 || age > 30) {
      ctx.addIssue({ code: "custom", path: ["age"], message: "age" satisfies ValidationKey });
    }
  })
  .transform((value) => ({
    fullName: value.fullName,
    age: Number(value.age),
    mobile: value.mobile,
  }));

/** Choosing a different class (and stream for 11 and 12). */
export const classChangeSchema = z
  .object({
    board: z.enum(BOARD_VALUES, "board" satisfies ValidationKey),
    class: z.enum(CLASS_VALUES, "class" satisfies ValidationKey),
    stream: z.union([z.enum(STREAM_VALUES), z.literal("")]),
  })
  .superRefine((value, ctx) => {
    if (needsStream(value.class) && !value.stream) {
      ctx.addIssue({
        code: "custom",
        path: ["stream"],
        message: "stream" satisfies ValidationKey,
      });
    }
  })
  .transform((value) => ({
    board: value.board,
    class: Number(value.class),
    stream: needsStream(value.class) && value.stream ? value.stream : null,
  }));

export type DetailsFormInput = z.input<typeof detailsFormSchema>;
export type ClassChangeInput = z.input<typeof classChangeSchema>;
export type DetailsFormValues = z.output<typeof detailsFormSchema>;
export type ClassChangeValues = z.output<typeof classChangeSchema>;
