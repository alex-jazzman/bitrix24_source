import { Loc, Runtime } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { BMenu, type MenuOptions, type MenuItemOptions } from 'ui.system.menu.vue';
import { BLine } from 'ui.system.skeleton.vue';
import { Icon } from 'ui.icon-set.api.core';
import { BIcon, CRM, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.crm';
import 'ui.icon-set.outline';

import { EventName, Model } from 'tasks.v2.const';
import { Color } from 'tasks.v2.lib.color';
import { groupService } from 'tasks.v2.provider.service.group-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { ScrumManager } from 'tasks.v2.lib.scrum-manager';
import type { GroupModel } from 'tasks.v2.model.groups';
import type { StageModel } from 'tasks.v2.model.stages';
import type { TaskModel } from 'tasks.v2.model.tasks';

import './stage.css';

const STAGE_SYNC_RESTORED_EVENT = EventName.TaskStageSyncRestored ?? 'tasks:card:taskStageSyncRestored';

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
			isStageLoading: false,
			stageSyncFailed: false,
		};
	},
	computed: {
		group(): GroupModel
		{
			return this.$store.getters[`${Model.Groups}/getById`](this.task.groupId);
		},
		groupId(): number
		{
			return this.task?.groupId ?? 0;
		},
		stageId(): number
		{
			return this.task?.stageId ?? 0;
		},
		stage(): StageModel
		{
			return this.$store.getters[`${Model.Stages}/getById`](this.stageId);
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
			return !this.task.rights.sort || this.stageSyncFailed;
		},
	},
	watch: {
		task(): void
		{
			void this.ensureStage();
		},
		groupId(): void
		{
			void this.ensureStage();
		},
	},
	created(): void
	{
		EventEmitter.subscribe(EventName.TaskStageSyncFailed ?? 'tasks:card:taskStageSyncFailed', this.handleStageSyncFailed);
		EventEmitter.subscribe(STAGE_SYNC_RESTORED_EVENT, this.handleStageSyncRestored);
		if (taskService.isStageSyncUncertain?.(this.taskId))
		{
			this.notifyStageSyncFailed();
		}

		void this.ensureStage();
	},
	beforeUnmount(): void
	{
		EventEmitter.unsubscribe(EventName.TaskStageSyncFailed ?? 'tasks:card:taskStageSyncFailed', this.handleStageSyncFailed);
		EventEmitter.unsubscribe(STAGE_SYNC_RESTORED_EVENT, this.handleStageSyncRestored);
	},
	methods: {
		handleStageSyncFailed(event): void
		{
			if (event.getData().taskId === this.taskId)
			{
				this.notifyStageSyncFailed();
			}
		},
		handleStageSyncRestored(event): void
		{
			if (
				event.getData().taskId === this.taskId
				&& taskService.isStageSyncUncertain?.(this.taskId) === false
			)
			{
				this.stageSyncFailed = false;
			}
		},
		notifyStageSyncFailed(): void
		{
			if (this.stageSyncFailed)
			{
				return;
			}

			this.stageSyncFailed = true;
			BX.UI.Notification.Center.notify({ content: Loc.getMessage('TASKS_V2_GROUP_STAGE_SYNC_ERROR') });
		},
		notifyStageMoveFailed(error: ?Error): void
		{
			if (!error || error.code === 'STAGE_MOVE_STALE')
			{
				return;
			}
			if (error.code === 'STAGE_SYNC_UNCERTAIN')
			{
				this.notifyStageSyncFailed();

				return;
			}

			BX.UI.Notification.Center.notify({
				content: error.code === 'ACCESS_DENIED' && error.message
					? error.message
					: Loc.getMessage('TASKS_V2_GROUP_STAGE_MOVE_ERROR'),
			});
		},
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

			if (!this.group.stagesIds || this.group.stagesIds.length === 0)
			{
				await groupService.getStages(this.groupId);
			}

			this.isMenuShown = true;
		},
		handleMenuClose(): void
		{
			this.isMenuShown = false;
			this.$refs.stage?.focus();
		},
		async setStage(stageId: number): Promise<?Error>
		{
			const scrumManager = new ScrumManager({
				taskId: this.task.id,
				parentId: this.task.parentId,
				groupId: this.task.groupId,
			});

			const isScrum = scrumManager.isScrum(this.group?.type);
			let isFinishStage = false;
			if (isScrum)
			{
				const stage: ?StageModel = await this.$store.getters[`${Model.Stages}/getById`](stageId) ?? null;
				isFinishStage = stage?.systemType === 'FINISH';
			}

			if (isFinishStage)
			{
				try
				{
					const { checkListCompletionService, isCompletionSuccessful } = await Runtime.loadExtension(
						'tasks.v2.lib.check-list-completion',
					);
					// V2 always delegates checklist completion to the server, even for an empty client snapshot
					const moveToFinishStage = () => taskService.setStage(
						this.taskId,
						stageId,
						{ completeWithChecklist: true },
					);
					const completionResult = await checkListCompletionService.run({
						taskId: this.taskId,
						complete: moveToFinishStage,
						completeWithChecklist: moveToFinishStage,
						beforeComplete: () => scrumManager.handleDodDisplay(),
					});

					if (!isCompletionSuccessful(completionResult))
					{
						this.notifyStageMoveFailed(completionResult.error);

						return completionResult.error;
					}
				}
				catch (error)
				{
					console.error('Stage: setStage error', error);

					return error;
				}
			}
			else
			{
				const error = await taskService.setStage(this.taskId, stageId);
				if (error)
				{
					this.notifyStageMoveFailed(error);

					return error;
				}
			}

			if (isScrum)
			{
				void scrumManager?.handleParentState();
			}

			return null;
		},
		async ensureStage(): Promise<void>
		{
			if (!this.groupId || this.stage?.id || this.isStageLoading)
			{
				return;
			}

			const groupId = this.groupId;
			if (!this.group?.stagesIds || this.group.stagesIds.length === 0)
			{
				this.isStageLoading = true;
				try
				{
					await groupService.getStages(groupId);
				}
				finally
				{
					this.isStageLoading = false;
				}
			}

			if (!this.task)
			{
				return;
			}

			if (this.groupId !== groupId)
			{
				void this.ensureStage();

				return;
			}

			this.applyDefaultStage();
		},
		applyDefaultStage(): void
		{
			// A freshly created project has no assigned stage yet, so the server returns
			// no stage on update; pick the system start stage (NEW), falling back to the
			// first kanban stage by sort.
			if (this.stage?.id)
			{
				return;
			}

			const stages = this.$store.getters[`${Model.Stages}/getByIds`](this.group?.stagesIds ?? []);
			const defaultStage = stages.find((stage: StageModel) => stage.systemType === 'NEW')
				?? [...stages].sort(({ sort: a }, { sort: b }) => a - b)[0];

			if (defaultStage?.id)
			{
				taskService.updateStoreTask(this.taskId, { stageId: defaultStage.id });
			}
		},
	},
	template: `
		<component
			:is="readonly ? 'div' : 'button'"
			v-if="stage?.id"
			:type="readonly ? null : 'button'"
			class="tasks-field-group-stage"
			:class="{ '--dark': isDarkColor, '--readonly': readonly }"
			:style="{
				'--stage-color': '#' + stage.color,
				'--stage-background': backgroundColor,
			}"
			:title="stage?.title"
			:aria-label="readonly ? null : loc('TASKS_V2_GROUP_STAGE_ARIA_LABEL')"
			:aria-haspopup="readonly ? null : 'menu'"
			:aria-expanded="readonly ? null : isMenuShown"
			:data-task-id="taskId"
			:data-task-field-id="'stageId'"
			:data-task-field-value="stageId"
			:data-task-stage-title="stage?.title"
			ref="stage"
			@click="handleClick"
		>
			<div class="tasks-field-group-stage-text-container print-background-white print-font-weight-normal print-no-padding-left print-font-size-lg">
				<div class="tasks-field-group-stage-text print-font-color-base-1">{{ stage.title }}</div>
			</div>
			<div class="tasks-field-group-stage-arrow print-ignore"/>
			<BIcon v-if="!readonly" :name="Outline.CHEVRON_DOWN_S" class="print-ignore" aria-hidden="true"/>
		</component>
		<div v-else-if="isStageLoading" class="tasks-field-group-stage-loader">
			<BLine :width="80" :height="10"/>
		</div>
		<BMenu v-if="isMenuShown" :options="menuOptions()" @close="handleMenuClose"/>
	`,
};
