import { Event } from 'main.core';
import { KEY_TOKEN } from '../../utils';

export type UnbindCancelPaths = () => void;

/**
 * The cancellations a gesture hears from outside its own pointer stream: Escape, a pointer the
 * browser took away and a window that lost focus. Escape belongs to the gesture for as long as it
 * lives: the key is taken before the layers above the canvas see it, and they get it back the
 * moment the gesture is over.
 */
export function bindCancelPaths(inputState: Object, cancel: () => void): UnbindCancelPaths
{
	const onPointerCancel = (): void => cancel();
	const onBlur = (): void => cancel();
	const unsubscribeEscape = inputState.onExclusive(KEY_TOKEN.ESCAPE, () => cancel());

	Event.bind(document, 'pointercancel', onPointerCancel);
	Event.bind(window, 'blur', onBlur);

	return (): void => {
		Event.unbind(document, 'pointercancel', onPointerCancel);
		Event.unbind(window, 'blur', onBlur);
		unsubscribeEscape();
	};
}
