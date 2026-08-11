import { Type } from 'main.core';
import { sendData } from 'ui.analytics';

import { ChatType } from 'im.v2.const';
import { getCollabId, getUserType } from 'im.v2.lib.analytics';

import { CallTypes } from 'call.const';

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
} from './const';

type MediaParams = {
	video: boolean;
	audio?: boolean;
};

type DialogData = {
	type: string;
	chatId?: string;
	entityLink?: { id: string | number };
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

type StartCallErrorParams = {
	callType: string;
	errorCode: string;
	errorMessage?: string;
	isVpnActive: boolean;
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

type ReconnectParams = BaseCallTypeParams & {
	reconnectionReason?: string;
	reconnectionReasonInfo?: string;
	isVpnActive: boolean;
	reconnectionEventCount: number;
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

type RecordWithErrorParams = BaseCallTypeParams & { errorCode?: string };
type RecordStartParams = RecordWithErrorParams & { recordType: string };
type RecordStopParams = BaseCallTypeParams & {
	subSection?: string;
	element?: string;
	recordTime?: number;
};

type ToggleCameraParams = BaseCallTypeParams & { video: boolean };
type ToggleMicrophoneParams = BaseCallTypeParams & { muted: boolean };
type ClickUserParams = BaseCallTypeParams & { layout: string };
type DocumentWithTypeParams = BaseCallTypeParams & { type: string };

type ChatCallClickParams = { callType: string; dialog: DialogData };
type ContextMenuCallClickParams = { callType: string; context: DialogData };

type ConferenceClickParams = { chatId: string };

type StreamTypeParams = BaseCallTypeParams & { typeOfStream: 'mic' | 'cam' | 'screenshare' };
type SettingTypeParams = BaseCallTypeParams & { typeOfSetting: 'mic' | 'cam' | 'screenshare' };

export class Analytics
{
	static #instance: Analytics;
	static AnalyticsType = AnalyticsType;
	static AnalyticsStatus = AnalyticsStatus;
	static AnalyticsSection = AnalyticsSection;
	static AnalyticsElement = AnalyticsElement;
	static AnalyticsSubSection = AnalyticsSubSection;

	copilot: Copilot = new Copilot();

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

	onScreenShareBtnClick({ callId, callType }: BaseCallTypeParams)
	{
		if (this.#screenShareStarted)
		{
			return;
		}

		sendData({
			tool: AnalyticsTool.im,
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
			tool: AnalyticsTool.im,
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
			tool: AnalyticsTool.im,
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
			tool: AnalyticsTool.im,
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
			tool: AnalyticsTool.im,
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
			tool: AnalyticsTool.im,
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
			tool: AnalyticsTool.im,
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
			tool: AnalyticsTool.im,
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
				tool: AnalyticsTool.im,
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
		const resultData = {
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.startCall,
			type: params.callType,
			status: this.safeDecode(`error_${params.errorCode}`),
			p3: params.errorMessage ? `msg_${params.errorMessage}`.slice(0, 100) : undefined,
			p4: params.isVpnActive ? AnalyticsVpnStatus.vpnOn : AnalyticsVpnStatus.vpnOff,
			p5: 'callId_0',
		};

		// @ts-expect-error [call-ts] AnalyticsOptions.status is too narrow; wait ui.analytics to ts
		sendData(resultData);
	}

	onJoinCall(params: JoinCallParams)
	{
		const chatType = params.associatedEntity?.advanced?.chatType;

		const sendParams = {
			tool: AnalyticsTool.im,
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
				tool: AnalyticsTool.im,
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

	onJoinCallError(params: CallErrorParams)
	{
		const resultData = {
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.connect,
			type: params.callType,
			status: this.safeDecode(`error_${params.errorCode}`),
			p3: params.errorMessage ? `msg_${params.errorMessage}`.slice(0, 100) : undefined,
			p4: params.isVpnActive ? AnalyticsVpnStatus.vpnOn : AnalyticsVpnStatus.vpnOff,
			p5: `callId_${params.callId}`,
		};

		// @ts-expect-error [call-ts] AnalyticsOptions.status is too narrow; wait ui.analytics to ts
		sendData(resultData);
	}

	onReconnect(params: ReconnectParams)
	{
		const reconnectionReasonInfo = params.reconnectionReasonInfo
			?.replace('Handling a remote offer failed: InvalidAccessError: ', '*')
			.replaceAll('_', '')
			.slice(0, 100);

		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.reconnect,
			type: params.callType,
			c_section: AnalyticsSection.callWindow,
			// @ts-expect-error [call-ts] AnalyticsOptions.status is too narrow; wait ui.analytics to ts
			status: params.reconnectionReason || '',
			p2: params.isVpnActive ? AnalyticsVpnStatus.vpnOn : AnalyticsVpnStatus.vpnOff,
			p3: `msg_${reconnectionReasonInfo}`,
			p4: `attemptNumber_${params.reconnectionEventCount}`,
			p5: `callId_${params.callId}`,
		});
	}

	onReconnectError(params: CallErrorParams)
	{
		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.reconnect,
			type: params.callType,
			// @ts-expect-error [call-ts] AnalyticsOptions.status is too narrow; wait ui.analytics to ts
			status: this.safeDecode(`error_${params.errorCode}`),
			p3: params.errorMessage ? `msg_${params.errorMessage}`.slice(0, 100) : undefined,
			p4: params.isVpnActive ? AnalyticsVpnStatus.vpnOn : AnalyticsVpnStatus.vpnOff,
			p5: `callId_${params.callId}`,
		});
	}

	onInviteUser(params: InviteUserParams)
	{
		sendData({
			tool: AnalyticsTool.im,
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
			tool: AnalyticsTool.im,
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
			tool: AnalyticsTool.im,
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
			tool: AnalyticsTool.im,
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
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.recordStart,
			type: params.callType,
			c_section: AnalyticsSection.callWindow,
			// @ts-expect-error [call-ts] AnalyticsOptions.status is too narrow; wait ui.analytics to ts
			status: params.errorCode ? this.safeDecode(`error_${params.errorCode}`) : AnalyticsStatus.success,
			p1: `recordType_${params.recordType}`,
			p5: `callId_${params.callId}`,
		});
	}

	onRecordPaused(params: RecordWithErrorParams)
	{
		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.recordPaused,
			type: params.callType,
			c_section: AnalyticsSection.callWindow,
			// @ts-expect-error [call-ts] AnalyticsOptions.status is too narrow; wait ui.analytics to ts
			status: params.errorCode ? this.safeDecode(`error_${params.errorCode}`) : AnalyticsStatus.success,
			p5: `callId_${params.callId}`,
		});
	}

	onRecordResumed(params: RecordWithErrorParams)
	{
		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.recordResumed,
			type: params.callType,
			c_section: AnalyticsSection.callWindow,
			// @ts-expect-error [call-ts] AnalyticsOptions.status is too narrow; wait ui.analytics to ts
			status: params.errorCode ? this.safeDecode(`error_${params.errorCode}`) : AnalyticsStatus.success,
			p5: `callId_${params.callId}`,
		});
	}

	onRecordDelete(params: RecordWithErrorParams)
	{
		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.recordDelete,
			type: params.callType,
			// @ts-expect-error [call-ts] AnalyticsOptions.status is too narrow; wait ui.analytics to ts
			status: params.errorCode ? this.safeDecode(`error_${params.errorCode}`) : AnalyticsStatus.success,
			p5: `callId_${params.callId}`,
		});
	}

	onRecordStop(params: RecordStopParams)
	{
		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.recordStop,
			type: params.callType,
			c_section: AnalyticsSection.callWindow,
			c_sub_section: params.subSection,
			c_element: params.element,
			p1: `recordLength_${params?.recordTime}`,
			p5: `callId_${params.callId}`,
		});
	}

	onCloudRecordPopupShow(params: BaseCallParams & { popupType: string })
	{
		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.callRecord,
			event: AnalyticsEvent.viewPopup,
			type: params.popupType,
			p5: `callId_${params.callId}`,
		});
	}

	onToggleCamera(params: ToggleCameraParams)
	{
		sendData({
			tool: AnalyticsTool.im,
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
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.call,
			event: params.muted ? AnalyticsEvent.micOff : AnalyticsEvent.micOn,
			type: params.callType,
			c_section: AnalyticsSection.callWindow,
			p5: `callId_${params.callId}`,
		});
	}

	onClickUser(params: ClickUserParams)
	{
		sendData({
			tool: AnalyticsTool.im,
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
			tool: AnalyticsTool.im,
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
			tool: AnalyticsTool.im,
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
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.callDocs,
			event: AnalyticsEvent.click,
			p4: `callType_${params.callType}`,
			p5: `callId_${params.callId}`,
		});
	}

	onDocumentCreate(params: DocumentWithTypeParams)
	{
		sendData({
			tool: AnalyticsTool.im,
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
			tool: AnalyticsTool.im,
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
			tool: AnalyticsTool.im,
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
			tool: AnalyticsTool.im,
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
			tool: AnalyticsTool.im,
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
			tool: AnalyticsTool.im,
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
			tool: AnalyticsTool.im,
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
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.messenger,
			event: AnalyticsEvent.clickCallButton,
			type: AnalyticsType.groupCall,
			c_section: AnalyticsSection.chatWindow,
			c_sub_section: AnalyticsSubSection.window,
			c_element: AnalyticsElement.initialBanner,
			p5: `chatId_${params.chatId}`,
		});
	}

	onChatStartConferenceClick(params: ConferenceClickParams)
	{
		sendData({
			tool: AnalyticsTool.im,
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
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.clickJoin,
			type: AnalyticsType.videoconf,
			c_section: AnalyticsSection.chatList,
			p5: `callId_${params.callId}`,
		});
	}

	onStartCallMessageClick(params: ChatCallClickParams): void
	{
		this.#onCallMessageClick(params, AnalyticsElement.startMessage);
	}

	onFinishCallMessageClick(params: ChatCallClickParams): void
	{
		this.#onCallMessageClick(params, AnalyticsElement.finishMessage);
	}

	onOpenCallSettings(params: BaseCallTypeParams)
	{
		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.openSettings,
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
				tool: AnalyticsTool.im,
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
				tool: AnalyticsTool.im,
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
				tool: AnalyticsTool.im,
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
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.approveRequest,
			type: params.callType,
			p5: `callId_${params.callId}`,
		});
	}

	onDisallowPermissionToSpeakResponse(params: BaseCallTypeParams)
	{
		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.denyRequest,
			type: params.callType,
			p5: `callId_${params.callId}`,
		});
	}

	#onCallMessageClick(params: ChatCallClickParams, element: string): void
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
