import { Type } from 'main.core';

/**
 * Moves a single colour of a light diagram into the shade of a dark surface.
 *
 * Not a second, hand-authored palette: the colours a reader knows from a light document are the ones a
 * dark document shows, only pulled down onto the surface they sit on - a red stays red and becomes a
 * dark red. Naming dark design-system tokens instead resolved to near-black and turned a colourful
 * diagram monochrome; the engine's own 'dark' theme does the same thing by itself.
 *
 * Applied per colour found in the rendered SVG (see diagram-recolor), so it has to hold for anything a
 * diagram can contain: theme values, the scale the engine derives at render time, and the colours a
 * diagram's author writes by hand.
 */

// Where the flipped lightness is allowed to land. Neither end reaches the extreme: a pure white label
// over a near-black fill is harsher than the tinted pair a light document actually shows.
const LIGHTNESS_FLOOR = 0.18;
const LIGHTNESS_CEIL = 0.92;

// A pale tint carries an enormous HSL saturation - #ECECFF, the default node fill, is s=100% - so
// flipping its lightness with that saturation intact turns a soft lavender into neon indigo. Damping
// by distance from mid-lightness hits exactly those colours and barely touches the mid-saturation
// ones (borders, accents), which are the diagram's actual accents.
const SATURATION_FLOOR = 0.25;

// How far a colour is sat down onto the surface, scaled by how bright and saturated it still is after
// the flip. That scaling is the point. Text and strokes come out grey, so they keep the full lift and
// stay in the foreground - a flat share dragged them back down and left labels at a washed-out grey.
// A colour that survives the flip both bright and saturated is the one that needs the surface most:
// unstyled gitGraph branch labels are dark text on saturated fills, and flipping the text alone left
// light text on a still-glowing plate.
const SURFACE_PULL = 0.7;

let colorProbe = null;

// Any CSS colour string to {r,g,b,a}, and null for a value that is not a colour at all - the variable
// set also carries font families, sizes and plain numbers, and those must pass through untouched.
// Canvas is what makes this exhaustive: the default palette mixes hex, rgba() and bare names
// ('white', 'black'), and a hand-written parser that missed one would leak a light colour into the
// dark palette as a glaring white box.
export function parseColor(value: mixed): ?Object
{
	if (!Type.isString(value) || value.trim() === '')
	{
		return null;
	}

	if (colorProbe === null)
	{
		colorProbe = document.createElement('canvas').getContext('2d');
	}

	if (!colorProbe)
	{
		return null;
	}

	// Two sentinels: an invalid assignment leaves fillStyle at its previous value, so a value is only
	// a colour if both probes agree on the result.
	colorProbe.fillStyle = '#000000';
	colorProbe.fillStyle = value;
	const first = colorProbe.fillStyle;
	colorProbe.fillStyle = '#ffffff';
	colorProbe.fillStyle = value;
	if (first !== colorProbe.fillStyle)
	{
		return null;
	}

	if (first.startsWith('#'))
	{
		return {
			r: Number.parseInt(first.slice(1, 3), 16),
			g: Number.parseInt(first.slice(3, 5), 16),
			b: Number.parseInt(first.slice(5, 7), 16),
			a: 1,
		};
	}

	const parts = /rgba?\(([^)]+)\)/.exec(first);
	if (!parts)
	{
		return null;
	}

	const numbers = parts[1].split(',').map(Number);

	return {
		r: numbers[0],
		g: numbers[1],
		b: numbers[2],
		a: numbers.length > 3 ? numbers[3] : 1,
	};
}

function toCss({ r, g, b, a }: Object): string
{
	const channel = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
	const rgb = `${channel(r)}, ${channel(g)}, ${channel(b)}`;

	return a >= 1 ? `rgb(${rgb})` : `rgba(${rgb}, ${a})`;
}

function rgbToHsl({ r, g, b, a }: Object): Object
{
	const rn = r / 255;
	const gn = g / 255;
	const bn = b / 255;
	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	const l = (max + min) / 2;

	if (max === min)
	{
		return { h: 0, s: 0, l, a };
	}

	const delta = max - min;
	const s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
	let h = 0;

	if (max === rn)
	{
		h = ((gn - bn) / delta + (gn < bn ? 6 : 0)) / 6;
	}
	else if (max === gn)
	{
		h = ((bn - rn) / delta + 2) / 6;
	}
	else
	{
		h = ((rn - gn) / delta + 4) / 6;
	}

	return { h, s, l, a };
}

function hslToRgb({ h, s, l, a }: Object): Object
{
	if (s === 0)
	{
		const grey = l * 255;

		return { r: grey, g: grey, b: grey, a };
	}

	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;
	const channel = (offset: number) => {
		let t = offset;
		if (t < 0)
		{
			t += 1;
		}
		if (t > 1)
		{
			t -= 1;
		}

		if (t < 1 / 6)
		{
			return p + (q - p) * 6 * t;
		}
		if (t < 1 / 2)
		{
			return q;
		}
		if (t < 2 / 3)
		{
			return p + (q - p) * (2 / 3 - t) * 6;
		}

		return p;
	};

	return {
		r: channel(h + 1 / 3) * 255,
		g: channel(h) * 255,
		b: channel(h - 1 / 3) * 255,
		a,
	};
}

function mixRgb(rgb: Object, target: Object, ratio: number): Object
{
	return {
		r: rgb.r + (target.r - rgb.r) * ratio,
		g: rgb.g + (target.g - rgb.g) * ratio,
		b: rgb.b + (target.b - rgb.b) * ratio,
		a: rgb.a,
	};
}

/**
 * Moves one colour into the dark range, keeping its hue. Non-colour values pass through.
 *
 * `surface` is the parsed colour of the block the diagram sits on, or null to skip the blend.
 * `foreground` marks a colour that paints on top of the diagram - label text, mostly.
 */
export function toDarkColor(value: mixed, surface: ?Object, foreground: boolean = false): mixed
{
	const rgb = parseColor(value);
	if (!rgb)
	{
		return value;
	}

	const hsl = rgbToHsl(rgb);
	let lightness = LIGHTNESS_FLOOR + (1 - hsl.l) * (LIGHTNESS_CEIL - LIGHTNESS_FLOOR);
	if (foreground)
	{
		// Whatever side it started on, text over a dark surface has to end up light. Flipping alone is
		// not enough: a diagram whose author wrote white text on a red plate got dark text on a dark red
		// plate, because the plate sits mid-lightness and barely moves while the text crosses over.
		lightness = Math.max(lightness, 1 - lightness);
	}

	const damping = SATURATION_FLOOR + (1 - SATURATION_FLOOR) * (1 - Math.abs(2 * hsl.l - 1));
	const flipped = hslToRgb({ h: hsl.h, s: hsl.s * damping, l: lightness, a: hsl.a });

	// The blend ties a fill to the surface it lies on; foreground colours are the thing that has to
	// stand off that surface, so they keep the full lift.
	if (!surface || foreground)
	{
		return toCss(flipped);
	}

	const result = rgbToHsl(flipped);

	return toCss(mixRgb(flipped, surface, SURFACE_PULL * result.s * result.l));
}
