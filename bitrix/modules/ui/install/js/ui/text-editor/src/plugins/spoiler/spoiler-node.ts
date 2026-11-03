/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */
import { Dom, Type, Loc, Event } from 'main.core';
import {
	ElementNode,
	$isElementNode,
	$isDecoratorNode,
	$createParagraphNode,
	type EditorConfig,
	type LexicalNode,
	type DOMConversionMap,
	type DOMConversionOutput,
	type DOMExportOutput,
	type LexicalUpdateJSON,
	type NodeKey,
	type SerializedElementNode,
	type LexicalEditor,
} from 'ui.lexical.core';

import { $createSpoilerContentNode, $isSpoilerContentNode, SpoilerContentNode } from './spoiler-content-node';
import { $createSpoilerTitleNode, $isSpoilerTitleNode, SpoilerTitleNode } from './spoiler-title-node';
import { $createSpoilerTitleTextNode } from './spoiler-title-text-node';

type SerializedSpoilerNode = SerializedElementNode & { open: boolean };

export class SpoilerNode extends ElementNode
{
	__open: boolean;

	constructor(open: boolean = false, key?: NodeKey)
	{
		super(key);

		this.__open = open;
	}

	$config()
	{
		return this.config('spoiler', { extends: ElementNode });
	}

	/** the caret has no way out of this block with an arrow key -- see EscapableBlockNode */
	isEscapableBlock(): boolean
	{
		return true;
	}

	afterCloneFrom(prevNode: this): void
	{
		super.afterCloneFrom(prevNode);
		this.__open = prevNode.__open;
	}

	updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedSpoilerNode>): this
	{
		const node = super.updateFromJSON(serializedNode);
		node.setOpen(serializedNode.open);

		return node;
	}

	createDOM(config: EditorConfig, editor: LexicalEditor): HTMLElement
	{
		const details = document.createElement('details');
		if (Type.isStringFilled(config?.theme?.spoiler?.container))
		{
			Dom.addClass(details, config.theme.spoiler.container);
		}

		details.open = this.__open;

		Event.bind(details, 'toggle', () => {
			const open = editor.getEditorState().read(() => this.getOpen());
			if (open !== details.open)
			{
				editor.update(() => this.toggleOpen());
			}
		});

		return details;
	}

	updateDOM(prevNode: SpoilerNode, dom: HTMLDetailsElement, config: EditorConfig): boolean
	{
		if (prevNode.__open !== this.__open)
		{
			// updateDOM() is expected to mutate the element Lexical passes in
			// eslint-disable-next-line no-param-reassign
			dom.open = this.__open;
		}

		return false;
	}

	static importDOM(): DOMConversionMap<HTMLDetailsElement> | null
	{
		return {
			details: (domNode: HTMLDetailsElement) => {
				return {
					conversion: (details: HTMLDetailsElement): DOMConversionOutput | null => {
						const isOpen = Type.isBoolean(details.open) ? details.open : true;

						return { node: $createSpoiler(isOpen) };
					},
					priority: 1,
				};
			},
		};
	}

	exportDOM(editor: LexicalEditor): DOMExportOutput
	{
		const details = document.createElement('details');
		if (this.__open)
		{
			details.setAttribute('open', true as unknown as string);
		}

		return { element: details };
	}

	exportJSON(): SerializedSpoilerNode
	{
		return {
			...super.exportJSON(),
			open: this.__open,
		};
	}

	canBeEmpty(): false
	{
		return false;
	}

	append(...nodesToAppend: LexicalNode[]): this
	{
		for (const node of nodesToAppend)
		{
			if ($isSpoilerTitleNode(node))
			{
				const titleNode: SpoilerTitleNode = node as SpoilerTitleNode;
				if (this.getTitleNode() === null)
				{
					super.append(titleNode);
				}
				else
				{
					this.getTitleNode()!.clear();
					this.getTitleNode()!.append($createSpoilerTitleTextNode(node.getTextContent()));
				}
			}
			else if ($isSpoilerContentNode(node))
			{
				const contentNode: SpoilerContentNode = node as SpoilerContentNode;
				if (this.getContentNode() === null)
				{
					super.append(contentNode);
				}
				else
				{
					this.getContentNode()!.append(...contentNode.getChildren());
				}
			}
			else if ($isElementNode(node) || $isDecoratorNode(node))
			{
				this.getContentNode()!.append(node);
			}
			else
			{
				this.getContentNode()!.append($createParagraphNode().append(node));
			}
		}

		return this;
	}

	getTitleNode(): SpoilerTitleNode | null
	{
		return this.getChildren<SpoilerTitleNode>()[0] || null;
	}

	getContentNode(): SpoilerContentNode | null
	{
		return this.getChildren<SpoilerContentNode>()[1] || null;
	}

	setOpen(open: boolean): void
	{
		const writable = this.getWritable();
		writable.__open = open;
	}

	getOpen(): boolean
	{
		return this.getLatest().__open;
	}

	toggleOpen(): void
	{
		this.setOpen(!this.getOpen());
	}
}

export function $createSpoiler(
	isOpen: boolean,
	title: string = Loc.getMessage('TEXT_EDITOR_SPOILER_TITLE') as string,
): SpoilerNode
{
	return $createSpoilerNode(isOpen).append(
		$createSpoilerTitleNode().append($createSpoilerTitleTextNode(title)),
		$createSpoilerContentNode(),
	);
}

export function $createSpoilerNode(isOpen?: boolean): SpoilerNode
{
	return new SpoilerNode(isOpen as boolean);
}

export function $isSpoilerNode(node: LexicalNode | null | undefined): boolean
{
	return node instanceof SpoilerNode;
}
