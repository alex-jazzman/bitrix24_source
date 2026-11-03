import type { AnimationItemTypes } from './types';

export const PORT_SIZE = 10;
export const CONNECTION_OFFSET = 30;
export const CONNECTION_BEND_OFFSET = 30;
export const CONNECTION_BORDER_RADIUS = 10;
export const DELETE_BUTTON_SIZE = 22;

// Screen distance the pointer has to travel before a press on a block turns into a drag.
// A press below it stays a selection: with snapping on, treating the shake of a hand as a
// drag would move a block of an old scheme to the nearest node and dirty the draft.
export const DRAG_START_THRESHOLD = 4;

// Screen pixels per second the camera travels while an arrow key is held. Screen, not world: the
// picture travels the same way at any zoom.
export const KEYBOARD_PAN_SPEED = 700;

// How long the camera takes to reach that speed, and to come back to a stop once the key is
// released. Short on purpose: it takes the jolt out of both ends of a hold without letting the
// speed grow the longer the key is down.
export const KEYBOARD_PAN_RAMP_DURATION = 120;

// The combo the command that fits the whole scheme into the free part of the screen ships with.
export const FIT_TO_VIEW_SHORTCUT: Array<string> = ['Shift', '1'];

// Max never-measured connection ends mounted for measurement per render cycle, so a
// large off-screen set drains over several frames instead of one long main-thread task.
export const FIRST_MEASURE_BATCH_SIZE = 12;

// Hard lower bound of the camera zoom, two orders below any plausible overview scale. It keeps the
// inverse scale where the Float32Array matrices still represent whole canvas units exactly.
export const ZOOM_FLOOR = 1e-4;

export const HOOK_NAMES = {
	CHANGED_BLOCKS: 'changedBlocks',
	CHANGED_CONNECTIONS: 'changedConnections',
	START_DRAG_BLOCK: 'startDragBlock',
	MOVE_DRAG_BLOCK: 'moveDragBlock',
	END_DRAG_BLOCK: 'endDragBlock',
	// Raised once for a canvas gesture of any kind that reached the model. The three hooks above
	// stay what they are: only the node drag raises them.
	END_GESTURE: 'endGesture',
	ADD_BLOCK: 'addBlock',
	ADD_BLOCKS: 'addBlocks',
	UPDATE_BLOCK: 'updateBlock',
	DELETE_BLOCK: 'deleteBlock',
	DELETE_BLOCKS: 'deleteBlocks',
	ADD_CONNECTION: 'addConnection',
	ADD_CONNECTIONS: 'addConnections',
	CREATE_CONNECTION: 'createConnection',
	DELETE_CONNECTION: 'deleteConnection',
	BLOCK_TRANSITION_START: 'blockTransitionStart',
	BLOCK_TRANSITION_END: 'blockTransitionEnd',
	CONNECTION_TRANSITION_START: 'connectionTransitionStart',
	CONNECTION_TRANSITION_END: 'connectionTransitionEnd',
	DROP_NEW_BLOCK: 'dropNewBlock',
	PASTE_BLOCKS: 'pasteBlocks',
	HISTORY_NEXT: 'historyNext',
	HISTORY_PREV: 'historyPrev',
};

export const PORT_TYPES: { ... } = {
	INPUT: 'input',
	OUTPUT: 'output',
};

export const BLOCK_GROUP_DEFAULT_NAME = 'default';
export const CONNECTION_GROUP_DEFAULT_NAME = 'default';

export const PORT_POSITION = {
	TOP: 'top',
	BOTTOM: 'bottom',
	RIGHT: 'right',
	LEFT: 'left',
};

export const ANIMATED_TYPES: { [string]: AnimationItemTypes } = {
	BLOCK: 'block',
	CONNECTION: 'connection',
	REMOVE_BLOCK: 'remove_block',
	REMOVE_CONNECTION: 'remove_connection',
};

export const CURSOR_TYPES = {
	EW_RESIZE: 'ew-resize',
	NS_RESIZE: 'ns-resize',
	NWSE_RESIZE: 'nwse-resize',
	NESW_RESIZE: 'nesw-resize',
};

// Stacking scale inside the canvas context, blocks and connections alike: the connection rests at
// 0 and rises to 2 under the cursor, its preview stands at 6 and the one being created at 7, the
// selection frame at 90 and the selection box at 9999.
export const BLOCK_INDEXES = {
	// Added on top of the step a participant already has, so a raised set keeps its inner order and
	// lands in the free band 9-15: whole above the connection being created, whole below the frame.
	ELEVATION_OFFSET: 10,
	HOVERED: 5,
	HIGHLITED: 4,
	MOVABLE: 3,
	STANDING: 2,
	// Resting step of the backdrop, the same value its stylesheet states.
	BACKDROP: -1,
};

// The canvas publishes the addition on its root so the stylesheets of the extension raise by the
// very number the resolver adds, instead of repeating it. Outside the canvas the variable is
// undefined and nothing is raised.
export const ELEVATION_OFFSET_CSS_VARIABLE = '--ui-block-diagram-elevation-offset';

// Published the same way, and for the same reason: the flash of the placement feedback and the
// state behind it expire together, so the stylesheets take the duration from the timer that owns it
// instead of stating a number of their own.
export const DISPLACED_DURATION_CSS_VARIABLE = '--ui-block-diagram-displaced-duration';

export const INPUT_TAGS = Object.freeze({
	INPUT: true,
	TEXTAREA: true,
	SELECT: true,
});

export const MOUSE_BUTTON = Object.freeze({
	LEFT: 0,
	MIDDLE: 1,
	RIGHT: 2,
});

export const SOURCE_PORT_STUB_TELEPORT_NAME = 'sourcePortNewConnection';
export const TARGET_PORT_STUB_TELEPORT_NAME = 'targetPortNewConnection';
