import { Loc, Text, Type } from 'main.core';
import { Center } from 'ui.notification';
import { type Button } from 'ui.buttons';
import { getEntityMessage } from 'crm.stage.entity-text';

import { LossReasonDialog } from './component/loss-reason-dialog';
import { OutcomeDialog } from './component/outcome-dialog';
import { CloseToast } from './component/close-toast';
import {
	FinalTransitionModel,
	type FinalTransitionContext,
	type FinalTransitionOutcome,
	type FinalTransitionOptions,
	type FinalTransitionStageData,
} from './model/final-transition-model';

export function notifyFinalTransitionError(error: unknown, fallbackMessage: string): void
{
	let message = fallbackMessage;
	if (Type.isStringFilled(error))
	{
		message = error;
	}
	else if (error instanceof Error && Type.isStringFilled(error.message))
	{
		message = error.message;
	}
	else if (Type.isPlainObject(error))
	{
		const typedError = error as { message?: string, errors?: { message?: string }[] };
		if (Type.isStringFilled(typedError.message))
		{
			message = typedError.message;
		}
		else
		{
			const firstErrorMessage = typedError.errors?.find((item) => Type.isStringFilled(item?.message))?.message;
			if (Type.isStringFilled(firstErrorMessage))
			{
				message = firstErrorMessage;
			}
		}
	}

	Center.notify({
		content: Text.encode(message),
	});
}

export class FinalTransition
{
	#model: FinalTransitionModel;
	#outcomeDialog: OutcomeDialog | null = null;
	#lossReasonDialog: LossReasonDialog | null = null;
	#onClose: () => void;
	#successButton: Button | null;
	#onSuccessButtonShow: (complete: () => void) => void;
	#onSuccessButtonHide: () => void;
	#isClosed = false;

	static open(options: FinalTransitionOptions): FinalTransition
	{
		const transition = new FinalTransition(options);
		transition.open();

		return transition;
	}

	constructor(options: FinalTransitionOptions)
	{
		this.#model = new FinalTransitionModel(options);
		this.#onClose = Type.isFunction(options.onClose) ? options.onClose : () => {};
		this.#successButton = options.successButton ?? null;
		this.#onSuccessButtonShow = Type.isFunction(options.onSuccessButtonShow)
			? options.onSuccessButtonShow
			: () => {}
		;

		this.#onSuccessButtonHide = Type.isFunction(options.onSuccessButtonHide)
			? options.onSuccessButtonHide
			: () => {}
		;
	}

	open(): void
	{
		this.#showOutcomeDialog();
	}

	close(): void
	{
		if (this.#isClosed)
		{
			return;
		}

		this.#hideDialogs();
		this.#completeClose();
	}

	// The arrow keeps this bound when passed to LossReasonDialog.
	#showOutcomeDialog = (): void => {
		this.#lossReasonDialog?.hideForNavigation();
		this.#lossReasonDialog = null;
		const failureStages = this.#model.getAllFailureStages();
		this.#outcomeDialog = new OutcomeDialog({
			entityTitle: this.#model.getEntityTitle(),
			entityTextContext: this.#model.getEntityTextContext(),
			canMoveToSuccess: () => this.#model.getSuccessStage() !== null,
			canMoveToFailure: () => this.#model.hasFailureStages(),
			successStage: this.#model.getConfiguredSuccessStage(),
			failureStage: failureStages.length === 1 ? failureStages[0] : null,
			successButtonText: this.#model.getSuccessButtonText(
				Loc.getMessage('CRM_STAGE_FINAL_TRANSITION_SUCCESS_BUTTON') ?? '',
			),
			failureButtonText: this.#model.getFailureButtonText(
				Loc.getMessage('CRM_STAGE_FINAL_TRANSITION_FAILURE_BUTTON') ?? '',
			),
			successButton: this.#successButton,
			onSuccessButtonShow: () => this.#onSuccessButtonShow(this.#completeCustomSuccess),
			onSuccessButtonHide: this.#onSuccessButtonHide,
			onSuccess: this.#handleSuccess,
			onFailure: this.#handleFailure,
			onPermissionDenied: () => this.#model.notifyMovePermissionDenied(),
			onClose: this.#completeClose,
		});
		this.#outcomeDialog.show();
	};

	#showLossReasonDialog(): void
	{
		this.#outcomeDialog?.hideForNavigation();
		this.#outcomeDialog = null;
		this.#lossReasonDialog = new LossReasonDialog({
			entityTitle: this.#model.getEntityTitle(),
			entityTextContext: this.#model.getEntityTextContext(),
			failureStages: this.#model.getAllFailureStages(),
			canMoveToStage: (statusId) => this.#model.canMoveToStage(statusId),
			onPermissionDenied: () => this.#model.notifyMovePermissionDenied(),
			onSelect: this.#handleFailureStageSelect,
			onBack: this.#showOutcomeDialog,
			onClose: this.#completeClose,
		});
		this.#lossReasonDialog.show();
	}

	#handleSuccess = (): void => {
		const successStage = this.#model.getSuccessStage();
		if (!successStage)
		{
			notifyFinalTransitionError(null, this.#getMessage('CRM_STAGE_FINAL_TRANSITION_SUCCESS_STAGE_NOT_FOUND'));

			return;
		}

		void this.#moveToStage(successStage, 'success');
	};

	#completeCustomSuccess = (): void => {
		this.#finish();
	};

	#handleFailure = (): void => {
		const failureStages = this.#model.getAllFailureStages();
		if (failureStages.length > 1)
		{
			this.#showLossReasonDialog();

			return;
		}

		const failureStage = failureStages[0] ?? null;
		if (!failureStage)
		{
			notifyFinalTransitionError(null, this.#getMessage('CRM_STAGE_FINAL_TRANSITION_FAILURE_STAGE_NOT_FOUND'));

			return;
		}

		void this.#moveToStage(failureStage, 'failure');
	};

	#handleFailureStageSelect = (stage: FinalTransitionStageData): void => {
		void this.#moveToStage(stage, 'failure');
	};

	async #moveToStage(stage: FinalTransitionStageData, outcome: FinalTransitionOutcome): Promise<void>
	{
		const activeDialog = this.#lossReasonDialog ?? this.#outcomeDialog;
		activeDialog?.setSubmitting(true);

		try
		{
			const context = this.#model.createMoveContext(stage, outcome);
			await this.#model.moveToStage(stage, context);
			this.#finish();
			this.#showCloseToast(context);
		}
		catch (error)
		{
			if (!this.#model.isMoveCancelled(error))
			{
				notifyFinalTransitionError(error, this.#getMessage('CRM_STAGE_FINAL_TRANSITION_ERROR'));
			}
		}
		finally
		{
			activeDialog?.setSubmitting(false);
		}
	}

	#showCloseToast(context: FinalTransitionContext): void
	{
		CloseToast.show({
			context,
			entityTitle: this.#model.getEntityTitle(),
			onUndo: async () => {
				await this.#model.undo(context.previousStatusId);
			},
		});
	}

	#hideDialogs(): void
	{
		this.#lossReasonDialog?.hideForNavigation();
		this.#outcomeDialog?.hideForNavigation();
		this.#lossReasonDialog = null;
		this.#outcomeDialog = null;
	}

	#finish(): void
	{
		this.#hideDialogs();
		this.#isClosed = true;
	}

	#completeClose = (): void => {
		if (this.#isClosed)
		{
			return;
		}

		this.#isClosed = true;
		this.#lossReasonDialog = null;
		this.#outcomeDialog = null;
		this.#onClose();
	};

	#getMessage(code: string): string
	{
		return getEntityMessage(code, this.#model.getEntityTextContext(), {
			'#ENTITY#': this.#model.getEntityTitle(),
			'#ENTITY_TYPE#': this.#model.getEntityTextContext().entityTypeCaption ?? '',
		});
	}
}
