import { SnapshotHandler, RevertHandler } from './composables';
import { PortsNearest, BlockIntersections } from './utils';

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

export type DiagramValidationPortRuleFn = (newConnection: DiagramNewConnection) => boolean;

export type DiagramNormalyzeConnectionFn = (newConnection: DiagramNewConnection) => DiagramNewConnection;

export type DiagramInstancesContext = {
	state: State;
	getters: Getters;
};

export type DiagramInstances = {
	portsNearest: typeof PortsNearest;
	blockIntersections: typeof BlockIntersections;
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

	portsElMap: Map<DiagramBlockId, Map<DiagramPortId, HTMLElement>>;
	portsRectMap: { [DiagramBlockId]: { [DiagramPortId]: DiagramPortRect } };

	newConnection: DiagramNewConnection | null;

	movingBlockId: DiagramBlockId | null;

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
	isSelectionActive: boolean;
	selectionWorldRect: { x: number, y: number, width: number, height: number } | null;

	animationQueue: Generator<AnimationItem | undefined> | null;
	currentAnimationItem: AnimationItem | null;
	isPauseAnimation: boolean;
	isStopAnimation: boolean;

	shortcuts: Array<PreparedShortcut>;
	mousePosition: Point;
	isKeyboardInitialized: boolean;
};

export type Getters = {
	transform: Transform;
	canvasId: string | null;
	groupedConnections: GroupedConnections;
	connectionGroupNames: ConnectionGroupNames;
	isAnimate: boolean;
	isDisabledBlockDiagram: boolean;
	isMakeNewConnection: boolean;
};
