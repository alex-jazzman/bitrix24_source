import { Settings, ChatType } from 'im.v2.const';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelChat } from 'im.v2.model';

import './css/send-button.css';

// @vue/component
export const SendButton = {
	props:
		{
			dialogId: {
				type: String,
				default: '',
			},
			editMode: {
				type: Boolean,
				default: false,
			},
			isDisabled: {
				type: Boolean,
				default: false,
			},
		},
	computed:
		{
			dialog(): ImModelChat
			{
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			dialogTypeClass(): string
			{
				return `--${this.dialog.type}`;
			},
			hasCopilot2026Styles(): boolean
			{
				return this.dialog.type === ChatType.copilot
					&& FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available);
			},
			buttonHint(): string
			{
				const sendByEnter = this.$store.getters['application/settings/get'](Settings.hotkey.sendByEnter);
				const ctrlKey = Utils.platform.isMac() ? 'Cmd' : 'Ctrl';
				const sendCombination = sendByEnter ? 'Enter' : `${ctrlKey} + Enter`;

				return this.loc('IM_TEXTAREA_ICON_SEND_TEXT', {
					'#SEND_MESSAGE_COMBINATION#': sendCombination,
				});
			},
		},
	methods:
		{
			loc(phraseCode: string, replacements: {[string]: string} = {}): string
			{
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			},
		},
	template: `
		<div
			:title="buttonHint"
			class="bx-im-elements-send-button"
			:class="[{'--edit': editMode, '--disabled': isDisabled, '--copilot-2026': hasCopilot2026Styles}, dialogTypeClass]"
		></div>
	`,
};
