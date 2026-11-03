;(function ()
{
	"use strict";

	BX.namespace("BX.Landing");

	BX.Landing.CardGalleryCollection = function ()
	{
		this.galleries = {};
	};

	/**
	 * Singleton pattern
	 * @returns {BX.Landing.CardGalleryCollection}
	 */
	BX.Landing.CardGalleryCollection.getInstance = function ()
	{
		return (
			BX.Landing.CardGalleryCollection.instance ||
			(BX.Landing.CardGalleryCollection.instance = new BX.Landing.CardGalleryCollection())
		);
	};

	/**
	 * First init
	 * @param {HTMLElement} block
	 */
	BX.Landing.CardGalleryCollection.initBlock = function (block)
	{
		if (BX.Landing.CardGallery.isGalleryBlock(block))
		{
			var galleryCollection = this.getInstance();
			galleryCollection.add(block);
		}
	};

	/**
	 * Set block to not activate fancybox
	 * @param {HTMLElement} block
	 */
	BX.Landing.CardGalleryCollection.disableBlock = function (block)
	{
		if (BX.Landing.CardGallery.isGalleryBlock(block))
		{
			var gallery = new BX.Landing.CardGallery(block);
			gallery.disable();
		}
	};

	BX.Landing.CardGalleryCollection.prototype = {
		/**
		 * Add gallery block to collection
		 * @param {HTMLElement} block
		 * @returns {boolean}
		 */
		add: function (block)
		{
			var gallery = new BX.Landing.CardGallery(block);
			gallery.initImages();
			syncCarousels(block);
			this.galleries[gallery.getId()] = gallery;
		},

		findGalleryByBlock: function (block)
		{
			return this.galleries[block.id] || null;
		}
	}

	// a carousel of the block may have hidden its slides before the links were put in them
	function syncCarousels(block)
	{
		if (!BX.Landing.SliderA11y || !BX.Landing.SliderA11y.sync)
		{
			return;
		}

		[].slice.call(block.querySelectorAll('.slick-initialized')).forEach(function (slider)
		{
			BX.Landing.SliderA11y.sync(slider.slick);
		});
	}

	/************
	 Entry object
	 ************/
	/**
	 *
	 * @param {HTMLElement} block
	 * @constructor
	 */
	BX.Landing.CardGallery = function (block)
	{
		this.uniqId = block.id;
		this.gallery = BX.Landing.CardGallery.getGalleryNode(block);
	}

	/**
	 * Check if block has gallery
	 * @param {HTMLElement} block
	 */
	BX.Landing.CardGallery.isGalleryBlock = function (block)
	{
		return this.getGalleryNode(block) !== null;
	};

	/**
	 * Find gallery node in block
	 * @param {HTMLElement}block
	 * @returns {HTMLElement|null}
	 */
	BX.Landing.CardGallery.getGalleryNode = function (block)
	{
		return block.querySelector(this.GALLERY_SELECTOR);
	};

	BX.Landing.CardGallery.GALLERY_SELECTOR = ".js-gallery-cards";
	BX.Landing.CardGallery.IMAGES_SELECTOR = '[data-fancybox]';
	BX.Landing.CardGallery.DATA_FANCYBOX = 'fancybox';
	BX.Landing.CardGallery.DATA_FANCYBOX_INITIED = 'fancyboxInitied';
	BX.Landing.CardGallery.DATA_FANCYBOX_TITLE = 'caption';
	BX.Landing.CardGallery.DATA_LINK_CLASSES = 'linkClasses';
	BX.Landing.CardGallery.DATA_LAZY_IMAGE = 'lazyImg';
	BX.Landing.CardGallery.CAROUSEL_CLONED_CLASSES = 'slick-cloned';

	BX.Landing.CardGallery.prototype = {
		getId: function()
		{
			return this.uniqId;
		},

		disable: function()
		{
			var images = [].slice.call(this.gallery.querySelectorAll(BX.Landing.CardGallery.IMAGES_SELECTOR));
			images.forEach(function (image)
			{
				delete image.dataset[BX.Landing.CardGallery.DATA_FANCYBOX];
			}, this);
		},

		initImages: function ()
		{
			var images = [].slice.call(this.gallery.querySelectorAll(BX.Landing.CardGallery.IMAGES_SELECTOR));
			images.forEach(function (image)
			{
				// fix double images trouble in slick carousel cloned sliders
				if (BX.findParent(image, {class: BX.Landing.CardGallery.CAROUSEL_CLONED_CLASSES}))
				{
					return;
				}

				if (!this.isImageInit(image))
				{
					this.addOuterLink(image);
				}
			}, this);
		},


		/**
		 * Check is image initied by image or outer link node
		 * @param image
		 * @returns {boolean|*}
		 */
		isImageInit: function (image)
		{
			return (
				(
					image.tagName === "IMG"
					&& image.dataset[BX.Landing.CardGallery.DATA_FANCYBOX_INITIED] === "Y"
				)
				||
				(
					image.tagName === "A"
					&& image.firstChild !== null
					&& this.isImageInit(image.firstChild)
				)
			);
		},

		// create A around the image, need to fancybox popup
		addOuterLink: function (image)
		{
			var src;
			var srcset;
			if(image.dataset[BX.Landing.CardGallery.DATA_LAZY_IMAGE] === 'Y')
			{
				src = image.dataset.src || image.src;
				srcset = image.dataset.srcset || image.srcset;
			}
			else
			{
				src = image.src;
				srcset = image.srcset
			}

			if(!src)
			{
				return;
			}

			// add outer link to image for fancybox activity
			var parent = image.parentNode;
			var outerLink = BX.create('a', {
				attrs: {
					href: src,
					class: image.dataset[BX.Landing.CardGallery.DATA_LINK_CLASSES] || ''
				},
				children: [].slice.call(parent.children)
			});
			if(srcset)
			{
				srcset = src + ' 1x,' + srcset;
				outerLink.dataset.options = '{"image":{"srcset": "'+ srcset + '"}}';
			}
			BX.adjust(parent, {'children': [outerLink]});

			// set unique fancybox id
			outerLink.dataset[BX.Landing.CardGallery.DATA_FANCYBOX] =
				image.dataset[BX.Landing.CardGallery.DATA_FANCYBOX] + '_' + this.uniqId;
			outerLink.dataset[BX.Landing.CardGallery.DATA_FANCYBOX_TITLE] =
				BX.Text.encode(image.getAttribute('alt')) || '';

			// remove data-attribute to disable gallery on <img>
			delete image.dataset[BX.Landing.CardGallery.DATA_FANCYBOX];
			image.dataset[BX.Landing.CardGallery.DATA_FANCYBOX_INITIED] = "Y";
		}
	}

	/**
	 * Check if element is the outer link created by addOuterLink()
	 * @param {?Element} element
	 * @returns {boolean}
	 */
	BX.Landing.CardGallery.isGalleryLink = function (element)
	{
		return (
			BX.Type.isElementNode(element)
			&& element.tagName === 'A'
			&& element.hasAttribute('data-fancybox')
			&& element.querySelector('[data-fancybox-initied="Y"]') !== null
		);
	};

	/*****************************
	 Accessibility of the viewer
	 *****************************/
	var VIEWER_CLASS = 'landing-gallery-viewer';
	var VIEWER_FOCUSABLE_SELECTOR = 'a[href], button, input, select, textarea, iframe, [tabindex]';
	var VIEWER_BUTTON_MESSAGES = {
		close: 'LANDING_GALLERY_BUTTON_CLOSE',
		prev: 'LANDING_GALLERY_BUTTON_PREV',
		next: 'LANDING_GALLERY_BUTTON_NEXT',
		play: 'LANDING_GALLERY_BUTTON_PLAY',
		fullscreen: 'LANDING_GALLERY_BUTTON_FULLSCREEN',
		thumbs: 'LANDING_GALLERY_BUTTON_THUMBS',
		share: 'LANDING_GALLERY_BUTTON_SHARE',
	};

	function getMessage(code, replacements)
	{
		if (!BX.Loc.hasMessage(code))
		{
			return '';
		}

		return BX.Loc.getMessage(code, replacements || null) || '';
	}

	function isGallerySlide(slide)
	{
		return !!(
			slide
			&& slide.opts
			&& slide.opts.$orig
			&& BX.Landing.CardGallery.isGalleryLink(slide.opts.$orig[0])
		);
	}

	function isGalleryViewer(instance)
	{
		return !!(instance && instance.group && isGallerySlide(instance.group[instance.currIndex]));
	}

	var GALLERY_IMAGE_SELECTOR = '[data-fancybox-initied="Y"]';
	var isOpeningByKeyboard = false;

	// Enter on the link (or activation by a screen reader) targets the link itself, which fancybox skips,
	// so the click is passed to the image - the same path a mouse click takes.
	function onGalleryLinkClick(event)
	{
		if (
			event.detail !== 0
			|| event.ctrlKey || event.shiftKey || event.metaKey || event.altKey
			|| !BX.Landing.CardGallery.isGalleryLink(event.target)
		)
		{
			return;
		}

		event.preventDefault();
		isOpeningByKeyboard = true;
		try
		{
			event.target.querySelector(GALLERY_IMAGE_SELECTOR).click();
		}
		finally
		{
			isOpeningByKeyboard = false;
		}
	}

	// the autoplay would hide the slide of the link the focus goes back to when the viewer closes
	function pauseCarouselOfTheLink(instance)
	{
		var slider = instance.group[instance.currIndex].opts.$orig[0].closest('.slick-initialized');
		var slick = slider && slider.slick;
		if (slick && slick.options.autoplay && !slick.paused)
		{
			slick.slickPause();
			instance.landingPausedSlick = slick;
		}
	}

	function onViewerClose(event, instance)
	{
		var slick = instance && instance.landingPausedSlick;
		if (slick)
		{
			instance.landingPausedSlick = null;
			slick.paused = false;
			slick.autoPlay();
		}
	}

	function onViewerInit(event, instance)
	{
		if (!isGalleryViewer(instance))
		{
			return;
		}

		if (isOpeningByKeyboard)
		{
			pauseCarouselOfTheLink(instance);
		}

		var container = instance.$refs.container[0];
		container.classList.add(VIEWER_CLASS);
		container.setAttribute('aria-modal', 'true');

		var dialogLabel = getMessage('LANDING_GALLERY_DIALOG_LABEL');
		if (dialogLabel)
		{
			container.setAttribute('aria-label', dialogLabel);
		}

		Object.keys(VIEWER_BUTTON_MESSAGES).forEach(function (button)
		{
			var label = getMessage(VIEWER_BUTTON_MESSAGES[button]);
			[].slice.call(container.querySelectorAll('[data-fancybox-' + button + ']')).forEach(function (node)
			{
				if (label)
				{
					node.setAttribute('aria-label', label);
				}
				[].slice.call(node.querySelectorAll('svg')).forEach(function (icon)
				{
					icon.setAttribute('aria-hidden', 'true');
				});
			});
		});
	}

	function onViewerImageLoad(event, instance, slide)
	{
		if (!isGallerySlide(slide) || !slide.$image)
		{
			return;
		}

		var link = slide.opts.$orig[0];
		var image = link.querySelector(GALLERY_IMAGE_SELECTOR);
		var alt = image ? (image.getAttribute('alt') || '').trim() : '';
		if (!alt)
		{
			alt = link.textContent.replace(/\s+/g, ' ').trim();
		}
		if (!alt)
		{
			alt = getMessage('LANDING_GALLERY_IMAGE_ALT', {
				'#NUM#': slide.index + 1,
				'#COUNT#': instance.group.length,
			});
		}

		if (alt)
		{
			slide.$image.attr('alt', alt);
		}
	}

	// fancybox makes the thumbnails focusable but gives them neither a name nor a key
	function onViewerThumbsShow(event, instance)
	{
		if (!isGalleryViewer(instance) || !instance.Thumbs || !instance.Thumbs.$list)
		{
			return;
		}

		[].slice.call(instance.Thumbs.$list[0].querySelectorAll('li[data-index]')).forEach(function (thumb)
		{
			var label = getMessage('LANDING_GALLERY_IMAGE_ALT', {
				'#NUM#': Number(thumb.getAttribute('data-index')) + 1,
				'#COUNT#': instance.group.length,
			});
			if (label)
			{
				thumb.setAttribute('role', 'button');
				thumb.setAttribute('aria-label', label);
			}
			[].slice.call(thumb.querySelectorAll('img')).forEach(function (image)
			{
				image.setAttribute('alt', '');
			});
		});
	}

	function onViewerThumbKeydown(event)
	{
		var thumb = event.target;
		if (
			(event.key === 'Enter' || event.key === ' ')
			&& thumb instanceof Element
			&& thumb.matches('.' + VIEWER_CLASS + ' .fancybox-thumbs li[data-index]')
		)
		{
			event.preventDefault();
			thumb.click();
		}
	}

	function onViewerShow(event, instance)
	{
		if (instance.firstRun && isGalleryViewer(instance))
		{
			instance.$refs.container[0].focus({preventScroll: true});
		}
	}

	function isFocusStop(element)
	{
		return (
			!element.disabled
			&& element.tabIndex >= 0
			&& element.getClientRects().length > 0
			&& window.getComputedStyle(element).visibility !== 'hidden'
		);
	}

	// fancybox only pulls back the focus that has already left, Tab has to wrap round inside the viewer
	function onViewerKeydown(event)
	{
		if (event.key !== 'Tab' || !(event.target instanceof Element))
		{
			return;
		}

		var container = event.target.closest('.' + VIEWER_CLASS);
		if (!container)
		{
			return;
		}

		// after an idle pause fancybox hides the buttons until the next key, and this handler runs before its own
		var instance = $.fancybox && $.fancybox.getInstance();
		if (instance && instance.isHiddenControls)
		{
			instance.showControls();
		}

		var stops = [container].concat(
			[].slice.call(container.querySelectorAll(VIEWER_FOCUSABLE_SELECTOR)).filter(isFocusStop)
		);
		var index = stops.indexOf(document.activeElement);
		var next = null;
		// the container itself is out of the tab order, so Shift+Tab from the first button would leave the viewer
		if (event.shiftKey && (index === 0 || index === 1))
		{
			next = stops[stops.length - 1];
		}
		else if (!event.shiftKey && index === stops.length - 1)
		{
			next = stops[0];
		}

		if (next)
		{
			event.preventDefault();
			next.focus({preventScroll: true});
		}
	}

	var $ = window.jQueryLanding || window.jQuery;
	if ($)
	{
		document.addEventListener('click', onGalleryLinkClick);
		document.addEventListener('keydown', onViewerKeydown);
		document.addEventListener('keydown', onViewerThumbKeydown);
		$(document)
			.on('onInit.fb', onViewerInit)
			.on('afterLoad.fb', onViewerImageLoad)
			.on('afterShow.fb', onViewerShow)
			.on('onThumbsShow.fb', onViewerThumbsShow)
			.on('afterClose.fb', onViewerClose)
		;
	}

	/****************
	 * Event handlers
	 ****************/
	BX.addCustomEvent("BX.Landing.Block:init", function (event)
	{
		if(BX.Landing.getMode() === "edit")
		{
			BX.Landing.CardGalleryCollection.disableBlock(event.block);
		}
		else
		{
			BX.Landing.CardGalleryCollection.initBlock(event.block);
		}
	});
})();