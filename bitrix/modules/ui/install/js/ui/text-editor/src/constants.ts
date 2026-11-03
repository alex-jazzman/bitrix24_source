import { type NewLineModeType } from './types/new-line-mode-type';

/**
 * The bit that used to mark a node as holding text that may not be decorated. The nodes of this
 * extension declare it as UnformattedNode.isUnformatted() now; the constant stays exported, and
 * helpers/is-unformatted.ts still honours the bit, for a node class declared elsewhere.
 *
 * @deprecated declare isUnformatted() on the node instead
 */
export const UNFORMATTED = 1;

/**
 * Tells the slider of the portal not to take over a click on this link: the editor renders links
 * that lead outside the current slider, and the automatic binding would open them inside it.
 */
export const SLIDER_IGNORE_AUTOBINDING_ATTRIBUTE = 'data-slider-ignore-autobinding';

/**
 * A 1x1 fully transparent gif: the placeholder for an image that cannot be shown, and the drag
 * ghost that lets the editor draw its own.
 */
export const TRANSPARENT_GIF_SRC = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export const NewLineMode: Record<string, NewLineModeType> = {
	LINE_BREAK: 'line-break',
	PARAGRAPH: 'paragraph',
	MIXED: 'mixed',
};
