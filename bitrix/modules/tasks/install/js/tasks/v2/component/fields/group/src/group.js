import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Model } from 'tasks.v2.const';
import { Hint } from 'tasks.v2.component.elements.hint';
import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import { FieldAdd } from 'tasks.v2.component.elements.field-add';
import { showLimit } from 'tasks.v2.lib.show-limit';
import { groupService } from 'tasks.v2.provider.service.group-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { GroupModel } from 'tasks.v2.model.groups';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { groupMeta } from './group-meta';
import { GroupPopup } from './group-popup/group-popup';
import { groupDialog } from './group-dialog';
import './group.css';

// @vue/component
export const Group = {
	components: {
		BIcon,
		Hint,
		HoverPill,
		FieldAdd,
		GroupPopup,
	},
	inject: {
		settings: {},
		task: {},
		taskId: {},
		isEdit: {},
	},
	setup(): { task: TaskModel }
	{
		return {
			groupMeta,
			Outline,
		};
	},
	data(): Object
	{
		return {
			isHintShown: false,
		};
	},
	computed: {
		group(): GroupModel
		{
			return this.$store.getters[`${Model.Groups}/getById`](this.task.groupId);
		},
		groupName(): string
		{
			return this.group?.name ?? this.loc('TASKS_V2_GROUP_HIDDEN');
		},
		groupImage(): string
		{
			return encodeURI(this.group?.image);
		},
		isSecret(): boolean
		{
			return Boolean(this.task.groupId) && !this.group;
		},
		hasFlow(): boolean
		{
			return this.task.flowId > 0;
		},
		readonly(): boolean
		{
			return !this.task.rights.edit || this.hasFlow;
		},
		isLocked(): boolean
		{
			return !this.settings.restrictions.project.available;
		},
		withClear(): boolean
		{
			return !this.readonly && (this.task.flowId ?? 0) <= 0;
		},
	},
	methods: {
		handleClick(): void
		{
			if (!this.isEdit && this.hasFlow)
			{
				this.isHintShown = true;

				return;
			}

			if (this.readonly)
			{
				if (!this.isSecret)
				{
					void this.openGroup();
				}

				return;
			}

			if (this.isLocked)
			{
				this.showLimitDialog();
			}
			else
			{
				this.showDialog();
			}
		},
		async openGroup(): Promise<void>
		{
			const href = await groupService.getUrl(this.group.id, this.group.type);

			BX.SidePanel.Instance.emulateAnchorClick(href);
		},
		showDialog(): void
		{
			groupDialog.show({
				targetNode: this.$refs.group,
				taskId: this.taskId,
			});
		},
		clear(): void
		{
			void taskService.update(this.taskId, {
				groupId: 0,
				stageId: 0,
			});
		},
		showLimitDialog(): void
		{
			void showLimit({
				featureId: this.settings.restrictions.project.featureId,
			});
		},
	},
	template: `
		<div
			:data-task-id="taskId"
			:data-task-field-id="groupMeta.id"
			:data-task-field-value="task.groupId"
			ref="group"
		>
			<div class="tasks-field-group-group" :class="{ '--secret': isSecret }" @click="handleClick">
				<HoverPill
					v-if="task.groupId"
					:withClear
					@clear="clear"
				>
					<img v-if="groupImage" class="tasks-field-group-image" :src="groupImage" :alt="groupName"/>
					<BIcon v-else class="tasks-field-group-icon" :name="Outline.FOLDER"/>
					<div class="tasks-field-group-title">{{ groupName }}</div>
				</HoverPill>
				<FieldAdd v-else :icon="Outline.FOLDER_PLUS"/>
			</div>
		</div>
		<Hint v-if="isHintShown" :bindElement="$refs.group" @close="isHintShown = false">
			{{ loc('TASKS_V2_GROUP_CANT_CHANGE_FLOW') }}
		</Hint>
		<GroupPopup :getBindElement="() => $refs.group"/>
	`,
};
