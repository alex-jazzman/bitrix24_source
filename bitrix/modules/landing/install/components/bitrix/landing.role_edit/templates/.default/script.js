var roleFormFieldsChanged = false;

/**
 * The block of errors arrives from the server already in the markup, so its announcement never
 * fires: a page rendered with an error moves the focus onto the block instead.
 */
BX.ready(function()
{
	var error = BX('landing-role-edit-error');
	if (error)
	{
		error.focus();
	}
});

BX.ready(function()
{
	BX.bind(
		BX('landing-mode-form-submit'),
		'click',
		function()
		{
			BX('landing-mode-form').submit();
		}
	);

	// bind all select/input onchange
	var obSelect = BX('landing-role-edit').querySelectorAll('select,input');
	obSelect.forEach(function(element)
	{
		BX(element).addEventListener(
			'change',
			function()
			{
				roleFormFieldsChanged = true;
			}
		);
	});

	// remove rights
	var links = BX.findChild(
		BX('landing-role-rights-table'),
		{
			class: 'landing-rightsblock-remove'
		},
		true,
		true
	);
	links.forEach(function(element){
		BX(element).addEventListener(
			'click',
			function()
			{
				var id = BX.data(BX(element), 'id');
				if (id)
				{
					var tr = BX.findChild(
						BX('landing-role-rights-table'),
						{
							class: 'landing-rightsblock-' + id
						},
						true,
						true
					);
					if (tr.length)
					{
						landingRoleEditFocusAfterRemove(tr[tr.length - 1]);
					}
					tr.forEach(function(element){
						BX.remove(BX(element));
					});
				}
			}.bind(this)
		);
	});
});

/**
 * Keeps the keyboard in the form after the rows of a site are dropped: the delete of the next site,
 * the trigger of the site menu when the last site is gone.
 */
function landingRoleEditFocusAfterRemove(lastRow)
{
	for (var sibling = lastRow.nextElementSibling; sibling; sibling = sibling.nextElementSibling)
	{
		var next = sibling.querySelector('.landing-rightsblock-remove');
		if (next)
		{
			next.focus();

			return;
		}
	}

	var addSite = BX('landing-role-add');
	if (addSite)
	{
		addSite.focus();

		return;
	}

	// the trigger of the site menu is only rendered while some site is left to add: the table the
	// rows were dropped from is the receiver the page has in every state
	var table = BX('landing-role-rights-table');
	if (table)
	{
		table.focus();
	}
}

function showSiteMenu(node, items, messages)
{
	var menuItems = [];
	var msg = BX.Landing.UI.Tool.ActionDialog.getInstance();

	for (var id in items)
	{
		if (items[id].DELETED === 'Y')
		{
			continue;
		}
		menuItems.push({
			text: BX.util.htmlspecialchars(items[id].TITLE),
			dataset: {testid: 'role-edit-site-menu-item'},
			onclick: (function (value)
			{
				return function ()
				{
					var redirect = function()
					{
						window.location.href = BX.util.add_url_param(
							window.location.href.split('#')[0] + '#site' + items[value].ID,
							{
								site: items[value].ID
							}
						);
					};
					if (roleFormFieldsChanged)
					{
						var promise = msg.show({
							content: messages.LANDING_ALERT_CONTENT_RELOADED,
							type: 'confirm'
						});
						promise
							.then(
								function()
								{
									redirect();
								},
								function()
								{
								}
							);
					}
					else
					{
						redirect();
					}
				}
			})(id)
		});
	}

	var popup = new BX.PopupMenuWindow('landing-role-popup', node, menuItems, {
		autoHide : true,
		angle: true,
		className: 'landing-role-popup',
		offsetTop: 0,
		offsetLeft: 0,
		events: {
			onPopupShow: function()
			{
				node.setAttribute('aria-expanded', 'true');
			},
			onPopupClose: function()
			{
				node.setAttribute('aria-expanded', 'false');
				landingRoleEditReturnFocus(node);
			}
		}
	});
	popup.show();
}

/**
 * Closing the menu leaves the focus on the body, and an item of the menu opens a dialog that is
 * focused itself: the trigger takes the focus back only when nothing else has claimed it.
 */
function landingRoleEditReturnFocus(trigger)
{
	var active = document.activeElement;
	if (!active || active === document.body)
	{
		trigger.focus();
	}
}