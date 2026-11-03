/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */

import { Type, Dom, type JsonValue } from 'main.core';
import {
	DecoratorNode,
	type DOMConversionMap,
	type DOMConversionOutput,
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
import { FileImageComponent } from './file-image-component';

import './file-image.css';

type ImageThemeClasses = {
	container: string;
};

export type SerializedFileImageNode = SerializedLexicalNode & {
	serverFileId: string | number;
	info: UploaderFileInfo;
	alt?: string;
	width: number;
	height: number;
};

/** an attachment always has a name, and it describes the image better than nothing at all */
function getDefaultAlt(info: UploaderFileInfo): string
{
	return Type.isStringFilled(info?.name) ? (info.name as string).trim() : '';
}

/** @memberof BX.UI.TextEditor.Plugins.File */
export class FileImageNode extends DecoratorNode<DecoratorOptions>
{
	__serverFileId: string | number;
	__info: UploaderFileInfo;
	// an empty alt is meaningful: it marks the image as decorative
	__alt: string;
	__width: number;
	__height: number;

	constructor(
		serverFileId: string | number = '',
		info: UploaderFileInfo = {} as UploaderFileInfo,
		width?: number | null,
		height?: number | null,
		alt?: string | null,
		key?: NodeKey,
	)
	{
		super(key);

		this.__serverFileId = serverFileId;
		this.__info = Type.isPlainObject(info) ? info : ({} as UploaderFileInfo);
		this.__alt = Type.isString(alt) ? alt.trim() : getDefaultAlt(this.__info);
		this.__width = Type.isNumber(width) && width > 0 ? Math.round(width) : (this.__info.previewWidth as number);
		this.__height = Type.isNumber(height) && height > 0 ? Math.round(height) : (this.__info.previewHeight as number);
	}

	static useDecoratorComponent = true;

	$config()
	{
		return this.config('file-image', { extends: DecoratorNode });
	}

	afterCloneFrom(prevNode: this): void
	{
		super.afterCloneFrom(prevNode);
		this.__serverFileId = prevNode.__serverFileId;
		this.__info = prevNode.__info;
		this.__alt = prevNode.__alt;
		this.__width = prevNode.__width;
		this.__height = prevNode.__height;
	}

	updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedFileImageNode>): this
	{
		const { serverFileId, info, alt, width, height } = serializedNode;
		const writable = super.updateFromJSON(serializedNode).getWritable();
		writable.__serverFileId = serverFileId;
		writable.__info = Type.isPlainObject(info) ? info : ({} as UploaderFileInfo);
		writable.__alt = Type.isString(alt) ? alt.trim() : getDefaultAlt(writable.__info);
		writable.__width = Type.isNumber(width) && width > 0 ? Math.round(width) : (writable.__info.previewWidth as number);
		writable.__height = Type.isNumber(height) && height > 0
			? Math.round(height)
			: (writable.__info.previewHeight as number);

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

	getAlt(): string
	{
		const self = this.getLatest();

		return self.__alt;
	}

	setAlt(alt: string): this
	{
		const writable = this.getWritable();
		writable.__alt = Type.isString(alt) ? alt.trim() : '';

		return writable;
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

	isResized(): boolean
	{
		return this.__info.previewWidth !== this.getWidth() || this.__info.previewHeight !== this.getHeight();
	}

	static importDOM(): DOMConversionMap | null
	{
		return {
			img: (domNode: HTMLElement) => {
				if (!domNode.hasAttribute('data-file-image-id'))
				{
					return null;
				}

				return {
					conversion: (img: HTMLElement): DOMConversionOutput | null => {
						const { fileImageId, fileImageInfo } = img.dataset;
						let info = null;
						try
						{
							info = JSON.parse(fileImageInfo as string);
						}
						catch
						{
							return null;
						}

						// a missing alt attribute is not the same as an empty one: only the
						// latter says the image is decorative and should stay unnamed
						const alt = img.hasAttribute('alt') ? (img as HTMLImageElement).alt : null;
						const node = $createFileImageNode(fileImageId as string, info, null, null, alt);

						return {
							node,
						};
					},
					priority: 1,
				};
			},
		};
	}

	exportDOM(): DOMExportOutput
	{
		return { element: null };
	}

	exportJSON(): SerializedFileImageNode
	{
		return {
			...super.exportJSON(),
			info: this.__info,
			serverFileId: this.__serverFileId,
			alt: this.getAlt(),
			width: this.getWidth(),
			height: this.getHeight(),
		};
	}

	createDOM(config: EditorConfig, editor: LexicalEditor): HTMLSpanElement
	{
		const span = document.createElement('span');
		if (Type.isStringFilled((config?.theme?.image as unknown as ImageThemeClasses | undefined)?.container))
		{
			Dom.addClass(span, (config.theme.image as unknown as ImageThemeClasses).container);
		}

		return span;
	}

	updateDOM(prevNode: FileImageNode, anchor: HTMLElement, config: EditorConfig): boolean
	{
		return false;
	}

	decorate(editor: LexicalEditor, config: EditorConfig): DecoratorOptions
	{
		return {
			componentClass: FileImageComponent,
			options: {
				src: this.__info.previewUrl as string,
				alt: this.getAlt(),
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

export function $createFileImageNode(
	serverFileId: string | number,
	info: UploaderFileInfo = {} as UploaderFileInfo,
	width: number | null = null,
	height: number | null = null,
	alt: string | null = null,
): FileImageNode
{
	return new FileImageNode(serverFileId, info, width, height, alt);
}

export function $isFileImageNode(node: LexicalNode | null | undefined): boolean
{
	return node instanceof FileImageNode;
}
