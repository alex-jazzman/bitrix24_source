import { runAction } from 'im.v2.lib.rest';
import { Notifier } from 'im.v2.lib.notifier';
import { Logger } from 'im.v2.lib.logger';

import { RestMethod } from 'imopenlines.v2.const';

export class MessageService
{
	addSession(dialogId: string, messageId: string | number): Promise<void>
	{
		const queryParams = {
			data: {
				dialogId,
				messageId,
			},
		};

		return runAction(RestMethod.linesV2MessageAddSession, queryParams)
			.catch((error) => {
				Logger.error('Imol.StartMultidialog: request error', error);
				Notifier.onDefaultError();
			});
	}
}
