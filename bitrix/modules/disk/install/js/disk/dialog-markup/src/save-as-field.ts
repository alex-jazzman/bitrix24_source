import { Dom, Loc, Tag } from 'main.core';

import './save-as-field.css';

export type SaveAsField = {
	nameWithoutExtension: string,
	extension: string,
};

// The window reads the value back by this identifier, so it is part of the contract of the block.
export const SAVE_AS_FIELD_ID = 'wd-new-create-filename';
const EXTENSION_ID = 'wd-new-create-filename-extension';

export function renderSaveAsField(params: SaveAsField): HTMLElement
{
	const label = Loc.getMessage('DISK_JS_DIALOG_MARKUP_SAVE_AS_NAME_LABEL') ?? '';

	// The extension stays out of the name of the field: the name says what is typed here, and the
	// extension is the one part of the file name that is not. It is bound as a description instead,
	// so it is still read out with the field and still stands beside it.
	const node: HTMLElement = Tag.render`
		<div
			class="bx-disk-document-edit-confirm-text-wrap bx-disk-document-edit-confirm-center"
			data-testid="disk-save-as-name-field"
		>
			<label class="bx-disk-document-edit-name-label" for="${SAVE_AS_FIELD_ID}">${label}</label>
			<input
				id="${SAVE_AS_FIELD_ID}"
				class="bx-disk-document-edit-name-input"
				type="text"
				data-testid="disk-save-as-name-input"
				data-autofocus
			>
			<span class="bx-disk-document-edit-confirm-extension" id="${EXTENSION_ID}"></span>
		</div>
	`;

	const field = node.querySelector(`#${SAVE_AS_FIELD_ID}`) as HTMLInputElement;
	const extension = node.querySelector(`#${EXTENSION_ID}`) as HTMLElement;

	// Both values come from the storage and are put in as text and as a value: they never reach the
	// markup as markup, the way they would through a substitution of the template above.
	field.value = params.nameWithoutExtension ?? '';
	extension.textContent = params.extension ?? '';

	if (extension.textContent !== '')
	{
		Dom.attr(field, 'aria-describedby', EXTENSION_ID);
	}

	return node;
}
