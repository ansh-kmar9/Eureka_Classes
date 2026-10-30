import { z } from "zod";
import {
  CLASS_VALUES,
  needsStream,
  STREAM_VALUES,
  type ValidationKey,
} from "@/features/profile/schemas";
import { parseYouTubeId, youTubeWatchUrl } from "@/lib/youtube";

const key = <K extends ValidationKey>(value: K) => value;

export const classField = z.enum(CLASS_VALUES, key("class"));
/** Empty string means "every stream"; only meaningful for classes 11 and 12. */
export const streamField = z.union([z.enum(STREAM_VALUES), z.literal("")]);
export const subjectField = z
  .string()
  .trim()
  .min(1, key("subject"))
  .max(60, key("subject"))
  .regex(/^[\p{L}\p{N} &.,'()+/-]+$/u, key("subject"));
export const titleField = z.string().trim().min(1, key("title")).max(120, key("title"));
const httpsUrl = z
  .string()
  .trim()
  .max(2000, key("url"))
  .pipe(z.url({ protocol: /^https$/, error: key("url") }));

export const resolveStream = (klass: string, stream: string) =>
  needsStream(klass) && stream ? (stream as (typeof STREAM_VALUES)[number]) : null;

export const courseFormSchema = z
  .object({
    class: classField,
    stream: streamField,
    subject: subjectField,
    title: titleField,
    description: z.string().trim().max(500, key("description")),
  })
  .transform((v) => ({
    class: Number(v.class),
    stream: resolveStream(v.class, v.stream),
    subject: v.subject,
    title: v.title,
    description: v.description || null,
  }));

export const lessonFormSchema = z
  .object({
    title: titleField,
    type: z.enum(["video", "pdf"]),
    url: z.string().trim().max(2000, key("url")),
  })
  .superRefine((v, ctx) => {
    if (v.type === "video") {
      if (!parseYouTubeId(v.url)) {
        ctx.addIssue({ code: "custom", path: ["url"], message: key("youtube") });
      }
    } else if (!httpsUrl.safeParse(v.url).success) {
      ctx.addIssue({ code: "custom", path: ["url"], message: key("url") });
    }
  })
  .transform((v) => ({
    title: v.title,
    type: v.type,
    // Videos are stored as a clean canonical link, whatever form the teacher pasted.
    url: v.type === "video" ? youTubeWatchUrl(parseYouTubeId(v.url)!) : v.url,
  }));

export const materialFormSchema = z
  .object({
    class: classField,
    stream: streamField,
    subject: subjectField,
    title: titleField,
    url: httpsUrl,
  })
  .transform((v) => ({
    class: Number(v.class),
    stream: resolveStream(v.class, v.stream),
    subject: v.subject,
    title: v.title,
    url: v.url,
  }));

export type CourseFormInput = z.input<typeof courseFormSchema>;
export type LessonFormInput = z.input<typeof lessonFormSchema>;
export type MaterialFormInput = z.input<typeof materialFormSchema>;
export type CourseFormValues = z.output<typeof courseFormSchema>;
export type MaterialFormValues = z.output<typeof materialFormSchema>;
