import { Reflection } from 'main.core';

export type JoinChatResult = {
	dialogId: string,
	chatId: number,
};

export class SharedLinkService
{
	joinChatByCode(code: string): Promise<JoinChatResult | void>
	{
		const { runAction } = Reflection.getClass('BX.Messenger.v2.Lib');
		const { RestMethod } = Reflection.getClass('BX.Messenger.v2.Const');

		if (!runAction || !RestMethod)
		{
			return Promise.resolve();
		}

		return runAction(RestMethod.imV2ChatJoinByCode, { data: { code } })
			.catch(([error]) => {
				console.error('SharedLinkService: joinChatByCode error', error);
				throw error;
			});
	}
}
