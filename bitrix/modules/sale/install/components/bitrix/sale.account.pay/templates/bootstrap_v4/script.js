
BX.saleAccountPay = (function()
{
	var classDescription = function(params)
	{
		this.messages = params.alertMessages || {};
		this.nameValue = params.nameValue || "buyMoney";
		this.ajaxUrl = params.url;
		this.signedParams = params.signedParams || {};
		this.wrapperId = params.wrapperId || "";
		this.templateFolder = params.templateFolder;
		this.templateName = params.templateName || "";
		this.wrapper = document.getElementById('bx-sap'+ this.wrapperId);

		this.changeInputContainer = this.wrapper.getElementsByClassName('sale-accountpay-fixedpay-container')[0];
		this.paySystemsContainer = this.wrapper.getElementsByClassName('sale-accountpay-pp')[0];
		this.inputElement = this.wrapper.getElementsByClassName('sale-accountpay-input')[0];
		this.submitButton = this.wrapper.getElementsByClassName('btn')[0];
		this.checkboxList = this.wrapper.getElementsByClassName('sale-accountpay-pp-company');

		BX.ready(BX.proxy(this.init, this));
	};
	
	classDescription.prototype.init = function()
	{
		this.checkboxList[0].checked = "checked";

		BX.bindDelegate(this.paySystemsContainer, 'click', { 'className': 'sale-accountpay-pp-company' }, BX.proxy(
			function(event)
			{
				this.selectPaySystem(event.target);
				return this;
			}, this)
		);

		BX.bindDelegate(this.paySystemsContainer, 'keydown', { 'className': 'sale-accountpay-pp-company' }, BX.proxy(
			function(event)
			{
				if (!this.isActivationKey(event) || event.target.getAttribute('role') !== 'radio')
				{
					return;
				}

				event.preventDefault();
				this.selectPaySystem(event.target);
			}, this)
		);

		var activateFocusZone = BX.proxy(this.activateFocusZone, this);
		this.paySystemsContainer.addEventListener('focusin', activateFocusZone, true);
		this.paySystemsContainer.addEventListener('keydown', activateFocusZone, true);

		BX.bind(this.inputElement, 'input', BX.delegate(
			function ()
			{
				this.inputElement.value = this.inputElement.value.replace(/[^\d,.]*/g, '')
					.replace(/\,/g, '.')
					.replace(/([,.])[,.]+/g, '$1')
					.replace(/^[^\d]*(\d+([.,]\d{0,5})?).*$/g, '$1');
			}, this)
		);
		
		BX.bindDelegate(this.changeInputContainer, 'click', { 'className': 'sale-accountpay-fixedpay-item' }, BX.proxy(
			function(event)
			{
				this.setFixedSum(event.target);
			}, this)
		);

		BX.bindDelegate(this.changeInputContainer, 'keydown', { 'className': 'sale-accountpay-fixedpay-item' }, BX.proxy(
			function(event)
			{
				if (!this.isActivationKey(event))
				{
					return;
				}

				event.preventDefault();
				this.setFixedSum(event.target);
			}, this)
		);

		BX.bind(this.submitButton, 'keydown', BX.delegate(
			function(event)
			{
				if (event.key === ' ' || event.key === 'Spacebar')
				{
					event.preventDefault();
					this.submitButton.click();
				}
			}, this)
		);

		BX.bind(this.submitButton, 'click', BX.delegate(
			function(event)
			{
				event.preventDefault();
				if (!this.inputElement)
				{
					return false;
				}
				if (parseFloat(this.inputElement.value) <= 0 || this.inputElement.value == "")
				{
					window.alert( BX.util.htmlspecialchars(this.messages.wrongInput));
					return false;
				}
				this.startLoader();
				BX.ajax(
					{
						method: 'POST',
						dataType: 'html',
						url: this.ajaxUrl,
						data:
						{
							sessid: BX.bitrix_sessid(),
							buyMoney: this.inputElement.value,
							templateName: this.templateName,
							paySystemId: this.wrapper.querySelector('.sale-accountpay-pp-company-checkbox:checked').value,
							signedParamsString: this.signedParams
						},
						onsuccess: BX.proxy(function(result)
						{
							this.deactivateFocusZone();
							while (this.wrapper.firstChild)
							{
								this.wrapper.removeChild(this.wrapper.firstChild);
							}
							this.wrapper.innerHTML = result;
							this.endLoader();
							this.wrapper.setAttribute('tabindex', '-1');
							this.wrapper.setAttribute('role', 'group');
							this.wrapper.setAttribute('aria-label', BX.message('SAP_RESULT_ARIA'));
							this.wrapper.focus();
						},this),
						onfailure: BX.proxy(function()
						{
							return this;
						}, this)
					}, this
				);
				this.destroy();
			}, this)
		);
		return this;
	};

	classDescription.prototype.getA11y = function()
	{
		var a11y = BX.UI && BX.UI.Accessibility;

		return a11y && a11y.FocusZone && a11y.FocusKeys && a11y.LiveAnnouncer ? a11y : null;
	};

	classDescription.prototype.isActivationKey = function(event)
	{
		return event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar';
	};

	// The zone starts once a tile is reached: the form may be out of sight on init.
	classDescription.prototype.activateFocusZone = function()
	{
		var a11y = this.getA11y();
		var container = this.paySystemsContainer;
		if (this.focusZone || !a11y || !container || container.getAttribute('role') !== 'radiogroup')
		{
			return;
		}

		this.focusZone = new a11y.FocusZone(container, {
			bindKeys: a11y.FocusKeys.ArrowAll | a11y.FocusKeys.HomeAndEnd,
			focusableElementFilter: function(element)
			{
				return element.getAttribute('role') === 'radio';
			},
		});
		this.focusZone.activate();
	};

	classDescription.prototype.deactivateFocusZone = function()
	{
		if (this.focusZone)
		{
			this.focusZone.deactivate();
			this.focusZone = null;
		}
	};

	classDescription.prototype.selectPaySystem = function(target)
	{
		var tile = target.closest('.sale-accountpay-pp-company');
		if (!tile)
		{
			return;
		}

		var tiles = this.wrapper.getElementsByClassName('sale-accountpay-pp-company');
		Array.prototype.forEach.call(tiles, function(item)
		{
			var checkbox = item.querySelector('.sale-accountpay-pp-company-checkbox');
			if (checkbox)
			{
				checkbox.checked = false;
			}
			item.classList.remove('bx-selected');
			if (item.hasAttribute('aria-checked'))
			{
				item.setAttribute('aria-checked', 'false');
			}
		});

		tile.classList.add('bx-selected');
		if (tile.hasAttribute('aria-checked'))
		{
			tile.setAttribute('aria-checked', 'true');
		}
		tile.querySelector('.sale-accountpay-pp-company-checkbox').checked = 'checked';
	};

	classDescription.prototype.setFixedSum = function(target)
	{
		var item = target.closest('.sale-accountpay-fixedpay-item');
		if (!item || !this.inputElement)
		{
			return;
		}

		var sum = item.getAttribute('data-sum');
		this.inputElement.value = parseInt(sum === null ? item.innerText : sum);

		var a11y = this.getA11y();
		if (a11y && sum !== null)
		{
			a11y.LiveAnnouncer.announce(BX.message('SAP_SUM_CHANGED_ARIA').replace('#SUM#', this.inputElement.value), 'polite');
		}
	};

	classDescription.prototype.destroy = function()
	{
		this.messages = null;
		this.nameValue = null;
		this.signedParams = null;
		this.changeInputContainer = null;
		this.paySystemsContainer = null;
		this.inputElement = null;
		this.submitButton = null;
		this.checkboxList = null;
	};

	/**
	 * Showing loader image with overlay.
	 */
	classDescription.prototype.startLoader = function()
	{
		if (this.BXFormPosting === true)
		{
			return false;
		}

		this.BXFormPosting = true;

		if (!this.loadingScreen)
		{
			this.loadingScreen = new BX.PopupWindow("loading_screen", this.submitButton,
			{
				overlay: {backgroundColor: 'white', opacity: '80'},
				autoHide : true,
				focusTrap: false,
				ariaLabel: BX.message('SAP_LOADING_ARIA'),
				events:
				{
					onAfterPopupShow: BX.proxy(function()
					{
						BX.cleanNode(this.loadingScreen.popupContainer);
						this.loadingScreen.popupContainer.appendChild(
							BX.create('IMG', {props: {src: this.templateFolder + "/images/loader.gif", alt: ''}})
						);
						this.loadingScreen.popupContainer.removeAttribute('style');
						this.loadingScreen.popupContainer.style.display = 'block';
					}, this)
				}
			});
		}

		return this.loadingScreen.show();
	};

	/**
	 * Hiding loader image with overlay.
	 */
	classDescription.prototype.endLoader = function(loaderTimer)
	{
		this.BXFormPosting = false;

		if (this.loadingScreen && this.loadingScreen.isShown())
		{
			this.loadingScreen.close();
		}

		clearTimeout(loaderTimer);
	};

	return classDescription;
})();