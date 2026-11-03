/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_a11y) {
	'use strict';

	const DEGRADED_ATTRIBUTE = 'data-a11y-user-consent-degraded';
	const Degraded = {
		contract: 'popup-contract',
		container: 'popup-container',
		head: 'popup-head',
		buttonAccept: 'button-accept',
		buttonReject: 'button-reject',
		text: 'popup-text',
		failure: 'wrapper-failure'
	};

	/**
	 * `main` logs nothing about its popup, so a failed expectation is also kept in the markup of the affected node.
	 */
	function markDegraded(node, reason) {
		if (!main_core.Type.isElementNode(node)) {
			return;
		}
		const marks = new Set((node.getAttribute(DEGRADED_ATTRIBUTE) ?? '').split(' ').filter(Boolean));
		marks.add(reason);
		node.setAttribute(DEGRADED_ATTRIBUTE, [...marks].join(' '));
	}
	function degrade(node, reason, details) {
		// unconditional on purpose: AccessibilityLogger.warn is silent without the debug flag
		// eslint-disable-next-line no-console
		console.warn(`sale.user-consent-a11y: ${reason} - the consent dialog is left as the main module renders it`, details ?? '');
		markDegraded(node, reason);
	}

	/**
	 * Wraps `show` and `hide` of the consent popup of `main`: it reports neither and may close without an event.
	 * The popup is captured at install, as checkout deletes `BX.UserConsent`; its nodes are read on every show.
	 */
	class UserConsentPopupAccessibility {
		static #instance = null;
		#popup = null;
		#trap = null;
		#container = null;
		#initiator = null;
		#isOpen = false;
		#isTextShown = false;
		#originalShow = null;
		#originalHide = null;
		#dialogKeydownHandler = this.#onDialogKeydown.bind(this);
		#buttonKeydownHandler = this.#onButtonKeydown.bind(this);
		static install() {
			if (this.#instance !== null) {
				return this.#instance;
			}
			const popup = BX.UserConsent?.popup;
			if (!this.#isSupported(popup)) {
				degrade(document.body, Degraded.contract);
				return null;
			}
			this.#instance = new UserConsentPopupAccessibility(popup);
			return this.#instance;
		}

		/**
		 * Where the focus returns on close; without it the trap returns it to the element active on open.
		 */
		static setInitiator(node) {
			if (this.#instance !== null) {
				this.#instance.#initiator = main_core.Type.isElementNode(node) ? node : null;
			}
		}
		static #isSupported(popup) {
			return main_core.Type.isPlainObject(popup) && main_core.Type.isFunction(popup.show) && main_core.Type.isFunction(popup.hide) && main_core.Type.isPlainObject(popup.nodes);
		}
		constructor(popup) {
			this.#popup = popup;
			this.#patchPopup();
		}
		destroy() {
			this.#popup.show = this.#originalShow;
			this.#popup.hide = this.#originalHide;
			this.#unbindMarkup();
			this.#trap?.destroy();
			this.#trap = null;
			this.#container = null;
			this.#initiator = null;
			this.#isOpen = false;
			this.#isTextShown = false;
			UserConsentPopupAccessibility.#instance = null;
		}
		#patchPopup() {
			this.#originalShow = this.#popup.show;
			this.#originalHide = this.#popup.hide;
			this.#popup.show = (...args) => {
				this.#originalShow.apply(this.#popup, args);
				this.#runOverPayment(() => this.#handleShow(args[0]));
			};
			this.#popup.hide = (...args) => {
				this.#originalHide.apply(this.#popup, args);
				this.#runOverPayment(() => this.#handleHide());
			};
		}

		/**
		 * The steps run inside the call stack of `main`: a throw would stop the payment halfway.
		 */
		#runOverPayment(step) {
			try {
				step();
			} catch (error) {
				degrade(document.body, Degraded.failure, error);
			}
		}

		/**
		 * A request shows the popup twice, the loader first, so the initial focus is applied again once the
		 * text is there; `applyInitialFocus` leaves a focus the user already moved alone.
		 */
		#handleShow(isContentVisible) {
			this.#isTextShown = isContentVisible === true;
			if (this.#isTextShown) {
				this.#makeTitleFocusable(this.#popup.nodes.head);
			}
			if (this.#isOpen) {
				if (this.#isTextShown) {
					this.#trap?.applyInitialFocus();
				}
				return;
			}
			const container = this.#popup.nodes.container;
			if (!main_core.Type.isElementNode(container)) {
				degrade(document.body, Degraded.container);
				return;
			}
			this.#isOpen = true;
			this.#markUpDialog(container);
			this.#getTrap(container).activate();
		}
		#handleHide() {
			if (!this.#isOpen) {
				return;
			}
			this.#isOpen = false;
			this.#isTextShown = false;
			this.#trap?.deactivate();
			this.#initiator = null;
		}

		/**
		 * The heading takes the focus once the text is there, so the reader says the title of the agreement
		 * rather than the loading text it replaced. Without it the first tab stop does: the container is
		 * a full-screen backdrop and shows no ring.
		 */
		#getTrap(container) {
			if (this.#container !== container) {
				this.#trap?.destroy();
				this.#trap = new ui_a11y.FocusTrap(container, {
					initialFocus: [() => this.#isTextShown ? this.#popup.nodes.head : null, true],
					restoreFocus: () => this.#initiator,
					isolateOutside: true
				});
				this.#container = container;
			}
			return this.#trap;
		}

		/**
		 * Idempotent, as it runs on every show; each node is checked on its own, so a missing one cancels nothing.
		 */
		#markUpDialog(container) {
			const {
				head,
				textarea,
				buttonAccept,
				buttonReject
			} = this.#popup.nodes;
			container.setAttribute('role', 'dialog');
			container.setAttribute('aria-modal', 'true');
			this.#nameDialog(container, head);
			this.#makeButton(container, buttonAccept, Degraded.buttonAccept);
			this.#makeButton(container, buttonReject, Degraded.buttonReject);
			this.#makeAgreementTextReachable(container, textarea);
			main_core.Event.unbind(container, 'keydown', this.#dialogKeydownHandler);
			main_core.Event.bind(container, 'keydown', this.#dialogKeydownHandler);
		}
		#nameDialog(container, head) {
			if (!main_core.Type.isElementNode(head)) {
				degrade(container, Degraded.head);
				return;
			}
			if (!main_core.Type.isStringFilled(head.getAttribute('id'))) {
				head.setAttribute('id', `main-user-consent-title-${main_core.Text.getRandom()}`);
			}
			container.setAttribute('aria-labelledby', head.getAttribute('id'));
		}
		#makeTitleFocusable(head) {
			if (main_core.Type.isElementNode(head)) {
				head.setAttribute('tabindex', '-1');
			}
		}

		/**
		 * The `<span>` stays: the click handlers of `main` and `popup.nodes` hold references to it.
		 */
		#makeButton(container, node, reason) {
			if (!main_core.Type.isElementNode(node)) {
				degrade(container, reason);
				return;
			}
			node.setAttribute('role', 'button');
			node.setAttribute('tabindex', '0');
			main_core.Event.unbind(node, 'keydown', this.#buttonKeydownHandler);
			main_core.Event.bind(node, 'keydown', this.#buttonKeydownHandler);
		}
		#makeAgreementTextReachable(container, textarea) {
			if (!main_core.Type.isElementNode(textarea)) {
				degrade(container, Degraded.text);
				return;
			}
			const name = main_core.Loc.getMessage('SALE_USER_CONSENT_A11Y_AGREEMENT_TEXT_ARIA');
			textarea.setAttribute('tabindex', '0');
			if (main_core.Type.isStringFilled(name)) {
				textarea.setAttribute('role', 'region');
				textarea.setAttribute('aria-label', name);
			}
		}
		#onButtonKeydown(event) {
			if (event.key !== 'Enter' && event.key !== ' ') {
				return;
			}
			event.preventDefault();
			event.currentTarget.click();
		}

		/**
		 * Escape is a refusal: the reject button lets `main` clear the checkbox and emit its own event.
		 */
		#onDialogKeydown(event) {
			if (event.key !== 'Escape') {
				return;
			}
			event.preventDefault();
			const buttonReject = this.#popup.nodes.buttonReject;
			if (main_core.Type.isElementNode(buttonReject)) {
				buttonReject.click();
				return;
			}
			this.#popup.hide();
		}
		#unbindMarkup() {
			const {
				container,
				buttonAccept,
				buttonReject
			} = this.#popup.nodes;
			main_core.Event.unbind(container, 'keydown', this.#dialogKeydownHandler);
			main_core.Event.unbind(buttonAccept, 'keydown', this.#buttonKeydownHandler);
			main_core.Event.unbind(buttonReject, 'keydown', this.#buttonKeydownHandler);
		}
	}

	exports.UserConsentPopupAccessibility = UserConsentPopupAccessibility;

})(this.BX.Sale = this.BX.Sale || {}, BX, BX.UI.Accessibility);
//# sourceMappingURL=user-consent-a11y.bundle.js.map
