import { Type } from 'main.core';

const OPEN_ENTITY = '&#123;';
const CLOSE_ENTITY = '&#125;';

const BRACE_OR_TOKEN_RE = /{[^{}]*}|[{}]/g;

export class EscapeService
{
	/**
	 * HTML-escapes literal braces so they can't be mistaken for placeholders on the backend.
	 *
	 * `knownCodes` are placeholder codes that reached the body through the field selector
	 * (template `FILLED_PLACEHOLDERS`); the matching `{code}` tokens are legitimate placeholders
	 * and must survive untouched. Everything else — hand-typed braces — gets escaped. This keeps
	 * the "known placeholder" decision entirely on the front end, without loading any list from the backend.
	 */
	encode(body: string, knownCodes: Array<string> = []): string
	{
		if (!Type.isString(body))
		{
			return '';
		}

		const preserved = this.#buildPreservedTokens(knownCodes);
		if (preserved.size === 0)
		{
			return this.#escapeBraces(body);
		}

		return body.replaceAll(BRACE_OR_TOKEN_RE, (match) => {
			return preserved.has(match) ? match : this.#escapeBraces(match);
		});
	}

	decode(body: string): string
	{
		if (!Type.isString(body))
		{
			return '';
		}

		return body.replaceAll(OPEN_ENTITY, '{').replaceAll(CLOSE_ENTITY, '}');
	}

	#escapeBraces(input: string): string
	{
		return input.replaceAll('{', OPEN_ENTITY).replaceAll('}', CLOSE_ENTITY);
	}

	#buildPreservedTokens(knownCodes: Array<string>): Set<string>
	{
		const tokens: Set<string> = new Set();
		if (!Type.isArrayFilled(knownCodes))
		{
			return tokens;
		}

		knownCodes.forEach((code) => {
			if (Type.isStringFilled(code))
			{
				tokens.add(`{${code}}`);
			}
		});

		return tokens;
	}
}
