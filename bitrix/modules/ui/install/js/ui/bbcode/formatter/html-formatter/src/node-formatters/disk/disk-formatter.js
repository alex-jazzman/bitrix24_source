import { Dom, Type } from 'main.core';
import {
	NodeFormatter,
	type ConvertCallbackOptions,
	type NodeFormatterOptions,
} from 'ui.bbcode.formatter';

import './style.css';

export class DiskNodeFormatter extends NodeFormatter
{
	constructor(options: NodeFormatterOptions = {})
	{
		super({
			name: 'disk',
			convert({ node, formatter, data }: ConvertCallbackOptions): HTMLElement {
				const fileId: string = node.getAttribute('id');
				const fileEntry: ?{ [key: string]: any } = data.files.find((fileOptions) => {
					return String(fileOptions.id) === String(fileId);
				});

				if (Type.isPlainObject(fileEntry))
				{
					const fileOptions: ?{ [key: string]: any } = fileEntry?.data?.file;
					if (Type.isPlainObject(fileOptions))
					{
						if (fileOptions.type.startsWith('image'))
						{
							return Dom.create({
								tag: 'div',
								attrs: {
									className: 'ui-formatter-image',
								},
								children: [
									Dom.create({
										tag: 'img',
										attrs: {
											src: formatter.makeSafeHref(fileOptions.downloadUrl),
										},
									}),
								],
							});
						}

						if (fileOptions.type.startsWith('video'))
						{
							return Dom.create({
								tag: 'div',
								attrs: {
									className: 'ui-formatter-video',
								},
								children: [
									Dom.create({
										tag: 'video',
										attrs: {
											src: formatter.makeSafeHref(fileOptions.downloadUrl),
											controls: true,
										},
									}),
								],
							});
						}

						return Dom.create({
							tag: 'a',
							attrs: {
								href: formatter.makeSafeHref(fileOptions.downloadUrl),
							},
							text: fileOptions.name,
						});
					}
				}

				return null;
			},
			...options,
		});
	}
}
