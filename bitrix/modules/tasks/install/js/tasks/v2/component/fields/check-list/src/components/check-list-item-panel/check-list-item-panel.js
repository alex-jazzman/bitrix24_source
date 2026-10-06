import { hint, type HintParams } from 'ui.vue3.directives.hint';
import { BIcon } from 'ui.icon-set.api.vue';

import { Core } from 'tasks.v2.core';
import { Model } from 'tasks.v2.const';

import 'tasks.v2.component.elements.hint';

import { type CheckListModel } from 'tasks.v2.model.check-list';
import { type TaskModel } from 'tasks.v2.model.tasks';

import { DefaultActions, FormattingActions, RootItemActions, StakeholderActions } from './const';
import { PanelAction, PanelSection, PanelMeta, type VisibleSections, type VisibleActions, type Section, type Item, type ActiveActions } from './check-list-item-panel-meta';
import { CheckListManager } from '../../lib/check-list-manager';

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
		currentItem: {
			type: Object,
			default: () => null,
		},
		selectedFormattingActions: {
			type: Array,
			default: () => [],
		},
	},
	emits: ['action'],
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
		sections(): VisibleSections
		{
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
				this.currentItem.actions.modify === true
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
			const canModify = this.currentItem.actions.modify === true;
			const canRemove = this.currentItem.actions.remove === true;

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
						|| this.currentItem.sortIndex === 0
						|| canModify === false
					);
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
	},
	methods: {
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
		handleItemClick(event: MouseEvent, item: Item): void
		{
			if (!item.disabled)
			{
				this.$emit('action', {
					action: item.action,
					node: event.currentTarget,
				});
			}
		},
		handleItemMouseEnter(event: MouseEvent, item: Item): void
		{
			this.currentHintElement = event.currentTarget;
			this.currentHintText = item.hint ? this.loc(item.hint) : null;
		},
		getItemTestId(item: Item): ?string
		{
			if (!FormattingActions.includes(item.action))
			{
				return null;
			}

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
			data-testid="tasks-check-list-item-panel"
			@mousedown.prevent
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
							:data-testid="getItemTestId(item)"
							@click="handleItemClick($event, item)"
							@mouseenter="handleItemMouseEnter($event, item)"
						>
							<BIcon
								:name="getItemIcon(item)"
								:hoverable="item.hoverable"
								:size="item.iconSize"
								color="var(--ui-color-base-4)"
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
