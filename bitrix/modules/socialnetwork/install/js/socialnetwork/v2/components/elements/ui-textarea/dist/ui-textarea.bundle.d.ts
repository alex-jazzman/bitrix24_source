/* eslint-disable */
declare namespace BX.Socialnetwork.V2.Components.Elements {
	const UiTextarea: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		modelValue: {
			type: StringConstructor;
			default: string;
		};
		id: {
			type: StringConstructor;
			default: string;
		};
		placeholder: {
			type: StringConstructor;
			default: string;
		};
		disabled: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>, {}, {}, {}, {
		onInput(event: Event): void;
		adjustHeight(): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "update:modelValue"[], "update:modelValue", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		modelValue: {
			type: StringConstructor;
			default: string;
		};
		id: {
			type: StringConstructor;
			default: string;
		};
		placeholder: {
			type: StringConstructor;
			default: string;
		};
		disabled: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>> & Readonly<{
		"onUpdate:modelValue"?: ((...args: any[]) => any) | undefined;
	}>, {
		id: string;
		placeholder: string;
		modelValue: string;
		disabled: boolean;
	}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
}
