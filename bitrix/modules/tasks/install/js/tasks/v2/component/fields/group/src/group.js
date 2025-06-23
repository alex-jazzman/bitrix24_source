import { BMenu, MenuItemDesign, type MenuOptions } from 'ui.vue3.components.menu';
import { BIcon } from 'ui.icon-set.api.vue';
import { Outline } from 'ui.icon-set.api.core';
import 'ui.icon-set.outline';

import { GroupType, Model } from 'tasks.v2.const';
import { heightTransition } from 'tasks.v2.lib.height-transition';
import { openGroup } from 'tasks.v2.lib.open-group';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { Hint } from 'tasks.v2.component.elements.hint';
import type { GroupModel } from 'tasks.v2.model.groups';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { groupMeta } from './group-meta';
import { Stage } from './stage/stage';
import { Scrum } from './scrum/scrum';
import { GroupPopup } from './group-popup/group-popup';
import { groupDialog } from './group-dialog';
import './group.css';

// @vue/component
export const Group = {
	components: {
		BIcon,
		BMenu,
		Stage,
		Scrum,
		Hint,
		GroupPopup,
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
	},
	setup(): Object
	{
		return {
			groupMeta,
			Outline,
		};
	},
	data(): Object
	{
		return {
			isMenuShown: false,
			isHintShown: false,
		};
	},
	computed: {
		task(): TaskModel
		{
			return this.$store.getters[`${Model.Tasks}/getById`](this.taskId);
		},
		isEdit(): boolean
		{
			return Number.isInteger(this.taskId) && this.taskId > 0;
		},
		group(): GroupModel
		{
			return this.$store.getters[`${Model.Groups}/getById`](this.task.groupId);
		},
		isScrum(): boolean
		{
			return this.group?.type === GroupType.Scrum;
		},
		menuOptions(): MenuOptions
		{
			return {
				id: 'tasks-field-group-menu',
				bindElement: this.$refs.group,
				offsetTop: 8,
				items: [
					{
						title: this.getAboutItemTitle(),
						icon: Outline.FOLDER,
						onClick: this.openGroup,
					},
					{
						title: this.loc('TASKS_V2_GROUP_CHANGE'),
						icon: Outline.EDIT_L,
						onClick: this.showDialog,
					},
					{
						design: MenuItemDesign.Alert,
						title: this.loc('TASKS_V2_GROUP_CLEAR'),
						icon: Outline.CROSS_L,
						onClick: this.clearField,
					},
				],
				targetContainer: document.body,
			};
		},
		groupName(): string
		{
			return this.group?.name ?? this.loc('TASKS_V2_GROUP_HIDDEN');
		},
		groupImage(): string
		{
			return this.group?.image;
		},
		hintText(): string
		{
			return this.loc('TASKS_V2_GROUP_CANT_CHANGE_FLOW');
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
	},
	mounted(): void
	{
		heightTransition.animate(this.$refs.container);
	},
	updated(): void
	{
		heightTransition.animate(this.$refs.container);
	},
	methods: {
		getAboutItemTitle(): string
		{
			return {
				[GroupType.Collab]: this.loc('TASKS_V2_GROUP_ABOUT_COLLAB'),
				[GroupType.Scrum]: this.loc('TASKS_V2_GROUP_ABOUT_SCRUM'),
			}[this.group?.type] ?? this.loc('TASKS_V2_GROUP_ABOUT');
		},
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

			if (this.isEdit && this.group)
			{
				this.showMenu();
			}
			else
			{
				this.showDialog();
			}
		},
		showMenu(): void
		{
			this.isMenuShown = true;
		},
		openGroup(): void
		{
			void openGroup(this.group.id, this.group.type);
		},
		showDialog(): void
		{
			groupDialog.setTaskId(this.taskId).showTo(this.$refs.group);
		},
		handleCrossClick(event: MouseEvent): void
		{
			event.stopPropagation();

			this.clearField();
		},
		clearField(): void
		{
			void taskService.update(
				this.taskId,
				{
					groupId: 0,
					stageId: 0,
				},
			);
		},
	},
	template: `
		<div
			class="tasks-field-group"
			:data-task-id="taskId"
			:data-task-field-id="groupMeta.id"
			:data-task-field-value="task.groupId"
			ref="container"
		>
			<div class="tasks-field-group-group" :class="{ '--secret': isSecret }" ref="group" @click="handleClick">
				<template v-if="task.groupId">
					<img v-if="groupImage" class="tasks-field-group-image" :src="groupImage" :alt="groupName"/>
					<BIcon v-else class="tasks-field-group-add-icon" :name="Outline.FOLDER"/>
					<div class="tasks-field-group-title">{{ groupName }}</div>
					<BIcon
						v-if="!isEdit && (task.flowId ?? 0) <= 0"
						class="tasks-field-group-cross"
						:name="Outline.CROSS_L"
						@click.capture="handleCrossClick"
					/>
				</template>
				<template v-else>
					<BIcon class="tasks-field-group-add-icon" :name="Outline.FOLDER_PLUS"/>
					<div class="tasks-field-group-add-text">{{ loc('TASKS_V2_GROUP_ADD') }}</div>
				</template>
			</div>
			<Stage v-if="isEdit && group && !task.flowId" :taskId="taskId"/>
			<Scrum v-if="isScrum && !task.flowId" :taskId="taskId"/>
		</div>
		<Hint
			v-if="isHintShown"
			:bindElement="$refs.container"
			@close="isHintShown = false"
		>
			{{ hintText }}
		</Hint>
		<BMenu v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false"/>
		<GroupPopup :taskId="taskId" :getBindElement="() => $refs.group"/>
	`,
};
