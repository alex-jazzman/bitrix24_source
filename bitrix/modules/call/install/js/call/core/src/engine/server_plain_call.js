import { Event, Loc, Type, Runtime } from 'main.core';

import {AbstractCall} from './abstract_call';
import { CallEngine, CallState, CallEvent, UserState, Provider, DisconnectReason } from './engine';
import {View} from '../view/view';
import { MediaRenderer } from '../view/media-renderer';
import {SimpleVAD} from './simple_vad';
import {Hardware} from '../call_hardware';
import Util from '../util';
import {
	Call,
	CALL_STATE,
	MediaStreamsKinds,
	RecorderStatus,
	CloudRecordStatus,
	ConnectionType,
} from '../call_api.js';
import { CallStreamManager } from '../media-stream-manager';
import { CallCommonRecordState, CallCommonRecordType } from '../call_common_record';
import { CallSettingsManager } from 'call.lib.settings-manager';

const ajaxActions = {
	decline: 'call.Call.decline',
};

const clientEvents = {
	negotiationNeeded: 'Call::negotiationNeeded',
	connectionOffer: 'Call::connectionOffer',
	connectionAnswer: 'Call::connectionAnswer',
	iceCandidate: 'Call::iceCandidate',
	voiceStarted: 'Call::voiceStarted',
	voiceStopped: 'Call::voiceStopped',
	commonRecordState: 'Call::commonRecordState',
	microphoneState: 'Call::microphoneState',
	cameraState: 'Call::cameraState',
	videoPaused: 'Call::videoPaused',
	customMessage: 'Call::customMessage',
	usersInvited: 'Call::usersInvited',
	userInviteTimeout: 'Call::userInviteTimeout',
};

const defaultConnectionOptions = {
	offerToReceiveVideo: true,
	offerToReceiveAudio: true
};

const signalingConnectionRefreshPeriod = 30000;
const signalingWaitReplyPeriod = 10000;
//var signalingWaitReplyPeriod = 5000;
const invitePeriod = 30000;
const reinvitePeriod = 5500;

/**
 * Implements Call interface
 * Public methods:
 * - inviteUsers
 * - cancel
 * - answer
 * - decline
 * - hangup
 * - setMuted
 * - setVideoEnabled
 * - setCameraId
 * - setMicrophoneId
 *
 * Events:
 * - onCallStateChanged //not sure about this.
 * - onUserStateChanged
 * - onUserVoiceStarted
 * - onUserVoiceStopped
 * - onLocalMediaReceived
 * - onLocalMediaStopped
 * - onLocalMediaError
 * - onDeviceListUpdated
 * - onDestroy
 */

export class ServerPlainCall extends AbstractCall
{
	peers: { [key: number]: Peer };

	#isCloudRecordFeaturesEnabled: false;
	#cloudRecordState;

	#recorderState;
	#recorderStateHasChange;
	#copilotInitiator: boolean;

	#connectionType: boolean;

	#screenShared: boolean;

	#onUnloadHandler: Function;
	#onOnlineHandler: Function;

	constructor(params)
	{
		super(params)

		this.callFromMobile = params.callFromMobile;
		this.state = params.state || '';

		this.peers = this.initPeers(this.users);

		this.signaling = new Signaling({
			call: this
		});

		this.deviceList = [];

		this.turnServer = Loc.getMessage('turn_server');
		this.turnServerLogin = Loc.getMessage('turn_server_login') || 'bitrix';
		this.turnServerPassword = Loc.getMessage('turn_server_password') || 'bitrix';

		this.iceServers = [
			{
				urls: `stun:${this.turnServer}`,
			},
			{
				urls: `turn:${this.turnServer}`,
				username: this.turnServerLogin,
				credential: this.turnServerPassword,
			},
		];

		this.userData = params.userData;

		this.#onUnloadHandler = this.#onUnload.bind(this);
		this.#onOnlineHandler = this.#onOnline.bind(this);

		this.enableMicAutoParameters = params.enableMicAutoParameters !== false;
		this.microphoneLevelInterval = null;
		this.mediaMutedBySystem = false;

		this.CallApi = null;
		this.#connectionType = ConnectionType.PeerToPeer;

		this._reconnectionEventCount = 0;
		this.waitForAnswerTimeout = null;

		this.#isCloudRecordFeaturesEnabled = CallSettingsManager.plainCallCloudRecordingEnabled;

		this.#cloudRecordState = CloudRecordStatus.NONE;

		this.#recorderState = RecorderStatus.UNAVAILABLE;
		this.#copilotInitiator = false;

		this.#recorderStateHasChange = false;
		this._isCopilotFeaturesEnabled = CallSettingsManager.plainCallFollowUpEnabled;

		this.#screenShared = false;

		Event.bind(window, 'unload', this.#onUnloadHandler);
		Event.bind(window, 'online', this.#onOnlineHandler);
	}

	get provider()
	{
		return Provider.Plain;
	}

	get hasConnectionData()
	{
		return Boolean(this.connectionData.mediaServerUrl && this.connectionData.roomData);
	}

	get isCopilotInitialized()
	{
		return this.#recorderState !== RecorderStatus.UNAVAILABLE || this.#recorderStateHasChange;
	}

	get isCopilotActive()
	{
		return this.#recorderState === RecorderStatus.ENABLED;
	}

	get isCopilotFeaturesEnabled()
	{
		return this._isCopilotFeaturesEnabled;
	}

	set isCopilotFeaturesEnabled(isCopilotFeaturesEnabled)
	{
		if (isCopilotFeaturesEnabled !== this._isCopilotFeaturesEnabled)
		{
			this._isCopilotFeaturesEnabled = isCopilotFeaturesEnabled;
		}
	}

	get isCopilotInitiator(): boolean
	{
		return this.#copilotInitiator;
	}

	/**
	 * @group CommonRecord
	 */
	get isCloudRecordFeaturesEnabled()
	{
		return this.#isCloudRecordFeaturesEnabled;
	}

	/**
	 * @group CommonRecord
	 */
	set isCloudRecordFeaturesEnabled(isCloudRecordFeaturesEnabled)
	{
		if (isCloudRecordFeaturesEnabled !== this.#isCloudRecordFeaturesEnabled)
		{
			this.#isCloudRecordFeaturesEnabled = isCloudRecordFeaturesEnabled;
		}
	}

	/**
	 * @group CommonRecord
	 */
	get isCloudRecordActive()
	{
		return this.#cloudRecordState === CloudRecordStatus.STARTED;
	}

	get useMediaServer(): boolean
	{
		return this.#connectionType === ConnectionType.MediaServer;
	}

	initPeers(userIds)
	{
		let peers = {};
		for (let i = 0; i < userIds.length; i++)
		{
			const userId = Number(userIds[i]);
			if (userId == this.userId)
			{
				continue;
			}

			peers[userId] = this.createPeer(userId);
		}
		return peers;
	};

	createPeer(userId)
	{
		return new Peer({
			call: this,
			userId: userId,
			ready: userId == this.initiatorId,
			signalingConnected: userId == this.initiatorId,
			isLegacyMobile: userId == this.initiatorId && this.callFromMobile,

			onMediaReceived: (e) =>
			{
				this.runCallback(CallEvent.onRemoteMediaReceived, e);
			},
			onMediaStopped: (e) =>
			{
				this.runCallback(CallEvent.onRemoteMediaStopped, e);
			},
			onStateChanged: this.#onPeerStateChanged.bind(this),
			onInviteTimeout: this.#onPeerInviteTimeout.bind(this),
			onRTCStatsReceived: this.#onPeerRTCStatsReceived.bind(this),
			onRTCQualityChanged: this.#onPeerRTCQualityChanged.bind(this),
			onNetworkProblem: (e) =>
			{
				this.runCallback(CallEvent.onNetworkProblem, e)
			},
			onReconnecting: (event) => {
				this.#onCallReconnecting(event);
			},
			onReconnected: () =>
			{
				this.#onCallReconnected();
			},
			onUpdateLastUsedCameraId: () =>
			{
				this.runCallback(CallEvent.onUpdateLastUsedCameraId);
			}
		});
	};

	/**
	 * Returns call participants and their states
	 * @return {object} userId => user state
	 */
	getUsers()
	{
		let result = {};
		for (let userId in this.peers)
		{
			result[userId] = this.peers[userId].calculatedState;
		}
		return result;
	};

	isReady()
	{
		return this.ready;
	};

	setVideoEnabled = (event) => {
		if (this.videoEnabled == event.data.isCameraOn)
		{
			return;
		}

		const tag = 'main';
		this.videoEnabled = event.data.isCameraOn;
		const hasVideoTracks = this.localStreams[tag] && this.localStreams[tag].getVideoTracks().length > 0;

		if (this.ready && hasVideoTracks !== this.videoEnabled)
		{
			if (!this.videoEnabled)
			{
				CallStreamManager.stopStream(MediaStreamsKinds.Camera);
			}

			this.replaceLocalMediaStream().then(() => {
				this.signaling.sendCameraState(this.users, this.videoEnabled);
			}).catch(() => {
				const kind = Util.MediaKind[MediaStreamsKinds.Camera];
				const mediaRenderer = new MediaRenderer({ kind });

				this.runCallback(CallEvent.onLocalMediaReceived, {
					tag,
					mediaRenderer,
					stream: mediaRenderer.stream,
				});
			});
		}
	};

	canChangeMediaDevices()
	{
		return !this.mediaMutedBySystem && !this.CallApi?.isMediaMutedBySystem;
	}

	setMuted = (event) => {
		if (this.muted === event.data.isMicrophoneMuted)
		{
			return;
		}

		this.muted = event.data.isMicrophoneMuted;
		const tag = 'main';
		const audioTrack = this.localStreams[tag]?.getAudioTracks()?.[0];

		if (this.muted && this.CallApi.isAudioPublished())
		{
			this.CallApi.disableAudio({ calledFrom: 'setMuted' });
		}
		else if (!this.muted)
		{
			this.CallApi.enableAudio({ calledFrom: 'setMuted' });
		}

		if (audioTrack)
		{
			audioTrack.enabled = !this.muted;
		}

		this.signaling.sendMicrophoneState(this.users, !this.muted);
		this.sendTalkingState();
	};

	setCameraId(cameraId)
	{
		if (this.cameraId === cameraId)
		{
			return;
		}

		this.cameraId = cameraId;
		void this.CallApi?.switchActiveVideoDevice(this.cameraId);

		if (this.ready && this.mediaMutedBySystem)
		{
			this.runCallback(CallEvent.onNeedResetMediaDevicesState);
			this.changedMediaMutedBySystem(false);
		}
		else if (this.ready && Hardware.isCameraOn)
		{
			this.runCallback('onUpdateLastUsedCameraId');
			Runtime.debounce(this.replaceLocalMediaStream, 100, this)();
		}
	}

	setMicrophoneId(microphoneId)
	{
		if (this.microphoneId === microphoneId)
		{
			return;
		}

		this.microphoneId = microphoneId;
		void this.CallApi?.switchActiveAudioDevice(this.microphoneId);

		if (this.ready)
		{
			if (this.mediaMutedBySystem)
			{
				return;
			}
			Runtime.debounce(this.replaceLocalAudioStream, 100, this)();
		}
	}

	setUseMediaServer(useMediaServer)
	{
		if (useMediaServer && !this.useMediaServer)
		{
			this.#connectionType = ConnectionType.MediaServer;
		}
		else if (!useMediaServer && this.useMediaServer)
		{
			this.#connectionType = ConnectionType.PeerToPeer;
		}
		else
		{
			return;
		}

		if (this.CallApi)
		{
			this.CallApi.switchConnectionType(this.#connectionType);
		}
		this.#updateOutgoingTracks();

		if (!useMediaServer)
		{
			this.setRecorderState(RecorderStatus.PAUSED);
		}
	}

	getCurrentMicrophoneId()
	{
		if (!this.localStreams['main'])
		{
			return this.microphoneId;
		}

		const audioTracks = this.localStreams['main'].getAudioTracks();
		if (audioTracks.length > 0)
		{
			const audioTrackSettings = audioTracks[0].getSettings();
			return audioTrackSettings.deviceId;
		}
		else
		{
			return this.microphoneId;
		}
	};

	/**
	 * @param { Object } commonRecordState
	 * @param { string } commonRecordState.action
	 * @param { string } commonRecordState.type
	 * @param { Date } commonRecordState.date
	 */
	sendLocalRecordState(commonRecordState)
	{
		if (!this.updateCommonRecordState({ ...commonRecordState, senderId: this.userId }))
		{
			return;
		}

		const users = [this.userId, ...this.users];

		this.signaling.sendLocalRecordState(users, this.commonRecordState);
	}

	stopSendingStream(tag)
	{
		//todo: implement
	};

	allowVideoFrom(userList)
	{
		//todo: implement
	};

	/**
	 * Invites users to participate in the call.
	 **/
	inviteUsers(config: {users: number[], localStream: MediaStream, show?: boolean} = {})
	{
		const users = Type.isArray(config.users) ? config.users : Object.keys(this.peers);
		this.ready = true;

		if (config.localStream instanceof MediaStream && !this.localStreams["main"])
		{
			this.localStreams["main"] = config.localStream;
		}

		this.subscribeHardwareChanges();

		this.getLocalMediaStream("main", true)
			.then(() =>
			{
				return this.attachToConference();
			})
			.then(() =>
			{
				if (!this.ready)
				{
					this.#beforeLeaveCall();
					return;
				}

				clearTimeout(this.waitForAnswerTimeout);
				this.waitForAnswerTimeout = setTimeout(() =>
				{
					this.#onNoAnswer();
				}, invitePeriod);

				for (let i = 0; i < users.length; i++)
				{
					const userId = Number(users[i]);
					if (!this.peers[userId])
					{
						this.peers[userId] = this.createPeer(userId);
					}
					this.peers[userId].onInvited();
				}

				if (config.userData && config.show)
				{
					this.signaling.sendUsersInvited({
						users: config.userData,
					});
				}
			})
			.catch((e) =>
			{
				console.error(e);
				this.#beforeLeaveCall();
				this.runCallback(CallEvent.onCallFailure, e);
			});
	};

	attachToConference()
	{
		if (this.CallApi && this.CallApi.getState() === CALL_STATE.CONNECTED)
		{
			return Promise.resolve();
		}

		return new Promise((resolve, reject) =>
		{
			try
			{
				this.CallApi = new Call(this.userId);
				this.CallApi.needToStopStreams = false;

				if (!this.CallApi)
				{
					this.log("Error: could not create Plain call");
					return reject({code: "PLAIN_NO_CALL"});
				}

				this.bindCallEvents();

				this.CallApi.on('Connected', () =>
				{
					this.CallApi.on('Failed', this.#onCallDisconnected);

					this.state = CallState.Connected;
					this.runCallback(CallEvent.onJoin, {
						local: true
					});

					resolve();
				});

				this.CallApi.on('Failed', (e) =>
				{
					reject(e);
				});

				if (!this.ready)
				{
					return reject({code: "PLAIN_NO_CALL"});
				}

				this.CallApi.connect({
					roomId: this.uuid,
					userId: this.userId,
					videoBitrate: 1_000_000,
					videoSimulcast: true,
					audioDeviceId: this.microphoneId,
					videoDeviceId: this.cameraId,
					...this.connectionData,
				});
			}
			catch (e)
			{
				reject(e);
			}
		});
	};

	bindCallEvents(): void
	{
		this.CallApi.on('ParticipantJoined', this.#onParticipantJoined);
		this.CallApi.on('ParticipantLeaved', this.#onParticipantLeaved);
		this.CallApi.on('ParticipantReconnecting', this.#onParticipantReconnecting);
		this.CallApi.on('ParticipantReconnected', this.#onParticipantReconnected);
		this.CallApi.on('MessageReceived', this.#onCallMessageReceived);
		this.CallApi.on('PublishSucceed', this.#onLocalMediaRendererAdded);
		this.CallApi.on('PublishPaused', this.#onLocalMediaRendererMuteToggled);
		this.CallApi.on('MediaMutedBySystem', this.#onMediaMutedBySystem);
		this.CallApi.on('ToggleRemoteParticipantVideo', this.#onToggleRemoteParticipantVideo);
		this.CallApi.on('TrackSubscriptionFailed', this.#onTrackSubscriptionFailed);
		this.CallApi.on('RemoteMediaAdded', this.#onRemoteMediaAdded);
		this.CallApi.on('RemoteMediaRemoved', this.#onRemoteMediaRemoved);
		this.CallApi.on('RemoteMediaMuted', this.#onRemoteMediaMuteToggled);
		this.CallApi.on('RemoteMediaUnmuted', this.#onRemoteMediaMuteToggled);
		this.CallApi.on('VoiceStarted', this.#onEndpointVoiceStart);
		this.CallApi.on('VoiceEnded', this.#onEndpointVoiceEnd);
		this.CallApi.on('RecorderStatusChanged', this.#onRecorderStatusChanged);
		this.CallApi.on('CloudRecordStatusChanged', this.#onCloudRecordStatusChanged);
		this.CallApi.on('Reconnecting', this.#onCallReconnecting);
		this.CallApi.on('Reconnected', this.#onCallReconnected);
		this.CallApi.on('ReconnectingFailed', this.#onCallReconnectingFailed);
		this.CallApi.on('Disconnected', this.#onCallDisconnected);
		this.CallApi.on('CallStatsReceived', this.#onCallStatsReceived);
		this.CallApi.on('ConnectionQualityChanged', this.#onConnectionQualityChanged);
		this.CallApi.on('ConnectionTypeChanged', this.#onConnectionTypeChanged);
	}

	removeCallEvents(): void
	{
		if (this.CallApi)
		{
			this.CallApi.on('ParticipantJoined', BX.DoNothing);
			this.CallApi.on('ParticipantLeaved', BX.DoNothing);
			this.CallApi.on('ParticipantReconnecting', BX.DoNothing);
			this.CallApi.on('ParticipantReconnected', BX.DoNothing);
			this.CallApi.on('MessageReceived', BX.DoNothing);
			this.CallApi.on('PublishSucceed', BX.DoNothing);
			this.CallApi.on('PublishPaused', BX.DoNothing);
			this.CallApi.on('MediaMutedBySystem', BX.DoNothing);
			this.CallApi.on('ToggleRemoteParticipantVideo', BX.DoNothing);
			this.CallApi.on('TrackSubscriptionFailed', BX.DoNothing);
			this.CallApi.on('RemoteMediaAdded', BX.DoNothing);
			this.CallApi.on('RemoteMediaRemoved', BX.DoNothing);
			this.CallApi.on('RemoteMediaMuted', BX.DoNothing);
			this.CallApi.on('RemoteMediaUnmuted', BX.DoNothing);
			this.CallApi.on('VoiceStarted', BX.DoNothing);
			this.CallApi.on('VoiceEnded', BX.DoNothing);
			this.CallApi.on('RecorderStatusChanged', BX.DoNothing);
			this.CallApi.on('CloudRecordStatusChanged', BX.DoNothing);
			this.CallApi.on('Reconnecting', BX.DoNothing);
			this.CallApi.on('Reconnected', BX.DoNothing);
			this.CallApi.on('ReconnectingFailed', BX.DoNothing);
			this.CallApi.on('Disconnected', BX.DoNothing);
			this.CallApi.on('CallStatsReceived', this.#onCallStatsReceived);
			this.CallApi.on('ConnectionQualityChanged', BX.DoNothing);
			this.CallApi.on('Failed', BX.DoNothing);
			this.CallApi.on('ConnectionTypeChanged', BX.DoNothing);
		}
	}

	subscribeHardwareChanges()
	{
		Hardware.subscribe(Hardware.Events.onChangeMicrophoneMuted, this.setMuted);
		Hardware.subscribe(Hardware.Events.onChangeCameraOn, this.setVideoEnabled);
	};

	unsubscribeHardwareChanges()
	{
		Hardware.unsubscribe(Hardware.Events.onChangeMicrophoneMuted, this.setMuted);
		Hardware.unsubscribe(Hardware.Events.onChangeCameraOn, this.setVideoEnabled);
	};

	getMediaConstraints(options = {})
	{
		const audio = {};
		const video = options.videoEnabled ? {} : false;
		const hdVideo = !!options.hdVideo;
		const supportedConstraints = navigator.mediaDevices.getSupportedConstraints ? navigator.mediaDevices.getSupportedConstraints() : {};

		if (this.microphoneId)
		{
			audio.deviceId = { exact: this.microphoneId };
		}

		if (!this.enableMicAutoParameters)
		{
			if (supportedConstraints.echoCancellation)
			{
				audio.echoCancellation = false;
			}
			if (supportedConstraints.noiseSuppression)
			{
				audio.noiseSuppression = false;
			}
			if (supportedConstraints.autoGainControl)
			{
				audio.autoGainControl = false;
			}
		}

		if (video)
		{
			//video.aspectRatio = 1.7777777778;
			if (this.cameraId)
			{
				video.deviceId = {exact: this.cameraId};
			}

			if (hdVideo)
			{
				video.width = {ideal: 1280};
				video.height = {ideal: 720};
			}
		}

		return {audio: audio, video: video};
	};

	/**
	 * Recursively tries to get user media stream with array of constraints
	 *
	 * @param constraintsArray array of constraints objects
	 * @returns {Promise}
	 */
	async getUserMedia(constraintsArray): Promise<MediaStream>
	{
		const currentConstraints = constraintsArray[0];

		try
		{
			return await CallStreamManager.getUserMedia(currentConstraints);
		}
		catch (error)
		{
			this.log('getUserMedia error: ', error);
			this.log('Current constraints', currentConstraints);

			if (constraintsArray.length > 1)
			{
				return this.getUserMedia(constraintsArray.slice(1));
			}

			this.log('Last fallback constraints used, failing');
			throw error;
		}
	}

	getLocalMediaStream(tag, fallbackToAudio)
	{
		if (!Type.isStringFilled(tag))
		{
			tag = 'main';
		}

		if (this.localStreams[tag])
		{
			const track = CallStreamManager.getLocalStream(MediaStreamsKinds.Camera);
			const kind = Util.MediaKind[MediaStreamsKinds.Camera];
			const mediaRenderer = new MediaRenderer({ kind, track });

			this.runCallback(CallEvent.onLocalMediaReceived, {
				tag,
				mediaRenderer,
				stream: mediaRenderer.stream,
			});

			return Promise.resolve(this.localStreams[tag]);
		}

		this.log('Requesting access to media devices');

		return new Promise((resolve, reject) => {
			const constraintsArray = [];
			if (Hardware.isCameraOn)
			{
				constraintsArray.push(
					this.getMediaConstraints({ videoEnabled: true, hdVideo: true }),
					this.getMediaConstraints({ videoEnabled: true, hdVideo: false }),
				);

				if (fallbackToAudio)
				{
					constraintsArray.push(this.getMediaConstraints({ videoEnabled: false }));
				}
			}
			else
			{
				constraintsArray.push(this.getMediaConstraints({ videoEnabled: false }));
			}

			this.getUserMedia(constraintsArray).then((mediaStream) => {
				this.log('Local media stream received');
				const stream = mediaStream.clone();
				this.localStreams[tag] = stream;
				stream.getVideoTracks().forEach((track) => {
					track.addEventListener('ended', () => this.onLocalVideoTrackEnded());
					track.addEventListener('mute', () => this.onLocalVideoTrackMute());
					track.addEventListener('unmute', () => this.onLocalVideoTrackUnmute());
				});

				stream.getAudioTracks().forEach((track) => {
					track.addEventListener('ended', () => this.onLocalAudioTrackEnded());
				});

				const track = CallStreamManager.getLocalStream(MediaStreamsKinds.Camera);
				const kind = Util.MediaKind[MediaStreamsKinds.Camera];
				const mediaRenderer = new MediaRenderer({ kind, track });

				this.runCallback(CallEvent.onLocalMediaReceived, {
					tag,
					mediaRenderer,
					stream: mediaRenderer.stream,
				});
				this.setPublishingState(MediaStreamsKinds.Camera, true);

				if (tag === 'main')
				{
					this.attachVoiceDetection();
					if (Hardware.isMicrophoneMuted)
					{
						const audioTracks = stream.getAudioTracks();
						if (audioTracks[0])
						{
							audioTracks[0].enabled = false;
						}
					}
				}

				if (this.deviceList.length === 0)
				{
					Hardware.getCurrentDeviceList().then((deviceList) => {
						this.deviceList = deviceList;
						this.runCallback(CallEvent.onDeviceListUpdated, {
							deviceList: this.deviceList,
						});
					});
				}

				resolve(this.localStreams[tag]);
			}).catch((error) => {
				this.log('Could not get local media stream.', error);
				this.log('Request constraints: .', constraintsArray);
				this.runCallback('onLocalMediaError', { tag, error });
				reject(error);
			});
		});
	}

	getLocalAudioStream(tag, fallbackToAudio)
	{
		if (!Type.isStringFilled(tag))
		{
			tag = 'main';
		}
		if (this.localStreams[tag] && this.localStreams[tag].getAudioTracks().length)
		{
			return Promise.resolve(this.localStreams[tag]);
		}

		this.log("Requesting access to audio devices");

		return new Promise((resolve, reject) =>
		{
			let constraintsArray = [this.getMediaConstraints({videoEnabled: false})];

			this.getUserMedia(constraintsArray).then((stream) =>
			{
				this.log("Local audio stream received");

				if (!this.localStreams[tag]) {
					this.localStreams[tag] = new MediaStream();
				}

				this.localStreams[tag].addTrack(stream.getAudioTracks()[0]);
				stream.getAudioTracks().forEach((track) =>
				{
					track.addEventListener("ended", () => this.onLocalAudioTrackEnded())
				});

				if (tag === 'main')
				{
					this.attachVoiceDetection();
					if (this.muted)
					{
						const audioTracks = stream.getAudioTracks();
						if (audioTracks[0])
						{
							audioTracks[0].enabled = false;
						}
					}
				}
				if (this.deviceList.length === 0)
				{
					Hardware.getCurrentDeviceList().then((deviceList) =>
					{
						this.deviceList = deviceList;
						this.runCallback(CallEvent.onDeviceListUpdated, {
							deviceList: this.deviceList
						})
					});
				}

				resolve(this.localStreams[tag]);
			}).catch((e) =>
			{
				this.log("Could not get local audio stream.", e);
				this.log("Request constraints: .", constraintsArray);
				this.runCallback("onLocalMediaError", {
					tag: tag,
					error: e
				});
				reject(e);
			});
		})
	};

	setRecorderState(state)
	{
		if (!this.CallApi || this.#recorderState === state)
		{
			return;
		}

		if (state === RecorderStatus.ENABLED)
		{
			this.#copilotInitiator = true;
		}
		else if (state === RecorderStatus.DISABLED && state === RecorderStatus.DESTROYED)
		{
			this.#copilotInitiator = false;
		}

		if (state === RecorderStatus.ENABLED && !this.useMediaServer)
		{
			this.setUseMediaServer(true);
		}

		this.CallApi.setRecorderState(state);
	}

	/**
	 * @group CommonRecord
	 */
	setCloudRecordState(state, kind = null)
	{
		if (!this.CallApi || this.#cloudRecordState === state)
		{
			return;
		}

		if (state === CloudRecordStatus.STARTED && !this.useMediaServer)
		{
			this.setUseMediaServer(true);
		}

		this.CallApi.setCloudRecordState(state, kind);
	}

	setPublishingState(deviceType, publishing)
	{
		if (deviceType === MediaStreamsKinds.Camera)
		{
			this.runCallback(CallEvent.onCameraPublishing, {
				publishing
			});
		}
		else if (deviceType === MediaStreamsKinds.Microphone)
		{
			this.runCallback(CallEvent.onMicrophonePublishing, {
				publishing
			});
		}
	}

	setMainStream(users)
	{
		if (!this.CallApi)
		{
			return;
		}

		if (users.userId && users.userId !== this.userId)
		{
			const participant = this.peers[users.userId]?.participant;
			const kind = participant?.screenSharingEnabled ? MediaStreamsKinds.Screen : MediaStreamsKinds.Camera;
			this.CallApi.setMainStream(users, kind);
		}
		else
		{
			this.CallApi.resetMainStream(users);
		}
	}

	startMediaCapture()
	{
		return this.getLocalMediaStream();
	};

	attachVoiceDetection()
	{
		if (this.voiceDetection)
		{
			this.voiceDetection.destroy();
		}
		if (this.microphoneLevelInterval)
		{
			clearInterval(this.microphoneLevelInterval);
		}

		try
		{
			this.voiceDetection = new SimpleVAD({
				mediaStream: this.localStreams['main'],
				onVoiceStarted: this.onLocalVoiceStarted.bind(this),
				onVoiceStopped: this.onLocalVoiceStopped.bind(this)
			})

			this.microphoneLevelInterval = setInterval(function ()
			{
				this.microphoneLevel = this.voiceDetection.currentVolume;
			}.bind(this), 200)
		} catch (e)
		{
			this.log('Could not attach voice detection to media stream');
		}
	};

	getDisplayMedia(): Promise<MediaStream>
	{
		return new Promise((resolve, reject) => {
			CallStreamManager.getUserScreen().then((stream) => {
				resolve(stream);
			}).catch((error) => {
				reject(error);
			});
		});
	}

	startScreenSharing(changeSource: boolean): void
	{
		if (this.localStreams.screen && !changeSource)
		{
			return;
		}

		this.getDisplayMedia().then((mediaStream) => {
			this.#screenShared = true;
			const stream = mediaStream.clone();
			this.localStreams.screen = stream;

			stream.getVideoTracks().forEach((track) => {
				Event.bind(track, 'ended', () => this.stopScreenSharing());
			});

			this.runCallback(CallEvent.onUserScreenState, {
				userId: this.userId,
				screenState: true,
			});

			if (this.ready)
			{
				const peers = Object.values(this.peers);
				peers.forEach((peer) => {
					if (peer.calculatedState === UserState.Connected)
					{
						peer.sendMedia();
					}
				});
			}
		}).catch((error) => {
			this.log(error);
		});
	}

	onLocalVideoTrackEnded()
	{
		const tag = 'main';
		if (!this.localStreams[tag])
		{
			return;
		}

		this.#screenShared = false;
		Util.stopMediaStreamVideoTracks(this.localStreams[tag]);

		const kind = Util.MediaKind[MediaStreamsKinds.Camera];
		const mediaRenderer = new MediaRenderer({ kind });

		this.runCallback(CallEvent.onLocalMediaReceived, {
			tag,
			mediaRenderer,
			stream: mediaRenderer.stream,
		});

		if (this.localStreams[tag].getAudioTracks().length === 0)
		{
			this.localStreams[tag] = null;
		}

		for (let userId in this.peers)
		{
			if (this.peers[userId].calculatedState === UserState.Connected)
			{
				this.peers[userId].sendMedia();
			}
		}
	}

	onLocalAudioTrackEnded()
	{
		if (!this.localStreams.main)
		{
			return;
		}

		Util.stopMediaStreamAudioTracks(this.localStreams.main);

		if (this.localStreams.main.getVideoTracks().length === 0)
		{
			this.localStreams.main = null;
		}

		Object.values(this.peers).forEach((peer) => {
			if (peer.calculatedState === UserState.Connected)
			{
				peer.sendMedia();
			}
		});
	}

	onLocalVideoTrackMute()
	{
		this.changedMediaMutedBySystem(true);
		this.prevMainStream = this.localStreams['main'];

		if (this.ready)
		{
			this.localStreams['main'] = null;
			for (let userId in this.peers)
			{
				if (this.peers[userId].isReady())
				{
					this.peers[userId].replaceMediaStream('main');
				}
			}
		}
	};

	onLocalVideoTrackUnmute()
	{
		this.changedMediaMutedBySystem(false);

		if (this.prevMainStream)
		{
			Util.stopMediaStream(this.prevMainStream);
			this.prevMainStream = null;
		}

		this.replaceLocalMediaStream().catch(() =>
		{
			const track = CallStreamManager.getLocalStream(MediaStreamsKinds.Camera);
			const kind = Util.MediaKind[MediaStreamsKinds.Camera];
			const mediaRenderer = new MediaRenderer({ kind, track });

			this.runCallback(CallEvent.onLocalMediaReceived, {
				tag: 'main',
				mediaRenderer,
				stream: mediaRenderer.stream,
			});
		});
	};

	changedMediaMutedBySystem(muted)
	{
		if (muted === this.mediaMutedBySystem)
		{
			return;
		}

		this.mediaMutedBySystem = muted;
		this.#onMediaMutedBySystem(muted);
	}

	stopScreenSharing()
	{
		const tag = 'screen';
		const stream = this.localStreams[tag];

		if (!stream)
		{
			return;
		}

		this.#screenShared = false;
		Util.stopMediaStream(stream);
		CallStreamManager.stopStream(MediaStreamsKinds.Screen);
		CallStreamManager.stopStream(MediaStreamsKinds.ScreenAudio);

		this.localStreams[tag] = null;
		this.runCallback(CallEvent.onUserScreenState, {
			userId: this.userId,
			screenState: false,
		});

		Object.values(this.peers).forEach((peer: Peer) => {
			if (peer.calculatedState === UserState.Connected)
			{
				peer.sendMedia();
			}
		});
	}

	isScreenSharingStarted(): boolean
	{
		return this.#screenShared;
	}

	onLocalVoiceStarted()
	{
		this.talking = true;
		this.sendTalkingState();
	};

	onLocalVoiceStopped()
	{
		this.talking = false;
		this.sendTalkingState();
	};

	sendTalkingState()
	{
		if (this.talking && !Hardware.isMicrophoneMuted)
		{
			this.runCallback(CallEvent.onUserVoiceStarted, {
				userId: this.userId,
				local: true
			});
			this.signaling.sendVoiceStarted({
				userId: this.users
			});
		}
		else
		{
			this.runCallback(CallEvent.onUserVoiceStopped, {
				userId: this.userId,
				local: true
			});
			this.signaling.sendVoiceStopped({
				userId: this.users
			});
		}
	}

	/**
	 * @group CommonRecord
	 * @param { Object } commonRecordState
	 * @param { string } commonRecordState.action
	 * @param { string } commonRecordState.type
	 * @param { Date } commonRecordState.date
	 * @param { boolean } force
	 */
	sendLocalRecordState(commonRecordState, force = false)
	{
		if (!force && !this.updateCommonRecordState({ ...commonRecordState, senderId: this.userId }))
		{
			return;
		}

		this.signaling.sendLocalRecordState(this.userId, this.commonRecordState);
	}

	sendCustomMessage(message)
	{
		this.signaling.sendCustomMessage({
			userId: this.users,
			message: message
		});
	}

	/**
	 * @param {Object} config
	 * @param {bool} [config.useVideo]
	 * @param {bool} [config.enableMicAutoParameters]
	 * @param {MediaStream} [config.localStream]
	 */
	answer(config)
	{
		if (!Type.isPlainObject(config))
		{
			config = {};
		}
		/*if(this.direction !== Direction.Incoming)
		{
			throw new Error('Only incoming call could be answered');
		}*/

		this.ready = true;
		this.videoEnabled = Hardware.isCameraOn;
		this.muted = Hardware.isMicrophoneMuted;
		this.enableMicAutoParameters = (config.enableMicAutoParameters !== false);

		if (config.localStream instanceof MediaStream)
		{
			this.localStreams["main"] = config.localStream;
		}

		return new Promise((resolve, reject) => {
			this.subscribeHardwareChanges();

			this.getLocalMediaStream("main", true)
				.then(() =>
				{
					return this.attachToConference();
				})
				.then(() =>
				{
					if (!this.ready)
					{
						this.#beforeLeaveCall();
						return;
					}

					resolve();
				})
				.catch((e) =>
				{
					this.#beforeLeaveCall();
					this.runCallback(CallEvent.onCallFailure, e);
					reject(e);
				});
		});
	};

	decline(code, reason)
	{
		this.ready = false;

		let data = {
			callUuid: this.uuid,
			callInstanceId: this.instanceId,
		};

		if (typeof (code) != 'undefined')
		{
			data.code = code;
		}
		if (typeof (reason) != 'undefined')
		{
			data.reason = reason;
		}

		CallEngine.getRestClient().callMethod(ajaxActions.decline, data).then(() =>
		{
			this.destroy();
		});
	};

	hangup(force: boolean = false): Promise<void>
	{
		if (!this.ready && !force)
		{
			const error = new Error('Hangup in wrong state');
			this.log(error);

			return Promise.reject(error);
		}

		const tempError = new Error();
		tempError.name = 'Call stack:';
		this.log(`Hangup received \n${tempError.stack}`);

		this.ready = false;
		this.state = CallState.Proceeding;
		this.connectionData = {};
		this.#screenShared = false;

		return new Promise((resolve, reject) => {
			const peers = Object.values(this.peers);
			peers.forEach((peer) => {
				peer.disconnect();
			});

			this.#beforeLeaveCall();

			this.runCallback(CallEvent.onLeave, { local: true });
		});
	}

	getState()
	{

	};

	replaceLocalMediaStream(tag: string = "main")
	{
		this.setPublishingState(MediaStreamsKinds.Camera, true);
		if (this.localStreams[tag])
		{
			Util.stopMediaStream(this.localStreams[tag]);
			this.localStreams[tag] = null;
		}

		return new Promise((resolve, reject) =>
		{
			this.getLocalMediaStream(tag).then(() =>
			{
				if (this.ready)
				{
					for (let userId in this.peers)
					{
						if (this.peers[userId].isReady())
						{
							this.peers[userId].replaceMediaStream(tag);
							if (this.mediaMutedBySystem)
							{
								this.changedMediaMutedBySystem(false);
							}
						}
					}
				}
				resolve();
			}).catch((e) =>
			{
				console.error('Could not get access to hardware; don\'t really know what to do. error:', e);
				reject(e);
			});
		})
	};

	replaceLocalAudioStream(tag: string = "main")
	{
		if (this.localStreams[tag])
		{
			Util.stopMediaStreamAudioTracks(this.localStreams[tag]);
		}

		return new Promise((resolve, reject) =>
		{
			this.getLocalAudioStream(tag).then(() =>
			{
				if (this.ready)
				{
					for (let userId in this.peers)
					{
						if (this.peers[userId].isReady())
						{
							this.peers[userId].replaceMediaStream(tag);
						}
					}
				}
				resolve();
			}).catch((e) =>
			{
				console.error('Could not get access to hardware; don\'t really know what to do. error:', e);
				reject(e);
			});
		})
	};

	sendAllStreams(userId)
	{
		if (!this.peers[userId])
		{
			return;
		}

		if (!this.peers[userId].isReady())
		{
			return;
		}

		for (let tag in this.localStreams)
		{
			if (this.localStreams[tag])
			{
				this.peers[userId].sendMedia();
			}
		}
	};

	#updateOutgoingTracks(): void
	{
		if (!this.ready)
		{
			return;
		}

		for (const peer of Object.values(this.peers))
		{
			if (peer.calculatedState === UserState.Connected)
			{
				peer.sendMedia();
			}
		}
	}

	isAnyoneParticipating()
	{
		for (let userId in this.peers)
		{
			if (this.peers[userId].isParticipating())
			{
				return true;
			}
		}

		return false;
	};

	getParticipatingUsers()
	{
		let result = [];
		for (let userId in this.peers)
		{
			if (this.peers[userId].isParticipating())
			{
				result.push(userId);
			}
		}
		return result;
	};

	/**
	 * Adds users, invited by you or someone else
	 * @param {Number[]} users
	 */
	addJoinedUsers(users)
	{
		for (let i = 0; i < users.length; i++)
		{
			const userId = Number(users[i]);
			if (userId == this.userId || this.peers[userId])
			{
				continue;
			}

			this.peers[userId] = this.createPeer(userId);
			if (!this.users.includes(userId))
			{
				this.users.push(userId);
			}
		}
	};

	/**
	 * Adds users, invited by you or someone else
	 * @param {Object} users
	 */
	addInvitedUsers(users)
	{
		for (let id in users)
		{
			const userId = Number(id);
			if (userId == this.userId)
			{
				continue;
			}

			if (!this.peers[userId])
			{
				this.peers[userId] = this.createPeer(userId);
				this.runCallback(CallEvent.onUserInvited, {
					userId: userId,
					userData: {[userId]: users[id]},
				});
			}

			if (this.peers[userId].calculatedState !== UserState.Calling)
			{
				this.peers[userId].onInvited();
			}

			if (!this.users.includes(userId))
			{
				this.users.push(userId);
			}
		}
	};

	#onNoAnswer()
	{
		if (this.ready && !this.isAnyoneParticipating())
		{
			this.destroy(true);
		}
	}

	__onPullEvent(command, params, extra)
	{
		const handlers = {
			'Call::answer': this.#onPullEventAnswer.bind(this),
			'Call::hangup': this.#onPullEventHangup.bind(this),
			'Call::usersJoined': this.#onPullEventUsersJoined.bind(this),
			'Call::associatedEntityReplaced': this.#onPullEventAssociatedEntityReplaced.bind(this),
			'Call::finish': this.#onPullEventFinish.bind(this),
			'Call::customMessage': this.#onPullEventCallCustomMessage.bind(this),
		};

		if (handlers[command])
		{
			if (command !== 'Call::ping')
			{
				this.log("Signaling: " + command + "; Parameters: " + JSON.stringify(params));
			}
			handlers[command].call(this, params);
		}
	};

	#onPullEventUsersJoined(params)
	{
		if (!this.ready)
		{
			return;
		}
		const users = params.users;

		this.addJoinedUsers(users);
	};

	#onPullEventUsersInvited(params)
	{
		if (!this.ready)
		{
			return;
		}
		const users = params.users;

		this.addInvitedUsers(users);
	};

	#onPullEventAnswer(params)
	{
		const senderId = Number(params.senderId);

		if (senderId == this.userId)
		{
			return this.#onPullEventAnswerSelf(params);
		}

		if (!this.ready)
		{
			return;
		}

		if (!this.peers[senderId])
		{
			return;
		}

		if (this.peers[senderId].isReady())
		{
			this.log("Received answer for user " + senderId + " in ready state, ignoring");
			return;
		}

		this.peers[senderId].setSignalingConnected(true);
		this.peers[senderId].setReady(true);
		this.peers[senderId].isLegacyMobile = params.isLegacyMobile === true;
		if (this.ready)
		{
			this.sendAllStreams(senderId);
		}
	};

	#onPullEventAnswerSelf(params)
	{
		this.runCallback('onGetUserMediaEnded', {});
		if (params.callInstanceId === this.instanceId)
		{
			return;
		}

		if (this.ready)
		{
			this.log("Received remote self-answer in ready state, ignoring");
			return;
		}

		// call was answered elsewhere
		this.log("Call was answered elsewhere");
		this.runCallback(CallEvent.onJoin, {
			local: false
		});
	};

	#onPullEventHangup(params)
	{
		const senderId = params.senderId;

		if (this.userId == senderId)
		{
			if (this.instanceId != params.callInstanceId)
			{
				// self hangup elsewhere
				this.runCallback(CallEvent.onLeave, {local: false});
			}
			return;
		}

		if (!this.peers[senderId] || this.peers[senderId].participant)
		{
			return;
		}

		this.peers[senderId].disconnect(params.code);
		this.peers[senderId].setReady(false);

		if (params.code == 603)
		{
			this.peers[senderId].setDeclined(true);
		}

		if (!this.isAnyoneParticipating() && this.ready)
		{
			this.hangup();
		}
	};

	#onPullEventNegotiationNeeded(params)
	{
		if (!this.ready)
		{
			return;
		}

		const peer: Peer = this.peers[params.senderId];
		if (!peer)
		{
			return;
		}

		peer.setReady(true);
		if (params.restart)
		{
			peer.reconnect({ reconnectionReason: 'GOT_PULL_EVENT_NEGOTIATION_NEEDED' });
		}
		else
		{
			peer.onNegotiationNeeded();
		}
	};

	#onPullEventConnectionOffer(params)
	{
		if (!this.ready)
		{
			return;
		}
		const peer = this.peers[params.senderId];
		if (!peer)
		{
			return;
		}

		peer.setReady(true);
		peer.setUserAgent(params.userAgent);
		peer.setConnectionOffer(params.connectionId, params.sdp, params.tracks);
	};

	#onPullEventConnectionAnswer(params)
	{
		if (!this.ready)
		{
			return;
		}
		const peer = this.peers[params.senderId];
		if (!peer)
		{
			return;
		}

		const connectionId = params.connectionId;

		peer.setUserAgent(params.userAgent);
		peer.setConnectionAnswer(connectionId, params.sdp, params.tracks);
	};

	#onPullEventIceCandidate(params)
	{
		if (!this.ready)
		{
			return;
		}
		const peer = this.peers[params.senderId];
		let candidates;
		if (!peer)
		{
			return;
		}

		try
		{
			candidates = params.candidates;
			for (let i = 0; i < candidates.length; i++)
			{
				peer.addIceCandidate(params.connectionId, candidates[i]);
				this.log("User: " + params.senderId + "; Added remote ICE candidate: ", JSON.stringify(candidates[i]));
			}		
			
		} catch (e)
		{
			this.log('Error parsing serialized candidate: ', e);
		}
	};

	#onPullEventVoiceStarted(params)
	{
		this.runCallback(CallEvent.onUserVoiceStarted, {
			userId: params.senderId
		})
	};

	#onPullEventVoiceStopped(params)
	{
		this.runCallback(CallEvent.onUserVoiceStopped, {
			userId: params.senderId
		})
	};

	#onPullEventMicrophoneState(params)
	{
		if (params.senderId == this.userId)
		{
			return;
		}

		this.runCallback(CallEvent.onUserMicrophoneState, {
			userId: params.senderId,
			microphoneState: params.microphoneState,
		});
	}

	#onPullEventCameraState(params)
	{
		this.runCallback(CallEvent.onUserCameraState, {
			userId: params.senderId,
			cameraState: params.cameraState
		})
	};

	#onPullEventVideoPaused(params)
	{
		const peer = this.peers[params.senderId];
		if (!peer)
		{
			return;
		}

		this.runCallback(CallEvent.onUserVideoPaused, {
			userId: params.senderId,
			videoPaused: params.videoPaused
		});

		peer.holdOutgoingVideo(!!params.videoPaused);
	};

	#onPullEventRecordState(params)
	{
		this.runCallback(CallEvent.onUserCommonRecordState, {
			userId: params.senderId,
			commonRecordState: params.commonRecordState
		});
	}

	#onPullEventAssociatedEntityReplaced(params)
	{
		if (params.call && params.call.ASSOCIATED_ENTITY)
		{
			this.associatedEntity = params.call.ASSOCIATED_ENTITY;
		}
	};

	#onPullEventFinish()
	{
		this.destroy();
	};

	#onPullEventCallCustomMessage(params)
	{
		this.runCallback(CallEvent.onCustomMessage, {message: params.message});
	}

	#onPeerStateChanged(e)
	{
		this.runCallback(CallEvent.onUserStateChanged, e);

		if (e.state == UserState.Failed || e.state == UserState.Unavailable)
		{
			if (!this.isAnyoneParticipating())
			{
				this.hangup().then(this.destroy.bind(this)).catch(() =>
					{
						//this.runCallback(Event.onCallFailure, e);
						this.destroy();
					}
				);
			}
		}
		else if (e.state == UserState.Connected)
		{
			this.signaling.sendMicrophoneState([e.userId], !Hardware.isMicrophoneMuted);
			this.signaling.sendCameraState(e.userId, Hardware.isCameraOn);
			this.wasConnected = true;
		}
	};

	#onPeerInviteTimeout(e)
	{
		if (!this.ready)
		{
			return;
		}
	};

	#onPeerRTCStatsReceived(event)
	{
		if (this.useMediaServer)
		{
			return;
		}

		const remoteReportsToShow = {};
		const localReportsToShow = {};

		event.stats.forEach((report) => {
			if (report.type === 'inbound-rtp' && (report.kind === 'video' || report.kind === 'audio') && report.source)
			{
				remoteReportsToShow[report.source] = report;
			}

			if (report.type === 'outbound-rtp' && (report.kind === 'video' || report.kind === 'audio') && report.source)
			{
				localReportsToShow[report.source] = report;
			}
		});

		this.runCallback(CallEvent.onUserStatsReceived, {
			userId: event.userId,
			report: remoteReportsToShow,
		});

		this.runCallback(CallEvent.onUserStatsReceived, {
			userId: this.userId,
			report: localReportsToShow,
		});

		this.runCallback(CallEvent.onRTCStatsReceived, event);
	}

	#onPeerRTCQualityChanged(e)
	{
		this.runCallback(CallEvent.onConnectionQualityChanged, {
			userId: e.userId,
			score: e.score,
		});
	}

	#getPeerForMedia(participant, track): ?Peer
	{
		let peer = null;

		if (!participant || !track)
		{
			return peer;
		}

		const userId = participant.userId;
		const kind = Util.MediaKind[track.source];

		if (!kind)
		{
			this.log(`Unknown kind for mediaRenderer: ${track.source} for user: ${userId}`);

			return peer;
		}

		peer = this.peers[userId];

		return peer;
	}

	#onParticipantJoined = (participant) => {
		clearTimeout(this.waitForAnswerTimeout);
		const userId = parseInt(participant.userId, 10);
		let peer = this.peers[userId];

		if (!peer)
		{
			if (!this.users.includes(userId))
			{
				this.users.push(userId);
			}

			peer = this.createPeer(userId);
			peer.participant = participant;
			this.peers[userId] = peer;
		}

		this.runCallback(CallEvent.onUserJoined, {
			userId,
			userData: {
				[userId]: {
					name: participant.name,
					avatar_hr: participant.image,
					avatar: participant.image,
				},
			},
		});

		peer.setSignalingConnected(true);
		peer.setReady(true);

		if (this.ready && !peer.isInitiator())
		{
			this.log('waiting for the other side to send connection offer');
			peer.sendNegotiationNeeded(false);
		}

		if (this.commonRecordState.state !== CallCommonRecordState.Stopped && this.commonRecordState.userId === this.userId)
		{
			this.signaling.sendLocalRecordState(this.userId, this.commonRecordState);
		}
	};

	#onParticipantLeaved = (participant) => {
		const peer = this.peers[participant.userId];

		if (peer)
		{
			peer.setReady(false);
		}
	};

	#onParticipantReconnecting = (participant) => {
		const peer = this.peers[participant.userId];

		if (peer)
		{
			peer.reconnecting = true;
			peer.updateCalculatedState();
		}
	};

	#onParticipantReconnected = (participant) => {
		const peer = this.peers[participant.userId];

		if (peer && peer.reconnecting)
		{
			peer.reconnecting = false;
			peer.participant = participant;
			peer.updateCalculatedState();
		}
	};

	#onCallMessageReceived = (event) => {
		let message = '';

		try
		{
			message = JSON.parse(event.text);
			message = Util.deepParseJSON(message);
		}
		catch (error)
		{
			this.log('Could not parse scenario message.', error);

			return;
		}

		const eventName = message.eventName;

		switch (eventName)
		{
			case clientEvents.connectionOffer:
				this.#onPullEventConnectionOffer(message);
				break;

			case clientEvents.connectionAnswer:
				this.#onPullEventConnectionAnswer(message);
				break;

			case clientEvents.negotiationNeeded:
				this.#onPullEventNegotiationNeeded(message);
				break;

			case clientEvents.iceCandidate:
				this.#onPullEventIceCandidate(message);
				break;

			case clientEvents.microphoneState:
				this.#onPullEventMicrophoneState(message);
				break;

			case clientEvents.cameraState:
				this.#onPullEventCameraState(message);
				break;

			case clientEvents.voiceStarted:
				this.#onPullEventVoiceStarted(message);
				break;

			case clientEvents.voiceStopped:
				this.#onPullEventVoiceStopped(message);
				break;

			case clientEvents.videoPaused:
				this.#onPullEventVideoPaused(message);
				break;

			case clientEvents.commonRecordState:
				this.#onPullEventRecordState(message);
				break;

			case clientEvents.usersInvited:
				this.#onPullEventUsersInvited(message);
				break;

			case clientEvents.customMessage:
				this.runCallback(CallEvent.onCustomMessage, {
					message: message.message,
				});
				break;

			default:
				this.log(`Unknown scenario event ${eventName}`);
		}
	};

	#onLocalMediaRendererAdded = (event) => {
		const kind = Util.MediaKind[event];

		if (!kind || this.useMediaServer)
		{
			return;
		}

		switch (event)
		{
			case MediaStreamsKinds.Microphone:
				this.CallApi.disableAudio({ calledFrom: 'onLocalMediaRendererAdded' });
				break;

			case MediaStreamsKinds.Camera:
				this.CallApi.disableVideo({ calledFrom: 'onLocalMediaRendererAdded' });
				break;

			default:
		}
	};

	#onLocalMediaRendererMuteToggled = (source, muted) => {
		if (source === MediaStreamsKinds.Microphone)
		{
			// this.#setPublishingState(MediaStreamsKinds.Microphone, false);
			this.signaling.sendMicrophoneState(this.users, !muted);
		}
		else if (source === MediaStreamsKinds.Camera)
		{
			// this.#setPublishingState(MediaStreamsKinds.Camera, false);
		}
	};

	#onMediaMutedBySystem = (muted) => {
		const microphoneState = muted ? false : !Hardware.isMicrophoneMuted;
		const cameraState = muted ? false : Hardware.isCameraOn;
		this.signaling.sendMicrophoneState(this.users, microphoneState);
		this.signaling.sendCameraState(this.users, cameraState);
	};

	#onToggleRemoteParticipantVideo = (isVideoShown) => {
		this.runCallback(
			CallEvent.onToggleRemoteParticipantVideo,
			{ isVideoShown },
		);
	};

	#onTrackSubscriptionFailed = (params) => {
		this.runCallback(CallEvent.onTrackSubscriptionFailed, params);
	};

	#onRemoteMediaAdded = (participant, track) => {
		if (!this.useMediaServer)
		{
			return;
		}

		const peer = this.#getPeerForMedia(participant, track);

		if (!peer)
		{
			this.log(`Unknown user: ${participant.userId}`);
		}

		peer.addMediaRenderer({ track: track.track });
		this.log(`[RemoteMediaAdded]: UserId: ${participant.userId}, source: ${Util.MediaKind[track.source]}`);
	};

	#onRemoteMediaRemoved = (participant, track) => {
		if (!this.useMediaServer)
		{
			return;
		}

		const peer = this.#getPeerForMedia(participant, track);

		if (!peer)
		{
			this.log(`Unknown user: ${participant.userId}`);
		}

		peer.removeMediaRenderer({ track: track.track });
		this.log(`[RemoteMediaRemoved]: UserId: ${participant.userId}, source: ${Util.MediaKind[track.source]}`);
	};

	#onRemoteMediaMuteToggled = (participant, track) => {
		if (!this.useMediaServer)
		{
			return;
		}

		if (track.source === MediaStreamsKinds.Microphone)
		{
			const userId = parseInt(participant.userId, 10);
			const peer = this.peers[userId];
			if (peer)
			{
				peer.addMediaRenderer({ track: track.track });
			}

			this.runCallback(CallEvent.onUserMicrophoneState, {
				userId,
				microphoneState: !participant.isMutedAudio,
			});
		}
	};

	#onEndpointVoiceStart = (participant) => {
		const userId = participant.userId;

		// for local user we need to send extra signal to show unmute hint
		if (userId === this.userId)
		{
			this.runCallback(CallEvent.onUserVoiceStarted, { userId, local: true });
		}

		this.runCallback(CallEvent.onUserVoiceStarted, { userId });
	};

	#onEndpointVoiceEnd = (participant) => {
		this.runCallback(CallEvent.onUserVoiceStopped, { userId: participant.userId });
	};

	/**
	 * @param {Object} status
	 * @param {RecorderStatus} status.code
	 * @param {string} status.errMsg
	 */
	#onRecorderStatusChanged = ({ code, errMsg }) => {
		const ignoreError = [RecorderStatus.DESTROYED, RecorderStatus.UNAVAILABLE].includes(code);
		const error = ignoreError ? '' : errMsg;
		this.#recorderState = error ? this.#recorderState : code;
		const isCopilotActive = this.#recorderState === RecorderStatus.ENABLED;
		this.#recorderStateHasChange = true;

		if ([RecorderStatus.DISABLED, RecorderStatus.DESTROYED, RecorderStatus.UNAVAILABLE].includes(code))
		{
			this.#copilotInitiator = false;
		}

		this.runCallback(CallEvent.onRecorderStatusChanged, {
			code,
			error,
			isCopilotActive,
		});
	};

	/**
	 * @group CommonRecord
	 */

	/**
	 * @typedef { Object } CloudRecordStatusPause
	 * @property { string } start
	 * @property { string } end
	 */

	/**
	 * @typedef { Object } CloudRecordStatusDate
	 * @property { string } start
	 * @property { CloudRecordStatusPause[] } pauses
	 */

	/**
	 * @param {Object} status
	 * @param {number} status.code
	 * @param {string} status.errMsg
	 * @param {string} status.initiatorUserID
	 * @param {string} status.userID
	 * @param {number} status.kind
	 * @param {boolean} status.justJoined
	 * @param {CloudRecordStatusDate} status.date
	 */
	#onCloudRecordStatusChanged = (status) => {
		if (Util.isCloudRecordLogEnabled())
		{
			console.warn(`CloudRecord: videoRecorderStatus`, status);
		}

		const { code, errMsg, initiatorUserID, userID, kind, date, justJoined } = status;

		const userId = Number(userID);
		const initiatorId = Number(initiatorUserID);
		const pauses = (date.pauses ?? []).map(({ start, end }) => ({ start: new Date(start), finish: end ? new Date(end) : null }));
		const recordType = kind === 1 ? CallCommonRecordType.Audio : CallCommonRecordType.Video;

		this.#cloudRecordState = errMsg ? this.#cloudRecordState : code;

		if (errMsg)
		{
			if (Util.isCloudRecordLogEnabled())
			{
				console.error(`CloudRecord: videoRecorderStatus errMsg`, errMsg);
			}

			this.runCallback(CallEvent.onCloudRecordStatusChanged, {
				code: CloudRecordStatus.STOPPED,
				userId,
				initiatorId,
				justJoined,
				commonRecordState: { ...this.commonRecordState },
			});
		}
		else
		{
			switch (code)
			{
				case CloudRecordStatus.STARTED:
				case CloudRecordStatus.PAUSED:
				{
					this.commonRecordState.state = code === CloudRecordStatus.STARTED
						? CallCommonRecordState.Started
						: CallCommonRecordState.Paused;
					this.commonRecordState.type = recordType;
					this.commonRecordState.userId = initiatorId;
					this.commonRecordState.date.start = new Date(date.start);
					this.commonRecordState.date.pause = pauses;

					break;
				}

				case CloudRecordStatus.STOPPED:
				case CloudRecordStatus.DESTROYED:
				{
					this.commonRecordState.state = code === CloudRecordStatus.STOPPED
						? CallCommonRecordState.Stopped
						: CallCommonRecordState.Destroyed;
					this.commonRecordState.type = CallCommonRecordType.None;
					this.commonRecordState.userId = 0;
					this.commonRecordState.date.start = null;
					this.commonRecordState.date.pause = [];

					break;
				}

				default:
				{
					if (Util.isCloudRecordLogEnabled())
					{
						console.error(`Unknown record status: ${status}`);
					}

					break;
				}
			}

			this.runCallback(CallEvent.onCloudRecordStatusChanged, {
				code,
				userId,
				initiatorId,
				justJoined,
				commonRecordState: { ...this.commonRecordState },
			});
		}
	};

	#onCallReconnecting = (event) => {
		this._reconnectionEventCount++;
		const data = Type.isObject(event) ? event : {};

		this.runCallback(CallEvent.onReconnecting, {
			reconnectionEventCount: this._reconnectionEventCount,
			reconnectionReason: data.reconnectionReason,
			reconnectionReasonInfo: data.reconnectionReasonInfo,
		});
	};

	#onCallReconnected = () => {
		this._reconnectionEventCount = 0;
		this.runCallback(CallEvent.onReconnected);

		if (this.useMediaServer)
		{
			this.#updateOutgoingTracks();
		}

		if (this.commonRecordState.userId === this.userId)
		{
			this.sendLocalRecordState({ action: this.commonRecordState.state, userId: this.userId }, true);
		}
	};

	#onCallReconnectingFailed = (e, error) => {
		this.runCallback(CallEvent.onReconnectingFailed, { error });
	};

	#onCallDisconnected = (e) => {
		if (e?.leaveInformation?.reason === DisconnectReason.SecurityKeyChanged)
		{
			this.runCallback(CallEvent.onCallFailure, { name: e.leaveInformation.reason });
			return;
		}

		this.destroy();
	};

	#onCallStatsReceived = (stats) => {
		if (!this.useMediaServer)
		{
			return;
		}

		const usersToSendReports = {};
		const statsIndexByRid = { f: 2, h: 1, q: 0 };

		const processReport = (report) => {
			const { userId, kind, source, rid } = report;

			if (!userId || !['video', 'audio'].includes(kind))
			{
				return;
			}

			if (!usersToSendReports[userId])
			{
				usersToSendReports[userId] = {};
			}

			if (kind === 'audio')
			{
				usersToSendReports[userId][source] = report;

				return;
			}

			if (!usersToSendReports[userId][source])
			{
				usersToSendReports[userId][source] = [];
			}

			const index = statsIndexByRid[rid] || 0;
			usersToSendReports[userId][source][index] = report;
		};

		stats.sender.forEach((report) => {
			processReport(report);
		});

		stats.recipient.forEach((report) => {
			processReport(report);
		});

		for (const [userId, report] of Object.entries(usersToSendReports))
		{
			this.runCallback(CallEvent.onUserStatsReceived, { userId, report });
		}
	};

	#onConnectionQualityChanged = (participants) => {
		Object.keys(participants).forEach((participantId) => {
			this.runCallback(
				CallEvent.onConnectionQualityChanged,
				{
					userId: Number(participantId),
					score: participants[participantId],
				},
			);
		});
	};

	#onConnectionTypeChanged = (event) => {
		const userId = Number(event.fromUserId);
		const connectionType = Number(event.type);

		if (userId === this.userId || connectionType === this.#connectionType)
		{
			return;
		}

		this.#connectionType = connectionType;

		this.#updateOutgoingTracks();

		if (this.#recorderState === RecorderStatus.ENABLED && !this.useMediaServer)
		{
			this.setRecorderState(RecorderStatus.PAUSED);
		}
	};

	#onUnload()
	{
		if (!this.ready)
		{
			return;
		}

		for (let userId in this.peers)
		{
			this.peers[userId].disconnect();
		}
	};

	#onOnline()
	{
		const peers = Object.values(this.peers);
		peers.forEach((peer) => {
			peer.reconnect({ reconnectionReason: 'GOT_ONLINE_EVENT_FROM_BROWSER' });
		});
	}

	#beforeLeaveCall(finishCall = false)
	{
		this.removeCallEvents();
		if (this.CallApi)
		{
			this.CallApi.hangup(finishCall);
			this.CallApi = null;
		}

		// stop media streams
		this.unsubscribeHardwareChanges();

		for (const tag of Object.keys(this.localStreams))
		{
			if (this.localStreams[tag])
			{
				Util.stopMediaStream(this.localStreams[tag]);
				this.localStreams[tag] = null;
			}
		}

		if (this.prevMainStream)
		{
			Util.stopMediaStream(this.prevMainStream);
			this.prevMainStream = null;
		}

		if (this.voiceDetection)
		{
			this.voiceDetection.destroy();
			this.voiceDetection = null;
		}

		// remove all event listeners
		Event.unbind(window, 'unload', this.#onUnloadHandler);
		Event.unbind(window, 'online', this.#onOnlineHandler);

		clearInterval(this.statsInterval);
		clearInterval(this.microphoneLevelInterval);
	}

	destroy(finishCall)
	{
		this.ready = false;
		const tempError = new Error();
		tempError.name = "Call stack:";
		this.log("Call destroy \n" + tempError.stack);

		// stop sending media streams
		for (let userId in this.peers)
		{
			if (this.peers[userId])
			{
				this.peers[userId].destroy();
			}
		}

		this.#beforeLeaveCall(finishCall);
		this.runCallback(CallEvent.onLeave, { local: true });

		return super.destroy();
	}
}

class Signaling
{
	constructor(params)
	{
		this.call = params.call;
	};

	isIceTricklingAllowed()
	{
		return CallEngine.getPullClient().isPublishingSupported();
	};

	sendUsersInvited(data)
	{
		this.#sendMessage(clientEvents.usersInvited, data);
	};

	sendConnectionOffer(data)
	{
		return this.#sendMessage(clientEvents.connectionOffer, data);
	};

	sendConnectionAnswer(data)
	{
		return this.#sendMessage(clientEvents.connectionAnswer, data);
	};

	sendIceCandidate(data)
	{
		return this.#sendMessage(clientEvents.iceCandidate, data);
	};

	sendNegotiationNeeded(data)
	{
		return this.#sendMessage(clientEvents.negotiationNeeded, data);
	};

	sendVoiceStarted(data)
	{
		return this.#sendMessage(clientEvents.voiceStarted, data);
	};

	sendVoiceStopped(data)
	{
		return this.#sendMessage(clientEvents.voiceStopped, data);
	};

	sendMicrophoneState(users, microphoneState)
	{
		return this.#sendMessage(clientEvents.microphoneState, {
			userId: users,
			microphoneState: microphoneState
		});
	};

	sendCameraState(users, cameraState)
	{
		return this.#sendMessage(clientEvents.cameraState, {
			userId: users,
			cameraState: cameraState
		});
	};

	sendVideoPaused(users, videoPaused)
	{
		return this.#sendMessage(clientEvents.videoPaused, {
			userId: users,
			videoPaused: videoPaused
		});
	};

	sendUseMediaServer(users, useMediaServer)
	{
		return this.#sendMessage(clientEvents.useMediaServer, {
			useMediaServer,
			userId: users,
		});
	}

	sendLocalRecordState(users, commonRecordState)
	{
		return this.#sendMessage(clientEvents.commonRecordState, {
			userId: users,
			commonRecordState,
		});
	}

	sendCustomMessage(data)
	{
		return this.#sendMessage(clientEvents.customMessage, data);
	};

	#sendMessage(eventName, data)
	{
		if (!this.call.CallApi)
		{
			return;
		}

		const message = {
			eventName,
			requestId: Util.getUuidv4(),
			senderId: this.call.userId,
			...(Type.isPlainObject(data) ? data : {}),
		};

		this.call.CallApi.sendMessage(JSON.stringify(message));
	}

	#runRestAction(signalName, data)
	{
		if (!Type.isPlainObject(data))
		{
			data = {};
		}

		data.callUuid = this.call.uuid;
		data.callInstanceId = this.call.instanceId;
		data.requestId = Util.getUuidv4();

		this.call.log('Sending ajax-based signaling event ' + signalName + '; ' + JSON.stringify(data));
		return CallEngine.getRestClient().callMethod(signalName, data).catch(function (e) {console.error(e)});
	};
}

class Peer
{
	call: ServerPlainCall;
	peerConnection: ?RTCPeerConnection;
	peerConnectionId: ?string;
	videoSender: ?RTCRtpSender;
	audioSender: ?RTCRtpSender;
	screenSender: ?RTCRtpSender;
	screenAudioSender: ?RTCRtpSender;
	calculatedState: string;

	constructor(params)
	{
		this.call = params.call;
		this.userId = params.userId;

		this.ready = params.ready === true;
		this.calling = false;
		this.inviteTimeout = false;
		this.declined = false;
		this.busy = false;
		this.reconnecting = false;
		this.signalingConnected = params.signalingConnected === true;
		this.failureReason = '';

		this.userAgent = '';
		this.isFirefox = false;
		this.isChrome = false;
		this.isLegacyMobile = params.isLegacyMobile === true;

		/*sums up from signaling, ready and connection states*/
		this.calculatedState = this.calculateState();

		this.localStreams = {
			main: null,
			screen: null
		};

		this.pendingIceCandidates = {};
		this.localIceCandidates = [];

		this.trackList = {};

		this.callbacks = {
			onStateChanged: Type.isFunction(params.onStateChanged) ? params.onStateChanged : BX.DoNothing,
			onInviteTimeout: Type.isFunction(params.onInviteTimeout) ? params.onInviteTimeout : BX.DoNothing,
			onMediaReceived: Type.isFunction(params.onMediaReceived) ? params.onMediaReceived : BX.DoNothing,
			onMediaStopped: Type.isFunction(params.onMediaStopped) ? params.onMediaStopped : BX.DoNothing,
			onRTCStatsReceived: Type.isFunction(params.onRTCStatsReceived) ? params.onRTCStatsReceived : BX.DoNothing,
			onRTCQualityChanged: Type.isFunction(params.onRTCQualityChanged) ? params.onRTCQualityChanged : BX.DoNothing,
			onNetworkProblem: Type.isFunction(params.onNetworkProblem) ? params.onNetworkProblem : BX.DoNothing,
			onReconnecting: Type.isFunction(params.onReconnecting) ? params.onReconnecting : BX.DoNothing,
			onReconnected: Type.isFunction(params.onReconnected) ? params.onReconnected : BX.DoNothing,
			onUpdateLastUsedCameraId: Type.isFunction(params.onUpdateLastUsedCameraId) ? params.onUpdateLastUsedCameraId : BX.DoNothing,
		};

		// intervals and timeouts
		this.answerTimeout = null;
		this.callingTimeout = null;
		this.connectionTimeout = null;
		this.signalingConnectionTimeout = null;
		this.candidatesTimeout = null;

		this.statsInterval = null;

		this.connectionOfferReplyTimeout = null;
		this.negotiationNeededReplyTimeout = null;
		this.reconnectAfterDisconnectTimeout = null;

		this.connectionAttempt = 0;

		this._outgoingVideoTrack = null;
		Object.defineProperty(this, 'outgoingVideoTrack', {
			get: function ()
			{
				return this._outgoingVideoTrack;
			},
			set: function (track)
			{
				if (this._outgoingVideoTrack)
				{
					this._outgoingVideoTrack.stop();
				}
				this._outgoingVideoTrack = track;
				if (this._outgoingVideoTrack)
				{
					this._outgoingVideoTrack.enabled = !this.outgoingVideoHoldState;
				}
			}
		});
		this._outgoingScreenTrack = null;
		Object.defineProperty(this, 'outgoingScreenTrack', {
			get: function ()
			{
				return this._outgoingScreenTrack;
			},
			set: function (track)
			{
				if (this._outgoingScreenTrack)
				{
					this._outgoingScreenTrack.stop();
				}
				this._outgoingScreenTrack = track;
				if (this._outgoingScreenTrack)
				{
					this._outgoingScreenTrack.enabled = !this.outgoingVideoHoldState;
				}
			}
		});

		this._incomingAudioTrack = null;
		this._incomingScreenAudioTrack = null;
		this._incomingVideoTrack = null;
		this._incomingScreenTrack = null;
		Object.defineProperty(this, 'incomingAudioTrack', {
			get: this._mediaGetter('_incomingAudioTrack'),
			set: this._mediaSetter('_incomingAudioTrack', 'audio')
		});
		Object.defineProperty(this, 'incomingVideoTrack', {
			get: this._mediaGetter('_incomingVideoTrack'),
			set: this._mediaSetter('_incomingVideoTrack', 'video')
		});
		Object.defineProperty(this, 'incomingScreenTrack', {
			get: this._mediaGetter('_incomingScreenTrack'),
			set: this._mediaSetter('_incomingScreenTrack', 'screen')
		});
		Object.defineProperty(this, 'incomingScreenAudioTrack', {
			get: this._mediaGetter('_incomingScreenAudioTrack'),
			set: this._mediaSetter('_incomingScreenAudioTrack', 'sharingAudio')
		});

		this.outgoingVideoHoldState = false;

		// event handlers
		this._onPeerConnectionIceCandidateHandler = this._onPeerConnectionIceCandidate.bind(this);
		this._onPeerConnectionConnectionStateChangeHandler = this.#onPeerConnectionConnectionStateChange.bind(this);
		this._onPeerConnectionIceGatheringStateChangeHandler = this.#onPeerConnectionIceGatheringStateChange.bind(this);
		this._onPeerConnectionSignalingStateChangeHandler = this.#onPeerConnectionSignalingStateChange.bind(this);
		this._onPeerConnectionNegotiationNeededHandler = this.#onPeerConnectionNegotiationNeeded.bind(this);
		this._onPeerConnectionTrackHandler = this.#onPeerConnectionTrack.bind(this);
		this._onPeerConnectionRemoveStreamHandler = this.#onPeerConnectionRemoveStream.bind(this);
		this._onPeerConnectionIceCandidateErrorHandler = this.#onPeerConnectionIceCandidateError.bind(this);
		this._onPeerConnectionIceConnectionStateChangeHandler = this.#onPeerConnectionIceConnectionStateChange.bind(this);

		this._updateTracksDebounced = Runtime.debounce(this.#updateTracks.bind(this), 50);

		this._waitTurnCandidatesTimeout = null;

		this.prevPercentPacketLostList = {
			incomingPacketLost: [],
			outgoingPacketLost: [],
		};
		this.reportsForIncomingTracks = {};
		this.reportsForOutgoingTracks = {};
		this.packetLostThreshold = 7;
		this.videoBitrate = 1000000;
		this.screenShareBitrate = 1500000;
		this.maxConnectionScore = 5;
		this.incomingConnectionScore = 0;
		this.outgoingConnectionScore = 0;
	};

	_mediaGetter(trackVariable)
	{
		return function ()
		{
			return this[trackVariable]
		}.bind(this)
	};

	_mediaSetter(trackVariable, kind)
	{
		return function (track)
		{
			if (this[trackVariable] != track)
			{
				this[trackVariable] = track;
				if (track)
				{
					this.callbacks.onMediaReceived({
						userId: this.userId,
						kind: kind,
						track: track
					})
				}
				else
				{
					this.callbacks.onMediaStopped({
						userId: this.userId,
						kind: kind
					})
				}
			}
		}.bind(this)
	};

	sendMedia(skipOffer)
	{
		if (!this.peerConnection)
		{
			if (!this.isInitiator())
			{
				this.log('waiting for the other side to send connection offer');
				this.sendNegotiationNeeded(false);
				return;
			}
		}

		if (!this.peerConnection)
		{
			const connectionId = Util.getUuidv4();
			this.#createPeerConnection(connectionId);
		}
		this.updateOutgoingTracks();

		if (!skipOffer)
		{
			this.applyResolutionScale();
			this.createAndSendOffer();
		}
	};

	updateOutgoingTracks()
	{
		this.#updateDirectTracks();
		this.#updateMediaServerTracks();
	}

	#updateDirectTracks()
	{
		if (!this.peerConnection)
		{
			return;
		}

		const audioTrack = this.call.localStreams?.main?.getAudioTracks()?.[0];
		const videoTrack = this.call.localStreams?.main?.getVideoTracks()?.[0];
		const screenTrack = this.call.localStreams?.screen?.getVideoTracks()?.[0];
		const screenAudioTrack = this.call.localStreams?.screen?.getAudioTracks()?.[0];

		this.outgoingVideoTrack = videoTrack ? videoTrack.clone() : null;
		this.outgoingScreenTrack = screenTrack ? screenTrack.clone() : null;

		const tracksToSend = [];
		if (audioTrack?.readyState === 'live')
		{
			tracksToSend.push(`${audioTrack.id} (audio)`);
		}

		if (screenAudioTrack?.readyState === 'live')
		{
			tracksToSend.push(`${screenAudioTrack.id} (sharingAudio)`);
		}

		if (videoTrack)
		{
			tracksToSend.push(`${videoTrack.id} (${videoTrack.kind})`);
		}

		if (screenTrack)
		{
			tracksToSend.push(`${screenTrack.id} (${screenTrack.kind})`);
		}

		console.log(`User: ${this.userId}; Sending media streams. Tracks: ${tracksToSend.join('; ')}`);

		// if video sender found - replace track
		// if not found - add track
		if (this.videoSender && this.outgoingVideoTrack)
		{
			this.outgoingVideoTrack.enabled = !this.call.useMediaServer;
			void this.videoSender.replaceTrack(this.outgoingVideoTrack);
		}
		else if (!this.videoSender && this.outgoingVideoTrack)
		{
			this.outgoingVideoTrack.enabled = !this.call.useMediaServer;
			this.videoSender = this.peerConnection.addTrack(this.outgoingVideoTrack);
		}
		else if (this.videoSender && !this.outgoingVideoTrack)
		{
			this.peerConnection.removeTrack(this.videoSender);
			this.videoSender = null;
		}

		// if screen sender found - replace track
		// if not found - add track
		if (this.screenSender && this.outgoingScreenTrack)
		{
			this.outgoingScreenTrack.enabled = !this.call.useMediaServer;
			void this.screenSender.replaceTrack(this.outgoingScreenTrack);
		}
		else if (!this.screenSender && this.outgoingScreenTrack)
		{
			this.outgoingScreenTrack.enabled = !this.call.useMediaServer;
			this.screenSender = this.peerConnection.addTrack(this.outgoingScreenTrack);
		}
		else if (this.screenSender && !this.outgoingScreenTrack)
		{
			this.peerConnection.removeTrack(this.screenSender);
			this.screenSender = null;
		}

		// if screen sender audio found - replace track
		// if not found - add track
		if (this.screenAudioSender && screenAudioTrack)
		{
			screenAudioTrack.enabled = !this.call.useMediaServer;
			void this.screenAudioSender.replaceTrack(screenAudioTrack);
		}
		else if (!this.screenAudioSender && screenAudioTrack)
		{
			screenAudioTrack.enabled = !this.call.useMediaServer;
			this.screenAudioSender = this.peerConnection.addTrack(screenAudioTrack);
		}
		else if (this.screenAudioSender && !screenAudioTrack)
		{
			this.peerConnection.removeTrack(this.screenAudioSender);
			this.screenAudioSender = null;
		}

		// if audio sender found - replace track
		// if not found - add track
		if (this.audioSender && audioTrack)
		{
			audioTrack.enabled = !Hardware.isMicrophoneMuted && !this.call.useMediaServer;
			void this.audioSender.replaceTrack(audioTrack);
		}
		else if (!this.audioSender && audioTrack)
		{
			audioTrack.enabled = !Hardware.isMicrophoneMuted && !this.call.useMediaServer;
			this.audioSender = this.peerConnection.addTrack(audioTrack);
		}
		else if (this.audioSender && !audioTrack)
		{
			this.peerConnection.removeTrack(this.audioSender);
			this.audioSender = null;
		}
	}

	#updateMediaServerTracks(): void
	{
		if (Hardware.isCameraOn && !this.call.CallApi.isVideoPublished())
		{
			void this.call.CallApi.enableVideo({ calledFrom: 'updateOutgoingTracks' });
		}
		else if ((!this.call.useMediaServer || !Hardware.isCameraOn))
		{
			void this.call.CallApi.disableVideo({ calledFrom: 'updateOutgoingTracks' });
		}

		if (!Hardware.isMicrophoneMuted && !this.call.CallApi.isAudioPublished())
		{
			void this.call.CallApi.enableAudio({ calledFrom: 'updateOutgoingTracks' });
		}
		else if ((!this.call.useMediaServer || Hardware.isMicrophoneMuted))
		{
			void this.call.CallApi.disableAudio({ calledFrom: 'updateOutgoingTracks' });
		}

		if (this.call.isScreenSharingStarted() && this.call.useMediaServer && !this.call.CallApi.isScreenPublished())
		{
			void this.call.CallApi.startScreenShare();
		}
		else if ((!this.call.useMediaServer || !this.call.isScreenSharingStarted()))
		{
			void this.call.CallApi.stopScreenShare();
		}
	}

	getSenderMid(rtpSender: RTCRtpSender): string
	{
		if (!rtpSender || !this.peerConnection)
		{
			return null;
		}
		const transceiver = this.peerConnection.getTransceivers().find(transceiver => {
			if (transceiver.sender.track && rtpSender.track)
			{
				return transceiver.sender.track.id === rtpSender.track.id
			}
			return false
		});

		return transceiver ? transceiver.mid : null;
	};

	applyResolutionScale(factor)
	{
		if (this.videoSender)
		{
			const scaleFactor = factor || (this.screenSender ? 2 : 1);
			const rate = this.videoBitrate / scaleFactor;
			const videoParams = this.videoSender.getParameters();

			if (videoParams.encodings && videoParams.encodings.length > 0)
			{
				videoParams.encodings[0].scaleResolutionDownBy = scaleFactor;
				videoParams.encodings[0].maxBitrate = rate;
				this.videoSender.setParameters(videoParams);
			}
		}

		if (this.screenSender)
		{
			const screenParams = this.screenSender.getParameters();
			if (screenParams.encodings && screenParams.encodings.length > 0)
			{
				screenParams.encodings[0].maxBitrate = this.screenShareBitrate;
				this.screenSender.setParameters(screenParams);
			}
		}
	};

	replaceMediaStream(tag: string)
	{
		if (this.isRenegotiationSupported())
		{
			this.sendMedia();
		}
		else
		{
			this.localStreams[tag] = this.call.getLocalStream(tag);
			this.reconnect({ reconnectionReasonInfo: 'Reconnect by replaceMediaStream' });
		}
	}

	holdOutgoingVideo(holdState)
	{
		if (this.outgoingVideoHoldState == holdState)
		{
			return;
		}

		this.outgoingVideoHoldState = holdState;
		if (this._outgoingVideoTrack)
		{
			this._outgoingVideoTrack.enabled = !this.outgoingVideoHoldState;
		}
	};

	isInitiator()
	{
		return this.call.userId < this.userId;
	};

	isRenegotiationSupported()
	{
		return true;
		// return (Browser.isChrome() && this.isChrome);
	};

	setReady(ready)
	{
		this.ready = ready;
		if (this.ready)
		{
			this.declined = false;
			this.busy = false;
		}
		if (this.calling)
		{
			clearTimeout(this.callingTimeout);
			this.calling = false;
		}
		this.updateCalculatedState();
	};

	isReady()
	{
		return this.ready;
	};

	onInvited()
	{
		this.ready = false;
		this.inviteTimeout = false;
		this.declined = false;
		this.calling = true;

		if (this.callingTimeout)
		{
			clearTimeout(this.callingTimeout);
		}
		this.callingTimeout = setTimeout(function ()
		{
			this.onInviteTimeout(true);
		}.bind(this), invitePeriod);
		this.updateCalculatedState();
	};

	onInviteTimeout(internal)
	{
		clearTimeout(this.callingTimeout);
		this.calling = false;
		this.inviteTimeout = true;
		if (internal)
		{
			this.callbacks.onInviteTimeout({
				userId: this.userId
			});
		}
		this.updateCalculatedState();
	};

	setUserAgent(userAgent)
	{
		this.userAgent = userAgent;
		this.isFirefox = userAgent.toLowerCase().indexOf('firefox') != -1;
		this.isChrome = userAgent.toLowerCase().indexOf('chrome') != -1;
		this.isLegacyMobile = userAgent === 'Bitrix Legacy Mobile';
	};

	getUserAgent()
	{
		return this.userAgent;
	};

	isParticipating()
	{
		if (this.calling)
		{
			return true;
		}

		if (this.declined || this.busy)
		{
			return false;
		}

		if (this.peerConnection)
		{
			// todo: maybe we should check iceConnectionState as well.
			const iceConnectionState = this.peerConnection.iceConnectionState;
			if (iceConnectionState == 'checking' || iceConnectionState == 'connected' || iceConnectionState == 'completed')
			{
				return true;
			}
		}

		return false;
	};

	setSignalingConnected(signalingConnected)
	{
		this.signalingConnected = signalingConnected;
		this.updateCalculatedState();

		if (this.signalingConnected)
		{
			this.refreshSignalingTimeout();
		}
		else
		{
			this.stopSignalingTimeout();
		}
	};

	isSignalingConnected()
	{
		return this.signalingConnected;
	};

	setDeclined(declined)
	{
		this.declined = declined;
		if (this.calling)
		{
			clearTimeout(this.callingTimeout);
			this.calling = false;
		}
		this.updateCalculatedState();
	};

	setBusy(busy)
	{
		this.busy = busy;
		if (this.calling)
		{
			clearTimeout(this.callingTimeout);
			this.calling = false;
		}
		this.updateCalculatedState();
	};

	isDeclined()
	{
		return this.declined;
	};

	updateCalculatedState()
	{
		const calculatedState = this.calculateState();

		if (this.calculatedState != calculatedState)
		{
			this.callbacks.onStateChanged({
				userId: this.userId,
				state: calculatedState,
				previousState: this.calculatedState,
				isLegacyMobile: this.isLegacyMobile,
			});
			this.calculatedState = calculatedState;
		}
	};

	calculateState()
	{
		if (this.reconnecting)
		{
			return UserState.Connecting;
		}

		if (this.peerConnection)
		{
			if (this.failureReason !== '')
			{
				return UserState.Failed;
			}

			if (this.peerConnection.iceConnectionState === 'connected' || this.peerConnection.iceConnectionState === 'completed')
			{
				return UserState.Connected;
			}

			return UserState.Connecting;
		}

		if (this.calling)
		{
			return UserState.Calling;
		}

		if (this.inviteTimeout)
		{
			return UserState.Unavailable;
		}

		if (this.declined)
		{
			return UserState.Declined;
		}

		if (this.busy)
		{
			return UserState.Busy;
		}

		if (this.ready)
		{
			return UserState.Ready;
		}

		return UserState.Idle;
	};

	getSignaling()
	{
		return this.call.signaling;
	};

	startStatisticsGathering()
	{
		clearInterval(this.statsInterval);

		this.statsInterval = setInterval(function ()
		{
			if (!this.peerConnection)
			{
				return false;
			}

			this.peerConnection.getStats().then(function (stats)
			{
				// stats gathering in new format like in the Bitrix24 calls
				const statsOutput = [];
				const codecs = {};
				const reportsWithoutCodecs = {};
				const remoteReports = {};
				const reportsWithoutRemoteInfo = {};
				let incomingDataLoss = 0;
				let outgoingDataLoss = 0;

				stats.forEach((report) => {
					statsOutput.push(report);

					const needCheckInputPacketLost = (report?.trackIdentifier
						&& report?.type === 'inbound-rtp'
						&& report.hasOwnProperty('packetsLost')
						&& report.hasOwnProperty('packetsReceived'));

					if (needCheckInputPacketLost || report.type === 'outbound-rtp')
					{
						switch (this.trackList[report.mid])
						{
							case 'video':
								report.source = MediaStreamsKinds.Camera;
								break;
							case 'screen':
								report.source = MediaStreamsKinds.Screen;
								break;
							case 'audio':
								report.source = MediaStreamsKinds.Microphone;
								break;
							default:
								return;
						}
					}

					if (needCheckInputPacketLost)
					{
						report.bitrate = Util.calcBitrate(report, this.reportsForIncomingTracks[report.source]);
						const packetsLostData = Util.calcRemotePacketsLost(report, this.reportsForIncomingTracks[report.source]);
						report.packetsLostExtended = Util.formatPacketsLostData(packetsLostData);
						if (!Util.setCodecToReport(report, codecs, reportsWithoutCodecs))
						{
							Util.saveReportWithoutCodecs(report, reportsWithoutCodecs);
						}

						this.reportsForIncomingTracks[report.source] = report;

						if (report.source === MediaStreamsKinds.Camera)
						{
							incomingDataLoss = packetsLostData.currentPercentPacketLost;
						}
					}

					if (report.type === 'codec')
					{
						Util.processReportsWithoutCodecs(report, codecs, reportsWithoutCodecs);
					}

					if (report.type === 'remote-inbound-rtp')
					{
						const reportId = report.localId;
						if (reportsWithoutRemoteInfo[reportId])
						{
							const packetsLostData = Util.calcLocalPacketsLost(reportsWithoutRemoteInfo[reportId], this.reportsForOutgoingTracks[reportId], report);
							reportsWithoutRemoteInfo[reportId].packetsLostData = packetsLostData;
							reportsWithoutRemoteInfo[reportId].packetsLost = packetsLostData.totalPacketsLost;
							reportsWithoutRemoteInfo[reportId].packetsLostExtended = Util.formatPacketsLostData(packetsLostData);
							this.reportsForOutgoingTracks[reportId] = reportsWithoutRemoteInfo[reportId];
							delete reportsWithoutRemoteInfo[reportId];

							if (this.reportsForOutgoingTracks[reportId].source === MediaStreamsKinds.Camera)
							{
								outgoingDataLoss = report.packetsLost;
							}
							return;
						}

						remoteReports[reportId] = report;
					}

					if (report.type === 'outbound-rtp')
					{
						report.bitrate = Util.calcBitrate(report, this.reportsForOutgoingTracks[report.id], true);
						report.userId = this.call.userId;

						if (!Util.setCodecToReport(report, codecs, reportsWithoutCodecs))
						{
							Util.saveReportWithoutCodecs(report, reportsWithoutCodecs);
						}
						if (Util.setLocalPacketsLostOrSaveReport(report, remoteReports, reportsWithoutRemoteInfo))
						{
							this.reportsForOutgoingTracks[report.id] = report;
							if (report.source === MediaStreamsKinds.Camera)
							{
								outgoingDataLoss = report.packetsLostData.currentPercentPacketLost;
							}
						}
					}
				});

				if (this.prevPercentPacketLostList.incomingPacketLost.push(incomingDataLoss) > 10)
				{
					this.prevPercentPacketLostList.incomingPacketLost.shift();
				}

				const newIncomingConnectionDataLoss = this.prevPercentPacketLostList.incomingPacketLost.reduce(
					(acc, number) => acc + number, 0
				) / this.prevPercentPacketLostList.incomingPacketLost.length;
				const newIncomingConnectionScore = this.calcNewConnectionScore(newIncomingConnectionDataLoss);
				if (!this.incomingConnectionScore || this.incomingConnectionScore !== newIncomingConnectionScore)
				{
					this.incomingConnectionScore = newIncomingConnectionScore;
					this.callbacks.onRTCQualityChanged({
						userId: this.userId,
						score: this.incomingConnectionScore
					});
				}

				if (this.prevPercentPacketLostList.outgoingPacketLost.push(outgoingDataLoss) > 10)
				{
					this.prevPercentPacketLostList.outgoingPacketLost.shift();
				}

				const newOutgoingConnectionDataLoss = this.prevPercentPacketLostList.outgoingPacketLost.reduce(
					(acc, number) => acc + number, 0
				) / this.prevPercentPacketLostList.outgoingPacketLost.length;
				const newOutgoingConnectionScore = this.calcNewConnectionScore(newOutgoingConnectionDataLoss);
				if (!this.outgoingConnectionScore || this.outgoingConnectionScore !== newOutgoingConnectionScore)
				{
					this.outgoingConnectionScore = newOutgoingConnectionScore;
					this.callbacks.onRTCQualityChanged({
						userId: this.call.userId,
						score: this.outgoingConnectionScore
					});
				}

				this.callbacks.onRTCStatsReceived({
					userId: this.userId,
					stats: statsOutput
				});
			}.bind(this));
		}.bind(this), 1000);
	};

	calcNewConnectionScore(dataLoss)
	{
		let connectionQuality;
		if (dataLoss < 10)
		{
			connectionQuality = 4;
		}

		if (dataLoss > 10 && dataLoss <= 20)
		{
			connectionQuality = 3;
		}

		if (dataLoss > 20 && dataLoss <= 30)
		{
			connectionQuality = 2;
		}

		if (dataLoss > 30)
		{
			connectionQuality = 1;
		}

		return connectionQuality;
	}

	stopStatisticsGathering()
	{
		clearInterval(this.statsInterval);
		this.statsInterval = null;
	};

	updateCandidatesTimeout()
	{
		if (this.candidatesTimeout)
		{
			clearTimeout(this.candidatesTimeout);
		}

		this.candidatesTimeout = setTimeout(this.sendIceCandidates.bind(this), 500);
	};

	sendIceCandidates()
	{
		this.log("User " + this.userId + ": sending ICE candidates due to the timeout");

		this.candidatesTimeout = null;
		if (this.localIceCandidates.length > 0)
		{
			this.getSignaling().sendIceCandidate({
				userId: this.userId,
				connectionId: this.peerConnectionId,
				candidates: this.localIceCandidates
			});
			this.localIceCandidates = [];
		}
		else
		{
			this.log("User " + this.userId + ": ICE candidates pool is empty");
		}
	};

	#createPeerConnection(id)
	{

		const iceServers = this.call.CallApi?.iceServers || this.call.iceServers;
		const connectionConfig = { iceServers };

		this.log(`User ${this.userId}: Creating peer connection with config ${JSON.stringify(connectionConfig, null, 2)}`);

		this.localIceCandidates = [];
		this.peerConnection = new RTCPeerConnection(connectionConfig);
		this.peerConnectionId = id;

		this.peerConnection.addEventListener("icecandidate", this._onPeerConnectionIceCandidateHandler);
		this.peerConnection.addEventListener("connectionstatechange", this._onPeerConnectionConnectionStateChangeHandler);
		this.peerConnection.addEventListener("icegatheringstatechange", this._onPeerConnectionIceGatheringStateChangeHandler);
		this.peerConnection.addEventListener("signalingstatechange", this._onPeerConnectionSignalingStateChangeHandler);
		this.peerConnection.addEventListener("negotiationneeded", this._onPeerConnectionNegotiationNeededHandler);
		this.peerConnection.addEventListener("track", this._onPeerConnectionTrackHandler);
		this.peerConnection.addEventListener("removestream", this._onPeerConnectionRemoveStreamHandler);
		this.peerConnection.addEventListener("icecandidateerror", this._onPeerConnectionIceCandidateErrorHandler);
		this.peerConnection.addEventListener("iceconnectionstatechange", this._onPeerConnectionIceConnectionStateChangeHandler);

		this.failureReason = '';
		this.updateCalculatedState();

		this.startStatisticsGathering();
	};

	_destroyPeerConnection()
	{
		if (!this.peerConnection)
		{
			return;
		}

		clearTimeout(this.reconnectAfterDisconnectTimeout);

		this.log("User " + this.userId + ": Destroying peer connection " + this.peerConnectionId);
		this.stopStatisticsGathering();

		this.peerConnection.removeEventListener("icecandidate", this._onPeerConnectionIceCandidateHandler);
		this.peerConnection.removeEventListener("connectionstatechange", this._onPeerConnectionConnectionStateChangeHandler);
		this.peerConnection.removeEventListener("icegatheringstatechange", this._onPeerConnectionIceGatheringStateChangeHandler);
		this.peerConnection.removeEventListener("signalingstatechange", this._onPeerConnectionSignalingStateChangeHandler);
		this.peerConnection.removeEventListener("negotiationneeded", this._onPeerConnectionNegotiationNeededHandler);
		this.peerConnection.removeEventListener("track", this._onPeerConnectionTrackHandler);
		this.peerConnection.removeEventListener("removestream", this._onPeerConnectionRemoveStreamHandler);
		this.peerConnection.removeEventListener("icecandidateerror", this._onPeerConnectionIceCandidateErrorHandler);
		this.peerConnection.removeEventListener("iceconnectionstatechange", this._onPeerConnectionIceConnectionStateChangeHandler);

		this.localIceCandidates = [];
		if (this.pendingIceCandidates[this.peerConnectionId])
		{
			delete this.pendingIceCandidates[this.peerConnectionId];
		}

		this.peerConnection.close();
		this.peerConnection = null;
		this.peerConnectionId = null;
		this.videoSender = null;
		this.audioSender = null;
		this.screenSender = null;
		this.screenAudioSender = null;
		this.incomingAudioTrack = null;
		this.incomingScreenAudioTrack = null;
		this.incomingVideoTrack = null;
		this.incomingScreenTrack = null;
	};

	_onPeerConnectionIceCandidate(e)
	{
		const candidate = e.candidate;
		this.log("User " + this.userId + ": ICE candidate discovered (local). Candidate: " + (candidate ? candidate.candidate : candidate));

		if (candidate)
		{
			if (this.getSignaling().isIceTricklingAllowed())
			{
				this.getSignaling().sendIceCandidate({
					userId: this.userId,
					connectionId: this.peerConnectionId,
					candidates: [candidate.toJSON()]
				});
			}
			else
			{
				this.localIceCandidates.push(candidate.toJSON());
				this.updateCandidatesTimeout();
			}
		}
	};

	#onPeerConnectionConnectionStateChange()
	{
		this.log("User " + this.userId + ": peer connection state changed. New state: " + this.peerConnection.connectionState);

		if (this.peerConnection.connectionState === "connected" || this.peerConnection.connectionState === "completed")
		{
			this.connectionAttempt = 0;
			this.callbacks.onReconnected();
			clearTimeout(this.reconnectAfterDisconnectTimeout);
			this._updateTracksDebounced();
		}
		else if (this.peerConnection.connectionState === "failed")
		{
			const logMessage = 'Peer connection failed. Trying to restore connection immediately';
			this.log(logMessage);

			this.reconnect({
				reconnectionReason: 'PEER_CONNECTION_FAILED',
				reconnectionReasonInfo: logMessage,
			});
		}
		// else if (this.peerConnection.connectionState === "disconnected")
		// {
		// 	// we can ignore a 'disconnected' state because it can provoke frequent reconnects,
		// 	// besides that, iceConnectionState can can be changed back to 'connected' state by itself
		// 	this.log("peer connection lost. Waiting 5 seconds before trying to restore it");
		// 	clearTimeout(this.reconnectAfterDisconnectTimeout);
		// 	this.reconnectAfterDisconnectTimeout = setTimeout(() => this.reconnect(), 5000);
		// }

		this.updateCalculatedState();
	};

	#onPeerConnectionIceGatheringStateChange(e)
	{
		const connection = e.target;
		this.log("User " + this.userId + ": ICE gathering state changed to : " + connection.iceGatheringState);

		if (connection.iceGatheringState === 'complete')
		{
			this.log("User " + this.userId + ": ICE gathering complete");

			if (!this.getSignaling().isIceTricklingAllowed())
			{
				if (this.localIceCandidates.length > 0)
				{
					this.getSignaling().sendIceCandidate({
						userId: this.userId,
						connectionId: this.peerConnectionId,
						candidates: this.localIceCandidates
					});
					this.localIceCandidates = [];
				}
				else
				{
					this.log("User " + this.userId + ": ICE candidates already sent");
				}
			}
		}
	};

	#onPeerConnectionSignalingStateChange()
	{
		this.log("User " + this.userId + " PC signalingState: " + this.peerConnection.signalingState);
		if (this.peerConnection.signalingState === "stable")
		{
			this._updateTracksDebounced();
		}
	};

	// this event is unusable in the current version of desktop (cef 64) and leads to signaling cycling
	// todo: reconsider using it after new version is released
	#onPeerConnectionNegotiationNeeded(e)
	{
		this.log("User " + this.userId + ": needed negotiation for peer connection");
		this.log("User " + this.userId + ": signaling state: ", e.target.signalingState);
		this.log("User " + this.userId + ": ice connection state: ", e.target.iceConnectionState);
		this.log("User " + this.userId + ": pendingRemoteDescription: ", e.target.pendingRemoteDescription);

		if (e.target.iceConnectionState !== "new" && e.target.iceConnectionState !== "connected" && e.target.iceConnectionState !== "completed")
		{
			this.log("User " + this.userId + ": wrong connection state");
			return;
		}

		/*if (this.isInitiator())
		{
			this.createAndSendOffer();
		}
		else
		{
			this.sendNegotiationNeeded(this.peerConnection._forceReconnect === true);
		}*/
	};

	addMediaRenderer(trackData)
	{
		this.#addTrack(trackData);
	}

	removeMediaRenderer(trackData)
	{
		this.log(`Removing media renderer for user ${this.userId} ${trackData.track.source}`);

		switch (trackData.track.source)
		{
			case MediaStreamsKinds.Camera:
				this.incomingVideoTrack = null;
				break;

			case MediaStreamsKinds.Microphone:
				this.incomingAudioTrack = null;
				break;

			case MediaStreamsKinds.Screen:
			case MediaStreamsKinds.ScreenAudio:
				this.incomingScreenTrack = null;
				this.incomingScreenAudioTrack = null;
				break;

			default:
		}
	}

	#onPeerConnectionTrack(e): void
	{
		if (this.call.useMediaServer)
		{
			return;
		}

		this.#addTrack(e);
	}

	#addTrack(event)
	{
		this.log(`User ${this.userId}: media track received: ${event.track.id} (${event.track.kind})`);

		if (event.track.kind === 'video')
		{
			Event.bind(event.track, 'mute', this.#onVideoTrackMuted.bind(this));
			Event.bind(event.track, 'unmute', this.#onVideoTrackUnMuted.bind(this));
			Event.bind(event.track, 'ended', this.#onVideoTrackEnded.bind(this));

			const isScreenVideo = this.call.useMediaServer
				? event.track.source === MediaStreamsKinds.Screen
				: this.trackList[event.transceiver?.mid] === 'screen';

			if (isScreenVideo)
			{
				this.incomingScreenTrack = event.track;
			}
			else
			{
				this.incomingVideoTrack = event.track;
			}
		}
		else if (event.track.kind === 'audio')
		{
			const isScreenAudio = this.call.useMediaServer
				? event.track.source === MediaStreamsKinds.ScreenAudio
				: this.trackList[event.transceiver?.mid] === 'screenAudio';

			if (isScreenAudio)
			{
				this.incomingScreenAudioTrack = event.track;
			}
			else
			{
				this.incomingAudioTrack = event.track;
			}
		}
	}

	#onPeerConnectionRemoveStream(e)
	{
		this.log("User: " + this.userId + "_onPeerConnectionRemoveStream: ", e);
	};

	#onPeerConnectionIceCandidateError(e)
	{
		this.log("User: " + this.userId + "_onPeerConnectionIceCandidateError: ", JSON.stringify(e));
	};

	#onPeerConnectionIceConnectionStateChange(e)
	{
		if (!this.peerConnection)
		{
			return;
		}

		const state = this.peerConnection.iceConnectionState;
		this.log(`User ${this.userId} #onPeerConnectionIceConnectionStateChange [ICE State]: ${state}`);
	};

	#onVideoTrackMuted()
	{
		console.log("Video track muted");
		//this._updateTracksDebounced();
	};

	#onVideoTrackUnMuted()
	{
		console.log("Video track unmuted");
		//this._updateTracksDebounced();
	};

	#onVideoTrackEnded()
	{
		console.log("Video track ended");
	};

	#updateTracks()
	{
		if (!this.peerConnection || this.call.useMediaServer)
		{
			return null;
		}

		let audioTrack = null;
		let videoTrack = null;
		let screenTrack = null;
		let screenAudioTrack = null;
		this.peerConnection.getTransceivers().forEach((tr) =>
		{
			this.call.log("[debug] tr direction: " + tr.direction + " currentDirection: " + tr.currentDirection);
			if (tr.currentDirection === "sendrecv" || tr.currentDirection === "recvonly")
			{
				if (tr.receiver && tr.receiver.track)
				{
					const track = tr.receiver.track;
					if (track.kind === 'audio')
					{
						if (this.trackList[tr.mid] === 'sharingAudio')
						{
							screenAudioTrack = track;
						}
						else
						{
							audioTrack = track;
						}
					}
					else if (track.kind === 'video')
					{
						if (this.trackList[tr.mid] === 'screen')
						{
							screenTrack = track;
						}
						else
						{
							videoTrack = track;
						}
					}
				}
			}
		});
		this.incomingAudioTrack = audioTrack;
		this.incomingVideoTrack = videoTrack;
		this.incomingScreenTrack = screenTrack;
		this.incomingScreenAudioTrack = screenAudioTrack;
	};

	stopSignalingTimeout()
	{
		clearTimeout(this.signalingConnectionTimeout);
	};

	refreshSignalingTimeout()
	{
		clearTimeout(this.signalingConnectionTimeout);
		this.signalingConnectionTimeout = setTimeout(this.#onLostSignalingConnection.bind(this), signalingConnectionRefreshPeriod);
	};

	#onLostSignalingConnection()
	{
		this.setSignalingConnected(false);
	};

	_onConnectionOfferReplyTimeout(connectionId)
	{
		const logMessage = `Did not receive connection answer for connection ${connectionId}`;
		this.log(logMessage);
		this.call.setPublishingState(MediaStreamsKinds.Camera, false);
		this.reconnect({ reconnectionReasonInfo: logMessage });
	}

	_onNegotiationNeededReplyTimeout()
	{
		const logMessage = 'Did not receive connection offer in time';
		this.log(logMessage);
		this.reconnect({ reconnectionReasonInfo: logMessage });
	}

	setConnectionOffer(connectionId, sdp, trackList)
	{
		this.log("User " + this.userId + ": applying connection offer for connection " + connectionId);

		clearTimeout(this.negotiationNeededReplyTimeout);
		this.negotiationNeededReplyTimeout = null;

		if (!this.call.isReady())
		{
			return;
		}

		if (!this.isReady())
		{
			return;
		}

		if (trackList)
		{
			this.trackList = BX.util.array_flip(trackList);
		}

		if (this.peerConnection)
		{
			if (this.peerConnectionId !== connectionId)
			{
				this._destroyPeerConnection();
				this.#createPeerConnection(connectionId);
			}
		}
		else
		{
			this.#createPeerConnection(connectionId);
		}

		this.applyOfferAndSendAnswer(sdp);
	};

	createAndSendOffer(config)
	{
		let connectionConfig = defaultConnectionOptions;
		for (let key in config)
		{
			connectionConfig[key] = config[key];
		}

		this.peerConnection.createOffer(connectionConfig)
			.then((offer) =>
			{
				this.log("User " + this.userId + ": Created connection offer.");
				this.log("Applying local description");
				return this.peerConnection.setLocalDescription(offer);
			})
			.then(() =>
			{
				this.sendOffer();
			})
		;
	};

	sendOffer()
	{
		clearTimeout(this.connectionOfferReplyTimeout);
		this.connectionOfferReplyTimeout = setTimeout(
			() => this._onConnectionOfferReplyTimeout(this.peerConnectionId),
			signalingWaitReplyPeriod
		);

		this.getSignaling().sendConnectionOffer({
			userId: this.userId,
			connectionId: this.peerConnectionId,
			sdp: this.peerConnection.localDescription.sdp,
			tracks: {
				audio: this.getSenderMid(this.audioSender),
				video: this.getSenderMid(this.videoSender),
				screen: this.getSenderMid(this.screenSender),
				sharingAudio: this.getSenderMid(this.screenAudioSender),
			},
			userAgent: navigator.userAgent
		})
	};

	sendNegotiationNeeded(restart: boolean)
	{
		restart = restart === true;
		clearTimeout(this.negotiationNeededReplyTimeout);
		this.negotiationNeededReplyTimeout = setTimeout(
			() => this._onNegotiationNeededReplyTimeout(),
			signalingWaitReplyPeriod
		);

		const params = {
			userId: this.userId
		};
		if (restart)
		{
			params.restart = true;
		}

		this.getSignaling().sendNegotiationNeeded(params);
	};

	applyOfferAndSendAnswer(sdp)
	{
		const sessionDescription = new RTCSessionDescription({
			sdp,
			type: 'offer',
		});

		if (this.pendingRemoteSdpDelay)
		{
			this.pendingRemoteSdp = sdp;

			return;
		}

		this.log(`User: ${this.userId}; Applying remote offer`);
		this.log(JSON.stringify(sessionDescription));
		this.log(`User: ${this.userId}; Peer ice connection state ${this.peerConnection.iceConnectionState}`);

		const haveLocalOffer = this.peerConnection.signalingState === 'have-local-offer';

		if (this.isInitiator() && haveLocalOffer)
		{
			return;
		}

		const initDescription = haveLocalOffer
			? new Promise((resolve) => {
				clearTimeout(this.connectionOfferReplyTimeout);
				resolve(this.peerConnection.setLocalDescription());
			})
			: Promise.resolve();

		this.pendingRemoteSdpDelay = true;

		initDescription
			.then(() => {
				return this.peerConnection
					.setRemoteDescription(sessionDescription);
			})
			.then(() => {
				if (this.peerConnection.iceConnectionState === 'new')
				{
					this.sendMedia(true);
				}

				return this.peerConnection.createAnswer();
			})
			.then((answer) => {
				this.log('Created connection answer.');
				this.log('Applying local description.');

				return this.peerConnection.setLocalDescription(answer);
			})
			.then(() => {
				this.applyResolutionScale();
				this.applyPendingIceCandidates();
				this.getSignaling().sendConnectionAnswer({
					userId: this.userId,
					connectionId: this.peerConnectionId,
					sdp: this.peerConnection.localDescription.sdp,
					tracks: {
						audio: this.getSenderMid(this.audioSender),
						video: this.getSenderMid(this.videoSender),
						screen: this.getSenderMid(this.screenSender),
						sharingAudio: this.getSenderMid(this.screenAudioSender),
					},
					userAgent: navigator.userAgent,
				});
			})
			.catch((error) => {
				this.failureReason = error.toString();
				const logMessage = `Could not apply remote offer: ${this.failureReason}`;
				this.log(logMessage);
				Util.sendLog(`[call] ${logMessage}`);
				this.reconnect({ reconnectionReasonInfo: logMessage });
			})
			.finally(() => {
				this.pendingRemoteSdpDelay = false;
				if (this.pendingRemoteSdp)
				{
					this.applyOfferAndSendAnswer(this.pendingRemoteSdp);
					this.pendingRemoteSdp = null;
				}

				const activeTransceivers = this.peerConnection?.getTransceivers()
					.reduce((sum, transceiver) => {
						return transceiver.mid === null ? sum : sum + 1;
					}, 0);

				let activeTracks = 0;
				Object.values(this.call.localStreams).forEach((stream) => {
					stream?.getTracks().forEach((track) => {
						if (track.readyState === 'live')
						{
							activeTracks++;
						}
					});
				});

				if (activeTransceivers < activeTracks)
				{
					Object.values(this.call.peers).forEach((peer) => {
						peer.sendMedia();
					});
				}
			});
	}

	setConnectionAnswer(connectionId, sdp, trackList)
	{
		if (!this.peerConnection || this.peerConnectionId != connectionId)
		{
			this.log("Could not apply answer, for unknown connection " + connectionId);
			return;
		}

		if (this.peerConnection.signalingState !== 'have-local-offer')
		{
			this.log("Could not apply answer, wrong peer connection signaling state " + this.peerConnection.signalingState);
			return;
		}

		if (trackList)
		{
			this.trackList = BX.util.array_flip(trackList);
		}

		const sessionDescription = new RTCSessionDescription({
			type: "answer",
			sdp: sdp
		});

		clearTimeout(this.connectionOfferReplyTimeout);

		this.log("User: " + this.userId + "; Applying remote answer");
		this.log(JSON.stringify(sessionDescription));
		this.peerConnection
			.setRemoteDescription(sessionDescription)
			.then(() =>
			{
				this.applyPendingIceCandidates();
			})
			.catch((error) => {
				this.failureReason = error.toString();
				const logMessage = `Could not apply remote answer: ${this.failureReason}`;
				this.log(logMessage);
				Util.sendLog(`[call] ${logMessage}`);
				this.reconnect({ reconnectionReasonInfo: logMessage });
			})
			.finally(() =>
			{
				this.call.setPublishingState(MediaStreamsKinds.Camera, false);
			})
		;
	};

	addIceCandidate(connectionId, candidate)
	{
		if (!this.peerConnection)
		{
			return;
		}

		if (this.peerConnectionId != connectionId)
		{
			this.log("Error: Candidate for unknown connection " + connectionId);
			return;
		}

		if (this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type)
		{
			this.peerConnection
				.addIceCandidate(candidate)
				.then(() =>
				{
					this.log("User: " + this.userId + "; Added remote ICE candidate: " + (candidate ? candidate.candidate : candidate));
				})
				.catch((e) =>
				{
					this.log(e);
				})
			;
		}
		else
		{
			if (!this.pendingIceCandidates[connectionId])
			{
				this.pendingIceCandidates[connectionId] = [];
			}
			this.pendingIceCandidates[connectionId].push(candidate);
		}
	};

	applyPendingIceCandidates()
	{
		if (!this.peerConnection || !this.peerConnection.remoteDescription.type)
		{
			return;
		}

		if (Type.isArray(this.pendingIceCandidates[this.peerConnectionId]))
		{
			this.pendingIceCandidates[this.peerConnectionId].forEach((candidate) =>
			{
				this.peerConnection.addIceCandidate(candidate).then(() =>
				{
					this.log("User: " + this.userId + "; Added remote ICE candidate: " + (candidate ? candidate.candidate : candidate));
				});
			});

			this.pendingIceCandidates[this.peerConnectionId] = [];
		}
	};

	onNegotiationNeeded()
	{
		if (this.peerConnection)
		{
			if (this.peerConnection.signalingState == "have-local-offer")
			{
				this.sendOffer();
			}
			else
			{
				this.createAndSendOffer({iceRestart: true});
			}
		}
		else
		{
			this.sendMedia();
		}
	};

	reconnect(event): void
	{
		clearTimeout(this.reconnectAfterDisconnectTimeout);

		this.connectionAttempt++;
		const maxConnectionAttempt = 3;
		const connectionAttempt = this.call.CallApi?.isConnected() ? 0 : this.connectionAttempt;

		if (connectionAttempt > maxConnectionAttempt)
		{
			this.log('Error: Too many reconnection attempts, giving up');
			this.failureReason = this.failureReason || 'Could not connect to user in time';
			this.updateCalculatedState();

			return;
		}

		this.callbacks.onReconnecting(event);

		this.log(`Trying to restore ICE connection. Attempt ${this.connectionAttempt}`);
		if (this.isInitiator())
		{
			this._destroyPeerConnection();
			this.sendMedia();
		}
		else
		{
			this.sendNegotiationNeeded(true);
		}
	}

	disconnect()
	{
		this._destroyPeerConnection();

		this.outgoingVideoTrack = null;
		this.outgoingScreenTrack = null;
		this.outgoingVideoHoldState = false;

		this.incomingAudioTrack = null;
		this.incomingScreenAudioTrack = null;
		this.incomingVideoTrack = null;
		this.incomingScreenTrack = null;
	};

	log()
	{
		this.call.log.apply(this.call, ['SPC: ', ...arguments]);
	};

	destroy()
	{
		this.disconnect();

		if (this.voiceDetection)
		{
			this.voiceDetection.destroy();
			this.voiceDetection = null;
		}

		for (let tag in this.localStreams)
		{
			this.localStreams[tag] = null;
		}

		clearTimeout(this.answerTimeout);
		this.answerTimeout = null;

		clearTimeout(this.connectionTimeout);
		this.connectionTimeout = null;

		clearTimeout(this.signalingConnectionTimeout);
		this.signalingConnectionTimeout = null;

		this.callbacks.onStateChanged = BX.DoNothing;
		this.callbacks.onMediaReceived = BX.DoNothing;
		this.callbacks.onMediaStopped = BX.DoNothing;
	};
}
