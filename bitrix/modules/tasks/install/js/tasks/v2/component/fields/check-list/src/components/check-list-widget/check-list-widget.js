import { Model } from 'tasks.v2.const';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { CheckListModel } from 'tasks.v2.model.check-list';

import { CheckListManager } from '../../lib/check-list-manager';

import { CheckListParentItem } from './component/check-list-parent-item';
import { CheckListChildItem } from './component/check-list-child-item';
import { CheckListAddItem } from './component/check-list-add-item';

import './check-list-widget.css';

// @vue/component
export const CheckListWidget = {
	name: 'CheckListWidget',
	components: {
		CheckListParentItem,
		CheckListChildItem,
		CheckListAddItem,
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		checkListId: {
			type: [Number, String],
			default: 0,
		},
		parentId: {
			type: [Number, String],
			default: 0,
		},
		isPreview: {
			type: Boolean,
			default: false,
		},
	},
	emits: [
		'beforeCreated',
		'show',
		'update',
		'addItem',
		'addItemFromBtn',
		'removeItem',
		'toggleIsComplete',
		'focus',
		'blur',
		'emptyBlur',
		'toggleCompleted',
		'startGroupMode',
		'toggleGroupModeSelected',
		'openCheckList',
	],
	data(): Object
	{
		return {};
	},
	computed: {
		task(): TaskModel
		{
			return this.$store.getters[`${Model.Tasks}/getById`](this.taskId);
		},
		checkLists(): CheckListModel[]
		{
			return this.$store.getters[`${Model.CheckList}/getByIds`](this.task.checklist);
		},
		parentCheckLists(): CheckListModel[]
		{
			return this.checkLists
				.filter((checkList: CheckListModel) => checkList.parentId === 0)
				.sort((a: CheckListModel, b: CheckListModel) => a.sortIndex - b.sortIndex);
		},
		siblings(): CheckListModel[]
		{
			return this.checkLists
				.filter((item: CheckListModel) => item.parentId === this.parentId)
				.sort((a: CheckListModel, b: CheckListModel) => a.sortIndex - b.sortIndex);
		},
	},
	created(): void
	{
		this.$emit('beforeCreated');

		this.checkListManager = new CheckListManager({
			computed: {
				checkLists: () => this.checkLists,
			},
		});
	},
	mounted(): void
	{
		if (this.checkListId)
		{
			this.scrollContainer = this.$root.$el?.querySelector(['[data-list]']);

			const targetParentItem = this.scrollContainer.querySelector([`[data-parent="${this.checkListId}"]`]);

			setTimeout(() => {
				this.scrollContainer.scrollTop = targetParentItem.offsetTop;
			}, 0);
		}

		this.$emit('show');
	},
	methods: {
		getItemOffset(item: CheckListModel): string
		{
			if (item.parentId === 0)
			{
				return '0';
			}

			const level = this.checkListManager.getItemLevel(item);
			if (level === 1)
			{
				return '0';
			}

			return `${(level - 1) * 12}px`;
		},
		isFirstVisibleItem(index): boolean
		{
			if (this.isPreview === true)
			{
				return false;
			}

			const siblings = this.siblings;

			const firstVisibleIndex = siblings.findIndex((item) => !item.hidden);

			return firstVisibleIndex !== -1 && firstVisibleIndex === index;
		},
		getChildren(parent: CheckListModel): CheckListModel[]
		{
			if (this.isCollapsed(parent))
			{
				return [];
			}

			return this.checkListManager.getAllChildren(parent.id);
		},
		isCollapsed(item: CheckListModel): boolean
		{
			return (
				item.collapsed === true
				|| (this.isPreview && item.previewCollapsed === true)
			);
		},
	},
	template: `
		<div class="check-list-widget-container">
			<ul class="check-list-widget --parent" :class="{'--preview': isPreview}">
				<template v-for="(parentItem, parentItemIndex) in parentCheckLists" :key="parentItem.id">
					<li
						class="check-list-widget-item --parent"
						:class="{
							'--first-visible': parentId === 0 && isFirstVisibleItem(parentItemIndex),
							'--hidden': parentItem.hidden,
							'--collapsed': isCollapsed(parentItem),
							'--preview': isPreview,
						}"
					>
						<CheckListParentItem
							:id="parentItem.id"
							:taskId="taskId"
							:isPreview="isPreview"
							@update="$emit('update')"
							@removeItem="(id) => $emit('removeItem', id)"
							@focus="(id) => $emit('focus', id)"
							@blur="(id) => $emit('blur', id)"
							@emptyBlur="(id) => $emit('emptyBlur', id)"
							@toggleCompleted="(data) => $emit('toggleCompleted', data)"
							@startGroupMode="(id) => $emit('startGroupMode', id)"
							@openCheckList="(id) => $emit('openCheckList', id)"
						/>
						<TransitionGroup name="list" tag="ul" class="check-list-widget">
							<template
								v-for="childItem in getChildren(parentItem)"
								:key="childItem.id
							">
								<li
									class="check-list-widget-item"
									:class="{
										'--hidden': childItem.hidden,
									}"
								>
									<CheckListChildItem
										:id="childItem.id"
										:taskId="taskId"
										:itemOffset="getItemOffset(childItem)"
										:isPreview="isPreview"
										@update="$emit('update')"
										@toggleIsComplete="(id) => $emit('toggleIsComplete', id)"
										@addItem="(data) => $emit('addItem', data)"
										@removeItem="(id) => $emit('removeItem', id)"
										@focus="(id) => $emit('focus', id)"
										@blur="(id) => $emit('blur', id)"
										@emptyBlur="(id) => $emit('emptyBlur', id)"
										@toggleGroupModeSelected="(id) => $emit('toggleGroupModeSelected', id)"
									/>
								</li>
							</template>
						</TransitionGroup>
						<Transition name="addBtn" tag="div" class="check-list-widget-add-container">
							<CheckListAddItem
								v-if="!isCollapsed(parentItem)"
								:isPreview="isPreview"
								@addItem="$emit('addItemFromBtn', parentItem.id)"
							/>
						</Transition>
					</li>
				</template>
			</ul>
		</div>
	`,
};
