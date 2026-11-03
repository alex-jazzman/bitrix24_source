import { Loc, Type, type JsonObject } from 'main.core';
import { type BBCodeElementNode, type BBCodeNode } from 'ui.bbcode.model';
import { Outline } from 'ui.icon-set.api.core';
import {
	createCommand,
	$createTextNode,
	$insertNodes,
	$isRootOrShadowRoot,
	$createParagraphNode,
	$getSelection,
	$isRangeSelection,
	COMMAND_PRIORITY_EDITOR,
	COMMAND_PRIORITY_LOW,
	type LexicalNode,
	type LexicalNodeConfig,
	type LexicalCommand,
} from 'ui.lexical.core';
import { $wrapNodeInElement, mergeRegister } from 'ui.lexical.utils';

import {
	createBBCodeElement,
	type BBCodeConversion,
	type BBCodeImportConversion,
	type BBCodeExportConversion,
	type BBCodeExportOutput,
	type BBCodeConversionOutput,
} from '../../bbcode';
import { HIDE_DIALOG_COMMAND } from '../../commands';
import { registerDraggableNode } from '../../helpers/register-draggable-node';
import { validateImageUrl } from '../../helpers/validate-image-url';
import { type TextEditor } from '../../text-editor';
import { Button } from '../../toolbar/button';
import { type SchemeValidationOptions } from '../../types/scheme-validation-options';
import { DialogPlugin } from '../dialog-plugin';
import { ImageDialog } from './image-dialog';
import { $createImageNode, ImageNode, type ImagePayload } from './image-node';

import './image-plugin.css';

export type InsertImagePayload = Readonly<ImagePayload>;
export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> = createCommand('INSERT_IMAGE_COMMAND');
export const INSERT_IMAGE_DIALOG_COMMAND: LexicalCommand<void> = createCommand('INSERT_IMAGE_DIALOG_COMMAND');

export class ImagePlugin extends DialogPlugin<ImageDialog>
{
	constructor(editor: TextEditor)
	{
		super(editor);

		this.cleanUpRegister(
			this.#registerCommands(),
			registerDraggableNode(this.getEditor(), ImageNode, (data: InsertImagePayload) => {
				this.getEditor().dispatchCommand(INSERT_IMAGE_COMMAND, data);
			}),
		);

		this.#registerComponents();
	}

	static getName(): string
	{
		return 'Image';
	}

	static getNodes(editor: TextEditor): Array<LexicalNodeConfig>
	{
		return [ImageNode];
	}

	importBBCode(): BBCodeImportConversion
	{
		return {
			img: (): BBCodeConversion => ({
				conversion: (node: BBCodeNode): BBCodeConversionOutput | null => {
					// [img]{url}[/img]
					// [img width={width} height={height}]{url}[/img]
					const src = (node as BBCodeElementNode).getContent().trim();
					const width = Number((node as BBCodeElementNode).getAttribute('width'));
					const height = Number((node as BBCodeElementNode).getAttribute('height'));

					if (validateImageUrl(src))
					{
						return {
							node: $createImageNode({ src, width, height }),
						};
					}

					return {
						node: $createTextNode(node.toString()),
					};
				},
				priority: 0,
			}),
		};
	}

	exportBBCode(): BBCodeExportConversion
	{
		return {
			image: (lexicalNode: LexicalNode): BBCodeExportOutput => {
				const attributes: JsonObject = {};
				const width = (lexicalNode as ImageNode).getWidth();
				const height = (lexicalNode as ImageNode).getHeight();
				if (Type.isNumber(width) && Type.isNumber(height))
				{
					attributes.width = width;
					attributes.height = height;
				}

				const scheme = this.getEditor().getBBCodeScheme();

				return {
					node: createBBCodeElement(scheme, { name: 'img', inline: true, attributes }),
					after: ((elementNode: BBCodeElementNode) => {
						elementNode.setChildren([scheme.createText((lexicalNode as ImageNode).getSrc())]);
					}) as (generatedNode: BBCodeNode | null | undefined) => BBCodeNode | null | undefined,
				};
			},
		};
	}

	validateScheme(): SchemeValidationOptions | null
	{
		return {
			nodes: [
				{
					nodeClass: ImageNode,
				},
			],
			bbcodeMap: {
				image: 'img',
			},
		};
	}

	#registerCommands(): () => void
	{
		return mergeRegister(
			this.getEditor().registerCommand(
				INSERT_IMAGE_COMMAND,
				(payload: InsertImagePayload) => {
					if (!validateImageUrl(payload?.src))
					{
						return false;
					}

					const imageNode = $createImageNode(payload);
					$insertNodes([imageNode]);
					if ($isRootOrShadowRoot(imageNode.getParentOrThrow()))
					{
						$wrapNodeInElement(imageNode, $createParagraphNode).selectEnd();
					}

					return true;
				},
				COMMAND_PRIORITY_EDITOR,
			),
			this.getEditor().registerCommand(
				INSERT_IMAGE_DIALOG_COMMAND,
				(): boolean => {
					const selection = $getSelection();
					if (!$isRangeSelection(selection))
					{
						return false;
					}

					this.rememberSelection(selection);
					this.getDialog()?.destroy();

					this.getEditor().dispatchCommand(HIDE_DIALOG_COMMAND, { sender: 'image-dialog' });

					this.setDialog(this.#createDialog());
					this.getDialog()!.show();

					return true;
				},
				COMMAND_PRIORITY_LOW,
			),
			this.registerDialogCommands('image-dialog'),
		);
	}

	#createDialog(): ImageDialog
	{
		return new ImageDialog({
			// for an embedded popup: document.body -> this.getEditor().getScrollerContainer()
			targetContainer: document.body,
			events: {
				onSave: () => {
					const url = this.getDialog()!.getImageUrl();
					if (!Type.isStringFilled(url))
					{
						this.getDialog()!.hide();

						return;
					}

					this.getEditor().dispatchCommand(INSERT_IMAGE_COMMAND, {
						src: url,
						alt: this.getDialog()!.getImageAlt(),
					});

					this.getDialog()!.hide();
				},
				onCancel: () => {
					this.getDialog()!.hide();
				},
				onClose: () => {
					this.handleDialogDestroy();
				},
				onDestroy: () => {
					this.handleDialogDestroy();
				},
				onShow: () => {
					this.attachDialogToSelection();
				},
			},
		});
	}

	#registerComponents(): void
	{
		this.getEditor()
			.getComponentRegistry()
			.register('image', (): Button => {
				const button: Button = new Button();
				button.setIcon(Outline.IMAGE);
				button.setTooltip(Loc.getMessage('TEXT_EDITOR_BTN_IMAGE') as string | null);
				button.setHasPopup('dialog');
				button.disableInsideUnformatted();
				button.subscribe('onClick', (): void => {
					if (this.isDialogShown())
					{
						return;
					}

					this.getEditor().focus(() => {
						this.getEditor().dispatchCommand(INSERT_IMAGE_DIALOG_COMMAND);
					});
				});

				return button;
			});
	}
}
