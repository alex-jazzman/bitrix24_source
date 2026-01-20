import { Runtime } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { Core } from 'tasks.v2.core';
import { Option } from 'tasks.v2.const';
import { ahaMoments } from 'tasks.v2.lib.aha-moments';

import type { MessageMenuContext } from 'im.v2.lib.menu';

import { TaskFullCardMessageMenu } from './message-menu';
import { ChatAha } from '../aha/chat-aha/chat-aha';
import { ImportantMessagesAha } from '../aha/important-messages-aha/important-messages-aha';

import './chat.css';

// @vue/component
export const Chat = {
	name: 'TaskFullCardChat',
	components: {
		ChatAha,
		ImportantMessagesAha,
	},
	inject: {
		task: {},
		taskId: {},
		isEdit: {},
	},
	setup(): Object
	{
		return {
			/** @type MessageMenuContext */
			messageMenuManager: null,
		};
	},
	data(): Object
	{
		return {
			isTaskChatAhaShown: false,
			isTaskImportantMessagesAhaShown: false,
		};
	},
	computed: {
		taskChatAhaBindElement(): ?HTMLElement
		{
			if (this.$refs.chat)
			{
				return this.$refs.chat.querySelector('.bx-im-chat-header__left');
			}

			return null;
		},
		taskImportantMessagesAhaBindElement(): ?HTMLElement
		{
			if (this.$refs.chat)
			{
				return this.$refs.chat.querySelector('.bx-im-send-panel__container');
			}

			return null;
		},
	},
	watch: {
		async taskId(): void
		{
			await this.openChat();

			void this.registerMessageMenu();
		},
	},
	created(): void
	{
		if (this.isEdit)
		{
			this.registerMessageMenu();
		}
	},
	mounted(): void
	{
		void this.openChat();
	},
	unmounted(): void
	{
		this.unregisterMessageMenu();
		this.app?.bitrixVue.unmount();
	},
	methods: {
		async openChat(): Promise<void>
		{
			if (!Core.getParams().features.im)
			{
				return;
			}

			this.app?.bitrixVue.unmount();

			const { Messenger } = await Runtime.loadExtension('im.public');

			this.app ??= await Messenger.initApplication('task'); // im.v2.application.integration.task

			if (this.isEdit)
			{
				await this.app.mount({
					rootContainer: this.$refs.chat,
					chatId: this.task.chatId,
					taskId: this.taskId,
					type: Core.getParams().chatType,
				});

				this.tryShowAha();
			}
			else
			{
				await this.app.mountPlaceholder({
					rootContainer: this.$refs.chat,
					taskId: `'${this.taskId}'`,
				});

				EventEmitter.emit('tasks:card:onMembersCountChange', {
					taskId: this.taskId,
					userCounter: 1,
				});
			}
		},
		async registerMessageMenu(): void
		{
			if (!Core.getParams().features.im)
			{
				return;
			}

			const { MessageMenu, MessageMenuManager } = await Runtime.loadExtension('im.v2.lib.menu');
			this.messageMenuManager = MessageMenuManager;

			const taskId = this.taskId;
			const taskFullCardMessageMenu = class extends TaskFullCardMessageMenu(MessageMenu)
			{
				getTaskId(): number
				{
					return taskId;
				}
			};

			this.messageMenuManager.getInstance().registerMenuByCallback(this.isCurrentChat, taskFullCardMessageMenu);
		},
		unregisterMessageMenu(): void
		{
			this.messageMenuManager?.getInstance().unregisterMenuByCallback(this.isCurrentChat);
		},
		isCurrentChat(messageContext: MessageMenuContext): boolean
		{
			return messageContext.chatId === this.task.chatId;
		},
		tryShowAha(): void
		{
			if (this.taskChatAhaBindElement && ahaMoments.shouldShow(Option.AhaTaskChatPopup))
			{
				ahaMoments.setActive(Option.AhaTaskChatPopup);

				setTimeout(this.showTaskChatAha, 3000);

				return;
			}

			if (this.taskImportantMessagesAhaBindElement && ahaMoments.shouldShow(Option.AhaTaskImportantMessagesPopup))
			{
				ahaMoments.setActive(Option.AhaTaskImportantMessagesPopup);

				setTimeout(this.showTaskImportantMessagesAha, 3000);
			}
		},
		showTaskChatAha(): void
		{
			this.isTaskChatAhaShown = true;

			ahaMoments.setShown(Option.AhaTaskChatPopup);
		},
		showTaskImportantMessagesAha(): void
		{
			this.isTaskImportantMessagesAhaShown = true;

			ahaMoments.setShown(Option.AhaTaskImportantMessagesPopup);
		},
		handleCloseChatAha(): void
		{
			this.isTaskChatAhaShown = false;
			ahaMoments.setInactive(Option.AhaTaskChatPopup);

			if (ahaMoments.shouldShow(Option.AhaTaskImportantMessagesPopup))
			{
				setTimeout(this.showTaskImportantMessagesAha, 2000);
			}
		},
		handleCloseImportantMessagesAha(): void
		{
			this.isTaskImportantMessagesAhaShown = false;
			ahaMoments.setInactive(Option.AhaTaskImportantMessagesPopup);
		},
	},
	template: `
		<div class="tasks-full-card-chat" ref="chat">
			<div style="color: #f00">module 'im' is not installed</div>
		</div>
		<ChatAha
			v-if="isTaskChatAhaShown"
			:isShown="isTaskChatAhaShown"
			:bindElement="taskChatAhaBindElement"
			@close="handleCloseChatAha"
		/>
		<ImportantMessagesAha
			v-if="isTaskImportantMessagesAhaShown"
			:isShown="isTaskImportantMessagesAhaShown"
			:bindElement="taskImportantMessagesAhaBindElement"
			@close="handleCloseImportantMessagesAha"
		/>
	`,
};
