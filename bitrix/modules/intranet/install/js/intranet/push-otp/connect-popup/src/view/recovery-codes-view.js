import { BaseView } from './base-view';
import { Extension, Loc, Tag } from 'main.core';
import { BaseCache, MemoryCache } from 'main.core.cache';
import { AirButtonStyle, Button } from 'ui.buttons';
import './css/recovery-codes.css';
import { SidePanel } from 'main.sidepanel';
import { Analytics } from '../analytics';

export class RecoveryCodesView extends BaseView
{
	#container: BaseCache = new MemoryCache();

	render(): HTMLElement
	{
		return this.#container.remember('view', () => {
			return Tag.render`
				<div class="intranet-push-otp-connect-popup__view-container">
					<div>
						<div class="intranet-push-otp-connect-popup__popup-title">
							${this.#renderTitle()}
						</div>
						${this.renderStepIndicators()}
					</div>
					<div class="intranet-push-otp-connect-popup__view-description-text">${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_RECOVERY_CODES_DESCRIPTION')}</div>
					<div class="intranet-push-otp-connect-popup__view-connect-container --content-center --column">
						<div class="intranet-push-otp-connect-popup-recovery-codes__subtitle">
							${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_RECOVERY_CODES_SUBTITLE')}
						</div>
						<div class="intranet-push-otp-connect-popup-recovery-codes__action-wrapper">
							${this.#createDownloadContainer()}
							${this.#createPrintContainer()}
						</div>
					</div>
					<div class="intranet-push-otp-connect-popup__view-button-container">
						${this.#createSendBtn().render()}
					</div>
				</div>
			`;
		});
	}

	afterShow(option: Object)
	{
		Analytics.sendEvent(Analytics.SHOW_TYPE_SAVE_CODE);
	}

	#renderTitle(): HTMLElement
	{
		return Tag.render`<span>${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_RECOVERY_CODES_TITLE')}</span>`;
	}

	#createSendBtn(): Button
	{
		return new Button({
			text: Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_CONNECT_NEXT_BTN'),
			noCaps: true,
			size: Button.Size.MD,
			useAirDesign: true,
			disabled: false,
			onclick: () => {
				this.emit('onNextView');
			},
		});
	}

	#createDownloadContainer(): HTMLElement
	{
		return Tag.render`
			<div class="intranet-push-otp-connect-popup-recovery-codes-action__container">
				<div class="intranet-push-otp-connect-popup-recovery-codes-action__icon --download"></div>
				<div class="intranet-push-otp-connect-popup-recovery-codes-action__text">
					${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_RECOVERY_CODES_DOWNLOAD_TITLE')}
				</div>
				${this.#createDownloadButton().render()}
			</div>
		`;
	}

	#createPrintContainer(): HTMLElement
	{
		return Tag.render`
			<div class="intranet-push-otp-connect-popup-recovery-codes-action__container">
				<div class="intranet-push-otp-connect-popup-recovery-codes-action__icon --print"></div>
				<div class="intranet-push-otp-connect-popup-recovery-codes-action__text">
					${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_RECOVERY_CODES_PRINT_TITLE')}
				</div>
				${this.#createPrintButton().render()}
			</div>
		`;
	}

	#createDownloadButton(): Button
	{
		return new Button({
			text: Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_RECOVERY_CODES_DOWNLOAD_BUTTON'),
			noCaps: true,
			size: Button.Size.SMALL,
			style: AirButtonStyle.TINTED,
			useAirDesign: true,
			disabled: false,
			tag: Button.Tag.LINK,
			onclick: () => Analytics.sendEventWithCElement('save_type_click', 'file'),
			link: Extension.getSettings('intranet.push-otp.connect-popup')?.get('recoveryCodes')?.downloadLink,
			props: {
				'data-testid': 'bx-intranet-push-otp-connect-popup-recovery-codes-download-button',
			},
		});
	}

	#createPrintButton(): Button
	{
		return new Button({
			text: Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_RECOVERY_CODES_PRINT_BUTTON'),
			noCaps: true,
			size: Button.Size.SMALL,
			style: AirButtonStyle.TINTED,
			useAirDesign: true,
			disabled: false,
			onclick: () => {
				Analytics.sendEventWithCElement('save_type_click', 'print');
				SidePanel.Instance.open('/bitrix/templates/bitrix24/components/bitrix/security.user.recovery.codes/push/print.php');
			},
			props: {
				'data-testid': 'bx-intranet-push-otp-connect-popup-recovery-codes-print-button',
			},
		});
	}
}
