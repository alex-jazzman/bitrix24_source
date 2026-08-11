import { Loc, Type } from 'main.core';

// Width is stored as a percentage of the container. Resize is dragged in px (natural for the mouse)
// then converted to %. Float media cap at 70% so wrapped text keeps a column; others fill to 100%.
export const MIN_PCT = 10;
export const FLOAT_MAX_PCT = 70;
export const MAX_PCT = 100;

// Shared resize / align / overlay-pill logic. Host component must provide a `hasMedia` computed.
export const ResizableMediaMixin = {
	data(): Object
	{
		return {
			dragging: false,
			draftWidth: null,
			startX: 0,
			startWidth: 0,
			side: 'right',
			pendingClientX: 0,
			rafId: null,
			pointerId: null,
			captureEl: null,
			// Extra translateX applied to the overlay pill so it stays within .note-editor-content.
			overlayTranslateX: 0,
			clampRafId: null,
		};
	},
	computed: {
		isFloat(): boolean
		{
			return this.align === 'left' || this.align === 'right';
		},
		showHandles(): boolean
		{
			return this.editable
				&& this.selected
				&& this.hasMedia
				&& !this.isResolving
				&& !this.isUnavailable;
		},
		// Align pill — shown only while the media node is selected.
		showOverlay(): boolean
		{
			return this.editable
				&& this.selected
				&& this.hasMedia
				&& !this.isResolving
				&& !this.isUnavailable;
		},
		alignTitles(): Object
		{
			return {
				left: Loc.getMessage('NOTE_EDITOR_TOOLBAR_ALIGN_LEFT'),
				center: Loc.getMessage('NOTE_EDITOR_TOOLBAR_ALIGN_CENTER'),
				right: Loc.getMessage('NOTE_EDITOR_TOOLBAR_ALIGN_RIGHT'),
			};
		},
		overlayStyle(): Object
		{
			const shift = this.overlayTranslateX;
			return { transform: `translateX(calc(-50% + ${shift}px))` };
		},
	},
	watch: {
		showOverlay(visible)
		{
			if (visible)
			{
				// Wait for DOM to render the pill before measuring.
				this.$nextTick(() => {
					this.scheduleClamp();
					this.attachClampListeners();
				});
			}
			else
			{
				this.detachClampListeners();
				this.overlayTranslateX = 0;
			}
		},
		// Re-clamp whenever width or alignment changes while the pill is visible.
		width()
		{
			if (this.showOverlay)
			{
				this.scheduleClamp();
			}
		},
		align()
		{
			if (this.showOverlay)
			{
				this.scheduleClamp();
			}
		},
	},
	beforeUnmount(): void
	{
		this.detachDragListeners();
		this.detachClampListeners();
		if (this.rafId !== null)
		{
			cancelAnimationFrame(this.rafId);
			this.rafId = null;
		}
		if (this.clampRafId !== null)
		{
			cancelAnimationFrame(this.clampRafId);
			this.clampRafId = null;
		}
	},
	methods: {
		// Pill clamp: keep .note-editor-media-overlay within .note-editor-content bounds.
		clampOverlay(): void
		{
			const overlay = this.$el?.querySelector('.note-editor-media-overlay');
			const content = this.$el?.closest?.('.note-editor-content');
			if (!overlay || !content)
			{
				this.overlayTranslateX = 0;
				return;
			}

			const MARGIN = 4;
			const oRect = overlay.getBoundingClientRect();
			const cRect = content.getBoundingClientRect();

			// The pill is currently shifted by overlayTranslateX; derive its base (untransformed)
			// edges by subtracting the applied shift, so the result is absolute from the center.
			const baseLeft = oRect.left - this.overlayTranslateX;
			const baseRight = oRect.right - this.overlayTranslateX;

			const overLeft = cRect.left + MARGIN - baseLeft;
			const overRight = baseRight - (cRect.right - MARGIN);

			let shift = 0;
			if (overLeft > 0)
			{
				shift = overLeft;
			}
			else if (overRight > 0)
			{
				shift = -overRight;
			}

			this.overlayTranslateX = shift;
		},
		scheduleClamp(): void
		{
			if (this.clampRafId !== null)
			{
				return;
			}
			this.clampRafId = requestAnimationFrame(() => {
				this.clampRafId = null;
				this.clampOverlay();
			});
		},
		attachClampListeners(): void
		{
			window.addEventListener('resize', this.scheduleClamp, { passive: true });
			// Scroll on the main content scroller (document capture, as per project convention).
			document.addEventListener('scroll', this.scheduleClamp, { passive: true, capture: true });
		},
		detachClampListeners(): void
		{
			window.removeEventListener('resize', this.scheduleClamp);
			document.removeEventListener('scroll', this.scheduleClamp, { capture: true });
		},
		// The block element (this.dom in the NodeView) carries the width; media fills it 100%.
		// Resolved via data-type attribute so this mixin is node-agnostic.
		blockEl(): HTMLElement | null
		{
			return this.$el?.closest?.('[data-type]') || null;
		},
		containerWidth(): number
		{
			const parent = this.blockEl()?.parentElement;
			if (!parent)
			{
				return 0;
			}

			// Use the content-box width (the reference a `%` width resolves against), not clientWidth:
			// the prose container has horizontal padding (heading-anchor gutter), so clientWidth is
			// wider than the % base. Computing the committed % off clientWidth made every drop ~11%
			// too small, so the media always snapped narrower on release.
			const cs = getComputedStyle(parent);

			return parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
		},
		startResize(side: string, event: PointerEvent): void
		{
			event.preventDefault();
			event.stopPropagation();

			const block = this.blockEl();
			this.side = side;
			this.startX = event.clientX;
			this.startWidth = block ? block.offsetWidth : 0;
			this.draftWidth = this.startWidth;
			this.dragging = true;

			// Pointer Events cover mouse + touch with one path; capture keeps the drag glued to the
			// handle even when the finger/cursor leaves it (touch on mobile would otherwise lose it).
			this.pointerId = event.pointerId;
			this.captureEl = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
			if (this.captureEl && this.pointerId != null)
			{
				try { this.captureEl.setPointerCapture(this.pointerId); }
				catch { /* capture is best-effort */ }
			}

			// Tell the NodeView to suspend responsive recompute — it would fight the live drag width.
			if (Type.isFunction(this.onResizeActive))
			{
				this.onResizeActive(true);
			}

			document.addEventListener('pointermove', this.onDrag);
			document.addEventListener('pointerup', this.stopResize);
			document.addEventListener('pointercancel', this.stopResize);
		},
		onDrag(event: PointerEvent): void
		{
			this.pendingClientX = event.clientX;
			if (this.rafId !== null)
			{
				return;
			}

			this.rafId = requestAnimationFrame(() => {
				this.rafId = null;
				const containerW = this.containerWidth();
				if (containerW <= 0)
				{
					return;
				}

				const cap = this.isFloat ? FLOAT_MAX_PCT : MAX_PCT;
				const minPx = (containerW * MIN_PCT) / 100;
				const maxPx = (containerW * cap) / 100;
				const delta = this.pendingClientX - this.startX;
				const raw = this.side === 'left' ? this.startWidth - delta : this.startWidth + delta;
				const px = Math.round(Math.min(Math.max(raw, minPx), maxPx));
				this.draftWidth = px;

				// Live preview straight on the block (px); the commit below converts to %.
				const block = this.blockEl();
				if (block)
				{
					block.style.width = `${px}px`;
				}

				// Let the NodeView recompute stacking against the live width every frame.
				if (Type.isFunction(this.onResizeProgress))
				{
					this.onResizeProgress();
				}
			});
		},
		stopResize(): void
		{
			this.detachDragListeners();
			if (this.rafId !== null)
			{
				cancelAnimationFrame(this.rafId);
				this.rafId = null;
			}

			const containerW = this.containerWidth();
			const finalPx = this.draftWidth;
			this.dragging = false;
			this.draftWidth = null;

			// Resume responsive recompute before committing, so the post-commit layout re-applies
			// the final width (and re-evaluates stacking) instead of leaving the raw drag px.
			if (Type.isFunction(this.onResizeActive))
			{
				this.onResizeActive(false);
			}

			if (!Type.isFunction(this.onResize) || !Number.isInteger(finalPx) || finalPx <= 0 || containerW <= 0)
			{
				return;
			}

			const cap = this.isFloat ? FLOAT_MAX_PCT : MAX_PCT;
			// Keep two decimals (0.01% steps) so the committed width doesn't snap to a visible %-grid.
			const rawPct = (finalPx / containerW) * 100;
			const pct = Math.round(Math.min(Math.max(rawPct, MIN_PCT), cap) * 100) / 100;
			this.onResize(pct);
		},
		detachDragListeners(): void
		{
			document.removeEventListener('pointermove', this.onDrag);
			document.removeEventListener('pointerup', this.stopResize);
			document.removeEventListener('pointercancel', this.stopResize);

			if (this.captureEl && this.pointerId != null)
			{
				try { this.captureEl.releasePointerCapture(this.pointerId); }
				catch { /* already released */ }
			}
			this.captureEl = null;
			this.pointerId = null;
		},
		setAlign(value: string): void
		{
			if (Type.isFunction(this.onAlign))
			{
				this.onAlign(value);
			}
		},
	},
};
