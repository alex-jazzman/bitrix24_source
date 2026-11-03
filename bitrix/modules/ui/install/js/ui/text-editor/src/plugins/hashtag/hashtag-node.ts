import { Dom, Type } from 'main.core';

import {
	TextNode,
	$applyNodeReplacement,
	type EditorConfig,
	type LexicalNode,
} from 'ui.lexical.core';

export class HashtagNode extends TextNode
{
	$config()
	{
		return this.config('hashtag', { extends: TextNode });
	}

	createDOM(config: EditorConfig): HTMLElement
	{
		const element = super.createDOM(config);
		if (Type.isStringFilled(config?.theme?.hashtag))
		{
			Dom.addClass(element, config.theme.hashtag);
		}

		return element;
	}

	canInsertTextBefore(): boolean
	{
		return false;
	}

	isTextEntity(): true
	{
		return true;
	}
}

export function $createHashtagNode(text = ''): HashtagNode
{
	return $applyNodeReplacement(new HashtagNode(text));
}

export function $isHashtagNode(node: LexicalNode | null | undefined): boolean
{
	return node instanceof HashtagNode;
}
