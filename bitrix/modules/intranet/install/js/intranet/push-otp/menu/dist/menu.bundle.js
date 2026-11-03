/* eslint-disable */
this.BX = this.BX || {};
this.BX.Intranet = this.BX.Intranet || {};
(function (exports, main_popup, ui_avatar, main_core, ui_system_dialog, ui_buttons, ui_analytics) {
	'use strict';

	class Menu {
		#menuItems;
		#bindElement;
		constructor(bind, options) {
			this.#bindElement = bind;
			this.#menuItems = this.#createDeactivateMenuItems(options.days, options.callback);
		}
		show() {
			main_popup.MenuManager.show('securityOtpDaysPopup', this.#bindElement, this.#menuItems, {
				maxHeight: 200,
				offsetTop: 10,
				offsetLeft: 0,
				events: {
					onPopupClose() {
						main_popup.MenuManager.destroy('securityOtpDaysPopup');
					}
				}
			});
		}
		#createDeactivateMenuItems(days, callback) {
			const menuItems = [];
			for (const index in days) {
				menuItems.push({
					text: days[index],
					numDays: index,
					onclick(event, item) {
						callback(item);
						this.popupWindow.close();
					}
				});
			}
			return menuItems;
		}
	}

	class ProfileDeactivate {
		#cache = new main_core.Cache.MemoryCache();
		#options;
		constructor(options) {
			this.#options = options;
		}
		getProfileItem() {
			return {
				text: main_core.Loc.getMessage('INTRANET_PUSH_OTP_MENU_PROFILE_DEACTIVATE_TITLE'),
				attrs: {
					'data-testid': 'intranet-user-profile-otp-deactivate'
				},
				items: [{
					text: main_core.Loc.getMessage('INTRANET_PUSH_OTP_MENU_PROFILE_DEACTIVATE_BUTTON_1'),
					attrs: {
						'data-testid': 'intranet-user-profile-otp-deactivate-days-1'
					},
					onclick: () => {
						this.#sendAnalyticsEvent();
						this.#options.callback();
						this.#getDialog(main_core.Loc.getMessage('INTRANET_PUSH_OTP_MENU_PROFILE_DEACTIVATE_BUTTON_1'), 1).show();
					}
				}, {
					text: main_core.Loc.getMessage('INTRANET_PUSH_OTP_MENU_PROFILE_DEACTIVATE_BUTTON_2'),
					attrs: {
						'data-testid': 'intranet-user-profile-otp-deactivate-days-2'
					},
					onclick: () => {
						this.#sendAnalyticsEvent();
						this.#options.callback();
						this.#getDialog(main_core.Loc.getMessage('INTRANET_PUSH_OTP_MENU_PROFILE_DEACTIVATE_BUTTON_2'), 2).show();
					}
				}]
			};
		}
		#sendAnalyticsEvent() {
			ui_analytics.sendData({
				tool: 'user_settings',
				category: 'security',
				event: 'click_turnoff_2fa_employee_temp'
			});
		}

		// ui.system.dialog builds its own content wrapper and accepts no attributes for it,
		// so the test id is applied from here on every show of the dialog
		#applyDialogTestId() {
			const dialogNode = this.#getPopupContent().closest('.ui-system-dialog__content-wrapper');
			if (dialogNode) {
				dialogNode.dataset.testid = 'intranet-otp-deactivate-popup-dialog';
			}
		}
		#getDialog(buttonText, days) {
			return this.#cache.remember(`popup-days-${days}`, () => {
				return new ui_system_dialog.Dialog({
					width: 600,
					content: this.#getPopupContent(),
					hasOverlay: true,
					events: {
						onShow: () => this.#applyDialogTestId()
					},
					centerButtons: [new ui_buttons.Button({
						text: buttonText,
						style: ui_buttons.AirButtonStyle.FILLED_ALERT,
						size: ui_buttons.ButtonSize.EXTRA_LARGE,
						useAirDesign: true,
						dataset: {
							testid: `intranet-otp-deactivate-popup-confirm-btn-days-${days}`
						},
						onclick: () => {
							main_core.ajax.runAction('intranet.v2.Otp.pauseOtp', {
								mode: 'ajax',
								method: 'POST',
								data: {
									signedUserId: this.#options.signedUserId,
									days
								}
							}).then(() => {
								this.#getDialog(buttonText, days).hide();
								this.#cache.delete(`popup-days-${days}`);
								BX.SidePanel.Instance.postMessageTop(window, 'userProfileSlider::reloadList', {});
								location.reload();
							});
						}
					}), new ui_buttons.Button({
						text: main_core.Loc.getMessage('INTRANET_PUSH_OTP_MENU_PROFILE_DEACTIVATE_POPUP_BUTTON_CANCEL'),
						style: ui_buttons.AirButtonStyle.PLAIN,
						size: ui_buttons.ButtonSize.EXTRA_LARGE,
						useAirDesign: true,
						dataset: {
							testid: 'intranet-otp-deactivate-popup-cancel-btn'
						},
						onclick: () => {
							this.#getDialog(buttonText, days).hide();
							this.#cache.delete(`popup-days-${days}`);
						}
					})]
				});
			});
		}
		#getPopupContent() {
			return this.#cache.remember('popupContent', () => {
				return main_core.Tag.render`
				<div class="intranet-otp-deactivate-popup-content__wrapper" data-testid="intranet-otp-deactivate-popup">
					<div class="intranet-otp-deactivate-popup-content__title" data-testid="intranet-otp-deactivate-popup-title">${main_core.Loc.getMessage('INTRANET_PUSH_OTP_MENU_PROFILE_DEACTIVATE_POPUP_TITLE')}</div>
					<div class="intranet-otp-deactivate-popup-content-user__wrapper">
						<div class="intranet-otp-deactivate-popup-content-user__avatar">
							${this.#getAvatar().getContainer()}
						</div>
						<div class="intranet-otp-deactivate-popup-content-user-name__wrapper">
							<div class="intranet-otp-deactivate-popup-content-user__name" data-testid="intranet-otp-deactivate-popup-user-name">${main_core.Text.encode(this.#options.fullName)}</div>
							${this.#getWorkPosition()}
						</div>
					</div>
					<div class="intranet-otp-deactivate-popup-content__description" data-testid="intranet-otp-deactivate-popup-description">
						${main_core.Loc.getMessage('INTRANET_PUSH_OTP_MENU_PROFILE_DEACTIVATE_POPUP_DESCRIPTION')}
					</div>
					${this.#getMoreInfoLink()}
				</div>
			`;
			});
		}
		#getMoreInfoLink() {
			return this.#cache.remember('moreInfoLink', () => {
				const onclick = () => {
					top.BX.Helper.show('redirect=detail&code=26676294');
				};
				return main_core.Tag.render`
				<div onclick="${onclick}" class="intranet-otp-deactivate-popup-content__article --ui-hoverable-alt" data-testid="intranet-otp-deactivate-popup-more-link">
					<span>${main_core.Loc.getMessage('INTRANET_PUSH_OTP_MENU_PROFILE_DEACTIVATE_POPUP_MORE_LINK')}</span>
				</div>
			`;
			});
		}
		#getAvatar() {
			return this.#cache.remember('avatar', () => {
				return new ui_avatar.AvatarRound({
					size: 54,
					userpicPath: this.#options?.avatarUri ? encodeURI(this.#options.avatarUri) : null
				});
			});
		}
		#getWorkPosition() {
			return this.#cache.remember('workPosition', () => {
				if (!this.#options.workPosition) {
					return null;
				}
				return main_core.Tag.render`
				<div class="intranet-otp-deactivate-popup-content-user__workposition" data-testid="intranet-otp-deactivate-popup-user-position">${main_core.Text.encode(this.#options.workPosition)}</div>
			`;
			});
		}
	}

	exports.Menu = Menu;
	exports.ProfileDeactivate = ProfileDeactivate;

})(this.BX.Intranet.PushOtp = this.BX.Intranet.PushOtp || {}, BX.Main, BX.UI, BX, BX.UI.System, BX.UI, BX.UI.Analytics);
//# sourceMappingURL=menu.bundle.js.map
