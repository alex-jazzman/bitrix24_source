import { Core } from 'im.v2.application.core';
import { BaseChatContent } from 'im.v2.component.content.elements';
import { ChatDialog } from 'im.v2.component.dialog.chat';
import { ChatType } from 'im.v2.const';
import { MessageMenuManager, type MessageMenuContext } from 'im.v2.lib.menu';
import { type ImModelChat } from 'im.v2.model';

import { StatusGroup } from 'imopenlines.v2.const';
import { QueueType, type QueueTypeName } from 'imopenlines.v2.lib.queue';
import { type ImolModelSession } from 'imopenlines.v2.model';

import { OpenLinesMessageMenu } from './classes/message-menu';
import { OpenLinesHeader } from './components/header/header';
import { BlockedPanel } from './components/join-panel/components/blocked-panel';
import { ChatControlPanel } from './components/join-panel/components/chat-control-panel';
import { JoinPanelContainer } from './components/join-panel/join-panel-container';
import { OpenLinesTextarea } from './components/textarea/textarea';

import './components/join-panel/css/join-panel.css';

// @vue/component
export const OpenLinesContent = {
	name: 'OpenLinesContent',
	components: {
		BaseChatContent,
		BlockedPanel,
		JoinPanelContainer,
		ChatControlPanel,
		OpenLinesHeader,
		ChatDialog,
		OpenLinesTextarea,
	},
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed:
	{
		queueType(): ?QueueTypeName
		{
			const session = this.getSessionByDialogId(this.dialogId);
			if (!session)
			{
				return null;
			}

			const queue = this.$store.getters['openLines/queue/getById'](session.queueId);

			return queue?.type ?? null;
		},
		isQueueTypeAll(): boolean
		{
			return this.queueType === QueueType.all;
		},
		dialog(): ?ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		sessionByChat(): ?ImolModelSession
		{
			return this.$store.getters['openLines/sessions/getByChatId'](this.dialog.chatId, true);
		},
		isNewSession(): boolean
		{
			return this.sessionByChat?.status === StatusGroup.new;
		},
		isSessionOperator(): boolean
		{
			return Core.getUserId() === this.sessionByChat?.operatorId;
		},
		isClosed(): boolean
		{
			return this.sessionByChat?.isClosed ?? false;
		},
		isSessionBlocked(): boolean
		{
			const blockDate = this.sessionByChat?.blockDate;
			if (!blockDate)
			{
				return false;
			}

			const blockDateTime = new Date(Number(blockDate) * 1000);

			return blockDateTime < new Date();
		},
		shouldShowBlockedPanel(): boolean
		{
			return this.isSessionBlocked;
		},
		shouldShowControlPanel(): boolean
		{
			return !this.isSessionBlocked && this.isNewSession && (this.isSessionOperator || this.isQueueTypeAll);
		},
	},
	created()
	{
		this.registerMessageMenu();
	},
	methods:
	{
		registerMessageMenu()
		{
			MessageMenuManager.getInstance().registerMenuByCallback((context: MessageMenuContext) => {
				const chat: ImModelChat = this.$store.getters['chats/get'](context.dialogId);

				return chat.type === ChatType.lines;
			}, OpenLinesMessageMenu);
		},
		getSessionByDialogId(dialogId: string): ?ImolModelSession
		{
			return this.$store.getters['openLines/recent/getSession'](dialogId, true);
		},
	},
	template: `
		<BaseChatContent :dialogId="dialogId">
			<template #header>
				<OpenLinesHeader :dialogId="dialogId" :key="dialogId" :isQueueTypeAll="isQueueTypeAll" />
			</template>
			<template #textarea="{ onTextareaMount }">
				<div v-if="shouldShowBlockedPanel || shouldShowControlPanel" class="bx-imol-textarea_action-buttons-panel">
					<BlockedPanel v-if="shouldShowBlockedPanel" :dialogId="dialogId"/>
					<ChatControlPanel v-else :dialogId="dialogId" :isQueueTypeAll="isQueueTypeAll"/>
				</div>
				<OpenLinesTextarea v-else :dialogId="dialogId" @mounted="onTextareaMount"/>
			</template>
			<template #join-panel>
				<JoinPanelContainer :dialogId="dialogId" :isQueueTypeAll="isQueueTypeAll"/>
			</template>
		</BaseChatContent>
	`,
};
