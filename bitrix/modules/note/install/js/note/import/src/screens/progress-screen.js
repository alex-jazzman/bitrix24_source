import { Dom, Loc, Tag, Text } from 'main.core';
import { ProgressBar } from 'ui.progressbar';
import { importTermMessageCode, resolveProgressScreenStatus } from '../constants';
import type { ConvertedCollection, ImportProgress, ProgressScreenState } from '../type';

const STATUS_TO_MASCOT = {
	preparing: 'working',
	documents: 'working',
	attachments: 'working',
	done_ok: 'done',
	done_error: 'error',
	cancelled: 'error',
	error: 'error',
};

export type ProgressScreenHandle = {
	element: HTMLElement,
	applyState: (
		state: ProgressScreenState,
		sourceType: string,
		convertedCollections: ConvertedCollection[],
	) => void,
};

// The screen outlives the poll that feeds it: a tick brings new numbers for the run, not a new
// screen, so the handle moves the nodes it has already built. Building them again would restart
// the bar and drop whatever the user has in focus - every five seconds, for the whole import.
export function createProgressScreen(): ProgressScreenHandle
{
	const title = Tag.render`<div class="note-import-progress__title"></div>`;
	const barWrapper = Tag.render`<div class="note-import-progress__bar"></div>`;
	const mascot = Tag.render`<div class="note-import-progress__mascot"></div>`;
	let summary = Tag.render`<div class="note-import-progress__summary"></div>`;
	const element = Tag.render`
		<div class="note-import-screen note-import-screen-progress">
			${title}
			${barWrapper}
			<div class="note-import-progress__body">${summary}${mascot}</div>
		</div>
	`;

	let bar: ProgressBar | null = null;
	let counter: HTMLElement | null = null;
	let isIndeterminate = false;

	const removeBar = (): void => {
		bar?.destroy();
		bar = null;
		Dom.remove(counter);
		counter = null;
	};

	const applyCounter = (value: number, maxValue: number, indeterminate: boolean): void => {
		if (indeterminate)
		{
			Dom.remove(counter);
			counter = null;

			return;
		}

		if (counter === null)
		{
			counter = Tag.render`<div class="note-import-progress__counter"></div>`;
			barWrapper.append(counter);
		}

		counter.textContent = `${Math.round(value)} / ${Math.round(maxValue)}`;
	};

	const applyBar = (state: ProgressScreenState, status: string): void => {
		if (status === 'error')
		{
			// no bar for system-level error
			removeBar();

			return;
		}

		const { value, maxValue, indeterminate } = resolveBarValues(state.progress, status);
		// The looping animation is wired into the bar node when the bar is built, so only a phase
		// that switches that loop on or off gets a new bar. Within one phase the bar it already
		// has moves to the new value.
		if (bar === null || indeterminate !== isIndeterminate)
		{
			removeBar();
			bar = new ProgressBar({
				value,
				maxValue,
				size: ProgressBar.Size.LARGE,
				color: ProgressBar.Color.PRIMARY,
				statusType: ProgressBar.Status.NONE,
				infiniteLoading: indeterminate,
			});
			isIndeterminate = indeterminate;
			bar.renderTo(barWrapper);
		}
		else
		{
			bar.setMaxValue(maxValue);
			bar.update(value);
		}

		applyCounter(value, maxValue, indeterminate);
	};

	const applySummary = (
		state: ProgressScreenState,
		status: string,
		sourceType: string,
		convertedCollections: ConvertedCollection[],
	): void => {
		const next = renderSummary(state, status, sourceType, convertedCollections);
		if (next.innerHTML === summary.innerHTML)
		{
			return;
		}

		summary.replaceWith(next);
		summary = next;
	};

	return {
		element,
		applyState: (
			state: ProgressScreenState,
			sourceType: string = '',
			convertedCollections: ConvertedCollection[] = [],
		): void => {
			const status = resolveProgressScreenStatus(state);

			title.textContent = resolveTitleText(status, sourceType);
			setVariant(title, 'note-import-progress__title', resolveTitleVariant(status));
			applyBar(state, status);
			applySummary(state, status, sourceType, convertedCollections);
			setVariant(mascot, 'note-import-progress__mascot', STATUS_TO_MASCOT[status] ?? 'working');
		},
	};
}

export function renderProgressScreen(
	state: ProgressScreenState,
	sourceType: string = '',
	convertedCollections: ConvertedCollection[] = [],
): HTMLElement
{
	const screen = createProgressScreen();
	screen.applyState(state, sourceType, convertedCollections);

	return screen.element;
}

// What the run says to a screen reader: the phase or the outcome it is in, and, once it has
// finished or stopped, the numbers and the reason shown with it. The dialog announces this through
// the live region of ui.a11y, which lives outside everything the poll rebuilds.
export function resolveProgressAnnouncement(
	state: ProgressScreenState,
	sourceType: string = '',
	convertedCollections: ConvertedCollection[] = [],
): string
{
	const status = resolveProgressScreenStatus(state);
	const summary = renderSummary(state, status, sourceType, convertedCollections);
	// Line by line, not as one run of text: the lines of the summary are separate nodes with nothing
	// between them, and read together they run into each other ("Импортировано: 28Не удалось
	// импортировать: 0"). A part that already ends a sentence keeps its own ending.
	const lines = [...summary.children].map((line) => line.textContent ?? '');

	return [resolveTitleText(status, sourceType), ...lines]
		.map((part) => part.replaceAll(/\s+/g, ' ').trim())
		.filter((part) => part !== '')
		.reduce(
			(text, part) => (text === '' ? part : `${text}${/[.!?…]$/.test(text) ? ' ' : '. '}${part}`),
			'',
		);
}

function resolveTitleVariant(status: string): string
{
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
}

function setVariant(node: HTMLElement, blockClass: string, variant: string): void
{
	for (const name of [...node.classList])
	{
		if (name.startsWith(`${blockClass}--`))
		{
			Dom.removeClass(node, name);
		}
	}

	Dom.addClass(node, `${blockClass}--${variant}`);
}

function resolveTitleText(status: string, sourceType: string = ''): string
{
	return Loc.getMessage(importTermMessageCode(resolveTitleKey(status), sourceType));
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

function renderSummary(
	state: ProgressScreenState,
	status: string,
	sourceType: string = '',
	convertedCollections: ConvertedCollection[] = [],
): HTMLElement
{
	const container = Tag.render`<div class="note-import-progress__summary"></div>`;
	const progress = state.progress;

	if (status === 'error')
	{
		// A failed status request and a stop reported by the server are different things and must
		// not stand in for each other: the request failure keeps its own text, while the reason
		// the server gives (API-03) comes with the counters of the run that stopped. An empty
		// reason draws no block - the screen then reads exactly as it did before.
		const stopReason = state.errorMessage === '' ? String(progress?.errorMessage ?? '') : '';
		if (stopReason === '')
		{
			container.append(renderAlertLine(state.errorMessage || Loc.getMessage('NOTE_IMPORT_STATUS_ERROR')));

			return container;
		}

		container.append(renderAlertLine(stopReason, 'note-import-error-reason'));
		appendImportCounters(container, progress, true);

		return container;
	}

	if (status === 'cancelled')
	{
		if (convertedCollections.length === 0)
		{
			return container;
		}

		const keptNotice = Loc.getMessagePlural(
			'NOTE_IMPORT_CANCELLED_KEPT_NOTICE',
			convertedCollections.length,
		);
		container.append(Tag.render`
			<div class="note-import-progress__summary-line" data-testid="note-import-cancelled-kept">
				${Text.encode(keptNotice)}
			</div>
		`);
		for (const collection of convertedCollections)
		{
			container.append(Tag.render`
				<div
					class="note-import-progress__summary-line note-import-progress__summary-line--muted"
					data-testid="note-import-cancelled-kept-item"
				>
					${Text.encode(collection.name)}
				</div>
			`);
		}

		return container;
	}

	if (status === 'done_ok' || status === 'done_error')
	{
		appendImportCounters(container, progress, status === 'done_error');

		return container;
	}

	// active phases (preparing, documents, attachments) — show current collection caption
	const caption = resolveCollectionCaption(progress, sourceType);
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

function renderAlertLine(text: string, testId: string = ''): HTMLElement
{
	// A run that stopped is drawn only once the poll has already reported it, so the line appears
	// long after the screen was built - it has to speak for itself when it does.
	const line = Tag.render`
		<div class="note-import-progress__summary-line note-import-progress__summary-line--alert" role="alert">
			${Text.encode(text)}
		</div>
	`;
	if (testId !== '')
	{
		line.dataset.testid = testId;
	}

	return line;
}

function appendImportCounters(container: HTMLElement, progress: ImportProgress | null, isAlert: boolean): void
{
	const importedClass = isAlert ? 'note-import-progress__summary-line--alert' : '';
	const importedText = Loc.getMessage('NOTE_IMPORT_IMPORTED_COUNT')
		.replace('#COUNT#', String(progress?.done ?? 0));
	container.append(Tag.render`
		<div class="note-import-progress__summary-line ${importedClass}">${Text.encode(importedText)}</div>
	`);

	const errorCount = progress?.error ?? 0;
	const errorClass = isAlert
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
}

function resolveCollectionCaption(progress: ImportProgress | null, sourceType: string = ''): string
{
	if (!progress || !progress.collectionName)
	{
		return '';
	}

	const name = progress.collectionName;
	const count = progress.collectionCount ?? 0;
	if (count > 1)
	{
		return Loc.getMessage(importTermMessageCode('NOTE_IMPORT_COLLECTION_PROGRESS_LABEL', sourceType))
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
