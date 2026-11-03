/* eslint-disable */
declare namespace BX.Call.Component.Ui {
	const CallInput: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		placeholder: {
			type: StringConstructor;
			default: string;
		};
		modelValue: {
			type: StringConstructor;
			default: string;
		};
		name: {
			type: StringConstructor;
			default: string;
		};
	}>, {}, {}, {}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, ("update:modelValue" | "enter")[], "update:modelValue" | "enter", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		placeholder: {
			type: StringConstructor;
			default: string;
		};
		modelValue: {
			type: StringConstructor;
			default: string;
		};
		name: {
			type: StringConstructor;
			default: string;
		};
	}>> & Readonly<{
		"onUpdate:modelValue"?: ((...args: any[]) => any) | undefined;
		onEnter?: ((...args: any[]) => any) | undefined;
	}>, {
		name: string;
		placeholder: string;
		modelValue: string;
	}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
}
