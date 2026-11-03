import { type BitrixVueComponentProps } from 'ui.vue3';

import { ChatContent } from 'im.v2.component.content.chat';
import { CreateChatContent, UpdateChatContent, CollabV2CopyContent } from 'im.v2.component.content.chat-forms.forms';
import { AllFolderSettings, FolderCreation, FolderUpdateContent } from 'im.v2.component.content.folder-forms';
import { MarketContent } from 'im.v2.component.content.market';
import { NotificationContent } from 'im.v2.component.content.notification';
import { OpenlinesContent } from 'im.v2.component.content.openlines';
import { OpenlinesV2Content } from 'im.v2.component.content.openlinesV2';
import { SettingsContent } from 'im.v2.component.content.settings';
import { ChannelListContainer } from 'im.v2.component.list.container.channel';
import { CollabListContainer } from 'im.v2.component.list.container.collab';
import { AiAssistantListContainer } from 'im.v2.component.list.container.ai-assistant';
import { OpenlineListContainer } from 'im.v2.component.list.container.openline';
import { RecentListContainer } from 'im.v2.component.list.container.recent';
import { TaskListContainer } from 'im.v2.component.list.container.task';
import { AllFolderListContainer, PersonalFolderListContainer } from 'im.v2.component.list.container.folder';
import { VibecodeAppListContainer } from 'im.v2.component.list.container.vibecode-app';
import { Layout, type LayoutType } from 'im.v2.const';

type ComponentMap = Record<LayoutType, { list: BitrixVueComponentProps, content: BitrixVueComponentProps }>

export const LayoutComponentMap: ComponentMap = {
	[Layout.chat]: {
		list: RecentListContainer,
		content: ChatContent,
	},
	[Layout.createChat]: {
		list: RecentListContainer,
		content: CreateChatContent,
	},
	[Layout.updateChat]: {
		list: RecentListContainer,
		content: UpdateChatContent,
	},
	[Layout.createFolder]: {
		list: RecentListContainer,
		content: FolderCreation,
	},
	[Layout.updateFolder]: {
		list: RecentListContainer,
		content: FolderUpdateContent,
	},
	[Layout.copyCollab]: {
		list: RecentListContainer,
		content: CollabV2CopyContent,
	},
	[Layout.channel]: {
		list: ChannelListContainer,
		content: ChatContent,
	},
	[Layout.notification]: {
		list: RecentListContainer,
		content: NotificationContent,
	},
	[Layout.openlines]: {
		content: OpenlinesContent,
	},
	[Layout.openlinesV2]: {
		list: OpenlineListContainer,
		content: OpenlinesV2Content,
	},
	[Layout.conference]: {
		list: RecentListContainer,
		content: ChatContent,
	},
	[Layout.settings]: {
		content: SettingsContent,
	},
	[Layout.copilot]: {
		list: AiAssistantListContainer,
		content: ChatContent,
	},
	[Layout.collab]: {
		list: CollabListContainer,
		content: ChatContent,
	},
	[Layout.vibecodeApp]: {
		list: VibecodeAppListContainer,
		content: ChatContent,
	},
	[Layout.market]: {
		content: MarketContent,
	},
	[Layout.taskComments]: {
		list: TaskListContainer,
		content: ChatContent,
	},
	[Layout.folder]: {
		list: PersonalFolderListContainer,
		content: ChatContent,
	},
	[Layout.folderAll]: {
		list: AllFolderListContainer,
		content: ChatContent,
	},
	[Layout.folderAllSettings]: {
		list: AllFolderListContainer,
		content: AllFolderSettings,
	},
};

// Layouts with no list of their own: on the left they show the list of the section where plain chats
// live, picked in `listComponent()` of the root component. Their entries above stay as the fallback
// for the case when that section is the chats one. The list is closed and manual - a new layout
// without a list of its own belongs here only by a deliberate decision, and layouts with no list at
// all (openlines, settings, market) do not belong here.
export const LayoutsWithRegularChatsList: Set<LayoutType> = new Set([
	Layout.createChat,
	Layout.updateChat,
	Layout.createFolder,
	Layout.updateFolder,
	Layout.copyCollab,
	Layout.notification,
	Layout.conference,
]);
