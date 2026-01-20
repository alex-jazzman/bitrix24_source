import { Loc } from 'main.core';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { TaskField } from 'tasks.v2.const';
import { ganttService } from 'tasks.v2.provider.service.relation-service';
import type { RelationFieldMeta } from 'tasks.v2.component.fields.relation-tasks';

export const ganttMeta: RelationFieldMeta = Object.freeze({
	id: TaskField.Gantt,
	icon: Outline.STAGES,
	idsField: 'ganttTaskIds',
	containsField: 'containsGanttLinks',
	getTitle: () => Loc.getMessage('TASKS_V2_GANTT_TITLE_V2'),
	getChipTitle: () => Loc.getMessage('TASKS_V2_GANTT_TITLE_CHIP_V2'),
	getCountLoc: () => 'TASKS_V2_GANTT_TITLE_COUNT_V2',
	getHint: () => Loc.getMessage('TASKS_V2_GANTT_ADD_V2'),
	service: ganttService,
	right: 'createGanttDependence',
});
