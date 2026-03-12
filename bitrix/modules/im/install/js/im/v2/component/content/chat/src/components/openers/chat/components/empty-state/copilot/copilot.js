import { Messenger } from 'im.public';
import { ChatButton, ButtonSize, type CustomColorScheme } from 'im.v2.component.elements.button';
import { Color } from 'im.v2.const';
import { SpecialBackground, ThemeManager } from 'im.v2.lib.theme';
import { CopilotService } from 'im.v2.provider.service.copilot';

import './css/empty-state.css';

import type { JsonObject } from 'main.core';
import type { BackgroundStyle } from 'im.v2.lib.theme';

const BUTTON_BACKGROUND_COLOR = '#fff';
const BUTTON_HOVER_COLOR = '#eee';
const BUTTON_TEXT_COLOR = 'rgba(82, 92, 105, 0.9)';

// @vue/component
export const CopilotEmptyState = {
	name: 'CopilotEmptyState',
	components: { ChatButton },
	data(): JsonObject
	{
		return {
			isCreatingChat: false,
		};
	},
	computed:
	{
		ButtonSize: () => ButtonSize,
		backgroundStyle(): BackgroundStyle
		{
			return ThemeManager.getBackgroundStyleById(SpecialBackground.copilot);
		},
		preparedText(): string
		{
			return this.loc('IM_CONTENT_COPILOT_EMPTY_STATE_MESSAGE_MSGVER_1', {
				'#BR#': '\n',
			});
		},
		buttonColorScheme(): CustomColorScheme
		{
			return {
				borderColor: Color.transparent,
				backgroundColor: BUTTON_BACKGROUND_COLOR,
				iconColor: BUTTON_TEXT_COLOR,
				textColor: BUTTON_TEXT_COLOR,
				hoverColor: BUTTON_HOVER_COLOR,
			};
		},
	},
	methods:
	{
		async createDefaultChat(): Promise<void>
		{
			this.isCreatingChat = true;

			try
			{
				const newDialogId = await this.getCopilotService().createDefaultChat();

				this.isCreatingChat = false;
				void Messenger.openCopilot(newDialogId);
			}
			catch
			{
				this.isCreatingChat = false;
			}
		},
		getCopilotService(): CopilotService
		{
			if (!this.copilotService)
			{
				this.copilotService = new CopilotService();
			}

			return this.copilotService;
		},
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<div class="bx-im-content-copilot-empty-state__container" :style="backgroundStyle">
			<div class="bx-im-content-copilot-empty-state__content">
				<div class="bx-im-content-copilot-empty-state__icon"></div>
				<div class="bx-im-content-copilot-empty-state__text">{{ preparedText }}</div>
				<ChatButton
					class="--black-loader"
					:size="ButtonSize.XL"
					:customColorScheme="buttonColorScheme"
					:text="loc('IM_CONTENT_COPILOT_EMPTY_STATE_ASK_QUESTION')"
					:isRounded="true"
					:isLoading="isCreatingChat"
					@click="createDefaultChat"
				/>
			</div>
		</div>
	`,
};
