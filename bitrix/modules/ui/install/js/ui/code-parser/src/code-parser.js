import { mergeTokens } from './merge-tokens';
import { CommentTokenTypes, StringTokenTypes, TokenType, type CodeToken } from './token-types';

const WORD_REGEX = /[\p{L}\p{N}0-9_$]/u;
const NON_WHITESPACE_REGEX = /\S/;

const ASCII_LIMIT = 128;

const CharCode = {
	DOUBLE_QUOTE: 34,
	HASH: 35,
	SINGLE_QUOTE: 39,
	PARENTHESIS_OPEN: 40,
	PARENTHESIS_CLOSE: 41,
	SLASH: 47,
	DIGIT_ZERO: 48,
	DIGIT_NINE: 57,
	SEMICOLON: 59,
	ANGLE_OPEN: 60,
	BRACKET_OPEN: 91,
	BRACKET_CLOSE: 93,
	BACKTICK: 96,
	BRACE_OPEN: 123,
	BRACE_CLOSE: 125,
};

// Every character of the text is classified twice: once to choose the type of a token, once to
// tell where it ends. Regular expressions are what makes that costly, so the ASCII range -- all
// of the code in practice -- answers both questions from a table instead, and only a character
// above it falls back to the expression. The tables are built from the same expressions they
// stand in for, so the answers cannot drift apart.
const buildAsciiTable = (matches: (char: string) => boolean): Uint8Array => {
	const table = new Uint8Array(ASCII_LIMIT);
	for (let code = 0; code < ASCII_LIMIT; code++)
	{
		table[code] = matches(String.fromCodePoint(code)) ? 1 : 0;
	}

	return table;
};

const asciiWordChars = buildAsciiTable((char: string): boolean => WORD_REGEX.test(char));
const asciiNonWhitespaceChars = buildAsciiTable((char: string): boolean => NON_WHITESPACE_REGEX.test(char));
const asciiOperatorChars = buildAsciiTable((char: string): boolean => /[!&*+,./:;<=>?@\\|~-]/.test(char));

const isWordChar = (char: string, charCode: number): boolean => {
	return charCode < ASCII_LIMIT ? asciiWordChars[charCode] === 1 : WORD_REGEX.test(char);
};

const isNonWhitespaceChar = (char: string, charCode: number): boolean => {
	return charCode < ASCII_LIMIT ? asciiNonWhitespaceChars[charCode] === 1 : NON_WHITESPACE_REGEX.test(char);
};

// the expression it stands in for holds ASCII characters only, so anything above the range is not
// an operator and needs no fallback
const isOperatorChar = (charCode: number): boolean => {
	return charCode < ASCII_LIMIT && asciiOperatorChars[charCode] === 1;
};

const isDigitChar = (charCode: number): boolean => {
	return charCode >= CharCode.DIGIT_ZERO && charCode <= CharCode.DIGIT_NINE;
};

const keywords: Set<string> = new Set([
	'abstract', 'alias', 'and', 'arguments', 'array', 'asm', 'assert', 'auto',
	'base', 'begin', 'bool', 'boolean', 'break', 'byte', 'case', 'catch',
	'char', 'checked', 'class', 'clone', 'compl', 'const', 'continue',
	'debugger', 'decimal', 'declare', 'def', 'default', 'defer', 'deinit', 'del', 'delegate',
	'delete', 'do', 'double', 'echo', 'elif', 'else', 'elseif', 'elsif', 'end',
	'ensure', 'enum', 'event', 'except', 'exec', 'explicit', 'export',
	'extends', 'extension', 'extern', 'fallthrough', 'false', 'final',
	'finally', 'fixed', 'float', 'for', 'foreach', 'friend', 'from', 'func',
	'function', 'global', 'goto', 'guard', 'if', 'implements', 'implicit',
	'import', 'include', 'include_once', 'init', 'inline', 'inout',
	'instanceof', 'int', 'interface', 'internal', 'is', 'lambda', 'let',
	'lock', 'long', 'module', 'mutable', 'namespace', 'NaN', 'native', 'new',
	'next', 'nil', 'none', 'not', 'null', 'object', 'operator', 'or', 'out',
	'override', 'package', 'params', 'pass', 'private', 'protected', 'protocol',
	'public', 'raise', 'readonly', 'redo', 'ref', 'register', 'repeat',
	'require', 'require_once', 'rescue', 'restrict', 'retry', 'return',
	'sbyte', 'sealed', 'self', 'short', 'signed', 'sizeof', 'static',
	'string', 'struct', 'subscript', 'super', 'switch', 'synchronized',
	'template', 'then', 'this', 'throw', 'throws', 'transient', 'true', 'try',
	'typealias', 'typedef', 'typeid', 'typename', 'typeof', 'unchecked',
	'undef', 'undefined', 'union', 'unless', 'unsigned', 'until', 'use',
	'using', 'var', 'virtual', 'void', 'volatile', 'wchar_t', 'when', 'where',
	'while', 'with', 'xor', 'yield',
]);

export class CodeParser
{
	// eslint-disable-next-line max-lines-per-function
	parse(text, merge = true): CodeToken[]
	{
		let currentPosition = 0;
		let nextChar = text[0];
		let currentChar = 1;
		let currentCharCode = 0;
		let prevChar = null;
		let beforePrevChar = null;
		let tokenContent = '';
		let tokenType: string = null;
		let lastTokenType = null;
		let isMultiChar = null;
		const result = [];

		const shouldFinalizeToken = (): boolean => {
			if (!currentChar)
			{
				// end of content
				return true;
			}

			switch (tokenType)
			{
				// case TokenType.LINE_BREAK:
				// 	if (prevChar === '\r' && currentChar === '\n')
				// 	{
				// 		return false;
				// 	}
				//
				// 	return true;
				// case TokenType.TAB:
				// 	return true;
				case TokenType.WHITESPACE:
					return isNonWhitespaceChar(currentChar, currentCharCode);
				case TokenType.OPERATOR:
				case TokenType.SEMICOLON:
				case TokenType.BRACKET:
				case TokenType.BRACE:
				case TokenType.PARENTHESES:
					return true;
				case TokenType.WORD:
					return !isWordChar(currentChar, currentCharCode);
				case TokenType.REGEX:
					return (prevChar === '/' || prevChar === '\n') && isMultiChar;
				case TokenType.STRING_DOUBLE:
					return prevChar === '"' && isMultiChar;
				case TokenType.STRING_SINGLE:
					return prevChar === '\'' && isMultiChar;
				case TokenType.STRING_TEMPLATE:
					return prevChar === '`' && isMultiChar;
				case TokenType.XML_COMMENT:
					return text[currentPosition - 4] + beforePrevChar + prevChar === '-->';
				case TokenType.COMMENT_MULTILINE:
					return beforePrevChar + prevChar === '*/';
				case TokenType.COMMENT_SLASH:
				case TokenType.COMMENT_HASH:
					return currentChar === '\n';
				default:
					return false;
			}
		};

		const getSlashTokenType = (): string => {
			if (nextChar === '/')
			{
				return TokenType.COMMENT_SLASH;
			}

			if (nextChar === '*')
			{
				return TokenType.COMMENT_MULTILINE;
			}

			const afterTokenRegexCanStart = (
				lastTokenType === TokenType.WHITESPACE
				|| lastTokenType === TokenType.OPERATOR
			);

			return afterTokenRegexCanStart && prevChar !== '<' ? TokenType.REGEX : TokenType.OPERATOR;
		};

		// The chain of tests this replaced ran over every character of the block; the switch answers
		// most of them by the code of the character alone, and only a slash, an angle bracket and a
		// word need more than that.
		const getTokenType = (): string => {
			switch (currentCharCode)
			{
				case CharCode.HASH:
					return TokenType.COMMENT_HASH;
				case CharCode.SLASH:
					return getSlashTokenType();
				case CharCode.ANGLE_OPEN:
					return nextChar === '!' && text[currentPosition + 1] === '-' && text[currentPosition + 2] === '-'
						? TokenType.XML_COMMENT
						: TokenType.OPERATOR;
				case CharCode.BACKTICK:
					return TokenType.STRING_TEMPLATE;
				case CharCode.SINGLE_QUOTE:
					return TokenType.STRING_SINGLE;
				case CharCode.DOUBLE_QUOTE:
					return TokenType.STRING_DOUBLE;
				case CharCode.PARENTHESIS_OPEN:
				case CharCode.PARENTHESIS_CLOSE:
					return TokenType.PARENTHESES;
				case CharCode.BRACKET_OPEN:
				case CharCode.BRACKET_CLOSE:
					return TokenType.BRACKET;
				case CharCode.BRACE_OPEN:
				case CharCode.BRACE_CLOSE:
					return TokenType.BRACE;
				case CharCode.SEMICOLON:
					return TokenType.SEMICOLON;
				default:
					if (isWordChar(currentChar, currentCharCode))
					{
						return TokenType.WORD;
					}

					return isOperatorChar(currentCharCode) ? TokenType.OPERATOR : TokenType.WHITESPACE;
			}
		};

		// A backslash makes the loop wait for the character it escapes -- prevChar of `true` is
		// what keeps that character from ending a string or a token. There is nothing to wait for
		// past the end of the text, and waiting there used to add one iteration over no character
		// at all, whose `undefined` was spelled out and handed back as a token of the text.
		// eslint-disable-next-line no-cond-assign
		while ((prevChar = currentChar !== undefined && prevChar === '\\' && !CommentTokenTypes.has(tokenType)
			? true
			: currentChar))
		{
			currentChar = nextChar;
			currentCharCode = text.codePointAt(currentPosition);
			nextChar = text[++currentPosition];
			isMultiChar = tokenContent.length > 1;

			if (tokenType === null)
			{
				tokenType = getTokenType();
			}

			if (shouldFinalizeToken())
			{
				if (tokenContent)
				{
					result.push({
						content: tokenContent,
						type: this.#normalizeTokenType(tokenType, tokenContent),
					});
				}

				if (tokenType !== TokenType.WHITESPACE && !CommentTokenTypes.has(tokenType))
				{
					lastTokenType = tokenType;
				}

				tokenContent = '';
				tokenType = getTokenType();
			}

			tokenContent += currentChar;
			beforePrevChar = prevChar;
		}

		return merge ? mergeTokens(result) : result;
	}

	#normalizeTokenType(type: string, content: string): string
	{
		if (CommentTokenTypes.has(type))
		{
			return 'comment';
		}

		if (StringTokenTypes.has(type))
		{
			return 'string';
		}

		if (type === TokenType.WORD)
		{
			if (keywords.has(content))
			{
				return 'keyword';
			}

			if (isDigitChar(content.codePointAt(0)))
			{
				return 'number';
			}
		}

		return type;
	}
}
