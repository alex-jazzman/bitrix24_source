import { Loc } from 'main.core';

type CopilotPromoPopupPresetConfig = {
	videoSrc: {
		ru: string;
		en: string;
	};
	videoContainerMinHeight?: number;
	title: string;
	text: string;
}

export type CopilotPromoPopupPresets = {
	[presetId: string]: CopilotPromoPopupPresetConfig;
}

export const CopilotPromoPopupPresetData: CopilotPromoPopupPresets = Object.freeze({
	task: {
		videoSrc: {
			en: '/bitrix/js/ai/copilot-promo-popup/videos/en/tasks.webm',
			ru: '/bitrix/js/ai/copilot-promo-popup/videos/ru/tasks.webm',
		},
		title: 'CoPilot',
		text: getTextWithReplaceAccent('COPILOT_PROMO_POPUP_TASKS_TEXT'),
	},
	liveFeedEditor: {
		videoSrc: {
			en: '/bitrix/js/ai/copilot-promo-popup/videos/en/liveFeedEditor.webm',
			ru: '/bitrix/js/ai/copilot-promo-popup/videos/ru/liveFeedEditor.webm',
		},
		videoContainerMinHeight: 213,
		title: 'CoPilot',
		text: getTextWithReplaceAccent('COPILOT_PROMO_POPUP_LIVEFEED_EDITOR_TEXT'),
	},
	siteWithCopilot: {
		videoSrc: {
			en: '/bitrix/js/ai/copilot-promo-popup/videos/en/siteWithCopilot.webm',
			ru: '/bitrix/js/ai/copilot-promo-popup/videos/ru/siteWithCopilot.webm',
		},
		videoContainerMinHeight: 226,
		title: 'CoPilot',
		text: getTextWithReplaceAccent('COPILOT_PROMO_POPUP_SITE_WITH_COPILOT_TEXT'),
	},
});

function getTextWithReplaceAccent(messageCode: string): string
{
	return Loc.getMessage(messageCode, {
		'#ACCENT#': '<span style="color: var(--ui-color-copilot-primary);">',
		'#/ACCENT#': '</span>',
	});
}
