import {
	ReplicationPeriod,
	ReplicationDayType,
	ReplicationWeekDayNum,
	Mark,
} from 'tasks.v2.const';
import type { Status } from 'tasks.v2.provider.service.task-service';
import type { DeadlineUserOption, StateFlags } from 'tasks.v2.model.interface';
import type { ReminderModel } from 'tasks.v2.model.reminders';
import type { TemplatePermission } from 'tasks.v2.provider.service.template-service';

export type TaskModelParams = {
	stateFlags: StateFlags,
	deadlineUserOption: DeadlineUserOption,
};

export type TasksModelState = {
	collection: { [taskId: string]: TaskModel },
	titles: { [taskId: string]: string },
	partiallyLoadedIds: Set<number>,
};

export type TaskModel = {
	id: number,
	title: string,
	isImportant: boolean,
	description: string,
	descriptionChecksum: string,
	forceUpdateDescription: boolean,
	creatorId: number,
	createdTs: number,
	responsibleIds: number[],
	isForNewUser: boolean,
	deadlineTs: number,
	deadlineAfter: number,
	needsControl: boolean,
	startPlanTs: number,
	endPlanTs: number,
	startDatePlanAfter: number,
	endDatePlanAfter: number,
	fileIds: number[],
	checklist: [],
	containsChecklist: boolean,
	parentId: number,
	subTaskIds: number[],
	containsSubTasks: boolean,
	relatedToTaskId: number,
	relatedTaskIds: number[],
	containsRelatedTasks: boolean,
	ganttTaskIds: number[],
	containsGanttLinks: boolean,
	placementIds: ?number[],
	containsPlacements: boolean,
	containsCommentFiles: boolean,
	results: number[],
	resultsMessageMap: { [resultId: number]: number },
	requireResult: boolean,
	containsResults: boolean,
	numberOfReminders: number,
	reminders: ReminderModel[],
	groupId: number,
	stageId: number,
	storyPoints: string,
	epicId: number,
	flowId: number,
	status: Status,
	statusChangedTs: string,
	accomplicesIds: number[],
	auditorsIds: number[],
	chatId: number,
	crmItemIds: string[],
	email?: EmailModel,
	allowsChangeDeadline: boolean,
	allowsChangeDatePlan: boolean,
	allowsTimeTracking: boolean,
	timers: TimerModel[],
	timeSpent: number,
	estimatedTime: number,
	numberOfElapsedTimes: number,
	matchesWorkTime: boolean,
	matchesSubTasksTime: boolean,
	autocompleteSubTasks: boolean,
	tags: string[],
	filledFields: { [field: string]: boolean },
	rights: TaskRights,
	isFavorite: boolean,
	isMuted: boolean,
	archiveLink: ?string,
	source?: Source,
	copiedFromId?: number,
	context: string,
	templateId: number,
	maxDeadlineChangeDate: string,
	maxDeadlineChanges: number,
	requireDeadlineChangeReason: boolean,
	deadlineChangeReason: string,
	userFields: Array<{ key: string, value: any }>,
	permissions: TemplatePermission[] | null,
	replicate: boolean,
	mark: ?$Values<typeof Mark>,
	replicateParams: TaskReplicateParams | null,
};

export type TaskRights = {
	read: boolean,
	edit: boolean,
	remove: boolean,
	complete: boolean,
	approve: boolean,
	disapprove: boolean,
	start: boolean,
	take: boolean,
	delegate: boolean,
	defer: boolean,
	renew: boolean,
	create: boolean,
	deadline: boolean,
	datePlan: boolean,
	changeDirector: boolean,
	changeResponsible: boolean,
	changeAccomplices: boolean,
	pause: boolean,
	timeTracking: boolean,
	rate: boolean,
	changeStatus: boolean,
	reminder: boolean,
	addAuditors: boolean,
	elapsedTime: boolean,
	favorite: boolean,
	checklistAdd: boolean,
	checklistEdit: boolean,
	checklistSave: boolean,
	checklistToggle: boolean,
	automate: boolean,
	resultEdit: boolean,
	completeResult: boolean,
	removeResult: boolean,
	resultRead: boolean,
	admin: boolean,
	watch: boolean,
	mute: boolean,
	createSubtask: boolean,
	copy: boolean,
	createFromTemplate: boolean,
	saveAsTemplate: boolean,
	attachFile: boolean,
	detachFile: boolean,
	detachParent: boolean,
	detachRelated: boolean,
	changeDependence: boolean,
	createGanttDependence: boolean,
	sort: boolean,
	mark: boolean,
};

export type Source = {
	type: string,
	entityId?: number,
	subEntityId?: number,
};

export type FieldFilledPayload = {
	id: number,
	fieldName: string,
	isFilled: boolean,
};

export type EmailModel = {
	id: number,
	mailboxId: number,
	taskId: number,
	title: string,
	body: string,
	link: string,
	from: string,
	dateTs: number,
};

export type TimerModel = {
	userId: number,
	taskId: string,
	startedAtTs: number,
	seconds: number,
};

export type TaskReplicateParams = {
	period: $Values<typeof ReplicationPeriod>;
	repeatTill: string;
	startTs: number;
	startDate: string;
	time: string,
	endTs: ?number,
	endDate: ?string;
	times: ?number;
	nextExecutionTime: string;
	workdayOnly: 'Y' | 'N' | undefined;
	deadlineOffset: ?number;
} & TaskReplicationDaily & TaskReplicationWeekly & TaskReplicationMonthly & TaskReplicationYearly;

export type TaskReplicationDaily = {
	everyDay: ?number;
	dailyMonthInterval: ?number;
}

export type TaskReplicationWeekly = {
	everyWeek: ?number;
	weekDays: number[];
}

export type TaskReplicationMonthly = {
	monthlyType: ?$Values<typeof ReplicationDayType>;
	weekDays: number[];
	monthlyDayNum: ?number;
	monthlyWeekDayNum: ?$Values<typeof ReplicationWeekDayNum>;
	monthlyWeekDay: ?number;
	monthlyMonthNum1: ?number;
	monthlyMonthNum2: ?number;
}

export type TaskReplicationYearly = {
	yearlyType: ?$Values<typeof ReplicationDayType>;
	yearlyDayNum: ?number;
	yearlyMonth1: ?number;
	yearlyWeekDayNum: ?$Values<typeof ReplicationWeekDayNum>;
	yearlyWeekDay: ?number;
	yearlyMonth2: number;
}
