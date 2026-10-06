/* eslint-disable */
type InvitationCandidate = {
	type: keyof typeof BX.Messenger.v2.Service.InvitationType;
	value: string;
};

type SharingLink = {
	id: number;
	entityId: string;
	entityType: string;
	code: string;
	type: string;
	dateCreate: string;
	dateExpire: string | null;
	requireApproval: boolean;
	url: string;
	name: string | null;
};

declare namespace BX.Messenger.v2.Service {
	const InvitationType: {
		email: string;
		phone: string;
	};

	class GuestInvitationService {
		generateInviteLink(chatId: number): Promise<SharingLink>;
		updateLink(chatId: number): Promise<SharingLink>;
		inviteByEmail(chatId: number, invitations: Array<{
			email: string;
		}>): Promise<void>;
		inviteByPhone(chatId: number, invitations: Array<{
			phone: string;
		}>): Promise<void>;
	}
}
