/* eslint-disable */
declare namespace BX.Socialnetwork.V2.Components.Elements {
	const QuestionMark: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
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
		Outline: typeof BX.UI.IconSet.Outline;
	}, {}, {
		tooltip(): (() => BX.Vue3.Directives.HintParams) | null;
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
		BIcon: typeof BX.UI.IconSet.BIcon;
	}, {
		hint: {
			mounted(element: HTMLElement, { value }: {
				value: BX.Vue3.Directives.HintParams | Function;
			}): void;
			updated(element: HTMLElement, { value }: {
				value: BX.Vue3.Directives.HintParams | Function;
			}): void;
			beforeUnmount(element: HTMLElement): void;
		};
	}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
}
