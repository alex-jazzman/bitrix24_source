import { Loc } from 'main.core';
import { type MenuItemOptions, type MenuOptions } from 'ui.system.menu';
import { type EventEmitter } from 'main.core.events';
import { Outline as OutlineIcons } from 'ui.icon-set.api.core';

import { PopupType, EventType, ChatType, type ApplicationContext } from 'im.v2.const';
import { BaseMenu } from 'im.v2.lib.menu';
import { ChatService } from 'im.v2.provider.service.chat';
import { Notifier } from 'im.v2.lib.notifier';
import { Core } from 'im.v2.application.core';
import { Analytics } from 'im.v2.lib.analytics';
import { CollabInvitationService } from 'im.v2.provider.service.collab-invitation';
import { Messenger } from 'im.public';

export class AddToChatDropdownMenu extends BaseMenu
{
	emitter: EventEmitter;
	chatService: ChatService;
	context: { chatId: number, dialogId: string, userId: string };

	constructor(applicationContext: ApplicationContext)
	{
		super();

		this.id = PopupType.mentionAddToChatDropdown;

		const { emitter } = applicationContext;
		this.emitter = emitter;

		this.chatService = new ChatService();
	}

	getMenuOptions(): MenuOptions
	{
		return {
			...super.getMenuOptions(),
			angle: false,
		};
	}

	getMenuItems(): MenuItemOptions
	{
		return [
			this.#getAddToChatItems(),
		];
	}

	#getAddToChatItems(): MenuItemOptions[]
	{
		return {
			title: Loc.getMessage('IM_TEXTAREA_MENTION_ADD_TO_CHAT_DROPDOWN_MENU'),
			icon: OutlineIcons.ADD_PERSON,
			onClick: async () => {
				try
				{
					await this.#handleAddToChat();
				}
				catch
				{
					Notifier.chat.onUserAddError();
				}
			},
		};
	}

	async #handleAddToChat()
	{
		Analytics.getInstance().mention.onClickAddToChat(this.context.dialogId);

		if (this.#isUser())
		{
			await this.#createChatFromUser();

			return;
		}

		await this.#addUserToChat();

		Notifier.chat.onUserAddComplete();
	}

	async #createChatFromUser()
	{
		const { newDialogId } = await this.chatService.extendToGroupChat({
			members: [this.context.dialogId, this.context.userId, Core.getUserId()],
			ownerId: Core.getUserId(),
		});

		void Messenger.openChat(newDialogId);
	}

	async #addUserToChat()
	{
		const addUserHandlers = {
			[ChatType.collab]: () => this.#addToCollab(),
			default: () => this.#addToChat(),
		};

		const handler = addUserHandlers[this.#getChatType()] ?? addUserHandlers.default;

		await handler();

		this.emitter.emit(EventType.mention.onAddUserToChat, { userId: this.context.userId });
	}

	async #addToChat()
	{
		await this.chatService.addToChat({
			chatId: this.context.chatId,
			members: [this.context.userId],
			showHistory: true,
		});
	}

	async #addToCollab()
	{
		await (new CollabInvitationService()).addEmployees({
			dialogId: this.context.dialogId,
			members: [this.context.userId],
		});
	}

	#getChatType(): $Values<typeof ChatType>
	{
		const dialog = Core.getStore().getters['chats/get'](this.context.dialogId, true);

		return dialog.type;
	}

	#isUser(): boolean
	{
		return Core.getStore().getters['chats/isUser'](this.context.dialogId);
	}
}
