import { RestMethod } from 'im.v2.const';
import { runAction, type RunActionError } from 'im.v2.lib.rest';

type SharingLink = {
	id: number,
	entityId: string,
	entityType: string,
	code: string,
	type: string,
	dateCreate: string,
	dateExpire: ?string,
	requireApproval: boolean,
	url: string,
};

type GeneratedLink = {
	sharingLink: SharingLink,
};

export class GuestInvitationService
{
	generateInviteLink(chatId: number): Promise<GeneratedLink>
	{
		const payload = {
			data: { chatId },
		};

		return runAction(RestMethod.imV2ChatGuestLinkGenerate, payload)
			.catch(([error]: RunActionError[]) => {
				console.error('GuestInvitationService: generate invite link error', error);
				throw error;
			});
	}

	updateLink(chatId: number): Promise<GeneratedLink>
	{
		const payload = {
			data: { chatId },
		};

		return runAction(RestMethod.imV2ChatGuestLinkRegenerate, payload)
			.catch(([error]: RunActionError[]) => {
				console.error('GuestInvitationService: regenerate invite link error', error);
				throw error;
			});
	}
}
