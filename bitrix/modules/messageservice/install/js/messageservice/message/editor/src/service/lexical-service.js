import {
	$createLineBreakNode,
	$createParagraphNode,
	$createTextNode,
	$isLineBreakNode,
	$isParagraphNode,
	type LexicalNode,
	type RootNode,
} from 'ui.lexical.core';

import { $createPlaceholderNode, $isPlaceholderNode } from '../integration/text-editor/placeholder/placeholder-node';
import { placeholderService, type PlaceholderService } from './placeholder-service';

export class LexicalService
{
	#placeholderService: PlaceholderService;

	constructor(service: PlaceholderService)
	{
		this.#placeholderService = service;
	}

	$importToInlineNodes(text: string): Array<LexicalNode>
	{
		const tokens = this.#placeholderService.scan(text);
		const nodes = [];
		for (const token of tokens)
		{
			switch (token.type)
			{
				case 'text':
					nodes.push($createTextNode(token.content));
					break;

				case 'linebreak':
					nodes.push($createLineBreakNode());
					break;

				case 'placeholder':
				{
					const { code = '', removable, copyable, ...customData } = token.attrs;
					nodes.push($createPlaceholderNode({
						code,
						caption: token.caption,
						removable,
						copyable,
						customData,
					}));
					break;
				}

				// no default
			}
		}

		return nodes;
	}

	$importToLexicalNodes(text: string): Array<LexicalNode>
	{
		const inline = this.$importToInlineNodes(text);
		const paragraph = $createParagraphNode();
		paragraph.append(...inline);

		return [paragraph];
	}

	$exportFromLexical(root: RootNode): string
	{
		return root.getChildren()
			.map((paragraph) => this.#serializeParagraph(paragraph))
			.join('\n');
	}

	#serializeParagraph(paragraph): string
	{
		if (!$isParagraphNode(paragraph))
		{
			// LINE_BREAK mode with the current plugin set should never produce
			// non-paragraph root children. Fall back to getTextContent() if it
			// happens, so we at least keep the text instead of silently dropping.
			return paragraph.getTextContent?.() ?? '';
		}

		return paragraph.getChildren().map((node) => {
			if ($isLineBreakNode(node))
			{
				return '\n';
			}

			if ($isPlaceholderNode(node))
			{
				const attrs = {
					...(node.isRemovable() ? {} : { removable: 'false' }),
					...(node.isCopyable() ? {} : { copyable: 'false' }),
					...node.getCustomData(),
				};

				return this.#placeholderService.serializePlaceholder(node.getCode(), node.getCaption(), attrs);
			}

			return node.getTextContent();
		}).join('');
	}
}

export const lexicalService = new LexicalService(placeholderService);
