/* eslint-disable */
type WhatsNewAction = NonNullable<BX.UI.System.WhatsNew.WhatsNewOptions['actions']>[number];

type BaseButtonOptions = unknown;

type ButtonCounterOptions = unknown;

type ButtonCounterOptions = {
	color: string | null;
	style: CounterStyle | null;
	value: number | null;
	maxValue: number | null;
	useSymbolPercent?: boolean | undefined;
};

type ButtonOptions = unknown;

type SystemMenuOptions = unknown;

declare namespace BX.UI.System.WhatsNew.Vue {
	/**
	 * Thin Vue wrapper over the imperative WhatsNew. It draws no markup of the window: the class owns the whole
	 * of it, and the only nodes of the wrapper are the containers the slots render into through Teleport.
	 *
	 * The instance is built in created() and kept outside the reactive state - a Vue proxy breaks access to the
	 * private #-fields of the class. Of the props only those the class has a setter for reach a live window
	 * (currentStep, currentSlide, backdropColor, items, actions); the rest are read once, when the instance is
	 * built.
	 *
	 * The window is opened by the consumer: `this.$refs.dialog.show()`.
	 */
	const BWhatsNew: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		size: {
			type: BX.Vue3.PropType<BX.UI.System.WhatsNew.WhatsNewSize>;
			default: "m";
			validator: (value: string) => boolean;
		};
		mediaPosition: {
			type: BX.Vue3.PropType<BX.UI.System.WhatsNew.WhatsNewMediaPosition>;
			default: "top";
			validator: (value: string) => boolean;
		};
		actionsAlign: {
			type: BX.Vue3.PropType<BX.UI.System.WhatsNew.WhatsNewActionsAlign>;
			default: "right";
			validator: (value: string) => boolean;
		};
		stepCount: {
			type: NumberConstructor;
			default: number;
		};
		currentStep: {
			type: NumberConstructor;
			default: number;
		};
		label: {
			type: StringConstructor;
			default: string;
		};
		title: {
			type: StringConstructor;
			default: string;
		};
		titleBrand: {
			type: StringConstructor;
			default: string;
		};
		subtitle: {
			type: StringConstructor;
			default: string;
		};
		items: {
			type: BX.Vue3.PropType<BX.UI.System.WhatsNew.WhatsNewItem[]>;
			default: () => BX.UI.System.WhatsNew.WhatsNewItem[];
		};
		scene: {
			type: BX.Vue3.PropType<BX.UI.System.WhatsNew.WhatsNewScene | null>;
			default: null;
		};
		video: {
			type: BX.Vue3.PropType<BX.UI.System.WhatsNew.WhatsNewVideo | null>;
			default: null;
		};
		gallery: {
			type: BX.Vue3.PropType<BX.UI.System.WhatsNew.WhatsNewGallerySlide[]>;
			default: () => BX.UI.System.WhatsNew.WhatsNewGallerySlide[];
		};
		galleryNav: {
			type: BX.Vue3.PropType<BX.UI.System.WhatsNew.WhatsNewGalleryNav>;
			default: "sides";
			validator: (value: string) => boolean;
		};
		currentSlide: {
			type: BX.Vue3.PropType<number | null>;
			default: null;
		};
		parallax: {
			type: BooleanConstructor;
			default: boolean;
		};
		backdrop: {
			type: BX.Vue3.PropType<BX.UI.System.WhatsNew.WhatsNewBackdrop>;
			default: "none";
			validator: (value: string) => boolean;
		};
		backdropColor: {
			type: BX.Vue3.PropType<BX.UI.System.WhatsNew.WhatsNewColor>;
			default: "dark-blue";
			validator: (value: string) => boolean;
		};
		actions: {
			type: BX.Vue3.PropType<WhatsNewAction[]>;
			default: () => WhatsNewAction[];
		};
		hasOverlay: {
			type: BooleanConstructor;
			default: boolean;
		};
		disableScrolling: {
			type: BooleanConstructor;
			default: boolean;
		};
		closeByEsc: {
			type: BooleanConstructor;
			default: boolean;
		};
		closeByClickOutside: {
			type: BooleanConstructor;
			default: boolean;
		};
		hasCloseButton: {
			type: BooleanConstructor;
			default: boolean;
		};
		closable: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>, {}, {
		dialog: BX.UI.System.WhatsNew.WhatsNew | null;
		slideNodes: Record<string, HTMLElement>;
	}, {}, {
		buildSlideNodes(): Record<string, HTMLElement>;
		buildOptions(): BX.UI.System.WhatsNew.WhatsNewOptions;
		show(): void;
		hide(): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, ("close" | "show" | "hide" | "afterShow" | "afterHide" | "itemClick" | "stepChange" | "slideChange" | "backdropColorChange")[], "close" | "show" | "hide" | "afterShow" | "afterHide" | "itemClick" | "stepChange" | "slideChange" | "backdropColorChange", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		size: {
			type: BX.Vue3.PropType<BX.UI.System.WhatsNew.WhatsNewSize>;
			default: "m";
			validator: (value: string) => boolean;
		};
		mediaPosition: {
			type: BX.Vue3.PropType<BX.UI.System.WhatsNew.WhatsNewMediaPosition>;
			default: "top";
			validator: (value: string) => boolean;
		};
		actionsAlign: {
			type: BX.Vue3.PropType<BX.UI.System.WhatsNew.WhatsNewActionsAlign>;
			default: "right";
			validator: (value: string) => boolean;
		};
		stepCount: {
			type: NumberConstructor;
			default: number;
		};
		currentStep: {
			type: NumberConstructor;
			default: number;
		};
		label: {
			type: StringConstructor;
			default: string;
		};
		title: {
			type: StringConstructor;
			default: string;
		};
		titleBrand: {
			type: StringConstructor;
			default: string;
		};
		subtitle: {
			type: StringConstructor;
			default: string;
		};
		items: {
			type: BX.Vue3.PropType<BX.UI.System.WhatsNew.WhatsNewItem[]>;
			default: () => BX.UI.System.WhatsNew.WhatsNewItem[];
		};
		scene: {
			type: BX.Vue3.PropType<BX.UI.System.WhatsNew.WhatsNewScene | null>;
			default: null;
		};
		video: {
			type: BX.Vue3.PropType<BX.UI.System.WhatsNew.WhatsNewVideo | null>;
			default: null;
		};
		gallery: {
			type: BX.Vue3.PropType<BX.UI.System.WhatsNew.WhatsNewGallerySlide[]>;
			default: () => BX.UI.System.WhatsNew.WhatsNewGallerySlide[];
		};
		galleryNav: {
			type: BX.Vue3.PropType<BX.UI.System.WhatsNew.WhatsNewGalleryNav>;
			default: "sides";
			validator: (value: string) => boolean;
		};
		currentSlide: {
			type: BX.Vue3.PropType<number | null>;
			default: null;
		};
		parallax: {
			type: BooleanConstructor;
			default: boolean;
		};
		backdrop: {
			type: BX.Vue3.PropType<BX.UI.System.WhatsNew.WhatsNewBackdrop>;
			default: "none";
			validator: (value: string) => boolean;
		};
		backdropColor: {
			type: BX.Vue3.PropType<BX.UI.System.WhatsNew.WhatsNewColor>;
			default: "dark-blue";
			validator: (value: string) => boolean;
		};
		actions: {
			type: BX.Vue3.PropType<WhatsNewAction[]>;
			default: () => WhatsNewAction[];
		};
		hasOverlay: {
			type: BooleanConstructor;
			default: boolean;
		};
		disableScrolling: {
			type: BooleanConstructor;
			default: boolean;
		};
		closeByEsc: {
			type: BooleanConstructor;
			default: boolean;
		};
		closeByClickOutside: {
			type: BooleanConstructor;
			default: boolean;
		};
		hasCloseButton: {
			type: BooleanConstructor;
			default: boolean;
		};
		closable: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>> & Readonly<{
		onShow?: ((...args: any[]) => any) | undefined;
		onHide?: ((...args: any[]) => any) | undefined;
		onAfterShow?: ((...args: any[]) => any) | undefined;
		onClose?: ((...args: any[]) => any) | undefined;
		onItemClick?: ((...args: any[]) => any) | undefined;
		onAfterHide?: ((...args: any[]) => any) | undefined;
		onBackdropColorChange?: ((...args: any[]) => any) | undefined;
		onSlideChange?: ((...args: any[]) => any) | undefined;
		onStepChange?: ((...args: any[]) => any) | undefined;
	}>, {
		size: BX.UI.System.WhatsNew.WhatsNewSize;
		label: string;
		title: string;
		video: BX.UI.System.WhatsNew.WhatsNewVideo | null;
		closeByClickOutside: boolean;
		closeByEsc: boolean;
		hasOverlay: boolean;
		items: BX.UI.System.WhatsNew.WhatsNewItem[];
		scene: BX.UI.System.WhatsNew.WhatsNewScene | null;
		actions: import("../../../../../buttons/src").Button[];
		mediaPosition: BX.UI.System.WhatsNew.WhatsNewMediaPosition;
		actionsAlign: BX.UI.System.WhatsNew.WhatsNewActionsAlign;
		stepCount: number;
		currentStep: number;
		titleBrand: string;
		subtitle: string;
		gallery: BX.UI.System.WhatsNew.WhatsNewGallerySlide[];
		galleryNav: BX.UI.System.WhatsNew.WhatsNewGalleryNav;
		currentSlide: number | null;
		parallax: boolean;
		backdrop: BX.UI.System.WhatsNew.WhatsNewBackdrop;
		backdropColor: BX.UI.System.WhatsNew.WhatsNewColor;
		disableScrolling: boolean;
		hasCloseButton: boolean;
		closable: boolean;
	}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	/**
	 * @namespace {BX.UI}
	 */
	class Button extends BaseButton {
		static BASE_CLASS: string;
		static Size: typeof ButtonSize;
		static Color: typeof ButtonColor;
		static State: typeof ButtonState;
		static Icon: typeof ButtonIcon;
		static Tag: typeof ButtonTag;
		static Style: typeof ButtonStyle;
		static AirStyle: typeof AirButtonStyle;
		constructor(options: ButtonOptions);
		isDependOnTheme: any;
		size: any;
		color: any;
		icon: any;
		state: any;
		id: string | null;
		context: any;
		menuWindow: Object | null;
		/**
		 * @protected
		 */
		protected handleMenuClick(event: MouseEvent): void;
		setText(text: string): this;
		setProps(props: {
			[propertyName: string]: string;
		}): this;
		setDataSet(props: {
			[propertyName: string]: string;
		}): this;
		setSize(size: ButtonSize | null): this;
		getSize(): ButtonSize | null;
		setColor(color: ButtonColor | null): this;
		getColor(): ButtonColor | null;
		setIcon(icon: string | null, iconPosition?: "right" | "left"): this;
		setCollapsedIcon(icon: ButtonIcon | null): this;
		getIcon(): ButtonIcon | null;
		setState(state: ButtonState | null): this;
		getState(): ButtonState | null;
		setNoCaps(noCaps?: boolean): this;
		isNoCaps(): boolean;
		setRound(round?: boolean): this;
		isRound(): boolean;
		setDependOnTheme(dependOnTheme?: boolean): this;
		setDropdown(dropdown?: boolean): this;
		isDropdown(): boolean;
		setCollapsed(collapsed?: boolean): this;
		isCollapsed(): boolean;
		setLeftCorners(withLeftCorners?: boolean): this;
		setRightCorners(withRightCorners?: boolean): this;
		/**
		 * @protected
		 */
		protected setMenu(options: BX.Main.MenuOptions): this;
		/**
		 * Sets a menu rendered by the ui.system.menu extension instead of the main.popup one.
		 * Passing false removes it, while the PHP setter takes null for that. The arrow is a caller's
		 * concern here, unlike the PHP setter, which keeps it in sync itself.
		 */
		setSystemMenu(options: SystemMenuOptions | false): this;
		/**
		 * Returns the menu instance, which is created on the first opening: the ui.system.menu class
		 * is available at runtime only. A menu that has never been opened gives null, unlike
		 * getMenuWindow(), which has its instance right after setMenu().
		 */
		getSystemMenu(): Object | null;
		/**
		 * Unlike getSystemMenu(), tells a kind of the set menu apart even before its first opening.
		 */
		hasSystemMenu(): boolean;
		getMenuBindElement(): HTMLElement;
		getMenuClickElement(): HTMLElement;
		/**
		 * @protected
		 */
		protected handleMenuShow(): void;
		/**
		 * @protected
		 */
		protected handleMenuClose(): void;
		getMenuWindow(): BX.Main.Menu | null;
		setId(id: string | null): this;
		getId(): string | null;
		setActive(active?: boolean): this;
		isActive(): boolean;
		setHovered(hovered?: boolean): this;
		isHover(): boolean;
		setDisabled(disabled?: boolean): this;
		setWaiting(waiting?: boolean): this;
		isWaiting(): boolean;
		setClocking(clocking?: boolean): this;
		isClocking(): boolean;
		/**
		 * @protected
		 */
		protected setProperty(property: string, value?: any, enumeration: Object): this;
		setContext(context: any): this;
		getContext(): any;
		setWide(isWide: boolean): this;
		isWide(): boolean;
		setStyle(style: string): void;
		getStyle(): string;
		setLeftCounter(options: BX.UI.ButtonCounterOptions | null): this;
		setRightCounter(options: BX.UI.ButtonCounterOptions | null): this;
		/**
		 * @protected
		 */
		protected prepareCounterOptions(options: BX.UI.ButtonCounterOptions | null): BX.UI.ButtonCounterOptions | null;
		startShimmer(): void;
		stopShimmer(): void;
	}

	class BaseButton {
		constructor(options: BaseButtonOptions);
		options: Object & BaseButtonOptions;
		/**
		 * 'buttonNode', 'textNode' and counterNode options use only in ButtonManager.createFromNode
		 */
		button: any;
		textNode: any;
		counterNode: any;
		text: string;
		counter: string | number | null;
		events: {};
		link: string;
		maxWidth: number | null;
		tag: ButtonTag | undefined;
		baseClass: string;
		disabled: boolean;
		/**
		 * @protected
		 */
		protected init(): void;
		setAirDesign(use: boolean): void;
		hasAirDesign(): boolean;
		/**
		 * @protected
		 */
		protected getDefaultOptions(): Object;
		render(): HTMLElement;
		renderTo(node: HTMLElement): HTMLElement;
		getContainer(): HTMLElement;
		/**
		 * @protected
		 */
		protected getBaseClass(): string;
		setText(text: string): this;
		getTextContainer(): HTMLElement;
		getText(): string;
		/**
		 * Use for buttons with air option
		 * Use only to create or delete a counter. Update counter value via getLeftCounter() method.
		 *
		 * @param options Object | null Object for creating. null for deleting.
		 */
		setLeftCounter(options: ButtonCounterOptions | null): this;
		/**
		 * Use for buttons with air option
		 * Use only to create or delete a counter. Update counter value via getRightCounter() method.
		 *
		 * @param options Object | null Object for creating. null for deleting.
		 */
		setRightCounter(options: ButtonCounterOptions | null): this;
		getLeftCounter(): ButtonCounter;
		getRightCounter(): ButtonCounter;
		/**
		 * use for old buttons (without useAirTheme option)
		 */
		setCounter(counter: number | string): this;
		getCounter(): number | string | null;
		setLink(link: string): this;
		getLink(): string;
		setMaxWidth(maxWidth: number): this;
		getMaxWidth(): number | null;
		getTag(): ButtonTag;
		setProps(props: {
			[propertyName: string]: string;
		}): this;
		getProps(): {
			[property: string]: string;
		};
		setDataSet(props: {
			[propertyName: string]: string;
		}): this;
		getDataSet(): DOMStringMap;
		addClass(className: string): this;
		removeClass(className: string): this;
		setDisabled(disabled?: boolean): this;
		isDisabled(): boolean;
		isInputType(): boolean;
		bindEvents(events: {
			[event: string]: (button: this, event: MouseEvent) => {};
		}): this;
		unbindEvents(events: string[]): this;
		bindEvent(eventName: string, fn: (button: this, event: MouseEvent) => {}): this;
		unbindEvent(eventName: string): this;
		/**
		 * @protected
		 */
		protected isEnumValue(value: any, enumeration: Object): boolean;
	}

	/**
	 * @namespace {BX.UI}
	 */
	class ButtonTag {
		static BUTTON: number;
		static LINK: number;
		static SUBMIT: number;
		static INPUT: number;
		static DIV: number;
		static SPAN: number;
	}

	class ButtonCounter {
		constructor(options: ButtonCounterOptions);
		render(): HTMLElement;
		getValue(): number;
		setValue(value: number): void;
		setColor(color: string): void;
		setStyle(style: BX.UI.CounterStyle): void;
		validateOptions(options: ButtonCounterOptions): void;
	}

	/**
	 * @namespace {BX.UI}
	 */
	class ButtonSize {
		static EXTRA_LARGE: string;
		static LARGE: string;
		static MEDIUM: string;
		static SMALL: string;
		static EXTRA_SMALL: string;
		static EXTRA_EXTRA_SMALL: string;
	}

	/**
	 * @namespace {BX.UI}
	 */
	class ButtonColor {
		static DANGER: string;
		static DANGER_DARK: string;
		static DANGER_LIGHT: string;
		static SUCCESS: string;
		static SUCCESS_DARK: string;
		static SUCCESS_LIGHT: string;
		static PRIMARY_DARK: string;
		static PRIMARY: string;
		static SECONDARY: string;
		static SECONDARY_LIGHT: string;
		static WARNING_LIGHT: string;
		static LINK: string;
		static LIGHT: string;
		static LIGHT_BORDER: string;
		static AI: string;
		static BASE_LIGHT: string;
		static COLLAB: string;
		static PRIMARY_BORDER: string;
		static CURTAIN_PRIMARY: string;
		static CURTAIN_WARNING: string;
	}

	/**
	 * @namespace {BX.UI}
	 */
	class ButtonState {
		static HOVER: string;
		static ACTIVE: string;
		static DISABLED: string;
		static CLOCKING: string;
		static WAITING: string;
		static AI_WAITING: string;
	}

	/**
	 * @namespace {BX.UI}
	 */
	class ButtonIcon {
		static UNFOLLOW: string;
		static FOLLOW: string;
		static ADD: string;
		static ADD_M: string;
		static STOP: string;
		static START: string;
		static PAUSE: string;
		static ADD_FOLDER: string;
		static SETTING: string;
		static TASK: string;
		static INFO: string;
		static SEARCH: string;
		static PRINT: string;
		static LIST: string;
		static BUSINESS: string;
		static BUSINESS_CONFIRM: string;
		static BUSINESS_WARNING: string;
		static CAMERA: string;
		static PHONE_UP: string;
		static PHONE_DOWN: string;
		static PHONE_CALL: string;
		static BACK: string;
		static REMOVE: string;
		static DOWNLOAD: string;
		static DOTS: string;
		static DONE: string;
		static CANCEL: string;
		static DISK: string;
		static LOCK: string;
		static MAIL: string;
		static CHAT: string;
		static PAGE: string;
		static CLOUD: string;
		static EDIT: string;
		static SHARE: string;
		static ANGLE_UP: string;
		static ANGLE_DOWN: string;
		static EYE_OPENED: string;
		static EYE_CLOSED: string;
		static ALERT: string;
		static FAIL: string;
		static SUCCESS: string;
		static PLAN: string;
		static TARIFF: string;
		static BATTERY: string;
		static NO_BATTERY: string;
		static HALF_BATTERY: string;
		static LOW_BATTERY: string;
		static CRIT_BATTERY: string;
		static DEMO: string;
		static ROBOTS: string;
		static NOTE: string;
		static SCRIPT: string;
		static PRINT2: string;
		static FUNNEL: string;
		static FORWARD: string;
		static COPY: string;
		static AI: string;
		static BUSINESS_NEW: string;
		static OUTLINE_ADD: string;
		static HELP: string;
		static CHECK: string;
		static CHEVRON_LEFT_S: string;
		static CHEVRON_RIGHT_S: string;
		static REFRESH: string;
		static APPS: string;
		static IMAGE: string;
		static CITY: string;
		static TWO_PERSONS: string;
		static COPILOT: string;
		static RELOAD: string;
		static WORKFLOW: string;
		static PERSON: string;
		static WORKFLOW_STOP: string;
		static MARKET: string;
		static KEY: string;
		static MAIL_PLUS: string;
		static FUNNEL_FILTER: string;
		static CALENDAR_WITH_SLOTS: string;
		static CHATS: string;
		static CALENDAR_WITH_CHECKS: string;
		static EXCLAMATION: string;
	}

	/**
	 * @namespace {BX.UI}
	 */
	class ButtonStyle {
		static NO_CAPS: string;
		static ROUND: string;
		static DROPDOWN: string;
		static COLLAPSED: string;
		static DEPEND_ON_THEME: string;
	}

	/**
	 * @namespace {BX.UI}
	 */
	class AirButtonStyle {
		static FILLED: string;
		static FILLED_WHITE: string;
		static FILLED_BITRIX_GPT: string;
		static TINTED: string;
		static TINTED_ALERT: string;
		static TINTED_BITRIX_GPT: string;
		static OUTLINE_ACCENT_1: string;
		static OUTLINE_ACCENT_2: string;
		static OUTLINE: string;
		static OUTLINE_NO_ACCENT: string;
		static OUTLINE_BITRIX_GPT: string;
		static PLAIN_ACCENT: string;
		static PLAIN: string;
		static PLAIN_NO_ACCENT: string;
		static SELECTION: string;
		static FILLED_COPILOT: string;
		static FILLED_SUCCESS: string;
		static FILLED_ALERT: string;
		static FILLED_BOOST: string;
	}
}
