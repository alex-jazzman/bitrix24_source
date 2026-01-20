import { Dom, Text } from 'main.core';

import { getUtils, getConst } from '../utils/core-proxy';

const { DataAttribute } = getConst();

export const ParserUrl = {

	decode(text, config = {}): string
	{
		const {
			urlTarget = '_blank',
			removeLinks = false,
		} = config;

		// base pattern for urls
		text = text.replace(/\[url(?:=([^[\]]+))?](.*?)\[\/url]/gis, (whole, link, text) =>
		{
			const url = Text.decode(link || text);
			if (!getUtils().text.checkUrl(url))
			{
				return text;
			}

			return this.getLinkHtml(url, urlTarget, text);
		});

		// url like https://bitrix24.com/?params[1]="test"
		text = text.replace(/\[url(?:=(.+?[^[\]]))?](.*?)\[\/url]/gis, (whole, link, text) =>
		{
			let url = Text.decode(link || text);
			if (!getUtils().text.checkUrl(url))
			{
				return text;
			}

			if (!url.slice(url.lastIndexOf('[')).includes(']'))
			{
				if (text.startsWith(']'))
				{
					url = `${url}]`;
					text = text.slice(1);
				}
				else if (text.startsWith('='))
				{
					const urlPart = Text.decode(text.slice(1, text.lastIndexOf(']')));
					url = `${url}]=${urlPart}`;
					text = text.slice(text.lastIndexOf(']')+1);
				}
			}

			return this.getLinkHtml(url, urlTarget, text);
		});

		if (removeLinks)
		{
			text = text.replace(/<a.*?href="([^"]*)".*?>(.*?)<\/a>/gi, '$2');
		}

		return text;
	},

	purify(text): string
	{
		text = text.replace(/\[url(?:=([^\[\]]+))?](.*?)\[\/url]/gis, (whole, link, text) => {
			return text? text: link;
		});

		text = text.replace(/\[url(?:=(.+))?](.*?)\[\/url]/gis, (whole, link, text) => {
			return text? text: link;
		});

		return text;
	},

	removeSimpleUrlTag(text): string
	{
		text = text.replace(/\[url](.*?)\[\/url]/gis, (whole, link) => link);
		return text;
	},

	getLinkHtml(url: string, urlTarget: string, text: string): string
	{
		return Dom.create({
			tag: 'a',
			attrs: {
				href: url,
				target: urlTarget,
				[DataAttribute.useNativeContextMenu]: true,
			},
			html: text,
		}).outerHTML;
	},
};
