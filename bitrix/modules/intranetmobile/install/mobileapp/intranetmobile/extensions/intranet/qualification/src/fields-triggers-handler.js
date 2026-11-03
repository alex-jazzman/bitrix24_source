/**
 * @module intranet/qualification/fields-triggers-handler
 */
jn.define('intranet/qualification/fields-triggers-handler', (require, exports, module) => {
	const { showToast, Position } = require('toast');
	const { Type } = require('type');
	const { StepSwitchButtonType } = require('layout/ui/wizard/const');
	const { FieldType, TriggerType } = require('intranet/qualification/const');
	const { applyMobilePreset, saveFieldValue } = require('intranet/qualification/src/api');
	const { AnalyticsHandler } = require('intranet/qualification/analytics-handler');

	const STEP_SWITCH_TRIGGER_TYPES = new Set([TriggerType.STEP_ACTIVATE, TriggerType.STEP_DEACTIVATE]);

	const isStepSwitchTrigger = ({ type }) => STEP_SWITCH_TRIGGER_TYPES.has(type);

	class FieldsTriggersHandler
	{
		/**
		 * @param {Object} props
		 * @param {string} props.stepId
		 * @param {Wizard} props.wizard
		 * @param {Array} props.fields
		 * @param {Map} props.fieldsValues
		 * @param {PageManager} [props.layoutWidget=PageManager]
		 */
		constructor(props)
		{
			this.stepId = props.stepId;
			this.wizard = props.wizard;
			this.fields = props.fields;
			this.fieldsValues = props.fieldsValues;
			this.layoutWidget = props.layoutWidget || PageManager;
		}

		/**
		 * @param {StepSwitchButtonType} stepSwitchButtonType
		 * @return {Promise}
		 */
		handleFieldsTriggers(stepSwitchButtonType)
		{
			return Promise.allSettled(
				this.fields.map(({ id, type, triggers: rawTriggers = [] }) => {
					const triggers = rawTriggers.filter((trigger) => Object.values(TriggerType).includes(trigger.type));

					if (
						type === FieldType.PHONE_INPUT
						|| type === FieldType.BALLOON_ONE_SELECT
						|| type === FieldType.BALLOON_MULTIPLE_SELECT
					)
					{
						triggers.push({ type: TriggerType.SAVE_VALUE });
					}

					if (!Type.isArrayFilled(triggers))
					{
						return Promise.resolve();
					}

					return Promise.allSettled([
						this.#handleStepSwitchTriggers(
							triggers.filter((trigger) => isStepSwitchTrigger(trigger)),
							stepSwitchButtonType,
							id,
							type,
						),
						...triggers.filter((trigger) => !isStepSwitchTrigger(trigger)).map((trigger) => {
							switch (trigger.type)
							{
								case TriggerType.TOAST_SHOW:
									return this.#handleToastShowTrigger(trigger, stepSwitchButtonType);

								case TriggerType.PRESET_SET:
									return this.#handlePresetSetTrigger(trigger, stepSwitchButtonType, id, type);

								case TriggerType.SAVE_VALUE:
									return this.#handleSaveValueTrigger(trigger, stepSwitchButtonType, id, type);

								default:
									return Promise.resolve();
							}
						}),
					]);
				}),
			);
		}

		#handleStepSwitchTriggers(triggers, stepSwitchButtonType, fieldId, fieldType)
		{
			if (stepSwitchButtonType !== StepSwitchButtonType.CONTINUE)
			{
				return Promise.resolve();
			}

			if (fieldType === FieldType.BALLOON_ONE_SELECT || fieldType === FieldType.BALLOON_MULTIPLE_SELECT)
			{
				this.#resolveStepStates(triggers, fieldId)
					.forEach((shouldActivate, stepId) => this.#switchStep(stepId, shouldActivate));
			}

			return Promise.resolve();
		}

		// step id -> whether the step stays active once every step switch rule of the field is applied.
		// Rules of one type are merged, so a step named by several of them switches once - at least one
		// rule of that type matched the value. Between types the order in the survey configuration decides:
		// the last rule naming the step wins, the way every rule did before rules of one type were merged
		#resolveStepStates(triggers, fieldId)
		{
			const selectedValues = Object.values(this.fieldsValues.get(fieldId) || {});
			const matchesByType = new Map();
			const lastTypeByStep = new Map();

			triggers.forEach(({ type, stepIds, values }) => {
				const isMatched = selectedValues.some((value) => values.includes(value));
				const matches = matchesByType.get(type) || new Map();

				stepIds.forEach((stepId) => {
					matches.set(stepId, matches.get(stepId) || isMatched);
					lastTypeByStep.set(stepId, type);
				});

				matchesByType.set(type, matches);
			});

			const states = new Map();

			lastTypeByStep.forEach((type, stepId) => {
				const isMatched = matchesByType.get(type).get(stepId);

				states.set(stepId, type === TriggerType.STEP_ACTIVATE ? isMatched : !isMatched);
			});

			return states;
		}

		#switchStep(stepId, shouldActivate)
		{
			if (shouldActivate)
			{
				this.wizard.activateStep(stepId);
			}
			else
			{
				this.wizard.deactivateStep(stepId);
			}
		}

		#handleToastShowTrigger(trigger, stepSwitchButtonType)
		{
			if (stepSwitchButtonType === StepSwitchButtonType.CONTINUE)
			{
				showToast(
					{
						message: trigger.message.replaceAll('\\n', '\n'),
						position: Position.TOP,
					},
					this.layoutWidget,
				);
			}

			return Promise.resolve();
		}

		#handlePresetSetTrigger(trigger, stepSwitchButtonType, fieldId, fieldType)
		{
			if (stepSwitchButtonType !== StepSwitchButtonType.CONTINUE)
			{
				return Promise.resolve();
			}

			if (fieldType === FieldType.BALLOON_ONE_SELECT)
			{
				const { values } = trigger;

				const fieldValue = Object.values(this.fieldsValues.get(fieldId) || {})[0];
				const presetId = values[fieldValue];

				if (!presetId)
				{
					return Promise.resolve();
				}

				return new Promise((resolve) => {
					applyMobilePreset(presetId)
						.then((result) => {
							if (result?.status !== 'success')
							{
								console.error(result);
								resolve();

								return;
							}

							if (result.data?.applied === true)
							{
								AnalyticsHandler.handleSetPresetEvent(this.stepId, presetId);

								const lastStep = this.wizard.getStepById(
									this.wizard.getStepIdByIndex(this.wizard.getTotalStepsCount() - 1),
								);
								lastStep?.addFinalWizardAction(() => Application.relogin());
							}

							resolve();
						})
						.catch((error) => {
							console.error(error);
							resolve();
						})
					;
				});
			}

			return Promise.resolve();
		}

		#handleSaveValueTrigger(trigger, stepSwitchButtonType, fieldId, fieldType)
		{
			if (stepSwitchButtonType !== StepSwitchButtonType.CONTINUE)
			{
				return Promise.resolve();
			}

			if (
				fieldType === FieldType.PHONE_INPUT
				|| fieldType === FieldType.BALLOON_ONE_SELECT
				|| fieldType === FieldType.BALLOON_MULTIPLE_SELECT
			)
			{
				return saveFieldValue(this.fieldsValues.get(fieldId), fieldId, fieldType);
			}

			return Promise.resolve();
		}
	}

	module.exports = { FieldsTriggersHandler };
});
