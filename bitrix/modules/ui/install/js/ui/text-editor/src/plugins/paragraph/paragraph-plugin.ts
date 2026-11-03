import { BBCodeNode } from 'ui.bbcode.model';
import { $insertDataTransferForPlainText } from 'ui.lexical.clipboard';
import {
	RootNode,
	ParagraphNode,
	$createParagraphNode,
	$isParagraphNode,
	createCommand,
	$getSelection,
	$isRangeSelection,
	COMMAND_PRIORITY_EDITOR,
	COMMAND_PRIORITY_LOW,
	KEY_ARROW_UP_COMMAND,
	KEY_ARROW_LEFT_COMMAND,
	KEY_ARROW_DOWN_COMMAND,
	KEY_ARROW_RIGHT_COMMAND,
	PASTE_COMMAND,
	type LexicalNode,
	type LexicalNodeConfig,
	type BaseSelection,
	type LexicalCommand,
	type LexicalNodeReplacement,
	type ElementNode,
} from 'ui.lexical.core';

import { $setBlocksType } from 'ui.lexical.selection';
import { $findMatchingParent, $onEscapeDown, $onEscapeUp, objectKlassEquals } from 'ui.lexical.utils';

import {
	createBBCodeElement,
	type BBCodeConversion,
	type BBCodeConversionOutput,
	type BBCodeExportConversion,
	type BBCodeExportOutput,
	type BBCodeImportConversion,
} from '../../bbcode';
import { NewLineMode } from '../../constants';
import { $isEscapableBlock } from '../../helpers/is-escapable-block';
import { wrapTextInParagraph } from '../../helpers/wrap-text-in-paragraph';

import { type SchemeValidationOptions } from '../../types/scheme-validation-options';

import { BasePlugin } from '../base-plugin';

import { CustomParagraphNode } from './custom-paragraph-node';

import { type TextEditor } from '../../text-editor';

import './paragraph.css';

/** @memberof BX.UI.TextEditor.Plugins.Paragraph */
export const FORMAT_PARAGRAPH_COMMAND: LexicalCommand<void> = createCommand('FORMAT_PARAGRAPH_COMMAND');

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

	static getNodes(editor: TextEditor): Array<LexicalNodeConfig>
	{
		return [
			CustomParagraphNode,
			{
				replace: ParagraphNode,
				with: (node: ParagraphNode) => {
					return new CustomParagraphNode(editor.getNewLineMode());
				},
				withKlass: CustomParagraphNode,
			} satisfies LexicalNodeReplacement,
		];
	}

	importBBCode(): BBCodeImportConversion
	{
		return {
			p: (): BBCodeConversion => ({
				conversion: (node: BBCodeNode): BBCodeConversionOutput | null => convertParagraphNode(node),
				priority: 0,
			}),
			left: (): BBCodeConversion => ({
				conversion: (node: BBCodeNode): BBCodeConversionOutput | null => convertParagraphNode(node),
				priority: 0,
			}),
			right: (): BBCodeConversion => ({
				conversion: (node: BBCodeNode): BBCodeConversionOutput | null => convertParagraphNode(node),
				priority: 0,
			}),
			center: (): BBCodeConversion => ({
				conversion: (node: BBCodeNode): BBCodeConversionOutput | null => convertParagraphNode(node),
				priority: 0,
			}),
			justify: (): BBCodeConversion => ({
				conversion: (node: BBCodeNode): BBCodeConversionOutput | null => convertParagraphNode(node),
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
					node: createBBCodeElement(scheme, { name: 'p' }),
				};
			},
			'custom-paragraph': (lexicalNode: LexicalNode): BBCodeExportOutput => {
				const scheme = this.getEditor().getBBCodeScheme();

				return {
					node: createBBCodeElement(scheme, { name: 'p' }),
				};
			},
		};
	}

	validateScheme(): SchemeValidationOptions | null
	{
		return {
			nodes: [
				{
					nodeClass: CustomParagraphNode,
				},
			],
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
					const selection: BaseSelection | null = $getSelection();
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
				const selection = $getSelection();
				if ($isRangeSelection(selection))
				{
					const anchorNode = selection.anchor.getNode();
					const focusNode = selection.focus.getNode();
					if (!anchorNode.isAttached() || !focusNode.isAttached())
					{
						root.selectEnd();
						// eslint-disable-next-line no-console
						console.warn(
							'TextEditor: selection has been moved to the end of the editor because the previously '
								+ "selected nodes have been removed and selection wasn't moved to another node. "
								+ 'Ensure selection changes after removing/replacing a selected node.',
						);
					}
				}

				const lastChild = root.getLastChild();
				if (!$isParagraphNode(lastChild))
				{
					root.append($createParagraphNode());
				}
			}),

			// When a block node is the first child pressing up/left arrow will insert paragraph
			// above it to allow adding more content. It's similar what $insertBlockNode
			// (mainly for decorators), except it'll always be possible to continue adding
			// new content even if leading paragraph is accidentally deleted
			this.getEditor().registerCommand(KEY_ARROW_UP_COMMAND, this.#handleEscapeUp.bind(this), COMMAND_PRIORITY_LOW),

			this.getEditor().registerCommand(KEY_ARROW_LEFT_COMMAND, this.#handleEscapeUp.bind(this), COMMAND_PRIORITY_LOW),

			// When a block node is the last child pressing down/right arrow will insert paragraph
			// below it to allow adding more content. It's similar what $insertBlockNode
			// (mainly for decorators), except it'll always be possible to continue adding
			// new content even if trailing paragraph is accidentally deleted
			this.getEditor().registerCommand(KEY_ARROW_DOWN_COMMAND, this.#handleEscapeDown.bind(this), COMMAND_PRIORITY_LOW),
			this.getEditor().registerCommand(
				KEY_ARROW_RIGHT_COMMAND,
				this.#handleEscapeDown.bind(this),
				COMMAND_PRIORITY_LOW,
			),
			this.getEditor().registerCommand(PASTE_COMMAND, this.#handlePaste.bind(this), COMMAND_PRIORITY_LOW),
		);
	}

	#handlePaste(event: ClipboardEvent | InputEvent | KeyboardEvent): boolean
	{
		if (!objectKlassEquals(event, ClipboardEvent))
		{
			return false;
		}

		if (this.getEditor().getNewLineMode() === NewLineMode.LINE_BREAK)
		{
			event.preventDefault();
			this.getEditor().update(
				() => {
					const selection = $getSelection();
					const { clipboardData } = event;
					if (clipboardData !== null && $isRangeSelection(selection))
					{
						$insertDataTransferForPlainText(clipboardData, selection);
					}
				},
				{
					tag: 'paste',
				},
			);

			return true;
		}

		// Mixed Mode
		const clipboardData: DataTransfer | null = event.clipboardData;
		if (
			!clipboardData
			|| clipboardData.items.length !== 1
			|| (clipboardData.items[0].type !== 'text/plain' && clipboardData.items[0].type !== 'text/uri-list')
		)
		{
			return false;
		}

		const text = clipboardData.getData('text/plain') || clipboardData.getData('text/uri-list');
		const hasLineBreaks = /\n/.test(text);
		if (!hasLineBreaks)
		{
			return false;
		}

		event.preventDefault();
		event.stopPropagation();

		const html = wrapTextInParagraph(text);
		const dataTransfer = new DataTransfer();
		dataTransfer.setData('text/plain', clipboardData.getData('text/plain'));
		dataTransfer.setData('text/html', html);
		const pasteEvent = new ClipboardEvent('paste', {
			clipboardData: dataTransfer,
			bubbles: true,
			cancelable: true,
		});

		if (pasteEvent.clipboardData!.items.length === 0)
		{
			// Firefox
			pasteEvent.clipboardData!.setData('text/plain', clipboardData.getData('text/plain'));
			pasteEvent.clipboardData!.setData('text/html', html);
		}

		this.getEditor().getEditableContainer().dispatchEvent(pasteEvent);

		return true;
	}

	#handleEscapeUp(event: KeyboardEvent | null): boolean
	{
		return $onEscapeUp($isEscapableBlock, event);
	}

	#handleEscapeDown(event: KeyboardEvent | null): boolean
	{
		return $onEscapeDown($isEscapableBlock, event);
	}
}

function convertParagraphNode(bbcodeNode: BBCodeNode): BBCodeConversionOutput
{
	return {
		node: $createParagraphNode(),
	};
}
