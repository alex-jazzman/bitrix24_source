import './canvas-map.css';
import { Type } from 'main.core';
import { toValue, computed, toRefs, useTemplateRef, reactive } from 'ui.vue3';
import { useBlockDiagram, useCanvas } from '../../composables';
import type { DiagramBlock } from '../../types';

type ViewportIndicatorRect = {
	x: number;
	y: number;
	width: number;
	height: number;
}

type CanvasMapSetup = {
	mapWidth: number;
	mapHeight: number;
	sortedBlocks: Array<DiagramBlock>,
	canvasMapStyle: { [string]: string };
	contentOffsetX: number;
	contentOffsetY: number;
	renderScale: number;
	viewportIndicator: ViewportIndicatorRect;
	onMapMouseDown: (event: MouseEvent) => void;
	onMapMouseMove: (event: MouseEvent) => void;
	onMapMouseUp: (event: MouseEvent) => void;
	getBlockColor: (block: ?DiagramBlock) => string;
};

const MAP_PADDING: number = 50;

const DEFAULT_BLOCK_COLOR = 'var(--ui-color-palette-gray-15)';
const DEFAULT_FRAME_BLOCK_COLOR = 'rgba(0,0,0,0.05)';
const FRAME_BLOCK_TYPE = 'frame';
const INTERACTION_STATE_MODES = {
	CURSOR: 'cursor',
	MAP: 'map',
};

// @vue/component
export const CanvasMap = {
	name: 'canvas-map',
	props: {
		mapWidth: {
			type: Number,
			default: 310,
		},
		mapHeight: {
			type: Number,
			default: 183,
		},
		blockColors: {
			type: Object,
			default: () => {},
		},
	},
	// eslint-disable-next-line max-lines-per-function
	setup(props, { emit }): CanvasMapSetup
	{
		const {
			blocks,
			canvasWidth,
			canvasHeight,
			transformX,
			transformY,
			zoom,
		} = useBlockDiagram();
		const { setCamera } = useCanvas();
		const { mapWidth, mapHeight, blockColors } = toRefs(props);
		const mapEl = useTemplateRef('map');

		const interactionState = reactive({
			isDragging: false,
			mode: null,
			dragOffsetX: 0,
			dragOffsetY: 0,
			mapRect: null,
		});

		const canvasMapStyle = computed((): { [string]: string } => ({
			width: `${toValue(mapWidth)}px`,
			height: `${toValue(mapHeight)}px`,
		}));

		const layoutData = computed(() => {
			const items = toValue(blocks);

			if (!Type.isArrayFilled(items))
			{
				const cWidth = toValue(canvasWidth);
				const cHeight = toValue(canvasHeight);

				return {
					sortedBlocks: [],
					minX: 0,
					minY: 0,
					width: cWidth ? 2 * cWidth : 1000,
					height: cHeight ? 2 * cHeight : 1000,
				};
			}

			let minX = Infinity;
			let minY = Infinity;
			let maxX = -Infinity;
			let maxY = -Infinity;

			const frames = [];
			const content = [];

			items.forEach((block: DiagramBlock) => {
				const { x, y } = block.position;
				const { width, height } = block.dimensions;

				minX = Math.min(minX, x);
				minY = Math.min(minY, y);
				maxX = Math.max(maxX, x + width);
				maxY = Math.max(maxY, y + height);

				if (block?.type === FRAME_BLOCK_TYPE)
				{
					frames.push(block);
				}
				else
				{
					content.push(block);
				}
			});

			return {
				sortedBlocks: [
					...content,
					...frames,
				],
				minX: minX - MAP_PADDING,
				minY: minY - MAP_PADDING,
				width: (maxX + MAP_PADDING) - (minX - MAP_PADDING),
				height: (maxY + MAP_PADDING) - (minY - MAP_PADDING),
			};
		});

		const sortedBlocks = computed(() => toValue(layoutData).sortedBlocks);
		const contentOffsetX = computed(() => toValue(layoutData).minX);
		const contentOffsetY = computed(() => toValue(layoutData).minY);

		const renderScale = computed((): number => {
			const { width, height } = toValue(layoutData);

			if (width <= 0 || height <= 0)
			{
				return 1;
			}

			return Math.min(
				toValue(mapWidth) / width,
				toValue(mapHeight) / height,
			);
		});

		const viewportIndicator = computed((): ViewportIndicatorRect => {
			const scale = toValue(renderScale);
			const currentZoom = toValue(zoom);

			const width = toValue(canvasWidth) * scale / currentZoom;
			const height = toValue(canvasHeight) * scale / currentZoom;

			const x = (toValue(transformX) - toValue(contentOffsetX)) * scale;
			const y = (toValue(transformY) - toValue(contentOffsetY)) * scale;

			return { x, y, width, height };
		});

		function isPointInViewport(x: number, y: number): boolean
		{
			const indicator = toValue(viewportIndicator);

			return (
				x >= indicator.x
				&& x <= indicator.x + indicator.width
				&& y >= indicator.y
				&& y <= indicator.y + indicator.height
			);
		}

		function updateCamera(clientX: number, clientY: number): void
		{
			if (!interactionState.mapRect)
			{
				return;
			}

			const mouseRelX = clientX - interactionState.mapRect.left;
			const mouseRelY = clientY - interactionState.mapRect.top;

			const indicator = toValue(viewportIndicator);
			const scale = toValue(renderScale);
			const currentZoom = toValue(zoom);

			let targetMapX = mouseRelX - indicator.width;
			let targetMapY = mouseRelY - indicator.height;

			if (interactionState.mode === INTERACTION_STATE_MODES.CURSOR)
			{
				targetMapX = mouseRelX - interactionState.dragOffsetX - (indicator.width / 2);
				targetMapY = mouseRelY - interactionState.dragOffsetY - (indicator.height / 2);
			}

			const canvasX = targetMapX / scale + toValue(contentOffsetX);
			const canvasY = targetMapY / scale + toValue(contentOffsetY);

			setCamera({
				x: canvasX + (toValue(canvasWidth) / currentZoom / 2),
				y: canvasY + (toValue(canvasHeight) / currentZoom / 2),
				zoom: currentZoom,
				viewportX: 0,
				viewportY: 0,
			});
		}

		function onMapMouseDown(event: MouseEvent): void
		{
			event.preventDefault();

			const el = toValue(mapEl);
			if (!el)
			{
				return;
			}

			const rect = el.getBoundingClientRect();
			interactionState.mapRect = rect;
			interactionState.isDragging = true;

			const mouseRelX = event.clientX - rect.left;
			const mouseRelY = event.clientY - rect.top;

			if (isPointInViewport(mouseRelX, mouseRelY))
			{
				const indicator = toValue(viewportIndicator);
				interactionState.mode = INTERACTION_STATE_MODES.CURSOR;
				interactionState.dragOffsetX = mouseRelX - indicator.x;
				interactionState.dragOffsetY = mouseRelY - indicator.y;
			}
			else
			{
				interactionState.mode = INTERACTION_STATE_MODES.MAP;
				interactionState.dragOffsetX = 0;
				interactionState.dragOffsetY = 0;
				updateCamera(event.clientX, event.clientY);
			}
		}

		function onMapMouseMove(event: MouseEvent): void
		{
			if (!interactionState.isDragging)
			{
				return;
			}

			event.preventDefault();
			updateCamera(event.clientX, event.clientY);
		}

		function onMapMouseUp(event: MouseEvent): void
		{
			interactionState.isDragging = false;
			interactionState.mode = null;
		}

		function getBlockColor(block: ?DiagramBlock): string
		{
			const blockType = block?.node?.type;
			const colorIndex = block?.node?.colorIndex;

			if (blockType === FRAME_BLOCK_TYPE)
			{
				return DEFAULT_FRAME_BLOCK_COLOR;
			}

			if (colorIndex === null || colorIndex === false)
			{
				return DEFAULT_BLOCK_COLOR;
			}

			const palette = toValue(blockColors) ?? {};

			return palette[colorIndex] || DEFAULT_BLOCK_COLOR;
		}

		return {
			sortedBlocks,
			canvasMapStyle,
			contentOffsetX,
			contentOffsetY,
			renderScale,
			viewportIndicator,
			onMapMouseDown,
			onMapMouseMove,
			onMapMouseUp,
			getBlockColor,
		};
	},
	template: `
		<div :style="canvasMapStyle">
			<svg
				:width="mapWidth"
				:height="mapHeight"
				ref="map"
				class="ui-block-diagram-canvas-map"
				@mousedown="onMapMouseDown"
				@mousemove="onMapMouseMove"
				@mouseup="onMapMouseUp"
				@mouseleave="onMapMouseUp"
			>
				<rect
					v-for="block in sortedBlocks"
					:key="block.id"
					:x="(block.position.x - contentOffsetX) * renderScale"
					:y="(block.position.y - contentOffsetY) * renderScale"
					:width="block.dimensions.width * renderScale"
					:height="block.dimensions.height * renderScale"
					:rx="2"
					:fill="getBlockColor(block)"
					class="ui-block-diagram-canvas-map__block"
				/>
				<rect
					:x="viewportIndicator.x"
					:y="viewportIndicator.y"
					:width="viewportIndicator.width"
					:height="viewportIndicator.height"
					:rx="4"
					class="ui-block-diagram-canvas-map__cursor"
				/>
			</svg>
		</div>
	`,
};
