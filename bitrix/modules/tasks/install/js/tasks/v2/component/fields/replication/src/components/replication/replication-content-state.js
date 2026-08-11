import { TextMd, TextSm } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { Model, TaskField } from 'tasks.v2.const';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import { FieldHoverButton } from 'tasks.v2.component.elements.field-hover-button';
import { replicationService } from 'tasks.v2.provider.service.replication-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { TaskCard } from 'tasks.v2.application.task-card';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { ReplicateRuleGenerator } from '../../lib';

// @vue/component
export const ReplicationContentState = {
	name: 'ReplicationContentState',
	components: {
		HoverPill,
		FieldHoverButton,
		TextMd,
		TextSm,
		BIcon,
	},
	inject: {
		task: {},
		taskId: {},
		isTemplate: {},
		isEdit: {},
	},
	setup(): { task: TaskModel }
	{
		return {
			Outline,
		};
	},
	computed: {
		readonly(): boolean
		{
			return !this.task?.rights?.edit;
		},
		ruleFormatted(): string
		{
			return new ReplicateRuleGenerator(this.task.replicateParams).generate();
		},
		isReplicate(): boolean
		{
			return this.task.replicate;
		},
		isCreator(): boolean
		{
			return Core.getParams().currentUser.id === this.task.creatorId;
		},
		templateId(): ?number
		{
			return this.task.forkedByTemplate?.id ?? this.task.replicateTemplate?.id;
		},
		hasLinkedTemplate(): boolean
		{
			return !this.isTemplate && this.templateId;
		},
		linkedTemplate(): ?TaskModel
		{
			return this.task.forkedByTemplate ?? this.task.replicateTemplate
		},
		canEditLinkedTemplate(): boolean
		{
			return this.linkedTemplate && this.linkedTemplate?.rights?.edit
		},
		canToggle(): boolean
		{
			return !this.readonly && ((this.templateId && this.canEditLinkedTemplate) || this.isTemplate);
		},
		toggleText(): string
		{
			return this.isReplicate
				? this.loc('TASKS_V2_REPLICATION_PAUSE_REPLICATE')
				: this.loc('TASKS_V2_REPLICATION_RESUME_REPLICATE');
		},
	},
	methods: {
		clearReplication(): void
		{
			void taskService.update(this.taskId, {
				replicate: false,
				replicateParams: null,
			});

			void this.$store.dispatch(`${Model.Tasks}/setFieldFilled`, {
				id: this.taskId,
				fieldName: TaskField.Replication,
				isFilled: false,
			});
		},
		toggleReplication(): void
		{
			void replicationService.setReplicationState(this.taskId, { ...this.task, replicate: !this.isReplicate });
		},
		openTemplate(): void
		{
			TaskCard.showFullCard({ taskId: idUtils.boxTemplate(this.templateId) });
		},
	},
	template: `
		<HoverPill
			class="tasks-replication-content-text-wrapper"
			:readonly="readonly || (isEdit && !canEditLinkedTemplate)"
			:withClear="!isEdit"
			:style="{ background: isEdit ? 'none' : '' }"
			noOffset
			@clear="clearReplication"
		>
			<TextMd 
				className="tasks-replication-content-text"
				:class="{'task-replication-content-text-pause': task.replicateParams && !isReplicate}"
			>
				{{ ruleFormatted }}
			</TextMd>
		</HoverPill>
		<div v-if="isEdit && task.replicateParams" class="task-replication-content-control">
			<div
				v-if="canToggle"
				class="tasks-replication-content-element"
				@click.stop="toggleReplication"
			>
				<BIcon
					:name="isReplicate ? Outline.PAUSE_L : Outline.PLAY_L"
					:size="20"
					color="var(--ui-color-base-4)"
					hoverable
				/>
				<TextSm className="tasks-replication-content-element-text">
					{{ toggleText }}
				</TextSm>
			</div>
			<div
				v-else-if="!isReplicate"
				class="tasks-replication-content-element"
				style="pointer-events: none"
			>
				<BIcon
					:name="Outline.PAUSE_L"
					:size="20"
					color="var(--ui-color-base-4)"
				/>
				<TextSm className="tasks-replication-content-element-text">
					{{ loc('TASKS_V2_REPLICATION_ON_PAUSE') }}
				</TextSm>
			</div>
			<div
				v-if="hasLinkedTemplate"
				class="tasks-replication-content-element"
				@click.stop="openTemplate"
			>
				<BIcon
					:name="Outline.GO_TO_L"
					:size="20"
					color="var(--ui-color-base-4)"
					hoverable
				/>
				<TextSm className="tasks-replication-content-element-text">
					{{ loc('TASKS_V2_REPLICATION_OPEN_TEMPLATE') }}
				</TextSm>
			</div>
		</div>
	`,
};
