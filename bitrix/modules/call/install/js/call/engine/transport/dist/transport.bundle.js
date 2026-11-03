/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Engine = this.BX.Call.Engine || {};
(function (exports) {
	'use strict';

	function ok(value) {
		return {
			ok: true,
			value
		};
	}
	function err(error) {
		return {
			ok: false,
			error
		};
	}
	function isOk(result) {
		return result.ok;
	}
	function isErr(result) {
		return !result.ok;
	}

	function isCancelled(error) {
		return error.kind === 'cancelled';
	}

	const Quality = Object.freeze({
		VeryHigh: 'very_high',
		High: 'high',
		Medium: 'medium',
		Low: 'low',
		VeryLow: 'very_low'
	});

	const CallScheme = Object.freeze({
		Classic: 1,
		Jwt: 2
	});
	const RoomType = Object.freeze({
		Small: 1,
		Conference: 2,
		Large: 3,
		Personal: 4
	});

	const AcquisitionContractCode = Object.freeze({
		MalformedResponse: 'acquisition.malformed_response',
		SchemeMismatch: 'acquisition.scheme_mismatch'
	});

	function isWireRecord(value) {
		return typeof value === 'object' && value !== null;
	}
	function readWireId(value) {
		if (typeof value === 'string') {
			return value;
		}
		return typeof value === 'number' ? String(value) : undefined;
	}

	const ROOM_TYPES = Object.values(RoomType);
	function readNumber(value) {
		if (typeof value !== 'number' && typeof value !== 'string') {
			return undefined;
		}
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : undefined;
	}
	function readNonEmptyText(value) {
		return typeof value === 'string' && value.length > 0 ? value : undefined;
	}
	function readRoomType(value) {
		const roomType = readNumber(value);
		return roomType !== undefined && ROOM_TYPES.includes(roomType) ? roomType : undefined;
	}

	const CREATE_ACTION = 'call.CallManager.create';
	function contractError$1(code, message) {
		const error = {
			kind: 'contract',
			code,
			message
		};
		return err(error);
	}
	function malformed$1(field) {
		return contractError$1(AcquisitionContractCode.MalformedResponse, `${field} is missing or unreadable`);
	}
	function cancelled$4() {
		const error = {
			kind: 'cancelled'
		};
		return err(error);
	}
	function isAborted$1(signal) {
		return signal?.aborted === true;
	}
	function readServerCallId(value) {
		const id = readNumber(value);
		return id !== undefined && Number.isInteger(id) && id > 0 ? id : undefined;
	}
	function readStartDate(value) {
		if (typeof value === 'string') {
			return value.length > 0 ? value : undefined;
		}
		return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
	}
	function toCreatePayload(request, context) {
		return {
			type: request.callType,
			provider: request.provider,
			entityType: context.entityType,
			entityId: context.entityId,
			joinExisting: !request.mustCreate
		};
	}
	function toDescriptor$1(answer, roomType) {
		if (!isWireRecord(answer)) {
			return malformed$1('the answer of the action');
		}
		const fields = answer.call;
		if (!isWireRecord(fields)) {
			return malformed$1('call of the answer');
		}
		const answeredScheme = readNumber(fields.SCHEME);
		if (answeredScheme !== undefined && answeredScheme !== CallScheme.Classic) {
			return contractError$1(AcquisitionContractCode.SchemeMismatch, `the answer is of scheme ${answeredScheme} while the connection was acquired as classic`);
		}
		const serverCallId = readServerCallId(fields.ID);
		if (serverCallId === undefined) {
			return malformed$1('call.ID');
		}
		const startDate = readStartDate(fields.START_DATE);
		if (startDate === undefined) {
			return malformed$1('call.START_DATE');
		}
		return ok({
			scheme: CallScheme.Classic,
			serverCallId,
			roomId: readNonEmptyText(fields.UUID),
			roomType,
			startDate,
			isNew: answer.isNew === true,
			connectionData: answer.connectionData,
			publicChannels: answer.publicChannels
		});
	}
	class ClassicConnectionAcquisition {
		#rest;
		#context;
		#signalProvider;
		constructor(options) {
			this.#rest = options.rest;
			this.#context = options.context;
			this.#signalProvider = options.signalProvider ?? (() => undefined);
		}
		async acquire(request) {
			const signal = this.#signalProvider();
			if (isAborted$1(signal)) {
				return cancelled$4();
			}
			if (request.scheme !== CallScheme.Classic) {
				return contractError$1(AcquisitionContractCode.SchemeMismatch, `the connection is requested as scheme ${request.scheme} while this acquisition is classic`);
			}
			const answer = await this.#rest.callAction(CREATE_ACTION, toCreatePayload(request, this.#context));
			if (isAborted$1(signal)) {
				return cancelled$4();
			}
			if (isErr(answer)) {
				return answer;
			}
			return toDescriptor$1(answer.value, request.roomType);
		}
	}

	const JoinFailureCode = Object.freeze({
		CanNotCreateRoom: 1,
		InputError: 2,
		AccessDenied: 3,
		RoomNotFound: 5,
		MalfunctioningSignaling: 7,
		JsonParsingError: 'JsonParsingError',
		UnexpectedResponse: 'UnexpectedResponse',
		FailedRequest: 'FailedRequest',
		AbortedRequest: 'AbortedRequest',
		BodyReadError: 'BodyReadError',
		UnknownError: 'UnknownError'
	});
	const DENIED_REASON = 'access';
	function readJoinFailure(value) {
		if (!isWireRecord(value)) {
			return undefined;
		}
		const {
			code,
			message
		} = value;
		if (typeof code !== 'string' && typeof code !== 'number') {
			return undefined;
		}
		return typeof message === 'string' ? {
			code,
			message
		} : {
			code
		};
	}
	function toTransportError$2(failure) {
		switch (failure.code) {
			case JoinFailureCode.AccessDenied:
				return {
					kind: 'denied',
					reason: DENIED_REASON
				};
			case JoinFailureCode.FailedRequest:
				return {
					kind: 'network'
				};
			case JoinFailureCode.AbortedRequest:
				return {
					kind: 'cancelled'
				};
			default:
				return failure.message === undefined ? {
					kind: 'contract',
					code: failure.code
				} : {
					kind: 'contract',
					code: failure.code,
					message: failure.message
				};
		}
	}

	const JOIN_PATH = '/v2/join';
	const CLIENT_VERSION = '1.0.0';
	const CLIENT_PLATFORM = 'web';
	const ONE_TO_ONE_PROVIDER = 'Plain';
	const SCHEME_MISMATCH_MESSAGE = 'connection acquisition: the schema of the answer is not the one acquired';
	const REQUEST_SCHEME_MISMATCH_MESSAGE = 'connection acquisition: the connection is requested under another schema';
	const SILENT_LOGGER = {
		log: () => {},
		warn: () => {},
		error: () => {}
	};
	function contractError(code, message) {
		const error = {
			kind: 'contract',
			code,
			message
		};
		return err(error);
	}
	function malformed(field) {
		return contractError(AcquisitionContractCode.MalformedResponse, `${field} is missing or unreadable`);
	}
	function joinFailure(code, message) {
		return err(toTransportError$2({
			code,
			message
		}));
	}
	function cancelled$3() {
		const error = {
			kind: 'cancelled'
		};
		return err(error);
	}
	function isAborted(signal) {
		return signal?.aborted === true;
	}
	function readAnsweredScheme(result) {
		return isWireRecord(result) ? readNumber(result.scheme) : undefined;
	}
	function readMonitoring(value) {
		if (!isWireRecord(value)) {
			return undefined;
		}
		const monitoring = {
			metricsServerUrl: readNonEmptyText(value.metricsServerUrl),
			logsServerUrl: readNonEmptyText(value.logsServerUrl),
			token: readNonEmptyText(value.token),
			env: readNonEmptyText(value.env),
			region: readNonEmptyText(value.region)
		};
		return Object.values(monitoring).some(field => field !== undefined) ? monitoring : undefined;
	}
	function toJoinBody(request, context) {
		return {
			userToken: context.userToken,
			isOneToOne: request.provider === ONE_TO_ONE_PROVIDER,
			clientVersion: CLIENT_VERSION,
			clientPlatform: CLIENT_PLATFORM,
			callType: request.callType,
			roomType: request.roomType,
			instanceId: context.instanceId,
			callToken: context.callToken,
			provider: request.provider,
			isVideo: request.isVideo,
			callUuid: request.callUuid,
			parentUuid: request.parentUuid
		};
	}
	function toJoinUrl(request, context) {
		return `${context.callBalancerUrl}${JOIN_PATH}?mustCreate=${request.mustCreate}`;
	}
	function readJson(body) {
		try {
			return {
				value: JSON.parse(body)
			};
		} catch {
			return undefined;
		}
	}
	function toDescriptor(result) {
		if (!isWireRecord(result)) {
			return malformed('result of the answer');
		}
		const mediaServerUrl = readNonEmptyText(result.mediaServerUrl);
		if (mediaServerUrl === undefined) {
			return malformed('result.mediaServerUrl');
		}
		const roomData = readNonEmptyText(result.roomData);
		if (roomData === undefined) {
			return malformed('result.roomData');
		}
		const roomId = readNonEmptyText(result.roomId);
		if (roomId === undefined) {
			return malformed('result.roomId');
		}
		const roomType = readRoomType(result.roomType);
		if (roomType === undefined) {
			return malformed('result.roomType');
		}
		const startDate = readNumber(result.startDate);
		if (startDate === undefined) {
			return malformed('result.startDate');
		}
		return ok({
			scheme: CallScheme.Jwt,
			mediaServerUrl,
			roomData,
			roomId,
			roomType,
			startDate,
			isNew: result.isNew === true,
			monitoring: readMonitoring(result.monitoring)
		});
	}
	class JwtConnectionAcquisition {
		#http;
		#context;
		#signalProvider;
		#logger;
		constructor(options) {
			this.#http = options.http;
			this.#context = options.context;
			this.#signalProvider = options.signalProvider ?? (() => undefined);
			this.#logger = options.logger ?? SILENT_LOGGER;
		}
		async acquire(request) {
			const signal = this.#signalProvider();
			if (isAborted(signal)) {
				return cancelled$3();
			}
			if (request.scheme !== CallScheme.Jwt) {
				this.#logger.error(REQUEST_SCHEME_MISMATCH_MESSAGE, {
					requestedScheme: request.scheme,
					acquiredScheme: CallScheme.Jwt
				});
				return contractError(AcquisitionContractCode.SchemeMismatch, `the connection is requested as scheme ${request.scheme} while this acquisition is jwt`);
			}
			const response = await this.#http.request(this.#toHttpRequest(request, signal));
			if (isAborted(signal)) {
				return cancelled$3();
			}
			if (isErr(response)) {
				return response;
			}
			return this.#readAnswer(response.value);
		}
		#toHttpRequest(request, signal) {
			return {
				url: toJoinUrl(request, this.#context),
				method: 'POST',
				body: JSON.stringify(toJoinBody(request, this.#context)),
				signal
			};
		}
		#readAnswer(response) {
			const json = readJson(response.body);
			if (json === undefined) {
				if (response.ok) {
					return joinFailure(JoinFailureCode.JsonParsingError, 'the answer of the balancer is not json');
				}
				return joinFailure(JoinFailureCode.UnexpectedResponse, `the balancer answered the status ${response.status} with a body that is not json`);
			}
			const answer = isWireRecord(json.value) ? json.value : {};
			const failure = readJoinFailure(answer.error);
			if (failure !== undefined) {
				return err(toTransportError$2(failure));
			}
			if (!response.ok) {
				return joinFailure(JoinFailureCode.UnexpectedResponse, `the balancer answered the status ${response.status} and named no error`);
			}
			const answeredScheme = readAnsweredScheme(answer.result);
			if (answeredScheme !== undefined && answeredScheme !== CallScheme.Jwt) {
				this.#logger.error(SCHEME_MISMATCH_MESSAGE, {
					answeredScheme,
					acquiredScheme: CallScheme.Jwt
				});
				return contractError(AcquisitionContractCode.SchemeMismatch, `the answer is of scheme ${answeredScheme} while the connection was acquired as jwt`);
			}
			return toDescriptor(answer.result);
		}
	}

	const PEER_PING_INTERVAL_MS = 5000;
	const BACKEND_PING_INTERVAL_MS = 25000;
	const PEER_ARM = 'peers';
	const BACKEND_ARM = 'backend';
	const ANSWER_ARM = 'answer';
	const HANGUP_ARM = 'hangup';
	const KEEPALIVE_FAILED = 'signaling: a keepalive round failed';
	const PUBLISH_FAILED$1 = 'signaling: publishing an intent to the peers failed';
	const UNTYPED_FAILURE = 'untyped';
	const SignalingContractCode = Object.freeze({
		Disposed: 'signaling.disposed'
	});
	function refuseDisposed() {
		const failure = {
			kind: 'contract',
			code: SignalingContractCode.Disposed
		};
		return Promise.resolve(err(failure));
	}
	function describeFailure(cause) {
		if (typeof cause !== 'object' || cause === null || !('kind' in cause)) {
			return {
				kind: UNTYPED_FAILURE
			};
		}
		const error = cause;
		return error.kind === 'contract' ? {
			kind: error.kind,
			code: error.code
		} : {
			kind: error.kind
		};
	}
	class SignalingProtocolImpl {
		#pull;
		#clock;
		#gateway;
		#listener;
		#logger;
		#keepaliveRecipients = [];
		#stopPeerPing = undefined;
		#stopBackendPing = undefined;
		#disposed = false;
		constructor(options) {
			this.#pull = options.pull;
			this.#clock = options.clock;
			this.#gateway = options.gateway;
			this.#listener = options.listener;
			this.#logger = options.logger;
		}
		invite(invite) {
			if (this.#disposed) {
				return refuseDisposed();
			}
			return this.#gateway.sendInvite(invite);
		}
		async answer(recipients) {
			if (this.#disposed) {
				return refuseDisposed();
			}
			if (this.#pull.isPublishingSupported()) {
				try {
					this.#gateway.sendAnswerViaPull(recipients);
				} catch (error) {
					this.#swallow(PUBLISH_FAILED$1, ANSWER_ARM, error);
				}
			}
			return this.#gateway.sendAnswerViaRest();
		}
		decline(decline = {}) {
			if (this.#disposed) {
				return refuseDisposed();
			}
			this.#stopKeepalive();
			return this.#gateway.sendDecline(decline);
		}
		async hangup(recipients) {
			if (this.#disposed) {
				return refuseDisposed();
			}
			this.#stopKeepalive();
			if (this.#pull.isPublishingSupported()) {
				try {
					this.#gateway.sendHangupViaPull(recipients);
				} catch (error) {
					this.#swallow(PUBLISH_FAILED$1, HANGUP_ARM, error);
				}
			}
			return this.#gateway.sendHangupViaRest({
				retransmit: !this.#pull.isPublishingEnabled()
			});
		}
		ping(recipients) {
			if (this.#disposed) {
				return;
			}
			this.#keepaliveRecipients = recipients;
			if (this.#stopPeerPing === undefined) {
				this.#stopPeerPing = this.#clock.scheduleRepeating(() => this.#pingPeers(), PEER_PING_INTERVAL_MS);
			}
			if (this.#stopBackendPing === undefined) {
				this.#stopBackendPing = this.#clock.scheduleRepeating(() => this.#pingBackend(), BACKEND_PING_INTERVAL_MS);
			}
		}
		finish() {
			if (this.#disposed) {
				return refuseDisposed();
			}
			this.#stopKeepalive();
			return this.#gateway.sendFinish();
		}
		dispose() {
			if (this.#disposed) {
				return;
			}
			this.#disposed = true;
			this.#stopKeepalive();
		}
		onInvite(from, payload) {
			this.#relay(listener => listener.onInvite(from, payload));
		}
		onAnswer(from) {
			this.#relay(listener => listener.onAnswer(from));
		}
		onDecline(from, code) {
			this.#relay(listener => listener.onDecline(from, code));
		}
		onBusy(from) {
			this.#relay(listener => listener.onBusy(from));
		}
		onHangup(from) {
			this.#relay(listener => listener.onHangup(from));
		}
		onPing(from) {
			this.#relay(listener => listener.onPing(from));
		}
		onRepeatAnswer(from) {
			this.#relay(listener => listener.onRepeatAnswer(from));
		}
		onInviteTimeout(from) {
			this.#relay(listener => listener.onInviteTimeout(from));
		}
		onFinish() {
			this.#stopKeepalive();
			this.#relay(listener => listener.onFinish());
		}
		#pingPeers() {
			if (!this.#pull.isPublishingEnabled()) {
				return;
			}
			try {
				this.#gateway.sendPingToPeersViaPull(this.#keepaliveRecipients);
			} catch (error) {
				this.#swallow(KEEPALIVE_FAILED, PEER_ARM, error);
			}
		}
		#pingBackend() {
			try {
				this.#gateway.sendPingToBackendViaRest({
					retransmit: !this.#pull.isPublishingEnabled()
				}).then(outcome => {
					if (isErr(outcome)) {
						this.#swallow(KEEPALIVE_FAILED, BACKEND_ARM, outcome.error);
					}
				}, reason => this.#swallow(KEEPALIVE_FAILED, BACKEND_ARM, reason));
			} catch (error) {
				this.#swallow(KEEPALIVE_FAILED, BACKEND_ARM, error);
			}
		}
		#swallow(message, arm, cause) {
			this.#logger.warn(message, {
				arm,
				...describeFailure(cause)
			});
		}
		#relay(deliver) {
			if (this.#disposed) {
				return;
			}
			deliver(this.#listener);
		}
		#stopKeepalive() {
			this.#stopPeerPing?.();
			this.#stopPeerPing = undefined;
			this.#stopBackendPing?.();
			this.#stopBackendPing = undefined;
		}
	}

	const FINISH_ACTION = 'call.CallManager.finish';
	function toWireFlag(value) {
		return value ? 'Y' : 'N';
	}
	function nothingToSend() {
		return Promise.resolve(ok(undefined));
	}
	const UNNAMED_REFUSAL_CODE = 'unknown';
	function readRefusalCode(code) {
		if (typeof code === 'number') {
			return code;
		}
		return typeof code === 'string' && code.length > 0 ? code : UNNAMED_REFUSAL_CODE;
	}
	function readRefusalMessage(message) {
		return typeof message === 'string' && message.length > 0 ? message : undefined;
	}
	function readRefusalInData(data) {
		if (!isWireRecord(data) || data.result !== false) {
			return undefined;
		}
		return {
			kind: 'contract',
			code: readRefusalCode(data.errorCode),
			message: readRefusalMessage(data.errorMessage)
		};
	}
	class SignalingRestChannel {
		#rest;
		#callFields;
		#callInstanceId;
		#createRequestId;
		constructor(options) {
			this.#rest = options.rest;
			this.#callFields = options.callFields;
			this.#callInstanceId = options.callInstanceId;
			this.#createRequestId = options.requestIdFactory;
		}
		async send(action, payload = {}) {
			const answer = await this.#rest.callAction(action, {
				...payload,
				...this.#callFields,
				callInstanceId: this.#callInstanceId,
				requestId: this.#createRequestId()
			});
			if (isErr(answer)) {
				return answer;
			}
			const refusal = readRefusalInData(answer.value);
			return refusal === undefined ? ok(undefined) : err(refusal);
		}
	}

	const ACTIONS$1 = {
		invite: 'call.CallManager.invite',
		answer: 'call.CallManager.answer',
		decline: 'call.CallManager.decline',
		hangup: 'call.CallManager.hangup',
		ping: 'call.CallManager.ping'
	};
	const SIGNALS$1 = {
		answer: 'answer',
		hangup: 'hangup',
		ping: 'ping'
	};
	const HANGUP_EXPIRY_SECONDS = 3600;
	const PING_EXPIRY_SECONDS = 5;
	const VISIBLE_BY_DEFAULT$1 = true;
	class ClassicSignalingGateway {
		#pull;
		#rest;
		constructor(options) {
			this.#pull = options.pull;
			this.#rest = new SignalingRestChannel({
				rest: options.rest,
				callFields: {
					callId: options.context.serverCallId
				},
				callInstanceId: options.context.callInstanceId,
				requestIdFactory: options.requestIdFactory
			});
		}
		sendInvite(invite) {
			return this.#rest.send(ACTIONS$1.invite, {
				userIds: invite.recipients,
				video: toWireFlag(invite.isVideo),
				show: toWireFlag(invite.isVisible ?? VISIBLE_BY_DEFAULT$1),
				repeated: toWireFlag(invite.isRepeated === true)
			});
		}
		sendAnswerViaPull(recipients) {
			this.#pull.publish(recipients, SIGNALS$1.answer, {});
		}
		sendAnswerViaRest() {
			return this.#rest.send(ACTIONS$1.answer);
		}
		sendDecline(decline) {
			return this.#rest.send(ACTIONS$1.decline, decline.code === undefined ? {} : {
				code: decline.code
			});
		}
		sendHangupViaPull(recipients) {
			this.#pull.publish(recipients, SIGNALS$1.hangup, {}, HANGUP_EXPIRY_SECONDS);
		}
		sendHangupViaRest(hangup) {
			return this.#rest.send(ACTIONS$1.hangup, {
				retransmit: hangup.retransmit
			});
		}
		sendPingToPeersViaPull(recipients) {
			this.#pull.publish(recipients, SIGNALS$1.ping, {}, PING_EXPIRY_SECONDS);
		}
		sendPingToBackendViaRest(ping) {
			return this.#rest.send(ACTIONS$1.ping, {
				retransmit: ping.retransmit
			});
		}
		sendFinish() {
			return this.#rest.send(FINISH_ACTION);
		}
	}

	const DECLINE_CODE = 603;
	const BUSY_CODE = 486;

	const ACTIONS = {
		invite: 'call.Call.invite',
		decline: 'call.Call.decline'
	};
	const VISIBLE_BY_DEFAULT = true;
	class JwtSignalingGateway {
		#rest;
		constructor(options) {
			this.#rest = new SignalingRestChannel({
				rest: options.rest,
				callFields: {
					callUuid: options.context.callUuid
				},
				callInstanceId: options.context.callInstanceId,
				requestIdFactory: options.requestIdFactory
			});
		}
		sendInvite(invite) {
			return this.#rest.send(ACTIONS.invite, {
				users: invite.recipients,
				video: toWireFlag(invite.isVideo),
				show: toWireFlag(invite.isVisible ?? VISIBLE_BY_DEFAULT),
				repeated: toWireFlag(invite.isRepeated === true)
			});
		}
		sendAnswerViaPull() {}
		sendAnswerViaRest() {
			return nothingToSend();
		}
		sendDecline(decline) {
			return this.#rest.send(ACTIONS.decline, {
				code: decline.code ?? DECLINE_CODE
			});
		}
		sendHangupViaPull() {}
		sendHangupViaRest() {
			return nothingToSend();
		}
		sendPingToPeersViaPull() {}
		sendPingToBackendViaRest() {
			return nothingToSend();
		}
		sendFinish() {
			return this.#rest.send(FINISH_ACTION);
		}
	}

	const READ_ABOVE_THE_TRANSPORT = ['voiceStarted', 'voiceStopped', 'commonRecordState', 'customMessage', 'usersJoined', 'usersInvited', 'incoming'];
	const SERVER_ONLY_SIGNALS = ['usersAnswered', 'usersHangup', 'finish'];
	const PRESENCE_PER_ORIGIN_LIMIT = 16;
	const HELD_ORIGINS_LIMIT = 64;
	const SIGNAL_STOPS_HERE = 'pull dispatcher: an incoming signal stops at the transport';
	const NO_RESOLVED_ORIGIN = 'pull dispatcher: an incoming signal has no resolved origin';
	const ANOTHER_CALL = 'pull dispatcher: an incoming signal names another call';
	const NO_STATE = 'pull dispatcher: a media state signal carries no state';
	const PRESENCE_HELD = 'pull dispatcher: presence is held until the roster names its origin';
	const PRESENCE_RELEASED = 'pull dispatcher: the roster named the origin and the held presence went on';
	const PRESENCE_REFUSED = 'pull dispatcher: the origin of held presence will not be named';
	const PRESENCE_OVER_THE_LIMIT = 'pull dispatcher: an origin holds all the presence it may and its oldest is let go';
	const ORIGINS_OVER_THE_LIMIT = 'pull dispatcher: as many origins hold presence as may, and the oldest is let go';
	const SERVER_ONLY_FROM_A_CLIENT = 'pull dispatcher: a signal only the server sends arrived from a client';
	const SENDER_NOT_BACKED_BY_THE_CHANNEL = 'pull dispatcher: the channel does not vouch for the sender a signal names';
	const ABOVE_THE_TRANSPORT = 'above the transport';
	const NO_ROUTE = 'no route';
	const CHANNEL_NAMES_ANOTHER = 'the channel names another sender';
	const CHANNEL_PLACES_NOBODY = 'the addressing places nobody on the channel';
	function readCode(value) {
		return typeof value === 'number' ? value : undefined;
	}
	function readFlag(payload, field) {
		const value = payload[field];
		return typeof value === 'boolean' ? value : undefined;
	}
	function readEntries(value) {
		if (!Array.isArray(value)) {
			return [];
		}
		return value.filter(entry => isWireRecord(entry));
	}
	class PullDispatcher {
		#presence;
		#negotiation;
		#mute;
		#participants;
		#context;
		#logger;
		#unsubscribe;
		#heldPresence = new Map();
		#disposed = false;
		constructor(options) {
			this.#presence = options.presence;
			this.#negotiation = options.negotiation;
			this.#mute = options.mute;
			this.#participants = options.participants;
			this.#context = options.context;
			this.#logger = options.logger;
			this.#unsubscribe = options.pull.subscribeIncoming(message => this.#onIncoming(message));
		}
		releaseHeldPresence() {
			if (this.#disposed) {
				return;
			}
			[...this.#heldPresence.keys()].forEach(senderId => {
				const from = this.#participants.resolveSender(senderId);
				if (from === null) {
					return;
				}
				const released = this.#letGo(senderId);
				this.#logger.log(PRESENCE_RELEASED, {
					senderId,
					events: released.length
				});
				released.forEach(deliver => deliver(from));
			});
		}
		heldPresenceOrigins() {
			return [...this.#heldPresence.keys()];
		}
		dropHeldPresence(senderId) {
			const refused = this.#letGo(senderId);
			if (refused.length === 0) {
				return;
			}
			this.#logger.error(PRESENCE_REFUSED, {
				senderId,
				events: refused.length
			});
		}
		dispose() {
			if (this.#disposed) {
				return;
			}
			this.#disposed = true;
			this.#heldPresence.clear();
			this.#unsubscribe();
		}
		#onIncoming(message) {
			if (this.#disposed) {
				return;
			}
			if (!this.#isThisCall(message.callId)) {
				this.#logger.log(ANOTHER_CALL, {
					signal: message.signal,
					callId: message.callId
				});
				return;
			}
			if (this.#isOwnEcho(message.callInstanceId)) {
				return;
			}
			if (this.#isServerOnlySignalFromAClient(message)) {
				this.#logger.error(SERVER_ONLY_FROM_A_CLIENT, {
					signal: message.signal,
					origin: message.origin
				});
				return;
			}
			const senderRefusal = this.#refusalOfTheNamedSender(message);
			if (senderRefusal !== undefined) {
				this.#logger.error(SENDER_NOT_BACKED_BY_THE_CHANNEL, {
					signal: message.signal,
					senderId: message.senderId,
					channelSenderId: message.channelSenderId,
					origin: message.origin,
					reason: senderRefusal
				});
				return;
			}
			switch (message.signal) {
				case 'answer':
					this.#withPresenceSender(message, from => this.#presence.onAnswer(from));
					break;
				case 'usersAnswered':
					this.#onUsersAnswered(message);
					break;
				case 'hangup':
					this.#deliverHangup(message.signal, message.senderId, readCode(message.payload.code));
					break;
				case 'usersHangup':
					this.#onUsersHangup(message);
					break;
				case 'ping':
					this.#withSender(message, from => this.#presence.onPing(from));
					break;
				case 'repeatAnswer':
					this.#withPresenceSender(message, from => this.#presence.onRepeatAnswer(from));
					break;
				case 'userInviteTimeout':
					this.#onInviteTimeout(message);
					break;
				case 'finish':
					this.#presence.onFinish();
					break;
				case 'negotiationNeeded':
					this.#withSender(message, from => this.#negotiation.onNegotiationNeeded(from, message.payload));
					break;
				case 'connectionOffer':
					this.#withSender(message, from => this.#negotiation.onConnectionOffer(from, message.payload));
					break;
				case 'connectionAnswer':
					this.#withSender(message, from => this.#negotiation.onConnectionAnswer(from, message.payload));
					break;
				case 'iceCandidate':
					this.#withSender(message, from => this.#negotiation.onIceCandidate(from, message.payload));
					break;
				case 'microphoneState':
					this.#onDeviceState(message, 'microphone', 'microphoneState');
					break;
				case 'cameraState':
					this.#onDeviceState(message, 'camera', 'cameraState');
					break;
				case 'videoPaused':
					this.#onVideoPaused(message);
					break;
				default:
					this.#stopHere(message.signal);
			}
		}
		#onInviteTimeout(message) {
			this.#withPresenceOrigin(message.signal, readWireId(message.payload.failedUserId), from => {
				this.#presence.onInviteTimeout(from);
			});
		}
		#onUsersAnswered(message) {
			readEntries(message.payload.senders).forEach(entry => {
				if (this.#isOwnEcho(readWireId(entry.callInstanceId))) {
					return;
				}
				this.#withPresenceOrigin(message.signal, readWireId(entry.senderId), from => {
					this.#presence.onAnswer(from);
				});
			});
		}
		#onUsersHangup(message) {
			const sharedCode = readCode(message.payload.code);
			readEntries(message.payload.users).forEach(entry => {
				if (this.#isOwnEcho(readWireId(entry.callInstanceId))) {
					return;
				}
				this.#deliverHangup(message.signal, readWireId(entry.senderId) ?? readWireId(entry.userId), readCode(entry.code) ?? sharedCode);
			});
		}
		#deliverHangup(signal, senderId, code) {
			this.#withPresenceOrigin(signal, senderId, from => {
				if (code === DECLINE_CODE) {
					this.#presence.onDecline(from, code);
					return;
				}
				if (code === BUSY_CODE) {
					this.#presence.onBusy(from);
					return;
				}
				this.#presence.onHangup(from);
			});
		}
		#onDeviceState(message, kind, field) {
			const isOn = readFlag(message.payload, field);
			if (isOn === undefined) {
				this.#logger.log(NO_STATE, {
					signal: message.signal
				});
				return;
			}
			this.#withSender(message, from => this.#mute.onRemoteTrackMuted(from, kind, !isOn));
		}
		#onVideoPaused(message) {
			const isPaused = readFlag(message.payload, 'videoPaused');
			if (isPaused === undefined) {
				this.#logger.log(NO_STATE, {
					signal: message.signal
				});
				return;
			}
			this.#withSender(message, from => this.#mute.onRemoteTrackMuted(from, 'videoPaused', isPaused));
		}
		#withSender(message, deliver) {
			this.#withOrigin(message.signal, message.senderId, deliver);
		}
		#withPresenceSender(message, deliver) {
			this.#withPresenceOrigin(message.signal, message.senderId, deliver);
		}
		#withOrigin(signal, senderId, deliver) {
			const from = senderId === undefined ? null : this.#participants.resolveSender(senderId);
			if (from === null) {
				this.#logger.warn(NO_RESOLVED_ORIGIN, {
					signal,
					senderId
				});
				return;
			}
			deliver(from);
		}
		#withPresenceOrigin(signal, senderId, deliver) {
			if (senderId === undefined) {
				this.#logger.warn(NO_RESOLVED_ORIGIN, {
					signal,
					senderId
				});
				return;
			}
			const from = this.#participants.resolveSender(senderId);
			if (from === null) {
				this.#hold(signal, senderId, deliver);
				return;
			}
			deliver(from);
		}
		#hold(signal, senderId, deliver) {
			const held = this.#heldPresence.get(senderId);
			if (held === undefined) {
				this.#makeRoomForAnOrigin();
				this.#heldPresence.set(senderId, [deliver]);
				this.#logger.warn(PRESENCE_HELD, {
					signal,
					senderId,
					events: 1
				});
				return;
			}
			held.push(deliver);
			if (held.length > PRESENCE_PER_ORIGIN_LIMIT) {
				held.shift();
				this.#logger.error(PRESENCE_OVER_THE_LIMIT, {
					signal,
					senderId,
					limit: PRESENCE_PER_ORIGIN_LIMIT
				});
			}
			this.#logger.warn(PRESENCE_HELD, {
				signal,
				senderId,
				events: held.length
			});
		}
		#makeRoomForAnOrigin() {
			const overTheLimit = this.#heldPresence.size - HELD_ORIGINS_LIMIT + 1;
			if (overTheLimit <= 0) {
				return;
			}
			[...this.#heldPresence.keys()].slice(0, overTheLimit).forEach(senderId => {
				const letGo = this.#letGo(senderId);
				this.#logger.error(ORIGINS_OVER_THE_LIMIT, {
					senderId,
					events: letGo.length,
					limit: HELD_ORIGINS_LIMIT
				});
			});
		}
		#letGo(senderId) {
			const held = this.#heldPresence.get(senderId) ?? [];
			this.#heldPresence.delete(senderId);
			return held;
		}
		#isThisCall(callId) {
			return callId === this.#context.callId;
		}
		#isOwnEcho(callInstanceId) {
			return callInstanceId === this.#context.instanceId;
		}
		#isServerOnlySignalFromAClient(message) {
			return SERVER_ONLY_SIGNALS.includes(message.signal) && message.origin !== 'server';
		}
		#refusalOfTheNamedSender(message) {
			if (message.senderId === undefined) {
				return undefined;
			}
			if (message.channelSenderId === undefined) {
				return message.origin === 'server' ? undefined : CHANNEL_PLACES_NOBODY;
			}
			return message.channelSenderId === message.senderId ? undefined : CHANNEL_NAMES_ANOTHER;
		}
		#stopHere(signal) {
			const reason = READ_ABOVE_THE_TRANSPORT.includes(signal) ? ABOVE_THE_TRANSPORT : NO_ROUTE;
			this.#logger.log(SIGNAL_STOPS_HERE, {
				signal,
				reason
			});
		}
	}

	const LocalMediaKind = Object.freeze({
		Camera: 'camera',
		Microphone: 'microphone',
		Screen: 'screen',
		ScreenAudio: 'screen-audio'
	});
	const LocalMediaDenialReason = Object.freeze({
		Camera: 'camera',
		Microphone: 'microphone',
		ScreenPicker: 'screen-picker'
	});
	const LocalMediaContractCode = Object.freeze({
		MissingTrack: 'local_media.missing_track',
		Closed: 'local_media.closed'
	});
	const PORT_USER_MEDIA_DENIAL = 'user-media';
	const TRACK_ENDED_EVENT = 'ended';
	function contract(code) {
		return {
			kind: 'contract',
			code
		};
	}
	function denied$1(reason) {
		return {
			kind: 'denied',
			reason
		};
	}
	function cancelled$2() {
		return {
			kind: 'cancelled'
		};
	}
	function servesDevice(held, wanted) {
		return wanted === undefined || wanted === held;
	}
	function nameRefusedSurface(error, kind) {
		if (error.kind !== 'denied' || error.reason !== PORT_USER_MEDIA_DENIAL) {
			return error;
		}
		return denied$1(kind);
	}
	function userMediaConstraints(kind, deviceId) {
		const wanted = deviceId === undefined ? true : {
			deviceId: {
				exact: deviceId
			}
		};
		return kind === LocalMediaKind.Microphone ? {
			audio: wanted,
			video: false
		} : {
			audio: false,
			video: wanted
		};
	}
	function pickTrack(kind, stream) {
		const carriesAudio = kind === LocalMediaKind.Microphone || kind === LocalMediaKind.ScreenAudio;
		const tracks = carriesAudio ? stream.getAudioTracks() : stream.getVideoTracks();
		return tracks[0];
	}
	function stopAll(tracks) {
		tracks.forEach(track => track.stop());
	}
	class LocalMediaSource {
		#mediaDevices;
		#listener;
		#tracks = new Map();
		#pending = new Map();
		#captureCount = 0;
		#unsubscribeDeviceChange;
		#closed = false;
		constructor(options) {
			this.#mediaDevices = options.mediaDevices;
			this.#listener = options.listener;
			this.#unsubscribeDeviceChange = this.#mediaDevices.subscribeDeviceChange(() => this.#onDeviceChange());
		}
		enableCamera(deviceId) {
			return this.#enableUserMedia(LocalMediaKind.Camera, deviceId);
		}
		enableMicrophone(deviceId) {
			return this.#enableUserMedia(LocalMediaKind.Microphone, deviceId);
		}
		async enableScreen() {
			if (this.#closed) {
				return err(contract(LocalMediaContractCode.Closed));
			}
			const stored = this.#reusableTrack(LocalMediaKind.Screen, undefined);
			if (stored !== undefined) {
				return ok(stored);
			}
			if (this.#closed) {
				return err(contract(LocalMediaContractCode.Closed));
			}
			const pending = this.#pending.get(LocalMediaKind.Screen);
			if (pending !== undefined) {
				return pending.result;
			}
			return this.#beginCapture(LocalMediaKind.Screen, undefined, id => this.#captureScreen(id));
		}
		disableCamera() {
			this.#abandon(LocalMediaKind.Camera);
		}
		disableMicrophone() {
			this.#abandon(LocalMediaKind.Microphone);
		}
		disableScreen() {
			this.#abandon(LocalMediaKind.Screen);
			this.#release(LocalMediaKind.ScreenAudio);
		}
		getTrack(kind) {
			return this.#tracks.get(kind)?.track;
		}
		async listDevices() {
			if (this.#closed) {
				return err(contract(LocalMediaContractCode.Closed));
			}
			return this.#mediaDevices.enumerateDevices();
		}
		close() {
			if (this.#closed) {
				return;
			}
			this.#closed = true;
			this.#unsubscribeDeviceChange();
			[...this.#tracks.keys()].forEach(kind => this.#release(kind));
			this.#mediaDevices.dispose();
		}
		async #enableUserMedia(kind, deviceId) {
			if (this.#closed) {
				return err(contract(LocalMediaContractCode.Closed));
			}
			const stored = this.#reusableTrack(kind, deviceId);
			if (stored !== undefined) {
				this.#pending.delete(kind);
				return ok(stored);
			}
			const pending = this.#pending.get(kind);
			if (pending !== undefined && servesDevice(pending.deviceId, deviceId)) {
				return pending.result;
			}
			return this.#beginCapture(kind, deviceId, id => this.#captureUserMedia(kind, deviceId, id));
		}
		async #captureUserMedia(kind, deviceId, id) {
			try {
				const result = await this.#mediaDevices.getUserMedia(userMediaConstraints(kind, deviceId));
				if (isErr(result)) {
					return err(nameRefusedSurface(result.error, kind));
				}
				return this.#store(kind, deviceId, id, result.value);
			} finally {
				this.#forget(kind, id);
			}
		}
		async #captureScreen(id) {
			try {
				const result = await this.#mediaDevices.getDisplayMedia({
					video: true,
					audio: true
				});
				if (isErr(result)) {
					return err(result.error);
				}
				return this.#storeCapture(result.value, id);
			} finally {
				this.#forget(LocalMediaKind.Screen, id);
			}
		}
		#beginCapture(kind, deviceId, capture) {
			this.#captureCount++;
			const id = this.#captureCount;
			const result = capture(id);
			this.#pending.set(kind, {
				id,
				deviceId,
				result
			});
			return result;
		}
		#discardReason(kind, id) {
			if (this.#closed) {
				return contract(LocalMediaContractCode.Closed);
			}
			if (this.#pending.get(kind)?.id !== id) {
				return cancelled$2();
			}
			return undefined;
		}
		#forget(kind, id) {
			if (this.#pending.get(kind)?.id === id) {
				this.#pending.delete(kind);
			}
		}
		#abandon(kind) {
			this.#pending.delete(kind);
			this.#release(kind);
		}
		#reusableTrack(kind, deviceId) {
			const stored = this.#tracks.get(kind);
			if (stored === undefined) {
				return undefined;
			}
			if (stored.track.readyState === 'ended') {
				this.#release(kind);
				if (kind === LocalMediaKind.Screen) {
					this.#endScreenAudio();
				}
				return undefined;
			}
			if (!servesDevice(stored.deviceId, deviceId)) {
				return undefined;
			}
			return stored.track;
		}
		#store(kind, deviceId, id, stream) {
			const track = pickTrack(kind, stream);
			if (track === undefined) {
				stopAll(stream.getTracks());
				return err(contract(LocalMediaContractCode.MissingTrack));
			}
			stopAll(stream.getTracks().filter(other => other !== track));
			const discarded = this.#discardReason(kind, id);
			if (discarded !== undefined) {
				track.stop();
				return err(discarded);
			}
			this.#hold(kind, deviceId, track);
			return ok(track);
		}
		#storeCapture(stream, id) {
			const screen = pickTrack(LocalMediaKind.Screen, stream);
			const screenAudio = pickTrack(LocalMediaKind.ScreenAudio, stream);
			if (screen === undefined) {
				stopAll(stream.getTracks());
				return err(contract(LocalMediaContractCode.MissingTrack));
			}
			stopAll(stream.getTracks().filter(other => other !== screen && other !== screenAudio));
			const discarded = this.#discardReason(LocalMediaKind.Screen, id);
			if (discarded !== undefined) {
				stopAll(screenAudio === undefined ? [screen] : [screen, screenAudio]);
				return err(discarded);
			}
			this.#release(LocalMediaKind.ScreenAudio);
			if (screenAudio !== undefined) {
				this.#hold(LocalMediaKind.ScreenAudio, undefined, screenAudio);
			}
			this.#hold(LocalMediaKind.Screen, undefined, screen);
			return ok(screen);
		}
		#hold(kind, deviceId, track) {
			this.#release(kind);
			this.#tracks.set(kind, {
				track,
				deviceId,
				unwatch: this.#watchEnd(kind, track)
			});
		}
		#watchEnd(kind, track) {
			const onEnded = () => this.#onTrackEnded(kind);
			track.addEventListener(TRACK_ENDED_EVENT, onEnded);
			return () => track.removeEventListener(TRACK_ENDED_EVENT, onEnded);
		}
		#onTrackEnded(kind) {
			const stored = this.#tracks.get(kind);
			if (stored === undefined) {
				return;
			}
			stored.unwatch();
			this.#tracks.delete(kind);
			if (kind === LocalMediaKind.Screen) {
				this.#endScreenAudio();
			}
			if (this.#closed) {
				return;
			}
			this.#listener.onLocalTrackEnded(kind);
		}
		#endScreenAudio() {
			if (!this.#tracks.has(LocalMediaKind.ScreenAudio)) {
				return;
			}
			this.#release(LocalMediaKind.ScreenAudio);
			this.#listener.onLocalTrackEnded(LocalMediaKind.ScreenAudio);
		}
		#release(kind) {
			const stored = this.#tracks.get(kind);
			if (stored === undefined) {
				return;
			}
			stored.unwatch();
			this.#tracks.delete(kind);
			stored.track.stop();
		}
		#onDeviceChange() {
			if (this.#closed) {
				return;
			}
			this.#listener.onDeviceListChanged();
		}
	}

	const EscalationContractCode = Object.freeze({
		AlreadyRunning: 'escalation.already_running',
		AlreadyEscalated: 'escalation.already_escalated',
		Closed: 'escalation.closed'
	});
	const SWAP_STARTED = 'escalation: a swap of the media plane to the sfu started';
	const SWAP_COMMITTED = 'escalation: the sfu reached commit and serves the media from now on';
	const SWAP_LOST = 'escalation: the sfu did not reach commit, the mesh keeps serving';
	const SWAP_HELD_DELIVERED = 'escalation: what the sfu reported before the commit went on once it took over';
	const SURFACE_UNSETTLED = 'escalation: a surface stated while the swap ran did not settle on the sfu';
	const SWAP_ABANDONED = 'escalation: the swap committed, but the call was left or closed before it answered';
	const SwapStage = Object.freeze({
		Acquisition: 'acquisition',
		Connect: 'connect',
		Publish: 'publish',
		Closed: 'closed',
		Disconnected: 'disconnected'
	});
	const MESH_EPOCH = 0;
	const PlaneVoice = Object.freeze({
		Heard: 'heard',
		Held: 'held',
		Dropped: 'dropped'
	});
	const UNPUBLISHED = null;
	const SURFACE_INTENTS = {
		[LocalMediaKind.Microphone]: {
			publish: (transport, track) => transport.publishAudio(track),
			unpublish: transport => transport.unpublishAudio()
		},
		[LocalMediaKind.Camera]: {
			publish: (transport, track) => transport.publishVideo(track),
			unpublish: transport => transport.unpublishVideo()
		},
		[LocalMediaKind.Screen]: {
			publish: (transport, track) => transport.publishScreen(track),
			unpublish: transport => transport.unpublishScreen()
		},
		[LocalMediaKind.ScreenAudio]: {
			publish: (transport, track) => transport.publishScreenAudio(track),
			unpublish: transport => transport.unpublishScreenAudio()
		}
	};
	const SURFACES = Object.keys(SURFACE_INTENTS);
	function alreadyCarried(intended, carried) {
		return intended === (carried ?? UNPUBLISHED);
	}
	function refusal(code) {
		return {
			kind: 'contract',
			code
		};
	}
	function cancelled$1() {
		return {
			kind: 'cancelled'
		};
	}
	function asJwt(request) {
		return {
			...request,
			scheme: CallScheme.Jwt
		};
	}
	class EpochGuardedListener {
		#epoch;
		#voiceOf;
		#consumer;
		#held = [];
		constructor(epoch, voiceOf, consumer) {
			this.#epoch = epoch;
			this.#voiceOf = voiceOf;
			this.#consumer = consumer;
		}
		onRemoteTrackAdded(participantId, track) {
			this.#tell(consumer => consumer.onRemoteTrackAdded(participantId, track));
		}
		onRemoteTrackRemoved(participantId, kind) {
			this.#tell(consumer => consumer.onRemoteTrackRemoved(participantId, kind));
		}
		onRemoteTrackMuted(participantId, kind, isMuted) {
			this.#tell(consumer => consumer.onRemoteTrackMuted(participantId, kind, isMuted));
		}
		onConnectionQualityChanged(participantId, quality) {
			this.#tell(consumer => consumer.onConnectionQualityChanged(participantId, quality));
		}
		onReconnecting() {
			this.#tell(consumer => consumer.onReconnecting());
		}
		onReconnected() {
			this.#tell(consumer => consumer.onReconnected());
		}
		onFailure(error) {
			this.#tell(consumer => consumer.onFailure(error));
		}
		onUnresolvedRemoteTrack(endpointId, track) {
			this.#tell(consumer => consumer.onUnresolvedRemoteTrack(endpointId, track));
		}
		onUnresolvedRemoteTrackDropped(endpointId, error) {
			this.#tell(consumer => consumer.onUnresolvedRemoteTrackDropped(endpointId, error));
		}
		release() {
			const held = this.#held;
			this.#held = [];
			return held.reduce((delivered, tell) => delivered + (this.#tell(tell) ? 1 : 0), 0);
		}
		discard() {
			this.#held = [];
		}
		#tell(deliver) {
			const voice = this.#voiceOf(this.#epoch);
			if (voice === PlaneVoice.Held) {
				this.#held.push(deliver);
				return false;
			}
			if (voice !== PlaneVoice.Heard) {
				return false;
			}
			deliver(this.#consumer);
			return true;
		}
	}
	class EscalatableMediaTransport {
		#createSfuTransport;
		#acquisition;
		#localMedia;
		#listener;
		#logger;
		#plane;
		#intended = new Map();
		#reconciliation = undefined;
		#epoch = MESH_EPOCH;
		#isSwapping = false;
		#isSwapCancelled = false;
		#hasEscalated = false;
		#closed = false;
		constructor(options) {
			this.#createSfuTransport = options.createSfuTransport;
			this.#acquisition = options.acquisition;
			this.#localMedia = options.localMedia;
			this.#listener = options.listener;
			this.#logger = options.logger;
			this.#plane = {
				transport: options.createMeshTransport(this.#guard(MESH_EPOCH)),
				epoch: MESH_EPOCH
			};
		}
		connect(descriptor) {
			return this.#apply(plane => plane.connect(descriptor));
		}
		disconnect() {
			if (this.#isSwapping) {
				this.#isSwapCancelled = true;
			}
			return this.#apply(plane => plane.disconnect());
		}
		publishAudio(track) {
			return this.#stateSurface(LocalMediaKind.Microphone, track);
		}
		unpublishAudio() {
			return this.#stateSurface(LocalMediaKind.Microphone, UNPUBLISHED);
		}
		publishVideo(track) {
			return this.#stateSurface(LocalMediaKind.Camera, track);
		}
		unpublishVideo() {
			return this.#stateSurface(LocalMediaKind.Camera, UNPUBLISHED);
		}
		publishScreen(track) {
			return this.#stateSurface(LocalMediaKind.Screen, track);
		}
		unpublishScreen() {
			return this.#stateSurface(LocalMediaKind.Screen, UNPUBLISHED);
		}
		publishScreenAudio(track) {
			return this.#stateSurface(LocalMediaKind.ScreenAudio, track);
		}
		unpublishScreenAudio() {
			return this.#stateSurface(LocalMediaKind.ScreenAudio, UNPUBLISHED);
		}
		setRemoteQuality(participantId, quality) {
			return this.#apply(plane => plane.setRemoteQuality(participantId, quality));
		}
		async escalate(request) {
			if (this.#closed) {
				return err(refusal(EscalationContractCode.Closed));
			}
			if (this.#hasEscalated) {
				return err(refusal(EscalationContractCode.AlreadyEscalated));
			}
			if (this.#isSwapping) {
				return err(refusal(EscalationContractCode.AlreadyRunning));
			}
			this.#isSwapping = true;
			this.#isSwapCancelled = false;
			try {
				return await this.#swapToSfu(request);
			} finally {
				this.#isSwapping = false;
			}
		}
		close() {
			if (this.#closed) {
				return;
			}
			this.#closed = true;
			this.#plane.transport.close();
		}
		async #swapToSfu(request) {
			this.#epoch += 1;
			const epoch = this.#epoch;
			this.#logger.log(SWAP_STARTED, {
				epoch
			});
			const acquired = await this.#acquisition.acquire(asJwt(request));
			if (isErr(acquired)) {
				return this.#givenUpOr(SwapStage.Acquisition, epoch, acquired.error);
			}
			const guard = this.#guard(epoch);
			const sfu = this.#createSfuTransport(acquired.value, guard);
			const commit = await this.#reachCommit(sfu, acquired.value, epoch);
			if (isErr(commit)) {
				sfu.close();
				guard.discard();
				return commit;
			}
			if (this.#isSwapGivenUp()) {
				sfu.close();
				guard.discard();
				return this.#abandoned(epoch);
			}
			const previous = this.#plane;
			this.#plane = {
				transport: sfu,
				epoch
			};
			this.#hasEscalated = true;
			previous.transport.close();
			this.#logger.log(SWAP_COMMITTED, {
				epoch,
				surfaces: commit.value.map(surface => surface.kind)
			});
			const reconciled = this.#reconcile(sfu, commit.value, epoch);
			this.#deliverHeld(guard, epoch);
			await reconciled;
			if (this.#isSwapGivenUp()) {
				return this.#abandonedAfterCommit(epoch);
			}
			return ok(undefined);
		}
		async #reachCommit(sfu, descriptor, epoch) {
			if (this.#isSwapGivenUp()) {
				return this.#abandoned(epoch);
			}
			const connected = await sfu.connect(descriptor);
			if (isErr(connected)) {
				return this.#givenUpOr(SwapStage.Connect, epoch, connected.error);
			}
			const held = this.#heldSurfaces();
			for (const surface of held) {
				if (this.#isSwapGivenUp()) {
					return this.#abandoned(epoch);
				}
				const published = await SURFACE_INTENTS[surface.kind].publish(sfu, surface.track);
				if (isErr(published)) {
					return this.#givenUpOr(SwapStage.Publish, epoch, published.error, {
						surface: surface.kind
					});
				}
			}
			return ok(held);
		}
		#stateSurface(kind, track) {
			this.#intended.set(kind, track);
			const intents = SURFACE_INTENTS[kind];
			return this.#apply(plane => {
				return track === UNPUBLISHED ? intents.unpublish(plane) : intents.publish(plane, track);
			});
		}
		#apply(intent) {
			const reconciliation = this.#reconciliation;
			if (reconciliation === undefined) {
				return this.#takeToPlane(intent);
			}
			return reconciliation.then(() => this.#takeToPlane(intent));
		}
		#takeToPlane(intent) {
			if (this.#closed) {
				return Promise.resolve(err(refusal(EscalationContractCode.Closed)));
			}
			return intent(this.#plane.transport);
		}
		#reconcile(sfu, carried, epoch) {
			const settled = this.#settleSurfaces(sfu, carried, epoch);
			this.#reconciliation = settled;
			return settled.finally(() => {
				this.#reconciliation = undefined;
			});
		}
		async #settleSurfaces(sfu, carried, epoch) {
			const intended = new Map(this.#intended);
			const published = new Map(carried.map(surface => [surface.kind, surface.track]));
			for (const kind of SURFACES) {
				if (this.#closed) {
					return;
				}
				const intent = intended.get(kind);
				if (intent === undefined || alreadyCarried(intent, published.get(kind))) {
					continue;
				}
				const intents = SURFACE_INTENTS[kind];
				const settled = intent === UNPUBLISHED ? await intents.unpublish(sfu) : await intents.publish(sfu, intent);
				if (isErr(settled)) {
					this.#logger.error(SURFACE_UNSETTLED, {
						epoch,
						surface: kind,
						kind: settled.error.kind
					});
				}
			}
		}
		#heldSurfaces() {
			return SURFACES.map(kind => ({
				kind,
				track: this.#localMedia.getTrack(kind)
			})).filter(surface => {
				return surface.track !== undefined && this.#intended.get(surface.kind) === surface.track && surface.track.readyState !== 'ended';
			});
		}
		#guard(epoch) {
			return new EpochGuardedListener(epoch, planeEpoch => this.#voiceOf(planeEpoch), this.#listener);
		}
		#voiceOf(epoch) {
			if (this.#closed) {
				return PlaneVoice.Dropped;
			}
			if (epoch === this.#plane.epoch) {
				return PlaneVoice.Heard;
			}
			return epoch > this.#plane.epoch ? PlaneVoice.Held : PlaneVoice.Dropped;
		}
		#deliverHeld(guard, epoch) {
			const delivered = guard.release();
			if (delivered > 0) {
				this.#logger.log(SWAP_HELD_DELIVERED, {
					epoch,
					events: delivered
				});
			}
		}
		#isSwapGivenUp() {
			return this.#closed || this.#isSwapCancelled;
		}
		#abandoned(epoch) {
			return this.#lost(this.#givenUpStage(), epoch, cancelled$1());
		}
		#givenUpOr(stage, epoch, error, details) {
			return this.#isSwapGivenUp() ? this.#abandoned(epoch) : this.#lost(stage, epoch, error, details);
		}
		#abandonedAfterCommit(epoch) {
			const error = cancelled$1();
			this.#logger.error(SWAP_ABANDONED, {
				epoch,
				stage: this.#givenUpStage(),
				kind: error.kind
			});
			return err(error);
		}
		#givenUpStage() {
			return this.#closed ? SwapStage.Closed : SwapStage.Disconnected;
		}
		#lost(stage, epoch, error, details) {
			this.#logger.error(SWAP_LOST, {
				epoch,
				stage,
				kind: error.kind,
				...details
			});
			return err(error);
		}
	}

	const MediaTrackKind = Object.freeze({
		Audio: 'audio',
		Video: 'video',
		Screen: 'screen',
		ScreenAudio: 'screen-audio'
	});

	const RemoteMediaContractCode = Object.freeze({
		EndpointUnresolvable: 'remote_media.endpoint_unresolvable'
	});
	class RosterParticipantResolver {
		#roster = new Set();
		#mediaEndpoints = new Map();
		#subscribers = new Set();
		resolveSender(senderId) {
			return this.#roster.has(senderId) ? senderId : null;
		}
		resolveMediaEndpoint(mediaEndpointId) {
			return this.#mediaEndpoints.get(mediaEndpointId) ?? null;
		}
		setRoster(participants) {
			this.#roster = new Set(participants);
		}
		mapMediaEndpoint(mediaEndpointId, participantId) {
			this.#mediaEndpoints.set(mediaEndpointId, participantId);
			this.#announce(subscriber => subscriber.onMediaEndpointResolved(mediaEndpointId, participantId));
		}
		dropMediaEndpoint(mediaEndpointId) {
			this.#mediaEndpoints.delete(mediaEndpointId);
			this.#announce(subscriber => subscriber.onMediaEndpointUnresolvable(mediaEndpointId));
		}
		subscribeResolution(listener) {
			this.#subscribers.add(listener);
			return () => {
				this.#subscribers.delete(listener);
			};
		}
		#announce(tell) {
			[...this.#subscribers].forEach(tell);
		}
	}
	const MEDIA_HELD = 'participant resolution: remote media is held until its endpoint is mapped';
	const MEDIA_RELEASED = 'participant resolution: the mapping arrived and the held remote media went on';
	const MEDIA_REFUSED = 'participant resolution: the endpoint of held remote media will not be mapped';
	function unresolvable() {
		return {
			kind: 'contract',
			code: RemoteMediaContractCode.EndpointUnresolvable
		};
	}
	class RemoteMediaResolution {
		#participants;
		#listener;
		#logger;
		#held = new Map();
		#unsubscribe;
		#closed = false;
		constructor(options) {
			this.#participants = options.participants;
			this.#listener = options.listener;
			this.#logger = options.logger;
			this.#unsubscribe = options.participants.subscribeResolution(this);
		}
		takeRemoteTrack(mediaEndpointId, track) {
			if (this.#closed) {
				return;
			}
			const participantId = this.#participants.resolveMediaEndpoint(mediaEndpointId);
			if (participantId === null) {
				this.#hold(mediaEndpointId, track);
				return;
			}
			this.#listener.onRemoteTrackAdded(participantId, track);
		}
		onMediaEndpointResolved(mediaEndpointId, participantId) {
			const released = this.#letGo(mediaEndpointId);
			if (released.length === 0) {
				return;
			}
			this.#logger.log(MEDIA_RELEASED, {
				tracks: released.length
			});
			released.forEach(track => this.#listener.onRemoteTrackAdded(participantId, track));
		}
		onMediaEndpointUnresolvable(mediaEndpointId) {
			const refused = this.#letGo(mediaEndpointId);
			if (refused.length === 0) {
				return;
			}
			this.#logger.error(MEDIA_REFUSED, {
				tracks: refused.length
			});
			this.#listener.onUnresolvedRemoteTrackDropped(mediaEndpointId, unresolvable());
		}
		close() {
			this.#closed = true;
			this.#unsubscribe?.();
			this.#unsubscribe = undefined;
			this.#held.clear();
		}
		#hold(mediaEndpointId, track) {
			const held = this.#held.get(mediaEndpointId) ?? [];
			held.push(track);
			this.#held.set(mediaEndpointId, held);
			this.#logger.warn(MEDIA_HELD, {
				tracks: held.length
			});
			this.#listener.onUnresolvedRemoteTrack(mediaEndpointId, track);
		}
		#letGo(mediaEndpointId) {
			if (this.#closed) {
				return [];
			}
			const held = this.#held.get(mediaEndpointId) ?? [];
			this.#held.delete(mediaEndpointId);
			return held;
		}
	}

	const SIGNALS = {
		negotiationNeeded: 'negotiationNeeded',
		offer: 'connectionOffer',
		answer: 'connectionAnswer',
		iceCandidates: 'iceCandidate'
	};
	const ICE_BATCH_DEBOUNCE_MS = 500;
	const NOTHING_TO_APPLY = 'negotiation channel: an incoming message carries nothing to apply';
	const ANOTHER_CONNECTION = 'negotiation channel: an incoming message names another connection';
	const CANDIDATES_DISCARDED = 'negotiation channel: candidates of a replaced connection are discarded';
	function readWireText$1(value) {
		return typeof value === 'string' ? value : undefined;
	}
	function readMid(value) {
		return typeof value === 'string' ? value : null;
	}
	function readTracks(value) {
		const tracks = isWireRecord(value) ? value : {};
		return {
			audio: readMid(tracks.audio),
			video: readMid(tracks.video),
			screen: readMid(tracks.screen),
			sharingAudio: readMid(tracks.sharingAudio)
		};
	}
	function readDescription(payload) {
		const connectionId = readWireText$1(payload.connectionId);
		const sdp = readWireText$1(payload.sdp);
		if (connectionId === undefined || sdp === undefined) {
			return undefined;
		}
		return {
			connectionId,
			sdp,
			tracks: readTracks(payload.tracks)
		};
	}
	function readCandidates(value) {
		if (!Array.isArray(value)) {
			return [];
		}
		return value.filter(entry => isWireRecord(entry));
	}
	class NegotiationChannel {
		#pull;
		#clock;
		#listener;
		#logger;
		#userAgent;
		#connections = new Map();
		#iceBatches = new Map();
		#closed = false;
		constructor(options) {
			this.#pull = options.pull;
			this.#clock = options.clock;
			this.#listener = options.listener;
			this.#logger = options.logger;
			this.#userAgent = options.userAgent;
		}
		sendNegotiationNeeded(to, negotiation = {}) {
			if (this.#closed) {
				return;
			}
			this.#publish(to, SIGNALS.negotiationNeeded, negotiation.isRestart === true ? {
				restart: true
			} : {});
		}
		sendOffer(to, offer) {
			if (this.#closed) {
				return;
			}
			this.#connections.set(to, offer.connectionId);
			this.#publish(to, SIGNALS.offer, this.#describe(offer));
		}
		sendAnswer(to, answer) {
			if (this.#closed) {
				return;
			}
			this.#publish(to, SIGNALS.answer, this.#describe(answer));
		}
		sendIceCandidates(to, batch) {
			if (this.#closed || batch.candidates.length === 0) {
				return;
			}
			const pending = this.#batchFor(to, batch.connectionId);
			pending.candidates.push(...batch.candidates);
			pending.cancelDebounce?.();
			pending.cancelDebounce = this.#clock.scheduleOnce(() => this.#flush(to), ICE_BATCH_DEBOUNCE_MS);
		}
		close() {
			if (this.#closed) {
				return;
			}
			this.#closed = true;
			this.#iceBatches.forEach(pending => pending.cancelDebounce?.());
			this.#iceBatches.clear();
			this.#connections.clear();
		}
		onNegotiationNeeded(from, payload) {
			if (this.#closed) {
				return;
			}
			this.#listener.onNegotiationNeeded(from, payload.restart === true);
		}
		onConnectionOffer(from, payload) {
			if (this.#closed) {
				return;
			}
			const offer = this.#read(SIGNALS.offer, payload);
			if (offer === undefined) {
				return;
			}
			const inFlight = this.#connections.get(from);
			const superseded = inFlight === undefined || inFlight === offer.connectionId ? null : inFlight;
			this.#connections.set(from, offer.connectionId);
			if (superseded !== null) {
				this.#discardBatch(from, superseded);
			}
			this.#listener.onConnectionOffer(from, {
				...offer,
				supersededConnectionId: superseded
			});
		}
		onConnectionAnswer(from, payload) {
			if (this.#closed) {
				return;
			}
			const answer = this.#read(SIGNALS.answer, payload);
			if (answer === undefined || !this.#isInFlight(SIGNALS.answer, from, answer.connectionId)) {
				return;
			}
			this.#listener.onConnectionAnswer(from, answer);
		}
		onIceCandidate(from, payload) {
			if (this.#closed) {
				return;
			}
			const connectionId = readWireText$1(payload.connectionId);
			const candidates = readCandidates(payload.candidates);
			if (connectionId === undefined || candidates.length === 0) {
				this.#logger.warn(NOTHING_TO_APPLY, {
					signal: SIGNALS.iceCandidates
				});
				return;
			}
			if (!this.#isInFlight(SIGNALS.iceCandidates, from, connectionId)) {
				return;
			}
			this.#listener.onIceCandidates(from, {
				connectionId,
				candidates
			});
		}
		#describe(description) {
			return {
				connectionId: description.connectionId,
				sdp: description.sdp,
				tracks: description.tracks,
				userAgent: this.#userAgent
			};
		}
		#publish(to, signal, payload) {
			this.#pull.publish([to], signal, {
				...payload,
				userId: to
			});
		}
		#read(signal, payload) {
			const description = readDescription(payload);
			if (description === undefined) {
				this.#logger.warn(NOTHING_TO_APPLY, {
					signal
				});
			}
			return description;
		}
		#isInFlight(signal, from, connectionId) {
			const inFlight = this.#connections.get(from);
			if (inFlight === connectionId) {
				return true;
			}
			this.#logger.log(ANOTHER_CONNECTION, {
				signal,
				from,
				connectionId,
				inFlight
			});
			return false;
		}
		#batchFor(to, connectionId) {
			const pending = this.#iceBatches.get(to);
			if (pending !== undefined && pending.connectionId === connectionId) {
				return pending;
			}
			if (pending !== undefined) {
				this.#discardBatch(to, pending.connectionId);
			}
			const fresh = {
				connectionId,
				candidates: [],
				cancelDebounce: undefined
			};
			this.#iceBatches.set(to, fresh);
			return fresh;
		}
		#discardBatch(to, connectionId) {
			const pending = this.#iceBatches.get(to);
			if (pending === undefined || pending.connectionId !== connectionId) {
				return;
			}
			pending.cancelDebounce?.();
			this.#iceBatches.delete(to);
			this.#logger.log(CANDIDATES_DISCARDED, {
				to,
				connectionId,
				count: pending.candidates.length
			});
		}
		#flush(to) {
			const pending = this.#iceBatches.get(to);
			if (pending === undefined) {
				return;
			}
			this.#iceBatches.delete(to);
			this.#publish(to, SIGNALS.iceCandidates, {
				connectionId: pending.connectionId,
				candidates: pending.candidates
			});
		}
	}

	const ReconnectContractCode = Object.freeze({
		AlreadyRunning: 'reconnect.already_running',
		Closed: 'reconnect.closed'
	});
	const CYCLE_STARTED = 'reconnect: a cycle of recovery started';
	const ATTEMPT_FAILED = 'reconnect: an attempt of recovery failed, another one follows';
	const RECONNECTED = 'reconnect: the connection is back';
	const RECOVERY_LOST = 'reconnect: recovery is over and the connection is not back';
	const ATTEMPT_THREW = 'reconnect: an attempt of recovery threw instead of answering';
	const RETRYABLE_KINDS = ['network', 'timeout'];
	function refused(code) {
		const error = {
			kind: 'contract',
			code
		};
		return err(error);
	}
	function cancelled() {
		const error = {
			kind: 'cancelled'
		};
		return err(error);
	}
	function isFatal(error) {
		return !RETRYABLE_KINDS.includes(error.kind);
	}
	class ReconnectController {
		#clock;
		#budget;
		#attempt;
		#listener;
		#logger;
		#unsubscribeOnlineChange;
		#wasOnline;
		#running = false;
		#closed = false;
		#cancelPause = undefined;
		#wake = undefined;
		constructor(options) {
			this.#clock = options.clock;
			this.#budget = options.budget;
			this.#attempt = options.attempt;
			this.#listener = options.listener;
			this.#logger = options.logger;
			this.#wasOnline = options.environment.isOnline();
			this.#unsubscribeOnlineChange = options.environment.subscribeOnlineChange(isOnline => this.#onOnlineChange(isOnline));
		}
		async run() {
			if (this.#closed) {
				return refused(ReconnectContractCode.Closed);
			}
			if (this.#running) {
				return refused(ReconnectContractCode.AlreadyRunning);
			}
			this.#running = true;
			try {
				this.#listener.onReconnecting();
				this.#logger.log(CYCLE_STARTED, {
					maxAttempts: this.#budget.maxAttempts
				});
				return await this.#runAttempts();
			} finally {
				this.#running = false;
			}
		}
		close() {
			if (this.#closed) {
				return;
			}
			this.#closed = true;
			this.#unsubscribeOnlineChange();
			this.#cancelPause?.();
			this.#endPause();
		}
		async #runAttempts() {
			let attempts = 0;
			for (;;) {
				if (this.#closed) {
					return cancelled();
				}
				const result = await this.#attempt();
				attempts += 1;
				if (this.#closed) {
					return cancelled();
				}
				if (isOk(result)) {
					this.#listener.onReconnected();
					this.#logger.log(RECONNECTED, {
						attempts
					});
					return ok(undefined);
				}
				if (isFatal(result.error) || attempts >= this.#budget.maxAttempts) {
					this.#listener.onFailure(result.error);
					this.#logger.error(RECOVERY_LOST, {
						attempts,
						kind: result.error.kind
					});
					return err(result.error);
				}
				const delayMs = this.#pauseAfter(attempts);
				this.#logger.warn(ATTEMPT_FAILED, {
					attempt: attempts,
					kind: result.error.kind,
					delayMs
				});
				await this.#pause(delayMs);
				if (this.#closed) {
					return cancelled();
				}
			}
		}
		#pauseAfter(attempts) {
			const delayMs = this.#budget.backoffMs?.(attempts) ?? 0;
			return Number.isFinite(delayMs) && delayMs > 0 ? delayMs : 0;
		}
		#pause(delayMs) {
			if (delayMs === 0) {
				return Promise.resolve();
			}
			return new Promise(resolve => {
				this.#wake = resolve;
				this.#cancelPause = this.#clock.scheduleOnce(() => this.#endPause(), delayMs);
			});
		}
		#endPause() {
			const wake = this.#wake;
			this.#cancelPause = undefined;
			this.#wake = undefined;
			wake?.();
		}
		#onOnlineChange(isOnline) {
			const cameBack = isOnline && !this.#wasOnline;
			this.#wasOnline = isOnline;
			if (!cameBack) {
				return;
			}
			this.run().catch(() => this.#logger.error(ATTEMPT_THREW));
		}
	}

	const PULL_MODULE_ID = 'im';
	const SIGNAL_PREFIX = 'Call::';
	const INCOMING_CHANNELS = [{
		eventName: 'onPullEvent-call',
		origin: 'server'
	}, {
		eventName: 'onPullEvent-im',
		origin: 'server'
	}, {
		eventName: 'onPullClientEvent-im',
		origin: 'client'
	}];
	const CLIENT_SENDER_TYPE = 1;
	const DEFAULT_EXPIRY_SECONDS = 5;
	const PUBLISH_FAILED = 'pull: publishing a signal failed';
	const ENVELOPE_FIELDS = ['callInstanceId', 'senderId', 'callId', 'requestId', 'publicIds'];
	function createUuidV4() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, placeholder => {
			const random = Math.floor(Math.random() * 16);
			const value = placeholder === 'x' ? random : random & 0x3 | 0x8;
			return value.toString(16);
		});
	}
	function isThenable(value) {
		return typeof value === 'object' && value !== null && typeof value.then === 'function';
	}
	function readWireText(value) {
		return typeof value === 'string' ? value : undefined;
	}
	function readPublicIds(value) {
		if (!isWireRecord(value)) {
			return [];
		}
		return Object.values(value).map(descriptor => readChannelDescriptor(descriptor)).filter(descriptor => descriptor !== undefined);
	}
	function readChannelDescriptor(value) {
		if (!isWireRecord(value)) {
			return undefined;
		}
		const userId = readWireId(value.user_id);
		const publicId = readWireId(value.public_id);
		const signature = readWireText(value.signature);
		const start = readWireText(value.start);
		const end = readWireText(value.end);
		if (userId === undefined || publicId === undefined || signature === undefined || start === undefined || end === undefined) {
			return undefined;
		}
		return {
			user_id: userId,
			public_id: publicId,
			signature,
			start,
			end
		};
	}
	function readSenderType(extra) {
		const sender = isWireRecord(extra) ? extra.sender : undefined;
		const type = isWireRecord(sender) ? sender.type : undefined;
		return typeof type === 'number' ? type : undefined;
	}
	function readSenderChannelId(extra) {
		const sender = isWireRecord(extra) ? extra.sender : undefined;
		return isWireRecord(sender) ? readWireId(sender.id) : undefined;
	}
	function readPayload(envelope) {
		return Object.fromEntries(Object.entries(envelope).filter(([field]) => !ENVELOPE_FIELDS.includes(field)));
	}
	class BxPullPort {
		#pull;
		#events;
		#context;
		#logger;
		#createRequestId;
		#channelOwners = new Map();
		constructor(options) {
			this.#pull = options.pull;
			this.#events = options.events;
			this.#context = options.context;
			this.#logger = options.logger;
			this.#createRequestId = options.requestIdFactory ?? createUuidV4;
		}
		publish(recipients, signal, payload, expirySeconds) {
			const sent = this.#pull.sendMessage(recipients, PULL_MODULE_ID, `${SIGNAL_PREFIX}${signal}`, {
				...payload,
				callInstanceId: this.#context.callInstanceId,
				senderId: this.#context.senderId,
				callId: this.#context.callId,
				requestId: this.#createRequestId()
			}, expirySeconds ?? DEFAULT_EXPIRY_SECONDS);
			if (isThenable(sent)) {
				sent.catch(() => this.#logger.warn(PUBLISH_FAILED, {
					signal
				}));
			}
		}
		subscribeIncoming(listener) {
			const handlers = INCOMING_CHANNELS.map(channel => {
				const handler = (command, params, extra) => {
					this.#onIncoming(command, params, extra, channel.origin, listener);
				};
				this.#events.addCustomEvent(channel.eventName, handler);
				return {
					eventName: channel.eventName,
					handler
				};
			});
			return () => {
				handlers.forEach(({
					eventName,
					handler
				}) => this.#events.removeCustomEvent(eventName, handler));
			};
		}
		isPublishingSupported() {
			return this.#pull.isPublishingSupported();
		}
		isPublishingEnabled() {
			return this.#pull.isPublishingEnabled();
		}
		applyAddressing(publicChannels) {
			this.#holdPublicIds(publicChannels);
		}
		#onIncoming(command, params, extra, channelOrigin, listener) {
			if (!command.startsWith(SIGNAL_PREFIX)) {
				return;
			}
			const envelope = isWireRecord(params) ? params : {};
			const callId = readWireId(envelope.callId);
			const origin = this.#readOrigin(extra, channelOrigin);
			if (callId === this.#context.callId && origin === 'server') {
				this.#holdPublicIds(envelope.publicIds);
			}
			listener({
				signal: command.slice(SIGNAL_PREFIX.length),
				callInstanceId: readWireId(envelope.callInstanceId),
				senderId: readWireId(envelope.senderId),
				callId,
				requestId: readWireId(envelope.requestId),
				origin,
				channelSenderId: this.#readChannelSender(extra),
				payload: readPayload(envelope)
			});
		}
		#holdPublicIds(value) {
			const publicIds = readPublicIds(value);
			if (publicIds.length === 0) {
				return;
			}
			publicIds.forEach(descriptor => this.#channelOwners.set(descriptor.public_id, descriptor.user_id));
			this.#pull.setPublicIds(publicIds);
		}
		#readOrigin(extra, channelOrigin) {
			return readSenderType(extra) === CLIENT_SENDER_TYPE ? 'client' : channelOrigin;
		}
		#readChannelSender(extra) {
			const channelId = readSenderChannelId(extra);
			return channelId === undefined ? undefined : this.#channelOwners.get(channelId);
		}
	}

	const SUCCESS_STATUS = 'success';
	const NO_ANSWER_CODE = 'NETWORK_ERROR';
	const UNNAMED_ERROR_CODE = 'unknown';
	function isActionAnswer(value) {
		return isWireRecord(value) && 'status' in value;
	}
	function readFirstError(answer) {
		const errors = Array.isArray(answer.errors) ? answer.errors : [];
		const first = errors.find(entry => isWireRecord(entry));
		return isWireRecord(first) ? {
			code: first.code,
			message: first.message
		} : undefined;
	}
	function readErrorCode(code) {
		if (typeof code === 'number') {
			return code;
		}
		return typeof code === 'string' && code.length > 0 ? code : UNNAMED_ERROR_CODE;
	}
	function readErrorMessage(message) {
		return typeof message === 'string' && message.length > 0 ? message : undefined;
	}
	function toTransportError$1(rejection) {
		if (!isActionAnswer(rejection)) {
			return {
				kind: 'network',
				cause: rejection
			};
		}
		const first = readFirstError(rejection);
		if (first === undefined) {
			return {
				kind: 'contract',
				code: UNNAMED_ERROR_CODE
			};
		}
		if (first.code === NO_ANSWER_CODE) {
			return {
				kind: 'network',
				cause: rejection
			};
		}
		return {
			kind: 'contract',
			code: readErrorCode(first.code),
			message: readErrorMessage(first.message)
		};
	}
	class BxRestPort {
		#ajax;
		constructor(ajax) {
			this.#ajax = ajax;
		}
		async callAction(action, payload) {
			try {
				const answer = await this.#ajax.runAction(action, {
					data: payload
				});
				if (!isActionAnswer(answer) || answer.status !== SUCCESS_STATUS) {
					return err(toTransportError$1(answer));
				}
				return ok(answer.data);
			} catch (rejection) {
				return err(toTransportError$1(rejection));
			}
		}
	}

	const ABORT_ERROR_NAME = 'AbortError';
	const TIMEOUT_ERROR_NAME = 'TimeoutError';
	function readFailureName(failure) {
		if (typeof failure !== 'object' || failure === null) {
			return '';
		}
		const {
			name
		} = failure;
		return typeof name === 'string' ? name : '';
	}
	function toTransportError(failure, signal) {
		const name = readFailureName(failure);
		if (name === ABORT_ERROR_NAME || name === '' && signal?.aborted === true) {
			return {
				kind: 'cancelled'
			};
		}
		if (name === TIMEOUT_ERROR_NAME) {
			return {
				kind: 'timeout'
			};
		}
		return {
			kind: 'network',
			cause: failure
		};
	}
	class FetchHttpPort {
		#fetch;
		constructor(fetchPrimitive) {
			this.#fetch = fetchPrimitive;
		}
		async request(request) {
			try {
				const response = await this.#fetch(request.url, {
					method: request.method,
					headers: request.headers,
					body: request.body,
					signal: request.signal
				});
				return ok({
					status: response.status,
					ok: response.ok,
					body: await response.text()
				});
			} catch (failure) {
				return err(toTransportError(failure, request.signal));
			}
		}
	}

	const DEVICE_CHANGE_DEBOUNCE_MS = 500;
	const DEVICE_CHANGE_EVENT = 'devicechange';
	const OVERCONSTRAINED_ERROR = 'OverconstrainedError';
	const USER_MEDIA_DENIAL_ERRORS = ['NotAllowedError', 'PermissionDeniedError'];
	const SCREEN_PICKER_DENIAL_ERRORS = ['NotAllowedError', 'AbortError'];
	const DENIED_USER_MEDIA = 'user-media';
	const DENIED_SCREEN_PICKER = 'screen-picker';
	const DENIED_UNSUPPORTED = 'unsupported';
	const VIRTUAL_DEVICE_LABELS = ['(virtual)', 'zoomaudiodevice', 'microsoft teams audio', 'bitrixaudio'];
	const DUPLICATE_DEVICE_ID = 'communications';
	const AUDIO_DEVICE_KINDS = ['audioinput', 'audiooutput'];
	function isPlainRecord(value) {
		return typeof value === 'object' && value !== null && !Array.isArray(value);
	}
	function denied(reason) {
		return {
			kind: 'denied',
			reason
		};
	}
	function readErrorName(error) {
		if (!isPlainRecord(error)) {
			return undefined;
		}
		return typeof error.name === 'string' ? error.name : undefined;
	}
	function readOverconstrainedName(error) {
		if (readErrorName(error) !== OVERCONSTRAINED_ERROR || !isPlainRecord(error)) {
			return undefined;
		}
		return typeof error.constraint === 'string' ? error.constraint : undefined;
	}
	function relaxTrack(track, constraintName) {
		if (!isPlainRecord(track)) {
			return track;
		}
		const constraint = track[constraintName];
		if (!isPlainRecord(constraint) || !('exact' in constraint)) {
			return track;
		}
		const {
			exact,
			...rest
		} = constraint;
		return {
			...track,
			[constraintName]: {
				...rest,
				ideal: exact
			}
		};
	}
	function relaxExactToIdeal(constraints, constraintName) {
		if (constraintName === undefined || constraintName === '') {
			return constraints;
		}
		const audio = relaxTrack(constraints.audio, constraintName);
		const video = relaxTrack(constraints.video, constraintName);
		if (audio === constraints.audio && video === constraints.video) {
			return constraints;
		}
		return {
			...constraints,
			audio,
			video
		};
	}
	function classifyUserMediaError(error) {
		const name = readErrorName(error);
		if (name !== undefined && USER_MEDIA_DENIAL_ERRORS.includes(name)) {
			return denied(DENIED_USER_MEDIA);
		}
		return {
			kind: 'network',
			cause: error
		};
	}
	function isRealDevice(device) {
		if (!AUDIO_DEVICE_KINDS.includes(device.kind)) {
			return true;
		}
		if (device.deviceId === DUPLICATE_DEVICE_ID) {
			return false;
		}
		const label = device.label.toLowerCase();
		return !VIRTUAL_DEVICE_LABELS.some(virtualLabel => label.includes(virtualLabel));
	}
	class NavigatorMediaDevicesPort {
		#mediaDevices;
		#clock;
		#listeners = new Set();
		#detachPrimitive = undefined;
		#cancelDebounce = undefined;
		#disposed = false;
		constructor(options) {
			this.#mediaDevices = options.mediaDevices;
			this.#clock = options.clock;
		}
		async getUserMedia(constraints) {
			const primitive = this.#mediaDevices;
			if (primitive?.getUserMedia === undefined) {
				return err(denied(DENIED_UNSUPPORTED));
			}
			const request = primitive.getUserMedia.bind(primitive);
			try {
				return ok(await request(constraints));
			} catch (error) {
				const relaxed = relaxExactToIdeal(constraints, readOverconstrainedName(error));
				if (relaxed === constraints) {
					return err(classifyUserMediaError(error));
				}
				try {
					return ok(await request(relaxed));
				} catch (retryError) {
					return err(classifyUserMediaError(retryError));
				}
			}
		}
		async getDisplayMedia(constraints) {
			const primitive = this.#mediaDevices;
			if (primitive?.getDisplayMedia === undefined) {
				return err(denied(DENIED_UNSUPPORTED));
			}
			try {
				return ok(await primitive.getDisplayMedia(constraints));
			} catch (error) {
				const name = readErrorName(error);
				if (name !== undefined && SCREEN_PICKER_DENIAL_ERRORS.includes(name)) {
					return err(denied(DENIED_SCREEN_PICKER));
				}
				return err({
					kind: 'network',
					cause: error
				});
			}
		}
		async enumerateDevices() {
			const primitive = this.#mediaDevices;
			if (primitive?.enumerateDevices === undefined) {
				return err(denied(DENIED_UNSUPPORTED));
			}
			try {
				const devices = await primitive.enumerateDevices();
				return ok(devices.filter(device => isRealDevice(device)));
			} catch (error) {
				return err({
					kind: 'network',
					cause: error
				});
			}
		}
		subscribeDeviceChange(listener) {
			if (this.#disposed) {
				return () => {};
			}
			this.#listeners.add(listener);
			this.#attachPrimitive();
			return () => {
				this.#listeners.delete(listener);
			};
		}
		dispose() {
			this.#disposed = true;
			this.#cancelDebounce?.();
			this.#cancelDebounce = undefined;
			this.#detachPrimitive?.();
			this.#detachPrimitive = undefined;
			this.#listeners.clear();
		}
		#attachPrimitive() {
			const primitive = this.#mediaDevices;
			if (this.#detachPrimitive !== undefined || primitive?.addEventListener === undefined) {
				return;
			}
			const handler = () => this.#onPrimitiveDeviceChange();
			primitive.addEventListener(DEVICE_CHANGE_EVENT, handler);
			this.#detachPrimitive = () => primitive.removeEventListener?.(DEVICE_CHANGE_EVENT, handler);
		}
		#onPrimitiveDeviceChange() {
			this.#cancelDebounce?.();
			this.#cancelDebounce = this.#clock.scheduleOnce(() => {
				this.#cancelDebounce = undefined;
				[...this.#listeners].forEach(listener => listener());
			}, DEVICE_CHANGE_DEBOUNCE_MS);
		}
	}

	class TimerClockPort {
		#timers;
		#clock;
		constructor(options) {
			this.#timers = options.timers;
			this.#clock = options.clock;
		}
		now() {
			return this.#clock.now();
		}
		scheduleOnce(callback, delayMs) {
			let handle = undefined;
			const cancel = () => {
				if (handle !== undefined) {
					this.#timers.clearTimeout(handle);
					handle = undefined;
				}
			};
			handle = this.#timers.setTimeout(() => {
				handle = undefined;
				callback();
			}, delayMs);
			return cancel;
		}
		scheduleRepeating(callback, intervalMs) {
			let handle = this.#timers.setInterval(callback, intervalMs);
			return () => {
				if (handle !== undefined) {
					this.#timers.clearInterval(handle);
					handle = undefined;
				}
			};
		}
	}

	const ONLINE_EVENT = 'online';
	const OFFLINE_EVENT = 'offline';
	const VISIBILITY_EVENT = 'visibilitychange';
	const UNLOAD_EVENTS = ['pagehide'];
	const VISIBLE_STATE = 'visible';
	class BrowserEnvironmentPort {
		#pageEvents;
		#page;
		#network;
		#isDesktop;
		constructor(options) {
			this.#pageEvents = options.pageEvents;
			this.#page = options.page;
			this.#network = options.network;
			this.#isDesktop = options.isDesktop;
		}
		isOnline() {
			return this.#network.onLine;
		}
		subscribeOnlineChange(listener) {
			const onOnline = () => {
				listener(true);
			};
			const onOffline = () => {
				listener(false);
			};
			this.#pageEvents.addEventListener(ONLINE_EVENT, onOnline);
			this.#pageEvents.addEventListener(OFFLINE_EVENT, onOffline);
			return () => {
				this.#pageEvents.removeEventListener(ONLINE_EVENT, onOnline);
				this.#pageEvents.removeEventListener(OFFLINE_EVENT, onOffline);
			};
		}
		isVisible() {
			return this.#page.visibilityState === VISIBLE_STATE;
		}
		subscribeVisibilityChange(listener) {
			const onVisibilityChange = () => {
				listener(this.isVisible());
			};
			this.#page.addEventListener(VISIBILITY_EVENT, onVisibilityChange);
			return () => {
				this.#page.removeEventListener(VISIBILITY_EVENT, onVisibilityChange);
			};
		}
		subscribeUnload(listener) {
			const onUnload = () => {
				listener();
			};
			UNLOAD_EVENTS.forEach(eventName => this.#pageEvents.addEventListener(eventName, onUnload));
			return () => {
				UNLOAD_EVENTS.forEach(eventName => this.#pageEvents.removeEventListener(eventName, onUnload));
			};
		}
		isDesktop() {
			return this.#isDesktop();
		}
	}

	const REDACTED = '[redacted]';
	const CIRCULAR = '[circular]';
	const SENSITIVE_WORDS = new Set(['token', 'tokens', 'secret', 'secrets', 'password', 'passwd', 'jwt', 'key', 'keys', 'signature', 'auth', 'authorization', 'credential', 'credentials', 'sessid', 'sdp', 'candidate', 'candidates']);
	const SENSITIVE_NAMES = new Set(['roomdata', 'connectiondata', 'mediaserverurl']);
	const URL_QUERY_PARAM = /([?&])([^=&#]+)=([^&#]*)/g;
	function nameWords(name) {
		return name.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').replace(/([a-z\d])([A-Z])/g, '$1 $2').split(/[^a-zA-Z\d]+/).map(word => word.toLowerCase()).filter(word => word !== '');
	}
	function isSensitiveName(name) {
		if (SENSITIVE_NAMES.has(name.replaceAll(/[^a-zA-Z\d]/g, '').toLowerCase())) {
			return true;
		}
		return nameWords(name).some(word => SENSITIVE_WORDS.has(word));
	}
	function looksLikeUrl(value) {
		return /^[a-z][a-z\d+.-]*:\/\
	}
	function redactUrlSecrets(value) {
		if (!value.includes('?') || !looksLikeUrl(value)) {
			return value;
		}
		return value.replaceAll(URL_QUERY_PARAM, (match, separator, name) => {
			return isSensitiveName(name) ? `${separator}${name}=${REDACTED}` : match;
		});
	}
	function isPlainObject(value) {
		if (typeof value !== 'object' || value === null) {
			return false;
		}
		const prototype = Object.getPrototypeOf(value);
		return prototype === Object.prototype || prototype === null;
	}
	function redactValue(value, seen) {
		if (typeof value === 'string') {
			return redactUrlSecrets(value);
		}
		if (!Array.isArray(value) && !isPlainObject(value)) {
			return value;
		}
		if (seen.has(value)) {
			return CIRCULAR;
		}
		seen.add(value);
		const redacted = Array.isArray(value) ? value.map(item => redactValue(item, seen)) : redactRecord(value, seen);
		seen.delete(value);
		return redacted;
	}
	function redactRecord(record, seen) {
		return Object.fromEntries(Object.entries(record).map(([field, value]) => [field, isSensitiveName(field) ? REDACTED : redactValue(value, seen)]));
	}
	class LoggerPortAdapter {
		#primitive;
		constructor(primitive) {
			this.#primitive = primitive;
		}
		log(message, details) {
			this.#write('log', message, details);
		}
		warn(message, details) {
			this.#write('warn', message, details);
		}
		error(message, details) {
			this.#write('error', message, details);
		}
		#write(severity, message, details) {
			if (details === undefined) {
				this.#primitive[severity](message);
				return;
			}
			this.#primitive[severity](message, redactRecord(details, new WeakSet()));
		}
	}

	exports.AcquisitionContractCode = AcquisitionContractCode;
	exports.BrowserEnvironmentPort = BrowserEnvironmentPort;
	exports.BxPullPort = BxPullPort;
	exports.BxRestPort = BxRestPort;
	exports.CallScheme = CallScheme;
	exports.ClassicConnectionAcquisition = ClassicConnectionAcquisition;
	exports.ClassicSignalingGateway = ClassicSignalingGateway;
	exports.EscalatableMediaTransport = EscalatableMediaTransport;
	exports.EscalationContractCode = EscalationContractCode;
	exports.FetchHttpPort = FetchHttpPort;
	exports.JoinFailureCode = JoinFailureCode;
	exports.JwtConnectionAcquisition = JwtConnectionAcquisition;
	exports.JwtSignalingGateway = JwtSignalingGateway;
	exports.LocalMediaContractCode = LocalMediaContractCode;
	exports.LocalMediaDenialReason = LocalMediaDenialReason;
	exports.LocalMediaKind = LocalMediaKind;
	exports.LocalMediaSource = LocalMediaSource;
	exports.LoggerPortAdapter = LoggerPortAdapter;
	exports.MediaTrackKind = MediaTrackKind;
	exports.NavigatorMediaDevicesPort = NavigatorMediaDevicesPort;
	exports.NegotiationChannel = NegotiationChannel;
	exports.PullDispatcher = PullDispatcher;
	exports.Quality = Quality;
	exports.ReconnectContractCode = ReconnectContractCode;
	exports.ReconnectController = ReconnectController;
	exports.RemoteMediaContractCode = RemoteMediaContractCode;
	exports.RemoteMediaResolution = RemoteMediaResolution;
	exports.RoomType = RoomType;
	exports.RosterParticipantResolver = RosterParticipantResolver;
	exports.SignalingContractCode = SignalingContractCode;
	exports.SignalingProtocolImpl = SignalingProtocolImpl;
	exports.TimerClockPort = TimerClockPort;
	exports.err = err;
	exports.isCancelled = isCancelled;
	exports.isErr = isErr;
	exports.isOk = isOk;
	exports.ok = ok;

})(this.BX.Call.Engine.Transport = this.BX.Call.Engine.Transport || {});
//# sourceMappingURL=transport.bundle.js.map
