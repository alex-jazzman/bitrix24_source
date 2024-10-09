import { ChatType } from 'im.v2.const';

import { GroupChatCreation } from './components/create/group-chat';
import { ConferenceCreation } from './components/create/conference';
import { ChannelCreation } from './components/create/channel';

import './css/chat-forms-content.css';

// @vue/component
export const CreateChatContent = {
	name: 'CreateChatContent',
	components: { GroupChatCreation, ConferenceCreation, ChannelCreation },
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
		chatType(): $Values<typeof ChatType>
		{
			return this.entityId;
		},
	},
	template: `
		<div class="bx-im-content-chat-forms__container">
			<GroupChatCreation v-if="chatType === ChatType.chat" />
			<ConferenceCreation v-else-if="chatType === ChatType.videoconf" />
			<ChannelCreation v-else-if="chatType === ChatType.channel" />
		</div>
	`,
};
