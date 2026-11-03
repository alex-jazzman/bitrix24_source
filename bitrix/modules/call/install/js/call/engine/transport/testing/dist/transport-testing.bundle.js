/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Engine = this.BX.Call.Engine || {};
this.BX.Call.Engine.Transport = this.BX.Call.Engine.Transport || {};
(function (exports, call_engine_transport) {
	'use strict';

	class FakePullPort {
		#published = [];
		#listeners = new Set();
		#publishingSupported = true;
		#publishingEnabled = true;
		publish(recipients, signal, payload, expirySeconds) {
			this.#published.push({
				recipients,
				signal,
				payload,
				expirySeconds
			});
		}
		subscribeIncoming(listener) {
			this.#listeners.add(listener);
			return () => {
				this.#listeners.delete(listener);
			};
		}
		isPublishingSupported() {
			return this.#publishingSupported;
		}
		isPublishingEnabled() {
			return this.#publishingEnabled;
		}
		setPublishingSupported(isSupported) {
			this.#publishingSupported = isSupported;
		}
		setPublishingEnabled(isEnabled) {
			this.#publishingEnabled = isEnabled;
		}
		emitIncoming(message) {
			const delivered = {
				...message,
				origin: message.origin ?? 'server'
			};
			[...this.#listeners].forEach(listener => listener(delivered));
		}
		getPublishedSignals() {
			return [...this.#published];
		}
		getIncomingSubscriberCount() {
			return this.#listeners.size;
		}
	}

	class FakeRestPort {
		#calls = [];
		#standing = new Map();
		#queued = new Map();
		async callAction(action, payload) {
			this.#calls.push({
				action,
				payload
			});
			const result = this.#queued.get(action)?.shift() ?? this.#standing.get(action);
			if (result === undefined) {
				throw new Error(`FakeRestPort: no result programmed for action "${action}"`);
			}
			return result;
		}
		setResult(action, result) {
			this.#standing.set(action, result);
		}
		queueResult(action, result) {
			const queue = this.#queued.get(action) ?? [];
			queue.push(result);
			this.#queued.set(action, queue);
		}
		getActionCalls() {
			return [...this.#calls];
		}
	}

	class FakeHttpPort {
		#requests = [];
		#standing = undefined;
		#queued = [];
		static response(status, body) {
			return {
				status,
				ok: status >= 200 && status < 300,
				body
			};
		}
		async request(request) {
			this.#requests.push(request);
			if (request.signal?.aborted === true) {
				const cancelled = {
					kind: 'cancelled'
				};
				return call_engine_transport.err(cancelled);
			}
			const result = this.#queued.shift() ?? this.#standing;
			if (result === undefined) {
				throw new Error(`FakeHttpPort: no result programmed for ${request.method} ${request.url}`);
			}
			return result;
		}
		setResult(result) {
			this.#standing = result;
		}
		queueResult(result) {
			this.#queued.push(result);
		}
		getRequests() {
			return [...this.#requests];
		}
	}

	function heldCapture() {
		let settle = undefined;
		const result = new Promise(resolve => {
			settle = resolve;
		});
		return {
			result,
			answer: outcome => settle?.(outcome)
		};
	}
	class FakeMediaDevicesPort {
		#userMediaCalls = [];
		#displayMediaCalls = [];
		#enumerateDevicesCallCount = 0;
		#userMediaStanding = undefined;
		#userMediaQueue = [];
		#userMediaHeld = [];
		#displayMediaStanding = undefined;
		#displayMediaQueue = [];
		#displayMediaHeld = [];
		#devicesStanding = undefined;
		#devicesQueue = [];
		#deviceChangeListeners = new Set();
		#disposed = false;
		async getUserMedia(constraints) {
			this.#userMediaCalls.push(constraints);
			const held = this.#userMediaHeld.shift();
			if (held !== undefined) {
				return held.result;
			}
			return this.#programmed(this.#userMediaQueue.shift() ?? this.#userMediaStanding, 'getUserMedia');
		}
		async getDisplayMedia(constraints) {
			this.#displayMediaCalls.push(constraints);
			const held = this.#displayMediaHeld.shift();
			if (held !== undefined) {
				return held.result;
			}
			return this.#programmed(this.#displayMediaQueue.shift() ?? this.#displayMediaStanding, 'getDisplayMedia');
		}
		async enumerateDevices() {
			this.#enumerateDevicesCallCount++;
			return this.#programmed(this.#devicesQueue.shift() ?? this.#devicesStanding, 'enumerateDevices');
		}
		subscribeDeviceChange(listener) {
			this.#deviceChangeListeners.add(listener);
			return () => {
				this.#deviceChangeListeners.delete(listener);
			};
		}
		dispose() {
			this.#disposed = true;
			this.#deviceChangeListeners.clear();
		}
		setUserMediaResult(result) {
			this.#userMediaStanding = result;
		}
		queueUserMediaResult(result) {
			this.#userMediaQueue.push(result);
		}
		holdUserMedia() {
			const held = heldCapture();
			this.#userMediaHeld.push(held);
			return held.answer;
		}
		setDisplayMediaResult(result) {
			this.#displayMediaStanding = result;
		}
		queueDisplayMediaResult(result) {
			this.#displayMediaQueue.push(result);
		}
		holdDisplayMedia() {
			const held = heldCapture();
			this.#displayMediaHeld.push(held);
			return held.answer;
		}
		setEnumerateDevicesResult(result) {
			this.#devicesStanding = result;
		}
		queueEnumerateDevicesResult(result) {
			this.#devicesQueue.push(result);
		}
		emitDeviceChange() {
			if (this.#disposed) {
				return;
			}
			[...this.#deviceChangeListeners].forEach(listener => listener());
		}
		getUserMediaCalls() {
			return [...this.#userMediaCalls];
		}
		getDisplayMediaCalls() {
			return [...this.#displayMediaCalls];
		}
		getEnumerateDevicesCallCount() {
			return this.#enumerateDevicesCallCount;
		}
		isDisposed() {
			return this.#disposed;
		}
		#programmed(result, operation) {
			if (result === undefined) {
				throw new Error(`FakeMediaDevicesPort: no result programmed for ${operation}()`);
			}
			return result;
		}
	}

	const MAX_CALLBACKS_PER_TICK = 10000;
	class FakeClockPort {
		#now = 0;
		#nextTimerId = 1;
		#pending = new Map();
		#scheduled = [];
		#firedCallbackCount = 0;
		now() {
			return this.#now;
		}
		scheduleOnce(callback, delayMs) {
			return this.#schedule(callback, delayMs, false);
		}
		scheduleRepeating(callback, intervalMs) {
			return this.#schedule(callback, intervalMs, true);
		}
		tick(ms) {
			if (ms < 0) {
				throw new Error(`FakeClockPort: tick(${ms}) would move time backwards`);
			}
			const target = this.#now + ms;
			let fired = 0;
			for (let timer = this.#nextDue(target); timer !== undefined; timer = this.#nextDue(target)) {
				fired++;
				if (fired > MAX_CALLBACKS_PER_TICK) {
					throw new Error(`FakeClockPort: tick(${ms}) ran ${MAX_CALLBACKS_PER_TICK} callbacks and is still not done` + ' - a timer re-arms itself with a non-positive delay');
				}
				this.#now = timer.dueAt;
				this.#fire(timer);
			}
			this.#now = target;
		}
		getScheduledTimers() {
			return [...this.#scheduled];
		}
		getPendingTimerCount() {
			return this.#pending.size;
		}
		getFiredCallbackCount() {
			return this.#firedCallbackCount;
		}
		#schedule(callback, delayMs, isRepeating) {
			const id = this.#nextTimerId++;
			this.#scheduled.push({
				kind: isRepeating ? 'repeating' : 'once',
				delayMs
			});
			this.#pending.set(id, {
				id,
				dueAt: this.#now + delayMs,
				intervalMs: isRepeating ? delayMs : undefined,
				callback
			});
			return () => {
				this.#pending.delete(id);
			};
		}
		#fire(timer) {
			if (timer.intervalMs === undefined) {
				this.#pending.delete(timer.id);
			}
			this.#firedCallbackCount++;
			timer.callback();
			if (timer.intervalMs !== undefined && this.#pending.has(timer.id)) {
				timer.dueAt += timer.intervalMs;
			}
		}
		#nextDue(target) {
			let next = undefined;
			for (const timer of this.#pending.values()) {
				if (timer.dueAt > target) {
					continue;
				}
				const isEarlier = next === undefined || timer.dueAt < next.dueAt || timer.dueAt === next.dueAt && timer.id < next.id;
				if (isEarlier) {
					next = timer;
				}
			}
			return next;
		}
	}

	class FakeEnvironmentPort {
		#online = true;
		#visible = true;
		#desktop = false;
		#onlineListeners = new Set();
		#visibilityListeners = new Set();
		#unloadListeners = new Set();
		isOnline() {
			return this.#online;
		}
		subscribeOnlineChange(listener) {
			this.#onlineListeners.add(listener);
			return () => {
				this.#onlineListeners.delete(listener);
			};
		}
		isVisible() {
			return this.#visible;
		}
		subscribeVisibilityChange(listener) {
			this.#visibilityListeners.add(listener);
			return () => {
				this.#visibilityListeners.delete(listener);
			};
		}
		subscribeUnload(listener) {
			this.#unloadListeners.add(listener);
			return () => {
				this.#unloadListeners.delete(listener);
			};
		}
		isDesktop() {
			return this.#desktop;
		}
		setOnline(isOnline) {
			this.#online = isOnline;
		}
		setVisible(isVisible) {
			this.#visible = isVisible;
		}
		setDesktop(isDesktop) {
			this.#desktop = isDesktop;
		}
		emitOnlineChange(isOnline) {
			this.#online = isOnline;
			[...this.#onlineListeners].forEach(listener => listener(isOnline));
		}
		emitVisibilityChange(isVisible) {
			this.#visible = isVisible;
			[...this.#visibilityListeners].forEach(listener => listener(isVisible));
		}
		emitUnload() {
			[...this.#unloadListeners].forEach(listener => listener());
		}
		getOnlineSubscriberCount() {
			return this.#onlineListeners.size;
		}
		getVisibilitySubscriberCount() {
			return this.#visibilityListeners.size;
		}
		getUnloadSubscriberCount() {
			return this.#unloadListeners.size;
		}
	}

	class FakeLoggerPort {
		#entries = [];
		log(message, details) {
			this.#entries.push({
				severity: 'log',
				message,
				details
			});
		}
		warn(message, details) {
			this.#entries.push({
				severity: 'warn',
				message,
				details
			});
		}
		error(message, details) {
			this.#entries.push({
				severity: 'error',
				message,
				details
			});
		}
		getEntries(severity) {
			if (severity === undefined) {
				return [...this.#entries];
			}
			return this.#entries.filter(entry => entry.severity === severity);
		}
	}

	const CLOSED = {
		kind: 'contract',
		code: 'plane.closed'
	};
	class FakeMediaTransport {
		#listener;
		#intentCalls = [];
		#outcomes = new Map();
		#publishedTracks = new Map();
		#connected = false;
		#closed = false;
		constructor(options) {
			this.#listener = options.listener;
		}
		async connect(descriptor) {
			const outcome = this.#record({
				intent: 'connect',
				descriptor
			});
			this.#connected = outcome.ok;
			return outcome;
		}
		async disconnect() {
			const outcome = this.#record({
				intent: 'disconnect'
			});
			if (outcome.ok) {
				this.#connected = false;
			}
			return outcome;
		}
		async publishAudio(track) {
			return this.#publish('publishAudio', call_engine_transport.MediaTrackKind.Audio, track);
		}
		async unpublishAudio() {
			return this.#unpublish('unpublishAudio', call_engine_transport.MediaTrackKind.Audio);
		}
		async publishVideo(track) {
			return this.#publish('publishVideo', call_engine_transport.MediaTrackKind.Video, track);
		}
		async unpublishVideo() {
			return this.#unpublish('unpublishVideo', call_engine_transport.MediaTrackKind.Video);
		}
		async publishScreen(track) {
			return this.#publish('publishScreen', call_engine_transport.MediaTrackKind.Screen, track);
		}
		async unpublishScreen() {
			return this.#unpublish('unpublishScreen', call_engine_transport.MediaTrackKind.Screen);
		}
		async publishScreenAudio(track) {
			return this.#publish('publishScreenAudio', call_engine_transport.MediaTrackKind.ScreenAudio, track);
		}
		async unpublishScreenAudio() {
			return this.#unpublish('unpublishScreenAudio', call_engine_transport.MediaTrackKind.ScreenAudio);
		}
		async setRemoteQuality(participantId, quality) {
			return this.#record({
				intent: 'setRemoteQuality',
				participantId,
				quality
			});
		}
		close() {
			if (this.#closed) {
				return;
			}
			this.#closed = true;
			this.#connected = false;
		}
		setIntentOutcome(intent, outcome) {
			this.#outcomes.set(intent, outcome);
		}
		emitRemoteTrackAdded(participantId, track) {
			this.#emit(listener => listener.onRemoteTrackAdded(participantId, track));
		}
		emitRemoteTrackRemoved(participantId, kind) {
			this.#emit(listener => listener.onRemoteTrackRemoved(participantId, kind));
		}
		emitRemoteTrackMuted(participantId, kind, isMuted) {
			this.#emit(listener => listener.onRemoteTrackMuted(participantId, kind, isMuted));
		}
		emitConnectionQualityChanged(participantId, quality) {
			this.#emit(listener => listener.onConnectionQualityChanged(participantId, quality));
		}
		emitReconnecting() {
			this.#emit(listener => listener.onReconnecting());
		}
		emitReconnected() {
			this.#emit(listener => listener.onReconnected());
		}
		emitFailure(error) {
			this.#emit(listener => listener.onFailure(error));
		}
		emitUnresolvedRemoteTrack(endpointId, track) {
			this.#emit(listener => listener.onUnresolvedRemoteTrack(endpointId, track));
		}
		emitUnresolvedRemoteTrackDropped(endpointId, error) {
			this.#emit(listener => listener.onUnresolvedRemoteTrackDropped(endpointId, error));
		}
		getIntentCalls() {
			return [...this.#intentCalls];
		}
		getPublishedTrack(kind) {
			return this.#publishedTracks.get(kind);
		}
		isConnected() {
			return this.#connected;
		}
		isClosed() {
			return this.#closed;
		}
		#publish(intent, kind, track) {
			const outcome = this.#record({
				intent,
				kind,
				track
			});
			if (outcome.ok) {
				this.#publishedTracks.set(kind, track);
			}
			return outcome;
		}
		#unpublish(intent, kind) {
			const outcome = this.#record({
				intent,
				kind
			});
			if (outcome.ok) {
				this.#publishedTracks.delete(kind);
			}
			return outcome;
		}
		#emit(deliver) {
			if (this.#closed) {
				return;
			}
			deliver(this.#listener);
		}
		#record(call) {
			if (this.#closed) {
				return call_engine_transport.err(CLOSED);
			}
			this.#intentCalls.push(call);
			return this.#outcomes.get(call.intent) ?? call_engine_transport.ok(undefined);
		}
	}

	const ROOM_TYPES = Object.values(call_engine_transport.RoomType);
	const NEVER_CANCELLED = () => undefined;
	function fail$2(message) {
		throw new Error(`acquisition conformance: ${message}`);
	}
	function check$2(condition, message) {
		if (!condition) {
			fail$2(message);
		}
	}
	function isResultShape$2(outcome) {
		if (typeof outcome !== 'object' || outcome === null) {
			return false;
		}
		return typeof outcome.ok === 'boolean';
	}
	function startAcquire(subject, tested) {
		try {
			return tested.acquisition.acquire(subject.request);
		} catch (thrown) {
			return fail$2(`acquire threw "${String(thrown)}" instead of answering with a Result`);
		}
	}
	async function settle$2(pending) {
		let outcome;
		try {
			outcome = await pending;
		} catch (thrown) {
			return fail$2(`acquire failed with "${String(thrown)}" instead of answering with a Result`);
		}
		check$2(isResultShape$2(outcome), 'acquire must answer with a Result, so the caller reads the outcome in the type');
		return outcome;
	}
	async function acquire(subject, tested) {
		return settle$2(startAcquire(subject, tested));
	}
	function descriptorOf(result) {
		if (call_engine_transport.isErr(result)) {
			return fail$2(`expected a descriptor, got the failure "${result.error.kind}"`);
		}
		return result.value;
	}
	function failureOf$2(result) {
		if (!call_engine_transport.isErr(result)) {
			return fail$2(`expected a failure, got a descriptor of the schema ${result.value.scheme}`);
		}
		return result.error;
	}
	function contractFailureOf(result) {
		const error = failureOf$2(result);
		if (error.kind !== 'contract') {
			return fail$2(`expected a broken contract, got the failure "${error.kind}"`);
		}
		return error;
	}
	const PORT_FAILURES = [{
		kind: 'network'
	}, {
		kind: 'timeout'
	}, {
		kind: 'denied',
		reason: 'access'
	}];
	const PROGRAMMED_OUTCOMES = [{
		name: 'a connection',
		program: channel => channel.answerWithConnection()
	}, {
		name: 'an unreadable answer',
		program: channel => channel.answerWithUnreadableConnection()
	}, {
		name: 'an answer of another schema',
		program: channel => channel.answerWithForeignScheme()
	}, {
		name: 'a failure of the port',
		program: channel => channel.failWith({
			kind: 'network'
		})
	}];
	function runAcquisitionConformance(subject, runner) {
		const {
			describe,
			it
		} = runner;
		describe(`${subject.name} as a ConnectionAcquisition`, () => {
			describe('a connection it obtains', () => {
				it('answers a descriptor of the schema it acquires', async () => {
					const tested = subject.create(NEVER_CANCELLED);
					tested.channel.answerWithConnection();
					const descriptor = descriptorOf(await acquire(subject, tested));
					check$2(descriptor.scheme === subject.scheme, `the descriptor states the schema ${descriptor.scheme} while the acquisition is ${subject.scheme}`);
				});
				it('reaches its channel exactly once', async () => {
					const tested = subject.create(NEVER_CANCELLED);
					tested.channel.answerWithConnection();
					descriptorOf(await acquire(subject, tested));
					check$2(tested.channel.countCalls() === 1, `one acquire reached the channel ${tested.channel.countCalls()} times`);
				});
				it('answers a room type of the vocabulary, a start date and a creation flag', async () => {
					const tested = subject.create(NEVER_CANCELLED);
					tested.channel.answerWithConnection();
					const descriptor = descriptorOf(await acquire(subject, tested));
					check$2(ROOM_TYPES.includes(descriptor.roomType), `the room type ${descriptor.roomType} is outside the vocabulary of the transport`);
					check$2(typeof descriptor.startDate === 'number' || typeof descriptor.startDate === 'string', 'a descriptor carries the start date the server named');
					check$2(typeof descriptor.isNew === 'boolean', 'a descriptor tells a connection that was created from one that was joined');
				});
				it('carries nothing of the media plane', async () => {
					const tested = subject.create(NEVER_CANCELLED);
					tested.channel.answerWithConnection();
					const descriptor = descriptorOf(await acquire(subject, tested));
					check$2(!Object.hasOwn(descriptor, subject.mediaPlaneField), `the descriptor carries "${subject.mediaPlaneField}", which belongs to the media plane`);
				});
				it('answers the next acquire of the same instance as well', async () => {
					const tested = subject.create(NEVER_CANCELLED);
					tested.channel.answerWithConnection();
					descriptorOf(await acquire(subject, tested));
					const second = descriptorOf(await acquire(subject, tested));
					check$2(second.scheme === subject.scheme, 'a repeated acquire answers a descriptor of the same schema');
					check$2(tested.channel.countCalls() === 2, 'a repeated acquire asks the server again');
				});
				it('acquires with no cancellation provider given at all', async () => {
					const tested = subject.create();
					tested.channel.answerWithConnection();
					const descriptor = descriptorOf(await acquire(subject, tested));
					check$2(descriptor.scheme === subject.scheme, 'an acquisition nobody can cancel obtains its connection like any other');
				});
			});
			describe('an answer it cannot accept', () => {
				it('answers an unreadable connection as a broken contract of the shared vocabulary', async () => {
					const tested = subject.create(NEVER_CANCELLED);
					tested.channel.answerWithUnreadableConnection();
					const failure = contractFailureOf(await acquire(subject, tested));
					check$2(failure.code === call_engine_transport.AcquisitionContractCode.MalformedResponse, `the failure states the code "${String(failure.code)}" instead of a malformed answer`);
				});
				it('answers a schema that is not its own as a broken contract instead of switching to it', async () => {
					const tested = subject.create(NEVER_CANCELLED);
					tested.channel.answerWithForeignScheme();
					const failure = contractFailureOf(await acquire(subject, tested));
					check$2(failure.code === call_engine_transport.AcquisitionContractCode.SchemeMismatch, `the failure states the code "${String(failure.code)}" instead of a schema mismatch`);
				});
			});
			describe('a failure of the port', () => {
				PORT_FAILURES.forEach(error => {
					it(`carries the failure "${error.kind}" under the kind the port gave it`, async () => {
						const tested = subject.create(NEVER_CANCELLED);
						tested.channel.failWith(error);
						const failure = failureOf$2(await acquire(subject, tested));
						check$2(failure.kind === error.kind, `the port said "${error.kind}" and the acquisition said "${failure.kind}"`);
					});
				});
				it('carries the code of a contract failure of the port as it came', async () => {
					const tested = subject.create(NEVER_CANCELLED);
					const refusal = {
						kind: 'contract',
						code: 'the_server_named_this',
						message: 'as the server put it'
					};
					tested.channel.failWith(refusal);
					const failure = contractFailureOf(await acquire(subject, tested));
					check$2(failure.code === refusal.code, `the code of the server arrived as "${String(failure.code)}"`);
					check$2(failure.message === refusal.message, 'the message of the server travels with its code');
				});
			});
			describe('cancellation', () => {
				it('answers cancelled without reaching its channel when the signal is already aborted', async () => {
					const controller = new AbortController();
					controller.abort();
					const tested = subject.create(() => controller.signal);
					tested.channel.answerWithConnection();
					const failure = failureOf$2(await acquire(subject, tested));
					check$2(failure.kind === 'cancelled', `an aborted acquisition answered "${failure.kind}"`);
					check$2(tested.channel.countCalls() === 0, 'a cancelled acquisition must not reach the server');
				});
				it('answers cancelled when the abort arrives while the channel is answering', async () => {
					const controller = new AbortController();
					const tested = subject.create(() => controller.signal);
					tested.channel.answerWithConnection();
					const pending = startAcquire(subject, tested);
					controller.abort();
					const failure = failureOf$2(await settle$2(pending));
					check$2(tested.channel.countCalls() === 1, 'the channel must have been reached before the abort');
					check$2(failure.kind === 'cancelled', 'a connection nobody waits for must not be answered');
				});
				it('answers the connection while the signal of the attempt is not aborted', async () => {
					const controller = new AbortController();
					const tested = subject.create(() => controller.signal);
					tested.channel.answerWithConnection();
					const descriptor = descriptorOf(await acquire(subject, tested));
					check$2(descriptor.scheme === subject.scheme, 'an acquisition nobody cancelled answers the connection it obtained');
				});
				it('stays with the signal the attempt started under', async () => {
					const started = new AbortController();
					const next = new AbortController();
					let current = started;
					const tested = subject.create(() => current.signal);
					tested.channel.answerWithConnection();
					const pending = startAcquire(subject, tested);
					current = next;
					started.abort();
					const failure = failureOf$2(await settle$2(pending));
					check$2(failure.kind === 'cancelled', 'the controller that started the attempt must cancel it');
				});
			});
			describe('the shape of every outcome', () => {
				PROGRAMMED_OUTCOMES.forEach(({
					name,
					program
				}) => {
					it(`answers ${name} with a Result and throws nothing`, async () => {
						const tested = subject.create(NEVER_CANCELLED);
						program(tested.channel);
						const result = await acquire(subject, tested);
						check$2(tested.channel.countCalls() === 1, 'the channel must have been reached before the outcome is read off it');
						check$2(typeof result.ok === 'boolean', 'the outcome of an acquire is read from the Result it answers with');
					});
				});
			});
		});
	}

	const ENDPOINT = 'media-endpoint-of-a-plane-under-conformance';
	const MUTED_SURFACE = 'microphone';
	const INTENT_REFUSED = {
		kind: 'contract',
		code: 'plane.intent_refused'
	};
	const RECOVERY_LOST = {
		kind: 'network'
	};
	const ENDPOINT_UNRESOLVABLE = {
		kind: 'contract',
		code: 'plane.endpoint_unresolvable'
	};
	class RecordingConsumer {
		#events = [];
		onRemoteTrackAdded(participantId, track) {
			this.#note('onRemoteTrackAdded', [participantId, track]);
		}
		onRemoteTrackRemoved(participantId, kind) {
			this.#note('onRemoteTrackRemoved', [participantId, kind]);
		}
		onRemoteTrackMuted(participantId, kind, isMuted) {
			this.#note('onRemoteTrackMuted', [participantId, kind, isMuted]);
		}
		onConnectionQualityChanged(participantId, quality) {
			this.#note('onConnectionQualityChanged', [participantId, quality]);
		}
		onReconnecting() {
			this.#note('onReconnecting', []);
		}
		onReconnected() {
			this.#note('onReconnected', []);
		}
		onFailure(error) {
			this.#note('onFailure', [error]);
		}
		onUnresolvedRemoteTrack(endpointId, track) {
			this.#note('onUnresolvedRemoteTrack', [endpointId, track]);
		}
		onUnresolvedRemoteTrackDropped(endpointId, error) {
			this.#note('onUnresolvedRemoteTrackDropped', [endpointId, error]);
		}
		getEvents() {
			return [...this.#events];
		}
		getNames() {
			return this.#events.map(entry => entry.event);
		}
		#note(event, args) {
			this.#events.push({
				event,
				args
			});
		}
	}
	function fail$1(message) {
		throw new Error(`media transport conformance: ${message}`);
	}
	function check$1(condition, message) {
		if (!condition) {
			fail$1(message);
		}
	}
	function isResultShape$1(outcome) {
		if (typeof outcome !== 'object' || outcome === null) {
			return false;
		}
		return typeof outcome.ok === 'boolean';
	}
	async function settle$1(intent, call) {
		let pending;
		try {
			pending = call();
		} catch (thrown) {
			return fail$1(`${intent} threw "${String(thrown)}" instead of answering with a Result`);
		}
		let outcome;
		try {
			outcome = await pending;
		} catch (thrown) {
			return fail$1(`${intent} failed with "${String(thrown)}" instead of answering with a Result`);
		}
		check$1(isResultShape$1(outcome), `${intent} must answer with a Result, so a caller reads the outcome in the type`);
		return outcome;
	}
	function failureOf$1(intent, outcome) {
		if (!call_engine_transport.isErr(outcome)) {
			return fail$1(`${intent} answered success while the plane was refusing it`);
		}
		return outcome.error;
	}
	function expectOk(intent, outcome) {
		if (call_engine_transport.isErr(outcome)) {
			fail$1(`${intent} answered the failure "${outcome.error.kind}" while the plane was accepting it`);
		}
	}
	function eventsAfter(consumer, known) {
		return consumer.getEvents().slice(known);
	}
	function sameArgs(recorded, expected) {
		if (recorded.length !== expected.length) {
			return false;
		}
		return expected.every((value, at) => recorded[at] === value);
	}
	function createMedia(subject) {
		return {
			audio: subject.createTrack(call_engine_transport.MediaTrackKind.Audio),
			video: subject.createTrack(call_engine_transport.MediaTrackKind.Video),
			screen: subject.createTrack(call_engine_transport.MediaTrackKind.Screen),
			screenAudio: subject.createTrack(call_engine_transport.MediaTrackKind.ScreenAudio)
		};
	}
	const INTENT_CALLS = {
		connect: (transport, subject) => transport.connect(subject.descriptor),
		disconnect: transport => transport.disconnect(),
		publishAudio: (transport, subject, media) => transport.publishAudio(media.audio),
		unpublishAudio: transport => transport.unpublishAudio(),
		publishVideo: (transport, subject, media) => transport.publishVideo(media.video),
		unpublishVideo: transport => transport.unpublishVideo(),
		publishScreen: (transport, subject, media) => transport.publishScreen(media.screen),
		unpublishScreen: transport => transport.unpublishScreen(),
		publishScreenAudio: (transport, subject, media) => transport.publishScreenAudio(media.screenAudio),
		unpublishScreenAudio: transport => transport.unpublishScreenAudio(),
		setRemoteQuality: (transport, subject) => transport.setRemoteQuality(subject.participantId, call_engine_transport.Quality.High)
	};
	const INTENTS = Object.keys(INTENT_CALLS);
	const EVENT_REPORTS = {
		onRemoteTrackAdded: (reporter, subject, media) => {
			reporter.onRemoteTrackAdded(subject.participantId, media.video);
			return [subject.participantId, media.video];
		},
		onRemoteTrackRemoved: (reporter, subject) => {
			reporter.onRemoteTrackRemoved(subject.participantId, call_engine_transport.MediaTrackKind.Video);
			return [subject.participantId, call_engine_transport.MediaTrackKind.Video];
		},
		onRemoteTrackMuted: (reporter, subject) => {
			reporter.onRemoteTrackMuted(subject.participantId, MUTED_SURFACE, true);
			return [subject.participantId, MUTED_SURFACE, true];
		},
		onConnectionQualityChanged: (reporter, subject) => {
			reporter.onConnectionQualityChanged(subject.participantId, call_engine_transport.Quality.Low);
			return [subject.participantId, call_engine_transport.Quality.Low];
		},
		onReconnecting: reporter => {
			reporter.onReconnecting();
			return [];
		},
		onReconnected: reporter => {
			reporter.onReconnected();
			return [];
		},
		onFailure: reporter => {
			reporter.onFailure(RECOVERY_LOST);
			return [RECOVERY_LOST];
		},
		onUnresolvedRemoteTrack: (reporter, subject, media) => {
			reporter.onUnresolvedRemoteTrack(ENDPOINT, media.audio);
			return [ENDPOINT, media.audio];
		},
		onUnresolvedRemoteTrackDropped: reporter => {
			reporter.onUnresolvedRemoteTrackDropped(ENDPOINT, ENDPOINT_UNRESOLVABLE);
			return [ENDPOINT, ENDPOINT_UNRESOLVABLE];
		}
	};
	const PLANE_EVENTS = Object.keys(EVENT_REPORTS);
	function start(subject) {
		const consumer = new RecordingConsumer();
		return {
			tested: subject.create(consumer),
			consumer,
			media: createMedia(subject)
		};
	}
	async function reachCommit(subject, started) {
		const {
			transport
		} = started.tested;
		for (const intent of ['connect', 'publishAudio', 'publishVideo']) {
			expectOk(intent, await settle$1(intent, () => INTENT_CALLS[intent](transport, subject, started.media)));
		}
	}
	async function raiseFor(intent, subject, started) {
		if (intent === 'connect') {
			return;
		}
		expectOk('connect', await settle$1('connect', () => INTENT_CALLS.connect(started.tested.transport, subject, started.media)));
	}
	function runMediaTransportConformance(subject, runner) {
		const {
			describe,
			it
		} = runner;
		describe(`${subject.name} as a MediaTransport`, () => {
			describe('the intents', () => {
				INTENTS.forEach(intent => {
					it(`answers ${intent} with a Result and throws nothing`, async () => {
						const started = start(subject);
						const {
							tested,
							media
						} = started;
						await raiseFor(intent, subject, started);
						expectOk(intent, await settle$1(intent, () => INTENT_CALLS[intent](tested.transport, subject, media)));
					});
				});
				INTENTS.forEach(intent => {
					it(`carries the failure of ${intent} in the Result it answers`, async () => {
						const started = start(subject);
						const {
							tested,
							media
						} = started;
						await raiseFor(intent, subject, started);
						tested.plane.failIntent(intent, INTENT_REFUSED);
						const outcome = await settle$1(intent, () => INTENT_CALLS[intent](tested.transport, subject, media));
						const error = failureOf$1(intent, outcome);
						check$1(error.kind === INTENT_REFUSED.kind, `the plane refused with "${INTENT_REFUSED.kind}" and the intent answered "${error.kind}"`);
					});
				});
				it('reports no event of its own while the intents are called', async () => {
					const {
						tested,
						consumer,
						media
					} = start(subject);
					for (const intent of INTENTS) {
						await settle$1(intent, () => INTENT_CALLS[intent](tested.transport, subject, media));
					}
					check$1(consumer.getEvents().length === 0, `the outcome of an intent travels in its Result, and these arrived as events: ${consumer.getNames().join(', ')}`);
				});
			});
			describe('the events of the plane', () => {
				PLANE_EVENTS.forEach(event => {
					it(`delivers ${event} with the payload the plane reported`, async () => {
						const {
							tested,
							consumer,
							media
						} = start(subject);
						const expected = EVENT_REPORTS[event](tested.plane.report, subject, media);
						const delivered = consumer.getEvents();
						check$1(delivered.length === 1, `${event} must reach the consumer exactly once`);
						check$1(delivered[0].event === event, `the plane reported ${event} and the consumer heard ${delivered[0].event}`);
						check$1(sameArgs(delivered[0].args, expected), `the payload of ${event} did not arrive as it was reported`);
					});
				});
			});
			describe('commit of the plane', () => {
				it('reaches commit on the connection and the local media alone', async () => {
					const started = start(subject);
					await reachCommit(subject, started);
					check$1(started.consumer.getEvents().length === 0, 'commit is the connection plus published local media: no remote media is awaited for it');
				});
				it('takes remote media in once it committed', async () => {
					const started = start(subject);
					await reachCommit(subject, started);
					const expected = EVENT_REPORTS.onRemoteTrackAdded(started.tested.plane.report, subject, started.media);
					const delivered = started.consumer.getEvents();
					check$1(delivered.length === 1, 'a committed plane carries remote media to the consumer');
					check$1(sameArgs(delivered[0].args, expected), 'remote media of a committed plane is named by its participant and arrives as it came');
				});
			});
			describe('recovery', () => {
				it('ends a spent budget of recovery in the terminal failure', async () => {
					const started = start(subject);
					await reachCommit(subject, started);
					started.tested.plane.spendRecoveryBudget(RECOVERY_LOST);
					const names = started.consumer.getNames();
					const failureAt = names.indexOf('onFailure');
					const startedAt = names.indexOf('onReconnecting');
					check$1(failureAt >= 0, `a spent budget must end in a failure, and these arrived: ${names.join(', ')}`);
					check$1(startedAt >= 0 && startedAt < failureAt, 'a cycle of recovery is announced before it is given up');
					check$1(!names.includes('onReconnected'), 'a cycle that spent its budget did not reconnect, so it must not say it did');
				});
				it('carries the typed error of the condition that ended the cycle', async () => {
					const {
						tested,
						consumer
					} = start(subject);
					tested.plane.spendRecoveryBudget(RECOVERY_LOST);
					const failure = consumer.getEvents().find(entry => entry.event === 'onFailure');
					check$1(failure !== undefined, 'a spent budget must reach the consumer as a failure');
					check$1(sameArgs(failure?.args ?? [], [RECOVERY_LOST]), 'the terminal failure carries the error the plane was given, and not one of its own');
				});
			});
			describe('teardown', () => {
				it('answers nothing and changes nothing on a second close', async () => {
					const started = start(subject);
					await reachCommit(subject, started);
					const known = started.consumer.getEvents().length;
					const outcome = started.tested.transport.close();
					check$1(outcome === undefined, 'teardown answers no result: a plane that is gone cannot fail to go');
					started.tested.transport.close();
					check$1(eventsAfter(started.consumer, known).length === 0, 'a repeated close is a no-op, and neither close reports anything to the consumer');
				});
				INTENTS.forEach(intent => {
					it(`refuses ${intent} after the close`, async () => {
						const started = start(subject);
						const {
							tested,
							media
						} = started;
						await raiseFor(intent, subject, started);
						expectOk(intent, await settle$1(intent, () => INTENT_CALLS[intent](tested.transport, subject, media)));
						tested.transport.close();
						const refused = await settle$1(intent, () => INTENT_CALLS[intent](tested.transport, subject, media));
						const error = failureOf$1(intent, refused);
						check$1(error.kind === 'contract', `${intent} of a plane that was torn down must be refused as a contract failure, ` + `and this one answered "${error.kind}"`);
					});
				});
				PLANE_EVENTS.forEach(event => {
					it(`cuts ${event} off after the close`, async () => {
						const {
							tested,
							consumer,
							media
						} = start(subject);
						EVENT_REPORTS[event](tested.plane.report, subject, media);
						check$1(consumer.getNames().includes(event), `${event} must reach the consumer while the plane serves, or this case proves nothing`);
						const known = consumer.getEvents().length;
						tested.transport.close();
						EVENT_REPORTS[event](tested.plane.report, subject, media);
						check$1(eventsAfter(consumer, known).length === 0, `${event} reached the consumer after the plane was torn down`);
					});
				});
			});
		});
	}

	const RECIPIENTS = ['7', '9'];
	const ACTION_INTENTS = [{
		method: 'sendInvite',
		name: 'an invite',
		send: gateway => gateway.sendInvite({
			recipients: RECIPIENTS,
			isVideo: true
		})
	}, {
		method: 'sendAnswerViaRest',
		name: 'an answer',
		send: gateway => gateway.sendAnswerViaRest()
	}, {
		method: 'sendDecline',
		name: 'a decline',
		send: gateway => gateway.sendDecline({
			code: 603
		})
	}, {
		method: 'sendHangupViaRest',
		name: 'a hangup',
		send: gateway => gateway.sendHangupViaRest({
			retransmit: true
		})
	}, {
		method: 'sendPingToBackendViaRest',
		name: 'a keepalive of the server',
		send: gateway => gateway.sendPingToBackendViaRest({
			retransmit: false
		})
	}, {
		method: 'sendFinish',
		name: 'finishing the call',
		send: gateway => gateway.sendFinish()
	}];
	const PUBLISH_INTENTS = [{
		method: 'sendAnswerViaPull',
		name: 'an answer',
		publish: gateway => gateway.sendAnswerViaPull(RECIPIENTS)
	}, {
		method: 'sendHangupViaPull',
		name: 'a hangup',
		publish: gateway => gateway.sendHangupViaPull(RECIPIENTS)
	}, {
		method: 'sendPingToPeersViaPull',
		name: 'a keepalive of the peers',
		publish: gateway => gateway.sendPingToPeersViaPull(RECIPIENTS)
	}];
	const INTENT_METHODS = [...ACTION_INTENTS.map(intent => intent.method), ...PUBLISH_INTENTS.map(intent => intent.method)];
	function fail(message) {
		throw new Error(`signaling gateway conformance: ${message}`);
	}
	function check(condition, message) {
		if (!condition) {
			fail(message);
		}
	}
	function isResultShape(outcome) {
		if (typeof outcome !== 'object' || outcome === null) {
			return false;
		}
		return typeof outcome.ok === 'boolean';
	}
	async function settle(intent, tested) {
		let outcome;
		try {
			outcome = await intent.send(tested.gateway);
		} catch (thrown) {
			return fail(`"${intent.method}" failed with "${String(thrown)}" instead of answering with a Result`);
		}
		check(isResultShape(outcome), `"${intent.method}" must answer with a Result, so the caller reads the outcome in the type`);
		return outcome;
	}
	function failureOf(outcome) {
		return call_engine_transport.isErr(outcome) ? outcome.error : undefined;
	}
	function methodsOf(gateway) {
		return Object.getOwnPropertyNames(Object.getPrototypeOf(gateway)).filter(name => name !== 'constructor');
	}
	function hasWire(subject, method) {
		return !subject.intentsWithoutWire.includes(method);
	}
	function wiredActions(subject) {
		return ACTION_INTENTS.filter(intent => hasWire(subject, intent.method));
	}
	function wiredPublishes(subject) {
		return PUBLISH_INTENTS.filter(intent => hasWire(subject, intent.method));
	}
	function wireCallCount(tested) {
		return tested.wire.getActions().length + tested.wire.getPublished().length;
	}
	function onlyAction(intent, tested) {
		const actions = tested.wire.getActions();
		check(actions.length === 1, `"${intent.method}" reached the server ${actions.length} times instead of once`);
		return actions[0];
	}
	function runSignalingGatewayConformance(subject, runner) {
		const {
			describe,
			it
		} = runner;
		describe(`${subject.name} as a SignalingGateway`, () => {
			describe('the contract it answers', () => {
				it('carries every intent of presence, whether or not its schema has a wire for one', async () => {
					const {
						gateway
					} = subject.create();
					INTENT_METHODS.forEach(method => {
						check(typeof gateway[method] === 'function', `the intent "${method}" is missing from this implementation`);
					});
				});
				it('declares no intent of its own beyond the shared contract', async () => {
					const {
						gateway
					} = subject.create();
					const declared = methodsOf(gateway);
					check(declared.length > 0, 'an implementation must declare the intents it serves');
					declared.forEach(method => {
						check(INTENT_METHODS.includes(method), `"${method}" is not an intent of the contract, so no schema may answer it alone`);
					});
				});
				it('names only intents of the contract among those it has no wire for', async () => {
					subject.intentsWithoutWire.forEach(method => {
						check(INTENT_METHODS.includes(method), `"${method}" is named as wireless and is no intent of the contract - a typo excuses nothing`);
					});
				});
			});
			describe('an intent that reaches the server', () => {
				wiredActions(subject).forEach(intent => {
					it(`answers ${intent.name} with a Result and publishes nothing`, async () => {
						const tested = subject.create();
						const outcome = await settle(intent, tested);
						onlyAction(intent, tested);
						check(tested.wire.getPublished().length === 0, `"${intent.method}" published a message while sending an action`);
						check(failureOf(outcome) === undefined, `the server answered, so "${intent.method}" states no failure of its own`);
					});
				});
				it('carries the instance of its connection and an id of the send in every action', async () => {
					const tested = subject.create();
					const intents = wiredActions(subject);
					await Promise.all(intents.map(intent => intent.send(tested.gateway)));
					const actions = tested.wire.getActions();
					check(actions.length === intents.length, 'every intent with a wire must have reached the server');
					actions.forEach(action => {
						const payload = action.payload ?? {};
						check(payload.callInstanceId === subject.callInstanceId, `"${action.action}" states the instance "${String(payload.callInstanceId)}" of another client`);
						check(typeof payload.requestId === 'string' && payload.requestId.length > 0, `"${action.action}" carries no id of the send the server expects on every request`);
					});
				});
				it('names a fresh id on every send', async () => {
					const tested = subject.create();
					const [intent] = wiredActions(subject);
					await intent.send(tested.gateway);
					await intent.send(tested.gateway);
					const actions = tested.wire.getActions();
					check(actions.length === 2, 'a repeated intent reaches the server again');
					check((actions[0].payload ?? {}).requestId !== (actions[1].payload ?? {}).requestId, 'two sends of one intent were given the same id, so a repeat is indistinguishable from a retry');
				});
				wiredActions(subject).forEach(intent => {
					it(`carries a failure of the port to the caller of ${intent.name}`, async () => {
						const tested = subject.create();
						const refusal = {
							kind: 'network'
						};
						tested.wire.failEverySendWith(refusal);
						const outcome = await settle(intent, tested);
						onlyAction(intent, tested);
						check(failureOf(outcome)?.kind === refusal.kind, `the port said "${refusal.kind}" and "${intent.method}" said ` + `"${String(failureOf(outcome)?.kind)}"`);
					});
				});
			});
			describe('an intent that goes to the peers', () => {
				wiredPublishes(subject).forEach(intent => {
					it(`publishes ${intent.name} to the given side and reaches no action`, async () => {
						const tested = subject.create();
						intent.publish(tested.gateway);
						const published = tested.wire.getPublished();
						check(published.length === 1, `"${intent.method}" published ${published.length} messages`);
						check(published[0].recipients.join() === RECIPIENTS.join(), `"${intent.method}" addressed the message to "${published[0].recipients.join()}"`);
						check(tested.wire.getActions().length === 0, `"${intent.method}" reached an action while publishing`);
					});
				});
				it('answers nothing when it publishes, the channel reporting no delivery', async () => {
					const tested = subject.create();
					wiredPublishes(subject).forEach(intent => {
						const answer = intent.publish(tested.gateway);
						check(answer === undefined, `"${intent.method}" answered something a caller could branch on`);
					});
				});
			});
			describe('an intent its schema has no wire for', () => {
				ACTION_INTENTS.filter(intent => !hasWire(subject, intent.method)).forEach(intent => {
					it(`states ${intent.name} as sent while reaching nothing`, async () => {
						const tested = subject.create();
						const outcome = await settle(intent, tested);
						check(wireCallCount(tested) === 0, `"${intent.method}" has no wire in this schema and reached one anyway`);
						check(failureOf(outcome) === undefined, 'an absent wire is no failure of the lifecycle, so the intent answers success');
					});
				});
				PUBLISH_INTENTS.filter(intent => !hasWire(subject, intent.method)).forEach(intent => {
					it(`publishes ${intent.name} nowhere and breaks nothing`, async () => {
						const tested = subject.create();
						intent.publish(tested.gateway);
						check(wireCallCount(tested) === 0, `"${intent.method}" has no wire in this schema and reached one anyway`);
					});
				});
			});
		});
	}

	function cancelledResult() {
		const error = {
			kind: 'cancelled'
		};
		return call_engine_transport.err(error);
	}

	exports.FakeClockPort = FakeClockPort;
	exports.FakeEnvironmentPort = FakeEnvironmentPort;
	exports.FakeHttpPort = FakeHttpPort;
	exports.FakeLoggerPort = FakeLoggerPort;
	exports.FakeMediaDevicesPort = FakeMediaDevicesPort;
	exports.FakeMediaTransport = FakeMediaTransport;
	exports.FakePullPort = FakePullPort;
	exports.FakeRestPort = FakeRestPort;
	exports.cancelledResult = cancelledResult;
	exports.runAcquisitionConformance = runAcquisitionConformance;
	exports.runMediaTransportConformance = runMediaTransportConformance;
	exports.runSignalingGatewayConformance = runSignalingGatewayConformance;

})(this.BX.Call.Engine.Transport.Testing = this.BX.Call.Engine.Transport.Testing || {}, BX.Call.Engine.Transport);
//# sourceMappingURL=transport-testing.bundle.js.map
