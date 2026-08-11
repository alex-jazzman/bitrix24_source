/* eslint-disable */
this.BX = this.BX || {};
this.BX.Intranet = this.BX.Intranet || {};
(function (exports, main_core_cache, main_core_events, main_popup, main_core, ui_buttons, ui_iconSet_social, intranet_pushOtp_connectPopup, main_sidepanel, ui_analytics) {
	'use strict';

	class TrustDeviceConfirmation extends main_core_events.EventEmitter {
		#cache = new main_core_cache.MemoryCache();
		constructor() {
			super();
			this.setEventNamespace('BX.Intranet.PushOtp.TrustDeviceConfirmation');
		}
		show() {
			this.#getPopup().show();
		}
		#getPopup() {
			return this.#cache.remember('popup', () => {
				return new main_popup.Popup({
					id: 'trust-device-confirmation-popup',
					width: 590,
					content: this.#getContent(),
					fixed: true,
					disableScroll: true,
					overlay: true,
					className: `intranet-trust-device-confirmation-popup${this.#getPopupColorClass()}`,
					events: {
						onShow: () => {
							ui_analytics.sendData({
								tool: 'push',
								category: 'push_check_data_2fa',
								event: 'click'
							});
							BX.userOptions.save('intranet', 'otp_device_last_confirmation_date', null, BX.Main.DateTimeFormat.format('d.m.Y'));
							BX.userOptions.del('intranet', 'require_show_device_confirmation_date');
						},
						onClose: () => {
							this.emit('onClose');
						}
					}
				});
			});
		}
		#getPopupColorClass() {
			const isDeactivated = this.#getExtensionSettings().isDeactivated;
			if (isDeactivated) {
				return '--red';
			}
			return '--blue';
		}
		#getContent() {
			return this.#cache.remember('content', () => {
				return main_core.Tag.render`
				<div class="intranet-trust-device-confirmation-popup__wrapper">
					${this.#getHeader()}
					<div class="intranet-trust-device-confirmation-popup__content">
						${this.#getDeviceItem()}
						${this.#getExtensionSettings().canSendSms ? this.#getNumberItem() : ''}
						${this.#getExtensionSettings().canSendEmail ? this.#getEmailItem() : ''}
					</div>
					${this.#getButtonsContainer()}
				</div>
			`;
			});
		}
		#getHeader() {
			return this.#cache.remember('header', () => {
				return main_core.Tag.render`
				<div class="intranet-trust-device-confirmation-popup__header">
					<div class="intranet-trust-device-confirmation-popup__title-wrapper">
						<div class="intranet-trust-device-confirmation-popup__title">
							${main_core.Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_TITLE')}
						</div>
						<div class="intranet-trust-device-confirmation-popup__description">
							${main_core.Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_DESCRIPTION')}
						</div>
					</div>
					<div class="intranet-trust-device-confirmation-popup__icon">
						<i></i>
					</div>
				</div>
			`;
			});
		}
		#getDeviceItem() {
			return this.#cache.remember('deviceItem', () => {
				const onclick = () => {
					const provider = new intranet_pushOtp_connectPopup.EnablePushOtpProvider(this.#getExtensionSettings());
					provider.onlyPushOtp().show();
				};
				return main_core.Tag.render`
				<div class="intranet-trust-device-confirmation-popup-content__item">
					<div class="intranet-trust-device-confirmation-popup-content-item__icon-wrapper">
						<i class="intranet-trust-device-confirmation-popup-content-item__icon --device"></i>
					</div>
					<div class="intranet-trust-device-confirmation-popup-content-item__text">
						<div class="intranet-trust-device-confirmation-popup-content-item__title">
							${main_core.Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_DEVICE_TITLE')}
						</div>
						<div data-testid="bx-intranet-trust-device-confirmation-popup-device-data" class="intranet-trust-device-confirmation-popup-content-item__description">
							<i class="ui-icon-set ${this.#getDeviceIconClass()}"></i>
							<span>${main_core.Text.encode(this.#getExtensionSettings().device)}</span>
						</div>
					</div>
					<div data-testid="bx-intranet-trust-device-confirmation-popup-device-action" onclick="${onclick}" class="intranet-trust-device-confirmation-popup-content-item__action">
						${main_core.Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_ACTION_CHANGE')}
					</div>
				</div>
			`;
			});
		}
		#getDeviceIconClass() {
			if (this.#getExtensionSettings().platform === 'ios') {
				return '--apple-and-ios';
			}
			if (this.#getExtensionSettings().platform === 'android') {
				return '--android';
			}
			return '';
		}
		#getNumberItem() {
			return this.#cache.remember('numberItem', () => {
				return main_core.Tag.render`
				<div class="intranet-trust-device-confirmation-popup-content__item">
					<div class="intranet-trust-device-confirmation-popup-content-item__icon-wrapper">
						<i class="intranet-trust-device-confirmation-popup-content-item__icon --number"></i>
					</div>
					<div class="intranet-trust-device-confirmation-popup-content-item__text">
						<div class="intranet-trust-device-confirmation-popup-content-item__title">
							${main_core.Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_PHONE_NUMBER_TITLE')}
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
		#getEmailItem() {
			return this.#cache.remember('emailItem', () => {
				return main_core.Tag.render`
				<div class="intranet-trust-device-confirmation-popup-content__item">
					<div class="intranet-trust-device-confirmation-popup-content-item__icon-wrapper">
						<i class="intranet-trust-device-confirmation-popup-content-item__icon --email"></i>
					</div>
					<div class="intranet-trust-device-confirmation-popup-content-item__text">
						<div class="intranet-trust-device-confirmation-popup-content-item__title">
							${main_core.Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_EMAIL_TITLE')}
						</div>
						<div data-testid="bx-intranet-trust-device-confirmation-popup-email-data" class="intranet-trust-device-confirmation-popup-content-item__description">
							${this.#getEmail()}
						</div>
					</div>
					<div data-testid="bx-intranet-trust-device-confirmation-popup-email-action" onclick="${this.#getEmailActionConfig().onclick}" class="intranet-trust-device-confirmation-popup-content-item__action ${this.#getEmailActionConfig().modifyClass}">
						${this.#getEmailActionConfig().title}
					</div>
				</div>
			`;
			});
		}
		#getNumberActionConfig() {
			return this.#cache.remember('numberActionConfig', () => {
				const provider = new intranet_pushOtp_connectPopup.EnablePushOtpProvider(this.#getExtensionSettings());
				const onclick = () => {
					provider.onlySmsOtpChange().show();
				};
				if (!this.#getExtensionSettings().phoneNumber) {
					return {
						title: main_core.Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_ACTION_ADD'),
						onclick,
						modifyClass: '--action-blue'
					};
				}
				if (this.#getExtensionSettings().isPhoneNumberConfirmed) {
					return {
						title: main_core.Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_ACTION_CHANGE'),
						onclick,
						modifyClass: ''
					};
				}
				return {
					title: main_core.Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_ACTION_CONFIRM'),
					onclick: () => {
						provider.onlySmsOtpConfirm().show();
					},
					modifyClass: '--action-blue'
				};
			});
		}
		#getPhoneNumber() {
			return this.#cache.remember('phoneNumber', () => {
				return this.#getExtensionSettings().phoneNumber || main_core.Tag.render`<span class="--disabled-item">${main_core.Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_PHONE_NUMBER_NOT_SET')}</span>`;
			});
		}
		#getEmailActionConfig() {
			return this.#cache.remember('emailActionConfig', () => {
				const provider = new intranet_pushOtp_connectPopup.EnablePushOtpProvider(this.#getExtensionSettings());
				const onclick = () => {
					provider.onlyEmailOtpChange().show();
				};
				if (!this.#getExtensionSettings().email) {
					return {
						title: main_core.Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_ACTION_ADD'),
						onclick,
						modifyClass: '--action-blue'
					};
				}
				return {
					title: main_core.Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_ACTION_CHANGE'),
					onclick,
					modifyClass: ''
				};
			});
		}
		#getEmail() {
			return this.#cache.remember('email', () => {
				return this.#getExtensionSettings().email || main_core.Tag.render`<span class="--disabled-item">${main_core.Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_PHONE_NUMBER_NOT_SET')}</span>`;
			});
		}
		#getButtonsContainer() {
			return this.#cache.remember('buttonsContainer', () => {
				return main_core.Tag.render`
				<div class="intranet-trust-device-confirmation-popup__buttons">
					${this.#getOpenSettingsButton().render()}
					${this.#getConfirmButton().render()}
				</div>
			`;
			});
		}
		#getOpenSettingsButton() {
			return this.#cache.remember('openSettingsButton', () => {
				return new ui_buttons.Button({
					text: main_core.Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_BUTTON_SETTINGS'),
					style: ui_buttons.AirButtonStyle.FILLED,
					useAirDesign: true,
					size: ui_buttons.ButtonSize.LARGE,
					onclick: () => {
						this.#getPopup().close();
						main_sidepanel.SidePanel.Instance.open(this.#getExtensionSettings().settingsPath, {
							events: {
								onOpen: () => {
									main_core_events.EventEmitter.subscribeOnce('BX.Intranet.Security:onChangePage', event => {
										if (event.data.page === 'otpConnected') {
											main_core_events.EventEmitter.emit('BX.Intranet.Security:shouldOpen2FaSlider');
										}
									});
								}
							}
						});
						ui_analytics.sendData({
							tool: 'push',
							category: 'push_check_data_2fa',
							event: 'click',
							c_section: 'setting'
						});
					},
					props: {
						'data-testid': 'bx-intranet-trust-device-confirmation-popup-settings-button'
					}
				});
			});
		}
		#getConfirmButton() {
			return this.#cache.remember('confirmButton', () => {
				return new ui_buttons.Button({
					text: main_core.Loc.getMessage('INTRANET_TRUST_DEVICE_CONFIRMATION_BUTTON_CONFIRM'),
					style: ui_buttons.AirButtonStyle.OUTLINE,
					useAirDesign: true,
					size: ui_buttons.ButtonSize.LARGE,
					onclick: () => {
						this.#getPopup().close();
						ui_analytics.sendData({
							tool: 'push',
							category: 'push_check_data_2fa',
							event: 'click',
							c_section: 'approve'
						});
					},
					props: {
						'data-testid': 'bx-intranet-trust-device-confirmation-popup-confirm-button'
					}
				});
			});
		}
		#getExtensionSettings() {
			return this.#cache.remember('extensionSettings', () => {
				return main_core.Extension.getSettings('intranet.push-otp.trust-device-confirmation');
			});
		}
	}

	exports.TrustDeviceConfirmation = TrustDeviceConfirmation;

})(this.BX.Intranet.PushOtp = this.BX.Intranet.PushOtp || {}, BX.Cache, BX.Event, BX.Main, BX, BX.UI, window, BX.Intranet.PushOtp, BX.SidePanel, BX.UI.Analytics);
//# sourceMappingURL=trust-device-confirmation.bundle.js.map
