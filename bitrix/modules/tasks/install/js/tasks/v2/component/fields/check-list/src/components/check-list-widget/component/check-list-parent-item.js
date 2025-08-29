import { Event, Text } from 'main.core';

import { BIcon } from 'ui.icon-set.api.vue';
import { BMenu, type MenuOptions, type MenuItemOptions } from 'ui.vue3.components.menu';
import { Actions, Outline } from 'ui.icon-set.api.core';

import { Model } from 'tasks.v2.const';
import { GrowingTextArea } from 'tasks.v2.component.elements.growing-text-area';
import { UserAvatarList } from 'tasks.v2.component.elements.user-avatar-list';
import { ProgressBar } from 'tasks.v2.component.elements.progress-bar';
import type { CheckListModel } from 'tasks.v2.model.check-list';

import { CheckListItemMixin } from './check-list-item-mixin';

// @vue/component
export const CheckListParentItem = {
	name: 'CheckListParentItem',
	components: {
		BIcon,
		BMenu,
		GrowingTextArea,
		UserAvatarList,
		ProgressBar,
	},
	mixins: [
		CheckListItemMixin,
	],
	inject: ['setItemsRef'],
	emits: [
		'toggleCompleted',
		'startGroupMode',
		'openCheckList',
	],
	setup(): Object
	{
		return {
			Actions,
			Outline,
		};
	},
	data(): Object
	{
		return {
			isSticky: false,
			isMenuShown: false,
			menuRemoveSectionCode: 'removeSection',
			areCompletedCollapsed: false,
		};
	},
	computed: {
		menuOptions(): MenuOptions
		{
			return {
				id: `check-list-parent-item-action-menu-${Text.getRandom()}`,
				bindElement: this.$refs.more.$el,
				minWidth: 250,
				offsetLeft: -100,
				sections: [
					{
						code: this.menuRemoveSectionCode,
					},
				],
				items: this.menuItems,
				targetContainer: document.body,
				closeByEsc: true,
			};
		},
		menuItems(): MenuItemOptions[]
		{
			const collapseItem = {
				title: (this.areCompletedCollapsed
						? this.loc('TASKS_V2_CHECK_LIST_ITEM_MENU_SHOW')
						: this.loc('TASKS_V2_CHECK_LIST_ITEM_MENU_HIDE')
				),
				icon: this.areCompletedCollapsed ? Outline.OBSERVER : Outline.CROSSED_EYE,
				dataset: {
					id: `MenuProfileHide-${this.id}`,
				},
				onClick: () => {
					this.isMenuShown = false;
					this.areCompletedCollapsed = !this.areCompletedCollapsed;
					this.$emit('toggleCompleted', {
						itemId: this.id,
						collapsed: this.areCompletedCollapsed,
					});
				},
			};

			const groupActionsItem = {
				title: this.loc('TASKS_V2_CHECK_LIST_ITEM_MENU_GROUP'),
				icon: Outline.MULTICHOICE_ON,
				dataset: {
					id: `MenuProfileGroup-${this.id}`,
				},
				onClick: () => {
					if (this.item.collapsed === true)
					{
						this.collapseChildrenItems(this.id);
					}
					this.$emit('startGroupMode', this.id);
					this.isMenuShown = false;
				},
			};

			const editItem = {
				sectionCode: this.menuRemoveSectionCode,
				title: this.loc('TASKS_V2_CHECK_LIST_ITEM_MENU_EDIT'),
				icon: Outline.EDIT_L,
				dataset: {
					id: `MenuProfileEdit-${this.id}`,
				},
				onClick: () => this.$emit('openCheckList', this.id),
			};

			const removeItem = {
				sectionCode: this.menuRemoveSectionCode,
				design: 'alert',
				title: this.loc('TASKS_V2_CHECK_LIST_ITEM_MENU_REMOVE'),
				icon: Outline.TRASHCAN,
				dataset: {
					id: `MenuProfileRemove-${this.id}`,
				},
				onClick: this.removeItem.bind(this),
			};

			if (this.isPreview)
			{
				return [
					collapseItem,
					editItem,
					removeItem,
				];
			}
			else
			{
				return [
					collapseItem,
					groupActionsItem,
					removeItem,
				];
			}
		},
		itemIcon(): string
		{
			return this.item.isComplete ? Outline.CHECK_L : Outline.CHECK_LIST;
		},
		checkListStatus(): string
		{
			const label = this.loc('TASKS_V2_CHECK_LIST_STATUS_LABEL_NEW');

			return label
				.replace('#completed#', this.completedCount)
				.replace('#total#', this.totalCount);
		},
		completedCount(): number
		{
			return this.checkLists.filter((checklist: CheckListModel) => {
				return checklist.parentId === this.id && checklist.isComplete;
			}).length;
		},
		totalCount(): number
		{
			return this.checkLists.filter((checklist: CheckListModel) => {
				return checklist.parentId === this.id;
			}).length;
		},
	},
	mounted(): void
	{
		this.scrollContainer = this.$parent.$el?.closest('[data-list]');

		if (this.setItemsRef)
		{
			this.setItemsRef(this.id, this);
		}

		if (this.scrollContainer)
		{
			Event.bind(this.scrollContainer, 'scroll', this.handleScroll);

			void this.$nextTick(this.checkSticky);

			this.mutationObserver = new MutationObserver(() => {
				this.checkSticky();
			});
			this.mutationObserver.observe(
				this.scrollContainer,
				{
					childList: true,
					subtree: true,
				},
			);
		}
	},
	beforeUnmount(): void
	{
		if (this.scrollContainer)
		{
			Event.unbind(this.scrollContainer, 'scroll', this.handleScroll);
		}

		if (this.mutationObserver)
		{
			this.mutationObserver.disconnect();
		}

		if (this.setItemsRef)
		{
			this.setItemsRef(this.id, null);
		}
	},
	methods: {
		handleScroll(): void
		{
			this.checkSticky();

			this.isMenuShown = false;
		},
		checkSticky(): void
		{
			if (!this.scrollContainer || !this.$refs.item)
			{
				return;
			}

			const stickyRect = this.$refs.item.getBoundingClientRect();
			const containerRect = this.scrollContainer.getBoundingClientRect();

			this.isSticky = stickyRect.top <= (containerRect.top + stickyRect.height / 2);
		},
		showMenu(): void
		{
			this.isMenuShown = true;
		},
		collapseChildrenItems(itemId: number | string): void
		{
			this.$store.dispatch(`${Model.CheckList}/update`, {
				id: itemId,
				fields: {
					collapsed: !this.item.collapsed && !this.item.previewCollapsed,
					previewCollapsed: false,
				},
			});
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
		<div
			ref="item"
			class="check-list-widget-parent-item"
			:class="{
				'--complete': item.isComplete,
				'--collapsed': isCollapsed(item),
				'--preview': isPreview,
			}"
			:data-id="id"
			:data-parent="id"
		>
			<div class="check-list-widget-parent-item-label-container">
				<BIcon :name="itemIcon"/>
			</div>
			<div class="check-list-widget-parent-item-title-container">
				<GrowingTextArea
					class="check-list-widget-parent-item-title"
					:data-check-list-id="'check-list-parent-item-title-' + id"
					:modelValue="item.title"
					:placeholder="loc('TASKS_V2_CHECK_LIST_ITEM_PLACEHOLDER')"
					:readonly="groupMode || isPreview"
					:fontColor="textColor"
					:fontSize="17"
					:lineHeight="20"
					:fontWeight="500"
					@update:modelValue="updateTitle"
					@focus="handleFocus"
					@blur="handleBlur"
					@emptyBlur="handleEmptyBlur"
				/>
				<template v-if="hasAttachments">
					<div class="check-list-widget-item-attach --parent">
						<div v-if="hasUsers" class="check-list-widget-item-attach-users">
							<div v-if="hasAccomplices" class="check-list-widget-item-attach-users-list">
								<BIcon :name="Outline.GROUP"/>
								<UserAvatarList :users="accomplices"/>
							</div>
							<div v-if="hasAuditors" class="check-list-widget-item-attach-users-list">
								<BIcon :name="Outline.OBSERVER"/>
								<UserAvatarList :users="auditors"/>
							</div>
						</div>
					</div>
				</template>
				<div class="check-list-widget-parent-item-title-status">
					<div class="check-list-widget-parent-item-title-status-label">
						{{ checkListStatus }}
					</div>
					<ProgressBar
						:totalValue="totalCount"
						:completedValue="completedCount"
						:width="56"
						:height="5"
						color="var(--ui-color-accent-main-primary-alt)"
						bgColor="var(--ui-color-base-7)"
						:borderRadius="30"
					/>
				</div>
			</div>
			<div class="check-list-widget-parent-item-action">
				<div class="check-list-widget-parent-item-main-action">
					<BIcon ref="more" :name="Outline.MORE_L" @click="showMenu" />
					<BIcon
						:name="isCollapsed(item) ? Actions.CHEVRON_DOWN : Actions.CHEVRON_UP"
						@click="collapseChildrenItems(this.id)"
					/>
				</div>
				<div v-if="isSticky && !isPreview" class="check-list-widget-parent-item-empty"></div>
			</div>
			<BMenu v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false"/>
		</div>
	`,
};
