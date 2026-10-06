import { applyHacks } from './hacks';
import { BackgroundDialog } from './dialogs/background_dialog';
import { IncomingNotificationContent } from './dialogs/incoming_notification';
import { NotificationConferenceContent } from './dialogs/conference_notification';
import { FloatingScreenShare, FloatingScreenShareContent } from './floating_screenshare';
import { CallHint } from './call_hint_popup';
import { CallController } from './controller';
import {
	CallEngine,
	CallEvent,
	EndpointDirection,
	UserState,
	Provider,
	CallType,
	CallState,
	StartCallErrorCode,
	DisconnectReason,
	CallScheme,
} from './engine/engine';
import { CallEngineLegacy } from './engine/engine_legacy';
import { Hardware } from './call_hardware';
import Util from './util';
import { CallAI } from './call_ai';
import {VideoStrategy} from './video_strategy';
import { JoinResponseError, MediaStreamsKinds, CloudRecordKind, CloudRecordStatus } from './call_api';
import type { CallView } from 'call.lib.view-contract';
import { MediaRenderer } from './view/media-renderer';
import { CopilotNotify, CopilotNotifyType } from './view/copilot-notify';
import { CopilotPopup } from './view/copilot-popup';
import { ParticipantsPermissionPopup } from './view/participants-permission-popup';
import { WebScreenSharePopup } from './web_screenshare_popup';
import { UserListPopup } from 'call.component.user-list-popup';
import { UserList } from 'call.component.user-list';
import { CallCloudRecord, CallCommonRecordType, CallCommonRecordState } from './call_common_record';
import { STREAM_QUALITY, LOCAL_STREAM_QUALITY_HEIGHT } from './stream_quality';
import { UnsupportedBrowserFeatures } from './engine/unsupported_features_in_browsers';
import { LayoutService } from './services/layout-service';
import { ButtonStateService } from './services/button-state-service';
import { NotificationService } from './services/notification-service';
import { PromoService } from './services/promo-service';
import { DocumentEditorService } from './services/document-editor-service';
import { PictureInPictureService } from './services/picture-in-picture-service';
import { RecordingUiService } from './services/recording-ui-service';
import { CopilotUiService } from './services/copilot-ui-service';
import { FloatingWindowService } from './services/floating-window-service';
import { FeedbackUiService } from './services/feedback-ui-service';
import { HangupOptionsUiService } from './services/hangup-options-ui-service';
import { MediaStreamRegistry } from 'call.lib.media-registry';
import { getUnknownErrorType } from './utils/get-unknown-error-type';
import { sendPendingAccidentLogs } from './send-pending-accident-logs';

import 'loader';
import 'resize_observer';
import 'webrtc_adapter';
import 'im.lib.localstorage';
import 'ui.hint';
import 'voximplant';

applyHacks();
sendPendingAccidentLogs();

export {
	JoinResponseError,
	BackgroundDialog,
	CallController as Controller,
	CallEngine as Engine,
	CallEvent as Event,
	CallHint as Hint,
	CallState as State,
	CallEngineLegacy as EngineLegacy,
	EndpointDirection,
	StartCallErrorCode,
	DisconnectReason,
	FloatingScreenShare,
	FloatingScreenShareContent,
	IncomingNotificationContent,
	NotificationConferenceContent,
	Hardware,
	Provider,
	CallType as Type,
	UserState,
	Util,
	VideoStrategy,
	WebScreenSharePopup,
	UserListPopup,
	CopilotPopup,
	UserList,
	CallAI,
	CallScheme,
	ParticipantsPermissionPopup,
	CallCloudRecord,
	CallCommonRecordType,
	CallCommonRecordState,
	CloudRecordKind,
	CloudRecordStatus,
	MediaRenderer,
	CopilotNotify,
	CopilotNotifyType,
	MediaStreamsKinds,
	STREAM_QUALITY,
	LOCAL_STREAM_QUALITY_HEIGHT,
	UnsupportedBrowserFeatures,
	LayoutService,
	ButtonStateService,
	NotificationService,
	PromoService,
	DocumentEditorService,
	PictureInPictureService,
	RecordingUiService,
	CopilotUiService,
	FloatingWindowService,
	FeedbackUiService,
	HangupOptionsUiService,
	MediaStreamRegistry,
	getUnknownErrorType,
};

export type { CallView };

// compatibility
BX.CallEngine = CallEngine;
