/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */

import { Type, Dom, type JsonValue } from 'main.core';
import {
	$applyNodeReplacement,
	DecoratorNode,
	type DOMConversionMap,
	type DOMExportOutput,
	type EditorConfig,
	type LexicalNode,
	type LexicalUpdateJSON,
	type NodeKey,
	type SerializedLexicalNode,
	type LexicalEditor,
} from 'ui.lexical.core';
import { type UploaderFileInfo } from 'ui.uploader.core';

import { type DecoratorOptions } from '../../../types/decorator-options';
import { FileVideoComponent } from './file-video-component';

import './file-video.css';

export type SerializedFileVideoNode = SerializedLexicalNode & {
	serverFileId: string | number;
	info: UploaderFileInfo;
	width: number;
	height: number;
};

/** @memberof BX.UI.TextEditor.Plugins.File */
export class FileVideoNode extends DecoratorNode<DecoratorOptions>
{
	__serverFileId: string | number;
	__info: UploaderFileInfo;
	__width: number = 0;
	__height: number = 0;

	constructor(
		serverFileId: string | number = '',
		info: UploaderFileInfo = {} as UploaderFileInfo,
		width?: number | null,
		height?: number | null,
		key?: NodeKey,
	)
	{
		super(key);

		this.__serverFileId = serverFileId;
		this.__info = Type.isPlainObject(info) ? info : ({} as UploaderFileInfo);
		this.__width = (
			Type.isNumber(width) && width > 0
				? Math.round(width)
				: ((this.__info.previewWidth as number) > 0
					? (this.__info.previewWidth as number)
					: this.__width)
		);

		this.__height = (
			Type.isNumber(height) && height > 0
				? Math.round(height)
				: ((this.__info.previewHeight as number) > 0
					? (this.__info.previewHeight as number)
					: this.__height)
		);
	}

	static useDecoratorComponent = true;

	$config()
	{
		return this.config('file-video', { extends: DecoratorNode });
	}

	afterCloneFrom(prevNode: this): void
	{
		super.afterCloneFrom(prevNode);
		this.__serverFileId = prevNode.__serverFileId;
		this.__info = prevNode.__info;
		this.__width = prevNode.__width;
		this.__height = prevNode.__height;
	}

	updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedFileVideoNode>): this
	{
		const { serverFileId, info, width, height } = serializedNode;
		const writable = super.updateFromJSON(serializedNode).getWritable();
		writable.__serverFileId = serverFileId;
		writable.__info = Type.isPlainObject(info) ? info : ({} as UploaderFileInfo);
		writable.__width = (
			Type.isNumber(width) && width > 0
				? Math.round(width)
				: ((writable.__info.previewWidth as number) > 0
					? (writable.__info.previewWidth as number)
					: writable.__width)
		);

		writable.__height = (
			Type.isNumber(height) && height > 0
				? Math.round(height)
				: ((writable.__info.previewHeight as number) > 0
					? (writable.__info.previewHeight as number)
					: writable.__height)
		);

		return writable;
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

	setWidthAndHeight(width: number, height: number): void
	{
		const writable = this.getWritable();
		if (Type.isNumber(width))
		{
			writable.__width = Math.round(width);
		}

		if (Type.isNumber(height))
		{
			writable.__height = Math.round(height);
		}
	}

	getWidth(): number
	{
		const self = this.getLatest();

		return self.__width;
	}

	getHeight(): number
	{
		const self = this.getLatest();

		return self.__height;
	}

	static importDOM(): DOMConversionMap | null
	{
		return null;
	}

	exportDOM(): DOMExportOutput
	{
		return { element: null };
	}

	exportJSON(): SerializedFileVideoNode
	{
		return {
			...super.exportJSON(),
			info: this.__info,
			serverFileId: this.__serverFileId,
			width: this.getWidth(),
			height: this.getHeight(),
		};
	}

	createDOM(config: EditorConfig, editor: LexicalEditor): HTMLSpanElement
	{
		const div = document.createElement('span');

		if (Type.isStringFilled(config?.theme?.video?.container))
		{
			Dom.addClass(div, config.theme.video.container);
		}

		return div;
	}

	updateDOM(prevNode: FileVideoNode, anchor: HTMLElement, config: EditorConfig): boolean
	{
		return false;
	}

	decorate(editor: LexicalEditor, config: EditorConfig): DecoratorOptions
	{
		return {
			componentClass: FileVideoComponent,
			options: {
				src: this.__info.downloadUrl as string,
				width: this.getWidth(),
				height: this.getHeight(),
				maxWidth: this.getWidth(),
				maxHeight: this.getHeight(),
				// EditorConfig is not a JsonValue, but the options carry it as an opaque value
				config: config as unknown as JsonValue,
			},
		};
	}

	isInline(): true
	{
		return true;
	}
}

export function $createFileVideoNode(
	serverFileId: string | number,
	info: UploaderFileInfo = {} as UploaderFileInfo,
	width: number | null = null,
	height: number | null = null,
): FileVideoNode
{
	const node: FileVideoNode = new FileVideoNode(serverFileId, info, width, height);

	return $applyNodeReplacement(node);
}

export function $isFileVideoNode(node: LexicalNode | null | undefined): boolean
{
	return node instanceof FileVideoNode;
}
