BX.namespace("BX.Iblock.Catalog");

BX.Iblock.Catalog.CompareClass = (function()
{
	// The actions of the columns, in their order: the last row of the table, past the corner cell.
	var DELETE_ACTIONS = '.table_compare table.data-table > tbody > tr:last-child > td > a';
	var COMPARE_TABLE = '.table_compare table.data-table';

	// Declared by the epilog; a page that answered without them loses the focus transfer and the
	// announcement alone.
	function getAccessibility()
	{
		return (!!BX.UI && !!BX.UI.Accessibility ? BX.UI.Accessibility : null);
	}

	var CompareClass = function(wrapObjId, reloadUrl, messages)
	{
		this.wrapObjId = wrapObjId;
		this.reloadUrl = reloadUrl;
		this.messages = messages || {};
		// Kept until the answer of the server rebuilds the markup: it says where the focus goes
		// afterwards and whether the page speaks about the change at all.
		this.touchedId = null;
		this.touchedColumn = -1;
		BX.addCustomEvent(window, 'onCatalogDeleteCompare', BX.proxy(this.reload, this));
		BX.ready(BX.proxy(this.followWindowWidth, this));
		BX.ready(BX.proxy(this.adjustScrollRegion, this));
	};

	// A narrower window or a zoom makes the table outgrow its area as surely as a removed column
	// makes it fit again, and neither the answer of the server nor BX.ready hears about that. The
	// window keeps one listener for the page: a block drawn anew takes it over instead of adding one.
	CompareClass.prototype.followWindowWidth = function()
	{
		CompareClass.regionKeeper = this;

		if (CompareClass.regionFrame !== undefined)
		{
			return;
		}

		CompareClass.regionFrame = 0;
		window.addEventListener('resize', function() {
			if (CompareClass.regionFrame)
			{
				return;
			}

			CompareClass.regionFrame = requestAnimationFrame(function() {
				CompareClass.regionFrame = 0;

				var keeper = CompareClass.regionKeeper;

				if (keeper && keeper.regionWidth !== document.documentElement.clientWidth)
				{
					keeper.adjustScrollRegion();
				}
			});
		});
	};

	// A stop of the keyboard walk only while the area really scrolls: on a window wide enough for
	// the whole table a stop there would lead nowhere.
	CompareClass.prototype.adjustScrollRegion = function()
	{
		var block = BX(this.wrapObjId);
		var region = block ? block.querySelector('.table_compare') : null;

		// Remembered even when the answer carried no area: the width is what tells a resize worth
		// measuring again from one that moved nothing sideways.
		this.regionWidth = document.documentElement.clientWidth;

		if (!region)
		{
			return;
		}

		if (region.scrollWidth > region.clientWidth)
		{
			region.setAttribute('tabindex', '0');
		}
		else
		{
			region.removeAttribute('tabindex');
		}
	};

	CompareClass.prototype.getDeleteActions = function()
	{
		var block = BX(this.wrapObjId);

		return (BX.type.isElementNode(block)
			? Array.prototype.slice.call(block.querySelectorAll(DELETE_ACTIONS))
			: []
		);
	};

	// The action of one column, counted from the corner cell, which holds none of its own.
	CompareClass.prototype.getDeleteActionSelector = function(column)
	{
		return '.table_compare table.data-table > tbody > tr:last-child > td:nth-child('
			+ (column + 2).toString()
			+ ') > a';
	};

	// Asked for while the old markup is still on the page: the answer of the server is markup and
	// says nothing about what was touched. Nothing under the focus means the reload came from
	// outside, and this page has nothing to say about it.
	CompareClass.prototype.getTouchedId = function()
	{
		var block = BX(this.wrapObjId);
		var active = document.activeElement;

		return (
			BX.type.isElementNode(block)
			&& BX.type.isElementNode(active)
			&& block.contains(active)
			&& BX.type.isNotEmptyString(active.id)
				? active.id
				: null
		);
	};

	CompareClass.prototype.getTouchedColumn = function()
	{
		return this.getDeleteActions().indexOf(document.activeElement);
	};

	// The selector is asked of the new markup, where the column or the field may be gone altogether;
	// the block is what stays there in every answer, the empty list included.
	CompareClass.prototype.moveFocus = function(selector)
	{
		var accessibility = getAccessibility();
		var block = BX(this.wrapObjId);

		if (!accessibility || !BX.type.isElementNode(block))
		{
			return;
		}

		if (selector === null || accessibility.FocusNavigator.focusBySelector(block, selector) === null)
		{
			accessibility.FocusNavigator.focusContainer(block);
		}
	};

	CompareClass.prototype.announce = function(phrase, count)
	{
		var accessibility = getAccessibility();

		if (!accessibility || !BX.type.isNotEmptyString(phrase))
		{
			return;
		}

		accessibility.LiveAnnouncer.announce(phrase.replace('#COUNT#', count.toString()));
	};

	// Counted off the rebuilt markup: the answer of the server is HTML and carries no number.
	CompareClass.prototype.countProducts = function()
	{
		var block = BX(this.wrapObjId);

		return (BX.type.isElementNode(block)
			? block.querySelectorAll(COMPARE_TABLE + ' th[scope="col"]').length
			: 0
		);
	};

	CompareClass.prototype.countRows = function()
	{
		var block = BX(this.wrapObjId);
		var table = (BX.type.isElementNode(block) ? block.querySelector(COMPARE_TABLE) : null);

		return (!!table ? table.rows.length : 0);
	};

	CompareClass.prototype.MakeAjaxAction = function(url)
	{
		this.touchedId = this.getTouchedId();
		BX.showWait(BX(this.wrapObjId));
		BX.ajax.post(
			url,
			{
				ajax_action: 'Y'
			},
			BX.proxy(this.reloadResult, this)
		);
	};

	CompareClass.prototype.reload = function()
	{
		// The panel of the compare list asks for this reload and speaks about the removal itself.
		this.touchedId = null;
		BX.showWait(BX(this.wrapObjId));
		BX.ajax.post(
			this.reloadUrl,
			{
				compare_result_reload: 'Y'
			},
			BX.proxy(this.reloadResult, this)
		);
	};

	CompareClass.prototype.reloadResult = function(result)
	{
		var touchedId = this.touchedId;

		BX.closeWait();
		this.touchedId = null;
		BX(this.wrapObjId).innerHTML = result;
		this.adjustScrollRegion();

		if (touchedId === null)
		{
			return;
		}

		// The field of the set of parameters comes back under the same id it was touched by.
		this.moveFocus('#' + touchedId);
		this.announce(this.messages.ANNOUNCE_PARAMS, this.countRows());
	};

	CompareClass.prototype.delete = function(url)
	{
		this.touchedColumn = this.getTouchedColumn();
		BX.showWait(BX(this.wrapObjId));
		BX.ajax.post(
			url,
			{
				ajax_action: 'Y'
			},
			BX.proxy(this.deleteResult, this)
		);
	};

	CompareClass.prototype.deleteResult = function(result)
	{
		var column = this.touchedColumn;

		BX.closeWait();
		this.touchedColumn = -1;
		BX.onCustomEvent('OnCompareChange');
		BX(this.wrapObjId).innerHTML = result;
		this.adjustScrollRegion();

		this.moveFocusAfterDelete(column);
		this.announce(this.messages.ANNOUNCE_REMOVED, this.countProducts());
	};

	// To the action of the column that moved into the freed place, to the one on the left when the
	// last column went away, and to the block itself when no product is left.
	CompareClass.prototype.moveFocusAfterDelete = function(column)
	{
		var left = this.getDeleteActions().length;

		this.moveFocus(column >= 0 && left > 0
			? this.getDeleteActionSelector(Math.min(column, left - 1))
			: null
		);
	};

	return CompareClass;
})();
