import { hint, type HintParams } from 'ui.vue3.directives.hint';
import { BIcon } from 'ui.icon-set.api.vue';
import { markRaw } from 'ui.vue3';
import { FocusZone, FocusKeys } from 'ui.a11y';

import { Core } from 'tasks.v2.core';
import { Model } from 'tasks.v2.const';

import 'tasks.v2.component.elements.hint';

import { type CheckListModel } from 'tasks.v2.model.check-list';
import { type TaskModel } from 'tasks.v2.model.tasks';

import { DefaultActions, DefaultIconColor, FormattingActions, RootItemActions, StakeholderActions } from './const';
import { PanelAction, PanelSection, PanelMeta, type VisibleSections, type VisibleActions, type Section, type Item, type ActiveActions } from './check-list-item-panel-meta';
import { CheckListManager } from '../../lib/check-list-manager';
import { ActionPlacement } from './action-registry';
import { type ResolvedAction } from './action-access';

import './check-list-item-panel.css';

// @vue/component
export const CheckListItemPanel = {
	name: 'CheckListItemPanel',
	components: {
		BIcon,
	},
	directives: { hint },
	inject: {
		task: {},
		taskId: {},
		isEdit: {},
	},
	props: {
		placement: {
			type: String,
			default: ActionPlacement.Text,
		},
		ariaLabel: {
			type: String,
			default: '',
		},
		testId: {
			type: String,
			default: 'task-check-list-item-panel',
		},
		currentItem: {
			type: Object,
			default: () => null,
		},
		actionPopupShown: {
			type: Boolean,
			default: false,
		},
		preserveFocusOnMouseDown: {
			type: Boolean,
			default: false,
		},
		hasIndentTarget: {
			type: Boolean,
			default: false,
		},
		selectedFormattingActions: {
			type: Array,
			default: () => [],
		},
		actions: {
			type: Array,
			default: () => [],
		},
		keyboardActions: {
			type: Array,
			default: () => [],
		},
	},
	emits: [
		'action', 'returnFocus', 'focusForward', 'focusLeave',
		'pointerEnter', 'pointerLeave', 'focusEnter', 'navigate', 'escape',
	],
	setup(): { task: TaskModel } {},
	data(): Object
	{
		return {
			currentHintElement: null,
			currentHintText: '',
		};
	},
	computed: {
		checkLists(): CheckListModel[]
		{
			return this.$store.getters[`${Model.CheckList}/getByIds`](this.task.checklist);
		},
		isStakeholdersRestricted(): boolean
		{
			return !Core.getParams().restrictions.stakeholder.available;
		},
		isEntityPlacement(): boolean
		{
			return this.placement === ActionPlacement.Entity;
		},
		sections(): VisibleSections
		{
			if (this.ariaLabel || (this.actions?.length ?? 0) > 0)
			{
				return this.actions.reduce((sections: VisibleSections, action: ResolvedAction) => {
					let section = sections.find(({ name }) => name === action.section);
					if (!section)
					{
						section = { name: action.section, items: [] };
						sections.push(section);
					}

					section.items.push({
						...action,
						action: action.id,
						hoverable: action.hoverable ?? true,
					});

					return sections;
				}, []);
			}

			return PanelMeta.defaultSections
				.filter((section) => this.visibleSections.includes(section.name) && this.canShowPanelSection(section.name))
				.map((section) => ({
					...section,
					items: section.items
						.filter((item: Item) => this.visibleActions.includes(item.action))
						.map((item: Item) => ({
							...item,
							disabled: this.isItemDisabled(item),
							active: this.isItemActive(item),
							hoverable: item.hoverable ?? true,
						})),
				}))
				.filter((section) => section.items.length > 0)
			;
		},
		tooltip(): Function
		{
			return (): HintParams => ({
				text: this.currentHintText,
				timeout: 500,
				popupOptions: {
					className: 'tasks-hint',
					background: 'var(--ui-color-bg-content-inapp)',
					darkMode: false,
					offsetLeft: Math.round((this.currentHintElement?.offsetWidth ?? 0) / 3),
					padding: 6,
					bindOptions: {
						forceBindPosition: true,
						forceTop: true,
						position: 'top',
					},
					targetContainer: document.body,
				},
			});
		},
		visibleSections(): VisibleSections
		{
			return PanelMeta.defaultSections.map((section: Section) => section.name);
		},
		visibleActions(): VisibleActions
		{
			if (!this.currentItem)
			{
				return [];
			}

			const canFormatCurrentTitle = (
				this.currentItem.actions?.modify === true
				&& !this.itemGroupModeSelected
			);

			let actions = [...DefaultActions];

			if (this.itemGroupModeSelected)
			{
				actions.push(PanelAction.Cancel);
			}
			else
			{
				actions.push(PanelAction.AttachFile);
			}

			if (canFormatCurrentTitle)
			{
				actions.push(...FormattingActions);
			}

			if (this.currentItem.parentId === 0)
			{
				actions = [
					...(canFormatCurrentTitle ? FormattingActions : []),
					...RootItemActions,
				];
			}

			return actions.filter((action: string) => {
				const isDisabledStakeholders = StakeholderActions.includes(action) && this.isStakeholdersRestricted;

				return !isDisabledStakeholders;
			});
		},
		disabledActions(): string[]
		{
			if (!this.currentItem)
			{
				return [];
			}

			const disabledActions = [];

			const itemLevel = this.checkListManager.getItemLevel(this.currentItem);
			const canModify = this.currentItem.actions?.modify === true;
			const canRemove = this.currentItem.actions?.remove === true;
			const canReorder = canModify && !this.itemGroupModeSelected;

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
						|| !this.hasIndentTarget
						|| canModify === false
					);
				},
				[PanelAction.MoveItemUp]: () => {
					return canReorder === false;
				},
				[PanelAction.MoveItemDown]: () => {
					return canReorder === false;
				},
				[PanelAction.AssignAccomplice]: () => {
					return canModify === false || this.canChangeAccomplices === false;
				},
				[PanelAction.AssignAuditor]: () => {
					return canModify === false || this.canAuditorsAdd === false;
				},
				[PanelAction.Forward]: () => {
					return (
						canModify === false
						|| this.currentItem.title === ''
						|| !this.canCheckListAdd
					);
				},
				[PanelAction.Delete]: () => {
					return canRemove === false;
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
		moveItemShortcuts(): ?string
		{
			// Announce only the arrows handleKeydown answers for the current item: a move
			// disabledActions turned off leaves its key as plain page scrolling.
			const keys = [];

			if (!this.disabledActions.includes(PanelAction.MoveItemUp))
			{
				keys.push('ArrowUp');
			}

			if (!this.disabledActions.includes(PanelAction.MoveItemDown))
			{
				keys.push('ArrowDown');
			}

			return keys.length > 0 ? keys.join(' ') : null;
		},
		activeActions(): ActiveActions
		{
			if (!this.currentItem)
			{
				return [];
			}

			const actions = [...this.selectedFormattingActions];

			if (this.currentItem.isImportant)
			{
				actions.push(PanelAction.SetImportant);
			}

			return actions;
		},
		itemGroupModeSelected(): boolean
		{
			if (!this.currentItem)
			{
				return false;
			}

			return this.currentItem.groupMode?.selected === true;
		},
		canCheckListAdd(): boolean
		{
			if (!this.isEdit)
			{
				return true;
			}

			return this.task.rights.checklistAdd;
		},
		canAuditorsAdd(): boolean
		{
			if (!this.isEdit)
			{
				return true;
			}

			return this.task.rights.addAuditors;
		},
		canChangeAccomplices(): boolean
		{
			if (!this.isEdit)
			{
				return true;
			}

			return this.task.rights.changeAccomplices;
		},
	},
	created(): void
	{
		this.checkListManager = new CheckListManager({
			computed: {
				checkLists: () => this.checkLists,
			},
		});

		this.focusZone = null;
		this.focusZoneContainer = null;
	},
	mounted(): void
	{
		this.syncFocusZone();
	},
	updated(): void
	{
		// The toolbar root is behind v-if, so an item that loses all its sections and gets
		// them back comes with a brand new node -- the old zone would keep the roving
		// tabindex on the detached one.
		this.syncFocusZone();
	},
	beforeUnmount(): void
	{
		this.destroyFocusZone();
	},
	methods: {
		handleMouseDown(event: MouseEvent): void
		{
			if (this.placement === ActionPlacement.Text || this.preserveFocusOnMouseDown)
			{
				event.preventDefault();
			}
		},
		syncFocusZone(): void
		{
			const container = this.$el?.nodeType === Node.ELEMENT_NODE ? this.$el : null;
			if (container === this.focusZoneContainer)
			{
				return;
			}

			this.destroyFocusZone();

			if (!container)
			{
				return;
			}

			this.focusZoneContainer = container;
			this.focusZone = markRaw(new FocusZone(container, {
				bindKeys: FocusKeys.ArrowHorizontal | FocusKeys.HomeAndEnd,
			}));
			this.focusZone.activate();
		},
		destroyFocusZone(): void
		{
			this.focusZone?.deactivate();
			this.focusZone = null;
			this.focusZoneContainer = null;
		},
		focusFirstAction(): boolean
		{
			const target = this.$el?.querySelector?.('button:not([disabled])');
			if (!target)
			{
				return false;
			}

			target.focus();

			// The toolbar can be mounted but not displayed (updatePanelPosition hides
			// it for a row at the edge of the list), and focusing a hidden element is
			// a no-op. Report the fact, so the caller can fall back to native Tab
			// instead of suppressing it and trapping focus on the item.
			return document.activeElement === target;
		},
		focusLastAction(): boolean
		{
			const buttons = this.$el?.querySelectorAll?.('button:not([disabled])') ?? [];
			const target = buttons[buttons.length - 1];
			if (!target)
			{
				return false;
			}

			target.focus();

			return document.activeElement === target;
		},
		handleKeydown(event: KeyboardEvent): void
		{
			if (
				this.ariaLabel
				|| event.target === undefined
				|| (this.keyboardActions !== undefined && this.disabledActions === undefined)
			)
			{
				CheckListItemPanel.methods.handleSplitPanelKeydown.call(this, event);

				return;
			}

			if (event.key === 'Escape')
			{
				event.preventDefault();
				event.stopPropagation();
				this.$emit('returnFocus');

				return;
			}

			// FocusZone keeps a single tab stop here (roving tabindex), so Tab from any
			// button leaves the toolbar in both directions. The parent decides where
			// focus goes instead of letting it fall onto the footer, which is the
			// toolbar's DOM neighbour: back to the item, or on to the tree flow.
			if (event.key === 'Tab')
			{
				event.preventDefault();
				this.$emit(event.shiftKey ? 'returnFocus' : 'focusForward');

				return;
			}

			if (event.key === 'ArrowUp' || event.key === 'ArrowDown')
			{
				// Arrows mirror the toolbar buttons: a move the panel would render disabled
				// stays silent here too, instead of reaching a handler that drops it anyway --
				// and page scrolling is suppressed only for a move that is actually made.
				const action = event.key === 'ArrowUp' ? PanelAction.MoveItemUp : PanelAction.MoveItemDown;
				if (this.disabledActions.includes(action))
				{
					return;
				}

				event.preventDefault();
				this.$emit('action', { action, node: this.$el });
			}
		},
		handleSplitPanelKeydown(event: KeyboardEvent): void
		{
			if (event.key === 'Escape')
			{
				event.preventDefault();
				event.stopPropagation();
				this.$emit('escape');

				return;
			}

			if (event.key === 'Tab')
			{
				event.preventDefault();
				this.$emit('navigate', event.shiftKey ? 'backward' : 'forward');

				return;
			}

			if (event.key === 'ArrowUp' || event.key === 'ArrowDown')
			{
				const actionId = event.key === 'ArrowUp' ? PanelAction.MoveItemUp : PanelAction.MoveItemDown;
				const action = this.keyboardActions.find(({ id }) => id === actionId);
				if (!action)
				{
					return;
				}

				event.preventDefault();
				this.$emit('action', {
					action: action.id,
					itemId: this.currentItem.id,
					node: event.target,
					placement: ActionPlacement.Keyboard,
				});
			}
		},
		handleFocusOut(event: FocusEvent): void
		{
			if ((this.actions?.length ?? 0) > 0)
			{
				if (!this.$el?.contains(event.relatedTarget))
				{
					this.$emit('focusLeave', event.relatedTarget);
				}

				return;
			}

			const { relatedTarget } = event;

			const focusStaysInPanel = this.$el?.contains(relatedTarget) === true;
			const focusReturnsToItem = relatedTarget?.tagName === 'TEXTAREA';

			// An action of this toolbar can open a popup above the field (link, participants,
			// attachments). Tearing the toolbar down there would delete the very button that
			// popup returns focus to. The parent reports such a popup through the prop; the
			// DOM check also covers one that takes focus before the prop reaches us.
			const focusEntersActionPopup = this.actionPopupShown || this.isPopupAbovePanel(relatedTarget);

			if (focusStaysInPanel || focusReturnsToItem || focusEntersActionPopup)
			{
				return;
			}

			this.$emit('focusLeave');
		},
		isPopupAbovePanel(node: ?HTMLElement): boolean
		{
			// A popup that WRAPS the toolbar is the checklist's own popup or sheet context,
			// so leaving into it is an ordinary focus exit and must still hide the panel.
			const popup = node?.closest?.('.popup-window');

			return Boolean(popup) && popup.contains(this.$el) === false;
		},
		isItemDisabled(item: Item): boolean
		{
			return item.disabled ?? this.disabledActions.includes(item.action);
		},
		isItemActive(item: Item): boolean
		{
			return item.active ?? this.activeActions.includes(item.action);
		},
		getItemIcon(item: Item): string
		{
			return (item.active && item.activeIcon) ? item.activeIcon : item.icon;
		},
		getItemIconColor(item: Item): string
		{
			if (item.active && item.activeIconColor)
			{
				return item.activeIconColor;
			}

			return item.iconColor ?? DefaultIconColor;
		},
		handleItemClick(event: MouseEvent, item: Item): void
		{
			if (!item.disabled)
			{
				this.$emit('action', {
					action: item.action,
					...((this.actions?.length ?? 0) > 0 ? {
						itemId: this.currentItem.id,
						placement: this.placement,
					} : {}),
					node: event.currentTarget,
				});
			}
		},
		handleItemMouseEnter(event: MouseEvent, item: Item): void
		{
			this.currentHintElement = event.currentTarget;
			this.currentHintText = item.hint ? this.loc(item.hint) : null;
		},
		getItemTestId(item: Item): string
		{
			return `tasks-check-list-item-panel-${item.action}-btn`;
		},
		canShowPanelSection(sectionName: string): boolean
		{
			return !(sectionName === PanelSection.Attachments && !Core.getParams().features.disk);
		},
	},
	template: `
		<div
			v-if="sections.length > 0"
			class="check-list-widget-item-panel"
			:class="{ '--entity': isEntityPlacement }"
			role="toolbar"
			:aria-label="ariaLabel || loc('TASKS_V2_CHECK_LIST_ITEM_PANEL_LABEL')"
			:aria-keyshortcuts="moveItemShortcuts"
			:data-placement="placement"
			:data-testid="testId"
			@mousedown="handleMouseDown"
			@pointerenter="$emit('pointerEnter', $event)"
			@pointerleave="$emit('pointerLeave', $event)"
			@focusin="$emit('focusEnter')"
			@keydown="handleKeydown"
			@focusout="handleFocusOut"
		>
			<template v-for="section in sections" :key="section.name">
				<div class="check-list-widget-item-panel-section" :class="'--' + section.name">
					<template v-for="item in section.items" :key="item.action" >
						<span
							v-if="item.separatorBefore"
							class="check-list-widget-item-panel-section-separator ui-text-editor-toolbar-separator"
							aria-hidden="true"
						></span>
						<button
							v-hint="tooltip"
							type="button"
							class="check-list-widget-item-panel-section-item"
							:class="{
								'--disabled': item.disabled,
								'--active': item.active,
								[item.className]: Boolean(item.className),
							}"
							:disabled="item.disabled"
							:aria-label="item.hint ? loc(item.hint) : null"
							:aria-pressed="item.isToggle ? String(item.active) : null"
							:data-testid="getItemTestId(item)"
							@click="handleItemClick($event, item)"
							@mouseenter="handleItemMouseEnter($event, item)"
						>
							<BIcon
								:name="getItemIcon(item)"
								:hoverable="item.hoverable"
								:size="item.iconSize"
								:color="getItemIconColor(item)"
								aria-hidden="true"
							/>
							<span v-if="item.label">{{ loc(item.label) }}</span>
						</button>
					</template>
				</div>
			</template>
		</div>
	`,
};
