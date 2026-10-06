import {Event, Runtime, Loc, Type} from 'main.core';
import {DomainState, Helper} from './landing.site_domain.helper';

export class Input
{
	/**
	 * Constructor.
	 */
	constructor(params)
	{
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
		if (this.idDomainName)
		{
			Event.bind(this.idDomainName, 'keyup', Runtime.debounce(this.keyupCallback, 900));

			const initValue = Type.isString(this.idDomainName.value)
				? this.idDomainName.value.trim()
				: '';
			if (initValue.length === 0)
			{
				this.helper.setLength(0);
			}
			else
			{
				this.keyupCallback();
			}
		}

		const form = this.idDomainSubmit ? this.idDomainSubmit.form : null;
		if (form)
		{
			Event.bind(form, 'submit', event => {
				this.checkSubmit(event);
			});
		}

		this.fillDnsInstruction(this.domainName);
	}

	/**
	 * Returns true if domain name is empty.
	 * return {bool}
	 */
	domainNameIsEmpty()
	{
		this.idDomainName.value =
			Type.isString(this.idDomainName.value)
				? this.idDomainName.value.trim()
				: this.idDomainName.value
		;
		return this.idDomainName.value === '';
	}

	/**
	 * Keeps the form only when the address is empty or refused by the server for the value in the field.
	 * An unfinished check goes to the server validation.
	 */
	checkSubmit(event)
	{
		if (!this.helper.shouldValidateSubmit(event))
		{
			return;
		}

		if (this.domainNameIsEmpty())
		{
			this.helper.setError(Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_EMPTY'));
			this.helper.refuseSubmit(event);

			return;
		}

		if (this.helper.isInvalid())
		{
			if (this.checkedDomainName === this.idDomainName.value)
			{
				this.helper.refuseSubmit(event);

				return;
			}

			// the refusal is about a value the user has already changed: the current one has no verdict yet
			this.helper.setUnverified();
		}

		if (this.helper.getState() === DomainState.checking)
		{
			// a check of an outdated value starts over; a check of the current one is left to answer
			const restarting = this.previousDomainName !== this.idDomainName.value;

			this.helper.refuseSubmitWhileChecking(event, restarting);

			if (restarting)
			{
				this.restartCheck();
			}

			return;
		}

		this.helper.acceptSubmit();
	}

	/**
	 * Checks the current value right away, ignoring both the debounce and the cache of the last checked value.
	 */
	restartCheck()
	{
		this.previousDomainName = null;
		this.keyupCallback();
	}

	/**
	 * Handler on keyup input.
	 */
	keyupCallback()
	{
		this.idDomainName.value =
			Type.isString(this.idDomainName.value)
				? this.idDomainName.value.trim()
				: this.idDomainName.value
		;
		if (this.idDomainName.value === '')
		{
			this.helper.setError(Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_EMPTY'));
			this.helper.setLength(0);
			return;
		}

		const domainName = this.idDomainName.value;

		if (this.previousDomainName === domainName)
		{
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
					filter:
						this.domainId
							? { '!ID': this.domainId }
							: {}
				},
				sessid: Loc.getMessage('bitrix_sessid')
			},
			dataType: 'json',
			onsuccess: function (data)
			{
				if (generation !== this.checkGeneration)
				{
					return;
				}

				this.helper.hideLoader();
				if (data.type === 'success')
				{
					// the server has given its verdict about this very value
					this.checkedDomainName = domainName;

					if (data.result.length && data.result.length.length && data.result.length.limit)
					{
						this.helper.setLength(data.result.length.length, data.result.length.limit);
					}
					else
					{
						this.helper.hideLength();
					}

					if (!data.result.available)
					{
						if (data.result.errors)
						{
							if (data.result.errors.wrongSymbols)
							{
								this.helper.setError(Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_WRONG_NAME'));
							}
							else if (data.result.errors.wrongLength)
							{
								this.helper.setError(Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_WRONG_LENGTH'));
							}
							else if (data.result.errors.wrongSymbolCombination)
							{
								this.helper.setError(Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_WRONG_SYMBOL_COMBINATIONS'));
							}
							else if (data.result.errors.wrongDomainLevel)
							{
								this.helper.setError(Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_WRONG_DOMAIN_LEVEL'));
							}
							else
							{
								// refused for a reason this template cannot name: the state must still leave checking
								this.helper.setError(Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_INCORRECT'));
							}
						}
						else
						{
							this.helper.setError(
								!!data.result.deleted
									? Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_EXIST_DELETED')
									: Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_EXIST')
							);
						}
					}
					else if (!data.result.domain)
					{
						this.helper.setError(
							Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_INCORRECT')
						);
					}
					else
					{
						this.fillDnsInstruction(data.result.domain);
						this.helper.setSuccess(
							Loc.getMessage('LANDING_TPL_DOMAIN_AVAILABLE')
						);
					}

					if (data.result.dns && this.idDomainINA)
					{
						this.idDomainINA.textContent = data.result.dns['INA'];
					}
				}
				else
				{
					this.checkFailed();
				}
			}.bind(this),
			onfailure: function ()
			{
				if (generation !== this.checkGeneration)
				{
					return;
				}

				this.checkFailed();
			}.bind(this)
		});
	}

	/**
	 * The check gave no answer about the address: drop the cache so the same value may be checked again.
	 */
	checkFailed()
	{
		this.previousDomainName = null;
		this.helper.setCheckFailed(Loc.getMessage('LANDING_TPL_ERROR_DOMAIN_PROCESSING'));
	}

	/**
	 * Sets new DNS instructions after domain name change.
	 * @param {string} domainName Domain name.
	 */
	fillDnsInstruction(domainName)
	{
		if (!this.idDomainDnsInfo)
		{
			return;
		}
		if (!domainName)
		{
			return;
		}
		if (!this.idDomainDnsInfo.rows[1])
		{
			return;
		}
		if (!this.idDomainDnsInfo.rows[2])
		{
			return;
		}
		if (
			this.idDomainDnsInfo.rows[1].cells.length < 3 ||
			this.idDomainDnsInfo.rows[2].cells.length < 3
		)
		{
			return;
		}

		var cNameRecordRow = this.idDomainDnsInfo.rows[1];
		var aRecordRow = this.idDomainDnsInfo.rows[2];
		var domainParts = domainName.split('.');
		var domainRe = /^(com|net|org|co|kiev|spb|kharkov|msk|in|app)\.[a-z]{2}$/;

		aRecordRow.style.display = 'none';
		cNameRecordRow.cells[0].textContent = domainName ? domainName : 'landing.mydomain';

		if (
			(domainParts.length === 2) ||
			(domainParts.length === 3 && domainParts[0] === 'www') ||
			(domainParts.length === 3 && (domainParts[1] + '.' + domainParts[2]).match(domainRe))
		)
		{
			aRecordRow.style.display = 'table-row';
			if ((domainParts.length === 3 && domainParts[0] === 'www'))
			{
				aRecordRow.cells[0].textContent = domainParts[1] + '.' + domainParts[2] + '.';
			}
			else
			{
				cNameRecordRow.cells[0].textContent = 'www.' + domainName + '.';
				aRecordRow.cells[0].textContent = domainName + '.';
			}
		}
	}
}