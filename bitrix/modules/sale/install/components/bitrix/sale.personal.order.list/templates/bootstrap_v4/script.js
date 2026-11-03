BX.namespace('BX.Sale.PersonalOrderComponent');

(function() {
	BX.Sale.PersonalOrderComponent.PersonalOrderList = {
		init : function(params)
		{
			var rowWrapper = document.getElementsByClassName('sale-order-list-inner-row');

			params.paymentList = params.paymentList || {};
			params.url = params.url || "";
			params.templateName = params.templateName || "";
			params.returnUrl = params.returnUrl || "";

			Array.prototype.forEach.call(
				document.getElementsByClassName('sale-order-list-inner-container'),
				BX.proxy(this.bindOrderControls, this)
			);

			Array.prototype.forEach.call(rowWrapper, function(wrapper)
			{
				var rowMode = null;
				var payResultNode = null;
				var template = wrapper.getElementsByClassName('sale-order-list-inner-row-template')[0];
				var cancelPaymentLink = template ? template.getElementsByClassName('sale-order-list-cancel-payment')[0] : null;

				if (cancelPaymentLink)
				{
					BX.bind(cancelPaymentLink, 'click', BX.proxy(function(event)
					{
						if (rowMode === 'pay')
						{
							event.preventDefault();
							this.restorePayRow(wrapper, payResultNode);
							payResultNode = null;
							rowMode = null;
						}
						else if (rowMode === 'change')
						{
							event.preventDefault();
							this.reloadToOrderHeading(wrapper);
						}
					}, this));
				}

				BX.bindDelegate(wrapper, 'click', { 'class': 'ajax_reload' }, BX.proxy(function(event)
				{
					var block = wrapper.getElementsByClassName('sale-order-list-inner-row-body')[0];

					BX.ajax(
						{
							method: 'POST',
							dataType: 'html',
							url: event.target.href,
							data:
							{
								sessid: BX.bitrix_sessid(),
								RETURN_URL: params.returnUrl
							},
							onsuccess: BX.proxy(function(result)
							{
								var resultDiv = document.createElement('div');
								resultDiv.innerHTML = result;
								template.insertBefore(resultDiv, cancelPaymentLink);
								block.style.display = 'none';
								template.style.display = 'block';

								payResultNode = resultDiv;
								rowMode = 'pay';
								template.focus();
							},this),
							onfailure: BX.proxy(function()
							{
								return this;
							}, this)
						}, this
					);
					event.preventDefault();
				}, this));

				var isChangingLoaded = false;
				BX.bindDelegate(wrapper, 'click', { 'class': 'sale-order-list-change-payment' }, BX.proxy(function(event)
				{
					if (isChangingLoaded)
						return;
					isChangingLoaded = true;
					event.preventDefault();

					var block = wrapper.getElementsByClassName('sale-order-list-inner-row-body')[0];
					var changeLink = this.getChangePaymentLink(event.target, wrapper);
					var paymentAccount = changeLink.getAttribute('data-payment-account') || changeLink.id;

					BX.ajax(
						{
							method: 'POST',
							dataType: 'html',
							url: params.url,
							data:
							{
								sessid: BX.bitrix_sessid(),
								orderData: params.paymentList[paymentAccount],
								templateName : params.templateName
							},
							onsuccess: BX.proxy(function(result)
							{
								var resultDiv = BX.create("div",{
									props: {className: "row"},
									children: [result]
								});

								template.insertBefore(resultDiv, cancelPaymentLink);
								changeLink.style.display = 'none';
								block.parentNode.removeChild(block);
								template.style.display = 'block';

								rowMode = 'change';
								var firstTile = resultDiv.querySelector('[role="radio"]');
								(firstTile || template).focus();
							},this),
							onfailure: BX.proxy(function()
							{
								isChangingLoaded = false;
								return this;
							}, this)
						}, this
					);

				}, this));
			}, this);

			BX.ready(BX.proxy(this.focusHeadingFromHash, this));
		},

		bindOrderControls: function(container)
		{
			Array.prototype.forEach.call(container.getElementsByClassName('sale-order-list-shipment-id'), function(blockId)
			{
				var clipboard = blockId.parentNode.getElementsByClassName('sale-order-list-shipment-id-icon')[0];
				if (clipboard)
				{
					BX.clipboard.bindCopyClick(clipboard, {
						text: blockId.textContent.trim(),
						popup: { focusTrap: false },
					});
					BX.bind(clipboard, 'keydown', function(event)
					{
						if (this.isActivationKey(event))
						{
							event.preventDefault();
							clipboard.click();
						}
					}.bind(this));
				}
			}, this);

			Array.prototype.forEach.call(container.querySelectorAll('[role="button"][aria-disabled="true"]'), function(button)
			{
				BX.bind(button, 'keydown', function(event)
				{
					if (this.isActivationKey(event))
					{
						event.preventDefault();
					}
				}.bind(this));
			}, this);
		},

		isActivationKey: function(event)
		{
			return event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar';
		},

		getChangePaymentLink: function(target, wrapper)
		{
			var link = BX.findParent(target, { className: 'sale-order-list-change-payment' }, wrapper);

			return link || target;
		},

		restorePayRow: function(wrapper, resultNode)
		{
			var block = wrapper.getElementsByClassName('sale-order-list-inner-row-body')[0];
			var template = wrapper.getElementsByClassName('sale-order-list-inner-row-template')[0];
			var payButton = wrapper.getElementsByClassName('ajax_reload')[0];

			block.style.display = 'block';
			template.style.display = 'none';
			if (resultNode)
			{
				BX.remove(resultNode);
			}

			if (payButton)
			{
				payButton.focus();
			}
		},

		reloadToOrderHeading: function(wrapper)
		{
			var heading = this.getOrderHeading(wrapper);

			if (heading && window.history && window.history.replaceState)
			{
				window.history.replaceState(window.history.state, '', '#' + heading.id);
			}

			window.location.reload();
		},

		getOrderHeading: function(wrapper)
		{
			var container = BX.findParent(wrapper, { className: 'sale-order-list-inner-container' });
			var orderRow = container ? container.parentNode : null;
			var titleRow = orderRow ? orderRow.previousElementSibling : null;

			return titleRow ? titleRow.querySelector('h3[id^="sale-order-list-order-"]') : null;
		},

		focusHeadingFromHash: function()
		{
			var hash = window.location.hash.slice(1);
			var heading;

			if (hash.indexOf('sale-order-list-order-') !== 0)
			{
				return;
			}

			heading = document.getElementById(hash);
			if (heading)
			{
				heading.focus();
			}
		}
	};
})();
