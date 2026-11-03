/* eslint-disable */
type CallButtonSize = typeof BX.Call.Component.Ui.CallButtonSizes extends Set<infer T> ? T : never;

type CallButtonColor = typeof BX.Call.Component.Ui.CallButtonColors extends Set<infer T> ? T : never;

type CallButtonVariant = typeof BX.Call.Component.Ui.CallButtonVariants extends Set<infer T> ? T : never;

type CallButtonLabelPosition = typeof BX.Call.Component.Ui.CallButtonLabelPositions extends Set<infer T> ? T : never;

declare namespace BX.Call.Component.Ui {
	const CallButton: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
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

	const CallButtonGroup: BX.Vue3.DefineComponent<{}, {}, {}, {}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CallButtonSplit: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		testId: {
			type: StringConstructor;
			default: null;
		};
	}>, {}, {}, {}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		testId: {
			type: StringConstructor;
			default: null;
		};
	}>> & Readonly<{}>, {
		testId: string;
	}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CallButtonSizes: Set<20 | 24 | 28 | 34 | 38 | 46 | 54>;

	const CallButtonColors: Set<"none" | "blue" | "red" | "green" | "purple" | "transparent" | "transparent-blue" | "transparent-yellow" | "transparent-red" | "transparent-black" | "gradient" | "copilot" | "hangup">;

	const CallButtonVariants: Set<"primary" | "tine" | "outline">;

	const CallButtonLabelPositions: Set<"inline" | "bottom" | "bottom-block">;
}
