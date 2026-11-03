import { Text } from 'main.core';
import { Dictionary } from '../../dictionary';
import { filterOutNilValues, getCrmMode } from '../../helpers';
import type { CallAssessmentScriptToggleEvent as ScriptToggleEventStructure } from '../../types';

/**
 * @memberof BX.Crm.Integration.Analytics.Builder.CallAssessment
 */
export class ScriptToggleEvent
{
	#isEnabled: boolean = false;
	#callAssessmentId: number = 0;

	static createDefault(isEnabled: boolean, callAssessmentId: number): ScriptToggleEvent
	{
		const self = new ScriptToggleEvent();

		self.#isEnabled = isEnabled;
		self.#callAssessmentId = Text.toInteger(callAssessmentId);

		return self;
	}

	buildData(): ?ScriptToggleEventStructure
	{
		if (this.#callAssessmentId <= 0)
		{
			console.error('crm.integration.analytics: invalid call assessment id');

			return null;
		}

		return filterOutNilValues({
			tool: Dictionary.TOOL_CRM,
			category: Dictionary.CATEGORY_SPEECH_ANALYTICS,
			event: Dictionary.EVENT_SCRIPT_TOGGLE,
			type: Dictionary.TYPE_SCRIPT,
			c_element: this.#isEnabled ? Dictionary.ELEMENT_ON : Dictionary.ELEMENT_OFF,
			p1: getCrmMode(),
			p2: `scriptId_${this.#callAssessmentId}`,
		});
	}
}
