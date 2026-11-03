/**
 * Batch-resolve utility for noteMention nodes.
 *
 * Collects mention nodes from the document (deduped by type:id),
 * calls API-01, and returns a Map keyed by "type:id".
 *
 * Unlike file-node resolver, unavailable/inaccessible nodes are NOT removed —
 * they receive unavailable:true as a placeholder (persisted mention remains valid).
 */

const MENTION_NODE_TYPE = 'noteMention';
export const MENTION_BATCH_LIMIT = 200;

export function createMentionSnapshot(mention, fallbackLabel = null)
{
	if (!mention?.available)
	{
		const label = mention?.type === 'document' ? mention.label ?? fallbackLabel : fallbackLabel;

		return Object.freeze({
			label,
			avatar: null,
			url: null,
			available: false,
			isCurrentUser: false,
			unavailable: true,
		});
	}

	return Object.freeze({
		label: mention.label ?? fallbackLabel,
		avatar: mention.avatar ?? null,
		url: mention.url ?? null,
		available: true,
		isCurrentUser: Boolean(mention.isCurrentUser),
		unavailable: false,
	});
}

/**
 * Collects mention nodes from the ProseMirror document.
 * Presentation attributes are deliberately ignored: they can belong to a previous
 * editor session and therefore are not authoritative for the current user.
 * Results are deduped by "type:id" — one entry per unique pair.
 *
 * @param {Object} doc - ProseMirror document.
 * @param {Set<string>} skip - "type:id" keys excluded from this pass.
 * @returns {{ type: string, id: number }[]}
 */
export function collectMentions(doc, skip)
{
	const seen = new Set();
	const items = [];
	const skippedKeys = skip instanceof Set ? skip : new Set();

	doc.descendants((node) => {
		if (node.type.name !== MENTION_NODE_TYPE)
		{
			return;
		}

		const { entityType, entityId } = node.attrs;

		if (!entityType || !(entityId > 0))
		{
			return;
		}

		const key = `${entityType}:${entityId}`;
		if (seen.has(key) || skippedKeys.has(key))
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
