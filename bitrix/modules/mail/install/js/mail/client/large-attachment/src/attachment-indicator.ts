import { Loc, Type } from 'main.core';

import { MainMailFormAdapter } from './adapter/main-mail-form-adapter';
import { type LargeAttachmentFormAdapter } from './type/form-adapter';

export class AttachmentIndicator
{
	#formAdapter: Pick<LargeAttachmentFormAdapter, 'syncIndicator'>;
	#markedFileIds: Set<number> = new Set();

	constructor(formAdapter: Pick<LargeAttachmentFormAdapter, 'syncIndicator'> | string | null = null)
	{
		this.#formAdapter = Type.isObject(formAdapter)
			? formAdapter as Pick<LargeAttachmentFormAdapter, 'syncIndicator'>
			: new MainMailFormAdapter({
				formId: formAdapter ?? '',
				uploaderControlId: '',
			})
		;
	}

	mark(fileIds: number[]): void
	{
		this.sync([...this.#markedFileIds, ...fileIds]);
	}

	sync(fileIds: number[]): void
	{
		this.#markedFileIds = new Set(
			fileIds.filter((id: number): boolean => Number.isInteger(id) && id > 0),
		);

		if (this.#markedFileIds.size === 0)
		{
			this.#formAdapter.syncIndicator([]);

			return;
		}

		this.#formAdapter.syncIndicator([...this.#markedFileIds]);
	}

	reset(): void
	{
		this.sync([]);
	}

	has(fileId: number): boolean
	{
		return this.#markedFileIds.has(fileId);
	}

	getFileIds(): number[]
	{
		return [...this.#markedFileIds];
	}

	getLabel(): string
	{
		return Loc.getMessage('MAIL_LARGE_ATTACHMENT_INDICATOR_LABEL') || '';
	}
}
