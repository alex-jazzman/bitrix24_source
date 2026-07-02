/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_popup, sign_tour, sign_v2_b2e_signSettingsOnboarding, sign_v2_api, ui_bannerDispatcher, ui_iconSet_api_core, ui_buttons) {
	'use strict';

	var b2eWelcomeGif = "/bitrix/js/sign/onboarding/dist/assets/b2e_welcome.gif";

	const b2bHelpdeskCode = 16571388;
	const b2eCreateHelpdeskCode = 20338910;
	const b2eTemplatesHelpdeskCode = 24354462;
	const b2eWelcomeTourId = 'sign-b2e-onboarding-tour-id';
	const b2eTestSigningWelcomeTourId = 'sign-b2e-onboarding-tour-id-test-signing';
	class Onboarding {
		#api = new sign_v2_api.Api();
		#backend = new sign_tour.Backend();
		static closeSettingsMenuAndOpenTestSigningSlider(event, item) {
			if (item && main_core.Type.isFunction(item.getMenuWindow)) {
				const window = item.getMenuWindow();
				if (window) {
					window.close();
					new Onboarding().openTestSigningSlider();
					return;
				}
			}

			// eslint-disable-next-line unicorn/no-this-assignment
			const menu = this;
			if (menu && main_core.Type.isFunction(menu.close)) {
				menu.close();
			}
			new Onboarding().openTestSigningSlider();
		}
		async startB2eWelcomeOnboarding(options) {
			const tourId = b2eWelcomeTourId;
			const startOnboarding = await this.#shouldStartB2eOnboarding(tourId);
			if (!startOnboarding) {
				return;
			}
			ui_bannerDispatcher.BannerDispatcher.high.toQueue(onDone => {
				const guide = this.#getB2eWelcomeGuide(tourId, options, onDone);
				const welcomePopup = this.#createB2eWelcomePopup(guide);
				this.#backend.saveVisit(tourId);
				welcomePopup.show();
			});
		}
		async startB2eWelcomeOnboardingWithTestSigning(options) {
			const tourId = b2eTestSigningWelcomeTourId;
			const startOnboarding = await this.#shouldStartB2eOnboarding(tourId, true);
			if (!startOnboarding) {
				return;
			}
			ui_bannerDispatcher.BannerDispatcher.high.toQueue(onDone => {
				const guide = this.#getB2eWelcomeGuide(tourId, options, onDone);
				const welcomePopup = this.#createB2eWelcomePopupWithTestSigning(guide, options);
				this.#backend.saveVisit(tourId);
				welcomePopup.show();
			});
		}
		showTestSigningBanner(options) {
			const header = document.querySelector('.page__header');
			if (header) {
				const signButton = new ui_buttons.Button({
					color: ui_buttons.Button.Color.PRIMARY,
					size: ui_buttons.Button.Size.MEDIUM,
					round: true,
					noCaps: true,
					useAirDesign: true,
					style: ui_buttons.Button.AirStyle.FILL,
					text: main_core.Loc.getMessage('SIGN_ONBOARDING_B2E_BANNER_BTN_SIGN_TEST_TEXT'),
					className: `sign__b2e-onboarding-signing-test-banner-button ${options.showTariffSlider ? 'sign-b2e-js-tarriff-slider-trigger' : ''}`,
					events: options.showTariffSlider ? {} : {
						click: () => {
							this.openTestSigningSlider();
						}
					}
				});
				const onboardingBanner = main_core.Tag.render`
				<div class="sign__b2e-onboarding-signing-test-banner">
					<div class="sign__onboarding-banner-content_img"></div>
					<div class="sign__b2e-onboarding-signing-test-banner_content">
						<div class="sign__b2e-onboarding-signing-test-banner-title-container">
							<div class="sign__b2e-onboarding-signing-test-banner-title">
								${main_core.Loc.getMessage('SIGN_ONBOARDING_B2E_BANNER_TITLE_SIGN_TEST_TEXT')}
							</div>
							<button
									class="sign__b2e-onboarding-signing-test-banner_close_btn"
									onclick="${() => this.#showCloseOnboardingSigningWarningPopup()}">
							</button>
						</div>
						<div class="sign__b2e-onboarding-signing-test-banner-title-description">
						${main_core.Loc.getMessage('SIGN_ONBOARDING_B2E_BANNER_DESCRIPTION_SIGN_TEST_TEXT')}
						</div>
					</div>
				</div>
			`;
				main_core.Dom.append(signButton.render(), onboardingBanner.querySelector('.sign__b2e-onboarding-signing-test-banner_content'));
				header.insertAdjacentElement('afterend', onboardingBanner);
			}
		}
		#showCloseOnboardingSigningWarningPopup() {
			const popupContent = main_core.Tag.render`
			<div class="sign__b2e-close-onboarding-signing-warning-popup-content">
				${main_core.Loc.getMessage('SIGN_ONBOARDING_B2E_CLOSE_BANNER_WARNING_POPUP_CONTENT_MSGVER_1')}
			</div>
		`;
			const popup = new main_popup.Popup({
				id: 'sign__b2e-close-onboarding-signing-banner-warning-popup',
				content: popupContent,
				minHeigh: 180,
				width: 400,
				padding: 20,
				contentColor: 'white',
				overlay: true,
				closeByEsc: true,
				buttons: [new ui_buttons.Button({
					id: 'sign__b2e-close-onboarding-signing-banner-warning-popup-confirm-button',
					text: main_core.Loc.getMessage('SIGN_ONBOARDING_B2E_CLOSE_BANNER_WARNING_POPUP_CONFIRM_BUTTON_MSGVER_1'),
					useAirDesign: true,
					style: ui_buttons.Button.AirStyle.FILLED,
					events: {
						click: () => {
							popup.close();
							const banner = document.querySelector('.sign__b2e-onboarding-signing-test-banner');
							if (banner) {
								banner.remove();
								this.#api.hideOnboardingSigningBanner();
							}
						}
					}
				})]
			});
			popup.show();
		}
		#getB2eWelcomeGuide(tourId, options, onFinish) {
			return new sign_tour.Guide({
				id: tourId,
				autoSave: true,
				simpleMode: false,
				events: {
					onFinish
				},
				steps: [this.#createB2eNewDocumentButtonStep('.ui-toolbar-after-title-buttons > .sign-b2e-onboarding-create', options.region), ...(options.byEmployeeEnabled ? [this.#createB2eKanbanRouteStep('.ui-toolbar-after-title-buttons > .sign-b2e-onboarding-route')] : []), this.#createB2eTemplatesStep(this.#isTemplateBtnVisible() ? 'div#sign_sign_b2e_employee_template_list' : 'div#sign_more_button')]
			});
		}
		getB2bGuide(target) {
			return new sign_tour.Guide({
				id: 'sign-tour-guide-sign-start-kanban',
				autoSave: true,
				simpleMode: true,
				steps: [{
					target,
					title: main_core.Loc.getMessage('SIGN_ONBOARDING_B2B_BTN_TITLE'),
					text: main_core.Loc.getMessage('SIGN_ONBOARDING_B2B_BTN_TEXT'),
					article: b2bHelpdeskCode
				}]
			});
		}
		#createB2eWelcomePopupWithTestSigning(guide, options) {
			const popupTitle = main_core.Loc.getMessage('SIGN_ONBOARDING_B2E_WELCOME_POPUP_TITLE');
			const buttons = [];
			if (options.canEditDocument && options.canCreateDocument) {
				buttons.push(new ui_buttons.Button({
					id: 'sign__b2e-onboarding-welcome-popup_sign__onboarding-signing-popup-button',
					color: ui_buttons.Button.Color.PRIMARY,
					size: ui_buttons.Button.Size.MEDIUM,
					round: true,
					noCaps: true,
					useAirDesign: true,
					style: ui_buttons.Button.AirStyle.FILL,
					text: main_core.Loc.getMessage('SIGN_ONBOARDING_B2E_WELCOME_POPUP_BTN_SIGN_TEST_TEXT'),
					className: `sign__b2e-onboarding-welcome-popup_sign__onboarding-popup-button ${options.showTariffSlider ? 'sign-b2e-js-tarriff-slider-trigger' : ''}`,
					events: options.showTariffSlider ? {} : {
						click: () => {
							popup.close();
							this.openTestSigningSlider();
						}
					}
				}));
			}
			buttons.push(new ui_buttons.Button({
				id: 'sign__b2e-onboarding-welcome-popup_sign__onboarding-tour-popup-button',
				color: ui_buttons.Button.Color.PRIMARY,
				size: ui_buttons.Button.Size.MEDIUM,
				round: true,
				noCaps: true,
				useAirDesign: true,
				style: ui_buttons.Button.AirStyle.OUTLINE,
				text: main_core.Loc.getMessage('SIGN_ONBOARDING_B2E_WELCOME_POPUP_BTN_TEXT_RU'),
				className: 'sign__b2e-onboarding-welcome-popup_sign__onboarding-popup-button',
				events: {
					click() {
						popup.close();
						guide.start();
					}
				}
			}));
			const popup = new main_popup.Popup({
				id: 'sign__b2e-onboarding-welcome-popup',
				className: 'sign__b2e-onboarding-welcome-popup',
				closeIcon: true,
				width: 690,
				height: 322,
				padding: 20,
				overlay: true,
				buttons,
				content: main_core.Tag.render`
				<div class="sign__onboarding-popup-content">
					<div class="sign__onboarding-popup-content_header">
						<div class="sign__onboarding-popup-content_header-title">
							${popupTitle}
						</div>
					</div>
					<div class="sign__onboarding-popup-content_body">
						<div class="sign__onboarding-popup-content_img"></div>
						<div class="sign__onboarding-popup-content_text_container">
							<div class="sign__onboarding-popup-content_text">
								${main_core.Loc.getMessage('SIGN_ONBOARDING_B2E_WELCOME_POPUP_TEXT')}
							</div>
						</div>
					</div>
				</div>
			`
			});
			return popup;
		}
		#createB2eWelcomePopup(guide) {
			const popupTitle = main_core.Loc.getMessage('SIGN_ONBOARDING_B2E_WELCOME_POPUP_TITLE_WEST');
			const popup = new main_popup.Popup({
				className: 'sign__b2e-onboarding-welcome-popup',
				closeIcon: false,
				width: 500,
				height: 517,
				padding: 20,
				buttons: [new ui_buttons.Button({
					color: ui_buttons.Button.Color.PRIMARY,
					size: ui_buttons.Button.Size.SMALL,
					round: true,
					noCaps: true,
					text: main_core.Loc.getMessage('SIGN_ONBOARDING_B2E_WELCOME_POPUP_BTN_TEXT'),
					className: 'sign__b2e-onboarding-welcome-popup_start-guide',
					events: {
						click() {
							popup.close();
							guide.start();
						}
					}
				})],
				content: main_core.Tag.render`
				<div class="sign__onboarding-popup-content">
					<div class="sign__onboarding-popup-content_header">
						<div class="sign__onboarding-popup-content_header-icon">
							${this.#renderIcon()}
						</div>
						<div class="sign__onboarding-popup-content_header-title">
							${popupTitle}
						</div>
					</div>
					<div class="sign__onboarding-popup-content_promo-video-wrapper">
						<img src="${b2eWelcomeGif}" alt="video">
					</div>
					<div class="sign__onboarding-popup-content_footer">
						${main_core.Loc.getMessage('SIGN_ONBOARDING_B2E_WELCOME_POPUP_TEXT')}
					</div>
				</div>
			`
			});
			return popup;
		}
		#renderIcon() {
			const color = getComputedStyle(document.body).getPropertyValue('--ui-color-on-primary');
			const icon = new ui_iconSet_api_core.Icon({
				color,
				size: 18,
				icon: ui_iconSet_api_core.Actions.PENCIL_DRAW
			});
			return icon.render();
		}
		openTestSigningSlider() {
			BX.SidePanel.Instance.open('onboarding-signing-slider', {
				width: 750,
				contentCallback: () => {
					const containerId = 'onboarding-signing-slider-container';
					const container = main_core.Tag.render`<div id="${containerId}"></div>`;
					const onboardingSignSettings = new sign_v2_b2e_signSettingsOnboarding.B2EOnboardingSignSettings();
					onboardingSignSettings.renderToContainer(container);
					return container;
				}
			});
		}
		#createB2eNewDocumentButtonStep(target, region) {
			const firstStepMsgTitle = region === 'ru' ? main_core.Loc.getMessage('SIGN_ONBOARDING_B2E_STEP_CREATE_TITLE_RU') : main_core.Loc.getMessage('SIGN_ONBOARDING_B2E_STEP_CREATE_TITLE');
			const firstStepMsgText = region === 'ru' ? main_core.Loc.getMessage('SIGN_ONBOARDING_B2E_STEP_CREATE_TEXT_RU') : main_core.Loc.getMessage('SIGN_ONBOARDING_B2E_STEP_CREATE_TEXT');
			return {
				target,
				title: firstStepMsgTitle,
				text: firstStepMsgText,
				article: b2eCreateHelpdeskCode
			};
		}
		#createB2eTemplatesStep(target) {
			return {
				target,
				title: main_core.Loc.getMessage('SIGN_ONBOARDING_B2E_STEP_TEMPLATES_TITLE_V1'),
				text: main_core.Loc.getMessage('SIGN_ONBOARDING_B2E_STEP_TEMPLATES_TEXT_V1'),
				article: b2eTemplatesHelpdeskCode
			};
		}
		#createB2eKanbanRouteStep(target) {
			return {
				target,
				title: main_core.Loc.getMessage('SIGN_ONBOARDING_B2E_STEP_ROUTE_TITLE'),
				text: main_core.Loc.getMessage('SIGN_ONBOARDING_B2E_STEP_ROUTE_TEXT')
			};
		}
		async #shouldStartB2eOnboarding(tourId, checkDocuments = false) {
			const {
				lastVisitDate
			} = await this.#backend.getLastVisitDate(tourId);
			if (main_core.Type.isNull(lastVisitDate) && checkDocuments) {
				const {
					hasSignedDocuments
				} = await this.#api.hasSignedDocuments();
				if (hasSignedDocuments) {
					return false;
				}
			}
			return main_core.Type.isNull(lastVisitDate);
		}
		#isTemplateBtnVisible() {
			return document.querySelector('div#sign_sign_b2e_employee_template_list')?.offsetParent !== null;
		}
	}

	exports.Onboarding = Onboarding;

})(this.BX.Sign = this.BX.Sign || {}, BX, BX.Main, BX.Sign.Tour, BX.Sign.V2.B2e, BX.Sign.V2, BX.UI, BX.UI.IconSet, BX.UI);
//# sourceMappingURL=onboarding.bundle.js.map
