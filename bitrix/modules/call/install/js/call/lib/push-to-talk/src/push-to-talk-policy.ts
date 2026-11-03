import { type ClockPort, type TimerId } from './port/clock-port';

export type MicrophoneSource = 'mic_button' | 'push_to_talk';

export interface SpeechSignal {
	userId: number;
	local?: boolean;
}

export interface PushToTalkPolicyConfig {
	isAvailable: () => boolean;
	isMicrophoneMuted: () => boolean;
	isMicrophoneActionable: () => boolean;
	isModalBlocked: () => boolean;
	setMicrophone: (muted: boolean, source: MicrophoneSource) => void;
	onShortPress: () => void;
	onHoldChanged: (holding: boolean) => void;
	clock: ClockPort;
}

/**
 * How long the key has to stay down before the microphone opens. An ordinary deliberate press lasts
 * 80-150 ms, so the threshold sits above that range: a press meant as an activation of the focused
 * element must not be read as a hold.
 */
export const HOLD_MS = 250;

const Owner = {
	none: 'none',
	external: 'external',
	ptt: 'ptt',
} as const;

type OwnerState = typeof Owner[keyof typeof Owner];

/**
 * Hold-to-talk rules. Whether the microphone is open is not stored here - it is read from the
 * device library, so the two cannot diverge, and entering a call with an already open microphone
 * gives push-to-talk no ownership.
 */
export class PushToTalkPolicy
{
	readonly #isAvailable: () => boolean;
	readonly #isMicrophoneMuted: () => boolean;
	readonly #isMicrophoneActionable: () => boolean;
	readonly #isModalBlocked: () => boolean;
	readonly #setMicrophone: (muted: boolean, source: MicrophoneSource) => void;
	readonly #onShortPress: () => void;
	readonly #onHoldChanged: (holding: boolean) => void;
	readonly #clock: ClockPort;

	#owner: OwnerState = Owner.none;
	#pending: TimerId | null = null;
	#zoneFocused: boolean = false;
	#keyDown: boolean = false;
	#rearm: boolean = false;
	#armedOnActivatable: boolean = false;
	#firedInCycle: boolean = false;

	constructor(config: PushToTalkPolicyConfig)
	{
		this.#isAvailable = config.isAvailable;
		this.#isMicrophoneMuted = config.isMicrophoneMuted;
		this.#isMicrophoneActionable = config.isMicrophoneActionable;
		this.#isModalBlocked = config.isModalBlocked;
		this.#setMicrophone = config.setMicrophone;
		this.#onShortPress = config.onShortPress;
		this.#onHoldChanged = config.onHoldChanged;
		this.#clock = config.clock;
	}

	// the call is over: a capture still waiting for the threshold must not reach it, and a microphone
	// already taken is handed back here - the window is going away and no release will follow it
	stop(): void
	{
		this.#cancelPending();

		if (this.#owner === Owner.ptt)
		{
			this.#release();
		}
	}

	/**
	 * @returns true when the key press has to be suppressed.
	 */
	onKeyDown(repeat: boolean, targetActivatesOnSpace: boolean): boolean
	{
		const inZone = this.#isAvailable() && this.#zoneFocused && !this.#isModalBlocked();
		const suppress = inZone && !targetActivatesOnSpace && this.#canOperate();

		// repeats start no second cycle, they only feed the liveness sensor - but page scrolling
		// under the call window stays suppressed on them too
		if (repeat)
		{
			return suppress;
		}

		this.#keyDown = true;
		// a press of its own opens a cycle of its own, whatever the previous one spent itself on
		this.#firedInCycle = false;

		if (this.#rearm || !inZone)
		{
			return suppress;
		}

		if (!this.#isMicrophoneActionable())
		{
			return suppress;
		}

		if (this.#owner !== Owner.none || !this.#isMicrophoneMuted())
		{
			return suppress;
		}

		this.#armedOnActivatable = targetActivatesOnSpace;
		// a keyup lost earlier must leave no dangling timer behind
		this.#cancelPending();
		this.#pending = this.#clock.after(HOLD_MS, () => this.#grab());

		return suppress;
	}

	/**
	 * @returns true when the cycle belonged to push-to-talk and the release has to be suppressed.
	 */
	onKeyUp(): boolean
	{
		this.#keyDown = false;
		this.#rearm = false;

		const wasArmed = this.#pending !== null;
		const fired = this.#firedInCycle;

		this.#firedInCycle = false;
		this.#cancelPending();

		if (this.#owner === Owner.ptt)
		{
			this.#release();

			return true;
		}

		// the cycle fired, so its release belongs to the mode whoever owns the microphone by now:
		// the repeats of this very hold keep a focused button pressed, and letting the native
		// activation through would add a second switch to what the user has just set by hand (AC-029)
		if (fired)
		{
			return true;
		}

		// a hint is worth showing only when push-to-talk was available and did nothing;
		// on an activatable target the press did act
		if (wasArmed && !this.#armedOnActivatable && this.#isMicrophoneMuted())
		{
			this.#onShortPress();
		}

		return false;
	}

	onExternalMicrophoneChange(muted: boolean): void
	{
		// a muted microphone belongs to nobody, otherwise push-to-talk would die
		// after the first mute from the button
		if (muted)
		{
			this.#setOwner(Owner.none);

			return;
		}

		// an outside unmute during a hold does not take ownership away, otherwise the release
		// would stop muting a microphone that opened late (the right to speak arrived after the press)
		if (this.#owner !== Owner.ptt)
		{
			this.#setOwner(Owner.external);
		}
	}

	// the release is lost, so the key counts as released and rearm stays down: no keyup will arrive.
	// The cycle is left marked as fired all the same - a release that does arrive after all belongs to
	// the same physical press and must not activate anything
	onKeyLivenessLost(): void
	{
		this.#keyDown = false;
		this.#cancelPending();

		if (this.#owner === Owner.ptt)
		{
			this.#release();
		}
	}

	onZoneFocusChanged(focused: boolean): void
	{
		this.#zoneFocused = focused;

		if (!focused)
		{
			this.onZoneLeft();
		}
	}

	onZoneLeft(): void
	{
		this.#abortHold();
	}

	onSilenceLimit(): void
	{
		this.#abortHold();
	}

	onConnectionLost(): void
	{
		this.#abortHold();
	}

	onBroadcastRightLost(): void
	{
		this.#abortHold();
	}

	/**
	 * Whether the key is the business of the mode at all. Scrolling by space is taken from the page
	 * only where the mode has something to do with the press: while it holds the microphone itself,
	 * and while the microphone is muted and can be raised. A participant who may not broadcast - a
	 * listener of a large room, an audience of a broadcast - keeps scrolling by space, and so does
	 * one whose microphone is already open: the mode would not fire for either of them.
	 */
	#canOperate(): boolean
	{
		if (this.#owner === Owner.ptt)
		{
			return true;
		}

		return this.#owner === Owner.none && this.#isMicrophoneMuted() && this.#isMicrophoneActionable();
	}

	#abortHold(): void
	{
		this.#cancelPending();

		// a key still held down has to be released before it can arm again
		if (this.#keyDown)
		{
			this.#rearm = true;
		}

		if (this.#owner === Owner.ptt)
		{
			this.#release();
		}
	}

	#grab(): void
	{
		this.#pending = null;

		if (
			this.#owner !== Owner.none
			|| !this.#isMicrophoneMuted()
			|| !this.#isMicrophoneActionable()
			// nothing reports the block going up, so the guard of onKeyDown is read again at the
			// threshold: raised inside it, the block would otherwise let the capture through
			|| this.#isModalBlocked()
		)
		{
			return;
		}

		this.#setOwner(Owner.ptt);
		this.#firedInCycle = true;
		this.#setMicrophone(false, 'push_to_talk');
	}

	#release(): void
	{
		this.#setOwner(Owner.none);
		this.#setMicrophone(true, 'push_to_talk');
	}

	/**
	 * The only writer of the ownership, so "the mode is holding the microphone" is a derivative of it
	 * and not a flag of its own: every way the microphone can be lost - the release, the abort paths,
	 * a mute from outside - goes through here, and none of them can leave the hold reported as running.
	 */
	#setOwner(next: OwnerState): void
	{
		const wasHolding = this.#owner === Owner.ptt;
		const holding = next === Owner.ptt;

		this.#owner = next;

		if (holding !== wasHolding)
		{
			this.#onHoldChanged(holding);
		}
	}

	#cancelPending(): void
	{
		if (this.#pending !== null)
		{
			this.#clock.cancel(this.#pending);
			this.#pending = null;
		}
	}
}
