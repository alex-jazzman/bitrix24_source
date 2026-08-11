import {Type} from 'main.core'
import {DesktopApi} from 'im.v2.lib.desktop-api';
import { JoinResponseError } from '../sdk/errors';
import { ClientPlatform } from '../sdk/const';
import {ServerPlainCall} from './server_plain_call'
import {BitrixCall} from './bitrix_call'
import {CallStub} from './stub'
import {Hardware} from '../call_hardware';
import Util from '../util'
import { stuckCallFinishTracker } from 'call.lib.stuck-call-finish-tracker';
import {AbstractCall} from './abstract_call';
import { setPrimary } from './engine-registry';
import { CallTokenManager } from 'call.lib.call-token-manager';
import {CallAI} from '../call_ai';
import { BroadcastRequestChannel } from 'call.infrastructure.broadcast-channel';
import { CallCloudRecord } from '../call_common_record';
import { CallSettingsManager } from 'call.lib.settings-manager';

import {
	CallState,
	UserState,
	EndpointDirection,
	CallType,
	RoomType,
	Provider,
	StreamTag,
	Direction,
	Quality,
	StartCallErrorCode,
	DisconnectReason,
	UserMnemonic,
	CallEvent,
	CallScheme,
} from './types';

export {
	CallState,
	UserState,
	EndpointDirection,
	CallType,
	RoomType,
	Provider,
	StreamTag,
	Direction,
	Quality,
	StartCallErrorCode,
	DisconnectReason,
	UserMnemonic,
	CallEvent,
	CallScheme,
} from './types';

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

const ajaxActions = {
	createCall: 'call.CallManager.create',
	createChatForChildCall: 'call.Call.createChatForChildCall',
	getPublicChannels: 'pull.channel.public.list',
	getCall: 'call.CallManager.get'
};

class Engine
{
	handlers = {
		'Call::incoming': this.#onPullIncomingCall.bind(this),
	};

	jwtPullHandlers = {
		chatUserAdd: this.#onCallTokenUpdate.bind(this),
		'Call::logTokenUpdate': this.#onLogTokenUpdate.bind(this),
		'Call::callTokenUpdate': this.#onCallTokenUpdate.bind(this),
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

		this.multiBroadcastClient = new BroadcastRequestChannel('call_engine_channel');

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
			let instanceId = Util.getUuidv4();

			if (config.joinExisting)
			{
				for (let callId in this.calls)
				{
					if (this.calls.hasOwnProperty(callId))
					{
						const call: AbstractCall = this.calls[callId];
						if (
							call.provider === config.provider
							&& call.associatedEntity.type === config.entityType
							&& call.associatedEntity.id === config.entityId
						)
						{
							this.log(callId, "Found existing call, attaching to it");
							this.onCallCreated(call);

							Hardware.isCameraOn = config.videoEnabled === true;

							if (call.hasConnectionData)
							{
								return resolve({
									call,
									isNew: false,
								});
							}
							else
							{
								instanceId = call.instanceId;
							}
						}
					}
				}
			}

			const chatId = config.chatInfo.chatId;
			const callProvider = config.provider || this.getDefaultProvider();
			const callType = config.type || CallType.Instant;
			const roomType = Util.getRoomType(callProvider, chatId);

			let data = null;

			try
			{
				data = await Util.getCallConnectionData({
					callType,
					roomType,
					instanceId,
					callToken: config.token,
					provider: callProvider,
					isVideo: config.videoEnabled,
					callUuid: config.roomId,
				}, chatId, !config.joinExisting);
			}
			catch(error)
			{
				if (Type.isObject(error) && (error instanceof JoinResponseError))
				{
					return reject(error);
				}
				if (Type.isObject(error) && (error?.reason || error?.data))
				{
					return reject({
						name: 'MEDIA_SERVER_UNREACHABLE',
						code: 'MEDIA_SERVER_UNREACHABLE',
						message: `Reason:${
							error?.reason ? ` ${error?.reason}` : ''
						}${
							error?.data ? ` ${error?.data}` : ''
						}`,
					});
				}

				return reject(error);
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

			const connectionData = this.#getFormattedConnectionData(data.result);

			if (this.calls[data.result.roomId])
			{
				if (this.calls[data.result.roomId] instanceof CallStub)
				{
					this.calls[data.result.roomId].destroy();
				}
				else
				{
					console.warn(`Call ${data.result.roomId} already exists, returning it instead of creating a new one`);

					this.calls[data.result.roomId].connectionData = connectionData;

					return resolve({
						call: this.calls[data.result.roomId],
						isNew: false,
					});
				}
			}

			Hardware.isCameraOn = config.videoEnabled === true;
			const callFactory = this.#getCallFactory(callProvider);
			// Seed initiatorId only when the media-balancer actually created a
			// brand-new room for this client (data.result.isNew === true).
			// On race-y joins that fall through to this branch (joinExisting
			// with no local registry entry) the room already exists on the
			// balancer, isNew is false, and we must NOT mark every joiner as
			// initiator — that would break role-aware auto-hangup. For the
			// genuine "start" case (isNew=true) the local user is by
			// construction the call session creator and matches the
			// server-side INITIATOR_ID.
			const isNewRoom = data.result?.isNew === true;
			const call = callFactory.createCall({
				instanceId,
				connectionData,
				uuid: data.result.roomId,
				initiatorId: isNewRoom ? this.userId : '',
				direction: Direction.Outgoing,
				enableMicAutoParameters: (config.enableMicAutoParameters !== false),
				associatedEntity: config.chatInfo,
				type: callType,
				roomType: data.result.roomType,
				startDate: new Date(data.result.startDate * 1000),
				events: {
					onDestroy: this.#onCallDestroy.bind(this),
				},
				debug: config.debug === true,
				scheme: data.result.scheme,
				invitePeriod: config.invitePeriod,
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
		return new Promise((resolve, reject) => {
			const callParameters = {
				newProvider,
				callUuid: parentCall.uuid,
				users: newUsers,
			};

			BX.ajax.runAction(ajaxActions.createChatForChildCall, { data: callParameters })
				.then((response) => {
					const createCallResponse = response.data;
					const token = createCallResponse.token;
					const chatId = createCallResponse.chatId;
					const callFactory = this.#getCallFactory(newProvider);
					const instanceId = Util.getUuidv4();
					const callType = CallType.Instant;
					const roomType = Util.getRoomType(newProvider, chatId);

					CallTokenManager.setToken(chatId, token);

					Util.getCallConnectionData({
						instanceId,
						callType,
						roomType,
						callToken: token,
						provider: newProvider,
						isVideo: config.videoEnabled,
						parentUuid: parentCall.uuid,
					}, chatId)
						.then((data) => {
							if (!data?.result?.mediaServerUrl || !data?.result?.roomData)
							{
								return reject({name: 'MEDIA_SERVER_MISSING_PARAMS', message: `Incorrect signaling response`});
							}

							const call = callFactory.createCall({
								instanceId,
								uuid: data.result.roomId,
								initiatorId: this.userId,
								parentUuid: parentCall.uuid,
								direction: Direction.Outgoing,
								enableMicAutoParameters: parentCall.enableMicAutoParameters !== false,
								type: callType,
								roomType: data.result.roomType,
								startDate: data.result.startDate,
								events: {
									onDestroy: this.#onCallDestroy.bind(this),
								},
								connectionData: this.#getFormattedConnectionData(data.result),
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
		const uuid = callFields.UUID;

		if (this.calls[uuid])
		{
			console.warn(`Call ${uuid} already exists, returning it instead of creating a new one`);

			return this.calls[uuid];
		}

		const associatedEntity = callFields.ASSOCIATED_ENTITY;
		if (callToken)
		{
			CallTokenManager.setToken(associatedEntity.chatId, callToken);
		}

		// Bulk-seed Util.userData with the call participants' profile + role
		// returned by call.Call.tryJoinCall. Without this the role-aware
		// fallback in BitrixCall.#isPrivilegedUser (Util.getUserRoleByUserId)
		// stays empty for every JWT joiner — onUserJoined / onUserInvited
		// payloads from the media-server carry no role, and we deliberately
		// avoid per-user dozenfetches in big chats. One bulk write at join
		// time is enough; pull events keep it fresh through the JWT
		// __onPullEvent handler.
		if (Type.isPlainObject(userData))
		{
			Util.setUserData(userData);
		}

		const callFactory = this.#getCallFactory(callFields.PROVIDER);
		const call = callFactory.createCall({
			uuid,
			logToken,
			instanceId: Util.getUuidv4(),
			initiatorId: parseInt(callFields.INITIATOR_ID, 10),
			parentUuid: callFields.PARENT_UUID,
			direction: callFields.INITIATOR_ID == this.userId ? Direction.Outgoing : Direction.Incoming,
			associatedEntity: {
				userCounter: Object.keys(userData).length,
				...associatedEntity,
			},
			type: callFields.TYPE,
			startDate: callFields.START_DATE,
			scheme: callFields.SCHEME,

			events: {
				onDestroy: this.#onCallDestroy.bind(this),
			},
		});

		this.calls[call.uuid] = call;

		this.onCallCreated(call);

		return call;
	}

	getCallWithId(uuid, config): Promise<{ call: AbstractCall, isNew: boolean }>
	{
		return new Promise((resolve, reject) => {
			const call = this.calls[uuid];

			if (call?.hasConnectionData)
			{
				resolve({ call, isNew: false });
			}
			else if (config)
			{
				this.createCall(config)
					.then((result) => {
						resolve(result);
					})
					.catch((error) => {
						reject(error);
					});
			}
			else
			{
				const error = {
					name: 'CALL_NOT_FOUND',
					message: 'Call not found',
				};

				reject(error);
			}
		});
	}

	getCallWithDialogId(dialogId: string): ?Object
	{
		return Object.values(this.calls).find((call) => call.associatedEntity?.id == dialogId);
	}

	#onPullEvent(command: string, params, extra)
	{
		// Cancel any pending stuck-call recovery finish for this callUuid before
		// dispatching: if the backend already finished the call, the engine layer
		// will clean up the UI from this pull event, so a client-side
		// CallManager.finish REST call is redundant.
		if (command === 'Call::finish')
		{
			const finishedCallUuid = params?.call?.UUID || params?.call?.uuid;
			if (finishedCallUuid)
			{
				// getCallConnectionData() in util.js schedules recovery as
				// (null, callUuid) — it does not know the callId at that point.
				// Cancel both (null, uuid) and (callId, uuid) so the debounced
				// REST call never fires regardless of which key was used to
				// schedule it.
				const finishedCallId = params?.callId || params?.call?.ID || params?.call?.id || null;
				stuckCallFinishTracker.cancelPending(null, finishedCallUuid);
				if (finishedCallId)
				{
					stuckCallFinishTracker.cancelPending(finishedCallId, finishedCallUuid);
				}
			}
		}

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

		if (params.userData && Type.isPlainObject(params.userData))
		{
			Util.setUserData(params.userData);
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

			if (call && !this.#callHasAssociatedEntity(call) && command === 'Call::usersInvited' && !this.finishedCalls.has(callUuid))
			{
				call.addDialogInfo(params.call.ASSOCIATED_ENTITY);
				this.onCallCreated(call);
			}
			else if (!call && command === 'Call::usersInvited' && !this.finishedCalls.has(callUuid))
			{
				call = this.instantiateCall(params.call, params.callToken, params.logToken, params.userData);
			}

			if (call)
			{
				call.__onPullEvent(command, params, extra);
			}
		}
	}

	async #onPullIncomingCall(params, extra)
	{
		if (extra.server_time_ago > 30)
		{
			console.error('Call was started too long time ago');

			return;
		}

		const logToken = params.logToken;
		const callFields = params.call;
		const uuid = callFields.uuid;
		let call = null;

		CallAI.setup(params.aiSettings);

		if (this.finishedCalls.has(uuid))
		{
			this.log(uuid, 'Got "Call::incoming" after "Call::finish"');

			return;
		}

		CallTokenManager.setToken(callFields.associatedEntity.chatId, params.callToken);

		if (this.calls[uuid] instanceof CallStub)
		{
			return;
		}

		if (this.calls[uuid])
		{
			call = this.calls[uuid];

			if (!this.#callHasAssociatedEntity(call))
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
				uuid,
				instanceId,
				logToken,
				parentId: callFields.parentId || null,
				parentUuid: callFields.parentUuid || null,
				callFromMobile: params.isLegacyMobile === true,
				direction: Direction.Incoming,
				initiatorId: callFields.initiatorId,
				associatedEntity: callFields.associatedEntity,
				type: callFields.type,
				startDate: callFields.startDate,
				events: {
					onDestroy: this.#onCallDestroy.bind(this),
				},
				scheme: callFields.scheme,
			});

			this.calls[uuid] = call;

			this.onCallCreated(call);
		}

		const broadcastResponse = await this.multiBroadcastClient.broadcastRequest(uuid, { timeout: 100 });
		const hasActiveCalls = broadcastResponse.some((res) => res);
		const canProcessEvent = !params.isAlreadyInCall
			|| (params.activeCallPlatform !== 'any' && ClientPlatform === params.activeCallPlatform);
		if (call && !hasActiveCalls && canProcessEvent)
		{
			BX.onCustomEvent(window, 'CallEvents::incomingCall', [{
				call,
				video: params.video === true,
				isLegacyMobile: params.isLegacyMobile === true,
				isRepeated: params.isRepeated === true,
			}]);
		}
		this.log(call.uuid, `Incoming call ${call.uuid}`);
	}

	#onLogTokenUpdate(params): void
	{
		const call = this.calls[params.uuid];
		call?.addLogToken(params.logToken);
	}

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

	#callHasAssociatedEntity(call: AbstractCall): boolean
	{
		return Type.isObject(call?.associatedEntity) && Object.keys(call.associatedEntity).length > 0;
	}

	#getFormattedConnectionData(data: any): any
	{
		return {
			mediaServerUrl: data.mediaServerUrl,
			roomData: data.roomData,
			roomType: data.roomType,
			monitoringServerUrl: data.monitoring?.metricsServerUrl,
			monitoringLogsServerUrl: data.monitoring?.logsServerUrl,
			monitoringJwtToken: data.monitoring?.token,
			monitoringEnvironment: data.monitoring?.env,
			monitoringRegion: data.monitoring?.region,
		};
	}

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

		if ((CallEngine.debugFlag || Util.isConsoleLogsEnabled()) && console)
		{
			const a = ['Call log [' + Util.getTimeForLog() + ']: '];
			console.warn.apply(this, a.concat(Array.prototype.slice.call(arguments)));
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
Util.registerEngine(CallEngine, true);
setPrimary(CallEngine);
