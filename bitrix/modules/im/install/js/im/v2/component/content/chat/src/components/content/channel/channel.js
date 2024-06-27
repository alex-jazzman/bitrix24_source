import { BaseChatContent } from '../base/base';
import { ChannelDialog } from './components/dialog';
import { ChannelHeader } from './components/header';
import { JoinPanel } from './components/join-panel';
import { ChannelTextarea } from './components/textarea';

export const ChannelContent = {
	name: 'ChannelContent',
	components: { BaseChatContent, ChannelHeader, ChannelDialog, ChannelTextarea, JoinPanel },
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
	},
	template: `
		<BaseChatContent :dialogId="dialogId">
			<template #header="{ currentSidebarPanel }">
				<ChannelHeader :dialogId="dialogId" :currentSidebarPanel="currentSidebarPanel" :key="dialogId" />
			</template>
			<template #dialog>
				<ChannelDialog :dialogId="dialogId" :key="dialogId" />
			</template>
			<template #join-panel>
				<JoinPanel :dialogId="dialogId" />
			</template>
			<template #textarea="{ onTextareaMount }">
				<ChannelTextarea :dialogId="dialogId" :key="dialogId" @mounted="onTextareaMount" />
			</template>
		</BaseChatContent>
	`,
};
