import { Type } from 'main.core';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';

import { Core } from 'tasks.v2.core';
import { Model } from 'tasks.v2.const';
import { analytics } from 'tasks.v2.lib.analytics';
import { highlighter } from 'tasks.v2.lib.highlighter';
import { timeTrackingService } from 'tasks.v2.provider.service.time-tracking-service';
import type { ElapsedTimeModel } from 'tasks.v2.model.elapsed-times';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { TimeTrackingListItemEdit } from './item/time-tracking-list-item-edit';
import { TimeTrackingListItemView } from './item/time-tracking-list-item-view';

// @vue/component
export const TimeTrackingListItem = {
	name: 'TasksTimeTrackingListItem',
	components: {
		TimeTrackingListItemEdit,
		TimeTrackingListItemView,
	},
	inject: {
		task: {},
		taskId: {},
		analytics: {},
	},
	props: {
		elapsedId: {
			type: [Number, String],
			required: true,
		},
		editMode: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['save', 'edit', 'cancel'],
	setup(): { task: TaskModel } {},
	data(): Object
	{
		return {
			localElapsedId: this.elapsedId,
			localEditMode: this.editMode,
		};
	},
	computed: {
		elapsedTime(): ?ElapsedTimeModel
		{
			return this.$store.getters[`${Model.ElapsedTimes}/getById`](this.localElapsedId);
		},
		isEdit(): boolean
		{
			return Type.isNumber(this.elapsedTime?.id);
		},
		isTimeTrackingLocked(): boolean
		{
			return !Core.getParams().restrictions.timeTracking.available;
		},
	},
	watch: {
		elapsedId(elapsedId: number | string): void
		{
			this.localElapsedId = elapsedId;
		},
		editMode(value: boolean): void
		{
			this.localEditMode = value;
		},
	},
	methods: {
		async handleSave(localElapsedTime: ElapsedTimeModel): Promise<void>
		{
			this.localEditMode = false;

			this.$emit('save');

			if (this.isEdit)
			{
				void highlighter.highlight(this.$refs.item);

				await timeTrackingService.update(this.taskId, {
					...this.elapsedTime,
					...localElapsedTime,
				});
			}
			else
			{
				this.localElapsedId = await timeTrackingService.add(this.taskId, {
					id: this.elapsedId,
					...localElapsedTime,
				});

				analytics.sendManualTimeTracking(this.analytics, {
					taskId: this.taskId,
				});
			}
		},
		handleEdit(): void
		{
			this.$emit('edit', this.localElapsedId);

			this.localEditMode = true;
		},
		handleCancel(): void
		{
			this.localEditMode = false;

			this.$emit('cancel');
		},
		removeItem(): void
		{
			const messageBox = MessageBox.create({
				message: this.loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_ACTION_REMOVE_CONFIRM'),
				okCaption: this.loc('TASKS_V2_TIME_TRACKING_SHEET_LIST_ACTION_REMOVE_CONFIRM_OK'),
				useAirDesign: true,
				popupOptions: {
					closeIcon: false,
				},
				onOk: () => {
					void timeTrackingService.delete(this.taskId, this.elapsedTime);
					messageBox.close();
				},
				onCancel: () => {
					messageBox.close();
				},
				buttons: MessageBoxButtons.OK_CANCEL,
			});
			messageBox.show();
		},
	},
	template: `
		<div ref="item" class="tasks-time-tracking-list-item">
			<template v-if="localEditMode">
				<TimeTrackingListItemEdit
					:elapsedTimeCreatedAtTs="elapsedTime?.createdAtTs"
					:elapsedTimeSeconds="elapsedTime?.seconds"
					:elapsedTimeText="elapsedTime?.text"
					@save="handleSave"
					@cancel="handleCancel"
				/>
			</template>
			<template v-else>
				<TimeTrackingListItemView
					:elapsedId="localElapsedId"
					@edit="handleEdit"
					@remove="removeItem"
				/>
			</template>
		</div>
	`,
};
