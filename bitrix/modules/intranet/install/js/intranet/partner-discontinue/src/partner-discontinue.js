import { Loc, Tag, Type } from 'main.core';
import { Popup } from 'main.popup';
import { AirButtonStyle, Button } from 'ui.buttons';
import 'ui.icon-set.outlined';
import './style.css';

export class PartnerDiscontinue
{
	getPopup(options: Object = {}): Popup
	{
		const popupOptions = Type.isPlainObject(options) ? options : {};
		const title = Type.isStringFilled(popupOptions.title)
			? popupOptions.title
			: Loc.getMessage('INTRANET_PARTNER_DISCONTINUE_POPUP_TITLE');
		const yesText = Type.isStringFilled(popupOptions.yesText)
			? popupOptions.yesText
			: Loc.getMessage('INTRANET_PARTNER_DISCONTINUE_YES_BTN');
		const noText = Type.isStringFilled(popupOptions.noText)
			? popupOptions.noText
			: Loc.getMessage('INTRANET_PARTNER_DISCONTINUE_NO_BTN');
		const content = this.#getPopupContent(popupOptions.content);
		const onConfirm = popupOptions.onConfirm;
		const onCancel = popupOptions.onCancel;

		const popup = new Popup({
			titleBar: title,
			useAirDesign: true,
			content,
			closeIcon: true,
			cacheable: true,
			autoHide: true,
			width: 452,
			className: 'license-widget-partner-discontinue-popup',
			overlay: {
				opacity: 100,
				backgroundColor: 'rgba(0, 32, 78, 0.46)',
			},
			buttons: [
				new Button({
					text: noText,
					useAirDesign: true,
					style: AirButtonStyle.OUTLINE,
					className: 'license-widget-partner-discontinue-popup-cancel-btn',
					onclick: () => {
						popup.close();
						if (Type.isFunction(onCancel))
						{
							onCancel();
						}
					},
				}),
				new Button({
					text: yesText,
					useAirDesign: true,
					style: AirButtonStyle.FILLED,
					onclick: () => {
						popup.close();
						if (Type.isFunction(onConfirm))
						{
							onConfirm();
						}
					},
				}),
			],
		});

		return popup;
	}

	#getPopupContent(content): HTMLElement
	{
		if (content instanceof HTMLElement)
		{
			return content;
		}

		if (Type.isStringFilled(content))
		{
			return this.#wrapContent(content);
		}

		const message = Loc.getMessage('INTRANET_PARTNER_DISCONTINUE_POPUP_CONTENT_MSGVER_1', {
			'[div]': '<div>',
			'[/div]': '</div>',
		});

		return this.#wrapContent(message);
	}

	#wrapContent(message: string): HTMLElement
	{
		return Tag.render`
			<div class="license-widget-partner-discontinue-popup-content">
				${message}
			</div>
		`;
	}
}
