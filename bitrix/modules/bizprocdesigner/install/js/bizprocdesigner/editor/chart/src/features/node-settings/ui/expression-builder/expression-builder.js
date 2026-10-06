import { Type, Runtime, Event, Dom } from 'main.core';
import { Popup } from 'ui.vue3.components.popup';

import { useLoc } from '../../../../shared/composables';

import { ExpressionBuilderBody } from './expression-builder-body';
import { type NodeContext } from './expression-sources';
import { calculatePopupHeightBelow, calculatePopupShiftUp, calculatePopupWidth } from './popup-fit';

// The popup always opens below its trigger, never flips up, and main.popup shifts it left off
// the right edge on its own. forceBindPosition lets every re-fit recompute the placement.
const POPUP_BIND_OPTIONS = Object.freeze({
	position: 'bottom',
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
		nodeContext:
		{
			type: Object,
			default: (): NodeContext => ({}),
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
				bindOptions: POPUP_BIND_OPTIONS,
				autoHideHandler: this.shouldAutoHide,
			};
		},
	},
	created(): void
	{
		this.onWindowResize = Runtime.debounce(this.scheduleReposition, 100, this);
	},
	mounted(): void
	{
		Event.bind(window, 'resize', this.onWindowResize);
		this.scheduleReposition();
	},
	beforeUnmount(): void
	{
		Event.unbind(window, 'resize', this.onWindowResize);
	},
	methods:
	{
		scheduleReposition(): void
		{
			void this.$nextTick(() => {
				// Size first, place second: main.popup reads the popup height inside
				// adjustPosition(), so the height must already be on the element by then.
				this.applyViewportFit();
				this.adjustPopupPosition();
			});
		},
		/**
		 * Sizes the popup to what the window leaves around its trigger: the whole height below it
		 * less the margin from the edge, and a width a narrow window can hold. Lifts the popup up
		 * when the minimum height would take its footer past the bottom edge.
		 *
		 * Geometry-only: content never changes it, so the window keeps its size across modes and
		 * main.popup places the popup by the height it already has.
		 */
		applyViewportFit(): void
		{
			const rootEl = this.$refs.body?.$el;
			if (!Type.isDomNode(rootEl) || !Type.isDomNode(this.bindElement))
			{
				return;
			}

			const triggerBottom = this.bindElement.getBoundingClientRect().bottom;
			const viewportHeight = window.innerHeight;
			const chromeHeight = this.getPopupChromeHeight(rootEl);
			const height = calculatePopupHeightBelow({ triggerBottom, viewportHeight });

			Dom.style(rootEl, '--eb-height', `${Math.max(0, height - chromeHeight)}px`);

			const popupInstance = this.$refs.popup?.getPopupInstance?.();
			popupInstance?.setWidth(calculatePopupWidth({ viewportWidth: window.innerWidth }));
			popupInstance?.setOffset({
				offsetTop: -calculatePopupShiftUp({ triggerBottom, viewportHeight, popupHeight: height }),
			});
		},
		// Borders of main.popup's own container: our height sits on the content root, the window
		// budget applies to the container around it.
		getPopupChromeHeight(rootEl: HTMLElement): number
		{
			const containerEl = this.$refs.popup?.getPopupInstance?.()?.getPopupContainer?.();

			return containerEl ? Math.max(0, containerEl.offsetHeight - rootEl.offsetHeight) : 0;
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
		adjustPopupPosition(): void
		{
			this.$refs.popup?.getPopupInstance?.()?.adjustPosition(POPUP_BIND_OPTIONS);
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
				:nodeContext="nodeContext"
				@apply="handleApply"
				@close="handleClose"
			/>
		</Popup>
	`,
};
