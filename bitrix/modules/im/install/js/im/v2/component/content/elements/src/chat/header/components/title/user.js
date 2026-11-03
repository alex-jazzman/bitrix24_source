import { Utils } from 'im.v2.lib.utils';
import { ChatTitle } from 'im.v2.component.elements.chat-title';

import { HeaderAction, HeaderActionShape, HeaderControlKey } from '../header-action/header-action';

import type { JsonObject } from 'main.core';

const ONE_MINUTE = 60 * 1000;

// @vue/component
export const UserTitle = {
	name: 'UserTitle',
	components: { ChatTitle, HeaderAction },
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
	},
	data(): JsonObject
	{
		return {
			userLastOnlineText: '',
		};
	},
	computed:
	{
		HeaderActionShape: () => HeaderActionShape,
		HeaderControlKey: () => HeaderControlKey,
		userPosition(): string
		{
			return this.$store.getters['users/getPosition'](this.dialogId);
		},
		userLastOnline(): string
		{
			return this.$store.getters['users/getLastOnline'](this.dialogId);
		},
		userLink(): string
		{
			return Utils.user.getProfileLink(this.dialogId);
		},
		userName(): string
		{
			return this.$store.getters['users/get'](this.dialogId, true).name;
		},
		isSelfChat(): boolean
		{
			return this.$store.getters['chats/isSelfChat'](this.dialogId);
		},
		/**
		 * The stop is worth offering only while the profile behind the name belongs to somebody else. In the
		 * chat with oneself it is the profile of the reader, and the keyboard is handed nothing it does not
		 * already have - so the name gives the stop up and keeps the mouse action, exactly as the picture of
		 * a personal chat does. The walk is all that either of them gives up: a control taken out of the
		 * accessibility tree instead would still take the focus on a click, and leave the reader on a node
		 * nothing can announce.
		 */
		isAnotherUserProfile(): boolean
		{
			return !this.isSelfChat;
		},
		// The name reads as a name, so the link says where it leads and keeps the name it is made of.
		profileLabel(): string
		{
			return this.loc('IM_CONTENT_CHAT_HEADER_PROFILE_ARIA', { '#NAME#': this.userName });
		},
	},
	watch:
	{
		userLastOnline(value)
		{
			this.userLastOnlineText = value;
		},
	},
	created()
	{
		this.updateUserOnline();
		this.userLastOnlineInterval = setInterval(this.updateUserOnline, ONE_MINUTE);
	},
	beforeUnmount()
	{
		clearInterval(this.userLastOnlineInterval);
	},
	methods:
	{
		updateUserOnline(): void
		{
			this.userLastOnlineText = this.$store.getters['users/getLastOnline'](this.dialogId);
		},
		loc(phraseCode: string, replacements: { [key: string]: string } = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	// language=Vue
	template: `
		<div class="bx-im-chat-header__info">
			<div class="bx-im-chat-header__title --user">
				<HeaderAction
					:controlKey="HeaderControlKey.profile"
					:label="profileLabel"
					:href="userLink"
					:shape="HeaderActionShape.text"
					:tabStop="isAnotherUserProfile"
					target="_blank"
					class="bx-im-chat-header__title_container"
					data-testid="im-chat-header-profile-link"
				>
					<ChatTitle :dialogId="dialogId" :withAutoDelete="true" :withMute="true" />
				</HeaderAction>
				<span class="bx-im-chat-header__user-status">{{ userLastOnlineText }}</span>
			</div>
			<div class="bx-im-chat-header__subtitle_container">
				<div class="bx-im-chat-header__subtitle_content">{{ userPosition }}</div>
			</div>
		</div>
	`,
};
