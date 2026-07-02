import Type from '../../type';
import Dom from '../../dom';
import Text from '../../text';
import Event from '../../event';
import matchers from './matchers';

type RenderNodeOptions = {
	node: any;
	parentElement?: HTMLElement;
	substitutions: Array<any>;
	refs: Array<any>;
};

const appendElement = (current: any, target: any) => {
	if (Type.isDomNode(current) && Type.isDomNode(target))
	{
		if (target.nodeName === 'TEMPLATE')
		{
			(target as HTMLTemplateElement).content.append(current);
		}
		else
		{
			Dom.append(current as HTMLElement, target as HTMLElement);
		}
	}
};

export default function renderNode(options: RenderNodeOptions): any
{
	const { node, parentElement, substitutions, refs = [] } = options;

	if (node.type === 'tag')
	{
		const element = (() => {
			if (node.svg)
			{
				return document.createElementNS('http://www.w3.org/2000/svg', node.name);
			}

			return document.createElement(node.name);
		})();

		if (Object.hasOwn(node.attrs, 'ref'))
		{
			refs.push([node.attrs.ref, element]);
			delete node.attrs.ref;
		}

		Object.entries(node.attrs).forEach(([key, value]: [string, any]) => {
			if (key.startsWith('on') && new RegExp(`^${matchers.placeholder.source}$`).test(String(value).trim()))
			{
				const substitution = substitutions[parseInt(String(value).trim().replace('{{uid', ''), 10) - 1];
				if (Type.isFunction(substitution))
				{
					const bindFunctionName = key.endsWith('once') ? 'bindOnce' : 'bind';
					Event[bindFunctionName](element, key.replaceAll(/^on|once$/g, ''), substitution);
				}
				else
				{
					element.setAttribute(key, substitution);
				}
			}
			else if (new RegExp(matchers.placeholder).test(value))
			{
				const preparedValue = value.split(/{{|}}/).reduce((acc: string, item: string) => {
					if (item.startsWith('uid'))
					{
						const substitution = substitutions[parseInt(item.replace('uid', ''), 10) - 1];

						return `${acc}${Text.decode(String(substitution))}`;
					}

					return `${acc}${Text.decode(item)}`;
				}, '');

				element.setAttribute(key, preparedValue);
			}
			else
			{
				element.setAttribute(key, Text.decode(value));
			}
		});

		node.children.forEach((childNode: any) => {
			const result = renderNode({
				node: childNode,
				parentElement: element,
				substitutions,
				refs,
			});

			if (Type.isArray(result))
			{
				result.forEach((subChildElement) => {
					appendElement(subChildElement, element);
				});
			}
			else
			{
				appendElement(result, element);
			}
		});

		return element;
	}

	if (node.type === 'comment')
	{
		return document.createComment(node.content);
	}

	if (node.type === 'text')
	{
		if (parentElement)
		{
			if (parentElement.nodeName === 'TEMPLATE')
			{
				(parentElement as any).content.append(node.content);
			}
			else
			{
				parentElement.insertAdjacentHTML('beforeend', node.content);
			}

			return undefined;
		}

		return document.createTextNode(node.content);
	}

	if (node.type === 'placeholder')
	{
		return substitutions[node.uid - 1];
	}

	return undefined;
}
