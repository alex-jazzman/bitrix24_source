/**
 * Registry of supported mention types.
 *
 * Wire values match REG-01 (backend enum MentionType).
 * entityId values match ENT-01 (entity-selector entity identifiers).
 * navKind: 'internal-link' for document/collection, 'slider' for user/task.
 *
 * Presentation (color, icon, marker, avatar shape) lives in note.ui.mention-chip,
 * not here — this file is logic-only.
 */

// @type MentionNavKind
// @values 'internal-link' | 'slider'

const MENTION_TYPE_MAP = Object.freeze({
	user: Object.freeze({
		entityId: 'user',
		navKind: 'slider',
	}),
	document: Object.freeze({
		entityId: 'note-document',
		navKind: 'internal-link',
	}),
	collection: Object.freeze({
		entityId: 'note-collection',
		navKind: 'internal-link',
	}),
	task: Object.freeze({
		entityId: 'task',
		navKind: 'slider',
	}),
});

/**
 * Returns true if the given wire-type string is a known mention type.
 *
 * @param {string} type
 * @returns {boolean}
 */
export function isSupportedType(type)
{
	return Object.prototype.hasOwnProperty.call(MENTION_TYPE_MAP, type);
}

/**
 * Returns the registry entry for a given wire-type, or null if unknown.
 *
 * @param {string} type
 * @returns {{ entityId: string, navKind: string } | null}
 */
export function byType(type)
{
	return MENTION_TYPE_MAP[type] ?? null;
}

/**
 * Returns all supported wire-type strings.
 *
 * @returns {string[]}
 */
export function allTypes()
{
	return Object.keys(MENTION_TYPE_MAP);
}
