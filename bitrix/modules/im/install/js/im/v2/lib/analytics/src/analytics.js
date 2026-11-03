import { Text, Type } from 'main.core';
import { sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';
import { ChatType, Layout, UserRole } from 'im.v2.const';
import { type ImModelChat } from 'im.v2.model';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

import { AiAssistant } from './classes/ai-assistant';
import { AttachMenu } from './classes/attach-menu';
import { BulkActionsPanel } from './classes/bulk-actions-panel';
import { ChatCreate } from './classes/chat-create';
import { ChatDelete } from './classes/chat-delete';
import { ChatEdit } from './classes/chat-edit';
import { ChatEntities } from './classes/chat-entities';
import { ChatInviteLink } from './classes/chat-invite-link';
import { CheckIn } from './classes/check-in';
import { CollabEntities } from './classes/collab-entities';
import { Copilot } from './classes/copilot';
import { DesktopMode } from './classes/desktop-mode';
import { Folder } from './classes/folder';
import { FormatToolbar } from './classes/format-toolbar';
import { HistoryLimit } from './classes/history-limit';
import { Mention } from './classes/mention';
import { Guest } from './classes/guest.js';
import { MessageContextMenu } from './classes/message-context-menu';
import { MessageDelete } from './classes/message-delete';
import { MessageForward } from './classes/message-forward';
import { MessagePins } from './classes/message-pins';
import { MessageSearch } from './classes/message-search';
import { Notification } from './classes/notification';
import { Player } from './classes/player';
import { ProjectTab } from './classes/project-tab';
import { RecentContextMenu } from './classes/recent-context-menu';
import { RecentHeaderMenu } from './classes/recent-header-menu';
import { RecentSearch } from './classes/recent-search';
import { Settings } from './classes/settings';
import { SliderInvite } from './classes/slider-invite';
import { Stickers } from './classes/stickers';
import { Supervisor } from './classes/supervisor';
import { TaskComments } from './classes/task-comments';
import { UserAdd } from './classes/user-add';
import { VoiceRecorder } from './classes/voice-recorder';
import { Vote } from './classes/vote-create';
import { AnalyticsEvent, AnalyticsTool, AnalyticsCategory } from './const';
import { getCategoryByChat, getCategoryByChatType } from './helpers/get-category-by-chat-type';
import { getChatType } from './helpers/get-chat-type';
import { getCollabId, getProjectId } from './helpers/get-collab-id';
import { getFolderSection } from './helpers/get-folder-section';
import { getLayoutName } from './helpers/get-layout-name';
import { getUserType } from './helpers/get-user-type';
import { isAiAssistant } from './helpers/is-ai-assistant';
import { isSelfChat } from './helpers/is-self-chat';
import { BitrixGptAgentPromo } from './classes/bitrix-gpt-agent-promo';

type DialogId = string;

// Tabs of the navigation menu that became tiles of the folder bar once the folders feature was turned
// on (`MenuItemProvider::getDefaultMenuItems()` hides the menu items there). While it is off they are
// still tabs and still report. `notification` and `settings` stay menu items either way.
const FolderSectionTabs = [
	Layout.copilot,
	Layout.collab,
	Layout.channel,
	Layout.openlines,
	Layout.taskComments,
];

const TrackedTabs = [...FolderSectionTabs, Layout.notification, Layout.settings];

export {
	AnalyticsSection,
	AnalyticsSubSection,
	CreateChatContext,
	DateNavigationEntryPoint,
} from './const';
export { getCollabId } from './helpers/get-collab-id';
export { getUserType } from './helpers/get-user-type';
export { getCopilotContext } from './helpers/get-copilot-context';

export class Analytics
{
	#excludedChats: Set<DialogId> = new Set();
	#chatsWithTyping: Set<DialogId> = new Set();
	#currentTab: string = Layout.chat;

	chatCreate: ChatCreate = new ChatCreate();
	chatEdit: ChatEdit = new ChatEdit();
	chatDelete: ChatDelete = new ChatDelete();
	messageDelete: MessageDelete = new MessageDelete();
	historyLimit: HistoryLimit = new HistoryLimit();
	userAdd: UserAdd = new UserAdd();
	collabEntities: CollabEntities = new CollabEntities();
	chatEntities: ChatEntities = new ChatEntities();
	supervisor: Supervisor = new Supervisor();
	checkIn: CheckIn = new CheckIn();
	copilot: Copilot = new Copilot();
	attachMenu: AttachMenu = new AttachMenu();
	vote: Vote = new Vote();
	messagePins: MessagePins = new MessagePins();
	messageForward: MessageForward = new MessageForward();
	messageContextMenu: MessageContextMenu = new MessageContextMenu();
	bulkActionsPanel: BulkActionsPanel = new BulkActionsPanel();
	sliderInvite: SliderInvite = new SliderInvite();
	desktopMode: DesktopMode = new DesktopMode();
	chatInviteLink: ChatInviteLink = new ChatInviteLink();
	aiAssistant: AiAssistant = new AiAssistant();
	player: Player = new Player();
	voiceRecorder: VoiceRecorder = new VoiceRecorder();
	projectTab: ProjectTab = new ProjectTab();
	notification: Notification = new Notification();
	stickers: Stickers = new Stickers();
	messageSearch: MessageSearch = new MessageSearch();
	recentContextMenu: RecentContextMenu = new RecentContextMenu();
	formatToolbar: FormatToolbar = new FormatToolbar();
	recentSearch: RecentSearch = new RecentSearch();
	mention: Mention = new Mention();
	taskComments: TaskComments = new TaskComments();
	recentHeaderMenu: RecentHeaderMenu = new RecentHeaderMenu();
	guest: Guest = new Guest();
	bitrixGptAgentPromo: BitrixGptAgentPromo = new BitrixGptAgentPromo();
	folder: Folder = new Folder();
	settings: Settings = new Settings();
	#isBitrixGptV2Available = FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available);

	static #instance: Analytics;

	static getInstance(): Analytics
	{
		if (!this.#instance)
		{
			this.#instance = new this();
		}

		return this.#instance;
	}

	ignoreNextChatOpen(dialogId: string): void
	{
		if (!Type.isStringFilled(dialogId))
		{
			return;
		}

		this.#excludedChats.add(dialogId);
	}

	onOpenTab(tabName: string): void
	{
		if (this.#currentTab === tabName)
		{
			return;
		}

		// The folder bar reports this section with an open_folder of its own, and open_tab is the event
		// of the tab navigation that bar replaced: sending both would count one move twice. The visit of
		// the previous tab still ends here, so a later return to it is a move of its own and reports.
		if (this.#isFolderSection(tabName))
		{
			this.#currentTab = null;

			return;
		}

		// An untracked section ends the current tab just as well: keeping the previous name here would
		// drop the next return to that tab as a repeat.
		this.#currentTab = tabName;

		if (!TrackedTabs.includes(tabName))
		{
			return;
		}

		sendData({
			event: AnalyticsEvent.openTab,
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.messenger,
			type: getLayoutName(tabName),
			p2: getUserType(),
		});
	}

	// Asked of the feature and not of im.v2.lib.folder: that extension already imports this one, and
	// the answer here needs nothing but the flag and the list above.
	#isFolderSection(tabName: string): boolean
	{
		return FolderSectionTabs.includes(tabName)
			&& FeatureManager.isFeatureAvailable(Feature.isChatFoldersWebAvailable);
	}

	onOpenChat(dialog: ImModelChat): void
	{
		if (this.#excludedChats.has(dialog.dialogId))
		{
			this.#excludedChats.delete(dialog.dialogId);

			return;
		}

		this.#chatsWithTyping.delete(dialog.dialogId);
		const chatType = getChatType(dialog);

		if (chatType === ChatType.copilot)
		{
			this.copilot.onOpenChat(dialog.dialogId);
		}

		if (isAiAssistant(dialog.dialogId))
		{
			this.aiAssistant.onOpenChatAI(dialog);
		}

		const currentLayout = getLayoutName(Core.getStore().getters['application/getLayout'].name);
		const isMember = dialog.role === UserRole.guest ? 'N' : 'Y';
		const isProjectChat = getCategoryByChat(dialog) === AnalyticsCategory.collab;

		const params = {
			tool: AnalyticsTool.im,
			category: isProjectChat ? AnalyticsCategory.collab : getCategoryByChatType(chatType),
			event: AnalyticsEvent.openExisting,
			type: chatType,
			c_section: getFolderSection(currentLayout),
			p2: getUserType(),
		};

		if (!isSelfChat(dialog.dialogId))
		{
			params.p5 = `chatId_${dialog.chatId}`;
		}

		if (chatType === ChatType.comment)
		{
			const parentChat: ?ImModelChat = Core.getStore().getters['chats/getByChatId'](dialog.parentChatId);
			if (!parentChat)
			{
				return;
			}

			params.p1 = `chatType_${parentChat.type}`;
			params.p4 = `parentChatId_${dialog.parentChatId}`;
		}

		if (isProjectChat)
		{
			const projectId = getProjectId(dialog);
			if (projectId)
			{
				params.p4 = projectId;
			}
		}

		if (chatType !== ChatType.copilot)
		{
			params.p3 = `isMember_${isMember}`;
		}

		if (chatType === ChatType.copilot && !this.#isBitrixGptV2Available && !isProjectChat)
		{
			const role = Core.getStore().getters['copilot/chats/getRole'](dialog.dialogId);
			params.p4 = `role_${Text.toCamelCase(role.code)}`;
		}

		sendData(params);
	}

	onTypeMessage(dialog: ImModelChat): void
	{
		if (!dialog.inited)
		{
			return;
		}

		if (!isSelfChat(dialog.dialogId) || this.#chatsWithTyping.has(dialog.dialogId))
		{
			return;
		}

		this.#chatsWithTyping.add(dialog.dialogId);

		const chatType = getChatType(dialog);

		const params = {
			tool: AnalyticsTool.im,
			category: getCategoryByChatType(chatType),
			event: AnalyticsEvent.typeMessage,
			p1: `chatType_${chatType}`,
		};

		sendData(params);
	}
}
