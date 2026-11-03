/* eslint-disable */
interface PushToTalkCoordinatorConfig extends Omit<PushToTalkPolicyConfig, 'onHoldChanged'> {
	callWindowDocument: () => Document;
	isFolded: () => boolean;
	localUserId: () => number;
}

interface PushToTalkPolicyConfig {
	isAvailable: () => boolean;
	isMicrophoneMuted: () => boolean;
	isMicrophoneActionable: () => boolean;
	isModalBlocked: () => boolean;
	setMicrophone: (muted: boolean, source: MicrophoneSource) => void;
	onShortPress: () => void;
	onHoldChanged: (holding: boolean) => void;
	clock: ClockPort;
}

type MicrophoneSource = 'mic_button' | 'push_to_talk';

interface ClockPort {
	now(): number;
	after(ms: number, callback: () => void): TimerId;
	cancel(id: TimerId): void;
}

type TimerId = number;

interface SpeechSignal {
	userId: number;
	local?: boolean;
}

declare namespace BX.Call.Lib {
	/**
	 * The same kind of contract, on the element whose activation the hold took: it lives while that element
	 * keeps the focus and does not follow the focus further.
	 */
	const FALSE_FOCUS_RING_ATTRIBUTE = "data-bx-call-push-to-talk-false-focus-ring";

	/**
	 * The contract of this extension with the stylesheets of the call window: the mode holds the microphone.
	 */
	const HOLD_INDICATION_ATTRIBUTE = "data-bx-call-push-to-talk-hold";

	/**
	 * Assembles push-to-talk for the call window: owns the policy and the adapters that feed it.
	 * The single entry point of the extension - what only the controller sees reaches the policy
	 * through the call window, not through a channel of its own.
	 */
	class PushToTalkCoordinator {
		constructor(config: PushToTalkCoordinatorConfig);
		start(): void;
		stop(): void;
		setPipDocument(pipDocument: Document | null): void;
		onFoldChanged(): void;
		onConnectionLost(): void;
		onBroadcastRightLost(): void;
		onExternalMicrophoneChange(muted: boolean): void;
		onSpeechSignal(signal: SpeechSignal, speaking: boolean): void;
	}
}
