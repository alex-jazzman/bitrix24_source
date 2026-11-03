export type StageDescriptionFormat = 'b' | 'i' | 'u' | 's';

type SelectionUpdate = {
	value: string,
	start: number,
	end: number,
	changed: boolean,
};

export function getStageDescriptionFormatUpdate(
	value: string,
	start: number,
	end: number,
	tag: StageDescriptionFormat,
): SelectionUpdate
{
	const selectedText = value.slice(start, end);
	if (selectedText === '')
	{
		return { value, start, end, changed: false };
	}

	const leftTag = `[${tag}]`;
	const rightTag = `[/${tag}]`;
	const isWrapped = (
		selectedText.startsWith(leftTag)
		&& selectedText.endsWith(rightTag)
		&& selectedText.length >= leftTag.length + rightTag.length
	);
	const replacement = isWrapped
		? selectedText.slice(leftTag.length, selectedText.length - rightTag.length)
		: `${leftTag}${selectedText}${rightTag}`;

	return {
		value: `${value.slice(0, start)}${replacement}${value.slice(end)}`,
		start,
		end: start + replacement.length,
		changed: true,
	};
}

export function toggleStageDescriptionFormat(
	textarea: HTMLTextAreaElement,
	tag: StageDescriptionFormat,
): string
{
	return applySelectionUpdate(
		textarea,
		getStageDescriptionFormatUpdate(
			textarea.value,
			textarea.selectionStart,
			textarea.selectionEnd,
			tag,
		),
	);
}

export function wrapStageDescriptionLink(textarea: HTMLTextAreaElement, url: string): string
{
	const normalizedUrl = normalizeStageDescriptionUrl(url);
	const selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
	if (!normalizedUrl || selectedText === '')
	{
		return textarea.value;
	}

	const start = textarea.selectionStart;
	const replacement = `[url=${normalizedUrl}]${selectedText}[/url]`;

	return applySelectionUpdate(textarea, {
		value: `${textarea.value.slice(0, start)}${replacement}${textarea.value.slice(textarea.selectionEnd)}`,
		start,
		end: start + replacement.length,
		changed: true,
	});
}

export function normalizeStageDescriptionUrl(value: string): string | null
{
	const trimmedValue = value.trim();
	if (!/^https?:\/\//i.test(trimmedValue))
	{
		return null;
	}

	try
	{
		const url = new URL(trimmedValue);

		return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
	}
	catch
	{
		return null;
	}
}

function applySelectionUpdate(textarea: HTMLTextAreaElement, update: SelectionUpdate): string
{
	if (!update.changed)
	{
		return update.value;
	}

	const textArea = textarea;
	textArea.value = update.value;
	textArea.focus({ preventScroll: true });
	textArea.selectionStart = update.start;
	textArea.selectionEnd = update.end;
	textArea.dispatchEvent(new window.Event('input', { bubbles: true }));

	return update.value;
}
