import { Dom, Loc, Text } from 'main.core';

const POPUP_TEST_ID = 'intranet-settings-security-otp-disable-popup';
const CONFIRM_BUTTON_TEST_ID = 'intranet-settings-security-otp-disable-confirm-btn';
const CANCEL_BUTTON_TEST_ID = 'intranet-settings-security-otp-disable-cancel-btn';

export class OtpDisableConfirm
{
	#checker: Object;
	#messageBox: ?Object = null;
	#resolve: ?Function = null;
	#confirmed: boolean = false;

	constructor(checker: Object)
	{
		this.#checker = checker;
	}

	confirm(): Promise<boolean>
	{
		return new Promise((resolve) => {
			this.#resolve = resolve;
			this.#confirmed = false;
			this.#getMessageBox().show();
		});
	}

	#getMessageBox(): Object
	{
		if (this.#messageBox !== null)
		{
			return this.#messageBox;
		}

		// Popup renders its content node with the id popup-window-content-{popupId}.
		const popupId = `intranet-settings-otp-disable-${Text.getRandom().toLowerCase()}`;
		this.#messageBox = BX.UI.Dialogs.MessageBox.create({
			title: Loc.getMessage('INTRANET_SETTINGS_POPUP_OTP_DISABLE_TITLE'),
			message: Loc.getMessage('INTRANET_SETTINGS_POPUP_OTP_DISABLE_TEXT'),
			modal: true,
			useAirDesign: true,
			cacheable: true,
			popupOptions: {
				id: popupId,
				closeByEsc: true,
				autoHide: true,
				focusTrap: true,
				ariaDescribedBy: `popup-window-content-${popupId}`,
				events: {
					onPopupClose: () => this.#complete(),
				},
			},
			buttons: [
				new BX.UI.Button({
					text: Loc.getMessage('INTRANET_SETTINGS_POPUP_OTP_DISABLE_BUTTON_CONFIRM'),
					style: BX.UI.AirButtonStyle.PLAIN_NO_ACCENT,
					useAirDesign: true,
					dataset: {
						testid: CONFIRM_BUTTON_TEST_ID,
					},
					events: {
						click: () => {
							this.#confirmed = true;
							this.#messageBox.close();
						},
					},
				}),
				new BX.UI.Button({
					text: Loc.getMessage('INTRANET_SETTINGS_POPUP_OTP_DISABLE_BUTTON_CANCEL'),
					style: BX.UI.AirButtonStyle.FILLED,
					useAirDesign: true,
					dataset: {
						autofocus: '',
						testid: CANCEL_BUTTON_TEST_ID,
					},
					events: {
						click: () => {
							this.#messageBox.close();
						},
					},
				}),
			],
		});

		this.#markPopupContainer();

		return this.#messageBox;
	}

	#markPopupContainer(): void
	{
		Dom.attr(this.#messageBox.getPopupWindow().getPopupContainer(), 'data-testid', POPUP_TEST_ID);
	}

	#complete(): void
	{
		if (this.#resolve === null)
		{
			return;
		}

		const resolve = this.#resolve;
		this.#resolve = null;

		if (!this.#confirmed)
		{
			this.#checker.cancel();
			this.#checker.switcher.check(true, false);
			this.#checker.switcher.inputNode?.form?.dispatchEvent(new window.Event('change'));
		}

		resolve(this.#confirmed);
	}
}
