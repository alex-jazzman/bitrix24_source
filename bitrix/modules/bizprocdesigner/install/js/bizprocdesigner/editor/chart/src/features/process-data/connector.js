import { Type } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { onBeforeUnmount } from 'ui.vue3';

import { DIAGRAM_EVENTS } from '../../entities/blocks/constants';
import { PROCESS_DATA_EVENTS } from '../../shared/constants';
import type { ProcessDataSelector } from '../../shared/types';
import { useProcessDataStore } from '../../entities/process-data';

function readSelector(data: Object): ProcessDataSelector | null
{
	const select = data?.select;
	if (!Type.isStringFilled(select?.sourceType) || !Type.isStringFilled(select?.key))
	{
		return null;
	}

	return { sourceType: select.sourceType, key: select.key };
}

/**
 * The only entrance to the process data window (EVENT-01): the diagram menu item and the
 * publication error handler emit the event, the store opens on it. The catalog outlives the window
 * and belongs to the graph it was read from, so the graph being replaced drops it here as well.
 * Call from a setup context — the subscriptions go off with the component, so reopening the editor
 * slider does not pile handlers up on the global bus.
 */
export function initProcessDataConnector(): void
{
	const store = useProcessDataStore();
	const openHandler = (event: BaseEvent): void => {
		void store.open(readSelector(event.getData() ?? {}));
	};
	const graphHandler = (): void => store.invalidate();

	EventEmitter.subscribe(PROCESS_DATA_EVENTS.OPEN, openHandler);
	EventEmitter.subscribe(DIAGRAM_EVENTS.GRAPH_REPLACED, graphHandler);

	onBeforeUnmount(() => {
		EventEmitter.unsubscribe(PROCESS_DATA_EVENTS.OPEN, openHandler);
		EventEmitter.unsubscribe(DIAGRAM_EVENTS.GRAPH_REPLACED, graphHandler);
	});
}
