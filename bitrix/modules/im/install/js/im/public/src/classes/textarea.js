import { Reflection } from 'main.core';
import { EventEmitter } from 'main.core.events';

type InsertTextConfig = {
	withNewLine?: boolean,
	replace?: boolean,
};

export class Textarea
{
	async getText(chatId: number): Promise<string>
	{
		const { EventType } = Reflection.getClass('BX.Messenger.v2.Const');
		if (!EventType)
		{
			return '';
		}

		const dialogId = this.#getDialogIdByChatId(chatId);
		if (!dialogId)
		{
			return '';
		}

		const result = await EventEmitter.emitAsync(EventType.textarea.getText, { dialogId });
		if (result.length === 0)
		{
			return '';
		}

		return result[0];
	}

	insertQuote(chatId: number, text: string, options: InsertTextConfig = {})
	{
		const { Quote } = Reflection.getClass('BX.Messenger.v2.Lib');
		if (!Quote)
		{
			return;
		}

		const formattedText = Quote.wrapWithDelimiters(text);

		this.insertText(chatId, formattedText, { withNewLine: true, ...options });
	}

	insertText(chatId: number, text: string, options: InsertTextConfig = {})
	{
		const { EventType } = Reflection.getClass('BX.Messenger.v2.Const');
		if (!EventType)
		{
			return;
		}

		const dialogId = this.#getDialogIdByChatId(chatId);
		if (!dialogId)
		{
			return;
		}

		const config = {
			dialogId,
			text,
			withNewLine: false,
			replace: false,
			...options,
		};

		EventEmitter.emit(EventType.textarea.insertText, config);
	}

	#getDialogIdByChatId(chatId: number): string
	{
		const { Core } = Reflection.getClass('BX.Messenger.v2.Application');
		if (!Core)
		{
			return '';
		}

		const dialog = Core.getStore().getters['chats/getByChatId'](chatId);
		if (!dialog)
		{
			return '';
		}

		return dialog.dialogId;
	}
}
