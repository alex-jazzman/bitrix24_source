import { DocumentKeyboardAdapter } from './adapters/document-keyboard-adapter';
import { HoldIndicationAdapter } from './adapters/hold-indication-adapter';
import { KeyCycleOwnership } from './adapters/key-cycle-ownership';
import { KeyLivenessAdapter } from './adapters/key-liveness-adapter';
import { SpeechSilenceAdapter } from './adapters/speech-silence-adapter';
import { ZoneFocusAdapter } from './adapters/zone-focus-adapter';
import {
	PushToTalkPolicy,
	type PushToTalkPolicyConfig,
	type SpeechSignal,
} from './push-to-talk-policy';

// the indication of a running hold is assembled here out of the documents the coordinator already
// owns, so the call window hands in nothing for it
export interface PushToTalkCoordinatorConfig extends Omit<PushToTalkPolicyConfig, 'onHoldChanged'> {
	callWindowDocument: () => Document;
	isFolded: () => boolean;
	localUserId: () => number;
}

/**
 * Assembles push-to-talk for the call window: owns the policy and the adapters that feed it.
 * The single entry point of the extension - what only the controller sees reaches the policy
 * through the call window, not through a channel of its own.
 */
export class PushToTalkCoordinator
{
	readonly #policy: PushToTalkPolicy;
	readonly #zoneFocusAdapter: ZoneFocusAdapter;
	readonly #keyLivenessAdapter: KeyLivenessAdapter;
	readonly #keyCycle: KeyCycleOwnership;
	readonly #speechSilenceAdapter: SpeechSilenceAdapter;
	readonly #holdIndicationAdapter: HoldIndicationAdapter;
	readonly #callWindowDocument: () => Document;

	#callWindowKeyboardAdapter: DocumentKeyboardAdapter | null = null;
	#pipKeyboardAdapter: DocumentKeyboardAdapter | null = null;
	#stopped: boolean = false;

	constructor(config: PushToTalkCoordinatorConfig)
	{
		this.#callWindowDocument = config.callWindowDocument;

		this.#speechSilenceAdapter = new SpeechSilenceAdapter({
			localUserId: config.localUserId,
			onSilenceLimit: () => this.#policy.onSilenceLimit(),
			clock: config.clock,
		});

		this.#holdIndicationAdapter = new HoldIndicationAdapter({
			callWindowDocument: config.callWindowDocument,
			clock: config.clock,
		});

		this.#policy = new PushToTalkPolicy({
			...config,
			// the limit guards the microphone push-to-talk raised itself, so the countdown follows
			// the commands of the policy and not the state of the device library
			setMicrophone: (muted, source) => {
				this.#speechSilenceAdapter.onMicrophoneCommand(muted);
				config.setMicrophone(muted, source);
			},
			onHoldChanged: (holding) => this.#holdIndicationAdapter.setHolding(holding),
		});

		this.#keyLivenessAdapter = new KeyLivenessAdapter({
			onKeyLivenessLost: () => this.#policy.onKeyLivenessLost(),
			clock: config.clock,
		});

		this.#keyCycle = new KeyCycleOwnership();

		this.#zoneFocusAdapter = new ZoneFocusAdapter({
			callWindowDocument: config.callWindowDocument,
			isFolded: config.isFolded,
			onZoneFocusChanged: (focused) => this.#policy.onZoneFocusChanged(focused),
			clock: config.clock,
		});
	}

	start(): void
	{
		// a second adapter on the same document would deliver every press to the policy twice,
		// and the first one would stay subscribed with nobody holding a reference to it
		if (this.#callWindowKeyboardAdapter !== null)
		{
			return;
		}

		this.#stopped = false;
		this.#zoneFocusAdapter.start();

		this.#callWindowKeyboardAdapter = this.#createKeyboardAdapter(this.#callWindowDocument());
		this.#callWindowKeyboardAdapter.start();
	}

	stop(): void
	{
		this.#stopped = true;
		this.#callWindowKeyboardAdapter?.stop();
		this.#callWindowKeyboardAdapter = null;
		this.#pipKeyboardAdapter?.stop();
		this.#pipKeyboardAdapter = null;
		this.#zoneFocusAdapter.stop();
		this.#keyLivenessAdapter.stop();
		this.#speechSilenceAdapter.stop();
		// the policy hands the microphone back first, so the mark of a running hold goes down through
		// its own path; what stop() clears after it is a mark left by a hold nobody reported
		this.#policy.stop();
		this.#holdIndicationAdapter.stop();
	}

	// the window is opened asynchronously, so its document can arrive after the call is over: the
	// close of a window that has not been created yet cancels nothing, and the zone must not take
	// the document back in and start sending microphone commands from a finished call
	setPipDocument(pipDocument: Document | null): void
	{
		if (this.#stopped)
		{
			return;
		}

		this.#pipKeyboardAdapter?.stop();
		this.#pipKeyboardAdapter = null;

		if (pipDocument !== null)
		{
			this.#pipKeyboardAdapter = this.#createKeyboardAdapter(pipDocument);
			this.#pipKeyboardAdapter.start();
		}

		this.#zoneFocusAdapter.setPipDocument(pipDocument);
		this.#holdIndicationAdapter.setPipDocument(pipDocument);
	}

	onFoldChanged(): void
	{
		this.#zoneFocusAdapter.onFoldChanged();
	}

	onConnectionLost(): void
	{
		this.#policy.onConnectionLost();
	}

	onBroadcastRightLost(): void
	{
		this.#policy.onBroadcastRightLost();
	}

	onExternalMicrophoneChange(muted: boolean): void
	{
		this.#speechSilenceAdapter.onExternalMicrophoneChange(muted);
		this.#policy.onExternalMicrophoneChange(muted);
	}

	// the direction of the signal decides what the limit does with it: speech of the local user
	// suspends the countdown and its end starts it over, so a speaker is never cut off mid-word
	onSpeechSignal(signal: SpeechSignal, speaking: boolean): void
	{
		this.#speechSilenceAdapter.onSpeechSignal(signal, speaking);
	}

	// the key both documents of the zone report is the same key, so they feed the one liveness
	// sensor and share the ownership of the cycle it opens
	#createKeyboardAdapter(targetDocument: Document): DocumentKeyboardAdapter
	{
		return new DocumentKeyboardAdapter(targetDocument, this.#keyCycle, {
			onKeyDown: (repeat, targetActivatesOnSpace) => {
				this.#keyLivenessAdapter.onKeyDown(repeat);

				return this.#policy.onKeyDown(repeat, targetActivatesOnSpace);
			},
			onKeyUp: () => {
				this.#keyLivenessAdapter.onKeyUp();

				return this.#policy.onKeyUp();
			},
		});
	}
}
