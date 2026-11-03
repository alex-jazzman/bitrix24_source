import { applyHacks } from './hacks';
import { BackgroundDialog } from 'call.lib.background-dialog';
import { FloatingScreenShare, FloatingScreenShareContent } from './floating_screenshare';
import { CallHint } from './view/call-hint';
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
import { UserListPopup } from 'call.legacy.component.user-list-popup';
import { UserList } from 'call.legacy.component.user-list';
import { CallCloudRecord, CallCommonRecordType, CallCommonRecordState } from './call_common_record';
import { STREAM_QUALITY, LOCAL_STREAM_QUALITY_HEIGHT } from './stream_quality';
import { UnsupportedBrowserFeatures } from './engine/unsupported_features_in_browsers';
import { LayoutService } from './services/layout-service';
import { ButtonStateService } from './services/button-state-service';
import { NotificationService } from './services/notification-service';
import { DocumentEditorService } from './services/document-editor-service';
import { PictureInPictureService } from './services/picture-in-picture-service';
import { RecordingUiService } from './services/recording-ui-service';
import { CopilotUiService } from './services/copilot-ui-service';
import { FloatingWindowService } from './services/floating-window-service';
import { FeedbackUiService } from './services/feedback-ui-service';
import { HangupOptionsUiService } from './services/hangup-options-ui-service';
import { MediaStreamRegistry } from 'call.lib.media-registry';
import { CALL_PHONE_SVG } from './icons.js';
import { getUnknownErrorType } from './utils/get-unknown-error-type';
import { ReconnectSeriesReporter } from './utils/reconnect-series-reporter';

import 'loader';
import 'resize_observer';
import 'webrtc_adapter';
import 'im.lib.localstorage';
import 'ui.hint';
import 'voximplant';

applyHacks();

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
	DocumentEditorService,
	PictureInPictureService,
	RecordingUiService,
	CopilotUiService,
	FloatingWindowService,
	FeedbackUiService,
	HangupOptionsUiService,
	MediaStreamRegistry,
	CALL_PHONE_SVG,
	getUnknownErrorType,
	ReconnectSeriesReporter,
};

export type { CallView };

// compatibility
BX.CallEngine = CallEngine;
