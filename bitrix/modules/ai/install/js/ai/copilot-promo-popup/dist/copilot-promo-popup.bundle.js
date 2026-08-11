/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_promoVideoPopup, ui_buttons, ui_iconSet_api_core) {
	'use strict';

	const CopilotPromoPopupPresetData = Object.freeze({
		task: {
			videoSrc: {
				en: '/bitrix/js/ai/copilot-promo-popup/videos/en/tasks.webm',
				ru: '/bitrix/js/ai/copilot-promo-popup/videos/ru/tasks.webm'
			},
			title: getCopilotName(),
			text: getTextWithReplaceAccent('COPILOT_PROMO_POPUP_TASKS_TEXT_MSGVER_1')
		},
		liveFeedEditor: {
			videoSrc: {
				en: '/bitrix/js/ai/copilot-promo-popup/videos/en/liveFeedEditor.webm',
				ru: '/bitrix/js/ai/copilot-promo-popup/videos/ru/liveFeedEditor.webm'
			},
			videoContainerMinHeight: 213,
			title: 'CoPilot',
			text: getTextWithReplaceAccent('COPILOT_PROMO_POPUP_LIVEFEED_EDITOR_TEXT_MSGVER_1')
		},
		siteWithCopilot: {
			videoSrc: {
				en: '/bitrix/js/ai/copilot-promo-popup/videos/en/siteWithCopilot.webm',
				ru: '/bitrix/js/ai/copilot-promo-popup/videos/ru/siteWithCopilot.webm'
			},
			videoContainerMinHeight: 226,
			title: getCopilotName(),
			text: getTextWithReplaceAccent('COPILOT_PROMO_POPUP_SITE_WITH_COPILOT_TEXT_MSGVER_1')
		}
	});
	function getTextWithReplaceAccent(messageCode) {
		return main_core.Loc.getMessage(messageCode, {
			'#COPILOT_NAME#': getCopilotName(),
			'#ACCENT#': '<span style="color: var(--ui-color-copilot-primary);">',
			'#/ACCENT#': '</span>'
		});
	}
	function getCopilotName() {
		return main_core.Extension.getSettings('ai.copilot-promo-popup').copilotName;
	}

	class CopilotPromoPopup {
		static AnglePosition = ui_promoVideoPopup.AnglePosition;
		static Preset = Object.freeze({
			TASK: 'task',
			LIVE_FEED_EDITOR: 'liveFeedEditor',
			CHAT: 'chat',
			SITE_WITH_COPILOT: 'siteWithCopilot'
		});
		static PromoVideoPopupEvents = ui_promoVideoPopup.PromoVideoPopupEvents;
		static getWidth() {
			return ui_promoVideoPopup.PromoVideoPopup.getWidth();
		}
		static createByPresetId(options) {
			CopilotPromoPopup.#checkPreset(options.presetId);
			const presetId = options.presetId;
			const preset = CopilotPromoPopupPresetData[presetId];
			const promoVideoPopup = new ui_promoVideoPopup.PromoVideoPopup({
				targetOptions: options.targetOptions,
				videoSrc: preset.videoSrc[CopilotPromoPopup.#getVideoLang()],
				videoContainerMinHeight: preset.videoContainerMinHeight,
				title: preset.title,
				text: preset.text,
				icon: ui_iconSet_api_core.Main.COPILOT_AI,
				angleOptions: options.angleOptions,
				offset: options.offset,
				colors: {
					title: getComputedStyle(document.body).getPropertyValue('--ui-color-copilot-secondary'),
					iconBackground: getComputedStyle(document.body).getPropertyValue('--ui-color-copilot-primary'),
					button: ui_buttons.Button.Color.AI
				}
			});
			promoVideoPopup.subscribe(ui_promoVideoPopup.PromoVideoPopupEvents.ACCEPT, () => {
				promoVideoPopup.hide();
			});
			return promoVideoPopup;
		}
		static #checkPreset(presetId) {
			if (main_core.Type.isStringFilled(presetId) === false) {
				throw new Error('AI.CopilotPromoPopup: presetId is required option and must be the string');
			}
			if (CopilotPromoPopup.#isPresetExist(presetId) === false) {
				throw new Error(`AI.CopilotPromoPopup: preset with id '${presetId}' doesn't exist`);
			}
		}
		static #isPresetExist(presetId) {
			return Boolean(CopilotPromoPopupPresetData[presetId]);
		}
		static #getVideoLang() {
			return CopilotPromoPopup.#isWestZone() ? 'en' : 'ru';
		}
		static #isWestZone() {
			return main_core.Extension.getSettings('ai.copilot-promo-popup').isWestZone;
		}
	}

	exports.CopilotPromoPopup = CopilotPromoPopup;

})(this.BX.AI = this.BX.AI || {}, BX, BX.UI, BX.UI, BX.UI.IconSet);
//# sourceMappingURL=copilot-promo-popup.bundle.js.map
