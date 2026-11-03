;(function () {

'use strict';

/**
 * Accessibility of the panel items (button semantics, Tab order, Enter/Space
 * activation, getFocusableNode) is covered by unit tests that live in another
 * module: crm/install/js/crm/kanban/tests/unit/action-panel-accessibility.test.js.
 * This extension is legacy and has no bundle config of its own, so it cannot host
 * a chef test suite; crm.kanban loads it and takes the classes from the BX
 * namespace exactly as the product does.
 *
 * Run them when changing this file:
 *   chef test unit crm.kanban --project chromium
 *
 * The panel sits under every list of Bitrix24, so a change here reaches far
 * beyond the kanban the tests are named after.
 */

BX.namespace('BX.UI');

// Nodes that take keyboard focus on their own.
//
// One list answers both questions an item asks -- "can this node be focused" and
// "does the item already contain something interactive" -- because the two must
// not disagree. Content that cannot be focused (a disabled control, tabindex="-1")
// would otherwise stop the item from becoming a button while offering nothing to
// focus in its place, leaving the whole item unreachable from the keyboard.
//
// Such content may then end up inside a role="button", and that is allowed: what
// ARIA forbids there is a focusable descendant. It does lose its own place in the
// accessibility tree, which is the correct reading anyway -- it is not operable,
// while the item as a whole is.
var focusableSelector = [
	'a[href]',
	'button:not([disabled])',
	'input:not([disabled]):not([type="hidden"])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'summary',
	'[contenteditable]:not([contenteditable="false"])',
	'[tabindex]:not([tabindex="-1"])'
].join(', ');

function isFocusableNode(node)
{
	return node.matches(focusableSelector);
}

/**
 * Tells whether the node is laid out. Focus silently stays where it was when it
 * is moved to a node with 'display: none', which is how the panel hides items.
 *
 * @param {HTMLElement} node
 * @returns {boolean}
 */
function isDisplayed(node)
{
	for (var current = node; current && current.nodeType === 1; current = current.parentElement)
	{
		if (current.hidden || (current.style && current.style.display === 'none'))
		{
			return false;
		}
	}

	// A node outside the document has no boxes to measure, so the inline check above
	// is all there is; inside the document an empty rect list means it is not rendered.
	return !node.isConnected || node.getClientRects().length > 0;
}

BX.UI.ActionPanel.Item = function(options)
{
	this.id = options.id;
	this.type = options.type;
	this.text = options.text;
	this.html = options.text;
	this.icon = options.icon;
	this.title = options.title;
	this.iconOnly = options.iconOnly;
	this.additionalClassForPanel = options.additionalClassForPanel;
	this.submenuOptions = {};
	if (options.submenuOptions && BX.type.isString(options.submenuOptions))
	{
		try
		{
			this.submenuOptions = JSON.parse(options.submenuOptions);
		}
		catch (e)
		{
		}
	}
	this.buttonIconClass = options.buttonIconClass;
	this.onclick = options.onclick;
	this.href = options.href;
	this.items = options.items;
	this.actionPanel = options.actionPanel;
	this.options = options;
	this.attributes = BX.prop.getObject(options, 'attributes');
	this.dataset = options.dataset;
	this.disabled = options.disabled;
	this.submenuTrigger = null;
	this.layout = {
		container: null,
		icon: null,
		text: null
	};
};

BX.UI.ActionPanel.Item.prototype =
{
	changeIconClass: function(iconClass)
	{
		BX.removeClass(this.layout.container, this.buttonIconClass);
		BX.addClass(this.layout.container, iconClass);

		this.buttonIconClass = iconClass;
	},

	/**
	 * Test id of the item. The panel renders many items at once, so the shared
	 * prefix alone selects all of them; the item id is mixed in to tell them
	 * apart. Items without an id keep the bare prefix, hence the "starts with"
	 * form in selectors: '[data-testid^="ui-action-panel-item"]'.
	 *
	 * @returns {string}
	 */
	getTestId: function()
	{
		var base = 'ui-action-panel-item';

		return BX.type.isNotEmptyString(this.id) || BX.type.isNumber(this.id)
			? base + '-' + this.id
			: base;
	},

	render: function()
	{
		var selectorType;

		this.href ? selectorType = "a" : selectorType = "div";

		var className = "ui-action-panel-item " + (this.additionalClassForPanel ? this.additionalClassForPanel+' ':'') + (this.disabled ? 'ui-action-panel-item-is-disabled' : '');
		if (this.buttonIconClass)
		{
			className = 'ui-btn ui-btn-lg ui-btn-link ' + this.buttonIconClass;
		}

		if (this.onclick && BX.type.isArray(this.items) && this.items.length > 0)
		{
			// Native <button> submenu trigger: mark it as a menu opener for AT.
			// It is icon-only, so the name comes from aria-label built on the main button text.
			var submenuTriggerAttrs = {
				'aria-haspopup': 'menu',
				'aria-expanded': 'false',
				'data-testid': this.getTestId() + '-submenu-trigger'
			};

			var submenuTriggerLabel = this.getSubmenuTriggerLabel();
			if (submenuTriggerLabel)
			{
				submenuTriggerAttrs['aria-label'] = submenuTriggerLabel;
			}

			this.submenuTrigger = BX.create('button', {
				props: {
					className: 'ui-btn-menu',
				},
				attrs: submenuTriggerAttrs,
				events: {
					click: this.handleMenuClick.bind(this)
				}
			});

			this.layout.container = BX.create('div', {
				props: {
					className: 'ui-btn-split ui-btn-link' + (this.buttonIconClass ? ' ' + this.buttonIconClass : '')
				},
				children: [
					BX.create('button', {
						props: {
							className: 'ui-btn-main',
						},
						events: {
							click: this.handleMainClick.bind(this)
						},
						text: this.text
					}),
					this.submenuTrigger
				],
				attrs: this.attributes,
				dataset: {
					role: 'action-panel-item',
					testid: this.getTestId()
				}
			});
		}
		else
		{
			this.layout.container = BX.create(selectorType, {
				props: {
					className: className
				},
				children: [
					this.icon ? '<span class="ui-action-panel-item-icon"><img src="' + this.icon + '"></span>' : null,
					(this.text && !this.buttonIconClass && this.iconOnly !== true ) ? '<span class="ui-action-panel-item-title">' + this.text + '</span>' : (this.iconOnly !== true ? this.text : null)
				],
				attrs: this.attributes,
				dataset: {
					role: 'action-panel-item',
					testid: this.getTestId()
				},
				events: {
					click: this.handleClick.bind(this)
				}
			});

			this.makeItemAccessible();
		}

		this.href ? this.layout.container.setAttribute('href', this.href) : null;
		(this.href || this.title) ? this.layout.container.setAttribute('title', (this.title ? this.title :this.text)) : null;

		if (BX.type.isString(this.onclick))
		{
			this.layout.container.setAttribute('onclick', this.onclick);
		}

		if (this.dataset)
		{
			BX.adjust(this.layout.container, {'dataset': this.dataset});
		}

		if (this.options.hide)
		{
			this.hide();
		}

		if (this.id)
		{
			this.layout.container.id = this.id;
		}

		return this.layout.container;
	},

	/**
	 * Tells whether the item will expose a name to assistive technology: own text,
	 * a title attribute (set right after render) or an explicitly passed aria-label.
	 *
	 * @param {HTMLElement} container
	 * @returns {boolean}
	 */
	hasAccessibleName: function(container)
	{
		if (BX.util.trim(container.textContent || '') !== '')
		{
			return true;
		}

		if (BX.type.isNotEmptyString(this.title))
		{
			return true;
		}

		return BX.type.isNotEmptyString(container.getAttribute('aria-label'))
			|| BX.type.isNotEmptyString(container.getAttribute('aria-labelledby'));
	},

	/**
	 * Tells whether the rendered item contains a control the keyboard can reach on its
	 * own. The check runs over the parsed markup, not over the source string, so it also
	 * covers content added to the item after render, and it uses the same definition of
	 * a focusable node as getFocusableNode(): whatever stops the item from becoming a
	 * button has to be something getFocusableNode() can then offer instead.
	 *
	 * @param {HTMLElement} container
	 * @returns {boolean}
	 */
	hasInteractiveContent: function(container)
	{
		return container.querySelector(focusableSelector) !== null;
	},

	/**
	 * Returns the node that takes keyboard focus for this item, or null when the item
	 * cannot be focused: disabled, hidden or not keyboard reachable at all. Part of the
	 * panel contract, see BX.UI.ActionPanel.getFirstFocusableNode().
	 *
	 * @returns {HTMLElement|null}
	 */
	getFocusableNode: function()
	{
		var container = this.layout.container;
		if (!container || this.isDisabled() || !this.isVisible() || !isDisplayed(container))
		{
			return null;
		}

		if (isFocusableNode(container))
		{
			return container;
		}

		// A split button keeps the item semantics on its native child buttons, and an
		// item with interactive content is reachable through that content.
		var child = container.querySelector(focusableSelector);

		return child && isDisplayed(child) ? child : null;
	},

	/**
	 * Builds an accessible name for the icon-only submenu trigger of a split button.
	 * A main button without text leaves nothing to build the name from, so the
	 * trigger takes the name the panel already gives its own menu opener.
	 *
	 * @returns {string}
	 */
	getSubmenuTriggerLabel: function()
	{
		var text = BX.type.isNotEmptyString(this.text) ? BX.util.trim(this.text) : '';
		if (text === '')
		{
			return BX.message('JS_UI_ACTIONPANEL_MORE_BLOCK') || '';
		}

		var template = BX.message('JS_UI_ACTIONPANEL_SUBMENU_TRIGGER_FOR');

		return template ? template.replace('#TEXT#', text) : text;
	},

	/**
	 * Makes a non-native panel item (rendered as a <div>) keyboard-reachable and
	 * semantically a button: role, tabindex and Enter/Space activation. Links
	 * (<a href>) are natively focusable and left untouched. Submenu triggers get
	 * menu semantics.
	 */
	makeItemAccessible: function()
	{
		var container = this.layout.container;
		if (!container || this.href)
		{
			return;
		}

		// An icon-only item without a title has no text at all: making it focusable
		// would put a nameless control into the accessibility tree, so leave it as is.
		if (!this.hasAccessibleName(container))
		{
			return;
		}

		// 'text' is rendered as markup, so a consumer may put a link or a form control
		// inside the item. Content the keyboard can reach on its own must not be wrapped
		// in a button; the item keeps its plain semantics and stays reachable through the
		// control it contains. Content that cannot be reached does not count -- see
		// focusableSelector.
		if (this.hasInteractiveContent(container))
		{
			return;
		}

		container.setAttribute('role', 'button');
		container.setAttribute('tabindex', this.disabled ? '-1' : '0');

		if (this.disabled)
		{
			container.setAttribute('aria-disabled', 'true');
		}

		if (BX.type.isArray(this.items) && this.items.length > 0)
		{
			container.setAttribute('aria-haspopup', 'menu');
			container.setAttribute('aria-expanded', 'false');
			this.submenuTrigger = container;
		}

		BX.bind(container, 'keydown', this.handleKeyDown.bind(this));
	},

	/**
	 * Activates the item on Enter/Space, matching a native button.
	 *
	 * Activation goes through a click dispatched on the item node, not through a direct
	 * call of the click handler. An item carries its action either as a function, which
	 * consumers write against a MouseEvent, or as a string, which lands in the inline
	 * onclick attribute and only ever runs on a real click event. Dispatching makes the
	 * keyboard do exactly what the mouse does for both kinds.
	 *
	 * @param {KeyboardEvent} event
	 */
	handleKeyDown: function(event)
	{
		if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar')
		{
			return;
		}

		event.preventDefault();

		if (this.isDisabled())
		{
			return;
		}

		this.layout.container.click();
	},

	show: function ()
	{
		BX.show(this.layout.container, 'block');
	},

	showAsInlineBlock: function ()
	{
		BX.style(this.layout.container,'display','inline-block');
	},

	hide: function ()
	{
		BX.hide(this.layout.container, 'none');
	},

	destroy: function ()
	{
		BX.remove(this.layout.container);
	},

	isVisible: function()
	{
		if (this.layout.container.offsetTop > 8)
		{
			return false;
		}

		return true;
	},

	isNotFit: function()
	{
		return this.layout.container.offsetHeight > 0 && !this.isVisible();
	},

	handleMenuClick: function (event)
	{
		if (this.isDisabled())
		{
			event.preventDefault();

			return;
		}

		return this.openSubMenu();
	},

	handleMainClick: function (event)
	{
		if (this.isDisabled())
		{
			event.preventDefault();

			return;
		}

		if (BX.type.isFunction(this.onclick))
		{
			this.onclick.call(this, event, this);
		}
	},

	handleClick: function (event)
	{
		if (this.isDisabled())
		{
			event.preventDefault();

			return;
		}
		if (BX.type.isArray(this.items) && this.items.length > 0)
		{
			this.openSubMenu();
		}
		else
		{
			if (BX.type.isFunction(this.onclick))
			{
				this.onclick.call(this, event, this);
			}
		}
	},

	isDisabled: function()
	{
		return this.disabled;
	},

	/**
	 * Puts the item in or out of the Tab order. Only an item that carries the button
	 * semantics itself is written to: a link is natively focusable and content a
	 * consumer put inside the item is not this extension's to touch.
	 *
	 * Called both when the item is enabled or disabled and when the whole panel is
	 * shown or hidden, see BX.UI.ActionPanel.setPanelInteractive(). A disabled item
	 * stays out of the Tab order in any case.
	 *
	 * @param {boolean} tabbable
	 */
	setTabbable: function(tabbable)
	{
		var container = this.layout ? this.layout.container : null;
		if (!container || container.getAttribute('role') !== 'button')
		{
			return;
		}

		container.setAttribute('tabindex', tabbable && !this.isDisabled() ? '0' : '-1');
	},

	disable: function()
	{
		this.disabled = true;
		if (this.layout && this.layout.container)
		{
			BX.data(this.layout.container, 'slider-ignore-autobinding', true);
			this.layout.container.classList.add('ui-action-panel-item-is-disabled');
			if (this.layout.container.getAttribute('role') === 'button')
			{
				this.layout.container.setAttribute('aria-disabled', 'true');
			}
			this.setTabbable(false);
		}
	},

	enable: function()
	{
		this.disabled = false;
		if (this.layout && this.layout.container)
		{
			BX.data(this.layout.container, 'slider-ignore-autobinding', false);
			this.layout.container.classList.remove('ui-action-panel-item-is-disabled');
			if (this.layout.container.getAttribute('role') === 'button')
			{
				this.layout.container.setAttribute('aria-disabled', 'false');
			}
			this.setTabbable(true);
		}
	},

	openSubMenu: function()
	{
		if (!BX.type.isArray(this.items) || this.items.length === 0)
		{
			return;
		}

		var bindElement = this.layout.container;
		var submenuTrigger = this.submenuTrigger;
		var popupMenuOptions = {
			className: "ui-action-panel-item-popup-menu",
			angle: true,
			zIndex: this.actionPanel.zIndex? this.actionPanel.zIndex + 1 : null,
			offsetLeft: bindElement.offsetWidth / 2,
			closeByEsc: true,
			events: {
				onPopupClose: function() {
					popupMenu.destroy();
					BX.removeClass(bindElement, "ui-action-panel-item-active");
					if (submenuTrigger)
					{
						submenuTrigger.setAttribute('aria-expanded', 'false');
					}
				}
			}
		};
		popupMenuOptions = BX.mergeEx(popupMenuOptions, this.submenuOptions);
		var popupMenu = BX.PopupMenu.create("ui-action-panel-item-popup-menu", bindElement, this.items, popupMenuOptions);

		popupMenu.layout.menuContainer.setAttribute("data-tile-grid", "tile-grid-stop-close");
		popupMenu.show();
		BX.addClass(this.layout.container, "ui-action-panel-item-active");
		if (submenuTrigger)
		{
			submenuTrigger.setAttribute('aria-expanded', 'true');
		}
	}
}

})();
