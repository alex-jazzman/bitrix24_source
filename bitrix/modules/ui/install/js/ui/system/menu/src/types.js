import type { PopupOptions } from 'main.popup';
import type { CounterOptions } from 'ui.cnt';
import type { ButtonOptions } from 'ui.buttons';

export type MenuOptions = PopupOptions & {
	/**
	 * The trigger the menu belongs to (`PopupOptions.bindElement`, so coordinates
	 * and a MouseEvent are accepted too — a context menu then has no trigger and
	 * the focus goes back where the menu took it from).
	 *
	 * When it is a node, it is expected to be the interactive control itself — the
	 * button or the link, not a wrapper around one. The menu stamps
	 * `aria-haspopup` / `aria-expanded` on it, derives the menu name from it and
	 * returns the focus to it on close; a non-focusable trigger additionally gets
	 * `tabindex="-1"`. On a generic wrapper those attributes mean nothing to a
	 * screen reader, the real control inside stays without them, and the name is
	 * built out of the whole wrapper's text.
	 *
	 * The stamps (and a generated `id`, if the trigger had none) are rolled back on
	 * `destroy()` or on a re-bind to another trigger, not on close: a consumer that
	 * owns the node beyond the menu's life must call `destroy()`, and a consumer
	 * that manages the trigger ARIA itself should keep owning it (see
	 * `ui.counterpanel`, `ui.navigationpanel`).
	 */
	bindElement?: PopupOptions['bindElement'],
	sections: MenuSectionOptions[],
	items: MenuItemOptions[],
	richHeader: {
		design: 'default' | 'copilot',
		title: string,
		subtitle: string,
		icon: string,
		onClick: Function,
	},
	closeOnItemClick: boolean,
	parentItem?: HTMLElement,
	onCloseAll?: () => void,
	/**
	 * Whether the focus sits anywhere in the whole open menu tree. A submenu level
	 * cannot answer that on its own — it sees only itself and the levels below — so
	 * the root passes its own answer down.
	 */
	hasTreeFocus?: () => boolean,
};

export type MenuItemOptions = {
	id: string,
	sectionCode: string,
	design: 'default' | 'accent-1' | 'accent-2' | 'alert' | 'copilot' | 'disabled',
	/**
	 * Marks the item unavailable (aria-disabled) without borrowing the visual
	 * `disabled` design for it. The item stays focusable and its onClick still
	 * runs — that is where a consumer explains why the item is unavailable.
	 */
	disabled?: boolean,
	onClick: Function,
	title: string,
	subtitle: string,
	badgeText: BadgeText,
	isSelected: boolean,
	icon: string,
	extraIcon: {
		icon: string,
		onClick: Function,
		isSelected: boolean,
	},
	counter: CounterOptions,
	svg: SVGElement,
	subMenu: MenuOptions,
	isLocked: boolean,
	closeOnSubItemClick: boolean,
	uiButtonOptions: ButtonOptions,
};

type BadgeText = {
	title: string,
	color: string,
};

export type MenuSectionOptions = {
	design: 'default' | 'accent',
	code: string,
	title: string,
};

export type MenuItemCallbacks = {
	getTargetContainer: Function,
	onMouseEnter: Function,
	onSubMenuItemClick: Function,
	onCloseAll: Function,
	hasTreeFocus: Function,
};
