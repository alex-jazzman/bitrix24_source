import { Model } from 'tasks.v2.const';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { CheckListModel } from 'tasks.v2.model.check-list';

import { CheckListWidgetMixin } from './check-list-widget-mixin';
import { CheckListParentItem } from './check-list-parent-item';
import { CheckListChildItem } from './check-list-child-item';
import { CheckListAddItem } from './check-list-add-item';
import './check-list-widget.css';

// @vue/component
export const CheckListWidget = {
	name: 'CheckListWidget',
	components: {
		CheckListParentItem,
		CheckListChildItem,
		CheckListAddItem,
	},
	mixins: [CheckListWidgetMixin],
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
		listShownItemPanels: {
			type: Array,
			default: () => [],
		},
	},
	emits: [
		'show',
		'update',
		'addItem',
		'removeItem',
		'toggleIsComplete',
		'focus',
		'blur',
		'emptyBlur',
		'toggleCompleted',
		'startGroupMode',
		'toggleGroupModeSelected',
	],
	data(): Object
	{
		return {
			collapsedStates: {},
			hiddenStates: {},
		};
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
		siblings(): CheckListModel[]
		{
			return this.checkLists
				.filter((item: CheckListModel) => item.parentId === this.parentId)
				.sort((a: CheckListModel, b: CheckListModel) => a.sortIndex - b.sortIndex);
		},
		getCollapsedClassForItem(): function
		{
			return (itemId) => {
				return `check-list-widget-collapse ${this.collapsedStates[itemId] ? '--collapsed' : '--expanded'}`;
			};
		},
	},
	mounted(): void
	{
		if (this.checkListId)
		{
			this.scrollContainer = this.$root.$el?.querySelector(['[data-list]']);

			const targetParentItem = this.scrollContainer.querySelector([`[data-parent="${this.checkListId}"]`]);
			const offset = 12;

			setTimeout(() => {
				this.scrollContainer.scrollTop = targetParentItem.offsetTop - offset;
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

			const level = this.getItemLevel(item);
			if (level === 1)
			{
				return '0';
			}

			return `${(level - 1) * 12}px`;
		},
		toggleCollapse({ parentId, areChildrenCollapsed })
		{
			this.collapsedStates[parentId] = areChildrenCollapsed;
		},
		handleShowItem(itemId: number | string): void
		{
			this.hiddenStates[itemId] = false;
		},
		handleHideItem(itemId: number | string): void
		{
			this.hiddenStates[itemId] = true;
		},
		isFirstVisibleItem(title, index): boolean
		{
			const siblings = this.siblings;

			const firstVisibleIndex = siblings.findIndex((item) => !this.hiddenStates[item.id]);

			return firstVisibleIndex !== -1 && firstVisibleIndex === index;
		},
	},
	template: `
		<div class="check-list-widget-container">
			<ul class="check-list-widget">
				<li
					v-for="(item, index) in siblings"
					:key="item.id"
					class="check-list-widget-item"
					:class="{
						'--first-visible': parentId === 0 && isFirstVisibleItem(item.title, index),
						'--hidden': hiddenStates[item.id],
						'--parent': parentId === 0
					}"
				>
					<CheckListParentItem
						v-if="item.parentId === 0"
						:id="item.id"
						:taskId="taskId"
						:panelIsShown="listShownItemPanels.includes(item.id)"
						@update="$emit('update')"
						@removeItem="(id) => $emit('removeItem', id)"
						@focus="(id) => $emit('focus', id)"
						@blur="(id) => $emit('blur', id)"
						@emptyBlur="(id) => $emit('emptyBlur', id)"
						@toggleCompleted="(data) => $emit('toggleCompleted', data)"
						@toggleCollapse="toggleCollapse"
						@startGroupMode="(id) => $emit('startGroupMode', id)"
						@show="handleShowItem"
						@hide="handleHideItem"
					/>
					<CheckListChildItem
						v-else
						:id="item.id"
						:taskId="taskId"
						:itemOffset="getItemOffset(item)"
						:panelIsShown="listShownItemPanels.includes(item.id)"
						@update="$emit('update')"
						@toggleIsComplete="(id) => $emit('toggleIsComplete', id)"
						@addItem="(data) => $emit('addItem', data)"
						@removeItem="(id) => $emit('removeItem', id)"
						@focus="(id) => $emit('focus', id)"
						@blur="(id) => $emit('blur', id)"
						@emptyBlur="(id) => $emit('emptyBlur', id)"
						@toggleGroupModeSelected="(id) => $emit('toggleGroupModeSelected', id)"
						@show="handleShowItem"
						@hide="handleHideItem"
					/>
					<CheckListWidget
						v-if="checkLists.some(child => child.parentId === item.id)"
						:taskId="taskId"
						:parentId="item.id"
						:listShownItemPanels="listShownItemPanels"
						:class="getCollapsedClassForItem(item.id)"
						@update="$emit('update')"
						@toggleIsComplete="(id) => $emit('toggleIsComplete', id)"
						@addItem="(data) => $emit('addItem', data)"
						@removeItem="(id) => $emit('removeItem', id)"
						@focus="(id) => $emit('focus', id)"
						@blur="(id) => $emit('blur', id)"
						@emptyBlur="(id) => $emit('emptyBlur', id)"
						@toggleCompleted="(data) => $emit('toggleCompleted', data)"
						@toggleCollapse="toggleCollapse"
						@startGroupMode="(id) => $emit('startGroupMode', id)"
						@toggleGroupModeSelected="(id) => $emit('toggleGroupModeSelected', id)"
						@show="handleShowItem"
						@hide="handleHideItem"
					/>
					<div class="check-list-widget-add-container" :class="getCollapsedClassForItem(item.id)">
						<CheckListAddItem
							v-if="item.parentId === 0"
							:taskId="taskId"
							:id="item.id"
							@update="$emit('update')"
							@addItem="(data) => $emit('addItem', data)"
						/>
					</div>
				</li>
			</ul>
		</div>
	`,
};
