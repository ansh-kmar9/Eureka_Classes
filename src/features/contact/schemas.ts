import { z } from "zod";
import type { ValidationKey } from "@/features/profile/schemas";

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "name" satisfies ValidationKey)
    .max(100, "name" satisfies ValidationKey),
  email: z
    .string()
    .trim()
    .max(200, "email" satisfies ValidationKey)
    .pipe(z.email("email" satisfies ValidationKey)),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9+\-\s]*$/, "mobile" satisfies ValidationKey),
  message: z
    .string()
    .trim()
    .min(1, "message" satisfies ValidationKey)
    .max(2000, "message" satisfies ValidationKey),
  // Honeypot: real visitors never see or fill this field, bots usually do.
  website: z.string().max(0).optional(),
});

export type ContactInput = z.input<typeof contactSchema>;
