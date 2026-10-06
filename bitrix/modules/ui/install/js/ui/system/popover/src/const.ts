// Physical side, like floating-ui placements: never mirrored under rtl, unlike the logical alignment.
export const PopoverPosition = Object.freeze({
	Top: 'top',
	Right: 'right',
	Bottom: 'bottom',
	Left: 'left',
});

export type PopoverPosition = typeof PopoverPosition[keyof typeof PopoverPosition];

// Logical alignment along the cross axis: the horizontal one mirrors under rtl (start <-> end),
// the vertical one (position left/right) never does.
export const PopoverAlignment = Object.freeze({
	Start: 'start',
	Center: 'center',
	End: 'end',
});

export type PopoverAlignment = typeof PopoverAlignment[keyof typeof PopoverAlignment];

export const PopoverStretch = Object.freeze({
	None: 'none',
	Width: 'width',
	MinWidth: 'min-width',
	Height: 'height',
});

export type PopoverStretch = typeof PopoverStretch[keyof typeof PopoverStretch];

export const PopoverStrategy = Object.freeze({
	Absolute: 'absolute',
	Fixed: 'fixed',
});

export type PopoverStrategy = typeof PopoverStrategy[keyof typeof PopoverStrategy];

// How the anchor cycle learns that the target has moved. 'observers' - the vendor observer set (scroll and
// resize of the surroundings, ResizeObserver and the move observer of the target itself); 'animation-frame'
// - a rect check on every frame, the only way to follow a target no observer reaches: a virtual anchor
// without contextElement, or one in continuous motion.
export const PopoverTracking = Object.freeze({
	Observers: 'observers',
	AnimationFrame: 'animation-frame',
});

export type PopoverTracking = typeof PopoverTracking[keyof typeof PopoverTracking];

// Air palette context. The value goes onto the root as the --ui-context-{value} class - an external Air
// convention, so the class keeps its name while the option is about the design side of the container.
export const PopoverDesignContext = Object.freeze({
	ContentLight: 'content-light',
	ContentDark: 'content-dark',
	EdgeLight: 'edge-light',
	EdgeDark: 'edge-dark',
});

export type PopoverDesignContext = typeof PopoverDesignContext[keyof typeof PopoverDesignContext];

// Depth of the arrow figure in images/arrow.svg: the size of the pointer box and of the mask across the
// popover side. Mirrored in popover.css - both places change together.
export const POINTER_DEPTH: number = 12;

// How deep the base of the figure sinks into the bubble. The joint of two separately rounded boxes opens a
// hairline of the page behind at a fractional page scale; the overlap closes it.
export const POINTER_OVERLAP: number = 1;

// What is left outside the bubble: the arrow protrusion beyond the popover side, hence the gap the popover
// keeps from the anchor on top of offset.main.
export const POINTER_PROTRUSION: number = POINTER_DEPTH - POINTER_OVERLAP;

// Width of the same figure, the one that runs along the popover side.
export const POINTER_WIDTH: number = 36;
