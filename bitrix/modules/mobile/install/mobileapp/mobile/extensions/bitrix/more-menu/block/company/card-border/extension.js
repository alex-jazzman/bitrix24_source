/**
 * @module more-menu/block/company/card-border
 */
jn.define('more-menu/block/company/card-border', (require, exports, module) => {
	const AppTheme = require('apptheme');
	const { Color } = require('tokens');

	const DARK_BORDER_OPACITY = 0.1;
	// Every card of the block wears the edge at this share of the full strength: the mockup asks for a
	// hint of an outline rather than a line of its own. It cannot go much lower: the grey of the light
	// theme is light to begin with, and over the white of a card every further step of transparency
	// takes it towards the white itself - a third of the full strength left no visible edge at all.
	// The dark theme is not held back at all: its white starts at a tenth of the strength, and a share
	// of that leaves nothing to see on the dark background.
	const DEFAULT_BORDER_STRENGTH = 0.8;
	// the light theme wants a shadow, and the muted separator stands in for it: enough to keep the edge
	// of the card off the background, faint enough not to read as an outline of its own
	const LIGHT_BORDER_OPACITY = 0.5;

	/**
	 * The mockup outlines the cards in the dark theme alone, with white over the dark background; the
	 * light theme has a shadow there instead, and the border stands in for it.
	 *
	 * The design system does carry the shadow of a card - `Color.cardShadowColor` plus the
	 * `cardShadowBlur/X/Y` components - and JaNative does have a `Shadow` element to draw it. What makes
	 * it unusable here is the geometry: `Shadow` keeps its blur radius as a padding of its own, so the
	 * card inside it loses 12 points on either side, and compensating that with negative margins pushes
	 * the wrapper past the horizontal padding of the area, where the shadow gets clipped.
	 *
	 * A card that wants the very same edge, only fainter, asks for a share of that strength instead of
	 * naming a color of its own: the pair of the themes stays here, in one place. The share applies to
	 * the light theme, the one it was picked for.
	 *
	 * @param {number} [strength] share of the full strength of the border in the light theme
	 * @return {string}
	 */
	const getCardBorderColor = (strength = DEFAULT_BORDER_STRENGTH) => (AppTheme.id === 'dark'
		? Color.baseWhiteFixed.toHex(DARK_BORDER_OPACITY)
		: Color.bgSeparatorPrimary.toHex(LIGHT_BORDER_OPACITY * strength)
	);

	module.exports = { getCardBorderColor };
});
