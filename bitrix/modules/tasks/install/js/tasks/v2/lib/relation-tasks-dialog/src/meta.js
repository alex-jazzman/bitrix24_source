import { Loc } from 'main.core';
import { TaskField } from 'tasks.v2.const';
import { relatedTasksService, subTasksService } from 'tasks.v2.provider.service.relation-service';
import type { RelationDialogMeta } from './types';

export const subTasksMeta: RelationDialogMeta = Object.freeze({
	id: TaskField.SubTasks,
	idsField: 'subTaskIds',
	relationToField: 'parentId',
	footerText: Loc.getMessage('TASKS_V2_SUB_TASKS_CREATE'),
	service: subTasksService,
	isTemplate: true,
});

export const relatedTasksMeta: RelationDialogMeta = Object.freeze({
	id: TaskField.RelatedTasks,
	idsField: 'relatedTaskIds',
	relationToField: 'relatedToTaskId',
	footerText: Loc.getMessage('TASKS_V2_RELATED_TASKS_CREATE'),
	service: relatedTasksService,
});

export const ganttMeta: RelationDialogMeta = Object.freeze({
	footerText: Loc.getMessage('TASKS_V2_GANTT_CREATE'),
});
