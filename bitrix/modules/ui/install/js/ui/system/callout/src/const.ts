import {
	PopoverAlignment,
	PopoverDesignContext,
	PopoverPosition,
	type PopoverPositioning,
} from 'ui.system.popover';

export const DEFAULT_WIDTH: number = 400;

// Class of the card on the service root of its popover. The appearance of the card is written on the group of
// the popover - the one node holding both the bubble and the arrow - and this class is what keeps those rules
// to the popovers of the callout alone, on a page carrying popovers of other components as well.
export const POPOVER_CLASS: string = 'ui-system-callout-popover';

// The narrowest card the layout holds, and the same figure whatever the card carries: one public minimum is
// what a consumer can hold in their head, and a card is filled after it has been given its width anyway. The
// figure is the agreed lower bound of the card - historically read off the fixed left column the layout used
// to carry, and a number of its own since the column came to be sized by its content.
export const MIN_WIDTH: number = 260;

// The merge base of every positioning snapshot. Frozen because the object is public: a consumer merging their
// own options over it must not change what the next instance starts from. whenAnchorHidden follows the
// effective mode - passive turns it into 'hide' (see Callout).
export const DEFAULT_POSITIONING: Readonly<PopoverPositioning> = Object.freeze({
	position: PopoverPosition.Bottom,
	alignment: PopoverAlignment.Center,
	pointer: true,
	slide: true,
	constrainSize: true,
	boundaryPadding: 8,
	whenAnchorHidden: 'close',
});

// The card is a dark surface standing over the page, so every Air token inside it - the background of the
// card, the text, the icons and the buttons - has to be read in the context of dark content and not in the
// one the page around the card happens to carry.
export const DEFAULT_DESIGN_CONTEXT: PopoverDesignContext = PopoverDesignContext.ContentDark;
