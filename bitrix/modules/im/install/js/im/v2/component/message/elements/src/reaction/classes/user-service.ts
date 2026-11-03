import { RestMethod } from 'im.v2.const';
import { BaseUserService } from 'im.v2.provider.service.user';

type ReactionItem = {
	id: number;
	messageId: number;
	userId: number;
	reaction: string;
	dateReaction: string;
};

export class UserService extends BaseUserService<{ reactions: ReactionItem[] }>
{
	// Methods inherited from BaseUserService (Flow-JS): its Flow generic syntax is unparsable by
	// TS, so inherited members are invisible to consumers. Declared here (no runtime emit) so
	// callers see the runtime-provided API.
	declare loadFirstPage: (messageId: number | string) => Promise<number[]>;
	declare loadNextPage: (messageId: number | string) => Promise<number[] | null>;
	declare hasMoreItemsToLoad: () => boolean;

	#reaction: string;

	constructor(reaction: string)
	{
		super();
		this.#reaction = reaction;
	}

	getRequestFilter(firstPage = false): Record<string, any>
	{
		return {
			// @ts-expect-error BaseUserService (Flow-JS) methods are not visible to TS (unparsable Flow generics)
			...super.getRequestFilter(firstPage),
			reaction: this.#reaction,
		};
	}

	getRestMethodName(): string
	{
		return RestMethod.imV2ChatMessageReactionTail;
	}

	getLastId(result: { reactions: ReactionItem[] }): number
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
