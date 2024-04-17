import { Type } from 'main.core';
import type { BBCodeContentNode } from '../../nodes/node';
import { typeof BBCodeScheme } from '../bbcode-scheme';

export type BBCodeNodeConverter = (node: BBCodeContentNode, scheme: BBCodeScheme) => BBCodeContentNode | Array<BBCodeContentNode> | null;
export type BBCodeNodeStringifier = (node: BBCodeContentNode, scheme: BBCodeScheme) => string;
export type BBCodeNodeSerializer = (node: BBCodeContentNode, scheme: BBCodeScheme) => any;
export type BBCodeNodeName = string;

export type BBCodeNodeSchemeOptions = {
	name: string | Array<BBCodeNodeName>,
	convert?: BBCodeNodeConverter,
	stringify?: BBCodeNodeStringifier,
	serialize?: BBCodeNodeSerializer,
};

export class BBCodeNodeScheme
{
	name: Array<BBCodeNodeName> = [];
	converter: BBCodeNodeConverter | null = null;
	stringifier: BBCodeNodeStringifier | null = null;
	serializer: BBCodeNodeSerializer | null = null;

	constructor(options: BBCodeNodeSchemeOptions)
	{
		if (!Type.isPlainObject(options))
		{
			throw new TypeError('options is not a object');
		}

		if (
			!Type.isArrayFilled(this.name)
			&& !Type.isArrayFilled(options.name)
			&& !Type.isStringFilled(options.name)
		)
		{
			throw new TypeError('options.name is not specified');
		}

		this.setName(options.name);
		this.setConverter(options.convert);
		this.setStringifier(options.stringify);
		this.setSerializer(options.serialize);
	}

	setName(name: BBCodeNodeSchemeOptions['name'])
	{
		if (Type.isStringFilled(name))
		{
			this.name = [name];
		}

		if (Type.isArrayFilled(name))
		{
			this.name = name;
		}
	}

	getName(): Array<string>
	{
		return [...this.name];
	}

	removeName(...names: Array<BBCodeNodeName>)
	{
		this.setName(
			this.getName().filter((name: BBCodeNodeName) => {
				return !names.includes(name);
			}),
		);
	}

	setConverter(converter: BBCodeNodeConverter | null)
	{
		if (Type.isFunction(converter) || Type.isNull(converter))
		{
			this.converter = converter;
		}
	}

	getConverter(): BBCodeNodeConverter | null
	{
		return this.converter;
	}

	setStringifier(stringifier: BBCodeNodeStringifier | null)
	{
		if (Type.isFunction(stringifier) || Type.isNull(stringifier))
		{
			this.stringifier = stringifier;
		}
	}

	getStringifier(): BBCodeNodeStringifier | null
	{
		return this.stringifier;
	}

	setSerializer(serializer: BBCodeNodeSerializer | null)
	{
		if (Type.isFunction(serializer) || Type.isNull(serializer))
		{
			this.serializer = serializer;
		}
	}

	getSerializer(): BBCodeNodeSerializer | null
	{
		return this.serializer;
	}
}
