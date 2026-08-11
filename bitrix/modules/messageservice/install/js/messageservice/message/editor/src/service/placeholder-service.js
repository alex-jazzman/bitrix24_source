import { Type } from 'main.core';

export const PLACEHOLDER_TAG_NAME = 'placeholder';

// The negative lookahead `(?!\s*\[/placeholder\])` after the opening `]`
// rejects both empty and whitespace-only captions in one step.
const PLACEHOLDER_RE = new RegExp(
	`\\[${PLACEHOLDER_TAG_NAME}\\s+(?=[^\\]]*\\bcode=(?:"[^"]+"|[^\\s"\\]]+))([^\\]]*)\\](?!\\s*\\[\\/${PLACEHOLDER_TAG_NAME}\\])(.+?)\\[\\/${PLACEHOLDER_TAG_NAME}\\]`,
	'gs',
);
const ATTR_RE = /(\w+)(?:=(?:"([^"]*)"|([^\s"\]]+)))?/g;

export type TextToken =
	| { type: 'text', content: string }
	| { type: 'linebreak' }
	| { type: 'placeholder', attrs: { [key: string]: string }, caption: string };

export class PlaceholderService
{
	scan(text: string): Array<TextToken>
	{
		const tokens: Array<TextToken> = [];
		let lastIndex = 0;
		for (const match of text.matchAll(PLACEHOLDER_RE))
		{
			if (match.index > lastIndex)
			{
				tokens.push(...this.#splitLinebreaks(text.slice(lastIndex, match.index)));
			}
			tokens.push({
				type: 'placeholder',
				attrs: this.#parseAttrs(match[1] ?? ''),
				caption: match[2] ?? '',
			});
			lastIndex = match.index + match[0].length;
		}

		if (lastIndex < text.length)
		{
			tokens.push(...this.#splitLinebreaks(text.slice(lastIndex)));
		}

		return tokens;
	}

	serializePlaceholder(code: string, caption: string, attrs: { [key: string]: string } = {}): string
	{
		if (!Type.isStringFilled(code))
		{
			throw new Error('PlaceholderService: argument "code" is required and must be a non-empty string');
		}

		if (!Type.isStringFilled(caption))
		{
			throw new Error('PlaceholderService: argument "caption" is required and must be a non-empty string');
		}

		// strip code from attrs so the explicit argument always wins
		const { code: _ignoredCode, ...restAttrs } = attrs;
		const attrPairs = Object.entries({ code, ...restAttrs }).map(([key, value]) => {
			if (value === '')
			{
				return key;
			}

			if (/["\]]/.test(value))
			{
				throw new Error(`PlaceholderService: attribute "${key}" value contains forbidden character (] or "): ${value}`);
			}

			return /\s/.test(value) ? `${key}="${value}"` : `${key}=${value}`;
		});

		return `[${PLACEHOLDER_TAG_NAME} ${attrPairs.join(' ')}]${caption}[/${PLACEHOLDER_TAG_NAME}]`;
	}

	replace(
		template: string,
		replacer: (code: string, customData: { [key: string]: string }) => string | null,
	): string
	{
		return this.scan(template).map((token) => {
			if (token.type === 'placeholder')
			{
				const { code = '', ...customData } = token.attrs;
				const result = replacer(code, customData);

				return result === null ? this.serializePlaceholder(code, token.caption, customData) : result;
			}

			return token.type === 'linebreak' ? '\n' : token.content;
		}).join('');
	}

	toDisplayText(text: string): string
	{
		return this.scan(text).map((token) => {
			if (token.type === 'placeholder')
			{
				return token.caption;
			}

			return token.type === 'linebreak' ? '\n' : token.content;
		}).join('');
	}

	#splitLinebreaks(text: string): Array<TextToken>
	{
		if (text === '')
		{
			return [];
		}

		const parts = text.split('\n');
		const tokens: Array<TextToken> = [];
		parts.forEach((part, i) => {
			if (part !== '')
			{
				tokens.push({ type: 'text', content: part });
			}

			if (i < parts.length - 1)
			{
				tokens.push({ type: 'linebreak' });
			}
		});

		return tokens;
	}

	#parseAttrs(str: string): { [key: string]: string }
	{
		const attrs = {};
		for (const match of str.matchAll(ATTR_RE))
		{
			const [, key, quoted, unquoted] = match;
			attrs[key] = quoted ?? unquoted ?? '';
		}

		return attrs;
	}
}

export const placeholderService = new PlaceholderService();
