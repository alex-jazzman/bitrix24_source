import { Text } from 'main.core';
import { Dictionary } from '../../dictionary';
import { getCrmMode } from '../../helpers';
import { type CallAssessmentCallReassessmentEvent as CallReassessmentEventStructure } from '../../types';

const ALLOWED_ELEMENTS = new Set([
	Dictionary.ELEMENT_UPDATED_SCRIPT,
	Dictionary.ELEMENT_OTHER_SCRIPT,
]);

/**
 * @memberof BX.Crm.Integration.Analytics.Builder.CallAssessment
 */
export class CallReassessmentEvent
{
	#activityId: number = 0;
	#scriptId: number = 0;
	#element: string = '';

	static createDefault(activityId: number, scriptId: number, element: string): CallReassessmentEvent
	{
		const self = new CallReassessmentEvent();

		self.#activityId = Text.toInteger(activityId);
		self.#scriptId = Text.toInteger(scriptId);
		self.#element = element;

		return self;
	}

	buildData(): ?CallReassessmentEventStructure
	{
		if (this.#activityId <= 0)
		{
			console.error('crm.integration.analytics: invalid activity id');

			return null;
		}

		if (this.#scriptId <= 0)
		{
			console.error('crm.integration.analytics: invalid script id');

			return null;
		}

		if (!ALLOWED_ELEMENTS.has(this.#element))
		{
			console.error('crm.integration.analytics: invalid element');

			return null;
		}

		return {
			tool: Dictionary.TOOL_CRM,
			category: Dictionary.CATEGORY_SPEECH_ANALYTICS,
			event: Dictionary.EVENT_REEVAL_SCRIPT,
			type: Dictionary.TYPE_CALL_SCORE,
			c_element: this.#element,
			p1: getCrmMode(),
			p2: `scriptId_${this.#scriptId}`,
			p5: `idCall_${this.#activityId}`,
		};
	}
}
