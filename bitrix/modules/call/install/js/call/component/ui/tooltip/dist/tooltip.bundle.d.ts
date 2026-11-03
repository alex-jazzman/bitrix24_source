/* eslint-disable */
type CallTooltipPosition = typeof BX.Call.Component.Ui.CallTooltipPositions extends Set<infer T> ? T : never;

declare namespace BX.Call.Component.Ui {
	const CallTooltip: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		value: {
			type: StringConstructor;
			default: string;
		};
		disabled: {
			type: BooleanConstructor;
			default: boolean;
		};
		testId: {
			type: StringConstructor;
			default: string;
		};
		tooltipClass: {
			type: StringConstructor;
			default: string;
		};
		position: {
			type: StringConstructor;
			default: "right" | "left" | "top" | "bottom";
			validator: (value: string) => boolean;
		};
	}>, {}, {}, {
		tooltipClasses(): string[];
		isTooltipVisible(): boolean;
	}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		value: {
			type: StringConstructor;
			default: string;
		};
		disabled: {
			type: BooleanConstructor;
			default: boolean;
		};
		testId: {
			type: StringConstructor;
			default: string;
		};
		tooltipClass: {
			type: StringConstructor;
			default: string;
		};
		position: {
			type: StringConstructor;
			default: "right" | "left" | "top" | "bottom";
			validator: (value: string) => boolean;
		};
	}>> & Readonly<{}>, {
		value: string;
		disabled: boolean;
		testId: string;
		tooltipClass: string;
		position: string;
	}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CallTooltipPositions: Set<"right" | "left" | "top" | "bottom">;

	const CALL_TOOLTIP_DEFAULT_POSITION: CallTooltipPosition;
}
