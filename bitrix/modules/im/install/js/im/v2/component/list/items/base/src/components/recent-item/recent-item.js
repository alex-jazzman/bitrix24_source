import 'main.date';

import { ChatAvatar, AvatarSize, ChatAvatarType } from 'im.v2.component.elements.avatar';
import { ChatTitle, ChatTitleType } from 'im.v2.component.elements.chat-title';
import { InputActionIndicator } from 'im.v2.component.list.items.elements.input-action-indicator';
import { Settings, Layout } from 'im.v2.const';
import { DateFormatter, DateTemplate } from 'im.v2.lib.date-formatter';
import { RecentManager } from 'im.v2.lib.recent';
import { LayoutManager } from 'im.v2.lib.layout';
import { type ImModelRecentItem, type ImModelChat, type ImModelLayout } from 'im.v2.model';

import { ItemCounters } from './components/item-counter';
import { MessageStatus } from './components/message-status';
import { MessageText } from './components/message-text/message-text';

import './css/recent-item.css';

// @vue/component
export const BaseRecentItem = {
	name: 'BaseRecentItem',
	components: { ChatAvatar, ChatTitle, MessageText, MessageStatus, ItemCounters, InputActionIndicator },
	props: {
		item: {
			type: Object,
			required: true,
		},
		withCounters: {
			type: Boolean,
			default: true,
		},
		withMessageStatus: {
			type: Boolean,
			default: true,
		},
		withInputIndicator: {
			type: Boolean,
			default: true,
		},
		withDraft: {
			type: Boolean,
			default: true,
		},
	},
	computed: {
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
		formattedDate(): string
		{
			if (this.needsBirthdayPlaceholder)
			{
				return this.loc('IM_LIST_RECENT_BIRTHDAY_DATE');
			}

			return this.formatDate(this.itemDate);
		},
		itemDate(): ?Date
		{
			return RecentManager.getSortDate(this.recentItem.dialogId);
		},
		isSelfChat(): boolean
		{
			return this.$store.getters['chats/isSelfChat'](this.recentItem.dialogId);
		},
		avatarType(): string
		{
			return this.isSelfChat ? ChatAvatarType.selfChat : '';
		},
		chatTitleType(): string
		{
			return this.isSelfChat ? ChatTitleType.selfChat : '';
		},
		isChatSelected(): boolean
		{
			const isChatLayout = LayoutManager.getInstance().isChatLayout(this.layout.name);
			const isUpdateChatLayout = this.layout.name === Layout.updateChat;
			if (!isChatLayout && !isUpdateChatLayout)
			{
				return false;
			}

			return this.layout.entityId === this.recentItem.dialogId;
		},
		hasActiveInputAction(): boolean
		{
			return this.$store.getters['chats/inputActions/isChatActive'](this.recentItem.dialogId);
		},
		showActiveInputAction(): boolean
		{
			return this.withInputIndicator && this.hasActiveInputAction;
		},
		needsBirthdayPlaceholder(): boolean
		{
			return RecentManager.needsBirthdayPlaceholder(this.recentItem.dialogId);
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
				'--pinned': this.recentItem.pinned,
				'--selected': this.isChatSelected,
				'--no-text': !this.showLastMessage,
			};
		},
	},
	methods: {
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
		<div :data-id="recentItem.dialogId" :class="wrapClasses" class="bx-im-list-recent-item__wrap">
			<div class="bx-im-list-recent-item__container">
				<div class="bx-im-list-recent-item__avatar_container">
					<div v-if="invitation.isActive" class="bx-im-list-recent-item__avatar_invitation"></div>
					<div v-else class="bx-im-list-recent-item__avatar_content">
						<ChatAvatar 
							:avatarDialogId="recentItem.dialogId" 
							:contextDialogId="recentItem.dialogId" 
							:size="AvatarSize.XL" 
							:withSpecialTypeIcon="!hasActiveInputAction"
							:customType="avatarType"
						/>
						<InputActionIndicator v-if="showActiveInputAction" />
					</div>
				</div>
				<div class="bx-im-list-recent-item__content_container">
					<div class="bx-im-list-recent-item__content_header">
						<slot name="title">
							<ChatTitle
								:dialogId="recentItem.dialogId"
								:withMute="true"
								:withAutoDelete="true"
								:customType="chatTitleType"
								:showItsYou="false"
							/>
						</slot>
						<div class="bx-im-list-recent-item__date">
							<MessageStatus v-if="withMessageStatus" :item="item" />
							<span>{{ formattedDate }}</span>
						</div>
					</div>
					<div class="bx-im-list-recent-item__content_bottom">
						<MessageText :item="recentItem" :withDraft="withDraft" />
						<ItemCounters
							v-if="withCounters"
							:item="recentItem"
							:isChatMuted="dialog.isMuted"
						/>
					</div>
				</div>
			</div>
		</div>
	`,
};
