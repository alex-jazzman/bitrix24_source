BX.namespace('BX.Sale.PersonalOrderComponent');

(function() {
	BX.Sale.PersonalOrderComponent.PersonalOrderDetail = {
		init : function(params)
		{
			var linkMoreOrderInformation = document.getElementsByClassName('sale-order-detail-more-info-more')[0];
			var clientInformation = document.getElementsByClassName('sale-order-detail-more-info-details')[0];
			var listShipmentWrapper = document.getElementsByClassName('sale-order-detail-payment-options-shipment');
			var listPaymentWrapper = document.getElementsByClassName('sale-order-detail-payment-options-methods');
			var shipmentTrackingId = document.getElementsByClassName('sale-order-detail-shipment-id');

			if (shipmentTrackingId[0])
			{
				Array.prototype.forEach.call(shipmentTrackingId, function(blockId)
				{
					var clipboard = blockId.parentNode.getElementsByClassName('sale-order-detail-shipment-id-icon')[0];
					if (clipboard)
					{
						BX.clipboard.bindCopyClick(clipboard, {
							text: blockId.textContent.trim(),
							popup: { focusTrap: false },
						});
						this.bindActivationKeys(clipboard);
					}
				}, this);
			}

			this.bindDisclosure(linkMoreOrderInformation, clientInformation, 'SPOD_LIST_MORE');

			Array.prototype.forEach.call(listShipmentWrapper, function(shipmentWrapper)
			{
				this.bindDisclosure(
					shipmentWrapper.getElementsByClassName('sale-order-detail-show-link')[0],
					shipmentWrapper.getElementsByClassName('sale-order-detail-payment-options-shipment-composition-map')[0],
					'SPOD_LIST_SHOW_ALL'
				);
			}, this);

			Array.prototype.forEach.call(listPaymentWrapper, function(paymentWrapper)
			{
				var rowPayment = paymentWrapper.getElementsByClassName('sale-order-detail-payment-options-methods-info')[0];
				var paymentForm = paymentWrapper.getElementsByClassName('sale-order-detail-payment-options-methods-template')[0];
				var closeButton = paymentForm ? paymentForm.getElementsByClassName('sale-paysystem-close')[0] : null;

				BX.bindDelegate(paymentWrapper, 'click', { 'class': 'active-button' }, BX.proxy(function()
				{
					this.togglePaymentForm(paymentWrapper, paymentForm);
				}, this));

				if (closeButton)
				{
					BX.bind(closeButton, 'keydown', BX.proxy(function(event)
					{
						if (this.isActivationKey(event))
						{
							event.preventDefault();
							closeButton.click();
						}
					}, this));
				}

				if (paymentForm)
				{
					BX.bind(paymentForm, 'keydown', BX.proxy(function(event)
					{
						if (
							(event.key === 'Escape' || event.key === 'Esc')
							&& BX.hasClass(paymentWrapper, 'sale-order-detail-active-event')
						)
						{
							event.preventDefault();
							this.togglePaymentForm(paymentWrapper, paymentForm);
						}
					}, this));
				}

				BX.bindDelegate(rowPayment, 'click', { 'class': 'sale-order-detail-payment-options-methods-info-change-link' }, BX.proxy(function(event)
				{
					event.preventDefault();

					var btn = rowPayment.parentNode.getElementsByClassName('sale-order-detail-payment-options-methods-button-container')[0];
					var linkReturn = rowPayment.parentNode.getElementsByClassName('sale-order-detail-payment-inner-row-template')[0];
					var changeLink = BX.findParent(event.target, { className: 'sale-order-detail-payment-options-methods-info-change-link' }, rowPayment) || event.target;
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
								templateName : params.templateName,
								returnUrl: params.returnUrl,
							},
							onsuccess: BX.proxy(function(result)
							{
								rowPayment.innerHTML = result;
								if (btn)
								{
									btn.parentNode.removeChild(btn);
								}
								linkReturn.style.display = "block";
								BX.bind(linkReturn, 'click', BX.proxy(this.reloadToOrderHeading, this));

								this.focusPaySystemList(rowPayment, paymentAccount);
							},this),
							onfailure: BX.proxy(function()
							{
								return this;
							}, this)
						}, this
					);

				}, this));
			}, this);

			BX.ready(BX.proxy(this.focusHeadingFromHash, this));
		},

		bindDisclosure: function(link, content, collapsedMessageId)
		{
			if (!link || !content)
			{
				return;
			}

			BX.bind(link, 'click', function()
			{
				var expanded = content.style.display === 'none';

				content.style.display = expanded ? 'flex' : 'none';
				link.setAttribute('aria-expanded', expanded ? 'true' : 'false');
				link.textContent = BX.message(expanded ? 'SPOD_LIST_LESS' : collapsedMessageId);
			});
			this.bindActivationKeys(link);
		},

		bindActivationKeys: function(node)
		{
			BX.bind(node, 'keydown', BX.proxy(function(event)
			{
				if (this.isActivationKey(event))
				{
					event.preventDefault();
					node.click();
				}
			}, this));
		},

		focusPaySystemList: function(rowPayment, paymentAccount)
		{
			var firstTile = rowPayment.querySelector('[role="radio"]');

			if (firstTile)
			{
				firstTile.focus();

				return;
			}

			rowPayment.setAttribute('tabindex', '-1');
			rowPayment.setAttribute('role', 'group');
			rowPayment.setAttribute('aria-label', BX.message('SPOD_PAY_SYSTEM_LIST_ARIA').replace('#BILL#', paymentAccount));
			rowPayment.focus();
		},

		reloadToOrderHeading: function()
		{
			var heading = document.querySelector('h1[id^="sale-order-detail-order-"]');

			if (heading && window.history && window.history.replaceState)
			{
				window.history.replaceState(window.history.state, '', '#' + heading.id);
			}

			window.location.reload();
		},

		focusHeadingFromHash: function()
		{
			var hash = window.location.hash.slice(1);
			var heading;

			if (hash.indexOf('sale-order-detail-order-') !== 0)
			{
				return;
			}

			heading = document.getElementById(hash);
			if (heading)
			{
				heading.focus();
			}
		},

		togglePaymentForm: function(paymentWrapper, paymentForm)
		{
			var payButton;

			BX.toggleClass(paymentWrapper, 'sale-order-detail-active-event');

			if (BX.hasClass(paymentWrapper, 'sale-order-detail-active-event'))
			{
				if (paymentForm)
				{
					paymentForm.focus();
				}

				return;
			}

			payButton = paymentWrapper.querySelector('button.active-button');
			if (payButton)
			{
				payButton.focus();
			}
		},

		isActivationKey: function(event)
		{
			return event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar';
		}
	};
})();
