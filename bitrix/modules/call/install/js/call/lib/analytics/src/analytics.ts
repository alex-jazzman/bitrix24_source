import { Type } from 'main.core';
import { sendData } from 'ui.analytics';

import { ChatType } from 'im.v2.const';
import { getCollabId, getUserType } from 'im.v2.lib.analytics';

import { Sync } from './classes/sync';
import { SyncTabBanner } from './classes/sync-tab-banner';
import { CallTypes } from 'call.const';
import { getCallTool } from './utils';

import { Copilot } from './classes/copilot';
import {
	AnalyticsEvent,
	AnalyticsTool,
	AnalyticsCategory,
	AnalyticsType,
	AnalyticsSection,
	AnalyticsElement,
	AnalyticsStatus,
	AnalyticsDeviceStatus,
	AnalyticsSubSection,
	AnalyticsAIStatus,
	AnalyticsVpnStatus,
	AnalyticsStorageType,
	type AnalyticsElementValue,
} from './const';

export { shouldSendToggleMicrophone, toAnalyticsErrorStatus } from './utils';
export type { ToggleMicrophoneCommand } from './utils';

const CALL_ALREADY_FINISHED_STATUS = 'call_already_finished';

type MediaParams = {
	video: boolean;
	audio?: boolean;
};

type DialogData = {
	readonly type: string;
	readonly chatId?: number;
	readonly entityLink?: { readonly id: string | number };
};

type AssociatedEntity = {
	id?: string;
	userCounter?: number;
	advanced: { chatType: string; entityId?: string | number };
};

type BaseCallParams = { callId: string };

type BaseCallTypeParams = BaseCallParams & { callType: string };

type ScreenShareStoppedParams = BaseCallTypeParams & {
	status: string;
	screenShareLength: number;
};

type StartVideoconfParams = BaseCallParams & {
	withVideo: boolean;
	status: string;
	mediaParams: MediaParams;
	userCounter: number;
	isCopilotActive: boolean;
	isVpnActive: boolean;
};

type JoinVideoconfParams = BaseCallParams & {
	withVideo: boolean;
	status: string;
	mediaParams: Required<MediaParams>;
	isVpnActive: boolean;
};

type StartCallParams = BaseCallTypeParams & {
	status: string;
	mediaParams: MediaParams;
	associatedEntity: AssociatedEntity;
	isCopilotActive: boolean;
	isVpnActive: boolean;
};

type CallIdentifier = string | number;

type StartCallErrorParams = {
	callType: string;
	callId?: CallIdentifier;
	errorCode: string;
	errorMessage?: string;
	isVpnActive: boolean;
	isOffline?: boolean;
};

type JoinCallParams = BaseCallTypeParams & {
	status: string;
	isVpnActive: boolean;
	section?: string;
	element?: string;
	mediaParams?: Required<MediaParams>;
	associatedEntity: AssociatedEntity;
};

type CallErrorParams = BaseCallTypeParams & {
	errorCode: string;
	errorMessage?: string;
	isVpnActive: boolean;
};

type JoinCallErrorParams = Omit<CallErrorParams, 'callId'> & {
	callId?: CallIdentifier;
	isRoomClosed?: boolean;
	isOffline?: boolean;
};

type ReconnectParams = BaseCallTypeParams & {
	reconnectionReason?: string;
	reconnectionReasonInfo?: string;
	isVpnActive: boolean;
};

type ReconnectResultParams = BaseCallTypeParams & {
	status: string;
	reconnectionReason?: string;
	attemptCount: number;
	isVpnActive: boolean;
};

type InviteUserParams = BaseCallTypeParams & { chatId: string };

type DisconnectCallParams = BaseCallTypeParams & {
	subSection?: string;
	mediaParams: Required<MediaParams>;
};

type FinishCallParams = BaseCallTypeParams & {
	status: string;
	callLength: number;
	callUsersCount: number;
	chatId: string;
};

type AnalyticsStorageTypeValue = typeof AnalyticsStorageType[keyof typeof AnalyticsStorageType];
type RecordWithErrorParams = BaseCallTypeParams & { errorCode?: string };
type RecordStateParams = RecordWithErrorParams & { storageType?: AnalyticsStorageTypeValue };
type RecordStartParams = RecordWithErrorParams & {
	recordType: string;
	storageType?: AnalyticsStorageTypeValue;
};
type RecordStopParams = BaseCallTypeParams & {
	subSection?: string;
	element?: string;
	recordTime?: number;
	storageType?: AnalyticsStorageTypeValue;
};

type ToggleCameraParams = BaseCallTypeParams & { video: boolean };
type ToggleMicrophoneParams = BaseCallTypeParams & {
	muted: boolean;
	source?: AnalyticsElementValue;
};
type ClickUserParams = BaseCallTypeParams & { layout: string };
type DocumentWithTypeParams = BaseCallTypeParams & { type: string };

type ChatCallClickParams = { callType: string; dialog: DialogData };
type ChatMessageCallClickParams = { dialog: DialogData };
type ContextMenuCallClickParams = { callType: string; context: DialogData };

type ConferenceClickParams = { chatId: string };
type RecentStartCallClickParams = { chatId: string; isGroupChat: boolean };

type StreamTypeParams = BaseCallTypeParams & { typeOfStream: 'mic' | 'cam' | 'screenshare' };
type SettingTypeParams = BaseCallTypeParams & { typeOfSetting: 'mic' | 'cam' | 'screenshare' };

/**
 * An entry that failed before the call existed has no identifier, and a placeholder one
 * (`callId_0`, `callId_null`) links the event to nothing. Omit the key instead of passing
 * undefined: ui.analytics puts every own key of the object into the query string.
 */
function buildCallIdParam(callId?: CallIdentifier | null): { p5?: string }
{
	// `0` and `''` are the shapes a missing identifier takes on its way here, not calls of their own.
	const hasIdentifier = !Type.isNil(callId) && callId !== '' && callId !== 0;

	return hasIdentifier ? { p5: `callId_${callId}` } : {};
}

export class Analytics
{
	static #instance: Analytics;
	static AnalyticsType = AnalyticsType;
	static AnalyticsStatus = AnalyticsStatus;
	static AnalyticsSection = AnalyticsSection;
	static AnalyticsElement = AnalyticsElement;
	static AnalyticsSubSection = AnalyticsSubSection;
	static AnalyticsStorageType = AnalyticsStorageType;

	copilot: Copilot = new Copilot();
	sync: Sync = new Sync();
	syncTabBanner: SyncTabBanner = new SyncTabBanner();

	#screenShareStarted: boolean = false;

	static getInstance(): Analytics
	{
		if (!this.#instance)
		{
			this.#instance = new this();
		}

		return this.#instance;
	}

	safeDecode(str: string): string
	{
		if (!str || !Type.isString(str))
		{
			return str;
		}

		if (!str.includes('%'))
		{
			return str;
		}

		try
		{
			const decoded = decodeURIComponent(str);

			if (decoded.includes('%25') || (decoded !== str && decoded.includes('%')))
			{
				return decodeURIComponent(decoded);
			}

			return decoded;
		}
		catch
		{
			return str;
		}
	}

	// The whitespace of a server code is normalized at the source (Util.getCallConnectionErrorCode), but a
	// code that arrives percent-encoded ('internal%20error') passes that step untouched and safeDecode turns
	// it back into a space. Normalizing here, after decoding, keeps one code to one status on the dashboard.
	#buildErrorStatus(errorCode: string): string
	{
		return this.safeDecode(`error_${errorCode}`).replaceAll(/\s+/g, '_');
	}

	// Outcome of a failed connect. A closed room is a normal result (`call_already_finished`), sent as
	// an outcome and not an `error_*` code so it stays off the connection-errors dashboard. Everything
	// else keeps `error_${errorCode}`. An offline failure is not reported at all — see onJoinCallError.
	// Agreed with analytics; do not "unify" this with the CamelCase server codes.
	#buildJoinErrorStatus(params: JoinCallErrorParams): string
	{
		if (params.isRoomClosed)
		{
			return CALL_ALREADY_FINISHED_STATUS;
		}

		return this.#buildErrorStatus(params.errorCode);
	}

	onScreenShareBtnClick({ callId, callType }: BaseCallTypeParams)
	{
		if (this.#screenShareStarted)
		{
			return;
		}

		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.clickScreenshare,
			type: callType,
			c_section: AnalyticsSection.callWindow,
			p5: `callId_${callId}`,
		});
	}

	onScreenShareStarted({ callId, callType }: BaseCallTypeParams)
	{
		this.#screenShareStarted = true;

		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.startScreenshare,
			type: callType,
			c_section: AnalyticsSection.callWindow,
			p5: `callId_${callId}`,
		});
	}

	onScreenShareStopped({ callId, callType, status, screenShareLength }: ScreenShareStoppedParams)
	{
		if (!this.#screenShareStarted)
		{
			return;
		}

		this.#screenShareStarted = false;

		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.finishScreenshare,
			type: callType,
			c_section: AnalyticsSection.callWindow,
			// @ts-expect-error [call-ts] wait AnalyticsOptions from ui.analytics to ts
			status,
			p1: `shareLength_${screenShareLength}`,
			p5: `callId_${callId}`,
		});
	}

	onAnswerConference(params: BaseCallParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.clickAnswer,
			type: AnalyticsType.videoconf,
			c_section: AnalyticsSection.callPopup,
			p5: `callId_${params.callId}`,
		});
	}

	onDeclineConference(params: BaseCallParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.clickDeny,
			type: AnalyticsType.videoconf,
			c_section: AnalyticsSection.callPopup,
			p5: `callId_${params.callId}`,
		});
	}

	onStartVideoconf(params: StartVideoconfParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.startCall,
			type: AnalyticsType.videoconf,
			c_element: params.withVideo ? AnalyticsElement.videoButton : AnalyticsElement.audioButton,
			// @ts-expect-error [call-ts] AnalyticsOptions.status is too narrow; wait ui.analytics to ts
			status: params.status,
			p1: params.mediaParams.video ? AnalyticsDeviceStatus.videoOn : AnalyticsDeviceStatus.videoOff,
			p2: `chatUserCount_${params.userCounter}`,
			p3: params.isCopilotActive ? AnalyticsAIStatus.aiOn : AnalyticsAIStatus.aiOff,
			p4: params.isVpnActive ? AnalyticsVpnStatus.vpnOn : AnalyticsVpnStatus.vpnOff,
			p5: `callId_${params.callId}`,
		});
	}

	onJoinVideoconf(params: JoinVideoconfParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.connect,
			type: AnalyticsType.videoconf,
			c_element: params.withVideo ? AnalyticsElement.videoButton : AnalyticsElement.audioButton,
			// @ts-expect-error [call-ts] AnalyticsOptions.status is too narrow; wait ui.analytics to ts
			status: params.status,
			p1: params.mediaParams.video ? AnalyticsDeviceStatus.videoOn : AnalyticsDeviceStatus.videoOff,
			p2: params.mediaParams.audio ? AnalyticsDeviceStatus.micOn : AnalyticsDeviceStatus.micOff,
			p4: params.isVpnActive ? AnalyticsVpnStatus.vpnOn : AnalyticsVpnStatus.vpnOff,
			p5: `callId_${params.callId}`,
		});
	}

	onStartCall(params: StartCallParams)
	{
		const chatType = params.associatedEntity?.advanced?.chatType;

		const resultData = {
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.startCall,
			type: params.callType,
			status: params.status,
			p1: params.mediaParams.video ? AnalyticsDeviceStatus.videoOn : AnalyticsDeviceStatus.videoOff,
			p2: `chatUserCount_${params.associatedEntity?.userCounter}`,
			p3: params.isCopilotActive ? AnalyticsAIStatus.aiOn : AnalyticsAIStatus.aiOff,
			p4: params.isVpnActive ? AnalyticsVpnStatus.vpnOn : AnalyticsVpnStatus.vpnOff,
			p5: `callId_${params.callId}`,
		};

		if (chatType === ChatType.collab && params.status === AnalyticsStatus.success)
		{
			const resultDataCollab = {
				tool: getCallTool(),
				category: AnalyticsCategory.collabCall,
				event: AnalyticsEvent.startCallCollab,
				type: params.callType,
				status: params.status,
				p4: getCollabId(Number(this.normalizeChatId(params.associatedEntity.id))) ?? undefined,
				p5: `callId_${params.callId}`,
			};

			sendData(resultDataCollab);
		}
		else if (chatType === ChatType.collab && params.status !== AnalyticsStatus.success)
		{
			return;
		}

		// @ts-expect-error [call-ts] AnalyticsOptions.status is too narrow; wait ui.analytics to ts
		sendData(resultData);
	}

	onStartCallError(params: StartCallErrorParams)
	{
		// A network failure while the client is confirmed offline is the user's own connectivity, not a
		// server/infra error: it is not reported to analytics at all, so it never reaches the dashboard.
		if (params.isOffline)
		{
			return;
		}

		const resultData = {
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.startCall,
			type: params.callType,
			status: this.#buildErrorStatus(params.errorCode),
			p3: params.errorMessage ? `msg_${params.errorMessage}`.slice(0, 100) : undefined,
			p4: params.isVpnActive ? AnalyticsVpnStatus.vpnOn : AnalyticsVpnStatus.vpnOff,
			...buildCallIdParam(params.callId),
		};

		// @ts-expect-error [call-ts] AnalyticsOptions.status is too narrow; wait ui.analytics to ts
		sendData(resultData);
	}

	onJoinCall(params: JoinCallParams)
	{
		const chatType = params.associatedEntity?.advanced?.chatType;

		const sendParams = {
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.connect,
			type: params.callType,
			status: params.status,
			p3: getUserType(),
			p4: params.isVpnActive ? AnalyticsVpnStatus.vpnOn : AnalyticsVpnStatus.vpnOff,
			p5: `callId_${params.callId}`,
		};

		if (params.section)
		{
			// @ts-expect-error [call-ts] property not in inferred sendParams type; wait ui.analytics to ts
			sendParams.c_section = params.section;
		}

		if (params.element)
		{
			// @ts-expect-error [call-ts] property not in inferred sendParams type; wait ui.analytics to ts
			sendParams.c_element = params.element;
		}

		if (params.mediaParams)
		{
			// @ts-expect-error [call-ts] property not in inferred sendParams type; wait ui.analytics to ts
			sendParams.p1 = params.mediaParams.video ? AnalyticsDeviceStatus.videoOn : AnalyticsDeviceStatus.videoOff;
			// @ts-expect-error [call-ts] property not in inferred sendParams type; wait ui.analytics to ts
			sendParams.p2 = params.mediaParams.audio ? AnalyticsDeviceStatus.micOn : AnalyticsDeviceStatus.micOff;
		}

		if (chatType === ChatType.collab && params.status === AnalyticsStatus.success)
		{
			const collabId = params.associatedEntity.advanced.entityId;

			const resultDataCollab = {
				tool: getCallTool(),
				category: AnalyticsCategory.collabCall,
				event: AnalyticsEvent.connectCallCollab,
				type: params.callType,
				status: params.status,
				p4: `collabId_${collabId}`,
				p5: `callId_${params.callId}`,
			};

			sendData(resultDataCollab);
		}
		else if (chatType === ChatType.collab && params.status !== AnalyticsStatus.success)
		{
			return;
		}

		// @ts-expect-error [call-ts] property not in inferred sendParams type; wait ui.analytics to ts
		sendData(sendParams);
	}

	onJoinCallError(params: JoinCallErrorParams)
	{
		// A network failure while the client is confirmed offline is the user's own connectivity, not a
		// server/infra error: it is not reported to analytics at all, so it never reaches the dashboard.
		// A closed room is a real server response (not an offline failure) and is still reported below.
		if (params.isOffline && !params.isRoomClosed)
		{
			return;
		}

		const resultData = {
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.connect,
			type: params.callType,
			status: this.#buildJoinErrorStatus(params),
			p3: params.errorMessage ? `msg_${params.errorMessage}`.slice(0, 100) : undefined,
			p4: params.isVpnActive ? AnalyticsVpnStatus.vpnOn : AnalyticsVpnStatus.vpnOff,
			...buildCallIdParam(params.callId),
		};

		// @ts-expect-error [call-ts] AnalyticsOptions.status is too narrow; wait ui.analytics to ts
		sendData(resultData);
	}

	onReconnect(params: ReconnectParams)
	{
		const reconnectionReasonInfo = params.reconnectionReasonInfo
			?.replace('Handling a remote offer failed: InvalidAccessError: ', '*')
			.replaceAll('_', '-')
			.slice(0, 100);

		const sendParams = {
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.reconnect,
			type: params.callType,
			status: params.reconnectionReason || '',
			p2: params.isVpnActive ? AnalyticsVpnStatus.vpnOn : AnalyticsVpnStatus.vpnOff,
			p5: `callId_${params.callId}`,
		};

		if (reconnectionReasonInfo)
		{
			// The key is left out rather than held with an undefined value: ui.analytics puts every key
			// of the payload into the query string, so an undefined p3 would travel as the text
			// `undefined`.
			// @ts-expect-error [call-ts] property not in inferred sendParams type; wait ui.analytics to ts
			sendParams.p3 = `msg_${reconnectionReasonInfo}`;
		}

		// @ts-expect-error [call-ts] AnalyticsOptions.status is too narrow; wait ui.analytics to ts
		sendData(sendParams);
	}

	/**
	 * The outcome of a reconnect series, sent once per series. `status` carries the outcome itself,
	 * so the reason the series started travels in `p3`; otherwise `success` and `not_recovered`
	 * would not say what they are about. Underscores of the reason become hyphens in `p3`: a value
	 * of p1-p5 with two of them drops the whole event, and the `msg_` prefix already spends the
	 * only one allowed. A series that started without a reason leaves the key out altogether, the
	 * same way the initiation does.
	 */
	onReconnectResult(params: ReconnectResultParams)
	{
		const reconnectionReason = params.reconnectionReason?.replaceAll('_', '-').slice(0, 100);

		const sendParams = {
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.reconnectResult,
			type: params.callType,
			// Whitespace is collapsed after decoding, the same way #buildErrorStatus does it for the
			// connect event: a refusal that arrives percent-encoded must not split one status in two.
			status: this.safeDecode(params.status).replaceAll(/\s+/g, '_'),
			p2: params.isVpnActive ? AnalyticsVpnStatus.vpnOn : AnalyticsVpnStatus.vpnOff,
			p4: `attemptCount_${params.attemptCount}`,
			p5: `callId_${params.callId}`,
		};

		if (reconnectionReason)
		{
			// @ts-expect-error [call-ts] property not in inferred sendParams type; wait ui.analytics to ts
			sendParams.p3 = `msg_${reconnectionReason}`;
		}

		// @ts-expect-error [call-ts] AnalyticsOptions.status is too narrow; wait ui.analytics to ts
		sendData(sendParams);
	}

	onInviteUser(params: InviteUserParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.addUser,
			type: params.callType,
			c_section: AnalyticsSection.callWindow,
			p4: `chatId_${this.normalizeChatId(params.chatId)}`,
			p5: `callId_${params.callId}`,
		});
	}

	onDisconnectCall(params: DisconnectCallParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.disconnect,
			type: params.callType,
			c_section: AnalyticsSection.callWindow,
			c_sub_section: params.subSection,
			// @ts-expect-error [call-ts] AnalyticsStatus.quit is not in AnalyticsOptions.status union;
			// wait ui.analytics to ts
			status: AnalyticsStatus.quit,
			p1: params.mediaParams.video ? AnalyticsDeviceStatus.videoOn : AnalyticsDeviceStatus.videoOff,
			p2: params.mediaParams.audio ? AnalyticsDeviceStatus.micOn : AnalyticsDeviceStatus.micOff,
			p5: `callId_${params.callId}`,
		});
	}

	onFinishCall(params: FinishCallParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.finishCall,
			type: params.callType,
			c_section: AnalyticsSection.callWindow,
			// @ts-expect-error [call-ts] AnalyticsOptions.status is too narrow; wait ui.analytics to ts
			status: params.status,
			p1: `callLength_${params.callLength}`,
			p3: `maxUserCount_${params.callUsersCount}`,
			p4: `chatId_${this.normalizeChatId(params.chatId)}`,
			p5: `callId_${params.callId}`,
		});
	}

	onRecordBtnClick(params: BaseCallTypeParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.clickRecord,
			type: params.callType,
			c_section: AnalyticsSection.callWindow,
			c_element: AnalyticsElement.recordButton,
			p5: `callId_${params.callId}`,
		});
	}

	onRecordStart(params: RecordStartParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.recordStart,
			type: params.callType,
			c_section: AnalyticsSection.callWindow,
			// @ts-expect-error [call-ts] AnalyticsOptions.status is too narrow; wait ui.analytics to ts
			status: params.errorCode ? this.#buildErrorStatus(params.errorCode) : AnalyticsStatus.success,
			p1: `recordType_${params.recordType}`,
			p3: params.storageType ? `recordType_${params.storageType}` : undefined,
			p5: `callId_${params.callId}`,
		});
	}

	onRecordPaused(params: RecordStateParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.recordPaused,
			type: params.callType,
			c_section: AnalyticsSection.callWindow,
			// @ts-expect-error [call-ts] AnalyticsOptions.status is too narrow; wait ui.analytics to ts
			status: params.errorCode ? this.#buildErrorStatus(params.errorCode) : AnalyticsStatus.success,
			p3: params.storageType ? `recordType_${params.storageType}` : undefined,
			p5: `callId_${params.callId}`,
		});
	}

	onRecordResumed(params: RecordStateParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.recordResumed,
			type: params.callType,
			c_section: AnalyticsSection.callWindow,
			// @ts-expect-error [call-ts] AnalyticsOptions.status is too narrow; wait ui.analytics to ts
			status: params.errorCode ? this.#buildErrorStatus(params.errorCode) : AnalyticsStatus.success,
			p3: params.storageType ? `recordType_${params.storageType}` : undefined,
			p5: `callId_${params.callId}`,
		});
	}

	onRecordDelete(params: RecordStateParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.recordDelete,
			type: params.callType,
			// @ts-expect-error [call-ts] AnalyticsOptions.status is too narrow; wait ui.analytics to ts
			status: params.errorCode ? this.#buildErrorStatus(params.errorCode) : AnalyticsStatus.success,
			p3: params.storageType ? `recordType_${params.storageType}` : undefined,
			p5: `callId_${params.callId}`,
		});
	}

	onRecordStop(params: RecordStopParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.recordStop,
			type: params.callType,
			c_section: AnalyticsSection.callWindow,
			c_sub_section: params.subSection,
			c_element: params.element,
			p1: `recordLength_${params?.recordTime}`,
			p3: params.storageType ? `recordType_${params.storageType}` : undefined,
			p5: `callId_${params.callId}`,
		});
	}

	onCloudRecordPopupShow(params: BaseCallParams & { popupType: string })
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.callRecord,
			event: AnalyticsEvent.viewPopup,
			type: params.popupType,
			p5: `callId_${params.callId}`,
		});
	}

	onToggleCamera(params: ToggleCameraParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: params.video ? AnalyticsEvent.cameraOn : AnalyticsEvent.cameraOff,
			type: params.callType,
			c_section: AnalyticsSection.callWindow,
			p5: `callId_${params.callId}`,
		});
	}

	onToggleMicrophone(params: ToggleMicrophoneParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: params.muted ? AnalyticsEvent.micOff : AnalyticsEvent.micOn,
			type: params.callType,
			c_section: AnalyticsSection.callWindow,
			c_element: params.source ?? AnalyticsElement.micButton,
			p5: `callId_${params.callId}`,
		});
	}

	onClickUser(params: ClickUserParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.clickUserFrame,
			type: params.callType,
			c_section: AnalyticsSection.callWindow,
			c_sub_section: params.layout.toLowerCase(),
			p5: `callId_${params.callId}`,
		});
	}

	onFloorRequest(params: BaseCallTypeParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.handOn,
			type: params.callType,
			c_section: AnalyticsSection.callWindow,
			p5: `callId_${params.callId}`,
		});
	}

	onShowChat(params: BaseCallTypeParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.clickChat,
			type: params.callType,
			c_section: AnalyticsSection.callWindow,
			p5: `callId_${params.callId}`,
		});
	}

	onDocumentBtnClick(params: BaseCallTypeParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.callDocs,
			event: AnalyticsEvent.click,
			p4: `callType_${params.callType}`,
			p5: `callId_${params.callId}`,
		});
	}

	onDocumentCreate(params: DocumentWithTypeParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.callDocs,
			event: AnalyticsEvent.create,
			type: params.type,
			p4: `callType_${params.callType}`,
			p5: `callId_${params.callId}`,
		});
	}

	onDocumentClose(params: DocumentWithTypeParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.callDocs,
			event: AnalyticsEvent.save,
			type: params.type,
			p4: `callType_${params.callType}`,
			p5: `callId_${params.callId}`,
		});
	}

	onDocumentUpload(params: DocumentWithTypeParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.callDocs,
			event: AnalyticsEvent.upload,
			type: params.type,
			p4: `callType_${params.callType}`,
			p5: `callId_${params.callId}`,
		});
	}

	onLastResumeOpen(params: BaseCallTypeParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.callDocs,
			event: AnalyticsEvent.openResume,
			p4: `callType_${params.callType}`,
			p5: `callId_${params.callId}`,
		});
	}

	normalizeChatId(chatId: string | undefined): string | number
	{
		if (!chatId)
		{
			return 0;
		}

		return chatId.includes('chat') ? chatId.replace('chat', '') : chatId;
	}

	onChatHeaderStartCallClick(params: ChatCallClickParams)
	{
		const resultData = {
			tool: getCallTool(),
			category: AnalyticsCategory.messenger,
			event: AnalyticsEvent.clickCallButton,
			c_section: this.#getSectionParamByChatType(params.dialog.type),
			c_sub_section: AnalyticsSubSection.window,
			p5: `chatId_${params.dialog.chatId}`,
		};

		// @ts-expect-error [call-ts] wait AnalyticsOptions from ui.analytics to ts
		resultData.type = this.#getCallTypeParam(params.dialog.type);
		// @ts-expect-error [call-ts] wait AnalyticsOptions from ui.analytics to ts
		resultData.c_element = this.#getCallElementParam(params.callType);

		if (params.dialog.type === ChatType.collab)
		{
			// @ts-expect-error [call-ts] wait AnalyticsOptions from ui.analytics to ts
			resultData.p4 = getCollabId(params.dialog.chatId) ?? undefined;
		}

		this.#sendTaskCardCallClick(params.dialog, params.callType);

		sendData(resultData);
	}

	onContextMenuStartCallClick(params: ContextMenuCallClickParams)
	{
		const resultData = {
			tool: getCallTool(),
			category: AnalyticsCategory.messenger,
			event: AnalyticsEvent.clickCallButton,
			c_section: this.#getSectionParamByChatType(params.context.type),
			c_sub_section: AnalyticsSubSection.contextMenu,
			p5: `chatId_${params.context.chatId}`,
		};

		// @ts-expect-error [call-ts] wait AnalyticsOptions from ui.analytics to ts
		resultData.type = this.#getCallTypeParam(params.context.type);
		// @ts-expect-error [call-ts] wait AnalyticsOptions from ui.analytics to ts
		resultData.c_element = this.#getCallElementParam(params.callType);

		if (params.context.type === ChatType.collab)
		{
			// @ts-expect-error [call-ts] wait AnalyticsOptions from ui.analytics to ts
			resultData.p4 = getCollabId(params.context.chatId) ?? undefined;
		}

		this.#sendTaskCardCallClick(params.context, params.callType);

		sendData(resultData);
	}

	#getCallElementParam(callType: string): string
	{
		return callType === CallTypes.video.id ? AnalyticsElement.videocall : AnalyticsElement.audiocall;
	}

	#getCallTypeParam(type: string): string
	{
		return type === ChatType.user ? AnalyticsType.private : AnalyticsType.group;
	}

	#getSectionParamByChatType(chatType: string): string
	{
		const isTaskChat = chatType === ChatType.taskComments;
		if (!isTaskChat)
		{
			return AnalyticsSection.chatWindow;
		}

		return this.#isTaskCardSliderOpen() ? AnalyticsSection.taskCard : AnalyticsSection.taskChat;
	}

	#isTaskCardSliderOpen(): boolean
	{
		const topSlider = (BX as any).SidePanel?.Instance?.getTopSlider();

		return topSlider !== null && topSlider !== undefined && /\/tasks\/task\/view\/\d+\//.test(topSlider.getUrl());
	}

	#getTaskIdParam(dialogData: DialogData): string
	{
		const isTaskChat = dialogData?.type === ChatType.taskComments;
		if (!isTaskChat)
		{
			return '';
		}

		const taskId = Number.parseInt(String(dialogData?.entityLink?.id), 10);
		if (!Number.isInteger(taskId))
		{
			return 'taskId_0';
		}

		return `taskId_${taskId}`;
	}

	#sendTaskCardCallClick(dialogData: DialogData, callType: string): void
	{
		const isTaskChat = dialogData?.type === ChatType.taskComments;
		if (!isTaskChat)
		{
			return;
		}

		const taskIdParam = this.#getTaskIdParam(dialogData);
		if (!taskIdParam)
		{
			return;
		}

		const isTaskCard = this.#isTaskCardSliderOpen();

		const resultData = {
			tool: AnalyticsTool.task,
			category: AnalyticsCategory.chatOperations,
			event: AnalyticsEvent.clickCallButton,
			type: callType === CallTypes.audio.id ? AnalyticsType.audio : AnalyticsType.video,
			p1: taskIdParam,
		};

		if (isTaskCard)
		{
			// @ts-expect-error [call-ts] wait AnalyticsOptions from ui.analytics to ts
			resultData.c_sub_section = AnalyticsSubSection.taskCard;
		}
		else
		{
			// @ts-expect-error [call-ts] wait AnalyticsOptions from ui.analytics to ts
			resultData.c_section = AnalyticsSection.chatTasks;
		}

		sendData(resultData);
	}

	onStartConferenceClick(params: ConferenceClickParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.clickStartConf,
			type: AnalyticsType.videoconf,
			c_section: AnalyticsSection.chatWindow,
			c_element: AnalyticsElement.startButton,
			p5: `chatId_${params.chatId}`,
		});
	}

	onChatCreationMessageStartCallClick(params: ConferenceClickParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.messenger,
			event: AnalyticsEvent.clickCallButton,
			type: AnalyticsType.groupCall,
			c_section: AnalyticsSection.chatWindow,
			c_sub_section: AnalyticsSubSection.window,
			c_element: AnalyticsElement.initialBanner,
			p5: `chatId_${params.chatId}`,
		});
	}

	onRecentStartCallClick(params: RecentStartCallClickParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.messenger,
			event: AnalyticsEvent.clickCallButton,
			type: params.isGroupChat
				? AnalyticsType.groupCall
				: AnalyticsType.privateCall,
			c_section: AnalyticsSection.chatList,
			c_sub_section: AnalyticsSubSection.contextMenu,
			c_element: AnalyticsElement.videocall,
			p5: `chatId_${params.chatId}`,
		});
	}

	onChatStartConferenceClick(params: ConferenceClickParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.clickStartConf,
			type: AnalyticsType.videoconf,
			c_section: AnalyticsSection.chatWindow,
			c_element: AnalyticsElement.initialBanner,
			p5: `chatId_${params.chatId}`,
		});
	}

	onJoinConferenceClick(params: BaseCallParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.clickJoin,
			type: AnalyticsType.videoconf,
			c_section: AnalyticsSection.chatList,
			p5: `callId_${params.callId}`,
		});
	}

	onStartCallMessageClick(params: ChatMessageCallClickParams): void
	{
		this.#onCallMessageClick(params, AnalyticsElement.startMessage);
	}

	onFinishCallMessageClick(params: ChatMessageCallClickParams): void
	{
		this.#onCallMessageClick(params, AnalyticsElement.finishMessage);
	}

	onOpenCallSettings(params: BaseCallTypeParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.openSettings,
			type: params.callType,
			p5: `callId_${params.callId}`,
		});
	}

	onDeleteUser(params: BaseCallTypeParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.deleteUser,
			type: params.callType,
			p5: `callId_${params.callId}`,
		});
	}

	onCallSettingsChanged(params: SettingTypeParams)
	{
		let event = '';

		switch (params.typeOfSetting)
		{
			case 'mic':
				event = AnalyticsEvent.restrictMic;
				break;
			case 'cam':
				event = AnalyticsEvent.restrictCamera;
				break;
			case 'screenshare':
				event = AnalyticsEvent.restrictScreenshare;
				break;
			default:
				break;
		}

		if (event)
		{
			sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event,
				type: params.callType,
				/* p1: params.settingEnabled, */
				p5: `callId_${params.callId}`,
			});
		}
	}

	onTurnOffAllParticipansStream(params: StreamTypeParams)
	{
		let event = '';

		switch (params.typeOfStream)
		{
			case 'mic':
				event = AnalyticsEvent.allMicOff;
				break;
			case 'cam':
				event = AnalyticsEvent.allCamerasOff;
				break;
			case 'screenshare':
				event = AnalyticsEvent.allScreenshareOff;
				break;
			default:
				break;
		}

		if (event)
		{
			sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event,
				type: params.callType,
				p5: `callId_${params.callId}`,
			});
		}
	}

	onTurnOffParticipantStream(params: SettingTypeParams)
	{
		let event = '';

		switch (params.typeOfSetting)
		{
			case 'mic':
				event = AnalyticsEvent.userMicOff;
				break;
			case 'cam':
				event = AnalyticsEvent.userCameraOff;
				break;
			case 'screenshare':
				event = AnalyticsEvent.userScreenshareOff;
				break;
			default:
				break;
		}

		if (event)
		{
			sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event,
				type: params.callType,
				p5: `callId_${params.callId}`,
			});
		}
	}

	onAllowPermissionToSpeakResponse(params: BaseCallTypeParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.approveRequest,
			type: params.callType,
			p5: `callId_${params.callId}`,
		});
	}

	onDisallowPermissionToSpeakResponse(params: BaseCallTypeParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.denyRequest,
			type: params.callType,
			p5: `callId_${params.callId}`,
		});
	}

	#onCallMessageClick(params: ChatMessageCallClickParams, element: string): void
	{
		// @ts-expect-error [call-ts] wait AnalyticsOptions from ui.analytics to ts
		const resultData: Parameters<typeof sendData>[0] = {
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.messenger,
			event: AnalyticsEvent.clickCallButton,
			c_section: this.#getSectionParamByChatType(params.dialog.type),
			c_element: element,
			p5: `chatId_${params.dialog.chatId}`,
		};

		// @ts-expect-error [call-ts] wait AnalyticsOptions from ui.analytics to ts
		resultData.type = this.#getCallTypeParam(params.dialog.type);

		if (params.dialog.type === ChatType.collab)
		{
			// @ts-expect-error [call-ts] wait AnalyticsOptions from ui.analytics to ts
			resultData.p4 = getCollabId(params.dialog.chatId) ?? undefined;
		}

		this.#sendTaskCardCallClick(params.dialog, CallTypes.video.id);

		sendData(resultData);
	}
}
