(function(window){
	'use strict';

	if (window.JCCatalogElement)
		return;

	// A held step button repeats the change every 150 ms and the announcer plays every queued
	// message in full instead of dropping stale ones. Announcing the quantity only after this
	// quiet period turns a series of steps into a single announcement.
	var QUANTITY_ANNOUNCE_DELAY = 500;

	// The arrows choose a variation on every step of a walk over the values. What a choice sends to
	// the server, loads into the gallery and says out loud waits for this pause in the walk.
	var OFFER_EFFECTS_DELAY = 400;

	// String.replace reads $& and $' in the replacement, and both the name of a property and the name
	// of a value come from the product.
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

	// Attributes the zoom layer borrows from the gallery block: it puts its own values there and
	// puts back whatever the template had printed.
	var galleryLayerAttrs = ['role', 'aria-modal', 'aria-label'];

	// How long the trap of the zoom layer waits for the layer to stop being transparent. The wait
	// normally ends on the second frame, and the budget only keeps it finite if something else holds
	// the layer at zero opacity.
	var GALLERY_LAYER_FRAME_BUDGET = 30;

	// The width below which the styles hide the strip of tabs and open every section at once
	// (style.css:1005, :1012). The roles of a tab strip follow that same line.
	var TABS_NARROW_QUERY = '(max-width: 991px)';

	// A state written into an attribute: a value of null takes the attribute off the node.
	var writeAttr = function(node, name, value)
	{
		if (value === null)
		{
			node.removeAttribute(name);
		}
		else
		{
			node.setAttribute(name, value);
		}
	};

	// The accessibility primitives come from an extension of their own. Without it the page keeps its
	// gallery, price and buy button and loses only the keyboard and reader extras.
	var getAccessibility = function()
	{
		return (BX.UI && BX.UI.Accessibility) || null;
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

		this.buttonNode = BX.create('BUTTON', {
			props: {className: 'btn btn-primary btn-buy btn-sm', id: this.id},
			attrs: attrs,
			style: typeof params.style === 'object' ? params.style : {},
			text: this.text,
			events: this.contextEvents
		});
	};
	BX.extend(BasketButton, BX.PopupWindowButton);

	window.JCCatalogElement = function(arParams)
	{
		this.productType = 0;

		this.config = {
			useCatalog: true,
			showQuantity: true,
			showPrice: true,
			showAbsent: true,
			showOldPrice: false,
			showPercent: false,
			showSkuProps: false,
			showOfferGroup: false,
			useCompare: false,
			useStickers: false,
			useSubscribe: false,
			usePopup: false,
			useMagnifier: false,
			usePriceRanges: false,
			basketAction: ['BUY'],
			showClosePopup: false,
			templateTheme: '',
			showSlider: false,
			sliderInterval: 5000,
			useEnhancedEcommerce: false,
			dataLayerName: 'dataLayer',
			brandProperty: false,
			alt: '',
			title: '',
			magnifierZoomPercent: 200
		};

		this.checkQuantity = false;
		this.maxQuantity = 0;
		this.minQuantity = 0;
		this.stepQuantity = 1;
		this.isDblQuantity = false;
		this.canBuy = true;
		this.isGift = false;
		this.canSubscription = true;
		this.currentIsSet = false;
		this.updateViewedCount = false;

		this.currentPriceMode = '';
		this.currentPrices = [];
		this.currentPriceSelected = 0;
		this.currentQuantityRanges = [];
		this.currentQuantityRangeSelected = 0;

		this.precision = 6;
		this.precisionFactor = Math.pow(10, this.precision);

		this.visual = {};
		this.basketMode = '';
		this.product = {
			checkQuantity: false,
			maxQuantity: 0,
			stepQuantity: 1,
			startQuantity: 1,
			isDblQuantity: false,
			canBuy: true,
			canSubscription: true,
			name: '',
			pict: {},
			id: 0,
			addUrl: '',
			buyUrl: '',
			slider: {},
			sliderCount: 0,
			useSlider: false,
			sliderPict: []
		};
		this.mess = {};

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
			preview: null,
			detail: null
		};

		this.offers = [];
		this.offerNum = 0;
		this.treeProps = [];
		this.selectedValues = {};

		this.mouseTimer = null;
		this.isTouchDevice = BX.hasClass(document.documentElement, 'bx-touch');
		this.touch = null;
		this.slider = {
			interval: null,
			progress: null,
			paused: null,
			controls: []
		};
		this.dotsFocusZone = null;
		this.dotsFocusZoneCont = null;
		this.dotsZones = [];
		this.skuFocusZones = [];
		this.tabsFocusZone = null;
		this.tabsZoneRefreshPending = false;
		this.galleryTrap = null;
		this.galleryTrapFrame = null;
		this.galleryTrapFramesLeft = 0;
		this.galleryAttrsBeforeLayer = null;
		this.galleryOpenerTabIndex = undefined;

		this.quantityDelay = null;
		this.quantityTimer = null;
		this.quantityAnnounceTimer = null;
		this.skuAnnounceNode = null;
		this.offerEffectsDeferred = false;
		this.offerEffectsTimer = null;
		this.offerEffectsNode = null;

		this.obProduct = null;
		this.obProductTitle = null;
		this.obQuantity = null;
		this.obQuantityUp = null;
		this.obQuantityDown = null;
		this.obPrice = {
			price: null,
			full: null,
			discount: null,
			percent: null,
			total: null
		};
		this.obTree = null;
		this.obPriceRanges = null;
		this.obBuyBtn = null;
		this.obAddToBasketBtn = null;
		this.obBasketActions = null;
		this.obNotAvail = null;
		this.obSubscribe = null;
		this.obSkuProps = null;
		this.obDescription = null;
		this.obMainSkuProps = null;
		this.obBigSlider = null;
		this.obMeasure = null;
		this.obQuantityLimit = {
			all: null,
			value: null
		};
		this.obCompare = null;
		this.obTabsPanel = null;

		this.node = {};
		// top panel small card
		this.smallCardNodes = {};

		this.magnify = {
			enabled: false,
			obBigImg: null,
			obBigSlider: null,
			height: 0,
			width: 0,
			timer: 0
		};
		this.currentImg = {
			id: 0,
			src: '',
			width: 0,
			height: 0
		};
		this.viewedCounter = {
			path: '/bitrix/components/bitrix/catalog.element/ajax.php',
			params: {
				AJAX: 'Y',
				SITE_ID: '',
				PRODUCT_ID: 0,
				PARENT_ID: 0
			}
		};

		this.obPopupWin = null;
		this.popupInitiator = null;
		this.basketUrl = '';
		this.basketParams = {};

		this.errorCode = 0;

		if (typeof arParams === 'object')
		{
			this.params = arParams;
			this.initConfig();

			if (this.params.MESS)
			{
				this.mess = this.params.MESS;
			}

			switch (this.productType)
			{
				case 0: // no catalog
				case 1: // product
				case 2: // set
				case 7: // service
					this.initProductData();
					break;
				case 3: // sku
					this.initOffersData();
					break;
				default:
					this.errorCode = -1;
			}

			this.initBasketData();
			this.initCompareData();

			this.isFacebookConversionCustomizeProductEventEnabled =
				this.params.IS_FACEBOOK_CONVERSION_CUSTOMIZE_PRODUCT_EVENT_ENABLED
			;
		}

		if (this.errorCode === 0)
		{
			BX.ready(BX.delegate(this.init, this));
		}

		this.params = {};

		BX.addCustomEvent('onSaleProductIsGift', BX.delegate(this.onSaleProductIsGift, this));
		BX.addCustomEvent('onSaleProductIsNotGift', BX.delegate(this.onSaleProductIsNotGift, this));
	};

	window.JCCatalogElement.prototype = {
		getEntity: function(parent, entity, additionalFilter)
		{
			if (!parent || !entity)
				return null;

			additionalFilter = additionalFilter || '';

			return parent.querySelector(additionalFilter + '[data-entity="' + entity + '"]');
		},

		getEntities: function(parent, entity, additionalFilter)
		{
			if (!parent || !entity)
				return {length: 0};

			additionalFilter = additionalFilter || '';

			return parent.querySelectorAll(additionalFilter + '[data-entity="' + entity + '"]');
		},

		onSaleProductIsGift: function(productId, offerId)
		{
			if (offerId && this.offers && this.offers[this.offerNum].ID == offerId)
			{
				this.setGift();
			}
		},

		onSaleProductIsNotGift: function(productId, offerId)
		{
			if (offerId && this.offers && this.offers[this.offerNum].ID == offerId)
			{
				this.restoreSticker();
				this.isGift = false;
				this.setPrice();
			}
		},

		reloadGiftInfo: function()
		{
			if (this.productType === 3)
			{
				this.checkQuantity = true;
				this.maxQuantity = 1;

				this.setPrice();
				this.redrawSticker({text: BX.message('PRODUCT_GIFT_LABEL')});
			}
		},

		setGift: function()
		{
			if (this.productType === 3)
			{
				// sku
				this.isGift = true;
			}

			if (this.productType === 1 || this.productType === 2)
			{
				// simple
				this.isGift = true;
			}

			if (this.productType === 0)
			{
				this.isGift = false;
			}

			this.reloadGiftInfo();
		},

		setOffer: function(offerNum)
		{
			this.offerNum = parseInt(offerNum);
			this.setCurrent();
		},

		init: function()
		{
			var i = 0,
				j = 0,
				treeItems = null;

			this.obProduct = BX(this.visual.ID);
			if (!this.obProduct)
			{
				this.errorCode = -1;
			}

			this.obProductTitle = BX(this.visual.TITLE_ID);

			this.obBigSlider = BX(this.visual.BIG_SLIDER_ID);
			this.node.imageContainer = this.getEntity(this.obProduct, 'images-container');
			this.node.imageSliderBlock = this.getEntity(this.obProduct, 'images-slider-block');
			this.node.sliderProgressBar = this.getEntity(this.obProduct, 'slider-progress-bar');
			this.node.sliderControlLeft = this.getEntity(this.obBigSlider, 'slider-control-left');
			this.node.sliderControlRight = this.getEntity(this.obBigSlider, 'slider-control-right');

			if (!this.obBigSlider || !this.node.imageContainer || !this.node.imageContainer)
			{
				this.errorCode = -2;
			}

			if (this.config.showPrice)
			{
				this.obPrice.price = BX(this.visual.PRICE_ID);
				if (!this.obPrice.price && this.config.useCatalog)
				{
					this.errorCode = -16;
				}
				else
				{
					this.obPrice.total = BX(this.visual.PRICE_TOTAL);

					if (this.config.showOldPrice)
					{
						this.obPrice.full = BX(this.visual.OLD_PRICE_ID);
						this.obPrice.discount = BX(this.visual.DISCOUNT_PRICE_ID);

						if (!this.obPrice.full || !this.obPrice.discount)
						{
							this.config.showOldPrice = false;
						}
					}

					if (this.config.showPercent)
					{
						this.obPrice.percent = BX(this.visual.DISCOUNT_PERCENT_ID);
						if (!this.obPrice.percent)
						{
							this.config.showPercent = false;
						}
					}
				}

				this.obBasketActions = BX(this.visual.BASKET_ACTIONS_ID);
				if (this.obBasketActions)
				{
					if (BX.util.in_array('BUY', this.config.basketAction))
					{
						this.obBuyBtn = BX(this.visual.BUY_LINK);
					}

					if (BX.util.in_array('ADD', this.config.basketAction))
					{
						this.obAddToBasketBtn = BX(this.visual.ADD_BASKET_LINK);
					}
				}
				this.obNotAvail = BX(this.visual.NOT_AVAILABLE_MESS);
			}

			if (this.config.showQuantity)
			{
				this.obQuantity = BX(this.visual.QUANTITY_ID);
				this.node.quantity = this.getEntity(this.obProduct, 'quantity-block');
				if (this.visual.QUANTITY_UP_ID)
				{
					this.obQuantityUp = BX(this.visual.QUANTITY_UP_ID);
				}

				if (this.visual.QUANTITY_DOWN_ID)
				{
					this.obQuantityDown = BX(this.visual.QUANTITY_DOWN_ID);
				}
			}

			if (this.productType === 3)
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

				if (this.visual.QUANTITY_LIMIT && this.config.showMaxQuantity !== 'N')
				{
					this.obQuantityLimit.all = BX(this.visual.QUANTITY_LIMIT);
					if (this.obQuantityLimit.all)
					{
						this.obQuantityLimit.value = this.getEntity(this.obQuantityLimit.all, 'quantity-limit-value');
						if (!this.obQuantityLimit.value)
						{
							this.obQuantityLimit.all = null;
						}
					}
				}

				if (this.config.usePriceRanges)
				{
					this.obPriceRanges = this.getEntity(this.obProduct, 'price-ranges-block');
				}
			}

			if (this.config.showSkuProps)
			{
				this.obSkuProps = BX(this.visual.DISPLAY_PROP_DIV);
				this.obMainSkuProps = BX(this.visual.DISPLAY_MAIN_PROP_DIV);
			}

			if (this.config.showSkuDescription === 'Y')
			{
				this.obDescription = BX(this.visual.DESCRIPTION_ID);
			}

			if (this.config.useCompare)
			{
				this.obCompare = BX(this.visual.COMPARE_LINK);
			}

			if (this.config.useSubscribe)
			{
				this.obSubscribe = BX(this.visual.SUBSCRIBE_LINK);
			}

			this.obTabs = BX(this.visual.TABS_ID);
			this.obTabContainers = BX(this.visual.TAB_CONTAINERS_ID);
			this.obTabsPanel = BX(this.visual.TABS_PANEL_ID);

			this.smallCardNodes.panel = BX(this.visual.SMALL_CARD_PANEL_ID);
			if (this.smallCardNodes.panel)
			{
				this.smallCardNodes.picture = this.getEntity(this.smallCardNodes.panel, 'panel-picture');
				this.smallCardNodes.title = this.getEntity(this.smallCardNodes.panel, 'panel-title');
				this.smallCardNodes.price = this.getEntity(this.smallCardNodes.panel, 'panel-price');
				this.smallCardNodes.sku = this.getEntity(this.smallCardNodes.panel, 'panel-sku-container');
				this.smallCardNodes.oldPrice = this.getEntity(this.smallCardNodes.panel, 'panel-old-price');
				this.smallCardNodes.buyButton = this.getEntity(this.smallCardNodes.panel, 'panel-buy-button');
				this.smallCardNodes.addButton = this.getEntity(this.smallCardNodes.panel, 'panel-add-button');
				this.smallCardNodes.notAvailableButton = this.getEntity(this.smallCardNodes.panel, 'panel-not-available-button');
				this.smallCardNodes.aligner = this.getEntity(this.obProduct, 'main-button-container');
			}

			this.initPopup();
			this.initTabs();
			// the zone is collected off the markup the server printed, so the roles are dropped to
			// the width of the window only once it has been built
			this.createTabsZone();
			this.initTabRoles();

			if (this.smallCardNodes.panel)
			{
				this.smallCardNodes.picture && BX.bind(this.smallCardNodes.picture.parentNode, 'click', BX.proxy(this.scrollToProduct, this));
				this.smallCardNodes.title && BX.bind(this.smallCardNodes.title, 'click', BX.proxy(this.scrollToProduct, this));
				this.smallCardNodes.sku && BX.bind(this.smallCardNodes.sku, 'click', BX.proxy(this.scrollToProduct, this));
			}

			if (this.obTabsPanel || this.smallCardNodes.panel)
			{
				this.checkTopPanels();
				BX.bind(window, 'scroll', BX.proxy(this.checkTopPanels, this));
			}

			if (this.errorCode === 0)
			{
				// product slider events
				if (this.config.showSlider && !this.isTouchDevice)
				{
					BX.bind(this.obBigSlider, 'mouseenter', BX.proxy(this.stopSlider, this));
					BX.bind(this.obBigSlider, 'mouseleave', BX.proxy(this.cycleSlider, this));
				}

				if (this.isTouchDevice)
				{
					BX.bind(this.node.imageContainer, 'touchstart', BX.proxy(this.touchStartEvent, this));
					BX.bind(this.node.imageContainer, 'touchend', BX.proxy(this.touchEndEvent, this));
					BX.bind(this.node.imageContainer, 'touchcancel', BX.proxy(this.touchEndEvent, this));
				}

				BX.bind(this.node.sliderControlLeft, 'click', BX.proxy(this.slidePrev, this));
				BX.bind(this.node.sliderControlRight, 'click', BX.proxy(this.slideNext, this));

				if (this.config.showQuantity)
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
						if (this.product.useSlider)
						{
							this.product.slider = {
								ID: this.visual.SLIDER_CONT_ID,
								CONT: BX(this.visual.SLIDER_CONT_ID),
								COUNT: this.product.sliderCount
							};
							this.product.slider.ITEMS = this.getEntities(this.product.slider.CONT, 'slider-control');
							for (j = 0; j < this.product.slider.ITEMS.length; j++)
							{
								BX.bind(this.product.slider.ITEMS[j], 'mouseenter', BX.delegate(this.onSliderControlHover, this));
								BX.bind(this.product.slider.ITEMS[j], 'mouseleave', BX.delegate(this.onSliderControlLeave, this));
								BX.bind(this.product.slider.ITEMS[j], 'click', BX.delegate(this.selectSliderImg, this));
							}

							this.activateDotsZone(this.product.slider.CONT);

							this.setCurrentImg(this.product.sliderPict[0], true, true);
							this.checkSliderControls(this.product.sliderCount);

							if (this.product.slider.ITEMS.length > 1)
							{
								this.initSlider();
							}
						}

						this.checkQuantityControls();
						this.fixFontCheck();
						this.setAnalyticsDataLayer('showDetail');
						break;
					case 3: // sku
						if (this.obTree)
						{
							treeItems = this.obTree.querySelectorAll('li');
							for (i = 0; i < treeItems.length; i++)
							{
								BX.bind(treeItems[i], 'click', BX.delegate(this.selectOfferProp, this));
							}

							BX.bind(this.obTree, 'keydown', BX.delegate(this.selectOfferPropKey, this));

							this.createSkuZones();
						}

						for (i = 0; i < this.offers.length; i++)
						{
							this.offers[i].SLIDER_COUNT = parseInt(this.offers[i].SLIDER_COUNT, 10) || 0;

							if (this.offers[i].SLIDER_COUNT === 0)
							{
								this.slider.controls[i] = {
									ID: '',
									COUNT: this.offers[i].SLIDER_COUNT,
									ITEMS: []
								};
							}
							else
							{
								for (j = 0; j < this.offers[i].SLIDER.length; j++)
								{
									this.offers[i].SLIDER[j].WIDTH = parseInt(this.offers[i].SLIDER[j].WIDTH, 10);
									this.offers[i].SLIDER[j].HEIGHT = parseInt(this.offers[i].SLIDER[j].HEIGHT, 10);
								}

								this.slider.controls[i] = {
									ID: this.visual.SLIDER_CONT_OF_ID + this.offers[i].ID,
									OFFER_ID: this.offers[i].ID,
									CONT: BX(this.visual.SLIDER_CONT_OF_ID + this.offers[i].ID),
									COUNT: this.offers[i].SLIDER_COUNT
								};

								this.slider.controls[i].ITEMS = this.getEntities(this.slider.controls[i].CONT, 'slider-control');
								for (j = 0; j < this.slider.controls[i].ITEMS.length; j++)
								{
									BX.bind(this.slider.controls[i].ITEMS[j], 'mouseenter', BX.delegate(this.onSliderControlHover, this));
									BX.bind(this.slider.controls[i].ITEMS[j], 'mouseleave', BX.delegate(this.onSliderControlLeave, this));
									BX.bind(this.slider.controls[i].ITEMS[j], 'click', BX.delegate(this.selectSliderImg, this));
								}
							}
						}

						this.setCurrent();
						break;
				}

				this.obBuyBtn && BX.bind(this.obBuyBtn, 'click', BX.proxy(this.buyBasket, this));
				this.smallCardNodes.buyButton && BX.bind(this.smallCardNodes.buyButton, 'click', BX.proxy(this.buyBasket, this));

				this.obAddToBasketBtn && BX.bind(this.obAddToBasketBtn, 'click', BX.proxy(this.add2Basket, this));
				this.smallCardNodes.addButton && BX.bind(this.smallCardNodes.addButton, 'click', BX.proxy(this.add2Basket, this));

				if (this.obCompare)
				{
					BX.bind(this.obCompare, 'click', BX.proxy(this.compare, this));
					BX.addCustomEvent('onCatalogDeleteCompare', BX.proxy(this.checkDeletedCompare, this));
				}
			}
		},

		initConfig: function()
		{
			if (this.params.PRODUCT_TYPE)
			{
				this.productType = parseInt(this.params.PRODUCT_TYPE, 10);
			}

			if (this.params.CONFIG.USE_CATALOG !== 'undefined' && BX.type.isBoolean(this.params.CONFIG.USE_CATALOG))
			{
				this.config.useCatalog = this.params.CONFIG.USE_CATALOG;
			}

			this.config.showQuantity = this.params.CONFIG.SHOW_QUANTITY;
			this.config.showPrice = this.params.CONFIG.SHOW_PRICE;
			this.config.showPercent = this.params.CONFIG.SHOW_DISCOUNT_PERCENT;
			this.config.showOldPrice = this.params.CONFIG.SHOW_OLD_PRICE;
			this.config.showSkuProps = this.params.CONFIG.SHOW_SKU_PROPS;
			this.config.showOfferGroup = this.params.CONFIG.OFFER_GROUP;
			this.config.useCompare = this.params.CONFIG.DISPLAY_COMPARE;
			this.config.useStickers = this.params.CONFIG.USE_STICKERS;
			this.config.useSubscribe = this.params.CONFIG.USE_SUBSCRIBE;
			this.config.showMaxQuantity = this.params.CONFIG.SHOW_MAX_QUANTITY;
			this.config.relativeQuantityFactor = parseInt(this.params.CONFIG.RELATIVE_QUANTITY_FACTOR);
			this.config.usePriceRanges = this.params.CONFIG.USE_PRICE_COUNT;
			this.config.showSkuDescription = this.params.CONFIG.SHOW_SKU_DESCRIPTION;
			this.config.displayPreviewTextMode = this.params.CONFIG.DISPLAY_PREVIEW_TEXT_MODE;

			if (this.params.CONFIG.MAIN_PICTURE_MODE)
			{
				this.config.usePopup = BX.util.in_array('POPUP', this.params.CONFIG.MAIN_PICTURE_MODE);
				this.config.useMagnifier = BX.util.in_array('MAGNIFIER', this.params.CONFIG.MAIN_PICTURE_MODE);
			}

			if (this.params.CONFIG.ADD_TO_BASKET_ACTION)
			{
				this.config.basketAction = this.params.CONFIG.ADD_TO_BASKET_ACTION;
			}

			this.config.showClosePopup = this.params.CONFIG.SHOW_CLOSE_POPUP;
			this.config.templateTheme = this.params.CONFIG.TEMPLATE_THEME || '';
			this.config.showSlider = this.params.CONFIG.SHOW_SLIDER === 'Y';

			if (this.config.showSlider && !this.isTouchDevice)
			{
				this.config.sliderInterval = parseInt(this.params.CONFIG.SLIDER_INTERVAL) || 5000;
			}
			else
			{
				this.config.sliderInterval = false;
			}

			this.config.useEnhancedEcommerce = this.params.CONFIG.USE_ENHANCED_ECOMMERCE === 'Y';
			this.config.dataLayerName = this.params.CONFIG.DATA_LAYER_NAME;
			this.config.brandProperty = this.params.CONFIG.BRAND_PROPERTY;

			this.config.alt = this.params.CONFIG.ALT || '';
			this.config.title = this.params.CONFIG.TITLE || '';

			this.config.magnifierZoomPercent = parseInt(this.params.CONFIG.MAGNIFIER_ZOOM_PERCENT) || 200;

			if (!this.params.VISUAL || typeof this.params.VISUAL !== 'object' || !this.params.VISUAL.ID)
			{
				this.errorCode = -1;
				return;
			}

			this.visual = this.params.VISUAL;
		},

		initProductData: function()
		{
			var j = 0;

			if (this.params.PRODUCT && typeof this.params.PRODUCT === 'object')
			{
				if (this.config.showPrice)
				{
					this.currentPriceMode = this.params.PRODUCT.ITEM_PRICE_MODE;
					this.currentPrices = this.params.PRODUCT.ITEM_PRICES;
					this.currentPriceSelected = this.params.PRODUCT.ITEM_PRICE_SELECTED;
					this.currentQuantityRanges = this.params.PRODUCT.ITEM_QUANTITY_RANGES;
					this.currentQuantityRangeSelected = this.params.PRODUCT.ITEM_QUANTITY_RANGE_SELECTED;
				}

				if (this.config.showQuantity)
				{
					this.product.checkQuantity = this.params.PRODUCT.CHECK_QUANTITY;
					this.product.isDblQuantity = this.params.PRODUCT.QUANTITY_FLOAT;

					if (this.product.checkQuantity)
					{
						this.product.maxQuantity = this.product.isDblQuantity
							? parseFloat(this.params.PRODUCT.MAX_QUANTITY)
							: parseInt(this.params.PRODUCT.MAX_QUANTITY, 10);
					}

					this.product.stepQuantity = this.product.isDblQuantity
						? parseFloat(this.params.PRODUCT.STEP_QUANTITY)
						: parseInt(this.params.PRODUCT.STEP_QUANTITY, 10);
					this.checkQuantity = this.product.checkQuantity;
					this.isDblQuantity = this.product.isDblQuantity;
					this.stepQuantity = this.product.stepQuantity;
					this.maxQuantity = this.product.maxQuantity;
					this.minQuantity = this.currentPriceMode === 'Q' ? parseFloat(this.currentPrices[this.currentPriceSelected].MIN_QUANTITY) : this.stepQuantity;

					if (this.isDblQuantity)
					{
						this.stepQuantity = Math.round(this.stepQuantity * this.precisionFactor) / this.precisionFactor;
					}
				}

				this.product.canBuy = this.params.PRODUCT.CAN_BUY;
				this.canSubscription = this.product.canSubscription = this.params.PRODUCT.SUBSCRIPTION;

				this.product.name = this.params.PRODUCT.NAME;
				this.product.pict = this.params.PRODUCT.PICT;
				this.product.id = this.params.PRODUCT.ID;
				this.product.category = this.params.PRODUCT.CATEGORY;

				if (this.params.PRODUCT.ADD_URL)
				{
					this.product.addUrl = this.params.PRODUCT.ADD_URL;
				}

				if (this.params.PRODUCT.BUY_URL)
				{
					this.product.buyUrl = this.params.PRODUCT.BUY_URL;
				}

				if (this.params.PRODUCT.SLIDER_COUNT)
				{
					this.product.sliderCount = parseInt(this.params.PRODUCT.SLIDER_COUNT, 10) || 0;

					if (this.product.sliderCount > 0 && this.params.PRODUCT.SLIDER.length)
					{
						for (j = 0; j < this.params.PRODUCT.SLIDER.length; j++)
						{
							this.product.useSlider = true;
							this.params.PRODUCT.SLIDER[j].WIDTH = parseInt(this.params.PRODUCT.SLIDER[j].WIDTH, 10);
							this.params.PRODUCT.SLIDER[j].HEIGHT = parseInt(this.params.PRODUCT.SLIDER[j].HEIGHT, 10);
						}

						this.product.sliderPict = this.params.PRODUCT.SLIDER;
						this.setCurrentImg(this.product.sliderPict[0], false);
					}
				}

				this.currentIsSet = true;
			}
			else
			{
				this.errorCode = -1;
			}
		},

		initOffersData: function()
		{
			if (this.params.OFFERS && BX.type.isArray(this.params.OFFERS))
			{
				this.offers = this.params.OFFERS;
				this.offerNum = 0;

				if (this.params.OFFER_SELECTED)
				{
					this.offerNum = parseInt(this.params.OFFER_SELECTED, 10) || 0;
				}

				if (this.params.TREE_PROPS)
				{
					this.treeProps = this.params.TREE_PROPS;
				}

				if (this.params.DEFAULT_PICTURE)
				{
					this.defaultPict.preview = this.params.DEFAULT_PICTURE.PREVIEW_PICTURE;
					this.defaultPict.detail = this.params.DEFAULT_PICTURE.DETAIL_PICTURE;
				}

				if (this.params.PRODUCT && typeof this.params.PRODUCT === 'object')
				{
					this.product.id = parseInt(this.params.PRODUCT.ID, 10);
					this.product.name = this.params.PRODUCT.NAME;
					this.product.category = this.params.PRODUCT.CATEGORY;
					this.product.detailText = this.params.PRODUCT.DETAIL_TEXT;
					this.product.detailTextType = this.params.PRODUCT.DETAIL_TEXT_TYPE;
					this.product.previewText = this.params.PRODUCT.PREVIEW_TEXT;
					this.product.previewTextType = this.params.PRODUCT.PREVIEW_TEXT_TYPE;
				}
			}
			else
			{
				this.errorCode = -1;
			}
		},

		initBasketData: function()
		{
			if (this.params.BASKET && typeof this.params.BASKET === 'object')
			{
				if (
					this.productType === 1
					|| this.productType === 2
					|| this.productType === 7
				)
				{
					this.basketData.useProps = this.params.BASKET.ADD_PROPS;
					this.basketData.emptyProps = this.params.BASKET.EMPTY_PROPS;
				}

				if (this.params.BASKET.QUANTITY)
				{
					this.basketData.quantity = this.params.BASKET.QUANTITY;
				}

				if (this.params.BASKET.PROPS)
				{
					this.basketData.props = this.params.BASKET.PROPS;
				}

				if (this.params.BASKET.BASKET_URL)
				{
					this.basketData.basketUrl = this.params.BASKET.BASKET_URL;
				}

				if (this.productType === 3)
				{
					if (this.params.BASKET.SKU_PROPS)
					{
						this.basketData.sku_props = this.params.BASKET.SKU_PROPS;
					}
				}

				if (this.params.BASKET.ADD_URL_TEMPLATE)
				{
					this.basketData.add_url = this.params.BASKET.ADD_URL_TEMPLATE;
				}

				if (this.params.BASKET.BUY_URL_TEMPLATE)
				{
					this.basketData.buy_url = this.params.BASKET.BUY_URL_TEMPLATE;
				}

				if (this.basketData.add_url === '' && this.basketData.buy_url === '')
				{
					this.errorCode = -1024;
				}
			}
		},

		initCompareData: function()
		{
			if (this.config.useCompare)
			{
				if (this.params.COMPARE && typeof this.params.COMPARE === 'object')
				{
					if (this.params.COMPARE.COMPARE_PATH)
					{
						this.compareData.comparePath = this.params.COMPARE.COMPARE_PATH;
					}

					if (this.params.COMPARE.COMPARE_URL_TEMPLATE)
					{
						this.compareData.compareUrl = this.params.COMPARE.COMPARE_URL_TEMPLATE;
					}
					else
					{
						this.config.useCompare = false;
					}

					if (this.params.COMPARE.COMPARE_DELETE_URL_TEMPLATE)
					{
						this.compareData.compareDeleteUrl = this.params.COMPARE.COMPARE_DELETE_URL_TEMPLATE;
					}
					else
					{
						this.config.useCompare = false;
					}
				}
				else
				{
					this.config.useCompare = false;
				}
			}
		},

		initSlider: function()
		{
			if (this.node.sliderProgressBar)
			{
				if (this.slider.progress)
				{
					this.resetProgress();
				}
				else
				{
					this.slider.progress = new BX.easing({
						transition: BX.easing.transitions.linear,
						step: BX.delegate(function(state){
							this.node.sliderProgressBar.style.width = state.width / 10 + '%';
						}, this)
					});
				}
			}

			this.cycleSlider();
		},

		setAnalyticsDataLayer: function(action)
		{
			if (!this.config.useEnhancedEcommerce || !this.config.dataLayerName)
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
						'category': this.product.category,
						'brand': BX.type.isArray(this.config.brandProperty) ? this.config.brandProperty.join('/') : this.config.brandProperty
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
						'category': this.product.category,
						'brand': BX.type.isArray(this.config.brandProperty) ? this.config.brandProperty.join('/') : this.config.brandProperty,
						'variant': variants.join('/')
					};
					break;
			}

			switch (action)
			{
				case 'showDetail':
					info = {
						'ecommerce': {
							'currencyCode': this.currentPrices[this.currentPriceSelected] && this.currentPrices[this.currentPriceSelected].CURRENCY || '',
							'detail': {
								'products': [{
									'name': item.name || '',
									'id': item.id || '',
									'price': item.price || 0,
									'brand': item.brand || '',
									'category': item.category || '',
									'variant': item.variant || ''
								}]
							}
						}
					};
					break;
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
									'quantity': this.config.showQuantity && this.obQuantity ? this.obQuantity.value : 1
								}]
							}
						}
					};
					break;
			}

			window[this.config.dataLayerName] = window[this.config.dataLayerName] || [];
			window[this.config.dataLayerName].push(info);
		},

		initTabs: function()
		{
			var tabs = this.getEntities(this.obTabs, 'tab'),
				panelTabs = this.getEntities(this.obTabsPanel, 'tab');

			var	tabValue, targetTab, haveActive = false;

			if (tabs.length !== panelTabs.length)
				return;

			for (var i in tabs)
			{
				if (tabs.hasOwnProperty(i) && BX.type.isDomNode(tabs[i]))
				{
					tabValue = tabs[i].getAttribute('data-value');
					if (tabValue)
					{
						targetTab = this.obTabContainers.querySelector('[data-value="' + tabValue + '"]');
						if (BX.type.isDomNode(targetTab))
						{
							BX.bind(tabs[i], 'click', BX.proxy(this.changeTab, this));
							BX.bind(panelTabs[i], 'click', BX.proxy(this.changeTab, this));

							if (!haveActive)
							{
								BX.addClass(tabs[i], 'active');
								BX.addClass(panelTabs[i], 'active');
								this.setTabSelected(tabs[i], true);
								this.setTabCurrent(panelTabs[i], true);
								BX.show(targetTab);
								haveActive = true;
							}
							else
							{
								BX.removeClass(tabs[i], 'active');
								BX.removeClass(panelTabs[i], 'active');
								this.setTabSelected(tabs[i], false);
								this.setTabCurrent(panelTabs[i], false);
								BX.hide(targetTab);
							}
						}
					}
				}
			}
		},

		// Selection stays detached from focus: the arrows only move it, Enter and Space click the
		// button. Opening a tab scrolls the page down to the panel, and that stays with the click.
		createTabsZone: function()
		{
			var accessibility = getAccessibility();

			if (this.tabsFocusZone || !accessibility || !this.obTabs)
			{
				return;
			}

			// the zone lives exactly where the role does: an empty strip carries neither
			var list = this.obTabs.querySelector('[role="tablist"]');

			if (!list)
			{
				return;
			}

			var keys = accessibility.FocusKeys;

			this.tabsFocusZone = new accessibility.FocusZone(list, {
				bindKeys: keys.ArrowHorizontal | keys.HomeAndEnd,
				focusOutBehavior: 'wrap',
				focusInStrategy: BX.delegate(function() {
					return this.getTabsTabStop(list);
				}, this)
			});

			// the zone collects its set by visibility, so activation waits for the first frame
			requestAnimationFrame(BX.delegate(this.startTabsZone, this));

			// below 992px the strip is hidden, so a page opened narrow gives the zone an empty set;
			// widening the window brings the tabs back and the set has to be collected again
			BX.bind(window, 'resize', BX.delegate(this.refreshTabsZone, this));
		},

		startTabsZone: function()
		{
			if (this.tabsFocusZone && !this.tabsFocusZone.isActive())
			{
				this.tabsFocusZone.activate();
			}
		},

		refreshTabsZone: function()
		{
			if (!this.tabsFocusZone || this.tabsZoneRefreshPending)
			{
				return;
			}

			this.tabsZoneRefreshPending = true;

			requestAnimationFrame(BX.delegate(function() {
				this.tabsZoneRefreshPending = false;
				this.startTabsZone();
				this.tabsFocusZone.refreshElements();
			}, this));
		},

		/* Below 992px the styles hide the strip of tabs and open every section at once, so a reader
		   would be handed two or three panels of a tab with no tab anywhere to open them. The roles
		   are printed for the wide layout and taken off with the strip, so a page opened narrow
		   takes them off at once and a window widened later gets them back. */
		initTabRoles: function()
		{
			if (!this.obTabs || !window.matchMedia)
			{
				return;
			}

			var query = window.matchMedia(TABS_NARROW_QUERY);

			this.setTabRoles(!query.matches);

			query.addEventListener('change', BX.delegate(function(event) {
				this.setTabRoles(!event.matches);
				this.refreshTabsZone();
			}, this));
		},

		// The strip is a list of tabs, its buttons are the tabs, and the sections below are their
		// panels: the three of them carry the roles, and none of them keeps one without the others.
		// The tab that is open is read off the class the script keeps on it, so a switch made while
		// the roles were off is not lost when they come back.
		setTabRoles: function(on)
		{
			var list = this.obTabs.querySelector('.product-item-detail-tabs-list');
			var tabs = this.getEntities(this.obTabs, 'tab');
			var containers = this.getEntities(this.obTabContainers, 'tab-container');
			var control, i;

			// a product that prints no tab prints an empty strip, and an empty strip is no list of
			// tabs at any width
			if (!tabs.length)
			{
				return;
			}

			if (list)
			{
				writeAttr(list, 'role', on ? 'tablist' : null);
			}

			for (i = 0; i < tabs.length; i++)
			{
				control = tabs[i].querySelector('.product-item-detail-tab-link');

				if (!control)
				{
					continue;
				}

				writeAttr(control, 'role', on ? 'tab' : null);

				if (on)
				{
					this.setTabSelected(tabs[i], BX.hasClass(tabs[i], 'active'));
				}
				else
				{
					control.removeAttribute('aria-selected');
				}
			}

			// The role of a section changes with the width, its name stays: below the breakpoint the
			// section opens no tab, but it is still a named block of the card — the way the gallery
			// and the two sticky panels are named — and a section left nameless would run into the
			// next one. The name is printed by the server and comes off the button of the tab, which
			// names the block just as well while the strip is hidden.
			for (i = 0; i < containers.length; i++)
			{
				containers[i].setAttribute('role', on ? 'tabpanel' : 'group');
			}
		},

		getTabsTabStop: function(list)
		{
			return list.querySelector('[role="tab"][aria-selected="true"]')
				|| list.querySelector('[role="tab"]');
		},

		// The class and the role live on different nodes: data-entity="tab" is the <li>, and the tab
		// the reader sees is the button inside it. The sticky strip carries no role, so its items
		// answer with nothing and the selected state stays on the main strip alone.
		setTabSelected: function(tab, selected)
		{
			var control = tab.querySelector('[role="tab"]');

			if (control)
			{
				control.setAttribute('aria-selected', selected ? 'true' : 'false');
			}
		},

		/* The sticky strip carries no tab roles, and without a role there is nothing to hold
		   aria-selected. The open section is told there by aria-current, which needs no role. */
		setTabCurrent: function(tab, current)
		{
			var control = tab.querySelector('.product-item-detail-tab-link');

			if (control)
			{
				control.setAttribute('aria-current', current ? 'true' : 'false');
			}
		},

		/* The sticky strip slides away as soon as the page scrolls to the tabs below, and the browser
		   drops the focus of a hidden node on the body. The scroll runs on every press of the strip,
		   the one that opens another section and the one that lands on the section already open, so
		   both hand the focus over to the panel that ends up open, the way the sticky card hands it
		   over to the heading: the panel takes focus by script alone and is no stop of its own. The
		   twin tab of the main strip would do as well, but it is managed by a focus zone, and a focus
		   put there from the outside leaves the zone pointing at the tab it kept before. */
		focusTabPanel: function(tabValue)
		{
			var selector = '[data-entity="tab-container"][data-value="' + tabValue + '"]',
				container = this.obTabContainers.querySelector(selector);

			if (container)
			{
				container.focus({preventScroll: true});
			}
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
					this.slideNext();
				}

				if (deltaX < 0)
				{
					this.slidePrev();
				}
			}
		},

		cycleSlider: function(event)
		{
			event || (this.slider.paused = false);

			this.slider.interval && clearInterval(this.slider.interval);

			if (this.config.sliderInterval && !this.slider.paused)
			{
				if (this.slider.progress)
				{
					this.slider.progress.stop();

					var width = parseInt(this.node.sliderProgressBar.style.width);

					this.slider.progress.options.duration = this.config.sliderInterval * (100 - width) / 100;
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
					this.slider.interval = setInterval(BX.proxy(this.slideNext, this), this.config.sliderInterval);
				}
			}
		},

		stopSlider: function(event)
		{
			event || (this.slider.paused = true);

			this.slider.interval && (this.slider.interval = clearInterval(this.slider.interval));

			if (this.slider.progress)
			{
				this.slider.progress.stop();

				var width = parseInt(this.node.sliderProgressBar.style.width);

				this.slider.progress.options.duration = this.config.sliderInterval * width / 200;
				this.slider.progress.options.start = {width: width * 10};
				this.slider.progress.options.finish = {width: 0};
				this.slider.progress.options.complete = null;
				this.slider.progress.animate();
			}
		},

		resetProgress: function()
		{
			this.slider.progress && this.slider.progress.stop();
			this.node.sliderProgressBar.style.width = 0;
		},

		slideNext: function()
		{
			return this.slide('next');
		},

		slidePrev: function()
		{
			return this.slide('prev');
		},

		slide: function(type)
		{
			if (!this.product.slider || !this.product.slider.CONT)
				return;

			var active = this.getEntity(this.product.slider.CONT, 'slider-control', '.active'),
				next = this.getItemForDirection(type, active);

			BX.removeClass(active, 'active');
			this.selectSliderImg(next);

			this.slider.interval && this.cycleSlider();
		},

		getItemForDirection: function(direction, active)
		{
			var activeIndex = this.getItemIndex(active),
				delta = direction === 'prev' ? -1 : 1,
				itemIndex = (activeIndex + delta) % this.product.slider.COUNT;

			return this.eq(this.product.slider.ITEMS, itemIndex);
		},

		getItemIndex: function(item)
		{
			return BX.util.array_values(this.product.slider.ITEMS).indexOf(item);
		},

		eq: function(obj, i)
		{
			var len = obj.length,
				j = +i + (i < 0 ? len : 0);

			return j >= 0 && j < len ? obj[j] : {};
		},

		scrollToProduct: function()
		{
			var scrollTop = BX.GetWindowScrollPos().scrollTop,
				containerTop = BX.pos(this.obProduct).top - 30;

			if (scrollTop > containerTop)
			{
				new BX.easing({
					duration: 500,
					start: {scroll: scrollTop},
					finish: {scroll: containerTop},
					transition: BX.easing.makeEaseOut(BX.easing.transitions.quint),
					step: BX.delegate(function(state){
						window.scrollTo(0, state.scroll);
					}, this),
					complete: BX.delegate(this.focusProduct, this)
				}).animate();
			}
			else
			{
				this.focusProduct();
			}
		},

		/* The panel that brought us here slides away and turns invisible, and the browser drops the
		   focus of a hidden node on the body: the next Tab would start over from the top of the page.
		   So focus goes to the card itself - to its heading, or to the card when the component prints
		   no heading. Neither node is a stop of its own: both take focus by script alone. */
		focusProduct: function()
		{
			var target = this.obProductTitle || this.obProduct;

			if (target)
			{
				target.focus({preventScroll: true});
			}
		},

		checkTopPanels: function()
		{
			var scrollTop = BX.GetWindowScrollPos().scrollTop,
				targetPos;

			if (this.smallCardNodes.panel)
			{
				targetPos = BX.pos(this.smallCardNodes.aligner).bottom - 50;

				if (scrollTop > targetPos)
				{
					BX.addClass(this.smallCardNodes.panel, 'active');
				}
				else if (BX.hasClass(this.smallCardNodes.panel, 'active'))
				{
					BX.removeClass(this.smallCardNodes.panel, 'active');
				}
			}

			if (this.obTabsPanel)
			{
				targetPos = BX.pos(this.obTabs).top;

				if (scrollTop + 73 > targetPos)
				{
					BX.addClass(this.obTabsPanel, 'active');
				}
				else if (BX.hasClass(this.obTabsPanel, 'active'))
				{
					BX.removeClass(this.obTabsPanel, 'active');
				}
			}
		},

		changeTab: function(event)
		{
			BX.PreventDefault(event);

			var initiator = BX.proxy_context,
				targetTabValue = initiator && initiator.getAttribute('data-value'),
				containers, tabs, panelTabs;

			if (!BX.hasClass(initiator, 'active') && targetTabValue)
			{
				this.announceTabChange(initiator);

				containers = this.getEntities(this.obTabContainers, 'tab-container');
				for (var i in containers)
				{
					if (containers.hasOwnProperty(i) && BX.type.isDomNode(containers[i]))
					{
						if (containers[i].getAttribute('data-value') === targetTabValue)
						{
							BX.show(containers[i]);
						}
						else
						{
							BX.hide(containers[i]);
						}
					}
				}

				tabs = this.getEntities(this.obTabs, 'tab');
				panelTabs = this.getEntities(this.obTabsPanel, 'tab');

				for (i in tabs)
				{
					if (tabs.hasOwnProperty(i) && BX.type.isDomNode(tabs[i]))
					{
						if (tabs[i].getAttribute('data-value') === targetTabValue)
						{
							BX.addClass(tabs[i], 'active');
							BX.addClass(panelTabs[i], 'active');
							this.setTabSelected(tabs[i], true);
							this.setTabCurrent(panelTabs[i], true);
						}
						else
						{
							BX.removeClass(tabs[i], 'active');
							BX.removeClass(panelTabs[i], 'active');
							this.setTabSelected(tabs[i], false);
							this.setTabCurrent(panelTabs[i], false);
						}
					}
				}
			}

			if (targetTabValue && this.obTabsPanel && this.obTabsPanel.contains(initiator))
			{
				this.focusTabPanel(targetTabValue);
			}

			var scrollTop = BX.GetWindowScrollPos().scrollTop,
				containerTop = BX.pos(this.obTabContainers).top;

			if (scrollTop + 150 > containerTop)
			{
				new BX.easing({
					duration: 500,
					start: {scroll: scrollTop},
					finish: {scroll: containerTop - 150},
					transition: BX.easing.makeEaseOut(BX.easing.transitions.quint),
					step: BX.delegate(function(state){
						window.scrollTo(0, state.scroll);
					}, this)
				}).animate();
			}
		},

		initPopup: function()
		{
			if (this.config.usePopup)
			{
				this.node.imageContainer.style.cursor = 'zoom-in';
				BX.bind(this.node.imageContainer, 'click', BX.delegate(this.toggleMainPictPopup, this));
				BX.bind(document, 'keyup', BX.proxy(this.closeByEscape, this));
				BX.bind(
					this.getEntity(this.obBigSlider, 'close-popup'),
					'click',
					BX.proxy(this.hideMainPictPopup, this)
				);
			}
		},

		checkSliderControls: function(count)
		{
			var display = count > 1 ? '' : 'none';

			this.node.sliderControlLeft && (this.node.sliderControlLeft.style.display = display);
			this.node.sliderControlRight && (this.node.sliderControlRight.style.display = display);
		},

		// Every offer has its own thumbnails container, and only the shown one carries the zone.
		activateDotsZone: function(container)
		{
			var accessibility = getAccessibility();

			if (!BX.type.isElementNode(container) || !accessibility)
			{
				return;
			}

			if (this.dotsFocusZone && this.dotsFocusZoneCont === container)
			{
				return;
			}

			this.removeDotsZone(this.dotsFocusZoneCont);

			this.dotsFocusZoneCont = container;
			this.dotsFocusZone = this.getDotsZone(container);

			// the zone collects its set by visibility, so activation waits for the first frame
			requestAnimationFrame(BX.delegate(this.startDotsZone, this));
		},

		// A zone is bound to its container for life, so every container keeps its own one and
		// switching an offer only turns the zones off and on.
		getDotsZone: function(container)
		{
			for (var i = 0; i < this.dotsZones.length; i++)
			{
				if (this.dotsZones[i].container === container)
				{
					return this.dotsZones[i].zone;
				}
			}

			var accessibility = getAccessibility();
			var keys = accessibility.FocusKeys;

			var zone = new accessibility.FocusZone(container, {
				bindKeys: keys.ArrowHorizontal | keys.ArrowVertical | keys.HomeAndEnd,
				focusOutBehavior: 'wrap',
				focusInStrategy: BX.delegate(function() {
					return this.getDotsTabStop(container);
				}, this),
				getNextFocusable: BX.delegate(function(direction, from) {
					return this.getNextDot(container, direction, from);
				}, this)
			});

			this.dotsZones.push({container: container, zone: zone});

			return zone;
		},

		startDotsZone: function()
		{
			if (this.dotsFocusZone && !this.dotsFocusZone.isActive())
			{
				this.dotsFocusZone.activate();
			}
		},

		// Called for every hidden container, so the zone goes away only with its own one.
		removeDotsZone: function(container)
		{
			if (!this.dotsFocusZone || this.dotsFocusZoneCont !== container)
			{
				return;
			}

			this.dotsFocusZone.deactivate();
			this.dotsFocusZone = null;
			this.dotsFocusZoneCont = null;
		},

		getDotsTabStop: function(container)
		{
			return this.getEntity(container, 'slider-control', '.active')
				|| this.getEntity(container, 'slider-control');
		},

		// The arrows, Home and End change the photo right away, so the thumbnail the zone is
		// about to focus is switched through the same path a click takes: showing the photo is
		// the only thing a thumbnail does. Wrapping is done here as well: the zone falls back
		// to its own navigation only on an empty answer.
		getNextDot: function(container, direction, from)
		{
			var navigator = BX.UI.Accessibility.FocusNavigator;
			var options = {from: from || undefined, tabbableOnly: false, wrap: true};
			var nextDot;

			switch (direction)
			{
				case 'previous':
					nextDot = navigator.getPrevious(container, options);
					break;
				case 'next':
					nextDot = navigator.getNext(container, options);
					break;
				case 'start':
					nextDot = navigator.getFirst(container, options);
					break;
				default:
					nextDot = navigator.getLast(container, options);
					break;
			}

			if (nextDot)
			{
				this.selectSliderImg(nextDot);
			}

			return nextDot;
		},

		createSkuZones: function()
		{
			if (this.skuFocusZones.length || !getAccessibility())
			{
				return;
			}

			var lineContainer = this.getEntities(this.obTree, 'sku-line-block');
			var list;

			for (var i = 0; i < lineContainer.length; i++)
			{
				list = lineContainer[i].querySelector('ul');
				// a group without a list keeps its slot: updateRow addresses zones by line index
				this.skuFocusZones.push(list ? this.createSkuZone(list) : null);
			}

			// the zone collects its set by visibility, so activation waits for the first frame
			requestAnimationFrame(BX.delegate(this.startSkuZones, this));
		},

		// As in a radio group, the choice follows the focus: the zone moves it over the shown values,
		// wrapping at either end, and selectOfferPropKey then picks the value the zone has focused.
		createSkuZone: function(list)
		{
			var accessibility = getAccessibility();
			var keys = accessibility.FocusKeys;

			return new accessibility.FocusZone(list, {
				bindKeys: keys.ArrowHorizontal | keys.ArrowVertical | keys.HomeAndEnd,
				focusOutBehavior: 'wrap',
				focusInStrategy: BX.delegate(function() {
					return this.getSkuTabStop(list);
				}, this)
			});
		},

		startSkuZones: function()
		{
			for (var i = 0; i < this.skuFocusZones.length; i++)
			{
				if (this.skuFocusZones[i] && !this.skuFocusZones[i].isActive())
				{
					this.skuFocusZones[i].activate();
				}
			}
		},

		// The zone ignores a node outside the set it manages, and that set holds only the values
		// shown on the page. The chosen value may be hidden or carried by no offer, so the entry
		// point falls back to the first value that is both shown and allowed.
		getSkuTabStop: function(list)
		{
			var accessibility = getAccessibility();

			if (!accessibility)
			{
				return null;
			}

			var checker = accessibility.InteractivityChecker;
			var values = list.querySelectorAll('[role="radio"]');
			var chosen = null;
			var firstAllowed = null;
			var firstShown = null;
			var value;

			for (var i = 0; i < values.length; i++)
			{
				value = values[i];

				if (!checker.isFocusable(value))
				{
					continue;
				}

				firstShown = firstShown || value;

				if (checker.isDisabled(value))
				{
					continue;
				}

				firstAllowed = firstAllowed || value;

				if (value.getAttribute('aria-checked') === 'true')
				{
					chosen = value;
				}
			}

			return chosen || firstAllowed || firstShown;
		},

		setCurrentImg: function(img, showImage, showPanelImage)
		{
			var images, l;

			this.currentImg.id = img.ID;
			this.currentImg.src = img.SRC;
			this.currentImg.width = img.WIDTH;
			this.currentImg.height = img.HEIGHT;

			if (showImage && this.node.imageContainer)
			{
				images = this.getEntities(this.node.imageContainer, 'image');
				l = images.length;
				while (l--)
				{
					if (images[l].getAttribute('data-id') == img.ID)
					{
						if (!BX.hasClass(images[l], 'active'))
						{
							this.node.sliderProgressBar && this.resetProgress();
						}

						BX.addClass(images[l], 'active');
						images[l].removeAttribute('aria-hidden');
					}
					else
					{
						if (BX.hasClass(images[l], 'active'))
						{
							BX.removeClass(images[l], 'active');
						}

						images[l].setAttribute('aria-hidden', 'true');
					}
				}
			}

			if (showPanelImage && this.smallCardNodes.picture)
			{
				this.smallCardNodes.picture.setAttribute('src', this.currentImg.src);
			}

			if (this.config.useMagnifier && !this.isTouchDevice)
			{
				this.setMagnifierParams();

				if (showImage)
				{
					this.disableMagnifier(true);
				}
			}
		},

		setMagnifierParams: function()
		{
			var images = this.getEntities(this.node.imageContainer, 'image'),
				l = images.length,
				current;

			while (l--)
			{
				// disable image title show
				current = images[l].querySelector('img');
				current.setAttribute('data-title', current.getAttribute('title') || '');
				current.removeAttribute('title');

				if (images[l].getAttribute('data-id') == this.currentImg.id)
				{
					BX.unbind(this.currentImg.node, 'mouseover', BX.proxy(this.enableMagnifier, this));

					this.currentImg.node = current;
					this.currentImg.node.style.backgroundImage = 'url(\'' + this.currentImg.src + '\')';
					this.currentImg.node.style.backgroundSize = '100% auto';

					BX.bind(this.currentImg.node, 'mouseover', BX.proxy(this.enableMagnifier, this));
				}
			}
		},

		enableMagnifier: function()
		{
			BX.bind(document, 'mousemove', BX.proxy(this.moveMagnifierArea, this));
		},

		disableMagnifier: function(animateSize)
		{
			if (!this.magnify.enabled)
				return;

			clearTimeout(this.magnify.timer);
			BX.removeClass(this.obBigSlider, 'magnified');
			this.magnify.enabled = false;

			this.currentImg.node.style.backgroundSize = '100% auto';
			if (animateSize)
			{
				// set initial size for css animation
				this.currentImg.node.style.height = this.magnify.height + 'px';
				this.currentImg.node.style.width = this.magnify.width + 'px';

				this.magnify.timer = setTimeout(
					BX.delegate(function(){
						this.currentImg.node.src = this.currentImg.src;
						this.currentImg.node.style.height = '';
						this.currentImg.node.style.width = '';
					}, this),
					250
				);
			}
			else
			{
				this.currentImg.node.src = this.currentImg.src;
				this.currentImg.node.style.height = '';
				this.currentImg.node.style.width = '';
			}

			BX.unbind(document, 'mousemove', BX.proxy(this.moveMagnifierArea, this));
		},

		moveMagnifierArea: function(e)
		{
			var posBigImg = BX.pos(this.currentImg.node),
				currentPos = this.inRect(e, posBigImg);

			if (this.inBound(posBigImg, currentPos))
			{
				var posPercentX = (currentPos.X / this.currentImg.node.width) * 100,
					posPercentY = (currentPos.Y / this.currentImg.node.height) * 100,
					resolution, sliderWidth, w, h, zoomPercent;

				this.currentImg.node.style.backgroundPosition = posPercentX + '% ' + posPercentY + '%';

				if (!this.magnify.enabled)
				{
					clearTimeout(this.magnify.timer);
					BX.addClass(this.obBigSlider, 'magnified');

					// set initial size for css animation
					this.currentImg.node.style.height = (this.magnify.height = this.currentImg.node.clientHeight) + 'px';
					this.currentImg.node.style.width = (this.magnify.width = this.currentImg.node.offsetWidth) + 'px';

					resolution = this.currentImg.width / this.currentImg.height;
					sliderWidth = this.obBigSlider.offsetWidth;

					if (sliderWidth > this.currentImg.width && !BX.hasClass(this.obBigSlider, 'popup'))
					{
						w = sliderWidth;
						h = w / resolution;
						zoomPercent = 100;
					}
					else
					{
						w = this.currentImg.width;
						h = this.currentImg.height;
						zoomPercent = this.config.magnifierZoomPercent > 100 ? this.config.magnifierZoomPercent : 100;
					}

					// base64 transparent pixel
					this.currentImg.node.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQI12P4zwAAAgEBAKrChTYAAAAASUVORK5CYII=';
					this.currentImg.node.style.backgroundSize = zoomPercent + '% auto';

					// set target size
					this.magnify.timer = setTimeout(BX.delegate(function(){
							this.currentImg.node.style.height = h + 'px';
							this.currentImg.node.style.width = w + 'px';
						}, this),
						10
					);
				}

				this.magnify.enabled = true;
			}
			else
			{
				this.disableMagnifier(true);
			}
		},

		inBound: function(rect, point)
		{
			return (
				(point.Y >= 0 && rect.height >= point.Y)
				&& (point.X >= 0 && rect.width >= point.X)
			);
		},

		inRect: function(e, rect)
		{
			var wndSize = BX.GetWindowSize(),
				currentPos = {
					X: 0,
					Y: 0,
					globalX: 0,
					globalY: 0
				};

			currentPos.globalX = e.clientX + wndSize.scrollLeft;

			if (e.offsetX && e.offsetX < 0)
			{
				currentPos.globalX -= e.offsetX;
			}

			currentPos.X = currentPos.globalX - rect.left;
			currentPos.globalY = e.clientY + wndSize.scrollTop;

			if (e.offsetY && e.offsetY < 0)
			{
				currentPos.globalY -= e.offsetY;
			}

			currentPos.Y = currentPos.globalY - rect.top;

			return currentPos;
		},

		setProductMainPict: function(intPict)
		{
			var indexPict = -1,
				i = 0,
				j = 0,
				value = '';

			if (this.product.sliderCount)
			{
				for (j = 0; j < this.product.sliderPict.length; j++)
				{
					if (intPict === this.product.sliderPict[j].ID)
					{
						indexPict = j;
						break;
					}
				}

				if (indexPict > -1)
				{
					if (this.product.sliderPict[indexPict])
					{
						this.setCurrentImg(this.product.sliderPict[indexPict], true);
					}

					for (i = 0; i < this.product.slider.ITEMS.length; i++)
					{
						value = this.product.slider.ITEMS[i].getAttribute('data-value');

						if (value === intPict)
						{
							BX.addClass(this.product.slider.ITEMS[i], 'active');
						}
						else if (BX.hasClass(this.product.slider.ITEMS[i], 'active'))
						{
							BX.removeClass(this.product.slider.ITEMS[i], 'active');
						}

						this.product.slider.ITEMS[i].setAttribute('aria-pressed', value === intPict ? 'true' : 'false');
					}
				}
			}
		},

		onSliderControlHover: function()
		{
			var target = BX.proxy_context;

			this.mouseTimer = setTimeout(
				BX.delegate(function(){
					this.selectSliderImg(target);
				}, this),
				200
			);
		},

		onSliderControlLeave: function()
		{
			clearTimeout(this.mouseTimer);
			this.mouseTimer = null;
		},

		selectSliderImg: function(target)
		{
			var strValue = '',
				arItem = [];

			target = BX.type.isDomNode(target) ? target : BX.proxy_context;

			if (target && target.hasAttribute('data-value'))
			{
				strValue = target.getAttribute('data-value');

				if (strValue.indexOf('_') !== -1)
				{
					arItem = strValue.split('_');
					this.setMainPict(arItem[0], arItem[1]);
				}
				else
				{
					this.setProductMainPict(strValue);
				}
			}
		},

		setMainPict: function(intSlider, intPict, changePanelPict)
		{
			var index = -1,
				indexPict = -1,
				i,
				j,
				value = '',
				strValue = '';

			for (i = 0; i < this.offers.length; i++)
			{
				if (intSlider === this.offers[i].ID)
				{
					index = i;
					break;
				}
			}

			if (index > -1)
			{
				if (this.offers[index].SLIDER_COUNT > 0)
				{
					for (j = 0; j < this.offers[index].SLIDER.length; j++)
					{
						if (intPict === this.offers[index].SLIDER[j].ID)
						{
							indexPict = j;
							break;
						}
					}

					if (indexPict > -1)
					{
						if (this.offers[index].SLIDER[indexPict])
						{
							this.setCurrentImg(this.offers[index].SLIDER[indexPict], true, changePanelPict);
						}

						strValue = intSlider + '_' + intPict;

						for (i = 0; i < this.product.slider.ITEMS.length; i++)
						{
							value = this.product.slider.ITEMS[i].getAttribute('data-value');

							if (value === strValue)
							{
								BX.addClass(this.product.slider.ITEMS[i], 'active');
							}
							else if (BX.hasClass(this.product.slider.ITEMS[i], 'active'))
							{
								BX.removeClass(this.product.slider.ITEMS[i], 'active');
							}

							this.product.slider.ITEMS[i].setAttribute('aria-pressed', value === strValue ? 'true' : 'false');
						}
					}
				}
			}
		},

		setMainPictFromItem: function(index)
		{
			if (this.node.imageContainer)
			{
				var boolSet = false,
					obNewPict = {};

				if (this.offers[index])
				{
					if (this.offers[index].DETAIL_PICTURE)
					{
						obNewPict = this.offers[index].DETAIL_PICTURE;
						boolSet = true;
					}
					else if (this.offers[index].PREVIEW_PICTURE)
					{
						obNewPict = this.offers[index].PREVIEW_PICTURE;
						boolSet = true;
					}
				}

				if (!boolSet)
				{
					if (this.defaultPict.detail)
					{
						obNewPict = this.defaultPict.detail;
						boolSet = true;
					}
					else if (this.defaultPict.preview)
					{
						obNewPict = this.defaultPict.preview;
						boolSet = true;
					}
				}

				if (boolSet)
				{
					this.setCurrentImg(obNewPict, true, true);
				}
			}
		},

		toggleMainPictPopup: function()
		{
			if (BX.hasClass(this.obBigSlider, 'popup'))
			{
				this.hideMainPictPopup();
			}
			else
			{
				this.showMainPictPopup();
			}
		},

		showMainPictPopup: function()
		{
			this.config.useMagnifier && this.disableMagnifier(false);
			BX.addClass(this.obBigSlider, 'popup');
			this.node.imageContainer.style.cursor = '';
			// remove double scroll bar
			document.body.style.overflow = 'hidden';
			// the class goes first: without it the close button is display:none and cannot take focus
			this.activateGalleryTrap();
		},

		hideMainPictPopup: function()
		{
			// the trap goes first: the close button holding the focus disappears with the class
			this.deactivateGalleryTrap();
			this.config.useMagnifier && this.disableMagnifier(false);
			BX.removeClass(this.obBigSlider, 'popup');
			this.node.imageContainer.style.cursor = 'zoom-in';
			// remove double scroll bar
			document.body.style.overflow = '';
		},

		// The layer is the whole gallery container, so the zoom button, the thumbnails and the close
		// button all live inside the trap and the focus never left it on its own. The return is needed
		// for another reason: the close button is hidden outside the layer, and the focus would fall
		// onto <body> after closing.
		activateGalleryTrap: function()
		{
			var accessibility = getAccessibility();

			if (!accessibility)
			{
				return;
			}

			this.saveGalleryAttrs();
			this.parkGalleryOpener();

			this.obBigSlider.setAttribute('role', 'dialog');
			this.obBigSlider.setAttribute('aria-modal', 'true');

			var layerName = BX.message('GALLERY_ZOOM_LAYER_ARIA');
			if (BX.type.isNotEmptyString(layerName))
			{
				this.obBigSlider.setAttribute('aria-label', layerName);
			}

			if (!this.galleryTrap)
			{
				this.galleryTrap = new accessibility.FocusTrap(this.obBigSlider, {
					initialFocus: BX.delegate(function() {
						return this.getEntity(this.obBigSlider, 'close-popup');
					}, this),
					// the zoom button is inside the trap, so the trap keeps the focus unless forced
					forceInitialFocus: true,
					restoreFocus: BX.delegate(function() {
						return this.node.imageContainer;
					}, this),
					isolateOutside: true
				});
			}

			this.galleryTrapFramesLeft = GALLERY_LAYER_FRAME_BUDGET;
			this.startGalleryTrap();
		},

		// The layer opens with the fade of imgPopupShow, and its first frame is fully transparent. The
		// trap drops an invisible candidate without a word: switched on in that frame it leaves the
		// focus on the container instead of the close button, and Escape pressed before the layer has
		// shown itself finds the opener invisible too and drops the focus onto the page. So the trap
		// waits for the first frame where the layer is no longer transparent, not for the whole fade.
		startGalleryTrap: function()
		{
			this.galleryTrapFrame = null;

			if (!this.galleryTrap || !BX.hasClass(this.obBigSlider, 'popup'))
			{
				return;
			}

			if (this.galleryTrapFramesLeft > 0 && BX.style(this.obBigSlider, 'opacity') === '0')
			{
				this.galleryTrapFramesLeft--;
				this.galleryTrapFrame = requestAnimationFrame(BX.delegate(this.startGalleryTrap, this));

				return;
			}

			this.galleryTrap.activate();
		},

		// deactivate() restores the focus by itself, no separate handler is needed for that.
		deactivateGalleryTrap: function()
		{
			if (this.galleryTrapFrame !== null)
			{
				cancelAnimationFrame(this.galleryTrapFrame);
				this.galleryTrapFrame = null;
			}

			if (this.galleryTrap)
			{
				this.galleryTrap.deactivate();
			}

			this.releaseGalleryOpener();
			this.restoreGalleryAttrs();
		},

		// Inside the layer the photograph is no stop of its own. It is the button that opened the layer:
		// its name speaks of opening, and its ring runs along the edges of the screen, where there is
		// nothing to see. The layer leaves two stops - the strip of thumbnails and the cross - and hands
		// the stop back when it closes. The focus still returns here by script, which -1 allows.
		parkGalleryOpener: function()
		{
			var opener = this.node.imageContainer;

			if (!opener)
			{
				return;
			}

			this.galleryOpenerTabIndex = opener.hasAttribute('tabindex')
				? opener.getAttribute('tabindex')
				: null
			;
			opener.setAttribute('tabindex', '-1');
		},

		releaseGalleryOpener: function()
		{
			var opener = this.node.imageContainer;

			// the layer never opened with accessibility around, so there is nothing of ours to take off
			if (!opener || this.galleryOpenerTabIndex === undefined)
			{
				return;
			}

			if (this.galleryOpenerTabIndex === null)
			{
				opener.removeAttribute('tabindex');
			}
			else
			{
				opener.setAttribute('tabindex', this.galleryOpenerTabIndex);
			}

			this.galleryOpenerTabIndex = undefined;
		},

		// The layer borrows the gallery block itself, and the template prints role="group" with the block
		// name on that very node. Stripping the attributes on close would leave the gallery nameless for
		// the rest of the page life, so the layer gives back what it found instead.
		saveGalleryAttrs: function()
		{
			var saved = {};

			for (var i = 0; i < galleryLayerAttrs.length; i++)
			{
				var name = galleryLayerAttrs[i];
				saved[name] = this.obBigSlider.hasAttribute(name)
					? this.obBigSlider.getAttribute(name)
					: null
				;
			}

			this.galleryAttrsBeforeLayer = saved;
		},

		restoreGalleryAttrs: function()
		{
			var saved = this.galleryAttrsBeforeLayer;

			// the layer never opened with accessibility around, so there is nothing of ours to take off
			if (!saved)
			{
				return;
			}

			for (var i = 0; i < galleryLayerAttrs.length; i++)
			{
				var name = galleryLayerAttrs[i];

				if (saved[name] === null)
				{
					this.obBigSlider.removeAttribute(name);
				}
				else
				{
					this.obBigSlider.setAttribute(name, saved[name]);
				}
			}

			this.galleryAttrsBeforeLayer = null;
		},

		closeByEscape: function(event)
		{
			event = event || window.event;

			// the handler sits on the document: without the class check any Escape on the page would
			// close the layer that is not open and reset the page scroll lock and the gallery cursor
			if (event.keyCode == 27 && BX.hasClass(this.obBigSlider, 'popup'))
			{
				this.hideMainPictPopup();
			}
		},

		isQuantityControlDisabled: function(control)
		{
			return !!control && control.getAttribute('aria-disabled') === 'true';
		},

		startQuantityInterval: function()
		{
			var target = BX.proxy_context;
			if (this.isQuantityControlDisabled(target))
			{
				return;
			}

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
			{
				return;
			}

			var curValue = 0,
				boolSet = true;

			if (this.errorCode === 0 && this.config.showQuantity && this.canBuy && !this.isGift)
			{
				curValue = this.isDblQuantity ? parseFloat(this.obQuantity.value) : parseInt(this.obQuantity.value, 10);
				if (!isNaN(curValue))
				{
					curValue += this.stepQuantity;

					curValue = this.checkQuantityRange(curValue, 'up');

					if (this.checkQuantity && curValue > this.maxQuantity)
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
						this.announceQuantity();
					}
				}
			}
		},

		quantityDown: function()
		{
			if (this.isQuantityControlDisabled(this.obQuantityDown))
			{
				return;
			}

			var curValue = 0,
				boolSet = true;

			if (this.errorCode === 0 && this.config.showQuantity && this.canBuy && !this.isGift)
			{
				curValue = (this.isDblQuantity ? parseFloat(this.obQuantity.value) : parseInt(this.obQuantity.value, 10));
				if (!isNaN(curValue))
				{
					curValue -= this.stepQuantity;

					curValue = this.checkQuantityRange(curValue, 'down');

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
						this.announceQuantity();
					}
				}
			}
		},

		quantityChange: function()
		{
			var curValue = 0,
				intCount;

			if (this.errorCode === 0 && this.config.showQuantity)
			{
				if (this.canBuy)
				{
					curValue = this.isDblQuantity ? parseFloat(this.obQuantity.value) : Math.round(this.obQuantity.value);
					if (!isNaN(curValue))
					{
						curValue = this.checkQuantityRange(curValue);

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
				this.announceQuantity();
			}
		},

		quantitySet: function(index)
		{
			var strLimit, resetQuantity;

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
					this.node.quantity && BX.style(this.node.quantity, 'display', '');

					this.obBasketActions && BX.style(this.obBasketActions, 'display', '');
					this.smallCardNodes.buyButton && BX.style(this.smallCardNodes.buyButton, 'display', '');
					this.smallCardNodes.addButton && BX.style(this.smallCardNodes.addButton, 'display', '');

					this.obNotAvail && BX.style(this.obNotAvail, 'display', 'none');
					this.smallCardNodes.notAvailableButton && BX.style(this.smallCardNodes.notAvailableButton, 'display', 'none');

					this.obSubscribe && BX.style(this.obSubscribe, 'display', 'none');
				}
				else
				{
					this.node.quantity && BX.style(this.node.quantity, 'display', 'none');

					this.obBasketActions && BX.style(this.obBasketActions, 'display', 'none');
					this.smallCardNodes.buyButton && BX.style(this.smallCardNodes.buyButton, 'display', 'none');
					this.smallCardNodes.addButton && BX.style(this.smallCardNodes.addButton, 'display', 'none');

					this.obNotAvail && BX.style(this.obNotAvail, 'display', '');
					this.smallCardNodes.notAvailableButton && BX.style(this.smallCardNodes.notAvailableButton, 'display', '');

					if (this.obSubscribe)
					{
						if (newOffer.CATALOG_SUBSCRIBE === 'Y')
						{
							BX.style(this.obSubscribe, 'display', '');
							this.obSubscribe.setAttribute('data-item', newOffer.ID);
							BX(this.visual.SUBSCRIBE_LINK + '_hidden').click();
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

				if (this.config.showQuantity)
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

					this.setQuantityControlDisabled(this.obQuantity, !this.canBuy);

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
						if (this.config.showMaxQuantity === 'M')
						{
							strLimit = (this.maxQuantity / this.stepQuantity >= this.config.relativeQuantityFactor)
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

				if (this.config.usePriceRanges && this.obPriceRanges)
				{
					if (
						this.currentPriceMode === 'Q'
						&& newOffer.PRICE_RANGES_HTML
					)
					{
						var rangesBody = this.getEntity(this.obPriceRanges, 'price-ranges-body'),
							rangesRatioHeader = this.getEntity(this.obPriceRanges, 'price-ranges-ratio-header');

						if (rangesBody)
						{
							rangesBody.innerHTML = newOffer.PRICE_RANGES_HTML;
						}

						if (rangesRatioHeader)
						{
							rangesRatioHeader.innerHTML = newOffer.PRICE_RANGES_RATIO_HTML;
						}

						this.obPriceRanges.style.display = '';
					}
					else
					{
						this.obPriceRanges.style.display = 'none';
					}

				}
			}
		},

		selectOfferProp: function(target)
		{
			var i = 0,
				strTreeValue = '',
				arTreeItem = [],
				rowItems = null,
				smallCardItem;

			target = BX.type.isDomNode(target) ? target : BX.proxy_context;

			if (target && target.hasAttribute('data-treevalue'))
			{
				if (BX.hasClass(target, 'selected'))
					return;

				strTreeValue = target.getAttribute('data-treevalue');
				arTreeItem = strTreeValue.split('_');

				// searchOfferPropIndex reaches changeInfo in the same turn, and the value is spoken
				// there together with what the choice has changed on the page
				this.skuAnnounceNode = target;
				this.searchOfferPropIndex(arTreeItem[0], arTreeItem[1]);
				rowItems = BX.findChildren(target.parentNode, {tagName: 'li'}, false);

				if (rowItems && rowItems.length)
				{
					for (i = 0; i < rowItems.length; i++)
					{
						BX.removeClass(rowItems[i], 'selected');
						rowItems[i].setAttribute('aria-checked', 'false');
					}
				}

				BX.addClass(target, 'selected');
				target.setAttribute('aria-checked', 'true');

				if (this.smallCardNodes.panel)
				{
					smallCardItem = this.smallCardNodes.panel.querySelector('[data-treevalue="' + strTreeValue + '"]');
					if (smallCardItem)
					{
						rowItems = this.smallCardNodes.panel.querySelectorAll('[data-sku-line="' + smallCardItem.getAttribute('data-sku-line') + '"]');
						for (i = 0; i < rowItems.length; i++)
						{
							rowItems[i].style.display = 'none';
						}

						smallCardItem.style.display = '';
					}
				}

				if (!this.offerEffectsDeferred)
				{
					this.sendCustomizeProductEvent();
				}
			}
		},

		sendCustomizeProductEvent: function()
		{
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
		},

		// the <li> carries the radio role but is not an interactive element, so the browser
		// synthesizes no activation from Enter or Space. One listener on the tree serves every
		// value: the keys always arrive from the value holding the focus. The zone of the row
		// listens on its list, below the tree, so by the time an arrow, Home or End gets here
		// the focus already stands on the value it leads to.
		selectOfferPropKey: function(event)
		{
			var target = event.target && event.target.closest
				? event.target.closest('li[data-treevalue]')
				: null
			;

			if (!target)
			{
				return;
			}

			if (event.key === 'Enter' || event.key === ' ')
			{
				event.preventDefault();

				// the arrow has already chosen this value, and the key only hurries what the pause would bring;
				// the walk may have been in another row, so the announcement names the value the key is on
				if (this.offerEffectsTimer && BX.hasClass(target, 'selected'))
				{
					this.offerEffectsNode = target;
					this.flushOfferEffects(true);

					return;
				}

				this.selectOfferProp(target);

				return;
			}

			var focused = document.activeElement;

			if (
				focused !== target
				&& BX.type.isElementNode(focused)
				&& focused.parentNode === target.parentNode
				&& focused.hasAttribute('data-treevalue')
			)
			{
				this.offerEffectsDeferred = true;
				this.selectOfferProp(focused);
				this.offerEffectsDeferred = false;
			}
		},

		searchOfferPropIndex: function(strPropID, strPropValue)
		{
			var strName = '',
				arShowValues = false,
				arCanBuyValues = [],
				allValues = [],
				index = -1,
				i, j,
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

			if (index > -1)
			{
				for (i = 0; i < index; i++)
				{
					strName = 'PROP_' + this.treeProps[i].ID;
					arFilter[strName] = this.selectedValues[strName];
				}

				strName = 'PROP_' + this.treeProps[index].ID;
				arFilter[strName] = strPropValue;

				for (i = index + 1; i < this.treeProps.length; i++)
				{
					strName = 'PROP_' + this.treeProps[i].ID;
					arShowValues = this.getRowValues(arFilter, strName);

					if (!arShowValues)
						break;

					allValues = [];

					if (this.config.showAbsent)
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
						if (this.config.showAbsent)
						{
							arFilter[strName] = (arCanBuyValues.length ? arCanBuyValues[0] : allValues[0]);
						}
						else
						{
							arFilter[strName] = arCanBuyValues[0];
						}
					}

					this.updateRow(i, arFilter[strName], arShowValues, arCanBuyValues);
				}

				this.selectedValues = arFilter;
				this.changeInfo();
			}
		},

		updateRow: function(intNumber, activeId, showId, canBuyId)
		{
			var i = 0,
				value = '',
				display = '',
				isCurrent = false,
				rowItems = null;

			var lineContainer = this.getEntities(this.obTree, 'sku-line-block'),
				visibleItems = [];

			if (intNumber > -1 && intNumber < lineContainer.length)
			{
				var rowDisplay = lineContainer[intNumber].style.display,
					visibilityChanged = false;

				rowItems = lineContainer[intNumber].querySelectorAll('li');
				for (i = 0; i < rowItems.length; i++)
				{
					value = rowItems[i].getAttribute('data-onevalue');
					isCurrent = value === activeId;

					if (isCurrent)
					{
						BX.addClass(rowItems[i], 'selected');
					}
					else
					{
						BX.removeClass(rowItems[i], 'selected');
					}

					this.setSkuValueState(rowItems[i], 'aria-checked', isCurrent ? 'true' : 'false');

					if (BX.util.in_array(value, canBuyId))
					{
						BX.removeClass(rowItems[i], 'notallowed');
						this.setSkuValueAvailability(rowItems[i], true);
					}
					else
					{
						BX.addClass(rowItems[i], 'notallowed');
						this.setSkuValueAvailability(rowItems[i], false);
					}

					display = BX.util.in_array(value, showId) ? '' : 'none';
					if (rowItems[i].style.display !== display)
					{
						rowItems[i].style.display = display;
						visibilityChanged = true;
					}

					if (display !== 'none')
					{
						visibleItems.push(rowItems[i]);
					}

					if (isCurrent)
					{
						lineContainer[intNumber].style.display = (value == 0 && canBuyId.length == 1) ? 'none' : '';
					}
				}

				if (lineContainer[intNumber].style.display !== rowDisplay)
				{
					visibilityChanged = true;
				}

				// a value of a property row hidden as a whole is not on the page either
				if (lineContainer[intNumber].style.display === 'none')
				{
					visibleItems = [];
				}

				this.updateSkuPositions(visibleItems);

				// The observer of the zone watches neither the inline display, nor aria-label, nor
				// aria-checked, so a row whose set of shown values has changed asks for the rebuild
				// itself. Without it the stop of the row stays on a value that is no longer on the
				// page, and the whole group falls out of the keyboard path.
				if (this.skuFocusZones[intNumber] && visibilityChanged)
				{
					this.skuFocusZones[intNumber].refreshElements();
				}

				if (this.smallCardNodes.panel)
				{
					rowItems = this.smallCardNodes.panel.querySelectorAll('[data-sku-line="' + intNumber + '"]');
					for (i = 0; i < rowItems.length; i++)
					{
						value = rowItems[i].getAttribute('data-onevalue');
						isCurrent = value === activeId;

						if (isCurrent)
						{
							rowItems[i].style.display = '';
						}
						else
						{
							rowItems[i].style.display = 'none';
						}

						if (BX.util.in_array(value, canBuyId))
						{
							BX.removeClass(rowItems[i], 'notallowed');
						}
						else
						{
							BX.addClass(rowItems[i], 'notallowed');
						}

						if (isCurrent)
						{
							rowItems[i].style.display = (value == 0 && canBuyId.length == 1) ? 'none' : '';
						}
					}
				}
			}
		},

		/* A value the product cannot be bought in stays a value the buyer picks: that is how the card
		   is asked to redraw the price and the buy block and show that the combination is gone.
		   aria-disabled would promise the opposite — that the radio is not operable — while the arrows,
		   Enter and the mouse all still choose it. So the unavailability is carried by the accessible
		   name, where it costs the radio none of its behaviour, and the base name is kept aside so
		   that repeated redraws do not stack the suffix and the announcement of the choice does not
		   say it twice. */
		setSkuValueAvailability: function(node, canBuy)
		{
			var base = node.getAttribute('data-name-base');

			if (base === null)
			{
				base = node.getAttribute('aria-label') || node.getAttribute('title') || '';
				node.setAttribute('data-name-base', base);
			}

			var unavailable = BX.message('SKU_UNAVAILABLE_ARIA');
			var name = (canBuy || base === '' || !BX.type.isNotEmptyString(unavailable))
				? base
				: base + ', ' + unavailable
			;

			this.setSkuValueState(node, 'aria-label', name);
		},

		// The redraw walks every value of the row, and most of them keep the state they had: a state
		// is written only when it differs, so that nothing watching the row sees a write of the same.
		setSkuValueState: function(node, name, value)
		{
			if (node.getAttribute(name) === value)
			{
				return;
			}

			writeAttr(node, name, value);
		},

		// the browser cannot compute the set position for a role carried by <li>,
		// and a hidden value must not be counted
		updateSkuPositions: function(items)
		{
			for (var i = 0; i < items.length; i++)
			{
				items[i].setAttribute('aria-setsize', items.length);
				items[i].setAttribute('aria-posinset', i + 1);
			}
		},

		getRowValues: function(arFilter, index)
		{
			var arValues = [],
				i = 0,
				j = 0,
				boolSearch = false,
				boolOneSearch = true;

			if (arFilter.length === 0)
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
			var i,
				j = 0,
				boolOneSearch = true,
				boolSearch = false;

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
				strName = '',
				arShowValues = false,
				arCanBuyValues = [],
				arFilter = {},
				tmpFilter = [],
				current = this.offers[this.offerNum].TREE;

			for (i = 0; i < this.treeProps.length; i++)
			{
				strName = 'PROP_' + this.treeProps[i].ID;
				arShowValues = this.getRowValues(arFilter, strName);

				if (!arShowValues)
					break;

				if (BX.util.in_array(current[strName], arShowValues))
				{
					arFilter[strName] = current[strName];
				}
				else
				{
					arFilter[strName] = arShowValues[0];
					this.offerNum = 0;
				}

				if (this.config.showAbsent)
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
			var index = -1,
				j = 0,
				boolOneSearch = true,
				eventData = {
					currentId: (this.offerNum > -1 ? this.offers[this.offerNum].ID : 0),
					newId: 0
				};

			var i, offerGroupNode;

			// the page speaks only what the visitor has just done: the first pass of the card
			// goes through the same code and leaves no pressed value behind
			var announceNode = this.skuAnnounceNode;
			this.skuAnnounceNode = null;

			var deferEffects = this.offerEffectsDeferred;

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
				if (index != this.offerNum)
				{
					this.isGift = false;
				}

				for (i = 0; i < this.offers.length; i++)
				{
					if (this.config.showOfferGroup && this.offers[i].OFFER_GROUP)
					{
						if (offerGroupNode = BX(this.visual.OFFER_GROUP + this.offers[i].ID))
						{
							offerGroupNode.style.display = (i == index ? '' : 'none');
						}
					}
				}

				if (!deferEffects)
				{
					this.cancelOfferEffects();
					this.showOfferGallery(index);
				}

				if (this.obDescription && this.config.showSkuDescription === 'Y')
				{
					this.changeSkuDescription(index);
				}

				if (this.config.showSkuProps)
				{
					if (this.obSkuProps)
					{
						if (!this.offers[index].DISPLAY_PROPERTIES)
						{
							BX.adjust(this.obSkuProps, {style: {display: 'none'}, html: ''});
						}
						else
						{
							BX.adjust(this.obSkuProps, {style: {display: ''}, html: this.offers[index].DISPLAY_PROPERTIES});
						}
					}

					if (this.obMainSkuProps)
					{
						if (!this.offers[index].DISPLAY_PROPERTIES_MAIN_BLOCK)
						{
							BX.adjust(this.obMainSkuProps, {style: {display: 'none'}, html: ''});
						}
						else
						{
							BX.adjust(this.obMainSkuProps, {style: {display: ''}, html: this.offers[index].DISPLAY_PROPERTIES_MAIN_BLOCK});
						}
					}
				}

				this.quantitySet(index);
				this.setPrice(true);
				this.setCompared(this.offers[index].COMPARED);

				this.offerNum = index;
				this.fixFontCheck();

				if (deferEffects)
				{
					this.deferOfferEffects(announceNode);
				}
				else
				{
					this.setAnalyticsDataLayer('showDetail');
					this.incViewedCounter();
					// only for compatible catalog.store.amount custom templates
					BX.onCustomEvent('onCatalogStoreProductChange', [this.offers[this.offerNum].ID]);
				}

				eventData.newId = this.offers[this.offerNum].ID;
				// new event
				BX.onCustomEvent('onCatalogElementChangeOffer', [eventData]);
				eventData = null;

				if (announceNode && !deferEffects)
				{
					this.announceOfferChange(announceNode, index, true);
				}
			}
		},

		showOfferGallery: function(index)
		{
			var i;

			this.drawImages(this.offers[index].SLIDER);
			this.checkSliderControls(this.offers[index].SLIDER_COUNT);

			for (i = 0; i < this.offers.length; i++)
			{
				if (this.slider.controls[i].ID)
				{
					if (i === index)
					{
						this.product.slider = this.slider.controls[i];
						if (this.slider.controls[i].CONT)
						{
							BX.show(this.slider.controls[i].CONT);
							this.activateDotsZone(this.slider.controls[i].CONT);
						}
					}
					else
					{
						if (this.slider.controls[i].CONT)
						{
							BX.hide(this.slider.controls[i].CONT);
							this.removeDotsZone(this.slider.controls[i].CONT);
						}
					}
				}
				else if (i === index)
				{
					this.product.slider = {};
				}
			}

			if (this.offers[index].SLIDER_COUNT > 0)
			{
				this.setMainPict(this.offers[index].ID, this.offers[index].SLIDER[0].ID, true);
			}
			else
			{
				this.setMainPictFromItem(index);
			}

			if (this.offers[index].SLIDER_COUNT > 1)
			{
				this.initSlider();
			}
			else
			{
				this.stopSlider();
			}
		},

		// Every step of a walk puts the effects off again, so the walk ends in one round of them for the
		// value it stopped on.
		deferOfferEffects: function(announceNode)
		{
			clearTimeout(this.offerEffectsTimer);
			this.offerEffectsNode = announceNode || this.offerEffectsNode;
			this.offerEffectsTimer = setTimeout(
				BX.delegate(function() {
					this.flushOfferEffects(false);
				}, this),
				OFFER_EFFECTS_DELAY
			);
		},

		cancelOfferEffects: function()
		{
			clearTimeout(this.offerEffectsTimer);
			this.offerEffectsTimer = null;
			this.offerEffectsNode = null;
		},

		// The focus has said the value the walk stopped on, so the announcement leaves it out unless the
		// visitor has pressed a key on the value too.
		flushOfferEffects: function(withValue)
		{
			var announceNode = this.offerEffectsNode;

			this.cancelOfferEffects();
			this.showOfferGallery(this.offerNum);
			this.setAnalyticsDataLayer('showDetail');
			this.incViewedCounter();
			// only for compatible catalog.store.amount custom templates
			BX.onCustomEvent('onCatalogStoreProductChange', [this.offers[this.offerNum].ID]);
			this.sendCustomizeProductEvent();

			if (announceNode)
			{
				this.announceOfferChange(announceNode, this.offerNum, withValue);
			}
		},
		changeSkuDescription: function(index)
		{
			var currentDetailText = '';
			var currentPreviewText = '';
			var currentDescription = '';

			if (this.offers[index].DETAIL_TEXT !== '')
			{
				currentDetailText = this.offers[index].DETAIL_TEXT_TYPE === 'html' ? this.offers[index].DETAIL_TEXT : '<p>' + this.offers[index].DETAIL_TEXT + '</p>';
			}
			else if (this.product.detailText !== '')
			{
				currentDetailText = this.product.detailTextType === 'html' ? this.product.detailText : '<p>' + this.product.detailText + '</p>';
			}

			if (this.offers[index].PREVIEW_TEXT !== '')
			{
				currentPreviewText = this.offers[index].PREVIEW_TEXT_TYPE === 'html' ? this.offers[index].PREVIEW_TEXT : '<p>' + this.offers[index].PREVIEW_TEXT + '</p>';
			}
			else if (this.product.previewText !== '')
			{
				currentPreviewText = this.product.previewTextType === 'html' ? this.product.previewText : '<p>' + this.product.previewText + '</p>';
			}

			if (
				currentPreviewText !== ''
				&& (
					this.config.displayPreviewTextMode === 'S'
					|| (this.config.displayPreviewTextMode === 'E' && currentDetailText)
				)
			)
			{
				currentDescription += currentPreviewText;
			}
			if (currentDetailText !== '')
			{
				currentDescription += currentDetailText;
			}
			BX.adjust(this.obDescription, {html: currentDescription});
		},

		drawImages: function(images)
		{
			if (!this.node.imageContainer)
				return;

			var i, img, entities = this.getEntities(this.node.imageContainer, 'image');
			for (i in entities)
			{
				if (entities.hasOwnProperty(i) && BX.type.isDomNode(entities[i]))
				{
					BX.remove(entities[i]);
				}
			}

			for (i = 0; i < images.length; i++)
			{
				img = BX.create('IMG', {
					props: {
						src: images[i].SRC,
						alt: this.config.alt,
						title: this.config.title
					}
				});

				if (i == 0)
				{
					img.setAttribute('itemprop', 'image');
				}

				var slide = BX.create('DIV', {
					attrs: {
						'data-entity': 'image',
						'data-id': images[i].ID
					},
					props: {
						className: 'product-item-detail-slider-image' + (i == 0 ? ' active' : '')
					},
					children: [img]
				});

				// an inactive slide stays in the DOM under zero opacity, and its image is kept out of
				// the accessibility tree: otherwise the reader repeats the same alt for every photo
				if (i != 0)
				{
					slide.setAttribute('aria-hidden', 'true');
				}

				this.node.imageContainer.appendChild(slide);
			}
		},

		restoreSticker: function()
		{
			if (this.previousStickerText)
			{
				this.redrawSticker({text: this.previousStickerText});
			}
			else
			{
				this.hideSticker();
			}
		},

		hideSticker: function()
		{
			BX.hide(BX(this.visual.STICKER_ID));
		},

		redrawSticker: function(stickerData)
		{
			stickerData = stickerData || {};
			var text = stickerData.text || '';

			var sticker = BX(this.visual.STICKER_ID);
			if (!sticker)
				return;

			BX.show(sticker);

			var previousStickerText = sticker.getAttribute('title');
			if (previousStickerText && previousStickerText != text)
			{
				this.previousStickerText = previousStickerText;
			}

			BX.adjust(sticker, {text: text, attrs: {title: text}});
		},

		checkQuantityRange: function(quantity, direction)
		{
			if (typeof quantity === 'undefined'|| this.currentPriceMode !== 'Q')
			{
				return quantity;
			}

			quantity = parseFloat(quantity);

			var nearestQuantity = quantity;
			var range, diffFrom, absDiffFrom, diffTo, absDiffTo, shortestDiff;

			for (var i in this.currentQuantityRanges)
			{
				if (this.currentQuantityRanges.hasOwnProperty(i))
				{
					range = this.currentQuantityRanges[i];

					if (
						parseFloat(quantity) >= parseFloat(range.SORT_FROM)
						&& (
							range.SORT_TO === 'INF'
							|| parseFloat(quantity) <= parseFloat(range.SORT_TO)
						)
					)
					{
						nearestQuantity = quantity;
						break;
					}
					else
					{
						diffFrom = parseFloat(range.SORT_FROM) - quantity;
						absDiffFrom = Math.abs(diffFrom);
						diffTo = parseFloat(range.SORT_TO) - quantity;
						absDiffTo = Math.abs(diffTo);

						if (shortestDiff === undefined || shortestDiff > absDiffFrom)
						{
							if (
								direction === undefined
								|| (direction === 'up' && diffFrom > 0)
								|| (direction === 'down' && diffFrom < 0)
							)
							{
								shortestDiff = absDiffFrom;
								nearestQuantity = parseFloat(range.SORT_FROM);
							}
						}

						if (shortestDiff === undefined || shortestDiff > absDiffTo)
						{
							if (
								direction === undefined
								|| (direction === 'up' && diffFrom > 0)
								|| (direction === 'down' && diffFrom < 0)
							)
							{
								shortestDiff = absDiffTo;
								nearestQuantity = parseFloat(range.SORT_TO);
							}
						}
					}
				}
			}

			return nearestQuantity;
		},

		checkPriceRange: function(quantity)
		{
			if (typeof quantity === 'undefined'|| this.currentPriceMode !== 'Q')
			{
				return;
			}

			var range, found = false;

			for (var i in this.currentQuantityRanges)
			{
				if (this.currentQuantityRanges.hasOwnProperty(i))
				{
					range = this.currentQuantityRanges[i];

					if (
						parseFloat(quantity) >= parseFloat(range.SORT_FROM)
						&& (
							range.SORT_TO === 'INF'
							|| parseFloat(quantity) <= parseFloat(range.SORT_TO)
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

			this.setQuantityStepLimit(this.obQuantityUp, reachedTopLimit);
			this.setQuantityStepLimit(this.obQuantityDown, reachedBottomLimit);
			this.setQuantityControlDisabled(this.obQuantity, reachedTopLimit && reachedBottomLimit);
		},

		setQuantityStepLimit: function(button, limitReached)
		{
			if (!button)
				return;

			if (limitReached)
			{
				BX.addClass(button, 'product-item-amount-field-btn-disabled');
			}
			else
			{
				BX.removeClass(button, 'product-item-amount-field-btn-disabled');
			}

			this.setQuantityControlDisabled(button, limitReached);
		},

		// aria-disabled instead of the native attribute: disabled would throw the focus to body.
		// A field says the state to a reader and keeps it as well: readonly stops the typing the
		// native attribute used to stop, and leaves the field where the keyboard can reach it.
		setQuantityControlDisabled: function(control, disabled)
		{
			if (!control)
				return;

			if (disabled)
			{
				control.setAttribute('aria-disabled', 'true');
			}
			else
			{
				control.removeAttribute('aria-disabled');
			}

			if (control.tagName === 'INPUT')
			{
				control.readOnly = disabled;
			}
		},

		// silentTotal comes from changeInfo: the choice of a variation is announced there as a whole,
		// and the quantity recounted along the way must not speak over it
		setPrice: function(silentTotal)
		{
			var economyInfo = '', price;

			if (silentTotal)
			{
				this.cancelQuantityAnnounce();
			}

			if (this.obQuantity)
			{
				this.checkPriceRange(this.obQuantity.value);
			}

			this.checkQuantityControls();

			price = this.currentPrices[this.currentPriceSelected];

			if (this.isGift)
			{
				price.PRICE = 0;
				price.DISCOUNT = price.BASE_PRICE;
				price.PERCENT = 100;
			}

			if (this.obPrice.price)
			{
				if (price)
				{
					BX.adjust(this.obPrice.price, {html: BX.Currency.currencyFormat(price.RATIO_PRICE, price.CURRENCY, true)});
					this.smallCardNodes.price && BX.adjust(this.smallCardNodes.price, {
						html: BX.Currency.currencyFormat(price.RATIO_PRICE, price.CURRENCY, true)
					});
				}
				else
				{
					BX.adjust(this.obPrice.price, {html: ''});
					this.smallCardNodes.price && BX.adjust(this.smallCardNodes.price, {html: ''});
				}

				if (price && price.RATIO_PRICE !== price.RATIO_BASE_PRICE)
				{
					if (this.config.showOldPrice)
					{
						this.obPrice.full && BX.adjust(this.obPrice.full, {
							style: {display: ''},
							html: BX.Currency.currencyFormat(price.RATIO_BASE_PRICE, price.CURRENCY, true)
						});
						this.smallCardNodes.oldPrice && BX.adjust(this.smallCardNodes.oldPrice, {
							style: {display: ''},
							html: BX.Currency.currencyFormat(price.RATIO_BASE_PRICE, price.CURRENCY, true)
						});

						if (this.obPrice.discount)
						{
							economyInfo = BX.message('ECONOMY_INFO_MESSAGE');
							economyInfo = economyInfo.replace('#ECONOMY#', BX.Currency.currencyFormat(price.RATIO_DISCOUNT, price.CURRENCY, true));
							BX.adjust(this.obPrice.discount, {style: {display: ''}, html: economyInfo});
						}
					}

					if (this.config.showPercent)
					{
						this.obPrice.percent && BX.adjust(this.obPrice.percent, {
							style: {display: ''},
							attrs: {
								role: 'img',
								'aria-label': BX.message('DISCOUNT_PERCENT_ARIA').replace('#PERCENT#', price.PERCENT)
							},
							html: -price.PERCENT + '%'
						});
					}
				}
				else
				{
					if (this.config.showOldPrice)
					{
						this.obPrice.full && BX.adjust(this.obPrice.full, {style: {display: 'none'}, html: ''});
						this.smallCardNodes.oldPrice && BX.adjust(this.smallCardNodes.oldPrice, {style: {display: 'none'}, html: ''});
						this.obPrice.discount && BX.adjust(this.obPrice.discount, {style: {display: 'none'}, html: ''});
					}

					if (this.config.showPercent)
					{
						this.obPrice.percent && BX.adjust(this.obPrice.percent, {
							style: {display: 'none'},
							attrs: {role: '', 'aria-label': ''},
							html: ''
						});
					}
				}

				if (this.obPrice.total)
				{
					if (price && this.obQuantity && this.obQuantity.value != this.stepQuantity)
					{
						BX.adjust(this.obPrice.total, {
							html: BX.message('PRICE_TOTAL_PREFIX') + ' <strong>'
							+ BX.Currency.currencyFormat(price.PRICE * this.obQuantity.value, price.CURRENCY, true)
							+ '</strong>',
							style: {display: ''}
						});
					}
					else
					{
						BX.adjust(this.obPrice.total, {
							html: '',
							style: {display: 'none'}
						});
					}
				}
			}
		},

		// The only way the page speaks to a reader. The live region belongs to the primitive, so the
		// markup of the template keeps no aria-live of its own.
		announce: function(text)
		{
			var accessibility = getAccessibility();

			if (!accessibility || !BX.type.isNotEmptyString(text))
			{
				return;
			}

			accessibility.LiveAnnouncer.announce(text);
		},

		// Both strips open the section, but only the main one carries the tab role: the item of the
		// sticky strip answers with its own text.
		announceTabChange: function(tab)
		{
			var control = tab.querySelector('[role="tab"]') || tab;
			var name = (control.textContent || '').trim();
			var template = BX.message('TAB_SELECTED_ARIA');

			if (name === '' || !BX.type.isNotEmptyString(template))
			{
				return;
			}

			this.announce(fillTemplate(template, {'#TAB#': name}));
		},

		// The choice of a variant is spoken by us and not left to the reader. Orca repeats the state of
		// a radio only when the last key was the space bar (orca/scripts/default.py: onCheckedChanged),
		// so a choice made with Enter, with the arrows or with the mouse stayed silent. The value comes
		// with what it has changed: the card redraws the price, the buy block and the gallery at once.
		announceOfferChange: function(node, index, withValue)
		{
			var choice = this.getSkuChoiceText(node);

			if (choice === '')
			{
				return;
			}

			var parts = withValue ? [choice] : [];
			var price = this.obPrice.price ? (this.obPrice.price.textContent || '').trim() : '';

			if (price !== '')
			{
				parts.push(price);
			}

			var availability = this.canBuy
				? BX.message('SKU_AVAILABLE_ARIA')
				: BX.message('SKU_UNAVAILABLE_ARIA')
			;

			if (BX.type.isNotEmptyString(availability))
			{
				parts.push(availability);
			}

			var photos = this.offers[index].SLIDER_COUNT;
			var photosTemplate = BX.message('SKU_PHOTOS_ARIA');

			if (photos > 0 && BX.type.isNotEmptyString(photosTemplate))
			{
				parts.push(fillTemplate(photosTemplate, {'#COUNT#': photos}));
			}

			this.announce(parts.join(', '));
		},

		getSkuChoiceText: function(node)
		{
			// the base name, so that a chosen value the product is out of does not say so twice:
			// the availability is a part of this announcement on its own
			var value = node.getAttribute('data-name-base')
				|| node.getAttribute('aria-label')
				|| node.getAttribute('title')
				|| ''
			;

			if (value === '')
			{
				return '';
			}

			var template = BX.message('SKU_SELECTED_ARIA') || '';
			var property = this.getSkuGroupName(node);

			return (template === '' || property === '')
				? value
				: fillTemplate(template, {'#PROPERTY#': property, '#VALUE#': value})
			;
		},

		getSkuGroupName: function(node)
		{
			var group = node.closest ? node.closest('[role="radiogroup"]') : null;

			if (!group)
			{
				return '';
			}

			var label = group.getAttribute('aria-label');

			if (label)
			{
				return label;
			}

			var titleId = group.getAttribute('aria-labelledby');
			var title = titleId ? document.getElementById(titleId) : null;

			return title ? (title.textContent || '').trim() : '';
		},

		// One announcement for a series of steps or a typed value, built when the series is over: the
		// last step decides both the quantity and whether the total is printed at all.
		announceQuantity: function()
		{
			this.cancelQuantityAnnounce();

			if (!getAccessibility())
			{
				return;
			}

			this.quantityAnnounceTimer = setTimeout(
				BX.delegate(function() {
					this.quantityAnnounceTimer = null;
					this.announce(this.getQuantityText());
				}, this),
				QUANTITY_ANNOUNCE_DELAY
			);
		},

		cancelQuantityAnnounce: function()
		{
			clearTimeout(this.quantityAnnounceTimer);
			this.quantityAnnounceTimer = null;
		},

		// The announcer writes plain text, so the figures are read back from the visible nodes, where the
		// browser has already decoded the currency template. At the smallest quantity the page hides the
		// total, and the price of one step stands in for it.
		getQuantityText: function()
		{
			if (!this.obQuantity)
			{
				return '';
			}

			// the script keeps the node of the unit for the offers only, a simple product prints it too
			var measure = this.obMeasure || BX(this.visual.QUANTITY_MEASURE);
			var values = {
				'#QUANTITY#': this.obQuantity.value,
				'#MEASURE#': measure ? (measure.textContent || '').trim() : ''
			};
			var total = this.obPrice.total && this.obPrice.total.style.display !== 'none'
				? this.obPrice.total.querySelector('strong')
				: null
			;
			var template;

			if (total)
			{
				template = BX.message('QUANTITY_CHANGED_ARIA');
				values['#SUM#'] = (total.textContent || '').trim();
			}
			else
			{
				template = BX.message('QUANTITY_CHANGED_PRICE_ARIA');
				values['#PRICE#'] = this.obPrice.price ? (this.obPrice.price.textContent || '').trim() : '';
			}

			if (!BX.type.isNotEmptyString(template))
			{
				return '';
			}

			// a product with no unit leaves a gap where the unit stood
			return fillTemplate(template, values).replace(/\s+/g, ' ').replace(/ ,/g, ',').trim();
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

				if (this.config.showClosePopup)
				{
					popupButtons = [
						new BasketButton({
							text: BX.message('BTN_MESSAGE_COMPARE_REDIRECT'),
							events: {
								click: BX.delegate(this.compareRedirect, this)
							},
							style: {marginRight: '10px'},
							autofocus: true
						}),
						new BasketButton({
							text: BX.message('BTN_MESSAGE_CLOSE'),
							events: {
								click: BX.delegate(this.obPopupWin.close, this.obPopupWin)
							}
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
							autofocus: true
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
						autofocus: true
					})
				];
			}

			this.setPopupTitle(BX.message('COMPARE_TITLE'));
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

			if (this.offers && this.offers.length)
			{
				this.offers[this.offerNum].COMPARED = false;
			}
		},

		setCompared: function(state)
		{
			if (!this.obCompare)
				return;

			var checkbox = this.getEntity(this.obCompare, 'compare-checkbox');
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

			if (this.config.showQuantity)
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
				return;

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

		sendToBasket: function()
		{
			if (!this.canBuy)
				return;

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

		add2Basket: function(event)
		{
			this.popupInitiator = this.getPressedButton(event, this.obAddToBasketBtn);
			this.basketMode = 'ADD';
			this.basket();
		},

		buyBasket: function(event)
		{
			this.popupInitiator = this.getPressedButton(event, this.obBuyBtn);
			this.basketMode = 'BUY';
			this.basket();
		},

		basket: function()
		{
			var contentBasketProps = '';

			if (!this.canBuy)
				return;

			switch (this.productType)
			{
				case 1: // product
				case 2: // set
				case 7: // service
					if (this.basketData.useProps && !this.basketData.emptyProps)
					{
						this.initPopupWindow();
						this.setPopupTitle(BX.message('TITLE_BASKET_PROPS'));

						if (BX(this.visual.BASKET_PROP_DIV))
						{
							contentBasketProps = BX(this.visual.BASKET_PROP_DIV).innerHTML;
						}

						this.obPopupWin.setContent(contentBasketProps);
						this.obPopupWin.setButtons([
							new BasketButton({
								text: BX.message('BTN_SEND_PROPS'),
								events: {
									click: BX.delegate(this.sendToBasket, this)
								}
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
			var popupContent, popupButtons, productPict;

			if (this.obPopupWin)
			{
				this.obPopupWin.close();
			}

			if (!BX.type.isPlainObject(arResult))
				return;

			if (arResult.STATUS === 'OK')
			{
				this.setAnalyticsDataLayer('addToCart');
			}

			if (arResult.STATUS === 'OK' && this.basketMode === 'BUY')
			{
				this.basketRedirect();
			}
			else
			{
				this.initPopupWindow();

				if (arResult.STATUS === 'OK')
				{
					BX.onCustomEvent('OnBasketChange');
					switch (this.productType)
					{
						case 1: // product
						case 2: // set
						case 7: // service
							productPict = this.product.pict.SRC;
							break;
						case 3: // sku
							productPict = this.offers[this.offerNum].PREVIEW_PICTURE
								? this.offers[this.offerNum].PREVIEW_PICTURE.SRC
								: this.defaultPict.pict.SRC;
							break;
					}

					popupContent = '<div style="width: 100%; margin: 0; text-align: center;">'
						+ '<img src="' + productPict + '" height="130" style="max-height:130px" alt=""><p>'
						+ this.product.name + '</p></div>';

					if (this.config.showClosePopup)
					{
						popupButtons = [
							new BasketButton({
								text: BX.message('BTN_MESSAGE_DETAIL_BASKET_REDIRECT'),
								events: {
									click: BX.delegate(this.basketRedirect, this)
								},
								style: {marginRight: '10px'},
								autofocus: true
							}),
							new BasketButton({
								text: BX.message('BTN_MESSAGE_DETAIL_CLOSE_POPUP'),
								events: {
									click: BX.delegate(this.obPopupWin.close, this.obPopupWin)
								}
							})
						];
					}
					else
					{
						popupButtons = [
							new BasketButton({
								text: BX.message('BTN_MESSAGE_DETAIL_BASKET_REDIRECT'),
								events: {
									click: BX.delegate(this.basketRedirect, this)
								},
								autofocus: true
							})
						];
					}
				}
				else
				{
					popupContent = '<div style="width: 100%; margin: 0; text-align: center;"><p>'
						+ (arResult.MESSAGE ? arResult.MESSAGE : BX.message('BASKET_UNKNOWN_ERROR'))
						+ '</p></div>';
					popupButtons = [
						new BasketButton({
							text: BX.message('BTN_MESSAGE_CLOSE'),
							events: {
								click: BX.delegate(this.obPopupWin.close, this.obPopupWin)
							},
							autofocus: true
						})
					];
				}

				this.setPopupTitle(
					arResult.STATUS === 'OK' ? BX.message('TITLE_SUCCESSFUL') : BX.message('TITLE_ERROR')
				);
				this.obPopupWin.setContent(popupContent);
				this.obPopupWin.setButtons(popupButtons);
				this.obPopupWin.show();
			}
		},

		basketRedirect: function()
		{
			location.href = (this.basketData.basketUrl ? this.basketData.basketUrl : BX.message('BASKET_URL'));
		},

		// buy and add buttons are duplicated in the sticky panel, so the pressed one is taken from the event
		getPressedButton: function(event, defaultButton)
		{
			var target = event ? BX.getEventTarget(event) : null;

			return target && target.tagName === 'BUTTON' ? target : defaultButton;
		},

		// the popup is built once per page while its initiator differs from call to call
		getPopupReturnTarget: function()
		{
			var node = this.popupInitiator;

			return node && node.isConnected ? node : null;
		},

		// The layer is shared by the basket and the comparison, and the popup takes its name from the
		// title only while it has none: the name of the previous window is dropped first.
		setPopupTitle: function(title)
		{
			this.obPopupWin.getPopupContainer().removeAttribute('aria-label');
			this.obPopupWin.setTitleBar(title);
		},

		initPopupWindow: function()
		{
			if (this.obPopupWin)
				return;

			this.obPopupWin = BX.PopupWindowManager.create('CatalogElementBasket_' + this.visual.ID, null, {
				autoHide: false,
				offsetLeft: 0,
				offsetTop: 0,
				overlay: true,
				closeByEsc: true,
				titleBar: true,
				closeIcon: true,
				contentColor: 'white',
				className: this.config.templateTheme ? 'bx-' + this.config.templateTheme : '',
				focusTrap: {restoreFocus: BX.delegate(this.getPopupReturnTarget, this)}
			});

			// The focus lands on a button of the layer, and the content is what the button is read out with.
			this.obPopupWin.getPopupContainer().setAttribute(
				'aria-describedby',
				this.obPopupWin.getContentContainer().id
			);
		},

		incViewedCounter: function()
		{
			if (this.currentIsSet && !this.updateViewedCount)
			{
				switch (this.productType)
				{
					case 1:
					case 2:
					case 7: // service
						this.viewedCounter.params.PRODUCT_ID = this.product.id;
						this.viewedCounter.params.PARENT_ID = this.product.id;
						break;
					case 3:
						this.viewedCounter.params.PARENT_ID = this.product.id;
						this.viewedCounter.params.PRODUCT_ID = this.offers[this.offerNum].ID;
						break;
					default:
						return;
				}

				this.viewedCounter.params.SITE_ID = BX.message('SITE_ID');
				this.updateViewedCount = true;
				BX.ajax.post(
					this.viewedCounter.path,
					this.viewedCounter.params,
					BX.delegate(function()
					{
						this.updateViewedCount = false;
					}, this)
				);
			}
		},

		allowViewedCount: function(update)
		{
			this.currentIsSet = true;

			if (update)
			{
				this.incViewedCounter();
			}
		},

		fixFontCheck: function()
		{
			if (BX.type.isDomNode(this.obPrice.price))
			{
				BX.FixFontSize && BX.FixFontSize.init({
					objList: [{
						node: this.obPrice.price,
						maxFontSize: 28,
						smallestValue: false,
						scaleBy: this.obPrice.price.parentNode
					}],
					onAdaptiveResize: true
				});

			}
		}
	}
})(window);
