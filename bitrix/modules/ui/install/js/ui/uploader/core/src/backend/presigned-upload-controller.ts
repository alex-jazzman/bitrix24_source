import { ajax as Ajax, Type, type AjaxResponse, type JsonObject } from 'main.core';

import { Server } from './server';
import { AbstractUploadController } from './abstract-upload-controller';
import { ParallelUploadController } from './parallel-upload-controller';
import { UploadController } from './upload-controller';
import { UploaderError } from '../uploader-error';
import { runConcurrentPool } from './utils/run-concurrent-pool';
import { normalizeFileName } from './utils/normalize-file-name';
import { getControllerOptionsJSON } from './utils/get-controller-options-json';
import { relayUploadEvents } from './utils/relay-upload-events';
import { createCloudError } from './utils/create-cloud-error';

import { type UploaderFile } from '../uploader-file';

const RETRIABLE_ERROR_CODES: Set<string> = new Set(['NETWORK_ERROR', 'EXPIRED_URL', 'S3_ERROR']);
const FINALIZE_RETRIABLE_ERROR_CODES: Set<string> = new Set([
	'NETWORK_ERROR',
	'CLOUD_FINISH_UPLOAD_FAILED',
	'FINALIZATION_IN_PROGRESS',
]);

export class PresignedUploadController extends AbstractUploadController
{
	#file: UploaderFile | null = null;
	#token: string | null | undefined = null;
	#partSize: number | null | undefined = null;
	#partCount: number | null | undefined = null;

	#activeXhrs: Set<XMLHttpRequest> = new Set();
	#pendingTimeouts: Set<number> = new Set();
	#pendingWaitRejects: Set<(reason?: unknown) => void> = new Set();
	#aborted: boolean = false;
	#fellBack: boolean = false;
	#fallbackController: AbstractUploadController | null | undefined = null;

	// partNo → url cache, seeded by initPresigned and topped up by refresh requests.
	#urlCache: Map<number, string> = new Map();
	#partETags: Map<number, string> = new Map();
	#registeredParts: Set<number> = new Set();
	#flushTimerId: number | null | undefined = null;
	#flushing: boolean = false;

	// Progress: bytes of completed parts + current bytes of in-flight parts.
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
			// Repeated upload() in the same instance is not supported.
			return;
		}

		this.#file = file;
		this.#initSession();
	}

	abort(): void
	{
		this.#aborted = true;
		this.#cancelTransfers();

		if (this.#fallbackController)
		{
			this.#fallbackController.abort();
		}
	}

	// True once the presigned pipeline must stop spinning new work — either the
	// user aborted, or we've handed the upload over to the backend fallback.
	#isStopped(): boolean
	{
		return this.#aborted || this.#fellBack;
	}

	#cancelTransfers(): void
	{
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

		for (const reject of this.#pendingWaitRejects)
		{
			reject(new UploaderError('FILE_UPLOAD_ABORTED'));
		}

		this.#pendingWaitRejects.clear();
	}

	#fallBackToBackend(): void
	{
		if (this.#isStopped())
		{
			return;
		}

		this.#fellBack = true;

		// Stop the in-flight PUTs quietly — their aborts must not surface as errors.
		this.#cancelTransfers();

		// The abandoned presigned session (S3 multipart + temp record) is reclaimed
		// by the server-side GC agents. Drop the stale presigned token so the
		// fallback controller registers its own upload.
		this.#file?.setServerFileId(null);

		this.#delegateToFallback();
	}

	#initSession(): void
	{
		const file: UploaderFile = this.#file as UploaderFile;
		const fileName: string = normalizeFileName(file.getName());
		const type: string = Type.isStringFilled(file.getType()) ? file.getType() : 'application/octet-stream';

		// Forward serverOptions.chunkSize as a hint — server clamps it to
		// [minUploadPartSize, chunkMaxSize] anyway.
		const data: {
			name: string;
			size: number;
			type: string;
			partSize?: number;
			width?: number;
			height?: number;
		} = {
			name: fileName,
			size: file.getSize(),
			type,
		};
		const requestedPartSize: number = this.getServer().getChunkSize();
		if (Type.isNumber(requestedPartSize) && requestedPartSize > 0)
		{
			data.partSize = requestedPartSize;
		}

		// width / height come from the local preview pipeline (ImagePreviewFilter)
		// and are only known for images. Server uses them for image-specific config
		// checks; non-images leave the fields out.
		const width: number | null | undefined = file.getWidth();
		if (Type.isNumber(width) && width > 0)
		{
			data.width = width;
		}
		const height: number | null | undefined = file.getHeight();
		if (Type.isNumber(height) && height > 0)
		{
			data.height = height;
		}

		Ajax.runAction('ui.fileuploader.initPresigned', {
			getParameters: {
				controller: this.getServer().getController(),
				controllerOptions: getControllerOptionsJSON(this.getServer()),
			},
			data,
		})
			.then((response: AjaxResponse<JsonObject>) => {
				if (this.#aborted)
				{
					return;
				}

				this.#onInitComplete(response.data);
			})
			.catch((response: AjaxResponse<JsonObject>) => {
				if (this.#aborted)
				{
					return;
				}

				const error: UploaderError = UploaderError.createFromAjaxErrors(response.errors);
				if (error.getCode() === 'PRESIGNED_UNSUPPORTED')
				{
					// Bucket cannot produce presigned URLs (not S3-compatible / no
					// bucket matched). Transparently delegate to the parallel
					// controller, which the same backend will accept.
					this.#delegateToFallback();

					return;
				}

				this.emit('onError', { error });
			});
	}

	/**
	 * Delegates the current file to a server-mediated upload controller. Used as a
	 * transparent fallback both when the bucket cannot presign at all
	 * (PRESIGNED_UNSUPPORTED at init) and when the direct-to-S3 transfer fails
	 * mid-flight (see #fallBackToBackend).
	 */
	#delegateToFallback(): void
	{
		const server: Server = this.getServer();
		const fallback: AbstractUploadController = server.isParallelChunkUploadEnabled()
			? new ParallelUploadController(server, this.getOptions())
			: new UploadController(server, this.getOptions());

		this.#delegateTo(fallback);
	}

	/**
	 * Hands the actual transfer over to another controller, re-emitting its
	 * lifecycle events so outer subscribers don't notice the swap.
	 */
	#delegateTo(fallback: AbstractUploadController): void
	{
		if (this.#aborted)
		{
			return;
		}

		this.#fallbackController = fallback;
		relayUploadEvents(fallback, this);
		fallback.upload(this.#file as UploaderFile);
	}

	#onInitComplete(data: JsonObject | null | undefined): void
	{
		if (
			!data
			|| !data.token
			|| data.strategy !== 'presigned'
			|| !Type.isNumber(data.partSize)
			|| !Type.isNumber(data.partCount)
		)
		{
			this.emit('onError', { error: new UploaderError('SERVER_ERROR') });

			return;
		}

		this.#token = data.token as string;
		this.#partSize = data.partSize as number;
		this.#partCount = data.partCount as number;
		this.#file?.setServerFileId(data.token as string);

		if (Array.isArray(data.parts))
		{
			for (const entry of data.parts as Array<{ partNo: number; url: string }>)
			{
				if (Type.isNumber(entry.partNo) && Type.isStringFilled(entry.url))
				{
					this.#urlCache.set(entry.partNo, entry.url);
				}
			}
		}

		this.#scheduleParts();
	}

	#scheduleParts(): void
	{
		const queue: number[] = [];
		for (let partNo = 1; partNo <= (this.#partCount as number); partNo++)
		{
			queue.push(partNo);
		}

		runConcurrentPool({
			items: queue,
			maxConcurrency: this.getServer().getMaxParallelChunks(),
			isAborted: () => this.#isStopped(),
			task: (partNo: number) => this.#uploadAndRegister(partNo),
			onAllDone: () => this.#finalize(),
			onError: (_partNo, error) => {
				// User aborts are not errors to recover from.
				if (this.#isStopped() || (error instanceof UploaderError && error.getCode() === 'FILE_UPLOAD_ABORTED'))
				{
					return;
				}

				// Fall back to the backend only when NOT A SINGLE part reached S3.
				if (this.#partETags.size === 0)
				{
					this.#fallBackToBackend();

					return;
				}

				this.abort();
				this.emit('onError', { error });
			},
		});
	}

	async #uploadAndRegister(partNo: number): Promise<void>
	{
		const blob: Blob = this.#sliceForPart(partNo);
		const retryDelays: number[] = [...this.getServer().getChunkRetryDelays()];

		// Single attempt loop with refresh-on-failure for ExpiredToken/network errors.
		/* eslint-disable no-await-in-loop -- sequential retry: each attempt depends on the previous one's outcome */
		while (true)
		{
			if (this.#isStopped())
			{
				throw new UploaderError('FILE_UPLOAD_ABORTED');
			}

			const url: string = await this.#getUrlForPart(partNo);

			try
			{
				const etag: string = await this.#putBlobToCloud(url, blob, partNo);

				this.#partETags.set(partNo, etag);
				this.#partProgress.delete(partNo);
				this.#failedParts.delete(partNo);
				this.#completedSize += blob.size;
				this.#urlCache.delete(partNo);
				this.#emitProgress();
				this.#scheduleRegisterFlush();

				return;
			}
			catch (error)
			{
				if (this.#isStopped())
				{
					throw error;
				}

				if (!(error instanceof UploaderError) || retryDelays.length === 0)
				{
					throw error;
				}

				if (!RETRIABLE_ERROR_CODES.has(error.getCode() ?? ''))
				{
					throw error;
				}

				this.#urlCache.delete(partNo);
				this.#failedParts.add(partNo);
				this.#partProgress.set(partNo, 0);
				this.#emitProgress();

				await this.#wait(retryDelays.shift() as number);
			}
		}
		/* eslint-enable no-await-in-loop */
	}

	async #getUrlForPart(partNo: number): Promise<string>
	{
		const cached: string | null | undefined = this.#urlCache.get(partNo);
		if (Type.isStringFilled(cached))
		{
			return cached;
		}

		const urls: Map<number, string> = await this.#fetchUrlsFromServer([partNo]);
		const url: string | null | undefined = urls.get(partNo);
		if (!Type.isStringFilled(url))
		{
			throw createCloudError('PRESIGNED_URL_FAILED', { partNo });
		}

		return url;
	}

	#fetchUrlsFromServer(partNumbers: number[]): Promise<Map<number, string>>
	{
		return Ajax.runAction('ui.fileuploader.refreshPresigned', {
			getParameters: {
				controller: this.getServer().getController(),
				controllerOptions: getControllerOptionsJSON(this.getServer()),
			},
			data: {
				token: this.#token,
				partNumbers,
			},
		})
			.then((response: AjaxResponse<JsonObject>) => {
				const parts = ((response.data && response.data.parts) || []) as Array<{ partNo: number; url: string }>;
				const result: Map<number, string> = new Map();
				for (const entry of parts)
				{
					const partNo: number = Number(entry.partNo);
					if (Type.isStringFilled(entry.url))
					{
						this.#urlCache.set(partNo, entry.url);
						result.set(partNo, entry.url);
					}
				}

				return result;
			})
			.catch((response: AjaxResponse<JsonObject>) => {
				throw UploaderError.createFromAjaxErrors(response.errors);
			});
	}

	#putBlobToCloud(url: string, blob: Blob, partNo: number): Promise<string>
	{
		return new Promise<string>((resolve, reject) => {
			if (this.#isStopped())
			{
				reject(new UploaderError('FILE_UPLOAD_ABORTED'));

				return;
			}

			// Direct PUT to S3 — XMLHttpRequest (not BX.ajax) so cookies/CSRF don't leak
			// into the presigned signature, and to access ETag via getResponseHeader.
			const xhr = new XMLHttpRequest();
			xhr.open('PUT', url, true);

			xhr.upload.onprogress = (event: ProgressEvent): void => {
				// Once a part has failed, freeze its contribution: a retrying part's
				// bytes must not re-grow the bar (it jumps straight to the confirmed
				// baseline once the retry succeeds).
				if (event.lengthComputable && !this.#failedParts.has(partNo))
				{
					this.#partProgress.set(partNo, Math.min(event.loaded, blob.size));
					this.#emitProgress();
				}
			};

			xhr.onload = (): void => {
				this.#activeXhrs.delete(xhr);
				if (xhr.status >= 200 && xhr.status < 300)
				{
					// S3 returns ETag wrapped in double quotes, e.g. "abc123...".
					// Keep them — CompleteMultipartUpload expects the literal value.
					const etag: string | null | undefined = xhr.getResponseHeader('ETag');
					if (!Type.isStringFilled(etag))
					{
						// Most commonly missing because the bucket lacks
						// Access-Control-Expose-Headers: ETag in its CORS policy.
						reject(createCloudError('INVALID_ETAG', { partNo }));

						return;
					}

					resolve(etag);
				}
				else if (xhr.status === 403 && /ExpiredToken|AccessDenied/.test(xhr.responseText || ''))
				{
					reject(createCloudError('EXPIRED_URL', { partNo }));
				}
				else
				{
					reject(createCloudError('S3_ERROR', { partNo, status: xhr.status }));
				}
			};

			xhr.onerror = (): void => {
				this.#activeXhrs.delete(xhr);
				reject(new UploaderError('NETWORK_ERROR'));
			};

			xhr.onabort = (): void => {
				this.#activeXhrs.delete(xhr);
				reject(new UploaderError('FILE_UPLOAD_ABORTED'));
			};

			this.#activeXhrs.add(xhr);
			xhr.send(blob);
		});
	}

	#scheduleRegisterFlush(): void
	{
		const interval: number = this.getServer().getPresignedRegisterInterval();
		if (interval <= 0 || this.#flushTimerId !== null || this.#isStopped())
		{
			return;
		}

		const id: number = setTimeout((): void => {
			this.#pendingTimeouts.delete(id);
			this.#flushTimerId = null;
			this.#flushRegistrations();
		}, interval);

		this.#pendingTimeouts.add(id);
		this.#flushTimerId = id;
	}

	#flushRegistrations(): void
	{
		if (this.#isStopped() || this.#flushing)
		{
			return;
		}

		const parts: Array<{ partNo: number; etag: string }> = this.#collectUnregisteredParts();
		if (parts.length === 0)
		{
			return;
		}

		this.#flushing = true;

		Ajax.runAction('ui.fileuploader.registerParts', {
			getParameters: {
				controller: this.getServer().getController(),
				controllerOptions: getControllerOptionsJSON(this.getServer()),
			},
			data: {
				token: this.#token,
				parts,
			},
		})
			.then((): void => {
				this.#flushing = false;
				for (const { partNo } of parts)
				{
					this.#registeredParts.add(partNo);
				}

				// More ETags may have landed while the request was in flight.
				this.#scheduleRegisterFlush();
			})
			.catch((): void => {
				// Interim registration is best-effort: unregistered parts are retried
				// on the next flush or sent with completePresigned. No error surfaced.
				this.#flushing = false;
			});
	}

	#collectUnregisteredParts(): Array<{ partNo: number; etag: string }>
	{
		const parts: Array<{ partNo: number; etag: string }> = [];
		this.#partETags.forEach((etag: string, partNo: number) => {
			if (!this.#registeredParts.has(partNo))
			{
				parts.push({ partNo, etag });
			}
		});

		return parts;
	}

	#finalize(): void
	{
		if (this.#aborted)
		{
			return;
		}

		// Cancel any pending interim flush — completePresigned carries the remainder.
		if (this.#flushTimerId !== null)
		{
			clearTimeout(this.#flushTimerId);
			this.#pendingTimeouts.delete(this.#flushTimerId as number);
			this.#flushTimerId = null;
		}

		const retryDelays: number[] = [...this.getServer().getChunkRetryDelays()];

		const attempt = (): void => {
			// Re-collected each attempt — re-registering ETags is idempotent server-side.
			const parts: Array<{ partNo: number; etag: string }> = this.#collectUnregisteredParts();

			Ajax.runAction('ui.fileuploader.completePresigned', {
				getParameters: {
					controller: this.getServer().getController(),
					controllerOptions: getControllerOptionsJSON(this.getServer()),
				},
				data: {
					token: this.#token,
					parts,
				},
			})
				.then((response: AjaxResponse<JsonObject>) => {
					if (this.#aborted)
					{
						return;
					}

					const fileInfo = (response.data && response.data.file) as JsonObject | null | undefined;
					if (fileInfo)
					{
						this.emit('onProgress', { progress: 100 });
						this.emit('onUpload', { fileInfo });
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
					if (FINALIZE_RETRIABLE_ERROR_CODES.has(error.getCode() ?? '') && retryDelays.length > 0)
					{
						const id: number = setTimeout((): void => {
							this.#pendingTimeouts.delete(id);
							attempt();
						}, retryDelays.shift() as number);

						this.#pendingTimeouts.add(id);

						return;
					}

					this.emit('onError', { error });
				});
		};

		attempt();
	}

	#emitProgress(): void
	{
		const totalSize: number = (this.#file as UploaderFile).getSize();
		let uploaded: number = this.#completedSize;
		for (const v of this.#partProgress.values())
		{
			uploaded += v;
		}

		const progress: number = totalSize > 0 ? Math.floor((uploaded / totalSize) * 100) : 100;
		// Cap to 99% until completePresigned actually finalizes the object.
		// xhr.upload onprogress fires when bytes leave the browser, but the
		// upload isn't really "done" until the server has run
		// CompleteMultipartUpload and returned FileInfo. With a concurrent pool
		// the sum of in-flight loaded bytes briefly hits totalSize well before
		// completePresigned resolves, which would otherwise emit a misleading
		// 100% while finalization is still in flight.
		this.emit('onProgress', { progress: Math.min(progress, 99) });
	}

	#sliceForPart(partNo: number): Blob
	{
		const file: UploaderFile = this.#file as UploaderFile;
		const partSize: number = this.#partSize as number;
		const startOffset: number = (partNo - 1) * partSize;
		const endOffset: number = Math.min(startOffset + partSize, file.getSize());

		const binary: File = file.getBinary() as File;

		// Range covers the whole file (a file that fits in one part) — return the
		// original File: avoids a slice copy and preserves blob.type, which would
		// matter if the presigned URL ever signs content-type.
		if (startOffset === 0 && endOffset === file.getSize())
		{
			return binary;
		}

		return binary.slice(startOffset, endOffset);
	}

	#wait(ms: number): Promise<void>
	{
		return new Promise<void>((resolve, reject) => {
			this.#pendingWaitRejects.add(reject);
			const id: number = setTimeout((): void => {
				this.#pendingTimeouts.delete(id);
				this.#pendingWaitRejects.delete(reject);
				resolve();
			}, ms);

			this.#pendingTimeouts.add(id);
		});
	}
}
