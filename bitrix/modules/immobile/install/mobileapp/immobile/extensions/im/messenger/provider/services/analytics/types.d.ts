import { FileType } from '../../../model/files/src/types';
import { DialogId } from '../../../types/common';

type sendAnalyticsParams = {
	fileType: FileType,
	dialogId: DialogId,
	status?: string,
	isNestedSection: boolean,
}

export type SendMessageMenuCommonAnalyticsParams = {
	dialogId: DialogId,
	actionId: string,
	isNestedSection: boolean
	sectionId?: string
}

export { sendAnalyticsParams };
