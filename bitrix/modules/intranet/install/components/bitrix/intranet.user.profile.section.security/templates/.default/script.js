/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_sidepanel, ui_analytics, ui_cnt, ui_notification, ui_system_menu, intranet_logoutAllConfirm, intranet_notifyBanner_pushOtp, intranet_pushOtp_connectPopup, intranet_pushOtp_menu, ui_buttons, main_popup) {
	'use strict';

	class ComponentSlider {
		#id;
		#title;
		#width;
		#cacheable;
		#events = {};
		#componentContent;
		#buttons = [];
		#extensions = [];
		constructor(options) {
			this.#id = options.id;
			this.#title = options.title ?? '';
			this.#width = options.width ?? 1100;
			this.#cacheable = options.cacheable !== false;
			this.#events = options.events ?? {};
			this.#componentContent = options.componentContent;
			this.#buttons = options.buttons ?? [];
			this.#extensions = options.extensions ?? [];
		}
		open() {
			const layout = main_sidepanel.SidePanel.Instance.getTopSlider()?.getWindow()?.BX?.UI?.SidePanel?.Layout;
			if (!layout) {
				return;
			}
			main_sidepanel.SidePanel.Instance.open(this.#id, {
				width: this.#width,
				cacheable: this.#cacheable,
				contentCallback: () => {
					return layout.createContent({
						title: this.#title ?? '',
						extensions: this.#extensions,
						design: {
							section: false,
							margin: true
						},
						content: () => {
							return this.#componentContent().then(this.#prepareComponentResponse);
						},
						buttons: () => {
							return this.#buttons;
						}
					}).then(container => {
						return {
							html: container?.innerHTML ?? ''
						};
					});
				},
				events: this.#events
			});
		}
		#prepareComponentResponse(response) {
			let content = response?.data?.html;
			(response?.data?.assets.css || []).forEach(link => {
				content += `<link rel="stylesheet" href="${link}">`;
			});
			(response?.data?.assets.js || []).forEach(link => {
				content += `<script src="${link}"><\/script>`;
			});
			(response?.data?.assets.string || []).forEach(script => {
				content += script;
			});
			return content;
		}
	}

	class SecuritySection {
		#signedParameters;
		#userId;
		#isCloud;
		#passwordNetworkUrl;
		#signedUserId;
		constructor(options) {
			this.#signedParameters = options.signedParameters;
			this.#signedUserId = options.signedUserId;
			this.#userId = options.userId;
			this.#isCloud = options.isCloud === true;
			this.#passwordNetworkUrl = main_core.Type.isStringFilled(options.passwordNetworkUrl) ? options.passwordNetworkUrl : '';
			this.#setAnalyticsEventHandlers(options);
			this.#bindMenuItems(options);
		}
		open2FaSlider() {
			new ComponentSlider({
				id: 'user_profile_2fa',
				title: main_core.Loc.getMessage('INTRANET_USER_SECURITY_PUSH_OTP_AUTH'),
				width: 600,
				extensions: ['intranet.push-otp.connect-popup'],
				componentContent: () => {
					return BX.ajax.runComponentAction('bitrix:intranet.user.profile.security', 'otpList', {
						signedParameters: this.#signedParameters,
						mode: 'ajax',
						data: {
							userId: this.#userId
						}
					});
				},
				events: {
					onClose: () => {
						this.reload();
					}
				}
			}).open();
		}
		openOld2Fa() {
			BX.Intranet.UserProfile.Security.changeContent('otpList');
		}
		openChangePassword() {
			if (this.#isCloud) {
				if (main_core.Type.isStringFilled(this.#passwordNetworkUrl)) {
					window.open(this.#passwordNetworkUrl);
				} else {
					console.error('Password change URL is not defined.');
				}
			} else {
				this.openPasswordSlider();
			}
		}
		openPasswordSlider() {
			main_sidepanel.SidePanel.Instance.open(`/bitrix/components/bitrix/intranet.user.profile.password/index.php?userId=${main_core.Text.encode(this.#userId)}`, {
				cacheable: false,
				width: 700
			});
		}
		openOldPassword() {
			BX.Intranet.UserProfile.Security.changeContent('changePassword');
		}
		reload() {
			BX.Intranet.UserProfile.Security.changeContent('otpConnected');
		}
		logoutAll() {
			new intranet_logoutAllConfirm.LogoutAllConfirm().show();
		}
		renderPhoneConfirmationCounter(wrapper) {
			const counter = new ui_cnt.Counter({
				color: ui_cnt.Counter.Color.DANGER,
				size: ui_cnt.Counter.Size.MEDIUM,
				value: 1,
				style: ui_cnt.CounterStyle.FILLED_ALERT,
				useAirDesign: true
			});
			counter.renderTo(wrapper);
		}
		#setAnalyticsEventHandlers(options) {
			if (options.emailElement) {
				main_core.Event.bind(options.emailElement, 'click', () => {
					ui_analytics.sendData({
						tool: 'user_settings',
						category: 'security',
						event: 'click',
						c_element: 'email'
					});
				});
			}
			if (options.phoneElement) {
				main_core.Event.bind(options.phoneElement, 'click', () => {
					ui_analytics.sendData({
						tool: 'user_settings',
						category: 'security',
						event: 'click',
						c_element: 'phone'
					});
				});
			}
			if (options.socservElement) {
				main_core.Event.bind(options.socservElement, 'click', () => {
					ui_analytics.sendData({
						tool: 'user_settings',
						category: 'security',
						event: 'click',
						c_element: 'socserv'
					});
				});
			}
			if (options.passwordElement) {
				main_core.Event.bind(options.passwordElement, 'click', () => {
					ui_analytics.sendData({
						tool: 'user_settings',
						category: 'security',
						event: 'click',
						c_element: 'password'
					});
				});
			}
			if (options.profileManagementElement) {
				main_core.Event.bind(options.profileManagementElement, 'click', () => {
					ui_analytics.sendData({
						tool: 'user_settings',
						category: 'security',
						event: 'click',
						c_element: 'profile_management'
					});
				});
			}
		}
		#bindMenuItems(options) {
			if (!main_core.Type.isDomNode(options.profileManagementElement)) {
				return;
			}
			main_core.Event.bind(options.profileManagementElement, 'click', this.#showProfileManagementMenu.bind(this, options.profileManagementElement));
		}
		#showProfileManagementMenu(bindElement) {
			if (!main_core.Type.isDomNode(bindElement)) {
				return;
			}
			if (!this.profileManagementMenu) {
				this.profileManagementMenu = new ui_system_menu.Menu({
					id: 'intranet-user-profile-security-profile-management',
					cacheable: true,
					bindOptions: {
						forceBindPosition: true,
						forceLeft: true
					},
					items: [{
						title: main_core.Loc.getMessage('INTRANET_USER_SECURITY_PROFILE_MANAGEMENT_DELETE_PROFILE'),
						design: ui_system_menu.MenuItemDesign.Alert,
						dataset: {
							testid: 'intranet-user-security-delete-profile-menu-item'
						},
						onClick: this.#showSelfDeletePopup.bind(this)
					}],
					events: {
						onShow: () => {
							bindElement.setAttribute('aria-expanded', 'true');
						},
						onClose: () => {
							bindElement.setAttribute('aria-expanded', 'false');
							if (bindElement.isConnected) {
								bindElement.focus();
							}
						}
					}
				});
			}
			this.profileManagementMenu.show(bindElement);
			this.#adjustProfileManagementMenuPosition(bindElement);
		}
		#adjustProfileManagementMenuPosition(bindElement) {
			const popup = this.profileManagementMenu.getPopup();
			const popupWidth = popup.getPopupContainer().offsetWidth;
			const bindElementWidth = bindElement.getBoundingClientRect().width;
			popup.setOffset({
				offsetLeft: bindElementWidth - popupWidth,
				offsetTop: 0
			});
			popup.adjustPosition({
				forceBindPosition: true,
				forceLeft: true
			});
		}
		#showSelfDeletePopup() {
			return main_core.Runtime.loadExtension('intranet.user.self-delete-popup').then(popupExports => {
				const {
					SelfDeletePopup
				} = popupExports;
				return SelfDeletePopup.show();
			}).catch(error => {
				ui_notification.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('INTRANET_USER_SECURITY_SELF_DELETE_POPUP_ERROR'),
					autoHide: true,
					useAirDesign: true
				});
				console.error(error);
			});
		}
	}

	class BannerFactory {
		static create(options) {
			let bannerPushOtp = null;
			if (options.canShowBannerPushOtp) {
				if (!options.isOtpActive) {
					const popup = this.#getConnectPopup(options);
					bannerPushOtp = new intranet_notifyBanner_pushOtp.PushOtp({
						title: options.title,
						text: options.text,
						clickEnableBtn: () => {
							popup.show();
							this.#sendAnalyticEvent('banner_on');
						}
					});
				} else if (options.isNotPushOtp) {
					let clickDisableBtn = null;
					if (options.canDeactivate) {
						clickDisableBtn = event => {
							const menu = new intranet_pushOtp_menu.Menu(event.button, {
								days: options.days,
								callback: item => {
									intranet_pushOtp_connectPopup.pauseOtpRequest(item.numDays, options.signedUserId).then(() => BX.Intranet.UserProfile.Security.changeContent('otpConnected')).catch(response => console.error(response));
								}
							});
							menu.show();
							this.#sendAnalyticEvent('banner_off');
						};
					}
					const popup = this.#getConnectPopup(options);
					bannerPushOtp = new intranet_notifyBanner_pushOtp.PushOtp({
						title: options.title,
						text: options.text,
						clickEnableBtn: () => {
							popup.show();
							this.#sendAnalyticEvent('banner_on');
						},
						clickDisableBtn
					});
				}
			}
			return bannerPushOtp;
		}
		static #getConnectPopup(options) {
			const provider = new intranet_pushOtp_connectPopup.EnablePushOtpProvider(options);
			return provider.full();
		}
		static #sendAnalyticEvent(cElement) {
			ui_analytics.sendData({
				tool: 'user_settings',
				category: 'security',
				event: 'click',
				c_element: cElement
			});
		}
	}

	class RestoreNetworkPassword {
		#options;
		#cache = new main_core.Cache.MemoryCache();
		constructor(options) {
			this.#options = options;
		}
		renderTo(target) {
			if (this.#options.useEmail) {
				this.#getEmailRestoreButton().renderTo(target);
			}
			if (this.#options.usePhone) {
				this.#getPhoneRestoreButton().renderTo(target);
			}
		}
		#getEmailRestoreButton() {
			return this.#cache.remember('emailRestoreButton', () => {
				return new ui_buttons.Button({
					text: main_core.Loc.getMessage('INTRANET_USER_SECURITY_RESTORE_PASSWORD_BUTTON_EMAIL'),
					style: ui_buttons.AirButtonStyle.OUTLINE,
					useAirDesign: true,
					onclick: button => {
						button.setWaiting(true);
						main_core.ajax.runAction('bitrix24.v2.Password.restoreByEmail', {
							data: {
								userId: this.#options.userId
							}
						}).then(() => {
							button.setWaiting(false);
							this.#createPopup(this.#createSuccessContentByEmail()).show();
						}).catch(response => {
							button.setWaiting(false);
							if (response.errors[0].message) {
								this.#createPopup(this.#createErrorContent(response.errors[0].message)).show();
							}
						});
					}
				});
			});
		}
		#getPhoneRestoreButton() {
			return this.#cache.remember('phoneRestoreButton', () => {
				return new ui_buttons.Button({
					text: main_core.Loc.getMessage('INTRANET_USER_SECURITY_RESTORE_PASSWORD_BUTTON_PHONE'),
					style: ui_buttons.AirButtonStyle.OUTLINE,
					useAirDesign: true,
					onclick: button => {
						button.setWaiting(true);
						main_core.ajax.runAction('bitrix24.v2.Password.restoreByPhone', {
							data: {
								userId: this.#options.userId
							}
						}).then(() => {
							button.setWaiting(false);
							this.#createPopup(this.#createSuccessContentByPhone()).show();
						}).catch(response => {
							button.setWaiting(false);
							if (response.errors[0].message) {
								this.#createPopup(this.#createErrorContent(response.errors[0].message)).show();
							}
						});
					}
				});
			});
		}
		#createSuccessContentByEmail() {
			return main_core.Tag.render`
			<div class="b24network-account-popup-inner">
				<div class="b24network-account-popup-text">${main_core.Loc.getMessage('INTRANET_USER_SECURITY_RESTORE_PASSWORD_POPUP_DESCRIPTION_BY_EMAIL_MSGVER_1')}</div>
			</div>
		`;
		}
		#createSuccessContentByPhone() {
			return main_core.Tag.render`
			<div class="b24network-account-popup-inner">
				<div class="b24network-account-popup-text">${main_core.Loc.getMessage('INTRANET_USER_SECURITY_RESTORE_PASSWORD_POPUP_DESCRIPTION_BY_PHONE_MSGVER_1')}</div>
			</div>
		`;
		}
		#createErrorContent(errorMessage) {
			return main_core.Tag.render`
			<div class="b24network-account-popup-inner">
				<div class="b24network-account-popup-title">
					${main_core.Loc.getMessage('INTRANET_USER_SECURITY_RESTORE_PASSWORD_POPUP_TITLE_ERROR')}
				</div>
				<div class="b24network-account-popup-text">${main_core.Text.encode(errorMessage)}</div>
			</div>
		`;
		}
		#createPopup(content) {
			const popup = new main_popup.Popup({
				autoHide: true,
				className: 'b24network-account-popup',
				closeByEsc: true,
				closeIcon: true,
				content,
				cacheable: false,
				width: 450,
				buttons: [new ui_buttons.CloseButton({
					onclick() {
						popup.close();
					},
					useAirDesign: true
				})]
			});
			return popup;
		}
	}

	exports.BannerFactory = BannerFactory;
	exports.RestoreNetworkPassword = RestoreNetworkPassword;
	exports.SecuritySection = SecuritySection;

})(this.BX.Intranet = this.BX.Intranet || {}, BX, BX.SidePanel, BX.UI.Analytics, BX.UI, BX.UI.Notification, BX.UI.System, BX.Intranet, BX.Intranet.NotifyBanner, BX.Intranet.PushOtp, BX.Intranet.PushOtp, BX.UI, BX.Main);
//# sourceMappingURL=script.js.map
