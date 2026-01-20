import { Event } from 'main.core';

import { Button as UiButton, ButtonColor, ButtonSize, AirButtonStyle } from 'ui.vue3.components.button';
import 'ui.icon-set.outline';

import { EventName } from 'tasks.v2.const';
import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { replicationMeta } from '../../../replication-meta';
import './replication-sheet-footer.css';

// @vue/component
export const ReplicationSheetFooter = {
	name: 'ReplicationSheetFooter',
	components: {
		UiButton,
	},
	inject: {
		task: {},
		taskId: {},
		isTemplate: {},
	},
	props: {
		replicateParams: {
			type: Object,
			required: true,
		},
	},
	emits: ['close'],
	setup(): { task: TaskModel }
	{
		return {
			AirButtonStyle,
			ButtonColor,
			ButtonSize,
		};
	},
	computed: {
		wasFilled(): boolean
		{
			return this.task.filledFields[replicationMeta.id];
		},
	},
	created(): void
	{
		this.wasEmpty = !this.wasFilled || !this.task.replicateParams;
	},
	methods: {
		async save(): void
		{
			this.$emit('close');

			if (this.wasEmpty)
			{
				void fieldHighlighter.setContainer(this.$root.$el).highlight(replicationMeta.id);
			}

			await taskService.update(this.taskId, {
				replicate: true,
				replicateParams: this.replicateParams,
			});

			Event.EventEmitter.emit(EventName.UpdateReplicateParams);
		},
	},
	template: `
		<div class="tasks-field-replication-sheet-footer">
			<UiButton
				:text="loc('TASKS_V2_REPLICATION_CANCEL')"
				:size="ButtonSize.MEDIUM"
				:color="ButtonColor.LIGHT"
				:style="AirButtonStyle.PLAIN"
				@click="$emit('close')"
			/>
			<UiButton
				:text="loc('TASKS_V2_REPLICATION_SAVE')"
				:size="ButtonSize.MEDIUM"
				:color="ButtonColor.PRIMARY"
				@click="save"
			/>
		</div>
	`,
};
