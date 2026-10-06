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
		blockDiagramTop: 0,
		blockDiagramLeft: 0,
		blockDiagramWidth: 0,
		blockDiagramHeight: 0,

		cursorType: 'default',

		isResizing: false,
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

		resizingBlock: null,

		canvasRef: null,
		transformLayoutRef: null,
		canvasInstance: null,
		canvasWidth: 0,
		canvasHeight: 0,
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
		isSelectionActive: false,
		selectionWorldRect: null,
		groupDragOffset: { x: 0, y: 0 },

		animationQueue: null,
		currentAnimationItem: null,
		isPauseAnimation: false,
		isStopAnimation: false,

		shortcuts: [],
		mousePosition: { x: 0, y: 0 },
		isKeyboardInitialized: false,
		isRenderOptimizationAvailable: isRenderOptimizationAvailable === RENDER_OPTIMIZATION.enabled,
		connectionRouteHitTestEnabled: false,
	};
}
