import { Animation, Dom, Reflection, Type } from 'main.core';
import { setActivePinia, type Pinia } from 'ui.vue3.pinia';

import { ObjectTypeFilter, SEARCH_DEBOUNCE_MS, SearchQueryLength } from '../../const/picker';
import { type NormalizedFilterValues } from '../../const/types';
import { applyFilters } from '../../feature/apply-filter/apply-filter';
import { searchItems, type SearchDeps } from '../../feature/search-items/search-items';
import {
	applyFindSuppressed,
	FilterFieldId,
	readInitialFilterValues,
} from '../../lib/filter-adapter/filter-adapter';
import { useItemStore } from '../../model/item/item';
import { useSessionStore } from '../../model/session/session';

type FilterApi = {
	setFields?: (fields: { [key: string]: any }) => void,
	apply?: () => void,
};

type StandardFilterSearch = {
	getContainer?: () => HTMLElement | null,
};

type StandardFilterPopup = {
	isShown?: () => boolean,
	subscribeOnce?: (eventName: string, listener: () => void) => void,
};

type StandardFilter = {
	getFilterFieldsValues?: () => { [key: string]: any },
	getApi?: () => FilterApi,
	resetFilter?: () => any,
	popup?: StandardFilterPopup,
	closePopup?: () => void,
	showPopup?: () => void,
	getSearch?: () => StandardFilterSearch | null,
};

type CustomEventBus = {
	addCustomEvent: (target: any, name: string, handler: Function) => void,
	removeCustomEvent: (target: any, name: string, handler: Function) => void,
};

const APPLY_EVENT = 'BX.Main.Filter:apply';
// Fired at the click; `apply` follows only after the component has saved its preset.
const BEFORE_APPLY_EVENT = 'BX.Main.Filter:beforeApply';
// A failed preset save never reaches `apply`; the dim blocks the rows, so it cannot outlive this.
const BEFORE_APPLY_DIM_TIMEOUT_MS = 10000;
// Added by `showPopup()` and removed at once by `closePopup()`, before the close animation.
const SEARCH_SHOWED_CLASS = 'main-ui-filter-search--showed';

function getCustomEventBus(): CustomEventBus | null
{
	const bx = Reflection.getClass('BX') as CustomEventBus | null;
	if (bx && Type.isFunction(bx.addCustomEvent) && Type.isFunction(bx.removeCustomEvent))
	{
		return bx;
	}

	return null;
}

function getFilterById(filterId: string): StandardFilter | null
{
	const manager = Reflection.getClass('BX.Main.filterManager') as { getById?: (id: string) => any } | null;
	if (manager && Type.isFunction(manager.getById))
	{
		return (manager.getById(filterId) as StandardFilter | null) ?? null;
	}

	return null;
}

function getSearchContainer(filter: StandardFilter): HTMLElement | null
{
	if (!Type.isFunction(filter.getSearch))
	{
		return null;
	}

	const search = filter.getSearch();

	return search && Type.isFunction(search.getContainer) ? search.getContainer() : null;
}

// `Animation.waitAnimationEnd` calls `getAnimations` unguarded; skip nodes that lack it.
function collectAnimatableAncestors(element: HTMLElement | null): HTMLElement[]
{
	const elements: HTMLElement[] = [];
	let node: HTMLElement | null = element;
	while (node)
	{
		if (Type.isFunction(node.getAnimations))
		{
			elements.push(node);
		}
		node = node.parentElement;
	}

	return elements;
}

// `Animation` reached main.core after main 26.900.0, the oldest core this bundle runs on;
// without it the popup opens right away instead of failing on the missing helper.
function waitSearchAnimationsEnd(container: HTMLElement | null): Promise<void[]>
{
	if (!Type.isFunction(Animation?.waitAnimationEnd))
	{
		return Promise.resolve([]);
	}

	return Promise.all(
		collectAnimatableAncestors(container).map((element) => Animation.waitAnimationEnd(element)),
	);
}

function isPopupShown(popup: StandardFilterPopup | undefined): popup is StandardFilterPopup
{
	return Boolean(popup && Type.isFunction(popup.isShown) && popup.isShown());
}

function filtersDiffer(a: NormalizedFilterValues, b: NormalizedFilterValues): boolean
{
	return a.objectTypeFilter !== b.objectTypeFilter
		|| a.fileTypeFilters.length !== b.fileTypeFilters.length
		|| a.fileTypeFilters.some((alias, index) => alias !== b.fileTypeFilters[index]);
}

// Thin bridge between the standard `bitrix:main.ui.filter` and the picker's search
// and filter scenarios. It listens only to its own FILTER_ID, normalizes the
// component values (including the 255 code-point bound and the folders/fileTypes
// reset) and calls the existing features. It also owns the programmatic FIND clear
// used by navigation and the reset used by the empty state, suppressing the apply
// event they generate so no extra request fires. It does not own the filter DOM
// lifecycle - the facade relocates and returns the search container.
export class MainUiFilterAdapter
{
	#filterId: string;
	#pinia: Pinia;
	#deps: SearchDeps;
	#bus: CustomEventBus | null = null;
	#handler: ((...args: any[]) => void) | null = null;
	#beforeApplyHandler: ((...args: any[]) => void) | null = null;
	#dimmedBeforeApply: boolean = false;
	#dimTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
	#unsubscribeSession: (() => void) | null = null;
	#debounceTimer: ReturnType<typeof setTimeout> | null = null;
	#showPopupTimer: ReturnType<typeof setTimeout> | null = null;
	#showPopupGeneration: number = 0;
	#suppressing: boolean = false;
	#previous: NormalizedFilterValues;

	constructor(filterId: string, pinia: Pinia, deps: SearchDeps, initial: NormalizedFilterValues)
	{
		this.#filterId = filterId;
		this.#pinia = pinia;
		this.#deps = deps;
		// The facade already read and normalized the restored values before the first
		// request; adopt them as the baseline so the initial apply is not re-dispatched.
		this.#previous = cloneValues(initial);
	}

	subscribe(): void
	{
		if (!this.#unsubscribeSession)
		{
			const session = useSessionStore(this.#pinia);
			let previousSearchOpen = session.searchOpen;
			this.#unsubscribeSession = session.$subscribe((_mutation, state) => {
				const searchCollapsed = previousSearchOpen && !state.searchOpen;
				const searchExpanded = !previousSearchOpen && state.searchOpen;
				previousSearchOpen = state.searchOpen;
				if (searchCollapsed)
				{
					this.#cancelScheduledShowPopup();
					this.#closePopup();
				}
				else if (searchExpanded)
				{
					this.#scheduleShowPopup();
				}
			}, { flush: 'sync' });
		}

		const bus = getCustomEventBus();
		if (!bus || this.#handler)
		{
			return;
		}

		this.#bus = bus;
		this.#beforeApplyHandler = (filterId: string): void => {
			if (filterId !== this.#filterId || this.#suppressing)
			{
				return;
			}

			this.#dimBeforeApply();
		};
		bus.addCustomEvent(window, BEFORE_APPLY_EVENT, this.#beforeApplyHandler);
		this.#handler = (filterId: string): void => {
			if (filterId !== this.#filterId || this.#suppressing)
			{
				return;
			}

			// A user apply (Enter, preset) means the filter is already in use: an open
			// still pending from the search expand would land over the results.
			this.#cancelScheduledShowPopup();
			if (this.#filtersChanged() || this.#dimmedBeforeApply)
			{
				// A click (preset, chip) or an already dimmed list skips the typing debounce.
				this.#cancelScheduledProcess();
				this.#process();

				return;
			}
			this.#scheduleProcess();
		};
		bus.addCustomEvent(window, APPLY_EVENT, this.#handler);
	}

	// Covers the preset save between the click and `apply`. A load already running
	// owns the loading state, so only a settled non-empty list is dimmed.
	#dimBeforeApply(): void
	{
		const session = useSessionStore(this.#pinia);
		if (!session.isSessionActive() || session.contentLoading || session.contentError !== null)
		{
			return;
		}

		const count = useItemStore(this.#pinia).count;
		if (count === 0)
		{
			return;
		}

		session.setPreserveContentOnLoading(true);
		session.setLoading(true);
		this.#dimmedBeforeApply = true;
		this.#cancelDimTimeout();
		this.#dimTimeoutTimer = setTimeout(() => {
			this.#dimTimeoutTimer = null;
			this.#undimBeforeApply();
		}, BEFORE_APPLY_DIM_TIMEOUT_MS);
	}

	#undimBeforeApply(): void
	{
		this.#cancelDimTimeout();
		if (!this.#dimmedBeforeApply)
		{
			return;
		}

		this.#dimmedBeforeApply = false;
		useSessionStore(this.#pinia).setLoading(false);
	}

	#cancelDimTimeout(): void
	{
		if (this.#dimTimeoutTimer !== null)
		{
			clearTimeout(this.#dimTimeoutTimer);
			this.#dimTimeoutTimer = null;
		}
	}

	dispose(): void
	{
		this.#cancelScheduledProcess();

		this.#cancelScheduledShowPopup();

		if (this.#bus && this.#handler)
		{
			this.#bus.removeCustomEvent(window, APPLY_EVENT, this.#handler);
		}
		if (this.#bus && this.#beforeApplyHandler)
		{
			this.#bus.removeCustomEvent(window, BEFORE_APPLY_EVENT, this.#beforeApplyHandler);
		}
		this.#handler = null;
		this.#beforeApplyHandler = null;
		this.#bus = null;
		this.#undimBeforeApply();

		this.#unsubscribeSession?.();
		this.#unsubscribeSession = null;
	}

	// Clears the visible FIND and suppresses exactly the apply it generates, so a
	// navigation feed change fires a single request. The next real user apply runs
	// normally.
	clearFindSuppressed(): void
	{
		const filter = getFilterById(this.#filterId);
		if (!filter)
		{
			return;
		}

		this.#runSuppressed(() => applyFindSuppressed(filter, ''));
		this.#previous = { ...this.#previous, find: '' };
	}

	// Uses the standard component's full reset contract. Writing "all" through
	// setFields creates a visible temporary-filter chip instead of clearing the
	// search row. Process the cleared values immediately because the apply event is
	// not guaranteed to reach a filter relocated into the picker popup.
	resetFilters(): void
	{
		const filter = getFilterById(this.#filterId);
		if (!filter || !Type.isFunction(filter.resetFilter))
		{
			return;
		}

		try
		{
			filter.resetFilter();
			this.#process();
		}
		catch (error)
		{
			console.error('DiskPicker: failed to reset the standard filter', error);
		}
	}

	#runSuppressed(action: () => void): void
	{
		this.#suppressing = true;
		try
		{
			action();
		}
		finally
		{
			// Release after the current task so the async apply the write generated is
			// ignored, while later real user events are handled.
			setTimeout(() => {
				this.#suppressing = false;
			}, 0);
		}
	}

	#filtersChanged(): boolean
	{
		const filter = getFilterById(this.#filterId);
		if (!filter)
		{
			return false;
		}

		return filtersDiffer(readInitialFilterValues(filter), this.#previous);
	}

	#cancelScheduledProcess(): void
	{
		if (this.#debounceTimer !== null)
		{
			clearTimeout(this.#debounceTimer);
			this.#debounceTimer = null;
		}
	}

	#scheduleProcess(): void
	{
		this.#cancelScheduledProcess();
		this.#debounceTimer = setTimeout(() => {
			this.#debounceTimer = null;
			this.#process();
		}, SEARCH_DEBOUNCE_MS);
	}

	// Expanding the search by the toolbar button focuses the FIND input programmatically,
	// which the standard component does not treat as the click that opens its popup.
	// Defer to the next task so the app applies the expanded state and starts its CSS
	// animation before the open collects the animations to wait for.
	#scheduleShowPopup(): void
	{
		this.#cancelScheduledShowPopup();
		this.#showPopupTimer = setTimeout(() => {
			this.#showPopupTimer = null;
			void this.#showPopup();
		}, 0);
	}

	#cancelScheduledShowPopup(): void
	{
		this.#showPopupGeneration += 1;
		if (this.#showPopupTimer !== null)
		{
			clearTimeout(this.#showPopupTimer);
			this.#showPopupTimer = null;
		}
	}

	// The popup is positioned once, against its bind element, at the moment it is shown.
	// The search host expands with a CSS animation, so opening while it runs pins the
	// popup to an intermediate offset and scale. Wait for the animations running on the
	// standard search container and its ancestors; with none (reduced motion included)
	// the popup opens right away. The generation check drops an open whose search
	// collapsed or whose adapter was disposed while waiting.
	async #showPopup(): Promise<void>
	{
		const filter = getFilterById(this.#filterId);
		if (!filter || !Type.isFunction(filter.showPopup))
		{
			return;
		}

		const generation = this.#showPopupGeneration;
		try
		{
			const container = getSearchContainer(filter);
			await waitSearchAnimationsEnd(container);
			if (generation !== this.#showPopupGeneration)
			{
				return;
			}

			const popup = filter.popup;
			if (!isPopupShown(popup))
			{
				filter.showPopup();

				return;
			}

			// `closePopup()` keeps the popup shown through its close animation. A popup shown
			// without the class is that closing one: reopen it once it has closed.
			if (Dom.hasClass(container, SEARCH_SHOWED_CLASS) || !Type.isFunction(popup.subscribeOnce))
			{
				return;
			}

			popup.subscribeOnce('onAfterClose', () => {
				if (generation === this.#showPopupGeneration)
				{
					this.#openPopup(filter);
				}
			});
		}
		catch (error)
		{
			console.error('DiskPicker: failed to open the standard filter popup', error);
		}
	}

	// Runs from the popup event, outside the `#showPopup` try block.
	#openPopup(filter: StandardFilter): void
	{
		if (!Type.isFunction(filter.showPopup))
		{
			return;
		}

		try
		{
			filter.showPopup();
		}
		catch (error)
		{
			console.error('DiskPicker: failed to open the standard filter popup', error);
		}
	}

	// No `isShown()` guard: `showPopup()` shows the popup in a deferred task, so a collapse
	// in that gap would otherwise leave the popup over the collapsed search. The search
	// container class is the synchronous marker instead: `showPopup()` adds it at once and
	// `closePopup()` drops it before the close animation. Without the class the popup is
	// already closing (Escape keydown closed it) or was never shown; a second deferred
	// `close()` would hit a popup reopened in the meantime, so skip it. A filter without a
	// reachable container is closed unconditionally, as before.
	#closePopup(): void
	{
		const filter = getFilterById(this.#filterId);
		if (!filter || !Type.isFunction(filter.closePopup))
		{
			return;
		}

		const container = getSearchContainer(filter);
		if (container && !Dom.hasClass(container, SEARCH_SHOWED_CLASS))
		{
			return;
		}

		const activeBefore = document.activeElement;
		try
		{
			filter.closePopup();
		}
		catch (error)
		{
			console.error('DiskPicker: failed to close the standard filter popup', error);
		}
		this.#restoreFocus(activeBefore);
	}

	// The standard `closePopup()` ends with `adjustFocus()`, which moves the focus into
	// the FIND input. The search host is about to be hidden, so a focus left there falls
	// to `body`. Give the focus back to the element the user moved it to (a Tab out of
	// the search); with nothing to return to (a click outside), drop it instead.
	#restoreFocus(activeBefore: Element | null): void
	{
		const active = document.activeElement;
		if (active === activeBefore || !Type.isElementNode(active))
		{
			return;
		}

		if (Type.isElementNode(activeBefore) && activeBefore !== document.body && activeBefore.isConnected)
		{
			activeBefore.focus();

			return;
		}

		active.blur();
	}

	#process(): void
	{
		const filter = getFilterById(this.#filterId);
		if (!filter)
		{
			this.#undimBeforeApply();

			return;
		}

		// Normalizes the component values and, when they had to be clamped, writes the
		// normalized form back into the standard component before dispatching.
		const normalized = readInitialFilterValues(filter);

		const filtersChanged = filtersDiffer(normalized, this.#previous);
		const queryChanged = normalized.find !== this.#previous.find;
		this.#previous = cloneValues(normalized);

		if (!filtersChanged && !queryChanged)
		{
			this.#undimBeforeApply();

			return;
		}

		// Reactivate this session's pinia so the feature stores resolve, then delegate:
		// the features own the session-active guard and the query adoption.
		setActivePinia(this.#pinia);

		if (filtersChanged)
		{
			// Every filter path ends with `setLoading(false)`, which also lifts the pre-apply dim.
			this.#dimmedBeforeApply = false;
			this.#cancelDimTimeout();
			void applyFilters(
				{ objectTypeFilter: normalized.objectTypeFilter, fileTypeFilters: [...normalized.fileTypeFilters] },
				this.#deps,
				normalized.find,
			);

			return;
		}

		// A query under the search bound with no search to leave is a no-op for the
		// feature, so the dim is lifted here; a real search owns the loading state.
		const searchNoop = [...normalized.find.trim()].length < SearchQueryLength.Min
			&& useSessionStore(this.#pinia).searchQuery === '';
		this.#dimmedBeforeApply = this.#dimmedBeforeApply && searchNoop;
		void searchItems(normalized.find, this.#deps);
		this.#undimBeforeApply();
	}
}

function cloneValues(values: NormalizedFilterValues): NormalizedFilterValues
{
	return {
		find: values.find,
		objectTypeFilter: values.objectTypeFilter,
		fileTypeFilters: [...values.fileTypeFilters],
	};
}
