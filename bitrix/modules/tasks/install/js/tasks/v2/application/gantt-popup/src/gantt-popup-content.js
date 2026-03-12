import { RichLoc } from 'ui.vue3.components.rich-loc';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { BInput } from 'ui.system.input.vue';
import { HeadlineMd, TextMd, TextXs } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { TaskField } from 'tasks.v2.const';
import { relationError } from 'tasks.v2.lib.relation-error';
import { ganttDialog, type Item } from 'tasks.v2.lib.relation-tasks-dialog';
import { ganttService } from 'tasks.v2.provider.service.relation-service';

import { GanttMenu } from './gantt-menu';
import './gantt-popup.css';

// @vue/component
export const GanttPopupContent = {
	components: {
		RichLoc,
		UiButton,
		BIcon,
		BInput,
		HeadlineMd,
		TextMd,
		TextXs,
		GanttMenu,
	},
	inject: {
		analytics: {},
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		close: {
			type: Function,
			required: true,
		},
		freeze: {
			type: Function,
			required: true,
		},
		unfreeze: {
			type: Function,
			required: true,
		},
		updated: {
			type: Function,
			default: null,
		},
	},
	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonSize,
			Outline,
		};
	},
	data(): Object
	{
		return {
			task: null,
			type: 'finish_start',
			isMenuShown: false,
			error: null,
		};
	},
	computed: {
		typeTitle(): string
		{
			return {
				finish_start: this.loc('TASKS_V2_GANTT_FINISH_START'),
				start_start: this.loc('TASKS_V2_GANTT_START_START'),
				start_finish: this.loc('TASKS_V2_GANTT_START_FINISH'),
				finish_finish: this.loc('TASKS_V2_GANTT_FINISH_FINISH'),
			}[this.type];
		},
	},
	methods: {
		showDialog(): void
		{
			this.freeze();
			this.handleClose = this.handleDialogClose;
			ganttDialog.show({
				targetNode: this.$refs.task.$refs.inputContainer,
				targetContainer: this.$refs.task.$el.closest('body'),
				taskId: this.taskId,
				ids: this.task ? [this.task.id] : [],
				analytics: this.analytics,
				onClose: (items: Item[]) => this.handleClose?.(items[0]),
			});
		},
		clearTask(): void
		{
			this.handleClose = null;
			this.task = null;
			this.error = null;
		},
		handleDialogClose(item: Item): void
		{
			this.unfreeze();
			if (this.task && item && this.task.id === item.getId())
			{
				return;
			}

			this.task = item ? { id: item.getId(), title: item.getTitle() } : null;

			this.error = null;
			if (this.task)
			{
				void this.checkDependence(this.task.id);
			}
		},
		showMenu(): void
		{
			this.isMenuShown = true;
			this.freeze();
		},
		hideMenu(): void
		{
			this.isMenuShown = false;
			this.unfreeze();
		},
		showHelpDesk(): void
		{
			top.BX.Helper.show('redirect=detail&code=18127718');
		},
		async checkDependence(dependentId: number): Promise<void>
		{
			this.error = await ganttService.checkDependence({
				taskId: this.taskId,
				dependentId,
			});
		},
		async handleAdd(): Promise<void>
		{
			this.close();

			const error = await ganttService.addDependence({
				taskId: this.taskId,
				dependentId: this.task.id,
				type: this.type,
			});

			if (error)
			{
				void relationError.setTaskId(this.taskId).showError(error, TaskField.Gantt);

				return;
			}

			this.updated?.();
		},
	},
	template: `
		<div class="tasks-field-gantt-popup">
			<div class="tasks-field-gantt-popup-header">
				<HeadlineMd>{{ loc('TASKS_V2_GANTT_POPUP_TITLE') }}</HeadlineMd>
				<BIcon :name="Outline.CROSS_L" hoverable @click="close"/>
			</div>
			<TextMd className="tasks-field-gantt-popup-description">
				<RichLoc :text="loc('TASKS_V2_GANTT_POPUP_DESCRIPTION')" placeholder="[helpdesk]">
					<template #helpdesk="{ text }">
						<span class="tasks-field-gantt-popup-description-help" @click="showHelpDesk">
							<BIcon :name="Outline.KNOWLEDGE_BASE"/>
							<TextXs>{{ text }}</TextXs>
						</span>
					</template>
				</RichLoc>
			</TextMd>
			<BInput
				:modelValue="task?.title ?? ''"
				:label="loc('TASKS_V2_GANTT_POPUP_TASK')"
				dropdown
				:withClear="Boolean(task)"
				clickable
				:error
				ref="task"
				@click="showDialog"
				@clear="clearTask"
			/>
			<BInput
				:modelValue="typeTitle"
				:label="loc('TASKS_V2_GANTT_POPUP_TYPE')"
				dropdown
				clickable
				:active="isMenuShown"
				ref="type"
				@click="showMenu"
			/>
			<div class="tasks-field-gantt-popup-buttons">
				<UiButton
					:text="loc('TASKS_V2_GANTT_POPUP_ADD')"
					:style="AirButtonStyle.PRIMARY"
					:size="ButtonSize.LARGE"
					:disabled="Boolean(!task || error)"
					@click="handleAdd"
				/>
				<UiButton
					:text="loc('TASKS_V2_GANTT_POPUP_CANCEL')"
					:style="AirButtonStyle.OUTLINE"
					:size="ButtonSize.LARGE"
					@click="close"
				/>
			</div>
		</div>
		<GanttMenu v-if="isMenuShown" v-model:type="type" :bindElement="$refs.type.$refs.inputContainer" @close="hideMenu"/>
	`,
};
