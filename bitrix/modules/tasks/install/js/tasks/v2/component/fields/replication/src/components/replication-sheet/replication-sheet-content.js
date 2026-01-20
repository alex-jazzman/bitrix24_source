import { Type } from 'main.core';

import { computed } from 'ui.vue3';
import { HeadlineMd, TextMd } from 'ui.system.typography.vue';
import { RichLoc } from 'ui.vue3.components.rich-loc';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import type { TaskModel, TaskReplicateParams } from 'tasks.v2.model.tasks';
import { ReplicateCreator } from 'tasks.v2.provider.service.task-service';
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
		};
	},
	computed: {
		isDailyPeriod(): boolean
		{
			return this.replicateParams.period === ReplicationPeriod.Daily;
		},
	},
	created(): void
	{
		this.initReplicateParams();
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
		showHelpDesk(): void
		{
			top.BX.Helper.show('redirect=detail&code=18127718');
		},
		close(): void
		{
			this.$emit('close');
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
					@click="close"
				/>
			</div>
			<div class="tasks-field-replication-sheet-body">
				<div v-if="!isTemplate" class="tasks-field-replication-sheet-description">
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
				<ReplicationStartTime @update="updateReplicateParams"/>
				<ReplicationDeadline v-if="!isTemplate" @update="updateReplicateParams"/>
				<ReplicationWeekend v-if="isDailyPeriod" @update="updateReplicateParams"/>
			</div>
			<ReplicationSheetFooter :replicateParams @close="close"/>
		</div>
	`,
};
