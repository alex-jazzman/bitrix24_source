/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */
import {
	$applyNodeReplacement,
	DecoratorNode,
	type DOMConversionMap,
	type DOMExportOutput,
	type EditorConfig,
	type LexicalEditor,
	type SerializedLexicalNode,
	type LexicalNode,
} from 'ui.lexical.core';
import { Text, Type } from 'main.core';
import { PLACEHOLDER_TAG_NAME } from '../../../service/placeholder-service';

export type SerializedPlaceholderNode = SerializedLexicalNode & {
	code: string,
	caption: string,
	removable: boolean,
	copyable: boolean,
	customData: { [key: string]: string },
};

export class PlaceholderNode extends DecoratorNode<null>
{
	__code: string;
	__caption: string;
	__removable: boolean = true;
	__copyable: boolean = true;
	__customData: { [key: string]: string } = {};

	static getType(): string
	{
		return PLACEHOLDER_TAG_NAME;
	}

	static clone(node: PlaceholderNode): PlaceholderNode
	{
		return new PlaceholderNode(
			node.__code,
			node.__caption,
			node.__removable,
			node.__copyable,
			node.__customData,
			node.__key,
		);
	}

	constructor(
		code: string,
		caption: string,
		removable?: any,
		copyable?: any,
		customData?: { [key: string]: string },
		key?: string,
	)
	{
		super(key);

		this.__code = code;
		this.__caption = caption;

		if (!Type.isNil(removable))
		{
			this.__removable = Text.toBoolean(removable);
		}

		if (!Type.isNil(copyable))
		{
			this.__copyable = Text.toBoolean(copyable);
		}

		if (Type.isPlainObject(customData))
		{
			// Strip reserved keys so they cannot hijack serialization attributes.
			const { code: _omitCode, removable: _omitRemovable, copyable: _omitCopyable, ...filtered } = customData;
			this.__customData = filtered;
		}
	}

	getCode(): string
	{
		return this.getLatest().__code;
	}

	getCaption(): string
	{
		return this.getLatest().__caption;
	}

	isRemovable(): boolean
	{
		return this.getLatest().__removable;
	}

	isCopyable(): boolean
	{
		return this.getLatest().__copyable;
	}

	getCustomData(): { [key: string]: string }
	{
		return { ...this.getLatest().__customData };
	}

	createDOM(config: EditorConfig, editor: LexicalEditor): HTMLElement
	{
		const span = document.createElement('span');
		span.className = 'messageservice-message-editor__placeholder-pill';
		span.textContent = this.__caption;

		return span;
	}

	updateDOM(prevNode: any, dom: HTMLElement, config: EditorConfig): boolean
	{
		return false;
	}

	exportDOM(editor: LexicalEditor): DOMExportOutput
	{
		const span = document.createElement('span');
		span.setAttribute('data-placeholder-code', this.__code);
		span.setAttribute('data-placeholder-caption', this.__caption);

		if (!this.__removable)
		{
			span.setAttribute('data-placeholder-removable', 'false');
		}

		if (!this.__copyable)
		{
			span.setAttribute('data-placeholder-copyable', 'false');
		}

		span.setAttribute('data-placeholder-custom-data', JSON.stringify(this.__customData));
		span.textContent = this.__caption;

		return { element: span };
	}

	static importDOM(): DOMConversionMap | null
	{
		return {
			span: (domNode: HTMLElement) => {
				if (!domNode.hasAttribute('data-placeholder-code'))
				{
					return null;
				}

				return {
					conversion: (element: HTMLElement) => {
						const code = element.getAttribute('data-placeholder-code') ?? '';
						const caption = element.getAttribute('data-placeholder-caption') ?? code;
						const removable = element.getAttribute('data-placeholder-removable');
						const copyable = element.getAttribute('data-placeholder-copyable');
						const raw = element.getAttribute('data-placeholder-custom-data');
						let customData = {};
						if (raw)
						{
							try
							{
								customData = JSON.parse(raw);
							}
							catch
							{
								// invalid JSON — fall back to empty custom data
							}
						}

						return {
							node: $createPlaceholderNode({ code, caption, removable, copyable, customData }),
						};
					},
					priority: 1,
				};
			},
		};
	}

	static importJSON(serializedNode: SerializedPlaceholderNode): PlaceholderNode
	{
		return $createPlaceholderNode({
			code: serializedNode.code,
			caption: serializedNode.caption,
			removable: serializedNode.removable,
			copyable: serializedNode.copyable,
			customData: serializedNode.customData,
		});
	}

	exportJSON(): SerializedPlaceholderNode
	{
		return {
			type: PLACEHOLDER_TAG_NAME,
			version: 1,
			code: this.__code,
			caption: this.__caption,
			removable: this.__removable,
			copyable: this.__copyable,
			customData: this.__customData,
		};
	}

	getTextContent(includeDirectionless?: boolean): string
	{
		return this.__caption;
	}

	isInline(): boolean
	{
		return true;
	}

	isKeyboardSelectable(): boolean
	{
		return this.__removable;
	}

	isIsolated(): boolean
	{
		return true;
	}

	decorate(editor: LexicalEditor, config: EditorConfig): null
	{
		return null;
	}

	remove(preserveEmptyParent?: boolean): void
	{
		if (!this.__removable)
		{
			return;
		}

		super.remove(preserveEmptyParent);
	}

	replace<N: LexicalNode>(replaceWith: N): N
	{
		if (!this.__removable)
		{
			return replaceWith;
		}

		return super.replace(replaceWith);
	}
}

export function $createPlaceholderNode({
	code,
	caption,
	removable,
	copyable,
	customData,
	key,
} = {}): PlaceholderNode
{
	return $applyNodeReplacement(
		new PlaceholderNode(code, caption, removable, copyable, customData, key),
	);
}

export function $isPlaceholderNode(node: ?Object): boolean
{
	return node instanceof PlaceholderNode;
}
