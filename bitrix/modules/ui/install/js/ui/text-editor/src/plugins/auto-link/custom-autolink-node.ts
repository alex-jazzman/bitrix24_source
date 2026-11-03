import { $applyNodeReplacement, type EditorConfig } from 'ui.lexical.core';
import { AutoLinkNode, type AutoLinkAttributes } from 'ui.lexical.link';

import { SLIDER_IGNORE_AUTOBINDING_ATTRIBUTE } from '../../constants';

export class CustomAutoLinkNode extends AutoLinkNode
{
	$config()
	{
		return this.config('custom-autolink', { extends: AutoLinkNode });
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

export function $createCustomAutoLinkNode(url: string = '', attributes: AutoLinkAttributes = {}): CustomAutoLinkNode
{
	return $applyNodeReplacement(new CustomAutoLinkNode(url, attributes));
}
