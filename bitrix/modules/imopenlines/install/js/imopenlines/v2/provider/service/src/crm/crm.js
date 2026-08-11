import { Core } from 'im.v2.application.core';
import { Notifier } from 'im.v2.lib.notifier';
import { runAction } from 'im.v2.lib.rest';
import { Logger } from 'im.v2.lib.logger';

import { RestMethod } from 'imopenlines.v2.const';

import { type DialogCrmSaveResult, type RawDialogCrm } from '../types/rest';

export class CrmService
{
	saveToCrm(dialogId: string): Promise
	{
		const queryParams = {
			data: {
				dialogId,
			},
		};

		return runAction(RestMethod.linesV2DialogCrmSave, queryParams)
			.then((result: DialogCrmSaveResult) => {
				this.#updateModel(dialogId, result.dialogCrm);
			})
			.catch((error) => {
				Notifier.onDefaultError();
				Logger.error('Imol.SaveToCrm: request error', error);
			});
	}

	#updateModel(dialogId: string, dialogCrm: ?RawDialogCrm): void
	{
		if (!dialogCrm)
		{
			return;
		}

		void Core.getStore().dispatch('openLines/crm/set', {
			dialogId,
			data: {
				leadId: dialogCrm.lead?.id ?? null,
				contactId: dialogCrm.contact?.id ?? null,
				dealId: dialogCrm.deal?.id ?? null,
				companyId: dialogCrm.company?.id ?? null,
			},
		});
	}
}
