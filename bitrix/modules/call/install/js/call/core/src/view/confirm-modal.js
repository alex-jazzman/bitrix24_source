import { Dom } from 'main.core';

import '../css/confirm-modal.css';

type ConfirmModalOptions = {
	onClickYesButton?: 'function',
	onClickNoButton?: 'function',
	onClose?: 'function',
	title: string,
	message: string,
	yesButtonText: string,
	noButtonText: string,
};

export class ConfirmModal
{
	constructor(config: ConfirmModalOptions)
	{
		this.popup = null;

		this.callbacks = {
			onClickYesButton: BX.type.isFunction(config.onClickYesButton) ? config.onClickYesButton : BX.DoNothing,
			onClickNoButton: BX.type.isFunction(config.onClickNoButton) ? config.onClickNoButton : BX.DoNothing,
			onClose: BX.type.isFunction(config.onClose) ? config.onClose : BX.DoNothing,
		};

		this.title = BX.type.isString(config.title) ? config.title : '';
		this.message = BX.type.isString(config.message) ? config.message : '';
		this.yesButtonText = BX.type.isString(config.yesButtonText) ? config.yesButtonText : '';
		this.noButtonText = BX.type.isString(config.noButtonText) ? config.noButtonText : '';
	}

	#getButtons()
	{
		const buttons = [];

		if (this.yesButtonText)
		{
			buttons.push(Dom.create('button', {
				props: { className: 'call-confirm-modal__button call-confirm-modal__button-yes' },
				text: this.yesButtonText,
				events: {
					click: () => {
						this.callbacks.onClickYesButton();
						this.popup.close();
					},
				},
			}));
		}

		if (this.noButtonText)
		{
			buttons.push(
				Dom.create('button', {
					props: { className: 'call-confirm-modal__button call-confirm-modal__button-no' },
					text: this.noButtonText,
					events: {
						click: () => {
							this.callbacks.onClickNoButton();
							this.popup.close();
						},
					},
				}),
			);
		}

		return buttons;
	}

	create()
	{
		this.popup = BX.UI.Dialogs.MessageBox.create({
			modal: true,
			popupOptions: {
				content: Dom.create('div', {
					props: { className: 'call-confirm-modal__content' },
					children: [
						Dom.create('div', {
							props: { className: 'call-confirm-modal__title' },
							text: this.title,
						}),
						Dom.create('div', {
							props: { className: 'call-confirm-modal__message' },
							text: this.message,
						}),
						Dom.create('div', {
							props: { className: 'call-confirm-modal__actions' },
							children: this.#getButtons(),
						}),
					],
				}),
				className: 'call-confirm-modal',
				darkMode: true,
				contentBackground: '#22272B',
				contentBorderRadius: '10px',
				autoHide: false,
				closeByEsc: false,
				closeIcon: true,
				contentNoPaddings: true,
				width: 420,
				maxWidth: 420,
				animation: 'fading',
				events: {
					onPopupClose: () => {
						this.callbacks.onClose();
						this.popup = null;
					},
				},
			},
		});
	}

	show()
	{
		this.close();
		this.create();

		this.popup.show();
	}

	close()
	{
		if (this.popup)
		{
			this.popup.close();
		}
	}
}
