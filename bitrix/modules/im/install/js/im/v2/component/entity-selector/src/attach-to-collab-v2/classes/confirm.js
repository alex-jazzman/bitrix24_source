import { Loc, Tag } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { Dialog, type DialogOptions } from 'ui.system.dialog';

import { ChatService } from 'im.v2.provider.service.chat';
import { Core } from 'im.v2.application.core';
import { type ImModelChat } from 'im.v2.model';
import { LayoutManager } from 'im.v2.lib.layout';
import { Layout, RecentType, type RecentTypeItem, EventType } from 'im.v2.const';

const EVENT_NAMESPACE = 'BX.Messenger.v2.Component.AttachToCollabV2Confirm';

type AttachToCollabV2Context = {
	currentDialogId: string,
	selectedDialogId: string,
	recentType: RecentTypeItem,
};

export class AttachToCollabV2Confirm extends EventEmitter
{
	static events = {
		onConfirm: 'onConfirm',
		onCancel: 'onCancel',
	};

	context: AttachToCollabV2Context;

	#dialog: Dialog;

	constructor(context: AttachToCollabV2Context)
	{
		super();
		this.setEventNamespace(EVENT_NAMESPACE);

		this.context = context;

		this.#initDialog();
	}

	show(): void
	{
		this.#dialog.show();
	}

	#hide(): void
	{
		this.#dialog.hide();
	}

	#initDialog()
	{
		const params: DialogOptions = {
			title: Loc.getMessage('IM_ENTITY_SELECTOR_ATTACH_TO_COLLAB_V2_CONFIRM_TITLE'),
			closeByEsc: false,
			closeByClickOutside: false,
			hasOverlay: true,
			content: this.#getContainer(),
			centerButtons: [
				this.#getConfirmButton(),
				this.#getCancelButton(),
			],
		};

		this.#dialog = new Dialog(params);
	}

	#getContainer(): Element
	{
		return Tag.render`
			<div class="bx-im-entity-selector-attach-to-collab-v2-confirm__container bx-im-messenger__scope">
				<div class="bx-im-entity-selector-attach-to-collab-v2-confirm__text">
					${Loc.getMessage('IM_ENTITY_SELECTOR_ATTACH_TO_COLLAB_V2_CONFIRM_TEXT')}
				</div>
				<div class="bx-im-entity-selector-attach-to-collab-v2-confirm__image"></div>
			</div>
		`;
	}

	#getConfirmButton(): Button
	{
		return new Button({
			text: Loc.getMessage('IM_ENTITY_SELECTOR_ATTACH_TO_COLLAB_V2_CONFIRM_BUTTON'),
			useAirDesign: true,
			size: ButtonSize.LARGE,
			wide: true,
			onclick: async () => {
				this.#hide();
				this.#attachChatByRecentType();
			},
		});
	}

	#getCancelButton(): Button
	{
		return new Button({
			text: Loc.getMessage('IM_ENTITY_SELECTOR_ATTACH_TO_COLLAB_V2_CANCEL_BUTTON'),
			useAirDesign: true,
			style: AirButtonStyle.OUTLINE,
			size: ButtonSize.LARGE,
			wide: true,
			onclick: () => this.#hide(),
		});
	}

	#attachChatByRecentType()
	{
		const handleByRecentType = {
			[RecentType.collab]: () => this.#attachCurrentChatToCollab(),
			default: () => this.#attachSelectedChatToCollab(),
		};

		const recentType = this.context.recentType;
		if (!handleByRecentType[recentType])
		{
			handleByRecentType.default();

			return;
		}

		handleByRecentType[recentType]();
	}

	async #attachCurrentChatToCollab()
	{
		const { chatId: parentChatId }: ImModelChat = Core.getStore().getters['chats/get'](this.context.selectedDialogId);

		void this.#attachToParent(this.context.currentDialogId, parentChatId);
	}

	async #attachSelectedChatToCollab()
	{
		const { chatId: parentChatId }: ImModelChat = Core.getStore().getters['chats/get'](this.context.currentDialogId);

		void this.#attachToParent(this.context.selectedDialogId, parentChatId);
	}

	async #attachToParent(dialogId: string, parentChatId: number)
	{
		await (new ChatService()).attachToParent(dialogId, parentChatId);

		void this.#openAttachedChat(dialogId, parentChatId);
	}

	async #openAttachedChat(dialogId: string, parentChatId: number)
	{
		const { dialogId: parentDialogId }: ImModelChat = Core.getStore().getters['chats/getByChatId'](parentChatId);

		EventEmitter.emit(EventType.recent.openNestedList, { parentDialogId });

		void LayoutManager.getInstance().setLayout({
			name: Layout.chat,
			entityId: dialogId,
		});
	}
}
