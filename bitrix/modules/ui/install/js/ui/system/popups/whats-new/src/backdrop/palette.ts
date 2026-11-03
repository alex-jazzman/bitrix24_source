/**
 * The curated palette of the mockup: seven colour schemes of the backdrop and the two edge colours of the
 * brand gradient. Every value here is a colour literal, and this file is the only place of the component
 * where one is allowed - the designer gave the values by hand, in the mockup they are plain fills and no
 * token of the design system carries them. Each of them carries the note of that exception; the exception is
 * lifted as soon as the palette is tokenised. The rest of the code sees a scheme through the two local
 * variables below and knows no colour of its own.
 */

import { WhatsNewColor } from '../const';
import { type WhatsNewColorScheme } from '../types';

// The two local variables a scheme is handed to the styles by.
export const BackdropVariable = Object.freeze({
	Base: '--ui-system-whats-new-backdrop-base',
	Glow: '--ui-system-whats-new-backdrop-glow',
});

const DEFAULT_COLOR: WhatsNewColor = WhatsNewColor.DarkBlue;

const SCHEMES: Readonly<Record<WhatsNewColor, WhatsNewColorScheme>> = Object.freeze({
	// colour-literal exception: curated palette, no token of the design system carries these values.
	[WhatsNewColor.DarkBlue]: { base: '#00078C', glow: '#2A76F0' },
	// colour-literal exception: curated palette, no token carries these values.
	[WhatsNewColor.Pink]: { base: '#7B1E21', glow: '#C24E50' },
	// colour-literal exception: curated palette, no token carries these values.
	[WhatsNewColor.Violet]: { base: '#40287B', glow: '#6B44AF' },
	// colour-literal exception: curated palette, no token carries these values.
	[WhatsNewColor.Magenta]: { base: '#720040', glow: '#A91A76' },
	// colour-literal exception: curated palette, no token carries these values.
	[WhatsNewColor.Sapphire]: { base: '#006271', glow: '#01AABA' },

	/*
	 * The scheme of BitrixGPT stands on a ready raster of the mockup, and rebuilding that raster in code is
	 * forbidden - the designer turned down two attempts at it. The file itself is not in the delivery, so the
	 * scheme is drawn by the gradient of its own until an export of the node arrives and `image` names it. A
	 * scheme that does name a raster fetches it only when it is drawn and never joins the bundle.
	 */
	[WhatsNewColor.BitrixGpt]: {
		// colour-literal exception: curated palette, no token carries these values.
		base: '#161835',
		glow: '#CEA3FF',
		gradient: {
			direction: 'to bottom right',
			// colour-literal exception: curated palette, no token carries these values.
			stops: [[0, '#161835'], [1, '#40469B']],
		},
	},

	[WhatsNewColor.Gradient]: {
		// colour-literal exception: curated palette, no token carries these values.
		base: '#2E2A8F',
		glow: '#CB4AAB',
		gradient: {
			direction: '135deg',
			// colour-literal exception: curated palette, no token carries these values.
			stops: [[0, '#2E2A8F'], [0.44, '#324DB8'], [0.7, '#CB4AAB'], [1, '#FF7A5C']],
		},
	},
});

// An unknown scheme is drawn by the default one: the value comes from the outside and a card without a
// backdrop is not a state the mockup has.
export const getColorScheme = (color: WhatsNewColor): WhatsNewColorScheme => {
	return SCHEMES[color] ?? SCHEMES[DEFAULT_COLOR];
};
