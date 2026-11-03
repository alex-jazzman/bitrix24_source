import { onMounted, onUnmounted, toValue } from 'ui.vue3';

import { useBlockDiagram } from './block-diagram';
import { useCanvas } from './canvas';
import { isFocusOnAnyOf, isInputEventTarget, type InputState } from '../utils';
import { KEYBOARD_PAN_RAMP_DURATION, KEYBOARD_PAN_SPEED } from '../constants';
import { type Point } from '../types';

const PAN_KEYS = {
	ArrowLeft: { x: -1, y: 0 },
	ArrowRight: { x: 1, y: 0 },
	ArrowUp: { x: 0, y: -1 },
	ArrowDown: { x: 0, y: 1 },
};

const MILLISECONDS_IN_SECOND = 1000;

// The spellings `InputState` normalizes a modifier to; `isModifierToken` accepts the same set.
const MODIFIER_TOKENS = ['ctrl', 'alt', 'shift', 'meta'];

type PanLoop = {
	start: () => void,
	stop: () => void,
};

type PanLoopOptions = {
	getTarget: () => Point,
	canRun: () => boolean,
	// Raised when `canRun` refuses in flight, just before the loop shuts down: whoever owns the target
	// gets to drop what it was aiming at. A loop that ends on its own - the soft stop having run out -
	// does not raise it, and must not: two opposite arrows also leave nothing to aim at, and the owner
	// still needs to know they are held.
	onCannotRun: () => void,
	panBy: (dxScreen: number, dyScreen: number) => void,
};

// Closes the gap to the target by at most `maxDelta` of the velocity's own length, so the speed ramps
// at a fixed rate instead of snapping. The vector is ramped as a whole and not axis by axis: ramped
// side by side, the axes of a diagonal reach full speed in the time one axis takes to cover a shorter
// distance, and a turn from one direction to another briefly carries the camera faster than the speed
// it was promised. Landing exactly on the target is what lets the loop tell a finished stop from a
// slow one.
function approachVector(velocity: Point, target: Point, maxDelta: number): Point
{
	const deltaX = target.x - velocity.x;
	const deltaY = target.y - velocity.y;
	const distance = Math.hypot(deltaX, deltaY);

	if (distance <= maxDelta)
	{
		return { x: target.x, y: target.y };
	}

	return {
		x: velocity.x + (deltaX / distance) * maxDelta,
		y: velocity.y + (deltaY / distance) * maxDelta,
	};
}

// Two arrows at once hold a vector of length sqrt(2), so without normalizing the diagonal would run
// some 40 per cent faster than an axis. What is normalized is the target speed, not the path the ramp
// takes to it: the axes ramp side by side, so a diagonal reaches full speed a little sooner than an
// axis does. Opposite arrows cancel out and hold nothing.
function getTargetDirection(heldKeys: Set<string>): Point
{
	let x = 0;
	let y = 0;

	heldKeys.forEach((key) => {
		x += PAN_KEYS[key].x;
		y += PAN_KEYS[key].y;
	});

	const length = Math.hypot(x, y);

	if (length === 0)
	{
		return { x: 0, y: 0 };
	}

	return { x: x / length, y: y / length };
}

// The rule about an editable surface is written once, in `isInputEventTarget`: it asks an event about
// its target, and the target here is whatever holds the focus at this very moment.
function isEditableActiveElement(): boolean
{
	return isInputEventTarget({ target: document.activeElement });
}

// An arrow under a modifier is somebody else's shortcut: the browser's, the system's or the screen
// reader's - VoiceOver reads by Ctrl+Option+arrow. The hold channel of the input state matches by the
// key token alone, so without this every one of them would read as a plain arrow.
function hasModifier(event: KeyboardEvent | PointerEvent | null): boolean
{
	return event?.ctrlKey === true
		|| event?.altKey === true
		|| event?.metaKey === true
		|| event?.shiftKey === true;
}

// A modifier pressed after the arrow finds no press edge to be refused at: the token of the arrow does
// not change, so the hold channel stays silent about it. Watching the modifiers themselves closes the
// other order of the same pair - the arrow stops moving the camera, and the combo goes back to the
// browser, because `Ctrl+ArrowLeft` matches no record of ours.
function subscribeModifiers(inputState: InputState, onModifierDown: () => void): Array<() => void>
{
	return MODIFIER_TOKENS.map((token) => inputState.onChange(token, (isPressed: boolean) => {
		if (isPressed)
		{
			onModifierDown();
		}
	}));
}

/**
 * The frame loop of the pan: a constant speed with a short ramp at both ends of a hold. It knows
 * nothing about keys - where to go and whether it may go at all are asked through the callbacks, which
 * keeps the frame bookkeeping out of the subscription code.
 */
function createPanLoop(options: PanLoopOptions): PanLoop
{
	const { getTarget, canRun, onCannotRun, panBy } = options;

	let frameId = null;
	// The timestamp of the previous frame, so a frame moves the camera by the time it actually took.
	// Null until the loop has seen its first frame: there is nothing to measure against yet.
	let previousFrameTime = null;
	// The velocity the camera runs at right now, as a share of the full speed. It follows the target
	// through `approachVector`, which is what makes both ends of a hold gradual.
	let velocity = { x: 0, y: 0 };

	function stop(): void
	{
		if (frameId !== null)
		{
			cancelAnimationFrame(frameId);
			frameId = null;
		}

		previousFrameTime = null;
		velocity = { x: 0, y: 0 };
	}

	function step(now: number): void
	{
		if (!canRun())
		{
			onCannotRun();
			stop();

			return;
		}

		const elapsed = previousFrameTime === null ? 0 : now - previousFrameTime;
		previousFrameTime = now;

		const target = getTarget();
		const maxDelta = elapsed / KEYBOARD_PAN_RAMP_DURATION;
		velocity = approachVector(velocity, target, maxDelta);

		// The speed is per second, so a frame owes its own share of it. A fixed number of pixels per
		// frame would hand the speed over to the refresh rate of the monitor instead.
		const seconds = elapsed / MILLISECONDS_IN_SECOND;
		const dx = velocity.x * KEYBOARD_PAN_SPEED * seconds;
		const dy = velocity.y * KEYBOARD_PAN_SPEED * seconds;

		if (dx !== 0 || dy !== 0)
		{
			panBy(dx, dy);
		}

		// Nowhere to go and nothing left to slow down: the soft stop has finished.
		if (target.x === 0 && target.y === 0 && velocity.x === 0 && velocity.y === 0)
		{
			stop();

			return;
		}

		frameId = requestAnimationFrame(step);
	}

	function start(): void
	{
		if (frameId !== null)
		{
			return;
		}

		frameId = requestAnimationFrame(step);
	}

	return { start, stop };
}

/**
 * Arrow keys drive the camera while they are held: the loop runs on animation frames at a constant
 * speed, with a short pull away on press and a soft stop on release. The keys belong to the diagram
 * only while the focus stands on one of its surfaces - the root, or the minimap the consumer places on
 * its own - so the arrows of the surrounding page stay the page's own, and a popup rendered into `body`
 * keeps them too.
 */
export function useKeyboardPan(): void
{
	const { isDisabledBlockDiagram, inputState, blockDiagramRef, canvasMapRef } = useBlockDiagram();
	const { panBy } = useCanvas();

	const heldKeys: Set<string> = new Set();
	let unsubscribes: Array<() => void> = [];

	// The right to pan, re-asked every frame and not only at the press: while the arrow is down the
	// diagram can be switched off, lose the focus, or hand it to a field - and no press edge says so.
	function canPan(): boolean
	{
		return !toValue(isDisabledBlockDiagram)
			&& !isEditableActiveElement()
			&& isFocusOnAnyOf([toValue(blockDiagramRef), toValue(canvasMapRef)]);
	}

	const panLoop = createPanLoop({
		getTarget: () => getTargetDirection(heldKeys),
		canRun: canPan,
		// Switched off or left behind mid-hold, the camera stops where it stands - no coasting out of a
		// diagram that can no longer hear the key released. The held set goes with it: the arrow that is
		// still down belongs to whoever holds the focus now.
		onCannotRun: () => heldKeys.clear(),
		panBy,
	});

	function handleHold(key: string, isPressed: boolean, event: KeyboardEvent | PointerEvent | null): void
	{
		if (isPressed)
		{
			if (hasModifier(event) || isInputEventTarget(event) || !canPan())
			{
				return;
			}

			heldKeys.add(key);
		}
		else
		{
			// A release always applies, whatever the focus is on and whatever state the diagram is in,
			// or the key would stick down and carry the camera away with it.
			heldKeys.delete(key);
		}

		// A release can leave another arrow held: two opposite ones cancel out and end the loop, and
		// letting go of one of them has to bring it back.
		if (heldKeys.size > 0 && canPan())
		{
			panLoop.start();
		}
	}

	// Runs on every keydown of an arrow, auto repeat included, and does the two things the edge channel
	// cannot. It answers the browser: edges alone would let the page under the diagram keep scrolling
	// through a hold, and the suppression is owed exactly while the canvas may pan - an arrow the
	// diagram does not use stays the property of the page. And it picks up a hold that began without
	// the right to pan: the focus came back to the canvas, or the diagram was switched on, while the
	// key was already down. No press edge is coming for that key, so without this it would stay dead
	// until released - taken from the page and moving nothing. Modifiers need no check here: a record
	// is matched by the whole combo, so `Ctrl+ArrowLeft` never reaches one made for `ArrowLeft`.
	function handleArrowKeyDown(key: string, event: KeyboardEvent): void
	{
		if (!canPan())
		{
			return;
		}

		event.preventDefault();

		if (!heldKeys.has(key))
		{
			heldKeys.add(key);
			panLoop.start();
		}
	}

	onMounted(() => {
		unsubscribes = subscribeModifiers(inputState, () => heldKeys.clear());
		unsubscribes.push(...Object.keys(PAN_KEYS).flatMap((key) => [
			// Edges only: the hold channel stays silent through the auto repeat of the keyboard, which
			// is what keeps the movement off the repeat rate of the operating system. A forced release -
			// the window losing focus, the tab going away, the input state being detached - arrives here
			// as a release as well.
			inputState.onChange(key, (isPressed, event) => handleHold(key, isPressed, event)),
			// Subscribed directly, not through `useKeyboardShortcuts`, which could take this record as
			// it stands: the two channels are one mechanism and the adapter owns only one of them, so
			// declaring half of it there would split a pair between two lifecycle owners. Direct
			// subscriptions are how the extension already does it - canvas-transform.js, search-bar.js.
			inputState.on([key], (event) => handleArrowKeyDown(key, event), { preventDefault: false }),
		]));
	});

	onUnmounted(() => {
		unsubscribes.forEach((unsubscribe) => unsubscribe());
		unsubscribes = [];
		heldKeys.clear();
		panLoop.stop();
	});
}
