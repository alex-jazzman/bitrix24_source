import { Text } from 'main.core';
import { sendData } from 'ui.analytics';

import { ChatType, Layout, UserRole } from 'im.v2.const';
import { Core } from 'im.v2.application.core';

import { AnalyticsEvent, AnalyticsTool, AnalyticsCategory } from './const';

import { getCollabId } from './helpers/get-collab-id';
import { getUserType } from './helpers/get-user-type';
import { getCategoryByChatType } from './helpers/get-category-by-chat-type';
import { getChatType } from './helpers/get-chat-type';

import { MessageFiles } from './classes/message-files';
import { CollabEntities } from './classes/collab-entities';
import { ChatEntities } from './classes/chat-entities';
import { ChatDelete } from './classes/chat-delete';
import { MessageDelete } from './classes/message-delete';
import { HistoryLimit } from './classes/history-limit';
import { UserAdd } from './classes/user-add';
import { ChatEdit } from './classes/chat-edit';
import { ChatCreate } from './classes/chat-create';
import { Supervisor } from './classes/supervisor';
import { CheckIn } from './classes/check-in';
import { Copilot } from './classes/copilot';
import { AttachMenu } from './classes/attach-menu';
import { Vote } from './classes/vote-create';
import { MessagePins } from './classes/message-pins';
import { MessageForward } from './classes/message-forward';
import { DesktopUpdateBanner } from './classes/desktop-update-banner';
import { SliderInvite } from './classes/slider-invite';

import type { ImModelChat } from 'im.v2.model';

type DialogId = string;

export { CreateChatContext } from './const';
export { getCollabId } from './helpers/get-collab-id';
export { getUserType } from './helpers/get-user-type';

const PseudoChatTypeForNotes = 'notes';

export class Analytics
{
	#excludedChats: Set<DialogId> = new Set();
	#chatsWithTyping: Set<DialogId> = new Set();
	#currentTab: string = Layout.chat.name;

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
	messageFiles: MessageFiles = new MessageFiles();
	vote: Vote = new Vote();
	messagePins: MessagePins = new MessagePins();
	messageForward: MessageForward = new MessageForward();
	desktopUpdateBanner: DesktopUpdateBanner = new DesktopUpdateBanner();
	sliderInvite: SliderInvite = new SliderInvite();

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
		this.#excludedChats.add(dialogId);
	}

	onOpenMessenger()
	{
		sendData({
			event: AnalyticsEvent.openMessenger,
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.messenger,
		});
	}

	onOpenTab(tabName: string)
	{
		const existingTabs = [
			Layout.chat.name,
			Layout.copilot.name,
			Layout.collab.name,
			Layout.channel.name,
			Layout.notification.name,
			Layout.settings.name,
			Layout.openlines.name,
		];

		if (!existingTabs.includes(tabName))
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

	#isNotes(dialog: ImModelChat): boolean
	{
		return Number.parseInt(dialog.dialogId, 10) === Core.getUserId();
	}

	onOpenChat(dialog: ImModelChat)
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

		const currentLayout = Core.getStore().getters['application/getLayout'].name;
		const isMember = dialog.role === UserRole.guest ? 'N' : 'Y';

		const params = {
			tool: AnalyticsTool.im,
			category: getCategoryByChatType(chatType),
			event: AnalyticsEvent.openExisting,
			type: this.#isNotes(dialog) ? PseudoChatTypeForNotes : chatType,
			c_section: `${currentLayout}_tab`,
			p2: getUserType(),
		};

		if (!this.#isNotes(dialog))
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

		if (chatType === ChatType.copilot)
		{
			const role = Core.getStore().getters['copilot/chats/getRole'](dialog.dialogId);
			params.p4 = `role_${Text.toCamelCase(role.code)}`;
		}

		sendData(params);
	}

	onPinChat(dialog: ImModelChat)
	{
		if (!this.#isNotes(dialog))
		{
			return;
		}

		const chatType = getChatType(dialog);

		const params = {
			tool: AnalyticsTool.im,
			category: getCategoryByChatType(chatType),
			event: AnalyticsEvent.pinChat,
			p1: `chatType_${this.#isNotes(dialog) ? PseudoChatTypeForNotes : chatType}`,
		};

		sendData(params);
	}

	onTypeMessage(dialog: ImModelChat)
	{
		if (!this.#isNotes(dialog) || this.#chatsWithTyping.has(dialog.dialogId))
		{
			return;
		}

		this.#chatsWithTyping.add(dialog.dialogId);

		const chatType = getChatType(dialog);

		const params = {
			tool: AnalyticsTool.im,
			category: getCategoryByChatType(chatType),
			event: AnalyticsEvent.typeMessage,
			p1: `chatType_${this.#isNotes(dialog) ? PseudoChatTypeForNotes : chatType}`,
		};

		sendData(params);
	}
}
