export type ManagerOptions = {
	container: HTMLElement,
};

export type PanelState = 'expanded' | 'collapsed';

export type CollapsibleWidths = {
	expanded: number,
	collapsed: number,
};

// widths[k] = total content width when k buttons are collapsed.
// widths[0] — all expanded, widths[widths.length - 1] — all collapsed.
export type ButtonsWidths = number[];

export type LayoutMeasurements = {
	counter: CollapsibleWidths | null,
	nav: CollapsibleWidths | null,
	buttons: ButtonsWidths | null,
	leftButtons: ButtonsWidths | null,
};

export type LayoutTarget = {
	buttons: number,
	leftButtons: number,
	nav: PanelState,
	counter: PanelState,
};

export type Collapsible = {
	expand(): void,
	collapse(): void,
	isCollapsed(): boolean,
};

export type CollapsibleButtons = {
	getButtonCount(): number,
	setCollapsedCount(k: number): void,
};

export type RightButtons = Collapsible & CollapsibleButtons & {
	disableAutoCollapse(): void,
};
