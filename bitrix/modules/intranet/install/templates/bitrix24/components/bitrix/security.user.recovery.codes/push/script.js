/* eslint-disable */
this.BX = this.BX || {};
this.BX.Intranet = this.BX.Intranet || {};
(function (exports, main_core, ui_buttons, ui_iconSet_api_core, ui_analytics, main_sidepanel) {
	'use strict';

	class RecoveryCodes {
		#cache = new main_core.Cache.MemoryCache();
		#options;
		constructor(options) {
			this.#options = options;
		}
		renderTo(element) {
			main_core.Dom.append(this.#getHeaderContainer(), element);
			main_core.Dom.append(this.#getBodyContainer(), element);
		}
		#getHeaderContainer() {
			return this.#cache.remember('header-container', () => {
				main_core.Event.bind(this.#getStatusContainer(), 'click', () => {
					main_core.Dom.toggleClass(this.#getChevron(), '--show');
					main_core.Dom.toggleClass(this.#getBodyContainer(), '--show');
				});
				const onclick = event => {
					event.preventDefault();
					top.BX.Helper.show('redirect=detail&code=26676294');
				};
				return main_core.Tag.render`
				<div class="intranet-user-otp-list__section-row-header-wrapper">
					<div class="intranet-user-otp-list__section-row-header">
						<div class="intranet-user-otp-list__row-label ui-text --md">
							<span class="ui-icon-set --o-note"></span>
							${main_core.Loc.getMessage('INTRANET_USER_OTP_LIST_RECOVERED_CODES')}
						</div>
						${this.#getStatusContainer()}
					</div>
					<p class="intranet-user-otp-list__section-row-description">
						${main_core.Loc.getMessage('INTRANET_USER_OTP_LIST_CODE_DESCRIPTION')}
					</p>
					<a onclick="${onclick}" class="intranet-user-otp-list__section-row-link ui-link ui-link-secondary ui-link-dashed">
						${main_core.Loc.getMessage('INTRANET_USER_OTP_LIST_MORE_BTN')}
					</p>
				</div>
			`;
			});
		}
		#getBodyContainer() {
			return this.#cache.remember('body-container', () => {
				return main_core.Tag.render`
				<div id="row-content" class="intranet-user-otp-list__section-row-content">
					<div class="intranet-user-otp-list__section-row-content-wrapper">
						<div class="intranet-user-otp-list__section-row-divider"></div>
						${this.#options.codes.length > 0 ? this.#getBodyContent() : this.#getButtonStub()}
					</div>
				</div>
			`;
			});
		}
		#getStatusContainer() {
			return this.#cache.remember('status-container', () => {
				return main_core.Tag.render`
				<div id="row-status" class="intranet-user-otp-list__row-status intranet-user-otp-list__row-status--clickable">
					${this.#getRemainderCodes()}
					${this.#getChevron()}
				</div>
			`;
			});
		}
		#getRemainderCodes() {
			let icon = null;
			let text = null;
			if (this.#options.codes.length > 0) {
				icon = main_core.Tag.render`<div class="ui-icon-set --o-circle-check"></div>`;
				text = main_core.Loc.getMessage('INTRANET_USER_OTP_LIST_RECOVERED_CODES_COUNT', {
					'#COUNT#': this.#options.codes.length
				});
			} else {
				icon = main_core.Tag.render`<div class="ui-icon-set --o-alert-accent"></div>`;
				text = main_core.Loc.getMessage('INTRANET_USER_OTP_LIST_RECOVERED_CODES_ENDED');
			}
			const container = main_core.Tag.render`
			<div class="intranet-user-otp-list__row-value ui-text --md">
				${text}
			</div>
		`;
			main_core.Dom.prepend(icon, container);
			return container;
		}
		#getChevron() {
			return this.#cache.remember('chevron', () => {
				return main_core.Tag.render`
				<div id="row-chevron" class="ui-icon-set --chevron-down-s"></div>
			`;
			});
		}
		#getBodyContent() {
			return this.#cache.remember('recovery-codes-list', () => {
				return main_core.Tag.render`
				<div class="intranet-otp-codes">
					${this.#getRecoveryCodesGrid()}
					${this.#getButtonsContainer()}
				</div>
			`;
			});
		}
		#getRecoveryCodesGrid() {
			return this.#cache.remember('recovery-codes-grid', () => {
				const container = main_core.Tag.render`
				<ol class="intranet-otp-codes__grid ui-alert ui-alert-primary"/>
			`;
				this.#setRecoveryCodes(container);
				return container;
			});
		}
		#setRecoveryCodes(container) {
			this.#options.codes.forEach(code => {
				main_core.Dom.append(main_core.Tag.render`
				<li class="ui-text --sm intranet-otp-codes__grid-item">
					${main_core.Text.encode(code.VALUE)}
				</li>
			`, container);
			});
		}
		#getButtonsContainer() {
			return this.#cache.remember('buttons-container', () => {
				return main_core.Tag.render`
				<div class="intranet-otp-codes__button-section">
					<div class="intranet-otp-codes__button-container">
						${this.#getPrintButton().render()}
						${this.#getDownloadButton().render()}
					</div>
					<div class="intranet-otp-codes__button-container">
						${this.#getReloadButton().render()}
					</div>
				</div>
			`;
			});
		}
		#getPrintButton() {
			return this.#cache.remember('print-button', () => {
				return new ui_buttons.Button({
					text: main_core.Loc.getMessage('INTRANET_USER_OTP_LIST_PRINT_BTN'),
					size: ui_buttons.Button.Size.SMALL,
					style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
					useAirDesign: true,
					icon: ui_iconSet_api_core.Outline.PRINTER,
					onclick: () => {
						main_sidepanel.SidePanel.Instance.open('/bitrix/templates/bitrix24/components/bitrix/security.user.recovery.codes/push/print.php');
						this.#sendAnalyticsEvent('print_codes_click');
					}
				});
			});
		}
		#getDownloadButton() {
			return this.#cache.remember('download-button', () => {
				return new ui_buttons.Button({
					text: main_core.Loc.getMessage('INTRANET_USER_OTP_LIST_DOWNLOAD_BTN'),
					size: ui_buttons.Button.Size.SMALL,
					style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
					useAirDesign: true,
					icon: ui_iconSet_api_core.Outline.DOWNLOAD,
					tag: ui_buttons.Button.Tag.LINK,
					link: this.#options.downloadLink,
					onclick: () => {
						this.#sendAnalyticsEvent('install_codes_click');
					}
				});
			});
		}
		#getReloadButton() {
			return this.#cache.remember('reload-button', () => {
				return new ui_buttons.Button({
					text: main_core.Loc.getMessage('INTRANET_USER_OTP_LIST_RELOAD_BTN'),
					size: ui_buttons.Button.Size.SMALL,
					style: ui_buttons.AirButtonStyle.PLAIN_ACCENT,
					useAirDesign: true,
					icon: ui_iconSet_api_core.Outline.REFRESH,
					onclick: button => {
						this.#sendAnalyticsEvent('refresh_code_click', 'security');
						button.setWaiting(true);
						// eslint-disable-next-line promise/catch-or-return
						this.#reloadCodes().then(() => {
							button.setWaiting(false);
						});
					}
				});
			});
		}
		#getButtonStub() {
			return this.#cache.remember('button-stub', () => {
				return main_core.Tag.render`
				<div class="intranet-otp-codes__button-section">
					${this.#getStubReloadButton().render()}
				</div>
			`;
			});
		}
		#getStubReloadButton() {
			return this.#cache.remember('stub-reload-button', () => {
				return new ui_buttons.Button({
					text: main_core.Loc.getMessage('INTRANET_USER_OTP_LIST_RELOAD_BTN'),
					size: ui_buttons.Button.Size.MEDIUM,
					style: ui_buttons.AirButtonStyle.FILLED,
					useAirDesign: true,
					icon: ui_iconSet_api_core.Outline.REFRESH,
					wide: true,
					onclick: button => {
						this.#sendAnalyticsEvent('refresh_code_click', 'baloon');
						button.setWaiting(true);
						// eslint-disable-next-line promise/catch-or-return
						this.#reloadCodes().then(() => {
							button.setWaiting(false);
							main_core.Dom.replace(this.#getButtonStub(), this.#getBodyContent());
						});
					}
				});
			});
		}
		#reloadCodes() {
			return new Promise((resolve, reject) => {
				main_core.ajax.runComponentAction('bitrix:security.user.recovery.codes', 'regenerateRecoveryCodes', {
					mode: 'ajax'
				}).then(response => {
					this.#options.codes = response.data;
					main_core.Dom.clean(this.#getRecoveryCodesGrid());
					this.#setRecoveryCodes(this.#getRecoveryCodesGrid());
					resolve();
				}).catch(error => {
					reject(error);
				});
			});
		}
		#sendAnalyticsEvent(eventName, cSection = null) {
			const data = {
				tool: 'user_settings',
				category: 'security',
				event: eventName
			};
			if (cSection) {
				data.c_section = cSection;
			}
			ui_analytics.sendData(data);
		}
	}

	exports.RecoveryCodes = RecoveryCodes;

})(this.BX.Intranet.Security = this.BX.Intranet.Security || {}, BX, BX.UI, BX.UI.IconSet, BX.UI.Analytics, BX.SidePanel);
//# sourceMappingURL=script.js.map
