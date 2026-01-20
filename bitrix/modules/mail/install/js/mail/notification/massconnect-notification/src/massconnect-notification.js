import { Type } from 'main.core';
import { BannerDispatcher } from 'ui.banner-dispatcher';
import { Popup, CloseIconSize, PopupManager } from 'main.popup';
import './style.css';

export type NotificationOptions = {
	contentContainerId: string;
	okButtonText: string;
	skipButtonText: string;
	userOptionName: string;
}

export class MassConnectNotification
{
	#popup: Popup = null;
	#options: NotificationOptions = null;

	constructor(options: NotificationOptions)
	{
		if (Type.isObject(options))
		{
			this.#options = options;
		}
	}

	createPopup(onDone: Function): Popup
	{
		return PopupManager.create(
			{
				id: 'mass-connect-popup-id',
				content: BX(this.#options.contentContainerId),
				buttons: [
					new BX.UI.Button({
						text: this.#options.okButtonText,
						size: BX.UI.Button.Size.LARGE,
						style: BX.UI.AirButtonStyle.FILLED_SUCCESS,
						useAirDesign: true,
						onclick: () => {
							onDone();
							this.#popup.close();
							BX.SidePanel.Instance.open('/mail/massconnect', { width: 950 });
						},
					}),
					new BX.UI.Button({
						text: this.#options.skipButtonText,
						size: BX.UI.Button.Size.LARGE,
						style: BX.UI.AirButtonStyle.PLAIN_NO_ACCENT,
						useAirDesign: true,
						onclick: () => {
							onDone();
							this.#popup.close();
						},
					}),
				],
				closeByEsc: true,
				className: 'mass-connection-popup-container',
				overlay: { opacity: 40 },
				fixed: true,
				closeIcon: true,
				closeIconSize: CloseIconSize.LARGE,
			},
		);
	}

	show(): void
	{
		BannerDispatcher.critical.toQueue((onDone) => {
			this.#popup = this.createPopup(onDone);
			this.#popup.show();
			this.#popup.zIndexComponent.setZIndex(400);

			BX.userOptions.save('mail.guide', this.#options.userOptionName, null, 'Y');
		});
	}
}
