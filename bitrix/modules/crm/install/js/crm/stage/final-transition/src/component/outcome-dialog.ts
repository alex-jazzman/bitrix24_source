import { Dom, Event, Loc, Tag, Text } from 'main.core';
import { AirButtonStyle, Button, ButtonIcon, ButtonSize, ButtonState } from 'ui.buttons';
import { Dialog, type DialogEvents, type DialogOptions } from 'ui.system.dialog';

import { StageDescriptionTooltip } from 'crm.stage.description-tooltip';
import { getEntityMessage, type EntityTextContext } from 'crm.stage.entity-text';

import { DIALOG_TITLE_CLASS, DIALOG_WIDTH, centerInVisibleWidth, syncTitleHint } from '../lib/dialog-layout';
import { isOutcomeButtonTextCropped } from '../lib/outcome-button-text';
import { FinalTransitionModel, type FinalTransitionStageData } from '../model/final-transition-model';

// ui.system.dialog hands the width option to the popup as min and max width, but DialogOptions omits it.
type OutcomeDialogPopupOptions = DialogOptions & { width: number };

type OutcomeDialogOptions = {
	entityTitle: string,
	entityTextContext: EntityTextContext,
	canMoveToSuccess: () => boolean,
	canMoveToFailure: () => boolean,
	successStage: FinalTransitionStageData | null,
	failureStage: FinalTransitionStageData | null,
	successButtonText: string,
	failureButtonText: string,
	successButton: Button | null,
	onSuccessButtonShow: () => void,
	onSuccessButtonHide: () => void,
	onSuccess: () => void,
	onFailure: () => void,
	onPermissionDenied: () => void,
	onClose: () => void,
};

export class OutcomeDialog
{
	#options: OutcomeDialogOptions;
	#dialog: Dialog | null = null;
	#successButton: Button | null = null;
	#failureButton: Button | null = null;
	#contentNode: HTMLElement | null = null;
	#titleNode: HTMLElement | null = null;
	#stageDescriptionTooltip = new StageDescriptionTooltip();
	#isInternalHide = false;
	#isSuccessButtonShown = false;
	#boundSuccessButtonContainer: HTMLElement | null = null;
	#titleId = `crm-stage-final-transition-outcome-title-${Text.getRandom(8).toLowerCase()}`;
	// Bound in onShow, after the popup's own resize listener, so it runs after the popup centers itself.
	#handleWindowResize = (): void => {
		if (this.#titleNode)
		{
			syncTitleHint(this.#titleNode);
		}

		this.#centerDialog();
	};

	#handleExternalSuccessButtonClick = (event: MouseEvent): void => {
		if (!this.#options.canMoveToSuccess())
		{
			event.preventDefault();
			event.stopImmediatePropagation();
			this.#options.onPermissionDenied();
		}
	};

	constructor(options: OutcomeDialogOptions)
	{
		this.#options = options;
	}

	show(): void
	{
		const dialog = this.#getDialog();
		this.#bindExternalSuccessButton();
		dialog.show();
		this.#notifySuccessButtonShow();
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
			Dom.addClass(container, 'crm-stage-final-transition-dialog--outcome');
			container.setAttribute('data-testid', 'crm-stage-final-transition-outcome-dialog');

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
				closeButton.dataset.testid = 'crm-stage-final-transition-outcome-close';
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
		this.#unbindExternalSuccessButton();
		this.#dialog?.hide();
	}

	hideForNavigation(): void
	{
		this.#isInternalHide = true;
		this.hide();
	}

	setSubmitting(isSubmitting: boolean): void
	{
		if (this.#successButton)
		{
			this.#setButtonState(this.#successButton, isSubmitting, this.#options.canMoveToSuccess());
		}

		if (this.#failureButton)
		{
			this.#setButtonState(this.#failureButton, isSubmitting, this.#options.canMoveToFailure());
		}
	}

	#getDialog(): Dialog
	{
		if (this.#dialog)
		{
			return this.#dialog;
		}

		const contentNode = Tag.render`<div class="crm-stage-final-transition crm-stage-final-transition--outcome"></div>`;
		this.#contentNode = contentNode;

		this.#successButton = this.#options.successButton
			?? this.#renderOutcomeButton('success', this.#options.successStage)
		;
		this.#failureButton = this.#renderOutcomeButton('failure', this.#options.failureStage);
		this.#setPermissionState(this.#successButton, this.#options.canMoveToSuccess());
		this.#setPermissionState(this.#failureButton, this.#options.canMoveToFailure());
		const dialogOptions: OutcomeDialogPopupOptions = {
			title: getEntityMessage('CRM_STAGE_FINAL_TRANSITION_TITLE', this.#options.entityTextContext, {
				'#ENTITY#': this.#options.entityTitle,
				'#ENTITY_TYPE#': this.#options.entityTextContext.entityTypeCaption ?? '',
			}),
			subtitle: Loc.getMessage('CRM_STAGE_FINAL_TRANSITION_SUBTITLE') ?? '',
			content: contentNode,
			leftButtons: [this.#successButton, this.#failureButton],
			width: DIALOG_WIDTH,
			hasVerticalPadding: false,
			hasCloseButton: true,
			closeByEsc: true,
			closeByClickOutside: true,
			hasOverlay: true,
			// DialogEvents marks nullable handlers as required, but EventEmitter rejects null listeners at runtime.
			events: {
				onShow: () => {
					this.#markDialogContainer();
				},
				// Comes after the last centering of the popup and the dialog on show.
				onAfterShow: () => {
					this.#centerDialog();
				},
				onHide: () => {
					Event.unbind(window, 'resize', this.#handleWindowResize);
					this.#unbindExternalSuccessButton();
					this.#notifySuccessButtonHide();
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

	#bindExternalSuccessButton(): void
	{
		if (!this.#options.successButton)
		{
			return;
		}

		const container = this.#options.successButton.getContainer();
		if (this.#boundSuccessButtonContainer === container)
		{
			return;
		}

		this.#unbindExternalSuccessButton();
		this.#boundSuccessButtonContainer = container;
		Event.bind(container, 'click', this.#handleExternalSuccessButtonClick, true);
	}

	#unbindExternalSuccessButton(): void
	{
		if (!this.#boundSuccessButtonContainer)
		{
			return;
		}

		Event.unbind(
			this.#boundSuccessButtonContainer,
			'click',
			this.#handleExternalSuccessButtonClick,
			true,
		);
		this.#boundSuccessButtonContainer = null;
	}

	#notifySuccessButtonShow(): void
	{
		if (
			!this.#options.successButton
			|| this.#isSuccessButtonShown
			|| !this.#options.canMoveToSuccess()
		)
		{
			return;
		}

		this.#isSuccessButtonShown = true;
		this.#options.onSuccessButtonShow();
	}

	#notifySuccessButtonHide(): void
	{
		if (!this.#options.successButton || !this.#isSuccessButtonShown)
		{
			return;
		}

		this.#isSuccessButtonShown = false;
		this.#options.onSuccessButtonHide();
	}

	#renderOutcomeButton(
		outcome: 'success' | 'failure',
		stage: FinalTransitionStageData | null,
	): Button
	{
		const isSuccess = outcome === 'success';
		const button = new Button({
			text: isSuccess ? this.#options.successButtonText : this.#options.failureButtonText,
			size: ButtonSize.LARGE,
			collapsedIcon: isSuccess ? ButtonIcon.DONE : ButtonIcon.CANCEL,
			useAirDesign: true,
			style: isSuccess ? AirButtonStyle.FILLED_SUCCESS : AirButtonStyle.FILLED_ALERT,
			round: false,
			onclick: () => {
				const canMove = isSuccess
					? this.#options.canMoveToSuccess()
					: this.#options.canMoveToFailure()
				;
				if (!canMove)
				{
					this.#options.onPermissionDenied();

					return {};
				}

				if (isSuccess && this.#options.successStage)
				{
					this.#options.onSuccess();
				}
				else
				{
					this.#options.onFailure();
				}

				return {};
			},
		});
		const buttonContainer = button.getContainer();
		Dom.addClass(buttonContainer, `crm-stage-final-transition__outcome-btn --${outcome}`);
		buttonContainer.dataset.testid = `crm-stage-final-transition-${outcome}`;
		Event.bind(buttonContainer, 'mouseenter', () => this.#showStageDescriptionTooltip(buttonContainer, stage));
		Event.bind(buttonContainer, 'mouseleave', () => this.#stageDescriptionTooltip.hide());
		Event.bind(buttonContainer, 'focusin', () => this.#showStageDescriptionTooltip(buttonContainer, stage));
		Event.bind(buttonContainer, 'focusout', () => this.#stageDescriptionTooltip.hide());

		return button;
	}

	#setPermissionState(button: Button, canMove: boolean): void
	{
		const container = button.getContainer();
		Dom.toggleClass(container, ButtonState.DISABLED, !canMove);
		container.setAttribute('aria-disabled', canMove ? 'false' : 'true');
	}

	#setButtonState(button: Button, isSubmitting: boolean, canMove: boolean): void
	{
		button.setDisabled(isSubmitting);
		this.#setPermissionState(button, !isSubmitting && canMove);
	}

	#showStageDescriptionTooltip(
		bindElement: HTMLElement,
		stage: FinalTransitionStageData | null,
	): void
	{
		const textNode = bindElement.querySelector<HTMLElement>('.ui-btn-text-inner');

		this.#stageDescriptionTooltip.show({
			bindElement,
			name: FinalTransitionModel.getName(stage),
			description: FinalTransitionModel.getDescription(stage),
			showName: isOutcomeButtonTextCropped(textNode),
		});
	}
}
