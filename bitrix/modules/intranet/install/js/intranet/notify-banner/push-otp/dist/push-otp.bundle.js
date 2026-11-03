/* eslint-disable */
this.BX = this.BX || {};
this.BX.Intranet = this.BX.Intranet || {};
(function (exports, main_core, ui_designTokens, ui_system_typography, ui_buttons) {
	'use strict';

	class PushOtp {
		#needShowAdditionalBtn;
		#clickEnableBtn;
		#clickDisableBtn;
		#title;
		#text;
		constructor(options) {
			this.#clickEnableBtn = main_core.Type.isFunction(options.clickEnableBtn) ? options.clickEnableBtn : null;
			this.#clickDisableBtn = main_core.Type.isFunction(options.clickDisableBtn) ? options.clickDisableBtn : null;
			this.#needShowAdditionalBtn = main_core.Type.isFunction(options.clickDisableBtn);
			this.#title = main_core.Type.isStringFilled(options.title) ? options.title : '';
			this.#text = main_core.Type.isStringFilled(options.text) ? options.text : '';
		}
		render() {
			let additionalBtn = null;
			if (this.#needShowAdditionalBtn) {
				additionalBtn = new ui_buttons.Button({
					text: main_core.Loc.getMessage('NOTIFY_BANNER_PUSH_OTP_TIP'),
					noCaps: true,
					size: ui_buttons.Button.Size.MD,
					style: BX.UI.AirButtonStyle.PLAIN_NO_ACCENT,
					useAirDesign: true,
					onclick: this.#clickDisableBtn,
					props: {
						'data-testid': 'bx-notify-banner-push-otp-tip-btn'
					}
				});
			}
			const button = new ui_buttons.Button({
				text: main_core.Loc.getMessage('NOTIFY_BANNER_PUSH_OTP_BTN'),
				noCaps: true,
				size: ui_buttons.Button.Size.MD,
				useAirDesign: true,
				onclick: this.#clickEnableBtn,
				props: {
					'data-testid': 'bx-notify-banner-push-otp-enable-btn'
				}
			});
			return main_core.Tag.render`
			<div class="intranet-settings-info-banner">
				<div class="intranet-settings-info-banner__container">
					<div class="intranet-settings-info-banner__content">
						<h2 class="ui-headline --xs -accent">
							${this.#title}
						</h2>
						<p class="ui-text --xs">
							${this.#text}
						</p>
					</div>
					<div class="intranet-settings-info-banner__footer">
						${button.render()}
						${additionalBtn?.render()}
					</div>
				</div>
			</div>
		`;
		}
		renderTo(container) {
			if (main_core.Type.isDomNode(container)) {
				main_core.Dom.append(this.render(), container);
			}
		}
	}

	exports.PushOtp = PushOtp;

})(this.BX.Intranet.NotifyBanner = this.BX.Intranet.NotifyBanner || {}, BX, window, BX.UI.System.Typography, BX.UI);
//# sourceMappingURL=push-otp.bundle.js.map
