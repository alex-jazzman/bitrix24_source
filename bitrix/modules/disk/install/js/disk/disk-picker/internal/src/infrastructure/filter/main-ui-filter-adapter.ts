import { Reflection, Type } from 'main.core';
import { setActivePinia, type Pinia } from 'ui.vue3.pinia';

import { ObjectTypeFilter, SEARCH_DEBOUNCE_MS } from '../../const/picker';
import { type NormalizedFilterValues } from '../../const/types';
import { applyFilters } from '../../feature/apply-filter/apply-filter';
import { searchItems, type SearchDeps } from '../../feature/search-items/search-items';
import {
	applyFindSuppressed,
	FilterFieldId,
	readInitialFilterValues,
} from '../../lib/filter-adapter/filter-adapter';

type FilterApi = {
	setFields?: (fields: { [key: string]: any }) => void,
	apply?: () => void,
};

type StandardFilter = {
	getFilterFieldsValues?: () => { [key: string]: any },
	getApi?: () => FilterApi,
	resetFilter?: () => any,
};

type CustomEventBus = {
	addCustomEvent: (target: any, name: string, handler: Function) => void,
	removeCustomEvent: (target: any, name: string, handler: Function) => void,
};

const APPLY_EVENT = 'BX.Main.Filter:apply';

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
	#debounceTimer: ReturnType<typeof setTimeout> | null = null;
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
		const bus = getCustomEventBus();
		if (!bus || this.#handler)
		{
			return;
		}

		this.#bus = bus;
		this.#handler = (filterId: string): void => {
			if (filterId !== this.#filterId || this.#suppressing)
			{
				return;
			}

			this.#scheduleProcess();
		};
		bus.addCustomEvent(window, APPLY_EVENT, this.#handler);
	}

	dispose(): void
	{
		if (this.#debounceTimer !== null)
		{
			clearTimeout(this.#debounceTimer);
			this.#debounceTimer = null;
		}

		if (this.#bus && this.#handler)
		{
			this.#bus.removeCustomEvent(window, APPLY_EVENT, this.#handler);
		}
		this.#handler = null;
		this.#bus = null;
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

	#scheduleProcess(): void
	{
		if (this.#debounceTimer !== null)
		{
			clearTimeout(this.#debounceTimer);
		}
		this.#debounceTimer = setTimeout(() => {
			this.#debounceTimer = null;
			this.#process();
		}, SEARCH_DEBOUNCE_MS);
	}

	#process(): void
	{
		const filter = getFilterById(this.#filterId);
		if (!filter)
		{
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
			return;
		}

		// Reactivate this session's pinia so the feature stores resolve, then delegate:
		// the features own the session-active guard and the query adoption.
		setActivePinia(this.#pinia);

		if (filtersChanged)
		{
			void applyFilters(
				{ objectTypeFilter: normalized.objectTypeFilter, fileTypeFilters: [...normalized.fileTypeFilters] },
				this.#deps,
				normalized.find,
			);

			return;
		}

		void searchItems(normalized.find, this.#deps);
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
