import { hint, type HintParams } from 'ui.vue3.directives.hint';
import { TextSm } from 'ui.system.typography.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { FieldAdd } from 'tasks.v2.component.elements.field-add';
import { tooltip } from 'tasks.v2.component.elements.hint';
import { idUtils } from 'tasks.v2.lib.id-utils';
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
	directives: { hint },
	inject: {
		task: {},
		isTemplate: {},
	},
	setup(): { task: TaskModel }
	{
		return {
			Outline,
		};
	},
	computed: {
		disabled(): boolean
		{
			return this.isTemplate && (this.task.isForNewUser || idUtils.isTemplate(this.task.parentId));
		},
		tooltip(): ?Function
		{
			if (!this.disabled)
			{
				return null;
			}

			return (): HintParams => tooltip({
				text: this.loc('TASKS_TASK_TEMPLATE_COMPONENT_TEMPLATE_NO_REPLICATION_TEMPLATE_NOTICE', {
					'#TPARAM_FOR_NEW_USER#': this.loc('TASKS_V2_RESPONSIBLE_FOR_NEW_USER'),
				}),
				popupOptions: {
					offsetLeft: this.$refs.add.$el.offsetWidth / 2,
				},
				timeout: 200,
			});
		},
	},
	template: `
		<div class="tasks-field-replication-wrapper">
			<div class="tasks-field-replication-title">
				<TextSm style="color: var(--ui-color-base-3)">{{ loc('TASKS_V2_REPLICATION_TITLE') }}</TextSm>
			</div>
			<div class="tasks-field-replication-content">
				<ReplicationContentState v-if="task.replicate"/>
				<FieldAdd v-else v-hint="tooltip" :icon="Outline.REPEAT" :disabled ref="add"/>
			</div>
		</div>
	`,
};
