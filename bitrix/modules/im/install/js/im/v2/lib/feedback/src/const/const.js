import { type FormEntryType } from '../types/types';

const GENERAL_FORM_ID = 'im-v2-feedback';

export const FormContext = {
	aiAssistantBot: 'chat_ai-assistant_one_by_one',
	copilotBot: 'chat_copilot_tab_one_by_one',
	copilotGroup: 'chat_copilot_tab_multi',
	general: 'profile',
};

export const AiAssistantFormId = 'im.ai-assistant.feedback';

export const AiAssistantFormsV2: FormEntryType[] = [
	{ zones: ['en'], id: 834, lang: 'en', sec: 'qnauno' },
	{ zones: ['ru', 'by', 'kz', 'uz'], id: 2982, lang: 'ru', sec: 'vqmcxn' },
];

export const AiAssistantFormsLegacy: FormEntryType[] = [
	{ zones: ['es'], id: 838, lang: 'es', sec: 'm82wkx' },
	{ zones: ['en'], id: 834, lang: 'en', sec: 'qnauno' },
	{ zones: ['de'], id: 836, lang: 'de', sec: 'frcsm3' },
	{ zones: ['com.br'], id: 840, lang: 'com.br', sec: 'ufjnte' },
	{ zones: ['ru', 'kz', 'by', 'uz'], id: 2982, lang: 'ru', sec: 'vqmcxn' },
];

export const CopilotFormId = 'im.copilot.feedback';

export const CopilotFormsV2: FormEntryType[] = [
	{ zones: ['en'], id: 834, lang: 'en', sec: 'qnauno' },
	{ zones: ['ru', 'by', 'kz', 'uz'], id: 2982, lang: 'ru', sec: 'vqmcxn' },
];

export const CopilotFormsLegacy: FormEntryType[] = [
	{ zones: ['es'], id: 684, lang: 'es', sec: 'svvq1x' },
	{ zones: ['en'], id: 686, lang: 'en', sec: 'tjwodz' },
	{ zones: ['de'], id: 688, lang: 'de', sec: 'nrwksg' },
	{ zones: ['com.br'], id: 690, lang: 'com.br', sec: 'kpte6m' },
	{ zones: ['ru', 'by', 'kz'], id: 692, lang: 'ru', sec: 'jbujn0' },
];

export const FormConfigGeneral = {
	id: GENERAL_FORM_ID,
	forms: [
		{ zones: ['ru'], id: 550, sec: '50my2x', lang: 'ru' },
		{ zones: ['en'], id: 560, sec: '621lbr', lang: 'en' },
	],
};
