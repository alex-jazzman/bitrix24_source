import { Dom, Event, Type, ajax } from 'main.core';
import { MAX_IMAGE_SIZE, MAX_FILE_SIZE } from '../const';
import { toPositiveInt } from '../utils/normalize';

type UploadOptions = {
	collectionId: number,
	documentId: number,
	allowMedia?: boolean,
};

type AssertOptions = {
	accept: string,
	maxSize: number,
	allowMedia?: boolean,
};

type UploadedFile = {
	id: number | null,
	fileId: number | null,
	name: string,
	size: number,
	type: string,
	downloadUrl: string,
	showUrl: string,
	viewerAttrs: Object,
};

export class FileUploadService
{
	static isAcceptedFileType(file: File, accept: string): boolean
	{
		if (!accept || accept.trim() === '' || accept.trim() === '*/*')
		{
			return true;
		}

		const fileType = (file.type ?? '').toLowerCase();
		const fileName = (file.name ?? '').toLowerCase();
		const tokens = accept
			.split(',')
			.map((token) => token.trim().toLowerCase())
			.filter(Boolean)
		;

		return tokens.some((token) => {
			if (token === '*/*')
			{
				return true;
			}

			if (token.endsWith('/*'))
			{
				const prefix = token.slice(0, -1);

				return fileType.startsWith(prefix);
			}

			if (token.startsWith('.'))
			{
				return fileName.endsWith(token);
			}

			return fileType === token;
		});
	}

	static isMediaFile(file: File): boolean
	{
		const type = file?.type ?? '';

		return type.startsWith('image/') || type.startsWith('video/');
	}

	static pickFile({ accept = '*/*' }: { accept?: string } = {}): Promise<File | null>
	{
		return new Promise((resolve) => {
			const input = document.createElement('input');
			input.type = 'file';
			input.accept = accept;
			Dom.style(input, 'display', 'none');
			Dom.append(input, document.body);

			const onChange = () => {
				const file = input.files?.[0] ?? null;
				Event.unbind(input, 'change', onChange);
				Dom.remove(input);
				resolve(file);
			};
			Event.bind(input, 'change', onChange, { once: true });

			input.click();
		});
	}

	static assertFile(file: File, { accept, maxSize, allowMedia = true }: AssertOptions): void
	{
		if (!file)
		{
			throw new Error('No file provided');
		}

		if (!this.isAcceptedFileType(file, accept))
		{
			throw new Error('Unsupported file type');
		}

		if (!allowMedia && this.isMediaFile(file))
		{
			throw new Error('Media files are not allowed');
		}

		if (file.size > maxSize)
		{
			throw new Error('File is too large');
		}
	}

	static createObjectUrl(file: File): string
	{
		return URL.createObjectURL(file);
	}

	static async resolveFile(file: File | null, accept: string): Promise<File>
	{
		const targetFile = file ?? await this.pickFile({ accept });
		if (!targetFile)
		{
			throw new Error('No file selected');
		}

		return targetFile;
	}

	static async uploadImage(file: File | null = null, options: UploadOptions = {}): Promise<string>
	{
		const targetFile = await this.resolveFile(file, 'image/*');
		this.assertFile(targetFile, {
			accept: 'image/*',
			maxSize: MAX_IMAGE_SIZE,
			allowMedia: true,
		});

		const uploaded = await this.uploadToServer(targetFile, options);

		return uploaded.downloadUrl;
	}

	static async uploadVideo(file: File | null = null, options: UploadOptions = {}): Promise<string>
	{
		const uploaded = await this.uploadVideoWithMeta(file, options);

		return uploaded.downloadUrl;
	}

	static async uploadVideoWithMeta(file: File | null = null, options: UploadOptions = {}): Promise<UploadedFile>
	{
		const targetFile = await this.resolveFile(file, 'video/*');
		this.assertFile(targetFile, {
			accept: 'video/*',
			maxSize: MAX_FILE_SIZE,
			allowMedia: true,
		});

		return this.uploadToServer(targetFile, options);
	}

	static async uploadFile(file: File | null = null, options: UploadOptions = {}): Promise<string>
	{
		const uploaded = await this.uploadFileWithMeta(file, options);

		return uploaded.downloadUrl;
	}

	static async uploadFileWithMeta(file: File | null = null, options: UploadOptions = {}): Promise<UploadedFile>
	{
		const allowMedia = options.allowMedia !== false;
		const targetFile = await this.resolveFile(file, '*/*');
		this.assertFile(targetFile, {
			accept: '*/*',
			maxSize: MAX_FILE_SIZE,
			allowMedia,
		});

		return this.uploadToServer(targetFile, options);
	}

	static async uploadToServer(file: File, options: UploadOptions = {}): Promise<UploadedFile>
	{
		const collectionId = toPositiveInt(options.collectionId);
		const documentId = toPositiveInt(options.documentId);
		if (documentId === null)
		{
			throw new Error('Document context is required');
		}

		const formData = new FormData();
		if (collectionId !== null)
		{
			formData.append('collectionId', String(collectionId));
		}
		formData.append('documentId', String(documentId));
		formData.append('file', file, file.name || 'file');

		const response = await ajax.runAction('note.infrastructure.FileController.upload', {
			data: formData,
		});
		const data = response?.data || {};
		const downloadUrl = Type.isString(data.downloadUrl) ? data.downloadUrl : '';
		const showUrl = Type.isString(data.showUrl) ? data.showUrl : downloadUrl;
		if (downloadUrl === '')
		{
			throw new Error('Upload failed');
		}

		return {
			id: Number(data.id) || null,
			fileId: Number(data.fileId ?? data.id) || null,
			name: data.name || file.name || '',
			size: Number(data.size) || Number(file.size) || 0,
			type: data.type || file.type || '',
			downloadUrl,
			showUrl,
			viewerAttrs: Type.isPlainObject(data.viewerAttrs) ? data.viewerAttrs : {},
		};
	}
}
