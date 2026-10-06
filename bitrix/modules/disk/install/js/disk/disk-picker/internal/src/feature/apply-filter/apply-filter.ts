import { SearchQueryLength } from '../../const/picker';
import { useSessionStore } from '../../model/session/session';
import { type SessionFilters } from '../../model/session/types';
import { restoreBaseFeed, searchItems, type SearchDeps } from '../search-items/search-items';

export type ApplyFilterDeps = SearchDeps;

function isSearchActive(query: string): boolean
{
	return [...query.trim()].length >= SearchQueryLength.Min;
}

// Applies the user object-type and file-type filters over any list mode. Filters
// never change the feed and never clear the selection (AC-042/AC-048): a hidden
// selected file still counts and re-appears selected once the filter is relaxed.
// `find` is the query the standard filter carries alongside the filters; it is
// adopted here so the scenario dispatches against the current search text.
// The application path depends on the stage: recent re-filters its bounded
// snapshot locally with no request; a folder or an active search re-requests the
// first page, because narrowing an incomplete page would make `hasMore` unreliable.
export async function applyFilters(filters: SessionFilters, deps: ApplyFilterDeps, find: string): Promise<void>
{
	const session = useSessionStore();
	if (!session.isSessionActive())
	{
		return;
	}

	session.setFilterFind(find);
	session.setSearchQuery(isSearchActive(find) ? find.trim() : '');
	session.setFilters(filters);

	if (isSearchActive(session.searchQuery))
	{
		await searchItems(session.searchQuery, deps);

		return;
	}

	await restoreBaseFeed(deps);
}
