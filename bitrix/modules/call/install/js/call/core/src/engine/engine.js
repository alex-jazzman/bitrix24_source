import {Type} from 'main.core'
import {DesktopApi} from 'im.v2.lib.desktop-api';
import {ServerPlainCall} from './server_plain_call'
import {BitrixCall} from './bitrix_call'
import {CallStub} from './stub'
import {Hardware} from '../hardware';
import Util from '../util'
import {AbstractCall} from './abstract_call';
import { CallTokenManager } from 'call.lib.call-token-manager';
import {CallAI} from '../call_ai';
import { CallSettingsManager } from 'call.lib.settings-manager';

export const CallState = {
	Idle: 'Idle',
	Proceeding: 'Proceeding',
	Connected: 'Connected',
	Finished: 'Finished'
};

export const UserState = {
	Idle: 'Idle',
	Busy: 'Busy',
	Calling: 'Calling',
	Unavailable: 'Unavailable',
	Declined: 'Declined',
	Ready: 'Ready',
	Connecting: 'Connecting',
	Connected: 'Connected',
	Failed: 'Failed'
};

export const EndpointDirection = {
	SendOnly: 'send',
	RecvOnly: 'recv',
	SendRecv: 'sendrecv',
};

export const CallType = {
	Instant: 1,
	Permanent: 2
};

export const RoomType = {
	Small: 1,
	Conference: 2,
	Large: 3,
	Personal: 4,
};

export const Provider = {
	Plain: 'Plain',
	Bitrix: 'Bitrix',
};

export const StreamTag = {
	Main: 'main',
	Screen: 'screen'
};

export const Direction = {
	Incoming: 'Incoming',
	Outgoing: 'Outgoing'
};

export const Quality = {
	VeryHigh: "very_high",
	High: "high",
	Medium: "medium",
	Low: "low",
	VeryLow: "very_low"
};

export const DisconnectReason = {
	SecurityKeyChanged: 'SECURITY_KEY_CHANGED',
	RoomClosed: 'ROOM_CLOSED',
};

export const UserMnemonic = {
	all: 'all',
	none: 'none'
};

type CreateCallOptions = {
	type: number,
	provider: string,
	entityType: string,
	entityId: string,
	joinExisting: boolean,
	userIds?: number[],
	videoEnabled?: boolean,
	enableMicAutoParameters?: boolean,
	debug?: boolean
}

export const CallEvent = {
	onUserInvited: 'onUserInvited',
	onUserJoined: 'onUserJoined',
	onUserStateChanged: 'onUserStateChanged',
	onUserMicrophoneState: 'onUserMicrophoneState',
	onUserCameraState: 'onUserCameraState',
	onCameraPublishing: 'onCameraPublishing',
	onMicrophonePublishing: 'onMicrophonePublishing',
	onNeedResetMediaDevicesState: 'onNeedResetMediaDevicesState',
	onUserVideoPaused: 'onUserVideoPaused',
	onUserScreenState: 'onUserScreenState',
	onUserRecordState: 'onUserRecordState',
	onUserVoiceStarted: 'onUserVoiceStarted',
	onUserVoiceStopped: 'onUserVoiceStopped',
	onUserFloorRequest: 'onUserFloorRequest', // request for a permission to speak
	onAllParticipantsAudioMuted: 'onAllParticipantsAudioMuted',
	onAllParticipantsVideoMuted: 'onAllParticipantsVideoMuted',
	onAllParticipantsScreenshareMuted: 'onAllParticipantsScreenshareMuted',
	onYouMuteAllParticipants: 'onYouMuteAllParticipants',
	onRoomSettingsChanged: 'onRoomSettingsChanged',
	onUserPermissionsChanged: 'onUserPermissionsChanged',
	onUserRoleChanged: 'onUserRoleChanged',
	onParticipantMuted: 'onParticipantMuted',
	onUserEmotion: 'onUserEmotion',
	onTrackSubscriptionFailed: 'onTrackSubscriptionFailed',
	onUserStatsReceived: 'onUserStatsReceived',
	onCustomMessage: 'onCustomMessage',
	onLocalMediaReceived: 'onLocalMediaReceived',
	onLocalMediaStopped: 'onLocalMediaStopped',
	onLocalScreenUpdated: 'onLocalScreenUpdated',
	onMicrophoneLevel: 'onMicrophoneLevel',
	onDeviceListUpdated: 'onDeviceListUpdated',
	onRTCStatsReceived: 'onRTCStatsReceived',
	onCallFailure: 'onCallFailure',
	onRemoteMediaReceived: 'onRemoteMediaReceived',
	onRemoteMediaStopped: 'onRemoteMediaStopped',
	onBadNetworkIndicator: 'onBadNetworkIndicator',
	onConnectionQualityChanged: 'onConnectionQualityChanged',
	onNetworkProblem: 'onNetworkProblem',
	onReconnecting: 'onReconnecting',
	onReconnected: 'onReconnected',
	onReconnectingFailed: 'onReconnectingFailed',
	onJoin: 'onJoin',
	onLeave: 'onLeave',
	onJoinRoomOffer: 'onJoinRoomOffer',
	onJoinRoom: 'onJoinRoom',
	onLeaveRoom: 'onLeaveRoom',
	onListRooms: 'onListRooms',
	onUpdateRoom: 'onUpdateRoom',
	onTransferRoomSpeakerRequest: 'onTransferRoomSpeakerRequest',
	onTransferRoomSpeaker: 'onTransferRoomSpeaker',
	onDestroy: 'onDestroy',
	onGetUserMediaEnded: 'onGetUserMediaEnded',
	onUpdateLastUsedCameraId: 'onUpdateLastUsedCameraId',
	onToggleRemoteParticipantVideo: 'onToggleRemoteParticipantVideo',
	onSwitchTrackRecordStatus: 'onSwitchTrackRecordStatus',
	onRecorderStatusChanged: 'onRecorderStatusChanged',
};

const ajaxActions = {
	createCall: 'im.call.create',
	createChatForChildCall: 'call.Call.createChatForChildCall',
	getPublicChannels: 'pull.channel.public.list',
	getCall: 'im.call.get'
};

export const CallScheme = {
	classic: 1,
	jwt: 2,
};

class Engine
{
	handlers = {
		'Call::incoming': this.#onPullIncomingCall.bind(this),
	};

	jwtPullHandlers = {
		'callTokenUpdate': this.#onCallTokenUpdate.bind(this),
		'Call::clearCallTokens': this.#onCallTokenClear.bind(this),
		'Call::callV2AvailabilityChanged': this.#onCallV2AvailabilityChanged.bind(this),
	};

	constructor()
	{
		this.debugFlag = false;
		this.calls = {};
		this.userId = Number(BX.message('USER_ID'));
		this.siteId = '';

		this.unknownCalls = {};

		this.restClient = null;
		this.pullClient = null;

		this.finishedCalls = new Set();

		this.init();
	};

	init()
	{
		BX.addCustomEvent("onPullEvent-call", this.#onPullEvent.bind(this));
		BX.addCustomEvent("onPullEvent-im", this.#onPullEvent.bind(this));
	};

	getSiteId()
	{
		return this.siteId || BX.message('SITE_ID') || '';
	};

	setSiteId(siteId)
	{
		this.siteId = siteId;
	};

	getCurrentUserId()
	{
		return this.userId;
	};

	setCurrentUserId(userId)
	{
		this.userId = Number(userId);
	};

	setRestClient(restClient)
	{
		this.restClient = restClient;
	};

	setPullClient(pullClient)
	{
		this.pullClient = pullClient;
	};

	getRestClient()
	{
		return this.restClient || BX.rest;
	};

	getPullClient()
	{
		return this.pullClient || BX.PULL;
	};

	getLogService()
	{
		return BX.message("call_log_service");
	};

	onCallCreated(call)
	{
		BX.onCustomEvent(window, "CallEvents::callCreated", [{
			call: call
		}]);
	}

	createCall(config: CreateCallOptions): Promise<AbstractCall>
	{
		return new Promise(async (resolve, reject) =>
		{
			const callType = config.type || CallType.Instant;
			const callProvider = config.provider || this.getDefaultProvider();

			if (config.joinExisting)
			{
				for (let callId in this.calls)
				{
					if (this.calls.hasOwnProperty(callId))
					{
						const call: AbstractCall = this.calls[callId];
						if (
							call.provider === config.provider
							&& call.associatedEntity.type === config.chatInfo.entityType
							&& call.associatedEntity.id === config.chatInfo.entityId
						)
						{
							this.log(callId, "Found existing call, attaching to it");
							this.onCallCreated(call);

							Hardware.isCameraOn = config.videoEnabled === true;

							return resolve({
								call: call,
								isNew: false
							});
						}
					}
				}
			}

			let data;
			const instanceId = Util.getUuidv4();
			try
			{
				data = await Util.getCallConnectionData({
					callToken: config.token,
					callType: callType,
					provider: callProvider,
					instanceId: instanceId,
					isVideo: config.videoEnabled,
				}, config.chatInfo.chatId);
			}
			catch(error)
			{
				return reject({name: 'MEDIA_SERVER_UNREACHABLE', message: `Reason: ${error.reason} ${error.data}`});
			}

			if (!data?.result?.mediaServerUrl || !data?.result?.roomData)
			{
				return reject({name: 'MEDIA_SERVER_MISSING_PARAMS', message: `Incorrect signaling response`});
			}

			const aiSettings = Util.getAiSettings();
			if (aiSettings.serviceEnabled)
			{
				CallAI.setup(aiSettings);
			}

			if (this.calls[data.result.roomId])
			{
				if (this.calls[data.result.roomId] instanceof CallStub)
				{
					this.calls[data.result.roomId].destroy();
				}
				else
				{
					console.warn(`Call ${data.result.roomId} already exists, returning it instead of creating a new one`);

					return resolve({
						call: this.calls[data.result.roomId],
						isNew: false,
					});
				}
			}

			Hardware.isCameraOn = config.videoEnabled === true;
			const callFactory = this.#getCallFactory(callProvider);
			const call = callFactory.createCall({
				uuid: data.result.roomId,
				instanceId: instanceId,
				direction: Direction.Outgoing,
				enableMicAutoParameters: (config.enableMicAutoParameters !== false),
				associatedEntity: config.chatInfo,
				type: callType,
				startDate: data.result.startDate,
				events: {
					onDestroy: this.#onCallDestroy.bind(this)
				},
				debug: config.debug === true,
				connectionData: {
					mediaServerUrl: data.result.mediaServerUrl,
					roomData: data.result.roomData,
				},
				scheme: data.result.scheme,
			});

			this.calls[call.uuid] = call;

			this.onCallCreated(call);

			resolve({
				call: call,
				isNew: data.result.isNew
			});
		});
	}

	createChildCall(parentCall, newProvider, newUsers, config)
	{
		return new Promise((resolve, reject) =>
		{
			const callParameters = {
				callUuid: parentCall.uuid,
				newProvider: newProvider,
				users: newUsers
			};

			this.getRestClient().callMethod(ajaxActions.createChatForChildCall, callParameters)
				.then((response) =>
				{
					const createCallResponse = response.data();
					const token = createCallResponse.token;
					const chatId = createCallResponse.chatId;
					const callType = CallType.Instant;
					const callFactory = this.#getCallFactory(newProvider);
					const instanceId = Util.getUuidv4();

					Util.getCallConnectionData({
						callToken: token,
						callType: callType,
						provider: newProvider,
						instanceId: instanceId,
						isVideo: config.videoEnabled,
						parentUuid: parentCall.uuid,
					}, chatId)
						.then((data) =>
						{
							if (!data?.result?.mediaServerUrl || !data?.result?.roomData)
							{
								return reject({name: 'MEDIA_SERVER_MISSING_PARAMS', message: `Incorrect signaling response`});
							}

							const call = callFactory.createCall({
								uuid: data.result.roomId,
								instanceId: instanceId,
								initiatorId: this.userId,
								parentUuid: parentCall.uuid,
								direction: Direction.Outgoing,
								enableMicAutoParameters: parentCall.enableMicAutoParameters !== false,
								type: callType,
								startDate: data.result.startDate,
								events: {
									onDestroy: this.#onCallDestroy.bind(this)
								},
								logToken: createCallResponse.logToken,
								connectionData: {
									mediaServerUrl: data.result.mediaServerUrl,
									roomData: data.result.roomData,
								},
								debug: config.debug,
								scheme: data.result.scheme,
							});

							this.calls[call.uuid] = call;

							resolve({
								call,
								isNew: data.result.startDate,
							});
						})
						.catch((e) =>
						{
							return reject({name: 'MEDIA_SERVER_UNREACHABLE', message: `Reason: ${e.reason} ${e.data}`});
						});
				})
				.catch((e) =>
				{
					return reject({name: 'MEDIA_SERVER_UNREACHABLE', message: `Reason: ${e.reason} ${e.data}`});
				});
		});
	};

	instantiateCall(callFields, callToken, logToken, userData): AbstractCall
	{
		const callUuid = callFields.UUID;

		if (this.calls[callUuid])
		{
			console.warn(`Call ${callUuid} already exists, returning it instead of creating a new one`);

			return this.calls[callUuid];
		}

		const associatedEntity = callFields['ASSOCIATED_ENTITY'];
		if (callToken)
		{
			CallTokenManager.setToken(associatedEntity.chatId, callToken);
		}

		const callFactory = this.#getCallFactory(callFields['PROVIDER']);
		const call = callFactory.createCall({
			uuid: callUuid,
			instanceId: Util.getUuidv4(),
			initiatorId: parseInt(callFields['INITIATOR_ID']),
			parentUuid: callFields['PARENT_UUID'],
			direction: callFields['INITIATOR_ID'] == this.userId ? Direction.Outgoing : Direction.Incoming,
			associatedEntity: {
				userCounter: Object.keys(userData).length,
				...associatedEntity
			},
			type: callFields['TYPE'],
			startDate: callFields['START_DATE'],
			logToken: logToken,
			scheme: callFields['SCHEME'],

			events: {
				onDestroy: this.#onCallDestroy.bind(this)
			}
		});

		this.calls[call.uuid] = call;

		this.onCallCreated(call);

		return call;
	};

	getCallWithId(uuid, config): Promise<{ call: AbstractCall, isNew: boolean }>
	{
		if (this.calls[uuid])
		{
			return Promise.resolve({
				call: this.calls[uuid],
				isNew: false
			});
		}

		return this.createCall(config);
	};

	getCallWithDialogId(dialogId: string): ?Object
	{
		return Object.values(this.calls).find((call) => call.associatedEntity?.id == dialogId);
	}

	#onPullEvent(command: string, params, extra)
	{
		if (this.jwtPullHandlers[command])
		{
			this.jwtPullHandlers[command].call(this, params, extra);

			return;
		}

		const callScheme = params?.call?.SCHEME || params?.call?.scheme;

		if (callScheme !== CallScheme.jwt)
		{
			return;
		}

		if (this.handlers[command])
		{
			this.handlers[command].call(this, params, extra);
		}
		else if (command.startsWith('Call::') && params.call)
		{
			const callUuid = params.call?.UUID || params.call?.uuid;
			if (!callUuid)
			{
				return;
			}

			let call = this.calls[callUuid];

			if (!call && command === 'Call::finish')
			{
				this.log(callUuid, 'Got "Call::finish" before "Call::incoming"');
				this.finishedCalls.add(callUuid);

				return;
			}

			if (!this.finishedCalls.has(callUuid) && command === 'Call::usersInvited')
			{
				call = this.instantiateCall(params.call, params.callToken, params.logToken, params.userData);
			}

			if (call)
			{
				call.__onPullEvent(command, params, extra);
			}
		}
	};

	#onPullIncomingCall(params, extra)
	{
		console.log('#onPullIncomingCall', location.href);
		if (extra.server_time_ago > 30)
		{
			console.error("Call was started too long time ago");
			return;
		}

		const callFields = params.call;
		const callUuid = callFields.uuid;
		let call;

		CallAI.setup(params.aiSettings);

		if (this.finishedCalls.has(callUuid))
		{
			this.log(callUuid, 'Got "Call::incoming" after "Call::finish"');
			return;
		}

		CallTokenManager.setToken(callFields.associatedEntity.chatId, params.callToken);

		if (this.calls[callUuid])
		{
			call = this.calls[callUuid];

			if (!Object.keys(call.associatedEntity).length)
			{
				call.addDialogInfo(callFields.associatedEntity);

				this.onCallCreated(call);
			}
		}
		else
		{
			const callFactory = this.#getCallFactory(callFields.provider);
			const instanceId = Util.getUuidv4();
			call = callFactory.createCall({
				uuid: callUuid,
				instanceId: instanceId,
				parentUuid: callFields.parentUuid || null,
				callFromMobile: params.isLegacyMobile === true,
				direction: Direction.Incoming,
				initiatorId: callFields.initiatorId,
				associatedEntity: callFields.associatedEntity,
				type: callFields.type,
				startDate: callFields.startDate,
				logToken: callFields.logToken,
				events: {
					onDestroy: this.#onCallDestroy.bind(this)
				},
				scheme: callFields.scheme,
			});

			this.calls[callUuid] = call;

			this.onCallCreated(call);
		}

		if (call)
		{
			BX.onCustomEvent(window, "CallEvents::incomingCall", [{
				call: call,
				video: params.video === true,
				isLegacyMobile: params.isLegacyMobile === true
			}]);
		}
		this.log(call.uuid, "Incoming call " + call.uuid);
	};

	#onCallTokenUpdate(params, extra)
	{
		CallTokenManager.setToken(params.chatId, params.callToken);
	}

	#onCallTokenClear()
	{
		CallTokenManager.clearTokenList();
	}

	#onCallV2AvailabilityChanged(params, extra)
	{
		CallSettingsManager.jwtCallsEnabled = params.isJwtEnabled;
		CallSettingsManager.plainCallsUseJwt = params.isPlainUseJwt;

		if (params?.callBalancerUrl)
		{
			CallSettingsManager.callBalancerUrl = params.callBalancerUrl;
		}
	}

	#onCallDestroy(e)
	{
		const callId = e.call.uuid;
		this.calls[callId] = new CallStub({
			callId: callId,
			onDelete: () =>
			{
				if (this.calls[callId])
				{
					delete this.calls[callId];
				}
			}
		});

		BX.onCustomEvent(window, "CallEvents::callDestroyed", [{
			callId: e.call.uuid
		}]);
	};

	#isCallAppInitialized()
	{
		if ('BXIM' in window && 'init' in window.BXIM)
		{
			return BXIM.init;
		}
		else if (BX.Messenger && BX.Messenger.Application && BX.Messenger.Application.conference)
		{
			return BX.Messenger.Application.conference.inited;
		}

		//TODO: support new chat
		return true;
	};

	getDefaultProvider()
	{
		return Provider.Plain;
	};

	getConferencePageTag(chatDialogId)
	{
		return "conference-open-" + chatDialogId;
	};

	#getCallFactory(providerType: string)
	{
		if (providerType == Provider.Plain)
		{
			return PlainCallFactory;
		}
		else if (providerType == Provider.Bitrix)
		{
			return BitrixCallFactory;
		}

		throw new Error("Unknown call provider type " + providerType);
	};

	debug(debugFlag: boolean = true): boolean
	{
		this.debugFlag = !!debugFlag;

		return this.debugFlag;
	};

	log()
	{
		const text = Util.getLogMessage.call(Util, arguments);

		if (DesktopApi.isDesktop())
		{
			DesktopApi.writeToLogFile(BX.message('USER_ID') + '.video.log', text);
		}
		if (this.debugFlag)
		{
			if (console)
			{
				const a = ['Call log [' + Util.getTimeForLog() + ']: '];
				console.log.apply(this, a.concat(Array.prototype.slice.call(arguments)));
			}
		}
	};

	getAllowedVideoQuality(participantsCount)
	{
		if (participantsCount < 5)
		{
			return Quality.VeryHigh
		}
		else if (participantsCount < 10)
		{
			return Quality.High
		}
		else if (participantsCount < 16)
		{
			return Quality.Medium
		}
		else if (participantsCount < 32)
		{
			return Quality.Low
		}
		else
		{
			return Quality.VeryLow
		}
	};
}

class PlainCallFactory
{
	static createCall(config): ServerPlainCall
	{
		return new ServerPlainCall(config);
	}
}

class BitrixCallFactory
{
	static createCall(config): BitrixCall
	{
		return new BitrixCall(config);
	}
}


export const CallEngine = new Engine();
