import { onMounted, onUnmounted, toValue } from 'ui.vue3';

import { useBlockDiagram } from './block-diagram';
import { useCanvasFocus } from './canvas-focus';
import { isFocusOnAnyOf, isKeyboardBusyByOverlay, KEY_TOKEN } from '../utils';

/**
 * The owner of an Escape nobody claimed.
 *
 * A tool closed by the key hands the focus back itself, but the press that closes nothing has no
 * owner: a catalog collapsed by its own shortcut holds the focus on a button, claims Escape from
 * nobody, and the next press used to land nowhere. The split by phases is the whole check of
 * "nobody claimed it" - a claim on the stack is taken by the capture channel, which stops the
 * propagation, so this handler is never even asked. Hence a plain subscription for the whole life
 * of the canvas: there is no moment at which the stack announces it has gone empty.
 *
 * The answer is bounded by the work area the consumer declares, because the bubbling channel
 * listens on the window and hears the page around the editor too. The area alone is not enough
 * against a popup of the core: it closes on `keyup` and lets the `keydown` through a frame earlier,
 * while the focus stands on the very trigger that opened it - a button of a toolbar inside the
 * area. The same guard every exclusive consumer of Escape keeps is asked here too, so the press
 * that closes the popup does not take the focus off the trigger it has to come back to.
 *
 * The browser action stays: Escape is a key of the browser, and the canvas claims nothing by moving
 * its own focus.
 */
export function useCanvasEscapeFallback(): void
{
	const { blockDiagramRef, focusScopeRef, inputState } = useBlockDiagram();
	const { returnFocusToCanvas } = useCanvasFocus();

	let unsubscribeEscape = null;

	function handleEscape(event: KeyboardEvent): void
	{
		// A held key repeats, and a repeat is the same press: the focus moves once.
		if (event.repeat === true)
		{
			return;
		}

		if (isKeyboardBusyByOverlay())
		{
			return;
		}

		if (!isFocusOnAnyOf([toValue(focusScopeRef) ?? toValue(blockDiagramRef)]))
		{
			return;
		}

		returnFocusToCanvas();
	}

	onMounted(() => {
		unsubscribeEscape = inputState.on(KEY_TOKEN.ESCAPE, handleEscape, { preventDefault: false });
	});

	onUnmounted(() => {
		unsubscribeEscape?.();
		unsubscribeEscape = null;
	});
}
