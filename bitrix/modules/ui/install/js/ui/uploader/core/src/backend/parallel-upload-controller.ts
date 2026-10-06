import { ajax as Ajax, Type, type AjaxResponse, type JsonObject } from 'main.core';

import { Server } from './server';
import { Chunk } from './chunk';
import { AbstractUploadController } from './abstract-upload-controller';
import { UploaderError } from '../uploader-error';
import { runConcurrentPool } from './utils/run-concurrent-pool';
import { normalizeFileName } from './utils/normalize-file-name';
import { getControllerOptionsJSON } from './utils/get-controller-options-json';
import { createCloudError } from './utils/create-cloud-error';

import { type UploaderFile } from '../uploader-file';

export class ParallelUploadController extends AbstractUploadController
{
	#file: UploaderFile | null = null;
	#token: string | null | undefined = null;
	#partSize: number | null | undefined = null;
	#partCount: number | null | undefined = null;
	#fileInfo: JsonObject | null | undefined = null;

	#activeXhrs: Set<XMLHttpRequest> = new Set();
	#pendingTimeouts: Set<number> = new Set();
	#aborted: boolean = false;

	// Progress: bytes of completed parts + current progress of in-flight parts.
	#completedSize: number = 0;
	#partProgress: Map<number, number> = new Map();
	#failedParts: Set<number> = new Set();

	constructor(server: Server, options: { [key: string]: any } = {})
	{
		super(server, options);
	}

	upload(file: UploaderFile): void
	{
		if (!Type.isFile(file.getBinary()))
		{
			this.emit('onError', { error: new UploaderError('WRONG_FILE_SOURCE') });

			return;
		}

		if (this.#file !== null)
		{
			// Repeated upload() call within the same instance is not supported.
			return;
		}

		this.#file = file;

		const totalSize: number = file.getSize();
		const chunkSize: number = this.getServer().getChunkSize();
		const firstChunkSize: number = Math.min(chunkSize, totalSize);
		const firstBlob: Blob = (
			firstChunkSize === totalSize
				? file.getBinary()!
				: file.getBinary()!.slice(0, firstChunkSize)
		);

		const firstChunk: Chunk = new Chunk(firstBlob, 0);

		this.#uploadFirstChunk(firstChunk, totalSize);
	}

	abort(): void
	{
		this.#aborted = true;

		for (const xhr of this.#activeXhrs)
		{
			xhr.abort();
		}
		this.#activeXhrs.clear();

		for (const id of this.#pendingTimeouts)
		{
			clearTimeout(id);
		}
		this.#pendingTimeouts.clear();
	}

	#uploadFirstChunk(chunk: Chunk, totalSize: number): void
	{
		const file: UploaderFile = this.#file!;
		const fileName: string = normalizeFileName(file.getName());
		const type: string = Type.isStringFilled(file.getType()) ? file.getType() : 'application/octet-stream';
		const isOnlyOne: boolean = chunk.getSize() === totalSize;

		const headers = [
			{ name: 'Content-Type', value: type },
			{ name: 'X-Upload-Content-Name', value: encodeURIComponent(fileName) },
		];

		if (!isOnlyOne)
		{
			headers.push({
				name: 'Content-Range',
				value: `bytes 0-${chunk.getSize() - 1}/${totalSize}`,
			});
		}

		const retryDelays: number[] = [...this.getServer().getChunkRetryDelays()];

		const attempt = (): void => {
			if (this.#aborted)
			{
				return;
			}

			let xhr: XMLHttpRequest | null = null;

			Ajax.runAction('ui.fileuploader.upload', {
				headers,
				data: chunk.getData(),
				preparePost: false,
				getParameters: {
					controller: this.getServer().getController(),
					controllerOptions: getControllerOptionsJSON(this.getServer()),
					strategy: 'parallel',
					token: '',
				},
				onrequeststart: (req: XMLHttpRequest): void => {
					xhr = req;
					this.#activeXhrs.add(req);
				},
				onprogressupload: (event: ProgressEvent): void => {
					this.#onPartProgress(1, event, chunk.getSize());
				},
			})
				.then((response: AjaxResponse<JsonObject>) => {
					this.#forgetXhr(xhr);
					if (this.#aborted)
					{
						return;
					}

					this.#onFirstChunkComplete(response.data, chunk.getSize());
				})
				.catch((response: AjaxResponse<JsonObject>) => {
					this.#forgetXhr(xhr);
					if (this.#aborted)
					{
						return;
					}

					const error: UploaderError = UploaderError.createFromAjaxErrors(response.errors);
					const shouldRetry: boolean = (
						error.getCode() === 'NETWORK_ERROR'
						|| error.getType() === UploaderError.Type.UNKNOWN
					);

					if (shouldRetry && retryDelays.length > 0)
					{
						const delay: number = retryDelays.shift()!;
						const id: number = setTimeout((): void => {
							this.#pendingTimeouts.delete(id);
							attempt();
						}, delay);
						this.#pendingTimeouts.add(id);
					}
					else
					{
						this.emit('onError', { error });
					}
				});
		};

		attempt();
	}

	#onFirstChunkComplete(data: JsonObject | null | undefined, firstChunkSize: number): void
	{
		if (!data || !data.token)
		{
			this.emit('onError', { error: new UploaderError('SERVER_ERROR') });

			return;
		}

		this.#token = data.token as string;
		this.#partProgress.delete(1);
		this.#completedSize = firstChunkSize;

		if (this.#file!.getServerFileId() === null)
		{
			this.#file!.setServerFileId(data.token as string);
		}

		if (data.file)
		{
			// File fit into a single chunk — server has already committed it.
			this.#fileInfo = data.file as JsonObject;
			this.emit('onProgress', { progress: 100 });
			this.emit('onUpload', { fileInfo: data.file });

			return;
		}

		if (data.strategy !== 'parallel' || !Type.isNumber(data.partSize) || !Type.isNumber(data.partCount))
		{
			// Server did not confirm parallel strategy: unexpected branch.
			this.emit('onError', { error: createCloudError('STRATEGY_MISMATCH') });

			return;
		}

		this.#partSize = data.partSize;
		this.#partCount = data.partCount;

		if (this.#partCount <= 1)
		{
			// Inconsistency: parallel declared but only one part — data.file should have been returned.
			this.emit('onError', { error: new UploaderError('SERVER_ERROR') });

			return;
		}

		this.#scheduleRestParts();
	}

	#scheduleRestParts(): void
	{
		// partNo is 1-based; part #1 is already uploaded with the first POST.
		const queue: number[] = [];
		for (let partNo = 2; partNo <= this.#partCount!; partNo++)
		{
			queue.push(partNo);
		}

		runConcurrentPool({
			items: queue,
			maxConcurrency: this.getServer().getMaxParallelChunks(),
			isAborted: () => this.#aborted,
			task: (partNo: number) => this.#uploadPart(partNo),
			onItemDone: (_partNo, data) => {
				if (data && data.file)
				{
					this.#fileInfo = data.file as JsonObject;
				}
			},
			onAllDone: () => this.#onAllPartsDone(),
			onError: (_partNo, error) => {
				// Cancel the rest of the upload.
				this.abort();
				this.emit('onError', { error });
			},
		});
	}

	#uploadPart(partNo: number): Promise<JsonObject>
	{
		const file: UploaderFile = this.#file!;
		const totalSize: number = file.getSize();
		const startOffset: number = (partNo - 1) * this.#partSize!;
		const endOffset: number = Math.min(startOffset + this.#partSize!, totalSize);
		const partBlob: Blob = file.getBinary()!.slice(startOffset, endOffset);
		const partSize: number = partBlob.size;
		const fileName: string = normalizeFileName(file.getName());
		const type: string = Type.isStringFilled(file.getType()) ? file.getType() : 'application/octet-stream';
		const retryDelays: number[] = [...this.getServer().getChunkRetryDelays()];

		const headers = [
			{ name: 'Content-Type', value: type },
			{ name: 'X-Upload-Content-Name', value: encodeURIComponent(fileName) },
			{ name: 'Content-Range', value: `bytes ${startOffset}-${endOffset - 1}/${totalSize}` },
		];

		return new Promise<JsonObject>((resolve, reject) => {
			const attempt = (): void => {
				if (this.#aborted)
				{
					reject(new UploaderError('FILE_UPLOAD_ABORTED'));

					return;
				}

				let xhr: XMLHttpRequest | null | undefined = null;

				Ajax.runAction('ui.fileuploader.uploadPart', {
					headers,
					data: partBlob,
					preparePost: false,
					getParameters: {
						controller: this.getServer().getController(),
						controllerOptions: getControllerOptionsJSON(this.getServer()),
						token: this.#token,
						partNo,
					},
					onrequeststart: (req: XMLHttpRequest): void => {
						xhr = req;
						this.#activeXhrs.add(req);
					},
					onprogressupload: (event: ProgressEvent): void => {
						this.#onPartProgress(partNo, event, partSize);
					},
				})
					.then((response: AjaxResponse<JsonObject>) => {
						this.#forgetXhr(xhr);
						if (this.#aborted)
						{
							reject(new UploaderError('FILE_UPLOAD_ABORTED'));

							return;
						}

						this.#partProgress.delete(partNo);
						this.#failedParts.delete(partNo);
						this.#completedSize += partSize;
						this.#emitProgress();
						resolve(response.data);
					})
					.catch((response: AjaxResponse<JsonObject>) => {
						this.#forgetXhr(xhr);
						if (this.#aborted)
						{
							reject(new UploaderError('FILE_UPLOAD_ABORTED'));

							return;
						}

						const error: UploaderError = UploaderError.createFromAjaxErrors(response.errors);
						const shouldRetry: boolean = (
							error.getCode() === 'NETWORK_ERROR'
							|| error.getType() === UploaderError.Type.UNKNOWN
						);

						if (shouldRetry && retryDelays.length > 0)
						{
							this.#failedParts.add(partNo);
							this.#partProgress.set(partNo, 0);
							this.#emitProgress();

							const delay: number = retryDelays.shift()!;
							const id: number = setTimeout((): void => {
								this.#pendingTimeouts.delete(id);
								attempt();
							}, delay);
							this.#pendingTimeouts.add(id);
						}
						else
						{
							reject(error);
						}
					});
			};

			attempt();
		});
	}

	#onPartProgress(partNo: number, event: ProgressEvent, partSize: number): void
	{
		// Once a part has failed, freeze its contribution so a retrying part's
		// bytes don't re-grow the bar (it jumps to the confirmed baseline on success).
		if (!event.lengthComputable || this.#failedParts.has(partNo))
		{
			return;
		}

		this.#partProgress.set(partNo, Math.min(event.loaded, partSize));
		this.#emitProgress();
	}

	#emitProgress(): void
	{
		const totalSize: number = this.#file!.getSize();
		let uploaded: number = this.#completedSize;
		for (const v of this.#partProgress.values())
		{
			uploaded += v;
		}

		const progress: number = totalSize > 0 ? Math.floor((uploaded / totalSize) * 100) : 100;
		this.emit('onProgress', { progress: Math.min(progress, 100) });
	}

	#onAllPartsDone(): void
	{
		if (this.#aborted)
		{
			return;
		}

		this.emit('onProgress', { progress: 100 });

		if (this.#fileInfo)
		{
			this.emit('onUpload', { fileInfo: this.#fileInfo });

			return;
		}

		// The server may finalize on a request that completes slightly later — in that case
		// FileInfo will arrive in one of the other branches. If no part returned FileInfo,
		// fall back to getStatus.
		this.#fetchStatusAndFinish();
	}

	#fetchStatusAndFinish(): void
	{
		Ajax.runAction('ui.fileuploader.getStatus', {
			getParameters: {
				controller: this.getServer().getController(),
				controllerOptions: getControllerOptionsJSON(this.getServer()),
				token: this.#token,
			},
		})
			.then((response: AjaxResponse<JsonObject>) => {
				if (this.#aborted)
				{
					return;
				}

				if (response.data && response.data.done && response.data.file)
				{
					this.emit('onUpload', { fileInfo: response.data.file });
				}
				else
				{
					this.emit('onError', { error: createCloudError('FINALIZATION_NOT_READY') });
				}
			})
			.catch((response: AjaxResponse<JsonObject>) => {
				if (this.#aborted)
				{
					return;
				}

				const error: UploaderError = UploaderError.createFromAjaxErrors(response.errors);
				this.emit('onError', { error });
			});
	}

	#forgetXhr(xhr: XMLHttpRequest | null | undefined): void
	{
		if (xhr)
		{
			this.#activeXhrs.delete(xhr);
		}
	}
}
