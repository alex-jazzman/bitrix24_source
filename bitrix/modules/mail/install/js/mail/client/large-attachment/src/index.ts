import 'ui.alerts';

export { LargeAttachment } from './large-attachment';
export type {
	LargeAttachmentParams,
	LargeAttachmentState,
	LargeAttachmentSubmitState,
	DraftLargeAttachment,
} from './large-attachment';
export { MainMailFormAdapter } from './adapter/main-mail-form-adapter';
export type { MainMailFormAdapterParams } from './adapter/main-mail-form-adapter';
export type {
	AttachmentChangeType,
	FormAttachment,
	LargeAttachmentFormAdapter,
	LargeAttachmentSendContract,
} from './type/form-adapter';
export {
	ConvertErrorCode,
	largeAttachmentApi,
} from './api';
export type {
	ConvertError,
	ConvertRequest,
	ConvertResult,
	DeleteUploadedRequest,
	DeleteUploadedResult,
	LargeAttachmentContext,
} from './api';
