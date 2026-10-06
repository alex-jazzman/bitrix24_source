import './large-attachment.css';
import 'ui.alerts';

export {
	LargeAttachment,
} from './large-attachment';
export type {
	MainMailLargeAttachmentParams,
} from './large-attachment';
export { LegacyEmailLargeAttachment } from './legacy-email-large-attachment';
export type { LegacyEmailLargeAttachmentParams } from './legacy-email-large-attachment';
export { LegacySubmitGuard } from './legacy-submit-guard';
export { LegacyEmailAdapter } from './adapter/legacy-email-adapter';
export type { LegacyEmailAdapterParams } from './adapter/legacy-email-adapter';
export { MainMailFormAdapter } from './adapter/main-mail-form-adapter';
export type { MainMailFormAdapterParams } from './adapter/main-mail-form-adapter';
export {
	CrmLargeAttachmentErrorCode,
	CrmLargeAttachmentNotification,
	extractErrorCode,
	getErrorMessageKey,
} from './notification';
