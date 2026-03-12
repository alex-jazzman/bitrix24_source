import { MessengerPopup } from 'im.v2.component.elements.popup';
import { ChatType } from 'im.v2.const';
import { CopilotManager } from 'im.v2.lib.copilot';

import { MentionPopupContent } from './mention-content';

import './css/mention-popup.css';

import type { PopupOptions } from 'main.popup';
import type { ImModelChat } from 'im.v2.model';

const POPUP_ID = 'im-mention-popup';

// @vue/component
export const MentionPopup = {
	name: 'MentionPopup',
	components: { MessengerPopup, MentionPopupContent },
	props:
	{
		bindElement: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
		query: {
			type: String,
			default: '',
		},
	},
	emits: ['close'],
	computed:
	{
		POPUP_ID: () => POPUP_ID,
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		isCopilotType(): boolean
		{
			return this.dialog.type === ChatType.copilot;
		},
		isGroupCopilotChat(): boolean
		{
			return (new CopilotManager()).isGroupCopilotChat(this.dialogId);
		},
		needToShowMentionPopup(): boolean
		{
			if (this.isCopilotType)
			{
				return this.isGroupCopilotChat;
			}

			return true;
		},
		searchChats(): boolean
		{
			return !this.isCopilotType;
		},
		config(): PopupOptions
		{
			return {
				height: 200,
				width: 426,
				padding: 0,
				bindElement: this.bindElement,
				offsetTop: 2,
				offsetLeft: 0,
				fixed: true,
				bindOptions: {
					position: 'top',
				},
				className: 'bx-im-mention-popup__scope',
			};
		},
	},
	template: `
		<MessengerPopup
			v-if="needToShowMentionPopup"
			:config="config"
			@close="$emit('close');"
			:id="POPUP_ID"
			v-slot="{adjustPosition}"
		>
			<MentionPopupContent 
				:dialogId="dialogId"
				:query="query"
				:searchChats="searchChats"
				@close="$emit('close');"
				@adjustPosition="adjustPosition()"
			/>
		</MessengerPopup>
	`,
};
