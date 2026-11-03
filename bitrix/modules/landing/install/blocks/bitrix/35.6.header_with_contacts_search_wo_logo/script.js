;(function()
{
	'use strict';

	/*
	 * The main menu of the clothes store (0.menu_03) is served from here. The menu is a block of the common layer and
	 * its own files stay as they are; this row stands beside it in the header of the clothes store only. The search of
	 * the row loads ui.bootstrap4 with a jQuery of its own, and its data api toggles the menu a second time on every
	 * press of the button: the menu never closes. Where the menu stands without this row, there is no second Bootstrap.
	 */
	var MENU_SELECTOR = '.block-wrapper.block-0-menu-03';
	var TOGGLER_SELECTOR = '.navbar-toggler[data-toggle="collapse"]';

	BX.ready(function()
	{
		var jQuery = window.jQueryLanding || window.jQuery;
		if (!jQuery || !jQuery.fn.collapse || isEditMode())
		{
			return;
		}

		Array.prototype.forEach.call(document.querySelectorAll(MENU_SELECTOR), function(menu) {
			initMenuButton(menu, jQuery);
		});
	});

	function isEditMode()
	{
		return Boolean(BX.Landing && BX.Landing.getMode && BX.Landing.getMode() === 'edit');
	}

	function initMenuButton(menu, jQuery)
	{
		var toggler = menu.querySelector(TOGGLER_SELECTOR);
		var panel = toggler ? panelOf(menu, toggler) : null;
		if (!panel)
		{
			return;
		}

		// The button stands right of the logo and the menu opens below it, while the markup has the menu first:
		// Tab from the button went past the open menu.
		if (panel.parentNode === toggler.parentNode && panel.compareDocumentPosition(toggler) & Node.DOCUMENT_POSITION_FOLLOWING)
		{
			panel.parentNode.insertBefore(toggler, panel);
		}

		// Enter and Space on the button come as a click too. Both data apis listen on the document: the press stops
		// here and toggles the menu once, by the Bootstrap whose events menu_init.js switches the hamburger by.
		toggler.addEventListener('click', function(event) {
			event.preventDefault();
			event.stopPropagation();

			var $panel = jQuery(panel);
			$panel.collapse($panel.data('bs.collapse') ? 'toggle' : jQuery(toggler).data());
		}, true);
	}

	function panelOf(menu, toggler)
	{
		var target = toggler.getAttribute('data-target') || '';
		var panel = target.charAt(0) === '#' ? document.getElementById(target.slice(1)) : null;

		return panel && menu.contains(panel) ? panel : null;
	}
})();
