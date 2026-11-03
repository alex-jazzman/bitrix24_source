import { LayoutWidget } from '../../../../../../../../../../mobile/dev/janative/api';
import { ChecklistMemberType } from '../../../../checklist/types';
import { ChecklistChangeAttachmentsParams } from './list';

export type ItemMembersProps = {
	item: ChecklistItemView,
	testId: string,
	onClick: (itemId: number | string, memberType: ChecklistMemberType) => void,
};

export type ItemAttachmentsDiskConfig = {
	folderId?: number | string,
};

export type ItemAttachmentsProps = {
	item: ChecklistItemView,
	testId?: string,
	parentWidget?: LayoutWidget,
	diskConfig?: ItemAttachmentsDiskConfig,
	readOnly?: boolean,
	onChange?: (params: ChecklistChangeAttachmentsParams) => void,
};

export type AttachmentFileInfo = {
	id: number | string,
	name: string,
	url: string,
	type: string,
	fileId: number,
	serverFileId: string,
	isUploading: boolean,
};

export type AttachmentUploadingInfo = {
	id: number | string | undefined,
	isUploading: boolean | undefined,
};
