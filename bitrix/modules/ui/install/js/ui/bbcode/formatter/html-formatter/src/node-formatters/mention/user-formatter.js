import { Dom, Type } from 'main.core';
import {
	NodeFormatter,
	type ConvertCallbackOptions,
	type NodeFormatterOptions,
} from 'ui.bbcode.formatter';
import type { HtmlFormatterOptions } from '../../html-formatter';

export class UserNodeFormatter extends NodeFormatter
{
	constructor(options: NodeFormatterOptions)
	{
		super({
			name: 'user',
			convert({ node, formatter }: ConvertCallbackOptions): HTMLAnchorElement {
				const mentionSettings: HtmlFormatterOptions['mention'] = formatter.getMentionSettings();
				if (Type.isStringFilled(mentionSettings?.urlTemplate?.user))
				{
					const urlTemplate: string = mentionSettings.urlTemplate.user;
					const userUrl: string = urlTemplate.replaceAll('#ID#', node.getValue());

					return Dom.create({
						tag: 'a',
						attrs: {
							className: 'ui-formatter-link ui-formatter-mention',
							href: formatter.makeSafeHref(userUrl),
							target: '_blank',
						},
					});
				}

				return Dom.create({
					tag: 'span',
					attrs: {
						className: 'ui-formatter-mention-stub',
					},
				});
			},
			...options,
		});
	}
}
