import { Core } from 'im.v2.application.core';
import { ChatType, UserType } from 'im.v2.const';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { SidebarManager } from 'im.v2.lib.sidebar';

import { ChatLinks } from '../../../elements/chat-links/chat-links';
import { ChatFavourites } from '../../../elements/chat-favourites/chat-favourites';
import { ChatDescription } from '../../../elements/chat-description/chat-description';
import { ChatShared } from '../../../elements/chat-shared/chat-shared';
import { CollabV2Info } from '../../../elements/collab-v2-info/collab-v2-info';

import '../css/info.css';

import type { ImModelChat, ImModelUser } from 'im.v2.model';

// @vue/component
export const InfoPreview = {
	name: 'InfoPreview',
	components: { ChatDescription, ChatLinks, ChatFavourites, ChatShared, CollabV2Info },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed: {
		user(): ImModelUser
		{
			return this.$store.getters['users/get'](this.dialogId, true);
		},
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		isUser(): boolean
		{
			return this.dialog.type === ChatType.user;
		},
		isSelfChat(): boolean
		{
			return this.isUser && this.user.id === Core.getUserId();
		},
		isUserOrBot(): boolean
		{
			return this.isUser && [UserType.bot, UserType.user].includes(this.user.type);
		},
		showCollabV2Info(): boolean
		{
			return this.dialog.type === ChatType.collab
				&& FeatureManager.isFeatureAvailable(Feature.isCollabV2Available)
			;
		},
		showSharedChats(): boolean
		{
			const sidebarConfig = SidebarManager.getInstance().getConfig(this.dialogId);
			const isSharedChatsEnabled = sidebarConfig.areSharedChatsEnabled();

			return isSharedChatsEnabled && this.isUserOrBot && !this.isSelfChat;
		},
	},
	template: `
		<div class="bx-im-sidebar-info-preview__container">
			<CollabV2Info
				v-if="showCollabV2Info"
				:key="dialogId"
				:dialogId="dialogId"
			/>
			<ChatDescription
				v-else
				:dialogId="dialogId"
			/>
			<ChatFavourites :dialogId="dialogId" />
			<ChatLinks :dialogId="dialogId" />
			<ChatShared
				v-if="showSharedChats"
				:dialogId="dialogId"
			/>
		</div>
	`,
};
