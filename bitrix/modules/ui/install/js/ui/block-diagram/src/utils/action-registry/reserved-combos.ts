// Combos the browser or the operating system takes for itself: a canvas action bound to one of them
// would never see the press. There is no way to detect the interception at runtime, so the lists are
// curated and grow as cases are found. Spelling is the canonical combo form of the input layer:
// modifiers in the ctrl - alt - shift - meta order, then the key token.

const COMMON_RESERVED_COMBOS = Object.freeze([
	'f5',
	'f11',
	'f12',
	// The second spelling of delete-block (block-diagram.js registers it as a plain combo record,
	// not through an action id, precisely because it is a fixed alias rather than an action of its
	// own). The registry has no entry to protect it with otherwise, and handing it to another action
	// would fire both on every press: the assigned action and the delete, at once.
	'backspace',
]);

const MAC_RESERVED_COMBOS = Object.freeze([
	'meta+keyd',
	'meta+keyh',
	'meta+keyl',
	'meta+keym',
	'meta+keyn',
	'meta+keyp',
	'meta+keyq',
	'meta+keyr',
	'meta+keyt',
	'meta+keyw',
	'meta+space',
	'meta+tab',
	'shift+meta+keyn',
	'shift+meta+keyt',
	'alt+meta+keyi',
]);

const OTHER_RESERVED_COMBOS = Object.freeze([
	'ctrl+keyd',
	'ctrl+keyl',
	'ctrl+keyn',
	'ctrl+keyp',
	'ctrl+keyq',
	'ctrl+keyr',
	'ctrl+keyt',
	'ctrl+keyw',
	'ctrl+shift+keyi',
	'ctrl+shift+keyj',
	'ctrl+shift+keyn',
	'ctrl+shift+keyt',
	'alt+tab',
	'alt+f4',
]);

/**
 * Reserved combos of one platform. A fresh set per call: the caller owns what it gets and the
 * registry asks once, when it is built.
 *
 * @param {boolean} isMac
 * @returns {Set<string>}
 */
export function getReservedCombos(isMac)
{
	return new Set([
		...COMMON_RESERVED_COMBOS,
		...(isMac ? MAC_RESERVED_COMBOS : OTHER_RESERVED_COMBOS),
	]);
}
