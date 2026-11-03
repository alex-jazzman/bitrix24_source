/* eslint-disable */
type CallLogoLanguage = typeof BX.Call.Component.Ui.CallLogoLanguages extends Set<infer T> ? T : never;

type CallLogoColor = typeof BX.Call.Component.Ui.CallLogoColors extends Set<infer T> ? T : never;

declare namespace BX.Call.Component.Ui {
	const CallLogo: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		language: {
			type: StringConstructor;
			default: string;
			validator: (value: string) => boolean;
		};
		color: {
			type: StringConstructor;
			default: null;
			validator: (value: string | null) => boolean;
		};
	}>, {}, {}, {
		additionalClasses(): string[];
	}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		language: {
			type: StringConstructor;
			default: string;
			validator: (value: string) => boolean;
		};
		color: {
			type: StringConstructor;
			default: null;
			validator: (value: string | null) => boolean;
		};
	}>> & Readonly<{}>, {
		language: string;
		color: string;
	}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CallLogoLanguages: Set<"en" | "ru">;

	const CallLogoColors: Set<"white" | null>;
}
