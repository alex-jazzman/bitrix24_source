import { Loc } from 'main.core';
import { Outline as OutlineIcons } from 'ui.icon-set.api.core';

import { Analytics } from 'im.v2.lib.analytics';
import { CopilotManager } from 'im.v2.lib.copilot';
import { FeedbackManager } from 'im.v2.lib.feedback';

import { MessageMenu, MenuSectionCode } from './message-base';

import type { ImModelChat } from 'im.v2.model';
import type { MenuItemOptions } from 'ui.system.menu';

export class CopilotMessageMenu extends MessageMenu
{
	getMenuItems(): MenuItemOptions[]
	{
		const firstGroupItems = [
			this.getCopyItem(),
			this.getMarkItem(),
			this.getFavoriteItem(),
			this.getForwardItem(),
			this.getSendFeedbackItem(),
		];

		const secondGroupItems = [
			this.getDeleteItem(),
			this.getSelectItem(),
		];

		return [
			...this.groupItems(firstGroupItems, MenuSectionCode.first),
			...this.groupItems(secondGroupItems, MenuSectionCode.second),
		];
	}

	getSendFeedbackItem(): MenuItemOptions
	{
		const copilotManager = new CopilotManager();
		if (!copilotManager.isCopilotBot(this.context.authorId))
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_LIB_MENU_AI_ASSISTANT_FEEDBACK'),
			icon: OutlineIcons.FEEDBACK,
			onClick: () => {
				Analytics.getInstance().messageContextMenu.onSendFeedback(this.context.dialogId);

				void this.#openForm();
				this.menuInstance.close();
			},
		};
	}

	async #openForm()
	{
		void (new FeedbackManager()).openCopilotForm({
			userCounter: this.#getUserCounter(),
			text: this.context.text,
		});
	}

	#getUserCounter(): number
	{
		const chat: ImModelChat = this.store.getters['chats/get'](this.context.dialogId);

		return chat.userCounter;
	}
}
