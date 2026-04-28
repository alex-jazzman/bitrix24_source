import { RestMethod } from 'im.v2.const';
import { runAction } from 'im.v2.lib.rest';
import { getUsersFromRecentItems, MAX_ENTITIES_IN_SEARCH_LIST } from 'im.v2.lib.search';

import type { Relation } from 'im.v2.const';

export class ParticipantsService
{
	async getRecentIds(dialogId: string): Promise<string[]>
	{
		const recentUsersOptions = {
			withFakeUsers: false,
			userLimit: MAX_ENTITIES_IN_SEARCH_LIST,
		};

		const userList = getUsersFromRecentItems(recentUsersOptions);
		const userIds = userList.map(({ dialogId: userId }) => userId);

		if (userIds.length === 0)
		{
			return [];
		}

		try
		{
			const params = {
				data: {
					dialogId,
					userIds,
				},
			};

			const { relations }: Relation[] = await runAction(RestMethod.imV2ChatFilterUsersByParticipation, params);

			const members = relations.filter((member) => member.isHidden === false);

			return members.map(({ userId }) => userId.toString());
		}
		catch (error)
		{
			console.error('ParticipantsService: getIdsFromRecent error', error);

			return [];
		}
	}
}
