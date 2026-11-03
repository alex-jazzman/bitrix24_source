import { Type } from 'main.core';

export const MAX_FILES_COUNT_IN_ONE_MESSAGE = 10;
export const MAX_FILES_COUNT = 100;
export const MAX_PARALLEL_LOADS = 10;

type MakeChunksOptions<T> = {
	files: Array<T>,
	chunkSize?: number,
	maxFilesCount?: number,
};

export function makeChunks<T>(options: MakeChunksOptions<T>): Array<Array<T>>
{
	const {
		files,
		chunkSize = MAX_FILES_COUNT_IN_ONE_MESSAGE,
		maxFilesCount = MAX_FILES_COUNT,
	}: MakeChunksOptions<T> = options;

	const chunks: Array<Array<T>> = [];
	if (Type.isArray(files))
	{
		const preparedFiles: Array<T> = files.slice(0, maxFilesCount);
		for (let i = 0; i < preparedFiles.length; i += chunkSize)
		{
			const chunk = preparedFiles.slice(i, i + chunkSize);
			chunks.push(chunk);
		}
	}

	return chunks;
}

export function getMaxParallelLoads<T>(chunks: Array<Array<T>>): number
{
	return Math.floor(MAX_PARALLEL_LOADS / chunks.length);
}

/**
 * Part of the portion that still fits the batch limit.
 * The limit is platform-wide and applies on top of a per-chat policy;
 * default chats have no policy at all, so it is the only count limit there.
 */
export function takeWithinBatchLimit<T>(
	files: Array<T>,
	existingCount: number,
	maxFilesCount: number = MAX_FILES_COUNT,
): Array<T>
{
	const capacity = Math.max(0, maxFilesCount - existingCount);

	return files.slice(0, capacity);
}
