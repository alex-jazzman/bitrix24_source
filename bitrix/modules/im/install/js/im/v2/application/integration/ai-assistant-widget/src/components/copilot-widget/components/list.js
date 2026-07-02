import { CopilotList } from 'im.v2.component.list.items.copilot';
import { CopilotWidgetListHeader } from './header';
import '../css/list.css';

// @vue/component
export const CopilotWidgetRecentList = {
	name: 'CopilotWidgetRecentList',
	components: { CopilotList, CopilotWidgetListHeader },
	props: {
		dialogId: {
			type: String,
			default: '',
		},
		withSidebar: {
			type: Boolean,
			default: true,
		},
		isCreating: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['newChat', 'close', 'chatSelect'],

	template: `
		<div class="bx-im-ai-assistant-chat-recent-list">
			<CopilotWidgetListHeader
				:isCreating="isCreating"
				@newChat="$emit('newChat')"
				@close="$emit('close')"
			/>
			<CopilotList @selectChat="$emit('chatSelect', $event)"/>
		</div>
	`,
};
