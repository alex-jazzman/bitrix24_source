import { Dictionary } from '../../dictionary';
import { filterOutNilValues, getCrmMode } from '../../helpers';
import type { CallAssessmentSummaryWizardEvent as SummaryWizardEventStructure } from '../../types';

/**
 * @memberof BX.Crm.Integration.Analytics.Builder.CallAssessment
 */
export class SummaryWizardEvent
{
	static createDefault(): SummaryWizardEvent
	{
		return new SummaryWizardEvent();
	}

	buildData(): SummaryWizardEventStructure
	{
		return filterOutNilValues({
			tool: Dictionary.TOOL_CRM,
			category: Dictionary.CATEGORY_SPEECH_ANALYTICS,
			event: Dictionary.EVENT_SUMMARY_WIZARD,
			p1: getCrmMode(),
		});
	}
}
