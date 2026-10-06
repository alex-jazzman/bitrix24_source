import {Text} from 'main.core';

const PUBLISH_DELAY = 500;

export const MoneyInput = Object.freeze({
	PUBLISH_DELAY,

	sanitizeDecimalInput(value, selectionStart, selectionEnd)
	{
		const source = String(value ?? '');
		const start = Number.isInteger(selectionStart) ? selectionStart : source.length;
		const end = Number.isInteger(selectionEnd) ? selectionEnd : start;

		let result = '';
		let hasSeparator = false;
		let removedBeforeStart = 0;
		let removedBeforeEnd = 0;

		for (let index = 0; index < source.length; index++)
		{
			const char = source[index];
			const isDigit = /\d/.test(char);
			const isSeparator = char === '.' || char === ',';
			const keep = isDigit || (isSeparator && !hasSeparator);

			if (keep)
			{
				result += isSeparator ? '.' : char;
				hasSeparator = hasSeparator || isSeparator;

				continue;
			}

			if (index < start)
			{
				removedBeforeStart++;
			}

			if (index < end)
			{
				removedBeforeEnd++;
			}
		}

		return {
			value: result,
			selectionStart: Math.max(0, start - removedBeforeStart),
			selectionEnd: Math.max(0, end - removedBeforeEnd),
		};
	},

	getDecimalPublishValue(value, allowTrailingSeparator = false)
	{
		const stringValue = String(value ?? '');
		if (stringValue === '')
		{
			return null;
		}

		const normalizedValue = allowTrailingSeparator
			? stringValue.replace(/[.]$/, '')
			: stringValue
		;

		if (normalizedValue === '' || normalizedValue.endsWith('.'))
		{
			return null;
		}

		return Math.abs(Text.toNumber(normalizedValue));
	},

	hasTrailingDecimalSeparator(value)
	{
		return /[.,]$/.test(String(value ?? ''));
	},

	formatFocusedDecimal(value)
	{
		return String(Text.toNumber(value));
	},

	formatDecimal(value, precision)
	{
		return Text.toNumber(value).toFixed(Text.toInteger(precision) || 2);
	},

	selectAll(input)
	{
		input?.select?.();
	},

	moveCaretToEnd(input)
	{
		if (!input)
		{
			return;
		}

		const caretPosition = input.value.length;
		input.setSelectionRange?.(caretPosition, caretPosition);
	},

	applySelection(input, selectionStart, selectionEnd)
	{
		input?.setSelectionRange?.(selectionStart, selectionEnd);
	},
});
