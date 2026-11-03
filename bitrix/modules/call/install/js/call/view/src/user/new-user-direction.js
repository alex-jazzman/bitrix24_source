import { EndpointDirection } from 'call.core';

import { isSameUser } from './same-user';

// An empty list means the call is not a broadcast at all, not that no presenter has been picked:
// an ordinary call always carries an empty list, and everyone in it sends and receives.
export function getNewUserDirection(userId, broadcastingPresenters)
{
	if (broadcastingPresenters.length === 0)
	{
		return EndpointDirection.SendRecv;
	}

	// A presenter told apart by the form of the id would silently lose the right to speak.
	const isPresenter = broadcastingPresenters.some(
		(presenterId) => isSameUser(presenterId, userId),
	);

	return isPresenter ? EndpointDirection.SendRecv : EndpointDirection.RecvOnly;
}
