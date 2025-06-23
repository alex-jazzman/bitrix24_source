import { Dom, Event, Text, Type } from 'main.core';
import { BaseEvent } from 'main.core.events';
import { Popup } from 'main.popup';

import { BMenu, type MenuItemOptions } from 'ui.vue3.components.menu';
import { Item } from 'ui.entity-selector';
import type { MenuOptions } from 'ui.system.menu';

import { Core } from 'tasks.v2.core';
import { Model } from 'tasks.v2.const';
import { UserSelectorDialog } from 'tasks.v2.lib.user-selector-dialog';
import type { CheckListModel } from 'tasks.v2.model.check-list';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { UserModel } from 'tasks.v2.model.users';
import { fileService, EntityTypes } from 'tasks.v2.provider.service.file-service';
import { checkListService } from 'tasks.v2.provider.service.check-list-service';
import { participantMeta } from 'tasks.v2.component.elements.participant-list';

import { CheckListNotifier } from './check-list-notifier';
import { PanelAction, type VisibleActions, type ActiveActions } from './check-list-widget/check-list-item-panel-meta';

export const CheckListMixin = {
	components: {
		BMenu,
	},
	data(): Object
	{
		return {
			listShownItemPanels: [],
			itemPanelIsShown: false,
			checkListWasUpdated: false,
			itemId: null,
			itemPanelStyles: {
				top: '0',
				display: 'flex',
			},
			isItemPanelFreeze: false,
			itemPanelTopOffset: 0,
			itemPanelTopLimit: 0,
			itemsRefs: {},
			isForwardMenuShown: false,
			forwardMenuSectionCode: 'createSection',
			forwardBindElement: null,
			itemsToDelete: [],
			collapsedItems: new Map(),
			shownPopups: new Set(),
		};
	},
	provide(): Object
	{
		return {
			setItemsRef: this.setItemsRef,
			getItemsRef: this.getItemsRef,
		};
	},
	computed: {
		isEdit(): boolean
		{
			return Type.isNumber(this.taskId) && this.taskId > 0;
		},
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
			return this.checkLists.filter((checkList: CheckListModel) => checkList.parentId === 0);
		},
		hasFewParentCheckLists(): boolean
		{
			return this.parentCheckLists.length > 1;
		},
		item(): ?CheckListModel
		{
			return this.$store.getters[`${Model.CheckList}/getById`](this.itemId);
		},
		itemGroupModeSelected(): boolean
		{
			if (!this.item)
			{
				return false;
			}

			return this.item.groupMode?.selected === true;
		},
		siblings(): CheckListModel[]
		{
			if (!this.item)
			{
				return [];
			}

			return this.checkLists.filter((item: CheckListModel) => item.parentId === this.item.parentId);
		},
		children(): CheckListModel[]
		{
			if (!this.item)
			{
				return [];
			}

			return this.checkLists.filter((item: CheckListModel) => {
				return item.parentId === this.item.id;
			});
		},
		visiblePanelActions(): VisibleActions
		{
			if (!this.item)
			{
				return [];
			}

			let actions = [
				PanelAction.SetImportant,
				PanelAction.MoveRight,
				PanelAction.MoveLeft,
				PanelAction.AssignAccomplice,
				PanelAction.AssignAuditor,
				PanelAction.Forward,
				PanelAction.Delete,
			];

			if (this.itemGroupModeSelected)
			{
				actions.push(PanelAction.Cancel);
			}
			else
			{
				actions.push(PanelAction.AttachFile);
			}

			if (this.item.parentId === 0)
			{
				actions = [
					PanelAction.AssignAccomplice,
					PanelAction.AssignAuditor,
				];
			}

			const limits = Core.getParams().limits;
			const stakeholdersActions = new Set([
				PanelAction.AssignAccomplice,
				PanelAction.AssignAuditor,
			]);

			return actions.filter((action: string) => {
				const isDisabledStakeholders = stakeholdersActions.has(action) && !limits.stakeholders;

				return !isDisabledStakeholders;
			});
		},
		disabledPanelActions(): []
		{
			if (!this.item)
			{
				return [];
			}

			const disabledActions = [];

			const itemLevel = this.getItemLevel(this.item);
			const canModify = this.item.actions.modify === true;
			const canRemove = this.item.actions.remove === true;

			const conditionHandlers = {
				[PanelAction.SetImportant]: () => {
					return canModify === false;
				},
				[PanelAction.AttachFile]: () => {
					return canModify === false;
				},
				[PanelAction.MoveLeft]: () => {
					return itemLevel === 1 || canModify === false;
				},
				[PanelAction.MoveRight]: () => {
					return (
						itemLevel === 5
						|| this.item.sortIndex === 0
						|| canModify === false
					);
				},
				[PanelAction.AssignAccomplice]: () => {
					return canModify === false;
				},
				[PanelAction.AssignAuditor]: () => {
					return canModify === false;
				},
				[PanelAction.Forward]: () => {
					return (
						canModify === false
						|| this.item.title === ''
					);
				},
				[PanelAction.Delete]: () => {
					return (
						canRemove === false
						|| this.item.title === ''
					);
				},
			};

			Object.entries(conditionHandlers)
				.forEach(([action: string, condition: function]) => {
					if (condition())
					{
						disabledActions.push(action);
					}
				})
			;

			return disabledActions;
		},
		activePanelActions(): ActiveActions
		{
			if (!this.item)
			{
				return [];
			}

			const actions = [];

			if (this.item.isImportant)
			{
				actions.push(PanelAction.SetImportant);
			}

			return actions;
		},
		forwardMenuOptions(): MenuOptions
		{
			return {
				id: `check-list-item-forward-menu-${this.item.id}`,
				bindElement: this.forwardBindElement,
				maxWidth: 400,
				maxHeight: 300,
				offsetLeft: -110,
				sections: [
					{
						code: this.forwardMenuSectionCode,
					},
				],
				items: this.forwardMenuItems,
				targetContainer: document.body,
			};
		},
		forwardMenuItems(): MenuItemOptions[]
		{
			const checklistItems = this.parentCheckLists
				.filter((checkList: CheckListModel) => checkList.id !== this.item.parentId)
				.map((checkList: CheckListModel) => ({
					title: checkList.title,
					dataset: {
						id: `ForwardMenuCheckList-${checkList.id}`,
					},
					onClick: () => {
						this.hideItemPanel();
						void this.forwardToChecklist(checkList.id);
					},
				}));

			return [
				...checklistItems,
				{
					sectionCode: this.forwardMenuSectionCode,
					title: this.loc('TASKS_V2_CHECK_LIST_ITEM_FORWARD_MENU_CREATE'),
					dataset: {
						id: `ForwardMenuCreateNew-${this.item.id}`,
					},
					onClick: this.forwardToNewChecklist.bind(this),
				},
			];
		},
		stub(): boolean
		{
			return this.checkLists.length === 0 || this.emptyList === true;
		},
		emptyList(): boolean
		{
			const siblings = this.parentCheckLists
				.filter((item: CheckListModel) => !this.itemsToDelete.includes(item.id));

			return siblings.length === 0;
		},
	},
	mounted(): void
	{
		Event.bind(this.$refs.list, 'scroll', this.handleScroll);
	},
	beforeUnmount(): void
	{
		Event.unbind(this.$refs.list, 'scroll', this.handleScroll);
	},
	methods: {
		handleScroll(): void
		{
			this.isForwardMenuShown = false;

			this.updatePanelPosition();
		},
		async saveCheckList(): Promise<void>
		{
			if (this.checkListWasUpdated && this.isEdit)
			{
				await checkListService.save(this.taskId, this.checkLists);
			}

			if (!this.isDemoCheckListModified())
			{
				this.removeChecklists();
			}

			this.checkListWasUpdated = false;
		},
		isDemoCheckListModified(): boolean
		{
			if (this.checkLists.length !== 1)
			{
				return true;
			}

			const [checkList] = this.checkLists;
			const demoTitle = this.loc('TASKS_V2_CHECK_LIST_TITLE_NUMBER', { '#number#': 1 });

			return (
				checkList.title !== demoTitle
				|| checkList.accomplices.length > 0
				|| checkList.auditors.length > 0
			);
		},
		removeChecklists(): void
		{
			this.checkLists
				.filter((checklist: CheckListModel) => checklist.parentId === 0)
				.forEach((item: CheckListModel) => {
					this.removeItem(item.id);
				});
		},
		async addCheckList(empty: boolean = false): Promise<string>
		{
			const parentId = Text.getRandom();
			const childId = Text.getRandom();

			const items = [this.getDataForNewCheckList(parentId)];
			if (!empty)
			{
				items.push({
					id: childId,
					nodeId: childId,
					parentId,
					sortIndex: 0,
				});
			}

			await this.$store.dispatch(`${Model.CheckList}/insertMany`, items);

			this.$store.dispatch(`${Model.Tasks}/update`, {
				id: this.taskId,
				fields: { checklist: [...this.task.checklist, parentId, childId] },
			});

			return parentId;
		},
		addFastCheckList(): void
		{
			const parentId = Text.getRandom();

			this.$store.dispatch(
				`${Model.CheckList}/insert`,
				this.getDataForNewCheckList(parentId),
			);

			this.$store.dispatch(`${Model.Tasks}/update`, {
				id: this.taskId,
				fields: { checklist: [...this.task.checklist, parentId] },
			});

			void this.saveCheckList();
		},
		showForwardMenu(node: HTMLElement): void
		{
			this.forwardBindElement = node;

			this.isForwardMenuShown = true;
		},
		getCheckListsNumber(): number
		{
			return this.checkLists.filter((checklist: CheckListModel) => {
				return checklist.parentId === 0 && !this.itemsToDelete.includes(checklist.id);
			}).length;
		},
		getDataForNewCheckList(parentId: string): CheckListModel
		{
			return {
				id: parentId,
				nodeId: parentId,
				title: this.loc('TASKS_V2_CHECK_LIST_TITLE_NUMBER', { '#number#': this.getCountForNewCheckList() }),
				sortIndex: this.getSortForNewCheckList(),
			};
		},
		getSortForNewCheckList(): number
		{
			return this.getCheckListsNumber();
		},
		getCountForNewCheckList(): number
		{
			return this.getCheckListsNumber() + 1;
		},
		setItemsRef(id, ref): void
		{
			this.itemsRefs[id] = ref;
		},
		getItemsRef(id): Object
		{
			return this.itemsRefs[id];
		},
		focusToItem(itemId: number | string): void
		{
			void this.$nextTick(() => {
				this.getItemsRef(itemId)?.$refs.growingTextArea?.focusTextarea();
			});
		},
		showItem(itemId: number | string): void
		{
			void this.$nextTick(() => {
				this.getItemsRef(itemId)?.show();
			});
		},
		hideItem(itemId: number | string): void
		{
			void this.$nextTick(() => {
				this.getItemsRef(itemId)?.hide();
			});
		},
		addItem({ id, sort }: {id: number | string, sort: number}): void
		{
			if (this.hasActiveGroupMode())
			{
				return;
			}

			this.itemId = id;

			const childId = Text.getRandom();
			const sortIndex = sort ?? this.getSort();
			const parentId = this.item.parentId === 0 ? this.item.id : this.item.parentId;

			this.resortSiblingsItems(sortIndex);

			this.$store.dispatch(`${Model.CheckList}/insert`, {
				id: childId,
				nodeId: childId,
				parentId,
				sortIndex,
			});

			this.$store.dispatch(`${Model.Tasks}/update`, {
				id: this.taskId,
				fields: { checklist: [...this.task.checklist, childId] },
			});

			this.syncParentCompletionState(childId);
		},
		removeItem(id: number | string, isRootCall: boolean = true): void
		{
			if (!this.task)
			{
				return;
			}

			this.itemId = id;

			if (this.item?.title)
			{
				this.checkListWasUpdated = true;
			}

			const parentId = this.item?.parentId || null;

			if (this.children.length > 0)
			{
				this.children.forEach((child: CheckListModel) => {
					this.removeItem(child.id, false);
				});
			}

			this.$store.dispatch(`${Model.Tasks}/update`, {
				id: this.taskId,
				fields: { checklist: this.task.checklist.filter((itemId) => itemId !== id) },
			});
			this.$store.dispatch(`${Model.CheckList}/delete`, id);

			if (isRootCall)
			{
				this.resortSiblingsItems();
			}

			this.syncParentCompletionState(id, parentId);

			fileService.delete(id, EntityTypes.CheckListItem);
		},
		resortSiblingsItems(sortIndex?: number): void
		{
			const updates: CheckListModel[] = [];

			if (Type.isUndefined(sortIndex))
			{
				const siblings = this.siblings.sort((a: CheckListModel, b: CheckListModel) => {
					return a.sortIndex - b.sortIndex;
				});

				siblings.forEach((item, index) => {
					if (item.sortIndex !== index)
					{
						updates.push({
							...item,
							sortIndex: index,
						});
					}
				});
			}
			else
			{
				this.siblings
					.filter((item: CheckListModel) => item.sortIndex >= sortIndex)
					.forEach((item: CheckListModel) => {
						updates.push({
							...item,
							sortIndex: item.sortIndex + 1,
						});
					})
				;
			}

			if (updates.length > 0)
			{
				this.$store.dispatch(`${Model.CheckList}/upsertMany`, updates);
			}
		},
		getSort(): number
		{
			if (this.item && this.item.parentId === 0)
			{
				return this.children.length;
			}

			return this.siblings.length;
		},
		toggleCompleted({ itemId, collapsed }: { itemId: number | string, collapsed: boolean }): void
		{
			this.itemId = itemId;

			const children = this.getAllChildren();

			const completedChildren = children.filter((item: CheckListModel) => item.isComplete === true);
			completedChildren.forEach((item: CheckListModel) => {
				if (collapsed === false)
				{
					this.showItem(item.id);
				}
				else
				{
					this.hideItem(item.id);
				}
			});
		},
		handleUpdate(): void
		{
			this.checkListWasUpdated = true;
		},
		handleRemove(itemId: number | string): void
		{
			this.itemId = itemId;

			this.freeze();

			this.itemsToDelete = [...this.itemsToDelete, itemId];

			this.hideItem(itemId);

			const messageKey = (
				this.item.parentId === 0
					? 'TASKS_V2_CHECK_LIST_ITEM_REMOVE_BALLOON_PARENT'
					: 'TASKS_V2_CHECK_LIST_ITEM_REMOVE_BALLOON_CHILD'
			);

			const notifier = new CheckListNotifier({
				content: this.loc(messageKey),
			});
			notifier.subscribeOnce('complete', (baseEvent: BaseEvent) => {
				const timerHasEnded = baseEvent.getData();

				if (timerHasEnded)
				{
					this.removeItem(itemId);
				}
				else
				{
					this.showItem(itemId);
				}

				this.itemsToDelete = this.itemsToDelete.filter((id) => id !== itemId);

				this.unfreeze();
			});

			notifier.showBalloonWithTimer();
		},
		async handleGroupRemove(itemId: number | string): Promise<void>
		{
			this.itemId = itemId;

			this.freeze();

			this.itemsToDelete = [...this.itemsToDelete, itemId];

			this.hideItemPanel(itemId);

			const allSelectedItems = this.getAllSelectedItems();

			const nearestItem = this.findNearestItem(false);
			if (nearestItem)
			{
				await this.$store.dispatch(`${Model.CheckList}/update`, {
					id: nearestItem.id,
					fields: {
						groupMode: {
							active: true,
							selected: true,
						},
					},
				});

				setTimeout(() => {
					this.showItemPanel(nearestItem.id);
				}, 0);
			}

			allSelectedItems.forEach((item: CheckListModel) => {
				this.hideItem(item.id);
			});

			const messageKey = (
				allSelectedItems.length > 1
					? 'TASKS_V2_CHECK_LIST_ITEM_REMOVE_BALLOON_CHILDREN'
					: 'TASKS_V2_CHECK_LIST_ITEM_REMOVE_BALLOON_CHILD'
			);

			const notifier = new CheckListNotifier({
				content: this.loc(messageKey),
			});
			notifier.subscribeOnce('complete', (baseEvent: BaseEvent) => {
				const timerHasEnded = baseEvent.getData();
				allSelectedItems.forEach((item: CheckListModel) => {
					if (timerHasEnded)
					{
						this.removeItem(item.id);
					}
					else
					{
						this.showItem(item.id);
					}

					this.itemsToDelete = this.itemsToDelete.filter((id) => id !== item.id);
				});
				if (timerHasEnded)
				{
					if (nearestItem && !this.itemsToDelete.includes(nearestItem.id))
					{
						this.showItemPanel(nearestItem.id);
					}
					else
					{
						this.cancelGroupMode();
					}
				}
				else
				{
					this.showItemPanel(this.item.id);
				}

				this.unfreeze();
			});

			notifier.showBalloonWithTimer();
		},
		handleToggleIsComplete(itemId: number | string): void
		{
			this.syncParentCompletionState(itemId);
		},
		handleFocus(itemId: number | string): void
		{
			this.showItemPanel(itemId);
		},
		handleBlur(itemId: number | string): void
		{
			this.itemId = itemId;

			if (this.isItemPanelFreeze === false)
			{
				this.hideItemPanel(itemId);
			}
		},
		handleEmptyBlur(itemId: number | string): void
		{
			this.itemId = itemId;

			if (this.item.parentId === 0)
			{
				this.setDefaultCheckListTitle(itemId);

				return;
			}

			if (this.isItemPanelFreeze === false)
			{
				this.removeItem(itemId);
			}
		},
		handleGroupMode(itemId: number | string): void
		{
			this.itemId = itemId;

			const firstChild = this.getFirstChild();
			if (!firstChild)
			{
				return;
			}

			this.activateGroupMode(itemId);
			this.showItemPanel(firstChild.id);
		},
		handleGroupModeSelect(itemId: number | string): void
		{
			this.itemId = itemId;

			if (this.itemGroupModeSelected)
			{
				this.showItemPanel(itemId);
			}
			else
			{
				this.showItemPanelOnNearestSelectedItem(itemId);
			}
		},
		showItemPanel(itemId: number | string): void
		{
			this.itemId = itemId;

			this.itemPanelIsShown = true;

			if (!this.listShownItemPanels.includes(itemId))
			{
				this.listShownItemPanels = [...this.listShownItemPanels, itemId];
			}

			void this.$nextTick(() => this.updatePanelPosition());
		},
		hideItemPanel(itemId: number | string): void
		{
			this.itemPanelIsShown = false;

			if (this.hasActiveGroupMode() && this.getAllSelectedItems().length === 0)
			{
				this.deactivateGroupMode();
			}

			this.listShownItemPanels = this.listShownItemPanels.filter((id) => id !== itemId);

			this.isItemPanelFreeze = false;
		},
		showItemPanelOnNearestSelectedItem(itemId: number | string): void
		{
			// eslint-disable-next-line no-lonely-if
			const nearestSelectedItem = this.findNearestItem(true);
			if (nearestSelectedItem)
			{
				this.showItemPanel(nearestSelectedItem.id);
			}
			else
			{
				this.hideItemPanel(itemId);
			}
		},
		updatePanelPosition()
		{
			if (this.itemPanelIsShown === false)
			{
				return;
			}

			const itemRef = this.$refs.list.querySelector([`[data-id="${this.item.id}"]`]);

			const panelRect = Dom.getPosition(this.$refs.panel.$el);
			const itemRect = Dom.getRelativePosition(itemRef, this.$refs.list);
			const isParentItem = (this.item.parentId === 0);

			const paddingOffset = 24;
			const panelWidth = panelRect.width === 0 ? 304 : panelRect.width;

			const top = itemRect.top - 10;

			if (isParentItem)
			{
				const left = itemRect.width - panelWidth - (paddingOffset * 2) - 80;
				const display = top > -30 && top < this.itemPanelTopLimit ? 'flex' : 'none';

				this.itemPanelStyles = {
					top: `${top}px`,
					left: `${left}px`,
					display,
				};
			}
			else
			{
				const left = itemRect.width - panelWidth - paddingOffset;
				const display = top > 40 && top < this.itemPanelTopLimit ? 'flex' : 'none';

				this.itemPanelStyles = {
					top: `${top}px`,
					left: `${left}px`,
					display,
				};
			}
		},
		handlePanelAction({ action, node }: {action: string, node: HTMLElement}): void
		{
			const actionHandlers = {
				[PanelAction.SetImportant]: (n) => this.setImportant(n),
				[PanelAction.AttachFile]: (n) => this.attachFile(n),
				[PanelAction.MoveRight]: (n) => this.handleMoveRight(n),
				[PanelAction.MoveLeft]: (n) => this.handleMoveLeft(n),
				[PanelAction.AssignAccomplice]: (n) => {
					if (!this.isItemPanelFreeze)
					{
						this.showParticipantDialog(n, 'accomplices');
					}
				},
				[PanelAction.AssignAuditor]: (n) => {
					if (!this.isItemPanelFreeze)
					{
						this.showParticipantDialog(n, 'auditors');
					}
				},
				[PanelAction.Forward]: (n) => this.forward(n),
				[PanelAction.Delete]: (n) => this.delete(n),
				[PanelAction.Cancel]: (n) => this.cancelGroupMode(n),
			};

			actionHandlers[action]?.(node);
		},
		setImportant(): void
		{
			if (this.itemGroupModeSelected)
			{
				const updates = this.getAllSelectedItems()
					.map((item: CheckListModel) => ({
						...item,
						isImportant: !item.isImportant,
					}));

				this.$store.dispatch(`${Model.CheckList}/upsertMany`, updates);
			}
			else
			{
				this.$store.dispatch(`${Model.CheckList}/update`, {
					id: this.item.id,
					fields: { isImportant: !this.item.isImportant },
				});
			}

			this.checkListWasUpdated = true;
		},
		attachFile(node: HTMLElement): void
		{
			this.isItemPanelFreeze = true;

			fileService.get(this.item.id, EntityTypes.CheckListItem).browse({
				bindElement: node,
			});

			fileService.get(this.item.id, EntityTypes.CheckListItem).subscribeOnce('onFileComplete', () => {
				this.isItemPanelFreeze = false;

				this.focusToItem(this.item.id);
			});
		},
		handleMoveRight(): void
		{
			if (this.itemGroupModeSelected)
			{
				this.getAllSelectedItems()
					.sort((a: CheckListModel, b: CheckListModel) => a.sortIndex - b.sortIndex)
					.forEach((item: CheckListModel) => {
						this.moveRight(item);
					});
			}
			else
			{
				this.moveRight(this.item);
			}
		},
		moveRight(item: CheckListModel): void
		{
			if (item.parentId === 0 || this.getItemLevel(item) > 5)
			{
				return;
			}

			const siblings = this.checkLists
				.filter((sibling: CheckListModel) => sibling.parentId === item.parentId)
				.sort((a: CheckListModel, b: CheckListModel) => (a.sortIndex || 0) - (b.sortIndex || 0));

			const currentIndex = siblings.findIndex((sibling: CheckListModel) => sibling.id === item.id);
			if (currentIndex <= 0)
			{
				return;
			}

			let newParent = null;
			for (let i = currentIndex - 1; i >= 0; i--)
			{
				const candidate = siblings[i];
				if (!this.isItemDescendant(candidate, item))
				{
					newParent = candidate;
					break;
				}
			}

			if (!newParent)
			{
				return;
			}

			const newParentChildren = this.checkLists
				.filter((child: CheckListModel) => child.parentId === newParent.id)
				.sort((a: CheckListModel, b: CheckListModel) => a.sortIndex - b.sortIndex);

			const updates = siblings
				.filter((sibling, index) => index > currentIndex)
				.map((sibling) => ({
					...sibling,
					sortIndex: sibling.sortIndex - 1,
				}));

			updates.push({
				...item,
				parentId: newParent.id,
				parentNodeId: newParent.nodeId,
				sortIndex: newParentChildren.length > 0
					? newParentChildren[newParentChildren.length - 1].sortIndex + 1
					: 0,
			});

			this.$store.dispatch(`${Model.CheckList}/upsertMany`, updates);
			this.checkListWasUpdated = true;

			if (!item.groupMode?.active)
			{
				this.focusToItem(item.id);
			}
		},
		handleMoveLeft(): void
		{
			if (this.itemGroupModeSelected)
			{
				this.getAllSelectedItems()
					.sort((a: CheckListModel, b: CheckListModel) => b.sortIndex - a.sortIndex)
					.forEach((item: CheckListModel) => {
						this.moveLeft(item);
					});
			}
			else
			{
				this.moveLeft(this.item);
			}
		},
		moveLeft(item: CheckListModel): void
		{
			if (item.parentId === 0 || this.getItemLevel(item) <= 1)
			{
				return;
			}

			const currentParent = this.checkLists.find((parent: CheckListModel) => parent.id === item.parentId);
			if (!currentParent)
			{
				return;
			}

			const newParentId = currentParent.parentId || 0;
			const newSiblings = this.checkLists
				.filter((sibling: CheckListModel) => sibling.parentId === newParentId)
				.sort((a: CheckListModel, b: CheckListModel) => a.sortIndex - b.sortIndex);

			const parentInNewListIndex = newSiblings
				.findIndex((sibling: CheckListModel) => sibling.id === currentParent.id);

			const currentSiblingsUpdates = this.checkLists
				.filter((sibling: CheckListModel) => (
					sibling.parentId === item.parentId
					&& sibling.sortIndex > item.sortIndex
				))
				.map((sibling: CheckListModel) => ({
					...sibling,
					sortIndex: sibling.sortIndex - 1,
				}));

			let newSortIndex = 0;
			if (
				parentInNewListIndex === -1
				|| parentInNewListIndex === newSiblings.length - 1
			)
			{
				newSortIndex = newSiblings.length > 0 ? newSiblings[newSiblings.length - 1].sortIndex + 1 : 0;
			}
			else
			{
				newSortIndex = newSiblings[parentInNewListIndex].sortIndex + 1;

				const shiftUpdates = newSiblings
					.filter((sibling: CheckListModel) => sibling.sortIndex >= newSortIndex)
					.map((sibling: CheckListModel) => ({
						...sibling,
						sortIndex: sibling.sortIndex + 1,
					}));

				currentSiblingsUpdates.push(...shiftUpdates);
			}

			const movedItemUpdate = {
				...item,
				parentId: newParentId,
				parentNodeId: currentParent.parentNodeId || null,
				sortIndex: newSortIndex,
			};

			const updates = [...currentSiblingsUpdates, movedItemUpdate];
			this.$store.dispatch(`${Model.CheckList}/upsertMany`, updates);

			this.checkListWasUpdated = true;

			if (!item.groupMode?.active)
			{
				this.focusToItem(item.id);
			}
		},
		isItemDescendant(potentialAncestor: CheckListModel, item: CheckListModel): boolean
		{
			if (item.parentId === potentialAncestor.id)
			{
				return true;
			}

			if (item.parentId === 0)
			{
				return false;
			}

			const parent = this.checkLists.find((i: CheckListModel) => i.id === item.parentId);
			if (!parent)
			{
				return false;
			}

			return this.isItemDescendant(potentialAncestor, parent);
		},
		assignAccomplice(node: HTMLElement): void
		{
			this.showParticipantDialog(node, 'accomplices');
		},
		assignAuditor(node: HTMLElement): void
		{
			this.showParticipantDialog(node, 'auditors');
		},
		async forward(node: HTMLElement): Promise<void>
		{
			if (this.hasFewParentCheckLists)
			{
				this.showForwardMenu(node);
			}
			else
			{
				this.hideItemPanel();

				void this.forwardToNewChecklist();
			}

			this.checkListWasUpdated = true;
		},
		async forwardToNewChecklist(): Promise<void>
		{
			const newParentId = await this.addCheckList(true);

			void this.forwardToChecklist(newParentId);
		},
		async forwardToChecklist(parentId: number | string): Promise<void>
		{
			if (this.itemGroupModeSelected)
			{
				const allSelectedItems = this.getAllSelectedItems();
				const nearestItem = this.findNearestItem(false, allSelectedItems);
				if (nearestItem)
				{
					this.showItemPanel(nearestItem.id);
				}
				else
				{
					this.cancelGroupMode();
				}

				const allSelectedWithChildren = this.getAllSelectedItemsWithChildren();

				const selectedItemsIds = new Set(allSelectedItems.map((item: CheckListModel) => item.id));

				const updates = [];

				allSelectedItems.forEach((item: CheckListModel) => {
					const shouldUpdateParentId = !selectedItemsIds.has(item.parentId);
					updates.push({
						...item,
						parentId: shouldUpdateParentId ? parentId : item.parentId,
						groupMode: {
							active: false,
							selected: false,
						},
					});
				});

				allSelectedWithChildren.forEach((item: CheckListModel) => {
					if (!selectedItemsIds.has(item.id))
					{
						updates.push({
							...item,
							groupMode: {
								active: false,
								selected: false,
							},
						});
					}
				});

				await this.$store.dispatch(`${Model.CheckList}/upsertMany`, updates);

				if (nearestItem)
				{
					void this.$store.dispatch(`${Model.CheckList}/update`, {
						id: nearestItem.id,
						fields: {
							groupMode: {
								active: true,
								selected: true,
							},
						},
					});
				}
			}
			else
			{
				this.$store.dispatch(`${Model.CheckList}/update`, {
					id: this.item.id,
					fields: { parentId },
				});
			}
		},
		delete(): void
		{
			if (this.itemGroupModeSelected)
			{
				void this.handleGroupRemove(this.item.id);
			}
			else
			{
				this.hideItemPanel();
				this.handleRemove(this.item.id);
			}
		},
		cancelGroupMode(): void
		{
			this.deactivateGroupMode();
			this.hideItemPanel();
		},
		showParticipantDialog(targetNode: HTMLElement, type: 'accomplices' | 'auditors'): void
		{
			this.isItemPanelFreeze = true;

			const itemId = this.item.id;
			const preselected = this.preselectedParticipants(type);

			this.selectors ??= {};

			const selectorId = `${type}-${itemId}`;

			this.selectors[selectorId] ??= new UserSelectorDialog({
				taskId: this.taskId,
				preselected,
				dialogOptions: {
					...participantMeta.dialogOptions(
						this.taskId,
						`check-list-${selectorId}`,
					),
					popupOptions: {
						events: {
							onShow: (baseEvent: BaseEvent) => {
								const popup = baseEvent.getTarget();
								const popupWidth = popup.getPopupContainer().offsetWidth;
								const targetNodeWidth = 10;

								const offsetLeft = targetNodeWidth - (popupWidth / 2);
								const angleShift = Popup.getOption('angleLeftOffset') - Popup.getOption('angleMinTop');

								popup.setAngle({ offset: popupWidth / 2 - angleShift });
								popup.setOffset({ offsetLeft: offsetLeft + Popup.getOption('angleLeftOffset') });
							},
							onClose: () => {
								const users = this.selectors[selectorId].getDialog()
									.getSelectedItems().map((item: Item) => ({
										id: item.getId(),
										name: item.getTitle(),
										image: item.getAvatar(),
										type: item.getEntityType(),
									}));

								this.saveParticipants(itemId, type, users);
							},
						},
					},
				},
				events: {
					onHide: () => {
						this.isItemPanelFreeze = false;

						if (!this.itemGroupModeSelected)
						{
							this.focusToItem(itemId);
						}

						this.updatePanelPosition();
					},
				},
			});

			this.selectors[selectorId].show(targetNode);
		},
		preselectedParticipants(type: 'accomplices' | 'auditors'): [string, number][]
		{
			switch (type)
			{
				case 'accomplices':
					return this.item.accomplices.map((user: UserModel) => ['user', user.id]);
				case 'auditors':
					return this.item.auditors.map((user: UserModel) => ['user', user.id]);
				default:
					return [];
			}
		},
		saveParticipants(id: number | string, type: 'accomplices' | 'auditors', users: UserModel[]): void
		{
			if (this.itemGroupModeSelected)
			{
				const updates = this.getAllSelectedItems()
					.map((item: CheckListModel) => ({
						...item,
						[type]: users,
					}));

				this.$store.dispatch(`${Model.CheckList}/upsertMany`, updates);
			}
			else
			{
				this.$store.dispatch(`${Model.CheckList}/update`, {
					id,
					fields: { [type]: users },
				});
			}

			const ids = users.map((user: UserModel) => user.id);
			const fields = {
				[`${type}Ids`]: ids,
			};

			this.$store.dispatch(`${Model.Tasks}/update`, {
				id: this.taskId,
				fields,
			});
		},
		syncParentCompletionState(itemId: number | string, parentItemId?: number | string): void
		{
			const changedItem = this.checkLists.find((item: CheckListModel) => item.id === itemId);
			if ((!changedItem || !changedItem.parentId) && !parentItemId)
			{
				return;
			}

			const parentId = parentItemId || changedItem.parentId;

			const parentItem = this.checkLists.find((item: CheckListModel) => item.id === parentId);
			if (!parentItem)
			{
				return;
			}

			const childrenItems = this.checkLists.filter((item: CheckListModel) => item.parentId === parentItem.id);
			const isEmptyParent = (childrenItems.length === 0);

			const allChildrenCompleted = childrenItems.every((child: CheckListModel) => child.isComplete);
			const someChildrenIncomplete = childrenItems.some((child: CheckListModel) => !child.isComplete);

			const shouldUpdateParent = (
				isEmptyParent
				|| (allChildrenCompleted && !parentItem.isComplete)
				|| (someChildrenIncomplete && parentItem.isComplete)
			);
			if (!shouldUpdateParent)
			{
				return;
			}

			this.$store.dispatch(`${Model.CheckList}/update`, {
				id: parentItem.id,
				fields: {
					isComplete: allChildrenCompleted && !isEmptyParent,
				},
			});

			if (parentItem.parentId)
			{
				this.syncParentCompletionState(parentItem.id);
			}
		},
		activateGroupMode(parentItemId: number | string): void
		{
			this.itemId = parentItemId;

			const updates = this.getAllChildren()
				.map((item: CheckListModel, index: number) => ({
					...item,
					groupMode: {
						active: true,
						selected: index === 0,
					},
				}));

			updates.push({
				...this.item,
				groupMode: {
					active: true,
					selected: false,
				},
			});

			this.$store.dispatch(`${Model.CheckList}/upsertMany`, updates);
		},
		deactivateGroupMode(): void
		{
			const updates = this.getAllGroupModeItems()
				.map((item: CheckListModel) => ({
					...item,
					groupMode: {
						active: false,
						selected: false,
					},
				}));

			this.$store.dispatch(`${Model.CheckList}/upsertMany`, updates);
		},
		getRootParent(item: CheckListModel): ?CheckListModel
		{
			if (!item || item.parentId === 0)
			{
				return item || null;
			}

			const parentItem = this.checkLists.find((parent: CheckListModel) => parent.id === item.parentId);
			if (!parentItem)
			{
				return null;
			}

			return this.getRootParent(parentItem);
		},
		getAllChildren(): CheckListModel[]
		{
			if (!this.item)
			{
				return [];
			}

			const getAllChildren = (parentId: number | string): CheckListModel[] => {
				const directChildren = this.checkLists
					.filter((item: CheckListModel) => item.parentId === parentId)
					.sort((a: CheckListModel, b: CheckListModel) => a.sortIndex - b.sortIndex);
				let allChildren = [...directChildren];

				directChildren.forEach((child: CheckListModel) => {
					allChildren = [...allChildren, ...getAllChildren(child.id)];
				});

				return allChildren;
			};

			return getAllChildren(this.item.id);
		},
		getFirstChild(): ?CheckListModel
		{
			if (!this.item)
			{
				return null;
			}

			const children = this.checkLists
				.filter((item: CheckListModel) => item.parentId === this.item.id)
				.sort((a: CheckListModel, b: CheckListModel) => a.sortIndex - b.sortIndex);

			return children[0] || null;
		},
		findNearestItem(selected: boolean, excludeChildrenOf: CheckListModel[] = []): ?CheckListModel
		{
			if (!this.item)
			{
				return null;
			}

			const rootParent = this.getRootParent(this.item);
			if (!rootParent)
			{
				return null;
			}

			const currentSortIndex = this.item.sortIndex;

			const excludedParentIds = new Set(excludeChildrenOf.map((item: CheckListModel) => item.id));

			const eligibleItems = this.checkLists
				.sort((a: CheckListModel, b: CheckListModel) => a.sortIndex - b.sortIndex)
				.filter((item: CheckListModel) => {
					const isChildOfExcluded = excludedParentIds.has(item.parentId);

					return (
						item.id !== this.item.id
						&& item.parentId !== 0
						&& item.groupMode?.selected === selected
						&& this.getRootParent(item)?.id === rootParent.id
						&& !isChildOfExcluded
					);
				});
			if (eligibleItems.length === 0)
			{
				return null;
			}

			return eligibleItems.reduce((nearest, item) => {
				return (
					item.sortIndex > currentSortIndex
					&& (
						item.sortIndex < nearest.sortIndex
						|| nearest.sortIndex <= currentSortIndex
					)
				) ? item : nearest;
			});
		},
		getAllGroupModeItems(): CheckListModel[]
		{
			return this.checkLists.filter((item: CheckListModel) => {
				return item.groupMode?.active === true;
			});
		},
		getAllSelectedItems(): CheckListModel[]
		{
			return this.checkLists.filter((item: CheckListModel) => {
				return (item.parentId !== 0 && item.groupMode?.selected === true);
			});
		},
		getAllSelectedItemsWithChildren(): CheckListModel[]
		{
			const selectedItems = this.checkLists.filter((item: CheckListModel) => {
				return (item.parentId !== 0 && item.groupMode?.selected === true);
			});

			const getChildren = (parentIds: (string | number)[]): CheckListModel[] => {
				const children = this.checkLists.filter((item: CheckListModel) => parentIds.includes(item.parentId));

				return (
					children.length > 0
						? [...children, ...getChildren(children.map((child) => child.id))]
						: children
				);
			};

			return [
				...selectedItems,
				...getChildren(selectedItems.map((item: CheckListModel) => item.id)),
			];
		},
		hasActiveGroupMode(): boolean
		{
			return this.getAllGroupModeItems().length > 0;
		},
		handleShowPopup(baseEvent: BaseEvent): void
		{
			const [popup] = baseEvent.getCompatData();

			this.shownPopups.add(popup.getId());

			this.freeze();
		},
		handleClosePopup(baseEvent: BaseEvent): void
		{
			const [popup] = baseEvent.getCompatData();

			this.shownPopups.delete(popup.getId());

			this.unfreeze();
		},
		freeze()
		{
			this.$refs.popupComponent?.freeze();
		},
		unfreeze()
		{
			if (
				this.shownPopups.size === 0
				&& this.itemsToDelete.length === 0
			)
			{
				this.$refs.popupComponent?.unfreeze();
			}
		},
		setDefaultCheckListTitle(itemId: number | string): void
		{
			this.$store.dispatch(`${Model.CheckList}/update`, {
				id: itemId,
				fields: {
					title: this.loc(
						'TASKS_V2_CHECK_LIST_TITLE_NUMBER',
						{ '#number#': this.getCheckListsNumber() },
					),
				},
			});
		},
	},
};
