import { Loc } from 'main.core';

import { ActivityProvider, Base } from './base.js';
import type { aiData } from './base.js';

/**
 * @memberOf BX.Crm.AI.Call
 */
export class Transcription extends Base
{
	constructor(data: aiData)
	{
		// eslint-disable-next-line no-param-reassign
		data.activityProvider = ActivityProvider.call; // for call only

		super(data);
	}

	initDefaultOptions(): void
	{
		this.id = 'crm-copilot-transcript';
		this.aiDataAction = 'crm.timeline.ai.getCopilotTranscript';

		this.sliderTitle = Loc.getMessage('CRM_COMMON_COPILOT');
		this.sliderWidth = 730;

		this.textboxTitle = Loc.getMessage('CRM_COPILOT_CALL_TRANSCRIPT_TITLE');
	}

	getNotAccuratePhraseCode(): string
	{
		return 'CRM_COPILOT_CALL_TRANSCRIPT_NOT_BE_ACCURATE';
	}

	prepareAiJobResult(response: Object): string
	{
		return response.data.aiJobResult.transcription;
	}
}
