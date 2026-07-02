/**
 * Baseline CSS features.
 *
 * Total: 18
 * Years: 2026, 2025
 */

import { type BaselineFeature } from '../baseline.config';

/* eslint-disable quote-props */
export const features: Record<string, BaselineFeature> = {

	// ── 2026 (10 features) ──

	/**
	 * Subgrid
	 *
	 * The `subgrid` value for the `grid-template-columns` and `grid-template-rows` properties
	 * allows a grid item to inherit the grid definition of its parent grid container.
	 *
	 * @see https://webstatus.dev/features/subgrid
	 */
	'subgrid': {
		enabled: true,
		widelyAvailableDate: '15.03.2026',
		minVersions: {
			chrome: 117,
			edge: 117,
			firefox: 71,
			safari: 16,
		},
	},

	/**
	 * animation-composition
	 *
	 * The `animation-composition` CSS property chooses how to combine animations that affect the
	 * same property.
	 *
	 * @see https://webstatus.dev/features/animation-composition
	 */
	'animation-composition': {
		enabled: true,
		widelyAvailableDate: '04.01.2026',
		minVersions: {
			chrome: 112,
			edge: 112,
			firefox: 115,
			safari: 16,
		},
	},

	/**
	 * Two-value display property
	 *
	 * The `display` CSS property accepts multiple keyword values, such as `inline flex` or `block
	 * flow`, to explicitly set an element's inner and outer layout mode. Also known as 2-value,
	 * multi-keyword, or multiple value syntax.
	 *
	 * @see https://webstatus.dev/features/two-value-display
	 */
	'two-value-display': {
		enabled: true,
		widelyAvailableDate: '21.01.2026',
		minVersions: {
			chrome: 115,
			edge: 115,
			firefox: 70,
			safari: 15,
		},
	},

	/**
	 * image-set()
	 *
	 * The `image-set()` CSS function provides a set of images at different resolutions or pixel
	 * densities, which the browser can pick from, depending on the device capabilities.
	 *
	 * @see https://webstatus.dev/features/image-set
	 */
	'image-set': {
		enabled: true,
		widelyAvailableDate: '18.03.2026',
		minVersions: {
			chrome: 113,
			edge: 113,
			firefox: 89,
			safari: 17,
		},
	},

	/**
	 * Overflow media queries
	 *
	 * The `overflow-block` and `overflow-inline` CSS media queries set styles based on the way a
	 * device displays content that's larger than the viewport or page area. For example, a laptop
	 * lets users scroll to reveal content, while a printer displays overflowing content on
	 * additional pages.
	 *
	 * @see https://webstatus.dev/features/overflow
	 */
	'overflow': {
		enabled: true,
		widelyAvailableDate: '18.03.2026',
		minVersions: {
			chrome: 113,
			edge: 113,
			firefox: 66,
			safari: 17,
		},
	},

	/**
	 * Update frequency media query
	 *
	 * The `update` CSS media query sets styles based on whether and how fast the user's device
	 * can modify display after it has been rendered. For example, you can avoid animations on
	 * devices that aren't fast enough to display them smoothly.
	 *
	 * @see https://webstatus.dev/features/update
	 */
	'update': {
		enabled: true,
		widelyAvailableDate: '18.03.2026',
		minVersions: {
			chrome: 113,
			edge: 113,
			firefox: 102,
			safari: 17,
		},
	},

	/**
	 * contain-intrinsic-size
	 *
	 * The `contain-intrinsic-size` CSS property sets the intrinsic size of an element. When using
	 * size containment, the browser will lay out the element as if it had a single child of this
	 * size.
	 *
	 * @see https://webstatus.dev/features/contain-intrinsic-size
	 */
	'contain-intrinsic-size': {
		enabled: true,
		widelyAvailableDate: '18.03.2026',
		minVersions: {
			chrome: 83,
			edge: 83,
			firefox: 107,
			safari: 17,
		},
	},

	/**
	 * Hyphenate character
	 *
	 * The `hyphenate-character` CSS property sets the character or string to use at the end of a
	 * line before a line break.
	 *
	 * @see https://webstatus.dev/features/hyphenate-character
	 */
	'hyphenate-character': {
		enabled: true,
		widelyAvailableDate: '18.03.2026',
		minVersions: {
			chrome: 106,
			edge: 106,
			firefox: 98,
			safari: 17,
		},
	},

	/**
	 * @counter-style
	 *
	 * The `@counter-style` CSS at-rule sets custom counter styles for list items. For example,
	 * you can use a sequence of specific symbols instead of numbers for an ordered list.
	 *
	 * @see https://webstatus.dev/features/counter-style
	 */
	'counter-style': {
		enabled: true,
		widelyAvailableDate: '18.03.2026',
		minVersions: {
			chrome: 91,
			edge: 91,
			firefox: 33,
			safari: 17,
		},
	},

	/**
	 * Hyphenation
	 *
	 * The `hyphens` CSS property controls when long words are broken by line wrapping. Although
	 * called `hyphens`, the property applies to word-splitting behavior across languages, such as
	 * customary spelling changes or the use of other characters. Support for non-English
	 * languages varies significantly.
	 *
	 * @see https://webstatus.dev/features/hyphens
	 */
	'hyphens': {
		enabled: true,
		widelyAvailableDate: '18.03.2026',
		minVersions: {
			chrome: 88,
			edge: 88,
			firefox: 43,
			safari: 17,
		},
	},

	// ── 2025 (8 features) ──

	/**
	 * calc() keywords
	 *
	 * The `e`, `pi`, `infinity`, and `NaN` keywords represent well-defined constants accepted in
	 * CSS math functions such as `calc()`.
	 *
	 * @see https://webstatus.dev/features/calc-constants
	 */
	'calc-constants': {
		enabled: true,
		widelyAvailableDate: '06.12.2025',
		minVersions: {
			chrome: 110,
			edge: 110,
			firefox: 114,
			safari: 16,
		},
	},

	/**
	 * color()
	 *
	 * The `color()` function picks a color from a given color space. Wide gamut color spaces like
	 * `display-p3` allow showing more vibrant and saturated colors than the standard `srgb` color
	 * space.
	 *
	 * @see https://webstatus.dev/features/color-function
	 */
	'color-function': {
		enabled: true,
		widelyAvailableDate: '09.11.2025',
		minVersions: {
			chrome: 111,
			edge: 111,
			firefox: 113,
			safari: 15,
		},
	},

	/**
	 * color-mix()
	 *
	 * The `color-mix()` function mixes two colors in a given color space and by a given amount.
	 * Commonly, lighter or darker variations of a color are created by mixing with white or
	 * black.
	 *
	 * @see https://webstatus.dev/features/color-mix
	 */
	'color-mix': {
		enabled: true,
		widelyAvailableDate: '09.11.2025',
		minVersions: {
			chrome: 111,
			edge: 111,
			firefox: 113,
			safari: 16,
		},
	},

	/**
	 * Lab and LCH
	 *
	 * The CIE Lab color space expresses colors in terms of lightness and how red/green and
	 * blue/yellow a color is. LCH is a variant of Lab with polar coordinates. These color spaces
	 * can be used with the CSS `color()`, `lab()`, and `lch()` functions. Also known as CIELAB
	 * and CIELCH.
	 *
	 * @see https://webstatus.dev/features/lab
	 */
	'lab': {
		enabled: true,
		widelyAvailableDate: '09.11.2025',
		minVersions: {
			chrome: 111,
			edge: 111,
			firefox: 113,
			safari: 15,
		},
	},

	/**
	 * :nth-child() of <selector>
	 *
	 * The `of` syntax for the `:nth-child()` and `:nth-last-child()` CSS functional
	 * pseudo-classes match elements by the relative position of elements, counted from the first
	 * or last sibling matching a selector list.
	 *
	 * @see https://webstatus.dev/features/nth-child-of
	 */
	'nth-child-of': {
		enabled: true,
		widelyAvailableDate: '09.11.2025',
		minVersions: {
			chrome: 111,
			edge: 111,
			firefox: 113,
			safari: 9,
		},
	},

	/**
	 * Oklab and OkLCh
	 *
	 * The Oklab color space expresses colors in terms of lightness and how red/green and
	 * blue/yellow a color is, aiming to match how humans perceive colors. OkLCh is a variant of
	 * Oklab with polar coordinates. These color spaces can be used with the CSS `oklab()` and
	 * `oklch()` functions.
	 *
	 * @see https://webstatus.dev/features/oklab
	 */
	'oklab': {
		enabled: true,
		widelyAvailableDate: '09.11.2025',
		minVersions: {
			chrome: 111,
			edge: 111,
			firefox: 113,
			safari: 15,
		},
	},

	/**
	 * font-variant-alternates
	 *
	 * The `font-variant-alternates` CSS property, along with the `@font-feature-values` at-rule,
	 * chooses when to use a font's alternate glyphs.
	 *
	 * @see https://webstatus.dev/features/font-variant-alternates
	 */
	'font-variant-alternates': {
		enabled: true,
		widelyAvailableDate: '13.09.2025',
		minVersions: {
			chrome: 111,
			edge: 111,
			firefox: 34,
			safari: 9,
		},
	},

	/**
	 * sin(), cos(), tan(), asin(), acos(), atan(), and atan2() (CSS)
	 *
	 * The `sin()`, `cos()`, `tan()`, `asin()`, `acos()`, `atan()`, and `atan2()` CSS functions
	 * compute various trigonometric functions.
	 *
	 * @see https://webstatus.dev/features/trig-functions
	 */
	'trig-functions': {
		enabled: true,
		widelyAvailableDate: '13.09.2025',
		minVersions: {
			chrome: 111,
			edge: 111,
			firefox: 108,
			safari: 15,
		},
	},
};
