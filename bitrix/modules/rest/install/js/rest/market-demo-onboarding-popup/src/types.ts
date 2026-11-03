export type MarketDemoOnboardingVariant = 'variant_a' | 'variant_b';

export type MarketDemoOnboardingPopupSettings = {
	variant: MarketDemoOnboardingVariant;
	isMarketRenamed: boolean;
	copilotName: string;
};

export type MarketDemoOnboardingAnalyticsEvent = 'show' | 'close' | 'download';
