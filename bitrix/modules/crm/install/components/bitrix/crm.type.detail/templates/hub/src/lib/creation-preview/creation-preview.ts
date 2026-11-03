// The single place that answers "is the hub showing a type that does not exist yet, and what does
// that cost the rest of the screen". No DOM, no Vue, no window: the flag arrives from PHP through
// the app params and everything the mode implies is derived here, so the composition layer only
// applies the answer. Pure by contract — src/lib/ is imported by the bare unit harness, which loads
// neither crm.settings-hub nor main.core.
export type CreationPreviewState = {
	active: boolean,
	rootModifierClass: string | null,
	contentInert: boolean,
	hideGlobalSavePanel: boolean,
	showHeroSaveButton: boolean,
};

// Fixed by contract with the stylesheet of the mode: the CSS rules of the preview hang on this exact
// class, so renaming it here silently un-dims the whole hub.
const CREATION_PREVIEW_ROOT_CLASS = 'crm-type-hub--creation-preview';

// Deliberately a separate step from "is the mode on": the customer asked for content that is visible
// but not operable, and inert is how that is done today (opacity alone leaves the controls reachable
// by keyboard and screen reader). If the ask turns into "let them click around", this one return
// value becomes false and nothing else in the mode changes.
function shouldInertContent(active: boolean): boolean
{
	return active;
}

// The flag crosses the PHP -> JS boundary, where it can arrive as true, false or not at all, so the
// truth test is a strict one: only a real boolean true turns the mode on. Anything else (undefined,
// the 'Y' the old templates liked to send, 0, an empty object) is treated as the ordinary edit hub,
// which is the safe default: the preview dims the screen, and dimming a saved type by accident is
// worse than not dimming a draft.
export function resolveCreationPreviewState(params: { isCreationPreview?: unknown }): CreationPreviewState
{
	const active = Boolean(params.isCreationPreview === true);

	return {
		active,
		rootModifierClass: active ? CREATION_PREVIEW_ROOT_CLASS : null,
		contentInert: shouldInertContent(active),
		hideGlobalSavePanel: active,
		showHeroSaveButton: active,
	};
}
