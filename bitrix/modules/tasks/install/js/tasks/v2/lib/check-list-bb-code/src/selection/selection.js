import { Type } from 'main.core';

import { type SelectionRange } from '../types';

export class CheckListSelection
{
	static normalizeSource(source: string): string
	{
		return Type.isString(source) ? source : '';
	}

	static normalizeSelection(source: string, selection: ?Object): SelectionRange
	{
		const start = Math.max(0, Math.min(selection?.start ?? 0, source.length));
		const end = Math.max(start, Math.min(selection?.end ?? start, source.length));

		return { start, end };
	}

	static getTextareaSelection(textarea: ?HTMLTextAreaElement): SelectionRange
	{
		const start = textarea?.selectionStart ?? 0;
		const end = textarea?.selectionEnd ?? start;

		return { start, end };
	}
}
