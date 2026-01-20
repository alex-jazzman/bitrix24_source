import { Type } from 'main.core';
import { AstProcessor } from 'ui.bbcode.ast-processor';
import { getByIndex } from '../../shared';
import {
	BBCodeScheme,
	DefaultBBCodeScheme,
	BBCodeNode,
	typeof BBCodeRootNode,
	typeof BBCodeElementNode,
	typeof BBCodeTextNode,
	typeof BBCodeTagScheme,
	type BBCodeContentNode,
} from 'ui.bbcode.model';
import { BBCodeEncoder } from 'ui.bbcode.encoder';
import { Linkify } from 'ui.linkify';
import { ParserScheme } from './parser-scheme';
import { BBCodeTokenizer, type BBCodeToken } from './tokenizer';

const parserScheme = new ParserScheme();

type BBCodeParserOptions = {
	scheme?: BBCodeScheme,
	onUnknown?: (node: BBCodeContentNode, scheme: BBCodeScheme) => void,
	encoder?: BBCodeEncoder,
	linkify?: boolean,
};

class BBCodeParser
{
	scheme: BBCodeScheme;
	encoder: BBCodeEncoder;
	onUnknownHandler: () => any;
	allowedLinkify: boolean = true;

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

		if (options.encoder instanceof BBCodeEncoder)
		{
			this.setEncoder(options.encoder);
		}
		else
		{
			this.setEncoder(new BBCodeEncoder());
		}

		if (Type.isBoolean(options.linkify))
		{
			this.setIsAllowedLinkify(options.linkify);
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

	setEncoder(encoder: BBCodeEncoder)
	{
		if (encoder instanceof BBCodeEncoder)
		{
			this.encoder = encoder;
		}
		else
		{
			throw new TypeError('encoder is not BBCodeEncoder instance');
		}
	}

	getEncoder(): BBCodeEncoder
	{
		return this.encoder;
	}

	setIsAllowedLinkify(value: boolean)
	{
		this.allowedLinkify = Boolean(value);
	}

	isAllowedLinkify(): boolean
	{
		return this.allowedLinkify;
	}

	canBeLinkified(node: BBCodeTextNode | BBCodeElementNode): boolean
	{
		if (node.getName() === '#text')
		{
			const notAllowedNodeNames = ['url', 'img', 'video', 'code'];
			const inNotAllowedNode = notAllowedNodeNames.some((name: string) => {
				return Boolean(AstProcessor.findParentNodeByName(node, name));
			});

			return !inNotAllowedNode;
		}

		return false;
	}

	static defaultOnUnknownHandler(node: BBCodeContentNode, scheme: BBCodeScheme): ?Array<BBCodeContentNode>
	{
		if (node.getType() === BBCodeNode.ELEMENT_NODE)
		{
			const nodeName: string = node.getName();
			if (['left', 'center', 'right', 'justify'].includes(nodeName))
			{
				const newNode = scheme.createElement({
					name: 'p',
				});
				node.replace(newNode);
				newNode.setChildren(node.getChildren());
			}
			else if (['background', 'color', 'size'].includes(nodeName))
			{
				const newNode = scheme.createElement({
					name: 'b',
				});
				node.replace(newNode);
				newNode.setChildren(node.getChildren());
			}
			else if (['span', 'font'].includes(nodeName))
			{
				const fragment = scheme.createFragment({ children: node.getChildren() });
				node.replace(fragment);
			}
			else
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
	}

	decodeAttributes(sourceAttributes: Array<string, string>): Array<string, string>
	{
		if (Type.isArrayFilled(sourceAttributes))
		{
			return sourceAttributes.map(([key, value]) => {
				return [
					key,
					this.getEncoder().decodeAttribute(value),
				];
			});
		}

		return sourceAttributes;
	}

	parse(bbcode: string): BBCodeRootNode
	{
		const tokenizer = new BBCodeTokenizer();
		const tokens = tokenizer.tokenize(bbcode);

		const result: BBCodeRootNode = parserScheme.createRoot();
		const stack = [result];
		const wasOpened = [];
		let level = 0;

		tokens.forEach((token: BBCodeToken) => {
			const parent = stack[level];

			switch (token.type)
			{
				case 'OPEN_TAG': {
					const tagScheme = this.getScheme().getTagScheme(token.name);
					const isVoidTag = tagScheme && tagScheme.isVoid();
					if (isVoidTag)
					{
						const voidNode = parserScheme.createElement({
							name: token.name,
							value: this.getEncoder().decodeAttribute(token.value),
							attributes: this.decodeAttributes(token.attributes),
						});

						voidNode.setScheme(this.getScheme());
						parent.appendChild(voidNode);
					}
					else if (token.unclosed)
					{
						parent.appendChild(parserScheme.createText(`[${token.name}]`));
					}
					else
					{
						const currentNode = parserScheme.createElement({
							name: token.name,
							value: this.getEncoder().decodeAttribute(token.value),
							attributes: this.decodeAttributes(token.attributes),
						});

						parent.appendChild(currentNode);
						wasOpened.push(token.name);
						stack.push(currentNode);
						level++;
					}

					break;
				}

				case 'CLOSE_TAG': {
					if (wasOpened.includes(token.name))
					{
						const openedTagIndex = wasOpened.indexOf(token.name);
						wasOpened.splice(openedTagIndex, 1);
						stack.pop();
						level--;
					}
					else
					{
						parent.appendChild(parserScheme.createText(`[/${token.name}]`));
					}

					break;
				}

				case 'TEXT': {
					parent.appendChild(
						parserScheme.createText({
							content: this.getEncoder().decodeText(token.content),
						}),
					);

					break;
				}

				case 'LINEBREAK': {
					parent.appendChild(parserScheme.createNewLine());

					break;
				}

				case 'TAB': {
					parent.appendChild(parserScheme.createTab());

					break;
				}

				default: {
					break;
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
						node.getChildren().slice(0, getByIndex(finalLinebreaksIndexes, 0)),
					);
				}

				if (finalLinebreaksIndexes.length > 1 && (finalLinebreaksIndexes & 2) === 0)
				{
					node.setChildren(
						node.getChildren().slice(0, getByIndex(finalLinebreaksIndexes, 0)),
					);
				}
			}

			if (
				this.isAllowedLinkify()
				&& this.canBeLinkified(node)
			)
			{
				const content = node.toString({ encode: false });
				const MultiTokens: Array<Linkify.MultiToken> = Linkify.tokenize(content);

				const nodes = MultiTokens.map((token: Linkify.MultiToken) => {
					if (token.t === 'url')
					{
						return parserScheme.createElement({
							name: 'url',
							value: token.toHref().replace(/^http:\/\//, 'https://'),
							children: [
								parserScheme.createText(token.toString()),
							],
						});
					}

					if (token.t === 'email')
					{
						return parserScheme.createElement({
							name: 'url',
							value: token.toHref(),
							children: [
								parserScheme.createText(token.toString()),
							],
						});
					}

					return parserScheme.createText(token.toString());
				});

				node.replace(...nodes);
			}
		});

		BBCodeNode.flattenAst(result).forEach((node: BBCodeNode) => {
			const tagScheme: BBCodeTagScheme = this.getScheme().getTagScheme(node);
			if (tagScheme)
			{
				tagScheme.runOnParseHandler(node);
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
