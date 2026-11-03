import {
	type WhatsNewBackdropEffect,
	type WhatsNewBackdropFrame,
	type WhatsNewBackdropPointer,
	type WhatsNewColorScheme,
} from '../../types';
import { type BackdropBrushFrame, BackdropBrush, toBlurRadius } from '../brush';

const FULL_TURN = Math.PI * 2;
const CHANNEL_MAX = 255;
// Channels of a picture, and of the table of the film - the film has no fourth one.
const PICTURE_CHANNELS = 4;
const FILM_CHANNELS = 3;

/*
 * The picture is built at half the card along either side and stretched back to it at the end, the way the
 * mockup builds it. The film of the bubble is a wash of colour with no line in it to lose, and every pixel of
 * the ball costs an arc tangent, a root, four sines and three readings of the background: at the full size of
 * the card that is four times the price for a decoration nobody measures with a ruler.
 */
const CELL = 2;
const MIN_CELLS = 2;

// The frame the numbers below are counted per, ms. A loop of another pace is brought to it by the step, so
// the ball moves at the same speed on a screen of any refresh rate. A step of no length is not one.
const FRAME = 16;
const MIN_DELTA = 1;

// The ball, in shares of the shorter side of the card, and how much of the way to the pointer it goes in a
// frame - a lag that long is what makes it read as light.
const RADIUS_SHARE = 0.42;
const FOLLOW = 0.032;

// A click within this much of the ball is a click on the ball: a rim that wobbles is hard to hit exactly.
const HIT_SLACK = 1.12;

/*
 * The life of the ball: it swells and fades over `BURST`, the card stays empty for `PAUSE`, and the new ball
 * grows over `BIRTH`. All three in ms - the phases are timed and not counted in frames.
 */
const BURST = 300;
const PAUSE = 1400;
const BIRTH = 560;
// How much wider the ball goes while bursting, how fast it fades while doing so, and the flash of light the
// burst adds to the rim.
const BURST_EXPAND = 0.5;
const BURST_FADE = 1.6;
const BURST_FLASH = 1.6;
// The share of its size the newborn ball starts at.
const BIRTH_FROM = 0.15;

// The splash of the burst: how many drops, how fast and how big they are, what they keep of their speed every
// frame, what they gain downwards and how much of their life a frame takes.
const DROPS = 16;
const DROP_SPREAD = 0.5;
const DROP_SPEED_MIN = 1.1;
const DROP_SPEED_MAX = 3.4;
const DROP_DRAG = 0.945;
const DROP_GRAVITY = 0.055;
const DROP_FADE = 0.014;

// The size of a drop and the width of its outline, in shares of the shorter side of the card - the same
// measure the stars of the trail of the sparkle are drawn in. The lengths of the mockup are those of a card
// 580 tall, and on a card of another height the splash keeps its share of it instead of its pixels.
const DROP_RADIUS_MIN = 0.0038;
const DROP_RADIUS_MAX = 0.0095;
const DROP_LINE = 0.0021;
// A drop drawn at its dimmest is this much smaller.
const DROP_SHRINK = 0.55;

/*
 * The squash of the ball: how much of it a unit of speed is worth, the ceiling of it, and the spring that
 * takes it there. The squash stands across the way the ball moves and the tail drags behind it, so a ball
 * thrown across the card reads as a drop of water and not as a circle sliding.
 */
const SQUASH_PER_SPEED = 0.019;
const MAX_SQUASH = 0.17;
const SQUASH_SPRING = 0.1;
const SQUASH_DAMPING = 0.86;
const SQUASH_HARMONIC = 2;
const TAIL_SHARE = 0.34;
// How much of the way to the speed of the frame the smoothed one goes, and the speed under which the ball is
// too slow to tell a direction from.
const SPEED_EASE = 0.25;
const MIN_AXIS_SPEED = 0.05;

/*
 * A card nobody has ever touched: the ball wanders around the middle of it along two waves of paces that
 * never come back to the same point. The spread is in shares of the card, the paces in ms per radian.
 */
const IDLE_SPREAD_X = 0.16;
const IDLE_SPREAD_Y = 0.14;
const IDLE_PACE_X = 6200;
const IDLE_PACE_Y = 8100;

/*
 * The soap film: the light that goes through it comes back having walked twice its thickness through a
 * matter of this refractive index, and the two ways interfere. A path of a whole number of waves of a colour
 * comes back bright and of a half of one dark, so the very same thickness is a different brightness for every
 * wavelength - that is the whole of the shimmer, and the wavelengths are those of red, green and blue light,
 * in nanometres.
 */
const FILM_INDEX = 1.33;
const FILM_THICKNESS = 260;
// The film is thicker where the ball turns away from the eye, and it flows: two waves running around and
// across it, of a share of the thickness each.
const FILM_EDGE_GAIN = 0.9;
const FILM_FLOW_A = 0.12;
const FILM_FLOW_A_HARMONIC = 3;
const FILM_FLOW_A_RADIAL = 5;
const FILM_FLOW_A_PACE = 4300;
const FILM_FLOW_B = 0.07;
const FILM_FLOW_B_HARMONIC = 5;
const FILM_FLOW_B_RADIAL = -8;
const FILM_FLOW_B_PACE = 6700;
// How much of the film is seen instead of the background: almost nothing over the middle of the ball, where
// one looks straight through it, and a tenth of it at the rim.
const FILM_MIX_CENTRE = 0.004;
const FILM_MIX_EDGE = 0.11;

// The steps of the table of the film, and the wavelengths it is built for.
const FILM_STEPS = 1024;
const WAVELENGTHS: readonly number[] = Object.freeze([650, 550, 460]);
// The longest path the light can take: the thickest the film ever gets, walked twice.
const FILM_PATH_MAX = 2 * FILM_INDEX * FILM_THICKNESS * (1 + FILM_EDGE_GAIN) * (1 + FILM_FLOW_A + FILM_FLOW_B);

/*
 * How far the rim of the ball takes the background behind it, in cells, and how much further the red end of
 * the spectrum is taken than the blue one. The light gathered by that very bending is the caustic, and the
 * floor keeps the gathering finite where the bending folds the picture over itself.
 */
const REFRACTION = 26;
const CHROMA = 0.16;
const CAUSTIC = 12;
const MIN_STRETCH = 0.35;

// The ball takes this much of the light away at its rim, and gives this much back where it catches the lamp.
// The highlight lives on the far side of `SPECULAR_DIR` radians, over the outer part of the ball only.
const EDGE_DIM = 0.03;
const SPECULAR = 64;
const SPECULAR_DIR = -2.35;
const SPECULAR_FROM = 0.55;
const SPECULAR_SHARPNESS = 10;
const SPECULAR_FLASH = 0.6;

/*
 * The rim is not a circle: three waves run around it, of harmonics and paces that never line up, so the ball
 * lives even while it stands still. The amplitudes are in shares of the radius, the paces in ms per radian.
 */
const RIM_ONE_HARMONIC = 3;
const RIM_ONE_AMPLITUDE = 0.03;
const RIM_ONE_PACE = 2600;
const RIM_TWO_HARMONIC = 5;
const RIM_TWO_AMPLITUDE = 0.022;
const RIM_TWO_PACE = 3700;
const RIM_THREE_HARMONIC = 2;
const RIM_THREE_AMPLITUDE = 0.016;
const RIM_THREE_PACE = 5300;

// How far past the radius the pixels are walked, so that the wobble of the rim, the squash and the tail all
// fall inside the box, and how many cells the rim is softened over.
const REACH = 1.09;
const EDGE_SOFTNESS = 1.6;

// A ball dimmer than this is not drawn at all: the pixels under it would come out the background they
// already are.
const MIN_VISIBILITY = 0.002;
// The very middle of the ball has no direction to bend the light in, and no height to speak of either.
const MIN_DISTANCE = 0.0001;
const MIN_HEIGHT = 0.0001;

export type BubblePhase = 'alive' | 'burst' | 'gone' | 'birth';

// A drop of the splash. Its colour is taken from the very table the film is drawn from: a splash is what the
// film has been torn into.
type Drop = {
	x: number;
	y: number;
	speedX: number;
	speedY: number;
	radius: number;
	life: number;
	film: number;
};

/*
 * The table of the film: how bright every wavelength comes back from a path of a given length. It depends on
 * the film alone - on nothing of the colour scheme and on nothing of the frame - so it is built once for the
 * page and read by every ball on it. The mockup builds it once as well, and it is the one thing there that
 * is not paid for per frame.
 */
let filmTable: Float32Array | null = null;
let filmBuilds: number = 0;

const getFilmTable = (): Float32Array => {
	if (filmTable)
	{
		return filmTable;
	}

	const table = new Float32Array(FILM_STEPS * FILM_CHANNELS);

	for (let step = 0; step < FILM_STEPS; step++)
	{
		const path: number = (step / (FILM_STEPS - 1)) * FILM_PATH_MAX;

		for (let channel = 0; channel < FILM_CHANNELS; channel++)
		{
			const turns: number = (FULL_TURN * path) / WAVELENGTHS[channel];

			table[step * FILM_CHANNELS + channel] = 0.5 - 0.5 * Math.cos(turns);
		}
	}

	filmTable = table;
	filmBuilds += 1;

	return table;
};

const between = (from: number, to: number): number => from + Math.random() * (to - from);

const clamp = (value: number, last: number): number => {
	if (value < 0)
	{
		return 0;
	}

	return value > last ? last : value;
};

// A share of the way brought to a stop at either end of it.
const smooth = (share: number): number => share * share * (3 - 2 * share);

/**
 * The soap bubble of the backdrop: one ball following the pointer, bending the composition behind it and
 * shimmering with the colours of its film. Clicked, it bursts into a ring of drops and grows anew a moment
 * later.
 *
 * The ball carries no colour of its own. Every pixel of it is a pixel of the composition read from a little
 * aside - the further from the middle of the ball, the further aside, and a shade further for the red end of
 * the spectrum than for the blue one - with the light of the film laid over it, the more of it the nearer the
 * rim.
 *
 * Two things the mockup pays for on every frame are not paid for here. The composition is read from the
 * buffer of the brush and not pulled out of the video memory anew, and the table of the film is built once
 * for the page. What is left is the walk over the pixels, and that walk goes over the box of the ball alone -
 * some third of the card - and not over the whole of it.
 *
 * The effect never answers about rest: the film flows, the rim wobbles and the ball wanders over a card
 * nobody has touched, so there is no frame the loop could be spared.
 */
export class BubbleEffect implements WhatsNewBackdropEffect
{
	#brush: BackdropBrush;

	// The card at the size of the grid, and the picture built on it. The stretching back to the card is what
	// a canvas does and an array of pixels cannot.
	#surface: HTMLCanvasElement = document.createElement('canvas');
	#context: CanvasRenderingContext2D | null = null;
	#image: ImageData | null = null;

	// The grid, in cells, and the ball on it.
	#width: number = 0;
	#height: number = 0;
	#radius: number = 0;

	// Where the ball is and where it is going, in cells. A ball that has never been placed stands nowhere.
	#x: number = -1;
	#y: number = -1;
	#targetX: number = 0;
	#targetY: number = 0;

	// Where the ball was on the previous frame, how fast it is going and which way. The speed is a smoothed
	// one: the movement of a single frame is too jumpy to squash a ball by.
	#previousX: number = 0;
	#previousY: number = 0;
	#speedX: number = 0;
	#speedY: number = 0;
	#axis: number = 0;

	#squash: number = 0;
	#squashSpeed: number = 0;

	// Whether the pointer has ever been on the card. Until it has, the ball wanders by itself.
	#seen: boolean = false;

	#phase: BubblePhase = 'alive';
	#phaseStart: number = 0;
	#time: number = 0;

	// What the phase makes of the ball this frame: how big it is, how much of it is seen, and how much light
	// the burst adds.
	#size: number = 1;
	#visibility: number = 1;
	#flash: number = 0;

	#drops: Drop[] = [];

	#film: Float32Array = getFilmTable();

	// The token is read off the canvas once: the styles of the portal do not change under a window that is
	// already open.
	#blur: number | null = null;

	constructor(scheme: WhatsNewColorScheme)
	{
		this.#brush = new BackdropBrush(scheme);
	}

	draw(frame: WhatsNewBackdropFrame): void
	{
		if (!this.#requireGrid(frame.width, frame.height))
		{
			return;
		}

		const context: CanvasRenderingContext2D | null = this.#context;
		const composition: BackdropBrushFrame = this.#toComposition(frame);
		const source: Uint8ClampedArray | null = this.#brush.getPixels(composition);
		if (!context || !source)
		{
			return;
		}

		this.#time = frame.time;
		this.#brush.paint(context, composition);

		const step: number = Math.max(frame.delta, MIN_DELTA) / FRAME;

		this.#advance(frame.time);
		this.#aim(frame.pointer, frame.time);
		this.#move(step);

		if (this.#visibility > MIN_VISIBILITY)
		{
			this.#refract(source);
		}

		this.#splash(context, step);

		frame.context.drawImage(this.#surface, 0, 0, frame.width, frame.height);
	}

	// Bursts the ball, if the press has landed on it. A press away from the ball, and one on a ball that is
	// already bursting or growing, is not one.
	press(pointer: WhatsNewBackdropPointer): void
	{
		if (this.#phase !== 'alive' || this.#width === 0)
		{
			return;
		}

		const x: number = pointer.x * this.#width;
		const y: number = pointer.y * this.#height;
		if (Math.hypot(x - this.#x, y - this.#y) > this.#radius * HIT_SLACK)
		{
			return;
		}

		this.#phase = 'burst';
		this.#phaseStart = this.#time;
		this.#burst();
	}

	// Where the ball stands in its life. The phase is the only way from the outside to tell a ball that has
	// burst from one that is growing back.
	getPhase(): BubblePhase
	{
		return this.#phase;
	}

	// How many drops of the splash are still in the air.
	getDropCount(): number
	{
		return this.#drops.length;
	}

	// How many times the table of the film has been built since the page was loaded. The count is the only
	// way from the outside to tell a table built once from one built again.
	static getFilmTableBuilds(): number
	{
		return filmBuilds;
	}

	// The table of the film is not touched: it is the film that decides it, and the film is the same under
	// every colour scheme.
	setScheme(scheme: WhatsNewColorScheme): void
	{
		this.#brush.setScheme(scheme);
	}

	destroy(): void
	{
		this.#brush.destroy();

		this.#image = null;
		this.#drops = [];
		this.#width = 0;
		this.#height = 0;

		// A canvas of no size holds no memory.
		this.#surface.width = 0;
		this.#surface.height = 0;
	}

	// What the brush is asked for: the composition over the whole grid. The softening is the token of the
	// static layers taken down to the size of a cell - the composition must read as softly under the ball as
	// it does beside it.
	#toComposition(frame: WhatsNewBackdropFrame): BackdropBrushFrame
	{
		return {
			width: this.#width,
			height: this.#height,
			time: frame.time,
			blur: this.#requireBlur(frame.context.canvas) / CELL,
		};
	}

	#requireBlur(canvas: HTMLCanvasElement): number
	{
		this.#blur ??= toBlurRadius(canvas);

		return this.#blur;
	}

	#requireGrid(width: number, height: number): boolean
	{
		const cells: number = Math.max(MIN_CELLS, Math.round(width / CELL));
		const lines: number = Math.max(MIN_CELLS, Math.round(height / CELL));

		if (cells === this.#width && lines === this.#height)
		{
			return this.#image !== null;
		}

		this.#width = cells;
		this.#height = lines;
		this.#radius = Math.min(cells, lines) * RADIUS_SHARE;

		this.#surface.width = cells;
		this.#surface.height = lines;
		// The picture covers the card whole, so the canvas under it needs no transparency of its own.
		this.#context ??= this.#surface.getContext('2d', { alpha: false });
		this.#image = this.#context?.createImageData(cells, lines) ?? null;

		// A card that has just got its first size gets the ball in the middle of it.
		if (this.#x < 0)
		{
			this.#place(cells / 2, lines / 2);
			this.#targetX = this.#x;
			this.#targetY = this.#y;
		}

		return this.#image !== null;
	}

	#place(x: number, y: number): void
	{
		this.#x = x;
		this.#y = y;
		this.#previousX = x;
		this.#previousY = y;
		this.#speedX = 0;
		this.#speedY = 0;
		this.#squash = 0;
		this.#squashSpeed = 0;
	}

	// Moves the life of the ball on and works out what the phase makes of it. The phase that has run out is
	// closed after the frame it ran out on has been drawn, so no step of the life is skipped.
	#advance(time: number): void
	{
		this.#size = 1;
		this.#visibility = 1;
		this.#flash = 0;

		const gone: number = time - this.#phaseStart;

		if (this.#phase === 'burst')
		{
			const share: number = Math.min(1, gone / BURST);
			const eased: number = 1 - (1 - share) ** 3;

			this.#size = 1 + BURST_EXPAND * eased;
			this.#visibility = (1 - share) ** BURST_FADE;
			this.#flash = BURST_FLASH * (1 - share);

			if (share >= 1)
			{
				this.#phase = 'gone';
				this.#phaseStart = time;
			}

			return;
		}

		if (this.#phase === 'gone')
		{
			this.#visibility = 0;

			if (gone >= PAUSE)
			{
				this.#phase = 'birth';
				this.#phaseStart = time;
				// The new ball is born where the old one was going, and not where it burst.
				this.#place(this.#targetX, this.#targetY);
			}

			return;
		}

		if (this.#phase === 'birth')
		{
			const share: number = Math.min(1, gone / BIRTH);
			const eased: number = 1 - (1 - share) ** 3;

			this.#size = BIRTH_FROM + (1 - BIRTH_FROM) * eased;
			this.#visibility = eased;

			if (share >= 1)
			{
				this.#phase = 'alive';
			}
		}
	}

	// Where the ball is going: after the pointer, and while the card has never been touched, along two waves
	// of its own.
	#aim(pointer: WhatsNewBackdropPointer, time: number): void
	{
		this.#seen ||= pointer.inside;

		if (this.#seen)
		{
			this.#targetX = pointer.x * this.#width;
			this.#targetY = pointer.y * this.#height;

			return;
		}

		this.#targetX = this.#width * (0.5 + Math.sin(time / IDLE_PACE_X) * IDLE_SPREAD_X);
		this.#targetY = this.#height * (0.5 + Math.cos(time / IDLE_PACE_Y) * IDLE_SPREAD_Y);
	}

	// Takes the ball a step of the way towards where it is going, and squashes it by how fast it got there.
	#move(step: number): void
	{
		const follow: number = 1 - (1 - FOLLOW) ** step;

		this.#x += (this.#targetX - this.#x) * follow;
		this.#y += (this.#targetY - this.#y) * follow;

		const walkedX: number = (this.#x - this.#previousX) / step;
		const walkedY: number = (this.#y - this.#previousY) / step;
		this.#previousX = this.#x;
		this.#previousY = this.#y;

		const ease: number = 1 - (1 - SPEED_EASE) ** step;
		this.#speedX += (walkedX - this.#speedX) * ease;
		this.#speedY += (walkedY - this.#speedY) * ease;

		const speed: number = Math.hypot(this.#speedX, this.#speedY);
		if (speed > MIN_AXIS_SPEED)
		{
			this.#axis = Math.atan2(this.#speedY, this.#speedX);
		}

		const wanted: number = Math.min(MAX_SQUASH, speed * SQUASH_PER_SPEED);

		this.#squashSpeed += (wanted - this.#squash) * SQUASH_SPRING * step;
		this.#squashSpeed *= SQUASH_DAMPING ** step;
		this.#squash += this.#squashSpeed * step;
	}

	// Builds the picture of the ball over the composition already laid down, and lays it back on the surface.
	// The walk goes over the box of the ball and over nothing besides it.
	#refract(source: Uint8ClampedArray): void
	{
		const image: ImageData | null = this.#image;
		const context: CanvasRenderingContext2D | null = this.#context;
		if (!image || !context)
		{
			return;
		}

		const width: number = this.#width;
		const radius: number = this.#radius * this.#size;
		const tail: number = this.#squash * TAIL_SHARE;
		const reach: number = radius * (REACH + Math.abs(this.#squash) + Math.abs(tail));

		const fromX: number = Math.max(0, Math.floor(this.#x - reach));
		const toX: number = Math.min(width, Math.ceil(this.#x + reach));
		const fromY: number = Math.max(0, Math.floor(this.#y - reach));
		const toY: number = Math.min(this.#height, Math.ceil(this.#y + reach));
		if (toX <= fromX || toY <= fromY)
		{
			return;
		}

		const picture: Uint8ClampedArray = image.data;

		/*
		 * The box starts as the composition under it: only the pixels of the ball are written over, while a
		 * picture is laid back in rectangles. The composition is opaque, so the fourth channel comes along
		 * with the three and is never written again.
		 */
		for (let row = fromY; row < toY; row++)
		{
			const line: number = row * width * PICTURE_CHANNELS;
			const at: number = line + fromX * PICTURE_CHANNELS;

			picture.set(source.subarray(at, line + toX * PICTURE_CHANNELS), at);
		}

		this.#paint(source, picture, { fromX, toX, fromY, toY, radius, tail });

		context.putImageData(image, 0, 0, fromX, fromY, toX - fromX, toY - fromY);
	}

	#paint(
		source: Uint8ClampedArray,
		image: Uint8ClampedArray,
		box: { fromX: number, toX: number, fromY: number, toY: number, radius: number, tail: number },
	): void
	{
		const picture: Uint8ClampedArray = image;
		const { fromX, toX, fromY, toY, radius, tail } = box;
		const {
			width, film, visibility, flash, steps, squash, rimOne, rimTwo, rimThree, flowOne, flowTwo, outer,
		} = this.#getPaintState(radius, tail);

		for (let row = fromY; row < toY; row++)
		{
			const dy: number = row - this.#y;
			const line: number = row * width;
			const span: number = outer * outer - dy * dy;
			if (span <= 0)
			{
				continue;
			}

			const half: number = Math.sqrt(span);
			const first: number = Math.max(fromX, Math.ceil(this.#x - half));
			const last: number = Math.min(toX, Math.floor(this.#x + half) + 1);
			for (let column = first; column < last; column++)
			{
				const dx: number = column - this.#x;
				// eslint-disable-next-line unicorn/prefer-modern-math-apis -- This runs for every painted pixel.
				const distance: number = Math.sqrt(dx * dx + dy * dy);
				if (distance < MIN_DISTANCE)
				{
					continue;
				}

				const angle: number = Math.atan2(dy, dx);
				const turn: number = angle - this.#axis;
				const rim: number = radius * (
					1
					+ RIM_ONE_AMPLITUDE * Math.sin(RIM_ONE_HARMONIC * angle + rimOne)
					+ RIM_TWO_AMPLITUDE * Math.sin(RIM_TWO_HARMONIC * angle - rimTwo)
					+ RIM_THREE_AMPLITUDE * Math.sin(RIM_THREE_HARMONIC * angle + rimThree)
					+ squash * Math.cos(SQUASH_HARMONIC * turn)
					- tail * Math.cos(turn)
				);

				// How much of the pixel the ball covers. Past the rim it is nothing, and over the width of the
				// softening it comes up to the whole of it.
				const edge: number = rim - distance;
				if (edge < -EDGE_SOFTNESS)
				{
					continue;
				}

				const reach: number = edge / EDGE_SOFTNESS + 0.5;
				if (reach <= 0)
				{
					continue;
				}

				const cover: number = reach >= 1 ? 1 : smooth(reach);

				const share: number = Math.min(1, distance / rim);
				const unitX: number = dx / distance;
				const unitY: number = dy / distance;
				// How high the ball stands over the card at this pixel: a sphere seen from straight above.
				const height: number = Math.sqrt(Math.max(MIN_HEIGHT, 1 - share * share));

				// The background is taken from further aside the nearer the rim, and the red end of the
				// spectrum from further than the blue one.
				const push: number = REFRACTION * share * share * share;
				const red: number = this.#read(source, column, row, unitX, unitY, push * (1 + CHROMA), 0);
				const green: number = this.#read(source, column, row, unitX, unitY, push, 1);
				const blue: number = this.#read(source, column, row, unitX, unitY, push * (1 - CHROMA), 2);

				// The bending squeezes the background together, and light squeezed together is light gained.
				const stretch: number = 1 - (3 * REFRACTION * share * share) / rim;
				const caustic: number = CAUSTIC * (1 / Math.max(MIN_STRETCH, stretch) - 1);

				const thickness: number = FILM_THICKNESS
					* (1 + FILM_EDGE_GAIN * (1 - height))
					* (
						1
						+ FILM_FLOW_A * Math.sin(
							FILM_FLOW_A_HARMONIC * angle + FILM_FLOW_A_RADIAL * share - flowOne,
						)
						+ FILM_FLOW_B * Math.sin(
							FILM_FLOW_B_HARMONIC * angle + FILM_FLOW_B_RADIAL * share + flowTwo,
						)
					);

				const shade: number = clamp(
					Math.trunc(2 * FILM_INDEX * thickness * steps),
					FILM_STEPS - 1,
				) * FILM_CHANNELS;

				const squared: number = share * share;
				const mix: number = (
					FILM_MIX_CENTRE + (FILM_MIX_EDGE - FILM_MIX_CENTRE) * squared * squared
				) * visibility;
				const dim: number = 1 - EDGE_DIM * share * visibility;

				let light: number = caustic * visibility;
				const lamp: number = Math.cos(angle - SPECULAR_DIR);
				if (lamp > 0 && share > SPECULAR_FROM)
				{
					const ramp: number = (share - SPECULAR_FROM) / (1 - SPECULAR_FROM);

					light += SPECULAR
						* (visibility + flash * SPECULAR_FLASH)
						* ramp * ramp
						* lamp ** SPECULAR_SHARPNESS;
				}

				const at: number = (line + column) * PICTURE_CHANNELS;

				picture[at] = this.#blend(source[at], red, film[shade], mix, dim, light, cover);
				picture[at + 1] = this.#blend(source[at + 1], green, film[shade + 1], mix, dim, light, cover);
				picture[at + 2] = this.#blend(source[at + 2], blue, film[shade + 2], mix, dim, light, cover);
			}
		}
	}

	#getPaintState(radius: number, tail: number): {
		width: number,
		film: Float32Array,
		visibility: number,
		flash: number,
		steps: number,
		squash: number,
		rimOne: number,
		rimTwo: number,
		rimThree: number,
		flowOne: number,
		flowTwo: number,
		outer: number,
	}
	{
		const squash: number = this.#squash;
		const time: number = this.#time;
		const outer: number = radius * (
			1 + RIM_ONE_AMPLITUDE + RIM_TWO_AMPLITUDE + RIM_THREE_AMPLITUDE
			+ Math.abs(squash) + Math.abs(tail)
		) + EDGE_SOFTNESS;

		return {
			width: this.#width,
			film: this.#film,
			visibility: this.#visibility,
			flash: this.#flash,
			steps: (FILM_STEPS - 1) / FILM_PATH_MAX,
			squash,
			rimOne: time / RIM_ONE_PACE,
			rimTwo: time / RIM_TWO_PACE,
			rimThree: time / RIM_THREE_PACE,
			flowOne: time / FILM_FLOW_A_PACE,
			flowTwo: time / FILM_FLOW_B_PACE,
			outer,
		};
	}

	// One channel of a pixel of the ball: the background it bends, washed with the colour of the film, taken
	// down at the rim, lit by the caustic and the lamp, and let out into the card over the softening.
	#blend(
		under: number,
		bent: number,
		film: number,
		mix: number,
		dim: number,
		light: number,
		cover: number,
	): number
	{
		const value: number = (bent * (1 - mix) + CHANNEL_MAX * film * mix) * dim + light;

		return cover >= 1 ? value : under * (1 - cover) + value * cover;
	}

	// One channel of the background, read from where the ball bends the sight. A reading that walks off the
	// grid is taken from the edge of it.
	#read(
		source: Uint8ClampedArray,
		x: number,
		y: number,
		unitX: number,
		unitY: number,
		push: number,
		channel: number,
	): number
	{
		const column: number = clamp(Math.round(x - unitX * push), this.#width - 1);
		const row: number = clamp(Math.round(y - unitY * push), this.#height - 1);

		return source[(row * this.#width + column) * PICTURE_CHANNELS + channel];
	}

	// The ring of drops the burst throws off the rim of the ball.
	#burst(): void
	{
		const drops: Drop[] = [];
		const side: number = Math.min(this.#width, this.#height);

		for (let drop = 0; drop < DROPS; drop++)
		{
			const angle: number = (drop / DROPS) * FULL_TURN + (Math.random() - 0.5) * DROP_SPREAD;
			const speed: number = between(DROP_SPEED_MIN, DROP_SPEED_MAX);

			drops.push({
				x: this.#x + Math.cos(angle) * this.#radius,
				y: this.#y + Math.sin(angle) * this.#radius,
				speedX: Math.cos(angle) * speed,
				speedY: Math.sin(angle) * speed,
				radius: between(DROP_RADIUS_MIN, DROP_RADIUS_MAX) * side,
				life: 1,
				film: Math.trunc(Math.random() * FILM_STEPS),
			});
		}

		this.#drops = drops;
	}

	// Moves what is left of the splash and draws it. The array is walked from the end, so that a drop taken
	// out of it never moves the ones not looked at yet.
	#splash(context: CanvasRenderingContext2D, step: number): void
	{
		if (this.#drops.length === 0)
		{
			return;
		}

		const drag: number = DROP_DRAG ** step;

		for (let at = this.#drops.length - 1; at >= 0; at--)
		{
			const drop: Drop = this.#drops[at];

			drop.life -= DROP_FADE * step;
			if (drop.life <= 0)
			{
				this.#drops.splice(at, 1);

				continue;
			}

			drop.x += drop.speedX * step;
			drop.y += drop.speedY * step;
			drop.speedX *= drag;
			drop.speedY *= drag;
			drop.speedY += DROP_GRAVITY * step;
		}

		context.lineWidth = DROP_LINE * Math.min(this.#width, this.#height);
		this.#drops.forEach((drop: Drop) => this.#paintDrop(context, drop));
		context.globalAlpha = 1;
	}

	#paintDrop(context: CanvasRenderingContext2D, drop: Drop): void
	{
		const at: number = drop.film * FILM_CHANNELS;
		const red: number = Math.round(CHANNEL_MAX * this.#film[at]);
		const green: number = Math.round(CHANNEL_MAX * this.#film[at + 1]);
		const blue: number = Math.round(CHANNEL_MAX * this.#film[at + 2]);

		context.globalAlpha = drop.life;
		context.strokeStyle = `rgb(${red}, ${green}, ${blue})`;
		context.beginPath();
		context.arc(
			drop.x,
			drop.y,
			drop.radius * (DROP_SHRINK + (1 - DROP_SHRINK) * drop.life),
			0,
			FULL_TURN,
		);
		context.stroke();
	}
}
