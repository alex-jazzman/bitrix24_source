import type { BaseButtonOptions } from '../base-button-options';
import ButtonSize from './button-size';
import ButtonStyle from './button-style';
import AirButtonStyle from './air-button-style';
import ButtonColor from './button-color';
import ButtonIcon from './button-icon';
import ButtonState from './button-state';
import type { MenuOptions } from 'main.popup';
import type { CounterOptions } from 'ui.cnt';

/**
 * Native ui.system.menu options. Described structurally: ui.system.menu depends on ui.buttons,
 * so its types cannot be imported. The source of truth for the whole list of fields is ui.system.menu:
 * only the fields ui.buttons relies on are listed, the rest are passed to the menu as is.
 * The bindElement option is not supported: the menu is always bound to the button element.
 */
export type SystemMenuOptions = {
	items: Array<Object>,
	sections?: Array<Object>,
	richHeader?: Object,
	events?: {
		onClose?: Function,
		onDestroy?: Function,
		[event: string]: any,
	},
	[option: string]: any,
};

export type ButtonOptions = BaseButtonOptions & {
	size?: ButtonSize,
	color?: ButtonColor,
	icon?: ButtonIcon,
	collapsedIcon: ButtonIcon,
	state?: ButtonState,
	id?: string,
	menu?: MenuOptions,
	systemMenu?: SystemMenuOptions,
	context?: any,
	noCaps?: boolean,
	round?: boolean,
	dropdown?: boolean,
	dependOnTheme?: boolean,
	// Use only with useAirDesign: true option
	style?: ButtonStyle & AirButtonStyle;
	wide?: boolean;
	iconPosition?: 'left' | 'right';
	rightCounter?: CounterOptions;
	leftCounter?: CounterOptions;
	removeLeftCorners?: boolean;
	removeRightCorners?: boolean;
};
