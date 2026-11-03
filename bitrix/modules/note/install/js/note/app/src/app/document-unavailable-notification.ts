import { Loc } from 'main.core';
import 'ui.notification';

export function showDocumentUnavailableNotification()
{
	const content = Loc.getMessage('NOTE_SIDEBAR_ERROR_DOCUMENT_NOT_FOUND') || '';
	if (content !== '')
	{
		BX.UI.Notification.Center.notify({ content, position: 'top-right' });
	}
}
