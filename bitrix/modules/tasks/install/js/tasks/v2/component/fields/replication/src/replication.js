import { Type } from 'main.core';
import { EventEmitter, BaseEvent } from 'main.core.events';

import { TextXs } from 'ui.system.typography.vue';
import { BLine } from 'ui.system.skeleton.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Endpoint, EventName } from 'tasks.v2.const';
import { apiClient } from 'tasks.v2.lib.api-client';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { FieldList } from 'tasks.v2.component.elements.field-list';
import { FieldHoverButton } from 'tasks.v2.component.elements.field-hover-button';
import type { AppField } from 'tasks.v2.application.task-card';
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
		FieldList,
		FieldHoverButton,
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
			isHovered: false,
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
			return !this.task.rights.edit;
		},
		replicateParams(): ?Object
		{
			return this.task.replicateParams;
		},
		replicateTemplateId(): ?number
		{
			return this.task?.replicateTemplate?.id;
		},
		linkedTemplateId(): ?number
		{
			return this.task?.replicateTemplate?.id ?? this.task?.forkedByTemplate?.id;
		},
		linkedTemplate(): ?TaskModel
		{
			return this.task.forkedByTemplate ?? this.task.replicateTemplate
		},
		disabled(): boolean
		{
			return this.isTemplate && (this.task.isForNewUser || idUtils.isTemplate(this.task.parentId));
		},
		canOpenSheet(): boolean
		{
			return !this.isEdit || this.isTemplate || this.linkedTemplate?.rights?.edit;
		},
		fields(): AppField[]
		{
			return [{
				title: replicationMeta.title,
				component: ReplicationContent,
			}];
		},
	},
	created(): void
	{
		void this.getLogCount();
		EventEmitter.subscribe(EventName.UpdateReplicateParams, this.getLogCount);

		if (!this.isTemplate && this.linkedTemplateId)
		{
			EventEmitter.subscribe(EventName.UpdateReplicateParams, this.handleUpdateReplicateParams);
		}
	},
	unmounted(): void
	{
		EventEmitter.unsubscribe(EventName.UpdateReplicateParams, this.getLogCount);

		if (!this.isTemplate && this.linkedTemplateId)
		{
			EventEmitter.unsubscribe(EventName.UpdateReplicateParams, this.handleUpdateReplicateParams);
		}
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
		handleUpdateReplicateParams(event: BaseEvent): void
		{
			const { templateId, replicate, replicateParams } = event.getData();

			if (templateId !== this.linkedTemplateId)
			{
				return;
			}

			void taskService.updateStoreTask(this.taskId, {
				...(!Type.isUndefined(replicate) && { replicate }),
				...(!Type.isUndefined(replicateParams) && { replicateParams }),
			});
		},
		handleClick(): void
		{
			if (!this.readonly && !this.disabled && this.canOpenSheet)
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
			class="tasks-field-replication"
			@mouseenter="isHovered = true"
			@mouseleave="isHovered = false"
		>
			<div
				class="tasks-field-replication-content-wrapper"
				:class="{ '--readonly': readonly || disabled || !canOpenSheet }"
				:data-task-id="task.id"
				:data-task-field-id="replicationMeta.id"
				@click="handleClick"
			>
				<FieldHoverButton
					v-if="!readonly && !disabled && isEdit && replicateParams && canOpenSheet"
					:icon="Outline.EDIT_L"
					:isVisible="isHovered"
					@click="handleClick"
				/>
				<FieldList :fields/>
			</div>
			<template v-if="isEdit && isTemplate && task.replicateParams">
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
		</div>
		<ReplicationSheet v-if="isSheetShown" :sheetBindProps @close="setSheetShown(false)"/>
		<ReplicationHistorySheets v-if="isHistorySheetShown" :sheetBindProps @close="setHistorySheetShown(false)"/>
	`,
};
