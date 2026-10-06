/* eslint-disable no-unused-vars */

type GuestSharingLink = {
	id: number,
	entityId: string,
	entityType: string,
	code: string,
	type: string,
	dateCreate: string,
	dateExpire: string | null,
	requireApproval: boolean,
	url: string,
	name: string | null,
};

type GuestEmailInvitation = {
	email: string,
	name?: string,
};

type GuestPhoneInvitation = {
	phone: string,
	name?: string,
};
