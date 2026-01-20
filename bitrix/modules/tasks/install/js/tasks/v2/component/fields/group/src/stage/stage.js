import { BMenu, type MenuOptions, type MenuItemOptions } from 'ui.system.menu.vue';
import { BLine } from 'ui.system.skeleton.vue';
import { Icon } from 'ui.icon-set.api.core';
import { BIcon, CRM, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.crm';
import 'ui.icon-set.outline';

import { Model } from 'tasks.v2.const';
import { Color } from 'tasks.v2.lib.color';
import { groupService } from 'tasks.v2.provider.service.group-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { ScrumManager } from 'tasks.v2.lib.scrum-manager';
import type { GroupModel } from 'tasks.v2.model.groups';
import type { StageModel } from 'tasks.v2.model.stages';
import type { TaskModel } from 'tasks.v2.model.tasks';

import './stage.css';

// @vue/component
export const Stage = {
	components: {
		BIcon,
		BMenu,
		BLine,
	},
	inject: {
		task: {},
		taskId: {},
		isEdit: {},
	},
	setup(): { task: TaskModel }
	{
		return {
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
		group(): GroupModel
		{
			return this.$store.getters[`${Model.Groups}/getById`](this.task.groupId);
		},
		groupId(): number
		{
			return this.task.groupId;
		},
		stageId(): number
		{
			return this.task.stageId;
		},
		stage(): StageModel
		{
			return this.$store.getters[`${Model.Stages}/getById`](this.stageId) ?? null;
		},
		menuOptions(): Function
		{
			return (): MenuOptions => ({
				id: 'tasks-field-group-stage-menu',
				bindElement: this.$refs.stage,
				offsetTop: 8,
				maxWidth: 500,
				items: this.menuItems,
				maxHeight: window.innerHeight / 2,
				targetContainer: document.body,
			});
		},
		menuItems(): MenuItemOptions[]
		{
			const stages = this.$store.getters[`${Model.Stages}/getByIds`](this.group.stagesIds ?? [])
				.sort(({ sort: a }, { sort: b }) => a - b)
			;

			return stages?.map((stage: StageModel): MenuItemOptions => ({
				title: stage.title,
				svg: this.getStageSvg(new Color(stage.color).limit(250).toRgb()),
				isSelected: stage.id === this.stage.id,
				onClick: () => this.setStage(stage.id),
			}));
		},
		backgroundColor(): string
		{
			return new Color(this.stage.color).setOpacity(0.1).limit(250).toRgb();
		},
		isDarkColor(): boolean
		{
			return new Color(this.stage.color).isDark();
		},
		readonly(): boolean
		{
			return !this.task.rights.sort;
		},
	},
	watch: {
		groupId(): void
		{
			void this.loadStagesForCreation();
		},
	},
	created(): void
	{
		void this.loadStagesForCreation();
	},
	methods: {
		getStageSvg(color: string): SVGElement
		{
			return new Icon({ icon: CRM.STAGE, color }).render();
		},
		async handleClick(): Promise<void>
		{
			if (this.readonly)
			{
				return;
			}

			if (!this.group.stagesIds)
			{
				await groupService.getStages(this.groupId);
			}

			this.isMenuShown = true;
		},
		async setStage(stageId: number): Promise<void>
		{
			const scrumManager = new ScrumManager({
				taskId: this.task.id,
				parentId: this.task.parentId,
				groupId: this.task.groupId,
			});

			let canMove = true;
			if (scrumManager.isScrum(this.group?.type))
			{
				const stage: StageModel = await this.$store.getters[`${Model.Stages}/getById`](stageId) ?? null;
				if (stage.systemType === 'FINISH')
				{
					canMove = await scrumManager.handleDodDisplay();
				}
			}

			if (!canMove)
			{
				return;
			}

			await taskService.setStage(this.taskId, stageId);

			if (scrumManager.isScrum(this.group?.type))
			{
				void scrumManager?.handleParentState();
			}
		},
		async loadStagesForCreation(): Promise<void>
		{
			if (this.isEdit || this.group.stagesIds)
			{
				return;
			}

			await groupService.getStages(this.groupId);
		},
	},
	template: `
		<div
			v-if="stage?.id"
			class="tasks-field-group-stage"
			:class="{ '--dark': isDarkColor, '--readonly': readonly }"
			:style="{
				'--stage-color': '#' + stage.color,
				'--stage-background': backgroundColor,
			}"
			:title="stage?.title"
			:data-task-id="taskId"
			:data-task-field-id="'stageId'"
			:data-task-field-value="stageId"
			:data-task-stage-title="stage?.title"
			ref="stage"
			@click="handleClick"
		>
			<div class="tasks-field-group-stage-text-container">
				<div class="tasks-field-group-stage-text">{{ stage.title }}</div>
			</div>
			<div class="tasks-field-group-stage-arrow"/>
			<BIcon v-if="!readonly" :name="Outline.CHEVRON_DOWN_S"/>
		</div>
		<div v-else class="tasks-field-group-stage-loader">
			<BLine :width="80" :height="10"/>
		</div>
		<BMenu v-if="isMenuShown" :options="menuOptions()" @close="isMenuShown = false"/>
	`,
};
