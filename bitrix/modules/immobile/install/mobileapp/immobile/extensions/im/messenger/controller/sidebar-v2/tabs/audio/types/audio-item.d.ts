import { DialogId, MessageId } from '../../../../../types/common';

type AudioItemProps = {
	fileId: string | number,
	messageId: MessageId,
	dialogId: DialogId,
	stage: string,
	currentTime?: number,
	duration?: number,
	onClick: (fileId: string | number) => void,
	widgetNavigator: { backToChatMessage: (messageId: number) => Promise<unknown> }
}

export { AudioItemProps };
