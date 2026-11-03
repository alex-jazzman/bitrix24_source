(function (window) {

if (!!window.JCCatalogCompareList)
{
	return;
}

// Declared by the epilog; a page that answered without them loses the focus transfer and the
// announcement alone.
function getAccessibility()
{
	return (!!BX.UI && !!BX.UI.Accessibility ? BX.UI.Accessibility : null);
}

window.JCCatalogCompareList = function (params)
{
	this.obCompare = null;
	this.obAdminPanel = null;
	this.visual = params.VISUAL;
	this.ajax = params.AJAX;
	this.position = params.POSITION;
	this.messages = params.MESSAGES || {};
	this.removedByKeyboard = false;

	BX.ready(BX.proxy(this.init, this));
};

window.JCCatalogCompareList.prototype.init = function()
{
	this.obCompare = BX(this.visual.ID);
	if (BX.type.isElementNode(this.obCompare))
	{
		BX.addCustomEvent(window, "OnCompareChange", BX.proxy(this.reload, this));
		BX.bindDelegate(this.obCompare, 'click', {tagName : 'a'}, BX.proxy(this.deleteCompare, this));
		// On the panel and not on the document: a listener of the document would close the panel from
		// anywhere on the page and would take the key away from foreign popups.
		BX.bind(this.obCompare, 'keydown', BX.proxy(this.onKeyDown, this));
		if (this.position.fixed && this.position.align.vertical === 'top')
		{
			this.obAdminPanel = BX('bx-panel');
			if (BX.type.isElementNode(this.obAdminPanel))
			{
				this.setVerticalAlign();
				BX.addCustomEvent(window, 'onTopPanelCollapse', BX.proxy(this.setVerticalAlign, this));
			}
		}
	}
};

window.JCCatalogCompareList.prototype.reload = function()
{
	BX.showWait(this.obCompare);
	BX.ajax.post(
		this.ajax.url,
		this.ajax.reload,
		BX.proxy(this.reloadResult, this)
	);
};

window.JCCatalogCompareList.prototype.reloadResult = function(result)
{
	var mode = 'none';
	BX.closeWait();
	this.obCompare.innerHTML = result;
	if (BX.type.isNotEmptyString(result))
	{
		if (result.indexOf('<table') >= 0)
			mode = 'block';
	}
	BX.style(this.obCompare, 'display', mode);
};

window.JCCatalogCompareList.prototype.onKeyDown = function(event)
{
	if (event.key !== 'Escape')
	{
		return;
	}

	this.close();
};

window.JCCatalogCompareList.prototype.close = function()
{
	// Taken while the panel is still on the screen: a hidden panel holds no stops of the walk.
	var target = this.getStopAfterPanel();

	BX.style(this.obCompare, 'display', 'none');
	if (BX.type.isElementNode(target))
	{
		target.focus();
	}
};

// The panel itself is no stop of the walk, so the count starts at the last stop it holds.
window.JCCatalogCompareList.prototype.getStopAfterPanel = function()
{
	var accessibility = getAccessibility(),
		last;

	if (!accessibility)
	{
		return null;
	}

	last = accessibility.FocusNavigator.getLast(this.obCompare);

	return (!!last ? accessibility.FocusNavigator.getNext(document.body, {from: last}) : null);
};

window.JCCatalogCompareList.prototype.getDeleteLinks = function()
{
	return Array.prototype.slice.call(
		this.obCompare.querySelectorAll('tr[data-block="item-row"] a[data-id]')
	);
};

// Read when the press comes and not when the server answers: the visitor may take the mouse meanwhile.
window.JCCatalogCompareList.prototype.isKeyboardInput = function()
{
	var accessibility = getAccessibility();

	return (!!accessibility && !!accessibility.FocusMonitor
		&& accessibility.FocusMonitor.Instance.getLastInputModality() === 'keyboard');
};

// To the action of the product below the removed one, to the one above it when the last product
// went away, and past the panel when nothing is left. Called while the panel is still on the screen.
// Past the panel only for the keyboard: the stop there may be far off the screen, and the page would
// scroll to it under the mouse.
window.JCCatalogCompareList.prototype.moveFocusAfterDelete = function(deletedIndex)
{
	var links = this.getDeleteLinks(),
		target;

	if (links.length === 0)
	{
		if (!this.removedByKeyboard)
		{
			return;
		}

		target = this.getStopAfterPanel();
		if (BX.type.isElementNode(target))
		{
			target.focus();
		}

		return;
	}

	target = (deletedIndex >= 0 && deletedIndex < links.length ? links[deletedIndex] : links[links.length - 1]);
	target.focus();
};

window.JCCatalogCompareList.prototype.announceCount = function(count)
{
	var accessibility = getAccessibility();

	if (!accessibility || !BX.type.isNotEmptyString(this.messages.ANNOUNCE_COUNT))
	{
		return;
	}

	accessibility.LiveAnnouncer.announce(this.messages.ANNOUNCE_COUNT.replace('#COUNT#', count.toString()));
};

window.JCCatalogCompareList.prototype.deleteCompare = function()
{
	var target = BX.proxy_context,
		itemID,
		url;

	if (!!target && target.hasAttribute('data-id'))
	{
		itemID = parseInt(target.getAttribute('data-id'), 10);
		if (!isNaN(itemID))
		{
			this.removedByKeyboard = this.isKeyboardInput();
			BX.showWait(this.obCompare);
			url = this.ajax.url + this.ajax.templates.delete + itemID.toString();
			BX.ajax.loadJSON(
				url,
				this.ajax.params,
				BX.proxy(this.deleteCompareResult, this)
			);
		}
	}
};

window.JCCatalogCompareList.prototype.deleteCompareResult = function(result)
{
	var tbl,
		i,
		cnt,
		newCount,
		links,
		deletedIndex = -1;

	BX.closeWait();
	if (BX.type.isPlainObject(result))
	{
		if (BX.type.isNotEmptyString(result.STATUS) && result.STATUS === 'OK' && !!result.ID)
		{
			BX.onCustomEvent('onCatalogDeleteCompare', [result.ID]);

			tbl = this.obCompare.querySelector('table[data-block="item-list"]');
			if (BX.type.isElementNode(tbl))
			{
				if (tbl.rows.length > 1)
				{
					links = this.getDeleteLinks();
					for (i = 0; i < links.length; i++)
					{
						if (links[i].getAttribute('data-id') === result.ID.toString())
						{
							deletedIndex = i;
						}
					}
					links = null;
					for (i = 0; i < tbl.rows.length; i++)
					{
						if (
							tbl.rows[i].hasAttribute('data-row-id')
							&& tbl.rows[i].getAttribute('data-row-id') === ('row' + result.ID)
						)
						{
							tbl.deleteRow(i);
						}
					}
					this.moveFocusAfterDelete(deletedIndex);
					if (BX.type.isNotEmptyString(result.COUNT) || BX.type.isNumber(result.COUNT))
					{
						newCount = parseInt(result.COUNT, 10);
						if (!isNaN(newCount))
						{
							cnt = this.obCompare.querySelector('span[data-block="count"]');
							if (BX.type.isElementNode(cnt))
							{
								cnt.innerHTML = newCount.toString();
							}
							cnt = null;
							BX.style(this.obCompare, 'display', (newCount > 0 ? 'block' : 'none'));
							this.announceCount(newCount);
						}
					}
				}
				else
				{
					this.reload();
				}
			}
			tbl = null;
		}
	}
};

window.JCCatalogCompareList.prototype.setVerticalAlign = function()
{
	var topSize;
	if (BX.type.isElementNode(this.obCompare) && BX.type.isElementNode(this.obAdminPanel))
	{
		topSize = parseInt(this.obAdminPanel.offsetHeight, 10);
		if (isNaN(topSize))
		{
			topSize = 0;
		}
		topSize +=5;
		BX.style(this.obCompare, 'top', topSize.toString()+'px');
	}
};

})(window);