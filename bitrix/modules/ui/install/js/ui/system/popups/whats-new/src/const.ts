export const WhatsNewSize = Object.freeze({
	Lg: 'l',
	Md: 'm',
});

export type WhatsNewSize = typeof WhatsNewSize[keyof typeof WhatsNewSize];

// Where the media zone sits. 'left' and 'right' both mean a two-column layout, the narrow column always
// being the media one; the side only decides the order of the columns in the markup.
export const WhatsNewMediaPosition = Object.freeze({
	Top: 'top',
	Left: 'left',
	Right: 'right',
});

export type WhatsNewMediaPosition = typeof WhatsNewMediaPosition[keyof typeof WhatsNewMediaPosition];

// Where the row of buttons stands. 'Center' is the placement of a single target button of an announcement;
// in the wizard the row is shared with the indicator and pushed to the edges, so the centre does not apply there.
export const WhatsNewActionsAlign = Object.freeze({
	Right: 'right',
	Left: 'left',
	Center: 'center',
});

export type WhatsNewActionsAlign = typeof WhatsNewActionsAlign[keyof typeof WhatsNewActionsAlign];

// Where the arrows of the gallery stand. 'OverBleed' is the placement of a gallery whose slides leave the
// top edge of the card: the arrows stand a little below the middle, carry no shadow of their own and lie
// over the flown graphics. The three placements exclude one another, so they are one axis and not two.
export const WhatsNewGalleryNav = Object.freeze({
	Sides: 'sides',
	Bottom: 'bottom',
	OverBleed: 'over-bleed',
});

export type WhatsNewGalleryNav = typeof WhatsNewGalleryNav[keyof typeof WhatsNewGalleryNav];

// Effect of the backdrop. Declared in full from the start, so that a consumer names the effect it wants
// before the engine of it is there: an effect that cannot be drawn yet shows the plain backdrop of `None`.
export const WhatsNewBackdrop = Object.freeze({
	None: 'none',
	Water: 'water',
	Bubble: 'bubble',
	Balloons: 'balloons',
	Sparkle: 'sparkle',
});

export type WhatsNewBackdrop = typeof WhatsNewBackdrop[keyof typeof WhatsNewBackdrop];

// Colour scheme of the backdrop, a curated palette of the mockup.
export const WhatsNewColor = Object.freeze({
	DarkBlue: 'dark-blue',
	Pink: 'pink',
	Violet: 'violet',
	Magenta: 'magenta',
	Sapphire: 'sapphire',
	BitrixGpt: 'bitrix-gpt',
	Gradient: 'gradient',
});

export type WhatsNewColor = typeof WhatsNewColor[keyof typeof WhatsNewColor];
