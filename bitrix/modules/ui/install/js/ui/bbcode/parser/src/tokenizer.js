import { Type } from 'main.core';

type BBCodeTokenType =
	| 'OPEN_TAG'
	| 'CLOSE_TAG'
	| 'TEXT'
	| 'LINEBREAK'
	| 'TAB';

type BaseBBCodeToken = {
	type: BBCodeTokenType,
};

type BBCodeOpenTagToken = BaseBBCodeToken & {
	type: 'OPEN_TAG',
	name: string,
	value: ?string,
	attributes: {
		[key: string]: string,
	},
	unclosed: boolean,
};

type BBCodeCloseTagToken = BaseBBCodeToken & {
	type: 'CLOSE_TAG',
};

type BBCodeTextToken = BaseBBCodeToken & {
	type: 'TEXT',
	content: string,
};

type BBCodeLinebreakToken = BaseBBCodeToken & {
	type: 'LINEBREAK',
};

type BBCodeTabToken = BaseBBCodeToken & {
	type: 'TAB',
};

export type BBCodeToken =
	BBCodeOpenTagToken
	| BBCodeCloseTagToken
	| BBCodeTextToken
	| BBCodeLinebreakToken
	| BBCodeTabToken;

const TAG_REGEX_GS: RegExp = /\[(\/)?(\w+|\*)(.*?)]/gs;

const LF = '\n';
const CRLF = '\r\n';
const TAB = '\t';

const isLinebreak = (symbol: string): boolean => {
	return [LF, CRLF].includes(symbol);
};

const isTab = (symbol: string): boolean => {
	return symbol === TAB;
};

export class BBCodeTokenizer
{
	static trimQuotes(value: string): string
	{
		const source = String(value);
		if ((/^["'].*["']$/g).test(source))
		{
			return source.slice(1, -1);
		}

		return value;
	}

	static toLowerCase(value: string): string
	{
		if (Type.isStringFilled(value))
		{
			return value.toLowerCase();
		}

		return value;
	}

	tokenize(bbcode: string): Array<BBCodeToken>
	{
		const tokens: Array<BBCodeToken> = [];
		const listNestingLevels: Array<boolean> = [];

		let lastIndex = 0;
		bbcode.replace(TAG_REGEX_GS, (fullTag: string, slash: ?string, tagName: string, attrs: ?string, index: number) => {
			if (index > lastIndex)
			{
				const textBetween = bbcode.slice(lastIndex, index);
				tokens.push(...this.parseText(textBetween));
			}

			const isOpeningTag: boolean = Boolean(slash) === false;
			const startIndex: number = fullTag.length + index;
			const attributes = this.parseAttributes(attrs);
			const lowerCaseTagName: string = BBCodeTokenizer.toLowerCase(tagName);

			if (lowerCaseTagName === 'list' && isOpeningTag)
			{
				listNestingLevels.push(false);

				tokens.push({
					type: 'OPEN_TAG',
					name: lowerCaseTagName,
					value: attributes.value,
					attributes: Object.fromEntries(attributes.attributes),
				});
			}
			else if (lowerCaseTagName === 'list' && !isOpeningTag)
			{
				if (listNestingLevels.length > 0)
				{
					if (listNestingLevels[listNestingLevels.length - 1])
					{
						tokens.push({
							type: 'CLOSE_TAG',
							name: '*',
						});

						listNestingLevels[listNestingLevels.length - 1] = false;
					}

					listNestingLevels.pop();
				}

				tokens.push({
					type: 'CLOSE_TAG',
					name: lowerCaseTagName,
				});
			}
			else if (lowerCaseTagName === '*' && isOpeningTag)
			{
				if (listNestingLevels.length > 0)
				{
					if (listNestingLevels[listNestingLevels.length - 1])
					{
						tokens.push({
							type: 'CLOSE_TAG',
							name: '*',
						});
					}

					listNestingLevels[listNestingLevels.length - 1] = true;
				}

				tokens.push({
					type: 'OPEN_TAG',
					name: lowerCaseTagName,
					value: attributes.value,
					attributes: Object.fromEntries(attributes.attributes),
				});
			}
			else if (isOpeningTag)
			{
				const nextContent: string = bbcode.slice(startIndex);
				const unclosed: boolean = !nextContent.includes(`[/${tagName}]`);

				tokens.push({
					type: 'OPEN_TAG',
					name: lowerCaseTagName,
					value: attributes.value,
					attributes: Object.fromEntries(attributes.attributes),
					unclosed,
				});
			}
			else
			{
				tokens.push({
					type: 'CLOSE_TAG',
					name: lowerCaseTagName,
				});
			}

			lastIndex = startIndex;
		});

		if (lastIndex < bbcode.length)
		{
			const remainingText = bbcode.slice(lastIndex);
			tokens.push(...this.parseText(remainingText));
		}

		for (let i = listNestingLevels.length - 1; i >= 0; i--)
		{
			if (listNestingLevels[i])
			{
				tokens.push({
					type: 'CLOSE_TAG',
					name: '*',
				});

				listNestingLevels[i] = false;
			}
		}

		return tokens;
	}

	parseText(text: string): Array<BBCodeToken>
	{
		const tokens: Array<BBCodeToken> = [];

		if (Type.isStringFilled(text))
		{
			const regex = /\\r\\n|\\n|\\t|\\.|.|\r\n|\n|\t/g;
			const matches = [...text.matchAll(regex)];

			let textBuffer = '';

			for (const match of matches)
			{
				const char = match[0];

				if (isLinebreak(char))
				{
					if (textBuffer)
					{
						tokens.push({
							type: 'TEXT',
							content: textBuffer,
						});

						textBuffer = '';
					}

					tokens.push({
						type: 'LINEBREAK',
					});
				}
				else if (isTab(char))
				{
					if (textBuffer)
					{
						tokens.push({
							type: 'TEXT',
							content: textBuffer,
						});

						textBuffer = '';
					}

					tokens.push({
						type: 'TAB',
					});
				}
				else
				{
					textBuffer += char;
				}
			}

			if (textBuffer)
			{
				tokens.push({
					type: 'TEXT',
					content: textBuffer,
				});
			}
		}

		return tokens;
	}

	parseAttributes(sourceAttributes: string): { value: ?string, attributes: Array<[string, string]> }
	{
		const result: {value: string, attributes: Array<Array<string, string>>} = { value: '', attributes: [] };

		if (Type.isStringFilled(sourceAttributes))
		{
			if (sourceAttributes.startsWith('='))
			{
				result.value = BBCodeTokenizer.trimQuotes(
					sourceAttributes.slice(1),
				);

				return result;
			}

			return sourceAttributes
				.trim()
				.split(' ')
				.filter(Boolean)
				.reduce((acc: typeof result, item: string) => {
					const [key: string, value: string = ''] = item.split('=');
					acc.attributes.push([
						BBCodeTokenizer.toLowerCase(key),
						BBCodeTokenizer.trimQuotes(value),
					]);

					return acc;
				}, result);
		}

		return result;
	}
}
