import { addCustomEvent, Event, Reflection, Type } from 'main.core';

import {
	type SignatureHtmlEditor,
	type SignatureHtmlEditorBookmark,
} from './types';

type HtmlEditorSelection = {
	GetBookmark(): unknown | false,
	SetBookmark(bookmark: unknown): void,
	InsertNode(node: Node, range?: unknown): void,
	SetAfter(node: Node): void,
};

type HtmlEditorSynchro = {
	FullSyncFromIframe(): void,
};

type HtmlEditorInstance = {
	GetContent(): string,
	GetIframeDoc?(): Document,
	InsertHtml(html: string): void,
	Focus(): void,
	selection: HtmlEditorSelection,
	synchro: HtmlEditorSynchro,
	GetViewMode(): string,
	toolbar: {
		DisableWysiwygButtons(disabled: boolean): void,
	},
};

type HtmlEditorManager = {
	Get(id: string): HtmlEditorInstance | false | null | undefined,
};

type SavedBookmark = {
	editor: HtmlEditorInstance,
	selection: unknown,
};

type SignatureImageSize = 'small' | 'medium' | 'original';

const SIGNATURE_IMAGE_SIZES = new Set<SignatureImageSize>(['small', 'medium', 'original']);
const SIGNATURE_IMAGE_SRC_PATTERN = new RegExp(
	'^/bitrix/services/main/ajax\\.php\\?action=mail\\.api\\.signatureimage\\.view&id='
		+ '([\\da-f]{8}-[\\da-f]{4}-[1-8][\\da-f]{3}-[89ab][\\da-f]{3}-[\\da-f]{12})$',
	'i',
);

export class HtmlEditorAdapter implements SignatureHtmlEditor
{
	#editorInstanceId: string;
	#bookmarks: WeakMap<SignatureHtmlEditorBookmark, SavedBookmark> = new WeakMap();
	#signatureImages: Map<string, SignatureImageSize[]>;
	#markerObserver: MutationObserver | null = null;
	#observedDocument: Document | null = null;
	#lastVisualSelection: SavedBookmark | null = null;
	#visualFocusLost: boolean = false;
	#restoreFrame: number | null = null;
	#destroyed: boolean = false;
	#rememberSelection = (): void => {
		const editor = this.#resolveEditor();
		const selection = editor?.selection.GetBookmark();
		if (editor && selection)
		{
			this.#lastVisualSelection = { editor, selection };
		}
		this.#visualFocusLost = true;
	};

	#markVisualFocus = (): void => {
		this.#visualFocusLost = false;
	};

	constructor(editorInstanceId: string, initialContent: string = '')
	{
		this.#editorInstanceId = editorInstanceId;
		this.#signatureImages = this.#readSignatureImages(initialContent);
		this.#scheduleSignatureImageMarkerRestore();
	}

	destroy(): void
	{
		this.#destroyed = true;
		this.#unbindSelectionEvents();
		this.#markerObserver?.disconnect();
		this.#markerObserver = null;
		this.#observedDocument = null;
		this.#lastVisualSelection = null;
		if (this.#restoreFrame !== null)
		{
			cancelAnimationFrame(this.#restoreFrame);
			this.#restoreFrame = null;
		}
	}

	getContent(): string
	{
		const editor = this.#requireEditor();
		this.#captureSignatureImageMarkers(editor);
		const content = this.#serializeSignatureImageMarkers(editor.GetContent());
		this.#restoreSignatureImageMarkers(editor);

		return content;
	}

	insertHtml(html: string): void
	{
		this.#requireEditor().InsertHtml(html);
	}

	focus(): void
	{
		this.#requireEditor().Focus();
	}

	saveBookmark(): SignatureHtmlEditorBookmark | null
	{
		const editor = this.#resolveEditor();
		if (!editor)
		{
			return null;
		}

		const selection = this.#visualFocusLost && this.#lastVisualSelection?.editor === editor
			? this.#lastVisualSelection.selection
			: editor.selection.GetBookmark();
		if (!selection)
		{
			return null;
		}

		const bookmark = {} as SignatureHtmlEditorBookmark;
		this.#bookmarks.set(bookmark, { editor, selection });

		return bookmark;
	}

	restoreBookmark(bookmark: SignatureHtmlEditorBookmark): boolean
	{
		const savedBookmark = this.#resolveBookmark(bookmark);
		if (!savedBookmark)
		{
			return false;
		}

		savedBookmark.editor.selection.SetBookmark(savedBookmark.selection);
		savedBookmark.editor.Focus();

		return true;
	}

	insertNodeAtBookmark(bookmark: SignatureHtmlEditorBookmark, node: HTMLElement): boolean
	{
		const savedBookmark = this.#resolveBookmark(bookmark);
		if (!savedBookmark)
		{
			return false;
		}

		const { editor, selection } = savedBookmark;
		this.#registerSignatureImage(node);
		editor.selection.InsertNode(node, selection);
		editor.selection.SetAfter(node);
		this.#restoreSignatureImageMarkers(editor);

		return true;
	}

	#resolveBookmark(bookmark: SignatureHtmlEditorBookmark): SavedBookmark | null
	{
		const savedBookmark = this.#bookmarks.get(bookmark);
		if (!savedBookmark || this.#resolveEditor() !== savedBookmark.editor)
		{
			return null;
		}

		return savedBookmark;
	}

	#resolveEditor(): HtmlEditorInstance | null
	{
		const manager = Reflection.getClass('BXHtmlEditor') as unknown as HtmlEditorManager | null;

		return manager?.Get(this.#editorInstanceId) || null;
	}

	#readSignatureImages(content: string): Map<string, SignatureImageSize[]>
	{
		const registry = new Map<string, SignatureImageSize[]>();
		const template = document.createElement('template');
		template.innerHTML = content;
		for (const image of template.content.querySelectorAll('img'))
		{
			const marker = this.#readSignatureImage(image);
			if (marker)
			{
				registry.set(marker.id, [...(registry.get(marker.id) ?? []), marker.size]);
			}
		}

		return registry;
	}

	#registerSignatureImage(image: Element): void
	{
		const marker = this.#readSignatureImage(image);
		if (marker)
		{
			this.#signatureImages.set(
				marker.id,
				[...(this.#signatureImages.get(marker.id) ?? []), marker.size],
			);
		}
	}

	#captureSignatureImageMarkers(editor: HtmlEditorInstance): void
	{
		if (!Type.isFunction(editor.GetIframeDoc))
		{
			return;
		}

		const registry = new Map<string, SignatureImageSize[]>();
		for (const image of editor.GetIframeDoc().querySelectorAll('img'))
		{
			const marker = this.#readSignatureImage(image);
			if (marker)
			{
				registry.set(marker.id, [...(registry.get(marker.id) ?? []), marker.size]);
			}
		}
		this.#signatureImages = registry;
	}

	#readSignatureImage(image: Element): { id: string, size: SignatureImageSize } | null
	{
		const id = this.#idFromSrc(image.getAttribute('src'));
		const markerId = image.getAttribute('data-bx-mail-signature-image');
		const size = image.getAttribute('data-bx-mail-signature-image-size');
		if (
			id === null
			|| markerId?.toLowerCase() !== id
			|| !SIGNATURE_IMAGE_SIZES.has(size as SignatureImageSize)
		)
		{
			return null;
		}

		return { id, size: size as SignatureImageSize };
	}

	#idFromSrc(src: string | null): string | null
	{
		const match = SIGNATURE_IMAGE_SRC_PATTERN.exec(src ?? '');

		return match?.[1]?.toLowerCase() ?? null;
	}

	#restoreSignatureImageMarkers(editor: HtmlEditorInstance | null = this.#resolveEditor()): void
	{
		if (!editor || !Type.isFunction(editor.GetIframeDoc))
		{
			return;
		}

		const occurrences = new Map<string, number>();
		for (const image of editor.GetIframeDoc().querySelectorAll('img'))
		{
			const id = this.#idFromSrc(image.getAttribute('src'));
			const occurrence = id === null ? 0 : (occurrences.get(id) ?? 0);
			if (id !== null)
			{
				occurrences.set(id, occurrence + 1);
			}
			const size = this.#readSignatureImage(image)?.size
				?? (id === null ? null : this.#signatureImages.get(id)?.[occurrence]);
			if (
				id !== null
				&& size
				&& (
					image.getAttribute('data-bx-mail-signature-image') !== id
					|| image.getAttribute('data-bx-mail-signature-image-size') !== size
				)
			)
			{
				image.setAttribute('data-bx-mail-signature-image', id);
				image.setAttribute('data-bx-mail-signature-image-size', size);
			}
		}
	}

	#scheduleSignatureImageMarkerRestore(): void
	{
		let retryAllowed = true;
		const restore = (): void => {
			this.#restoreFrame = null;
			if (this.#destroyed)
			{
				return;
			}

			const editor = this.#resolveEditor();
			const iframeDocument = editor && Type.isFunction(editor.GetIframeDoc)
				? editor.GetIframeDoc()
				: null;
			if (!iframeDocument?.body)
			{
				if (retryAllowed)
				{
					retryAllowed = false;
					this.#restoreFrame = requestAnimationFrame(restore);
				}

				return;
			}

			this.#observeSignatureImageMarkers(iframeDocument);
			this.#restoreSignatureImageMarkers(editor);
		};

		restore();
	}

	#observeSignatureImageMarkers(iframeDocument: Document): void
	{
		if (this.#observedDocument === iframeDocument)
		{
			return;
		}

		this.#markerObserver?.disconnect();
		this.#unbindSelectionEvents();
		this.#observedDocument = iframeDocument;
		this.#lastVisualSelection = null;
		this.#visualFocusLost = false;
		Event.bind(iframeDocument, 'focusin', this.#markVisualFocus);
		Event.bind(iframeDocument, 'focusout', this.#rememberSelection);
		this.#markerObserver = new MutationObserver(() => {
			this.#restoreSignatureImageMarkers();
		});
		this.#markerObserver.observe(iframeDocument.body, {
			attributes: true,
			attributeFilter: [
				'src',
				'data-bx-mail-signature-image',
				'data-bx-mail-signature-image-size',
			],
			childList: true,
			subtree: true,
		});
	}

	#unbindSelectionEvents(): void
	{
		if (!this.#observedDocument)
		{
			return;
		}

		Event.unbind(this.#observedDocument, 'focusin', this.#markVisualFocus);
		Event.unbind(this.#observedDocument, 'focusout', this.#rememberSelection);
	}

	#serializeSignatureImageMarkers(content: string): string
	{
		const template = document.createElement('template');
		template.innerHTML = content;
		const occurrences = new Map<string, number>();
		for (const image of template.content.querySelectorAll('img'))
		{
			const id = this.#idFromSrc(image.getAttribute('src'));
			const occurrence = id === null ? 0 : (occurrences.get(id) ?? 0);
			if (id !== null)
			{
				occurrences.set(id, occurrence + 1);
			}
			const size = id === null ? null : this.#signatureImages.get(id)?.[occurrence];
			if (id === null || !size)
			{
				continue;
			}

			const marker = document.createElement('img');
			marker.setAttribute('src', image.getAttribute('src') as string);
			marker.setAttribute('data-bx-mail-signature-image', id);
			marker.setAttribute('data-bx-mail-signature-image-size', size);
			image.replaceWith(marker);
		}

		return template.innerHTML;
	}

	syncToolbar(): void
	{
		const editor = this.#resolveEditor();
		if (!editor)
		{
			return;
		}

		editor.toolbar.DisableWysiwygButtons(editor.GetViewMode() === 'code');
	}

	subscribeToViewModeChanges(): void
	{
		const editor = this.#resolveEditor();
		if (editor)
		{
			addCustomEvent(editor, 'OnSetViewAfter', () => this.syncToolbar());
		}
	}

	#requireEditor(): HtmlEditorInstance
	{
		const editor = this.#resolveEditor();
		if (!editor)
		{
			throw new Error(`HTML editor ${this.#editorInstanceId} is not initialized`);
		}

		return editor;
	}
}
