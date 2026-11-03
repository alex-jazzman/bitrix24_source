import { SnapshotHandler, RevertHandler } from './composables';
import {
	PortsNearest,
	BlockIntersections,
	AnimationStepController,
	Camera,
	Canvas,
	MapRenderer,
	InputState,
	ActionRegistry,
	CopyPasteBuffer,
} from './utils';

export type Point = {
	x: number;
	y: number;
};

export type Rect = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export type DiagramNewConnection = {
	id: string,
	sourceBlockId: DiagramBlockId,
	sourcePortId: DiagramPortId,
	sourcePortPosition: DiagramPortPosition;
	targetBlockId: DiagramBlockId | null;
	targetPortId: DiagramPortId | null;
	start: Point;
	center: Point | null;
	end: Point | null;
};

export type DiagramBlockId = string;

export type DigramBlockPosition = {
	x: number;
	y: number;
}

export type DiagramBlockDimensions = {
	width: number;
	height: number;
}

export type DiagramPortPosition = 'top' | 'bottom' | 'left' | 'right';

export type DiagramPortId = string;

export type DiagramPort = {
	id: DiagramPortId;
	position: DiagramPortPosition;
	type: string;
}

export type DiagramPortRect = {
	x: number;
	y: number;
	width: number;
	height: number;
	position: DiagramPortPosition;
};

export type DiagramNearestPort = {
	x: number;
	y: number;
	blockId: DiagramBlockId;
	portId: DiagramPortId;
	port: DiagramPort;
};

export type DiagramPortsMap = Map<DiagramBlockId, Map<DiagramPortId, DiagramPort>>;

export type DiagramVirtualPortDropFn = (newConnection: DiagramNewConnection) => void;

export type DiagramVirtualPortEntry = {
	port: DiagramPort;
	onDrop: DiagramVirtualPortDropFn | null;
};

export type DiagramVirtualPortsMap = Map<DiagramBlockId, Map<DiagramPortId, DiagramVirtualPortEntry>>;

export type DiagramBlockPorts = {
	input: Array<DiagramPort>;
	output: Array<DiagramPort>;
}

export type DiagramBlock = {
	id: DiagramBlockId;
	position: DigramBlockPosition;
	dimensions: DiagramBlockDimensions;
	ports: DiagramBlockPorts;
};

export type ShortcutHandler = (event: KeyboardEvent, mousePos: Point) => void;

export type DiagramGroupedBlocks = { [string]: Array<DiagramBlock> };
export type DiagramBlockGroupNames = Array<string>;

export type DiagramConnectionId = string;

export type DiagramConnection = {
	id: DiagramConnectionId;
	type?: string;
	sourceBlockId: DiagramBlockId;
	sourcePortId: DiagramPortId;
	targetBlockId: DiagramBlockId;
	targetPortId: DiagramPortId;
};

export type DiagramConnectionRouteHit = {
	connection: DiagramConnection;
	distancePx: number;
};

export type DiagramConnectionOffset = {
	firstSegmentSize: number;
	secondSegmentSize: number;
	secondSegmentOrder: number;
};

export type DiagramConnectionsOffsetMap = {
	[DiagramBlockId]: {
		[DiagramPortId]: {
			[DiagramConnectionId]: DiagramConnectionOffset;
		};
	};
};

export type DiagramConnectionPreviewPortMarker = {
	blockId: DiagramBlockId;
	portId: DiagramPortId;
};

export type DiagramConnectionPreview = {
	hiddenConnectionId: DiagramConnectionId;
	temporaryConnections: [DiagramConnection, DiagramConnection];
	routingConnections: DiagramConnection[];
	portMarkers: [DiagramConnectionPreviewPortMarker, DiagramConnectionPreviewPortMarker];
	activationKey: string;
};

export type GroupedConnections = { [string]: Array<DiagramConnection> };
export type ConnectionGroupNames = Array<string>;

export type DiagramClipboardContent = {
	blocks: DiagramBlock[];
	connections: DiagramConnection[];
	// Which of the copied blocks were containers at the moment of copying. Stated here because the
	// buffer outlives the blocks it was filled from: by the time of the paste the original may be
	// gone from the canvas, and nothing would be left to ask. Absent in content copied before this
	// field existed.
	backdropIds?: DiagramBlockId[];
};

export type Transform = {
	x: number,
	y: number,
	zoom: number,
	viewportX: number,
	viewportY: number,
};

// Camera destination. The viewport point is kept in place only while anchorToViewport is set:
// (0, 0) is a valid point and must not be read as "no anchor".
export type CameraLandmark = {
	x: number,
	y: number,
	zoom: number,
	anchorToViewport: boolean,
	viewportX: number,
	viewportY: number,
};

// Edges of the viewport the panels of a consumer cover. The canvas is drawn under them and its own
// size says nothing about them, so the free part of the screen is known to the consumer alone.
//
// Every edge is optional: a consumer names the ones its panels really take and says nothing about
// the rest, so a partial set is an ordinary value here. Filling the gaps with zeros is the business
// of the geometry that measures the free area (`resolveInsets` in `utils/canvas/fit-to-view.js`),
// not of the consumer.
export type DiagramViewportInsets = {
	top?: number,
	right?: number,
	bottom?: number,
	left?: number,
};

// One-off parameters of the fit command. Every field is optional: on its own the command takes the
// insets published by the panel of the consumer, a margin of one grid step along every side and the
// natural size of the scheme as the upper bound of the fitted scale.
export type FitToViewParams = {
	insets?: DiagramViewportInsets,
	padding?: number,
	maxFitZoom?: number,
};

export type Snapshot = {
	snapshot: {...},
	revertHandler: (snapshot: Snapshot) => void,
	next: Snapshot | null,
	prev: Snapshot | null,
};

export type AnimationItemTypes = 'block' | 'connection' | 'remove_block' | 'remove_connection';

export type AnimationItem = {
	type: AnimatedItemTypes;
	item: DiagramBlock | DiagramConnection;
};

/**
 * A block the way a drag hands it over: what the consumer will put into the model, plus what only
 * the palette knows about it. The declaration below is read once, at the drop, and is not kept in
 * the model - from the mount of the block onwards the registry of containers answers for it.
 */
export type DiagramDraggedBlock = {
	...DiagramBlock,
	// The consumer renders this block as a container (see the `Groupable` wrapper). Optional and
	// false by default: a consumer that says nothing drops ordinary nodes, exactly as before.
	// Without it the no-overlap rule would push a container off the very nodes it was aimed to
	// cover, because the registry is filled at mount and the drop is written before that.
	isBackdrop?: boolean,
};

export type DragData = {
	dragData: DiagramDraggedBlock,
	dragImage: HTMLElement,
};

/**
 * Must return the same verdict for the same target throughout one connection gesture: a refusal
 * is cached until the gesture ends and the rule is not asked about that target again.
 */
export type DiagramValidationPortRuleFn = (newConnection: DiagramNewConnection) => boolean;

// What a port may register as its validation: a list of rules, a single rule, or nothing.
export type DiagramValidationPortRules = Array<DiagramValidationPortRuleFn> | DiagramValidationPortRuleFn | null;

export type DiagramNormalyzeConnectionFn = (newConnection: DiagramNewConnection) => DiagramNewConnection;

export type DiagramInstancesContext = {
	state: State;
	getters: Getters;
};

export type DiagramCanvasContext = {
	...DiagramInstancesContext,
	camera: typeof Camera;
};

export type DiagramInstances = {
	portsNearest: typeof PortsNearest;
	blockIntersections: typeof BlockIntersections;
	camera: typeof Camera;
	canvas: typeof Canvas;
	mapRenderer: typeof MapRenderer;
	animationStep: typeof AnimationStepController;
	inputState: typeof InputState;
	actionRegistry: typeof ActionRegistry;
	copyPasteBuffer: typeof CopyPasteBuffer;
};

export type DiagramSearchBlockRect = {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
};

export type State = {
	blockDiagramRef: HTMLElement | null;
	canvasMapRef: HTMLElement | null;
	focusScopeRef: HTMLElement | null;
	blockDiagramTop: number;
	blockDiagramLeft: number;

	isDisabled: boolean;

	blocks: Array<DiagramBlock>;
	connections: Array<DiagramConnection>;

	waitAllBlocksMounted: Promise<void>;
	waitedBlockIds: Set<DiagramBlockId>;

	waitAllPortsMounted: Promise<void>;
	waitedBlockPortsIds: Set<string>;

	connectionOffset: number;
	connectionBendOffset: number;
	connectionBorderRadius: number,
	connectionsOffsetMap: DiagramConnectionsOffsetMap;

	portsElMap: Map<DiagramBlockId, Map<DiagramPortId, HTMLElement>>;
	portsRectMap: { [DiagramBlockId]: { [DiagramPortId]: DiagramPortRect } };
	portsGeometryVersion: number;
	portsValidationsFnMap: Map<DiagramBlockId, Map<DiagramPortId, DiagramValidationPortRules>>;
	validPortsMap: DiagramPortsMap;

	virtualPortsMap: DiagramVirtualPortsMap;

	newConnection: DiagramNewConnection | null;
	connectionPreview: DiagramConnectionPreview | null;

	movingBlockId: DiagramBlockId | null;

	// Every node the running gesture leads: a frame drag moves a whole selection, and a node drag
	// takes its group members along.
	gestureBlockIds: Set<DiagramBlockId>;

	// Whether the running gesture raises the set above: it answers that question alone, and the
	// raised set is `gestureBlockIds` itself. Outside a gesture - false.
	isGestureElevated: boolean;

	// Blocks that declared themselves containers by being wrapped in Groupable. The gesture of the
	// selection frame never reaches a block component, so the registry is the one channel through
	// which both gestures learn about containers.
	groupableBlockIds: Set<DiagramBlockId>;

	// The node under the cursor, raised above the rest of the canvas. A single id, not a set:
	// the shape of the storage is what keeps exactly one node raised at a time.
	hoveredBlockId: DiagramBlockId | null;

	canvasRef: HTMLElement | null,
	transformLayoutRef: HTMLElement | null,
	canvasWidth: number,
	canvasHeight: number,
	viewportInsets: DiagramViewportInsets;
	transformX: number;
	transformY: number;
	viewportX: number;
	viewportY: number;
	zoom: number;
	minZoom: number,
	maxZoom: number,

	// permission to snap, not snapping itself: a gesture is aligned only while Shift is held
	snapToGrid: boolean;
	snapSize: number | null;
	canvasGridSize: number;

	contextMenuLayerRef: HTMLElement | null;
	targetContainerRef: HTMLElement | null;
	isOpenContextMenu: boolean;
	openedContextMenuName: string | null;
	contextMenuInstance: null;
	positionContextMenu: {
		top: number;
		left: number;
	};

	headSnapshot: Snapshot | null;
	tailSnapshot: Snapshot | null;
	currentSnapshot: Snapshot | null;
	maxCountSnapshots: number;
	snapshotHandler: SnapshotHandler;
	revertHandler: RevertHandler;

	highlitedBlockIds: Array<DiagramBlockId>;
	transientHighlightedBlockIds: Array<DiagramBlockId>;

	// Blocks the no-overlap rule has just answered about. A channel of its own: neither the user
	// selection nor the playback highlight may go out because a block was pushed aside, and the
	// reverse.
	displacedBlockIds: Array<DiagramBlockId>;

	// What the channel above is saying about those blocks: a correction the rule made, or a refusal
	// that left them where they started. One flag for the whole set - a channel always carries the
	// answer to a single operation.
	isPlacementRefused: boolean;

	isSelectionActive: boolean;
	selectionWorldRect: { x: number, y: number, width: number, height: number } | null;

	// Shift the frame drag has drawn but not yet committed: the model keeps the pre-gesture
	// positions until mouseup, and the selection box follows the nodes by this offset.
	groupDragOffset: Point;

	animationQueue: Generator<AnimationItem | undefined> | null;
	currentAnimationItem: AnimationItem | null;
	isPauseAnimation: boolean;
	isStopAnimation: boolean;

	isRenderOptimizationAvailable: boolean;
	connectionRouteHitTestEnabled: boolean;
};

export type Getters = {
	transform: Transform;
	canvasId: string | null;
	groupedConnections: GroupedConnections;
	connectionGroupNames: ConnectionGroupNames;
	blockIdsInModel: Set<DiagramBlockId>;
	isAnimate: boolean;
	isDisabledBlockDiagram: boolean;
	isMakeNewConnection: boolean;
	snapStep: number | null;
};
