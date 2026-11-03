/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_vue3_pinia, ui_vue3) {
	'use strict';

	const MARKET_APPLICATION_LIMIT_EXCEEDED = 'MARKET_APPLICATION_LIMIT_EXCEEDED';
	let vibePlusApplicationLimitPopupPromise = null;
	async function showVibePlusApplicationLimitPopup(projection) {
		try {
			vibePlusApplicationLimitPopupPromise ??= main_core.Runtime.loadExtension('market.vibe-plus-application-limit-popup').catch(error => {
				vibePlusApplicationLimitPopupPromise = null;
				throw error;
			});
			const loadedExtension = await vibePlusApplicationLimitPopupPromise;
			const extension = Array.isArray(loadedExtension) ? loadedExtension[0] : loadedExtension;
			return extension.showVibePlusApplicationLimitPopup(projection);
		} catch {
			return false;
		}
	}
	function getCurrentSlider() {
		return BX.SidePanel?.Instance?.getSliderByWindow(window) ?? null;
	}
	const INSTALL_POPUP_WIDTH = 508;
	const INSTALLING_POPUP_WIDTH = 480;
	const INSTALLING_POPUP_HEIGHT = 288;
	const SUCCESS_POPUP_WIDTH = 480;
	const INSTALLING_POPUP_CLASS = '--installation-progress';
	const DEFAULT_OPEN_APP_AFTER_INSTALL = 15;
	const marketInstallState = ui_vue3_pinia.defineStore('market-install', {
		state: () => ({
			appInfo: [],
			installStep: 1,
			licenseInfo: {},
			licenseAgreements: {
				tos: false,
				eula: false,
				privacy: false
			},
			licenseError: '',
			installPopup: null,
			installResult: {},
			redirectPriority: false,
			openAppAfterInstall: DEFAULT_OPEN_APP_AFTER_INSTALL,
			timer: null,
			installError: false,
			requestSent: false,
			slider: {
				install: 'install',
				support: 'support',
				scope: 'scope'
			},
			popupNodes: {},
			versionSlider: {
				currentItem: 0,
				count: 0
			}
		}),
		actions: {
			cleanLicenseError() {
				this.licenseError = '';
			},
			setPopupNode(appCode, popup) {
				this.popupNodes[appCode] = popup;
			},
			setAppInfo(appInfo) {
				this.appInfo = appInfo;
				this.requestSent = !!(appInfo && appInfo.HAS_ACTIVE_INSTALL_REQUEST === 'Y');
			},
			prepareInstallContext(appInfo, licenseInfo) {
				this.$patch(state => {
					state.appInfo = appInfo;
					state.installStep = 1;
					state.licenseInfo = licenseInfo ?? {};
					state.licenseAgreements = {
						tos: false,
						eula: false,
						privacy: false
					};
					state.licenseError = '';
				});
			},
			setLicenseInfo(licenseInfo) {
				this.licenseInfo = licenseInfo;
			},
			setLicenseAgreement(key, value) {
				if (!Object.prototype.hasOwnProperty.call(this.licenseAgreements, key)) {
					return;
				}
				this.licenseAgreements[key] = Boolean(value);
			},
			resetLicenseAgreements() {
				this.licenseAgreements = {
					tos: false,
					eula: false,
					privacy: false
				};
			},
			willOpenAppAfterInstall() {
				return !!this.installResult.open;
			},
			isSubscriptionApp() {
				return this.appInfo.BY_SUBSCRIPTION === 'Y';
			},
			isHiddenBuy() {
				return this.appInfo.HIDDEN_BUY === 'Y';
			},
			resetInstallStep() {
				this.installStep = 1;
				this.resizeInstallPopup(INSTALL_POPUP_WIDTH, null, true);
			},
			showInstallPopup(isUpdate = false) {
				if (!this.popupNodes[this.appInfo.CODE]) {
					return;
				}
				if (isUpdate) {
					this.initSlider();
				}
				this.installPopup?.close();
				this.installPopup = ui_vue3.markRaw(new BX.Main.Popup({
					content: this.popupNodes[this.appInfo.CODE],
					ariaLabel: BX.message(isUpdate ? 'MARKET_INSTALL_POPUP_UPDATE_ARIA_LABEL' : 'MARKET_INSTALL_POPUP_INSTALL_ARIA_LABEL'),
					overlay: true,
					closeIcon: true,
					autoHide: true,
					closeByEsc: true,
					width: INSTALL_POPUP_WIDTH,
					borderRadius: 20,
					padding: 0,
					className: 'market-popup__window'
				}));
				this.installPopup.getPopupContainer().querySelector('.popup-window-close-icon')?.setAttribute('data-testid', 'market-popup-install-close-button');
				this.installPopup.show();
			},
			closeInstallPopup() {
				this.installPopup?.close();
				this.installPopup = null;
			},
			isInstallPopupEvent(event) {
				return this.installPopup !== null && event?.getTarget?.() === this.installPopup;
			},
			checkLicense() {
				if (this.installStep !== 1) {
					return false;
				}
				const needTos = Boolean(this.licenseInfo.TERMS_OF_SERVICE_TEXT);
				const needEula = Boolean(this.licenseInfo.EULA_TEXT);
				const needPrivacy = Boolean(this.licenseInfo.PRIVACY_TEXT);
				if (needTos && !this.licenseAgreements.tos) {
					this.licenseError = BX.message('MARKET_INSTALL_TOS_ERROR_MSGVER_2');
					return false;
				}
				if (needEula && !this.licenseAgreements.eula || needPrivacy && !this.licenseAgreements.privacy) {
					this.licenseError = BX.message('MARKET_INSTALL_LICENSE_ERROR');
					return false;
				}
				return true;
			},
			submitInstallStep() {
				if (!this.checkLicense()) {
					return;
				}
				this.goToInstallStep2();
			},
			goToInstallStep2() {
				this.installError = false;
				this.installResult = {};
				this.installStep = 2;
				this.resizeInstallPopup(INSTALLING_POPUP_WIDTH, INSTALLING_POPUP_HEIGHT, false);
				let params = this.appInfo.INSTALL_INFO;
				params.IFRAME = location.href.indexOf("IFRAME=Y") > 0;
				this.queryInstall(params);
			},
			queryInstall(params) {
				let queryParam = {
					code: params.CODE
				};
				if (!!params.VERSION) {
					queryParam.version = params.VERSION;
				}
				const analytics = queryParam;
				if (!!params.CHECK_HASH) {
					queryParam.checkHash = params.CHECK_HASH;
					queryParam.installHash = params.INSTALL_HASH;
				}
				return BX.ajax.runAction('market.Application.install', {
					data: queryParam,
					analyticsLabel: analytics
				}).then(response => this.installFinish(response), () => this.handleInstallError());
			},
			async installFinish(response) {
				const result = !!response.data ? response.data : response;
				this.installResult = result;
				if (!result.error && this.appInfo.hasOwnProperty('ADDITIONAL_ACTION') && this.appInfo.ADDITIONAL_ACTION) {
					try {
						eval(this.appInfo.ADDITIONAL_ACTION);
					} catch (e) {}
				}
				if (!!result.error) {
					if (result.error === MARKET_APPLICATION_LIMIT_EXCEEDED && (await showVibePlusApplicationLimitPopup(result.vibePlusApplicationLimit))) {
						this.installError = true;
						return;
					}
					const errorMessage = result.error + (!!result.errorDescription ? '<br />' + result.errorDescription : '');
					this.handleInstallError(errorMessage, result.helperCode);
				} else if (!!result.redirect && this.redirectPriority === true) {
					top.location.href = result.redirect;
				} else {
					if (!!result.installed) {
						let eventResult = {};
						top.BX.onCustomEvent(top, 'Rest:AppLayout:ApplicationInstall', [true, eventResult], false);
					}
					if (this.appInfo.TYPE === 'B') {
						this.openApplication();
						return;
					}
					if (this.isConfigurationAppInstall()) {
						this.reloadSlider();
						return;
					}
					this.openAppAfterInstall = this.getOpenAppAfterInstallDelay();
					this.installStep = 3;
					this.resizeInstallPopup(SUCCESS_POPUP_WIDTH, null, true);
					this.stopOpenAppAfterInstall();
					if (this.willOpenAppAfterInstall()) {
						this.timer = setInterval(() => {
							this.openAppAfterInstall--;
							if (this.openAppAfterInstall === 0) {
								this.openApplication();
							}
						}, 1000);
					}
				}
			},
			handleInstallError(errorMessage = '', helperCode = '') {
				this.installError = true;
				this.resetInstallStep();
				if (helperCode) {
					top.BX.UI.InfoHelper.show(helperCode);
				}
				this.showError(errorMessage || main_core.Loc.getMessage('MARKET_INSTALL_REQUEST_ERROR'));
			},
			showError: function (message) {
				BX.UI.Notification.Center.notify({
					content: message,
					autoHideDelay: 12000
				});
			},
			getOpenAppAfterInstallDelay() {
				const delay = parseInt(this.appInfo?.INSTALL_INFO?.OPEN_APP_AFTER_INSTALL, 10);
				return Number.isInteger(delay) && delay > 0 ? delay : DEFAULT_OPEN_APP_AFTER_INSTALL;
			},
			stopOpenAppAfterInstall() {
				if (this.timer === null) {
					return;
				}
				clearInterval(this.timer);
				this.timer = null;
				this.openAppAfterInstall = this.getOpenAppAfterInstallDelay();
			},
			openApplication: function () {
				this.stopOpenAppAfterInstall();
				let closeCallback = this.closeDetailAfterInstall() ? this.closeSliderUnderApplication : false;
				const current = getCurrentSlider();
				const previous = current ? BX.SidePanel.Instance.getPreviousSlider(current) : null;
				if (this.willOpenAppAfterInstall()) {
					top.BX.rest.AppLayout.openApplication(this.installResult.id, this.appInfo.INSTALL_INFO.PLACEMENT_OPTIONS, false, closeCallback);
				}
				if (previous && !this.closeDetailAfterInstall()) {
					previous.reload();
				}
				current?.reload();
				if (this.isConfigurationAppInstall()) {
					BX.SidePanel.Instance.open(this.installResult.openSlider);
				}
			},
			closeSliderUnderApplication: function () {
				const current = BX.SidePanel.Instance.getTopSlider();
				const previous = BX.SidePanel.Instance.getPreviousSlider(current);
				if (previous) {
					previous.close();
				}
			},
			closeDetailAfterInstall: function () {
				return this.appInfo.INSTALL_INFO && this.appInfo.INSTALL_INFO.hasOwnProperty('CLOSE_DETAIL_AFTER_INSTALL') && this.appInfo.INSTALL_INFO.CLOSE_DETAIL_AFTER_INSTALL === 'Y';
			},
			isConfigurationAppInstall: function () {
				return !!this.installResult.openSlider;
			},
			canShowAppForm: function () {
				return !!this.installResult.canShowForm;
			},
			reloadSlider: function () {
				getCurrentSlider()?.reload();
			},
			resizeInstallPopup(width, height = null, canClose = true) {
				const popup = this.installPopup;
				if (!popup) {
					return;
				}
				popup.setWidth(width);
				popup.setHeight(height);
				popup.setAutoHide(canClose);
				popup.setClosingByEsc(canClose);
				const popupContainer = popup.getPopupContainer();
				if (canClose) {
					popupContainer.classList.remove(INSTALLING_POPUP_CLASS);
				} else {
					popupContainer.classList.add(INSTALLING_POPUP_CLASS);
				}
				ui_vue3.nextTick(() => {
					if (this.installPopup !== popup) {
						return;
					}
					popup.adjustPosition();
				});
			},
			openSliderWithContent: function (contentCode, width) {
				BX.SidePanel.Instance.open("market-detail-" + contentCode, {
					contentCallback: function () {
						const outerContainer = document.createElement('div');
						outerContainer.classList.add('market-detail-slider-content-container');
						const innerContainer = document.createElement('div');
						innerContainer.classList.add('market-detail-slider-content-inner');
						innerContainer.innerHTML = BX('market-slider-block-' + contentCode).innerHTML;
						outerContainer.appendChild(innerContainer);
						return outerContainer;
					},
					width: width || 650
				});
			},
			initSlider() {
				const versions = Array.isArray(this.appInfo.VERSIONS_FORMAT) ? this.appInfo.VERSIONS_FORMAT : [];
				this.versionSlider.count = versions.length;
				this.versionSlider.currentItem = this.versionSlider.count - 1;
			},
			prevVersion() {
				if (this.versionSlider.count <= 0) {
					return;
				}
				this.versionSlider.currentItem = (this.versionSlider.currentItem - 1 + this.versionSlider.count) % this.versionSlider.count;
			},
			nextVersion() {
				if (this.versionSlider.count <= 0) {
					return;
				}
				this.versionSlider.currentItem = (this.versionSlider.currentItem + 1) % this.versionSlider.count;
			},
			buildAppForm: function (clientId) {
				return top.BX.Rest.AppForm.buildByApp(clientId, top.BX.Rest.EventType.INSTALL);
			},
			requestInstall(code, version = null, checkHash = null, installHash = null) {
				const data = {
					code
				};
				if (version !== null) {
					data.version = version;
				}
				if (checkHash !== null) {
					data.checkHash = checkHash;
					data.installHash = installHash;
				}
				return BX.ajax.runAction('market.Application.requestInstall', {
					data
				}).then(() => {
					this.requestSent = true;
					return true;
				}, response => {
					const message = response && BX.Type.isArrayFilled(response.errors) && response.errors[0].message ? response.errors[0].message : BX.message('MARKET_DETAIL_ACTION_JS_REQUEST_ERROR');
					const notificationCenter = top.BX?.UI?.Notification?.Center;
					if (notificationCenter) {
						notificationCenter.notify({
							content: message,
							autoHideDelay: 12000
						});
					}
					return false;
				});
			}
		}
	});

	exports.marketInstallState = marketInstallState;

})(this.BX.Market = this.BX.Market || {}, BX, BX.Vue3.Pinia, BX.Vue3);
