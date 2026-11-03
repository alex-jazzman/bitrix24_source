import { type LogEntry, type GroupedLog } from '../classes/log-entry-provider';

/**
 * Collapses duplicate entries into a single GroupedLog with `count` and the
 * list of source `ids`. Server-side uses `ids` for dedup after the client
 * deletes the corresponding rows.
 *
 * Entries are grouped by `message`, the call identifier from `data` (`roomId`,
 * falling back to `callId`) and the subsystem in `data.source`, so identical
 * errors from different calls - or from different subsystems of one call - stay
 * in separate groups. Entries without call context or without a source keep
 * grouping on the remaining components (empty string in place of the missing one).
 *
 * NOTE: the group key must stay a primitive string. Object-valued keys would
 * be compared by reference in the Map and silently produce one group per
 * entry with no collapsing.
 */
export function groupLogs(logs: LogEntry[]): GroupedLog[]
{
	const groups = new Map<string, GroupedLog>();

	for (const log of logs)
	{
		const hash = getGroupKey(log);
		const existing = groups.get(hash);

		if (existing)
		{
			existing.count++;
			existing.ids.push(log.id);
		}
		else
		{
			groups.set(hash, { ...log, ids: [log.id], count: 1 });
		}
	}

	return [...groups.values()];
}

function getGroupKey(entry: LogEntry): string
{
	const callIdentifier = entry.data?.roomId ?? entry.data?.callId ?? '';

	// Structured serialization keeps component boundaries and value types distinct:
	// "x|room"+"" and "x"+"room" (or a numeric callId vs a string roomId) map to different keys
	return JSON.stringify([entry.message, callIdentifier, entry.data?.source ?? '']);
}
