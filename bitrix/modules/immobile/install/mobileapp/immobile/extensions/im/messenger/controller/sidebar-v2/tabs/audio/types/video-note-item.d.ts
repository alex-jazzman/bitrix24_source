import { DialogId, MessageId } from '../../../../../types/common';

type VideoNoteItemProps = {
	fileId: string | number,
	messageId: MessageId,
	dialogId: DialogId,
	widgetNavigator: { backToChatMessage: (messageId: number) => Promise<unknown> }
}

export { VideoNoteItemProps };
