import { Type } from 'main.core';
import {
	BBCodeScheme,
	DefaultBBCodeScheme,
	BBCodeNode,
	typeof BBCodeRootNode,
	typeof BBCodeElementNode,
	typeof BBCodeTextNode,
	typeof BBCodeTagScheme,
	type BBCodeContentNode,
	type BBCodeSpecialCharNode,
} from 'ui.bbcode.model';
import { ParserScheme } from './parser-scheme';

const TAG_REGEX: RegExp = /\[(\/)?(\w+|\*)([\s\w"'./:=]+)?]/gs;
const isSpecialChar = (symbol: string): boolean => {
	return ['\n', '\t'].includes(symbol);
};

const isList = (tagName: string): boolean => {
	return ['list', 'ul', 'ol'].includes(tagName);
};

const isListItem = (tagName: string): boolean => {
	return ['*', 'li'].includes(tagName);
};

const parserScheme = new ParserScheme();

type BBCodeParserOptions = {
	scheme?: BBCodeScheme,
	onUnknown?: (node: BBCodeContentNode, scheme: BBCodeScheme) => void,
};

class BBCodeParser
{
	scheme: BBCodeScheme;
	onUnknownHandler: () => any;

	constructor(options: BBCodeParserOptions = {})
	{
		if (options.scheme)
		{
			this.setScheme(options.scheme);
		}
		else
		{
			this.setScheme(new DefaultBBCodeScheme());
		}

		if (Type.isFunction(options.onUnknown))
		{
			this.setOnUnknown(options.onUnknown);
		}
		else
		{
			this.setOnUnknown(BBCodeParser.defaultOnUnknownHandler);
		}
	}

	setScheme(scheme: BBCodeScheme)
	{
		this.scheme = scheme;
	}

	getScheme(): BBCodeScheme
	{
		return this.scheme;
	}

	setOnUnknown(handler: () => any)
	{
		if (!Type.isFunction(handler))
		{
			throw new TypeError('handler is not a function');
		}

		this.onUnknownHandler = handler;
	}

	getOnUnknownHandler(): () => any
	{
		return this.onUnknownHandler;
	}

	static defaultOnUnknownHandler(node: BBCodeContentNode, scheme: BBCodeScheme): ?Array<BBCodeContentNode>
	{
		if (node.getType() === BBCodeNode.ELEMENT_NODE)
		{
			const openingTag: string = node.getOpeningTag();
			const closingTag: string = node.getClosingTag();

			node.replace(
				scheme.createText(openingTag),
				...node.getChildren(),
				scheme.createText(closingTag),
			);
		}
	}

	static toLowerCase(value: string): string
	{
		if (Type.isStringFilled(value))
		{
			return value.toLowerCase();
		}

		return value;
	}

	parseText(text: string): Array<BBCodeTextNode | BBCodeSpecialCharNode>
	{
		if (Type.isStringFilled(text))
		{
			return [...text]
				.reduce((acc: Array<BBCodeTextNode | BBCodeSpecialCharNode>, symbol: string) => {
					if (isSpecialChar(symbol))
					{
						acc.push(symbol);
					}
					else
					{
						const lastItem: string = acc.at(-1);
						if (isSpecialChar(lastItem) || Type.isNil(lastItem))
						{
							acc.push(symbol);
						}
						else
						{
							acc[acc.length - 1] += symbol;
						}
					}

					return acc;
				}, [])
				.map((fragment: string) => {
					if (fragment === '\n')
					{
						return parserScheme.createNewLine();
					}

					if (fragment === '\t')
					{
						return parserScheme.createTab();
					}

					return parserScheme.createText({ content: fragment });
				});
		}

		return [];
	}

	static findNextTagIndex(bbcode: string, startIndex = 0): number
	{
		const nextContent: string = bbcode.slice(startIndex);
		const [nextTag: ?string] = nextContent.match(new RegExp(TAG_REGEX)) || [];
		if (nextTag)
		{
			return bbcode.indexOf(nextTag, startIndex);
		}

		return -1;
	}

	static trimQuotes(value: string): string
	{
		const source = String(value);
		if ((/^["'].*["']$/g).test(source))
		{
			return source.slice(1, -1);
		}

		return value;
	}

	parseAttributes(sourceAttributes: string): { value: ?string, attributes: Array<[string, string]> }
	{
		const result: {value: string, attributes: Array<Array<string, string>>} = { value: '', attributes: [] };

		if (Type.isStringFilled(sourceAttributes))
		{
			if (sourceAttributes.startsWith('='))
			{
				result.value = BBCodeParser.trimQuotes(
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
						BBCodeParser.toLowerCase(key),
						BBCodeParser.trimQuotes(value),
					]);

					return acc;
				}, result);
		}

		return result;
	}

	parse(bbcode: string): BBCodeRootNode
	{
		const result: BBCodeRootNode = parserScheme.createRoot();
		const stack: Array<BBCodeElementNode> = [];
		let current: ?BBCodeElementNode = null;
		let level: number = -1;

		const firstTagIndex: number = BBCodeParser.findNextTagIndex(bbcode);
		if (firstTagIndex !== 0)
		{
			const textBeforeFirstTag: string = firstTagIndex === -1 ? bbcode : bbcode.slice(0, firstTagIndex);
			result.appendChild(
				...this.parseText(textBeforeFirstTag),
			);
		}

		bbcode.replace(TAG_REGEX, (fullTag: string, slash: ?string, tagName: string, attrs: ?string, index: number) => {
			const isOpenTag: boolean = Boolean(slash) === false;
			const startIndex: number = fullTag.length + index;
			const nextContent: string = bbcode.slice(startIndex);
			const attributes = this.parseAttributes(attrs);
			const lowerCaseTagName: string = BBCodeParser.toLowerCase(tagName);
			let parent: ?(BBCodeRootNode | BBCodeElementNode) = null;

			if (isOpenTag)
			{
				level++;

				if (
					nextContent.includes(`[/${tagName}]`)
					|| isListItem(lowerCaseTagName)
				)
				{
					current = parserScheme.createElement({
						name: lowerCaseTagName,
						value: attributes.value,
						attributes: Object.fromEntries(attributes.attributes),
					});

					const nextTagIndex: number = BBCodeParser.findNextTagIndex(bbcode, startIndex);
					if (nextTagIndex !== 0)
					{
						const content: string = nextTagIndex === -1 ? nextContent : bbcode.slice(startIndex, nextTagIndex);
						current.appendChild(
							...this.parseText(content),
						);
					}
				}
				else
				{
					const tagScheme: BBCodeTagScheme = this.getScheme().getTagScheme(lowerCaseTagName);
					if (tagScheme.isVoid())
					{
						current = parserScheme.createElement({
							name: lowerCaseTagName,
							value: attributes.value,
							attributes: Object.fromEntries(attributes.attributes),
						});

						current.setScheme(this.getScheme());
					}
					else
					{
						current = parserScheme.createText(fullTag);
					}
				}

				if (level === 0)
				{
					result.appendChild(current);
				}

				parent = stack[level - 1];

				if (isList(current.getName()))
				{
					if (parent && isList(parent.getName()))
					{
						stack[level].appendChild(current);
					}
					else if (parent)
					{
						parent.appendChild(current);
					}
				}
				else if (
					parent
					&& isList(parent.getName())
					&& !isListItem(current.getName())
				)
				{
					const lastItem: ?BBCodeContentNode = parent.getChildren().at(-1);
					if (lastItem)
					{
						lastItem.appendChild(current);
					}
				}
				else if (parent)
				{
					parent.appendChild(current);
				}

				stack[level] = current;

				if (isListItem(lowerCaseTagName) && level > -1)
				{
					level--;
					current = level === -1 ? result : stack[level];
				}
			}

			if (current.getName() === '#text')
			{
				level--;
			}

			if (!isOpenTag || current.getName() === '#text' || current.isVoid())
			{
				if (level > -1 && current.getName() === lowerCaseTagName)
				{
					level--;
					current = level === -1 ? result : stack[level];
				}

				const nextTagIndex: number = BBCodeParser.findNextTagIndex(bbcode, startIndex);
				if (nextTagIndex !== startIndex)
				{
					parent = level === -1 ? result : stack[level];

					const content: ?string = bbcode.slice(startIndex, nextTagIndex === -1 ? undefined : nextTagIndex);
					if (isList(parent.getName()))
					{
						const lastItem: ?BBCodeContentNode = parent.getChildren().at(-1);
						if (lastItem)
						{
							lastItem.appendChild(
								...this.parseText(content),
							);
						}
					}
					else
					{
						parent.appendChild(
							...this.parseText(content),
						);
					}
				}
			}
		});

		const getFinalLineBreaksIndexes = (node: BBCodeContentNode) => {
			let skip = false;

			return node
				.getChildren()
				.reduceRight((acc: Array<BBCodeContentNode>, child: BBCodeContentNode, index: number) => {
					if (!skip && child.getName() === '#linebreak')
					{
						acc.push(index);
					}
					else if (!skip && child.getName() !== '#tab')
					{
						skip = true;
					}

					return acc;
				}, []);
		};

		BBCodeNode.flattenAst(result).forEach((node: BBCodeContentNode) => {
			if (node.getName() === '*')
			{
				const finalLinebreaksIndexes: Array<number> = getFinalLineBreaksIndexes(node);
				if (finalLinebreaksIndexes.length === 1)
				{
					node.setChildren(
						node.getChildren().slice(0, finalLinebreaksIndexes.at(0)),
					);
				}

				if (finalLinebreaksIndexes.length > 1 && (finalLinebreaksIndexes & 2) === 0)
				{
					node.setChildren(
						node.getChildren().slice(0, finalLinebreaksIndexes.at(0)),
					);
				}
			}
		});

		result.setScheme(
			this.getScheme(),
			this.getOnUnknownHandler(),
		);

		return result;
	}
}

export {
	BBCodeParser,
};
