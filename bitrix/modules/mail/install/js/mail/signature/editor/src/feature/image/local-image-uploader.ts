import { Event, Type } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import {
	Uploader,
	type UploaderFile,
	type UploaderOptions,
} from 'ui.uploader.core';

import { SignatureImageClientLimit } from '../../const/signature-image';

type UploaderFactory = (options: UploaderOptions) => Uploader;

const FILE_UPLOAD_START_EVENT = 'File:onUploadStart';
const FILE_UPLOAD_COMPLETE_EVENT = 'File:onUploadComplete';
const FILE_ERROR_EVENT = 'File:onError';
const SIGNATURE_IMAGE_UPLOADER_CONTROLLER = 'mail.fileUploader.signatureImageUploaderController';
const FILE_UPLOAD_ERROR_MESSAGE = 'File upload failed.';
const SAFE_ERROR_CODE_PATTERN = /^[\dA-Z_]+$/;

export type LocalImageUploaderOptions = {
	uploaderFactory?: UploaderFactory,
};

type ActiveUpload = {
	uploader: Uploader,
	input: HTMLInputElement,
	resolve: (uploadId: string | null) => void,
	reject: (error: Error) => void,
	settled: boolean,
};

export class LocalImageUploader
{
	#uploaderFactory: UploaderFactory;
	#active: ActiveUpload | null = null;

	constructor(options: LocalImageUploaderOptions)
	{
		this.#uploaderFactory = options.uploaderFactory ?? ((uploaderOptions) => new Uploader(uploaderOptions));
	}

	choose(onUploadStart: () => void = () => {}): Promise<string | null>
	{
		if (this.#active)
		{
			return Promise.reject(new Error('A local image selection is already active.'));
		}

		return new Promise<string | null>((resolve, reject) => {
			const input = document.createElement('input');
			input.type = 'file';
			const uploader = this.#uploaderFactory({
				controller: SIGNATURE_IMAGE_UPLOADER_CONTROLLER,
				browseElement: input,
				autoUpload: true,
				multiple: false,
				acceptOnlyImages: true,
				acceptedFileTypes: ['image/jpeg', 'image/png', 'image/gif'],
				maxFileSize: SignatureImageClientLimit.MaxFileSize,
				events: {
					[FILE_UPLOAD_START_EVENT]: onUploadStart,
					[FILE_UPLOAD_COMPLETE_EVENT]: (event: BaseEvent) => {
						const file = event.getData().file as UploaderFile;
						const serverFileId = file.getServerFileId();
						if (Type.isStringFilled(serverFileId) || Type.isNumber(serverFileId))
						{
							this.#settleAfterEvent(String(serverFileId), null, true);

							return;
						}

						this.#settleAfterEvent(null, new Error('The upload did not return a file id.'));
					},
					[FILE_ERROR_EVENT]: (event: BaseEvent) => {
						this.#settleAfterEvent(null, this.#toError(event.getData().error));
					},
				},
			});

			this.#active = { uploader, input, resolve, reject, settled: false };
			Event.bind(input, 'cancel', this.#handleCancel);
			input.click();
		});
	}

	cancel(): void
	{
		this.#settle(null);
	}

	#handleCancel = (): void => {
		this.#settle(null);
	};

	#settleAfterEvent(
		uploadId: string | null,
		error: Error | null = null,
		keepServerFile: boolean = false,
	): void
	{
		void Promise.resolve().then(() => this.#settle(uploadId, error, keepServerFile));
	}

	#settle(uploadId: string | null, error: Error | null = null, keepServerFile: boolean = false): void
	{
		const active = this.#active;
		if (!active || active.settled)
		{
			return;
		}

		active.settled = true;
		Event.unbind(active.input, 'cancel', this.#handleCancel);
		active.uploader.destroy({ removeFilesFromServer: !keepServerFile });
		this.#active = null;

		if (error)
		{
			active.reject(error);
		}
		else
		{
			active.resolve(uploadId);
		}
	}

	#toError(error: unknown): Error
	{
		if (error instanceof Error && Type.isStringFilled(error.message))
		{
			return error;
		}

		const uploaderError = error as {
			getMessage?: () => unknown,
			getCode?: () => unknown,
		} | null;
		const getMessage = uploaderError?.getMessage;
		const message = Type.isFunction(getMessage) ? getMessage.call(error) : '';
		if (Type.isStringFilled(message))
		{
			return new Error(message);
		}

		const getCode = uploaderError?.getCode;
		const code = Type.isFunction(getCode) ? getCode.call(error) : '';
		if (Type.isStringFilled(code) && SAFE_ERROR_CODE_PATTERN.test(code))
		{
			return new Error(code);
		}

		return new Error(FILE_UPLOAD_ERROR_MESSAGE);
	}
}
