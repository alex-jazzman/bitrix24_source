import { Dom, Event } from 'main.core';

export type DragDropHandlerOptions = {
	onDragEnter?: (event: DragEvent) => void;
};

export class DragDropHandler
{
	#layout: HTMLElement;
	#isDragOver: boolean = false;
	#onDragEnter: ?(event: DragEvent) => void;

	constructor(layout: HTMLElement, options: DragDropHandlerOptions = {})
	{
		this.#layout = layout;
		this.#onDragEnter = options.onDragEnter;

		this.#bindEvents();
	}

	#bindEvents(): void
	{
		Event.bind(this.#layout, 'dragenter', this.#handleDragEnter.bind(this));
		Event.bind(this.#layout, 'dragover', this.#handleDragOver.bind(this));
		Event.bind(this.#layout, 'drop', this.#handleDrop.bind(this));
		Event.bind(this.#layout, 'dragleave', this.#handleDragLeave.bind(this));
	}

	#handleDragEnter(event: DragEvent): void
	{
		event.preventDefault();
		this.#setDragState();

		if (this.#onDragEnter)
		{
			this.#onDragEnter(event);
		}
	}

	#handleDragOver(event: DragEvent): void
	{
		event.preventDefault();
	}

	#handleDrop(event: DragEvent): void
	{
		event.preventDefault();
		this.#resetDragState();
	}

	#handleDragLeave(event: DragEvent): void
	{
		if (!this.#layout.contains(event.relatedTarget))
		{
			this.#resetDragState();
		}
	}

	#resetDragState(): void
	{
		if (this.#isDragOver)
		{
			this.#isDragOver = false;
			Dom.removeClass(this.#layout, '--drag-over');
			Dom.removeClass(this.#layout, '--dragging');
		}
	}

	#setDragState(): void
	{
		if (!this.#isDragOver)
		{
			this.#isDragOver = true;
			Dom.addClass(this.#layout, '--drag-over');
			Dom.addClass(this.#layout, '--dragging');
		}
	}
}
