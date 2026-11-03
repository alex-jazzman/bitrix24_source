import { Dictionary } from '../../dictionary';
import { filterOutNilValues, getCrmMode } from '../../helpers';
import type { CallAssessmentBiReportEvent as BiReportEventStructure } from '../../types';

/**
 * @memberof BX.Crm.Integration.Analytics.Builder.CallAssessment
 */
export class BiReportEvent
{
	static createDefault(): BiReportEvent
	{
		return new BiReportEvent();
	}

	buildData(): BiReportEventStructure
	{
		return filterOutNilValues({
			tool: Dictionary.TOOL_CRM,
			category: Dictionary.CATEGORY_SPEECH_ANALYTICS,
			event: Dictionary.EVENT_BI_REPORT_BUTTON,
			p1: getCrmMode(),
		});
	}
}
