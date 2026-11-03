/* eslint-disable */
declare namespace BX.Call.Component.Block {
	const CallScreenShareButton: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		testId: {
			type: StringConstructor;
			default: null;
			required: true;
		};
		isPip: {
			type: BooleanConstructor;
			default: boolean;
		};
		isDesktop: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>, {
		mediaStore: BX.Call.Store.MediaStoreInstance;
		uiStore: BX.Call.Store.UiStoreInstance;
	}, {}, {
		isActive(): boolean;
		disabled(): boolean;
		hotkey(): BX.Call.Helper.Hotkey;
		tooltip(): string;
		testState(): string;
		testMeta(): string | null;
	}, {
		handleClick(): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, never[], never, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		testId: {
			type: StringConstructor;
			default: null;
			required: true;
		};
		isPip: {
			type: BooleanConstructor;
			default: boolean;
		};
		isDesktop: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>> & Readonly<{}>, {
		testId: string;
		isDesktop: boolean;
		isPip: boolean;
	}, {}, {
		CallButton: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			testId: {
				type: StringConstructor;
				default: null;
				required: true;
			};
			testState: {
				type: StringConstructor;
				default: null;
			};
			testMeta: {
				type: StringConstructor;
				default: null;
			};
			label: {
				type: StringConstructor;
				default: null;
			};
			labelPosition: {
				type: StringConstructor;
				default: string;
				validator: (value: string) => boolean;
			};
			disabled: {
				type: BooleanConstructor;
				default: boolean;
			};
			cornerDisabled: {
				type: BooleanConstructor;
				default: boolean;
			};
			readonly: {
				type: BooleanConstructor;
				default: boolean;
			};
			cornerReadonly: {
				type: BooleanConstructor;
				default: boolean;
			};
			square: {
				type: BooleanConstructor;
				default: boolean;
			};
			hug: {
				type: BooleanConstructor;
				default: boolean;
			};
			size: {
				type: NumberConstructor;
				default: number;
				validator: (value: number) => boolean;
			};
			width: {
				type: NumberConstructor;
				default: null;
			};
			corner: {
				type: BooleanConstructor;
				default: boolean;
			};
			circle: {
				type: BooleanConstructor;
				default: boolean;
			};
			animated: {
				type: BooleanConstructor;
				default: boolean;
			};
			border: {
				type: BooleanConstructor;
				default: boolean;
			};
			color: {
				type: StringConstructor;
				default: string;
				validator: (value: string) => boolean;
			};
			variant: {
				type: StringConstructor;
				default: string;
				validator: (value: string) => boolean;
			};
			collapsed: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>, {}, {}, {
			rootClasses(): string[];
			hasBottomLabel(): boolean;
			hasInlineLabel(): boolean;
			hasVisibleLabel(): boolean;
			rootAttrs(): Record<string, unknown>;
			dropsExternalAriaLabel(): boolean;
			buttonAttrs(): Record<string, unknown>;
			isUnavailable(): boolean;
			bodyClasses(): string[];
			cornerClasses(): string[];
			additionalStyles(): Record<string, string | null>;
			bodyTestState(): string | null;
			cornerTestState(): string | null;
		}, {
			onClick(event: MouseEvent): void;
			onCornerClick(event: MouseEvent): void;
		}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, ("click" | "corner-click")[], "click" | "corner-click", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			testId: {
				type: StringConstructor;
				default: null;
				required: true;
			};
			testState: {
				type: StringConstructor;
				default: null;
			};
			testMeta: {
				type: StringConstructor;
				default: null;
			};
			label: {
				type: StringConstructor;
				default: null;
			};
			labelPosition: {
				type: StringConstructor;
				default: string;
				validator: (value: string) => boolean;
			};
			disabled: {
				type: BooleanConstructor;
				default: boolean;
			};
			cornerDisabled: {
				type: BooleanConstructor;
				default: boolean;
			};
			readonly: {
				type: BooleanConstructor;
				default: boolean;
			};
			cornerReadonly: {
				type: BooleanConstructor;
				default: boolean;
			};
			square: {
				type: BooleanConstructor;
				default: boolean;
			};
			hug: {
				type: BooleanConstructor;
				default: boolean;
			};
			size: {
				type: NumberConstructor;
				default: number;
				validator: (value: number) => boolean;
			};
			width: {
				type: NumberConstructor;
				default: null;
			};
			corner: {
				type: BooleanConstructor;
				default: boolean;
			};
			circle: {
				type: BooleanConstructor;
				default: boolean;
			};
			animated: {
				type: BooleanConstructor;
				default: boolean;
			};
			border: {
				type: BooleanConstructor;
				default: boolean;
			};
			color: {
				type: StringConstructor;
				default: string;
				validator: (value: string) => boolean;
			};
			variant: {
				type: StringConstructor;
				default: string;
				validator: (value: string) => boolean;
			};
			collapsed: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>> & Readonly<{
			onClick?: ((...args: any[]) => any) | undefined;
			"onCorner-click"?: ((...args: any[]) => any) | undefined;
		}>, {
			size: number;
			label: string;
			testId: string;
			testState: string;
			testMeta: string;
			labelPosition: string;
			disabled: boolean;
			cornerDisabled: boolean;
			readonly: boolean;
			cornerReadonly: boolean;
			square: boolean;
			hug: boolean;
			width: number;
			corner: boolean;
			circle: boolean;
			animated: boolean;
			border: boolean;
			color: string;
			variant: string;
			collapsed: boolean;
		}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		CallIcon: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			icon: {
				type: StringConstructor;
				required: true;
				validator: (value: string) => boolean;
			};
			color: {
				type: StringConstructor;
				default: string;
				validator: (value: string) => boolean;
			};
			size: {
				type: NumberConstructor;
				default: number;
				validator: (value: number) => boolean;
			};
		}>, {}, {}, {
			additionalClasses(): string[];
			additionalStyles(): Record<string, string>;
		}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			icon: {
				type: StringConstructor;
				required: true;
				validator: (value: string) => boolean;
			};
			color: {
				type: StringConstructor;
				default: string;
				validator: (value: string) => boolean;
			};
			size: {
				type: NumberConstructor;
				default: number;
				validator: (value: number) => boolean;
			};
		}>> & Readonly<{}>, {
			size: number;
			color: string;
		}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		CallTooltip: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			value: {
				type: StringConstructor;
				default: string;
			};
			disabled: {
				type: BooleanConstructor;
				default: boolean;
			};
			testId: {
				type: StringConstructor;
				default: string;
			};
			tooltipClass: {
				type: StringConstructor;
				default: string;
			};
			position: {
				type: StringConstructor;
				default: "right" | "left" | "bottom" | "top";
				validator: (value: string) => boolean;
			};
		}>, {}, {}, {
			tooltipClasses(): string[];
			isTooltipVisible(): boolean;
		}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			value: {
				type: StringConstructor;
				default: string;
			};
			disabled: {
				type: BooleanConstructor;
				default: boolean;
			};
			testId: {
				type: StringConstructor;
				default: string;
			};
			tooltipClass: {
				type: StringConstructor;
				default: string;
			};
			position: {
				type: StringConstructor;
				default: "right" | "left" | "bottom" | "top";
				validator: (value: string) => boolean;
			};
		}>> & Readonly<{}>, {
			value: string;
			testId: string;
			disabled: boolean;
			tooltipClass: string;
			position: string;
		}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
}
