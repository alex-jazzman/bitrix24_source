import 'main.date';

import { ChatType, Settings, Layout } from 'im.v2.const';
import { ChatAvatar, AvatarSize } from 'im.v2.component.elements.avatar';
import { ChatTitle } from 'im.v2.component.elements.chat-title';
import { DateFormatter, DateTemplate } from 'im.v2.lib.date-formatter';
import { CounterManager } from 'im.v2.lib.counter';

import { MessageText } from './components/message-text';

import './css/channel-item.css';

import type { ImModelRecentItem, ImModelChat, ImModelMessage, ImModelLayout } from 'im.v2.model';

// @vue/component
export const ChannelItem = {
	name: 'ChannelItem',
	components: { ChatAvatar, ChatTitle, MessageText },
	props: {
		item: {
			type: Object,
			required: true,
		},
	},
	computed:
	{
		AvatarSize: () => AvatarSize,
		recentItem(): ImModelRecentItem
		{
			return this.item;
		},
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.recentItem.dialogId, true);
		},
		layout(): ImModelLayout
		{
			return this.$store.getters['application/getLayout'];
		},
		message(): ImModelMessage
		{
			return this.$store.getters['recent/getMessage'](this.recentItem.dialogId);
		},
		chatCounter(): number
		{
			return this.$store.getters['counters/getCounterByChatId'](this.dialog.chatId);
		},
		formattedDate(): string
		{
			return this.formatDate(this.message.date);
		},
		formattedCounter(): string
		{
			return CounterManager.formatCounter(this.chatCounter);
		},
		isUser(): boolean
		{
			return this.dialog.type === ChatType.user;
		},
		isChat(): boolean
		{
			return !this.isUser;
		},
		isChatSelected(): boolean
		{
			if (this.layout.name !== Layout.channel)
			{
				return false;
			}

			return this.layout.entityId === this.recentItem.dialogId;
		},
		showLastMessage(): boolean
		{
			return this.$store.getters['application/settings/get'](Settings.recent.showLastMessage);
		},
		invitation(): { isActive: boolean, originator: number, canResend: boolean }
		{
			return this.recentItem.invitation;
		},
		wrapClasses(): { [string]: boolean }
		{
			return {
				'--selected': this.isChatSelected,
			};
		},
	},
	methods:
	{
		formatDate(date): string
		{
			return DateFormatter.formatByTemplate(date, DateTemplate.recent);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div :data-id="recentItem.dialogId" :class="wrapClasses" class="bx-im-list-channel-item__wrap">
			<div class="bx-im-list-channel-item__container">
				<div class="bx-im-list-channel-item__avatar_container">
					<div class="bx-im-list-channel-item__avatar_content">
						<ChatAvatar :avatarDialogId="recentItem.dialogId" :size="AvatarSize.XL" />
					</div>
				</div>
				<div class="bx-im-list-channel-item__content_container">
					<div class="bx-im-list-channel-item__content_header">
						<ChatTitle :dialogId="recentItem.dialogId" />
						<div class="bx-im-list-channel-item__date">
							<span>{{ formattedDate }}</span>
						</div>
					</div>
					<div class="bx-im-list-channel-item__content_bottom">
						<MessageText :item="recentItem" />
					</div>
				</div>
			</div>
		</div>
	`,
};
