import { Loc } from 'main.core';

import { showConfirmDialog } from '../../helpers/show-confirm-dialog';

export function showExitDialog(onConfirm: Function, onClose: ?Function): void
{
	showConfirmDialog(
		{
			title: Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_EXIT_DIALOG_TITLE'),
			description: Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_EXIT_DIALOG_DESCRIPTION'),
			confirmCaption: Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_EXIT_DIALOG_CONFIRM'),
			cancelCaption: Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_EXIT_DIALOG_CANCEL'),
		},
		onConfirm,
		onClose,
	);
}
