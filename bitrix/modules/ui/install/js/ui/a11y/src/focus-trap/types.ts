export type InitialFocus = 'first-tabbable' | 'container' | string | boolean | (() => HTMLElement | null);
export type FocusBoundaryTarget = string | HTMLElement | (() => HTMLElement | null);
export type RestoreFocus = boolean | string | HTMLElement | (() => HTMLElement | null);

export type FocusTrapOptions = {
	initialFocus?: InitialFocus | InitialFocus[];
	forceInitialFocus?: boolean;
	restoreFocus?: RestoreFocus;
	preventScroll?: boolean;
	suppressFocusOnRestore?: boolean; // for old widgets
	isolateOutside?: boolean;
	outsideExceptionSelectors?: string[];
	looped?: boolean;
	startBoundary?: FocusBoundaryTarget;
	endBoundary?: FocusBoundaryTarget;
};
