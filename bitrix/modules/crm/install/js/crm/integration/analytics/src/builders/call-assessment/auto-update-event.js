import { Dictionary } from '../../dictionary';
import { filterOutNilValues, getCrmMode } from '../../helpers';
import type { CallAssessmentAutoUpdateEvent as AutoUpdateEventStructure } from '../../types';

/**
 * @memberof BX.Crm.Integration.Analytics.Builder.CallAssessment
 */
export class AutoUpdateEvent
{
	#isEnabled: boolean = false;
	#callAssessmentId: ?number = null;

	static createDefault(isEnabled: boolean): AutoUpdateEvent
	{
		const self = new AutoUpdateEvent();

		self.#isEnabled = isEnabled;

		return self;
	}

	setCallAssessmentId(callAssessmentId: ?number): AutoUpdateEvent
	{
		this.#callAssessmentId = callAssessmentId;

		return this;
	}

	buildData(): AutoUpdateEventStructure
	{
		const id = this.#callAssessmentId;

		return filterOutNilValues({
			tool: Dictionary.TOOL_CRM,
			category: Dictionary.CATEGORY_SPEECH_ANALYTICS,
			event: Dictionary.EVENT_AUTO_UPDATE,
			type: Dictionary.TYPE_SCRIPT,
			c_element: this.#isEnabled ? Dictionary.ELEMENT_ON : Dictionary.ELEMENT_OFF,
			p1: getCrmMode(),
			p2: id && id > 0 ? `scriptId_${id}` : null,
		});
	}
}
