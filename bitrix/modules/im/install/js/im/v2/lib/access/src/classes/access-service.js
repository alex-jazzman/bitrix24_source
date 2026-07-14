import { RestMethod, ErrorCode } from 'im.v2.const';
import { runAction, type RunActionError } from 'im.v2.lib.rest';

const MESSAGE_ACCESS_ERROR_CODES = new Set([
	ErrorCode.chat.accessDenied,
	ErrorCode.chat.notFound,
	ErrorCode.message.notFound,
	ErrorCode.message.accessDenied,
	ErrorCode.message.accessDeniedByTariff,
]);

export type CheckMessageAccessResult = { hasAccess: boolean, errorCode?: string };
type CheckChatAccessResult = { usersInChat: number[], usersNotInChat: number[] };

export const AccessService = {
	async checkMessageAccess(messageId: number): Promise<CheckMessageAccessResult>
	{
		const payload = { data: { messageId } };

		try
		{
			await runAction(RestMethod.imV2AccessCheck, payload);
		}
		catch (errors)
		{
			return handleMessageAccessError(errors);
		}

		return Promise.resolve({ hasAccess: true });
	},

	async checkChatAccessByUserIds(dialogId: string, userIds: string[]): Promise<boolean>
	{
		const payload = { data: { dialogId, userIds } };
		if (userIds.length === 0)
		{
			return true;
		}

		try
		{
			const { usersNotInChat }: CheckChatAccessResult = await runAction(
				RestMethod.imV2ChatMemberCheckMembership,
				payload,
			);

			return usersNotInChat.length === 0;
		}
		catch (errors)
		{
			console.error('AccessService: error checking chat access', errors);
			throw errors;
		}
	},
};

const handleMessageAccessError = (errors: RunActionError[]): CheckMessageAccessResult => {
	const [error] = errors;
	if (MESSAGE_ACCESS_ERROR_CODES.has(error.code))
	{
		return { hasAccess: false, errorCode: error.code };
	}

	console.error('AccessService: error checking message access', error.code);

	// we need to handle all types of errors on this stage
	// but for now we let user through in case of unknown error
	return { hasAccess: true };
};
