import { Loc, Type } from 'main.core';

import type { BBCodeElementNode } from 'ui.bbcode.model';

import {
	$getSelection,
	$isRangeSelection,
	createCommand,
	COMMAND_PRIORITY_EDITOR,
	type LexicalNode,
	type RangeSelection,
	type LexicalCommand,
} from 'ui.lexical.core';

import { $setBlocksType } from 'ui.lexical.selection';
import { $insertNodeToNearestRoot } from 'ui.lexical.utils';

import {
	trimLineBreaks,
	type BBCodeConversion,
	type BBCodeConversionFn,
	type BBCodeExportOutput,
	type BBCodeImportConversion,
	type BBCodeExportConversion, $importFromBBCode,
} from '../../bbcode';

import { NewLineMode } from '../../constants';
import type { SchemeValidationOptions } from '../../types/scheme-validation-options';

import BasePlugin from '../base-plugin';
import Button from '../../toolbar/button';
import { FORMAT_PARAGRAPH_COMMAND } from '../paragraph';
import { $createQuoteNode, QuoteNode } from './quote-node';

import type TextEditor from '../../text-editor';

import './quote.css';

export type InsertQuotePayload = {
	content?: string,
};

/** @memberof BX.UI.TextEditor.Plugins.Quote */
export const INSERT_QUOTE_COMMAND: LexicalCommand<InsertQuotePayload> = createCommand('INSERT_QUOTE_COMMAND');

/** @memberof BX.UI.TextEditor.Plugins.Quote */
export const FORMAT_QUOTE_COMMAND: LexicalCommand = createCommand('FORMAT_QUOTE_COMMAND');

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

	static getNodes(editor: TextEditor): Array<Class<LexicalNode>>
	{
		return [QuoteNode];
	}

	importBBCode(): BBCodeImportConversion
	{
		return {
			quote: (): BBCodeConversion => ({
				conversion: (node: BBCodeElementNode): BBCodeConversionFn | null => {
					return {
						node: $createQuoteNode(),
						after: (childLexicalNodes: Array<LexicalNode>): Array<LexicalNode> => {
							return trimLineBreaks(childLexicalNodes);
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
					node: scheme.createElement({ name: 'quote' }),
				};
			},
		};
	}

	validateScheme(): SchemeValidationOptions | null
	{
		return {
			nodes: [{
				nodeClass: QuoteNode,
			}],
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
						quoteNode.append(...nodes);
						$insertNodeToNearestRoot(quoteNode);
					}
					else
					{
						$insertNodeToNearestRoot(quoteNode);
						quoteNode.selectEnd();
					}

					return true;
				},
				COMMAND_PRIORITY_EDITOR,
			),
			this.getEditor().registerCommand(
				FORMAT_QUOTE_COMMAND,
				() => {
					const selection: RangeSelection = $getSelection();
					if ($isRangeSelection(selection))
					{
						$setBlocksType(selection, () => $createQuoteNode());
					}

					return true;
				},
				COMMAND_PRIORITY_EDITOR,
			),
		);
	}

	#registerComponents(): void
	{
		this.getEditor().getComponentRegistry().register('quote', (): Button => {
			const button: Button = new Button();
			button.setContent('<span class="ui-icon-set --quote"></span>');
			button.setBlockType('quote');
			button.setTooltip(Loc.getMessage('TEXT_EDITOR_BTN_QUOTE'));
			button.subscribe('onClick', (): void => {
				this.getEditor().focus();
				this.getEditor().update((): void => {
					if (button.isActive())
					{
						this.getEditor().dispatchCommand(FORMAT_PARAGRAPH_COMMAND);
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
