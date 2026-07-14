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

export class Playlist
{
	static #instances: Map<string, Playlist> = new Map();
	#scope: $Values<typeof PlaylistScope>;
	#files: { [chatId: string]: Map<string | number, ImModelFile> } = {};

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

	register(file: ImModelFile)
	{
		if (!this.#files[file.chatId])
		{
			this.#files[file.chatId] = new Map();
		}

		this.#files[file.chatId].set(file.id, file);
	}

	unregister(file: ImModelFile)
	{
		this.#files[file.chatId]?.delete(file.id);
	}

	onFileEnded(payload: { file: ImModelFile, context: ApplicationContext })
	{
		const { file, context: { emitter } } = payload;

		const nextFile = this.#getNextFile(file);
		if (!nextFile)
		{
			return;
		}

		emitter.emit(EventType.player.playNext, {
			fileId: nextFile.id,
			scope: this.#scope,
		});
	}

	#getNextFile(file: ImModelFile): ImModelFile | null
	{
		const chat = this.#files[file.chatId];
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
			? (a, b) => b.date - a.date
			: (a, b) => a.date - b.date;
		const chatFiles = [...chat.values()].sort(sortCallback);
		const currentIndex = chatFiles.findIndex((chatFile) => chatFile.id === file.id);
		if (currentIndex === -1)
		{
			return null;
		}

		return chatFiles[currentIndex + 1];
	}
}
