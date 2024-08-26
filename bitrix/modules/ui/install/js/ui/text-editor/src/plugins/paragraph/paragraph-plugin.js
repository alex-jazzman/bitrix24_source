import { BBCodeNode, type BBCodeElementNode } from 'ui.bbcode.model';
import {
	RootNode,
	ParagraphNode,
	$createParagraphNode,
	$isParagraphNode,
	createCommand,
	$getSelection,
	$isRangeSelection,
	COMMAND_PRIORITY_EDITOR,
	type LexicalNode,
	type RangeSelection,
	type LexicalCommand,
	type LexicalNodeReplacement,
} from 'ui.lexical.core';

import { $setBlocksType } from 'ui.lexical.selection';
import { trimLineBreaks } from '../../bbcode';

import type {
	BBCodeConversion,
	BBCodeConversionFn,
	BBCodeConversionOutput,
	BBCodeExportConversion,
	BBCodeExportOutput,
	BBCodeImportConversion,
} from '../../bbcode';

import type { SchemeValidationOptions } from '../../types/scheme-validation-options';

import BasePlugin from '../base-plugin';

import type TextEditor from '../../text-editor';
import { CustomParagraphNode } from './custom-paragraph-node';

import './paragraph.css';

/** @memberof BX.UI.TextEditor.Plugins.Paragraph */
export const FORMAT_PARAGRAPH_COMMAND: LexicalCommand = createCommand('FORMAT_PARAGRAPH_COMMAND');

export class ParagraphPlugin extends BasePlugin
{
	constructor(editor: TextEditor)
	{
		super(editor);

		this.#registerCommands();
		this.#registerListeners();
	}

	static getName(): string
	{
		return 'Paragraph';
	}

	static getNodes(editor: TextEditor): Array<Class<LexicalNode> | LexicalNodeReplacement>
	{
		return [
			CustomParagraphNode,
			{
				replace: ParagraphNode,
				with: (node: ParagraphNode) => {
					return new CustomParagraphNode(editor.getNewLineMode());
				},
				withClass: CustomParagraphNode,
			},
		];
	}

	importBBCode(): BBCodeImportConversion
	{
		return {
			p: (): BBCodeConversion => ({
				conversion: (node: BBCodeElementNode): BBCodeConversionFn | null => convertParagraphNode(node),
				priority: 0,
			}),
			left: (): BBCodeConversion => ({
				conversion: (node: BBCodeElementNode): BBCodeConversionFn | null => convertParagraphNode(node),
				priority: 0,
			}),
			right: (): BBCodeConversion => ({
				conversion: (node: BBCodeElementNode): BBCodeConversionFn | null => convertParagraphNode(node),
				priority: 0,
			}),
			center: (): BBCodeConversion => ({
				conversion: (node: BBCodeElementNode): BBCodeConversionFn | null => convertParagraphNode(node),
				priority: 0,
			}),
			justify: (): BBCodeConversion => ({
				conversion: (node: BBCodeElementNode): BBCodeConversionFn | null => convertParagraphNode(node),
				priority: 0,
			}),
		};
	}

	exportBBCode(): BBCodeExportConversion
	{
		return {
			paragraph: (lexicalNode: LexicalNode): BBCodeExportOutput => {
				const scheme = this.getEditor().getBBCodeScheme();

				return {
					node: scheme.createElement({ name: 'p' }),
				};
			},
			'custom-paragraph': (lexicalNode: LexicalNode): BBCodeExportOutput => {
				const scheme = this.getEditor().getBBCodeScheme();

				return {
					node: scheme.createElement({ name: 'p' }),
				};
			},
		};
	}

	validateScheme(): SchemeValidationOptions | null
	{
		return {
			nodes: [{
				nodeClass: CustomParagraphNode,
			}],
			bbcodeMap: {
				root: '#root',
				tab: '#tab',
				text: '#text',
				paragraph: 'p',
				'custom-paragraph': 'p',
				linebreak: '#linebreak',
			},
		};
	}

	#registerCommands(): void
	{
		this.cleanUpRegister(
			this.getEditor().registerCommand(
				FORMAT_PARAGRAPH_COMMAND,
				() => {
					const selection: RangeSelection = $getSelection();
					if ($isRangeSelection(selection))
					{
						$setBlocksType(selection, () => $createParagraphNode());
					}

					return true;
				},
				COMMAND_PRIORITY_EDITOR,
			),
		);
	}

	#registerListeners(): void
	{
		this.cleanUpRegister(
			this.getEditor().registerNodeTransform(RootNode, (root: RootNode) => {
				const lastChild = root.getLastChild();
				if (!$isParagraphNode(lastChild))
				{
					root.append($createParagraphNode());
				}
			}),
		);
	}
}

function convertParagraphNode(bbcodeNode: BBCodeNode): BBCodeConversionOutput
{
	return {
		node: $createParagraphNode(),
		after: (childLexicalNodes: Array<LexicalNode>): Array<LexicalNode> => {
			return trimLineBreaks(childLexicalNodes);
		},
	};
}
