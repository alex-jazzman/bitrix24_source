import { BaseChatContent } from 'im.v2.component.content.elements';

import { ChannelDialog } from './components/dialog';
import { ChannelSubscribeBar } from './components/subscribe-bar';
import { ChannelTextarea } from './components/textarea';

export const ChannelContent = {
	name: 'ChannelContent',
	components: { BaseChatContent, ChannelDialog, ChannelTextarea, ChannelSubscribeBar },
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
	},
	template: `
		<BaseChatContent :dialogId="dialogId">
			<template #dialog>
				<ChannelDialog :dialogId="dialogId" :key="dialogId" />
			</template>
			<template #blocked-panel>
				<ChannelSubscribeBar :dialogId="dialogId" :key="dialogId" />
			</template>
			<template #textarea>
				<ChannelTextarea :dialogId="dialogId" :key="dialogId" />
			</template>
		</BaseChatContent>
	`,
};
