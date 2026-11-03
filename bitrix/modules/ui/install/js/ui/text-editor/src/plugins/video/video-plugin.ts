import { Type, Loc, type JsonObject } from 'main.core';
import { type BBCodeElementNode, type BBCodeNode } from 'ui.bbcode.model';
import { Outline } from 'ui.icon-set.api.core';
import {
	createCommand,
	$createTextNode,
	$getSelection,
	$isRangeSelection,
	COMMAND_PRIORITY_EDITOR,
	COMMAND_PRIORITY_LOW,
	type LexicalNode,
	type LexicalNodeConfig,
	type LexicalCommand,
} from 'ui.lexical.core';
import { $insertNodeToNearestRoot } from 'ui.lexical.utils';
import { VideoService } from 'ui.video-service';

import {
	createBBCodeElement,
	type BBCodeConversion,
	type BBCodeImportConversion,
	type BBCodeExportConversion,
	type BBCodeExportOutput,
	type BBCodeConversionOutput,
} from '../../bbcode';
import { HIDE_DIALOG_COMMAND } from '../../commands';
import { sanitizeUrl } from '../../helpers/sanitize-url';
import { validateVideoUrl } from '../../helpers/validate-video-url';
import { type TextEditor } from '../../text-editor';
import { Button } from '../../toolbar/button';
import { type SchemeValidationOptions } from '../../types/scheme-validation-options';
import { DialogPlugin } from '../dialog-plugin';
import { VideoDialog } from './video-dialog';
import { $createVideoNode, VideoNode, type VideoPayload } from './video-node';

import './video-plugin.css';

export type InsertVideoPayload = Readonly<VideoPayload>;

/** @memberof BX.UI.TextEditor.Plugins.Video */
export const INSERT_VIDEO_COMMAND: LexicalCommand<InsertVideoPayload> = createCommand('INSERT_VIDEO_COMMAND');

/** @memberof BX.UI.TextEditor.Plugins.Video */
export const INSERT_VIDEO_DIALOG_COMMAND: LexicalCommand<void> = createCommand('INSERT_VIDEO_DIALOG_COMMAND');

export class VideoPlugin extends DialogPlugin<VideoDialog>
{
	constructor(editor: TextEditor)
	{
		super(editor);

		this.#registerCommands();
		this.#registerComponents();
	}

	static getName(): string
	{
		return 'Video';
	}

	static getNodes(editor: TextEditor): Array<LexicalNodeConfig>
	{
		return [VideoNode];
	}

	importBBCode(): BBCodeImportConversion
	{
		return {
			video: (): BBCodeConversion => ({
				conversion: (node: BBCodeNode): BBCodeConversionOutput | null => {
					// [video type={type} width={width} height={height}]{url}[/video]
					const src = (node as BBCodeElementNode).getContent().trim();
					const width = Number((node as BBCodeElementNode).getAttribute('width'));
					const height = Number((node as BBCodeElementNode).getAttribute('height'));
					if (validateVideoUrl(src))
					{
						return {
							node: $createVideoNode({ src: sanitizeUrl(src), width, height }),
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
			video: (lexicalNode: LexicalNode): BBCodeExportOutput => {
				const attributes: JsonObject = {};
				const width = (lexicalNode as VideoNode).getWidth();
				const height = (lexicalNode as VideoNode).getHeight();
				if (Type.isNumber(width) && Type.isNumber(height))
				{
					attributes.width = width;
					attributes.height = height;
				}

				const provider = (lexicalNode as VideoNode).getProvider();
				if (Type.isStringFilled(provider))
				{
					attributes.type = provider;
				}

				const scheme = this.getEditor().getBBCodeScheme();

				return {
					node: createBBCodeElement(scheme, { name: 'video', inline: false, attributes }),
					after: ((elementNode: BBCodeElementNode) => {
						elementNode.setChildren([scheme.createText((lexicalNode as VideoNode).getSrc())]);
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
					nodeClass: VideoNode,
				},
			],
			bbcodeMap: {
				video: 'video',
			},
		};
	}

	#showVideoDialog(): void
	{
		this.getDialog()?.destroy();

		this.getEditor().dispatchCommand(HIDE_DIALOG_COMMAND, { sender: 'video-dialog' });

		this.setDialog(new VideoDialog({
			// for an embedded popup: document.body -> this.getEditor().getScrollerContainer()
			targetContainer: document.body,
			events: {
				onSave: () => {
					const url = this.getDialog()!.getVideoUrl();
					if (!Type.isStringFilled(url))
					{
						this.getDialog()!.hide();

						return;
					}

					if (!validateVideoUrl(url))
					{
						this.getDialog()!.showError(Loc.getMessage('TEXT_EDITOR_INVALID_URL') as string);

						return;
					}

					this.getEditor().dispatchCommand(INSERT_VIDEO_COMMAND, { src: url });

					this.getDialog()!.hide();
				},
				onInput: () => {
					this.getDialog()!.clearError();
				},
				onCancel: () => {
					this.getDialog()!.hide();
				},
				onShow: () => {
					this.attachDialogToSelection();
				},
				onClose: () => {
					this.handleDialogDestroy();
				},
				onDestroy: () => {
					this.handleDialogDestroy();
				},
			},
		}));

		this.getDialog()!.show();
	}

	#registerCommands(): void
	{
		this.cleanUpRegister(
			this.getEditor().registerCommand(
				INSERT_VIDEO_COMMAND,
				(payload) => {
					if (Type.isPlainObject(payload) && validateVideoUrl(payload.src))
					{
						const videoNode = $createVideoNode({
							src: VideoService.getEmbeddedUrl(payload.src) || payload.src,
							width: payload.width,
							height: payload.height,
						});

						$insertNodeToNearestRoot(videoNode);

						return true;
					}

					return false;
				},
				COMMAND_PRIORITY_EDITOR,
			),

			this.getEditor().registerCommand(
				INSERT_VIDEO_DIALOG_COMMAND,
				(): boolean => {
					const selection = $getSelection();
					if (!$isRangeSelection(selection))
					{
						return false;
					}

					this.rememberSelection(selection);
					this.#showVideoDialog();

					return true;
				},
				COMMAND_PRIORITY_LOW,
			),

			this.registerDialogCommands('video-dialog'),
		);
	}

	#registerComponents(): void
	{
		this.getEditor()
			.getComponentRegistry()
			.register('video', (): Button => {
				const button: Button = new Button();
				button.setIcon(Outline.RECORD_VIDEO);
				button.disableInsideUnformatted();
				button.setHasPopup('dialog');
				button.setTooltip(Loc.getMessage('TEXT_EDITOR_BTN_VIDEO') as string | null);
				button.subscribe('onClick', (): void => {
					if (this.isDialogShown())
					{
						return;
					}

					this.getEditor().focus(() => {
						this.getEditor().dispatchCommand(INSERT_VIDEO_DIALOG_COMMAND);
					});
				});

				return button;
			});
	}
}
