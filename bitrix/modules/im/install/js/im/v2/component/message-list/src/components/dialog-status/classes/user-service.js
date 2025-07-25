import { Core } from 'im.v2.application.core';
import { RestMethod } from 'im.v2.const';
import { UserManager } from 'im.v2.lib.user';
import { Logger } from 'im.v2.lib.logger';

export class UserService
{
	async loadReadUsers(messageId): Promise<number[]>
	{
		Logger.warn('Dialog-status: UserService: loadReadUsers', messageId);
		const response = await Core.getRestClient().callMethod(RestMethod.imV2ChatMessageTailViewers, {
			id: messageId,
		})
			.catch((result: RestResult) => {
				console.error('Dialog-status: UserService: loadReadUsers error', result.error());
				throw result.error();
			});
		const users = response.data().users;
		const userManager = new UserManager();
		await userManager.setUsersToModel(Object.values(users));

		return users.map((user) => user.id);
	}
}
