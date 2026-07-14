import { EventEmitter } from 'main.core.events';
import { SlideAnimation } from 'im.v2.component.animation';

import { CopilotWidgetChatContent } from './components/chat-content';
import { CopilotWidgetRecentList } from './components/list';

import './css/chat-layout.css';

const MINIMIZE_EVENT_NAME = 'IM.AiAssistantWidget:minimize';

// @vue/component
export const CopilotWidgetLayout = {
	name: 'CopilotWidgetLayout',
	components: { SlideAnimation, CopilotWidgetRecentList, CopilotWidgetChatContent },
	props: {
		dialogId: {
			type: String,
			default: '',
		},
		isCreatingChat: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['select', 'createChat', 'recentVisibilityChanged'],
	data(): { isPanelOpen: boolean }
	{
		return {
			isPanelOpen: false,
		};
	},

	methods: {
		togglePanel()
		{
			this.isPanelOpen = !this.isPanelOpen;
			this.$emit('recentVisibilityChanged', this.isPanelOpen )
		},
		closePanel()
		{
			this.isPanelOpen = false;
		},
		selectDialog(dialogId: string)
		{
			this.closePanel();
			this.$emit('select', dialogId);
		},
		onCreateChat()
		{
			this.closePanel();
			this.$emit('createChat');
		},
		onHeaderClose()
		{
			if (this.dialogId)
			{
				this.isPanelOpen = false;
			}
			else
			{
				EventEmitter.emit(MINIMIZE_EVENT_NAME);
			}
		},
	},
	template: `
		<div class="bx-im-ai-assistant-widget-layout__container">
			<main class="bx-im-ai-assistant-widget-layout__content">
				<CopilotWidgetChatContent
					v-if="dialogId"
					:dialogId="dialogId"
					:withSidebar="false"
					:isCreatingChat="isCreatingChat"
					@toggleList="togglePanel"
					@createChat="onCreateChat"
				/>
			</main>

			<SlideAnimation>
				<aside class="bx-im-ai-assistant-widget-layout__panel-container --ui-context-content-light" v-if="isPanelOpen">
					<CopilotWidgetRecentList
						@chatSelect="selectDialog"
						@createChat="onCreateChat"
						@close="onHeaderClose"
					/>
				</aside>
			</SlideAnimation>
		</div>
	`,
};
