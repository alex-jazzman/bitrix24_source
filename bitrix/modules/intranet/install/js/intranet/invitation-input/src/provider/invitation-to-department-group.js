import { ajax } from 'main.core';
import { InvitationProvider } from './invitation-provider';

export type InvitationToDepartmentGroupOptions = {
	users: Object;
	groupIds: Array;
	departmentIds: Array;
	analyticsData: ?Object;
};

export class InvitationToDepartmentGroup extends InvitationProvider
{
	#options: InvitationToDepartmentGroupOptions;

	constructor(options: InvitationToDepartmentGroupOptions)
	{
		super();
		this.#options = options;
	}

	invite(): Promise
	{
		return ajax.runComponentAction('bitrix:intranet.invitation', 'inviteWithGroupDp', {
			data: {
				invitations: this.#options.users,
				departmentIds: this.#options.departmentIds,
				workgroupIds: this.#options.groupIds,
				analyticsData: this.#options.analyticsData ?? {},
				tab: 'mass',
			},
		});
	}
}
