import { DialogId, MessageId } from '../../../../../types/common';

type FileActionMenuParams = {
	fileId: string | number,
	dialogId: DialogId,
	messageId: MessageId,
	widgetNavigator: { backToChatMessage: (messageId: number) => Promise<unknown> },
	testId?: string
}

export { FileActionMenuParams };
