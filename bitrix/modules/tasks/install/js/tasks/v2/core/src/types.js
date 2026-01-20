import type { InterfaceModelParams } from 'tasks.v2.model.interface';
import type { GroupDto } from 'tasks.v2.provider.service.group-service';

export type CoreParams = InterfaceModelParams & {
	restrictions: RestrictionsParams,
	chatType: string,
	features: FeaturesParams,
	paths: PathsParams,
	rights: RightsParams,
	externalExtensions: string[],
	defaultCollab: GroupDto,
	mainDepartmentUfId: number,
};

type RestrictionsParams = {
	project: Restriction,
	stakeholder: Restriction,
	relatedSubtaskDeadlines: Restriction,
	requiredResult: Restriction,
	control: Restriction,
	timeTracking: Restriction,
	delegating: Restriction,
	skipWeekends: Restriction,
	timeElapsed: Restriction,
	recurringTasks: Restriction,
	templatesSubtasks: Restriction,
	templatesAccessPermissions: Restriction,
	robots: Restriction,
	mailUserIntegration: Restriction,
	crmIntegration: Restriction,
	mark: Restriction,
	recurrentTask: Restriction,
};

type Restriction = {
	available: boolean,
	featureId: string,
};

type FeaturesParams = {
	isV2Enabled: boolean,
	isMiniformEnabled: boolean,
	isFlowEnabled: boolean,
	isProjectsEnabled: boolean,
	isTemplateEnabled: boolean,
	isCopilotEnabled: boolean,
	crm: boolean,
	im: boolean,
	disk: boolean,
	allowedGroups?: boolean, // todo remove before/after release
};

type PathsParams = {
	editPath: string,
	userTaskPathTemplate: string,
	groupTaskPathTemplate: string,
};

export type RightsParams = {
	user: {
		admin: boolean,
	},
	tasks: {
		create: boolean,
		createFromTemplate: boolean,
		robot: boolean,
		admin: boolean,
	},
	templates: {
		create: boolean,
	},
	flow: {
		create: boolean,
	},
};
