import { Loc, Tag, Text } from 'main.core';
import { Dialog as SystemDialog } from 'ui.system.dialog';
import type { DialogOptions } from 'ui.system.dialog';
import {
	AirButtonStyle,
	Button,
	ButtonSize,
	CancelButton,
} from 'ui.buttons';
import type { ButtonOptions } from 'ui.buttons';

export type FileActionConfirmOptions = {
	fileName: string,
	onConfirm: () => void,
	onCancel?: () => void,
};

export type DeleteFileConfirmOptions = FileActionConfirmOptions;

type FileActionConfirmPhrases = {
	title: string,
	textTemplate: string,
	confirm: string,
	cancel: string,
};

function showFileActionConfirm(options: FileActionConfirmOptions, phrases: FileActionConfirmPhrases): void
{
	const message = Loc.getMessage(phrases.textTemplate, {
		'#FILE_NAME#': `<span class="biconnector-dataset-import-v2-popup__file-name">${Text.encode(options.fileName)}</span>`,
	}) ?? '';

	const content = Tag.render`<div class="biconnector-dataset-import-v2-popup__message"></div>`;
	content.innerHTML = message;

	const confirmButtonOptions: Partial<ButtonOptions> = {
		text: Loc.getMessage(phrases.confirm) ?? '',
		useAirDesign: true,
		size: ButtonSize.LARGE,
		style: AirButtonStyle.FILLED,
		onclick: (): {} => {
			dialog.hide();
			options.onConfirm();

			return {};
		},
	};
	const cancelButtonOptions: Partial<ButtonOptions> = {
		text: Loc.getMessage(phrases.cancel) ?? '',
		useAirDesign: true,
		size: ButtonSize.LARGE,
		style: AirButtonStyle.PLAIN,
		onclick: (): {} => {
			dialog.hide();
			options.onCancel?.();

			return {};
		},
	};
	const dialog = new SystemDialog({
		title: Loc.getMessage(phrases.title) ?? '',
		content,
		width: 470,
		hasCloseButton: true,
		closeByEsc: true,
		hasOverlay: true,
		centerButtons: [
			new Button(confirmButtonOptions as ButtonOptions),
			new CancelButton(cancelButtonOptions as ButtonOptions),
		],
	} as DialogOptions);

	dialog.show();
}

export function showDeleteFileConfirm(options: FileActionConfirmOptions): void
{
	showFileActionConfirm(options, {
		title: 'DATASET_IMPORT_V2_DELETE_FILE_TITLE',
		textTemplate: 'DATASET_IMPORT_V2_DELETE_FILE_TEXT_TEMPLATE',
		confirm: 'DATASET_IMPORT_V2_DELETE_FILE_CONFIRM',
		cancel: 'DATASET_IMPORT_V2_DELETE_FILE_CANCEL',
	});
}

export function showReplaceFileConfirm(options: FileActionConfirmOptions): void
{
	showFileActionConfirm(options, {
		title: 'DATASET_IMPORT_V2_REPLACE_FILE_TITLE',
		textTemplate: 'DATASET_IMPORT_V2_REPLACE_FILE_TEXT_TEMPLATE',
		confirm: 'DATASET_IMPORT_V2_REPLACE_FILE_CONFIRM',
		cancel: 'DATASET_IMPORT_V2_REPLACE_FILE_CANCEL',
	});
}
