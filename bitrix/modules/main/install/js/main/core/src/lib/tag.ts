import Type from './type';
import Dom from './dom';
import Loc from './loc';
import Text from './text';
import render from './tag/render';

function parseProps(...args: any[]): { [key: string]: any }
{
	const [sections, ...substitutions] = args;

	return substitutions
		.reduce((acc: string, item: any, index: number) => {
			const nextSectionIndex = index + 1;

			if (!Type.isPlainObject(item) && !Type.isArray(item))
			{
				return acc + item + sections[nextSectionIndex];
			}

			return `${acc}__s${index}${sections[nextSectionIndex]}`;
		}, sections[0])
		.replaceAll(/[\t\r]/gm, '')
		.split(';\n')
		.map((item: any) => item.replace(/\n/, ''))
		.reduce((acc: Record<string, any>, item: any) => {
			if (item !== '')
			{
				const matches = item.match(/^[\w-. ]+:/);
				const splitted = item.split(/^[\w-. ]+:/);
				const key = matches![0].replace(':', '').trim();
				const value = splitted[1].trim();
				const substitutionPlaceholderExp = /^__s\d+/;

				if (substitutionPlaceholderExp.test(value))
				{
					acc[key] = substitutions[value.replace('__s', '') as any];

					return acc;
				}

				acc[key] = value;
			}

			return acc;
		}, {});
}

/**
 * @memberOf BX
 */
export default class Tag
{
	/**
	 * Encodes all substitutions
	 */
	static safe(sections: TemplateStringsArray, ...substitutions: string[])
	{
		return substitutions.reduce((acc, item, index) => acc + Text.encode(item) + sections[index + 1], sections[0]);
	}

	/**
	 * Decodes all substitutions
	 * @param sections
	 * @param substitutions
	 * @return {string}
	 */
	static unsafe(sections: any, ...substitutions: any[])
	{
		return substitutions.reduce((acc, item, index) => acc + Text.decode(item) + sections[index + 1], sections[0]);
	}

	/**
	 * Adds styles to specified element
	 * @param {HTMLElement} element
	 * @return {Function}
	 */
	static style(element: HTMLElement): Function
	{
		if (!Type.isDomNode(element))
		{
			throw new Error('element is not HTMLElement');
		}

		return function styleTagHandler(...args: any[])
		{
			Dom.style(element, parseProps(...args));
		};
	}

	/**
	 * Replace all messages identifiers to real messages
	 */
	static message(sections: TemplateStringsArray, ...substitutions: string[]): string
	{
		return substitutions.reduce((acc, item, index) => acc + Loc.getMessage(item) + sections[index + 1], sections[0]);
	}

	static render = render;

	/**
	 * Adds attributes to specified element
	 */
	static attrs(element: HTMLElement)
	{
		if (!Type.isDomNode(element))
		{
			throw new Error('element is not HTMLElement');
		}

		return function attrsTagHandler(...args: any[]): void
		{
			Dom.attr(element, parseProps(...args));
		};
	}

	static attr = Tag.attrs;
}
