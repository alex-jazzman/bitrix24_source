import { Loc } from 'main.core';

import {
	registration as aiCallProcessingAutoRegistration,
} from '../../setting/copilot/ai-call-processing-auto';
import {
	registration as copilotFillItemFromCallRegistration,
} from '../../setting/copilot/copilot-fill-item-from-call';
import {
	registration as copilotCallAssessmentRegistration,
} from '../../setting/copilot/copilot-call-assessment';
import {
	registration as copilotAnalyzeCommunicationRegistration,
} from '../../setting/copilot/copilot-analyze-communication';
import {
	registration as copilotSummarizeRegistration,
} from '../../setting/copilot/copilot-summarize';
import {
	registration as copilotRepeatSaleRegistration,
} from '../../setting/copilot/copilot-repeat-sale';
import {
	registration as copilotFillCrmTextRegistration,
} from '../../setting/copilot/copilot-fill-crm-text';
import {
	registration as copilotMessageSenderEditorRegistration,
} from '../../setting/copilot/copilot-message-sender-editor';
import { type SettingsSectionRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

export const copilotSection: SettingsSectionRegistration = {
	id: 'copilot',
	title: getMessage('CRM_SETTINGS_HUB_SECTION_COPILOT_TITLE'),
	type: 'settings-group',
	blocks: [
		{
			id: 'copilot_calls',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_COPILOT_CALLS_TITLE'),
			icon: 'o-telephony',
			settings: [
				aiCallProcessingAutoRegistration,
				copilotFillItemFromCallRegistration,
				copilotCallAssessmentRegistration,
				copilotAnalyzeCommunicationRegistration,
				copilotSummarizeRegistration,
			],
		},
		{
			id: 'copilot_assist',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_COPILOT_ASSIST_TITLE'),
			icon: 'o-ai-stars',
			settings: [
				copilotRepeatSaleRegistration,
				copilotFillCrmTextRegistration,
				copilotMessageSenderEditorRegistration,
			],
		},
	],
};
