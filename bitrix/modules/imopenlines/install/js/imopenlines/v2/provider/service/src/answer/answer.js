import { Notifier } from 'im.v2.lib.notifier';
import { runAction } from 'im.v2.lib.rest';
import { Logger } from 'im.v2.lib.logger';

import { RestMethod } from 'imopenlines.v2.const';

export class AnswerService
{
	requestAnswer(dialogId: string): Promise
	{
		const queryParams = {
			data: {
				dialogId,
			},
		};

		return runAction(RestMethod.linesV2SessionAnswer, queryParams)
			.catch((error) => {
				Notifier.onDefaultError();
				Logger.error('Imol.OperatorAnswer: request error', error);
			});
	}
}
