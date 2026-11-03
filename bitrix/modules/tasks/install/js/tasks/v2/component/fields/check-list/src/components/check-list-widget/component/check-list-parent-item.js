import { Event, Text } from 'main.core';

import { hint, type HintParams } from 'ui.vue3.directives.hint';
import { BMenu } from 'ui.system.menu.vue';
import { type MenuOptions, type MenuItemOptions } from 'ui.system.menu';
import { BIcon, Actions, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.actions';
import 'ui.icon-set.outline';

import { Model } from 'tasks.v2.const';
import { UserAvatarList } from 'tasks.v2.component.elements.user-avatar-list';
import { UserCheckbox } from 'tasks.v2.component.elements.user-checkbox';
import { ProgressBar } from 'tasks.v2.component.elements.progress-bar';
import { tooltip } from 'tasks.v2.component.elements.hint';
import { checkListService } from 'tasks.v2.provider.service.check-list-service';

import { type CheckListModel } from 'tasks.v2.model.check-list';
import { type UserModel } from 'tasks.v2.model.users';

import { CheckListFormattingLayer } from '../../check-list-formatting/check-list-formatting-layer';
import { CheckListItemMixin } from './check-list-item-mixin';

// @vue/component
export const CheckListParentItem = {
	name: 'CheckListParentItem',
	components: {
		BIcon,
		BMenu,
		CheckListFormattingLayer,
		UserAvatarList,
		UserCheckbox,
		ProgressBar,
	},
	directives: { hint },
	mixins: [
		CheckListItemMixin,
	],
	inject: ['setItemsRef'],
	props: {
		positionIndex: {
			type: Number,
			required: true,
		},
		showCloseButton: {
			type: Boolean,
			default: false,
		},
	},
	emits: [
		'startGroupMode',
		'openCheckList',
		'panelTab',
		'close',
		'stickinessChange',
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
		};
	},
	computed: {
		menuOptions(): MenuOptions
		{
			return {
				id: `check-list-parent-item-action-menu-${Text.getRandom()}`,
				bindElement: this.$refs.more,
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
				title: (this.item.areCompletedCollapsed
					? this.loc('TASKS_V2_CHECK_LIST_ITEM_MENU_SHOW')
					: this.loc('TASKS_V2_CHECK_LIST_ITEM_MENU_HIDE')
				),
				icon: this.item.areCompletedCollapsed ? Outline.OBSERVER : Outline.CROSSED_EYE,
				dataset: {
					id: `MenuProfileHide-${this.id}`,
				},
				onClick: () => {
					const newValue = !this.item.areCompletedCollapsed;

					void this.updateCheckList(this.id, { areCompletedCollapsed: newValue });

					this.toggleCompleted(this.id, newValue);
				},
			};

			const groupActionsItem = {
				title: this.loc('TASKS_V2_CHECK_LIST_ITEM_MENU_GROUP'),
				icon: Outline.MULTICHOICE_ON,
				dataset: {
					id: `MenuProfileGroup-${this.id}`,
				},
				onClick: () => {
					if (this.collapsed)
					{
						this.toggleCollapse();
					}
					this.$emit('startGroupMode', this.id);
				},
			};

			const editItem = {
				sectionCode: this.menuRemoveSectionCode,
				title: this.loc('TASKS_V2_CHECK_LIST_ITEM_MENU_EDIT'),
				icon: Outline.EDIT_L,
				dataset: {
					id: `MenuProfileEdit-${this.id}`,
				},
				onClick: () => {
					if (this.canModify)
					{
						this.$emit('openCheckList', this.id);
					}
				},
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
					this.canModify ? editItem : null,
					this.canRemove ? removeItem : null,
				];
			}

			return [
				collapseItem,
				this.canModify ? groupActionsItem : null,
				this.canRemove ? removeItem : null,
			];
		},
		itemIcon(): string
		{
			return this.completed ? Outline.CHECK_L : Outline.CHECK_LIST;
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
				if (checklist.parentId !== this.id)
				{
					return false;
				}

				return checklist.localCompleteState ?? checklist.isComplete;
			}).length;
		},
		totalCount(): number
		{
			return this.checkLists.filter((checklist: CheckListModel) => {
				return checklist.parentId === this.id;
			}).length;
		},
		currentUserResponsible(): boolean
		{
			return this.task.responsibleIds.includes(this.currentUserId);
		},
		currentUser(): UserModel
		{
			return this.$store.getters[`${Model.Users}/getById`](this.currentUserId);
		},
		numberMyItems(): number
		{
			return this.checkListManager.findItemIdsWithUser(this.id, this.currentUserId).size;
		},
		myFilterTooltip(): Function
		{
			return (): HintParams => tooltip({
				text: (
					this.myFilterActive
						? this.loc('TASKS_V2_CHECK_LIST_MY_FILTER_HINT_ALL')
						: this.loc('TASKS_V2_CHECK_LIST_MY_FILTER_HINT_MY')
				),
				popupOptions: {
					offsetLeft: this.$refs.myFilter.offsetWidth / 2,
				},
			});
		},
		myFilterActive(): boolean
		{
			return this.item.myFilterActive;
		},
		fontSize(): number
		{
			return this.isPreview ? 15 : 17;
		},
		collapsed(): boolean
		{
			if (this.checkListManager.isParentItem(this.draggedCheckListId))
			{
				return true;
			}

			return this.checkListManager.isItemCollapsed(this.item, this.isPreview, this.positionIndex);
		},
	},
	watch: {
		myFilterActive(value: boolean): void
		{
			this.handleMyFilter(value);
		},
		totalCount(): void
		{
			this.handleCompleteState();

			if (!this.numberMyItems && this.myFilterActive)
			{
				this.handleMyFilter(false);
			}
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

		if (!this.isPreview)
		{
			this.handleCompleteState();
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

		this.$emit('stickinessChange', { id: this.id, isSticky: false });

		if (this.setItemsRef)
		{
			this.setItemsRef(this.id, null);
		}
	},
	methods: {
		handleScroll(): void
		{
			this.checkSticky();
		},
		handleTextClick(): void
		{
			if (this.isPreview && this.canModify)
			{
				this.$emit('openCheckList', this.id);
			}
		},
		handleIndent(): void
		{
			this.$emit('indent', this.id);
		},
		handleOutdent(): void
		{
			this.$emit('outdent', this.id);
		},
		handlePanelTab({ shiftKey }: { shiftKey: boolean }): void
		{
			if (shiftKey)
			{
				this.handleOutdent();
			}
			else
			{
				this.handleIndent();
			}
		},
		handlePanelEntryTab(event: KeyboardEvent): void
		{
			if (
				event.shiftKey
				|| event.ctrlKey
				|| event.metaKey
				|| event.altKey
				|| event.target !== this.$refs.item
			)
			{
				return;
			}

			this.$emit('panelTab', { itemId: this.id, shiftKey: false, event });
		},
		handleMyFilter(checked: boolean): void
		{
			const myItemIds = this.checkListManager.findItemIdsWithUser(
				this.id,
				this.currentUserId,
			);

			this.$store.dispatch(`${Model.CheckList}/update`, {
				id: this.id,
				fields: { myFilterActive: checked },
			});

			if (checked === true)
			{
				const idsToHide = this.checkListManager.getAllChildren(this.id)
					.filter((item: CheckListModel) => !myItemIds.has(item.id))
					.map((item: CheckListModel) => item.id);

				this.checkListManager.hideItems(
					idsToHide,
					(updates: CheckListModel[]) => this.upsertCheckLists(updates),
				);
			}
			else
			{
				const childrenIds = this.checkListManager
					.getAllChildren(this.id)
					.filter((item: CheckListModel) => {
						const completed = (item.localCompleteState ?? item.isComplete);

						return !this.item.areCompletedCollapsed || !completed;
					})
					.map((item: CheckListModel) => item.id);

				this.checkListManager.showItems(
					childrenIds,
					(updates: CheckListModel[]) => this.upsertCheckLists(updates),
				);
			}
		},
		handleCompleteState(): void
		{
			if (this.totalCount > 0)
			{
				this.complete(this.totalCount === this.completedCount, /* persist */ false);
			}
			else if (this.completed)
			{
				this.complete(false, /* persist */ false);
			}
		},
		checkSticky(): void
		{
			if (!this.scrollContainer || !this.$refs.item)
			{
				return;
			}

			const stickyRect = this.$refs.item.getBoundingClientRect();
			const containerRect = this.scrollContainer.getBoundingClientRect();

			const isSticky = stickyRect.top <= (containerRect.top + stickyRect.height / 2);
			if (this.isSticky === isSticky)
			{
				return;
			}

			this.isSticky = isSticky;
			this.$emit('stickinessChange', { id: this.id, isSticky });
		},
		showMenu(): void
		{
			this.isMenuShown = true;
		},
		toggleCollapse(): void
		{
			const localCollapsedState = !this.collapsed;

			if (this.isPreview && this.isEdit)
			{
				if (localCollapsedState === true)
				{
					void checkListService.collapse(this.taskId, this.id);
				}
				else
				{
					void checkListService.expand(this.taskId, this.id);
				}
			}

			this.$store.dispatch(`${Model.CheckList}/update`, {
				id: this.id,
				fields: { localCollapsedState },
			});
		},
		collapse(): void
		{
			this.$store.dispatch(`${Model.CheckList}/update`, {
				id: this.id,
				fields: { localCollapsedState: true },
			});
		},
		toggleCompleted(itemId: number | string, collapsed: boolean): void
		{
			const myItemIds = this.checkListManager.findItemIdsWithUser(
				this.id,
				this.currentUserId,
			);

			this.checkListManager.getAllCompletedChildren(itemId)
				.filter((item: CheckListModel) => {
					return !this.myFilterActive || myItemIds.has(item.id);
				})
				.forEach((item: CheckListModel) => {
					if (collapsed === false)
					{
						this.checkListManager.showItems(
							[item.id],
							(updates: CheckListModel[]) => this.upsertCheckLists(updates),
						);
					}
					else
					{
						this.checkListManager.hideItems(
							[item.id],
							(updates: CheckListModel[]) => this.upsertCheckLists(updates),
						);
					}
				});
		},
	},
	template: `
		<div
			ref="item"
			tabindex="-1"
			class="check-list-widget-parent-item print-no-before"
			data-testid="tasks-check-list-parent-item"
			:class="{
				'--complete': completed,
				'--collapsed': collapsed,
				'--preview': isPreview,
				'--editable': canModify,
			}"
			:data-id="id"
			:data-parent="id"
			@mouseover="isHovered = true"
			@mouseleave="isHovered = false"
			@keydown.tab="handlePanelEntryTab"
		>
			<div class="check-list-widget-parent-item-label-container">
				<div
					v-if="!readOnly"
					class="check-list-widget-item-drag"
					:class="{
						'check-list-drag-list': canDragItem,
					}"
				>
					<BIcon v-if="canDragItem" :name="Outline.DRAG_L"/>
				</div>
				<div class="check-list-widget-item-icon">
					<BIcon :name="itemIcon" aria-hidden="true"/>
				</div>
			</div>
			<div class="check-list-widget-parent-item-title-container">
				<CheckListFormattingLayer
					preserveShiftTab
					ref="growingTextArea"
					class="check-list-widget-parent-item-title"
					:data-check-list-id="'check-list-parent-item-title-' + id"
					:modelValue="item.title"
					:placeholder="loc('TASKS_V2_CHECK_LIST_LIST_PLACEHOLDER')"
					:readonly="textReadOnly"
					:fontColor="textColor"
					:linkColor
					:fontSize
					:lineHeight="20"
					:maxLines="6"
					:fontWeight="500"
					@click="handleTextClick"
					@linkClick="handleLinkClick"
					@update:modelValue="updateTitle"
					@input="handleInput"
					@focus="handleFocus"
					@emptyFocus="scrollToItem"
					@blur="handleBlur"
					@emptyBlur="handleEmptyBlur"
					@indent="handleIndent"
					@outdent="handleOutdent"
					@panelTab="handlePanelTab"
					@selectionChange="handleFormattingSelectionChange"
				/>
				<template v-if="hasAttachments">
					<div class="check-list-widget-item-attach --parent">
						<div v-if="hasUsers" class="check-list-widget-item-attach-users">
							<div v-if="hasAccomplices" class="check-list-widget-item-attach-users-list">
								<BIcon :name="Outline.GROUP" aria-hidden="true"/>
								<UserAvatarList :users="accomplices"/>
							</div>
							<div v-if="hasAuditors" class="check-list-widget-item-attach-users-list">
								<BIcon :name="Outline.OBSERVER" aria-hidden="true"/>
								<UserAvatarList :users="auditors"/>
							</div>
						</div>
						<div v-if="hasUsers" class="check-list-widget-item-attach-users-print">
							<div v-if="hasAccomplices" class="check-list-widget-item-attach-users-print-group">{{ accomplicesLabel }}</div>
							<div v-if="hasAuditors" class="check-list-widget-item-attach-users-print-group">{{ auditorsLabel }}</div>
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
						aria-hidden="true"
					/>
				</div>
			</div>
			<div class="check-list-widget-parent-item-action">
				<div class="check-list-widget-parent-item-main-action">
					<div
						ref="myFilter"
						class="check-list-widget-parent-item-main-action-filter"
						v-hint="myFilterTooltip"
					>
						<UserCheckbox
							v-if="!currentUserResponsible && numberMyItems > 0"
							:init-user="currentUser"
							:number="numberMyItems"
							data-testid="tasks-check-list-parent-item-my-filter"
							:aria-label="loc('TASKS_V2_CHECK_LIST_MY_FILTER_LABEL')"
							v-model:checked="item.myFilterActive"
						/>
					</div>
					<div class="check-list-widget-parent-item-main-action-actions print-ignore">
						<button
							ref="more"
							type="button"
							class="check-list-widget-parent-item-action-btn"
							aria-haspopup="menu"
							data-testid="tasks-check-list-parent-item-menu-btn"
							:aria-expanded="isMenuShown ? 'true' : 'false'"
							:aria-label="loc('TASKS_V2_CHECK_LIST_ACTIONS_MENU_LABEL')"
							@click="showMenu"
						>
							<BIcon
								:name="Outline.MORE_L"
								:size="isPreview ? 20 : 24"
								aria-hidden="true"
							/>
						</button>
						<button
							type="button"
							class="check-list-widget-parent-item-action-btn"
							:aria-expanded="collapsed ? 'false' : 'true'"
							:aria-label="collapsed
								? loc('TASKS_V2_CHECK_LIST_EXPAND_LABEL')
								: loc('TASKS_V2_CHECK_LIST_COLLAPSE_LABEL')"
							data-testid="tasks-check-list-parent-item-collapse-btn"
							@click="toggleCollapse()"
						>
							<BIcon
								:name="collapsed ? Outline.CHEVRON_DOWN_L : Outline.CHEVRON_TOP_L"
								:size="isPreview ? 20 : 24"
								aria-hidden="true"
							/>
						</button>
						<button
							v-if="showCloseButton"
							type="button"
							class="check-list-widget-parent-item-action-btn --close"
							data-testid="task-check-list-close-btn"
							:aria-label="loc('TASKS_V2_CHECK_LIST_CLOSE_LABEL')"
							@click="$emit('close')"
						>
							<BIcon
								:name="Outline.CROSS_L"
								:size="isPreview ? 20 : 24"
								data-testid="tasks-check-list-close-btn"
								aria-hidden="true"
							/>
						</button>
					</div>
				</div>
				<div
					v-if="isSticky && !isPreview && !showCloseButton"
					class="check-list-widget-parent-item-empty print-ignore"
				/>
			</div>
			<BMenu v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false"/>
		</div>
	`,
};
