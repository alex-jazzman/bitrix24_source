import { Text } from 'main.core';
import { Dictionary } from '../../dictionary';
import { filterOutNilValues, getCrmMode } from '../../helpers';
import type { CallAssessmentOpenScriptEvent as OpenScriptEventStructure } from '../../types';

/**
 * @memberof BX.Crm.Integration.Analytics.Builder.CallAssessment
 */
export class OpenScriptEvent
{
	#callAssessmentId: number = 0;

	static createDefault(callAssessmentId: number): OpenScriptEvent
	{
		const self = new OpenScriptEvent();

		self.#callAssessmentId = Text.toInteger(callAssessmentId);

		return self;
	}

	buildData(): ?OpenScriptEventStructure
	{
		if (this.#callAssessmentId <= 0)
		{
			console.error('crm.integration.analytics: invalid call assessment id');

			return null;
		}

		return filterOutNilValues({
			tool: Dictionary.TOOL_CRM,
			category: Dictionary.CATEGORY_SPEECH_ANALYTICS,
			event: Dictionary.EVENT_OPEN_SCRIPT,
			type: Dictionary.TYPE_SCRIPT,
			p1: getCrmMode(),
			p2: `scriptId_${this.#callAssessmentId}`,
		});
	}
}
