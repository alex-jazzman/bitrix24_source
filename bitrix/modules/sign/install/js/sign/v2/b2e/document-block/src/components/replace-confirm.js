import { Dom, Event, Loc, Tag } from 'main.core';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';

import { getAllowedReplaceExtensions } from '../allowed-extensions';

export type ReplaceConfirmConfig = {
	documentId: string | number,
	isPlaceholderDocument: boolean,
};

export type ReplaceConfirmResult = File[] | { error: 'invalid-extension' } | null;

export class ReplaceConfirm
{
	#documentId: string | number;
	#isPlaceholderDocument: boolean;
	#fileInput: HTMLInputElement | null = null;
	#resolve: Function | null = null;
	#boundHandleFileChange: Function;
	#boundHandleWindowFocus: Function;

	constructor(config: ReplaceConfirmConfig)
	{
		this.#documentId = config.documentId;
		this.#isPlaceholderDocument = config.isPlaceholderDocument;
		this.#boundHandleFileChange = this.#handleFileChange.bind(this);
		this.#boundHandleWindowFocus = this.#handleWindowFocus.bind(this);
	}

	open(): Promise<ReplaceConfirmResult>
	{
		return new Promise((resolve) => {
			this.#resolve = resolve;
			this.#openFileDialog();
		});
	}

	#openFileDialog(): void
	{
		const accept = getAllowedReplaceExtensions(this.#isPlaceholderDocument)
			.map((extension) => `.${extension}`)
			.join(',')
		;
		this.#fileInput = Tag.render`
			<input type="file" accept="${accept}" style="display: none;" />
		`;

		Event.bind(this.#fileInput, 'change', this.#boundHandleFileChange);
		Event.bind(window, 'focus', this.#boundHandleWindowFocus);
		Dom.append(this.#fileInput, document.body);
		this.#fileInput.click();
	}

	#removeFileInput(): void
	{
		Dom.remove(this.#fileInput);
		Event.unbind(window, 'focus', this.#boundHandleWindowFocus);
	}

	#handleWindowFocus(): void
	{
		setTimeout(() => {
			if (this.#fileInput.files.length === 0)
			{
				this.#removeFileInput();
				this.#resolve(null);
			}
		}, 300);
	}

	#handleFileChange(event: Event): void
	{
		this.#removeFileInput();
		const files = event.target.files;

		if (files?.length > 0)
		{
			const fileList = [...files];

			if (!this.#areAllFilesAllowed(fileList))
			{
				this.#resolve({ error: 'invalid-extension' });

				return;
			}

			this.#showConfirm(fileList, this.#resolve);

			return;
		}

		this.#resolve(null);
	}

	#areAllFilesAllowed(files: File[]): boolean
	{
		const allowedExtensions = getAllowedReplaceExtensions(this.#isPlaceholderDocument);

		return files.every((file) => {
			const name = file.name || '';
			const dotIndex = name.lastIndexOf('.');
			const extension = dotIndex >= 0 ? name.slice(dotIndex + 1).toLowerCase() : '';

			return allowedExtensions.includes(extension);
		});
	}

	#showConfirm(selectedFiles: File[], resolve: Function): void
	{
		const confirmMessageId = this.#isPlaceholderDocument
			? 'SIGN_DOCUMENT_BLOCK_REPLACE_CONFIRM_TEXT'
			: 'SIGN_DOCUMENT_BLOCK_REPLACE_MIXED_DOCUMENT_CONFIRM_TEXT'
		;

		MessageBox.show({
			message: Loc.getMessage(confirmMessageId),
			title: Loc.getMessage('SIGN_DOCUMENT_BLOCK_REPLACE_CONFIRM_TITLE'),
			okCaption: Loc.getMessage('SIGN_DOCUMENT_BLOCK_REPLACE_CONFIRM_OK'),
			buttons: MessageBoxButtons.OK_CANCEL,
			useAirDesign: true,
			onOk: (messageBox: MessageBox) => {
				messageBox.close();
				resolve(selectedFiles);
			},
			onCancel: (messageBox: MessageBox) => {
				messageBox.close();
				resolve(null);
			},
			popupOptions: {
				id: `sign-b2e-document-replace-confirm-${this.#documentId}`,
			},
		});
	}
}
