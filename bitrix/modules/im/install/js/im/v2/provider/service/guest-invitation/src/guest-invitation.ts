import { RestMethod } from 'im.v2.const';
import { runAction, type RunActionError } from 'im.v2.lib.rest';
import { Core } from 'im.v2.application.core';

export const InvitationType = {
	email: 'email',
	phone: 'phone',
};

export type InvitationCandidate = {
	type: keyof typeof InvitationType;
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

export class GuestInvitationService
{
	generateInviteLink(chatId: number): Promise<SharingLink>
	{
		const payload = {
			data: { chatId },
		};

		return runAction(RestMethod.imV2GuestLinkGenerate, payload).then(({ sharingLink }: {
			sharingLink: SharingLink
		}) => {
			void Core.getStore().dispatch('sidebar/sharedLink/set', sharingLink);

			return sharingLink;
		}).catch(([error]: RunActionError[]) => {
			console.error('GuestInvitationService: generate invite link error', error);
			throw error;
		});
	}

	updateLink(chatId: number): Promise<void>
	{
		const payload = {
			data: { chatId },
		};

		return runAction(RestMethod.imV2GuestLinkRegenerate, payload).then(({ sharingLink }: {
			sharingLink: SharingLink
		}) => {
			return Core.getStore().dispatch('sidebar/sharedLink/regenerate', {
				newLink: sharingLink,
			});
		}).catch(([error]: RunActionError[]) => {
			console.error('GuestInvitationService: regenerate invite link error', error);
			throw error;
		});
	}

	inviteByEmail(chatId: number, invitations: Array<{ email: string }>): Promise<void>
	{
		const data = { chatId, invitations };

		return runAction(RestMethod.imV2GuestLinkInviteByEmail, { data }).catch(([error]: RunActionError[]) => {
			console.error('GuestInvitationService: invite by email error', error);
			throw error;
		});
	}

	inviteByPhone(chatId: number, invitations: Array<{ phone: string }>): Promise<void>
	{
		const data = { chatId, invitations };

		return runAction(RestMethod.imV2GuestLinkInviteByPhoneNumber, { data }).catch(([error]: RunActionError[]) => {
			console.error('GuestInvitationService: invite by phone number error', error);
			throw error;
		});
	}
}
