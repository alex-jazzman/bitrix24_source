import { Loc } from 'main.core';
import { Outline as OutlineIcons } from 'ui.icon-set.api.core';

import { Core } from 'im.v2.application.core';
import { FeedbackManager } from 'im.v2.lib.feedback';

import { MessageMenu, MenuSectionCode, NestedMenuSectionCode } from './message-base';

import type { MenuItemOptions, MenuSectionOptions } from 'ui.system.menu';

export class AiAssistantMessageMenu extends MessageMenu
{
	getMenuItems(): MenuItemOptions[]
	{
		const firstGroupItems = [
			this.getCopyItem(),
			this.getDownloadFileItem(),
			this.getForwardItem(),
			this.getCreateTaskItem(),
			...this.getAdditionalItems(),
		];

		return this.groupItems(firstGroupItems, MenuSectionCode.first);
	}

	getNestedItems(): MenuItemOptions[]
	{
		const firstGroupItems = [
			this.getCopyFileItem(),
			this.getMarkItem(),
			this.getFavoriteItem(),
			this.getSaveToDiskItem(),
			this.getCreateMeetingItem(),
		];

		return [
			...this.groupItems(firstGroupItems, NestedMenuSectionCode.first),
			...this.groupItems([this.getSendFeedbackItem()], NestedMenuSectionCode.second),
			...this.groupItems(this.getMarketItems(), NestedMenuSectionCode.third),
		];
	}

	getNestedMenuGroups(): MenuSectionOptions[]
	{
		return [
			{ code: NestedMenuSectionCode.first },
			{ code: NestedMenuSectionCode.second },
			{ code: NestedMenuSectionCode.third },
		];
	}

	getSendFeedbackItem(): MenuItemOptions
	{
		const isAiAssistantBot = Core.getStore().getters['users/bots/isAiAssistant'](this.context.authorId);

		if (!isAiAssistantBot)
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_LIB_MENU_AI_ASSISTANT_FEEDBACK'),
			icon: OutlineIcons.FEEDBACK,
			onClick: () => {
				void (new FeedbackManager()).openAiAssistantForm({});
				this.menuInstance.close();
			},
		};
	}
}
