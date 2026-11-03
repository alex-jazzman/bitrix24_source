/* eslint-disable */
type SignalQuality = 'excellent' | 'good' | 'poor' | 'bad';

declare namespace BX.Call.Component.Ui {
	const CallSignal: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		dataLoss: {
			type: NumberConstructor;
			default: number;
		};
	}>, {}, {}, {
		quality(): SignalQuality;
		additionalClasses(): string[];
	}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		dataLoss: {
			type: NumberConstructor;
			default: number;
		};
	}>> & Readonly<{}>, {
		dataLoss: number;
	}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
}
