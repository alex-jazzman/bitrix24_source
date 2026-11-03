import { DashboardEmbeddedParameters } from './dashboard-embedded-parameters';

export type ChartAnalysisConfig = {
	dashboardId: number,
	state: 'ready' | 'subscription_required',
	promoterCode: ?string,
	bitrixGptName: string,
};

export type DetailConfig = {
	dashboardEmbeddedParams: DashboardEmbeddedParameters,
	appNodeId: string,
	canExport: 'Y' | 'N',
	canEdit: 'Y' | 'N',
	analyticSource: string,
	analyticScope: ?string,
	embeddedDebugMode: boolean,
	pdfExportEnabled: boolean,
	infoAhaMoment: ?Object,
	mcpBiConnection: boolean,
	chartAnalysis: ?ChartAnalysisConfig,
	dashboardOnboarding: ?Object,
}
