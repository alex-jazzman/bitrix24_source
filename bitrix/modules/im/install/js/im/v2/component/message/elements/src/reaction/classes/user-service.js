import { RestMethod } from 'im.v2.const';
import { BaseUserService } from 'im.v2.provider.service.user';

type ReactionItem = {
	id: number,
	messageId: number,
	userId: number,
	reaction: string,
	dateReaction: string,
}

export class UserService extends BaseUserService<{ reactions: ReactionItem[] }>
{
	#reaction: string;

	constructor(reaction: string)
	{
		super();
		this.#reaction = reaction;
	}

	getRequestFilter(firstPage = false): Record
	{
		return {
			...super.getRequestFilter(firstPage),
			reaction: this.#reaction,
		};
	}

	getRestMethodName(): string
	{
		return RestMethod.imV2ChatMessageReactionTail;
	}

	getLastId(result): number
	{
		const { reactions } = result;

		if (!reactions || reactions.length === 0)
		{
			return 0;
		}

		const sortedReactions = [...reactions].sort((a, b) => b.id - a.id);

		return sortedReactions[sortedReactions.length - 1].id;
	}
}
