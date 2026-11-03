'use strict';

function BitrixSmallCart(){}

BitrixSmallCart.prototype = {

	activate: function ()
	{
		this.cartElement = BX(this.cartId);
		this.fixedPosition = this.arParams.POSITION_FIXED == 'Y';
		if (this.fixedPosition)
		{
			this.cartClosed = true;
			this.maxHeight = false;
			this.itemRemoved = false;
			this.verticalPosition = this.arParams.POSITION_VERTICAL;
			this.horizontalPosition = this.arParams.POSITION_HORIZONTAL;
			this.topPanelElement = BX("bx-panel");

			this.fixAfterRender(); // TODO onready
			this.fixAfterRenderClosure = this.closure('fixAfterRender');

			var fixCartClosure = this.closure('fixCart');
			this.fixCartClosure = fixCartClosure;

			if (this.topPanelElement && this.verticalPosition == 'top')
				BX.addCustomEvent(window, 'onTopPanelCollapse', fixCartClosure);

			var resizeTimer = null;
			BX.bind(window, 'resize', function() {
				clearTimeout(resizeTimer);
				resizeTimer = setTimeout(fixCartClosure, 200);
			});
		}
		this.setCartBodyClosure = this.closure('setCartBody');
		this.lastAnnouncement = this.getAnnouncement();
		BX.addCustomEvent(window, 'OnBasketChange', this.closure('refreshCart', {}));
	},

	fixAfterRender: function ()
	{
		this.statusElement = BX(this.cartId + 'status');
		if (this.statusElement)
		{
			if (this.cartClosed)
				this.statusElement.innerHTML = this.openMessage;
			else
				this.statusElement.innerHTML = this.closeMessage;
		}
		this.productsElement = BX(this.cartId + 'products');
		this.fixCart();
	},

	closure: function (fname, data)
	{
		var obj = this;
		return data
			? function(){obj[fname](data)}
			: function(arg1){obj[fname](arg1)};
	},

	toggleOpenCloseCart: function ()
	{
		if (this.cartClosed)
		{
			BX.removeClass(this.cartElement, 'bx-closed');
			BX.addClass(this.cartElement, 'bx-opener');
			this.statusElement.innerHTML = this.closeMessage;
			this.cartClosed = false;
			this.fixCart();
		}
		else // Opened
		{
			BX.addClass(this.cartElement, 'bx-closed');
			BX.removeClass(this.cartElement, 'bx-opener');
			BX.removeClass(this.cartElement, 'bx-max-height');
			this.statusElement.innerHTML = this.openMessage;
			this.cartClosed = true;
			var itemList = this.cartElement.querySelector("[data-role='basket-item-list']");
			if (itemList)
				itemList.style.top = "auto";
		}
		setTimeout(this.fixCartClosure, 100);
	},

	setVerticalCenter: function(windowHeight)
	{
		var top = windowHeight/2 - (this.cartElement.offsetHeight/2);
		if (top < 5)
			top = 5;
		this.cartElement.style.top = top + 'px';
	},

	fixCart: function()
	{
		// set horizontal center
		if (this.horizontalPosition == 'hcenter')
		{
			var windowWidth = 'innerWidth' in window
				? window.innerWidth
				: document.documentElement.offsetWidth;
			var left = windowWidth/2 - (this.cartElement.offsetWidth/2);
			if (left < 5)
				left = 5;
			this.cartElement.style.left = left + 'px';
		}

		var windowHeight = 'innerHeight' in window
			? window.innerHeight
			: document.documentElement.offsetHeight;

		// set vertical position
		switch (this.verticalPosition) {
			case 'top':
				if (this.topPanelElement)
					this.cartElement.style.top = this.topPanelElement.offsetHeight + 5 + 'px';
				break;
			case 'vcenter':
				this.setVerticalCenter(windowHeight);
				break;
		}

		// toggle max height
		if (this.productsElement)
		{
			var itemList = this.cartElement.querySelector("[data-role='basket-item-list']");
			if (this.cartClosed)
			{
				if (this.maxHeight)
				{
					BX.removeClass(this.cartElement, 'bx-max-height');
					if (itemList)
						itemList.style.top = "auto";
					this.maxHeight = false;
				}
			}
			else // Opened
			{
				if (this.maxHeight)
				{
					if (this.productsElement.scrollHeight == this.productsElement.clientHeight)
					{
						BX.removeClass(this.cartElement, 'bx-max-height');
						if (itemList)
							itemList.style.top = "auto";
						this.maxHeight = false;
					}
				}
				else
				{
					if (this.verticalPosition == 'top' || this.verticalPosition == 'vcenter')
					{
						if (this.cartElement.offsetTop + this.cartElement.offsetHeight >= windowHeight)
						{
							BX.addClass(this.cartElement, 'bx-max-height');
							if (itemList)
								itemList.style.top = 82+"px";
							this.maxHeight = true;
						}
					}
					else
					{
						if (this.cartElement.offsetHeight >= windowHeight)
						{
							BX.addClass(this.cartElement, 'bx-max-height');
							if (itemList)
								itemList.style.top = 82+"px";
							this.maxHeight = true;
						}
					}
				}
			}

			if (this.verticalPosition == 'vcenter')
				this.setVerticalCenter(windowHeight);
		}

		this.reserveBottom(windowHeight);
	},

	// The cart stands over the page, so the control the focus scrolls to may come to rest under it.
	// The room it takes at the bottom of the window is handed to the stylesheet of the page.
	reserveBottom: function(windowHeight)
	{
		var root = document.documentElement;
		var box = this.cartElement.getBoundingClientRect();
		var reserve = box.height > 0 && box.top > windowHeight / 2 ? Math.ceil(windowHeight - box.top) : 0;
		// Every write into the root restyles the whole document.
		if (reserve === this.bottomReserve)
		{
			return;
		}

		this.bottomReserve = reserve;
		if (reserve > 0)
		{
			root.style.setProperty('--bx-basket-fixed-reserve', reserve + 'px');
			BX.addClass(root, 'bx-basket-fixed-reserved');
		}
		else
		{
			root.style.removeProperty('--bx-basket-fixed-reserve');
			BX.removeClass(root, 'bx-basket-fixed-reserved');
		}
	},

	refreshCart: function (data)
	{
		if (this.itemRemoved)
		{
			this.itemRemoved = false;
			return;
		}
		data.sessid = BX.bitrix_sessid();
		data.siteId = this.siteId;
		data.templateName = this.templateName;
		data.arParams = this.arParams;
		BX.ajax({
			url: this.ajaxPath,
			method: 'POST',
			dataType: 'html',
			data: data,
			onsuccess: this.setCartBodyClosure
		});
	},

	setCartBody: function (result)
	{
		if (this.cartElement)
		{
			var focusWasInside = this.cartElement.contains(document.activeElement);
			this.cartElement.innerHTML = result.replace(/#CURRENT_URL#/g, this.currentUrl);
			if (focusWasInside)
			{
				this.restoreFocus();
			}
			this.announceBasket();
		}
		if (this.fixedPosition)
			setTimeout(this.fixAfterRenderClosure, 100);
	},

	getAccessibility: function ()
	{
		return (BX.UI && BX.UI.Accessibility) || null;
	},

	restoreFocus: function ()
	{
		var accessibility = this.getAccessibility();
		var options = {preventScroll: true};
		// With SHOW_AUTHOR=Y the links of the profile come first, so the cart link is found by its mark.
		var selector = this.cartElement.querySelector('[data-basket-link]') ? '[data-basket-link]' : 'a';
		if (accessibility && accessibility.FocusNavigator.focusBySelector(this.cartElement, selector, options))
		{
			return;
		}

		// The navigator skips a link it deems invisible.
		var link = this.cartElement.querySelector(selector);
		if (link)
		{
			link.focus(options);
		}
	},

	getAnnouncement: function ()
	{
		var carrier = this.cartElement ? this.cartElement.querySelector('[data-basket-announce]') : null;

		return carrier ? carrier.dataset.basketAnnounce : '';
	},

	announceBasket: function ()
	{
		var accessibility = this.getAccessibility();
		var text = this.getAnnouncement();
		// The storefront fires OnBasketChange after every action, so only a changed text is news.
		if (!accessibility || !text || text === this.lastAnnouncement)
		{
			return;
		}

		this.lastAnnouncement = text;

		// The cart of the header and the cart of the footer refresh on one change; only one speaks for the page.
		if (BX.Type.isUndefined(window.bxBasketLineAnnouncer))
		{
			window.bxBasketLineAnnouncer = this.cartId;
		}

		if (window.bxBasketLineAnnouncer !== this.cartId)
		{
			return;
		}

		accessibility.LiveAnnouncer.announce(text, 'polite');
	},

	removeItemFromCart: function (id)
	{
		this.refreshCart ({sbblRemoveItemFromCart: id});
		this.itemRemoved = true;
		BX.onCustomEvent('OnBasketChange');
	}
};
