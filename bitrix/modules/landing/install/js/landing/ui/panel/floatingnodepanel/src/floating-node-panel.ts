import { Dom, Event, Tag, Text, Type } from 'main.core';
import { BasePanel } from 'landing.ui.panel.base';
// base .ui-icon-set machinery; the concrete icon set (main/outline/...)
// is loaded by the consumer that provides the button iconClass
import 'ui.icon-set';

import './css/style.css';

export type FloatingNodePanelButton = {
	id: string;
	iconClass: string;
	// required: it is the only accessible name of the icon-only button
	title: string;
	onClick: (event: MouseEvent) => void;
};

export type FloatingNodePanelOptions = {
	buttons: FloatingNodePanelButton[];
};

const PANEL_INSET = 12;

/**
 * Universal floating panel attached to an editable node.
 *
 * Shows itself in the top right corner of the target node on `mouseenter`
 * and hides immediately on `mouseleave`. Moving the cursor between the node
 * and the panel does not hide it: `mouseleave` is ignored when
 * `event.relatedTarget` is inside the panel or the node. The same handlers
 * back `focusin`/`focusout`, so the panel is fully reachable by keyboard:
 * focusing the node (made focusable on attach) shows it and, when the focus
 * came from the keyboard, moves focus onto the panel button.
 * A shown panel is also dismissable with the Escape key (WCAG 1.4.13).
 *
 * The panel knows nothing about node types: buttons (icon + click handler)
 * are fully provided by the caller.
 *
 * Lifecycle: the owner of the panel is responsible for calling `detach()`
 * when the target node leaves the DOM (e.g. `Img.destroyFloatingPanel()`
 * detaches on the `BX.Landing.Block:remove` custom event, fired on block
 * remove and reload/undo/redo). Without `detach()` the panel layout stays
 * in the body and retains the target node subtree.
 *
 * @memberOf BX.Landing.UI.Panel
 */
export class FloatingNodePanel extends BasePanel
{
	#buttons: FloatingNodePanelButton[];

	#targetNode: HTMLElement | null = null;

	// original 'tabindex' attribute of the target node, captured only when
	// attach makes the node focusable; `undefined` means attach did not touch
	// it. `null` = the attribute was absent, a string = its previous value, so
	// detach can restore the node exactly and not leave it stuck in tab order.
	#targetNodeTabIndex: string | null | undefined = undefined;

	// guards the focusin fired by the programmatic focus return in hide()
	// from re-showing the panel (e.g. Escape while a panel button is focused)
	#restoringFocus: boolean = false;

	constructor(options: FloatingNodePanelOptions)
	{
		super();
		this.setEventNamespace('BX.Landing.UI.Panel.FloatingNodePanel');

		this.#buttons = Type.isArrayFilled(options?.buttons) ? options.buttons : [];

		Dom.addClass(this.layout, 'landing-ui-panel-floating-node');
		this.#buttons.forEach((button) => this.appendContent(this.#renderButton(button)));

		Event.bind(this.layout, 'mouseenter', this.#onMouseEnter);
		Event.bind(this.layout, 'mouseleave', this.#onMouseLeave);
	}

	/**
	 * Binds the panel to the target node: the panel is appended to the node's
	 * document and starts to show/hide on the node hover.
	 */
	attach(targetNode: HTMLElement): void
	{
		if (!Type.isDomNode(targetNode))
		{
			return;
		}

		this.detach();

		// make a non-focusable node (typically an <img> or a background <div>)
		// reachable by keyboard while the panel is attached, remembering the
		// original tabindex so detach can restore it
		if (targetNode.tabIndex < 0)
		{
			this.#targetNodeTabIndex = targetNode.getAttribute('tabindex');
			targetNode.tabIndex = 0;
		}

		this.#targetNode = targetNode;
		Event.bind(targetNode, 'mouseenter', this.#onMouseEnter);
		Event.bind(targetNode, 'mouseleave', this.#onMouseLeave);
		Event.bind(targetNode, 'focusin', this.#onMouseEnter);
		Event.bind(targetNode, 'focusout', this.#onMouseLeave);
		Event.bind(targetNode.ownerDocument, 'keydown', this.#onKeyDown);
		this.renderTo(targetNode.ownerDocument.body);
		Event.bind(this.layout, 'focusout', this.#onMouseLeave);
	}

	/**
	 * Removes hover listeners from the current target node
	 * and removes the panel layout from the DOM.
	 */
	detach(): void
	{
		if (!this.#targetNode)
		{
			return;
		}

		Event.unbind(this.#targetNode, 'mouseenter', this.#onMouseEnter);
		Event.unbind(this.#targetNode, 'mouseleave', this.#onMouseLeave);
		Event.unbind(this.#targetNode, 'focusin', this.#onMouseEnter);
		Event.unbind(this.#targetNode, 'focusout', this.#onMouseLeave);
		Event.unbind(this.#targetNode.ownerDocument, 'keydown', this.#onKeyDown);
		Event.unbind(this.layout, 'focusout', this.#onMouseLeave);
		this.#restoreTargetNodeTabIndex();
		this.#targetNode = null;
		this.remove();
	}

	// undoes the tabIndex made focusable on attach, so the node does not stay
	// stuck in the tab order after detach: absent attribute is removed again,
	// a previous value is put back
	#restoreTargetNodeTabIndex(): void
	{
		if (this.#targetNodeTabIndex === undefined || !this.#targetNode)
		{
			return;
		}

		if (this.#targetNodeTabIndex === null)
		{
			this.#targetNode.removeAttribute('tabindex');
		}
		else
		{
			this.#targetNode.setAttribute('tabindex', this.#targetNodeTabIndex);
		}

		this.#targetNodeTabIndex = undefined;
	}

	show(): Promise<any>
	{
		if (!this.isShown())
		{
			Dom.removeClass(this.layout, this.classHide);
			Dom.addClass(this.layout, this.classShow);
		}

		this.#adjustPosition();

		return Promise.resolve();
	}

	hide(): Promise<any>
	{
		// focus must not stay on the hidden (display: none) button:
		// hand it back to the target node before hiding
		const focusWasInside = this.layout.contains(this.layout.ownerDocument.activeElement);

		if (this.isShown())
		{
			Dom.removeClass(this.layout, this.classShow);
			Dom.addClass(this.layout, this.classHide);
		}

		if (focusWasInside)
		{
			this.#restoringFocus = true;
			this.#targetNode?.focus({ preventScroll: true });
			this.#restoringFocus = false;
		}

		return Promise.resolve();
	}

	#renderButton(button: FloatingNodePanelButton): HTMLElement
	{
		const layout = Tag.render`
			<button
				type="button"
				class="landing-ui-panel-floating-node__button"
				data-id="${Text.encode(button.id)}"
				data-testid="${Text.encode(`landing-floating-node-${button.id}-btn`)}"
				title="${Text.encode(button.title)}"
			>
				<span class="ui-icon-set ${Text.encode(button.iconClass)} landing-ui-panel-floating-node__icon"></span>
			</button>
		`;

		Event.bind(layout, 'click', (event: MouseEvent) => {
			event.preventDefault();
			event.stopPropagation();
			button.onClick(event);
		});

		return layout;
	}

	#onMouseEnter = (event: MouseEvent | FocusEvent): void => {
		if (this.#restoringFocus)
		{
			return;
		}

		void this.show();

		// keyboard focus (`:focus-visible`) pulls focus into the panel so the
		// button is operable; pointer/programmatic focus just reveals the panel
		if (event.type === 'focusin' && this.#targetNode?.matches(':focus-visible'))
		{
			this.layout.querySelector('button')?.focus();
		}
	};

	#onMouseLeave = (event: MouseEvent | FocusEvent): void => {
		const relatedTarget = event.relatedTarget;

		// cursor moved between the node and the panel: keep the panel shown
		if (
			Type.isDomNode(relatedTarget)
			&& (
				this.layout.contains(relatedTarget)
				|| (this.#targetNode && this.#targetNode.contains(relatedTarget))
			)
		)
		{
			return;
		}

		// relatedTarget is null when the cursor leaves the window: hide as well
		void this.hide();
	};

	// hover content must be dismissable without moving the pointer (WCAG 1.4.13)
	#onKeyDown = (event: KeyboardEvent): void => {
		if (event.key === 'Escape' && this.isShown())
		{
			void this.hide();
		}
	};

	#adjustPosition(): void
	{
		if (!this.#targetNode)
		{
			return;
		}

		const targetWindow = this.#targetNode.ownerDocument.defaultView;
		if (!targetWindow)
		{
			return;
		}

		const targetRect = this.#targetNode.getBoundingClientRect();
		const panelRect = this.layout.getBoundingClientRect();

		// The panel is positioned from the untransformed box of the node:
		// css transforms (e.g. hover:scale-105 with transition) change
		// getBoundingClientRect mid-animation and make the panel jump.
		// With the default transform-origin (center) the rect center is
		// transform-invariant, and offsetWidth/offsetHeight are layout sizes
		// that ignore transforms. Fallback to the rect if offset sizes
		// are unavailable (e.g. non-rendered element).
		const centerX = targetRect.left + (targetRect.width / 2);
		const centerY = targetRect.top + (targetRect.height / 2);
		const targetWidth = this.#targetNode.offsetWidth || targetRect.width;
		const targetHeight = this.#targetNode.offsetHeight || targetRect.height;

		const targetTop = centerY - (targetHeight / 2);
		const targetLeft = centerX - (targetWidth / 2);
		const targetRight = centerX + (targetWidth / 2);

		const top = targetTop + targetWindow.pageYOffset + PANEL_INSET;
		const left = Math.max(
			targetLeft + targetWindow.pageXOffset + PANEL_INSET,
			targetRight + targetWindow.pageXOffset - panelRect.width - PANEL_INSET,
		);

		Dom.style(this.layout, {
			top: `${top}px`,
			left: `${left}px`,
		});
	}
}
