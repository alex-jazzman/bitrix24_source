/* eslint-disable */
type CallBadgeSize = typeof BX.Call.Component.Ui.CallBadgeSizes extends Set<infer T> ? T : never;

type CallBadgeColor = typeof BX.Call.Component.Ui.CallBadgeColors extends Set<infer T> ? T : never;

declare namespace BX.Call.Component.Ui {
	const CallBadge: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		testId: {
			type: StringConstructor;
			default: null;
			required: true;
		};
		label: {
			type: (NumberConstructor | StringConstructor)[];
			default: null;
		};
		size: {
			type: StringConstructor;
			default: string;
			validator: (value: string) => boolean;
		};
		color: {
			type: StringConstructor[];
			default: string;
			validator: (value: string) => boolean;
		};
	}>, {}, {}, {
		additionalClasses(): string[];
	}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		testId: {
			type: StringConstructor;
			default: null;
			required: true;
		};
		label: {
			type: (NumberConstructor | StringConstructor)[];
			default: null;
		};
		size: {
			type: StringConstructor;
			default: string;
			validator: (value: string) => boolean;
		};
		color: {
			type: StringConstructor[];
			default: string;
			validator: (value: string) => boolean;
		};
	}>> & Readonly<{}>, {
		size: string;
		label: string | number;
		testId: string;
		color: string;
	}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CallBadgeSizes: Set<"sm" | "md" | "lg">;

	const CallBadgeColors: Set<"blue" | "red" | "yellow" | "green" | "gray">;
}
