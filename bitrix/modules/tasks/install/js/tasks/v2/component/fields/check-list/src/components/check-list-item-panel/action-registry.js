import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { type CheckListModel } from 'tasks.v2.model.check-list';

import { PanelAction, PanelSection } from './check-list-item-panel-meta';

export const ActionPlacement = Object.freeze({
	Text: 'text',
	Entity: 'entity',
	Keyboard: 'keyboard',
});

export const EntityActionOrder = Object.freeze({
	Important: 10,
	Accomplice: 20,
	Auditor: 30,
	CreateTask: 40,
	AttachFile: 45,
	Forward: 50,
	Copy: 60,
	MoveRight: 65,
	MoveLeft: 66,
	Delete: 70,
	Cancel: 80,
});

export type ActionPlacementValue = 'text' | 'entity' | 'keyboard';

export type ActionAccessContext = {
	item: CheckListModel,
	isGroupMode: boolean,
	isStakeholdersAvailable: boolean,
	isDiskAvailable: boolean,
	canCheckListAdd: boolean,
	canAuditorsAdd: boolean,
	canChangeAccomplices: boolean,
	canMoveRight: boolean,
	canMoveLeft: boolean,
	canMoveItemUp: boolean,
	canMoveItemDown: boolean,
	selectedFormattingActions: string[],
};

export type ActionExecutionContext = {
	item: CheckListModel,
	trigger: HTMLElement,
	dispatch: (action: string, item: CheckListModel, trigger: HTMLElement) => mixed,
};

export type ActionInteractionPolicy = {
	holdPanel: boolean,
	returnFocus: 'trigger' | 'item' | 'nearest',
};

export type ActionDescriptor = {
	id: string,
	placement: ActionPlacementValue,
	groupPlacement?: ActionPlacementValue,
	groupOrder?: number,
	rootPlacement?: ActionPlacementValue,
	rootOrder?: number,
	rootVisible?: boolean,
	order: number,
	section: string,
	icon?: string,
	activeIcon?: string,
	iconColor?: string,
	activeIconColor?: string,
	iconSize?: number,
	hint?: string,
	className?: string,
	hoverable?: boolean,
	isToggle?: boolean,
	separatorBefore?: boolean,
	isAvailable: (context: ActionAccessContext) => boolean,
	isSelected: (context: ActionAccessContext) => boolean,
	handle: (context: ActionExecutionContext) => mixed,
	interaction: ActionInteractionPolicy,
};

const canModify = ({ item }: ActionAccessContext): boolean => item.actions?.modify === true;
const canRemove = ({ item }: ActionAccessContext): boolean => item.actions?.remove === true;
const neverSelected = (): boolean => false;
const keepTriggerFocus = Object.freeze({ holdPanel: false, returnFocus: 'trigger' });
const popupInteraction = Object.freeze({ holdPanel: true, returnFocus: 'trigger' });

function dispatchRegisteredAction(action: string): (context: ActionExecutionContext) => mixed
{
	return ({ item, trigger, dispatch }: ActionExecutionContext): mixed => dispatch(action, item, trigger);
}

const descriptors: ActionDescriptor[] = [
	{
		id: PanelAction.AttachFile,
		placement: ActionPlacement.Text,
		order: 10,
		section: PanelSection.Attachments,
		icon: Outline.ATTACH,
		hint: 'TASKS_V2_CHECK_LIST_ITEM_ATTACH_HINT',
		isAvailable: (context) => canModify(context) && !context.isGroupMode && context.isDiskAvailable,
		isSelected: neverSelected,
		handle: dispatchRegisteredAction(PanelAction.AttachFile),
		interaction: popupInteraction,
	},
	...[
		[PanelAction.Bold, Outline.BOLD, 'TASKS_V2_CHECK_LIST_ITEM_FORMAT_BOLD_HINT'],
		[PanelAction.Italic, Outline.ITALIC, 'TASKS_V2_CHECK_LIST_ITEM_FORMAT_ITALIC_HINT'],
		[PanelAction.Underline, Outline.UNDERLINE, 'TASKS_V2_CHECK_LIST_ITEM_FORMAT_UNDERLINE_HINT'],
		[PanelAction.Strikethrough, Outline.STRIKETHROUGH, 'TASKS_V2_CHECK_LIST_ITEM_FORMAT_STRIKETHROUGH_HINT'],
		[PanelAction.Link, Outline.LINK, 'TASKS_V2_CHECK_LIST_ITEM_FORMAT_LINK_HINT'],
	].map(([id, icon, hint], index): ActionDescriptor => ({
		id,
		placement: ActionPlacement.Text,
		rootVisible: true,
		order: 20 + (index * 10),
		section: PanelSection.Formatting,
		icon,
		iconSize: 20,
		hint,
		separatorBefore: id === PanelAction.Link,
		isToggle: id !== PanelAction.Link,
		isAvailable: (context) => canModify(context) && !context.isGroupMode,
		isSelected: ({ selectedFormattingActions }) => selectedFormattingActions.includes(id),
		handle: dispatchRegisteredAction(id),
		interaction: id === PanelAction.Link ? popupInteraction : keepTriggerFocus,
	})),
	{
		id: PanelAction.MoveRight,
		placement: ActionPlacement.Text,
		groupPlacement: ActionPlacement.Entity,
		groupOrder: EntityActionOrder.MoveRight,
		order: 70,
		section: PanelSection.Movement,
		icon: Outline.POINT_RIGHT,
		hint: 'TASKS_V2_CHECK_LIST_ITEM_MOVE_RIGHT_HINT',
		isAvailable: (context) => canModify(context) && context.canMoveRight,
		isSelected: neverSelected,
		handle: dispatchRegisteredAction(PanelAction.MoveRight),
		interaction: { holdPanel: false, returnFocus: 'item' },
	},
	{
		id: PanelAction.MoveLeft,
		placement: ActionPlacement.Text,
		groupPlacement: ActionPlacement.Entity,
		groupOrder: EntityActionOrder.MoveLeft,
		order: 80,
		section: PanelSection.Movement,
		icon: Outline.POINT_LEFT,
		hint: 'TASKS_V2_CHECK_LIST_ITEM_MOVE_LEFT_HINT',
		isAvailable: (context) => canModify(context) && context.canMoveLeft,
		isSelected: neverSelected,
		handle: dispatchRegisteredAction(PanelAction.MoveLeft),
		interaction: { holdPanel: false, returnFocus: 'item' },
	},
	...[
		[PanelAction.MoveItemUp, 10],
		[PanelAction.MoveItemDown, 20],
	].map(([id, order]): ActionDescriptor => ({
		id,
		placement: ActionPlacement.Keyboard,
		order,
		section: PanelSection.Movement,
		isAvailable: (context) => canModify(context) && !context.isGroupMode,
		isSelected: neverSelected,
		handle: dispatchRegisteredAction(id),
		interaction: { holdPanel: false, returnFocus: 'trigger' },
	})),
	{
		id: PanelAction.SetImportant,
		placement: ActionPlacement.Entity,
		order: EntityActionOrder.Important,
		section: PanelSection.Important,
		icon: Outline.FIRE,
		activeIcon: Outline.FIRE_SOLID,
		activeIconColor: 'var(--tasks-check-list-important-icon-color)',
		hint: 'TASKS_V2_CHECK_LIST_ITEM_IMPORTANT_HINT',
		className: '--important',
		hoverable: false,
		isToggle: true,
		isAvailable: canModify,
		isSelected: ({ item }) => item.isImportant === true,
		handle: dispatchRegisteredAction(PanelAction.SetImportant),
		interaction: keepTriggerFocus,
	},
	{
		id: PanelAction.AssignAccomplice,
		placement: ActionPlacement.Entity,
		rootPlacement: ActionPlacement.Text,
		rootOrder: 100,
		order: EntityActionOrder.Accomplice,
		section: PanelSection.Accomplice,
		icon: Outline.PERSON,
		iconSize: 20,
		hint: 'TASKS_V2_CHECK_LIST_ITEM_ACCOMPLICE_HINT',
		isAvailable: (context) => (
			canModify(context)
			&& context.isStakeholdersAvailable
			&& context.canChangeAccomplices
		),
		isSelected: neverSelected,
		handle: dispatchRegisteredAction(PanelAction.AssignAccomplice),
		interaction: popupInteraction,
	},
	{
		id: PanelAction.AssignAuditor,
		placement: ActionPlacement.Entity,
		rootPlacement: ActionPlacement.Text,
		rootOrder: 110,
		order: EntityActionOrder.Auditor,
		section: PanelSection.Auditor,
		icon: Outline.OBSERVER,
		iconSize: 20,
		hint: 'TASKS_V2_CHECK_LIST_ITEM_AUDITOR_HINT',
		isAvailable: (context) => (
			canModify(context)
			&& context.isStakeholdersAvailable
			&& context.canAuditorsAdd
		),
		isSelected: neverSelected,
		handle: dispatchRegisteredAction(PanelAction.AssignAuditor),
		interaction: popupInteraction,
	},
	{
		id: PanelAction.Forward,
		placement: ActionPlacement.Entity,
		order: EntityActionOrder.Forward,
		section: PanelSection.Forward,
		icon: Outline.FORWARD,
		hint: 'TASKS_V2_CHECK_LIST_ITEM_FORWARD_HINT',
		isAvailable: (context) => canModify(context) && context.item.title !== '' && context.canCheckListAdd,
		isSelected: neverSelected,
		handle: dispatchRegisteredAction(PanelAction.Forward),
		interaction: popupInteraction,
	},
	{
		id: PanelAction.Delete,
		placement: ActionPlacement.Entity,
		order: EntityActionOrder.Delete,
		section: PanelSection.Delete,
		icon: Outline.TRASHCAN,
		iconColor: 'var(--ui-color-accent-main-alert)',
		hint: 'TASKS_V2_CHECK_LIST_ITEM_REMOVE_HINT',
		isAvailable: canRemove,
		isSelected: neverSelected,
		handle: dispatchRegisteredAction(PanelAction.Delete),
		interaction: { holdPanel: false, returnFocus: 'nearest' },
	},
	{
		id: PanelAction.Cancel,
		placement: ActionPlacement.Entity,
		order: EntityActionOrder.Cancel,
		section: PanelSection.Cancel,
		icon: Outline.CROSS_L,
		hint: 'TASKS_V2_CHECK_LIST_ITEM_CANCEL_HINT',
		isAvailable: ({ isGroupMode }) => isGroupMode,
		isSelected: neverSelected,
		handle: dispatchRegisteredAction(PanelAction.Cancel),
		interaction: { holdPanel: false, returnFocus: 'item' },
	},
];

const registry = new Map();

export function registerAction(descriptor: ActionDescriptor): () => void
{
	if (registry.has(descriptor.id))
	{
		throw new Error(`Checklist action "${descriptor.id}" is already registered.`);
	}

	const registeredDescriptor = Object.freeze({ ...descriptor });
	registry.set(descriptor.id, registeredDescriptor);

	return (): void => {
		if (registry.get(descriptor.id) === registeredDescriptor)
		{
			registry.delete(descriptor.id);
		}
	};
}

export function getActionDescriptors(): ActionDescriptor[]
{
	return [...registry.values()];
}

export function getActionDescriptor(actionId: string): ?ActionDescriptor
{
	return registry.get(actionId) ?? null;
}

descriptors.forEach((descriptor: ActionDescriptor) => registerAction(descriptor));
