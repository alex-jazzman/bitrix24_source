import { RestMethod } from 'im.v2.const';
import { BaseUserService } from 'im.v2.provider.service.user';

type ViewItem = {
	id: number,
	userId: number,
	messageId: number,
	dateView: string,
}

export class UserService extends BaseUserService<{ views: ViewItem[] }>
{
	getRestMethodName(): string
	{
		return RestMethod.imV2ChatMessageTailViewers;
	}

	getLastId(result): number
	{
		const { views } = result;

		if (!views || views.length === 0)
		{
			return 0;
		}

		const sortedViews = [...views].sort((a, b) => b.id - a.id);

		return sortedViews[sortedViews.length - 1].id;
	}
}
