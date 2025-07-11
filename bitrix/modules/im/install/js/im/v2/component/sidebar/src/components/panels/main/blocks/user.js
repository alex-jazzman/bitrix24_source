import { Analytics } from 'im.v2.lib.analytics';
import { hint } from 'ui.vue3.directives.hint';

import { ChatTitle } from 'im.v2.component.elements.chat-title';
import { ChatButton, ButtonColor, ButtonSize } from 'im.v2.component.elements.button';
import { ChatAvatar, AvatarSize } from 'im.v2.component.elements.avatar';
import { ActionByRole, ActionByUserType, UserType } from 'im.v2.const';
import { Utils } from 'im.v2.lib.utils';
import { AddToChat } from 'im.v2.component.entity-selector';
import { PermissionManager } from 'im.v2.lib.permission';

import { AutoDelete } from '../../../elements/auto-delete/auto-delete';

import '../css/user-preview.css';

import type { JsonObject } from 'main.core';
import type { ImModelChat, ImModelUser } from 'im.v2.model';

// @vue/component
export const UserPreview = {
	name: 'UserPreview',
	directives: { hint },
	components: { ChatAvatar, ChatTitle, ChatButton, AddToChat, AutoDelete },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
	},
	data(): JsonObject
	{
		return {
			showAddToChatPopup: false,
		};
	},
	computed:
	{
		AvatarSize: () => AvatarSize,
		ButtonSize: () => ButtonSize,
		ButtonColor: () => ButtonColor,
		userPosition(): string
		{
			return this.$store.getters['users/getPosition'](this.dialogId);
		},
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		user(): ImModelUser
		{
			return this.$store.getters['users/get'](this.dialogId, true);
		},
		chatId(): number
		{
			return this.dialog.chatId;
		},
		canInviteMembers(): boolean
		{
			const canCreateChat = PermissionManager.getInstance().canPerformActionByUserType(ActionByUserType.createChat);
			const canExtendChat = PermissionManager.getInstance().canPerformActionByRole(ActionByRole.extend, this.dialogId);

			return canCreateChat && canExtendChat;
		},
		showInviteButton(): boolean
		{
			if (this.isBot)
			{
				return false;
			}

			return this.canInviteMembers;
		},
		userLink(): string
		{
			return Utils.user.getProfileLink(this.dialogId);
		},
		isBot(): boolean
		{
			return this.user.type === UserType.bot;
		},
	},
	methods:
	{
		onAddClick()
		{
			Analytics.getInstance().userAdd.onChatSidebarClick(this.dialogId);
			this.showAddToChatPopup = true;
		},
	},
	template: `
		<div class="bx-im-sidebar-main-preview__scope">
			<div class="bx-im-sidebar-main-preview-personal-chat__avatar-container">
				<ChatAvatar
					:avatarDialogId="dialogId"
					:contextDialogId="dialogId"
					:size="AvatarSize.XXXL"
					class="bx-im-sidebar-main-preview-personal-chat__avatar"
				/>
				<a :href="userLink" target="_blank">
					<ChatTitle :dialogId="dialogId" class="bx-im-sidebar-main-preview-personal-chat__user-name" />
				</a>
				<div class="bx-im-sidebar-main-preview-personal-chat__user-position" :title="userPosition">
					{{ userPosition }}
				</div>
			</div>
			<div 
				v-if="showInviteButton" 
				class="bx-im-sidebar-main-preview-personal-chat__invite-button-container" 
				ref="add-members"
			>
				<ChatButton
					v-if="canInviteMembers"
					:text="$Bitrix.Loc.getMessage('IM_SIDEBAR_CREATE_GROUP_CHAT')"
					:size="ButtonSize.S"
					:color="ButtonColor.PrimaryLight"
					:isRounded="true"
					:isUppercase="false"
					icon="plus"
					@click="onAddClick"
				/>
			</div>
			<div class="bx-im-sidebar-main-preview-personal-chat__auto-delete-container">
				<AutoDelete :dialogId="dialogId" />
			</div>
			<AddToChat
				v-if="showAddToChatPopup"
				:bindElement="$refs['add-members'] || {}"
				:dialogId="dialogId"
				:popupConfig="{offsetTop: -220, offsetLeft: -320}"
				@close="showAddToChatPopup = false"
			/>
		</div>
	`,
};
