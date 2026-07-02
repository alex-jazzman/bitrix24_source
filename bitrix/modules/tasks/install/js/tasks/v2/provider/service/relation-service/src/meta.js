import { Loc } from 'main.core';
import { TaskField } from 'tasks.v2.const';
import { RelationMeta } from './types';

export const subTasksMeta: RelationMeta = Object.freeze({
	id: TaskField.SubTasks,
	idsField: 'subTaskIds',
	statusesField: 'subTaskStatuses',
	containsField: 'containsSubTasks',
	relationToField: 'parentId',
	showCompletedField: 'showCompletedSubTasks',
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
	statusesField: 'relatedTaskStatuses',
	containsField: 'containsRelatedTasks',
	relationToField: 'relatedToTaskId',
	showCompletedField: 'showCompletedRelatedTasks',
	controller: 'Task.Relation.Related',
	uniqueRight: 'detachRelated',
	addError: Loc.getMessage('TASKS_V2_RELATION_RELATED_TASKS_NO_ACCESS'),
	addErrorMany: Loc.getMessage('TASKS_V2_RELATION_RELATED_TASKS_NO_ACCESS_MANY'),
});

export const ganttMeta: RelationMeta = Object.freeze({
	id: TaskField.Gantt,
	idsField: 'ganttTaskIds',
	statusesField: 'ganttTaskStatuses',
	containsField: 'containsGanttLinks',
	relationToField: 'ganttParentId',
	showCompletedField: 'showCompletedGantt',
	controller: 'Task.Relation.Gantt.Dependence',
	uniqueRight: 'changeDependence',
});
