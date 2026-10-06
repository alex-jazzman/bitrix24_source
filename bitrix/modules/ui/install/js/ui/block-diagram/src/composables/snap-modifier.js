// Kept in JS on purpose: chef takes the package language from the entry point (src/index.js), so a
// lone .ts source inside this extension would not resolve.
import { Event } from 'main.core';

export type UseSnapModifier = {
	isPressed: () => boolean,
	sync: (event: MouseEvent) => void,
	startTracking: () => void,
	stopTracking: () => void,
};

// Shift asks for snapping. Both mouse and keyboard events carry the flag, so a single predicate
// answers for a caller holding an event and for the state tracked below.
export function isSnapModifier(event: MouseEvent | KeyboardEvent | null): boolean
{
	return event?.shiftKey === true;
}

// The modifier is tracked for the window, not read off the frame event: a frame of the autoscroll
// loop has no event of its own, so a key pressed over a motionless pointer would go unnoticed
// until the pointer moves again.
let isModifierPressed = false;
let trackerCount = 0;

const onKeyChange = (event: KeyboardEvent): void => {
	isModifierPressed = isSnapModifier(event);
};

// A window that loses focus never delivers the keyup, so a held modifier would stay pressed.
const onWindowBlur = (): void => {
	isModifierPressed = false;
};

function addTracker(): void
{
	trackerCount += 1;

	if (trackerCount > 1)
	{
		return;
	}

	Event.bind(window, 'keydown', onKeyChange);
	Event.bind(window, 'keyup', onKeyChange);
	Event.bind(window, 'blur', onWindowBlur);
}

function removeTracker(): void
{
	trackerCount -= 1;

	if (trackerCount > 0)
	{
		return;
	}

	Event.unbind(window, 'keydown', onKeyChange);
	Event.unbind(window, 'keyup', onKeyChange);
	Event.unbind(window, 'blur', onWindowBlur);
	isModifierPressed = false;
}

export function useSnapModifier(): UseSnapModifier
{
	// The listeners live only while a gesture needs them: every consumer keeps its own
	// subscription, so it is released exactly once whatever ends the gesture.
	let isTracking = false;

	return {
		isPressed: (): boolean => isModifierPressed,
		// A mouse event carries the modifier itself, so every frame corrects the tracked state -
		// including a Shift toggled while the window was out of focus.
		sync: (event: MouseEvent): void => {
			isModifierPressed = isSnapModifier(event);
		},
		startTracking: (): void => {
			if (isTracking)
			{
				return;
			}

			isTracking = true;
			addTracker();
		},
		stopTracking: (): void => {
			if (!isTracking)
			{
				return;
			}

			isTracking = false;
			removeTracker();
		},
	};
}
