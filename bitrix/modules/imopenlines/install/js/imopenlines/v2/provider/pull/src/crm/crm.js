import { Core } from 'im.v2.application.core';

import { type CrmUpdateParams } from '../types/crm';

export class CrmPullHandler
{
	constructor()
	{
		this.store = Core.getStore();
	}

	getModuleId(): string
	{
		return 'imopenlines';
	}

	handleUpdateCrm(params: CrmUpdateParams): void
	{
		if (!params.dialogId || !params.crm)
		{
			return;
		}

		void this.store.dispatch('openLines/crm/set', {
			dialogId: params.dialogId,
			data: params.crm,
		});
	}
}
