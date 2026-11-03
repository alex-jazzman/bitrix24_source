import { Event } from 'main.core';
import { nextTick, onBeforeUnmount, toValue, watch } from 'ui.vue3';

import { useBlockDiagram } from '../block-diagram';
import { isSnapModifier, useSnapModifier } from '../snap-modifier';
import { bindCancelPaths, type UnbindCancelPaths } from './cancel-paths';
import { MOUSE_BUTTON } from '../../constants';
import { type DiagramBlockId, type Point } from '../../types';

// Where the frame came from: a real pointer move, the autoscroll loop with the pointer standing
// still, or the release.
export const GESTURE_FRAME = Object.freeze({
	POINTER: 'pointer',
	CAMERA: 'camera',
	RELEASE: 'release',
});

export type GestureFrameSource = 'pointer' | 'camera' | 'release';

export type GestureSpec = {
	// Screen distance the pointer has to travel before anything is drawn, and the distance the
	// autoscroll waits for. Zero means the press is unambiguous: no click to tell the gesture from.
	threshold: number,
	// The nodes the gesture leads, or null when there is nothing to lead: an empty composition
	// refuses the press.
	resolveTargets: (event: MouseEvent) => Array<DiagramBlockId> | null,
	// Whether the gesture raises the nodes it leads above the rest of the canvas. Asked once, at
	// the press, over the composition already resolved - never in a frame of the movement. A spec
	// that leaves it out raises nothing.
	elevatesTargets?: (targetIds: Array<DiagramBlockId>) => boolean,
	// Draws the frame the gesture has already applied into the markup again. Called once per
	// gesture, on the render that carries the raise: that render re-applies the style object of
	// every participant, and a participant the spec does not lead through the model keeps its
	// position in the markup alone. A spec that raises nothing is never asked.
	redrawMarkup?: () => void,
	// `point` carries the camera travel of the autoscroll already; `client` is the raw pointer. A
	// gesture whose arithmetic reads the live camera takes `client`, or it counts that travel twice.
	applyFrame: (
		point: Point,
		isSnapRequested: boolean,
		source: GestureFrameSource,
		client: Point,
	) => boolean,
	revert: () => void,
	commit: () => boolean,
	alignToModel: () => void,
	onOpen: () => void,
	onClose: () => void,
};

export type UseGestureRunner = {
	start: (event: MouseEvent) => void,
};

type GestureHandlers = {
	mouseMove: (event: MouseEvent) => void,
	mouseUp: (event: MouseEvent) => void,
	unbindCancelPaths: UnbindCancelPaths,
};

type Gesture = {
	token: number,
	downClient: Point,
	lastClient: Point,
	// Camera travel of the autoscroll: the pointer stands still while the camera pans, so the frame
	// is drawn from the pointer shifted by it. The threshold is judged against the raw pointer.
	cameraOffset: Point,
	isDragStarted: boolean,
	// The answer of the spec predicate, taken at the press over the composition it resolved. It
	// reaches the state only when the press turns into a drag.
	isElevated: boolean,
	// Whether the last drawn frame was snapped: the release commits the position that frame drew.
	isLastFrameSnapped: boolean,
	hasAppliedFrame: boolean,
	isClosing: boolean,
	handlers: GestureHandlers | null,
};

/**
 * The lifecycle every canvas gesture shares: entry guards, threshold, subscriptions, cancellation,
 * release and commit. What each gesture does differently it says through its spec.
 */
// eslint-disable-next-line max-lines-per-function
export function useGestureRunner(spec: GestureSpec): UseGestureRunner
{
	const {
		isDisabledBlockDiagram,
		zoom,
		canvas,
		setGestureBlocks,
		resetGestureBlocks,
		setGestureElevated,
		resetGestureElevated,
		startAutoScroll,
		stopAutoScroll,
		updateMousePosition,
		inputState,
		hooks,
	} = useBlockDiagram();
	const snapModifier = useSnapModifier();

	let activeGesture: Gesture | null = null;
	// One counter for the gesture and for the reconciliation: a handler or a reconciliation left
	// over from a gesture that is gone finds the counter moved on and does nothing.
	let gestureToken = 0;

	function getActiveGesture(token: number): Gesture | null
	{
		if (activeGesture?.token !== token || activeGesture.isClosing)
		{
			return null;
		}

		return activeGesture;
	}

	function isBeyondThreshold(gesture: Gesture, clientX: number, clientY: number): boolean
	{
		if (spec.threshold <= 0)
		{
			return true;
		}

		return Math.abs(clientX - gesture.downClient.x) >= spec.threshold
			|| Math.abs(clientY - gesture.downClient.y) >= spec.threshold;
	}

	function applyFrame(
		clientX: number,
		clientY: number,
		isSnapRequested: boolean,
		source: GestureFrameSource,
	): void
	{
		activeGesture.lastClient = { x: clientX, y: clientY };
		activeGesture.isLastFrameSnapped = isSnapRequested;

		const point = {
			x: clientX + activeGesture.cameraOffset.x,
			y: clientY + activeGesture.cameraOffset.y,
		};

		if (spec.applyFrame(point, isSnapRequested, source, { x: clientX, y: clientY }) === true)
		{
			activeGesture.hasAppliedFrame = true;
		}
	}

	function bindGestureHandlers(): void
	{
		const token = activeGesture.token;
		const handlers = {
			mouseMove: (event: MouseEvent) => handleMouseMove(token, event),
			mouseUp: (event: MouseEvent) => finishGesture(token, event),
			unbindCancelPaths: bindCancelPaths(inputState, () => cancelGesture(token)),
		};

		activeGesture.handlers = handlers;

		// The window rather than the document: a mouseup dispatched on it by a consumer or by
		// `BX.fireEvent` never travels down, and a gesture that misses its release stays live.
		Event.bind(window, 'mousemove', handlers.mouseMove);
		Event.bind(window, 'mouseup', handlers.mouseUp);
	}

	function unbindGestureHandlers(): void
	{
		const handlers = activeGesture.handlers;

		if (handlers === null)
		{
			return;
		}

		Event.unbind(window, 'mousemove', handlers.mouseMove);
		Event.unbind(window, 'mouseup', handlers.mouseUp);
		handlers.unbindCancelPaths();
		activeGesture.handlers = null;
	}

	// The adapter winds its own side down first, while the shared machinery still stands - but the
	// teardown is not the adapter's to skip: the gesture holds Escape over the whole page, and a
	// spec hook that throws would leave that claim standing until the tab is reloaded.
	function closeGesture(): void
	{
		try
		{
			try
			{
				spec.onClose();
			}
			finally
			{
				// The loop of the autoscroll re-arms itself every frame and stops on nothing else:
				// left running, it carries the camera away until the tab is reloaded.
				stopAutoScroll();
			}
		}
		finally
		{
			unbindGestureHandlers();
			// The nodes are held in the visible set until the last command has gone out: released
			// earlier, they would be judged by the pre-gesture boxes the spatial index still holds.
			resetGestureBlocks();
			// Beside the composition on purpose: Escape, a lost pointer, a lost focus, a disabled
			// and an unmounted diagram all close here, and the raise must not outlive any of them.
			resetGestureElevated();
			activeGesture = null;
		}
	}

	function cancelActiveGesture(): void
	{
		if (activeGesture === null || activeGesture.isClosing)
		{
			return;
		}

		activeGesture.isClosing = true;

		// The cancellation is not the revert's to skip: a consumer hook that throws would leave the
		// gesture live, with the listeners bound and the key held.
		try
		{
			spec.revert();
		}
		finally
		{
			closeGesture();
		}
	}

	function cancelGesture(token: number): void
	{
		if (getActiveGesture(token) === null)
		{
			return;
		}

		cancelActiveGesture();
	}

	// Precondition of the extension: the consumer applies `changedBlocks` within this same flush
	// cycle - the model is read once here, and a command applied later misses the alignment.
	function scheduleAlignToModel(gesture: Gesture): void
	{
		const token = gesture.token;

		void nextTick(() => {
			if (token !== gestureToken || activeGesture !== null)
			{
				return;
			}

			spec.alignToModel();
		});
	}

	// The press turns into a drag here, and only here does the raise reach the state: below the
	// threshold the press is still a click, and a click that raised its composition for as long as
	// the button is down would throw the backdrop over the schema and take it back at once.
	function startDrag(gesture: Gesture): void
	{
		gesture.isDragStarted = true;

		if (!gesture.isElevated)
		{
			return;
		}

		setGestureElevated(true);

		// The raise reaches the markup on the render that follows this task, and that render
		// re-applies the style object of every participant - its position among it. The frame drawn
		// in this same task lives in the markup alone for every participant the spec does not lead
		// through the model, so it is drawn again once the render is over.
		void nextTick(() => {
			if (getActiveGesture(gesture.token) === null)
			{
				return;
			}

			spec.redrawMarkup?.();
		});
	}

	function handleMouseMove(token: number, event: MouseEvent): void
	{
		const gesture = getActiveGesture(token);

		if (gesture === null)
		{
			return;
		}

		if (toValue(isDisabledBlockDiagram))
		{
			cancelGesture(token);

			return;
		}

		// Below the threshold the press is still a click on the selection.
		if (!gesture.isDragStarted)
		{
			if (!isBeyondThreshold(gesture, event.clientX, event.clientY))
			{
				return;
			}

			startDrag(gesture);
		}

		updateMousePosition(event);
		applyFrame(event.clientX, event.clientY, snapModifier.isPressed(), GESTURE_FRAME.POINTER);
	}

	function finishGesture(token: number, event: MouseEvent): void
	{
		const gesture = getActiveGesture(token);

		if (gesture === null)
		{
			return;
		}

		// The watcher on the disabled state is flushed before the render, so a diagram disabled in
		// this very tick has not reached it yet.
		if (toValue(isDisabledBlockDiagram))
		{
			cancelGesture(token);

			return;
		}

		// A mouseup can arrive with no coordinates at all - a plain `Event('mouseup')` from a
		// consumer. Applied as a frame it would put NaN into the geometry, the ports and the model.
		if (!Number.isFinite(event.clientX) || !Number.isFinite(event.clientY))
		{
			cancelGesture(token);

			return;
		}

		// A mouseup can carry a position no mousemove has seen, so the threshold is judged against
		// the release point as well. A gesture with no threshold has nothing to promote.
		const hasDrawnFrame = gesture.isDragStarted;

		if (!hasDrawnFrame && spec.threshold > 0 && isBeyondThreshold(gesture, event.clientX, event.clientY))
		{
			startDrag(gesture);
		}

		if (gesture.isDragStarted)
		{
			// The modifier is taken from the last drawn frame: Shift released an instant before the
			// button would part the committed position from the drawn one.
			applyFrame(
				event.clientX,
				event.clientY,
				hasDrawnFrame ? gesture.isLastFrameSnapped : isSnapModifier(event),
				GESTURE_FRAME.RELEASE,
			);
		}

		gesture.isClosing = true;
		let hasWrittenModel = false;

		// The release is not the commit's to skip: a consumer hook that throws would leave the
		// gesture live, with the listeners bound and the nodes held.
		try
		{
			if (gesture.hasAppliedFrame)
			{
				hasWrittenModel = spec.commit() === true;
			}
		}
		finally
		{
			closeGesture();
		}

		if (hasWrittenModel)
		{
			// Every gesture reports its own end here; one that wrote nothing reports nothing.
			hooks.endGesture.trigger();
			scheduleAlignToModel(gesture);
		}
	}

	// A readonly template or an animation, any button but the left one, and a gesture still open:
	// restarting would lose the nodes the open one carries.
	function acceptsPress(event: MouseEvent): boolean
	{
		return event.button === MOUSE_BUTTON.LEFT
			&& !toValue(isDisabledBlockDiagram)
			&& activeGesture === null;
	}

	function start(event: MouseEvent): void
	{
		if (!acceptsPress(event))
		{
			return;
		}

		event.stopPropagation();

		// Must run before the gesture reads zoom and its anchor point below: a camera transition
		// still in flight would keep changing both and drag nodes out from under the pointer.
		canvas.cancelCameraTransition();

		const targets = spec.resolveTargets(event);

		if (targets === null || targets.length === 0)
		{
			return;
		}

		// The zoom divides the pointer delta: a zero or non-finite one turns it into NaN.
		const currentZoom = toValue(zoom);

		if (!Number.isFinite(currentZoom) || currentZoom <= 0)
		{
			return;
		}

		const gesture: Gesture = {
			token: ++gestureToken,
			downClient: { x: event.clientX, y: event.clientY },
			lastClient: { x: event.clientX, y: event.clientY },
			cameraOffset: { x: 0, y: 0 },
			isDragStarted: false,
			isElevated: false,
			isLastFrameSnapped: false,
			hasAppliedFrame: false,
			isClosing: false,
			handlers: null,
		};

		activeGesture = gesture;
		// The nodes of the gesture reach the model only on mouseup, so culling must judge none of
		// them by the pre-gesture box the spatial index still holds.
		setGestureBlocks(targets);
		// Asked once, here, over the composition just resolved - the answer waits for the threshold
		// and reaches the state in startDrag().
		gesture.isElevated = spec.elevatesTargets?.(targets) === true;
		spec.onOpen();

		// The press only arms the autoscroll; the loop starts when the gesture first reports the
		// pointer - so the camera cannot pan under a press that is still a click on the selection.
		startAutoScroll(event, (deltaX: number, deltaY: number) => {
			const currentGesture = getActiveGesture(gesture.token);

			if (currentGesture === null)
			{
				return;
			}

			currentGesture.cameraOffset.x += deltaX;
			currentGesture.cameraOffset.y += deltaY;

			applyFrame(
				currentGesture.lastClient.x,
				currentGesture.lastClient.y,
				snapModifier.isPressed(),
				GESTURE_FRAME.CAMERA,
			);
		});

		bindGestureHandlers();
	}

	watch(isDisabledBlockDiagram, (isDisabled: boolean) => {
		if (isDisabled)
		{
			cancelActiveGesture();
		}
	});

	// A gesture torn down without a mouseup would leave the markup where the pointer left it. The
	// token is bumped on top: the alignment of a release is a microtask and must not outlive it.
	onBeforeUnmount(() => {
		++gestureToken;
		cancelActiveGesture();
	});

	return { start };
}
