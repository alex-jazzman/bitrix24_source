import { DashboardEmbeddedParameters } from './dashboard-embedded-parameters';

export type DetailConfig = {
	dashboardEmbeddedParams: DashboardEmbeddedParameters,
	appNodeId: string,
	canExport: 'Y' | 'N',
	canEdit: 'Y' | 'N',
	analyticSource: string,
	analyticScope: ?string,
	embeddedDebugMode: boolean,
	pdfExportEnabled: boolean,
}
