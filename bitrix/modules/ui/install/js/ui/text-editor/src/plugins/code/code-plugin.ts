/* eslint-disable no-underscore-dangle */

import { Loc, Type } from 'main.core';
import { type BBCodeNode } from 'ui.bbcode.model';
import { CodeParser, type CodeToken } from 'ui.code-parser';
import { Outline } from 'ui.icon-set.api.core';
import { $insertDataTransferForPlainText } from 'ui.lexical.clipboard';
import {
	KEY_TAB_COMMAND,
	INSERT_TAB_COMMAND,
	FORMAT_TEXT_COMMAND,
	PASTE_COMMAND,
	COMMAND_PRIORITY_LOW,
	COMMAND_PRIORITY_NORMAL,
	COMMAND_PRIORITY_HIGH,
	INDENT_CONTENT_COMMAND,
	OUTDENT_CONTENT_COMMAND,
	COMMAND_PRIORITY_EDITOR,
	TextNode,
	$createTabNode,
	$insertNodes,
	$getSelection,
	$isRangeSelection,
	$isTabNode,
	$isLineBreakNode,
	$getNodeByKey,
	$createLineBreakNode,
	$createTextNode,
	$isTextNode,
	createCommand,
	tokenizeRawText,
	$getPreviousSelection,
	type BaseSelection,
	type RangeSelection,
	type LexicalCommand,
	type LineBreakNode,
	type TabNode,
	type LexicalNode,
	type LexicalNodeConfig,
	type NodeKey,
} from 'ui.lexical.core';
import { $setBlocksType } from 'ui.lexical.selection';
import { $findMatchingParent, $insertNodeToNearestRoot, objectKlassEquals } from 'ui.lexical.utils';

import {
	createBBCodeElement,
	type BBCodeConversion,
	type BBCodeConversionOutput,
	type BBCodeExportConversion,
	type BBCodeExportOutput,
	type BBCodeImportConversion,
} from '../../bbcode';
import { getSelectedNode } from '../../helpers/get-selected-node';
import { type TextEditor } from '../../text-editor';
import { Button } from '../../toolbar/button';
import { type SchemeValidationOptions } from '../../types/scheme-validation-options';
import { BasePlugin } from '../base-plugin';
import { FORMAT_PARAGRAPH_COMMAND } from '../paragraph';
import { CodeNode, $isCodeNode, $createCodeNode } from './code-node';
import { CodeTokenNode, $isCodeTokenNode, $createCodeTokenNode } from './code-token-node';

export type InsertCodePayload = {
	content?: string;
};

/** @memberof BX.UI.TextEditor.Plugins.Code */
export const FORMAT_CODE_COMMAND: LexicalCommand<void> = createCommand('FORMAT_CODE_COMMAND');

/** @memberof BX.UI.TextEditor.Plugins.Code */
export const TOGGLE_CODE_COMMAND: LexicalCommand<void> = createCommand('TOGGLE_CODE_COMMAND');

/** @memberof BX.UI.TextEditor.Plugins.Code */
export const INSERT_CODE_COMMAND: LexicalCommand<InsertCodePayload> = createCommand('INSERT_CODE_COMMAND');

/**
 * Above this many characters a code block is kept as plain text instead of being split into a
 * node per token. Every node in the document is walked on each commit and rendered as its own
 * element, so a block of that size makes editing slow everywhere, not just inside the block.
 * Only the colours are lost: line breaks, tabs and the text itself stay as they are.
 */
const HIGHLIGHT_SIZE_LIMIT = 50000;

/**
 * The same for the number of lines. A line costs a node per token of it plus one for the break,
 * so many short lines add up to as many nodes as fewer long ones -- and stay well below the limit
 * on characters. The two limits are set to meet at about the same number of nodes.
 */
const HIGHLIGHT_LINE_LIMIT = 2000;

type CodePartKind = 'token' | 'tab' | 'linebreak';

/**
 * What the highlighting wants at one position of a code block. The children of the block are
 * compared against these descriptions, so only the nodes of the range that really changed are
 * created -- building the whole set to compare node against node costs an order more.
 */
type CodePart = {
	kind: CodePartKind;
	text: string;
	highlightType?: string;
};

// a tab and a line break carry nothing of their own, so all of them share one description
const TAB_PART: CodePart = Object.freeze({ kind: 'tab', text: '\t' });
const LINE_BREAK_PART: CodePart = Object.freeze({ kind: 'linebreak', text: '\n' });

/** the text of a code block as the highlighting last left it */
type HighlightedText = {
	nodeKey: NodeKey;
	text: string;
};

export class CodePlugin extends BasePlugin
{
	#nodesCurrentlyHighlighting = new Set();
	#codeParser = new CodeParser();
	#lastHighlight: HighlightedText | null = null;

	constructor(editor: TextEditor)
	{
		super(editor);

		this.#registerCommands();
		this.#registerComponents();
		this.#registerListeners();
	}

	static getName(): string
	{
		return 'Code';
	}

	static getNodes(editor: TextEditor): Array<LexicalNodeConfig>
	{
		return [CodeNode, CodeTokenNode];
	}

	importBBCode(): BBCodeImportConversion
	{
		return {
			code: (): BBCodeConversion => ({
				conversion: (node: BBCodeNode): BBCodeConversionOutput | null => {
					return {
						node: $createCodeNode(),
						after: (childLexicalNodes: Array<LexicalNode>): Array<LexicalNode> => {
							const content = childLexicalNodes.map((childNode: LexicalNode) => childNode.getTextContent()).join('');

							return [$createTextNode(content)];
						},
					};
				},
				priority: 0,
			}),
		};
	}

	exportBBCode(): BBCodeExportConversion
	{
		return {
			code: (lexicalNode: LexicalNode): BBCodeExportOutput => {
				const scheme = this.getEditor().getBBCodeScheme();

				return {
					node: createBBCodeElement(scheme, { name: 'code' }),
				};
			},
			'code-token': (lexicalNode: LexicalNode): BBCodeExportOutput => {
				const scheme = this.getEditor().getBBCodeScheme();

				return {
					node: scheme.createText({
						content: lexicalNode.getTextContent(),
						encode: false,
					} as unknown as Parameters<typeof scheme.createText>[0]) as unknown as BBCodeNode,
				};
			},
		};
	}

	validateScheme(): SchemeValidationOptions | null
	{
		return {
			nodes: [
				{
					nodeClass: CodeNode,
				},
			],
			bbcodeMap: {
				code: 'code',
			},
		};
	}

	#registerComponents(): void
	{
		this.getEditor()
			.getComponentRegistry()
			.register('code', () => {
				const button = new Button();
				button.setIcon(Outline.DEVELOPER_RESOURCES);
				button.setTooltip(Loc.getMessage('TEXT_EDITOR_BTN_CODE') as string | null);
				button.setBlockType('code');
				button.subscribe('onClick', () => {
					this.getEditor().focus();
					this.getEditor().update(() => {
						if (button.isActive())
						{
							this.getEditor().dispatchCommand(FORMAT_PARAGRAPH_COMMAND);
						}
						else
						{
							this.getEditor().dispatchCommand(FORMAT_CODE_COMMAND);
						}
					});
				});

				return button;
			});
	}

	#registerListeners(): void
	{
		const handleTextNodeTransform = this.#handleTextNodeTransform.bind(this);

		this.cleanUpRegister(
			// Prevent formatting
			this.getEditor().registerNodeTransform(CodeNode, this.#handleCodeNodeTransform.bind(this)),
			this.getEditor().registerNodeTransform(TextNode, handleTextNodeTransform),
			this.getEditor().registerNodeTransform(CodeTokenNode, handleTextNodeTransform),
			this.getEditor().registerCommand(
				FORMAT_TEXT_COMMAND,
				() => {
					const selection = $getSelection();
					if (!$isRangeSelection(selection))
					{
						return false;
					}

					const node = getSelectedNode(selection);

					return $isCodeTokenNode(node) || $isCodeNode(node);
				},
				COMMAND_PRIORITY_HIGH,
			),
			this.getEditor().registerCommand(
				KEY_TAB_COMMAND,
				(event) => {
					const command = this.#handleTab(event.shiftKey);
					if (command === null)
					{
						return false;
					}

					event.preventDefault();
					this.getEditor().dispatchCommand(command);

					return true;
				},
				COMMAND_PRIORITY_LOW,
			),
			this.getEditor().registerCommand(
				INSERT_TAB_COMMAND,
				() => {
					const selection = $getSelection();
					if (!$isSelectionInCode(selection))
					{
						return false;
					}
					$insertNodes([$createTabNode()]);

					return true;
				},
				COMMAND_PRIORITY_LOW,
			),
			this.getEditor().registerCommand(
				INDENT_CONTENT_COMMAND,
				(payload): boolean => this.#handleMultilineIndent(INDENT_CONTENT_COMMAND),
				COMMAND_PRIORITY_NORMAL,
			),
			this.getEditor().registerCommand(
				OUTDENT_CONTENT_COMMAND,
				(payload): boolean => this.#handleMultilineIndent(OUTDENT_CONTENT_COMMAND),
				COMMAND_PRIORITY_NORMAL,
			),
			this.getEditor().registerCommand(
				PASTE_COMMAND,
				(event) => {
					const selection = $getSelection();
					if (
						!$isRangeSelection(selection)
						|| !objectKlassEquals(event, ClipboardEvent)
						|| event.clipboardData === null
					)
					{
						return false;
					}

					const codeNode: CodeNode | null = $findMatchingParent(
						selection.anchor.getNode(),
						(node: LexicalNode): node is CodeNode => $isCodeNode(node),
					);

					if (codeNode)
					{
						event.preventDefault();
						this.getEditor().update(
							() => {
								$insertDataTransferForPlainText(event.clipboardData!, selection);
							},
							{
								tag: 'paste',
							},
						);

						return true;
					}

					return false;
				},
				COMMAND_PRIORITY_NORMAL,
			),
		);
	}

	#registerCommands(): void
	{
		this.cleanUpRegister(
			this.getEditor().registerCommand(
				INSERT_CODE_COMMAND,
				(payload: InsertCodePayload) => {
					const codeNode = $createCodeNode();
					if (Type.isPlainObject(payload) && Type.isStringFilled(payload.content))
					{
						codeNode.append(...$createNodesFromParts(this.#getCodeParts(payload.content)));
						$insertNodeToNearestRoot(codeNode);
						// the children are built from the text of the block right here, so the
						// transform that the insertion sets off has nothing left to do
						this.#lastHighlight = { nodeKey: codeNode.getKey(), text: codeNode.getTextContent() };
					}
					else
					{
						$insertNodeToNearestRoot(codeNode);
						codeNode.selectEnd();
					}

					return true;
				},
				COMMAND_PRIORITY_EDITOR,
			),
			this.getEditor().registerCommand(
				FORMAT_CODE_COMMAND,
				(): boolean => {
					const selection = $getSelection() || $getPreviousSelection();
					if ($isRangeSelection(selection))
					{
						if (selection.isCollapsed())
						{
							$setBlocksType(selection, () => $createCodeNode());
						}
						else
						{
							const textContent = selection.getTextContent();
							const codeNode = $createCodeNode();
							selection.insertNodes([codeNode]);

							const newSelection = $getSelection();
							if ($isRangeSelection(newSelection))
							{
								newSelection.insertRawText(textContent);
							}
						}
					}

					return true;
				},
				COMMAND_PRIORITY_EDITOR,
			),
			this.getEditor().registerCommand(
				TOGGLE_CODE_COMMAND,
				(): boolean => {
					const selection = $getSelection() || $getPreviousSelection();
					if (!$isRangeSelection(selection))
					{
						return false;
					}

					const codeParent = $findMatchingParent(selection.anchor.getNode(), (node: LexicalNode) => {
						return $isCodeNode(node) || $isCodeTokenNode(node);
					});

					if (codeParent)
					{
						this.getEditor().dispatchCommand(FORMAT_PARAGRAPH_COMMAND);
					}
					else
					{
						this.getEditor().dispatchCommand(FORMAT_CODE_COMMAND);
					}

					return true;
				},
				COMMAND_PRIORITY_EDITOR,
			),
		);
	}

	#handleCodeNodeTransform(node: CodeNode): void
	{
		const nodeKey = node.getKey();
		if (this.#nodesCurrentlyHighlighting.has(nodeKey))
		{
			return;
		}

		this.#nodesCurrentlyHighlighting.add(nodeKey);

		// Using nested update call to pass `skipTransforms` since we don't want
		// each individual code-token node to be transformed again as it's already
		// in its final state
		this.getEditor().update(
			() => {
				const currentNode = $getNodeByKey(nodeKey);

				if (!$isCodeNode(currentNode) || !currentNode.isAttached())
				{
					return;
				}

				const code = currentNode.getTextContent();

				// The block is dirtied by more than its own text: inserting it runs the
				// highlighting a second time over the text it has just tokenized, and so does
				// every change of the block that leaves its text alone. Those passes walk every
				// node of the block to find nothing to do, which is what the text remembered
				// below spares them.
				if (this.#isHighlightUpToDate(nodeKey, code))
				{
					return;
				}

				updateAndRetainSelection(nodeKey, () => {
					const parts = this.#getCodeParts(code);
					const { from, to, partsForReplacement } = getDiffRange(currentNode.getChildren(), parts);

					if (from !== to || partsForReplacement.length > 0)
					{
						node.splice(from, to - from, $createNodesFromParts(partsForReplacement));

						return true;
					}

					return false;
				});

				this.#lastHighlight = { nodeKey, text: code };
			},
			{
				onUpdate: () => {
					this.#nodesCurrentlyHighlighting.delete(nodeKey);
				},
				skipTransforms: true,
			},
		);
	}

	#isHighlightUpToDate(nodeKey: NodeKey, code: string): boolean
	{
		return this.#lastHighlight?.nodeKey === nodeKey && this.#lastHighlight.text === code;
	}

	#getCodeParts(code: string): CodePart[]
	{
		return isOversized(code)
			? getPlainCodeParts(code)
			: getCodeParts(this.#codeParser.parse(code));
	}

	#handleTextNodeTransform(node: TextNode)
	{
		// Since CodeNode has flat children structure we only need to check
		// if node's parent is a code node and run highlighting if so
		const parentNode = node.getParent();
		if ($isCodeNode(parentNode))
		{
			// A plain text node inside the block is content the highlighting has not seen. It can
			// spell out the same block as before -- pasting over a selection with the same text
			// does -- and the remembered text would then leave it unhighlighted.
			if (!$isCodeTokenNode(node))
			{
				this.#lastHighlight = null;
			}

			this.#handleCodeNodeTransform(parentNode);
		}
		else if ($isCodeTokenNode(node))
		{
			// When code block converted into paragraph or other element
			// code token nodes converted back to normal text
			node.replace($createTextNode(node.__text));
		}
	}

	#handleTab(shiftKey: boolean): null | LexicalCommand<void>
	{
		const selection = $getSelection();
		if (!$isRangeSelection(selection) || !$isSelectionInCode(selection))
		{
			return null;
		}

		const indentOrOutdent = shiftKey ? OUTDENT_CONTENT_COMMAND : INDENT_CONTENT_COMMAND;
		const tabOrOutdent = shiftKey ? OUTDENT_CONTENT_COMMAND : INSERT_TAB_COMMAND;

		// 1. If multiple lines selected: indent/outdent
		const codeLines = $getCodeLines(selection);
		if (codeLines.length > 1)
		{
			return indentOrOutdent;
		}

		// 2. If entire line selected: indent/outdent
		const selectionNodes = selection.getNodes();
		const firstNode = selectionNodes[0];
		if ($isCodeNode(firstNode))
		{
			return indentOrOutdent;
		}

		const firstOfLine = getFirstCodeNodeOfLine(firstNode as CodeTokenNode | TabNode | LineBreakNode);
		const lastOfLine = getLastCodeNodeOfLine(firstNode as CodeTokenNode | TabNode | LineBreakNode);
		const anchor = selection.anchor;
		const focus = selection.focus;
		let selectionFirst = null;
		let selectionLast = null;
		if (focus.isBefore(anchor))
		{
			selectionFirst = focus;
			selectionLast = anchor;
		}
		else
		{
			selectionFirst = anchor;
			selectionLast = focus;
		}

		if (
			firstOfLine !== null
			&& lastOfLine !== null
			&& selectionFirst.key === firstOfLine.getKey()
			&& selectionFirst.offset === 0
			&& selectionLast.key === lastOfLine.getKey()
			&& selectionLast.offset === lastOfLine.getTextContentSize()
		)
		{
			return indentOrOutdent;
		}

		// 3. Else: tab/outdent
		return tabOrOutdent;
	}

	#handleMultilineIndent(type: LexicalCommand<void>): boolean
	{
		const selection = $getSelection();
		if (!$isRangeSelection(selection) || !$isSelectionInCode(selection))
		{
			return false;
		}

		const codeLines = $getCodeLines(selection);
		const codeLinesLength = codeLines.length;
		// Multiple lines selection
		if (codeLines.length > 1)
		{
			for (let i = 0; i < codeLinesLength; i++)
			{
				const line = codeLines[i];
				if (line.length > 0)
				{
					let firstOfLine: null | CodeTokenNode | TabNode | LineBreakNode = line[0];
					// First and last lines might not be complete
					if (i === 0)
					{
						firstOfLine = getFirstCodeNodeOfLine(firstOfLine);
					}

					if (firstOfLine !== null)
					{
						if (type === INDENT_CONTENT_COMMAND)
						{
							// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dom-methods
							firstOfLine.insertBefore($createTabNode());
						}
						else if ($isTabNode(firstOfLine))
						{
							firstOfLine.remove();
						}
					}
				}
			}

			return true;
		}

		// Just one line
		const selectionNodes = selection.getNodes();
		const firstNode = selectionNodes[0];
		if ($isCodeNode(firstNode))
		{
			// CodeNode is empty
			if (type === INDENT_CONTENT_COMMAND)
			{
				selection.insertNodes([$createTabNode()]);
			}

			return true;
		}

		const firstOfLine = getFirstCodeNodeOfLine(firstNode as CodeTokenNode | TabNode | LineBreakNode);
		if (type === INDENT_CONTENT_COMMAND)
		{
			if ($isLineBreakNode(firstOfLine))
			{
				firstOfLine.insertAfter($createTabNode());
			}
			else
			{
				// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dom-methods
				firstOfLine!.insertBefore($createTabNode());
			}
		}
		else if ($isTabNode(firstOfLine))
		{
			firstOfLine.remove();
		}

		return true;
	}
}

function $isSelectionInCode(selection: null | BaseSelection): boolean
{
	if (!$isRangeSelection(selection))
	{
		return false;
	}
	const anchorNode = selection.anchor.getNode();
	const focusNode = selection.focus.getNode();
	if (anchorNode.is(focusNode) && $isCodeNode(anchorNode))
	{
		return true;
	}

	const anchorParent = anchorNode.getParent();

	return $isCodeNode(anchorParent) && anchorParent.is(focusNode.getParent());
}

function $getCodeLines(selection: RangeSelection): Array<Array<CodeTokenNode | TabNode>>
{
	const nodes = selection.getNodes();
	const lines: Array<Array<CodeTokenNode | TabNode>> = [[]];
	if (nodes.length === 1 && $isCodeNode(nodes[0]))
	{
		return lines;
	}

	let lastLine: Array<CodeTokenNode | TabNode> = lines[0];
	for (const [i, node] of nodes.entries())
	{
		if ($isLineBreakNode(node))
		{
			if (i !== 0 && lastLine.length > 0)
			{
				lastLine = [];
				lines.push(lastLine);
			}
		}
		else
		{
			lastLine.push(node as CodeTokenNode | TabNode);
		}
	}

	return lines;
}

export function getFirstCodeNodeOfLine(
	anchor: CodeTokenNode | TabNode | LineBreakNode,
): null | CodeTokenNode | TabNode | LineBreakNode
{
	let previousNode = anchor;
	let node: null | LexicalNode = anchor;
	while ($isCodeTokenNode(node) || $isTabNode(node))
	{
		previousNode = node as CodeTokenNode | TabNode;
		node = node!.getPreviousSibling();
	}

	return previousNode;
}

export function getLastCodeNodeOfLine(
	anchor: CodeTokenNode | TabNode | LineBreakNode,
): CodeTokenNode | TabNode | LineBreakNode
{
	let nextNode = anchor;
	let node: null | LexicalNode = anchor;
	while ($isCodeTokenNode(node) || $isTabNode(node))
	{
		nextNode = node as CodeTokenNode | TabNode;
		node = node!.getNextSibling();
	}

	return nextNode;
}

type DiffRange = {
	from: number;
	partsForReplacement: CodePart[];
	to: number;
};

// Finds minimal diff range between the children of a code block and the parts the highlighting
// wants. It returns from/to range boundaries of prevNodes that needs to be replaced with `parts`
// (subset of nextParts) to make prevNodes equal to nextParts.
function getDiffRange(prevNodes: LexicalNode[], nextParts: CodePart[]): DiffRange
{
	let leadingMatch = 0;
	while (leadingMatch < prevNodes.length)
	{
		if (!nodeMatchesPart(prevNodes[leadingMatch], nextParts[leadingMatch]))
		{
			break;
		}
		leadingMatch++;
	}

	const prevNodesLength: number = prevNodes.length;
	const nextPartsLength: number = nextParts.length;
	const maxTrailingMatch: number = Math.min(prevNodesLength, nextPartsLength) - leadingMatch;

	let trailingMatch = 0;
	while (trailingMatch < maxTrailingMatch)
	{
		trailingMatch++;
		if (!nodeMatchesPart(prevNodes[prevNodesLength - trailingMatch], nextParts[nextPartsLength - trailingMatch]))
		{
			trailingMatch--;
			break;
		}
	}

	return {
		from: leadingMatch,
		partsForReplacement: nextParts.slice(leadingMatch, nextPartsLength - trailingMatch),
		to: prevNodesLength - trailingMatch,
	};
}

function nodeMatchesPart(node: LexicalNode | undefined, part: CodePart | undefined): boolean
{
	if (node === undefined || part === undefined)
	{
		return false;
	}

	if (part.kind === 'tab')
	{
		return $isTabNode(node);
	}

	if (part.kind === 'linebreak')
	{
		return $isLineBreakNode(node);
	}

	// A regular text node never matches, so that it's transformed into code token node
	return (
		$isCodeTokenNode(node)
		&& (node as CodeTokenNode).__text === part.text
		&& (node as CodeTokenNode).__highlightType === part.highlightType
	);
}

function getCodeParts(tokens: Array<CodeToken>): CodePart[]
{
	const parts: CodePart[] = [];
	tokens.forEach((token: CodeToken): void => {
		tokenizeRawText(token.content, {
			linebreak: (): void => {
				parts.push(LINE_BREAK_PART);
			},
			tab: (): void => {
				parts.push(TAB_PART);
			},
			text: (text: string): void => {
				parts.push({ kind: 'token', text, highlightType: token.type });
			},
		});
	});

	return parts;
}

function isOversized(code: string): boolean
{
	return code.length > HIGHLIGHT_SIZE_LIMIT || countLines(code) > HIGHLIGHT_LINE_LIMIT;
}

// counted without cutting the text into lines: only how many of them there are is needed here
function countLines(code: string): number
{
	let lines = 1;
	for (let index = code.indexOf('\n'); index !== -1; index = code.indexOf('\n', index + 1))
	{
		lines++;
	}

	return lines;
}

/** the code past the limits above: same structure, one untyped token per line instead */
function getPlainCodeParts(code: string): CodePart[]
{
	const parts: CodePart[] = [];
	tokenizeRawText(code, {
		linebreak: (): void => {
			parts.push(LINE_BREAK_PART);
		},
		tab: (): void => {
			parts.push(TAB_PART);
		},
		text: (text: string): void => {
			parts.push({ kind: 'token', text });
		},
	});

	return parts;
}

function $createNodesFromParts(parts: CodePart[]): LexicalNode[]
{
	return parts.map((part: CodePart): LexicalNode => {
		if (part.kind === 'tab')
		{
			return $createTabNode();
		}

		if (part.kind === 'linebreak')
		{
			return $createLineBreakNode();
		}

		return $createCodeTokenNode(part.text, part.highlightType);
	});
}

// Wrapping update function into selection retainer, that tries to keep cursor at the same
// position as before.
function updateAndRetainSelection(nodeKey: NodeKey, updateFn: () => boolean): void
{
	const node: LexicalNode | null = $getNodeByKey(nodeKey);
	if (!$isCodeNode(node) || !node.isAttached())
	{
		return;
	}

	// If it's not range selection (or null selection) there's no need to change it,
	// but we can still run highlighting logic
	const selection = $getSelection();
	if (!$isRangeSelection(selection))
	{
		updateFn();

		return;
	}

	// The selection is put back by walking the children of this code node, so it can only be
	// retained when it points inside it. A selection that lives elsewhere has nothing to retain
	// and restoring it would drag the caret into the code block, on top of walking every node
	// of the block to find out where to.
	const anchor = selection.anchor;
	const anchorNode = anchor.getNode();
	if (!node.is(anchorNode) && !node.isParentOf(anchorNode))
	{
		updateFn();

		return;
	}

	const anchorOffset: number = anchor.offset;
	const isNewLineAnchor: boolean = (
		anchor.type === 'element'
		&& $isLineBreakNode(node.getChildAtIndex(anchor.offset - 1))
	);

	// Calculating previous text offset (all text node prior to anchor + anchor own text offset).
	// Walking the siblings instead of collecting them: a block of code holds a node per token,
	// and only the sum of their sizes is needed here, not the list of them.
	let textOffset = 0;
	if (!isNewLineAnchor)
	{
		textOffset = anchorOffset;
		for (let sibling = anchorNode.getPreviousSibling(); sibling !== null; sibling = sibling.getPreviousSibling())
		{
			textOffset += sibling.getTextContentSize();
		}
	}

	const hasChanges: boolean = updateFn();
	if (!hasChanges)
	{
		return;
	}

	// Non-text anchors only happen for line breaks, otherwise
	// selection will be within text node (code token node)
	if (isNewLineAnchor)
	{
		anchor.getNode().select(anchorOffset, anchorOffset);

		return;
	}

	// If it was non-element anchor then we walk through child nodes
	// and looking for a position of original text offset
	node.getChildren().some((child) => {
		const isText: boolean = $isTextNode(child);
		if (isText || $isLineBreakNode(child))
		{
			const textContentSize = child.getTextContentSize();
			if (isText && textContentSize >= textOffset)
			{
				(child as TextNode).select(textOffset, textOffset);

				return true;
			}
			textOffset -= textContentSize;
		}

		return false;
	});
}
