import { ajax, Loc } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';

export type CreateBoardParams = {
	newTab: ?Window,
	analyticsElement?: string,
	onSuccess?: () => void,
};

/**
 * Creates a board via the flipchart controller and opens it in a tab prepared by the caller.
 *
 * The tab MUST be opened synchronously by the caller (`window.open('', '_blank')`) inside the
 * click handler to bypass pop-up blockers - this function never opens it. On success the tab is
 * pointed at the new document; on failure the tab is closed and an error toast is shown.
 */
export function createBoard(params: CreateBoardParams): void
{
	const { newTab, analyticsElement, onSuccess } = params;

	const config = {};
	if (analyticsElement)
	{
		config.analytics = {
			event: 'create',
			tool: 'boards',
			category: 'boards',
			c_element: analyticsElement,
		};
	}

	ajax.runAction('disk.integration.flipchart.createDocument', config)
		.then((response) => {
			if (response.status === 'success' && response.data.file)
			{
				if (response.data.viewUrl)
				{
					if (newTab)
					{
						newTab.location.href = response.data.viewUrl;
					}
				}
				else
				{
					// Board was created but there is nowhere to navigate - don't leave an empty about:blank tab.
					newTab?.close();
				}

				onSuccess?.();

				return;
			}

			notifyFailure(newTab);
		})
		.catch(() => {
			notifyFailure(newTab);
		});
}

function notifyFailure(newTab: ?Window): void
{
	newTab?.close();
	const message = Loc.getMessage('DISK_BOARD_CREATE_ERROR');
	BX.UI.Notification.Center.notify({ content: message });
	LiveAnnouncer.announce(message, 'assertive');
}
