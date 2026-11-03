import { toValue } from 'ui.vue3';

import { useBlockDiagram } from './block-diagram';
import { KEY_TOKEN } from '../utils';

export type UseCanvasFocus = {
	focusCanvas: () => boolean,
	returnFocusToCanvas: () => boolean,
	registerFocusScope: (element: HTMLElement | null) => void,
};

/**
 * The focus of the canvas as one rule for everyone who closes a tool of the diagram.
 *
 * Arrows, the shortcuts of the canvas and the reading order all start from the root: a tool closed
 * from the keyboard leaves the focus nowhere unless it hands it back. The handing back is allowed
 * only while nothing holds Escape - a claim still on the stack means a layer above the canvas is
 * open, and taking the focus from it would close the next press into the wrong thing.
 */
export function useCanvasFocus(): UseCanvasFocus
{
	const { blockDiagramRef, focusScopeRef, inputState } = useBlockDiagram();

	/**
	 * The consumer names the area the diagram answers an unclaimed Escape inside - its own editor
	 * and not the page around it. Declared once and given back with `null`; without a declaration
	 * the area is the root of the canvas, and a consumer that never declares one sees no change.
	 */
	function registerFocusScope(element: HTMLElement | null): void
	{
		focusScopeRef.value = element;
	}

	function focusCanvas(): boolean
	{
		const root = toValue(blockDiagramRef);

		if (!root)
		{
			return false;
		}

		root.focus({ preventScroll: true });

		return true;
	}

	function returnFocusToCanvas(): boolean
	{
		if (inputState.hasExclusiveClaims(KEY_TOKEN.ESCAPE))
		{
			return false;
		}

		return focusCanvas();
	}

	return {
		focusCanvas,
		returnFocusToCanvas,
		registerFocusScope,
	};
}
