import { RestMethod } from 'im.v2.const';
import { GuestManager } from 'im.v2.lib.guest';
import { Logger } from 'im.v2.lib.logger';
import { runAction, type RunActionError } from 'im.v2.lib.rest';
import { UserManager } from 'im.v2.lib.user';
import { type RawUser } from 'im.v2.provider.service.types';

type SetNameResponse = {
	user: RawUser,
};

export class GuestService
{
	setName(name: string): Promise
	{
		return runAction(RestMethod.imV2GuestSetName, { data: { name } })
			.then((response: SetNameResponse) => {
				void (new UserManager()).setUsersToModel(response.user);
				GuestManager.getInstance().setGuestNamePopupState(false);
			}).catch(([error]: RunActionError[]) => {
				Logger.error('GuestService: setName error', error);
				throw error;
			});
	}
}
