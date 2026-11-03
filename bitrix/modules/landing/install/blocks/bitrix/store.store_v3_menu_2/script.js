;(function()
{
	'use strict';

	var BLOCK_SELECTOR = '.block-wrapper.block-store-store-v3-menu-2';
	var PANEL_LABEL_CODE = 'LNDBLCK_STOREMENUV3_2_PANEL_LABEL';
	var CLOSE_LABEL_CODE = 'LNDBLCK_STOREMENUV3_2_PANEL_CLOSE_LABEL';
	// The theme hides the panel from this width on (d-lg-none).
	var WIDE_SCREEN_QUERY = '(min-width: 992px)';

	BX.ready(function()
	{
		var jQuery = window.jQueryLanding || window.jQuery;
		if (!jQuery || isEditMode())
		{
			return;
		}

		Array.prototype.forEach.call(document.querySelectorAll(BLOCK_SELECTOR), function(block) {
			initPanel(block, jQuery);
		});
	});

	function isEditMode()
	{
		return Boolean(BX.Landing && BX.Landing.getMode && BX.Landing.getMode() === 'edit');
	}

	function initPanel(block, jQuery)
	{
		var panel = block.querySelector('.navbar-collapse');
		var toggler = block.querySelector('button.navbar-toggler');
		if (!panel || !toggler)
		{
			return;
		}

		// Only the toggler closes the panel: it also resets the hamburger and the page scroll lock.
		// While collapsing, bootstrap ignores the click, but the scroll lock would still flip.
		var close = function() {
			if (panel.classList.contains('show'))
			{
				toggler.click();
			}
		};

		panel.addEventListener('keydown', function(event) {
			if (event.key === 'Escape')
			{
				close();
			}
		});

		var closeButton = block.querySelector('.u-navbar-slider--close');
		if (closeButton)
		{
			initCloseButton(closeButton, close);
		}

		closeOnWideScreen(close);
		initModality(panel, toggler, jQuery);
	}

	function closeOnWideScreen(close)
	{
		var wideScreen = window.matchMedia(WIDE_SCREEN_QUERY);
		if (typeof wideScreen.addEventListener !== 'function')
		{
			return;
		}

		wideScreen.addEventListener('change', function(event) {
			if (event.matches)
			{
				close();
			}
		});
	}

	function initCloseButton(closeButton, close)
	{
		closeButton.setAttribute('role', 'button');
		closeButton.setAttribute('tabindex', '0');
		setLabel(closeButton, CLOSE_LABEL_CODE);

		closeButton.addEventListener('click', close);
		closeButton.addEventListener('keydown', function(event) {
			if (event.key === 'Enter' || event.key === ' ')
			{
				event.preventDefault();
				close();
			}
		});
	}

	function initModality(panel, toggler, jQuery)
	{
		var accessibility = (BX.UI && BX.UI.Accessibility) || null;
		if (!accessibility || !accessibility.FocusTrap)
		{
			return;
		}

		var trap = new accessibility.FocusTrap(panel, {
			initialFocus: true,
			restoreFocus: toggler,
			isolateOutside: false,
		});

		jQuery(panel).on('shown.bs.collapse', function(event) {
			if (event.target !== panel)
			{
				return;
			}

			panel.setAttribute('role', 'dialog');
			panel.setAttribute('aria-modal', 'true');
			setLabel(panel, PANEL_LABEL_CODE);
			trap.activate();
		});

		jQuery(panel).on('hidden.bs.collapse', function(event) {
			if (event.target !== panel)
			{
				return;
			}

			trap.deactivate();
			panel.removeAttribute('aria-modal');
			panel.removeAttribute('role');
			panel.removeAttribute('aria-label');
		});
	}

	function setLabel(node, messageCode)
	{
		var label = BX.message(messageCode);
		if (BX.Type.isStringFilled(label))
		{
			node.setAttribute('aria-label', label);
		}
	}
})();
