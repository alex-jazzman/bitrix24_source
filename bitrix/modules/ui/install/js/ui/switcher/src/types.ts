import { type AirSwitcherStyle, type SwitcherColor, type SwitcherSize } from './const';
import { type Switcher } from './switcher';

/**
 * A handler gets the native pointer event when the switch was clicked, and a bare `{}` when
 * the state was changed programmatically. Consumers call stopPropagation() on it, so the type
 * has to keep that reachable while staying optional for the programmatic path.
 */
export type SwitcherEvent = Partial<Pick<Event, 'stopPropagation' | 'preventDefault' | 'target'>>;

// `this`: handlers are invoked via .call(this, event), and consumers rely on it
// (e.g. this.isChecked() inside a toggled handler).
export type SwitcherEventHandler = (this: Switcher, event?: SwitcherEvent) => void;

export type SwitcherHandlers = {
	toggled?: SwitcherEventHandler;
	checked?: SwitcherEventHandler;
	unchecked?: SwitcherEventHandler;
	lock?: SwitcherEventHandler;
	unlock?: SwitcherEventHandler;
};

export type SwitcherEventName = keyof SwitcherHandlers;

export type SwitcherOptions = {
	attributeName?: string;
	node?: HTMLElement;
	// `string | number`: templates pass numeric ids, and a missing id falls back to Math.random().
	id?: string | number;
	checked?: boolean;
	inputName?: string;
	handlers?: SwitcherHandlers;
	size?: SwitcherSize;
	color?: SwitcherColor;
	disabled?: boolean;
	useAirDesign?: boolean;
	style?: AirSwitcherStyle;
	showStateTitle?: boolean;
	accessible?: boolean;
	ariaLabel?: string;
	ariaLabelledBy?: string;
};

/**
 * Keys coming from PHP templates in the `data-switcher` attribute. Deliberately narrower than
 * SwitcherOptions: templates send only the keys listed here and most often just `id`. Values are
 * unvalidated JSON, so the ones checked at runtime are typed loosely on purpose.
 */
export type SwitcherNodeData = {
	id?: string | number;
	checked?: unknown;
	inputName?: string;
	color?: string;
	size?: string;
	accessible?: unknown;
	ariaLabel?: unknown;
	ariaLabelledBy?: unknown;
};
