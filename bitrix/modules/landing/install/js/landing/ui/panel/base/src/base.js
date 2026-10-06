import {Type, Text, Tag, Dom, Event} from 'main.core';
import {EventEmitter} from 'main.core.events';
import {Loc} from 'landing.loc';
import {A11y} from 'landing.ui.a11y';
import './css/style.css';
import 'landing.utils';

// Longest panel leave animation (400ms) plus slack. Only matters when `animationend` is late.
const HIDE_ANIMATION_TIMEOUT = 600;

/**
 * @memberOf BX.Landing.UI.Panel
 */
export class BasePanel extends EventEmitter
{
	static makeId(): string
	{
		return `landing_ui_panel_${Text.getRandom()}`;
	}

	static createLayout(id)
	{
		return Tag.render`
			<div class="landing-ui-panel landing-ui-hide" data-id="${id}"></div>
		`;
	}

	constructor(id = null)
	{
		super();
		this.setEventNamespace('BX.Landing.UI.Panel.BasePanel');
		this.id = Type.isString(id) ? id : BasePanel.makeId();
		this.layout = BasePanel.createLayout(this.id);
		this.classShow = 'landing-ui-show';
		this.classHide = 'landing-ui-hide';
		this.forms = new BX.Landing.UI.Collection.FormCollection();
		this.contextDocument = document;
		this.contextWindow = this.contextDocument.defaultView;
		this.isDialog = false;
		this._focusOpener = null;
		this._focusTrapPromise = null;
		this._onDialogEscape = this.onDialogEscape.bind(this);
	}

	// eslint-disable-next-line no-unused-vars
	show(options?: any): Promise<any>
	{
		if (!this.isShown())
		{
			this.prepareFocusReturn();

			// The semantics follow the show: `Utils.Show` unmarks the layout as hidden right away,
			// and the focus trap takes no layout that still carries the mark.
			const showing = BX.Landing.Utils.Show(this.layout);
			this.applyDialogSemanticsOnShow();

			return showing;
		}

		return Promise.resolve();
	}

	hide(): Promise<any>
	{
		if (this.isShown())
		{
			this.applyDialogSemanticsOnHide();

			// `Utils.Hide` hides only an element carrying the mark of a finished enter animation
			// and leaves the rest on screen, so the leave is real only when the mark is there.
			const isLeaving = BX.Landing.Utils.isShown(this.layout);

			return this.restoreFocusAfterHide(BX.Landing.Utils.Hide(this.layout), isLeaving);
		}

		return Promise.resolve();
	}

	hasFocusInside(): boolean
	{
		const activeElement = this.layout.ownerDocument.activeElement;

		return activeElement !== null && this.layout.contains(activeElement);
	}

	// Nothing holds the focus any more: it is gone or fell back onto <body>.
	isFocusLost(): boolean
	{
		const ownerDocument = this.layout.ownerDocument;
		const activeElement = ownerDocument.activeElement;

		return activeElement === null || activeElement === ownerDocument.body;
	}

	/**
	 * The initial focus a dialog gets from its trap on activation. A panel opened without a trap
	 * has to move the focus itself, otherwise its content is only reachable by tabbing from the
	 * element that opened the panel. The focus goes to the container, not to the first control
	 * inside it: the next Tab then walks the panel from the start of its markup instead of from
	 * the close button, which is the last child of the layout, and the result does not depend on
	 * whether the content of the panel is on screen yet. Panels that want it call this once they
	 * are being opened, so the opener is already remembered by prepareFocusReturn() and a repeated
	 * show() moves nothing. The caller has to wait for the panel to be on screen: a hidden layout
	 * takes no focus.
	 */
	moveFocusInside()
	{
		void A11y.load()
			.then(({FocusNavigator}) => {
				if (!this.layout.isConnected || this.hasFocusInside())
				{
					return;
				}

				FocusNavigator.focusContainer(this.layout, {preventScroll: true});
			})
			.catch(() => {});
	}

	/**
	 * The element that holds the focus, as seen from the panel. Panels of the editor are opened
	 * from buttons living inside `iframe.landing-ui-view`, and for the document of the panel the
	 * active element is then the iframe itself: only FocusNavigator descends into the frame and
	 * reaches the button. The answer is needed synchronously, before the focus moves on, so a
	 * ui.a11y that is not on the page yet leaves nothing but the own document to look at.
	 * @return {?HTMLElement}
	 */
	getActiveElement(): ?HTMLElement
	{
		const { FocusNavigator } = A11y.getLoaded() || {};

		if (FocusNavigator && Type.isFunction(FocusNavigator.getActiveElement))
		{
			return FocusNavigator.getActiveElement(this.layout);
		}

		return this.layout.ownerDocument.activeElement;
	}

	/**
	 * A non-dialog panel returns focus on its own (see restoreFocusAfterHide), and both halves of
	 * that have to be in place before it closes: the element that opened the panel, taken while
	 * focus is still outside, and a running input modality tracker, which only knows about the
	 * interactions that happened after it attached to the document. Dialogs use the trap instead.
	 */
	prepareFocusReturn()
	{
		if (this.isDialog)
		{
			return;
		}

		const activeElement = this.getActiveElement();
		// The <body> that is no anchor is the one of the active element: an opener from the editor
		// iframe belongs to another document, and the body of that document is as empty an anchor.
		const isOpener = activeElement !== null
			&& activeElement !== activeElement.ownerDocument.body
			&& !this.layout.contains(activeElement);

		this._focusOpener = isOpener ? activeElement : null;

		void A11y.load().catch(() => {});
	}

	/**
	 * A non-dialog panel has no focus trap, so nothing brings focus back when the layout gets
	 * hidden and focus falls to <body>. Dialogs keep doing this through the trap.
	 * @param {Promise} hiding
	 * @param {boolean} [isLeaving] whether the panel really goes away, see hide()
	 * @return {Promise}
	 */
	restoreFocusAfterHide(hiding: Promise<any>, isLeaving: boolean = true): Promise<any>
	{
		// A panel that stays on screen keeps both its focus and its opener: the opener is still
		// needed by the next attempt to close it.
		if (!isLeaving)
		{
			return hiding;
		}

		const opener = this._focusOpener;
		this._focusOpener = null;

		if (this.isDialog || !this.hasFocusInside())
		{
			return hiding;
		}

		// Restoring must not delay the hide chain, hence no waiting for the extension here.
		void A11y.load()
			.then((a11y) => this.returnFocusOutside(opener, a11y, hiding))
			.catch(() => {});

		return hiding;
	}

	/**
	 * @param {HTMLElement} opener
	 * @param {?Object} focusNavigator
	 * @return {boolean} whether the return of focus is settled and needs no fallback
	 */
	focusOpener(opener: HTMLElement, focusNavigator: ?Object): boolean
	{
		// The platform restore announces itself with a cancelable event, so a menu item or a
		// slider can take the return over; a ui.a11y without it gets the bare focus() below.
		if (focusNavigator && Type.isFunction(focusNavigator.restoreFocus))
		{
			if (focusNavigator.restoreFocus(opener, {preventScroll: true}) === null)
			{
				return true;
			}
		}
		else
		{
			opener.focus({preventScroll: true});
		}

		if (this.getActiveElement() === opener)
		{
			return true;
		}

		// An opener that lives in the editor iframe takes two calls in Firefox while the layout
		// being hidden still holds the focus: the first one stops at the <iframe> element.
		opener.focus({preventScroll: true});

		return this.getActiveElement() === opener;
	}

	/**
	 * @param {?HTMLElement} opener
	 * @param {Object} a11y exports of the ui.a11y extension
	 * @param {Promise} hiding
	 * @return {?Promise}
	 */
	returnFocusOutside(opener: ?HTMLElement, a11y: Object, hiding: Promise<any>): ?Promise<any>
	{
		// Focus may have landed somewhere meaningful on its own while the extension was loading.
		if (!this.hasFocusInside() && !this.isFocusLost())
		{
			return null;
		}

		// A known anchor is returned to unconditionally, the way a focus trap does it.
		if (opener !== null && opener.isConnected && this.focusOpener(opener, a11y.FocusNavigator))
		{
			return null;
		}

		const focusMonitor = a11y.FocusMonitor.Instance;

		// What is left is the focus history, and that is a guess about where the user came from.
		// A pointer user did not ask for a focus ring on a control the history picked for them.
		if (focusMonitor.getLastInputModality() !== 'keyboard')
		{
			return null;
		}

		// The focus history skips the nodes of the panel only once the layout is really hidden. The
		// hide chain resolves on `animationend`, which can bubble from a descendant animation while
		// the panel is still visible or never fire at all in a background tab, so the wait is capped
		// instead of being trusted.
		let waiting = null;
		const hidden = new Promise((resolve) => {
			waiting = setTimeout(resolve, HIDE_ANIMATION_TIMEOUT);
		});

		return Promise.race([hiding, hidden]).then(() => {
			clearTimeout(waiting);

			// The wait is long enough for focus to land somewhere on its own: the next panel, a
			// neighbouring widget, a Tab of the user. Only a still lost focus is worth restoring.
			if (this.hasFocusInside() || this.isFocusLost())
			{
				focusMonitor.restoreFocus();
			}
		});
	}

	setAriaLabel(text: string)
	{
		if (!Type.isString(text))
		{
			return;
		}

		this.layout.setAttribute('aria-label', text);
		this.layout.removeAttribute('aria-labelledby');
	}

	setAriaLabelledBy(source: HTMLElement | string)
	{
		let id = null;

		if (Type.isDomNode(source))
		{
			// No meaningful text: drop labelledby so the aria-label fallback applies.
			if ((source.textContent || '').trim() === '')
			{
				this.layout.removeAttribute('aria-labelledby');

				return;
			}

			id = source.id;
			if (!id)
			{
				id = BasePanel.makeId();
				source.setAttribute('id', id);
			}
		}
		else if (Type.isStringFilled(source))
		{
			id = source;
		}

		if (id === null)
		{
			return;
		}

		this.layout.setAttribute('aria-labelledby', id);
		this.layout.removeAttribute('aria-label');
	}

	// Subclasses override this to tune the trap (isolation, looping) without owning its promise cache.
	getFocusTrapOptions(): Object
	{
		return {};
	}

	getFocusTrap(): Promise<?Object>
	{
		if (this._focusTrapPromise === null)
		{
			const options = {restoreFocus: true, ...this.getFocusTrapOptions()};
			this._focusTrapPromise = A11y.createFocusTrap(this.layout, options);
		}

		return this._focusTrapPromise;
	}

	onDialogEscape(event: KeyboardEvent)
	{
		if (event.key === 'Escape')
		{
			this.hide();
		}
	}

	/**
	 * The role and the name of a dialog, without the base Escape listener: subclasses own their
	 * own Escape. The focus trap is not part of it — it is activated separately, so that a panel
	 * playing an enter animation can name itself right away and trap the focus once it is really
	 * on screen.
	 */
	activateDialogA11y()
	{
		if (!this.isDialog)
		{
			return;
		}

		// No aria-modal here: the trap does not isolate the outside anymore, so the editor top
		// panel stays operable. Claiming modality would keep hiding it from screen readers.
		this.layout.setAttribute('role', 'dialog');

		if (!this.layout.hasAttribute('aria-label') && !this.layout.hasAttribute('aria-labelledby'))
		{
			this.layout.setAttribute('aria-label', Loc.getMessage('LANDING_UI_PANEL_BASE_DIALOG_LABEL'));
		}
	}

	/**
	 * The trap moves the focus into the dialog on activation, and it has something to move it to
	 * only once the panel is on screen: nothing inside a layout that is still hidden counts as
	 * focusable, and the focus lands on the bare container instead of the first control. A panel
	 * that waits for its enter animation can be closed or destroyed before it ends, and a trap of
	 * a panel that is no longer there would steal the focus from whatever took its place.
	 * `FocusTrap.activate()` is idempotent, so calling this more than once costs nothing.
	 */
	activateFocusTrap()
	{
		if (!this.isDialog || !this.layout.isConnected || Dom.hasClass(this.layout, this.classHide))
		{
			return;
		}

		this.getFocusTrap().then((trap) => trap && trap.activate()).catch(() => {});
	}

	deactivateDialogA11y()
	{
		if (!this.isDialog)
		{
			return;
		}

		this.getFocusTrap().then((trap) => trap && trap.deactivate()).catch(() => {});
	}

	applyDialogSemanticsOnShow()
	{
		if (!this.isDialog)
		{
			return;
		}

		this.activateDialogA11y();
		Event.bind(this.contextDocument, 'keydown', this._onDialogEscape);
		this.activateFocusTrap();
	}

	applyDialogSemanticsOnHide()
	{
		if (!this.isDialog)
		{
			return;
		}

		Event.unbind(this.contextDocument, 'keydown', this._onDialogEscape);
		this.deactivateDialogA11y();
	}

	isShown(): boolean
	{
		return !Dom.hasClass(this.layout, this.classHide);
	}

	setContent(content: string)
	{
		this.clear();

		if (Type.isString(content))
		{
			this.layout.innerHTML = content;
		}
		else if (Type.isDomNode(content))
		{
			this.appendContent(content);
		}
		else if (Type.isArray(content))
		{
			content.forEach(this.appendContent, this);
		}
	}

	appendContent(content: HTMLElement)
	{
		if (Type.isDomNode(content))
		{
			this.layout.appendChild(content);
		}
	}

	prependContent(content: HTMLElement)
	{
		if (Type.isDomNode(content))
		{
			Dom.prepend(content, this.layout);
		}
	}

	renderTo(target: HTMLElement)
	{
		if (Type.isDomNode(target))
		{
			Dom.append(this.layout, target);
		}
	}

	remove()
	{
		// release dialog semantics (Escape listener, focus trap) even when destroyed without hide(),
		// but only if the focus trap was ever created: an unshown panel has nothing to release
		if (this._focusTrapPromise !== null)
		{
			this.applyDialogSemanticsOnHide();
		}

		// A layout taken out of the document drops focus to <body> the same way a hidden one does.
		this.restoreFocusAfterHide(Promise.resolve(), this.isShown());
		this._focusOpener = null;

		Dom.remove(this.layout);
	}

	appendForm(form)
	{
		this.layout.appendChild(form.getNode());
	}

	clear()
	{
		Dom.clean(this.layout);
	}

	setLayoutClass(className: string)
	{
		Dom.addClass(this.layout, className);
	}

	setContextDocument(contextDocument: Document)
	{
		this.contextDocument = contextDocument;
		this.contextWindow = this.contextDocument.defaultView;
	}
}