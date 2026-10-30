import { z } from "zod";
import type { ValidationKey } from "@/features/profile/schemas";

export const announcementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "title" satisfies ValidationKey)
    .max(120, "title" satisfies ValidationKey),
  body: z
    .string()
    .trim()
    .min(1, "description" satisfies ValidationKey)
    .max(2000, "description" satisfies ValidationKey),
});

export type AnnouncementInput = z.input<typeof announcementSchema>;
