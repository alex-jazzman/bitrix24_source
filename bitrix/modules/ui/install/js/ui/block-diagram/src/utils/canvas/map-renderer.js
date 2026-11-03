import { Dom, Type } from 'main.core';
import { mapShaders } from './shaders';
import { compileShader, createProgram } from './helpers';
import type { MapBlockRect, MapColor, MapColors } from './map-geometry';
import type { DiagramInstancesContext, Rect } from '../../types';

// Theme colors as they are written in the product: a design token reference or a plain
// CSS color. The renderer resolves them to numbers, and it is the only place that does.
export type MapPalette = {
	palette: { [string]: string },
	framePalette: { [string]: string },
	block: string,
	frame: string,
	viewport: string,
};

// Everything the renderer needs for a frame. It knows nothing about the camera: block
// rectangles and the frame of the current view arrive already in map pixels.
export type MapFrame = {
	blocks: Array<MapBlockRect>,
	viewport: Rect,
	viewportColor: MapColor,
};

export const MAP_BLOCK_CORNER_RADIUS: number = 2;
export const MAP_VIEWPORT_CORNER_RADIUS: number = 4;
export const MAP_VIEWPORT_OUTLINE_WIDTH: number = 2;

// Last resort for a color the theme resolves to nothing parseable - a missing token means
// the design tokens are not loaded at all, and a neutral shape beats an empty map.
const UNRESOLVED_COLOR: MapColor = [0.9, 0.9, 0.9, 1];

// a_Position, a_Center, a_HalfSize, a_Color, a_Shape
const FLOATS_PER_VERTEX: number = 12;
const VERTICES_PER_RECT: number = 6;
const BYTES_PER_FLOAT: number = 4;
const VERTEX_STRIDE: number = FLOATS_PER_VERTEX * BYTES_PER_FLOAT;

// One vertex, attribute by attribute: name in the program, component count, offset in floats.
const VERTEX_ATTRIBUTES = [
	['position', 2, 0],
	['center', 2, 2],
	['halfSize', 2, 4],
	['color', 4, 6],
	['shape', 2, 10],
];

// Coverage ramp of an edge, in device pixels. One pixel keeps the corners smooth without
// visibly thinning the shape.
const EDGE_SOFTNESS_PX: number = 0.5;

const CSS_VAR_PATTERN: RegExp = /^var\(\s*(--[\w-]+)\s*(?:,([\s\S]+))?\)$/;
const RGB_PATTERN: RegExp = /^rgba?\(([^)]+)\)$/i;
const MAX_VAR_DEPTH: number = 8;

// A color that leans on its surroundings rather than standing on its own. The numbers behind
// it belong to the place it was resolved in, so they must not be remembered for the next one.
const CONTEXTUAL_COLOR_PATTERN: RegExp = /currentcolor|inherit|initial|unset|revert/i;

// Colors already resolved by the browser. A plain CSS color always gives the same numbers, so
// resolving it a second time only costs another style recalculation. Theme references are
// resolved before the cache is reached, so a theme change never hands out a stale color.
const resolvedColors: Map<string, MapColor | null> = new Map();

// Sentinel of the pixel readback: a color the palette is never going to be written in, so it
// surviving the assignment means the drawing context refused the value.
const READBACK_SENTINEL: string = '#010203';

let readbackContext: CanvasRenderingContext2D | null = null;

// Follows a chain of design token references down to a plain CSS color. An undefined token
// falls back to the value written inside var(), and then to the caller's constant.
function resolveCssValue(style: CSSStyleDeclaration, value: ?string, depth: number = 0): string
{
	const trimmed = String(value ?? '').trim();
	const reference = CSS_VAR_PATTERN.exec(trimmed);

	if (!reference || depth >= MAX_VAR_DEPTH)
	{
		return trimmed;
	}

	const token = style.getPropertyValue(reference[1]).trim();

	return resolveCssValue(style, token === '' ? reference[2] : token, depth + 1);
}

function parseRgbComponent(part: string, scale: number): number
{
	const value = Number.parseFloat(part);

	if (!Number.isFinite(value))
	{
		return Number.NaN;
	}

	return part.endsWith('%') ? value / 100 : value / scale;
}

// Reads back what the browser computed. Whatever notation the color was written in, a computed
// color comes back as rgb() or rgba(), and that is the only notation parsed by hand here.
function parseRgbNotation(value: string): MapColor | null
{
	const notation = RGB_PATTERN.exec(value);

	if (!notation)
	{
		return null;
	}

	const parts = notation[1].split(/[\s,/]+/).filter((part) => part !== '');

	if (parts.length < 3)
	{
		return null;
	}

	const color = [
		parseRgbComponent(parts[0], 255),
		parseRgbComponent(parts[1], 255),
		parseRgbComponent(parts[2], 255),
		parts.length > 3 ? parseRgbComponent(parts[3], 1) : 1,
	];

	return color.some((component) => !Number.isFinite(component)) ? null : color;
}

// Hands the color to the browser and reads the result back. The map is drawn by the video card,
// but its palette stays a public contract written in CSS, so the renderer has no business
// deciding which notations CSS has - hsl(), a color name, transparent and color-mix() are as
// valid as a hexadecimal token.
//
// The probe stands where the markup of the map used to stand: next to the map element, inside a
// carrier that wears the color of that element. That is what makes currentColor mean the same
// thing it meant when the map was drawn by the browser - the color the map inherits.
function resolveByBrowser(value: string, context: ?HTMLElement): string
{
	const host = context?.parentNode ?? document.body;

	if (!host)
	{
		return '';
	}

	// Asking CSS itself whether this is a color is the whole validation there is: what the
	// browser rejects, the map has no numbers for.
	if (!window.CSS?.supports('color', value))
	{
		return '';
	}

	const carrier = Dom.create('span', {
		style: {
			position: 'absolute',
			width: '0',
			height: '0',
			visibility: 'hidden',
			color: context ? Dom.style(context, 'color') : null,
		},
	});
	const probe = Dom.create('span', { style: { color: value } });

	Dom.append(probe, carrier);
	Dom.append(carrier, host);
	const computed = Dom.style(probe, 'color');
	Dom.remove(carrier);

	return computed;
}

// A modern color - color-mix(), oklch(), color() - is computed by the browser but never lowered
// to rgb() on the way out, so the notation reaches here as it was written. Painting one pixel
// with it is the browser converting the color to screen values itself. The price is eight bits
// per channel, which is the precision the map is drawn with anyway.
function readColorBack(value: string): MapColor | null
{
	if (!readbackContext)
	{
		const canvas = document.createElement('canvas');
		canvas.width = 1;
		canvas.height = 1;
		readbackContext = canvas.getContext('2d', { willReadFrequently: true });
	}

	if (!readbackContext)
	{
		return null;
	}

	readbackContext.fillStyle = READBACK_SENTINEL;
	readbackContext.fillStyle = value;

	if (readbackContext.fillStyle === READBACK_SENTINEL)
	{
		return null;
	}

	readbackContext.clearRect(0, 0, 1, 1);
	readbackContext.fillRect(0, 0, 1, 1);

	const pixel = readbackContext.getImageData(0, 0, 1, 1).data;

	return [pixel[0] / 255, pixel[1] / 255, pixel[2] / 255, pixel[3] / 255];
}

// Resolves a plain CSS color into four components in the 0..1 range. A value the browser does
// not accept as a color gives null, and the caller falls back to a color it can draw.
export function parseCssColor(value: string, context: ?HTMLElement = null): MapColor | null
{
	const trimmed = String(value ?? '').trim();

	if (trimmed === '')
	{
		return null;
	}

	const isCacheable = !CONTEXTUAL_COLOR_PATTERN.test(trimmed);

	if (isCacheable && resolvedColors.has(trimmed))
	{
		return resolvedColors.get(trimmed);
	}

	const computed = resolveByBrowser(trimmed, context);
	const color = computed === '' ? null : parseRgbNotation(computed) ?? readColorBack(computed);

	if (isCacheable)
	{
		resolvedColors.set(trimmed, color);
	}

	return color;
}

// Two triangles covering one rectangle. Every vertex carries the whole shape - center, half
// size, color, corner radius and outline width - so the fragment shader can build it with a
// signed distance field, and a rectangle costs no markup at all.
function writeRect(
	target: Float32Array,
	offset: number,
	rect: Rect,
	color: MapColor,
	radius: number,
	halfOutline: number,
	softness: number,
): number
{
	const halfWidth = Math.abs(rect.width) / 2;
	const halfHeight = Math.abs(rect.height) / 2;
	const centerX = rect.x + (rect.width / 2);
	const centerY = rect.y + (rect.height / 2);
	// The quad has to leave room for the outline and for the coverage ramp, otherwise the
	// shape is cut off by its own geometry.
	const padding = halfOutline + softness;
	const left = centerX - halfWidth - padding;
	const right = centerX + halfWidth + padding;
	const top = centerY - halfHeight - padding;
	const bottom = centerY + halfHeight + padding;

	const corners = [
		left, top,
		right, top,
		left, bottom,
		left, bottom,
		right, top,
		right, bottom,
	];

	let cursor = offset;

	for (let corner = 0; corner < VERTICES_PER_RECT; corner++)
	{
		target[cursor] = corners[corner * 2];
		target[cursor + 1] = corners[(corner * 2) + 1];
		target[cursor + 2] = centerX;
		target[cursor + 3] = centerY;
		target[cursor + 4] = halfWidth;
		target[cursor + 5] = halfHeight;
		target[cursor + 6] = color[0];
		target[cursor + 7] = color[1];
		target[cursor + 8] = color[2];
		target[cursor + 9] = color[3];
		target[cursor + 10] = radius;
		target[cursor + 11] = halfOutline;

		cursor += FLOATS_PER_VERTEX;
	}

	return cursor;
}

export class MapRenderer
{
	#element: HTMLCanvasElement | null = null;
	#gl: WebGLRenderingContext | null = null;
	#dpr: number = window.devicePixelRatio || 1;
	#edgeSoftness: number = EDGE_SOFTNESS_PX;

	#width: number = 0;
	#height: number = 0;

	#program: WebGLProgram | null = null;
	#vertexShader: WebGLShader | null = null;
	#fragmentShader: WebGLShader | null = null;
	#attributes = null;
	#uniforms = null;
	#vertexLayout = null;

	#blocksBuffer: WebGLBuffer | null = null;
	#blocksVertexCount: number = 0;
	#uploadedBlocks: Array<MapBlockRect> | null = null;
	#viewportBuffer: WebGLBuffer | null = null;
	// The frame of the current view is one rectangle and it goes up on every frame, so its
	// vertices live here instead of being allocated again for each of them.
	#viewportVertices: Float32Array = new Float32Array(VERTICES_PER_RECT * FLOATS_PER_VERTEX);

	#palette: MapPalette | null = null;
	#colors: MapColors | null = null;
	#frame: MapFrame | null = null;

	#resizeObserver: ResizeObserver | null = null;
	#pixelRatioQuery: MediaQueryList | null = null;
	#onPixelRatioChange: (() => void) | null = null;
	#onContextLost: ((event: Event) => void) | null = null;
	#onContextRestored: (() => void) | null = null;
	#isContextLost: boolean = false;

	// The context of the long-lived objects is part of the contract; the map renderer takes
	// nothing from it - both the geometry and the colors arrive from its owner.
	// eslint-disable-next-line no-unused-vars
	constructor(ctx: DiagramInstancesContext)
	{
		this.#edgeSoftness = EDGE_SOFTNESS_PX / this.#dpr;
	}

	get isAttached(): boolean
	{
		return this.#element !== null;
	}

	// Resolved theme colors. They belong to the renderer alone, so the geometry layer picks a
	// block color from these numbers instead of resolving the theme a second time.
	get colors(): MapColors | null
	{
		return this.#colors;
	}

	// A repeated attach is a race of the lifecycle, not a programming error: the same element
	// changes nothing, another one rebinds the renderer. Only an argument that cannot carry a
	// drawing context throws.
	attach(element: HTMLCanvasElement, palette: MapPalette | null = null): void
	{
		if (!Type.isFunction(element?.getContext))
		{
			throw new TypeError('ui.block-diagram: map renderer needs a canvas element to attach to');
		}

		if (this.#element === element)
		{
			return;
		}

		this.detach();

		const gl = element.getContext('webgl', {
			alpha: true,
			premultipliedAlpha: false,
			antialias: false,
		});

		// The map is drawn by the video card alone, so without a context it would be an empty
		// rectangle with nothing to diagnose it by. The attach does not happen at all: isAttached
		// keeps telling the truth and the owner can tell a blank map from a working one.
		if (!gl)
		{
			console.error('ui.block-diagram: no WebGL context for the map, the map is not drawn');

			return;
		}

		this.#element = element;
		this.#gl = gl;
		this.#palette = palette;

		this.#onContextLost = (event: Event): void => {
			// Without this the browser never restores the context.
			event.preventDefault();
			this.#handleContextLost();
		};
		this.#onContextRestored = (): void => this.#handleContextRestored();
		element.addEventListener('webglcontextlost', this.#onContextLost);
		element.addEventListener('webglcontextrestored', this.#onContextRestored);

		if (!this.#buildResources())
		{
			return;
		}

		this.#resolveColors();

		const { width, height } = element.getBoundingClientRect();
		this.#resize(width, height);

		this.#initResizeObserver();
		this.#watchPixelRatio();
	}

	// The other half of that contract: a caller that names the element it attached to leaves a
	// binding made by someone else alone. Without an element the current binding is dropped.
	detach(element: HTMLCanvasElement | null = null): void
	{
		if (!this.isAttached || (element !== null && this.#element !== element))
		{
			return;
		}

		this.#resizeObserver?.disconnect();
		this.#resizeObserver = null;
		this.#unwatchPixelRatio();

		this.#element.removeEventListener('webglcontextlost', this.#onContextLost);
		this.#element.removeEventListener('webglcontextrestored', this.#onContextRestored);
		this.#onContextLost = null;
		this.#onContextRestored = null;

		this.#releaseResources();

		// The drawing context must not outlive the element it was created on.
		this.#gl?.getExtension('WEBGL_lose_context')?.loseContext();
		this.#gl = null;

		this.#element = null;
		this.#palette = null;
		this.#colors = null;
		this.#frame = null;
		this.#isContextLost = false;
		this.#width = 0;
		this.#height = 0;
	}

	// The palette of the owner is not frozen at the attach: a consumer that changes the colors
	// of the blocks, or a theme that changes under the diagram, hands the new one over here and
	// the theme is read again.
	setPalette(palette: MapPalette | null): void
	{
		this.#palette = palette;
		this.#resolveColors();
	}

	// Reads the theme once and keeps the numbers until the next call. Palette entries that
	// resolve to nothing fall back to the default block color, and entries of the frame palette
	// to the default frame color: a frame whose color did not resolve has to stay a frame.
	#resolveColors(): void
	{
		if (!this.isAttached)
		{
			return;
		}

		const source = this.#palette ?? {};
		const style = window.getComputedStyle(this.#element);
		const resolve = (value: ?string, fallback: MapColor): MapColor => {
			return parseCssColor(resolveCssValue(style, value), this.#element) ?? fallback;
		};
		const block = resolve(source.block, UNRESOLVED_COLOR);
		const frame = resolve(source.frame, block);
		const palette = Object.create(null);
		const framePalette = Object.create(null);

		Object.keys(source.palette ?? {}).forEach((key: string) => {
			palette[key] = resolve(source.palette[key], block);
		});

		Object.keys(source.framePalette ?? {}).forEach((key: string) => {
			framePalette[key] = resolve(source.framePalette[key], frame);
		});

		this.#colors = {
			palette,
			framePalette,
			block,
			frame,
			viewport: resolve(source.viewport, block),
		};
	}

	// Draws one frame. The block buffer is rebuilt only when the blocks array is a different
	// array than the one drawn last: a gesture that moves the camera hands over the very same
	// array, so panning the map never pays for the geometry of the nodes.
	render(frame: MapFrame): void
	{
		if (!this.isAttached)
		{
			return;
		}

		this.#frame = frame;
		this.#draw();
	}

	// compileShader and createProgram throw, and a program that did not build leaves the
	// renderer bound to a context it cannot draw with: isAttached would keep saying yes while
	// every frame of a camera gesture reads colors that were never resolved. The binding is
	// rolled back the same way a missing drawing context rolls it back - an empty map with a
	// complaint in the console, and the drawing path of the editor stays alive.
	#buildResources(): boolean
	{
		try
		{
			this.#createResources();
		}
		catch (error)
		{
			console.error('ui.block-diagram: the shader program of the map did not build, the map is not drawn', error);
			this.detach();

			return false;
		}

		return true;
	}

	#createResources(): void
	{
		const gl = this.#gl;

		if (!gl)
		{
			return;
		}

		this.#vertexShader = compileShader(gl, mapShaders.vertexShader, gl.VERTEX_SHADER);
		this.#fragmentShader = compileShader(gl, mapShaders.fragmentShader, gl.FRAGMENT_SHADER);
		this.#program = createProgram(gl, this.#vertexShader, this.#fragmentShader);

		this.#attributes = {
			position: gl.getAttribLocation(this.#program, 'a_Position'),
			center: gl.getAttribLocation(this.#program, 'a_Center'),
			halfSize: gl.getAttribLocation(this.#program, 'a_HalfSize'),
			color: gl.getAttribLocation(this.#program, 'a_Color'),
			shape: gl.getAttribLocation(this.#program, 'a_Shape'),
		};
		this.#uniforms = {
			resolution: gl.getUniformLocation(this.#program, 'u_Resolution'),
			edgeSoftness: gl.getUniformLocation(this.#program, 'u_EdgeSoftness'),
		};
		this.#vertexLayout = VERTEX_ATTRIBUTES.map(([name, size, offset]) => [
			this.#attributes[name],
			size,
			offset * BYTES_PER_FLOAT,
		]);

		this.#blocksBuffer = gl.createBuffer();
		this.#viewportBuffer = gl.createBuffer();
		this.#blocksVertexCount = 0;
		this.#uploadedBlocks = null;

		// Frames come first because they are the background the blocks sit on, the same way the
		// canvas stacks them. Blending is on for another reason: blocks carry transparency. The
		// alpha channel is kept separate, so the element itself stays transparent where nothing
		// is drawn.
		gl.enable(gl.BLEND);
		gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
		gl.clearColor(0, 0, 0, 0);
	}

	#releaseResources(): void
	{
		const gl = this.#gl;

		if (gl && !this.#isContextLost)
		{
			gl.deleteBuffer(this.#blocksBuffer);
			gl.deleteBuffer(this.#viewportBuffer);
			gl.deleteProgram(this.#program);
			gl.deleteShader(this.#vertexShader);
			gl.deleteShader(this.#fragmentShader);
		}

		this.#blocksBuffer = null;
		this.#viewportBuffer = null;
		this.#blocksVertexCount = 0;
		this.#uploadedBlocks = null;
		this.#program = null;
		this.#vertexShader = null;
		this.#fragmentShader = null;
		this.#attributes = null;
		this.#uniforms = null;
		this.#vertexLayout = null;
	}

	#handleContextLost(): void
	{
		this.#isContextLost = true;
		this.#releaseResources();
	}

	#handleContextRestored(): void
	{
		this.#isContextLost = false;

		// A throw from a DOM event handler reaches no one at all, so the restore degrades the
		// same way the attach does.
		if (!this.#buildResources())
		{
			return;
		}

		this.#applyDrawingBufferSize();
		this.#draw();
	}

	#initResizeObserver(): void
	{
		this.#resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries)
			{
				this.#resize(entry.contentRect.width, entry.contentRect.height);
			}
		});

		this.#resizeObserver.observe(this.#element);
	}

	// The pixel density is not a constant of the page: browser zoom and a move to a screen of
	// another density change it while the logical size of the map stays the same, so the resize
	// observer never hears about it. A media query on the current density is the only event the
	// browser gives for that, and it only ever matches one value - hence the re-arming.
	#watchPixelRatio(): void
	{
		this.#unwatchPixelRatio();

		if (!window.matchMedia)
		{
			return;
		}

		this.#onPixelRatioChange = (): void => {
			if (!this.isAttached)
			{
				return;
			}

			this.#resize(this.#width, this.#height);
			this.#watchPixelRatio();
		};

		this.#pixelRatioQuery = window.matchMedia(`(resolution: ${this.#dpr}dppx)`);
		this.#pixelRatioQuery.addEventListener('change', this.#onPixelRatioChange);
	}

	#unwatchPixelRatio(): void
	{
		this.#pixelRatioQuery?.removeEventListener('change', this.#onPixelRatioChange);
		this.#pixelRatioQuery = null;
		this.#onPixelRatioChange = null;
	}

	#syncPixelRatio(): void
	{
		const ratio = window.devicePixelRatio || 1;

		if (ratio === this.#dpr)
		{
			return;
		}

		this.#dpr = ratio;
		this.#edgeSoftness = EDGE_SOFTNESS_PX / ratio;
		// The coverage ramp is built into the quads of the blocks, so they have to go up again.
		this.#uploadedBlocks = null;
	}

	// The element is measured in logical pixels and the drawing buffer is sized in physical
	// ones; the geometry of the map stays logical, so the ratio lives in the buffer alone.
	#resize(width: number, height: number): void
	{
		this.#syncPixelRatio();
		this.#width = width;
		this.#height = height;
		this.#element.width = Math.round(width * this.#dpr);
		this.#element.height = Math.round(height * this.#dpr);

		this.#applyDrawingBufferSize();
		this.#draw();
	}

	#applyDrawingBufferSize(): void
	{
		this.#gl?.viewport(0, 0, this.#element.width, this.#element.height);
	}

	#draw(): void
	{
		const gl = this.#gl;

		if (!gl || this.#isContextLost || !this.#program || this.#width <= 0 || this.#height <= 0)
		{
			return;
		}

		gl.clear(gl.COLOR_BUFFER_BIT);

		const frame = this.#frame;

		if (!frame)
		{
			return;
		}

		gl.useProgram(this.#program);
		gl.uniform2f(this.#uniforms.resolution, this.#width, this.#height);
		gl.uniform1f(this.#uniforms.edgeSoftness, this.#edgeSoftness);

		if (frame.blocks !== this.#uploadedBlocks)
		{
			this.#uploadBlocks(frame.blocks);
		}

		this.#drawBuffer(this.#blocksBuffer, this.#blocksVertexCount);

		if (frame.viewport)
		{
			this.#uploadViewport(frame.viewport, frame.viewportColor);
			this.#drawBuffer(this.#viewportBuffer, VERTICES_PER_RECT);
		}
	}

	#uploadBlocks(blocks: Array<MapBlockRect>): void
	{
		const gl = this.#gl;
		const rects = Array.isArray(blocks) ? blocks : [];
		const data = new Float32Array(rects.length * VERTICES_PER_RECT * FLOATS_PER_VERTEX);
		let cursor = 0;

		rects.forEach((rect: MapBlockRect) => {
			cursor = writeRect(
				data,
				cursor,
				rect,
				rect.color ?? this.#colors?.block ?? UNRESOLVED_COLOR,
				MAP_BLOCK_CORNER_RADIUS,
				0,
				this.#edgeSoftness,
			);
		});

		gl.bindBuffer(gl.ARRAY_BUFFER, this.#blocksBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

		this.#blocksVertexCount = rects.length * VERTICES_PER_RECT;
		this.#uploadedBlocks = blocks;
	}

	#uploadViewport(viewport: Rect, color: ?MapColor): void
	{
		const gl = this.#gl;
		const data = this.#viewportVertices;

		writeRect(
			data,
			0,
			viewport,
			color ?? this.#colors?.viewport ?? UNRESOLVED_COLOR,
			MAP_VIEWPORT_CORNER_RADIUS,
			MAP_VIEWPORT_OUTLINE_WIDTH / 2,
			this.#edgeSoftness,
		);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.#viewportBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
	}

	// Blocks and the frame of the view share one program and one vertex layout: whatever the
	// number of nodes, the map is a couple of draw calls rather than a node's worth of markup.
	#drawBuffer(buffer: WebGLBuffer, vertexCount: number): void
	{
		if (vertexCount <= 0)
		{
			return;
		}

		const gl = this.#gl;

		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

		this.#vertexLayout.forEach(([location, size, offset]) => {
			gl.enableVertexAttribArray(location);
			gl.vertexAttribPointer(location, size, gl.FLOAT, false, VERTEX_STRIDE, offset);
		});

		gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
	}
}
