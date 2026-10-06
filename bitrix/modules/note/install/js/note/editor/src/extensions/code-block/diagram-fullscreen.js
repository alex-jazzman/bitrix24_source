import { Loc } from 'main.core';
import { NoteThemeContext } from 'note.ui.theme-context';
import { DiagramViewport } from './diagram-viewport';

const LAYER_CLASS = 'note-editor-diagram-fullscreen';
const LOCK_CLASS = 'note-editor-diagram-fullscreen-lock';

let openViewer = null;

function createButton(
	{ className, title, testId, iconModifier = null, label = '' }:
		{ className: string, title: string, testId: string, iconModifier?: ?string, label?: string },
): HTMLElement
{
	const button = document.createElement('button');
	button.type = 'button';
	button.className = className;
	button.title = title;
	button.setAttribute('aria-label', title);
	// The controls of the bar share one class, so without this a test can only tell them apart by a
	// localized label or by position in the row.
	button.dataset.testid = testId;

	if (iconModifier)
	{
		const icon = document.createElement('span');
		icon.className = `ui-icon-set --${iconModifier}`;
		button.append(icon);
	}
	else
	{
		button.textContent = label;
	}

	return button;
}

/**
 * Fullscreen reader for a diagram that is too dense to follow inside a code block.
 *
 * Reuses the carrier the block already rendered: the clone carries the same payload - `srcdoc` and the
 * empty `sandbox`, or the same data URI - so nothing is re-rendered and the isolation is exactly the one
 * the block had. Gestures are the immersive set - plain wheel zooms, pinch works, and there is no page
 * behind to scroll.
 */
class DiagramFullscreen
{
	#layer: HTMLElement;
	#viewport: DiagramViewport;
	#zoomValue: HTMLElement;
	#zoomIn: HTMLElement;
	#zoomOut: HTMLElement;
	#close: HTMLElement;
	#returnFocusTo: ?HTMLElement;
	#onKeydown: Function;
	#onResize: Function;
	#themeUnsubscribe: ?Function;

	constructor(
		{ media, contextClass, returnFocusTo = null }:
			{ media: HTMLElement, contextClass: string, returnFocusTo?: ?HTMLElement },
	)
	{
		this.#returnFocusTo = returnFocusTo;

		this.#layer = document.createElement('div');
		this.#layer.className = `${LAYER_CLASS} ${contextClass}`;
		// A layer over the whole page is a modal, and saying so is what lets a screen reader treat the
		// document behind it as out of reach.
		this.#layer.setAttribute('role', 'dialog');
		this.#layer.setAttribute('aria-modal', 'true');
		// Its own name, not the opening control's: a dialog is announced by what it is, and
		// "open the diagram fullscreen" is an action.
		this.#layer.setAttribute('aria-label', Loc.getMessage('NOTE_EDITOR_DIAGRAM_FULLSCREEN_TITLE'));

		this.#viewport = new DiagramViewport({
			media,
			immersive: true,
			onChange: (state: Object) => this.#applyState(state),
		});

		this.#zoomOut = createButton({
			className: 'note-editor-diagram-fullscreen-button',
			title: Loc.getMessage('NOTE_EDITOR_DIAGRAM_ZOOM_OUT'),
			testId: 'note-diagram-fullscreen-zoom-out',
			iconModifier: 'o-zoom-out',
		});
		this.#zoomIn = createButton({
			className: 'note-editor-diagram-fullscreen-button',
			title: Loc.getMessage('NOTE_EDITOR_DIAGRAM_ZOOM_IN'),
			testId: 'note-diagram-fullscreen-zoom-in',
			iconModifier: 'o-zoom-in',
		});
		this.#zoomValue = createButton({
			className: 'note-editor-diagram-fullscreen-value',
			title: Loc.getMessage('NOTE_EDITOR_DIAGRAM_ZOOM_RESET'),
			testId: 'note-diagram-fullscreen-zoom-reset',
		});
		this.#close = createButton({
			className: 'note-editor-diagram-fullscreen-button',
			title: Loc.getMessage('NOTE_EDITOR_DOCUMENT_EXIT_PREVIEW'),
			testId: 'note-diagram-fullscreen-close',
			iconModifier: 'cross-l',
		});

		this.#zoomOut.addEventListener('click', () => this.#viewport.zoomOut());
		this.#zoomIn.addEventListener('click', () => this.#viewport.zoomIn());
		this.#zoomValue.addEventListener('click', () => this.#viewport.reset());
		this.#close.addEventListener('click', () => this.close());

		const bar = document.createElement('div');
		bar.className = 'note-editor-diagram-fullscreen-bar';
		const divider = document.createElement('span');
		divider.className = 'note-editor-diagram-fullscreen-divider';

		bar.append(this.#zoomOut, this.#zoomValue, this.#zoomIn, divider, this.#close);

		this.#layer.append(bar, this.#viewport.element);

		// The fit depends on the size of the viewport, and a rotated phone or a resized window is a
		// different viewport - recompute instead of keeping a scale measured against the old one.
		this.#onResize = () => this.#viewport.refresh();

		this.#onKeydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape')
			{
				event.stopPropagation();
				this.close();

				return;
			}

			// aria-modal has to be true in behaviour as well: without holding Tab inside, it walks
			// straight into the document the reader was told is unreachable.
			if (event.key === 'Tab')
			{
				this.#moveFocus(event);
			}
		};

		// The clone's colors were baked in for the theme in force when the block drew it, so a theme
		// switch would leave the reader looking at the old palette. Closing hands them back to the
		// block, which redraws itself.
		this.#themeUnsubscribe = NoteThemeContext.subscribe(() => this.close());
	}

	open(): void
	{
		document.body.append(this.#layer);
		document.documentElement.classList.add(LOCK_CLASS);
		document.addEventListener('keydown', this.#onKeydown, true);
		window.addEventListener('resize', this.#onResize);
		// Only now does the viewport have a size to fit the diagram into.
		this.#viewport.refresh();
		// The way out comes first: whoever arrives here by keyboard has to be able to leave without
		// hunting for the control.
		this.#close.focus();
	}

	close(): void
	{
		document.removeEventListener('keydown', this.#onKeydown, true);
		window.removeEventListener('resize', this.#onResize);
		document.documentElement.classList.remove(LOCK_CLASS);
		this.#themeUnsubscribe?.();
		this.#themeUnsubscribe = null;
		this.#viewport.destroy();
		this.#layer.remove();

		// Back to the control that opened the viewer, so the keyboard does not restart from the top of
		// the document. Skipped if that control is gone (the block re-rendered while the viewer was up).
		if (this.#returnFocusTo?.isConnected)
		{
			this.#returnFocusTo.focus();
		}
		this.#returnFocusTo = null;

		if (openViewer === this)
		{
			openViewer = null;
		}
	}

	#moveFocus(event: KeyboardEvent): void
	{
		const stops = [this.#zoomOut, this.#zoomValue, this.#zoomIn, this.#close]
			.filter((button: HTMLElement) => !button.disabled);
		if (stops.length === 0)
		{
			return;
		}

		event.preventDefault();

		const current = stops.indexOf(document.activeElement);
		if (current === -1)
		{
			stops[event.shiftKey ? stops.length - 1 : 0].focus();

			return;
		}

		const next = event.shiftKey ? current - 1 : current + 1;
		stops[(next + stops.length) % stops.length].focus();
	}

	#applyState(state: ?Object): void
	{
		// Which control the reader is on has to be read before anything is disabled: the browser drops
		// focus to <body> the moment the focused element turns disabled, and then there is nothing left
		// to ask. Pressing "fit" disables exactly the control that was pressed.
		const focused = document.activeElement;

		this.#zoomValue.textContent = state?.label ?? '';
		this.#zoomValue.disabled = !state?.canZoomOut;
		this.#zoomOut.disabled = !state?.canZoomOut;
		this.#zoomIn.disabled = !state?.canZoomIn;

		// The way out is always enabled, so that is where focus goes rather than out of the dialog.
		if (focused?.disabled === true && this.#layer.contains(focused))
		{
			this.#close.focus();
		}
	}
}

/**
 * Opens the fullscreen reader for an already rendered diagram. One at a time.
 */
export function openDiagramFullscreen(media: ?HTMLElement, returnFocusTo: ?HTMLElement = null): void
{
	if (!media)
	{
		return;
	}

	openViewer?.close();

	// The layer hangs off <body>, outside the document's own markup, so it has to carry the
	// design-system context itself - otherwise the controls would fall back to the light palette.
	openViewer = new DiagramFullscreen({
		media,
		contextClass: NoteThemeContext.getDesignSystemContext(),
		returnFocusTo,
	});
	openViewer.open();
}
