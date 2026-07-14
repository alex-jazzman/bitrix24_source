import { type BaseEvent } from 'main.core.events';

import 'im.v2.css.classes';

import { WidgetChatManager } from '../classes/widget-chat-manager';
import { CopilotWidgetLayout } from './copilot-widget/layout';
import { MartaWidgetChatContent } from './marta-widget/chat-content';

import './css/ai-assistant-chat-opener.css';

// @vue/component
export const AiAssistantWidgetChatOpener = {
	name: 'AiAssistantWidgetChatOpener',
	components: { CopilotWidgetLayout, MartaWidgetChatContent },
	props: {
		initialDialogId: {
			type: String,
			required: true,
		},
	},

	data(): { selectedDialogId: string, isCreatingChat: boolean }
	{
		return {
			selectedDialogId: '',
			isCreatingChat: false,
		};
	},

	computed: {
		isBitrixGptMode(): boolean
		{
			return WidgetChatManager.getInstance().isBitrixGptMode;
		},
	},

	created(): void
	{
		this.manager = WidgetChatManager.getInstance();
		this.manager.subscribeNotifier();
		this.manager.subscribe(WidgetChatManager.events.onDialogIdChange, this.onManagerDialogIdChange);

		if (this.isBitrixGptMode)
		{
			void this.resolveInitialChat();
		}
		else
		{
			void this.manager.loadChat(this.initialDialogId);
		}
	},
	beforeUnmount()
	{
		this.manager.unsubscribeNotifier();
		this.manager.unsubscribe(WidgetChatManager.events.onDialogIdChange, this.onManagerDialogIdChange);
		this.manager.clearWidgetState();
	},
	methods: {
		onManagerDialogIdChange(event: BaseEvent): void
		{
			const { dialogId } = event.getData();
			this.selectedDialogId = dialogId ?? '';
		},
		async resolveInitialChat()
		{
			const dialogId = await WidgetChatManager.getInstance().resolveInitialChat(this.initialDialogId);
			if (dialogId)
			{
				this.selectedDialogId = dialogId;
			}
		},
		async onChangeDialogId(dialogId: string)
		{
			const openedDialogId = await WidgetChatManager.getInstance().selectAndOpenChat(dialogId, this.selectedDialogId);
			if (openedDialogId)
			{
				this.selectedDialogId = openedDialogId;
			}
		},
		onRecentVisibilityChange(isOpened: boolean)
		{
			if (!isOpened)
			{
				return;
			}

			WidgetChatManager.getInstance().setRecentDraftText(this.selectedDialogId);
		},
		async onCreateChat()
		{
			this.isCreatingChat = true;
			try
			{
				const newDialogId = await WidgetChatManager.getInstance().createNewChat();
				if (newDialogId)
				{
					this.selectedDialogId = newDialogId;
				}
			}
			finally
			{
				this.isCreatingChat = false;
			}
		},
	},
	template: `
		<div class="bx-im-messenger__scope bx-im-ai-assistant-chat-opener__container">
			<CopilotWidgetLayout
				v-if="isBitrixGptMode"
				:dialogId="selectedDialogId"
				:isCreatingChat="isCreatingChat"
				@select="onChangeDialogId"
				@createChat="onCreateChat"
				@recentVisibilityChanged="onRecentVisibilityChange"
			/>
			<MartaWidgetChatContent
				v-else
				:dialogId="initialDialogId"
				:withSidebar="false"
			/>
		</div>
	`,
};
