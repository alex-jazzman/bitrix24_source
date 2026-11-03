import { ajax } from 'main.core';
import { Center as NotificationCenter } from 'ui.notification';
import { resolveErrorHtml } from 'biconnector.error-message';

import { BanConfirmation, type ShareSummary } from './ban-confirmation';
import { phrase } from './phrase';

import './style.css';

type BanState = {
	isBanned: boolean,
	disabledCount: number,
};

type ActionResponse<T> = {
	data: T,
};

export class ShareBanDialog
{
	/**
	 * Resolves with the actual ban state after the request, or with null when the user
	 * declines the confirmation or closes an error without retrying.
	 */
	static async ban(dashboardId: number): Promise<boolean | null>
	{
		// The confirmation opens at once and waits for the summary, since the request takes a noticeable time.
		let confirmation = new BanConfirmation();
		confirmation.show();

		const summary = await runWithRetry<ShareSummary>(
			'getDashboardShareSummary',
			dashboardId,
			phrase('BICONNECTOR_SHARE_BAN_DIALOG_ERROR_SUMMARY'),
			() => confirmation.close(),
		);

		if (summary === null || confirmation.isCancelled())
		{
			return null;
		}

		if (summary.isBanned)
		{
			confirmation.close();

			return true;
		}

		if (confirmation.isClosed())
		{
			confirmation = new BanConfirmation();
			confirmation.show();
		}

		confirmation.setSummary(summary);
		if (!await confirmation.getResult())
		{
			return null;
		}

		const result = await runWithRetry<BanState>(
			'banDashboard',
			dashboardId,
			phrase('BICONNECTOR_SHARE_BAN_DIALOG_ERROR_BAN'),
		);

		return result?.isBanned ?? null;
	}

	static async unban(dashboardId: number): Promise<boolean | null>
	{
		const result = await runWithRetry<BanState>(
			'unbanDashboard',
			dashboardId,
			phrase('BICONNECTOR_SHARE_BAN_DIALOG_ERROR_UNBAN'),
		);

		return result?.isBanned ?? null;
	}
}

// Resolves with the action data, or with null once the user closes the error without retrying.
function runWithRetry<T>(
	action: string,
	dashboardId: number,
	fallbackPhrase: string,
	onError: () => void = () => {},
): Promise<T | null>
{
	return ajax.runAction(`biconnector.sharecontrol.${action}`, { data: { dashboardId } })
		.then((response: ActionResponse<T>) => response.data)
		.catch((response: unknown) => new Promise((resolve) => {
			let isRetrying = false;
			onError();

			NotificationCenter.notify({
				content: resolveErrorHtml(response, fallbackPhrase),
				actions: [{
					title: phrase('BICONNECTOR_SHARE_BAN_DIALOG_RETRY'),
					events: {
						click: (event, balloon) => {
							isRetrying = true;
							balloon?.close();
							resolve(runWithRetry<T>(action, dashboardId, fallbackPhrase, onError));
						},
					},
				}],
				events: {
					onClose: () => {
						if (!isRetrying)
						{
							resolve(null);
						}
					},
				},
			});
		}));
}
