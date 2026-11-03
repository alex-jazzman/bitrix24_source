// Kept in JS on purpose: chef takes the package language from the entry point (src/index.js), so a
// lone .ts source inside this extension would not resolve.
import { useBlockDiagram } from './block-diagram';

export type UseSnapModifier = {
	isPressed: () => boolean,
};

const SNAP_MODIFIER_TOKEN = 'shift';

// Shift asks for snapping. Both mouse and keyboard events carry the flag, so a single predicate
// answers for a caller holding an event.
export function isSnapModifier(event: MouseEvent | KeyboardEvent | null): boolean
{
	return event?.shiftKey === true;
}

export function useSnapModifier(): UseSnapModifier
{
	const { inputState } = useBlockDiagram();

	// The hold is read from the input state, not off the frame event: a frame of the autoscroll
	// loop has no event of its own, so a key pressed over a motionless pointer would go unnoticed
	// until the pointer moves again. The state listens to the window, so it stays current anyway.
	//
	// The gestures that ask are driven by mouse events while the state corrects its modifiers on
	// pointer ones. That is in order, not by luck: the browser fires pointerdown/pointermove/
	// pointerup ahead of their mouse counterparts, so the state is already current when the gesture
	// reads it. A synthesized mouse event with no pointer event before it would read a stale
	// modifier - dispatch the pointer event too rather than reading shiftKey off the frame again.
	return {
		isPressed: (): boolean => inputState.isPressed(SNAP_MODIFIER_TOKEN),
	};
}
