import { Dom, Event, Extension, Loc, Tag, Text, Type } from 'main.core';
import { FocusKeys, FocusNavigator, FocusZone, InteractivityChecker, LiveAnnouncer } from 'ui.a11y';
import { Icon, Outline } from 'ui.icon-set.api.core';
import { Menu, type MenuOptions } from 'ui.system.menu';

import ActionPanelItem, { type ActionPanelItemOptions } from './item';
import MenuPopupDataset, { applyDataset, MENU_CLASS_NAME } from './menu-dataset';
import OverflowCalculator, { type OverflowHost } from './overflow';
import PositionTracker, { type PositionMetrics } from './position-tracker';
import './style.css';

import 'ui.design-tokens';
import 'ui.design-tokens.air';

export type ActionPanelOptions = {
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
	dataset?: { [key: string]: string };
	/** Renders the control that drops the whole selection. It never joins the overflow set. */
	onResetAll?: () => void;
	/**
	 * Runs after the panel has been repositioned. The panel owns the only scroll and resize
	 * subscription of the pair, so a host with geometry of its own hangs it here instead of
	 * listening to the window separately and reading the same layout again.
	 */
	onGeometryChange?: () => void;
};

const instanceMap: WeakMap<HTMLElement, ActionPanel> = new WeakMap();

// Sub-pixel layout leaves fractions of a pixel behind the right edge, so a whole pixel of slack.
const FIT_TOLERANCE: number = 1;

// About a second of frames: an ajax redraw brings the container back within a few of them, and a
// container that never comes back must not leave a retry running for the lifetime of the page.
const TRACKER_START_ATTEMPTS: number = 60;

export default class ActionPanel
{
	#renderTo: HTMLElement | (() => HTMLElement | null);
	#maxHeight: number | null;
	#className: string | null;
	#ariaLabel: string;
	#showTotalSelected: boolean;
	#dataset: { [key: string]: string };
	#onResetAll: (() => void) | null;
	#onGeometryChange: (() => void) | null;
	// The setting cannot change while the panel lives, and every item would ask for it otherwise.
	#airDesign: boolean;

	#container: HTMLElement;
	#itemsContainer: HTMLElement;
	#totalValueNode: HTMLElement | null = null;
	#totalSelected: number | null = null;
	#moreButton: HTMLElement | null = null;
	#resetButton: HTMLElement | null = null;

	#items: ActionPanelItem[] = [];
	#overflow: OverflowCalculator<ActionPanelItem>;
	#tracker: PositionTracker;
	#focusZone: FocusZone | null = null;
	/** Where the focus was when the panel appeared: it goes back there once the panel leaves. */
	#focusOrigin: HTMLElement | null = null;
	#moreMenu: Menu | null = null;
	#moreMenuId: string = `ui-air-action-panel-more-${Text.getRandom(12)}`;
	#menuPopupDataset: MenuPopupDataset;

	#shown: boolean = false;
	#destroyed: boolean = false;
	/**
	 * The geometry the `style` attribute of the container currently holds, not the last one measured:
	 * a write is skipped exactly while the attribute is known to say the same. Nothing can be assumed
	 * about the attribute of a panel that left the screen, so hide() drops the three of them.
	 */
	#lastWidth: number | null = null;
	#lastAppliedTop: number | null = null;
	#lastAppliedLeft: number | null = null;
	#overflowFrameId: number | null = null;
	#trackerStartFrameId: number | null = null;
	/** The right edge of the row, measured once per overflow pass. */
	#rowRight: number | null = null;

	static getInstanceByNode(node: HTMLElement): ActionPanel | null
	{
		return instanceMap.get(node) ?? null;
	}

	constructor(options: ActionPanelOptions)
	{
		this.#renderTo = options.renderTo;
		this.#maxHeight = Type.isNumber(options.maxHeight) ? (options.maxHeight as number) : null;
		this.#className = Type.isStringFilled(options.className) ? (options.className as string) : null;
		this.#ariaLabel = Type.isStringFilled(options.ariaLabel)
			? (options.ariaLabel as string)
			: (Loc.getMessage('JS_UI_ACTION_PANEL_ARIA_LABEL') ?? '');
		this.#showTotalSelected = options.showTotalSelected !== false;
		this.#dataset = Type.isPlainObject(options.dataset) ? (options.dataset as { [key: string]: string }) : {};
		this.#onResetAll = Type.isFunction(options.onResetAll) ? (options.onResetAll as () => void) : null;
		this.#onGeometryChange = Type.isFunction(options.onGeometryChange)
			? (options.onGeometryChange as () => void)
			: null;
		this.#airDesign = Extension.getSettings('ui.action-panel').get('useAirDesign') === true;

		this.#container = this.#renderContainer();
		this.#itemsContainer = Tag.render`
			<div class="ui-air-action-panel__items" data-testid="ui-action-panel-items"></div>
		`;

		if (this.#showTotalSelected)
		{
			Dom.append(this.#renderTotalBlock(), this.#container);
		}

		Dom.append(this.#itemsContainer, this.#container);

		if (this.#onResetAll !== null)
		{
			this.#resetButton = this.#renderResetButton();
			Dom.append(this.#resetButton, this.#container);
		}

		this.#menuPopupDataset = new MenuPopupDataset(this.#dataset);
		this.#overflow = new OverflowCalculator(this.#createOverflowHost());
		this.#tracker = new PositionTracker({
			parent: this.#renderTo,
			maxHeight: this.#maxHeight,
			onApply: this.#applyPosition,
			onModeChange: this.#applyFixedMode,
			onGeometryChange: this.#onGeometryChange,
		});

		instanceMap.set(this.#container, this);

		if (Type.isArrayFilled(options.items))
		{
			this.addItems(options.items as ActionPanelItemOptions[]);
		}
	}

	hasAirDesign(): boolean
	{
		return this.#airDesign;
	}

	getContainer(): HTMLElement
	{
		return this.#container;
	}

	getItems(): ActionPanelItem[]
	{
		return this.#items;
	}

	getItemById(id: string): ActionPanelItem | null
	{
		return this.#items.find((item) => item.getId() === id) ?? null;
	}

	getHiddenItems(): ActionPanelItem[]
	{
		return this.#overflow.getHiddenItems();
	}

	isShown(): boolean
	{
		return this.#shown;
	}

	addItems(items: ActionPanelItemOptions[]): ActionPanelItem[]
	{
		const created = items.map((options) => this.#createItem(options));

		this.#afterItemsChanged();

		return created;
	}

	appendItem(options: ActionPanelItemOptions): ActionPanelItem
	{
		const item = this.#createItem(options);

		this.#afterItemsChanged();

		return item;
	}

	removeItems(): void
	{
		// A menu closes synchronously and hands the focus back to its trigger, which is one of the
		// nodes about to leave. Closing the whole set first is what lets the retention below see the
		// focus where it really ends up, instead of finding it in a popup and letting it fall on the body.
		this.#items.forEach((item) => item.closeMenu());

		this.#retainFocus(this.#items.map((item) => item.getContainer()));

		this.#items.forEach((item) => item.destroy());
		this.#items = [];

		// Resetting the "more" block on a full cleanup is what keeps it from surviving as a ghost.
		this.#overflow.clear();
		this.#afterItemsChanged();
	}

	setTotalSelectedItems(count: number): void
	{
		if (!this.#totalValueNode || !Type.isNumber(count))
		{
			return;
		}

		// The host reports the total on every toggle of a single row, and most of those reports
		// carry the value the counter already shows. Only a real change is worth an announcement.
		if (count === this.#totalSelected)
		{
			return;
		}

		this.#totalSelected = count;
		this.#totalValueNode.textContent = String(count);

		LiveAnnouncer.announce(`${Loc.getMessage('JS_UI_ACTION_PANEL_SELECTED') ?? ''} ${count}`.trim());
	}

	/** Recalculates the overflow against the current layout: the composition of the "more" menu follows. */
	refreshOverflow(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		// A pending pass would repeat the work that is being done right now.
		this.#cancelScheduledOverflow();

		// The container the panel follows may appear later than the first show(): an ajax redraw
		// recreates it, and a callback given as `renderTo` resolves to nothing in between.
		if (this.#shown)
		{
			this.#tracker.start();
		}

		// The measurement needs the full row back: an item left out of it reports no geometry at all.
		this.#items.forEach((item) => item.setOverflowHidden(false));

		// The row clips its overflow, and focusing a control inside such a box scrolls it. A scrolled
		// row would report the right edge of an item that does not fit as if it did, so the pass
		// starts from the only state the row is ever meant to be in.
		this.#itemsContainer.scrollLeft = 0;

		const hidden = this.#overflow.recalc();

		// The "more" trigger is already in place by now, so it can take the focus of an item
		// that is about to leave the row.
		this.#retainFocus(hidden.map((item) => item.getContainer()));

		const hiddenSet = new Set(hidden);
		this.#items.forEach((item) => item.setOverflowHidden(hiddenSet.has(item)));

		// An item leaves the row through an inline style, which the zone does not observe. Without
		// the resync the single tab stop of the toolbar may stay on an item that is no longer visible.
		// One resync per pass is enough: the "more" block moves inside the very same pass.
		this.#focusZone?.refreshElements();
	}

	/**
	 * A whole pass reads and writes layout, so the paths that fire in bursts — a rebuilt set of
	 * items, a window being dragged — collapse into a single pass before the next frame.
	 */
	#scheduleOverflowRefresh(): void
	{
		if (this.#destroyed || this.#overflowFrameId !== null)
		{
			return;
		}

		this.#overflowFrameId = requestAnimationFrame(() => {
			this.#overflowFrameId = null;
			this.refreshOverflow();
		});
	}

	#cancelScheduledOverflow(): void
	{
		if (this.#overflowFrameId === null)
		{
			return;
		}

		cancelAnimationFrame(this.#overflowFrameId);
		this.#overflowFrameId = null;
	}

	/**
	 * A panel whose tracker has not started has no source of passes of its own: no scroll and resize
	 * subscription, no applied position, nothing to notice the container appearing. The container is
	 * usually recreated by an ajax redraw a few frames later, so the start is retried for a bounded
	 * number of frames instead of waiting for the host to ask for a pass on its own.
	 */
	#scheduleTrackerStart(attemptsLeft: number): void
	{
		if (this.#destroyed || this.#trackerStartFrameId !== null || attemptsLeft <= 0)
		{
			return;
		}

		this.#trackerStartFrameId = requestAnimationFrame(() => {
			this.#trackerStartFrameId = null;

			if (this.#destroyed || !this.#shown)
			{
				return;
			}

			if (this.#tracker.start())
			{
				// The panel has a width and a position at last, and the row is measured against them.
				this.refreshOverflow();

				return;
			}

			this.#scheduleTrackerStart(attemptsLeft - 1);
		});
	}

	#cancelScheduledTrackerStart(): void
	{
		if (this.#trackerStartFrameId === null)
		{
			return;
		}

		cancelAnimationFrame(this.#trackerStartFrameId);
		this.#trackerStartFrameId = null;
	}

	show(): void
	{
		if (this.#destroyed || this.#shown)
		{
			return;
		}

		if (!this.#container.isConnected)
		{
			// A direct child of the body with its own stacking context: no page container clips the panel.
			Dom.append(this.#container, document.body);
		}

		this.#focusOrigin = this.#resolveOuterActiveElement();

		this.#shown = true;
		this.#menuPopupDataset.start();
		Dom.addClass(this.#container, '--shown');

		if (!this.#tracker.start())
		{
			// A panel on the screen without a width, a position and a single subscription is the worst
			// of the outcomes, and only the consumer can tell why its container resolves to nothing.
			console.error('UI.ActionPanel: renderTo resolves to no node, the panel stays unpositioned');
			this.#scheduleTrackerStart(TRACKER_START_ATTEMPTS);
		}

		this.#setupFocusZone();
		// The first position the tracker applies schedules a pass of its own; this immediate one
		// takes its place, so the panel appears already measured and does it exactly once.
		this.refreshOverflow();
	}

	hide(): void
	{
		if (!this.#shown)
		{
			return;
		}

		this.#shown = false;
		this.#cancelScheduledOverflow();
		this.#cancelScheduledTrackerStart();
		this.#closeMenus();
		this.#menuPopupDataset.stop();
		this.#releaseFocus();
		Dom.removeClass(this.#container, '--shown');
		this.#tracker.stop();
		this.#focusZone?.deactivate();

		// The inline geometry stays on the node through the fade-out, but from here on it is nobody's
		// promise: the host may restyle or move the container while the panel is off the screen.
		this.#lastWidth = null;
		this.#lastAppliedTop = null;
		this.#lastAppliedLeft = null;
	}

	destroy(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		this.#destroyed = true;
		this.#shown = false;
		this.#cancelScheduledOverflow();
		this.#cancelScheduledTrackerStart();

		this.#closeMenus();
		this.#menuPopupDataset.stop();
		this.#releaseFocus();
		this.#moreMenu?.destroy();
		this.#moreMenu = null;

		this.#tracker.stop();
		this.#focusZone?.deactivate();
		this.#focusZone = null;

		this.#items.forEach((item) => item.destroy());
		this.#items = [];
		this.#overflow.clear();

		instanceMap.delete(this.#container);
		Dom.remove(this.#container);
	}

	#renderContainer(): HTMLElement
	{
		// Air color tokens resolve against the nearest context class. The panel is a child of the body,
		// so a dark portal theme would turn its background translucent and its text white. The panel
		// stays light in every theme, exactly as the legacy one did, hence the pinned content context.
		const container: HTMLElement = Tag.render`
			<div
				class="ui-air-action-panel --ui-context-content-light"
				role="toolbar"
				aria-orientation="horizontal"
				data-testid="ui-action-panel"
			></div>
		`;

		if (Type.isStringFilled(this.#ariaLabel))
		{
			Dom.attr(container, 'aria-label', this.#ariaLabel);
		}

		if (this.#className !== null)
		{
			Dom.addClass(container, this.#className);
		}

		if (this.hasAirDesign())
		{
			Dom.addClass(container, '--air');
		}

		if (this.#maxHeight !== null)
		{
			Dom.style(container, 'max-height', `${this.#maxHeight}px`);
		}

		this.#applyDataset(container);

		return container;
	}

	#applyDataset(node: HTMLElement | null): void
	{
		applyDataset(node, this.#dataset);
	}

	#renderResetButton(): HTMLElement
	{
		const button: HTMLElement = Tag.render`
			<button type="button" class="ui-air-action-panel__reset" data-testid="ui-action-panel-reset-btn"></button>
		`;

		Dom.attr(button, 'aria-label', Loc.getMessage('JS_UI_ACTION_PANEL_RESET') ?? '');
		new Icon({ icon: Outline.CROSS_M }).renderTo(button);

		Event.bind(button, 'click', (): void => this.#onResetAll?.());

		return button;
	}

	#renderTotalBlock(): HTMLElement
	{
		const label: HTMLElement = Tag.render`<span class="ui-air-action-panel__total-label"></span>`;
		label.textContent = Loc.getMessage('JS_UI_ACTION_PANEL_SELECTED') ?? '';

		this.#totalValueNode = Tag.render`
			<span
				class="ui-air-action-panel__total-value"
				data-role="action-panel-total-param"
				data-testid="ui-action-panel-total-value"
			></span>
		`;

		return Tag.render`
			<div class="ui-air-action-panel__total" data-role="action-panel-total" data-testid="ui-action-panel-total">
				${label}
				${this.#totalValueNode}
			</div>
		`;
	}

	#createItem(options: ActionPanelItemOptions): ActionPanelItem
	{
		const item = new ActionPanelItem({
			...options,
			useAirDesign: this.hasAirDesign(),
			popupDataset: this.#dataset,
		});

		this.#items.push(item);
		Dom.append(item.getContainer(), this.#itemsContainer);

		return item;
	}

	#afterItemsChanged(): void
	{
		this.#focusZone?.refreshElements();

		if (this.#shown)
		{
			// The host rebuilds the whole set through removeItems() + addItems(); a single pass
			// on the result of both is what the row needs, not one per call.
			this.#scheduleOverflowRefresh();
		}

		// Focus parked on the toolbar itself moves onto a real control as soon as one appears:
		// the host rebuilds the whole set on every change of the selection.
		if (FocusNavigator.getActiveElement(this.#container) === this.#container)
		{
			FocusNavigator.focusFirst(this.#container, { tabbableOnly: false, preventScroll: true });
		}
	}

	#createOverflowHost(): OverflowHost<ActionPanelItem>
	{
		return {
			getItems: (): ActionPanelItem[] => this.#items,
			// The row edge is the same for every item of a pass, so it is read once per pass
			// instead of once per item.
			beforeCollect: (countsMoreBlock: boolean): void => {
				this.#rowRight = this.#measureRowRight(countsMoreBlock);
			},
			isNotFit: (item: ActionPanelItem): boolean => this.#isNotFit(item),
			hasMoreBlock: (): boolean => this.#moreButton !== null,
			addMoreBlock: (): void => {
				// The reset control keeps the last position, so the trigger goes in front of it.
				if (this.#resetButton)
				{
					Dom.insertBefore(this.#getMoreButton(), this.#resetButton);
				}
				else
				{
					Dom.append(this.#getMoreButton(), this.#container);
				}
			},
			removeMoreBlock: (): void => {
				this.#moreMenu?.destroy();
				this.#moreMenu = null;

				if (this.#moreButton)
				{
					this.#retainFocus([this.#moreButton]);
				}

				Dom.remove(this.#moreButton);
				this.#moreButton = null;
			},
		};
	}

	/**
	 * The row never wraps, so an item reaching past its right edge is exactly the one that does not fit.
	 * The row itself gives the available width, and every pass takes the edge measured for it.
	 * An item with no geometry is either hidden by the host or the panel is not laid out yet.
	 */
	#isNotFit(item: ActionPanelItem): boolean
	{
		const rect = item.getContainer().getBoundingClientRect();

		if (rect.width <= 0)
		{
			return false;
		}

		const rowRight = this.#rowRight ?? this.#itemsContainer.getBoundingClientRect().right;

		return rect.right > rowRight + FIT_TOLERANCE;
	}

	/**
	 * The trigger is a sibling of the row, and the row is the only child of the panel that takes the
	 * free space, so the trigger narrows the row by exactly its own width. A pass that has to decide
	 * whether the trigger is needed at all measures the row as if it were already gone.
	 */
	#measureRowRight(countsMoreBlock: boolean): number
	{
		const rowRight = this.#itemsContainer.getBoundingClientRect().right;

		if (countsMoreBlock || this.#moreButton === null)
		{
			return rowRight;
		}

		return rowRight + this.#moreButton.getBoundingClientRect().width;
	}

	#getMoreButton(): HTMLElement
	{
		if (!this.#moreButton)
		{
			const button: HTMLElement = Tag.render`
				<button
					type="button"
					class="ui-air-action-panel__more"
					aria-haspopup="menu"
					aria-expanded="false"
					data-testid="ui-action-panel-more-btn"
				></button>
			`;
			button.textContent = Loc.getMessage('JS_UI_ACTION_PANEL_MORE') ?? '';

			Event.bind(button, 'click', this.#handleMoreClick);

			this.#moreButton = button;
		}

		return this.#moreButton;
	}

	#handleMoreClick = (): void => {
		// A menu button toggles (APG). The auto-hide of the popup only schedules its close, so the
		// menu opened by the very same trigger is still reported as shown while this handler runs.
		if (this.#moreMenu?.getPopup()?.isShown() === true)
		{
			this.#moreMenu.close();

			return;
		}

		// A fresh menu per opening: the composition follows the hidden items instead of mutating them.
		this.#moreMenu?.destroy();

		this.#moreMenu = new Menu({
			id: this.#moreMenuId,
			className: MENU_CLASS_NAME,
			items: this.getHiddenItems().map((item) => item.getMenuItemOptions()),
			events: {
				onShow: (): void => this.#setMoreExpanded(true),
				onClose: (): void => this.#setMoreExpanded(false),
			},
			// The menu option types declare every field required, so a partial set needs the cast.
		} as unknown as MenuOptions);

		this.#moreMenu.show(this.#getMoreButton());

		const popupContainer = this.#moreMenu.getPopup()?.getPopupContainer() ?? null;
		this.#applyDataset(popupContainer);

		if (popupContainer)
		{
			// ui.system.menu takes no attributes for its own items, so the popup is the hook for the whole menu.
			Dom.attr(popupContainer, 'data-testid', 'ui-action-panel-more-menu');
		}
	};

	#setMoreExpanded(expanded: boolean): void
	{
		if (this.#moreButton)
		{
			Dom.attr(this.#moreButton, 'aria-expanded', expanded ? 'true' : 'false');
		}
	}

	#closeMenus(): void
	{
		this.#moreMenu?.close();
		this.#items.forEach((item) => item.closeMenu());
	}

	/**
	 * Focus must not fall onto the body when the nodes holding it leave the toolbar. It goes to
	 * the next control of the row, then to the previous one — the "more" trigger and the reset
	 * control are part of that walk — and to the toolbar itself as the last resort.
	 */
	#retainFocus(leaving: HTMLElement[]): void
	{
		const active = FocusNavigator.getActiveElement(this.#container);
		if (active === null || !this.#container.contains(active))
		{
			return;
		}

		const isLeaving = (node: HTMLElement): boolean => leaving.some((el) => el === node || el.contains(node));
		if (!isLeaving(active))
		{
			return;
		}

		const options = {
			from: active,
			// The zone leaves a single tab stop behind, so the rest of the row is reachable
			// only with the tabbable filter off. The node being left stays acceptable as well:
			// the walker locates the starting point by it.
			tabbableOnly: false,
			preventScroll: true,
			accept: (el: HTMLElement): boolean => el === active || !isLeaving(el),
		};

		const target = FocusNavigator.getNext(this.#container, options)
			?? FocusNavigator.getPrevious(this.#container, options);

		if (target === null)
		{
			FocusNavigator.focusContainer(this.#container, options);

			return;
		}

		FocusNavigator.focusTarget(target, options);
	}

	/** The panel is leaving the screen: the focus goes back to its origin, never onto a dead node. */
	#releaseFocus(): void
	{
		const active = FocusNavigator.getActiveElement(this.#container);
		if (active === null || !this.#container.contains(active))
		{
			return;
		}

		if (this.#focusOrigin !== null && InteractivityChecker.isFocusable(this.#focusOrigin))
		{
			FocusNavigator.focusTarget(this.#focusOrigin, { preventScroll: true });

			return;
		}

		active.blur();
	}

	#resolveOuterActiveElement(): HTMLElement | null
	{
		if (FocusNavigator.isFocusLost(this.#container))
		{
			return null;
		}

		const active = FocusNavigator.getActiveElement(this.#container);

		return active !== null && !this.#container.contains(active) ? active : null;
	}

	// roving tabindex: the whole toolbar is a single tab stop, arrow keys move between its controls
	#setupFocusZone(): void
	{
		if (!this.#focusZone)
		{
			this.#focusZone = new FocusZone(this.#container, {
				bindKeys: FocusKeys.ArrowHorizontal | FocusKeys.HomeAndEnd,
				focusOutBehavior: 'stop',
				focusInStrategy: 'previous',
			});
		}

		this.#focusZone.activate();
	}

	#applyPosition = (metrics: PositionMetrics): void => {
		// Fixed mode is pinned to the viewport top, so the measured document top does not apply there.
		const top = this.#tracker.isFixed() ? 0 : metrics.top;

		// Scrolling a page whose geometry did not move reports the same values every frame, and
		// writing them back would invalidate styles for nothing.
		const style: { [key: string]: string } = {};

		if (metrics.width !== this.#lastWidth)
		{
			style.width = `${metrics.width}px`;
		}

		if (top !== this.#lastAppliedTop)
		{
			style.top = `${top}px`;
			this.#lastAppliedTop = top;
		}

		if (metrics.left !== this.#lastAppliedLeft)
		{
			style.left = `${metrics.left}px`;
			this.#lastAppliedLeft = metrics.left;
		}

		if (Object.keys(style).length > 0)
		{
			Dom.style(this.#container, style);
		}

		if (metrics.width !== this.#lastWidth)
		{
			this.#lastWidth = metrics.width;
			this.#scheduleOverflowRefresh();
		}
	};

	#applyFixedMode = (fixed: boolean): void => {
		Dom[fixed ? 'addClass' : 'removeClass'](this.#container, '--fixed');
	};
}
