/**
 * @module intranet/qualification
 */
jn.define('intranet/qualification', (require, exports, module) => {
	const { BackgroundUIManager } = require('background/ui-manager');
	const { Wizard } = require('layout/ui/wizard');
	const { Step } = require('intranet/qualification/step');
	const { StepLayout } = require('intranet/qualification/step-layout');
	const { AnalyticsHandler } = require('intranet/qualification/analytics-handler');
	const { getQualificationData } = require('intranet/qualification/src/api');
	const { Type } = require('type');
	const { isEmpty } = require('utils/object');

	const COMPONENT_NAME = 'intranet:qualification';

	class Qualification
	{
		constructor(props)
		{
			this.qualificationData = props?.data;
		}

		static async init()
		{
			const qualificationData = await getQualificationData().catch(console.error);

			return new Qualification({ data: qualificationData });
		}

		tryShowComponent()
		{
			if (this.shouldShowQualification())
			{
				BackgroundUIManager.openComponent(
					COMPONENT_NAME,
					Qualification.openComponent.bind(null, this.getQualificationData()),
					20000,
				);
			}
		}

		hasQualificationData()
		{
			return !isEmpty(this.qualificationData);
		}

		getQualificationData()
		{
			return this.qualificationData;
		}

		shouldShowQualification()
		{
			return this.hasQualificationData()
				&& Type.isArrayFilled(this.qualificationData?.steps)
				&& Type.isStringFilled(this.qualificationData?.version);
		}

		static openComponent(qualificationData)
		{
			PageManager.openComponent('JSStackComponent', {
				name: 'JSStackComponent',
				// eslint-disable-next-line no-undef
				scriptPath: availableComponents[COMPONENT_NAME].publicUrl,
				componentCode: COMPONENT_NAME,
				canOpenInDefault: true,
				rootWidget: {
					name: 'layout',
					settings: {
						objectName: 'layout',
						modal: true,
					},
				},
				params: {
					QUALIFICATION_DATA: qualificationData,
				},
			});
		}

		static showComponent(layout, qualificationData)
		{
			const wizardComponent = new Wizard({
				parentLayout: layout,
				showNextStepButtonAtBottom: true,
				stepLayoutClass: StepLayout,
				steps: qualificationData.steps.map(({ id }) => id),
				stepForId: (stepId, wizard) => {
					const rawStep = qualificationData.steps.find(({ id }) => id === stepId);

					return new Step({
						wizard,
						id: rawStep.id,
						shouldCountAsStep: rawStep.shouldCountAsStep,
						isActive: rawStep.isActive,
						image: rawStep.image,
						contentTitle: rawStep.contentTitle,
						contentDescription: rawStep.contentDescription,
						fields: rawStep.fields,
						buttons: rawStep.buttons,
					});
				},
			});

			AnalyticsHandler.setWizard(wizardComponent);
			AnalyticsHandler.setQualificationId(qualificationData.version);

			layout.setListener((eventName) => {
				if (eventName === 'onViewHidden')
				{
					BackgroundUIManager.onCloseActiveComponent();
				}
			});
			layout.setBackButtonHandler(() => true);
			layout.showComponent(wizardComponent);
		}
	}

	module.exports = { Qualification };
});
