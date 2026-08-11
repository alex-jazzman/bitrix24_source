import { Core } from 'im.v2.application.core';
import { ChatType, PlacementType, SidebarMainPanelBlock, type SidebarMainPanelBlockType } from 'im.v2.const';
import { ChannelManager } from 'im.v2.lib.channel';
import { Feature, FeatureManager, TariffManager } from 'im.v2.lib.feature';
import { MarketManager } from 'im.v2.lib.market';

import { type ImModelChat } from 'im.v2.model';

export class BlockFilter
{
	#dialogId: string;
	#chat: ImModelChat;
	#blocks: SidebarMainPanelBlockType[];

	constructor(dialogId: string, blocks: SidebarMainPanelBlockType[])
	{
		this.#dialogId = dialogId;
		this.#chat = Core.getStore().getters['chats/get'](dialogId, true);
		this.#blocks = blocks;
	}

	run(): SidebarMainPanelBlockType[]
	{
		const blocksSet = new Set(this.#blocks);

		if (this.#isFileMigrationFinished())
		{
			blocksSet.delete(SidebarMainPanelBlock.fileUnsortedList);
		}
		else
		{
			blocksSet.delete(SidebarMainPanelBlock.fileList);
		}

		if (!this.#hasMarketApps())
		{
			blocksSet.delete(SidebarMainPanelBlock.marketAppList);
		}

		if (!this.#hasHistoryLimit())
		{
			blocksSet.delete(SidebarMainPanelBlock.tariffLimit);
		}

		if (this.#isGuest())
		{
			blocksSet.delete(SidebarMainPanelBlock.taskList);
			blocksSet.delete(SidebarMainPanelBlock.meetingList);
		}

		return [...blocksSet];
	}

	#isFileMigrationFinished(): boolean
	{
		return FeatureManager.isFeatureAvailable(Feature.sidebarFiles);
	}

	#hasMarketApps(): boolean
	{
		return MarketManager.getInstance().getAvailablePlacementsByType(PlacementType.sidebar, this.#dialogId).length > 0;
	}

	#hasHistoryLimit(): boolean
	{
		const isChannelCommentsChat = ChatType.comment === this.#chat.type;
		const isChannelChat = ChannelManager.isChannel(this.#dialogId);

		if (isChannelChat || isChannelCommentsChat || TariffManager.chatHistory.isAvailable())
		{
			return false;
		}

		return Core.getStore().getters['sidebar/hasHistoryLimit'](this.#chat.chatId);
	}

	#isGuest(): boolean
	{
		return Core.getStore().getters['users/isGuest'](Core.getUserId());
	}
}
