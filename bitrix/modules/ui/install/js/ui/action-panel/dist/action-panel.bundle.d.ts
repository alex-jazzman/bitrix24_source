/* eslint-disable */
type ActionPanelOptions = {
	/** The container the panel is aligned with; the panel itself always lives in the document body. */
	renderTo: HTMLElement | (() => HTMLElement | null);
	items?: ActionPanelItemOptions[];
	maxHeight?: number | null;
	className?: string;
	ariaLabel?: string;
	showTotalSelected?: boolean;
	/**
	 * `data-*` attributes stamped on the container and on every popup the panel opens. A host that
	 * decides by DOM subtree needs them on the popups too: the tile grid drops its selection on any
	 * click outside a marked subtree, and its popups live in the document body.
	 */
	dataset?: {
		[key: string]: string;
	};
	/** Renders the control that drops the whole selection. It never joins the overflow set. */
	onResetAll?: () => void;
	/**
	 * Runs after the panel has been repositioned. The panel owns the only scroll and resize
	 * subscription of the pair, so a host with geometry of its own hangs it here instead of
	 * listening to the window separately and reading the same layout again.
	 */
	onGeometryChange?: () => void;
};

type ActionPanelItemOptions = {
	id?: string;
	/** Plain text: it goes in as a text node, so markup given here is shown literally. */
	text?: string;
	title?: string;
	/** Icon name from the `ui.icon-set.api.core` sets; an unknown name is ignored. */
	icon?: string;
	iconOnly?: boolean;
	href?: string;
	/**
	 * Only a function is accepted: the legacy string handler (a code string turned into an
	 * `onclick` attribute) stays in the `ui.actionpanel` adapter.
	 */
	onclick?: ActionPanelItemClickHandler;
	menuItems?: BX.UI.System.MenuItemOptions[];
	/**
	 * Whether a click on a menu item closes the menu of this item. `false` leaves it open, the way
	 * the legacy panel did for the items its host marked so. The item keeps the same behaviour when
	 * it is represented inside the "more" menu.
	 */
	closeOnItemClick?: boolean;
	disabled?: boolean;
	hidden?: boolean;
	className?: string;
	dataset?: {
		[key: string]: string;
	};
	/** `data-*` attributes for the popups this item opens; the panel passes its own set down. */
	popupDataset?: {
		[key: string]: string;
	};
	attributes?: {
		[key: string]: string;
	};
	useAirDesign?: boolean;
};

type ActionPanelItemClickHandler = (event: MouseEvent | null, item: BX.UI.ActionPanelItem) => void;

type PositionTrackerOptions = {
	parent: HTMLElement | (() => HTMLElement | null);
	maxHeight?: number | null;
	onApply: (metrics: PositionMetrics) => void;
	onModeChange?: ((fixed: boolean) => void) | null;
	/**
	 * Runs right after the position was applied. The tracker is the only owner of the scroll and
	 * resize subscriptions, so a consumer that needs its own geometry work hangs it here instead
	 * of listening to the window on its own and reading the same layout a second time.
	 */
	onGeometryChange?: (() => void) | null;
};

type PositionMetrics = {
	width: number;
	top: number;
	left: number;
};

type OverflowHost<TItem> = {
	getItems: () => TItem[];
	/**
	 * Runs once before every fit pass: the place for measurements shared by all items of the pass.
	 * `countsMoreBlock` tells whether the row of this pass is the one the "more" block shares its
	 * space with. The first pass always asks for the capacity the row would have without the block;
	 * a host that measures the row as it is may ignore the flag.
	 */
	beforeCollect?: (countsMoreBlock: boolean) => void;
	isNotFit: (item: TItem) => boolean;
	hasMoreBlock: () => boolean;
	addMoreBlock: () => void;
	removeMoreBlock: () => void;
};

declare namespace BX.UI {
	class ActionPanel {
		static getInstanceByNode(node: HTMLElement): ActionPanel | null;
		constructor(options: ActionPanelOptions);
		hasAirDesign(): boolean;
		getContainer(): HTMLElement;
		getItems(): ActionPanelItem[];
		getItemById(id: string): ActionPanelItem | null;
		getHiddenItems(): ActionPanelItem[];
		isShown(): boolean;
		addItems(items: ActionPanelItemOptions[]): ActionPanelItem[];
		appendItem(options: ActionPanelItemOptions): ActionPanelItem;
		removeItems(): void;
		setTotalSelectedItems(count: number): void;
		/** Recalculates the overflow against the current layout: the composition of the "more" menu follows. */
		refreshOverflow(): void;
		show(): void;
		hide(): void;
		destroy(): void;
	}

	class ActionPanelItem {
		constructor(options: ActionPanelItemOptions);
		getId(): string | null;
		getText(): string | null;
		hasMenu(): boolean;
		isSplit(): boolean;
		/**
		 * Only an item that reacts to a click deserves a native control: the rest stay plain labels
		 * and therefore never join the roving set of the toolbar.
		 */
		isInteractive(): boolean;
		isDisabled(): boolean;
		isHidden(): boolean;
		getContainer(): HTMLElement;
		show(): void;
		hide(): void;
		/** Set by the panel: the item does not fit the row and is represented by the "more" menu instead. */
		setOverflowHidden(overflowHidden: boolean): void;
		disable(): void;
		enable(): void;
		openMenu(): void;
		closeMenu(): void;
		/**
		 * Menu representation of the item. The legacy panel mutated the live item objects right before
		 * showing the popup; here the popup gets an independent mapping.
		 */
		getMenuItemOptions(): BX.UI.System.MenuItemOptions;
		destroy(): void;
	}

	/**
	 * Keeps the panel aligned with its parent container without observing the whole document.
	 * Replaces the legacy body-wide MutationObserver: geometry is tracked through ResizeObserver
	 * on the parent chain plus scroll and resize listeners.
	 */
	class PositionTracker {
		constructor(options: PositionTrackerOptions);
		resolveParent(): HTMLElement | null;
		isFixed(): boolean;
		setMaxHeight(maxHeight: number | null): void;
		/** Reports whether the tracking is on: a parent that resolves to nothing cannot be followed. */
		start(): boolean;
		stop(): void;
		refresh(): void;
		measure(parent: HTMLElement, fixed: boolean, rect?: DOMRect | null): PositionMetrics;
	}

	/**
	 * Single source of overflow logic for every fill path.
	 * The legacy panel had two divergent implementations: the resize handler was correct,
	 * while addItems dropped the "more" block whenever hidden items were present.
	 */
	class OverflowCalculator<TItem> {
		constructor(host: OverflowHost<TItem>);
		getHiddenItems(): TItem[];
		recalc(): TItem[];
		clear(): void;
	}
}
