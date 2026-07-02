/**
 * @module mail/mailbox/connector/wizard
 */
jn.define('mail/mailbox/connector/wizard', (require, exports, module) => {
	const { Wizard } = require('layout/ui/wizard');
	const { Color } = require('tokens');

	/**
	 * @class MailWizard
	 */
	class MailWizard extends Wizard
	{
		toggleChangeStepButtons(isNextStepEnabled = true)
		{
			const currentStep = this.getCurrentStep();
			const isNeedToSkip = currentStep.isNeedToSkip();
			const isNeedToShowNextStep = currentStep.isNeedToShowNextStep();

			if (isNeedToSkip || !isNeedToShowNextStep)
			{
				return;
			}

			const isEnabled = currentStep.isNextStepEnabled() && isNextStepEnabled && !this.isLoading;

			if (this.showNextStepButtonAtBottom)
			{
				this.stepLayoutRefs.get(this.getCurrentStepId())?.toggleChangeStepButton(isEnabled);
			}
			else
			{
				this.currentLayout.setRightButtons([
					{
						name: currentStep.getNextStepButtonText(),
						testId: 'wizardMoveToNextStepButton',
						type: 'text',
						color: isEnabled ? Color.accentMainPrimary.toHex() : Color.base6.toHex(),
						callback: () => {
							if (isEnabled)
							{
								this.moveToNextStep();
							}
						},
					},
				]);
			}

			const prevStepIndex = this.getPrevStepIndex();
			if (prevStepIndex < 0 || !currentStep.isPrevStepEnabled())
			{
				this.currentLayout.setLeftButtons([]);

				return;
			}

			this.currentLayout.setLeftButtons([
				{
					type: 'back',
					callback: async () => {
						await currentStep.onMoveToBackStep(this.getStepIdByIndex(prevStepIndex));
						this.currentLayout.back();
					},
				},
			]);
		}
	}

	module.exports = { MailWizard };
});
