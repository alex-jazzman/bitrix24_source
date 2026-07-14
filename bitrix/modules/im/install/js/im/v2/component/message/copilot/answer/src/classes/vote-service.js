import { RestMethod } from 'im.v2.const';
import { Logger } from 'im.v2.lib.logger';
import { runAction } from 'im.v2.lib.rest';

import { type VoteValueType } from '../const/const';

export class VoteService
{
	async send(messageId: number, value: VoteValueType): Promise<void>
	{
		Logger.log('VoteService: send', messageId, value);

		await runAction(RestMethod.imV2ChatMessageVoteSend, {
			data: { messageId, value },
		});
	}
}
