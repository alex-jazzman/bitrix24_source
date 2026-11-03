import { Type, Text, type JsonObject } from 'main.core';
import { type BBCodeElementNode } from 'ui.bbcode.model';
import {
	$createTextNode,
	createCommand,
	$isRootOrShadowRoot,
	$insertNodes,
	$createParagraphNode,
	$nodesOfType,
	$isRangeSelection,
	$createLineBreakNode,
	$isParagraphNode,
	$getSelection,
	COMMAND_PRIORITY_EDITOR,
	type ElementNode,
	type TextNode,
	type ParagraphNode,
	type PointType,
	type RangeSelection,
	type LexicalCommand,
	type LexicalNode,
	type LexicalNodeConfig,
} from 'ui.lexical.core';
import { $wrapNodeInElement, $findMatchingParent } from 'ui.lexical.utils';
import { type UploaderFileInfo } from 'ui.uploader.core';

import {
	createBBCodeElement,
	type BBCodeConversion,
	type BBCodeConversionOutput,
	type BBCodeExportOutput,
	type BBCodeExportFn,
	type BBCodeImportConversion,
	type BBCodeExportConversion,
	type BBCodeConversionFn,
} from '../../bbcode';
import { NewLineMode } from '../../constants';
import { calcImageSize } from '../../helpers/calc-image-size';
import { registerDraggableNode } from '../../helpers/register-draggable-node';
import { type TextEditor } from '../../text-editor';
import { type SchemeValidationOptions } from '../../types/scheme-validation-options';
import { type TextEditorOptions } from '../../types/text-editor-options';
import { BasePlugin } from '../base-plugin';
import { FileNode, $createFileNode } from './file/file-node';
import { FileImageNode, $createFileImageNode } from './image/file-image-node';
import { FileVideoNode, $createFileVideoNode } from './video/file-video-node';

type InsertFilePayload = {
	serverFileId: string | number;
	info: UploaderFileInfo;
	alt?: string;
	width?: number;
	height?: number;
	inline?: boolean;
};

type RemoveFilePayload = {
	serverFileId: string | number;
	skipHistoryStack?: boolean;
};

/** @memberof BX.UI.TextEditor.Plugins.File */
export const FileType = {
	FILE: 'file',
	IMAGE: 'image',
	VIDEO: 'video',
};

/** @memberof BX.UI.TextEditor.Plugins.File */
export const ADD_FILE_COMMAND: LexicalCommand<UploaderFileInfo> = createCommand('ADD_FILE_COMMAND');
export const ADD_FILES_COMMAND: LexicalCommand<UploaderFileInfo[]> = createCommand('ADD_FILES_COMMAND');
export const INSERT_FILE_COMMAND: LexicalCommand<InsertFilePayload> = createCommand('INSERT_FILE_COMMAND');

/** @memberof BX.UI.TextEditor.Plugins.File */
export const REMOVE_FILE_COMMAND: LexicalCommand<RemoveFilePayload> = createCommand('REMOVE_FILE_COMMAND');

/** @memberof BX.UI.TextEditor.Plugins.File */
export const GET_INSERTED_FILES_COMMAND: LexicalCommand<Function> = createCommand('GET_INSERTED_FILES_COMMAND');

/** @memberof BX.UI.TextEditor.Plugins.File */
export class FilePlugin extends BasePlugin
{
	#enabled: boolean = false;
	#mode: 'disk' | 'file' = 'file';
	#files: Map<string | number, UploaderFileInfo> = new Map();

	constructor(editor: TextEditor)
	{
		super(editor);

		const mode = editor.getOption<string>('file.mode');
		if (mode !== 'file' && mode !== 'disk')
		{
			return;
		}

		this.#enabled = true;
		this.#mode = mode;

		this.addFiles(editor.getOption<UploaderFileInfo[]>('file.files', []));

		this.#registerListeners();

		this.cleanUpRegister(
			registerDraggableNode(this.getEditor(), FileImageNode, (data: InsertFilePayload) => {
				this.getEditor().dispatchCommand(INSERT_FILE_COMMAND, data);
			}),
			registerDraggableNode(this.getEditor(), FileVideoNode, (data: InsertFilePayload) => {
				this.getEditor().dispatchCommand(INSERT_FILE_COMMAND, data);
			}),
		);
	}

	static getName(): string
	{
		return 'File';
	}

	static getDefaultOptions(): TextEditorOptions
	{
		return { file: { files: [] } } as TextEditorOptions;
	}

	static getNodes(editor: TextEditor): Array<LexicalNodeConfig>
	{
		return [FileNode, FileImageNode, FileVideoNode];
	}

	importBBCode(): BBCodeImportConversion | null
	{
		if (!this.isEnabled())
		{
			return null;
		}

		return {
			[this.getMode()]: (): BBCodeConversion => ({
				conversion: ((node: BBCodeElementNode): BBCodeConversionOutput | null => {
					// [DISK FILE ID=n14194]
					// [DISK FILE ID=14194]

					// [FILE ID=5b87ba3b-edb1-49df-a840-50d17b6c3e8c.fbbdd477d5ff19d61...a875e731fa89cfd1e1]
					// [FILE ID=14194]
					let serverFileId = node.getAttribute('id');
					const createTextNode = () => {
						return { node: $createTextNode(node.toString()) };
					};

					if (
						!Type.isStringFilled(serverFileId)
						|| (this.getMode() === 'disk' && !/^n?\d+$/i.test(serverFileId))
						|| (this.getMode() === 'file' && !/^(\d+|[\da-f-]{36}\.[\da-f]{32,})$/i.test(serverFileId))
					)
					{
						return createTextNode();
					}

					const info = this.getFile(serverFileId);
					if (info === null)
					{
						return createTextNode();
					}

					if (info.serverFileId!.toString() !== serverFileId.toString())
					{
						serverFileId = info.serverFileId!.toString();
					}

					const fileType = this.getFileType(info);
					if (fileType === FileType.IMAGE)
					{
						const width = Text.toInteger(node.getAttribute('width'));
						const height = Text.toInteger(node.getAttribute('height'));

						return { node: $createFileImageNode(serverFileId, info, width, height) };
					}

					if (fileType === FileType.VIDEO)
					{
						const width = Text.toInteger(node.getAttribute('width'));
						const height = Text.toInteger(node.getAttribute('height'));

						return { node: $createFileVideoNode(serverFileId, info, width, height) };
					}

					return { node: $createFileNode(serverFileId, info) };
				}) as BBCodeConversionFn,
				priority: 0,
			}),
		};
	}

	exportBBCode(): BBCodeExportConversion | null
	{
		if (!this.isEnabled())
		{
			return null;
		}

		return {
			file: ((lexicalNode: FileNode): BBCodeExportOutput => {
				const scheme = this.getEditor().getBBCodeScheme();
				const attributes: JsonObject = this.getMode() === 'disk' ? { file: '' } : {};
				attributes.id = lexicalNode.getServerFileId();

				return {
					node: createBBCodeElement(scheme, { name: this.getMode(), attributes, inline: true }),
				};
			}) as BBCodeExportFn,
			'file-video': ((lexicalNode: FileVideoNode): BBCodeExportOutput => {
				const scheme = this.getEditor().getBBCodeScheme();
				const attributes: JsonObject = this.getMode() === 'disk' ? { file: '' } : {};
				attributes.id = lexicalNode.getServerFileId();

				const node = createBBCodeElement(scheme, { name: this.getMode(), attributes, inline: false });
				// a zero size means "unknown" (the file has no preview and nobody resized it), and
				// an attribute written as zero leaves for BBCode with no value at all
				if (lexicalNode.getWidth() > 0 && lexicalNode.getHeight() > 0)
				{
					node.setAttribute('width', lexicalNode.getWidth());
					node.setAttribute('height', lexicalNode.getHeight());
				}

				return { node };
			}) as BBCodeExportFn,
			'file-image': ((lexicalNode: FileImageNode): BBCodeExportOutput => {
				const scheme = this.getEditor().getBBCodeScheme();
				const attributes: JsonObject = this.getMode() === 'disk' ? { file: '' } : {};
				attributes.id = lexicalNode.getServerFileId();

				const node = createBBCodeElement(scheme, { name: this.getMode(), attributes, inline: true });
				if (lexicalNode.isResized())
				{
					node.setAttribute('width', lexicalNode.getWidth());
					node.setAttribute('height', lexicalNode.getHeight());
				}

				return { node };
			}) as BBCodeExportFn,
		};
	}

	validateScheme(): SchemeValidationOptions | null
	{
		if (!this.isEnabled())
		{
			return null;
		}

		return {
			bbcodeMap: {
				file: this.getMode(),
				'file-image': this.getMode(),
				'file-video': this.getMode(),
			},
		};
	}

	isEnabled(): boolean
	{
		return this.#enabled;
	}

	getMode(): 'disk' | 'file'
	{
		return this.#mode;
	}

	addFile(file: UploaderFileInfo): void
	{
		if (Type.isPlainObject(file) && (Type.isStringFilled(file.serverFileId) || Type.isNumber(file.serverFileId)))
		{
			const serverFileId = file.serverFileId.toString();
			if (!this.#files.has(serverFileId))
			{
				this.#files.set(file.serverFileId.toString(), file);
			}
		}
	}

	addFiles(files: UploaderFileInfo[]): void
	{
		if (Type.isArrayFilled(files))
		{
			files.forEach((file: UploaderFileInfo) => {
				this.addFile(file);
			});
		}
	}

	getFile(serverFileId: string | number): UploaderFileInfo | null
	{
		if (Type.isStringFilled(serverFileId) || Type.isNumber(serverFileId))
		{
			const file = this.#files.get(serverFileId.toString()) || null;

			if (file)
			{
				return file;
			}

			for (const item of this.#files.values())
			{
				if (
					item.serverFileId!.toString() === serverFileId.toString()
					|| (item.customData?.objectId && `n${item.customData.objectId.toString()}` === serverFileId.toString())
				)
				{
					return item;
				}
			}
		}

		return null;
	}

	getFileType(file: UploaderFileInfo): string
	{
		if (file?.isImage)
		{
			return FileType.IMAGE;
		}

		if (file?.isVideo)
		{
			return FileType.VIDEO;
		}

		return FileType.FILE;
	}

	removeFile(serverFileId: string | number, skipHistoryStack: boolean = true): void
	{
		if (Type.isStringFilled(serverFileId) || Type.isNumber(serverFileId))
		{
			this.#files.delete(serverFileId.toString());

			this.getEditor().update(
				() => {
					const nodes = [...$nodesOfType(FileNode), ...$nodesOfType(FileImageNode), ...$nodesOfType(FileVideoNode)];

					nodes.forEach((node: FileNode | FileImageNode | FileVideoNode) => {
						if (node.getServerFileId().toString() === serverFileId.toString())
						{
							node.remove();
						}
					});
				},
				skipHistoryStack ? { tag: 'history-merge' } : {},
			);
		}
	}

	#createNodeForFile(payload: InsertFilePayload): LexicalNode
	{
		const fileType = this.getFileType(payload.info);

		const previewWidth = payload.info.previewWidth as number;
		const previewHeight = payload.info.previewHeight as number;
		const renderWidth = payload.width as number;
		const renderHeight = payload.height as number;

		if (fileType === FileType.IMAGE)
		{
			const [width, height] = calcImageSize(previewWidth, previewHeight, renderWidth, renderHeight);
			// an empty alt is a value of its own — a decorative image — so it has to travel with the
			// payload; only a missing one falls back to the default the node builds from the file info
			const alt = payload.alt ?? null;

			return $createFileImageNode(payload.serverFileId, payload.info, width, height, alt);
		}

		if (fileType === FileType.VIDEO)
		{
			let width = 0;
			let height = 0;
			if (previewWidth > 0 && previewHeight > 0)
			{
				[width, height] = calcImageSize(previewWidth, previewHeight, renderWidth, renderHeight);
			}

			return $createFileVideoNode(payload.serverFileId, payload.info, width, height);
		}

		return $createFileNode(payload.serverFileId, payload.info);
	}

	#insertFile(payload: InsertFilePayload): boolean
	{
		if (
			!Type.isPlainObject(payload)
			|| !Type.isPlainObject(payload.info)
			|| (!Type.isNumber(payload.serverFileId) && !Type.isStringFilled(payload.serverFileId))
		)
		{
			return false;
		}

		this.addFile(payload.info);

		const fileType = this.getFileType(payload.info);
		const node = this.#createNodeForFile(payload);

		const selection: RangeSelection = $getSelection() as RangeSelection;
		if ($isRangeSelection(selection) && fileType !== FileType.FILE && payload.inline !== true)
		{
			const focus: PointType = selection.focus;
			const focusNode: TextNode | ElementNode = focus.getNode();
			if (!selection.isCollapsed())
			{
				focusNode.selectEnd();
			}

			const parentNode: ParagraphNode | null = $findMatchingParent(
				focusNode,
				(parent: LexicalNode): parent is ParagraphNode => $isParagraphNode(parent),
			);

			if (parentNode === null)
			{
				$insertNodes([node]);
				if ($isRootOrShadowRoot(node.getParentOrThrow()))
				{
					$wrapNodeInElement(node, $createParagraphNode).selectEnd();
				}
			}
			else if (parentNode.isEmpty())
			{
				parentNode.append(node);
				node.selectEnd();
			}
			else
			{
				if (this.getEditor().getNewLineMode() === NewLineMode.LINE_BREAK)
				{
					parentNode.append($createLineBreakNode());
					parentNode.append(node);
				}
				else
				{
					const paragraph = $createParagraphNode();
					paragraph.append(node);
					parentNode.insertAfter(paragraph);
				}

				node.selectEnd();
			}
		}
		else
		{
			$insertNodes([node]);
			if ($isRootOrShadowRoot(node.getParentOrThrow()))
			{
				$wrapNodeInElement(node, $createParagraphNode).selectEnd();
			}
		}

		return true;
	}

	#registerListeners(): void
	{
		this.cleanUpRegister(
			this.getEditor().registerCommand(
				INSERT_FILE_COMMAND,
				this.#insertFile.bind(this),
				COMMAND_PRIORITY_EDITOR,
			),

			this.getEditor().registerCommand(
				REMOVE_FILE_COMMAND,
				(payload: RemoveFilePayload): boolean => {
					if (
						!Type.isPlainObject(payload)
						|| (!Type.isNumber(payload.serverFileId) && !Type.isStringFilled(payload.serverFileId))
					)
					{
						return false;
					}

					this.removeFile(payload.serverFileId, payload.skipHistoryStack);

					return true;
				},
				COMMAND_PRIORITY_EDITOR,
			),

			this.getEditor().registerCommand(
				GET_INSERTED_FILES_COMMAND,
				(fn: Function): boolean => {
					if (!Type.isFunction(fn))
					{
						return false;
					}

					const nodes = [...$nodesOfType(FileNode), ...$nodesOfType(FileImageNode), ...$nodesOfType(FileVideoNode)];

					fn(nodes);

					return true;
				},
				COMMAND_PRIORITY_EDITOR,
			),

			this.getEditor().registerCommand(
				ADD_FILE_COMMAND,
				(file: UploaderFileInfo): boolean => {
					this.addFile(file);

					return true;
				},
				COMMAND_PRIORITY_EDITOR,
			),

			this.getEditor().registerCommand(
				ADD_FILES_COMMAND,
				(files: UploaderFileInfo[]): boolean => {
					this.addFiles(files);

					return true;
				},
				COMMAND_PRIORITY_EDITOR,
			),
		);
	}
}
