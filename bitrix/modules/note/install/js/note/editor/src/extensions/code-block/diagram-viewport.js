import { anchorPan, clampPan, clampScale, fitScale, formatScale, stepScale, MAX_SCALE } from './diagram-zoom';

const VIEWPORT_CLASS = 'note-editor-diagram-viewport';
const CAPTURE_CLASS = 'note-editor-diagram-capture';
const ZOOMED_CLASS = 'note-editor-diagram-viewport--zoomed';
const IMMERSIVE_CLASS = 'note-editor-diagram-viewport--immersive';

/**
 * A rendered diagram the reader can zoom and pan.
 *
 * The carrier is whatever the delivery produced - a sandboxed frame or an inert image (see
 * buildDiagramFrame / buildDiagramImage) - and neither can answer a gesture: pointer and wheel events
 * never cross into a frame with `sandbox=""`, and nothing inside a picture runs at all. So every
 * gesture is captured by a transparent layer above the carrier and answered here, in this document.
 * Zoom is the carrier's own width (the SVG scales to it) and panning is a transform on it, so nothing
 * has to be added to either delivery and the isolation both rest on stays untouched.
 *
 * Used both by a code block in the document and by the fullscreen viewer, which differ only in how
 * they treat touch - see `immersive`.
 */
export class DiagramViewport
{
	#media: HTMLElement;
	#capture: HTMLElement;
	#immersive: boolean;
	#onChange: ?Function;
	#onActivate: ?Function;
	#fitWidthStyle: string;
	#zoom: Object | null;
	#pointers: Map<number, Object>;
	#drag: Object | null;
	#pinch: Object | null;

	element: HTMLElement;

	constructor(
		{ media, immersive = false, onChange = null, onActivate = null }:
			{ media: HTMLElement, immersive?: boolean, onChange?: ?Function, onActivate?: ?Function },
	)
	{
		this.#media = media;
		this.#immersive = immersive;
		this.#onChange = onChange;
		this.#onActivate = onActivate;
		this.#fitWidthStyle = media.style.width;
		this.#zoom = null;
		this.#pointers = new Map();
		this.#drag = null;
		this.#pinch = null;

		this.#capture = document.createElement('div');
		this.#capture.className = CAPTURE_CLASS;

		this.element = document.createElement('div');
		this.element.className = immersive ? `${VIEWPORT_CLASS} ${IMMERSIVE_CLASS}` : VIEWPORT_CLASS;
		this.element.append(media, this.#capture);

		this.#bindEvents();
	}

	state(): Object
	{
		const natural = this.#naturalSize();
		const scale = this.#zoom?.scale ?? this.#fitScale();

		return {
			// Without the diagram's own size there is no scale to zoom from, so the controls have
			// nothing to show.
			hasSize: natural !== null,
			label: formatScale(scale),
			canZoomIn: scale < MAX_SCALE,
			canZoomOut: this.#zoom !== null,
		};
	}

	/**
	 * A copy of the carrier at its fit size, for showing the same diagram somewhere else.
	 *
	 * Cloning carries the payload along - `srcdoc` and the empty `sandbox` for a frame, the data URI
	 * for a picture - so the copy shows the same static SVG under the same isolation, and the engine is
	 * not asked to draw anything a second time.
	 */
	cloneMedia(): HTMLElement
	{
		const clone = this.#media.cloneNode(false);
		clone.style.width = this.#fitWidthStyle;
		clone.style.removeProperty('transform');

		return clone;
	}

	zoomIn(): void
	{
		this.#setZoom(stepScale(this.#zoom?.scale ?? this.#fitScale(), 1));
	}

	zoomOut(): void
	{
		this.#setZoom(stepScale(this.#zoom?.scale ?? this.#fitScale(), -1));
	}

	reset(): void
	{
		this.#zoom = null;
		this.#drag = null;
		this.#pinch = null;
		this.#apply();
		this.#notify();
	}

	/**
	 * Recomputes the fit for the space the viewport has right now.
	 *
	 * Needed after the element lands in the document (it has no size before that) and after the space
	 * itself changes - anything already zoomed goes back to fit rather than keeping a scale measured
	 * against a box that no longer exists.
	 */
	refresh(): void
	{
		this.reset();
	}

	destroy(): void
	{
		this.#pointers.clear();
		this.#drag = null;
		this.#pinch = null;
		this.#onChange = null;
		this.#onActivate = null;
		this.element.remove();
	}

	#bindEvents(): void
	{
		const capture = this.#capture;
		capture.addEventListener('wheel', (event: WheelEvent) => this.#onWheel(event), { passive: false });
		capture.addEventListener('pointerdown', (event: PointerEvent) => this.#onPointerDown(event));
		capture.addEventListener('pointermove', (event: PointerEvent) => this.#onPointerMove(event));
		capture.addEventListener('pointerup', (event: PointerEvent) => this.#onPointerEnd(event));
		capture.addEventListener('pointercancel', (event: PointerEvent) => this.#onPointerEnd(event));
		capture.addEventListener('click', (event: MouseEvent) => this.#onClick(event));
		capture.addEventListener('dblclick', (event: MouseEvent) => this.#onDoubleClick(event));

		if (this.#immersive)
		{
			// iOS reads a swipe that starts near the edge as "go back", and touch-action does not apply
			// to it - in the app's webview that closed the document instead of panning the diagram. The
			// gesture stands down once the page claims the move. Only the move: claiming the touch itself
			// would also cost us the synthesized click, and that is tap-to-zoom.
			capture.addEventListener('touchmove', (event: TouchEvent) => event.preventDefault(), { passive: false });
		}
	}

	#naturalSize(): ?Object
	{
		const width = Number.parseFloat(this.#media.dataset?.naturalWidth ?? '');
		const height = Number.parseFloat(this.#media.dataset?.naturalHeight ?? '');

		return width > 0 && height > 0 ? { width, height } : null;
	}

	#fitScale(): number
	{
		const natural = this.#naturalSize();
		if (!natural)
		{
			return 1;
		}

		// A block in the document grows to the diagram's height, so only its width binds. The
		// fullscreen viewport is the size of the screen and has to contain both directions.
		return this.#immersive
			? fitScale(natural.width, this.element.clientWidth, natural.height, this.element.clientHeight)
			: fitScale(natural.width, this.element.clientWidth);
	}

	// Where the diagram stands right now, whether or not it has been zoomed yet: at fit that is the
	// centred position CSS already gives it, so the first zoom step starts from what the reader sees.
	#currentZoom(): Object
	{
		if (this.#zoom)
		{
			return this.#zoom;
		}

		const scale = this.#fitScale();
		const natural = this.#naturalSize();

		return {
			scale,
			...clampPan({
				contentWidth: (natural?.width ?? 0) * scale,
				contentHeight: (natural?.height ?? 0) * scale,
				viewportWidth: this.element.clientWidth,
				viewportHeight: this.element.clientHeight,
				x: 0,
				y: 0,
			}),
		};
	}

	#setZoom(scale: number, anchorPoint: ?Object = null): void
	{
		const natural = this.#naturalSize();
		if (!natural)
		{
			return;
		}

		// Fit is the floor: shrinking a diagram below the space it already has only wastes it.
		const fit = this.#fitScale();
		const target = clampScale(Math.max(fit, scale));
		if (target <= fit)
		{
			this.reset();

			return;
		}

		const previous = this.#currentZoom();
		this.#lockHeight();

		const anchored = anchorPan({
			x: previous.x,
			y: previous.y,
			pointerX: anchorPoint?.x ?? (this.element.clientWidth / 2),
			pointerY: anchorPoint?.y ?? (this.element.clientHeight / 2),
			previousScale: previous.scale,
			nextScale: target,
		});

		this.#zoom = { scale: target, ...this.#clamp(target, anchored.x, anchored.y) };
		this.#apply();
		this.#notify();
	}

	#clamp(scale: number, x: number, y: number): Object
	{
		const natural = this.#naturalSize();

		return clampPan({
			contentWidth: (natural?.width ?? 0) * scale,
			contentHeight: (natural?.height ?? 0) * scale,
			viewportWidth: this.element.clientWidth,
			viewportHeight: this.element.clientHeight,
			x,
			y,
		});
	}

	// A block in the document keeps the height it had at fit, so panning happens inside the block
	// instead of the page growing downwards on every zoom step. The fullscreen viewport already has
	// its height from the layout.
	#lockHeight(): void
	{
		if (this.#immersive || this.element.style.height !== '')
		{
			return;
		}

		this.element.style.height = `${this.element.clientHeight}px`;
	}

	#apply(): void
	{
		const natural = this.#naturalSize();
		if (!this.#zoom || !natural)
		{
			this.element.classList.remove(ZOOMED_CLASS);
			this.#media.style.removeProperty('transform');
			if (!this.#immersive)
			{
				// Only a block locks its height (see #lockHeight); fullscreen takes it from the layout
				// and must not have it removed here.
				this.element.style.removeProperty('height');
			}

			// In the document the fit width from the carrier itself is exactly right: the block grows to
			// whatever height the diagram needs, so only the width binds. A fullscreen viewport has a
			// fixed box, and `width: min(100%, Xpx)` is a definite width that a height cap cannot pull
			// back - a long diagram was drawn nearly full width with its ratio broken and its tail cut
			// off, which then read as the first zoom step making the diagram *smaller*. So here the fit
			// width is computed, from the same scale the controls report.
			this.#media.style.width = this.#immersive
				? `${natural.width * this.#fitScale()}px`
				: this.#fitWidthStyle;

			return;
		}

		this.element.classList.add(ZOOMED_CLASS);
		this.#media.style.width = `${natural.width * this.#zoom.scale}px`;
		this.#media.style.transform = `translate(${this.#zoom.x}px, ${this.#zoom.y}px)`;
	}

	#notify(): void
	{
		this.#onChange?.(this.state());
	}

	#point(event: Object): Object
	{
		const rect = this.element.getBoundingClientRect();

		return { x: event.clientX - rect.left, y: event.clientY - rect.top };
	}

	#onWheel(event: WheelEvent): void
	{
		// In the document a plain wheel keeps scrolling the page: a diagram in the middle of a text
		// must not be a trap the reader has to scroll around. Fullscreen has nothing else to scroll,
		// so there the wheel is the zoom.
		if (!this.#immersive && !event.ctrlKey && !event.metaKey)
		{
			return;
		}

		event.preventDefault();
		this.#setZoom(
			stepScale(this.#zoom?.scale ?? this.#fitScale(), event.deltaY < 0 ? 1 : -1),
			this.#point(event),
		);
	}

	#onPointerDown(event: PointerEvent): void
	{
		this.#pointers.set(event.pointerId, this.#point(event));

		if (this.#pointers.size === 2)
		{
			this.#startPinch();
			event.preventDefault();

			return;
		}

		// Only a zoomed diagram is draggable, so an untouched one in the document lets a swipe
		// scroll the page.
		if (this.#pointers.size !== 1 || this.#zoom === null || !event.isPrimary)
		{
			return;
		}

		this.#drag = {
			pointerId: event.pointerId,
			pointerX: event.clientX,
			pointerY: event.clientY,
			x: this.#zoom.x,
			y: this.#zoom.y,
		};

		this.#capture.setPointerCapture?.(event.pointerId);
		event.preventDefault();
	}

	#onPointerMove(event: PointerEvent): void
	{
		if (!this.#pointers.has(event.pointerId))
		{
			return;
		}

		this.#pointers.set(event.pointerId, this.#point(event));

		if (this.#pinch)
		{
			event.preventDefault();
			this.#updatePinch();

			return;
		}

		if (this.#drag?.pointerId !== event.pointerId || !this.#zoom)
		{
			return;
		}

		event.preventDefault();
		this.#zoom = {
			scale: this.#zoom.scale,
			...this.#clamp(
				this.#zoom.scale,
				this.#drag.x + (event.clientX - this.#drag.pointerX),
				this.#drag.y + (event.clientY - this.#drag.pointerY),
			),
		};
		this.#apply();
	}

	#onPointerEnd(event: PointerEvent): void
	{
		this.#pointers.delete(event.pointerId);

		if (this.#pinch && this.#pointers.size < 2)
		{
			this.#pinch = null;
		}

		if (this.#drag?.pointerId === event.pointerId)
		{
			if (this.#capture.hasPointerCapture?.(event.pointerId))
			{
				this.#capture.releasePointerCapture(event.pointerId);
			}

			this.#drag = null;
		}
	}

	// The capture layer shows a magnifier, so a click has to actually magnify. Only from fit, though:
	// once zoomed, a press is the start of a pan.
	#onClick(event: MouseEvent): void
	{
		if (this.#zoom !== null)
		{
			return;
		}

		// A diagram in the document opens fullscreen instead of creeping up one step at a time: a
		// block only ever has a slice of the page, and a schema worth clicking on is worth the screen.
		// Works from a tap too - unlike zooming in place, this traps nothing, the reader just closes it.
		if (!this.#immersive)
		{
			this.#onActivate?.();

			return;
		}

		this.#setZoom(stepScale(this.#fitScale(), 1), this.#point(event));
	}

	#onDoubleClick(event: MouseEvent): void
	{
		// In the document the first click has already opened fullscreen, so there is nothing sensible
		// left for a double click to mean here.
		if (!this.#immersive)
		{
			return;
		}

		event.preventDefault();

		if (this.#zoom !== null)
		{
			this.reset();

			return;
		}

		// Natural size, or twice it for a diagram that already fits without shrinking.
		this.#setZoom(this.#fitScale() >= 1 ? 2 : 1, this.#point(event));
	}

	#startPinch(): void
	{
		const distance = this.#pinchDistance();
		if (distance === null)
		{
			return;
		}

		// A pinch takes over from a drag that was already running.
		this.#drag = null;
		this.#pinch = { distance, scale: this.#zoom?.scale ?? this.#fitScale() };
	}

	#updatePinch(): void
	{
		const distance = this.#pinchDistance();
		const center = this.#pinchCenter();
		if (distance === null || center === null || !(this.#pinch.distance > 0))
		{
			return;
		}

		this.#setZoom(this.#pinch.scale * (distance / this.#pinch.distance), center);

		// Pinching all the way back drops the zoom, and dropping it ends the gesture - re-base it on
		// the fingers that are still down so spreading them again keeps working without lifting.
		if (this.#zoom === null && this.#pointers.size === 2)
		{
			this.#pinch = { distance, scale: this.#fitScale() };
		}
	}

	#pinchDistance(): ?number
	{
		const [first, second] = [...this.#pointers.values()];
		if (!first || !second)
		{
			return null;
		}

		return Math.hypot(second.x - first.x, second.y - first.y);
	}

	#pinchCenter(): ?Object
	{
		const [first, second] = [...this.#pointers.values()];
		if (!first || !second)
		{
			return null;
		}

		return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
	}
}
