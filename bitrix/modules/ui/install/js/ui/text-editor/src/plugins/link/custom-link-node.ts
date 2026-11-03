import { $applyNodeReplacement, type EditorConfig } from 'ui.lexical.core';
import { LinkNode, type LinkAttributes } from 'ui.lexical.link';

import { SLIDER_IGNORE_AUTOBINDING_ATTRIBUTE } from '../../constants';

export class CustomLinkNode extends LinkNode
{
	$config()
	{
		return this.config('custom-link', { extends: LinkNode });
	}

	/** the toolbar knows this node by the name of its button, not by its own type */
	getToolbarBlockType(): string
	{
		return 'link';
	}

	createDOM(config: EditorConfig): HTMLElement
	{
		const element = super.createDOM(config);

		element.setAttribute(SLIDER_IGNORE_AUTOBINDING_ATTRIBUTE, 'true');

		return element;
	}
}

export function $createCustomLinkNode(url: string = '', attributes: LinkAttributes = {}): CustomLinkNode
{
	return $applyNodeReplacement(new CustomLinkNode(url, attributes));
}
