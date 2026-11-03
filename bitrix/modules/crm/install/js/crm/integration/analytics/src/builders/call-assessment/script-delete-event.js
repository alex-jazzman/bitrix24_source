import { Text } from 'main.core';
import { Dictionary } from '../../dictionary';
import { filterOutNilValues, getCrmMode } from '../../helpers';
import type { CallAssessmentScriptDeleteEvent as ScriptDeleteEventStructure } from '../../types';

/**
 * @memberof BX.Crm.Integration.Analytics.Builder.CallAssessment
 */
export class ScriptDeleteEvent
{
	#callAssessmentId: number = 0;

	static createDefault(callAssessmentId: number): ScriptDeleteEvent
	{
		const self = new ScriptDeleteEvent();

		self.#callAssessmentId = Text.toInteger(callAssessmentId);

		return self;
	}

	buildData(): ?ScriptDeleteEventStructure
	{
		if (this.#callAssessmentId <= 0)
		{
			console.error('crm.integration.analytics: invalid call assessment id');

			return null;
		}

		return filterOutNilValues({
			tool: Dictionary.TOOL_CRM,
			category: Dictionary.CATEGORY_SPEECH_ANALYTICS,
			event: Dictionary.EVENT_SCRIPT_DELETE,
			type: Dictionary.TYPE_SCRIPT,
			p1: getCrmMode(),
			p2: `scriptId_${this.#callAssessmentId}`,
		});
	}
}
