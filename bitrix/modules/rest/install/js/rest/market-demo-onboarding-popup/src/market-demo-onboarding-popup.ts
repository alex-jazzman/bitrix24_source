import { Dom, Loc, Tag, Type } from 'main.core';
import { Popup } from 'main.popup';
import { SidePanel } from 'main.sidepanel';
import { AirButtonStyle, Button, ButtonIcon, ButtonSize } from 'ui.buttons';
import { Icon, Outline } from 'ui.icon-set.api.core';
import 'ui.icon-set.outline';
import { FeaturePromotersRegistry } from 'ui.info-helper';
import { Text as TypographyText } from 'ui.system.typography';

import { MarketDemoOnboardingAnalytics } from './analytics';
import {
	AI_GUIDE_SLIDER_CODE,
	isMarketDemoOnboardingVariant,
	MARKET_COLLECTION_URL,
	VARIANT_A,
} from './const';
import { type MarketDemoOnboardingPopupSettings } from './types';
import './style.css';

type Feature = {
	icon: string;
	messageCode: string;
};

const WHITE_ICON_COLOR = 'var(--ui-color-design-filled-content-icon)';
const AI_GUIDE_SLIDER_WIDTH = 1300;

export class MarketDemoOnboardingPopup
{
	#settings: MarketDemoOnboardingPopupSettings;
	#analytics: MarketDemoOnboardingAnalytics;
	#popup: Popup | null = null;
	#isNavigationStarted: boolean = false;
	#isShownHandled: boolean = false;
	#isCloseHandled: boolean = false;

	constructor(settings: MarketDemoOnboardingPopupSettings)
	{
		this.#settings = settings;
		this.#analytics = new MarketDemoOnboardingAnalytics();
	}

	static start(settings: MarketDemoOnboardingPopupSettings): void
	{
		MarketDemoOnboardingPopup.create(settings)?.show();
	}

	static create(settings: MarketDemoOnboardingPopupSettings): Popup | null
	{
		if (
			!Type.isPlainObject(settings)
			|| !isMarketDemoOnboardingVariant(settings.variant)
			|| !Type.isBoolean(settings.isMarketRenamed)
			|| !Type.isString(settings.copilotName)
		)
		{
			return null;
		}

		return new MarketDemoOnboardingPopup(settings).#create();
	}

	#create(): Popup
	{
		this.#popup = new Popup({
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
				blur: '2px',
			},
			autoHide: true,
			cacheable: false,
			closeByEsc: true,
			closeIcon: false,
			disableScroll: true,
			focusTrap: true,
			role: 'dialog',
			ariaLabel: Loc.getMessage('REST_MARKET_DEMO_ONBOARDING_POPUP_ARIA_LABEL') ?? '',
			events: {
				onAfterShow: this.#handleAfterShow,
				onClose: this.#handleClose,
			},
		});

		Dom.attr(this.#popup.getPopupContainer(), 'aria-modal', 'true');

		return this.#popup;
	}

	#handleAfterShow = (): void => {
		if (this.#isShownHandled)
		{
			return;
		}

		this.#isShownHandled = true;
		this.#focusCloseButton();

		try
		{
			BX.userOptions.save('rest', 'marketDemoOnboardingPopupShown', null, 'Y');
		}
		catch
		{
			// The popup must stay usable if persistence is temporarily unavailable.
		}

		this.#sendAnalytics('sendShow');
	};

	#focusCloseButton(): void
	{
		const closeButton = this.#popup
			?.getPopupContainer()
			.querySelector<HTMLButtonElement>('.rest-market-demo-onboarding-popup__close');

		closeButton?.focus({ preventScroll: true });
	}

	#handleClose = (): void => {
		if (this.#isNavigationStarted || this.#isCloseHandled)
		{
			return;
		}

		this.#isCloseHandled = true;
		this.#sendAnalytics('sendClose');
	};

	#handleCtaClick = (): void => {
		this.#isNavigationStarted = true;
		this.#sendAnalytics('sendDownload');

		try
		{
			this.#openTarget();
		}
		finally
		{
			this.#popup?.close();
		}
	};

	#openTarget(): void
	{
		if (this.#settings.variant === VARIANT_A)
		{
			SidePanel.Instance.open(MARKET_COLLECTION_URL, {
				cacheable: false,
			});

			return;
		}

		FeaturePromotersRegistry.getPromoter({ code: AI_GUIDE_SLIDER_CODE }).show({
			width: AI_GUIDE_SLIDER_WIDTH,
		});
	}

	#sendAnalytics(method: 'sendShow' | 'sendClose' | 'sendDownload'): void
	{
		try
		{
			this.#analytics[method]();
		}
		catch
		{
			// Analytics must not affect the popup flow.
		}
	}

	#renderContent(): HTMLElement
	{
		const testIdPrefix = `market-demo-onboarding-popup-web-${this.#settings.variant.replace('_', '-')}`;
		const cta = this.#createCta(testIdPrefix);
		const title = TypographyText.render(this.#getTitle(), {
			size: '2xl',
			tag: 'h2',
			className: 'rest-market-demo-onboarding-popup__title',
		});
		const subtitle = TypographyText.render(
			Loc.getMessage('REST_MARKET_DEMO_ONBOARDING_POPUP_SUBTITLE') ?? '',
			{
				size: 'xl',
				tag: 'p',
				className: 'rest-market-demo-onboarding-popup__subtitle',
			},
		);

		return Tag.render`
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

	#renderFeatures(): HTMLElement
	{
		const features: Feature[] = [
			{
				icon: Outline.COMPASS,
				messageCode: 'REST_MARKET_DEMO_ONBOARDING_POPUP_FEATURE_WORKSPACE',
			},
			{
				icon: Outline.APPS,
				messageCode: 'REST_MARKET_DEMO_ONBOARDING_POPUP_FEATURE_TOOLS',
			},
			{
				icon: this.#settings.variant === VARIANT_A ? Outline.ROCKET : Outline.AI_STARS,
				messageCode: this.#settings.variant === VARIANT_A
					? 'REST_MARKET_DEMO_ONBOARDING_POPUP_FEATURE_APPS'
					: 'REST_MARKET_DEMO_ONBOARDING_POPUP_FEATURE_AI',
			},
		];

		return Tag.render`
			<ul class="rest-market-demo-onboarding-popup__features">
				${features.map((feature) => this.#renderFeature(feature))}
			</ul>
		`;
	}

	#renderFeature(feature: Feature): HTMLElement
	{
		const icon = new Icon({
			icon: feature.icon,
			size: 22,
			color: WHITE_ICON_COLOR,
		});
		const text = TypographyText.render(Loc.getMessage(feature.messageCode) ?? '', {
			size: 'lg',
			className: 'rest-market-demo-onboarding-popup__feature-text',
		});

		return Tag.render`
			<li class="rest-market-demo-onboarding-popup__feature">
				<span class="rest-market-demo-onboarding-popup__feature-icon" aria-hidden="true">
					${icon.render()}
				</span>
				${text}
			</li>
		`;
	}

	#createCta(testIdPrefix: string): Button
	{
		const isVariantA = this.#settings.variant === VARIANT_A;

		return new Button({
			useAirDesign: true,
			size: ButtonSize.EXTRA_LARGE,
			style: AirButtonStyle.FILLED_WHITE,
			icon: isVariantA ? ButtonIcon.CHEVRON_RIGHT_S : Outline.AI_STARS,
			collapsedIcon: isVariantA ? ButtonIcon.CHEVRON_RIGHT_S : ButtonIcon.AI,
			iconPosition: isVariantA ? 'right' : 'left',
			text: Loc.getMessage(
				isVariantA
					? 'REST_MARKET_DEMO_ONBOARDING_POPUP_CTA_APPS'
					: 'REST_MARKET_DEMO_ONBOARDING_POPUP_CTA_GUIDE',
			) ?? '',
			className: 'rest-market-demo-onboarding-popup__button',
			dataset: {
				testid: `${testIdPrefix}-${isVariantA ? 'apps' : 'guide'}-cta-btn`,
			},
			onclick: () => {
				this.#handleCtaClick();

				return {};
			},
		});
	}

	#renderCloseButton(testId: string): HTMLButtonElement
	{
		const icon = new Icon({
			icon: Outline.CROSS_M,
			size: 24,
			color: WHITE_ICON_COLOR,
		});

		return Tag.render`
			<button
				type="button"
				class="rest-market-demo-onboarding-popup__close"
				aria-label="${Loc.getMessage('REST_MARKET_DEMO_ONBOARDING_POPUP_CLOSE_ARIA_LABEL') ?? ''}"
				data-testid="${testId}"
				onclick="${() => this.#popup?.close()}"
			>
				${icon.render()}
			</button>
		`;
	}

	#renderDecoration(testIdPrefix: string): HTMLElement
	{
		return Tag.render`
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

	#getTitle(): string
	{
		return Loc.getMessage('REST_MARKET_DEMO_ONBOARDING_POPUP_TITLE', {
			'#SUBSCRIPTION_NAME#': this.#getSubscriptionName(),
		}) ?? '';
	}

	#getSubscriptionName(): string
	{
		if (!this.#settings.isMarketRenamed)
		{
			return Loc.getMessage('REST_MARKET_DEMO_ONBOARDING_POPUP_SUBSCRIPTION_MARKETPLACE') ?? '';
		}

		return Loc.getMessage('REST_MARKET_DEMO_ONBOARDING_POPUP_SUBSCRIPTION_RENAMED', {
			'#COPILOT_NAME#': this.#settings.copilotName,
		}) ?? '';
	}
}
