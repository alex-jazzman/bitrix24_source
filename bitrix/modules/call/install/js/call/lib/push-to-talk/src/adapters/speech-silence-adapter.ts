import { type ClockPort, type TimerId } from '../port/clock-port';
import { type SpeechSignal } from '../push-to-talk-policy';

// product decision: a minute of silence ends a hold nobody meant to keep
const SILENCE_LIMIT_MS = 60 * 1000;

// speech suspends the countdown, and the signals are one-shot: nothing arrives again until the speech
// ends, so an end signal that gets lost would suspend it forever. After this much of an unbroken
// speech the suspension is given up and the countdown runs as if the end had arrived - three minutes
// of speech without a single pause the detector can see is no longer a hold somebody keeps by hand.
const SPEECH_SUSPENSION_LIMIT_MS = 3 * SILENCE_LIMIT_MS;

export interface SpeechSilenceConfig {
	localUserId: () => number;
	onSilenceLimit: () => void;
	clock: ClockPort;
}

/**
 * Counts the silence of the local user while the microphone raised by push-to-talk stays open.
 * Only a command of the policy starts the countdown, so a microphone switched on by the button is
 * never counted. The countdown is the only guard against a physically stuck key: while the key is
 * held and the user says nothing, no other signal reports the hold at all.
 *
 * Speech of the local user suspends the countdown and its end starts the countdown over, because the
 * signals mark the edges of the speech and not its course: a speaker who never pauses produces none
 * of them, and a countdown merely restarted by the start of the speech would cut that speaker off
 * mid-word (AC-053).
 */
export class SpeechSilenceAdapter
{
	readonly #localUserId: () => number;
	readonly #onSilenceLimit: () => void;
	readonly #clock: ClockPort;

	#scheduled: TimerId | null = null;
	#speaking: boolean = false;

	constructor(config: SpeechSilenceConfig)
	{
		this.#localUserId = config.localUserId;
		this.#onSilenceLimit = config.onSilenceLimit;
		this.#clock = config.clock;
	}

	stop(): void
	{
		this.#cancelScheduled();
	}

	onMicrophoneCommand(muted: boolean): void
	{
		if (muted)
		{
			this.#cancelScheduled();

			return;
		}

		this.#restart();
	}

	// an outside mute closes the very microphone the countdown was guarding; an outside unmute
	// starts no countdown - the limit is for the microphone push-to-talk raised itself
	onExternalMicrophoneChange(muted: boolean): void
	{
		if (muted)
		{
			this.#cancelScheduled();
		}
	}

	onSpeechSignal(signal: SpeechSignal, speaking: boolean): void
	{
		// a scheduled timer is what marks the microphone as the one push-to-talk raised;
		// speech of anybody else, and speech outside a hold, leaves the countdown alone
		if (this.#scheduled === null || !this.#isLocal(signal))
		{
			return;
		}

		if (speaking)
		{
			this.#suspend();

			return;
		}

		this.#restart();
	}

	// the endpoint path of the engines carries no local flag, only the userId
	#isLocal(signal: SpeechSignal): boolean
	{
		return signal.local === true || signal.userId === this.#localUserId();
	}

	// the start of a speech arrives in a pair on some paths of the engine, so a speech already
	// suspending the countdown is not suspended a second time - the bound would move with every copy
	#suspend(): void
	{
		if (this.#speaking)
		{
			return;
		}

		this.#cancelScheduled();
		this.#speaking = true;
		this.#scheduled = this.#clock.after(SPEECH_SUSPENSION_LIMIT_MS, () => {
			this.#scheduled = null;
			this.#restart();
		});
	}

	#restart(): void
	{
		this.#cancelScheduled();
		this.#scheduled = this.#clock.after(SILENCE_LIMIT_MS, () => {
			this.#scheduled = null;
			this.#onSilenceLimit();
		});
	}

	#cancelScheduled(): void
	{
		this.#speaking = false;

		if (this.#scheduled !== null)
		{
			this.#clock.cancel(this.#scheduled);
			this.#scheduled = null;
		}
	}
}
