import 'main.date';

import { ChatAvatar, AvatarSize, ChatAvatarType } from 'im.v2.component.elements.avatar';
import { ChatTitle, ChatTitleType } from 'im.v2.component.elements.chat-title';
import { EntityLink, EntityLinkAppearance, hasEntityLink } from 'im.v2.component.elements.entity-link';
import { InputActionIndicator } from 'im.v2.component.list.items.elements.input-action-indicator';
import { ActionByRole, Settings, Layout, ChatType, ChatEntityLinkType } from 'im.v2.const';
import 'im.v2.css.classes';
import { DateFormatter, DateTemplate } from 'im.v2.lib.date-formatter';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { RecentManager } from 'im.v2.lib.recent';
import { LayoutManager } from 'im.v2.lib.layout';
import { PermissionManager } from 'im.v2.lib.permission';
import { type ImModelRecentItem, type ImModelChat, type ImModelLayout } from 'im.v2.model';

import { AvatarCounter } from './components/avatar-counter';
import { ItemCounters } from './components/item-counter';
import { MessageStatus } from './components/message-status';
import { MessageText } from './components/message-text/message-text';

import './css/recent-item.css';
import './css/entity-link.css';

// @vue/component
export const BaseRecentItem = {
	name: 'BaseRecentItem',
	components: {
		ChatAvatar,
		ChatTitle,
		MessageText,
		MessageStatus,
		AvatarCounter,
		ItemCounters,
		InputActionIndicator,
		EntityLink,
	},
	inject: {
		avatarsOnly: {
			default: false,
		},
	},
	props: {
		item: {
			type: Object,
			required: true,
		},
		withCounter: {
			type: Boolean,
			default: true,
		},
		withChildrenCounter: {
			type: Boolean,
			default: true,
		},
		withMessageStatus: {
			type: Boolean,
			default: true,
		},
		withPinStatus: {
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
		forceOwnMessage: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		AvatarSize: () => AvatarSize,
		EntityLinkAppearance: () => EntityLinkAppearance,
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
		accessibleName(): string
		{
			// Explicit accessible name = chat title only, so the screen reader announces the
			// chat instead of reading the whole row (unread counter, indicators, preview).
			if (this.isSelfChat)
			{
				return this.loc('IM_CHAT_TITLE_MY_NOTES');
			}

			if (this.dialog.type === ChatType.user)
			{
				return this.$store.getters['users/get'](this.recentItem.dialogId, true).name;
			}

			return this.dialog.name;
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
		canSend(): boolean
		{
			if (this.dialog.isTextareaEnabled === false)
			{
				return false;
			}

			return PermissionManager.getInstance().canPerformActionByRole(
				ActionByRole.send,
				this.dialog.dialogId,
			);
		},
		isDraftActive(): boolean
		{
			return this.withDraft && this.canSend && Boolean(this.recentItem.draft.text);
		},
		invitation(): { isActive: boolean, originator: number, canResend: boolean }
		{
			return this.recentItem.invitation;
		},
		showEntityLink(): boolean
		{
			const isAvailable = FeatureManager.isFeatureAvailable(Feature.isVibecodeAppOpenButtonAvailable);
			const isApplicationChat = this.dialog.entityLink?.type === ChatEntityLinkType.vibecodeApp;

			return isAvailable && !this.avatarsOnly && isApplicationChat && hasEntityLink(this.dialog);
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
		formatDate(date: ?Date): string
		{
			// у элемента может не быть даты вовсе (например, канал без сообщений и активности)
			if (!date)
			{
				return '';
			}

			return DateFormatter.formatByTemplate(date, DateTemplate.recent);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div
			:data-id="recentItem.dialogId"
			:data-testid="'im-recent-item-' + recentItem.dialogId"
			:class="wrapClasses"
			class="bx-im-list-recent-item__wrap --focus-visible"
			role="button"
			tabindex="-1"
			:aria-current="isChatSelected"
			:aria-label="accessibleName"
		>
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
					<AvatarCounter
						v-if="avatarsOnly"
						:item="recentItem"
						:isChatMuted="dialog.isMuted"
						:isSelected="isChatSelected"
					/>
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
							<MessageStatus 
								v-if="withMessageStatus" 
								:item="item" 
								:isDraftActive="isDraftActive" 
								:isSelected="isChatSelected" 
							/>
							<span>{{ formattedDate }}</span>
						</div>
					</div>
					<div class="bx-im-list-recent-item__content_bottom">
						<MessageText
							:item="recentItem"
							:isDraftActive="isDraftActive"
							:forceOwnMessage="forceOwnMessage"
						/>
						<ItemCounters
							v-if="withCounter || showEntityLink"
							:withCounter="withCounter"
							:compactMode="showEntityLink"
							:withPinStatus="withPinStatus && !showEntityLink"
							:withChildrenCounter="withChildrenCounter"
							:item="recentItem"
							:isChatMuted="dialog.isMuted"
							:isSelected="isChatSelected"
						>
							<template #default>
								<EntityLink
									v-if="showEntityLink"
									:dialogId="recentItem.dialogId"
									:appearance="EntityLinkAppearance.button"
									:withEntityName="false"
								/>
							</template>
						</ItemCounters>
					</div>
				</div>
			</div>
		</div>
	`,
};
