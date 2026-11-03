// Icon and Color are declared in dev/janative/types; an inline import keeps this file ambient, so the
// names below stay visible to JSDoc in .js — a top-level import would turn the file into a module
type BadgeButtonIcon = import('../../../../../../../../../dev/janative/types/enum/icon').Icon;
type BadgeButtonColor = import('../../../../../../../../../dev/janative/types/enum/color').Color;

// the runtime enums live in src/design-enum.js and src/size-enum.js; they are declared here the same way
// dev/janative/types/enum declares Icon — the declaration names the contract, the .js keeps the values

declare class BadgeButtonDesign {
	static GREY: BadgeButtonDesign;
	static LIGHT: BadgeButtonDesign;

	getName(): string;
	getColor(): BadgeButtonColor;
	getBackgroundColor(): BadgeButtonColor;
	getBorderColor(): BadgeButtonColor;
}

declare class BadgeButtonSize {
	static S: BadgeButtonSize;
	static M: BadgeButtonSize;
	static L: BadgeButtonSize;
	static XL: BadgeButtonSize;

	getName(): string;
	toNumber(): number;
	getIconSize(): number;
	getBackgroundSize(): number;
}

// design, size and icon are enum members, not their names: resolve() checks `instanceof` and throws otherwise.
// Whatever else is passed goes straight to the wrapping View, so onClick and style reach the native element.
type BadgeButtonProps = {
	testId: string;
	icon?: BadgeButtonIcon;
	design?: BadgeButtonDesign;
	size?: BadgeButtonSize;
	stroke?: boolean;
	[viewProp: string]: unknown;
};
