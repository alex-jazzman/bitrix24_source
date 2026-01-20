import { HeadlineMd } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import type { TaskModel } from 'tasks.v2.model.tasks';

import './replication-sheet-header.css';

// @vue/component
export const ReplicationSheetHeader = {
	name: 'ReplicationSheetHeader',
	components: {
		HeadlineMd,
		BIcon,
	},
	emits: ['close'],
	setup(): { task: TaskModel }
	{
		return {
			Outline,
		};
	},
	template: `
		<div class="tasks-field-replication-sheet-header">
			<HeadlineMd>{{ loc('TASKS_V2_REPLICATION_HISTORY_SHEET') }}</HeadlineMd>
			<BIcon
				class="tasks-field-replication-sheet-close"
				:name="Outline.CROSS_L"
				hoverable
				@click="$emit('close')"
			/>
		</div>
	`,
};
