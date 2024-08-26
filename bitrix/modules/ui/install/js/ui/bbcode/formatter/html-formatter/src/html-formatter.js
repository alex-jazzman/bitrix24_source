import { Type, Extension } from 'main.core';
import {
	Formatter,
	NodeFormatter,
	type FormatterOptions,
	type UnknownNodeCallbackOptions,
	type BeforeConvertCallbackOptions,
} from 'ui.bbcode.formatter';
import { BBCodeScheme, BBCodeFragmentNode } from 'ui.bbcode.model';
import * as NodeFormatters from './node-formatters';

import 'ui.icon-set.actions';

export type HtmlFormatterOptions = FormatterOptions & {
	linkSettings?: {
		allowedSchemes?: string,
		defaultScheme?: 'http',
		defaultTarget?: '_self' | '_blank' | '_parent' | '_top',
		shortLink: {
			enabled?: boolean,
			maxLength?: number,
			lastFragmentLength?: number,
		},
		attributes?: {
			[key: string]: string,
		},
	},
	mention: {
		urlTemplate: {
			user: string,
			project: string,
			department: string,
		},
	},
};

const globalSettings = Extension.getSettings('ui.bbcode.formatter.html-formatter');

/**
 * @memberOf BX.UI.BBCode.Formatter
 */
export class HtmlFormatter extends Formatter
{
	#linkSettings: HtmlFormatterOptions['linkSettings'];
	#mentionSettings: HtmlFormatterOptions['mention'];

	constructor(options: HtmlFormatterOptions = {})
	{
		super({
			formatters: Object.values(NodeFormatters).map((FormatterClass: NodeFormatter) => {
				return new FormatterClass();
			}),
		});

		this.setNodeFormatters(options.formatters);

		this.setLinkSettings({
			...globalSettings.linkSettings,
			...options.linkSettings,
		});

		this.setMentionSettings({
			...globalSettings.mention,
			...options.mention,
		});
	}

	static decodeAmpersand(source: ?string): string
	{
		if (Type.isStringFilled(source))
		{
			return source.replaceAll(/&amp;/gi, '&');
		}

		return '';
	}

	static decodeSquareBrackets(source: ?string): string
	{
		if (Type.isStringFilled(source))
		{
			return source
				.replaceAll(/&#91;/g, '[')
				.replaceAll(/&#93;/g, ']');
		}

		return '';
	}

	static stripFormFeedCharacter(source: ?string): string
	{
		if (Type.isStringFilled(source))
		{
			return source.replaceAll(/\f/gi, '');
		}

		return '';
	}

	static encodeSingleQuotes(source: ?string): string
	{
		if (Type.isStringFilled(source))
		{
			return source.replaceAll('\'', '%27');
		}

		return '';
	}

	static isAbsolutePath(path: ?string): boolean
	{
		return String(path).startsWith('/');
	}

	isHrefStartsWithAllowedScheme(sourceHref: ?string): boolean
	{
		return (
			Type.isStringFilled(sourceHref)
			&& (new RegExp(`/^${this.getLinkSettings().allowedSchemes}/`)).test(sourceHref)
		);
	}

	assignDefaultUrlScheme(sourceHref: ?string): string
	{
		if (Type.isStringFilled(sourceHref))
		{
			const defaultScheme: string = this.getLinkSettings().defaultScheme;

			return `${defaultScheme}://${sourceHref}`;
		}

		return '';
	}

	isShortLinkEnabled(): boolean
	{
		const { shortLink } = this.getLinkSettings();

		return (
			Type.isPlainObject(shortLink)
			&& shortLink.enabled === true
			&& Type.isInteger(shortLink.maxLength)
		);
	}

	makeSafeHref(sourceHref: ?string): string
	{
		if (Type.isStringFilled(sourceHref))
		{
			let preparedHref = HtmlFormatter.decodeAmpersand(sourceHref);
			preparedHref = HtmlFormatter.decodeSquareBrackets(preparedHref);
			preparedHref = HtmlFormatter.stripFormFeedCharacter(preparedHref);
			preparedHref = HtmlFormatter.encodeSingleQuotes(preparedHref);

			if (
				!HtmlFormatter.isAbsolutePath(preparedHref)
				&& !this.isHrefStartsWithAllowedScheme(preparedHref)
			)
			{
				preparedHref = this.assignDefaultUrlScheme(preparedHref);
			}

			return preparedHref;
		}

		return '';
	}

	setLinkSettings(settings: HtmlFormatterOptions['linkSettings'])
	{
		this.#linkSettings = { ...settings };
	}

	getLinkSettings(): HtmlFormatterOptions['linkSettings']
	{
		return this.#linkSettings;
	}

	setMentionSettings(settings: HtmlFormatterOptions['mention'])
	{
		this.#mentionSettings = { ...settings };
	}

	getMentionSettings(): HtmlFormatterOptions['mention']
	{
		return this.#mentionSettings;
	}

	getDefaultUnknownNodeCallback(options): (UnknownNodeCallbackOptions) => NodeFormatter | null
	{
		return () => {
			return new NodeFormatter({
				name: 'unknown',
				before({ node }: BeforeConvertCallbackOptions): BBCodeFragmentNode {
					const scheme: BBCodeScheme = node.getScheme();

					if (node.isVoid())
					{
						return scheme.createFragment({
							children: [
								scheme.createText(node.getOpeningTag()),
							],
						});
					}

					return scheme.createFragment({
						children: [
							scheme.createText(node.getOpeningTag()),
							...node.getChildren(),
							scheme.createText(node.getClosingTag()),
						],
					});
				},
				convert(): DocumentFragment {
					return document.createDocumentFragment();
				},
			});
		};
	}
}
