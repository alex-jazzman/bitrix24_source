import { Loc } from 'main.core';
import { type MenuItemOptions, type MenuOptions } from 'ui.system.menu';
import { type EventEmitter } from 'main.core.events';
import { Outline as OutlineIcons } from 'ui.icon-set.api.core';

import { PopupType, ChatType, type ApplicationContext, type ChatTypeItem } from 'im.v2.const';
import { BaseMenu } from 'im.v2.lib.menu';
import { Notifier } from 'im.v2.lib.notifier';
import { Core } from 'im.v2.application.core';
import { Analytics } from 'im.v2.lib.analytics';

import { MentionAddUserService } from '../../../classes/add-user-service';
import { MentionInsertManager } from '../../classes/insert-manager';

const AddToChatTitleByChatType = {
	[ChatType.taskComments]: Loc.getMessage('IM_TEXTAREA_MENTION_ADD_TO_TASK_COMMENTS_DROPDOWN_MENU'),
	default: Loc.getMessage('IM_TEXTAREA_MENTION_ADD_TO_CHAT_DROPDOWN_MENU'),
};

export class AddToChatDropdownMenu extends BaseMenu
{
	emitter: EventEmitter;
	context: {
		chatId: number,
		dialogId: string,
		userId: string,
		searchQuery: string,
		target: string,
		targetContainer: HTMLElement,
	};

	constructor(applicationContext: ApplicationContext)
	{
		super();

		this.id = PopupType.mentionAddToChatDropdown;

		const { emitter } = applicationContext;
		this.emitter = emitter;
	}

	getMenuOptions(): MenuOptions
	{
		return {
			...super.getMenuOptions(),
			angle: false,
			targetContainer: this.context.targetContainer,
		};
	}

	getMenuItems(): MenuItemOptions[]
	{
		return [
			this.#getAddToChatItem(),
		];
	}

	#getAddToChatItem(): MenuItemOptions
	{
		return {
			title: AddToChatTitleByChatType[this.#getChatType()] ?? AddToChatTitleByChatType.default,
			icon: OutlineIcons.ADD_PERSON,
			onClick: async () => {
				try
				{
					this.#insertMention();

					await this.#handleAddToChat();
				}
				catch
				{
					Notifier.chat.handleUserAddError(this.#getChatType());
				}
			},
		};
	}

	#insertMention()
	{
		const params = {
			id: this.context.userId,
			dialogId: this.context.dialogId,
			query: this.context.searchQuery,
			target: this.context.target,
			suppressAddToChatPopup: true,
		};

		const insertManager = new MentionInsertManager({ emitter: this.emitter });
		insertManager.insert(params);
	}

	async #handleAddToChat()
	{
		Analytics.getInstance().mention.onClickAddToChat(this.context.dialogId);

		if (this.#isUser())
		{
			await this.#getAddUserService().createChatFromUser({
				dialogId: this.context.dialogId,
				userId: this.context.userId,
			});

			return;
		}

		const isAdded = await this.#getAddUserService().addUser({
			dialogId: this.context.dialogId,
			chatId: this.context.chatId,
			userId: this.context.userId,
		});

		if (isAdded)
		{
			Notifier.chat.handleUserAddComplete(this.#getChatType());
		}
	}

	#getAddUserService(): MentionAddUserService
	{
		return new MentionAddUserService({ emitter: this.emitter });
	}

	#getChatType(): ChatTypeItem
	{
		const dialog = Core.getStore().getters['chats/get'](this.context.dialogId, true);

		return dialog.type;
	}

	#isUser(): boolean
	{
		return Core.getStore().getters['chats/isUser'](this.context.dialogId);
	}
}
