import { Loc, Type } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { type BBCodeNode } from 'ui.bbcode.model';
import { Outline } from 'ui.icon-set.api.core';
import {
	TextNode,
	createCommand,
	$getSelection,
	$insertNodes,
	$isRangeSelection,
	$createTextNode,
	$createParagraphNode,
	$isRootOrShadowRoot,
	COMMAND_PRIORITY_EDITOR,
	COMMAND_PRIORITY_LOW,
	type BaseSelection,
	type LexicalCommand,
	type LexicalNode,
	type LexicalNodeConfig,
} from 'ui.lexical.core';
import { $findMatchingParent, $wrapNodeInElement } from 'ui.lexical.utils';
import { SmileyParser, SmileyManager } from 'ui.smiley';

import { type BBCodeExportOutput, type BBCodeImportConversion, type BBCodeExportConversion } from '../../bbcode';
import { DIALOG_VISIBILITY_COMMAND, HIDE_DIALOG_COMMAND } from '../../commands';
import { returnFocusToEditor } from '../../helpers/return-focus-to-editor';
import { type TextEditor } from '../../text-editor';
import { Button } from '../../toolbar/button';
import { type SchemeValidationOptions } from '../../types/scheme-validation-options';
import { $isInsideUnformatted } from '../../helpers/is-unformatted';
import { BasePlugin } from '../base-plugin';
import { SmileyDialog } from './smiley-dialog';
import { $createSmileyNode, SmileyNode } from './smiley-node';

type InsertSmileyPayload = string;
type InsertSmileyDialogPayload = { targetNode: HTMLElement };

export const INSERT_SMILEY_COMMAND: LexicalCommand<InsertSmileyPayload> = createCommand('INSERT_SMILEY_COMMAND');
export const INSERT_SMILEY_DIALOG_COMMAND: LexicalCommand<InsertSmileyDialogPayload> = createCommand(
	'INSERT_SMILEY_DIALOG_COMMAND',
);

export class SmileyPlugin extends BasePlugin
{
	#smileyParser: SmileyParser | null = null;
	#smileyDialog: SmileyDialog | null = null;

	constructor(editor: TextEditor)
	{
		super(editor);

		// Turning typed text into smiley nodes is the only part that needs a smiley set: without
		// one there is no typing to recognise. The button, the picker and the emoji it inserts do
		// not depend on it, so they are registered either way.
		if (SmileyManager.getSize() > 0)
		{
			this.#smileyParser = new SmileyParser(SmileyManager.getAll());
			this.#registerTypingTransform();
		}

		this.#registerListeners();
		this.#registerInsertSmileyCommand();
		this.#registerComponents();
	}

	static getName(): string
	{
		return 'Smiley';
	}

	static getNodes(editor: TextEditor): Array<LexicalNodeConfig>
	{
		return [SmileyNode];
	}

	importBBCode(): BBCodeImportConversion | null
	{
		return null;
	}

	exportBBCode(): BBCodeExportConversion
	{
		return {
			smiley: (lexicalNode: LexicalNode): BBCodeExportOutput => {
				const scheme = this.getEditor().getBBCodeScheme();

				return {
					node: scheme.createText((lexicalNode as SmileyNode).getTyping()) as unknown as BBCodeNode,
				};
			},
		};
	}

	validateScheme(): SchemeValidationOptions | null
	{
		return {
			bbcodeMap: {
				smiley: '#text',
			},
		};
	}

	/** Recognises the typings of the portal's smiley set in typed text. Needs #smileyParser. */
	#registerTypingTransform(): void
	{
		const handledTextNodes = new Set();

		this.cleanUpRegister(
			this.getEditor().registerNodeTransform(TextNode, (node: TextNode) => {
				if (!node.isSimpleText() || handledTextNodes.has(node.getKey()))
				{
					return;
				}

				if ($isInsideUnformatted(node))
				{
					return;
				}

				const splits = this.#smileyParser!.parse(node.getTextContent());
				if (splits.length > 0)
				{
					const splitOffsets = splits.reduce((acc: number[], smiley) => {
						acc.push(smiley.start, smiley.end);

						return acc;
					}, []);

					const textNodes = node.splitText(...splitOffsets);

					for (const textNode of textNodes)
					{
						const smiley = SmileyManager.get(textNode.getTextContent()) || null;
						if (smiley)
						{
							const smileyNode = $createSmileyNode(
								smiley.getImage(),
								smiley.getTyping(),
								smiley.getWidth(),
								smiley.getHeight(),
							);

							textNode.replace(smileyNode);
						}
						else
						{
							handledTextNodes.add(textNode.getKey());
						}
					}
				}
			}),

			this.getEditor().registerUpdateListener(() => {
				handledTextNodes.clear();
			}),
		);
	}

	#registerListeners(): void
	{
		this.cleanUpRegister(
			// Workaround for a disappearing cursor in FireFox and Safari.
			// Lexical always sets contentEditable = 'false' for all decorator nodes.
			this.getEditor().registerMutationListener(SmileyNode, (nodeMutations) => {
				for (const [nodeKey, mutation] of nodeMutations)
				{
					if (mutation === 'created')
					{
						const dom = this.getEditor().getElementByKey(nodeKey);
						dom!.contentEditable = true as unknown as string;
					}
				}
			}),
			this.getEditor().registerCommand(
				HIDE_DIALOG_COMMAND,
				(): boolean => {
					if (this.#smileyDialog !== null)
					{
						this.#smileyDialog.hide();
					}

					return false;
				},
				COMMAND_PRIORITY_LOW,
			),
			this.getEditor().registerCommand(
				DIALOG_VISIBILITY_COMMAND,
				(): boolean => {
					return this.#smileyDialog !== null && this.#smileyDialog.isShown();
				},
				COMMAND_PRIORITY_LOW,
			),
		);
	}

	/**
	 * The picker has two tabs and emits two different things: the typing of a classic smiley
	 * (`:)`) from a smiley set, and the character itself from the emoji tab. Only the former has
	 * a node of its own — a unicode emoji is ordinary text, and that is how the other consumer of
	 * this component (messageservice) treats every selection from it.
	 */
	#insertFromDialog(selected: string): void
	{
		if (SmileyManager.get(selected) !== null)
		{
			this.getEditor().dispatchCommand(INSERT_SMILEY_COMMAND, selected);

			return;
		}

		this.getEditor().update((): void => {
			const selection: BaseSelection | null = $getSelection();
			if ($isRangeSelection(selection))
			{
				selection.insertText(selected);
			}
		});
	}

	#registerInsertSmileyCommand(): void
	{
		this.cleanUpRegister(
			this.getEditor().registerCommand(
				INSERT_SMILEY_COMMAND,
				(payload) => {
					const smiley = SmileyManager.get(payload) || null;
					if (!smiley)
					{
						return false;
					}

					const smileyNode = $createSmileyNode(
						smiley.getImage(),
						smiley.getTyping(),
						smiley.getWidth(),
						smiley.getHeight(),
					);

					$insertNodes([$createTextNode(' '), smileyNode, $createTextNode(' ')]);
					if ($isRootOrShadowRoot(smileyNode.getParentOrThrow()))
					{
						$wrapNodeInElement(smileyNode, $createParagraphNode).selectEnd();
					}

					return true;
				},
				COMMAND_PRIORITY_EDITOR,
			),
			this.getEditor().registerCommand(
				INSERT_SMILEY_DIALOG_COMMAND,
				(payload): boolean => {
					if (!Type.isPlainObject(payload) || !Type.isElementNode(payload.targetNode))
					{
						return false;
					}

					if (this.#smileyDialog !== null)
					{
						if (this.#smileyDialog.getTargetNode() === payload.targetNode)
						{
							this.#smileyDialog.show();

							return true;
						}

						this.#smileyDialog.destroy();
					}

					this.#smileyDialog = new SmileyDialog({
						targetNode: payload.targetNode,
						onlyEmoji: SmileyManager.getSize() === 0,
						events: {
							onSelect: (event: BaseEvent) => {
								this.#insertFromDialog(event.getData().smiley);
								this.#smileyDialog!.hide();
							},
							onClose: () => {
								returnFocusToEditor(this.getEditor());
							},
							onDestroy: () => {
								this.#smileyDialog = null;
							},
						},
					});

					this.#smileyDialog.show();

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
			.register('smileys', (): Button => {
				const button: Button = new Button();
				button.setIcon(Outline.SMILE);
				button.disableInsideUnformatted();
				button.setHasPopup('dialog');
				button.setTooltip(Loc.getMessage('TEXT_EDITOR_BTN_SMILEYS') as string | null);
				button.subscribe('onClick', (): void => {
					this.getEditor().update((): void => {
						this.getEditor().dispatchCommand(INSERT_SMILEY_DIALOG_COMMAND, {
							targetNode: button.getContainer(),
						});
					});
				});

				return button;
			});
	}

	destroy(): void
	{
		super.destroy();

		if (this.#smileyDialog !== null)
		{
			this.#smileyDialog.destroy();
		}
	}
}
