import { Dom } from 'main.core';

type InputRef = { $el?: HTMLElement } | undefined;

export function adjustTextareaHeight(input: InputRef, maxHeight: number): void
{
	const textarea = input?.$el?.querySelector('textarea');
	if (!textarea)
	{
		return;
	}

	Dom.style(textarea, 'height', 'auto');
	const next = Math.min(textarea.scrollHeight, maxHeight);
	Dom.style(textarea, 'height', `${next}px`);
	Dom.style(textarea, 'overflowY', textarea.scrollHeight > maxHeight ? 'auto' : 'hidden');
}
