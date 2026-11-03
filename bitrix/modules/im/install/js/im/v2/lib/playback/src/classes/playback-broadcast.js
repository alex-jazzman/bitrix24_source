import { Text } from 'main.core';

const CHANNEL_NAME = 'im-playback';
const PLAYBACK_STARTED = 'playbackStarted';

type PlaybackStartedMessage = {
	type: string,
	senderId: string,
	fileId: string,
};

export class PlaybackBroadcast
{
	#channel: ?BroadcastChannel;
	#senderId: string = Text.getRandom();
	#onOtherTabStart: (fileId: string) => void;

	constructor(onOtherTabStart: (fileId: string) => void)
	{
		this.#onOtherTabStart = onOtherTabStart;
		this.#channel = this.#openChannel();
	}

	announceStart(fileId: string): void
	{
		this.#channel?.postMessage({
			type: PLAYBACK_STARTED,
			senderId: this.#senderId,
			fileId,
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
		const message: PlaybackStartedMessage = event.data;

		if (message?.type !== PLAYBACK_STARTED || message.senderId === this.#senderId)
		{
			return;
		}

		this.#onOtherTabStart(message.fileId);
	};
}
