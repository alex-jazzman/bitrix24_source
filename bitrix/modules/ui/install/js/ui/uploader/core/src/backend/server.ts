import { Extension, Reflection, Type } from 'main.core';
import { UploadController } from './upload-controller';
import { ParallelUploadController } from './parallel-upload-controller';
import { PresignedUploadController } from './presigned-upload-controller';
import { AbstractUploadController } from './abstract-upload-controller';
import { ServerLoadController } from './server-load-controller';
import { AbstractLoadController } from './abstract-load-controller';
import { ClientLoadController } from './client-load-controller';
import { AbstractRemoveController } from './abstract-remove-controller';
import { RemoveController } from './remove-controller';
import { ServerlessLoadController } from './serverless-load-controller';

import { type ServerOptions } from '../types/server-options';
import { type UploaderFile } from '../uploader-file';

export class Server
{
	#controller: string | null = null;
	#controllerOptions: { [key: string]: any } | null | void = null;
	#uploadControllerClass: (new (...args: any[]) => AbstractUploadController) | null = null;
	#uploadControllerOptions: { [key: string]: any } | null | void = {};
	#loadControllerClass: (new (...args: any[]) => AbstractLoadController) | null = null;
	#loadControllerOptions: { [key: string]: any } | null | void = {};
	#removeControllerClass: (new (...args: any[]) => AbstractRemoveController) | null = null;
	#removeControllerOptions: { [key: string]: any } | null | void = {};
	#chunkSize: number | null = null;
	#defaultChunkSize: number | null = null;
	#chunkMinSize: number | null = null;
	#chunkMaxSize: number | null = null;
	#chunkRetryDelays: number[] = [1000, 3000, 6000];
	#parallelChunkUpload: boolean = false;
	#maxParallelChunks: number = 2;
	#presignedChunkUpload: boolean = false;
	#presignedThreshold: number | null = null;
	#presignedRegisterInterval: number = 15000;

	constructor(serverOptions: ServerOptions)
	{
		const options: ServerOptions = Type.isPlainObject(serverOptions) ? serverOptions : {};

		this.#controller = Type.isStringFilled(options.controller) ? options.controller : null;
		this.#controllerOptions = Type.isPlainObject(options.controllerOptions) ? options.controllerOptions : null;

		const chunkSize: number = (
			Type.isNumber(options.chunkSize) && options.chunkSize > 0
				? options.chunkSize
				: this.getDefaultChunkSize() as number
		);

		this.#chunkSize = options.forceChunkSize === true ? chunkSize : this.#calcChunkSize(chunkSize);

		const settings = Extension.getSettings('ui.uploader.core');

		this.#parallelChunkUpload = (
			Type.isBoolean(options.parallelChunkUpload)
				? options.parallelChunkUpload
				: settings.get('parallelChunkUpload', false) as boolean
		);

		const maxParallelChunks: number = (
			Type.isNumber(options.maxParallelChunks) && options.maxParallelChunks > 0
				? options.maxParallelChunks
				: settings.get('maxParallelChunks', 2) as number
		);

		this.#maxParallelChunks = Math.max(1, maxParallelChunks);

		this.#presignedChunkUpload = (
			Type.isBoolean(options.presignedChunkUpload)
				? options.presignedChunkUpload
				: settings.get('presignedChunkUpload', false) as boolean
		);

		const presignedThreshold: number | null = (
			Type.isNumber(options.presignedThreshold)
				? options.presignedThreshold
				: settings.get('presignedThreshold', null)
		);

		this.#presignedThreshold = Type.isNumber(presignedThreshold) && presignedThreshold > 0 ? presignedThreshold : null;

		const registerInterval: number | null = (
			Type.isNumber(options.presignedRegisterInterval)
				? options.presignedRegisterInterval
				: settings.get('presignedRegisterInterval', null)
		);

		this.#presignedRegisterInterval = (
			Type.isNumber(registerInterval)
				? Math.max(0, registerInterval)
				: this.#presignedRegisterInterval
		);

		const chunkRetryDelays = options.chunkRetryDelays;
		if (chunkRetryDelays === false || chunkRetryDelays === null)
		{
			this.#chunkRetryDelays = [];
		}
		else if (Type.isArray(chunkRetryDelays))
		{
			this.#chunkRetryDelays = chunkRetryDelays;
		}

		const controllerClasses: Array<'uploadControllerClass' | 'loadControllerClass' | 'removeControllerClass'> = [
			'uploadControllerClass',
			'loadControllerClass',
			'removeControllerClass',
		];

		controllerClasses.forEach((controllerClass): void => {
			let fn: (new (...args: any[]) => any) | null = null;
			const option = options[controllerClass];
			if (Type.isStringFilled(option))
			{
				fn = Reflection.getClass(option) as (new (...args: any[]) => any) | null;
				if (!Type.isFunction(fn))
				{
					throw new TypeError(`Uploader.Server: "${controllerClass}" must be a function.`);
				}
			}
			else if (Type.isFunction(option))
			{
				fn = option as new (...args: any[]) => any;
			}

			switch (controllerClass)
			{
				case 'uploadControllerClass':
					this.#uploadControllerClass = fn;
					break;
				case 'loadControllerClass':
					this.#loadControllerClass = fn;
					break;
				case 'removeControllerClass':
					this.#removeControllerClass = fn;
					break;
				default:
				// No default
			}
		});

		this.#loadControllerOptions = (
			Type.isPlainObject(options.loadControllerOptions)
				? options.loadControllerOptions
				: {}
		);

		this.#uploadControllerOptions = (
			Type.isPlainObject(options.uploadControllerOptions)
				? options.uploadControllerOptions
				: {}
		);

		this.#removeControllerOptions = (
			Type.isPlainObject(options.removeControllerOptions)
				? options.removeControllerOptions
				: {}
		);
	}

	canCreateUploadController(): boolean
	{
		return this.#uploadControllerClass !== null || Type.isStringFilled(this.#controller);
	}

	createUploadController(file: UploaderFile | null | undefined = null): AbstractUploadController | null
	{
		if (!this.canCreateUploadController())
		{
			return null;
		}

		if (this.#uploadControllerClass)
		{
			const controller: AbstractUploadController = new this.#uploadControllerClass(
				this,
				this.#uploadControllerOptions ?? {},
			);
			if (!(controller instanceof AbstractUploadController))
			{
				throw new TypeError(
					'Uploader.Server: "uploadControllerClass" must be an instance of AbstractUploadController.',
				);
			}

			return controller;
		}

		// Without a file (legacy callers) we have nothing to size-match against —
		// fall back to the safe default sequential controller.
		if (file === null)
		{
			return new UploadController(this, this.#uploadControllerOptions ?? {});
		}

		const fileSize: number = file.getSize();
		const isMultiChunk: boolean = fileSize > this.getChunkSize();

		const qualifiesForPresigned: boolean = this.#presignedThreshold === null
			? isMultiChunk
			: fileSize >= this.#presignedThreshold;

		if (this.isPresignedChunkUploadEnabled() && qualifiesForPresigned && !file.isImage())
		{
			return new PresignedUploadController(this, this.#uploadControllerOptions ?? {});
		}

		// Parallel always needs more than one chunk — a one-part parallel session
		// is just a single POST with bookkeeping overhead.
		if (isMultiChunk && this.isParallelChunkUploadEnabled())
		{
			return new ParallelUploadController(this, this.#uploadControllerOptions ?? {});
		}

		return new UploadController(this, this.#uploadControllerOptions ?? {});
	}

	createServerLoadController(): AbstractLoadController
	{
		if (this.#loadControllerClass)
		{
			const controller: AbstractLoadController = new this.#loadControllerClass(
				this,
				this.#loadControllerOptions ?? {},
			);

			if (!(controller instanceof AbstractLoadController))
			{
				throw new TypeError('Uploader.Server: "loadControllerClass" must be an instance of AbstractLoadController.');
			}

			return controller;
		}

		return this.createDefaultServerLoadController();
	}

	createDefaultServerLoadController(): ServerLoadController
	{
		return new ServerLoadController(this, this.#loadControllerOptions ?? {});
	}

	createClientLoadController(): ClientLoadController
	{
		return new ClientLoadController(this, this.#loadControllerOptions ?? {});
	}

	createServerlessLoadController(): ServerlessLoadController
	{
		return new ServerlessLoadController(this, this.#loadControllerOptions ?? {});
	}

	createRemoveController(): AbstractRemoveController | null | undefined
	{
		if (this.#removeControllerClass)
		{
			const controller: AbstractRemoveController = new this.#removeControllerClass(
				this,
				this.#removeControllerOptions ?? {},
			);
			if (!(controller instanceof AbstractRemoveController))
			{
				throw new TypeError(
					'Uploader.Server: "removeControllerClass" must be an instance of AbstractRemoveController.',
				);
			}

			return controller;
		}

		if (Type.isStringFilled(this.#controller))
		{
			return new RemoveController(this, this.#removeControllerOptions ?? {});
		}

		return null;
	}

	getController(): string | null | undefined
	{
		return this.#controller;
	}

	getControllerOptions(): { [key: string]: any } | null | void
	{
		return this.#controllerOptions;
	}

	getChunkSize(): number
	{
		return this.#chunkSize!;
	}

	getDefaultChunkSize(): number
	{
		if (this.#defaultChunkSize === null)
		{
			const settings = Extension.getSettings('ui.uploader.core');
			this.#defaultChunkSize = settings.get('defaultChunkSize', 5 * 1024 * 1024);
		}

		return this.#defaultChunkSize!;
	}

	getChunkMinSize(): number
	{
		if (this.#chunkMinSize === null)
		{
			const settings = Extension.getSettings('ui.uploader.core');
			this.#chunkMinSize = settings.get('chunkMinSize', 1024 * 1024);
		}

		return this.#chunkMinSize!;
	}

	getChunkMaxSize(): number
	{
		if (this.#chunkMaxSize === null)
		{
			const settings = Extension.getSettings('ui.uploader.core');
			this.#chunkMaxSize = settings.get('chunkMaxSize', 5 * 1024 * 1024);
		}

		return this.#chunkMaxSize!;
	}

	getChunkRetryDelays(): number[]
	{
		return this.#chunkRetryDelays;
	}

	isParallelChunkUploadEnabled(): boolean
	{
		return this.#parallelChunkUpload;
	}

	getMaxParallelChunks(): number
	{
		return this.#maxParallelChunks;
	}

	isPresignedChunkUploadEnabled(): boolean
	{
		return this.#presignedChunkUpload;
	}

	/**
	 * Lower bound (in bytes) above which the presigned strategy is allowed to
	 * kick in. null means no threshold — every multi-chunk file qualifies.
	 */
	getPresignedThreshold(): number | null | undefined
	{
		return this.#presignedThreshold;
	}

	getPresignedRegisterInterval(): number
	{
		return this.#presignedRegisterInterval;
	}

	#calcChunkSize(chunkSize: number): number
	{
		return Math.min(Math.max(this.getChunkMinSize(), chunkSize), this.getChunkMaxSize());
	}
}
