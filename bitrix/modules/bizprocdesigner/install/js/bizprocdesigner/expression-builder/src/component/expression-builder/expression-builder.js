import { Type, Runtime, Event, Dom } from 'main.core';
import { Popup } from 'ui.vue3.components.popup';

import { useLoc } from '../../lib/use-loc/use-loc';

import { ExpressionBuilderBody } from '../expression-builder-body/expression-builder-body';
import { calculatePopupMaxHeight, calculatePopupWidth } from '../../lib/popup-fit/popup-fit';

// The side is a one-way latch, see latchPopupSideAbove(). While the window is below its trigger
// the side is main.popup's to choose: it moves the window above when it does not fit below, angle
// and all, and it shifts it left off the right edge on its own too. Once the window is above the
// trigger it is bound by these options instead, and forceTop takes one of the two ways back below
// out of calculatePopupTopFromAbove(): the one that returns a window standing above the scroll
// position. The other one - a top edge past the top of the document - forceTop leaves in place,
// so what actually keeps the window above the trigger is the ceiling it is given: see the `top`
// side of calculatePopupMaxHeight() in popup-fit.js for the invariant that holds it there.
// forceBindPosition lets every re-fit recompute the placement in both cases.
// Passed on as a copy: main.popup keeps the object it is given and writes its own fields into it
// (forceTop, when there is no bindElement), which would both throw on the frozen constant and leak
// that state into the next opening.
const POPUP_BIND_OPTIONS_BELOW = Object.freeze({
	position: 'bottom',
	forceBindPosition: true,
});

const POPUP_BIND_OPTIONS_ABOVE = Object.freeze({
	position: 'top',
	forceTop: true,
	forceBindPosition: true,
});

/**
 * The value constructor as a popup bound to the field it writes to: everything the window shows is
 * {@see ExpressionBuilderBody}, everything about the window itself — its size, its place in the
 * viewport, what closes it and where the focus goes afterwards — is here.
 */
// @vue/component
export const ExpressionBuilder = {
	name: 'ExpressionBuilder',
	components: { Popup, ExpressionBuilderBody },
	props:
	{
		bindElement:
		{
			type: Object,
			default: null,
		},
		initialValue:
		{
			type: String,
			default: '',
		},
		/** Source sections owned by the host, handed on to the body as they are. */
		sourceSections:
		{
			type: Array,
			default: null,
		},
		/** Collects the source sections on demand, handed on to the body as it is. */
		sourcesProvider:
		{
			type: Function,
			default: null,
		},
		/** Lets the body name the values of `sourceSections` on the chips, handed on as it is. */
		allowSourceSectionLabels:
		{
			type: Boolean,
			default: false,
		},
	},
	emits: ['apply', 'close'],
	setup(): Object
	{
		const { getMessage } = useLoc();

		return { getMessage };
	},
	computed:
	{
		popupOptions(): Object
		{
			return {
				id: 'bizprocdesigner-expression-builder-popup',
				ariaLabel: this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_DIALOG_LABEL'),
				// Explicit trap: the portal setting that would turn it on by default is off outside
				// dev environments. Focus returns to the trigger on close; the apply path opts out
				// of the return (see suppressFocusRestore).
				focusTrap: {
					initialFocus: 'container',
					restoreFocus: this.bindElement,
				},
				// Rendered in document.body (default targetContainer) so the narrow, overflow:hidden
				// settings panel cannot clip it; the viewport is then the whole window.
				bindElement: this.bindElement,
				width: calculatePopupWidth({ viewportWidth: window.innerWidth }),
				autoHide: true,
				closeByEsc: true,
				cacheable: false,
				padding: 0,
				angle: true,
				// position:fixed container (main.popup setFixed) keeps the popup out of document
				// flow, so placing it low on the page does not grow document.scrollHeight and no
				// page scrollbar appears. The editor is a full-viewport SPA (page not scrolled), so
				// viewport coords == doc coords and the getBoundingClientRect-based height calc
				// stays correct.
				fixed: true,
				// The window always opens with the side free; the latch closes later, if it closes.
				bindOptions: { ...POPUP_BIND_OPTIONS_BELOW },
				autoHideHandler: this.shouldAutoHide,
			};
		},
	},
	created(): void
	{
		this.onWindowResize = Runtime.debounce(this.scheduleReposition, 100, this);
		this.resizeObserver = null;
		// Which side the window is bound by is nothing the template draws, see latchPopupSideAbove().
		this.isPopupLatchedAbove = false;
	},
	mounted(): void
	{
		Event.bind(window, 'resize', this.onWindowResize);
		this.scheduleReposition();

		// The window is as tall as its content, so a mode switch or a filtered list changes its
		// height. main.popup places the popup once and watches nothing of the kind: a window opened
		// above its trigger would grow down over the field it belongs to. The re-fit keeps the side
		// the window already stands on, see latchPopupSideAbove().
		// typeof, not Type.isFunction: the identifier may be absent, and reading it would throw
		const rootEl = this.getBodyElement();
		if (rootEl && typeof ResizeObserver === 'function')
		{
			this.resizeObserver = new ResizeObserver(() => this.adjustPopupPosition());
			this.resizeObserver.observe(rootEl);
		}
	},
	beforeUnmount(): void
	{
		Event.unbind(window, 'resize', this.onWindowResize);
		this.resizeObserver?.disconnect();
		this.resizeObserver = null;
	},
	methods:
	{
		// The body is a component of its own, so its root element is the one the window sizes.
		getBodyElement(): ?HTMLElement
		{
			const rootEl = this.$refs.body?.$el;

			return Type.isDomNode(rootEl) ? rootEl : null;
		},
		scheduleReposition(): void
		{
			void this.$nextTick(() => {
				// A resized browser window is a new screen, not a changed content: the room on
				// either side of the trigger is different now, so the side is chosen anew.
				this.isPopupLatchedAbove = false;
				// Limits first, place second: main.popup reads the popup height inside
				// adjustPosition() to decide whether the popup goes below the trigger or above it,
				// so the window must already be at its final size by then.
				this.applyViewportFit();
				this.adjustPopupPosition();
			});
		},
		/**
		 * Gives the window the limits the screen sets - the width a narrow window can hold and the
		 * ceiling of the side it is bound by - and nothing more: the height itself comes from the
		 * content, and where the window is placed is main.popup's business.
		 */
		applyViewportFit(): void
		{
			const rootEl = this.getBodyElement();
			if (!rootEl || !Type.isDomNode(this.bindElement))
			{
				return;
			}

			const { top: triggerTop, bottom: triggerBottom } = this.bindElement.getBoundingClientRect();
			const maxHeight = calculatePopupMaxHeight({
				triggerTop,
				triggerBottom,
				viewportHeight: window.innerHeight,
				// Read off the bind options rather than kept alongside them: a ceiling counted from
				// one side while the window is bound by the other lets it overhang the screen.
				side: this.getPopupBindOptions().position,
			});

			Dom.style(rootEl, '--eb-max-height', `${maxHeight}px`);

			this.$refs.popup?.getPopupInstance?.()?.setWidth(
				calculatePopupWidth({ viewportWidth: window.innerWidth }),
			);
		},
		/**
		 * Decides whether an outside click closes the builder (true hides it, see main.popup
		 * handleAutoHide). Everything the builder opens on top of itself (the operation menu, the
		 * HR selector) is a popup of its own in document.body, so without this a click on a menu
		 * item counts as a click outside the builder and closes it mid-interaction.
		 */
		shouldAutoHide({ target }: MouseEvent): boolean
		{
			const containerEl = this.$refs.popup?.getPopupInstance?.()?.getPopupContainer?.();
			if (!containerEl || !Type.isDomNode(target))
			{
				return true;
			}

			if (containerEl === target || containerEl.contains(target))
			{
				return false;
			}

			// Any popup layer, ours or one opened from it: main.popup gives them all this class.
			return target.closest('.popup-window') === null;
		},
		getPopupBindOptions(): Object
		{
			return { ...(this.isPopupLatchedAbove ? POPUP_BIND_OPTIONS_ABOVE : POPUP_BIND_OPTIONS_BELOW) };
		},
		adjustPopupPosition(): void
		{
			const popupInstance = this.$refs.popup?.getPopupInstance?.();
			if (!popupInstance)
			{
				return;
			}

			popupInstance.adjustPosition(this.getPopupBindOptions());

			if (this.latchPopupSideAbove(popupInstance))
			{
				// The ceiling came from the roomier side while the side was still free; now that
				// the window is bound above the trigger, it may only grow up to the top edge.
				this.applyViewportFit();
			}
		},
		/**
		 * A one-way latch on the side of the trigger the window stands on: main.popup may still
		 * move the window above the trigger, but once it is there it stays until the window is
		 * closed. Without this every content change - a mode switch, a filtered list - has
		 * main.popup pick the side anew, and the window jumps from under the cursor to above it
		 * and back.
		 *
		 * The side is read off the placed window instead of being computed: repeating the move
		 * condition of main.popup here would be a second copy of it, free to drift away from the
		 * original. Read by the bottom edge, not by the top one: a window standing above the
		 * trigger ends where the trigger begins and one standing below it starts lower, so the two
		 * cases are the whole height of the window apart, and a window not placed yet does not
		 * pass for one standing above.
		 *
		 * Returns true only on the change, so the caller can re-fit the window once.
		 */
		latchPopupSideAbove(popupInstance: Object): boolean
		{
			if (this.isPopupLatchedAbove || !Type.isDomNode(this.bindElement))
			{
				return false;
			}

			const containerEl = popupInstance.getPopupContainer?.();
			if (!Type.isDomNode(containerEl))
			{
				return false;
			}

			const { bottom: popupBottom, height: popupHeight } = containerEl.getBoundingClientRect();
			if (popupHeight === 0)
			{
				// A window of no size is a window not placed yet: it stands on neither side.
				return false;
			}

			const { top: triggerTop } = this.bindElement.getBoundingClientRect();

			this.isPopupLatchedAbove = popupBottom <= triggerTop;

			return this.isPopupLatchedAbove;
		},
		// The applied value lands in the target field, which takes the focus itself
		// (see insertExpression), so the popup must not pull it back to the trigger on close.
		suppressFocusRestore(): void
		{
			this.$refs.popup?.getPopupInstance?.()?.getFocusTrap?.()?.setRestoreFocus(false);
		},
		handleApply(value: string): void
		{
			this.suppressFocusRestore();
			this.$emit('apply', value);
		},
		handleClose(): void
		{
			this.$emit('close');
		},
	},
	template: `
		<Popup ref="popup" :options="popupOptions" @close="handleClose">
			<ExpressionBuilderBody
				ref="body"
				:initialValue="initialValue"
				:sourceSections="sourceSections"
				:sourcesProvider="sourcesProvider"
				:allowSourceSectionLabels="allowSourceSectionLabels"
				@apply="handleApply"
				@close="handleClose"
			/>
		</Popup>
	`,
};
