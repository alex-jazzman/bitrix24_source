import { EventEmitter } from 'main.core.events';

import { TextXs } from 'ui.system.typography.vue';
import { BLine } from 'ui.system.skeleton.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Endpoint, EventName } from 'tasks.v2.const';
import { apiClient } from 'tasks.v2.lib.api-client';
import { idUtils } from 'tasks.v2.lib.id-utils';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { replicationMeta } from './replication-meta';
import { ReplicationContent } from './components/replication/replication-content';
import { ReplicationSheet } from './replication-sheet';
import { ReplicationHistorySheets } from './replication-history-sheet';
import './replication.css';

// @vue/component
export const Replication = {
	name: 'TaskReplication',
	components: {
		BLine,
		BIcon,
		TextXs,
		ReplicationContent,
		ReplicationSheet,
		ReplicationHistorySheets,
	},
	inject: {
		task: {},
		taskId: {},
		isEdit: {},
		isTemplate: {},
	},
	props: {
		isSheetShown: {
			type: Boolean,
			required: true,
		},
		isHistorySheetShown: {
			type: Boolean,
			required: true,
		},
		sheetBindProps: {
			type: Object,
			required: true,
		},
	},
	emits: ['update:isSheetShown', 'update:isHistorySheetShown'],
	setup(): { task: TaskModel }
	{
		return {
			Outline,
			replicationMeta,
		};
	},
	data(): Object
	{
		return {
			logCount: null,
			isLoading: true,
		};
	},
	computed: {
		historyTitle(): string
		{
			return this.loc('TASKS_V2_REPLICATION_HISTORY', {
				'#COUNT#': this.logCount,
			});
		},
		readonly(): boolean
		{
			return !this.isTemplate || !this.task.rights.edit;
		},
		disabled(): boolean
		{
			return this.isTemplate && (this.task.isForNewUser || idUtils.isTemplate(this.task.parentId));
		},
	},
	created(): void
	{
		void this.getLogCount();
		EventEmitter.subscribe(EventName.UpdateReplicateParams, this.getLogCount);
	},
	unmounted(): void
	{
		EventEmitter.unsubscribe(EventName.UpdateReplicateParams, this.getLogCount);
	},
	methods: {
		async getLogCount(): Promise<void>
		{
			if (!this.isEdit || !this.isTemplate)
			{
				return;
			}

			this.isLoading = true;

			const templateId = idUtils.unbox(this.taskId);

			const { count } = await apiClient.post(Endpoint.TemplateHistoryGetCount, { templateId });

			this.logCount = count ?? 0;

			this.isLoading = false;
		},
		handleClick(): void
		{
			if (!this.readonly && !this.disabled)
			{
				this.setSheetShown(true);
			}
		},
		setSheetShown(isShown: boolean): void
		{
			this.$emit('update:isSheetShown', isShown);
		},
		setHistorySheetShown(isShown: boolean): void
		{
			this.$emit('update:isHistorySheetShown', isShown);
		},
	},
	template: `
		<div
			class="tasks-full-card-field-container tasks-field-replication"
			:data-task-id="task.id"
			:data-task-field-id="replicationMeta.id"
			data-field-container
			@click="handleClick"
		>
			<ReplicationContent/>
		</div>
		<template v-if="isEdit && isTemplate && task.replicate">
			<div v-if="isLoading" class="tasks-field-replication-history">
				<BLine :width="120"/>
			</div>
			<div
				v-else-if="logCount > 0"
				class="tasks-field-replication-history"
				@click="setHistorySheetShown(true)"
			>
				<TextXs className="tasks-field-replication-history-title">{{ historyTitle }}</TextXs>
				<BIcon :name="Outline.CHEVRON_RIGHT_M" color="var(--ui-color-base-4)"/>
			</div>
		</template>
		<ReplicationSheet v-if="isSheetShown" :sheetBindProps @close="setSheetShown(false)"/>
		<ReplicationHistorySheets v-if="isHistorySheetShown" :sheetBindProps @close="setHistorySheetShown(false)"/>
	`,
};
