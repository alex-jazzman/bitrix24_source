import { hint, type HintParams } from 'ui.vue3.directives.hint';
import { TextMd } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.actions';

import { Core } from 'tasks.v2.core';
import { TaskField } from 'tasks.v2.const';
import { TaskList } from 'tasks.v2.component.task-list';
import { tooltip } from 'tasks.v2.component.elements.hint';
import { showLimit } from 'tasks.v2.lib.show-limit';
import { idUtils } from 'tasks.v2.lib.id-utils';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { RelationFieldMeta } from './types';
import './relation-tasks.css';

// @vue/component
export const RelationTasks = {
	name: 'TaskRelationTasks',
	components: {
		BIcon,
		TaskList,
		TextMd,
	},
	directives: { hint },
	inject: {
		task: {},
		taskId: {},
		isEdit: {},
		isTemplate: {},
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
	},
	emits: ['add'],
	setup(): { task: TaskModel, meta: RelationFieldMeta }
	{
		return {
			Outline,
		};
	},
	data(): Object
	{
		return {
			idsLoaded: false,
		};
	},
	computed: {
		ids(): number[]
		{
			return this.meta.service.getSortedIds(this.task[this.meta.idsField]);
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
	},
	watch: {
		ids(newIds: number[], oldIds: number[]): void
		{
			if ([...newIds || []].sort().join(',') === [...oldIds || []].sort().join(','))
			{
				return;
			}

			if (this.meta.service.hasUnloadedIds(this.taskId))
			{
				void this.meta.service.list(this.taskId);
			}
		},
	},
	async created(): Promise<void>
	{
		this.idsLoaded = this.meta.service.areIdsLoaded(this.taskId);

		if (!this.idsLoaded || this.meta.service.hasUnloadedIds(this.taskId))
		{
			await this.meta.service.list(this.taskId, true);
		}

		this.idsLoaded = true;
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
			const isTemplate = idUtils.isTemplate(this.taskId);

			const tasksGridType = {
				[this.meta.id === TaskField.SubTasks]: 'subTasks',
				[this.meta.id === TaskField.RelatedTasks]: 'relatedTasks',
				[this.meta.id === TaskField.RelatedTasks && isTemplate]: 'relatedTemplateTasks',
				[this.meta.id === TaskField.Gantt]: 'gantt',
			}.true;

			const templateGridType = {
				[this.meta.id === TaskField.SubTasks && isTemplate]: 'subTemplates',
			}.true;

			const gridPath = {
				[Boolean(tasksGridType)]: `/company/personal/user/${userId}/tasks/`,
				[Boolean(templateGridType)]: `/company/personal/user/${userId}/tasks/templates/`,
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
				<div 
					v-if="!readonly && idsLoaded && !isLocked" 
					v-hint="tooltip" 
					class="tasks-field-relation-tasks-icon --add" 
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
			<TaskList
				v-if="task[meta.containsField]"
				:ids
				:loadingIds
				:fields
				:canOpenMore
				@openMore="openMore"
				@removeTask="handleRemove"
			/>
		</div>
	`,
};
