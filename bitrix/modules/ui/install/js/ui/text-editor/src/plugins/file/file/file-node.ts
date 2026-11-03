/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */

import { Type, Dom } from 'main.core';
import {
	TextNode,
	type DOMConversionMap,
	type DOMConversionOutput,
	type DOMExportOutput,
	type EditorConfig,
	type LexicalNode,
	type LexicalUpdateJSON,
	type NodeKey,
	type SerializedTextNode,
	type LexicalEditor,
} from 'ui.lexical.core';
import { type UploaderFileInfo } from 'ui.uploader.core';

import './file.css';

export type SerializedFileNode = SerializedTextNode & {
	serverFileId: string | number;
	info: UploaderFileInfo;
};

/** @memberof BX.UI.TextEditor.Plugins.File */
export class FileNode extends TextNode
{
	__serverFileId: string | number;
	__info: UploaderFileInfo;

	constructor(serverFileId: string | number = '', info: UploaderFileInfo = {} as UploaderFileInfo, key?: NodeKey)
	{
		const fileInfo = Type.isPlainObject(info) ? info : ({} as UploaderFileInfo);

		super(fileInfo.name || '', key);

		this.__serverFileId = serverFileId;
		this.__info = fileInfo;
	}

	$config()
	{
		return this.config('file', { extends: TextNode });
	}

	afterCloneFrom(prevNode: this): void
	{
		super.afterCloneFrom(prevNode);
		this.__serverFileId = prevNode.__serverFileId;
		this.__info = prevNode.__info;
	}

	getId(): string | number
	{
		return this.__serverFileId;
	}

	getServerFileId(): string | number
	{
		return this.__serverFileId;
	}

	getInfo(): UploaderFileInfo
	{
		return this.__info;
	}

	getName(): string
	{
		return this.__info.name || 'unknown';
	}

	setServerFileId(serverFileId: string | number): this
	{
		const writable = this.getWritable();
		writable.__serverFileId = serverFileId;

		return writable;
	}

	setInfo(info: UploaderFileInfo): this
	{
		const writable = this.getWritable();
		writable.__info = Type.isPlainObject(info) ? info : ({} as UploaderFileInfo);

		return writable;
	}

	updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedFileNode>): this
	{
		return super.updateFromJSON(serializedNode)
			.setServerFileId(serializedNode.serverFileId)
			.setInfo(serializedNode.info);
	}

	static importDOM(): DOMConversionMap | null
	{
		return {
			span: (domNode: HTMLElement) => {
				if (!domNode.hasAttribute('data-file-id'))
				{
					return null;
				}

				return {
					conversion: (span: HTMLSpanElement): DOMConversionOutput | null => {
						const { fileId, fileInfo } = domNode.dataset;
						let info = null;
						try
						{
							info = JSON.parse(fileInfo as string);
						}
						catch
						{
							return null;
						}

						const node = $createFileNode(fileId as string, info);

						return { node };
					},
					priority: 1,
				};
			},
		};
	}

	exportDOM(): DOMExportOutput
	{
		const element = document.createElement('span');
		element.textContent = this.getName();
		element.setAttribute('data-file-id', this.__serverFileId as string);
		element.setAttribute('data-file-info', JSON.stringify(this.__info));

		return { element };
	}

	exportJSON(): SerializedFileNode
	{
		return {
			...super.exportJSON(),
			info: this.__info,
			serverFileId: this.__serverFileId,
		};
	}

	createDOM(config: EditorConfig, editor: LexicalEditor): HTMLSpanElement
	{
		const span = document.createElement('span');
		if (Type.isStringFilled(config?.theme?.file))
		{
			Dom.addClass(span, config.theme.file);
		}

		span.textContent = this.getName();

		return span;
	}

	updateDOM(prevNode: FileNode, anchor: HTMLElement, config: EditorConfig): boolean
	{
		return false;
	}
}

export function $createFileNode(
	serverFileId: string | number,
	info: UploaderFileInfo = {} as UploaderFileInfo,
): FileNode
{
	return new FileNode(serverFileId, info).setMode('token');
}

export function $isFileNode(node: LexicalNode | null | undefined): boolean
{
	return node instanceof FileNode;
}
