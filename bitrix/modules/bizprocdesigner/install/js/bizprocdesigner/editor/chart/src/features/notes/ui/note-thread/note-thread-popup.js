/**
 * The surface a thread of a note is drawn on: a dialog pinned to the marker of its note and
 * held whole inside the drawn area of the canvas (AC-014). The popup lives beside the markers, in the
 * same layer and the same coordinates, so the camera that moves a marker moves the popup with it.
 *
 * It knows nothing of the notes: what it is given is a point to open at and an area to stay within,
 * and what it gives back is the wish to be closed. The conversation itself belongs to `note-thread`.
 *
 * Its styles live in `note-thread.css` together with the ones of the thread: the two are one control
 * split by what each of them is responsible for, and not two controls.
 */

import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { Outline } from 'ui.icon-set.api.vue';
import { Type } from 'main.core';
import { defineComponent, nextTick } from 'ui.vue3';

/** A point of the screen, counted from the corner of the drawn area of the canvas. */
export type ThreadPoint = {
	x: number,
	y: number,
};

export type ThreadBox = {
	width: number,
	height: number,
};

export type ThreadPlacement = {
	x: number,
	y: number,
	isFlippedX: boolean,
	isFlippedY: boolean,
};

const ESCAPE_KEY = 'Escape';

/** The gap between the marker and the popup: the marker stays readable beside the thread it opened. */
const ANCHOR_GAP = 12;

/** How close to the edge of the canvas the popup is allowed to stand. */
const VIEWPORT_MARGIN = 8;

/**
 * One axis of the placement. The popup opens forward - to the right of the marker and below it - and
 * turns to the opposite side when the forward one has no room for it and the opposite one has (AC-014).
 * Whatever the side, the result is pulled inside the area afterwards: a popup taller or wider than the
 * space left on either side has to be seen whole all the same, and a corner is where it then stands.
 */
function placeOnAxis(anchor: number, size: number, viewport: number): { start: number, isFlipped: boolean }
{
	const forward = anchor + ANCHOR_GAP;
	const backward = anchor - ANCHOR_GAP - size;
	const fitsForward = (forward + size) <= (viewport - VIEWPORT_MARGIN);
	const fitsBackward = backward >= VIEWPORT_MARGIN;
	const isFlipped = !fitsForward && fitsBackward;
	const limit = Math.max(VIEWPORT_MARGIN, viewport - VIEWPORT_MARGIN - size);
	const start = isFlipped ? backward : forward;

	return {
		start: Math.min(Math.max(start, VIEWPORT_MARGIN), limit),
		isFlipped,
	};
}

/** Where the popup of the given size opens beside the given point without leaving the given area. */
export function resolveThreadPlacement(
	anchor: ThreadPoint,
	size: ThreadBox,
	viewport: ThreadBox,
): ThreadPlacement
{
	const horizontal = placeOnAxis(anchor.x, size.width, viewport.width);
	const vertical = placeOnAxis(anchor.y, size.height, viewport.height);

	return {
		x: Math.round(horizontal.start),
		y: Math.round(vertical.start),
		isFlippedX: horizontal.isFlipped,
		isFlippedY: vertical.isFlipped,
	};
}

/**
 * Whether the marker of the note still stands within the drawn area. A thread whose marker was moved
 * out of it by the camera has nothing left to be pinned to and is closed rather than left hanging
 * over the schema on its own (AC-014a).
 */
export function isAnchorVisible(anchor: ThreadPoint, viewport: ThreadBox): boolean
{
	return anchor.x >= 0
		&& anchor.x <= viewport.width
		&& anchor.y >= 0
		&& anchor.y <= viewport.height
	;
}

export const NoteThreadPopup = defineComponent({
	name: 'BizprocdesignerNoteThreadPopup',
	components: { UiButton },
	props: {
		// the point of the marker the thread was opened from, in the coordinates of the canvas layer
		anchorX: {
			type: Number,
			required: true,
		},
		anchorY: {
			type: Number,
			required: true,
		},
		viewportWidth: {
			type: Number,
			required: true,
		},
		viewportHeight: {
			type: Number,
			required: true,
		},
		ariaLabel: {
			type: String,
			default: '',
		},
		// the accessible name of the closing, which carries an icon and no text to be named by
		closeLabel: {
			type: String,
			default: '',
		},
		testId: {
			type: String,
			default: '',
		},
		closeTestId: {
			type: String,
			default: '',
		},
	},
	emits: ['close'],
	setup(): Object
	{
		return {
			buttonSize: ButtonSize.SMALL,
			closeButtonStyle: AirButtonStyle.PLAIN_NO_ACCENT,
			closeIcon: Outline.CROSS_M,
		};
	},
	data(): Object
	{
		return {
			width: 0,
			height: 0,
			// The side is chosen by the size of the popup, and the size is only known once it is in the
			// document. It is therefore drawn once without being shown, and never in the wrong place.
			isMeasured: false,
		};
	},
	computed: {
		placement(): ThreadPlacement
		{
			return resolveThreadPlacement(
				{ x: this.anchorX, y: this.anchorY },
				{ width: this.width, height: this.height },
				{ width: this.viewportWidth, height: this.viewportHeight },
			);
		},
		// A translation rather than left/top, as the markers of the layer above the same canvas.
		popupStyle(): { transform: string, visibility?: string }
		{
			const style = { transform: `translate(${this.placement.x}px, ${this.placement.y}px)` };

			return this.isMeasured ? style : { ...style, visibility: 'hidden' };
		},
		// The horizontal side is the whole doing of `placement.x`; the vertical one is also a shadow,
		// which has to fall away from the marker the popup opened above.
		popupClasses(): { [string]: boolean }
		{
			return { '--flipped-y': this.placement.isFlippedY };
		},
		// The dataset key is lower-case on purpose: `testid` renders as data-testid, the attribute
		// page.getByTestId() looks for, while a camel-cased `testId` would render data-test-id.
		closeButtonDataset(): { testid: string }
		{
			return { testid: this.closeTestId };
		},
	},
	created(): void
	{
		// Off data() on purpose: neither the observer nor the element that had the focus is rendered,
		// and a reactive proxy over a DOM node would be the only thing this component adds to it.
		this.sizeObserver = null;
		this.opener = null;
	},
	mounted(): void
	{
		this.opener = Type.isDomNode(document.activeElement) ? document.activeElement : null;
		this.nameCloseButton();
		this.measure();
		this.observeSize();
		void this.focusPopup();
	},
	beforeUnmount(): void
	{
		this.sizeObserver?.disconnect();
		this.sizeObserver = null;
		this.restoreFocus();
	},
	methods: {
		/**
		 * The dialog takes the focus in, so the keyboard reaches the conversation and the field of the
		 * reply by going on from here instead of walking through the rest of the markers first.
		 *
		 * The side of the popup is only known once it has been measured, so until then it stands
		 * hidden - and a hidden element takes no focus. The wait is for that hiding to be lifted.
		 */
		async focusPopup(): Promise<void>
		{
			await nextTick();

			this.$refs.popup?.focus({ preventScroll: true });
		},
		/**
		 * The size the popup takes with the conversation it holds. It changes with the thread itself -
		 * a message arrives, an edit opens a field - and every change may turn the popup to the other
		 * side of its marker.
		 */
		measure(): void
		{
			const popup = this.$refs.popup ?? null;
			if (popup === null)
			{
				return;
			}

			const box = popup.getBoundingClientRect();
			if (box.width !== this.width || box.height !== this.height)
			{
				this.width = box.width;
				this.height = box.height;
			}

			this.isMeasured = true;
		},
		observeSize(): void
		{
			if (!Type.isFunction(ResizeObserver) || !Type.isDomNode(this.$refs.popup))
			{
				return;
			}

			this.sizeObserver = new ResizeObserver(() => this.measure());
			this.sizeObserver.observe(this.$refs.popup);
		},
		/**
		 * The focus goes back to whatever opened the thread - its marker - and only when it is leaving
		 * the popup along with it. A thread closed by opening another one has already handed the focus
		 * to the marker of that one, and a note that is gone has no marker left to go back to.
		 */
		restoreFocus(): void
		{
			const isFocusInside = this.$refs.popup?.contains(document.activeElement) === true;

			if (isFocusInside && this.opener !== null && document.contains(this.opener))
			{
				this.opener.focus({ preventScroll: true });
			}

			this.opener = null;
		},
		/**
		 * UiButton builds its native button imperatively, so an attribute bound in the template never
		 * reaches it: the placeholder it is bound to leaves the document as soon as the real button is
		 * in it. An icon-only button has no text to be named by, so the name is written onto the
		 * element itself, the way the menu button of this editor does it.
		 */
		nameCloseButton(): void
		{
			this.$refs.close?.button?.setProps({ 'aria-label': this.closeLabel });
		},
		/**
		 * The keys of the thread stop at the thread: Escape closes it instead of leaving the mode of
		 * the notes, and the shortcuts of the canvas do not fire over a message being written.
		 */
		handleKeydown(event: KeyboardEvent): void
		{
			if (event.key === ESCAPE_KEY)
			{
				this.$emit('close');
			}
		},
	},
	template: `
		<div
			class="editor-chart-note-thread"
			:class="popupClasses"
			:style="popupStyle"
			ref="popup"
			role="dialog"
			tabindex="-1"
			:aria-label="ariaLabel"
			:data-testid="testId"
			@keydown.stop="handleKeydown"
		>
			<div class="editor-chart-note-thread__head">
				<slot name="head"/>
				<UiButton
					ref="close"
					:leftIcon="closeIcon"
					:size="buttonSize"
					:style="closeButtonStyle"
					:dataset="closeButtonDataset"
					@click="$emit('close')"
				/>
			</div>
			<slot/>
		</div>
	`,
});
