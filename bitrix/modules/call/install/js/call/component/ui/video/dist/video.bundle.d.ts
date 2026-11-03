/* eslint-disable */
declare namespace BX.Call.Component.Ui {
	const CallVideo: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		testId: {
			type: StringConstructor;
			default: null;
		};
		srcObject: {
			type: ObjectConstructor;
			default: null;
		};
		mirrored: {
			type: BooleanConstructor;
			default: boolean;
		};
		muted: {
			type: BooleanConstructor;
			default: boolean;
		};
		objectFit: {
			type: StringConstructor;
			default: string;
			validator: (value: string) => boolean;
		};
	}>, {}, {}, {
		additionalClasses(): string[];
	}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		testId: {
			type: StringConstructor;
			default: null;
		};
		srcObject: {
			type: ObjectConstructor;
			default: null;
		};
		mirrored: {
			type: BooleanConstructor;
			default: boolean;
		};
		muted: {
			type: BooleanConstructor;
			default: boolean;
		};
		objectFit: {
			type: StringConstructor;
			default: string;
			validator: (value: string) => boolean;
		};
	}>> & Readonly<{}>, {
		testId: string;
		srcObject: Record<string, any>;
		mirrored: boolean;
		muted: boolean;
		objectFit: string;
	}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
}
