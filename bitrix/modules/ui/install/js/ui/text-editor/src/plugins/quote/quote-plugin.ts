import { Loc, Type } from 'main.core';

import { type BBCodeNode, type BBCodeNodeOptions } from 'ui.bbcode.model';
import { Outline } from 'ui.icon-set.api.core';

import {
	$getSelection,
	$isRangeSelection,
	$createParagraphNode,
	$getPreviousSelection,
	createCommand,
	COMMAND_PRIORITY_LOW,
	type BaseSelection,
	type LexicalNode,
	type LexicalNodeConfig,
	type ParagraphNode,
	type ElementNode,
	type LexicalCommand,
} from 'ui.lexical.core';

import { $findMatchingParent, $insertNodeToNearestRoot } from 'ui.lexical.utils';

import {
	$importFromBBCode,
	$normalizeTextNodes,
	shouldWrapInParagraph,
	type BBCodeConversion,
	type BBCodeConversionOutput,
	type BBCodeExportOutput,
	type BBCodeImportConversion,
	type BBCodeExportConversion,
} from '../../bbcode';

import { NewLineMode } from '../../constants';
import { $wrapNodes } from '../../helpers/wrap-nodes';
import { type SchemeValidationOptions } from '../../types/scheme-validation-options';

import { BasePlugin } from '../base-plugin';
import { Button } from '../../toolbar/button';
import { $createQuoteNode, $isQuoteNode, $removeQuote, QuoteNode } from './quote-node';

import { type TextEditor } from '../../text-editor';

export type InsertQuotePayload = {
	content?: string;
};

/** @memberof BX.UI.TextEditor.Plugins.Quote */
export const INSERT_QUOTE_COMMAND: LexicalCommand<InsertQuotePayload> = createCommand('INSERT_QUOTE_COMMAND');

/** @memberof BX.UI.TextEditor.Plugins.Quote */
export const FORMAT_QUOTE_COMMAND: LexicalCommand<void> = createCommand('FORMAT_QUOTE_COMMAND');

/** @memberof BX.UI.TextEditor.Plugins.Quote */
export const REMOVE_QUOTE_COMMAND: LexicalCommand<void> = createCommand('REMOVE_QUOTE_COMMAND');

/** @memberof BX.UI.TextEditor.Plugins.Quote */
export const TOGGLE_QUOTE_COMMAND: LexicalCommand<void> = createCommand('TOGGLE_QUOTE_COMMAND');

export class QuotePlugin extends BasePlugin
{
	constructor(editor: TextEditor)
	{
		super(editor);

		this.#registerCommands();
		this.#registerComponents();
	}

	static getName(): string
	{
		return 'Quote';
	}

	static getNodes(editor: TextEditor): Array<LexicalNodeConfig>
	{
		return [QuoteNode];
	}

	importBBCode(): BBCodeImportConversion
	{
		return {
			quote: (): BBCodeConversion => ({
				conversion: (node: BBCodeNode): BBCodeConversionOutput | null => {
					return {
						node: $createQuoteNode(),
						after: (childLexicalNodes: Array<LexicalNode>): Array<LexicalNode> => {
							return $normalizeTextNodes(childLexicalNodes);
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
			quote: (lexicalNode: LexicalNode): BBCodeExportOutput => {
				const scheme = this.getEditor().getBBCodeScheme();

				return {
					node: scheme.createElement({ name: 'quote' } as BBCodeNodeOptions),
				};
			},
		};
	}

	validateScheme(): SchemeValidationOptions | null
	{
		return {
			nodes: [
				{
					nodeClass: QuoteNode,
					validate: (quoteNode: LexicalNode) => {
						let prevParagraph: ParagraphNode | null = null;
						(quoteNode as QuoteNode).getChildren().forEach((child: LexicalNode | ElementNode) => {
							if (shouldWrapInParagraph(child))
							{
								if (prevParagraph === null)
								{
									const paragraph = $createParagraphNode();
									child.replace(paragraph);
									paragraph.append(child);
									prevParagraph = paragraph;
								}
								else
								{
									prevParagraph.append(child);
								}
							}
							else
							{
								prevParagraph = null;
							}
						});

						return false;
					},
				},
			],
			bbcodeMap: {
				quote: 'quote',
			},
		};
	}

	#registerCommands(): void
	{
		this.cleanUpRegister(
			this.getEditor().registerCommand(
				INSERT_QUOTE_COMMAND,
				(payload) => {
					const quoteNode = $createQuoteNode();
					if (Type.isPlainObject(payload) && Type.isStringFilled(payload.content))
					{
						const nodes = $importFromBBCode(payload.content, this.getEditor(), false);
						quoteNode.append(...$normalizeTextNodes(nodes));
						$insertNodeToNearestRoot(quoteNode);
					}
					else
					{
						quoteNode.append($createParagraphNode());
						$insertNodeToNearestRoot(quoteNode);
					}

					quoteNode.selectStart();

					return true;
				},
				COMMAND_PRIORITY_LOW,
			),
			this.getEditor().registerCommand(
				FORMAT_QUOTE_COMMAND,
				() => {
					const selection: BaseSelection | null = $getSelection() || $getPreviousSelection();
					if ($isRangeSelection(selection))
					{
						const quoteNode = $createQuoteNode();
						$wrapNodes(selection, () => quoteNode);

						if (quoteNode.isEmpty())
						{
							quoteNode.append($createParagraphNode());
						}

						quoteNode.selectStart();
					}

					return true;
				},
				COMMAND_PRIORITY_LOW,
			),
			this.getEditor().registerCommand(
				REMOVE_QUOTE_COMMAND,
				() => {
					const selection: BaseSelection | null = $getSelection() || $getPreviousSelection();
					if (!$isRangeSelection(selection))
					{
						return false;
					}

					let quoteNode = $findMatchingParent(selection.anchor.getNode(), $isQuoteNode);
					if (!quoteNode)
					{
						quoteNode = $findMatchingParent(selection.focus.getNode(), $isQuoteNode);
					}

					$removeQuote(quoteNode);

					return true;
				},
				COMMAND_PRIORITY_LOW,
			),
			this.getEditor().registerCommand(
				TOGGLE_QUOTE_COMMAND,
				() => {
					const selection: BaseSelection | null = $getSelection() || $getPreviousSelection();
					if (!$isRangeSelection(selection))
					{
						return false;
					}

					let quoteNode = $findMatchingParent(selection.anchor.getNode(), $isQuoteNode);
					if (!quoteNode)
					{
						quoteNode = $findMatchingParent(selection.focus.getNode(), $isQuoteNode);
					}

					if (quoteNode)
					{
						this.getEditor().dispatchCommand(REMOVE_QUOTE_COMMAND);
					}
					else if (this.getEditor().getNewLineMode() === NewLineMode.LINE_BREAK)
					{
						this.getEditor().dispatchCommand(INSERT_QUOTE_COMMAND);
					}
					else
					{
						this.getEditor().dispatchCommand(FORMAT_QUOTE_COMMAND);
					}

					return true;
				},
				COMMAND_PRIORITY_LOW,
			),
		);
	}

	#registerComponents(): void
	{
		this.getEditor()
			.getComponentRegistry()
			.register('quote', (): Button => {
				const button: Button = new Button();
				button.setIcon(Outline.QUOTE);
				button.setBlockType('quote');
				button.setTooltip(Loc.getMessage('TEXT_EDITOR_BTN_QUOTE') as string | null);
				button.subscribe('onClick', (): void => {
					this.getEditor().focus();
					this.getEditor().update((): void => {
						if (button.isActive())
						{
							this.getEditor().dispatchCommand(REMOVE_QUOTE_COMMAND);
						}
						else if (this.getEditor().getNewLineMode() === NewLineMode.LINE_BREAK)
						{
							this.getEditor().dispatchCommand(INSERT_QUOTE_COMMAND);
						}
						else
						{
							this.getEditor().dispatchCommand(FORMAT_QUOTE_COMMAND);
						}
					});
				});

				return button;
			});
	}
}
