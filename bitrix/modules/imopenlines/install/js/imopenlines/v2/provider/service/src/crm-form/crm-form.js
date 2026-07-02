import { Core } from 'im.v2.application.core';
import { runAction } from 'im.v2.lib.rest';
import { Notifier } from 'im.v2.lib.notifier';
import { Logger } from 'im.v2.lib.logger';

import { RestMethod } from 'imopenlines.v2.const';

import { type RawCrmForm } from '../types/rest';

export class CrmFormService
{
	loadForms(): Promise<RawCrmForm[]>
	{
		return runAction(RestMethod.linesV2CrmFormList)
			.then((result) => {
				const forms = result.forms ?? [];
				void Core.getStore().dispatch('openLines/crmForm/set', forms);

				return forms;
			})
			.catch((error) => {
				Logger.error('Imol.CrmForm.loadForms: request error', error);
				Notifier.onDefaultError();

				return [];
			});
	}

	sendForm(dialogId: string, formId: number): Promise
	{
		return runAction(RestMethod.linesV2CrmFormSend, {
			data: { dialogId, formId },
		})
			.catch((error) => {
				Logger.error('Imol.CrmForm.sendForm: request error', error);
				Notifier.onDefaultError();
			});
	}
}
