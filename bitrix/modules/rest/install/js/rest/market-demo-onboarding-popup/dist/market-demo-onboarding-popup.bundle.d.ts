/* eslint-disable */
type MarketDemoOnboardingPopupSettings = {
	variant: MarketDemoOnboardingVariant;
	isMarketRenamed: boolean;
	copilotName: string;
};

type MarketDemoOnboardingVariant = 'variant_a' | 'variant_b';

declare namespace BX.Rest {
	class MarketDemoOnboardingPopup {
		constructor(settings: MarketDemoOnboardingPopupSettings);
		static start(settings: MarketDemoOnboardingPopupSettings): void;
		static create(settings: MarketDemoOnboardingPopupSettings): BX.Main.Popup | null;
	}

	function releaseOnce(callback: () => void): () => void;
}
