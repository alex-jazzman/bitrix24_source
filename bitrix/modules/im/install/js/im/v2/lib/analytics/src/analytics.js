import { Text, Type } from 'main.core';
import { sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';
import { ChatType, Layout, UserRole } from 'im.v2.const';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { type ImModelChat } from 'im.v2.model';

import { AiAssistant } from './classes/ai-assistant';
import { AttachMenu } from './classes/attach-menu';
import { ChatCreate } from './classes/chat-create';
import { ChatDelete } from './classes/chat-delete';
import { ChatEdit } from './classes/chat-edit';
import { ChatEntities } from './classes/chat-entities';
import { ChatInviteLink } from './classes/chat-invite-link';
import { CheckIn } from './classes/check-in';
import { CollabEntities } from './classes/collab-entities';
import { Copilot } from './classes/copilot';
import { DesktopMode } from './classes/desktop-mode';
import { FormatToolbar } from './classes/format-toolbar';
import { HistoryLimit } from './classes/history-limit';
import { Mention } from './classes/mention';
import { MessageContextMenu } from './classes/message-context-menu';
import { MessageDelete } from './classes/message-delete';
import { MessageForward } from './classes/message-forward';
import { MessagePins } from './classes/message-pins';
import { MessageSearch } from './classes/message-search';
import { Notification } from './classes/notification';
import { Player } from './classes/player';
import { RecentContextMenu } from './classes/recent-context-menu';
import { RecentSearch } from './classes/recent-search';
import { SliderInvite } from './classes/slider-invite';
import { Stickers } from './classes/stickers';
import { Supervisor } from './classes/supervisor';
import { TaskComments } from './classes/task-comments';
import { UserAdd } from './classes/user-add';
import { Vote } from './classes/vote-create';
import { AnalyticsEvent, AnalyticsTool, AnalyticsCategory } from './const';
import { getCategoryByChatType } from './helpers/get-category-by-chat-type';
import { getChatType } from './helpers/get-chat-type';
import { getCollabId } from './helpers/get-collab-id';
import { getUserType } from './helpers/get-user-type';
import { isAiAssistant } from './helpers/is-ai-assistant';
import { isSelfChat } from './helpers/is-self-chat';
import { RecentHeaderMenu } from './classes/recent-header-menu';
import { BitrixGptAgentPromo } from './classes/bitrix-gpt-agent-promo';

type DialogId = string;

export { CreateChatContext } from './const';
export { getCollabId } from './helpers/get-collab-id';
export { getUserType } from './helpers/get-user-type';

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
	sliderInvite: SliderInvite = new SliderInvite();
	desktopMode: DesktopMode = new DesktopMode();
	chatInviteLink: ChatInviteLink = new ChatInviteLink();
	aiAssistant: AiAssistant = new AiAssistant();
	player: Player = new Player();
	notification: Notification = new Notification();
	stickers: Stickers = new Stickers();
	messageSearch: MessageSearch = new MessageSearch();
	recentContextMenu: RecentContextMenu = new RecentContextMenu();
	formatToolbar: FormatToolbar = new FormatToolbar();
	recentSearch: RecentSearch = new RecentSearch();
	mention: Mention = new Mention();
	taskComments: TaskComments = new TaskComments();
	recentHeaderMenu: RecentHeaderMenu = new RecentHeaderMenu();
	#isBitrixGptV2Available = FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available);
	bitrixGptAgentPromo: BitrixGptAgentPromo = new BitrixGptAgentPromo();

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
		const trackedTabs = [
			Layout.copilot,
			Layout.collab,
			Layout.channel,
			Layout.notification,
			Layout.settings,
			Layout.openlines,
			Layout.taskComments,
		];

		if (!trackedTabs.includes(tabName))
		{
			return;
		}

		if (this.#currentTab === tabName)
		{
			return;
		}

		this.#currentTab = tabName;

		sendData({
			event: AnalyticsEvent.openTab,
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.messenger,
			type: tabName,
			p2: getUserType(),
		});
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

		const currentLayout = Core.getStore().getters['application/getLayout'].name;
		const isMember = dialog.role === UserRole.guest ? 'N' : 'Y';

		const params = {
			tool: AnalyticsTool.im,
			category: getCategoryByChatType(chatType),
			event: AnalyticsEvent.openExisting,
			type: chatType,
			c_section: `${currentLayout}_tab`,
			p2: getUserType(),
		};

		if (!isSelfChat(dialog.dialogId))
		{
			params.p5 = `chatId_${dialog.chatId}`;
		}

		if (chatType === ChatType.comment)
		{
			const parentChat = Core.getStore().getters['chats/getByChatId'](dialog.parentChatId);
			params.p1 = `chatType_${parentChat.type}`;
			params.p4 = `parentChatId_${dialog.parentChatId}`;
		}

		if (chatType === ChatType.collab)
		{
			params.p4 = getCollabId(dialog.chatId);
		}

		if (chatType !== ChatType.copilot)
		{
			params.p3 = `isMember_${isMember}`;
		}

		if (chatType === ChatType.copilot && !this.#isBitrixGptV2Available)
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
