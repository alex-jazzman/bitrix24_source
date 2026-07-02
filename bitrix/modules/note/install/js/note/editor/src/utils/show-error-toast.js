import 'ui.notification';

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
