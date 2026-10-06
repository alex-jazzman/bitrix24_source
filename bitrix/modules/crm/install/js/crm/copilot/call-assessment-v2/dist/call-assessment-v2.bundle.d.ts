/* eslint-disable */
type CallAssessmentV2Params = {
	data: ScriptData;
	config?: Partial<CallAssessmentV2Settings>;
	events?: CallAssessmentV2Events;
};

type ScriptData = {
	id: number | null;
	title: string;
	description: string;
	isAiImprovementEnabled: boolean;
	filters: FilterDescriptor[];
	criteria: Criterion[];
	updatedAt?: number | null;
	processedCallsCount?: number;
	isGeneratedByCopilot?: boolean;
};

type FilterDescriptor = SingleFilter | MultiFilter;

type SingleFilter = {
	code: string;
	multi: false;
	value: number;
	options: FilterOption[];
};

type FilterOption = {
	value: number;
	label: string;
};

type MultiFilter = {
	code: string;
	multi: true;
	values: number[];
	options: FilterOption[];
	highlightValues?: number[];
};

type Criterion = {
	id: number | null;
	tempKey?: string;
	title: string;
	description: string;
	sort: number;
};

type CallAssessmentV2Settings = {
	readOnly: boolean;
	isEnabled: boolean;
	isCopy: boolean;
	isNewScript: boolean;
	isPendingGeneration: boolean;
};

type CallAssessmentV2Events = {
	onSave?: (data: ScriptData) => void;
	onCancel?: () => void;
};

declare namespace BX.Crm.Copilot {
	class CallAssessmentV2 {
		constructor(containerId: string, params: CallAssessmentV2Params);
		destroy(): void;
	}

	const ScenarioStepView: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		index: {
			type: NumberConstructor;
			required: true;
		};
		title: {
			type: StringConstructor;
			required: true;
		};
		description: {
			type: StringConstructor;
			default: string;
		};
	}>, {}, {}, {}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		index: {
			type: NumberConstructor;
			required: true;
		};
		title: {
			type: StringConstructor;
			required: true;
		};
		description: {
			type: StringConstructor;
			default: string;
		};
	}>> & Readonly<{}>, {
		description: string;
	}, {}, {
		HeadlineXs: {
			extends: {
				name: string;
				inheritAttrs: boolean;
				props: {
					size: {
						type: StringConstructor;
						required: boolean;
						validator: (value: any) => boolean;
					};
					accent: {
						type: BooleanConstructor;
						default: boolean;
					};
					tag: {
						type: StringConstructor;
						default: string;
					};
					align: {
						type: StringConstructor;
						default: null;
						validator: (value: any) => boolean;
					};
					transform: {
						type: StringConstructor;
						default: null;
						validator: (value: any) => boolean;
					};
					wrap: {
						type: StringConstructor;
						default: null;
						validator: (value: any) => boolean;
					};
					className: {
						type: (ObjectConstructor | ArrayConstructor | StringConstructor)[];
						default: null;
					};
				};
				computed: {
					classes(): any[];
				};
				template: string;
			};
			props: {
				size: {
					default: string;
				};
			};
		};
		TextXs: {
			extends: {
				name: string;
				inheritAttrs: boolean;
				props: {
					size: {
						type: StringConstructor;
						required: boolean;
						validator: (value: any) => boolean;
					};
					accent: {
						type: BooleanConstructor;
						default: boolean;
					};
					tag: {
						type: StringConstructor;
						default: string;
					};
					align: {
						type: StringConstructor;
						default: null;
						validator: (value: any) => boolean;
					};
					transform: {
						type: StringConstructor;
						default: null;
						validator: (value: any) => boolean;
					};
					wrap: {
						type: StringConstructor;
						default: null;
						validator: (value: any) => boolean;
					};
					className: {
						type: (ObjectConstructor | ArrayConstructor | StringConstructor)[];
						default: null;
					};
				};
				computed: {
					classes(): string[];
				};
				template: string;
			};
			props: {
				size: {
					default: string;
				};
			};
		};
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
}
