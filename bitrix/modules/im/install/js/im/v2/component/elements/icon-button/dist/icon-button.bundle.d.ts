/* eslint-disable */
declare namespace BX.Messenger.v2.Component.Elements {
	const IconButton: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		iconName: {
			type: StringConstructor;
			required: true;
		};
		label: {
			type: StringConstructor;
			required: true;
		};
		title: {
			type: BX.Vue3.PropType<string | null | undefined>;
			default: undefined;
		};
		iconSize: {
			type: NumberConstructor;
			default: number;
		};
		iconColor: {
			type: BX.Vue3.PropType<string | null>;
			default: null;
		};
		disabled: {
			type: BooleanConstructor;
			default: boolean;
		};
		pressed: {
			type: BX.Vue3.PropType<boolean | null>;
			default: null;
		};
		expanded: {
			type: BX.Vue3.PropType<boolean | null>;
			default: null;
		};
		tabindex: {
			type: NumberConstructor;
			default: number;
		};
	}>, {}, {}, {
		titleAttribute(): string | null;
	}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "click"[], "click", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		iconName: {
			type: StringConstructor;
			required: true;
		};
		label: {
			type: StringConstructor;
			required: true;
		};
		title: {
			type: BX.Vue3.PropType<string | null | undefined>;
			default: undefined;
		};
		iconSize: {
			type: NumberConstructor;
			default: number;
		};
		iconColor: {
			type: BX.Vue3.PropType<string | null>;
			default: null;
		};
		disabled: {
			type: BooleanConstructor;
			default: boolean;
		};
		pressed: {
			type: BX.Vue3.PropType<boolean | null>;
			default: null;
		};
		expanded: {
			type: BX.Vue3.PropType<boolean | null>;
			default: null;
		};
		tabindex: {
			type: NumberConstructor;
			default: number;
		};
	}>> & Readonly<{
		onClick?: ((...args: any[]) => any) | undefined;
	}>, {
		title: string | null | undefined;
		iconSize: number;
		iconColor: string | null;
		disabled: boolean;
		pressed: boolean | null;
		expanded: boolean | null;
		tabindex: number;
	}, {}, {
		BIcon: typeof BX.UI.IconSet.BIcon;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
}
