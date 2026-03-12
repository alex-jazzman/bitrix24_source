"use strict";

jn.define('call/calls/plain-jwt', (require, exports, module) => {

	const { CallLogger } = require('call/calls/logger');
	const { RecordStatus } = require('call/const');
	const { ActiveCallNotification } = require('call/calls/active-call-notification');

	const DoNothing = function ()
	{
	};

	const defaultConnectionOptions = {"OfferToReceiveAudio": "true", "OfferToReceiveVideo": "true"};
	const signalingWaitReplyPeriod = 10000;
	const invitePeriod = 30000;

	const ajaxActions = Object.freeze({
		decline: "call.Call.decline",
	});

	const clientEvents = {
		negotiationNeeded: "Call::negotiationNeeded",
		connectionOffer: "Call::connectionOffer",
		connectionAnswer: "Call::connectionAnswer",
		iceCandidate: "Call::iceCandidate",
		voiceStarted: "Call::voiceStarted",
		voiceStopped: "Call::voiceStopped",
		microphoneState: "Call::microphoneState",
		cameraState: "Call::cameraState",
		videoPaused: "Call::videoPaused",
		hangup: "Call::hangup",
		userInviteTimeout: "Call::userInviteTimeout",
		repeatAnswer: "Call::repeatAnswer",
		usersInvited: 'Call::usersInvited',
		sendConnectionType: "Call::switchConnectionType",
	};

	class PlainCallJwt
	{
		constructor(params)
		{
			this.id = params.id;
			this.uuid = params.uuid;
			this.instanceId = params.instanceId;
			this.parentUuid = params.parentUuid;
			this.direction = params.direction;
			this.associatedEntity = BX.type.isPlainObject(params.associatedEntity) ? params.associatedEntity : {};
			this.connectionData = params.connectionData;
			this.scheme = params.scheme;
			this._recorderState = BX.Call.RecorderStatus.None;
			this.connectionType = 0;

			this.userId = parseInt(env.userId, 10);

			this.initiatorId = params.initiatorId || '';
			Object.defineProperty(this, 'users', {
				get: this.getUsersIds.bind(this),
			});

			this.ready = false;
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

			this.localStream = null;
			this.videoEnabled = Boolean(params.videoEnabled);
			this.muted = Boolean(params.muted);
			// this.isCopilotActive = Boolean(params.isCopilotActive);

			this.peers = {};

			this.signaling = new Signaling({
				call: this,
			});

			this.logToken = params.logToken || '';
			this.addLogToken(this.logToken);

			this.eventEmitter = new JNEventEmitter();
			params.events = params.events || {};
			if (params.events)
			{
				for (let eventName in params.events)
				{
					if (params.events.hasOwnProperty(eventName))
					{
						this.eventEmitter.on(eventName, params.events[eventName]);
					}
				}
			}

			this._reconnectionEventCount = 0;
			this._maxReconnectionAttempts = 3;

			this.lastPingReceivedTimeout = null;
			this.waitForAnswerTimeout = null;

			this.created = new Date();

			// event handlers
			this.__onCallDisconnectedHandler = this.__onCallDisconnected.bind(this);
			this.__onCallMessageReceivedHandler = this.__onCallMessageReceived.bind(this);
			this.__onCallEndpointAddedHandler = this.__onCallEndpointAdded.bind(this);
			this.__onCallEndpointsAddedHandler = this.__onCallEndpointsAdded.bind(this);
			this.__onCallReconnectingHandler = this.__onCallReconnecting.bind(this);
			this.__onCallReconnectedHandler = this.__onCallReconnected.bind(this);
			this.__onSwitchCallTypeHandler = this.__onSwitchCallType.bind(this);
			this.__onSignalingResponseReceivedHandler =  this.__onSignalingResponseReceived.bind(this);
			this.__onCallRecorderStatusChangedHandler = this.__onCallRecorderStatusChanged.bind(this);

			this.__onSDKLogMessageHandler = this.__onSDKLogMessage.bind(this);

			this.__onLocalVideoStreamReceivedHandler = this.__onLocalVideoStreamReceived.bind(this);
			this.__onLocalVideoStreamRemovedHandler = this.__onLocalVideoStreamRemoved.bind(this);

			this.activeCallNotification = new ActiveCallNotification({
				onSwitchMicrophonesStatus: () => this.eventEmitter.emit(BX.Call.Event.onActiveCallNotificationSwitchMicrophoneStatusPress),
				onHangup: () => this.eventEmitter.emit(BX.Call.Event.onActiveCallNotificationHangupButtonPress)
			});

			this._videoEnablePending = false;
		}

		get provider()
		{
			return BX.Call.Provider.Plain;
		}

		get hasConnectionData()
		{
			return Boolean(this.connectionData?.mediaServerUrl && this.connectionData?.roomData);
		}

		setConnectionData(connectionData)
		{
			this.connectionData = connectionData
		}

		setReceiveMedia(value)
		{
			if (this.plainCallJwt)
			{
				this.plainCallJwt.receiveVideo = value;
				this.plainCallJwt.receiveAudio = value;
			}
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

		reinitPeers()
		{
			var ids = [];

			for (const userId in this.peers)
			{
				if (this.peers.hasOwnProperty(userId) && this.peers[userId])
				{
					ids.push(userId);
					this.peers[userId].destroy();
					this.peers[userId] = null;
				}
			}

			ids.forEach(userId =>
			{
				userId = parseInt(userId, 10);
				this.peers[userId] = this.createPeer(userId);
			});
		}

		/**
		 * Invites users to participate in the call.
		 *
		 * @param {Object} config
		 * @param {int[]} [config.users] Array of ids of the users to be invited.
		 **/
		inviteUsers(config = {})
		{
			// const users = config.users || this.peers.map(peer => peer.userId);
			const users = config.users || [];
			if (users.length === 0)
			{
				//throw new Error("No users to invite");
			}
			this.ready = true;

			this.getLocalMedia().then(() =>
			{
				return this.attachToConference();
			}).then(() => {
				if (!this.ready)
				{
					this.#beforeLeaveCall();
					return;
				}

				clearTimeout(this.waitForAnswerTimeout);
				this.waitForAnswerTimeout = setTimeout(() =>
				{
					this.__onNoAnswer();
				}, invitePeriod);

				if (config.userData && config.show)
				{
					this.getSignaling().sendUsersInvited({
						users: config.userData,
					});
				}

				if (users.length)
				{
					return this.getSignaling().inviteUsers({
						userIds: users,
						video: this.videoEnabled ? "Y" : "N",
					});
				}
			}).then((response) =>
			{
				for (let i = 0; i < users.length; i++)
				{
					let userId = users[i];
					let peer = this.getPeer(userId);
					if (!peer)
					{
						peer = this.createPeer(userId);
						this.peers[userId] = peer;
					}
					peer.onInvited();
					this.joinStatus = BX.Call.JoinStatus.Local;
					/*this.runCallback(BX.Call.Event.onUserInvited, {
							userId: userId
						});*/
					//this.scheduleRepeatInvite();
				}
			});
		}

		attachToConference()
		{
			return new Promise((resolve, reject) => {
				if (this.plainCallJwt)
				{
					return resolve();
				}

				const clientOptions = {
					roomId: this.uuid,
					endpoint: this.connectionData.endpoint,
					token: this.connectionData.jwt,
				};

				try
				{
					if (!this.ready)
					{
						return;
					}
					const client = BXClient.getInstance();
					client.on(BXClient.Events.LogMessage, this.__onSDKLogMessageHandler);

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

						const signalingUrl = this.getSignalingUrl(this.connectionData.mediaServerUrl, this.connectionData.roomData);

						const callOptions = {
							signalingUrl: signalingUrl,
							callId: `${this.uuid}`,
							sendVideo: false,
							receiveVideo: false,
							sendAudio: false,
							receiveAudio: false,
							enableSimulcast: true,
							userName: this.userData,
							callBetaIosEnabled: callEngine.isCallBetaIosEnabled(),
						};

						console.log('start plainCallJwt', callOptions);

						this.plainCallJwt = client.startCall(
							callOptions,
						);
					}
					catch (e)
					{
						CallUtil.error(e);
						return reject(e);
					}

					if (!this.plainCallJwt)
					{
						this.log('Error: could not create bitrix dev call');

						return reject({ code: 'BITRIX_DEV_NO_CALL' });
					}

					this.bindCallEvents();

					const onCallConnected = () => {
						this.log('Call connected');
						this.plainCallJwt.off(JNBXCall.Events.Connected, onCallConnected);
						this.plainCallJwt.off(JNBXCall.Events.Failed, onCallFailed);

						this.plainCallJwt.on(JNBXCall.Events.Failed, this.__onCallDisconnectedHandler);

						this.signaling.sendMicrophoneState(!this.muted);
						this.signaling.sendCameraState(this.videoEnabled);
						MediaDevices.startCapture();

						if (this.videoAllowedFrom == BX.Call.UserMnemonic.none)
						{
							this.signaling.sendHideAll();
						}
						else if (BX.type.isArray(this.videoAllowedFrom))
						{
							this.signaling.sendShowUsers(this.videoAllowedFrom);
						}

						resolve();
					};

					let onCallFailed = (call, error) => {
						this.log('Could not attach to conference', error);
						CallUtil.error('Could not attach to conference', error);
						if (this.plainCallJwt)
						{
							this.plainCallJwt.off(JNBXCall.Events.Connected, onCallConnected);
							this.plainCallJwt.off(JNBXCall.Events.Failed, onCallFailed);
						}
						reject(error);
					};

					this.plainCallJwt.on(JNBXCall.Events.Connected, onCallConnected);
					this.plainCallJwt.on(JNBXCall.Events.Failed, onCallFailed);
					this.plainCallJwt.start();
				}
				catch (e)
				{
					this.onFatalError(e);
				}
				// }).catch(this.onFatalError.bind(this));
			});
		}

		getSignalingUrl(baseUrl, roomData)
		{
			return baseUrl + "?auto_subscribe=1&sdk=js&version=1.6.7&protocol=8&roomData=" + roomData
		}

		bindCallEvents()
		{
			this.plainCallJwt.on(JNBXCall.Events.EndpointAdded, this.__onCallEndpointAddedHandler);
			this.plainCallJwt.on(JNBXCall.Events.EndpointsAdded, this.__onCallEndpointsAddedHandler);
			this.plainCallJwt.on(JNBXCall.Events.ReceiveMessage, this.__onCallMessageReceivedHandler);
			this.plainCallJwt.on(JNBXCall.Events.Reconnecting, this.__onCallReconnectingHandler);
			this.plainCallJwt.on(JNBXCall.Events.Reconnected, this.__onCallReconnectedHandler);
			this.plainCallJwt.on(JNBXCall.Events.Disconnected, this.__onCallDisconnectedHandler);
			// this.plainCallJwt.on(JNBXCall.Events.SwitchCallType, this.__onSwitchCallTypeHandler);
			this.plainCallJwt.on(JNBXCall.Events.SignalingResponseReceived, this.__onSignalingResponseReceivedHandler);
			this.plainCallJwt.on(JNBXCall.Events.RecorderStatusChanged, this.__onCallRecorderStatusChangedHandler);
			this.plainCallJwt.on(JNBXCall.Events.LocalVideoStreamAdded, this.__onLocalVideoStreamReceivedHandler);
			this.plainCallJwt.on(JNBXCall.Events.LocalVideoStreamRemoved, this.__onLocalVideoStreamRemovedHandler);
		}

		removeCallEvents()
		{
			if (this.plainCallJwt)
			{
				this.plainCallJwt.off(JNBXCall.Events.EndpointAdded, this.__onCallEndpointAddedHandler);
				this.plainCallJwt.off(JNBXCall.Events.EndpointsAdded, this.__onCallEndpointsAddedHandler);
				this.plainCallJwt.off(JNBXCall.Events.ReceiveMessage, this.__onCallMessageReceivedHandler);
				this.plainCallJwt.off(JNBXCall.Events.Reconnecting, this.__onCallReconnectingHandler);
				this.plainCallJwt.off(JNBXCall.Events.Reconnected, this.__onCallReconnectedHandler);
				this.plainCallJwt.off(JNBXCall.Events.Disconnected, this.__onCallDisconnectedHandler);
				// this.plainCallJwt.off(JNBXCall.Events.SwitchCallType, this.__onSwitchCallTypeHandler);
				this.plainCallJwt.off(JNBXCall.Events.SignalingResponseReceived, this.__onSignalingResponseReceivedHandler);
				this.plainCallJwt.off(JNBXCall.Events.RecorderStatusChanged, this.__onCallRecorderStatusChangedHandler);
				this.plainCallJwt.off(JNBXCall.Events.LocalVideoStreamAdded, this.__onLocalVideoStreamReceivedHandler);
				this.plainCallJwt.off(JNBXCall.Events.LocalVideoStreamRemoved, this.__onLocalVideoStreamRemovedHandler);
			}
		}

		createPeer(userId)
		{
			userId = parseInt(userId, 10);

			return new Peer({
				call: this,
				userId: userId,
				ready: userId == this.userId,

				onStreamReceived: (track) =>
				{
					this.log("onStreamReceived; track kind: ", track.kind, "id: ", track.id);
					this.eventEmitter.emit(BX.Call.Event.onStreamReceived, [userId, track]);
				},
				onStreamRemoved: (e) =>
				{
					this.log("onStreamRemoved: ", e);
					this.eventEmitter.emit(BX.Call.Event.onStreamRemoved, [userId]);
				},
				onStateChanged: this._onPeerStateChanged.bind(this),
				onInviteTimeout: this._onPeerInviteTimeout.bind(this),
				onReconnecting: () =>
				{
					this.__onCallReconnecting();
				},
				onReconnected: () =>
				{
					this.__onCallReconnected();
				},
			});
		}

		/**
		 *
		 * @param userId
		 * @returns {Peer|undefined}
		 */
		getPeer(userId)
		{
			return this.peers[userId];
		}

		getUsersStates()
		{
			let result = {};
			for (let id in this.peers)
			{
				const peer = this.peers[id];
				result[peer.userId] = peer.calculatedState;
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

		toggleRecorderState()
		{
			if (!this.plainCallJwt)
			{
				return;
			}

			this.plainCallJwt.setRecorderState(this._recorderState === BX.Call.RecorderStatus.Enabled ? BX.Call.RecorderStatus.Paused : BX.Call.RecorderStatus.Enabled);
		};

		isVideoEnabled()
		{
			return this.videoEnabled;
		}

		async setVideoEnabled(videoEnabled, isSwitchingCallType)
		{
			videoEnabled = (videoEnabled === true);
			if (this.videoEnabled == videoEnabled && !isSwitchingCallType)
			{
				return;
			}

			if (this._videoEnablePending)
			{
				return;
			}

			this._videoEnablePending = true;

			try
			{
				this.videoEnabled = videoEnabled;

				if (this.connectionType === 0)
				{
					if (this.videoEnabled)
					{
						if (this.localStream?.getVideoTracks().length > 0)
						{
							MediaDevices.startCapture();
							this.eventEmitter.emit(BX.Call.Event.onLocalMediaReceived, [this.localStream]);
							this.replaceAllMedia();
						}
						else
						{
							await this.getLocalMedia();
							this.replaceAllMedia();
						}
					}
					else
					{
						MediaDevices.stopCapture();
						this.eventEmitter.emit(BX.Call.Event.onLocalMediaStopped);
						this.replaceAllMedia();
					}

					this.signaling.sendCameraState(this.users, this.videoEnabled);
				}

				if (this.connectionType === 1)
				{
					this.plainCallJwt.setSendVideo(this.videoEnabled);
					this.signaling.sendCameraState(this.users, this.videoEnabled);
				}
			}
			finally
			{
				this._videoEnablePending = false;
			}
		}

		setSendVideo(value)
		{
			this.plainCallJwt.setSendVideo(value);
		}

		replaceAllMedia()
		{
			if (this.ready)
			{
				for (let id in this.peers)
				{
					const peer = this.peers[id];
					peer.replaceMedia();
				}
			}
		}

		setVideoPaused(videoPaused)
		{
			if (this.videoPaused == videoPaused || !this.videoEnabled)
			{
				return;
			}

			this.videoPaused = videoPaused;
			this.log("call setVideoPaused " + this.videoPaused.toString());
			if (this.localStream && this.localStream.getVideoTracks().length > 0)
			{
				this.localStream.getVideoTracks().forEach(track => track.enabled = !this.videoPaused);
				this.signaling.sendVideoPaused(this.users, this.videoPaused);
			}
		}

		switchCamera()
		{
			if (!this.videoEnabled || !this.localStream)
			{
				return;
			}
			MediaDevices.switchVideoSource();
		}

		isFrontCameraUsed()
		{
			return MediaDevices.cameraDirection === "front";
		}

		setMuted(muted, isSwitchingCallType)
		{
			muted = !!muted;
			if (this.muted == muted && !isSwitchingCallType)
			{
				return;
			}

			this.muted = muted;
			if (isSwitchingCallType)
			{
				if (this.localStream)
				{
					var audioTracks = this.localStream.getAudioTracks();
					if (audioTracks[0])
					{
						audioTracks[0].enabled = false;
					}
				}

				this.plainCallJwt.sendAudio = !muted;
				return;
			}

			if (this.connectionType === 1)
			{
				this.plainCallJwt.sendAudio = !muted;
			}
			if (this.localStream && this.connectionType === 0)
			{
				var audioTracks = this.localStream.getAudioTracks();
				if (audioTracks[0])
				{
					audioTracks[0].enabled = !this.muted;
				}
			}

			if (this.plainCallJwt)
			{
				this.signaling.sendMicrophoneState(this.users, !this.muted);
			}
		}

		sendSwitchConnectionType(data)
		{
			this.signaling.sendSwitchConnectionType(data);
		}

		sendSwitchCallType(data)
		{
			this.signaling.sendSwitchCallType(data);
		}

		isMuted()
		{
			return this.muted;
		}

		log()
		{
			let text = CallUtil.getLogMessage.apply(CallUtil, arguments);
			if (console && callEngine.debugFlag)
			{
				let a = ["Call log [" + CallUtil.getTimeForLog() + "]: "];
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

		/**
		 * @returns {Signaling}
		 */
		getSignaling()
		{
			return this.signaling;
		}

		getLocalMedia()
		{
			return new Promise((resolve) =>
			{
				MediaDevices.getUserMedia({audio: true, video: this.videoEnabled}).then((stream) =>
				{
					if (this.videoEnabled)
					{
						this.eventEmitter.emit(BX.Call.Event.onLocalMediaReceived, [stream]);
					}
					if (!this.videoEnabled && this.localStream)
					{
						this.eventEmitter.emit(BX.Call.Event.onLocalMediaStopped);
					}
					if (this.muted)
					{
						const audioTracks = stream.getAudioTracks();
						if (audioTracks && audioTracks.length > 0)
						{
							audioTracks[0].enabled = false;
						}
					}
					this.localStream = stream;
					resolve();
				});
			});
		}

		isReady()
		{
			return this.ready;
		}

		sendLocalStream(userId)
		{
			let peer = this.getPeer(userId);
			if (!peer)
			{
				return;
			}

			if (!peer.isReady())
			{
				return;
			}

			peer.sendMedia();
		}

		/**
		 * @param {Object} config
		 * @param {bool} [config.useVideo]
		 * @param {bool} [config.enableMicAutoParameters]
		 * @param {MediaStream} [config.localStream]
		 */
		answer(config)
		{
			if (!BX.type.isPlainObject(config))
			{
				config = {};
			}

			this.ready = true;
			this.videoEnabled = (config.useVideo === true);
			this.enableMicAutoParameters = (config.enableMicAutoParameters !== false);

			return new Promise((resolve, reject) =>
			{
				if (this.joinStatus != BX.Call.JoinStatus.None)
				{
					return reject(new CallJoinedElseWhereError());
				}
				this.getLocalMedia().then(() =>
					{
						this.joinStatus = BX.Call.JoinStatus.Local;
						return this.attachToConference();
					},
					(e) =>
					{
						this.#beforeLeaveCall();
						this.eventEmitter.emit(BX.Call.Event.onCallFailure, [e]);
					},
				).then(() =>
				{
					if (!this.ready)
					{
						this.#beforeLeaveCall();
						return;
					}

					resolve();
				});
			});
		};

		/**
		 * Adds users, invited by you or someone else
		 * @param {Object} users
		 * @params {Object} userData
		 */
		addInvitedUsers(users, userData)
		{
			for (let i = 0; i < users.length; i++)
			{
				const userId = parseInt(users[i], 10);
				if (userId == this.userId)
				{
					continue;
				}

				let peer = this.getPeer(userId);
				if (peer)
				{
					if (peer.calculatedState === BX.Call.UserState.Failed || peer.calculatedState === BX.Call.UserState.Idle)
					{
						peer.onInvited();
					}
				}
				else
				{
					peer = this.createPeer(userId);
					this.peers[userId] = peer;
					peer.onInvited();
				}

				if (userData && userData[userId])
				{
					this.eventEmitter.emit(BX.Call.Event.onUserInvited, [{userId: userId, userData: userData}]);
				}
				else
				{
					this.eventEmitter.emit(BX.Call.Event.onUserInvited, [{userId: userId}]);
				}
			}
		}

		isAnyoneParticipating()
		{
			return Object.values(this.peers).some(peer => peer.isParticipating());
		}

		getJwtApiVersion()
		{
			return this.plainCallJwt.getApiVersion();
		}

		decline(code, reason)
		{
			this.ready = false;

			let data = {
				callUuid: this.uuid,
				callInstanceId: this.instanceId,
			};

			if (typeof (code) != "undefined")
			{
				data.code = code;
			}
			if (typeof (reason) != "undefined")
			{
				data.reason = reason;
			}

			callEngine.getRestClient().callMethod(ajaxActions.decline, data).then(() => this.destroy());
		};

		hangup()
		{
			this.dismissActiveCallNotification();
			if (!this.ready)
			{
				let error = new Error("Hangup in wrong state");
				this.log(error);
				return;
			}

			let tempError = new Error();
			tempError.name = "Call stack:";
			this.log("Hangup received \n" + tempError.stack);

			this.ready = false;
			this.connectionData = {};

			if (this.plainCallJwt)
			{
				try
				{
					this.plainCallJwt.hangup();
				}
				catch (e)
				{
					CallUtil.error(e);
				}

				this.plainCallJwt = null;
			}

			this.eventEmitter.emit(BX.Call.Event.onLeave, [{ callId: this.id, callUuid: this.uuid }]);
		};

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

		getUsersIds()
		{
			if (!this.peers)
			{
				return [];
			}

			try
			{
				return Object.keys(this.peers).map(key => parseInt(key, 10));
			}
			catch (e)
			{
				return [];
			}
		}

		repeatAnswerEvents()
		{
			this.signaling.sendRepeatAnswer({userId: this.userId});
		}

		runCallback(eventName, event)
		{

		}

		_onPullEvent(command, params, extra)
		{
			let handlers = {
				"Call::answer": this._onPullEventAnswer.bind(this),
				"Call::hangup": this._onPullEventHangup.bind(this),
				"Call::usersJoined": this._onPullEventUsersJoined.bind(this),
				"Call::usersInvited": this._onPullEventUsersInvited.bind(this),
				"Call::associatedEntityReplaced": this._onPullEventAssociatedEntityReplaced.bind(this),
				"Call::finish": this._onPullEventFinish.bind(this),
				"Call::repeatAnswer": this._onPullEventRepeatAnswer.bind(this),
			};

			if (handlers[command])
			{
				this.log("Signaling: " + command + "; Parameters: " + JSON.stringify(params));
				handlers[command].call(this, params);
			}
		};

		_onPullEventAnswer(params)
		{
			let senderId = params.senderId;

			this.log("_onPullEventAnswer", senderId, this.userId);
			if (senderId == this.userId)
			{
				return this._onPullEventAnswerSelf(params);
			}
			if (!this.ready)
			{
				return;
			}
			let peer = this.getPeer(senderId);
			if (!peer)
			{
				return;
			}

			peer.setSignalingConnected(true);
			peer.setReady(true);
			peer.isLegacyMobile = params.isLegacyMobile === true;
			if (this.ready)
			{
				peer.sendMedia();
			}
		}

		_onPullEventAnswerSelf(params)
		{
			if (params.callInstanceId === this.instanceId)
			{
				return;
			}

			// call was answered elsewhere
			this.log("Call was answered elsewhere");
			this.joinStatus = BX.Call.JoinStatus.Remote;
		}

		_onPullEventHangup(params)
		{
			let senderId = params.senderId;

			if (this.userId == senderId)
			{
				if (this.instanceId != params.callInstanceId)
				{
					// self hangup elsewhere
					this.joinStatus = BX.Call.JoinStatus.None;
					this.eventEmitter.emit(BX.Call.Event.onHangup);
				}
				return;
			}

			let peer = this.getPeer(senderId);
			if (!peer || peer.endpoint)
			{
				return;
			}

			peer.disconnect(params.code);
			peer.setReady(false);

			if (params.code == 603)
			{
				peer.setDeclined(true);
			}

			if (!this.isAnyoneParticipating())
			{
				this.hangup();
			}
		}

		_onPullEventNegotiationNeeded(params)
		{
			console.log('_onPullEventNegotiationNeeded', params);
			if (!this.ready)
			{
				return;
			}
			let peer = this.getPeer(params.senderId);
			if (!peer)
			{
				return;
			}

			peer.setReady(true);
			if (params.restart)
			{
				peer.reconnect();
			}
			else
			{
				peer.onNegotiationNeeded();
			}
		}

		_onPullEventConnectionOffer = (params) =>
		{
			console.log('_onPullEventConnectionOffer', this.ready, params);
			if (!this.ready)
			{
				return;
			}
			let peer = this.getPeer(params.senderId);
			if (!peer)
			{
				return;
			}

			peer.setReady(true);
			peer.setUserAgent(params.userAgent);
			peer.setConnectionOffer(params.connectionId, params.sdp, params.tracks);
		}

		_onPullEventConnectionAnswer = (params) =>
		{
			let peer = this.getPeer(params.senderId);
			if (!this.ready)
			{
				return;
			}
			if (!peer)
			{
				return;
			}

			let connectionId = params.connectionId;
			peer.setUserAgent(params.userAgent);
			peer.setConnectionAnswer(connectionId, params.sdp, params.tracks);
		}

		_onPullEventIceCandidate = (params) =>
		{
			if (!this.ready)
			{
				return;
			}
			let peer = this.getPeer(params.senderId);
			let candidates;
			if (!peer)
			{
				return;
			}

			try
			{
				candidates = params.candidates;
				for (var i = 0; i < candidates.length; i++)
				{
					peer.addIceCandidate(params.connectionId, candidates[i]);
				}
			} catch (e)
			{
				this.log("Error parsing serialized candidate: ", e);
			}
		}

		_onPullEventVoiceStarted(params)
		{

		}

		_onPullEventVoiceStopped(params)
		{

		}

		_onPullEventMicrophoneState(params)
		{
			this.eventEmitter.emit(BX.Call.Event.onUserMicrophoneState, [
				params.senderId,
				params.microphoneState,
			]);
		}

		_onPullEventVideoPaused(params)
		{
			this.eventEmitter.emit(BX.Call.Event.onUserVideoPaused, [
				params.senderId,
				params.videoPaused,
			]);
		}

		_onPullEventUsersJoined(params)
		{

		}

		_onPullEventUsersInvited(params)
		{
			if (!this.ready)
			{
				return;
			}
			let users = params.users;
			let userData = params.userData;
			this.addInvitedUsers(users, userData);
		}

		_onPullEventUserInviteTimeout(params)
		{
			this.log("__onPullEventUserInviteTimeout", params);
			var failedUserId = params.failedUserId;

			if (this.getPeer(failedUserId))
			{
				this.getPeer(failedUserId).onInviteTimeout(false);
			}
		}

		_onPullEventAssociatedEntityReplaced(params)
		{

		}

		_onPullEventFinish(params)
		{
			this.destroy();
		}

		_onPullEventRepeatAnswer()
		{
			if (this.ready)
			{
				this.signaling.sendAnswer({userId: this.userId}, true)
			}
		}

		_onPeerStateChanged(e)
		{
			this.eventEmitter.emit(BX.Call.Event.onUserStateChanged, [
				e.userId,
				e.state,
				e.previousState,
				e.isLegacyMobile,
			]);

			if (e.state == BX.Call.UserState.Failed || e.state == BX.Call.UserState.Unavailable || e.state == BX.Call.UserState.Declined || e.state == BX.Call.UserState.Idle)
			{
				if (!this.isAnyoneParticipating())
				{
					this.hangup();
				}
			}
			else if (e.state == BX.Call.UserState.Connected)
			{
				this.signaling.sendMicrophoneState(e.userId, !this.muted);
				this.signaling.sendCameraState(e.userId, this.videoEnabled);
			}
		}

		_onPeerInviteTimeout()
		{
			// todo: delete it?
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

			else if (headers.leaveInformation?.reason === BX.Call.CallError.RoomClosed)
			{
				this.destroy();
			}

			this.ready = false;
			this.muted = false;
			this.reinitPeers();

			if (headers.leaveInformation?.reason !== BX.Call.CallError.SecurityKeyChanged)
			{
				this.plainCallJwt = null;
				this.joinStatus = BX.Call.JoinStatus.None;
				return;
			}

			if (headers.leaveInformation?.reason === BX.Call.CallError.SecurityKeyChanged)
			{
				console.error('SecurityKeyChanged fatal error');
				this.onFatalError(headers.leaveInformation.reason);
			}
		}

		__onCallReconnecting()
		{
			this._reconnectionEventCount++;
			this.eventEmitter.emit(BX.Call.Event.onReconnecting, [{
				reconnectionEventCount: this._reconnectionEventCount,
			}]);

			CallUtil.getCallConnectionDataById(this.uuid)
				.then((response) => {
					if (this.ready && this.plainCallJwt)
					{
						const signalingUrl = this.getSignalingUrl(response.result.mediaServerUrl, response.result.roomData);
						this.plainCallJwt.updateSignalingUrl(signalingUrl);
					}
					else
					{
						this.#beforeLeaveCall();
					}
				})
				.catch((error) => {
					const errorPreventingReconnection = Object.values(BX.Call.ErrorPreventingReconnection);

					if (errorPreventingReconnection.includes(error.errorCode))
					{
						console.error('errorPreventingReconnection fatal error');
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
						this.#beforeLeaveCall();
					}
				});
		}

		__onCallReconnected()
		{
			this._reconnectionEventCount = 0;
			this.eventEmitter.emit(BX.Call.Event.onReconnected);
		}

		__onSwitchCallType()
		{
			this.eventEmitter.emit(BX.Call.Event.onSwitchConnectionType);
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
				if (data?.joinResponse)
				{
					if (data?.joinResponse?.oneToOneType === 1)
					{
						if (this.connectionType === 0)
						{
							setTimeout(() => {
								this.connectionType = 1;
								this.eventEmitter.emit(BX.Call.Event.onSwitchConnectionType);
							}, 1000)
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
				if (data?.newMessage)
				{
					const message = CallUtil.deepParseJSON(data?.newMessage.message);
					if (message?.onActionSent?.switchConnectionType && this.connectionType === 0)
					{
						this.connectionType = 1;
						this.eventEmitter.emit(BX.Call.Event.onSwitchConnectionType);
					}
				}
			}
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

			if (this.plainCallJwt)
			{
				this.removeCallEvents();
				try
				{
					this.plainCallJwt.hangup({
						'X-Reason': 'Fatal error',
						'X-Error': typeof (error) === 'string' ? error : error.code || error.name,
					});
				}
				catch
				{ /* nothing :) */
				}
				this.plainCallJwt = null;
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
			const userName = typeof (endpoint.userDisplayName) === 'string' ? endpoint.userDisplayName : '';
			this.log(`__onCallEndpointAdded (${userName})`);

			const processEndpoint = () => {
				const userId = parseInt(userName.slice(4));

				if (!this.peers[userId])
				{
					this.peers[userId] = this.createPeer(userId);
				}
				this.peers[userId].setEndpoint(endpoint);

				this.eventEmitter.emit(BX.Call.Event.onUserJoined, [{
					userId,
					userData: {
						[userId]: {
							name: endpoint.userName,
							avatar_hr: endpoint.avatarImage,
							avatar: endpoint.avatarImage,
						},
					}
				}]);

				this.peers[userId].setSignalingConnected(true);
				this.peers[userId].setReady(true);
				if (this.ready && !this.peers[userId].isInitiator())
				{
					this.peers[userId].sendNegotiationNeeded(false);
				}



			};

			if (userName.slice(0, 4) == 'user')
			{
				// user connected to conference
				processEndpoint();
			}
			else
			{
				endpoint.on(JNBXEndpoint.Events.InfoUpdated, () => {
					const userName = typeof (endpoint.userDisplayName) === 'string' ? endpoint.userDisplayName : '';
					this.log(`BitrixDev.EndpointEvents.InfoUpdated (${userName})`, endpoint);

					if (userName.slice(0, 4) == 'user')
					{
						// user connected to conference
						processEndpoint();
					}
				});

				this.log(`Unknown endpoint ${userName}`);
			}
		}

		__onCallEndpointsAdded(endpoints)
		{
			clearTimeout(this.waitForAnswerTimeout);

			this.eventEmitter.emit(BX.Call.Event.onUserJoined, [{
				userId: endpoints.endpoints[0].endpointId,
				userData: {
					[userId]: {
						name:  endpoints.endpoints[0].userName,
						avatar_hr:  endpoints.endpoints[0].avatarImage,
						avatar:  endpoints.endpoints[0].avatarImage,
					},
				}
			}]);

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
			})

			endpoints.endpoints[0].canChangeUI = true;
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

		__onCallMessageReceived(call, callMessage)
		{
			let message;
			try
			{
				message = CallUtil.deepParseJSON(callMessage.message);
			}
			catch (err)
			{
				this.log('Could not parse scenario message.', err);

				return;
			}

			const eventName = message.eventName;

			console.log('__onCallMessageReceived', eventName);

			switch (eventName)
			{
				case clientEvents.connectionOffer:
				{
					this._onPullEventConnectionOffer(message);

					break;
				}

				case clientEvents.sendConnectionType:
				{
					console.log('clientEvents.sendConnectionType')
					this.eventEmitter.emit(BX.Call.Event.onSwitchConnectionType);
				}

				case clientEvents.connectionAnswer:
				{
					this._onPullEventConnectionAnswer(message);

					break;
				}

				case clientEvents.negotiationNeeded:
				{
					this._onPullEventNegotiationNeeded(message);

					break;
				}

				case clientEvents.iceCandidate:
				{
					this._onPullEventIceCandidate(message);

					break;
				}

				case clientEvents.voiceStarted:
				{
					this.eventEmitter.emit(BX.Call.Event.onUserVoiceStarted, [message.senderId]);

					break;
				}

				case clientEvents.voiceStopped:
				{
					this.eventEmitter.emit(BX.Call.Event.onUserVoiceStopped, [message.senderId]);

					break;
				}

				case clientEvents.microphoneState:
				{
					this.eventEmitter.emit(BX.Call.Event.onUserMicrophoneState, [
						message.senderId,
						message.microphoneState === 'Y' || message.microphoneState,
					]);

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

				case clientEvents.videoPaused:
				{
					this._onPullEventVideoPaused(message);

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

				case 'scenarioLogUrl':
				{
					CallUtil.warn(`scenario log url: ${message.logUrl}`);

					break;
				}

				default:
				{
					this.log(`Unknown scenario event ${eventName}`);
				}

				// else if (eventName === clientEvents.cameraState)
				// {
				// 	this.#onPullEventCameraState(message);
				// }
				// else if (eventName === clientEvents.recordState)
				// {
				// 	this.#onPullEventRecordState(message);
				// }
				// else if (eventName === clientEvents.customMessage)
				// {
				// 	this.runCallback(CallEvent.onCustomMessage, {
				// 		message: message.message
				// 	})
				// }
				// else if (eventName === clientEvents.usersInvited)
				// {
				// 	this.#onPullEventUsersInvited(message);
				// }
			}
		}

		#beforeLeaveCall()
		{
			this.removeCallEvents();
			if (this.plainCallJwt)
			{
				this.plainCallJwt.hangup();
				this.plainCallJwt = null;
			}

			// stop media streams
			this.unsubscribeHardwareChanges();
			for (let tag in this.localStreams)
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
			window.removeEventListener("unload", this._onUnloadHandler);

			clearInterval(this.statsInterval);
			clearInterval(this.microphoneLevelInterval);
		};

		destroy()
		{
			this.destroyActiveCallNotification();
			this.ready = null;
			this._active = false;
			this._joinStatus = BX.Call.JoinStatus.None;
			if (this.plainCallJwt)
			{
				this.removeCallEvents();
				if (this.plainCallJwt /* .state() != "ENDED" */)
				{
					this.plainCallJwt.hangup();
				}
				this.plainCallJwt = null;
			}

			for (const userId in this.peers)
			{
				if (this.peers.hasOwnProperty(userId) && this.peers[userId])
				{
					this.peers[userId].destroy();
				}
			}
			if (this.localStream)
			{
				// MediaDevices.stopStreaming();
				this.localStream = null;
			}
			if (this.logger)
			{
				this.logger.destroy();
				this.logger = null;
			}

			clearTimeout(this.reinviteTimeout);
			clearTimeout(this.lastPingReceivedTimeout);

			this.eventEmitter.emit(BX.Call.Event.onDestroy, [{ callUuid: this.uuid }]);
			this.eventEmitter = null;
			if (this.signaling)
			{
				this.signaling.call = null;
				this.signaling = null;
			}
		}
	}

	class Peer
	{
		constructor(params = {})
		{
			this.userId = params.userId;
			this.ready = !!params.ready;
			this.calling = false;
			this.inviteTimeout = false;
			this.declined = false;
			this.busy = false;

			this.videoSender = null;
			this.audioSender = null;

			/** @var {PlainCall} this.call */
			this.call = params.call;

			this.userAgent = "";
			this.isLegacyMobile = !!params.isLegacyMobile;

			this.peerConnection = null;
			this.pendingIceCandidates = {};
			this.localIceCandidates = [];
			this.isWaitAnswer = false;
			this.offersStack = 0;

			this.trackList = {};

			this._incomingVideoTrack = null;
			this._incomingScreenTrack = null;
			Object.defineProperty(this, 'incomingVideoTrack', {
				get: () => this._incomingVideoTrack,
				set: (track) => {
					if (this._incomingVideoTrack != track)
					{
						this._incomingVideoTrack = track;
						if (this._incomingScreenTrack)
						{
							// do nothing
						}
						else
						{
							if (this._incomingVideoTrack)
							{
								this.callbacks.onStreamReceived(this._incomingVideoTrack);
							}
							else
							{
								this.callbacks.onStreamRemoved();
							}
						}
					}
				}
			});
			Object.defineProperty(this, 'incomingScreenTrack', {
				get: () => this._incomingScreenTrack,
				set: (track) => {
					if (this._incomingScreenTrack != track)
					{
						this._incomingScreenTrack = track;
						if (this._incomingScreenTrack)
						{
							this.callbacks.onStreamReceived(track);
						}
						else
						{
							if (this._incomingVideoTrack)
							{
								this.callbacks.onStreamReceived(this._incomingVideoTrack);
							}
							else
							{
								this.callbacks.onStreamRemoved();
							}
						}
					}
				}
			});

			this.callbacks = {
				onStateChanged: BX.type.isFunction(params.onStateChanged) ? params.onStateChanged : DoNothing,
				onInviteTimeout: BX.type.isFunction(params.onInviteTimeout) ? params.onInviteTimeout : DoNothing,
				onStreamReceived: BX.type.isFunction(params.onStreamReceived) ? params.onStreamReceived : DoNothing,
				onStreamRemoved: BX.type.isFunction(params.onStreamRemoved) ? params.onStreamRemoved : DoNothing,
				onRTCStatsReceived: BX.type.isFunction(params.onRTCStatsReceived) ? params.onRTCStatsReceived : DoNothing,
				onReconnecting: BX.type.isFunction(params.onReconnecting) ? params.onReconnecting : DoNothing,
				onReconnected: BX.type.isFunction(params.onReconnected) ? params.onReconnected : DoNothing,
			};

			this._onPeerConnectionIceCandidateHandler = this._onPeerConnectionIceCandidate.bind(this);
			this._onPeerConnectionIceConnectionStateChangeHandler = this._onPeerConnectionIceConnectionStateChange.bind(this);
			this._onPeerConnectionIceGatheringStateChangeHandler = this._onPeerConnectionIceGatheringStateChange.bind(this);
			this._onPeerConnectionNegotiationNeededHandler = this._onPeerConnectionNegotiationNeeded.bind(this);
			this._onPeerConnectionTrackHandler = this._onPeerConnectionTrack.bind(this);
			this._onPeerConnectionRemoveTrackHandler = this._onPeerConnectionRemoveTrack.bind(this);
			this._onPeerConnectionAddStreamHandler = this._onPeerConnectionAddStream.bind(this);
			this._onPeerConnectionRemoveStreamHandler = this._onPeerConnectionRemoveStream.bind(this);

			// debounce is important to prevent possible deadlocks in the application (this event can occur while calling setRemoteDescription)
			this._onPeerConnectionSignalingStateChangeHandler = CallUtil.debounce(this._onPeerConnectionSignalingStateChange.bind(this), 100);

			// intervals and timeouts
			this.answerTimeout = null;
			this.callingTimeout = null;
			this.connectionTimeout = null;
			this.signalingConnectionTimeout = null;
			this.candidatesTimeout = null;

			// event handlers
			this.__onEndpointRemovedHandler = this.__onEndpointRemoved.bind(this);
			this.__onEndpointRemoteMediaAddedHandler = this.__onEndpointRemoteMediaAdded.bind(this);
			this.__onEndpointRemoteMediaRemovedHandler = this.__onEndpointRemoteMediaRemoved.bind(this);

			this.connectionAttempt = 0;
		}

		setReady(ready)
		{
			if (this.ready == ready)
			{
				return;
			}
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
		}

		setDeclined(declined)
		{
			this.declined = declined;
			if (this.calling)
			{
				clearTimeout(this.callingTimeout);
				this.calling = false;
			}
			this.updateCalculatedState();
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
			this.callingTimeout = setTimeout(() => this.onInviteTimeout(true), invitePeriod);
			this.updateCalculatedState();
		}

		onInviteTimeout(internal)
		{
			clearTimeout(this.callingTimeout);
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
		notifyStreamsChanged()
		{
			const streams = this.endpoint.remoteVideoStreams || [];
			if (streams.length)
			{
				this.callbacks.onStreamReceived({
					userId : this.userId,
					stream : streams.length === 1 ? streams[0] : streams
				});
			}
			else
			{
				this.callbacks.onStreamRemoved({ userId : this.userId });
			}
		}
		setEndpoint(endpoint)
		{
			this.log(`Adding endpoint with ${endpoint.remoteVideoStreams.length} remote video streams`);

			this.setReady(true);
			this.inviteTimeout = false;
			this.declined = false;
			// ?? clearTimeout(this.connectionRestoreTimeout);
			// ?? clearTimeout(this.callingTimeout);

			if (this.endpoint)
			{
				this.removeEndpointEventHandlers();
				this.endpoint = null;
			}

			this.endpoint = endpoint;
			this.notifyStreamsChanged();
			// this.callbacks.onStreamReceived({
			// 	userId: this.userId,
			// 	stream: endpoint.remoteVideoStreams[0],
			// });

			this.updateCalculatedState();
			this.bindEndpointEventHandlers();
		}
		bindEndpointEventHandlers()
		{
			this.endpoint.on(JNBXEndpoint.Events.Removed, this.__onEndpointRemovedHandler);
			this.endpoint.on(JNBXEndpoint.Events.VideoStreamAdded, this.__onEndpointRemoteMediaAddedHandler);
			this.endpoint.on(JNBXEndpoint.Events.VideoStreamRemoved, this.__onEndpointRemoteMediaRemovedHandler);
		}

		removeEndpointEventHandlers()
		{
			this.endpoint.off(JNBXEndpoint.Events.Removed, this.__onEndpointRemovedHandler);
			this.endpoint.off(JNBXEndpoint.Events.VideoStreamAdded, this.__onEndpointRemoteMediaAddedHandler);
			this.endpoint.off(JNBXEndpoint.Events.VideoStreamRemoved, this.__onEndpointRemoteMediaRemovedHandler);
		}

		setSignalingConnected(signalingConnected)
		{

		}

		setUserAgent(userAgent)
		{
			this.userAgent = userAgent;
			this.isLegacyMobile = userAgent === "Bitrix Legacy Mobile";
		}

		isReady()
		{
			return this.ready;
		}

		isInitiator()
		{
			return this.call && (this.call.userId < this.userId);
		}

		updateCalculatedState()
		{
			var calculatedState = this.calculateState();

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
			// ?? if (this.endpoint)
			// ?? {
			// ?? 	return BX.Call.UserState.Connected;
			// ?? }

			if (this.peerConnection)
			{
				if (this.peerConnection.iceConnectionState === "connected" || this.peerConnection.iceConnectionState === "completed")
				{
					return BX.Call.UserState.Connected;
				}

				return BX.Call.UserState.Connecting;
			}
			else
			{
				if (this.failureReason)
				{
					return BX.Call.UserState.Failed;
				}
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
				var iceConnectionState = this.peerConnection.iceConnectionState;
				if (iceConnectionState == "checking" || iceConnectionState == "connected" || iceConnectionState == "completed")
				{
					return true;
				}
			}

			return false;
		}

		isRenegotiationSupported()
		{
			return true;
		}

		getSignaling()
		{
			return this.call ? this.call.signaling : null;
		}

		log()
		{
			this.call && this.call.log.apply(this.call, arguments);
		}

		sendIceCandidates()
		{
			if (this.candidatesTimeout)
			{
				clearTimeout(this.candidatesTimeout);
				this.candidatesTimeout = null;
			}
			if (!this.call)
			{
				return;
			}

			this.log("User " + this.userId + ": sending ICE candidates due to the timeout");

			if (this.localIceCandidates.length > 0)
			{
				this.getSignaling().sendIceCandidate({
					userId: this.userId,
					connectionId: this.peerConnection._id,
					candidates: this.localIceCandidates,
				});
				this.localIceCandidates = [];
			}
			else
			{
				this.log("User " + this.userId + ": ICE candidates pool is empty");
			}
		}

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

				let connectionId = callEngine.getUuidv4();
				this._createPeerConnection(connectionId);
			}

			this.updateOutgoingTracks();

			if (!skipOffer)
			{
				this.offersStack++;
				this.createAndSendOffer();
			}
		}

		updateOutgoingTracks()
		{
			if (!this.peerConnection)
			{
				return;
			}

			let audioTrack;
			let videoTrack;

			if (this.call.localStream && this.call.localStream.getAudioTracks().length > 0)
			{
				audioTrack = this.call.localStream.getAudioTracks()[0];
			}

			if (this.call.videoEnabled && this.call.localStream && this.call.localStream.getVideoTracks().length > 0)
			{
				videoTrack = this.call.localStream.getVideoTracks()[0];
			}

			let tracksToSend = [];

			if (audioTrack)
			{
				tracksToSend.push(audioTrack.id + ' (audio)')
			}
			if (videoTrack)
			{
				tracksToSend.push(videoTrack.id + ' (' + videoTrack.kind + ')');
			}

			if (this.videoSender && videoTrack)
			{
				// do nothing >:-)
			}
			if (!this.videoSender && videoTrack)
			{
				this.videoSender = this.peerConnection.addTrack(videoTrack, this.call.localStream);
			}
			if (this.videoSender && !videoTrack)
			{
				this.peerConnection.removeTrack(this.videoSender);
				this.videoSender = null;
			}

			if (this.audioSender && audioTrack)
			{
				// do nothing >:-)
			}
			if (!this.audioSender && audioTrack)
			{
				this.audioSender = this.peerConnection.addTrack(audioTrack, this.call.localStream);
			}
			if (this.audioSender && !audioTrack)
			{
				this.peerConnection.removeTrack(this.audioSender);
				this.audioSender = null;
			}
		}

		getSenderMid(rtpSender)
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

		replaceMedia()
		{
			console.log('replaceMedia');
			if (!this.isReady())
			{
				return;
			}
			if (this.isRenegotiationSupported())
			{
				this.updateOutgoingTracks();
				this.offersStack++;
				this.createAndSendOffer();
			}
			else
			{
				this.reconnect();
			}
		}

		setConnectionOffer(connectionId, sdp, trackList)
		{
			console.log('setConnectionOffer', this.call.isReady(), this.isReady(), !!this.peerConnection, this.peerConnection?._id, connectionId, trackList);
			this.log("User " + this.userId + ": received connection offer for connection " + connectionId);

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
				this.trackList = CallUtil.array_flip(trackList);
			}

			if (this.peerConnection)
			{
				if (this.peerConnection._id !== connectionId)
				{
					this._destroyPeerConnection();
					this._createPeerConnection(connectionId);
				}
			}
			else
			{
				this._createPeerConnection(connectionId);
			}

			this.applyOfferAndSendAnswer(sdp);
		};

		createAndSendOffer(config)
		{
			if (this.offersStack === 0 || this.isWaitAnswer)
			{
				return;
			}

			this.offersStack--;
			this.isWaitAnswer = true;

			const connectionConfig = {};

			const safeFields = {
				"offerToReceiveAudio": "true",
				"offerToReceiveVideo": "true",
			};

			for (const key in safeFields) {
				connectionConfig[key] = safeFields[key];
			}

			this.peerConnection.createOffer(connectionConfig).then((offer) =>
			{
				this.log("User " + this.userId + ": Created connection offer.");
				this.log("Applying local description");
				this.pendingLocalDescription = offer;
				this.sendOffer();
				//return this.peerConnection.setLocalDescription(offer);
			});/*.then(() =>
			{
				this.sendOffer();
			})*/
		};

		sendOffer()
		{
			let connectionId = this.peerConnection._id;
			clearTimeout(this.connectionOfferReplyTimeout);
			this.connectionOfferReplyTimeout = setTimeout(() => this._onConnectionOfferReplyTimeout(connectionId), signalingWaitReplyPeriod);

			this.getSignaling().sendConnectionOffer({
				userId: this.userId,
				connectionId: connectionId,
				sdp: this.pendingLocalDescription.sdp,
				userAgent: "Bitrix Mobile",
				tracks: {
					audio: this.getSenderMid(this.audioSender),
					video: this.getSenderMid(this.videoSender),
				},
			});
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
					this.offersStack++;
					this.createAndSendOffer({ iceRestart: true });
				}
			}
			else
			{
				this.sendMedia();
			}
		}

		sendNegotiationNeeded(restart)
		{
			restart = restart === true;
			clearTimeout(this.negotiationNeededReplyTimeout);
			this.negotiationNeededReplyTimeout = setTimeout(() => this._onNegotiationNeededReplyTimeout(), signalingWaitReplyPeriod);

			let params = {
				userId: this.userId,
			};
			if (restart)
			{
				params.restart = true;
			}

			this.getSignaling().sendNegotiationNeeded(params);
		};

		applyOfferAndSendAnswer(sdp)
		{
			console.log('applyOfferAndSendAnswer start', this.userId);
			let sessionDescription = {
				type: "offer",
				sdp: sdp,
			};

			this.log("User: " + this.userId + "; Applying remote offer");
			this.log("User: " + this.userId + "; Peer ice connection state ", this.peerConnection.iceConnectionState);

			this.peerConnection.setRemoteDescription(sessionDescription).then(() =>
			{
				if (this.peerConnection.iceConnectionState === "new")
				{
					this.sendMedia(true)
				}

				return this.peerConnection.createAnswer();
			}).then((answer) =>
			{
				console.log('applyOfferAndSendAnswer answer created');
				this.log("Created connection answer.");
				this.log("Applying local description.");
				return this.peerConnection.setLocalDescription(answer);
			}).then(() =>
			{
				console.log('applyOfferAndSendAnswer answer set');
				this.applyPendingIceCandidates();
				this.getSignaling().sendConnectionAnswer({
					userId: this.userId,
					connectionId: this.peerConnection._id,
					sdp: this.peerConnection.localDescription().sdp,
					userAgent: "Bitrix Mobile",
					tracks: {
						audio: this.getSenderMid(this.audioSender),
						video: this.getSenderMid(this.videoSender),
					},
				});
			}).catch((e) =>
			{
				console.log('applyOfferAndSendAnswer error');
				this.failureReason = e.toString();
				this.updateCalculatedState();
				this.log("Could not apply remote offer", e);
				console.error("Could not apply remote offer", e);
			});
		};

		setConnectionAnswer(connectionId, sdp, trackList)
		{
			if (!this.peerConnection)
			{
				return;
			}

			clearTimeout(this.connectionOfferReplyTimeout);

			if (this.peerConnection._id != connectionId)
			{
				this.log("Could not apply answer, for unknown connection " + connectionId);
				return;
			}

			if (trackList)
			{
				this.trackList = CallUtil.array_flip(trackList);
			}

			let sessionDescription = {
				type: "answer",
				sdp: sdp,
			};

			if (this.peerConnection.signalingState !== "have-local-offer" && !this.pendingLocalDescription)
			{
				this.log("Could not apply answer, wrong peer connection signaling state " + this.peerConnection.signalingState);
				return;
			}

			this.log("User: " + this.userId + "; Applying remote answer");

			this.maybeSetPendingLocalOffer()
				.then(() => {
					return this.peerConnection.setRemoteDescription(sessionDescription);
				})
				.then(() => {
					this.applyPendingIceCandidates();
					this.createAndSendOffer();
				})
				.catch((e) => {
					this.failureReason = e.toString();
					this.updateCalculatedState();
					this.log(e);
				})
				.finally(() => {
					this.isWaitAnswer = false;
				});
		}

		maybeSetPendingLocalOffer()
		{
			return new Promise((resolve, reject) =>
			{
				if (this.pendingLocalDescription)
				{
					this.peerConnection.setLocalDescription(this.pendingLocalDescription)
						.then(() =>
						{
							this.pendingLocalDescription = null;
							resolve();
						})
						.catch(err => reject(err));
				}
				else
				{
					resolve();
				}
			});
		}

		addIceCandidate(connectionId, candidate)
		{
			if (!this.peerConnection)
			{
				return;
			}

			if (this.peerConnection._id != connectionId)
			{
				this.log("Error: Candidate for unknown connection " + connectionId);
				return;
			}

			if (this.peerConnection.remoteDescription() && this.peerConnection.remoteDescription().type)
			{
				this.peerConnection.addIceCandidate(candidate).then(() =>
				{
					this.log("User: " + this.userId + "; Added remote ICE candidate: " + (candidate ? candidate.candidate : candidate));
				}).catch((e) =>
				{
					this.log(e);
				});
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
			if (!this.peerConnection || !this.peerConnection.remoteDescription().type)
			{
				return;
			}

			var connectionId = this.peerConnection._id;
			if (BX.type.isArray(this.pendingIceCandidates[connectionId]))
			{
				this.pendingIceCandidates[connectionId].forEach((candidate) =>
				{
					this.peerConnection.addIceCandidate(candidate).then(() =>
					{
						this.log("User: " + this.userId + "; Added remote ICE candidate: " + (candidate ? candidate.candidate : candidate));
					});
				});

				this.pendingIceCandidates[connectionId] = [];
			}
		};

		updateCandidatesTimeout()
		{
			if (this.candidatesTimeout)
			{
				clearTimeout(this.candidatesTimeout);
			}

			this.candidatesTimeout = setTimeout(this.sendIceCandidates.bind(this), 500);
		}

		reconnect()
		{
			clearTimeout(this.reconnectAfterDisconnectTimeout);
			this.connectionAttempt++;
			if (!this.call)
			{
				return;
			}

			if (this.connectionAttempt > 3)
			{
				this.log("Error: Too many reconnection attempts, giving up");
				this.failureReason = "Could not connect to user in time";
				this._destroyPeerConnection();
				this.updateCalculatedState();
				return;
			}

			if (!this.wasIceConnectionStateDisconnected)
			{
				this.callbacks.onReconnecting();
			}

			console.trace("Trying to restore ICE connection. Attempt " + this.connectionAttempt);
			this.log("Trying to restore ICE connection. Attempt " + this.connectionAttempt);
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

		_createPeerConnection(id)
		{
			const turnServer = BX.componentParameters.get("turnServer", "");
			const turnServerLogin = BX.componentParameters.get("turnServerLogin", "");
			const turnServerPassword = BX.componentParameters.get("turnServerPassword", "");
			let connectionConfig = {
				"iceServers": [
					{
						urls: ["stun:" + turnServer],
						username: turnServerLogin,
						credential: turnServerPassword,
					},
					{
						urls: ["turn:" + turnServer],
						username: turnServerLogin,
						credential: turnServerPassword,
					},
				],
				//iceTransportPolicy: 'relay'
			};

			this.log("creating peer connection " + id);

			this.localIceCandidates = [];

			this.peerConnection = new RTCPeerConnection(connectionConfig);
			this.peerConnection._id = id;

			this.peerConnection.on(JNRTCPeerConnection.Events.IceCandidate, this._onPeerConnectionIceCandidateHandler);
			this.peerConnection.on(JNRTCPeerConnection.Events.IceConnectionStateChange, this._onPeerConnectionIceConnectionStateChangeHandler);
			this.peerConnection.on(JNRTCPeerConnection.Events.IceGatheringStateChange, this._onPeerConnectionIceGatheringStateChangeHandler);
			this.peerConnection.on(JNRTCPeerConnection.Events.NegotiationNeeded, this._onPeerConnectionNegotiationNeededHandler);
			this.peerConnection.on(JNRTCPeerConnection.Events.Track, this._onPeerConnectionTrackHandler);
			this.peerConnection.on(JNRTCPeerConnection.Events.RemoveTrack, this._onPeerConnectionRemoveTrackHandler);
			this.peerConnection.on(JNRTCPeerConnection.Events.AddStream, this._onPeerConnectionAddStreamHandler);
			this.peerConnection.on(JNRTCPeerConnection.Events.RemoveStream, this._onPeerConnectionRemoveStreamHandler);
			this.peerConnection.on(JNRTCPeerConnection.Events.SignalingStateChange, this._onPeerConnectionSignalingStateChangeHandler);
		}

		_destroyPeerConnection()
		{
			if (!this.peerConnection)
			{
				return;
			}

			var connectionId = this.peerConnection._id;

			this.log("User " + this.userId + ": Destroying peer connection " + connectionId);

			this.peerConnection.off(JNRTCPeerConnection.Events.IceCandidate, this._onPeerConnectionIceCandidateHandler);
			this.peerConnection.off(JNRTCPeerConnection.Events.IceConnectionStateChange, this._onPeerConnectionIceConnectionStateChangeHandler);
			this.peerConnection.off(JNRTCPeerConnection.Events.IceGatheringStateChange, this._onPeerConnectionIceGatheringStateChangeHandler);
			this.peerConnection.off(JNRTCPeerConnection.Events.NegotiationNeeded, this._onPeerConnectionNegotiationNeededHandler);
			this.peerConnection.off(JNRTCPeerConnection.Events.Track, this._onPeerConnectionTrackHandler);
			this.peerConnection.off(JNRTCPeerConnection.Events.RemoveStream, this._onPeerConnectionRemoveStreamHandler);
			this.peerConnection.off(JNRTCPeerConnection.Events.SignalingStateChange, this._onPeerConnectionSignalingStateChangeHandler);

			this.localIceCandidates = [];
			if (this.pendingIceCandidates[connectionId])
			{
				delete this.pendingIceCandidates[connectionId];
			}

			this.peerConnection.close();
			this.peerConnection = null;

			this.videoSender = null;
			this.audioSender = null;
			this.incomingVideoTrack = null;
			this.incomingScreenTrack = null;
		}

		_hasIncomingVideo()
		{
			if (!this.peerConnection)
			{
				return false;
			}
			return this.peerConnection.getTransceivers().some((tr) =>
			{
				return (tr.currentDirection == "sendrecv" || tr.currentDirection == "recvonly") && (tr.receiver && tr.receiver.track && tr.receiver.track.kind === "video");
			});
		};

		_onPeerConnectionIceCandidate(candidate)
		{
			this.log("User " + this.userId + ": ICE candidate discovered. Candidate: " + JSON.stringify(candidate));

			if (candidate)
			{
				this.getSignaling().getPublishingState().then(result =>
				{
					if (result)
					{
						this.getSignaling().sendIceCandidate({
							userId: this.userId,
							connectionId: this.peerConnection._id,
							candidates: [candidate],
						});
					}
					else
					{
						this.localIceCandidates.push(candidate);
						this.updateCandidatesTimeout();
					}
				}).catch(error => console.error(error));
			}
		}

		_onPeerConnectionIceConnectionStateChange()
		{
			console.log('_onPeerConnectionIceConnectionStateChange', this.peerConnection.iceConnectionState);
			this.log("User " + this.userId + ": ICE connection state changed. New state: " + this.peerConnection.iceConnectionState);

			if (this.peerConnection.iceConnectionState === "connected" || this.peerConnection.iceConnectionState === "completed")
			{
				this.connectionAttempt = 0;
				this.failureReason = "";

				if (this._reconnectionEventCount > 0)
				{
					this.callbacks.onReconnected();
				}

				clearTimeout(this.reconnectAfterDisconnectTimeout);
				this.wasIceConnectionStateDisconnected = false;
			}
			else if (this.peerConnection.iceConnectionState === "failed")
			{
				this.log("ICE connection failed. Trying to restore connection immediately");
				this.reconnect();
			}
			else if (this.peerConnection.iceConnectionState === "disconnected")
			{
				this.wasIceConnectionStateDisconnected = true;
			}

			this.updateCalculatedState();
		}

		_onPeerConnectionIceGatheringStateChange()
		{

		}

		_onPeerConnectionNegotiationNeeded()
		{
			this.log("_onPeerConnectionNegotiationNeeded");

			/*if (this.isInitiator())
			{
				this.offersStack++;
				this.createAndSendOffer();
			}
			else
			{
				this.sendNegotiationNeeded();
			}*/
		}

		_getTrackMid(trackId)
		{
			if (!this.peerConnection)
			{
				return null;
			}
			let tr = this.peerConnection.getTransceivers().find(
				tr => tr.receiver && tr.receiver.track && tr.receiver.track.id == trackId
			);
			if (!tr)
			{
				return null;
			}
			return tr.mid;
		}

		_onPeerConnectionTrack(e)
		{
			let {track} = e;

			this.log("_onPeerConnectionTrack; kind: ", track.kind, "id: ", track.id);
		}

		_onPeerConnectionRemoveTrack(e)
		{
			let {track} = e;
			this.call.log("_onPeerConnectionRemoveTrack; kind: ", track.kind, "id: ", track.id);
		}

		_onPeerConnectionAddStream(e)
		{
			this.call.log("_onPeerConnectionAddStream", e);
		}

		_onPeerConnectionRemoveStream(e)
		{
			this.call.log("_onPeerConnectionRemoveStream", e);
		}

		_onPeerConnectionSignalingStateChange()
		{
			let screenTrack = null;
			let videoTrack = null;
			if (this.peerConnection.signalingState == "stable")
			{
				this.peerConnection.getTransceivers().forEach(tr => {
					if (
						(tr.currentDirection == "sendrecv" || tr.currentDirection == "recvonly")
						&& (tr.receiver && tr.receiver.track)
					)
					{
						let track = tr.receiver.track;
						console.log(`track received. mid: ${tr.mid} kind: ${track.kind}`);
						if (track.kind === 'audio')
						{
							// do nothing
						}
						if (track.kind === 'video')
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
				})

				this.call.eventEmitter.emit(BX.Call.Event.onCallConnected, []);
			}

			// if we set screen track before video track in Android after screen track was deleted on the other side
			// we will get "MediaStreamTrack has been disposed" error
			if (screenTrack)
			{
				this.incomingScreenTrack = screenTrack;
				this.incomingVideoTrack = videoTrack;
			}
			else
			{
				this.incomingVideoTrack = videoTrack;
				this.incomingScreenTrack = screenTrack;
			}
		}

		stopSignalingTimeout()
		{
			clearTimeout(this.signalingConnectionTimeout);
		}

		refreshSignalingTimeout()
		{
			clearTimeout(this.signalingConnectionTimeout);
			this.signalingConnectionTimeout = setTimeout(this._onLostSignalingConnection.bind(this), signalingConnectionRefreshPeriod);
		}

		_onLostSignalingConnection()
		{
			this.setSignalingConnected(false);
		}

		_onConnectionOfferReplyTimeout(connectionId)
		{
			console.log('_onConnectionOfferReplyTimeout', connectionId);
			this.log("did not receive connection answer for connection " + connectionId);
			this.reconnect();
		}

		_onNegotiationNeededReplyTimeout()
		{
			console.log('_onNegotiationNeededReplyTimeout');
			this.log("did not receive connection offer in time");
			this.reconnect();
		};

		__onEndpointRemoved(e)
		{
			this.log('Endpoint removed');

			if (this.endpoint)
			{
				this.removeEndpointEventHandlers();
				this.endpoint = null;
			}

			// ?? if (this.ready)
			// ?? {
			// ?? 	this.waitForConnectionRestore();
			// ?? }

			this.updateCalculatedState();
		}

		 __onEndpointRemoteMediaAdded(e)
		{
			this.log('RemoteMediaAdded', e);
			this.notifyStreamsChanged();
			this.updateCalculatedState();
		}

		__onEndpointRemoteMediaRemoved(e)
		{
			this.log('RemoteMediaRemoved', e);
			this.notifyStreamsChanged();
			this.updateCalculatedState();
		}

		disconnect()
		{
			clearTimeout(this.reconnectAfterDisconnectTimeout);
			this._destroyPeerConnection();
		}

		destroy()
		{
			this._destroyPeerConnection();

			clearTimeout(this.answerTimeout);
			this.answerTimeout = null;

			clearTimeout(this.connectionTimeout);
			this.connectionTimeout = null;

			clearTimeout(this.signalingConnectionTimeout);
			this.signalingConnectionTimeout = null;

			clearTimeout(this.reconnectAfterDisconnectTimeout);
			this.reconnectAfterDisconnectTimeout = null;

			this.callbacks.onStateChanged = DoNothing;
			this.callbacks.onStreamReceived = DoNothing;
			this.callbacks.onStreamRemoved = DoNothing;
			this.call = null;
		}

	}

	class Signaling
	{
		/**
		 * @param {object} params
		 * @param {PlainCall} params.call
		 */
		constructor(params)
		{
			this.call = params.call;
		}

		isIceTricklingAllowed()
		{
			return this.isPublishingSupported();
		};

		getPublishingState()
		{
			return BX.PULL.getPublishingState();
		}

		inviteUsers(data)
		{
			return this.__runRestAction(ajaxActions.invite, data);
		};

		sendUsersInvited(data)
		{
			this.__sendMessage(clientEvents.usersInvited, data);
		};

		sendConnectionOffer(data)
		{
			this.__sendMessage(clientEvents.connectionOffer, data);
		};

		sendConnectionAnswer(data)
		{
			this.__sendMessage(clientEvents.connectionAnswer, data);
		};

		sendIceCandidate(data)
		{
			this.__sendMessage(clientEvents.iceCandidate, data);
		};

		sendNegotiationNeeded(data)
		{
			this.__sendMessage(clientEvents.negotiationNeeded, data);
		};

		sendVoiceStarted(data)
		{
			this.__sendMessage(clientEvents.voiceStarted, data);
		};

		sendVoiceStopped(data)
		{
			this.__sendMessage(clientEvents.voiceStopped, data);
		};

		sendMicrophoneState(users, microphoneState)
		{
			this.__sendMessage(clientEvents.microphoneState,
				{
					userId: users,
					microphoneState: microphoneState,
				},
				0,
			);
		};

		sendCameraState(users, cameraState)
		{
			this.__sendMessage(clientEvents.cameraState,
				{
					userId: users,
					cameraState: cameraState,
				},
				0,
			);
		};

		sendVideoPaused(users, videoPaused)
		{
			this.__sendMessage(clientEvents.videoPaused,
				{
					userId: users,
					videoPaused: videoPaused,
				},
				0,
			);
		};

		sendRepeatAnswer(data)
		{
			this.__sendMessage(clientEvents.repeatAnswer, data);
		}

		sendUserInviteTimeout(data)
		{
			this.__sendMessage(clientEvents.userInviteTimeout, data);
		};

		sendSwitchConnectionType(data)
		{
			if (!this.call.plainCallJwt)
			{
				return;
			}

			// TODO: delete after testing
			this.__sendMessage(clientEvents.sendConnectionType, data);

			// this.call.plainCallJwt.switchCallType(data);
		}

		sendSwitchCallType(data)
		{
			if (!this.call.plainCallJwt)
			{
				return;
			}

			this.call.plainCallJwt.switchCallType(data);
		}

		__sendMessage(eventName, data) {

			if (!this.call.plainCallJwt)
			{
				return;
			}

			if (!BX.type.isPlainObject(data))
			{
				data = {};
			}

			data.eventName = eventName;
			data.requestId = callEngine.getUuidv4();
			data.senderId = this.call.userId;

			const formattedData = CallUtil.stringifyObjectValues(data);
			const dataToSend = CallUtil.isIos() ? formattedData : data;

			try
			{
				this.call.plainCallJwt.sendMessage(JSON.stringify(dataToSend));
			}
			catch (e)
			{
				console.log('__sendMessage error', e);
			}
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

			this.call.log("Sending ajax-based signaling event " + signalName + "; " + JSON.stringify(data));
			return callEngine.getRestClient().callMethod(signalName, data).catch(function (e)
			{
				console.error(e);
			});
		};
	}

	module.exports = {
		PlainCallJwt,
	};
});
