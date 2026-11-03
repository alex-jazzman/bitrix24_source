import { Text, type JsonObject } from 'main.core';
import { sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';
import { ChatType, FileType } from 'im.v2.const';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { MessageComponentManager } from 'im.v2.lib.message-component';
import { type ImModelChat, type ImModelFile, type ImModelMessage } from 'im.v2.model';

import {
	AnalyticsCategory,
	AnalyticsElement,
	AnalyticsEvent,
	AnalyticsSection,
	AnalyticsSubSection,
	AnalyticsTool,
} from '../const';
import { getCategoryByChat } from '../helpers/get-category-by-chat-type';
import { getChatType } from '../helpers/get-chat-type';
import { getProjectId } from '../helpers/get-collab-id.js';
import { getFolderSection } from '../helpers/get-folder-section';
import { getLayoutName } from '../helpers/get-layout-name';
import { getUserType } from '../helpers/get-user-type.js';
import { MessageForward } from './message-forward';
import { MessagePins } from './message-pins';

type MenuPlacementOptions = { isInNestedMenu?: boolean };

const AnalyticsAmountFilesType = {
	single: 'files_single',
	many: 'files_all',
};

const AnalyticsFileType = {
	...FileType,
	media: 'media',
	any: 'any',
};

export class MessageContextMenu
{
	messageForward: MessageForward = new MessageForward();
	messagePins: MessagePins = new MessagePins();
	#isBitrixGptV2Available = FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available);

	onSendFeedback(dialogId: string): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);
		const role = Core.getStore().getters['copilot/chats/getRole'](dialogId);
		const aiModel = Core.getStore().getters['copilot/chats/getAIModel'](dialogId);
		const aiModelName = aiModel.name ?? aiModel;

		const currentLayout = getLayoutName(Core.getStore().getters['application/getLayout'].name);
		const isMiniChat = Core.getStore().getters['copilot/isChatOpenedInWidget'](dialogId);
		const cSectionValue = isMiniChat ? AnalyticsSection.miniChat : getFolderSection(currentLayout);

		const params = {
			category: getCategoryByChat(chat),
			event: AnalyticsEvent.addFeedback,
			c_section: cSectionValue,
			...this.#getBaseParams(dialogId),
		};

		if (!this.#isBitrixGptV2Available)
		{
			params.p2 = `provider_${aiModelName}`;
		}

		if (params.category !== AnalyticsCategory.collab && !this.#isBitrixGptV2Available)
		{
			params.p4 = `role_${Text.toCamelCase(role.code)}`;
		}

		sendData(params);
	}

	onDelete({ messageId, dialogId }: {messageId: string | number, dialogId: string}): void
	{
		const message: ImModelMessage = Core.getStore().getters['messages/getById'](messageId);
		const type = new MessageComponentManager(message).getName();

		sendData({
			category: AnalyticsCategory.message,
			event: AnalyticsEvent.clickDelete,
			type,
			c_section: AnalyticsSection.chatWindow,
			...this.#getBaseParams(dialogId),
		});
	}

	onCancelDelete({ messageId, dialogId }: {messageId: string | number, dialogId: string}): void
	{
		const message: ImModelMessage = Core.getStore().getters['messages/getById'](messageId);
		const type = new MessageComponentManager(message).getName();

		sendData({
			category: AnalyticsCategory.message,
			event: AnalyticsEvent.cancelDelete,
			type,
			c_section: AnalyticsSection.popup,
			...this.#getBaseParams(dialogId),
		});
	}

	onFileDownload({ messageId, dialogId }: {messageId: string | number, dialogId: string}): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);

		const params = {
			category: getCategoryByChat(chat),
			event: AnalyticsEvent.downloadFile,
			type: this.#getAnalyticsFileType(messageId),
			c_section: AnalyticsSection.chatWindow,
			p2: getUserType(),
			p3: this.#getFilesAmountParam(messageId),
			p5: `chatId_${chat.chatId}`,
			...this.#getBaseParams(dialogId),
		};

		if (params.category === AnalyticsCategory.collab)
		{
			const projectId = getProjectId(chat);
			if (projectId)
			{
				params.p4 = projectId;
			}
		}

		sendData(params);
	}

	onSaveOnDisk({ messageId, dialogId }: {messageId: string | number, dialogId: string}): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);

		const params = {
			category: getCategoryByChat(chat),
			event: AnalyticsEvent.saveToDisk,
			type: this.#getAnalyticsFileType(messageId),
			c_section: AnalyticsSection.chatWindow,
			c_element: AnalyticsElement.more,
			p2: getUserType(),
			p3: this.#getFilesAmountParam(messageId),
			p5: `chatId_${chat.chatId}`,
			...this.#getBaseParams(dialogId),
		};

		if (params.category === AnalyticsCategory.collab)
		{
			const projectId = getProjectId(chat);
			if (projectId)
			{
				params.p4 = projectId;
			}
		}

		sendData(params);
	}

	onCopyLink(dialogId: string): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);

		const params = {
			category: getCategoryByChat(chat),
			event: AnalyticsEvent.copyLink,
			c_section: AnalyticsSection.chatWindow,
			c_element: AnalyticsElement.more,
			...this.#getBaseParams(dialogId),
		};

		sendData(params);
	}

	onCopyFile({ dialogId, fileId }: {dialogId: string, fileId: string | number}): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);
		const file: ImModelFile = Core.getStore().getters['files/get'](fileId);

		const params = {
			category: getCategoryByChat(chat),
			event: AnalyticsEvent.copyFile,
			type: file.type,
			c_section: AnalyticsSection.chatWindow,
			c_element: AnalyticsElement.more,
			...this.#getBaseParams(dialogId),
		};

		sendData(params);
	}

	onEdit(dialogId: string): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);

		const params = {
			category: getCategoryByChat(chat),
			event: AnalyticsEvent.clickEdit,
			c_section: AnalyticsSection.chatWindow,
			...this.#getBaseParams(dialogId),
		};

		sendData(params);
	}

	onCreateTask(dialogId: string, { isInNestedMenu = false }: MenuPlacementOptions = {}): void
	{
		this.#sendTaskCreationEvent(dialogId, AnalyticsEvent.clickCreateTask, isInNestedMenu);
	}

	onCreateAiTask(dialogId: string, { isInNestedMenu = false }: MenuPlacementOptions = {}): void
	{
		this.#sendTaskCreationEvent(dialogId, AnalyticsEvent.clickCreateAiTask, isInNestedMenu);
	}

	#sendTaskCreationEvent(dialogId: string, event: string, isInNestedMenu: boolean): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);

		const params = {
			category: getCategoryByChat(chat),
			event,
			c_section: AnalyticsSection.chatWindow,
			p2: getUserType(),
			...this.#getBaseParams(dialogId),
		};

		if (isInNestedMenu)
		{
			params.c_element = AnalyticsElement.more;
		}

		sendData(params);
	}

	onSelect(dialogId: string): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);

		const params = {
			category: getCategoryByChat(chat),
			event: AnalyticsEvent.select,
			c_section: AnalyticsSection.chatWindow,
			...this.#getBaseParams(dialogId),
		};

		sendData(params);
	}

	onMark(dialogId: string): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);

		const params = {
			category: getCategoryByChat(chat),
			event: AnalyticsEvent.seeLater,
			c_section: AnalyticsSection.chatWindow,
			c_element: AnalyticsElement.more,
			...this.#getBaseParams(dialogId),
		};

		sendData(params);
	}

	onReply(dialogId: string): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);

		const params = {
			category: getCategoryByChat(chat),
			event: AnalyticsEvent.clickReply,
			c_section: AnalyticsSection.chatWindow,
			...this.#getBaseParams(dialogId),
		};

		sendData(params);
	}

	onAddFavorite({ dialogId, messageId }: {dialogId: string, messageId: string | number}): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);
		const message: ImModelMessage = Core.getStore().getters['messages/getById'](messageId);
		const type = new MessageComponentManager(message).getName();

		const params = {
			category: getCategoryByChat(chat),
			event: AnalyticsEvent.addToFav,
			type,
			c_section: AnalyticsSection.chatWindow,
			c_element: AnalyticsElement.more,
			...this.#getBaseParams(dialogId),
		};

		sendData(params);
	}

	onCreateEvent(dialogId: string): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);

		const params = {
			category: getCategoryByChat(chat),
			event: AnalyticsEvent.clickCreateEvent,
			c_section: AnalyticsSection.chatWindow,
			c_element: AnalyticsElement.more,
			p2: getUserType(),
			...this.#getBaseParams(dialogId),
		};

		sendData(params);
	}

	onCopyText({ dialogId, messageId }: {dialogId: string, messageId: string | number}): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);
		const message: ImModelMessage = Core.getStore().getters['messages/getById'](messageId);
		const type = new MessageComponentManager(message).getName();

		if (chat.type === ChatType.copilot)
		{
			this.#onCopyTextCopilot({
				dialogId,
				messageId,
			});

			return;
		}

		const params = {
			category: getCategoryByChat(chat),
			event: AnalyticsEvent.copyMessage,
			type,
			c_section: AnalyticsSection.chatWindow,
			...this.#getBaseParams(dialogId),
		};

		sendData(params);
	}

	onPin(dialogId: string): void
	{
		this.messagePins.onSendData({
			dialogId,
			eventParams: {
				event: AnalyticsEvent.pinMessage,
				c_section: AnalyticsSection.chatWindow,
			},
		});
	}

	onReachingPinsLimit(dialogId: string): void
	{
		this.messagePins.onSendData({
			dialogId,
			eventParams: {
				event: AnalyticsEvent.pinnedMessageLimitException,
				c_section: AnalyticsSection.chatWindow,
			},
		});
	}

	onUnpin(dialogId: string): void
	{
		this.messagePins.onUnpin({
			dialogId,
			eventParams: {
				c_section: AnalyticsSection.chatWindow,
			},
		});
	}

	onForward(dialogId: string): void
	{
		this.messageForward.onClickForward(dialogId);
	}

	onAskCopilot(dialogId: string): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);

		const params = {
			category: getCategoryByChat(chat),
			event: AnalyticsEvent.askCopilot,
			c_section: AnalyticsSection.chatWindow,
			...this.#getBaseParams(dialogId),
		};

		sendData(params);
	}

	#onCopyTextCopilot({ dialogId, messageId }: {dialogId: string, messageId: string | number}): void
	{
		const aiModel = Core.getStore().getters['copilot/chats/getAIModel'](dialogId);
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);
		const message: ImModelMessage = Core.getStore().getters['messages/getById'](messageId);
		const role = Core.getStore().getters['copilot/chats/getRole'](dialogId);
		const type = new MessageComponentManager(message).getName();
		const aiModelName = aiModel.name ?? aiModel;
		const isMiniChat = Core.getStore().getters['copilot/isChatOpenedInWidget'](dialogId);
		const currentLayout = getLayoutName(Core.getStore().getters['application/getLayout'].name);
		const cSectionValue = isMiniChat ? AnalyticsSection.miniChat : getFolderSection(currentLayout);

		const params = {
			category: getCategoryByChat(chat),
			event: AnalyticsEvent.copyMessage,
			type,
			c_section: cSectionValue,
			p5: `chatId_${chat.chatId}`,
			...this.#getBaseParams(dialogId),
		};

		if (!this.#isBitrixGptV2Available)
		{
			params.p2 = `provider_${aiModelName}`;
		}

		if (params.category !== AnalyticsCategory.collab && !this.#isBitrixGptV2Available)
		{
			params.p4 = `role_${Text.toCamelCase(role.code)}`;
		}

		sendData(params);
	}

	#getFilesAmountParam(messageId: string | number): string
	{
		const message: ImModelMessage = Core.getStore().getters['messages/getById'](messageId);
		if (message.files.length === 1)
		{
			return AnalyticsAmountFilesType.single;
		}

		return AnalyticsAmountFilesType.many;
	}

	#getAnalyticsFileType(messageId: string | number): $Values<typeof AnalyticsFileType>
	{
		const message: ImModelMessage = Core.getStore().getters['messages/getById'](messageId);
		const fileTypes = message.files.map((fileId) => {
			return Core.getStore().getters['files/get'](fileId).type;
		});

		const uniqueTypes = [...new Set(fileTypes)];

		if (uniqueTypes.length === 1)
		{
			return uniqueTypes[0];
		}

		if (uniqueTypes.length === 2 && uniqueTypes.includes(FileType.image) && uniqueTypes.includes(FileType.video))
		{
			return AnalyticsFileType.media;
		}

		return AnalyticsFileType.any;
	}

	#getBaseParams(dialogId: string): JsonObject
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);

		return {
			tool: AnalyticsTool.im,
			c_sub_section: AnalyticsSubSection.contextMenu,
			p1: `chatType_${getChatType(chat)}`,
		};
	}
}
