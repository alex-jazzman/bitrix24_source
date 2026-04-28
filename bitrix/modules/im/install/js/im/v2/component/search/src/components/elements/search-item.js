import { Text, Loc } from 'main.core';

import { ChatAvatar, AvatarSize, ChatAvatarType } from 'im.v2.component.elements.avatar';
import { ChatTitleWithHighlighting, ChatTitleType } from 'im.v2.component.elements.chat-title';
import { ChatType } from 'im.v2.const';
import { DateFormatter, DateTemplate } from 'im.v2.lib.date-formatter';
import { highlightText } from 'im.v2.lib.text-highlighter';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelChat } from 'im.v2.model';

import '../css/search-item.css';

const ItemTextByChatType = {
	[ChatType.openChannel]: Loc.getMessage('IM_SEARCH_ITEM_OPEN_CHANNEL_TYPE_GROUP'),
	[ChatType.generalChannel]: Loc.getMessage('IM_SEARCH_ITEM_OPEN_CHANNEL_TYPE_GROUP'),
	[ChatType.channel]: Loc.getMessage('IM_SEARCH_ITEM_PRIVATE_CHANNEL_TYPE_GROUP'),
	[ChatType.collab]: Loc.getMessage('IM_SEARCH_ITEM_COLLAB_TYPE'),
	default: Loc.getMessage('IM_SEARCH_ITEM_CHAT_TYPE_GROUP_V2'),
};

// @vue/component
export const SearchItem = {
	name: 'SearchItem',
	components: { ChatAvatar, ChatTitleWithHighlighting },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		dateMessage: {
			type: String,
			default: '',
		},
		withDate: {
			type: Boolean,
			default: false,
		},
		selected: {
			type: Boolean,
			required: false,
		},
		query: {
			type: String,
			default: '',
		},
		selfChatReplace: {
			type: Boolean,
			default: true,
		},
		titleTwoLine: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['clickItem', 'openContextMenu'],
	computed:
	{
		AvatarSize: () => AvatarSize,
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		isChat(): boolean
		{
			return !this.isUser;
		},
		isUser(): boolean
		{
			return this.dialog.type === ChatType.user;
		},
		needToReplaceSelfChat(): boolean
		{
			if (!this.selfChatReplace)
			{
				return false;
			}

			return this.$store.getters['chats/isSelfChat'](this.dialogId);
		},
		avatarType(): string
		{
			if (!this.selfChatReplace)
			{
				return '';
			}

			return this.needToReplaceSelfChat ? ChatAvatarType.selfChat : '';
		},
		titleType(): string
		{
			if (!this.selfChatReplace)
			{
				return '';
			}

			return this.needToReplaceSelfChat ? ChatTitleType.selfChat : '';
		},
		position(): string
		{
			if (!this.isUser)
			{
				return '';
			}

			return this.$store.getters['users/getPosition'](this.dialogId);
		},
		userItemText(): string
		{
			if (!this.position)
			{
				return this.loc('IM_SEARCH_ITEM_USER_TYPE_GROUP_V2');
			}

			return highlightText(Text.encode(this.position), this.query);
		},
		chatItemText(): string
		{
			return ItemTextByChatType[this.dialog.type] ?? ItemTextByChatType.default;
		},
		itemText(): string
		{
			if (this.needToReplaceSelfChat)
			{
				return this.selfChatText;
			}

			return this.isUser ? this.userItemText : this.chatItemText;
		},
		itemTextForTitle(): string
		{
			if (this.needToReplaceSelfChat)
			{
				return this.selfChatText;
			}

			return this.isUser ? this.position : this.chatItemText;
		},
		selfChatText(): string
		{
			return this.loc('IM_LIST_RECENT_CHAT_SELF_SUBTITLE');
		},
		formattedDate(): ?string
		{
			if (!this.dateMessage)
			{
				return null;
			}
			const date = Utils.date.cast(this.dateMessage);

			return this.formatDate(date);
		},
	},
	methods:
	{
		onClick(event: PointerEvent)
		{
			this.$emit('clickItem', {
				dialogId: this.dialogId,
				nativeEvent: event,
			});
		},
		onRightClick(event: PointerEvent)
		{
			if (event.altKey && event.shiftKey)
			{
				return;
			}

			this.$emit('openContextMenu', { dialogId: this.dialogId, nativeEvent: event });
		},
		formatDate(date: Date): string
		{
			return DateFormatter.formatByTemplate(date, DateTemplate.recent);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div 
			@click="onClick" 
			@click.right.prevent="onRightClick" 
			class="bx-im-search-item__container bx-im-search-item__scope"
			:class="{'--selected': selected}"
		>
			<div class="bx-im-search-item__avatar-container">
				<ChatAvatar
					:avatarDialogId="dialogId" 
					:contextDialogId="dialogId" 
					:size="AvatarSize.XL"
					:customType="avatarType"
				/>
			</div>
			<div class="bx-im-search-item__content-container" :class="{'--centered': selfChatReplace}">
				<div class="bx-im-search-item__content_header">
					<ChatTitleWithHighlighting
						:dialogId="dialogId"
						:textToHighlight="query"
						:customType="titleType"
						:showItsYou="!selfChatReplace"
						:twoLine="titleTwoLine"
					/>
					<div v-if="withDate && formattedDate" class="bx-im-search-item__date">
						<span>{{ formattedDate }}</span>
					</div>
				</div>
				<div v-if="itemText" class="bx-im-search-item__item-text" :title="itemTextForTitle" v-html="itemText"></div>
			</div>
			<div v-if="selected" class="bx-im-chat-search-item__selected"></div>
		</div>
	`,
};
