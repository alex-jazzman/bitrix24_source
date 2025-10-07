import { Analytics } from 'im.v2.lib.analytics';
import { Loc, Runtime } from 'main.core';
import { Outline as OutlineIcons } from 'ui.icon-set.api.core';

import { CopilotManager } from 'im.v2.lib.copilot';

import { MessageMenu } from './message-base';

import type { ImModelChat } from 'im.v2.model';
import type { MenuItemOptions, MenuSectionOptions } from 'ui.system.menu';

const CopilotChatContext = Object.freeze({
	personal: 'chat_copilot_tab_one_by_one',
	group: 'chat_copilot_tab_multi',
});

const MenuSectionCode = Object.freeze({
	main: 'main',
	select: 'select',
	create: 'create',
	market: 'market',
});

export class CopilotMessageMenu extends MessageMenu
{
	getMenuItems(): MenuItemOptions[]
	{
		const mainGroupItems = [
			this.getCopyItem(),
			this.getMarkItem(),
			this.getFavoriteItem(),
			this.getForwardItem(),
			this.getSendFeedbackItem(),
			this.getDeleteItem(),
		];

		return [
			...this.groupItems(mainGroupItems, MenuSectionCode.main),
			...this.groupItems([this.getSelectItem()], MenuSectionCode.select),
		];
	}

	getMenuGroups(): MenuSectionOptions[]
	{
		return [
			{ code: MenuSectionCode.main },
			{ code: MenuSectionCode.select },
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

				void this.openForm();
				this.menuInstance.close();
			},
		};
	}

	async openForm()
	{
		const formId = Math.round(Math.random() * 1000);

		await Runtime.loadExtension(['ui.feedback.form']);
		BX.UI.Feedback.Form.open({
			id: `im.copilot.feedback-${formId}`,
			forms: [
				{ zones: ['es'], id: 684, lang: 'es', sec: 'svvq1x' },
				{ zones: ['en'], id: 686, lang: 'en', sec: 'tjwodz' },
				{ zones: ['de'], id: 688, lang: 'de', sec: 'nrwksg' },
				{ zones: ['com.br'], id: 690, lang: 'com.br', sec: 'kpte6m' },
				{ zones: ['ru', 'by', 'kz'], id: 692, lang: 'ru', sec: 'jbujn0' },
			],
			presets: {
				sender_page: this.getCopilotChatContext(),
				language: Loc.getMessage('LANGUAGE_ID'),
				cp_answer: this.context.text,
			},
		});
	}

	getCopilotChatContext(): $Values<typeof CopilotChatContext>
	{
		const chat: ImModelChat = this.store.getters['chats/get'](this.context.dialogId);
		if (chat.userCounter <= 2)
		{
			return CopilotChatContext.personal;
		}

		return CopilotChatContext.group;
	}
}
