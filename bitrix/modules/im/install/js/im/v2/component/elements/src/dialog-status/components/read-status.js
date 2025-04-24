import { Text } from 'main.core';

import { ChatType } from 'im.v2.const';
import { DateFormatter, DateTemplate } from 'im.v2.lib.date-formatter';

import { AdditionalUsers } from './additional-users';

import type { JsonObject } from 'main.core';
import type { ImModelChat } from 'im.v2.model';

type LastMessageViews = {
	countOfViewers: number,
	firstViewer?: {
		userId: number,
		userName: string,
		date: Date
	},
	messageId: number
};

const MORE_USERS_CSS_CLASS = 'bx-im-dialog-chat-status__user-count';

// @vue/component
export const ReadStatus = {
	name: 'ReadStatus',
	components: { AdditionalUsers },
	props:
	{
		dialogId: {
			required: true,
			type: String,
		},
	},
	data(): JsonObject
	{
		return {
			showAdditionalUsers: false,
			additionalUsersLinkElement: null,
		};
	},
	computed:
	{
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		isUser(): boolean
		{
			return this.dialog.type === ChatType.user;
		},
		lastMessageViews(): LastMessageViews
		{
			return this.dialog.lastMessageViews;
		},
		readStatusText(): string
		{
			if (this.isUser)
			{
				return this.formatUserViewStatus();
			}

			return this.formatChatViewStatus();
		},
	},
	methods:
	{
		formatUserViewStatus(): string
		{
			const { date } = this.lastMessageViews.firstViewer;

			return this.loc('IM_ELEMENTS_STATUS_READ_USER_MSGVER_1', {
				'#DATE#': DateFormatter.formatByTemplate(date, DateTemplate.messageReadStatus),
			});
		},
		formatChatViewStatus(): string
		{
			const { countOfViewers, firstViewer } = this.lastMessageViews;
			if (countOfViewers === 1)
			{
				return this.loc('IM_ELEMENTS_STATUS_READ_CHAT', {
					'#USER#': Text.encode(firstViewer.userName),
				});
			}

			return this.loc('IM_ELEMENTS_STATUS_READ_CHAT_PLURAL', {
				'#USERS#': Text.encode(firstViewer.userName),
				'#LINK_START#': `<span class="${MORE_USERS_CSS_CLASS}">`,
				'#COUNT#': countOfViewers - 1,
				'#LINK_END#': '</span>',
			});
		},
		onClick(event: PointerEvent)
		{
			if (!event.target.matches(`.${MORE_USERS_CSS_CLASS}`))
			{
				return;
			}

			this.openUsersPopup();
		},
		openUsersPopup()
		{
			this.additionalUsersLinkElement = document.querySelector(`.${MORE_USERS_CSS_CLASS}`);
			this.showAdditionalUsers = true;
		},
		onUsersPopupClose()
		{
			this.showAdditionalUsers = false;
			this.additionalUsersLinkElement = null;
		},
		loc(phraseCode: string, replacements: {[string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<div class="bx-im-dialog-chat-status__content">
			<div class="bx-im-dialog-chat-status__icon --read"></div>
			<div v-html="readStatusText" @click="onClick" class="bx-im-dialog-chat-status__text"></div>
			<AdditionalUsers
				:dialogId="dialogId"
				:show="showAdditionalUsers"
				:bindElement="additionalUsersLinkElement || {}"
				@close="onUsersPopupClose"
			/>
		</div>
	`,
};
