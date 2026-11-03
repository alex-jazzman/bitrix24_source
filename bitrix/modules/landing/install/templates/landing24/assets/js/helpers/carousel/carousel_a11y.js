;(function ($)
{
	"use strict";

	BX.namespace("BX.Landing.SliderA11y");

	const EVENT_NAMESPACE = '.landingA11y';
	const CONTROL_SELECTOR = '.js-pagination > li, .js-prev, .js-next';
	const FOCUSABLE_SELECTOR = 'a[href], button, input, select, textarea, iframe, [tabindex]';
	const SAVED_TABINDEX_ATTRIBUTE = 'data-landing-a11y-tabindex';

	/**
	 * Keyboard and screen reader layer over slick: must be attached before slick init to catch the init event.
	 *
	 * @param {HTMLElement} sliderNode
	 */
	BX.Landing.SliderA11y.attach = function (sliderNode)
	{
		const $slider = $(sliderNode);
		$slider.off(EVENT_NAMESPACE);

		$slider.on(
			'init.landingA11y reInit.landingA11y breakpoint.landingA11y afterChange.landingA11y',
			function (event, slick)
			{
				if (event.target === sliderNode)
				{
					BX.Landing.SliderA11y.sync(slick);
				}
			}
		);

		// slick switches aria-hidden right after beforeChange, so the tab order is fixed a moment later
		$slider.on('beforeChange' + EVENT_NAMESPACE, function (event, slick)
		{
			if (event.target === sliderNode)
			{
				queueMicrotask(function ()
				{
					BX.Landing.SliderA11y.sync(slick);
				});
			}
		});

		$slider.on('keydown' + EVENT_NAMESPACE, CONTROL_SELECTOR, function (event)
		{
			const control = event.currentTarget;
			if (event.target !== control)
			{
				return;
			}

			const role = control.getAttribute('role');
			if (role === 'button' && (event.key === 'Enter' || event.key === ' '))
			{
				event.preventDefault();
				control.click();
			}
			else if (role === 'tab')
			{
				onDotKeydown(event, control, sliderNode);
			}
		});

		// a mouse click must not focus the control: focus would pause the autoplay
		$slider.on('mousedown' + EVENT_NAMESPACE, CONTROL_SELECTOR, function (event)
		{
			event.preventDefault();
			if (document.activeElement && document.activeElement !== document.body)
			{
				document.activeElement.blur();
			}
		});
	};

	/**
	 * Idempotent: safe to call on every slick event.
	 *
	 * @param {Object} slick
	 */
	BX.Landing.SliderA11y.sync = function (slick)
	{
		if (!slick || !slick.$slideTrack)
		{
			return;
		}

		syncSlides(slick);
		syncDots(slick);
		syncArrow(slick.$prevArrow, 'LANDING_CAROUSEL_PREV');
		syncArrow(slick.$nextArrow, 'LANDING_CAROUSEL_NEXT');
	};

	function syncSlides(slick)
	{
		slick.$slideTrack.children('.slick-slide').each(function (index, slide)
		{
			const focusables = [].slice.call(slide.querySelectorAll(FOCUSABLE_SELECTOR));
			if (slide.getAttribute('aria-hidden') === 'true')
			{
				focusables.forEach(hideFromTabOrder);
			}
			else
			{
				focusables.forEach(restoreTabOrder);
			}
		});
	}

	function hideFromTabOrder(element)
	{
		if (element.hasAttribute(SAVED_TABINDEX_ATTRIBUTE) || element.tabIndex < 0)
		{
			return;
		}

		element.setAttribute(SAVED_TABINDEX_ATTRIBUTE, element.getAttribute('tabindex') || '');
		element.setAttribute('tabindex', '-1');
	}

	function restoreTabOrder(element)
	{
		if (!element.hasAttribute(SAVED_TABINDEX_ATTRIBUTE))
		{
			return;
		}

		const savedTabIndex = element.getAttribute(SAVED_TABINDEX_ATTRIBUTE);
		if (savedTabIndex === '')
		{
			element.removeAttribute('tabindex');
		}
		else
		{
			element.setAttribute('tabindex', savedTabIndex);
		}
		element.removeAttribute(SAVED_TABINDEX_ATTRIBUTE);
	}

	function getDots(dotsList)
	{
		return [].slice.call(dotsList.children).filter(function (child)
		{
			return child.tagName === 'LI';
		});
	}

	// WAI-ARIA APG tabs: the dots are one stop of Tab, the arrow keys, Home and End move between them
	function onDotKeydown(event, dot, sliderNode)
	{
		const dots = getDots(dot.parentNode);
		const index = dots.indexOf(dot);
		let targetIndex = null;

		switch (event.key)
		{
			case 'ArrowRight':
			case 'ArrowDown':
				targetIndex = (index + 1) % dots.length;
				break;
			case 'ArrowLeft':
			case 'ArrowUp':
				targetIndex = (index - 1 + dots.length) % dots.length;
				break;
			case 'Home':
				targetIndex = 0;
				break;
			case 'End':
				targetIndex = dots.length - 1;
				break;
			case 'Enter':
			case ' ':
				event.preventDefault();
				if (dot.getAttribute('aria-selected') !== 'true')
				{
					dot.click();
				}

				return;
			default:
				return;
		}

		if (event.altKey || event.ctrlKey || event.metaKey)
		{
			return;
		}

		event.preventDefault();
		dots[targetIndex].click();

		// slick ignores a click while a slide is still sliding: the focus goes to the dot that is active now
		BX.Landing.SliderA11y.sync(sliderNode.slick);
		const activeDot = dots.find(function (item)
		{
			return item.classList.contains('slick-active');
		});
		if (activeDot)
		{
			activeDot.focus({ preventScroll: true });
		}
	}

	function syncDots(slick)
	{
		if (!slick.$dots || !slick.$dots.length || !BX.Loc.hasMessage('LANDING_CAROUSEL_DOT_LABEL'))
		{
			return;
		}

		const dotsList = slick.$dots[0];
		const dots = getDots(dotsList);
		if (dots.length < 2)
		{
			return;
		}

		dotsList.setAttribute('role', 'tablist');
		const groupLabel = getMessage('LANDING_CAROUSEL_DOTS_LABEL');
		if (groupLabel)
		{
			dotsList.setAttribute('aria-label', groupLabel);
		}

		// the tabindex follows the active dot, the focus stays where it is: the autoplay must not move it
		dots.forEach(function (dot, index)
		{
			const isActive = dot.classList.contains('slick-active');
			dot.setAttribute('role', 'tab');
			dot.setAttribute('aria-label', getMessage('LANDING_CAROUSEL_DOT_LABEL', {
				'#NUM#': getDotSlideNumber(slick, index),
				'#COUNT#': slick.slideCount,
			}));
			dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
			dot.setAttribute('tabindex', isActive ? '0' : '-1');
		});
	}

	// a dot leads to a page of slides: the number is of the slide slick goes to, as its dot click computes it
	function getDotSlideNumber(slick, dotIndex)
	{
		const slideIndex = slick.checkNavigable(dotIndex * slick.options.slidesToScroll);

		return Math.min(Math.max(slideIndex, 0), slick.slideCount - 1) + 1;
	}

	function syncArrow($arrow, messageCode)
	{
		if (!$arrow || !$arrow.length || $arrow.hasClass('slick-hidden'))
		{
			return;
		}

		const label = getMessage(messageCode);
		if (label)
		{
			setButton($arrow[0], label);
		}
	}

	function setButton(element, label)
	{
		element.setAttribute('role', 'button');
		element.setAttribute('tabindex', '0');
		element.setAttribute('aria-label', label);
	}

	function getMessage(code, replacements)
	{
		if (!BX.Loc.hasMessage(code))
		{
			return '';
		}

		return BX.Loc.getMessage(code, replacements || null) || '';
	}
})(window.jQueryLanding || jQuery);
