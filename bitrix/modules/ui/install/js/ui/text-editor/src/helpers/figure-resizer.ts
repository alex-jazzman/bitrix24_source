import { Type, Tag, Dom, Event } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';

import { type TextEditor } from '../text-editor';

import './figure-resizer.css';

type FigureResizerOptions = {
	target: HTMLElement;
	editor: TextEditor;
	originalWidth?: number;
	originalHeight?: number;
	minWidth?: number;
	minHeight?: number;
	maxWidth?: 'none' | number;
	events?: Record<string, (event: BaseEvent) => void>;
	freeTransform?: boolean;
};

function clamp(value: number, min: number, max: number): number
{
	return Math.min(Math.max(value, min), max);
}

const Direction = {
	EAST: 1,
	SOUTH: 2,
	WEST: 4,
	NORTH: 8,
};

export class FigureResizer extends EventEmitter
{
	#positioning = {
		currentHeight: 0,
		currentWidth: 0,
		direction: 0,
		isResizing: false,
		ratio: 0,
		startHeight: 0,
		startWidth: 0,
		startX: 0,
		startY: 0,
	};

	#freeTransform: boolean = false;

	#onPointerDownHandler: (event: PointerEvent) => void = this.#handlePointerDown.bind(this);
	#onPointerMoveHandler: (event: PointerEvent) => void = this.#handlePointerMove.bind(this);
	#onPointerUpHandler: () => void = this.#handlePointerUp.bind(this);

	#container: HTMLElement | null = null;
	#target: HTMLElement | null = null;
	#editor: TextEditor | null = null;

	#maxWidth: 'none' | number = 'none';
	#minWidth: number = 16;
	#minHeight: number = 16;

	#resizeEndTimeoutId: ReturnType<typeof setTimeout> | null = null;

	// measured at pointerdown rather than on every pointermove: reading layout after the style
	// write of the previous move forces a synchronous reflow. The limit does move while a drag
	// lasts -- the window, a slider or a breakpoint can narrow the editor -- so an observer
	// re-measures it, which costs a read per actual resize instead of one per pointer event
	#maxContainerWidth: number = 0;
	#boundsObserver: ResizeObserver | null = null;

	constructor({
		target,
		editor,
		originalWidth,
		originalHeight,
		minWidth,
		minHeight,
		maxWidth,
		events,
		freeTransform,
	}: FigureResizerOptions)
	{
		super();
		this.setEventNamespace('BX.UI.TextEditor.FigureResizer');

		this.#target = target;
		this.#editor = editor;

		this.#minWidth = Math.min(
			Math.max(this.#minWidth, Type.isNumber(minWidth) ? minWidth : this.#minWidth),
			Type.isNumber(originalWidth) ? originalWidth : Infinity,
		);
		this.#minHeight = Math.min(
			Math.max(this.#minHeight, Type.isNumber(minHeight) ? minHeight : this.#minHeight),
			Type.isNumber(originalHeight) ? originalHeight : Infinity,
		);

		this.setMaxWidth(maxWidth ?? 'none');
		this.#freeTransform = freeTransform === true;

		this.subscribeFromOptions(events ?? {});
	}

	show(): void
	{
		Dom.addClass(this.getContainer(), '--shown');
	}

	hide(): void
	{
		Dom.removeClass(this.getContainer(), '--shown');
	}

	getContainer(): HTMLElement
	{
		if (this.#container === null)
		{
			const freeTransform = Tag.render`
				<div
					class="ui-text-editor-figure-resizer-handle --north"
					data-direction="${Direction.NORTH}"
					onpointerdown="${this.#onPointerDownHandler}"
					></div>
				<div
					class="ui-text-editor-figure-resizer-handle --east"
					data-direction="${Direction.EAST}"
					onpointerdown="${this.#onPointerDownHandler}"
					></div>
				<div
					class="ui-text-editor-figure-resizer-handle --south"
					data-direction="${Direction.SOUTH}"
					onpointerdown="${this.#onPointerDownHandler}"
					></div>
				<div
					class="ui-text-editor-figure-resizer-handle --west"
					data-direction="${Direction.WEST}"
					onpointerdown="${this.#onPointerDownHandler}"
					></div>
			`;

			this.#container = Tag.render`
				<div class="ui-text-editor-figure-resizer">
					<div
						class="ui-text-editor-figure-resizer-handle --north-east"
						data-direction="${Direction.NORTH | Direction.EAST}" 
						onpointerdown="${this.#onPointerDownHandler}"
					></div>
					<div
						class="ui-text-editor-figure-resizer-handle --south-east"
						data-direction="${Direction.SOUTH | Direction.EAST}" 
						onpointerdown="${this.#onPointerDownHandler}"
						></div>
					<div
						class="ui-text-editor-figure-resizer-handle --south-west"
						data-direction="${Direction.SOUTH | Direction.WEST}" 
						onpointerdown="${this.#onPointerDownHandler}"
						></div>
					<div 
						class="ui-text-editor-figure-resizer-handle --north-west"
						data-direction="${Direction.NORTH | Direction.WEST}" 
						onpointerdown="${this.#onPointerDownHandler}"
						></div>
					${this.#freeTransform ? freeTransform : null}
				</div>
			`;
		}

		return this.#container!;
	}

	getTarget(): HTMLElement
	{
		return this.#target!;
	}

	setTarget(target: HTMLElement): void
	{
		this.#target = target;
	}

	getEditor(): TextEditor
	{
		return this.#editor!;
	}

	setMaxWidth(maxWidth: 'none' | number): void
	{
		this.#maxWidth = Type.isNumber(maxWidth) ? maxWidth : 'none';
	}

	isResizing(): boolean
	{
		return this.#positioning.isResizing;
	}

	destroy(): void
	{
		// A view being replaced still owes its node the size the drag measured, so the pending
		// commit is run rather than dropped. When the whole editor is going away there is no
		// document left to commit into, and the same call would only touch a dying editor.
		if (this.getEditor().isDestroying())
		{
			this.#cancelDeferredResizeEnd();
		}
		else
		{
			this.#flushDeferredResizeEnd();
		}

		this.#positioning.isResizing = false;
		this.#unwatchEditorBounds();

		Event.unbind(document, 'pointermove', this.#onPointerMoveHandler);
		Event.unbind(document, 'pointerup', this.#onPointerUpHandler);

		this.unsubscribeAll();
	}

	#handlePointerDown(event: PointerEvent)
	{
		if (!this.getEditor().isEditable())
		{
			return;
		}

		// a drag restarted inside the deferred window must not be ended by the previous one:
		// this drag measures its own start size and commits its own onResizeEnd
		this.#cancelDeferredResizeEnd();

		event.preventDefault();

		const direction: number = Number((event.target as HTMLElement).dataset.direction);

		const target = this.getTarget();
		const { width, height } = target.getBoundingClientRect();
		this.#maxContainerWidth = this.#measureMaxContainerWidth();

		this.#positioning.startWidth = width;
		this.#positioning.startHeight = height;
		this.#positioning.ratio = width / height;
		this.#positioning.currentWidth = width;
		this.#positioning.currentHeight = height;
		this.#positioning.startX = event.clientX;
		this.#positioning.startY = event.clientY;
		this.#positioning.isResizing = true;
		this.#positioning.direction = direction;

		this.emit('onResizeStart');

		Dom.addClass(this.getContainer(), '--resizing');
		Dom.style(target, {
			width: `${width}px`,
			height: `${height}px`,
		});

		Event.bind(document, 'pointermove', this.#onPointerMoveHandler);
		Event.bind(document, 'pointerup', this.#onPointerUpHandler);

		this.#watchEditorBounds();
	}

	#watchEditorBounds(): void
	{
		this.#unwatchEditorBounds();

		const editorRootElement = this.getEditor().getRootElement();
		if (editorRootElement === null)
		{
			return;
		}

		// one read per actual resize of the editor, against one per pointermove before. observe()
		// delivers once on its own too, which only re-measures what pointerdown already measured
		this.#boundsObserver = new ResizeObserver((): void => {
			this.#maxContainerWidth = this.#measureMaxContainerWidth();
		});

		this.#boundsObserver.observe(editorRootElement);
	}

	#unwatchEditorBounds(): void
	{
		if (this.#boundsObserver !== null)
		{
			this.#boundsObserver.disconnect();
			this.#boundsObserver = null;
		}
	}

	#handlePointerMove(event: PointerEvent)
	{
		const target = this.getTarget();
		const isHorizontal = this.#positioning.direction & (Direction.EAST | Direction.WEST);
		const isVertical = this.#positioning.direction & (Direction.SOUTH | Direction.NORTH);

		if (this.#positioning.isResizing)
		{
			// Corner cursor
			if (isHorizontal && isVertical)
			{
				let diff = Math.floor(this.#positioning.startX - event.clientX);
				diff = this.#positioning.direction & Direction.EAST ? -diff : diff;

				const width = Math.round(
					clamp(this.#positioning.startWidth + diff, this.#minWidth, this.#maxContainerWidth),
				);

				const height = Math.ceil(width / this.#positioning.ratio);

				Dom.style(target, {
					width: `${width}px`,
					height: `${height}px`,
				});

				this.emit('onResize', { width, height });

				this.#positioning.currentHeight = height;
				this.#positioning.currentWidth = width;
			}
			else if (isVertical)
			{
				let diff = Math.floor(this.#positioning.startY - event.clientY);
				diff = this.#positioning.direction & Direction.SOUTH ? -diff : diff;

				const height = Math.round(
					Math.max(
						this.#positioning.startHeight + diff,
						this.#minHeight,
					),
				);

				Dom.style(target, 'height', `${height}px`);
				this.emit('onResize', { width: this.#positioning.currentWidth, height });

				this.#positioning.currentHeight = height;
			}
			else
			{
				let diff = Math.floor(this.#positioning.startX - event.clientX);
				diff = this.#positioning.direction & Direction.EAST ? -diff : diff;

				const width = Math.round(
					clamp(this.#positioning.startWidth + diff, this.#minWidth, this.#maxContainerWidth),
				);

				Dom.style(target, 'width', `${width}px`);
				this.emit('onResize', { width, height: this.#positioning.currentHeight });

				this.#positioning.currentWidth = width;
			}
		}
	}

	#handlePointerUp()
	{
		this.#unwatchEditorBounds();

		if (this.#positioning.isResizing)
		{
			this.#resizeEndTimeoutId = setTimeout(() => {
				this.#resizeEndTimeoutId = null;
				this.#finishResize();
			}, 200);
		}
	}

	/** Hands the measured size over and puts the resizer back into its idle state. */
	#finishResize(): void
	{
		const width: number = this.#positioning.currentWidth;
		const height: number = this.#positioning.currentHeight;

		this.#positioning.startWidth = 0;
		this.#positioning.startHeight = 0;
		this.#positioning.ratio = 0;
		this.#positioning.startX = 0;
		this.#positioning.startY = 0;
		this.#positioning.currentWidth = 0;
		this.#positioning.currentHeight = 0;
		this.#positioning.isResizing = false;

		Dom.removeClass(this.getContainer(), '--resizing');

		this.emit('onResizeEnd', { width, height });

		Event.unbind(document, 'pointermove', this.#onPointerMoveHandler);
		Event.unbind(document, 'pointerup', this.#onPointerUpHandler);
	}

	/**
	 * Runs a resize that is still waiting out its deferral. Used on teardown: the size lives in
	 * the Lexical node, which outlives this view, and only onResizeEnd puts it there. Dropping
	 * the timer instead would revert the drag on the next reconcile without a trace.
	 */
	#flushDeferredResizeEnd(): void
	{
		if (this.#resizeEndTimeoutId !== null)
		{
			clearTimeout(this.#resizeEndTimeoutId);
			this.#resizeEndTimeoutId = null;
			this.#finishResize();
		}
	}

	/** Drops a pending resize without committing it: a new drag supersedes the previous one. */
	#cancelDeferredResizeEnd(): void
	{
		if (this.#resizeEndTimeoutId !== null)
		{
			clearTimeout(this.#resizeEndTimeoutId);
			this.#resizeEndTimeoutId = null;
		}
	}

	#measureMaxContainerWidth(): number
	{
		const maxWidth = Type.isNumber(this.#maxWidth) ? this.#maxWidth : Infinity;

		const editorRootElement = this.getEditor().getRootElement();
		if (editorRootElement !== null)
		{
			return Math.min(editorRootElement.getBoundingClientRect().width - 20, maxWidth);
		}

		return 100;
	}
}
