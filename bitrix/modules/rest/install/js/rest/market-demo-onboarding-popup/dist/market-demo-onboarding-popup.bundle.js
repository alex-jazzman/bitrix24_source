/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_popup, main_sidepanel, ui_buttons, ui_iconSet_api_core, ui_iconSet_outline, ui_infoHelper, ui_system_typography, ui_analytics) {
	'use strict';

	class MarketDemoOnboardingAnalytics {
		#sender;
		constructor(sender = ui_analytics.sendData) {
			this.#sender = sender;
		}
		sendShow() {
			this.#send('show');
		}
		sendClose() {
			this.#send('close');
		}
		sendDownload() {
			this.#send('download');
		}
		#send(event) {
			try {
				this.#sender({
					tool: 'infohelper',
					category: 'popup',
					type: 'market-demo-onboarding-popup',
					event
				});
			} catch {
			}
		}
	}

	const MARKET_COLLECTION_URL = '/market/collection/21378528/';
	const AI_GUIDE_SLIDER_CODE = 'bitrixgpt_guide';
	const VARIANT_A = 'variant_a';
	const VARIANT_B = 'variant_b';
	function isMarketDemoOnboardingVariant(value) {
		return main_core.Type.isString(value) && (value === VARIANT_A || value === VARIANT_B);
	}

	const WHITE_ICON_COLOR = 'var(--ui-color-design-filled-content-icon)';
	const AI_GUIDE_SLIDER_WIDTH = 1300;
	class MarketDemoOnboardingPopup {
		#settings;
		#analytics;
		#popup = null;
		#isNavigationStarted = false;
		#isShownHandled = false;
		#isCloseHandled = false;
		constructor(settings) {
			this.#settings = settings;
			this.#analytics = new MarketDemoOnboardingAnalytics();
		}
		static start(settings) {
			MarketDemoOnboardingPopup.create(settings)?.show();
		}
		static create(settings) {
			if (!main_core.Type.isPlainObject(settings) || !isMarketDemoOnboardingVariant(settings.variant) || !main_core.Type.isBoolean(settings.isMarketRenamed) || !main_core.Type.isString(settings.copilotName)) {
				return null;
			}
			return new MarketDemoOnboardingPopup(settings).#create();
		}
		#create() {
			this.#popup = new main_popup.Popup({
				id: 'rest-market-demo-onboarding-popup',
				className: 'rest-market-demo-onboarding-popup-window',
				content: this.#renderContent(),
				width: 900,
				padding: 0,
				contentPadding: 0,
				borderRadius: '32px',
				contentBorderRadius: '32px',
				contentBackground: 'transparent',
				overlay: {
					backgroundColor: 'var(--ui-color-base-black-fixed)',
					opacity: 40,
					blur: '2px'
				},
				autoHide: true,
				cacheable: false,
				closeByEsc: true,
				closeIcon: false,
				disableScroll: true,
				focusTrap: true,
				role: 'dialog',
				ariaLabel: main_core.Loc.getMessage('REST_MARKET_DEMO_ONBOARDING_POPUP_ARIA_LABEL') ?? '',
				events: {
					onAfterShow: this.#handleAfterShow,
					onClose: this.#handleClose
				}
			});
			main_core.Dom.attr(this.#popup.getPopupContainer(), 'aria-modal', 'true');
			return this.#popup;
		}
		#handleAfterShow = () => {
			if (this.#isShownHandled) {
				return;
			}
			this.#isShownHandled = true;
			this.#focusCloseButton();
			try {
				BX.userOptions.save('rest', 'marketDemoOnboardingPopupShown', null, 'Y');
			} catch {
			}
			this.#sendAnalytics('sendShow');
		};
		#focusCloseButton() {
			const closeButton = this.#popup?.getPopupContainer().querySelector('.rest-market-demo-onboarding-popup__close');
			closeButton?.focus({
				preventScroll: true
			});
		}
		#handleClose = () => {
			if (this.#isNavigationStarted || this.#isCloseHandled) {
				return;
			}
			this.#isCloseHandled = true;
			this.#sendAnalytics('sendClose');
		};
		#handleCtaClick = () => {
			this.#isNavigationStarted = true;
			this.#sendAnalytics('sendDownload');
			try {
				this.#openTarget();
			} finally {
				this.#popup?.close();
			}
		};
		#openTarget() {
			if (this.#settings.variant === VARIANT_A) {
				main_sidepanel.SidePanel.Instance.open(MARKET_COLLECTION_URL, {
					cacheable: false
				});
				return;
			}
			ui_infoHelper.FeaturePromotersRegistry.getPromoter({
				code: AI_GUIDE_SLIDER_CODE
			}).show({
				width: AI_GUIDE_SLIDER_WIDTH
			});
		}
		#sendAnalytics(method) {
			try {
				this.#analytics[method]();
			} catch {
			}
		}
		#renderContent() {
			const testIdPrefix = `market-demo-onboarding-popup-web-${this.#settings.variant.replace('_', '-')}`;
			const cta = this.#createCta(testIdPrefix);
			const title = ui_system_typography.Text.render(this.#getTitle(), {
				size: '2xl',
				tag: 'h2',
				className: 'rest-market-demo-onboarding-popup__title'
			});
			const subtitle = ui_system_typography.Text.render(main_core.Loc.getMessage('REST_MARKET_DEMO_ONBOARDING_POPUP_SUBTITLE') ?? '', {
				size: 'xl',
				tag: 'p',
				className: 'rest-market-demo-onboarding-popup__subtitle'
			});
			return main_core.Tag.render`
			<section
				class="rest-market-demo-onboarding-popup"
				data-testid="${testIdPrefix}-onboarding-popup"
			>
				<div class="rest-market-demo-onboarding-popup__content">
					${title}
					${subtitle}
					${this.#renderFeatures()}
					<div class="rest-market-demo-onboarding-popup__cta">
						${cta.render()}
					</div>
				</div>
				${this.#renderDecoration(testIdPrefix)}
				${this.#renderCloseButton(`${testIdPrefix}-close-onboarding-btn`)}
			</section>
		`;
		}
		#renderFeatures() {
			const features = [{
				icon: ui_iconSet_api_core.Outline.COMPASS,
				messageCode: 'REST_MARKET_DEMO_ONBOARDING_POPUP_FEATURE_WORKSPACE'
			}, {
				icon: ui_iconSet_api_core.Outline.APPS,
				messageCode: 'REST_MARKET_DEMO_ONBOARDING_POPUP_FEATURE_TOOLS'
			}, {
				icon: this.#settings.variant === VARIANT_A ? ui_iconSet_api_core.Outline.ROCKET : ui_iconSet_api_core.Outline.AI_STARS,
				messageCode: this.#settings.variant === VARIANT_A ? 'REST_MARKET_DEMO_ONBOARDING_POPUP_FEATURE_APPS' : 'REST_MARKET_DEMO_ONBOARDING_POPUP_FEATURE_AI'
			}];
			return main_core.Tag.render`
			<ul class="rest-market-demo-onboarding-popup__features">
				${features.map(feature => this.#renderFeature(feature))}
			</ul>
		`;
		}
		#renderFeature(feature) {
			const icon = new ui_iconSet_api_core.Icon({
				icon: feature.icon,
				size: 22,
				color: WHITE_ICON_COLOR
			});
			const text = ui_system_typography.Text.render(main_core.Loc.getMessage(feature.messageCode) ?? '', {
				size: 'lg',
				className: 'rest-market-demo-onboarding-popup__feature-text'
			});
			return main_core.Tag.render`
			<li class="rest-market-demo-onboarding-popup__feature">
				<span class="rest-market-demo-onboarding-popup__feature-icon" aria-hidden="true">
					${icon.render()}
				</span>
				${text}
			</li>
		`;
		}
		#createCta(testIdPrefix) {
			const isVariantA = this.#settings.variant === VARIANT_A;
			return new ui_buttons.Button({
				useAirDesign: true,
				size: ui_buttons.ButtonSize.EXTRA_LARGE,
				style: ui_buttons.AirButtonStyle.FILLED_WHITE,
				icon: isVariantA ? ui_buttons.ButtonIcon.CHEVRON_RIGHT_S : ui_iconSet_api_core.Outline.AI_STARS,
				collapsedIcon: isVariantA ? ui_buttons.ButtonIcon.CHEVRON_RIGHT_S : ui_buttons.ButtonIcon.AI,
				iconPosition: isVariantA ? 'right' : 'left',
				text: main_core.Loc.getMessage(isVariantA ? 'REST_MARKET_DEMO_ONBOARDING_POPUP_CTA_APPS' : 'REST_MARKET_DEMO_ONBOARDING_POPUP_CTA_GUIDE') ?? '',
				className: 'rest-market-demo-onboarding-popup__button',
				dataset: {
					testid: `${testIdPrefix}-${isVariantA ? 'apps' : 'guide'}-cta-btn`
				},
				onclick: () => {
					this.#handleCtaClick();
					return {};
				}
			});
		}
		#renderCloseButton(testId) {
			const icon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Outline.CROSS_M,
				size: 24,
				color: WHITE_ICON_COLOR
			});
			return main_core.Tag.render`
			<button
				type="button"
				class="rest-market-demo-onboarding-popup__close"
				aria-label="${main_core.Loc.getMessage('REST_MARKET_DEMO_ONBOARDING_POPUP_CLOSE_ARIA_LABEL') ?? ''}"
				data-testid="${testId}"
				onclick="${() => this.#popup?.close()}"
			>
				${icon.render()}
			</button>
		`;
		}
		#renderDecoration(testIdPrefix) {
			return main_core.Tag.render`
			<div class="rest-market-demo-onboarding-popup__decoration" aria-hidden="true">
				<div
					class="rest-market-demo-onboarding-popup__scene"
					data-testid="${testIdPrefix}-illustration"
				></div>
				<div
					class="rest-market-demo-onboarding-popup__tile --market"
					data-testid="${testIdPrefix}-tile-market"
				></div>
				<div
					class="rest-market-demo-onboarding-popup__tile --ai"
					data-testid="${testIdPrefix}-tile-ai"
				></div>
				<div
					class="rest-market-demo-onboarding-popup__tile --vibe"
					data-testid="${testIdPrefix}-tile-vibe"
				></div>
				<div
					class="rest-market-demo-onboarding-popup__hero"
					data-testid="${testIdPrefix}-hero"
				></div>
			</div>
		`;
		}
		#getTitle() {
			return main_core.Loc.getMessage('REST_MARKET_DEMO_ONBOARDING_POPUP_TITLE', {
				'#SUBSCRIPTION_NAME#': this.#getSubscriptionName()
			}) ?? '';
		}
		#getSubscriptionName() {
			if (!this.#settings.isMarketRenamed) {
				return main_core.Loc.getMessage('REST_MARKET_DEMO_ONBOARDING_POPUP_SUBSCRIPTION_MARKETPLACE') ?? '';
			}
			return main_core.Loc.getMessage('REST_MARKET_DEMO_ONBOARDING_POPUP_SUBSCRIPTION_RENAMED', {
				'#COPILOT_NAME#': this.#settings.copilotName
			}) ?? '';
		}
	}

	function releaseOnce(callback) {
		let isReleased = false;
		return () => {
			if (isReleased) {
				return;
			}
			isReleased = true;
			callback();
		};
	}

	exports.MarketDemoOnboardingPopup = MarketDemoOnboardingPopup;
	exports.releaseOnce = releaseOnce;

})(this.BX.Rest = this.BX.Rest || {}, BX, BX.Main, BX.SidePanel, BX.UI, BX.UI.IconSet, window, BX.UI, BX.UI.System.Typography, BX.UI.Analytics);
//# sourceMappingURL=market-demo-onboarding-popup.bundle.js.map
