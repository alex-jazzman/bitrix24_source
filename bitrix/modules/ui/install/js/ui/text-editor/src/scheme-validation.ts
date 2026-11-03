/* eslint-disable @bitrix24/bitrix24-rules/no-native-dom-methods */

import { Type } from 'main.core';
import {
	$createParagraphNode,
	$isElementNode,
	$isRootNode,
	$isTextNode,
	type ElementNode,
	type LexicalNode,
} from 'ui.lexical.core';

import { type TextEditor } from './text-editor';
import { type SchemeNodeValidation, type SchemeValidationOptions } from './types/scheme-validation-options';

type NodeValidationEntry = {
	validate?: SchemeNodeValidation['validate'];
};

function isInlineNode(node: LexicalNode | ElementNode): boolean
{
	return $isTextNode(node) || ($isElementNode(node) && node.isInline());
}

export class SchemeValidation
{
	#editor: TextEditor | null = null;
	#nodeTypeToBBCodeType: Map<string, string> = new Map();
	#nodeValidation: Map<string, NodeValidationEntry> = new Map();

	constructor(editor: TextEditor)
	{
		this.#editor = editor;

		this.#initNodeValidation();
	}

	isNodeAllowed(parent: LexicalNode | string, child: LexicalNode | string): boolean
	{
		const parentCode = Type.isString(parent) ? parent : this.#nodeTypeToBBCodeType.get(parent.getType());
		const childCode = Type.isString(child) ? child : this.#nodeTypeToBBCodeType.get(child.getType());

		if (parentCode === undefined)
		{
			// eslint-disable-next-line no-console
			console.warn(`TextEditor: parent node (${(parent as LexicalNode).getType()}) doesn't have a bbcode tag.`);
		}

		if (childCode === undefined)
		{
			// eslint-disable-next-line no-console
			console.warn(`TextEditor: child node (${(child as LexicalNode).getType()}) doesn't have a bbcode tag.`);
		}

		if (parentCode === undefined || childCode === undefined)
		{
			return false;
		}

		return this.#editor!.getBBCodeScheme().isChildAllowed(parentCode, childCode);
	}

	findAllowedParent(node: LexicalNode): ElementNode | null
	{
		let parent: ElementNode | null = node.getParent();
		while (parent !== null)
		{
			if (this.isNodeAllowed(parent, node))
			{
				return parent;
			}

			parent = parent.getParent();
		}

		return null;
	}

	#initNodeValidation(): void
	{
		const declarations: Array<[string, SchemeNodeValidation[]]> = [];

		for (const [pluginName, plugin] of this.#editor!.getPlugins())
		{
			const validation: SchemeValidationOptions | null = plugin.validateScheme();
			if (!Type.isPlainObject(validation))
			{
				continue;
			}

			if (Type.isPlainObject(validation.bbcodeMap))
			{
				for (const [nodeType, bbcodeTag] of Object.entries(validation.bbcodeMap!))
				{
					this.#nodeTypeToBBCodeType.set(nodeType, bbcodeTag);
				}
			}

			if (Type.isArrayFilled(validation.nodes))
			{
				declarations.push([pluginName, validation.nodes!]);
			}
		}

		this.#assertTransformNodesAreMapped(declarations);

		const handleNodeTransform = this.#handleNodeTransform.bind(this);
		const validatorOwners: Map<string, string> = new Map();

		for (const [pluginName, nodes] of declarations)
		{
			nodes.forEach((nodeValidation: SchemeNodeValidation) => {
				const nodeClass = nodeValidation.nodeClass as typeof LexicalNode;
				this.#editor!.registerNodeTransform(nodeClass, handleNodeTransform);
				if (!Type.isFunction(nodeValidation.validate))
				{
					return;
				}

				const nodeType: string = nodeClass.getType();
				const owner: string | undefined = validatorOwners.get(nodeType);
				if (owner !== undefined)
				{
					// eslint-disable-next-line no-console
					console.warn(
						`TextEditor: plugins "${owner}" and "${pluginName}" both declare a validator `
						+ `for node type "${nodeType}", "${pluginName}" wins.`,
					);
				}

				validatorOwners.set(nodeType, pluginName);
				this.#nodeValidation.set(nodeType, { validate: nodeValidation.validate });
			});
		}
	}

	/**
	 * A node type missing from the bbcodeMap cannot be judged: isNodeAllowed hands the scheme an
	 * undefined tag, the scheme answers no, and the repair path drops the node with its text.
	 * A transform is registered only for a node the plugin itself declares, so the mapping for it
	 * is owed by the same declaration and its absence is a bug in the plugin, not a runtime state.
	 */
	#assertTransformNodesAreMapped(declarations: Array<[string, SchemeNodeValidation[]]>): void
	{
		const unmapped: string[] = [];
		for (const [pluginName, nodes] of declarations)
		{
			for (const nodeValidation of nodes)
			{
				const nodeType: string = (nodeValidation.nodeClass as typeof LexicalNode).getType();
				if (!this.#nodeTypeToBBCodeType.has(nodeType))
				{
					unmapped.push(`"${nodeType}" (plugin "${pluginName}")`);
				}
			}
		}

		if (unmapped.length > 0)
		{
			throw new TypeError(
				`TextEditor: node types validated against the bbcode scheme without a bbcodeMap entry: ${unmapped.join(', ')}.`,
			);
		}
	}

	#handleNodeTransform(node: LexicalNode | ElementNode): void
	{
		const { validate = null } = this.#nodeValidation.get(node.getType()) || ({} as NodeValidationEntry);
		if (validate !== null && validate(node, this) === true)
		{
			return;
		}

		const parent: ElementNode = node.getParent()!;
		if (this.isNodeAllowed(parent, node))
		{
			return;
		}

		// eslint-disable-next-line no-console
		console.warn(`TextEditor: ${node.getType()} is not allowed in ${parent.getType()}`);

		this.moveToNextParent(node);
	}

	moveToNextParent(node: LexicalNode | ElementNode, removeOnFail: boolean = true): boolean
	{
		let parent: ElementNode = node.getParent()!;
		let targetNode: ElementNode | null = null;
		while (parent.getParent() !== null)
		{
			if (this.isNodeAllowed(parent.getParent()!, node))
			{
				targetNode = parent;

				break;
			}

			parent = parent.getParent()!;
		}

		if (targetNode === null)
		{
			// the loop finds nothing when the node already sits under the root: there is no
			// ancestor to move it next to. An inline node still has the same home as one bumped
			// up from a level deeper -- a paragraph -- and removing it would take its text along
			if ($isRootNode(node.getParent()) && isInlineNode(node))
			{
				const paragraph = $createParagraphNode();
				node.replace(paragraph);
				paragraph.append(node);

				return true;
			}

			if (removeOnFail)
			{
				node.remove();
			}

			return false;
		}

		if ($isRootNode(targetNode.getParent()) && isInlineNode(node))
		{
			targetNode.insertBefore($createParagraphNode().append(node));

			return true;
		}

		targetNode.insertBefore(node);

		return true;
	}
}
