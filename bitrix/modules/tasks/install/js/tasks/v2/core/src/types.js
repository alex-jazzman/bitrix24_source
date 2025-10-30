import type { InterfaceModelParams } from 'tasks.v2.model.interface';

export type CoreParams = InterfaceModelParams & {
	limits: LimitsParams,
	defaultDeadline: number,
	chatType: string,
	features: FeaturesParams,
	paths: PathsParams,
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
	isFlowEnabled: boolean,
	isProjectsEnabled: boolean,
	isTemplateEnabled: boolean,
};

type PathsParams = {
	editPath: string,
};
