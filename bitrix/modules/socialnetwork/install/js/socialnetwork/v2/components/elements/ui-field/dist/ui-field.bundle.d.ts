/* eslint-disable */
type HintOptions = {
	size?: number;
	maxWidth?: number;
};

declare namespace BX.Socialnetwork.V2.Components.Elements {
	const UiField: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		label: {
			type: StringConstructor;
			default: string;
		};
		labelFor: {
			type: StringConstructor;
			default: string;
		};
		hint: {
			type: (StringConstructor | null)[];
			default: null;
		};
		hintOptions: {
			type: BX.Vue3.PropType<HintOptions>;
			default: null;
		};
	}>, {}, {}, {}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		label: {
			type: StringConstructor;
			default: string;
		};
		labelFor: {
			type: StringConstructor;
			default: string;
		};
		hint: {
			type: (StringConstructor | null)[];
			default: null;
		};
		hintOptions: {
			type: BX.Vue3.PropType<HintOptions>;
			default: null;
		};
	}>> & Readonly<{}>, {
		label: string;
		hint: string | null;
		labelFor: string;
		hintOptions: HintOptions;
	}, {}, {
		QuestionMark: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			size: {
				type: NumberConstructor;
				default: number;
			};
			hintText: {
				type: StringConstructor;
				default: string;
			};
			hintMaxWidth: {
				type: NumberConstructor;
				default: number;
			};
		}>, {
			Outline: typeof import("ui.icon-set.api.core").Outline;
		}, {}, {
			tooltip(): (() => import("ui.vue3.directives.hint").HintParams) | null;
		}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			size: {
				type: NumberConstructor;
				default: number;
			};
			hintText: {
				type: StringConstructor;
				default: string;
			};
			hintMaxWidth: {
				type: NumberConstructor;
				default: number;
			};
		}>> & Readonly<{}>, {
			size: number;
			hintText: string;
			hintMaxWidth: number;
		}, {}, {
			BIcon: {
				props: {
					name: {
						type: StringConstructor;
						required: boolean;
						validator(value: string): boolean;
					};
					color: {
						type: StringConstructor;
						required: boolean;
						default: null;
					};
					size: {
						type: NumberConstructor;
						required: boolean;
						default: null;
					};
					hoverable: {
						type: BooleanConstructor;
						default: boolean;
					};
					hoverableAlt: {
						type: BooleanConstructor;
						default: boolean;
					};
					responsive: {
						type: BooleanConstructor;
						default: boolean;
					};
				};
				computed: {
					className(): string[];
					hoverableClassnameModifier(): string;
					responsiveClassnameModifier(): string;
					inlineSize(): string;
					inlineColor(): string;
					inlineStyle(): string;
				};
				template: string;
			};
		}, {
			hint: {
				mounted(element: HTMLElement, { value }: {
					value: import("ui.vue3.directives.hint").HintParams | Function;
				}): void;
				updated(element: HTMLElement, { value }: {
					value: import("ui.vue3.directives.hint").HintParams | Function;
				}): void;
				beforeUnmount(element: HTMLElement): void;
			};
		}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
}
