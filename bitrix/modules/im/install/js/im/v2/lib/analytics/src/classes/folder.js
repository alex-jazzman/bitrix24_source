import { Type } from 'main.core';
import { type AnalyticsOptions, sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';
import { type ImModelChat, type ImModelFolder } from 'im.v2.model';

import {
	AnalyticsCategory,
	AnalyticsEvent,
	AnalyticsFolderType,
	AnalyticsTool,
	AnalyticsType,
} from '../const';
import { getCategoryByChatType } from '../helpers/get-category-by-chat-type';
import { getChatType } from '../helpers/get-chat-type';
import { getFolderSection } from '../helpers/get-folder-section';
import { getFolderType } from '../helpers/get-folder-type';

type SendDataHandler = (data: AnalyticsOptions) => void;

type FolderMenuParams = {
	folderId: number,
	subSection?: string,
};

type ChatMembershipParams = {
	dialogId: string,
	subSection?: string,
};

export class Folder
{
	#sendData: SendDataHandler;

	constructor(sendDataHandler: SendDataHandler = sendData)
	{
		this.#sendData = sendDataHandler;
	}

	onClickCreateFolder(section?: string): void
	{
		const params: AnalyticsOptions = {
			event: AnalyticsEvent.clickCreateFolder,
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.folders,
		};

		if (Type.isStringFilled(section))
		{
			params.c_section = section;
		}

		this.#sendData(params);
	}

	onClickEdit({ folderId, subSection }: FolderMenuParams): void
	{
		const params: AnalyticsOptions = {
			event: AnalyticsEvent.clickEdit,
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.folders,
			type: this.#getCompositionType(folderId),
		};

		if (Type.isStringFilled(subSection))
		{
			params.c_sub_section = subSection;
		}

		this.#sendData(params);
	}

	onClickDelete({ folderId, subSection }: FolderMenuParams): void
	{
		this.#sendData({
			event: AnalyticsEvent.clickDelete,
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.folders,
			type: this.#getEmptinessType(folderId),
			c_sub_section: subSection,
		});
	}

	onOpenList(subSection?: string): void
	{
		const params: AnalyticsOptions = {
			event: AnalyticsEvent.openList,
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.folders,
		};

		if (Type.isStringFilled(subSection))
		{
			params.c_sub_section = subSection;
		}

		this.#sendData(params);
	}

	// A folder with no type of its own sends nothing at all: the rule lives here rather than in the
	// caller, so every future entry point into the event gets it for free.
	onOpenFolder(folder: ImModelFolder): void
	{
		const type = getFolderType(folder);
		if (!Type.isStringFilled(type))
		{
			return;
		}

		this.#sendData({
			event: AnalyticsEvent.openFolder,
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.folders,
			type,
		});
	}

	onAddToFolder(params: ChatMembershipParams): void
	{
		this.#sendChatMembershipEvent(AnalyticsEvent.addToFolder, params);
	}

	onDeleteFromFolder(params: ChatMembershipParams): void
	{
		this.#sendChatMembershipEvent(AnalyticsEvent.deleteFromFolder, params);
	}

	// Both halves of one membership change answer the same question - which chat moved and where the
	// user was - so they share the payload. The surface is left out where the label table has no value
	// for it: the composition form of a folder is one, and a lost slot is better than an invented value.
	#sendChatMembershipEvent(event: string, { dialogId, subSection }: ChatMembershipParams): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);

		const params: AnalyticsOptions = {
			event,
			tool: AnalyticsTool.im,
			category: getCategoryByChatType(chat.type),
			c_section: this.#getSection(),
			p1: `chatType_${getChatType(chat)}`,
		};

		if (Type.isStringFilled(subSection))
		{
			params.c_sub_section = subSection;
		}

		this.#sendData(params);
	}

	onChatLimitException(): void
	{
		this.#sendData({
			event: AnalyticsEvent.chatLimitException,
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.folders,
		});
	}

	onFolderLimitException(): void
	{
		this.#sendData({
			event: AnalyticsEvent.folderLimitException,
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.folders,
		});
	}

	// the composite folder is the "All" folder, every other folder of these menus is a personal one
	#getCompositionType(folderId: number): $Values<typeof AnalyticsFolderType>
	{
		const isComposite = Core.getStore().getters['recent/folders/isComposite'](folderId);

		return isComposite ? AnalyticsFolderType.all : AnalyticsFolderType.userFolder;
	}

	#getEmptinessType(folderId: number): $Values<typeof AnalyticsType>
	{
		const folder: ImModelFolder = Core.getStore().getters['recent/folders/getById'](folderId);

		return Type.isArrayFilled(folder?.definition?.chats) ? AnalyticsType.nonEmpty : AnalyticsType.empty;
	}

	#getSection(): string
	{
		const layoutName = Core.getStore().getters['application/getLayout'].name;

		return getFolderSection(layoutName);
	}
}
