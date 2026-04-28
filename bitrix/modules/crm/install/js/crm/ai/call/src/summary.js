import { NameService } from 'crm.ai.name-service';
import { Loc } from 'main.core';

import { Base } from './base.js';

/**
 * @memberOf BX.Crm.AI.Call
 */
export class Summary extends Base
{
	initDefaultOptions(): void
	{
		this.id = 'crm-copilot-summary';
		this.aiDataAction = 'crm.timeline.ai.getCopilotSummary';

		this.sliderTitle = NameService.copilotName();
		this.sliderWidth = 520;

		this.textboxTitle = Loc.getMessage('CRM_COPILOT_CALL_SUMMARY_TITLE');
	}

	getNotAccuratePhraseCode(): string
	{
		return 'CRM_COPILOT_CALL_SUMMARY_NOT_BE_ACCURATE';
	}

	prepareAiJobResult(response: Object): string
	{
		return response.data.aiJobResult.summary;
	}
}
