import { Core } from 'im.v2.application.core';

import type { QueueUpdateParams } from '../types/queue';

export class QueuePullHandler
{
	constructor()
	{
		this.store = Core.getStore();
	}

	getModuleId(): string
	{
		return 'imopenlines';
	}

	handleQueueItemUpdate(params: QueueUpdateParams)
	{
		void this.store.dispatch('openLines/queue/set', params);
	}

	handleQueueItemDelete(params: QueueUpdateParams)
	{
		void this.store.dispatch('openLines/queue/delete', params.id);
	}
}
