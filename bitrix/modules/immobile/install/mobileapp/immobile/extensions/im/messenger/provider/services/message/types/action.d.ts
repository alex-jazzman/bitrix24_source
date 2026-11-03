import { MessageId } from '../../../../types/common';
import { RunActionError } from '../../../../lib/rest/types/ajax';

type MessageUpdateTextAttempt = {
	messageId: MessageId,
	attemptNumber: number,
	attemptId: string,
};

type MessageUpdateTextResult = {
	isLatestAttempt: boolean,
	success: boolean,
	queued: boolean,
	reason: RunActionError | null,
};
