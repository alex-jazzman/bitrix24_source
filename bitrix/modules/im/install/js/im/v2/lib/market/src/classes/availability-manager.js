import { ChatType, type ChatTypeItem } from 'im.v2.const';
import { type ImModelMarketApplication } from 'im.v2.model';

const MarketTypes = Object.freeze({
	user: 'user',
	chat: 'chat',
	lines: 'lines',
	crm: 'crm',
	all: 'all',
});

export class AvailabilityManager
{
	getAvailablePlacements(placements: ImModelMarketApplication[], dialogType: string = ''): ImModelMarketApplication[]
	{
		return placements.filter((placement) => this.#canShowPlacementInChat(placement, dialogType));
	}

	#canShowPlacementInChat(placement: ImModelMarketApplication, dialogType: string): boolean
	{
		if (!placement.options.context || !dialogType)
		{
			return true;
		}

		return placement.options.context.some((marketType) => this.#matchDialogType(marketType, dialogType));
	}

	#matchDialogType(marketType: string, dialogType: ChatTypeItem): boolean
	{
		switch (marketType)
		{
			case MarketTypes.user:
				return this.#isUser(dialogType);
			case MarketTypes.chat:
				return this.#isChat(dialogType);
			case MarketTypes.lines:
				return this.#isLines(dialogType);
			case MarketTypes.crm:
				return this.#isCrm(dialogType);
			case MarketTypes.all:
				return true;
			default:
				return false;
		}
	}

	#isUser(dialogType: ChatTypeItem): boolean
	{
		return dialogType === ChatType.user;
	}

	#isChat(dialogType: ChatTypeItem): boolean
	{
		return dialogType !== ChatType.lines && dialogType !== ChatType.crm && dialogType !== ChatType.user;
	}

	#isLines(dialogType: ChatTypeItem): boolean
	{
		return dialogType === ChatType.lines;
	}

	#isCrm(dialogType: ChatTypeItem): boolean
	{
		return dialogType === ChatType.crm;
	}
}
