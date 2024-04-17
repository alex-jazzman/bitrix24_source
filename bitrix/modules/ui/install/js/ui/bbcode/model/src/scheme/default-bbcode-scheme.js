import { Type } from 'main.core';
import { BBCodeScheme } from './bbcode-scheme';
import { BBCodeTagScheme } from './node-schemes/tag-scheme';
import { BBCodeTextScheme } from './node-schemes/text-scheme';
import { BBCodeTabScheme } from './node-schemes/tab-scheme';
import { typeof BBCodeTextNode } from '../nodes/text-node';
import { typeof BBCodeElementNode } from '../nodes/element-node';
import type { BBCodeContentNode } from '../nodes/node';
import type { BBCodeSchemeOptions } from './bbcode-scheme';

export class DefaultBBCodeScheme extends BBCodeScheme
{
	constructor(options: BBCodeSchemeOptions = {})
	{
		super({
			tagSchemes: [
				new BBCodeTagScheme({
					name: ['b', 'i', 'u', 's', 'span'],
					inline: true,
					allowedChildren: ['#text', '#linebreak', '#inline'],
				}),
				new BBCodeTagScheme({
					name: ['img'],
					inline: true,
					allowedChildren: ['#text'],
				}),
				new BBCodeTagScheme({
					name: ['url'],
					inline: true,
					allowedChildren: ['#text', 'b', 'i', 'u', 's'],
				}),
				new BBCodeTagScheme({
					name: 'p',
					inline: false,
					allowedChildren: ['#text', '#linebreak', '#inline', 'disk', 'video'],
					stringify: BBCodeTagScheme.defaultBlockStringifier,
				}),
				new BBCodeTagScheme({
					name: 'list',
					inline: false,
					allowedChildren: ['*'],
					stringify: BBCodeTagScheme.defaultBlockStringifier,
				}),
				new BBCodeTagScheme({
					name: ['*'],
					inline: false,
					allowedChildren: ['#text', '#linebreak', '#inline', 'list'],
					stringify: (node: BBCodeElementNode) => {
						const openingTag: string = node.getOpeningTag();
						const content: string = node.getContent().trim();

						return `${openingTag}${content}`;
					},
				}),
				new BBCodeTagScheme({
					name: ['ul'],
					inline: false,
					allowedChildren: ['li'],
					convert: (node: BBCodeElementNode, scheme: BBCodeScheme) => {
						return scheme.createElement({
							name: 'list',
							attributes: node.getAttributes(),
							children: node.getChildren(),
						});
					},
				}),
				new BBCodeTagScheme({
					name: ['ol'],
					inline: false,
					allowedChildren: ['li'],
					convert: (node: BBCodeElementNode, scheme: BBCodeScheme) => {
						return scheme.createElement({
							name: 'list',
							value: '1',
							attributes: node.getAttributes(),
							children: node.getChildren(),
						});
					},
				}),
				new BBCodeTagScheme({
					name: ['li'],
					inline: false,
					allowedChildren: ['#text', '#linebreak', '#inline', 'ul', 'ol'],
					convert: (node: BBCodeElementNode, scheme: BBCodeScheme) => {
						return scheme.createElement({
							name: '*',
							children: node.getChildren(),
						});
					},
				}),
				new BBCodeTagScheme({
					name: 'table',
					inline: false,
					allowedChildren: ['tr'],
					stringify: BBCodeTagScheme.defaultBlockStringifier,
				}),
				new BBCodeTagScheme({
					name: 'tr',
					inline: false,
					allowedChildren: ['th', 'td'],
				}),
				new BBCodeTagScheme({
					name: ['th', 'td'],
					inline: false,
					allowedChildren: ['#text', '#linebreak', '#inline'],
				}),
				new BBCodeTagScheme({
					name: 'quote',
					inline: false,
					allowedChildren: ['#text', '#linebreak', '#inline', 'quote'],
				}),
				new BBCodeTagScheme({
					name: 'code',
					inline: false,
					stringify: BBCodeTagScheme.defaultBlockStringifier,
					convertChild: (child: BBCodeContentNode, scheme: BBCodeScheme): BBCodeContentNode => {
						if (['#linebreak', '#tab', '#text'].includes(child.getName()))
						{
							return child;
						}

						return scheme.createText(child.toString());
					},
				}),
				new BBCodeTagScheme({
					name: 'video',
					inline: false,
					allowedChildren: ['#text'],
				}),
				new BBCodeTagScheme({
					name: 'spoiler',
					inline: false,
					allowedChildren: [
						'#text',
						'#linebreak',
						'#inline',
						'p',
						'quote',
						'code',
						'table',
						'disk',
						'video',
						'spoiler',
						'list',
					],
				}),
				new BBCodeTagScheme({
					name: ['user', 'project', 'department'],
					inline: true,
					allowedChildren: ['#text', 'b', 'u', 'i', 's'],
				}),
				new BBCodeTagScheme({
					name: 'disk',
					void: true,
				}),
				new BBCodeTagScheme({
					name: ['#root', '#fragment'],
				}),
				new BBCodeTextScheme({
					convert: (node: BBCodeTextNode, scheme: BBCodeScheme) => {
						return scheme.createText({
							content: node.toString().replaceAll(' - ', '&mdash;'),
						});
					},
				}),
				new BBCodeTabScheme({
					stringify: () => {
						return '';
					},
				}),
			],
			outputTagCase: BBCodeScheme.Case.LOWER,
			unresolvedNodesHoisting: true,
		});

		if (Type.isPlainObject(options))
		{
			this.setTagSchemes(options.tagSchemes);
			this.setOutputTagCase(options.outputTagCase);
			this.setUnresolvedNodesHoisting(options.unresolvedNodesHoisting);
		}
	}
}
