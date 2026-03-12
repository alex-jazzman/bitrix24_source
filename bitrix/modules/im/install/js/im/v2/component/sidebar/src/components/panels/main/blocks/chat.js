import { ChatTitle } from 'im.v2.component.elements.chat-title';
import { ChatAvatar, AvatarSize } from 'im.v2.component.elements.avatar';
import { SidebarManager, type SidebarConfig } from 'im.v2.lib.sidebar';

import { MuteChat } from '../../../elements/mute-chat/mute-chat';
import { AutoDelete } from '../../../elements/auto-delete/auto-delete';
import { ChatMembersAvatars } from '../../../elements/chat-members-avatars/chat-members-avatars';
import { SharedLink } from '../../../elements/shared-link/shared-link';
import { isSharedLinkCopyAllowed } from '../../../../helpers/shared-link';
import { SettingsSeparator } from '../components/settings-separator';

import '../css/chat-preview.css';

// @vue/component
export const ChatPreview = {
	name: 'ChatPreview',
	components: {
		ChatAvatar,
		ChatTitle,
		MuteChat,
		ChatMembersAvatars,
		AutoDelete,
		SharedLink,
		SettingsSeparator,
	},
	props: {
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed:
	{
		AvatarSize: () => AvatarSize,
		sidebarConfig(): SidebarConfig
		{
			return SidebarManager.getInstance().getConfig(this.dialogId);
		},
		areChatMembersEnabled(): boolean
		{
			return this.sidebarConfig.areChatMembersEnabled();
		},
		isAutoDeleteEnabled(): boolean
		{
			return this.sidebarConfig.isAutoDeleteEnabled();
		},
		isSharedLinkCopyAllowed(): boolean
		{
			return isSharedLinkCopyAllowed(this.dialogId);
		},
	},
	template: `
		<div class="bx-im-sidebar-main-preview__scope">
			<div class="bx-im-sidebar-main-preview-group-chat__avatar-container">
				<div class="bx-im-sidebar-main-preview-group-chat__avatar">
					<ChatAvatar 
						:avatarDialogId="dialogId" 
						:size="AvatarSize.XXXL" 
					/>
				</div>
				<ChatTitle :dialogId="dialogId" :twoLine="true" class="bx-im-sidebar-main-preview-group-chat__title" />
			</div>
			<div class="bx-im-sidebar-main-preview-group-chat__chat-members">
				<ChatMembersAvatars :showMembers="areChatMembersEnabled" :dialogId="dialogId" />
			</div>
			<div class="bx-im-sidebar-main-preview-group-chat__settings">
				<SharedLink v-if="isSharedLinkCopyAllowed" :dialogId="dialogId" />
				<SettingsSeparator />
				<MuteChat :dialogId="dialogId" />
				<AutoDelete v-if="isAutoDeleteEnabled" :dialogId="dialogId" />
			</div>
		</div>
	`,
};
