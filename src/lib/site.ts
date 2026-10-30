export const site = {
  name: "Eureka Classes",
  shortName: "Eureka",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://eurekaclasses.live",
  classes: [6, 7, 8, 9, 10, 11, 12] as const,
  // TODO(content): replace these placeholders with the real details before launch.
  contact: {
    phone: "+91 00000 00000",
    whatsapp: "910000000000",
    email: "hello@eurekaclasses.live",
  },
} as const;
