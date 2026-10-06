import { gridShaders } from './shaders';
import {
	compileShader,
	createProgram,
	createBufferFromTypedArray,
	convHex,
} from './helpers';
import { GRID_SUBDIVISION } from '../snap-to-grid';
import type { CanvasStyleZoomStep } from '../../composables';

export type GridOptions = {
	size: number,
	gridColor: string,
	backgroundColor: string,
	zoomSteps?: Array<CanvasStyleZoomStep>,
};

export const GRID_DEFAULT_SIZE: number = 64;

// Default ladder of discrete cell sizes. Adjacent sizes must be integer multiples
// of each other so coarse grid lines stay a subset of the finer level - otherwise
// the cross-fade shows duplicated lines. The step above 1.0 keeps the grid
// detailing on zoom in: the cross-fade runs in the 0.99 - 2 band, above zoom 2 a
// single level stays.
// The finest level equals the snap step, so a snapped block lands on a line the
// canvas actually draws instead of somewhere between two of them.
export const GRID_DEFAULT_ZOOM_STEPS: Array<CanvasStyleZoomStep> = [
	{ zoom: 2, size: GRID_DEFAULT_SIZE / GRID_SUBDIVISION },
	{ zoom: 0.99, size: GRID_DEFAULT_SIZE },
	{ zoom: 0.5, size: GRID_DEFAULT_SIZE * 5 },
	{ zoom: 0.25, size: GRID_DEFAULT_SIZE * 25 },
	{ zoom: 0.125, size: GRID_DEFAULT_SIZE * 125 },
];

export type GridLevel = {
	zoom: number,
	size: number,
	gridColor: Array<number>,
};

// A level of the built ladder. Keeps the logarithm of its threshold: blending is
// logarithmic and render runs every frame, while the thresholds never change.
export type GridLadderLevel = {
	zoom: number,
	logZoom: number,
	size: number,
	gridColor: Array<number>,
};

export type GridBlendState = {
	coarse: GridLadderLevel,
	fine: GridLadderLevel,
	blend: number,
};

// Normalizes the public canvasStyle zoom steps into levels sorted by zoom
// descending, filling omitted size and color from the base grid options.
// An empty ladder is a supported configuration: it degrades to a single base
// level instead of leaving the grid without any level to render.
export function prepareZoomSteps(
	zoomSteps: Array<CanvasStyleZoomStep>,
	base: GridLevel,
): Array<GridLevel>
{
	if (!Array.isArray(zoomSteps) || zoomSteps.length === 0)
	{
		return [base];
	}

	return [...zoomSteps]
		.sort((stepA, stepB) => stepB.zoom - stepA.zoom)
		.map((step) => ({
			zoom: step.zoom,
			size: 'size' in step
				? step.size
				: base.size,
			gridColor: 'gridColor' in step
				? convHex(step.gridColor)
				: base.gridColor,
		}));
}

// Names the adjacent sizes that break the cross-fade contract: a coarse level is
// drawn on top of a finer one, so its lines must coincide with the finer grid,
// which holds only while the sizes are integer multiples.
export function findNonMultipleLevels(levels: Array<GridLadderLevel>): Array<[number, number]>
{
	const broken = [];

	for (let i = 1; i < levels.length; i++)
	{
		const ratio = levels[i].size / levels[i - 1].size;
		if (Math.abs(ratio - Math.round(ratio)) > 1e-9)
		{
			broken.push([levels[i].size, levels[i - 1].size]);
		}
	}

	return broken;
}

// Collapses zoom steps that share a discrete cell size into a single level and
// keeps the lowest zoom threshold - the boundary at which that size takes over.
// Steps of one size may declare different colors; the collapsed level keeps the
// first one, since a single size is a single visual level.
// The input must be sorted by zoom descending.
export function buildGridLevels(steps: Array<GridLevel>): Array<GridLadderLevel>
{
	const levels = [];

	for (const step of steps)
	{
		const previous = levels[levels.length - 1];
		if (previous && previous.size === step.size)
		{
			previous.zoom = step.zoom;
			previous.logZoom = Math.log(step.zoom);
			continue;
		}

		levels.push({
			zoom: step.zoom,
			logZoom: Math.log(step.zoom),
			size: step.size,
			gridColor: step.gridColor,
		});
	}

	const broken = findNonMultipleLevels(levels);
	if (broken.length > 0)
	{
		console.error(
			'Invalid canvasStyle.zoomSteps: adjacent grid sizes are not integer multiples, '
			+ 'the grid will show duplicated lines while they cross-fade',
			broken.map(([coarse, fine]) => `${coarse} / ${fine}`).join(', '),
		);
	}

	return levels;
}

// Position of zoom between the coarse (logLo) and fine (logHi) thresholds on a
// logarithmic scale, since the thresholds form a geometric progression.
// Thresholds come in as logarithms - they are precomputed with the ladder, so a
// frame only pays for the logarithm of the current zoom.
// Returns 0 at logLo (fully coarse) and 1 at logHi (fully fine).
export function getBlendFactor(logZoom: number, logLo: number, logHi: number): number
{
	const t = (logZoom - logLo) / (logHi - logLo);
	// Coinciding thresholds divide by zero, a zero threshold gives -Infinity;
	// either way the levels are effectively merged - show the fine one instead of
	// letting NaN reach the shader alpha.
	if (!Number.isFinite(t))
	{
		return 1;
	}

	return Math.min(Math.max(t, 0), 1);
}

// Picks the two adjacent discrete levels around the current zoom together with
// the blend factor between them. blend === 1 shows only the fine (smaller) level,
// blend === 0 only the coarse (larger) one. Beyond the outermost thresholds it
// degrades to a single level with a stable blend, so there is no jump.
export function getGridBlendState(levels: Array<GridLadderLevel>, zoom: number): GridBlendState
{
	const coarseIndex = levels.findIndex((level) => level.zoom <= zoom);
	if (coarseIndex === -1)
	{
		const coarsest = levels[levels.length - 1];

		return { coarse: coarsest, fine: coarsest, blend: 0 };
	}

	const coarse = levels[coarseIndex];
	if (coarseIndex === 0)
	{
		return { coarse, fine: coarse, blend: 1 };
	}

	const fine = levels[coarseIndex - 1];

	return { coarse, fine, blend: getBlendFactor(Math.log(zoom), coarse.logZoom, fine.logZoom) };
}

export class Grid
{
	#gl: WebGLRenderingContext;
	#program: WebGLProgram | null = null;
	#positionAttributeLocation: number | null = null;

	#vertexShader: WebGLShader | null = null;
	#fragmentShader: WebGLShader | null = null;

	#projectionMatrixLink: WebGLUniformLocation | null = null;
	#viewMatrixLink: WebGLUniformLocation | null = null;
	#viewProjectionInvMatrixLink: WebGLUniformLocation | null = null;

	#backgroundColorLink: WebGLUniformLocation | null = null;
	#backgroundColor = null;

	#coarseColorLink: WebGLUniformLocation | null = null;
	#fineColorLink: WebGLUniformLocation | null = null;
	#gridColor: Array<number> = [];

	#coarseSizeLink: WebGLUniformLocation | null = null;
	#fineSizeLink: WebGLUniformLocation | null = null;
	#blendLink: WebGLUniformLocation | null = null;

	#gridSize = null;

	#gridPosition: Array<number> = [
		-1, -1,
		-1, 1,
		1, -1,
		1, 1,
	];

	#gridPositionBuffer: WebGLBuffer | null = null;

	#gridLevels: Array<GridLadderLevel> = [];

	constructor(canvas: HTMLElementCanvas, options: GridOptions)
	{
		this.#initParams(options);
		this.#initGrid(canvas);
	}

	#initGrid(canvas): void
	{
		this.#gl = canvas.getContext('webgl');
		this.#gl.getExtension('OES_standard_derivatives');
		this.#gl.viewport(0, 0, this.#gl.canvas.width, this.#gl.canvas.height);

		this.#vertexShader = compileShader(
			this.#gl,
			gridShaders.vertexShader,
			this.#gl.VERTEX_SHADER,
		);
		this.#fragmentShader = compileShader(
			this.#gl,
			gridShaders.fragmentShader,
			this.#gl.FRAGMENT_SHADER,
		);
		this.#program = createProgram(
			this.#gl,
			this.#vertexShader,
			this.#fragmentShader,
		);
		this.#positionAttributeLocation = this.#gl.getAttribLocation(
			this.#program,
			'a_Position',
		);
		this.#projectionMatrixLink = this.#gl.getUniformLocation(
			this.#program,
			'u_ProjectionMatrix',
		);
		this.#viewMatrixLink = this.#gl.getUniformLocation(
			this.#program,
			'u_ViewMatrix',
		);
		this.#viewProjectionInvMatrixLink = this.#gl.getUniformLocation(
			this.#program,
			'u_ViewProjectionInvMatrix',
		);
		this.#backgroundColorLink = this.#gl.getUniformLocation(
			this.#program,
			'u_BackgroundColor',
		);
		this.#coarseColorLink = this.#gl.getUniformLocation(
			this.#program,
			'u_CoarseColor',
		);
		this.#fineColorLink = this.#gl.getUniformLocation(
			this.#program,
			'u_FineColor',
		);
		this.#coarseSizeLink = this.#gl.getUniformLocation(
			this.#program,
			'u_CoarseSize',
		);
		this.#fineSizeLink = this.#gl.getUniformLocation(
			this.#program,
			'u_FineSize',
		);
		this.#blendLink = this.#gl.getUniformLocation(
			this.#program,
			'u_Blend',
		);
		this.#gridPositionBuffer = createBufferFromTypedArray(
			this.#gl,
			new Float32Array(this.#gridPosition),
		);
	}

	#initParams(options)
	{
		const {
			size,
			gridColor,
			backgroundColor,
			zoomSteps,
		} = options;

		this.#gridSize = size;
		this.#gridColor = convHex(gridColor);
		this.#backgroundColor = new Float32Array(convHex(backgroundColor));
		this.#gridLevels = buildGridLevels(prepareZoomSteps(zoomSteps, {
			zoom: 0,
			size: this.#gridSize,
			gridColor: this.#gridColor,
		}));
	}

	render({
		projectionMatrix,
		viewMatrix,
		viewProjectionMatrixInv,
		zoomScale,
	}): void
	{
		this.#gl.clearColor(1, 1, 1, 1);
		this.#gl.clear(this.#gl.COLOR_BUFFER_BIT);
		this.#gl.useProgram(this.#program);

		const { coarse, fine, blend } = getGridBlendState(this.#gridLevels, zoomScale);

		this.#gl.uniformMatrix3fv(
			this.#projectionMatrixLink,
			false,
			projectionMatrix,
		);
		this.#gl.uniformMatrix3fv(
			this.#viewMatrixLink,
			false,
			viewMatrix,
		);
		this.#gl.uniformMatrix3fv(
			this.#viewProjectionInvMatrixLink,
			false,
			viewProjectionMatrixInv,
		);
		this.#gl.uniform4f(
			this.#backgroundColorLink,
			...this.#backgroundColor,
			1,
		);
		this.#gl.uniform4f(
			this.#coarseColorLink,
			...coarse.gridColor,
			1,
		);
		this.#gl.uniform4f(
			this.#fineColorLink,
			...fine.gridColor,
			1,
		);
		this.#gl.uniform1f(
			this.#coarseSizeLink,
			coarse.size,
		);
		this.#gl.uniform1f(
			this.#fineSizeLink,
			fine.size,
		);
		this.#gl.uniform1f(
			this.#blendLink,
			blend,
		);

		this.#gl.enableVertexAttribArray(this.#positionAttributeLocation);
		this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, this.#gridPositionBuffer);

		this.#gl.vertexAttribPointer(
			this.#positionAttributeLocation,
			2,
			this.#gl.FLOAT,
			false,
			0,
			0,
		);

		this.#gl.drawArrays(
			this.#gl.TRIANGLE_STRIP,
			0,
			4,
		);
	}

	destroy(): void
	{
		this.#gl.deleteProgram(this.#program);
		this.#gl.deleteShader(this.#vertexShader);
		this.#gl.deleteShader(this.#fragmentShader);
	}
}
