import { ChatType } from 'im.v2.const';
import { type ImModelChat } from 'im.v2.model';

import { GroupChatUpdating } from './components/update/group-chat';
import { ChannelUpdating } from './components/update/channel';
import { CollabUpdating } from './components/update/collab';
import { CollabChatUpdating } from './components/update/collab-chat';

import './css/chat-forms-content.css';

// @vue/component
export const UpdateChatContent = {
	name: 'UpdateChatContent',
	components: { GroupChatUpdating, ChannelUpdating, CollabUpdating, CollabChatUpdating },
	props:
	{
		entityId: {
			type: String,
			required: true,
		},
	},
	computed:
	{
		ChatType: () => ChatType,
		chat(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.entityId, true);
		},
		parentChat(): ?ImModelChat
		{
			if (this.chat.parentChatId === 0)
			{
				return null;
			}

			return this.$store.getters['chats/getByChatId'](this.chat.parentChatId);
		},
		isChannel(): boolean
		{
			const editableChannelTypes = new Set([ChatType.channel, ChatType.openChannel]);

			return editableChannelTypes.has(this.chat.type);
		},
		isChat(): boolean
		{
			const editableChatTypes = new Set([ChatType.chat, ChatType.open, ChatType.videoconf]);

			return editableChatTypes.has(this.chat.type) && !this.parentChat;
		},
		isCollab(): boolean
		{
			return this.chat.type === ChatType.collab;
		},
		isCollabNestedChat(): boolean
		{
			if (!this.parentChat)
			{
				return false;
			}

			return this.parentChat.type === ChatType.collab;
		},
	},
	template: `
		<div class="bx-im-content-chat-forms__container">
			<GroupChatUpdating v-if="isChat" :dialogId="entityId" />
			<ChannelUpdating v-else-if="isChannel" :dialogId="entityId" />
			<CollabUpdating v-else-if="isCollab" :dialogId="entityId" />
			<CollabChatUpdating v-else-if="isCollabNestedChat" :dialogId="entityId" />
		</div>
	`,
};
