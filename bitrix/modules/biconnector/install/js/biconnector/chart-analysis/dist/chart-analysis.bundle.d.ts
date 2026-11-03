/* eslint-disable */
type RunAction = (action: string, config: {
	data: LaunchActionData;
}) => Promise<{
	data?: {
		chatId?: unknown;
		botId?: unknown;
	};
}>;

type LaunchActionData = {
	dashboardId: number;
	payload: string;
	chatId?: number;
};

type LaunchRequest = {
	dashboardId: number;
	requestId: string;
	card: BxCard;
	previousStatus: BxPreviousStatus;
	data: object | null;
	chatId?: number;
};

type BxCard = {
	dashboardId: number;
	sliceId: number;
	sliceName: string;
	vizType: string;
	periodLabel: string | null;
	appliedFilters: BxCardFilter[];
};

type BxCardFilter = {
	source: 'native' | 'cross' | 'chart';
	label: string;
	value: string;
};

type BxPreviousStatus = 'ok' | 'empty' | 'failed' | 'not_comparable' | null;

type LaunchResult = {
	chatId: number;
	botId: number;
};

type AttachOptions = {
	loader: ChartAnalysisLoader;
	launcher: ChartAnalysisLauncher;
	config: ChartAnalysisConfig;
	dependencies?: Partial<SessionDependencies>;
};

type ChartAnalysisLoader = {
	defineFrameMethod: (name: string, executor: (args: unknown) => unknown) => void;
	setBxAiConfig: (config: BxAiConfig, signal?: AbortSignal) => Promise<BxAiConfigResult>;
	setBxAiState: (state: BxAiState) => Promise<void>;
};

type BxAiConfig = {
	version: 4;
	enabled: boolean;
	mode: BxAiMode;
	labels: {
		action: string;
		unavailable: string;
		busy: string;
	};
};

type BxAiMode = 'analyze' | 'notify';

type BxAiConfigResult = {
	version: number;
	applied: boolean;
	supportedVersions: number[];
};

type BxAiState = {
	version: 4;
	busyRequestId: string | null;
	doneRequestId?: string;
};

type ChartAnalysisLauncher = {
	open: () => void;
	openDialog: (chatId: number) => Promise<void>;
	showStub: (content: HTMLElement) => void;
	hideStub: () => void;
};

type ChartAnalysisConfig = {
	dashboardId: number;
	state: ChartAnalysisState;
	promoterCode: string | null;
	bitrixGptName: string;
};

type ChartAnalysisState = 'ready' | 'subscription_required';

type SessionDependencies = {
	api: {
		launch: (request: LaunchRequest) => Promise<LaunchResult>;
	};
	renderStub: (state: StubState, card: BxCard, options?: StubOptions) => HTMLElement;
	openPromoter: (code: string) => void;
	notify: (message: string) => void;
	analytics: ChartAnalysisAnalytics;
	subscribeToChatMessages: SubscribeToChatMessages;
	configTimeoutMs: number;
	analyzeTimeoutMs: number;
	heartbeatMs: number;
	replyTimeoutMs: number;
};

type StubState = 'no_data' | 'too_large' | 'error';

type StubOptions = {
	message?: string;
	onRetry?: () => void;
};

type ChartAnalysisAnalytics = {
	send: (event: AnalyticsEvent, options: AnalyticsEventOptions) => void;
	sendPreviousStatus: (previousStatus: BxPreviousStatus, vizType?: string) => void;
};

type AnalyticsEvent = 'click' | 'subscription_open' | 'no_data' | 'too_large' | 'analyze_error' | 'launch_error' | `previous_${NonNullable<BxPreviousStatus>}`;

type AnalyticsEventOptions = {
	vizType?: string;
	status?: string;
};

type SubscribeToChatMessages = (callback: (params: ChatMessageParams) => void) => () => void;

type ChatMessageParams = {
	chatId?: unknown;
	message?: {
		senderId?: unknown;
		system?: unknown;
		params?: {
			COMPONENT_PARAMS?: {
				copilotProcess?: unknown;
			};
		};
	};
};

type LaunchError = {
	code: string;
	message: string;
	promoterCode?: string;
};

type BxChartAnalyze = {
	version: 4;
	requestId: string;
	status: BxAnalyzeStatus;
	reason?: BxAnalyzeErrorReason;
	previousStatus: BxPreviousStatus;
	card: BxCard;
	data: object | null;
};

type BxAnalyzeStatus = 'ok' | 'no_data' | 'too_large' | 'error';

type BxAnalyzeErrorReason = 'plugin_load' | 'transform_error' | 'adapter_error';

type BxChartAnalyzeStart = {
	version: 4;
	requestId: string;
	card: BxCard;
};

declare namespace BX.BIConnector {
	class ChartAnalysisApi {
		constructor(runAction?: RunAction);
		launch(request: LaunchRequest): Promise<LaunchResult>;
	}

	const NETWORK_ERROR = "NETWORK_ERROR";

	const RATE_LIMITED_ERROR = "CHART_ANALYSIS_RATE_LIMITED";

	const SUBSCRIPTION_REQUIRED_ERROR = "CHART_ANALYSIS_SUBSCRIPTION_REQUIRED";

	const ChartAnalysis: {
		attach(options: AttachOptions): Promise<ChartAnalysisSession | null>;
	};

	class ChartAnalysisSession {
		constructor(options: AttachOptions);
		connect(): Promise<boolean>;
		destroy(): void;
	}
}
