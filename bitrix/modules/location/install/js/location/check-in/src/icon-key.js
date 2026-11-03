/**
 * Identity of an icon built by MarkerIconFactory: the same type and the same data mean the same icon.
 *
 * The map engine compares icons to decide whether a re-sent marker needs its DOM rewritten, and the
 * generated html cannot answer that question. An avatar gets a fresh
 * `ui-avatar-{timestamp}-{random}` mask id on every build (ui.avatar, AvatarBase.getUnicId), so two
 * identical avatars never produce equal html - while the source they are built from stays equal.
 *
 * @param {String} type - MarkerType value
 * @param {Object} data - payload createIconByType was called with
 * @returns {String}
 */
export function buildIconKey(type, data)
{
	return `${type}:${stableStringify(data)}`;
}

// JSON with object keys in a fixed order, so that two equal payloads assembled with their keys in a
// different order still serialize the same. Array order carries meaning and is kept as is.
function stableStringify(value)
{
	const sorted = JSON.stringify(value, (key, item) => (
		isPlainObject(item)
			? Object.fromEntries(Object.keys(item).sort().map((name) => [name, item[name]]))
			: item
	));

	return sorted ?? 'null';
}

function isPlainObject(value)
{
	return Boolean(value) && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}
