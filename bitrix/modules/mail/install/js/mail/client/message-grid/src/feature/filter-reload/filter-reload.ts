import { type BaseEvent, EventEmitter } from 'main.core.events';

import { GridEvent } from '../../const';

/**
 * An applied filter draws the list again from its first page.
 *
 * The filter of the platform reloads the grid it is bound to itself, and it binds by answering
 * `Grid::ready` of the platform (`filter.js:2239`) - an event the new grid does not raise, and a
 * binding that would hand the filter the whole surface of the platform grid. So the list answers the
 * word the filter says to everyone, and only for its own filter: two lists share the screen, each
 * with a filter of its own.
 *
 * The values are already on the server by then: the filter saves them and only afterwards says the
 * word (`filter.js:3059`). A word said without a filter behind it belongs to somebody else
 * (`mailer.js:190`) and passes by.
 */
export function reloadOnFilterApply(filterId: string, reload: () => void): void
{
	EventEmitter.subscribe(GridEvent.FilterApplied, (event: BaseEvent): void => {
		const [appliedFilterId] = event.getCompatData() ?? [];
		if (appliedFilterId === filterId)
		{
			reload();
		}
	});
}
