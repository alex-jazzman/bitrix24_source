import { Type, Text } from 'main.core';

import { Core } from 'tasks.v2.core';
import { Model, TemplateType } from 'tasks.v2.const';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { CheckListMappers } from 'tasks.v2.provider.service.check-list-service';
import { RemindersMappers } from 'tasks.v2.provider.service.reminders-service';
import { TemplateMappers } from 'tasks.v2.provider.service.template-service';
import { DateStringConverter, TimeStringConverter } from 'tasks.v2.component.fields.replication';
import type { TaskModel, TaskReplicateParams } from 'tasks.v2.model.tasks';
import type { CheckListModel } from 'tasks.v2.model.check-list';
import type { UserDto } from 'tasks.v2.provider.service.user-service';

import type { TagDto, TaskDto, TaskSliderData, EmailDto, ReplicateParamsDto } from './types';

export function mapModelToDto(task: TaskModel): TaskDto
{
	const user = Core.getParams().currentUser;
	const parentId = task.parentId;
	const responsibleIds = task.responsibleIds;

	return {
		id: task.id,
		title: task.title,
		description: mapValue(task.description, mapDescription(task.description)),
		descriptionChecksum: task.descriptionChecksum,
		creator: mapValue(task.creatorId, { id: task.creatorId }),
		createdTs: mapValue(task.createdTs, Math.floor(task.createdTs / 1000)),
		responsible: mapValue(responsibleIds, responsibleIds?.length < 2 ? { id: responsibleIds?.[0] ?? 0 } : user),
		responsibleCollection: mapValue(responsibleIds, responsibleIds?.map((id: number): UserDto => ({ id }))),
		isMultitask: responsibleIds?.length > 1,
		deadlineTs: mapValue(task.deadlineTs, Math.floor(task.deadlineTs / 1000)),
		deadlineAfter: mapValue(task.deadlineAfter, Math.floor(task.deadlineAfter / 1000)),
		needsControl: Core.getParams().restrictions.control.available ? task.needsControl : false,
		startPlanTs: mapValue(task.startPlanTs, Math.floor(task.startPlanTs / 1000)),
		endPlanTs: mapValue(task.endPlanTs, Math.floor(task.endPlanTs / 1000)),
		startDatePlanAfter: mapValue(task.startDatePlanAfter, Math.floor(task.startDatePlanAfter / 1000)),
		endDatePlanAfter: mapValue(task.endDatePlanAfter, Math.floor(task.endDatePlanAfter / 1000)),
		fileIds: task.fileIds,
		checklist: task.checklist,
		parent: mapValue(parentId, idUtils.isTemplate(parentId) ? null : { id: parentId }),
		base: mapValue(parentId, idUtils.isTemplate(parentId) ? { id: idUtils.unbox(parentId) } : null),
		dependsOn: task.relatedTaskIds,
		ganttLinks: mapValue(task.ganttTaskIds, mapGanttLinks(task.id, task.ganttTaskIds)),
		group: mapValue(task.groupId, { id: task.groupId }),
		stage: mapValue(task.stageId, { id: task.stageId }),
		epicId: task.epicId,
		storyPoints: task.storyPoints,
		flow: mapValue(task.flowId, { id: task.flowId }),
		priority: mapValue(task.isImportant, task.isImportant ? 'high' : 'low'),
		status: task.status,
		statusChangedTs: mapValue(task.statusChangedTs, Math.floor(task.statusChangedTs / 1000)),
		accomplices: mapValue(task.accomplicesIds, task.accomplicesIds?.map((id: number): UserDto => ({ id }))),
		auditors: mapValue(task.auditorsIds, task.auditorsIds?.map((id: number): UserDto => ({ id }))),
		tags: mapValue(task.tags, task.tags?.map((name: string): TagDto => ({ name }))),
		chatId: task.chatId,
		crmItemIds: task.crmItemIds,
		email: task.email,
		allowsChangeDeadline: task.allowsChangeDeadline,
		allowsChangeDatePlan: task.allowsChangeDatePlan,
		allowsTimeTracking: task.allowsTimeTracking,
		estimatedTime: task.estimatedTime,
		matchesWorkTime: Core.getParams().restrictions.skipWeekends.available ? task.matchesWorkTime : false,
		matchesSubTasksTime: (
			Core.getParams().restrictions.relatedSubtaskDeadlines.available
				? task.matchesSubTasksTime
				: false
		),
		autocompleteSubTasks: (
			Core.getParams().restrictions.relatedSubtaskDeadlines.available
				? task.autocompleteSubTasks
				: false
		),
		source: task.source,
		templateId: task.templateId,
		requireResult: task.requireResult,
		reminders: mapValue(task.reminders, task.reminders?.map((it) => RemindersMappers.mapModelToDto(it))),
		maxDeadlineChangeDate: task.maxDeadlineChangeDate,
		maxDeadlineChanges: task.maxDeadlineChanges,
		requireDeadlineChangeReason: task.requireDeadlineChangeReason,
		deadlineChangeReason: task.deadlineChangeReason,
		containsSubTasks: task.containsSubTasks,
		userFields: task.userFields,
		type: mapValue(task.isForNewUser, task.isForNewUser ? TemplateType.NewUsers : TemplateType.Usual),
		permissions: mapValue(
			task.permissions,
			task.permissions?.map((it) => TemplateMappers.mapPermissionModelToDto(it)),
		),
		mark: task.mark,
		replicate: task.replicate && Type.isObject(task.replicateParams),
		replicateParams: mapReplicateParamsToDto(task),
	};
}

export function mapDtoToModel(taskDto: TaskDto): TaskModel
{
	const allowedNullFields = new Set([
		'maxDeadlineChangeDate',
		'maxDeadlineChanges',
	]);

	const task: TaskModel = {
		id: taskDto.id,
		title: taskDto.title,
		isImportant: mapValue(taskDto.priority, taskDto.priority === 'high'),
		description: mapValue(taskDto.description, Text.decode(taskDto.description)),
		descriptionChecksum: taskDto.descriptionChecksum,
		creatorId: taskDto.creator?.id,
		createdTs: mapValue(taskDto.createdTs, taskDto.createdTs * 1000),
		responsibleIds: mapTaskDtoToResponsibleIds(taskDto),
		deadlineTs: mapValue(taskDto.deadlineTs, taskDto.deadlineTs * 1000),
		deadlineAfter: mapValue(taskDto.deadlineAfter, taskDto.deadlineAfter * 1000),
		needsControl: taskDto.needsControl,
		startPlanTs: mapValue(taskDto.startPlanTs, taskDto.startPlanTs * 1000),
		endPlanTs: mapValue(taskDto.endPlanTs, taskDto.endPlanTs * 1000),
		startDatePlanAfter: mapValue(taskDto.startDatePlanAfter, taskDto.startDatePlanAfter * 1000),
		endDatePlanAfter: mapValue(taskDto.endDatePlanAfter, taskDto.endDatePlanAfter * 1000),
		fileIds: taskDto.fileIds,
		checklist: taskDto.checklist,
		containsChecklist: taskDto.containsChecklist,
		parentId: taskDto.parent?.id ?? mapValue(taskDto.base, idUtils.boxTemplate(taskDto.base?.id)),
		containsSubTasks: taskDto.containsSubTasks ?? taskDto.containsSubTemplates,
		containsRelatedTasks: taskDto.containsRelatedTasks,
		containsGanttLinks: taskDto.containsGanttLinks,
		containsPlacements: taskDto.containsPlacements,
		containsCommentFiles: taskDto.containsCommentFiles,
		requireResult: taskDto.requireResult,
		containsResults: taskDto.containsResults,
		numberOfReminders: taskDto.numberOfReminders,
		groupId: taskDto.group?.id,
		stageId: taskDto.stage?.id,
		flowId: taskDto.flow?.id,
		status: taskDto.status,
		statusChangedTs: mapValue(taskDto.statusChangedTs, taskDto.statusChangedTs * 1000),
		accomplicesIds: mapValue(taskDto.accomplices, taskDto.accomplices?.map(({ id }: UserDto): number => id)),
		auditorsIds: mapValue(taskDto.auditors, taskDto.auditors?.map(({ id }: UserDto): number => id)),
		chatId: taskDto.chatId,
		crmItemIds: taskDto.crmItemIds,
		allowsChangeDeadline: taskDto.allowsChangeDeadline,
		allowsChangeDatePlan: taskDto.allowsChangeDatePlan,
		allowsTimeTracking: taskDto.allowsTimeTracking,
		timers: taskDto.timers,
		timeSpent: taskDto.timeSpent,
		estimatedTime: taskDto.estimatedTime,
		numberOfElapsedTimes: taskDto.numberOfElapsedTimes,
		matchesWorkTime: taskDto.matchesWorkTime,
		matchesSubTasksTime: taskDto.matchesSubTasksTime,
		autocompleteSubTasks: taskDto.autocompleteSubTasks,
		templateId: taskDto.templateId,
		rights: taskDto.rights,
		tags: mapValue(taskDto.tags, taskDto.tags?.map(({ name }: TagDto): string => name)),
		isFavorite: mapValue(taskDto.inFavorite, taskDto.inFavorite?.includes(Core.getParams().currentUser.id)),
		isMuted: mapValue(taskDto.inMute, taskDto.inMute?.includes(Core.getParams().currentUser.id)),
		archiveLink: taskDto.archiveLink,
		maxDeadlineChangeDate: taskDto.maxDeadlineChangeDate,
		maxDeadlineChanges: taskDto.maxDeadlineChanges,
		requireDeadlineChangeReason: taskDto.requireDeadlineChangeReason,
		deadlineChangeReason: taskDto.deadlineChangeReason,
		email: mapValue(
			taskDto.email,
			taskDto.email ? { ...taskDto.email, dateTs: taskDto.email.dateTs * 1000 } : null,
		),
		userFields: mapValue(taskDto.userFields, mapUserFields(taskDto.id, taskDto.userFields ?? [])),
		isForNewUser: mapValue(taskDto.type, taskDto.type === TemplateType.NewUsers),
		permissions: mapValue(
			taskDto.permissions,
			taskDto.permissions?.map((it) => TemplateMappers.mapPermissionDtoToModel(it)),
		),
		replicate: taskDto.replicate,
		mark: taskDto.mark,
		replicateParams: mapReplicateParamsToModel(taskDto),
	};

	return Object.fromEntries(
		Object.entries(task).filter(([key: string, value: any]) => {
			if (allowedNullFields.has(key))
			{
				return !Type.isUndefined(value);
			}

			return !Type.isNil(value);
		}),
	);
}

export function mapModelToSliderData(task: TaskModel, checkLists: CheckListModel[]): TaskSliderData
{
	const accomplices = CheckListMappers.getUserIdsFromChecklists(checkLists, 'accomplices');
	const auditors = CheckListMappers.getUserIdsFromChecklists(checkLists, 'auditors');

	const data = {
		TITLE: task.title,
		DESCRIPTION: mapValue(task.description, mapDescription(task.description)),
		RESPONSIBLE_ID: task.responsibleIds[0],
		GROUP_ID: task.groupId,
		DEADLINE_TS: mapValue(task.deadlineTs, Math.floor(task.deadlineTs / 1000)),
		IS_IMPORTANT: mapValue(task.isImportant, task.isImportant ? 'Y' : null),
		FILE_IDS: mapValue(task.fileIds, task.fileIds?.length > 0 ? task.fileIds : null),
		CHECKLIST: CheckListMappers.mapModelToSliderData(checkLists),
		ACCOMPLICES: mapValue(accomplices, accomplices.length > 0 ? accomplices : null),
		AUDITORS: mapValue(auditors, auditors.length > 0 ? auditors : null),
	};

	return Object.fromEntries(Object.entries(data).filter(([, value]) => !Type.isNil(value)));
}

export function mapSliderDataToModel(data: TaskSliderData): TaskModel
{
	const task: TaskModel = {
		title: data.TITLE ? decodeURIComponent(data.TITLE) : null,
		description: Text.decode(data.DESCRIPTION),
		fileIds: data.UF_TASK_WEBDAV_FILES,
		parentId: Number(data.PARENT_ID) || mapValue(data.BASE_TEMPLATE, idUtils.boxTemplate(data.BASE_TEMPLATE)),
		crmItemIds: data.UF_CRM_TASK ? data.UF_CRM_TASK.split(';').filter((id) => id.trim()) : undefined,
		email: data.UF_MAIL_MESSAGE ? mapEmail(data) : undefined,
		tags: data.TAGS ? data.TAGS.split(',').map((tag) => tag.trim()) : undefined,
		groupId: Number(data.GROUP_ID) || undefined,
		flowId: Number(data.FLOW_ID) || undefined,
		templateId: Number(data.TEMPLATE) || undefined,
		copiedFromId: Number(data.COPY) || undefined,
		source: mapValue(data.IM_MESSAGE_ID, {
			type: 'chat',
			entityId: Number(data.IM_CHAT_ID),
			subEntityId: Number(data.IM_MESSAGE_ID),
		}),
		context: data.context || undefined,
	};

	return Object.fromEntries(Object.entries(task).filter(([, value]) => !Type.isNil(value)));
}

function mapValue(value: any, mappedValue: any): any | undefined
{
	return Type.isNil(value) ? value : mappedValue;
}

// TODO: Temporary. Remove when removing old full card
function mapDescription(description: ?string): ?string
{
	return description?.replaceAll(/\[p]\n|\[p]\[\/p]|\[\/p]/gi, '').trim();
}

function mapGanttLinks(taskId: number, taskIds: number[]): { [taskId: number]: string }
{
	if (!taskIds)
	{
		return null;
	}

	return Object.fromEntries(
		taskIds.map((dependentId: number) => [
			dependentId,
			Core.getStore().getters[`${Model.GanttLinks}/getLink`]({ taskId, dependentId }).type,
		]),
	);
}

function mapEmail(data: Object): EmailDto
{
	const id = Number(data.UF_MAIL_MESSAGE);
	const title = decodeURIComponent(data.MAIL_SUBJECT);
	const from = decodeURIComponent(data.MAIL_FROM);
	const dateTs = data.MAIL_DATE ? parseInt(data.MAIL_DATE, 10) * 1000 : null;

	return {
		id,
		title,
		from,
		dateTs,
		link: `/mail/message/${id}`,
	};
}

function mapUserFields(taskId: number, userFields: Array): Array<{ key: string, value: any }>
{
	if (Type.isArrayFilled(userFields))
	{
		return userFields;
	}

	const task: TaskModel = Core.getStore().getters[`${Model.Tasks}/getById`](taskId);

	return task && Type.isArray(task.userFields) ? task.userFields : [];
}

function mapTaskDtoToResponsibleIds(taskDto: TaskDto): number[] | undefined
{
	const responsibleIds: Set<number> = new Set();

	if (Type.isArray(taskDto.responsibleCollection))
	{
		taskDto.responsibleCollection.forEach(({ id }) => responsibleIds.add(id));
	}

	if (Type.isArray(taskDto.multiResponsibles))
	{
		taskDto.multiResponsibles.forEach(({ id }) => responsibleIds.add(id));
	}

	if (Type.isNumber(taskDto.responsible?.id))
	{
		responsibleIds.add(taskDto.responsible.id);
	}

	if (responsibleIds.size > 0)
	{
		return [...responsibleIds];
	}

	return undefined;
}

function mapReplicateParamsToModel({ replicateParams }: TaskModel): ?TaskReplicateParams
{
	if (!Type.isObject(replicateParams))
	{
		return null;
	}

	const startDate = DateStringConverter.parseServerDate(replicateParams.startDate);
	const startTime = TimeStringConverter.parseServerTime(replicateParams.time);

	const startTs = DateStringConverter.convertServerDateToTs(startDate, startTime);

	let endTs = null;
	if (!Type.isNil(replicateParams.endDate))
	{
		const endDate = DateStringConverter.parseServerDate(replicateParams.endDate);
		endTs = DateStringConverter.convertServerDateToTs(endDate);
	}

	return {
		...replicateParams,
		startTs,
		endTs,
		yearlyMonth1: mapValue(replicateParams.yearlyMonth1, replicateParams.yearlyMonth1 + 1),
		yearlyMonth2: mapValue(replicateParams.yearlyMonth2, replicateParams.yearlyMonth2 + 1),
		yearlyWeekDay: mapValue(replicateParams.yearlyWeekDay, replicateParams.yearlyWeekDay + 1),
	};
}

function mapReplicateParamsToDto({ replicateParams }: TaskModel): ReplicateParamsDto | undefined
{
	if (!Type.isObject(replicateParams))
	{
		return undefined;
	}

	const startDate = DateStringConverter.convertTsToServerDateString(replicateParams.startTs);
	const time = TimeStringConverter.convertTsToServerTimeString(replicateParams.startTs);

	const endDate = Type.isNil(replicateParams.endTs)
		? null
		: DateStringConverter.convertTsToServerDateString(replicateParams.endTs)
	;

	return {
		...replicateParams,
		startDate,
		time,
		endDate,
		yearlyMonth1: mapValue(replicateParams.yearlyMonth1, replicateParams.yearlyMonth1 - 1),
		yearlyMonth2: mapValue(replicateParams.yearlyMonth2, replicateParams.yearlyMonth2 - 1),
		yearlyWeekDay: mapValue(replicateParams.yearlyWeekDay, replicateParams.yearlyWeekDay - 1),
	};
}
