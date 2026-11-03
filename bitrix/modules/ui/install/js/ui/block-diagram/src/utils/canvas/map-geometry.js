import type {
	DiagramBlock,
	DiagramBlockDimensions,
	DiagramBlockId,
	Point,
	Rect,
} from '../../types';

// Color with alpha, components in the 0..1 range - the form the map renderer draws with.
export type MapColor = Array<number>;

export type MapColors = {
	palette: { [string]: MapColor },
	framePalette: { [string]: MapColor },
	block: MapColor,
	frame: MapColor,
	viewport: MapColor,
};

// A block as the map draws it: a snapshot of the few values the drawing path reads, and
// nothing else. Keeping the block itself here would subscribe the layout to every property
// of every node, and selecting a node or changing its status would rebuild the whole map.
export type MapRenderBlock = {
	position: Point,
	node: { type: ?string, colorIndex: ?number, frameColorName: ?string },
	dimensions: DiagramBlockDimensions,
};

export type MapLayout = {
	sortedBlocks: Array<MapRenderBlock>,
	minX: number,
	minY: number,
	width: number,
	height: number,
};

export type MapBlockRect = {
	...Rect,
	color: MapColor,
};

export type MapCamera = {
	x: number,
	y: number,
	zoom: number,
	canvasWidth: number,
	canvasHeight: number,
};

export type MapLayoutSource = {
	canvasWidth: number,
	canvasHeight: number,
	blocksRectMap: { [DiagramBlockId]: DiagramBlockDimensions },
};

export const MAP_PADDING: number = 50;
export const MAP_FRAME_BLOCK_TYPE: string = 'frame';

// Extent of an empty map: twice the canvas, so the viewport frame takes a quarter of it and
// the camera still has room to move around the origin.
export const MAP_EMPTY_EXTENT: number = 1000;

export const MAP_BLOCK_FALLBACK_WIDTH: number = 200;
export const MAP_BLOCK_FALLBACK_HEIGHT: number = 50;

// Size of a block on the map: its own dimensions while they are known, the measured rect
// otherwise. A half-known pair counts as unknown - a block with a width but no height has
// never been measured as a whole.
export function getMapBlockSize(
	block: DiagramBlock,
	blocksRectMap: { [DiagramBlockId]: DiagramBlockDimensions } = {},
): DiagramBlockDimensions
{
	const dimensions = {
		width: block?.dimensions?.width,
		height: block?.dimensions?.height,
	};

	if (!dimensions.width || !dimensions.height)
	{
		const measured = blocksRectMap?.[block?.id] ?? {};

		dimensions.width = measured.width ?? MAP_BLOCK_FALLBACK_WIDTH;
		dimensions.height = measured.height ?? MAP_BLOCK_FALLBACK_HEIGHT;
	}

	return dimensions;
}

// Bounding box of every block plus a padding, and the drawing order: frames first, because
// their fill colors are opaque and a frame is the background under the nodes it groups, the
// same way it lies on the canvas.
export function getMapLayout(blocks: Array<DiagramBlock>, source: MapLayoutSource): MapLayout
{
	const { canvasWidth, canvasHeight, blocksRectMap } = source;

	if (!Array.isArray(blocks) || blocks.length === 0)
	{
		return {
			sortedBlocks: [],
			minX: 0,
			minY: 0,
			width: canvasWidth ? 2 * canvasWidth : MAP_EMPTY_EXTENT,
			height: canvasHeight ? 2 * canvasHeight : MAP_EMPTY_EXTENT,
		};
	}

	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;

	const frames = [];
	const content = [];

	blocks.forEach((block: DiagramBlock) => {
		const { x, y } = block.position;
		const { width, height } = getMapBlockSize(block, blocksRectMap);

		minX = Math.min(minX, x);
		minY = Math.min(minY, y);
		maxX = Math.max(maxX, x + width);
		maxY = Math.max(maxY, y + height);

		const renderBlock = {
			position: { x, y },
			node: {
				type: block?.node?.type,
				colorIndex: block?.node?.colorIndex,
				frameColorName: block?.node?.frameColorName,
			},
			dimensions: { width, height },
		};

		if (block?.type === MAP_FRAME_BLOCK_TYPE)
		{
			frames.push(renderBlock);
		}
		else
		{
			content.push(renderBlock);
		}
	});

	return {
		sortedBlocks: [
			...frames,
			...content,
		],
		minX: minX - MAP_PADDING,
		minY: minY - MAP_PADDING,
		width: (maxX + MAP_PADDING) - (minX - MAP_PADDING),
		height: (maxY + MAP_PADDING) - (minY - MAP_PADDING),
	};
}

// Scale that fits the whole layout into the map: the smaller of the two axis ratios, so
// nothing is cropped. A degenerate layout keeps the map at 1:1 instead of dividing by zero.
export function getMapScale(layout: MapLayout, size: { width: number, height: number }): number
{
	const { width, height } = layout;

	if (width <= 0 || height <= 0)
	{
		return 1;
	}

	return Math.min(size.width / width, size.height / height);
}

// Palettes are indexed by a name or an index taken from a saved template, so only own keys
// count as a color: a member inherited from Object.prototype is truthy, slips past the
// fallback and reaches the drawing path as something that is not a color.
function getOwnColor(palette: { [string]: MapColor }, key: ?(string | number)): ?MapColor
{
	return Object.hasOwn(palette, key) ? palette[key] : null;
}

// Color of a block on the map. Note the two different type checks: the drawing order groups
// by the block type, while the color is picked by the type of the node behind the block. The
// consumer fills both from one value, and the map leans on that: the frame fill is opaque, so a
// block whose node is a frame while its block type is not takes the color of a background and is
// still drawn among the content, covering the blocks under it instead of lying beneath them.
export function getMapBlockColor(block: ?MapRenderBlock, colors: MapColors): MapColor
{
	const blockType = block?.node?.type;
	const colorIndex = block?.node?.colorIndex;

	if (blockType === MAP_FRAME_BLOCK_TYPE)
	{
		const framePalette = colors.framePalette ?? {};

		return getOwnColor(framePalette, block?.node?.frameColorName) || colors.frame;
	}

	if (colorIndex === null || colorIndex === false)
	{
		return colors.block;
	}

	const palette = colors.palette ?? {};

	return getOwnColor(palette, colorIndex) || colors.block;
}

// Blocks of the layout as map rectangles, in drawing order.
export function getMapBlockRects(
	layout: MapLayout,
	scale: number,
	colors: MapColors,
): Array<MapBlockRect>
{
	return layout.sortedBlocks.map((block: MapRenderBlock) => ({
		x: (block.position.x - layout.minX) * scale,
		y: (block.position.y - layout.minY) * scale,
		width: block.dimensions.width * scale,
		height: block.dimensions.height * scale,
		color: getMapBlockColor(block, colors),
	}));
}

// Frame of the current view on the map: the canvas seen through the camera, in map pixels.
export function getMapViewportRect(layout: MapLayout, scale: number, camera: MapCamera): Rect
{
	return {
		x: (camera.x - layout.minX) * scale,
		y: (camera.y - layout.minY) * scale,
		width: camera.canvasWidth * scale / camera.zoom,
		height: camera.canvasHeight * scale / camera.zoom,
	};
}

// Edges belong to the rectangle: a press exactly on the frame border grabs the frame.
export function isPointInMapRect(point: Point, rect: Rect): boolean
{
	return (
		point.x >= rect.x
		&& point.x <= rect.x + rect.width
		&& point.y >= rect.y
		&& point.y <= rect.y + rect.height
	);
}
