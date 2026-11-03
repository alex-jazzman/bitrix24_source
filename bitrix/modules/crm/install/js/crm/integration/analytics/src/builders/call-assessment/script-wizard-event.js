import { Dictionary } from '../../dictionary';
import { filterOutNilValues, getCrmMode } from '../../helpers';
import type { CallAssessmentScriptWizardEvent as ScriptWizardEventStructure } from '../../types';

/**
 * @memberof BX.Crm.Integration.Analytics.Builder.CallAssessment
 */
export class ScriptWizardEvent
{
	static createDefault(): ScriptWizardEvent
	{
		return new ScriptWizardEvent();
	}

	buildData(): ScriptWizardEventStructure
	{
		return filterOutNilValues({
			tool: Dictionary.TOOL_CRM,
			category: Dictionary.CATEGORY_SPEECH_ANALYTICS,
			event: Dictionary.EVENT_SCRIPT_WIZARD,
			p1: getCrmMode(),
		});
	}
}
