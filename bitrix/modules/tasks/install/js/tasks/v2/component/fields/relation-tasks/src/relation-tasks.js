import { mapGetters } from 'ui.vue3.vuex';
import { hint, type HintParams } from 'ui.vue3.directives.hint';
import { TextMd } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { BMenu, type MenuItemOptions, type MenuOptions } from 'ui.system.menu.vue';
import 'ui.icon-set.actions';

import { Core } from 'tasks.v2.core';
import { Model, TaskField } from 'tasks.v2.const';
import { TaskList } from 'tasks.v2.component.task-list';
import { tooltip } from 'tasks.v2.component.elements.hint';
import { showLimit } from 'tasks.v2.lib.show-limit';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { type TaskListOptions } from 'tasks.v2.model.interface';
import { type TaskModel } from 'tasks.v2.model.tasks';

import { RelationFieldMeta } from './types';

import './relation-tasks.css';

// @vue/component
export const RelationTasks = {
	name: 'TaskRelationTasks',
	components: {
		BIcon,
		TaskList,
		TextMd,
		BMenu,
	},
	directives: { hint },
	inject: {
		task: {},
		taskId: {},
		isEdit: {},
		isTemplate: {},
		settings: {},
	},
	props: {
		/** @type RelationFieldMeta */
		meta: {
			type: Object,
			required: true,
		},
		fields: {
			type: Set,
			default: undefined,
		},
		isLocked: {
			type: Boolean,
			default: false,
		},
		featureId: {
			type: String,
			default: '',
		},
		shouldShowSubTasksOption: {
			type: Boolean,
			default: true,
		},
		shouldShowCompletedOption: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['add'],
	setup(): { task: TaskModel, meta: RelationFieldMeta, taskListOptions: TaskListOptions }
	{
		return {
			Outline,
		};
	},
	data(): Object
	{
		return {
			idsLoaded: false,
			isMenuShown: false,
			showCompleted: true,
			showSubTasks: false,
		};
	},
	computed: {
		...mapGetters({
			taskListOptions: `${Model.Interface}/taskListOptions`,
		}),
		ids(): number[]
		{
			return this.meta.service.getSortedIds(
				this.taskId,
				this.task[this.meta.idsField],
				this.showCompleted,
				this.isTemplateEntities,
			);
		},
		loadingIds(): number[]
		{
			return this.ids.filter((id: number | string) => !this.meta.service.hasStoreTask(id));
		},
		text(): string
		{
			if (this.ids.length > 0)
			{
				return this.loc(this.meta.getCountLoc(this.isTemplate), {
					'#COUNT#': this.ids.length,
				});
			}

			return this.meta.getTitle(this.isTemplate);
		},
		canOpenMore(): boolean
		{
			return this.isEdit && (this.readonly || this.task[this.meta.containsField]);
		},
		readonly(): boolean
		{
			return !this.task.rights[this.meta.right];
		},
		tooltip(): Function
		{
			return (): HintParams => tooltip({
				text: this.meta.getHint(this.isTemplate),
				popupOptions: {
					offsetLeft: this.$refs.add.offsetWidth / 2,
				},
			});
		},
		tasksKey(): string
		{
			return this.ids.reduce((key, id) => {
				const task = taskService.getStoreTask(id) ?? {};

				return `${key},${task.id}-${String(task.activityTs)}`;
			}, '');
		},
		isTemplateEntities(): boolean
		{
			return this.meta.id === TaskField.SubTasks && this.isTemplate;
		},
		useOptions(): boolean
		{
			return this.shouldShowCompletedOption || this.shouldShowSubTasksOption;
		},
		menuItems(): MenuItemOptions[]
		{
			return [
				!this.isTemplateEntities && this.shouldShowCompletedOption && {
					id: 'showCompleted',
					title: this.loc('TASKS_V2_RELATION_TASKS_MENU_SHOW_COMPLETED'),
					isSelected: Boolean(this.taskListOptions[this.meta.showCompletedField]),
					onClick: this.handleShowCompletedOptionClick,
				},
				!this.isTemplateEntities && this.shouldShowSubTasksOption && {
					id: 'showSubTasks',
					title: this.loc('TASKS_V2_RELATION_TASKS_MENU_SHOW_WITH_SUBTASKS'),
					isSelected: Boolean(this.taskListOptions.showSubTasks),
					onClick: this.handleShowSubtasksOptionClick,
				},
				this.isTemplateEntities && this.shouldShowSubTasksOption && {
					id: 'showSubTemplates',
					title: this.loc('TASKS_V2_RELATION_TASKS_MENU_SHOW_WITH_SUBTEMPLATES'),
					isSelected: Boolean(this.taskListOptions.showSubTemplates),
					onClick: this.handleShowSubtemplatesOptionClick,
				},
			].filter(Boolean);
		},
		menuOptions(): MenuOptions
		{
			return {
				id: `tasks-relation-tasks-menu-${String(this.meta.id)}-${String(this.taskId)}`,
				bindElement: this.$refs.settings,
				items: this.menuItems,
				targetContainer: document.body,
				minWidth: 240,
				offsetLeft: -100,
				closeByEsc: true,
				autoHide: true,
			};
		},
	},
	watch: {
		tasksKey(): void
		{
			if (this.meta.service.hasUnloadedIds(this.taskId, this.isTemplateEntities))
			{
				void this.meta.service.list(this.taskId);
			}
		},
		taskListOptions(newValue: TaskListOptions, oldValue: TaskListOptions): void
		{
			const field = this.meta.showCompletedField;
			if (newValue[field] !== oldValue[field])
			{
				this.handleShowCompletedChange(newValue[field]);
			}

			if (newValue.showSubTasks !== oldValue.showSubTasks)
			{
				this.handleShowSubTasksChange(newValue.showSubTasks);
			}

			if (newValue.showSubTemplates !== oldValue.showSubTemplates)
			{
				this.handleShowSubTasksChange(newValue.showSubTemplates);
			}
		},
	},
	async created(): Promise<void>
	{
		this.idsLoaded = this.meta.service.areIdsLoaded(this.taskId);

		if (!this.idsLoaded || this.meta.service.hasUnloadedIds(this.taskId, this.isTemplateEntities))
		{
			await this.meta.service.list(this.taskId, true);
		}

		this.idsLoaded = true;

		if (this.shouldShowCompletedOption)
		{
			this.showCompleted = this.taskListOptions[this.meta.showCompletedField];
		}

		if (this.shouldShowSubTasksOption)
		{
			this.showSubTasks = this.isTemplate
				? this.taskListOptions.showSubTemplates
				: this.taskListOptions.showSubTasks
			;
		}
	},
	methods: {
		openMore(): void
		{
			if (!this.canOpenMore)
			{
				return;
			}

			if (this.isLocked)
			{
				this.showLimit();

				return;
			}

			const userId = Core.getParams().currentUser.id;

			const tasksGridType = {
				[this.meta.id === TaskField.SubTasks]: 'subTasks',
				[this.meta.id === TaskField.RelatedTasks]: 'relatedTasks',
				[this.meta.id === TaskField.RelatedTasks && this.isTemplate]: 'relatedTemplateTasks',
				[this.meta.id === TaskField.Gantt]: 'gantt',
			}.true;

			const templateGridType = {
				[this.meta.id === TaskField.SubTasks && this.isTemplate]: 'subTemplates',
			}.true;

			const gridPath = {
				[Boolean(tasksGridType)]: this.settings.paths.userListTaskPathTemplate.replace('#user_id#', userId),
				[Boolean(templateGridType)]: this.settings.paths.userTemplateListPathTemplate.replace('#user_id#', userId),
			}.true;

			const relationType = tasksGridType ?? templateGridType;
			const relationToId = idUtils.unbox(this.taskId);
			const urlParams = new URLSearchParams({ relationToId, relationType });

			BX.SidePanel.Instance.open(`${gridPath}?${urlParams}`, {
				newWindowLabel: false,
				copyLinkLabel: false,
			});
		},
		showLimit(): void
		{
			void showLimit({ featureId: this.featureId });
		},
		async handleRemove(id: number): void
		{
			await this.meta.service.delete(this.taskId, [id]);
		},
		handleShowCompletedOptionClick(): void
		{
			this.meta.service.saveTaskListOptions({
				...this.taskListOptions,
				[this.meta.showCompletedField]: !this.taskListOptions[this.meta.showCompletedField],
			});
		},
		handleShowSubtasksOptionClick(): void
		{
			this.meta.service.saveTaskListOptions({
				...this.taskListOptions,
				showSubTasks: !this.taskListOptions.showSubTasks,
			});
		},
		handleShowSubtemplatesOptionClick(): void
		{
			this.meta.service.saveTaskListOptions({
				...this.taskListOptions,
				showSubTemplates: !this.taskListOptions.showSubTemplates,
			});
		},
		handleShowCompletedChange(newValue: boolean): void
		{
			if (!this.shouldShowCompletedOption || this.isTemplateEntities)
			{
				return;
			}

			this.showCompleted = newValue;

			if (newValue && this.meta.service.hasUnloadedIds(this.taskId, this.isTemplateEntities))
			{
				void this.meta.service.list(this.taskId);
			}
		},
		handleShowSubTasksChange(newValue: boolean): void
		{
			if (!newValue || this.showSubTasks || !this.shouldShowSubTasksOption)
			{
				return;
			}

			this.showSubTasks = newValue;

			void this.meta.service.getSubTaskIds(this.taskId, this.ids);
		},
	},
	template: `
		<div
			class="tasks-field-relation-tasks"
			:data-task-id="taskId"
			:data-task-field-id="meta.id"
		>
			<div class="tasks-field-relation-tasks-title">
				<div
					class="tasks-field-relation-tasks-main"
					:class="{ '--readonly': !canOpenMore }"
					data-task-relation-open
					@click="openMore"
				>
					<BIcon :name="meta.icon"/>
					<TextMd accent>{{ text }}</TextMd>
				</div>
				<div class="tasks-field-results-title-actions">
					<div
						v-if="useOptions && idsLoaded"
						class="tasks-field-relation-tasks-icon print-ignore"
						ref="settings"
					>
						<BIcon 
							:name="Outline.MORE_L"
							hoverable
							:data-task-relation-settings="meta.id"
							@click="isMenuShown = true"
						/>
					</div>
					<div
						v-if="!readonly && idsLoaded && !isLocked"
						v-hint="tooltip"
						class="tasks-field-relation-tasks-icon print-ignore"
						ref="add"
					>
						<BIcon
							:name="Outline.PLUS_L"
							hoverable
							:data-task-relation-add="meta.id"
							@click="$emit('add', $refs.add)"
						/>
					</div>
					<div
						v-else-if="isLocked"
						class="tasks-field-relation-tasks-icon --lock"
					>
						<BIcon
							:name="Outline.LOCK_L"
							hoverable
							:data-task-relation-locked="meta.id"
							@click="showLimit"
						/>
					</div>
				</div>
			</div>
			<BMenu v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false"/>
			<TaskList
				v-if="task[meta.containsField]"
				:ids
				:loadingIds
				:fields
				:canOpenMore
				:shouldShowSubTasksOption
				:idsLoaded
				:isTemplateEntities
				@openMore="openMore"
				@removeTask="handleRemove"
			/>
		</div>
	`,
};
