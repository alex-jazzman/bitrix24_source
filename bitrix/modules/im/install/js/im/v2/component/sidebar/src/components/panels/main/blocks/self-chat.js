import { ChatTitle, ChatTitleType } from 'im.v2.component.elements.chat-title';
import { ChatAvatar, AvatarSize, ChatAvatarType } from 'im.v2.component.elements.avatar';

import '../css/self-chat-preview.css';

// @vue/component
export const SelfChatPreview = {
	name: 'SelfChatPreview',
	components: { ChatAvatar, ChatTitle },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed:
	{
		ChatAvatarType: () => ChatAvatarType,
		AvatarSize: () => AvatarSize,
		ChatTitleType: () => ChatTitleType,
	},
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-sidebar-self-chat-preview">
			<div class="bx-im-sidebar-self-chat-preview__avatar">
				<ChatAvatar 
					:avatarDialogId="dialogId"
					:size="AvatarSize.XXXL"
					:customType="ChatAvatarType.selfChat"
				/>
			</div>
			<div class="bx-im-sidebar-self-chat-preview__head">
				<ChatTitle :dialogId="dialogId" :customType="ChatTitleType.selfChat" :showItsYou="false"/>
				<span class="bx-im-sidebar-self-chat-preview__description">
					{{ loc('IM_SIDEBAR_NOTES_PREVIEW_DESCRIPTION') }}
				</span>
			</div>
		</div>
	`,
};
