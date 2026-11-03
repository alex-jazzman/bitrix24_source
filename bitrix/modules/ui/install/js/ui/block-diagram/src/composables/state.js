import { Extension } from 'main.core';
import { markRaw } from 'ui.vue3';
import { CONNECTION_OFFSET, CONNECTION_BEND_OFFSET, CONNECTION_BORDER_RADIUS } from '../constants';
import { promiseWithResolvers, GRID_DEFAULT_SIZE } from '../utils';
import type { State } from '../types';

const isRenderOptimizationAvailable = Extension.getSettings('ui.block-diagram').get('isRenderOptimizationAvailable');

const RENDER_OPTIMIZATION = {
	enabled: 'Y',
};

export function useState(): State
{
	return {
		blockDiagramRef: null,
		// The panel of the minimap, registered as a focus surface of the diagram; why - see
		// `isFocusOnAnyOf` in composables/keyboard-pan.js.
		canvasMapRef: null,
		// The work area a consumer declares around the canvas: the catalog and the toolbars it places
		// next to the diagram belong to it, the page around the editor does not. Read by the
		// background Escape (composables/canvas-escape-fallback.js); null means the root itself.
		focusScopeRef: null,
		blockDiagramTop: 0,
		blockDiagramLeft: 0,
		blockDiagramWidth: 0,
		blockDiagramHeight: 0,

		cursorType: 'default',

		isDisabled: false,

		waitAllBlocksMounted: promiseWithResolvers(),
		waitedBlockIds: new Set(),

		waitAllPortsMounted: promiseWithResolvers(),
		waitedBlockPortsIds: new Set(),

		isRunUpdateBlocksCommand: false,
		blocks: [],
		connections: [],

		connectionOffset: CONNECTION_OFFSET,
		connectionBendOffset: CONNECTION_BEND_OFFSET,
		connectionBorderRadius: CONNECTION_BORDER_RADIUS,

		connectionsOffsetMap: Object.create(null),

		blockElMap: markRaw(new Map()),
		blocksRectMap: {},

		portsElMap: markRaw(new Map()),
		portsRectMap: {},
		// Bumped when a port registers or drops its own rect (addPortRect/deletePortRect); a
		// bulk purge of a culled block's geometry stays silent. Watching the map itself would
		// mean a structural walk of every block ever measured on each pass; a counter says
		// the same thing in one read.
		portsGeometryVersion: 0,
		portsValidationsFnMap: new Map(),
		validPortsMap: new Map(),
		virtualPortsMap: markRaw(new Map()),

		newConnection: null,
		connectionPreview: null,

		movingBlockId: null,
		gestureBlockIds: new Set(),
		isGestureElevated: false,

		groupableBlockIds: new Set(),

		hoveredBlockId: null,

		resizingBlock: null,

		canvasRef: null,
		transformLayoutRef: null,
		canvasWidth: 0,
		canvasHeight: 0,
		// Edges of the viewport the panels of a consumer cover: the canvas is drawn under them and
		// knows nothing about them. The zoom bar publishes them, the fit reads them when it runs.
		viewportInsets: { top: 0, right: 0, bottom: 0, left: 0 },
		transformX: 0,
		transformY: 0,
		viewportX: 0,
		viewportY: 0,
		zoom: 1,
		minZoom: 0.2,
		maxZoom: 4,

		snapToGrid: false,
		snapSize: null,
		// fallback for a canvasStyle without an explicit size: the same base cell the grid
		// style defaults to, so the snap step never diverges from the drawn grid
		canvasGridSize: GRID_DEFAULT_SIZE,

		contextMenuLayerRef: null,
		targetContainerRef: null,
		isOpenContextMenu: false,
		openedContextMenuName: null,
		contextMenuInstance: null,
		positionContextMenu: {
			top: 0,
			left: 0,
		},

		historyCurrentState: markRaw({
			blocks: [],
			connections: [],
		}),

		headSnapshot: null,
		tailSnapshot: null,
		currentSnapshot: null,
		maxCountSnapshots: 20,
		snapshotHandler: null,
		revertHandler: null,

		highlitedBlockIds: [],
		transientHighlightedBlockIds: [],
		displacedBlockIds: [],
		isPlacementRefused: false,
		isSelectionActive: false,
		selectionWorldRect: null,
		groupDragOffset: { x: 0, y: 0 },

		animationQueue: null,
		currentAnimationItem: null,
		isPauseAnimation: false,
		isStopAnimation: false,

		isRenderOptimizationAvailable: isRenderOptimizationAvailable === RENDER_OPTIMIZATION.enabled,
		connectionRouteHitTestEnabled: false,
	};
}
