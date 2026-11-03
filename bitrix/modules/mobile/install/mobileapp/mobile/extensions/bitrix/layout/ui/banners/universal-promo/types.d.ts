import type { PageManager } from '../../../../../../../../../dev/janative/api';

export type UniversalPromoBannerPortalType = 'cloud' | 'box';
/**
 * Value as the server sends it. Analytics carries it with the underscore replaced by a hyphen:
 * a `p1..p5` parameter may hold a single underscore, and that one separates name from value.
 */
export type UniversalPromoBannerAgeSegment = '61_plus';
export type UniversalPromoBannerErrorCategory = 'request' | 'dto' | 'image' | 'storage' | 'navigation';

export interface UniversalPromoBannerCampaignAnalytics {
	region: string,
	portalType: UniversalPromoBannerPortalType,
	ageSegment: UniversalPromoBannerAgeSegment,
	targetScenario: string,
}

export interface UniversalPromoBannerCampaign {
	id: string,
	imageUrl: string,
	accessibilityDescription: string,
	targetUrl: string,
	analytics: UniversalPromoBannerCampaignAnalytics,
}

export interface UniversalPromoBannerTexts {
	/** Accessibility hint of the campaign card: what a tap on it does. */
	open: string,
	/** Accessibility label of the close area. */
	hide: string,
	/** The question the card asks before it hides the campaign. */
	confirmation: string,
}

export interface UniversalPromoBannerProps {
	testId: string,
	campaign: UniversalPromoBannerCampaign,
	texts: UniversalPromoBannerTexts,
	layout: PageManager,
	visibilitySessionId: number,
	onLayout: (params: { height: number }) => void,
	onHide: () => void,
}

declare class DismissalStorage {
	getDismissedCampaignIds(): string[];
	isDismissed(campaignId: string): boolean;
	dismiss(campaignId: string): boolean;
}

declare class UniversalPromoBannerAnalytics {
	static sendView(campaign: UniversalPromoBannerCampaign): boolean;
	static sendClick(campaign: UniversalPromoBannerCampaign): boolean;
	static sendOpenHideConfirmation(campaign: UniversalPromoBannerCampaign): boolean;
	static sendCancelHide(campaign: UniversalPromoBannerCampaign): boolean;
	static sendHide(campaign: UniversalPromoBannerCampaign): boolean;
	static sendError(
		category: UniversalPromoBannerErrorCategory,
		campaign?: UniversalPromoBannerCampaign | null,
	): boolean;
}

declare function normalizeCampaign(campaign: unknown): UniversalPromoBannerCampaign | null;

declare function UniversalPromoBanner(
	props: UniversalPromoBannerProps,
): LayoutComponent<UniversalPromoBannerProps, Record<string, never>>;

export { DismissalStorage, normalizeCampaign, UniversalPromoBanner, UniversalPromoBannerAnalytics };
