import { Button as UiButton, ButtonColor, ButtonSize, AirButtonStyle } from 'ui.vue3.components.button';
import 'ui.icon-set.outline';

import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
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
	emits: ['close', 'save'],
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
			if (this.wasEmpty)
			{
				void fieldHighlighter.setContainer(this.$root.$el).highlight(replicationMeta.id);
			}

			this.$emit('save');
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
