import { Tag } from 'main.core';

export function createNotificationContent(notificationContent: string): HTMLDivElement
{
	return Tag.render`
		<div
			data-testid="intranet-logout-all-confirm-success"
			role="status"
			aria-live="polite"
			aria-atomic="true"
		>
			${notificationContent}
		</div>
	`;
}
