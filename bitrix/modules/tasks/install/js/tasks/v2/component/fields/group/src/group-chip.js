import { Runtime } from 'main.core';
import { Chip, ChipDesign, type ChipImage } from 'ui.system.chip.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { Model } from 'tasks.v2.const';
import { Hint } from 'tasks.v2.component.elements.hint';
import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import { showLimit } from 'tasks.v2.lib.show-limit';
import { analytics } from 'tasks.v2.lib.analytics';
import { groupService } from 'tasks.v2.provider.service.group-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { GroupModel } from 'tasks.v2.model.groups';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { groupMeta } from './group-meta';
import { groupDialog } from './group-dialog';
import { GroupPopup } from './group-popup/group-popup';

// @vue/component
export const GroupChip = {
	components: {
		Chip,
		Hint,
		GroupPopup,
	},
	inject: {
		analytics: {},
		cardType: {},
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
			groupMeta,
		};
	},
	data(): Object
	{
		return {
			doShowHint: false,
		};
	},
	computed: {
		group(): ?GroupModel
		{
			return this.$store.getters[`${Model.Groups}/getById`](this.task.groupId);
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
				return this.task.groupId > 0;
			}

			return this.task.filledFields[groupMeta.id];
		},
		isFilled(): boolean
		{
			return Boolean(this.isAutonomous && this.group);
		},
		isFlowFilled(): boolean
		{
			return this.task.flowId > 0;
		},
		text(): string
		{
			if (this.isFilled)
			{
				return this.group?.name ?? this.loc('TASKS_V2_GROUP_HIDDEN');
			}

			return this.loc('TASKS_V2_GROUP_TITLE_CHIP');
		},
		icon(): ?string
		{
			if (this.isFilled)
			{
				return null;
			}

			return Outline.FOLDER;
		},
		image(): ?ChipImage
		{
			if (!this.isFilled)
			{
				return null;
			}

			return {
				src: encodeURI(this.group?.image),
				alt: this.group?.name,
			};
		},
		canChange(): boolean
		{
			return (this.task.flowId ?? 0) <= 0;
		},
		isLocked(): boolean
		{
			return !Core.getParams().restrictions.project.available;
		},
	},
	created(): void
	{
		if (this.task.groupId && !this.group)
		{
			void groupService.getGroup(this.task.groupId);
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

			if (this.isLocked)
			{
				void showLimit({
					featureId: Core.getParams().restrictions.project.featureId,
				});

				return;
			}

			if (this.isFlowFilled)
			{
				this.doShowHint = true;

				return;
			}

			groupDialog.show({
				targetNode: this.$refs.chip.$el,
				taskId: this.taskId,
				onClose: this.handleDialogClose,
			});
		},
		handleDialogClose(groupId: number): void
		{
			if (this.isAutonomous)
			{
				this.$refs.chip?.$el.focus();
			}

			if (!this.isAutonomous && this.isSelected)
			{
				this.highlightField();
			}

			if (groupId && groupId !== this.task.groupId)
			{
				analytics.sendAddProject(this.analytics, {
					cardType: this.cardType,
					viewersCount: this.task.auditorsIds.length,
					coexecutorsCount: this.task.accomplicesIds.length,
				});
			}
		},
		highlightField(): void
		{
			void fieldHighlighter.setContainer(this.$root.$el).highlight(groupMeta.id);
		},
		handleClear(): void
		{
			void taskService.update(this.taskId, {
				groupId: 0,
				stageId: 0,
			});
		},
	},
	template: `
		<Chip
			:design
			:icon
			:image
			:text
			:withClear="isFilled && !isFlowFilled"
			:lock="isLocked"
			:trimmable="isFilled"
			:data-task-id="taskId"
			:data-task-chip-id="groupMeta.id"
			:data-task-chip-value="task.groupId"
			ref="chip"
			@click="handleClick"
			@clear="handleClear"
		/>
		<Hint
			v-if="doShowHint"
			:bindElement="$refs.chip.$el"
			@close="doShowHint = false"
		>
			{{ loc('TASKS_V2_GROUP_CANT_CHANGE_FLOW') }}
		</Hint>
		<GroupPopup v-if="isAutonomous" :getBindElement="() => $refs.chip.$el"/>
	`,
};
