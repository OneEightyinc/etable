/**
 * 順番待ちの「前に並んでいる組」の定義を API / クライアントで共有する。
 * CALLED（案内中）は待ち行列から外し、WAITING と HOLD のみを同一列として数える。
 */

export type QueueLike = { id: string; status: string };

export function isInWaitingLineStatus(status: string): boolean {
  return status === "WAITING" || status === "HOLD";
}

export function waitingLineEntries<T extends QueueLike>(queue: T[]): T[] {
  return queue.filter((q) => isInWaitingLineStatus(q.status));
}

/** 待ち列内での 0 始まりインデックス（自分の前にいる組数）。見つからなければ -1 */
export function waitingIndexForEntry<T extends QueueLike>(queue: T[], entryId: string): number {
  return waitingLineEntries(queue).findIndex((q) => q.id === entryId);
}

export function waitingLineGroupCount<T extends QueueLike>(queue: T[]): number {
  return waitingLineEntries(queue).length;
}
