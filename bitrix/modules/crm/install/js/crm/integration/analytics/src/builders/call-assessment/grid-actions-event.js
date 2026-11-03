import { Dictionary } from '../../dictionary';
import { filterOutNilValues, getCrmMode } from '../../helpers';
import type { CallAssessmentGridActionsEvent as GridActionsEventStructure } from '../../types';

/**
 * @memberof BX.Crm.Integration.Analytics.Builder.CallAssessment
 */
export class GridActionsEvent
{
	#element: GridActionsEventStructure['c_element'];
	#callAssessmentId: ?number = null;

	static createDefault(element: GridActionsEventStructure['c_element']): GridActionsEvent
	{
		const self = new GridActionsEvent();

		self.#element = element;

		return self;
	}

	setCallAssessmentId(callAssessmentId: ?number): GridActionsEvent
	{
		this.#callAssessmentId = callAssessmentId;

		return this;
	}

	buildData(): GridActionsEventStructure
	{
		const id = this.#callAssessmentId;

		return filterOutNilValues({
			tool: Dictionary.TOOL_CRM,
			category: Dictionary.CATEGORY_SPEECH_ANALYTICS,
			event: Dictionary.EVENT_GRID_ACTIONS,
			type: Dictionary.TYPE_SCRIPT,
			c_element: this.#element,
			p1: getCrmMode(),
			p2: id && id > 0 ? `scriptId_${id}` : null,
		});
	}
}
