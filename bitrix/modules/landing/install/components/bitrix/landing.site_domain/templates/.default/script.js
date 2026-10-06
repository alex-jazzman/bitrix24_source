/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
(function (exports, main_core) {
	'use strict';

	/**
	 * Address validity states.
	 */
	const DomainState = {
		unknown: 'unknown',
		checking: 'checking',
		valid: 'valid',
		invalid: 'invalid'
	};
	class Helper {
		static DEFAULT_LENGTH_LIMIT = 63;

		/**
		 * Constructor.
		 */
		constructor(params) {
			this.idDomainName = params.idDomainName;
			this.idDomainMessage = params.idDomainMessage;
			this.idDomainLoader = params.idDomainLoader;
			this.idDomainLength = params.idDomainLength || null;
			this.idDomainErrorAlert = params.idDomainErrorAlert;
			this.idDomainSubmit = params.idDomainSubmit;
			this.classes = {
				dangerBorder: 'ui-ctl-danger',
				successBorder: 'ui-ctl-success',
				dangerAlert: 'landing-domain-alert-danger',
				successAlert: 'landing-domain-alert-success',
				submit: 'ui-btn-clock'
			};
			if (this.idDomainName) {
				this.idDomainNameParent = this.idDomainName.parentNode;
			}
			this.state = DomainState.unknown;
			this.submitInProgress = false;
			this.submitAttempt = false;
			this.lastAnnouncement = null;
			this.checkStatusDelivered = false;
			this.initAccessibility();
			this.focusLoadTarget();
			this.initPageRestore();
		}

		/**
		 * Shows the message container once: an empty one takes no space, so nothing hides it later.
		 */
		initAccessibility() {
			if (this.idDomainMessage) {
				main_core.Dom.show(this.idDomainMessage);
			}
		}

		/**
		 * Moves focus to the server-rendered alert of the previous save: no live region voices it.
		 */
		focusLoadTarget() {
			if (!this.idDomainErrorAlert) {
				return;
			}
			this.idDomainErrorAlert.focus({
				preventScroll: true
			});
		}

		/**
		 * Releases the submission lock kept by a page restored from the back/forward cache.
		 */
		initPageRestore() {
			this.pageRestoreHandler = event => {
				if (event.persisted) {
					this.submitInProgress = false;
					main_core.Dom.removeClass(this.idDomainSubmit, this.classes.submit);
				}
			};
			main_core.Event.bind(window, 'pageshow', this.pageRestoreHandler);
		}

		/**
		 * Releases the page level subscription of this helper.
		 */
		destroy() {
			main_core.Event.unbind(window, 'pageshow', this.pageRestoreHandler);
		}

		/**
		 * Sets validity state and reflects it on the field.
		 * @param {string} state One of DomainState values.
		 */
		setState(state) {
			if (state !== this.state) {
				// a new state ends the current change, so the same text may be voiced again
				this.lastAnnouncement = null;
			}
			this.state = state;
			if (!this.idDomainName) {
				return;
			}
			this.idDomainName.setAttribute('data-domain-state', state);
			if (state === DomainState.invalid) {
				this.idDomainName.setAttribute('aria-invalid', 'true');
			} else if (state === DomainState.valid) {
				this.idDomainName.setAttribute('aria-invalid', 'false');
			} else {
				this.idDomainName.removeAttribute('aria-invalid');
			}
		}

		/**
		 * Returns current validity state.
		 * @return {string}
		 */
		getState() {
			return this.state;
		}

		/**
		 * Returns true if the address is known to be valid.
		 * @return {boolean}
		 */
		isValid() {
			return this.state === DomainState.valid;
		}

		/**
		 * Returns true if the server has explicitly refused the address.
		 * @return {boolean}
		 */
		isInvalid() {
			return this.state === DomainState.invalid;
		}

		/**
		 * Tells whether the field owner has to validate this submission.
		 * @param {SubmitEvent} event
		 * @return {boolean}
		 */
		shouldValidateSubmit(event) {
			if (this.submitInProgress) {
				event.preventDefault();
				return false;
			}
			this.lastAnnouncement = null;

			// a message written from here on is the reason of a refusal, not a result of a background check
			this.submitAttempt = true;
			return true;
		}

		/**
		 * Stops the submission, announces the reason already shown next to the field and returns focus to it.
		 * @param {SubmitEvent} event
		 */
		refuseSubmit(event) {
			event.preventDefault();
			this.announce(this.getMessageText(), 'assertive');
			this.submitAttempt = false;
			this.focusField();
		}

		/**
		 * Stops the submission while the check of the address is still running and names the running check.
		 * checkStatusDelivered tells the restarted check that its status is already announced.
		 * @param {SubmitEvent} event
		 * @param {boolean} checkRestarting Whether the caller starts the check over right after this call.
		 */
		refuseSubmitWhileChecking(event, checkRestarting = false) {
			event.preventDefault();
			const reason = main_core.Loc.getMessage('LANDING_TPL_DOMAIN_CHECKING_SUBMIT');
			this.submitAttempt = false;
			this.setStatusMessage(reason);
			this.announce(reason, 'assertive');
			this.checkStatusDelivered = checkRestarting;
		}

		/**
		 * Stops the submission for a reason that is not about the address: nothing is written, nothing is
		 * voiced and focus stays where the user left it, so the caller may open its own interface.
		 * @param {SubmitEvent} event
		 */
		cancelSubmit(event) {
			event.preventDefault();
			this.submitAttempt = false;
		}

		/**
		 * Allows the submission and locks the field against a repeated one.
		 */
		acceptSubmit() {
			this.submitAttempt = false;
			this.submitInProgress = true;
			main_core.Dom.addClass(this.idDomainSubmit, this.classes.submit);
		}

		/**
		 * Announces a message through the shared a11y facade - the only channel of the field.
		 * A duplicate inside a single change is suppressed.
		 * @param {string} message
		 * @param {string} politeness 'polite' or 'assertive'.
		 */
		announce(message, politeness = 'polite') {
			if (!message || message === this.lastAnnouncement) {
				return;
			}
			this.lastAnnouncement = message;

			// the facade is resolved at the moment of the call: the bundle must not require it to exist earlier
			const facade = main_core.Reflection.getClass('BX.Landing.UI.A11y');
			if (facade) {
				facade.announce(message, politeness);
				return;
			}
			main_core.Runtime.loadExtension('landing.ui.a11y').then(({
				A11y
			}) => A11y.announce(message, politeness)).catch(() => {});
		}

		/**
		 * Tells whether the field already holds focus.
		 * @return {boolean}
		 */
		isFieldFocused() {
			return !!this.idDomainName && document.activeElement === this.idDomainName;
		}

		/**
		 * Moves focus to the address field.
		 * @return {boolean} Whether the field has taken the focus.
		 */
		focusField() {
			if (!this.idDomainName) {
				return false;
			}
			this.idDomainName.focus();
			return this.isFieldFocused();
		}

		/**
		 * Shows loader div near input and announces the started check, unless a refused submission has
		 * already announced it (checkStatusDelivered).
		 */
		showLoader() {
			this.setState(DomainState.checking);
			if (this.checkStatusDelivered) {
				this.checkStatusDelivered = false;
			} else {
				this.clearMessage();
				this.announce(main_core.Loc.getMessage('LANDING_TPL_DOMAIN_CHECKING'));
			}
			this.hideLength();
			main_core.Dom.show(this.idDomainLoader);
		}

		/**
		 * Hides loader div near input.
		 */
		hideLoader() {
			main_core.Dom.hide(this.idDomainLoader);
		}

		/**
		 * Returns true if loader showed.
		 * @return {boolean}
		 */
		isLoaderShowed() {
			return main_core.Dom.isShown(this.idDomainLoader);
		}
		setLength(length, limit = Helper.DEFAULT_LENGTH_LIMIT) {
			if (this.idDomainLength) {
				this.idDomainLength.innerHTML = main_core.Loc.getMessage('LANDING_TPL_DOMAIN_LENGTH_LIMIT', {
					'#LENGTH#': length,
					'#LIMIT#': limit
				});
			}
			main_core.Dom.show(this.idDomainLength);
		}
		hideLength() {
			if (this.idDomainLength) {
				main_core.Dom.hide(this.idDomainLength);
			}
		}

		/**
		 * Marks input as valid and shows success message.
		 * @param {string} successMessage Success message.
		 */
		setSuccess(successMessage) {
			this.hideErrorAlert();
			this.setState(DomainState.valid);
			this.setMessage(successMessage);
		}

		/**
		 * Hides the alert of the previous save attempt: it does not describe the current value anymore.
		 * An alert that holds the focus stays visible while there is no field to take it.
		 */
		hideErrorAlert() {
			if (!this.idDomainErrorAlert) {
				return;
			}
			if (this.idDomainErrorAlert.contains(document.activeElement) && !this.focusField()) {
				return;
			}
			main_core.Dom.hide(this.idDomainErrorAlert);
		}

		/**
		 * Marks input as invalid and shows error message or hides message if errorMessage is empty.
		 * Reserved for an explicit refusal of the address.
		 * @param {string} errorMessage Error message.
		 */
		setError(errorMessage) {
			this.setState(DomainState.invalid);
			this.setMessage(errorMessage, true);
		}

		/**
		 * The address is changed and has no verdict yet: no error flag, no stale message.
		 */
		setUnverified() {
			this.hideErrorAlert();
			this.setState(DomainState.unknown);
			this.clearMessage();
		}

		/**
		 * The check did not happen: the address stays unverified, but the reason is shown.
		 * @param {string} message
		 */
		setCheckFailed(message) {
			this.hideLoader();
			this.setState(DomainState.unknown);
			this.setMessage(message, true);
		}

		/**
		 * Returns the currently displayed message text.
		 * @return {string}
		 */
		getMessageText() {
			return this.idDomainMessage ? this.idDomainMessage.textContent.trim() : '';
		}

		/**
		 * Sets success or fail message. The reason of a refused submission is announced insistently,
		 * the result of a background check politely.
		 * @param {string} message Error message.
		 * @param {boolean} error Error message (false by default).
		 */
		setMessage(message, error) {
			if (!this.idDomainMessage) {
				return;
			}
			error = !!error;
			const refusalReason = error && this.submitAttempt;
			this.clearMessage();
			if (!message) {
				return;
			}
			if (this.idDomainNameParent) {
				main_core.Dom.addClass(this.idDomainNameParent, error ? this.classes.dangerBorder : this.classes.successBorder);
			}
			main_core.Dom.addClass(this.idDomainMessage, error ? this.classes.dangerAlert : this.classes.successAlert);
			this.idDomainMessage.innerHTML = this.decorateMessage(message, error);
			this.announce(this.getMessageText(), refusalReason ? 'assertive' : 'polite');
		}

		/**
		 * Shows a neutral status of the address: neither the error nor the success sign, no announcement.
		 * @param {string} message
		 */
		setStatusMessage(message) {
			if (!this.idDomainMessage) {
				return;
			}
			this.clearMessage();
			if (!message) {
				return;
			}
			this.idDomainMessage.textContent = message;
		}

		/**
		 * Adds a wording sign so success and error do not rely on color alone. The whole sentence, the word
		 * order and the separator belong to the phrase: the code only hands the message over to it.
		 * @param {string} message
		 * @param {boolean} error
		 * @return {string}
		 */
		decorateMessage(message, error) {
			const signed = error ? main_core.Loc.getMessage('LANDING_TPL_DOMAIN_MESSAGE_ERROR', {
				'#MESSAGE#': message
			}) : main_core.Loc.getMessage('LANDING_TPL_DOMAIN_MESSAGE_SUCCESS', {
				'#MESSAGE#': message
			});

			// an unpublished phrase resolves to an empty string, and the message must not be lost with it
			return signed || message;
		}

		/**
		 * Clears message alert.
		 */
		clearMessage() {
			if (!this.idDomainMessage) {
				return;
			}

			// whatever stood here is replaced, including the status of a check told by a refused submission
			this.checkStatusDelivered = false;
			if (this.idDomainNameParent) {
				main_core.Dom.removeClass(this.idDomainNameParent, this.classes.dangerBorder);
				main_core.Dom.removeClass(this.idDomainNameParent, this.classes.successBorder);
			}
			main_core.Dom.removeClass(this.idDomainMessage, this.classes.dangerAlert);
			main_core.Dom.removeClass(this.idDomainMessage, this.classes.successAlert);
			this.idDomainMessage.innerHTML = '';
		}
	}

	class Input {
		/**
		 * Constructor.
		 */
		constructor(params) {
			this.domainId = params.domainId;
			this.domainName = params.domainName;
			this.domainPostfix = params.domainPostfix || '';
			this.idDomainName = params.idDomainName;
			this.idDomainINA = params.idDomainINA;
			this.idDomainDnsInfo = params.idDomainDnsInfo;
			this.idDomainSubmit = params.idDomainSubmit;
			this.previousDomainName = null;
			this.checkedDomainName = null;
			this.checkGeneration = 0;
			this.helper = new Helper(params);
			this.tld = params.tld ? params.tld.toLowerCase() : 'tld';
			this.keyupCallback = this.keyupCallback.bind(this);
			if (this.idDomainName) {
				main_core.Event.bind(this.idDomainName, 'keyup', main_core.Runtime.debounce(this.keyupCallback, 900));
				const initValue = main_core.Type.isString(this.idDomainName.value) ? this.idDomainName.value.trim() : '';
				if (initValue.length === 0) {
					this.helper.setLength(0);
				} else {
					this.keyupCallback();
				}
			}
			const form = this.idDomainSubmit ? this.idDomainSubmit.form : null;
			if (form) {
				main_core.Event.bind(form, 'submit', event => {
					this.checkSubmit(event);
				});
			}
			this.fillDnsInstruction(this.domainName);
		}

		/**
		 * Returns true if domain name is empty.
		 * return {bool}
		 */
		domainNameIsEmpty() {
			this.idDomainName.value = main_core.Type.isString(this.idDomainName.value) ? this.idDomainName.value.trim() : this.idDomainName.value;
			return this.idDomainName.value === '';
		}

		/**
		 * Keeps the form only when the address is empty or refused by the server for the value in the field.
		 * An unfinished check goes to the server validation.
		 */
		checkSubmit(event) {
			if (!this.helper.shouldValidateSubmit(event)) {
				return;
			}
			if (this.domainNameIsEmpty()) {
				this.helper.setError(main_core.Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_EMPTY'));
				this.helper.refuseSubmit(event);
				return;
			}
			if (this.helper.isInvalid()) {
				if (this.checkedDomainName === this.idDomainName.value) {
					this.helper.refuseSubmit(event);
					return;
				}

				// the refusal is about a value the user has already changed: the current one has no verdict yet
				this.helper.setUnverified();
			}
			if (this.helper.getState() === DomainState.checking) {
				// a check of an outdated value starts over; a check of the current one is left to answer
				const restarting = this.previousDomainName !== this.idDomainName.value;
				this.helper.refuseSubmitWhileChecking(event, restarting);
				if (restarting) {
					this.restartCheck();
				}
				return;
			}
			this.helper.acceptSubmit();
		}

		/**
		 * Checks the current value right away, ignoring both the debounce and the cache of the last checked value.
		 */
		restartCheck() {
			this.previousDomainName = null;
			this.keyupCallback();
		}

		/**
		 * Handler on keyup input.
		 */
		keyupCallback() {
			this.idDomainName.value = main_core.Type.isString(this.idDomainName.value) ? this.idDomainName.value.trim() : this.idDomainName.value;
			if (this.idDomainName.value === '') {
				this.helper.setError(main_core.Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_EMPTY'));
				this.helper.setLength(0);
				return;
			}
			const domainName = this.idDomainName.value;
			if (this.previousDomainName === domainName) {
				return;
			}
			this.previousDomainName = domainName;
			this.helper.showLoader();

			// an answer of an outdated request is dropped: it would overwrite the verdict about the current value
			const generation = ++this.checkGeneration;
			BX.ajax({
				url: '/bitrix/tools/landing/ajax.php?action=Domain::check',
				method: 'POST',
				data: {
					data: {
						domain: domainName + this.domainPostfix,
						filter: this.domainId ? {
							'!ID': this.domainId
						} : {}
					},
					sessid: main_core.Loc.getMessage('bitrix_sessid')
				},
				dataType: 'json',
				onsuccess: function (data) {
					if (generation !== this.checkGeneration) {
						return;
					}
					this.helper.hideLoader();
					if (data.type === 'success') {
						// the server has given its verdict about this very value
						this.checkedDomainName = domainName;
						if (data.result.length && data.result.length.length && data.result.length.limit) {
							this.helper.setLength(data.result.length.length, data.result.length.limit);
						} else {
							this.helper.hideLength();
						}
						if (!data.result.available) {
							if (data.result.errors) {
								if (data.result.errors.wrongSymbols) {
									this.helper.setError(main_core.Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_WRONG_NAME'));
								} else if (data.result.errors.wrongLength) {
									this.helper.setError(main_core.Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_WRONG_LENGTH'));
								} else if (data.result.errors.wrongSymbolCombination) {
									this.helper.setError(main_core.Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_WRONG_SYMBOL_COMBINATIONS'));
								} else if (data.result.errors.wrongDomainLevel) {
									this.helper.setError(main_core.Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_WRONG_DOMAIN_LEVEL'));
								} else {
									// refused for a reason this template cannot name: the state must still leave checking
									this.helper.setError(main_core.Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_INCORRECT'));
								}
							} else {
								this.helper.setError(!!data.result.deleted ? main_core.Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_EXIST_DELETED') : main_core.Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_EXIST'));
							}
						} else if (!data.result.domain) {
							this.helper.setError(main_core.Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_INCORRECT'));
						} else {
							this.fillDnsInstruction(data.result.domain);
							this.helper.setSuccess(main_core.Loc.getMessage('LANDING_TPL_DOMAIN_AVAILABLE'));
						}
						if (data.result.dns && this.idDomainINA) {
							this.idDomainINA.textContent = data.result.dns['INA'];
						}
					} else {
						this.checkFailed();
					}
				}.bind(this),
				onfailure: function () {
					if (generation !== this.checkGeneration) {
						return;
					}
					this.checkFailed();
				}.bind(this)
			});
		}

		/**
		 * The check gave no answer about the address: drop the cache so the same value may be checked again.
		 */
		checkFailed() {
			this.previousDomainName = null;
			this.helper.setCheckFailed(main_core.Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_PROCESSING'));
		}

		/**
		 * Sets new DNS instructions after domain name change.
		 * @param {string} domainName Domain name.
		 */
		fillDnsInstruction(domainName) {
			if (!this.idDomainDnsInfo) {
				return;
			}
			if (!domainName) {
				return;
			}
			if (!this.idDomainDnsInfo.rows[1]) {
				return;
			}
			if (!this.idDomainDnsInfo.rows[2]) {
				return;
			}
			if (this.idDomainDnsInfo.rows[1].cells.length < 3 || this.idDomainDnsInfo.rows[2].cells.length < 3) {
				return;
			}
			var cNameRecordRow = this.idDomainDnsInfo.rows[1];
			var aRecordRow = this.idDomainDnsInfo.rows[2];
			var domainParts = domainName.split('.');
			var domainRe = /^(com|net|org|co|kiev|spb|kharkov|msk|in|app)\.[a-z]{2}$/;
			aRecordRow.style.display = 'none';
			cNameRecordRow.cells[0].textContent = domainName ? domainName : 'landing.mydomain';
			if (domainParts.length === 2 || domainParts.length === 3 && domainParts[0] === 'www' || domainParts.length === 3 && (domainParts[1] + '.' + domainParts[2]).match(domainRe)) {
				aRecordRow.style.display = 'table-row';
				if (domainParts.length === 3 && domainParts[0] === 'www') {
					aRecordRow.cells[0].textContent = domainParts[1] + '.' + domainParts[2] + '.';
				} else {
					cNameRecordRow.cells[0].textContent = 'www.' + domainName + '.';
					aRecordRow.cells[0].textContent = domainName + '.';
				}
			}
		}
	}

	class Private extends Input {
		/**
		 * Constructor.
		 */
		constructor(params) {
			super(params);
		}
	}

	class Bitrix24 extends Input {
		/**
		 * Constructor.
		 */
		constructor(params) {
			super(params);
		}
	}

	// height the wrapper of the offered addresses keeps while the More button holds the rest of them
	const CLIPPED_LIST_HEIGHT = 80;
	class Free {
		/**
		 * Constructor.
		 */
		constructor(params) {
			this.idDomainSubmit = params.idDomainSubmit;
			this.idDomainCheck = params.idDomainCheck;
			this.idDomainName = params.idDomainName;
			this.idDomainAnother = params.idDomainAnother;
			this.idDomainAnotherMore = params.idDomainAnotherMore;
			this.idDomainErrorAlert = params.idDomainErrorAlert;
			this.saveBlocker = params.saveBlocker;
			this.saveBlockerCallback = params.saveBlockerCallback;
			this.promoCloseIcon = params.promoCloseIcon;
			this.promoCloseLink = params.promoCloseLink;
			this.promoBlock = params.promoBlock;
			this.maxVisibleSuggested = parseInt(params.maxVisibleSuggested || 10);
			this.tld = params.tld ? params.tld.toLowerCase() : 'tld';
			this.checkedDomainName = null;
			this.helper = new Helper(params);
			if (this.promoCloseIcon && this.promoCloseLink) {
				main_core.Event.bind(this.promoCloseIcon, 'click', this.closePromoBlock.bind(this));
				main_core.Event.bind(this.promoCloseLink, 'click', this.closePromoBlock.bind(this));
			}
			if (this.idDomainAnotherMore) {
				main_core.Event.bind(this.idDomainAnotherMore, 'click', this.showMoreDomains.bind(this));
			}
			const form = this.idDomainSubmit ? this.idDomainSubmit.form : null;
			if (form) {
				main_core.Event.bind(form, 'submit', function (event) {
					this.checkSubmit(event);
				}.bind(this));
				main_core.Event.bind(form, 'keydown', function (event) {
					this.checkDomainOnEnter(event);
				}.bind(this));
			}
			if (this.idDomainCheck && this.idDomainName) {
				main_core.Event.bind(this.idDomainCheck, 'click', function (event) {
					this.checkDomain(event);
				}.bind(this));
			}
			if (this.idDomainName) {
				main_core.Event.bind(this.idDomainName, 'keyup', main_core.Runtime.debounce(function (event) {
					this.keyupCallback(event);
				}.bind(this), 500, this));
			}
		}

		/**
		 * Enter in the address field starts the check of the address, as it did while the Check button was
		 * the default one of the form. The gift domain is taken by an explicit press of the save button:
		 * an implicit submission would register an address nobody has checked.
		 * @param {KeyboardEvent} event
		 */
		checkDomainOnEnter(event) {
			if (event.key !== 'Enter' || event.target !== this.idDomainName) {
				return;
			}
			if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
				// a shortcut belongs to the browser, and an address submitted this way is still validated on the server
				return;
			}
			if (event.repeat) {
				// one press asks for one check, and the held key still submits no form
				event.preventDefault();
				return;
			}
			this.checkDomain(event);
		}

		/**
		 * Handler on keyup input.
		 */
		keyupCallback() {
			if (this.idDomainName.value === '') {
				this.helper.setError(main_core.Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_EMPTY'));
				return;
			}
			if (this.isCurrentValue(this.checkedDomainName)) {
				// a check of this very value is running or answered already, and typing has taken nothing away
				// from it: the running check would lose its status and the answer its verdict
				return;
			}

			// typing alone starts no check here, so the address has no verdict yet
			this.helper.setUnverified();
		}

		/**
		 * Closes promo banner and hands the reading point over to the address field: the removed block takes
		 * the focus away with it, and the field is what the screen is about.
		 */
		closePromoBlock() {
			this.promoBlock.remove();
			this.helper.focusField();
		}

		/**
		 * Shows full block of suggesiotn domains.
		 */
		showMoreDomains() {
			const list = this.idDomainAnother.children[0];
			const opened = [...list.children].find(item => item.hidden);
			this.showClippedSuggestions();
			this.idDomainAnother.style.height = list.offsetHeight + 'px';
			// the button has done its work and leaves the tree with the platform call: left behind it would keep
			// the focus on a control the eye no longer finds, so the reading point goes to what the button opened
			main_core.Dom.hide(this.idDomainAnotherMore.parentNode);
			const option = opened ? opened.querySelector('input') : null;
			if (option) {
				option.focus();
			} else {
				// the addresses were all in sight already, so the button opened nothing to read on from
				this.helper.focusField();
			}
		}

		/**
		 * Makes some check before submit.
		 */
		checkSubmit(event) {
			if (!this.helper.shouldValidateSubmit(event)) {
				return;
			}
			this.checkDomainName();
			if (this.helper.isInvalid()) {
				this.helper.refuseSubmit(event);
				return;
			}
			if (this.helper.getState() === DomainState.checking) {
				// the check is left to answer: a check of an outdated value cannot be restarted here anyway,
				// since the running one holds the loader that gates the next
				this.helper.refuseSubmitWhileChecking(event);
				return;
			}
			if (this.saveBlocker && this.saveBlockerCallback) {
				// the refusal is not about the address: the slider opened next owns the focus and returns it
				// to the pressed button by itself
				this.helper.cancelSubmit(event);
				this.saveBlockerCallback();
				return;
			}
			this.helper.acceptSubmit();
		}

		/**
		 * Sets suggested domain to the main input.
		 * @param {string} domainName Domain name.
		 */
		selectSuggested(domainName) {
			this.idDomainName.value = domainName;
			// the suggestion comes from the server as an available address
			this.checkedDomainName = domainName;
			this.helper.setSuccess(main_core.Loc.getMessage('LANDING_TPL_DOMAIN_AVAILABLE'));
		}

		/**
		 * Fill suggested domain area.
		 * @param {array} suggest Suggested domains.
		 */
		fillSuggest(suggest) {
			if (!this.idDomainAnother) {
				return;
			}
			if (this.idDomainAnotherMore) {
				// the button carries a display of its own, so the wrapper is what the platform call hides
				if (suggest.length > this.maxVisibleSuggested) {
					main_core.Dom.show(this.idDomainAnotherMore.parentNode);
				} else {
					main_core.Dom.hide(this.idDomainAnotherMore.parentNode);
				}
			}
			if (suggest.length) {
				main_core.Dom.show(this.idDomainAnother.parentNode);
			} else {
				main_core.Dom.hide(this.idDomainAnother.parentNode);
			}
			var children = [];
			for (let i = 0, c = suggest.length; i < c; i++) {
				children.push(main_core.Dom.create('div', {
					props: {
						className: 'landing-domain-block-available-item'
					},
					children: [main_core.Dom.create('input', {
						props: {
							className: ''
						},
						attrs: {
							name: 'domain-edit-suggest',
							id: 'domain-edit-suggest-' + i,
							type: 'radio',
							'data-testid': 'landing-domain-suggest-option'
						},
						events: {
							click: () => {
								this.selectSuggested(suggest[i]);
							}
						}
					}), main_core.Dom.create('label', {
						props: {
							className: 'landing-domain-block-available-label'
						},
						attrs: {
							for: 'domain-edit-suggest-' + i
						},
						text: suggest[i]
					})]
				}));
			}

			// the list is built anew: focus standing on an address about to be dropped would fall to the
			// document, so it goes to the field the addresses are offered for
			if (this.idDomainAnother.contains(document.activeElement)) {
				this.helper.focusField();
			}
			this.idDomainAnother.innerHTML = '';
			this.idDomainAnother.appendChild(main_core.Dom.create('div', {
				props: {
					className: 'landing-domain-block-available-list'
				},
				children: children
			}));

			// the visibility of the More button is kept by the platform call alone, so it is asked the same way
			if (!main_core.Dom.isShown(this.idDomainAnotherMore.parentNode)) {
				this.idDomainAnother.style.height = this.idDomainAnother.children[0].offsetHeight + 'px';
			} else {
				this.idDomainAnother.style.height = CLIPPED_LIST_HEIGHT + 'px';
				this.hideClippedSuggestions();
			}
		}

		/**
		 * Takes the addresses the clipped list leaves out of sight out of the tree as well: cut off by the
		 * height of the wrapper, they still answer the keyboard and carry the focus behind the visible border.
		 */
		hideClippedSuggestions() {
			const list = this.idDomainAnother.children[0];
			const listTop = list.getBoundingClientRect().top;
			[...list.children].forEach(item => {
				item.hidden = item.getBoundingClientRect().bottom - listTop > CLIPPED_LIST_HEIGHT;
			});
		}

		/**
		 * Brings back every address the clipped list has taken out of the tree.
		 */
		showClippedSuggestions() {
			[...this.idDomainAnother.children[0].children].forEach(item => {
				item.hidden = false;
			});
		}

		/**
		 * Checks that domain name is correct by the local rules and leaves the field without a verdict when
		 * the rules are passed by a value no check has been asked about.
		 */
		checkDomainName() {
			this.idDomainName.value = main_core.Type.isString(this.idDomainName.value) ? this.idDomainName.value.trim() : this.idDomainName.value;
			const domainRe = RegExp('^[a-z0-9-]+\.' + this.tld + '$');
			if (this.idDomainName.value === '') {
				this.helper.setError(main_core.Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_EMPTY'));
			} else if (!domainRe.test(this.idDomainName.value.toLowerCase())) {
				this.helper.setError(main_core.Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_CHECK'));
			} else if (this.idDomainName.value.indexOf('--') !== -1 || this.idDomainName.value.indexOf('-.') !== -1 || this.idDomainName.value.indexOf('-') === 0) {
				this.helper.setError(main_core.Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_CHECK_DASH'));
			} else if (this.checkedDomainName !== this.idDomainName.value) {
				// the local rules are passed and no check has been asked about this value yet, so the field
				// keeps neither a verdict nor the message of a value the user has left behind
				this.helper.setUnverified();
			}
		}

		/**
		 * Tells whether the given value is the one the field holds now.
		 * @param {string} domainName
		 * @return {boolean}
		 */
		isCurrentValue(domainName) {
			return domainName === this.idDomainName.value;
		}

		/**
		 * Tells whether the answer of a check says nothing about the address the field holds now: the value
		 * has been changed while the request was on its way, so the answer may not become its verdict.
		 * @param {string} requestedName Value the check was asked about.
		 * @return {boolean}
		 */
		isAnswerOutdated(requestedName) {
			return !this.isCurrentValue(requestedName);
		}

		/**
		 * Makes whois query for user pointed domain.
		 */
		checkDomain(event) {
			event.preventDefault();
			if (this.helper.isLoaderShowed()) {
				return;
			}
			this.checkDomainName();
			if (this.helper.isInvalid()) {
				return;
			}
			if (this.isCurrentValue(this.checkedDomainName) && this.helper.isValid()) {
				// this very value has an answer already, and a refusal has left above: asking again would
				// only repeat the same verdict and voice it a second time
				return;
			}
			const requestedName = this.idDomainName.value;
			this.checkedDomainName = requestedName;
			this.helper.showLoader();
			this.fillSuggest([]);
			BX.ajax({
				url: '/bitrix/tools/landing/ajax.php?action=Domain::whois',
				method: 'POST',
				data: {
					data: {
						domainName: requestedName,
						tld: this.tld
					},
					sessid: main_core.Loc.getMessage('bitrix_sessid')
				},
				dataType: 'json',
				onsuccess: function (data) {
					// the loader gates the next check, so it belongs to the request and is released by its
					// answer even when the answer is dropped as outdated
					this.helper.hideLoader();
					if (this.isAnswerOutdated(requestedName)) {
						return;
					}
					if (data.type === 'success') {
						const result = data.result;
						if (!result.enable) {
							if (result.suggest) {
								this.fillSuggest(result.suggest);
							}
							this.helper.setError(main_core.Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_EXIST'));
						} else {
							this.helper.setSuccess(main_core.Loc.getMessage('LANDING_TPL_DOMAIN_AVAILABLE'));
						}
					} else {
						this.helper.setCheckFailed(main_core.Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_PROCESSING'));
					}
				}.bind(this),
				onfailure: function () {
					this.helper.hideLoader();
					if (this.isAnswerOutdated(requestedName)) {
						return;
					}
					this.helper.setCheckFailed(main_core.Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_PROCESSING'));
				}.bind(this)
			});
		}
	}

	exports.Bitrix24 = Bitrix24;
	exports.DomainState = DomainState;
	exports.Free = Free;
	exports.Helper = Helper;
	exports.Input = Input;
	exports.Private = Private;

})(this.BX.Landing.SiteDomain = this.BX.Landing.SiteDomain || {}, BX);
//# sourceMappingURL=script.js.map
