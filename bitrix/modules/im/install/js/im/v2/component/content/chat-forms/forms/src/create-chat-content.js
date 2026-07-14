import { type BitrixVueComponentProps } from 'ui.vue3';

import { ChatType, type ChatTypeItem } from 'im.v2.const';
import { CreatableChatType } from 'im.v2.lib.create-chat';

import { ChannelCreation } from './components/create/channel';
import { CollabCreationWrapper } from './components/create/collab/collab-wrapper.js';
import { CollabChatCreation } from './components/create/collab-chat/collab-chat';
import { ConferenceCreation } from './components/create/conference';
import { GroupChatCreation } from './components/create/group-chat';

import './css/chat-forms-content.css';

const CreationComponentByChatType = {
	[CreatableChatType.chat]: GroupChatCreation,
	[CreatableChatType.videoconf]: ConferenceCreation,
	[CreatableChatType.channel]: ChannelCreation,
	[CreatableChatType.collab]: CollabCreationWrapper,
	[CreatableChatType.collabChat]: CollabChatCreation,
	default: GroupChatCreation,
};

// @vue/component
export const CreateChatContent = {
	name: 'CreateChatContent',
	components: { GroupChatCreation, ConferenceCreation, ChannelCreation, CollabCreationWrapper },
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
		chatType(): ChatTypeItem
		{
			return this.entityId;
		},
		creationComponent(): BitrixVueComponentProps
		{
			return CreationComponentByChatType[this.chatType] ?? CreationComponentByChatType.default;
		},
	},
	template: `
		<div class="bx-im-content-chat-forms__container">
			<component :is="creationComponent" />
		</div>
	`,
};
