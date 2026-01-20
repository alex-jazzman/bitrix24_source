import { Loc } from 'main.core';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { TaskField } from 'tasks.v2.const';
import { subTasksService } from 'tasks.v2.provider.service.relation-service';
import type { RelationFieldMeta } from 'tasks.v2.component.fields.relation-tasks';

export const subTasksMeta: RelationFieldMeta = Object.freeze({
	id: TaskField.SubTasks,
	icon: Outline.RELATED_TASKS,
	idsField: 'subTaskIds',
	containsField: 'containsSubTasks',
	getTitle: (isTemplate: boolean): string => {
		if (isTemplate)
		{
			return Loc.getMessage('TASKS_V2_SUB_TEMPLATES_TITLE');
		}

		return Loc.getMessage('TASKS_V2_SUB_TASKS_TITLE');
	},
	getChipTitle: (isTemplate: boolean): string => {
		if (isTemplate)
		{
			return Loc.getMessage('TASKS_V2_SUB_TEMPLATES_TITLE_CHIP');
		}

		return Loc.getMessage('TASKS_V2_SUB_TASKS_TITLE_CHIP');
	},
	getCountLoc: (isTemplate: boolean): string => {
		if (isTemplate)
		{
			return 'TASKS_V2_SUB_TEMPLATES_TITLE_COUNT';
		}

		return 'TASKS_V2_SUB_TASKS_TITLE_COUNT';
	},
	getHint: (isTemplate: boolean) => {
		if (isTemplate)
		{
			return Loc.getMessage('TASKS_V2_SUB_TEMPLATES_ADD');
		}

		return Loc.getMessage('TASKS_V2_SUB_TASKS_ADD');
	},
	service: subTasksService,
	right: 'createSubtask',
});
