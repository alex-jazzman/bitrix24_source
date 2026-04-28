import { Loc } from 'main.core';
import { Popup } from 'main.popup';

export class AdminRestrictedPopup
{
	static #popup = null;

	static show(bindElement: HTMLElement): void
	{
		if (this.#popup)
		{
			this.#popup.setBindElement(bindElement);
			this.#popup.show();
		}
		else
		{
			this.#popup = new Popup({
				content: Loc.getMessage('INTRANET_LICENSE_WIDGET_ADMIN_RIGHTS_RESTRICTED'),
				bindElement,
				angle: true,
				offsetTop: 0,
				offsetLeft: 40,
				closeIcon: false,
				autoHide: true,
				darkMode: true,
				overlay: false,
				closeByEsc: true,
				width: 300,
			});
			this.#popup.show();
		}
	}
}
