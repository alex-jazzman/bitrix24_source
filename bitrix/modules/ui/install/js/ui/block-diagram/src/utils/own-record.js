import { Type } from 'main.core';
import { toValue } from 'ui.vue3';

/**
 * A record of a map read strictly as an own property: keys come from an untrusted graph owned
 * by the consumer of the extension, so a plain lookup would answer an inherited prototype member
 * (constructor, toString) where the map holds no record at all. A missing or non-object map
 * reads as an empty one, so a reactive source and a plain object are both accepted. An own
 * record holding null or undefined reads as a missing one, so a consumer filling the gaps
 * overwrites such a key with a fresh record.
 */
export function getOwnRecord(map: ?{ [key: string]: Object }, key: string): Object | null
{
	const records = toValue(map);

	if (!Type.isObjectLike(records) || !Object.hasOwn(records, key))
	{
		return null;
	}

	return records[key] ?? null;
}
