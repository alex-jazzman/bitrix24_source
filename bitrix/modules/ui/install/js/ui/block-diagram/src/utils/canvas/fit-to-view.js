import { Type } from 'main.core';
import { toValue } from 'ui.vue3';

import { getSelectionBlockSize, getUsablePosition, type BlockSize } from '../block-geometry';
import { GRID_DEFAULT_SIZE } from './grid';
import {
	type DiagramBlock,
	type DiagramViewportInsets,
	type FitToViewParams,
	type Point,
} from '../../types';

export type DiagramBounds = {
	minX: number,
	minY: number,
	maxX: number,
	maxY: number,
	width: number,
	height: number,
};

// What the caller of the fit brings: the box of the scheme plus the optional settings of the
// command. The size of the viewport is not among them - it belongs to the canvas.
export type FitToViewRequest = {
	...FitToViewParams,
	bounds: DiagramBounds | null,
};

export type FitToViewOptions = {
	...FitToViewRequest,
	viewportWidth: number,
	viewportHeight: number,
};

/**
 * Where the overview has to end up: the canvas point `center` stands at the viewport pixel
 * `viewportPoint` at scale `zoom`. The camera position is derived from it rather than carried in
 * it, so a caller whose camera clamped the scale places the content by the scale it actually took.
 */
export type FitToViewTarget = {
	zoom: number,
	center: Point,
	viewportPoint: Point,
};

// The overview is not enlarged past the natural size of the scheme: a single small node blown up
// to the whole screen reads as a breakage rather than as a fit.
export const NATURAL_ZOOM = 1;

// The size the geometry of the group frame gives a node the model says nothing about.
const DEFAULT_BLOCK_SIZE: BlockSize = { width: 150, height: 100 };

const NO_INSETS: DiagramViewportInsets = { top: 0, right: 0, bottom: 0, left: 0 };

function isUsableSize(value: number): boolean
{
	return Number.isFinite(value) && value > 0;
}

function toFiniteNumber(value: mixed): number
{
	const number = Number(value);

	return Number.isFinite(number) ? number : 0;
}

// Insets come from a consumer that redraws its panels while the diagram stays mounted, so an
// absent or half-filled set of edges is an ordinary input, not a programming error.
function resolveInsets(insets: ?DiagramViewportInsets): DiagramViewportInsets
{
	const source = toValue(insets);

	if (!Type.isObjectLike(source))
	{
		return NO_INSETS;
	}

	return {
		top: toFiniteNumber(source.top),
		right: toFiniteNumber(source.right),
		bottom: toFiniteNumber(source.bottom),
		left: toFiniteNumber(source.left),
	};
}

/**
 * Bounding box of the whole scheme in canvas coordinates. The source is the model of the scheme:
 * under the render optimization the nodes outside the screen are not mounted and have no measured
 * geometry at all, so a box built from the measured rectangles alone would cover the visible part
 * only. Connections stay out of it - their route is derived from the nodes. A node whose position
 * or size is unusable is left out, by the same rules the group frame follows.
 */
export function getDiagramBounds(
	blocks: Array<DiagramBlock>,
	blocksRectMap: Object = {},
	defaultBlockSize: BlockSize = DEFAULT_BLOCK_SIZE,
): DiagramBounds | null
{
	const list = toValue(blocks);

	if (!Type.isArray(list))
	{
		return null;
	}

	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	let hasBlocks = false;

	list.forEach((block: DiagramBlock) => {
		const position = getUsablePosition(block);

		if (position === null)
		{
			return;
		}

		const size = getSelectionBlockSize(block, blocksRectMap, defaultBlockSize);
		const width = Number(size.width);
		const height = Number(size.height);

		// A node sized by a broken model value would spread that value over the whole box.
		if (!isUsableSize(width) || !isUsableSize(height))
		{
			return;
		}

		hasBlocks = true;

		minX = Math.min(minX, position.x);
		minY = Math.min(minY, position.y);
		maxX = Math.max(maxX, position.x + width);
		maxY = Math.max(maxY, position.y + height);
	});

	if (!hasBlocks)
	{
		return null;
	}

	return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/**
 * Target overview for the whole scheme: the largest scale at which the box still fits the free
 * part of the viewport, and the point of that part the box is centred on. The free part is what
 * the viewport keeps after the edges the panels of the consumer cover and a margin along every
 * side. An empty scheme returns the starting overview of the editor - the natural scale with the
 * origin of the scheme in the middle of the free part - and a free part that has no room left
 * returns nothing at all, so the overview stays where the person put it.
 *
 * The scale is not bounded from below here: the camera owns the bounds of the scale and applies
 * them on every path.
 */
export function getFitToViewTarget(options: FitToViewOptions): FitToViewTarget | null
{
	const {
		bounds = null,
		viewportWidth = 0,
		viewportHeight = 0,
		insets,
		padding = GRID_DEFAULT_SIZE,
		maxFitZoom = NATURAL_ZOOM,
	} = options ?? {};

	const edges = resolveInsets(insets);
	const margin = Math.max(toFiniteNumber(padding), 0);
	const viewWidth = toFiniteNumber(viewportWidth);
	const viewHeight = toFiniteNumber(viewportHeight);

	const freeWidth = viewWidth - edges.left - edges.right - (2 * margin);
	const freeHeight = viewHeight - edges.top - edges.bottom - (2 * margin);

	// An unmounted canvas and panels wider than the canvas itself come out the same way: there is
	// no area to fit anything into, so the overview is left alone.
	if (freeWidth <= 0 || freeHeight <= 0)
	{
		return null;
	}

	// The margin drops out of the centre of the free area: it is the same on both sides.
	const freeCenter: Point = {
		x: (viewWidth + edges.left - edges.right) / 2,
		y: (viewHeight + edges.top - edges.bottom) / 2,
	};

	if (bounds === null)
	{
		return { zoom: NATURAL_ZOOM, center: { x: 0, y: 0 }, viewportPoint: freeCenter };
	}

	const scaleX = freeWidth / bounds.width;
	const scaleY = freeHeight / bounds.height;
	const zoom = Math.min(scaleX, scaleY, maxFitZoom);

	return {
		zoom,
		center: {
			x: bounds.minX + (bounds.width / 2),
			y: bounds.minY + (bounds.height / 2),
		},
		viewportPoint: freeCenter,
	};
}

// Camera position the target asks for at the given scale: a viewport pixel is that many canvas
// units away from the origin of the camera.
export function getFitCameraPosition(target: FitToViewTarget, zoom: number): Point
{
	return {
		x: target.center.x - (target.viewportPoint.x / zoom),
		y: target.center.y - (target.viewportPoint.y / zoom),
	};
}
