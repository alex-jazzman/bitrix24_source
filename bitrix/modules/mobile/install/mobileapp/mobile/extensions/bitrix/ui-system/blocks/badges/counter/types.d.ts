// Color is declared in dev/janative/types; an inline import keeps this file ambient, so the names
// below stay visible to JSDoc in .js — a top-level import would turn the file into a module
type BadgeCounterColor = import('../../../../../../../../../dev/janative/types/enum/color').Color;

// the indent token the size reports as its horizontal padding
type BadgeCounterIndent = {
	toNumber(): number;
};

// the typography component the size renders its value with: Text5, Text6 or Text7 of
// ui-system/typography/text
type BadgeCounterTypography = (props: {
	accent?: boolean;
	text: string;
	color?: BadgeCounterColor;
	colorGradient?: BackgroundColorGradient;
	style?: ElementStyle;
}) => unknown;

// the runtime enums live in src/design-enum.js and src/size-enum.js; they are declared here the same way
// dev/janative/types/enum declares Color — the declaration names the contract, the .js keeps the values

declare class BadgeCounterDesign {
	static PRIMARY: BadgeCounterDesign;
	static PRIMARY_EFFECTIVINESS: BadgeCounterDesign;
	static ALERT: BadgeCounterDesign;
	static WHITE_ALERT: BadgeCounterDesign;
	static SUCCESS: BadgeCounterDesign;
	static COLLAB_SUCCESS: BadgeCounterDesign;
	static GREY: BadgeCounterDesign;
	static LIGHT_GREY: BadgeCounterDesign;
	static LIGHT_GREY_ACCENT: BadgeCounterDesign;
	static LIGHT_GREY_NAVIGATION: BadgeCounterDesign;
	static WHITE: BadgeCounterDesign;
	static COPILOT: BadgeCounterDesign;
	static BITRIX_GPT_SOLID: BadgeCounterDesign;
	static BITRIX_GPT_TINTED: BadgeCounterDesign;

	static has(design: unknown): boolean;

	getName(): string;
	getColor(): BadgeCounterColor;
	getColorGradient(): BackgroundColorGradient | undefined;
	getBackgroundColor(): BadgeCounterColor;
	getBackgroundColorGradient(): BackgroundColorGradient | undefined;
}

declare class BadgeCounterSize {
	static DOT: BadgeCounterSize;
	static XS: BadgeCounterSize;
	static S: BadgeCounterSize;
	static M: BadgeCounterSize;

	getName(): string;
	getHeight(): number;
	getPaddingHorizontal(): BadgeCounterIndent;
	getTypography(): BadgeCounterTypography;

	// vertical shift of the value, in dp: negative on Android to offset the asymmetric font padding,
	// zero on iOS
	getTextOffset(): number;

	isDot(): boolean;
}

// design and size are enum members, not their names: the component checks them and bails out otherwise.
// Whatever else is passed goes straight to the wrapping View, so style reaches the native element.
type BadgeCounterProps = {
	testId: string;

	// optional: defaultProps substitutes 0, so a badge without a value renders "0"
	value?: number | string;

	// keeps the value as it is instead of collapsing everything above 99 into "99+"
	showRawValue?: boolean;
	design?: BadgeCounterDesign;
	size?: BadgeCounterSize;
	[viewProp: string]: unknown;
};
