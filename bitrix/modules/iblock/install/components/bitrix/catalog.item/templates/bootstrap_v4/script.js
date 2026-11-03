(function (window){
	'use strict';

	if (window.JCCatalogItemBootstrapV4)
		return;

	// Without the extension the card keeps its gallery and loses only the keyboard path over it.
	var getAccessibility = function()
	{
		return (BX.UI && BX.UI.Accessibility) || null;
	};

	// The strip fades in over 300ms, and a zone built over a transparent strip collects no dots.
	var DOTS_FADE_TIMEOUT = 350;

	// A strip that lets no dot through, as a card taken off the document keeps, would otherwise be
	// waited for anew as long as the card holds the class of the opened one.
	var DOTS_FADE_ATTEMPTS = 6;

	// A card arriving with a portion of the list is faded in over two seconds, and a group at nought
	// opacity holds no values for a zone, so it is looked at again until the fade lets them through.
	var SKU_FADE_TIMEOUT = 350;
	var SKU_FADE_ATTEMPTS = 6;

	// A held step button repeats every 150ms, and the announcer plays every queued message in full.
	var TOTAL_ANNOUNCE_DELAY = 500;

	// String.replace reads $& and $' in the replacement, and both come out of product texts.
	var fillTemplate = function(template, values)
	{
		var filled = template;

		for (var placeholder in values)
		{
			if (values.hasOwnProperty(placeholder))
			{
				filled = filled.split(placeholder).join(values[placeholder]);
			}
		}

		return filled;
	};

	var textOf = function(node)
	{
		return node ? (node.textContent || '').trim() : '';
	};

	// A value the tree has ruled out keeps its place in the markup, hidden by an inline style.
	var getSkuTabStop = function(list)
	{
		var values = list.querySelectorAll('[role="radio"]');
		var first = null;

		for (var i = 0; i < values.length; i++)
		{
			if (values[i].style.display === 'none')
			{
				continue;
			}

			if (values[i].getAttribute('aria-checked') === 'true')
			{
				return values[i];
			}

			first = first || values[i];
		}

		return first;
	};

	var cards = [];

	// A list reloaded over ajax drops its cards without a word to their scripts.
	var liveCards = function()
	{
		for (var i = cards.length - 1; i >= 0; i--)
		{
			if (!cards[i].obProduct.isConnected)
			{
				cards.splice(i, 1);
			}
		}

		return cards;
	};

	var cardOf = function(node)
	{
		var live = liveCards();

		for (var i = 0; i < live.length; i++)
		{
			if (live[i].obProduct === node)
			{
				return live[i];
			}
		}

		return null;
	};

	var cardHolding = function(node)
	{
		var live = liveCards();

		for (var i = 0; i < live.length; i++)
		{
			if (live[i].obProduct === node || live[i].obProduct.contains(node))
			{
				return live[i];
			}
		}

		return null;
	};

	var previousNode = function(node)
	{
		var previous = node.previousElementSibling;

		if (!previous)
		{
			return node.parentElement;
		}

		while (previous.lastElementChild)
		{
			previous = previous.lastElementChild;
		}

		return previous;
	};

	var previousCardOf = function(card)
	{
		for (var at = previousNode(card.obProduct); at; at = previousNode(at))
		{
			var item = at.closest('[data-entity="item"]');

			if (item)
			{
				return cardOf(item);
			}
		}

		return null;
	};

	var cardBefore = function(node)
	{
		var accessibility = getAccessibility();

		if (!accessibility)
		{
			return null;
		}

		for (var at = previousNode(node); at; at = previousNode(at))
		{
			var card = cardHolding(at);

			if (card)
			{
				return card;
			}

			if (at.tabIndex >= 0 && accessibility.InteractivityChecker.isFocusable(at))
			{
				return null;
			}
		}

		return null;
	};

	// Shift+Tab: the browser looks for the previous stop before any focus event of ours could open
	// the card that holds it, and a collapsed card keeps its controls at display: none. So the card
	// the keyboard is about to enter is opened while the key is still being handled.
	var onListKeyDown = function(event)
	{
		if (event.key !== 'Tab' || !event.shiftKey)
		{
			return;
		}

		var target = BX.getEventTarget(event);

		if (!BX.type.isElementNode(target) || cardHolding(target))
		{
			return;
		}

		var entered = cardBefore(target);

		if (entered)
		{
			entered.expand();
		}
	};

	var listKeysBound = false;

	var bindListKeys = function()
	{
		if (listKeysBound)
		{
			return;
		}

		listKeysBound = true;
		BX.bind(document, 'keydown', onListKeyDown);
	};

	var openOneCard = function(card)
	{
		var live = liveCards();

		if (live.indexOf(card) === -1)
		{
			return;
		}

		for (var i = 0; i < live.length; i++)
		{
			if (live[i] !== card)
			{
				live[i].collapse();
			}
		}

		card.expand();
	};

	// A scroll moves the page under a hand that stands still and fires an enter of its own, so the
	// position the event reports is what tells such an entry from a move of the hand. The position is
	// followed over the whole document: a hand that came to rest outside the cards (over the button
	// that grows the list, over a heading) must not read as moving when a card slides under it.
	var pointerAt = null;

	var onDocumentMouseMove = function(event)
	{
		pointerAt = {x: event.clientX, y: event.clientY};
	};

	var pointerBound = false;

	var bindPointer = function()
	{
		if (pointerBound)
		{
			return;
		}

		pointerBound = true;
		BX.bind(document, 'mousemove', onDocumentMouseMove);
	};

	// Read before the move reaches the document, so the last position known is the one before it.
	// A hand never seen to move is not taken for a moving one.
	var pointerMoved = function(event)
	{
		return pointerAt !== null
			&& (pointerAt.x !== event.clientX || pointerAt.y !== event.clientY)
		;
	};

	var cardHoldsFocus = function()
	{
		var live = liveCards();

		for (var i = 0; i < live.length; i++)
		{
			if (live[i].focusInside)
			{
				return true;
			}
		}

		return false;
	};

	var BasketButton = function(params)
	{
		params = params || {};
		this.popupWindow = null;
		this.params = params;
		this.text = params.text || '';
		this.id = params.id || '';
		this.className = params.className || '';
		this.events = params.events || {};
		this.contextEvents = {};

		for (var eventName in this.events)
		{
			if (this.events.hasOwnProperty(eventName) && BX.type.isFunction(this.events[eventName]))
			{
				this.contextEvents[eventName] = BX.proxy(this.events[eventName], this);
			}
		}

		var attrs = {type: 'button', tabindex: '0'};
		if (params.autofocus)
		{
			attrs['data-autofocus'] = 'true';
		}

		if (params.testId)
		{
			attrs['data-testid'] = params.testId;
		}

		this.buttonNode = BX.create('button', {
			props: {className: 'btn btn-primary btn-buy btn-sm', id: this.id},
			attrs: attrs,
			style: typeof params.style === 'object' ? params.style : {},
			text: this.text,
			events: this.contextEvents
		});

		if (BX.browser.IsIE())
		{
			this.buttonNode.setAttribute("hideFocus", "hidefocus");
		}
	};
	BX.extend(BasketButton, BX.PopupWindowButton);

	window.JCCatalogItemBootstrapV4 = function (arParams)
	{
		this.productType = 0;
		this.showQuantity = true;
		this.showAbsent = true;
		this.secondPict = false;
		this.showOldPrice = false;
		this.showMaxQuantity = 'N';
		this.relativeQuantityFactor = 5;
		this.showPercent = false;
		this.showSkuProps = false;
		this.basketAction = 'ADD';
		this.showClosePopup = false;
		this.useCompare = false;
		this.showSubscription = false;
		this.visual = {
			ID: '',
			PICT_ID: '',
			SECOND_PICT_ID: '',
			PICT_SLIDER_ID: '',
			QUANTITY_ID: '',
			QUANTITY_UP_ID: '',
			QUANTITY_DOWN_ID: '',
			PRICE_ID: '',
			PRICE_OLD_ID: '',
			DSC_PERC: '',
			SECOND_DSC_PERC: '',
			DISPLAY_PROP_DIV: '',
			BASKET_PROP_DIV: '',
			SUBSCRIBE_ID: ''
		};
		this.product = {
			checkQuantity: false,
			maxQuantity: 0,
			stepQuantity: 1,
			isDblQuantity: false,
			canBuy: true,
			name: '',
			pict: {},
			id: 0,
			addUrl: '',
			buyUrl: ''
		};

		this.basketMode = '';
		this.basketData = {
			useProps: false,
			emptyProps: false,
			quantity: 'quantity',
			props: 'prop',
			basketUrl: '',
			sku_props: '',
			sku_props_var: 'basket_props',
			add_url: '',
			buy_url: ''
		};

		this.compareData = {
			compareUrl: '',
			compareDeleteUrl: '',
			comparePath: ''
		};

		this.defaultPict = {
			pict: null,
			secondPict: null
		};

		this.defaultSliderOptions = {
			interval: 3000,
			wrap: true
		};
		this.slider = {
			options: {},
			items: [],
			active: null,
			sliding: null,
			requestedSlide: null,
			paused: null,
			interval: null,
			progress: null,
			stoppedByUser: false
		};
		this.touch = null;

		this.quantityDelay = null;
		this.quantityTimer = null;

		this.checkQuantity = false;
		this.maxQuantity = 0;
		this.minQuantity = 0;
		this.stepQuantity = 1;
		this.isDblQuantity = false;
		this.canBuy = true;
		this.precision = 6;
		this.precisionFactor = Math.pow(10, this.precision);
		this.bigData = false;
		this.fullDisplayMode = false;
		this.viewMode = '';
		this.templateTheme = '';

		this.currentPriceMode = '';
		this.currentPrices = [];
		this.currentPriceSelected = 0;
		this.currentQuantityRanges = [];
		this.currentQuantityRangeSelected = 0;

		this.offers = [];
		this.offerNum = 0;
		this.treeProps = [];
		this.selectedValues = {};

		this.obProduct = null;
		this.blockNodes = {};
		this.obQuantity = null;
		this.obQuantityUp = null;
		this.obQuantityDown = null;
		this.obQuantityLimit = {};
		this.obPict = null;
		this.obSecondPict = null;
		this.obPictSlider = null;
		this.obPictSliderIndicator = null;
		this.obPrice = null;
		this.obTree = null;
		this.obBuyBtn = null;
		this.obBasketActions = null;
		this.obNotAvail = null;
		this.obSubscribe = null;
		this.obDscPerc = null;
		this.obSecondDscPerc = null;
		this.obSkuProps = null;
		this.obMeasure = null;
		this.obCompare = null;

		this.obPopupWin = null;
		this.basketUrl = '';
		this.basketParams = {};
		this.isTouchDevice = BX.hasClass(document.documentElement, 'bx-touch');
		this.hoverTimer = null;
		this.pointerInside = false;
		this.focusInside = false;
		this.popupInitiator = null;
		this.dotsFocusZone = null;
		this.skuFocusZones = null;
		this.skuFadeTimer = null;
		this.skuFadeAttempts = 0;
		this.dotsFadeHandler = null;
		this.dotsFadeTimer = null;
		this.dotsFadeAttempts = 0;
		this.totalAnnounceTimer = null;
		this.changedRows = [];

		this.useEnhancedEcommerce = false;
		this.dataLayerName = 'dataLayer';
		this.brandProperty = false;

		this.errorCode = 0;

		if (typeof arParams === 'object')
		{
			if (arParams.PRODUCT_TYPE)
			{
				this.productType = parseInt(arParams.PRODUCT_TYPE, 10);
			}

			this.showQuantity = arParams.SHOW_QUANTITY;
			this.showAbsent = arParams.SHOW_ABSENT;
			this.secondPict = arParams.SECOND_PICT;
			this.showOldPrice = arParams.SHOW_OLD_PRICE;
			this.showMaxQuantity = arParams.SHOW_MAX_QUANTITY;
			this.relativeQuantityFactor = parseInt(arParams.RELATIVE_QUANTITY_FACTOR);
			this.showPercent = arParams.SHOW_DISCOUNT_PERCENT;
			this.showSkuProps = arParams.SHOW_SKU_PROPS;
			this.showSubscription = arParams.USE_SUBSCRIBE;

			if (arParams.ADD_TO_BASKET_ACTION)
			{
				this.basketAction = arParams.ADD_TO_BASKET_ACTION;
			}

			this.showClosePopup = arParams.SHOW_CLOSE_POPUP;
			this.useCompare = arParams.DISPLAY_COMPARE;
			this.fullDisplayMode = arParams.PRODUCT_DISPLAY_MODE === 'Y';
			this.bigData = arParams.BIG_DATA;
			this.viewMode = arParams.VIEW_MODE || '';
			this.templateTheme = arParams.TEMPLATE_THEME || '';
			this.useEnhancedEcommerce = arParams.USE_ENHANCED_ECOMMERCE === 'Y';
			this.dataLayerName = arParams.DATA_LAYER_NAME;
			this.brandProperty = arParams.BRAND_PROPERTY;

			this.visual = arParams.VISUAL;

			switch (this.productType)
			{
				case 0: // no catalog
				case 1: // product
				case 2: // set
				case 7: // service
					if (arParams.PRODUCT && typeof arParams.PRODUCT === 'object')
					{
						this.currentPriceMode = arParams.PRODUCT.ITEM_PRICE_MODE;
						this.currentPrices = arParams.PRODUCT.ITEM_PRICES;
						this.currentPriceSelected = arParams.PRODUCT.ITEM_PRICE_SELECTED;
						this.currentQuantityRanges = arParams.PRODUCT.ITEM_QUANTITY_RANGES;
						this.currentQuantityRangeSelected = arParams.PRODUCT.ITEM_QUANTITY_RANGE_SELECTED;

						if (this.showQuantity)
						{
							this.product.checkQuantity = arParams.PRODUCT.CHECK_QUANTITY;
							this.product.isDblQuantity = arParams.PRODUCT.QUANTITY_FLOAT;

							if (this.product.checkQuantity)
							{
								this.product.maxQuantity = (this.product.isDblQuantity ? parseFloat(arParams.PRODUCT.MAX_QUANTITY) : parseInt(arParams.PRODUCT.MAX_QUANTITY, 10));
							}

							this.product.stepQuantity = (this.product.isDblQuantity ? parseFloat(arParams.PRODUCT.STEP_QUANTITY) : parseInt(arParams.PRODUCT.STEP_QUANTITY, 10));

							this.checkQuantity = this.product.checkQuantity;
							this.isDblQuantity = this.product.isDblQuantity;
							this.stepQuantity = this.product.stepQuantity;
							this.maxQuantity = this.product.maxQuantity;
							this.minQuantity = this.currentPriceMode === 'Q'
								? parseFloat(this.currentPrices[this.currentPriceSelected].MIN_QUANTITY)
								: this.stepQuantity;

							if (this.isDblQuantity)
							{
								this.stepQuantity = Math.round(this.stepQuantity * this.precisionFactor) / this.precisionFactor;
							}
						}

						this.product.canBuy = arParams.PRODUCT.CAN_BUY;

						if (arParams.PRODUCT.MORE_PHOTO_COUNT)
						{
							this.product.morePhotoCount = arParams.PRODUCT.MORE_PHOTO_COUNT;
							this.product.morePhoto = arParams.PRODUCT.MORE_PHOTO;
						}

						if (arParams.PRODUCT.RCM_ID)
						{
							this.product.rcmId = arParams.PRODUCT.RCM_ID;
						}

						this.canBuy = this.product.canBuy;
						this.product.name = arParams.PRODUCT.NAME;
						this.product.pict = arParams.PRODUCT.PICT;
						this.product.id = arParams.PRODUCT.ID;
						this.product.DETAIL_PAGE_URL = arParams.PRODUCT.DETAIL_PAGE_URL;

						if (arParams.PRODUCT.ADD_URL)
						{
							this.product.addUrl = arParams.PRODUCT.ADD_URL;
						}

						if (arParams.PRODUCT.BUY_URL)
						{
							this.product.buyUrl = arParams.PRODUCT.BUY_URL;
						}

						if (arParams.BASKET && typeof arParams.BASKET === 'object')
						{
							this.basketData.useProps = arParams.BASKET.ADD_PROPS;
							this.basketData.emptyProps = arParams.BASKET.EMPTY_PROPS;
						}
					}
					else
					{
						this.errorCode = -1;
					}

					break;
				case 3: // sku
					if (arParams.PRODUCT && typeof arParams.PRODUCT === 'object')
					{
						this.product.name = arParams.PRODUCT.NAME;
						this.product.id = arParams.PRODUCT.ID;
						this.product.DETAIL_PAGE_URL = arParams.PRODUCT.DETAIL_PAGE_URL;
						this.product.morePhotoCount = arParams.PRODUCT.MORE_PHOTO_COUNT;
						this.product.morePhoto = arParams.PRODUCT.MORE_PHOTO;

						if (arParams.PRODUCT.RCM_ID)
						{
							this.product.rcmId = arParams.PRODUCT.RCM_ID;
						}
					}

					if (arParams.OFFERS && BX.type.isArray(arParams.OFFERS))
					{
						this.offers = arParams.OFFERS;
						this.offerNum = 0;

						if (arParams.OFFER_SELECTED)
						{
							this.offerNum = parseInt(arParams.OFFER_SELECTED, 10);
						}

						if (isNaN(this.offerNum))
						{
							this.offerNum = 0;
						}

						if (arParams.TREE_PROPS)
						{
							this.treeProps = arParams.TREE_PROPS;
						}

						if (arParams.DEFAULT_PICTURE)
						{
							this.defaultPict.pict = arParams.DEFAULT_PICTURE.PICTURE;
							this.defaultPict.secondPict = arParams.DEFAULT_PICTURE.PICTURE_SECOND;
						}
					}

					break;
				default:
					this.errorCode = -1;
			}
			if (arParams.BASKET && typeof arParams.BASKET === 'object')
			{
				if (arParams.BASKET.QUANTITY)
				{
					this.basketData.quantity = arParams.BASKET.QUANTITY;
				}

				if (arParams.BASKET.PROPS)
				{
					this.basketData.props = arParams.BASKET.PROPS;
				}

				if (arParams.BASKET.BASKET_URL)
				{
					this.basketData.basketUrl = arParams.BASKET.BASKET_URL;
				}

				if (3 === this.productType)
				{
					if (arParams.BASKET.SKU_PROPS)
					{
						this.basketData.sku_props = arParams.BASKET.SKU_PROPS;
					}
				}

				if (arParams.BASKET.ADD_URL_TEMPLATE)
				{
					this.basketData.add_url = arParams.BASKET.ADD_URL_TEMPLATE;
				}

				if (arParams.BASKET.BUY_URL_TEMPLATE)
				{
					this.basketData.buy_url = arParams.BASKET.BUY_URL_TEMPLATE;
				}

				if (this.basketData.add_url === '' && this.basketData.buy_url === '')
				{
					this.errorCode = -1024;
				}
			}

			if (this.useCompare)
			{
				if (arParams.COMPARE && typeof arParams.COMPARE === 'object')
				{
					if (arParams.COMPARE.COMPARE_PATH)
					{
						this.compareData.comparePath = arParams.COMPARE.COMPARE_PATH;
					}

					if (arParams.COMPARE.COMPARE_URL_TEMPLATE)
					{
						this.compareData.compareUrl = arParams.COMPARE.COMPARE_URL_TEMPLATE;
					}
					else
					{
						this.useCompare = false;
					}

					if (arParams.COMPARE.COMPARE_DELETE_URL_TEMPLATE)
					{
						this.compareData.compareDeleteUrl = arParams.COMPARE.COMPARE_DELETE_URL_TEMPLATE;
					}
					else
					{
						this.useCompare = false;
					}
				}
				else
				{
					this.useCompare = false;
				}
			}

			this.isFacebookConversionCustomizeProductEventEnabled
				= arParams.IS_FACEBOOK_CONVERSION_CUSTOMIZE_PRODUCT_EVENT_ENABLED
			;
		}

		if (this.errorCode === 0)
		{
			BX.ready(BX.delegate(this.init,this));
		}
	};

	window.JCCatalogItemBootstrapV4.prototype = {
		init: function()
		{
			var i = 0,
				treeItems = null;

			this.obProduct = BX(this.visual.ID);
			if (!this.obProduct)
			{
				this.errorCode = -1;
			}

			this.obPict = BX(this.visual.PICT_ID);
			if (!this.obPict)
			{
				this.errorCode = -2;
			}

			if (this.secondPict && this.visual.SECOND_PICT_ID)
			{
				this.obSecondPict = BX(this.visual.SECOND_PICT_ID);
			}

			this.obPictSlider = BX(this.visual.PICT_SLIDER_ID);
			this.obPictSliderIndicator = BX(this.visual.PICT_SLIDER_ID + '_indicator');
			this.obPictSliderProgressBar = BX(this.visual.PICT_SLIDER_ID + '_progress_bar');
			if (!this.obPictSlider)
			{
				this.errorCode = -4;
			}

			this.obPrice = BX(this.visual.PRICE_ID);
			this.obPriceOld = BX(this.visual.PRICE_OLD_ID);
			this.obPriceTotal = BX(this.visual.PRICE_TOTAL_ID);
			if (!this.obPrice)
			{
				this.errorCode = -16;
			}

			if (this.showQuantity && this.visual.QUANTITY_ID)
			{
				this.obQuantity = BX(this.visual.QUANTITY_ID);
				this.blockNodes.quantity = this.obProduct.querySelector('[data-entity="quantity-block"]');

				if (this.visual.QUANTITY_UP_ID)
				{
					this.obQuantityUp = BX(this.visual.QUANTITY_UP_ID);
				}

				if (this.visual.QUANTITY_DOWN_ID)
				{
					this.obQuantityDown = BX(this.visual.QUANTITY_DOWN_ID);
				}
			}

			if (this.visual.QUANTITY_LIMIT && this.showMaxQuantity !== 'N')
			{
				this.obQuantityLimit.all = BX(this.visual.QUANTITY_LIMIT);
				if (this.obQuantityLimit.all)
				{
					this.obQuantityLimit.value = this.obQuantityLimit.all.querySelector('[data-entity="quantity-limit-value"]');
					if (!this.obQuantityLimit.value)
					{
						this.obQuantityLimit.all = null;
					}
				}
			}

			if (this.productType === 3 && this.fullDisplayMode)
			{
				if (this.visual.TREE_ID)
				{
					this.obTree = BX(this.visual.TREE_ID);
					if (!this.obTree)
					{
						this.errorCode = -256;
					}
				}

				if (this.visual.QUANTITY_MEASURE)
				{
					this.obMeasure = BX(this.visual.QUANTITY_MEASURE);
				}
			}

			this.obBasketActions = BX(this.visual.BASKET_ACTIONS_ID);
			if (this.obBasketActions)
			{
				if (this.visual.BUY_ID)
				{
					this.obBuyBtn = BX(this.visual.BUY_ID);
				}
			}

			this.obNotAvail = BX(this.visual.NOT_AVAILABLE_MESS);

			if (this.showSubscription)
			{
				this.obSubscribe = BX(this.visual.SUBSCRIBE_ID);
			}

			if (this.showPercent)
			{
				if (this.visual.DSC_PERC)
				{
					this.obDscPerc = BX(this.visual.DSC_PERC);
				}
				if (this.secondPict && this.visual.SECOND_DSC_PERC)
				{
					this.obSecondDscPerc = BX(this.visual.SECOND_DSC_PERC);
				}
			}

			if (this.showSkuProps)
			{
				if (this.visual.DISPLAY_PROP_DIV)
				{
					this.obSkuProps = BX(this.visual.DISPLAY_PROP_DIV);
				}
			}

			if (this.errorCode === 0)
			{
				// product slider events
				if (this.isTouchDevice)
				{
					BX.bind(this.obPictSlider, 'touchstart', BX.proxy(this.touchStartEvent, this));
					BX.bind(this.obPictSlider, 'touchend', BX.proxy(this.touchEndEvent, this));
					BX.bind(this.obPictSlider, 'touchcancel', BX.proxy(this.touchEndEvent, this));

					// A touch card is never collapsed and so never calls expand(), where the walk over the
					// values is built. Without it a keyboard on a tablet has no way into the radiogroup.
					if (this.viewMode === 'CARD')
					{
						this.createSkuZones();
					}
				}
				else
				{
					if (this.viewMode === 'CARD')
					{
						// product expand events
						BX.bind(this.obProduct, 'mouseenter', BX.proxy(this.onPointerEnter, this));
						BX.bind(this.obProduct, 'mousemove', BX.proxy(this.onPointerMove, this));
						BX.bind(this.obProduct, 'mouseleave', BX.proxy(this.onPointerLeave, this));
						BX.bind(this.obProduct, 'focusin', BX.proxy(this.onCardFocusIn, this));
						BX.bind(this.obProduct, 'focusout', BX.proxy(this.onCardFocusOut, this));
						BX.bind(this.obProduct, 'keydown', BX.proxy(this.onCardKeyDown, this));
						liveCards().push(this);
						bindListKeys();
						bindPointer();

						this.createDotsZone();
					}

					// product slider events
					BX.bind(this.obProduct, 'mouseenter', BX.proxy(this.cycleSlider, this));
					BX.bind(this.obProduct, 'mouseleave', BX.proxy(this.stopSlider, this));
				}

				if (this.bigData)
				{
					var links = BX.findChildren(this.obProduct, {tag:'a'}, true);
					if (links)
					{
						for (i in links)
						{
							if (links.hasOwnProperty(i))
							{
								if (links[i].getAttribute('href') == this.product.DETAIL_PAGE_URL)
								{
									BX.bind(links[i], 'click', BX.proxy(this.rememberProductRecommendation, this));
								}
							}
						}
					}
				}

				if (this.showQuantity)
				{
					var startEventName = this.isTouchDevice ? 'touchstart' : 'mousedown';
					var endEventName = this.isTouchDevice ? 'touchend' : 'mouseup';

					if (this.obQuantityUp)
					{
						BX.bind(this.obQuantityUp, startEventName, BX.proxy(this.startQuantityInterval, this));
						BX.bind(this.obQuantityUp, endEventName, BX.proxy(this.clearQuantityInterval, this));
						BX.bind(this.obQuantityUp, 'mouseout', BX.proxy(this.clearQuantityInterval, this));
						BX.bind(this.obQuantityUp, 'click', BX.delegate(this.quantityUp, this));
					}

					if (this.obQuantityDown)
					{
						BX.bind(this.obQuantityDown, startEventName, BX.proxy(this.startQuantityInterval, this));
						BX.bind(this.obQuantityDown, endEventName, BX.proxy(this.clearQuantityInterval, this));
						BX.bind(this.obQuantityDown, 'mouseout', BX.proxy(this.clearQuantityInterval, this));
						BX.bind(this.obQuantityDown, 'click', BX.delegate(this.quantityDown, this));
					}

					if (this.obQuantity)
					{
						BX.bind(this.obQuantity, 'change', BX.delegate(this.quantityChange, this));
					}
				}

				switch (this.productType)
				{
					case 0: // no catalog
					case 1: // product
					case 2: // set
					case 7: // service
						if (parseInt(this.product.morePhotoCount) > 1 && this.obPictSlider)
						{
							this.initializeSlider();
						}

						this.checkQuantityControls();

						break;
					case 3: // sku
						if (this.offers.length > 0 && this.obTree)
						{
							treeItems = BX.findChildren(this.obTree, {tagName: 'li'}, true);

							if (treeItems && treeItems.length)
							{
								for (i = 0; i < treeItems.length; i++)
								{
									BX.bind(treeItems[i], 'click', BX.delegate(this.selectOfferProp, this));

									if (this.viewMode === 'CARD')
									{
										BX.bind(treeItems[i], 'keydown', BX.delegate(this.selectOfferPropByKey, this));
									}
								}
							}

							this.setCurrent();
						}
						else if (parseInt(this.product.morePhotoCount) > 1 && this.obPictSlider)
						{
							this.initializeSlider();
						}

						break;
				}

				if (this.obBuyBtn)
				{
					if (this.basketAction === 'ADD')
					{
						BX.bind(this.obBuyBtn, 'click', BX.proxy(this.add2Basket, this));
					}
					else
					{
						BX.bind(this.obBuyBtn, 'click', BX.proxy(this.buyBasket, this));
					}
				}

				if (this.useCompare)
				{
					this.obCompare = BX(this.visual.COMPARE_LINK_ID);
					if (this.obCompare)
					{
						BX.bind(this.obCompare, 'click', BX.proxy(this.compare, this));
					}

					BX.addCustomEvent('onCatalogDeleteCompare', BX.proxy(this.checkDeletedCompare, this));
				}
			}
		},

		setAnalyticsDataLayer: function(action)
		{
			if (!this.useEnhancedEcommerce || !this.dataLayerName)
				return;

			var item = {},
				info = {},
				variants = [],
				i, k, j, propId, skuId, propValues;

			switch (this.productType)
			{
				case 0: //no catalog
				case 1: //product
				case 2: //set
				case 7: // service
					item = {
						'id': this.product.id,
						'name': this.product.name,
						'price': this.currentPrices[this.currentPriceSelected] && this.currentPrices[this.currentPriceSelected].PRICE,
						'brand': BX.type.isArray(this.brandProperty) ? this.brandProperty.join('/') : this.brandProperty
					};
					break;
				case 3: //sku
					for (i in this.offers[this.offerNum].TREE)
					{
						if (this.offers[this.offerNum].TREE.hasOwnProperty(i))
						{
							propId = i.substring(5);
							skuId = this.offers[this.offerNum].TREE[i];

							for (k in this.treeProps)
							{
								if (this.treeProps.hasOwnProperty(k) && this.treeProps[k].ID == propId)
								{
									for (j in this.treeProps[k].VALUES)
									{
										propValues = this.treeProps[k].VALUES[j];
										if (propValues.ID == skuId)
										{
											variants.push(propValues.NAME);
											break;
										}
									}

								}
							}
						}
					}

					item = {
						'id': this.offers[this.offerNum].ID,
						'name': this.offers[this.offerNum].NAME,
						'price': this.currentPrices[this.currentPriceSelected] && this.currentPrices[this.currentPriceSelected].PRICE,
						'brand': BX.type.isArray(this.brandProperty) ? this.brandProperty.join('/') : this.brandProperty,
						'variant': variants.join('/')
					};
					break;
			}

			switch (action)
			{
				case 'addToCart':
					info = {
						'ecommerce': {
							'currencyCode': this.currentPrices[this.currentPriceSelected] && this.currentPrices[this.currentPriceSelected].CURRENCY || '',
							'add': {
								'products': [{
									'name': item.name || '',
									'id': item.id || '',
									'price': item.price || 0,
									'brand': item.brand || '',
									'category': item.category || '',
									'variant': item.variant || '',
									'quantity': this.showQuantity && this.obQuantity ? this.obQuantity.value : 1
								}]
							}
						}
					};
					break;
			}

			window[this.dataLayerName] = window[this.dataLayerName] || [];
			window[this.dataLayerName].push(info);
		},

		onPointerEnter: function(event)
		{
			var moved = pointerMoved(event);

			this.pointerInside = true;

			// Opening a card under a still pointer while the keyboard is inside the list would take the
			// visitor's place in the walk away from them.
			if (moved || !cardHoldsFocus())
			{
				openOneCard(this);
			}
		},

		// A card the keyboard closed under a still pointer gets no new enter, so a move reopens it.
		onPointerMove: function(event)
		{
			var moved = pointerMoved(event);

			if (moved && this.pointerInside && !BX.hasClass(this.obProduct, 'hover'))
			{
				openOneCard(this);
			}
		},

		onPointerLeave: function()
		{
			this.pointerInside = false;

			if (!this.focusInside)
			{
				this.collapse();
			}
		},

		onCardFocusIn: function(event)
		{
			if (this.focusInside || !BX.getEventTarget(event).matches(':focus-visible'))
				return;

			this.focusInside = true;
			this.stopSliderByUser();
			openOneCard(this);
		},

		onCardFocusOut: function(event)
		{
			var next = event.relatedTarget;

			if (next && (this.obProduct.contains(next) || this.popupContains(next)))
				return;

			this.focusInside = false;

			if (!this.pointerInside)
			{
				this.collapse();
			}
		},

		onCardKeyDown: function(event)
		{
			if (event.key !== 'Tab' || !event.shiftKey || !this.isFirstStop(BX.getEventTarget(event)))
			{
				return;
			}

			var previous = previousCardOf(this);

			if (previous)
			{
				previous.expand();
			}
		},

		// The first stop of the card: the strip of the dots stands before the name in the markup, and a
		// product with no page to link at leaves the card itself as the stop.
		isFirstStop: function(node)
		{
			var accessibility = getAccessibility();

			if (!BX.type.isElementNode(node) || !accessibility)
			{
				return false;
			}

			if (node === this.obProduct)
			{
				return true;
			}

			return accessibility.FocusNavigator.getFirst(this.obProduct, {tabbableOnly: true}) === node;
		},

		// the popup traps focus outside the card, yet the card must stay expanded
		popupContains: function(node)
		{
			return !!this.obPopupWin && this.obPopupWin.getPopupContainer().contains(node);
		},

		// The controls leave the keyboard path with the card that closes, and a focus left on one of
		// them falls back to the top of the page. The name is a stop the card keeps either way.
		keepStopOfFocus: function()
		{
			var active = document.activeElement;

			if (!active || active === this.obProduct || !this.obProduct.contains(active))
			{
				return;
			}

			var stop = this.obProduct.querySelector('h3.product-item-title a')
				|| (this.obProduct.hasAttribute('tabindex') ? this.obProduct : null)
			;

			if (stop && stop !== active)
			{
				stop.focus({preventScroll: true});
			}
		},

		expand: function()
		{
			if (BX.hasClass(this.obProduct, 'hover'))
				return;

			clearTimeout(this.hoverTimer);
			this.obProduct.style.height = getComputedStyle(this.obProduct).height;
			BX.addClass(this.obProduct, 'hover');
			this.showDotsZone();
			this.createSkuZones();
		},

		collapse: function()
		{
			if (!BX.hasClass(this.obProduct, 'hover'))
				return;

			this.keepStopOfFocus();
			BX.removeClass(this.obProduct, 'hover');
			this.hideDotsZone();
			this.hoverTimer = setTimeout(
				BX.delegate(function(){
					this.obProduct.style.height = 'auto';
				}, this),
				300
			);
		},

		getCookie: function(name)
		{
			var matches = document.cookie.match(new RegExp(
				"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
			));

			return matches ? decodeURIComponent(matches[1]) : null;
		},

		rememberProductRecommendation: function()
		{
			// save to RCM_PRODUCT_LOG
			var cookieName = BX.cookie_prefix + '_RCM_PRODUCT_LOG',
				cookie = this.getCookie(cookieName),
				itemFound = false;

			var cItems = [],
				cItem;

			if (cookie)
			{
				cItems = cookie.split('.');
			}

			var i = cItems.length;

			while (i--)
			{
				cItem = cItems[i].split('-');

				if (cItem[0] == this.product.id)
				{
					// it's already in recommendations, update the date
					cItem = cItems[i].split('-');

					// update rcmId and date
					cItem[1] = this.product.rcmId;
					cItem[2] = BX.current_server_time;

					cItems[i] = cItem.join('-');
					itemFound = true;
				}
				else
				{
					if ((BX.current_server_time - cItem[2]) > 3600 * 24 * 30)
					{
						cItems.splice(i, 1);
					}
				}
			}

			if (!itemFound)
			{
				// add recommendation
				cItems.push([this.product.id, this.product.rcmId, BX.current_server_time].join('-'));
			}

			// serialize
			var plNewCookie = cItems.join('.'),
				cookieDate = new Date(new Date().getTime() + 1000 * 3600 * 24 * 365 * 10).toUTCString();

			document.cookie = cookieName + "=" + plNewCookie + "; path=/; expires=" + cookieDate + "; domain=" + BX.cookie_domain;
		},

		isQuantityControlDisabled: function(control)
		{
			return !!control && control.getAttribute('aria-disabled') === 'true';
		},

		startQuantityInterval: function()
		{
			var target = BX.proxy_context;
			if (this.isQuantityControlDisabled(target))
				return;

			var func = target.id === this.visual.QUANTITY_DOWN_ID
				? BX.proxy(this.quantityDown, this)
				: BX.proxy(this.quantityUp, this);

			this.quantityDelay = setTimeout(
				BX.delegate(function() {
					this.quantityTimer = setInterval(func, 150);
				}, this),
				300
			);
		},

		clearQuantityInterval: function()
		{
			clearTimeout(this.quantityDelay);
			clearInterval(this.quantityTimer);
		},

		quantityUp: function()
		{
			if (this.isQuantityControlDisabled(this.obQuantityUp))
				return;

			var curValue = 0,
				boolSet = true;

			if (this.errorCode === 0 && this.showQuantity && this.canBuy)
			{
				curValue = (this.isDblQuantity ? parseFloat(this.obQuantity.value) : parseInt(this.obQuantity.value, 10));
				if (!isNaN(curValue))
				{
					curValue += this.stepQuantity;
					if (this.checkQuantity)
					{
						if (curValue > this.maxQuantity)
						{
							boolSet = false;
						}
					}

					if (boolSet)
					{
						if (this.isDblQuantity)
						{
							curValue = Math.round(curValue * this.precisionFactor) / this.precisionFactor;
						}

						this.obQuantity.value = curValue;

						this.setPrice();
					}
				}
			}

			this.scheduleTotalAnnounce();
		},

		quantityDown: function()
		{
			if (this.isQuantityControlDisabled(this.obQuantityDown))
				return;

			var curValue = 0,
				boolSet = true;

			if (this.errorCode === 0 && this.showQuantity && this.canBuy)
			{
				curValue = (this.isDblQuantity ? parseFloat(this.obQuantity.value) : parseInt(this.obQuantity.value, 10));
				if (!isNaN(curValue))
				{
					curValue -= this.stepQuantity;

					this.checkPriceRange(curValue);

					if (curValue < this.minQuantity)
					{
						boolSet = false;
					}

					if (boolSet)
					{
						if (this.isDblQuantity)
						{
							curValue = Math.round(curValue * this.precisionFactor) / this.precisionFactor;
						}

						this.obQuantity.value = curValue;

						this.setPrice();
					}
				}
			}

			this.scheduleTotalAnnounce();
		},

		quantityChange: function()
		{
			var curValue = 0,
				intCount;

			if (this.errorCode === 0 && this.showQuantity)
			{
				if (this.canBuy)
				{
					curValue = this.isDblQuantity ? parseFloat(this.obQuantity.value) : Math.round(this.obQuantity.value);
					if (!isNaN(curValue))
					{
						if (this.checkQuantity)
						{
							if (curValue > this.maxQuantity)
							{
								curValue = this.maxQuantity;
							}
						}

						this.checkPriceRange(curValue);

						intCount = Math.floor(
							Math.round(curValue * this.precisionFactor / this.stepQuantity) / this.precisionFactor
						) || 1;
						curValue = (intCount <= 1 ? this.stepQuantity : intCount * this.stepQuantity);
						curValue = Math.round(curValue * this.precisionFactor) / this.precisionFactor;

						if (curValue < this.minQuantity)
						{
							curValue = this.minQuantity;
						}

						this.obQuantity.value = curValue;
					}
					else
					{
						this.obQuantity.value = this.minQuantity;
					}
				}
				else
				{
					this.obQuantity.value = this.minQuantity;
				}

				this.setPrice();
			}

			this.scheduleTotalAnnounce();
		},

		// Every step puts the announcement off again, so a series of them ends in a single sum.
		scheduleTotalAnnounce: function()
		{
			if (this.viewMode !== 'CARD')
			{
				return;
			}

			clearTimeout(this.totalAnnounceTimer);
			this.totalAnnounceTimer = setTimeout(
				BX.delegate(this.announceTotal, this),
				TOTAL_ANNOUNCE_DELAY
			);
		},

		// The sum is read back from the visible node, where the browser has already decoded the currency
		// template; an empty one means the card shows the price of a single item, and the quantity leads.
		announceTotal: function()
		{
			this.totalAnnounceTimer = null;

			var text = this.obPriceTotal && this.obPriceTotal.style.display !== 'none'
				? textOf(this.obPriceTotal)
				: '';

			var said = [this.spokenQuantity(), text === '' ? textOf(this.obPrice) : text];

			this.announce(said.filter(function(part) { return part !== ''; }).join('. '));
		},

		// The unit is found next to the sum: a card without variants carries no id of that node.
		spokenQuantity: function()
		{
			if (!this.obQuantity)
			{
				return '';
			}

			var measure = this.obMeasure
				|| (this.obPriceTotal ? this.obPriceTotal.previousElementSibling : null)
			;

			return fillTemplate(BX.message('CT_BCI_TPL_MESS_QUANTITY_CHANGED_ARIA') || '', {
				'#QUANTITY#': this.obQuantity.value,
				'#MEASURE#': textOf(measure)
			}).replace(/\s+/g, ' ').trim();
		},

		announce: function(text)
		{
			var accessibility = getAccessibility();

			if (!accessibility || text === '')
			{
				return;
			}

			accessibility.LiveAnnouncer.announce(text);
		},

		quantitySet: function(index)
		{
			var resetQuantity, strLimit;

			var newOffer = this.offers[index],
				oldOffer = this.offers[this.offerNum];

			if (this.errorCode === 0)
			{
				this.canBuy = newOffer.CAN_BUY;

				this.currentPriceMode = newOffer.ITEM_PRICE_MODE;
				this.currentPrices = newOffer.ITEM_PRICES;
				this.currentPriceSelected = newOffer.ITEM_PRICE_SELECTED;
				this.currentQuantityRanges = newOffer.ITEM_QUANTITY_RANGES;
				this.currentQuantityRangeSelected = newOffer.ITEM_QUANTITY_RANGE_SELECTED;

				if (this.canBuy)
				{
					if (this.blockNodes.quantity)
					{
						BX.style(this.blockNodes.quantity, 'display', '');
					}

					if (this.obBasketActions)
					{
						BX.style(this.obBasketActions, 'display', '');
					}

					if (this.obNotAvail)
					{
						BX.style(this.obNotAvail, 'display', 'none');
					}

					if (this.obSubscribe)
					{
						BX.style(this.obSubscribe, 'display', 'none');
					}
				}
				else
				{
					if (this.blockNodes.quantity)
					{
						BX.style(this.blockNodes.quantity, 'display', 'none');
					}

					if (this.obBasketActions)
					{
						BX.style(this.obBasketActions, 'display', 'none');
					}

					if (this.obNotAvail)
					{
						BX.style(this.obNotAvail, 'display', '');
					}

					if (this.obSubscribe)
					{
						if (newOffer.CATALOG_SUBSCRIBE === 'Y')
						{
							BX.style(this.obSubscribe, 'display', '');
							this.obSubscribe.setAttribute('data-item', newOffer.ID);
							BX(this.visual.SUBSCRIBE_ID + '_hidden').click();
						}
						else
						{
							BX.style(this.obSubscribe, 'display', 'none');
						}
					}
				}

				this.isDblQuantity = newOffer.QUANTITY_FLOAT;
				this.checkQuantity = newOffer.CHECK_QUANTITY;

				if (this.isDblQuantity)
				{
					this.stepQuantity = Math.round(parseFloat(newOffer.STEP_QUANTITY) * this.precisionFactor) / this.precisionFactor;
					this.maxQuantity = parseFloat(newOffer.MAX_QUANTITY);
					this.minQuantity = this.currentPriceMode === 'Q' ? parseFloat(this.currentPrices[this.currentPriceSelected].MIN_QUANTITY) : this.stepQuantity;
				}
				else
				{
					this.stepQuantity = parseInt(newOffer.STEP_QUANTITY, 10);
					this.maxQuantity = parseInt(newOffer.MAX_QUANTITY, 10);
					this.minQuantity = this.currentPriceMode === 'Q' ? parseInt(this.currentPrices[this.currentPriceSelected].MIN_QUANTITY) : this.stepQuantity;
				}

				if (this.showQuantity)
				{
					var isDifferentMinQuantity = oldOffer.ITEM_PRICES.length
						&& oldOffer.ITEM_PRICES[oldOffer.ITEM_PRICE_SELECTED]
						&& oldOffer.ITEM_PRICES[oldOffer.ITEM_PRICE_SELECTED].MIN_QUANTITY != this.minQuantity;

					if (this.isDblQuantity)
					{
						resetQuantity = Math.round(parseFloat(oldOffer.STEP_QUANTITY) * this.precisionFactor) / this.precisionFactor !== this.stepQuantity
							|| isDifferentMinQuantity
							|| oldOffer.MEASURE !== newOffer.MEASURE
							|| (
								this.checkQuantity
								&& parseFloat(oldOffer.MAX_QUANTITY) > this.maxQuantity
								&& parseFloat(this.obQuantity.value) > this.maxQuantity
							);
					}
					else
					{
						resetQuantity = parseInt(oldOffer.STEP_QUANTITY, 10) !== this.stepQuantity
							|| isDifferentMinQuantity
							|| oldOffer.MEASURE !== newOffer.MEASURE
							|| (
								this.checkQuantity
								&& parseInt(oldOffer.MAX_QUANTITY, 10) > this.maxQuantity
								&& parseInt(this.obQuantity.value, 10) > this.maxQuantity
							);
					}

					this.obQuantity.disabled = !this.canBuy;

					if (resetQuantity)
					{
						this.obQuantity.value = this.minQuantity;
					}

					if (this.obMeasure)
					{
						if (newOffer.MEASURE)
						{
							BX.adjust(this.obMeasure, {html: newOffer.MEASURE});
						}
						else
						{
							BX.adjust(this.obMeasure, {html: ''});
						}
					}
				}

				if (this.obQuantityLimit.all)
				{
					if (!this.checkQuantity || this.maxQuantity == 0)
					{
						BX.adjust(this.obQuantityLimit.value, {html: ''});
						BX.adjust(this.obQuantityLimit.all, {style: {display: 'none'}});
					}
					else
					{
						if (this.showMaxQuantity === 'M')
						{
							strLimit = (this.maxQuantity / this.stepQuantity >= this.relativeQuantityFactor)
								? BX.message('RELATIVE_QUANTITY_MANY')
								: BX.message('RELATIVE_QUANTITY_FEW');
						}
						else
						{
							strLimit = this.maxQuantity;

							if (newOffer.MEASURE)
							{
								strLimit += (' ' + newOffer.MEASURE);
							}
						}

						BX.adjust(this.obQuantityLimit.value, {html: strLimit});
						BX.adjust(this.obQuantityLimit.all, {style: {display: ''}});
					}
				}
			}
		},

		initializeSlider: function()
		{
			var wrap = this.obPictSlider.getAttribute('data-slider-wrap');
			if (wrap)
			{
				this.slider.options.wrap = wrap === 'true';
			}
			else
			{
				this.slider.options.wrap = this.defaultSliderOptions.wrap;
			}

			if (this.isTouchDevice)
			{
				this.slider.options.interval = false;
			}
			else
			{
				this.slider.options.interval = parseInt(this.obPictSlider.getAttribute('data-slider-interval')) || this.defaultSliderOptions.interval;
				// slider interval must be more than 700ms because of css transitions
				if (this.slider.options.interval < 700)
				{
					this.slider.options.interval = 700;
				}

				if (this.obPictSliderIndicator)
				{
					var controls = this.obPictSliderIndicator.querySelectorAll('[data-go-to]');
					for (var i in controls)
					{
						if (controls.hasOwnProperty(i))
						{
							BX.bind(controls[i], 'click', BX.proxy(this.sliderClickHandler, this));
						}
					}
				}

				if (this.obPictSliderProgressBar)
				{
					if (this.slider.progress)
					{
						this.resetProgress();
						this.cycleSlider();
					}
					else
					{
						this.slider.progress = new BX.easing({
							transition: BX.easing.transitions.linear,
							step: BX.delegate(function(state){
								this.obPictSliderProgressBar.style.width = state.width / 10 + '%';
							}, this)
						});
					}
				}
			}
		},

		createDotsZone: function()
		{
			var accessibility = getAccessibility();

			if (this.dotsFocusZone || !accessibility || !BX.type.isElementNode(this.obPictSliderIndicator))
			{
				return;
			}

			var keys = accessibility.FocusKeys;

			this.dotsFocusZone = new accessibility.FocusZone(this.obPictSliderIndicator, {
				bindKeys: keys.ArrowHorizontal | keys.ArrowVertical | keys.HomeAndEnd,
				focusOutBehavior: 'wrap',
				focusInStrategy: BX.delegate(this.getDotsTabStop, this),
				getNextFocusable: BX.delegate(this.getNextDot, this)
			});
		},

		getDotsTabStop: function()
		{
			if (!BX.type.isElementNode(this.obPictSliderIndicator))
			{
				return null;
			}

			return this.obPictSliderIndicator.querySelector('[data-go-to].active')
				|| this.obPictSliderIndicator.querySelector('[data-go-to]');
		},

		// The photo is brought up along the way, so the dot the zone focuses is switched as by a click.
		getNextDot: function(direction, from)
		{
			var accessibility = getAccessibility();

			if (!accessibility || !BX.type.isElementNode(this.obPictSliderIndicator))
			{
				return null;
			}

			var navigator = accessibility.FocusNavigator;
			var options = {from: from || undefined, tabbableOnly: false, wrap: true};
			var nextDot;

			switch (direction)
			{
				case 'previous':
					nextDot = navigator.getPrevious(this.obPictSliderIndicator, options);
					break;
				case 'next':
					nextDot = navigator.getNext(this.obPictSliderIndicator, options);
					break;
				case 'start':
					nextDot = navigator.getFirst(this.obPictSliderIndicator, options);
					break;
				default:
					nextDot = navigator.getLast(this.obPictSliderIndicator, options);
					break;
			}

			this.slideToControl(nextDot);

			return nextDot;
		},

		// The strip is hidden inline while the offer has a single photo.
		isDotsZoneVisible: function()
		{
			return BX.type.isElementNode(this.obPictSliderIndicator)
				&& this.obPictSliderIndicator.style.display !== 'none';
		},

		showDotsZone: function()
		{
			if (!this.dotsFocusZone)
			{
				return;
			}

			this.obPictSliderIndicator.removeAttribute('aria-hidden');
			this.dotsFadeAttempts = 0;
			this.waitForDotsShown();
		},

		hideDotsZone: function()
		{
			if (!this.dotsFocusZone)
			{
				return;
			}

			this.stopWaitingForDots();
			this.deactivateDotsZone();
			this.obPictSliderIndicator.setAttribute('aria-hidden', 'true');
		},

		waitForDotsShown: function()
		{
			if (this.dotsFadeHandler || this.dotsFadeAttempts >= DOTS_FADE_ATTEMPTS)
			{
				return;
			}

			this.dotsFadeAttempts++;

			this.dotsFadeHandler = BX.delegate(function(event){
				if (event.target !== this.obPictSliderIndicator || event.propertyName !== 'opacity')
				{
					return;
				}

				this.onDotsShown();
			}, this);

			BX.bind(this.obPictSliderIndicator, 'transitionend', this.dotsFadeHandler);
			this.dotsFadeTimer = setTimeout(BX.delegate(this.onDotsShown, this), DOTS_FADE_TIMEOUT);
		},

		onDotsShown: function()
		{
			this.stopWaitingForDots();
			this.activateDotsZone();
		},

		stopWaitingForDots: function()
		{
			if (this.dotsFadeHandler)
			{
				BX.unbind(this.obPictSliderIndicator, 'transitionend', this.dotsFadeHandler);
				this.dotsFadeHandler = null;
			}

			clearTimeout(this.dotsFadeTimer);
			this.dotsFadeTimer = null;
		},

		activateDotsZone: function()
		{
			var expanded = BX.hasClass(this.obProduct, 'hover');

			if (!this.dotsFocusZone || this.dotsFocusZone.isActive() || !this.isDotsZoneVisible() || !expanded)
			{
				return;
			}

			this.dotsFocusZone.activate();

			// A strip still at the start of its fade lets no dot through, so the zone waits it out.
			if (!this.dotsFocusZone.getCurrentFocusedElement())
			{
				this.dotsFocusZone.deactivate();
				this.waitForDotsShown();
			}
		},

		deactivateDotsZone: function()
		{
			if (this.dotsFocusZone && this.dotsFocusZone.isActive())
			{
				this.dotsFocusZone.deactivate();
			}
		},

		// A collapsed card holds the values at display: none, so the zones wait for its first opening.
		createSkuZones: function()
		{
			var accessibility = getAccessibility();

			if (this.skuFocusZones || this.viewMode !== 'CARD' || !accessibility || !this.obTree)
			{
				return;
			}

			var lists = this.obTree.querySelectorAll('[data-entity="sku-line-block"] ul');
			var zones = [];

			for (var i = 0; i < lists.length; i++)
			{
				zones.push(this.createSkuZone(accessibility, lists[i]));
			}

			// The zones are built once, so an empty group here would leave the arrows dead ever after.
			if (!this.areSkuZonesFilled(zones))
			{
				this.dropSkuZones(zones);
				this.waitForSkuValuesShown();

				return;
			}

			this.skuFocusZones = zones;
		},

		areSkuZonesFilled: function(zones)
		{
			for (var i = 0; i < zones.length; i++)
			{
				if (!zones[i].getCurrentFocusedElement())
				{
					return false;
				}
			}

			return true;
		},

		dropSkuZones: function(zones)
		{
			for (var i = 0; i < zones.length; i++)
			{
				zones[i].deactivate();
			}
		},

		waitForSkuValuesShown: function()
		{
			if (this.skuFadeTimer || this.skuFadeAttempts >= SKU_FADE_ATTEMPTS)
			{
				return;
			}

			this.skuFadeAttempts++;
			this.skuFadeTimer = setTimeout(
				BX.delegate(function(){
					this.skuFadeTimer = null;

					if (this.isTouchDevice || BX.hasClass(this.obProduct, 'hover'))
					{
						this.createSkuZones();
					}
				}, this),
				SKU_FADE_TIMEOUT
			);
		},

		createSkuZone: function(accessibility, list)
		{
			var keys = accessibility.FocusKeys;
			var zone = new accessibility.FocusZone(list, {
				bindKeys: keys.ArrowHorizontal | keys.ArrowVertical | keys.HomeAndEnd,
				focusOutBehavior: 'wrap',
				focusInStrategy: function() {
					return getSkuTabStop(list);
				}
			});

			zone.activate();

			return zone;
		},

		// The zone watches attributes and children; a value ruled out by the tree changes neither.
		refreshSkuZone: function(intNumber)
		{
			if (this.skuFocusZones && this.skuFocusZones[intNumber])
			{
				this.skuFocusZones[intNumber].refreshElements();
			}
		},

		setSkuChecked: function(value, checked)
		{
			if (this.viewMode === 'CARD')
			{
				value.setAttribute('aria-checked', (checked ? 'true' : 'false'));
			}
		},

		// Not the native attribute: a disabled value would drop out of the arrow walk of the group.
		setSkuUnavailable: function(value, unavailable)
		{
			if (this.viewMode !== 'CARD')
			{
				return;
			}

			if (unavailable)
			{
				value.setAttribute('aria-disabled', 'true');
			}
			else
			{
				value.removeAttribute('aria-disabled');
			}
		},

		// The browser computes no position in a set for a role written by hand.
		updateSkuPositions: function(rowItems)
		{
			if (this.viewMode !== 'CARD')
			{
				return;
			}

			var visible = [],
				i;

			for (i = 0; i < rowItems.length; i++)
			{
				if (rowItems[i].style.display !== 'none')
				{
					visible.push(rowItems[i]);
				}
			}

			for (i = 0; i < visible.length; i++)
			{
				visible[i].setAttribute('aria-setsize', visible.length);
				visible[i].setAttribute('aria-posinset', i + 1);
			}
		},

		// A rebuilt strip keeps its container, so only the set the zone manages changes.
		syncDotsZone: function()
		{
			if (!this.dotsFocusZone)
			{
				return;
			}

			if (!this.isDotsZoneVisible())
			{
				this.stopWaitingForDots();
				this.deactivateDotsZone();

				return;
			}

			if (!BX.hasClass(this.obProduct, 'hover'))
			{
				return;
			}

			if (this.dotsFocusZone.isActive())
			{
				this.dotsFocusZone.refreshElements();
			}
			else
			{
				this.waitForDotsShown();
			}
		},

		createSliderControl: function(index, total)
		{
			var selected = parseInt(index, 10) === 0;
			var className = 'product-item-image-slider-control' + (selected ? ' active' : '');

			if (this.viewMode !== 'CARD')
			{
				return BX.create('DIV', {
					attrs: {'data-go-to': index, 'data-testid': 'catalog-item-gallery-dot'},
					props: {className: className}
				});
			}

			return BX.create('BUTTON', {
				attrs: {
					'type': 'button',
					'data-go-to': index,
					'tabindex': '-1',
					'aria-pressed': (selected ? 'true' : 'false'),
					'aria-label': this.getDotAriaLabel(index, total),
					'data-testid': 'catalog-item-gallery-dot'
				},
				props: {className: className}
			});
		},

		// The position of a dot lives in its name only: aria-posinset is not allowed on a button.
		getDotAriaLabel: function(index, total)
		{
			return fillTemplate(BX.message('CT_BCI_TPL_MESS_GALLERY_DOT_ARIA') || '', {
				'#NUM#': parseInt(index, 10) + 1,
				'#TOTAL#': total
			});
		},

		setDotPressed: function(dot, pressed)
		{
			if (this.viewMode !== 'CARD' || !BX.type.isElementNode(dot))
			{
				return;
			}

			dot.setAttribute('aria-pressed', (pressed ? 'true' : 'false'));
		},

		checkTouch: function(event)
		{
			if (!event || !event.changedTouches)
				return false;

			return event.changedTouches[0].identifier === this.touch.identifier;
		},

		touchStartEvent: function(event)
		{
			if (event.touches.length != 1)
				return;

			this.touch = event.changedTouches[0];
		},

		touchEndEvent: function(event)
		{
			if (!this.checkTouch(event))
				return;

			var deltaX = this.touch.pageX - event.changedTouches[0].pageX,
				deltaY = this.touch.pageY - event.changedTouches[0].pageY;

			if (Math.abs(deltaX) >= Math.abs(deltaY) + 10)
			{
				if (deltaX > 0)
				{
					this.announceSlide('next');
					this.slideNext();
				}

				if (deltaX < 0)
				{
					this.announceSlide('prev');
					this.slidePrev();
				}
			}
		},

		// A swipe leaves the focus where it was, so the frame it brings up is spoken by us; a tap on a
		// dot is not, the reader says the name and state of the dot itself.
		announceSlide: function(direction)
		{
			if (this.viewMode !== 'CARD' || !this.obPictSlider)
			{
				return;
			}

			var active = BX.findChild(this.obPictSlider, {className: 'item active'}, true, false);
			if (!active)
			{
				return;
			}

			var next = this.getItemForDirection(direction, active);

			this.announce(this.getDotAriaLabel(this.getItemIndex(next), this.slider.items.length));
		},

		sliderClickHandler: function(event)
		{
			this.slideToControl(BX.getEventTarget(event));

			BX.PreventDefault(event);
		},

		// slideTo turns down frames while one is playing, so the last one asked for is kept for the end.
		slideToControl: function(control)
		{
			var slideIndex = BX.type.isElementNode(control) ? control.getAttribute('data-go-to') : null;

			if (slideIndex)
			{
				this.slider.requestedSlide = this.slider.sliding ? slideIndex : null;
				this.slideTo(slideIndex);
			}

			this.stopSliderByUser();
		},

		playRequestedSlide: function()
		{
			var requested = this.slider.requestedSlide;

			if (requested === null)
			{
				return;
			}

			this.slider.requestedSlide = null;
			this.slideTo(requested);
		},

		slideNext: function()
		{
			if (this.slider.sliding)
				return;

			return this.slide('next');
		},

		slidePrev: function()
		{
			if (this.slider.sliding)
				return;

			return this.slide('prev');
		},

		slideTo: function(pos)
		{
			this.slider.active = BX.findChild(this.obPictSlider, {className: 'item active'}, true, false);
			this.slider.progress && (this.slider.interval = true);

			var activeIndex = this.getItemIndex(this.slider.active);

			if (pos > (this.slider.items.length - 1) || pos < 0)
				return;

			if (this.slider.sliding)
				return false;

			if (activeIndex == pos)
			{
				this.stopSlider();
				this.cycleSlider();
				return;
			}

			return this.slide(pos > activeIndex ? 'next' : 'prev', this.eq(this.slider.items, pos));
		},

		slide: function(type, next)
		{
			var active = BX.findChild(this.obPictSlider, {className: 'item active'}, true, false),
				isCycling = this.slider.interval,
				direction = type === 'next' ? 'left' : 'right';

			next = next || this.getItemForDirection(type, active);

			if (BX.hasClass(next, 'active'))
			{
				return (this.slider.sliding = false);
			}

			this.slider.sliding = true;

			isCycling && this.stopSlider();

			if (this.obPictSliderIndicator)
			{
				var activeIndicator = this.obPictSliderIndicator.querySelector('.active');
				BX.removeClass(activeIndicator, 'active');
				this.setDotPressed(activeIndicator, false);

				var nextIndicator = this.obPictSliderIndicator.querySelectorAll('[data-go-to]')[this.getItemIndex(next)];
				if (nextIndicator)
				{
					BX.addClass(nextIndicator, 'active');
					this.setDotPressed(nextIndicator, true);
				}
			}

			if (BX.hasClass(this.obPictSlider, 'slide') && !BX.browser.IsIE())
			{
				var self = this;
				BX.addClass(next, type);
				next.offsetWidth; // force reflow
				BX.addClass(active, direction);
				BX.addClass(next, direction);
				setTimeout(function() {
					BX.addClass(next, 'active');
					BX.removeClass(active, 'active');
					BX.removeClass(active, direction);
					BX.removeClass(next, type);
					BX.removeClass(next, direction);
					self.slider.sliding = false;
					self.playRequestedSlide();
				}, 700);
			}
			else
			{
				BX.addClass(next, 'active');
				this.slider.sliding = false;
			}

			this.obPictSliderProgressBar && this.resetProgress();
			isCycling && this.cycleSlider();
		},

		stopSliderByUser: function()
		{
			this.slider.stoppedByUser = true;
			this.stopSlider();
		},

		stopSlider: function(event)
		{
			event || (this.slider.paused = true);

			this.slider.interval && clearInterval(this.slider.interval);

			if (this.slider.progress)
			{
				this.slider.progress.stop();

				var width = parseInt(this.obPictSliderProgressBar.style.width);

				this.slider.progress.options.duration = this.slider.options.interval * width / 200;
				this.slider.progress.options.start = {width: width * 10};
				this.slider.progress.options.finish = {width: 0};
				this.slider.progress.options.complete = null;
				this.slider.progress.animate();
			}
		},

		cycleSlider: function(event)
		{
			event || (this.slider.paused = false);

			this.slider.interval && clearInterval(this.slider.interval);

			if (this.slider.stoppedByUser)
				return;

			if (this.slider.options.interval && !this.slider.paused)
			{
				if (this.slider.progress)
				{
					this.slider.progress.stop();

					var width = parseInt(this.obPictSliderProgressBar.style.width);

					this.slider.progress.options.duration = this.slider.options.interval * (100 - width) / 100;
					this.slider.progress.options.start = {width: width * 10};
					this.slider.progress.options.finish = {width: 1000};
					this.slider.progress.options.complete = BX.delegate(function(){
						this.slider.interval = true;
						this.slideNext();
					}, this);
					this.slider.progress.animate();
				}
				else
				{
					this.slider.interval = setInterval(BX.proxy(this.slideNext, this), this.slider.options.interval);
				}
			}
		},

		resetProgress: function()
		{
			this.slider.progress && this.slider.progress.stop();
			this.obPictSliderProgressBar.style.width = 0;
		},

		getItemForDirection: function(direction, active)
		{
			var activeIndex = this.getItemIndex(active),
				willWrap = direction === 'prev' && activeIndex === 0
					|| direction === 'next' && activeIndex == (this.slider.items.length - 1);

			if (willWrap && !this.slider.options.wrap)
				return active;

			var delta = direction === 'prev' ? -1 : 1,
				itemIndex = (activeIndex + delta) % this.slider.items.length;

			return this.eq(this.slider.items, itemIndex);
		},

		getItemIndex: function(item)
		{
			this.slider.items = BX.findChildren(item.parentNode, {className: 'item'}, true);

			return this.slider.items.indexOf(item || this.slider.active);
		},

		eq: function(obj, i)
		{
			var len = obj.length,
				j = +i + (i < 0 ? len : 0);

			return j >= 0 && j < len ? obj[j] : {};
		},

		selectOfferProp: function()
		{
			var i = 0,
				value = '',
				strTreeValue = '',
				arTreeItem = [],
				rowItems = null,
				target = BX.proxy_context;

			if (target && target.hasAttribute('data-treevalue'))
			{
				if (BX.hasClass(target, 'selected'))
					return;

				strTreeValue = target.getAttribute('data-treevalue');
				arTreeItem = strTreeValue.split('_');
				this.changedRows = [];
				if (this.searchOfferPropIndex(arTreeItem[0], arTreeItem[1]))
				{
					rowItems = BX.findChildren(target.parentNode, {tagName: 'li'}, false);
					if (rowItems && 0 < rowItems.length)
					{
						for (i = 0; i < rowItems.length; i++)
						{
							value = rowItems[i].getAttribute('data-onevalue');
							if (value === arTreeItem[1])
							{
								BX.addClass(rowItems[i], 'selected');
							}
							else
							{
								BX.removeClass(rowItems[i], 'selected');
							}

							this.setSkuChecked(rowItems[i], value === arTreeItem[1]);
						}
					}

					if (
						this.isFacebookConversionCustomizeProductEventEnabled
						&& BX.Type.isArrayFilled(this.offers)
						&& BX.Type.isObject(this.offers[this.offerNum])
					)
					{
						BX.ajax.runAction(
							'sale.facebookconversion.customizeProduct',
							{
								data: {
									offerId: this.offers[this.offerNum]['ID']
								}
							}
						);
					}

					this.announceSkuChoice(target);
				}
			}
		},

		// Orca repeats the state of a radio only when the last key was the space bar, so a choice made
		// with Enter or the arrows stayed silent, along with the price and the rows it rebuilds.
		announceSkuChoice: function(target)
		{
			if (this.viewMode !== 'CARD')
			{
				return;
			}

			var value = target.getAttribute('aria-label') || '';
			var price = textOf(this.obPrice);

			// A value ruled out by the tree leaves the price node empty, and the phrase would break off.
			var parts = [
				price === ''
					? fillTemplate(BX.message('CT_BCI_TPL_MESS_SKU_CHANGED_NO_PRICE_ARIA') || '', {
						'#VALUE#': value
					})
					: fillTemplate(BX.message('CT_BCI_TPL_MESS_SKU_CHANGED_ARIA') || '', {
						'#VALUE#': value,
						'#PRICE#': price
					})
			];

			for (var i = 0; i < this.changedRows.length; i++)
			{
				var row = this.changedRows[i] ? this.getSkuRowState(i) : null;
				if (!row)
				{
					continue;
				}

				parts.push(fillTemplate(BX.message('CT_BCI_TPL_MESS_SKU_SET_CHANGED_ARIA') || '', {
					'#PROPERTY#': row.property,
					'#COUNT#': row.count
				}));
			}

			if (!this.canBuy && this.obNotAvail)
			{
				parts.push(textOf(this.obNotAvail));
			}

			this.announce(parts.join('. '));
		},

		selectOfferPropByKey: function(event)
		{
			if (event.key !== 'Enter' && event.key !== ' ')
			{
				return;
			}

			// The radio role sits on a list item, so the browser synthesizes no activation of its own;
			// preventDefault also keeps the space key from scrolling the page.
			event.preventDefault();
			BX.proxy_context.click();
		},

		searchOfferPropIndex: function(strPropID, strPropValue)
		{
			var strName = '',
				arShowValues = false,
				i, j,
				arCanBuyValues = [],
				allValues = [],
				index = -1,
				arFilter = {},
				tmpFilter = [];

			for (i = 0; i < this.treeProps.length; i++)
			{
				if (this.treeProps[i].ID === strPropID)
				{
					index = i;
					break;
				}
			}

			if (-1 < index)
			{
				for (i = 0; i < index; i++)
				{
					strName = 'PROP_'+this.treeProps[i].ID;
					arFilter[strName] = this.selectedValues[strName];
				}
				strName = 'PROP_'+this.treeProps[index].ID;
				arShowValues = this.getRowValues(arFilter, strName);
				if (!arShowValues)
				{
					return false;
				}
				if (!BX.util.in_array(strPropValue, arShowValues))
				{
					return false;
				}
				arFilter[strName] = strPropValue;
				for (i = index+1; i < this.treeProps.length; i++)
				{
					strName = 'PROP_'+this.treeProps[i].ID;
					arShowValues = this.getRowValues(arFilter, strName);
					if (!arShowValues)
					{
						return false;
					}
					allValues = [];
					if (this.showAbsent)
					{
						arCanBuyValues = [];
						tmpFilter = [];
						tmpFilter = BX.clone(arFilter, true);
						for (j = 0; j < arShowValues.length; j++)
						{
							tmpFilter[strName] = arShowValues[j];
							allValues[allValues.length] = arShowValues[j];
							if (this.getCanBuy(tmpFilter))
								arCanBuyValues[arCanBuyValues.length] = arShowValues[j];
						}
					}
					else
					{
						arCanBuyValues = arShowValues;
					}
					if (this.selectedValues[strName] && BX.util.in_array(this.selectedValues[strName], arCanBuyValues))
					{
						arFilter[strName] = this.selectedValues[strName];
					}
					else
					{
						if (this.showAbsent)
							arFilter[strName] = (arCanBuyValues.length > 0 ? arCanBuyValues[0] : allValues[0]);
						else
							arFilter[strName] = arCanBuyValues[0];
					}
					this.updateRow(i, arFilter[strName], arShowValues, arCanBuyValues);
				}
				this.selectedValues = arFilter;
				this.changeInfo();
			}
			return true;
		},

		updateRow: function(intNumber, activeID, showID, canBuyID)
		{
			var i = 0,
				value = '',
				isCurrent = false,
				canBuy = false,
				rowItems = null;

			var lineContainer = this.obTree.querySelectorAll('[data-entity="sku-line-block"]'),
				listContainer;

			if (intNumber > -1 && intNumber < lineContainer.length)
			{
				listContainer = lineContainer[intNumber].querySelector('ul');
				rowItems = BX.findChildren(listContainer, {tagName: 'li'}, false);
				if (rowItems && 0 < rowItems.length)
				{
					var wasVisible = this.getVisibleSkuValues(rowItems).join(',');

					for (i = 0; i < rowItems.length; i++)
					{
						value = rowItems[i].getAttribute('data-onevalue');
						isCurrent = value === activeID;

						if (isCurrent)
						{
							BX.addClass(rowItems[i], 'selected');
						}
						else
						{
							BX.removeClass(rowItems[i], 'selected');
						}

						this.setSkuChecked(rowItems[i], isCurrent);

						canBuy = BX.util.in_array(value, canBuyID);
						if (canBuy)
						{
							BX.removeClass(rowItems[i], 'notallowed');
						}
						else
						{
							BX.addClass(rowItems[i], 'notallowed');
						}

						this.setSkuUnavailable(rowItems[i], !canBuy);

						rowItems[i].style.display = BX.util.in_array(value, showID) ? '' : 'none';

						if (isCurrent)
						{
							lineContainer[intNumber].style.display = (value == 0 && canBuyID.length == 1) ? 'none' : '';
						}
					}

					this.changedRows[intNumber] = this.getVisibleSkuValues(rowItems).join(',') !== wasVisible;

					this.updateSkuPositions(rowItems);
					this.refreshSkuZone(intNumber);
				}
			}
		},

		getVisibleSkuValues: function(rowItems)
		{
			var visible = [];

			for (var i = 0; i < rowItems.length; i++)
			{
				if (rowItems[i].style.display !== 'none')
				{
					visible.push(rowItems[i].getAttribute('data-onevalue'));
				}
			}

			return visible;
		},

		getSkuRowState: function(intNumber)
		{
			var lineContainer = this.obTree
				? this.obTree.querySelectorAll('[data-entity="sku-line-block"]')
				: [];

			if (intNumber < 0 || intNumber >= lineContainer.length)
			{
				return null;
			}

			var list = lineContainer[intNumber].querySelector('ul');
			if (!list)
			{
				return null;
			}

			return {
				property: this.getSkuGroupName(list),
				count: this.getVisibleSkuValues(BX.findChildren(list, {tagName: 'li'}, false)).length
			};
		},

		getSkuGroupName: function(list)
		{
			var titleId = list.getAttribute('aria-labelledby');

			return titleId
				? textOf(document.getElementById(titleId))
				: (list.getAttribute('aria-label') || '');
		},

		getRowValues: function(arFilter, index)
		{
			var i = 0,
				j,
				arValues = [],
				boolSearch = false,
				boolOneSearch = true;

			if (0 === arFilter.length)
			{
				for (i = 0; i < this.offers.length; i++)
				{
					if (!BX.util.in_array(this.offers[i].TREE[index], arValues))
					{
						arValues[arValues.length] = this.offers[i].TREE[index];
					}
				}
				boolSearch = true;
			}
			else
			{
				for (i = 0; i < this.offers.length; i++)
				{
					boolOneSearch = true;
					for (j in arFilter)
					{
						if (arFilter[j] !== this.offers[i].TREE[j])
						{
							boolOneSearch = false;
							break;
						}
					}
					if (boolOneSearch)
					{
						if (!BX.util.in_array(this.offers[i].TREE[index], arValues))
						{
							arValues[arValues.length] = this.offers[i].TREE[index];
						}
						boolSearch = true;
					}
				}
			}
			return (boolSearch ? arValues : false);
		},

		getCanBuy: function(arFilter)
		{
			var i, j,
				boolSearch = false,
				boolOneSearch = true;

			for (i = 0; i < this.offers.length; i++)
			{
				boolOneSearch = true;
				for (j in arFilter)
				{
					if (arFilter[j] !== this.offers[i].TREE[j])
					{
						boolOneSearch = false;
						break;
					}
				}
				if (boolOneSearch)
				{
					if (this.offers[i].CAN_BUY)
					{
						boolSearch = true;
						break;
					}
				}
			}

			return boolSearch;
		},

		setCurrent: function()
		{
			var i,
				j = 0,
				arCanBuyValues = [],
				strName = '',
				arShowValues = false,
				arFilter = {},
				tmpFilter = [],
				current = this.offers[this.offerNum].TREE;

			for (i = 0; i < this.treeProps.length; i++)
			{
				strName = 'PROP_'+this.treeProps[i].ID;
				arShowValues = this.getRowValues(arFilter, strName);
				if (!arShowValues)
				{
					break;
				}
				if (BX.util.in_array(current[strName], arShowValues))
				{
					arFilter[strName] = current[strName];
				}
				else
				{
					arFilter[strName] = arShowValues[0];
					this.offerNum = 0;
				}
				if (this.showAbsent)
				{
					arCanBuyValues = [];
					tmpFilter = [];
					tmpFilter = BX.clone(arFilter, true);
					for (j = 0; j < arShowValues.length; j++)
					{
						tmpFilter[strName] = arShowValues[j];
						if (this.getCanBuy(tmpFilter))
						{
							arCanBuyValues[arCanBuyValues.length] = arShowValues[j];
						}
					}
				}
				else
				{
					arCanBuyValues = arShowValues;
				}
				this.updateRow(i, arFilter[strName], arShowValues, arCanBuyValues);
			}
			this.selectedValues = arFilter;
			this.changeInfo();
		},

		changeInfo: function()
		{
			var i, j,
				index = -1,
				boolOneSearch = true,
				quantityChanged;

			for (i = 0; i < this.offers.length; i++)
			{
				boolOneSearch = true;
				for (j in this.selectedValues)
				{
					if (this.selectedValues[j] !== this.offers[i].TREE[j])
					{
						boolOneSearch = false;
						break;
					}
				}
				if (boolOneSearch)
				{
					index = i;
					break;
				}
			}
			if (index > -1)
			{
				if (parseInt(this.offers[index].MORE_PHOTO_COUNT) > 1 && this.obPictSlider)
				{
					// hide pict and second_pict containers
					if (this.obPict)
					{
						this.obPict.style.display = 'none';
					}

					if (this.obSecondPict)
					{
						this.obSecondPict.style.display = 'none';
					}

					// clear slider container
					BX.cleanNode(this.obPictSlider);

					// fill slider container with slides
					for (i in this.offers[index].MORE_PHOTO)
					{
						if (this.offers[index].MORE_PHOTO.hasOwnProperty(i))
						{
							this.obPictSlider.appendChild(
								BX.create('SPAN', {
									props: {className: 'product-item-image-slide item' + (i == 0 ? ' active' : '')},
									style: {backgroundImage: 'url(\'' + this.offers[index].MORE_PHOTO[i].SRC + '\')'}
								})
							);
						}
					}

					// fill slider indicator if exists
					if (this.obPictSliderIndicator)
					{
						BX.cleanNode(this.obPictSliderIndicator);

						var photosTotal = this.offers[index].MORE_PHOTO.length;

						for (i in this.offers[index].MORE_PHOTO)
						{
							if (this.offers[index].MORE_PHOTO.hasOwnProperty(i))
							{
								this.obPictSliderIndicator.appendChild(this.createSliderControl(i, photosTotal));
								this.obPictSliderIndicator.appendChild(document.createTextNode(' '));
							}
						}

						this.obPictSliderIndicator.style.display = '';
					}

					if (this.obPictSliderProgressBar)
					{
						this.obPictSliderProgressBar.style.display = '';
					}

					// show slider container
					this.obPictSlider.style.display = '';
					this.initializeSlider();
					this.syncDotsZone();
				}
				else
				{
					// hide slider container
					if (this.obPictSlider)
					{
						this.obPictSlider.style.display = 'none';
					}

					if (this.obPictSliderIndicator)
					{
						this.obPictSliderIndicator.style.display = 'none';
						this.syncDotsZone();
					}

					if (this.obPictSliderProgressBar)
					{
						this.obPictSliderProgressBar.style.display = 'none';
					}

					// show pict and pict_second containers
					if (this.obPict)
					{
						if (this.offers[index].PREVIEW_PICTURE)
						{
							BX.adjust(this.obPict, {style: {backgroundImage: 'url(\'' + this.offers[index].PREVIEW_PICTURE.SRC + '\')'}});
						}
						else
						{
							BX.adjust(this.obPict, {style: {backgroundImage: 'url(\'' + this.defaultPict.pict.SRC + '\')'}});
						}

						this.obPict.style.display = '';
					}

					if (this.secondPict && this.obSecondPict)
					{
						if (this.offers[index].PREVIEW_PICTURE_SECOND)
						{
							BX.adjust(this.obSecondPict, {style: {backgroundImage: 'url(\'' + this.offers[index].PREVIEW_PICTURE_SECOND.SRC + '\')'}});
						}
						else if (this.offers[index].PREVIEW_PICTURE.SRC)
						{
							BX.adjust(this.obSecondPict, {style: {backgroundImage: 'url(\'' + this.offers[index].PREVIEW_PICTURE.SRC + '\')'}});
						}
						else if (this.defaultPict.secondPict)
						{
							BX.adjust(this.obSecondPict, {style: {backgroundImage: 'url(\'' + this.defaultPict.secondPict.SRC + '\')'}});
						}
						else
						{
							BX.adjust(this.obSecondPict, {style: {backgroundImage: 'url(\'' + this.defaultPict.pict.SRC + '\')'}});
						}

						this.obSecondPict.style.display = '';
					}
				}

				if (this.showSkuProps && this.obSkuProps)
				{
					if (this.offers[index].DISPLAY_PROPERTIES.length)
					{
						BX.adjust(this.obSkuProps, {style: {display: ''}, html: this.offers[index].DISPLAY_PROPERTIES});
					}
					else
					{
						BX.adjust(this.obSkuProps, {style: {display: 'none'}, html: ''});
					}
				}

				this.quantitySet(index);
				this.setPrice();
				this.setCompared(this.offers[index].COMPARED);

				this.offerNum = index;
			}
		},

		checkPriceRange: function(quantity)
		{
			if (typeof quantity === 'undefined'|| this.currentPriceMode != 'Q')
				return;

			var range, found = false;

			for (var i in this.currentQuantityRanges)
			{
				if (this.currentQuantityRanges.hasOwnProperty(i))
				{
					range = this.currentQuantityRanges[i];

					if (
						parseInt(quantity) >= parseInt(range.SORT_FROM)
						&& (
							range.SORT_TO == 'INF'
							|| parseInt(quantity) <= parseInt(range.SORT_TO)
						)
					)
					{
						found = true;
						this.currentQuantityRangeSelected = range.HASH;
						break;
					}
				}
			}

			if (!found && (range = this.getMinPriceRange()))
			{
				this.currentQuantityRangeSelected = range.HASH;
			}

			for (var k in this.currentPrices)
			{
				if (this.currentPrices.hasOwnProperty(k))
				{
					if (this.currentPrices[k].QUANTITY_HASH == this.currentQuantityRangeSelected)
					{
						this.currentPriceSelected = k;
						break;
					}
				}
			}
		},

		getMinPriceRange: function()
		{
			var range;

			for (var i in this.currentQuantityRanges)
			{
				if (this.currentQuantityRanges.hasOwnProperty(i))
				{
					if (
						!range
						|| parseInt(this.currentQuantityRanges[i].SORT_FROM) < parseInt(range.SORT_FROM)
					)
					{
						range = this.currentQuantityRanges[i];
					}
				}
			}

			return range;
		},

		checkQuantityControls: function()
		{
			if (!this.obQuantity)
				return;

			var reachedTopLimit = this.checkQuantity && parseFloat(this.obQuantity.value) + this.stepQuantity > this.maxQuantity,
				reachedBottomLimit = parseFloat(this.obQuantity.value) - this.stepQuantity < this.minQuantity;

			this.setQuantityControlLimit(this.obQuantityUp, reachedTopLimit);
			this.setQuantityControlLimit(this.obQuantityDown, reachedBottomLimit);

			if (reachedTopLimit && reachedBottomLimit)
			{
				this.obQuantity.setAttribute('disabled', 'disabled');
			}
			else
			{
				this.obQuantity.removeAttribute('disabled');
			}
		},

		setQuantityControlLimit: function(control, limitReached)
		{
			if (!control)
				return;

			if (limitReached)
			{
				BX.addClass(control, 'product-item-amount-field-btn-disabled');
				control.setAttribute('aria-disabled', 'true');
			}
			else
			{
				BX.removeClass(control, 'product-item-amount-field-btn-disabled');
				control.removeAttribute('aria-disabled');
			}
		},

		// The ring of a card carries a hidden explanation beside the percent; elsewhere it stands alone.
		setDiscountPercent: function(node, data)
		{
			var value = this.viewMode === 'CARD'
				? node.querySelector('[data-entity="discount-value"]')
				: null;

			if (!value)
			{
				BX.adjust(node, data);

				return;
			}

			BX.adjust(node, {style: data.style});
			BX.adjust(value, {html: data.html});
		},

		setPrice: function()
		{
			var obData, price;

			if (this.obQuantity)
			{
				this.checkPriceRange(this.obQuantity.value);
			}

			this.checkQuantityControls();

			price = this.currentPrices[this.currentPriceSelected];

			if (this.obPrice)
			{
				if (price)
				{
					BX.adjust(this.obPrice, {html: BX.Currency.currencyFormat(price.RATIO_PRICE, price.CURRENCY, true)});
				}
				else
				{
					BX.adjust(this.obPrice, {html: ''});
				}

				if (this.showOldPrice && this.obPriceOld)
				{
					if (price && price.RATIO_PRICE !== price.RATIO_BASE_PRICE)
					{
						BX.adjust(this.obPriceOld, {
							style: {display: ''},
							html: BX.Currency.currencyFormat(price.RATIO_BASE_PRICE, price.CURRENCY, true)
						});
					}
					else
					{
						BX.adjust(this.obPriceOld, {
							style: {display: 'none'},
							html: ''
						});
					}
				}

				if (this.obPriceTotal)
				{
					if (price && this.obQuantity && this.obQuantity.value != this.stepQuantity)
					{
						BX.adjust(this.obPriceTotal, {
							html: BX.message('PRICE_TOTAL_PREFIX') + ' <strong>'
							+ BX.Currency.currencyFormat(price.PRICE * this.obQuantity.value, price.CURRENCY, true)
							+ '</strong>',
							style: {display: ''}
						});
					}
					else
					{
						BX.adjust(this.obPriceTotal, {
							html: '',
							style: {display: 'none'}
						});
					}
				}

				if (this.showPercent)
				{
					if (price && parseInt(price.PERCENT) > 0)
					{
						obData = {style: {display: ''}, html: -price.PERCENT + '%'};
					}
					else
					{
						obData = {style: {display: 'none'}, html: ''};
					}

					if (this.obDscPerc)
					{
						this.setDiscountPercent(this.obDscPerc, obData);
					}

					if (this.obSecondDscPerc)
					{
						this.setDiscountPercent(this.obSecondDscPerc, obData);
					}
				}
			}
		},

		compare: function(event)
		{
			var checkbox = this.obCompare.querySelector('[data-entity="compare-checkbox"]'),
				target = BX.getEventTarget(event),
				checked = true;

			if (checkbox)
			{
				checked = target === checkbox ? checkbox.checked : !checkbox.checked;
			}

			this.popupInitiator = checkbox;

			var url = checked ? this.compareData.compareUrl : this.compareData.compareDeleteUrl,
				compareLink;

			if (url)
			{
				if (target !== checkbox)
				{
					BX.PreventDefault(event);
					this.setCompared(checked);
				}

				switch (this.productType)
				{
					case 0: // no catalog
					case 1: // product
					case 2: // set
					case 7: // service
						compareLink = url.replace('#ID#', this.product.id.toString());
						break;
					case 3: // sku
						compareLink = url.replace('#ID#', this.offers[this.offerNum].ID);
						break;
				}

				BX.ajax({
					method: 'POST',
					dataType: checked ? 'json' : 'html',
					url: compareLink + (compareLink.indexOf('?') !== -1 ? '&' : '?') + 'ajax_action=Y',
					onsuccess: checked
						? BX.proxy(this.compareResult, this)
						: BX.proxy(this.compareDeleteResult, this)
				});
			}
		},

		compareResult: function(result)
		{
			var popupContent, popupButtons;

			if (this.obPopupWin)
			{
				this.obPopupWin.close();
			}

			if (!BX.type.isPlainObject(result))
				return;

			this.initPopupWindow();

			if (this.offers.length > 0)
			{
				this.offers[this.offerNum].COMPARED = result.STATUS === 'OK';
			}

			if (result.STATUS === 'OK')
			{
				BX.onCustomEvent('OnCompareChange');

				popupContent = '<div style="width: 100%; margin: 0; text-align: center;"><p>'
					+ BX.message('COMPARE_MESSAGE_OK')
					+ '</p></div>';

				if (this.showClosePopup)
				{
					popupButtons = [
						new BasketButton({
							text: BX.message('BTN_MESSAGE_COMPARE_REDIRECT'),
							events: {
								click: BX.delegate(this.compareRedirect, this)
							},
							style: {marginRight: '10px'},
							autofocus: true,
							testId: 'catalog-item-compare-redirect'
						}),
						new BasketButton({
							text: BX.message('BTN_MESSAGE_CLOSE_POPUP'),
							events: {
								click: BX.delegate(this.obPopupWin.close, this.obPopupWin)
							},
							testId: 'catalog-item-compare-close'
						})
					];
				}
				else
				{
					popupButtons = [
						new BasketButton({
							text: BX.message('BTN_MESSAGE_COMPARE_REDIRECT'),
							events: {
								click: BX.delegate(this.compareRedirect, this)
							},
							autofocus: true,
							testId: 'catalog-item-compare-redirect'
						})
					];
				}
			}
			else
			{
				popupContent = '<div style="width: 100%; margin: 0; text-align: center;"><p>'
					+ (result.MESSAGE ? result.MESSAGE : BX.message('COMPARE_UNKNOWN_ERROR'))
					+ '</p></div>';
				popupButtons = [
					new BasketButton({
						text: BX.message('BTN_MESSAGE_CLOSE'),
						events: {
							click: BX.delegate(this.obPopupWin.close, this.obPopupWin)
						},
						autofocus: true,
						testId: 'catalog-item-compare-close'
					})
				];
			}

			this.nameDialog('catalog-item-compare-dialog');
			this.obPopupWin.setTitleBar(BX.message('COMPARE_TITLE'));
			this.obPopupWin.setContent(popupContent);
			this.obPopupWin.setButtons(popupButtons);
			this.obPopupWin.show();

			// The focus that went into the layer reads the result out with it. The panel of the compare
			// list changes in silence, so a layer kept from opening leaves the result to the announcer.
			if (result.STATUS === 'OK' && !this.popupHoldsFocus())
			{
				this.announce(BX.message('COMPARE_MESSAGE_OK') || '');
			}
		},

		popupHoldsFocus: function()
		{
			return this.obPopupWin.isShown()
				&& this.obPopupWin.getPopupContainer().contains(document.activeElement)
			;
		},

		compareDeleteResult: function()
		{
			BX.onCustomEvent('OnCompareChange');
			// catalog.top prints the card too, and its message block has no such phrase
			this.announce(
				BX.message('CT_BCS_TPL_MESS_COMPARE_REMOVED_ARIA')
				|| BX.message('CT_BCI_TPL_MESS_COMPARE_REMOVED_ARIA')
				|| ''
			);

			if (this.offers && this.offers.length)
			{
				this.offers[this.offerNum].COMPARED = false;
			}
		},

		setCompared: function(state)
		{
			if (!this.obCompare)
				return;

			var checkbox = this.obCompare.querySelector('[data-entity="compare-checkbox"]');
			if (checkbox)
			{
				checkbox.checked = state;
			}
		},

		setCompareInfo: function(comparedIds)
		{
			if (!BX.type.isArray(comparedIds))
				return;

			for (var i in this.offers)
			{
				if (this.offers.hasOwnProperty(i))
				{
					this.offers[i].COMPARED = BX.util.in_array(this.offers[i].ID, comparedIds);
				}
			}
		},

		compareRedirect: function()
		{
			if (this.compareData.comparePath)
			{
				location.href = this.compareData.comparePath;
			}
			else
			{
				this.obPopupWin.close();
			}
		},

		checkDeletedCompare: function(id)
		{
			switch (this.productType)
			{
				case 0: // no catalog
				case 1: // product
				case 2: // set
				case 7: // service
					if (this.product.id == id)
					{
						this.setCompared(false);
					}

					break;
				case 3: // sku
					var i = this.offers.length;
					while (i--)
					{
						if (this.offers[i].ID == id)
						{
							this.offers[i].COMPARED = false;

							if (this.offerNum == i)
							{
								this.setCompared(false);
							}

							break;
						}
					}
			}
		},

		initBasketUrl: function()
		{
			this.basketUrl = (this.basketMode === 'ADD' ? this.basketData.add_url : this.basketData.buy_url);
			switch (this.productType)
			{
				case 1: // product
				case 2: // set
				case 7: // service
					this.basketUrl = this.basketUrl.replace('#ID#', this.product.id.toString());
					break;
				case 3: // sku
					this.basketUrl = this.basketUrl.replace('#ID#', this.offers[this.offerNum].ID);
					break;
			}
			this.basketParams = {
				'ajax_basket': 'Y'
			};
			if (this.showQuantity)
			{
				this.basketParams[this.basketData.quantity] = this.obQuantity.value;
			}
			if (this.basketData.sku_props)
			{
				this.basketParams[this.basketData.sku_props_var] = this.basketData.sku_props;
			}
		},

		fillBasketProps: function()
		{
			if (!this.visual.BASKET_PROP_DIV)
			{
				return;
			}
			var
				i = 0,
				propCollection = null,
				foundValues = false,
				obBasketProps = null;

			if (this.basketData.useProps && !this.basketData.emptyProps)
			{
				if (this.obPopupWin && this.obPopupWin.contentContainer)
				{
					obBasketProps = this.obPopupWin.contentContainer;
				}
			}
			else
			{
				obBasketProps = BX(this.visual.BASKET_PROP_DIV);
			}
			if (obBasketProps)
			{
				propCollection = obBasketProps.getElementsByTagName('select');
				if (propCollection && propCollection.length)
				{
					for (i = 0; i < propCollection.length; i++)
					{
						if (!propCollection[i].disabled)
						{
							switch (propCollection[i].type.toLowerCase())
							{
								case 'select-one':
									this.basketParams[propCollection[i].name] = propCollection[i].value;
									foundValues = true;
									break;
								default:
									break;
							}
						}
					}
				}
				propCollection = obBasketProps.getElementsByTagName('input');
				if (propCollection && propCollection.length)
				{
					for (i = 0; i < propCollection.length; i++)
					{
						if (!propCollection[i].disabled)
						{
							switch (propCollection[i].type.toLowerCase())
							{
								case 'hidden':
									this.basketParams[propCollection[i].name] = propCollection[i].value;
									foundValues = true;
									break;
								case 'radio':
									if (propCollection[i].checked)
									{
										this.basketParams[propCollection[i].name] = propCollection[i].value;
										foundValues = true;
									}
									break;
								default:
									break;
							}
						}
					}
				}
			}
			if (!foundValues)
			{
				this.basketParams[this.basketData.props] = [];
				this.basketParams[this.basketData.props][0] = 0;
			}
		},

		add2Basket: function()
		{
			this.popupInitiator = this.obBuyBtn;
			this.basketMode = 'ADD';
			this.basket();
		},

		buyBasket: function()
		{
			this.popupInitiator = this.obBuyBtn;
			this.basketMode = 'BUY';
			this.basket();
		},

		sendToBasket: function()
		{
			if (!this.canBuy)
			{
				return;
			}

			// check recommendation
			if (this.product && this.product.id && this.bigData)
			{
				this.rememberProductRecommendation();
			}

			this.initBasketUrl();
			this.fillBasketProps();
			BX.ajax({
				method: 'POST',
				dataType: 'json',
				url: this.basketUrl,
				data: this.basketParams,
				onsuccess: BX.proxy(this.basketResult, this)
			});
		},

		basket: function()
		{
			var contentBasketProps = '';
			if (!this.canBuy)
			{
				return;
			}
			switch (this.productType)
			{
				case 1: // product
				case 2: // set
				case 7: // service
					if (this.basketData.useProps && !this.basketData.emptyProps)
					{
						this.initPopupWindow();
						this.nameDialog('catalog-item-basket-dialog');
						this.obPopupWin.setTitleBar(BX.message('TITLE_BASKET_PROPS'));
						if (BX(this.visual.BASKET_PROP_DIV))
						{
							contentBasketProps = BX(this.visual.BASKET_PROP_DIV).innerHTML;
						}
						this.obPopupWin.setContent(contentBasketProps);
						this.obPopupWin.setButtons([
							new BasketButton({
								text: BX.message('BTN_MESSAGE_SEND_PROPS'),
								events: {
									click: BX.delegate(this.sendToBasket, this)
								},
								testId: 'catalog-item-basket-send-props'
							})
						]);
						this.obPopupWin.show();
					}
					else
					{
						this.sendToBasket();
					}
					break;
				case 3: // sku
					this.sendToBasket();
					break;
			}
		},

		basketResult: function(arResult)
		{
			var strContent = '',
				strPict = '',
				successful,
				buttons = [];

			if (this.obPopupWin)
				this.obPopupWin.close();

			if (!BX.type.isPlainObject(arResult))
				return;

			successful = arResult.STATUS === 'OK';

			if (successful)
			{
				this.setAnalyticsDataLayer('addToCart');
			}

			if (successful && this.basketAction === 'BUY')
			{
				this.basketRedirect();
			}
			else
			{
				this.initPopupWindow();
				this.nameDialog('catalog-item-basket-dialog');

				if (successful)
				{
					BX.onCustomEvent('OnBasketChange');

					if  (BX.findParent(this.obProduct, {className: 'bx_sale_gift_main_products'}, 10))
					{
						BX.onCustomEvent('onAddToBasketMainProduct', [this]);
					}

					switch (this.productType)
					{
						case 1: // product
						case 2: // set
						case 7: // service
							strPict = this.product.pict.SRC;
							break;
						case 3: // sku
							strPict = (this.offers[this.offerNum].PREVIEW_PICTURE ?
									this.offers[this.offerNum].PREVIEW_PICTURE.SRC :
									this.defaultPict.pict.SRC
							);
							break;
					}

					strContent = '<div style="width: 100%; margin: 0; text-align: center;"><img src="'
						+ strPict + '" height="130" style="max-height:130px"><p>' + this.product.name + '</p></div>';

					if (this.showClosePopup)
					{
						buttons = [
							new BasketButton({
								text: BX.message("BTN_MESSAGE_BASKET_REDIRECT"),
								events: {
									click: BX.delegate(this.basketRedirect, this)
								},
								style: {marginRight: '10px'},
								autofocus: true,
								testId: 'catalog-item-basket-redirect'
							}),
							new BasketButton({
								text: BX.message("BTN_MESSAGE_CLOSE_POPUP"),
								events: {
									click: BX.delegate(this.obPopupWin.close, this.obPopupWin)
								},
								testId: 'catalog-item-basket-close'
							})
						];
					}
					else
					{
						buttons = [
							new BasketButton({
								text: BX.message("BTN_MESSAGE_BASKET_REDIRECT"),
								events: {
									click: BX.delegate(this.basketRedirect, this)
								},
								autofocus: true,
								testId: 'catalog-item-basket-redirect'
							})
						];
					}
				}
				else
				{
					strContent = '<div style="width: 100%; margin: 0; text-align: center;"><p>'
						+ (arResult.MESSAGE ? arResult.MESSAGE : BX.message('BASKET_UNKNOWN_ERROR'))
						+ '</p></div>';
					buttons = [
						new BasketButton({
							text: BX.message('BTN_MESSAGE_CLOSE'),
							events: {
								click: BX.delegate(this.obPopupWin.close, this.obPopupWin)
							},
							autofocus: true,
							testId: 'catalog-item-basket-close'
						})
					];
				}
				this.obPopupWin.setTitleBar(successful ? BX.message('TITLE_SUCCESSFUL') : BX.message('TITLE_ERROR'));
				this.obPopupWin.setContent(strContent);
				this.obPopupWin.setButtons(buttons);
				this.obPopupWin.show();
			}
		},

		basketRedirect: function()
		{
			location.href = (this.basketData.basketUrl ? this.basketData.basketUrl : BX.message('BASKET_URL'));
		},

		// the popup is built once per card while its initiator differs from call to call
		getPopupReturnTarget: function()
		{
			var node = this.popupInitiator;

			return node && node.isConnected ? node : null;
		},

		initPopupWindow: function()
		{
			if (this.obPopupWin)
				return;

			this.obPopupWin = BX.PopupWindowManager.create('CatalogSectionBasket_' + this.visual.ID, null, {
				autoHide: true,
				offsetLeft: 0,
				offsetTop: 0,
				overlay : true,
				closeByEsc: true,
				titleBar: true,
				closeIcon: true,
				contentColor: 'white',
				className: this.templateTheme ? 'bx-' + this.templateTheme : '',
				focusTrap: {restoreFocus: BX.delegate(this.getPopupReturnTarget, this)}
			});

		},

		// The layer is shared by the basket and the comparison, so its name is given at every show: the
		// popup takes the name from the title only while it has none. The focus lands on a button of the
		// layer, and the content is what the button is read out with.
		nameDialog: function(testId)
		{
			var container = this.obPopupWin.getPopupContainer();

			container.removeAttribute('aria-label');
			container.setAttribute('data-testid', testId);
			container.setAttribute('aria-describedby', this.obPopupWin.getContentContainer().id);
		}
	};
})(window);
