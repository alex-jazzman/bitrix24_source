import { Loc } from 'main.core';

export function showActionReport(data: Object, phrases: {success: string, applied: string, skipped?: string, failed: string}): void
{
	const applied = data.applied ?? [];
	const skipped = data.skipped ?? [];
	const failed = data.failed ?? [];

	if (skipped.length === 0 && failed.length === 0)
	{
		BX.UI.Notification.Center.notify({
			content: Loc.getMessage(phrases.success),
			position: 'top-right',
			autoHideDelay: 5000,
		});

		return;
	}

	const lines = [];

	if (applied.length > 0)
	{
		lines.push(Loc.getMessagePlural(phrases.applied, applied.length, { '#COUNT#': applied.length }));
	}

	if (skipped.length > 0 && phrases.skipped)
	{
		lines.push(Loc.getMessagePlural(phrases.skipped, skipped.length, { '#COUNT#': skipped.length }));
	}

	if (failed.length > 0)
	{
		lines.push(Loc.getMessagePlural(phrases.failed, failed.length, { '#COUNT#': failed.length }));
	}

	const container = document.createElement('span');
	container.dataset.testid = 'mail-mailbox-bulk-report';
	container.innerHTML = lines.join('<br>');

	BX.UI.Notification.Center.notify({
		content: container,
		position: 'top-right',
		autoHideDelay: 5000,
	});
}
