/* global Partial */

import { Dom, Event, Text, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { FocusNavigator, InteractivityChecker, LiveAnnouncer } from 'ui.a11y';

import { mapActions, mapGetters } from 'ui.vue3.vuex';
import { markRaw, BitrixVue, type BitrixVueComponentProps } from 'ui.vue3';
import { type MenuItemOptions, type MenuOptions } from 'ui.system.menu';
import { Button as UiButton, AirButtonStyle, ButtonSize, ButtonIcon } from 'ui.vue3.components.button';
import { BMenu } from 'ui.system.menu.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { EventName, Model } from 'tasks.v2.const';
import { Core } from 'tasks.v2.core';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { checkListService } from 'tasks.v2.provider.service.check-list-service';
import { EntityTypes, fileService, type FileService } from 'tasks.v2.provider.service.file-service';
import { highlighter } from 'tasks.v2.lib.highlighter';
import { type CheckListModel } from 'tasks.v2.model.check-list';
import { type TaskModel } from 'tasks.v2.model.tasks';

import { checkListMeta } from '../../lib/check-list-meta';
import { buildCheckListPickerMenuItems } from '../../lib/check-list-picker-menu';
import { CheckListStub } from './check-list-stub';
import { CheckListPopup } from '../check-list-popup/check-list-popup';
import { CheckListSheet } from '../check-list-sheet/check-list-sheet';
import { CheckListList } from '../check-list-list/check-list-list';
import { CheckListWidget } from '../check-list-widget/check-list-widget';
import { CheckListItemPanel } from '../check-list-item-panel/check-list-item-panel';
import { CheckListLinkPopup } from '../check-list-formatting/check-list-link-popup';

import { Context } from '../../lib/check-list-const';
import { CheckListManager } from '../../lib/check-list-manager';
import { CheckListNotifier } from '../../lib/check-list-notifier';
import { CheckListParticipantService, type ParticipantType } from '../../lib/check-list-participant-service';
import { CheckListChangeTracker } from '../../lib/check-list-change-tracker';
import { CheckListEditorAdapter } from '../../lib/editor';
import { PanelAction } from '../check-list-item-panel/check-list-item-panel-meta';
import {
	ActionPlacement,
	getActionDescriptor,
	type ActionPlacementValue,
} from '../check-list-item-panel/action-registry';
import { resolveActions, type ResolvedAction } from '../check-list-item-panel/action-access';
import {
	PanelOpenSource,
	PanelType,
	closePanel,
	closeEntityPanel,
	closePanelForMissingAnchor,
	createPanelState,
	getActiveItemId,
	openEntityPanel,
	openTextPanel,
	setPanelHold,
	shouldClosePointerPanel,
	type PanelOpenSourceValue,
	type PanelState,
} from './panel-state';
import { computeTextPanelPosition } from './text-panel-position';

import './check-list.css';

const openConflictTaskIds = new Set();

const taskViewCounts = new Map();

const acquireTaskView = (taskId): void => {
	taskViewCounts.set(taskId, (taskViewCounts.get(taskId) ?? 0) + 1);
};

const releaseTaskView = (taskId): number => {
	const remaining = (taskViewCounts.get(taskId) ?? 0) - 1;
	if (remaining <= 0)
	{
		taskViewCounts.delete(taskId);

		return 0;
	}

	taskViewCounts.set(taskId, remaining);

	return remaining;
};

const supportsCheckVisibility = Type.isFunction(window.Element?.prototype?.checkVisibility);

// How far the text toolbar sinks below the row top, measured from its bottom edge.
const textPanelRowInset = 10;
// The list keeps its own top edge clear of the entity toolbar even where no header floats over it.
const entityPanelTopInset = 28;
// The clear space the entity toolbar keeps between itself and the text of a title being edited.
// The same space the text toolbar keeps from its own line, and it is what makes the decision steady
// under typing: the toolbar goes before the glyphs reach it, not once they already run under it.
const entityPanelTextGap = 10;
const linkPopupFocusRestoreFrameLimit = 120;

const doRectsOverlap = (first: DOMRect, second: DOMRect): boolean => (
	first.left < second.right
	&& first.right > second.left
	&& first.top < second.bottom
	&& first.bottom > second.top
);

// Line boxes of the text itself. A range over the title node would report the width of the column
// the title is stretched to, and a toolbar standing at the edge of that column would never be clear
// of it -- while what has to stay clear is the glyphs.
const getTextLineRects = (node: HTMLElement): DOMRect[] => {
	const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
	const range = document.createRange();
	const rects = [];
	let textNode = walker.nextNode();
	while (textNode)
	{
		range.selectNodeContents(textNode);
		rects.push(...range.getClientRects());
		textNode = walker.nextNode();
	}

	return rects;
};

// A design-system control paints its own box over a native input kept at zero opacity, and the
// browser still stops on that input by Tab. InteractivityChecker reads any zero opacity as
// invisible, so the checklist keeps such controls in the walk itself: same checks as isTabbable,
// with opacity left out of the visibility one.
function isVisuallyHiddenTabStop(node: HTMLElement): boolean
{
	if (
		!node.isConnected
		|| node.closest('[inert]')
		|| !node.matches(FocusNavigator.FOCUSABLE_SELECTOR)
		|| InteractivityChecker.hasNegativeTabIndex(node)
		|| InteractivityChecker.isDisabled(node)
	)
	{
		return false;
	}

	if (supportsCheckVisibility)
	{
		return node.checkVisibility({ visibilityProperty: true, opacityProperty: false });
	}

	const hasGeometry = node.offsetWidth > 0 || node.offsetHeight > 0 || node.getClientRects().length > 0;

	return hasGeometry && getComputedStyle(node).visibility === 'visible';
}

// @vue/component
export const CheckList = {
	name: 'TaskCheckList',
	inheritAttrs: false,
	components: {
		CheckListWidget,
		CheckListItemPanel,
		CheckListLinkPopup,
		CheckListStub,
		ConflictPopup: BitrixVue.defineAsyncComponent(
			'tasks.v2.component.fields.check-list-conflict-popup',
			'ConflictPopup',
		),
		UiButton,
		BIcon,
		BMenu,
	},
	provide(): Object
	{
		return {
			setItemsRef: this.setItemsRef,
			getItemsRef: this.getItemsRef,
			checkListKeyboardRouter: {
				routeTab: (itemId, event) => this.routeCheckListTab(itemId, event),
				routeEscape: (itemId, event) => this.routeCheckListEscape(itemId, event),
			},
			checkListEditor: {
				activate: (options) => this.activateItemEditor(options),
				deactivate: (reason) => this.deactivateItemEditor(reason),
				finalizeBlur: (itemId, event) => this.finalizeItemEditorBlur(itemId, event),
				handleEscape: (event) => this.handleItemEscape(event, true),
				dispatchFormatting: (action, payload) => this.editorAdapter.dispatchFormatting(action, payload),
				captureSelection: () => this.editorAdapter.captureSelection(),
				restoreSelection: (selection) => this.editorAdapter.restoreSelection(selection),
				getActiveFormattingActions: () => this.editorAdapter.getActiveFormattingActions(),
				getVisibleState: () => this.editorAdapter.getVisibleState(),
				captureVisibleRange: (start, end) => this.editorAdapter.captureVisibleRange(start, end),
				removeVisibleRange: (range) => this.editorAdapter.removeVisibleRange(range),
				setAria: (aria) => this.editorAdapter.setAria(aria),
				setParticipantSelectorOpen: (open) => this.setParticipantSelectorOpen(open),
				focus: (point) => this.focusItemEditor(point),
				isActive: (itemId) => this.editorAdapter.isActive(itemId),
			},
		};
	},
	inject: {
		task: {},
		taskId: {},
		isEdit: {},
	},
	props: {
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
		sheetBindProps: {
			type: Object,
			default: null,
		},
	},
	emits: ['show', 'close', 'resize', 'open'],
	setup(): { task: TaskModel }
	{
		return {
			shownPopups: new Set(),
			resizeObserver: null,
			notifiers: markRaw(new Map()),
			linkPopupId: `tasks-check-list-link-popup-${Text.getRandom()}`,
			AirButtonStyle,
			ButtonSize,
			ButtonIcon,
			Outline,
			ActionPlacement,
			checkListMeta,
		};
	},
	data(): Object
	{
		return {
			itemId: null,
			panelState: createPanelState(),
			hoveredEntityTarget: null,
			itemPanelStyles: {
				top: '0',
				display: 'flex',
			},
			entityPanelStyles: {
				top: '0',
				left: 'auto',
				right: '18px',
				display: 'none',
			},
			isItemPanelFreeze: false,
			isItemPanelActionPopupShown: false,
			isFocusInItemPanel: false,
			isUploadingItemFiles: false,
			itemsRefs: {},
			pendingFocusItemId: null,
			pendingFocusHighlight: false,
			pendingFocusToken: 0,
			isDeactivatingItemEditor: false,
			isForwardMenuShown: false,
			forwardMenuSectionCode: 'createSection',
			forwardBindElement: null,
			forwardContextItemId: null,
			forwardSelectedItemIds: [],
			linkPopupBindElement: null,
			linkPopupItemId: null,
			selectedFormattingActions: [],
			suppressTitlePanelItemId: null,
			isFreeze: false,
			closing: false,
			conflicts: null,
		};
	},
	computed: {
		...mapGetters({
			currentUserId: `${Model.Interface}/currentUserId`,
			deletingCheckListIds: `${Model.Interface}/deletingCheckListIds`,
			checkListCompletionCallback: `${Model.Interface}/checkListCompletionCallback`,
			draggedCheckListId: `${Model.Interface}/draggedCheckListId`,
		}),
		componentName(): BitrixVueComponentProps
		{
			return {
				[Context.Sheet]: CheckListSheet,
				[Context.Popup]: CheckListPopup,
				[Context.Preview]: CheckListList,
			}[this.context];
		},
		context(): string
		{
			return {
				[true]: Context.Sheet,
				[this.isAutonomous]: Context.Popup,
				[this.isPreview]: Context.Preview,
			}.true;
		},
		contextClass(): string
		{
			return `--${this.context}`;
		},
		componentShown(): boolean
		{
			if (this.isPreview)
			{
				return this.isComponentShown;
			}

			return true;
		},
		checkLists(): CheckListModel[]
		{
			if (!this.task)
			{
				return [];
			}

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
		currentItem(): ?CheckListModel
		{
			return this.$store.getters[`${Model.CheckList}/getById`](this.itemId);
		},
		textPanelItem(): ?CheckListModel
		{
			return this.$store.getters[`${Model.CheckList}/getById`](this.panelState.textItemId);
		},
		itemPanelIsShown(): boolean
		{
			return this.panelState.activePanel === PanelType.Text;
		},
		entityPanelItem(): ?CheckListModel
		{
			return this.$store.getters[`${Model.CheckList}/getById`](this.panelState.entityItemId);
		},
		entityPanelAvailable(): boolean
		{
			return this.componentShown;
		},
		textPanelActions(): ResolvedAction[]
		{
			return this.resolvePanelActions(
				this.textPanelItem,
				ActionPlacement.Text,
				this.selectedFormattingActions,
			);
		},
		entityPanelActions(): ResolvedAction[]
		{
			return this.resolvePanelActions(this.entityPanelItem, ActionPlacement.Entity);
		},
		textPanelKeyboardActions(): ResolvedAction[]
		{
			return this.resolvePanelActions(this.textPanelItem, ActionPlacement.Keyboard);
		},
		entityPanelKeyboardActions(): ResolvedAction[]
		{
			return this.resolvePanelActions(this.entityPanelItem, ActionPlacement.Keyboard);
		},
		itemGroupModeSelected(): boolean
		{
			if (!this.currentItem)
			{
				return false;
			}

			return this.currentItem.groupMode?.selected === true;
		},
		isItemPanelHeld(): boolean
		{
			return (
				this.isItemPanelFreeze
				|| this.isItemPanelActionPopupShown
				|| this.isFocusInItemPanel
				|| this.isUploadingItemFiles
			);
		},
		// A hold means the panel is mid-action, so a selection that its own action dropped must not
		// close it. Same set finalizeItemEditorBlur() keeps the editor alive for.
		isTextPanelHeld(): boolean
		{
			return (
				this.isItemPanelHeld
				|| this.panelState?.focusInside === true
				|| this.panelState?.popupOpen === true
				|| this.panelState?.participantSelectorOpen === true
			);
		},
		forwardContextItem(): ?CheckListModel
		{
			return this.$store.getters[`${Model.CheckList}/getById`](this.forwardContextItemId);
		},
		forwardMenuOptions(): ?MenuOptions
		{
			if (!this.forwardContextItem)
			{
				return null;
			}

			return {
				id: `check-list-item-forward-menu-${this.forwardContextItem.id}`,
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
			if (!this.forwardContextItem)
			{
				return [];
			}

			// Unlike the picker, forwarding doesn't filter lists by edit right (preserves prior behavior).
			return buildCheckListPickerMenuItems({
				checkLists: this.parentCheckLists,
				excludedCheckListId: this.forwardContextItem.parentId,
				existingItemIdPrefix: 'ForwardMenuCheckList',
				onSelectCheckList: (checkList: CheckListModel) => this.handleForwardMenuSelect(checkList),
				createNewItem: {
					id: `ForwardMenuCreateNew-${this.forwardContextItem.id}`,
					title: this.loc('TASKS_V2_CHECK_LIST_ITEM_FORWARD_MENU_CREATE'),
					sectionCode: this.forwardMenuSectionCode,
					onClick: () => this.handleForwardMenuCreateNew(),
				},
			});
		},
		stub(): boolean
		{
			return this.checkLists.length === 0 || this.emptyList === true;
		},
		emptyList(): boolean
		{
			const siblings = this.parentCheckLists
				.filter((item: CheckListModel) => !this.deletingCheckListIds[item.id]);

			return siblings.length === 0;
		},
		parentItemDragged(): boolean
		{
			return this.checkListManager.isParentItem(this.draggedCheckListId);
		},
		showInlineCloseButton(): boolean
		{
			return (this.context === Context.Popup || (this.context === Context.Sheet && this.stub)) && !this.parentItemDragged;
		},
		showSheetCloseButton(): boolean
		{
			return this.context === Context.Sheet && !this.parentItemDragged;
		},
		canCheckListAdd(): boolean
		{
			if (!this.isEdit)
			{
				return true;
			}

			return this.task.rights.checklistAdd;
		},
		hasIndentTarget(): boolean
		{
			return this.checkListManager.getIndentTarget(this.currentItem) !== null;
		},
	},
	watch: {
		async entityPanelActions(): Promise<void>
		{
			await this.$nextTick();
			this.schedulePanelPositionUpdate();
		},
		forwardContextItem(value: ?CheckListModel, previousValue: ?CheckListModel): void
		{
			if (!value && previousValue && this.isForwardMenuShown)
			{
				this.closeForwardMenu(false);
			}
		},
		draggedCheckListId(value): void
		{
			if (value !== null && value !== undefined)
			{
				this.hoveredEntityTarget = null;
				this.hideEntityPanel();
			}
		},
		async titleFieldOffsetHeight(): Promise<void>
		{
			if (!this.$refs.popupComponent)
			{
				return;
			}

			await this.$nextTick();
			this.resize();
		},
		componentShown(value: boolean): void
		{
			if (!this.isPreview)
			{
				return;
			}

			this.executeCheckListCompletionCallbacks();

			void this.$nextTick(() => {
				if (value)
				{
					this.subscribeToEvents();

					if (
						this.checkListId
						&& this.checkListManager.getItem(this.checkListId)
						&& this.$refs.list
					)
					{
						this.scrollToCheckList(this.checkListId);
					}
				}
				else
				{
					this.unsubscribeFromEvents();
				}
			});
		},
		checkLists: {
			handler(): void
			{
				this.syncActiveEditorSource?.();
				if (this.checkListChangeTracker && !this.checkListChangeTracker.isInitialized())
				{
					void this.$nextTick(() => {
						this.checkListChangeTracker.createSnapshot();
					});
				}
			},
			immediate: true,
		},
	},
	created(): void
	{
		this.checkListManager = new CheckListManager({
			computed: {
				checkLists: () => this.checkLists,
			},
		});

		this.checkListChangeTracker = new CheckListChangeTracker({
			computed: {
				checkLists: () => this.checkLists.filter((item: CheckListModel) => {
					return !this.deletingCheckListIds[item.id];
				}),
			},
		});

		this.shownPopups = new Set();
		this.checkListParticipantService = new CheckListParticipantService(this.taskId);
		this.entityPanelHideTimer = null;
		this.panelPositionFrameId = null;
		this.linkPopupFocusFrameId = null;
		this.linkPopupFocusGeneration = 0;
		this.isUnmounted = false;
		this.escapeKeyUpTarget = null;
		this.escapeKeyUpHandler = null;
		this.escapeKeyUpBlurHandler = null;
		this.escapeClosingByEscTimer = null;
		this.savedRange = null;
		this.lastSelectionAnchor = null;
		this.isSelectingWithPointer = false;
		this.isFollowingPointerSelection = false;
		this.pointerSelectionTarget = null;
		this.pointerSelectionHandlers = null;
		this.pointerSelectionBlurHandler = null;
		this.activeEditorLayer = null;
		this.editorAdapter = new CheckListEditorAdapter({
			onChange: this.handleEditorChange,
			onSelectionChange: this.handleEditorSelectionChange,
		});
	},
	mounted(): void
	{
		acquireTaskView(this.taskId);

		if (this.isAutonomous || this.isPreview)
		{
			this.subscribeToEvents();
		}

		EventEmitter.subscribe('tasks:checkList:manualConflicts', this.handleManualConflicts);

		if (Type.isFunction(window.ResizeObserver) && this.$refs.list)
		{
			this.resizeObserver = new window.ResizeObserver(this.schedulePanelPositionUpdate);
			this.resizeObserver.observe(this.$refs.list);
		}
	},
	async beforeUnmount(): Promise<void>
	{
		this.editorAdapter?.destroy();
		this.releaseEscapeKeyUpSuppression(false);
		this.releasePointerSelection();
		this.isUnmounted = true;
		this.linkPopupFocusGeneration++;
		this.cancelEntityPanelHide();
		this.cancelPanelPositionUpdate();
		if (this.linkPopupFocusFrameId !== null)
		{
			cancelAnimationFrame(this.linkPopupFocusFrameId);
			this.linkPopupFocusFrameId = null;
		}
		this.closeActivePanel();
		this.resizeObserver?.disconnect();
		this.resizeObserver = null;
		this.cleanNotifiers();

		EventEmitter.unsubscribe('tasks:checkList:manualConflicts', this.handleManualConflicts);

		const wasConflictOwner = this.conflicts !== null;
		const remainingViews = releaseTaskView(this.taskId);

		if (remainingViews <= 0)
		{
			openConflictTaskIds.delete(this.taskId);
			checkListService.clearPullConflicts(this.taskId);
		}
		else if (wasConflictOwner)
		{
			openConflictTaskIds.delete(this.taskId);
			EventEmitter.emit('tasks:checkList:manualConflicts', { taskId: this.taskId });
		}

		if (this.isAutonomous || this.isPreview)
		{
			this.unsubscribeFromEvents();
		}

		if (this.isPreview)
		{
			this.executeCheckListCompletionCallbacks();

			if (this.isEdit)
			{
				await checkListService.forceSavePending(this.taskId);
			}
		}
	},
	methods: {
		syncActiveEditorSource(): Object | null
		{
			const itemId = this.editorAdapter?.getActiveItemId();
			if (itemId === null || itemId === undefined)
			{
				return null;
			}

			const item = this.checkListManager?.getItem(itemId);
			if (!item)
			{
				return this.deactivateItemEditor('item-deleted');
			}

			return this.editorAdapter.replaceSource(itemId, item.title);
		},
		activateItemEditor(options: Object): Object | null
		{
			const previousLayer = this.activeEditorLayer;
			if (previousLayer && previousLayer !== options.layer)
			{
				previousLayer.deactivateEditorView();
			}

			const previousSession = this.editorAdapter.activate(options);
			previousLayer?.commitEditorSession?.(previousSession);
			this.activeEditorLayer = options.layer;
			options.layer.activateEditorView();

			return previousSession;
		},
		focusItemEditor(point: ?{ x: number, y: number } = null): void
		{
			this.editorAdapter.focus(point);
			// Only a press that raised the editor leaves a drag the browser no longer extends by itself.
			this.isFollowingPointerSelection = point !== null && this.isSelectingWithPointer;
		},
		deactivateItemEditor(reason: string = 'deactivate'): Object | null
		{
			if (this.isDeactivatingItemEditor)
			{
				return null;
			}

			this.isDeactivatingItemEditor = true;
			try
			{
				const session = this.editorAdapter.deactivate(reason);
				this.activeEditorLayer?.deactivateEditorView();
				this.activeEditorLayer = null;

				return session;
			}
			finally
			{
				this.isDeactivatingItemEditor = false;
			}
		},
		finalizeItemEditorBlur(itemId: number | string, event: FocusEvent): Object | null
		{
			if (!this.editorAdapter.isActive(itemId))
			{
				return null;
			}

			const relatedTarget = event?.relatedTarget;
			const remainsInsideItem = relatedTarget instanceof Node
				&& this.getItemRowNode(itemId)?.contains(relatedTarget)
			;
			if (
				remainsInsideItem
				|| this.isItemPanelHeld
				|| this.panelState?.focusInside
				|| this.panelState?.popupOpen
				|| this.panelState?.participantSelectorOpen
			)
			{
				return null;
			}

			return this.deactivateItemEditor('blur');
		},
		handleListFocusOut(event: FocusEvent): void
		{
			const itemId = this.editorAdapter?.getActiveItemId();
			if (itemId === null || itemId === undefined || !(event?.target instanceof Node))
			{
				return;
			}

			if (!this.getItemRowNode(itemId)?.contains(event.target))
			{
				return;
			}

			const layer = this.activeEditorLayer;
			const session = this.finalizeItemEditorBlur(itemId, event);
			layer?.commitEditorSession?.(session, event);
		},
		setParticipantSelectorOpen(open: boolean): void
		{
			if (this.panelState)
			{
				this.applyPanelState(setPanelHold(this.panelState, 'participantSelectorOpen', open));
			}
		},
		handleEditorChange(source: string, context: Object): void
		{
			if (!this.editorAdapter.isActive(context.itemId))
			{
				return;
			}

			this.getItemsRef(context.itemId)?.handleEditorInput(source);

			// The text the toolbar yields to grows and shrinks under the caret.
			this.refreshEntityPanelDecision();
		},
		handleEditorSelectionChange(actions: string[], context: Object): void
		{
			if (context.itemId !== null)
			{
				this.handleFormattingSelectionChange(context.itemId, actions);
				this.syncTextPanelWithSelection(context.itemId, context.hasFormattableSelection === true);
				// The click that puts the caret in a row is also what starts editing it, and the toolbar
				// hovered up a moment earlier was placed while the row was not being edited yet. A caret
				// moved by key arrives the same way, so both are answered here.
				this.refreshEntityPanelDecision();
			}
		},
		syncTextPanelWithSelection(itemId: number | string, hasFormattableSelection: boolean): void
		{
			// The root row keeps raising its panel on focus, so selection does not drive it.
			const item = this.checkListManager?.getItem?.(itemId);
			if (!item || item.parentId === 0)
			{
				return;
			}

			const shownForItem = (
				this.panelState.activePanel === PanelType.Text
				&& String(this.panelState.textItemId) === String(itemId)
			);

			if (hasFormattableSelection)
			{
				// While the button is held the panel neither opens nor moves: handleListPointerDown()
				// explains why, and the release reports the selection again.
				if (this.isSelectingWithPointer)
				{
					return;
				}

				if (shownForItem)
				{
					// A selection moved under a shown panel moves the panel. The move is booked with the
					// frame rather than written here: a position written now would be overwritten by that
					// frame before it is ever drawn, and the booking coalesces with any other for the frame.
					this.schedulePanelPositionUpdate();

					return;
				}

				const editor = this.getItemsRef(itemId)?.$refs.growingTextArea?.$el ?? null;
				this.showItemPanel(itemId, PanelOpenSource.Keyboard, editor);

				return;
			}

			if (shownForItem && !this.isTextPanelHeld && !this.editorAdapter.isActive(itemId))
			{
				this.hideItemPanel(itemId);
				// The row is free of the text panel now, so the actions can have it back.
				this.refreshEntityPanelDecision();
			}
		},
		...mapActions(Model.Interface, [
			'addCheckListItemToDeleting',
			'removeCheckListItemFromDeleting',
			'executeCheckListCompletionCallbacks',
		]),
		applyPanelState(nextState: PanelState): void
		{
			this.panelState = nextState;
		},
		releaseEscapeKeyUpSuppression(restoreClosingByEsc: boolean = true): void
		{
			if (this.escapeKeyUpTarget && this.escapeKeyUpHandler)
			{
				Event.unbind(this.escapeKeyUpTarget, 'keyup', this.escapeKeyUpHandler, { capture: true });
			}

			if (this.escapeKeyUpTarget && this.escapeKeyUpBlurHandler)
			{
				Event.unbind(this.escapeKeyUpTarget, 'blur', this.escapeKeyUpBlurHandler);
			}

			this.escapeKeyUpTarget = null;
			this.escapeKeyUpHandler = null;
			this.escapeKeyUpBlurHandler = null;

			clearTimeout(this.escapeClosingByEscTimer);
			this.escapeClosingByEscTimer = null;
			if (restoreClosingByEsc)
			{
				this.escapeClosingByEscTimer = setTimeout(() => {
					this.$refs.childComponent?.setClosingByEsc?.(true);
					this.escapeClosingByEscTimer = null;
				}, 0);
			}
		},
		suppressNextEscapeKeyUp(): void
		{
			this.releaseEscapeKeyUpSuppression(false);
			this.$refs.childComponent?.setClosingByEsc?.(false);

			const ownerWindow = this.$refs.list?.ownerDocument?.defaultView ?? window;
			this.escapeKeyUpTarget = ownerWindow;
			this.escapeKeyUpHandler = (event: KeyboardEvent): void => {
				this.releaseEscapeKeyUpSuppression();
				if (event.key === 'Escape')
				{
					event.preventDefault();
					event.stopPropagation();
				}
			};
			this.escapeKeyUpBlurHandler = (): void => this.releaseEscapeKeyUpSuppression();
			Event.bind(ownerWindow, 'keyup', this.escapeKeyUpHandler, { capture: true });
			Event.bind(ownerWindow, 'blur', this.escapeKeyUpBlurHandler);
		},
		/**
		 * A drag reports its selection all the way through, and a panel answering every report travels
		 * with the pointer. So the reports of a held button are refused and the release asks the adapter
		 * once more: the panel appears once, at the end the caret stopped at. Only the pointer is held
		 * back -- a selection made with the keyboard sends no gesture and keeps showing the panel at once.
		 * The listeners of the end live for the gesture only, and the capture phase carries the pointer
		 * ones past anything a descendant stops.
		 */
		handleListPointerDown(event: PointerEvent): void
		{
			if (event.button !== 0)
			{
				return;
			}

			this.releasePointerSelection();

			const ownerWindow = this.$refs.list?.ownerDocument?.defaultView ?? window;
			this.isSelectingWithPointer = true;
			this.pointerSelectionTarget = ownerWindow;
			this.pointerSelectionHandlers = {
				pointerup: (): void => this.finishPointerSelection(),
				pointercancel: (): void => this.finishPointerSelection(),
				// A button released past the window sends no event of its own, so the next move carrying
				// nothing pressed is what proves the gesture is over.
				pointermove: (moveEvent: PointerEvent): void => {
					if (moveEvent.buttons === 0)
					{
						this.finishPointerSelection();

						return;
					}

					if (this.isFollowingPointerSelection)
					{
						this.editorAdapter.extendSelectionTo({ x: moveEvent.clientX, y: moveEvent.clientY });
					}
				},
			};
			// The end of a gesture is the window itself losing the focus, so this one is kept out of the
			// capture phase the others need: captured on the window, it would answer the blur of every
			// descendant as well, and a press that moves the focus from one row to the next would end a
			// gesture nobody released.
			this.pointerSelectionBlurHandler = (): void => this.finishPointerSelection();

			Object.entries(this.pointerSelectionHandlers).forEach(([name, handler]): void => {
				Event.bind(ownerWindow, name, handler, { capture: true });
			});
			Event.bind(ownerWindow, 'blur', this.pointerSelectionBlurHandler);
		},
		finishPointerSelection(): void
		{
			if (!this.isSelectingWithPointer)
			{
				return;
			}

			// The flag goes down before the report, or the report would be refused like the rest.
			this.releasePointerSelection();
			this.editorAdapter?.reportSelection();
		},
		releasePointerSelection(): void
		{
			const target = this.pointerSelectionTarget;
			const handlers = this.pointerSelectionHandlers;
			const blurHandler = this.pointerSelectionBlurHandler;
			this.isSelectingWithPointer = false;
			this.isFollowingPointerSelection = false;
			this.pointerSelectionTarget = null;
			this.pointerSelectionHandlers = null;
			this.pointerSelectionBlurHandler = null;

			if (!target || !handlers)
			{
				return;
			}

			Object.entries(handlers).forEach(([name, handler]): void => {
				Event.unbind(target, name, handler, { capture: true });
			});
			Event.unbind(target, 'blur', blurHandler);
		},
		openTextPanel(
			itemId: number | string,
			source: PanelOpenSourceValue,
			returnFocusElement: ?HTMLElement = null,
		): void
		{
			if (
				this.linkPopupBindElement
				&& String(this.linkPopupItemId) !== String(itemId)
			)
			{
				this.closeLinkPopup();
			}

			this.cancelEntityPanelHide();
			this.itemId = itemId;
			this.applyPanelState(openTextPanel(this.panelState, itemId, source, returnFocusElement));

			void this.$nextTick(() => {
				this.updatePanelPosition();
				this.updateSelectedFormattingActions();
			});
		},
		openEntityPanel(
			itemId: number | string,
			source: PanelOpenSourceValue,
			anchor: ?HTMLElement = null,
			returnFocusElement: ?HTMLElement = null,
		): void
		{
			const item = this.checkListManager?.getItem?.(itemId) ?? this.currentItem;
			if (!item || item.parentId === 0)
			{
				return;
			}

			this.applyPanelState(openEntityPanel(
				this.panelState,
				itemId,
				source,
				anchor,
				returnFocusElement,
			));
		},
		closeActivePanel(): void
		{
			this.applyPanelState(closePanel(this.panelState));
			this.selectedFormattingActions = [];
			this.entityPanelStyles = { top: '0', left: 'auto', right: '18px', display: 'none' };
			this.lastSelectionAnchor = null;
		},
		resolvePanelActions(
			item: ?CheckListModel,
			placement: ActionPlacementValue,
			selectedFormattingActions: string[] = [],
		): ResolvedAction[]
		{
			if (!item)
			{
				return [];
			}

			const hasTaskRight = (right: string): boolean => !this.isEdit || this.task.rights[right] === true;
			const isGroupMode = item.groupMode?.selected === true;
			const needsLevelMovement = (
				placement === ActionPlacement.Text
				|| (placement === ActionPlacement.Entity && isGroupMode)
			);

			return resolveActions({
				item,
				placement,
				isGroupMode,
				isStakeholdersAvailable: Core.getParams().restrictions.stakeholder.available,
				isDiskAvailable: Core.getParams().features.disk,
				canCheckListAdd: hasTaskRight('checklistAdd'),
				canAuditorsAdd: hasTaskRight('addAuditors'),
				canChangeAccomplices: hasTaskRight('changeAccomplices'),
				canMoveRight: needsLevelMovement && this.checkListManager.canMoveRight(item),
				canMoveLeft: needsLevelMovement && this.checkListManager.canMoveLeft(item),
				// Keyboard descriptors are always present. The reorder operation checks the boundary
				// and announces it, so resolving the toolbar must not walk the siblings in advance.
				canMoveItemUp: false,
				canMoveItemDown: false,
				selectedFormattingActions,
			});
		},
		subscribeToEvents(): void
		{
			Event.bind(this.$refs.list, 'scroll', this.handleScroll);

			EventEmitter.subscribe('BX.Main.Popup:onShow', this.handleShowPopup);
			EventEmitter.subscribe('BX.Main.Popup:onClose', this.handleClosePopup);
			EventEmitter.subscribe('BX.Main.Popup:onDestroy', this.handleClosePopup);
		},
		unsubscribeFromEvents(): void
		{
			Event.unbind(this.$refs.list, 'scroll', this.handleScroll);

			EventEmitter.unsubscribe('BX.Main.Popup:onShow', this.handleShowPopup);
			EventEmitter.unsubscribe('BX.Main.Popup:onClose', this.handleClosePopup);
			EventEmitter.unsubscribe('BX.Main.Popup:onDestroy', this.handleClosePopup);
		},
		scrollToCheckList(checkListId: number | string): void
		{
			this.checkListManager.scrollToCheckList(this.$refs.list, checkListId);
		},
		handleUpdate(itemId: number | string): void
		{
			this.itemId = itemId;

			this.handleUpdatingFreezeState();
		},
		handleUpdatingFreezeState(): void
		{
			if (!this.isFreeze && (this.hasEmptyItem() || this.getItemIdWithUploadingFiles()))
			{
				this.freeze();
			}

			if (this.isFreeze)
			{
				this.unfreeze();
			}
		},
		handleRemove(itemId: number | string): void
		{
			this.itemId = itemId;

			this.freeze();

			this.addItemToDelete(itemId);

			this.checkListManager.hideItems(
				[itemId],
				(updates: CheckListModel[]) => this.upsertCheckLists(updates),
			);

			const messageKey = (
				this.currentItem.parentId === 0
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
					this.checkListManager.showItems(
						[itemId],
						(updates: CheckListModel[]) => this.upsertCheckLists(updates),
					);
				}

				this.removeItemFromDelete(itemId);

				this.unfreeze();

				this.notifiers.delete(itemId);
			});

			this.notifiers.set(itemId, notifier);

			notifier.showBalloonWithTimer();

			if (this.isCurrentItemEmpty())
			{
				notifier.stopTimer();
			}
		},
		handleScroll(): void
		{
			if (this.isForwardMenuShown)
			{
				this.handleForwardMenuClose();
			}

			this.schedulePanelPositionUpdate?.();
		},
		schedulePanelPositionUpdate(): void
		{
			if (this.panelPositionFrameId !== null)
			{
				return;
			}

			this.panelPositionFrameId = requestAnimationFrame(() => {
				this.panelPositionFrameId = null;
				this.updatePanelPosition();
				this.updateEntityPanelPosition();
			});
		},
		cancelPanelPositionUpdate(): void
		{
			if (this.panelPositionFrameId === null)
			{
				return;
			}

			cancelAnimationFrame(this.panelPositionFrameId);
			this.panelPositionFrameId = null;
		},
		handleItemPointerEnter({ itemId, anchor }: { itemId: number | string, anchor: HTMLElement }): void
		{
			this.cancelEntityPanelHide();

			if (!this.entityPanelAvailable)
			{
				return;
			}

			// A drag passes rows under the pointer on its own, and the panel restored afterwards
			// would open on a row the pointer has long left -- so a drag clears the hover target.
			if (this.draggedCheckListId !== null && this.draggedCheckListId !== undefined)
			{
				this.hoveredEntityTarget = null;

				return;
			}

			const item = this.checkListManager?.getItem?.(itemId) ?? this.currentItem;
			if (!item || item.parentId === 0)
			{
				this.hoveredEntityTarget = null;

				return;
			}

			this.hoveredEntityTarget = { itemId, anchor };
			this.showEntityPanelFromPointer(itemId, anchor);
		},
		showEntityPanelFromPointer(itemId: number | string, anchor: HTMLElement): void
		{
			// The anchor is a plain row container and takes no focus, so it is left out of the
			// return point: an empty one lets the fallbacks run instead of being swallowed.
			this.openEntityPanel(itemId, PanelOpenSource.Pointer, anchor);
			if (String(this.panelState.entityItemId) !== String(itemId))
			{
				return;
			}

			void this.$nextTick(() => {
				const panel = this.$refs.entityPanel?.$el;
				if (!(panel instanceof HTMLElement))
				{
					this.hideEntityPanel();

					return;
				}

				this.updateEntityPanelPosition();
			});
		},
		handleItemPointerLeave({ relatedTarget }: { relatedTarget: ?HTMLElement }): void
		{
			if (this.isEntityPanelRegionNode(relatedTarget))
			{
				return;
			}

			this.hoveredEntityTarget = null;
			this.scheduleEntityPanelHide();
		},
		handleEntityPanelPointerEnter(): void
		{
			this.cancelEntityPanelHide();
			this.applyPanelState(setPanelHold(this.panelState, 'pointerInside', true));
		},
		handleEntityPanelPointerLeave(event: PointerEvent): void
		{
			if (this.isEntityPanelRegionNode(event.relatedTarget))
			{
				return;
			}

			this.hoveredEntityTarget = null;
			this.scheduleEntityPanelHide();
		},
		restoreHoveredEntityPanel(): void
		{
			const target = this.hoveredEntityTarget;
			if (
				!target
				|| !this.entityPanelAvailable
				|| (this.draggedCheckListId !== null && this.draggedCheckListId !== undefined)
				|| this.panelState.activePanel !== PanelType.None
			)
			{
				return;
			}

			const item = this.checkListManager.getItem(target.itemId);
			if (!target.anchor.isConnected || !item || item.parentId === 0)
			{
				this.hoveredEntityTarget = null;

				return;
			}

			this.showEntityPanelFromPointer(target.itemId, target.anchor);
		},
		/**
		 * Takes the decision about the item toolbar again: a shown one yields if it now covers the text of
		 * the row being edited, and the same mounted panel returns once it no longer does. A closed panel
		 * also comes back for the row the pointer is still on. The position update coalesces into one frame,
		 * so the places calling this need to know nothing of each other.
		 */
		refreshEntityPanelDecision(): void
		{
			this.schedulePanelPositionUpdate();
			// The text panel is away for the whole drag, and the actions would take the place it left
			// only to give it back on the release. So a drag raises none; one already shown is left to
			// the position update above.
			if (this.isSelectingWithPointer)
			{
				return;
			}

			this.restoreHoveredEntityPanel();
		},
		isEntityPanelRegionNode(node: ?HTMLElement): boolean
		{
			return (
				this.panelState.entityAnchor?.contains?.(node) === true
				|| this.$refs.entityPanel?.$el?.contains?.(node) === true
			);
		},
		scheduleEntityPanelHide(): void
		{
			this.cancelEntityPanelHide();
			this.applyPanelState(setPanelHold(this.panelState, 'pointerInside', false));
			this.entityPanelHideTimer = setTimeout(() => {
				if (shouldClosePointerPanel(this.panelState))
				{
					this.hideEntityPanel();
				}
			}, 80);
		},
		cancelEntityPanelHide(): void
		{
			if (this.entityPanelHideTimer)
			{
				clearTimeout(this.entityPanelHideTimer);
				this.entityPanelHideTimer = null;
			}
		},
		hideEntityPanel(): void
		{
			this.cancelEntityPanelHide();
			if (this.panelState.activePanel === PanelType.Entity)
			{
				this.closeActivePanel();

				return;
			}

			if (this.panelState.entityItemId !== null)
			{
				this.applyPanelState(closeEntityPanel(this.panelState));
				this.entityPanelStyles = { top: '0', left: 'auto', right: '18px', display: 'none' };
			}
		},
		concealEntityPanel(): void
		{
			this.cancelEntityPanelHide();
			if (this.entityPanelStyles.display !== 'none')
			{
				this.entityPanelStyles = { top: '0', left: 'auto', right: '18px', display: 'none' };
			}
		},
		updateEntityPanelPosition(): void
		{
			if (!this.panelState.entityAnchor || !this.entityPanelItem)
			{
				return;
			}

			if (!this.panelState.entityAnchor.isConnected)
			{
				this.applyPanelState(closePanelForMissingAnchor(this.panelState, this.entityPanelItem.id));

				return;
			}

			const list = this.$refs.list;
			const panel = this.$refs.entityPanel?.$el;
			if (!list || !(panel instanceof HTMLElement))
			{
				return;
			}

			const itemRect = Dom.getRelativePosition(this.panelState.entityAnchor, list);
			const panelHeight = panel.offsetHeight || 48;
			const anchorHeight = this.panelState.entityAnchor.offsetHeight;
			const paddingOffset = 18;
			const groupModeOffset = 54;
			const rightOffset = this.entityPanelItem.groupMode?.active ? groupModeOffset : paddingOffset;
			const row = this.panelState.entityAnchor.closest('.check-list-widget-child-item')
				?? this.panelState.entityAnchor;

			// A multi-line row must not push the toolbar down to its middle: centre it on the
			// first line instead, whose box is the row's own min-height.
			const singleLineHeight = Number.parseFloat(getComputedStyle(this.panelState.entityAnchor).minHeight);
			const firstLineHeight = Math.min(anchorHeight, singleLineHeight || anchorHeight);
			const top = itemRect.top + (firstLineHeight - panelHeight) / 2;
			const stickyHeaderBottom = this.getStickyHeaderBottom(list, this.panelState.entityAnchor);
			const topLimitValue = Math.max(entityPanelTopInset, stickyHeaderBottom);
			const panelTopLimit = list.clientHeight - panelHeight;
			// Held against a boundary the toolbar keeps its full height, so a row showing less than that
			// carries it onto the neighbouring row, and a row the header swallowed would stand it on the
			// header over the very controls it covers. What has to hold the toolbar is the visible slice
			// of the row, cut by the header bottom above and by the list edge below.
			const rowRect = Dom.getRelativePosition(row, list);
			const visibleRowHeight = Math.min(rowRect.bottom, list.clientHeight)
				- Math.max(rowRect.top, stickyHeaderBottom)
			;
			const doesVisibleRowHoldPanel = visibleRowHeight >= panelHeight;
			const hasVisiblePanelRange = topLimitValue <= panelTopLimit;

			if (!doesVisibleRowHoldPanel || !hasVisiblePanelRange)
			{
				this.hideEntityPanel();

				return;
			}

			const visibleTop = Math.min(Math.max(top, topLimitValue), panelTopLimit);
			const entityRect = this.getEntityPanelFutureRect(panel, visibleTop, rightOffset);
			if (this.doesEntityPanelOverlapTextPanel(entityRect))
			{
				this.hideEntityPanel();

				return;
			}

			if (this.doesEditedTitleReachEntityPanel(entityRect))
			{
				// Keep the pointer panel mounted while the edited title covers its place. Input can then
				// remeasure the same panel without rebuilding the checklist on every character.
				this.concealEntityPanel();

				return;
			}

			this.entityPanelStyles = {
				top: `${visibleTop}px`,
				left: 'auto',
				right: `${rightOffset}px`,
				display: 'flex',
			};
		},
		// The checklist header floats over the list, and the toolbar is drawn above it on purpose --
		// for a root item the toolbar stands right in the header area. That leaves the header no
		// cover of its own, so its bottom edge is where the range of a child row panel begins.
		// Preview keeps the header in the flow: there it covers nothing and reports no boundary.
		// The node is the one the panel is placed by: each checklist floats a header of its own.
		getStickyHeaderBottom(list: HTMLElement, node: ?HTMLElement): number
		{
			const header = node
				?.closest('.check-list-widget-item.--parent')
				?.querySelector('.check-list-widget-parent-item');

			if (!(header instanceof HTMLElement) || getComputedStyle(header).position !== 'sticky')
			{
				return 0;
			}

			return Math.max(0, Dom.getRelativePosition(header, list).bottom);
		},
		getEntityPanelFutureRect(panel: HTMLElement, top: number, right: number): DOMRect
		{
			const { display, top: previousTop, right: previousRight, visibility } = panel.style;
			let entityRect: DOMRect;
			try
			{
				panel.style.display = 'flex';
				panel.style.top = `${top}px`;
				Dom.style(panel, 'right', `${right}px`);
				panel.style.visibility = 'hidden';
				entityRect = panel.getBoundingClientRect();
			}
			finally
			{
				panel.style.display = display;
				panel.style.top = previousTop;
				Dom.style(panel, 'right', previousRight);
				panel.style.visibility = visibility;
			}

			return entityRect;
		},
		doesEntityPanelOverlapTextPanel(entityRect: DOMRect): boolean
		{
			const textPanel = this.$refs.panel?.$el;
			if (!(textPanel instanceof HTMLElement))
			{
				return false;
			}

			const textRect = textPanel.getBoundingClientRect();
			if (textRect.width === 0 || textRect.height === 0)
			{
				return false;
			}

			return doRectsOverlap(entityRect, textRect);
		},
		/**
		 * A toolbar raised by the pointer yields to the edited title only when their rectangles overlap.
		 * A toolbar raised by the keyboard never yields: it is the only way to the actions without a mouse.
		 */
		doesEditedTitleReachEntityPanel(entityRect: DOMRect): boolean
		{
			const itemId = this.entityPanelItem.id;
			if (
				this.panelState.openSource !== PanelOpenSource.Pointer
				|| this.editorAdapter?.isActive(itemId) !== true
			)
			{
				return false;
			}

			const title = this.getItemsRef(itemId)?.$refs.growingTextArea?.$el;
			if (!(title instanceof HTMLElement))
			{
				return false;
			}

			const guardRect = new DOMRect(
				entityRect.left - entityPanelTextGap,
				entityRect.top,
				entityRect.width + entityPanelTextGap,
				entityRect.height,
			);

			// Every line of the title, not just the first one: the toolbar is taller than a line, and
			// a line of a wrapped title can end early where the next word is a long one.
			return getTextLineRects(title).some((rect: DOMRect) => doRectsOverlap(rect, guardRect));
		},
		handleShow(data): void
		{
			this.$emit('show', data);

			if (this.isAutonomous)
			{
				this.focusCheckListTarget();
			}
		},
		async handleClose(): void
		{
			if (this.closing)
			{
				return;
			}

			this.closing = true;

			this.cleanNotifiers();
			this.cancelGroupMode();
			this.cleanCollapsedState();
			this.executeCheckListCompletionCallbacks();

			if (this.hasEmptyItem())
			{
				const firstEmptyItem = this.checkListManager.getFirstEmptyItem();

				this.focusToItem(firstEmptyItem.id, true);

				this.closing = false;

				return;
			}

			const itemIdWithUploadingFiles = this.getItemIdWithUploadingFiles();
			if (itemIdWithUploadingFiles)
			{
				this.focusToItem(itemIdWithUploadingFiles, true);

				this.closing = false;

				return;
			}

			this.cleanEmptyItems();

			const lastUpdatedId = this.checkListChangeTracker.hasChanges()
				? this.checkListChangeTracker.getLastUpdatedCheckListId(
					(id) => this.checkListManager.getRootParentByChildId(id),
				)
				: 0;

			const checkListId = lastUpdatedId === 0 ? this.checkListId : lastUpdatedId;

			try
			{
				await this.saveCheckList();
			}
			catch
			{
				// Save errors are surfaced through pull-conflict state below.
			}
			finally
			{
				this.closing = false;
			}

			const hasUnresolvedConflicts = checkListService
				.getPullConflicts()
				.some((conflict) => conflict.taskId === this.taskId);
			if (hasUnresolvedConflicts)
			{
				return;
			}

			this.$emit('close', this.deletingCheckListIds[checkListId] ? 0 : checkListId);
		},
		handleIsShown(isShown: boolean): void
		{
			if (isShown)
			{
				this.subscribeToEvents();
				this.focusCheckListTarget();
			}
			else
			{
				this.unsubscribeFromEvents();
				this.$bitrix.eventEmitter.emit(EventName.CloseCheckList);
			}
		},
		focusCheckListTarget(): void
		{
			const targetItem = this.checkListManager.getItem(this.checkListId);
			if (targetItem && targetItem.parentId !== 0)
			{
				this.focusToItem(targetItem.id);
			}
		},
		handleShowPopup(baseEvent: BaseEvent): void
		{
			const [popup] = baseEvent.getCompatData();
			const isHintPopup = popup.getId().startsWith('bx-vue-hint-');
			if (isHintPopup)
			{
				return;
			}

			this.shownPopups.add(popup);
			if (this.panelState.activePanel !== PanelType.None)
			{
				this.applyPanelState(setPanelHold(this.panelState, 'popupOpen', true));
			}

			this.freeze();
		},
		handleClosePopup(baseEvent: BaseEvent): void
		{
			const [popup] = baseEvent.getCompatData();
			const isHintPopup = popup.getId().startsWith('bx-vue-hint-');
			if (isHintPopup)
			{
				return;
			}

			this.shownPopups.delete(popup);
			if (this.panelState.activePanel !== PanelType.None && this.shownPopups.size === 0)
			{
				this.applyPanelState(setPanelHold(this.panelState, 'popupOpen', false));
			}

			this.unfreeze();
		},
		async handleGroupRemove(
			itemId: number | string,
			selectedItemsSnapshot: ?CheckListModel[] = null,
		): Promise<void>
		{
			this.itemId = itemId;

			this.freeze();

			this.addItemToDelete(itemId);

			this.closeActivePanel();

			const allSelectedItems = selectedItemsSnapshot ?? this.checkListManager.getAllSelectedItems();

			const nearestItem = this.checkListManager.findNearestItem(this.currentItem, false);
			if (nearestItem)
			{
				await this.updateCheckList(nearestItem.id, {
					groupMode: {
						active: true,
						selected: true,
					},
				});

				setTimeout(() => {
					this.showEntityPanelProgrammatically(nearestItem.id);
				}, 0);
			}

			const allSelectedItemIds = allSelectedItems.map((item: CheckListModel) => item.id);

			this.checkListManager.hideItems(
				allSelectedItemIds,
				(updates: CheckListModel[]) => this.upsertCheckLists(updates),
			);

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
				const idsToShow = [];
				allSelectedItems.forEach((item: CheckListModel) => {
					if (timerHasEnded)
					{
						this.removeItem(item.id);
					}
					else
					{
						idsToShow.push(item.id);
					}

					this.removeItemFromDelete(item.id);
				});

				this.checkListManager.showItems(
					idsToShow,
					(updates: CheckListModel[]) => this.upsertCheckLists(updates),
				);

				if (timerHasEnded)
				{
					if (nearestItem && !this.deletingCheckListIds[nearestItem.id])
					{
						this.showEntityPanelProgrammatically(nearestItem.id);
					}
					else
					{
						this.cancelGroupMode();
					}
				}
				else
				{
					this.showEntityPanelProgrammatically(itemId);
				}

				this.unfreeze();

				this.notifiers.delete(itemId);
			});

			this.notifiers.set(itemId, notifier);

			notifier.showBalloonWithTimer();
		},
		handleFocus(itemId: number | string): void
		{
			if (String(this.suppressTitlePanelItemId) === String(itemId))
			{
				this.suppressTitlePanelItemId = null;

				return;
			}

			this.isItemPanelFreeze = false;
			this.itemId = itemId;

			const editor = this.getItemsRef(itemId)?.$refs.growingTextArea?.$el ?? null;
			this.showItemPanel(itemId, PanelOpenSource.Keyboard, editor);
		},
		handleBlur(itemId: number | string): void
		{
			this.itemId = itemId;
			if (!this.panelState)
			{
				if (!this.isItemPanelHeld)
				{
					this.hideItemPanel(itemId);
				}

				return;
			}

			if (
				this.isCurrentItemEmpty()
				&& this.hasItemFiles(this.currentItem)
			)
			{
				return;
			}

			if (!this.isTextPanelHeld)
			{
				const closesTextPanel = (
					this.panelState.activePanel === PanelType.Text
					&& String(this.panelState.textItemId) === String(itemId)
				);
				this.hideItemPanel(itemId);
				if (closesTextPanel && this.panelState.activePanel === PanelType.None)
				{
					this.restoreHoveredEntityPanel();
				}
			}
		},
		routeCheckListTab(itemId: number | string, event: KeyboardEvent): boolean
		{
			if (!event || event.key !== 'Tab')
			{
				return false;
			}

			if (event.defaultPrevented)
			{
				return true;
			}

			if (event.ctrlKey || event.metaKey || event.altKey)
			{
				return false;
			}

			const mentionManager = this.getItemsRef(itemId)?.mentionManager;
			if (event.isComposing || mentionManager?.isOpen?.() === true)
			{
				return false;
			}

			const item = this.checkListManager.getItem(itemId);
			const structuralAllowed = Boolean(
				item
				&& !this.isPreview
				&& item.parentId !== 0
				&& item.actions?.modify === true
				&& item.groupMode?.active !== true
				&& item.groupMode?.selected !== true,
			);
			let updates: CheckListModel[] = [];
			if (structuralAllowed && item)
			{
				const canMove = event.shiftKey
					? this.checkListManager.canMoveLeft(item)
					: this.checkListManager.canMoveRight(item)
				;
				if (canMove)
				{
					const move = event.shiftKey ? 'moveLeft' : 'moveRight';
					this.checkListManager[move](item, (localUpdates: CheckListModel[]): void => {
						updates = localUpdates;
					});
				}
			}

			const hasMovedItemUpdate = updates
				.some((update: CheckListModel) => String(update.id) === String(itemId));
			if (updates.length > 0 && hasMovedItemUpdate)
			{
				const selection = this.captureKeyboardEditorSelection(itemId, event);
				void this.upsertCheckLists(updates);
				this.restoreKeyboardEditor(itemId, selection);
				const level = this.getUpdatedItemLevel(itemId, updates);
				if (level !== null)
				{
					LiveAnnouncer.announce(
						this.loc('TASKS_V2_CHECK_LIST_ITEM_LEVEL_CHANGED', { '#level#': level }),
						'polite',
					);
				}

				return true;
			}

			return this.queuePanelFocus(itemId, event);
		},
		captureKeyboardEditorSelection(itemId: number | string, event: KeyboardEvent): ?Object
		{
			if (this.editorAdapter?.isActive(itemId))
			{
				return { type: 'editor', value: this.editorAdapter.captureSelection() };
			}

			if (event.target instanceof HTMLTextAreaElement)
			{
				return {
					type: 'textarea',
					value: { start: event.target.selectionStart, end: event.target.selectionEnd },
				};
			}

			return null;
		},
		restoreKeyboardEditor(itemId: number | string, selection: ?Object): void
		{
			this.focusToItem(itemId);
			void this.$nextTick(() => {
				const layer = this.getItemsRef(itemId)?.$refs.growingTextArea;
				if (selection?.type === 'editor' && this.editorAdapter?.isActive(itemId))
				{
					this.editorAdapter.restoreSelection(selection.value);
					this.editorAdapter.focus();

					return;
				}

				if (selection?.type === 'textarea')
				{
					layer?.focusTextarea();
					void this.$nextTick(() => layer?.setTextareaSelectionRange(selection.value));
				}
			});
		},
		getUpdatedItemLevel(itemId: number | string, updates: CheckListModel[]): ?number
		{
			const items: Map<string, CheckListModel> = new Map(
				this.checkLists.map((item: CheckListModel) => [String(item.id), item]),
			);
			updates.forEach((item: CheckListModel) => items.set(String(item.id), item));

			let current: ?CheckListModel = items.get(String(itemId));
			let level = 0;
			const visitedIds: Set<string> = new Set();
			while (current && current.parentId !== 0)
			{
				if (visitedIds.has(String(current.id)))
				{
					break;
				}
				visitedIds.add(String(current.id));
				current = items.get(String(current.parentId));
				if (!current)
				{
					return null;
				}
				level++;
			}

			return current ? level : null;
		},
		routeCheckListEscape(itemId: number | string, event: KeyboardEvent): boolean
		{
			if (!event || event.isComposing)
			{
				return false;
			}

			const mentionManager = this.getItemsRef(itemId)?.mentionManager;
			if (mentionManager?.isOpen?.() === true && mentionManager.closeIfOpen?.() === true)
			{
				this.suppressNextEscapeKeyUp();

				return true;
			}

			const editorOwnsItem = this.editorAdapter?.isActive(itemId) === true;
			const textarea = event.target instanceof HTMLTextAreaElement ? event.target : null;
			const textareaOwnsItem = textarea
				&& this.belongsToItem(textarea, itemId)
			;
			if (!editorOwnsItem && !textareaOwnsItem)
			{
				return false;
			}

			if (editorOwnsItem)
			{
				const layer = this.activeEditorLayer;
				const session = this.deactivateItemEditor('escape');
				layer?.commitEditorSession?.(session, event);
			}
			else
			{
				textarea?.blur();
			}

			this.closeActivePanel();
			this.suppressNextEscapeKeyUp();
			this.focusItemRow(itemId);

			return true;
		},
		handleItemEscape(event: KeyboardEvent, fromEditor: boolean = false): void
		{
			if (
				!fromEditor
				&& event.target instanceof Element
				&& event.target.closest('textarea, [contenteditable="true"]')
			)
			{
				return;
			}

			// The panel opens on a selection, not with the editor, so an item edited without a selection
			// stays reachable only through the active editor session.
			const item = this.panelState.activePanel === PanelType.Text
				? this.textPanelItem
				: this.checkListManager?.getItem?.(this.editorAdapter?.getActiveItemId());
			if (!item)
			{
				return;
			}

			const row = this.getItemRowNode(item.id);
			if (!row || !(event.target instanceof Node) || !row.contains(event.target))
			{
				return;
			}

			if (this.routeCheckListEscape(item.id, event))
			{
				event.preventDefault();
				event.stopPropagation();
			}
		},
		handlePanelTab({ itemId, event = null }: { itemId: number | string, event?: ?KeyboardEvent }): boolean
		{
			const queuePanelFocus = this.queuePanelFocus ?? CheckList.methods.queuePanelFocus;
			const handled = queuePanelFocus.call(this, itemId, event);

			if (handled)
			{
				event?.preventDefault();
			}

			return handled;
		},
		queuePanelFocus(itemId: number | string, event: ?KeyboardEvent): boolean
		{
			if (!this.entityPanelAvailable)
			{
				return false;
			}

			const item = this.checkListManager.getItem(itemId);
			if (!item)
			{
				return false;
			}
			const direction = event?.shiftKey ? 'backward' : 'forward';

			if (item?.groupMode?.selected === true)
			{
				if (!event)
				{
					return false;
				}

				if (event.shiftKey)
				{
					this.closeActivePanel();
					this.focusTabStopBeforeGroupModeCheckbox(itemId);

					return true;
				}

				const anchor = this.getItemEntityAnchor(itemId);
				const checkbox = this.getGroupModeCheckbox(itemId);
				this.openEntityPanel(itemId, PanelOpenSource.Keyboard, anchor, checkbox);
				this.applyPanelState(setPanelHold(this.panelState, 'focusInside', true));
				void this.$nextTick(() => {
					this.updateEntityPanelPosition();
					void this.$nextTick(() => {
						if (this.$refs.entityPanel?.focusFirstAction())
						{
							return;
						}
						this.applyPanelState(setPanelHold(this.panelState, 'focusInside', false));
						const nextTarget = this.getTabStopAfterItemPanel(itemId);
						this.closeActivePanel();
						nextTarget?.focus();
					});
				});

				return true;
			}

			if (this.isPreview)
			{
				if (!item || this.resolvePanelActions(item, ActionPlacement.Entity).length === 0)
				{
					return false;
				}

				const anchor = this.getItemEntityAnchor(itemId);
				const returnFocusElement = event?.target instanceof HTMLElement ? event.target : anchor;
				this.openEntityPanel(itemId, PanelOpenSource.Keyboard, anchor, returnFocusElement);
				this.applyPanelState(setPanelHold(this.panelState, 'focusInside', true));
				void this.$nextTick(() => {
					this.updateEntityPanelPosition();
					void this.$nextTick(() => {
						const focused = direction === 'backward'
							? this.$refs.entityPanel?.focusLastAction()
							: this.$refs.entityPanel?.focusFirstAction()
						;
						if (focused)
						{
							return;
						}
						this.applyPanelState(setPanelHold(this.panelState, 'focusInside', false));
						const nextTarget = direction === 'backward'
							? this.getTabStopBeforeItem(itemId)
							: this.getTabStopAfterItemPanel(itemId)
						;
						this.closeActivePanel();
						nextTarget?.focus();
					});
				});

				return true;
			}

			// No selection means no text panel to hand the focus to, so the route goes past it.
			if (
				this.panelState.activePanel !== PanelType.Text
				|| String(this.panelState.textItemId) !== String(itemId)
			)
			{
				this.routePastTextPanel(itemId, event?.target instanceof HTMLElement ? event.target : null);

				return true;
			}

			// The hold is set before the focus moves on purpose: the editor reports its collapsed
			// selection only afterwards, and the hold is what keeps that report from closing the
			// panel the focus is heading into. Moving this into $nextTick breaks the route.
			this.applyPanelState(setPanelHold(this.panelState, 'focusInside', true));
			void this.$nextTick(() => {
				this.updatePanelPosition();
				void this.$nextTick(() => {
					const focused = direction === 'backward'
						? this.$refs.panel?.focusLastAction()
						: this.$refs.panel?.focusFirstAction()
					;
					if (focused)
					{
						return;
					}
					this.applyPanelState(setPanelHold(this.panelState, 'focusInside', false));
					const currentItem = this.checkListManager.getItem(itemId);
					if (
						direction === 'forward' && currentItem
						&& currentItem.parentId !== 0
						&& this.resolvePanelActions(currentItem, ActionPlacement.Entity).length > 0
					)
					{
						this.handlePanelNavigate(ActionPlacement.Text, 'forward');

						return;
					}

					const nextTarget = direction === 'backward'
						? this.getTabStopBeforeItem(itemId)
						: this.getTabStopAfterItem(itemId)
					;
					this.closeActivePanel();
					nextTarget?.focus();
				});
			});

			return true;
		},
		routePastTextPanel(itemId: number | string, returnFocusElement: ?HTMLElement = null): void
		{
			const item = this.checkListManager.getItem(itemId);
			if (
				item
				&& item.parentId !== 0
				&& this.resolvePanelActions(item, ActionPlacement.Entity).length > 0
			)
			{
				this.enterEntityPanelByKeyboard(itemId, returnFocusElement ?? document.activeElement);

				return;
			}

			const nextTarget = this.getTabStopAfterItem(itemId);
			this.closeActivePanel();
			nextTarget?.focus();
		},
		enterEntityPanelByKeyboard(itemId: number | string, returnFocusElement: ?HTMLElement): void
		{
			const anchor = this.getItemEntityAnchor(itemId);
			this.openEntityPanel(itemId, PanelOpenSource.Keyboard, anchor, returnFocusElement);
			this.applyPanelState(setPanelHold(this.panelState, 'focusInside', true));
			void this.$nextTick(() => {
				this.updateEntityPanelPosition();
				void this.$nextTick(() => {
					if (this.$refs.entityPanel?.focusFirstAction())
					{
						return;
					}

					// The panel suppressed the native Tab before it emitted, so a panel that
					// refused the focus has to carry the move to the next tab stop itself.
					this.applyPanelState(setPanelHold(this.panelState, 'focusInside', false));
					const nextTarget = this.getTabStopAfterItem(itemId);
					this.closeActivePanel();
					nextTarget?.focus();
				});
			});
		},
		// Opening the entity panel records where the keyboard came from: a text panel action when a
		// selection raised that panel, the editor itself when routePastTextPanel() skipped it. The
		// recorded node keeps its ancestors after the panel unmounts, so the backward move reads the
		// route from it rather than ask the editor for a selection most browsers already dropped
		// when the focus left it.
		enteredEntityPanelFromTextPanel(): boolean
		{
			const returnTarget = this.panelState.returnFocusElement;

			return returnTarget instanceof Element
				&& returnTarget.closest(`[data-placement="${ActionPlacement.Text}"]`) !== null
			;
		},
		handlePanelFocusEnter(placement: string): void
		{
			if (this.panelState.activePanel === placement)
			{
				this.applyPanelState(setPanelHold(this.panelState, 'focusInside', true));
			}
		},
		handlePanelFocusLeave(placement: ?string, relatedTarget: ?Node = null): void
		{
			const editorItemId = this.editorAdapter?.getActiveItemId?.() ?? null;
			const editorLayer = this.activeEditorLayer;
			const editorBlurEvent = { relatedTarget: relatedTarget ?? document.activeElement };
			const finalizeEditorBlur = (): Object | null => {
				if (editorItemId === null || editorItemId === undefined)
				{
					return null;
				}

				const session = this.finalizeItemEditorBlur?.(editorItemId, editorBlurEvent) ?? null;
				editorLayer?.commitEditorSession?.(session, editorBlurEvent);

				return session;
			};

			if (!placement)
			{
				this.isFocusInItemPanel = false;
				this.hideItemPanel(this.itemId);
				if (!finalizeEditorBlur())
				{
					this.replayEmptyBlurAfterHold();
				}

				return;
			}

			if (this.panelState.activePanel !== placement)
			{
				return;
			}

			this.isFocusInItemPanel = false;
			this.applyPanelState(setPanelHold(this.panelState, 'focusInside', false));
			if (shouldClosePointerPanel(this.panelState))
			{
				this.hideEntityPanel();
			}
			else if (
				this.panelState.openSource === PanelOpenSource.Keyboard
				&& !this.panelState.popupOpen
			)
			{
				this.closeActivePanel();
			}
			finalizeEditorBlur();
		},
		handlePanelNavigate(placement: string, direction: 'forward' | 'backward'): void
		{
			const itemId = getActiveItemId(this.panelState);
			if (itemId === null || !this.entityPanelAvailable)
			{
				return;
			}

			if (placement === ActionPlacement.Text && direction === 'forward')
			{
				const item = this.checkListManager.getItem(itemId);
				if (item?.parentId === 0)
				{
					const nextTarget = this.getTabStopAfterItem(itemId);
					this.closeActivePanel();
					nextTarget?.focus();

					return;
				}

				const anchor = this.getItemEntityAnchor(itemId);
				const returnFocusElement = document.activeElement;
				const title: ?HTMLElement = anchor?.querySelector('textarea');
				this.suppressTitlePanelItemId = itemId;
				title?.focus({ preventScroll: true });
				this.enterEntityPanelByKeyboard(itemId, returnFocusElement);

				return;
			}

			if (placement === ActionPlacement.Entity && direction === 'backward')
			{
				if (this.checkListManager.getItem(itemId)?.groupMode?.selected === true)
				{
					this.returnFocusToGroupModeCheckbox(itemId);

					return;
				}

				if (this.isPreview)
				{
					this.returnFocusToPanelTrigger(itemId);

					return;
				}

				if (!this.enteredEntityPanelFromTextPanel())
				{
					this.returnFocusToItem(itemId);

					return;
				}

				// The hold goes on right after the panel opens and before the focus moves, for the
				// same reason the forward route does it: the editor reports its collapsed selection
				// in between, and the hold is what keeps that report from closing the panel the
				// focus is heading into. Opening the panel resets the holds, so the order is fixed.
				this.openTextPanel(itemId, PanelOpenSource.Keyboard, document.activeElement);
				this.applyPanelState(setPanelHold(this.panelState, 'focusInside', true));
				void this.$nextTick(() => {
					this.updatePanelPosition();
					void this.$nextTick(() => {
						if (this.$refs.panel?.focusLastAction())
						{
							return;
						}

						// Shift+Tab is suppressed in the panel as well, so the item the toolbar
						// belongs to is where the refused backward move lands.
						this.applyPanelState(setPanelHold(this.panelState, 'focusInside', false));
						this.returnFocusToItem(itemId);
					});
				});

				return;
			}

			if (direction === 'backward')
			{
				this.returnFocusToItem(itemId);

				return;
			}

			const nextTarget = this.getTabStopAfterItemPanel(itemId);
			this.closeActivePanel();
			nextTarget?.focus();
		},
		handlePanelEscape(): void
		{
			const itemId = getActiveItemId(this.panelState);
			if (itemId === null || !this.entityPanelAvailable)
			{
				return;
			}

			// The panel stops the keydown, but the popup around the checklist closes on the keyup and
			// takes it off the document before the panel is even in the path -- so an Escape the panel
			// has answered has to be taken off that keyup as well, the way an item Escape is.
			this.suppressNextEscapeKeyUp();

			if (this.checkListManager.getItem(itemId)?.groupMode?.selected === true)
			{
				this.returnFocusToGroupModeCheckbox(itemId);

				return;
			}

			if (this.isPreview)
			{
				this.returnFocusToPanelTrigger(itemId);

				return;
			}

			this.returnFocusToItem(itemId);
		},
		returnFocusToPanelTrigger(itemId: number | string): void
		{
			const trigger = this.panelState.returnFocusElement;
			this.closeActivePanel();

			// A row anchor and a button the panel is taking down both pass for connected, so only
			// the focus that actually landed counts as a return.
			if (this.tryFocusNode(trigger))
			{
				return;
			}

			this.focusItemRow(itemId);
		},
		returnFocusToItem(itemId: number | string): void
		{
			this.closeActivePanel();
			this.suppressTitlePanelItemId = itemId;
			this.focusToItem(itemId);
		},
		returnFocusToGroupModeCheckbox(itemId: number | string): void
		{
			this.closeActivePanel();
			this.focusGroupModeCheckbox(itemId);
		},
		exitItemEditing(itemId: number | string): void
		{
			this.closeActivePanel();
			this.focusItemRow(itemId);
		},
		focusItemRow(itemId: number | string): void
		{
			void this.$nextTick(() => {
				const item = this.checkListManager?.getItem?.(itemId);
				const itemNode = this.getItemRowNode(itemId);
				const selectors = item?.parentId === 0
					? ['.check-list-widget-parent-item', '[data-testid="tasks-check-list-child-item"]']
					: ['[data-testid="tasks-check-list-child-item"]', '.check-list-widget-parent-item']
				;
				const itemRow = selectors
					.map((selector: string) => (
						itemNode?.matches?.(selector) ? itemNode : itemNode?.querySelector(selector)
					))
					.find((node: ?Element) => node instanceof HTMLElement)
				;

				if (itemRow instanceof HTMLElement)
				{
					itemRow.focus({ preventScroll: true });
				}
			});
		},
		getItemEntityAnchor(itemId: number | string): ?HTMLElement
		{
			const row = this.getItemRowNode(itemId);

			return row?.querySelector('.check-list-widget-child-item-base') ?? row;
		},
		getTabStopAfterItem(itemId: number | string): ?HTMLElement
		{
			const row = this.getItemRowNode(itemId);
			if (!row)
			{
				return null;
			}

			return this.findTabStopAfter(row.querySelector('.tasks-check-list-formatting-layer') ?? row);
		},
		getTabStopBeforeItem(itemId: number | string): ?HTMLElement
		{
			const row = this.getItemRowNode(itemId);
			if (!row)
			{
				return null;
			}

			return this.findTabStopBefore(row.querySelector('.tasks-check-list-formatting-layer') ?? row);
		},
		getTabStopAfterItemRow(itemId: number | string): ?HTMLElement
		{
			const row = this.getItemRowNode(itemId);
			if (!row)
			{
				return null;
			}

			// A row leaving the tree takes its attachments with it, and they sit after the
			// formatting layer -- so the whole row, not just the layer, stays behind the walk.
			// Deleting the last item without the add button leaves the widget no stop at all,
			// and then the walk has to carry on into the card instead of dropping the focus.
			return this.findTabStopAfter(row) ?? this.findTabStopBeyondWidget(row);
		},
		getTabStopAfterItemPanel(itemId: number | string): ?HTMLElement
		{
			// In edit mode the formatting layer holds the textarea the panel was reached from, so
			// the whole layer stays behind the walk.
			if (!this.isPreview)
			{
				return this.getTabStopAfterItem(itemId);
			}

			const row = this.getItemRowNode(itemId);
			if (!row)
			{
				return null;
			}

			// In preview the layer is a read-only render carrying real links, and they come after
			// the panel in the forward order -- only the checkbox that opened it is behind us.
			const checkbox = row.querySelector('[data-testid="tasks-check-list-child-item-checkbox"]');

			// Preview hides the checklist footer, so the last item has no stop left inside the
			// widget: the suppressed Tab has to carry on into the card as it did before the panel.
			return this.findTabStopAfter(checkbox ?? row) ?? this.findTabStopBeyondWidget(row);
		},
		findTabStopAfter(origin: HTMLElement): ?HTMLElement
		{
			const selector = 'textarea, button, input, select, a[href], [tabindex]:not([tabindex="-1"])';
			for (const node of this.$refs.wrapper?.querySelectorAll(selector) ?? [])
			{
				const follows = (origin.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING) > 0;
				if (
					follows
					&& !origin.contains(node)
					&& !node.disabled
					&& node.offsetParent !== null
					// The panels sit in the wrapper after the list, and a button of the panel the
					// caller is about to close is no tab stop to move on to.
					&& node.closest('.check-list-widget-item-panel') === null
				)
				{
					return node;
				}
			}

			return null;
		},
		findTabStopBefore(origin: HTMLElement): ?HTMLElement
		{
			const candidates = [...document.querySelectorAll(FocusNavigator.FOCUSABLE_SELECTOR)];

			return candidates
				.filter((node: HTMLElement) => {
					return (
						(node.compareDocumentPosition(origin) & Node.DOCUMENT_POSITION_FOLLOWING) > 0
						&& !node.contains(origin)
						&& node.closest('.check-list-widget-item-panel') === null
						&& node.closest('[aria-hidden="true"]') === null
						&& node.offsetParent !== null
						&& this.isTreeTabStop(node)
					);
				})
				.at(-1) ?? null
			;
		},
		findTabStopBeyondWidget(origin: HTMLElement): ?HTMLElement
		{
			const wrapper = this.$refs.wrapper;
			for (const node of document.querySelectorAll(FocusNavigator.FOCUSABLE_SELECTOR))
			{
				const follows = (origin.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING) > 0;
				if (
					follows
					&& !wrapper?.contains(node)
					&& node.closest('.check-list-widget-item-panel') === null
					&& node.closest('[aria-hidden="true"]') === null
					&& node.offsetParent !== null
					&& this.isTreeTabStop(node)
				)
				{
					return node;
				}
			}

			return null;
		},
		handleListKeydown(event: KeyboardEvent): void
		{
			if (event.key !== 'Tab' || event.shiftKey)
			{
				return;
			}

			if (!this.itemPanelIsShown || !this.$refs.panel)
			{
				return;
			}

			if (!this.isCurrentItemTextarea(event.target))
			{
				return;
			}

			// Claim the panel before moving focus: focusing the toolbar blurs the textarea,
			// and handleBlur must already see the claim so it does not hide the panel.
			this.isFocusInItemPanel = true;
			if (this.$refs.panel.focusFirstAction())
			{
				event.preventDefault();
			}
			else
			{
				this.isFocusInItemPanel = false;
			}
		},
		isCurrentItemTextarea(node: ?HTMLElement): boolean
		{
			// The bridge belongs to the item that owns the panel; a textarea from any
			// other row keeps the native tab order.
			return (
				node?.tagName === 'TEXTAREA'
				&& Boolean(this.currentItem)
				&& this.belongsToItem(node, this.currentItem.id)
			);
		},
		handlePanelReturnFocus(): void
		{
			this.isFocusInItemPanel = false;
			this.focusToItem(this.itemId);
		},
		replayEmptyBlurAfterHold(): void
		{
			// The item editor blurred into the held toolbar, so its empty blur was refused and
			// no second one will come -- the editor is not focused anymore. Leaving the toolbar
			// is the last moment to answer it, unless the item is alive after all.
			if (!this.currentItem || !this.isCurrentItemEmpty())
			{
				return;
			}

			if (this.belongsToItem(document.activeElement, this.itemId))
			{
				return;
			}

			this.handleEmptyBlur(this.itemId);
		},
		handlePanelFocusForward(): void
		{
			// The toolbar is a sibling of the footer, so a native Tab out of it lands
			// past the whole tree. Resume the tree flow at the stop that follows the
			// item the toolbar belongs to.
			const target = this.getTabStopAfterCurrentItem() ?? this.getFooterTabStop();

			// The toolbar suppresses the native Tab in any case, so leaving it with no stop
			// to move on to would strand focus on the body. An item that is still there takes
			// focus back; one that is gone has nothing to hold it, and the panel goes down.
			if (!target && this.getItemsRef(this.itemId))
			{
				this.handlePanelReturnFocus();

				return;
			}

			this.handlePanelFocusLeave();

			target?.focus();
		},
		belongsToItem(node: ?HTMLElement, itemId: ?number | string): boolean
		{
			return node?.closest?.('[data-id]')?.dataset.id === String(itemId);
		},
		getItemRowNode(itemId: ?number | string): ?HTMLElement
		{
			return this.$refs.list?.querySelector(`[data-id="${CSS.escape(String(itemId))}"]`) ?? null;
		},
		getItemEditorNode(itemId: ?number | string): ?HTMLElement
		{
			// The editor swaps its textarea for a read-only view of a long item or one
			// with links as soon as focus leaves it, so the walk anchors on the container
			// that holds both, which the row keeps either way.
			return [...(this.getItemRowNode(itemId)?.querySelectorAll('.tasks-check-list-formatting-layer') ?? [])]
				.find((editor: HTMLElement) => this.belongsToItem(editor, itemId)) ?? null
			;
		},
		isTreeTabStop(node: HTMLElement): boolean
		{
			return InteractivityChecker.isTabbable(node) || isVisuallyHiddenTabStop(node);
		},
		getTabStopAfterCurrentItem(): ?HTMLElement
		{
			const row = this.getItemRowNode(this.currentItem?.id);
			if (!row)
			{
				return null;
			}

			// Resume after the item's OWN editor rather than after the whole row: a
			// root row wraps its subtree, so skipping the row would jump over the
			// checklist header controls, and skipping the editor only would jump over
			// what the row renders below its text (attached files).
			const origin = this.getItemEditorNode(this.currentItem.id) ?? row;

			// The walk is in document order, so the first node that follows the origin and
			// is a tab stop is the answer. Position is a cheap comparison and the tab stop
			// check reads style, hence the order: nothing before the origin is ever checked.
			for (const node of this.$refs.list?.querySelectorAll(FocusNavigator.FOCUSABLE_SELECTOR) ?? [])
			{
				const follows = (origin.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING) > 0;

				if (follows && !origin.contains(node) && this.isTreeTabStop(node))
				{
					return node;
				}
			}

			return null;
		},
		getFooterTabStop(): ?HTMLElement
		{
			// The footer sits under v-show, so its button survives in the DOM while hidden
			// and focusing it would leave focus on the body.
			return [...(this.$refs.wrapper?.querySelectorAll('.tasks-check-list-footer button') ?? [])]
				.find((node: HTMLElement) => InteractivityChecker.isTabbable(node)) ?? null
			;
		},
		handleEmptyBlur(itemId: number | string): void
		{
			this.itemId = itemId;

			if (this.currentItem.parentId === 0)
			{
				this.setDefaultCheckListTitle(itemId);

				return;
			}

			if (this.hasItemFiles(this.currentItem))
			{
				return;
			}

			if (!this.isItemPanelHeld)
			{
				this.removeItem(itemId);
			}
		},
		handleFormattingSelectionChange(itemId: number | string, actions: string[]): void
		{
			if (!this.currentItem || String(this.currentItem.id) !== String(itemId))
			{
				return;
			}

			this.selectedFormattingActions = actions;
		},
		async handleGroupMode(itemId: number | string): Promise<void>
		{
			this.itemId = itemId;

			this.cancelGroupMode();
			const firstChild = this.checkListManager.getFirstVisibleChild(itemId);
			if (!firstChild)
			{
				return;
			}

			const editor = this.getItemRowNode(firstChild.id)?.querySelector(
				'textarea, [contenteditable="true"]',
			);
			if (editor instanceof HTMLElement)
			{
				editor.blur();
				await this.$nextTick();
			}

			await this.activateGroupMode(itemId);
			await this.$nextTick();

			// The checkbox is the first tab stop of the mode either way: the click that opens the
			// menu already takes the editor down, so waiting for a rendered editor here left the
			// focus on the menu button and the freshly rendered checkboxes unreachable.
			this.focusGroupModeCheckbox(firstChild.id);
		},
		async handleGroupModeSelected(itemId: number | string): Promise<void>
		{
			this.itemId = itemId;

			await this.$nextTick();

			if (!this.hasActiveGroupMode() || this.checkListManager.getAllSelectedItems().length > 0)
			{
				return;
			}

			this.closeActivePanel();
			this.deactivateGroupMode();
		},
		showEntityPanelProgrammatically(itemId: number | string): void
		{
			const item = this.checkListManager.getItem(itemId);
			if (!item || item.parentId === 0)
			{
				return;
			}

			const anchor = this.getItemEntityAnchor(itemId);
			const returnFocusElement = this.getGroupModeCheckbox(itemId) ?? anchor;
			this.openEntityPanel(itemId, PanelOpenSource.Programmatic, anchor, returnFocusElement);
			void this.$nextTick(() => this.updateEntityPanelPosition());
		},
		getGroupModeCheckbox(itemId: number | string): ?HTMLElement
		{
			const checkbox = this.getItemRowNode(itemId)
				?.querySelector('[data-testid="tasks-check-list-child-item-group-checkbox"] input');

			return checkbox instanceof HTMLElement ? checkbox : null;
		},
		focusTabStopBeforeGroupModeCheckbox(itemId: number | string): void
		{
			const checkbox = this.getGroupModeCheckbox(itemId);
			const candidates = [...(this.$refs.wrapper?.querySelectorAll(FocusNavigator.FOCUSABLE_SELECTOR) ?? [])];
			const previous = candidates
				.filter((node: HTMLElement) => {
					return (
						checkbox
						&& (node.compareDocumentPosition(checkbox) & Node.DOCUMENT_POSITION_FOLLOWING) > 0
						&& node.closest('.check-list-widget-item-panel') === null
						&& node.closest('[aria-hidden="true"]') === null
						&& this.isTreeTabStop(node)
					);
				})
				.at(-1);
			const fallback = this.getItemRowNode(itemId)
				?.closest('.check-list-widget-item.--parent')
				?.querySelector('[data-testid="tasks-check-list-parent-item-menu-btn"]');

			(previous ?? fallback)?.focus({ preventScroll: true });
		},
		focusGroupModeCheckbox(itemId: number | string): void
		{
			this.getGroupModeCheckbox(itemId)?.focus({ preventScroll: true });
		},
		handlePanelAction({ action, itemId, node, placement }: {
			action: string,
			itemId: number | string,
			node: HTMLElement,
			placement: string,
		}): void
		{
			const item = this.checkListManager?.getItem?.(itemId) ?? this.currentItem;
			if (!item || (placement === ActionPlacement.Entity && item.parentId === 0))
			{
				return;
			}
			if (itemId === undefined)
			{
				const selectedItems = item.groupMode?.selected === true
					? this.checkListManager.getAllSelectedItems()
					: []
				;
				CheckList.methods.dispatchPanelAction.call(this, action, item, node, selectedItems);

				return;
			}

			const descriptor = getActionDescriptor(action);
			if (!descriptor)
			{
				return;
			}

			if (descriptor.interaction.holdPanel && this.panelState)
			{
				this.applyPanelState(setPanelHold(this.panelState, 'popupOpen', true));

				// Only a panel held open outlives the click: every other action lets Vue unmount
				// the button next tick, so remembering it would return focus to the body.
				this.panelState = { ...this.panelState, returnFocusElement: node };
			}
			const selectedItems = item.groupMode?.selected === true
				? this.checkListManager.getAllSelectedItems()
				: []
			;
			descriptor.handle({
				item,
				trigger: node,
				dispatch: (registeredAction, registeredItem, trigger) => {
					this.dispatchPanelAction(registeredAction, registeredItem, trigger, selectedItems);
				},
			});
		},
		dispatchPanelAction(
			action: string,
			item: CheckListModel,
			node: HTMLElement,
			selectedItems: CheckListModel[],
		): void
		{
			if (this.isFormattingAction(action))
			{
				this.handleFormattingAction(action, item, node);

				return;
			}

			const actionHandlers = {
				[PanelAction.SetImportant]: () => this.setImportant(item, selectedItems),
				[PanelAction.AttachFile]: () => this.attachFile(node, item),
				[PanelAction.MoveRight]: () => this.moveGroupToRight(item, selectedItems),
				[PanelAction.MoveLeft]: () => this.moveGroupToLeft(item, selectedItems),
				[PanelAction.MoveItemUp]: () => this.reorderItem(item, 'up'),
				[PanelAction.MoveItemDown]: () => this.reorderItem(item, 'down'),
				[PanelAction.AssignAccomplice]: (n) => {
					if (!this.isItemPanelActionPopupShown)
					{
						this.showParticipantDialog(n, 'accomplices', item, selectedItems);
					}
				},
				[PanelAction.AssignAuditor]: (n) => {
					if (!this.isItemPanelActionPopupShown)
					{
						this.showParticipantDialog(n, 'auditors', item, selectedItems);
					}
				},
				[PanelAction.Forward]: (n) => this.forward(n, item, selectedItems),
				[PanelAction.Delete]: () => this.delete(item, selectedItems),
				[PanelAction.Cancel]: () => this.cancelGroupMode(item),
			};

			// The panel emits and forgets, so a rejected async handler must not escape unhandled.
			void actionHandlers[action]?.(node)?.catch?.((error) => {
				console.error('tasks: check-list panel action failed', error);
			});
		},
		handleEntityPanelAction(data): void
		{
			this.handlePanelAction(data);
		},
		isFormattingAction(action: string): boolean
		{
			return [
				PanelAction.Bold,
				PanelAction.Italic,
				PanelAction.Underline,
				PanelAction.Strikethrough,
				PanelAction.Link,
			].includes(action);
		},
		handleFormattingAction(action: string, item: CheckListModel, node: HTMLElement): void
		{
			if (item instanceof HTMLElement)
			{
				node = item;
				item = this.currentItem;
			}
			if (!item)
			{
				return;
			}

			if (action === PanelAction.Link)
			{
				this.savedRange = (
					this.getItemsRef(item.id)?.$refs.growingTextArea?.getTextareaSelectionRange()
					?? null
				);
				this.isItemPanelActionPopupShown = true;
				this.linkPopupBindElement = node;
				this.linkPopupItemId = item.id;
				this.applyPanelState(setPanelHold(this.panelState, 'popupOpen', true));

				return;
			}

			this.applyFormatting(action, item, node);
		},
		applyFormatting(
			action: string,
			item: CheckListModel | HTMLElement,
			node: ?HTMLElement = null,
			url: string = '',
		): void
		{
			if (item instanceof HTMLElement)
			{
				url = node ?? '';
				node = item;
				item = this.currentItem;
			}

			if (!item || item.actions?.modify !== true || item.groupMode?.selected === true)
			{
				return;
			}

			this.getItemsRef(item.id)?.applyFormatting(action, node, url);
		},
		handleLinkPopupApply(url: string): void
		{
			this.restoreSavedRange();

			if (this.linkPopupItemId === undefined)
			{
				this.applyFormatting(PanelAction.Link, this.linkPopupBindElement, url);
			}
			else
			{
				const item = this.checkListManager?.getItem?.(this.linkPopupItemId) ?? this.currentItem;
				if (item)
				{
					this.applyFormatting(PanelAction.Link, item, this.linkPopupBindElement, url);
				}
			}

			this.closeLinkPopup();

			// The link lands in the item text, so focus follows it into the editor, where
			// the formatting layer restores the caret, instead of going to the toolbar.
			this.restoreFocusAfterPopup();
		},
		restoreSavedRange(): void
		{
			if (!this.savedRange)
			{
				return;
			}

			this.getItemsRef(this.linkPopupItemId ?? this.currentItem?.id)
				?.$refs.growingTextArea
				?.setTextareaSelectionRange(this.savedRange);
		},
		handleLinkPopupClose(): void
		{
			const itemId = this.linkPopupItemId ?? this.currentItem?.id;
			const selection = this.savedRange;
			const bindElement = this.closeLinkPopup();
			const formattingLayer = this.getItemsRef(itemId)?.$refs.growingTextArea;
			if (selection && Type.isFunction(formattingLayer?.setTextareaSelectionRange))
			{
				formattingLayer.setTextareaSelectionRange(selection);
				this.focusToItem(itemId);

				return;
			}

			this.focusLinkPopupBindElement(bindElement);
		},
		closeLinkPopup(): ?HTMLElement
		{
			const bindElement = this.linkPopupBindElement;

			this.linkPopupBindElement = null;
			this.linkPopupItemId = null;
			this.isItemPanelFreeze = false;
			this.isItemPanelActionPopupShown = false;
			this.savedRange = null;
			if (this.panelState)
			{
				this.applyPanelState(setPanelHold(this.panelState, 'popupOpen', false));
			}

			return bindElement;
		},
		restorePanelFocus(itemId: number | string): void
		{
			const trigger = this.panelState.returnFocusElement;
			if (trigger?.isConnected && !trigger.disabled)
			{
				trigger.focus();

				return;
			}

			const panel = this.panelState.activePanel === PanelType.Text ? this.$refs.panel : this.$refs.entityPanel;
			if (panel?.focusFirstAction())
			{
				return;
			}

			// In preview the item has no textarea to come back to, so the fallback is the row.
			if (this.isPreview)
			{
				this.returnFocusToPanelTrigger(itemId);

				return;
			}

			this.returnFocusToItem(itemId);
		},
		focusLinkPopupBindElement(bindElement: ?HTMLElement): void
		{
			const generation = ++this.linkPopupFocusGeneration;
			const testId = bindElement?.dataset?.testid;
			let framesLeft = linkPopupFocusRestoreFrameLimit;
			const restoreFocus = (): void => {
				this.linkPopupFocusFrameId = null;
				// Only this instance's popup is worth waiting for: a link popup opened in another
				// checklist on the page would hold the walk until the frame budget runs out and
				// leave the focus behind.
				if (document.getElementById(this.linkPopupId))
				{
					framesLeft--;
					if (framesLeft > 0)
					{
						this.linkPopupFocusFrameId = requestAnimationFrame(restoreFocus);
					}

					return;
				}

				void this.$nextTick(() => {
					let currentBindElement = null;
					if (this.panelState)
					{
						const panel = this.panelState?.activePanel === PanelType.Text
							? this.$refs.panel
							: this.$refs.entityPanel
						;
						currentBindElement = panel?.$el?.querySelector?.(
							`[data-testid="${CSS.escape(testId ?? '')}"]`,
						);
					}
					if (!currentBindElement && bindElement?.isConnected === true)
					{
						currentBindElement = bindElement;
					}
					if (!this.tryFocusNode(currentBindElement))
					{
						this.placeFocusAfterPopup();
					}
				});
			};

			if (this.linkPopupFocusFrameId !== null)
			{
				cancelAnimationFrame(this.linkPopupFocusFrameId);
			}
			void this.$nextTick(() => {
				if (this.isUnmounted || generation !== this.linkPopupFocusGeneration)
				{
					return;
				}
				this.linkPopupFocusFrameId = requestAnimationFrame(restoreFocus);
			});
		},
		restoreFocusAfterPopup(triggerNode: ?HTMLElement = null): void
		{
			void this.$nextTick(() => this.placeFocusAfterPopup(triggerNode));
		},
		restoreFocusAfterMenu(triggerNode: ?HTMLElement = null): void
		{
			void this.$nextTick(() => {
				if (!this.hasFocusOwner())
				{
					this.placeFocusAfterPopup(triggerNode);
				}
			});
		},
		hasFocusOwner(): boolean
		{
			const active = document.activeElement;
			const isOrphanFocus = !active || active === document.body || active === document.documentElement;

			return !isOrphanFocus && active.isConnected;
		},
		placeFocusAfterPopup(triggerNode: ?HTMLElement): void
		{
			if (this.tryFocusNode(triggerNode))
			{
				return;
			}

			// The editor swaps itself for a read-only display layer, so it is the item
			// component, not its textarea node, that tells whether the row is alive.
			if (this.getItemsRef(this.itemId))
			{
				// In preview the item has no textarea to come back to, so the fallback is the row.
				if (this.isPreview)
				{
					this.focusItemRow(this.itemId);

					return;
				}

				this.focusToItem(this.itemId);

				return;
			}

			// Neither the trigger nor the item outlived the popup: resume the tree flow
			// after the item and take the orphaned panel down, so focus is never left
			// on the body.
			this.handlePanelFocusForward();
		},
		tryFocusNode(node: ?HTMLElement): boolean
		{
			if (node?.isConnected !== true)
			{
				return false;
			}

			node.focus({ preventScroll: true });

			// updatePanelPosition hides the toolbar for a row at the edge of the list, and
			// focusing a hidden element is a no-op -- report it so the caller falls back.
			return document.activeElement === node;
		},
		handleOpenCheckList(checkListId: number | string): void
		{
			this.cleanNotifiers();
			this.cleanCollapsedState();

			this.$emit('open', checkListId);
		},
		updateCheckList(id: number | string, fields: Partial<CheckListModel>): Promise<void>
		{
			return this.$store.dispatch(`${Model.CheckList}/update`, { id, fields });
		},
		async updateTask(fields: Partial<TaskModel>): Promise<void>
		{
			return taskService.updateStoreTask(this.taskId, fields);
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
			if (!this.isDemoCheckListModified())
			{
				this.removeChecklists();
			}

			if (this.checkListChangeTracker.hasChanges() && this.isEdit)
			{
				// Deleting items and their children are filtered inside checkListService.save() (#excludeDeletingItems)
				const saveResult = await checkListService.save(this.taskId, this.checkLists);

				const hasUnresolvedConflicts = checkListService
					.getPullConflicts()
					.some((conflict) => conflict.taskId === this.taskId);
				if (hasUnresolvedConflicts)
				{
					return;
				}

				if (saveResult?.hasDeferred)
				{
					return;
				}
			}

			this.checkListChangeTracker.reset();
		},
		async savePreviewChanges(): Promise<void>
		{
			if (!this.isPreview || !this.isEdit)
			{
				return;
			}

			// Nothing closes in preview, so this is the only save the action gets: a change left
			// behind stays on screen and turns out lost only after the card is reloaded.
			if (this.hasUnfilledCheckListItems())
			{
				CheckListNotifier.notifySaveBlockedByEmptyItem();

				return;
			}

			try
			{
				await checkListService.save(this.taskId, this.checkLists);
			}
			catch (error)
			{
				console.error('tasks: check-list preview save failed', error);
				CheckListNotifier.notifySaveFailed();
			}
		},
		isDemoCheckListModified(): boolean
		{
			if (this.getCheckListsNumber() > 1)
			{
				return true;
			}

			const [checkList] = this.checkLists;
			if (!checkList)
			{
				return true;
			}

			const demoTitle = this.loc('TASKS_V2_CHECK_LIST_TITLE_NUMBER', { '#number#': 1 });

			return (
				checkList.title !== demoTitle
				|| this.checkListManager.getChildren(checkList.id).length > 0
				|| this.hasItemUsers(checkList)
				|| this.hasItemFiles(checkList)
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

			const checklist = [...this.task.checklist, parentId];

			const items = [this.getDataForNewCheckList(parentId)];
			if (!empty)
			{
				items.push({
					id: childId,
					nodeId: childId,
					parentId,
					parentNodeId: parentId,
					sortIndex: 0,
				});

				checklist.push(childId);
			}

			await this.insertManyCheckLists(items);
			await this.updateTask({ checklist });
			if (!empty && !this.isPreview)
			{
				this.focusToItem(childId);
			}

			return parentId;
		},
		async addFastCheckList(): void
		{
			const checkListId = await this.addCheckList();
			const firstItemId = this.checkListManager.getChildWithEmptyTitle(checkListId)?.id ?? checkListId;

			this.handleOpenCheckList(firstItemId);
		},
		showForwardMenu(node: HTMLElement): void
		{
			if (this.forwardContextItem === null)
			{
				return;
			}

			this.forwardBindElement = node;

			// The menu opens above the field, so the toolbar must outlive it: unclaimed,
			// the blurred item tears the panel down together with the very button the
			// menu returns focus to.
			this.isItemPanelActionPopupShown = true;

			this.isForwardMenuShown = true;
			if (this.panelState)
			{
				this.applyPanelState(setPanelHold(this.panelState, 'popupOpen', true));
			}
		},
		handleForwardMenuClose(): void
		{
			if (!this.isForwardMenuShown)
			{
				return;
			}

			const bindElement = this.forwardBindElement;
			if (this.closeForwardMenu)
			{
				this.closeForwardMenu(false);
			}
			else
			{
				this.isForwardMenuShown = false;
				this.forwardBindElement = null;
			}
			this.isItemPanelActionPopupShown = false;
			this.restoreFocusAfterMenu(bindElement);
		},
		closeForwardMenu(restoreFocus: boolean = true): void
		{
			const itemId = this.forwardContextItemId;

			this.isForwardMenuShown = false;
			this.applyPanelState(setPanelHold(this.panelState, 'popupOpen', false));
			this.forwardBindElement = null;
			this.forwardContextItemId = null;
			this.forwardSelectedItemIds = [];
			if (restoreFocus && itemId !== null && this.checkListManager.getItem(itemId))
			{
				this.restorePanelFocus(itemId);
			}
		},
		handleForwardMenuSelect(checkList: CheckListModel): void
		{
			const contextItem = this.forwardContextItem;
			if (!contextItem)
			{
				this.closeForwardMenu(false);

				return;
			}

			this.closeActivePanel();
			const selectedItems = this.forwardSelectedItemIds
				.map((id) => this.checkListManager.getItem(id))
				.filter(Boolean)
			;
			if (selectedItems.length > 0)
			{
				void this.forwardGroupItemsToChecklist(contextItem.id, checkList.id, selectedItems);
			}
			else
			{
				void this.forwardToChecklist(contextItem.id, checkList.id);
			}
		},
		handleForwardMenuCreateNew(): void
		{
			const contextItem = this.forwardContextItem;
			if (!contextItem)
			{
				this.closeForwardMenu(false);

				return;
			}

			const selectedItems = this.forwardSelectedItemIds
				.map((id) => this.checkListManager.getItem(id))
				.filter(Boolean)
			;
			void this.forwardToNewChecklist(contextItem.id, selectedItems);
		},
		getCheckListsNumber(): number
		{
			return this.checkLists.filter((checklist: CheckListModel) => {
				return checklist.parentId === 0 && !this.deletingCheckListIds[checklist.id];
			}).length;
		},
		getDataForNewCheckList(parentId: string): CheckListModel
		{
			return {
				id: parentId,
				nodeId: parentId,
				parentId: 0,
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
			if (ref && this.pendingFocusItemId === id)
			{
				this.schedulePendingItemFocus(id, ref, this.pendingFocusToken);
			}
		},
		getItemsRef(id): Object
		{
			return this.itemsRefs[id];
		},
		focusToItem(itemId: number | string, highlight: boolean = false): void
		{
			this.pendingFocusItemId = itemId;
			this.pendingFocusHighlight = highlight;
			this.pendingFocusToken++;
			const token = this.pendingFocusToken;

			const itemRef = this.getItemsRef(itemId);
			if (itemRef)
			{
				this.schedulePendingItemFocus(itemId, itemRef, token);
			}

			void this.$nextTick(() => {
				if (
					token === this.pendingFocusToken
					&& itemId === this.pendingFocusItemId
					&& !this.getItemsRef(itemId)
				)
				{
					this.pendingFocusItemId = null;
					this.pendingFocusHighlight = false;
				}
			});
		},
		schedulePendingItemFocus(itemId: number | string, itemRef: Object, token: number): void
		{
			void this.$nextTick(() => {
				if (
					token !== this.pendingFocusToken
					|| itemId !== this.pendingFocusItemId
					|| itemRef !== this.getItemsRef(itemId)
				)
				{
					return;
				}

				const formattingLayer = itemRef.$refs.growingTextArea;
				if (!formattingLayer)
				{
					this.pendingFocusItemId = null;
					this.pendingFocusHighlight = false;

					return;
				}

				const highlight = this.pendingFocusHighlight;
				this.pendingFocusItemId = null;
				this.pendingFocusHighlight = false;
				formattingLayer.focusTextarea();
				if (highlight)
				{
					void highlighter.highlight(itemRef.$refs.item);
				}
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
			const parentId = this.currentItem.parentId;

			this.resortItemsAfterIndex(parentId, sort);

			this.insertItem(parentId, childId, sort);
		},
		async addItemFromBtn(checkListId: number | string): Promise<void>
		{
			if (this.hasActiveGroupMode())
			{
				return;
			}

			const activeItemId = this.editorAdapter?.getActiveItemId?.();
			if (activeItemId !== null && activeItemId !== undefined)
			{
				const editorLayer = this.activeEditorLayer;
				const session = this.deactivateItemEditor('add-item');
				editorLayer?.commitEditorSession?.(session);
				await this.$nextTick();
			}

			const childId = Text.getRandom();
			const sortIndex = this.checkListManager.getChildren(checkListId).length;

			await this.insertItem(checkListId, childId, sortIndex);
			if (this.isPreview)
			{
				this.handleOpenCheckList(childId);
			}
		},
		async insertItem(parentId: number, childId: number, sortIndex: number): Promise<void>
		{
			const parentItem = parentId ? this.checkListManager.getItem(parentId) : null;
			await this.insertCheckList({
				id: childId,
				nodeId: childId,
				parentId,
				parentNodeId: parentItem ? parentItem.nodeId : null,
				sortIndex,
			});
			await this.updateTask({ checklist: [...this.task.checklist, childId] });
			if (!this.isPreview)
			{
				this.focusToItem(childId);
			}
		},
		removeItem(id: number | string, isRootCall: boolean = true): void
		{
			if (!this.task)
			{
				return;
			}

			const item = this.checkListManager.getItem(id);
			if (!item)
			{
				return;
			}

			const children = this.checkListManager.getChildren(item.id);

			if (children.length > 0)
			{
				children.forEach((child: CheckListModel) => {
					this.removeItem(child.id, false);
				});
			}

			const checkListIds = this.task.checklist.filter((itemId) => itemId !== item.id);
			void this.updateTask({
				containsChecklist: checkListIds.length > 0,
				checklist: checkListIds,
			});
			void this.deleteCheckList(item.id);

			if (isRootCall)
			{
				this.resortItemsOnLevel(item.parentId);
			}

			fileService.delete(item.id, EntityTypes.CheckListItem);
		},
		addItemToDelete(itemId: number | string): void
		{
			this.addCheckListItemToDeleting(itemId);
		},
		removeItemFromDelete(itemId: number | string): void
		{
			this.removeCheckListItemFromDeleting(itemId);

			if (!this.isPreview || !this.isEdit || !Type.isNumber(itemId))
			{
				return;
			}

			// The row is already gone from the screen, so a save that never happens leaves the item
			// deleted here and alive on the server until the card is reloaded. An empty item blocks
			// the request, and silence about it reads as a saved deletion.
			if (this.hasUnfilledCheckListItems())
			{
				CheckListNotifier.notifySaveBlockedByEmptyItem();

				return;
			}

			checkListService.delete(this.taskId, itemId).catch((error) => {
				console.error('tasks: check-list preview delete failed', error);
				CheckListNotifier.notifySaveFailed();
			});
		},
		hasUnfilledCheckListItems(): boolean
		{
			return this.checkLists.some((item: CheckListModel) => !Type.isStringFilled(item.title));
		},
		resortItemsAfterIndex(parentId: number | string, sortIndex: number): void
		{
			this.checkListManager.resortItemsAfterIndex(
				parentId,
				sortIndex,
				(updates: CheckListModel[]) => {
					if (updates.length > 0)
					{
						void this.upsertCheckLists(updates);
					}
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
		async reorderItem(item: CheckListModel, direction: 'up' | 'down'): Promise<void>
		{
			if (!item?.actions?.modify || item.parentId === 0 || item.groupMode?.selected)
			{
				return;
			}

			// the panel drops this promise, so nothing here may escape as an unhandled rejection
			try
			{
				const method = direction === 'up' ? 'moveItemUp' : 'moveItemDown';
				let updatePromise = Promise.resolve();
				const result = this.checkListManager[method](
					item,
					(updates: CheckListModel[]) => {
						updatePromise = this.upsertCheckLists(updates);

						return updatePromise;
					},
				);

				if (!result)
				{
					const phrase = direction === 'up'
						? 'TASKS_V2_CHECK_LIST_MOVE_BOUNDARY_START'
						: 'TASKS_V2_CHECK_LIST_MOVE_BOUNDARY_END';
					LiveAnnouncer.announce(this.loc(phrase), 'polite');

					return;
				}

				await updatePromise;

				LiveAnnouncer.announce(
					this.loc('TASKS_V2_CHECK_LIST_MOVE_ITEM_POSITION', {
						'#position#': result.position,
						'#total#': result.total,
					}),
					'polite',
				);

				void this.$nextTick(() => {
					this.updatePanelPosition();
					this.updateEntityPanelPosition();
				});

				await this.savePreviewChanges();
			}
			catch (error)
			{
				console.error('tasks: check-list reorder failed', error);
			}
		},
		showItemPanel(
			itemId: number | string,
			source: PanelOpenSourceValue = PanelOpenSource.Programmatic,
			returnFocusElement: ?HTMLElement = null,
		): void
		{
			if (this.isPreview)
			{
				return;
			}

			this.openTextPanel(itemId, source, returnFocusElement);
		},
		hideItemPanel(itemId: number | string): void
		{
			if (this.isPreview)
			{
				return;
			}

			if (this.hasActiveGroupMode() && this.checkListManager.getAllSelectedItems().length === 0)
			{
				this.deactivateGroupMode();
			}

			if (this.panelState.activePanel === PanelType.Text)
			{
				this.closeActivePanel();
			}

			this.isFocusInItemPanel = false;
		},
		showItemPanelOnNearestSelectedItem(itemId: number | string): void
		{
			const nearestSelectedItem = this.checkListManager.findNearestItem(this.currentItem, true);
			if (nearestSelectedItem)
			{
				this.showEntityPanelProgrammatically(nearestSelectedItem.id);
			}
			else
			{
				this.closeActivePanel();
				this.deactivateGroupMode();
			}
		},
		updatePanelPosition()
		{
			// While the button is held nothing recomputes the place, whichever caller asks for a frame;
			// it is taken once, on the release. A panel that a hold keeps open stands still as well.
			if (this.isSelectingWithPointer)
			{
				return;
			}

			if (this.itemPanelIsShown === false || !this.textPanelItem)
			{
				return;
			}

			const list = this.$refs.list;
			const panel = this.$refs.panel?.$el;
			if (!list || !panel)
			{
				return;
			}

			const itemRef = list.querySelector([`[data-id="${this.textPanelItem.id}"]`]);
			if (!itemRef)
			{
				return;
			}

			const panelRect = Dom.getPosition(panel);
			const panelBox = {
				width: panelRect.width === 0 ? 304 : panelRect.width,
				height: panelRect.height === 0 ? 48 : panelRect.height,
			};

			const placement = this.getSelectionPanelPlacement(list, itemRef, panelBox)
				?? this.getRowEdgePanelPlacement(list, itemRef, panelBox)
			;

			if (!placement.popupVisible)
			{
				// Clear the set first: popup.close() emits onClose synchronously and can re-enter this method.
				const popupsToClose = [...this.shownPopups];
				this.shownPopups.clear();
				popupsToClose.forEach((popup) => {
					popup.close();
				});
			}

			this.itemPanelStyles = {
				top: `${placement.top}px`,
				left: `${placement.left}px`,
				display: placement.visible ? 'flex' : 'none',
			};

			if (!placement.visible)
			{
				this.returnTextPanelFocusToTitle();
			}
		},
		// Hiding the panel drops the focus of the button standing on it, and the leave that follows
		// ends the editing session as well -- so the title takes the focus back. The place computed for
		// the panel is written before that, and the write reaches the DOM only at the render flush, so
		// the panel still holds the focus here and is hidden with the place it was given, not with
		// whatever the leave left behind. Whether the panel holds the focus is asked of the DOM, not of
		// the hold: the hold goes on before the focus moves, and both routes that do so position the
		// panel in between.
		returnTextPanelFocusToTitle(): void
		{
			if (this.$refs.panel?.$el?.contains?.(document.activeElement) !== true)
			{
				return;
			}

			this.getItemsRef(this.textPanelItem?.id)?.$refs.growingTextArea?.focusTextarea();
		},
		/**
		 * The panel of a selection stands where the caret is. The anchor of that place is the caret line of
		 * the live selection, so it exists only while the adapter edits the very item the panel serves.
		 * The root row is left out whole: its panel is raised by focus, not by a selection, and a selection
		 * inside its title must not move it away from the row edge it has always stood at.
		 */
		getSelectionPanelPlacement(list: HTMLElement, itemRef: HTMLElement, panelBox: Object): ?Object
		{
			if (this.textPanelItem.parentId === 0)
			{
				return null;
			}

			const liveAnchorRect = this.editorAdapter?.isActive(this.textPanelItem.id) === true
				? this.editorAdapter.getSelectionAnchorRect()
				: null
			;
			if (liveAnchorRect)
			{
				// The anchor comes in window coordinates, the panel is placed in the coordinates of the
				// list: subtracting the live list box translates the one into the other without the page
				// scroll, which the client rect of neither carries. The scroll of the list goes on top, so
				// that the anchor kept here keeps pointing at its own text after the list scrolls.
				const listBox = list.getBoundingClientRect();
				this.lastSelectionAnchor = {
					x: liveAnchorRect.x - listBox.left,
					top: liveAnchorRect.top - listBox.top + list.scrollTop,
					bottom: liveAnchorRect.bottom - listBox.top + list.scrollTop,
				};
			}

			// The selection is gone the moment the focus enters the panel or a popup takes the document
			// selection over, and the adapter reads the live one only. Parking the panel at the row edge on
			// such a report would tear it away from the text it works on, so a hold keeps the panel on the
			// anchor it last stood on; closing the panel forgets that anchor.
			if (!liveAnchorRect && this.isTextPanelHeld !== true)
			{
				return null;
			}

			const anchor = this.lastSelectionAnchor;
			if (!anchor)
			{
				return null;
			}

			const { left, top, visible } = computeTextPanelPosition({
				anchor: {
					x: anchor.x,
					top: anchor.top - list.scrollTop,
					bottom: anchor.bottom - list.scrollTop,
				},
				panel: panelBox,
				visibleWindow: { width: list.clientWidth, height: list.clientHeight },
				topBoundary: this.getStickyHeaderBottom(list, itemRef),
			});

			const listOffset = this.getListOffsetInContainingBlock(list);

			return {
				left: left + listOffset.left,
				top: top + listOffset.top,
				visible,
				popupVisible: visible,
			};
		},
		// Where the panel stands without a selection behind it: the root row raises it on focus, and any
		// row can have it raised programmatically. It docks to the right edge of the list, its bottom
		// aligned with the row top, like the editor's floating toolbar over a selection.
		getRowEdgePanelPlacement(list: HTMLElement, itemRef: HTMLElement, panelBox: Object): Object
		{
			const listRect = Dom.getPosition(list);
			const itemRect = Dom.getRelativePosition(itemRef, list);
			const isParentItem = (this.textPanelItem.parentId === 0);

			const paddingOffset = 18;
			const listVisibleBottom = list.scrollTop + list.clientHeight;

			const rowPanelTop = itemRect.top - panelBox.height + textPanelRowInset;
			const rowTopLimitValue = isParentItem ? -42 : 28;
			const placement = { top: rowPanelTop, topLimit: rowTopLimitValue };
			const panelTop = placement.top;
			const panelTopLimit = listVisibleBottom - panelBox.height;
			const topPopupLimitValue = isParentItem ? -12 : 58;
			const rightOffset = isParentItem ? (paddingOffset * 2) + 80 : paddingOffset;

			return {
				left: Math.max(0, listRect.width - panelBox.width - rightOffset),
				top: panelTop,
				visible: panelTop > placement.topLimit && panelTop < panelTopLimit,
				popupVisible: rowPanelTop > topPopupLimitValue && rowPanelTop < listVisibleBottom,
			};
		},
		// The panel is absolute inside the wrapper, while the place computed for it is measured from the
		// list. In popup and sheet modes the wrapper pads the list away from its own top edge, so a place
		// taken for the wrapper's own stands that padding too high until the offset is added back.
		getListOffsetInContainingBlock(list: HTMLElement): Object
		{
			const wrapper = this.$refs.wrapper;

			return wrapper instanceof HTMLElement
				? Dom.getRelativePosition(list, wrapper)
				: { left: 0, top: 0 }
			;
		},
		updateSelectedFormattingActions(): void
		{
			this.selectedFormattingActions = (
				this.getItemsRef(this.textPanelItem?.id)?.$refs.growingTextArea?.getSelectedFormattingActions?.()
				?? []
			);
		},
		async setImportant(item: CheckListModel, selectedItems: CheckListModel[] = []): Promise<void>
		{
			if (item.groupMode?.selected === true && selectedItems.length > 0)
			{
				const updates = selectedItems
					.map((selectedItem: CheckListModel) => ({
						...selectedItem,
						isImportant: !selectedItem.isImportant,
					}));

				await this.upsertCheckLists(updates);
			}
			else
			{
				await this.updateCheckList(item.id, { isImportant: !item.isImportant });
			}

			await this.savePreviewChanges();
		},
		attachFile(node: HTMLElement, item: CheckListModel = this.currentItem): void
		{
			this.fileServiceInstances ??= new Map();

			const fileServiceInstance = this.getCurrentFileService(item);

			this.fileServiceInstances.set(item.id, fileServiceInstance);

			const handleFreeze = (freeze: boolean) => {
				if (freeze)
				{
					this.freeze();
				}
				else
				{
					this.unfreeze();
				}
			};

			handleFreeze(true);

			fileServiceInstance.browse({
				bindElement: node,
				onShowCallback: () => {
					this.isItemPanelFreeze = true;
					this.isItemPanelActionPopupShown = true;
					if (this.panelState)
					{
						this.applyPanelState(setPanelHold(this.panelState, 'popupOpen', true));
					}
				},
				onHideCallback: () => {
					this.isItemPanelFreeze = false;
					this.isItemPanelActionPopupShown = false;
					if (this.panelState)
					{
						this.applyPanelState(setPanelHold(this.panelState, 'popupOpen', false));
						this.restorePanelFocus(item.id);
					}
					else
					{
						this.restoreFocusAfterMenu(node);
					}
				},
			});
			fileServiceInstance.subscribe('onFileAdd', () => {
				handleFreeze(true);
			});
			fileServiceInstance.subscribe('onFileComplete', () => {
				this.isItemPanelFreeze = fileServiceInstance.isUploading();
				handleFreeze(this.isItemPanelFreeze || this.hasEmptyItem());
				this.focusToItem(item.id);
			});
		},
		getCurrentFileService(item: ?CheckListModel = this.currentItem): ?FileService
		{
			if (!item)
			{
				return null;
			}

			return fileService.get(
				item.id,
				EntityTypes.CheckListItem,
				{ parentEntityId: this.taskId },
			);
		},
		hasItemFiles(item: CheckListModel): boolean
		{
			if (!item)
			{
				return false;
			}

			const fileServiceInstance = this.getCurrentFileService(item);

			const files = item.attachments;

			return (
				files.length > 0
				|| fileServiceInstance?.isUploading()
				|| fileServiceInstance?.hasUploadingError()
			);
		},
		hasItemUsers(item: CheckListModel): boolean
		{
			return (item.accomplices.length > 0 || item.auditors.length > 0);
		},
		getItemIdWithUploadingFiles(): ?string | ?number | undefined
		{
			if (!this.fileServiceInstances)
			{
				return null;
			}

			return [...this.fileServiceInstances.values()].find(
				(fileServiceInstance: FileService) => fileServiceInstance.isUploading(),
			)?.getEntityId();
		},
		isCurrentItemEmpty(): boolean
		{
			if (!this.currentItem)
			{
				return true;
			}

			return this.currentItem.title === '';
		},
		canModifyItem(item: ?CheckListModel): boolean
		{
			return item?.actions?.modify === true;
		},
		reorderCurrentItem(direction: 'up' | 'down'): void
		{
			if (!this.canModifyItem(this.currentItem) || this.itemGroupModeSelected)
			{
				return;
			}

			const move = direction === 'up' ? 'moveItemUp' : 'moveItemDown';
			const result = this.checkListManager[move](
				this.currentItem,
				(updates: CheckListModel[]) => this.upsertCheckLists(updates),
			);

			this.announceReorder(direction, result);
			if (result)
			{
				void this.$nextTick(() => this.updatePanelPosition());
			}
		},
		announceReorder(direction: 'up' | 'down', result: ?{ position: number, total: number }): void
		{
			if (!result)
			{
				const boundaryKey = direction === 'up'
					? 'TASKS_V2_CHECK_LIST_MOVE_BOUNDARY_START'
					: 'TASKS_V2_CHECK_LIST_MOVE_BOUNDARY_END';
				LiveAnnouncer.announce(this.loc(boundaryKey), 'polite');

				return;
			}

			const positionKey = this.currentItem.parentId === 0
				? 'TASKS_V2_CHECK_LIST_MOVE_LIST_POSITION'
				: 'TASKS_V2_CHECK_LIST_MOVE_ITEM_POSITION';
			LiveAnnouncer.announce(
				this.loc(positionKey, { '#position#': result.position, '#total#': result.total }),
				'polite',
			);
		},
		moveGroupToRight(item: CheckListModel = this.currentItem, selectedItems: ?CheckListModel[] = null): void
		{
			selectedItems ??= item?.groupMode?.selected === true
				? this.checkListManager.getAllSelectedItems()
				: []
			;
			if (item.groupMode?.selected === true && selectedItems.length > 0)
			{
				selectedItems
					.sort((a: CheckListModel, b: CheckListModel) => a.sortIndex - b.sortIndex)
					.forEach((selectedItem: CheckListModel) => {
						this.moveRight(selectedItem);
					});
			}
			else
			{
				this.moveRight(item);
			}
		},
		moveRight(item: CheckListModel): void
		{
			if (!this.canModifyItem(item))
			{
				return;
			}

			this.checkListManager.moveRight(
				item,
				(updates: CheckListModel[]) => {
					void this.upsertCheckLists(updates);

					if (!item.groupMode?.active)
					{
						this.focusToItem(item.id);
					}
				},
			);
		},
		moveGroupToLeft(item: CheckListModel, selectedItems: CheckListModel[] = []): void
		{
			if (item.groupMode?.selected === true && selectedItems.length > 0)
			{
				selectedItems
					.sort((a: CheckListModel, b: CheckListModel) => b.sortIndex - a.sortIndex)
					.forEach((selectedItem: CheckListModel) => {
						this.moveLeft(selectedItem);
					});
			}
			else
			{
				this.moveLeft(item);
			}
		},
		moveLeft(item: CheckListModel): void
		{
			if (!this.canModifyItem(item))
			{
				return;
			}

			this.checkListManager.moveLeft(
				item,
				(updates: CheckListModel[]) => {
					void this.upsertCheckLists(updates);

					if (!item.groupMode?.active)
					{
						this.focusToItem(item.id);
					}
				},
			);
		},
		async forward(
			node: HTMLElement,
			item: CheckListModel,
			selectedItems: CheckListModel[] = [],
		): Promise<void>
		{
			this.forwardContextItemId = item.id;
			this.forwardSelectedItemIds = selectedItems.map(({ id }) => id);
			if (this.hasFewParentCheckLists)
			{
				this.showForwardMenu(node);
			}
			else
			{
				this.closeActivePanel();

				void this.forwardToNewChecklist(item.id, selectedItems);
			}
		},
		async forwardToNewChecklist(
			itemId: number | string,
			selectedItems: CheckListModel[] = [],
		): Promise<void>
		{
			const newParentId = await this.addCheckList(true);

			if (selectedItems.length > 0)
			{
				void this.forwardGroupItemsToChecklist(itemId, newParentId, selectedItems);
			}
			else
			{
				void this.forwardToChecklist(itemId, newParentId);
			}
		},
		async forwardToChecklist(itemId: number | string, checkListId: number | string): Promise<void>
		{
			const finalSortIndex = this.checkListManager.getChildren(checkListId).length;

			const movingItem = this.checkListManager.getItem(itemId);
			if (this.editorAdapter?.isActive?.(itemId))
			{
				const editorLayer = this.activeEditorLayer;
				const session = this.deactivateItemEditor('item-forwarded');
				editorLayer?.commitEditorSession?.(session);
			}

			await this.updateCheckList(movingItem.id, {
				parentId: checkListId,
				sortIndex: finalSortIndex,
			});

			this.resortItemsOnLevel(checkListId);
			this.resortItemsOnLevel(movingItem.parentId);

			this.handleTargetParentFilter(movingItem);

			if (this.isPreview)
			{
				this.focusItemRow(movingItem.id);
			}
			else if (Type.isNumber(movingItem.id) && Type.isFunction(this.focusToItem))
			{
				this.focusToItem(movingItem.id);
			}

			await this.savePreviewChanges();
		},
		async forwardGroupItemsToChecklist(
			itemId: number | string,
			checkListId: number | string,
			selectedItemsSnapshot: ?CheckListModel[] = null,
		): Promise<void>
		{
			const finalSortIndex = this.checkListManager.getChildren(checkListId).length;

			const movingItem = this.checkListManager.getItem(itemId);

			const checkListIdsFromWhichWereForwarded = new Set();

			const allSelectedItems = selectedItemsSnapshot ?? this.checkListManager.getAllSelectedItems();
			const nearestItem = this.checkListManager.findNearestItem(movingItem, false, allSelectedItems);
			if (nearestItem)
			{
				this.showEntityPanelProgrammatically(nearestItem.id);
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

			allSelectedWithChildren.forEach((item: CheckListModel) => {
				this.handleTargetParentFilter(item);
			});

			await this.savePreviewChanges();
		},
		handleTargetParentFilter(movedItem: CheckListModel): void
		{
			this.checkListManager.handleTargetParentFilter(
				movedItem,
				this.currentUserId,
				(updates: CheckListModel[]) => {
					setTimeout(() => {
						const actualUpdates = updates
							.map(({ id, hidden }) => {
								const actualItem = this.checkListManager.getItem(id);

								return actualItem ? { ...actualItem, hidden } : null;
							})
							.filter(Boolean)
						;
						if (actualUpdates.length > 0)
						{
							void this.upsertCheckLists(actualUpdates);
						}
					}, 1000);
				},
			);
		},
		delete(item: CheckListModel, selectedItems: CheckListModel[] = []): void
		{
			if (item.groupMode?.selected === true && selectedItems.length > 0)
			{
				void this.handleGroupRemove(item.id, selectedItems);
			}
			else
			{
				const removedSubtree = [item, ...this.checkListManager.getAllChildren(item.id)];
				const nearestItem = this.checkListManager.findNearestItem(item, false, removedSubtree);

				// The removed row leaves the tree, so the stop that follows it has to be read
				// while it is still there.
				const nextTarget = (this.isPreview && !nearestItem) ? this.getTabStopAfterItemRow(item.id) : null;
				this.closeActivePanel();
				this.handleRemove(item.id);
				if (this.isPreview)
				{
					if (nearestItem)
					{
						this.focusItemRow(nearestItem.id);
					}
					else
					{
						nextTarget?.focus({ preventScroll: true });
					}

					return;
				}

				if (nearestItem)
				{
					setTimeout(() => this.focusToItem(nearestItem.id), 0);
				}
			}
		},
		cancelGroupMode(item: ?CheckListModel = null): void
		{
			this.deactivateGroupMode();
			if (item)
			{
				this.returnFocusToItem(item.id);
			}
			else
			{
				this.closeActivePanel();
			}
		},
		cleanCollapsedState(): void
		{
			const updates = this.parentCheckLists
				.map((item: CheckListModel) => ({
					...item,
					localCollapsedState: null,
				}));

			void this.upsertCheckLists(updates);
		},
		cleanEmptyItems(): void
		{
			this.checkListManager.getEmptiesItem().forEach((item: CheckListModel) => {
				this.removeItem(item.id);
			});
		},
		showParticipantDialog(
			targetNode: HTMLElement,
			type: ParticipantType,
			item: CheckListModel = this.currentItem,
			selectedItems: CheckListModel[] = [],
		): void
		{
			const handleClose = async (): Promise<void> => {
				this.isItemPanelFreeze = false;
				this.isItemPanelActionPopupShown = false;
				if (this.panelState)
				{
					this.applyPanelState(setPanelHold(this.panelState, 'popupOpen', false));
				}

				if (selectedItems.length === 0)
				{
					this.restorePanelFocus(item.id);
				}

				this.updatePanelPosition();
				await this.savePreviewChanges();
			};

			this.checkListParticipantService.showParticipantDialog({
				targetNode,
				type,
				items: selectedItems.length > 0 ? selectedItems : [item],
				onClose: handleClose,
			});

			this.isItemPanelFreeze = true;
			this.isItemPanelActionPopupShown = true;
			if (this.panelState)
			{
				this.applyPanelState(setPanelHold(this.panelState, 'popupOpen', true));
			}
		},
		activateGroupMode(parentItemId: number | string): Promise<void>
		{
			this.itemId = parentItemId;

			const visibleItems = this.checkListManager.getAllChildren(parentItemId)
				.filter((item: CheckListModel) => !item.hidden);

			const updates = visibleItems
				.map((item: CheckListModel, index: number) => ({
					...item,
					groupMode: {
						active: true,
						selected: index === 0,
					},
				}));

			updates.push({
				...this.currentItem,
				groupMode: {
					active: true,
					selected: false,
				},
			});

			return this.upsertCheckLists(updates);
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
		freeze(): void
		{
			this.isFreeze = true;
			this.$refs.childComponent?.$refs?.childComponent?.freeze();
		},
		unfreeze(): void
		{
			if (this.hasEmptyItem() || this.getItemIdWithUploadingFiles())
			{
				return;
			}

			this.isFreeze = false;
			this.$refs.childComponent?.$refs?.childComponent?.unfreeze();
		},
		hasEmptyItem(): boolean
		{
			return (
				this.checkListManager.hasEmptyItemWithFiles(this.hasItemFiles)
				|| this.checkListManager.hasEmptyParentItem()
			);
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
		cleanNotifiers(): void
		{
			this.notifiers.forEach((notifier: CheckListNotifier) => notifier.stopTimer());
			this.notifiers.clear();
		},
		handleManualConflicts(event: BaseEvent): void
		{
			const data = event.getData?.() ?? event.data ?? {};
			if (data.taskId !== this.taskId)
			{
				return;
			}

			const conflicts = checkListService.getPullConflicts()
				.filter((conflict) => conflict.taskId === this.taskId);
			if (conflicts.length === 0)
			{
				if (this.conflicts !== null)
				{
					this.handleConflictsClose();
				}

				return;
			}

			if (openConflictTaskIds.has(this.taskId))
			{
				if (this.conflicts !== null)
				{
					this.conflicts = [...conflicts];
				}

				return;
			}

			if (data.refreshOnly === true)
			{
				return;
			}

			openConflictTaskIds.add(this.taskId);
			this.conflicts = [...conflicts];
		},
		handleConflictsClose(): void
		{
			openConflictTaskIds.delete(this.taskId);
			this.conflicts = null;
		},
	},
	template: `
		<component
			v-if="componentShown"
			v-bind="$attrs"
			ref="childComponent"
			:is="componentName"
			:isShown
			:sheetBindProps
			:isEmpty="emptyList"
			@show="handleShow"
			@close="handleClose"
			@isShown="handleIsShown"
			@addFastCheckList="addFastCheckList"
			@resize="$emit('resize')"
		>
			<template v-slot:default="{ handleShow, handleClose }">
				<div
					ref="wrapper"
					class="tasks-check-list-wrapper"
					:class="contextClass"
					data-field-container
					:data-task-field-id="checkListMeta.id"
					data-testid="task-check-list-wrapper"
				>
					<button
						v-if="showInlineCloseButton"
						type="button"
						class="tasks-check-list-close-icon"
						data-testid="task-check-list-close-btn"
						:class="contextClass"
						:aria-label="loc('TASKS_V2_CHECK_LIST_CLOSE_LABEL')"
						@click="$emit('close')"
					>
						<BIcon :name="Outline.CROSS_L" data-testid="tasks-check-list-close-btn" aria-hidden="true" size="24"/>
					</button>
					<div
						ref="list"
						data-list
						data-testid="task-check-list-content"
						class="tasks-check-list-content"
						:class="contextClass"
						@pointerdown.capture="handleListPointerDown"
						@keydown.esc.capture="handleItemEscape"
						@focusout="handleListFocusOut"
					>

						<CheckListWidget
							v-show="!stub"
							:checkListId
							:isPreview
							:entityPanelItemId="panelState.entityItemId"
							:showCloseButton="showSheetCloseButton"
							@update="handleUpdate"
							@show="handleShow"
							@addItem="addItem"
							@addItemFromBtn="addItemFromBtn"
							@removeItem="handleRemove"
							@focus="handleFocus"
							@blur="handleBlur"
							@emptyBlur="handleEmptyBlur"
							@formattingSelectionChange="handleFormattingSelectionChange"
							@startGroupMode="handleGroupMode"
							@toggleGroupModeSelected="handleGroupModeSelected"
							@openCheckList="handleOpenCheckList"
							@itemPointerEnter="handleItemPointerEnter"
							@itemPointerLeave="handleItemPointerLeave"
							@panelTab="handlePanelTab"
							@close="$emit('close')"
						/>
						<CheckListStub v-if="stub && !isPreview" @click="addCheckList"/>
					</div>
					<div v-show="!stub && !isPreview" class="tasks-check-list-footer print-ignore" :class="contextClass">
						<UiButton
							v-if="canCheckListAdd"
							:text="loc('TASKS_V2_CHECK_LIST_NEW_BTN')"
							:size="ButtonSize.MEDIUM"
							:leftIcon="ButtonIcon.ADD"
							:style="AirButtonStyle.PLAIN_NO_ACCENT"
							:dataset="{ testid: 'tasks-check-list-add-btn' }"
							@click="addCheckList"
						/>
						<UiButton
							:text="loc('TASKS_V2_CHECK_LIST_SAVE_BTN')"
							:dataset="{ testid: 'tasks-check-list-save-btn' }"
							:size="ButtonSize.MEDIUM"
							@click="$emit('close')"
						/>
					</div>
					<CheckListItemPanel
						v-if="itemPanelIsShown && !isPreview"
						ref="panel"
						:placement="ActionPlacement.Text"
						:ariaLabel="loc('TASKS_V2_CHECK_LIST_ITEM_TEXT_PANEL_LABEL')"
						:currentItem="textPanelItem"
						:actionPopupShown="isItemPanelActionPopupShown"
						:actions="textPanelActions"
						:keyboardActions="textPanelKeyboardActions"
						:style="itemPanelStyles"
						@action="handlePanelAction"
						@focusEnter="handlePanelFocusEnter(ActionPlacement.Text)"
						@focusLeave="handlePanelFocusLeave(ActionPlacement.Text, $event)"
						@navigate="handlePanelNavigate(ActionPlacement.Text, $event)"
						@escape="handlePanelEscape"
					/>
					<CheckListItemPanel
						v-if="entityPanelItem && entityPanelAvailable"
						ref="entityPanel"
						:placement="ActionPlacement.Entity"
						:ariaLabel="loc('TASKS_V2_CHECK_LIST_ITEM_ENTITY_PANEL_LABEL')"
						testId="task-check-list-item-entity-panel"
						:currentItem="entityPanelItem"
						:actionPopupShown="isItemPanelActionPopupShown"
						:preserveFocusOnMouseDown="itemPanelIsShown"
						:actions="entityPanelActions"
						:keyboardActions="entityPanelKeyboardActions"
						:style="entityPanelStyles"
						@action="handleEntityPanelAction"
						@pointerEnter="handleEntityPanelPointerEnter"
						@pointerLeave="handleEntityPanelPointerLeave"
						@focusEnter="handlePanelFocusEnter(ActionPlacement.Entity)"
						@focusLeave="handlePanelFocusLeave(ActionPlacement.Entity, $event)"
						@navigate="handlePanelNavigate(ActionPlacement.Entity, $event)"
						@escape="handlePanelEscape"
					/>
					<BMenu
						v-if="isForwardMenuShown && forwardContextItem && forwardMenuOptions"
						:options="forwardMenuOptions"
						data-testid="task-check-list-forward-menu"
						@close="handleForwardMenuClose"
					/>
					<CheckListLinkPopup
						v-if="linkPopupBindElement"
						:popupId="linkPopupId"
						:bindElement="linkPopupBindElement"
						@apply="handleLinkPopupApply"
						@close="handleLinkPopupClose"
					/>
				</div>
			</template>
		</component>
		<ConflictPopup
			v-if="conflicts"
			:conflicts
			:checkListItems="checkLists"
			:taskId
			@close="handleConflictsClose"
		/>
	`,
};
