import { Loc } from 'main.core';
import { Core } from 'tasks.v2.core';
import { EntitySelectorEntity } from 'tasks.v2.const';

export const creatorMeta = Object.freeze({
	id: 'creatorId',
	title: Loc.getMessage('TASKS_V2_CREATOR_TITLE'),
	dialogOptions: (context: string = 'tasks-card-participant') => {
		const limits = Core.getParams().limits;

		return {
			context,
			multiple: false,
			enableSearch: true,
			entities: [
				{
					id: EntitySelectorEntity.User,
					options: {
						emailUsers: true,
						inviteGuestLink: true,
						analyticsSource: 'tasks',
						lockGuestLink: !limits.mailUserIntegration,
						lockGuestLinkFeatureId: limits.mailUserIntegrationFeatureId,
					},
				},
				{
					id: 'department',
				},
			],
		};
	},
});
