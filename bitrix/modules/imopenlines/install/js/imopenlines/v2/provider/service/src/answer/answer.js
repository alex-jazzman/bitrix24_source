import { Loc } from 'main.core';
import 'ui.notification';

import { Notifier } from 'im.v2.lib.notifier';
import { runAction } from 'im.v2.lib.rest';
import { Logger } from 'im.v2.lib.logger';

import { RestMethod } from 'imopenlines.v2.const';

const ANSWER_RACE_ERROR_CODES = new Set([
	'IMOL_CHAT_ERROR_ANSWER_ALREADY_RESPONSIBLE',
	'IMOL_CHAT_ERROR_ANSWER_COMPETITIVE_REQUEST',
]);

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
			.catch((errors) => {
				const errorList = Array.isArray(errors) ? errors : [errors];
				if (errorList.some((error) => ANSWER_RACE_ERROR_CODES.has(error?.code)))
				{
					BX.UI.Notification.Center.notify({
						content: Loc.getMessage('IMOL_CONTENT_ANSWER_ALREADY_RESPONSIBLE'),
					});

					return;
				}

				Notifier.onDefaultError();
				Logger.error('Imol.OperatorAnswer: request error', errors);
			});
	}
}
