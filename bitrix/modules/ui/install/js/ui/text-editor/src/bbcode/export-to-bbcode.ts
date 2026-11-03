/* eslint-disable @bitrix24/bitrix24-rules/no-native-dom-methods */

import { Type } from 'main.core';
import {
	type BBCodeScheme,
	type BBCodeRootNode,
	type BBCodeFragmentNode,
	type BBCodeTextNode,
	type BBCodeNode,
	type BBCodeContentNode,
	type BBCodeNodeOptions,
} from 'ui.bbcode.model';

import { TextEditor } from 'ui.text-editor';

import {
	$isElementNode,
	$isTextNode,
	$isLineBreakNode,
	$isTabNode,
	type LexicalNode,
	ElementNode,
} from 'ui.lexical.core';

import { trimEmptyParagraphs } from './trim-empty-paragraphs';

import {
	type BBCodeExportOutput,
	type BBCodeExportMap,
	type BBCodeExportFn,
	type BBCodeExportNodeFn,
	type BBCodeExportFormatFn,
} from './types';

export function $exportToBBCode(lexicalNode: LexicalNode | ElementNode, editor: TextEditor): BBCodeRootNode
{
	const scheme: BBCodeScheme = editor.getBBCodeScheme();
	const root: BBCodeRootNode = scheme.createRoot();
	const topLevelChildren = trimEmptyParagraphs((lexicalNode as ElementNode).getChildren());

	for (const topLevelNode of topLevelChildren)
	{
		$appendNodesToBBCode(topLevelNode, root, editor);
	}

	return root;
}

function $appendNodesToBBCode(
	currentNode: LexicalNode | ElementNode,
	parentNode: BBCodeRootNode | BBCodeFragmentNode,
	editor: TextEditor,
): void
{
	const { node, after }: BBCodeExportOutput = getExportFunction(currentNode, editor);
	if (!node)
	{
		return;
	}

	const scheme: BBCodeScheme = editor.getBBCodeScheme();
	const fragment: BBCodeFragmentNode = scheme.createFragment();
	const children = $isElementNode(currentNode) ? currentNode.getChildren() : [];
	for (const childNode of children)
	{
		$appendNodesToBBCode(childNode, fragment, editor);
	}

	node.appendChild(fragment);
	parentNode.appendChild(node as BBCodeContentNode);

	if (Type.isFunction(after))
	{
		const newElement = after.call(currentNode, node);
		if (newElement)
		{
			node.getParent()!.replaceChild(node as BBCodeContentNode, newElement as BBCodeContentNode);
		}
	}
}

const formats = ['bold', 'italic', 'strikethrough', 'underline'];

function getExportFunction(lexicalNode: LexicalNode, editor: TextEditor): BBCodeExportOutput
{
	const type = lexicalNode.getType();
	const exportMap: BBCodeExportMap = editor.getBBCodeExportMap();
	const exportFn: BBCodeExportFn | undefined = exportMap.get(type);
	if (Type.isFunction(exportFn))
	{
		return (exportFn as BBCodeExportNodeFn)(lexicalNode) as BBCodeExportOutput;
	}

	const scheme: BBCodeScheme = editor.getBBCodeScheme();
	if ($isTextNode(lexicalNode) && lexicalNode.getType() === 'text')
	{
		const node: BBCodeTextNode = scheme.createText({
			encode: false,
			content: lexicalNode.getTextContent(),
		} as BBCodeNodeOptions & { content?: string, encode?: boolean });

		if (lexicalNode.getFormat() === 0)
		{
			return { node: node as unknown as BBCodeNode };
		}

		let currentNode: BBCodeNode = node as unknown as BBCodeNode;
		formats.forEach((format: string): void => {
			const formatFn: BBCodeExportFn | undefined = exportMap.get(`text:${format}`);
			if (Type.isFunction(formatFn))
			{
				currentNode = (formatFn as BBCodeExportFormatFn)(lexicalNode, currentNode) || currentNode;
			}
		});

		return {
			node: currentNode,
		};
	}

	if ($isLineBreakNode(lexicalNode))
	{
		return {
			node: scheme.createNewLine() as unknown as BBCodeNode,
		};
	}

	if ($isTabNode(lexicalNode))
	{
		return {
			node: scheme.createTab() as unknown as BBCodeNode,
		};
	}

	if ($isTextNode(lexicalNode) || $isElementNode(lexicalNode))
	{
		const node: BBCodeTextNode = scheme.createText({
			encode: false,
			content: lexicalNode.getTextContent(),
		} as BBCodeNodeOptions & { content?: string, encode?: boolean });

		return { node: node as unknown as BBCodeNode };
	}

	return { node: null };
}
