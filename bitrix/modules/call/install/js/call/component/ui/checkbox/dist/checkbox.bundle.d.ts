/* eslint-disable */
type CallCheckboxSize = typeof BX.Call.Component.Ui.CallCheckboxSizes extends Set<infer T> ? T : never;

type CallCheckboxColor = typeof BX.Call.Component.Ui.CallCheckboxColors extends Set<infer T> ? T : never;

declare namespace BX.Call.Component.Ui {
	const CallCheckbox: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
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
		indeterminate: {
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
		indeterminateValue: boolean;
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
		updateIndeterminate(): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, ("focus" | "blur" | "change" | "update:modelValue" | "value-change" | "update:indeterminate")[], "focus" | "blur" | "change" | "update:modelValue" | "value-change" | "update:indeterminate", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
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
		indeterminate: {
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
		"onUpdate:indeterminate"?: ((...args: any[]) => any) | undefined;
	}>, {
		size: string;
		name: string;
		color: string;
		modelValue: any;
		defaultValue: any;
		disabled: boolean;
		indeterminate: boolean;
		trueValue: any;
		falseValue: any;
		readOnly: boolean;
		inputId: string;
	}, {}, {
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
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CallCheckboxSizes: Set<"sm" | "md" | "lg">;

	const CallCheckboxColors: Set<"green" | null>;
}
