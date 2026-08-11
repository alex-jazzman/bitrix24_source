import { Runtime } from 'main.core';

import { Core } from 'im.v2.application.core';
import { FeatureManager, Feature } from 'im.v2.lib.feature';

import {
	AiAssistantFormId,
	AiAssistantFormsV2,
	AiAssistantFormsLegacy,
	CopilotFormId,
	CopilotFormsV2,
	CopilotFormsLegacy,
	FormConfigGeneral,
	FormContext,
} from './const/const';
import { type FormConfigType, type CopilotFormParams, type AiAssistantFormParams } from './types/types';

const FEEDBACK_EXTENSION = 'ui.feedback.form';

export class FeedbackManager
{
	#isBitrixGptV2Available: boolean = FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available);

	async openAiAssistantForm(params: AiAssistantFormParams): Promise<void>
	{
		const formattedId = `${AiAssistantFormId}-${this.#generateFormIdSuffix()}`;
		const forms = this.#isBitrixGptV2Available ? AiAssistantFormsV2 : AiAssistantFormsLegacy;
		const config = {
			id: formattedId,
			forms,
			presets: {
				sender_page: FormContext.aiAssistantBot,
				contextId: params.contextId ?? '',
				message: params.message ?? '',
			},
		};

		void this.#openForm(config);
	}

	async openCopilotForm(params: CopilotFormParams): Promise<void>
	{
		const formattedId = `${CopilotFormId}-${this.#generateFormIdSuffix()}`;
		const forms = this.#isBitrixGptV2Available ? CopilotFormsV2 : CopilotFormsLegacy;
		const context = params.userCounter <= 2 ? FormContext.copilotBot : FormContext.copilotGroup;
		const config = {
			id: formattedId,
			forms,
			presets: {
				sender_page: context,
				language: Core.getLanguageId(),
			},
		};

		if (this.#isBitrixGptV2Available)
		{
			config.presets = {
				...config.presets,
				message: params.message.text,
				sending_time: params.message.date,
				chat_id: params.message.chatId,
				message_id: params.message.id,
			};
		}
		else
		{
			config.presets = {
				...config.presets,
				cp_answer: params.message.text,
			};
		}

		void this.#openForm(config);
	}

	async openGeneralForm(): Promise<void>
	{
		const { id, forms } = FormConfigGeneral;
		const config = {
			id,
			forms,
			presets: { sender_page: FormContext.general },
		};

		void this.#openForm(config);
	}

	async #openForm(config: FormConfigType): Promise<void>
	{
		await Runtime.loadExtension(FEEDBACK_EXTENSION);
		BX.UI.Feedback.Form.open(config);
	}

	#generateFormIdSuffix(): number
	{
		return Math.round(Math.random() * 1000);
	}
}
