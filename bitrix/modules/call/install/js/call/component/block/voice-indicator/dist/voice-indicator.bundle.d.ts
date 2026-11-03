/* eslint-disable */
declare namespace BX.Call.Component.Block {
	const CallVoiceIndicator: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		level: {
			type: NumberConstructor;
			default: number;
			validator: (v: number) => boolean;
		};
		isMuted: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>, {}, {
		bars: Array<{
			index: number;
		}>;
		animatedLevel: number;
		animationFrame: number | null;
	}, {
		activeCount(): number;
	}, {
		animateToLevel(): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		level: {
			type: NumberConstructor;
			default: number;
			validator: (v: number) => boolean;
		};
		isMuted: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>> & Readonly<{}>, {
		level: number;
		isMuted: boolean;
	}, {}, {
		CallIcon: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			icon: {
				type: StringConstructor;
				required: true;
				validator: (value: string) => boolean;
			};
			color: {
				type: StringConstructor;
				default: string;
				validator: (value: string) => boolean;
			};
			size: {
				type: NumberConstructor;
				default: number;
				validator: (value: number) => boolean;
			};
		}>, {}, {}, {
			additionalClasses(): string[];
			additionalStyles(): Record<string, string>;
		}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			icon: {
				type: StringConstructor;
				required: true;
				validator: (value: string) => boolean;
			};
			color: {
				type: StringConstructor;
				default: string;
				validator: (value: string) => boolean;
			};
			size: {
				type: NumberConstructor;
				default: number;
				validator: (value: number) => boolean;
			};
		}>> & Readonly<{}>, {
			size: number;
			color: string;
		}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
}
