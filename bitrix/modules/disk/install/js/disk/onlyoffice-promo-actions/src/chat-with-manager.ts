import { Loc, Type } from 'main.core';

import { Messenger } from 'im.public';

import { IncreaseLimitRequest } from './increase-limit-request';

export class ChatWithManager
{
	private readonly increaseLimitRequest: IncreaseLimitRequest | null;
	private readonly isCreate: boolean;
	constructor(isCreate: boolean, increaseLimitRequest: IncreaseLimitRequest | null)
	{
		this.isCreate = isCreate;
		this.increaseLimitRequest = increaseLimitRequest;
	}

	canOpen(): boolean
	{
		return this.increaseLimitRequest !== null && this.increaseLimitRequest.chatId > 0;
	}

	getOpenHandler(): () => Promise<{}>
	{
		if (this.increaseLimitRequest === null)
		{
			throw new Error('No increase limit request');
		}

		return async () => {
			const dialogId = this.increaseLimitRequest?.dialogId;

			if (Type.isStringFilled(dialogId))
			{
				if (this.isCreate)
				{
					await this.openInCurrentTab(dialogId);
				}
				else
				{
					await this.openInNewTab(dialogId);
				}
			}

			return {};
		};
	}

	private async openInCurrentTab(dialogId: string): Promise<void>
	{
		await Messenger.openChat(dialogId);
		if (Messenger.isChatOpened(dialogId))
		{
			const chatId = this.increaseLimitRequest?.chatId;
			if (Type.isNumber(chatId))
			{
				await this.prefillMessage(Messenger, chatId);
			}
		}
	}

	private async openInNewTab(dialogId: string): Promise<void>
	{
		const chatWindow = window.open(`/online/?IM_DIALOG=${dialogId}`, '_blank');
		if (!chatWindow)
		{
			console.error('Unable to open tab. The browser may have blocked the popup.');

			return;
		}

		try
		{
			const result = await this.waitForResult(this.createNewTabChatResolver(chatWindow, dialogId));
			const { messenger, chatId } = result;
			await this.prefillMessage(messenger, chatId);

			chatWindow.focus();
		}
		catch (error)
		{
			console.error('Failed to insert text into chat:', error);
		}
	}

	private async waitForResult<T>(
		check: () => T | null,
		{ attempts = 120, delay = 100 } = {},
	): Promise<T>
	{
		for (let i = 0; i < attempts; i++)
		{
			const result = check();
			if (result)
			{
				return result;
			}

			// eslint-disable-next-line no-await-in-loop
			await new Promise((resolve) => {
				setTimeout(resolve, delay);
			});
		}

		throw new Error('Timeout!');
	}

	private createNewTabChatResolver(chatWindow: Window, dialogId: string)
	{
		return () => {
			// @ts-ignore
			const BX = chatWindow.BX;
			// @ts-ignore
			const messenger = BX?.Messenger?.Public;
			// @ts-ignore
			const core = BX?.Messenger?.v2?.Application?.Core;
			const store = core?.getStore?.();
			const chat = store?.getters?.['chats/get']?.(dialogId);

			if (messenger && chat?.chatId)
			{
				return { messenger, chatId: chat.chatId };
			}

			return null;
		};
	}

	private async prefillMessage(messenger: typeof Messenger, chatId: number): Promise<void>
	{
		const text = await messenger.textarea.getText(chatId);
		if (!Type.isStringFilled(text))
		{
			const replacements = {
				'[buy_link]': `[URL=${this.increaseLimitRequest?.buyLink}]`,
				'[/buy_link]': '[/URL]',
			};
			const insertText = (this.isCreate
				? Loc.getMessage('DISK_OPA_CREATE_MANAGER_TEXT', replacements)
				: Loc.getMessage('DISK_OPA_EDIT_MANAGER_TEXT', replacements)
			) || '';
			messenger.textarea.insertText(chatId, insertText);
		}
	}
}
