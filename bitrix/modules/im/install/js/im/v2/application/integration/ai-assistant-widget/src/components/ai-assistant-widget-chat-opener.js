import 'im.v2.css.classes';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

import { WidgetChatManager } from '../classes/widget-chat-manager';
import { CopilotWidgetLayout } from './copilot-widget/layout';
import { MartaWidgetChatContent } from './marta-widget/chat-content';

import './css/ai-assistant-chat-opener.css';

// @vue/component
export const AiAssistantWidgetChatOpener = {
	name: 'AiAssistantWidgetChatOpener',
	components: { CopilotWidgetLayout, MartaWidgetChatContent },
	props: {
		botDialogId: {
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
		isCopilotMode(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available);
		},
	},

	created(): void
	{
		if (this.isCopilotMode)
		{
			void this.resolveInitialChat();
		}
		else
		{
			void WidgetChatManager.getInstance().loadChat(this.botDialogId);
		}
	},
	methods: {
		async resolveInitialChat()
		{
			const dialogId = await WidgetChatManager.getInstance().resolveInitialChat();
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
		<div class="bx-im-messenger__scope bx-im-ai-assistant-chat-opener__container --ui-context-content-light">
			<CopilotWidgetLayout
				v-if="isCopilotMode"
				:dialogId="selectedDialogId"
				:isCreatingChat="isCreatingChat"
				@select="onChangeDialogId"
				@createChat="onCreateChat"
				@recentVisibilityChanged="onRecentVisibilityChange"
			/>
			<MartaWidgetChatContent
				v-else
				:dialogId="botDialogId"
				:withSidebar="false"
			/>
		</div>
	`,
};
