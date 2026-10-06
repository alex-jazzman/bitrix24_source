import { Dom, Tag } from 'main.core';
import { type ItemOptions, TagSelector } from 'ui.entity-selector';
import {
	type SelectorPreselectedItem,
	type SelectorTag,
	buildDepartmentItemId,
	getUserDepartmentEntities,
	parseSelectorTag,
} from 'mail.lib.entity-selector';

import { ASSIGNMENT_MODES, DEFAULT_ASSIGNMENT_MODE } from './assignment-mode';
import { type Assignment, type AssignmentMode, type PanelSaveData, type PanelSlot } from './types';
import './style.css';

export type AssignmentBlockOptions = {
	/** Assignments of an existing signature; a new one opens with none. */
	assignments?: Assignment[],
	/** Called when a target is added to a selector, so the card may drop what it said was missing. */
	onTargetAdd?: () => void,
};

/**
 * The targets a shared signature is assigned to. The way of assigning is the choice of the third
 * card of the editor and arrives through setMode(); the block renders the selector that way needs
 * and answers with the assignments it holds.
 *
 * Modes:
 *  - all        → [{targetType: 'all', targetId: 0, isFlat: false}]
 *  - mailbox    → [{targetType: 'mailbox', targetId: <id>, isFlat: false}, ...]
 *  - department → [{targetType: 'department', targetId: <id>, isFlat: <bool>}, ...] for departments
 *                 [{targetType: 'user', targetId: <id>, isFlat: false}, ...] for employees
 *  - draft      → [] — the signature is assigned to nobody and has no targets to render
 */
export class AssignmentBlock implements PanelSlot
{
	#content: HTMLElement | null = null;
	#mode: AssignmentMode = DEFAULT_ASSIGNMENT_MODE;
	#mailboxSelector: TagSelector | null = null;
	#departmentSelector: TagSelector | null = null;
	#initialAssignments: Assignment[];
	#onTargetAdd: () => void;

	constructor(options: AssignmentBlockOptions = {})
	{
		this.#initialAssignments = options.assignments ?? [];
		this.#onTargetAdd = options.onTargetAdd ?? (() => {});
	}

	renderTo(container: HTMLElement): void
	{
		if (!container)
		{
			return;
		}

		this.#content = Tag.render`
			<div
				class="mail-signature-assignment-block"
				data-testid="mail-signature-assignment-container"
			></div>
		`;

		Dom.append(this.#content, container);
	}

	getSaveData(): PanelSaveData
	{
		return { kind: 'shared', assignments: this.getAssignments() };
	}

	getAssignments(): Assignment[]
	{
		if (this.#mode === 'all')
		{
			return [{ targetType: 'all', targetId: 0, isFlat: false }];
		}

		if (this.#mode === 'mailbox')
		{
			return this.#getMailboxAssignments();
		}

		if (this.#mode === 'department')
		{
			return this.#getDepartmentAssignments();
		}

		return [];
	}

	/**
	 * Switches the way of assigning: the card owns the choice, the block owns the selector behind it.
	 */
	setMode(mode: AssignmentMode): void
	{
		if (!ASSIGNMENT_MODES.includes(mode))
		{
			return;
		}

		this.#mode = mode;

		if (!this.#content)
		{
			return;
		}

		Dom.clean(this.#content);

		if (mode === 'mailbox')
		{
			this.#renderMailboxSelector(this.#content);
		}
		else if (mode === 'department')
		{
			this.#renderDepartmentSelector(this.#content);
		}
	}

	// --- private ---

	/**
	 * Mailbox mode: TagSelector with the mail_mailbox entity
	 * (the provider returns active mailboxes only, gated by license and access rights).
	 */
	#renderMailboxSelector(content: HTMLElement): void
	{
		const selectorContainer = Tag.render`
			<div
				class="mail-signature-assignment-block__selector"
				data-role="mailbox-selector"
				data-testid="mail-signature-mailbox-selector"
			></div>
		`;
		Dom.append(selectorContainer, content);

		this.#mailboxSelector = new TagSelector({
			multiple: true,
			events: {
				onAfterTagAdd: () => {
					this.#onTargetAdd();
				},
			},
			dialogOptions: {
				targetNode: selectorContainer,
				// the context names the store of recently chosen items — renaming it would lose them
				context: 'MAIL_CORP_SIGNATURE_MAILBOXES',
				selectedItems: this.#getMailboxSelectorItems(),
				preselectedItems: this.#getMailboxSelectorPreselected(),
				entities: [
					{
						id: 'mail_mailbox',
						dynamicLoad: true,
						dynamicSearch: true,
					},
				],
			},
		});

		this.#mailboxSelector.renderTo(selectorContainer);
	}

	#getMailboxAssignments(): Assignment[]
	{
		if (!this.#mailboxSelector)
		{
			return [];
		}

		const result: Assignment[] = [];

		this.#mailboxSelector.getTags().forEach((tag: SelectorTag) => {
			const parsed = parseSelectorTag(tag);

			if (parsed && parsed.entity === 'mail_mailbox')
			{
				result.push({ targetType: 'mailbox', targetId: parsed.id, isFlat: false });
			}
		});

		return result;
	}

	/**
	 * Builds preselectedItems for the mailbox selector from initial assignments (edit mode).
	 */
	#getMailboxSelectorPreselected(): SelectorPreselectedItem[]
	{
		return this.#initialAssignments
			.filter((assignment: Assignment) => assignment.targetType === 'mailbox' && assignment.targetId > 0)
			.map((assignment: Assignment): SelectorPreselectedItem => ['mail_mailbox', Number(assignment.targetId)])
		;
	}

	/**
	 * The mailbox targets of an opened signature as items the selector already holds as chosen.
	 *
	 * A preselected item alone becomes a tag only once the provider has answered, so the set read
	 * from the tags before that — and after an answer that failed to arrive, or that left a target
	 * out — is short of targets the signature does have, and saving would drop them. An item named
	 * by the assignment itself needs no answer: the assignment carries the name, and the provider
	 * returns active mailboxes only, so a deactivated one has a tag this way and no other.
	 *
	 * A target with no name left is not among them — there is nothing to render it by, and the
	 * preselected item stays its only chance.
	 */
	#getMailboxSelectorItems(): ItemOptions[]
	{
		const items: ItemOptions[] = [];

		this.#initialAssignments.forEach((assignment: Assignment) => {
			const title = assignment.title ?? '';

			if (assignment.targetType === 'mailbox' && assignment.targetId > 0 && title !== '')
			{
				items.push({ entityId: 'mail_mailbox', id: Number(assignment.targetId), title });
			}
		});

		return items;
	}

	/**
	 * Department mode: TagSelector over departments and employees. Neither is filtered by having a
	 * mailbox connected — the backend resolves a target to the active mailboxes behind it, and a
	 * target with none simply brings no mailbox.
	 */
	#renderDepartmentSelector(content: HTMLElement): void
	{
		const selectorContainer = Tag.render`
			<div
				class="mail-signature-assignment-block__selector"
				data-role="dept-selector"
				data-testid="mail-signature-department-selector"
			></div>
		`;
		Dom.append(selectorContainer, content);

		this.#departmentSelector = new TagSelector({
			multiple: true,
			events: {
				onAfterTagAdd: () => {
					this.#onTargetAdd();
				},
			},
			dialogOptions: {
				targetNode: selectorContainer,
				context: 'MAIL_CORP_SIGNATURE_ASSIGNMENT',
				selectedItems: this.#getDepartmentSelectorItems(),
				preselectedItems: this.#getDepartmentSelectorPreselected(),
				entities: getUserDepartmentEntities(),
				// tabs arrive with the server response, so load before the first show
				preload: true,
				events: {
					/*
					 * "Recents" is always the first visible tab and is picked before the response
					 * arrives; with no selection history it shows a stub while the departments
					 * tree sits unnoticed in its own tab.
					 */
					onLoad: (event) => {
						const dialog = event.getTarget();
						if (dialog && !dialog.getRecentTab().getRootNode().hasChildren())
						{
							dialog.selectTab('departments');
						}
					},
				},
			},
		});

		this.#departmentSelector.renderTo(selectorContainer);
	}

	/**
	 * Maps TagSelector tags to assignments: department keeps isFlat semantics,
	 * user targets are resolved to active mailboxes by the backend.
	 */
	#getDepartmentAssignments(): Assignment[]
	{
		if (!this.#departmentSelector)
		{
			return [];
		}

		const result: Assignment[] = [];

		this.#departmentSelector.getTags().forEach((tag: SelectorTag) => {
			const parsed = parseSelectorTag(tag);

			if (!parsed)
			{
				return;
			}

			if (parsed.entity === 'department')
			{
				result.push({ targetType: 'department', targetId: parsed.id, isFlat: parsed.isFlat });
			}
			else if (parsed.entity === 'user')
			{
				result.push({ targetType: 'user', targetId: parsed.id, isFlat: false });
			}
		});

		return result;
	}

	/**
	 * Builds preselectedItems for the department selector from initial assignments (edit mode).
	 */
	#getDepartmentSelectorPreselected(): SelectorPreselectedItem[]
	{
		const items: SelectorPreselectedItem[] = [];

		this.#initialAssignments.forEach((assignment: Assignment) => {
			if (assignment.targetType === 'department')
			{
				items.push(['department', buildDepartmentItemId(assignment.targetId, assignment.isFlat)]);
			}
			else if (assignment.targetType === 'user' && assignment.targetId > 0)
			{
				items.push(['user', assignment.targetId]);
			}
		});

		return items;
	}

	/**
	 * The department and employee targets of an opened signature as items the selector already holds
	 * as chosen — handed over for the same reason as the mailbox ones,
	 * see #getMailboxSelectorItems().
	 */
	#getDepartmentSelectorItems(): ItemOptions[]
	{
		const items: ItemOptions[] = [];

		this.#initialAssignments.forEach((assignment: Assignment) => {
			const title = assignment.title ?? '';

			if (title === '')
			{
				return;
			}

			if (assignment.targetType === 'department')
			{
				items.push({
					entityId: 'department',
					id: buildDepartmentItemId(assignment.targetId, assignment.isFlat),
					title,
				});
			}
			else if (assignment.targetType === 'user' && assignment.targetId > 0)
			{
				items.push({ entityId: 'user', id: assignment.targetId, title });
			}
		});

		return items;
	}
}
