import { SidePanel } from 'main.sidepanel';
import { mapGetters } from 'ui.vue3.vuex';
import { BMenu, MenuItemDesign, type MenuOptions } from 'ui.vue3.components.menu';
import { BIcon } from 'ui.icon-set.api.vue';
import { Outline } from 'ui.icon-set.api.core';
import 'ui.icon-set.outline';

import { Model } from 'tasks.v2.const';
import { Stage } from 'tasks.v2.component.fields.group';
import { flowService } from 'tasks.v2.provider.service.flow-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { FlowModel } from 'tasks.v2.model.flows';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { flowMeta } from './flow-meta';
import { flowDialog } from './flow-dialog';

// @vue/component
export const Flow = {
	name: 'TaskFlow',
	components: {
		BIcon,
		BMenu,
		Stage,
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
			flowMeta,
			Outline,
		};
	},
	data(): Object
	{
		return {
			isMenuShown: false,
		};
	},
	computed: {
		...mapGetters({
			currentUserId: `${Model.Interface}/currentUserId`,
		}),
		task(): TaskModel
		{
			return this.$store.getters[`${Model.Tasks}/getById`](this.taskId);
		},
		flow(): FlowModel
		{
			return this.$store.getters[`${Model.Flows}/getById`](this.task.flowId);
		},
		isEdit(): boolean
		{
			return Number.isInteger(this.taskId) && this.taskId > 0;
		},
		menuOptions(): MenuOptions
		{
			return {
				id: 'tasks-field-flow-menu',
				bindElement: this.$refs.container,
				offsetTop: 8,
				items: [
					{
						title: this.loc('TASKS_V2_FLOW_ABOUT'),
						icon: Outline.BOTTLENECK,
						onClick: this.openFlow,
					},
					{
						title: this.loc('TASKS_V2_FLOW_CHANGE'),
						icon: Outline.EDIT_L,
						onClick: this.showDialog,
					},
					{
						design: MenuItemDesign.Alert,
						title: this.loc('TASKS_V2_FLOW_DETACH'),
						icon: Outline.CROSS_L,
						onClick: this.clearField,
					},
				],
				targetContainer: document.body,
			};
		},
		readonly(): boolean
		{
			return !this.task.rights.edit;
		},
	},
	methods: {
		handleClick(): void
		{
			if (this.flow && this.readonly)
			{
				this.openFlow();

				return;
			}

			if (this.isEdit && this.flow)
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
		handleCrossClick(): void
		{
			this.clearField();
		},
		openFlow(): void
		{
			const href = flowService.getUrl(this.flow.id, this.currentUserId);

			SidePanel.Instance.open(href);
		},
		clearField(): void
		{
			void taskService.update(
				this.taskId,
				{
					flowId: 0,
					groupId: 0,
					stageId: 0,
				},
			);
		},
		showDialog(): void
		{
			flowDialog.setTaskId(this.taskId).showTo(this.$refs.container);
		},
	},
	template: `
		<div
			class="tasks-field-flow"
			:data-task-id="taskId"
			:data-task-field-id="flowMeta.id"
			:data-task-field-value="task.flowId"
		>
			<div class="tasks-field-flow-flow" ref="container" @click="handleClick">
				<BIcon class="tasks-field-flow-image" :name="Outline.BOTTLENECK" color="var(--ui-color-accent-main-primary)"/>
				<template v-if="flow">
					<div class="tasks-field-flow-title">
						{{ flow.name }}
					</div>
					<BIcon
						v-if="!isEdit"
						class="tasks-field-flow-cross"
						:name="Outline.CROSS_L"
						@click.capture.stop="handleCrossClick"
					/>
				</template>
				<template v-else>
					<div class="tasks-field-flow-add-text">{{ loc('TASKS_V2_FLOW_ADD') }}</div>
				</template>
			</div>
			<Stage v-if="isEdit && flow" :taskId="taskId"/>
		</div>
		<BMenu v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false"/>
	`,
};
