import { Dom, Event, Tag } from 'main.core';

/**
 * Live water splash of the coachmark card, the "water" effect of the dark blue scheme.
 *
 * Port of the WaterBackdrop canvas of the layout library: a height field is relaxed by tension
 * and viscosity every frame, then the painted background is sampled with refraction and shading
 * so the card looks like deep water. Waves are born by idle sources and by the pointer moving
 * over the card; near the edges they are absorbed instead of bouncing back.
 */

const SCALE = 2;
const TENSION = 0.065;
const VISCOSITY = 0.99;
const RECOVER = 0.99;
const REFRACTION = 12;
const SHADING = 26;
const MAX_SHADE = 45;
const TOUCH_RADIUS = 34;
const TOUCH_PLATEAU = 0.55;
const IDLE_SOURCES = 2;
const IDLE_IMPULSE = 0.012;
const IDLE_EVERY = 2;
const IDLE_RADIUS = 124;
const IDLE_SPREAD = 0.46;
const IDLE_SPEED = 0.00009;
const IMPULSE_PER_PX = 0.0018;
const MAX_IMPULSE = 0.036;
const ABSORB_MARGIN = 44;
const EDGE_ABSORB = 0.6;
const PAD = ABSORB_MARGIN;
const CENTER_FOLLOW = 0.05;

/**
* Frames between two rebuilds of the painted background. The background drifts over tens of
* seconds, so the frames in between refract the snapshot taken by the last rebuild.
*/
const SOURCE_EVERY = 5;

/**
 * Shortest time between two steps of the simulation. A step is a fixed slice of the motion, so a
 * display refreshing at 120 Hz would both double the work and run the waves twice as fast; such
 * frames are skipped instead. The margin keeps the jitter of a 60 Hz display from losing frames.
 */
const STEP_INTERVAL_MS = 1000 / 60;
const STEP_TOLERANCE = 0.9;

/**
 * Glow blobs share one pre-blurred sprite drawn for the larger of them; the smaller one is the
 * same sprite scaled down.
 */
const GLOW_RADIUS = 0.52;
const GLOW_BLUR = Math.round(26 / SCALE);

/**
 * Margin painted past the edges of the layer. The card surface is cut out of this canvas by a
 * clip path and the context is opaque, so a strip the splash never touches comes out flat
 * black - and the edges of the shape, the beak among them, are exactly what it would hit.
 */
const EDGE_BAND = 13;

/**
 * Falloff of a drop: full power in the middle of the touch and a soft cosine tail to its edge.
 */
function touchForce(normalizedDistance: number): number
{
	if (normalizedDistance <= TOUCH_PLATEAU)
	{
		return 1;
	}

	const tail = (normalizedDistance - TOUCH_PLATEAU) / (1 - TOUCH_PLATEAU);
	const cosine = Math.cos(tail * Math.PI * 0.5);

	return cosine * cosine;
}

/**
 * Falloff of a drop by the squared distance from its center, built once per radius: the idle
 * sources sweep almost the whole grid every other frame, and a square root with a cosine per
 * cell was the most expensive part of a frame.
 */
const falloffTables: Map<number, Float32Array> = new Map();

function getFalloffTable(radius: number): Float32Array
{
	let table = falloffTables.get(radius);
	if (!table)
	{
		table = new Float32Array((radius * radius) + 1);
		for (let squared = 0; squared < table.length; squared++)
		{
			table[squared] = touchForce(Math.sqrt(squared) / radius);
		}
		falloffTables.set(radius, table);
	}

	return table;
}

type Rgb = { r: number, g: number, b: number };

function hexToRgb(hex: string): Rgb
{
	const value = hex.replace('#', '');
	const full = value.length === 3 ? [...value].map((char) => char + char).join('') : value;

	return {
		r: Number.parseInt(full.slice(0, 2), 16),
		g: Number.parseInt(full.slice(2, 4), 16),
		b: Number.parseInt(full.slice(4, 6), 16),
	};
}

function rgba(hex: string, alpha: number): string
{
	const { r, g, b } = hexToRgb(hex);

	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export type WaterBackdropOptions = {
	base: string,
	glow: string,
};

export class WaterBackdrop
{
	#options: WaterBackdropOptions;
	#host: HTMLElement | null = null;
	#canvas: HTMLCanvasElement | null = null;
	#context: CanvasRenderingContext2D | null = null;
	#sourceCanvas: HTMLCanvasElement | null = null;
	#sourceContext: CanvasRenderingContext2D | null = null;
	#glowSprite: HTMLCanvasElement | null = null;
	#resizeObserver: ResizeObserver | null = null;
	#frameRequest: number = 0;
	#lastStepTime: number = 0;

	#width: number = 0;
	#height: number = 0;
	#visibleWidth: number = 0;
	#visibleHeight: number = 0;
	#surface: Float32Array = new Float32Array(0);
	#velocity: Float32Array = new Float32Array(0);
	#absorb: Float32Array = new Float32Array(0);
	#output: ImageData | null = null;
	#sourcePixels: Uint8ClampedArray | null = null;
	#sourceFramesLeft: number = 0;

	#motionQuery: MediaQueryList | null = null;
	#isReducedMotion: boolean = false;
	#idleTick: number = 0;
	#centerX: number = 0.5;
	#centerY: number = 0.5;
	#hostRect: DOMRect | null = null;
	#pointerX: number = -1;
	#pointerY: number = -1;
	#pointerClientX: number = 0;
	#pointerClientY: number = 0;
	#pointerMoves: number = 0;

	#onPointerMove: (event: PointerEvent) => void;
	#onViewportChange: () => void;
	#onMotionPreferenceChange: () => void;
	#onFrame: (time: number) => void;

	constructor(options: WaterBackdropOptions)
	{
		this.#options = options;
		this.#onPointerMove = this.#handlePointerMove.bind(this);
		this.#onViewportChange = this.#invalidateHostRect.bind(this);
		this.#onMotionPreferenceChange = this.#handleMotionPreferenceChange.bind(this);
		this.#onFrame = this.#renderFrame.bind(this);
	}

	render(): HTMLElement
	{
		this.#canvas = (Tag.render`<canvas class="biconnector-dashboard-onboarding__water-canvas"></canvas>`) as HTMLCanvasElement;
		this.#host = (Tag.render`
			<div class="biconnector-dashboard-onboarding__water" aria-hidden="true">
				${this.#canvas}
			</div>
		`) as HTMLElement;

		return this.#host;
	}

	start(): void
	{
		if (this.#setUp())
		{
			this.#startLoop();
		}
	}

	/**
	 * Drops the frame loop but keeps the canvases and the buffers, so a later start() resumes
	 * the splash. The card stops the loop as soon as it begins closing: waiting for the popup
	 * to be destroyed keeps two simulations running through the whole closing animation.
	 */
	stop(): void
	{
		this.#stopLoop();
	}

	destroy(): void
	{
		this.#stopLoop();
		if (this.#motionQuery)
		{
			Event.unbind(this.#motionQuery, 'change', this.#onMotionPreferenceChange);
			this.#motionQuery = null;
		}

		this.#resizeObserver?.disconnect();
		this.#resizeObserver = null;
		this.#context = null;
		this.#sourceContext = null;
		this.#sourcePixels = null;
		this.#glowSprite = null;
	}

	#setUp(): boolean
	{
		if (this.#context && this.#sourceContext)
		{
			return true;
		}

		if (!this.#host || !this.#canvas)
		{
			return false;
		}

		const context = this.#canvas.getContext('2d', { alpha: false });
		this.#sourceCanvas = document.createElement('canvas');
		// The background is read back on every refresh: a context kept in memory turns the read
		// into a copy instead of a wait for the GPU, and all it draws is two sprites and two fills.
		const sourceContext = this.#sourceCanvas.getContext('2d', { alpha: false, willReadFrequently: true });
		if (!context || !sourceContext)
		{
			return false;
		}

		this.#context = context;
		this.#sourceContext = sourceContext;

		this.#motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		Event.bind(this.#motionQuery, 'change', this.#onMotionPreferenceChange);
		this.#isReducedMotion = this.#motionQuery.matches;

		this.#resize();

		this.#resizeObserver = new ResizeObserver(() => this.#resize());
		this.#resizeObserver.observe(this.#host);

		return true;
	}

	/**
	 * Reduced motion asks for a still surface, and a still one needs no frame loop: nothing
	 * disturbs it, so it is painted by the resize alone.
	 */
	#startLoop(): void
	{
		if (this.#frameRequest || this.#isReducedMotion || !this.#context)
		{
			return;
		}

		Event.bind(window, 'pointermove', this.#onPointerMove, { passive: true });
		Event.bind(window, 'scroll', this.#onViewportChange, { passive: true, capture: true });
		Event.bind(window, 'resize', this.#onViewportChange, { passive: true });
		this.#frameRequest = requestAnimationFrame(this.#onFrame);
	}

	#stopLoop(): void
	{
		if (!this.#frameRequest)
		{
			return;
		}

		cancelAnimationFrame(this.#frameRequest);
		this.#frameRequest = 0;
		this.#lastStepTime = 0;
		this.#pointerMoves = 0;
		this.#pointerX = -1;
		this.#pointerY = -1;

		Event.unbind(window, 'pointermove', this.#onPointerMove);
		Event.unbind(window, 'scroll', this.#onViewportChange, { capture: true });
		Event.unbind(window, 'resize', this.#onViewportChange);
	}

	#handleMotionPreferenceChange(): void
	{
		const isReducedMotion = this.#motionQuery?.matches === true;
		if (isReducedMotion === this.#isReducedMotion)
		{
			return;
		}

		this.#isReducedMotion = isReducedMotion;
		if (!this.#isReducedMotion)
		{
			this.#startLoop();

			return;
		}

		this.#stopLoop();
		this.#surface.fill(0);
		this.#velocity.fill(0);
		this.#invalidateSource();
		this.#drawSource(0);
		this.#paintSource();
	}

	#resize(): void
	{
		if (!this.#host || !this.#canvas || !this.#context || !this.#sourceCanvas)
		{
			return;
		}

		const rect = this.#host.getBoundingClientRect();
		this.#hostRect = rect;

		const visibleWidth = Math.max(2, Math.round(rect.width / SCALE));
		const visibleHeight = Math.max(2, Math.round(rect.height / SCALE));

		// The card width follows the viewport now, so a window drag reaches this method on every
		// frame of the gesture. Rebuilding the buffers is only worth it when the grid really moved.
		if (visibleWidth === this.#visibleWidth && visibleHeight === this.#visibleHeight && this.#output)
		{
			return;
		}

		this.#visibleWidth = visibleWidth;
		this.#visibleHeight = visibleHeight;
		this.#width = this.#visibleWidth + (PAD * 2);
		this.#height = this.#visibleHeight + (PAD * 2);

		this.#canvas.width = this.#width;
		this.#canvas.height = this.#height;
		Dom.style(this.#canvas, 'width', `${this.#width * SCALE}px`);
		Dom.style(this.#canvas, 'height', `${this.#height * SCALE}px`);
		Dom.style(this.#canvas, 'left', `${-PAD * SCALE}px`);
		Dom.style(this.#canvas, 'top', `${-PAD * SCALE}px`);

		this.#sourceCanvas.width = this.#width;
		this.#sourceCanvas.height = this.#height;

		this.#surface = new Float32Array(this.#width * this.#height);
		this.#velocity = new Float32Array(this.#width * this.#height);
		this.#output = this.#context.createImageData(this.#width, this.#height);
		this.#absorb = this.#buildAbsorbMap();
		this.#glowSprite = this.#buildGlowSprite();
		this.#invalidateSource();

		if (this.#isReducedMotion)
		{
			this.#drawSource(0);
			this.#paintSource();
		}
	}

	/**
	 * Waves fade out near the borders, otherwise they would bounce off the card edges.
	 */
	#buildAbsorbMap(): Float32Array
	{
		const absorb = new Float32Array(this.#width * this.#height);

		for (let y = 0; y < this.#height; y++)
		{
			for (let x = 0; x < this.#width; x++)
			{
				const distance = Math.min(x, y, this.#width - 1 - x, this.#height - 1 - y);
				const normalized = Math.min(1, distance / ABSORB_MARGIN);
				const smooth = normalized * normalized * (3 - (2 * normalized));
				absorb[(y * this.#width) + x] = EDGE_ABSORB + ((1 - EDGE_ABSORB) * smooth);
			}
		}

		return absorb;
	}

	#drawSource(time: number): void
	{
		const context = this.#sourceContext;
		if (!context)
		{
			return;
		}

		context.fillStyle = this.#options.base;
		context.fillRect(0, 0, this.#width, this.#height);

		const shiftX = (this.#centerX - 0.5) * 0.08;
		const shiftY = (this.#centerY - 0.5) * 0.07;

		this.#drawGlowBlob(
			0.3 + shiftX + (Math.sin(time / 9000) * 0.06),
			0.32 + shiftY + (Math.cos(time / 7000) * 0.05),
			0.5,
		);
		this.#drawGlowBlob(
			0.74 - shiftX + (Math.cos(time / 11000) * 0.05),
			0.72 - shiftY + (Math.sin(time / 13000) * 0.06),
			GLOW_RADIUS,
		);

		const vignette = context.createRadialGradient(
			PAD + (this.#visibleWidth / 2),
			PAD + (this.#visibleHeight * 0.32),
			0,
			PAD + (this.#visibleWidth / 2),
			PAD + (this.#visibleHeight * 0.32),
			Math.max(this.#visibleWidth, this.#visibleHeight) * 0.95,
		);
		vignette.addColorStop(0.62, rgba(this.#options.base, 0));
		vignette.addColorStop(1, this.#options.base);
		context.fillStyle = vignette;
		context.fillRect(0, 0, this.#width, this.#height);
	}

	/**
	 * Repaints the background and reads it back once per SOURCE_EVERY frames, and lets the
	 * frames in between refract the snapshot already taken: reading the whole canvas back is
	 * the most expensive step of a frame, while the background itself needs tens of seconds to
	 * drift anywhere.
	 */
	#refreshSource(time: number): boolean
	{
		if (this.#sourcePixels && this.#sourceFramesLeft > 0)
		{
			this.#sourceFramesLeft--;

			return true;
		}

		this.#drawSource(time);
		this.#sourceFramesLeft = SOURCE_EVERY - 1;

		return this.#readSourcePixels();
	}

	#readSourcePixels(): boolean
	{
		if (!this.#sourceContext)
		{
			return false;
		}

		this.#sourcePixels = this.#sourceContext.getImageData(0, 0, this.#width, this.#height).data;

		return true;
	}

	/**
	 * The snapshot outlives the frame that took it, so it has to be dropped whenever the canvas
	 * behind it is resized or repainted outside the loop.
	 */
	#invalidateSource(): void
	{
		this.#sourcePixels = null;
		this.#sourceFramesLeft = 0;
	}

	#paintSource(): void
	{
		if (this.#context && this.#sourceCanvas)
		{
			this.#context.drawImage(this.#sourceCanvas, 0, 0);
		}
	}

	#drawGlowBlob(fractionX: number, fractionY: number, fractionRadius: number): void
	{
		const context = this.#sourceContext;
		const sprite = this.#glowSprite;
		if (!context || !sprite)
		{
			return;
		}

		const x = PAD + (fractionX * this.#visibleWidth);
		const y = PAD + (fractionY * this.#visibleHeight);
		const size = sprite.width * (fractionRadius / GLOW_RADIUS);

		context.drawImage(sprite, x - (size / 2), y - (size / 2), size, size);
	}

	/**
	 * The glow is blurred once per size of the card instead of on every repaint of the
	 * background: two blurred fills per refresh, flushed by the read back right after them,
	 * made the refresh frames the slowest of all.
	 */
	#buildGlowSprite(): HTMLCanvasElement | null
	{
		const radius = GLOW_RADIUS * Math.max(this.#visibleWidth, this.#visibleHeight);
		// Three blur radii of margin hold the whole tail of the blur inside the sprite.
		const size = Math.ceil((radius + (GLOW_BLUR * 3)) * 2);
		const sprite = this.#glowSprite ?? document.createElement('canvas');
		sprite.width = size;
		sprite.height = size;

		// Kept in memory like the background it is drawn into: a sprite on the GPU would be read
		// back from there on every repaint of the background.
		const context = sprite.getContext('2d', { willReadFrequently: true });
		if (!context)
		{
			return null;
		}

		const center = size / 2;
		const gradient = context.createRadialGradient(center, center, 0, center, center, radius);
		gradient.addColorStop(0, this.#options.glow);
		gradient.addColorStop(1, rgba(this.#options.glow, 0));
		context.filter = `blur(${GLOW_BLUR}px)`;
		context.fillStyle = gradient;
		context.fillRect(0, 0, size, size);
		context.filter = 'none';

		return sprite;
	}

	#touch(gridX: number, gridY: number, power: number, radius: number = TOUCH_RADIUS): void
	{
		const centerX = Math.round(gridX);
		const centerY = Math.round(gridY);
		const table = getFalloffTable(radius);
		const radiusSquared = radius * radius;
		const fromY = Math.max(1, centerY - radius);
		const toY = Math.min(this.#height - 2, centerY + radius);
		const fromX = Math.max(1, centerX - radius);
		const toX = Math.min(this.#width - 2, centerX + radius);

		for (let y = fromY; y <= toY; y++)
		{
			const dy = y - centerY;
			const row = y * this.#width;
			for (let x = fromX; x <= toX; x++)
			{
				const dx = x - centerX;
				const squared = (dx * dx) + (dy * dy);
				if (squared <= radiusSquared)
				{
					this.#velocity[row + x] -= power * table[squared];
				}
			}
		}
	}

	/**
	 * The pointer fires several moves per frame and every one of them describes the same trail,
	 * so a move is only remembered here; the waves it leaves are made once a frame.
	 */
	#handlePointerMove(event: PointerEvent): void
	{
		this.#pointerClientX = event.clientX;
		this.#pointerClientY = event.clientY;
		this.#pointerMoves++;
	}

	#applyPointerMove(): void
	{
		if (this.#pointerMoves === 0)
		{
			return;
		}

		const moves = this.#pointerMoves;
		this.#pointerMoves = 0;

		const rect = this.#getHostRect();
		if (!rect || !rect.width || !rect.height)
		{
			return;
		}

		const offsetX = this.#pointerClientX - rect.left;
		const offsetY = this.#pointerClientY - rect.top;

		// The glow follows the pointer per move, so its rate is compounded over the moves this
		// frame has swallowed.
		const follow = 1 - ((1 - CENTER_FOLLOW) ** moves);
		this.#centerX += ((offsetX / rect.width) - this.#centerX) * follow;
		this.#centerY += ((offsetY / rect.height) - this.#centerY) * follow;

		const isOutside = (
			offsetX < 0
			|| offsetY < 0
			|| offsetX >= rect.width
			|| offsetY >= rect.height
		);
		if (isOutside)
		{
			this.#pointerX = -1;
			this.#pointerY = -1;

			return;
		}

		const gridX = (offsetX / SCALE) + PAD;
		const gridY = (offsetY / SCALE) + PAD;
		if (this.#pointerX >= 0)
		{
			this.#trailWaves(gridX, gridY);
		}

		this.#pointerX = gridX;
		this.#pointerY = gridY;
	}

	/**
	 * The card moves only with the page around it, so its box is read once and kept until
	 * something able to move it happens.
	 */
	#getHostRect(): DOMRect | null
	{
		if (!this.#hostRect && this.#host)
		{
			this.#hostRect = this.#host.getBoundingClientRect();
		}

		return this.#hostRect;
	}

	#invalidateHostRect(): void
	{
		this.#hostRect = null;
	}

	/**
	 * Spreads the impulse of a pointer move along its path, so a fast move leaves a trail
	 * instead of a single spot.
	 */
	#trailWaves(gridX: number, gridY: number): void
	{
		const deltaX = gridX - this.#pointerX;
		const deltaY = gridY - this.#pointerY;
		// The overflow guard of Math.hypot costs several times as much and buys nothing in grid coordinates.
		// eslint-disable-next-line unicorn/prefer-modern-math-apis
		const distance = Math.sqrt((deltaX * deltaX) + (deltaY * deltaY));
		const power = Math.min(distance * IMPULSE_PER_PX, MAX_IMPULSE);
		if (power <= 0.0008)
		{
			return;
		}

		const steps = Math.min(Math.ceil(distance / 8), 5);
		for (let step = 1; step <= steps; step++)
		{
			const part = step / steps;
			this.#touch(
				this.#pointerX + ((gridX - this.#pointerX) * part),
				this.#pointerY + ((gridY - this.#pointerY) * part),
				power,
			);
		}
	}

	#emitIdleWaves(time: number): void
	{
		this.#idleTick++;
		if (this.#idleTick % IDLE_EVERY !== 0)
		{
			return;
		}

		for (let index = 0; index < IDLE_SOURCES; index++)
		{
			const phase = index * 2.1;
			const fractionX = 0.5 + (Math.sin((time * IDLE_SPEED) + phase) * IDLE_SPREAD);
			const fractionY = 0.5 + (Math.cos((time * IDLE_SPEED * 0.73) + (phase * 1.7)) * IDLE_SPREAD);
			this.#touch(
				PAD + (fractionX * this.#visibleWidth),
				PAD + (fractionY * this.#visibleHeight),
				IDLE_IMPULSE,
				IDLE_RADIUS,
			);
		}
	}

	#renderFrame(time: number): void
	{
		const context = this.#context;
		if (!context)
		{
			return;
		}

		if (!this.#isStepDue(time))
		{
			this.#frameRequest = requestAnimationFrame(this.#onFrame);

			return;
		}

		this.#applyPointerMove();
		this.#emitIdleWaves(time);

		if (this.#refreshSource(time) && this.#output)
		{
			this.#relaxSurface();
			this.#paintRefraction(context);
		}
		else
		{
			this.#paintSource();
		}

		this.#frameRequest = requestAnimationFrame(this.#onFrame);
	}

	/**
	 * The step clock advances by whole steps but never past the frame, so a display at 144 Hz
	 * still averages 60 steps a second while one at 60 Hz or slower steps on every frame. A clock
	 * left far behind - a hidden tab, a long task - restarts from now instead of catching up.
	 */
	#isStepDue(time: number): boolean
	{
		const elapsed = time - this.#lastStepTime;
		if (elapsed < STEP_INTERVAL_MS * STEP_TOLERANCE)
		{
			return false;
		}

		this.#lastStepTime = elapsed > STEP_INTERVAL_MS * 2
			? time
			: Math.min(this.#lastStepTime + STEP_INTERVAL_MS, time)
		;

		return true;
	}

	#relaxSurface(): void
	{
		const width = this.#width;

		for (let y = 1; y < this.#height - 1; y++)
		{
			const row = y * width;
			for (let x = 1; x < width - 1; x++)
			{
				const index = row + x;
				const average = (
					this.#surface[index - 1]
					+ this.#surface[index + 1]
					+ this.#surface[index - width]
					+ this.#surface[index + width]
				) * 0.25;
				const relaxed = this.#velocity[index] + ((average - this.#surface[index]) * TENSION);
				this.#velocity[index] = relaxed * VISCOSITY * this.#absorb[index];
			}
		}

		for (let y = 1; y < this.#height - 1; y++)
		{
			const row = y * width;
			for (let x = 1; x < width - 1; x++)
			{
				const index = row + x;
				const relaxed = (this.#surface[index] + this.#velocity[index]) * RECOVER;
				this.#surface[index] = relaxed * this.#absorb[index];
			}
		}
	}

	#paintRefraction(context: CanvasRenderingContext2D): void
	{
		const output = this.#output;
		const source = this.#sourcePixels;
		if (!output || !source)
		{
			return;
		}

		const width = this.#width;
		const pixels = output.data;
		const fromY = Math.max(1, PAD - EDGE_BAND);
		const toY = Math.min(this.#height - 1, PAD + this.#visibleHeight + EDGE_BAND);
		const fromX = Math.max(1, PAD - EDGE_BAND);
		const toX = Math.min(width - 1, PAD + this.#visibleWidth + EDGE_BAND);

		for (let y = fromY; y < toY; y++)
		{
			const row = y * width;
			for (let x = fromX; x < toX; x++)
			{
				const index = row + x;
				const target = index * 4;
				const slopeX = this.#surface[index - 1] - this.#surface[index + 1];
				const slopeY = this.#surface[index - width] - this.#surface[index + width];

				let sampleX = x + Math.trunc(slopeX * REFRACTION);
				let sampleY = y + Math.trunc(slopeY * REFRACTION);
				sampleX = Math.min(Math.max(sampleX, 0), width - 1);
				sampleY = Math.min(Math.max(sampleY, 0), this.#height - 1);

				const sample = ((sampleY * width) + sampleX) * 4;
				let shade = (slopeX + slopeY) * SHADING;
				shade = Math.min(Math.max(shade, -MAX_SHADE), MAX_SHADE);

				pixels[target] = source[sample] + shade;
				pixels[target + 1] = source[sample + 1] + shade;
				pixels[target + 2] = source[sample + 2] + shade;
				pixels[target + 3] = 255;
			}
		}

		context.putImageData(output, 0, 0, fromX, fromY, toX - fromX, toY - fromY);
	}
}
