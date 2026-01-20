import { Type } from 'main.core';
import { TaskStatus, Mark } from 'tasks.v2.const';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { PushData } from './types';

export function mapInstantFields(model: TaskModel): TaskModel
{
	const task: TaskModel = {
		id: model.id,
		deadlineTs: model.deadlineTs,
		status: model.status,
		stageId: model.stageId,
		auditorsIds: model.auditorsIds,
	};

	return Object.fromEntries(Object.entries(task).filter(([, value]) => !Type.isUndefined(value)));
}

export function mapPushToModel({ AFTER: after, TASK_ID: id }: PushData): TaskModel
{
	const task: TaskModel = {
		id,
		title: prepareValue(after.TITLE),
		isImportant: prepareValue(after.PRIORITY, after.PRIORITY === 2),
		creatorId: prepareValue(after.CREATED_BY),
		responsibleIds: prepareValue(after.RESPONSIBLE_ID, mapResponsibleId(after.RESPONSIBLE_ID)),
		deadlineTs: prepareValue(after.DEADLINE, after.DEADLINE * 1000),
		checklist: undefined,
		groupId: prepareValue(after.GROUP_ID),
		stageId: prepareValue(after.STAGE, after.STAGE_INFO?.id ?? 0),
		flowId: prepareValue(after.FLOW_ID),
		status: prepareValue(after.STATUS, mapStatus(after.STATUS)),
		statusChangedTs: prepareValue(after.STATUS, Date.now()),
		accomplicesIds: prepareValue(after.ACCOMPLICES, mapUserIds(after.ACCOMPLICES)),
		auditorsIds: prepareValue(after.AUDITORS, mapUserIds(after.AUDITORS)),
		parentId: prepareValue(after.PARENT_ID, Number(after.PARENT_ID) || 0),
		tags: prepareValue(after.TAGS, after.TAGS ? after.TAGS.split(',') : []),
		mark: prepareValue(after.MARK, mapMark(String(after.MARK))),
	};

	return Object.fromEntries(Object.entries(task).filter(([, value]) => !Type.isUndefined(value)));
}

function mapStatus(status: number): string
{
	return {
		2: TaskStatus.Pending,
		3: TaskStatus.InProgress,
		4: TaskStatus.SupposedlyCompleted,
		5: TaskStatus.Completed,
		6: TaskStatus.Deferred,
	}[status] ?? TaskStatus.Pending;
}

function mapMark(mark: ?string): string
{
	return {
		false: Mark.None,
		P: Mark.Positive,
		N: Mark.Negative,
	}[mark] ?? Mark.None;
}

function mapUserIds(users: string): number[]
{
	if (!users)
	{
		return [];
	}

	return users.split(',').map((id: string) => Number(id));
}

function mapResponsibleId(responsibleId: ?number): number[]
{
	return Type.isNumber(responsibleId) ? [responsibleId] : [];
}

function prepareValue(value: any, mappedValue: ?any = value): any | undefined
{
	return Type.isUndefined(value) ? undefined : mappedValue;
}
