import { Type } from 'main.core';
import { TaskStatus, Mark } from 'tasks.v2.const';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { TaskPush } from './types';

export function mapInstantFields(model: TaskModel): TaskModel
{
	const task: TaskModel = {
		id: model.id,
		deadlineTs: model.deadlineTs,
		status: model.status,
		stageId: model.stageId,
		auditorsIds: model.auditorsIds,
		needsControl: model.needsControl,
		requireResult: model.requireResult,
	};

	return Object.fromEntries(Object.entries(task).filter(([, value]) => !Type.isUndefined(value)));
}

export function mapPushToModel(id: number, data: TaskPush): TaskModel
{
	const storeTask = taskService.getStoreTask(id);

	const task: TaskModel = {
		id,
		title: data.TITLE,
		isImportant: mapValue(data.PRIORITY, data.PRIORITY === 2),
		creatorId: data.CREATED_BY,
		responsibleIds: mapValue(data.RESPONSIBLE_ID, [data.RESPONSIBLE_ID]),
		deadlineTs: mapValue(data.DEADLINE, data.DEADLINE * 1000),
		startPlanTs: mapValue(data.START_DATE_PLAN, data.START_DATE_PLAN * 1000),
		endPlanTs: mapValue(data.END_DATE_PLAN, data.END_DATE_PLAN * 1000),
		groupId: data.GROUP_ID,
		epicId: mapValue(data.GROUP_ID, data.GROUP_ID === storeTask.groupId ? undefined : 0),
		storyPoints: mapValue(data.GROUP_ID, data.GROUP_ID === storeTask.groupId ? undefined : ''),
		stageId: mapValue(data.STAGE_INFO, data.STAGE_INFO?.id ?? 0),
		flowId: data.FLOW_ID,
		status: mapValue(data.STATUS, mapStatus(data.STATUS)),
		statusChangedTs: mapValue(data.STATUS, Date.now()),
		accomplicesIds: mapValue(data.ACCOMPLICES, mapUserIds(data.ACCOMPLICES)),
		auditorsIds: mapValue(data.AUDITORS, mapUserIds(data.AUDITORS)),
		parentId: mapValue(data.PARENT_ID, Number(data.PARENT_ID) || 0),
		tags: mapValue(data.TAGS, data.TAGS ? data.TAGS.split(',') : []),
		mark: mapValue(data.MARK, mapMark(data.MARK)),
		fileIds: mapValue(data.UF_TASK_WEBDAV_FILES, mapFileIds(data.UF_TASK_WEBDAV_FILES)),
		crmItemIds: mapCrmItemIds(storeTask.crmItemIds, data.UF_CRM_TASK_ADDED, data.UF_CRM_TASK_DELETED),
		estimatedTime: data.TIME_ESTIMATE,
		needsControl: data.TASK_CONTROL,
		requireResult: mapValue(data.taskRequireResult, data.taskRequireResult === 'Y'),
	};

	return Object.fromEntries(Object.entries(task).filter(([, value]) => !Type.isUndefined(value)));
}

const mapStatus = (status: number): string => ({
	2: TaskStatus.Pending,
	3: TaskStatus.InProgress,
	4: TaskStatus.SupposedlyCompleted,
	5: TaskStatus.Completed,
	6: TaskStatus.Deferred,
}[status] ?? TaskStatus.Pending);

const mapMark = (mark: ?string): string => ({
	P: Mark.Positive,
	N: Mark.Negative,
}[mark] ?? Mark.None);

const mapFileIds = (ufFiles: string): number[] => {
	return ufFiles ? ufFiles.split(',').map((it) => Number(it) || it) : [];
};

const mapCrmItemIds = (ids: string[], ufCrmAdded: string, ufCrmDeleted: string): number[] => {
	if (Type.isUndefined(ids) || (Type.isUndefined(ufCrmAdded) && Type.isUndefined(ufCrmDeleted)))
	{
		return undefined;
	}

	const deletedIds = new Set(ufCrmDeleted?.split?.(',').map((id) => id) ?? []);
	const addedIds = ufCrmAdded?.split?.(',').map((id) => id) ?? [];

	return [...ids.filter((id) => !deletedIds.has(id)), ...addedIds];
};

const mapUserIds = (users: string): number[] => {
	if (!users)
	{
		return [];
	}

	return users.split(',').map((id: string) => Number(id));
};

const mapValue = (value: any, mapped: any): any | undefined => (Type.isUndefined(value) ? undefined : mapped);
