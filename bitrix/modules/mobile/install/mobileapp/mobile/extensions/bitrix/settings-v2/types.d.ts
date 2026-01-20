export type SettingPage = {
	title: string;
	id: string;
	items: Array<SettingItem>;
	requestSettingsData?: () => Promise<unknown>;
};

type SettingSectionType = 'section';
type SettingLinkType = 'link';
type SettingCacheInfoType = 'cache-info';
type SettingToggleType = 'toggle';
type SettingButtonType = 'button';
type SettingThemeSwitchType = 'theme-switch';
type SettingVideoQualitySwitchType = 'video-quality-switch';
type SettingVideoBannerType = 'video-banner';
type SettingLocSelectorType = 'loc-selector';
type SettingDescriptionType = 'description';
type SettingBannerType = 'banner';
type SettingImageType = 'image';
type SettingStyleSwitchType = 'style-switch';
type SettingCacheInfoButtonType = 'cache-info-button';
type SettingLinkButtonType = 'link-button';
type SettingCacheIntervalSelectorType = 'cache-interval-selector';
type SecurityInfoType = 'security-info';
type SecurityBannerType = 'security-banner';
type SecurityAlertBannerType = 'security-alert-banner';

type SettingItemType =
	SettingSectionType
	| SettingLinkType
	| SettingToggleType
	| SettingButtonType
	| SettingThemeSwitchType
	| SettingVideoQualitySwitchType
	| SettingLocSelectorType
	| SettingDescriptionType
	| SettingCacheInfoType
	| SettingBannerType
	| SettingStyleSwitchType
	| SettingCacheInfoButtonType
	| SettingLinkButtonType
	| SettingCacheIntervalSelectorType
	| SecurityInfoType
	| SecurityBannerType
	| SecurityAlertBannerType
;

interface BaseSettingController
{
	get(): Promise<any>;

	set(value: unknown): Promise<void>;

	setOnChange(callback: (value: unknown) => void): BaseSettingController;
}

export interface SettingItem
{
	id: string;
	type: SettingItemType;
	title?: string;
	prefilter?: (settingsData: unknown) => boolean;
	value?: unknown;
}

export interface SettingSection extends SettingItem
{
	type: SettingSectionType;
	items: Array<SettingItem>;
}

export interface SettingLink extends SettingItem
{
	type: SettingLinkType;
	nextPage: SettingPage;
	subtitle?: string;
	icon?: string;
}

export interface SettingCacheInfo extends SettingItem
{
	type: SettingCacheInfoType;
	subtitle?: string;
	icon?: string;
	modeText?: string;
	controller?: BaseSettingController,
	iconColor?: Color,
	onClick?: Function;
}

export interface SettingToggle extends SettingItem
{
	type: SettingToggleType;
	subtitle?: string;
	icon?: string;
}

export interface SettingButton extends SettingItem
{
	type: SettingButtonType;
	onClick: Function;
	subtitle?: string;
	icon?: string;
}

export interface SettingCacheInfoButton extends SettingItem
{
	type: SettingCacheInfoButtonType;
	onClick: Function;
	subtitle?: string;
	icon?: string;
}

export interface SettingLinkButton extends SettingItem
{
	type: SettingLinkButtonType;
	onClick: Function;
	subtitle?: string;
	icon?: string;
}

export interface SettingThemeSwitch extends SettingItem
{
	type: SettingThemeSwitchType;
	subtitle?: string;
	icon?: string;
}

export interface SettingStyleSwitch extends SettingItem
{
	type: SettingStyleSwitchType;
	controller: BaseSettingController;
}

export interface SettingVideoQualitySwitch extends SettingItem
{
	type: SettingVideoQualitySwitchType;
	controller: BaseSettingController;
}

export interface SettingLocSelector extends SettingItem
{
	type: SettingLocSelectorType;
	controller: BaseSettingController;
}

export interface SettingCacheIntervalSelector extends SettingItem
{
	type: SettingCacheIntervalSelectorType;
	controller: BaseSettingController;
}

export interface SettingCacheBanner extends SettingItem
{
	type: SettingVideoBannerType;
	controller: BaseSettingController;
}

export interface SettingBanner extends SettingItem
{
	type: SettingBannerType;
	bannerImageName: string;
	text: string;
}

export interface SettingImage extends SettingItem
{
	type: SettingImageType;
	name: string;
}

export interface SettingDescription extends SettingItem
{
	type: SettingDescriptionType;
	text: string;
}

export interface SettingVideoBanner extends SettingItem
{
	type: SettingVideoBannerType;
	controller: BaseSettingController;
}

export type ItemProps = SettingItem & {
	onChange: (id: string, controller: BaseSettingController, value: unknown) => void;
	value?: unknown;
};

export interface SecurityInfo extends SettingItem
{
	type: SecurityInfoType;
	subtitle?: string;
	controller?: BaseSettingController;
	isOtpMandatory?: boolean;
}

export interface SecurityBanner extends SettingItem
{
	type: SecurityBannerType;
	controllers: Array<BaseSettingController>;
	progress: boolean;
}

export interface SecurityAlertBanner extends SettingItem
{
	type: SecurityAlertBannerType;
	controller: BaseSettingController;
}
