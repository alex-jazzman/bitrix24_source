import { Dom, Event } from 'main.core';

/*
 * Backdrop of the announcement card as a water surface, ported from the reference build of the
 * mockup (WhatsNew backdrop="water" of the GenuiBoard design system - the prop has no counterpart
 * in ui.system.dialog, so the effect is implemented here).
 *
 * Why a canvas and not css. Real ripple is REFRACTION: every point of the backdrop is displaced
 * by the tilt of the surface above it. Css cannot do that - a gradient can be moved or recentred
 * as a whole, but its pixels cannot be remapped through a height field. So the backdrop itself is
 * painted into a canvas and a wave simulation distorts it.
 *
 * The physics is a grid of springs; each cell keeps a height and a velocity:
 *
 *     avg      = mean height of the four neighbours
 *     velocity = (velocity + (avg - height) * TENSION) * VISCOSITY
 *     height   = (height + velocity) * RECOVER
 *
 * A cell is pulled towards the level of its neighbours, so a disturbance spreads; the velocity
 * gives inertia, so the surface overshoots and swings; viscosity damps it, and RECOVER pulls the
 * level back to zero. This scheme is used instead of the better known "two previous frames" one
 * because it has SEPARATE knobs: TENSION for how fast waves spread (how thick the liquid is) and
 * VISCOSITY for damping. In the classic scheme the wave speed is baked into the formula.
 */

const SCALE = 2;

/**
 * Surface tension - how fast waves spread, and the main knob of thickness: water is high
 * (0.4-0.5, circles run away instantly), a thick liquid is low, closer to swaying jelly.
 */
const TENSION = 0.065;

/** How much velocity survives a frame. Closer to one means LESS viscosity, so waves live longer. */
const VISCOSITY = 0.99;

/**
 * Return to the flat level per frame - the role of gravity. Without it the surface never heals:
 * pointer impulses leave the field with a constant minus, and an even offset has a zero laplacian,
 * so the neighbours do not see it and never pull it back.
 */
const RECOVER = 0.99;

/** Strength of refraction: how many pixels the tilt of the surface turns into. */
const REFRACTION = 12;

/** Contribution of the tilt to brightness - a highlight on the crest, a shadow in the trough. */
const SHADING = 26;

/** Cap of the highlight, so a crest is not bleached into a white ribbon on a dark base. */
const MAX_SHADE = 45;

/**
 * Radius of the disturbed area around the pointer, in cells (a cell is SCALE screen pixels).
 * This sets how LARGE the wave is: the wider the area, the longer the wave.
 */
const TOUCH_RADIUS = 34;

/**
 * Share of the radius that pushes at full strength; further out a soft falloff to the edge.
 * A PLATEAU, not a ring: a ring profile has two troughs in section, so a stroke leaves a split
 * double furrow instead of one wave.
 */
const TOUCH_PLATEAU = 0.55;

/*
 * Idle sway: the water breathes without the pointer. Done with the same disturbance the pointer
 * makes - a couple of sources wander over the field and press on the surface every other frame -
 * so the sway lives by the same physics and mixes with a pointer wave seamlessly. A drawn sine
 * would have to be added on top of the simulation, and the seam would show where the two meet.
 */
const IDLE_SOURCES = 2;
const IDLE_IMPULSE = 0.012;

/** Every how many frames an idle imprint is stamped. Rare strong imprints read as pulsing. */
const IDLE_EVERY = 2;

/**
 * Radius of the idle area, in cells - the main knob of wave length: the wider, the longer the
 * swell. The pointer has its own, smaller one, because from it we want ripple, not swells.
 * The cost grows as the radius SQUARED, hence the every-other-frame stamping above.
 */
const IDLE_RADIUS = 124;

/** How far the sources wander from the centre (share of the visible part) and how fast. */
const IDLE_SPREAD = 0.46;
const IDLE_SPEED = 0.00009;

/** What the pointer speed turns into: multiplier of the impulse. */
const IMPULSE_PER_PX = 0.0018;

/** Cap of the impulse, so a flick of the mouse does not boil the whole card. */
const MAX_IMPULSE = 0.036;

/*
 * Absorbing edge: a wave that reaches the border of the grid dies instead of reflecting back
 * inside. The band lies entirely OUTSIDE the card - the grid is wider than the visible area by
 * PAD cells on every side. With the band inside the card there was no working width: a wide one
 * damped everything but the middle, a narrow one did not damp enough and the wave piled up on
 * the reflected one. Outside the edge there is no such trade-off - inside the dialog there is no
 * absorption at all, so the water answers the same from edge to edge.
 */
const ABSORB_MARGIN = 44;
const EDGE_ABSORB = 0.6;
const PAD = ABSORB_MARGIN;

/*
 * The reference build also returns the surface to rest once its remaining energy drops below a
 * threshold, which lets it skip the per-cell pass entirely. That path is not ported, and on
 * purpose: it only ever ran with reduced motion asked for, and here reduced motion means the
 * effect is not mounted at all. With the idle sway running, the check is a trap the reference
 * documents - a fresh imprint is weaker than the threshold, so re-checking every frame wipes it
 * before it has spread, and the water stops answering without the pointer.
 */

/** Blur of the aurora blobs, in screen pixels of the mockup. */
const GLOW_BLUR = 26;

/** How far the blobs drift with the pointer, in shares of the card - well below their own drift. */
const GLOW_POINTER_X = 0.08;
const GLOW_POINTER_Y = 0.07;

/** How fast the drifted centre catches up with the pointer, per event. */
const GLOW_FOLLOW = 0.05;

export type WaterBackdropOptions = {
	host: HTMLElement,
	// Flat colour under the composition, and the colour the vignette returns to at the edges.
	base: string,
	// Colour of the two aurora blobs. Without it the source stays the flat base or the raster.
	glow?: string,
	// Ready raster of the scheme. When it is given, it IS the source: the mockup already has the
	// blobs and the vignette painted into it.
	imageUrl?: string,
};

type Pointer = { x: number, y: number };

export class WaterBackdrop
{
	#host: HTMLElement;
	#base: string;
	#canvas: HTMLCanvasElement;
	#context: CanvasRenderingContext2D;

	// Offscreen copy of the undistorted backdrop: the simulation reads its source pixels from it.
	#source: HTMLCanvasElement;
	#sourceContext: CanvasRenderingContext2D;
	#sourceData: Uint8ClampedArray | null = null;
	#image: HTMLImageElement | null = null;

	// Whole grid, and the visible part of it inside the card.
	#width: number = 0;
	#height: number = 0;
	#visibleWidth: number = 0;
	#visibleHeight: number = 0;

	#field: Float32Array = new Float32Array(0);
	#velocity: Float32Array = new Float32Array(0);
	#absorb: Float32Array = new Float32Array(0);
	#output: ImageData | null = null;

	#glow: string | null;
	// Pointer-led centre of the blob drift, in shares of the card, lagging behind on purpose.
	#glowX: number = 0.5;
	#glowY: number = 0.5;

	#observer: ResizeObserver | null = null;
	#frameId: number = 0;
	#idleTick: number = 0;
	#isResting: boolean = true;
	#previous: Pointer | null = null;

	static mount(options: WaterBackdropOptions): WaterBackdrop | null
	{
		// The effect is decoration and it is motion: with reduced motion asked for, the card keeps
		// the still backdrop its css paints.
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
		{
			return null;
		}

		const canvas = document.createElement('canvas');
		const source = document.createElement('canvas');
		const context = canvas.getContext('2d', { alpha: false });
		const sourceContext = source.getContext('2d', { alpha: false });
		if (context === null || sourceContext === null)
		{
			return null;
		}

		return new WaterBackdrop(options, canvas, context, source, sourceContext);
	}

	constructor(
		options: WaterBackdropOptions,
		canvas: HTMLCanvasElement,
		context: CanvasRenderingContext2D,
		source: HTMLCanvasElement,
		sourceContext: CanvasRenderingContext2D,
	)
	{
		this.#host = options.host;
		this.#base = options.base;
		this.#glow = options.glow ?? null;
		this.#canvas = canvas;
		this.#context = context;
		this.#source = source;
		this.#sourceContext = sourceContext;

		Dom.style(this.#canvas, {
			position: 'absolute',
			display: 'block',
			pointerEvents: 'none',
		});
		this.#host.append(this.#canvas);

		if (options.imageUrl !== undefined)
		{
			this.#loadImage(options.imageUrl);
		}

		this.#resize();
		this.#observer = new ResizeObserver(() => this.#resize());
		this.#observer.observe(this.#host);

		Event.bind(window, 'pointermove', this.#handlePointerMove, { passive: true });
		this.#frameId = requestAnimationFrame(this.#renderFrame);
	}

	destroy(): void
	{
		Event.unbind(window, 'pointermove', this.#handlePointerMove);
		cancelAnimationFrame(this.#frameId);
		this.#observer?.disconnect();
		this.#observer = null;
		this.#canvas.remove();
	}

	#loadImage(url: string): void
	{
		const image = new Image();
		Event.bind(image, 'load', () => {
			this.#image = image;
		});
		image.src = url;
	}

	/**
	 * The grid is BIGGER than the card: a field of PAD cells around it that the viewer never sees
	 * (the canvas is shifted under the edge and the overflow of the host cuts the rest off). The
	 * whole absorbing band lives in that invisible field.
	 */
	#resize(): void
	{
		// clientWidth/Height and not getBoundingClientRect: the latter reports the size AFTER the
		// transform, and the card is measured while the appearance animation still scales it.
		this.#visibleWidth = Math.max(2, Math.round(this.#host.clientWidth / SCALE));
		this.#visibleHeight = Math.max(2, Math.round(this.#host.clientHeight / SCALE));
		this.#width = this.#visibleWidth + (PAD * 2);
		this.#height = this.#visibleHeight + (PAD * 2);

		this.#canvas.width = this.#width;
		this.#canvas.height = this.#height;
		Dom.style(this.#canvas, {
			width: `${this.#width * SCALE}px`,
			height: `${this.#height * SCALE}px`,
			left: `${-PAD * SCALE}px`,
			top: `${-PAD * SCALE}px`,
		});
		this.#source.width = this.#width;
		this.#source.height = this.#height;

		const cells = this.#width * this.#height;
		this.#field = new Float32Array(cells);
		this.#velocity = new Float32Array(cells);
		this.#output = this.#context.createImageData(this.#width, this.#height);
		this.#buildAbsorbMask();
	}

	/**
	 * Without the mask the border of the grid is a perfect mirror: its cells are never updated, a
	 * wave reaches them and returns inside, which reads as an echo off the walls of the dialog.
	 * The band is exactly PAD cells wide, so the multiplier reaches 1 right where the visible part
	 * begins. The profile is smoothstep, otherwise the seam shows.
	 */
	#buildAbsorbMask(): void
	{
		const width = this.#width;
		const height = this.#height;
		const mask = new Float32Array(width * height);

		for (let y = 0; y < height; y++)
		{
			for (let x = 0; x < width; x++)
			{
				const distance = Math.min(x, y, width - 1 - x, height - 1 - y);
				const ratio = Math.min(1, distance / ABSORB_MARGIN);
				const eased = ratio * ratio * (3 - (2 * ratio));
				mask[(y * width) + x] = EDGE_ABSORB + ((1 - EDGE_ABSORB) * eased);
			}
		}

		this.#absorb = mask;
	}

	/**
	 * The source of the simulation. A scheme delivers its backdrop one of two ways: as a ready
	 * raster - then it IS the source, the blobs and the vignette are already painted into it - or as
	 * a pair of colours, and then the composition is painted here.
	 */
	#drawSource(time: number): void
	{
		this.#sourceContext.filter = 'none';

		if (this.#image === null)
		{
			this.#drawPaintedSource(time);
		}
		else
		{
			this.#drawImageSource(this.#image);
		}

		this.#sourceData = this.#sourceContext.getImageData(0, 0, this.#width, this.#height).data;
	}

	#drawImageSource(image: HTMLImageElement): void
	{
		// Cover, as the css background of the card does it: the card differs in height between the
		// report list and the report page, and the raster must fill it on both.
		const scale = Math.max(this.#width / image.width, this.#height / image.height);
		const drawWidth = image.width * scale;
		const drawHeight = image.height * scale;
		this.#sourceContext.drawImage(
			image,
			(this.#width - drawWidth) / 2,
			(this.#height - drawHeight) / 2,
			drawWidth,
			drawHeight,
		);
	}

	/**
	 * Base, two aurora blobs and a vignette - the same composition the card would have on css
	 * layers, painted into the canvas because the simulation needs the pixels of the source.
	 *
	 * The blobs drift on their own along sines with incommensurable periods, so the picture never
	 * repeats to the eye, and follow the pointer on top of that, with a lag.
	 */
	#drawPaintedSource(time: number): void
	{
		const context = this.#sourceContext;
		context.fillStyle = this.#base;
		context.fillRect(0, 0, this.#width, this.#height);

		const glow = this.#glow;
		if (glow === null)
		{
			return;
		}

		const pointerX = (this.#glowX - 0.5) * GLOW_POINTER_X;
		const pointerY = (this.#glowY - 0.5) * GLOW_POINTER_Y;

		context.filter = `blur(${Math.round(GLOW_BLUR / SCALE)}px)`;
		this.#drawGlow(
			glow,
			0.3 + pointerX + (Math.sin(time / 9000) * 0.06),
			0.32 + pointerY + (Math.cos(time / 7000) * 0.05),
			0.5,
		);
		this.#drawGlow(
			glow,
			0.74 - pointerX + (Math.cos(time / 11000) * 0.05),
			0.72 - pointerY + (Math.sin(time / 13000) * 0.06),
			0.52,
		);
		context.filter = 'none';

		this.#drawVignette();
	}

	// Shares are counted off the VISIBLE part and shifted onto the margin: the composition must
	// stand by the card and not by the grid, otherwise the blobs leave their places in the mockup.
	#drawGlow(glow: string, ratioX: number, ratioY: number, ratioRadius: number): void
	{
		const x = PAD + (ratioX * this.#visibleWidth);
		const y = PAD + (ratioY * this.#visibleHeight);
		const radius = ratioRadius * Math.max(this.#visibleWidth, this.#visibleHeight);

		const gradient = this.#sourceContext.createRadialGradient(x, y, 0, x, y, radius);
		gradient.addColorStop(0, glow);
		gradient.addColorStop(1, WaterBackdrop.#transparent(glow));
		this.#sourceContext.fillStyle = gradient;
		this.#sourceContext.fillRect(0, 0, this.#width, this.#height);
	}

	#drawVignette(): void
	{
		const centerX = PAD + (this.#visibleWidth / 2);
		const centerY = PAD + (this.#visibleHeight * 0.32);
		const radius = Math.max(this.#visibleWidth, this.#visibleHeight) * 0.95;

		const gradient = this.#sourceContext.createRadialGradient(
			centerX,
			centerY,
			0,
			centerX,
			centerY,
			radius,
		);
		gradient.addColorStop(0.62, WaterBackdrop.#transparent(this.#base));
		gradient.addColorStop(1, this.#base);
		this.#sourceContext.fillStyle = gradient;
		this.#sourceContext.fillRect(0, 0, this.#width, this.#height);
	}

	// A radial gradient needs the same colour with a zero alpha at its outer stop: a fade to plain
	// transparent goes through grey in most browsers and leaves a dirty ring around the blob.
	static #transparent(color: string): string
	{
		const parsed = /^rgba?\(([^)]+)\)$/.exec(color.trim());
		if (parsed !== null)
		{
			const [red, green, blue] = parsed[1].split(',');

			return `rgba(${red}, ${green}, ${blue}, 0)`;
		}

		const hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(color.trim());
		if (hex === null)
		{
			return 'rgba(0, 0, 0, 0)';
		}

		const digits = hex[1].length === 3
			? [...hex[1]].map((digit: string): string => digit + digit).join('')
			: hex[1];
		const value = Number.parseInt(digits, 16);

		// eslint-disable-next-line no-bitwise
		return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, 0)`;
	}

	/**
	 * The impulse goes into the VELOCITY and not into the height: a finger does not punch a hole
	 * instantly, it accelerates the liquid, and the dent builds up over several frames. On a thick
	 * medium that reads as pressing rather than as a hole flicked into the surface.
	 */
	#touch(gridX: number, gridY: number, power: number, radius: number = TOUCH_RADIUS): void
	{
		const width = this.#width;
		const height = this.#height;
		const centerX = Math.round(gridX);
		const centerY = Math.round(gridY);

		for (let dy = -radius; dy <= radius; dy++)
		{
			const y = centerY + dy;
			if (y < 1 || y >= height - 1)
			{
				continue;
			}

			for (let dx = -radius; dx <= radius; dx++)
			{
				const x = centerX + dx;
				if (x < 1 || x >= width - 1)
				{
					continue;
				}

				const distance = Math.hypot(dx, dy);
				if (distance > radius)
				{
					continue;
				}

				this.#velocity[(y * width) + x] -= power * WaterBackdrop.#plateau(distance / radius);
			}
		}

		this.#isResting = false;
	}

	/**
	 * Profile of the disturbed area: full strength over the plateau, then a soft falloff to the
	 * border. A hard border makes the surface move as a square blob instead of a round wave.
	 */
	static #plateau(ratio: number): number
	{
		if (ratio <= TOUCH_PLATEAU)
		{
			return 1;
		}

		const falloff = (ratio - TOUCH_PLATEAU) / (1 - TOUCH_PLATEAU);
		const cosine = Math.cos(falloff * Math.PI * 0.5);

		return cosine * cosine;
	}

	#handlePointerMove = (event: PointerEvent): void => {
		const box = this.#host.getBoundingClientRect();
		if (box.width <= 0 || box.height <= 0)
		{
			return;
		}

		// Outside the card the pointer does not touch the water - there it is not visible anyway.
		if (
			event.clientX < box.left
			|| event.clientY < box.top
			|| event.clientX >= box.right
			|| event.clientY >= box.bottom
		)
		{
			this.#previous = null;

			return;
		}

		// Led centre of the blob drift, in shares of the card and with a lag (see #drawPaintedSource).
		this.#glowX += (((event.clientX - box.left) / box.width) - this.#glowX) * GLOW_FOLLOW;
		this.#glowY += (((event.clientY - box.top) / box.height) - this.#glowY) * GLOW_FOLLOW;

		// Screen coordinates to cells. PAD is the shift onto the invisible margin: cell zero of
		// the grid lies to the left of and above the card.
		const current: Pointer = {
			x: ((event.clientX - box.left) / SCALE) + PAD,
			y: ((event.clientY - box.top) / SCALE) + PAD,
		};

		const previous = this.#previous;
		if (previous !== null)
		{
			const distance = Math.hypot(current.x - previous.x, current.y - previous.y);
			// The force comes from the speed: a slow move barely sways the surface, a sharp one splashes.
			const power = Math.min(distance * IMPULSE_PER_PX, MAX_IMPULSE);
			if (power > 0.0008)
			{
				// Intermediate points, so a fast stroke leaves a continuous trail and not a dotted
				// line of separate circles. The impulse of every point is the SAME and is not
				// divided: a finger drawn through water disturbs the whole line equally, a longer
				// stroke simply touches more water. The step is coarse on purpose - the areas of
				// neighbouring imprints overlap anyway, and each imprint costs thousands of cells.
				const steps = Math.min(Math.ceil(distance / 8), 5);
				for (let step = 1; step <= steps; step++)
				{
					const ratio = step / steps;
					this.#touch(
						previous.x + ((current.x - previous.x) * ratio),
						previous.y + ((current.y - previous.y) * ratio),
						power,
					);
				}
			}
		}

		this.#previous = current;
	};

	/**
	 * Idle sway: the sources wander along Lissajous figures - the periods are incommensurable, so
	 * the trajectories never close and the pattern does not repeat to the eye.
	 */
	#idle(time: number): void
	{
		this.#idleTick++;
		if (this.#idleTick % IDLE_EVERY !== 0)
		{
			return;
		}

		for (let index = 0; index < IDLE_SOURCES; index++)
		{
			const phase = index * 2.1;
			const ratioX = 0.5 + (Math.sin((time * IDLE_SPEED) + phase) * IDLE_SPREAD);
			const ratioY = 0.5 + (Math.cos((time * IDLE_SPEED * 0.73) + (phase * 1.7)) * IDLE_SPREAD);
			// The visible size is already in CELLS: dividing by SCALE once more would squeeze the
			// sources into the corner, into the absorbing margin, and the sway would not show.
			this.#touch(
				PAD + (ratioX * this.#visibleWidth),
				PAD + (ratioY * this.#visibleHeight),
				IDLE_IMPULSE,
				IDLE_RADIUS,
			);
		}
	}

	#renderFrame = (time: number): void => {
		this.#drawSource(time);
		this.#idle(time);

		if (this.#isResting || this.#output === null || this.#sourceData === null)
		{
			// No waves - flat water: just the backdrop, without the per-cell pass.
			this.#context.drawImage(this.#source, 0, 0);
			this.#frameId = requestAnimationFrame(this.#renderFrame);

			return;
		}

		this.#step();
		this.#paint();
		this.#frameId = requestAnimationFrame(this.#renderFrame);
	};

	/**
	 * One step of the simulation, in TWO passes - a condition of stability, not a matter of style.
	 * Changing the height inside the velocity loop would make neighbouring cells read an already
	 * updated field, the feedback would accumulate on itself and the amplitude would grow
	 * exponentially. So first the velocities over the UNCHANGED height field, then the shift.
	 */
	#step(): void
	{
		const width = this.#width;
		const height = this.#height;
		const field = this.#field;
		const velocity = this.#velocity;
		const absorb = this.#absorb;

		for (let y = 1; y < height - 1; y++)
		{
			const row = y * width;
			for (let x = 1; x < width - 1; x++)
			{
				const index = row + x;
				const average = (
					field[index - 1]
					+ field[index + 1]
					+ field[index - width]
					+ field[index + width]
				) * 0.25;
				velocity[index] = (velocity[index] + ((average - field[index]) * TENSION))
					* VISCOSITY
					* absorb[index];
			}
		}

		for (let y = 1; y < height - 1; y++)
		{
			const row = y * width;
			for (let x = 1; x < width - 1; x++)
			{
				const index = row + x;
				field[index] = (field[index] + velocity[index]) * RECOVER * absorb[index];
			}
		}
	}

	/**
	 * Refraction: a pixel is taken with an offset along the tilt of the surface, and the same tilt
	 * corrects the brightness - so a crest gets a highlight and a trough a shadow.
	 *
	 * Only the visible part is painted, one cell wider: the margin is cut off by the edge of the
	 * card anyway. The simulation still runs over the whole grid, otherwise there would be nowhere
	 * to damp the wave.
	 */
	#paint(): void
	{
		const output = this.#output;
		const source = this.#sourceData;
		if (output === null || source === null)
		{
			return;
		}

		const width = this.#width;
		const height = this.#height;
		const field = this.#field;
		const target = output.data;

		const fromY = Math.max(1, PAD - 1);
		const toY = Math.min(height - 1, PAD + this.#visibleHeight + 1);
		const fromX = Math.max(1, PAD - 1);
		const toX = Math.min(width - 1, PAD + this.#visibleWidth + 1);

		for (let y = fromY; y < toY; y++)
		{
			const row = y * width;
			for (let x = fromX; x < toX; x++)
			{
				const index = row + x;
				const targetIndex = index * 4;
				const tiltX = field[index - 1] - field[index + 1];
				const tiltY = field[index - width] - field[index + width];

				let sourceX = x + Math.trunc(tiltX * REFRACTION);
				let sourceY = y + Math.trunc(tiltY * REFRACTION);
				sourceX = Math.min(width - 1, Math.max(0, sourceX));
				sourceY = Math.min(height - 1, Math.max(0, sourceY));
				const sourceIndex = ((sourceY * width) + sourceX) * 4;

				// The highlight is capped: on a dark base an unbounded one bleaches the crest
				// instantly, and instead of ripple there is a white ribbon.
				let shade = (tiltX + tiltY) * SHADING;
				shade = Math.min(MAX_SHADE, Math.max(-MAX_SHADE, shade));

				target[targetIndex] = source[sourceIndex] + shade;
				target[targetIndex + 1] = source[sourceIndex + 1] + shade;
				target[targetIndex + 2] = source[sourceIndex + 2] + shade;
				target[targetIndex + 3] = 255;
			}
		}

		this.#context.putImageData(output, 0, 0, fromX, fromY, toX - fromX, toY - fromY);
	}
}
