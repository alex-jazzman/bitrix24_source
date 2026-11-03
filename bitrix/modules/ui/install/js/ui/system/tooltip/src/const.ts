// Preferred physical side of the target the bubble is put on. Never mirrored under rtl; the side the
// tooltip ends up on may differ - it moves to the opposite one when the preferred one does not fit.
export const TooltipPosition = Object.freeze({
	Top: 'top',
	Right: 'right',
	Bottom: 'bottom',
	Left: 'left',
});

export type TooltipPosition = typeof TooltipPosition[keyof typeof TooltipPosition];

// What makes the tooltip appear. The modes combine, except Manual: it is the absence of any automatic
// subscription, so the tooltip is shown and hidden by the place of use alone.
export const TooltipTrigger = Object.freeze({
	Hover: 'hover',
	Click: 'click',
	Focus: 'focus',
	Manual: 'manual',
});

export type TooltipTrigger = typeof TooltipTrigger[keyof typeof TooltipTrigger];

// What a tooltip falls back to where nothing names anything. Read from here by both surfaces: the markup one
// writes the values out instead of leaving them to the merge of the class, and the two must not drift apart.
export const DEFAULT_POSITION: TooltipPosition = TooltipPosition.Top;

export const DEFAULT_TRIGGER: readonly TooltipTrigger[] = Object.freeze([
	TooltipTrigger.Hover,
	TooltipTrigger.Focus,
]);

// The ceiling of the width the stylesheet of the extension writes on the bubble, px. Repeated here so that
// the option can be told from its default: a width equal to this one is left to the stylesheet, and a bubble
// nobody asked a width of carries no inline style at all - exactly the node it carried before the option
// existed. The Vue surface writes the same value out as the default of its prop, and reads it from here.
export const DEFAULT_MAX_WIDTH: number = 400;
