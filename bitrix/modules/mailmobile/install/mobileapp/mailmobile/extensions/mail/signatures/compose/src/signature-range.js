/**
 * @module mail/signatures/compose/src/signature-range
 */
jn.define('mail/signatures/compose/src/signature-range', (require, exports, module) => {
	const SIGNATURE_SEPARATOR = '\n--\n';

	function transformSignatureRange(previousText, nextText, range)
	{
		if (!isValidRange(previousText, range))
		{
			return null;
		}

		let prefixLength = 0;
		const commonLength = Math.min(previousText.length, nextText.length);
		while (prefixLength < commonLength && previousText[prefixLength] === nextText[prefixLength])
		{
			prefixLength++;
		}

		let suffixLength = 0;
		while (
			suffixLength < previousText.length - prefixLength
			&& suffixLength < nextText.length - prefixLength
			&& previousText[previousText.length - 1 - suffixLength] === nextText[nextText.length - 1 - suffixLength]
		)
		{
			suffixLength++;
		}

		const previousEditEnd = previousText.length - suffixLength;
		const nextEditEnd = nextText.length - suffixLength;
		if (previousEditEnd <= range.start)
		{
			const delta = nextEditEnd - previousEditEnd;

			return { start: range.start + delta, end: range.end + delta };
		}

		if (prefixLength >= range.end)
		{
			return { ...range };
		}

		return null;
	}

	function replaceSignatureRange(text, range, replacement)
	{
		if (!isValidRange(text, range))
		{
			return { text, range: null, replaced: false };
		}

		const value = String(replacement ?? '');

		return {
			text: `${text.slice(0, range.start)}${value}${text.slice(range.end)}`,
			range: value === '' ? null : { start: range.start, end: range.start + value.length },
			replaced: true,
		};
	}

	function stripSignatureRange(text, range)
	{
		const value = String(text ?? '');
		const result = replaceSignatureRange(value, range, '');

		return result.replaced ? result.text : value;
	}

	function replaceOrAppendSignature(text, range, signatureText)
	{
		const value = String(text ?? '');
		const signature = String(signatureText ?? '');
		const replacement = signature.trim() === '' ? '' : `${SIGNATURE_SEPARATOR}${signature}`;
		const replaced = replaceSignatureRange(value, range, replacement);
		if (replaced.replaced || replacement === '')
		{
			return replaced;
		}

		return {
			text: `${value}${replacement}`,
			range: { start: value.length, end: value.length + replacement.length },
			replaced: false,
		};
	}

	function transformEditableSignatureRange(previousText, nextText, range)
	{
		if (!isValidRange(previousText, range))
		{
			return null;
		}

		let prefixLength = 0;
		const commonLength = Math.min(previousText.length, nextText.length);
		while (prefixLength < commonLength && previousText[prefixLength] === nextText[prefixLength])
		{
			prefixLength++;
		}

		let suffixLength = 0;
		while (
			suffixLength < previousText.length - prefixLength
			&& suffixLength < nextText.length - prefixLength
			&& previousText[previousText.length - 1 - suffixLength] === nextText[nextText.length - 1 - suffixLength]
		)
		{
			suffixLength++;
		}

		const previousEditEnd = previousText.length - suffixLength;
		const nextEditEnd = nextText.length - suffixLength;
		const delta = nextEditEnd - previousEditEnd;
		if (previousEditEnd <= range.start)
		{
			return { start: range.start + delta, end: range.end + delta };
		}

		if (prefixLength >= range.end && range.end < previousText.length)
		{
			return { ...range };
		}

		if (prefixLength >= range.start + SIGNATURE_SEPARATOR.length && previousEditEnd <= range.end)
		{
			return { start: range.start, end: range.end + delta };
		}

		return null;
	}

	function extractSignatureText(text, range)
	{
		if (!isValidRange(text, range))
		{
			return null;
		}

		const value = text.slice(range.start, range.end);

		return value.startsWith(SIGNATURE_SEPARATOR) ? value.slice(SIGNATURE_SEPARATOR.length) : null;
	}

	function findSignatureSuffixRange(text, signatureText)
	{
		const value = String(text ?? '');
		const signature = String(signatureText ?? '');
		if (signature.trim() === '')
		{
			return null;
		}

		const suffix = `${SIGNATURE_SEPARATOR}${signature}`;
		if (!value.endsWith(suffix))
		{
			return null;
		}

		return { start: value.length - suffix.length, end: value.length };
	}

	function isValidRange(text, range)
	{
		return typeof text === 'string'
			&& Number.isInteger(range?.start)
			&& Number.isInteger(range?.end)
			&& range.start >= 0
			&& range.end >= range.start
			&& range.end <= text.length
		;
	}

	module.exports = {
		extractSignatureText,
		findSignatureSuffixRange,
		replaceOrAppendSignature,
		replaceSignatureRange,
		stripSignatureRange,
		transformEditableSignatureRange,
		transformSignatureRange,
	};
});
