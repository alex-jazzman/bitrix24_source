import { type WhatsNewColorScheme, type WhatsNewGradientStop } from '../types';
import { type BackdropGlowSpot, BackdropGeometry } from './geometry';

// The angles of CSS are counted from `to top` and clockwise, and the sides are the round quarters of that.
const HALF_TURN = 180;
const SIDE_ANGLES: Readonly<Record<string, number>> = Object.freeze({
	top: 0,
	right: 90,
	bottom: 180,
	left: 270,
});

const ANGLE = /^(-?\d+(?:\.\d+)?)deg$/;
const HEX = /^#([\da-f]{3}|[\da-f]{6})$/i;
const SHORT_HEX_LENGTH = 3;

/*
 * The softening of the spots is taken from the very token the static layers of the backdrop soften
 * themselves with, and not from a number of its own: the moving backdrop must not read sharper than the
 * still one where the token is alive, nor draw a blur where the portal has zeroed it.
 */
const BLUR_TOKEN = '--ui-bg-blur-default';
const BLUR = /blur\(\s*(\d+(?:\.\d+)?)px\s*\)/i;

/*
 * How far a spot of the glow is let move before the composition is baked anew, px. The spots wander with
 * their own drift, and a key that told one pixel from the next had the composition baked on all but every
 * frame of it - the buffer undone, and worst of all under an effect that reads the picture pixel by pixel.
 * A spot is half the card across and faded to nothing at its rim, so eight pixels of its place move the
 * colour under it by six of the two hundred and fifty six steps of a channel at the very worst, and by less
 * than one on the average pixel.
 */
const SPOT_STEP = 8;

const toRadians = (degrees: number): number => (degrees * Math.PI) / HALF_TURN;

type Size = {
	width: number;
	height: number;
};

// The card inside the drawing area. An effect that keeps a margin around the card moves the composition into
// place instead of holding a second copy of it.
type BackdropBrushCard = Size & {
	x: number;
	y: number;
};

export type BackdropBrushFrame = {
	// The whole drawing area, in pixels.
	width: number;
	height: number;
	card?: BackdropBrushCard;
	// Time of the frame, ms. `null` stands the composition still and gives the very picture the static
	// variant of the backdrop shows.
	time: number | null;
	// Softening of the spots, px. The static variant takes it from the blur token of the design system, and
	// an effect names the radius it wants.
	blur?: number;
};

type Spot = {
	x: number;
	y: number;
	radiusX: number;
	radiusY: number;
};

// Everything one baking of the composition needs: the picture is the same while the plan is.
type BakingPlan = {
	area: Size;
	card: BackdropBrushCard;
	spots: Spot[];
	blur: number;
	raster: HTMLImageElement | null;
};

type GradientLine = {
	x0: number;
	y0: number;
	x1: number;
	y1: number;
};

/*
 * A raster of a scheme is fetched once per address and kept. Nothing waits for it: the key of the buffer
 * counts a raster that has not arrived as a picture of its own, so the first frame after it lands bakes the
 * composition anew.
 */
const rasters = new Map<string, HTMLImageElement>();

const getRaster = (src?: string): HTMLImageElement | null => {
	if (!src)
	{
		return null;
	}

	let raster: HTMLImageElement | undefined = rasters.get(src);
	if (!raster)
	{
		raster = new Image();
		raster.decoding = 'async';
		raster.src = src;
		rasters.set(src, raster);
	}

	return raster;
};

const isReady = (raster: HTMLImageElement | null): raster is HTMLImageElement => {
	return raster !== null && raster.complete && raster.naturalWidth > 0 && raster.naturalHeight > 0;
};

/**
 * The three channels of a colour of the palette. Every colour a scheme carries is a hex literal, and a
 * value of another kind is not one the palette gives - such a value is answered with nothing, and what to
 * draw instead is decided by the one that asked.
 *
 * The reader lives beside the brush because the composition is the first to need it, and the effects that
 * draw over the composition read the colours of the scheme through it as well.
 */
export const toChannels = (color: string): number[] | null => {
	const match: RegExpExecArray | null = HEX.exec(color.trim());
	if (!match)
	{
		return null;
	}

	const digits: string = match[1].length === SHORT_HEX_LENGTH
		? [...match[1]].map((digit: string) => digit + digit).join('')
		: match[1];

	return [0, 2, 4].map((at: number) => parseInt(digits.slice(at, at + 2), 16));
};

/**
 * The radius the spots of the composition are softened by, read off a node of the card, px. A portal that
 * has zeroed the token answers with no blur at all, and the composition holds up on the gradients alone.
 */
export const toBlurRadius = (node: Element): number => {
	const match: RegExpExecArray | null = BLUR.exec(getComputedStyle(node).getPropertyValue(BLUR_TOKEN));

	return match ? Number(match[1]) : 0;
};

/*
 * The very same colour with no alpha at all. A gradient let run into `transparent` runs into black on the
 * way and dirties the glow.
 *
 * A colour that does not read has no clear end of its own to run into, and nothing is invented in its place:
 * a black end here would be the very dirt this trick exists to avoid. The layer that needed it is not drawn
 * at all - the base of the scheme is already on the canvas, and the palette of the component is the only
 * source of these colours, so this is a refusal and not a state to paint around.
 */
const toClear = (color: string): string | null => {
	const channels: number[] | null = toChannels(color);

	return channels ? `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, 0)` : null;
};

// The angle a linear gradient of the styles runs at. A corner is not an angle of its own: the line stands
// across the other diagonal of the box, so the two corners beside it land on the ends of the line.
const toGradientAngle = (direction: string, card: Size): number => {
	const value: string = direction.trim().toLowerCase();

	const angle: RegExpExecArray | null = ANGLE.exec(value);
	if (angle)
	{
		return toRadians(Number(angle[1]));
	}

	const sides: string[] = value.startsWith('to ') ? value.slice(3).split(/\s+/) : [];

	if (sides.length === 1)
	{
		return toRadians(SIDE_ANGLES[sides[0]] ?? SIDE_ANGLES.bottom);
	}

	if (sides.length === 2)
	{
		const toRight: number = sides.includes('left') ? -1 : 1;
		const toBottom: number = sides.includes('top') ? -1 : 1;

		return Math.atan2(card.height * toRight, -card.width * toBottom);
	}

	return toRadians(SIDE_ANGLES.bottom);
};

// The line a linear gradient of the styles runs along over the card: long enough for the corners of the card
// to land on its ends, exactly as the styles resolve it.
const toGradientLine = (direction: string, card: BackdropBrushCard): GradientLine => {
	const angle: number = toGradientAngle(direction, card);
	const dx: number = Math.sin(angle);
	const dy: number = -Math.cos(angle);
	const reach: number = (Math.abs(card.width * dx) + Math.abs(card.height * dy)) / 2;

	const x: number = card.x + card.width / 2;
	const y: number = card.y + card.height / 2;

	return { x0: x - dx * reach, y0: y - dy * reach, x1: x + dx * reach, y1: y + dy * reach };
};

/*
 * A radial gradient of the styles is an ellipse - every radius of it is a share of its own side of the box -
 * while a gradient of a canvas is always a circle. The drawing area is squeezed along one axis for the
 * length of the call, and the canvas draws the very ellipse the styles do.
 */
const fillEllipse = (
	context: CanvasRenderingContext2D,
	spot: Spot,
	stops: WhatsNewGradientStop[],
	area: Size,
): void => {
	const squeeze: number = spot.radiusY / spot.radiusX;

	context.save();
	context.scale(1, squeeze);

	const gradient: CanvasGradient = context.createRadialGradient(
		spot.x,
		spot.y / squeeze,
		0,
		spot.x,
		spot.y / squeeze,
		spot.radiusX,
	);
	stops.forEach(([offset, color]: WhatsNewGradientStop) => gradient.addColorStop(offset, color));

	context.fillStyle = gradient;
	context.fillRect(0, 0, area.width, area.height / squeeze);
	context.restore();
};

// The crop of `cover`: the card is filled whole and the longer side of the raster hangs over the edge.
const drawRaster = (
	context: CanvasRenderingContext2D,
	card: BackdropBrushCard,
	raster: HTMLImageElement | null,
): boolean => {
	if (!isReady(raster))
	{
		return false;
	}

	const scale: number = Math.max(card.width / raster.naturalWidth, card.height / raster.naturalHeight);
	const width: number = raster.naturalWidth * scale;
	const height: number = raster.naturalHeight * scale;

	context.drawImage(
		raster,
		card.x + (card.width - width) / 2,
		card.y + (card.height - height) / 2,
		width,
		height,
	);

	return true;
};

// The composition is the same picture while the drawing area, the card, the softening and the places of the
// spots are: a spot that has not moved by a step of the grid of `SPOT_STEP` has not moved at all.
const toKey = ({ area, card, spots, blur, raster }: BakingPlan): string => {
	const places: string = spots
		.map((spot: Spot) => `${Math.round(spot.x / SPOT_STEP)},${Math.round(spot.y / SPOT_STEP)}`)
		.join(';');

	return [
		`${area.width}x${area.height}`,
		`${Math.round(card.x)},${Math.round(card.y)},${Math.round(card.width)},${Math.round(card.height)}`,
		blur,
		isReady(raster) ? 'raster' : 'fill',
		places,
	].join('|');
};

/**
 * The brush the moving effects draw the composition of the backdrop with: the very picture the static
 * variant of it shows, from the very numbers, so that switching the effect brings the composition to life
 * without changing it.
 *
 * What the sources of the mockup do not have is the buffer. There the composition is redrawn from its
 * gradients on every frame, and the effects that work pixel by pixel pull the whole picture out of the video
 * memory as well. Here it is baked once and read again until the size, the scheme or the phase of the drift
 * has changed.
 */
export class BackdropBrush
{
	#scheme: WhatsNewColorScheme;

	#buffer: HTMLCanvasElement | null = null;
	#context: CanvasRenderingContext2D | null = null;
	#key: string | null = null;
	#pixels: ImageData | null = null;
	#bakes: number = 0;

	constructor(scheme: WhatsNewColorScheme)
	{
		this.#scheme = scheme;
	}

	setScheme(scheme: WhatsNewColorScheme): void
	{
		this.#scheme = scheme;
		this.#key = null;
	}

	// Lays the composition over the whole drawing area of the effect.
	paint(target: CanvasRenderingContext2D, frame: BackdropBrushFrame): void
	{
		const buffer: HTMLCanvasElement | null = this.#bake(frame);
		if (buffer)
		{
			target.drawImage(buffer, 0, 0);
		}
	}

	// The composition pixel by pixel, for the effects that bend the background instead of drawing over it.
	// The reading is done once per baking and not once per frame.
	getPixels(frame: BackdropBrushFrame): Uint8ClampedArray | null
	{
		const buffer: HTMLCanvasElement | null = this.#bake(frame);
		if (!buffer || !this.#context)
		{
			return null;
		}

		this.#pixels ??= this.#context.getImageData(0, 0, buffer.width, buffer.height);

		return this.#pixels.data;
	}

	/**
	 * The baked composition as it is, for the effects that hand the picture over to another drawing engine
	 * instead of painting it themselves. The buffer belongs to the brush and is only there to be read from;
	 * when it was last drawn anew is told by the count of bakings.
	 */
	getBuffer(frame: BackdropBrushFrame): HTMLCanvasElement | null
	{
		return this.#bake(frame);
	}

	// How many times the composition has been drawn anew. The count is the only way from the outside to tell
	// a baked buffer from a rebuilt one.
	getBakeCount(): number
	{
		return this.#bakes;
	}

	destroy(): void
	{
		if (this.#buffer)
		{
			// A canvas of no size holds no memory: the window is opened again far more often than the page is
			// left.
			this.#buffer.width = 0;
			this.#buffer.height = 0;
		}

		this.#buffer = null;
		this.#context = null;
		this.#key = null;
		this.#pixels = null;
	}

	#bake(frame: BackdropBrushFrame): HTMLCanvasElement | null
	{
		const area: Size = { width: Math.round(frame.width), height: Math.round(frame.height) };
		if (area.width <= 0 || area.height <= 0)
		{
			return null;
		}

		const card: BackdropBrushCard = frame.card ?? { x: 0, y: 0, ...area };
		const plan: BakingPlan = {
			area,
			card,
			spots: this.#toSpots(card, frame),
			blur: frame.blur ?? 0,
			raster: getRaster(this.#scheme.image),
		};

		const key: string = toKey(plan);
		if (this.#key === key && this.#buffer)
		{
			return this.#buffer;
		}

		const context: CanvasRenderingContext2D | null = this.#requireContext(area);
		if (!context)
		{
			return null;
		}

		this.#draw(context, plan);

		this.#key = key;
		this.#pixels = null;
		this.#bakes += 1;

		return this.#buffer;
	}

	#draw(context: CanvasRenderingContext2D, plan: BakingPlan): void
	{
		const { area, card, spots, blur, raster } = plan;

		context.setTransform(1, 0, 0, 1, 0, 0);
		context.filter = 'none';
		context.fillStyle = this.#toBase(context, card);
		context.fillRect(0, 0, area.width, area.height);

		// A scheme drawn by a ready raster is that raster and nothing else: the spots and the vignette are
		// already in the picture the designer gave.
		if (drawRaster(context, card, raster))
		{
			return;
		}

		const clearGlow: string | null = toClear(this.#scheme.glow);
		if (clearGlow !== null)
		{
			const glow: WhatsNewGradientStop[] = [[0, this.#scheme.glow], [1, clearGlow]];

			context.filter = blur > 0 ? `blur(${blur}px)` : 'none';
			spots.forEach((spot: Spot) => fillEllipse(context, spot, glow, area));
			context.filter = 'none';
		}

		const clearBase: string | null = toClear(this.#scheme.base);
		if (clearBase === null)
		{
			return;
		}

		const { x, y, radius, clearUntil } = BackdropGeometry.vignette;
		fillEllipse(
			context,
			{
				x: card.x + x * card.width,
				y: card.y + y * card.height,
				radiusX: radius * card.width,
				radiusY: radius * card.height,
			},
			[[clearUntil, clearBase], [1, this.#scheme.base]],
			area,
		);
	}

	// The base of the card: the gradient of the scheme along the line the styles would run it, or the one
	// colour of it. The fill covers the margin of an effect as well - the end colours of a gradient go on
	// past the ends of its line.
	#toBase(context: CanvasRenderingContext2D, card: BackdropBrushCard): string | CanvasGradient
	{
		const run = this.#scheme.gradient;
		if (!run)
		{
			return this.#scheme.base;
		}

		const { x0, y0, x1, y1 } = toGradientLine(run.direction, card);
		const gradient: CanvasGradient = context.createLinearGradient(x0, y0, x1, y1);
		run.stops.forEach(([offset, color]: WhatsNewGradientStop) => gradient.addColorStop(offset, color));

		return gradient;
	}

	/*
	 * Where the spots of the glow stand this frame. Only their own drift moves them: the cursor is not asked
	 * about, so a light spot of the composition holds its place whatever the pointer does, exactly as it
	 * does under the static variant of the backdrop. What answers the cursor is the effect drawn over the
	 * composition, and it answers with itself.
	 */
	#toSpots(card: BackdropBrushCard, frame: BackdropBrushFrame): Spot[]
	{
		const time: number | null = frame.time;

		return BackdropGeometry.glow.map((spot: BackdropGlowSpot) => {
			// At rest there is no drift either: the composition stands where the static variant of it stands.
			const wave = (axis: { pace: number; phase: number; amplitude: number }): number => {
				return time === null ? 0 : Math.sin(time / axis.pace + axis.phase) * axis.amplitude;
			};

			return {
				x: card.x + (spot.x + wave(spot.drift.x)) * card.width,
				y: card.y + (spot.y + wave(spot.drift.y)) * card.height,
				radiusX: spot.radius * card.width,
				radiusY: spot.radius * card.height,
			};
		});
	}

	#requireContext(area: Size): CanvasRenderingContext2D | null
	{
		if (!this.#buffer)
		{
			this.#buffer = document.createElement('canvas');
			// The composition covers the whole area, so the buffer needs no transparency of its own.
			this.#context = this.#buffer.getContext('2d', { alpha: false });
		}

		if (this.#buffer.width !== area.width || this.#buffer.height !== area.height)
		{
			this.#buffer.width = area.width;
			this.#buffer.height = area.height;
		}

		return this.#context;
	}
}
