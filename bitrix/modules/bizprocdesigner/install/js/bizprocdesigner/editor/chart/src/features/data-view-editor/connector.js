import { Type } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';

import { isTemplateId } from '../../shared/utils';
import { DATA_VIEWS_EVENTS } from '../../entities/node-data-views';
import { useDataViewDefinitionStore } from './stores/definition-store';
import { useDataViewMetaStore } from './stores/meta-store';

let isInstalled = false;

let instanceSeq = 0;

/**
 * Bridges the node settings "data views" section to the data view editor: on the section's
 * {@code OpenTableSettings} event it opens the editor via the definition store, forwarding the node
 * owner context and the section's {@code onSaved} callback (which upserts the returned item). The
 * source catalog cached by the previous session is dropped with it — a new session re-reads what the
 * user may pick now. The stores are resolved here (setup context) and captured for the event handler.
 *
 * Installed once for the editor lifetime; repeated calls are ignored.
 */
export function initDataViewEditorConnector(): void
{
	if (isInstalled)
	{
		return;
	}

	isInstalled = true;

	const definitionStore = useDataViewDefinitionStore();
	const metaStore = useDataViewMetaStore();

	EventEmitter.subscribe(DATA_VIEWS_EVENTS.OPEN_TABLE_SETTINGS, (event: BaseEvent) => {
		const data = event.getData() ?? {};

		instanceSeq += 1;
		metaStore.reset();
		definitionStore.open({
			templateId: isTemplateId(data.templateId) ? Number(data.templateId) : null,
			activityName: Type.isStringFilled(data.activityName) ? data.activityName : '',
			storageTypeId: Type.isNumber(data.storageTypeId) ? data.storageTypeId : null,
			instanceKey: String(instanceSeq),
			onSaved: Type.isFunction(data.onSaved) ? data.onSaved : null,
		});
	});
}
