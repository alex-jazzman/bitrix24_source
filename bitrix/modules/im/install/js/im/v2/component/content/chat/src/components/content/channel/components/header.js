import { ChatHeader } from '../../base/components/chat-header/chat-header';

// @vue/component
export const ChannelHeader = {
	name: 'ChannelHeader',
	components: { ChatHeader },
	props:
	{
		dialogId: {
			type: String,
			default: '',
		},
		currentSidebarPanel: {
			type: String,
			default: '',
		},
	},
	template: `
		<ChatHeader :dialogId="dialogId" :currentSidebarPanel="currentSidebarPanel" />
	`,
};
