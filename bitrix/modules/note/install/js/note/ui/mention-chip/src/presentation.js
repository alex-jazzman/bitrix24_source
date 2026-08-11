import { Outline } from 'ui.icon-set.api.vue';
import { AssetUrl } from 'note.ui.assets';

/**
 * Visual presentation map: wire type -> { colorToken, icon, iconUrl, marker, avatarShape }.
 *
 * Keys match REG-01 wire values exactly (user/document/collection/task).
 * colorToken — CSS custom property from Air design tokens.
 * icon — icon name for BIcon (Outline set); null when iconUrl is used instead.
 * iconUrl — URL of a custom SVG mask-image glyph (collection); null for BIcon types.
 *   The asset lives once in note.ui.assets and its URL is imported from there.
 * marker — short single-char label used in skeleton/chip badge.
 * avatarShape — 'circle' for user, 'square' for entities.
 */
export const MENTION_PRESENTATION = Object.freeze({
	// WHY: g-tint form per design artifact; single accent colour; icon is the type signal.
	user: Object.freeze({
		colorToken: '--ui-color-accent-main-primary',
		// user type never renders BIcon; avatar or placeholder is used instead.
		icon: null,
		iconUrl: null,
		marker: '@',
		avatarShape: 'circle',
	}),
	document: Object.freeze({
		// o-file: plain document sheet — closest match to ADR "o-file" leaf icon.
		colorToken: '--ui-color-accent-main-primary',
		icon: Outline.FILE,
		iconUrl: null,
		marker: 'D',
		avatarShape: 'square',
	}),
	collection: Object.freeze({
		// Custom note SVG rendered as monochrome mask-image; color follows the shared accent token (same for all types in g-tint form).
		colorToken: '--ui-color-accent-main-primary',
		icon: null,
		iconUrl: AssetUrl.collectionIcon,
		marker: 'C',
		avatarShape: 'square',
	}),
	task: Object.freeze({
		// o-task: checkbox with checkmark — matches ADR "checkbox/task" marker.
		colorToken: '--ui-color-accent-main-primary',
		icon: Outline.TASK,
		iconUrl: null,
		marker: 'T',
		avatarShape: 'square',
	}),
});

/**
 * Returns the presentation entry for a wire type, or null if unknown.
 *
 * @param {string} type
 * @returns {{ colorToken: string, icon: string|null, iconUrl: string|null, marker: string, avatarShape: string } | null}
 */
export function getPresentationByType(type)
{
	return MENTION_PRESENTATION[type] ?? null;
}
