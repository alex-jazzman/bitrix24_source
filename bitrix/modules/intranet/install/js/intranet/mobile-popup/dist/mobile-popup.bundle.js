/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, main_popup, ui_analytics, ui_autoLaunch, ui_bannerDispatcher, ui_buttons) {
	'use strict';

	class MobilePopup extends main_core_events.EventEmitter {
		#popup = null;
		#authLink = null;
		#isTablet = false;
		#continueInMobileBrowserClicked = false;
		#continueInTabletBrowserClicked = false;
		#collabId = null;
		#isCollaber = false;
		#isMobileContinueButton = false;
		#isTabletContinueButton = false;
		#position;
		constructor() {
			super();
			this.setEventNamespace('BX.Intranet.MobilePopup');
			this.#authLink = main_core.Extension.getSettings('intranet.mobile-popup').authLink;
			this.#collabId = main_core.Extension.getSettings('intranet.mobile-popup').collabId;
			this.#isCollaber = main_core.Extension.getSettings('intranet.mobile-popup').isCollaber;
			this.#continueInMobileBrowserClicked = main_core.Extension.getSettings('intranet.mobile-popup').continueInMobileBrowserClicked;
			this.#continueInTabletBrowserClicked = main_core.Extension.getSettings('intranet.mobile-popup').continueInTabletBrowserClicked;
			this.#isMobileContinueButton = main_core.Extension.getSettings('intranet.mobile-popup').isMobileContinueButton;
			this.#isTabletContinueButton = main_core.Extension.getSettings('intranet.mobile-popup').isTabletContinueButton;
			this.#isTablet = window.screen.width >= 768;
			this.#sendAnalytics('push_mobapp_show');
		}
		#calculatePopupPosition() {
			const isAirTemplate = BX.Reflection.getClass('BX.Intranet.Bitrix24.Template') !== null;
			const minHeight = 602;
			const minWidth = this.#isTablet ? 375 : 321;
			const height = window.screen.height - minHeight >= 0 ? (window.screen.height - minHeight) / 2 : 0;
			const width = window.screen.width - minWidth >= 0 ? (window.screen.width - minWidth) / 2 : 0;
			let offsetTop = height - window.screen.height;
			if (isAirTemplate) {
				offsetTop = height - document.body.scrollHeight;
			}
			this.#position = {
				minHeight,
				minWidth,
				offsetTop,
				offsetLeft: width
			};
		}
		#createPopup(onDone) {
			return main_popup.PopupWindowManager.create('main-intranet-mobile-popup', document.body, {
				overlay: true,
				borderRadius: '24px',
				contentBorderRadius: '24px',
				closeIcon: false,
				minWidth: this.#position.minWidth,
				minHeight: this.#position.minHeight,
				content: this.#getContent(),
				padding: 0,
				offsetTop: this.#position.offsetTop,
				offsetLeft: this.#position.offsetLeft,
				className: 'intranet-mobile-popup-wrapper',
				events: {
					onClose: () => {
						this.emit('onClose');
					},
					onAfterClose: () => {
						onDone();
					}
				}
			});
		}
		show() {
			return new Promise((resolve, reject) => {
				if (this.#isTablet && this.#continueInTabletBrowserClicked || !this.#isTablet && this.#continueInMobileBrowserClicked) {
					resolve(true);
					return;
				}
				const resolveOnBlockedSurface = () => {
					const canShowOnTop = ui_autoLaunch.Launcher.canShowOnTop();
					if (!canShowOnTop) {
						resolve(false);
					}
					return canShowOnTop;
				};
				ui_bannerDispatcher.BannerDispatcher.high.toQueue(onDone => {
					try {
						this.#calculatePopupPosition();
						this.#popup ??= this.#createPopup(onDone);
						this.#popup?.show();
						document.body.scrollIntoView();
						resolve(true);
					} catch (error) {
						reject(error);
						setTimeout(onDone);
					}
				}, {
					forceShowOnTop: resolveOnBlockedSurface
				});
			});
		}
		#getContent() {
			return main_core.Tag.render`
			<div class="intranet-mobile-popup">
				<div class="intranet-mobile-popup__content-wrapper">
					<div class="intranet-mobile-popup__main">
						<span class="intranet-mobile-popup__title">${main_core.Loc.getMessage('INTRANET_MOBILE_POPUP_TITLE')}</span>
						${this.#renderImage()}
						<p class="intranet-mobile-popup__description">${main_core.Loc.getMessage('INTRANET_MOBILE_POPUP_DESCRIPTION')}</p>
						${this.#renderContinueButton()}
					</div>
					${this.#renderFooter()}
				</div>
			</div>
		`;
		}
		#renderImage() {
			return main_core.Tag.render`
			<div class="intranet-mobile-popup__image"></div>
		`;
		}
		#renderFooter() {
			if (this.#isTablet && this.#isTabletContinueButton || !this.#isTablet && this.#isMobileContinueButton) {
				return main_core.Tag.render`
				<div class="intranet-mobile-popup__footer">
					${this.#renderHideButton()}
				</div>
			`;
			}
			return null;
		}
		#renderContinueButton() {
			let text = main_core.Loc.getMessage('INTRANET_MOBILE_POPUP_CONTINUE');
			if (this.#isTablet && this.#isTabletContinueButton || !this.#isTablet && this.#isMobileContinueButton) {
				text = main_core.Loc.getMessage('INTRANET_MOBILE_POPUP_OPEN_APP');
			}
			return new ui_buttons.Button({
				text,
				className: 'intranet-mobile-popup__button intranet-mobile-popup__button--continue',
				size: ui_buttons.Button.Size.LARGE,
				color: ui_buttons.Button.Color.SUCCESS,
				round: true,
				onclick: () => {
					this.#popup?.close();
					this.#sendAnalytics('push_mobapp_click_start');
					setTimeout(() => {
						window.location.href = this.#authLink;
					});
				}
			}).render();
		}
		#renderHideButton() {
			return new ui_buttons.CloseButton({
				text: main_core.Loc.getMessage('INTRANET_MOBILE_POPUP_CONTINUE_IN_BROWSER'),
				className: 'intranet-mobile-popup__button intranet-mobile-popup__button--hide',
				size: ui_buttons.Button.Size.SMALL,
				onclick: () => {
					this.#popup?.close();
					this.#sendAnalytics('push_mobapp_click_stay_browser');
					const optionName = this.#isTablet ? 'tabletPopupContinueToApp' : 'mobilePopupContinueToApp';
					BX.userOptions.save('intranet', optionName, null, 'Y');
				}
			}).render();
		}
		#sendAnalytics(event) {
			const params = {
				tool: 'intranet',
				category: 'activation',
				event,
				type: 'inside_portal',
				c_sub_section: 'push_to_mobapp',
				p2: `popupClosable_${this.#isTablet ? 'Y' : 'N'}`
			};
			if (this.#isCollaber) {
				params.p5 = `collabId_${this.#collabId}`;
			}
			ui_analytics.sendData(params);
		}
	}

	exports.MobilePopup = MobilePopup;

})(this.BX.Intranet = this.BX.Intranet || {}, BX, BX.Event, BX.Main, BX.UI.Analytics, BX.UI.AutoLaunch, BX.UI, BX.UI);
//# sourceMappingURL=mobile-popup.bundle.js.map
