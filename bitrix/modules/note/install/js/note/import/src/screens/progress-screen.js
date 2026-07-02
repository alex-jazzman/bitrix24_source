import { Loc, Tag, Text } from 'main.core';
import { ProgressBar } from 'ui.progressbar';
import { resolveProgressScreenStatus } from '../constants';
import type { ImportProgress, ProgressScreenState } from '../type';

const STATUS_TO_MASCOT = {
	preparing: 'working',
	documents: 'working',
	attachments: 'working',
	done_ok: 'done',
	done_error: 'error',
	cancelled: 'error',
	error: 'error',
};

export function renderProgressScreen(state: ProgressScreenState): HTMLElement
{
	const status = resolveProgressScreenStatus(state);
	const container = Tag.render`<div class="note-import-screen note-import-screen-progress"></div>`;

	container.append(renderTitle(status));
	container.append(renderBar(state, status));

	const body = Tag.render`<div class="note-import-progress__body"></div>`;
	body.append(renderSummary(state, status));
	body.append(renderMascot(status));
	container.append(body);

	return container;
}

function renderTitle(status: string): HTMLElement
{
	const variant = (() => {
		switch (status)
		{
			case 'done_ok':
				return 'success';
			case 'done_error':
			case 'cancelled':
			case 'error':
				return 'alert';
			default:
				return 'muted';
		}
	})();

	const text = Loc.getMessage(resolveTitleKey(status));

	return Tag.render`
		<div class="note-import-progress__title note-import-progress__title--${variant}">
			${Text.encode(text)}
		</div>
	`;
}

function resolveTitleKey(status: string): string
{
	switch (status)
	{
		case 'documents':
			return 'NOTE_IMPORT_PROGRESS_TITLE_DOCUMENTS';
		case 'attachments':
			return 'NOTE_IMPORT_PROGRESS_TITLE_ATTACHMENTS';
		case 'done_ok':
			return 'NOTE_IMPORT_PROGRESS_TITLE_DONE_OK';
		case 'done_error':
			return 'NOTE_IMPORT_PROGRESS_TITLE_DONE_ERROR';
		case 'cancelled':
			return 'NOTE_IMPORT_PROGRESS_TITLE_CANCELLED';
		case 'error':
			return 'NOTE_IMPORT_PROGRESS_TITLE_ERROR';
		case 'preparing':
		default:
			return 'NOTE_IMPORT_PROGRESS_TITLE_PREPARING';
	}
}

function renderBar(state: ProgressScreenState, status: string): HTMLElement
{
	const wrapper = Tag.render`<div class="note-import-progress__bar"></div>`;

	if (status === 'error')
	{
		// no bar for system-level error
		return wrapper;
	}

	const progress = state.progress;
	const { value, maxValue, indeterminate } = resolveBarValues(progress, status);
	const bar = new ProgressBar({
		value,
		maxValue,
		size: ProgressBar.Size.LARGE,
		color: ProgressBar.Color.PRIMARY,
		statusType: ProgressBar.Status.NONE,
		infiniteLoading: indeterminate,
	});
	bar.renderTo(wrapper);

	if (!indeterminate)
	{
		wrapper.append(Tag.render`
			<div class="note-import-progress__counter">${Math.round(value)} / ${Math.round(maxValue)}</div>
		`);
	}

	return wrapper;
}

function resolveBarValues(
	progress: ImportProgress | null,
	status: string,
): { value: number, maxValue: number, indeterminate: boolean }
{
	if (status === 'preparing' || !progress)
	{
		return { value: 0, maxValue: 100, indeterminate: true };
	}

	if (status === 'attachments')
	{
		const total = Math.max(0, progress.totalAttachments ?? 0);
		const done = Math.max(0, progress.doneAttachments ?? 0);

		if (total <= 0)
		{
			return { value: 0, maxValue: 100, indeterminate: true };
		}

		return { value: Math.min(done, total), maxValue: total, indeterminate: false };
	}

	if (status === 'documents')
	{
		const total = Math.max(0, progress.total ?? 0);
		const done = Math.max(0, progress.done ?? 0);

		if (total <= 0)
		{
			return { value: 0, maxValue: 100, indeterminate: true };
		}

		return { value: Math.min(done, total), maxValue: total, indeterminate: false };
	}

	// done_ok / done_error / cancelled — backend reports global counts on finish,
	// but `progress.total` stays at the last collection's totalItems (not a global sum).
	// Reconstruct a sensible denominator from done + error.
	const done = Math.max(0, progress.done ?? 0);
	const error = Math.max(0, progress.error ?? 0);
	const total = done + error;
	if (total <= 0)
	{
		return { value: 1, maxValue: 1, indeterminate: false };
	}

	return { value: Math.min(done, total), maxValue: total, indeterminate: false };
}

function renderSummary(state: ProgressScreenState, status: string): HTMLElement
{
	const container = Tag.render`<div class="note-import-progress__summary"></div>`;
	const progress = state.progress;

	if (status === 'error')
	{
		const text = state.errorMessage || Loc.getMessage('NOTE_IMPORT_STATUS_ERROR');
		container.append(Tag.render`
			<div class="note-import-progress__summary-line note-import-progress__summary-line--alert">
				${Text.encode(text)}
			</div>
		`);

		return container;
	}

	if (status === 'cancelled')
	{
		return container;
	}

	if (status === 'done_ok' || status === 'done_error')
	{
		const importedClass = status === 'done_error' ? 'note-import-progress__summary-line--alert' : '';
		const importedText = Loc.getMessage('NOTE_IMPORT_IMPORTED_COUNT')
			.replace('#COUNT#', String(progress?.done ?? 0));
		container.append(Tag.render`
			<div class="note-import-progress__summary-line ${importedClass}">${Text.encode(importedText)}</div>
		`);

		const errorCount = progress?.error ?? 0;
		const errorClass = status === 'done_error'
			? 'note-import-progress__summary-line--alert'
			: 'note-import-progress__summary-line--muted';
		const errorText = Loc.getMessage('NOTE_IMPORT_ERROR_COUNT').replace('#COUNT#', String(errorCount));
		container.append(Tag.render`
			<div class="note-import-progress__summary-line ${errorClass}">${Text.encode(errorText)}</div>
		`);

		const details = progress?.errorDetails ?? [];
		if (details.length > 0)
		{
			container.append(renderErrorDetails(details, errorCount));
		}

		return container;
	}

	// active phases (preparing, documents, attachments) — show current collection caption
	const caption = resolveCollectionCaption(progress);
	if (caption !== '')
	{
		container.append(Tag.render`
			<div class="note-import-progress__summary-line note-import-progress__summary-line--muted">
				${Text.encode(caption)}
			</div>
		`);
	}

	return container;
}

function resolveCollectionCaption(progress: ImportProgress | null): string
{
	if (!progress || !progress.collectionName)
	{
		return '';
	}

	const name = progress.collectionName;
	const count = progress.collectionCount ?? 0;
	if (count > 1)
	{
		return Loc.getMessage('NOTE_IMPORT_COLLECTION_PROGRESS_LABEL')
			.replace('#NAME#', name)
			.replace('#INDEX#', String((progress.collectionIndex ?? 0) + 1))
			.replace('#COUNT#', String(count));
	}

	return name;
}

function renderErrorDetails(details: Array<{ title: string, reason: string }>, totalErrors: number): HTMLElement
{
	const container = Tag.render`<div class="note-import-progress__errors"></div>`;
	for (const detail of details)
	{
		const title = Text.encode(detail.title);
		const reason = Text.encode(detail.reason);
		container.append(Tag.render`
			<div class="note-import-progress__errors-item">
				<span class="note-import-progress__errors-title">${title}</span>
				<span class="note-import-progress__errors-reason">${reason}</span>
			</div>
		`);
	}

	if (totalErrors > details.length)
	{
		const more = Loc.getMessage('NOTE_IMPORT_ERROR_DETAILS_MORE')
			.replace('#COUNT#', String(totalErrors - details.length));
		container.append(Tag.render`
			<div class="note-import-progress__errors-more">${Text.encode(more)}</div>
		`);
	}

	return container;
}

function renderMascot(status: string): HTMLElement
{
	const variant = STATUS_TO_MASCOT[status] ?? 'working';

	return Tag.render`
		<div class="note-import-progress__mascot note-import-progress__mascot--${variant}"></div>
	`;
}
