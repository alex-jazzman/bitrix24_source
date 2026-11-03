/* eslint-disable */
/**
 * One recorded `publish`, kept whole: a test asserts on the addressing and on the expiry exactly as
 * the caller gave them. `expirySeconds` stays in the record as `undefined` when it was omitted, so the
 * shape of an entry never depends on the arguments.
 */
type PublishedSignal = {
	recipients: BX.Call.Engine.Transport.ParticipantId[];
	signal: BX.Call.Engine.Transport.PullSignal;
	payload: BX.Call.Engine.Transport.PullPayload;
	expirySeconds?: number;
};

/** One recorded call, so a test asserts which action was asked for, with what data, and in what order. */
type RestActionCall = {
	action: BX.Call.Engine.Transport.RestActionName;
	payload?: BX.Call.Engine.Transport.RestActionPayload;
};

/** Answers a call the test held back, with the outcome it hands over. */
type HeldMediaAnswer = (result: BX.Call.Engine.Transport.Result<MediaStream>) => void;

/**
 * One recorded schedule, taken when it was asked for: a test reads the delay a consumer chose, which
 * is the only place a growing backoff or a debounce window is visible from outside. A snapshot, so
 * the record never moves with the timer it came from.
 */
type ScheduledTimer = {
	kind: 'once' | 'repeating';
	delayMs: number;
};

/** The three severities of the port, named after the methods that write them. */
type LogSeverity = 'log' | 'warn' | 'error';

/**
 * One recorded entry, kept whole: the severity it was written with, the fixed text and the structured
 * data beside it. `details` stays `undefined` in the record when it was omitted, so the shape of an
 * entry never depends on the arguments - and a test asserting on a redacting adapter reads the field
 * it cares about instead of matching a formatted string.
 */
type LogEntry = {
	severity: LogSeverity;
	message: string;
	details?: BX.Call.Engine.Transport.LogDetails;
};

type FakeMediaTransportOptions = {
	/** Streaming events of this plane; the fake produces none by itself, every one is asked for. */
	listener: BX.Call.Engine.Transport.MediaTransportListener;
};

/**
 * One recorded intent, in the vocabulary of the contract: the name as it was called, and the arguments
 * it carried. A field an intent has no argument for stays `undefined`, so the shape of an entry never
 * depends on which intent produced it, and the order of the list is the order the calls came in.
 */
type MediaTransportIntentCall = {
	intent: BX.Call.Engine.Transport.MediaTransportIntent;
	/** The surface a publish or an unpublish was about; absent for the intents that name none. */
	kind?: BX.Call.Engine.Transport.MediaTrackKind;
	track?: MediaStreamTrack;
	descriptor?: BX.Call.Engine.Transport.ConnectionDescriptor;
	participantId?: BX.Call.Engine.Transport.ParticipantId;
	quality?: BX.Call.Engine.Transport.Quality;
};

/** Everything the suite needs to drive one implementation without knowing which one it is. */
type AcquisitionConformanceSubject = {
	/** Name the cases are reported under. */
	name: string;
	/** Schema every descriptor of this implementation carries. */
	scheme: BX.Call.Engine.Transport.CallScheme;
	/** A request this implementation accepts; it is of the schema above. */
	request: BX.Call.Engine.Transport.ConnectionRequest;
	/**
	 * Field of the media plane the connection answer carries and the descriptor must not. Named by the
	 * subject because only it knows the shape of its own answer.
	 */
	mediaPlaneField: string;
	/** A fresh implementation and its channel: two cases never share one. */
	create: (signalProvider?: BX.Call.Engine.Transport.CancellationSignalProvider) => AcquisitionUnderTest;
};

/** One implementation together with the channel it was built around; a case gets a fresh pair. */
type AcquisitionUnderTest = {
	acquisition: BX.Call.Engine.Transport.ConnectionAcquisition;
	channel: AcquisitionChannel;
};

/**
 * The channel an implementation reaches its server through, as far as the suite steers it: one method
 * per outcome the contract has to face. Whether a rest action or an http request is behind them is
 * knowledge of the subject alone.
 */
type AcquisitionChannel = {
	/** An answer a connection is read out of; it must carry the media-plane field the subject names. */
	answerWithConnection: () => void;
	/** An answer that arrived whole and still cannot be read as a connection. */
	answerWithUnreadableConnection: () => void;
	/** An answer claiming a schema other than the one this implementation acquires. */
	answerWithForeignScheme: () => void;
	/** The failure the port itself hands back - exactly the one given, so the suite owns the expectation. */
	failWith: (error: BX.Call.Engine.Transport.TransportError) => void;
	/** How many times the implementation reached the channel. */
	countCalls: () => number;
};

/**
 * The two declarations of a bdd runner the suite states itself through. Injected rather than imported:
 * this extension is built as a runtime one, so a test framework has no place among its dependencies.
 */
type ConformanceRunner = {
	describe: (name: string, body: () => void) => void;
	it: (name: string, body: () => Promise<void>) => void;
};

/** Everything the suite needs to drive one implementation without knowing which one it is. */
type MediaTransportConformanceSubject = {
	/** Name the cases are reported under. */
	name: string;
	/** A connection this plane can be raised for; which schema answered it is knowledge of the subject. */
	descriptor: BX.Call.Engine.Transport.ConnectionDescriptor;
	/** The canonical side of the call the intents and the events of the suite are about. */
	participantId: BX.Call.Engine.Transport.ParticipantId;
	/** A local track of that surface, obtained however the subject obtains one. */
	createTrack: (kind: BX.Call.Engine.Transport.MediaTrackKind) => MediaStreamTrack;
	/** A fresh plane reporting to that consumer: two cases never share one. */
	create: (listener: BX.Call.Engine.Transport.MediaTransportListener) => MediaTransportUnderTest;
};

/** One plane together with the seam it is steered through; a case gets a fresh pair. */
type MediaTransportUnderTest = {
	transport: BX.Call.Engine.Transport.MediaTransport;
	plane: MediaPlaneControl;
};

/**
 * What the suite needs beyond the contract to drive a plane. None of it is a method of `MediaTransport`
 * - a real implementation is not asked to grow one: a subject produces each of these by whatever its
 * plane is built on, and the suite never learns which.
 */
type MediaPlaneControl = {
	/** Makes the plane report an event of the contract, as the plane itself would. */
	report: MediaPlaneReporter;
	/** That intent of the plane answers this very failure from now on. */
	failIntent: (intent: BX.Call.Engine.Transport.MediaTransportIntent, error: BX.Call.Engine.Transport.TransportError) => void;
	/**
	 * Spends the whole injected budget of recovery, ending with that failure: the plane runs its cycle
	 * and finds nothing left to try, which is the one path to the terminal failure the contract declares.
	 */
	spendRecoveryBudget: (error: BX.Call.Engine.Transport.TransportError) => void;
};

/**
 * How the suite makes a plane report one event of the contract. Shaped as the listener itself, so an
 * event added to `MediaTransportListener` fails to compile here until a subject can produce it. A fake
 * calls a command of its own; an implementation over a fakeable wire drives that wire until the plane
 * reports the event by itself.
 */
type MediaPlaneReporter = BX.Call.Engine.Transport.MediaTransportListener;

/** Everything the suite needs to drive one implementation without knowing which one it is. */
type SignalingGatewayConformanceSubject = {
	/** Name the cases are reported under. */
	name: string;
	/** Instance id the subject builds its implementation with; every envelope has to carry it. */
	callInstanceId: string;
	/**
	 * Intents this schema has no wire for. Each name is checked against the intents of the contract, so
	 * a misspelled one fails the suite instead of quietly excusing an intent from every case.
	 */
	intentsWithoutWire: readonly string[];
	/**
	 * A fresh implementation and its wires: two cases never share one. It is built with a request id
	 * factory that answers a different id every time, which is what the check of a fresh id per send
	 * reads.
	 */
	create: () => SignalingGatewayUnderTest;
};

/** One implementation together with the wires it was built around; a case gets a fresh pair. */
type SignalingGatewayUnderTest = {
	gateway: BX.Call.Engine.Transport.SignalingGateway;
	wire: SignalingWire;
};

/**
 * The two wires a gateway can reach, as far as the suite reads and steers them. Whichever ports are
 * behind them, and which of the two a schema uses at all, is knowledge of the subject alone.
 */
type SignalingWire = {
	getActions: () => SentAction[];
	getPublished: () => PublishedMessage[];
	/** Every action of this implementation answers that failure from now on. */
	failEverySendWith: (error: BX.Call.Engine.Transport.TransportError) => void;
};

/** One action the implementation reached, with the payload it was called with. */
type SentAction = {
	action: BX.Call.Engine.Transport.RestActionName;
	payload?: BX.Call.Engine.Transport.RestActionPayload;
};

/** One message the implementation published, kept whole - addressing and lifetime as they were given. */
type PublishedMessage = {
	recipients: BX.Call.Engine.Transport.ParticipantId[];
	signal: BX.Call.Engine.Transport.PullSignal;
	payload: BX.Call.Engine.Transport.PullPayload;
	expirySeconds?: number;
};

declare namespace BX.Call.Engine.Transport.Testing {
	/**
	 * The outcome a fake of a one-shot operation hands back for an already aborted signal. Spelled out
	 * once here so every fake states the intent instead of rebuilding the variant.
	 */
	function cancelledResult<T>(): BX.Call.Engine.Transport.Result<T>;

	/**
	 * Programmable pull channel. Records every publish and delivers an incoming message when the test says
	 * so, which is what lets a consumer of the channel be tested without a live connection.
	 *
	 * The publishing flags are inputs of the caller's own policy, so a publish is recorded whatever they
	 * say: a test that expects a strategy to stay silent while publishing is disabled has to see an empty
	 * record, not a record filtered by the fake.
	 */
	class FakePullPort implements BX.Call.Engine.Transport.PullPort {
		publish(recipients: BX.Call.Engine.Transport.ParticipantId[], signal: BX.Call.Engine.Transport.PullSignal, payload: BX.Call.Engine.Transport.PullPayload, expirySeconds?: number): void;
		subscribeIncoming(listener: (message: BX.Call.Engine.Transport.PullMessage) => void): () => void;
		isPublishingSupported(): boolean;
		isPublishingEnabled(): boolean;
		/** Independent of `setPublishingEnabled`: the pair of flags is programmed in any combination. */
		setPublishingSupported(isSupported: boolean): void;
		setPublishingEnabled(isEnabled: boolean): void;
		/**
		 * Delivers the message to the current subscribers; a snapshot, so a listener may unsubscribe here.
		 *
		 * A message that names no origin is delivered as one of the server channel - the ordinary case, and
		 * the one every consumer trusts - so a test about a client publication names the origin itself.
		 */
		emitIncoming(message: BX.Call.Engine.Transport.PullMessage): void;
		getPublishedSignals(): PublishedSignal[];
		/** Zero after every unsubscribe function has been called: the proof that a consumer released the channel. */
		getIncomingSubscriberCount(): number;
	}

	/**
	 * Programmable REST channel. An outcome is programmed per action - that is what a test reads as
	 * intent - and both variants of the result are equally available: a refusal of the server is an `Err`
	 * here, never a thrown exception.
	 *
	 * An action nobody programmed throws instead of answering: a missing outcome is a mistake in the test,
	 * and an invented one would let a consumer pass on data it never asked for.
	 */
	class FakeRestPort implements BX.Call.Engine.Transport.RestPort {
		callAction<TResult = unknown>(action: BX.Call.Engine.Transport.RestActionName, payload?: BX.Call.Engine.Transport.RestActionPayload): Promise<BX.Call.Engine.Transport.Result<TResult>>;
		/** The answer of that action to every call, taken once its queue has run out. */
		setResult(action: BX.Call.Engine.Transport.RestActionName, result: BX.Call.Engine.Transport.Result<unknown>): void;
		/** The answer to the next call of that action, ahead of the standing one: a sequence, a retry. */
		queueResult(action: BX.Call.Engine.Transport.RestActionName, result: BX.Call.Engine.Transport.Result<unknown>): void;
		getActionCalls(): RestActionCall[];
	}

	/**
	 * Programmable channel of requests by absolute URL. It answers with the fixtures a test programmed -
	 * the body stays a string, exactly as the port promises, so a consumer keeps parsing it itself.
	 *
	 * A status outside 2xx is still an answer and comes back as `Ok`; only having no answer at all is an
	 * `Err`. A request carrying an already aborted signal is cancelled before any fixture is taken: the
	 * request is recorded, and the programmed answer stays for the next call.
	 *
	 * A call nobody programmed throws instead of answering - see `FakeRestPort` for the reasoning.
	 */
	class FakeHttpPort implements BX.Call.Engine.Transport.HttpPort {
		/** Builds a fixture answer with `ok` derived from the status, so a 5xx cannot claim success. */
		static response(status: number, body: string): BX.Call.Engine.Transport.HttpResponse;
		request(request: BX.Call.Engine.Transport.HttpRequest): Promise<BX.Call.Engine.Transport.Result<BX.Call.Engine.Transport.HttpResponse>>;
		/** The answer to every request, taken once the queue has run out. */
		setResult(result: BX.Call.Engine.Transport.Result<BX.Call.Engine.Transport.HttpResponse>): void;
		/** The answer to the next request, ahead of the standing one: a sequence, a retry after a 5xx. */
		queueResult(result: BX.Call.Engine.Transport.Result<BX.Call.Engine.Transport.HttpResponse>): void;
		getRequests(): BX.Call.Engine.Transport.HttpRequest[];
	}

	/**
	 * Programmable local media. Every outcome is programmed by the test and nothing is taken from the
	 * environment: the fake never touches `navigator`, so it needs neither a browser nor a permission, and
	 * the streams it hands back are the ones the test put in.
	 *
	 * Each one-shot method reads its queue first and falls back to the standing outcome, which is what
	 * covers a relaxed retry of `getUserMedia` and a device list that changes after a `devicechange`. A
	 * method nobody programmed throws instead of answering - see `FakeRestPort` for the reasoning.
	 *
	 * A capture can also be held back instead of programmed: `holdUserMedia` and `holdDisplayMedia` take
	 * precedence over both the queue and the standing outcome, and hand back the way to answer that one
	 * call later. That is what makes the window a request of the system is open in observable, and lets a
	 * test answer two open requests in whichever order it likes.
	 */
	class FakeMediaDevicesPort implements BX.Call.Engine.Transport.MediaDevicesPort {
		getUserMedia(constraints: MediaStreamConstraints): Promise<BX.Call.Engine.Transport.Result<MediaStream>>;
		getDisplayMedia(constraints?: DisplayMediaStreamOptions): Promise<BX.Call.Engine.Transport.Result<MediaStream>>;
		enumerateDevices(): Promise<BX.Call.Engine.Transport.Result<MediaDeviceInfo[]>>;
		subscribeDeviceChange(listener: () => void): () => void;
		dispose(): void;
		setUserMediaResult(result: BX.Call.Engine.Transport.Result<MediaStream>): void;
		queueUserMediaResult(result: BX.Call.Engine.Transport.Result<MediaStream>): void;
		/**
		 * Holds back the answer of the next `getUserMedia` and hands over the way to give it. Held calls are
		 * taken in the order they arrive, so a test that holds two of them answers each by its own function
		 * and decides which request of the system comes back first.
		 */
		holdUserMedia(): HeldMediaAnswer;
		setDisplayMediaResult(result: BX.Call.Engine.Transport.Result<MediaStream>): void;
		queueDisplayMediaResult(result: BX.Call.Engine.Transport.Result<MediaStream>): void;
		/** Holds back the answer of the next `getDisplayMedia` - the picker of the system left open. */
		holdDisplayMedia(): HeldMediaAnswer;
		setEnumerateDevicesResult(result: BX.Call.Engine.Transport.Result<MediaDeviceInfo[]>): void;
		queueEnumerateDevicesResult(result: BX.Call.Engine.Transport.Result<MediaDeviceInfo[]>): void;
		/** Silent after `dispose()`, so a consumer that forgot to unsubscribe is not woken by the fake. */
		emitDeviceChange(): void;
		getUserMediaCalls(): MediaStreamConstraints[];
		getDisplayMediaCalls(): Array<DisplayMediaStreamOptions | undefined>;
		/** `enumerateDevices` takes no argument, so the count is the whole record of it. */
		getEnumerateDevicesCallCount(): number;
		/** Lets a test assert that the consumer released the port on teardown. */
		isDisposed(): boolean;
	}

	/**
	 * Fully virtual time. It starts at zero and moves only through `tick()`: nothing here reaches a real
	 * `setTimeout`, so a ping, a debounce window or a reconnect budget is exercised at once instead of
	 * being waited out, and a test that forgets to advance time sees a timer that simply never fired.
	 *
	 * The rules a consumer can rely on:
	 *
	 * - a `tick` fires everything due on the way in chronological order, ties in the order the timers
	 *   were scheduled;
	 * - inside a callback `now()` reads the due time of that timer, not the end of the tick, so a
	 *   consumer measuring an interval sees the time it was promised; the clock lands on the target once
	 *   nothing is due any more;
	 * - a timer scheduled from inside a callback counts from that due time and still fires within the
	 *   same tick when it lands inside it - which is what makes a self-rescheduling ping advance by one
	 *   `tick(interval)` per round instead of collapsing into it;
	 * - cancelling is idempotent: before the callback it disarms the timer, twice or after it does
	 *   nothing, and a repeating timer may cancel itself from its own callback and is then not re-armed.
	 *
	 * An exception thrown by a callback propagates out of `tick()`: the consumer is under test, and a
	 * clock that swallowed it would turn a failure into a silent pass.
	 */
	class FakeClockPort implements BX.Call.Engine.Transport.ClockPort {
		now(): number;
		scheduleOnce(callback: () => void, delayMs: number): () => void;
		scheduleRepeating(callback: () => void, intervalMs: number): () => void;
		/** Advances virtual time by `ms`, firing what is due; see the class comment for the ordering rules. */
		tick(ms: number): void;
		/** Every schedule in the order it was asked for: the record a backoff sequence is asserted on. */
		getScheduledTimers(): ScheduledTimer[];
		/** Timers still waiting - zero once a consumer has cancelled everything it armed. */
		getPendingTimerCount(): number;
		/** Callbacks that have run; a repeating timer counts once per run. */
		getFiredCallbackCount(): number;
	}

	/**
	 * Programmable environment. Every signal is injected by hand and nothing is read from the browser:
	 * the fake touches neither `navigator` nor `document`, so it needs no page and no way to go offline
	 * for real.
	 *
	 * An `emit...` moves the synchronous read with the event it reports, which is the point of having both
	 * on one port: a strategy that asks `isOnline()` from inside its own listener must not see the state
	 * the tab had before. Arranging a state a consumer will find on subscribe - a tab that was already
	 * hidden - is the job of the `set...` pair, which changes the read and reports nothing.
	 *
	 * A repeated emit of the same value is delivered as asked: the fake is a programmable primitive, not
	 * an adapter that decides which change is worth reporting.
	 */
	class FakeEnvironmentPort implements BX.Call.Engine.Transport.EnvironmentPort {
		isOnline(): boolean;
		subscribeOnlineChange(listener: (isOnline: boolean) => void): () => void;
		isVisible(): boolean;
		subscribeVisibilityChange(listener: (isVisible: boolean) => void): () => void;
		subscribeUnload(listener: () => void): () => void;
		isDesktop(): boolean;
		/** Sets what `isOnline()` answers without reporting a change. */
		setOnline(isOnline: boolean): void;
		/** Sets what `isVisible()` answers without reporting a change. */
		setVisible(isVisible: boolean): void;
		setDesktop(isDesktop: boolean): void;
		/** Reports the new state and moves `isOnline()` with it: the predicate and the event never disagree. */
		emitOnlineChange(isOnline: boolean): void;
		/** Reports the new visibility and moves `isVisible()` with it. */
		emitVisibilityChange(isVisible: boolean): void;
		/** Carries no state, exactly as the port promises: there is nothing to read back afterwards. */
		emitUnload(): void;
		/** Zero after every unsubscribe function has been called: the proof that a consumer let go. */
		getOnlineSubscriberCount(): number;
		getVisibilitySubscriberCount(): number;
		getUnloadSubscriberCount(): number;
	}

	/**
	 * Collecting logger. It writes nowhere and only keeps what it was given, in order, which is what lets
	 * a test assert on the severity, on the text and on a single field of `details` at once.
	 */
	class FakeLoggerPort implements BX.Call.Engine.Transport.LoggerPort {
		log(message: string, details?: BX.Call.Engine.Transport.LogDetails): void;
		warn(message: string, details?: BX.Call.Engine.Transport.LogDetails): void;
		error(message: string, details?: BX.Call.Engine.Transport.LogDetails): void;
		/**
		 * Every entry in order, or only those of one severity. Always a copy: mutating the result leaves
		 * the record alone.
		 */
		getEntries(severity?: LogSeverity): LogEntry[];
	}

	/**
	 * A media plane that is driven instead of connected. It implements the whole contract without raising
	 * anything: no `RTCPeerConnection`, no media server, no negotiation - so the logic above a transport
	 * (escalation, recovery, the lifecycle of a session) is exercised on a plane whose every outcome and
	 * every event the test decides.
	 *
	 * Two halves make it controllable. Each intent answers `ok` until a test programs another outcome for
	 * that intent, which is how a plane that refuses to connect or to publish is set up; and each event of
	 * the contract has a command that emits it, which is how remote media, a change of quality, a cycle of
	 * recovery and a terminal failure appear on demand. What was asked of the plane is read back from the
	 * record of the intents, from the tracks it currently publishes and from whether it counts as connected.
	 *
	 * It emulates the plane, not the wire: the conditions a real implementation would derive from sdp,
	 * candidates and mids are stated here directly, and none of that vocabulary exists in the fake any more
	 * than it does in the contract. The tracks are not owned either - nothing here stops one, exactly as no
	 * real transport does.
	 */
	class FakeMediaTransport implements BX.Call.Engine.Transport.MediaTransport {
		constructor(options: FakeMediaTransportOptions);
		connect(descriptor: BX.Call.Engine.Transport.ConnectionDescriptor): Promise<BX.Call.Engine.Transport.Result<void, BX.Call.Engine.Transport.TransportError>>;
		disconnect(): Promise<BX.Call.Engine.Transport.Result<void, BX.Call.Engine.Transport.TransportError>>;
		publishAudio(track: MediaStreamTrack): Promise<BX.Call.Engine.Transport.Result<void, BX.Call.Engine.Transport.TransportError>>;
		unpublishAudio(): Promise<BX.Call.Engine.Transport.Result<void, BX.Call.Engine.Transport.TransportError>>;
		publishVideo(track: MediaStreamTrack): Promise<BX.Call.Engine.Transport.Result<void, BX.Call.Engine.Transport.TransportError>>;
		unpublishVideo(): Promise<BX.Call.Engine.Transport.Result<void, BX.Call.Engine.Transport.TransportError>>;
		publishScreen(track: MediaStreamTrack): Promise<BX.Call.Engine.Transport.Result<void, BX.Call.Engine.Transport.TransportError>>;
		unpublishScreen(): Promise<BX.Call.Engine.Transport.Result<void, BX.Call.Engine.Transport.TransportError>>;
		publishScreenAudio(track: MediaStreamTrack): Promise<BX.Call.Engine.Transport.Result<void, BX.Call.Engine.Transport.TransportError>>;
		unpublishScreenAudio(): Promise<BX.Call.Engine.Transport.Result<void, BX.Call.Engine.Transport.TransportError>>;
		setRemoteQuality(participantId: BX.Call.Engine.Transport.ParticipantId, quality: BX.Call.Engine.Transport.Quality): Promise<BX.Call.Engine.Transport.Result<void, BX.Call.Engine.Transport.TransportError>>;
		/**
		 * Takes the plane down the way a real one goes on a swap of the media plane or at the end of a call:
		 * it stops counting as connected, stops emitting and refuses every intent from then on. Nothing is
		 * recorded among the intents - teardown answers no result - and a second call changes nothing.
		 */
		close(): void;
		/**
		 * What this intent answers from now on. Programmed per intent, so a plane that connects and then
		 * refuses to publish - the shape a failed escalation has - is one line of setup.
		 */
		setIntentOutcome(intent: BX.Call.Engine.Transport.MediaTransportIntent, outcome: BX.Call.Engine.Transport.Result<void, BX.Call.Engine.Transport.TransportError>): void;
		emitRemoteTrackAdded(participantId: BX.Call.Engine.Transport.ParticipantId, track: MediaStreamTrack): void;
		emitRemoteTrackRemoved(participantId: BX.Call.Engine.Transport.ParticipantId, kind: BX.Call.Engine.Transport.MediaTrackKind): void;
		emitRemoteTrackMuted(participantId: BX.Call.Engine.Transport.ParticipantId, kind: BX.Call.Engine.Transport.RemoteMuteKind, isMuted: boolean): void;
		emitConnectionQualityChanged(participantId: BX.Call.Engine.Transport.ParticipantId, quality: BX.Call.Engine.Transport.Quality): void;
		emitReconnecting(): void;
		emitReconnected(): void;
		emitFailure(error: BX.Call.Engine.Transport.TransportError): void;
		/** Remote media of an endpoint nobody has mapped yet; the fake needs no resolver to state it. */
		emitUnresolvedRemoteTrack(endpointId: BX.Call.Engine.Transport.MediaEndpointId, track: MediaStreamTrack): void;
		/** The mapping of a held endpoint turned out not to be coming: the refusal, with the reason given. */
		emitUnresolvedRemoteTrackDropped(endpointId: BX.Call.Engine.Transport.MediaEndpointId, error: BX.Call.Engine.Transport.TransportError): void;
		/** Every intent in the order it was called: the record an ordering between intents is read from. */
		getIntentCalls(): MediaTransportIntentCall[];
		/**
		 * The track this plane currently sends for that surface - the same instance it was given. Absent
		 * until a publish succeeded, and gone again after an unpublish did.
		 */
		getPublishedTrack(kind: BX.Call.Engine.Transport.MediaTrackKind): MediaStreamTrack | undefined;
		/** Whether the plane counts as raised: a successful `connect` sets it, a `disconnect` clears it. */
		isConnected(): boolean;
		/** Whether the plane was torn down - what tells a plane that lost a swap from one that keeps serving. */
		isClosed(): boolean;
	}

	/**
	 * Runs the contract of `ConnectionAcquisition` against one implementation. The subject hides which
	 * implementation it is; the runner is the bdd interface the cases are declared through.
	 */
	function runAcquisitionConformance(subject: AcquisitionConformanceSubject, runner: ConformanceRunner): void;

	/**
	 * Runs the contract of `MediaTransport` against one implementation. The subject hides which plane it is;
	 * the runner is the bdd interface the cases are declared through - injected rather than imported, because
	 * this extension is built as a runtime one and a test framework has no place among its dependencies.
	 */
	function runMediaTransportConformance(subject: MediaTransportConformanceSubject, runner: ConformanceRunner): void;

	/**
	 * Runs the contract of `SignalingGateway` against one implementation. The subject hides which schema it
	 * is; the runner is the bdd interface the cases are declared through.
	 */
	function runSignalingGatewayConformance(subject: SignalingGatewayConformanceSubject, runner: ConformanceRunner): void;
}
