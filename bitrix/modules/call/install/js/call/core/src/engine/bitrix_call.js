import { Type, Browser, Event } from 'main.core';

import {AbstractCall} from './abstract_call';
import {
	EndpointDirection,
	UserState,
	Quality,
	UserMnemonic,
	CallEvent,
	CallState,
	CallType,
	Provider,
	DisconnectReason,
} from './types';
import {
	Call,
	CALL_STATE,
	MediaStreamsKinds,
	RecorderStatus,
	CloudRecordStatus,
} from '../call_api.js';
import { CallLegacy } from '../call-api-legacy.js';
import { MediaRenderer } from '../view/media-renderer';
import {SimpleVAD} from './simple_vad'
import {Hardware} from '../call_hardware';
import Util from '../util'

import { UnsupportedBrowserFeatures } from './unsupported_features_in_browsers';
import { CallCommonRecordState, CallCommonRecordType, CallCloudRecord } from '../call_common_record';
import { CallStreamManager } from '../media-stream-manager';
import { SpeakerManager } from './speaker-manager';
import { ReconnectTarget } from 'call.lib.reconnect-history';

/**
 * Implements Call interface
 * Public methods:
 * - inviteUsers
 * - answer
 * - decline
 * - hangup
 *
 * Events:
 * - onCallStateChanged //not sure about this.
 * - onUserStateChanged
 * - onStreamReceived
 * - onStreamRemoved
 * - onDestroy
 */

const ajaxActions = {
	invite: 'call.Call.invite',
	decline: 'call.Call.decline',
	finish: 'call.CallManager.finish',
};

const clientEvents = {
	voiceStarted: 'Call::voiceStarted',
	voiceStopped: 'Call::voiceStopped',
	microphoneState: 'Call::microphoneState',
	cameraState: 'Call::cameraState',
	videoPaused: 'Call::videoPaused',
	screenState: 'Call::screenState',
	commonRecordState: 'Call::commonRecordState',
	emotion: 'Call::emotion',
	customMessage: 'Call::customMessage',
	usersInvited: 'Call::usersInvited',
	userInviteTimeout: 'Call::userInviteTimeout',
	showUsers: 'Call::showUsers',
	showAll: 'Call::showAll',
	hideAll: 'Call::hideAll',
};

const scenarioEvents = {
	viewerJoined: 'Call::viewerJoined',
	viewerLeft: 'Call::viewerLeft',
};

const BitrixCallEvent = {
	onCallConference: 'BitrixCall::onCallConference'
};

const reinvitePeriod = 5500;

// const MAX_USERS_WITHOUT_SIMULCAST = 6;

export class BitrixCall extends AbstractCall
{
	static Event = BitrixCallEvent
	peers: { [key: number]: Peer };
	localVAD: ?SimpleVAD;

	#isCloudRecordFeaturesEnabled: false;
	#cloudRecordState;

	#recorderState;
	#recorderStateHasChange;

	#isFirefox: Boolean;

	constructor(config)
	{
		super(config);

		this.invitePeriod = config.invitePeriod > 0 ? config.invitePeriod : Util.getCallInvitePeriod();

		this.videoQuality = Quality.VeryHigh; // initial video quality. will drop on new peers connecting

		this.CallApi = null;

		this.signaling = new Signaling({
			call: this
		});

		this.peers = {};
		this.peersWithBadConnection = new Set();
		this.joinedAsViewer = false;
		this.localVideoShown = false;
		this._localUserState = UserState.Idle;
		this.clientEventsBound = false;
		this._screenShared = false;
		this.videoAllowedFrom = UserMnemonic.all;
		this.direction = EndpointDirection.SendRecv;
		this.floorRequestActive = false;

		this.vads = {};
		this.getUserMediaFulfilled = {
			video: true,
			audio: true,
		};

		this.microphoneLevelInterval = null;

		this.initPeers();

		this.reinviteTimeout = null;

		this._reconnectionEventCount = 0;
		this.waitForAnswerTimeout = null;

		this.pullEventHandlers = {
			'Call::answer': this.#onPullEventAnswer,
			'Call::hangup': this.#onPullEventHangup,
			'Call::usersAnswered': this.#onPullEventUsersAnswered,
			'Call::usersHangup': this.#onPullEventUsersHangup,
			'Call::finish': this.#onPullEventFinish,
			'Call::switchTrackRecordStatus': this.#onPullEventSwitchTrackRecordStatus,
		};

		this.#isCloudRecordFeaturesEnabled = true;

		this.#recorderState = RecorderStatus.UNAVAILABLE;
		this.#recorderStateHasChange = false;
		this._isCopilotFeaturesEnabled = true;
		this._isBoostExpired = false;

		this.#isFirefox = BX.browser.IsFirefox();

		this.#cloudRecordState = CloudRecordStatus.NONE;

		this.speakerManager = new SpeakerManager({
			onSpeakerConfirmed: (deviceId) => {
				this.runCallback(CallEvent.onSpeakerConfirmed, { deviceId });
			},
			onSpeakerFallback: (deviceId) => {
				this.runCallback(CallEvent.onSpeakerFallback, { deviceId });
			},
		});
	}

	get provider()
	{
		return Provider.Bitrix;
	}

	get screenShared()
	{
		return this._screenShared;
	}

	get isCopilotInitialized()
	{
		return this.#recorderState !== RecorderStatus.UNAVAILABLE || this.#recorderStateHasChange;
	}

	get isCopilotActive()
	{
		return this.#recorderState === RecorderStatus.ENABLED;
	}

	get isCopilotDisabled()
	{
		return this.#recorderState === RecorderStatus.DESTROYED;
	}

	get isBoostExpired()
	{
		return this._isBoostExpired;
	}

	set isBoostExpired(isBoostExpired)
	{
		if (isBoostExpired !== this._isBoostExpired)
		{
			this._isBoostExpired = isBoostExpired;
		}
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

	set screenShared(screenShared)
	{
		if (screenShared !== this._screenShared)
		{
			this._screenShared = screenShared;
			this.signaling.sendScreenState(this._screenShared);
		}
	}

	get localUserState()
	{
		return this._localUserState
	}

	set localUserState(state)
	{
		if (state === this._localUserState)
		{
			return;
		}
		this.runCallback(CallEvent.onUserStateChanged, {
			userId: this.userId,
			state: state,
			previousState: this._localUserState,
			direction: this.direction,
		});
		this._localUserState = state;
	}

	get reconnectionEventCount()
	{
		return this._reconnectionEventCount;
	}

	set reconnectionEventCount(newValue)
	{
		if (newValue === 0 && this._reconnectionEventCount > 0)
		{
			this.runCallback(CallEvent.onReconnected);
		}
		this._reconnectionEventCount = newValue;
	}

	get hasConnectionData()
	{
		return Boolean(this.connectionData.mediaServerUrl && this.connectionData.roomData);
	}

	initPeers()
	{
		this.users.forEach((userId) =>
		{
			userId = Number(userId);
			this.peers[userId] = this.createPeer(userId);
		});
	};

	reinitPeers()
	{
		for (let userId in this.peers)
		{
			if (this.peers.hasOwnProperty(userId) && this.peers[userId])
			{
				this.peers[userId].destroy();
				this.peers[userId] = null;
			}
		}

		this.initPeers();
	};

	createPeer(userId)
	{
		let incomingVideoAllowed;
		if (this.videoAllowedFrom === UserMnemonic.all)
		{
			incomingVideoAllowed = true;
		}
		else if (this.videoAllowedFrom === UserMnemonic.none)
		{
			incomingVideoAllowed = false;
		}
		else if (Type.isArray(this.videoAllowedFrom))
		{
			incomingVideoAllowed = this.videoAllowedFrom.some(allowedUserId => allowedUserId == userId);
		}
		else
		{
			incomingVideoAllowed = true;
		}

		return new Peer({
			call: this,
			userId: userId,
			ready: userId == this.initiatorId,
			isIncomingVideoAllowed: incomingVideoAllowed,

			onMediaReceived: (e) =>
			{
				this.runCallback(CallEvent.onRemoteMediaReceived, e);
				if (e.kind === 'video')
				{
					this.runCallback(CallEvent.onUserVideoPaused, {
						userId: userId,
						videoPaused: false
					});
				}
			},
			onMediaRemoved: (e) =>
			{
				this.runCallback(CallEvent.onRemoteMediaStopped, e);
			},
			onStateChanged: this.#onPeerStateChanged,
			onInviteTimeout: this.#onPeerInviteTimeout,

		})
	};

	getUsers()
	{
		let result = {};
		for (let userId in this.peers)
		{
			result[userId] = this.peers[userId].calculatedState;
		}

		return result;
	};

	getUserCount()
	{
		return Object.keys(this.peers).length;
	};

	canChangeMediaDevices()
	{
		return !this.CallApi?.isMediaMutedBySystem;
	};

	setMuted = (event) =>
	{
		if (this.muted === event.data.isMicrophoneMuted)
		{
			return;
		}

		this.muted = event.data.isMicrophoneMuted;

		if (this.CallApi)
		{
			// Safari: skip audio operations when call is inactive
			// This prevents permission re-prompt after hangup
			if (Browser.isSafari() && !this.ready)
			{
				return;
			}

			if (!event.data.calledProgrammatically && this.muted)
			{
				this.signaling.sendMicrophoneState(!this.muted);
			}

			if (this.muted)
			{
				this.CallApi.disableAudio({ calledFrom: 'setMuted' });
			}
			else
			{
				if (!this.CallApi.isAudioPublished())
				{
					this.#setPublishingState(MediaStreamsKinds.Microphone, true);
				}
				this.CallApi.enableAudio({ calledFrom: 'setMuted' });
			}
		}
	};

	setVideoEnabled = (event) =>
	{
		if (this.videoEnabled === event.data.isCameraOn)
		{
			return;
		}

		this.videoEnabled = event.data.isCameraOn;

		if (this.CallApi)
		{
			// Safari: skip audio operations when call is inactive
			// This prevents permission re-prompt after hangup
			if (Browser.isSafari() && !this.ready)
			{
				return;
			}

			if (!event.data.calledProgrammatically)
			{
				this.signaling.sendCameraState(this.videoEnabled);
			}

			if (this.videoEnabled)
			{
				if (!this.CallApi.isVideoPublished())
				{
					this.#setPublishingState(MediaStreamsKinds.Camera, true);
				}
				this.localVideoShown = true;
				this.CallApi.enableVideo({calledFrom: 'setVideoEnabled'});
			}
			else
			{
				if (this.localVideoShown)
				{
					this.localVideoShown = false;
					this.CallApi.disableVideo({calledFrom: 'setVideoEnabled'});
				}
			}
		}
	};

	setCameraId(cameraId)
	{
		if (this.cameraId === cameraId)
		{
			return;
		}

		const canSwitchDevice = Boolean(this.cameraId);
		this.cameraId = cameraId;

		if (this.CallApi)
		{
			if (!cameraId)
			{
				this.#onBeforeLocalMediaRendererRemoved(MediaStreamsKinds.Camera);

				return;
			}

			if (!canSwitchDevice)
			{
				return;
			}

			if (this.CallApi.isVideoPublished())
			{
				this.#setPublishingState(MediaStreamsKinds.Camera, true);
			}

			this.CallApi.switchActiveVideoDevice(this.cameraId)
				.then(() => {
					if (Hardware.isCameraOn)
					{
						this.runCallback('onUpdateLastUsedCameraId');

						if (this.CallApi.isVideoPublished() && this.canChangeMediaDevices())
						{
							const track = CallStreamManager.getLocalStream(MediaStreamsKinds.Camera);
							const kind = Util.MediaKind[MediaStreamsKinds.Camera];
							const mediaRenderer = new MediaRenderer({ kind, track });

							this.runCallback(CallEvent.onLocalMediaReceived, {
								mediaRenderer,
								tag: 'main',
								stream: mediaRenderer.stream,
							});

							if (this.CallApi.isVideoPublished())
							{
								this.#setPublishingState(MediaStreamsKinds.Camera, false);
							}
						}
						else if (!this.canChangeMediaDevices())
						{
							this.runCallback(CallEvent.onNeedResetMediaDevicesState);
						}
						else
						{
							this.#setPublishingState(MediaStreamsKinds.Camera, true);
							this.localVideoShown = true;
							this.CallApi.enableVideo({calledFrom: 'switchActiveVideoDevice', skipUnpause: true});
						}
					}
					else
					{
						this.#setPublishingState(MediaStreamsKinds.Camera, false);
					}
				})
				.catch((e) =>
				{
					this.log(e);
					console.error(e);
					this.#onBeforeLocalMediaRendererRemoved(MediaStreamsKinds.Camera);
				});
		}
	};

	setMicrophoneId(microphoneId)
	{
		if (this.microphoneId === microphoneId)
		{
			return;
		}

		const hadMicrophoneId = Boolean(this.microphoneId);
		this.microphoneId = microphoneId;

		if (this.CallApi)
		{
			if (!microphoneId)
			{
				this.#onBeforeLocalMediaRendererRemoved(MediaStreamsKinds.Microphone);

				return;
			}

			// Until the call is connected the initial capture is done by CallApi.connect({ audioDeviceId }),
			// so switching here would grab the microphone too early. Once the call is connected that capture
			// has already happened, and every pick - including the very first one, when the call started
			// without a microphone id - has to be applied to the live audio track.
			if (!hadMicrophoneId && this.localUserState !== UserState.Connected)
			{
				return;
			}

			this.#setPublishingState(MediaStreamsKinds.Microphone, true);
			this.#onEndpointVoiceEnd({ userId: this.userId });

			this.CallApi.switchActiveAudioDevice(this.microphoneId)
				.then(() => {
					const track = CallStreamManager.getLocalStream(MediaStreamsKinds.Microphone);
					if (!track)
					{
						// The switch only recorded the device and captured nothing (nothing is published yet),
						// so there is no track to listen to. The microphone stays exactly as it was, and the
						// first publication applies the device and reports its own track through
						// onLocalMediaRendererAdded. Building a MediaStream out of null here would throw and
						// the catch below would show the microphone as turned off.
						this.log('setMicrophoneId: no local audio track, the device applies on the first publication');

						return;
					}

					this.#onMicAccessResult({
						result: true,
						stream: new MediaStream([track]),
					});
				})
				.catch((error) => {
					this.log(error);
					console.error(error);
					this.runCallback(CallEvent.onUserMicrophoneState, {
						userId: this.userId,
						microphoneState: false,
					});
				})
				.finally(() => {
					this.#setPublishingState(MediaStreamsKinds.Microphone, false);

					if (Hardware.isMicrophoneMuted && !this.canChangeMediaDevices())
					{
						this.CallApi.disableAudio({ calledFrom: 'setMicrophoneId' });
					}
				});
		}
	};

	setRecorderState(state)
	{
		if (!this.CallApi || this.#recorderState === state)
		{
			return;
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

		this.CallApi.setCloudRecordState(state, kind);
	}

	#setPublishingState(deviceType, publishing)
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

	setVideoQualityForStreams(params)
	{
		if (!this.CallApi)
		{
			return;
		}

		this.CallApi.setVideoQualityForStreams(params);
	}

	requestFloor(requestActive)
	{
		if (this.floorRequestActive === requestActive)
		{
			return;
		}
		this.floorRequestActive = requestActive;
		this.CallApi.raiseHand(requestActive);
	};

	updateUserData(userData: Object): void
	{
		this.CallApi.updateUserData(userData);
	}

	turnOffAllParticipansStream(options)
	{
		this.CallApi.turnOffAllParticipansStream(options);
	};

	turnOffParticipantStream(options)
	{
		this.CallApi.turnOffParticipantStream(options);
	};

	allowSpeakPermission(options)
	{
		this.CallApi.allowSpeakPermission(options);
	};

	changeSettings(options)
	{
		this.CallApi.changeSettings(options);
	};

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

	sendCustomMessage(message, repeatOnConnect)
	{
		this.signaling.sendCustomMessage(message, repeatOnConnect);
	};

	/**
	 * Updates list of users,
	 */
	allowVideoFrom(userList: $Keys<typeof UserMnemonic> | number[])
	{
		if (this.videoAllowedFrom == userList)
		{
			return;
		}
		this.videoAllowedFrom = userList;

		if (userList === UserMnemonic.all)
		{
			this.signaling.sendShowAll();
			userList = Object.keys(this.peers);
		}
		else if (userList === UserMnemonic.none)
		{
			this.signaling.sendHideAll();
			userList = [];
		}
		else if (Type.isArray(userList))
		{
			this.signaling.sendShowUsers(userList)
		}
		else
		{
			throw new Error("userList is in wrong format");
		}

		let users = {};
		userList.forEach(userId => users[userId] = true);

		for (let userId in this.peers)
		{
			if (!this.peers.hasOwnProperty(userId))
			{
				continue;
			}
			if (users[userId])
			{
				this.peers[userId].allowIncomingVideo(true);
			}
			else
			{
				this.peers[userId].allowIncomingVideo(false);
			}
		}
	};

	startScreenSharing()
	{
		this.#applyScreenSharing();
	}

	startScreenSharingWithStream(stream: MediaStream)
	{
		stream.getVideoTracks().forEach((track) => {
			Event.bind(track, 'ended', () => {
				this.stopScreenSharing();
			}, { once: true });
		});
		this.#applyScreenSharing(stream);
	}

	#applyScreenSharing(stream = null)
	{
		if (!this.CallApi)
		{
			return;
		}

		this.waitingLocalScreenShare = true;
		this.runCallback(CallEvent.onUserScreenState, {
			userId: this.userId,
			screenState: true,
		});

		if (stream)
		{
			this.CallApi.startScreenShareWithStream(stream);
		}
		else
		{
			this.CallApi.startScreenShare();
		}
	}

	stopScreenSharing()
	{
		this.#onBeforeLocalMediaRendererRemoved(MediaStreamsKinds.Screen);
	};

	isScreenSharingStarted()
	{
		return this.screenShared || this.waitingLocalScreenShare;
	};

	isGetUserMediaFulfilled(kind: string): Boolean
	{
		return Boolean(this.getUserMediaFulfilled[kind]);
	}

	/**
	 * Invites users to participate in the call.
	 */
	inviteUsers(config: { users?: number[], userData?: Object, show?: boolean } = {})
	{
		this.ready = true;
		const usersToInvite = Type.isArray(config.users) ? config.users : this.users;
		this.videoEnabled = Hardware.isCameraOn;
		this.muted = Hardware.isMicrophoneMuted;

		this.attachToConference()
			.then(() => {
				if (this.type === CallType.Instant)
				{
					clearTimeout(this.waitForAnswerTimeout);
					this.waitForAnswerTimeout = setTimeout(() => {
						this.#onNoAnswer();
					}, this.invitePeriod);
				}

				this.state = CallState.Connected;
				this.runCallback(CallEvent.onJoin, {
					local: true,
				});

				usersToInvite.forEach((user) => {
					const userId = parseInt(user, 10);
					if (!this.users.includes(userId))
					{
						this.users.push(userId);
					}

					if (!this.peers[userId])
					{
						this.peers[userId] = this.createPeer(userId);
					}

					this.peers[userId].onInvited();
				});

				if (this.pendingHangups?.length > 0)
				{
					// A pending hangup is superseded if the user is being re-invited
					const usersToInviteSet = new Set(
						usersToInvite.map((user) => parseInt(user, 10)),
					);
					const pendingHangups = this.pendingHangups;
					this.pendingHangups = [];
					pendingHangups.forEach((hangupParams) => {
						if (usersToInviteSet.has(parseInt(hangupParams.senderId, 10)))
						{
							return;
						}
						this.#onPullEventHangup(hangupParams);
					});
				}

				if (config.userData && config.show)
				{
					const inviteParams = {
						users: config.userData,
					};
					this.signaling.sendUsersInvited(inviteParams);
				}

				if (config.show && this.type === CallType.Instant && usersToInvite.length > 0)
				{
					const inviteParams = {
						users: usersToInvite,
						video: Hardware.isCameraOn ? 'Y' : 'N',
					};

					this.signaling.inviteUsers(inviteParams).then(() => this.scheduleRepeatInvite());
				}
			})
			.catch((e) => {
				this.#onFatalError(e);
			})
		;
	}

	scheduleRepeatInvite()
	{
		clearTimeout(this.reinviteTimeout);
		this.reinviteTimeout = setTimeout(() => this.repeatInviteUsers(), reinvitePeriod)
	};

	repeatInviteUsers()
	{
		clearTimeout(this.reinviteTimeout);
		if (!this.ready)
		{
			return;
		}
		let usersToRepeatInvite = [];
		for (let userId in this.peers)
		{
			if (this.peers.hasOwnProperty(userId) && this.peers[userId].calculatedState === UserState.Calling)
			{
				usersToRepeatInvite.push(userId);
			}
		}

		if (usersToRepeatInvite.length === 0)
		{
			return;
		}
		const inviteParams = {
			users: usersToRepeatInvite,
			video: Hardware.isCameraOn ? 'Y' : 'N',
			repeated: 'Y',
		}
		this.signaling.inviteUsers(inviteParams).then(() => this.scheduleRepeatInvite());
	};

	/**
	 * @param {Object} config
	 * @param {bool?} [config.useVideo]
	 * @param {bool?} [config.joinAsViewer]
	 */
	answer(config = {})
	{
		this.ready = true;
		const joinAsViewer = config.joinAsViewer === true;
		this.videoEnabled = Hardware.isCameraOn;
		this.muted = Hardware.isMicrophoneMuted;

		this.attachToConference({joinAsViewer: joinAsViewer})
			.then(() =>
			{
				this.log("Attached to conference");
				this.state = CallState.Connected;
				this.runCallback(CallEvent.onJoin, {
					local: true
				});
			})
			.catch((err) =>
			{
				this.#onFatalError(err);
			})
		;
	};

	decline(code)
	{
		this.ready = false;
		const data = {
			callUuid: this.uuid,
			callInstanceId: this.instanceId,
		};

		if (code)
		{
			data.code = code;
		}

		BX.ajax.runAction(ajaxActions.decline, { data });
	}

	hangup(code, reason, finishCall = false)
	{
		if (!this.ready)
		{
			const error = new Error("Hangup in wrong state");
			this.log(error);
			return;
		}

		const tempError = new Error();
		tempError.name = "Call stack:";
		this.log("Hangup received \n" + tempError.stack);

		if (this.localVAD)
		{
			this.localVAD.destroy();
			this.localVAD = null;
		}
		clearInterval(this.microphoneLevelInterval);

		let data = {};
		this.ready = false;
		if (typeof (code) != 'undefined')
		{
			data.code = code;
		}
		if (typeof (reason) != 'undefined')
		{
			data.reason = reason;
		}
		this.state = CallState.Proceeding;

		//clone users and append current user id to send event to all participants of the call
		data.userId = this.users.slice(0).concat(this.userId);

		if (reason !== 'SIGNALING_DUPLICATE_PARTICIPANT') {
			// for future reconnections
			this.reinitPeers();
		}

		if (this.CallApi)
		{
			this.CallApi._replaceVideoSharing = false;
			this.CallApi.hangup(!!finishCall);
			this.CallApi = null;
		}
		else
		{
			this.log("Tried to hangup, but this.CallApi points nowhere");
			console.error("Tried to hangup, but this.CallApi points nowhere");
		}

		// Explicitly finish the call on the backend only when "finish for all"
		// was requested. A plain "leave" must not end the call for the other
		// participants. 1-on-1 cancel is handled in server_plain_call.js,
		// where any hangup unambiguously means finishing the whole call.
		if (this.uuid && finishCall)
		{
			BX.ajax.runAction(ajaxActions.finish, {
				data: {
					callUuid: this.uuid,
				},
			});
		}

		this.connectionData = {};

		this.screenShared = false;
		this.localVideoShown = false;
		this.floorRequestActive = false;
	};

	attachToConference(options: { joinAsViewer: ?boolean } = {})
	{
		const joinAsViewer = options.joinAsViewer === true;
		if (this.CallApi && this.CallApi.getState() === CALL_STATE.CONNECTED)
		{
			if (this.joinedAsViewer === joinAsViewer)
			{
				return Promise.resolve();
			}
			else
			{
				return Promise.reject("Already joined call in another mode");
			}
		}

		return new Promise((resolve, reject) =>
		{
			this.direction = joinAsViewer ? EndpointDirection.RecvOnly : EndpointDirection.SendRecv;
			this.sendTelemetryEvent("call");

			try
			{
				this.localUserState = UserState.Connecting;
				if (Util.canUseNewCallApi(this.connectionData.roomType))
				{
					this.CallApi = new Call(this.userId);
				}
				else
				{
					this.CallApi = new CallLegacy(this.userId);
				}

				/*if (Hardware.isCameraOn) // transfered to #onCallConnected
				{
					this.localVideoShown = true;
				}*/

				this.joinedAsViewer = joinAsViewer;

				if (!this.CallApi)
				{
					this.log("Error: could not create Call API instance");
					return reject({code: "BITRIX_NO_CALL"});
				}

				this.runCallback(BitrixCallEvent.onCallConference, {
					call: this
				});

				this.bindCallEvents();
				this.subscribeHardwareChanges();

				this.CallApi.on('Connected', () => {
					this.#onCallConnected();
					resolve();
				})
				this.CallApi.on('Failed', (e) =>
				{
					this.#onCallFailed(e);
					reject(e);
				});

				if (!this.ready)
				{
					// for rare cases with fast quit
					return reject({code: "BITRIX_NO_CALL"});
				}

				this.CallApi.connect({
					roomId: this.uuid,
					roomType: this.roomType,
					userId: this.userId,
					userRole: this.userRole,
					videoBitrate: 1_000_000,
					videoSimulcast: true,
					audioDeviceId: this.microphoneId,
					videoDeviceId: this.cameraId,
					...this.connectionData,
				});
			}
			catch (e)
			{
				this.#onFatalError(e);
			}
		});
	};

	#onCallConnected()
	{
		this.reconnectionEventCount = 0;
		this.log("Call connected");
		this.sendTelemetryEvent("connect");
		this.localUserState = UserState.Connected;

		const MAX_USERS_WITH_VIDEO = Util.countDisableCameraNewJoinedUsersFeature();

		if (Util.isDisableCameraNewJoinedUsersFeatureEnabled() && this.CallApi.remoteParticipantsCount >= MAX_USERS_WITH_VIDEO) // task-596223
		{
			Hardware.isCameraOn = false;
		}

		if (!Util.havePermissionToBroadcast('cam'))
		{
			Hardware.isCameraOn = false;
		}

		if (!Util.havePermissionToBroadcast('mic'))
		{
			Hardware.isMicrophoneMuted = true;
		}

		this.CallApi.on('Failed', this.#onCallDisconnected);

		//this.signaling.sendCameraState(Hardware.isCameraOn);

		if (!this.CallApi.isAudioPublished())
		{
			this.#setPublishingState(MediaStreamsKinds.Microphone, true);
		}
		this.CallApi.enableAudio({ calledFrom: 'onCallConnected', disabled: Hardware.isMicrophoneMuted });

		if (Hardware.isCameraOn)
		{
			this.localVideoShown = true;

			if (!this.CallApi.isVideoPublished())
			{
				this.#setPublishingState(MediaStreamsKinds.Camera, true);
			}
			this.CallApi.enableVideo({ calledFrom: 'onCallConnected' });
		}

		if (this.videoAllowedFrom == UserMnemonic.none)
		{
			this.signaling.sendHideAll();
		}
		else if (Type.isArray(this.videoAllowedFrom))
		{
			this.signaling.sendShowUsers(this.videoAllowedFrom);
		}
	};

	#onCallFailed(e)
	{
		this.log("Could not attach to conference", e);
		this.sendTelemetryEvent("connect_failure");
		this.localUserState = UserState.Failed;

		this.CallApi.enableSilentLogging(false);
		this.CallApi.setLoggerCallback(null);
	};

	bindCallEvents()
	{
		this.CallApi.on('PublishSucceed', this.#onLocalMediaRendererAdded);
		this.CallApi.on('PublishPaused', this.#onLocalMediaRendererMuteToggled);
		this.CallApi.on('MediaMutedBySystem', this.#onMediaMutedBySystem);
		this.CallApi.on('PublishFailed', this.#onLocalMediaRendererEnded);
		this.CallApi.on('PublishEnded', this.#onLocalMediaRendererEnded);
		this.CallApi.on('GetUserMediaStarted', this.#onGetUserMediaStarted.bind(this));
		this.CallApi.on('GetUserMediaEnded', this.#onGetUserMediaEnded);
		this.CallApi.on('GetUserMediaFailed', this.#onGetUserMediaFailed);
		this.CallApi.on('GetUserMediaSuccess', this.#onGetUserMediaSuccess.bind(this));
		this.CallApi.on('RemoteMediaAvailable', this.#onRemoteMediaAvailable);
		this.CallApi.on('RemoteMediaUnavailable', this.#onRemoteMediaUnavailable);
		this.CallApi.on('RemoteMediaAdded', this.#onRemoteMediaAdded);
		this.CallApi.on('RemoteMediaRemoved', this.#onRemoteMediaRemoved);
		this.CallApi.on('RemoteMediaMuted', this.#onRemoteMediaMuteToggled);
		this.CallApi.on('RemoteMediaUnmuted', this.#onRemoteMediaMuteToggled);
		this.CallApi.on('AwaitedRemoteMediaMuted', this.#onAwaitedRemoteMediaMuted);
		this.CallApi.on('ParticipantJoined', this.#onParticipantJoined);
		this.CallApi.on('ParticipantReconnecting', this.#onParticipantReconnecting);
		this.CallApi.on('ParticipantReconnected', this.#onParticipantReconnected);
		this.CallApi.on('ParticipantLeaved', this.#onParticipantLeaved);
		this.CallApi.on('MessageReceived', this.#onCallMessageReceived);
		this.CallApi.on('HandRaised', this.#onCallHandRaised);
		this.CallApi.on('VoiceStarted', this.#onEndpointVoiceStart);
		this.CallApi.on('TurnOnCamera', this.#onTurnOnCamera);
		this.CallApi.on('AllParticipantsAudioMuted', this.#onAllParticipantsAudioMuted);
		this.CallApi.on('AllParticipantsVideoMuted', this.#onAllParticipantsVideoMuted);
		this.CallApi.on('AllParticipantsScreenshareMuted', this.#onAllParticipantsScreenshareMuted);
		this.CallApi.on('YouMuteAllParticipants', this.#onYouMuteAllParticipants);
		this.CallApi.on('RoomSettingsChanged', this.#onRoomSettingsChanged);
		this.CallApi.on('UserPermissionsChanged', this.#onUserPermissionsChanged);
		this.CallApi.on('UserRoleChanged', this.#onUserRoleChanged);
		this.CallApi.on('ParticipantMuted', this.#onParticipantMuted);
		this.CallApi.on('VoiceEnded', this.#onEndpointVoiceEnd);
		this.CallApi.on('RecorderStatusChanged', this.#onRecorderStatusChanged);
		this.CallApi.on('CloudRecordStatusChanged', this.#onCloudRecordStatusChanged);
		this.CallApi.on('Reconnecting', this.#onCallReconnecting);
		this.CallApi.on('Reconnected', this.#onCallReconnected);
		this.CallApi.on('ReconnectingFailed', this.#onCallReconnectingFailed);
		this.CallApi.on('Disconnected', this.#onCallDisconnected);
		// if (Util.shouldCollectStats())
		// {
		this.CallApi.on('CallStatsReceived', this.#onCallStatsReceived);
		// }
		this.CallApi.on('UpdatePacketLoss', this.#onUpdatePacketLoss);
		this.CallApi.on('ConnectionQualityChanged', this.#onConnectionQualityChanged);
		this.CallApi.on('ToggleRemoteParticipantVideo', this.#onToggleRemoteParticipantVideo);
		this.CallApi.on('TrackSubscriptionFailed', this.#onTrackSubscriptionFailed);
	};

	removeCallEvents()
	{
		if (this.CallApi)
		{
			this.CallApi.on('Failed', BX.DoNothing);
			this.CallApi.on('PublishSucceed', BX.DoNothing);
			this.CallApi.on('PublishFailed', BX.DoNothing);
			this.CallApi.on('PublishEnded', BX.DoNothing);
			this.CallApi.on('GetUserMediaEnded', BX.DoNothing);
			this.CallApi.on('RemoteMediaAvailable',  BX.DoNothing);
			this.CallApi.on('RemoteMediaUnavailable',  BX.DoNothing);
			this.CallApi.on('RemoteMediaAdded', BX.DoNothing);
			this.CallApi.on('RemoteMediaRemoved', BX.DoNothing);
			this.CallApi.on('ParticipantJoined', BX.DoNothing);
			this.CallApi.on('ParticipantReconnecting', BX.DoNothing);
			this.CallApi.on('ParticipantReconnected', BX.DoNothing);
			this.CallApi.on('ParticipantLeaved', BX.DoNothing);
			this.CallApi.on('MessageReceived', BX.DoNothing);
			this.CallApi.on('HandRaised', BX.DoNothing);
			this.CallApi.on('AllParticipantsAudioMuted', BX.DoNothing);
			this.CallApi.on('AllParticipantsVideoMuted', BX.DoNothing);
			this.CallApi.on('AllParticipantsScreenshareMuted', BX.DoNothing);
			this.CallApi.on('YouMuteAllParticipants', BX.DoNothing);
			this.CallApi.on('VoiceStarted', BX.DoNothing);
			this.CallApi.on('VoiceEnded', BX.DoNothing);
			this.CallApi.on('RecorderStatusChanged', BX.DoNothing);
			this.CallApi.on('CloudRecordStatusChanged', BX.DoNothing);
			this.CallApi.on('Reconnecting', BX.DoNothing);
			this.CallApi.on('Reconnected', BX.DoNothing);
			this.CallApi.on('ReconnectingFailed', BX.DoNothing);
			this.CallApi.on('Disconnected', BX.DoNothing);
			// if (Util.shouldCollectStats())
			// {
			this.CallApi.on('CallStatsReceived', BX.DoNothing);
			// }
			this.CallApi.on('UpdatePacketLoss', BX.DoNothing);
			this.CallApi.on('ConnectionQualityChanged', BX.DoNothing);
			this.CallApi.on('ToggleRemoteParticipantVideo', BX.DoNothing);
			this.CallApi.on('TrackSubscriptionFailed', BX.DoNothing);
		}
	};

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

			if (this.type === CallType.Instant && this.peers[userId].calculatedState !== UserState.Calling)
			{
				this.peers[userId].onInvited();
			}

			if (!this.users.includes(userId))
			{
				this.users.push(userId);
			}
		}
	};

	toggleRemoteParticipantVideo(participants, showVideo, isPaginateToggle = false) {
		if (this.CallApi) {
			this.CallApi.toggleRemoteParticipantVideo(participants, showVideo, isPaginateToggle)
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

	// Mirrors backend Call::hasActiveUsers TYPE_PERMANENT/TYPE_LANGE rule:
	//  - 2+ participating users → conference is alive regardless of roles;
	//  - exactly 1 → alive only if that user is privileged (initiator,
	//    chat owner / ADMIN, chat manager / MANAGER);
	//  - 0 → not alive.
	// The local user is always counted as participating while ready, so
	// "participating count" = 1 (self) + number of participating peers.
	#shouldKeepConferenceAlive()
	{
		let participatingCount = 1; // self
		let hasPrivileged = this.#isPrivilegedUser(this.userId);

		for (const userId in this.peers)
		{
			if (!this.peers[userId].isParticipating())
			{
				continue;
			}
			participatingCount++;
			if (!hasPrivileged && this.#isPrivilegedUser(userId))
			{
				hasPrivileged = true;
			}
			if (participatingCount >= 2 && hasPrivileged)
			{
				break;
			}
		}

		if (participatingCount >= 2)
		{
			return true;
		}

		return hasPrivileged;
	}

	#isPrivilegedUser(userId)
	{
		const id = Number(userId);
		if (id <= 0)
		{
			return false;
		}
		if (this.initiatorId && id === Number(this.initiatorId))
		{
			return true;
		}

		const ownerId = Number(this.associatedEntity?.ownerId) || 0;
		if (ownerId > 0 && id === ownerId)
		{
			return true;
		}

		if (Array.isArray(this.associatedEntity?.managerIds))
		{
			for (let i = 0; i < this.associatedEntity.managerIds.length; i++)
			{
				if (Number(this.associatedEntity.managerIds[i]) === id)
				{
					return true;
				}
			}
		}

		const role = Util.getUserRoleByUserId(id);
		return role === Util.UsersRoles.ADMIN || role === Util.UsersRoles.MANAGER;
	}

	#onPeerStateChanged = (e) =>
	{
		this.runCallback(CallEvent.onUserStateChanged, e);

		if (!this.ready)
		{
			return;
		}
		if (e.state === UserState.Failed || e.state === UserState.Unavailable || e.state === UserState.Declined || e.state === UserState.Idle)
		{
			if (this.type == CallType.Instant && !this.isAnyoneParticipating())
			{
				// this.hangup();
			}
		}
	};

	#onPeerInviteTimeout = (e) =>
	{
		if (!this.ready)
		{
			return;
		}
		this.signaling.sendUserInviteTimeout({
			userId: this.users,
			failedUserId: e.userId
		})
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
		if (this.pullEventHandlers[command])
		{
			if (command !== 'Call::ping')
			{
				this.log("Signaling: " + command + "; Parameters: " + JSON.stringify(params));
			}
			this.pullEventHandlers[command].call(this, params);
		}
	};

	#onPullEventAnswer = (params) =>
	{
		const senderId = Number(params.senderId);

		if (senderId == this.userId)
		{
			return this.__onPullEventAnswerSelf(params);
		}
	};

	__onPullEventAnswerSelf(params)
	{
		if (params.callInstanceId === this.instanceId)
		{
			return;
		}

		if (this.ready)
		{
			// Received remote self-answer in ready state, ignoring
			return;
		}

		// call was answered elsewhere
		this.runCallback(CallEvent.onJoin, { local: false });
	}

	#onPullEventHangup = (params) => {
		const senderId = params.senderId;
		const callInstanceId = params.callInstanceId;
		const peer = this.peers[senderId];

		if (this.userId === senderId && callInstanceId && this.instanceId !== callInstanceId)
		{
			if (this.ready)
			{
				return;
			}

			// Call declined by the same user elsewhere
			this.runCallback(CallEvent.onLeave, { local: false });

			return;
		}

		if (params.code === 603 && (peer?.calculatedState === UserState.Connected || peer?.calculatedState === UserState.Connecting))
		{
			return;
		}

		if (params.code === 603 && this.userId !== senderId)
		{
			this.runCallback(CallEvent.onUserStateChanged, { userId: senderId, callId: params.callId, state: UserState.Declined });
		}

		if (!peer)
		{
			if (this.ready)
			{
				(this.pendingHangups ??= []).push(params);
			}
			return;
		}

		if (peer.participant && !callInstanceId)
		{
			return;
		}

		Util.sendLog({
			params,
			description: 'GOT A #onPullEventHangup from user',
			pullEvent: '#onPullEventHangup',
		});

		if (!peer.participant)
		{
			if (params.code == 603)
			{
				peer.calculatedState = UserState.Declined;//suppress onUserStateChanged event with UserState.Declined
				peer.setDeclined(true);
			}
			else if (params.code == 486)
			{
				peer.setBusy(true);
				console.warn(`user ${senderId} is busy`);
			}

			// Auto-hangup policy depends on the call type:
			// - Instant (1-1 / group): leave when nobody else is participating.
			// - Conferences (Permanent / Large): mirror backend
			//   Call::hasActiveUsers — keep the room while there are 2+
			//   participating users regardless of roles, or exactly 1
			//   participating user if that user is privileged. Only auto-hangup
			//   when the room would be considered dead by the backend anyway.
			if (this.ready)
			{
				const shouldAutoHangup = this.type === CallType.Instant
					? !this.isAnyoneParticipating()
					: !this.#shouldKeepConferenceAlive();

				if (shouldAutoHangup)
				{
					this.hangup();
				}
			}
		}
	};

	// Aggregated counterpart of Call::answer — server emits one Pull event for
	// a batch of senders (userStatusAction connectedUsers path) instead of N
	// per-user events. Reuses the existing per-sender pipeline so no behavior
	// diverges between the legacy and aggregated paths.
	#onPullEventUsersAnswered = (params) =>
	{
		const senders = Array.isArray(params?.senders) ? params.senders : [];
		const sharedCall = params?.call;
		const callId = params?.callId;
		senders.forEach((sender) => {
			this.#onPullEventAnswer({
				call: sharedCall,
				callId,
				senderId: sender.senderId,
				callInstanceId: sender.callInstanceId,
				isLegacyMobile: sender.isLegacyMobile,
			});
		});
	};

	// Aggregated counterpart of Call::hangup for userStatusAction
	// disconnectedUsers — same fan-out reduction as #onPullEventUsersAnswered.
	#onPullEventUsersHangup = (params) =>
	{
		const users = Array.isArray(params?.users) ? params.users : [];
		const sharedCall = params?.call;
		const callId = params?.callId;
		const sharedCode = params?.code;
		users.forEach((user) => {
			this.#onPullEventHangup({
				call: sharedCall,
				callId,
				senderId: user.senderId ?? user.userId,
				callInstanceId: user.callInstanceId,
				code: user.code ?? sharedCode,
			});
		});
	};

	#onPullEventFinish = () =>
	{
		this.destroy();
	};

	#onPullEventSwitchTrackRecordStatus = (e) =>
	{
		this.runCallback(CallEvent.onSwitchTrackRecordStatus, {
			isTrackRecordOn: e.isTrackRecordOn,
			errorCode: e.errorCode,
		});
	}

	#onLocalMediaRendererAdded = (mediaStreamsKind) => {
		const kind = Util.MediaKind[mediaStreamsKind];
		if (!kind)
		{
			this.log(`Wrong kind for local mediaRenderer: ${mediaStreamsKind}`);

			return;
		}

		this.log('__onLocalMediaRendererAdded', kind);

		const isNotSupportDevicesListBeforeStream = UnsupportedBrowserFeatures.isNotSupportDevicesListBeforeStream;
		let track = null;
		let mediaRenderer = null;

		switch (mediaStreamsKind)
		{
			case MediaStreamsKinds.Camera:
				if (!this.videoEnabled)
				{
					return;
				}

				track = CallStreamManager.getLocalStream(mediaStreamsKind);
				mediaRenderer = new MediaRenderer({ kind, track });

				this.runCallback(CallEvent.onLocalMediaReceived, {
					mediaRenderer,
					tag: 'main',
					stream: mediaRenderer.stream,
				});

				if (isNotSupportDevicesListBeforeStream)
				{
					this.runCallback(CallEvent.onGetUserMediaEnded, {});
				}
				break;

			case MediaStreamsKinds.Screen:
				this.log('Screen shared');
				this.screenShared = true;
				this.waitingLocalScreenShare = false;

				track = CallStreamManager.getLocalStream(mediaStreamsKind);
				mediaRenderer = new MediaRenderer({ kind, track });

				this.runCallback(CallEvent.onLocalMediaReceived, {
					mediaRenderer,
					tag: 'screen',
					stream: mediaRenderer.stream,
				});
				break;

			case MediaStreamsKinds.Microphone:
				this.signaling.sendMicrophoneState(true);
				this.#setPublishingState(mediaStreamsKind, false);

				track = CallStreamManager.getLocalStream(mediaStreamsKind);
				this.#onMicAccessResult({
					result: true,
					stream: new MediaStream([track]),
				});

				if (isNotSupportDevicesListBeforeStream)
				{
					this.runCallback(CallEvent.onGetUserMediaEnded, {});
				}

				if (Hardware.isMicrophoneMuted) // task-597518
				{
					this.CallApi?.disableAudio({ calledFrom: 'onLocalMediaRendererAdded' });
				}
				break;

			default:
		}
	};

	#onLocalMediaRendererMuteToggled = (source, muted) => {
		if (source === MediaStreamsKinds.Microphone)
		{
			this.#setPublishingState(MediaStreamsKinds.Microphone, false);
			this.signaling.sendMicrophoneState(!muted);
		}
		else if (source === MediaStreamsKinds.Camera)
		{
			this.#setPublishingState(MediaStreamsKinds.Camera, false);
		}
	};

	#onMediaMutedBySystem = (muted) =>
	{
		const microphoneState = muted ? false : !Hardware.isMicrophoneMuted;
		const cameraState = muted ? false : Hardware.isCameraOn;
		this.signaling.sendMicrophoneState(microphoneState);
		this.signaling.sendCameraState(cameraState);
	}

	#onLocalMediaRendererEnded = (e, interrupted) =>
	{
		const kind = Util.MediaKind[e];
		if (!kind)
		{
			this.log(`Wrong kind for mediaRenderer: ${e}`);
			return;
		}

		if (!this.CallApi)
		{
			return;
		}

		switch (e)
		{
			case MediaStreamsKinds.Camera:
			case MediaStreamsKinds.Microphone:
				if (!interrupted)
				{
					this.#onBeforeLocalMediaRendererRemoved(e);
				}
				break;
			case MediaStreamsKinds.Screen:
				this.#onBeforeLocalMediaRendererRemoved(e);
				break;
		}
	}

	#onGetUserMediaStarted = (options) => {
		if (options.video)
		{
			this.getUserMediaFulfilled.video = false;
			this.signaling.sendCameraState(false);
		}

		if (options.audio)
		{
			this.getUserMediaFulfilled.audio = false;
			this.signaling.sendMicrophoneState(false);
		}
	};

	#onGetUserMediaSuccess = (options) => {
		if (options.video && Hardware.isCameraOn)
		{
			this.getUserMediaFulfilled.video = false;
			this.signaling.sendCameraState(true);
		}

		if (options.audio)
		{
			this.getUserMediaFulfilled.audio = false;
			if (!Hardware.isMicrophoneMuted)
			{
				this.signaling.sendMicrophoneState(true);
			}
		}
	};

	#onGetUserMediaEnded = (options) => {
		if (options.video)
		{
			this.#setPublishingState(MediaStreamsKinds.Camera, false);
			this.getUserMediaFulfilled.video = true;
		}

		if (options.audio)
		{
			this.getUserMediaFulfilled.audio = true;
		}
	};

	#onGetUserMediaFailed = (data: any): void => {
		this.runCallback(CallEvent.onGetUserMediaFailed, data);
		if (data.options.video)
		{
			this.getUserMediaFulfilled.video = true;
		}

		if (data.options.audio)
		{
			this.getUserMediaFulfilled.audio = true;
		}
	};

	#onBeforeLocalMediaRendererRemoved = (e) =>
	{
		const kind = Util.MediaKind[e];
		if (!kind)
		{
			this.log(`Wrong kind for mediaRenderer: ${e}`);
			return;
		}

		if (!this.CallApi)
		{
			return;
		}

		this.log("__onBeforeLocalMediaRendererRemoved", kind);

		const mediaRenderer = new MediaRenderer({
			kind,
		});

		switch (e) {
			case MediaStreamsKinds.Camera:
				this.runCallback(CallEvent.onLocalMediaReceived, {
					mediaRenderer,
					tag: 'main',
					stream: new MediaStream(),
					removed: true,
				});
				break;
			case MediaStreamsKinds.Microphone:
				this.runCallback(CallEvent.onLocalMediaStopped, { kind });
				this.#setPublishingState(MediaStreamsKinds.Microphone, false);
				this.signaling.sendMicrophoneState(false);
				break;
			case MediaStreamsKinds.Screen:
				this.CallApi.stopScreenShare();
				this.log("Screen is no longer shared");
				this.runCallback(CallEvent.onUserScreenState, {
					userId: this.userId,
					screenState: false,
				});
				this.screenShared = false;
				this.waitingLocalScreenShare = false;
				this.runCallback(CallEvent.onLocalMediaReceived, {
					mediaRenderer,
					tag: 'screen',
					stream: new MediaStream(),
					removed: true,
				});
				break;
		}
	};

	#onRemoteMediaAvailable = (p, t) =>
	{
		const kind = Util.MediaKind[t.source];
		if (!kind)
		{
			this.log(`Wrong kind for mediaRenderer: ${t.source}`);
			return;

		}

		this.runCallback(CallEvent.onRemoteMediaAvailable, {
			userId: parseInt(p.userId),
			kind: kind,
			available: true,
		});
	};

	#onRemoteMediaUnavailable = (p, t) =>
	{
		const kind = Util.MediaKind[t.source];
		if (!kind)
		{
			this.log(`Wrong kind for mediaRenderer: ${t.source}`);
			return;

		}

		this.runCallback(CallEvent.onRemoteMediaUnavailable, {
			userId: parseInt(p.userId),
			kind: kind,
			available: false,
		});
	};

	#onRemoteMediaAdded = (p, t) =>
	{
		if (p && t)
		{
			const kind = Util.MediaKind[t.source];
			if (!kind)
			{
				this.log(`Wrong kind for mediaRenderer: ${t.source}`);
				return;
			}

			const e = {
				mediaRenderer: new MediaRenderer({
					kind,
					track: t.track
				})
			};

			const peer = this.peers[p.userId];
			if (peer)
			{
				if (kind === 'audio')
				{
					if (this.vads[p.userId])
					{
						this.vads[p.userId].destroy();
					}

					this.vads[p.userId] = new SimpleVAD({
						mediaStream: e.mediaRenderer.stream,
						onVoiceStarted: () =>
						{
							this.#onEndpointVoiceStart({userId: p.userId});
						},
						onVoiceStopped: () =>
						{
							this.#onEndpointVoiceEnd({userId: p.userId});
						},
					});
				}

				// temporary solution to play new streams
				// todo: need to find what cause the problem itself
				if (!peer.participant)
				{
					peer.participant = p;
					peer.updateCalculatedState();
				}
				peer.addMediaRenderer(e.mediaRenderer);
			}

			if (t.source === MediaStreamsKinds.Microphone)
			{
				this.runCallback(CallEvent.onUserMicrophoneState, {
					userId: p.userId,
					microphoneState: !p.isMutedAudio,
				});

				// 	TODO: Maybe we can process it here too in the future?
				// case MediaStreamsKinds.Screen:
				// 	this.runCallback(CallEvent.onUserScreenState, {
				// 		userId: p.userId,
				// 		screenState: p.videoEnabled,
				// 	});
				// 	break;
			}

			console.log(`[RemoteMediaAdded]: UserId: ${p.userId}, source: ${Util.MediaKind[t.source]}`);
			const cameraStateInfo = t.source === MediaStreamsKinds.Camera ? `, cameraState: ${!p?.isMutedVideo}` : '';
			Util.sendLog({ description: `[RemoteMediaAdded]: UserId: ${p.userId}, source: ${Util.MediaKind[t.source]}${cameraStateInfo}` });
		}
	};

	#onRemoteMediaRemoved = (participant, media) => {
		if (participant && media) // sometimes media could be 'undefined'
		{
			const { userId } = participant;
			const { source, track } = media;

			const kind = Util.MediaKind[source];
			if (!kind)
			{
				this.log(`Wrong kind for mediaRenderer: ${source}`);

				return;
			}

			if (kind === 'audio' && this.vads[userId])
			{
				this.vads[userId].destroy();
				delete this.vads[userId];
			}

			const e = {
				mediaRenderer: new MediaRenderer({ kind, track }),
			};

			const peer = this.peers[userId];
			peer?.removeMediaRenderer(e.mediaRenderer);

			if (source === MediaStreamsKinds.Camera)
			{
				this.runCallback(CallEvent.onUserCameraState, {
					userId,
					cameraState: false,
				});
			}

			console.log(`[RemoteMediaRemoved]: UserId: ${userId}, source: ${Util.MediaKind[source]}`);
			const cameraStateInfo = source === MediaStreamsKinds.Camera ? ', cameraState: false' : '';
			Util.sendLog({ description: `[RemoteMediaRemoved]: UserId: ${userId}, source: ${Util.MediaKind[source]}${cameraStateInfo}` });
		}
	};

	#onAwaitedRemoteMediaMuted = (p, t) =>
	{
		if (t.source === MediaStreamsKinds.Camera)
		{
			this.runCallback(CallEvent.onUserCameraState, {
				userId: p.userId,
				cameraState: !t.muted,
			});
		}
	}

	#onRemoteMediaMuteToggled = (participant, track) => {
		const { userId, isMutedAudio, isMutedVideo } = participant;
		if (track.source === MediaStreamsKinds.Microphone)
		{
			const vad = this.vads[userId];
			if (vad && isMutedAudio)
			{
				vad.pause();
			}
			else if (vad && !isMutedAudio)
			{
				vad.resume();
			}

			this.runCallback(CallEvent.onUserMicrophoneState, {
				userId,
				microphoneState: !isMutedAudio,
			});
		}
		else if (track.source === MediaStreamsKinds.Camera)
		{
			this.runCallback(CallEvent.onUserCameraState, {
				userId,
				cameraState: !isMutedVideo,
			});
		}
	};

	#onUsersInvited = (params) =>
	{
		this.log('__onUsersInvited', params);
		const users = params.users;
		const show = params.show;

		if (this.type === CallType.Instant)
		{
			this.addInvitedUsers(users, show);
		}
	};

	#onUserInviteTimeout = (params) =>
	{
		this.log('__onUserInviteTimeout', params);
		const failedUserId = params.failedUserId;

		if (this.peers[failedUserId])
		{
			this.peers[failedUserId].onInviteTimeout(false);
		}
	};

	#onParticipantJoined = (p) => {
		clearTimeout(this.waitForAnswerTimeout);
		let peer = this.peers[p.userId];

		if (!peer)
		{
			const userId = parseInt(p.userId, 10);
			if (!this.users.includes(userId))
			{
				this.users.push(userId);
			}

			peer = this.createPeer(userId);
			this.peers[userId] = peer;
		}

		this.runCallback(CallEvent.onUserJoined, {
			userId: p.userId,
			userData: {
				[p.userId]: {
					name: p.name,
					avatar_hr: p.image,
					avatar: p.image,
					gender: p.gender,
				},
			},
		});

		if (!p.audioEnabled || p.isMutedAudio)
		{
			this.runCallback(CallEvent.onUserMicrophoneState, {
				userId: p.userId,
				microphoneState: false,
			});
		}

		if (!p.videoEnabled || p.isMutedVideo)
		{
			this.runCallback(CallEvent.onUserCameraState, {
				userId: p.userId,
				cameraState: false,
			});
		}

		if (p.isHandRaised)
		{
			this.runCallback(CallEvent.onUserFloorRequest, {
				userId: p.userId,
				requestActive: p.isHandRaised,
			});
		}

		peer.participant = p;
		peer.setReady(true);

		if (this.commonRecordState.state !== CallCommonRecordState.Stopped && this.commonRecordState.userId === this.userId)
		{
			this.signaling.sendLocalRecordState(this.userId, this.commonRecordState);
		}
	};

	#onParticipantReconnecting = (participant) => {
		const peer = this.peers[participant.userId];

		if (peer)
		{
			peer.reconnecting = true;
			peer.updateCalculatedState();
		}

		this.runCallback(CallEvent.onParticipantReconnecting, { participant });
	};

	#onParticipantReconnected = (participant) => {
		const peer = this.peers[participant.userId];

		if (peer && peer.reconnecting)
		{
			peer.reconnecting = false;
			peer.participant = participant;
			peer.updateCalculatedState();
		}

		this.#onEndpointVoiceEnd({ userId: participant.userId });

		this.runCallback(CallEvent.onParticipantReconnected, { participant });
	};

	#onParticipantLeaved = (participant) => {
		const peer = this.peers[participant.userId];

		if (!peer)
		{
			return;
		}

		this.#resetPeer(participant.userId);
	};

	#resetPeer = (userId) => {
		const peer = this.peers[userId];

		if (!peer)
		{
			return;
		}

		peer.reconnecting = false;

		for (const type in MediaStreamsKinds) {
			const source = MediaStreamsKinds[type];
			const kind = Util.MediaKind[source];
			peer.removeMediaRenderer(new MediaRenderer({ kind }));
		}

		peer.participant = null;
		peer.setReady(false);
	};

	#onMicAccessResult = (e) =>
	{
		if (e.result)
		{
			if (e.stream.getAudioTracks().length > 0)
			{
				if (this.localVAD)
				{
					this.localVAD.destroy();
				}
				this.localVAD = new SimpleVAD({
					mediaStream: e.stream,
					onVoiceStarted: () =>
					{
						if (!Hardware.isMicrophoneMuted)
						{
							this.requestFloor(false);
						}
						this.#onEndpointVoiceStart({userId: this.userId});
					},
					onVoiceStopped: () =>
					{
						this.#onEndpointVoiceEnd({userId: this.userId});
					},
				});

				clearInterval(this.microphoneLevelInterval);
				this.microphoneLevelInterval = setInterval(
					() =>this.microphoneLevel = this.localVAD.currentVolume,
					200
				);
			}
		}
	};

	#onCallReconnecting = (params): void => {
		this.isReconnecting = true;

		const data = Type.isObject(params) ? params : {};
		this.reconnectHistory.startEntry(data.reconnectionReason ?? null, ReconnectTarget.Sdk);

		if (this._reconnectionEventCount === 0)
		{
			params.reconnectionEventCount = this.reconnectionEventCount + 1;

			this.runCallback(CallEvent.onReconnecting, params);
		}

		// One event per incident, not per attempt: the counter is what closes the condition above and
		// is reset to zero once the call is connected again.
		this.reconnectionEventCount++;
	}

	#onCallReconnected = (): void => {
		this.isReconnecting = false;
		this.reconnectionEventCount = 0;
		this.reconnectHistory.updateLastEntry(ReconnectTarget.Sdk, true);
		this.log("Call reconnected");
		this.sendTelemetryEvent("reconnect");
		this.localUserState = UserState.Connected;

		if (this.screenShared || this.waitingLocalScreenShare)
		{
			this.CallApi.startScreenShare();
		}

		if (!this.CallApi.isAudioPublished())
		{
			this.#setPublishingState(MediaStreamsKinds.Microphone, true);
		}
		this.CallApi.enableAudio({ calledFrom: 'onCallConnected', disabled: Hardware.isMicrophoneMuted });

		//this.signaling.sendCameraState(Hardware.isCameraOn);
		if (Hardware.isCameraOn)
		{
			if (!this.CallApi.isVideoPublished())
			{
				this.#setPublishingState(MediaStreamsKinds.Camera, true);
			}
			this.CallApi.enableVideo({calledFrom: 'onCallReconnected'});
		}

		if (this.videoAllowedFrom == UserMnemonic.none)
		{
			this.signaling.sendHideAll();
		}
		else if (Type.isArray(this.videoAllowedFrom))
		{
			this.signaling.sendShowUsers(this.videoAllowedFrom);
		}

		if (this.commonRecordState.userId === this.userId)
		{
			this.sendLocalRecordState({ action: this.commonRecordState.state, userId: this.userId }, true);
		}

		this.CallApi.raiseHand(this.floorRequestActive);
	};

	#onCallReconnectingFailed = (e, error) => {
		this.runCallback(CallEvent.onReconnectingFailed, { error });
	};

	#onCallDisconnected = (e) =>
	{
		let logData = {};

		const evt = e && typeof e === 'object' ? e : {}
		const {headers, leaveInformation} = evt;

		if (headers) {
			logData = {
				...logData,
				headers,
			}
		}

		if (leaveInformation) {
			logData = {
				...logData,
				leaveInformation,
			}
		}

		this.log("__onCallDisconnected", (Object.keys(logData).length ? logData : null));

		if (this.ready && leaveInformation?.reason !== DisconnectReason.SecurityKeyChanged)
		{
			this.hangup(leaveInformation?.code, leaveInformation?.reason);
		}

		this.sendTelemetryEvent("disconnect");

		this.localUserState = UserState.Idle;

		this.ready = false;
		this.joinedAsViewer = false;
		this.reinitPeers();

		this.localVideoShown = false;
		this.removeCallEvents();
		this.unsubscribeHardwareChanges();

		this.state = CallState.Proceeding;

		if (leaveInformation?.reason === DisconnectReason.SecurityKeyChanged)
		{
			this.#onFatalError(leaveInformation.reason);

			return;
		}

		if (leaveInformation?.reason === DisconnectReason.RoomClosed)
		{
			this.destroy();

			return;
		}

		this.runCallback(CallEvent.onLeave, {
			local: true
		});
	};

	#onFatalError = (error) =>
	{
		if (error && error.call)
		{
			delete error.call;
		}
		this.log("onFatalError", error);

		this.ready = false;
		this.localUserState = UserState.Failed;
		this.reinitPeers();

		this.localVideoShown = false;
		if (this.CallApi)
		{
			this.removeCallEvents();
			this.unsubscribeHardwareChanges();
			try
			{
				this.CallApi.hangup({
					'X-Reason': 'Fatal error',
					'X-Error': typeof (error) === 'string' ? error : error.code || error.name
				})
			} catch (e)
			{
				this.log("Bitrix hangup error: ", e);
				console.error("Bitrix hangup error: ", e);
			}
			this.CallApi = null;
		}

		if (typeof (error) === "string")
		{
			this.runCallback(CallEvent.onCallFailure, {
				name: error
			});
		}
		else if (error.name)
		{
			this.runCallback(CallEvent.onCallFailure, error);
		}
	};

	#onTrackSubscriptionFailed = (params) =>
	{
		this.runCallback(CallEvent.onTrackSubscriptionFailed, params);
	}

	#onCallStatsReceived = (stats) =>
	{
		const usersToSendReports = {};
		// to order local stats by track quality
		const statsIndexByRid = { f: 2, h: 1, q: 0 };
		const mediaServers = {};

		stats.publisher?.forEach((report) =>
		{
			if (report.userId && (report.kind === 'video' || report.kind === 'audio'))
			{
				if (!usersToSendReports[report.userId])
				{
					usersToSendReports[report.userId] = {};
				}

				if (report.kind === 'video')
				{
					if (!usersToSendReports[report.userId][report.source])
					{
						usersToSendReports[report.userId][report.source] = [];
					}

					const index = statsIndexByRid[report.rid] || 0;
					usersToSendReports[report.userId][report.source][index] = report;
				}
				else if (report.kind === 'audio')
				{
					usersToSendReports[report.userId][report.source] = report;
				}
				mediaServers[report.userId] = report.mediaServerId;
			}
		});

		stats?.subscriber?.forEach((report) =>
		{
			if (report.userId && (report.kind === 'video' || report.kind === 'audio'))
			{
				if (!usersToSendReports[report.userId])
				{
					usersToSendReports[report.userId] = {};
				}
				usersToSendReports[report.userId][report.source] = report;
				mediaServers[report.userId] = report.mediaServerId;
			}
		});

		for (let userId in usersToSendReports)
		{
			this.runCallback(CallEvent.onUserStatsReceived, {
				userId,
				report: usersToSendReports[userId],
				mediaServerId: mediaServers[userId],
			});
		}

		// todo: need to correct stats format
		// if (this.logger)
		// {
		// 	this.logger.sendStat(transformVoxStats(e.stats, this.CallApi));
		// }
	}

	#onUpdatePacketLoss = (participants) =>
	{
		const prevPeersWithBadConnection = new Set([...this.peersWithBadConnection.values()]);
		participants.forEach(userId =>
		{
			const peer = this.peers[userId];
			if (peer)
			{
				if (!prevPeersWithBadConnection.has(userId))
				{
					this.peersWithBadConnection.add(userId);
				}
				else
				{
					prevPeersWithBadConnection.delete(userId);
				}
			}
		});
	}

	#onConnectionQualityChanged = participants =>
	{
		Object.keys(participants).forEach(participantId => {
			this.runCallback(
				CallEvent.onConnectionQualityChanged,
				{
					userId: Number(participantId),
					score: participants[participantId],
				}
			);
		})
	}

	#onToggleRemoteParticipantVideo = isVideoShown =>
	{
		this.runCallback(
			CallEvent.onToggleRemoteParticipantVideo,
			{ isVideoShown }
		);
	}

	#onCallMessageReceived = (event) =>
	{
		const message = event.content;
		let peer;

		const eventName = message.eventName;
		if (eventName === clientEvents.cameraState)
		{
			// todo: remove sending this event
		}
		else if (eventName === clientEvents.videoPaused)
		{
			if (message.senderId === this.userId)
			{
				return;
			}
			this.runCallback(CallEvent.onUserVideoPaused, {
				userId: message.senderId,
				videoPaused: message.videoPaused === "Y"
			});
		}
		else if (eventName === clientEvents.screenState)
		{
			this.runCallback(CallEvent.onUserScreenState, {
				userId: message.senderId,
				screenState: message.screenState === "Y"
			});
		}
		else if (eventName === clientEvents.commonRecordState)
		{
			this.runCallback(CallEvent.onUserCommonRecordState, {
				userId: message.senderId,
				commonRecordState: message.commonRecordState,
			});
		}
		else if (eventName === clientEvents.emotion)
		{
			this.runCallback(CallEvent.onUserEmotion, {
				userId: message.senderId,
				toUserId: message.toUserId,
				emotion: message.emotion
			})
		}
		else if (eventName === clientEvents.usersInvited)
		{
			this.#onUsersInvited(message);
		}
		else if (eventName === clientEvents.userInviteTimeout)
		{
			this.#onUserInviteTimeout(message);
		}
		else if (eventName === clientEvents.customMessage)
		{
			this.runCallback(CallEvent.onCustomMessage, {
				message: message.message
			})
		}
		else if (eventName === scenarioEvents.viewerJoined)
		{
			console.log("viewer " + message.senderId + " joined");
			peer = this.peers[message.senderId];
			if (peer)
			{
				peer.setDirection(EndpointDirection.RecvOnly);
				peer.setReady(true);
			}
		}
		else if (eventName === scenarioEvents.viewerLeft)
		{
			console.log("viewer " + message.senderId + " left");
			peer = this.peers[message.senderId];
			if (peer)
			{
				peer.setReady(false);
			}
		}
		else if (eventName === clientEvents.microphoneState)
		{
			// do nothing
		}
		else
		{
			this.log("Unknown scenario event " + eventName);
		}
	};

	#onCallHandRaised = (p) =>
	{
		this.runCallback(CallEvent.onUserFloorRequest, {
			userId: p.userId,
			requestActive: p.isHandRaised
		})
	}

	#onAllParticipantsAudioMuted = (p) =>
	{
		this.runCallback(CallEvent.onAllParticipantsAudioMuted, {
			userId: p.fromUserId,
			reason: p.reason,
		})
	}

	#onTurnOnCamera = (p) =>
	{
		this.runCallback(CallEvent.onTurnOnCamera);
	}

	#onAllParticipantsVideoMuted = (p) =>
	{
		this.runCallback(CallEvent.onAllParticipantsVideoMuted, {
			userId: p.fromUserId,
			reason: p.reason,
		})
	}

	#onAllParticipantsScreenshareMuted = (p) =>
	{
		this.runCallback(CallEvent.onAllParticipantsScreenshareMuted, {
			userId: p.fromUserId,
			reason: p.reason,
		})
	}

	#onYouMuteAllParticipants = (p) =>
	{
		this.runCallback(CallEvent.onYouMuteAllParticipants, {
			data: p
		})
	}

	#onRoomSettingsChanged = (p) =>
	{
		this.runCallback(CallEvent.onRoomSettingsChanged, {
			data: p
		})
	}

	#onUserPermissionsChanged = (p) =>
	{
		this.runCallback(CallEvent.onUserPermissionsChanged, {
			data: p
		})
	}

	#onUserRoleChanged = (p) =>
	{
		this.runCallback(CallEvent.onUserRoleChanged, {
			data: p
		})
	}

	#onParticipantMuted = (p) =>
	{
		this.runCallback(CallEvent.onParticipantMuted, {
			data: p
		})
	}

	#onEndpointVoiceStart = (p) =>
	{
		// for local user we need to send extra signal to show unmute hint
		if (p.userId === this.userId)
		{
			this.runCallback(CallEvent.onUserVoiceStarted, {
				userId: p.userId,
				local: true,
			});

			if (Hardware.isMicrophoneMuted)
			{
				return;
			}
		}

		this.runCallback(CallEvent.onUserVoiceStarted, {
			userId: p.userId,
		});
	};

	#onEndpointVoiceEnd = (p) => {
		this.runCallback(CallEvent.onUserVoiceStopped, {
			userId: p.userId,
		});
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

	sendTelemetryEvent(eventName)
	{
		Util.sendTelemetryEvent({
			call_id: this.id,
			user_id: this.userId,
			kind: "Bitrix",
			event: eventName,
		})
	};

	testReconnect(): void
	{
		if (!this.CallApi)
		{
			return;
		}

		this.CallApi.testReconnect();
	}

	destroy(finishCall = false)
	{
		if (this.destroyed)
		{
			return;
		}
		this.destroyed = true;

		this.ready = false;
		this.joinedAsViewer = false;
		this.localVideoShown = false;
		this.floorRequestActive = false;

		if (this.speakerManager)
		{
			this.speakerManager.destroy();
		}

		if (this.localVAD)
		{
			this.localVAD.destroy();
			this.localVAD = null;
		}

		for (let userId in this.vads)
		{
			if (this.vads[userId])
			{
				this.vads[userId].destroy();
				delete this.vads[userId];
			}
		}

		clearInterval(this.microphoneLevelInterval);
		if (this.CallApi)
		{
			this.removeCallEvents();
			this.unsubscribeHardwareChanges();
			this.CallApi.hangup(finishCall);
			this.CallApi = null;
		}

		for (let userId in this.peers)
		{
			if (this.peers.hasOwnProperty(userId) && this.peers[userId])
			{
				this.peers[userId].destroy();
			}
		}

		this.runCallback(CallEvent.onLeave, { local: true });

		return super.destroy();
	};
}

class Signaling
{
	constructor(params)
	{
		this.call = params.call;
	};

	inviteUsers(data)
	{
		return this.#runRestAction(ajaxActions.invite, data);
	};

	sendUsersInvited(data)
	{
		this.#sendMessage(clientEvents.usersInvited, {
			users: data.userData,
		});
	}

	sendCameraState(cameraState)
	{
		return this.#sendMessage(clientEvents.cameraState, {
			cameraState: cameraState ? "Y" : "N"
		});
	};

	sendVideoPaused(videoPaused)
	{
		return this.#sendMessage(clientEvents.videoPaused, {
			videoPaused: videoPaused ? "Y" : "N"
		});
	};

	sendMicrophoneState(microphoneState)
	{
		return this.#sendMessage(clientEvents.microphoneState, {
			microphoneState: microphoneState ? "Y" : "N"
		});
	};

	sendScreenState(screenState)
	{
		return this.#sendMessage(clientEvents.screenState, {
			screenState: screenState ? "Y" : "N"
		});
	};

	/**
	 * @group CommonRecord
	 */
	sendLocalRecordState(userId, commonRecordState)
	{
		this.#sendMessage(clientEvents.commonRecordState, {
			senderId: userId,
			commonRecordState,
		});
	}

	sendCustomMessage(message, repeatOnConnect)
	{
		return this.#sendMessage(clientEvents.customMessage, {
			message: message,
			repeatOnConnect: !!repeatOnConnect
		});
	};

	sendShowUsers(users)
	{
		return this.#sendMessage(clientEvents.showUsers, {
			users: users
		});
	};

	sendShowAll()
	{
		return this.#sendMessage(clientEvents.showAll, {});
	};

	sendHideAll()
	{
		return this.#sendMessage(clientEvents.hideAll, {});
	};

	sendUserInviteTimeout(data)
	{
		return this.#sendMessage(clientEvents.userInviteTimeout, {data});
	};

	#sendMessage(eventName, data)
	{
		if (!this.call.CallApi)
		{
			return;
		}

		if (!Type.isPlainObject(data))
		{
			data = {};
		}
		data.eventName = eventName;
		data.requestId = Util.getUuidv4();
		data.senderId = this.call.userId;

		this.call.CallApi.sendMessage(JSON.stringify(data));
	};

	#runRestAction(signalName, data)
	{
		if (!Type.isPlainObject(data))
		{
			data = {};
		}

		data.callUuid = this.call.uuid;
		data.callInstanceId = this.call.instanceId;
		data.requestId = Util.getUuidv4();

		return BX.ajax.runAction(signalName, { data });
	}
}

class Peer
{
	calculatedState: string

	constructor(params)
	{
		this.userId = params.userId;
		this.call = params.call;

		this.ready = !!params.ready;
		this.calling = false;
		this.declined = false;
		this.busy = false;
		this.reconnecting = false;
		this.inviteTimeout = false;
		this.direction = params.direction || EndpointDirection.SendRecv;

		this.stream = null;
		this.mediaRenderers = [];

		this.isIncomingVideoAllowed = params.isIncomingVideoAllowed !== false;

		this.callingTimeout = 0;

		this.callbacks = {
			onStateChanged: Type.isFunction(params.onStateChanged) ? params.onStateChanged : BX.DoNothing,
			onInviteTimeout: Type.isFunction(params.onInviteTimeout) ? params.onInviteTimeout : BX.DoNothing,
			onMediaReceived: Type.isFunction(params.onMediaReceived) ? params.onMediaReceived : BX.DoNothing,
			onMediaRemoved: Type.isFunction(params.onMediaRemoved) ? params.onMediaRemoved : BX.DoNothing,
		};

		this.calculatedState = this.calculateState();
	};

	setReady(ready)
	{
		ready = !!ready;
		if (this.ready === ready)
		{
			return;
		}
		this.ready = ready;
		if (this.calling)
		{
			clearTimeout(this.callingTimeout);
			this.calling = false;
			this.inviteTimeout = false;
		}
		if (this.ready)
		{
			this.declined = false;
			this.busy = false;
		}

		this.updateCalculatedState();
	}

	setDirection(direction)
	{
		if (this.direction === direction)
		{
			return;
		}
		this.direction = direction;
	}

	setDeclined(declined)
	{
		this.declined = declined;
		if (this.calling)
		{
			clearTimeout(this.callingTimeout);
			this.calling = false;
		}
		if (this.declined)
		{
			this.ready = false;
			this.busy = false;
		}
		this.updateCalculatedState();
	}

	setBusy(busy)
	{
		this.busy = busy;
		if (this.calling)
		{
			clearTimeout(this.callingTimeout);
			this.calling = false;
		}
		if (this.busy)
		{
			this.ready = false;
			this.declined = false;
		}
		this.updateCalculatedState();
	}

	allowIncomingVideo(isIncomingVideoAllowed)
	{
		if (this.isIncomingVideoAllowed == isIncomingVideoAllowed)
		{
			return;
		}

		this.isIncomingVideoAllowed = !!isIncomingVideoAllowed;
	}

	addMediaRenderer(mediaRenderer)
	{
		this.log('Adding media renderer for user' + this.userId, mediaRenderer);

		this.mediaRenderers.push(mediaRenderer);

		this.callbacks.onMediaReceived({
			userId: this.userId,
			kind: mediaRenderer.kind,
			mediaRenderer: mediaRenderer
		});
		this.updateCalculatedState();
	}

	removeMediaRenderer(mediaRenderer)
	{
		this.log('Removing media renderer for user' + this.userId, mediaRenderer);

		let i
		this.mediaRenderers.forEach((el, index) => {
			if (el.kind === mediaRenderer.kind) {
				i = index;
			}
		})

		if (i >= 0)
		{
			this.mediaRenderers.splice(i, 1);
		}
		this.callbacks.onMediaRemoved({
			userId: this.userId,
			kind: mediaRenderer.kind,
			mediaRenderer: mediaRenderer
		});
		this.updateCalculatedState();
	}

	calculateState()
	{
		if (this.reconnecting)
		{
			return UserState.Connecting;
		}

		if (this.participant)
		{
			return UserState.Connected;
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
	}

	updateCalculatedState()
	{
		const calculatedState = this.calculateState();

		if (this.calculatedState !== calculatedState)
		{
			this.callbacks.onStateChanged({
				userId: this.userId,
				state: calculatedState,
				previousState: this.calculatedState,
				direction: this.direction,
			});
			this.calculatedState = calculatedState;
		}
	}

	isParticipating()
	{
		return ((this.calling || this.ready || this.participant) && !this.declined);
	}

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
		this.callingTimeout = setTimeout(() => this.onInviteTimeout(true), this.call.invitePeriod);
		this.updateCalculatedState();
	}

	onInviteTimeout(internal)
	{
		clearTimeout(this.callingTimeout);
		if (!(this.calling))
		{
			return;
		}
		this.calling = false;
		this.inviteTimeout = true;
		if (internal)
		{
			this.callbacks.onInviteTimeout({
				userId: this.userId
			});
		}
		this.updateCalculatedState();
	}

	log()
	{
		this.call.log.apply(this.call, arguments);
	}

	destroy()
	{
		if (this.stream)
		{
			Util.sendLog({ description: 'Stop peer media stream' });
			Util.stopMediaStream(this.stream);
			this.stream = null;
		}

		this.callbacks.onStateChanged = BX.DoNothing;
		this.callbacks.onInviteTimeout = BX.DoNothing;
		this.callbacks.onMediaReceived = BX.DoNothing;
		this.callbacks.onMediaRemoved = BX.DoNothing;

		clearTimeout(this.callingTimeout);
		this.callingTimeout = null;
	}
}

const transformVoxStats = function (s, CallApi)
{
	let result = {
		connection: s.connection,
		outboundAudio: [],
		outboundVideo: [],
		inboundAudio: [],
		inboundVideo: [],
	}

	let endpoints = {};
	if (CallApi.getEndpoints)
	{
		CallApi.getEndpoints().forEach(endpoint => endpoints[endpoint.id] = endpoint)
	}

	if (!result.connection.timestamp)
	{
		result.connection.timestamp = Date.now();
	}
	for (let trackId in s.outbound)
	{
		if (!s.outbound.hasOwnProperty(trackId))
		{
			continue;
		}
		const statGroup = s.outbound[trackId];
		for (let i = 0; i < statGroup.length; i++)
		{
			let stat = statGroup[i];
			stat.trackId = trackId;
			if ('audioLevel' in stat)
			{
				result.outboundAudio.push(stat)
			}
			else
			{
				result.outboundVideo.push(stat)
			}
		}
	}
	for (let trackId in s.inbound)
	{
		if (!s.inbound.hasOwnProperty(trackId))
		{
			continue;
		}
		let stat = s.inbound[trackId];
		if (!('endpoint' in stat))
		{
			continue;
		}
		stat.trackId = trackId;
		if ('audioLevel' in stat)
		{
			result.inboundAudio.push(stat)
		}
		else
		{
			if (endpoints[stat.endpoint])
			{
				let videoRenderer = endpoints[stat.endpoint].mediaRenderers.find(r => r.id == stat.trackId)
				if (videoRenderer && videoRenderer.element)
				{
					stat.actualHeight = videoRenderer.element.videoHeight;
					stat.actualWidth = videoRenderer.element.videoWidth;
				}
			}

			result.inboundVideo.push(stat)
		}
	}
	return result;

}
