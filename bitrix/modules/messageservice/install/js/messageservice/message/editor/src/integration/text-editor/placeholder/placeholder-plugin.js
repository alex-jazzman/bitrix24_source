import { BBCodeTagScheme, BBCodeTextNode, type BBCodeElementNode } from 'ui.bbcode.model';
import { $insertDataTransferForRichText } from 'ui.lexical.clipboard';
import {
	$createTextNode,
	$getNodeByKey,
	$getRoot,
	$getSelection,
	$insertNodes,
	$isElementNode,
	$isLineBreakNode,
	$isRangeSelection,
	$isTextNode,
	$setSelection,
	COMMAND_PRIORITY_EDITOR,
	COMMAND_PRIORITY_HIGH,
	createCommand,
	PASTE_COMMAND,
	SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
	type ElementNode,
	type LexicalNode,
	type Point,
	type RangeSelection,
} from 'ui.lexical.core';
import { BasePlugin, type TextEditor, type BBCodeExportConversion, type BBCodeImportConversion, type SchemeValidationOptions } from 'ui.text-editor';

import { lexicalService } from '../../../service/lexical-service';
import { PLACEHOLDER_TAG_NAME } from '../../../service/placeholder-service';
import { $createPlaceholderNode, $isPlaceholderNode, PlaceholderNode } from './placeholder-node';

const LEXICAL_CLIPBOARD_FORMAT = 'application/x-lexical-editor';

export const INSERT_TEXT_COMMAND = createCommand('INSERT_TEXT_COMMAND');
export const INSERT_PLACEHOLDER_COMMAND = createCommand('INSERT_PLACEHOLDER_COMMAND');
export const INSERT_PLACEHOLDER_TEXT_COMMAND = createCommand('INSERT_PLACEHOLDER_TEXT_COMMAND');

export class PlaceholderPlugin extends BasePlugin
{
	#savedSelection: ?RangeSelection = null;

	static getName(): string
	{
		return 'TemplatePlaceholder';
	}

	static getNodes(editor: TextEditor): Array<typeof PlaceholderNode>
	{
		return [PlaceholderNode];
	}

	afterInit(): void
	{
		this.cleanUpRegister(
			this.getLexicalEditor().registerUpdateListener(({ editorState }) => {
				editorState.read(() => {
					const selection = $getSelection();
					if ($isRangeSelection(selection))
					{
						this.#savedSelection = selection.clone();
					}
				});
			}),
			this.getEditor().registerCommand(
				PASTE_COMMAND,
				(event: ClipboardEvent) => {
					const { clipboardData } = event;
					if (
						clipboardData === null
						|| !clipboardData.getData(LEXICAL_CLIPBOARD_FORMAT)
					)
					{
						return false;
					}

					const selection = $getSelection();
					if (!$isRangeSelection(selection))
					{
						return false;
					}

					event.preventDefault();
					$insertDataTransferForRichText(clipboardData, selection, this.getLexicalEditor());

					return true;
				},
				COMMAND_PRIORITY_HIGH,
			),
			this.getEditor().registerCommand(
				SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
				(payload: { nodes: Array<LexicalNode>, selection: RangeSelection }) => this.#handleClipboardInsert(payload),
				COMMAND_PRIORITY_EDITOR,
			),
			this.getEditor().registerCommand(
				INSERT_TEXT_COMMAND,
				({ text }: { text: string }) => {
					this.#insertNodes([$createTextNode(text)]);

					return true;
				},
				COMMAND_PRIORITY_EDITOR,
			),
			this.getEditor().registerCommand(
				INSERT_PLACEHOLDER_COMMAND,
				({ code, caption, removable, copyable, customData }: {
					code: string,
					caption: string,
					removable?: boolean,
					copyable?: boolean,
					customData?: { [string]: string },
				}) => {
					this.#insertNodes([
						$createPlaceholderNode({ code, caption, removable, copyable, customData }),
					]);

					return true;
				},
				COMMAND_PRIORITY_EDITOR,
			),
			this.getEditor().registerCommand(
				INSERT_PLACEHOLDER_TEXT_COMMAND,
				({ text }: { text: string }) => {
					const nodes = lexicalService.$importToInlineNodes(text);
					if (nodes.length > 0)
					{
						this.#insertNodes(nodes);
					}

					return true;
				},
				COMMAND_PRIORITY_EDITOR,
			),
		);
	}

	#handleClipboardInsert(
		{ nodes, selection }: { nodes: Array<LexicalNode>, selection: RangeSelection },
	): boolean
	{
		// Recursively replace non-copyable placeholders nested inside element
		// nodes (e.g. inside a pasted paragraph). In-place .replace() is safe
		// because nested children are attached to their parent element.
		const replaceInChildren = (element: ElementNode): boolean => {
			let changed = false;
			// Snapshot the children list — .replace() mutates it during iteration.
			const children = [...element.getChildren()];
			for (const child of children)
			{
				if ($isPlaceholderNode(child) && !child.isCopyable())
				{
					child.replace($createTextNode(child.getTextContent()));
					changed = true;
				}
				else if ($isElementNode(child) && replaceInChildren(child))
				{
					changed = true;
				}
			}

			return changed;
		};

		let replaced = false;
		// Top-level nodes from the command payload are detached — .replace()
		// cannot be used on them, so we rebuild the top-level array.
		const filteredNodes = nodes.map((node) => {
			if ($isPlaceholderNode(node) && !node.isCopyable())
			{
				replaced = true;

				return $createTextNode(node.getTextContent());
			}

			if ($isElementNode(node) && replaceInChildren(node))
			{
				replaced = true;
			}

			return node;
		});

		if (!replaced)
		{
			return false;
		}

		selection.insertNodes(filteredNodes);

		return true;
	}

	#insertNodes(nodes: Array<LexicalNode>): void
	{
		if (!$isRangeSelection($getSelection()) && this.#savedSelection)
		{
			const anchorExists = $getNodeByKey(this.#savedSelection.anchor.key) !== null;
			const focusExists = $getNodeByKey(this.#savedSelection.focus.key) !== null;
			if (anchorExists && focusExists)
			{
				$setSelection(this.#savedSelection.clone());
			}
		}

		if (!$isRangeSelection($getSelection()))
		{
			$getRoot().selectEnd();
		}

		const selection = $getSelection();
		if (!$isRangeSelection(selection))
		{
			return;
		}

		$insertNodes(this.#padNodes(selection, nodes));
	}

	#padNodes(selection: RangeSelection, nodes: Array<LexicalNode>): Array<LexicalNode>
	{
		const { padBefore, padAfter } = this.#analyzeNeighbors(selection.anchor);

		const nodesToInsert = [];
		if (padBefore)
		{
			nodesToInsert.push($createTextNode(' '));
		}

		nodesToInsert.push(...nodes);

		if (padAfter)
		{
			nodesToInsert.push($createTextNode(' '));
		}

		return nodesToInsert;
	}

	#analyzeNeighbors(anchor: Point): { padBefore: boolean, padAfter: boolean }
	{
		if (anchor.type === 'text')
		{
			const node = anchor.getNode();
			const text = node.getTextContent();

			return {
				padBefore: anchor.offset > 0
					? this.#isPaddingNeededForChar(text[anchor.offset - 1])
					: this.#needsPaddingAgainst(node.getPreviousSibling(), 'end'),
				padAfter: anchor.offset < text.length
					? this.#isPaddingNeededForChar(text[anchor.offset])
					: this.#needsPaddingAgainst(node.getNextSibling(), 'start'),
			};
		}

		if (anchor.type === 'element')
		{
			const parent = anchor.getNode();

			return {
				padBefore: this.#needsPaddingAgainst(parent.getChildAtIndex(anchor.offset - 1), 'end'),
				padAfter: this.#needsPaddingAgainst(parent.getChildAtIndex(anchor.offset), 'start'),
			};
		}

		return { padBefore: false, padAfter: false };
	}

	#needsPaddingAgainst(sibling: ?LexicalNode, edge: 'start' | 'end'): boolean
	{
		if (!sibling)
		{
			return false;
		}

		if ($isLineBreakNode(sibling))
		{
			// A linebreak is already a separator — no extra space needed.
			return false;
		}

		if ($isTextNode(sibling))
		{
			const text = sibling.getTextContent();
			const edgeChar = edge === 'end' ? text.slice(-1) : (text[0] ?? '');

			return this.#isPaddingNeededForChar(edgeChar);
		}

		// Decorator / generic element — treat as a hard boundary, always pad.
		return true;
	}

	#isPaddingNeededForChar(char: string): boolean
	{
		return char !== '' && char !== ' ';
	}

	importBBCode(): BBCodeImportConversion | null
	{
		return {
			[PLACEHOLDER_TAG_NAME]: (): Object => ({
				conversion: (bbcodeNode): Object => {
					const { code = '', removable, copyable, ...customData } = bbcodeNode.getAttributes();

					const textChildren = bbcodeNode.getChildren().filter(
						(child) => child instanceof BBCodeTextNode,
					);
					const caption = textChildren
						.map((child) => child.getContent())
						.join('') || code;

					return {
						node: $createPlaceholderNode({ code, caption, removable, copyable, customData }),
					};
				},
				priority: 0,
			}),
		};
	}

	exportBBCode(): BBCodeExportConversion | null
	{
		return {
			[PLACEHOLDER_TAG_NAME]: (lexicalNode: PlaceholderNode): { node: BBCodeElementNode } => {
				const scheme = this.getEditor().getBBCodeScheme();

				const attributes = {
					code: lexicalNode.getCode(),
					...(lexicalNode.isRemovable() ? {} : { removable: 'false' }),
					...(lexicalNode.isCopyable() ? {} : { copyable: 'false' }),
					...lexicalNode.getCustomData(),
				};

				return {
					node: scheme.createElement({
						name: PLACEHOLDER_TAG_NAME,
						attributes,
						children: [scheme.createText(lexicalNode.getCaption())],
					}),
				};
			},
		};
	}

	validateScheme(): SchemeValidationOptions | null
	{
		this.getEditor().getBBCodeScheme().setTagScheme(
			new BBCodeTagScheme({
				name: PLACEHOLDER_TAG_NAME,
				group: ['#inline'],
				allowedChildren: ['#text'],
			}),
		);

		return {
			nodes: [{
				nodeClass: PlaceholderNode,
			}],
			bbcodeMap: {
				[PLACEHOLDER_TAG_NAME]: PLACEHOLDER_TAG_NAME,
			},
		};
	}
}
