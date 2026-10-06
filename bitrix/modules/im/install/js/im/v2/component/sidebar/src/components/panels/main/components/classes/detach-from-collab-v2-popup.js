import { Loc, Tag } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { Dialog, type DialogOptions } from 'ui.system.dialog';

import { EventType } from 'im.v2.const';
import { ChatService } from 'im.v2.provider.service.chat';
import { Core } from 'im.v2.application.core';
import { type ImModelChat } from 'im.v2.model';

const EVENT_NAMESPACE = 'BX.Messenger.v2.Component.DetachFromCollabV2Popup';

export class DetachFromCollabV2Popup extends EventEmitter
{
	context: { dialogId: string };

	#dialog: Dialog;

	constructor(context: { dialogId: string })
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
			title: Loc.getMessage('IM_SIDEBAR_MENU_DETACH_FROM_COLLAB_V2_POPUP_TITLE'),
			closeByEsc: false,
			hasOverlay: true,
			closeByClickOutside: false,
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
			<div class="bx-im-detach-from-collab-v2-popup__container bx-im-messenger__scope">
				<div class="bx-im-detach-from-collab-v2-popup__text">
					${Loc.getMessage('IM_SIDEBAR_MENU_DETACH_FROM_COLLAB_V2_POPUP_TEXT')}
				</div>
			</div>
		`;
	}

	#getConfirmButton(): Button
	{
		return new Button({
			text: Loc.getMessage('IM_SIDEBAR_MENU_DETACH_FROM_COLLAB_V2_POPUP_ACCESS_CONFIRM'),
			useAirDesign: true,
			size: ButtonSize.LARGE,
			wide: true,
			onclick: async () => {
				this.#hide();

				this.#detachToParent();
			},
		});
	}

	#getCancelButton(): Button
	{
		return new Button({
			text: Loc.getMessage('IM_SIDEBAR_MENU_DETACH_FROM_COLLAB_V2_POPUP_ACCESS_CANCEL'),
			useAirDesign: true,
			style: AirButtonStyle.OUTLINE,
			size: ButtonSize.LARGE,
			wide: true,
			onclick: () => this.#hide(),
		});
	}

	#detachToParent()
	{
		EventEmitter.emit(EventType.recent.closeNestedList, { dialogId: this.#getParentDialogId() });

		void (new ChatService()).detachToParent(this.context.dialogId);
	}

	#getParentDialogId(): string
	{
		const { parentChatId }: ImModelChat = Core.getStore().getters['chats/get'](this.context.dialogId);
		const { dialogId: parentDialogId }: ImModelChat = Core.getStore().getters['chats/getByChatId'](parentChatId);

		return parentDialogId;
	}
}
