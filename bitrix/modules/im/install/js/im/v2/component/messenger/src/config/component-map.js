import { ChatContent } from 'im.v2.component.content.chat';
import { CreateChatContent, UpdateChatContent } from 'im.v2.component.content.chat-forms.forms';
import { MarketContent } from 'im.v2.component.content.market';
import { NotificationContent } from 'im.v2.component.content.notification';
import { OpenlinesContent } from 'im.v2.component.content.openlines';
import { OpenlinesV2Content } from 'im.v2.component.content.openlinesV2';
import { SettingsContent } from 'im.v2.component.content.settings';
import { ChannelListContainer } from 'im.v2.component.list.container.channel';
import { CollabListContainer } from 'im.v2.component.list.container.collab';
import { CopilotListContainer } from 'im.v2.component.list.container.copilot';
import { OpenlineListContainer } from 'im.v2.component.list.container.openline';
import { RecentListContainer } from 'im.v2.component.list.container.recent';

import type { BitrixVueComponentProps } from 'ui.vue3';
import type { LayoutType } from 'im.v2.const';

type ComponentMap = Record<LayoutType, { list: BitrixVueComponentProps, content: BitrixVueComponentProps }>

export const LayoutComponentMap: ComponentMap = {
	chat: {
		list: RecentListContainer,
		content: ChatContent,
	},
	createChat: {
		list: RecentListContainer,
		content: CreateChatContent,
	},
	updateChat: {
		list: RecentListContainer,
		content: UpdateChatContent,
	},
	channel: {
		list: ChannelListContainer,
		content: ChatContent,
	},
	notification: {
		list: RecentListContainer,
		content: NotificationContent,
	},
	openlines: {
		content: OpenlinesContent,
	},
	openlinesV2: {
		list: OpenlineListContainer,
		content: OpenlinesV2Content,
	},
	conference: {
		list: RecentListContainer,
		content: ChatContent,
	},
	settings: {
		content: SettingsContent,
	},
	copilot: {
		list: CopilotListContainer,
		content: ChatContent,
	},
	collab: {
		list: CollabListContainer,
		content: ChatContent,
	},
	market: {
		content: MarketContent,
	},
};
