import { Type } from 'main.core';
import { CheckListMappers } from 'tasks.v2.provider.service.check-list-service';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { CheckListModel } from 'tasks.v2.model.check-list';
import type { TaskDto, TaskSliderData } from './types';

export function mapModelToDto(task: TaskModel): TaskDto
{
	return {
		id: task.id,
		title: prepareValue(task.title),
		description: prepareValue(task.description, mapDescription(task.description)),
		creator: prepareValue(task.creatorId, { id: task.creatorId }),
		createdTs: prepareValue(task.createdTs, Math.floor(task.createdTs / 1000)),
		responsible: prepareValue(task.responsibleId, { id: task.responsibleId }),
		deadlineTs: prepareValue(task.deadlineTs, Math.floor(task.deadlineTs / 1000)),
		needsControl: prepareValue(task.needsControl),
		fileIds: prepareValue(task.fileIds),
		checklist: prepareValue(task.checklist),
		group: prepareValue(task.groupId, { id: task.groupId }),
		stage: prepareValue(task.stageId, { id: task.stageId }),
		flow: prepareValue(task.flowId, { id: task.flowId }),
		priority: prepareValue(task.isImportant, task.isImportant ? 'high' : 'low'),
		status: prepareValue(task.status),
		statusChangedTs: prepareValue(task.statusChangedTs, Math.floor(task.statusChangedTs / 1000)),
		accomplices: prepareValue(task.accomplicesIds, task.accomplicesIds?.map((id) => ({ id }))),
		auditors: prepareValue(task.auditorsIds, task.auditorsIds?.map((id) => ({ id }))),
		chatId: prepareValue(task.chatId),
		parent: undefined,
	};
}

export function mapDtoToModel(taskDto: TaskDto): TaskModel
{
	const task = {
		id: taskDto.id,
		title: taskDto.title,
		isImportant: taskDto.priority === 'high',
		description: taskDto.description,
		creatorId: taskDto.creator.id,
		createdTs: taskDto.createdTs * 1000,
		responsibleId: taskDto.responsible.id,
		deadlineTs: taskDto.deadlineTs * 1000,
		needsControl: taskDto.needsControl,
		fileIds: taskDto.fileIds,
		checklist: taskDto.checklist ?? [],
		containsChecklist: taskDto.containsChecklist,
		groupId: taskDto.group?.id,
		stageId: taskDto.stage?.id,
		flowId: taskDto.flow?.id,
		status: taskDto.status,
		statusChangedTs: taskDto.statusChangedTs * 1000,
		accomplicesIds: taskDto.accomplices.map(({ id }) => id),
		auditorsIds: taskDto.auditors.map(({ id }) => id),
		chatId: taskDto.chatId,
	};

	if (taskDto.rights)
	{
		task.rights = taskDto.rights;
	}

	return task;
}

export function mapModelToSliderData(task: TaskModel, checkLists: CheckListModel[]): TaskSliderData
{
	const data = {
		TITLE: prepareValue(task.title),
		DESCRIPTION: prepareValue(task.description, mapDescription(task.description)),
		RESPONSIBLE_ID: prepareValue(task.responsibleId),
		GROUP_ID: prepareValue(task.groupId),
		DEADLINE_TS: prepareValue(task.deadlineTs, Math.floor(task.deadlineTs / 1000)),
		IS_IMPORTANT: prepareValue(task.isImportant, task.isImportant ? 'Y' : null),
		FILE_IDS: prepareValue(task.fileIds, task.fileIds?.length > 0 ? task.fileIds : null),
		CHECKLIST: CheckListMappers.mapModelToSliderData(checkLists),
	};

	return Object.fromEntries(Object.entries(data).filter(([, value]) => value));
}

function prepareValue(value: any, mappedValue: any = value): any | undefined
{
	return Type.isUndefined(value) ? undefined : mappedValue;
}

// TODO: Temporary. Remove when removing old full card
function mapDescription(description: ?string): ?string
{
	return description?.replaceAll('[p]\n', '').replaceAll('[/p]', '');
}
