import { Loc } from 'main.core';
import { TaskField } from 'tasks.v2.const';
import { RelationMeta } from './types';

export const subTasksMeta: RelationMeta = Object.freeze({
	id: TaskField.SubTasks,
	idsField: 'subTaskIds',
	containsField: 'containsSubTasks',
	relationToField: 'parentId',
	controller: 'Task.Relation.Child',
	uniqueRight: 'detachParent',
	addError: Loc.getMessage('TASKS_V2_RELATION_SUBTASKS_NO_ACCESS'),
	addErrorMany: Loc.getMessage('TASKS_V2_RELATION_SUBTASKS_NO_ACCESS_MANY'),
	overrideError: Loc.getMessage('TASKS_V2_RELATION_CANNOT_OVERRIDE_PARENT'),
	overrideErrorMany: Loc.getMessage('TASKS_V2_RELATION_CANNOT_OVERRIDE_PARENT_MANY'),
});

export const relatedTasksMeta: RelationMeta = Object.freeze({
	id: TaskField.RelatedTasks,
	idsField: 'relatedTaskIds',
	containsField: 'containsRelatedTasks',
	relationToField: 'relatedToTaskId',
	controller: 'Task.Relation.Related',
	uniqueRight: 'detachRelated',
	addError: Loc.getMessage('TASKS_V2_RELATION_RELATED_TASKS_NO_ACCESS'),
	addErrorMany: Loc.getMessage('TASKS_V2_RELATION_RELATED_TASKS_NO_ACCESS_MANY'),
});

export const ganttMeta: RelationMeta = Object.freeze({
	id: TaskField.Gantt,
	idsField: 'ganttTaskIds',
	containsField: 'containsGanttLinks',
	relationToField: 'ganttParentId',
	controller: 'Task.Relation.Gantt.Dependence',
	uniqueRight: 'changeDependence',
});
