import { runAction } from 'im.v2.lib.rest';
import { Notifier } from 'im.v2.lib.notifier';
import { Logger } from 'im.v2.lib.logger';

import { RestMethod } from 'imopenlines.v2.const';

import { type QuickReplyLoadListParams, type QuickReplyLoadListResult, type QuickReplySaveParams, type RawQuickReply } from '../types/rest';

export class QuickReplyService
{
	loadList(params: QuickReplyLoadListParams): Promise<QuickReplyLoadListResult>
	{
		return runAction(RestMethod.linesV2QuickReplyList, { data: params })
			.then((result) => {
				return result;
			})
			.catch((error) => {
				Logger.error('Imol.QuickReply.loadList: request error', error);
				Notifier.onDefaultError();

				return {
					replies: [],
					sections: [],
					totalCount: 0,
					manageUrl: '',
					permissions: {
						canView: false,
						canCreate: false,
					},
				};
			});
	}

	save(params: QuickReplySaveParams): Promise<?RawQuickReply>
	{
		return runAction(RestMethod.linesV2QuickReplySave, { data: params })
			.then((result) => {
				return result.reply;
			})
			.catch((error) => {
				Logger.error('Imol.QuickReply.save: request error', error);
				Notifier.onDefaultError();

				return null;
			});
	}

	saveFromMessage(params: { dialogId: string, messageId: number }): Promise<boolean>
	{
		return runAction(RestMethod.linesV2QuickReplySaveFromMessage, { data: params })
			.then((result) => {
				return result?.result === true;
			})
			.catch((error) => {
				Logger.error('Imol.QuickReply.saveFromMessage: request error', error);
				Notifier.onDefaultError();

				return null;
			});
	}

	incrementRating(params: { id: number, lineId: number }): Promise<boolean>
	{
		return runAction(RestMethod.linesV2QuickReplyIncrementRating, { data: params })
			.then(() => true)
			.catch((error) => {
				Logger.error('Imol.QuickReply.incrementRating: request error', error);
				Notifier.onDefaultError();

				return false;
			});
	}

	delete(params: { id: number, lineId: number }): Promise<boolean>
	{
		return runAction(RestMethod.linesV2QuickReplyDelete, { data: params })
			.then(() => true)
			.catch((error) => {
				Logger.error('Imol.QuickReply.delete: request error', error);
				Notifier.onDefaultError();

				return false;
			});
	}
}
