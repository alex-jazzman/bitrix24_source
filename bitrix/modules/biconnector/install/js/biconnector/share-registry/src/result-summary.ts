import { Loc, Text } from 'main.core';
import { Center as NotificationCenter, type ActionOptions } from 'ui.notification';

export type DisableFailure = {
	id: number,
	message: string,
};

export type DisableSharesResponse = {
	disabledIds: number[],
	failed: DisableFailure[],
};

export type DisableSummaryOptions = {
	getDashboardTitle: (shareId: number) => string | null,
	onRetry: (shareIds: number[]) => void,
};

export function showDisableSummary(
	result: DisableSharesResponse,
	total: number,
	options: DisableSummaryOptions,
): void
{
	const failed = result.failed ?? [];
	if (total === 1 && failed.length === 0)
	{
		return;
	}

	NotificationCenter.notify({
		content: total === 1 ? Text.encode(failed[0].message) : buildSummaryHtml(failed, total, options),
		actions: failed.length > 0 ? [buildRetryAction(failed, options)] : [],
	});
}

function buildSummaryHtml(failed: DisableFailure[], total: number, options: DisableSummaryOptions): string
{
	// The server skips links that are already off without reporting them, so they count as done.
	const lines = [
		phrase('BICONNECTOR_SHARE_REGISTRY_DISABLE_SUMMARY', {
			'#DONE#': String(total - failed.length),
			'#TOTAL#': String(total),
		}),
	];

	if (failed.length > 0)
	{
		lines.push(
			phrase('BICONNECTOR_SHARE_REGISTRY_DISABLE_SUMMARY_FAILED'),
			...failed.map((failure) => formatFailure(failure, options.getDashboardTitle(failure.id))),
		);
	}

	return lines.join('<br>');
}

function formatFailure(failure: DisableFailure, dashboardTitle: string | null): string
{
	const message = Text.encode(failure.message);

	return dashboardTitle ? `«${Text.encode(dashboardTitle)}»: ${message}` : message;
}

function buildRetryAction(failed: DisableFailure[], options: DisableSummaryOptions): ActionOptions
{
	return {
		title: phrase('BICONNECTOR_SHARE_REGISTRY_RETRY'),
		events: {
			click: (event, balloon) => {
				balloon?.close();
				options.onRetry(failed.map((failure) => failure.id));
			},
		},
	};
}

export function phrase(code: string, replacements?: Record<string, string>): string
{
	return Loc.getMessage(code, replacements) ?? '';
}
