/* eslint-disable no-underscore-dangle */

import { Type } from 'main.core';

import { type LexicalNode, type LexicalNodeConfig, type LexicalNodeReplacement } from 'ui.lexical.core';

import {
	autoLinkEmailMatcher,
	autoLinkUrlMatcher,
	AutoLinkNode,
	registerAutoLink,
	type LinkMatcher,
	LinkNode,
} from 'ui.lexical.link';

import { $isInsideUnformatted } from '../../helpers/is-unformatted';
import { exportLinkNode } from '../link';
import { $createCustomAutoLinkNode, CustomAutoLinkNode } from './custom-autolink-node';

import { BasePlugin } from '../base-plugin';
import { type TextEditor } from '../../text-editor';

import { type BBCodeExportConversion, type BBCodeExportOutput } from '../../bbcode';
import { type SchemeValidationOptions } from '../../types/scheme-validation-options';

// The matchers come from ui.lexical.link: unlike the ASCII-only expressions they replace, they
// recognize IDN hosts and non-ASCII paths, balance trailing parentheses and, most importantly,
// build the url out of the match instead of the whole text node.
const MATCHERS: LinkMatcher[] = [autoLinkUrlMatcher, autoLinkEmailMatcher]
	.map((matcher: LinkMatcher): LinkMatcher => openingInNewTab(matcher));

// What counts as the edge of a link. Wider than the lexical default (/[.,;\s]/) by brackets and
// parentheses, which is what this editor has always used: a url written in brackets ends at the
// closing one instead of swallowing it.
const SEPARATOR = /[\s(),.;[\]]/;

export type { LinkMatcher };

export class AutoLinkPlugin extends BasePlugin
{
	constructor(editor: TextEditor)
	{
		super(editor);

		this.#registerListeners();
	}

	static getName(): string
	{
		return 'AutoLink';
	}

	static getNodes(editor: TextEditor): Array<LexicalNodeConfig>
	{
		return [
			AutoLinkNode,
			CustomAutoLinkNode,
			{
				replace: AutoLinkNode,
				with: (node: AutoLinkNode) => {
					return $createCustomAutoLinkNode(node.__url, {
						isUnlinked: node.__isUnlinked,
						rel: node.__rel,
						target: node.__target,
						title: node.__title,
					});
				},
				withKlass: CustomAutoLinkNode,
			} satisfies LexicalNodeReplacement,
		];
	}

	exportBBCode(): BBCodeExportConversion
	{
		return {
			autolink: (lexicalNode: LexicalNode): BBCodeExportOutput => {
				return exportLinkNode(lexicalNode as LinkNode, this.getEditor());
			},
			'custom-autolink': (lexicalNode: LexicalNode): BBCodeExportOutput => {
				return exportLinkNode(lexicalNode as LinkNode, this.getEditor());
			},
		};
	}

	validateScheme(): SchemeValidationOptions | null
	{
		return {
			nodes: [
				{
					nodeClass: CustomAutoLinkNode,
				},
			],
			bbcodeMap: {
				autolink: 'url',
				'custom-autolink': 'url',
			},
		};
	}

	#registerListeners(): void
	{
		this.cleanUpRegister(
			registerAutoLink(this.getEditor().getLexicalEditor(), {
				matchers: MATCHERS,
				changeHandlers: [],
				excludeParents: [$isInsideUnformatted],
				separatorRegex: SEPARATOR,
			}),
		);
	}
}

/**
 * An auto-link opens in a new tab. The matchers say nothing about it and the transform passes
 * their attributes through untouched, so the default is added around the matcher -- which is the
 * whole reason this cannot simply be `[autoLinkUrlMatcher, autoLinkEmailMatcher]`.
 */
function openingInNewTab(matcher: LinkMatcher): LinkMatcher
{
	return (text: string) => {
		const match = matcher(text);
		if (match === null)
		{
			return null;
		}

		const attributes = { ...match.attributes };
		if (!Type.isStringFilled(attributes.target))
		{
			attributes.target = '_blank';
		}

		return { ...match, attributes };
	};
}
