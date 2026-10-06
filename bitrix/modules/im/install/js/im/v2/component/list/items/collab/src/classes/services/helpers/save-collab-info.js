import { Core } from 'im.v2.application.core';
import { type RecentFirstPageRestResult } from 'im.v2.provider.service.recent';

export function saveCollabInfo(restResult: RecentFirstPageRestResult, parentChatId: number): Promise
{
	const collabInfo = restResult.sectionMeta?.collabInfo;
	if (!collabInfo)
	{
		return Promise.resolve();
	}

	return Core.getStore().dispatch('chats/collabs/set', {
		chatId: parentChatId,
		collabInfo,
	});
}
