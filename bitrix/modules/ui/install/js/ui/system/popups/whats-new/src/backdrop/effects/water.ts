import {
	type WhatsNewBackdropEffect,
	type WhatsNewBackdropFrame,
	type WhatsNewBackdropPointer,
	type WhatsNewColorScheme,
} from '../../types';
import { type BackdropBrushFrame, BackdropBrush, toBlurRadius } from '../brush';

const QUARTER_TURN = Math.PI / 2;
const OPAQUE = 255;

/*
 * The surface is a grid of springs, and one cell of it covers this many pixels of the card. Every pass of
 * the frame walks the grid whole, so a cell of one pixel would cost four times as much for a ripple nobody
 * measures with a ruler; the picture is stretched back to the card at the end and the stretching softens
 * the step of the grid along the way.
 */
const CELL = 2;
const MIN_CELLS = 2;

/*
 * A wave that reaches the edge of the grid bounces back and stands there as a ripple that never came from
 * anywhere. The grid is therefore wider than the card by this rim of cells, and a wave that walks into the
 * rim is eaten by it: at the very edge a cell keeps `EDGE_DAMPING` of what it holds, and the loss fades to
 * nothing where the rim meets the card. The card is drawn from the middle of that grid and the rim is never
 * seen.
 */
const MARGIN = 44;
const EDGE_DAMPING = 0.6;

// The spring of the surface: how hard a cell is pulled towards its neighbours, what a wave keeps of its
// speed, and what the surface keeps of its height. Both losses are per frame.
const TENSION = 0.065;
const VISCOSITY = 0.99;
const RECOVERY = 0.99;

// How far the slope of the surface takes the background under it, in cells per unit of slope, how much
// light that slope adds or takes away, and the ceiling of that light.
const REFRACTION = 12;
const SHADING = 26;
const MAX_SHADE = 45;

/*
 * The dent the pointer presses into the surface: the reach of it in cells, and the share of the reach that
 * goes down by the full impulse. Past the plateau the impulse fades along a squared cosine, so the dent has
 * no rim of its own.
 */
const TOUCH_RADIUS = 34;
const TOUCH_PLATEAU = 0.55;

// The path of the pointer between two frames is pressed as a row of dents and not as one: a pointer thrown
// across the card must leave a wake and not a single hole at the end of it.
const TOUCH_STEP = 8;
const MAX_TOUCH_STEPS = 5;

// How deep a cell of the path is pressed, and the floor a movement too small to be worth a dent falls under.
const IMPULSE_PER_CELL = 0.0018;
const MAX_IMPULSE = 0.036;
const MIN_IMPULSE = 0.0008;

/*
 * The swell of the water itself: two wide and shallow sources wandering over the card along a figure of
 * Lissajous - two waves per source, of paces that never come back to the same point - so that a card nobody
 * touches is alive all the same. They press every other frame: the sources are broad, and pressing them on
 * every frame only makes the swell deeper without making it any smoother.
 */
const SWELL_SOURCES = 2;
const SWELL_EVERY = 2;
const SWELL_IMPULSE = 0.012;
const SWELL_RADIUS = 124;
// How far from the middle of the card a source wanders, in shares of it, and the pace of that wandering,
// radians per ms.
const SWELL_SPREAD = 0.46;
const SWELL_PACE = 0.00009;
// The second wave of a source runs at this share of the pace of the first one, and the second source starts
// this much further along both of them.
const SWELL_ASPECT = 0.73;
const SWELL_PHASE = 2.1;
const SWELL_TWIST = 1.7;

type Place = {
	x: number;
	y: number;
};

const smooth = (share: number): number => share * share * (3 - 2 * share);

/**
 * The water of the backdrop: a grid of springs over the composition, bent by the pointer and swelling by
 * itself. The surface carries no colour of its own - every pixel of it is a pixel of the composition taken
 * from a little aside, the way water shows the bottom under it, and lit or darkened by the slope it was
 * taken through.
 *
 * The composition is read from the buffer of the brush and not from the canvas: in the sources of the mockup
 * the background is drawn anew and pulled out of the video memory on every single frame - a card of 680x580
 * is some 162 thousand pixels - and that reading is the price of the effect. Here the picture is read once
 * per baking of it, which is to say on a change of size, of colour scheme or of the phase of the drift.
 *
 * The effect never answers about rest: the swell of the water is its own and does not end, so there is no
 * frame the loop could be spared.
 */
export class WaterEffect implements WhatsNewBackdropEffect
{
	#brush: BackdropBrush;

	// The card at the size of the grid, and the picture built for it. The stretching back to the card is
	// what a canvas does and an array of pixels cannot.
	#surface: HTMLCanvasElement = document.createElement('canvas');
	#context: CanvasRenderingContext2D | null = null;
	#image: ImageData | null = null;

	// The grid, in cells, rim included - and the card inside it.
	#width: number = 0;
	#height: number = 0;
	#cardWidth: number = 0;
	#cardHeight: number = 0;

	// How high the surface stands, how fast it moves, and what every cell keeps of both. The last one is the
	// rim and nothing else, and it is counted once per size of the grid.
	#level: Float32Array = new Float32Array(0);
	#velocity: Float32Array = new Float32Array(0);
	#damping: Float32Array = new Float32Array(0);

	// Where the pointer stood on the previous frame, in cells. Lost the moment the pointer leaves the card:
	// the way back in is not a path walked over the water.
	#trail: Place | null = null;
	#ticks: number = 0;

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

		const source: Uint8ClampedArray | null = this.#brush.getPixels(this.#toComposition(frame));
		if (!source)
		{
			return;
		}

		this.#stir(frame);
		this.#settle();
		this.#refract(source);
		this.#show(frame.context, frame.width, frame.height);
	}

	// The grid, in cells and with the rim counted in. The size is the only way from the outside to tell a
	// grid built anew for a card of another size from one stretched over it.
	getGridSize(): { width: number, height: number }
	{
		return { width: this.#width, height: this.#height };
	}

	setScheme(scheme: WhatsNewColorScheme): void
	{
		this.#brush.setScheme(scheme);
	}

	destroy(): void
	{
		this.#brush.destroy();

		this.#level = new Float32Array(0);
		this.#velocity = new Float32Array(0);
		this.#damping = new Float32Array(0);
		this.#image = null;
		this.#trail = null;
		this.#cardWidth = 0;
		this.#cardHeight = 0;

		// A canvas of no size holds no memory.
		this.#surface.width = 0;
		this.#surface.height = 0;
	}

	/*
	 * What the brush is asked for: the composition over the whole grid, with the card standing in the middle
	 * of it. The rim is not a picture of its own but the very same composition run on past the card, so the
	 * water at the very edge bends a background that is there.
	 *
	 * The softening is the token of the static layers, taken down to the size of a cell: the composition
	 * must read as softly under the water as it does beside it.
	 */
	#toComposition(frame: WhatsNewBackdropFrame): BackdropBrushFrame
	{
		return {
			width: this.#width,
			height: this.#height,
			card: { x: MARGIN, y: MARGIN, width: this.#cardWidth, height: this.#cardHeight },
			time: frame.time,
			blur: this.#requireBlur(frame.context.canvas) / CELL,
		};
	}

	#requireBlur(canvas: HTMLCanvasElement): number
	{
		this.#blur ??= toBlurRadius(canvas);

		return this.#blur;
	}

	// A card of another size gets a grid of another size, built empty: a surface stretched over it would
	// carry the waves of the old card at the wrong length.
	#requireGrid(width: number, height: number): boolean
	{
		const cardWidth: number = Math.max(MIN_CELLS, Math.round(width / CELL));
		const cardHeight: number = Math.max(MIN_CELLS, Math.round(height / CELL));

		if (cardWidth === this.#cardWidth && cardHeight === this.#cardHeight)
		{
			return this.#image !== null;
		}

		this.#cardWidth = cardWidth;
		this.#cardHeight = cardHeight;
		this.#width = cardWidth + MARGIN * 2;
		this.#height = cardHeight + MARGIN * 2;

		const cells: number = this.#width * this.#height;
		this.#level = new Float32Array(cells);
		this.#velocity = new Float32Array(cells);
		this.#damping = this.#bakeDamping();
		this.#trail = null;

		this.#surface.width = cardWidth;
		this.#surface.height = cardHeight;
		// The picture covers the card whole, so the canvas under it needs no transparency of its own.
		this.#context ??= this.#surface.getContext('2d', { alpha: false });
		this.#image = this.#context?.createImageData(cardWidth, cardHeight) ?? null;

		if (this.#image)
		{
			// The picture is opaque once and for all: only the three colours of a pixel change from frame to
			// frame, and writing the fourth one every time is a pass over the card for nothing.
			const data: Uint8ClampedArray = this.#image.data;
			for (let at = 3; at < data.length; at += 4)
			{
				data[at] = OPAQUE;
			}
		}

		return this.#image !== null;
	}

	// How much of what a cell holds it keeps. Everything away from the rim keeps all of it; a cell of the rim
	// keeps the less the closer to the edge it stands.
	#bakeDamping(): Float32Array
	{
		const damping = new Float32Array(this.#width * this.#height);
		const lastColumn: number = this.#width - 1;
		const lastRow: number = this.#height - 1;

		for (let row = 0; row < this.#height; row++)
		{
			const line: number = row * this.#width;

			for (let column = 0; column < this.#width; column++)
			{
				const toEdge: number = Math.min(column, row, lastColumn - column, lastRow - row);
				const share: number = Math.min(1, toEdge / MARGIN);

				damping[line + column] = EDGE_DAMPING + (1 - EDGE_DAMPING) * smooth(share);
			}
		}

		return damping;
	}

	#stir(frame: WhatsNewBackdropFrame): void
	{
		this.#follow(frame.pointer);
		this.#swell(frame.time);
	}

	// The wake of the pointer: the path it walked since the previous frame, pressed into the surface as a row
	// of dents, the deeper the faster it went.
	#follow(pointer: WhatsNewBackdropPointer): void
	{
		if (!pointer.inside)
		{
			this.#trail = null;

			return;
		}

		const place: Place = {
			x: MARGIN + pointer.x * this.#cardWidth,
			y: MARGIN + pointer.y * this.#cardHeight,
		};

		const from: Place | null = this.#trail;
		this.#trail = place;

		if (!from)
		{
			return;
		}

		const walked: number = Math.hypot(place.x - from.x, place.y - from.y);
		const power: number = Math.min(walked * IMPULSE_PER_CELL, MAX_IMPULSE);
		if (power <= MIN_IMPULSE)
		{
			return;
		}

		const steps: number = Math.min(Math.ceil(walked / TOUCH_STEP), MAX_TOUCH_STEPS);

		for (let step = 1; step <= steps; step++)
		{
			const share: number = step / steps;

			this.#touch(
				from.x + (place.x - from.x) * share,
				from.y + (place.y - from.y) * share,
				power,
				TOUCH_RADIUS,
			);
		}
	}

	#swell(time: number): void
	{
		this.#ticks += 1;
		if (this.#ticks % SWELL_EVERY !== 0)
		{
			return;
		}

		for (let source = 0; source < SWELL_SOURCES; source++)
		{
			const phase: number = source * SWELL_PHASE;
			const x: number = 0.5 + Math.sin(time * SWELL_PACE + phase) * SWELL_SPREAD;
			const y: number = 0.5 + Math.cos(time * SWELL_PACE * SWELL_ASPECT + phase * SWELL_TWIST) * SWELL_SPREAD;

			this.#touch(
				MARGIN + x * this.#cardWidth,
				MARGIN + y * this.#cardHeight,
				SWELL_IMPULSE,
				SWELL_RADIUS,
			);
		}
	}

	// Presses the surface down around a point: the whole of the impulse over the plateau of the dent and a
	// squared cosine of it over the rest of the reach.
	#touch(atX: number, atY: number, power: number, radius: number): void
	{
		const centreX: number = Math.round(atX);
		const centreY: number = Math.round(atY);
		const lastColumn: number = this.#width - 1;
		const lastRow: number = this.#height - 1;

		for (let dy = -radius; dy <= radius; dy++)
		{
			const row: number = centreY + dy;
			if (row < 1 || row >= lastRow)
			{
				continue;
			}

			const line: number = row * this.#width;

			for (let dx = -radius; dx <= radius; dx++)
			{
				const column: number = centreX + dx;
				if (column < 1 || column >= lastColumn)
				{
					continue;
				}

				const reach: number = Math.hypot(dx, dy) / radius;
				if (reach > 1)
				{
					continue;
				}

				let share: number = 1;
				if (reach > TOUCH_PLATEAU)
				{
					const past: number = (reach - TOUCH_PLATEAU) / (1 - TOUCH_PLATEAU);
					const fade: number = Math.cos(past * QUARTER_TURN);

					share = fade * fade;
				}

				this.#velocity[line + column] -= power * share;
			}
		}
	}

	/*
	 * One step of the spring: every cell is pulled towards the middle of its four neighbours, and the surface
	 * gives back a little of its speed and of its height. The two passes are not one - the pull of a cell is
	 * counted from the heights of the previous step, and a single pass would count half of them from the
	 * step being made.
	 */
	#settle(): void
	{
		const width: number = this.#width;
		const lastRow: number = this.#height - 1;
		const lastColumn: number = width - 1;
		const level: Float32Array = this.#level;
		const velocity: Float32Array = this.#velocity;
		const damping: Float32Array = this.#damping;

		for (let row = 1; row < lastRow; row++)
		{
			const line: number = row * width;

			for (let column = 1; column < lastColumn; column++)
			{
				const cell: number = line + column;
				const around: number = (
					level[cell - 1] + level[cell + 1] + level[cell - width] + level[cell + width]
				) / 4;

				velocity[cell] = (velocity[cell] + (around - level[cell]) * TENSION) * VISCOSITY * damping[cell];
			}
		}

		for (let row = 1; row < lastRow; row++)
		{
			const line: number = row * width;

			for (let column = 1; column < lastColumn; column++)
			{
				const cell: number = line + column;

				level[cell] = (level[cell] + velocity[cell]) * RECOVERY * damping[cell];
			}
		}
	}

	// Builds the picture of the card: every pixel of it is a pixel of the composition taken from where the
	// slope of the surface bends the sight, and lit by that very slope.
	#refract(source: Uint8ClampedArray): void
	{
		const image: ImageData | null = this.#image;
		if (!image)
		{
			return;
		}

		const picture: Uint8ClampedArray = image.data;
		const width: number = this.#width;
		const level: Float32Array = this.#level;
		const lastColumn: number = width - 1;
		const lastRow: number = this.#height - 1;

		let at: number = 0;

		for (let row = 0; row < this.#cardHeight; row++)
		{
			const line: number = (row + MARGIN) * width;

			for (let column = 0; column < this.#cardWidth; column++)
			{
				const cell: number = line + column + MARGIN;
				const slopeX: number = level[cell - 1] - level[cell + 1];
				const slopeY: number = level[cell - width] - level[cell + width];

				const fromColumn: number = Math.min(
					lastColumn,
					Math.max(0, column + MARGIN + Math.trunc(slopeX * REFRACTION)),
				);
				const fromRow: number = Math.min(
					lastRow,
					Math.max(0, row + MARGIN + Math.trunc(slopeY * REFRACTION)),
				);

				const from: number = (fromRow * width + fromColumn) * 4;
				const shade: number = Math.min(MAX_SHADE, Math.max(-MAX_SHADE, (slopeX + slopeY) * SHADING));

				picture[at] = source[from] + shade;
				picture[at + 1] = source[from + 1] + shade;
				picture[at + 2] = source[from + 2] + shade;

				at += 4;
			}
		}
	}

	// The picture is built at the size of the grid and laid over the card at the size of the card: the
	// stretching is the one thing that softens the step of the grid.
	#show(context: CanvasRenderingContext2D, width: number, height: number): void
	{
		const image: ImageData | null = this.#image;
		if (!image || !this.#context)
		{
			return;
		}

		this.#context.putImageData(image, 0, 0);
		context.drawImage(this.#surface, 0, 0, width, height);
	}
}
