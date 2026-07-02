import { Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { ChatService } from 'im.v2.provider.service.chat';
import { Utils } from 'im.v2.lib.utils';
import { EventType } from 'im.v2.const';
import { BeforeSendMessageAction } from 'im.v2.component.textarea';

const COMMAND_PREFIX = '/';
const AUTO_HIDE_DELAY = 5000;

const QuickCommand = {
	getDialogId: 'getDialogId',
	getChatId: 'getChatId',
	rename: 'rename',
};

export class QuickCommandManager
{
	#dialogId: string;
	#chatService: ChatService;

	constructor(dialogId: string)
	{
		this.#dialogId = dialogId;
		this.#chatService = new ChatService();
		this.#subscribe();
	}

	destroy()
	{
		this.#unsubscribe();
	}

	#subscribe()
	{
		this.onBeforeSendMessageHandler = this.#onBeforeSendMessage.bind(this);
		EventEmitter.subscribe(EventType.textarea.onBeforeSendMessage, this.onBeforeSendMessageHandler);
	}

	#unsubscribe()
	{
		EventEmitter.unsubscribe(EventType.textarea.onBeforeSendMessage, this.onBeforeSendMessageHandler);
	}

	#onBeforeSendMessage(): ?string
	{
		const text = this.#getText();
		const parsed = this.#parseCommand(text);
		if (parsed && this.#handleCommand(parsed.command, parsed.args))
		{
			return BeforeSendMessageAction.cancel;
		}
	}

	#getText(): string
	{
		const result = EventEmitter.emit(EventType.textarea.getText, { dialogId: this.#dialogId });

		return result[0] ?? '';
	}

	#parseCommand(raw: string): ?{ command: string, args: string[] }
	{
		if (!raw || !raw.startsWith(COMMAND_PREFIX))
		{
			return null;
		}

		const [command, ...args] = raw.slice(COMMAND_PREFIX.length).split(' ');

		return { command, args };
	}

	#getCommandMap(): { [string]: Function }
	{
		return {
			[QuickCommand.getDialogId]: this.#executeGetDialogId.bind(this),
			[QuickCommand.getChatId]: this.#executeGetDialogId.bind(this),
			[QuickCommand.rename]: this.#executeRename.bind(this),
		};
	}

	#handleCommand(command: string, args: string[]): boolean
	{
		const handler = this.#getCommandMap()[command];
		if (!handler)
		{
			return false;
		}

		handler(args);

		return true;
	}

	#executeGetDialogId()
	{
		const message = Loc.getMessage('IMOL_TEXTAREA_COMMAND_DIALOG_ID_COPIED')
			.replace('#DIALOG_ID#', `<b>${this.#dialogId}</b>`);

		BX.UI.Notification.Center.notify({
			content: message,
			autoHideDelay: AUTO_HIDE_DELAY,
		});

		void Utils.text.copyToClipboard(this.#dialogId);
	}

	#executeRename(args: string[])
	{
		const newName = args.join(' ');
		if (newName === '')
		{
			return;
		}

		void this.#chatService.renameChat(this.#dialogId, newName);
	}
}
