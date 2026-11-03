BX.namespace('BX.Sale');

BX.Sale.OrderPaymentChange = (function()
{
	var classDescription = function(params)
	{
		this.ajaxUrl = params.url;
		this.accountNumber = params.accountNumber || {};
		this.paymentNumber = params.paymentNumber || {};
		this.wrapperId = params.wrapperId || "";
		this.onlyInnerFull = params.onlyInnerFull || "";
		this.templateName = params.templateName || "";
		this.pathToPayment = params.pathToPayment || "";
		this.returnUrl = params.returnUrl || "";
		this.refreshPrices = params.refreshPrices || "N";
		this.inner = params.inner || "";
		this.templateFolder = params.templateFolder;
		this.wrapper = document.getElementById('bx-sopc'+ this.wrapperId);
		this.isRequestPending = false;

		BX.ready(BX.proxy(this.init, this));
	};

	classDescription.prototype.init = function()
	{
		var listPaySystems = this.wrapper.getElementsByClassName('sale-order-payment-change-pp-list')[0];
		// FocusZone skips tiles under opacity 0, so a key in the first frame would start it empty.
		new BX.easing(
		{
			duration: 500,
			start: {opacity: 1, height: 50},
			finish: {opacity: 100, height: 'auto'},
			transition: BX.easing.makeEaseOut(BX.easing.transitions.quad),
			step: function(state)
			{
				listPaySystems.style.opacity = state.opacity / 100;
				listPaySystems.style.height = listPaySystems.height / 450 + 'px';
			},
			complete: function()
			{
				listPaySystems.style.height = 'auto';
			}
		}).animate();

		BX.bindDelegate(listPaySystems, 'click', { 'className': 'sale-order-payment-change-pp-company' }, BX.proxy(
			function(event)
			{
				this.selectPaySystem(listPaySystems, event.target);
			}, this)
		);

		BX.bindDelegate(listPaySystems, 'keydown', { 'className': 'sale-order-payment-change-pp-company' }, BX.proxy(
			function(event)
			{
				if (!this.isActivationKey(event) || event.target.getAttribute('role') !== 'radio')
				{
					return;
				}

				event.preventDefault();
				// A held key repeats: one request per press.
				if (event.repeat)
				{
					return;
				}

				this.selectPaySystem(listPaySystems, event.target);
			}, this)
		);

		// The list may still be hidden here, so the zone starts once a tile is reached.
		var activateFocusZone = BX.proxy(function()
		{
			this.activateFocusZone(listPaySystems);
		}, this);
		listPaySystems.addEventListener('focusin', activateFocusZone, true);
		listPaySystems.addEventListener('keydown', activateFocusZone, true);

		return this;
	};

	classDescription.prototype.getA11y = function()
	{
		var a11y = BX.UI && BX.UI.Accessibility;

		return a11y && a11y.FocusZone && a11y.FocusKeys ? a11y : null;
	};

	classDescription.prototype.activateFocusZone = function(listPaySystems)
	{
		var a11y = this.getA11y();
		if (this.focusZone || !a11y || listPaySystems.getAttribute('role') !== 'radiogroup')
		{
			return;
		}

		this.focusZone = new a11y.FocusZone(listPaySystems, {
			bindKeys: a11y.FocusKeys.ArrowAll | a11y.FocusKeys.HomeAndEnd,
			focusInStrategy: function()
			{
				var activeElement = document.activeElement;

				return activeElement && activeElement.closest ? activeElement.closest('[role="radio"]') : null;
			},
		});
		this.focusZone.activate();
	};

	classDescription.prototype.isActivationKey = function(event)
	{
		return event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar';
	};

	classDescription.prototype.selectPaySystem = function(listPaySystems, target)
	{
		if (this.isRequestPending)
		{
			return;
		}

		var tile = target.closest('.sale-order-payment-change-pp-company');
		var paySystemId = tile ? tile.getAttribute('data-paysystem-id') : null;
		var imageNode = target;

		if (paySystemId === null)
		{
			paySystemId = target.parentNode.getElementsByClassName('sale-order-payment-change-pp-company-hidden')[0].value;
		}
		else
		{
			imageNode = tile.getElementsByClassName('sale-order-payment-change-pp-company-image')[0] || target;
		}

		this.isRequestPending = true;
		BX.ajax({
			method: 'POST',
			dataType: 'html',
			url: this.ajaxUrl,
			data:
			{
				sessid: BX.bitrix_sessid(),
				paySystemId: paySystemId,
				accountNumber: this.accountNumber,
				paymentNumber: this.paymentNumber,
				templateName: this.templateName,
				inner: this.inner,
				refreshPrices: this.refreshPrices,
				onlyInnerFull: this.onlyInnerFull,
				pathToPayment: this.pathToPayment,
				returnUrl: this.returnUrl,
			},
			onsuccess: BX.proxy(function(result)
			{
				this.isRequestPending = false;
				var isRadioGroup = listPaySystems.getAttribute('role') === 'radiogroup';

				if (this.focusZone)
				{
					this.focusZone.deactivate();
					this.focusZone = null;
				}

				listPaySystems.innerHTML = "";
				var title = this.wrapper.getElementsByClassName('sale-order-payment-change-payment-title')[0];
				title.innerHTML = "";
				var templateHtml = BX.create("DIV", {
					props: {className: 'col sale-order-payment-change-pp'},
					html: result
				});
				BX.append(templateHtml,listPaySystems);
				if (this.wrapper.parentNode.previousElementSibling)
				{
					var detailPaymentImage = this.wrapper.parentNode.previousElementSibling.getElementsByClassName("sale-order-detail-payment-options-methods-image-element")[0];
					if (detailPaymentImage !== undefined)
					{
						detailPaymentImage.style.backgroundImage = imageNode.style.backgroundImage;
					}
				}

				if (isRadioGroup)
				{
					listPaySystems.removeAttribute('role');
					listPaySystems.removeAttribute('aria-label');
					templateHtml.setAttribute('tabindex', '-1');
					templateHtml.setAttribute('role', 'group');
					templateHtml.setAttribute('aria-label', BX.message('SOPC_TPL_RESULT_ARIA'));
					templateHtml.focus();
				}
			},this),
			onfailure: BX.proxy(function()
			{
				this.isRequestPending = false;
			}, this),
		});
	};

	return classDescription;
})();

BX.Sale.OrderInnerPayment = (function()
{
	var paymentDescription = function(params)
	{
		this.ajaxUrl = params.url;
		this.accountNumber = params.accountNumber || {};
		this.paymentNumber = params.paymentNumber || {};
		this.wrapperId = params.wrapperId || "";
		this.valueLimit =  parseFloat(params.valueLimit) || 0;
		this.templateFolder = params.templateFolder;
		this.wrapper = document.getElementById('bx-sopc'+ this.wrapperId);
		this.inputElement = this.wrapper.getElementsByClassName('inner-payment-form-control')[0];
		this.sendPayment = this.wrapper.getElementsByClassName('sale-order-inner-payment-button')[0];
		BX.ready(BX.proxy(this.init, this));
	};

	paymentDescription.prototype.init = function()
	{
		BX.bind(this.inputElement, 'input', BX.delegate(
			function ()
			{
				this.inputElement.value = this.inputElement.value.replace(/[^\d,.]*/g, '')
					.replace(/,/g, '.')
					.replace(/([,.])[,.]+/g, '$1')
					.replace(/^[^\d]*(\d+([.,]\d{0,2})?).*$/g, '$1');

				var value = parseFloat(this.inputElement.value);

				if (value > this.valueLimit)
				{
					this.inputElement.value = this.valueLimit;
				}
				if (value <= 0)
				{
					this.inputElement.value = 0;
					this.sendPayment.classList.add('inactive-button');
				}
				else
				{
					this.sendPayment.classList.remove('inactive-button');
				}
			}, this)
		);

		BX.bind(this.sendPayment, 'click', BX.delegate(
			function ()
			{
				if (event.target.classList.contains("inactive-button"))
				{
					return this;
				}
				event.target.classList.add("inactive-button");
				BX.ajax(
					{
						method: 'POST',
						dataType: 'html',
						url: this.ajaxUrl,
						data:
						{
							sessid: BX.bitrix_sessid(),
							accountNumber: this.accountNumber,
							paymentNumber: this.paymentNumber,
							inner: "Y",
							onlyInnerFull: this.onlyInnerFull,
							paymentSum: this.inputElement.value,
							returnUrl: this.returnUrl,
						},
						onsuccess: BX.proxy(function(result)
						{
							if (result.length > 0)
								this.wrapper.innerHTML = result;
							else
								window.location.reload();
						},this),
						onfailure: BX.proxy(function()
						{
							return this;
						}, this)
					}, this
				);
				return this;
			}, this)
		);
	};

	return paymentDescription;
})();