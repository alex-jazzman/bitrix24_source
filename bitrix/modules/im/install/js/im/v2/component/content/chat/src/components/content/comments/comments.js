import { BaseChatContent } from '../base/base';
import { CommentsHeader } from './components/header';
import { CommentsDialog } from './components/dialog';
import { CommentsTextarea } from './components/textarea';
import { JoinPanel } from './components/join-panel';

import './css/comments-content.css';

export const CommentsContent = {
	name: 'CommentsContent',
	components: { BaseChatContent, CommentsHeader, CommentsDialog, CommentsTextarea, JoinPanel },
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
		channelId: {
			type: String,
			required: true,
		},
	},
	template: `
		<BaseChatContent :dialogId="dialogId">
			<template #header="{ currentSidebarPanel }">
				<CommentsHeader
					:dialogId="dialogId"
					:channelId="channelId"
					:currentSidebarPanel="currentSidebarPanel"
					:key="dialogId"
				/>
			</template>
			<template #dialog>
				<CommentsDialog :dialogId="dialogId" :key="dialogId" />
			</template>
			<template #join-panel>
				<JoinPanel :dialogId="dialogId" />
			</template>
			<template #textarea="{ onTextareaMount }">
				<CommentsTextarea :dialogId="dialogId" :key="dialogId" @mounted="onTextareaMount" />
			</template>
		</BaseChatContent>
	`,
};
