import { Loc } from 'main.core';
import { Actions } from 'ui.icon-set.api.vue';
import 'ui.icon-set.actions';

import { TaskField } from 'tasks.v2.const';
import { relatedTasksService } from 'tasks.v2.provider.service.relation-service';
import type { RelationFieldMeta } from 'tasks.v2.component.fields.relation-tasks';

export const relatedTasksMeta: RelationFieldMeta = Object.freeze({
	id: TaskField.RelatedTasks,
	icon: Actions.CONNECTION,
	idsField: 'relatedTaskIds',
	containsField: 'containsRelatedTasks',
	getTitle: () => Loc.getMessage('TASKS_V2_RELATED_TASKS_TITLE'),
	getChipTitle: () => Loc.getMessage('TASKS_V2_RELATED_TASKS_TITLE_CHIP'),
	getCountLoc: () => 'TASKS_V2_RELATED_TASKS_TITLE_COUNT',
	getHint: () => Loc.getMessage('TASKS_V2_RELATED_TASKS_ADD'),
	service: relatedTasksService,
	right: 'edit',
});
