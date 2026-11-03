import { Text } from 'main.core';
import { Dictionary } from '../../dictionary';
import { filterOutNilValues, getCrmMode } from '../../helpers';
import type { CallAssessmentOpenCallScoreEvent as OpenCallScoreEventStructure } from '../../types';

/**
 * @memberof BX.Crm.Integration.Analytics.Builder.CallAssessment
 */
export class OpenCallScoreEvent
{
	#activityId: number = 0;
	#callAssessmentId: ?number = null;

	static createDefault(activityId: number): OpenCallScoreEvent
	{
		const self = new OpenCallScoreEvent();

		self.#activityId = Text.toInteger(activityId);

		return self;
	}

	setCallAssessmentId(callAssessmentId: ?number): OpenCallScoreEvent
	{
		this.#callAssessmentId = callAssessmentId;

		return this;
	}

	buildData(): ?OpenCallScoreEventStructure
	{
		if (this.#activityId <= 0)
		{
			console.error('crm.integration.analytics: invalid activity id');

			return null;
		}

		const id = this.#callAssessmentId;
		const hasScriptId = Number.isFinite(id) && (id ?? 0) > 0;

		return filterOutNilValues({
			tool: Dictionary.TOOL_CRM,
			category: Dictionary.CATEGORY_SPEECH_ANALYTICS,
			event: Dictionary.EVENT_OPEN_CALL_SCORE,
			type: Dictionary.TYPE_CALL_SCORE,
			p1: getCrmMode(),
			p2: hasScriptId ? `scriptId_${id ?? 0}` : null,
			p5: `idCall_${this.#activityId}`,
		});
	}
}
