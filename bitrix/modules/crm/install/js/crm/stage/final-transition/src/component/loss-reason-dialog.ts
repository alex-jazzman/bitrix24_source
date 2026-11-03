import { Dom, Event, Loc, Tag, Text } from 'main.core';
import { AirButtonStyle, Button, ButtonSize, type ButtonOptions } from 'ui.buttons';
import 'ui.a11y';
import { Dialog, type DialogEvents, type DialogOptions } from 'ui.system.dialog';

import { StageDescriptionTooltip } from 'crm.stage.description-tooltip';
import { getEntityMessage, type EntityTextContext } from 'crm.stage.entity-text';

import { DIALOG_TITLE_CLASS, DIALOG_WIDTH, centerInVisibleWidth, syncTitleHint } from '../lib/dialog-layout';
import { FinalTransitionModel, type FinalTransitionStageData } from '../model/final-transition-model';

// ui.system.dialog hands the width option to the popup as min and max width, but DialogOptions omits it.
type LossReasonDialogPopupOptions = DialogOptions & { width: number };

type LossReasonDialogOptions = {
	entityTitle: string,
	entityTextContext: EntityTextContext,
	failureStages: FinalTransitionStageData[],
	canMoveToStage?: (statusId: string) => boolean,
	onPermissionDenied?: () => void,
	onSelect: (stage: FinalTransitionStageData) => void,
	onBack: () => void,
	onClose: () => void,
};

export class LossReasonDialog
{
	#options: LossReasonDialogOptions;
	#dialog: Dialog | null = null;
	#contentNode: HTMLElement | null = null;
	#titleNode: HTMLElement | null = null;
	#reasonsNode: HTMLElement | null = null;
	#reasonsScrollNode: HTMLElement | null = null;
	#backButton: Button | null = null;
	#reasonNodes: HTMLElement[] = [];
	#submittingStatusNode: HTMLElement | null = null;
	#isSubmitting = false;
	#stageDescriptionTooltip = new StageDescriptionTooltip();
	#isInternalHide = false;
	#revealScrollTop: number | null = null;
	#canMoveToStage: (statusId: string) => boolean;
	#onPermissionDenied: () => void;
	#titleId = `crm-stage-final-transition-loss-title-${Text.getRandom(8).toLowerCase()}`;
	#labelId = `crm-stage-final-transition-loss-label-${Text.getRandom(8).toLowerCase()}`;
	// Bound in onShow, after the popup's own resize listener, so it runs after the popup centers itself.
	#handleWindowResize = (): void => {
		if (this.#titleNode)
		{
			syncTitleHint(this.#titleNode);
		}

		this.#centerDialog();
	};

	// Bound in the capture phase: the reason's own focusin then opens the tooltip at the scrolled position.
	#handleReasonsFocusIn = (event: FocusEvent): void => {
		const reasonItem = (event.target as HTMLElement).closest<HTMLElement>(
			'.crm-stage-final-transition__reason-wrap',
		);
		if (reasonItem)
		{
			this.#revealReason(reasonItem);
		}
	};

	#handleReasonsScroll = (): void => {
		this.#syncScrollHints();

		const isRevealScroll = this.#revealScrollTop !== null
			&& this.#reasonsScrollNode?.scrollTop === this.#revealScrollTop
		;
		this.#revealScrollTop = null;
		if (!isRevealScroll)
		{
			// The tooltip does not follow its reason, so it would point past it after scrolling.
			this.#stageDescriptionTooltip.hideImmediately();
		}
	};

	constructor(options: LossReasonDialogOptions)
	{
		this.#options = options;
		this.#canMoveToStage = options.canMoveToStage ?? (() => true);
		this.#onPermissionDenied = options.onPermissionDenied ?? (() => {});
	}

	show(): void
	{
		this.#getDialog().show();
	}

	/**
	 * Marks the dialog container because ui.system.dialog does not expose a custom class.
	 * Runs in onShow: the popup centers itself right after it, so later size changes would shift the dialog.
	 */
	#markDialogContainer(): void
	{
		const container = this.#contentNode?.closest('.ui-system-dialog');
		if (container)
		{
			Dom.addClass(container, 'crm-stage-final-transition-dialog');
			Dom.addClass(container, 'crm-stage-final-transition-dialog--loss');
			container.setAttribute('data-testid', 'crm-stage-final-transition-loss-dialog');

			const title = container.querySelector<HTMLElement>('.ui-system-dialog__header-left > :first-child');
			if (title)
			{
				title.id = this.#titleId;
				Dom.addClass(title, DIALOG_TITLE_CLASS);
				container.setAttribute('aria-labelledby', this.#titleId);
				this.#titleNode = title;
				syncTitleHint(title);
			}

			Event.bind(window, 'resize', this.#handleWindowResize);

			const closeButton = container.querySelector<HTMLElement>('.ui-system-dialog__header-close-btn');
			if (closeButton)
			{
				closeButton.dataset.testid = 'crm-stage-final-transition-loss-close';
				closeButton.setAttribute(
					'aria-label',
					Loc.getMessage('CRM_STAGE_FINAL_TRANSITION_CLOSE_BUTTON') ?? '',
				);
				[...closeButton.children].forEach((child) => child.setAttribute('aria-hidden', 'true'));
			}
		}
	}

	#centerDialog(): void
	{
		const container = this.#contentNode?.closest<HTMLElement>('.ui-system-dialog');
		if (container)
		{
			centerInVisibleWidth(container);
		}
	}

	hide(): void
	{
		this.#stageDescriptionTooltip.hideImmediately();
		this.#dialog?.hide();
	}

	hideForNavigation(): void
	{
		this.#isInternalHide = true;
		this.hide();
	}

	setSubmitting(isSubmitting: boolean): void
	{
		this.#isSubmitting = isSubmitting;
		if (this.#backButton)
		{
			this.#backButton.setDisabled(isSubmitting);
		}

		this.#reasonNodes.forEach((node) => {
			const statusId = node.dataset.statusId ?? '';
			const isPermissionDenied = !this.#canMoveToStage(statusId);
			Dom.toggleClass(node, '--disabled', isSubmitting);
			Dom.toggleClass(node, '--permission-denied', isPermissionDenied);
			node.setAttribute('aria-disabled', isSubmitting || isPermissionDenied ? 'true' : 'false');
		});
		this.#contentNode?.setAttribute('aria-busy', isSubmitting ? 'true' : 'false');
		if (this.#submittingStatusNode)
		{
			this.#submittingStatusNode.textContent = isSubmitting
				? Loc.getMessage('CRM_STAGE_FINAL_TRANSITION_SUBMITTING') ?? ''
				: ''
			;
		}
	}

	#getDialog(): Dialog
	{
		if (this.#dialog)
		{
			return this.#dialog;
		}

		// No icon: an AIR button keeps the left icon padding even though it does not draw the back icon.
		// collapsedIcon is optional at runtime but required by the ui.buttons typings, hence the assertion below.
		this.#backButton = new Button({
			text: Loc.getMessage('CRM_STAGE_FINAL_TRANSITION_BACK_BUTTON') ?? '',
			size: ButtonSize.LARGE,
			useAirDesign: true,
			style: AirButtonStyle.OUTLINE,
			onclick: () => {
				this.#options.onBack();

				return {};
			},
		} as unknown as ButtonOptions);
		const backButton = this.#backButton.getContainer();
		Dom.addClass(backButton, 'crm-stage-final-transition__back');
		backButton.dataset.testid = 'crm-stage-final-transition-loss-back';

		const label = Text.encode(Loc.getMessage('CRM_STAGE_FINAL_TRANSITION_LOSS_SUBTITLE') ?? '');
		const contentNode = Tag.render`
			<div
				class="crm-stage-final-transition crm-stage-final-transition--loss-reason"
				aria-busy="${this.#isSubmitting ? 'true' : 'false'}"
			>
				<div class="crm-stage-final-transition__field">
					<div class="crm-stage-final-transition__label" id="${this.#labelId}">${label}</div>
					<div class="crm-stage-final-transition__reasons">
						<ul class="crm-stage-final-transition__reasons-scroll" aria-labelledby="${this.#labelId}">
							${this.#options.failureStages.map((stage) => this.#renderReason(stage))}
						</ul>
					</div>
				</div>
				<visually-hidden class="crm-stage-final-transition__submitting-status" role="status" aria-live="polite"></visually-hidden>
			</div>
		`;
		this.#contentNode = contentNode;
		this.#reasonsNode = contentNode.querySelector('.crm-stage-final-transition__reasons');
		this.#reasonsScrollNode = contentNode.querySelector('.crm-stage-final-transition__reasons-scroll');
		this.#submittingStatusNode = contentNode.querySelector('.crm-stage-final-transition__submitting-status');
		if (this.#reasonsScrollNode)
		{
			Event.bind(this.#reasonsScrollNode, 'scroll', this.#handleReasonsScroll, { passive: true });
			Event.bind(this.#reasonsScrollNode, 'focusin', this.#handleReasonsFocusIn, true);
		}

		const dialogOptions: LossReasonDialogPopupOptions = {
			title: getEntityMessage('CRM_STAGE_FINAL_TRANSITION_TITLE', this.#options.entityTextContext, {
				'#ENTITY#': this.#options.entityTitle,
				'#ENTITY_TYPE#': this.#options.entityTextContext.entityTypeCaption ?? '',
			}),
			content: contentNode,
			leftButtons: [this.#backButton],
			width: DIALOG_WIDTH,
			hasCloseButton: true,
			closeByEsc: true,
			closeByClickOutside: true,
			hasOverlay: true,
			// DialogEvents marks nullable handlers as required, but EventEmitter rejects null listeners at runtime.
			events: {
				onShow: () => {
					this.#markDialogContainer();
					this.#syncScrollHints();
				},
				// Comes after the last centering of the popup and the dialog on show.
				onAfterShow: () => {
					this.#centerDialog();
				},
				onHide: () => {
					Event.unbind(window, 'resize', this.#handleWindowResize);
					if (this.#isInternalHide)
					{
						this.#isInternalHide = false;

						return;
					}

					this.#options.onClose();
				},
			} as unknown as DialogEvents,
		};
		this.#dialog = new Dialog(dialogOptions);

		return this.#dialog;
	}

	#renderReason(stage: FinalTransitionStageData): HTMLElement
	{
		const statusId = FinalTransitionModel.getStatusId(stage);
		const canMove = this.#canMoveToStage(statusId);
		const testStatusId = statusId
			.toLowerCase()
			.replaceAll(/[^\da-z]+/g, '-')
			.replaceAll(/^-+|-+$/g, '')
		;
		const name = Text.encode(FinalTransitionModel.getName(stage));
		const node = Tag.render`
			<button
				class="crm-stage-final-transition__reason --tinted-alert ${canMove ? '' : '--permission-denied'}"
				type="button"
				aria-disabled="${this.#isSubmitting || !canMove ? 'true' : 'false'}"
				data-status-id="${Text.encode(statusId)}"
				data-testid="crm-stage-final-transition-loss-reason-${testStatusId}"
			><span class="crm-stage-final-transition__reason-name">${name}</span></button>
		`;

		Event.bind(node, 'mouseenter', () => this.#showStageDescriptionTooltip(node, stage));
		Event.bind(node, 'mouseleave', () => this.#stageDescriptionTooltip.hide());
		Event.bind(node, 'focusin', () => this.#showStageDescriptionTooltip(node, stage));
		Event.bind(node, 'focusout', () => this.#stageDescriptionTooltip.hide());
		Event.bind(node, 'click', () => {
			if (this.#isSubmitting)
			{
				return;
			}

			if (!this.#canMoveToStage(statusId))
			{
				this.#onPermissionDenied();

				return;
			}

			this.#options.onSelect(stage);
		});

		this.#reasonNodes.push(node);

		return Tag.render`<li class="crm-stage-final-transition__reason-wrap">${node}</li>`;
	}

	#revealReason(reasonItem: HTMLElement): void
	{
		const scrollNode = this.#reasonsScrollNode;
		if (!scrollNode)
		{
			return;
		}

		const scrollTop = scrollNode.scrollTop;
		reasonItem.scrollIntoView({ block: 'nearest' });
		if (scrollNode.scrollTop !== scrollTop)
		{
			this.#stageDescriptionTooltip.hideImmediately();
			this.#revealScrollTop = scrollNode.scrollTop;
		}
	}

	/** Fades the list edge that has more reasons behind it. */
	#syncScrollHints(): void
	{
		const reasonsNode = this.#reasonsNode;
		const scrollNode = this.#reasonsScrollNode;
		if (!reasonsNode || !scrollNode)
		{
			return;
		}

		const maxScrollTop = scrollNode.scrollHeight - scrollNode.clientHeight;
		Dom.toggleClass(reasonsNode, '--scrolled-from-top', scrollNode.scrollTop > 0);
		Dom.toggleClass(reasonsNode, '--more-below', maxScrollTop - scrollNode.scrollTop > 1);
	}

	#showStageDescriptionTooltip(bindElement: HTMLElement, stage: FinalTransitionStageData): void
	{
		this.#stageDescriptionTooltip.show({
			bindElement,
			name: FinalTransitionModel.getName(stage),
			description: FinalTransitionModel.getDescription(stage),
			showName: false,
		});
	}
}
