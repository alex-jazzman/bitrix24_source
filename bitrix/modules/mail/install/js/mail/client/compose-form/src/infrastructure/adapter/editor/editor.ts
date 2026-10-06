import { Dom, Event, Text, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { inject, type InjectionKey } from 'ui.vue3';

import { BodyNodePrefix } from '../../../const';
import {
	type BodyNodeIds,
	type BodyPosition,
	type ComposeEditorAdapter,
	type EditorAdapterParams,
	type EditorAttachment,
	type EditorUnsubscribe,
	type RestoredEditorAttachment,
	EditorViewMode,
} from './types';

type HtmlEditorSelection = {
	InsertNode(node: Node): void,
	SetAfter(node: Node): void,
};

type HtmlEditorSynchro = {
	FullSyncFromIframe(): void,
};

/** CoPilot of the body: the instance and the parameters it was built on. */
type HtmlEditorCopilot = {
	copilot?: {
		setContextParameters?(parameters: Record<string, unknown>): void,
	},
	copilotParams?: {
		contextParameters?: Record<string, unknown>,
	},
};

type HtmlEditorInstance = {
	GetContent(): string,
	SetContent(html: string, parse?: boolean): void,
	GetViewMode(): string,
	GetIframeDoc(): Document | null,
	Focus(setToEnd?: boolean): void,
	Parse(html: string, parseBxNodes?: boolean, format?: boolean): string,
	selection: HtmlEditorSelection,
	synchro: HtmlEditorSynchro,
	iframeView?: {
		copilot?: HtmlEditorCopilot,
	},
};

type HtmlEditorRegistry = {
	Get(editorId: string): HtmlEditorInstance | false | null | undefined,
};

type PostFormHandler = {
	getContainer(): HTMLElement | null,
	isReady: boolean,
};

type PostFormRegistry = {
	getHandler(editorId: string): PostFormHandler | null | undefined,
};

type LegacyWindow = Window & {
	BXHtmlEditor?: HtmlEditorRegistry,
	LHEPostForm?: PostFormRegistry,
};

type UploaderFile = {
	getId(): string,
	getName(): string,
	getSize(): number,
	getSizeFormatted(): string,
	getCustomData(property: string): unknown,
};

type Uploader = {
	removeFile(fileId: string): void,
	addFiles(files: Array<{ id: string, serverFileId: string, name?: string, size?: number }>): UploaderFile[],
};

type UploaderControl = {
	canCreateDocuments(): boolean,
	getFiles(): UploaderFile[],
	getUploader(): Uploader,
	nextTick(): Promise<void>,
	showUploaderPanel(): void,
	showDocumentPanel(): void,
};

type DiskUploaderGlobal = {
	Disk?: {
		Uploader?: {
			UserFieldControl?: {
				getById(controlId: string): UploaderControl | null,
			},
		},
	},
};

type SidePanelSlider = {
	canCloseByEsc(): boolean,
	close(): void,
};

type TopBx = {
	SidePanel?: {
		Instance?: {
			getTopSlider?(): SidePanelSlider | null,
		},
	},
};

/** Events of the editor instance. */
const EditorEvent = Object.freeze({
	ViewChanged: 'OnSetViewAfter',
	BodyClick: 'OnIframeClick',
});

/**
 * Events of `main.post.form`. Readiness comes from the handler itself, the rest from the node of the
 * server-rendered markup.
 */
const PostFormEvent = Object.freeze({
	Ready: 'OnEditorIsLoaded',
	Show: 'OnShowLHE',
	Shown: 'OnAfterShowLHE',
	Hidden: 'OnAfterHideLHE',
});

const UploaderEvent = Object.freeze({
	FileAdd: 'BX.Disk.Uploader.Integration:Item:onAdd',
	FileRemove: 'BX.Disk.Uploader.Integration:Item:onRemove',
});

const ShowMode = 'justShow';

/**
 * The toolbar item carries the click handler of CoPilot, the check of the tariff and the return of the focus;
 * the icon node inside it carries none of that.
 */
const CopilotButtonSelector = '[data-id="copilot"]';
const UploaderPanelSelector = '.disk-user-field-control';

const BodyPlaceholderAttribute = 'placeholder';
const BodyPlaceholderVisibleAttribute = 'data-mail-compose-placeholder-visible';

const noop = (): void => {};

/**
 * The body of the editor holds the quoted message next to the blocks of the form, and the sanitizer of an
 * incoming letter keeps its `id` attributes. A suffix unique to the instance keeps a quoted message from
 * answering for the signature or for the quote of this form; the old form did the same
 * (`main.mail.form/templates/.default/script.js`).
 */
function buildBodyNodeIds(): BodyNodeIds
{
	const suffix = Text.getRandom();

	return {
		signature: `${BodyNodePrefix.Signature}-${suffix}`,
		quote: `${BodyNodePrefix.Quote}-${suffix}`,
	};
}

function hasMeaningfulContent(node: Node, ignoredNodes: Set<Node>): boolean
{
	if (ignoredNodes.has(node))
	{
		return false;
	}

	if (node.nodeType === Node.TEXT_NODE)
	{
		return (node.textContent ?? '').replaceAll('\u00A0', ' ').trim() !== '';
	}

	if (node.nodeType !== Node.ELEMENT_NODE)
	{
		return false;
	}

	if (['BR', 'WBR'].includes(node.nodeName))
	{
		return false;
	}

	if (['IMG', 'VIDEO', 'AUDIO', 'IFRAME', 'TABLE', 'HR'].includes(node.nodeName))
	{
		return true;
	}

	for (const child of node.childNodes)
	{
		if (hasMeaningfulContent(child, ignoredNodes))
		{
			return true;
		}
	}

	return false;
}

export const composeEditorKey: InjectionKey<ComposeEditorAdapter> = Symbol('mail-compose-form-editor');

/** Injected without a default on purpose: a missing adapter is a mounting error, not a case to fall back on. */
export function useComposeEditor(): ComposeEditorAdapter
{
	const editor = inject(composeEditorKey);
	if (!editor)
	{
		throw new Error('Compose form editor adapter was not provided.');
	}

	return editor;
}

/**
 * `BXHtmlEditor`, `LHEPostForm` and the Disk uploader control are reached through the resolvers of this class
 * alone, and every subscription it makes goes away with `destroy()`.
 */
export class EditorAdapter implements ComposeEditorAdapter
{
	readonly editorId: string;
	readonly bodyNodes: BodyNodeIds;

	#uploaderControlId: string;
	#closeForm: () => void;
	#teardown: Set<EditorUnsubscribe> = new Set();
	#systemNodeIds: Set<string>;
	#systemNodeRegistrations: Map<string, number>;
	#initialBody: string | null = null;
	#isInitialBodySet: boolean = false;
	#isDestroyed: boolean = false;

	constructor(params: EditorAdapterParams)
	{
		this.editorId = params.editorId;
		this.bodyNodes = buildBodyNodeIds();
		this.#systemNodeIds = new Set(Object.values(this.bodyNodes));
		this.#systemNodeRegistrations = new Map(
			[...this.#systemNodeIds].map((nodeId: string): [string, number] => [nodeId, 1]),
		);
		this.#uploaderControlId = params.uploaderControlId ?? '';
		// Set before the readiness is subscribed: a ready editor binds the keys inside this constructor.
		this.#closeForm = params.closeForm ?? noop;
		this.subscribeReady(this.#handleReady);
	}

	getHostNode(): HTMLElement | null
	{
		return this.#resolveHandler()?.getContainer() ?? null;
	}

	show(): boolean
	{
		const node = this.getHostNode();
		if (!node)
		{
			return false;
		}

		EventEmitter.emit(node, PostFormEvent.Show, [ShowMode]);

		return true;
	}

	/** The caret is left where it stands, so the focus does not move it to the end of the body. */
	focus(): boolean
	{
		const editor = this.#resolveEditor();
		if (!editor)
		{
			return false;
		}

		editor.Focus(false);

		return true;
	}

	getBody(): string
	{
		const content = this.#resolveEditor()?.GetContent();

		return Type.isString(content) ? content : '';
	}

	setBody(html: string): boolean
	{
		const editor = this.#resolveEditor();
		if (!editor)
		{
			return false;
		}

		// The editor parses the content itself: the `bxacid:<id>` marks and the folding of inline images back
		// into attachments belong to it.
		editor.SetContent(html, true);
		editor.synchro.FullSyncFromIframe();

		return true;
	}

	/**
	 * The body is written once: a repeated call would wipe the typed text. Until the editor is ready the value
	 * waits and goes in from `#handleReady`, subscribed by the constructor before any part of the form gets the
	 * adapter, so the initial body is in place before the signature node is written on that same readiness.
	 */
	setInitialBody(html: string): boolean
	{
		if (this.#isInitialBodySet)
		{
			return false;
		}

		this.#initialBody = html;

		return this.#isReady() && this.#applyInitialBody();
	}

	hasUserContent(): boolean
	{
		const body = this.#resolveEditor()?.GetIframeDoc()?.body;
		if (!body)
		{
			return false;
		}

		const systemNodes = this.#getSystemNodes(body);

		for (const node of body.childNodes)
		{
			if (hasMeaningfulContent(node, systemNodes))
			{
				return true;
			}
		}

		return false;
	}

	/**
	 * Replaces only nodes owned by the user and leaves every registered service block in place. The body
	 * of the frame is the letter on the visual surface alone: in another view mode the text the user
	 * edits lives elsewhere, and a write here would be synchronised over it.
	 */
	replaceUserContent(html: string): boolean
	{
		const editor = this.#resolveEditor();
		const body = editor?.GetIframeDoc()?.body;
		if (!editor || !body || editor.GetViewMode() !== EditorViewMode.Visual)
		{
			return false;
		}

		const systemNodes: HTMLElement[] = [];
		for (const node of body.querySelectorAll<HTMLElement>(':scope > [id]'))
		{
			if (this.#systemNodeIds.has(node.id))
			{
				systemNodes.push(node);
				Dom.remove(node);
			}
		}

		Dom.adjust(body, { html });
		for (const node of systemNodes)
		{
			Dom.append(node, body);
		}

		editor.synchro.FullSyncFromIframe();

		return true;
	}

	insertHtmlAtCaret(html: string): boolean
	{
		const editor = this.#resolveEditor();
		const bodyDocument = editor?.GetIframeDoc();
		if (!editor || !bodyDocument || editor.GetViewMode() !== EditorViewMode.Visual)
		{
			return false;
		}

		const fragment = this.#createHtmlFragment(bodyDocument, html);
		const lastNode = fragment.lastChild;
		if (!lastNode)
		{
			return false;
		}

		editor.Focus();
		editor.selection.InsertNode(fragment);
		this.#placeCaretAfter(editor, lastNode);
		editor.synchro.FullSyncFromIframe();

		return true;
	}

	registerSystemNode(nodeId: string): EditorUnsubscribe
	{
		const registrations = this.#systemNodeRegistrations.get(nodeId) ?? 0;
		this.#systemNodeRegistrations.set(nodeId, registrations + 1);
		this.#systemNodeIds.add(nodeId);

		return (): void => {
			const remaining = (this.#systemNodeRegistrations.get(nodeId) ?? 1) - 1;
			if (remaining > 0)
			{
				this.#systemNodeRegistrations.set(nodeId, remaining);

				return;
			}

			this.#systemNodeRegistrations.delete(nodeId);
			this.#systemNodeIds.delete(nodeId);
		};
	}

	/** The body is a document of its own, so the nodes the form owns in it are reached through the editor. */
	getBodyNode(nodeId: string): HTMLElement | null
	{
		return this.#resolveEditor()?.GetIframeDoc()?.getElementById(nodeId) ?? null;
	}

	insertNode(node: HTMLElement, position: BodyPosition): boolean
	{
		const editor = this.#resolveEditor();
		if (!editor)
		{
			return false;
		}

		if (position.at === 'caret')
		{
			return this.#insertAtCaret(editor, node);
		}

		if (position.at === 'before')
		{
			if (!position.anchor.parentNode)
			{
				return false;
			}

			Dom.insertBefore(node, position.anchor);
		}
		else
		{
			const body = editor.GetIframeDoc()?.body;
			if (!body)
			{
				return false;
			}

			Dom.append(node, body);
		}

		this.#placeCaretAfter(editor, node);
		editor.synchro.FullSyncFromIframe();

		return true;
	}

	getFiles(): EditorAttachment[]
	{
		return this.#resolveUploaderControl()?.getFiles().map((file: UploaderFile): EditorAttachment => {
			const id = Number(file.getCustomData('objectId'));

			return {
				fileId: file.getId(),
				id: Number.isInteger(id) && id > 0 ? id : null,
				name: file.getName(),
				size: file.getSize(),
				sizeFormatted: file.getSizeFormatted(),
			};
		}) ?? [];
	}

	async replaceFiles(files: RestoredEditorAttachment[]): Promise<boolean>
	{
		const control = this.#resolveUploaderControl();
		if (!control)
		{
			return files.length === 0;
		}

		control.getFiles().forEach((file: UploaderFile): void => {
			control.getUploader().removeFile(file.getId());
		});
		control.getUploader().addFiles(files.map((file: RestoredEditorAttachment) => {
			const id = `n${file.id}`;

			return { id, serverFileId: id, name: file.name, size: file.size };
		}));
		await control.nextTick();

		return true;
	}

	/**
	 * The uploader control owns the whole attachment set. The inline image of the file goes out of the body on
	 * its own: the integration of the uploader with the editor cleans those nodes, the ones of the quote too.
	 */
	removeFile(fileId: string): boolean
	{
		const control = this.#resolveUploaderControl();
		if (!control)
		{
			return false;
		}

		control.getUploader().removeFile(fileId);

		return true;
	}

	/** The same panel the file button of the toolbar opens, and the only door to it. */
	showUploader(): boolean
	{
		const control = this.#resolveUploaderControl();
		if (!control)
		{
			return false;
		}

		control.showUploaderPanel();
		this.#scrollPanelIntoView(control);

		return true;
	}

	/**
	 * The button of the toolbar answers for what happens next, the tariff of the portal included, so the form
	 * asks for no flag of its own. A body that carries no such button is a normal `false` and not an error.
	 */
	showCopilot(): boolean
	{
		const button = this.#resolveCopilotButton();
		if (!button)
		{
			return false;
		}

		button.click();

		return true;
	}

	/** The Disk control owns the document-service picker, so the new footer delegates the action to it. */
	showCreateDocument(): boolean
	{
		const control = this.#resolveUploaderControl();
		if (!control || !control.canCreateDocuments())
		{
			return false;
		}

		control.showDocumentPanel();
		this.#scrollPanelIntoView(control);

		return true;
	}

	/** Serialised by the parser of the editor and by nothing else. */
	parseQuote(html: string): string | null
	{
		const parsed = this.#resolveEditor()?.Parse(html, true, false);

		return Type.isString(parsed) ? parsed : null;
	}

	/**
	 * CoPilot of the body is built with the editor and only when the portal has it enabled, so a body without
	 * one is a normal `false` rather than an error.
	 */
	updateCopilotContext(parameters: Record<string, unknown>): boolean
	{
		const bodyCopilot = this.#resolveEditor()?.iframeView?.copilot;
		const setContextParameters = bodyCopilot?.copilot?.setContextParameters;
		if (!bodyCopilot || !Type.isFunction(setContextParameters))
		{
			return false;
		}

		setContextParameters.call(bodyCopilot.copilot, {
			...bodyCopilot.copilotParams?.contextParameters,
			...parameters,
		});

		return true;
	}

	/** The readiness event may have already passed, so a ready editor calls the handler at once. */
	subscribeReady(handler: () => void): EditorUnsubscribe
	{
		if (this.#isReady())
		{
			handler();

			return noop;
		}

		return this.#subscribeTo(this.#resolveHandler(), PostFormEvent.Ready, handler);
	}

	subscribeVisibilityChange(handler: (isShown: boolean) => void): EditorUnsubscribe
	{
		const node = this.getHostNode();
		const unsubscribeShown = this.#subscribeTo(node, PostFormEvent.Shown, (): void => {
			handler(true);
		});
		const unsubscribeHidden = this.#subscribeTo(node, PostFormEvent.Hidden, (): void => {
			handler(false);
		});

		return (): void => {
			unsubscribeShown();
			unsubscribeHidden();
		};
	}

	subscribeViewModeChange(handler: (mode: string) => void): EditorUnsubscribe
	{
		return this.#subscribeEditor(EditorEvent.ViewChanged, (): void => {
			handler(this.#resolveEditor()?.GetViewMode() ?? '');
		});
	}

	/** A click in the body closes the menus of the form. */
	subscribeBodyClick(handler: () => void): EditorUnsubscribe
	{
		return this.#subscribeEditor(EditorEvent.BodyClick, handler);
	}

	subscribeContentChange(handler: () => void): EditorUnsubscribe
	{
		let unsubscribeInput = noop;
		const unsubscribeReady = this.subscribeReady((): void => {
			unsubscribeInput();
			const body = this.#resolveEditor()?.GetIframeDoc()?.body;
			if (body)
			{
				Event.bind(body, 'input', handler);
				unsubscribeInput = (): void => Event.unbind(body, 'input', handler);
			}
		});

		return (): void => {
			unsubscribeReady();
			unsubscribeInput();
		};
	}

	subscribeBodyPlaceholder(text: string): EditorUnsubscribe
	{
		let unsubscribeInput = noop;
		const unsubscribeReady = this.subscribeReady((): void => {
			// A second readiness rebuilds the body: what was bound to the previous one goes first, or the
			// observer and the listeners of that body stay for as long as the page lives.
			unsubscribeInput();
			unsubscribeInput = noop;

			const bodyDocument = this.#resolveEditor()?.GetIframeDoc();
			const body = bodyDocument?.body;
			if (!bodyDocument || !body)
			{
				return;
			}

			const style = bodyDocument.createElement('style');
			style.textContent = [
				// The body of the editor carries a padding of its own; without a positioned body the
				// placeholder would go to the corner of the frame instead of the line the text starts on.
				`body[${BodyPlaceholderVisibleAttribute}] {`,
				'\tposition: relative;',
				'}',
				`body[${BodyPlaceholderVisibleAttribute}]::before {`,
				`\tcontent: attr(${BodyPlaceholderAttribute});`,
				'\tposition: absolute;',
				'\tinset: 0 auto auto 0;',
				'\tpointer-events: none;',
				'\tcolor: var(--ui-color-base-4, #a8adb4);',
				'\tfont: var(--ui-font-weight-normal, 400) var(--ui-font-size-md, 16px)/var(--ui-font-line-height-md, 22px) var(--ui-font-family-system, Arial, sans-serif);',
				'}',
			].join('\n');
			Dom.append(style, bodyDocument.head);
			body.setAttribute(BodyPlaceholderAttribute, text);
			body.setAttribute('aria-placeholder', text);

			/**
			 * A body under the caret belongs to the editor: it invites CoPilot there by a placeholder of its
			 * own, and a second line of grey text over the same spot reads as a defect. The editor takes the
			 * caret as the form opens, so this placeholder speaks only for a body the caret has left. The
			 * invitation is also put into the body and taken out again to be measured, and every such mutation
			 * would otherwise ask the placeholder to come back.
			 */
			let isCaretInBody = false;
			const update = (): void => {
				const systemNodes = this.#getSystemNodes(body);
				let isEmpty = true;
				for (const node of body.childNodes)
				{
					if (hasMeaningfulContent(node, systemNodes))
					{
						isEmpty = false;

						break;
					}
				}

				body.toggleAttribute(BodyPlaceholderVisibleAttribute, isEmpty && !isCaretInBody);
			};

			/**
			 * The caret is followed by the events of the body alone. `hasFocus()` of the document is no answer
			 * here: it still reports the focus while the body is losing it, so a placeholder shown on that
			 * answer would never come back.
			 */
			const hide = (): void => {
				isCaretInBody = true;
				body.removeAttribute(BodyPlaceholderVisibleAttribute);
			};

			const release = (): void => {
				isCaretInBody = false;
				update();
			};

			const observer = new MutationObserver(update);
			observer.observe(body, {
				childList: true,
				characterData: true,
				subtree: true,
			});

			Event.bind(body, 'input', update);
			Event.bind(body, 'mousedown', hide);
			Event.bind(body, 'keydown', hide);
			Event.bind(body, 'focus', hide);
			Event.bind(body, 'blur', release);
			update();
			unsubscribeInput = (): void => {
				observer.disconnect();
				Event.unbind(body, 'input', update);
				Event.unbind(body, 'mousedown', hide);
				Event.unbind(body, 'keydown', hide);
				Event.unbind(body, 'focus', hide);
				Event.unbind(body, 'blur', release);
				body.removeAttribute(BodyPlaceholderAttribute);
				body.removeAttribute('aria-placeholder');
				body.removeAttribute(BodyPlaceholderVisibleAttribute);
				Dom.remove(style);
			};
		});

		return (): void => {
			unsubscribeReady();
			unsubscribeInput();
		};
	}

	#scrollPanelIntoView(control: UploaderControl): void
	{
		void control.nextTick().then((): void => {
			this.getHostNode()?.querySelector<HTMLElement>(UploaderPanelSelector)?.scrollIntoView({ block: 'nearest' });
		});
	}

	subscribeFileAdd(handler: () => void): EditorUnsubscribe
	{
		return this.#subscribeGlobal(UploaderEvent.FileAdd, handler);
	}

	subscribeFileRemove(handler: () => void): EditorUnsubscribe
	{
		return this.#subscribeGlobal(UploaderEvent.FileRemove, handler);
	}

	destroy(): void
	{
		if (this.#isDestroyed)
		{
			return;
		}

		this.#isDestroyed = true;
		this.#teardown.forEach((unsubscribe: EditorUnsubscribe): void => {
			unsubscribe();
		});
		this.#teardown.clear();
	}

	/**
	 * The body is filled here, before the readiness reaches the parts of the form that write into it. Esc
	 * inside the body leaves the form, as long as the panel it stands in allows closing that way.
	 */
	#handleReady = (): void => {
		if (this.#isDestroyed)
		{
			return;
		}

		this.#applyInitialBody();

		const bodyDocument = this.#resolveEditor()?.GetIframeDoc();
		if (!bodyDocument)
		{
			return;
		}

		Event.bind(bodyDocument, 'keydown', this.#handleBodyKeydown);
		this.#track((): void => {
			Event.unbind(bodyDocument, 'keydown', this.#handleBodyKeydown);
		});
	};

	/**
	 * The panel is left through the handler of the form and not by closing the slider here: that handler is
	 * the one that takes the form down and keeps the panel from caching what was typed.
	 */
	#handleBodyKeydown = (event: KeyboardEvent): void => {
		if (event.key !== 'Escape')
		{
			return;
		}

		if (this.#resolveTopSlider()?.canCloseByEsc() === true)
		{
			this.#closeForm();
		}
	};

	/** `main.post.form` reports readiness the moment the body exists, and a body not built takes no content. */
	#isReady(): boolean
	{
		return this.#resolveHandler()?.isReady === true;
	}

	#applyInitialBody(): boolean
	{
		if (this.#initialBody === null || !this.setBody(this.#initialBody))
		{
			return false;
		}

		this.#initialBody = null;
		this.#isInitialBodySet = true;

		return true;
	}

	#insertAtCaret(editor: HtmlEditorInstance, node: HTMLElement): boolean
	{
		if (editor.GetViewMode() !== EditorViewMode.Visual)
		{
			return false;
		}

		editor.Focus();
		editor.selection.InsertNode(node);
		this.#placeCaretAfter(editor, node);
		editor.synchro.FullSyncFromIframe();

		return true;
	}

	#createHtmlFragment(bodyDocument: Document, html: string): DocumentFragment
	{
		const template = bodyDocument.createElement('template');
		Dom.adjust(template, { html });

		return template.content;
	}

	/**
	 * The registered identifiers are few and are looked up by name: a walk over every node carrying an
	 * id would go through the whole letter, quote and all, on each keystroke of the placeholder watch.
	 */
	#getSystemNodes(body: HTMLElement): Set<Node>
	{
		const nodes: Set<Node> = new Set();
		const bodyDocument = body.ownerDocument;
		for (const nodeId of this.#systemNodeIds)
		{
			const node = bodyDocument.getElementById(nodeId);
			if (node && body.contains(node))
			{
				nodes.add(node);
			}
		}

		return nodes;
	}

	/**
	 * The caret stands behind the inserted node, so the user goes on typing after it. The selection belongs to
	 * the visual surface alone: in another view mode the body is one text, and a caret there moves nothing.
	 */
	#placeCaretAfter(editor: HtmlEditorInstance, node: Node): void
	{
		if (editor.GetViewMode() !== EditorViewMode.Visual)
		{
			return;
		}

		editor.selection.SetAfter(node);
	}

	/**
	 * Events of the editor instance wait for the readiness of the handler: with a lazily loaded editor the
	 * instance appears later than the form asks for the subscription.
	 */
	#subscribeEditor(eventName: string, handler: () => void): EditorUnsubscribe
	{
		let unsubscribeEditor: EditorUnsubscribe = noop;
		const unsubscribeReady = this.subscribeReady((): void => {
			unsubscribeEditor = this.#subscribeTo(this.#resolveEditor(), eventName, handler);
		});

		return (): void => {
			unsubscribeReady();
			unsubscribeEditor();
		};
	}

	#subscribeTo(target: object | null, eventName: string, handler: () => void): EditorUnsubscribe
	{
		if (!target || this.#isDestroyed)
		{
			return noop;
		}

		EventEmitter.subscribe(target, eventName, handler);

		return this.#track((): void => {
			EventEmitter.unsubscribe(target, eventName, handler);
		});
	}

	#subscribeGlobal(eventName: string, handler: () => void): EditorUnsubscribe
	{
		if (this.#isDestroyed)
		{
			return noop;
		}

		EventEmitter.subscribe(eventName, handler);

		return this.#track((): void => {
			EventEmitter.unsubscribe(eventName, handler);
		});
	}

	#track(unsubscribe: EditorUnsubscribe): EditorUnsubscribe
	{
		this.#teardown.add(unsubscribe);

		return (): void => {
			this.#teardown.delete(unsubscribe);
			unsubscribe();
		};
	}

	#resolveEditor(): HtmlEditorInstance | null
	{
		// The registry answers with `false` when no editor is registered under the identifier.
		return (window as LegacyWindow).BXHtmlEditor?.Get(this.editorId) || null;
	}

	#resolveHandler(): PostFormHandler | null
	{
		return (window as LegacyWindow).LHEPostForm?.getHandler(this.editorId) ?? null;
	}

	#resolveUploaderControl(): UploaderControl | null
	{
		if (this.#uploaderControlId === '')
		{
			return null;
		}

		const uploaderApi = (BX as unknown as DiskUploaderGlobal).Disk?.Uploader?.UserFieldControl;

		return uploaderApi?.getById(this.#uploaderControlId) ?? null;
	}

	#resolveCopilotButton(): HTMLElement | null
	{
		return this.getHostNode()?.querySelector<HTMLElement>(CopilotButtonSelector) ?? null;
	}

	#resolveTopSlider(): SidePanelSlider | null
	{
		try
		{
			const topBx = (window.top as unknown as { BX?: TopBx } | null)?.BX ?? null;

			return topBx?.SidePanel?.Instance?.getTopSlider?.() ?? null;
		}
		catch
		{
			return null;
		}
	}
}
