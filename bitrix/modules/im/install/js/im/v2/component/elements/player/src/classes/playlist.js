import { EventEmitter } from 'main.core.events';

import { EventType } from 'im.v2.const';

import type { ImModelFile } from 'im.v2.model';
import type { ApplicationContext } from 'im.v2.const';

export class Playlist
{
	static #instance: Playlist;
	#files: { [chatId: string]: Set<ImModelFile> } = {};

	static getInstance(): Playlist
	{
		if (!this.#instance)
		{
			this.#instance = new this();
		}

		return this.#instance;
	}

	register(file: ImModelFile)
	{
		if (!this.#files[file.chatId])
		{
			this.#files[file.chatId] = new Set();
		}

		this.#files[file.chatId].add(file);
	}

	unregister(file: ImModelFile)
	{
		this.#files[file.chatId].delete(file);
	}

	onFileEnded(payload: { file: ImModelFile, context: ApplicationContext })
	{
		const { file, context: { emitter } } = payload;

		const nextFile = this.#getNextFile(file);
		if (!nextFile)
		{
			return;
		}

		emitter.emit(EventType.roundVideoPlayer.playNext, { fileId: nextFile.id });
	}

	#getNextFile(file: ImModelFile): ImModelFile | null
	{
		const chatFiles = [...this.#files[file.chatId]];
		chatFiles.sort((a, b) => a.date - b.date);
		const currentIndex = chatFiles.indexOf(file);

		return chatFiles[currentIndex + 1];
	}
}
