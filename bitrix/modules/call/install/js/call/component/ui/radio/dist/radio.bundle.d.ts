/* eslint-disable */
type CallRadioSize = typeof BX.Call.Component.Ui.CallRadioSizes extends Set<infer T> ? T : never;

type CallRadioColor = typeof BX.Call.Component.Ui.CallRadioColors extends Set<infer T> ? T : never;

declare namespace BX.Call.Component.Ui {
	const CallRadio: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
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
		value: {
			type: null;
			default: undefined;
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
		additionalClasses(): string[];
		checked(): boolean;
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
		value: {
			type: null;
			default: undefined;
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
		value: any;
		modelValue: any;
		defaultValue: any;
		disabled: boolean;
		readOnly: boolean;
		inputId: string;
		color: string;
	}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CallRadioSizes: Set<"sm" | "md" | "lg">;

	const CallRadioColors: Set<"green" | null>;
}
