import { EventType, type ApplicationContext, PlaylistScope } from 'im.v2.const';

import { type ImModelFile } from 'im.v2.model';

const Direction = {
	asc: 'asc',
	desc: 'desc',
};

const ScopeDirection: { [scope: $Values<typeof PlaylistScope>]: $Values<typeof Direction> } = {
	[PlaylistScope.chat]: Direction.asc,
	[PlaylistScope.sidebar]: Direction.desc,
};

/**
 * A track is a file inside a particular message, not a file on its own: the same file can be
 * attached to several messages, and each of them is a separate player on the screen.
 */
export type PlaylistTrack = {
	messageId: string | number,
	file: ImModelFile,
};

export class Playlist
{
	static #instances: Map<string, Playlist> = new Map();
	#scope: $Values<typeof PlaylistScope>;
	#tracks: { [chatId: string]: Map<string, PlaylistTrack> } = {};

	constructor(scope: string)
	{
		this.#scope = scope;
	}

	static getInstance(scope: $Values<typeof PlaylistScope>): Playlist
	{
		if (!this.#instances.has(scope))
		{
			this.#instances.set(scope, new this(scope));
		}

		return this.#instances.get(scope);
	}

	register(track: PlaylistTrack)
	{
		const { chatId } = track.file;
		if (!this.#tracks[chatId])
		{
			this.#tracks[chatId] = new Map();
		}

		this.#tracks[chatId].set(Playlist.#keyOf(track), track);
	}

	unregister(track: PlaylistTrack)
	{
		this.#tracks[track.file.chatId]?.delete(Playlist.#keyOf(track));
	}

	onFileEnded(payload: PlaylistTrack & { context: ApplicationContext })
	{
		const { context: { emitter } } = payload;

		const nextTrack = this.#getNextTrack(payload);
		if (!nextTrack)
		{
			return;
		}

		emitter.emit(EventType.player.playNext, {
			messageId: nextTrack.messageId,
			fileId: nextTrack.file.id,
			scope: this.#scope,
		});
	}

	// The message is a part of the address, not a decoration: keyed by the file alone, two messages
	// carrying the same file collapsed into one entry, so the round trip skipped one of them.
	static #keyOf({ messageId, file }: PlaylistTrack): string
	{
		return `${messageId}:${file.id}`;
	}

	#getNextTrack(current: PlaylistTrack): PlaylistTrack | null
	{
		const chat = this.#tracks[current.file.chatId];
		if (!chat)
		{
			return null;
		}

		const direction = ScopeDirection[this.#scope];
		if (!direction)
		{
			return null;
		}

		const sortCallback = direction === Direction.desc
			? (a, b) => b.file.date - a.file.date
			: (a, b) => a.file.date - b.file.date;
		// Sort is stable, so tracks sharing a date keep the order they were registered in - for a
		// producer uploading its files in one batch that is the only order there is.
		const tracks = [...chat.values()].sort(sortCallback);
		const currentKey = Playlist.#keyOf(current);
		const currentIndex = tracks.findIndex((track) => Playlist.#keyOf(track) === currentKey);
		if (currentIndex === -1)
		{
			return null;
		}

		return tracks[currentIndex + 1];
	}
}
