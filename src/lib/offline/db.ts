import { openDB, type DBSchema, type IDBPDatabase } from "idb";

/**
 * On-device storage for offline practice tests: the downloaded tests, the finished attempts
 * waiting to be sent, and the local results. Everything is tagged with the user's id, so two
 * students sharing one phone never see each other's data.
 */

export interface OfflineQuestion {
  id: string;
  text: string;
  options: string[];
  correct: number;
  explanation: string | null;
}

export interface OfflineTest {
  /** The test's id on the server. */
  id: string;
  userId: string;
  topic: string;
  subject: string;
  durationMinutes: number;
  questions: OfflineQuestion[];
  downloadedAt: number;
}

export interface QueuedAttempt {
  /** Unique per attempt; the server uses it to make sure an attempt is only counted once. */
  clientId: string;
  userId: string;
  testId: string;
  answers: number[];
  durationSeconds: number;
  submittedAt: string;
  /** "failed" means the server will never accept it (for example the test was removed). */
  status: "pending" | "failed";
}

export interface LocalResult {
  clientId: string;
  userId: string;
  testId: string;
  answers: number[];
  score: number;
  total: number;
  durationSeconds: number;
  submittedAt: string;
  /** True once the server has recorded it. */
  synced: boolean;
  /** The server's id for the attempt, once synced, so the full result can be opened online. */
  attemptId?: string;
}

interface OfflineSchema extends DBSchema {
  tests: { key: string; value: OfflineTest; indexes: { "by-user": string } };
  outbox: { key: string; value: QueuedAttempt; indexes: { "by-user": string } };
  results: { key: string; value: LocalResult; indexes: { "by-user": string } };
}

let connection: Promise<IDBPDatabase<OfflineSchema>> | null = null;

function database() {
  connection ??= openDB<OfflineSchema>("eureka-offline", 1, {
    upgrade(db) {
      db.createObjectStore("tests", { keyPath: "id" }).createIndex("by-user", "userId");
      db.createObjectStore("outbox", { keyPath: "clientId" }).createIndex("by-user", "userId");
      db.createObjectStore("results", { keyPath: "clientId" }).createIndex("by-user", "userId");
    },
  });
  return connection;
}

/** True where this browser can store data on the device. */
export const offlineStorageAvailable = () => typeof indexedDB !== "undefined";

export async function saveTest(test: OfflineTest) {
  await (await database()).put("tests", test);
}

export async function getTest(userId: string, testId: string): Promise<OfflineTest | undefined> {
  const test = await (await database()).get("tests", testId);
  return test?.userId === userId ? test : undefined;
}

export async function listTests(userId: string): Promise<OfflineTest[]> {
  const tests = await (await database()).getAllFromIndex("tests", "by-user", userId);
  return tests.sort((a, b) => b.downloadedAt - a.downloadedAt);
}

export async function deleteTest(userId: string, testId: string) {
  const db = await database();
  if ((await db.get("tests", testId))?.userId === userId) await db.delete("tests", testId);
}

export async function queueAttempt(attempt: QueuedAttempt) {
  await (await database()).put("outbox", attempt);
}

export async function listOutbox(userId: string): Promise<QueuedAttempt[]> {
  return (await database()).getAllFromIndex("outbox", "by-user", userId);
}

export async function removeFromOutbox(clientId: string) {
  await (await database()).delete("outbox", clientId);
}

export async function markOutboxFailed(clientId: string) {
  const db = await database();
  const item = await db.get("outbox", clientId);
  if (item) await db.put("outbox", { ...item, status: "failed" });
}

export async function saveResult(result: LocalResult) {
  await (await database()).put("results", result);
}

export async function getResult(userId: string, clientId: string): Promise<LocalResult | undefined> {
  const result = await (await database()).get("results", clientId);
  return result?.userId === userId ? result : undefined;
}
