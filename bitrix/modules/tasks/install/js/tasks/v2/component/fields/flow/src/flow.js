import { SidePanel } from 'main.sidepanel';
import { BMenu, MenuItemDesign, type MenuOptions } from 'ui.system.menu.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { Model } from 'tasks.v2.const';
import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import { FieldAdd } from 'tasks.v2.component.elements.field-add';
import { flowService } from 'tasks.v2.provider.service.flow-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { FlowModel } from 'tasks.v2.model.flows';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { flowMeta } from './flow-meta';
import { flowDialog } from './flow-dialog';
import './flow.css';

// @vue/component
export const Flow = {
	name: 'TaskFlow',
	components: {
		BIcon,
		BMenu,
		HoverPill,
		FieldAdd,
	},
	inject: {
		task: {},
		taskId: {},
		isEdit: {},
	},
	setup(): { task: TaskModel }
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
		flow(): FlowModel
		{
			return this.$store.getters[`${Model.Flows}/getById`](this.task.flowId);
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
				this.isMenuShown = true;
			}
			else
			{
				this.showDialog();
			}
		},
		openFlow(): void
		{
			const href = flowService.getUrl(this.flow.id, Core.getParams().currentUser.id);

			SidePanel.Instance.open(href);
		},
		clearField(): void
		{
			void taskService.update(this.taskId, {
				flowId: 0,
				groupId: 0,
				stageId: 0,
			});
		},
		showDialog(): void
		{
			flowDialog.show({
				targetNode: this.$refs.container,
				taskId: this.taskId,
			});
		},
	},
	template: `
		<div
			:data-task-id="taskId"
			:data-task-field-id="flowMeta.id"
			:data-task-field-value="task.flowId"
			ref="container"
		>
			<HoverPill
				v-if="flow"
				:withClear="!readonly && !isEdit"
				:active="isMenuShown"
				@click="handleClick"
				@clear="clearField"
			>
				<div class="tasks-field-flow">
					<BIcon :name="Outline.BOTTLENECK"/>
					<div class="tasks-field-flow-title">{{ flow.name }}</div>
				</div>
			</HoverPill>
			<FieldAdd v-else :icon="Outline.BOTTLENECK" @click="handleClick"/>
		</div>
		<BMenu v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false"/>
	`,
};
