import 'ui.notification';

import { UndoSendNotification } from './notification/undo-send-notification';

export { UndoSendApi, undoSendApi } from './api';
export { UndoSendGuide } from './guide/undo-send-guide';
export type {
	UndoSendGuideDependencies,
	UndoSendGuideOptions,
} from './guide/undo-send-guide';
export { UndoSendMenu } from './preference/undo-send-menu';
export type {
	UndoSendMenuItemOptions,
	UndoSendMenuOptions,
} from './preference/undo-send-menu';
export {
	UndoSendEvent,
	UndoSendNotification,
} from './notification/undo-send-notification';
export type { UndoSendNotificationDependencies } from './notification/undo-send-notification';
export { UndoSendErrorCode } from './types';
export type {
	CancelUndoSendRequest,
	CreateUndoSendRequest,
	SetUndoSendPreferenceRequest,
	UndoSendApiError,
	UndoSendDelay,
	UndoSendOperationDto,
	UndoSendPreference,
	UndoSendStatus,
} from './types';

export const undoSendNotification = new UndoSendNotification();
