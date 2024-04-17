import { Type } from 'main.core';
import { BBCodeTagScheme } from './node-schemes/tag-scheme';
import { BBCodeNode, type BBCodeNodeOptions } from '../nodes/node';
import { BBCodeRootNode, type RootNodeOptions } from '../nodes/root-node';
import { BBCodeFragmentNode, type FragmentNodeOptions } from '../nodes/fragment-node';
import { BBCodeElementNode, type BBCodeElementNodeOptions } from '../nodes/element-node';
import { BBCodeTextNode, type BBCodeTextNodeOptions } from '../nodes/text-node';
import { BBCodeNewLineNode } from '../nodes/new-line-node';
import { BBCodeTabNode } from '../nodes/tab-node';
import { BBCodeNodeScheme } from './node-schemes/node-scheme';

export type OutputTagCases = $Values<BBCodeScheme.Case>;

export type BBCodeSchemeOptions = {
	tagSchemes: Array<BBCodeTagScheme>,
	outputTagCase?: OutputTagCases,
	unresolvedNodesHoisting?: boolean,
};

export class BBCodeScheme
{
	static Case: {[key: string]: string} = {
		LOWER: 'lower',
		UPPER: 'upper',
	};

	tagSchemes: Array<BBCodeTagScheme> = [];
	outputTagCase: OutputTagCases = BBCodeScheme.Case.LOWER;
	unresolvedNodesHoisting: boolean = true;

	static isNodeScheme(value: any): boolean
	{
		return value instanceof BBCodeNodeScheme;
	}

	constructor(options: BBCodeSchemeOptions = {})
	{
		if (!Type.isPlainObject(options))
		{
			throw new TypeError('options is not a object');
		}

		this.setTagSchemes(options.tagSchemes);
		this.setOutputTagCase(options.outputTagCase);
		this.setUnresolvedNodesHoisting(options.unresolvedNodesHoisting);
	}

	setTagSchemes(tagSchemes: Array<BBCodeTagScheme>)
	{
		if (Type.isArray(tagSchemes))
		{
			const invalidSchemeIndex: number = tagSchemes.findIndex((scheme: BBCodeTagScheme): boolean => {
				return !BBCodeScheme.isNodeScheme(scheme);
			});

			if (invalidSchemeIndex > -1)
			{
				throw new TypeError(`tagScheme #${invalidSchemeIndex} is not TagScheme instance`);
			}

			this.tagSchemes = [...tagSchemes];
		}
	}

	setTagScheme(...tagSchemes: Array<BBCodeTagScheme>)
	{
		const invalidSchemeIndex: number = tagSchemes.findIndex((scheme: BBCodeTagScheme): boolean => {
			return !BBCodeScheme.isNodeScheme(scheme);
		});

		if (invalidSchemeIndex > -1)
		{
			throw new TypeError(`tagScheme #${invalidSchemeIndex} is not TagScheme instance`);
		}

		const newTagSchemesNames: Array<string> = tagSchemes.flatMap((scheme: BBCodeTagScheme) => {
			return scheme.getName();
		});

		const currentTagSchemes: Array<BBCodeTagScheme> = this.getTagSchemes();
		currentTagSchemes.forEach((scheme: BBCodeTagScheme) => {
			scheme.removeName(...newTagSchemesNames);
		});

		const filteredCurrentTagSchemes: Array<BBCodeTagScheme> = currentTagSchemes.filter((scheme: BBCodeTagScheme) => {
			return Type.isArrayFilled(scheme.getName());
		});

		this.setTagSchemes([
			...filteredCurrentTagSchemes,
			...tagSchemes,
		]);
	}

	getTagSchemes(): Array<BBCodeTagScheme>
	{
		return [...this.tagSchemes];
	}

	getTagScheme(tagName: string): BBCodeTagScheme
	{
		return this.getTagSchemes().find((scheme: BBCodeTagScheme): boolean => {
			return scheme.getName().includes(String(tagName).toLowerCase());
		});
	}

	setOutputTagCase(tagCase: $Values<BBCodeScheme.Case>)
	{
		if (!Type.isNil(tagCase))
		{
			const allowedCases = Object.values(BBCodeScheme.Case);
			if (allowedCases.includes(tagCase))
			{
				this.outputTagCase = tagCase;
			}
			else
			{
				throw new TypeError(`'${tagCase}' is not allowed`);
			}
		}
	}

	getOutputTagCase(): $Values<BBCodeScheme.Case>
	{
		return this.outputTagCase;
	}

	setUnresolvedNodesHoisting(value: boolean)
	{
		if (!Type.isNil(value))
		{
			if (Type.isBoolean(value))
			{
				this.unresolvedNodesHoisting = value;
			}
			else
			{
				throw new TypeError(`'${value}' is not allowed value`);
			}
		}
	}

	isAllowedUnresolvedNodesHoisting(): boolean
	{
		return this.unresolvedNodesHoisting;
	}

	getAllowedTags(): Array<string>
	{
		return this.getTagSchemes().flatMap((tagScheme: BBCodeTagScheme) => {
			return tagScheme.getName();
		});
	}

	isAllowedTag(tagName: string): boolean
	{
		const allowedTags: Array<string> = this.getAllowedTags();

		return allowedTags.includes(String(tagName).toLowerCase());
	}

	createRoot(options: RootNodeOptions = {}): BBCodeRootNode
	{
		return new BBCodeRootNode({
			...options,
			scheme: this,
		});
	}

	createNode(options: BBCodeNodeOptions): BBCodeNode
	{
		if (!Type.isPlainObject(options))
		{
			throw new TypeError('options is not a object');
		}

		if (!Type.isStringFilled(options.name))
		{
			throw new TypeError('options.name is required');
		}

		if (!this.isAllowedTag(options.name))
		{
			throw new TypeError(`Scheme for "${options.name}" tag is not specified.`);
		}

		return new BBCodeNode({
			...options,
			scheme: this,
		});
	}

	createElement(options: BBCodeElementNodeOptions = {}): BBCodeElementNode
	{
		if (!Type.isPlainObject(options))
		{
			throw new TypeError('options is not a object');
		}

		if (!Type.isStringFilled(options.name))
		{
			throw new TypeError('options.name is required');
		}

		if (!this.isAllowedTag(options.name))
		{
			throw new TypeError(`Scheme for "${options.name}" tag is not specified.`);
		}

		return new BBCodeElementNode({
			...options,
			scheme: this,
		});
	}

	createText(options: BBCodeTextNodeOptions = {}): BBCodeTextNode
	{
		const preparedOptions = Type.isPlainObject(options) ? options : { content: options };

		return new BBCodeTextNode({
			...preparedOptions,
			scheme: this,
		});
	}

	createNewLine(options: BBCodeTextNodeOptions = {}): BBCodeNewLineNode
	{
		const preparedOptions = Type.isPlainObject(options) ? options : { content: options };

		return new BBCodeNewLineNode({
			...preparedOptions,
			scheme: this,
		});
	}

	createTab(options: BBCodeTextNodeOptions = {}): BBCodeTabNode
	{
		const preparedOptions = Type.isPlainObject(options) ? options : { content: options };

		return new BBCodeTabNode({
			...preparedOptions,
			scheme: this,
		});
	}

	createFragment(options: FragmentNodeOptions = {}): BBCodeFragmentNode
	{
		return new BBCodeFragmentNode({
			...options,
			scheme: this,
		});
	}
}
