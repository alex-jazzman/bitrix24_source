import { ChatTextarea } from 'im.v2.component.textarea';

import '../css/textarea.css';

// @vue/component
export const ChannelTextarea = {
	name: 'ChannelTextarea',
	components: { ChatTextarea },
	props:
	{
		dialogId: {
			type: String,
			default: '',
		},
	},
	template: `
		<ChatTextarea
			:dialogId="dialogId"
			:withCreateMenu="false"
			:withMarket="false"
			class="bx-im-channel-send-panel__container"
		/>
	`,
};
