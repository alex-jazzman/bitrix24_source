// @flow
import { CallSettingsManager } from 'call.lib.settings-manager';
import { STREAM_QUALITY, LOCAL_STREAM_QUALITY_HEIGHT } from './stream_quality';
import { Event, Type } from 'main.core';

import Util from './util';
import { RoomType } from './engine/types';
import { Hardware } from './call_hardware';
import { MediaServer } from './media-server';
import { CallStreamManager } from './media-stream-manager';

import { type LayersAvailability, type SubscribedQuality } from 'call.const';

import {
	ClientPlatform,
	ClientVersion,
	MediaStreamsKinds,
	CALL_STATE,
	VIDEO_QUEUE,
	MONITORING_METRICS,
	MONITORING_METRICS_PROMETHEUS,
	RecorderStatus,
	CloudRecordStatus,
	CloudRecordKind,
	JoinRequestFailedCodes,
	ConnectionType,
	CloseCode,
	CallApiEvent,
	LOG_LEVEL,
	MONITORING_EVENTS_NAME_LIST,
	ReconnectionReason,
} from './sdk/const';
import { createMessage } from './sdk/mappers';
import { JoinResponseError } from './sdk/errors';
import { Track } from './sdk/models';
import { calcBitrateSumFromArray, fillDefaultValueMonitoringMetrics, checkMetricsFeatureAndExecutionCallback, sendMonitoringData } from './sdk/helpers/monitoring';
import { buildMediaConstraints, isNoiseSuppressionInputTrackOff } from './sdk/helpers/media';

export {
	ClientPlatform,
	ClientVersion,
	MediaStreamsKinds,
	CALL_STATE,
	RecorderStatus,
	CloudRecordStatus,
	CloudRecordKind,
	JoinRequestFailedCodes,
	ConnectionType,
	LOG_LEVEL,
	MONITORING_EVENTS_NAME_LIST,
	JoinResponseError,
};

export class Call
{
	#privateProperties = {
		canReconnect: true,
		logs: {},
		isloggingEnable: true,
		loggerCallback: null,
		abortController: new AbortController(),
		mediaServers: new Map(),
		previousMediaServers: null,
		prevParticipantsWithLargeDataLoss: new Set(),
		tracksDataFromSocket: {},
		realTracksIds: {}, // todo: check why track ids are different in a stream and in the track itself
		mediaServerUrl: null,
		monitoringServerUrl: '',
		monitoringLogsServerUrl: '',
		monitoringJwtToken: '',
		monitoringEnvironment: '',
		monitoringRegion: '',
		roomData: null,
		roomType: RoomType.Small,
		roomId: null,
		isLegacy: false,
		autoSubscribe: false,
		endpoint: null,
		jwt: null,
		options: null,
		publishingMediaServerIdForSmallRoom: 0,
		publishingMediaServerId: null,
		socketConnection: null,
		pendingPublications: {},
		pendingSubscriptions: {},
		publicationTimeout: 10000,
		republicationTries: 3,
		republication: {
			[MediaStreamsKinds.Camera]: {
				tries: 0,
				isActive: false,
			},
			[MediaStreamsKinds.Microphone]: {
				tries: 0,
				isActive: false,
			},
			[MediaStreamsKinds.Screen]: {
				tries: 0,
				isActive: false,
			},
			[MediaStreamsKinds.ScreenAudio]: {
				tries: 0,
				isActive: false,
			},
		},
		subscriptionTimeout: 1500,
		subscriptionTries: 5,
		cameraStream: null,
		microphoneStream: null,
		screenStream: null,
		needToStopStreams: true,
		mediaMutedBySystem: false,
		needToEnableAudioAfterSystemMuted: false,
		needToDisableAudioAfterPublish: false,
		localTracks: {},
		localConnectionQuality: 0,
		minimalConnectionQuality: 2,
		rtt: {},
		pings: {},
		pingIntervalDuration: 0,
		pingTimeoutDuration: 0,
		awaitedPings: new Set(),
		ontrackData: {},
		remoteParticipants: {},
		participantsToUpdateTrackAvailability: {},
		tracksToProcess: [],
		mainStream: {},
		pingPongIntervals: {},
		userId: '',
		localParticipantSid: {},
		defaultVideoResolution: {
			width: 1280,
			height: 720
		},
		defaultSimulcastBitrate: {
			q: 120000,
			h: 300000,
			f: 1000000
		},
		useLayersAccurateControl: false,
		defaultRemoteStreamsQuality: STREAM_QUALITY.MEDIUM,
		audioBitrate: 70000,
		videoBitrate: 1500000,
		screenBitrate: 1000000,
		videoSimulcast: true,
		screenSimulcast: false,
		events: new Map(),
		audioDeviceId: '',
		switchActiveAudioDeviceInProgress: null,
		switchActiveAudioDevicePending: null,
		videoDeviceId: '',
		switchActiveVideoDeviceInProgress: null,
		switchActiveVideoDevicePending: null,
		isReconnecting: false,
		reconnectionAttempt: 0,
		reconnectionTimeout: null,
		lastReconnectionReason: null,
		fastReconnectionDelay: 1000,
		reconnectionDelay: 5000,
		callStatsInterval: null,
		callState: '',
		wasConnected: false,
		allMediaServersConnected: false,
		mediaServersConnected: {},
		packetLostThreshold: 7,
		statsTimeout: 3000,
		outgoingTracksReports: {},
		reportsForIncomingTracks: {},
		stats: {},
		videoQueue: VIDEO_QUEUE.INITIAL,
		videoStreamSetupErrorList: {},
	};

	constructor()
	{
		this.sendLeaveBound = this.#sendLeave.bind(this);
		this.beforeDisconnectBound = this.#beforeDisconnect.bind(this, {
			initiatedByUser: true,
			destroySocket: true,
		});

		this.setLogBound = this.setLog.bind(this);
		this.sendSignalBound = this.#sendSignal.bind(this);
		this.onAddTrackBound = this.#onAddTrack.bind(this);
		this.onTrackBound = this.#onTrack.bind(this);
		this.processStatsBound = this.#processStats.bind(this);
		this.onPeerConnectionIssueBound = this.#onPeerConnectionIssue.bind(this);
		this.onMediaServerDownBound = this.#onMediaServerDown.bind(this);
		this.onMediaServerUpBound = this.#onMediaServerUp.bind(this);

		this.monitoringEvents = [];
		this.monitoringDelayTime = 30000;
		this.monitoringIntervalTime = 5000;
		this.countMetricsInMetricsInterval = this.monitoringDelayTime / this.#privateProperties.statsTimeout;
		this.monitoringInterval = null;

		this.currentMonitoringEventsObject =
		{
			metrics: fillDefaultValueMonitoringMetrics(),
			events: [],
			logs: [],
			increasingEvents: [],
		};

		this.currentMonitoringRtcStatsObject = {};

		this.prevInboundRtpStatsSum = {
			freezeCount: 0,
			totalFreezesDuration: 0,
			jitter: 0,
			framesDecoded: 0,
			framesDropped: 0,
			framesReceived: 0,
		};

		Event.EventEmitter.subscribe('BX.Call.Logger:sendLog', (event) => {
			this.setLog(event.data);
		});

		this.initConnectionEvent();

		Hardware.maxLocalStreamQualityHeight = LOCAL_STREAM_QUALITY_HEIGHT.HIGH;
	}

	get iceServers(): Array<RTCIceServer> | null
	{
		const mediaServer = this.#getPublishingMediaServer();
		const iceServers = mediaServer?.iceServers ?? null;

		return Type.isArray(iceServers) ? iceServers : null;
	}

	get remoteParticipantsCount()
	{
		return Object.keys(this.#privateProperties.remoteParticipants).length;
	}

	get isMediaMutedBySystem()
	{
		return this.#privateProperties.mediaMutedBySystem;
	}

	set needToStopStreams(needToStopStreams)
	{
		this.#privateProperties.needToStopStreams = Boolean(needToStopStreams);
	}

	onChangeConnection(connection)
	{
		const rtt = connection.rtt;

		const isConnectionLost = rtt === null || rtt === undefined;

		if (isConnectionLost && !this.#privateProperties.isReconnecting)
		{
			this.#beforeDisconnect();
			this.#reconnect({
				reconnectionReason: 'ON_CHANGE_CONNECTION',
				reconnectionReasonInfo: `RTT: ${rtt}`,
			});
		}
	}

	initConnectionEvent()
	{
		const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

		if (!connection)
		{
			return;
		}

		connection.addEventListener('change', () =>
		{
			this.onChangeConnection(connection);
		});
	}

	clearMonitoringEvents()
	{
		this.monitoringEvents = [];
	}

	addValidatedMonitoringMetric({ additionalData, metricValue, metricKey })
	{
		if (!this.currentMonitoringRtcStatsObject[metricKey])
		{
			this.currentMonitoringRtcStatsObject[metricKey] = {
				metric:
					{	__name__: MONITORING_METRICS_PROMETHEUS[metricKey] || metricKey,
						user_id: String(this.#privateProperties.userId),
						session_id: String(this.#privateProperties.roomId),
						env: String(this.#privateProperties.monitoringEnvironment),
						region: String(this.#privateProperties.monitoringRegion),
						platform: ClientPlatform,
					},
				values: [],
				timestamps: [],
			};
		}

		this.currentMonitoringRtcStatsObject[metricKey].values.push(metricValue);
		this.currentMonitoringRtcStatsObject[metricKey].timestamps.push(Date.now());

		if (this.currentMonitoringEventsObject.metrics[metricKey])
		{
			this.currentMonitoringEventsObject.metrics[metricKey].push(metricValue);
		}
	}

	addMonitoringEvents({ name, value = 1, withCounter = false })
	{
		const currentEventIndex = this.currentMonitoringEventsObject.events.findIndex(evt => evt.name === name);

		if (withCounter)
		{
			const currentIncreasingEventIndex = this.currentMonitoringEventsObject.increasingEvents.findIndex(evt => evt.name === name);

			if (currentIncreasingEventIndex === -1)
			{
				this.currentMonitoringEventsObject.increasingEvents.push({name, value});
			}
			else
			{
				this.currentMonitoringEventsObject.increasingEvents[currentIncreasingEventIndex].value += 1;
				value = this.currentMonitoringEventsObject.increasingEvents[currentIncreasingEventIndex].value;
			}
		}

		this.addValidatedMonitoringMetric({
			metricKey: name,
			metricValue: value,
		});
	}

	setClearValuesForCurrentMonitoringEventsObject()
	{
		this.currentMonitoringEventsObject.events = [];
		this.currentMonitoringEventsObject.logs = [];
		this.currentMonitoringEventsObject.metrics = fillDefaultValueMonitoringMetrics();
	}

	getCountRemoteTracks()
	{
		let countVideoTracks = 0;
		let countAudioTracks = 0;

		Object.values(this.#privateProperties.remoteParticipants).forEach(participant =>
		{
			if (participant.getTrack(MediaStreamsKinds.Camera) && !participant.isMutedVideo && !participant.isLocalVideoMute)
			{
				countVideoTracks += 1;
			}

			if (participant.getTrack(MediaStreamsKinds.Microphone) && !participant.isMutedAudio)
			{
				countAudioTracks += 1;
			}

			if (participant.getTrack(MediaStreamsKinds.Screen))
			{
				countVideoTracks += 1;
			}

			if (participant.getTrack(MediaStreamsKinds.ScreenAudio))
			{
				countAudioTracks += 1;
			}
		});

		return {
			countVideoTracks,
			countAudioTracks,
		}
	}

	startAggregateMonitoringEvents()
	{
		this.setClearValuesForCurrentMonitoringEventsObject();

		if (Util.isMetricsEnabled())
		{
			this.monitoringInterval = setInterval(() => {
				const { countVideoTracks, countAudioTracks } = this.getCountRemoteTracks();

				this.currentMonitoringEventsObject.metrics[MONITORING_METRICS.COUNT_TRACKS] = {
					video: countVideoTracks,
					audio: countAudioTracks,
				};
			}, this.monitoringIntervalTime);
		}

		this.monitoringTimeout = setTimeout(() => {
			clearTimeout(this.monitoringTimeout);
			this.monitoringTimeout = null;

			if (this.#privateProperties.isReconnecting)
			{
				return;
			}

			this.sendMonitoringEvents();
		}, this.monitoringDelayTime);

	}

	sendLogMonitoringRtcStats()
	{
		if (Util.isMetricsEnabled())
		{
			const isRtcStatsNotEmpty = !!Object.keys(this.currentMonitoringRtcStatsObject);

			let metricsResultString = '';

			if (isRtcStatsNotEmpty)
			{
				for (let key in this.currentMonitoringRtcStatsObject)
				{
					if (this.currentMonitoringRtcStatsObject.hasOwnProperty(key))
					{
						metricsResultString += JSON.stringify(this.currentMonitoringRtcStatsObject[key]) + '\r\n';
					}
				}
			}

			for (let key in this.currentMonitoringEventsObject.events)
			{
				if (this.currentMonitoringEventsObject.events.hasOwnProperty(key))
				{
					metricsResultString += JSON.stringify(this.currentMonitoringEventsObject.events[key]) + '\r\n';
				}
			}

			if (metricsResultString)
			{
				sendMonitoringData(
					metricsResultString,
					this.#privateProperties.monitoringServerUrl,
					this.#privateProperties.monitoringJwtToken,
				);
			}
		}

		if (Util.isMetricsLogsEnabled() && this.currentMonitoringEventsObject.logs.length)
		{
			const otplLogsStructure =
			{
				resourceLogs:
				[
					{
						resource: {
							attributes:
							{
								'service.name': 'call-logs',
								'service.version': 'v0.0.1',
								platform: ClientPlatform,
							},
						},
						scopeLogs:
						[{
							scope:
							{
								name: 'call-logs',
								version: 'v0.0.1',
							},
							logRecords: this.currentMonitoringEventsObject.logs,
						}],
					},
				],
			};

			const resultLogsStr = JSON.stringify(otplLogsStructure);

			sendMonitoringData(
				resultLogsStr,
				this.#privateProperties.monitoringLogsServerUrl,
				this.#privateProperties.monitoringJwtToken,
			);
		}

		this.currentMonitoringRtcStatsObject = {};
	}

	sendMonitoringHandler(data, url, token)
	{
		if (!url)
		{
			return;
		}

		const xhr = new XMLHttpRequest();
		xhr.open('POST', url, true);
		xhr.setRequestHeader('Content-Type', 'application/json');

		if (token)
		{
			xhr.setRequestHeader('Authorization', 'Bearer ' + token);
		}

		xhr.send(data);
	}

	sendMonitoringEvents(withRestart = true)
	{
		this.sendLogMonitoringRtcStats();

		clearInterval(this.monitoringInterval);
		this.monitoringInterval = null;
		clearTimeout(this.monitoringTimeout);
		this.monitoringTimeout = null;

		if (withRestart)
		{
			this.startAggregateMonitoringEvents();
		}
	}

	onPublishFailed(kind)
	{
		this.#updateRepublicationState(kind);
		this.#triggerEvents('PublishFailed', [kind]);
		let eventName;
		if (kind === MediaStreamsKinds.Camera)
		{
			eventName = MONITORING_EVENTS_NAME_LIST.LOCAL_VIDEO_STREAM_PUBLICATION_FAILED;
		}
		else if (kind === MediaStreamsKinds.Microphone)
		{
			eventName = MONITORING_EVENTS_NAME_LIST.LOCAL_MICROPHONE_STREAM_PUBLICATION_FAILED;
		}
		else if (kind === MediaStreamsKinds.Screen)
		{
			eventName = MONITORING_EVENTS_NAME_LIST.LOCAL_SCREEN_STREAM_PUBLICATION_FAILED;
		}
		checkMetricsFeatureAndExecutionCallback(() => {
			this.addMonitoringEvents({
				name: eventName,
				withCounter: true,
			});
		});
	}

	async connect(options)
	{
		this.setLog(`Connecting to the call (desktop: ${Util.isDesktop()})`, LOG_LEVEL.INFO);
		this.#privateProperties.callState = CALL_STATE.PROGRESSING;

		if (Util.isMetricsEnabled() || Util.isMetricsLogsEnabled())
		{
			this.startAggregateMonitoringEvents();
		}

		for (let key in options) {
			this.#privateProperties[`${key}`] = options[key];
		}

		if (this.#privateProperties.isLegacy)
		{
			if (!this.#privateProperties.endpoint)
			{
				this.setLog(`Missing required param 'endpoint' from backend, disconnecting`, LOG_LEVEL.ERROR);
				this.#triggerEvents('Failed', [{name: 'AUTHORIZE_ERROR', message: `Missing required param 'endpoint'`}]);
				return;
			}
			if (!this.#privateProperties.jwt)
			{
				this.setLog(`Missing required param 'jwt' from backend, disconnecting`, LOG_LEVEL.ERROR);
				this.#triggerEvents('Failed', [{name: 'AUTHORIZE_ERROR', message: `Missing required param 'jwt'`}]);
				return;
			}

			this.#privateProperties.endpoint = this.#privateProperties.endpoint.replace(/\/+$/, '');
		}

		const canConnect = this.#privateProperties.mediaServerUrl && this.#privateProperties.roomData;

		if (!canConnect)
		{
			try
			{
				const mediaServerInfo = await this.getMediaServerInfo();

				this.#privateProperties.mediaServerUrl = mediaServerInfo.mediaServerUrl;
				this.#privateProperties.roomData = mediaServerInfo.roomData;
				this.#privateProperties.roomType = mediaServerInfo.roomType;
				this.#privateProperties.monitoringServerUrl = mediaServerInfo.monitoringServerUrl;
				this.#privateProperties.monitoringLogsServerUrl = mediaServerInfo.monitoringLogsServerUrl;
				this.#privateProperties.monitoringJwtToken = mediaServerInfo.monitoringJwtToken;
				this.#privateProperties.monitoringEnvironment = mediaServerInfo.monitoringEnvironment;
				this.#privateProperties.monitoringRegion = mediaServerInfo.monitoringRegion;

				const roomTypes = Object.values(RoomType);

				if (!roomTypes.includes(this.#privateProperties.roomType))
				{
					this.#triggerEvents('Failed', [{
						name: 'UNSUPPORTED_ROOM_TYPE',
						message: `Got unknown room type ${this.#privateProperties.roomType}`,
					}]);

					return;
				}
			}
			catch (error)
			{
				if (error.name !== 'AbortError' && !this.#privateProperties.abortController.signal.aborted)
				{
					// don't write error.name and error.message to analytics now,
					// because we don't watch failed reconnecting requests now

					this.#reconnect({
						reconnectionReason: 'GET_MEDIASERVER_INFO',
						reconnectionReasonInfo: error?.name || '',
					});
				}
				else if (this.#privateProperties.abortController.signal.aborted)
				{
					this.#triggerEvents('Failed', [error]);
				}

				return;
			}
		}

		if (this.#privateProperties.abortController.signal.aborted)
		{
			this.#beforeDisconnect({ destroySocket: true });

			return;
		}

		this.#privateProperties.abortController.signal.addEventListener('abort', this.beforeDisconnectBound);
		this.#privateProperties.socketConnection?.close(CloseCode.Reconnect);

		const autoSubscribe = this.#privateProperties.autoSubscribe ? 1 : 0;

		this.#privateProperties.socketConnection = new WebSocket(
			`${this.#privateProperties.mediaServerUrl}?auto_subscribe=${autoSubscribe}&sdk=js&version=1.6.7&protocol=8`
			+`&roomData=${this.#privateProperties.roomData}`
			+`&clientVersion=${ClientVersion}`
			+`&clientPlatform=${ClientPlatform}`);

		this.#privateProperties.socketConnection.onmessage = (e) => this.socketOnMessageHandler(e);
		this.#privateProperties.socketConnection.onopen = () => this.socketOnOpenHandler();
		this.#privateProperties.socketConnection.onerror = () => this.socketOnErrorHandler();
		this.#privateProperties.socketConnection.onclose = (e) => this.socketOnCloseHandler(e);
	};

	#reconnect(reconnectInfo): void
	{
		const data: any = Type.isObject(reconnectInfo) ? reconnectInfo : {};

		this.#privateProperties.isReconnecting = true;
		this.#privateProperties.videoQueue = VIDEO_QUEUE.INITIAL;

		const reasonText = data.reconnectionReason ? `, reason: ${data.reconnectionReason}` : '';
		const detailsText = data.reconnectionReasonInfo ? `, details: ${data.reconnectionReasonInfo}` : '';
		const reconnectLog = `Starting reconnection attempt #${++this.#privateProperties.reconnectionAttempt}${reasonText}${detailsText}`;
		this.setLog(reconnectLog, LOG_LEVEL.WARNING);

		const reconnectionDelay = this.#privateProperties.lastReconnectionReason === ReconnectionReason.JoinResponseError
			? this.#privateProperties.reconnectionDelay
			: this.#privateProperties.fastReconnectionDelay;
		this.#privateProperties.reconnectionTimeout = setTimeout(this.connect.bind(this), reconnectionDelay);

		this.#privateProperties.previousMediaServers = this.#privateProperties.mediaServers;
		this.#privateProperties.mediaServers = new Map();

		checkMetricsFeatureAndExecutionCallback(() => {
			this.addMonitoringEvents({
				name: MONITORING_EVENTS_NAME_LIST.USER_RECONNECTED,
				withCounter: true,
			});
		});

		this.#triggerEvents('Reconnecting', [data]);
	}

	#beforeDisconnect(options: Object): void
	{
		const disconnectOptions = Type.isObject(options) ? options : {};
		window.removeEventListener('unload', this.sendLeaveBound);
		this.#clearPingInterval();
		this.#clearPingTimeout();
		clearInterval(this.#privateProperties.callStatsInterval);

		this.#updateRepublicationState(MediaStreamsKinds.Camera);
		this.#updateRepublicationState(MediaStreamsKinds.Microphone);
		this.#updateRepublicationState(MediaStreamsKinds.Screen);
		this.#updateRepublicationState(MediaStreamsKinds.ScreenAudio);

		this.#privateProperties.mediaServerUrl = '';
		this.#privateProperties.roomData = '';
		this.#privateProperties.allMediaServersConnected = false;
		this.#privateProperties.mediaServersConnected = {};
		this.#privateProperties.localTracks = {};

		if (this.#privateProperties.socketConnection)
		{
			const closeCode = disconnectOptions.initiatedByUser ? CloseCode.Normal : CloseCode.Reconnect;
			this.#privateProperties.socketConnection.onmessage = null;
			this.#privateProperties.socketConnection.onopen = null;
			this.#privateProperties.socketConnection.onerror = null;
			this.#privateProperties.socketConnection.onclose = null;

			if (disconnectOptions.destroySocket)
			{
				this.#privateProperties.socketConnection.close(closeCode);
				this.#privateProperties.socketConnection = null;
			}
		}
	}

	#processMediaServers(mediaServersToProcess: Array<[number, any]>): void
	{
		for (const [id: number, iceServers: any] of mediaServersToProcess)
		{
			const mediaServerId: number = Number(id);
			const isPublishing: boolean = mediaServerId === this.#privateProperties.publishingMediaServerId;
			const mediaServer: MediaServer = this.#getOrSetMediaServer(mediaServerId);
			mediaServer.updateConfig({ iceServers, isPublishing });
			mediaServer.connect();
		}

		if (this.#privateProperties.previousMediaServers)
		{
			const mediaServersToRemove: Map<number, MediaServer> = new Map(this.#privateProperties.previousMediaServers);
			this.#privateProperties.previousMediaServers = null;

			for (const mediaServer of mediaServersToRemove.values())
			{
				mediaServer.disconnect();
			}

			mediaServersToRemove.clear();
		}
	}

	getMediaServerInfo()
	{
		let request = null;

		if (this.#privateProperties.isLegacy)
		{
			let url = `${this.#privateProperties.endpoint}/join`;
			url += `?token=${this.#privateProperties.jwt}`;
			url += `&clientVersion=${ClientVersion}`;
			url += `&clientPlatform=${ClientPlatform}`;

			request = new Promise((resolve, reject) => {
				fetch(url, {
					method: 'GET',
					signal: this.#privateProperties.abortController.signal,
				})
					.then((response) => {
						return response.json();
					})
					.then((data) => {
						resolve(data);
					})
					.catch((error) => {
						reject(error);
					});
			});
		}
		else
		{
			request = Util.getCallConnectionDataById(this.#privateProperties.roomId);
		}

		return new Promise((resolve, reject) => {
			const isErrorPreventingReconnection = (code) => {
				const reconnectionStoppableCodeNames = new Set(['InputError', 'AccessDenied', 'RoomNotFound', 'MalfunctioningSignaling', 'CanNotCreateRoom']);

				return Object.entries(JoinRequestFailedCodes)
					.some(([failedName, failedCode]) => reconnectionStoppableCodeNames.has(failedName) && failedCode === code);
			};

			request
				.then((data) => {
					if (data.error)
					{
						throw data.error;
					}
					else if (!data?.result?.mediaServerUrl || !data?.result?.roomData)
					{
						throw {
							name: 'MEDIASERVER_MISSING_PARAMS',
							message: 'Incorrect signaling response',
						};
					}

					const {
						mediaServerUrl,
						roomData,
						roomType,
					} = data.result;

					const monitoringServerUrl = data.result.monitoring?.metricsServerUrl;
					const monitoringLogsServerUrl = data.result.monitoring?.logsServerUrl;
					const monitoringJwtToken = data.result.monitoring?.token;
					const monitoringEnvironment = data.result.monitoring?.env;
					const monitoringRegion = data.result.monitoring?.region;

					resolve(
					{
						mediaServerUrl,
						roomData,
						roomType,
						monitoringServerUrl,
						monitoringLogsServerUrl,
						monitoringJwtToken,
						monitoringEnvironment,
						monitoringRegion,
					});
				})
				.catch((error) => {
					if (
						(error.code && isErrorPreventingReconnection(error.code))
						|| error.name === 'AbortError'
						|| error.name === 'SyntaxError'
					)
					{
						this.#privateProperties.abortController.abort();
						/*
						let errorCode = 'UNKNOWN_ERROR';
						if (Type.isObject(error) && error instanceof JoinResponseError)
						{
							errorCode = error.name;
						}
						else if (Type.isObject(error) && error.code)
						{
							errorCode = error.code === 'access_denied' 'ACCESS_DENIED' : error.code;
						}

						this.#triggerEvents('ReconnectingFailed', [null, {
							code: errorCode,
							message: error?.message,
						}]);
						*/

						reject({
							name: 'MEDIASERVER_UNEXPECTED_ANSWER',
							message: error?.message,
						});
					}
					else
					{
						this.#privateProperties.lastReconnectionReason = error.code
							? ReconnectionReason.JoinResponseError
							: ReconnectionReason.NetworkError;

						// don't write error.name and error.message to analytics now,
						// because we don't watch failed reconnecting requests now

						reject({
							name: 'MEDIASERVER_ERROR',
							message: `Reason: ${error?.message}`,
						});
					}
				});
		});
	}

	async startStream()
	{
		const videoTrack = await this.getLocalVideo();
		if (videoTrack)
		{
			await this.publishTrack(MediaStreamsKinds.Camera, videoTrack, this.#getStreamQualityOptions(MediaStreamsKinds.Camera));
		}
		else
		{
			this.#releaseStream(MediaStreamsKinds.Camera);
			this.onPublishFailed(MediaStreamsKinds.Camera);
		}

		const audioTrack = await this.getLocalAudio();
		if (audioTrack)
		{
			await this.publishTrack(MediaStreamsKinds.Microphone, audioTrack, this.#getStreamQualityOptions(MediaStreamsKinds.Microphone));
		}
		else
		{
			this.#releaseStream(MediaStreamsKinds.Microphone);
			this.onPublishFailed(MediaStreamsKinds.Microphone);
		}
	}

	async socketOnMessageHandler(event)
	{
		if (typeof event.data !== 'string') return;

		let signal;
		let data;
		let mediaServerId;

		try
		{
			if (this.#privateProperties.roomType === RoomType.Small)
			{
				data = JSON.parse(event.data);
				mediaServerId = this.#privateProperties.publishingMediaServerIdForSmallRoom;
				this.#privateProperties.publishingMediaServerId = mediaServerId;
			}
			else if (this.#privateProperties.roomType === RoomType.Large)
			{
				signal = JSON.parse(event.data);
				data = signal?.event;
				mediaServerId = signal?.mediaServerId;
			}
		}
		catch (err)
		{
			this.setLog(`Could not parse a socket message: ${event.data}`, LOG_LEVEL.WARNING);
			return;
		}

		if (!data)
		{
			return;
		}

		if (data?.joinResponse)
		{
			if (this.isConnected())
			{
				this.setLog(`Got extra joinResponse signal after connection, ignoring it`, LOG_LEVEL.WARNING);
				return;
			}

			if (data.joinResponse.role)
			{
				Util.setCurrentUserRole(data.joinResponse.role);
			}

			this.#privateProperties.abortController.signal.removeEventListener('abort', this.beforeDisconnectBound);

			this.#privateProperties.localParticipantSid = this.#privateProperties.roomType === RoomType.Large
				? data.joinResponse.localParticipant.sids
				: { [this.#privateProperties.publishingMediaServerId]: data.joinResponse.localParticipant.sid };

			this.#privateProperties.publishingMediaServerId = this.#privateProperties.roomType === RoomType.Large
				? data.joinResponse.publishingMediaServerId
				: this.#privateProperties.publishingMediaServerIdForSmallRoom;

			const mediaServersToProcess = this.#privateProperties.roomType === RoomType.Large
				? Object.entries(data.joinResponse.iceServers)
				: [[this.#privateProperties.publishingMediaServerId, data.joinResponse.iceServer]];

			this.#processMediaServers(mediaServersToProcess);

			const isReconnect = this.#privateProperties.isReconnecting && this.wasConnected;
			const connectedEvent = isReconnect ? CallApiEvent.Reconnected : CallApiEvent.Connected;

			this.#privateProperties.callState = CALL_STATE.CONNECTED;
			this.wasConnected = true;
			this.setLog(`${connectedEvent} to the call ${this.#privateProperties.roomId} (type: ${this.#privateProperties.roomType}) on the media server after ${this.#privateProperties.reconnectionAttempt} attempts`, LOG_LEVEL.INFO);
			this.#privateProperties.isReconnecting = false;
			this.#privateProperties.reconnectionAttempt = 0;

			if (data.joinResponse.oneToOneType)
			{
				this.#triggerEvents('ConnectionTypeChanged', [{
					type: data.joinResponse.oneToOneType,
				}]);
			}

			if (data.joinResponse.permissions && !isReconnect)
			{
				this.#setUserPermissions(data.joinResponse.permissions);
			}

			if (data.joinResponse.roomState && !isReconnect)
			{
				Util.setRoomPermissions(data.joinResponse.roomState);
				Util.setUserPermissionsByRoomPermissions(data.joinResponse.roomState);
			}

			checkMetricsFeatureAndExecutionCallback(() => {
				if (isReconnect && this.monitoringEvents.length > 1)
				{
					this.sendMonitoringEvents();
				}
			});

			this.#processParticipants(data.joinResponse.otherParticipants, isReconnect);

			if ('recorderStatus' in data.joinResponse)
			{
				const recorderStatus = { code: data.joinResponse.recorderStatus };
				if (data.joinResponse.recorderRespStatus)
				{
					recorderStatus.errMsg = data.joinResponse.recorderRespStatus;
				}

				this.#triggerEvents('RecorderStatusChanged', [recorderStatus]);
			}

			this.#privateProperties.pingIntervalDuration = data.joinResponse.pingInterval * 1000;
			this.#privateProperties.pingTimeoutDuration = this.#privateProperties.pingIntervalDuration * 2.5;
			for (let id of this.#privateProperties.mediaServers.keys())
			{
				this.#startPingInterval(id);
			}

			this.#triggerEvents(connectedEvent);
		}
		else if (data?.participantJoined)
		{
			const participant = data.participantJoined.participant;
			this.setLog(`Adding a new participant with id ${participant.userId} (sid: ${participant.sid})`, LOG_LEVEL.INFO);
			this.#setRemoteParticipant(participant);
		}
		else if (data?.participantLeft)
		{
			const participantId = data.participantLeft.userId;
			const participant = this.#privateProperties.remoteParticipants[participantId];
			this.#clearPendingSubscriptions(participantId);

			if (participant)
			{
				this.setLog(`Deleting a participant with id ${participant.userId} (sid: ${participant.sid})`, LOG_LEVEL.INFO);

				Object.values(participant.tracks).forEach((track) => {
					delete this.#privateProperties.tracksDataFromSocket[track.id];
				});

				delete this.#privateProperties.remoteParticipants[participantId];
				this.#triggerEvents('ParticipantLeaved', [participant]);
			}
			else
			{
				this.setLog(`Got participantLeft signal for a non-existent participant with id ${participantId} (sid: ${data.participantLeft.sid})`, LOG_LEVEL.WARNING);
			}
		}
		else if (data?.participantReconnecting)
		{
			const participantId = data.participantReconnecting.userId;
			const participant = this.#privateProperties.remoteParticipants[participantId];
			this.#clearPendingSubscriptions(participantId);

			if (participant)
			{
				this.setLog(`Participant with id ${participantId} (sid: ${data.participantReconnecting.sid}) is reconnecting`, LOG_LEVEL.INFO);
				Object.values(participant.tracks).forEach((track) => {
					delete this.#privateProperties.tracksDataFromSocket[track.id];
				});
				this.#triggerEvents('ParticipantReconnecting', [participant]);
			}
			else
			{
				this.setLog(`Got participantReconnecting signal for a non-existent participant with id ${participantId} (sid: ${data.participantReconnecting.sid})`, LOG_LEVEL.WARNING);
			}
		}
		else if (data?.participantReconnected)
		{
			const participantId = data.participantReconnected.userId;
			const participant = this.#privateProperties.remoteParticipants[participantId];
			this.#clearPendingSubscriptions(participantId);

			if (participant)
			{
				this.setLog(`Participant with id ${participantId} (sid: ${data.participantReconnected.sid}) is reconnected`, LOG_LEVEL.INFO);
				this.#triggerEvents('ParticipantReconnected', [participant]);
			}
			else
			{
				this.setLog(`Got participantReconnected signal for a non-existent participant with id ${participantId} (sid: ${data.participantReconnected.sid})`, LOG_LEVEL.WARNING);
			}
		}
		else if (data?.trackCreated)
		{
			const participantId = data.trackCreated.userId;
			const cid = data.trackCreated.cid;
			const track = data.trackCreated.track;
			const trackId = track.sid;
			const source = track.source;
			track.userId = participantId;

			if (participantId == this.#privateProperties.userId)
			{
				const timeout = this.#privateProperties.pendingPublications[cid];
				clearTimeout(this.#privateProperties.pendingPublications[cid]);
				delete this.#privateProperties.pendingPublications[cid];

				if (!timeout)
				{
					this.setLog(`Got trackCreated signal for local track with kind ${source} (sid: ${trackId}) without active timeout`, LOG_LEVEL.WARNING);
				}

				this.setLog(`Publishing a local track with kind ${source} (sid: ${trackId}) succeeded`, LOG_LEVEL.INFO);
				this.#privateProperties.localTracks[source] = track;
				this.#triggerEvents('PublishSucceed', [source]);
				this.#onTrackPublishResult(trackId, source, 'trackCreated');
			}
			else
			{
				this.#privateProperties.tracksDataFromSocket[trackId] = track;
				const participant = this.#privateProperties.remoteParticipants[participantId];
				if (participant)
				{
					this.#processTrack(data.trackCreated);
				}
				else
				{
					if (!this.#privateProperties.allMediaServersConnected)
					{
						this.#privateProperties.tracksToProcess.push(data.trackCreated);
					}
					else
					{
						this.setLog(`Got a track info with kind ${track.source} (sid: ${data.trackCreated.track.sid}) for a non-existent participant with id ${participantId}`, LOG_LEVEL.WARNING);
					}
				}
			}
		}
		else if (data.trackSubscribed)
		{
			// disabled because of switching to per layer subscription
			// this.#changeTrackActivity(data.trackSubscribed.trackSid, true);
		}
		else if (data.trackNoSubscribed)
		{
			// disabled because of switching to per layer subscription
			// this.#changeTrackActivity(data.trackNoSubscribed.trackSid, false);
		}
		else if (data.trackReSubscribed)
		{
			// disabled because of switching to per layer subscription
			// this.#changeTrackActivity(data.trackReSubscribed.trackSid, true);
		}
		else if (data?.trackDeleted)
		{
			const participantId = data.trackDeleted.publisher;
			if (participantId == this.#privateProperties.userId)
			{
				return;
			}

			const trackId = data.trackDeleted.shortId;
			try
			{
				const pendingSubscription = this.#privateProperties.pendingSubscriptions[participantId]?.[trackId];
				delete this.#privateProperties.tracksDataFromSocket[trackId];

				if (pendingSubscription)
				{
					clearTimeout(pendingSubscription.timeout);
					delete this.#privateProperties.pendingSubscriptions[participantId][trackId];
					this.setLog(`Track with id ${trackId} was deleted during subscription attempt, cancel it`, LOG_LEVEL.WARNING);
				}

				this.setLog(`Start deleting a track with id ${trackId} from a participant with id ${participantId} `, LOG_LEVEL.INFO);
				const participant = this.#privateProperties.remoteParticipants[participantId];
				if (!participant)
				{
					this.setLog(`Deleting a track with id ${trackId} failed: can't find a participant with id ${participantId}`, LOG_LEVEL.WARNING);
					return
				}
				const track = Object.values(participant.tracks)?.find(track => track?.id === trackId);
				delete this.#privateProperties.tracksDataFromSocket[trackId];

				if (track)
				{
					if (track.source === MediaStreamsKinds.Microphone)
					{
						participant.audioEnabled = false;
					}
					else if (track.source === MediaStreamsKinds.Camera)
					{
						participant.videoEnabled = false;
					}
					else if (track.source === MediaStreamsKinds.Screen)
					{
						participant.screenSharingEnabled = false;
					}
					participant.removeTrack(track.source);
					this.setLog(`Deleting a track with id ${trackId} from a participant with id ${participantId} (sid: ${participant.sid}) succeeded`, LOG_LEVEL.INFO);
					this.#triggerEvents('RemoteMediaRemoved', [participant, track]);
				}
				else
				{
					this.setLog(`Deleting a track with id ${trackId} from a participant with id ${participantId} (sid: ${participant.sid}) failed: can't find a track`, LOG_LEVEL.WARNING);
				}
			}
			catch (e)
			{
				this.setLog(`Deleting a track with id ${trackId} from a participant with id ${participantId} failed: ${e}`, LOG_LEVEL.ERROR);
			}
		}
		else if (data?.trackMuted)
		{
			this.#trackMutedHandler(data.trackMuted);
		}
		else if (data.trackPublicationError)
		{
			this.#trackPublicationErrorHandler(data.trackPublicationError);
		}
		else if (data?.subscribedQualityUpdate)
		{
			const { trackSid, subscribedQualities } = data.subscribedQualityUpdate;
			this.#changeLayersAvailability(trackSid, subscribedQualities);
		}
		else if (data?.subscriptionResponse)
		{
			this.#subscriptionResponseHandler(data.subscriptionResponse);
		}
		else if (data?.offer)
		{
			const mediaServer = this.#getOrSetMediaServer(mediaServerId);
			mediaServer.addOffer(data);
		}
		else if (data?.answer)
		{
			const mediaServer = this.#getOrSetMediaServer(mediaServerId);
			mediaServer.addAnswer(data);
		}
		else if (data?.trickle)
		{
			const mediaServer = this.#getOrSetMediaServer(mediaServerId);
			mediaServer.addIceCandidate(data);
		}
		else if (data.recorderStatus)
		{
			this.#triggerEvents('RecorderStatusChanged', [data.recorderStatus]);
		}
		else if (data?.videoRecorderStatus)
		{
			this.#triggerEvents('CloudRecordStatusChanged', [data.videoRecorderStatus]);
		}
		else if (data?.newMessage)
		{
			this.#processMessage(data.newMessage);
		}
		else if (data?.handRaised)
		{
			const participant = this.#privateProperties.remoteParticipants[data.handRaised.participantId];
			if (participant)
			{
				participant.isHandRaised = data.handRaised.isHandRaised;
				this.#triggerEvents('HandRaised', [participant]);
			}
		}
		else if (data?.connectionQuality)
		{
			if (!data.connectionQuality.updates)
			{
				return;
			}
			const participants = {};
			const participantsToUpdate = { ...this.#privateProperties.remoteParticipants };

			data.connectionQuality.updates.forEach(participant => {
				Object.values(participantsToUpdate).forEach(remoteParticipant => {

					const hasGoodQuality = participant.score > this.#privateProperties.minimalConnectionQuality;
					if (
						participant.participantSid === remoteParticipant.sid
						&& (
							!remoteParticipant.isMutedVideo
							|| !remoteParticipant.connectionQuality
						)
						&& !remoteParticipant.screenSharingEnabled
					) {
						participants[remoteParticipant.userId] = participant.score;
						// commented out for now, since a lot of log generated by this
						//this.setLog(`Quality of connection with a participant with id ${remoteParticipant.userId} (sid: ${remoteParticipant.sid}) changed to ${participant.score}`, hasGoodQuality ? LOG_LEVEL.INFO : LOG_LEVEL.WARNING);
						this.#privateProperties.remoteParticipants[remoteParticipant.userId].connectionQuality = participant.score;
					}

					const isLocalVideoMuted = this.#privateProperties.localTracks[MediaStreamsKinds.Camera]
						&& this.#privateProperties.localTracks[MediaStreamsKinds.Camera].muted;

					checkMetricsFeatureAndExecutionCallback(() => {
						if (participant.participantSid === this.#privateProperties.localParticipantSid)
						{
							this.addValidatedMonitoringMetric({
								metricKey: MONITORING_METRICS.CONN_SCORE_CURRENT,
								metricValue: participant.score,
							});
						}
					});
				});
			});
		}
		else if (data.pongResp)
		{
			this.#privateProperties.rtt[mediaServerId] = Date.now() - data.pongResp.lastPingTimestamp;
			this.#resetPingTimeout(mediaServerId);
		}
		else if (data.addMediaServer)
		{
			const mediaServer = this.#getOrSetMediaServer(data.addMediaServer.id);
			mediaServer.updateConfig({iceServers: data.addMediaServer.iceServers});
			mediaServer.connect();
			this.#startPingInterval(data.addMediaServer.id);
		}
		else if (data.removeMediaServer)
		{
			const mediaServer = this.#getMediaServer(data.removeMediaServer.id);
			if (mediaServer)
			{
				this.#clearPingInterval(mediaServer.id);
				this.#clearPingTimeout(mediaServer.id);
				mediaServer.disconnect();
				this.#privateProperties.mediaServers.delete(mediaServer.id);
			}
		}
		else if (data.reconnectMediaServer)
		{
			this.setLog(`Got reconnectMediaServer signal for ${data.reconnectMediaServer}`, LOG_LEVEL.WARNING);
			if (this.#privateProperties.isReconnecting)
			{
				return;
			}

			const mediaServer = this.#getMediaServer(data.reconnectMediaServer);
			if (!mediaServer)
			{
				return;
			}

			mediaServer.disconnect();
			mediaServer.connect();
		}
		else if (data.sidChanged)
		{
			const userId = data.sidChanged.participantId;

			if (userId == this.#privateProperties.userId)
			{
				this.#beforeDisconnect();
				this.#reconnect({
					reconnectionReason: 'GOT_SID_CHANGED_SIGNAL',
					reconnectionReasonInfo: '',
				});

				return;
			}

			const participant = this.#privateProperties.remoteParticipants[userId];
			participant?.updateSid(data.sidChanged.newSid);
		}
		else if (data.leave)
		{
			this.setLog(`Got leave signal with ${data.leave.reason} reason`, LOG_LEVEL.WARNING);
			this.#beforeDisconnect({
				initiatedByUser: true,
				destroySocket: true,
			});

			const canReconnectSmallRoom = this.#privateProperties.roomType === RoomType.Small
				&& (data.leave.canReconnect || data.leave.reason === 'CHANGING_MEDIA_SERVER')
				&& data.leave.reason !== 'SIGNALING_DUPLICATE_PARTICIPANT';
			const canReconnectBigRoom = this.#privateProperties.roomType === RoomType.Large
				&& (data.leave.reason === 'FULL_RECONNECT_NEEDED' || data.leave.reason === 'JOIN_FAILURE');

			if (canReconnectSmallRoom || canReconnectBigRoom)
			{
				this.#privateProperties.lastReconnectionReason = ReconnectionReason.LeaveCommand;
				this.#reconnect({
					reconnectionReason: 'GOT_LEAVE_SIGNAL',
					reconnectionReasonInfo: `Leave reason ${data.leave.reason}`,
				});
			}
			else
			{
				this.#privateProperties.canReconnect = false;
				this.#triggerEvents('Failed', [{
					name: data.leave.reason,
					leaveInformation: {code: data.leave.code, reason: data.leave.reason}
				}]);
			}
		}
		else if (data?.onErrorResponse)
		{
			this.setLog(`Got signaling error: ${data.onErrorResponse.message}`, LOG_LEVEL.ERROR);
		}
		else if (data?.onActionSent)
		{
			if (data?.onActionSent.changeSettings)
			{
				this.#settingsChangedHandler(data.onActionSent.changeSettings);
			}
			else if (data?.onActionSent.givePermissions)
			{
				this.#userPermissionsChanged(data.onActionSent.givePermissions);
			}
			else if (data?.onActionSent.participantMuted)
			{
				this.#participantMutedHandler(data.onActionSent.participantMuted);
			}
			else if (data?.onActionSent.allParticipantsMuted)
			{
				this.#allParticipantsMutedHandler(data.onActionSent.allParticipantsMuted);
			}
			else if (data?.onActionSent.updateRole)
			{
				this.#updateRoleHandler(data.onActionSent.updateRole);
			}
			else if (data?.onActionSent.switchConnectionType)
			{
				this.#triggerEvents('ConnectionTypeChanged', [data?.onActionSent.switchConnectionType]);
			}
		}
	};

	socketOnOpenHandler()
	{
		window.addEventListener('unload', this.sendLeaveBound)
	};

	socketOnCloseHandler(e)
	{
		this.#beforeDisconnect();

		if (e?.code && e?.code !== 1005)
		{
			this.setLog(`Socket closed with a code ${e.code}, reconnecting`, LOG_LEVEL.ERROR);
			this.#privateProperties.lastReconnectionReason = ReconnectionReason.WsTransportClosed;
			this.#reconnect({
				reconnectionReason: 'WS_CONNECTION_CLOSED',
				reconnectionReasonInfo: `Socket closed with a code ${e.code}`,
			});
		}
		else
		{
			this.setLog(`Socket closed with a code ${e.code}`, LOG_LEVEL.ERROR);
		}
	};

	socketOnErrorHandler()
	{
		this.setLog(`Got a socket error`, LOG_LEVEL.ERROR);
	};

	#getMediaServer(id: number | string): MediaServer | null
	{
		return this.#privateProperties.mediaServers.get(Number(id)) || null;
	}

	#getOrSetMediaServer(id): MediaServer
	{
		return this.#getMediaServer(id) || this.#createMediaServer({ id });
	}

	#getPublishingMediaServer(): MediaServer | null
	{
		return this.#getMediaServer(this.#privateProperties.publishingMediaServerId);
	}

	#createMediaServer(config: any): MediaServer
	{
		const mediaServer: MediaServer = new MediaServer(config);
		this.#privateProperties.mediaServers.set(mediaServer.id, mediaServer);

		mediaServer.on('log', this.setLogBound);
		mediaServer.on('signal', this.sendSignalBound);
		mediaServer.on('addTrack', this.onAddTrackBound);
		mediaServer.on('track', this.onTrackBound);
		mediaServer.on('stats', this.processStatsBound);
		mediaServer.on('peerConnectionIssue', this.onPeerConnectionIssueBound);
		mediaServer.on('down', this.onMediaServerDownBound);
		mediaServer.on('up', this.onMediaServerUpBound);

		return mediaServer;
	}

	#removeMediaServerEvents(mediaServer)
	{
		mediaServer.off('log', this.setLogBound);
		mediaServer.off('signal', this.sendSignalBound);
		mediaServer.off('track', this.onTrackBound );
		mediaServer.off('stats', this.processStatsBound);
		mediaServer.off('peerConnectionIssue', this.onPeerConnectionIssueBound);
		mediaServer.off('down', this.onMediaServerDownBound);
		mediaServer.off('up', this.onMediaServerUpBound);
	};

	#onPeerConnectionIssue(mediaServerId, issue)
	{
		checkMetricsFeatureAndExecutionCallback(() => {
			this.addMonitoringEvents(issue);
		});
	}

	#onMediaServerDown(mediaServerId, additionalData)
	{
		if (!this.#privateProperties.isReconnecting)
		{
			if (this.#privateProperties.roomType === RoomType.Small)
			{
				this.setLog(`Media server with id ${mediaServerId} is down, reconnecting`, LOG_LEVEL.WARNING);
				this.#beforeDisconnect();
				this.#reconnect(additionalData);
			}
			else if (this.#privateProperties.roomType === RoomType.Large)
			{
				this.setLog(`Media server with id ${mediaServerId} is down, waiting for reconnectMediaServer signal`, LOG_LEVEL.WARNING);
			}
		}
	};

	#onMediaServerUp(mediaServerId, subscriber)
	{
		if (!this.#privateProperties.isReconnecting && !this.#privateProperties.allMediaServersConnected)
		{
			if (!this.#privateProperties.mediaServersConnected[mediaServerId])
			{
				this.#privateProperties.mediaServersConnected[mediaServerId] = {};
			}

			const peerConnectionType = subscriber ? 'subscriber' : 'publisher';
			this.#privateProperties.mediaServersConnected[mediaServerId][peerConnectionType] = true;

			const connectedMediaServers = Object.keys(this.#privateProperties.mediaServersConnected).length;
			const mediaServer = this.#getPublishingMediaServer();
			const allMediaServersConnected = connectedMediaServers === this.#privateProperties.mediaServers.size;
			const subscriberConnectionIsUp = mediaServer?.subscriber;
			const publisherConnectionIsUp = mediaServer?.publisher;
			const publishIsDisabled = Util.isBroadcastDisabled();

			if (allMediaServersConnected && subscriberConnectionIsUp && (publisherConnectionIsUp || publishIsDisabled))
			{
				this.#privateProperties.allMediaServersConnected = true;
				this.#privateProperties.tracksToProcess.forEach((data) => this.#processTrack(data));
				this.#privateProperties.tracksToProcess = [];
			}
		}
	}

	#processStats(stats, mediaServerId)
	{
		const processedStats = {};
		if (stats.publisher)
		{
			processedStats.publisher = this.#processPublisherStats(stats.publisher, mediaServerId);
		}
		processedStats.subscriber = this.#processSubscriberStats(stats.subscriber, mediaServerId);

		this.#triggerEvents('CallStatsReceived', [processedStats]);
	};

	#processPublisherStats(stats, mediaServerId)
	{
		const statsOutput = [];
		const codecs = {};
		const reportsWithoutCodecs = {};
		const remoteReports = {};
		const reportsWithoutRemoteInfo = {};
		const dataLoss = [];
		let isQualityLimitationSent = false;
		const totalBitrateOut = [];
		let packetLostEventAdded = false;

		if (!this.#privateProperties.outgoingTracksReports[mediaServerId])
		{
			this.#privateProperties.outgoingTracksReports[mediaServerId] = {};
		}

		stats.forEach((rawReport) => {
			const report = { ...rawReport };
			statsOutput.push(report);

			if (report.type === 'codec')
			{
				Util.processReportsWithoutCodecs(report, codecs, reportsWithoutCodecs);
			}

			if (report.type === 'remote-inbound-rtp')
			{
				const reportId = report.localId;
				if (!reportsWithoutRemoteInfo[reportId])
				{
					remoteReports[reportId] = report;

					return;
				}

				if (!this.#privateProperties.outgoingTracksReports[mediaServerId][reportId])
				{
					this.#privateProperties.outgoingTracksReports[mediaServerId][reportId] = {};
				}

				const prevReport = this.#privateProperties.outgoingTracksReports[mediaServerId][reportId];
				const packetsLostData = Util.calcLocalPacketsLost(reportsWithoutRemoteInfo[reportId], prevReport, report);
				const { currentPercentPacketLost } = packetsLostData;

				checkMetricsFeatureAndExecutionCallback(() => {
					this.addValidatedMonitoringMetric({
						additionalData: {
							currentReportPacketsSent: reportsWithoutRemoteInfo[reportId]?.packetsSent,
							prevReportPacketsSent: this.#privateProperties.outgoingTracksReports[mediaServerId][reportId]?.packetsSent,
							prevReportPacketsLost: this.#privateProperties.outgoingTracksReports[mediaServerId][reportId]?.packetsLost,
							remoteReportPacketsLost: report?.packetsLost,
						},
						metricKey: MONITORING_METRICS.PACKET_LOST_SEND,
						metricValue: currentPercentPacketLost,
					});
				});

				if (!packetLostEventAdded && currentPercentPacketLost > this.#privateProperties.packetLostThreshold)
				{
					packetLostEventAdded = true;
					checkMetricsFeatureAndExecutionCallback(() => {
						this.addMonitoringEvents({
							name: MONITORING_EVENTS_NAME_LIST.HIGH_PACKET_LOSS_SEND,
							withCounter: true,
						});
					});
				}

				prevReport.packetsLostData = packetsLostData;
				prevReport.packetsLost = { ...packetsLostData };
				prevReport.packetsLostExtended = Util.formatPacketsLostData(packetsLostData);

				delete reportsWithoutRemoteInfo[reportId];

				if (this.#privateProperties.outgoingTracksReports[mediaServerId][reportId].source === MediaStreamsKinds.Camera)
				{
					dataLoss.push(report.packetsLost);
				}
			}

			if (report.type === 'outbound-rtp')
			{
				const reportId = report.id;

				if (!this.#privateProperties.outgoingTracksReports[mediaServerId][reportId])
				{
					this.#privateProperties.outgoingTracksReports[mediaServerId][reportId] = {};
				}

				const prevReport = this.#privateProperties.outgoingTracksReports[mediaServerId][reportId];
				report.bitrate = Util.calcBitrate(report, prevReport, true);

				this.#privateProperties.outgoingTracksReports[mediaServerId][reportId] = {
					...prevReport,
					...report,
				};

				report.userId = this.#privateProperties.userId;
				report.mediaServerId = mediaServerId;

				if (report.kind === 'audio')
				{
					report.source = MediaStreamsKinds.Microphone;
				}
				else if (report.kind === 'video')
				{
					report.source = report.contentType === 'screenshare'
						? MediaStreamsKinds.Screen
						: MediaStreamsKinds.Camera;
				}

				totalBitrateOut.push({
					bitrate: report.bitrate,
					kind: report.kind,
					contentType: report.contentType,
				});

				if (report.qualityLimitationReason && report.qualityLimitationReason !== 'none' && !isQualityLimitationSent)
				{
					checkMetricsFeatureAndExecutionCallback(() => {
						if (report.qualityLimitationReason === 'cpu')
						{
							this.addMonitoringEvents({
								name: MONITORING_EVENTS_NAME_LIST.CPU_ISSUES,
								withCounter: true,
							});
						}

						if (report.qualityLimitationReason === 'bandwidth')
						{
							this.addMonitoringEvents({
								name: MONITORING_EVENTS_NAME_LIST.NETWORK_ISSUES,
								withCounter: true,
							});
						}
					});

					isQualityLimitationSent = true;
					const limitations = Object.entries(report.qualityLimitationDurations).reduce(
						(accumulator, value, index) => `${accumulator}${index ? ', ' : ''}${value[0]}: ${value[1]}`,
						'',
					);
					this.setLog(`Local user have problems with sending video: ${report.qualityLimitationReason} (${limitations})`, LOG_LEVEL.WARNING);
				}

				if (!Util.setCodecToReport(report, codecs, reportsWithoutCodecs))
				{
					Util.saveReportWithoutCodecs(report, reportsWithoutCodecs);
				}

				if (Util.setLocalPacketsLostOrSaveReport(report, remoteReports, reportsWithoutRemoteInfo) && report.source === MediaStreamsKinds.Camera)
				{
					dataLoss.push(report.packetsLostData.currentPercentPacketLost);
				}
			}
		});

		checkMetricsFeatureAndExecutionCallback(() => {
			const bitrateSumOut = calcBitrateSumFromArray({ bitrateArray: totalBitrateOut });
			const formattedBitrateOut = Number.parseFloat((bitrateSumOut / 1_000_000).toFixed(2));

			if (this.currentMonitoringEventsObject.metrics[MONITORING_METRICS.BITRATE_OUT].length < this.countMetricsInMetricsInterval)
			{
				this.addValidatedMonitoringMetric({
					additionalData: {
						bitrateList: totalBitrateOut,
						bitrateSumOut,
						formattedBitrateOut,
					},
					metricKey: MONITORING_METRICS.BITRATE_OUT,
					metricValue: bitrateSumOut,
				});
			}
		});

		if (!this.#privateProperties.stats[this.#privateProperties.userId])
		{
			this.#privateProperties.stats[this.#privateProperties.userId] = [];
		}

		const maxDataLoss = Math.max(0, ...dataLoss);

		if (this.#privateProperties.stats[this.#privateProperties.userId].push(maxDataLoss) > 10)
		{
			this.#privateProperties.stats[this.#privateProperties.userId].shift();
		}

		const connectionDataLoss = this.#privateProperties.stats[this.#privateProperties.userId].reduce(
			(acc, number) => acc + number, 0
		) / this.#privateProperties.stats[this.#privateProperties.userId].length;
		const connectionScore = Util.calcConnectionScore(connectionDataLoss);
		this.#setConnectionQuality(this.#privateProperties.userId, connectionScore);

		return statsOutput;
	}

	#processSubscriberStats(stats, mediaServerId)
	{
		const statsOutput = [];
		const participantsWithLargeDataLoss = new Map();
		const codecs = {};
		const reportsWithoutCodecs = {};
		let dataLoss = {};
		let totalBitrateIn = [];
		let currentPacketLostReceiveCount = 0;

		const inboundRtpStatsArray = {
			freezeCount: [],
			totalFreezesDuration: [],
			jitter: [],
			framesDecoded: [],
			framesDropped: [],
			framesReceived: [],
			framesLoss: [],
		};

		if (!this.#privateProperties.reportsForIncomingTracks[mediaServerId])
		{
			this.#privateProperties.reportsForIncomingTracks[mediaServerId] = {};
		}

		stats.forEach((report) =>
		{
			statsOutput.push(report);

			if (report.type === 'inbound-rtp' && report.kind === 'video')
			{
				const { freezeCount, totalFreezesDuration, jitter, framesDecoded, framesDropped, framesReceived } = report;

				inboundRtpStatsArray.jitter.push(jitter);
				inboundRtpStatsArray.totalFreezesDuration.push(totalFreezesDuration);
				inboundRtpStatsArray.freezeCount.push(freezeCount);
				inboundRtpStatsArray.framesDecoded.push(framesDecoded);
				inboundRtpStatsArray.framesDropped.push(framesDropped);
				inboundRtpStatsArray.framesReceived.push(framesReceived);
				inboundRtpStatsArray.framesLoss.push((framesDropped / framesReceived) * 100);
			}

			const needCheckPacketLosts = (report?.trackIdentifier
				&& report.hasOwnProperty('packetsLost')
				&& report.hasOwnProperty('packetsReceived'));

			if (needCheckPacketLosts)
			{
				const packetsLostData = Util.calcRemotePacketsLost(report, this.#privateProperties.reportsForIncomingTracks[mediaServerId][report.trackIdentifier]);
				report.packetsLostExtended = Util.formatPacketsLostData(packetsLostData);
				this.#privateProperties.reportsForIncomingTracks[mediaServerId][report.trackIdentifier] = report;

				const realTrackId = this.#privateProperties.realTracksIds[report.trackIdentifier];
				const track = this.#privateProperties.tracksDataFromSocket[realTrackId];

				if (!track)
				{
					return;
				}

				const participant = this.#privateProperties.remoteParticipants[track.userId];

				if (!participant)
				{
					return;
				}

				const prevReport = track.report || {};
				track.report = report;
				report.bitrate = Util.calcBitrate(report, prevReport);
				report.userId = track.userId;
				report.source = track.source;
				report.mediaServerId = mediaServerId;

				const { currentPercentPacketLost } = packetsLostData;

				totalBitrateIn.push({
					bitrate: report.bitrate,
					kind: report.kind,
					contentType: report.contentType,
				});

				if (!Util.setCodecToReport(report, codecs, reportsWithoutCodecs))
				{
					Util.saveReportWithoutCodecs(report, reportsWithoutCodecs);
				}

				if (report.source === MediaStreamsKinds.Camera)
				{
					currentPacketLostReceiveCount = currentPercentPacketLost;
					dataLoss[report.userId] = currentPercentPacketLost;
				}

				if (participant.userId != this.#privateProperties.userId)
				{
					report.inRemoteTracks = participant.getTrack(track.source)?.sid === realTrackId ? 'Y' : 'N';

					if (currentPercentPacketLost > this.#privateProperties.packetLostThreshold)
					{
						participantsWithLargeDataLoss.set(participant.userId, `userId: ${participant.userId} (${currentPercentPacketLost}%)`);
						this.#privateProperties.prevParticipantsWithLargeDataLoss.delete(participant.userId);
					}
				}
			}
			else if (report.type === 'codec')
			{
				Util.processReportsWithoutCodecs(report, codecs, reportsWithoutCodecs);
			}
		});

		checkMetricsFeatureAndExecutionCallback(() => {
			const { countVideoTracks, countAudioTracks } = this.getCountRemoteTracks();

			const round = (number, decimal) => Math.round(number * Math.pow(10, decimal)) / Math.pow(10, decimal);

			const addValueInboundRTCStatsToMetrics = ({ key, metricsKey, isSum, decimal = 0, interval }) =>
			{
				if (this.currentMonitoringEventsObject.metrics[MONITORING_METRICS[metricsKey]].length >= this.countMetricsInMetricsInterval)
				{
					return;
				}

				const inboundRtpStatsArraySumByKey = inboundRtpStatsArray[key].reduce((acc, number) => acc + number, 0) / (interval ? (this.#privateProperties.statsTimeout / 1000) : 1);
				const prevInboundRtpStatsArraySumByKey = this.prevInboundRtpStatsSum[key];
				const diffInboundRtpStatsArraySumByKey = prevInboundRtpStatsArraySumByKey && !!isSum ? inboundRtpStatsArraySumByKey - prevInboundRtpStatsArraySumByKey : inboundRtpStatsArraySumByKey;
				const metricValue = !!countVideoTracks ? diffInboundRtpStatsArraySumByKey / countVideoTracks : 0;

				this.addValidatedMonitoringMetric({
					additionalData: {
						inboundRtpStatsArrayByKey: inboundRtpStatsArray[key],
						inboundRtpStatsArraySumByKey,
						prevInboundRtpStatsArraySumByKey: prevInboundRtpStatsArraySumByKey,
						diffInboundRtpStatsArraySumByKey,
						metricValue,
					},
					metricKey: metricsKey,
					metricValue: round(metricValue, decimal),
				});
				this.prevInboundRtpStatsSum[key] = inboundRtpStatsArraySumByKey;
			}

			addValueInboundRTCStatsToMetrics({ key: 'jitter', metricsKey: MONITORING_METRICS.JITTER, isSum: false, decimal: 3 });
			addValueInboundRTCStatsToMetrics({ key: 'freezeCount', metricsKey: MONITORING_METRICS.FREEZE_COUNT, isSum: true, interval: true });
			addValueInboundRTCStatsToMetrics({ key: 'totalFreezesDuration', metricsKey: MONITORING_METRICS.TOTAL_FREEZE_DURATION, isSum: true, decimal: 3, interval: true });
			addValueInboundRTCStatsToMetrics({ key:'framesDecoded', metricsKey:MONITORING_METRICS.FRAMES_DECODED, isSum:true, interval: true });
			addValueInboundRTCStatsToMetrics({ key:'framesReceived', metricsKey:MONITORING_METRICS.FRAMES_RECEIVED, isSum:true, interval: true });
			addValueInboundRTCStatsToMetrics({ key:'framesDropped', metricsKey: MONITORING_METRICS.FRAMES_DROPPED, isSum: true, interval: true });
			// addValueInboundRTCStatsToMetrics({ key: 'framesLoss', metricsKey: 'FRAMES_LOSS', isSum: true });

			this.addValidatedMonitoringMetric({
				metricKey: MONITORING_METRICS.COUNT_VIDEO_TRACKS,
				metricValue: countVideoTracks,
			});

			this.addValidatedMonitoringMetric({
				metricKey: MONITORING_METRICS.COUNT_AUDIO_TRACKS,
				metricValue: countAudioTracks,
			});

			if (this.currentMonitoringEventsObject.metrics[MONITORING_METRICS.FRAMES_LOSS].length < this.countMetricsInMetricsInterval)
			{
				const currentFramesReceivedArray = this.currentMonitoringEventsObject.metrics[MONITORING_METRICS.FRAMES_RECEIVED];
				const currentFramesDroppedArray = this.currentMonitoringEventsObject.metrics[MONITORING_METRICS.FRAMES_DROPPED];
				const currentFramesReceived = currentFramesReceivedArray.slice(-1)[0];
				const currentFramesDropped = currentFramesDroppedArray.slice(-1)[0];
				const currentFramesLoss = !!currentFramesReceived ? currentFramesDropped / currentFramesReceived : 0;

				this.addValidatedMonitoringMetric({
					additionalData: {
						currentFramesReceivedArray,
						currentFramesDroppedArray,
						currentFramesReceived,
						currentFramesDropped,
						currentFramesLoss,
					},
					metricKey: MONITORING_METRICS.FRAMES_LOSS,
					metricValue: currentFramesLoss > 0 ? round(currentFramesLoss * 100, 0)  : 0,
				});
			}
			const bitrateSumIn = calcBitrateSumFromArray({ bitrateArray: totalBitrateIn });
			const formattedBitrateIn = Number.parseFloat((bitrateSumIn / 1000000).toFixed(2));

			if (this.currentMonitoringEventsObject.metrics[MONITORING_METRICS.BITRATE_IN].length < this.countMetricsInMetricsInterval)
			{
				this.addValidatedMonitoringMetric({
					additionalData: {
						bitrateList: totalBitrateIn,
						bitrateSumIn,
						formattedBitrateIn,
					},
					metricKey: MONITORING_METRICS.BITRATE_IN,
					metricValue: bitrateSumIn,
				});
			}

			if (this.currentMonitoringEventsObject.metrics[MONITORING_METRICS.PACKET_LOST_RECEIVE].length < this.countMetricsInMetricsInterval)
			{
				this.addValidatedMonitoringMetric({
					metricKey: MONITORING_METRICS.PACKET_LOST_RECEIVE,
					metricValue: currentPacketLostReceiveCount,
				});
			}

			if (currentPacketLostReceiveCount > this.#privateProperties.packetLostThreshold)
			{
				this.addMonitoringEvents({name: MONITORING_EVENTS_NAME_LIST.HIGH_PACKET_LOSS_RECEIVE, withCounter: true} )
			}
		});

		for (let userId in dataLoss)
		{
			if (!this.#privateProperties.stats[userId])
			{
				this.#privateProperties.stats[userId] = [];
			}

			if (this.#privateProperties.stats[userId].push(dataLoss[userId]) > 10)
			{
				this.#privateProperties.stats[userId].shift();
			}

			const connectionDataLoss = this.#privateProperties.stats[userId].reduce(
				(acc, number) => acc + number, 0
			) / this.#privateProperties.stats[userId].length;
			const connectionScore = Util.calcConnectionScore(connectionDataLoss);
			this.#setConnectionQuality(userId, connectionScore);
		}

		if (participantsWithLargeDataLoss.size || this.#privateProperties.prevParticipantsWithLargeDataLoss.size)
		{
			if (participantsWithLargeDataLoss.size)
			{
				this.setLog(`Have high packetsLost on users: ${[...participantsWithLargeDataLoss.values()]}`, LOG_LEVEL.WARNING);
			}
			this.#triggerEvents('UpdatePacketLoss', [[...participantsWithLargeDataLoss.keys()]]);
		}
		this.#privateProperties.prevParticipantsWithLargeDataLoss = participantsWithLargeDataLoss;

		return statsOutput;
	}

	#setConnectionQuality(userId, score)
	{
		const localParticipant = userId === this.#privateProperties.userId;
		const remoteParticipant = this.#privateProperties.remoteParticipants[userId];
		const hasGoodQuality = score > this.#privateProperties.minimalConnectionQuality;
		let needToSetScore;
		let prevScore;

		if (localParticipant)
		{
			prevScore = this.#privateProperties.localConnectionQuality;
			this.#privateProperties.localConnectionQuality = score;
			needToSetScore = (!this.#privateProperties.localTracks[MediaStreamsKinds.Camera]?.muted || !prevScore)
				&& !this.#privateProperties.localTracks[MediaStreamsKinds.Screen];
		}
		else if (remoteParticipant)
		{
			prevScore = remoteParticipant.connectionQuality;
			remoteParticipant.connectionQuality = score;
			needToSetScore = (!remoteParticipant.isMutedVideo || !prevScore) && !remoteParticipant.screenSharingEnabled;
		}

		if (needToSetScore)
		{
			if (prevScore !== score)
			{
				const logMessage = localParticipant
					? `Quality of connection with a media server changed to ${score}`
					: `Quality of connection with a participant with id ${userId} (sid: ${remoteParticipant.sid}) changed to ${score}`;
				const logLevel = hasGoodQuality ? LOG_LEVEL.INFO : LOG_LEVEL.WARNING;

				this.setLog(logMessage, logLevel);
			}

			// this.#toggleRemoteParticipantVideo([userId], hasGoodQuality);
			this.#triggerEvents('ConnectionQualityChanged', [{ [userId]: score }]);
		}
	}

	#onAddTrack(mediaServerId: number, signal: any, mediaStreamTrackId: string, mediaStreamKind: string): void
	{
		this.#addPendingPublication(mediaStreamTrackId, mediaStreamKind);
		this.#sendSignal({ addTrack: signal }, mediaServerId);
	}

	#onTrack(event)
	{
		const ids = event.streams[0].id.split('|');
		const trackId = ids[1];
		const userId = this.#privateProperties.tracksDataFromSocket[trackId]?.userId;

		if (this.#privateProperties.remoteParticipants[userId] && this.#privateProperties.tracksDataFromSocket[trackId])
		{
			this.#createRemoteTrack(trackId, event);
		}
		else
		{
			this.setLog(`Got a track with kind ${event.track.kind} (sid: ${trackId}) without a participant, saving it`, LOG_LEVEL.WARNING);
			this.#privateProperties.ontrackData[trackId] = event;
		}
	};

	#resetPingTimeout(mediaServerId)
	{
		this.#clearPingTimeout(mediaServerId);

		if (!this.#privateProperties.pingTimeoutDuration)
		{
			return;
		}

		if (mediaServerId && this.#privateProperties.awaitedPings.size)
		{
			return;
		}

		this.#privateProperties.pingTimeout = setTimeout(() =>
		{
			this.setLog(`Ping signal was not received from ${[...this.#privateProperties.awaitedPings]}, reconnecting`, LOG_LEVEL.WARNING);
			this.#beforeDisconnect();
			this.#privateProperties.lastReconnectionReason = ReconnectionReason.PingPongMissed;
			this.#reconnect({
				reconnectionReason: 'PING_SIGNAL_NOT_RECEIVED',
				reconnectionReasonInfo: ``,
			});
		}, this.#privateProperties.pingTimeoutDuration);
	};

	#clearPingTimeout(mediaServerId)
	{
		if (mediaServerId)
		{
			this.#privateProperties.awaitedPings.delete(mediaServerId);
			if (this.#privateProperties.awaitedPings.size)
			{
				return;
			}

			clearTimeout(this.#privateProperties.pingTimeout);
		}
		else
		{
			this.#privateProperties.awaitedPings = new Set();
			clearTimeout(this.#privateProperties.pingTimeout);
		}
	}

	#startPingInterval(mediaServerId)
	{
		this.#clearPingInterval(mediaServerId);
		this.#resetPingTimeout(mediaServerId);
		if (!this.#privateProperties.pingIntervalDuration)
		{
			return;
		}
		this.#privateProperties.pingPongIntervals[mediaServerId] = setInterval(() =>
		{
			this.#sendPing(mediaServerId);
		}, this.#privateProperties.pingIntervalDuration);
	}

	#clearPingInterval(mediaServerId)
	{
		this.#clearPingTimeout(mediaServerId);
		if (mediaServerId)
		{
			if (this.#privateProperties.pingPongIntervals[mediaServerId])
			{
				clearInterval(this.#privateProperties.pingPongIntervals[mediaServerId]);
				delete this.#privateProperties.pingPongIntervals[mediaServerId];
			}
		}
		else
		{
			for (let mediaServerId in this.#privateProperties.pingPongIntervals)
			{
				this.#clearPingInterval(mediaServerId);
			}
		}
	}

	#sendPing(mediaServerId)
	{
		this.#privateProperties.awaitedPings.add(mediaServerId);
		this.#sendSignal({
			pingReq: {
				timestamp: Date.now(),
				rtt: this.#privateProperties.rtt[mediaServerId] || 0,
			}
		}, mediaServerId);
	}

	on(eventType, handler)
	{
		this.#privateProperties.events.set(eventType, handler)
		return this;
	}

	off(eventType)
	{
		if (this.#privateProperties.events.has(eventType))
		{
			return this.#privateProperties.events.delete(eventType)
		}
		return this;
	}

	#triggerEvents(eventType, args)
	{
		if (this.#privateProperties.events.has(eventType))
		{
			const event = this.#privateProperties.events.get(eventType)
			if (args)
			{
				event(...args);
			}
			else
			{
				event();
			}
		}
	}

	isRecordable()
	{
		// console.log('isRecordable')
	}

	#needSubscribeToTrack(track, participant, processAudio)
	{
		// for the simplicity of logic we will immediately subscribe to all screen share streams
		return (track.source === MediaStreamsKinds.Microphone && processAudio && !participant.isMutedAudio)
			|| track.source === MediaStreamsKinds.Screen
			|| (track.source === MediaStreamsKinds.Camera && ((!participant.isLocalVideoMute && !participant.isMutedVideo) || this.#privateProperties.participantsToUpdateTrackAvailability[participant.userId]));
	}

	#onTrackPublishResult(trackId: string, source: number, calledFrom: string): void
	{
		if (source === MediaStreamsKinds.Microphone)
		{
			if (this.#privateProperties.needToDisableAudioAfterPublish)
			{
				this.#privateProperties.needToDisableAudioAfterPublish = false;
				this.disableAudio({ calledFrom });
			}
			else
			{
				this.unpauseTrack(MediaStreamsKinds.Microphone);
			}
		}
		else if (source === MediaStreamsKinds.Camera && this.#privateProperties.videoQueue)
		{
			this.#processVideoQueue();
		}

		if (source === MediaStreamsKinds.Camera || source === MediaStreamsKinds.Screen)
		{
			this.#changeLayersAvailability(trackId);
		}
	}

	#addPendingPublication(trackId: string, source: number): void
	{
		this.#privateProperties.pendingPublications[trackId] = setTimeout(() => {
			delete this.#privateProperties.pendingPublications[trackId];

			if (source === MediaStreamsKinds.Camera && this.#privateProperties.videoQueue)
			{
				this.#onTrackPublishResult(trackId, source, '#addPendingPublication');
			}

			this.onPublishFailed(source);
		}, this.#privateProperties.publicationTimeout);
	}

	#addPendingSubscription(participant, track, tries)
	{
		clearTimeout(this.#privateProperties.pendingSubscriptions[participant.userId]?.[track.sid]?.timeout);
		if (!this.#privateProperties.pendingSubscriptions[participant.userId])
		{
			this.#privateProperties.pendingSubscriptions[participant.userId] = {};
		}

		if (tries === undefined)
		{
			tries = this.#privateProperties.subscriptionTries;
		}

		const timeout = setTimeout(() => {
			this.setLog(`Track ${track.sid} with kind ${track.source} for a participant with id ${participant.userId} (sid: ${participant.sid}) was not received, trying to subscribe to it`, LOG_LEVEL.WARNING);
			checkMetricsFeatureAndExecutionCallback(() => {
				this.addMonitoringEvents({
					name: MONITORING_EVENTS_NAME_LIST.TRACK_SUBSCRIPTION_DELAY,
					withCounter: true,
				});
			});

			if (tries > 0)
			{
				this.#addPendingSubscription(participant, track, tries - 1)
				this.#changeSubscriptionToTrack(track.sid, participant.sid, true, participant.mediaServerId);
			}
			else
			{
				this.setLog(`Subscription to track ${track.sid} with kind ${track.source} for a participant with id ${participant.userId} (sid: ${participant.sid}) failed`, LOG_LEVEL.ERROR);
				checkMetricsFeatureAndExecutionCallback(() => {
					this.addMonitoringEvents({
						name: MONITORING_EVENTS_NAME_LIST.TRACK_SUBSCRIPTION_FAILED,
						withCounter: true,
					});
				});

				if (!participant.hasFailedSubscription(track.source))
				{
					const data = {
						eventName: 'SubscriptionFailed',
						trackSource: track.source,
						trackId: track.id,
						userId: participant.userId,
					};

					this.sendMessage(JSON.stringify(data));
				}

				this.#triggerEvents('TrackSubscriptionFailed', [{participant: participant, track: track}]);
			}
		}, this.#privateProperties.subscriptionTimeout);

		this.#privateProperties.pendingSubscriptions[participant.userId][track.sid] = {
			timeout,
			tries,
		};
	}

	#clearPendingSubscriptions(participantId: number): void
	{
		const pendingSubscriptions = this.#privateProperties.pendingSubscriptions[participantId];
		if (!pendingSubscriptions)
		{
			return;
		}

		Object.values(pendingSubscriptions).forEach(subscription => {
			clearTimeout(subscription.timeout);
		});

		delete this.#privateProperties.pendingSubscriptions[participantId];
	}

	async publishTrack(mediaStreamKind, mediaStreamTrack, streamQualityOptions = {})
	{
		const mediaServer: MediaServer = this.#getPublishingMediaServer();
		if (mediaServer)
		{
			mediaServer.addTrack(mediaStreamKind, mediaStreamTrack, streamQualityOptions)
				.then((publicationResult) => {
					if (publicationResult)
					{
						this.#triggerEvents('PublishSucceed', [mediaStreamKind]);
					}
				})
				.catch((error) => {
					this.setLog(`Publishing a track with kind ${mediaStreamKind} failed: ${error}`, LOG_LEVEL.ERROR);
					clearTimeout(this.#privateProperties.pendingPublications[mediaStreamTrack.id]);
					this.#releaseStream(mediaStreamKind);
					this.#triggerEvents('PublishFailed', [mediaStreamKind]);
				});
		}
		else
		{
			this.setLog(`Media server for publishing not found`, LOG_LEVEL.ERROR);
		}
	}

	async changeStreamQuality(streamQualityOptions)
	{
		const mediaServer = this.#getPublishingMediaServer();

		for (let key in streamQualityOptions)
		{
			if (this.#privateProperties[`${key}`] !== streamQualityOptions[key])
			{
				this.#privateProperties[`${key}`] = streamQualityOptions[key]

				if (key === 'videoSimulcast' || (key === 'screenSimulcast' && this.#privateProperties.screenStream))
				{
					let kind;
					let trackPublished;
					if (key === 'videoSimulcast')
					{
						kind = MediaStreamsKinds.Camera;
						trackPublished = this.isVideoPublished();
					}
					else if (key === 'screenSimulcast')
					{
						kind = MediaStreamsKinds.Screen;
						trackPublished = this.isScreenSharePublished();
					}

					if (mediaServer && trackPublished)
					{
						this.setLog('Add sender transceiver - direction: sendonly', LOG_LEVEL.INFO);
						await this.republishTrack(kind);
					}
				}
				else if ( ['videoBitrate', 'audioBitrate', 'screenBitrate'].includes(key))
				{
					const kind = key === 'videoBitrate'
						? MediaStreamsKinds.Camera
						: key === 'screenBitrate'
							? MediaStreamsKinds.Screen
							: MediaStreamsKinds.Microphone;

					if (mediaServer)
					{
						await mediaServer.setBitrate(streamQualityOptions[key], kind);
					}
				}
			}
			else if (source === MediaStreamsKinds.ScreenAudio)
			{
				this.sender.addTransceiver(MediaStreamTrack, {
					direction: 'sendonly'
				});
				this.sender.addTransceiver(MediaStreamTrack, {
					direction: 'sendonly'
				});

				this.#addPendingPublication(MediaStreamTrack.id, source);

				this.#sendSignal({
					"addTrack":  {
						"cid" : MediaStreamTrack.id,
						"source":  source
					}
				});
			}
		}
	}

	async republishTrack(mediaStreamKind)
	{
		const { tries, isActive } = this.#privateProperties.republication[mediaStreamKind];
		if (tries >= this.#privateProperties.republicationTries || isActive)
		{
			return;
		}

		this.#updateRepublicationState(mediaStreamKind, true);
		this.setLog(`Start republishing a track with kind ${mediaStreamKind}`, LOG_LEVEL.INFO);
		await this.unpublishTrack(mediaStreamKind);
		const track = await this.getTrack(mediaStreamKind);
		if (track)
		{
			await this.publishTrack(mediaStreamKind, track, this.#getStreamQualityOptions(mediaStreamKind));
		}
		else
		{
			this.setLog(`Republishing a track with kind ${mediaStreamKind} failed: track not found`, LOG_LEVEL.ERROR);
			this.#updateRepublicationState(mediaStreamKind);
			this.#releaseStream(mediaStreamKind);
			this.onPublishFailed(mediaStreamKind);
		}
	}

	#updateRepublicationState(mediaStreamKind, addTry): void
	{
		if (addTry)
		{
			this.#privateProperties.republication[mediaStreamKind].tries++
			this.#privateProperties.republication[mediaStreamKind].isActive = true;

			return;
		}

		this.#privateProperties.republication[mediaStreamKind].tries = 0;
		this.#privateProperties.republication[mediaStreamKind].isActive = false;
	}

	async unpublishTrack(mediaStreamKind)
	{
		this.setLog(`Start unpublishing a track with kind ${mediaStreamKind}`, LOG_LEVEL.INFO);

		const mediaServer = this.#getPublishingMediaServer();
		if (mediaServer)
		{
			mediaServer.removeTrack(mediaStreamKind);
		}
		else
		{
			this.setLog(`Media server for publishing not found`, LOG_LEVEL.ERROR);
		}
	}

	toggleRemoteParticipantVideo(participants, showVideo, isPaginateToggle = false)
	{
		this.#toggleRemoteParticipantVideo(participants, showVideo, isPaginateToggle);
	}

	#changeTrackActivity(trackSid: string, isActive: boolean): void
	{
		const localTracks: any[] = Object.values(this.#privateProperties.localTracks);
		let mediaStreamKind: ?number = null;

		for (const track of localTracks)
		{
			if (track.sid === trackSid)
			{
				mediaStreamKind = track.source;
				break;
			}
		}

		if (!mediaStreamKind)
		{
			return;
		}

		const mediaServer = this.#getPublishingMediaServer();
		mediaServer?.changeTrackActivity(mediaStreamKind, isActive);
	}

	#changeLayersAvailability(trackSid: string, subscribedQualities?: Array<SubscribedQuality>): Promise<void>
	{
		const mediaServer = this.#getPublishingMediaServer();
		if (!mediaServer)
		{
			return;
		}

		const localTrack = this.#getLocalTrackBySid(trackSid);
		if (!localTrack)
		{
			return;
		}

		const isVideoTrack = [MediaStreamsKinds.Camera, MediaStreamsKinds.Screen].includes(localTrack.source);
		if (!isVideoTrack)
		{
			return;
		}

		const track: MediaStreamTrack | undefined = localTrack.source === MediaStreamsKinds.Camera
			? this.#privateProperties.cameraStream?.getVideoTracks()?.[0]
			: this.#privateProperties.screenStream?.getVideoTracks()?.[0];
		if (!track)
		{
			return;
		}

		const layers: LayersAvailability = this.#getLayersInUse(subscribedQualities);
		mediaServer.changeLayersAvailability(layers, track);
	}

	#getLayersInUse(subscribedQualities: Array<SubscribedQuality> = []): LayersAvailability
	{
		const qualityToRid = { HIGH: 'f', MEDIUM: 'h', LOW: 'q' };
		const layersInUse: LayersAvailability = { f: false, h: false, q: false };

		if (subscribedQualities?.length === 0)
		{
			return layersInUse;
		}

		for (const layer of subscribedQualities)
		{
			const rid = qualityToRid[layer?.quality] || 'q';
			layersInUse[rid] = Boolean(layer?.enabled);
		}

		return layersInUse;
	}

	#getStreamQualityOptions(mediaStreamKind)
	{
		let options = {};
		switch (mediaStreamKind)
		{
			case MediaStreamsKinds.Camera:
				const bitrate = this.#privateProperties.videoSimulcast
					? this.#privateProperties.defaultSimulcastBitrate
					: this.#privateProperties.videoBitrate;
				options = {
					videoSimulcast: this.#privateProperties.videoSimulcast,
					videoBitrate: bitrate,
				};
				break;
			case MediaStreamsKinds.Microphone:
				options = {
					audioBitrate: this.#privateProperties.audioBitrate,
				};
				break;
			case MediaStreamsKinds.Screen:
				options = {
					screenSimulcast: this.#privateProperties.screenSimulcast,
					screenBitrate: this.#privateProperties.screenBitrate,
				};
				break;
		}
		return options;
	};

	#changeSubscriptionToTrack(trackId, participantId, subscribe, mediaServerId)
	{
		this.#sendSignal({
			subscription: {
				trackSids: [trackId],
				subscribe,
				participantTracks: [
					{
						participantSid: participantId,
						trackSids: [trackId],
					},
				],
			}
		}, mediaServerId);
	}

	#pauseRemoteTrack(userId, trackId, trackSource, pause)
	{
		const participant = this.#privateProperties.remoteParticipants[userId];
		if (!participant)
		{
			this.setLog(`Trying to pause a track with kind ${trackSource} (sid: ${trackId}) for a non-existent participant with id ${userId}`, LOG_LEVEL.WARNING);
			return;
		}

		participant.videoPaused = pause;
		this.#sendSignal({
			trackSetting: {
				trackSids: [trackId],
				disabled: pause,
				quality: this.#calculateVideoQualityForUser(userId, trackSource),
			}
		}, participant.mediaServerId);
	}

	#calculateVideoQualityForUser(userId, source): Number
	{
		const participant = this.#privateProperties.remoteParticipants[userId];
		const exactUser = this.#privateProperties.mainStream.userId == userId;
		const exactTrack = this.#privateProperties.mainStream.kind === source;

		let quality = this.#privateProperties.defaultRemoteStreamsQuality;
		if (exactUser && (exactTrack || !participant.screenSharingEnabled))
		{
			quality = STREAM_QUALITY.HIGH;
		}
		else if (!this.#privateProperties.mainStream.userId && participant.videoWidth)
		{
			quality = STREAM_QUALITY.LOW;

			if (participant.videoWidth >= (640 * 1.5))
			{
				quality = STREAM_QUALITY.HIGH;
			}
			else if (participant.videoWidth >= (320 * 1.5))
			{
				quality = STREAM_QUALITY.MEDIUM;
			}
		}

		return quality;
	}

	#changeRoomStreamsQuality(users, kind)
	{
		this.setLog(`Changing quality of streams; main stream: ${users.userId}, other users: ${users.otherUsers}`, LOG_LEVEL.INFO);

		const mainStreamUserId = users.userId;

		if (mainStreamUserId)
		{
			const participant = this.#privateProperties.remoteParticipants[users.userId];
			if (participant)
			{
				const quality = kind === MediaStreamsKinds.Camera
					? STREAM_QUALITY.HIGH
					: this.#privateProperties.defaultRemoteStreamsQuality;
				this.#privateProperties.mainStream = { userId: users.userId, kind };
				this.#setStreamQualityFoParticipant(participant, quality);
			}
		}
		else
		{
			this.#privateProperties.mainStream = {};
		}

		users.otherUsers?.forEach((userId) => {
			const participant = this.#privateProperties.remoteParticipants[userId];
			if (participant && (!mainStreamUserId || mainStreamUserId != userId))
			{
				const quality = this.#calculateVideoQualityForUser(userId, MediaStreamsKinds.Camera);
				this.#setStreamQualityFoParticipant(participant, quality);
			}
		});
	}

	#setStreamQualityFoParticipant(participant, quality)
	{
		if (!participant.setStreamQuality(quality))
		{
			return;
		}

		if (this.#privateProperties.useLayersAccurateControl)
		{
			this.#sendSignal({
				requestLayers: {
					targetUserId: participant.userId,
					layers: {
						q: quality === STREAM_QUALITY.LOW,
						h: quality === STREAM_QUALITY.MEDIUM,
						f: quality === STREAM_QUALITY.HIGH,
					},
				},
			});
		}

		this.#sendSignal({
			trackSetting: {
				quality,
				trackSids: [participant.getTrack(MediaStreamsKinds.Camera).id],
			},
		}, participant.mediaServerId);
	}

	#toggleRemoteParticipantVideo(participants, showVideo, isPaginateToggle = false)
	{
		participants.forEach((participant) => {
			const participantId = participant.userId;
			const remoteParticipant = this.#privateProperties.remoteParticipants[participantId];
			const cameraTrack = remoteParticipant?.tracks?.[MediaStreamsKinds.Camera];
			const trackSubscribed = cameraTrack?.subscribed === true;
			const needChangeLocalVideoMute = remoteParticipant?.isLocalVideoMute === showVideo;

			remoteParticipant?.setVideoWidth(participant.videoWidth);

			if (
				trackSubscribed
				&& showVideo
				&& !remoteParticipant.isLocalVideoMute
				&& !remoteParticipant.isMutedVideo
			)
			{
				const quality = this.#calculateVideoQualityForUser(participantId, MediaStreamsKinds.Camera);
				this.#setStreamQualityFoParticipant(remoteParticipant, quality);
			}
			else if (trackSubscribed && needChangeLocalVideoMute)
			{
				remoteParticipant.isLocalVideoMute = !showVideo;

				if (remoteParticipant.isMutedVideo)
				{
					return;
				}

				this.#pauseRemoteTrack(
					remoteParticipant.userId,
					remoteParticipant.tracks[MediaStreamsKinds.Camera].id,
					remoteParticipant.tracks[MediaStreamsKinds.Camera].source,
					remoteParticipant.isLocalVideoMute,
				);
			}
			else if (
				remoteParticipant
				&& cameraTrack
				&& !trackSubscribed
				&& showVideo
			)
			{
				remoteParticipant.isLocalVideoMute = !showVideo;

				if (remoteParticipant.isMutedVideo)
				{
					return;
				}

				this.#changeSubscriptionToTrack(
					remoteParticipant.tracks[MediaStreamsKinds.Camera].id,
					remoteParticipant.sid,
					!remoteParticipant.isLocalVideoMute,
					remoteParticipant.mediaServerId,
				);
			}
			else if (remoteParticipant && needChangeLocalVideoMute)
			{
				remoteParticipant.isLocalVideoMute = !showVideo;
			}
			else if (!remoteParticipant || !remoteParticipant.tracks[MediaStreamsKinds.Camera])
			{
				this.#privateProperties.participantsToUpdateTrackAvailability[participantId] = showVideo;
			}
		});

		if (!isPaginateToggle)
		{
			this.#triggerEvents('ToggleRemoteParticipantVideo', [showVideo]);
		}
	}

	hangup(closeRoom = false)
	{
		if (this.#privateProperties.callState === CALL_STATE.TERMINATED)
		{
			return;
		}

		this.#privateProperties.abortController.signal.removeEventListener('abort', this.beforeDisconnectBound);
		this.#privateProperties.abortController.abort();

		this.#privateProperties.callState = CALL_STATE.TERMINATED;

		this.setLog(`Disconnecting from the call`, LOG_LEVEL.INFO);
		if (closeRoom)
		{
			this.#sendSignal({
				closeRoom: {
					timestamp: Math.floor(Date.now() / 1000)
				}
			});
		}
		else
		{
			this.#sendLeave();
		}
		this.#beforeDisconnect({
			initiatedByUser: true,
			destroySocket: true,
		});
		for (let mediaServer of this.#privateProperties.mediaServers.values())
		{
			this.#removeMediaServerEvents(mediaServer);
			mediaServer.disconnect();
		}
		this.#privateProperties.mediaServers.clear();

		clearTimeout(this.#privateProperties.reconnectionTimeout);

		for (let trackId in this.#privateProperties.pendingPublications)
		{
			clearTimeout(this.#privateProperties.pendingPublications[trackId]);
		}
		this.#privateProperties.pendingPublications = {};

		for (let userId in this.#privateProperties.pendingSubscriptions)
		{
			for (let trackId in this.#privateProperties.pendingSubscriptions[userId])
			{
				clearTimeout(this.#privateProperties.pendingSubscriptions[userId][trackId].timeout);
			}
		}
		this.#privateProperties.pendingSubscriptions = {};

		this.#privateProperties.url = null;
		this.#privateProperties.endpoint = null;
		this.#privateProperties.jwt = null;
		this.#privateProperties.options = null;
		this.#privateProperties.lastReconnectionReason = null;

		this.#releaseStream(MediaStreamsKinds.Camera);
		this.#releaseStream(MediaStreamsKinds.Microphone);
		this.#releaseStream(MediaStreamsKinds.Screen);
		this.#releaseStream(MediaStreamsKinds.ScreenAudio);

		this.#privateProperties.rtt = {};
		this.#privateProperties.isReconnecting = false;
		this.#privateProperties.reconnectionAttempt = 0;
		this.#privateProperties.mainStream = {};

		this.#triggerEvents('Disconnected');
	}

	isConnected()
	{
		return this.#privateProperties.callState === CALL_STATE.CONNECTED
	}

	setVideoStreamSetupErrorList(userId, kind)
	{
		const errorInVideoStreamSetupErrorList = this.#privateProperties.videoStreamSetupErrorList[userId];
		const kindInListKinds = !!errorInVideoStreamSetupErrorList && errorInVideoStreamSetupErrorList.includes(kind);
		const kindsArray = errorInVideoStreamSetupErrorList || [];

		if (!kindInListKinds)
		{
			this.#privateProperties.videoStreamSetupErrorList[userId] = [kind, ...kindsArray];
		}
	}

	setMainStream(users, kind)
	{
		// userId always exists, check in bitrix_call
		const participant = this.#privateProperties.remoteParticipants[users.userId];
		if (!participant)
		{
			this.setVideoStreamSetupErrorList(users.userId, kind);
			this.setLog(`Setting main stream error (No remoteParticipant with ID - ${users.userId} in list)`, LOG_LEVEL.ERROR);

			return;
		}

		this.#changeRoomStreamsQuality(users, kind);
	}

	setVideoQualityForStreams(params)
	{
		this.#privateProperties.defaultRemoteStreamsQuality = params.videoQuality;

		this.#changeRoomStreamsQuality(params);

		if (this.#privateProperties.defaultRemoteStreamsQuality === STREAM_QUALITY.NO_VIDEO)
		{
			this.disableVideo({calledFrom: 'setVideoQuality'});
			Hardware.maxLocalStreamQualityHeight = LOCAL_STREAM_QUALITY_HEIGHT.NO_VIDEO;
			return;
		}

		if (params.isCameraWasEnabledBeforeQualityChanged && this.#privateProperties.defaultRemoteStreamsQuality !== STREAM_QUALITY.NO_VIDEO)
		{
			this.#triggerEvents('TurnOnCamera');
		}

		switch (this.#privateProperties.defaultRemoteStreamsQuality)
		{
			case STREAM_QUALITY.HIGH:
				Hardware.maxLocalStreamQualityHeight = LOCAL_STREAM_QUALITY_HEIGHT.HIGH;
				break;
			case STREAM_QUALITY.MEDIUM:
				Hardware.maxLocalStreamQualityHeight = LOCAL_STREAM_QUALITY_HEIGHT.MEDIUM;
				break;
			case STREAM_QUALITY.LOW:
				Hardware.maxLocalStreamQualityHeight = LOCAL_STREAM_QUALITY_HEIGHT.LOW;
				break;
		}

		const mediaServer = this.#getPublishingMediaServer();
		mediaServer?.updateVideoEncodings();
	}

	resetMainStream(users) {
		this.setLog(`Resetting main stream`, LOG_LEVEL.INFO);
		this.#changeRoomStreamsQuality(users)
	}

	removeTrack(mediaStreamKind) {
		const trackSid = this.#privateProperties.localTracks[mediaStreamKind]?.sid
		if (trackSid)
		{
			this.setLog(`Sending removeTrack signal for a track with kind ${mediaStreamKind} (sid: ${trackSid})`, LOG_LEVEL.INFO);
			delete this.#privateProperties.localTracks[mediaStreamKind];
			this.#sendSignal({
				removeTrack: {
					sid: trackSid
				}
			});
		}
		else
		{
			this.setLog(`Sending removeTrack signal for a non-existent track with kind ${mediaStreamKind}`, LOG_LEVEL.WARNING);
		}
	}

	pauseTrack(mediaStreamKind, keepTrack) {
		const trackSid = this.#privateProperties.localTracks[mediaStreamKind]?.sid;
		if (trackSid)
		{
			this.setLog(`Sending pause signal (keep: ${keepTrack}) for a track with kind ${mediaStreamKind} (sid: ${trackSid})`, LOG_LEVEL.INFO);
			if (!keepTrack)
			{
				delete this.#privateProperties.localTracks[mediaStreamKind];
			}
			this.#sendSignal({
				mute: {
					sid: trackSid,
					muted: true
				}
			});
		}
		else
		{
			this.setLog(`Sending pause signal for a non-existent track with kind ${mediaStreamKind}`, LOG_LEVEL.WARNING);
		}
	}

	unpauseTrack(mediaStreamKind) {
		const trackSid = this.#privateProperties.localTracks[mediaStreamKind]?.sid;
		if (trackSid)
		{
			this.setLog(`Sending unpause signal for a track with kind ${mediaStreamKind} (sid: ${trackSid})`, LOG_LEVEL.INFO);
			this.#sendSignal({
				mute: {
					sid: trackSid,
					muted: false
				}
			});
		}
		else
		{
			this.setLog(`Sending unpause signal for a non-existent track with kind ${mediaStreamKind}`, LOG_LEVEL.WARNING);
		}
	}

	disableAudio(options) {
		const bySystem = options?.bySystem || false;
		const calledFrom = options?.calledFrom || '';

		this.#updateRepublicationState(MediaStreamsKinds.Microphone);

		if (this.#privateProperties.mediaMutedBySystem)
		{
			return;
		}

		this.setLog(`Start disabling audio - calledFrom: ${calledFrom}, isReconnecting: ${this.#privateProperties.isReconnecting}, bySystem: ${bySystem}`);
		const track = this.#privateProperties.microphoneStream?.getAudioTracks()[0];
		if (track)
		{
			this.#privateProperties.needToEnableAudioAfterSystemMuted = bySystem ? track.enabled : false;
			track.enabled = false;
			if (this.#privateProperties.localTracks[MediaStreamsKinds.Microphone])
			{
				this.#privateProperties.localTracks[MediaStreamsKinds.Microphone].muted = true;
			}
			this.pauseTrack(MediaStreamsKinds.Microphone, true);
		}
		else
		{
			this.setLog('Disabling audio failed: has no track', LOG_LEVEL.ERROR);
		}
	}

	async enableAudio(options)
	{
		const disabled = options?.disabled || false;
		const calledFrom = options?.calledFrom || '';

		if (!Util.havePermissionToBroadcast('mic'))
		{
			return;
		}

		this.setLog(`Start enabling audio - calledFrom: ${calledFrom}, isReconnecting: ${this.#privateProperties.isReconnecting}, disabled: ${disabled}`);

		this.#privateProperties.needToEnableAudioAfterSystemMuted = false;
		if (this.#privateProperties.switchActiveAudioDeviceInProgress)
		{
			try
			{
				await this.#privateProperties.switchActiveAudioDeviceInProgress;
			}
			catch (e)
			{
				this.onPublishFailed(MediaStreamsKinds.Microphone);
			}
		}
		let track = this.#privateProperties.microphoneStream?.getAudioTracks()[0];
		const needToGetNewTrack = !track
			|| track.readyState !== 'live'
			|| isNoiseSuppressionInputTrackOff();

		if (needToGetNewTrack)
		{
			track = await this.getLocalAudio();
		}

		if (!track)
		{
			this.setLog('Enabling audio failed: has no track', LOG_LEVEL.ERROR);
			this.#releaseStream(MediaStreamsKinds.Microphone);
			this.onPublishFailed(MediaStreamsKinds.Microphone);

			return;
		}

		if (this.#privateProperties.localTracks[MediaStreamsKinds.Microphone])
		{
			this.setLog('Enabling audio via unpause signal', LOG_LEVEL.INFO);
			track.enabled = true;
			this.#privateProperties.localTracks[MediaStreamsKinds.Microphone].muted = false;
			await this.publishTrack(MediaStreamsKinds.Microphone, track, this.#getStreamQualityOptions(MediaStreamsKinds.Microphone));
			this.unpauseTrack(MediaStreamsKinds.Microphone);
		}
		else
		{
			this.setLog('Enabling audio via publish', LOG_LEVEL.INFO);
			track.enabled = !disabled;
			if (disabled)
			{
				this.#privateProperties.needToDisableAudioAfterPublish = true;
			}

			if (this.#privateProperties.localTracks[MediaStreamsKinds.Microphone])
			{
				this.#privateProperties.localTracks[MediaStreamsKinds.Microphone].muted = false;
			}

			await this.publishTrack(MediaStreamsKinds.Microphone, track, this.#getStreamQualityOptions(MediaStreamsKinds.Microphone));
		}
	}

	async disableVideo(options)
	{
		const bySystem = options?.bySystem || false;
		const calledFrom = options?.calledFrom || '';
		const hasQueue = this.#privateProperties.videoQueue !== VIDEO_QUEUE.INITIAL;

		this.#updateRepublicationState(MediaStreamsKinds.Camera);

		this.setLog(`Start disabling video - calledFrom: ${calledFrom}, isReconnecting: ${this.#privateProperties.isReconnecting}, bySystem: ${bySystem}, mediaMutedBySystem: ${this.#privateProperties.mediaMutedBySystem}, hasQueue: ${hasQueue}, videoQueue: ${this.#privateProperties.videoQueue} `, LOG_LEVEL.INFO);
		if (this.#privateProperties.isReconnecting)
		{
			return;
		}

		this.#privateProperties.videoQueue = VIDEO_QUEUE.DISABLE;

		if (hasQueue)
		{
			return;
		}

		const track = this.#privateProperties.cameraStream?.getVideoTracks()[0];
		const trackInfo = this.#privateProperties.localTracks[MediaStreamsKinds.Camera];

		if (track || trackInfo)
		{
			const stopTrack = () => {
				this.#privateProperties.videoQueue = VIDEO_QUEUE.INITIAL;

				this.setLog(`Video disabling stops track - bySystem: ${bySystem}, mediaMutedBySystem: ${this.#privateProperties.mediaMutedBySystem}`);
				track?.stop();
				if (this.#privateProperties.needToStopStreams)
				{
					CallStreamManager.stopStream(MediaStreamsKinds.Camera);
				}
				checkMetricsFeatureAndExecutionCallback(() => {
					this.addMonitoringEvents({
						name: MONITORING_EVENTS_NAME_LIST.USER_CAMERA_DISABLED,
						withCounter: true,
					});
				});

				this.onPublishFailed(MediaStreamsKinds.Camera);
			};

			if (this.#privateProperties.mediaMutedBySystem)
			{
				this.#privateProperties.mediaMutedBySystem = false;
				stopTrack();
				this.#triggerEvents('MediaMutedBySystem', [false]);

				return;
			}

			this.setLog(`Video disabling pauses track - bySystem: ${bySystem}, mediaMutedBySystem: ${this.#privateProperties.mediaMutedBySystem}`);
			if (trackInfo)
			{
				trackInfo.muted = true;
				this.pauseTrack(MediaStreamsKinds.Camera, true);
			}


			if (!bySystem)
			{
				stopTrack();
			}
		}
		else
		{
			this.setLog(`Disabling video failed - track: ${Boolean(track)}, localTracks: ${Boolean(trackInfo)}`, LOG_LEVEL.ERROR);
			this.#privateProperties.videoQueue = VIDEO_QUEUE.INITIAL;
		}
	}

	async enableVideo(options) /* {calledFrom: 'processVideoQueue', skipUnpause: true} */
	{
		const skipUnpause = options?.skipUnpause || false;
		const calledFrom = options?.calledFrom || '';
		const hasQueue = this.#privateProperties.videoQueue !== VIDEO_QUEUE.INITIAL;

		this.setLog(`Start enabling video - calledFrom: ${calledFrom}, isReconnecting: ${this.#privateProperties.isReconnecting}, skipUnpause: ${skipUnpause}, mediaMutedBySystem: ${this.#privateProperties.mediaMutedBySystem}, hasQueue: ${hasQueue}, videoQueue: ${this.#privateProperties.videoQueue} `, LOG_LEVEL.INFO);
		//console.warn(`Start enabling video - calledFrom: ${calledFrom}, isReconnecting: ${this.#privateProperties.isReconnecting}, skipUnpause: ${skipUnpause}, mediaMutedBySystem: ${this.#privateProperties.mediaMutedBySystem}, hasQueue: ${hasQueue}, videoQueue: ${this.#privateProperties.videoQueue} `, LOG_LEVEL.INFO);

		if (this.#privateProperties.isReconnecting)
		{
			return;
		}

		if (!Util.havePermissionToBroadcast('cam'))
		{
			return;
		}

		this.#privateProperties.videoQueue = VIDEO_QUEUE.ENABLE;
		if (hasQueue)
		{
			return;
		}
		if (this.#privateProperties.switchActiveVideoDeviceInProgress)
		{
			try
			{
				await this.#privateProperties.switchActiveVideoDeviceInProgress;
			}
			catch (e)
			{
				this.onPublishFailed(MediaStreamsKinds.Camera);
			}
		}

		let hasTrack = this.#privateProperties.localTracks[MediaStreamsKinds.Camera];
		let track = await this.getLocalVideo();

		if (track && hasTrack)
		{
			if (this.#privateProperties.mediaMutedBySystem)
			{
				this.#privateProperties.mediaMutedBySystem = false;
				this.#triggerEvents('MediaMutedBySystem', [false]);
			}
			if (skipUnpause)
			{
				this.setLog('Re-enabling video after automatic camera change', LOG_LEVEL.INFO);
			}
			else
			{
				this.setLog('Enabling video via unpause signal', LOG_LEVEL.INFO);
			}
			this.#privateProperties.localTracks[MediaStreamsKinds.Camera].muted = false;
			await this.publishTrack(MediaStreamsKinds.Camera, track, this.#getStreamQualityOptions(MediaStreamsKinds.Camera));
			if (skipUnpause)
			{
				this.#privateProperties.videoQueue = VIDEO_QUEUE.INITIAL;
			}
			else
			{
				this.unpauseTrack(MediaStreamsKinds.Camera);
			}
		}
		else if (track)
		{
			this.setLog('Enabling video via publish', LOG_LEVEL.INFO);
			await this.publishTrack(MediaStreamsKinds.Camera, track, this.#getStreamQualityOptions(MediaStreamsKinds.Camera));
		}
		else
		{
			this.setLog('Enabling video failed: has no track', LOG_LEVEL.ERROR);
			this.#privateProperties.videoQueue = VIDEO_QUEUE.INITIAL;
			this.#releaseStream(MediaStreamsKinds.Camera);
			this.#triggerEvents('PublishFailed', [MediaStreamsKinds.Camera]);
		}
	}

	#processVideoQueue()
	{
		const videoQueue = this.#privateProperties.videoQueue;
		this.#privateProperties.videoQueue = VIDEO_QUEUE.INITIAL;
		if (videoQueue === VIDEO_QUEUE.ENABLE && this.#privateProperties.cameraStream?.getVideoTracks()[0]?.readyState !== 'live')
		{
			this.enableVideo({calledFrom: 'processVideoQueue'});
		}
		else if (videoQueue === VIDEO_QUEUE.DISABLE && this.#privateProperties.cameraStream?.getVideoTracks()[0]?.readyState === 'live' && !this.#privateProperties.mediaMutedBySystem)
		{
			this.disableVideo({calledFrom: 'processVideoQueue'});
		}
	}

	async startScreenShare()
	{
		if (!Util.havePermissionToBroadcast('screenshare'))
		{
			return;
		}

		this.setLog('Start enabling screen sharing', LOG_LEVEL.INFO);
		const tracks = await this.getLocalScreen();
		await this.#applyScreenShare(tracks?.video, tracks?.audio, 'has no track');
	}

	async startScreenShareWithStream(stream: MediaStream)
	{
		if (!stream)
		{
			return;
		}

		this.setLog('Start enabling screen sharing with existing stream', LOG_LEVEL.INFO);
		this.#privateProperties.screenStream = stream;

		const videoTrack = stream.getVideoTracks()[0];
		const audioTrack = stream.getAudioTracks()[0];

		if (videoTrack)
		{
			CallStreamManager.setLocalStream(MediaStreamsKinds.Screen, videoTrack);
		}

		if (audioTrack)
		{
			CallStreamManager.setLocalStream(MediaStreamsKinds.ScreenAudio, audioTrack);
		}

		await this.#applyScreenShare(videoTrack, audioTrack);
	}

	async #applyScreenShare(
		videoTrack?: MediaStreamTrack,
		audioTrack?: MediaStreamTrack,
		failReason: string = 'track is not live',
	)
	{
		if (!videoTrack || videoTrack.readyState !== 'live')
		{
			this.setLog(`Enabling screen sharing failed: ${failReason}`, LOG_LEVEL.ERROR);
			this.#releaseStream(MediaStreamsKinds.Screen);
			this.onPublishFailed(MediaStreamsKinds.Screen);
			this.onPublishFailed(MediaStreamsKinds.ScreenAudio);

			return;
		}

		await this.publishTrack(
			MediaStreamsKinds.Screen,
			videoTrack,
			this.#getStreamQualityOptions(MediaStreamsKinds.Screen),
		);

		if (audioTrack)
		{
			await this.publishTrack(MediaStreamsKinds.ScreenAudio, audioTrack);
		}
	}

	clearScreenStream()
	{
		this.#privateProperties.screenStream = null;
	}

	async stopScreenShare()
	{
		this.setLog('Start disabling screen sharing', LOG_LEVEL.INFO);
		this.#updateRepublicationState(MediaStreamsKinds.Screen);
		this.#updateRepublicationState(MediaStreamsKinds.ScreenAudio);
		this.#releaseStream(MediaStreamsKinds.Screen);
		this.#releaseStream(MediaStreamsKinds.ScreenAudio);
		this.removeTrack(MediaStreamsKinds.Screen);
		this.removeTrack(MediaStreamsKinds.ScreenAudio);
		await this.unpublishTrack(MediaStreamsKinds.Screen);
		await this.unpublishTrack(MediaStreamsKinds.ScreenAudio);
	}

	sendMessage(message)
	{
		this.#sendSignal({ sendMessage: { message } });
	}

	switchConnectionType(type)
	{
		this.#sendSignal({ switchConnectionType: { type } });
	}

	raiseHand(raised) {
		this.#sendSignal({ raiseHand: { raised } });
	}

	updateUserData(data: Object): void
	{
		this.#sendSignal({ updateUserData: data });
	}

	changeSettings(options)
	{
		if (!Util.isUserControlFeatureEnabled())
		{
			return;
		}

		let settingsObj = {};

		switch (options.typeOfSetting){
			case 'mic':
				settingsObj =  { 'audioMutedEvent': { 'muted': !options.settingEnabled } };
				break;
			case 'cam':
				this.setLog(`Settings changes send videoMutedEvent (act: 'change_settings') - muted: ${!options.settingEnabled}`, LOG_LEVEL.INFO);
				settingsObj =  { 'videoMutedEvent': { 'muted': !options.settingEnabled } };
				break;
			case 'screenshare':
				settingsObj =  { 'screenShareMutedEvent': { 'muted': !options.settingEnabled } };
				break;
		}

		this.#sendSignal( { sendAction: {
			act: 'change_settings',
			changeSettingsPayload: settingsObj
		}});
	}

	turnOffAllParticipansStream(options)
	{
		if (!Util.isUserControlFeatureEnabled())
		{
			return;
		}

		if(options?.data)
		{
			if(options.data?.typeOfStream)
			{
				switch (options.data.typeOfStream)
				{
					case 'mic':
						this.#sendSignal(
						{	sendAction:
							{
								act: 'mute_others',
								muteAllParticipantPayload:
								{
									audioMutedEvent:
									{
										'muted': true
									}
								},
							}
						});


					break;

					case 'cam':
						this.setLog('turnOffAllParticipansStream send videoMutedEvent (act: \'mute_others\') - muted: true', LOG_LEVEL.INFO);
						this.#sendSignal(
						{	sendAction:
							{
								act: 'mute_others',
								muteAllParticipantPayload:
								{
									videoMutedEvent:
									{
										'muted': true
									}
								},
							}
						});


					break;

					case 'screenshare':
						this.#sendSignal(
						{	sendAction:
							{
								act: 'mute_others',
								muteAllParticipantPayload:
								{
									screenShareMutedEvent:
									{
										'muted': true
									}
								},
							}
						});


					break;
				}
			}
		}
	}

	turnOffParticipantStream(options)
	{
		if (!Util.isUserControlFeatureEnabled())
		{
			return;
		}

		if(!options.typeOfStream)
		{
			return;
		}

		switch (options.typeOfStream)
		{
			case 'mic':
				this.#sendSignal({
					sendAction:
					{
						act: 'mute_others',
						muteParticipantPayload:
						{
							'participantID': String(options.userId), // must be a String type
							'audioMutedEvent': { 'muted': true }
						},
					}
				});

				break;
			case 'cam':
				this.setLog(`turnOffParticipantStream send videoMutedEvent (act: 'mute_others') - muted: true, participantID: ${options.userId}`, LOG_LEVEL.INFO);
				this.#sendSignal({
					sendAction:
					{
						act: 'mute_others',
						muteParticipantPayload:
						{
							'participantID': String(options.userId), // must be a String type
							'videoMutedEvent': { 'muted': true }
						},
					}
				});

				break;
			case 'screenshare':
				this.#sendSignal({
					sendAction:
					{
						act: 'mute_others',
						muteParticipantPayload:
						{
							'participantID': String(options.userId), // must be a String type
							'screenShareMutedEvent': { 'muted': true }
						},
					}
				});
				break;
		}
	}

	allowSpeakPermission(options)
	{
		if (Util.canControlGiveSpeakPermission())
		{
			this.#sendSignal( { sendAction: {
				'act': 'give_permissions',
				'givePermissionsPayload':
				{
					'forUserId': String(options.userId),
					'allow': options.allow,
				},
			}});
		}
	}

	async getLocalVideo(): Promise<?MediaStreamTrack>
	{
		const readyState = this.#privateProperties.cameraStream?.getVideoTracks()[0]?.readyState;
		const readyStateInfo = readyState ? ` - readyState: ${readyState}` : '';
		this.setLog(`Local video getting${readyStateInfo}`, LOG_LEVEL.INFO);
		if (readyState !== 'live')
		{
			await this.getTrack(MediaStreamsKinds.Camera);
		}

		return this.#privateProperties.cameraStream?.getVideoTracks()[0];
	}

	async getLocalAudio(): Promise<?MediaStreamTrack>
	{
		const track = this.#privateProperties.microphoneStream?.getAudioTracks()[0];
		if (!track || track.readyState !== 'live' || isNoiseSuppressionInputTrackOff())
		{
			await this.getTrack(MediaStreamsKinds.Microphone);
		}

		return this.#privateProperties.microphoneStream?.getAudioTracks()[0];
	}

	async getLocalScreen(): Promise<?MediaStreamTrack[]>
	{
		if (!this.#privateProperties.screenStream)
		{
			await this.getTrack(MediaStreamsKinds.Screen);
		}

		return {
			video: this.#privateProperties.screenStream?.getVideoTracks()[0],
			audio: this.#privateProperties.screenStream?.getAudioTracks()[0],
		};
	}

	#getLocalTrackBySid(trackSid: string): any | null
	{
		if (!trackSid)
		{
			return null;
		}

		const localTracks = this.#privateProperties.localTracks || {};
		const localTrack = Object.values(localTracks).find(track => track?.sid === trackSid || track?.cid === trackSid);

		if (!localTrack)
		{
			return null;
		}

		return localTrack;
	}

	async #getUserMedia(options, fallbackMode = false): Promise<?MediaStream>
	{
		this.setLog(`Start getting user media with options: ${JSON.stringify(options)}`);
		this.#triggerEvents('GetUserMediaStarted', [options]);
		const constraints = buildMediaConstraints(
			options,
			fallbackMode,
			{
				videoDeviceId: this.#privateProperties.videoDeviceId,
				audioDeviceId: this.#privateProperties.audioDeviceId,
				defaultVideoResolution: this.#privateProperties.defaultVideoResolution,
			},
		);

		try
		{
			const mediaStream = await CallStreamManager.getUserMedia(constraints);
			const stream = mediaStream.clone();

			if (options.video && stream.getVideoTracks()[0])
			{
				this.#addTrackMuteHandlers(stream.getVideoTracks()[0]);
				this.#triggerEvents('GetUserMediaSuccess', [{ video: true }]);
			}

			if (options.audio && stream.getAudioTracks()[0])
			{
				this.#triggerEvents('GetUserMediaSuccess', [{ audio: true }]);
			}
			const trackMuteHandlersAreAddedInfo = options.video ? ' - trackMuteHandlersAreAdded: true' : '';
			this.setLog(`Getting user media with constraints: ${JSON.stringify(constraints)} succeeded${trackMuteHandlersAreAddedInfo}`);
			this.#triggerEvents('GetUserMediaEnded', [options]);

			return stream;
		}
		catch (error)
		{
			this.setLog(`Getting user media with constraints: ${JSON.stringify(constraints)} failed (fallbackMode: ${fallbackMode}): ${error}`, LOG_LEVEL.ERROR);

			if (!fallbackMode)
			{
				let monitoringEvent = '';

				if (options.video)
				{
					monitoringEvent = MONITORING_EVENTS_NAME_LIST.LOCAL_VIDEO_STREAM_RECEIVING_FAILED;
				}
				else if (options.audio)
				{
					monitoringEvent = MONITORING_EVENTS_NAME_LIST.LOCAL_MICROPHONE_STREAM_RECEIVING_FAILED;
				}

				if (monitoringEvent)
				{
					checkMetricsFeatureAndExecutionCallback(() => {
						this.addMonitoringEvents({
							name: monitoringEvent,
							withCounter: true,
						});
					});
				}

				const stream = await this.#getUserMedia(options, true);

				if (stream !== null)
				{
					this.#triggerEvents('GetUserMediaFailed', [{error, options, fallbackMode}]);
				}

				return stream;
			}

			this.setLog(`Getting user media with constraints: ${JSON.stringify(constraints)} failed: ${error}`, LOG_LEVEL.ERROR);
			this.#triggerEvents('GetUserMediaFailed', [{error, options, fallbackMode}]);
			this.#triggerEvents('GetUserMediaEnded', [options]);

			return null;
		}
	}

	async #getDisplayMedia(): Promise<?MediaStream>
	{
		this.setLog('Start getting display media');

		try
		{
			const mediaStream = await CallStreamManager.getUserScreen();
			const stream = mediaStream.clone();
			this.setLog('Getting display media succeeded');

			return stream;
		}
		catch (error)
		{
			this.setLog(`Getting display media failed: ${error}`, LOG_LEVEL.ERROR);

			checkMetricsFeatureAndExecutionCallback(() => {
				this.addMonitoringEvents({
					name: MONITORING_EVENTS_NAME_LIST.LOCAL_SCREEN_STREAM_RECEIVING_FAILED,
					withCounter: true,
				});
			});

			return null;
		}
	}

	async getTrack(MediaStreamKind)
	{
		if (MediaStreamKind === MediaStreamsKinds.Camera)
		{
			const readyState = this.#privateProperties.cameraStream?.getVideoTracks()[0]?.readyState;
			const readyStateInfo = readyState ? ` - readyState: ${readyState}` : '';
			this.setLog(`Video track getting ${readyStateInfo}`, LOG_LEVEL.INFO);
		}

		if (MediaStreamKind === MediaStreamsKinds.Camera && this.#privateProperties.cameraStream?.getVideoTracks()[0]?.readyState !== 'live')
		{
			this.#privateProperties.cameraStream = await this.#getUserMedia({video: true});
		}
		else if (MediaStreamKind === MediaStreamsKinds.Microphone && !this.#privateProperties.microphoneStream)
		{
			this.#privateProperties.microphoneStream = await this.#getUserMedia({audio: true});
		}
		else if (MediaStreamKind === MediaStreamsKinds.Screen && !this.#privateProperties.screenStream)
		{
			this.#privateProperties.screenStream = await this.#getDisplayMedia();
		}

		if (this.#privateProperties.abortController.signal.aborted)
		{
			this.#releaseStream(MediaStreamKind);
			return;
		}

		let track;

		if (MediaStreamKind === MediaStreamsKinds.Screen)
		{
			track = this.#privateProperties.screenStream?.getVideoTracks()[0];
			if (track && track.readyState !== 'live')
			{
				this.#privateProperties.screenStream = null;
				track = this.getLocalScreen();
			}
		}
		else if (MediaStreamKind === MediaStreamsKinds.Camera)
		{
			track = this.#privateProperties.cameraStream?.getVideoTracks()[0];
			const readyState = track?.readyState;
			const readyStateInfo = readyState ? ` - readyState: ${readyState}` : '';
			this.setLog(`New video track getting${readyStateInfo}`, LOG_LEVEL.INFO);
			if (track && track.readyState !== 'live')
			{
				this.#privateProperties.cameraStream = null;
				track = this.getLocalVideo();
			}
		}
		else if (MediaStreamKind === MediaStreamsKinds.Microphone)
		{
			track = this.#privateProperties.microphoneStream?.getAudioTracks()[0];
			if (track && (track.readyState !== 'live' || isNoiseSuppressionInputTrackOff()))
			{
				this.#privateProperties.microphoneStream = null;
				track = this.getLocalAudio();
			}

			const noInputTrackEndHandler = CallSettingsManager.noiseSuppressionEnabled
				&& Hardware.noiseSuppressionInputStream
				&& Hardware.noiseSuppressionInputStream.getAudioTracks().length > 0
				&& !Hardware.noiseSuppressionInputStream.getAudioTracks()[0].onended;
			if (track && noInputTrackEndHandler)
			{
				Hardware.noiseSuppressionInputStream.getAudioTracks()[0].onended = () => {
					track.onended();
				};
			}
		}

		this.#addOnEndedHandler(track, MediaStreamKind);

		return track;
	}

	#addOnEndedHandler(track, mediaStreamKind)
	{
		if (track && !track.onended)
		{
			track.onended = () => {
				let interrupted = false;
				let permissionDescriptor = null;

				if (mediaStreamKind === MediaStreamsKinds.Microphone)
				{
					permissionDescriptor = 'microphone';
				}
				else if (mediaStreamKind === MediaStreamsKinds.Camera)
				{
					permissionDescriptor = 'camera';
				}

				if (this.#privateProperties.localTracks[mediaStreamKind])
				{
					this.#privateProperties.localTracks[mediaStreamKind].muted = true;

					if (mediaStreamKind === MediaStreamsKinds.Camera)
					{
						this.setLog('Video track is ended - muted: true', LOG_LEVEL.INFO);
					}
				}

				const permissionPromise = navigator?.permissions?.query
					? navigator.permissions.query({ name: permissionDescriptor })
					: Promise.resolve();

				permissionPromise
					.then((result) => {
						interrupted = result?.state === 'granted';
					})
					.catch(() => {
						// no need to do anything
					})
					.finally(() => {
						this.#triggerEvents('PublishEnded', [mediaStreamKind, interrupted]);
					});
			};
		}
	}

	async switchActiveAudioDevice(deviceId, force)
	{
		if (this.#privateProperties.switchActiveAudioDeviceInProgress && !force)
		{
			this.setLog(`Got another request to switch an audio device to ${deviceId}, saving it`, LOG_LEVEL.INFO);
			this.#privateProperties.switchActiveAudioDevicePending = deviceId;
			return;
		}

		let error = null;
		let fulfilled = false;
		this.setLog(`Start switching an audio device to ${deviceId}`, LOG_LEVEL.INFO);

		const promise = new Promise(async (resolve, reject) => {
			this.#privateProperties.audioDeviceId = deviceId;
			const prevStream = this.#privateProperties.microphoneStream;

			try
			{
				const prevTrack = this.#privateProperties.microphoneStream?.getAudioTracks()[0];
				this.#privateProperties.microphoneStream = null;
				let prevTrackEnabledState = true;
				let prevTrackId = '';
				if (prevTrack)
				{
					prevTrackEnabledState = prevTrack.enabled;
					prevTrackId = prevTrack.id;
					prevTrack.stop();
				}
				const audioTrack = await this.getLocalAudio();
				audioTrack.source = MediaStreamsKinds.Microphone;
				audioTrack.enabled = prevTrackEnabledState;
				const mediaServer = this.#getPublishingMediaServer();
				if (mediaServer && (this.isAudioPublished() || audioTrack.id !== prevTrackId))
				{
					await mediaServer.replaceTrack(MediaStreamsKinds.Microphone, audioTrack);
				}
				this.setLog('Switching an audio device succeeded', LOG_LEVEL.INFO);
			}
			catch (e)
			{
				error = e;
				this.setLog(`Switching an audio device failed: ${e}`, LOG_LEVEL.ERROR);
				if (!this.#privateProperties.microphoneStream)
				{
					this.#privateProperties.microphoneStream = prevStream;
				}
			}
			finally
			{
				if (this.#privateProperties.switchActiveAudioDevicePending)
				{
					const deviceId = this.#privateProperties.switchActiveAudioDevicePending;
					this.#privateProperties.switchActiveAudioDevicePending = null;
					resolve(this.switchActiveAudioDevice(deviceId , true));
				}
				else
				{
					fulfilled = true;
					this.#privateProperties.switchActiveAudioDeviceInProgress = null;
					return error ? reject(error) : resolve();
				}
			}
		});

		if (!force && !fulfilled)
		{
			this.#privateProperties.switchActiveAudioDeviceInProgress = promise;
		}

		return promise;
	}

	async switchActiveVideoDevice(deviceId, force)
	{
		if (this.#privateProperties.switchActiveVideoDeviceInProgress && !force)
		{
			this.setLog(`Got another request to switch a video device to ${deviceId}, saving it`, LOG_LEVEL.INFO);
			this.#privateProperties.switchActiveVideoDevicePending = deviceId;
			return;
		}

		let error = null;
		let fulfilled = false;
		this.setLog(`Start switching a video device to ${deviceId}`, LOG_LEVEL.INFO);

		const promise = new Promise(async (resolve, reject) => {
			this.#privateProperties.videoDeviceId = deviceId;
			const prevStream = this.#privateProperties.cameraStream;

			try
			{
				if (this.isVideoPublished())
				{
					this.#privateProperties.cameraStream?.getVideoTracks()[0].stop();
					this.#privateProperties.cameraStream = null;

					const videoTrack = await this.getLocalVideo();
					videoTrack.source = MediaStreamsKinds.Camera;
					const mediaServer = this.#getPublishingMediaServer();
					await mediaServer?.replaceTrack(MediaStreamsKinds.Camera, videoTrack);
				}
				this.setLog('Switching a video device succeeded', LOG_LEVEL.INFO);
			}
			catch (e)
			{
				error = e;
				this.setLog(`Switching a video device failed: ${e}`, LOG_LEVEL.ERROR);
				if (!this.#privateProperties.cameraStream)
				{
					this.#privateProperties.cameraStream = prevStream;
				}
			}
			finally
			{
				if (this.#privateProperties.switchActiveVideoDevicePending)
				{
					const deviceId = this.#privateProperties.switchActiveVideoDevicePending;
					this.#privateProperties.switchActiveVideoDevicePending = null;
					resolve(this.switchActiveVideoDevice(deviceId , true));
				}
				else
				{
					fulfilled = true;
					this.#privateProperties.switchActiveVideoDeviceInProgress = null;
					return error ? reject(error) : resolve();
				}
			}
		});

		if (!force && !fulfilled)
		{
			this.#privateProperties.switchActiveVideoDeviceInProgress = promise;
		}

		return promise;
	}

	isAudioPublished(): boolean
	{
		return this.#isTrackPublished(MediaStreamsKinds.Microphone);
	}

	isVideoPublished(): boolean
	{
		return this.#isTrackPublished(MediaStreamsKinds.Camera);
	}

	isScreenPublished(): boolean
	{
		return this.#isTrackPublished(MediaStreamsKinds.Screen);
	}

	#isTrackPublished(kind: number): boolean
	{
		return this.#privateProperties.localTracks[kind] && this.#privateProperties.localTracks[kind]?.muted !== true;
	}

	#addTrackMuteHandlers(track)
	{
		track.onmute = (event) =>
		{
			this.setLog('Video track event "mute" was triggered', LOG_LEVEL.INFO);
			this.#privateProperties.mediaMutedBySystem = false;
			this.disableVideo({ calledFrom: 'track.onmute', bySystem: true });
			this.disableAudio({ calledFrom: 'track.onmute', bySystem: true });
			this.#privateProperties.mediaMutedBySystem = true;
			this.#triggerEvents('MediaMutedBySystem', [true]);
		};

		track.onunmute = (event) =>
		{
			this.setLog('Video track event "unmute" was triggered', LOG_LEVEL.INFO);
			if (this.#privateProperties.mediaMutedBySystem)
			{
				this.#privateProperties.mediaMutedBySystem = false;
				this.#triggerEvents('MediaMutedBySystem', [false]);
			}
			this.enableVideo({calledFrom: 'track.onunmute'});
			if (this.#privateProperties.needToEnableAudioAfterSystemMuted)
			{
				this.enableAudio();
			}
		};
	}

	getParticipants()
	{
		return this.#privateProperties.remoteParticipants;
	}

	getState()
	{
		return this.#privateProperties.callState
	}

	setRecorderState(status)
	{
		if (!Object.values(RecorderStatus).includes(status))
		{
			return;
		}

		const signal = {
			recorderControl: {
				status: status,
			}
		};

		return this.isConnected() ? this.#sendSignal(signal) : false;
	}

	/**
	 * @param {number} status
	 * @param {CloudRecordKind | null} kind
	 */
	setCloudRecordState(status, kind = null) {
		if (!Object.values(CloudRecordStatus).includes(status))
		{
			return;
		}

		const signal = {
			videoRecorderControl: {
				status,
				kind,
			},
		};

		if (Util.isCloudRecordLogEnabled())
		{
			console.warn(`CloudRecord: videoRecorderControl`, signal);
		}

		if (this.isConnected())
		{
			this.#sendSignal(signal);
		}
	}

	setLog(log, level)
	{
		level = LOG_LEVEL[level] || LOG_LEVEL.INFO;
		log = Util.logToString(log);

		const desktopVersion = window['BXDesktopSystem']?.ApiVersion?.();
		const version = ClientVersion + (desktopVersion ? ` (desktopApi: ${desktopVersion})` : '');
		const currentTime = Date.now();
		const data = {
			timestamp: Math.floor(currentTime / 1000),
			timestampMS: currentTime,
			event: log,
			client: ClientPlatform,
			appVersion: version,
		};

		if (Util.isConsoleLogsEnabled() && console)
		{
			let a = ['Call API log [' + Util.getTimeForLog() + ']: '];
			console.warn.apply(this, a.concat(Array.prototype.slice.call(arguments)));
		}

		if (Util.isMetricsLogsEnabled())
		{
			return this.#sendLog(data, level);
		}

		if (this.#privateProperties.isloggingEnable)
		{
			const logLength = Object.values(this.#privateProperties.logs).length;
			this.#privateProperties.logs[logLength] = {
				level,
				data,
			};
			let lastSentLog = 0;

			for (let index in this.#privateProperties.logs)
			{
				if (!this.#sendLog(this.#privateProperties.logs[index].data, this.#privateProperties.logs[index].level))
				{
					break;
				}
				lastSentLog = index;
			}

			if (lastSentLog)
			{
				this.#privateProperties.logs = Object.values(this.#privateProperties.logs).slice(lastSentLog + 1);
			}

			if (this.#privateProperties.loggerCallback)
			{
				this.#privateProperties.loggerCallback();
			}
		}
	}

	prepareMetricsLogs({logData, level})
	{
		const logObject =
		{
			timeUnixNano: logData.timestampMS * 1000000, // ms -> nanoseconds
			severityNumber: 9,
			severityText: 'INFO',
			body:
			{
				stringValue: logData.event,
			},
			attributes:
			{
				level: level,
				session_id: String(this.#privateProperties.roomId),
				peer_id: String(this.#privateProperties.userId),
				app_version: logData.appVersion,
				env: String(this.#privateProperties.monitoringEnvironment),
				region: String(this.#privateProperties.monitoringRegion),
			},
			//traceId: '',
			//spanId: '',
		};

		this.currentMonitoringEventsObject.logs.push(logObject);
	}

	#sendLog(logData, level)
	{
		if (Util.isMetricsLogsEnabled())
		{
			return this.prepareMetricsLogs({logData, level});
		}
		if (!Util.isKibanaLogsEnabled())
		{
			return true;
		}

		const signal = {
			sendLog: {
				userName: `${this.#privateProperties.userId}`,
				data: JSON.stringify(logData),
				msgLevel: level,
			}
		};

		return this.isConnected() ? this.#sendSignal(signal) : false;
	}

	setLoggerCallback(callback)
	{
		this.#privateProperties.loggerCallback = callback;
	}

	enableSilentLogging(enable)
	{
		this.#privateProperties.isloggingEnable = enable;
	}

	#processParticipants(participants: any, isReconnect: boolean): void
	{
		const participantsToProcess: any[] = Object.values(participants);
		const participantsToDelete: Set<number> = new Set(Object.keys(this.#privateProperties.remoteParticipants));

		participantsToProcess.forEach((participant) => {
			if (participantsToDelete.has(participant.userId))
			{
				participantsToDelete.delete(participant.userId);
			}
			this.setLog(`Adding an early connected participant with id ${participant.userId} (sid: ${participant.sid})`, LOG_LEVEL.INFO);
			this.#setRemoteParticipant(participant);
		});

		if (!isReconnect)
		{
			return;
		}

		for (const participantId: number of participantsToDelete)
		{
			const participant: Participant = this.#privateProperties.remoteParticipants[participantId];
			delete this.#privateProperties.remoteParticipants[participant.userId];

			participantsToDelete.delete(participant.userId);
			this.setLog(`Deleting a missing participant with id ${participant.userId} (sid: ${participant.sid})`, LOG_LEVEL.INFO);
			this.#triggerEvents('ParticipantLeaved', [participant]);
		}
	}

	#processMessage(messageData): void
	{
		const message = createMessage(messageData);

		if (message.error || !message.content)
		{
			this.setLog(`Could not new message: ${messageData.message} ${message.error.message}`, LOG_LEVEL.WARNING);

			return;
		}

		if (message.content?.eventName === 'SubscriptionFailed')
		{
			const { userId, trackSource, trackId } = message.content;

			if (userId == this.#privateProperties.userId)
			{
				this.republishTrack(trackSource);
			}
			else
			{
				const participant = this.#privateProperties.remoteParticipants[userId];
				const pendingSubscription = this.#privateProperties.pendingSubscriptions[userId]?.[trackId];

				if (pendingSubscription || !participant?.getTrack(trackSource))
				{
					participant.addFailedSubscription(trackSource);
				}
			}

			return;
		}

		this.#triggerEvents('MessageReceived', [message]);
	}

	#setUserPermissions(_permissionsJSON)
	{
		try
		{
			let permissions = JSON.parse(_permissionsJSON);

			Util.setUserPermissions(permissions);
		}
		catch (err)
		{
			this.setLog(`Could not parse a permissions JSON: ${_permissionsJSON}  ${err.message}`, LOG_LEVEL.WARNING);
		}
	}

	#setRemoteParticipant(participant: any): void
	{
		const userId = participant.userId;
		const previousParticipantState: Participant = this.#privateProperties.remoteParticipants[userId];
		const previousTrackSources = previousParticipantState?.tracks ? Object.keys(previousParticipantState.tracks) : [];
		const newTrackSources = [];
		const participantEvent = previousParticipantState
			? 'ParticipantStateUpdated'
			: 'ParticipantJoined';
		const remoteParticipant = new Participant(participant, STREAM_QUALITY.HIGH);
		remoteParticipant.setVideoWidth(previousParticipantState?.videoWidth);
		this.#privateProperties.remoteParticipants[userId] = remoteParticipant;

		if (userId in this.#privateProperties.participantsToUpdateTrackAvailability)
		{
			remoteParticipant.isLocalVideoMute = !this.#privateProperties.participantsToUpdateTrackAvailability[userId];
			delete this.#privateProperties.participantsToUpdateTrackAvailability[userId];
		}
		else if (previousParticipantState)
		{
			remoteParticipant.isLocalVideoMute = previousParticipantState.isLocalVideoMute;
		}

		this.#triggerEvents(participantEvent, [remoteParticipant]);

		if (participant.participantTracks)
		{
			Object.values(participant.participantTracks).forEach(track =>
			{
				newTrackSources.push(track.source);
				track.userId = userId
				this.#privateProperties.tracksDataFromSocket[track.sid] = track

				switch (track.source)
				{
					case MediaStreamsKinds.Camera:
						remoteParticipant.isMutedVideo = !!track.muted;
						remoteParticipant.videoEnabled = true;
						break;
					case MediaStreamsKinds.Microphone:
						remoteParticipant.isMutedAudio = !!track.muted;
						remoteParticipant.audioEnabled = true;
						break;
					case MediaStreamsKinds.Screen:
						remoteParticipant.screenSharingEnabled = true;
						break;
				}

				remoteParticipant.mediaServerId = track.mediaServerId;

				this.setLog(`A participant with id ${userId} (sid: ${remoteParticipant.sid}) has a track info with kind ${track.source} (sid: ${track.sid}, waiting for it`, LOG_LEVEL.INFO);

				const ontrackData = this.#privateProperties.ontrackData[track.sid];
				delete this.#privateProperties.ontrackData[track.sid];

				if (ontrackData)
				{
					this.#createRemoteTrack(track.sid, ontrackData);
				}
				else if (this.#needSubscribeToTrack(track, remoteParticipant, true))
				{
					this.#changeSubscriptionToTrack(track.sid, remoteParticipant.sid, true, remoteParticipant.mediaServerId);
					this.#addPendingSubscription(remoteParticipant, track);
				}
				else if (track.source === MediaStreamsKinds.Camera)
				{
					const remoteTrack = new Track(track.sid, track.source);
					remoteParticipant.addTrack(remoteTrack.source, remoteTrack);
					if (!remoteParticipant.isMutedVideo)
					{
						this.#triggerEvents('RemoteMediaAvailable', [participant, remoteTrack]);
					}
				}
			});
		}

		const removedSources = previousTrackSources.filter(source => !newTrackSources.includes(source));
		removedSources.forEach((source) => {
			const prevTrack = previousParticipantState.getTrack(source);
			this.#triggerEvents('RemoteMediaRemoved', [participant, prevTrack]);
		});

		if (this.#privateProperties.videoStreamSetupErrorList[userId])
		{
			const kindArray = [...this.#privateProperties.videoStreamSetupErrorList[userId]];
			delete this.#privateProperties.videoStreamSetupErrorList[userId];

			kindArray.forEach((kind) => {
				this.setMainStream(userId, kind);
			});
		}
	};

	#processTrack(data)
	{
		const participantId = data.userId;
		const participant = this.#privateProperties.remoteParticipants[participantId];
		const track = data.track;
		const trackId = track.sid;
		track.userId = participantId;

		this.setLog(`Got a track info with kind ${track.source} (sid: ${trackId}) for a participant with id ${participantId} (sid: ${participant.sid}), waiting for it`, LOG_LEVEL.INFO);
		switch (track.source)
		{
			case MediaStreamsKinds.Camera:
				participant.videoEnabled = true;
				break;
			case MediaStreamsKinds.Microphone:
				participant.audioEnabled = true;
				break;
			case MediaStreamsKinds.Screen:
				participant.screenSharingEnabled = true;
				break;
		}
		participant.mediaServerId = data.mediaServerId;

		const ontrackData = this.#privateProperties.ontrackData[trackId];
		delete this.#privateProperties.ontrackData[trackId];

		if (ontrackData)
		{
			this.#createRemoteTrack(trackId, ontrackData);
		}
		else if (this.#needSubscribeToTrack(track, participant))
		{
			this.#changeSubscriptionToTrack(track.sid, participant.sid, true, participant.mediaServerId);
			this.#addPendingSubscription(participant, track);
		}
		else if (track.source === MediaStreamsKinds.Camera)
		{
			const remoteTrack = new Track(trackId, track.source);
			participant.addTrack(remoteTrack.source, remoteTrack);
			this.#triggerEvents('RemoteMediaAvailable', [participant, remoteTrack]);
		}
	}

	#createRemoteTrack(trackId, ontrackData)
	{
		const trackData = this.#privateProperties.tracksDataFromSocket[trackId];
		const userId = trackData.userId;
		const participant = this.#privateProperties.remoteParticipants[userId];
		const track = ontrackData.track;
		const trackMuted = !!trackData.muted;

		this.#privateProperties.realTracksIds[track.id] = trackId;
		track.source = trackData.source;
		track.layers = trackData.layers || null;

		let remoteTrack = Object.values(participant.tracks)?.find(track => track?.id === trackId);
		if (remoteTrack)
		{
			remoteTrack.setTrack(track);
		}
		else
		{
			remoteTrack = new Track(trackId, track.source, track);
		}

		if (remoteTrack.source === MediaStreamsKinds.Camera)
		{
			participant.isMutedVideo = trackMuted;
		}
		else if (remoteTrack.source === MediaStreamsKinds.Microphone)
		{
			participant.isMutedAudio = trackMuted;
			if (trackMuted)
			{
				this.setLog(`Trigger mute signal (${trackMuted}) for received audio from a participant with id ${participant.userId} (sid: ${participant.sid})`, LOG_LEVEL.INFO);
				this.#triggerEvents('RemoteMediaMuted', [participant, remoteTrack]);
			}
		}

		if (this.#privateProperties.pendingSubscriptions[userId]?.[trackId]?.timeout)
		{
			clearTimeout(this.#privateProperties.pendingSubscriptions[userId][trackId].timeout);
			delete this.#privateProperties.pendingSubscriptions[userId][trackId];
		}

		this.setLog(`Got an expected track with kind ${remoteTrack.source} (sid: ${trackId}) for a participant with id ${participant.userId} (sid: ${participant.sid})`, LOG_LEVEL.INFO);
		participant.addTrack(remoteTrack.source, remoteTrack);
		participant.deleteFailedSubscription(remoteTrack.source);
		if (remoteTrack.source !== MediaStreamsKinds.Camera || !participant.isMutedVideo)
		{
			this.#triggerEvents('RemoteMediaAdded', [participant, remoteTrack]);
		}

		if (remoteTrack.source === MediaStreamsKinds.Camera)
		{
			const quality = this.#calculateVideoQualityForUser(userId, remoteTrack.source);
			this.#setStreamQualityFoParticipant(participant, quality);
		}

		const streamRemovingId = Util.getUuidv4();
		participant.streamRemovingId[remoteTrack.source] = streamRemovingId;

		ontrackData.streams[0].onremovetrack = () => {
			// we need to check if a participant is still exists
			// otherwise tracks were deleted when participant left room
			const participant = this.#privateProperties.remoteParticipants[userId];
			if (participant)
			{
				if (participant.streamRemovingId[remoteTrack.source] === streamRemovingId)
				{
					this.setLog(`Track with kind ${track.source} (sid: ${track.id}) for a participant with id ${userId} (sid: ${participant.sid || 'unknown'}) was removed from peer connection`, LOG_LEVEL.WARNING);
					participant.removeTrack(remoteTrack.source);
					this.#triggerEvents('RemoteMediaRemoved', [participant, remoteTrack]);
				}
			}
			else
			{
				this.setLog(`Track with kind ${track.source} (sid: ${track.id}) was removed from a disconnected participant with id ${userId} (sid: unknown) before it was removed from peer connection`, LOG_LEVEL.WARNING);
			}
		};
	}

	#releaseStream(mediaStreamKind): void
	{
		const streamTypes = {
			[MediaStreamsKinds.Camera]: 'cameraStream',
			[MediaStreamsKinds.Microphone]: 'microphoneStream',
			[MediaStreamsKinds.Screen]: 'screenStream',
			[MediaStreamsKinds.ScreenAudio]: 'screenStream',
		};

		const streamType = streamTypes[mediaStreamKind];

		if (streamType)
		{
			this.#privateProperties[streamType]?.getTracks?.()?.forEach((track) => {
				track.onended = null;
				track.stop();
			});
			this.#privateProperties[streamType] = null;
			if (this.#privateProperties.needToStopStreams)
			{
				CallStreamManager.stopStream(mediaStreamKind);
			}
		}
	}

	#trackMutedHandler(data)
	{
		const trackId = data.track.shortId;
		const isMuted = data.muted;
		this.setLog(`Got socket message "trackMuted" - trackId: ${trackId}, muted: ${isMuted}`);

		if (data.track.publisher == this.#privateProperties.userId)
		{
			const track = this.#getLocalTrackBySid(trackId);
			if (track)
			{
				if (track.source === MediaStreamsKinds.Camera)
				{
					this.setLog(`Got mute self video signal (${isMuted}) - trackId: ${trackId}`, LOG_LEVEL.INFO);

					if (!isMuted && track.muted && !this.#privateProperties.mediaMutedBySystem)
					{
						this.#triggerEvents('PublishSucceed', [track.source]);
					}
					else if (!this.#privateProperties.mediaMutedBySystem)
					{
						this.#triggerEvents('PublishPaused', [track.source]);
					}

					if (this.#privateProperties.videoQueue)
					{
						this.#processVideoQueue();
					}
				}
				else if (track.source === MediaStreamsKinds.Microphone)
				{
					if (data?.muted && !Hardware.isMicrophoneMuted)
					{
						return;
					}
					this.#triggerEvents('PublishPaused', [track.source, data.muted]);
				}
			}
			else
			{
				this.setLog(`Mute self signal (${isMuted}) getting failed - trackId: ${trackId}`, LOG_LEVEL.INFO);
			}

			return;
		}

		const participant = this.#privateProperties.remoteParticipants[data.track.publisher];
		if (!participant)
		{
			this.setLog(`Got mute signal (${isMuted}) for a non-existent participant with id ${data.track.publisher}`, LOG_LEVEL.WARNING);

			return;
		}

		const track = Object.values(participant.tracks)?.find((track) => track?.id === trackId);
		const awaitedTrack = this.#privateProperties.tracksDataFromSocket[trackId];

		if (awaitedTrack)
		{
			awaitedTrack.muted = isMuted;

			if (awaitedTrack.source === MediaStreamsKinds.Camera)
			{
				participant.isMutedVideo = isMuted;
			}
			else if (awaitedTrack.source === MediaStreamsKinds.Microphone)
			{
				participant.isMutedAudio = isMuted;
			}
		}

		if (awaitedTrack && !track)
		{
			if (
				awaitedTrack.source === MediaStreamsKinds.Microphone
				&& !this.#privateProperties.pendingSubscriptions?.[participant.userId]?.[trackId]
				&& !isMuted
			)
			{
				this.#changeSubscriptionToTrack(trackId, participant.sid, true, participant.mediaServerId);
				this.#addPendingSubscription(participant, awaitedTrack);
			}

			this.setLog(`Got mute signal (${isMuted}) for a non-received track with id ${trackId}`, LOG_LEVEL.WARNING);
			this.#triggerEvents('AwaitedRemoteMediaMuted', [participant, awaitedTrack]);

			return;
		}

		if (!track)
		{
			this.setLog(`Got mute signal (${isMuted}) for a non-existent track with id ${trackId}`, LOG_LEVEL.WARNING);

			return;
		}

		if (track.source === MediaStreamsKinds.Microphone)
		{
			this.#microphoneMuteUnmuteHandler({ track, isMuted, participant });
			this.setLog(`Got mute signal (${isMuted}) for audio from a participant with id ${participant.userId} (sid: ${participant.sid})`);
		}
		else if (track.source === MediaStreamsKinds.Camera)
		{
			this.#cameraMuteUnmuteHandler({ track, isMuted, participant });
			this.setLog(`Got mute signal (${isMuted}) for video from a participant with id ${participant.userId} (sid: ${participant.sid})`);
		}
	}

	#microphoneMuteUnmuteHandler(options)
	{
		options.participant.isMutedAudio = options.isMuted;

		const eventName = options.isMuted
			? 'RemoteMediaMuted'
			: 'RemoteMediaUnmuted';

		this.#triggerEvents(eventName, [options.participant, options.track]);
	}

	#cameraMuteUnmuteHandler(options)
	{
		this.setLog(`Camera muting was changed (${options?.isMuted}) - trackSid: ${options?.track?.sid}, participantUserId: ${options?.participant?.userId}, trackSource: ${options?.track?.source}`, LOG_LEVEL.INFO);

		options.participant.isMutedVideo = options.isMuted;

		if (options.track.subscribed)
		{
			const eventName = options.isMuted
				? 'RemoteMediaRemoved'
				: 'RemoteMediaAdded';
			this.#triggerEvents(eventName, [options.participant, options.track]);
			return;
		}

		if (this.#privateProperties.tracksDataFromSocket[options.track.sid])
		{
			this.#privateProperties.tracksDataFromSocket[options.track.sid].muted = options.isMuted;
		}

		const eventName = options.isMuted
			? 'RemoteMediaUnavailable'
			: 'RemoteMediaAvailable';
		this.#triggerEvents(eventName, [options.participant, options.track]);
	}

	#participantMutedHandler(data)
	{
		if (!Util.isUserControlFeatureEnabled())
		{
			return;
		}

		if (data.toUserId === data.fromUserId) // we not accept mute participant by himself by this method
		{
			return;
		}

		if (data.toUserId != this.#privateProperties.userId)
		{
			const participant = this.#privateProperties.remoteParticipants[data.toUserId];

			if (!participant)
			{
				this.setLog(`Got a onParticipantMuted event for non-existent user (toUserId: ${data.toUserId})`, LOG_LEVEL.WARNING);
				return;
			}

			if (data?.track.muted) // tbh always should be in "true"..
			{
				if (data.track.type === 0 && participant.audioEnabled)
				{ // audio
					participant.audioEnabled = false;

					const track = Object.values(participant.tracks)?.find(track => track?.source === MediaStreamsKinds.Microphone);

					this.#microphoneMuteUnmuteHandler({track: track, isMuted: true, participant: participant});
				}
				else if (data.track.type === 1 && participant.videoEnabled)
				{ // video
					this.setLog(`Mute participant video - from: ${data?.fromUserId}, to: ${data?.toUserId}`, LOG_LEVEL.INFO);
					participant.videoEnabled = false;
					const track = Object.values(participant.tracks)?.find(track => track?.source === MediaStreamsKinds.Camera);

					this.#cameraMuteUnmuteHandler({track: track, isMuted: true, participant: participant});
				}
				else if (data.track.type === 1 && !participant.videoEnabled)
				{
					this.setLog(`Cancel participant video muting - from: ${data?.fromUserId}, to: ${data?.toUserId}`, LOG_LEVEL.INFO);
				}
				else if (data.track.type === 2 && participant.screenSharingEnabled)
				{ // screenshare
					participant.screenSharingEnabled = false;

					const track = Object.values(participant.tracks)?.find(track => track?.source === MediaStreamsKinds.Screen);
					const screenAudioTrack = participant.getTrack(MediaStreamsKinds.ScreenAudio);

					this.#cameraMuteUnmuteHandler({track: track, isMuted: true, participant: participant});

					if (screenAudioTrack)
					{
						this.#microphoneMuteUnmuteHandler({track: screenAudioTrack, isMuted: true, participant: participant});
					}
				}
			}
		}

		this.#triggerEvents('ParticipantMuted', [data]);
	}

	#allParticipantsMutedHandler(data)
	{
		if (!Util.isUserControlFeatureEnabled())
		{
			return;
		}
		if (data.fromUserId == this.#privateProperties.userId)
		{
			if (!data.reason || (data.reason && data.reason != 'settings'))
			{
				this.#triggerEvents('YouMuteAllParticipants', [data]);
			}
		}
		else
		{
			if (data?.track.type === 0)
			{
				this.#triggerEvents('AllParticipantsAudioMuted', [data]);
			}
			else if (data.track.type === 1)
			{
				this.setLog(`Try to mute all participant videos - from: ${data?.fromUserId}`, LOG_LEVEL.INFO);
				this.#triggerEvents('AllParticipantsVideoMuted', [data]);
			}
			else if (data.track.type === 2)
			{
				this.#triggerEvents('AllParticipantsScreenshareMuted', [data]);
			}
		}

		if (data?.track.muted) // tbh always should be in "true"..
		{
			for (let i in this.#privateProperties.remoteParticipants)
			{
				if (this.#privateProperties.remoteParticipants.hasOwnProperty(i))
				{
					let  participant = this.#privateProperties.remoteParticipants[i];

					if (participant.userId != data.fromUserId && Util.isRegularUser(Util.getUserRoleByUserId(participant.userId)))
					{
						if (data.track.type === 0 && participant.audioEnabled)
						{ // audio
							participant.audioEnabled = false;

							const track = participant.getTrack(MediaStreamsKinds.Microphone);

							this.#microphoneMuteUnmuteHandler({track: track, isMuted: true, participant: participant});
						}
						else if(data.track.type === 1 && participant.videoEnabled)
						{ // video
							participant.videoEnabled = false;

							this.setLog(`Mute participant video - from: ${data?.fromUserId}, to: ${participant?.userId}`, LOG_LEVEL.INFO);

							const track = participant.getTrack(MediaStreamsKinds.Camera);

							this.#cameraMuteUnmuteHandler({track: track, isMuted: true, participant: participant});
						}
						else if (data.track.type === 1 && !participant.videoEnabled)
						{
							this.setLog(`Cancel participant video muting - from: ${data?.fromUserId}, to: ${participant?.userId}`, LOG_LEVEL.INFO);
						}
						else if(data.track.type === 2)
						{ // screenshare
							participant.screenSharingEnabled = false;

							const track = participant.getTrack(MediaStreamsKinds.Screen);
							const screenAudioTrack = participant.getTrack(MediaStreamsKinds.ScreenAudio);

							this.#cameraMuteUnmuteHandler({track: track, isMuted: true, participant: participant});
							if (screenAudioTrack)
							{
								this.#microphoneMuteUnmuteHandler({track: screenAudioTrack, isMuted: true, participant: participant});
							}
						}
					}
				}
			}
		}
	}

	#subscriptionResponseHandler({ trackSid, err }: { trackSid: string; err?: string }): void
	{
		this.setLog(`Got an error  from the media server during subscription to ${trackSid}: ${err || 'unknowError'}`, LOG_LEVEL.ERROR);

		const trackData = this.#privateProperties.tracksDataFromSocket[trackSid];
		delete this.#privateProperties.tracksDataFromSocket[trackSid];

		if (!trackData)
		{
			return;
		}

		const participant = this.#privateProperties.remoteParticipants[trackData.userId];
		if (!participant)
		{
			return;
		}

		const remoteTrack = Object.values(participant.tracks).find((track) => track.id === trackSid);
		if (!remoteTrack)
		{
			return;
		}

		this.#triggerEvents('RemoteMediaRemoved', [participant, remoteTrack]);
	}

	#trackPublicationErrorHandler(data: { trackSid?: string; err?: string; reason?: string }): void
	{
		const trackSid = data.trackSid;
		const error = data.err;
		const reason = data.reason;

		const message = `Got trackPublicationError for track ${trackSid}: ${error} (${reason})`;
		this.setLog(message, LOG_LEVEL.WARNING);
		console.warn(message);

		if (!trackSid)
		{
			this.setLog(`trackPublicationError has no trackSid`, LOG_LEVEL.ERROR);
			return;
		}

		const localTrack = this.#getLocalTrackBySid(trackSid);

		if (localTrack)
		{
			this.onPublishFailed(localTrack.source);
		}
	}

	#updateRoleHandler(data)
	{
		if (!Util.isUserControlFeatureEnabled())
		{
			return;
		}
		if (
			Number(data.toUserId) == this.#privateProperties.userId
			&& Util.getCurrentUserRole() != data.role.toUpperCase()
		)
		{
			Util.setCurrentUserRole(data.role);
			this.#setUserPermissions(data.permissions);
			this.#triggerEvents('UserRoleChanged', [data]);
		}
	}

	#userPermissionsChanged(data)
	{
		if (!Util.isUserControlFeatureEnabled())
		{
			return;
		}
		if (data.allow === true && Util.isRegularUser(Util.getCurrentUserRole()))
		{
			let permissions = Util.getUserPermissions();

			permissions.audio = data.allow;
			permissions.video = data.allow;
			permissions.screen_share = data.allow;

			Util.setUserPermissions(permissions);
		}

		this.#triggerEvents('UserPermissionsChanged', [data]);
	}

	#settingsChangedHandler(data)
	{
		if (!Util.isUserControlFeatureEnabled())
		{
			return;
		}
		data.calledFrom = 'settingsChanged';

		let newRoomSettings = Util.getRoomPermissions();
		let options = {reason: 'settings', eft: data.eft, fromUserId: data.fromUserId, track: {type: 0}};

		switch (data.act)
		{
			case 'audio':
				options.track.type = 0;
				newRoomSettings.AudioEnabled = data.roomState.AudioEnabled;
				break
			case 'video':
				options.track.type = 1;
				newRoomSettings.VideoEnabled = data.roomState.VideoEnabled;
				break
			case 'screen_share':
				options.track.type = 2;
				newRoomSettings.ScreenShareEnabled = data.roomState.ScreenShareEnabled;
				break
		}

		Util.setRoomPermissions(newRoomSettings);
		Util.updateUserPermissionByNewRoomPermission(data.act, !data.eft);

		if (data.eft === true)
		{
			this.#allParticipantsMutedHandler(options);
		}

		this.#triggerEvents('RoomSettingsChanged', [data]);
	}

	#sendSignal(signal, mediaServerId = null)
	{
		if (this.#privateProperties.socketConnection?.readyState === 1)
		{
			if (this.#privateProperties.roomType === RoomType.Small)
			{
				this.#privateProperties.socketConnection.send(JSON.stringify(signal));
			}
			else if (this.#privateProperties.roomType === RoomType.Large)
			{
				const data = {
					event: signal,
				};
				if (mediaServerId)
				{
					data.mediaServerId = mediaServerId;
				}
				this.#privateProperties.socketConnection.send(JSON.stringify(data));
			}

			return true;
		}

		return false;
	}

	#sendLeave()
	{
		checkMetricsFeatureAndExecutionCallback(() => {
			this.sendMonitoringEvents(false);
		});

		if (this.#privateProperties.socketConnection?.readyState === 1)
		{
			this.#sendSignal({
				leave: {
					reason: 'CLIENT_INITIATED',
				}
			});
		}
	}
}

class Participant
{
	#failedSubscriptions;

	name = '';
	image = '';
	userId = '';
	videoEnabled = false;
	audioEnabled = false;
	screenSharingEnabled = false;
	isSpeaking = false;
	tracks = {};
	sid = '';
	isMutedVideo = false;
	isMutedAudio = false;
	isHandRaised = false;
	videoPaused = false;
	isLocalVideoMute = true;
	streamRemovingId = {};

	constructor(participant, cameraStreamQuality)
	{
		this.name = participant?.name || '';
		this.image = participant?.image || '';
		this.userId = participant?.userId || '';
		this.sid = participant?.sid || '';
		this.mediaServerId = null;
		this.videoEnabled = participant?.videoEnabled || false;
		this.audioEnabled = participant?.audioEnabled || false;
		this.screenSharingEnabled = participant?.screenSharingEnabled || false;
		this.isSpeaking = participant?.isSpeaking || false;
		this.isHandRaised = participant?.isHandRaised || false;
		this.cameraStreamQuality = cameraStreamQuality || STREAM_QUALITY.HIGH;
		this.#failedSubscriptions = {};
	}

	subscribeTrack(MediaStreamKind) {};

	unsubscribeTrack(MediaStreamKind) {};

	attachTrack(MediaStreamKind) {};

	detachTrack(MediaStreamKind) {};

	disableAudio() {
		this.tracks[MediaStreamsKinds.Microphone].track.enabled = false;
		this.isMutedAudio = true;
	};

	enableAudio() {
		this.tracks[MediaStreamsKinds.Microphone].track.enabled = true;
		this.isMutedAudio = false;
	};

	disableVideo() {
		this.tracks[MediaStreamsKinds.Camera].track.enabled = false;
		this.isMutedVideo = true;
	};

	enableVideo() {
		this.tracks[MediaStreamsKinds.Camera].track.enabled = true;
		this.isMutedVideo = false;
	};

	addTrack(MediaStreamKind, Track) {
		this.tracks[MediaStreamKind] = Track;
	};

	removeTrack(MediaStreamKind, Track) {
		delete this.tracks[MediaStreamKind];
	};

	getTrack(MediaStreamKind) {
		return this.tracks?.[MediaStreamKind]
	}

	addFailedSubscription(mediaStreamKind): void
	{
		this.#failedSubscriptions[mediaStreamKind] = true;
	}

	deleteFailedSubscription(mediaStreamKind): void
	{
		delete this.#failedSubscriptions[mediaStreamKind];
	}

	hasFailedSubscription(mediaStreamKind): boolean
	{
		return Boolean(this.#failedSubscriptions[mediaStreamKind]);
	}

	setStreamQuality(quality)
	{
		if (this.tracks?.[MediaStreamsKinds.Camera] && this.tracks?.[MediaStreamsKinds.Camera]?.subscribed && !(this.cameraStreamQuality === quality || this.videoPaused))
		{
			this.cameraStreamQuality = quality;
			this.tracks[MediaStreamsKinds.Camera].track.currentVideoQuality = quality;
			return true;
		}

		return false;
	}

	setVideoWidth(videoWidth)
	{
		if (videoWidth)
		{
			this.videoWidth = videoWidth;
		}
	}

	updateSid(sid)
	{
		this.sid = sid;
	}
}
