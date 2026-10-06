import { PageManager } from '../../../../../../../mobile/dev/janative/api';

type AnalyticsLabel = Record<string, string | number>;

export type OpenTaskData = {
	id?: string | number,
	taskId?: string | number,
};

export type OpenTaskParams = {
	userId?: number,
	parentWidget?: PageManager,
	analyticsLabel?: AnalyticsLabel,
	shouldOpenComments?: boolean,
	view?: string,
	kanbanOwnerId?: number,
	projectId?: number | null,
};

export type OpenEfficiencyData = {
	userId: number,
	groupId: number,
};

export type OpenEfficiencyParams = {
	isBackground?: boolean,
};

export type OpenCommentsOptions = {
	taskId: number,
	analyticsLabel?: AnalyticsLabel,
};

export type OpenDeadlinePickerOptions = {
	taskId: number,
	userId?: number,
	analyticsLabel?: AnalyticsLabel,
	layout?: PageManager,
};

export type OpenChecklistOptions = {
	taskId: number,
	userId: number,
	entityId: number | string,
	analyticsLabel?: AnalyticsLabel,
};

export type OpenResultParams = {
	taskId: number,
	userId?: number,
	entityId: number | string,
	isFocused?: boolean,
	isWithAnotherResultsEmptyState?: boolean,
	parentWidget?: PageManager,
};

export type CompleteTaskParams = {
	taskId: number,
	userId?: number,
};

export type OpenTaskListData = {
	flowId?: number,
	flowName?: string | null,
	flowEfficiency?: number | null,
	canCreateTask?: boolean,
	groupId?: number,
	groupName?: string,
	collabId?: number,
	ownerId?: number,
	getProjectData?: boolean,
	analyticsLabel?: AnalyticsLabel,
};

export type TaskCreationDataGroupDto = {
	id: number,
	name: string,
	image: string,
	additionalData: Record<string, unknown>,
};

export type TaskCreationDataUserDto = {
	id: number,
	name: string,
	image: string | null,
	link: string | null,
	workPosition: string | null,
};

export type TaskCreationDataFileDto = {
	id: string,
	name: string,
	type: string,
	url: string,
};

export type TaskCreationDataTagDto = {
	id: string,
	name: string,
};

export type TaskCreationDataCrmElementDto = {
	id: string,
	title: string,
	subtitle: string,
	type: string,
	hidden: boolean,
};

export type InitialTaskData = {
	guid?: string,
	title?: string,
	description?: string,
	deadline?: Date,
	groupId?: number,
	group?: TaskCreationDataGroupDto,
	flowId?: number,
	/** One of tasks/enum.TaskPriority values. */
	priority?: number,
	parentId?: number,
	relatedTaskId?: number,
	responsible?: TaskCreationDataUserDto,
	accomplices?: TaskCreationDataUserDto[],
	auditors?: TaskCreationDataUserDto[],
	files?: TaskCreationDataFileDto[],
	tags?: TaskCreationDataTagDto[],
	crm?: TaskCreationDataCrmElementDto[],
	allowTimeTracking?: boolean,
	startDatePlan?: number,
	endDatePlan?: number,
	IM_CHAT_ID?: number,
	IM_MESSAGE_ID?: number,
	mailMessageId?: number,
};

export type OpenTaskCreationData = {
	initialTaskData?: InitialTaskData,
	/** One of tasks/enum.ViewMode values. */
	view?: string,
	stage?: Record<string, unknown>,
	copyId?: number,
	context?: string,
	closeAfterSave?: boolean,
	analyticsLabel?: AnalyticsLabel,
	layoutWidget?: PageManager,
};
