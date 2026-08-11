import { Type } from 'main.core';

import { computed } from 'ui.vue3';
import { HeadlineMd, TextMd } from 'ui.system.typography.vue';
import { RichLoc } from 'ui.vue3.components.rich-loc';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import 'ui.icon-set.outline';

import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import type { TaskModel, TaskReplicateParams } from 'tasks.v2.model.tasks';
import { replicationService } from 'tasks.v2.provider.service.replication-service';
import { ReplicateCreator, taskService } from 'tasks.v2.provider.service.task-service';
import { deepToRaw } from 'tasks.v2.lib.reactive-utils';
import { calendar } from 'tasks.v2.lib.calendar';
import { ReplicationPeriod } from 'tasks.v2.const';

import { ReplicationSettings } from './replication-settings/replication-settings';
import { ReplicationStart } from './replication-start/replication-start';
import { ReplicationFinish } from './replication-finish/replication-finish';
import { ReplicationStartTime } from './replication-start-time/replication-start-time';
import { ReplicationDatepicker } from './replication-datepicker/replication-datepicker';
import { ReplicationDeadline } from './replication-deadline/replication-deadline';
import { ReplicationWeekend } from './replication-weekend/replication-weekend';
import { ReplicationSheetFooter } from './footer/replication-sheet-footer';

import './replication-sheet-content.css';

type Inject = { task: TaskModel, isTemplate: boolean };

// @vue/component
export const ReplicationSheetContent = {
	name: 'ReplicationSheetContent',
	components: {
		BIcon,
		HeadlineMd,
		HoverPill,
		ReplicationSettings,
		ReplicationStart,
		ReplicationStartTime,
		ReplicationDatepicker,
		ReplicationFinish,
		ReplicationDeadline,
		ReplicationWeekend,
		ReplicationSheetFooter,
		RichLoc,
		TextMd,
	},
	inject: {
		task: {},
		taskId: {},
		isTemplate: {},
		isEdit: {},
	},
	provide(): { replicateParams: TaskReplicateParams }
	{
		return {
			replicateParams: computed(() => this.replicateParams),
		};
	},
	emits: ['close'],
	setup(): { Outline: typeof Outline } & Inject
	{
		return {
			Outline,
		};
	},
	data(): { replicateParams: TaskReplicateParams }
	{
		return {
			replicateParams: ReplicateCreator.createEmptyReplicateParams(),
			initialReplicateParams: {},
		};
	},
	computed: {
		isDailyPeriod(): boolean
		{
			return this.replicateParams.period === ReplicationPeriod.Daily;
		},
		hasChanges(): boolean
		{
			return JSON.stringify(this.replicateParams) !== JSON.stringify(this.initialReplicateParams);
		},
	},
	created(): void
	{
		this.initReplicateParams();
	},
	mounted(): void
	{
		this.initialReplicateParams = deepToRaw(this.replicateParams);
	},
	methods: {
		initReplicateParams(): void
		{
			if (!Type.isObject(this.task?.replicateParams || null))
			{
				return;
			}

			this.replicateParams = {
				...this.replicateParams,
				...this.task.replicateParams,
				weekDays: [...(this.task.replicateParams.weekDays || [])],
			};
		},
		updateReplicateParams(params: Partial<TaskReplicateParams> = {}): void
		{
			this.replicateParams = {
				...this.replicateParams,
				...params,
			};
		},
		updateReplication(): void
		{
			const payload = {
				replicate: true,
				replicateParams: this.replicateParams,
			};

			this.$emit('close');

			if (!this.isEdit)
			{
				const deadlineOffset = this.replicateParams.deadlineOffset;
				if (deadlineOffset)
				{
					const deadlineOffsetTs = deadlineOffset * 1000;
					const now = Date.now();

					payload.deadlineTs = this.task.matchesWorkTime
						? calendar.calculateEndTs(now, now, deadlineOffsetTs)
						: now + deadlineOffsetTs;
				}

				taskService.updateStoreTask(this.taskId, payload);

				return;
			}

			void replicationService.update(this.task, payload);
		},
		showHelpDesk(): void
		{
			top.BX.Helper.show('redirect=detail&code=18127718');
		},
		showSaveConfirmDialog(): void
		{
			MessageBox.show({
				title: this.loc('TASKS_V2_REPLICATION_SAVE_CHANGES_TITLE'),
				message: this.loc('TASKS_V2_REPLICATION_SAVE_CHANGES_MESSAGE'),
				useAirDesign: true,
				buttons: MessageBoxButtons.YES_NO,
				yesCaption: this.loc('TASKS_V2_REPLICATION_SAVE_CHANGES_SAVE'),
				noCaption: this.loc('TASKS_V2_REPLICATION_SAVE_CHANGES_CANCEL'),
				onYes: (box) => {
					box.close();
					this.updateReplication();
				},
				onNo: (box) => {
					box.close();
					this.$emit('close');
				},
			});
		},
		async save(): void
		{
			if (!this.isEdit)
			{
				this.updateReplication();

				return;
			}

			const hasExistingReplication = Boolean(this.task?.replicateParams);

			if (!hasExistingReplication)
			{
				if (this.isTemplate)
				{
					this.updateReplication();

					return;
				}

				this.$emit('close');

				await replicationService.add(this.taskId, {
					...this.task,
					replicate: true,
					replicateParams: this.replicateParams,
				});

				return;
			}

			if (!this.hasChanges)
			{
				this.$emit('close');

				return;
			}

			this.showSaveConfirmDialog();
		},
	},
	template: `
		<div class="tasks-field-replication-sheet">
			<div class="tasks-field-replication-sheet-header">
				<HeadlineMd>{{ loc('TASKS_V2_REPLICATION_TITLE_SHEET') }}</HeadlineMd>
				<BIcon
					class="tasks-field-replication-sheet-close"
					:name="Outline.CROSS_L"
					hoverable
					@click="save"
				/>
			</div>
			<div class="tasks-field-replication-sheet-body">
				<div v-if="!isTemplate && !task.replicateParams" class="tasks-field-replication-sheet-description">
					<span class="tasks-field-replication-sheet-description-text">
						<RichLoc :text="loc('TASKS_V2_REPLICATION_SHEET_DESCRIPTION')" placeholder="[helpdesk]">
							<template #helpdesk="{ text }">
								<a class="tasks-field-replication-helpdesk" @click="showHelpDesk">{{ text }}</a>
							</template>
						</RichLoc>
					</span>
				</div>
				<ReplicationSettings @update="updateReplicateParams"/>
				<ReplicationStart @update="updateReplicateParams"/>
				<ReplicationFinish @update="updateReplicateParams"/>
				<div class="tasks-field-replication-settings">
					<ReplicationStartTime @update="updateReplicateParams"/>
					<ReplicationDeadline v-if="!isTemplate" @update="updateReplicateParams"/>
					<ReplicationWeekend v-if="isDailyPeriod" @update="updateReplicateParams"/>
				</div>
			</div>
			<ReplicationSheetFooter :replicateParams @close="$emit('close')" @save="save"/>
		</div>
	`,
};
