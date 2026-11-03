import {
	TextNode,
	$applyNodeReplacement,
	type EditorConfig,
	type LexicalNode,
} from 'ui.lexical.core';

export class SpoilerTitleTextNode extends TextNode
{
	$config()
	{
		return this.config('spoiler-title-text', { extends: TextNode });
	}

	createDOM(config: EditorConfig): HTMLElement
	{
		return super.createDOM(config);
	}
}

export function $createSpoilerTitleTextNode(text = ''): SpoilerTitleTextNode
{
	return $applyNodeReplacement(new SpoilerTitleTextNode(text));
}

export function $isSpoilerTitleTextNode(node: LexicalNode | null | undefined): boolean
{
	return node instanceof SpoilerTitleTextNode;
}
