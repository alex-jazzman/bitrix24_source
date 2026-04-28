export type WizardControllerOptions = {
	currentStepIndex: number,
	isProcessNext: boolean,
	isProcessBack: boolean,
	isBottomNavigationHidden: boolean,
	isFinish: boolean,

	enableCancelConfirmation: boolean,
	enableCompleteConfirmation: boolean,
	enableAgainConfirmation: boolean,
};

export class WizardController
{
	currentStepIndex: number;
	isProcessNext: boolean;
	isProcessBack: boolean;
	isBottomNavigationHidden: boolean;
	isFinish: boolean;

	enableCancelConfirmation: boolean;
	enableCompleteConfirmation: boolean;
	enableAgainConfirmation: boolean;

	constructor(options: WizardControllerOptions = {})
	{
		this.currentStepIndex = options.currentStepIndex;
		this.isProcessNext = options.isProcessNext;
		this.isProcessBack = options.isProcessBack;
		this.isBottomNavigationHidden = options.isBottomNavigationHidden;
		this.isFinish = options.isFinish;

		this.enableCancelConfirmation = options.enableCancelConfirmation;
		this.enableCompleteConfirmation = options.enableCompleteConfirmation;
		this.enableAgainConfirmation = options.enableAgainConfirmation;
	}
}
