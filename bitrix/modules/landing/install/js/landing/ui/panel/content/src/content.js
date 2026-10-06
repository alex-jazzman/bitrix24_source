import 'ui.design-tokens';
import 'ui.fonts.opensans';

import {Type, Dom, Tag, Event} from 'main.core';
import {BasePanel} from 'landing.ui.panel.base';
import getDeltaFromEvent from './internal/get-delta-from-event';
import calculateDurationTransition from './internal/calculate-duration-transition';
import scrollTo from './internal/scroll-to';

import './css/style.css';
import 'landing.utils';
import type {BaseCard} from 'landing.ui.card.basecard';

// Longest panel enter animation (400ms) plus slack. Only matters when `animationend` is late.
const SHOW_ANIMATION_TIMEOUT = 600;

/**
 * @memberOf BX.Landing.UI.Panel
 */
export class Content extends BasePanel
{
	static createOverlay(): HTMLDivElement
	{
		return Tag.render`
			<div class="landing-ui-panel-content-overlay landing-ui-hide" data-is-shown="false" hidden></div>
		`;
	}

	static createHeader(): HTMLDivElement
	{
		return Tag.render`
			<div class="landing-ui-panel-content-element landing-ui-panel-content-header"></div>
		`;
	}

	static createTitle(): HTMLDivElement
	{
		return Tag.render`
			<div class="landing-ui-panel-content-title"></div>
		`;
	}

	static createBody(): HTMLDivElement
	{
		return Tag.render`
			<div class="landing-ui-panel-content-element landing-ui-panel-content-body"></div>
		`;
	}

	static createSidebar(): HTMLDivElement
	{
		return Tag.render`
			<div class="landing-ui-panel-content-body-sidebar"></div>
		`;
	}

	static createContent(): HTMLDivElement
	{
		return Tag.render`
			<div class="landing-ui-panel-content-body-content"></div>
		`;
	}

	static createFooter(): HTMLDivElement
	{
		return Tag.render`
			<div class="landing-ui-panel-content-element landing-ui-panel-content-footer"></div>
		`;
	}

	static calculateTransitionDuration(diff: number = 0): number
	{
		return calculateDurationTransition(diff);
	}

	static scrollTo(container, element: HTMLElement): Promise
	{
		return scrollTo(container, element);
	}

	static getDeltaFromEvent(event)
	{
		return getDeltaFromEvent(event);
	}

	adjustActionsPanels: boolean = true;

	// Real modal slide-out panel: opt in to dialog a11y (role/aria-modal/focus-trap).
	isDialog: boolean = true;

	/**
	 * If panel must hide by press Esc
	 * @type {boolean}
	 */
	closeByEsc: boolean = true;

	constructor(id: string, data = {})
	{
		super(id, data);

		Dom.addClass(this.layout, 'landing-ui-panel-content');

		this.data = Object.freeze(data);

		this.overlay = Content.createOverlay();
		this.header = Content.createHeader();
		this.title = Content.createTitle();
		this.body = Content.createBody();
		this.footer = Content.createFooter();
		this.sidebar = Content.createSidebar();
		this.content = Content.createContent();
		this.closeButton = new BX.Landing.UI.Button.BaseButton('close', {
			className: 'landing-ui-panel-content-close',
			onClick: () => {
				void this.hide();
				this.emit('onCancel');
				BX.onCustomEvent(this, 'BX.Landing.Block:onBlockEditClose', []);
			},
			attrs: {
				title: BX.Landing.Loc.getMessage('LANDING_TITLE_OF_SLIDER_CLOSE'),
			},
		});
		if (Type.isBoolean(data.closeByEsc))
		{
			this.closeByEsc = data.closeByEsc;
		}
		this.disableScroll = Type.isBoolean(data.disableScroll) ? data.disableScroll : false;

		this.forms = new BX.Landing.UI.Collection.FormCollection();
		this.buttons = new BX.Landing.UI.Collection.ButtonCollection();
		this.sidebarButtons = new BX.Landing.UI.Collection.ButtonCollection();
		this.wheelEventName = Type.isNil(window.onwheel) ? window.onwheel : window.onmousewheel;
		this.onMouseWheel = this.onMouseWheel.bind(this);
		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);

		Dom.removeClass(this.layout, 'landing-ui-hide');
		Dom.addClass(this.overlay, 'landing-ui-hide');

		Dom.append(this.sidebar, this.body);
		Dom.append(this.content, this.body);
		Dom.append(this.header, this.layout);
		Dom.append(this.title, this.header);
		Dom.append(this.body, this.layout);
		Dom.append(this.footer, this.layout);
		Dom.append(this.closeButton.layout, this.layout);

		if (Type.isString(data.className))
		{
			Dom.addClass(this.layout, [data.className, `${data.className}-overlay`]);
		}

		if (Type.isString(data.subTitle) && data.subTitle !== '')
		{
			this.subTitle = Tag.render`
				<div class="landing-ui-panel-content-subtitle">${data.subTitle}</div>
			`;

			Dom.append(this.subTitle, this.header);
			Dom.addClass(this.layout, 'landing-ui-panel-content-with-subtitle');
		}

		if (this.data.showFromRight === true)
		{
			this.setLayoutClass('landing-ui-panel-show-from-right');
		}

		this.init();

		Event.bind(window.top, 'keydown', this.onKeyDown.bind(this));
		BX.Landing.PageObject.getEditorWindow();

		if (this.data.scrollAnimation)
		{
			this.scrollObserver = new IntersectionObserver(this.onIntersecting.bind(this));
		}

		this.checkReadyToSave = this.checkReadyToSave.bind(this);
	}

	init()
	{
		Dom.append(this.overlay, window.parent.document.body);

		Event.bind(this.overlay, 'click', () => {
			this.emit('onCancel');
			void this.hide();
		});
		Event.bind(this.layout, 'mouseenter', this.onMouseEnter);
		Event.bind(this.layout, 'mouseleave', this.onMouseLeave);
		Event.bind(this.content, 'mouseenter', this.onMouseEnter);
		Event.bind(this.content, 'mouseleave', this.onMouseLeave);
		Event.bind(this.sidebar, 'mouseenter', this.onMouseEnter);
		Event.bind(this.sidebar, 'mouseleave', this.onMouseLeave);
		Event.bind(this.header, 'mouseenter', this.onMouseEnter);
		Event.bind(this.header, 'mouseleave', this.onMouseLeave);
		Event.bind(this.footer, 'mouseenter', this.onMouseEnter);
		Event.bind(this.footer, 'mouseleave', this.onMouseLeave);

		if ('title' in this.data)
		{
			this.setTitle(this.data.title);
		}

		if ('footer' in this.data)
		{
			if (Type.isArray(this.data.footer))
			{
				this.data.footer.forEach((item) => {
					if (item instanceof BX.Landing.UI.Button.BaseButton)
					{
						this.appendFooterButton(item);
					}

					if (Type.isDomNode(item))
					{
						Dom.append(item, this.footer);
					}
				});
			}
		}
	}

	// eslint-disable-next-line class-methods-use-this
	onIntersecting(items)
	{
		items.forEach((item) => {
			if (item.isIntersecting)
			{
				Dom.removeClass(item.target, 'landing-ui-is-not-visible');
				Dom.addClass(item.target, 'landing-ui-is-visible');
			}
			else
			{
				Dom.addClass(item.target, 'landing-ui-is-not-visible');
				Dom.removeClass(item.target, 'landing-ui-is-visible');
			}
		});
	}

	onKeyDown(event)
	{
		if (this.closeByEsc && event.keyCode === 27)
		{
			this.emit('onCancel');
			void this.hide();
		}
	}

	onMouseEnter(event)
	{
		event.stopPropagation();

		Event.bind(this.layout, this.wheelEventName, this.onMouseWheel);
		Event.bind(this.layout, 'touchmove', this.onMouseWheel);

		if (
			this.sidebar.contains(event.target)
			|| this.content.contains(event.target)
			|| this.header.contains(event.target)
			|| this.footer.contains(event.target)
			|| (this.right && this.right.contains(event.target))
		)
		{
			this.scrollTarget = event.currentTarget;
		}
	}

	onMouseLeave(event)
	{
		event.stopPropagation();

		BX.unbind(this.layout, this.wheelEventName, this.onMouseWheel);
		BX.unbind(this.layout, 'touchmove', this.onMouseWheel);
	}

	onMouseWheel(event)
	{
		event.preventDefault();
		event.stopPropagation();

		const delta = Content.getDeltaFromEvent(event);
		const {scrollTop} = this.scrollTarget;

		requestAnimationFrame(() => {
			this.scrollTarget.scrollTop = scrollTop - delta.y;
		});
	}

	scrollTo(element)
	{
		void Content.scrollTo(this.content, element);
	}

	isShown(): boolean
	{
		return this.state === 'shown';
	}

	shouldAdjustActionsPanels(): boolean
	{
		return this.adjustActionsPanels;
	}

	// Outside isolation would make the editor top panel and the view inert while the panel is open.
	getFocusTrapOptions(): Object
	{
		return {isolateOutside: false};
	}

	/**
	 * A dialog is named by its title and takes its role from the base panel; its focus trap comes
	 * later, see activateFocusTrapWhenShown. A non-modal panel has neither, and the focus it moves
	 * into itself on open would land on an anonymous generic container. `region` turns the
	 * container into a named landmark — and it is the role that makes an accessible name
	 * legitimate in the first place: naming a generic element is prohibited.
	 */
	activateContentA11y()
	{
		this.setAriaLabelledBy(this.title);

		if (!this.isDialog)
		{
			// Only a named landmark is worth having: an unnamed `region` is announced as one more
			// region among the others, and a panel without a title (a preset panel of an heir that
			// never set one) would produce exactly that.
			if (this.layout.hasAttribute('aria-labelledby'))
			{
				this.layout.setAttribute('role', 'region');
			}

			return;
		}

		this.activateDialogA11y();
	}

	deactivateContentA11y()
	{
		if (!this.isDialog)
		{
			// A hidden layout stays in the document, and a landmark of a closed panel is noise.
			this.layout.removeAttribute('role');
			this.layout.removeAttribute('aria-labelledby');

			return;
		}

		this.deactivateDialogA11y();
	}

	/**
	 * The trap is what moves the focus into the panel, so it waits for the entrance animation:
	 * while the layout is transparent nothing inside it counts as focusable and the focus would
	 * land on the bare container. The wait is capped instead of being trusted — `animationend`
	 * can be late, interrupted by a panel-to-panel transition or never fire at all in a
	 * background tab, and a dialog that never traps the focus is the worse outcome.
	 * @param {Promise} showing
	 * @return {Promise}
	 */
	activateFocusTrapWhenShown(showing: Promise<any>): Promise<any>
	{
		let waiting = null;
		const shown = new Promise((resolve) => {
			waiting = setTimeout(resolve, SHOW_ANIMATION_TIMEOUT);
		});

		return Promise.race([showing, shown]).then(() => {
			clearTimeout(waiting);
			this.activateFocusTrap();
		});
	}

	// eslint-disable-next-line no-unused-vars
	show(options?: any): Promise<any>
	{
		if (!this.isShown())
		{
			this.prepareFocusReturn();

			if (this.shouldAdjustActionsPanels())
			{
				Dom.addClass(document.body, 'landing-ui-hide-action-panels');
			}
			if (this.disableScroll)
			{
				Dom.addClass(document.body, "landing-ui-action-panels-disable-scrollbar");
			}
			Event.bind(this.layout, 'click', this.onContentClick.bind(this));
			Event.bind(this.content, 'scroll', this.onContentScroll.bind(this));
			void BX.Landing.Utils.Show(this.overlay);

			const showPromise = BX.Landing.Utils.Show(this.layout);

			// Role and name go up front, decoupled from the entrance animation.
			// BX.Landing.Utils.Show resolves only on animationend, which can be delayed,
			// interrupted (panel-to-panel transitions) or never fire (background tab) —
			// leaving the panel unnamed and roleless.
			// The title is populated by subclasses before show() is called.
			this.activateContentA11y();
			void this.activateFocusTrapWhenShown(showPromise);

			return showPromise.then(() => {
				this.state = 'shown';
			});
		}

		return Promise.resolve(true);
	}

	onContentClick(event)
	{
		this.emit('onClick', { event });
	}

	onContentScroll(event)
	{
		this.emit('onScroll');
	}

	hide(): Promise<any>
	{
		this.emit('onHide');
		if (this.isShown())
		{
			this.deactivateContentA11y();

			if (this.shouldAdjustActionsPanels())
			{
				Dom.removeClass(document.body, 'landing-ui-hide-action-panels');
			}
			if (this.disableScroll)
			{
				Dom.removeClass(document.body, "landing-ui-action-panels-disable-scrollbar");
			}

			void BX.Landing.Utils.Hide(this.overlay);

			// `Utils.Hide` hides only an element carrying the mark of a finished enter animation
			// and leaves the rest on screen, so the leave is real only when the mark is there.
			const isLeaving = BX.Landing.Utils.isShown(this.layout);

			const hiding = BX.Landing.Utils.Hide(this.layout).then(() => {
				this.state = 'hidden';
			});

			return this.restoreFocusAfterHide(hiding, isLeaving);
		}

		return Promise.resolve(true);
	}

	appendForm(form)
	{
		this.forms.add(form);
		Dom.append(form.getNode(), this.content);
	}

	replaceForm(newForm, oldForm)
	{
		this.forms.add(newForm);
		Dom.insertAfter(newForm.getNode(), oldForm.getNode());
		this.forms.remove(oldForm);
		Dom.remove(oldForm.getNode());
	}

	appendCard(card: BaseCard)
	{
		if (this.data.scrollAnimation)
		{
			Dom.addClass(card.layout, 'landing-ui-is-not-visible');
			this.scrollObserver.observe(card.layout);
		}

		Dom.append(card.layout, this.content);
		card.onAppend();
	}

	clear()
	{
		this.clearContent();
		this.clearSidebar();
		this.forms.clear();
	}

	clearContent()
	{
		Dom.clean(this.content);
	}

	clearSidebar()
	{
		Dom.clean(this.sidebar);
		this.sidebarButtons = new BX.Landing.UI.Collection.ButtonCollection();
	}

	setTitle(title)
	{
		this.title.innerHTML = title;
	}

	appendFooterButton(button)
	{
		this.buttons.add(button);
		Dom.append(button.layout, this.footer);
	}

	appendSidebarButton(button)
	{
		this.sidebarButtons.add(button);
		Dom.append(button.layout, this.sidebar);
	}

	setOverlayClass(className: string)
	{
		Dom.addClass(this.overlay, className);
	}

	renderTo(target: HTMLElement)
	{
		super.renderTo(target);
		Dom.append(this.overlay, target);
	}

	checkReadyToSave()
	{
		let canSave = true;
		this.forms.forEach(form => {
			form.fields.forEach(field => {
				if (field.readyToSave === false)
				{
					canSave = false
				}
				if (!field.getListeners('onChangeReadyToSave').has(this.checkReadyToSave))
				{
					field.subscribe('onChangeReadyToSave', this.checkReadyToSave);
				}
			})
		});

		canSave ? this.enableSave() : this.disableSave()
	}

	disableSave()
	{
		const saveButton = this.buttons.get('save_block_content');
		if (saveButton)
		{
			saveButton.disable();
		}
	}

	enableSave()
	{
		const saveButton = this.buttons.get('save_block_content');
		if (saveButton)
		{
			saveButton.enable();
		}
	}
}
