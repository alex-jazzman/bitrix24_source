/* eslint-disable */
type CallToggleColor = typeof BX.Call.Component.Ui.CallToggleColors extends Set<infer T> ? T : never;

type CallToggleSize = typeof BX.Call.Component.Ui.CallToggleSizes extends Set<infer T> ? T : never;

declare namespace BX.Call.Component.Ui {
	const CallToggle: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		testId: {
			type: StringConstructor;
			required: true;
		};
		modelValue: {
			type: null;
			default: undefined;
		};
		defaultValue: {
			type: null;
			default: undefined;
		};
		name: {
			type: StringConstructor;
			default: undefined;
		};
		disabled: {
			type: BooleanConstructor;
			default: boolean;
		};
		trueValue: {
			type: null;
			default: boolean;
		};
		falseValue: {
			type: null;
			default: boolean;
		};
		readOnly: {
			type: BooleanConstructor;
			default: boolean;
		};
		inputId: {
			type: StringConstructor;
			default: null;
		};
		size: {
			type: StringConstructor;
			default: string;
			validator: (value: string) => boolean;
		};
		color: {
			type: StringConstructor;
			default: null;
			validator: (value: string | null) => boolean;
		};
	}>, {}, {
		dataValue: unknown;
	}, {
		inProps(): Record<string, unknown>;
		controlled(): boolean;
		checked(): boolean;
		additionalClasses(): string[];
	}, {
		writeValue(value: unknown): void;
		onChange(event: Event): void;
		onFocus(event: FocusEvent): void;
		onBlur(event: FocusEvent): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, ("focus" | "blur" | "change" | "update:modelValue" | "value-change")[], "focus" | "blur" | "change" | "update:modelValue" | "value-change", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		testId: {
			type: StringConstructor;
			required: true;
		};
		modelValue: {
			type: null;
			default: undefined;
		};
		defaultValue: {
			type: null;
			default: undefined;
		};
		name: {
			type: StringConstructor;
			default: undefined;
		};
		disabled: {
			type: BooleanConstructor;
			default: boolean;
		};
		trueValue: {
			type: null;
			default: boolean;
		};
		falseValue: {
			type: null;
			default: boolean;
		};
		readOnly: {
			type: BooleanConstructor;
			default: boolean;
		};
		inputId: {
			type: StringConstructor;
			default: null;
		};
		size: {
			type: StringConstructor;
			default: string;
			validator: (value: string) => boolean;
		};
		color: {
			type: StringConstructor;
			default: null;
			validator: (value: string | null) => boolean;
		};
	}>> & Readonly<{
		onFocus?: ((...args: any[]) => any) | undefined;
		onBlur?: ((...args: any[]) => any) | undefined;
		onChange?: ((...args: any[]) => any) | undefined;
		"onUpdate:modelValue"?: ((...args: any[]) => any) | undefined;
		"onValue-change"?: ((...args: any[]) => any) | undefined;
	}>, {
		size: string;
		name: string;
		modelValue: any;
		defaultValue: any;
		disabled: boolean;
		trueValue: any;
		falseValue: any;
		readOnly: boolean;
		inputId: string;
		color: string;
	}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CallToggleColors: Set<"green" | "sky" | null>;

	const CallToggleSizes: Set<"xs" | "sm" | "md" | "lg" | "xl">;
}
