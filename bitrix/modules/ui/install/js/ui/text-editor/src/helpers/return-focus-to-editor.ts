import { FocusMonitor } from 'ui.a11y';

import { type TextEditor } from '../text-editor';

/**
 * Puts the caret back into the editing area after a dialog closes.
 *
 * Only for keyboard users. The dialogs auto-hide on an outside click, and pulling focus back into
 * the editor then would steal it from whatever the user has just clicked.
 *
 * Focusing the editor rather than the toolbar button that opened the dialog is deliberate: the
 * button takes focus away from the editable, which drops the native selection and with it the
 * Lexical selection the plugins have just restored.
 */
export function returnFocusToEditor(editor: TextEditor): void
{
	if (FocusMonitor.Instance.getLastInputModality() !== 'keyboard')
	{
		return;
	}

	editor.focus();
}
