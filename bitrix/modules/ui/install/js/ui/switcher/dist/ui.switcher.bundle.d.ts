/* eslint-disable */
type SwitcherHandlers = {
	toggled?: SwitcherEventHandler;
	checked?: SwitcherEventHandler;
	unchecked?: SwitcherEventHandler;
	lock?: SwitcherEventHandler;
	unlock?: SwitcherEventHandler;
};

type SwitcherEventHandler = (this: BX.UI.Switcher, event?: SwitcherEvent) => void;

/**
 * A handler gets the native pointer event when the switch was clicked, and a bare `{}` when
 * the state was changed programmatically. Consumers call stopPropagation() on it, so the type
 * has to keep that reachable while staying optional for the programmatic path.
 */
type SwitcherEvent = Partial<Pick<Event, 'stopPropagation' | 'preventDefault' | 'target'>>;

type SwitcherEventName = keyof SwitcherHandlers;

type SwitcherOptions = {
	attributeName?: string;
	node?: HTMLElement;
	id?: string | number;
	checked?: boolean;
	inputName?: string;
	handlers?: SwitcherHandlers;
	size?: BX.UI.SwitcherSize;
	color?: BX.UI.SwitcherColor;
	disabled?: boolean;
	useAirDesign?: boolean;
	style?: BX.UI.AirSwitcherStyle;
	showStateTitle?: boolean;
	accessible?: boolean;
	ariaLabel?: string;
	ariaLabelledBy?: string;
};

type SwitcherSize = typeof BX.UI.SwitcherSize[keyof typeof BX.UI.SwitcherSize];

type SwitcherColor = typeof BX.UI.SwitcherColor[keyof typeof BX.UI.SwitcherColor];

type AirSwitcherStyle = typeof BX.UI.AirSwitcherStyle[keyof typeof BX.UI.AirSwitcherStyle];

declare namespace BX.UI {
	class Switcher {
		node: HTMLElement;
		checked: boolean;
		id: string | number;
		handlers: SwitcherHandlers;
		inputNode?: HTMLInputElement;
		events: Record<SwitcherEventName, SwitcherEventName>;
		static list: Switcher[];
		static className: string;
		static classNameOff: string;
		/**
		 * Switcher.
		 *
		 * @param {object} [options] - Options.
		 * @param {string} [options.attributeName] - Name of switcher attribute.
		 * @param {Element} [options.node] - Node.
		 * @param {string} [options.id] - ID.
		 * @param {123} [options.checked] - Checked.
		 * @param {string} [options.inputName] - Input name.
		 * @constructor
		 */
		constructor(options?: SwitcherOptions);
		static getById(id: string | number): Switcher | null;
		static initByClassName(): void;
		static getList(): Switcher[];
		init(options?: SwitcherOptions): void;
		/**
		 * Releases the instance. Every switcher is kept in the static list, so an owner that drops
		 * the node has to call this or the node and the handler closures stay reachable through it.
		 * Idempotent: a second call does nothing.
		 */
		destroy(): void;
		disable(disabled: boolean, fireEvents?: boolean, event?: SwitcherEvent): void;
		check(checked: boolean, fireEvents?: boolean, event?: SwitcherEvent): void;
		isDisabled(): boolean;
		isChecked(): boolean;
		toggle(event?: SwitcherEvent): void;
		setLoading(mode: boolean): void;
		isLoading(): boolean;
		setAirDesign(flag?: boolean): void;
		renderTo(targetNode: HTMLElement): void;
		getNode(): HTMLElement;
		getAttributeName(): string;
		getInputName(): string | undefined;
		setAriaLabel(value: string): void;
		getAriaLabel(): string;
		setAriaLabelledBy(value: string): void;
		getAriaLabelledBy(): string;
	}

	const SwitcherSize: {
		readonly extraLarge: "extra-large";
		readonly large: "large";
		readonly medium: "medium";
		readonly small: "small";
		readonly extraSmall: "extra-small";
		readonly extraExtraSmall: "extra-extra-small";
	};

	const SwitcherColor: {
		readonly primary: "primary";
		readonly green: "green";
	};

	const AirSwitcherStyle: {
		readonly FILLED: "FILLED";
		readonly SOLID: "SOLID";
		readonly TINTED: "TINTED";
		readonly FILLED_SUCCESS: "FILLED_SUCCESS";
		readonly FILLED_ALERT: "FILLED_ALERT";
		readonly FILLED_WARNING: "FILLED_WARNING";
		readonly FILLED_BLACK: "FILLED_BLACK";
		readonly FILLED_WHITE: "FILLED_WHITE";
		readonly FILLED_NO_ACCENT: "FILLED_NO_ACCENT";
		readonly FILLED_BITRIX_GPT: "FILLED_BITRIX_GPT";
		readonly FILLED_BOOST: "FILLED_BOOST";
		readonly TINTED_ACCENT_1: "TINTED_ACCENT_1";
		readonly TINTED_SUCCESS: "TINTED_SUCCESS";
		readonly TINTED_ALERT: "TINTED_ALERT";
		readonly TINTED_WARNING: "TINTED_WARNING";
		readonly TINTED_GREEN: "TINTED_GREEN";
		readonly TINTED_VIOLET: "TINTED_VIOLET";
		readonly TINTED_NO_ACCENT: "TINTED_NO_ACCENT";
		readonly TINTED_BITRIX_GPT: "TINTED_BITRIX_GPT";
		readonly OUTLINE: "OUTLINE";
		readonly OUTLINE_ACCENT_1: "OUTLINE_ACCENT_1";
		readonly OUTLINE_ACCENT_2: "OUTLINE_ACCENT_2";
		readonly OUTLINE_ALERT: "OUTLINE_ALERT";
		readonly OUTLINE_BOOST: "OUTLINE_BOOST";
		readonly OUTLINE_NO_ACCENT: "OUTLINE_NO_ACCENT";
		readonly OUTLINE_SUCCESS: "OUTLINE_SUCCESS";
		readonly OUTLINE_WARNING: "OUTLINE_WARNING";
		readonly OUTLINE_BITRIX_GPT: "OUTLINE_BITRIX_GPT";
		readonly SELECTION: "SELECTION";
	};
}
