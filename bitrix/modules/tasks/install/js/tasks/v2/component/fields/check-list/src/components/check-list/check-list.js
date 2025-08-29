import { Dom, Event, Text, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { Popup } from 'main.popup';

import { Item } from 'ui.entity-selector';
import type { MenuItemOptions, MenuOptions } from 'ui.system.menu';
import { Button as UiButton, AirButtonStyle, ButtonSize, ButtonIcon } from 'ui.vue3.components.button';
import { BIcon } from 'ui.icon-set.api.vue';
import { BMenu } from 'ui.vue3.components.menu';
import { Outline } from 'ui.icon-set.api.core';

import { Model } from 'tasks.v2.const';
import { participantMeta } from 'tasks.v2.component.elements.participant-list';
import { Core } from 'tasks.v2.core';
import { EntitySelectorDialog } from 'tasks.v2.lib.entity-selector-dialog';
import { checkListService } from 'tasks.v2.provider.service.check-list-service';
import { EntityTypes, fileService } from 'tasks.v2.provider.service.file-service';

import type { UserModel } from 'tasks.v2.model.users';
import type { CheckListModel } from 'tasks.v2.model.check-list';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { CheckListStub } from './check-list-stub';
import { CheckListPopup } from '../check-list-popup/check-list-popup';
import { CheckListSheet } from '../check-list-sheet/check-list-sheet';
import { CheckListList } from '../check-list-list/check-list-list';
import { CheckListWidget } from '../check-list-widget/check-list-widget';
import { CheckListItemPanel } from '../check-list-item-panel/check-list-item-panel';

import { CheckListManager } from '../../lib/check-list-manager';
import { CheckListNotifier } from '../../lib/check-list-notifier';

import {
	PanelAction,
	type VisibleActions,
	type ActiveActions,
} from '../check-list-item-panel/check-list-item-panel-meta';

import './check-list.css';

// @vue/component
export const CheckList = {
	name: 'TaskCheckList',
	components: {
		CheckListWidget,
		CheckListItemPanel,
		CheckListStub,
		UiButton,
		BIcon,
		BMenu,
	},
	provide(): Object
	{
		return {
			setItemsRef: this.setItemsRef,
			getItemsRef: this.getItemsRef,
		};
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		isAutonomous: {
			type: Boolean,
			default: false,
		},
		isPreview: {
			type: Boolean,
			default: false,
		},
		isComponentShown: {
			type: Boolean,
			default: true,
		},
		checkListId: {
			type: [Number, String],
			default: 0,
		},
		isShown: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['show', 'close', 'resize', 'open'],
	setup(): Object
	{
		return {
			resizeObserver: null,
			AirButtonStyle,
			ButtonSize,
			ButtonIcon,
			Outline,
		};
	},
	data(): Object
	{
		return {
			checkListManager: null,
			itemPanelIsShown: false,
			checkListWasUpdated: false,
			itemId: null,
			itemPanelStyles: {
				top: '0',
				display: 'flex',
			},
			isItemPanelFreeze: false,
			itemPanelTopOffset: this.isAutonomous ? 5 : 2,
			itemPanelTopLimit: this.isAutonomous ? 450 : 700,
			itemsRefs: {},
			isForwardMenuShown: false,
			forwardMenuSectionCode: 'createSection',
			forwardBindElement: null,
			itemsToDelete: [],
			collapsedItems: new Map(),
			shownPopups: new Set(),
		};
	},
	computed: {
		componentName(): Object
		{
			if (this.isAutonomous)
			{
				return CheckListPopup;
			}
			else if (this.isPreview)
			{
				return CheckListList;
			}

			return CheckListSheet;
		},
		componentShown(): boolean
		{
			if (this.isPreview)
			{
				return this.isComponentShown;
			}

			return true;
		},
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

			const itemLevel = this.checkListManager.getItemLevel(this.item);
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
						if (this.itemGroupModeSelected)
						{
							void this.forwardGroupItemsToChecklist(checkList.id);
						}
						else
						{
							this.forwardToChecklist(checkList.id);
						}
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
		contextClass(): string
		{
			if (this.isPreview)
			{
				return '--preview';
			}

			return this.isAutonomous ? '--popup' : '--sheet';
		},
	},
	watch: {
		async titleFieldOffsetHeight(): Promise<void>
		{
			if (!this.$refs.popupComponent)
			{
				return;
			}

			await this.$nextTick();
			this.resize();
		},
		parentCheckLists(): void
		{
			if (this.isPreview)
			{
				this.unCollapseFirstParent();
			}
		},
		componentShown(value: boolean): void
		{
			if (!this.isPreview)
			{
				return;
			}

			if (value)
			{
				this.subscribeToEvents();
			}
			else
			{
				this.unsubscribeFromEvents();
			}
		},
	},
	created(): void
	{
		this.checkListManager = new CheckListManager({
			computed: {
				checkLists: () => this.checkLists,
			},
		});
	},
	mounted(): void
	{
		if (this.isAutonomous || this.isPreview)
		{
			this.subscribeToEvents();
		}
	},
	beforeUnmount(): void
	{
		if (this.isAutonomous || this.isPreview)
		{
			this.unsubscribeFromEvents();
		}
	},
	methods: {
		subscribeToEvents(): void
		{
			Event.bind(this.$refs.list, 'scroll', this.handleScroll);

			EventEmitter.subscribe('BX.Main.Popup:onInit', this.handleInitPopup);
			EventEmitter.subscribe('BX.Main.Popup:onShow', this.handleShowPopup);
			EventEmitter.subscribe('BX.Main.Popup:onClose', this.handleClosePopup);
		},
		unsubscribeFromEvents(): void
		{
			Event.unbind(this.$refs.list, 'scroll', this.handleScroll);

			EventEmitter.unsubscribe('BX.Main.Popup:onInit', this.handleInitPopup);
			EventEmitter.unsubscribe('BX.Main.Popup:onShow', this.handleShowPopup);
			EventEmitter.unsubscribe('BX.Main.Popup:onClose', this.handleClosePopup);
		},
		handleBeforeCreated(): void
		{
			if (this.isPreview)
			{
				this.unCollapseFirstParent();
			}
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
		handleScroll(): void
		{
			this.isForwardMenuShown = false;

			this.updatePanelPosition();
		},
		handleShow(data): void
		{
			this.$emit('show', data);
		},
		async handleClose(): void
		{
			this.cancelGroupMode();

			this.$emit('close');

			await this.saveCheckList();
		},
		handleIsShown(isShown: boolean): void
		{
			if (isShown)
			{
				this.subscribeToEvents();
			}
			else
			{
				this.unsubscribeFromEvents();
			}
		},
		handleInitPopup(baseEvent: BaseEvent): void
		{
			const data = baseEvent.getCompatData();

			const bindElement = data[1];
			const params = data[2];

			if (Type.isDomNode(bindElement))
			{
				if (this.$refs.list?.contains(bindElement))
				{
					params.targetContainer = this.$refs.list;
				}
				else
				{
					params.targetContainer = document.body;
				}
			}
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
		async handleGroupRemove(itemId: number | string): Promise<void>
		{
			this.itemId = itemId;

			this.freeze();

			this.itemsToDelete = [...this.itemsToDelete, itemId];

			this.hideItemPanel(itemId);

			const allSelectedItems = this.checkListManager.getAllSelectedItems();

			const nearestItem = this.checkListManager.findNearestItem(this.item, false);
			if (nearestItem)
			{
				await this.updateCheckList(nearestItem.id, {
					groupMode: {
						active: true,
						selected: true,
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

			const firstChild = this.checkListManager.getFirstChild(itemId);
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
		handlePanelAction({ action, node }: {action: string, node: HTMLElement}): void
		{
			const actionHandlers = {
				[PanelAction.SetImportant]: (n) => this.setImportant(n),
				[PanelAction.AttachFile]: (n) => this.attachFile(n),
				[PanelAction.MoveRight]: (n) => this.moveGroupToRight(n),
				[PanelAction.MoveLeft]: (n) => this.moveGroupToLeft(n),
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
		handleOpenCheckList(checkListId: number | string): void
		{
			void this.updateCheckList(checkListId, {
				collapsed: false,
				previewCollapsed: false,
			});

			this.$emit('open', checkListId);
		},
		updateCheckList(id: number | string, fields: Partial<CheckListModel>): Promise<void>
		{
			return this.$store.dispatch(`${Model.CheckList}/update`, { id, fields });
		},
		updateTask(fields: Partial<TaskModel>): Promise<void>
		{
			return this.$store.dispatch(`${Model.Tasks}/update`, {
				id: this.taskId,
				fields,
			});
		},
		upsertCheckLists(items: CheckListModel[]): Promise<void>
		{
			return this.$store.dispatch(`${Model.CheckList}/upsertMany`, items);
		},

		insertCheckList(item: CheckListModel): Promise<void>
		{
			return this.$store.dispatch(`${Model.CheckList}/insert`, item);
		},

		insertManyCheckLists(items: CheckListModel[]): Promise<void>
		{
			return this.$store.dispatch(`${Model.CheckList}/insertMany`, items);
		},

		deleteCheckList(id: number | string): Promise<void>
		{
			return this.$store.dispatch(`${Model.CheckList}/delete`, id);
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

			await this.insertManyCheckLists(items);
			void this.updateTask({ checklist: [...this.task.checklist, parentId, childId] });

			return parentId;
		},
		async addFastCheckList(): void
		{
			const checkListId = await this.addCheckList();

			this.handleOpenCheckList(checkListId);
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
			void this.updateCheckList(itemId, { hidden: false });

			const children = this.checkListManager.getChildren(itemId);
			if (children.length > 0)
			{
				children.forEach((child: CheckListModel) => {
					this.showItem(child.id);
				});
			}
		},
		hideItem(itemId: number | string): void
		{
			void this.updateCheckList(itemId, { hidden: true });

			const children = this.checkListManager.getChildren(itemId);
			if (children.length > 0)
			{
				children.forEach((child: CheckListModel) => {
					this.hideItem(child.id);
				});
			}
		},
		addItem({ id, sort }: {id: number | string, sort: number}): void
		{
			if (this.hasActiveGroupMode())
			{
				return;
			}

			this.itemId = id;

			const childId = Text.getRandom();
			const parentId = this.item.parentId;

			this.resortItemsAfterIndex(parentId, sort);

			void this.insertCheckList({
				id: childId,
				nodeId: childId,
				parentId,
				sortIndex: sort,
			});
			void this.updateTask({ checklist: [...this.task.checklist, childId] });

			this.syncParentCompletionState(childId);
		},
		addItemFromBtn(checkListId: number | string): void
		{
			if (this.isPreview)
			{
				this.handleOpenCheckList(checkListId);

				return;
			}

			if (this.hasActiveGroupMode())
			{
				return;
			}

			const childId = Text.getRandom();
			const sortIndex = this.checkListManager.getChildren(checkListId).length;

			void this.insertCheckList({
				id: childId,
				nodeId: childId,
				parentId: checkListId,
				sortIndex,
			});
			void this.updateTask({ checklist: [...this.task.checklist, childId] });

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
			const children = this.checkListManager.getChildren(id);

			if (children.length > 0)
			{
				children.forEach((child: CheckListModel) => {
					this.removeItem(child.id, false);
				});
			}

			void this.updateTask({ checklist: this.task.checklist.filter((itemId) => itemId !== id) });
			void this.deleteCheckList(id);

			if (isRootCall)
			{
				this.resortItemsOnLevel(parentId);
			}

			this.syncParentCompletionState(id, parentId);

			fileService.delete(id, EntityTypes.CheckListItem);
		},
		resortItemsAfterIndex(parentId: number | string, sortIndex: number): void
		{
			this.checkListManager.resortItemsAfterIndex(
				parentId,
				sortIndex,
				(updates: CheckListModel[]) => {
					void this.upsertCheckLists(updates);
				},
			);
		},
		resortItemsOnLevel(parentId: number | string): void
		{
			this.checkListManager.resortItemsOnLevel(
				parentId,
				(updates: CheckListModel[]) => this.upsertCheckLists(updates),
			);
		},
		syncParentCompletionState(itemId: number | string, parentId: number | string): void
		{
			this.checkListManager.syncParentCompletionState(
				itemId,
				(id: string | number, fields: Partial<CheckListModel>) => this.updateCheckList(id, fields),
				parentId,
			);
		},
		toggleCompleted({ itemId, collapsed }: { itemId: number | string, collapsed: boolean }): void
		{
			this.itemId = itemId;

			this.checkListManager.getAllCompletedChildrenChildren(itemId)
				.forEach((item: CheckListModel) => {
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
		showItemPanel(itemId: number | string): void
		{
			if (this.isPreview)
			{
				return;
			}

			this.itemId = itemId;

			this.itemPanelIsShown = true;

			void this.updateCheckList(itemId, { panelIsShown: true });

			void this.$nextTick(() => this.updatePanelPosition());
		},
		hideItemPanel(itemId: number | string): void
		{
			if (this.isPreview)
			{
				return;
			}

			this.itemPanelIsShown = false;

			if (this.hasActiveGroupMode() && this.checkListManager.getAllSelectedItems().length === 0)
			{
				this.deactivateGroupMode();
			}

			const item = this.checkListManager.getItem(itemId);
			if (item)
			{
				void this.updateCheckList(itemId, { panelIsShown: false });
			}

			this.isItemPanelFreeze = false;
		},
		showItemPanelOnNearestSelectedItem(itemId: number | string): void
		{
			// eslint-disable-next-line no-lonely-if
			const nearestSelectedItem = this.checkListManager.findNearestItem(this.item, true);
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
			const listRect = Dom.getPosition(this.$refs.list);
			const itemRect = Dom.getRelativePosition(itemRef, this.$refs.list);
			const isParentItem = (this.item.parentId === 0);

			const paddingOffset = 18;
			const panelWidth = panelRect.width === 0 ? 304 : panelRect.width;

			const top = itemRect.top - 14;

			if (isParentItem)
			{
				const left = listRect.width - panelWidth - (paddingOffset * 2) - 80;
				const display = top > -30 && top < this.itemPanelTopLimit ? 'flex' : 'none';

				this.itemPanelStyles = {
					top: `${top}px`,
					left: `${left}px`,
					display,
				};
			}
			else
			{
				const left = listRect.width - panelWidth - paddingOffset;
				const display = top > 40 && top < this.itemPanelTopLimit ? 'flex' : 'none';

				this.itemPanelStyles = {
					top: `${top}px`,
					left: `${left}px`,
					display,
				};
			}
		},
		setImportant(): void
		{
			if (this.itemGroupModeSelected)
			{
				const updates = this.checkListManager.getAllSelectedItems()
					.map((item: CheckListModel) => ({
						...item,
						isImportant: !item.isImportant,
					}));

				void this.upsertCheckLists(updates);
			}
			else
			{
				void this.updateCheckList(this.item.id, { isImportant: !this.item.isImportant });
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

				this.checkListWasUpdated = true;
			});
		},
		moveGroupToRight(): void
		{
			if (this.itemGroupModeSelected)
			{
				this.checkListManager.getAllSelectedItems()
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
			this.checkListManager.moveRight(
				item,
				(updates: CheckListModel[]) => {
					void this.upsertCheckLists(updates);
					this.checkListWasUpdated = true;

					if (!item.groupMode?.active)
					{
						this.focusToItem(item.id);
					}
				},
			);
		},
		moveGroupToLeft(): void
		{
			if (this.itemGroupModeSelected)
			{
				this.checkListManager.getAllSelectedItems()
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
			this.checkListManager.moveLeft(
				item,
				(updates: CheckListModel[]) => {
					void this.upsertCheckLists(updates);
					this.checkListWasUpdated = true;

					if (!item.groupMode?.active)
					{
						this.focusToItem(item.id);
					}
				},
			);
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

			if (this.itemGroupModeSelected)
			{
				void this.forwardGroupItemsToChecklist(newParentId);
			}
			else
			{
				this.forwardToChecklist(newParentId);
			}
		},
		forwardToChecklist(checkListId: number | string): void
		{
			const finalSortIndex = this.checkListManager.getChildren(checkListId).length;

			void this.updateCheckList(this.item.id, {
				parentId: checkListId,
				sortIndex: finalSortIndex,
			});

			this.resortItemsOnLevel(checkListId);
			this.resortItemsOnLevel(this.item.parentId);
		},
		async forwardGroupItemsToChecklist(checkListId: number | string): Promise<void>
		{
			const finalSortIndex = this.checkListManager.getChildren(checkListId).length;

			const checkListIdsFromWhichWereForwarded = new Set();

			const allSelectedItems = this.checkListManager.getAllSelectedItems();
			const nearestItem = this.checkListManager.findNearestItem(this.item, false, allSelectedItems);
			if (nearestItem)
			{
				this.showItemPanel(nearestItem.id);
			}
			else
			{
				this.cancelGroupMode();
			}

			const allSelectedWithChildren = this.checkListManager.getAllSelectedItemsWithChildren();

			const selectedItemsIds = new Set(allSelectedItems.map((item: CheckListModel) => item.id));

			const updates = [];

			allSelectedItems.forEach((item: CheckListModel) => {
				const shouldUpdateParentId = !selectedItemsIds.has(item.parentId);

				checkListIdsFromWhichWereForwarded.add(item.parentId);

				updates.push({
					...item,
					parentId: shouldUpdateParentId ? checkListId : item.parentId,
					groupMode: {
						active: false,
						selected: false,
					},
					sortIndex: shouldUpdateParentId ? finalSortIndex : item.sortIndex,
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

			await this.upsertCheckLists(updates);

			if (nearestItem)
			{
				void this.updateCheckList(nearestItem.id, {
					groupMode: {
						active: true,
						selected: true,
					},
				});
			}

			this.resortItemsOnLevel(checkListId);
			checkListIdsFromWhichWereForwarded.forEach((id: number | string) => {
				this.resortItemsOnLevel(id);
			});
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
			const preselected = this.item[type].map((user: UserModel) => ['user', user.id]);

			this.selector ??= new EntitySelectorDialog({
				...participantMeta.dialogOptions(this.taskId, 'check-list'),
				preselectedItems: preselected,
				popupOptions: {
					events: {
						onShow: (baseEvent: BaseEvent): void => {
							const popup = baseEvent.getTarget();
							const popupWidth = popup.getPopupContainer().offsetWidth;
							const targetNodeWidth = 10;

							const offsetLeft = targetNodeWidth - (popupWidth / 2);
							const angleShift = Popup.getOption('angleLeftOffset') - Popup.getOption('angleMinTop');

							popup.setAngle({ offset: popupWidth / 2 - angleShift });
							popup.setOffset({ offsetLeft: offsetLeft + Popup.getOption('angleLeftOffset') });
						},
						onClose: (): void => {
							const users = this.selector.getSelectedItems().map((item: Item) => ({
								id: item.getId(),
								name: item.getTitle(),
								image: item.getAvatar(),
								type: item.getEntityType(),
							}));

							this.saveParticipants(this.selector.params.itemId, this.selector.params.type, users);
						},
					},
				},
				events: {
					onHide: (): void => {
						this.isItemPanelFreeze = false;

						if (!this.itemGroupModeSelected && this.item.id === this.selector.params.itemId)
						{
							this.focusToItem(this.selector.params.itemId);
						}

						this.updatePanelPosition();
					},
				},
			});

			this.selector.selectItemsByIds(preselected);
			this.selector.params = {
				itemId: this.item.id,
				type,
			};

			this.selector.showTo(targetNode);
		},
		saveParticipants(id: number | string, type: 'accomplices' | 'auditors', users: UserModel[]): void
		{
			if (this.itemGroupModeSelected)
			{
				const updates = this.checkListManager.getAllSelectedItems()
					.map((item: CheckListModel) => ({
						...item,
						[type]: users,
					}));

				void this.upsertCheckLists(updates);
			}
			else
			{
				void this.updateCheckList(id, {
					[type]: users,
				});
			}

			const ids = users.map((user: UserModel) => user.id);
			const fields = {
				[`${type}Ids`]: ids,
			};

			void this.updateTask(fields);
		},
		activateGroupMode(parentItemId: number | string): void
		{
			this.itemId = parentItemId;

			const updates = this.checkListManager.getAllChildren(parentItemId)
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

			void this.upsertCheckLists(updates);
		},
		deactivateGroupMode(): void
		{
			const updates = this.checkListManager.getAllGroupModeItems()
				.map((item: CheckListModel) => ({
					...item,
					groupMode: {
						active: false,
						selected: false,
					},
				}));

			void this.upsertCheckLists(updates);
		},
		hasActiveGroupMode(): boolean
		{
			return this.checkListManager.getAllGroupModeItems().length > 0;
		},
		freeze()
		{
			this.$refs.childComponent?.$refs?.childComponent?.freeze();
		},
		unfreeze()
		{
			if (
				this.shownPopups.size === 0
				&& this.itemsToDelete.length === 0
			)
			{
				this.$refs.childComponent?.$refs?.childComponent?.unfreeze();
			}
		},
		setDefaultCheckListTitle(itemId: number | string): void
		{
			void this.updateCheckList(itemId, {
				title: this.loc(
					'TASKS_V2_CHECK_LIST_TITLE_NUMBER',
					{ '#number#': this.getCheckListsNumber() },
				),
			});
		},
		unCollapseFirstParent(): void
		{
			const firstParent = this.parentCheckLists[0];

			if (firstParent.previewCollapsed === true)
			{
				void this.updateCheckList(firstParent.id, { previewCollapsed: false });
			}
		},
	},
	template: `
		<component
			v-if="componentShown"
			ref="childComponent"
			:is="componentName"
			:taskId="taskId"
			:isShown="isShown"
			@show="handleShow"
			@close="handleClose"
			@isShown="handleIsShown"
			@addFastCheckList="addFastCheckList"
			@resize="$emit('resize')"
		>
			<template v-slot:default="{ handleShow, handleClose }">
				<div ref="wrapper" class="tasks-check-list-wrapper" :class="contextClass">
					<div v-if="!isPreview" class="tasks-check-list-close-icon" :class="contextClass">
						<BIcon :name="Outline.CROSS_L" @click="handleClose"/>
					</div>
					<div ref="list" data-list class="tasks-check-list-content" :class="contextClass">
						<CheckListWidget
							v-show="!stub"
							:taskId="taskId"
							:checkListId="checkListId"
							:isPreview="isPreview"
							@beforeCreated="handleBeforeCreated"
							@update="handleUpdate"
							@toggleIsComplete="handleToggleIsComplete"
							@show="handleShow"
							@addItem="addItem"
							@addItemFromBtn="addItemFromBtn"
							@removeItem="handleRemove"
							@focus="handleFocus"
							@blur="handleBlur"
							@emptyBlur="handleEmptyBlur"
							@toggleCompleted="toggleCompleted"
							@startGroupMode="handleGroupMode"
							@toggleGroupModeSelected="handleGroupModeSelect"
							@openCheckList="handleOpenCheckList"
						/>
						<CheckListStub v-if="stub" @click="addCheckList" />
					</div>
					<div v-show="!stub && !isPreview" class="tasks-check-list-footer" :class="contextClass">
						<UiButton
							:text="loc('TASKS_V2_CHECK_LIST_NEW_BTN')"
							:size="ButtonSize.MEDIUM"
							:leftIcon="ButtonIcon.ADD"
							:style="AirButtonStyle.PLAIN_NO_ACCENT"
							@click="addCheckList"
						/>
						<UiButton
							:text="loc('TASKS_V2_CHECK_LIST_READY_BTN')"
							:size="ButtonSize.MEDIUM"
							@click="handleClose"
						/>
					</div>
					<CheckListItemPanel
						v-if="itemPanelIsShown && !isPreview"
						ref="panel"
						:style="itemPanelStyles"
						:visibleActions="visiblePanelActions"
						:disabledActions="disabledPanelActions"
						:activeActions="activePanelActions"
						@action="handlePanelAction"
					/>
					<BMenu
						v-if="isForwardMenuShown"
						:options="forwardMenuOptions"
						@close="isForwardMenuShown = false"
					/>
				</div>
			</template>
		</component>
	`,
};
