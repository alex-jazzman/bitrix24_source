import { type LogEntry, type GroupedLog } from '../classes/log-entry-provider';

/**
 * Collapses duplicate entries (by `hashProp`, default `message`) into a single
 * GroupedLog with `count` and the list of source `ids`. Server-side uses `ids`
 * for dedup after the client deletes the corresponding rows.
 *
 * NOTE: `hashProp` must reference a primitively-valued field (string/number).
 * Object-valued keys (e.g. `'data'`) would be compared by reference in the Map
 * and silently produce one group per entry — no collapsing.
 */
export function groupLogs(logs: LogEntry[], hashProp: keyof LogEntry = 'message'): GroupedLog[]
{
	const groups = new Map<unknown, GroupedLog>();

	for (const log of logs)
	{
		const hash = log[hashProp];
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
