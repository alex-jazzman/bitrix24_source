import { Text } from 'main.core';

// a channel of its own, apart from the player's one: there an announcement means "stop playing",
// here it means "stop and keep what was recorded"
const CHANNEL_NAME = 'im-voice-recording';
const RECORDING_STARTED = 'recordingStarted';

type RecordingStartedMessage = {
	type: string,
	senderId: string,
};

export class RecordingBroadcast
{
	#channel: ?BroadcastChannel;
	#senderId: string = Text.getRandom();
	#onOtherTabStart: () => void;

	constructor(onOtherTabStart: () => void)
	{
		this.#onOtherTabStart = onOtherTabStart;
		this.#channel = this.#openChannel();
	}

	announceStart(): void
	{
		this.#channel?.postMessage({
			type: RECORDING_STARTED,
			senderId: this.#senderId,
		});
	}

	close(): void
	{
		this.#channel?.close();
	}

	#openChannel(): ?BroadcastChannel
	{
		try
		{
			const channel = new BroadcastChannel(CHANNEL_NAME);
			channel.onmessage = this.#onMessage;

			return channel;
		}
		catch
		{
			return null;
		}
	}

	#onMessage = (event: MessageEvent): void => {
		const message: RecordingStartedMessage = event.data;

		if (message?.type !== RECORDING_STARTED || message.senderId === this.#senderId)
		{
			return;
		}

		this.#onOtherTabStart();
	};
}
