import {Dom, Event, Runtime, Loc, Type} from 'main.core';
import {DomainState, Helper} from './landing.site_domain.helper';

// height the wrapper of the offered addresses keeps while the More button holds the rest of them
const CLIPPED_LIST_HEIGHT = 80;

export class Free
{
	/**
	 * Constructor.
	 */
	constructor(params)
	{
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
			Event.bind(this.promoCloseIcon, 'click', this.closePromoBlock.bind(this));
			Event.bind(this.promoCloseLink, 'click', this.closePromoBlock.bind(this));
		}

		if (this.idDomainAnotherMore) {
			Event.bind(this.idDomainAnotherMore, 'click', this.showMoreDomains.bind(this));
		}

		const form = this.idDomainSubmit ? this.idDomainSubmit.form : null;
		if (form)
		{
			Event.bind(form, 'submit', function(event)
			{
				this.checkSubmit(event);
			}.bind(this));

			Event.bind(form, 'keydown', function(event)
			{
				this.checkDomainOnEnter(event);
			}.bind(this));
		}

		if (this.idDomainCheck && this.idDomainName)
		{
			Event.bind(this.idDomainCheck, 'click', function(event)
			{
				this.checkDomain(event);
			}.bind(this));
		}

		if (this.idDomainName)
		{
			Event.bind(this.idDomainName, 'keyup', Runtime.debounce(function(event)
			{
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
	checkDomainOnEnter(event)
	{
		if (event.key !== 'Enter' || event.target !== this.idDomainName)
		{
			return;
		}

		if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
		{
			// a shortcut belongs to the browser, and an address submitted this way is still validated on the server
			return;
		}

		if (event.repeat)
		{
			// one press asks for one check, and the held key still submits no form
			event.preventDefault();

			return;
		}

		this.checkDomain(event);
	}

	/**
	 * Handler on keyup input.
	 */
	keyupCallback()
	{
		if (this.idDomainName.value === '')
		{
			this.helper.setError(Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_EMPTY'));

			return;
		}

		if (this.isCurrentValue(this.checkedDomainName))
		{
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
	closePromoBlock()
	{
		this.promoBlock.remove();
		this.helper.focusField();
	}

	/**
	 * Shows full block of suggesiotn domains.
	 */
	showMoreDomains()
	{
		const list = this.idDomainAnother.children[0];
		const opened = [...list.children].find((item) => item.hidden);

		this.showClippedSuggestions();
		this.idDomainAnother.style.height = list.offsetHeight + 'px';
		// the button has done its work and leaves the tree with the platform call: left behind it would keep
		// the focus on a control the eye no longer finds, so the reading point goes to what the button opened
		Dom.hide(this.idDomainAnotherMore.parentNode);

		const option = opened ? opened.querySelector('input') : null;

		if (option)
		{
			option.focus();
		}
		else
		{
			// the addresses were all in sight already, so the button opened nothing to read on from
			this.helper.focusField();
		}
	}

	/**
	 * Makes some check before submit.
	 */
	checkSubmit(event)
	{
		if (!this.helper.shouldValidateSubmit(event))
		{
			return;
		}

		this.checkDomainName();

		if (this.helper.isInvalid())
		{
			this.helper.refuseSubmit(event);

			return;
		}

		if (this.helper.getState() === DomainState.checking)
		{
			// the check is left to answer: a check of an outdated value cannot be restarted here anyway,
			// since the running one holds the loader that gates the next
			this.helper.refuseSubmitWhileChecking(event);

			return;
		}

		if (this.saveBlocker && this.saveBlockerCallback)
		{
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
	selectSuggested(domainName)
	{
		this.idDomainName.value = domainName;
		// the suggestion comes from the server as an available address
		this.checkedDomainName = domainName;
		this.helper.setSuccess(
			Loc.getMessage('LANDING_TPL_DOMAIN_AVAILABLE')
		);
	}

	/**
	 * Fill suggested domain area.
	 * @param {array} suggest Suggested domains.
	 */
	fillSuggest(suggest)
	{
		if (!this.idDomainAnother)
		{
			return;
		}

		if (this.idDomainAnotherMore)
		{
			// the button carries a display of its own, so the wrapper is what the platform call hides
			if (suggest.length > this.maxVisibleSuggested)
			{
				Dom.show(this.idDomainAnotherMore.parentNode);
			}
			else
			{
				Dom.hide(this.idDomainAnotherMore.parentNode);
			}
		}

		if (suggest.length)
		{
			Dom.show(this.idDomainAnother.parentNode);
		}
		else
		{
			Dom.hide(this.idDomainAnother.parentNode);
		}

		var children = [];

		for (let i = 0, c = suggest.length; i < c; i++)
		{
			children.push(
				Dom.create(
					'div',
					{
						props: {
							className: 'landing-domain-block-available-item'
						},
						children: [
							Dom.create(
								'input',
								{
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
								}
							),
							Dom.create(
								'label',
								{
									props: {
										className: 'landing-domain-block-available-label'
									},
									attrs: {
										for: 'domain-edit-suggest-' + i
									},
									text: suggest[i]
								}
							)
						]
					}
				)
			);
		}

		// the list is built anew: focus standing on an address about to be dropped would fall to the
		// document, so it goes to the field the addresses are offered for
		if (this.idDomainAnother.contains(document.activeElement))
		{
			this.helper.focusField();
		}

		this.idDomainAnother.innerHTML = '';
		this.idDomainAnother.appendChild(Dom.create(
			'div',
			{
				props: {
					className: 'landing-domain-block-available-list'
				},
				children: children
			}
		));

		// the visibility of the More button is kept by the platform call alone, so it is asked the same way
		if (!Dom.isShown(this.idDomainAnotherMore.parentNode))
		{
			this.idDomainAnother.style.height = this.idDomainAnother.children[0].offsetHeight + 'px';
		}
		else
		{
			this.idDomainAnother.style.height = CLIPPED_LIST_HEIGHT + 'px';
			this.hideClippedSuggestions();
		}
	}

	/**
	 * Takes the addresses the clipped list leaves out of sight out of the tree as well: cut off by the
	 * height of the wrapper, they still answer the keyboard and carry the focus behind the visible border.
	 */
	hideClippedSuggestions()
	{
		const list = this.idDomainAnother.children[0];
		const listTop = list.getBoundingClientRect().top;

		[...list.children].forEach((item) => {
			item.hidden = item.getBoundingClientRect().bottom - listTop > CLIPPED_LIST_HEIGHT;
		});
	}

	/**
	 * Brings back every address the clipped list has taken out of the tree.
	 */
	showClippedSuggestions()
	{
		[...this.idDomainAnother.children[0].children].forEach((item) => {
			item.hidden = false;
		});
	}

	/**
	 * Checks that domain name is correct by the local rules and leaves the field without a verdict when
	 * the rules are passed by a value no check has been asked about.
	 */
	checkDomainName()
	{
		this.idDomainName.value =
			Type.isString(this.idDomainName.value)
				? this.idDomainName.value.trim()
				: this.idDomainName.value
		;
		const domainRe = RegExp('^[a-z0-9-]+\.' + (this.tld) + '$');

		if (this.idDomainName.value === '')
		{
			this.helper.setError(Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_EMPTY'));
		}
		else if (!domainRe.test(this.idDomainName.value.toLowerCase()))
		{
			this.helper.setError(Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_CHECK'));
		}
		else if (
			this.idDomainName.value.indexOf('--') !== -1 ||
			this.idDomainName.value.indexOf('-.') !== -1 ||
			this.idDomainName.value.indexOf('-') === 0
		)
		{
			this.helper.setError(Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_CHECK_DASH'));
		}
		else if (this.checkedDomainName !== this.idDomainName.value)
		{
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
	isCurrentValue(domainName)
	{
		return domainName === this.idDomainName.value;
	}

	/**
	 * Tells whether the answer of a check says nothing about the address the field holds now: the value
	 * has been changed while the request was on its way, so the answer may not become its verdict.
	 * @param {string} requestedName Value the check was asked about.
	 * @return {boolean}
	 */
	isAnswerOutdated(requestedName)
	{
		return !this.isCurrentValue(requestedName);
	}

	/**
	 * Makes whois query for user pointed domain.
	 */
	checkDomain(event)
	{
		event.preventDefault();

		if (this.helper.isLoaderShowed())
		{
			return;
		}

		this.checkDomainName();
		if (this.helper.isInvalid())
		{
			return;
		}

		if (this.isCurrentValue(this.checkedDomainName) && this.helper.isValid())
		{
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
				sessid: Loc.getMessage('bitrix_sessid')
			},
			dataType: 'json',
			onsuccess: function (data)
			{
				// the loader gates the next check, so it belongs to the request and is released by its
				// answer even when the answer is dropped as outdated
				this.helper.hideLoader();

				if (this.isAnswerOutdated(requestedName))
				{
					return;
				}

				if (data.type === 'success')
				{
					const result = data.result;
					if (!result.enable)
					{
						if (result.suggest)
						{
							this.fillSuggest(result.suggest);
						}
						this.helper.setError(
							Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_EXIST')
						);
					}
					else
					{
						this.helper.setSuccess(
							Loc.getMessage('LANDING_TPL_DOMAIN_AVAILABLE')
						);
					}
				}
				else
				{
					this.helper.setCheckFailed(Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_PROCESSING'));
				}
			}.bind(this),
			onfailure: function ()
			{
				this.helper.hideLoader();

				if (this.isAnswerOutdated(requestedName))
				{
					return;
				}

				this.helper.setCheckFailed(Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_PROCESSING'));
			}.bind(this)
		});
	}
}