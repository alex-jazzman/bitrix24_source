import { TextSm } from 'ui.system.typography.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { FieldAdd } from 'tasks.v2.component.elements.field-add';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { ReplicationContentState } from './replication-content-state';
import './replication-content.css';

// @vue/component
export const ReplicationContent = {
	name: 'ReplicationContent',
	components: {
		ReplicationContentState,
		TextSm,
		FieldAdd,
	},
	inject: {
		task: {},
	},
	setup(): { task: TaskModel }
	{
		return {
			Outline,
		};
	},
	template: `
		<div class="tasks-field-replication-wrapper">
			<div class="tasks-field-replication-title">
				<TextSm style="color: var(--ui-color-base-3)">{{ loc('TASKS_V2_REPLICATION_TITLE') }}</TextSm>
			</div>
			<div class="tasks-field-replication-content">
				<ReplicationContentState v-if="task.replicateParams"/>
				<FieldAdd v-else :icon="Outline.REPEAT"/>
			</div>
		</div>
	`,
};
