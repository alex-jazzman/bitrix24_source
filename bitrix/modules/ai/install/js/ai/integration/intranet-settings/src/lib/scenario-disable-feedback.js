import { Runtime, Text, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { type ScenarioDisableFeedbackSettings } from '../types';
import { ScenarioDisableTracker } from './scenario-disable-tracker';

const BEFORE_SAVE_EVENT = 'BX.Intranet.Settings:onBeforeSave';
const SUCCESS_SAVE_EVENT = 'BX.Intranet.Settings:onSuccessSave';
const FAILED_SAVE_EVENT = 'BX.UI.FormElement.Field:onFailedSave';

export class ScenarioDisableFeedback
{
	#settings: ScenarioDisableFeedbackSettings;

	constructor(settings: ?ScenarioDisableFeedbackSettings)
	{
		this.#settings = {
			enabled: settings?.enabled === true,
			idPrefix: Type.isString(settings?.idPrefix) ? settings.idPrefix : '',
			forms: Type.isArray(settings?.forms) ? settings.forms : [],
		};
	}

	async open(disabledCodes: Array<string>): Promise<void>
	{
		if (
			!this.#settings.enabled
			|| this.#settings.idPrefix === ''
			|| this.#settings.forms.length === 0
			|| disabledCodes.length === 0
		)
		{
			return;
		}

		try
		{
			const { Form } = await Runtime.loadExtension('ui.feedback.form');
			if (!Type.isFunction(Form?.open))
			{
				return;
			}

			Form.open({
				id: `${this.#settings.idPrefix}-${Text.getRandom(8)}`,
				forms: this.#settings.forms,
				presets: {
					from_domain: window.location.hostname,
					switcher_type: disabledCodes.join(','),
				},
			});
		}
		catch
		{
			// Feedback is optional and must not affect a completed settings save.
		}
	}
}

export type ScenarioDisableFeedbackLifecycle = {
	setTracker: (tracker: ScenarioDisableTracker) => void,
	bind: () => void,
};

export function createScenarioDisableFeedbackLifecycle(
	feedback: ScenarioDisableFeedback,
	eventEmitter: any = EventEmitter,
): ScenarioDisableFeedbackLifecycle
{
	let tracker: ?ScenarioDisableTracker = null;
	let isBound = false;

	const handleBeforeSave = (event): void => {
		const eventData = event?.getData();
		tracker?.prepare(eventData?.data?.ai ?? {});
	};

	const handleSuccessSave = (): void => {
		const disabledCodes = tracker?.commit() ?? [];
		void feedback.open(disabledCodes);
	};

	const handleFailedSave = (): void => {
		tracker?.rollback();
	};

	return {
		setTracker(newTracker: ScenarioDisableTracker): void
		{
			tracker = newTracker;
		},
		bind(): void
		{
			if (isBound)
			{
				return;
			}

			isBound = true;
			eventEmitter.subscribe(eventEmitter.GLOBAL_TARGET, BEFORE_SAVE_EVENT, handleBeforeSave);
			eventEmitter.subscribe(eventEmitter.GLOBAL_TARGET, SUCCESS_SAVE_EVENT, handleSuccessSave);
			eventEmitter.subscribe(FAILED_SAVE_EVENT, handleFailedSave);
		},
	};
}
