import { Dom, Event as BaseEvent, Type } from 'main.core';
import { BitrixVue } from 'ui.vue3';
import { NodeSelection } from '@tiptap/pm/state';
import { NoteThemeContext } from 'note.ui.theme-context';
import { NoteCodeBlockOverlay } from './code-block-overlay';
import {
	buildDiagramFrame,
	buildDiagramImage,
	renderDiagramSource,
	themeDiagramSvg,
	usesFrameDelivery,
	whenVisible,
} from './mermaid-diagram';
import { DiagramViewport } from './diagram-viewport';
import { openDiagramFullscreen } from './diagram-fullscreen';
import { normalizeLanguage, MERMAID_LANGUAGE } from '../lowlight-languages';

const OVERLAY_HOST_CLASS = 'note-editor-code-block-overlay-host';
const WRAPPER_CLASS = 'note-editor-code-block';
const GUTTER_CLASS = 'note-editor-code-block-gutter';
const DIAGRAM_HOST_CLASS = 'note-editor-code-block-diagram';
const DIAGRAM_MODE_CLASS = 'note-editor-code-block--diagram';
const DIAGRAM_PENDING_CLASS = 'note-editor-code-block-diagram-pending';
const GUTTER_HOVER_CLASS = 'note-editor-code-block--gutter-hover';
const DIAGRAM_RENDER_DEBOUNCE = 300;
// A frame that has not reported a load by now is one that never will. Generous on purpose: srcdoc needs
// no network, so anything past a moment here is a webview that refuses the document outright, not a
// slow one.
const DIAGRAM_FRAME_LOAD_TIMEOUT = 2500;

export class CodeBlockNodeView
{
	node: Object;
	editor: Object;
	getPos: () => number | undefined;

	dom: HTMLElement;
	contentDOM: HTMLElement;

	#overlayHost: HTMLElement;
	#gutterEl: HTMLElement;
	#gutterLineCount: number;
	#preEl: HTMLElement;
	#diagramHost: HTMLElement;
	#diagramKey: string | null;
	// The drawn SVG and the source it came from, kept for the block's lifetime. It is theme-independent,
	// so a theme switch repaints it, and it outlives a switch to edit mode, so coming back to reading
	// does not pay for another layout either. Layout is the expensive part: ~380ms for a 120-node
	// flowchart, blocking the main thread.
	#diagramSvg: string | null;
	#diagramSvgKey: string | null;
	#diagramTheme: string | null;
	#diagramViewport: DiagramViewport | null;
	#frameWatchTimer: number | null;
	#frameWatchEl: HTMLIFrameElement | null;
	#onFrameLoad: (() => void) | null;
	#renderToken: number;
	#renderTimer: number | null;
	#cancelVisibility: (() => void) | null;
	#themeUnsubscribe: (() => void) | null;
	#vueApp: Object | null;
	#vm: Object | null;
	#onMouseMove: (event: MouseEvent) => void;
	#onMouseLeave: () => void;
	#onMouseDown: (event: MouseEvent) => void;

	constructor({ node, editor, getPos }: { node: Object, editor: Object, getPos: Function })
	{
		this.node = node;
		this.editor = editor;
		this.getPos = getPos;

		this.dom = document.createElement('div');
		this.dom.className = WRAPPER_CLASS;
		this.dom.setAttribute('data-type', 'codeBlock');
		this.dom.dataset.testid = 'note-code-block-root';

		this.#overlayHost = document.createElement('div');
		this.#overlayHost.className = OVERLAY_HOST_CLASS;
		this.#overlayHost.contentEditable = 'false';

		this.#gutterEl = document.createElement('div');
		this.#gutterEl.className = GUTTER_CLASS;
		this.#gutterEl.contentEditable = 'false';
		this.#gutterEl.setAttribute('aria-hidden', 'true');
		this.#gutterEl.dataset.testid = 'note-code-block-gutter';
		this.#gutterLineCount = 0;

		this.#preEl = document.createElement('pre');
		const codeEl = document.createElement('code');
		const language = this.#resolveLanguage(node);
		if (language)
		{
			codeEl.classList.add(`language-${language}`);
		}
		this.#preEl.append(codeEl);

		// Read-mode host for a rendered mermaid diagram; hidden (and empty) for every other
		// language and while editing.
		this.#diagramHost = document.createElement('div');
		this.#diagramHost.className = DIAGRAM_HOST_CLASS;
		this.#diagramHost.contentEditable = 'false';
		this.#diagramKey = null;
		this.#diagramSvg = null;
		this.#diagramSvgKey = null;
		this.#diagramTheme = null;
		this.#diagramViewport = null;
		this.#frameWatchTimer = null;
		this.#frameWatchEl = null;
		this.#onFrameLoad = null;
		this.#renderToken = 0;
		this.#renderTimer = null;
		this.#cancelVisibility = null;
		this.#themeUnsubscribe = null;

		// Flex order: gutter first, then the scrolling pre; the overlay host is
		// absolutely positioned and out of flow.
		this.dom.append(this.#overlayHost, this.#gutterEl, this.#preEl, this.#diagramHost);
		this.contentDOM = codeEl;

		this.#vueApp = null;
		this.#vm = null;
		this.#onMouseMove = (event: MouseEvent) => this.#handleMouseMove(event);
		this.#onMouseLeave = () => this.#clearGutterHover();
		this.#onMouseDown = (event: MouseEvent) => this.#handleMouseDown(event);

		this.#renderGutter();
		this.#mountOverlay();
		this.#bindEditorEvents();
		this.#bindPointerEvents();
		this.#syncDiagramState();
	}

	#bindPointerEvents(): void
	{
		BaseEvent.bind(this.dom, 'mousemove', this.#onMouseMove);
		BaseEvent.bind(this.dom, 'mouseleave', this.#onMouseLeave);
		BaseEvent.bind(this.dom, 'mousedown', this.#onMouseDown);
	}

	#unbindPointerEvents(): void
	{
		BaseEvent.unbind(this.dom, 'mousemove', this.#onMouseMove);
		BaseEvent.unbind(this.dom, 'mouseleave', this.#onMouseLeave);
		BaseEvent.unbind(this.dom, 'mousedown', this.#onMouseDown);
	}

	#handleMouseMove(event: MouseEvent): void
	{
		const shouldHover = event.buttons === 0
			&& this.#canSelectFromGutter()
			&& this.#isGutterPoint(event.clientX, event.clientY);

		Dom.toggleClass(this.dom, GUTTER_HOVER_CLASS, shouldHover);
	}

	#handleMouseDown(event: MouseEvent): void
	{
		this.#clearGutterHover();

		if (event.button !== 0
			|| event.altKey
			|| event.ctrlKey
			|| event.metaKey
			|| event.shiftKey
			|| !this.#canSelectFromGutter()
			|| !this.#isGutterPoint(event.clientX, event.clientY))
		{
			return;
		}

		const view = this.editor?.view;
		const pos = this.#resolvePos();
		if (!view || pos === null || this.#isSelected(pos))
		{
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		view.dom.focus({ preventScroll: true });
		view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, pos)));
	}

	#canSelectFromGutter(): boolean
	{
		return Boolean(this.editor?.isEditable)
			&& Boolean(this.editor?.view?.editable)
			&& !Dom.hasClass(document.documentElement, 'note-mobile');
	}

	#isSelected(pos: number): boolean
	{
		const selection = this.editor?.view?.state?.selection;

		return selection instanceof NodeSelection
			&& selection.from === pos
			&& selection.node.type === this.node.type;
	}

	#isGutterPoint(clientX: number, clientY: number): boolean
	{
		const rect = this.#gutterEl.getBoundingClientRect();

		return clientX > rect.left && clientX < rect.right && clientY > rect.top && clientY < rect.bottom;
	}

	#clearGutterHover(): void
	{
		Dom.removeClass(this.dom, GUTTER_HOVER_CLASS);
	}

	#bindEditorEvents(): void
	{
		if (!this.editor || typeof this.editor.on !== 'function')
		{
			return;
		}

		this.onEditorState = () => this.#syncEditableState();
		this.editor.on('update', this.onEditorState);
		this.editor.on('transaction', this.onEditorState);
	}

	#unbindEditorEvents(): void
	{
		if (!this.editor || typeof this.editor.off !== 'function' || !this.onEditorState)
		{
			return;
		}

		this.editor.off('update', this.onEditorState);
		this.editor.off('transaction', this.onEditorState);
		this.onEditorState = null;
	}

	#syncEditableState(): void
	{
		const isEditable = Boolean(this.editor?.isEditable);
		if (!isEditable || Dom.hasClass(document.documentElement, 'note-mobile'))
		{
			this.#clearGutterHover();
		}

		if (this.#vm && this.#vm.isEditable !== isEditable)
		{
			this.#vm.isEditable = isEditable;
		}

		this.#syncDiagramState();
	}

	// A diagram replaces the code text only while reading: editing a mermaid block always shows
	// its source. The trigger is the node's language attribute, never a guess from the text.
	#isDiagramMode(): boolean
	{
		return !this.editor?.isEditable && this.#resolveLanguage(this.node) === MERMAID_LANGUAGE;
	}

	#syncDiagramState(immediate: boolean = false): void
	{
		if (!this.#isDiagramMode())
		{
			this.#dropDiagram();

			return;
		}

		this.#subscribeTheme();

		const source = this.node?.textContent ?? '';

		// Editor 'update'/'transaction' fire for every change anywhere in the document, so re-render only
		// when this block's own source moved. The key doubles as the cache: a source that failed to
		// render is not retried until it changes.
		if (source === this.#diagramKey)
		{
			// Same diagram, different theme. The drawn SVG serves both: repainting it costs milliseconds
			// where another layout costs hundreds, and layout is blocking work on the main thread.
			if (NoteThemeContext.get() !== this.#diagramTheme && this.#diagramSvg !== null)
			{
				this.#paintDiagram();
			}

			return;
		}

		const isFirstPaint = this.#diagramKey === null;
		this.#diagramKey = source;
		const token = ++this.#renderToken;
		this.#cancelPendingRender();

		// This exact source has already been drawn - reading it again after an edit-mode round trip, or
		// after the block was dropped and picked up. Nothing to ask the engine for.
		if (this.#diagramSvg !== null && this.#diagramSvgKey === source)
		{
			this.#paintDiagram();

			return;
		}

		// First paint is a one-shot event - no reason to make it wait.
		if (isFirstPaint || immediate)
		{
			this.#renderDiagram(source, token);

			return;
		}

		// Reaching here means the source changed under a reader - a co-author typing inside the
		// block streams a patch per keystroke, so collapse the burst into one render.
		this.#renderTimer = setTimeout(() => {
			this.#renderTimer = null;
			this.#renderDiagram(source, token);
		}, DIAGRAM_RENDER_DEBOUNCE);
	}

	// Builds the carrier for the theme in force right now out of the SVG already drawn, and mounts it.
	//
	// The theme is read here, not passed in: a block below the fold waits for the reader to scroll to
	// it, and the reader may well switch the theme in between. Painting with the theme captured when
	// the render was scheduled left those diagrams in the old palette.
	#paintDiagram(): void
	{
		this.#diagramTheme = NoteThemeContext.get();
		const svg = themeDiagramSvg(this.#diagramSvg, this.#diagramTheme, this.#diagramHost);

		this.#mountMedia(usesFrameDelivery()
			? buildDiagramFrame(svg, this.#diagramHost)
			: buildDiagramImage(svg, this.#diagramHost));
	}

	#renderDiagram(source: string, token: number): void
	{
		// Give the block its place with a pending state right away. Rendering is blocking work on the
		// main thread, so it must not sit between the reader's click and the next frame: the switch to
		// read mode paints first, the diagram lands after. A diagram already on screen (theme switch,
		// an edit by a co-author) stays put instead of blinking through the placeholder.
		if (this.#diagramHost.firstElementChild === null)
		{
			this.#showPending();
		}

		this.#cancelVisibility?.();
		this.#cancelVisibility = whenVisible(this.dom, () => {
			this.#cancelVisibility = null;
			if (token !== this.#renderToken)
			{
				return;
			}

			renderDiagramSource(source).then((svg: ?string) => {
				if (token !== this.#renderToken)
				{
					return;
				}

				if (svg === null)
				{
					this.#showSource();

					return;
				}

				this.#diagramSvg = svg;
				this.#diagramSvgKey = source;
				this.#paintDiagram();
			});
		});
	}

	// The carrier goes into a viewport that owns zooming and panning; the same viewport backs the
	// fullscreen viewer, so both read the diagram the same way.
	#mountMedia(media: HTMLElement): void
	{
		this.#releaseViewport();

		this.#diagramViewport = new DiagramViewport({
			media,
			onChange: (state: Object) => this.#applyZoomState(state),
			onActivate: () => this.#openFullscreen(),
		});

		// Read mode is switched on here and nowhere else: this is the one place a diagram becomes
		// visible. The pending placeholder switches it on too, but a diagram taken from the cache -
		// coming back from edit mode, or a theme switch - never goes through the placeholder, and
		// without this the diagram was mounted into a host the stylesheet keeps hidden.
		this.dom.classList.add(DIAGRAM_MODE_CLASS);
		this.#diagramHost.classList.remove(DIAGRAM_PENDING_CLASS);
		this.#diagramHost.replaceChildren(this.#diagramViewport.element);
		this.#applyZoomState(this.#diagramViewport.state());
		this.#watchFrameLoad(media);
	}

	// A webview that refuses to load a document from srcdoc leaves the block showing nothing at all, and
	// a reader cannot tell that from a diagram that is simply blank. The app's webview is known to do
	// exactly that and is delivered an image instead (see usesFrameDelivery); this is the net under any
	// other one that behaves the same way, and it costs a timer per mounted frame.
	#watchFrameLoad(media: HTMLElement): void
	{
		if (!(media instanceof HTMLIFrameElement))
		{
			return;
		}

		// Read now, not in the callback: by then the block may have been repainted, and dropping a
		// diagram that has since been drawn again is worse than the blank it guards against.
		const token = this.#renderToken;

		this.#onFrameLoad = () => this.#clearFrameWatch();
		this.#frameWatchEl = media;
		media.addEventListener('load', this.#onFrameLoad, { once: true });

		this.#frameWatchTimer = setTimeout(() => {
			this.#frameWatchTimer = null;
			if (token === this.#renderToken)
			{
				this.#showSource();
			}
		}, DIAGRAM_FRAME_LOAD_TIMEOUT);
	}

	#clearFrameWatch(): void
	{
		if (this.#frameWatchTimer !== null)
		{
			clearTimeout(this.#frameWatchTimer);
			this.#frameWatchTimer = null;
		}

		if (this.#frameWatchEl !== null && this.#onFrameLoad !== null)
		{
			this.#frameWatchEl.removeEventListener('load', this.#onFrameLoad);
		}

		this.#frameWatchEl = null;
		this.#onFrameLoad = null;
	}

	#openFullscreen(trigger: ?HTMLElement = null): void
	{
		openDiagramFullscreen(this.#diagramViewport?.cloneMedia(), trigger);
	}

	// The mounted carrier goes with the viewport it lives in, so the watch on it has to go too - every
	// path that takes a diagram off the screen comes through here.
	#releaseViewport(): void
	{
		this.#clearFrameWatch();
		this.#diagramViewport?.destroy();
		this.#diagramViewport = null;
	}

	#applyZoomState(state: ?Object): void
	{
		if (!this.#vm)
		{
			return;
		}

		this.#vm.hasDiagram = Boolean(state?.hasSize);
		this.#vm.zoomLabel = state?.label ?? '';
		this.#vm.canZoomIn = Boolean(state?.canZoomIn);
		this.#vm.canZoomOut = Boolean(state?.canZoomOut);
	}

	// Read mode with the source hidden and nothing drawn yet.
	#showPending(): void
	{
		this.#releaseViewport();
		this.#applyZoomState(null);
		this.#diagramHost.replaceChildren();
		this.#diagramHost.classList.add(DIAGRAM_PENDING_CLASS);
		this.dom.classList.add(DIAGRAM_MODE_CLASS);
	}

	// Theme colors are baked into the SVG by the engine, so a theme switch means a redraw.
	// Subscribed only while a diagram is on screen - not once per code block in the document.
	#subscribeTheme(): void
	{
		this.#themeUnsubscribe ??= NoteThemeContext.subscribe(() => this.#syncDiagramState(true));
	}

	#cancelPendingRender(): void
	{
		if (this.#renderTimer)
		{
			clearTimeout(this.#renderTimer);
			this.#renderTimer = null;
		}
	}

	// Degradation path: the block goes back to being a plain code block with its source visible.
	#showSource(): void
	{
		this.#releaseViewport();
		this.#applyZoomState(null);
		this.dom.classList.remove(DIAGRAM_MODE_CLASS);
		this.#diagramHost.classList.remove(DIAGRAM_PENDING_CLASS);
		this.#diagramHost.replaceChildren();
	}

	#dropDiagram(): void
	{
		this.#cancelPendingRender();
		this.#cancelVisibility?.();
		this.#cancelVisibility = null;
		this.#themeUnsubscribe?.();
		this.#themeUnsubscribe = null;

		// Runs on every transaction for every non-diagram code block, so stop here unless there
		// is actually something to tear down.
		if (this.#diagramKey === null)
		{
			return;
		}

		// Invalidate whatever render is in flight so its result cannot land after the switch.
		this.#renderToken++;
		this.#diagramKey = null;
		this.#showSource();
	}

	#resolveLanguage(node: Object): string
	{
		return normalizeLanguage(node?.attrs?.language);
	}

	// Line count = newlines + 1; code never wraps, so one number aligns to one row.
	#renderGutter(): void
	{
		const text = this.node?.textContent ?? '';
		const lineCount = text.split('\n').length;
		if (lineCount === this.#gutterLineCount)
		{
			return;
		}

		this.#gutterLineCount = lineCount;

		const numbers = [];
		for (let i = 1; i <= lineCount; i++)
		{
			numbers.push(i);
		}
		this.#gutterEl.textContent = numbers.join('\n');
	}

	#mountOverlay(): void
	{
		const initialLanguage = this.#resolveLanguage(this.node);
		const initialEditable = Boolean(this.editor?.isEditable);
		const onLanguageSelect = (id: string) => this.#changeLanguage(id);
		const onCopy = (ack: Function) => this.#copyContent(ack);
		const onZoomIn = () => this.#diagramViewport?.zoomIn();
		const onZoomOut = () => this.#diagramViewport?.zoomOut();
		const onZoomReset = () => this.#diagramViewport?.reset();
		const onFullscreen = (trigger: ?HTMLElement) => this.#openFullscreen(trigger);

		this.#vueApp = BitrixVue.createApp({
			components: {
				NoteCodeBlockOverlay,
			},
			data: () => ({
				language: initialLanguage,
				isEditable: initialEditable,
				hasDiagram: false,
				zoomLabel: '',
				canZoomIn: false,
				canZoomOut: false,
			}),
			methods: {
				onLanguageSelect,
				onCopy,
				onZoomIn,
				onZoomOut,
				onZoomReset,
				onFullscreen,
			},
			// language=Vue
			template: `
				<NoteCodeBlockOverlay
					:language="language"
					:is-editable="isEditable"
					:has-diagram="hasDiagram"
					:zoom-label="zoomLabel"
					:can-zoom-in="canZoomIn"
					:can-zoom-out="canZoomOut"
					@language-select="onLanguageSelect"
					@copy="onCopy"
					@zoom-in="onZoomIn"
					@zoom-out="onZoomOut"
					@zoom-reset="onZoomReset"
					@fullscreen="onFullscreen"
				/>
			`,
		});

		this.#vm = this.#vueApp.mount(this.#overlayHost);
	}

	#changeLanguage(language: string): void
	{
		const pos = this.#resolvePos();
		if (pos === null)
		{
			return;
		}

		if (this.node?.attrs?.language === language)
		{
			return;
		}

		const view = this.editor?.view;
		if (!view)
		{
			return;
		}

		const shouldRestoreSelection = this.#isSelected(pos);
		const tr = view.state.tr.setNodeMarkup(pos, undefined, {
			...this.node.attrs,
			language,
		});
		if (shouldRestoreSelection)
		{
			tr.setSelection(NodeSelection.create(tr.doc, pos));
		}
		view.dispatch(tr);
	}

	async #copyContent(ack: Function): Promise<void>
	{
		const text = this.node?.textContent ?? '';
		let success = false;

		try
		{
			if (navigator?.clipboard?.writeText)
			{
				await navigator.clipboard.writeText(text);
				success = true;
			}
			else
			{
				success = this.#fallbackCopy(text);
			}
		}
		catch
		{
			success = this.#fallbackCopy(text);
		}

		if (Type.isFunction(ack))
		{
			ack(success);
		}
	}

	#fallbackCopy(text: string): boolean
	{
		const textarea = document.createElement('textarea');
		textarea.value = text;
		textarea.setAttribute('readonly', '');
		textarea.style.position = 'fixed';
		textarea.style.top = '-1000px';
		textarea.style.left = '-1000px';
		document.body.append(textarea);
		textarea.select();

		let ok = false;
		try
		{
			ok = document.execCommand('copy');
		}
		catch
		{
			ok = false;
		}

		textarea.remove();

		return ok;
	}

	#resolvePos(): number | null
	{
		if (!Type.isFunction(this.getPos))
		{
			return null;
		}

		const pos = this.getPos();

		return Number.isInteger(pos) && pos >= 0 ? pos : null;
	}

	update(node: Object): boolean
	{
		if (node.type !== this.node.type)
		{
			return false;
		}

		const prevLanguage = this.#resolveLanguage(this.node);
		const nextLanguage = this.#resolveLanguage(node);
		this.node = node;

		this.#renderGutter();

		if (prevLanguage !== nextLanguage)
		{
			const codeEl = this.contentDOM;
			if (codeEl)
			{
				codeEl.classList.remove(`language-${prevLanguage}`);
				if (nextLanguage)
				{
					codeEl.classList.add(`language-${nextLanguage}`);
				}
			}

			if (this.#vm)
			{
				this.#vm.language = nextLanguage;
			}
		}

		const isEditable = Boolean(this.editor?.isEditable);
		if (this.#vm && this.#vm.isEditable !== isEditable)
		{
			this.#vm.isEditable = isEditable;
		}

		// Covers a language switch, local typing and remote patches from co-authors alike.
		this.#syncDiagramState();

		return true;
	}

	selectNode(): void
	{
		Dom.addClass(this.dom, 'ProseMirror-selectednode');
	}

	deselectNode(): void
	{
		Dom.removeClass(this.dom, 'ProseMirror-selectednode');
	}

	ignoreMutation(mutation: MutationRecord): boolean
	{
		if (!mutation || !mutation.target)
		{
			return true;
		}

		if (this.contentDOM && this.contentDOM.contains(mutation.target))
		{
			return false;
		}

		return true;
	}

	stopEvent(event: Event): boolean
	{
		const target = event?.target;
		if (!(target instanceof Node))
		{
			return false;
		}

		return this.#overlayHost.contains(target) || this.#diagramHost.contains(target);
	}

	destroy(): void
	{
		this.#dropDiagram();
		this.#unbindPointerEvents();
		this.#unbindEditorEvents();
		this.#vueApp?.unmount?.();
		this.#vueApp = null;
		this.#vm = null;
	}
}
