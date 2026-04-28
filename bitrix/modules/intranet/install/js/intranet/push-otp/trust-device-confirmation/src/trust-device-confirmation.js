import type { BaseCache } from 'main.core.cache';
import { MemoryCache } from 'main.core.cache';
import { EventEmitter } from 'main.core.events';
import { Popup } from 'main.popup';
import { Extension, Tag, Text, Loc } from 'main.core';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import 'ui.icon-set.social';
import { EnablePushOtpProvider } from 'intranet.push-otp.connect-popup';
import { SidePanel } from 'main.sidepanel';
import { sendData } from 'ui.analytics';

export class TrustDeviceConfirmation extends EventEmitter
{
	#cache: BaseCache = new MemoryCache();

	constructor()
	{
		super();
		this.setEventNamespace('BX.Intranet.PushOtp.TrustDeviceConfirmation');
	}

	show(): void
	{
		this.#getPopup().show();
	}

	#getPopup(): Popup
	{
		return this.#cache.remember('popup', () => {
			return new Popup({
				id: 'trust-device-confirmation-popup',
				width: 590,
				content: this.#getContent(),
				fixed: true,
				disableScroll: true,
				overlay: true,
				className: `intranet-trust-device-confirmation-popup${this.#getPopupColorClass()}`,
				events: {
					onShow: () => {
						sendData({
							tool: 'push',
							category: 'push_check_data_2fa',
							event: 'click',
						});
						BX.userOptions.save('intranet', 'otp_device_last_confirmation_date', null, BX.Main.DateTimeFormat.format('d.m.Y'));
						BX.userOptions.del('intranet', 'require_show_device_confirmation_date');
					},
					onClose: () => {
						this.emit('onClose');
					},
				},
			});
		});
	}

	#getPopupColorClass(): string
	{
		const isDeactivated = this.#getExtensionSettings().isDeactivated;

		if (isDeactivated)
		{
			return '--red';
		}

		return '--blue';
	}

	#getContent(): HTMLElement
	{
		return this.#cache.remember('content', () => {
			return Tag.render`
				<div class="intranet-trust-device-confirmation-popup__wrapper">
					${this.#getHeader()}
					<div class="intranet-trust-device-confirmation-popup__content">
						${this.#getDeviceItem()}
						${this.#getExtensionSettings().canSendSms ? this.#getNumberItem() : ''}
					</div>
					${this.#getButtonsContainer()}
				</div>
			`;
		});
	}

	#getHeader(): HTMLElement
	{
		return this.#cache.remember('header', () => {
			return Tag.render`
				<div class="intranet-trust-device-confirmation-popup__header">
					<div class="intranet-trust-device-confirmation-popup__title-wrapper">
						<div class="intranet-trust-device-confirmation-popup__title">
							${Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_TITLE')}
						</div>
						<div class="intranet-trust-device-confirmation-popup__description">
							${Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_DESCRIPTION')}
						</div>
					</div>
					<div class="intranet-trust-device-confirmation-popup__icon">
						<i></i>
					</div>
				</div>
			`;
		});
	}

	#getDeviceItem(): HTMLElement
	{
		return this.#cache.remember('deviceItem', () => {
			const onclick = () => {
				const provider = new EnablePushOtpProvider(this.#getExtensionSettings());
				provider.onlyPushOtp().show();
			};

			return Tag.render`
				<div class="intranet-trust-device-confirmation-popup-content__item">
					<div class="intranet-trust-device-confirmation-popup-content-item__icon-wrapper">
						<i class="intranet-trust-device-confirmation-popup-content-item__icon --device"></i>
					</div>
					<div class="intranet-trust-device-confirmation-popup-content-item__text">
						<div class="intranet-trust-device-confirmation-popup-content-item__title">
							${Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_DEVICE_TITLE')}
						</div>
						<div data-testid="bx-intranet-trust-device-confirmation-popup-device-data" class="intranet-trust-device-confirmation-popup-content-item__description">
							<i class="ui-icon-set ${this.#getDeviceIconClass()}"></i>
							<span>${Text.encode(this.#getExtensionSettings().device)}</span>
						</div>
					</div>
					<div data-testid="bx-intranet-trust-device-confirmation-popup-device-action" onclick="${onclick}" class="intranet-trust-device-confirmation-popup-content-item__action">
						${Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_ACTION_CHANGE')}
					</div>
				</div>
			`;
		});
	}

	#getDeviceIconClass(): string
	{
		if (this.#getExtensionSettings().platform === 'ios')
		{
			return '--apple-and-ios';
		}

		if (this.#getExtensionSettings().platform === 'android')
		{
			return '--android';
		}

		return '';
	}

	#getNumberItem(): HTMLElement
	{
		return this.#cache.remember('numberItem', () => {
			return Tag.render`
				<div class="intranet-trust-device-confirmation-popup-content__item">
					<div class="intranet-trust-device-confirmation-popup-content-item__icon-wrapper">
						<i class="intranet-trust-device-confirmation-popup-content-item__icon --number"></i>
					</div>
					<div class="intranet-trust-device-confirmation-popup-content-item__text">
						<div class="intranet-trust-device-confirmation-popup-content-item__title">
							${Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_PHONE_NUMBER_TITLE')}
						</div>
						<div data-testid="bx-intranet-trust-device-confirmation-popup-phone-data" class="intranet-trust-device-confirmation-popup-content-item__description">
							${this.#getPhoneNumber()}
						</div>
					</div>
					<div data-testid="bx-intranet-trust-device-confirmation-popup-phone-action" onclick="${this.#getNumberActionConfig().onclick}" class="intranet-trust-device-confirmation-popup-content-item__action ${this.#getNumberActionConfig().modifyClass}">
						${this.#getNumberActionConfig().title}
					</div>
				</div>
			`;
		});
	}

	#getNumberActionConfig(): Object
	{
		return this.#cache.remember('numberActionConfig', () => {
			const provider = new EnablePushOtpProvider(this.#getExtensionSettings());
			const onclick = () => {
				provider.onlySmsOtpChange().show();
			};

			if (!this.#getExtensionSettings().phoneNumber)
			{
				return {
					title: Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_ACTION_ADD'),
					onclick,
					modifyClass: '--action-blue',
				};
			}

			if (this.#getExtensionSettings().isPhoneNumberConfirmed)
			{
				return {
					title: Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_ACTION_CHANGE'),
					onclick,
					modifyClass: '',
				};
			}

			return {
				title: Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_ACTION_CONFIRM'),
				onclick: () => {
					provider.onlySmsOtpConfirm().show();
				},
				modifyClass: '--action-blue',
			};
		});
	}

	#getPhoneNumber(): string | HTMLElement
	{
		return this.#cache.remember('phoneNumber', () => {
			return this.#getExtensionSettings().phoneNumber || Tag.render`<span class="--disabled-item">${Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_PHONE_NUMBER_NOT_SET')}</span>`;
		});
	}

	#getButtonsContainer(): HTMLElement
	{
		return this.#cache.remember('buttonsContainer', () => {
			return Tag.render`
				<div class="intranet-trust-device-confirmation-popup__buttons">
					${this.#getOpenSettingsButton().render()}
					${this.#getConfirmButton().render()}
				</div>
			`;
		});
	}

	#getOpenSettingsButton(): Button
	{
		return this.#cache.remember('openSettingsButton', () => {
			return new Button({
				text: Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_BUTTON_SETTINGS'),
				style: AirButtonStyle.FILLED,
				useAirDesign: true,
				size: ButtonSize.LARGE,
				onclick: () => {
					this.#getPopup().close();
					SidePanel.Instance.open(this.#getExtensionSettings().settingsPath, {
						events: {
							onOpen: () => {
								EventEmitter.subscribeOnce('BX.Intranet.Security:onChangePage', (event) => {
									if (event.data.page === 'otpConnected')
									{
										EventEmitter.emit('BX.Intranet.Security:shouldOpen2FaSlider');
									}
								});
							},
						},
					});
					sendData({
						tool: 'push',
						category: 'push_check_data_2fa',
						event: 'click',
						c_section: 'setting',
					});
				},
				props: {
					'data-testid': 'bx-intranet-trust-device-confirmation-popup-settings-button',
				},
			});
		});
	}

	#getConfirmButton(): Button
	{
		return this.#cache.remember('confirmButton', () => {
			return new Button({
				text: Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_BUTTON_CONFIRM'),
				style: AirButtonStyle.OUTLINE,
				useAirDesign: true,
				size: ButtonSize.LARGE,
				onclick: () => {
					this.#getPopup().close();
					sendData({
						tool: 'push',
						category: 'push_check_data_2fa',
						event: 'click',
						c_section: 'approve',
					});
				},
				props: {
					'data-testid': 'bx-intranet-trust-device-confirmation-popup-confirm-button',
				},
			});
		});
	}

	#getExtensionSettings(): Object
	{
		return this.#cache.remember('extensionSettings', () => {
			return Extension.getSettings('intranet.push-otp.trust-device-confirmation');
		});
	}
}
