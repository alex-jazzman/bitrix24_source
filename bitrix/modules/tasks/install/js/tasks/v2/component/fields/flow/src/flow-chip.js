import { Chip, ChipDesign } from 'ui.system.chip.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Model } from 'tasks.v2.const';
import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import { flowService } from 'tasks.v2.provider.service.flow-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { FlowModel } from 'tasks.v2.model.flows';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { flowMeta } from './flow-meta';
import { flowDialog } from './flow-dialog';

// @vue/component
export const FlowChip = {
	components: {
		Chip,
	},
	inject: {
		task: {},
		taskId: {},
	},
	props: {
		isAutonomous: {
			type: Boolean,
			default: false,
		},
	},
	setup(): { task: TaskModel }
	{
		return {
			Outline,
			flowMeta,
		};
	},
	computed: {
		flow(): FlowModel
		{
			return this.$store.getters[`${Model.Flows}/getById`](this.task.flowId);
		},
		design(): string
		{
			return {
				[!this.isAutonomous && !this.isSelected]: ChipDesign.ShadowNoAccent,
				[!this.isAutonomous && this.isSelected]: ChipDesign.ShadowAccent,
				[this.isAutonomous && !this.isSelected]: ChipDesign.OutlineNoAccent,
				[this.isAutonomous && this.isSelected]: ChipDesign.OutlineAccent,
			}.true;
		},
		isSelected(): boolean
		{
			if (this.isAutonomous)
			{
				return this.task.flowId > 0;
			}

			return this.task.filledFields[flowMeta.id];
		},
		isFilled(): boolean
		{
			return this.isAutonomous && this.task.flowId > 0;
		},
		text(): string
		{
			if (this.isFilled)
			{
				return this.flow.name;
			}

			return this.loc('TASKS_V2_FLOW_TITLE_CHIP');
		},
	},
	created(): void
	{
		if (this.task.flowId && !this.flow)
		{
			void flowService.getFlow(this.task.flowId);
		}
	},
	methods: {
		handleClick(): void
		{
			if (!this.isAutonomous && this.isSelected)
			{
				this.highlightField();

				return;
			}

			flowDialog.show({
				targetNode: this.$el,
				taskId: this.taskId,
				onClose: this.highlightField,
			});
		},
		highlightField(): void
		{
			void fieldHighlighter.setContainer(this.$root.$el).highlight(flowMeta.id);
		},
		handleClear(): void
		{
			void taskService.update(this.taskId, {
				flowId: 0,
				groupId: 0,
			});
		},
	},
	// TODO: remove title prop when flow popup added
	template: `
		<Chip
			:design
			:icon="Outline.BOTTLENECK"
			:text
			:withClear="isFilled"
			:trimmable="isFilled"
			:data-task-id="taskId"
			:data-task-chip-id="flowMeta.id"
			:data-task-chip-value="task.flowId"
			@click="handleClick"
			@clear="handleClear"
			:title="flow?.name ?? ''"
		/>
	`,
};
