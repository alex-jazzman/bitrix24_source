import { Loc, Tag, Type } from 'main.core';
import { Popup } from 'main.popup';
import { Button, ButtonSize, AirButtonStyle } from 'ui.buttons';
import { Text, Headline } from 'ui.system.typography';

import './popup-request-install.css';

export class PopupRequestInstall
{
	#popup: ?Popup = null;
	#icon: string;
	#appName: string;
	#onConfirm: Function;
	#onComplete: Function;
	#confirmButton: ?Button = null;
	#cancelButton: ?Button = null;

	constructor(options = {})
	{
		this.#icon = Type.isStringFilled(options.icon) ? options.icon : '';
		this.#appName = Type.isStringFilled(options.appName) ? options.appName : '';
		this.#onConfirm = Type.isFunction(options.onConfirm) ? options.onConfirm : () => {};
		this.#onComplete = Type.isFunction(options.onComplete) ? options.onComplete : () => {};
	}

	show(): void
	{
		const popup = this.#getPopup();
		this.#setLoading(false);
		popup.show();
	}

	#setLoading(loading: boolean): void
	{
		if (this.#confirmButton)
		{
			this.#confirmButton.setWaiting(loading);
		}

		if (this.#cancelButton)
		{
			this.#cancelButton.setDisabled(loading);
		}
	}

	#handleConfirm(): void
	{
		this.#setLoading(true);

		const complete = () => {
			this.#setLoading(false);
			this.close();
			this.#onComplete();
		};

		Promise.resolve(this.#onConfirm())
			.then(complete)
			.catch(complete);
	}

	close(): void
	{
		if (this.#popup)
		{
			this.#popup.close();
		}
	}

	#getPopup(): Popup
	{
		if (this.#popup)
		{
			return this.#popup;
		}

		const content = Tag.render`
			<div class="market-popup-request" data-test-id="market_popup-request-install">
				<div class="market-popup-request__illustration">
					<div class="market-popup-request__icon">
						<img class="market-popup-request__icon-img" alt="">
					</div>
					<div class="market-popup-request__badge"></div>
				</div>
				${Headline.render(Loc.getMessage('MARKET_POPUP_REQUEST_INSTALL_TITLE'), {
					size: 'md',
				})}
				${Text.render(Loc.getMessage('MARKET_POPUP_REQUEST_INSTALL_TEXT'), {
					size: 'lg',
					className: 'market-popup-request__text',
					tag: 'div',
				})}
			</div>
		`;

		const iconNode = content.querySelector('.market-popup-request__icon-img');
		if (iconNode)
		{
			if (this.#icon)
			{
				iconNode.src = this.#icon;
			}

			iconNode.alt = this.#appName;
		}

		this.#cancelButton = new Button({
			text: Loc.getMessage('MARKET_POPUP_REQUEST_INSTALL_CANCEL'),
			useAirDesign: true,
			style: AirButtonStyle.OUTLINE_NO_ACCENT,
			size: ButtonSize.LARGE,
			dataset: { testId: 'market_popup-request-install__cancel-button' },
			events: {
				click: (button) => {
					button.getContext().close();
				},
			},
		});

		this.#confirmButton = new Button({
			text: Loc.getMessage('MARKET_POPUP_REQUEST_INSTALL_CONFIRM'),
			useAirDesign: true,
			style: AirButtonStyle.FILLED,
			size: ButtonSize.LARGE,
			dataset: { testId: 'market_popup-request-install__submit-button' },
			events: {
				click: () => {
					this.#handleConfirm();
				},
			},
		});

		this.#popup = new Popup({
			className: 'market-popup-request-window',
			content,
			overlay: true,
			closeIcon: true,
			autoHide: true,
			closeByEsc: true,
			width: 480,
			borderRadius: 20,
			padding: 24,
			buttons: [this.#confirmButton, this.#cancelButton],
			ariaLabel: Loc.getMessage('MARKET_POPUP_REQUEST_INSTALL_TITLE'),
		});

		this.#confirmButton.setContext(this.#popup);
		this.#cancelButton.setContext(this.#popup);

		return this.#popup;
	}
}
