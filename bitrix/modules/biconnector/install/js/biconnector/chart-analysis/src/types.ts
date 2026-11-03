export type BxAiMode = 'analyze' | 'notify';

export type BxAiConfig = {
	version: 4;
	enabled: boolean;
	mode: BxAiMode;
	labels: { action: string; unavailable: string; busy: string };
};

export type BxAiConfigResult = {
	version: number;
	applied: boolean;
	supportedVersions: number[];
};

export type BxAiState = {
	version: 4;
	busyRequestId: string | null;
	doneRequestId?: string;
};

export type BxCardFilter = {
	source: 'native' | 'cross' | 'chart';
	label: string;
	value: string;
};

export type BxCard = {
	dashboardId: number;
	sliceId: number;
	sliceName: string;
	vizType: string;
	periodLabel: string | null;
	appliedFilters: BxCardFilter[];
};

export type BxChartAnalyzeStart = {
	version: 4;
	requestId: string;
	card: BxCard;
};

export type BxAnalyzeStatus = 'ok' | 'no_data' | 'too_large' | 'error';

export type BxAnalyzeErrorReason = 'plugin_load' | 'transform_error' | 'adapter_error';

export type BxPreviousStatus = 'ok' | 'empty' | 'failed' | 'not_comparable' | null;

export type BxChartAnalyze = {
	version: 4;
	requestId: string;
	status: BxAnalyzeStatus;
	reason?: BxAnalyzeErrorReason;
	previousStatus: BxPreviousStatus;
	card: BxCard;
	// The block is meant for the model: the portal passes it through without reading it.
	data: object | null;
};

export type ChartAnalysisState = 'ready' | 'subscription_required';

export type ChartAnalysisConfig = {
	dashboardId: number;
	state: ChartAnalysisState;
	promoterCode: string | null;
	bitrixGptName: string;
};
