import { Event, Type } from 'main.core';
import { PopupManager } from 'main.popup';

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

		// main.popup closes the sheet from a capture-phase keyup listener on the document
		// and offers no veto, so the discard confirm has to claim Esc earlier: capture at
		// the window always runs before capture at the document, whatever the bind order.
		Event.bind(window, 'keyup', this.handleWindowKeyUp, true);
	},
	beforeUnmount(): void
	{
		Event.unbind(window, 'keyup', this.handleWindowKeyUp, true);
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
			top.BX.Helper.show('redirect=detail&code=26946040');
		},
		handleWindowKeyUp(event: KeyboardEvent): void
		{
			if (event.key !== 'Escape' || !this.hasChanges || !this.isTopPopupLayer())
			{
				return;
			}

			event.stopImmediatePropagation();
			this.showDiscardConfirmDialog();
		},
		isTopPopupLayer(): boolean
		{
			const shownPopups = PopupManager.getPopups().filter((popup) => popup.isShown());
			const ownPopup = shownPopups.find((popup) => popup.getPopupContainer()?.contains(this.$el));
			const ownZIndex = ownPopup ? ownPopup.getZindex() : 0;

			return shownPopups.every((popup) => popup.getZindex() <= ownZIndex);
		},
		handleCancel(): void
		{
			if (!this.hasChanges)
			{
				this.$emit('close');

				return;
			}

			this.showDiscardConfirmDialog();
		},
		showDiscardConfirmDialog(): void
		{
			MessageBox.show({
				title: this.loc('TASKS_V2_REPLICATION_DISCARD_CHANGES_TITLE'),
				message: this.loc('TASKS_V2_REPLICATION_DISCARD_CHANGES_MESSAGE'),
				useAirDesign: true,
				buttons: MessageBoxButtons.YES_NO,
				yesCaption: this.loc('TASKS_V2_REPLICATION_DISCARD_CHANGES_DISCARD'),
				noCaption: this.loc('TASKS_V2_REPLICATION_DISCARD_CHANGES_CANCEL'),
				popupOptions: { closeByEsc: true },
				onYes: (box) => {
					box.close();
					this.$emit('close');
				},
				onNo: (box) => {
					box.close();
				},
			});
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
		<div class="tasks-field-replication-sheet" data-testid="tasks-replication-sheet">
			<div class="tasks-field-replication-sheet-header">
				<HeadlineMd>{{ loc('TASKS_V2_REPLICATION_TITLE_SHEET') }}</HeadlineMd>
				<button
					type="button"
					class="tasks-field-replication-sheet-close"
					:aria-label="loc('TASKS_V2_REPLICATION_SHEET_CLOSE_ARIA_LABEL')"
					data-testid="tasks-replication-sheet-close-btn"
					@click="save"
				>
					<BIcon :name="Outline.CROSS_L" hoverable aria-hidden="true"/>
				</button>
			</div>
			<div class="tasks-field-replication-sheet-body">
				<div v-if="!isTemplate && !task.replicateParams" class="tasks-field-replication-sheet-description">
					<span class="tasks-field-replication-sheet-description-text">
						<RichLoc :text="loc('TASKS_V2_REPLICATION_SHEET_DESCRIPTION')" placeholder="[helpdesk]">
							<template #helpdesk="{ text }">
								<button
									type="button"
									class="tasks-field-replication-helpdesk"
									data-testid="tasks-replication-helpdesk-btn"
									@click="showHelpDesk"
								>{{ text }}</button>
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
			<ReplicationSheetFooter :replicateParams @cancel="handleCancel" @save="save"/>
		</div>
	`,
};
