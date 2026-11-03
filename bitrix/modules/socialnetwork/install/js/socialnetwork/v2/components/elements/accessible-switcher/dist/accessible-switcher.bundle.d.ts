/* eslint-disable */
declare namespace BX.Socialnetwork.V2.Components.Elements {
	const AccessibleSwitcher: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		modelValue: {
			type: BooleanConstructor;
			default: boolean;
		};
		ariaLabel: {
			type: StringConstructor;
			required: true;
		};
		options: {
			type: BX.Vue3.PropType<Partial<BX.UI.SwitcherOptions>>;
			default: () => Partial<BX.UI.SwitcherOptions>;
		};
	}>, {}, {}, {}, {
		onCheck(): void;
		onUncheck(): void;
		onKeyboardToggle(): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "update:modelValue"[], "update:modelValue", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		modelValue: {
			type: BooleanConstructor;
			default: boolean;
		};
		ariaLabel: {
			type: StringConstructor;
			required: true;
		};
		options: {
			type: BX.Vue3.PropType<Partial<BX.UI.SwitcherOptions>>;
			default: () => Partial<BX.UI.SwitcherOptions>;
		};
	}>> & Readonly<{
		"onUpdate:modelValue"?: ((...args: any[]) => any) | undefined;
	}>, {
		options: Partial<BX.UI.SwitcherOptions>;
		modelValue: boolean;
	}, {}, {
		UiSwitcher: {
			name: string;
			emits: string[];
			props: {
				isChecked: {
					type: BooleanConstructor;
					required: boolean;
				};
				isDisabled: {
					type: BooleanConstructor;
					default: boolean;
				};
				options: {
					type: BX.UI.SwitcherOptions;
					default: {};
				};
			};
			switcher: null;
			mounted(): void;
			watch: {
				isChecked(): void;
				isDisabled(): void;
				options(newOptions: any, oldOptions: any): void;
			};
			methods: {
				renderSwitcher(): void;
				isOptionsEqual(newOptions: BX.UI.SwitcherOptions, oldOptions: BX.UI.SwitcherOptions): boolean;
			};
			template: string;
		};
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
}
