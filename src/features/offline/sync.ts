import {
  getResult,
  listOutbox,
  markOutboxFailed,
  removeFromOutbox,
  saveResult,
} from "@/lib/offline/db";
import { submitPracticeAttempt } from "@/features/tests/actions";

export interface SyncSummary {
  sent: number;
  /** Still waiting, usually because there is no connection or the session needs a fresh sign-in. */
  waiting: number;
  /** Rejected for good, for example because the test was taken down. */
  failed: number;
}

let running: Promise<SyncSummary> | null = null;

/**
 * Sends every finished offline attempt to the server. The server marks the answers itself and
 * counts each attempt only once, so it is always safe to call this again, even mid-way.
 */
export function syncOutbox(userId: string): Promise<SyncSummary> {
  // One sync at a time, even if several parts of the app ask together.
  running ??= run(userId).finally(() => {
    running = null;
  });
  return running;
}

async function run(userId: string): Promise<SyncSummary> {
  const summary: SyncSummary = { sent: 0, waiting: 0, failed: 0 };
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    summary.waiting = (await listOutbox(userId)).filter((a) => a.status === "pending").length;
    return summary;
  }

  for (const attempt of await listOutbox(userId)) {
    if (attempt.status === "failed") {
      summary.failed += 1;
      continue;
    }

    const result = await submitPracticeAttempt({
      testId: attempt.testId,
      clientId: attempt.clientId,
      answers: attempt.answers,
      durationSeconds: attempt.durationSeconds,
      submittedAt: attempt.submittedAt,
    }).catch(() => null);

    if (result?.ok) {
      const local = await getResult(userId, attempt.clientId);
      if (local) await saveResult({ ...local, synced: true, attemptId: result.attemptId });
      await removeFromOutbox(attempt.clientId);
      summary.sent += 1;
    } else if (result && result.error === "invalid") {
      // The server will never accept this one; stop retrying it.
      await markOutboxFailed(attempt.clientId);
      summary.failed += 1;
    } else {
      // No network, or the session expired: keep it and try again later.
      summary.waiting += 1;
    }
  }
  return summary;
}
