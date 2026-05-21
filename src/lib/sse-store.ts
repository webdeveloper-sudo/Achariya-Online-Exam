/**
 * SSE Store — in-process pub/sub for live session events.
 * Each session token maps to a Set of active SSE controller objects.
 * All API routes (join, start, submit, end) call `broadcast()` to push
 * typed events to every connected teacher and student client.
 */

export type SSEEvent =
  | { type: "student:joined"; participant: SSEParticipant }
  | { type: "session:start"; duration: number; startedAt: string }
  | { type: "student:submitted"; participantId: string }
  | { type: "session:end"; leaderboard: LeaderboardEntry[] }
  | { type: "ping" };

export interface SSEParticipant {
  id: string;
  name: string;
  grade: string;
  section: string;
  studentId: string;
  joinedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  grade: string;
  section: string;
  studentId: string;
  score: number;
  totalQuestions: number;
  timeTakenSeconds: number;
  tabSwitches: number;
}

type Controller = ReadableStreamDefaultController<Uint8Array>;

// Global map preserved across hot-reloads in dev
const globalForSSE = global as unknown as {
  __sseStore: Map<string, Set<Controller>>;
};

if (!globalForSSE.__sseStore) {
  globalForSSE.__sseStore = new Map();
}

export const sseStore = globalForSSE.__sseStore;

export function getSubscribers(token: string): Set<Controller> {
  if (!sseStore.has(token)) {
    sseStore.set(token, new Set());
  }
  return sseStore.get(token)!;
}

export function addSubscriber(token: string, controller: Controller): void {
  getSubscribers(token).add(controller);
}

export function removeSubscriber(token: string, controller: Controller): void {
  const set = sseStore.get(token);
  if (set) {
    set.delete(controller);
    if (set.size === 0) sseStore.delete(token);
  }
}

export function broadcast(token: string, event: SSEEvent): void {
  const subscribers = sseStore.get(token);
  if (!subscribers || subscribers.size === 0) return;

  const encoder = new TextEncoder();
  const data = `data: ${JSON.stringify(event)}\n\n`;
  const encoded = encoder.encode(data);

  const dead: Controller[] = [];
  for (const ctrl of subscribers) {
    try {
      ctrl.enqueue(encoded);
    } catch {
      // Controller closed — mark for cleanup
      dead.push(ctrl);
    }
  }
  for (const ctrl of dead) {
    subscribers.delete(ctrl);
  }
}
