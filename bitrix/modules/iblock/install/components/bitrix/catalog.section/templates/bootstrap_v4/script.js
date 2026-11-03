(function() {
	'use strict';

	if (!!window.JCCatalogSectionComponentBootstrapV4)
		return;

	// Without the extension the list keeps loading and loses only the spoken count.
	var getAccessibility = function()
	{
		return (BX.UI && BX.UI.Accessibility) || null;
	};

	window.JCCatalogSectionComponentBootstrapV4 = function(params) {
		this.formPosting = false;
		this.siteId = params.siteId || '';
		this.ajaxId = params.ajaxId || '';
		this.template = params.template || '';
		this.componentPath = params.componentPath || '';
		this.parameters = params.parameters || '';

		if (params.navParams)
		{
			this.navParams = {
				NavNum: params.navParams.NavNum || 1,
				NavPageNomer: parseInt(params.navParams.NavPageNomer) || 1,
				NavPageCount: parseInt(params.navParams.NavPageCount) || 1
			};
		}

		this.bigData = params.bigData || {enabled: false};
		this.container = document.querySelector('[data-entity="' + params.container + '"]');
		this.itemsTotal = parseInt(params.itemsTotal) || 0;
		this.lazyLoadContainer = document.querySelector('[data-entity="lazy-' + params.container + '"]');
		this.showMoreButton = null;
		this.showMoreButtonMessage = null;
		this.showMoreListNumber = 0;

		if (this.bigData.enabled && BX.util.object_keys(this.bigData.rows).length > 0)
		{
			BX.cookie_prefix = this.bigData.js.cookiePrefix || '';
			BX.cookie_domain = this.bigData.js.cookieDomain || '';
			BX.current_server_time = this.bigData.js.serverTime;

			BX.ready(BX.delegate(this.bigDataLoad, this));
		}

		if (params.initiallyShowHeader)
		{
			BX.ready(BX.delegate(this.showHeader, this));
		}

		if (params.deferredLoad)
		{
			BX.ready(BX.delegate(this.deferredLoad, this));
		}

		if (params.lazyLoad)
		{
			this.showMoreButton = document.querySelector('[data-use="show-more-' + this.navParams.NavNum + '"]');
			if (BX.type.isDomNode(this.showMoreButton))
			{
				this.showMoreButtonMessage = this.showMoreButton.innerHTML;
				BX.bind(this.showMoreButton, 'click', BX.proxy(this.showMore, this));
			}
		}

		if (params.loadOnScroll)
		{
			BX.bind(window, 'scroll', BX.proxy(this.loadOnScroll, this));
		}

		BX.ready(BX.delegate(this.initShowMoreButtonName, this));
	};

	window.JCCatalogSectionComponentBootstrapV4.prototype =
	{
		// Two lists on one page give two buttons with the same caption; the number tells them apart.
		initShowMoreButtonName: function()
		{
			var lists = document.querySelectorAll('.catalog-section[role="list"]');

			if (!this.showMoreButton || lists.length < 2)
				return;

			this.showMoreListNumber = Array.prototype.indexOf.call(lists, this.container) + 1;
			this.nameShowMoreButton();
		},

		// The caption stays part of the name, so it still matches what the visitor sees and says. It is
		// rebuilt on every change of the caption: while loading the button reads "Loading".
		nameShowMoreButton: function()
		{
			if (!this.showMoreButton || this.showMoreListNumber < 1)
				return;

			this.showMoreButton.setAttribute(
				'aria-label',
				BX.Loc.getMessage('CT_BCS_CATALOG_BTN_LAZY_LOAD_LIST_ARIA', {
					'#TEXT#': this.showMoreButton.textContent.trim(),
					'#NUM#': String(this.showMoreListNumber)
				})
			);
		},

		checkButton: function(keepButton)
		{
			if (this.showMoreButton)
			{
				if (this.navParams.NavPageNomer == this.navParams.NavPageCount)
				{
					if (!keepButton)
					{
						BX.remove(this.showMoreButton);
					}
				}
				else if (this.showMoreButton.parentNode !== this.lazyLoadContainer)
				{
					this.lazyLoadContainer.appendChild(this.showMoreButton);
				}
			}
		},

		enableButton: function()
		{
			if (this.showMoreButton)
			{
				BX.removeClass(this.showMoreButton, 'disabled');
				this.showMoreButton.innerHTML = this.showMoreButtonMessage;
				this.nameShowMoreButton();
				this.showMoreButton.removeAttribute('aria-disabled');
				this.container.removeAttribute('aria-busy');
			}
		},

		disableButton: function()
		{
			if (this.showMoreButton)
			{
				BX.addClass(this.showMoreButton, 'disabled');
				this.showMoreButton.innerHTML = BX.message('BTN_MESSAGE_LAZY_LOAD_WAITER');
				this.nameShowMoreButton();
				this.showMoreButton.setAttribute('aria-disabled', 'true');
				this.container.setAttribute('aria-busy', 'true');
			}
		},

		loadOnScroll: function()
		{
			var scrollTop = BX.GetWindowScrollPos().scrollTop,
				containerBottom = BX.pos(this.container).bottom;

			if (scrollTop + window.innerHeight > containerBottom)
			{
				this.showMore();
			}
		},

		showMore: function()
		{
			if (this.navParams.NavPageNomer < this.navParams.NavPageCount)
			{
				var data = {};
				data['action'] = 'showMore';
				data['PAGEN_' + this.navParams.NavNum] = this.navParams.NavPageNomer + 1;

				if (!this.formPosting)
				{
					this.formPosting = true;
					this.disableButton();
					this.sendRequest(data);
				}
			}
		},

		bigDataLoad: function()
		{
			// need remove all use this method
		},

		deferredLoad: function()
		{
			this.sendRequest({action: 'deferredLoad'});
		},

		sendRequest: function(data)
		{
			var defaultData = {
				siteId: this.siteId,
				template: this.template,
				parameters: this.parameters
			};

			if (this.ajaxId)
			{
				defaultData.AJAX_ID = this.ajaxId;
			}

			BX.ajax({
				url: this.componentPath + '/ajax.php' + (document.location.href.indexOf('clear_cache=Y') !== -1 ? '?clear_cache=Y' : ''),
				method: 'POST',
				dataType: 'json',
				timeout: 60,
				data: BX.merge(defaultData, data),
				onsuccess: BX.delegate(function(result){
					if (!result || !result.JS)
						return;

					BX.ajax.processScripts(
						BX.processHTML(result.JS).SCRIPT,
						false,
						BX.delegate(function(){this.showAction(result, data);}, this)
					);
				}, this)
			});
		},

		showAction: function(result, data)
		{
			if (!data)
				return;

			switch (data.action)
			{
				case 'showMore':
					this.processShowMoreAction(result);
					break;
				case 'deferredLoad':
					this.processDeferredLoadAction(result, data.bigData === 'Y');
					break;
			}
		},

		processShowMoreAction: function(result)
		{
			// Chrome and Firefox focus a button on a click of the mouse, and such a visitor notices
			// nothing of a focus carried away from under their hand: only a visible one is carried.
			var seenFocus = document.activeElement === this.showMoreButton
				&& this.showMoreButton.matches(':focus-visible')
			;

			this.formPosting = false;
			this.enableButton();

			if (result)
			{
				this.navParams.NavPageNomer++;
				var rows = this.processItems(result.items);
				this.processPagination(result.pagination);
				this.processEpilogue(result.epilogue);

				// The portion arrives below the screen and pushes the button down with it, so the focus is
				// carried onto the first card that came in, and before the button is taken away: the focus
				// of a node taken out of the document falls back to the top of the page. A portion that
				// took no focus, an empty one or a card of the row view with no page to link at, leaves the
				// button where it is, with the focus still on it.
				var keptFocus = seenFocus && !this.focusFirstEntry(rows, seenFocus);

				this.checkButton(keptFocus);
				this.renameList();
				this.announceAddedItems(rows);
			}
		},

		processDeferredLoadAction: function(result, bigData)
		{
			if (!result)
				return;

			var position = bigData ? this.bigData.rows : {};

			this.processItems(result.items, BX.util.array_keys(position));
		},

		processItems: function(itemsHtml, position)
		{
			if (!itemsHtml)
				return;

			var processed = BX.processHTML(itemsHtml, false),
				temporaryNode = BX.create('DIV');

			var items, k, origRows;

			temporaryNode.innerHTML = processed.HTML;
			items = temporaryNode.querySelectorAll('[data-entity="items-row"]');

			if (items.length)
			{
				this.showHeader(true);

				for (k in items)
				{
					if (items.hasOwnProperty(k))
					{
						origRows = position ? this.container.querySelectorAll('[data-entity="items-row"]') : false;
						items[k].style.opacity = 0;

						if (origRows && BX.type.isDomNode(origRows[position[k]]))
						{
							origRows[position[k]].parentNode.insertBefore(items[k], origRows[position[k]]);
						}
						else
						{
							this.container.appendChild(items[k]);
						}
					}
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
			}

			BX.ajax.processScripts(processed.SCRIPT);

			return items;
		},

		// An entry the keyboard cannot reach, with no link of its own and no tab stop, takes no focus,
		// and the answer says so, so that the button is not taken away from under the focus.
		focusFirstEntry: function(rows, scroll)
		{
			var entry = this.firstEntry(rows);

			if (!entry)
			{
				return false;
			}

			entry.focus({preventScroll: !scroll});

			return document.activeElement === entry;
		},

		firstEntry: function(rows)
		{
			var k, item;

			for (k in rows)
			{
				if (rows.hasOwnProperty(k))
				{
					item = rows[k].querySelector('[data-entity="item"]');

					if (item)
					{
						return item.querySelector('h3.product-item-title a') || item;
					}
				}
			}

			return null;
		},

		// The name tells how many of the result the list holds: a reader says that number after the name.
		renameList: function()
		{
			var line = this.container && this.container.id
				? document.getElementById(this.container.id + '_count')
				: null
			;
			if (!line || this.itemsTotal < 1)
				return;

			var shown = this.container.querySelectorAll('[data-entity="item"]').length;
			line.textContent = (
				shown < this.itemsTotal
					? BX.Loc.getMessage('CT_BCS_CATALOG_ITEMS_SHOWN_ARIA', {
						'#COUNT#': String(this.itemsTotal),
						'#SHOWN#': String(shown)
					})
					: BX.Loc.getMessage('CT_BCS_CATALOG_ITEMS_COUNT_ARIA', {'#COUNT#': String(this.itemsTotal)})
			);
		},

		announceAddedItems: function(rows)
		{
			var added = 0, k;

			for (k in rows)
			{
				if (rows.hasOwnProperty(k))
				{
					added += rows[k].querySelectorAll('[data-entity="item"]').length;
				}
			}

			var accessibility = getAccessibility();
			if (added === 0 || !accessibility)
				return;

			accessibility.LiveAnnouncer.announce(
				BX.Loc.getMessagePlural('CT_BCS_CATALOG_ITEMS_ADDED_ARIA', added, {'#COUNT#': String(added)})
			);
		},

		processPagination: function(paginationHtml)
		{
			if (!paginationHtml)
				return;

			var pagination = document.querySelectorAll('[data-pagination-num="' + this.navParams.NavNum + '"]');
			for (var k in pagination)
			{
				if (pagination.hasOwnProperty(k))
				{
					pagination[k].innerHTML = paginationHtml;
				}
			}
		},

		processEpilogue: function(epilogueHtml)
		{
			if (!epilogueHtml)
				return;

			var processed = BX.processHTML(epilogueHtml, false);
			BX.ajax.processScripts(processed.SCRIPT);
		},

		showHeader: function(animate)
		{
			var parentNode = BX.findParent(this.container, {attr: {'data-entity': 'parent-container'}}),
				header;

			if (parentNode && BX.type.isDomNode(parentNode))
			{
				header = parentNode.querySelector('[data-entity="header"]');

				if (header && header.getAttribute('data-showed') != 'true')
				{
					header.style.display = '';

					if (animate)
					{
						new BX.easing({
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
						}).animate();
					}
					else
					{
						header.style.opacity = 100;
					}
				}
			}
		}
	};
})();
