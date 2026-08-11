import { type InvitationType } from 'im.v2.provider.service.guest-invitation';

export type Candidate = {
	type: $Values<typeof InvitationType>,
	value: string,
};
