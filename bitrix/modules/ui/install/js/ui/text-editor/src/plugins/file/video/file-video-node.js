/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */

import { Type, Dom } from 'main.core';

import {
	$applyNodeReplacement,
	DecoratorNode,
	type DOMConversionMap,
	type DOMExportOutput,
	type EditorConfig,
	type LexicalNode,
	type NodeKey,
	type SerializedDecoratorNode,
	type LexicalEditor,
} from 'ui.lexical.core';

import { FileVideoComponent } from './file-video-component';

import type { UploaderFileInfo } from 'ui.uploader.core';
import type { DecoratorOptions } from '../../../types/decorator-options';

export type SerializedFileVideoNode = SerializedDecoratorNode & {
	serverFileId: string | number,
	info: UploaderFileInfo,
};

import './file-video.css';

/** @memberof BX.UI.TextEditor.Plugins.File */
export class FileVideoNode extends DecoratorNode
{
	__serverFileId: string | number;
	__info: UploaderFileInfo;

	constructor(
		serverFileId: string | number,
		info: UploaderFileInfo,
		key?: NodeKey,
	)
	{
		super(key);

		this.__serverFileId = serverFileId;
		this.__info = Type.isPlainObject(info) ? info : {};
	}

	static useDecoratorComponent = true;

	static getType(): string
	{
		return 'file-video';
	}

	static clone(node: FileVideoNode): FileVideoNode
	{
		return new FileVideoNode(node.__serverFileId, node.__info, node.__key);
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

	static importJSON(serializedNode: SerializedFileVideoNode): FileVideoNode
	{
		return $createFileVideoNode(serializedNode.serverFileId, serializedNode.info);
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
			info: this.__info,
			serverFileId: this.__serverFileId,
			type: 'file-video',
			version: 1,
		};
	}

	createDOM(config: EditorConfig, editor: LexicalEditor): HTMLSpanElement
	{
		const div = document.createElement('span');
		if (Type.isStringFilled(config?.theme?.file?.video))
		{
			Dom.addClass(div, config.theme.file.video);
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
			options: {},
		};
	}

	isInline(): true
	{
		return true;
	}
}

export function $createFileVideoNode(serverFileId: string | number, info: UploaderFileInfo = {}): FileVideoNode
{
	const node: FileVideoNode = new FileVideoNode(serverFileId, info);

	return $applyNodeReplacement(node);
}

export function $isFileVideoNode(node: LexicalNode | null | undefined): boolean
{
	return node instanceof FileVideoNode;
}
