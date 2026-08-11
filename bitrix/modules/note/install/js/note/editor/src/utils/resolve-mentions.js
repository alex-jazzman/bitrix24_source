/**
 * Batch-resolve utility for noteMention nodes.
 *
 * Collects unresolved nodes from the document (deduped by type:id),
 * calls API-01, and returns a Map keyed by "type:id".
 *
 * Unlike file-node resolver, unavailable/inaccessible nodes are NOT removed —
 * they receive unavailable:true as a placeholder (persisted mention remains valid).
 */

const MENTION_NODE_TYPE = 'noteMention';

/**
 * Collects unresolved mention nodes from the ProseMirror document.
 * "Unresolved" means available === null (resolver has not touched it yet).
 * Results are deduped by "type:id" — one entry per unique pair.
 *
 * @param {Object} doc - ProseMirror document.
 * @param {Set<string>} skip - Already-failed "type:id" keys to skip.
 * @returns {{ type: string, id: number }[]}
 */
export function collectUnresolvedMentions(doc, skip)
{
	const seen = new Set();
	const items = [];

	doc.descendants((node) => {
		if (node.type.name !== MENTION_NODE_TYPE)
		{
			return;
		}

		const { entityType, entityId, available } = node.attrs;

		// Skip already-resolved or invalid nodes.
		if (available !== null || !entityType || !(entityId > 0))
		{
			return;
		}

		const key = `${entityType}:${entityId}`;
		if (seen.has(key) || skip.has(key))
		{
			return;
		}

		seen.add(key);
		items.push({ type: entityType, id: Number(entityId) });
	});

	return items;
}

/**
 * Calls API-01 to resolve a batch of mentions.
 * Returns a Map keyed by "type:id" → ResolvedMention DTO on success (a missing key
 * means the backend reported that item as gone/no-access). Returns null on a
 * transient network/server failure so the caller can distinguish "resolved, item
 * absent" from "request failed" and avoid marking healthy chips as unavailable.
 *
 * @param {{ type: string, id: number }[]} items
 * @returns {Promise<Map<string, Object> | null>}
 */
export async function resolveMentionsBatch(items)
{
	if (!items || items.length === 0)
	{
		return new Map();
	}

	let response = null;
	try
	{
		response = await BX.ajax.runAction('note.infrastructure.MentionController.resolveMentionsBatch', {
			data: { items },
		});
	}
	catch
	{
		// Transient network/server failure — signal the caller to retry, not to give up.
		return null;
	}

	const mentions = Array.isArray(response?.data?.mentions) ? response.data.mentions : [];
	const resultMap = new Map();

	for (const mention of mentions)
	{
		if (mention?.type && mention?.id > 0)
		{
			resultMap.set(`${mention.type}:${mention.id}`, mention);
		}
	}

	return resultMap;
}
