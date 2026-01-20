import type { AjaxError } from 'main.core';

import { TemplateType, Mark, PermissionType } from 'tasks.v2.const';
import type { CrmItemDto } from 'tasks.v2.provider.service.crm-service';
import type { GroupDto, StageDto } from 'tasks.v2.provider.service.group-service';
import type { FlowDto } from 'tasks.v2.provider.service.flow-service';
import type { GanttLinksDto } from 'tasks.v2.provider.service.relation-service';
import type { UserDto } from 'tasks.v2.provider.service.user-service';
import type { Source, TaskRights } from 'tasks.v2.model.tasks';

export type TaskDto = {
	id: number,
	title: string,
	description: string,
	descriptionChecksum: string,
	creator: UserDto,
	createdTs: number,
	responsible: UserDto,
	deadlineTs: number,
	deadlineAfter: number,
	needsControl: boolean,
	startPlanTs: number,
	endPlanTs: number,
	startDatePlanAfter: number,
	endDatePlanAfter: number,
	fileIds: number[],
	checklist: number[] | string[],
	containsChecklist: boolean,
	parent: TaskDto,
	base: TaskDto,
	subTaskIds: number[],
	relatedTaskIds: number[],
	ganttLinks: GanttLinksDto,
	containsSubTasks: boolean,
	containsSubTemplates: boolean,
	containsRelatedTasks: boolean,
	containsGanttLinks: boolean,
	containsPlacements: boolean,
	requireResult: boolean,
	containsResults: boolean,
	numberOfReminders: number,
	group: GroupDto,
	stage: StageDto,
	epicId: number,
	storyPoints: string,
	flow: FlowDto,
	priority: Priority,
	status: Status,
	statusChangedTs: number,
	accomplices: UserDto[],
	auditors: UserDto[],
	tags: TagDto[],
	chatId: number,
	crmItemIds: string[],
	crmItems: CrmItemDto[],
	email?: EmailDto,
	allowsChangeDeadline: boolean,
	allowsChangeDatePlan: boolean,
	allowsTimeTracking: boolean,
	timers: TimerDto[],
	timeSpent: number,
	estimatedTime: number,
	numberOfElapsedTimes: number,
	matchesWorkTime: boolean,
	matchesSubTasksTime: boolean,
	autocompleteSubTasks: boolean,
	source: Source,
	templateId: number,
	rights: TaskRights,
	inFavorite: number[],
	inMute: number[],
	archiveLink: ?string,
	maxDeadlineChangeDate: string,
	maxDeadlineChanges: number,
	requireDeadlineChangeReason: boolean,
	deadlineChangeReason: ?string,
	userFields: Array<{ key: string, value: any }>,
	multiResponsibles: UserDto[],
	replicate: ?boolean,
	replicateParams: ?ReplicateParamsDto,
	/** @description Template only props */
	responsibleCollection: UserDto[],
	type: ?$Values<typeof TemplateType>,
	permissions: ?TemplatePermissionDto[],
	mark: ?$Values<typeof Mark>,
};

export type TaskSliderData = {
	TITLE: string,
	DESCRIPTION: string,
	RESPONSIBLE_ID: number,
	GROUP_ID: number,
	FLOW_ID: string,
	TEMPLATE: string,
	COPY: string,
	DEADLINE_TS: number,
	IS_IMPORTANT: string,
	FILE_IDS: string[],
	UF_TASK_WEBDAV_FILES: string[],
	UF_MAIL_MESSAGE: string,
	CHECKLIST: CheckList,
	PARENT_ID: string,
	BASE_TEMPLATE: string,
	TAGS: string,
	UF_CRM_TASK: string,
	MAIL_SUBJECT: string,
	MAIL_FROM: string,
	MAIL_DATE: string,
};

type Priority = 'low' | 'average' | 'high';

export type Status = 'pending' | 'in_progress' | 'supposedly_completed' | 'completed' | 'deferred' | 'declined';

type CheckList = {
	any: any,
};

export type TagDto = {
	id: number,
	name: string,
	owner: UserDto,
	group: GroupDto,
};

export type TimerDto = {
	userId: number,
	taskId: string,
	startedAtTs: number,
	seconds: number,
}

export type EmailDto = {
	id: number,
	mailboxId: number,
	taskId: number,
	title: string,
	link: string,
	from: string,
	dateTs: number,
};

export type SeparateFieldsMeta = {
	fields: Set<string>,
	endpoint: string,
	service: { update: Function },
};

export type UpdateResult = { [endpoint: string]: AjaxError[] };

export type TaskSelect = {
	group: boolean,
	flow: boolean,
	stage: boolean,
	members: boolean,
	checkLists: boolean,
	chat: boolean,
	tags: boolean,
	crm: boolean,
	subTasks: boolean,
	relatedTasks: boolean,
	gantt: boolean,
	favorite: boolean,
	options: boolean,
	parameters: boolean,
	results: boolean,
	userFields: boolean,
};

export type TemplatePermissionDto = {
	accessEntity: {
		id: number,
		type: string,
		image: {
			src: string,
		},
		name: string,
	},
	permissionId: $Values<typeof PermissionType>,
};

export type ReplicateParamsDto = {
	dailyMonthInterval: ?number;
	deadlineOffset: null;
	endDate: ?string;
	everyDay: number;
	everyWeek: number;
	monthlyDayNum: number;
	monthlyMonthNum1: number;
	monthlyMonthNum2: number;
	monthlyType: number;
	monthlyWeekDay: ?number;
	monthlyWeekDayNum: ?number;
	nextExecutionTime: ?string;
	period: string;
	repeatTill: string;
	startDate: ?string;
	time: ?string;
	times: ?number;
	timezoneOffset: ?number;
	weekDays: number[];
	workdayOnly: string;
	yearlyDayNum: ?number;
	yearlyMonth1: ?number;
	yearlyMonth2: ?number;
	yearlyType: number;
	yearlyWeekDay: ?number;
	yearlyWeekDayNum: ?number;
}
