function JCSmartFilter(ajaxURL, viewMode, params)
{
	this.ajaxURL = ajaxURL;
	this.form = null;
	this.timer = null;
	this.cacheKey = '';
	this.cache = [];
	this.popups = [];
	this.dropDownPending = null;
	this.dropDownList = null;
	this.dropDownFocusLeaving = false;
	this.swatchZones = [];
	this.viewMode = viewMode;
	this.messages = (params && params.MESSAGES) || {};
	this.announced = '';
	this.availabilityChanged = false;
	if (params && params.SEF_SET_FILTER_URL)
	{
		this.bindUrlToButton('set_filter', params.SEF_SET_FILTER_URL);
		this.sef = true;
	}
	if (params && params.SEF_DEL_FILTER_URL)
	{
		this.bindUrlToButton('del_filter', params.SEF_DEL_FILTER_URL);
	}
	BX.ready(BX.delegate(this.bindFormHandlers, this));
}

// Both handlers sit on the form and not on the fields: the template binds its own handlers to the
// fields, and only a listener above them runs first. The form also keeps every value under it while
// the rows of an open list hang in a popup. The first runs before the field, to hold back a press on
// a value that is switched off; the second closes a list the focus has walked out of.
JCSmartFilter.prototype.bindFormHandlers = function()
{
	var form = document.querySelector('form.smart-filter-form');
	if (form)
	{
		form.addEventListener('click', BX.delegate(this.holdBackSwitchedOffValue, this), true);
		form.addEventListener('focusout', BX.delegate(this.closeDropDownOnFocusLeave, this), false);
		form.addEventListener('submit', BX.delegate(this.leaveSwitchedOffValuesOut, this), false);
		this.createSwatchZones(form);

		if (this.viewMode === 'VERTICAL')
		{
			this.followWindowWidth();
		}
	}
};

// A narrower window or a zoom takes the room beside the filter away as surely as a recount does. The
// window keeps one listener for the page: a filter drawn anew takes it over instead of adding one.
JCSmartFilter.prototype.followWindowWidth = function()
{
	JCSmartFilter.counterKeeper = this;

	if (JCSmartFilter.counterFrame !== undefined)
	{
		return;
	}

	JCSmartFilter.counterFrame = 0;
	window.addEventListener('resize', function() {
		if (JCSmartFilter.counterFrame)
		{
			return;
		}

		JCSmartFilter.counterFrame = requestAnimationFrame(function() {
			JCSmartFilter.counterFrame = 0;

			var modef = BX('modef');
			var keeper = JCSmartFilter.counterKeeper;

			if (modef && modef.getClientRects().length > 0 && keeper.counterWidth !== document.documentElement.clientWidth)
			{
				keeper.keepCounterOnScreen(modef);
			}
		});
	});
};

// A row of colour squares is one stop of the keyboard walk, and the arrows move along it, the way the
// variants of a product card do. Space still ticks the value under the focus: it is a checkbox.
JCSmartFilter.prototype.createSwatchZones = function(form)
{
	var accessibility = (!!BX.UI && !!BX.UI.Accessibility ? BX.UI.Accessibility : null);
	if (!accessibility || !accessibility.FocusZone)
	{
		return;
	}

	var keys = accessibility.FocusKeys;
	var rows = form.querySelectorAll('.smart-filter-input-group-checkbox-pictures');

	for (var i = 0; i < rows.length; i++)
	{
		var zone = new accessibility.FocusZone(rows[i], {
			bindKeys: keys.ArrowHorizontal | keys.ArrowVertical | keys.HomeAndEnd,
			focusOutBehavior: 'wrap'
		});
		zone.activate();
		this.swatchZones.push({row: rows[i], zone: zone});
	}
};

// The zone takes only the fields it can see, and a folded group shows none of them.
JCSmartFilter.prototype.refreshSwatchZones = function(box)
{
	var zones = this.swatchZones;

	for (var i = 0; i < zones.length; i++)
	{
		if (box.contains(zones[i].row))
		{
			zones[i].zone.refreshElements();
		}
	}
};

// aria-disabled forbids nothing by itself, so a press on a switched-off value is cancelled by hand.
JCSmartFilter.prototype.holdBackSwitchedOffValue = function(event)
{
	var target = event.target;

	if (!target || target.tagName !== 'INPUT' || (target.type !== 'checkbox' && target.type !== 'radio'))
	{
		return;
	}

	if (target.getAttribute('aria-disabled') === 'true')
	{
		event.preventDefault();
		event.stopPropagation();
	}
};

// The browser sends an aria-disabled field with the form, and the recount has left it out, so the
// field is switched off natively for the moment the form is read and given back right after.
JCSmartFilter.prototype.leaveSwitchedOffValuesOut = function(event)
{
	var fields = event.currentTarget.querySelectorAll('[aria-disabled="true"]:not(:disabled)');

	if (fields.length === 0)
	{
		return;
	}

	for (var i = 0; i < fields.length; i++)
	{
		fields[i].disabled = true;
	}

	setTimeout(function() {
		for (var j = 0; j < fields.length; j++)
		{
			fields[j].disabled = false;
		}
	}, 0);
};

JCSmartFilter.prototype.keyup = function(input)
{
	if(!!this.timer)
	{
		clearTimeout(this.timer);
	}
	this.timer = setTimeout(BX.delegate(function(){
		this.reload(input);
	}, this), 500);
};

// A value is picked with Space, so Enter on it only sent the form and folded away every group the
// visitor had opened. Buttons keep their own Enter, so only fields are held back.
JCSmartFilter.prototype.keydown = function(event)
{
	var target = event.target;

	if (event.key !== 'Enter' || !target || target.tagName !== 'INPUT')
	{
		return;
	}

	if (target.type === 'checkbox' || target.type === 'radio')
	{
		event.preventDefault();

		// Enter on a value of an open list is what tells the filter the walk is over: the arrows
		// only carry the choice about, and the list waits for a deliberate act to close.
		var block = BX.findParent(target, {className: 'smart-filter-dropdown-block'}, false);
		if (block && BX.hasClass(block, 'smart-filter-dropdown-open'))
		{
			this.closeDropDownPopup();
		}
	}
};

JCSmartFilter.prototype.click = function(checkbox)
{
	if(!!this.timer)
	{
		clearTimeout(this.timer);
	}

	this.timer = setTimeout(BX.delegate(function(){
		this.reload(checkbox);
	}, this), 500);
};

// Bound to the field and not to its label: a click on a label is forwarded to the field and comes
// back through the label, so a handler sitting there ran twice for one click.
JCSmartFilter.prototype.toggleValue = function(input)
{
	var label = input.labels && input.labels.length > 0 ? input.labels[0] : null;

	// The tick the browser has already put on is taken back: aria-disabled holds no click back the
	// way the native attribute did.
	if (input.getAttribute('aria-disabled') === 'true')
	{
		input.checked = !input.checked;
		return;
	}

	if (label)
	{
		if (input.checked)
			BX.addClass(label, "bx-active");
		else
			BX.removeClass(label, "bx-active");
	}

	this.click(input);
};

JCSmartFilter.prototype.reload = function(input)
{
	if (this.cacheKey !== '')
	{
		//Postprone backend query
		if(!!this.timer)
		{
			clearTimeout(this.timer);
		}
		this.timer = setTimeout(BX.delegate(function(){
			this.reload(input);
		}, this), 1000);
		return;
	}
	this.cacheKey = '|';

	this.position = BX.pos(input, true);
	this.form = BX.findParent(input, {'tag':'form'});
	if (this.form)
	{
		var values = [];
		values[0] = {name: 'ajax', value: 'y'};
		this.gatherInputsValues(values, BX.findChildren(this.form, {'tag': new RegExp('^(input|select)$', 'i')}, true));

		for (var i = 0; i < values.length; i++)
			this.cacheKey += values[i].name + ':' + values[i].value + '|';

		if (this.cache[this.cacheKey])
		{
			this.postHandler(this.cache[this.cacheKey], true);
		}
		else
		{
			if (this.sef)
			{
				var set_filter = BX('set_filter');
				set_filter.disabled = true;
			}

			BX.ajax.loadJSON(
				this.ajaxURL,
				this.values2post(values),
				BX.delegate(this.postHandler, this)
			);
		}
	}
};

JCSmartFilter.prototype.updateItem = function (PID, arItem)
{
	if (arItem.PROPERTY_TYPE === 'N' || arItem.PRICE)
	{
		var trackBar = window['trackBar' + PID];
		if (!trackBar && arItem.ENCODED_ID)
			trackBar = window['trackBar' + arItem.ENCODED_ID];

		if (trackBar && arItem.VALUES)
		{
			if (arItem.VALUES.MIN)
			{
				if (arItem.VALUES.MIN.FILTERED_VALUE)
					trackBar.setMinFilteredValue(arItem.VALUES.MIN.FILTERED_VALUE);
				else
					trackBar.setMinFilteredValue(arItem.VALUES.MIN.VALUE);
			}

			if (arItem.VALUES.MAX)
			{
				if (arItem.VALUES.MAX.FILTERED_VALUE)
					trackBar.setMaxFilteredValue(arItem.VALUES.MAX.FILTERED_VALUE);
				else
					trackBar.setMaxFilteredValue(arItem.VALUES.MAX.VALUE);
			}
		}
	}
	else if (arItem.VALUES)
	{
		for (var i in arItem.VALUES)
		{
			if (arItem.VALUES.hasOwnProperty(i))
			{
				var value = arItem.VALUES[i];
				var control = BX(value.CONTROL_ID);

				if (!!control)
				{
					var label = document.querySelector('[data-role="label_'+value.CONTROL_ID+'"]');
					var wasOff = control.disabled || control.getAttribute('aria-disabled') === 'true';
					var isOff = !!value.DISABLED;

					if (wasOff !== isOff)
						this.availabilityChanged = true;

					// The state is written as ARIA and not as the native attribute: a natively
					// switched-off field drops out of the keyboard walk and throws the focus
					// standing on it onto the body.
					control.disabled = false;
					if (isOff)
					{
							control.setAttribute('aria-disabled', 'true');
							if (label)
								BX.addClass(label, 'disabled');
							else
								BX.addClass(control.parentNode, 'disabled');
					}
					else
					{
							control.removeAttribute('aria-disabled');
							if (label)
								BX.removeClass(label, 'disabled');
							else
								BX.removeClass(control.parentNode, 'disabled');
					}

					if (value.hasOwnProperty('ELEMENT_COUNT'))
					{
						label = document.querySelector('[data-role="count_'+value.CONTROL_ID+'"]');
						if (label)
							label.innerHTML = value.ELEMENT_COUNT;
					}
				}
			}
		}
	}
};

JCSmartFilter.prototype.postHandler = function (result, fromCache)
{
	var hrefFILTER, url;
	var modef = BX('modef');
	var modef_num = BX('modef_num');

	if (!!result && !!result.ITEMS)
	{
		for(var popupId in this.popups)
		{
			if (this.popups.hasOwnProperty(popupId))
			{
				this.popups[popupId].destroy();
			}
		}
		this.popups = [];

		this.availabilityChanged = false;
		for(var PID in result.ITEMS)
		{
			if (result.ITEMS.hasOwnProperty(PID))
			{
				this.updateItem(PID, result.ITEMS[PID]);
			}
		}

		if (!!modef && !!modef_num)
		{
			modef_num.innerHTML = result.ELEMENT_COUNT;
			hrefFILTER = BX.findChildren(modef, {tag: 'A'}, true);

			if (result.FILTER_URL && hrefFILTER)
			{
				hrefFILTER[0].href = BX.util.htmlspecialcharsback(result.FILTER_URL);
			}

			if (result.FILTER_AJAX_URL && result.COMPONENT_CONTAINER_ID)
			{
				BX.unbindAll(hrefFILTER[0]);
				BX.bind(hrefFILTER[0], 'click', function(e)
				{
					url = BX.util.htmlspecialcharsback(result.FILTER_AJAX_URL);
					BX.ajax.insertToNode(url, result.COMPONENT_CONTAINER_ID);
					return BX.PreventDefault(e);
				});
			}

			if (result.INSTANT_RELOAD && result.COMPONENT_CONTAINER_ID)
			{
				url = BX.util.htmlspecialcharsback(result.FILTER_AJAX_URL);
				BX.ajax.insertToNode(url, result.COMPONENT_CONTAINER_ID);
			}
			else
			{
				if (modef.style.display === 'none')
				{
					modef.style.display = 'inline-block';
				}

				if (this.viewMode === 'VERTICAL')
				{
					this.keepCounterOnScreen(modef);
				}

				if (result.SEF_SET_FILTER_URL)
				{
					this.bindUrlToButton('set_filter', result.SEF_SET_FILTER_URL);
				}
			}
		}
	}

	if (this.sef)
	{
		// Unlocked and nothing more: focusing it here moved the visitor out of the values on every
		// recount.
		BX('set_filter').disabled = false;
	}

	if (!!result && !!result.ITEMS)
	{
		this.announceRecount(result.ELEMENT_COUNT);
	}

	if (!fromCache && this.cacheKey !== '')
	{
		this.cache[this.cacheKey] = result;
	}
	this.cacheKey = '';
};

/**
 * Keeps the counter of the found inside the window.
 *
 * The counter hangs off the side of the buttons the template names. When that side runs out of the
 * window, it hangs off the other one; when neither has room, as in a narrow window the filter spans
 * from edge to edge, it stands in the flow beside the buttons. The node itself never moves, so its
 * link keeps its place in the keyboard walk.
 */
JCSmartFilter.prototype.keepCounterOnScreen = function(modef)
{
	if (this.counterSide === undefined)
	{
		this.counterSide = BX.Dom.hasClass(modef, 'right') ? 'right' : (BX.Dom.hasClass(modef, 'left') ? 'left' : '');
	}

	if (this.counterSide === '')
	{
		return;
	}

	var sides = [this.counterSide, this.counterSide === 'left' ? 'right' : 'left'];
	var windowWidth = document.documentElement.clientWidth;
	var box;

	this.counterWidth = windowWidth;
	BX.Dom.removeClass(modef, 'left right in-flow');

	for (var i = 0; i < sides.length; i++)
	{
		BX.Dom.addClass(modef, sides[i]);
		box = modef.getBoundingClientRect();

		if (box.left >= 0 && box.right <= windowWidth)
		{
			return;
		}

		BX.Dom.removeClass(modef, sides[i]);
	}

	BX.Dom.addClass(modef, 'in-flow');
};

// The same text is never said twice in a row: a reader that hears the same words again cannot tell
// a recount that changed nothing from one that never happened.
JCSmartFilter.prototype.announceRecount = function(count)
{
	// Declared by the epilog; a page that answered without them loses the announcement alone.
	var accessibility = (!!BX.UI && !!BX.UI.Accessibility ? BX.UI.Accessibility : null);

	if (!accessibility || !BX.type.isNotEmptyString(this.messages.ANNOUNCE) || count === undefined || count === null)
	{
		return;
	}

	var text = this.messages.ANNOUNCE.replace('#ELEMENT_COUNT#', count);

	if (this.availabilityChanged && BX.type.isNotEmptyString(this.messages.ANNOUNCE_AVAILABILITY))
	{
		text += ', ' + this.messages.ANNOUNCE_AVAILABILITY;
	}

	if (text === this.announced)
	{
		return;
	}

	this.announced = text;
	accessibility.LiveAnnouncer.announce(text);
};

JCSmartFilter.prototype.bindUrlToButton = function (buttonId, url)
{
	var button = BX(buttonId);
	if (button)
	{
		var proxy = function(j, func)
		{
			return function()
			{
				return func(j);
			}
		};

		if (button.type == 'submit')
			button.type = 'button';

		BX.bind(button, 'click', proxy(url, function(url)
		{
			window.location.href = url;
			return false;
		}));
	}
};

JCSmartFilter.prototype.gatherInputsValues = function (values, elements)
{
	if(elements)
	{
		for(var i = 0; i < elements.length; i++)
		{
			var el = elements[i];
			// The browser keeps an aria-disabled field in the form, so it is left out by hand.
			if (el.disabled || el.getAttribute('aria-disabled') === 'true' || !el.type)
				continue;

			switch(el.type.toLowerCase())
			{
				case 'text':
				case 'textarea':
				case 'password':
				case 'hidden':
				case 'number':
				case 'phone':
				case 'email':
				case 'select-one':
					if(el.value.length)
						values[values.length] = {name : el.name, value : el.value};
					break;
				case 'radio':
				case 'checkbox':
					if(el.checked)
						values[values.length] = {name : el.name, value : el.value};
					break;
				case 'select-multiple':
					for (var j = 0; j < el.options.length; j++)
					{
						if (el.options[j].selected)
							values[values.length] = {name : el.name, value : el.options[j].value};
					}
					break;
				default:
					break;
			}
		}
	}
};

JCSmartFilter.prototype.values2post = function (values)
{
	var post = [];
	var current = post;
	var i = 0;

	while(i < values.length)
	{
		var p = values[i].name.indexOf('[');
		if(p == -1)
		{
			current[values[i].name] = values[i].value;
			current = post;
			i++;
		}
		else
		{
			var name = values[i].name.substring(0, p);
			var rest = values[i].name.substring(p+1);
			if(!current[name])
				current[name] = [];

			var pp = rest.indexOf(']');
			if(pp == -1)
			{
				//Error - not balanced brackets
				current = post;
				i++;
			}
			else if(pp == 0)
			{
				//No index specified - so take the next integer
				current = current[name];
				values[i].name = '' + current.length;
			}
			else
			{
				//Now index name becomes and name and we go deeper into the array
				current = current[name];
				values[i].name = rest.substring(0, pp) + rest.substring(pp+1);
			}
		}
	}
	return post;
};

JCSmartFilter.prototype.hideFilterProps = function(element)
{
	var obj = element.parentNode,
		filterBlock = obj.querySelector("[data-role='bx_filter_block']"),
		propAngle = obj.querySelector("[data-role='prop_angle']"),
		// Not by the class of the box: it is rewritten only when the fold ends and answers the
		// previous state until then.
		expanded = element.getAttribute("aria-expanded") === "true";

	if(expanded)
	{
		element.setAttribute("aria-expanded", "false");
		filterBlock.style.overflow = "hidden";
		new BX.easing({
			duration : 300,
			start : { opacity: 100,  height: filterBlock.offsetHeight },
			finish : { opacity: 0, height:0 },
			transition : BX.easing.transitions.quart,
			step : function(state){
				filterBlock.style.opacity = state.opacity / 100;
				filterBlock.style.height = state.height + "px";
			},
			complete : function() {
				filterBlock.setAttribute("style", "");
				BX.removeClass(obj, "bx-active");
				BX.addClass(propAngle, "smart-filter-angle-down");
				BX.removeClass(propAngle, "smart-filter-angle-up");
			}
		}).animate();

	}
	else
	{
		element.setAttribute("aria-expanded", "true");
		filterBlock.style.display = "block";
		filterBlock.style.opacity = 0;
		filterBlock.style.height = "auto";
		filterBlock.style.overflow = "hidden";

		var obj_children_height = filterBlock.offsetHeight;
		filterBlock.style.height = 0;

		new BX.easing({
			duration : 300,
			start : { opacity: 0,  height: 0 },
			finish : { opacity: 100, height: obj_children_height },
			transition : BX.easing.transitions.quart,
			step : function(state){
				filterBlock.style.opacity = state.opacity / 100;
				filterBlock.style.height = state.height + "px";
			},
			complete : BX.delegate(function() {
				filterBlock.style.overflow = "";
				BX.addClass(obj, "bx-active");
				BX.removeClass(propAngle, "smart-filter-angle-down");
				BX.addClass(propAngle, "smart-filter-angle-up");
				this.refreshSwatchZones(obj);
			}, this)
		}).animate();

	}
};

// The list is moved into the popup and back, not copied: a copy left the page with two rows per
// value and the state written on the row nobody saw. The popup is made anew at every opening, or
// the manager would answer with the previous one and ignore the list handed over now.
JCSmartFilter.prototype.showDropDownPopup = function(button, popupId)
{
	var popupKey = "smartFilterDropDown" + popupId;
	var filter = this;

	// Taken down before the list is looked for: Escape closes the popup ten milliseconds later, so a
	// list opened again right away would still be hanging in the previous popup.
	if (this.popups[popupKey])
	{
		var opened = this.popups[popupKey].isShown();
		this.popups[popupKey].destroy();

		// A second press on the button closes the list it opened.
		if (opened)
		{
			return;
		}
	}

	var group = BX.findParent(button, {className: "smart-filter-input-group-dropdown"}, false);
	var content = group.querySelector('[data-role="dropdownContent"]');
	var home = content.parentNode;

	this.popups[popupKey] = BX.PopupWindowManager.create(popupKey, button, {
		autoHide: true,
		// An arrow that moves the choice about a group of radio buttons fires a click of the field,
		// and the fields of the list stay in the form while its rows hang in the popup. Such a press
		// moves the choice and is no answer to the list, so the list says so itself instead of
		// trusting the order the popup happens to listen to the document in.
		autoHideHandler: function(event) {
			var target = event.target;

			if (target && target.tagName === 'INPUT' && target.type === 'radio' && group.contains(target))
			{
				return false;
			}

			var container = filter.popups[popupKey].getPopupContainer();

			return target !== container && !container.contains(target);
		},
		offsetLeft: 0,
		offsetTop: 3,
		overlay : false,
		draggable: {restrict:true},
		closeByEsc: true,
		cacheable: false,
		focusTrap: false,
		ariaLabelledBy: 'smart_filter_prop_' + popupId,
		content: content,
		events: {
			onPopupClose: function() { filter.hideDropDownPopup(button, content, home); },
			onPopupDestroy: function() { filter.hideDropDownPopup(button, content, home); }
		}
	});

	content.style.display = "";
	button.setAttribute("aria-expanded", "true");

	// The fields are given back to the document only now: their rows are on the screen at last, so
	// each of them has a name to be heard by, and the focus has somewhere to go.
	var block = BX.findParent(button, {className: "smart-filter-dropdown-block"}, false);
	if (block)
	{
		BX.addClass(block, "smart-filter-dropdown-open");
	}

	this.dropDownList = content;
	this.popups[popupKey].show();

	var current = this.dropDownCurrentField(group);
	if (current)
	{
		current.focus();
	}
};

/** Returns the list home, gives the focus back to the button and sends the recount put off while it was open. */
JCSmartFilter.prototype.hideDropDownPopup = function(button, content, home)
{
	if (content.parentNode !== home)
	{
		content.style.display = "none";
		home.appendChild(content);
	}

	button.setAttribute("aria-expanded", "false");

	// Only when the focus has nowhere else to be: the list also closes by a click elsewhere on the
	// page and by the keyboard walking out of it, and both of them own the place they took the focus
	// to. The keyboard says so with a flag, because the focus it is on its way to is not the active
	// element yet.
	var group = BX.findParent(button, {className: "smart-filter-input-group-dropdown"}, false);
	var active = document.activeElement;
	if (!this.dropDownFocusLeaving
		&& (!active || active === document.body || content.contains(active) || (group && group.contains(active))))
	{
		button.focus();
	}

	// After the focus and not before it: a field taken out of the document under the focus would
	// drop it on the body.
	var block = BX.findParent(button, {className: "smart-filter-dropdown-block"}, false);
	if (block)
	{
		BX.removeClass(block, "smart-filter-dropdown-open");
	}

	if (this.dropDownList === content)
	{
		this.dropDownList = null;
	}

	// The recount the arrows put off. It goes here and nowhere earlier: the answer of a recount
	// takes down every popup, so a request sent while the list was open would close it mid-walk.
	var pending = this.dropDownPending;
	if (pending && group && group.contains(pending))
	{
		this.dropDownPending = null;
		this.click(pending);
	}
};

JCSmartFilter.prototype.closeDropDownPopup = function()
{
	var popup = BX.PopupWindowManager.getCurrentPopup();
	if (popup)
	{
		popup.close();
	}
};

// Tab out of an open list closes it like Enter: the arrows have already made the choice, so the
// pending recount is sent and nothing is reverted. The focus stays where the visitor moved it.
JCSmartFilter.prototype.closeDropDownOnFocusLeave = function(event)
{
	var block = BX.findParent(event.target, {className: 'smart-filter-dropdown-block'}, false);

	if (!block || !BX.hasClass(block, 'smart-filter-dropdown-open'))
	{
		return;
	}

	// A focus that has landed outside the list, and no other. A press on a row leaves the field for
	// the frame the rows hang in, and a press past the list leaves it for nothing at all: both of
	// them close the list by their own path and neither is the keyboard walking away.
	var next = event.relatedTarget;
	if (!next || block.contains(next) || this.dropDownListHolds(next))
	{
		return;
	}

	this.dropDownFocusLeaving = true;
	this.closeDropDownPopup();
	this.dropDownFocusLeaving = false;
};

/** Whether the open list holds a node, rows and frame alike: the popup takes the focus of its own. */
JCSmartFilter.prototype.dropDownListHolds = function(node)
{
	var list = this.dropDownList;

	return !!list && (list.contains(node) || node.contains(list));
};

/** The field the list stands at: the one chosen now, or the first of them while none is. */
JCSmartFilter.prototype.dropDownCurrentField = function(group)
{
	var fields = group.querySelectorAll('input[type="radio"]');

	for (var i = 0; i < fields.length; i++)
	{
		if (fields[i].checked)
			return fields[i];
	}

	return fields.length > 0 ? fields[0] : null;
};

// Bound to the field, so the arrows of the keyboard and a click on a row take one and the same path.
//
// The arrows carry the choice about an open list and cost nothing: the list stays where it is and
// the recount waits for the list to close. A click on a row closes the list before the field
// answers, so the mouse never meets the wait and keeps the one recount it has always had.
JCSmartFilter.prototype.selectDropDownValue = function(input)
{
	var label = input.labels && input.labels.length > 0 ? input.labels[0] : null;
	var group = BX.findParent(input, {className: "smart-filter-input-group-dropdown"}, false);

	if (!label || !group)
		return;

	var currentOption = group.querySelector('[data-role="currentOption"]');
	if (currentOption)
	{
		currentOption.innerHTML = label.innerHTML;
	}

	// Through the row and not through the group: while the list is open it hangs in the popup.
	var list = label.closest('[data-role="dropdownContent"]');
	if (list)
	{
		var rows = list.querySelectorAll("label");
		for (var i = 0; i < rows.length; i++)
		{
			BX.removeClass(rows[i], "selected");
		}
		BX.addClass(label, "selected");
	}

	var block = BX.findParent(input, {className: "smart-filter-dropdown-block"}, false);
	if (block && BX.hasClass(block, "smart-filter-dropdown-open"))
	{
		this.dropDownPending = input;
		return;
	}

	this.click(input);
};

// The field is a clipped box of one pixel and shows no ring of its own, and its row lives in the
// popup while the list is open, too far for a rule on the neighbour of the field.
JCSmartFilter.prototype.markDropDownValue = function(input, focused)
{
	var label = input.labels && input.labels.length > 0 ? input.labels[0] : null;
	if (!label)
		return;

	if (focused)
		BX.addClass(label, "bx-focus");
	else
		BX.removeClass(label, "bx-focus");
};

BX.namespace("BX.Iblock.SmartFilter");
BX.Iblock.SmartFilter = (function()
{
	/** @param {{
			leftSlider: string,
			rightSlider: string,
			tracker: string,
			trackerWrap: string,
			minInputId: string,
			maxInputId: string,
			minPrice: float|int|string,
			maxPrice: float|int|string,
			curMinPrice: float|int|string,
			curMaxPrice: float|int|string,
			fltMinPrice: float|int|string|null,
			fltMaxPrice: float|int|string|null,
			precision: int|null,
			colorUnavailableActive: string,
			colorAvailableActive: string,
			colorAvailableInactive: string
		}} arParams
	 */
	var SmartFilter = function(arParams)
	{
		if (typeof arParams === 'object')
		{
			this.leftSlider = BX(arParams.leftSlider);
			this.rightSlider = BX(arParams.rightSlider);
			this.tracker = BX(arParams.tracker);
			this.trackerWrap = BX(arParams.trackerWrap);

			this.minInput = BX(arParams.minInputId);
			this.maxInput = BX(arParams.maxInputId);

			this.minPrice = parseFloat(arParams.minPrice);
			this.maxPrice = parseFloat(arParams.maxPrice);

			this.curMinPrice = parseFloat(arParams.curMinPrice);
			this.curMaxPrice = parseFloat(arParams.curMaxPrice);

			this.fltMinPrice = arParams.fltMinPrice ? parseFloat(arParams.fltMinPrice) : parseFloat(arParams.curMinPrice);
			this.fltMaxPrice = arParams.fltMaxPrice ? parseFloat(arParams.fltMaxPrice) : parseFloat(arParams.curMaxPrice);

			this.precision = arParams.precision || 0;

			this.priceDiff = this.maxPrice - this.minPrice;

			this.leftPercent = 0;
			this.rightPercent = 0;

			this.fltMinPercent = 0;
			this.fltMaxPercent = 0;

			this.colorUnavailableActive = BX(arParams.colorUnavailableActive);//gray
			this.colorAvailableActive = BX(arParams.colorAvailableActive);//blue
			this.colorAvailableInactive = BX(arParams.colorAvailableInactive);//light blue

			this.isTouch = false;

			this.init();

			if ('ontouchstart' in document.documentElement)
			{
				this.isTouch = true;

				BX.bind(this.leftSlider, "touchstart", BX.proxy(function(event){
					this.onMoveLeftSlider(event)
				}, this));

				BX.bind(this.rightSlider, "touchstart", BX.proxy(function(event){
					this.onMoveRightSlider(event)
				}, this));
			}
			else
			{
				BX.bind(this.leftSlider, "mousedown", BX.proxy(function(event){
					this.onMoveLeftSlider(event)
				}, this));

				BX.bind(this.rightSlider, "mousedown", BX.proxy(function(event){
					this.onMoveRightSlider(event)
				}, this));
			}

			BX.bind(this.minInput, "keyup", BX.proxy(function(event){
				this.onInputChange();
			}, this));

			BX.bind(this.maxInput, "keyup", BX.proxy(function(event){
				this.onInputChange();
			}, this));
		}
	};

	SmartFilter.prototype.init = function()
	{
		var priceDiff;

		if (this.curMinPrice > this.minPrice)
		{
			priceDiff = this.curMinPrice - this.minPrice;
			this.leftPercent = (priceDiff*100)/this.priceDiff;

			this.leftSlider.style.left = this.leftPercent + "%";
			this.colorUnavailableActive.style.left = this.leftPercent + "%";
		}

		this.setMinFilteredValue(this.fltMinPrice);

		if (this.curMaxPrice < this.maxPrice)
		{
			priceDiff = this.maxPrice - this.curMaxPrice;
			this.rightPercent = (priceDiff*100)/this.priceDiff;

			this.rightSlider.style.right = this.rightPercent + "%";
			this.colorUnavailableActive.style.right = this.rightPercent + "%";
		}

		this.setMaxFilteredValue(this.fltMaxPrice);
	};

	SmartFilter.prototype.setMinFilteredValue = function (fltMinPrice)
	{
		this.fltMinPrice = parseFloat(fltMinPrice);
		if (this.fltMinPrice >= this.minPrice)
		{
			var priceDiff = this.fltMinPrice - this.minPrice;
			this.fltMinPercent = (priceDiff*100)/this.priceDiff;

			if (this.leftPercent > this.fltMinPercent)
				this.colorAvailableActive.style.left = this.leftPercent + "%";
			else
				this.colorAvailableActive.style.left = this.fltMinPercent + "%";

			this.colorAvailableInactive.style.left = this.fltMinPercent + "%";
		}
		else
		{
			this.colorAvailableActive.style.left = "0%";
			this.colorAvailableInactive.style.left = "0%";
		}
	};

	SmartFilter.prototype.setMaxFilteredValue = function (fltMaxPrice)
	{
		this.fltMaxPrice = parseFloat(fltMaxPrice);
		if (this.fltMaxPrice <= this.maxPrice)
		{
			var priceDiff = this.maxPrice - this.fltMaxPrice;
			this.fltMaxPercent = (priceDiff*100)/this.priceDiff;

			if (this.rightPercent > this.fltMaxPercent)
				this.colorAvailableActive.style.right = this.rightPercent + "%";
			else
				this.colorAvailableActive.style.right = this.fltMaxPercent + "%";

			this.colorAvailableInactive.style.right = this.fltMaxPercent + "%";
		}
		else
		{
			this.colorAvailableActive.style.right = "0%";
			this.colorAvailableInactive.style.right = "0%";
		}
	};

	SmartFilter.prototype.getXCoord = function(elem)
	{
		var box = elem.getBoundingClientRect();
		var body = document.body;
		var docElem = document.documentElement;

		var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
		var clientLeft = docElem.clientLeft || body.clientLeft || 0;
		var left = box.left + scrollLeft - clientLeft;

		return Math.round(left);
	};

	SmartFilter.prototype.getPageX = function(e)
	{
		e = e || window.event;
		var pageX = null;

		if (this.isTouch && event.targetTouches[0] != null)
		{
			pageX = e.targetTouches[0].pageX;
		}
		else if (e.pageX != null)
		{
			pageX = e.pageX;
		}
		else if (e.clientX != null)
		{
			var html = document.documentElement;
			var body = document.body;

			pageX = e.clientX + (html.scrollLeft || body && body.scrollLeft || 0);
			pageX -= html.clientLeft || 0;
		}

		return pageX;
	};

	SmartFilter.prototype.recountMinPrice = function()
	{
		var newMinPrice = (this.priceDiff*this.leftPercent)/100;
		newMinPrice = (this.minPrice + newMinPrice).toFixed(this.precision);

		if (newMinPrice != this.minPrice)
			this.minInput.value = newMinPrice;
		else
			this.minInput.value = "";
		/** @global JCSmartFilter smartFilter */
		smartFilter.keyup(this.minInput);
	};

	SmartFilter.prototype.recountMaxPrice = function()
	{
		var newMaxPrice = (this.priceDiff*this.rightPercent)/100;
		newMaxPrice = (this.maxPrice - newMaxPrice).toFixed(this.precision);

		if (newMaxPrice != this.maxPrice)
			this.maxInput.value = newMaxPrice;
		else
			this.maxInput.value = "";
		/** @global JCSmartFilter smartFilter */
		smartFilter.keyup(this.maxInput);
	};

	SmartFilter.prototype.onInputChange = function ()
	{
		var priceDiff;
		if (this.minInput.value)
		{
			var leftInputValue = this.minInput.value;
			if (leftInputValue < this.minPrice)
				leftInputValue = this.minPrice;

			if (leftInputValue > this.maxPrice)
				leftInputValue = this.maxPrice;

			priceDiff = leftInputValue - this.minPrice;
			this.leftPercent = (priceDiff*100)/this.priceDiff;

			this.makeLeftSliderMove(false);
		}

		if (this.maxInput.value)
		{
			var rightInputValue = this.maxInput.value;
			if (rightInputValue < this.minPrice)
				rightInputValue = this.minPrice;

			if (rightInputValue > this.maxPrice)
				rightInputValue = this.maxPrice;

			priceDiff = this.maxPrice - rightInputValue;
			this.rightPercent = (priceDiff*100)/this.priceDiff;

			this.makeRightSliderMove(false);
		}
	};

	SmartFilter.prototype.makeLeftSliderMove = function(recountPrice)
	{
		recountPrice = (recountPrice !== false);

		this.leftSlider.style.left = this.leftPercent + "%";
		this.colorUnavailableActive.style.left = this.leftPercent + "%";

		var areBothSlidersMoving = false;
		if (this.leftPercent + this.rightPercent >= 100)
		{
			areBothSlidersMoving = true;
			this.rightPercent = 100 - this.leftPercent;
			this.rightSlider.style.right = this.rightPercent + "%";
			this.colorUnavailableActive.style.right = this.rightPercent + "%";
		}

		if (this.leftPercent >= this.fltMinPercent && this.leftPercent <= (100-this.fltMaxPercent))
		{
			this.colorAvailableActive.style.left = this.leftPercent + "%";
			if (areBothSlidersMoving)
			{
				this.colorAvailableActive.style.right = 100 - this.leftPercent + "%";
			}
		}
		else if(this.leftPercent <= this.fltMinPercent)
		{
			this.colorAvailableActive.style.left = this.fltMinPercent + "%";
			if (areBothSlidersMoving)
			{
				this.colorAvailableActive.style.right = 100 - this.fltMinPercent + "%";
			}
		}
		else if(this.leftPercent >= this.fltMaxPercent)
		{
			this.colorAvailableActive.style.left = 100-this.fltMaxPercent + "%";
			if (areBothSlidersMoving)
			{
				this.colorAvailableActive.style.right = this.fltMaxPercent + "%";
			}
		}

		if (recountPrice)
		{
			this.recountMinPrice();
			if (areBothSlidersMoving)
				this.recountMaxPrice();
		}
	};

	SmartFilter.prototype.countNewLeft = function(event)
	{
		var pageX = this.getPageX(event);

		var trackerXCoord = this.getXCoord(this.trackerWrap);
		var rightEdge = this.trackerWrap.offsetWidth;

		var newLeft = pageX - trackerXCoord;

		if (newLeft < 0)
			newLeft = 0;
		else if (newLeft > rightEdge)
			newLeft = rightEdge;

		return newLeft;
	};

	SmartFilter.prototype.onMoveLeftSlider = function(e)
	{
		if (!this.isTouch)
		{
			this.leftSlider.ondragstart = function() {
				return false;
			};
		}

		if (!this.isTouch)
		{
			document.onmousemove = BX.proxy(function(event) {
				this.leftPercent = ((this.countNewLeft(event)*100)/this.trackerWrap.offsetWidth);
				this.makeLeftSliderMove();
			}, this);

			document.onmouseup = function() {
				document.onmousemove = document.onmouseup = null;
			};
		}
		else
		{
			document.ontouchmove = BX.proxy(function(event) {
				this.leftPercent = ((this.countNewLeft(event)*100)/this.trackerWrap.offsetWidth);
				this.makeLeftSliderMove();
			}, this);

			document.ontouchend = function() {
				document.ontouchmove = document.touchend = null;
			};
		}

		return false;
	};

	SmartFilter.prototype.makeRightSliderMove = function(recountPrice)
	{
		recountPrice = (recountPrice !== false);

		this.rightSlider.style.right = this.rightPercent + "%";
		this.colorUnavailableActive.style.right = this.rightPercent + "%";

		var areBothSlidersMoving = false;
		if (this.leftPercent + this.rightPercent >= 100)
		{
			areBothSlidersMoving = true;
			this.leftPercent = 100 - this.rightPercent;
			this.leftSlider.style.left = this.leftPercent + "%";
			this.colorUnavailableActive.style.left = this.leftPercent + "%";
		}

		if ((100-this.rightPercent) >= this.fltMinPercent && this.rightPercent >= this.fltMaxPercent)
		{
			this.colorAvailableActive.style.right = this.rightPercent + "%";
			if (areBothSlidersMoving)
			{
				this.colorAvailableActive.style.left = 100 - this.rightPercent + "%";
			}
		}
		else if(this.rightPercent <= this.fltMaxPercent)
		{
			this.colorAvailableActive.style.right = this.fltMaxPercent + "%";
			if (areBothSlidersMoving)
			{
				this.colorAvailableActive.style.left = 100 - this.fltMaxPercent + "%";
			}
		}
		else if((100-this.rightPercent) <= this.fltMinPercent)
		{
			this.colorAvailableActive.style.right = 100-this.fltMinPercent + "%";
			if (areBothSlidersMoving)
			{
				this.colorAvailableActive.style.left = this.fltMinPercent + "%";
			}
		}

		if (recountPrice)
		{
			this.recountMaxPrice();
			if (areBothSlidersMoving)
				this.recountMinPrice();
		}
	};

	SmartFilter.prototype.onMoveRightSlider = function(e)
	{
		if (!this.isTouch)
		{
			this.rightSlider.ondragstart = function() {
				return false;
			};
		}

		if (!this.isTouch)
		{
			document.onmousemove = BX.proxy(function(event) {
				this.rightPercent = 100-(((this.countNewLeft(event))*100)/(this.trackerWrap.offsetWidth));
				this.makeRightSliderMove();
			}, this);

			document.onmouseup = function() {
				document.onmousemove = document.onmouseup = null;
			};
		}
		else
		{
			document.ontouchmove = BX.proxy(function(event) {
				this.rightPercent = 100-(((this.countNewLeft(event))*100)/(this.trackerWrap.offsetWidth));
				this.makeRightSliderMove();
			}, this);

			document.ontouchend = function() {
				document.ontouchmove = document.ontouchend = null;
			};
		}

		return false;
	};

	return SmartFilter;
})();
