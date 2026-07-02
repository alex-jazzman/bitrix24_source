import { type PopupOptions } from '../popup/popup-types';
import { MenuNavigationOptions } from './menu-navigation';

export type MenuOptions = PopupOptions & {
	items: MenuItemOptions[],
	subMenuOptions?: PopupOptions,
	navigationOptions: MenuNavigationOptions,
};

export type MenuItemOptions = {
	id?: string,
	text?: string,
	html?: string,
	title?: string,
	disabled?: boolean,
	focusable?: boolean,
	href?: string,
	target?: string,
	className?: string,
	attrs: { [key: string]: string },
	delimiter?: boolean,
	menuShowDelay?: number,
	subMenuOffsetX?: number,
	events?: { [event: string]: (event) => {} },
	dataset?: { [key: string]: string },
	onclick?: () => {} | string,
	cacheable?: boolean,
	items?: MenuItemOptions[]
};
