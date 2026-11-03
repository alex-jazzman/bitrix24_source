/* eslint-disable */
declare namespace BX.Call.Component.Ui {
	const CallAvatar: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		testId: {
			type: StringConstructor;
			default: null;
			required: true;
		};
		testState: {
			type: StringConstructor;
			default: null;
		};
		testMeta: {
			type: StringConstructor;
			default: null;
		};
		label: {
			type: StringConstructor;
			default: null;
		};
		image: {
			type: StringConstructor;
			default: null;
		};
		size: {
			type: (NumberConstructor | null)[];
			default: null;
		};
		corner: {
			type: BooleanConstructor;
			default: boolean;
		};
		caller: {
			type: BooleanConstructor;
			default: boolean;
		};
		speaker: {
			type: BooleanConstructor;
			default: boolean;
		};
		color: {
			type: StringConstructor;
			default: null;
		};
	}>, {}, {
		imageError: boolean;
	}, {
		hashColor(): string;
		abbreviation(): string;
		pulseElements(): number;
		encodedImage(): string | null;
		additionalClasses(): string[];
		cssVariables(): Record<string, string>;
		computedTestState(): string | null;
	}, {
		handleImageError(): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		testId: {
			type: StringConstructor;
			default: null;
			required: true;
		};
		testState: {
			type: StringConstructor;
			default: null;
		};
		testMeta: {
			type: StringConstructor;
			default: null;
		};
		label: {
			type: StringConstructor;
			default: null;
		};
		image: {
			type: StringConstructor;
			default: null;
		};
		size: {
			type: (NumberConstructor | null)[];
			default: null;
		};
		corner: {
			type: BooleanConstructor;
			default: boolean;
		};
		caller: {
			type: BooleanConstructor;
			default: boolean;
		};
		speaker: {
			type: BooleanConstructor;
			default: boolean;
		};
		color: {
			type: StringConstructor;
			default: null;
		};
	}>> & Readonly<{}>, {
		size: number | null;
		label: string;
		testId: string;
		testState: string;
		testMeta: string;
		image: string;
		corner: boolean;
		caller: boolean;
		speaker: boolean;
		color: string;
	}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
}
