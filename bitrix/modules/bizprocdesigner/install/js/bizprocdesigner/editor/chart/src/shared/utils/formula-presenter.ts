import { readAutomationSegment } from './expression-parser';

export const MAX_FORMULA_PRESENTATION_LENGTH = 2000;

const OPERATORS = new Map([
	['*', '×'],
	['/', '÷'],
	['+', '+'],
	['-', '-'],
	['^', '^'],
	['%', '%'],
	['&', '&'],
	['=', '='],
	['<', '<'],
	['>', '>'],
	['<=', '<='],
	['>=', '>='],
	['<>', '<>'],
]);

const WHITESPACE = /\s/u;

function isWhitespace(char)
{
	return WHITESPACE.test(char);
}

function isDigit(char)
{
	const code = char.charCodeAt(0);

	return code >= 48 && code <= 57;
}

function isAsciiLetter(char)
{
	const code = char.charCodeAt(0);

	return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

function isIdentifierStart(char)
{
	return char === '_' || isAsciiLetter(char);
}

function isIdentifierPart(char)
{
	return char === '_' || isAsciiLetter(char) || isDigit(char);
}

function isReferenceFieldPart(char)
{
	return char === '.' || isIdentifierPart(char);
}

function isFirstModifierPart(char)
{
	return char === ':' || isIdentifierPart(char);
}

function skipWhitespace(source, start)
{
	let at = start;
	while (at < source.length && isWhitespace(source.charAt(at)))
	{
		at++;
	}

	return at;
}

function readWhile(source, start, predicate)
{
	let at = start;
	while (at < source.length && predicate(source.charAt(at)))
	{
		at++;
	}

	return at;
}

function readReference(source, start)
{
	let at = start + 2;
	at = skipWhitespace(source, at);

	const objectStart = at;
	at = readWhile(source, at, isIdentifierPart);
	if (at === objectStart)
	{
		return null;
	}
	const object = source.slice(objectStart, at);

	at = skipWhitespace(source, at);
	if (source.charAt(at) !== ':')
	{
		return null;
	}

	at = skipWhitespace(source, at + 1);
	const fieldStart = at;
	at = readWhile(source, at, isReferenceFieldPart);
	if (at === fieldStart)
	{
		return null;
	}
	const field = source.slice(fieldStart, at);

	at = skipWhitespace(source, at);
	if (source.charAt(at) === '>')
	{
		at = skipWhitespace(source, at + 1);
		const modifierStart = at;
		at = readWhile(source, at, isFirstModifierPart);
		if (at === modifierStart)
		{
			return null;
		}

		at = skipWhitespace(source, at);
		if (source.charAt(at) === ',')
		{
			at = skipWhitespace(source, at + 1);
			const secondModifierStart = at;
			at = readWhile(source, at, isIdentifierPart);
			if (at === secondModifierStart)
			{
				return null;
			}
			at = skipWhitespace(source, at);
		}
	}

	if (source.charAt(at) !== '}')
	{
		return null;
	}

	const end = at + 1;

	return {
		reference: {
			raw: source.slice(start, end),
			object,
			field,
		},
		end,
	};
}

function readString(source, start)
{
	const quote = source.charAt(start);
	let at = start + 1;

	while (at < source.length)
	{
		const char = source.charAt(at);
		if (char === '\\')
		{
			if (at + 1 >= source.length)
			{
				return null;
			}
			at += 2;
			continue;
		}

		if (char === quote)
		{
			if (source.charAt(at + 1) === quote)
			{
				at += 2;
				continue;
			}

			return at + 1;
		}

		at++;
	}

	return null;
}

function readNumber(source, start)
{
	let at = readWhile(source, start, isDigit);
	if (source.charAt(at) === '.' && isDigit(source.charAt(at + 1)))
	{
		at = readWhile(source, at + 1, isDigit);
	}

	return at;
}

function readOperator(source, start)
{
	const pair = source.slice(start, start + 2);
	if (OPERATORS.has(pair))
	{
		return { raw: pair, label: OPERATORS.get(pair) ?? pair };
	}

	const single = source.charAt(start);
	if (OPERATORS.has(single))
	{
		return { raw: single, label: OPERATORS.get(single) ?? single };
	}

	return null;
}

function unwrapFormula(value)
{
	const trimmed = value.trim();
	if (trimmed.startsWith('{{=') && trimmed.endsWith('}}'))
	{
		return trimmed.slice(3, -2);
	}

	return trimmed.startsWith('=') ? trimmed.slice(1) : null;
}

function readReferenceOperand(source, at, options)
{
	const parsed = readReference(source, at);

	return parsed === null ? null : { presentation: options.resolveReference(parsed.reference), end: parsed.end };
}

// A caption naming no known value keeps the notation it is written in, exactly as it does outside a
// formula: the catalogs it is looked up in are incomplete, and an unknown caption is not a broken
// reference.
function readNamedOperand(source, at, options)
{
	const parsed = options.resolveName ? readAutomationSegment(source, at) : null;
	if (parsed === null)
	{
		return null;
	}

	const presentation = options.resolveName(parsed.segment);

	return { presentation, end: parsed.end };
}

export function presentFormula(value, options)
{
	const pendings = [];
	const fallback = {
		label: options.fallbackLabel,
		unresolved: null,
		pendings,
	};
	if (value.length > MAX_FORMULA_PRESENTATION_LENGTH)
	{
		return fallback;
	}

	const source = unwrapFormula(value);
	if (source === null)
	{
		return fallback;
	}

	const labelParts = [];
	const frames = [];
	let unresolved = null;
	let at = 0;
	let expectOperand = true;
	let spacePending = false;
	let lastOutputCharacter = '';

	const pushPart = (text) => {
		if (text === '')
		{
			return;
		}

		labelParts.push(text);
		lastOutputCharacter = text.charAt(text.length - 1);
	};
	const appendToken = (text) => {
		if (spacePending && labelParts.length > 0 && lastOutputCharacter !== '(')
		{
			pushPart(' ');
		}
		pushPart(text);
		spacePending = false;
	};
	const markFrame = () => {
		const frame = frames[frames.length - 1];
		if (frame)
		{
			frame.hasToken = true;
		}
	};

	while (at < source.length)
	{
		const char = source.charAt(at);
		if (isWhitespace(char))
		{
			spacePending = true;
			at++;
			continue;
		}

		if (char === '\'' || char === '"')
		{
			if (!expectOperand)
			{
				return fallback;
			}

			const end = readString(source, at);
			if (end === null)
			{
				return fallback;
			}

			appendToken(source.slice(at, end));
			markFrame();
			expectOperand = false;
			at = end;
			continue;
		}

		if (char === '{')
		{
			if (!expectOperand)
			{
				return fallback;
			}

			// A saved reference reaches the form converted to the `{{...}}` notation of the automation
			// designer ({@see \Bitrix\Bizproc\Automation\Helper::convertProperties}), inside a formula
			// as well - both forms name one value and are read here the same way.
			const operand = source.charAt(at + 1) === '='
				? readReferenceOperand(source, at, options)
				: readNamedOperand(source, at, options)
			;
			if (operand === null)
			{
				return fallback;
			}

			appendToken(operand.presentation.label);
			if (unresolved === null && operand.presentation.unresolved)
			{
				unresolved = operand.presentation.unresolved;
			}
			if (operand.presentation.pending)
			{
				pendings.push(operand.presentation.pending);
			}

			markFrame();
			expectOperand = false;
			at = operand.end;
			continue;
		}

		if (isDigit(char))
		{
			if (!expectOperand)
			{
				return fallback;
			}

			const end = readNumber(source, at);
			appendToken(source.slice(at, end).replace('.', options.decimalSeparator));
			markFrame();
			expectOperand = false;
			at = end;
			continue;
		}

		if (isIdentifierStart(char))
		{
			if (!expectOperand)
			{
				return fallback;
			}

			const end = readWhile(source, at, isIdentifierPart);
			const argumentsAt = skipWhitespace(source, end);
			if (source.charAt(argumentsAt) !== '(')
			{
				return fallback;
			}

			const functionLabel = options.resolveFunctionLabel(source.slice(at, end).toLowerCase());
			if (functionLabel === null || functionLabel === '')
			{
				return fallback;
			}

			markFrame();
			appendToken(functionLabel);
			spacePending = false;
			pushPart('(');
			frames.push({ kind: 'function', hasToken: false });
			expectOperand = true;
			at = argumentsAt + 1;
			continue;
		}

		if (char === '(')
		{
			if (!expectOperand)
			{
				return fallback;
			}

			markFrame();
			appendToken(char);
			frames.push({ kind: 'group', hasToken: false });
			expectOperand = true;
			at++;
			continue;
		}

		if (char === ')')
		{
			const frame = frames.pop();
			if (!frame || (expectOperand && (frame.kind === 'group' || frame.hasToken)))
			{
				return fallback;
			}

			spacePending = false;
			pushPart(char);
			expectOperand = false;
			at++;
			continue;
		}

		if (char === ',' || char === ';')
		{
			const frame = frames[frames.length - 1];
			if (expectOperand || frame?.kind !== 'function')
			{
				return fallback;
			}

			markFrame();
			spacePending = false;
			pushPart(char);
			spacePending = true;
			expectOperand = true;
			at++;
			continue;
		}

		const operator = readOperator(source, at);
		if (operator === null || (expectOperand && operator.raw !== '+' && operator.raw !== '-'))
		{
			return fallback;
		}

		appendToken(operator.label);
		markFrame();
		expectOperand = true;
		at += operator.raw.length;
	}

	if (expectOperand || frames.length > 0)
	{
		return fallback;
	}

	return {
		label: labelParts.join(''),
		unresolved,
		pendings,
	};
}
