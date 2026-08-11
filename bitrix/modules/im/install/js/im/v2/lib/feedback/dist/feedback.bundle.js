/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, im_v2_application_core, im_v2_lib_feature) {
	'use strict';

	const GENERAL_FORM_ID = 'im-v2-feedback';
	const FormContext = {
		aiAssistantBot: 'chat_ai-assistant_one_by_one',
		copilotBot: 'chat_copilot_tab_one_by_one',
		copilotGroup: 'chat_copilot_tab_multi',
		general: 'profile'
	};
	const AiAssistantFormId = 'im.ai-assistant.feedback';
	const AiAssistantFormsV2 = [{
		zones: ['en'],
		id: 834,
		lang: 'en',
		sec: 'qnauno'
	}, {
		zones: ['ru', 'by', 'kz', 'uz'],
		id: 2982,
		lang: 'ru',
		sec: 'vqmcxn'
	}];
	const AiAssistantFormsLegacy = [{
		zones: ['es'],
		id: 838,
		lang: 'es',
		sec: 'm82wkx'
	}, {
		zones: ['en'],
		id: 834,
		lang: 'en',
		sec: 'qnauno'
	}, {
		zones: ['de'],
		id: 836,
		lang: 'de',
		sec: 'frcsm3'
	}, {
		zones: ['com.br'],
		id: 840,
		lang: 'com.br',
		sec: 'ufjnte'
	}, {
		zones: ['ru', 'kz', 'by', 'uz'],
		id: 2982,
		lang: 'ru',
		sec: 'vqmcxn'
	}];
	const CopilotFormId = 'im.copilot.feedback';
	const CopilotFormsV2 = [{
		zones: ['en'],
		id: 834,
		lang: 'en',
		sec: 'qnauno'
	}, {
		zones: ['ru', 'by', 'kz', 'uz'],
		id: 2982,
		lang: 'ru',
		sec: 'vqmcxn'
	}];
	const CopilotFormsLegacy = [{
		zones: ['es'],
		id: 684,
		lang: 'es',
		sec: 'svvq1x'
	}, {
		zones: ['en'],
		id: 686,
		lang: 'en',
		sec: 'tjwodz'
	}, {
		zones: ['de'],
		id: 688,
		lang: 'de',
		sec: 'nrwksg'
	}, {
		zones: ['com.br'],
		id: 690,
		lang: 'com.br',
		sec: 'kpte6m'
	}, {
		zones: ['ru', 'by', 'kz'],
		id: 692,
		lang: 'ru',
		sec: 'jbujn0'
	}];
	const FormConfigGeneral = {
		id: GENERAL_FORM_ID,
		forms: [{
			zones: ['ru'],
			id: 550,
			sec: '50my2x',
			lang: 'ru'
		}, {
			zones: ['en'],
			id: 560,
			sec: '621lbr',
			lang: 'en'
		}]
	};

	const FEEDBACK_EXTENSION = 'ui.feedback.form';
	class FeedbackManager {
		#isBitrixGptV2Available = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBitrixGptV2Available);
		async openAiAssistantForm(params) {
			const formattedId = `${AiAssistantFormId}-${this.#generateFormIdSuffix()}`;
			const forms = this.#isBitrixGptV2Available ? AiAssistantFormsV2 : AiAssistantFormsLegacy;
			const config = {
				id: formattedId,
				forms,
				presets: {
					sender_page: FormContext.aiAssistantBot,
					contextId: params.contextId ?? '',
					message: params.message ?? ''
				}
			};
			void this.#openForm(config);
		}
		async openCopilotForm(params) {
			const formattedId = `${CopilotFormId}-${this.#generateFormIdSuffix()}`;
			const forms = this.#isBitrixGptV2Available ? CopilotFormsV2 : CopilotFormsLegacy;
			const context = params.userCounter <= 2 ? FormContext.copilotBot : FormContext.copilotGroup;
			const config = {
				id: formattedId,
				forms,
				presets: {
					sender_page: context,
					language: im_v2_application_core.Core.getLanguageId()
				}
			};
			if (this.#isBitrixGptV2Available) {
				config.presets = {
					...config.presets,
					message: params.message.text,
					sending_time: params.message.date,
					chat_id: params.message.chatId,
					message_id: params.message.id
				};
			} else {
				config.presets = {
					...config.presets,
					cp_answer: params.message.text
				};
			}
			void this.#openForm(config);
		}
		async openGeneralForm() {
			const {
				id,
				forms
			} = FormConfigGeneral;
			const config = {
				id,
				forms,
				presets: {
					sender_page: FormContext.general
				}
			};
			void this.#openForm(config);
		}
		async #openForm(config) {
			await main_core.Runtime.loadExtension(FEEDBACK_EXTENSION);
			BX.UI.Feedback.Form.open(config);
		}
		#generateFormIdSuffix() {
			return Math.round(Math.random() * 1000);
		}
	}

	exports.FeedbackManager = FeedbackManager;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.Messenger.v2.Application, BX.Messenger.v2.Lib);
//# sourceMappingURL=feedback.bundle.js.map
