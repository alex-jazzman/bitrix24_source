import { type PopupOptions } from '../popup/popup-types';
import { type MenuItem } from './menu-item';
import { type MenuNavigationOptions } from './menu-navigation';

export type MenuItemOnClick = (event: MouseEvent, item: MenuItem) => unknown;

export type MenuOptions = PopupOptions & {
	items?: MenuItemOptions[];
	subMenuOptions?: PopupOptions;
	navigationOptions?: MenuNavigationOptions;
	menuShowDelay?: number;
};

export type MenuLegacyOptions = MenuOptions & Record<string, unknown>;

export type MenuItemOptions = {
	id?: string;
	text?: string;
	html?: string | HTMLElement;
	title?: string;
	disabled?: boolean;
	focusable?: boolean;
	href?: string;
	target?: string;
	className?: string;
	attrs?: { [key: string]: string };
	delimiter?: boolean;
	menuShowDelay?: number;
	subMenuOffsetX?: number;
	events?: { [event: string]: (event: Event) => void };
	dataset?: { [key: string]: string };
	onclick?: MenuItemOnClick | string;
	cacheable?: boolean;
	items?: MenuItemOptions[];
};
