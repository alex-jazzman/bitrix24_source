import { Core } from 'im.v2.application.core';
import { RecentType, RestMethod, type RecentTypeItem } from 'im.v2.const';
import { BaseRecentService, type RecentRestResult, type BaseRecentFilterParams } from 'im.v2.provider.service.recent';
import { type RawMessage } from 'im.v2.provider.service.types';

export class ChannelService extends BaseRecentService
{
	#lastMessageId: number = 0;

	getRecentType(): RecentTypeItem
	{
		return RecentType.openChannel;
	}

	getRestMethodName(): string
	{
		return RestMethod.imV2RecentChannelTail;
	}

	getRequestFilter(firstPage: boolean = false): BaseRecentFilterParams
	{
		return {
			lastMessageId: firstPage ? null : this.#lastMessageId,
		};
	}

	onAfterRequest(firstPage: boolean): void
	{
		if (!firstPage)
		{
			return;
		}

		void Core.getStore().dispatch('recent/clearCollection', { type: RecentType.openChannel });
	}

	handlePaginationField(result: RecentRestResult): void
	{
		const { messages } = result;
		this.#lastMessageId = this.#getMinMessageId(messages);
	}

	#getMinMessageId(messages: RawMessage[]): number
	{
		if (messages.length === 0)
		{
			return 0;
		}

		const firstMessageId = messages[0].id;

		return messages.reduce((minId, nextMessage) => {
			return Math.min(minId, nextMessage.id);
		}, firstMessageId);
	}
}
