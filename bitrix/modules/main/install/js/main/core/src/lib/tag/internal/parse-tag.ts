import Type from '../../type';
import isVoidElement from './is-void-element';
import matchers from './matchers';

type TagResult = {
	type: 'tag' | 'comment';
	name?: string;
	svg?: boolean;
	attrs?: { [key: string]: any };
	children?: Array<TagResult>;
	voidElement?: boolean;
	content?: string;
};

export default function parseTag(tag: string): TagResult
{
	const tagResult: TagResult = {
		type: 'tag',
		name: '',
		svg: false,
		attrs: {},
		children: [],
		voidElement: false,
	};

	if (tag.startsWith('<!--'))
	{
		const endIndex = tag.indexOf('-->');
		const openTagLength = '<!--'.length;

		return {
			type: 'comment',
			content: endIndex === -1 ? '' : tag.slice(openTagLength, endIndex),
		};
	}

	const tagNameMatch = tag.match(matchers.tagName);
	if (Type.isArrayFilled(tagNameMatch))
	{
		const [, tagName] = tagNameMatch;
		tagResult.name = tagName;
		tagResult.svg = tagName === 'svg';
		tagResult.voidElement = isVoidElement(tagName) || tag.trim().endsWith('/>');
	}

	const reg = new RegExp(matchers.attributes);
	for (;;)
	{
		const result = reg.exec(tag);
		if (Type.isNil(result))
		{
			break;
		}

		// Attributes with double quotes
		const [, doubleQuoteName, doubleQuoteValue] = result;
		if (Type.isNil(doubleQuoteName))
		{
			// Attributes with single quotes
			const singleQuoteName = result[3];
			const singleQuoteValue = result[4];
			if (Type.isNil(singleQuoteName))
			{
				// Attributes without value
				const booleanAttrName = result[5];
				tagResult.attrs![booleanAttrName] = '';
			}
			else
			{
				tagResult.attrs![singleQuoteName] = Type.isStringFilled(singleQuoteValue)
					? singleQuoteValue
					: '';
			}
		}
		else
		{
			tagResult.attrs![doubleQuoteName] = Type.isStringFilled(doubleQuoteValue)
				? doubleQuoteValue
				: '';
		}
	}

	return tagResult;
}
