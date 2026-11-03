import { PopupWindowManager } from 'main.popup';

import { FocusKeys, FocusZone, type FocusZoneOptions } from 'ui.a11y';

export {
	CHAT_DETAIL_FOCUS_CONTEXT,
	ChatDetailFocusContext,
	DetailArea,
	DetailLayer,
} from './chat-detail-focus-context';
export type {
	DetailAreaType,
	DetailFocusIntent,
	DetailLayerType,
	HeaderControlRegistration,
	HeaderControlSnapshotEntry,
} from './chat-detail-focus-context';
export {
	armKeyboardFocusHandoff,
	clearKeyboardFocusHandoff,
	getKeyboardFocusHandoff,
	holdKeyboardFocusHandoffForNestedList,
	isKeyboardFocusHandoffHeldByNestedList,
	isKeyboardFocusHandoffOfAreaHeldByNestedList,
	isKeyboardFocusHandoffPending,
	releaseKeyboardFocusHandoffFromNestedList,
} from './keyboard-focus-handoff';
export type { KeyboardFocusHandoff, NestedListHandoff } from './keyboard-focus-handoff';

const VERTICAL_LIST_BIND_KEYS: number = FocusKeys.ArrowVertical | FocusKeys.HomeAndEnd;

/**
 * Creates a FocusZone preconfigured for a vertical list (roving tabindex):
 * Up/Down arrows plus Home/End, focus stops at the list bounds (no wrapping).
 *
 * Callers from a different ARIA context (e.g. a menu) may override any option.
 * Lifecycle is the caller's responsibility via `zone.activate()` / `zone.deactivate()`.
 */
export function createListFocusZone(
	container: HTMLElement,
	options: Partial<FocusZoneOptions> = {},
): FocusZone
{
	return new FocusZone(container, {
		bindKeys: VERTICAL_LIST_BIND_KEYS,
		focusOutBehavior: 'stop',
		...options,
	});
}

/**
 * True while a popup/menu is shown. Such surfaces own focus (usually via a focus trap and restore
 * it themselves on close), so list components must not pull focus away. Gate programmatic focus
 * moves with this - it mirrors the popup ownership check EscManager already relies on.
 */
export function isFocusOwnedByPopup(): boolean
{
	return PopupWindowManager.isAnyPopupShown();
}
