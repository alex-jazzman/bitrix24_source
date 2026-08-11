import { Hardware } from './call_hardware';
import { removeUdpFromSdp } from './sdk/helpers/sdp';
import { MediaStreamsKinds, MONITORING_EVENTS_NAME_LIST, LOG_LEVEL } from './sdk/const';

export class MediaServer
{
	constructor(config)
	{
		this.id = Number(config.id);
		this.isConnected = false;
		this.isPublishing = config.isPublishing;
		this.iceServers = config.iceServers;
		this.peerConnectionFailed = false;
		this.publisherPeerConnection = null;
		this.subscriberPeerConnection = null;
		this.peerConnectionAbortController = null;
		this.previousPeerConnections = [];
		this.isWaitingAnswer = false;
		this.offersStack = 0;
		this.pendingOffer = null;
		this.pendingCandidates = {
			publisher: [],
			subscriber: [],
		};
		this.events = new Map();

		this.publicationParams = {
			videoCodec: 'vp8',
			audioCodec: 'opus',
		};
		this.trackActivity = {};
		this.trackToUpdateEncodings = null;

		this.sendersProcesses = {};
		this.savedSenderEncodings = {};

		this.callStatsInterval = null;
		this.statsTimeout = 3000;
	}

	updateConfig(config)
	{
		if ('isPublishing' in config)
		{
			this.isPublishing = config.isPublishing;
		}

		if ('iceServers' in config)
		{
			this.iceServers = config.iceServers;
		}
	}

	connect()
	{
		if (this.isConnected)
		{
			return;
		}
		this.isConnected = true;
		this.#createPeerConnections();
	}

	disconnect()
	{
		this.#beforeDisconnect();
		this.#destroyPeerConnections();

		this.isConnected = false;
	}

	deactivate()
	{
		this.isConnected = false;
		if (this.publisherPeerConnection)
		{
			this.previousPeerConnections.push(this.publisherPeerConnection);
			this.publisherPeerConnection = null;
		}

		if (this.subscriberPeerConnection)
		{
			this.previousPeerConnections.push(this.subscriberPeerConnection);
			this.subscriberPeerConnection = null;
		}
	}

	addOffer(data)
	{
		this.#offerHandler(data);
	}

	addAnswer(data)
	{
		this.#answerHandler(data);
	}

	addIceCandidate(data)
	{
		this.#iceCandidateHandler(data);
	}

	async addTrack(mediaStreamKind, mediaStreamTrack, streamQualityOptions = {})
	{
		return new Promise(async (resolve, reject) => {
			try
			{
				if (!this.publisherPeerConnection)
				{
					this.#log(`Publishing a track with kind ${mediaStreamKind} before a peer connection was created, ignoring`, LOG_LEVEL.ERROR);
					throw new Error('RTCPeerConnection not established');
				}

				this.#log(`Start publishing a track with kind ${mediaStreamKind}`);

				for (const keys in streamQualityOptions)
				{
					this.publicationParams[keys] = streamQualityOptions[keys];
				}

				mediaStreamTrack.source = mediaStreamKind;

				const sender = this.#getSender(mediaStreamKind);

				if (sender)
				{
					await sender.replaceTrack(mediaStreamTrack);
					if (mediaStreamKind === MediaStreamsKinds.Camera && this.publicationParams.videoSimulcast)
					{
						await this.#updateVideoEncodings(sender, mediaStreamTrack);
					}
					this.#log(`Publishing a track with kind ${mediaStreamKind} via replace track succeeded`);
					resolve(true);

					return;
				}

				const addTrackSignal = {
					cid: mediaStreamTrack.id,
					source: mediaStreamKind,
				};
				const transceiverOptions = {
					direction: 'sendonly',
				};

				if (mediaStreamKind === MediaStreamsKinds.Camera)
				{
					const width = mediaStreamTrack.getSettings().width;
					const height = mediaStreamTrack.getSettings().height;
					addTrackSignal.type = 'VIDEO';
					addTrackSignal.width = width;
					addTrackSignal.height = height;

					if (this.publicationParams.videoSimulcast)
					{
						const encodings = this.#getEncodingsFromVideoWidth(width);
						transceiverOptions.sendEncodings = mediaStreamTrack.sendEncodings || encodings;
						addTrackSignal.layers = this.#getLayersFromEncodings(width, height, encodings);
					}

					const transceiver = this.publisherPeerConnection.addTransceiver(mediaStreamTrack, transceiverOptions);

					if (this.publicationParams.videoSimulcast)
					{
						this.trackToUpdateEncodings = mediaStreamTrack;
					}
					else
					{
						this.setBitrate(this.publicationParams.videoBitrate, mediaStreamKind);
					}

					this.#setCodec(transceiver);
					this.#triggerEvents('addTrack', [this.id, addTrackSignal, mediaStreamTrack.id, mediaStreamKind]);
				}
				else if (
					mediaStreamKind === MediaStreamsKinds.Microphone
					|| mediaStreamKind === MediaStreamsKinds.ScreenAudio
				)
				{
					this.publisherPeerConnection.addTransceiver(mediaStreamTrack, transceiverOptions);
					this.#triggerEvents('addTrack', [this.id, addTrackSignal, mediaStreamTrack.id, mediaStreamKind]);
				}
				else if (mediaStreamKind === MediaStreamsKinds.Screen)
				{
					this.publisherPeerConnection.addTransceiver(mediaStreamTrack, transceiverOptions);
					const width = mediaStreamTrack.getSettings().width;
					const height = mediaStreamTrack.getSettings().height;

					addTrackSignal.type = 'VIDEO';
					addTrackSignal.width = width;
					addTrackSignal.height = height;

					this.#triggerEvents('addTrack', [this.id, addTrackSignal, mediaStreamTrack.id, mediaStreamKind]);
				}

				this.offersStack++;
				await this.#sendOffer();
				resolve(false);
			}
			catch (e)
			{
				reject(e);
			}
		});
	}

	async replaceTrack(mediaStreamKind, mediaStreamTrack)
	{
		const sender = this.#getSender(mediaStreamKind);
		if (sender)
		{
			this.#log(`Have sender for a track with kind ${mediaStreamKind}, start replacing track`);
			await sender.replaceTrack(mediaStreamTrack);
			if (mediaStreamKind === MediaStreamsKinds.Camera)
			{
				await this.#updateVideoEncodings(sender, mediaStreamTrack);
			}
		}
	}

	async removeTrack(mediaStreamKind)
	{
		const sender = this.#getSender(mediaStreamKind);

		if (sender)
		{
			this.publisherPeerConnection.removeTrack(sender);

			this.offersStack++;
			await this.#sendOffer();
			this.#log(`Unpublishing a track with kind ${mediaStreamKind} succeeded`);
		}
		else
		{
			this.#log(`Unpublishing a track with kind ${mediaStreamKind} failed: has no sender for a track`, LOG_LEVEL.ERROR);
		}
	}

	async setBitrate(bitrate, mediaStreamKind)
	{
		this.#log('Setting bitrate started');
		const isSimulcast = mediaStreamKind === MediaStreamsKinds.Camera && this.publicationParams.videoSimulcast;
		const sender = this.#getSender(mediaStreamKind);

		if (sender)
		{
			const params = sender.getParameters();
			if (!params || !params.encodings || params.encodings.length === 0)
			{
				this.#log('Setting bitrate failed: has no encodings in the sender parameters', LOG_LEVEL.WARNING);
			}
			else
			{
				const encodings = {};
				params.encodings.forEach((encoding) => {
					encodings[encoding.rid] = {};
					encodings[encoding.rid].maxBitrate = isSimulcast
						? (bitrate < this.publicationParams.videoBitrate[encoding.rid] ? bitrate : this.publicationParams.videoBitrate[encoding.rid])
						: bitrate;
				});

				try
				{
					await this.#updateSender(sender, encodings);
					this.#log('Setting bitrate succeeded');
				}
				catch (e)
				{
					this.#log(`Setting bitrate failed: ${e}`, LOG_LEVEL.WARNING);
				}
			}
		}
	}

	changeTrackActivity(mediaStreamKind: number, isActive: boolean): void
	{
		this.trackActivity[mediaStreamKind] = isActive;
		const sender: ?RTCRtpSender = this.#getSender(mediaStreamKind);

		if (!sender)
		{
			return;
		}

		const params: ?RTCRtpSendParameters = sender.getParameters();

		if (params && params?.encodings?.length > 0)
		{
			const encodings: any = {};
			const isVideoTrack = [MediaStreamsKinds.Camera, MediaStreamsKinds.Screen].includes(mediaStreamKind);
			params.encodings.forEach((encoding) => {
				if (isVideoTrack)
				{
					encodings[encoding.rid] = {};
					encodings[encoding.rid].active = isActive;
				}
				else
				{
					encodings.active = isActive;
				}
			});

			this.#updateSender(sender, encodings);
		}
	}

	async changeLayersAvailability(layers, track): Promise<void>
	{
		const sender: RTCRtpSender | null = this.#getSender(track.source);
		if (!sender || !track)
		{
			return;
		}

		const params = sender.getParameters();

		if (params && params?.encodings?.length > 0)
		{
			const encodings = {};
			params.encodings.forEach((encoding) => {
				encodings[encoding.rid] = {};
				encodings[encoding.rid].active = layers[encoding.rid];
			});

			this.#updateSender(sender, encodings);
		}
	}

	async updateVideoEncodings()
	{
		const sender = this.#getSender(MediaStreamsKinds.Camera);
		if (sender)
		{
			await this.#updateVideoEncodings(sender);
		}
	}

	on(eventType, handler)
	{
		this.events.set(eventType, handler);

		return this;
	}

	off(eventType)
	{
		if (this.events.has(eventType))
		{
			return this.events.delete(eventType);
		}

		return this;
	}

	#triggerEvents(eventType, args)
	{
		if (this.events.has(eventType))
		{
			const event = this.events.get(eventType);
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

	#log(message, level)
	{
		message += `; (media server #${this.id})`;
		this.#triggerEvents('log', [message, level]);
	}

	#sendSignal(signal)
	{
		this.#triggerEvents('signal', [signal, this.id]);
	}

	#createPeerConnections()
	{
		this.#destroyPeerConnections();

		this.peerConnectionAbortController = new AbortController();

		const config = {};
		if (this.iceServers)
		{
			config.iceServers = this.iceServers;
		}

		this.publisherPeerConnection = new RTCPeerConnection(config);
		this.publisherPeerConnection.addEventListener('icecandidate', (event) => this.#onIceCandidate(event), {
			signal: this.peerConnectionAbortController.signal,
		});
		this.publisherPeerConnection.addEventListener('icecandidateerror', (event) => this.#onIceCandidateError(event), {
			signal: this.peerConnectionAbortController.signal,
		});
		this.publisherPeerConnection.addEventListener('connectionstatechange', () => this.#onConnectionStateChange(), {
			signal: this.peerConnectionAbortController.signal,
		});
		this.publisherPeerConnection.addEventListener('iceconnectionstatechange', () => this.#onIceconnectionstatechange(), {
			signal: this.peerConnectionAbortController.signal,
		});
		this.publisherPeerConnection.addEventListener('icegatheringstatechange', (event) => this.#onIceGatheringStateChange(event), {
			signal: this.peerConnectionAbortController.signal,
		});
		this.publisherPeerConnection.addEventListener('signalingstatechange', (event) => this.#onSignalingStateChange(event), {
			signal: this.peerConnectionAbortController.signal,
		});
		this.publisherPeerConnection.addEventListener('negotiationneeded', () => this.#onNegotiationNeeded(), {
			signal: this.peerConnectionAbortController.signal,
		});

		this.subscriberPeerConnection = new RTCPeerConnection(config);
		this.subscriberPeerConnection.addEventListener('icecandidate', (event) => this.#onIceCandidate(event, 'SUBSCRIBER'), {
			signal: this.peerConnectionAbortController.signal,
		});
		this.subscriberPeerConnection.addEventListener('icecandidateerror', (event) => this.#onIceCandidateError(event, true), {
			signal: this.peerConnectionAbortController.signal,
		});
		this.subscriberPeerConnection.addEventListener('connectionstatechange', () => this.#onConnectionStateChange(true), {
			signal: this.peerConnectionAbortController.signal,
		});
		this.subscriberPeerConnection.addEventListener('iceconnectionstatechange', () => this.#onIceconnectionstatechange(true), {
			signal: this.peerConnectionAbortController.signal,
		});
		this.subscriberPeerConnection.addEventListener('icegatheringstatechange', (event) => this.#onIceGatheringStateChange(event, true), {
			signal: this.peerConnectionAbortController.signal,
		});
		this.subscriberPeerConnection.addEventListener('track', (event) => this.#triggerEvents('track', [event]), {
			signal: this.peerConnectionAbortController.signal,
		});
		this.subscriberPeerConnection.addEventListener('signalingstatechange', (event) => this.#onSignalingStateChange(event, true), {
			signal: this.peerConnectionAbortController.signal,
		});
		this.subscriberPeerConnection.addEventListener('negotiationneeded', () => this.#onNegotiationNeeded(true), {
			signal: this.peerConnectionAbortController.signal,
		});

		if (this.pendingOffer)
		{
			this.#offerHandler(this.pendingOffer);
			this.pendingOffer = null;
		}

		this.#addPeerConnectionStatsProcessing();
	}

	#destroyPeerConnections()
	{
		if (this.peerConnectionAbortController)
		{
			this.peerConnectionAbortController.abort();
			this.peerConnectionAbortController = null;
		}

		if (this.publisherPeerConnection)
		{
			this.publisherPeerConnection.close();
			this.publisherPeerConnection = null;
		}

		if (this.subscriberPeerConnection)
		{
			this.subscriberPeerConnection.close();
			this.subscriberPeerConnection = null;
		}

		this.previousPeerConnections.forEach((peerConnection) => {
			peerConnection.close();
			peerConnection = null;
		});
		this.previousPeerConnections = [];

		this.peerConnectionFailed = false;
	}

	#addPeerConnectionStatsProcessing()
	{
		this.callStatsInterval = setInterval(async () => {
			try
			{
				const statsAll = {};
				const statsPromises = [];
				if (this.isPublishing)
				{
					statsPromises.push(this.publisherPeerConnection.getStats(null)
						.then((stats) => {
							statsAll.publisher = stats;
						}));
				}
				statsPromises.push(this.subscriberPeerConnection.getStats(null)
					.then((stats) => {
						statsAll.subscriber = stats;
					}));
				await Promise.allSettled(statsPromises);
				this.#triggerEvents('stats', [statsAll, this.id]);
			}
			catch
			{
				// if we're here it's almost okay
				// we tried to get stats during reconnection
			}
		}, this.statsTimeout);
	}

	#getSender(kind)
	{
		const senders = this.publisherPeerConnection?.getSenders?.();

		if (senders?.length > 0)
		{
			for (const sender of senders)
			{
				if (sender.track?.source === kind)
				{
					return sender;
				}
			}
		}

		return null;
	}

	#saveEncodings(rackId, encodings)
	{
		if (this.savedSenderEncodings[rackId])
		{
			this.savedSenderEncodings[rackId] = {
				...this.savedSenderEncodings[rackId],
				...encodings,
			};
		}
		else
		{
			this.savedSenderEncodings[rackId] = encodings;
		}
	}

	#updateSender(sender, encodings)
	{
		if (this.sendersProcesses[sender.track.id])
		{
			this.#saveEncodings(sender.track.id, encodings);

			return this.sendersProcesses[sender.track.id];
		}

		const params = sender.getParameters();

		this.sendersProcesses[sender.track.id] = new Promise(async (resolve, reject) => {
			if (params && params?.encodings?.length > 0)
			{
				params.encodings.forEach((encoding) => {
					const encodingByRid = encodings[encoding.rid];
					if (encodingByRid)
					{
						for (const key in encodingByRid)
						{
							encoding[key] = encodingByRid[key];
						}
					}
				});

				try
				{
					await sender.setParameters(params);
				}
				catch (e)
				{
					this.#log(`Updating sender params for track ${sender.track.id} to ${encodings} failed: ${e}`, LOG_LEVEL.ERROR);
					if (!this.savedSenderEncodings[sender.track.id])
					{
						reject();
					}
				}

				delete this.sendersProcesses[sender.track.id];

				if (this.savedSenderEncodings[sender.track.id])
				{
					const encodings = this.savedSenderEncodings[sender.track.id];
					delete this.savedSenderEncodings[sender.track.id];

					return this.#updateSender(sender, encodings);
				}
			}

			resolve();
		});

		return this.sendersProcesses[sender.track.id];
	}

	#getMaxEncodingsByVideoWidth(width)
	{
		const aspectRation = 16 / 9;
		const maxWidth = Math.ceil(Hardware.maxLocalStreamQualityHeight * aspectRation);
		const optimizedWidth = maxWidth <= width ? maxWidth : width;

		// https://source.chromium.org/chromium/chromium/src/+/main:third_party/webrtc/video/config/simulcast.cc;l=76;

		if (optimizedWidth >= 960)
		{
			return 3;
		}

		if (optimizedWidth >= 480)
		{
			return 2;
		}

		return 1;
	}

	#getEncodingsFromVideoWidth(width: number): any[]
	{
		const maxEncodings: number = this.#getMaxEncodingsByVideoWidth(width);
		const rids: string[] = ['q', 'h', 'f'];
		const encodings: any[] = [];

		for (let i = 0; i < 3; i++)
		{
			const rid: string = rids[i];
			encodings.push({
				rid,
				active: i < maxEncodings && this.trackActivity[MediaStreamsKinds.Camera],
				maxBitrate: this.publicationParams.videoBitrate[rid],
				scaleResolutionDownBy: 2 ** Math.max(0, (maxEncodings - 1 - i)),
			});
		}

		return encodings;
	}

	#getLayersFromEncodings(width, height, encodings)
	{
		return encodings.map((encoding, index) => {
			return {
				quality: index,
				width: width / encoding.scaleResolutionDownBy,
				height: height / encoding.scaleResolutionDownBy,
				bitrate: this.publicationParams.videoBitrate[encoding.rid],
			};
		});
	}

	#setCodec(transceiver)
	{
		const capabilities = RTCRtpReceiver.getCapabilities?.('video');
		const canSetCodecs = 'setCodecPreferences' in transceiver;

		if (!capabilities || !canSetCodecs)
		{
			return;
		}

		const matched = [];
		const partialMatched = [];
		const unmatched = [];
		capabilities.codecs.forEach((codec) => {
			const mimeType = codec.mimeType.toLowerCase();
			if (mimeType === `audio/${this.publicationParams.audioCodec}`)
			{
				matched.push(codec);

				return;
			}
			const matchesVideoCodec = mimeType === `video/${this.publicationParams.videoCodec}`;
			if (!matchesVideoCodec)
			{
				unmatched.push(codec);

				return;
			}

			// for h264 codecs that have sdpFmtpLine available, use only if the
			// profile-level-id is 42e01f for cross-browser compatibility
			if (this.publicationParams.videoCodec === 'h264')
			{
				if (codec.sdpFmtpLine && codec.sdpFmtpLine.includes('profile-level-id=42e01f'))
				{
					matched.push(codec);
				}
				else
				{
					partialMatched.push(codec);
				}

				return;
			}

			matched.push(codec);
		});

		transceiver.setCodecPreferences([...matched, ...partialMatched, ...unmatched]);
	}

	#filterCodecs(sdp: string): string
	{
		const lines = sdp.split('\r\n');
		const filteredLines = [];
		let currentCodec = null;

		const codecsToKeep = new Set([this.publicationParams.videoCodec, this.publicationParams.audioCodec]);

		let videoCodecId = null;
		let audioCodecId = null;
		let currenMediaType = null;
		const mLines = {
			video: [],
			audio: [],
		};

		for (const line of lines)
		{
			if (line.startsWith('m=video'))
			{
				currenMediaType = 'video';
				mLines.video.push(filteredLines.length);
			}
			else if (line.startsWith('m=audio'))
			{
				currenMediaType = 'audio';
				mLines.audio.push(filteredLines.length);
			}

			if (line.startsWith('a=rtpmap:'))
			{
				const codecDetails = line.split(' ');
				const codecId = codecDetails[0].split(':')[1];
				const codecName = codecDetails[1].split('/')[0];

				if (codecsToKeep.has(codecName.toLowerCase()))
				{
					if (currenMediaType === 'video')
					{
						videoCodecId = codecId;
					}
					else if (currenMediaType === 'audio')
					{
						audioCodecId = codecId;
					}

					currentCodec = codecId;
					filteredLines.push(line);
				}
			}
			else if (line.startsWith('a=rtcp-fb:') || line.startsWith('a=fmtp:'))
			{
				if (currentCodec && (line.startsWith(`a=rtcp-fb:${currentCodec}`) || line.startsWith(`a=fmtp:${currentCodec}`)))
				{
					filteredLines.push(line);
				}
			}
			else
			{
				filteredLines.push(line);
			}
		}

		for (const index of mLines.video)
		{
			filteredLines[index] = this.#updateMLine(filteredLines[index], [videoCodecId]);
		}

		for (const index of mLines.audio)
		{
			filteredLines[index] = this.#updateMLine(filteredLines[index], [audioCodecId]);
		}

		return filteredLines.join('\r\n');
	}

	#updateMLine(line: string, codecIds: number[]): string
	{
		const lineDetails = line.split(' ');

		return `${lineDetails[0]} ${lineDetails[1]} ${lineDetails[2]} ${codecIds.join(' ')}`;
	}

	async #updateVideoEncodings(sender, track)
	{
		const params = sender.getParameters();
		const width = track?.getSettings().width || Hardware.maxLocalStreamQualityHeight;
		const encodingsFromVideoWidth = this.#getEncodingsFromVideoWidth(width);

		if (params && params?.encodings?.length > 0)
		{
			const encodings = {};
			params.encodings.forEach((encoding) => {
				const encodingByRid = encodingsFromVideoWidth.find((el) => el.rid === encoding.rid);
				if (encodingByRid)
				{
					encodings[encoding.rid] = {};
					encodings[encoding.rid].active = encodingByRid.active;
					encodings[encoding.rid].maxBitrate = encodingByRid.maxBitrate;
					encodings[encoding.rid].scaleResolutionDownBy = encodingByRid.scaleResolutionDownBy;
				}
			});

			await this.#updateSender(sender, encodings);
		}
	}

	#onIceCandidate(event, target)
	{
		if (!event.candidate)
		{
			return;
		}

		if (BX.message('call_use_tcp_sdp') === 'Y' && event.candidate.protocol !== 'tcp')
		{
			return;
		}

		const trickle = {
			candidateInit: JSON.stringify({
				candidate: event.candidate.candidate,
				sdpMid: event.candidate?.sdpMid,
				sdpMLineIndex: event.candidate?.sdpMLineIndex,
				usernameFragment: event.candidate?.usernameFragment,
			}),
		};

		if (target)
		{
			trickle.target = target;
		}

		this.#sendSignal({ trickle });

		const pcType = target
			? 'PUBLISHER'
			: 'SENDER';

		this.#log(`pcType: ${pcType} Send local ICE candidate`);
	}

	#onIceCandidateError(event: Event, subscriber?: boolean): void
	{
		const pcType = subscriber
			? 'SUBSCRIBER'
			: 'PUBLISHER';

		this.#log(`pcType: ${pcType}; onIceCandidateError: ${JSON.stringify(event)}`);
	}

	#onConnectionStateChange(subscriber)
	{
		const state = subscriber
			? this.subscriberPeerConnection?.connectionState
			: this.publisherPeerConnection?.connectionState;

		if (state === 'failed')
		{
			const logMessage = `State of ${subscriber ? 'subscriber' : 'publisher'} peer connection for media server #${this.id} changed to ${state}, reconnecting`;
			this.#log(logMessage, LOG_LEVEL.WARNING);

			if (this.peerConnectionFailed)
			{
				return;
			}

			const additionalData = {
				reconnectionReason: 'ON_CONNECTION_STATE_CHANGED',
				reconnectionReasonInfo: logMessage,
			};
			this.#triggerEvents('down', [this.id, additionalData]);

			const issue = {
				name: MONITORING_EVENTS_NAME_LIST.PEER_CONNECTION_REFUSED,
				withCounter: true,
			};
			this.#triggerEvents('peerConnectionIssue', [this.id, issue]);
			this.peerConnectionFailed = true;
			clearInterval(this.callStatsInterval);
		}
		else if (state === 'connected')
		{
			if (this.trackToUpdateEncodings && !subscriber)
			{
				const track = this.trackToUpdateEncodings;
				this.trackToUpdateEncodings = null;
				const sender = this.#getSender(track.source);

				if (sender)
				{
					this.#updateVideoEncodings(sender, track);
				}
			}
			this.#triggerEvents('up', [this.id, subscriber]);
		}
	}

	#onIceconnectionstatechange(subscriber?: boolean): void
	{
		const state = subscriber
			? this.subscriberPeerConnection?.iceConnectionState
			: this.publisherPeerConnection?.iceConnectionState;

		const logMessage = `State of ${subscriber ? 'subscriber' : 'publisher'} ICE connection changed to ${state}`;

		if (state === 'failed' || state === 'disconnected')
		{
			this.#log(logMessage, LOG_LEVEL.WARNING);
		}
		else
		{
			this.#log(logMessage);
		}
	}

	#onIceGatheringStateChange(event: Event, subscriber?: boolean): void
	{
		const pcType = subscriber
			? 'SUBSCRIBER'
			: 'PUBLISHER';

		const connection = event.target;
		this.#log(`pcType: ${pcType}; ICE gathering state changed to : ${connection.iceGatheringState}`);
	}

	#onSignalingStateChange(event: Event, subscriber?: boolean): void
	{
		const pcType = subscriber
			? 'SUBSCRIBER'
			: 'PUBLISHER';

		const state = subscriber
			? this.subscriberPeerConnection?.signalingState
			: this.publisherPeerConnection?.signalingState;

		this.#log(`pcType: ${pcType}; PC signalingState:  ${state}`);
	}

	#onNegotiationNeeded(subscriber?: boolean): void
	{
		const pcType = subscriber
			? 'SUBSCRIBER'
			: 'PUBLISHER';

		this.#log(`pcType: ${pcType}; onNegotiationNeeded`);
	}

	async #offerHandler(data)
	{
		if (!this.subscriberPeerConnection || !this.isConnected)
		{
			this.#log('pcType: SUBSCRIBER; Handling a remote offer deferred, media server is not ready');
			this.pendingOffer = data;

			return;
		}

		const pendingCandidates = this.pendingCandidates.subscriber.length;
		let proceededCandidates = 0;

		try
		{
			this.#log('pcType: SUBSCRIBER; Handling a remote offer');
			await this.subscriberPeerConnection.setRemoteDescription(data.offer);
			this.pendingCandidates.subscriber.forEach((candidate) => {
				this.subscriberPeerConnection.addIceCandidate(candidate);
				proceededCandidates++;
			});
			if (pendingCandidates)
			{
				this.#log(`pcType: SUBSCRIBER; Added ${proceededCandidates} of ${pendingCandidates} deferred ICE candidate for a subscriber`);
			}
			this.pendingCandidates.subscriber = [];
			let answer = await this.subscriberPeerConnection.createAnswer();
			let sdp = this.#filterCodecs(answer.sdp);

			if (BX.message('call_use_tcp_sdp') === 'Y')
			{
				sdp = removeUdpFromSdp(sdp);
			}

			answer = {
				sdp,
				type: answer.type,
			};

			await this.subscriberPeerConnection.setLocalDescription(answer);
			this.#sendSignal({ answer });
			this.#log('pcType: SUBSCRIBER; Handling a remote offer succeeded');
		}
		catch (e)
		{
			const logMessage = `pcType: SUBSCRIBER; Handling a remote offer failed: ${e}`;
			this.#log(logMessage, LOG_LEVEL.ERROR);
			if (pendingCandidates)
			{
				this.#log(`Added ${proceededCandidates} of ${pendingCandidates} deferred ICE candidate for a subscriber`);
			}
			clearInterval(this.callStatsInterval);

			const additionalData = {
				reconnectionReason: 'HANDLING_OFFER',
				reconnectionReasonInfo: logMessage,
			};

			this.#triggerEvents('down', [this.id, additionalData]);
			const issue = {
				name: MONITORING_EVENTS_NAME_LIST.PEER_CONNECTION_ISSUES_HANDLING_OFFER,
			};
			this.#triggerEvents('peerConnectionIssue', [this.id, issue]);
		}
	}

	async #answerHandler(data)
	{
		this.#log('pcType: PUBLISHER; Start handling a remote answer');
		let hasError = false;
		const pendingCandidates = this.pendingCandidates.publisher.length;
		let proceededCandidates = 0;

		try
		{
			if (BX.message('call_use_tcp_sdp') === 'Y')
			{
				data.answer.sdp = removeUdpFromSdp(data.answer.sdp);
			}
			await this.publisherPeerConnection.setRemoteDescription(data.answer);
			this.pendingCandidates.publisher.forEach((candidate) => {
				this.publisherPeerConnection.addIceCandidate(candidate);
				proceededCandidates++;
			});
			if (pendingCandidates)
			{
				this.#log(`pcType: PUBLISHER; Added ${proceededCandidates} of ${pendingCandidates} deferred ICE candidate for a publisher`);
			}
			this.pendingCandidates.publisher = [];
		}
		catch (e)
		{
			const logMessage = `pcType: PUBLISHER; Handling a remote answer failed: ${e}`;
			this.#log(logMessage, LOG_LEVEL.ERROR);
			if (pendingCandidates)
			{
				this.#log(`pcType: PUBLISHER; Added ${proceededCandidates} of ${pendingCandidates} deferred ICE candidate for a publisher`);
			}
			hasError = true;
			clearInterval(this.callStatsInterval);

			const additionalData = {
				reconnectionReason: 'HANDLING_ANSWER',
				reconnectionReasonInfo: logMessage,
			};

			this.#triggerEvents('down', [this.id, additionalData]);
			const issue = {
				name: MONITORING_EVENTS_NAME_LIST.PEER_CONNECTION_ISSUES_HANDLING_ANSWER,
			};
			this.#triggerEvents('peerConnectionIssue', [this.id, issue]);
		}
		finally
		{
			if (!hasError)
			{
				this.#log('pcType: PUBLISHER; Handling a remote answer succeeded');
				this.isWaitingAnswer = false;
				await this.#sendOffer();
			}
		}
	}

	#iceCandidateHandler(data)
	{
		const target = data.trickle.target ? 'subscriber' : 'publisher';
		const pcType = data.trickle.target ? 'SUBSCRIBER' : 'PUBLISHER';

		try
		{
			const candidate = JSON.parse(data.trickle.candidateInit);

			if (BX.message('call_use_tcp_sdp') === 'Y' && !candidate.candidate.includes('tcp'))
			{
				return;
			}

			const peerConnection = data.trickle.target ? this.subscriberPeerConnection : this.publisherPeerConnection;

			if (peerConnection?.remoteDescription && this.isConnected)
			{
				peerConnection.addIceCandidate(candidate);

				return;
			}

			this.pendingCandidates[target].push(candidate);
			this.#log(`pcType: ${pcType}; Adding an ICE candidate for a ${target} deferred: has no remote description`);
		}
		catch (e)
		{
			this.#log(`pcType: ${pcType}; Adding an ICE candidate for a ${target} failed: ${e}`, LOG_LEVEL.ERROR);
			const issue = {
				name: MONITORING_EVENTS_NAME_LIST.PEER_CONNECTION_ISSUES_ADDING_ICE_CANDIDATE,
				value: 3,
			};
			this.#triggerEvents('peerConnectionIssue', [this.id, issue]);
		}
	}

	async #sendOffer()
	{
		if (this.offersStack > 0 && !this.isWaitingAnswer)
		{
			this.#log('Start sending an offer');
			this.isWaitingAnswer = true;
			this.offersStack--;

			try
			{
				let offer = await this.publisherPeerConnection.createOffer();
				let sdp = this.#filterCodecs(offer.sdp);

				if (BX.message('call_use_tcp_sdp') === 'Y')
				{
					sdp = removeUdpFromSdp(sdp);
				}

				offer = {
					sdp,
					type: offer.type,
				};

				await this.publisherPeerConnection.setLocalDescription(offer);
				this.#sendSignal({ offer });
				this.#log('Sending an offer succeeded');
			}
			catch (e)
			{
				this.#log(`Sending an offer failed: ${e}`, LOG_LEVEL.ERROR);
				this.isWaitingAnswer = false;
				await this.#sendOffer();
			}
		}
	}

	#beforeDisconnect()
	{
		clearInterval(this.callStatsInterval);
		this.isConnected = false;
		this.peerConnectionFailed = false;
		this.isWaitingAnswer = false;
		this.offersStack = 0;
		this.pendingOffer = null;
		this.pendingCandidates = {
			publisher: [],
			subscriber: [],
		};
		this.trackToUpdateEncodings = null;
	}
}
