import { Core } from 'im.v2.application.core';

import { QuickReplyManager } from 'imopenlines.v2.lib.quick-reply';

import { type ConnectorUpdateParams } from '../types/connector';

export class ConnectorPullHandler
{
	constructor()
	{
		this.store = Core.getStore();
	}

	getModuleId(): string
	{
		return 'imopenlines';
	}

	handleUpdateConnector(params: ConnectorUpdateParams): void
	{
		const { dialogId, connector } = params;

		void this.store.dispatch('openLines/connector/set', {
			dialogId,
			data: connector,
		});

		QuickReplyManager.getInstance().resetCache(dialogId);
	}
}
