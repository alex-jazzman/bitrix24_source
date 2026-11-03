import {
	type WhatsNewBackdropContextKind,
	type WhatsNewBackdropEffect,
	type WhatsNewBackdropFrame,
	type WhatsNewColorScheme,
} from '../../types';
import { BackdropBrush, toBlurRadius, toChannels } from '../brush';
import { FRAGMENT_SOURCE, MAX_BALLOONS, VERTEX_SOURCE } from './balloons-shader';

// The frame the numbers below are counted per, ms. A loop of another pace is brought to it by the step, so
// the wall moves at the same speed on a screen of any refresh rate. A step of no length is not one.
const FRAME = 16;
const MIN_DELTA = 1;
const SECOND = 1000;

// The full-screen triangle of the vertex program: three vertices and no buffer behind them.
const TRIANGLE_VERTICES = 3;
// How many numbers of an array of the programs one body takes.
const BODY_VALUES = 4;

/*
 * The step of the grid, in shares of the shorter side of the card, and how much the rows are pressed
 * together. Pressed rows and every other one moved half a cell across put the wall into a honeycomb: a
 * square net would read as a net, and the wall has to read as a heap of balloons.
 */
const CELL = 0.24;
const ROW_SQUEEZE = 0.84;
const ROW_SHIFT = 0.5;

// The radius of a body, in shares of the cell.
const RADIUS_OF_CELL_MIN = 0.5;
const RADIUS_OF_CELL_MAX = 0.8;
// A body stands a little taller than it is wide.
const SQUASH_Y = 1.06;

// How many cells of the grid stand beyond every edge of the card, so that the wall has no rim of its own.
const BLEED_CELLS = 1;
// How far off the middle of its cell a body stands, in shares of the cell.
const JITTER = 0.5;
// The turn of a body, radians either way.
const TILT = 0.24;

/*
 * The spread along the depth, in shares of the radius, and how many layers it is cut into. It is
 * microscopic on purpose and is there for one thing only: a steady order of drawing. Overlaps are
 * forbidden by a decision of the product - the balloons only touch and crumple a little at the contact -
 * so there is nothing to draw apart. The layer of a body is counted from its place in the grid, so that
 * neighbours are knowingly in different layers.
 */
const DEPTH_SPREAD = 0.08;
const DEPTH_LAYERS = 4;
const LAYER_ACROSS = 3;
const LAYER_DOWN = 5;

/*
 * The wall is not thrown at random but counted: the same card always gets the very same wall, so a window
 * opened twice looks the same both times. Four strides over the number of a cell give four shares of their
 * own, and no two of them come back to the same figure over the grid.
 */
const RADIUS_STRIDE = 37;
const ACROSS_STRIDE = 61;
const DOWN_STRIDE = 43;
const SEED_STRIDE = 71;
const STRIDE_STEPS = 100;
// The seed of the streaks of the film: every body carries a pattern of its own, or the wall looks stamped.
const SEED_RANGE = 10;

// How hard a body is pulled back to its place in the grid, and what it keeps of its speed every frame.
const HOME_SPRING = 0.008;
const FRICTION = 0.9;

// How far the pointer pushes the bodies away, in shares of the shorter side of the card, and how hard.
const PUSH_REACH = 0.26;
const PUSH_FORCE = 0.32;
// A body right under the pointer names no direction to be pushed in.
const TOUCH_FLOOR = 0.001;

// How far the pointer presses the bodies in, and the spring the dent is led by.
const PRESS_REACH = 0.22;
const DENT_SPRING = 0.22;
const DENT_DAMPING = 0.66;
// A body pressed in swells across and flattens down.
const JELLY_SPREAD = 0.05;
const JELLY_FLATTEN = 0.04;

/*
 * The contact. Two bodies are let into one another by CONTACT_SQUEEZE of the sum of their radii - that is
 * the crumple at the touch, and without it the wall stands in gaps. A pass takes them apart by
 * CONTACT_RELAX of the overlap and gives back CONTACT_RESTITUTION of the speed they met at; three passes
 * are what it takes for a body pressed from every side to find its place inside one frame.
 */
const CONTACT_PASSES = 3;
const CONTACT_SQUEEZE = 0.2;
const CONTACT_RELAX = 0.45;
const CONTACT_RESTITUTION = 0.22;

/*
 * How flat the neighbours are allowed to crumple a body, how fast it gets there, and how much of what it
 * loses across it gains down. By the balance of the product the balloons crumple mostly against one
 * another and far less under the pointer.
 */
const CONTACT_SQUASH = 0.42;
const SQUASH_GAIN = 1.3;
const SQUASH_EASE = 0.18;
const SQUASH_STRETCH = 0.55;
// A crumple smaller than this is not drawn, and a press shorter than this names no direction for it.
const SQUASH_FLOOR = 0.004;
const PRESS_FLOOR = 0.0001;

// The direction towards the light. The y is negative: the normals are in the axes of the screen, and y
// grows down there.
const LIGHT: number[] = [-0.42, -0.62, 0.66];
// The darkening towards the bottom of the card, at the top and at the bottom: the texts of the card are
// white and the wall is light.
const SCRIM: number[] = [0, 0.3];

/*
 * The tone the light of the wall is added in: the glow of the scheme raised nearly to white and let down
 * in colour. Flat white would be the light of a lamp and the scheme would stop showing through the
 * balloons. The tone of the shadow is the base of the scheme taken towards black.
 */
const SPARK_LIGHT = 0.97;
const SPARK_SATURATION = 0.8;
const SHADOW_SHIFT = -0.55;

const CHANNEL_MAX = 255;

// The circle of hues is walked by sixths, and every sixth of it takes the three parts of the colour in an
// order of its own: 0 is nothing of it, 1 the second part, 2 the whole of the chroma.
const HUE_SECTOR = 60;
const FULL_HUE = 360;
const HUE_SECTORS = 6;
const HUE_SECTOR_MIX: readonly number[][] = Object.freeze([
	[2, 1, 0],
	[1, 2, 0],
	[0, 2, 1],
	[0, 1, 2],
	[1, 0, 2],
	[2, 0, 1],
]);

// The values the programs are fed by, under the very names they carry inside the programs.
type Uniforms = {
	u_res: WebGLUniformLocation | null;
	u_count: WebGLUniformLocation | null;
	u_ball: WebGLUniformLocation | null;
	u_extra: WebGLUniformLocation | null;
	u_bg: WebGLUniformLocation | null;
	u_light: WebGLUniformLocation | null;
	u_spark: WebGLUniformLocation | null;
	u_shadow: WebGLUniformLocation | null;
	u_scrim: WebGLUniformLocation | null;
	u_time: WebGLUniformLocation | null;
	u_press: WebGLUniformLocation | null;
};

// Everything taken from the hardware, in one place: it is given back the same way.
type Resources = {
	vertexShader: WebGLShader;
	fragmentShader: WebGLShader;
	program: WebGLProgram;
	texture: WebGLTexture;
	uniforms: Uniforms;
};

type Balloon = {
	x: number;
	y: number;
	// The place in the grid the body is pulled back to.
	homeX: number;
	homeY: number;
	speedX: number;
	speedY: number;
	radius: number;
	tilt: number;
	// The shift along the depth, and the seed the streaks of the film are drawn from.
	depth: number;
	seed: number;
	// How far the pointer has pressed the body in, and how fast that is changing.
	dent: number;
	dentSpeed: number;
	// How hard the neighbours pressed the body over the frame, along the two axes.
	pressX: number;
	pressY: number;
	// How flat the neighbours have crumpled it.
	squash: number;
};

type Place = {
	x: number;
	y: number;
};

type Grid = {
	columns: number;
	cell: number;
	rowStep: number;
};

// The share of its own a stride gives to the cell of that number.
const share = (at: number, stride: number): number => ((at * stride) % STRIDE_STEPS) / STRIDE_STEPS;

// A share taken from the middle of a cell instead of the corner of it: -1 at one edge, 1 at the other.
const spread = (offset: number): number => (offset - 0.5) * 2;

// Where inside a cell a body stands: the middle of it, moved by up to half of JITTER either way.
const inCell = (span: number, offset: number): number => span * (0.5 + spread(offset) * JITTER / 2);

// The three channels of a colour, each of nought to one.
const toShares = (channels: number[]): number[] => {
	return channels.map((channel: number) => channel / CHANNEL_MAX);
};

// The colour moved towards white by a positive shift and towards black by a negative one.
const toTone = (channels: number[], shift: number): number[] => {
	const target: number = shift > 0 ? CHANNEL_MAX : 0;
	const way: number = Math.abs(shift);

	return channels.map((channel: number) => (channel + (target - channel) * way) / CHANNEL_MAX);
};

// Where on the circle of hues a colour stands, in degrees. A colour of no chroma at all stands nowhere,
// and nought is as good an answer as any.
const toHue = (red: number, green: number, blue: number, chroma: number): number => {
	if (chroma === 0)
	{
		return 0;
	}

	let hue: number = 0;

	if (red >= green && red >= blue)
	{
		hue = ((green - blue) / chroma) % HUE_SECTORS;
	}
	else if (green >= blue)
	{
		hue = (blue - red) / chroma + 2;
	}
	else
	{
		hue = (red - green) / chroma + 4;
	}

	hue *= HUE_SECTOR;

	return hue < 0 ? hue + FULL_HUE : hue;
};

/**
 * The colour of the scheme taken to a pastel: the hue of it is kept, the colour let down and the lightness
 * set anew. The light of the wall is added in this tone, and the tone has to stay of the scheme.
 */
const toPastel = (channels: number[], light: number, saturationGain: number): number[] => {
	const [red, green, blue] = toShares(channels);
	const top: number = Math.max(red, green, blue);
	const bottom: number = Math.min(red, green, blue);
	const middle: number = (top + bottom) / 2;
	const spanned: number = top - bottom;

	const hue: number = toHue(red, green, blue, spanned);
	const wasSaturation: number = spanned === 0 ? 0 : spanned / (1 - Math.abs(2 * middle - 1));

	const saturation: number = Math.min(1, wasSaturation * saturationGain);
	const lightness: number = Math.min(1, Math.max(0, light));

	const chroma: number = (1 - Math.abs(2 * lightness - 1)) * saturation;
	const second: number = chroma * (1 - Math.abs(((hue / HUE_SECTOR) % 2) - 1));
	const parts: number[] = [0, second, chroma];
	const lift: number = lightness - chroma / 2;

	const sector: number = Math.floor(hue / HUE_SECTOR) % HUE_SECTORS;

	return HUE_SECTOR_MIX[sector].map((part: number) => parts[part] + lift);
};

// A program that did not come together is not reported anywhere: what to show instead of the effect is
// decided by the backdrop, and it shows the static composition.
const compile = (gl: WebGL2RenderingContext, kind: number, source: string): WebGLShader | null => {
	const shader: WebGLShader | null = gl.createShader(kind);
	if (!shader)
	{
		return null;
	}

	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
	{
		gl.deleteShader(shader);

		return null;
	}

	return shader;
};

const link = (
	gl: WebGL2RenderingContext,
	vertexShader: WebGLShader,
	fragmentShader: WebGLShader,
): WebGLProgram | null => {
	const program: WebGLProgram | null = gl.createProgram();
	if (!program)
	{
		return null;
	}

	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS))
	{
		gl.deleteProgram(program);

		return null;
	}

	return program;
};

/**
 * A wall of transparent balloons standing over the composition of the backdrop: they are pulled to their
 * places in the grid, run into one another, crumple at the contacts and give way under the pointer.
 *
 * This is the one effect of the backdrop that does not paint the picture by hand. Every pixel of it walks
 * every body of the wall, and on a card of the middle size that is some nineteen million turns of a loop
 * per frame - work only the hardware does at a sensible price. So the effect asks the engine for the
 * hardware context and hands it two programs; everything else - the size, the pointer, the loop of frames,
 * the standing still off the screen and behind a hidden tab - stays the engine's, exactly as it is for the
 * effects that draw by hand.
 *
 * The composition under the wall is the brush's and is sent to the hardware as it is, out of the buffer of
 * the brush and only when the brush has baked it anew. In the sources of the mockup that texture is filled
 * afresh on every single frame.
 */
export class BalloonsEffect implements WhatsNewBackdropEffect<WebGL2RenderingContext>
{
	readonly contextKind: WhatsNewBackdropContextKind = 'webgl2';

	#brush: BackdropBrush;
	#balloons: Balloon[] = [];

	// The card, in pixels. A card of another size gets the wall laid out anew.
	#width: number = 0;
	#height: number = 0;

	/*
	 * The wall as the programs take it: the place and the two radii in one array, the depth, the tilt, the
	 * seed and the dent in the other. Both are made once and filled anew every frame - a fresh array per
	 * frame is rubbish for the collector sixty times a second.
	 */
	#bodies: Float32Array = new Float32Array(MAX_BALLOONS * BODY_VALUES);
	#extras: Float32Array = new Float32Array(MAX_BALLOONS * BODY_VALUES);

	// Everything taken from the hardware is held in fields and not in the closures of a frame, so that it
	// can be given back whole.
	#gl: WebGL2RenderingContext | null = null;
	#resources: Resources | null = null;

	// The tone the light of the wall is added in and the tone of its shadow, three shares each.
	#spark: number[] = [];
	#shadow: number[] = [];
	// Whether the tones of the scheme were read at all. A colour that does not read leaves the effect with
	// nothing of the scheme to draw, and that is a refusal: the engine keeps the static composition.
	#hasTones: boolean = false;

	// Which baking of the composition the texture holds, and how many times a texture has been sent over at
	// all. The count is the only way from the outside to tell a texture sent once from one sent every frame.
	#uploaded: number = 0;
	#uploads: number = 0;

	// The token is read off the canvas once: the styles of the portal do not change under a window that is
	// already open.
	#blur: number | null = null;

	constructor(scheme: WhatsNewColorScheme)
	{
		this.#brush = new BackdropBrush(scheme);
		this.#applyScheme(scheme);
	}

	/**
	 * Builds the two programs and the texture on the context the engine has given. A refusal here is the
	 * refusal of the whole effect: the engine takes the canvas away and the card keeps the static
	 * composition it already stands on.
	 */
	prepare(context: WebGL2RenderingContext): boolean
	{
		if (!this.#hasTones)
		{
			return false;
		}

		const resources: Resources | null = this.#build(context);
		if (!resources)
		{
			return false;
		}

		this.#gl = context;
		this.#resources = resources;
		this.#applyTone();

		return true;
	}

	draw(frame: WhatsNewBackdropFrame<WebGL2RenderingContext>): void
	{
		const resources: Resources | null = this.#resources;
		if (!resources)
		{
			return;
		}

		const { context, width, height, delta } = frame;

		this.#layout(width, height);

		const pointer: Place | null = frame.pointer.inside
			? { x: frame.pointer.x * width, y: frame.pointer.y * height }
			: null;

		this.#simulate(Math.max(delta, MIN_DELTA) / FRAME, pointer);
		this.#upload(context, resources, frame);
		this.#render(context, resources, frame, pointer);
	}

	setScheme(scheme: WhatsNewColorScheme): void
	{
		this.#brush.setScheme(scheme);
		this.#applyScheme(scheme);
	}

	// How many bodies the wall stands of. The count is the only way from the outside to tell a wall laid out
	// anew from one that kept its old size, and a wall that keeps to its limit from one that grew past it.
	getBalloonCount(): number
	{
		return this.#balloons.length;
	}

	// How many times the composition has been sent to the hardware.
	getUploadCount(): number
	{
		return this.#uploads;
	}

	/**
	 * Gives the hardware back everything taken from it. Called when the browser takes the context away as
	 * well as when the effect goes for good, so nothing here touches what the effect owns beyond the
	 * context: after a release the effect is whole and `prepare()` builds it on the context anew.
	 */
	release(): void
	{
		const gl: WebGL2RenderingContext | null = this.#gl;
		const resources: Resources | null = this.#resources;

		this.#gl = null;
		this.#resources = null;
		// The texture went with the rest, so the composition has to be sent over anew and not skipped as a
		// baking that is already on the hardware.
		this.#uploaded = 0;

		if (!gl || !resources)
		{
			return;
		}

		gl.deleteProgram(resources.program);
		gl.deleteShader(resources.vertexShader);
		gl.deleteShader(resources.fragmentShader);
		gl.deleteTexture(resources.texture);
	}

	destroy(): void
	{
		this.release();
		this.#brush.destroy();
		this.#balloons = [];
	}

	#build(gl: WebGL2RenderingContext): Resources | null
	{
		const vertexShader: WebGLShader | null = compile(gl, gl.VERTEX_SHADER, VERTEX_SOURCE);
		const fragmentShader: WebGLShader | null = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SOURCE);
		const program: WebGLProgram | null = vertexShader && fragmentShader
			? link(gl, vertexShader, fragmentShader)
			: null;
		const texture: WebGLTexture | null = program ? gl.createTexture() : null;

		if (!vertexShader || !fragmentShader || !program || !texture)
		{
			// Nothing built halfway is left on the hardware: the effect is refused and never comes back here.
			gl.deleteShader(vertexShader);
			gl.deleteShader(fragmentShader);
			gl.deleteProgram(program);

			return null;
		}

		gl.useProgram(program);

		const locate = (name: keyof Uniforms): WebGLUniformLocation | null => {
			return gl.getUniformLocation(program, name);
		};

		const uniforms: Uniforms = {
			u_res: locate('u_res'),
			u_count: locate('u_count'),
			u_ball: locate('u_ball'),
			u_extra: locate('u_extra'),
			u_bg: locate('u_bg'),
			u_light: locate('u_light'),
			u_spark: locate('u_spark'),
			u_shadow: locate('u_shadow'),
			u_scrim: locate('u_scrim'),
			u_time: locate('u_time'),
			u_press: locate('u_press'),
		};

		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		// The composition is the only picture the programs read, and it lies on the first place of all.
		gl.uniform1i(uniforms.u_bg, 0);
		gl.uniform3fv(uniforms.u_light, LIGHT);
		gl.uniform2fv(uniforms.u_scrim, SCRIM);

		return { vertexShader, fragmentShader, program, texture, uniforms };
	}

	/*
	 * The two tones of the scheme are counted once per scheme and not once per frame. A scheme whose colours
	 * do not read leaves the tones it had: the palette of the component is the only source of them, so this is
	 * a refusal of the effect and not a state to draw around.
	 */
	#applyScheme(scheme: WhatsNewColorScheme): void
	{
		const glow: number[] | null = toChannels(scheme.glow);
		const base: number[] | null = toChannels(scheme.base);
		if (!glow || !base)
		{
			return;
		}

		this.#spark = toPastel(glow, SPARK_LIGHT, SPARK_SATURATION);
		this.#shadow = toTone(base, SHADOW_SHIFT);
		this.#hasTones = true;
		this.#applyTone();
	}

	#applyTone(): void
	{
		const gl: WebGL2RenderingContext | null = this.#gl;
		const resources: Resources | null = this.#resources;
		if (!gl || !resources)
		{
			return;
		}

		gl.useProgram(resources.program);
		gl.uniform3fv(resources.uniforms.u_spark, this.#spark);
		gl.uniform3fv(resources.uniforms.u_shadow, this.#shadow);
	}

	/**
	 * Lays the wall out over the card. A card of the size it already knows is left alone: the layout is the
	 * one thing here that walks the whole grid, and the size changes far more rarely than the frame does.
	 */
	#layout(width: number, height: number): void
	{
		if (width === this.#width && height === this.#height)
		{
			return;
		}

		this.#width = width;
		this.#height = height;

		const side: number = Math.min(width, height);
		const cell: number = side * CELL;
		const rowStep: number = cell * ROW_SQUEEZE;
		const grid: Grid = {
			cell,
			rowStep,
			columns: Math.ceil(width / cell) + BLEED_CELLS * 2,
		};
		const rows: number = Math.ceil(height / rowStep) + BLEED_CELLS * 2;

		const wall: Balloon[] = [];

		for (let row = 0; row < rows && wall.length < MAX_BALLOONS; row++)
		{
			for (let column = 0; column < grid.columns && wall.length < MAX_BALLOONS; column++)
			{
				wall.push(this.#toBalloon(row, column, grid, this.#balloons[wall.length]));
			}
		}

		this.#balloons = wall;
	}

	// A body of the wall. A body that was already standing there keeps where it had got to and how fast it
	// was going: the wall of a card given another size goes on living instead of snapping back to the grid.
	#toBalloon(row: number, column: number, grid: Grid, kept?: Balloon): Balloon
	{
		const at: number = row * grid.columns + column;
		const span: number = RADIUS_OF_CELL_MAX - RADIUS_OF_CELL_MIN;
		const radius: number = grid.cell * (RADIUS_OF_CELL_MIN + share(at, RADIUS_STRIDE) * span);

		const offset: number = row % 2 === 0 ? 0 : grid.cell * ROW_SHIFT;
		const homeX: number = (column - BLEED_CELLS) * grid.cell + offset
			+ inCell(grid.cell, share(at, ACROSS_STRIDE));
		const homeY: number = (row - BLEED_CELLS) * grid.rowStep
			+ inCell(grid.rowStep, share(at, DOWN_STRIDE));

		const layer: number = (column * LAYER_ACROSS + row * LAYER_DOWN) % DEPTH_LAYERS;

		return {
			x: kept ? kept.x : homeX,
			y: kept ? kept.y : homeY,
			homeX,
			homeY,
			speedX: kept ? kept.speedX : 0,
			speedY: kept ? kept.speedY : 0,
			radius,
			tilt: spread(share(at, DOWN_STRIDE)) * TILT,
			depth: (layer / (DEPTH_LAYERS - 1) - 0.5) * DEPTH_SPREAD * radius,
			seed: share(at, SEED_STRIDE) * SEED_RANGE,
			dent: kept ? kept.dent : 0,
			dentSpeed: kept ? kept.dentSpeed : 0,
			pressX: 0,
			pressY: 0,
			squash: kept ? kept.squash : 0,
		};
	}

	#simulate(step: number, pointer: Place | null): void
	{
		const side: number = Math.min(this.#width, this.#height);

		this.#lead(step, pointer, side * PUSH_REACH, side * PRESS_REACH);

		for (let pass = 0; pass < CONTACT_PASSES; pass++)
		{
			this.#contact();
		}

		this.#settle(step);
	}

	// The pull back to the grid, the dent under the pointer and the push away from it: everything a body
	// answers to on its own, before it meets its neighbours.
	#lead(step: number, pointer: Place | null, reach: number, pressReach: number): void
	{
		const damping: number = DENT_DAMPING ** step;

		this.#balloons.forEach((item: Balloon) => {
			const balloon: Balloon = item;
			balloon.pressX = 0;
			balloon.pressY = 0;

			balloon.speedX += (balloon.homeX - balloon.x) * HOME_SPRING * step;
			balloon.speedY += (balloon.homeY - balloon.y) * HOME_SPRING * step;

			const dx: number = pointer ? balloon.x - pointer.x : 0;
			const dy: number = pointer ? balloon.y - pointer.y : 0;
			const distance: number = pointer ? Math.hypot(dx, dy) : 0;

			const wanted: number = pointer && distance < pressReach ? 1 - distance / pressReach : 0;
			balloon.dentSpeed += (wanted - balloon.dent) * DENT_SPRING * step;
			balloon.dentSpeed *= damping;
			balloon.dent = Math.max(balloon.dent + balloon.dentSpeed * step, 0);

			if (pointer && distance < reach && distance > TOUCH_FLOOR)
			{
				const force: number = (1 - distance / reach) * PUSH_FORCE * step;

				balloon.speedX += (dx / distance) * force;
				balloon.speedY += (dy / distance) * force;
			}
		});
	}

	/*
	 * One pass over every pair of bodies of the wall. The pass is not scaled by the length of the frame on
	 * purpose: it is not a step of movement but the settling of a constraint, and a constraint either holds
	 * or it does not.
	 */
	#contact(): void
	{
		const wall: Balloon[] = this.#balloons;

		for (let one = 0; one < wall.length; one++)
		{
			for (let other = one + 1; other < wall.length; other++)
			{
				this.#touch(wall[one], wall[other]);
			}
		}
	}

	// Two bodies closer to one another than they are allowed to be: they are taken a part of the way apart,
	// given back a part of the speed they met at, and each remembers how hard it was pressed.
	#touch(first: Balloon, second: Balloon): void
	{
		const one: Balloon = first;
		const other: Balloon = second;
		const dx: number = other.x - one.x;
		const dy: number = other.y - one.y;
		const squared: number = dx * dx + dy * dy;
		if (squared === 0)
		{
			return;
		}

		const closest: number = (one.radius + other.radius) * (1 - CONTACT_SQUEEZE);
		if (squared >= closest * closest)
		{
			return;
		}

		const distance: number = Math.sqrt(squared);
		const alongX: number = dx / distance;
		const alongY: number = dy / distance;
		const overlap: number = closest - distance;

		one.pressX -= alongX * overlap;
		one.pressY -= alongY * overlap;
		other.pressX += alongX * overlap;
		other.pressY += alongY * overlap;

		const apart: number = (overlap / 2) * CONTACT_RELAX;
		one.x -= alongX * apart;
		one.y -= alongY * apart;
		other.x += alongX * apart;
		other.y += alongY * apart;

		// Two bodies already going apart are not pushed apart a second time.
		const closing: number = (other.speedX - one.speedX) * alongX + (other.speedY - one.speedY) * alongY;
		if (closing > 0)
		{
			return;
		}

		const bounce: number = -closing * CONTACT_RESTITUTION;
		one.speedX -= alongX * bounce;
		one.speedY -= alongY * bounce;
		other.speedX += alongX * bounce;
		other.speedY += alongY * bounce;
	}

	// The bodies are moved by what they have gathered, and the crumple catches up with how hard they were
	// pressed over the frame.
	#settle(step: number): void
	{
		const friction: number = FRICTION ** step;
		const ease: number = 1 - (1 - SQUASH_EASE) ** step;

		this.#balloons.forEach((item: Balloon) => {
			const balloon: Balloon = item;
			balloon.x += balloon.speedX * step;
			balloon.y += balloon.speedY * step;
			balloon.speedX *= friction;
			balloon.speedY *= friction;

			const pressed: number = Math.hypot(balloon.pressX, balloon.pressY) / balloon.radius;
			const wanted: number = Math.min(CONTACT_SQUASH, pressed * SQUASH_GAIN);

			balloon.squash += (wanted - balloon.squash) * ease;
		});
	}

	/**
	 * Sends the composition to the hardware. The picture is the buffer of the brush as it is, and it goes
	 * over only once per baking: the brush bakes it anew when the size, the scheme or the phase of the
	 * drift has changed, and on every other frame the texture already holds what it should.
	 */
	#upload(
		gl: WebGL2RenderingContext,
		resources: Resources,
		frame: WhatsNewBackdropFrame<WebGL2RenderingContext>,
	): void
	{
		const buffer: HTMLCanvasElement | null = this.#brush.getBuffer({
			width: this.#width,
			height: this.#height,
			time: frame.time,
			blur: this.#requireBlur(gl.canvas),
		});

		const bakes: number = this.#brush.getBakeCount();
		if (!buffer || bakes === this.#uploaded)
		{
			return;
		}

		gl.bindTexture(gl.TEXTURE_2D, resources.texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, buffer);

		this.#uploaded = bakes;
		this.#uploads += 1;
	}

	#render(
		gl: WebGL2RenderingContext,
		resources: Resources,
		frame: WhatsNewBackdropFrame<WebGL2RenderingContext>,
		pointer: Place | null,
	): void
	{
		// The drawing area of the hardware is counted in the pixels of the screen, and the wall in the
		// pixels of the card; on a screen of the usual density the two are the same thing.
		const ratio: number = this.#width > 0 ? gl.drawingBufferWidth / this.#width : 1;
		const count: number = this.#fill(ratio);
		const reach: number = Math.min(this.#width, this.#height) * PRESS_REACH * ratio;
		const { uniforms, program, texture } = resources;

		gl.useProgram(program);
		gl.bindTexture(gl.TEXTURE_2D, texture);

		gl.uniform2f(uniforms.u_res, gl.drawingBufferWidth, gl.drawingBufferHeight);
		gl.uniform1i(uniforms.u_count, count);
		gl.uniform1f(uniforms.u_time, frame.time / SECOND);
		// A reach of nought is how the programs are told there is no pointer over the card.
		gl.uniform3f(
			uniforms.u_press,
			pointer ? pointer.x * ratio : 0,
			pointer ? pointer.y * ratio : 0,
			pointer ? reach : 0,
		);
		gl.uniform4fv(uniforms.u_ball, this.#bodies);
		gl.uniform4fv(uniforms.u_extra, this.#extras);

		gl.drawArrays(gl.TRIANGLES, 0, TRIANGLE_VERTICES);
	}

	// Lays the wall out into the two arrays the programs read it from. Answers how many bodies went in.
	#fill(ratio: number): number
	{
		this.#balloons.forEach((balloon: Balloon, at: number) => {
			let radiusX: number = balloon.radius * (1 + JELLY_SPREAD * balloon.dent);
			let radiusY: number = balloon.radius * SQUASH_Y * (1 - JELLY_FLATTEN * balloon.dent);
			let tilt: number = balloon.tilt;

			if (balloon.squash > SQUASH_FLOOR)
			{
				const pressed: number = Math.hypot(balloon.pressX, balloon.pressY);
				if (pressed > PRESS_FLOOR)
				{
					// The crumple is aimed the way the neighbours press, so a body squeezed from the side
					// gives way sideways and not down.
					tilt = Math.atan2(balloon.pressY, balloon.pressX);
				}

				radiusX *= 1 - balloon.squash;
				radiusY *= 1 + balloon.squash * SQUASH_STRETCH;
			}

			const to: number = at * BODY_VALUES;

			this.#bodies[to] = balloon.x * ratio;
			this.#bodies[to + 1] = balloon.y * ratio;
			this.#bodies[to + 2] = radiusX * ratio;
			this.#bodies[to + 3] = radiusY * ratio;

			this.#extras[to] = balloon.depth * ratio;
			this.#extras[to + 1] = tilt;
			this.#extras[to + 2] = balloon.seed;
			this.#extras[to + 3] = balloon.dent;
		});

		return this.#balloons.length;
	}

	// The engine draws on a canvas of the page; the type of the property allows an offscreen one, and that
	// is not a canvas the engine ever makes.
	#requireBlur(canvas: HTMLCanvasElement | OffscreenCanvas): number
	{
		this.#blur ??= canvas instanceof HTMLCanvasElement ? toBlurRadius(canvas) : 0;

		return this.#blur;
	}
}
