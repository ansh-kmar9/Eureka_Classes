/** Scheduled tests run in India time, whatever time zone the server or phone is set to. */
const IST_OFFSET = "+05:30";

/** Leaving the app this many times ends a scheduled test. */
export const MAX_STRIKES = 3;

export type Phase = "upcoming" | "live" | "ended" | "cancelled";

interface Timed {
  status: "draft" | "scheduled" | "cancelled";
  starts_at: string;
  duration_minutes: number;
}

export const endsAtMs = (test: Pick<Timed, "starts_at" | "duration_minutes">) =>
  Date.parse(test.starts_at) + test.duration_minutes * 60_000;

/**
 * Where a test is in its life: waiting to open, open for everyone, or over.
 * The window is fixed: it closes at start + duration for every student.
 */
export function getPhase(test: Timed, now: number): Phase {
  if (test.status === "cancelled") return "cancelled";
  const start = Date.parse(test.starts_at);
  if (now < start) return "upcoming";
  return now < endsAtMs(test) ? "live" : "ended";
}

/** Reads an `<input type="datetime-local">` value ("2026-11-05T13:00") as India time. */
export function parseIstLocal(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00${IST_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Formats a moment for an `<input type="datetime-local">`, in India time. */
export function toIstLocal(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** Whole seconds left until `deadlineMs`, never negative. */
export const secondsLeft = (deadlineMs: number, nowMs: number) =>
  Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000));
