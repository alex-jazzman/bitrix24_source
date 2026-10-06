import 'ui.notification';

// Duplicated from note.editor's utils/show-error-toast.js on purpose — see error-message.js.
export function showErrorToast(message: string): void
{
	const content = String(message || '').trim();
	if (!content)
	{
		return;
	}

	BX.UI.Notification.Center.notify({
		content,
		position: 'top-right',
		autoHideDelay: 4000,
	});
}
