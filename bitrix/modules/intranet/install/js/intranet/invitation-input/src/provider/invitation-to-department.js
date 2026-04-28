import { ajax } from 'main.core';
import { InvitationProvider } from './invitation-provider';

export class InvitationToDepartment extends InvitationProvider
{
	#users: Object;
	#departments: Array<number>;

	constructor(users: Object, departments: Array<number>)
	{
		super();
		this.#users = users;
		this.#departments = departments;
	}

	invite(): Promise
	{
		return ajax.runAction('intranet.v2.Invitation.inviteUsers', {
			data: {
				invitations: this.#users,
				departmentIds: this.#departments,
			},
		});
	}
}
