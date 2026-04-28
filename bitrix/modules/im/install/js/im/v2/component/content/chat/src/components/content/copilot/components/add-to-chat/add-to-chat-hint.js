import { PopupOptions } from 'main.popup';

import { CopilotManager } from 'im.v2.lib.copilot';
import { MessengerPopup } from 'im.v2.component.elements.popup';

import '../../css/add-to-chat-hint.css';

const POPUP_ID = 'im-add-to-chat-hint-popup';

// @vue/component
export const AddToChatHint = {
	name: 'AddToChatHint',
	components: { MessengerPopup },
	props: {
		bindElement: {
			type: Object,
			required: true,
		},
	},
	emits: ['close', 'hide'],
	computed: {
		POPUP_ID: () => POPUP_ID,
		config(): PopupOptions
		{
			return {
				darkMode: true,
				bindElement: this.bindElement,
				angle: true,
				width: 346,
				closeIcon: true,
				offsetLeft: 8,
				className: 'bx-im-copilot-add-to-chat-hint__scope',
				contentBorderRadius: 0,
			};
		},
		hintTitle(): string
		{
			return this.loc('IM_CONTENT_COPILOT_ADD_TO_CHAT_HINT_TITLE_MSGVER_1', {
				'#COPILOT_NAME#': this.copilotManager.getName(),
			});
		},
		hintDescription(): string
		{
			return this.loc('IM_CONTENT_COPILOT_ADD_TO_CHAT_HINT_DESCRIPTION_MSGVER_1', {
				'#COPILOT_NAME#': this.copilotManager.getName(),
			});
		},
	},
	created()
	{
		this.copilotManager = new CopilotManager();
	},
	methods:
	{
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<MessengerPopup
			:config="config"
			:id="POPUP_ID"
			@close="$emit('close')"
		>
			<div class="bx-im-copilot-add-to-chat-hint__title">{{ hintTitle }}</div>
			<br />
			<div class="bx-im-copilot-add-to-chat-hint__description">{{ hintDescription }}</div>
			<br />
			<button class="bx-im-copilot-add-to-chat-hint__hide" @click="$emit('hide')">
				{{ loc('IM_CONTENT_COPILOT_ADD_TO_CHAT_HINT_HIDE') }}
			</button>
		</MessengerPopup>
	`,
};
