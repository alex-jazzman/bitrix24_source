import { Type } from 'main.core';

import { signatureImageService } from '../../infrastructure/service/signature-image/signature-image-service';
import {
	type SignatureImageDto,
	type SignatureImageVariantName,
} from '../../infrastructure/service/signature-image/types';
import { buildSignatureImageMarker } from '../../lib/signature-image/markup';
import { ImageSizeMenu } from './image-size-menu';
import { ImageUploadProgress } from './image-upload-progress';
import {
	type SignatureEditorCapability,
	type SignatureEditorContext,
	type SignatureHtmlEditorBookmark,
} from '../../types';

export type ImageCapabilityState = 'idle' | 'choosing' | 'uploading' | 'sizing' | 'ready' | 'destroyed';

type LocalImageSource = {
	choose(onUploadStart: () => void): Promise<string | null>,
	cancel(): void,
};

type DiskImageSource = {
	choose(): Promise<number | null>,
	cancel(): void,
};

type SignatureImageService = {
	upload(uploadId: string): Promise<SignatureImageDto>,
	copy(objectId: number): Promise<SignatureImageDto>,
};

type MarkerBuilder = (image: SignatureImageDto, variant: SignatureImageVariantName) => HTMLImageElement;

type SizeMenu = {
	choose(image: SignatureImageDto, anchor: HTMLElement | null): Promise<SignatureImageVariantName | null>,
	destroy(): void,
};

type UploadProgress = {
	show(anchor: HTMLElement | null): void,
	destroy(): void,
};

export type ImageCapabilityOptions = {
	localUploader: LocalImageSource,
	diskPicker: DiskImageSource,
	service?: SignatureImageService,
	markerBuilder?: MarkerBuilder,
	sizeMenu?: SizeMenu,
	uploadProgress?: UploadProgress,
};

export class ImageCapability implements SignatureEditorCapability
{
	#localUploader: LocalImageSource;
	#diskPicker: DiskImageSource;
	#service: SignatureImageService;
	#markerBuilder: MarkerBuilder;
	#sizeMenu: SizeMenu;
	#uploadProgress: UploadProgress;
	#context: SignatureEditorContext | null = null;
	#state: ImageCapabilityState = 'idle';
	#bookmark: SignatureHtmlEditorBookmark | null = null;
	#activePromise: Promise<void> | null = null;
	#requestVersion: number = 0;
	#menuAnchor: HTMLElement | null = null;

	constructor(options: ImageCapabilityOptions)
	{
		this.#localUploader = options.localUploader;
		this.#diskPicker = options.diskPicker;
		this.#service = options.service ?? signatureImageService;
		this.#markerBuilder = options.markerBuilder ?? buildSignatureImageMarker;
		this.#sizeMenu = options.sizeMenu ?? new ImageSizeMenu();
		this.#uploadProgress = options.uploadProgress ?? new ImageUploadProgress();
	}

	connect(context: SignatureEditorContext): void
	{
		if (this.#state !== 'destroyed')
		{
			this.#context = context;
		}
	}

	getState(): ImageCapabilityState
	{
		return this.#state;
	}

	prepareInsertion(anchor: HTMLElement | null = null): void
	{
		if (!this.#context || this.#state === 'destroyed' || this.#activePromise)
		{
			return;
		}

		let menuAnchor = anchor;
		if (!menuAnchor?.isConnected)
		{
			menuAnchor = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		}
		this.#bookmark ??= this.#context.editor.saveBookmark();
		this.#menuAnchor = menuAnchor;
		menuAnchor?.focus({ preventScroll: true });
	}

	chooseLocal(): Promise<void>
	{
		return this.#start(
			() => this.#localUploader.choose(() => this.#markUploading()),
			(uploadId: string) => this.#service.upload(uploadId),
		);
	}

	chooseDisk(): Promise<void>
	{
		return this.#start(
			() => this.#diskPicker.choose(),
			(objectId: number) => this.#service.copy(objectId),
		);
	}

	async beforeSave(): Promise<boolean>
	{
		const activePromise = this.#activePromise;
		if (activePromise)
		{
			await activePromise;
		}

		return this.#state !== 'destroyed';
	}

	disconnect(): void
	{
		if (this.#state === 'destroyed')
		{
			return;
		}

		this.#requestVersion++;
		this.#state = 'destroyed';
		this.#context = null;
		this.#bookmark = null;
		this.#menuAnchor = null;
		this.#activePromise = null;
		this.#localUploader.cancel();
		this.#diskPicker.cancel();
		this.#sizeMenu.destroy();
		this.#uploadProgress.destroy();
	}

	#start<T>(choose: () => Promise<T | null>, create: (value: T) => Promise<SignatureImageDto>): Promise<void>
	{
		if (this.#activePromise)
		{
			return this.#activePromise;
		}

		const context = this.#context;
		if (!context || this.#state === 'destroyed')
		{
			return Promise.resolve();
		}

		this.#menuAnchor ??= document.activeElement instanceof HTMLElement ? document.activeElement : null;
		this.#bookmark ??= context.editor.saveBookmark();
		if (!this.#bookmark)
		{
			this.#menuAnchor = null;

			return Promise.resolve();
		}

		this.#state = 'choosing';
		const requestVersion = ++this.#requestVersion;
		const request = this.#perform(requestVersion, choose, create);
		this.#activePromise = request;
		void request.then(() => {
			if (this.#activePromise === request)
			{
				this.#activePromise = null;
			}
		});

		return request;
	}

	async #perform<T>(
		requestVersion: number,
		choose: () => Promise<T | null>,
		create: (value: T) => Promise<SignatureImageDto>,
	): Promise<void>
	{
		try
		{
			const value = await choose();
			if (!this.#isCurrent(requestVersion))
			{
				return;
			}

			if (value === null)
			{
				this.#state = 'idle';
				this.#restoreFocus();

				return;
			}

			this.#markUploading();
			const image = await create(value);
			if (!this.#isCurrent(requestVersion))
			{
				return;
			}

			this.#uploadProgress.destroy();
			this.#state = 'sizing';
			const variant = await this.#sizeMenu.choose(image, this.#menuAnchor);
			if (!this.#isCurrent(requestVersion))
			{
				return;
			}

			if (variant === null)
			{
				this.#state = 'idle';
				this.#restoreFocus();

				return;
			}

			const marker = this.#markerBuilder(image, variant);
			const inserted = this.#bookmark
				? this.#context?.editor.insertNodeAtBookmark(this.#bookmark, marker) === true
				: false;
			this.#state = inserted ? 'ready' : 'idle';
			if (!inserted)
			{
				this.#restoreFocus();
			}
		}
		catch (error)
		{
			if (this.#isCurrent(requestVersion))
			{
				this.#state = 'idle';
				const message = (error as { message?: unknown } | null)?.message;
				if (Type.isStringFilled(message))
				{
					this.#context?.showError(message);
				}
				this.#restoreFocus();
			}
		}
		finally
		{
			this.#uploadProgress.destroy();
			if (this.#isCurrent(requestVersion))
			{
				this.#bookmark = null;
				this.#menuAnchor = null;
			}
		}
	}

	#markUploading(): void
	{
		if (this.#state === 'choosing')
		{
			this.#state = 'uploading';
			this.#uploadProgress.show(this.#menuAnchor);
		}
	}

	#restoreFocus(): void
	{
		if (!this.#context)
		{
			return;
		}

		if (!this.#bookmark || !this.#context.editor.restoreBookmark(this.#bookmark))
		{
			this.#context.editor.focus();
		}
	}

	#isCurrent(requestVersion: number): boolean
	{
		return this.#state !== 'destroyed'
			&& this.#context !== null
			&& requestVersion === this.#requestVersion;
	}
}
