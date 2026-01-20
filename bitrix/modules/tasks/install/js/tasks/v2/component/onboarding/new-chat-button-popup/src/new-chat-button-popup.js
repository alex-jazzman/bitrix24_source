import { Tag, Loc, ajax } from 'main.core';
import { Popup } from 'main.popup';
import { BannerDispatcher } from 'ui.banner-dispatcher';

import './new-chat-button-popup.css';

export class NewChatButtonPopup
{
	#popup: ?Popup;

	static show(): void
	{
		return new this().showPopup();
	}

	showPopup(): void
	{
		BannerDispatcher.normal.toQueue((onDone) => {
			this.#popup = this.getPopup();

			if (!this.#popup)
			{
				onDone();

				return;
			}

			const onClose = () => {
				onDone();
			};

			this.#popup.show();
			this.#popup.subscribe('onClose', onClose);
			this.#popup.subscribe('onDestroy', onClose);

			this.setViewed();
		});
	}

	getPopup(): ?Popup
	{
		const chatButton = document.getElementById('tasks-chat-button');

		if (!chatButton)
		{
			return null;
		}

		return new Popup({
			className: 'tasks-onboarding-new-chat-button-popup-wrapper',
			content: this.getContent(),
			bindElement: chatButton,
			background: 'var(--ui-color-bg-content-inapp)',
			angle: true,
			autoHide: true,
			autoHideHandler: () => true,
			cacheable: false,
			animation: 'fading',
			padding: 0,
			maxWidth: 460,
			minWidth: 460,
			offsetLeft: 60,
			closeByEsc: false,
			closeIcon: true,
		});
	}

	getContent(): HTMLElement
	{
		return Tag.render`
			<div class="tasks-onboarding-new-chat-button-popup">
				<div class="tasks-onboarding-new-chat-button-popup-icon">
					<img src="${this.getIconPath()}" alt="">
				</div>
				<div class="tasks-onboarding-new-chat-button-popup-content">
					<div class="tasks-onboarding-new-chat-button-popup-title">
						${Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CHAT_BUTTON_POPUP_TITLE')}
					</div>
					<div class="tasks-onboarding-new-chat-button-popup-text">
						${Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CHAT_BUTTON_POPUP_TEXT')}
					</div>
				</div>
			</div>
		`;
	}

	getIconPath(): string
	{
		return '/bitrix/js/tasks/v2/component/onboarding/new-chat-button-popup/src/new-chat-button-popup.png';
	}

	close(): void
	{
		this.#popup.close();
	}

	setViewed(): void
	{
		void ajax.runAction('tasks.promotion.setViewed', {
			data: {
				promotion: 'tasks_new_chat_button',
			},
		});
	}
}
