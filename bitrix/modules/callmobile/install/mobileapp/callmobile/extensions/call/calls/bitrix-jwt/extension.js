jn.define('call/calls/bitrix-jwt', (require, exports, module) => {
	include('Calls');

	const { CallLogger } = require('call/calls/logger');
	const { ActiveCallNotification } = require('call/calls/active-call-notification');
	const { IncomingCallHider } = require('call/calls/incoming-call-hider');
	const { SignalsBehavior, MediaStreamKind, StreamQuality } = require('call/const');
	const { CallSettingsManager } = require('call/settings-manager');
	const { NetworkQualityEvaluator } = require('call/network-quality-evaluator');

	BX.DoNothing = function() {};

	// NQE WebRTC stats polling interval (ms), aligned with web (SDD P2)
	const NQE_STATS_INTERVAL_MS = 3000;

	const ajaxActions = {
		invite: 'call.Call.invite',
		decline: 'call.Call.decline',
	};

	const pullEvents = {
		switchTrackRecordStatus: 'Call::switchTrackRecordStatus',
	};

	const clientEvents = {
		voiceStarted: 'Call::voiceStarted',
		voiceStopped: 'Call::voiceStopped',
		microphoneState: 'Call::microphoneState',
		cameraState: 'Call::cameraState',
		videoPaused: 'Call::videoPaused',
		screenState: 'Call::screenState',
		floorRequest: 'Call::floorRequest',
		emotion: 'Call::emotion',
		usersInvited: 'Call::usersInvited',
		userInviteTimeout: 'Call::userInviteTimeout',
		showUsers: 'Call::showUsers',
		showAll: 'Call::showAll',
		hideAll: 'Call::hideAll',
		recordState: 'Call::recordState',
	};

	const RecordStatus = {
		2: 'started',
		3: 'stopped',
		4: 'paused',
	};

	const BitrixCallDevEvent = {
		onCallConference: 'BitrixCallDev::onCallConference',
	};

	const connectionRestoreTime = 15000;
	const PING_TIMEOUT_MULTIPLIER = 2.5;

	class BitrixCallJwt
	{
		constructor(params)
		{
			this.id = params.id;
			this.uuid = params.uuid;
			this.instanceId = params.instanceId;
			//TODO: can parentId be not null?
			this.parentId = params.parentId || null;
			this.parentUuid = params.parentUuid || null;
			this.direction = params.direction;
			this.type = params.type || BX.Call.Type.Instant; // @see {BX.Call.Type}
			this.users = [];
			this.scheme = params.scheme;
			this.isTransitioningToGroupCall = false;

			// NQE instance (will be initialized if config allows)
			this.nqe = null;
			this.peerConnectionStatsInterval = null;
			this.currentQuality = StreamQuality.high;
			// NQE quality ceiling applied to every native video subscription in the choke point.
			// null = no cap (no native stats yet), so the grid emits pass through unchanged.
			this.nqeQualityCeiling = null;

			// Pull provider for the grid's per-user subscription snapshot, injected by the controller.
			// Lets NQE auto-quality cap quality at min(grid, nqe) per shown user without a direct
			// transport -> UI reference.
			this.visibleUsersProvider = null;

			this.ready = false;
			this.userId = env.userId;
			this.userData = params.userData;
			this.usersAfterReconnect = null;
			// Participant snapshot scoped to ONE reconnect (see `__onCallReconnecting`). Unlike
			// `usersAfterReconnect`, which is never cleared and therefore holds the last joinResponse
			// ever seen (including the initial join), this field is armed empty on every reconnect
			// attempt, written ONLY by a joinResponse that lands while that reconnect is still in
			// flight, and consumed by `__onCallReconnected`. Consumers may only treat it as "the
			// state of the room at the end of THIS outage" because of that lifetime.
			this.reconnectParticipantsSnapshot = null;
			// The write gate of the field above, as one explicit state instead of a predicate over
			// `_reconnectionEventCount`. That counter has its own semantics and THREE reset points
			// (here, `onCallConnected`, `__onCallReconnected`), only one of which is about the
			// snapshot; deriving the gate from it made "gate open" and "snapshot armed" drift apart.
			// Armed only between entering a reconnect and resolving it.
			this.isReconnectSnapshotArmed = false;
			this.autoSubscribe = params.connectionData?.roomType === BX.Call.RoomType.Large ? 0 : 1;

			this.initiatorId = params.initiatorId || '';

			this.associatedEntity = BX.type.isPlainObject(params.associatedEntity) ? params.associatedEntity : {};
			this.startDate = new Date(BX.prop.getString(params, 'startDate', ''));

			// media constraints

			this.videoEnabled = params.videoEnabled === true;
			this.cameraId = params.cameraId || '';
			this.microphoneId = params.microphoneId || '';

			this.muted = params.muted === true;
			this.invitePeriod = params.invitePeriod;

			this.logToken = params.logToken || '';
			this.addLogToken(this.logToken);

			this.connectionData = params.connectionData || {};

			this._recorderState = BX.Call.RecorderStatus.None;

			this.bitrixCallDev = null;

			this.signaling = new Signaling({
				call: this,
			});

			this.peers = {};
			this.audioTracks = new Map();
			this._joinStatus = BX.Call.JoinStatus.None;
			Object.defineProperty(this, 'joinStatus', {
				get: this.getJoinStatus.bind(this),
				set: this.setJoinStatus.bind(this),
			});
			this._active = false; // has remote pings
			Object.defineProperty(this, 'active', {
				get: this.getActive.bind(this),
				set: this.setActive.bind(this),
			});

			this.localVideoShown = false;
			this.clientEventsBound = false;
			this._screenShared = false;

			this.someoneWasConnected = false;

			this.client = null;

			this.incomingCallHiderService = new IncomingCallHider();

			this.eventEmitter = new JNEventEmitter();
			if (typeof (params.events) === 'object')
			{
				for (const eventName in params.events)
				{
					this.eventEmitter.on(eventName, params.events[eventName]);
				}
			}

			// event handlers
			this.__onLocalVideoStreamReceivedHandler = this.__onLocalVideoStreamReceived.bind(this);
			this.__onLocalVideoStreamRemovedHandler = this.__onLocalVideoStreamRemoved.bind(this);

			this.__onCallDisconnectedHandler = this.__onCallDisconnected.bind(this);
			this.__onCallMessageReceivedHandler = this.__onCallMessageReceived.bind(this);
			this.__onCallEndpointAddedHandler = this.__onCallEndpointAdded.bind(this);
			this.__onCallEndpointsAddedHandler = this.__onCallEndpointsAdded.bind(this);
			this.__onCallRecorderStatusChangedHandler = this.__onCallRecorderStatusChanged.bind(this);
			this.__onCallReconnectingHandler = this.__onCallReconnecting.bind(this);
			this.__onCallReconnectedHandler = this.__onCallReconnected.bind(this);
			this.__onUsersLimitExceededHandler = this.__onUsersLimitExceeded.bind(this);
			this.__onSignalingResponseReceivedHandler = this.__onSignalingResponseReceived.bind(this);
			this.__onRemoteMediaAvailableHandler = this.__onRemoteMediaAvailable.bind(this);

			this.__onSDKLogMessageHandler = this.__onSDKLogMessage.bind(this);

			this.created = new Date();

			this._reconnectionEventCount = 0;
			this._maxReconnectionAttempts = 5;
			this.activeCallNotification = new ActiveCallNotification({
				onSwitchMicrophonesStatus: () => this.eventEmitter.emit(BX.Call.Event.onActiveCallNotificationSwitchMicrophoneStatusPress),
				onHangup: () => this.eventEmitter.emit(BX.Call.Event.onActiveCallNotificationHangupButtonPress)
			});
		}

		get provider()
		{
			return BX.Call.Provider.Bitrix;
		}

		get hasConnectionData()
		{
			return Boolean(this.connectionData?.mediaServerUrl && this.connectionData?.roomData);
		}

		setConnectionData(connectionData)
		{
			this.connectionData = connectionData;
			this.autoSubscribe = connectionData?.roomType === BX.Call.RoomType.Large ? 0 : 1;
		}

		addLogToken(logToken)
		{
			if (this.logger || !logToken)
			{
				return;
			}

			this.logToken = logToken || '';
			if (callEngine.getLogService() && this.logToken)
			{
				this.logger = new CallLogger(callEngine.getLogService(), this.logToken);
			}
		}

		log()
		{
			const text = CallUtil.getLogMessage.apply(CallUtil, arguments);
			if (console && callEngine.debugFlag)
			{
				const a = [`Call log [${CallUtil.getTimeForLog()}]: `];
				console.log.apply(this, a.concat(Array.prototype.slice.call(arguments)));
			}

			if (this.logger)
			{
				this.logger.log(text);
			}
		}

		on(event, handler)
		{
			this.eventEmitter.on(event, handler);

			return this;
		}

		off(event, handler)
		{
			if (this.eventEmitter)
			{
				this.eventEmitter.off(event, handler);
			}

			return this;
		}

		initPeers()
		{
			this.users.forEach((userId) => {
				userId = parseInt(userId, 10);
				this.peers[userId] = this.createPeer(userId);
			});
		}

		reinitPeers()
		{
			for (const userId in this.peers)
			{
				if (this.peers.hasOwnProperty(userId) && this.peers[userId])
				{
					this.peers[userId].destroy();
					this.peers[userId] = null;
				}
			}

			this.initPeers();
		}

		repeatAnswerEvents()
		{
			this.signaling.sendRepeatAnswer({ userId: this.userId });
		}

		createPeer(userId, canChangeUI = true)
		{
			let incomingVideoAllowed;
			if (this.videoAllowedFrom === BX.Call.UserMnemonic.all)
			{
				incomingVideoAllowed = true;
			}
			else if (this.videoAllowedFrom === BX.Call.UserMnemonic.none)
			{
				incomingVideoAllowed = false;
			}
			else if (BX.type.isArray(this.videoAllowedFrom))
			{
				incomingVideoAllowed = this.videoAllowedFrom.some((allowedUserId) => {
					return allowedUserId == userId;
				});
			}
			else
			{
				incomingVideoAllowed = true;
			}

			return new Peer({
				call: this,
				userId,
				ready: userId == this.initiatorId,
				isIncomingVideoAllowed: incomingVideoAllowed,
				canChangeUI: canChangeUI,

				onStreamReceived: (e) => this.eventEmitter.emit(BX.Call.Event.onStreamReceived, [e.userId, e.stream, e.canChangeUI]),
				onUserVoiceStarted: (e) => this.eventEmitter.emit(BX.Call.Event.onUserVoiceStarted, [e.userId]),
				onUserVoiceStopped: (e) => this.eventEmitter.emit(BX.Call.Event.onUserVoiceStopped, [e.userId]),
				onStateChanged: this.__onPeerStateChanged.bind(this),
				onInviteTimeout: this.__onPeerInviteTimeout.bind(this),
				onInitialState: (e) => {
					this.eventEmitter.emit(BX.Call.Event.onUserFloorRequest, [e.userId, e.floorRequest, e.canChangeUI]);
					this.eventEmitter.emit(BX.Call.Event.onUserMicrophoneState, [e.userId, e.microphoneState, e.canChangeUI]);
				},
				onHandRaised: (e) => this.eventEmitter.emit(BX.Call.Event.onUserFloorRequest, [e.userId, e.isHandRaised, e.canChangeUI]),
			});
		}

		getUsersStates()
		{
			const result = {};
			for (const userId in this.peers)
			{
				result[userId] = this.peers[userId].calculatedState;
			}

			return result;
		}

		getJoinStatus()
		{
			return this._joinStatus;
		}

		setJoinStatus(newStatus)
		{
			if (newStatus == this._joinStatus)
			{
				return;
			}
			this._joinStatus = newStatus;
			switch (this._joinStatus)
			{
				case BX.Call.JoinStatus.Local:
					this.eventEmitter.emit(BX.Call.Event.onJoin, [{ callUuid: this.uuid, local: true }]);
					break;
				case BX.Call.JoinStatus.Remote:
					this.eventEmitter.emit(BX.Call.Event.onJoin, [{ callUuid: this.uuid, local: false }]);
					break;
				case BX.Call.JoinStatus.None:
					this.eventEmitter.emit(BX.Call.Event.onLeave, [{ callUuid: this.uuid }]);
					break;
			}
		}

		getActive()
		{
			return this._active;
		}

		setActive(newActive)
		{
			if (newActive === this._active)
			{
				return;
			}
			this._active = newActive;
			this.eventEmitter.emit(this.active ? BX.Call.Event.onActive : BX.Call.Event.onInactive, [{ callUuid: this.uuid }]);
		}

		get isCopilotInitialized()
		{
			return this._recorderState !== BX.Call.RecorderStatus.None;
		}

		get isCopilotActive()
		{
			return this._recorderState === BX.Call.RecorderStatus.Enabled;
		}

		get isCopilotDisabled()
		{
			return this._recorderState === BX.Call.RecorderStatus.Destroyed;
		}

		bindClientEvents()
		{
			const streamManager = VoxImplant.Hardware.StreamManager.get();

			if (!this.clientEventsBound)
			{
				streamManager.on(VoxImplant.Hardware.HardwareEvents.DevicesUpdated, this.__onLocalDevicesUpdatedHandler);
				streamManager.on(VoxImplant.Hardware.HardwareEvents.MediaRendererAdded, this.__onLocalMediaRendererAddedHandler);
				streamManager.on(VoxImplant.Hardware.HardwareEvents.MediaRendererUpdated, this.__onLocalMediaRendererAddedHandler);
				streamManager.on(VoxImplant.Hardware.HardwareEvents.BeforeMediaRendererRemoved, this.__onBeforeLocalMediaRendererRemovedHandler);
				this.clientEventsBound = true;
			}
		}

		removeClientEvents()
		{
			if (BXClient)
			{
				BXClient.getInstance().off(BXClient.Events.LogMessage, this.__onSDKLogMessageHandler);
			}
		}

		isMuted()
		{
			return this.muted;
		}

		setMuted(muted)
		{
			this.muted = muted;
			console.log('setMuted')
			if (this.bitrixCallDev)
			{
				this.bitrixCallDev.sendAudio = !this.muted;
				this.signaling.sendMicrophoneState(!this.muted);
			}
		}

		sendAudio(value)
		{
			console.log('sendAudio', this.bitrixCallDev)
			if (this.bitrixCallDev)
			{
				this.bitrixCallDev.sendAudio = value;
			}
		}

		receiveVideo(value)
		{
			if (this.bitrixCallDev)
			{
				this.bitrixCallDev.receiveVideo = value;
			}
		}

		receiveAudio(value)
		{
			if (this.bitrixCallDev)
			{
				this.bitrixCallDev.receiveAudio = value;
			}
		}

		toggleRecorderState()
		{
			if (!this.bitrixCallDev)
			{
				return;
			}

			this.bitrixCallDev.setRecorderState(this._recorderState === BX.Call.RecorderStatus.Enabled ? BX.Call.RecorderStatus.Paused : BX.Call.RecorderStatus.Enabled);
		};

		toggleSubscriptionRemoteVideo(toggleList)
		{
			const out = this.#applyNqeCeiling(toggleList);
			if (this.bitrixCallDev && this.bitrixCallDev.toggleSubscriptionRemoteVideo)
			{
				this.bitrixCallDev.toggleSubscriptionRemoteVideo(out);
			}
		}

		/**
		 * Single choke point where the NQE quality ceiling is enforced on the way to native, so any
		 * writer (grid emit via controller, or NQE re-emit) gets capped and cannot overwrite the NQE
		 * ceiling. Only shown entries are capped; hidden ones and non-array input pass through, and
		 * when there is no ceiling (null) the list is returned untouched.
		 * @param {Array<{id: number, quality: number, isShowVideo: boolean}>} toggleList
		 * @returns {*}
		 */
		#applyNqeCeiling(toggleList)
		{
			if (this.nqeQualityCeiling == null || !Array.isArray(toggleList))
			{
				return toggleList;
			}

			return toggleList.map((item) => (item && item.isShowVideo === true)
				? { ...item, quality: Math.min(Number(item.quality), this.nqeQualityCeiling) }
				: item);
		}

		/**
		 * Registers a provider that returns the grid's per-user subscription snapshot (its
		 * toggleList reduced by id).
		 * @param {function(): (Array<{id: number, quality: number, isShowVideo: boolean}>|null|undefined)} provider
		 */
		setVisibleUsersProvider(provider)
		{
			this.visibleUsersProvider = typeof provider === 'function' ? provider : null;
		}

		/**
		 * Reads the per-user subscription snapshot from the injected provider with a null-safe guard.
		 * @returns {Array<{id: number, quality: number, isShowVideo: boolean}>|null}
		 */
		#getVisibleUsersSnapshot()
		{
			if (typeof this.visibleUsersProvider !== 'function')
			{
				return null;
			}

			const snapshot = this.visibleUsersProvider();

			return Array.isArray(snapshot) && snapshot.length > 0 ? snapshot : null;
		}

		toggleSubscriptionRemoteAudio(toggleList)
		{
			if (this.bitrixCallDev && this.bitrixCallDev.toggleSubscriptionRemoteAudio)
			{
				this.bitrixCallDev.toggleSubscriptionRemoteAudio(toggleList);
			}
		}

		onCentralUserSwitch(userId)
		{
			if (this.bitrixCallDev && this.bitrixCallDev.onCentralUserSwitch)
			{
				this.bitrixCallDev.onCentralUserSwitch(userId);
			}
		}

		switchCamera()
		{
			if (!this.videoEnabled)
			{
				return;
			}
			JNBXCameraManager.useBackCamera = !JNBXCameraManager.useBackCamera;
		}

		isFrontCameraUsed()
		{
			return !JNBXCameraManager.useBackCamera;
		}

		isVideoEnabled()
		{
			return this.videoEnabled;
		}

		setVideoEnabled(videoEnabled)
		{
			if (videoEnabled && !CallUtil.havePermissionToBroadcast('cam'))
			{
				return;
			}
			videoEnabled = (videoEnabled === true);
			if (this.videoEnabled == videoEnabled)
			{
				return;
			}

			this.videoEnabled = videoEnabled;
			if (this.bitrixCallDev)
			{
				this.bitrixCallDev.setSendVideo(this.videoEnabled && !this.videoPaused);
				this.signaling.sendCameraState(this.videoEnabled);
			}
		}

		setSendVideo()
		{
			this.bitrixCallDev.setSendVideo(this.videoEnabled && !this.videoPaused);
		}

		setVideoPaused(videoPaused)
		{
			if (this.videoPaused == videoPaused || !this.videoEnabled)
			{
				return;
			}

			this.videoPaused = videoPaused;
			if (this.bitrixCallDev)
			{
				this.bitrixCallDev.setSendVideo(this.videoEnabled && !this.videoPaused);
				this.signaling.sendVideoPaused(this.videoPaused);
			}
		}

		requestFloor(requestActive)
		{
			this.bitrixCallDev.raiseHand(requestActive);
		}

		/**
		 * Updates list of users,
		 * @param {BX.Call.UserMnemonic | int[]} userList
		 */
		allowVideoFrom(userList)
		{
			if (this.videoAllowedFrom == userList)
			{
				return;
			}
			this.videoAllowedFrom = userList;

			if (userList === BX.Call.UserMnemonic.all)
			{
				this.signaling.sendShowAll();
				userList = Object.keys(this.peers);
			}
			else if (userList === BX.Call.UserMnemonic.none)
			{
				this.signaling.sendHideAll();
				userList = [];
			}
			else if (BX.type.isArray(userList))
			{
				this.signaling.sendShowUsers(userList);
			}
			else
			{
				throw new TypeError('userList is in wrong format');
			}

			const users = {};
			userList.forEach((userId) => users[userId] = true);

			for (const userId in this.peers)
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
		}

		/**
		 * Invites users to participate in the call.
		 *
		 * @param {Object} config
		 * @param {int[]} [config.users] Array of ids of the users to be invited.
		 */
		inviteUsers(config = {})
		{
			this.ready = true;
			const users = BX.type.isArray(config.users) ? config.users : this.users;

			this.attachToConference().then(() => {
				if (users.length > 0)
				{
					return this.signaling.inviteUsers({
						userIds: users,
						video: this.videoEnabled ? 'Y' : 'N',
					});
				}
			}).then((response) => {
				clearTimeout(this.waitForAnswerTimeout);
				this.waitForAnswerTimeout = setTimeout(() =>
				{
					this.__onNoAnswer();
				}, this.invitePeriod);
				this.joinStatus = BX.Call.JoinStatus.Local;
				for (const user of users)
				{
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
				}
			}).catch(this.onFatalError.bind(this));
		}

		/**
		 * @param {Object} config
		 * @param {bool} [config.useVideo]
		 */
		answer(config)
		{
			this.ready = true;
			if (!BX.type.isPlainObject(config))
			{
				config = {};
			}
			this.videoEnabled = (config.useVideo === true);

			this.attachToConference().then(() => {
				this.log('Attached to conference');
				this.joinStatus = BX.Call.JoinStatus.Local;
			}).catch(this.onFatalError.bind(this));
		}

		decline(code)
		{
			this.cancelIncomingCallHiding();

			this.ready = false;
			const data = {
				callUuid: this.uuid,
				callInstanceId: this.instanceId,
			};
			if (code)
			{
				data.code = code;
			}

			BX.rest.callMethod(ajaxActions.decline, data);
		}

		hangup(code, reason)
		{
			if (!this.ready)
			{
				const error = new Error('Hangup in wrong state');
				this.log(error);

				return;
			}

			const tempError = new Error();
			tempError.name = 'Call stack:';
			this.log(`Hangup received \n${tempError.stack}`);

			const data = {};
			this.ready = false;
			if (typeof (code) !== 'undefined')
			{
				data.code = code;
			}

			if (typeof (reason) !== 'undefined')
			{
				data.reason = reason;
			}

			if (reason !== 'SIGNALING_DUPLICATE_PARTICIPANT')
			{
				// for future reconnections
				this.reinitPeers();
			}
			this.joinStatus = BX.Call.JoinStatus.None;

			data.userId = this.users;
			this.muted = false;

			if (this.bitrixCallDev)
			{
				this.dismissActiveCallNotification();
				this.bitrixCallDev._replaceVideoSharing = false;
				try
				{
					this.bitrixCallDev.hangup();
				}
				catch (e)
				{
					CallUtil.error(e);
				}

				this.bitrixCallDev = null;
			}
		}

		cancel()
		{
			this.ready = true;
			this.hangup();
		}

		getRoomType()
		{
			const call = callEngine.jwtCalls[this.uuid];
			return call.connectionData.roomType;
		}

		attachToConference()
		{
			return new Promise((resolve, reject) => {
				if (this.bitrixCallDev/* && this.bitrixCallDev.state() === "CONNECTED" */)
				{
					return resolve();
				}

				BXJwtClientWrapper.getClient().then((client) => {
					if (!this.ready)
					{
						return;
					}
					try
					{
						if (typeof (JNBXCameraManager.setResolutionConstraints) === 'function')
						{
							// JNBXCameraManager.setResolutionConstraints(1280, 720);
							JNBXCameraManager.setResolutionConstraints(960, 540); // force 16:9 aspect ratio
						}

						if (!this.hasConnectionData)
						{
							CallUtil.error('Signaling url is null');
							reject({ code: BX.Call.CallError.EmptySignalingUrl });
						}

						const signalingUrl = this.getSignalingUrl(this.connectionData.mediaServerUrl, this.connectionData.roomData, this.autoSubscribe);

						const callOptions = {
							signalingUrl: signalingUrl,
							callId: `${this.uuid}`,
							roomType: this.getRoomType(),
							autoSubscribe: this.autoSubscribe,
							sendVideo: this.isTransitioningToGroupCall ? false : this.videoEnabled,
							receiveVideo: true,
							enableSimulcast: true,
							userName: this.userData,
							callBetaIosEnabled: callEngine.isCallBetaIosEnabled(),
							isAddingMultipleUsersSupported: true,
							pingTimeoutMultiplier: PING_TIMEOUT_MULTIPLIER,
							noSignalsTimeoutBehavior: SignalsBehavior.allSignals,
						};

						this.bitrixCallDev = client.startCall(callOptions);
					}
					catch (e)
					{
						CallUtil.error(e);

						return reject(e);
					}

					if (!this.bitrixCallDev)
					{
						this.log('Error: could not create bitrix dev call');

						return reject({ code: 'BITRIX_DEV_NO_CALL' });
					}

					this.eventEmitter.emit(BitrixCallDevEvent.onCallConference, [{ call: this }]);

					this.bindCallEvents();

					const onCallConnected = () => {
						this.log('Call connected');
						this._reconnectionEventCount = 0;

						// `bindCallEvents()` above subscribes to Reconnecting/Reconnected BEFORE
						// `start()`, so a Reconnecting emitted while the FIRST connection is being
						// established would arm the snapshot and let the initial joinResponse into it.
						// That picture describes the room at entry ("nobody shares yet"), and a later
						// Reconnected - the SDK does not guarantee a preceding Reconnecting - would
						// consume it and tear down a screenshare started after the join. The initial
						// connect is done here, so disarm and drop whatever was captured.
						this.isReconnectSnapshotArmed = false;
						this.reconnectParticipantsSnapshot = null;

						this.bitrixCallDev.off(JNBXCall.Events.Connected, onCallConnected);
						this.bitrixCallDev.off(JNBXCall.Events.Failed, onCallFailed);

						this.bitrixCallDev.on(JNBXCall.Events.Failed, this.__onCallDisconnectedHandler);

						this.bitrixCallDev.sendAudio = !this.muted;
						this.signaling.sendMicrophoneState(!this.muted);
						this.signaling.sendCameraState(this.videoEnabled);

						if (this.videoAllowedFrom == BX.Call.UserMnemonic.none)
						{
							this.signaling.sendHideAll();
						}
						else if (BX.type.isArray(this.videoAllowedFrom))
						{
							this.signaling.sendShowUsers(this.videoAllowedFrom);
						}

						this.#initializeNQE();

						if (this.peerConnectionStatsInterval)
						{
							clearInterval(this.peerConnectionStatsInterval);
							this.peerConnectionStatsInterval = null;
						}

						if (this.nqe)
						{
							this.peerConnectionStatsInterval = setInterval(() => {
								this.processPeerConnectionStats();
							}, NQE_STATS_INTERVAL_MS);
						}
						this.eventEmitter.emit(BX.Call.Event.onCallConnected, []);

						if (this.isTransitioningToGroupCall)
						{
							this.bitrixCallDev.setSendVideo(this.videoEnabled && !this.videoPaused);
						}

						resolve();
					};

					let onCallFailed = (call, error) => {
						this.log('Could not attach to conference', error);
						CallUtil.error('Could not attach to conference', error);
						if (this.bitrixCallDev)
						{
							this.bitrixCallDev.off(JNBXCall.Events.Connected, onCallConnected);
							this.bitrixCallDev.off(JNBXCall.Events.Failed, onCallFailed);
						}
						reject(error);
					};

					this.bitrixCallDev.on(JNBXCall.Events.Connected, onCallConnected);
					this.bitrixCallDev.on(JNBXCall.Events.Failed, onCallFailed);
					this.bitrixCallDev.start();
					client.on(BXClient.Events.LogMessage, this.__onSDKLogMessageHandler);
				}).catch(this.onFatalError.bind(this));
			});
		}

		updateUsersCount(users)
		{
			this.eventEmitter.emit(BX.Call.Event.onChatUsersCountUpdate, [users]);
		}

		getSignalingUrl(baseUrl, roomData, autoSubscribe)
		{
			return `${baseUrl}?auto_subscribe=${autoSubscribe}&sdk=js&version=1.6.7&protocol=8&roomData=${roomData}`
		}

		bindCallEvents()
		{
			this.bitrixCallDev.on(JNBXCall.Events.Disconnected, this.__onCallDisconnectedHandler);
			this.bitrixCallDev.on(JNBXCall.Events.ReceiveMessage, this.__onCallMessageReceivedHandler);
			this.bitrixCallDev.on(JNBXCall.Events.EndpointAdded, this.__onCallEndpointAddedHandler);
			this.bitrixCallDev.on(JNBXCall.Events.EndpointsAdded, this.__onCallEndpointsAddedHandler);
			this.bitrixCallDev.on(JNBXCall.Events.LocalVideoStreamAdded, this.__onLocalVideoStreamReceivedHandler);
			this.bitrixCallDev.on(JNBXCall.Events.LocalVideoStreamRemoved, this.__onLocalVideoStreamRemovedHandler);
			this.bitrixCallDev.on(JNBXCall.Events.RecorderStatusChanged, this.__onCallRecorderStatusChangedHandler);
			this.bitrixCallDev.on(JNBXCall.Events.Reconnecting, this.__onCallReconnectingHandler);
			this.bitrixCallDev.on(JNBXCall.Events.Reconnected, this.__onCallReconnectedHandler);
			this.bitrixCallDev.on(JNBXCall.Events.OnUsersLimitExceeded, this.__onUsersLimitExceededHandler);
			this.bitrixCallDev.on(JNBXCall.Events.SignalingResponseReceived, this.__onSignalingResponseReceivedHandler);
			if (JNBXCall.Events.RemoteMediaAvailable)
			{
				this.bitrixCallDev.on(JNBXCall.Events.RemoteMediaAvailable, this.__onRemoteMediaAvailableHandler);
			}
		}

		removeCallEvents()
		{
			if (this.bitrixCallDev)
			{
				this.bitrixCallDev.off(JNBXCall.Events.Disconnected, this.__onCallDisconnectedHandler);
				this.bitrixCallDev.off(JNBXCall.Events.ReceiveMessage, this.__onCallMessageReceivedHandler);
				this.bitrixCallDev.off(JNBXCall.Events.EndpointAdded, this.__onCallEndpointAddedHandler);
				this.bitrixCallDev.off(JNBXCall.Events.EndpointsAdded, this.__onCallEndpointsAddedHandler);
				this.bitrixCallDev.off(JNBXCall.Events.LocalVideoStreamAdded, this.__onLocalVideoStreamReceivedHandler);
				this.bitrixCallDev.off(JNBXCall.Events.LocalVideoStreamRemoved, this.__onLocalVideoStreamRemovedHandler);
				this.bitrixCallDev.off(JNBXCall.Events.RecorderStatusChanged, this.__onCallRecorderStatusChangedHandler);
				this.bitrixCallDev.off(JNBXCall.Events.Reconnecting, this.__onCallReconnectingHandler);
				this.bitrixCallDev.off(JNBXCall.Events.Reconnected, this.__onCallReconnectedHandler);
				this.bitrixCallDev.off(JNBXCall.Events.OnUsersLimitExceeded, this.__onUsersLimitExceededHandler);
				this.bitrixCallDev.off(JNBXCall.Events.SignalingResponseReceived, this.__onSignalingResponseReceivedHandler);
				if (JNBXCall.Events.RemoteMediaAvailable)
				{
					this.bitrixCallDev.off(JNBXCall.Events.RemoteMediaAvailable, this.__onRemoteMediaAvailableHandler);
				}
			}
		}

		/**
		 * Adds new users to call
		 * @param {Number[]} users
		 */
		addJoinedUsers(users)
		{
			for (const user of users)
			{
				const userId = Number(user);
				if (userId == this.userId || this.peers[userId])
				{
					continue;
				}
				this.peers[userId] = this.createPeer(userId);
				if (!this.users.includes(userId))
				{
					this.users.push(userId);
				}
				this.eventEmitter.emit(BX.Call.Event.onUserInvited, [{ userId }]);
			}
		}

		/**
		 * Adds users, invited by you or someone else
		 * @param {Object} users
		 */
		addInvitedUsers(users)
		{
			const ids = Object.keys(users);
			for (let i = 0; i < ids.length; i++)
			{
				const userId = parseInt(ids[0], 10);
				if (userId == this.userId)
				{
					continue;
				}

				if (this.peers[userId])
				{
					if (
						this.peers[userId].calculatedState === BX.Call.UserState.Failed
						|| this.peers[userId].calculatedState === BX.Call.UserState.Idle
					)
					{
						this.peers[userId].onInvited();
					}
				}
				else
				{
					this.peers[userId] = this.createPeer(userId);
					this.peers[userId].onInvited();
					this.eventEmitter.emit(BX.Call.Event.onUserInvited, {
						userId,
						userData: { [userId]: users[userId] },
					});
				}

				if (!this.users.includes(userId))
				{
					this.users.push(userId);
				}
				this.eventEmitter.emit(BX.Call.Event.onUserInvited, [{ userId }]);
			}

			this.updateUsersCount(this.users.length);
		}

		isAnyoneParticipating(withCalling)
		{
			for (const userId in this.peers)
			{
				if (this.peers[userId].isParticipating(withCalling))
				{
					return true;
				}
			}

			return false;
		}

		getParticipatingUsers()
		{
			const result = [];
			for (const userId in this.peers)
			{
				if (this.peers[userId].isParticipating())
				{
					result.push(userId);
				}
			}

			return result;
		}

		__onPeerStateChanged(e)
		{
			this.eventEmitter.emit(BX.Call.Event.onUserStateChanged, [
				e.userId,
				e.state,
				e.previousState,
				false,
				e.canChangeUI,
			]);

			if (!this.ready)
			{
				return;
			}

			if ((e.state == BX.Call.UserState.Failed || e.state == BX.Call.UserState.Unavailable || e.state == BX.Call.UserState.Declined || e.state == BX.Call.UserState.Idle) && this.type == BX.Call.Type.Instant && !this.isAnyoneParticipating(!this.someoneWasConnected))
			{
				this.hangup();
			}

			if (e.state == BX.Call.UserState.Connected && !this.someoneWasConnected)
			{
				this.someoneWasConnected = true;
			}
		}

		__onPeerInviteTimeout(e)
		{
			if (!this.ready)
			{
				return;
			}
			this.signaling.sendUserInviteTimeout({
				userId: this.users,
				failedUserId: e.userId,
			});
		}

		_onPullEvent(command, params, extra)
		{
			const handlers = {
				'Call::answer': this.__onPullEventAnswer.bind(this),
				'Call::hangup': this.__onPullEventHangup.bind(this),
				'Call::finish': this.__onPullEventFinish.bind(this),
				[pullEvents.switchTrackRecordStatus]: this.__onPullEventSwitchTrackRecordStatus.bind(this),
			};

			if (handlers[command])
			{
				this.log(`Signaling: ${command}; Parameters: ${JSON.stringify(params)}`);
				handlers[command].call(this, params, extra);
			}
		}

		__onPullEventAnswer(params, extra)
		{
			const senderId = Number(params.senderId);

			if (senderId == this.userId)
			{
				return this.__onPullEventAnswerSelf(params, extra);
			}

			if (!this.peers[senderId])
			{
				this.peers[senderId] = this.createPeer(senderId);
				this.eventEmitter.emit(BX.Call.Event.onUserInvited, [{ userId: senderId }]);
			}

			if (!this.users.includes(senderId))
			{
				this.users.push(senderId);
			}

			this.peers[senderId].setReady(true);
		}

		__onPullEventAnswerSelf(params, extra)
		{
			if (params.callInstanceId === this.instanceId || extra.server_time_ago > 30)
			{
				return;
			}

			if (this.ready)
			{
				// Received remote self-answer in ready state, ignoring
				return;
			}

			// call was answered elsewhere
			this.joinStatus = BX.Call.JoinStatus.Remote;
		}

		__onPullEventHangup(params)
		{
			const senderId = params.senderId;

			if (this.userId == senderId && this.instanceId != params.callInstanceId)
			{
				if (this.ready)
				{
					return;
				}

				// Call declined by the same user elsewhere
				this.joinStatus = BX.Call.JoinStatus.None;
				this.eventEmitter.emit(BX.Call.Event.onHangup);

				return;
			}

			if (!this.peers[senderId] || this.peers[senderId].endpoint)
			{
				return;
			}

			this.peers[senderId].setReady(false);

			if (params.code == 603)
			{
				this.peers[senderId].setDeclined(true);
			}
			else if (params.code == 486)
			{
				this.peers[senderId].setBusy(true);
				CallUtil.error(`user ${senderId} is busy`);
			}

			if (this.ready && this.type == BX.Call.Type.Instant && !this.isAnyoneParticipating())
			{
				this.hangup();
			}
		}

		__onPullEventFinish(params)
		{
			this.destroy();
		}

		__onPullEventSwitchTrackRecordStatus(e)
		{
			this.eventEmitter.emit(BX.Call.Event.onSwitchTrackRecordStatus, [{
				senderId: e.senderId,
				isTrackRecordOn: e.isTrackRecordOn,
			}]);
		}

		__onLocalDevicesUpdated(e)
		{
			this.log('__onLocalDevicesUpdated', e);
		}

		__onLocalVideoStreamReceived(stream)
		{
			this.log('__onLocalVideoStreamReceived');
			this.eventEmitter.emit(BX.Call.Event.onLocalMediaReceived, [stream]);
		}

		__onLocalVideoStreamRemoved()
		{
			this.eventEmitter.emit(BX.Call.Event.onLocalMediaStopped);
		}

		__onSDKLogMessage(message)
		{
			if (this.logger)
			{
				this.log(message);
			}
		}

		__onCallDisconnected(e)
		{
			let logData = {};

			const evt = e && typeof e === 'object' ? e : {};
			const { headers } = evt;

			if (headers)
			{
				logData = {
					...logData,
					headers,
				};
			}

			this.log('__onCallDisconnected', (Object.keys(logData).length ? logData : null));
			this.removeCallEvents();

			if (this.ready && headers.leaveInformation && headers.leaveInformation.reason !== BX.Call.CallError.SecurityKeyChanged)
			{
				this.hangup(headers.leaveInformation.code, headers.leaveInformation.reason);
			}

			this.ready = false;
			this.muted = false;
			this.reinitPeers();

			if (headers.leaveInformation?.reason === BX.Call.CallError.SecurityKeyChanged)
			{
				this.onFatalError(headers.leaveInformation.reason);
			}
			else if (headers.leaveInformation?.reason === BX.Call.CallError.RoomClosed)
			{
				this.destroy();
			}
			else
			{
				this.bitrixCallDev = null;
				this.joinStatus = BX.Call.JoinStatus.None;
			}
		}

		__onCallReconnecting()
		{
			// Everything known before the outage is stale by definition, and a re-join that never
			// lands must leave "no data" behind rather than an old picture. Ahead of the readiness
			// guard on purpose - the snapshot must never outlive an outage, even one this handler
			// bails out of; and a disarmed gate is exactly what "no data" means downstream.
			this.reconnectParticipantsSnapshot = null;
			this.isReconnectSnapshotArmed = false;

			if (!this.ready || !this.bitrixCallDev)
			{
				return;
			}

			// Arm the one-shot snapshot: from here until the reconnect resolves, a joinResponse
			// describes the room AFTER the outage. Behind the guard, so a reconnect this handler
			// refused to enter never opens the gate.
			this.isReconnectSnapshotArmed = true;

			this._reconnectionEventCount++;
			this.eventEmitter.emit(BX.Call.Event.onReconnecting, [{
				reconnectionEventCount: this._reconnectionEventCount,
			}]);

			CallUtil.getCallConnectionDataById(this.uuid)
				.then((response) => {
					if (this.ready && this.bitrixCallDev)
					{
						const signalingUrl = this.getSignalingUrl(response.result.mediaServerUrl, response.result.roomData, this.autoSubscribe);
						this.bitrixCallDev.updateSignalingUrl(signalingUrl);
					}
					else
					{
						this.hangup();
					}
				})
				.catch((error) => {
					console.error(error);
					const errorPreventingReconnection = Object.values(BX.Call.ErrorPreventingReconnection);

					if (errorPreventingReconnection.includes(error.errorCode))
					{
						this.onFatalError(error.code);
					}
					else if (this._reconnectionEventCount < this._maxReconnectionAttempts)
					{
						setTimeout(() => {
							this.__onCallReconnecting();
						}, 5000);
					}
					else
					{
						this.hangup();
					}
				});
		}

		__onCallReconnected()
		{
			this._reconnectionEventCount = 0;
			this.signaling.sendCameraState(this.videoEnabled);

			// Consume the snapshot and close the gate: it describes this reconnect only, so it must
			// not survive into the next one. Stays null when the re-join response has not arrived
			// yet - consumers read that as "no data" and must not reconcile anything away. The
			// layout logs which of the two flavours of "no data" this was (see [ALG-03] log line).
			const participantsSnapshot = this.reconnectParticipantsSnapshot;
			this.reconnectParticipantsSnapshot = null;
			this.isReconnectSnapshotArmed = false;

			this.eventEmitter.emit(BX.Call.Event.onReconnected, [{
				reconnectedUsers: this.usersAfterReconnect,
				participantsSnapshot,
			}]);
		}

		getMediaServerInfo(finalUrl)
		{
			return new Promise(async (resolve, reject) =>
			{
				let data;

				try
				{
					data = await BXClient.getInstance().getMediaServerUrl(finalUrl);
				}
				catch (error)
				{
					return reject({name: 'MEDIA_SERVER_UNREACHABLE', message: `Reason: ${error.reason} ${error.data}`});
				}

				resolve({
					mediaServerUrl: data.url,
					roomData: data.roomData
				});
			});
		}

		onFatalError(error)
		{
			if (error && error.call)
			{
				delete error.call;
			}
			CallUtil.error('onFatalError', error);
			this.log('onFatalError', error);

			this.ready = false;
			this.muted = false;
			this.reinitPeers();

			if (typeof (error) === 'string')
			{
				this.eventEmitter.emit(BX.Call.Event.onCallFailure, [error]);
			}
			else if (error instanceof Error)
			{
				this.eventEmitter.emit(BX.Call.Event.onCallFailure, [error.toString()]);
			}
			else
			{
				this.eventEmitter.emit(BX.Call.Event.onCallFailure);
			}

			if (this.bitrixCallDev)
			{
				this.removeCallEvents();
				try
				{
					this.bitrixCallDev.hangup({
						'X-Reason': 'Fatal error',
						'X-Error': typeof (error) === 'string' ? error : error.code || error.name,
					});
				}
				catch
				{ /* nothing :) */
				}
				this.bitrixCallDev = null;
			}
		}

		showActiveCallNotification(notificationParams)
		{
			if (this.activeCallNotification)
			{
				this.activeCallNotification.show(notificationParams);
			}
		}

		updateActiveCallNotificationMicrophoneStatus(notificationParams)
		{
			if (this.activeCallNotification)
			{
				this.activeCallNotification.update(notificationParams);
			}
		}

		dismissActiveCallNotification()
		{
			if (this.activeCallNotification)
			{
				this.activeCallNotification.dismiss();
			}
		}

		destroyActiveCallNotification()
		{
			if (this.activeCallNotification)
			{
				this.activeCallNotification.destroy();
			}
		}

		__onNoAnswer()
		{
			if (this.ready && !this.isAnyoneParticipating())
			{
				this.destroy();
			}
		}

		__onCallEndpointAdded(endpoint)
		{
			clearTimeout(this.waitForAnswerTimeout);
			if (!this.users.includes(endpoint.endpointId))
			{
				this.users.push(endpoint.endpointId);
			}
			if (!this.peers[endpoint.endpointId])
			{
				this.peers[endpoint.endpointId] = this.createPeer(endpoint.endpointId);
			}

			this.eventEmitter.emit(BX.Call.Event.onUserJoined, [{
				userId: endpoint.endpointId,
				userData: {
					[endpoint.endpointId]: {
						name: endpoint.userName,
						avatar_hr: endpoint.avatarImage,
						avatar: endpoint.avatarImage,
					},
				}
			}]);

			const userName = typeof (endpoint.userDisplayName) === 'string' ? endpoint.userDisplayName : '';
			this.log(`__onCallEndpointAdded (${userName})`);

			if (BX.type.isNotEmptyString(userName) && userName.slice(0, 4) == 'user')
			{
				// user connected to conference
				const userId = parseInt(userName.slice(4));
				if (this.peers[userId])
				{
					this.peers[userId].setEndpoint(endpoint);
				}
			}
			else
			{
				endpoint.on(JNBXEndpoint.Events.InfoUpdated, () => {
					const userName = typeof (endpoint.userDisplayName) === 'string' ? endpoint.userDisplayName : '';
					this.log(`BitrixDev.EndpointEvents.InfoUpdated (${userName})`, endpoint);

					if (userName.slice(0, 4) == 'user')
					{
						// user connected to conference
						const userId = parseInt(userName.slice(4));
						if (this.peers[userId])
						{
							this.peers[userId].setEndpoint(endpoint);
						}
					}
				});

				this.log(`Unknown endpoint ${userName}`);
			}
		}

		__onCallEndpointsAdded(endpoints)
		{
			clearTimeout(this.waitForAnswerTimeout);
			const eventData = [];

			// Pass 1: build eventData and create peers (must complete BEFORE emit).
			endpoints.endpoints.forEach(endpoint =>
			{
				if (!this.users.includes(endpoint.endpointId))
				{
					this.users.push(endpoint.endpointId);
				}
				if (!this.peers[endpoint.endpointId])
				{
					this.peers[endpoint.endpointId] = this.createPeer(endpoint.endpointId, true);
				}

				eventData.push({
					id: endpoint.endpointId,
					name: endpoint.userName,
					avatar_hr: endpoint.avatarImage,
					avatar: endpoint.avatarImage,
				});
			})

			this.eventEmitter.emit(BX.Call.Event.onUsersJoined, [eventData]);

			// Pass 2: attach endpoint to peer, register InfoUpdated listener, mark canChangeUI.
			// Must run AFTER emit so subscribers observe pre-attach endpoint state — preserves
			// the legacy three-forEach ordering invariant in a two-pass form.
			endpoints.endpoints.forEach(endpoint =>
			{
				const userName = typeof (endpoint.userDisplayName) === 'string' ? endpoint.userDisplayName : '';
				this.log(`__onCallEndpointAdded (${userName})`);

				if (BX.type.isNotEmptyString(userName) && userName.slice(0, 4) == 'user')
				{
					// user connected to conference
					const userId = parseInt(userName.slice(4));
					if (this.peers[userId])
					{
						this.peers[userId].setEndpoint(endpoint);
					}
				}
				else
				{
					endpoint.on(JNBXEndpoint.Events.InfoUpdated, () => {
						const userName = typeof (endpoint.userDisplayName) === 'string' ? endpoint.userDisplayName : '';
						this.log(`BitrixDev.EndpointEvents.InfoUpdated (${userName})`, endpoint);

						if (userName.slice(0, 4) == 'user')
						{
							// user connected to conference
							const userId = parseInt(userName.slice(4));
							if (this.peers[userId])
							{
								this.peers[userId].setEndpoint(endpoint);
							}
						}
					});

					this.log(`Unknown endpoint ${userName}`);
				}

				endpoint.canChangeUI = true;
			})
		}

		__onCallRecorderStatusChanged(status)
		{
			if (!status.errMsg)
			{
				this._recorderState = status.code;
			}

			const isCopilotActive = this._recorderState === BX.Call.RecorderStatus.Enabled;

			this.eventEmitter.emit(BX.Call.Event.onRecorderStatusChanged, [{
				status: isCopilotActive,
				error: status.errMsg,
			}]);
		}

		__onUsersInvited = (params) =>
		{
			this.log('__onUsersInvited', params);
			const users = params.users;
			const show = params.show;

			if (this.type === CallType.Instant)
			{
				this.addInvitedUsers(users);
			}
		};

		__onUserInviteTimeout = (params) =>
		{
			this.log('__onUserInviteTimeout', params);
			const failedUserId = params.failedUserId;

			if (this.peers[failedUserId])
			{
				this.peers[failedUserId].onInviteTimeout(false);
			}
		};

		__onCallMessageReceived(call, callMessage)
		{
			let message;
			try
			{
				message = JSON.parse(callMessage.message);
			}
			catch (err)
			{
				this.log('Could not parse scenario message.', err);

				return;
			}

			if (message.onActionSent)
			{
				this.__onActionSentHandler(message.onActionSent);

				return;
			}


			const eventName = message.eventName;
			switch (eventName)
			{
				case clientEvents.voiceStarted:
				{
					if (message.senderId == this.userId)
					{
						this.requestFloor(false);
					}
					this.eventEmitter.emit(BX.Call.Event.onUserVoiceStarted, [message.senderId]);

					break;
				}

				case clientEvents.voiceStopped:
				{
					this.eventEmitter.emit(BX.Call.Event.onUserVoiceStopped, [message.senderId]);

					break;
				}

				case clientEvents.screenState:
				{
					this.eventEmitter.emit(BX.Call.Event.onUserScreenState, [
						message.senderId,
						message.screenState === 'Y',
					]);

					break;
				}

				case clientEvents.cameraState:
				{
					this.eventEmitter.emit(BX.Call.Event.onUserCameraState, [
						message.senderId,
						message.cameraState === 'Y',
					]);

					break;
				}

				case clientEvents.videoPaused:
				{
					this.eventEmitter.emit(BX.Call.Event.onUserVideoPaused, [
						message.senderId,
						message.videoPaused === 'Y',
					]);

					break;
				}

				case clientEvents.floorRequest:
				{
					this.eventEmitter.emit(BX.Call.Event.onUserFloorRequest, [
						message.senderId,
						message.requestActive === 'Y',
					]);

					break;
				}

				case clientEvents.emotion:
				{
					this.eventEmitter.emit(BX.Call.Event.onUserEmotion, [
						message.senderId,
						message.toUserId,
						message.emotion,
					]);

					break;
				}

				case clientEvents.recordState:
				{
					this.eventEmitter.emit(BX.Call.Event.onRecordState, [
						message.recordState.state,
					]);

					break;
				}

				case clientEvents.usersInvited:
				{
					this.__onUsersInvited(message);

					break;
				}

				case clientEvents.userInviteTimeout:
				{
					this.__onUserInviteTimeout(message);

					break;
				}

				case 'scenarioLogUrl':
				{
					CallUtil.warn(`scenario log url: ${message.logUrl}`);

					break;
				}

				default:
				{
					this.log(`Unknown scenario event ${eventName}`);
				}
			}
		}

		__onUsersLimitExceeded()
		{
			this.log(`__onUsersLimitExceeded`);
			this.eventEmitter.emit(BX.Call.Event.onUsersLimitExceeded);
		}

		__onSignalingResponseReceived(response)
		{
			if (response && response.response)
			{
				if (typeof response.response !== 'string') return;

				let data

				try
				{
					data = JSON.parse(response.response);
				}
				catch (err)
				{
					this.log(`Could not parse a socket message: ${response.response}`);
					return;
				}

				// Large rooms wrap every signaling sub-event in an { event, mediaServerId } envelope
				// (web canon: call_api.js socketOnMessageHandler). Unwrap once here so every branch
				// dispatches flat. Flat Small/group payloads have no `event` and are left untouched.
				// Previously only joinResponse and onActionSent were unwrapped, so trackCreated/
				// trackMuted/videoRecorderStatus/participantReconnecting/participantReconnected were
				// silently dropped in large rooms.
				if (data?.event)
				{
					data = data.event;
				}

				const joinResponse = data?.joinResponse;

				if (joinResponse)
				{
					if (joinResponse.otherParticipants)
					{
						this.usersAfterReconnect = [Object.values(joinResponse.otherParticipants)];

						// Same shape, different lifetime: armed on entering a reconnect and written
						// only here, so it is the only field that can be read as "the room right
						// now". The write is gated because this handler also parses the joinResponse
						// of the INITIAL join: a snapshot taken at entry (nobody sharing yet) would
						// sit there until some later `Reconnected` and would tear down a screenshare
						// started after the join. The gate is the explicit armed state, NOT
						// `_reconnectionEventCount` (as the `permissions`/`roomState` branches below
						// use): that counter is also zeroed by `onCallConnected`, which would leave
						// the snapshot armed with an entry-time picture while the gate reads closed.
						if (this.isReconnectSnapshotArmed)
						{
							this.reconnectParticipantsSnapshot = [Object.values(joinResponse.otherParticipants)];
						}

						const toggleList = [];

						Object.values(joinResponse.otherParticipants).forEach((participant) => {
							const userId = Number(participant.userId);

							if (!participant.participantTracks)
							{
								return;
							}

							Object.values(participant.participantTracks).forEach((track) => {
								if (track.source === MediaStreamKind.Microphone)
								{
									this.audioTracks.set(track.sid, {
										source: track.source,
										publisher: userId,
										muted: track.muted,
									});

									if (!track.muted)
									{
										toggleList.push({ id: userId, subscribe: true });
									}
								}
							});
						});

						if (toggleList.length > 0)
						{
							this.toggleSubscriptionRemoteAudio(toggleList);
						}
					}

					if (joinResponse.role)
					{
						CallUtil.setCurrentUserRole(joinResponse.role);
					}

					if(joinResponse.permissions && !this._reconnectionEventCount)
					{
						this.__setUserPermissions(joinResponse.permissions);
					}

					if(joinResponse.roomState && !this._reconnectionEventCount)
					{
						CallUtil.setRoomPermissions(joinResponse.roomState);
						CallUtil.setUserPermissionsByRoomPermissions(joinResponse.roomState);
					}
				}

				if (data?.trackCreated)
				{
					const track = data.trackCreated.track;
					const trackId = track?.sid;

					if (trackId && track.source === MediaStreamKind.Microphone)
					{
						this.audioTracks.set(trackId, {
							source: track.source,
							publisher: track.publisher,
							muted: data.trackCreated.muted,
						});
					}

					this.eventEmitter.emit(BX.Call.Event.onRemoteTrackAdded);
				}

				if (data?.trackMuted)
				{
					const trackId = data.trackMuted.track?.shortId;
					const publisherId = Number(data.trackMuted.track?.publisher);
					const isMuted = data.trackMuted.muted;

					const audioTrack = this.audioTracks.get(trackId);
					const isAudioTrack = audioTrack?.source === MediaStreamKind.Microphone;

					if (isAudioTrack)
					{
						this.eventEmitter.emit(BX.Call.Event.onUserMicrophoneState, [
							publisherId,
							!isMuted,
						]);

						audioTrack.muted = isMuted;

						if (publisherId && !isMuted)
						{
							this.toggleSubscriptionRemoteAudio([{ id: publisherId, subscribe: true }]);
						}
					}
				}

				if (data?.videoRecorderStatus)
				{

					if (data.videoRecorderStatus.code)
					{
						this.eventEmitter.emit(BX.Call.Event.onRecordState, [
							RecordStatus[data.videoRecorderStatus.code]
						]);
					}
				}

				if (data?.participantReconnecting)
				{
					this.eventEmitter.emit(BX.Call.Event.onUserStateChanged, [
						data?.participantReconnecting?.userId,
						BX.Call.UserState.Connecting,
					]);
				}

				if (data?.participantReconnected)
				{
					this.eventEmitter.emit(BX.Call.Event.onUserStateChanged, [
						data?.participantReconnected?.userId,
						BX.Call.UserState.Connected,
					]);
				}

				if (this.connectionData?.roomType === BX.Call.RoomType.Large && data?.onActionSent)
				{
					this.__onActionSentHandler(data.onActionSent);
				}
			}
		}

		__onRemoteMediaAvailable(data)
		{
			console.log(`[RemoteMediaAvailable]: participant: ${data.participant}, remoteTrack: ${data.remoteTrack}`);
		}

		__setUserPermissions(_permissionsJSON)
		{
			try
			{
				let permissions = JSON.parse(_permissionsJSON);

				CallUtil.setUserPermissions(permissions);
			}
			catch (err)
			{
				this.log(`Could not parse a permissions JSON: ${_permissionsJSON}  ${err.message}`);
			}
		}

		__onMuteParticipant(data)
		{
			const type = data.track.type;
			switch (type)
			{
				case 0:
				{
					this.eventEmitter.emit(BX.Call.Event.onParticipantAudioMuted, [data]);
					break;
				}

				case 1:
				{
					this.eventEmitter.emit(BX.Call.Event.onParticipantVideoMuted, [data]);
					break;
				}

				case 2:
				{
					this.eventEmitter.emit(BX.Call.Event.onParticipantScreenshareMuted, [data]);
					break;
				}
			}
		}

		__onMuteAllParticipants(data)
		{
			const type = data.track.type;
			switch (type)
			{
				case 0:
				{
					this.eventEmitter.emit(BX.Call.Event.onAllParticipantsAudioMuted, [data]);
					break;
				}

				case 1:
				{
					this.eventEmitter.emit(BX.Call.Event.onAllParticipantsVideoMuted, [data]);
					break;
				}

				case 2:
				{
					this.eventEmitter.emit(BX.Call.Event.onAllParticipantsScreenshareMuted, [data]);
					break;
				}
			}
		}

		__settingsChangedHandler(data)
		{
			data.calledFrom = 'settingsChanged';

			let newRoomSettings = CallUtil.getRoomPermissions();
			let options = {reason: 'settings', eft: data.eft, fromUserId: data.fromUserId, track: {type: 0}};

			switch (data.act)
			{
				case 'audio':
					options.track.type = 0;

					if (newRoomSettings.AudioEnabled === data.roomState.AudioEnabled)
					{
						data.notShowNotify = true;
					}

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

			CallUtil.setRoomPermissions(newRoomSettings);
			CallUtil.updateUserPermissionByNewRoomPermission(data.act, !data.eft);

			if (data.eft === true)
			{
				this.__onMuteAllParticipants(options);
			}

			this.eventEmitter.emit(BX.Call.Event.onRoomSettingsChanged, [data]);
		}

		__userPermissionsChanged(data)
		{
			if (data.allow === true && CallUtil.isRegularUser(CallUtil.getCurrentUserRole()) && this.userId == data.toUserId)
			{
				let permissions = CallUtil.getUserPermissions();

				permissions.audio = data.allow;
				permissions.video = data.allow;
				permissions.screen_share = data.allow;

				CallUtil.setUserPermissions(permissions);
			}

			this.eventEmitter.emit(BX.Call.Event.onUserPermissionsChanged, [data]);

		}

		__onActionSentHandler(data)
		{
			if (data.changeSettings)
			{
				this.__settingsChangedHandler(data.changeSettings);
			}
			else if (data.givePermissions)
			{
				this.__userPermissionsChanged(data.givePermissions);
			}
			else if (data.participantMuted)
			{
				this.__onMuteParticipant(data.participantMuted);
			}
			else if (data.allParticipantsMuted)
			{
				this.__onMuteAllParticipants(data.allParticipantsMuted);
			}
		}

		/**
		 * Initializes Network Quality Evaluator if auto balance is available
		 * @private
		 */
		#initializeNQE()
		{
			if (!CallSettingsManager.isAutoBalanceAvailable())
			{
				this.log('[NQE] Server-side flag disabled, auto-balance not available');
				this.nqe = null;

				return;
			}

			if (typeof this.bitrixCallDev?.getPeerConnectionStats !== 'function')
			{
				this.log('[NQE] Native getPeerConnectionStats not available, auto-balance not available');
				this.nqe = null;

				return;
			}

			this.nqe = new NetworkQualityEvaluator({
				downgradeWindowSec: CallSettingsManager.nqeDowngradeWindowSec,
				upgradeWindowSec: CallSettingsManager.nqeUpgradeWindowSec,
				warmupSec: CallSettingsManager.nqeWarmupSec,
				highToMedium: {
					downgrade: {
						packetsLostPct: CallSettingsManager.nqeHighDowngradePacketsLostPct,
						rttMs: CallSettingsManager.nqeHighDowngradeRttMs,
						jitterMs: CallSettingsManager.nqeHighDowngradeJitterMs,
					}
				},
				mediumToLow: {
					downgrade: {
						packetsLostPct: CallSettingsManager.nqeMedDowngradePacketsLostPct,
						rttMs: CallSettingsManager.nqeMedDowngradeRttMs,
						jitterMs: CallSettingsManager.nqeMedDowngradeJitterMs,
					}
				},
				mediumToHigh: {
					upgrade: {
						packetsLostPct: CallSettingsManager.nqeMedUpgradePacketsLostPct,
						rttMs: CallSettingsManager.nqeMedUpgradeRttMs,
						jitterMs: CallSettingsManager.nqeMedUpgradeJitterMs,
					}
				},
				lowToMedium: {
					upgrade: {
						packetsLostPct: CallSettingsManager.nqeLowUpgradePacketsLostPct,
						rttMs: CallSettingsManager.nqeLowUpgradeRttMs,
						jitterMs: CallSettingsManager.nqeLowUpgradeJitterMs,
					}
				}
			});

			// Reset tracked quality to match the freshly created evaluator's initial state
			this.currentQuality = StreamQuality.high;
			// New evaluator starts with no ceiling — grid emits pass through until NQE degrades.
			this.nqeQualityCeiling = null;
		}

		/**
		 * Gets peer connection WebRTC stats
		 * @returns {Object} - Object with publisher and subscriber stats
		 */
		getPeerConnectionStats()
		{
			if (typeof this.bitrixCallDev?.getPeerConnectionStats === 'function')
			{
				return this.bitrixCallDev.getPeerConnectionStats();
			}

			return null;
		}

		/**
		 * Processes one Network Quality Evaluator stats polling iteration.
		 */
		processPeerConnectionStats()
		{
			if (!this.nqe)
			{
				return;
			}

			try
			{
				const stats = this.getPeerConnectionStats();
				if (!stats)
				{
					this.nqe.resetPendingWindow();

					return;
				}

				const action = this.nqe.processStats(stats.SENDER, stats.RECEIVER);
				if (action === 'downgrade' || action === 'upgrade')
				{
					this.#applyAutoQuality(this.nqe.getCurrentQuality());
				}
			}
			catch (error)
			{
				this.nqe?.resetPendingWindow();
				this.log(`[NQE] Failed to process peer connection stats: ${error}`);
			}
		}

		/**
		 * Applies automatic quality adjustment based on NQE evaluation
		 * @param {number} quality - The quality level to apply (high, medium, low)
		 * @private
		 */
		#applyAutoQuality(quality)
		{
			if (quality === this.currentQuality)
			{
				return;
			}

			if (!Object.values(StreamQuality).includes(quality))
			{
				this.log(`[NQE] Invalid quality value: ${quality}.`);

				return;
			}

			const oldQuality = this.currentQuality;
			const logEvent = quality < oldQuality ? 'AUTO_QUALITY_DEGRADED' : 'AUTO_QUALITY_IMPROVED';
			this.log(`[NQE] ${logEvent} from ${oldQuality} to ${quality}, platform: mobile`);

			// Set the ceiling: from now on every video subscription heading to native is capped in
			// the choke point, so a subsequent grid emit can no longer overwrite the NQE quality.
			this.nqeQualityCeiling = quality;
			this.currentQuality = quality;

			// Apply immediately to the users currently on screen. getVisibleUsers() returns the grid
			// quality of the shown users; the choke (#applyNqeCeiling) caps it at min(grid, nqe). If
			// no snapshot is available right now, the ceiling still applies on the next grid emit.
			const visible = this.#getVisibleUsersSnapshot();
			if (visible)
			{
				this.toggleSubscriptionRemoteVideo(visible);
			}
		}

		destroy()
		{
			this.cancelIncomingCallHiding();

			this.ready = false;
			this._joinStatus = BX.Call.JoinStatus.None;
			this.destroyActiveCallNotification();
			if (this.bitrixCallDev)
			{
				this.removeCallEvents();
				if (this.bitrixCallDev /* .state() != "ENDED" */)
				{
					this.bitrixCallDev.hangup();
				}
				this.bitrixCallDev = null;
			}

			for (const userId in this.peers)
			{
				if (this.peers.hasOwnProperty(userId) && this.peers[userId])
				{
					this.peers[userId].destroy();
				}
			}

			if (this.logger)
			{
				this.logger.destroy();
				this.logger = null;
			}

			this.removeClientEvents();

			if (this.peerConnectionStatsInterval)
			{
				clearInterval(this.peerConnectionStatsInterval);
				this.peerConnectionStatsInterval = null;
			}

			this.eventEmitter.emit(BX.Call.Event.onDestroy, [{ callUuid: this.uuid }]);
			this.eventEmitter = null;
			if (this.signaling)
			{
				this.signaling.call = null;
				this.signaling = null;
			}
		}

		scheduleIncomingCallHiding()
		{
			return this.incomingCallHiderService.schedule();
		}

		cancelIncomingCallHiding()
		{
			this.incomingCallHiderService.cancel();
		}
	}

	const BXJwtClientWrapper = {
		accessToken: null,
		accessTokenTtl: null,

		get token()
		{
			if (this.accessToken && this.accessTokenTtl && Date.now() < this.accessTokenTtl)
			{
				return this.accessToken;
			}

			return null;
		},

		setAccessToken(accessToken, accessExpire)
		{
			this.accessToken = accessToken;
			this.accessTokenTtl = Date.now() + (accessExpire * 1000);
		},

		get server()
		{
			return BX.componentParameters.get('voximplantServer', '');
		},

		set server(value)
		{
			BX.componentParameters.set('voximplantServer', value);
		},

		get login()
		{
			return BX.componentParameters.get('voximplantLogin', '');
		},

		set login(value)
		{
			BX.componentParameters.set('voximplantLogin', value);
		},

		getAuthorization()
		{
			return new Promise((resolve, reject) => {
				if (this.server)
				{
					return resolve({ server: this.server, login: this.login });
				}

				CallUtil.log('Calling voximplant.authorization.get');
				BX.rest.callMethod('voximplant.authorization.get').then((response) => {
					const data = response.data();
					this.server = data.SERVER;
					this.login = data.LOGIN;

					return resolve({ server: this.server, login: this.login });
				}).catch((response) => {
					console.error(response);
					reject(response);
				});
			});
		},

		tryLoginWithToken(client)
		{
			return new Promise((resolve, reject) => {
				if (!('loginWithAccessToken' in client))
				{
					return reject();
				}

				if (this.token)
				{
					CallUtil.log('Trying to login with saved access token');
					this.getAuthorization().then((result) => {
						const login = result.login;
						const server = result.server;

						client.loginWithAccessToken(`${login}@${server}`, this.token).then((result) => {
							CallUtil.log('success', result);
							console.log(result);
							if ('params' in result && 'accessToken' in result.params)
							{
								this.setAccessToken(result.params.accessToken, result.params.accessExpire);
							}

							resolve();
						}).catch((e) => {
							console.error(e);
							reject(e);
						});
					}).catch((e) => {
						console.error(e);
						reject(e);
					});
				}
				else
				{
					return reject();
				}
			});
		},

		tryLoginWithOneTimeKey(client, options)
		{
			return new Promise((resolve, reject) => {
				client.requestOneTimeKey(options.id, options.endpoint, options.token).then((oneTimeKey) => {
					CallUtil.warn('ontimekey received');
					CallUtil.warn('ontimekey signed');

					resolve(client);
				})
					.catch((error) => {
						reject(error);
					});
			});
		},

		// return connected and authenticated client
		getClient()
		{
			return new Promise((resolve, reject) => {
				const client = BXClient.getInstance();

				if (client.getClientState() === 'LOGGED_IN')
				{
					return resolve(client);
				}

				const onConnected = (client) => {
					CallUtil.warn('connected');

					client.off(BXClient.Events.Failed, onFailed);
					client.off(BXClient.Events.Connected, onConnected);

					this.tryLoginWithToken(client)
						.then(() => resolve(client))
						.catch(() => {
							return resolve(client);
						});
				};

				let onFailed = (client, error) => {
					CallUtil.error(client, error);
					client.off(BXClient.Events.Failed, onFailed);
					client.off(BXClient.Events.Connected, onConnected);
					reject(error);
				};

				return resolve(client);
			});
		},
	};

	class Signaling
	{
		constructor(params)
		{
			this.call = params.call;
		}

		isPublishingEnabled()
		{
			return false;
		}

		inviteUsers(data)
		{
			return this.__runRestAction(ajaxActions.invite, data);
		}

		sendVoiceStarted(data)
		{
			return this.__sendMessage(clientEvents.voiceStarted, data);
		}

		sendVoiceStopped(data)
		{
			return this.__sendMessage(clientEvents.voiceStopped, data);
		}

		sendMicrophoneState(microphoneState)
		{
			return this.__sendMessage(clientEvents.microphoneState, {
				microphoneState: microphoneState ? 'Y' : 'N',
			});
		}

		sendCameraState(cameraState)
		{
			return this.__sendMessage(clientEvents.cameraState, {
				cameraState: cameraState ? 'Y' : 'N',
			});
		}

		sendVideoPaused(videoPaused)
		{
			return this.__sendMessage(clientEvents.videoPaused, {
				videoPaused: videoPaused ? 'Y' : 'N',
			});
		}

		sendScreenState(screenState)
		{
			return this.__sendMessage(clientEvents.screenState, {
				screenState: screenState ? 'Y' : 'N',
			});
		}

		sendFloorRequest(requestActive)
		{
			return this.__sendMessage(clientEvents.floorRequest, {
				requestActive: requestActive ? 'Y' : 'N',
			});
		}

		sendEmotion(toUserId, emotion)
		{
			return this.__sendMessage(clientEvents.emotion, {
				toUserId,
				emotion,
			});
		}

		sendShowUsers(users)
		{
			this.call.log(`Show video from users ${BX.type.isArray(users) ? users.join('; ') : users}`);

			return this.__sendMessage(clientEvents.showUsers, {
				users,
			});
		}

		sendShowAll()
		{
			return this.__sendMessage(clientEvents.showAll, {});
		}

		sendHideAll()
		{
			return this.__sendMessage(clientEvents.hideAll, {});
		}

		sendRepeatAnswer(data)
		{
			this.__sendPullEvent(pullEvents.repeatAnswer, data);
		}

		sendUserInviteTimeout(data)
		{
			return this.__sendMessage(clientEvents.userInviteTimeout, {data});
		}

		getPublishingState()
		{
			return BX.PULL.getPublishingState();
		}

		__sendPullEvent(eventName, data, expiry)
		{
			expiry = expiry || 5;
			if (!data.userId)
			{
				throw new Error('userId is not found in data');
			}

			if (!BX.type.isArray(data.userId))
			{
				data.userId = [data.userId];
			}

			if (data.userId.length === 0)
			{
				// nobody to send, exit
				return;
			}

			data.callInstanceId = this.call.instanceId;
			data.senderId = this.call.userId;
			data.callUuid = this.call.uuid;
			data.requestId = callEngine.getUuidv4();

			this.call.log(`Sending p2p signaling event ${eventName}; ${JSON.stringify(data)}`);
			BX.PULL.sendMessage(data.userId, 'im', eventName, data, expiry);
		}

		__sendMessage(eventName, data)
		{
			if (!this.call.bitrixCallDev)
			{
				return;
			}

			if (!BX.type.isPlainObject(data))
			{
				data = {};
			}
			data.eventName = eventName;
			data.requestId = callEngine.getUuidv4();

			this.call.bitrixCallDev.sendMessage(JSON.stringify(data));
		}

		__runRestAction(signalName, data)
		{
			if (!BX.type.isPlainObject(data))
			{
				data = {};
			}

			data.callUuid = this.call.uuid;
			data.callInstanceId = this.call.instanceId;
			data.requestId = callEngine.getUuidv4();

			return callEngine.getRestClient().callMethod(signalName, data);
		}

		__sendPullEventOrCallRest(eventName, restMethod, data, expiry)
		{
			this.getPublishingState().then((result) => {
				if (result)
				{
					this.__sendPullEvent(eventName, data, expiry);
				}
				else if (restMethod != '')
				{
					this.__runRestAction(restMethod, data);
				}
			}).catch((error) => {
				CallUtil.error(error);
				this.call.log(error);
			});
		}
	}

	class Peer
	{
		constructor(params)
		{
			this.userId = params.userId;
			this.call = params.call;

			this.ready = !!params.ready;
			this.calling = false;
			this.declined = false;
			this.busy = false;
			this.inviteTimeout = false;
			this.endpoint = null;

			this.isIncomingVideoAllowed = params.isIncomingVideoAllowed !== false;
			this.canChangeUI = params.canChangeUI;

			this.callingTimeout = 0;
			this.connectionRestoreTimeout = 0;
			this.waitForAnswerTimeout = null;

			this.callbacks = {
				onStateChanged: BX.type.isFunction(params.onStateChanged) ? params.onStateChanged : BX.DoNothing,
				onInviteTimeout: BX.type.isFunction(params.onInviteTimeout) ? params.onInviteTimeout : BX.DoNothing,
				onStreamReceived: BX.type.isFunction(params.onStreamReceived) ? params.onStreamReceived : BX.DoNothing,
				onStreamRemoved: BX.type.isFunction(params.onStreamRemoved) ? params.onStreamRemoved : BX.DoNothing,
				onUserVoiceStarted: BX.type.isFunction(params.onUserVoiceStarted) ? params.onUserVoiceStarted : BX.DoNothing,
				onUserVoiceStopped: BX.type.isFunction(params.onUserVoiceStopped) ? params.onUserVoiceStopped : BX.DoNothing,
				onInitialState: BX.type.isFunction(params.onInitialState) ? params.onInitialState : BX.DoNothing,
				onHandRaised: BX.type.isFunction(params.onHandRaised) ? params.onHandRaised : BX.DoNothing,
			};

			// event handlers
			this.__onEndpointRemoteMediaAddedHandler = this.__onEndpointRemoteMediaAdded.bind(this);
			this.__onEndpointRemoteMediaRemovedHandler = this.__onEndpointRemoteMediaRemoved.bind(this);
			this.__onEndpointVoiceStartedHandler = this.__onEndpointVoiceStarted.bind(this);
			this.__onEndpointVoiceStoppedHandler = this.__onEndpointVoiceStopped.bind(this);
			this.__onEndpointRemovedHandler = this.__onEndpointRemoved.bind(this);
			this.__onEndpointHandRaisedHandler = this.__onEndpointHandRaised.bind(this);

			this.calculatedState = this.calculateState();
		}

		setReady(ready)
		{
			ready = !!ready;
			if (this.ready == ready)
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
			else
			{
				clearTimeout(this.connectionRestoreTimeout);
			}

			this.updateCalculatedState();
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
			clearTimeout(this.connectionRestoreTimeout);
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
			clearTimeout(this.connectionRestoreTimeout);
			this.updateCalculatedState();
		}

		setEndpoint(endpoint)
		{
			this.log(`Adding endpoint with ${endpoint.remoteVideoStreams.length} remote video streams`);

			this.inviteTimeout = false;
			this.declined = false;
			clearTimeout(this.connectionRestoreTimeout);
			clearTimeout(this.callingTimeout);

			if (this.endpoint)
			{
				this.removeEndpointEventHandlers();
				this.endpoint = null;
			}

			this.endpoint = endpoint;

			if (this.endpoint.remoteVideoStreams.length > 0)
			{
				this.callbacks.onStreamReceived({
					userId: this.userId,
					stream: this.getStreams(),
					canChangeUI: this.canChangeUI
				});
			}

			if (this.ready === true)
			{
				this.updateCalculatedState();
			}
			else
			{
				this.setReady(true);
			}
			this.bindEndpointEventHandlers();
			if (endpoint.initialState)
			{
				this.callbacks.onInitialState({
					userId: this.userId,
					microphoneState: endpoint.initialState.microphoneState,
					floorRequest: endpoint.initialState.floorRequest,
					canChangeUI: this.canChangeUI
				});
			}
		}

		allowIncomingVideo(isIncomingVideoAllowed)
		{
			if (this.isIncomingVideoAllowed == isIncomingVideoAllowed)
			{
				return;
			}

			this.isIncomingVideoAllowed = !!isIncomingVideoAllowed;
		}

		bindEndpointEventHandlers()
		{
			this.endpoint.on(JNBXEndpoint.Events.VideoStreamAdded, this.__onEndpointRemoteMediaAddedHandler);
			this.endpoint.on(JNBXEndpoint.Events.VideoStreamRemoved, this.__onEndpointRemoteMediaRemovedHandler);
			this.endpoint.on(JNBXEndpoint.Events.VoiceStarted, this.__onEndpointVoiceStartedHandler);
			this.endpoint.on(JNBXEndpoint.Events.VoiceStopped, this.__onEndpointVoiceStoppedHandler);
			this.endpoint.on(JNBXEndpoint.Events.Removed, this.__onEndpointRemovedHandler);
			this.endpoint.on(JNBXEndpoint.Events.HandRaised, this.__onEndpointHandRaisedHandler);
		}

		removeEndpointEventHandlers()
		{
			this.endpoint.off(JNBXEndpoint.Events.VideoStreamAdded, this.__onEndpointRemoteMediaAddedHandler);
			this.endpoint.off(JNBXEndpoint.Events.VideoStreamRemoved, this.__onEndpointRemoteMediaRemovedHandler);
			this.endpoint.off(JNBXEndpoint.Events.VoiceStarted, this.__onEndpointVoiceStartedHandler);
			this.endpoint.off(JNBXEndpoint.Events.VoiceStopped, this.__onEndpointVoiceStoppedHandler);
			this.endpoint.off(JNBXEndpoint.Events.Removed, this.__onEndpointRemovedHandler);
			this.endpoint.off(JNBXEndpoint.Events.HandRaised, this.__onEndpointHandRaisedHandler);
		}

		calculateState()
		{
			if (this.endpoint)
			{
				return BX.Call.UserState.Connected;
			}

			if (this.calling)
			{
				return BX.Call.UserState.Calling;
			}

			if (this.inviteTimeout)
			{
				return BX.Call.UserState.Unavailable;
			}

			if (this.declined)
			{
				return BX.Call.UserState.Declined;
			}

			if (this.busy)
			{
				return BX.Call.UserState.Busy;
			}

			if (this.ready)
			{
				return BX.Call.UserState.Ready;
			}

			return BX.Call.UserState.Idle;
		}

		updateCalculatedState()
		{
			const calculatedState = this.calculateState();

			if (this.calculatedState != calculatedState)
			{
				this.callbacks.onStateChanged({
					userId: this.userId,
					state: calculatedState,
					previousState: this.calculatedState,
					canChangeUI: this.canChangeUI
				});
				this.calculatedState = calculatedState;
			}
		}

		isParticipating(withCalling)
		{
			if (!(typeof (withCalling) === 'boolean'))
			{
				withCalling = true;
			}

			if (withCalling)
			{
				return ((this.calling || this.ready || this.endpoint) && !this.declined);
			}

			return ((this.ready || this.endpoint) && !this.declined);
		}

		waitForConnectionRestore()
		{
			clearTimeout(this.connectionRestoreTimeout);
			this.connectionRestoreTimeout = setTimeout(
				this.onConnectionRestoreTimeout.bind(this),
				connectionRestoreTime,
			);
		}

		onInvited()
		{
			this.ready = false;
			this.inviteTimeout = false;
			this.declined = false;
			this.calling = true;

			clearTimeout(this.connectionRestoreTimeout);
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
			if (!this.calling)
			{
				return;
			}
			this.calling = false;
			this.inviteTimeout = true;
			if (internal)
			{
				this.callbacks.onInviteTimeout({
					userId: this.userId,
				});
			}
			this.updateCalculatedState();
		}

		onConnectionRestoreTimeout()
		{
			if (this.endpoint || !this.ready)
			{
				return;
			}

			this.log('Done waiting for connection restoration');
			this.setReady(false);
		}

		__onEndpointRemoteMediaAdded(e)
		{
			this.log('RemoteMediaAdded', e);
			this.callbacks.onStreamReceived({
				userId: this.userId,
				stream: this.getStreams(),
				canChangeUI: this.canChangeUI
			});

			this.updateCalculatedState();
		}

		__onEndpointRemoteMediaRemoved(e)
		{
			this.log('Remote media removed', e);
			this.callbacks.onStreamReceived({
				userId: this.userId,
				stream: this.getStreams(),
				canChangeUI: this.canChangeUI
			});

			this.updateCalculatedState();
		}

		__onEndpointVoiceStarted(e)
		{
			this.log('Voice started');
			this.callbacks.onUserVoiceStarted({
				userId: this.userId,
			});
		}

		__onEndpointVoiceStopped(e)
		{
			this.log('Voice stopped');
			this.callbacks.onUserVoiceStopped({
				userId: this.userId,
			});
		}

		__onEndpointRemoved(e)
		{
			this.log('Endpoint removed');

			if (this.endpoint)
			{
				this.removeEndpointEventHandlers();
				this.endpoint = null;
			}

			if (this.ready)
			{
				this.waitForConnectionRestore();
			}

			this.updateCalculatedState();
		}

		__onEndpointHandRaised(e)
		{
			this.log('Endpoint hand raised');

			this.callbacks.onHandRaised({
				userId: this.userId,
				isHandRaised: e.isHandRaised,
				canChangeUI: this.canChangeUI
			});
		}

		getStreams()
		{
			let streams = this.endpoint.remoteVideoStreams;
			if (streams.length == 0)
			{
				return null;
			}
			return streams;
		}

		log()
		{
			this.call && this.call.log.apply(this.call, arguments);
		}

		destroy()
		{
			if (this.endpoint)
			{
				this.removeEndpointEventHandlers();
				this.endpoint = null;
			}

			this.callbacks.onStateChanged = BX.DoNothing;
			this.callbacks.onStreamReceived = BX.DoNothing;
			this.callbacks.onUserVoiceStarted = BX.DoNothing;
			this.callbacks.onUserVoiceStopped = BX.DoNothing;
			this.callbacks.onInitialState = BX.DoNothing;
			this.callbacks.onHandRaised = BX.DoNothing;

			clearTimeout(this.callingTimeout);
			clearTimeout(this.connectionRestoreTimeout);
			this.callingTimeout = null;
			this.connectionRestoreTimeout = null;
			this.call = null;
		}
	}

	module.exports = {
		BitrixCallJwt,
	};
});
