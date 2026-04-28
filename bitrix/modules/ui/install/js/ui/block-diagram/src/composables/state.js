import { Extension } from 'main.core';
import { markRaw } from 'ui.vue3';
import { CONNECTION_OFFSET, CONNECTION_BEND_OFFSET, CONNECTION_BORDER_RADIUS } from '../constants';
import { BoxIntersection } from '../utils';
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

		cursorType: 'default',

		isResizing: false,
		isDisabled: false,

		waitAllBlocksMounted: Promise.withResolvers(),
		waitedBlockIds: new Set(),

		waitAllPortsMounted: Promise.withResolvers(),
		waitedBlockPortsIds: new Set(),

		blocks: [],
		connections: [],

		connectionOffset: CONNECTION_OFFSET,
		connectionBendOffset: CONNECTION_BEND_OFFSET,
		connectionBorderRadius: CONNECTION_BORDER_RADIUS,

		connectionsOffsetMap: {},

		blockElMap: markRaw(new Map()),
		blocksRectMap: {},

		portsElMap: markRaw(new Map()),
		portsRectMap: {},

		newConnection: null,
		isValidNewConnection: true,

		movingBlock: null,
		movingConnections: [],

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

		contextMenuLayerRef: null,
		targetContainerRef: null,
		isOpenContextMenu: false,
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
		isSelectionActive: false,
		selectionWorldRect: null,

		animationQueue: null,
		currentAnimationItem: null,
		isPauseAnimation: false,
		isStopAnimation: false,

		shortcuts: [],
		mousePosition: { x: 0, y: 0 },
		isKeyboardInitialized: false,
		boxIntersection: isRenderOptimizationAvailable === RENDER_OPTIMIZATION.enabled
			? markRaw(new BoxIntersection()) : null,
		waitForTransformEnd: null,
	};
}
