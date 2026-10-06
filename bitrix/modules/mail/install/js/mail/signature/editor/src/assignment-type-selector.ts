import { Dom, Event, Loc, Tag } from 'main.core';
import { RadioButton, RadioButtonSize } from 'ui.system.radiobutton';
import { Switcher, SwitcherSize } from 'ui.switcher';

import { AssignmentBlock } from './assignment-block';
import { ASSIGNMENT_MODES, detectAssignmentMode, modeRequiresTargets } from './assignment-mode';
import { type Assignment, type AssignmentMode, type PanelSaveData, type ScopeCardSlot } from './types';
import './style.css';

/**
 * The third card of the signature editor: the shared signature.
 *
 * Its switcher expresses the scope of the signature and is the primary choice of the screen —
 * turned on, the card takes the place of the sender card and asks whom the signature is assigned
 * to instead. The card owns the switcher and the choice between the ways of assigning, and keeps
 * the block of targets that way of assigning needs.
 *
 * The card implements ScopeCardSlot, so SignatureEditor reads its data the way it reads any panel
 * and learns of the switcher through subscribeToScope().
 */
export type AssignmentTypeSelectorOptions = {
	/** Whether the card opens with the shared scope on. Defaults to off. */
	shared?: boolean,
	/** Assignments of an existing shared signature; they decide the way of assigning it opens on. */
	assignments?: Assignment[],
	/** Way of assigning to open on, when it is not to be read from the assignments. */
	mode?: AssignmentMode,
};

const RADIO_GROUP = 'mail-signature-assignment-type';

export class AssignmentTypeSelector implements ScopeCardSlot
{
	#shared: boolean;
	#mode: AssignmentMode;
	#assignmentBlock: AssignmentBlock;
	#switcher: Switcher | null = null;
	#contentContainer: HTMLElement | null = null;
	#errorContainer: HTMLElement | null = null;
	#radios: Map<AssignmentMode, RadioButton> = new Map();
	#scopeHandlers: Array<(shared: boolean) => void> = [];

	constructor(options: AssignmentTypeSelectorOptions = {})
	{
		const assignments = options.assignments ?? [];

		this.#shared = options.shared === true;
		this.#mode = options.mode ?? detectAssignmentMode(assignments);
		this.#assignmentBlock = new AssignmentBlock({
			assignments,
			onTargetAdd: () => {
				this.#hideError();
			},
		});
	}

	renderTo(container: HTMLElement): void
	{
		const label = Loc.getMessage('MAIL_SIGNATURE_EDITOR_ASSIGN_TYPE_LABEL') ?? '';

		const switcherNode = Tag.render`
			<button
				type="button"
				class="mail-signature-shared-scope__switcher"
				data-testid="mail-signature-shared-switcher"
				role="switch"
				aria-checked="${this.#shared}"
				aria-label="${Loc.getMessage('MAIL_SIGNATURE_EDITOR_SHARED_SCOPE_TITLE') ?? ''}"
			></button>
		`;

		const card = Tag.render`
			<div class="mail-signature-shared-scope" data-testid="mail-signature-shared-scope">
				<div class="mail-signature-shared-scope__header">
					<div class="mail-signature-shared-scope__title-block">
						<div class="mail-signature-shared-scope__title">
							${Loc.getMessage('MAIL_SIGNATURE_EDITOR_SHARED_SCOPE_TITLE') ?? ''}
						</div>
						<div class="mail-signature-shared-scope__subtitle">
							${Loc.getMessage('MAIL_SIGNATURE_EDITOR_SHARED_SCOPE_HINT') ?? ''}
						</div>
					</div>
					${switcherNode}
				</div>
				<div class="mail-signature-shared-scope__content" data-role="shared-scope-content">
					<div class="mail-signature-assignment-type__label">${label}</div>
					<div
						class="mail-signature-assignment-type__options"
						role="radiogroup"
						aria-label="${label}"
					>
						${ASSIGNMENT_MODES.map((mode: AssignmentMode) => this.#renderOption(mode))}
					</div>
					<div class="mail-signature-assignment-type__panel" data-role="shared-panel"></div>
					<div
						class="mail-signature-assignment-type__error"
						data-role="shared-error"
						data-testid="mail-signature-assignment-error"
						role="status"
						aria-live="polite"
					></div>
				</div>
			</div>
		`;

		Dom.append(card, container);

		// Switcher Flow typings mark all options as required, the runtime does not
		this.#switcher = new Switcher({
			node: switcherNode,
			size: SwitcherSize.large,
			useAirDesign: true,
			showStateTitle: false,
			checked: this.#shared,
			handlers: {
				toggled: () => {
					const shared = this.#switcher?.isChecked() === true;
					switcherNode.setAttribute('aria-checked', String(shared));
					this.#setShared(shared);
				},
			},
		} as unknown as ConstructorParameters<typeof Switcher>[0]);

		this.#contentContainer = card.querySelector('[data-role="shared-scope-content"]');
		this.#errorContainer = card.querySelector('[data-role="shared-error"]');

		const panelContainer: HTMLElement | null = card.querySelector('[data-role="shared-panel"]');
		if (panelContainer)
		{
			this.#assignmentBlock.renderTo(panelContainer);
			this.#assignmentBlock.setMode(this.#mode);
		}

		this.#updateVisibility();
	}

	isSharedScope(): boolean
	{
		return this.#shared;
	}

	subscribeToScope(handler: (shared: boolean) => void): void
	{
		this.#scopeHandlers.push(handler);
	}

	getSaveData(): PanelSaveData
	{
		const data = this.#assignmentBlock.getSaveData();

		return {
			...data,
			kind: 'shared',
			assignments: data.assignments?.length ? data.assignments : this.#fallbackAssignments(),
		};
	}

	/**
	 * A way of assigning made of a selector says whom by its targets, so an empty selector says
	 * nothing at all — an unfinished choice, not the wish to take the signature away from everybody
	 * it is assigned to. That wish has a way of its own on the card, and the message names it.
	 */
	validate(): boolean
	{
		if (this.#shared && modeRequiresTargets(this.#mode) && this.#assignmentBlock.getAssignments().length === 0)
		{
			this.#showError();

			return false;
		}

		this.#hideError();

		return true;
	}

	// --- private ---

	#showError(): void
	{
		if (this.#errorContainer)
		{
			this.#errorContainer.textContent = Loc.getMessage('MAIL_SIGNATURE_EDITOR_ASSIGN_TARGETS_REQUIRED') ?? '';
		}
	}

	#hideError(): void
	{
		if (this.#errorContainer)
		{
			this.#errorContainer.textContent = '';
		}
	}

	#renderOption(mode: AssignmentMode): HTMLElement
	{
		const title = Loc.getMessage(`MAIL_SIGNATURE_EDITOR_ASSIGN_TYPE_${mode.toUpperCase()}`) ?? mode;

		const radio = new RadioButton({
			group: RADIO_GROUP,
			size: RadioButtonSize.Md,
			checked: mode === this.#mode,
			attributes: {
				value: mode,
				'aria-label': title,
				'data-testid': `mail-signature-assignment-${mode}`,
			},
			onChange: ({ checked }: { checked: boolean }) => {
				if (checked)
				{
					this.#selectMode(mode);
				}
			},
		});

		this.#radios.set(mode, radio);

		const option = Tag.render`
			<div class="mail-signature-assignment-type__option">
				${radio.render()}
				<span class="mail-signature-assignment-type__option-text">${title}</span>
			</div>
		`;

		// the RadioButton label wraps the control only, so the rest of the row selects it too
		Event.bind(option, 'click', (event: MouseEvent) => {
			if (event.target instanceof HTMLElement && event.target.closest('label'))
			{
				return;
			}

			this.#selectMode(mode);
		});

		return option;
	}

	#selectMode(mode: AssignmentMode): void
	{
		this.#mode = mode;

		this.#hideError();
		this.#syncRadios();

		this.#assignmentBlock.setMode(mode);
	}

	// a native radio group notifies only the control that changed, so the rest are reset by hand
	#syncRadios(): void
	{
		this.#radios.forEach((radio: RadioButton, mode: AssignmentMode) => {
			radio.setChecked(mode === this.#mode);
		});
	}

	#setShared(shared: boolean): void
	{
		if (shared === this.#shared)
		{
			return;
		}

		this.#shared = shared;

		this.#updateVisibility();

		this.#scopeHandlers.forEach((handler: (value: boolean) => void) => {
			handler(shared);
		});
	}

	#updateVisibility(): void
	{
		if (this.#contentContainer)
		{
			Dom.style(this.#contentContainer, 'display', this.#shared ? '' : 'none');
		}
	}

	// Neither way of assigning without a selector has targets to read: "all" is the single
	// all-target assignment, the draft is no assignment at all.
	#fallbackAssignments(): Assignment[]
	{
		if (this.#mode === 'all')
		{
			return [{ targetType: 'all', targetId: 0, isFlat: false }];
		}

		return [];
	}
}
