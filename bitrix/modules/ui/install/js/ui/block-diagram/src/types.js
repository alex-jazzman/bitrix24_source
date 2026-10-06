import { SnapshotHandler, RevertHandler } from './composables';
import { PortsNearest, BlockIntersections, AnimationStepController } from './utils';

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

export type PreparedShortcut = {
	id: string,
	mainKey: string,
	requiredModifiers: {
		ctrl: boolean,
		meta: boolean,
		shift: boolean,
		alt: boolean,
	},
	handler: ShortcutHandler,
};

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

export type Transform = {
	x: number,
	y: number,
	zoom: number,
	viewportX: number,
	viewportY: number,
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

export type DragData = {
	dragData: DiagramBlock,
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

export type DiagramInstances = {
	portsNearest: typeof PortsNearest;
	blockIntersections: typeof BlockIntersections;
	animationStep: typeof AnimationStepController;
};

export type DiagramSearchBlockRect = {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
};

export type State = {
	blockDiagramRef: HTMLElement | null;
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

	canvasRef: HTMLElement | null,
	transformLayoutRef: HTMLElement | null,
	canvasInstance: {...} | null,
	canvasWidth: number,
	canvasHeight: number,
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
	isSelectionActive: boolean;
	selectionWorldRect: { x: number, y: number, width: number, height: number } | null;

	// Shift the frame drag has drawn but not yet committed: the model keeps the pre-gesture
	// positions until mouseup, and the selection box follows the nodes by this offset.
	groupDragOffset: Point;

	animationQueue: Generator<AnimationItem | undefined> | null;
	currentAnimationItem: AnimationItem | null;
	isPauseAnimation: boolean;
	isStopAnimation: boolean;

	shortcuts: Array<PreparedShortcut>;
	mousePosition: Point;
	isKeyboardInitialized: boolean;
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
