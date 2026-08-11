import { Loc } from 'main.core';
import { Outline as OutlineIcons } from 'ui.icon-set.api.core';
import { Menu, type MenuItemOptions, type MenuSectionOptions } from 'ui.system.menu';

import { Messenger } from 'im.public';
import { Core } from 'im.v2.application.core';
import { type ImModelChat } from 'im.v2.model';

import { StatusGroup } from 'imopenlines.v2.const';
import { type ImolModelCrm, type ImolModelSession } from 'imopenlines.v2.model';
import { CrmService, FinishService, InterceptService, PinService } from 'imopenlines.v2.provider.service';
import { QuickReplyManager } from 'imopenlines.v2.lib.quick-reply';

import './css/header-menu.css';

const MenuSectionCode = {
	spam: 'spam',
};

type HeaderMenuContext = {
	dialogId: string,
	isQueueTypeAll: boolean,
};

export class OpenLinesHeaderMenu
{
	menu: ?Menu;
	#context: HeaderMenuContext;

	openMenu(context: HeaderMenuContext, bindElement: HTMLElement): void
	{
		this.#context = context;

		if (this.menu)
		{
			this.menu.destroy();
			this.menu = null;
		}

		this.menu = new Menu({
			id: 'imol-header-menu',
			className: 'openlines-header-menu',
			items: this.#getMenuItems(),
			sections: this.#getMenuSections(),
			closeOnItemClick: true,
			autoHide: true,
		});

		this.menu.show(bindElement);
	}

	destroy(): void
	{
		if (this.menu)
		{
			this.menu.destroy();
			this.menu = null;
		}
	}

	#getMenuItems(): MenuItemOptions[]
	{
		return [
			this.#getPinItem(),
			this.#getInterceptItem(),
			this.#getSaveToCrmItem(),
			this.#getOpenLeadItem(),
			this.#getOpenContactItem(),
			this.#getOpenCompanyItem(),
			this.#getOpenDealItem(),
			this.#getHistoryItem(),
			this.#getMarkSpamItem(),
		];
	}

	#getMenuSections(): MenuSectionOptions[]
	{
		return [
			{ code: MenuSectionCode.spam },
		];
	}

	#getPinItem(): ?MenuItemOptions
	{
		const session = this.#getSession();
		if (!session || session.isClosed)
		{
			return null;
		}

		if (!this.#isOwner())
		{
			return null;
		}

		const isPinned = session.pinned;

		return {
			title: isPinned
				? Loc.getMessage('IMOL_CONTENT_HEADER_BUTTON_UNPIN')
				: Loc.getMessage('IMOL_CONTENT_HEADER_BUTTON_PIN'),
			icon: isPinned ? OutlineIcons.UNPIN : OutlineIcons.PIN,
			onClick: () => {
				const pinService = new PinService();
				if (isPinned)
				{
					void pinService.unpinChat(this.#context.dialogId);
				}
				else
				{
					void pinService.pinChat(this.#context.dialogId);
				}
			},
		};
	}

	#getInterceptItem(): ?MenuItemOptions
	{
		const session = this.#getSession();
		if (!session || session.isClosed)
		{
			return null;
		}

		if (!this.#hasAnotherOwner())
		{
			return null;
		}

		return {
			title: Loc.getMessage('IMOL_CONTENT_HEADER_BUTTON_INTERCEPT'),
			icon: OutlineIcons.ADD_PERSON,
			onClick: () => {
				void (new InterceptService()).interceptDialog(this.#context.dialogId).then(() => {
					QuickReplyManager.getInstance().resetCache(this.#context.dialogId);
				});
			},
		};
	}

	#getSaveToCrmItem(): ?MenuItemOptions
	{
		if (!this.#isOwner())
		{
			return null;
		}

		const crm = this.#getCrm();
		if (!crm || crm.crmEnabled)
		{
			return null;
		}

		return {
			title: Loc.getMessage('IMOL_CONTENT_HEADER_BUTTON_SAVE_CRM'),
			icon: OutlineIcons.CRM,
			onClick: () => {
				void (new CrmService()).saveToCrm(this.#context.dialogId);
			},
		};
	}

	#getOpenLeadItem(): ?MenuItemOptions
	{
		const crm = this.#getCrm();
		if (!crm || !crm.leadId)
		{
			return null;
		}

		return {
			title: Loc.getMessage('IMOL_CONTENT_HEADER_BUTTON_OPEN_LEAD'),
			icon: OutlineIcons.LEAD,
			onClick: () => {
				BX.SidePanel.Instance.open(`/crm/lead/details/${crm.leadId}/`);
			},
		};
	}

	#getOpenContactItem(): ?MenuItemOptions
	{
		const crm = this.#getCrm();
		if (!crm || !crm.contactId)
		{
			return null;
		}

		return {
			title: Loc.getMessage('IMOL_CONTENT_HEADER_BUTTON_OPEN_CONTACT'),
			icon: OutlineIcons.PERSON,
			onClick: () => {
				BX.SidePanel.Instance.open(`/crm/contact/details/${crm.contactId}/`);
			},
		};
	}

	#getOpenCompanyItem(): ?MenuItemOptions
	{
		const crm = this.#getCrm();
		if (!crm || !crm.companyId)
		{
			return null;
		}

		return {
			title: Loc.getMessage('IMOL_CONTENT_HEADER_BUTTON_OPEN_COMPANY'),
			icon: OutlineIcons.COMPANY,
			onClick: () => {
				BX.SidePanel.Instance.open(`/crm/company/details/${crm.companyId}/`);
			},
		};
	}

	#getOpenDealItem(): ?MenuItemOptions
	{
		const crm = this.#getCrm();
		if (!crm || !crm.dealId)
		{
			return null;
		}

		return {
			title: Loc.getMessage('IMOL_CONTENT_HEADER_BUTTON_OPEN_DEAL'),
			icon: OutlineIcons.HANDSHAKE,
			onClick: () => {
				BX.SidePanel.Instance.open(`/crm/deal/details/${crm.dealId}/`);
			},
		};
	}

	#getHistoryItem(): ?MenuItemOptions
	{
		const session = this.#getSession();
		if (!session || !session.id)
		{
			return null;
		}

		return {
			title: Loc.getMessage('IMOL_CONTENT_HEADER_BUTTON_HISTORY'),
			icon: OutlineIcons.CLOCK_BACK,
			onClick: () => {
				void Messenger.openLinesHistory(`imol|${session.id}`);
			},
		};
	}

	#getMarkSpamItem(): ?MenuItemOptions
	{
		const session = this.#getSession();
		if (!session || session.isClosed)
		{
			return null;
		}

		const isOperator = Core.getUserId() === session.operatorId;
		const isNewSession = session.status === StatusGroup.new;
		if (!isOperator && !isNewSession)
		{
			return null;
		}

		if (!isOperator && !this.#context.isQueueTypeAll)
		{
			return null;
		}

		return {
			title: Loc.getMessage('IMOL_CONTENT_HEADER_BUTTON_SPAM'),
			icon: OutlineIcons.STOP_HAND,
			sectionCode: MenuSectionCode.spam,
			onClick: () => {
				void (new FinishService()).markSpamChat(this.#context.dialogId);
			},
		};
	}

	#getDialog(): ?ImModelChat
	{
		return Core.getStore().getters['chats/get'](this.#context.dialogId, true);
	}

	#getSession(): ?ImolModelSession
	{
		const dialog = this.#getDialog();
		if (!dialog)
		{
			return null;
		}

		return Core.getStore().getters['openLines/sessions/getByChatId'](dialog.chatId, true);
	}

	#getCrm(): ?ImolModelCrm
	{
		return Core.getStore().getters['openLines/crm/getByDialogId'](this.#context.dialogId, true);
	}

	#isOwner(): boolean
	{
		const userId = Core.getUserId();

		if (this.#getDialog()?.ownerId === userId)
		{
			return true;
		}

		return this.#getSession()?.operatorId === userId;
	}

	#hasAnotherOwner(): boolean
	{
		const userId = Core.getUserId();
		const ownerId = this.#getDialog()?.ownerId ?? 0;

		if (ownerId > 0 && ownerId !== userId)
		{
			return true;
		}

		// The dialog is held by a chat-bot (no human owner) — allow taking it over from the bot.
		const session = this.#getSession();

		return Boolean(session?.operatorIsBot) && session.operatorId > 0 && session.operatorId !== userId;
	}
}
