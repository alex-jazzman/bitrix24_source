declare module 'ui.vue3' {
	interface ComponentCustomProperties {
		loc(name: string, replacements?: Record<string, string>): string;
	}
}

export type FilterOption = {
	value: number,
	label: string,
};

export type TagStyling = {
	bgColor: string,
	textColor: string,
};

export type SingleFilter = {
	code: string,
	multi: false,
	value: number,
	options: FilterOption[],
};

export type MultiFilter = {
	code: string,
	multi: true,
	values: number[],
	options: FilterOption[],
	highlightValues?: number[],
};

export type FilterDescriptor = SingleFilter | MultiFilter;

export type Criterion = {
	id: number | null,
	tempKey?: string,
	title: string,
	description: string,
	sort: number,
};

export type ScriptData = {
	id: number | null,
	title: string,
	description: string,
	isAiImprovementEnabled: boolean,
	filters: FilterDescriptor[],
	criteria: Criterion[],
	updatedAt?: number | null,
	processedCallsCount?: number,
	isGeneratedByCopilot?: boolean,
};

export type CallAssessmentV2Settings = {
	readOnly: boolean,
	isEnabled: boolean,
	isCopy: boolean,
	isNewScript: boolean,
	isPendingGeneration: boolean,
};

export type CallAssessmentV2Events = {
	onSave?: (data: ScriptData) => void,
	onCancel?: () => void,
};

export type Mode = 'view' | 'edit' | 'create' | 'loading';