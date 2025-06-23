import type { InterfaceModelParams } from 'tasks.v2.model.interface';

export type CoreParams = InterfaceModelParams & {
	limits: LimitsParams,
	defaultDeadline: number,
	chatType: string,
	features: FeaturesParams,
	paths: PathsParams,
	analytics: AnalyticsParams,
};

type LimitsParams = {
	mailUserIntegration: boolean,
	mailUserIntegrationFeatureId: boolean,
	project: boolean,
	projectFeatureId: boolean,
	stakeholders: boolean,
};

type FeaturesParams = {
	isV2Enabled: boolean,
	isMiniformEnabled: boolean,
};

type PathsParams = {
	editPath: string,
};

type AnalyticsParams = {
	userType: string,
};
