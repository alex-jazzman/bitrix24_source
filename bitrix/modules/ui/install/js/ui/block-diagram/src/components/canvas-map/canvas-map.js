import './canvas-map.css';
// The map is drawn by the video card, so it reads the tokens below itself instead of leaving
// them to the browser: an undeclared token would resolve to nothing at all here.
// ui.design-tokens is the legacy set and is needed while DEFAULT_BLOCK_COLOR lives there.
import 'ui.design-tokens';
import 'ui.design-tokens.air';
import {
	toValue,
	computed,
	toRefs,
	useTemplateRef,
	reactive,
	watch,
	onMounted,
	onUnmounted,
	type ComputedRef,
} from 'ui.vue3';
import { useActionKeyshortcuts, useBlockDiagram, useCanvas, useLoc } from '../../composables';
import {
	CANVAS_ACTION_ID,
	buildCanvasKeyShortcuts,
	getMapBlockRects,
	getMapLayout,
	getMapScale,
	getMapViewportRect,
	isPointInMapRect,
	isValidColorPalette,
} from '../../utils';
import type { MapPalette } from '../../utils';

type CanvasMapSetup = {
	canvasMapStyle: { [string]: string };
	mapLabel: string;
	keyShortcuts: ComputedRef<string>;
	onMapMouseDown: (event: MouseEvent) => void;
	onMapMouseMove: (event: MouseEvent) => void;
	onMapMouseUp: () => void;
};

const DEFAULT_BLOCK_COLOR = 'var(--ui-color-palette-gray-15)';
const DEFAULT_FRAME_BLOCK_COLOR = 'rgba(0,0,0,0.05)';
// The frame of the current view is drawn with a graphics context, so a CSS rule of a consumer
// never reaches it - the token is the extension point instead, and it is deliberately left
// undeclared: a value declared on the container would beat the same token declared by a consumer
// on any ancestor. Behind it stands the default of the extension, a token of the design system.
const VIEWPORT_COLOR = 'var(--ui-block-diagram-map-viewport-color, var(--ui-color-blue-57))';

const INTERACTION_STATE_MODES = {
	CURSOR: 'cursor',
	MAP: 'map',
};

// Redraw levels. Geometry is the expensive one - it rebuilds the rectangles of every block;
// viewport only moves the frame of the current view, which is what a gesture on the map does.
const INVALIDATION_LEVELS = {
	NONE: 0,
	VIEWPORT: 1,
	GEOMETRY: 2,
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
			default: () => ({}),
			validator(value): boolean
			{
				return isValidColorPalette(value);
			},
		},
		frameColors: {
			type: Object,
			default: () => ({}),
			validator(value): boolean
			{
				return isValidColorPalette(value);
			},
		},
	},
	// eslint-disable-next-line max-lines-per-function
	setup(props, { expose }): CanvasMapSetup
	{
		const {
			blocks,
			blocksRectMap,
			canvasWidth,
			canvasHeight,
			transformX,
			transformY,
			zoom,
			mapRenderer,
			canvasMapRef,
		} = useBlockDiagram();
		const { setCamera } = useCanvas();
		const loc = useLoc();
		const fitToViewKeyshortcuts = useActionKeyshortcuts(CANVAS_ACTION_ID.FIT_TO_VIEW);
		const keyShortcuts = computed((): string => {
			return buildCanvasKeyShortcuts(toValue(fitToViewKeyshortcuts));
		});
		const { mapWidth, mapHeight, blockColors, frameColors } = toRefs(props);
		const mapEl = useTemplateRef('map');
		const mapRootEl = useTemplateRef('mapRoot');
		const mapLabel = loc.getMessage('UI_BLOCK_DIAGRAM_CANVAS_MAP_LABEL');

		const interactionState = reactive({
			isDragging: false,
			mode: null,
			dragOffsetX: 0,
			dragOffsetY: 0,
		});

		// Re-measured every frame of the gesture: layout may shift or the page may scroll while it runs.
		const getMapRect = (): DOMRect | null => {
			return toValue(mapEl)?.getBoundingClientRect() ?? null;
		};

		// Rectangles of the last drawn frame. The array is handed to the renderer as is, and a
		// viewport-only redraw reuses the very same array - that is what keeps a drag on the
		// map from rebuilding the geometry of the blocks.
		let blockRects = [];
		let pendingLevel = INVALIDATION_LEVELS.NONE;
		let frameId = null;
		// The template ref is already cleared by the time the unmount hook runs, so the element the
		// map was attached to is kept here: the detach has to name it to leave a binding made by a
		// component that mounted earlier alone.
		let attachedElement = null;
		// The element registered as the focus surface. The unregistration names it so that a panel
		// unmounted after a later one mounted does not drop the registration that later one made.
		let registeredMapRoot = null;

		const canvasMapStyle = computed((): { [string]: string } => ({
			width: `${toValue(mapWidth)}px`,
			height: `${toValue(mapHeight)}px`,
		}));

		const layout = computed(() => getMapLayout(toValue(blocks), {
			canvasWidth: toValue(canvasWidth),
			canvasHeight: toValue(canvasHeight),
			blocksRectMap: toValue(blocksRectMap),
		}));

		const renderScale = computed((): number => getMapScale(toValue(layout), {
			width: toValue(mapWidth),
			height: toValue(mapHeight),
		}));

		const viewportRect = computed(() => getMapViewportRect(toValue(layout), toValue(renderScale), {
			x: toValue(transformX),
			y: toValue(transformY),
			zoom: toValue(zoom),
			canvasWidth: toValue(canvasWidth),
			canvasHeight: toValue(canvasHeight),
		}));

		function flush(): void
		{
			frameId = null;

			if (!mapRenderer.isAttached)
			{
				pendingLevel = INVALIDATION_LEVELS.NONE;

				return;
			}

			if (pendingLevel === INVALIDATION_LEVELS.GEOMETRY)
			{
				blockRects = getMapBlockRects(toValue(layout), toValue(renderScale), mapRenderer.colors);
			}

			mapRenderer.render({
				blocks: blockRects,
				viewport: toValue(viewportRect),
				viewportColor: mapRenderer.colors.viewport,
			});

			pendingLevel = INVALIDATION_LEVELS.NONE;
		}

		function invalidate(level: number): void
		{
			pendingLevel = Math.max(pendingLevel, level);

			if (frameId !== null)
			{
				return;
			}

			frameId = requestAnimationFrame(flush);
		}

		function getPalette(): MapPalette
		{
			return {
				palette: toValue(blockColors) ?? {},
				framePalette: toValue(frameColors) ?? {},
				block: DEFAULT_BLOCK_COLOR,
				frame: DEFAULT_FRAME_BLOCK_COLOR,
				viewport: VIEWPORT_COLOR,
			};
		}

		watch([layout, renderScale], () => invalidate(INVALIDATION_LEVELS.GEOMETRY));
		watch(viewportRect, () => invalidate(INVALIDATION_LEVELS.VIEWPORT));

		// The colors of the blocks and of the frames are resolved into numbers once and live in the
		// renderer, so a consumer who changes either palette has to reach them. Repainting a single
		// entry in place is as much a palette change as handing over another object, and the map has
		// no other way to learn about it - hence the deep watch over a handful of colors. One watch
		// for both: they have the same effect, and two of them would call setPalette twice per frame.
		// It follows the palettes alone: the level it raises is the expensive one, and a gesture on
		// the map must not raise it.
		watch([blockColors, frameColors], () => {
			if (!mapRenderer.isAttached)
			{
				return;
			}

			mapRenderer.setPalette(getPalette());
			invalidate(INVALIDATION_LEVELS.GEOMETRY);
		}, { deep: true });

		onMounted(() => {
			// Registers the panel as a focus surface of the diagram; why - see `isFocusOnAnyOf` in
			// composables/keyboard-pan.js.
			registeredMapRoot = toValue(mapRootEl);
			canvasMapRef.value = registeredMapRoot;

			const element = toValue(mapEl);

			if (!element)
			{
				return;
			}

			mapRenderer.attach(element, getPalette());
			attachedElement = element;

			// An attach that did not happen leaves nothing to draw on - without a drawing context
			// the map stays empty, and asking for a frame would only hide that.
			if (!mapRenderer.isAttached)
			{
				return;
			}

			invalidate(INVALIDATION_LEVELS.GEOMETRY);
		});

		onUnmounted(() => {
			if (frameId !== null)
			{
				cancelAnimationFrame(frameId);
				frameId = null;
			}

			pendingLevel = INVALIDATION_LEVELS.NONE;
			mapRenderer.detach(attachedElement);
			attachedElement = null;

			if (toValue(canvasMapRef) === registeredMapRoot)
			{
				canvasMapRef.value = null;
			}

			registeredMapRoot = null;
		});

		function updateCamera(clientX: number, clientY: number): void
		{
			const mapRect = getMapRect();

			if (!mapRect)
			{
				return;
			}

			const mouseRelX = clientX - mapRect.left;
			const mouseRelY = clientY - mapRect.top;

			const indicator = toValue(viewportRect);
			const scale = toValue(renderScale);
			const currentZoom = toValue(zoom);

			let targetMapX = mouseRelX - indicator.width;
			let targetMapY = mouseRelY - indicator.height;

			if (interactionState.mode === INTERACTION_STATE_MODES.CURSOR)
			{
				targetMapX = mouseRelX - interactionState.dragOffsetX - (indicator.width / 2);
				targetMapY = mouseRelY - interactionState.dragOffsetY - (indicator.height / 2);
			}

			const canvasX = targetMapX / scale + toValue(layout).minX;
			const canvasY = targetMapY / scale + toValue(layout).minY;

			// No anchor point here on purpose: the gesture moves the camera to a place, and an
			// anchored landmark would compensate the move away entirely.
			setCamera({
				x: canvasX + (toValue(canvasWidth) / currentZoom / 2),
				y: canvasY + (toValue(canvasHeight) / currentZoom / 2),
				zoom: currentZoom,
			});
		}

		function onMapMouseDown(event: MouseEvent): void
		{
			event.preventDefault();

			const rect = getMapRect();
			if (!rect)
			{
				return;
			}

			interactionState.isDragging = true;

			const mouseRelX = event.clientX - rect.left;
			const mouseRelY = event.clientY - rect.top;

			if (isPointInMapRect({ x: mouseRelX, y: mouseRelY }, toValue(viewportRect)))
			{
				const indicator = toValue(viewportRect);
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

		function onMapMouseUp(): void
		{
			interactionState.isDragging = false;
			interactionState.mode = null;
		}

		function focus(): void
		{
			toValue(mapRootEl)?.focus({ preventScroll: true });
		}

		expose({ focus });

		return {
			canvasMapStyle,
			mapLabel,
			keyShortcuts,
			onMapMouseDown,
			onMapMouseMove,
			onMapMouseUp,
		};
	},
	template: `
		<div
			ref="mapRoot"
			:data-test-id="$blockDiagramTestId('zoomCanvasMap')"
			:style="canvasMapStyle"
			class="ui-block-diagram-canvas-map__container"
			role="region"
			tabindex="0"
			:aria-label="mapLabel"
			:aria-keyshortcuts="keyShortcuts"
		>
			<canvas
				ref="map"
				class="ui-block-diagram-canvas-map"
				aria-hidden="true"
				@mousedown="onMapMouseDown"
				@mousemove="onMapMouseMove"
				@mouseup="onMapMouseUp"
				@mouseleave="onMapMouseUp"
			></canvas>
		</div>
	`,
};
