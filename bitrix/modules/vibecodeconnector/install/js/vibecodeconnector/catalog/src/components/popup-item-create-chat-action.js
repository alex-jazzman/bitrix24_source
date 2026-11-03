import { ajax, Loc, Tag, Text } from 'main.core';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { Center as NotificationCenter } from 'ui.notification';
import { Dialog } from 'ui.system.dialog';

import { type CatalogItem } from '../tab-controller';
import { openCatalogChat } from '../utils/links';

const CREATE_CHAT_ACTION = 'vibecodeconnector.Catalog.createChat';

type CatalogPopupItemCreateChatActionOptions = {
	onChatOpen?: () => void,
};

type CatalogPopupItemCreateChatMenuItem = {
	title: string,
	onClick: () => void,
	dataset: { [string]: string },
};

export class CatalogPopupItemCreateChatAction
{
	#item: CatalogItem;
	#onChatOpen: (() => void) | null;
	#creating: boolean = false;

	constructor(item: CatalogItem, options: CatalogPopupItemCreateChatActionOptions = {})
	{
		this.#item = item;
		this.#onChatOpen = options.onChatOpen ?? null;
	}

	canCreateChat(): boolean
	{
		return this.#item.appChatCreatable === true;
	}

	getMenuItem(): ?CatalogPopupItemCreateChatMenuItem
	{
		if (!this.canCreateChat())
		{
			return null;
		}

		return {
			title: Loc.getMessage('VIBECODECONNECTOR_CATALOG_MENU_CREATE_APP_CHAT'),
			onClick: () => this.#confirmCreate(),
			dataset: { testid: 'vibecode-catalog-item-create-chat' },
		};
	}

	#confirmCreate(): void
	{
		const content = Tag.render`
			<div class="vibecode-catalog__delete-dialog ui-text --sm" data-testid="vibecode-catalog-create-chat-dialog">
				${Loc.getMessage('VIBECODECONNECTOR_CATALOG_CREATE_CHAT_DIALOG_TEXT')}
			</div>
		`;

		const cancelButton = new Button({
			text: Loc.getMessage('VIBECODECONNECTOR_CATALOG_CREATE_CHAT_DIALOG_CANCEL'),
			size: ButtonSize.MEDIUM,
			style: AirButtonStyle.OUTLINE,
			useAirDesign: true,
			dataset: { testid: 'vibecode-catalog-create-chat-dialog-cancel' },
			onclick: () => dialog.hide(),
		});

		const confirmButton = new Button({
			text: Loc.getMessage('VIBECODECONNECTOR_CATALOG_CREATE_CHAT_DIALOG_CONFIRM'),
			size: ButtonSize.MEDIUM,
			style: AirButtonStyle.FILLED,
			useAirDesign: true,
			dataset: { testid: 'vibecode-catalog-create-chat-dialog-confirm' },
			onclick: () => {
				dialog.hide();
				void this.#createChat();
			},
		});

		const dialog = new Dialog({
			title: Loc.getMessage('VIBECODECONNECTOR_CATALOG_CREATE_CHAT_DIALOG_TITLE'),
			content,
			width: 400,
			hasOverlay: true,
			rightButtons: [cancelButton, confirmButton],
		});

		dialog.show();
	}

	async #createChat(): Promise<void>
	{
		if (this.#creating)
		{
			return;
		}

		this.#creating = true;

		try
		{
			const response = await ajax.runAction(CREATE_CHAT_ACTION, { data: { catalogItemId: this.#item.id } });
			const chatId = Text.toInteger(response?.data?.chatId);

			if (response?.data?.ok !== true || chatId <= 0)
			{
				this.#notifyUnavailable();

				return;
			}

			this.#item.appChatId = chatId;
			this.#item.appChatAccessible = true;
			this.#item.appChatCreatable = false;

			const opened = await openCatalogChat(chatId);

			if (!opened)
			{
				this.#notifyUnavailable();

				return;
			}

			this.#onChatOpen?.();
		}
		catch (error)
		{
			this.#notifyUnavailable();
			console.error('[vibecodeconnector.catalog] failed to create the app chat', this.#item.id, error);
		}
		finally
		{
			this.#creating = false;
		}
	}

	#notifyUnavailable(): void
	{
		NotificationCenter.notify({
			content: Loc.getMessage('VIBECODECONNECTOR_CATALOG_APP_CHAT_UNAVAILABLE'),
		});
	}
}
