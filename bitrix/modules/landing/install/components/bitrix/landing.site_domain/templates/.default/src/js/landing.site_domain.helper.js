import {Dom, Event, Loc, Reflection, Runtime} from 'main.core';

/**
 * Address validity states.
 */
export const DomainState = {
	unknown: 'unknown',
	checking: 'checking',
	valid: 'valid',
	invalid: 'invalid',
};

export class Helper
{
	static DEFAULT_LENGTH_LIMIT = 63;

	/**
	 * Constructor.
	 */
	constructor(params)
	{
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

		if (this.idDomainName)
		{
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
	initAccessibility()
	{
		if (this.idDomainMessage)
		{
			Dom.show(this.idDomainMessage);
		}
	}

	/**
	 * Moves focus to the server-rendered alert of the previous save: no live region voices it.
	 */
	focusLoadTarget()
	{
		if (!this.idDomainErrorAlert)
		{
			return;
		}

		this.idDomainErrorAlert.focus({ preventScroll: true });
	}

	/**
	 * Releases the submission lock kept by a page restored from the back/forward cache.
	 */
	initPageRestore()
	{
		this.pageRestoreHandler = (event) => {
			if (event.persisted)
			{
				this.submitInProgress = false;
				Dom.removeClass(this.idDomainSubmit, this.classes.submit);
			}
		};

		Event.bind(window, 'pageshow', this.pageRestoreHandler);
	}

	/**
	 * Releases the page level subscription of this helper.
	 */
	destroy()
	{
		Event.unbind(window, 'pageshow', this.pageRestoreHandler);
	}

	/**
	 * Sets validity state and reflects it on the field.
	 * @param {string} state One of DomainState values.
	 */
	setState(state)
	{
		if (state !== this.state)
		{
			// a new state ends the current change, so the same text may be voiced again
			this.lastAnnouncement = null;
		}

		this.state = state;

		if (!this.idDomainName)
		{
			return;
		}

		this.idDomainName.setAttribute('data-domain-state', state);

		if (state === DomainState.invalid)
		{
			this.idDomainName.setAttribute('aria-invalid', 'true');
		}
		else if (state === DomainState.valid)
		{
			this.idDomainName.setAttribute('aria-invalid', 'false');
		}
		else
		{
			this.idDomainName.removeAttribute('aria-invalid');
		}
	}

	/**
	 * Returns current validity state.
	 * @return {string}
	 */
	getState()
	{
		return this.state;
	}

	/**
	 * Returns true if the address is known to be valid.
	 * @return {boolean}
	 */
	isValid()
	{
		return this.state === DomainState.valid;
	}

	/**
	 * Returns true if the server has explicitly refused the address.
	 * @return {boolean}
	 */
	isInvalid()
	{
		return this.state === DomainState.invalid;
	}

	/**
	 * Tells whether the field owner has to validate this submission.
	 * @param {SubmitEvent} event
	 * @return {boolean}
	 */
	shouldValidateSubmit(event)
	{
		if (this.submitInProgress)
		{
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
	refuseSubmit(event)
	{
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
	refuseSubmitWhileChecking(event, checkRestarting = false)
	{
		event.preventDefault();

		const reason = Loc.getMessage('LANDING_TPL_DOMAIN_CHECKING_SUBMIT');

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
	cancelSubmit(event)
	{
		event.preventDefault();

		this.submitAttempt = false;
	}

	/**
	 * Allows the submission and locks the field against a repeated one.
	 */
	acceptSubmit()
	{
		this.submitAttempt = false;
		this.submitInProgress = true;
		Dom.addClass(this.idDomainSubmit, this.classes.submit);
	}

	/**
	 * Announces a message through the shared a11y facade - the only channel of the field.
	 * A duplicate inside a single change is suppressed.
	 * @param {string} message
	 * @param {string} politeness 'polite' or 'assertive'.
	 */
	announce(message, politeness = 'polite')
	{
		if (!message || message === this.lastAnnouncement)
		{
			return;
		}

		this.lastAnnouncement = message;

		// the facade is resolved at the moment of the call: the bundle must not require it to exist earlier
		const facade = Reflection.getClass('BX.Landing.UI.A11y');

		if (facade)
		{
			facade.announce(message, politeness);

			return;
		}

		Runtime.loadExtension('landing.ui.a11y')
			.then(({ A11y }) => A11y.announce(message, politeness))
			.catch(() => {});
	}

	/**
	 * Tells whether the field already holds focus.
	 * @return {boolean}
	 */
	isFieldFocused()
	{
		return !!this.idDomainName && document.activeElement === this.idDomainName;
	}

	/**
	 * Moves focus to the address field.
	 * @return {boolean} Whether the field has taken the focus.
	 */
	focusField()
	{
		if (!this.idDomainName)
		{
			return false;
		}

		this.idDomainName.focus();

		return this.isFieldFocused();
	}

	/**
	 * Shows loader div near input and announces the started check, unless a refused submission has
	 * already announced it (checkStatusDelivered).
	 */
	showLoader()
	{
		this.setState(DomainState.checking);

		if (this.checkStatusDelivered)
		{
			this.checkStatusDelivered = false;
		}
		else
		{
			this.clearMessage();
			this.announce(Loc.getMessage('LANDING_TPL_DOMAIN_CHECKING'));
		}

		this.hideLength();
		Dom.show(this.idDomainLoader);
	}

	/**
	 * Hides loader div near input.
	 */
	hideLoader()
	{
		Dom.hide(this.idDomainLoader);
	}

	/**
	 * Returns true if loader showed.
	 * @return {boolean}
	 */
	isLoaderShowed()
	{
		return Dom.isShown(this.idDomainLoader);
	}

	setLength(length: number, limit: number = Helper.DEFAULT_LENGTH_LIMIT)
	{
		if (this.idDomainLength)
		{
			this.idDomainLength.innerHTML = Loc.getMessage('LANDING_TPL_DOMAIN_LENGTH_LIMIT', {
				'#LENGTH#': length,
				'#LIMIT#': limit,
			});
		}
		Dom.show(this.idDomainLength);
	}

	hideLength()
	{
		if (this.idDomainLength)
		{
			Dom.hide(this.idDomainLength);
		}
	}

	/**
	 * Marks input as valid and shows success message.
	 * @param {string} successMessage Success message.
	 */
	setSuccess(successMessage)
	{
		this.hideErrorAlert();
		this.setState(DomainState.valid);
		this.setMessage(successMessage);
	}

	/**
	 * Hides the alert of the previous save attempt: it does not describe the current value anymore.
	 * An alert that holds the focus stays visible while there is no field to take it.
	 */
	hideErrorAlert()
	{
		if (!this.idDomainErrorAlert)
		{
			return;
		}

		if (this.idDomainErrorAlert.contains(document.activeElement) && !this.focusField())
		{
			return;
		}

		Dom.hide(this.idDomainErrorAlert);
	}

	/**
	 * Marks input as invalid and shows error message or hides message if errorMessage is empty.
	 * Reserved for an explicit refusal of the address.
	 * @param {string} errorMessage Error message.
	 */
	setError(errorMessage)
	{
		this.setState(DomainState.invalid);
		this.setMessage(errorMessage, true);
	}

	/**
	 * The address is changed and has no verdict yet: no error flag, no stale message.
	 */
	setUnverified()
	{
		this.hideErrorAlert();
		this.setState(DomainState.unknown);
		this.clearMessage();
	}

	/**
	 * The check did not happen: the address stays unverified, but the reason is shown.
	 * @param {string} message
	 */
	setCheckFailed(message)
	{
		this.hideLoader();
		this.setState(DomainState.unknown);
		this.setMessage(message, true);
	}

	/**
	 * Returns the currently displayed message text.
	 * @return {string}
	 */
	getMessageText()
	{
		return this.idDomainMessage ? this.idDomainMessage.textContent.trim() : '';
	}

	/**
	 * Sets success or fail message. The reason of a refused submission is announced insistently,
	 * the result of a background check politely.
	 * @param {string} message Error message.
	 * @param {boolean} error Error message (false by default).
	 */
	setMessage(message: string, error: boolean)
	{
		if (!this.idDomainMessage)
		{
			return;
		}
		error = !!error;

		const refusalReason = error && this.submitAttempt;

		this.clearMessage();
		if (!message)
		{
			return;
		}

		if (this.idDomainNameParent)
		{
			Dom.addClass(
				this.idDomainNameParent,
				error
					? this.classes.dangerBorder
					: this.classes.successBorder
			);
		}
		Dom.addClass(
			this.idDomainMessage,
			error
				? this.classes.dangerAlert
				: this.classes.successAlert
		);
		this.idDomainMessage.innerHTML = this.decorateMessage(message, error);
		this.announce(this.getMessageText(), refusalReason ? 'assertive' : 'polite');
	}

	/**
	 * Shows a neutral status of the address: neither the error nor the success sign, no announcement.
	 * @param {string} message
	 */
	setStatusMessage(message)
	{
		if (!this.idDomainMessage)
		{
			return;
		}

		this.clearMessage();
		if (!message)
		{
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
	decorateMessage(message, error)
	{
		const signed = error
			? Loc.getMessage('LANDING_TPL_DOMAIN_MESSAGE_ERROR', { '#MESSAGE#': message })
			: Loc.getMessage('LANDING_TPL_DOMAIN_MESSAGE_SUCCESS', { '#MESSAGE#': message });

		// an unpublished phrase resolves to an empty string, and the message must not be lost with it
		return signed || message;
	}

	/**
	 * Clears message alert.
	 */
	clearMessage()
	{
		if (!this.idDomainMessage)
		{
			return;
		}

		// whatever stood here is replaced, including the status of a check told by a refused submission
		this.checkStatusDelivered = false;

		if (this.idDomainNameParent)
		{
			Dom.removeClass(this.idDomainNameParent, this.classes.dangerBorder);
			Dom.removeClass(this.idDomainNameParent, this.classes.successBorder);
		}
		Dom.removeClass(this.idDomainMessage, this.classes.dangerAlert);
		Dom.removeClass(this.idDomainMessage, this.classes.successAlert);

		this.idDomainMessage.innerHTML = '';
	}
}
