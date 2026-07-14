import { AccessService, type CheckMessageAccessResult } from './classes/access-service';

export const MessageAccessManager = {
	checkMessageAccess(messageId: number): Promise<CheckMessageAccessResult>
	{
		return AccessService.checkMessageAccess(messageId);
	},
};
