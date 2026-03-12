import { ajax, Loc, Type } from 'main.core';
import { InvitationProvider } from './invitation-provider';

export class InvitationToGroup extends InvitationProvider
{
	#groupId: number;
	#users: Object;

	constructor(groupId: number, users: Object)
	{
		super();
		this.#groupId = groupId;
		this.#users = users;
	}

	invite(): Promise
	{
		return ajax.runAction('intranet.invite.inviteUsersToCollab', {
			data: {
				collabId: this.#groupId,
				users: this.#users,
			},
		}).then((response) => {
			const users = response?.data || [];

			let messageKey = null;
			const newUsers = users.filter((u) => u.status === 'INVITED');
			const existingUsers = users.filter((u) => u.status === 'ACTIVE');

			if (users.length === 0)
			{
				messageKey = 'INTRANET_INVITATION_INPUT_NO_USERS';
			}
			else if (existingUsers.length === users.length)
			{
				messageKey = (existingUsers.length === 1)
					? 'INTRANET_INVITATION_INPUT_ALREADY_IN_COLLAB_SINGLE'
					: 'INTRANET_INVITATION_INPUT_ALREADY_IN_COLLAB_ALL'
				;
			}
			else if (newUsers.length !== users.length)
			{
				messageKey = 'INTRANET_INVITATION_INPUT_ALREADY_IN_COLLAB_PARTIAL';
			}

			if (messageKey)
			{
				const notificationText = Loc.getMessage(messageKey);
				if (Type.isStringFilled(notificationText))
				{
					BX.UI.Notification.Center.notify({
						content: notificationText,
						autoHideDelay: 2500,
					});
				}
			}

			return response;
		});
	}
}
