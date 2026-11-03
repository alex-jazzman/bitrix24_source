(function() {
	'use strict';

	if (!!window.JCSaleProductsGiftBasketComponent)
		return;

	window.JCSaleProductsGiftBasketComponent = function(params) {
		this.formPosting = false;
		this.siteId = params.siteId || '';
		this.template = params.template || '';
		this.componentPath = params.componentPath || '';
		this.parameters = params.parameters || '';

		this.container = document.querySelector('[data-entity="' + params.container + '"]');
		this.currentProductId = params.currentProductId;
		this.announceRebuild = false;
		this.giftCount = 0;

		if (params.initiallyShowHeader)
		{
			BX.ready(BX.proxy(this.showHeader, this));
		}

		// The server draws the gifts as well, and the deferred load may never answer: the cards it drew are
		// named and counted the moment the page is there, not when the request comes back.
		BX.ready(BX.proxy(this.refreshAccessibility, this));

		if (params.deferredLoad)
		{
			BX.ready(BX.proxy(this.deferredLoad, this));
		}

		BX.addCustomEvent('OnBasketChange', BX.proxy(this.reloadGifts, this));
		BX.addCustomEvent('OnCouponApply', BX.proxy(this.reloadGifts, this));
	};

	window.JCSaleProductsGiftBasketComponent.prototype =
	{
		reloadGifts: function()
		{
			this.announceRebuild = true;
			this.sendRequest({action: 'deferredLoad', recalculateDiscounts: 'Y'});
		},

		deferredLoad: function()
		{
			this.announceRebuild = false;
			this.sendRequest({action: 'deferredLoad'});
		},

		sendRequest: function(data)
		{
			var defaultData = {
				siteId: this.siteId,
				template: this.template,
				parameters: this.parameters
			};

			this.setBusy(true);

			BX.ajax({
				url: this.componentPath + '/ajax.php' + (document.location.href.indexOf('clear_cache=Y') !== -1 ? '?clear_cache=Y' : ''),
				method: 'POST',
				dataType: 'json',
				timeout: 60,
				data: BX.merge(defaultData, data),
				onsuccess: BX.delegate(function(result){
					if (!result || !result.JS)
					{
						this.showEmptyState(this.container && this.container.contains(document.activeElement));
						return;
					}

					BX.ajax.processScripts(
						BX.processHTML(result.JS).SCRIPT,
						false,
						BX.delegate(function(){this.showAction(result, data);}, this)
					);
				}, this),
				onfailure: BX.delegate(function(){
					this.setBusy(false);
					this.refreshAccessibility();
				}, this)
			});
		},

		showAction: function(result, data)
		{
			if (!data)
				return;

			switch (data.action)
			{
				case 'deferredLoad':
					this.processDeferredLoadAction(result);
					break;
			}
		},

		processDeferredLoadAction: function(result)
		{
			if (!result)
			{
				this.setBusy(false);
				return;
			}

			this.processItems(result.items);
		},

		processItems: function(itemsHtml)
		{
			if (!itemsHtml)
			{
				this.setBusy(false);
				return;
			}

			var processed = BX.processHTML(itemsHtml, false),
				temporaryNode = BX.create('DIV');

			var items, k, origRows;

			temporaryNode.innerHTML = processed.HTML;

			var focusWasInside = this.container.contains(document.activeElement);

			origRows = this.container.querySelectorAll('[data-entity="items-row"]');
			if (origRows.length)
			{
				BX.cleanNode(this.container);
				this.showHeader(false);
			}
			else
			{
				this.showHeader(true);
			}

			items = temporaryNode.querySelectorAll('[data-entity="items-row"]');
			for (k in items)
			{
				if (items.hasOwnProperty(k))
				{
					items[k].style.opacity = 0;
					this.container.appendChild(items[k]);
				}
			}

			if (items.length === 0)
			{
				this.showEmptyState(focusWasInside);
				BX.ajax.processScripts(processed.SCRIPT);
				return;
			}

			new BX.easing({
				duration: 2000,
				start: {opacity: 0},
				finish: {opacity: 100},
				transition: BX.easing.makeEaseOut(BX.easing.transitions.quad),
				step: function(state){
					for (var k in items)
					{
						if (items.hasOwnProperty(k))
						{
							items[k].style.opacity = state.opacity / 100;
						}
					}
				},
				complete: function(){
					for (var k in items)
					{
						if (items.hasOwnProperty(k))
						{
							items[k].removeAttribute('style');
						}
					}
				}
			}).animate();

			BX.ajax.processScripts(processed.SCRIPT);

			this.applyAccessibility(focusWasInside);
		},

		applyAccessibility: function(focusWasInside)
		{
			var previousCount = this.giftCount;
			var count = this.refreshAccessibility();

			this.setBusy(false);

			if (focusWasInside)
			{
				this.restoreFocus();
			}

			// The block reloads after every change of the basket; only a changed number of gifts is news.
			if (this.announceRebuild && count !== previousCount)
			{
				this.announce(this.getPhrase('CT_SPGB_TPL_GIFTS_UPDATED_ARIA', '#COUNT#', count));
			}
		},

		showEmptyState: function(focusWasInside)
		{
			var previousCount = this.giftCount;

			this.hideHeader();
			BX.cleanNode(this.container);
			this.updateListState(0);
			this.giftCount = 0;
			this.setBusy(false);

			if (focusWasInside)
			{
				this.focusBlock();
			}

			if (this.announceRebuild && previousCount !== 0)
			{
				this.announce(this.getPhrase('CT_SPGB_TPL_GIFTS_EMPTY_ARIA'));
			}
		},

		// The last gift was taken and every card the focus could stand on is gone. The block itself keeps
		// the place in the page and the name of the header, so the reading goes on from here and does not
		// start over from the top.
		focusBlock: function()
		{
			if (!this.container)
			{
				return;
			}

			this.container.setAttribute('tabindex', '-1');
			this.container.focus({preventScroll: true});
		},

		updateListState: function(count)
		{
			if (count > 0)
			{
				this.container.setAttribute('role', 'list');

				// The header of the block names the list and the role itself tells how many cards stand in
				// it; the phrase with the count names the list only where the page printed no header, and
				// the link to the header is never taken away - two names on one node are one name, and the
				// one a screen reader keeps is the header.
				if (!this.container.hasAttribute('aria-labelledby'))
				{
					var name = this.getPhrase('CT_SPGB_TPL_GIFTS_LIST_ARIA', '#COUNT#', count);
					if (name)
					{
						this.container.setAttribute('aria-label', name);
					}
				}
			}
			else
			{
				this.container.removeAttribute('role');
				this.container.removeAttribute('aria-label');
			}
		},

		// The name opens with the visible text of the button, so a voice command by that text still finds it.
		nameChooseButtons: function()
		{
			if (!this.getPhrase('CT_SPGB_TPL_BTN_CHOOSE_ARIA_MSGVER_1'))
			{
				return;
			}

			var cards = this.container.querySelectorAll('[data-entity="item"]');
			var button, title, text, name;

			for (var i = 0; i < cards.length; i++)
			{
				button = cards[i].querySelector('[id$="_buy_link"]');
				title = cards[i].querySelector('.product-item-title');
				if (!button || !title)
				{
					continue;
				}

				text = this.getNormalizedText(button);
				if (!text)
				{
					continue;
				}

				name = this.getNormalizedText(title);
				button.setAttribute('aria-label', this.getPhrase('CT_SPGB_TPL_BTN_CHOOSE_ARIA_MSGVER_1', {
					'#BUTTON#': text,
					'#NAME#': name,
				}));
			}
		},

		getNormalizedText: function(node)
		{
			return node.textContent.replace(/\s+/g, ' ').trim();
		},

		restoreFocus: function()
		{
			var accessibility = this.getAccessibility();
			var options = {preventScroll: true};

			if (accessibility && accessibility.FocusNavigator.focusFirst(this.container, options))
			{
				return;
			}

			// The navigator skips a control it deems invisible, and the cards are transparent while they fade in.
			var control = this.container.querySelector('.product-item-title a, [data-entity="item"][tabindex]');
			if (control)
			{
				control.focus(options);
			}
		},

		// Names the buttons and states the list over the cards standing in the container right now, and
		// answers how many of them there are.
		refreshAccessibility: function()
		{
			if (!this.container)
			{
				return 0;
			}

			var count = this.container.querySelectorAll('[data-entity="item"]').length;

			this.giftCount = count;
			this.updateListState(count);
			this.nameChooseButtons();

			return count;
		},

		setBusy: function(busy)
		{
			if (!this.container)
			{
				return;
			}

			if (busy)
			{
				this.container.setAttribute('aria-busy', 'true');
			}
			else
			{
				this.container.removeAttribute('aria-busy');
			}
		},

		announce: function(message)
		{
			var accessibility = this.getAccessibility();

			if (accessibility && message)
			{
				accessibility.LiveAnnouncer.announce(message, 'polite');
			}
		},

		// Takes one placeholder and its value, or a map of placeholders to values.
		getPhrase: function(id, placeholder, value)
		{
			var phrase = BX.message(id) || '';
			if (!placeholder)
			{
				return phrase;
			}

			var replacements = BX.type.isPlainObject(placeholder) ? placeholder : {};
			if (!BX.type.isPlainObject(placeholder))
			{
				replacements[placeholder] = value;
			}

			// A product name may carry the dollar patterns that a string replacement would expand.
			Object.keys(replacements).forEach(function(key) {
				phrase = phrase.replace(key, function() {
					return replacements[key];
				});
			});

			return phrase;
		},

		getAccessibility: function()
		{
			return (BX.UI && BX.UI.Accessibility) || null;
		},

		showHeader: function(animate)
		{
			var parentNode = BX.findParent(this.container, {attr: {'data-entity': 'parent-container'}}),
				header;

			if (parentNode && BX.type.isDomNode(parentNode))
			{
				header = parentNode.querySelector('[data-entity="header"]');

				if (header && header.getAttribute('data-showed') === 'false')
				{
					header.style.display = '';

					if (animate)
					{
						this.animation = new BX.easing({
							duration: 2000,
							start: {opacity: 0},
							finish: {opacity: 100},
							transition: BX.easing.makeEaseOut(BX.easing.transitions.quad),
							step: function(state){
								header.style.opacity = state.opacity / 100;
							},
							complete: function(){
								header.removeAttribute('style');
								header.setAttribute('data-showed', 'true');
							}
						});
						this.animation.animate()
					}
					else
					{
						header.style.opacity = 100;
					}
				}
			}
		},

		hideHeader: function()
		{
			var parentNode = BX.findParent(this.container, {attr: {'data-entity': 'parent-container'}}),
				header;

			if (parentNode && BX.type.isDomNode(parentNode))
			{
				header = parentNode.querySelector('[data-entity="header"]');

				if (header)
				{
					if (this.animation)
					{
						this.animation.stop();
					}

					header.style.display = 'none';
					header.style.opacity = 0;
					header.setAttribute('data-showed', 'false');
				}
			}
		}
	}
})();