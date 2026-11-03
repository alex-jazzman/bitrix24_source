import { Loc } from 'main.core';
import { type BBCodeElementNode, type BBCodeNode, type BBCodeNodeOptions } from 'ui.bbcode.model';
import { Outline } from 'ui.icon-set.api.core';
import {
	COMMAND_PRIORITY_LOW,
	INSERT_PARAGRAPH_COMMAND,
	INDENT_CONTENT_COMMAND,
	COMMAND_PRIORITY_CRITICAL,
	$getSelection,
	$isRangeSelection,
	$isElementNode,
	type RangeSelection,
	type ElementNode,
	type LexicalNode,
	type LexicalNodeConfig,
} from 'ui.lexical.core';
import {
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
	REMOVE_LIST_COMMAND,
	$insertList,
	$removeList,
	$handleListInsertParagraph,
	$isListItemNode,
	$isListNode,
	$getListDepth,
	$createListItemNode,
	$createListNode,
	ListNode,
	ListItemNode,
} from 'ui.lexical.list';
import { $findMatchingParent } from 'ui.lexical.utils';

import {
	type BBCodeConversion,
	type BBCodeImportConversion,
	type BBCodeConversionOutput,
	type BBCodeExportOutput,
	type BBCodeExportConversion,
} from '../../bbcode';
import { type TextEditor } from '../../text-editor';
import { Button } from '../../toolbar/button';
import { type SchemeValidationOptions } from '../../types/scheme-validation-options';
import { type TextEditorOptions } from '../../types/text-editor-options';
import { BasePlugin } from '../base-plugin';

const DEFAULT_MAX_INDENT = 5;

export class ListPlugin extends BasePlugin
{
	#maxIndent: number;

	constructor(editor: TextEditor)
	{
		super(editor);

		this.#maxIndent = editor.getOption('list.maxIndent', DEFAULT_MAX_INDENT);
		this.#registerListeners();
		this.#registerComponents();
	}

	static getName(): string
	{
		return 'List';
	}

	static getDefaultOptions(): TextEditorOptions
	{
		return { list: { maxIndent: DEFAULT_MAX_INDENT } } as TextEditorOptions;
	}

	static getNodes(editor: TextEditor): Array<LexicalNodeConfig>
	{
		return [ListNode, ListItemNode];
	}

	importBBCode(): BBCodeImportConversion
	{
		return {
			list: (): BBCodeConversion => ({
				conversion: (node: BBCodeNode): BBCodeConversionOutput | null => {
					return {
						node: (node as BBCodeElementNode).getValue() === '1' ? $createListNode('number', 1) : $createListNode('bullet'),
					};
				},
				priority: 0,
			}),
			'*': (): BBCodeConversion => ({
				conversion: (node: BBCodeNode): BBCodeConversionOutput | null => {
					return {
						node: $createListItemNode(),
					};
				},
				priority: 0,
			}),
		};
	}

	exportBBCode(): BBCodeExportConversion
	{
		return {
			list: (lexicalNode: LexicalNode): BBCodeExportOutput => {
				const scheme = this.getEditor().getBBCodeScheme();
				const node = scheme.createElement({ name: 'list' } as BBCodeNodeOptions);
				if ((lexicalNode as ListNode).getListType() === 'number')
				{
					node.setValue('1');
				}

				return {
					node,
				};
			},
			listitem: (lexicalNode: LexicalNode): BBCodeExportOutput => {
				const scheme = this.getEditor().getBBCodeScheme();

				return {
					node: scheme.createElement({ name: '*' } as BBCodeNodeOptions),
				};
			},
		};
	}

	validateScheme(): SchemeValidationOptions | null
	{
		return {
			nodes: [
				{
					nodeClass: ListNode,
				},
			],
			bbcodeMap: {
				list: 'list',
				listitem: '*',
			},
		};
	}

	#registerListeners(): void
	{
		this.cleanUpRegister(
			this.getEditor().registerCommand(
				INSERT_ORDERED_LIST_COMMAND,
				() => {
					$insertList('number');

					return true;
				},
				COMMAND_PRIORITY_LOW,
			),
			this.getEditor().registerCommand(
				INSERT_UNORDERED_LIST_COMMAND,
				() => {
					$insertList('bullet');

					return true;
				},
				COMMAND_PRIORITY_LOW,
			),
			this.getEditor().registerCommand(
				REMOVE_LIST_COMMAND,
				() => {
					$removeList();

					return true;
				},
				COMMAND_PRIORITY_LOW,
			),
			this.getEditor().registerCommand(
				INSERT_PARAGRAPH_COMMAND,
				(): boolean => {
					return $handleListInsertParagraph();
				},
				COMMAND_PRIORITY_LOW,
			),
			this.getEditor().registerCommand(
				INDENT_CONTENT_COMMAND,
				() => {
					const totalDepth = this.#getTotalListDepth();
					if (totalDepth > 0)
					{
						return totalDepth > this.#maxIndent;
					}

					return false;
				},
				COMMAND_PRIORITY_CRITICAL,
			),
		);
	}

	#registerComponents(): void
	{
		this.getEditor()
			.getComponentRegistry()
			.register('bulleted-list', (): Button => {
				const button: Button = new Button();
				button.setIcon(Outline.BULLETED_LIST);
				button.setBlockType('bullet');
				button.setTooltip(Loc.getMessage('TEXT_EDITOR_BTN_BULLETED_LIST') as string | null);
				button.subscribe('onClick', (): void => {
					this.getEditor().focus();
					this.getEditor().update((): void => {
						if (button.isActive())
						{
							this.getEditor().dispatchCommand(REMOVE_LIST_COMMAND);
						}
						else
						{
							this.getEditor().dispatchCommand(INSERT_UNORDERED_LIST_COMMAND);
						}
					});
				});

				return button;
			});

		this.getEditor()
			.getComponentRegistry()
			.register('numbered-list', (): Button => {
				const button: Button = new Button();
				button.setIcon(Outline.NUMBERED_LIST);
				button.setTooltip(Loc.getMessage('TEXT_EDITOR_BTN_NUMBERED_LIST') as string | null);
				button.setBlockType('number');
				button.subscribe('onClick', (): void => {
					this.getEditor().focus();
					this.getEditor().update((): void => {
						if (button.isActive())
						{
							this.getEditor().dispatchCommand(REMOVE_LIST_COMMAND);
						}
						else
						{
							this.getEditor().dispatchCommand(INSERT_ORDERED_LIST_COMMAND);
						}
					});
				});

				return button;
			});
	}

	#getTotalListDepth(): number
	{
		const selection = $getSelection();
		if (!$isRangeSelection(selection))
		{
			return 0;
		}

		const elementNodesInSelection: Set<ElementNode | null> = this.#getElementNodesInSelection(selection);
		let totalDepth = 0;
		for (const elementNode of elementNodesInSelection)
		{
			if ($isListNode(elementNode))
			{
				totalDepth = Math.max($getListDepth(elementNode) + 1, totalDepth);
			}
			else if ($isListItemNode(elementNode))
			{
				const parent = elementNode.getParent();
				if (!$isListNode(parent))
				{
					throw new Error('TextEditor: A ListItemNode must have a ListNode for a parent.');
				}

				totalDepth = Math.max($getListDepth(parent) + 1, totalDepth);
			}
		}

		return totalDepth;
	}

	#getElementNodesInSelection(selection: RangeSelection): Set<ElementNode | null>
	{
		const nodesInSelection = selection.getNodes();
		const predicate = (node: LexicalNode): node is ElementNode => $isElementNode(node) && !node.isInline();

		if (nodesInSelection.length === 0)
		{
			return new Set([
				$findMatchingParent(selection.anchor.getNode(), predicate),
				$findMatchingParent(selection.focus.getNode(), predicate),
			]);
		}

		return new Set(nodesInSelection.map((n) => ($isElementNode(n) ? n : $findMatchingParent(n, predicate))));
	}
}
