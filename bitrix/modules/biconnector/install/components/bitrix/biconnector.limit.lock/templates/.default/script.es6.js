import { Tag, Reflection } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { BannerDispatcher } from 'ui.banner-dispatcher';
import { Dialog } from 'ui.system.dialog';

type LimitPopupParams = {
	title: number,
	content: string,
	licenseButtonText: string,
	laterButtonText: string,
	licenseUrl: string,
	fullLock: 'Y' | 'N',
	isLicenceLimit: 'Y' | 'N',
};

class LimitLockPopup
{
	#title: string = '';
	#content: string = '';
	#licenseButtonText: string = '';
	#laterButtonText: string = '';
	#licenseUrl: string = '';
	#fullLock: boolean = false;
	#isLicenceLimit: boolean = false;

	constructor(params: LimitPopupParams)
	{
		this.#init(params);
		this.#show();
	}

	#init(params: LimitPopupParams)
	{
		this.#title = params.title || '';
		this.#content = params.content || '';
		this.#licenseButtonText = params.licenseButtonText || '';
		this.#laterButtonText = params.laterButtonText || '';
		this.#licenseUrl = params.licenseUrl;
		this.#fullLock = params.fullLock === 'Y';
		this.#isLicenceLimit = params.isLicenceLimit === 'Y';
	}

	#show()
	{
		BannerDispatcher.high.toQueue((onDone) => {
			const centerButtons = [];

			if (this.#isLicenceLimit)
			{
				centerButtons.push(
					new Button({
						text: this.#licenseButtonText,
						size: ButtonSize.LARGE,
						style: AirButtonStyle.FILLED,
						useAirDesign: true,
						onclick: () => {
							top.location.href = this.#licenseUrl;
						},
					}),
					new Button({
						text: this.#laterButtonText,
						size: ButtonSize.LARGE,
						style: AirButtonStyle.PLAIN,
						useAirDesign: true,
						onclick: () => {
							popup.close();
						},
					}),
				);
			}

			const popupContent = Tag.render`
				<div class="biconnector-limit-popup-wrap">
					<div class="biconnector-limit-popup-wrap__limit__lock__logo"></div>
					<div class="ui-headline --sm --align-center">
						${this.#title}
					</div>
					<div class="ui-text --md --align-center">${this.#content}</div>
				</div>
			`;

			const popup = new Dialog({
				title: ' ',
				content: popupContent,
				centerButtons,
				hasOverlay: true,
				width: 400,
				hasCloseButton: true,
			});

			if (this.#fullLock)
			{
				popup.subscribe('onClose', () => {
					if (BX.SidePanel.Instance.isOpen())
					{
						BX.SidePanel.Instance.close();
					}
					EventEmitter.emit('BiConnector:LimitPopup.Lock.onClose');
					onDone();
				});
			}
			else
			{
				popup.subscribe('onClose', () => {
					EventEmitter.emit('BiConnector:LimitPopup.Warning.onClose');
					onDone();
				});
			}

			popup.show();
		});
	}
}

Reflection.namespace('BX.BIConnector').LimitLockPopup = LimitLockPopup;
