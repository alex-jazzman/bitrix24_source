import { EndpointDirection, UserState } from 'call.core';

// Deliberately not hasActiveState: a local tile stays on screen in states that hide a remote
// participant. Only someone who has not joined yet, or who came in to watch, shows nothing.
export function shouldShowLocalUser(userModel)
{
	return (
		userModel.state !== UserState.Idle
		&& userModel.direction !== EndpointDirection.RecvOnly
	);
}
