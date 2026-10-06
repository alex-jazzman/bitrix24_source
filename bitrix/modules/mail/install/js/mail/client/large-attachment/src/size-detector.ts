type SizedFile = {
	getSize(): number,
};

import {
	type FormAdapterUnsubscribe,
	type FormAttachment,
	type LargeAttachmentFormAdapter,
} from './type/form-adapter';
import { MainMailFormAdapter } from './adapter/main-mail-form-adapter';

export type SizeDetectorParams = {
	formAdapter?: Pick<LargeAttachmentFormAdapter, 'getFiles' | 'subscribeFileChange'>,
	uploaderControlId?: string,
	maxSize: number,
	onChange: (isLarge: boolean, fileIds: number[]) => void,
};

export class SizeDetector
{
	#formAdapter: Pick<LargeAttachmentFormAdapter, 'getFiles' | 'subscribeFileChange'>;
	#maxSize: number;
	#onChange: (isLarge: boolean, fileIds: number[]) => void;
	#isLarge: boolean = false;
	#scheduledFileIds: Set<number> = new Set();
	#isStarted: boolean = false;
	#isDeferredCheckScheduled: boolean = false;
	#unsubscribeFileChange: FormAdapterUnsubscribe | null = null;

	constructor(params: SizeDetectorParams)
	{
		this.#formAdapter = params.formAdapter ?? new MainMailFormAdapter({
			formId: '',
			uploaderControlId: params.uploaderControlId ?? '',
		});
		this.#maxSize = params.maxSize;
		this.#onChange = params.onChange;
	}

	start(): void
	{
		this.#isStarted = true;
		this.#unsubscribeFileChange = this.#formAdapter.subscribeFileChange((type): void => {
			if (type === 'remove')
			{
				this.#check();

				return;
			}

			this.#handleItemAddOrComplete();
		});
		this.#check();
	}

	destroy(): void
	{
		this.#isStarted = false;
		this.#unsubscribeFileChange?.();
		this.#unsubscribeFileChange = null;
	}

	isLarge(): boolean
	{
		return this.#isLarge;
	}

	static sumRawSize(files: SizedFile[]): number
	{
		return files.reduce((total: number, file: SizedFile): number => total + file.getSize(), 0);
	}

	// Client mirror of the server threshold in Bitrix\Mail\...\AttachmentSizeGuard::exceedsMailLimit().
	// The base64 overhead coefficient must stay identical on both sides.
	static exceedsLimit(totalRawSize: number, maxSize: number): boolean
	{
		return maxSize > 0 && maxSize <= Math.ceil(totalRawSize / 3) * 4;
	}

	#handleItemAddOrComplete = (): void => {
		if (this.#isDeferredCheckScheduled)
		{
			return;
		}

		this.#isDeferredCheckScheduled = true;
		queueMicrotask((): void => {
			this.#isDeferredCheckScheduled = false;
			if (this.#isStarted)
			{
				this.#check();
			}
		});
	};

	#check(): void
	{
		const files = this.#readFiles();
		const totalRawSize = files.reduce(
			(total: number, file: FormAttachment): number => total + file.size,
			0,
		);
		const isLarge = SizeDetector.exceedsLimit(totalRawSize, this.#maxSize);
		const hasThresholdStateChanged = isLarge !== this.#isLarge;
		this.#isLarge = isLarge;

		if (isLarge)
		{
			const fileIds = this.#readUnscheduledFileIdsWhenReady(files);
			if (fileIds && fileIds.length > 0)
			{
				fileIds.forEach((fileId: number): void => {
					this.#scheduledFileIds.add(fileId);
				});
				this.#onChange(true, fileIds);

				return;
			}
		}

		if (!isLarge && hasThresholdStateChanged)
		{
			this.#onChange(false, []);
		}
	}

	#readFiles(): FormAttachment[]
	{
		return this.#formAdapter.getFiles();
	}

	#readUnscheduledFileIdsWhenReady(files: FormAttachment[]): number[] | null
	{
		const fileIds = new Set<number>();
		for (const file of files)
		{
			if (file.id === null)
			{
				return null;
			}

			if (!this.#scheduledFileIds.has(file.id))
			{
				fileIds.add(file.id);
			}
		}

		return [...fileIds];
	}
}
