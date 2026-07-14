/* eslint-disable */
declare namespace BX.Socialnetwork.V2.Components.Elements {
	const UiTextarea: BX.DefineComponent<BX.ExtractPropTypes<{
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
	}, BX.ComponentOptionsMixin, BX.ComponentOptionsMixin, "update:modelValue"[], "update:modelValue", BX.PublicProps, Readonly<BX.ExtractPropTypes<{
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
	}, {}, {}, {}, string, BX.ComponentProvideOptions, true, {}, any>;
}
