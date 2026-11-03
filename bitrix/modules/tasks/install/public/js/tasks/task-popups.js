(function(window) {

if (BX.TaskPriorityPopup)
	return;

/*==================================================Generic Task List Popup========================================================*/
var TaskListPopup = function(popupId, popupClassName, title, items, params)
{
	this.items = [];
	this.popupId = popupId;
	this.popupClassName = popupClassName;
	if (BX.type.isArray(items))
	{
		for (var i = 0; i < items.length; i++)
		{
			if (typeof items[i]["id"] !== "undefined")
				this.items.push(items[i]);
		}
	}

	this.params = params || {};
	this.title = title;

	this.popupWindow = null;
	this.currentTask = null;
	this.tasksData = {};
	this.itemNodes = [];
	this.itemsContainerNode = null;
	this.focusZone = null;
	this.focusReturnPending = false;
	this.focusReturnSuppressed = false;
};

TaskListPopup.prototype.show = function(taskId, bindElement, currentValues, params)
{
	if (this.popupWindow !== null)
	{
		this.focusReturnSuppressed = true;
		this.popupWindow.close();
		this.focusReturnSuppressed = false;
	}

	this.currentTask = this.__getTask(taskId, bindElement, currentValues, params);
	if (this.currentTask === null)
		return false;

	if (this.popupWindow == null)
		this.__createLayout();
	else
		this.popupWindow.setBindElement(this.currentTask.bindElement);

	this.__redrawList();

	this.popupWindow.show();

	if (this.focusZone !== null)
		this.focusZone.activate();

	var entryItemNode = this.__getEntryItemNode();
	if (entryItemNode !== null)
		entryItemNode.focus();
};

TaskListPopup.prototype.__createLayout = function()
{
	for (var i = 0; i < this.items.length; i++)
	{
		var item = this.items[i];
		var domElement = BX.create(
			"button",
			{
				props : { className: "task-popup-list-item", type: "button" },
				attrs : { role : "menuitemradio", "aria-checked" : "false" },
				events : {
					click : BX.proxy(this.__onItemClick, {obj : this, listItem : item })
				},
				children : [
						BX.create("span", { props : { className : "task-popup-list-item-left" }}),
						BX.create("span", { props : { className : "task-popup-list-item-icon task-popup-"+ this.popupClassName + "-icon-" + item.className }}),
						BX.create("span", { props : { className : "task-popup-list-item-text" }, text : item.name }),
						BX.create("span", { props : { className : "task-popup-list-item-right" }})
				]
			}
		);

		BX.data(domElement, 'item', item);

		this.itemNodes.push(domElement);
	}

	var popupWindowId = "bx-task-" + this.popupId + "-popup";
	var titleId = popupWindowId + "-title";

	var popupOptions = {
		role : "menu",
		autoHide : true,
		offsetTop : 1,
		lightShadow : true,
		closeByEsc: true,
		events : {
			onPopupClose : BX.proxy(this.__onPopupClose, this),
			onPopupAfterClose : BX.proxy(this.__onPopupAfterClose, this)
		},
		content : (this.popupWindowContent = BX.create(
			"div",
			{
				props : { className: "task-" + this.popupClassName + "-popup" },
				attrs : { role : "presentation" },
				events : {
					keydown : BX.proxy(this.__onPopupContentKeyDown, this)
				},
				children : [
						BX.create("div", { props: { className: "task-" + this.popupClassName +"-popup-title" }, attrs : { id : titleId, role : "presentation" }, text : this.title } ),
						BX.create("div", { props : { className : "popup-window-hr" }, attrs : { role : "presentation" }, children : [ BX.create("i", {}) ]}),
						(this.itemsContainerNode = BX.create("div", { props: { className: "task-popup-list-list" }, attrs : { role : "presentation" }, children :  this.itemNodes } ))
				]
			}
		))
	};

	if (BX.type.isNotEmptyString(this.title))
		popupOptions.ariaLabelledBy = titleId;
	else
		popupOptions.ariaLabel = BX.message("TASKS_POPUP_LIST_TITLE_FALLBACK");

	this.popupWindow = BX.PopupWindowManager.create(popupWindowId, this.currentTask.bindElement, popupOptions);

	if (BX.UI && BX.UI.Accessibility && BX.UI.Accessibility.FocusZone)
	{
		this.focusZone = new BX.UI.Accessibility.FocusZone(this.itemsContainerNode, {
			bindKeys : BX.UI.Accessibility.FocusKeys.ArrowVertical | BX.UI.Accessibility.FocusKeys.HomeAndEnd,
			focusOutBehavior : "wrap",
			focusInStrategy : BX.proxy(this.__getEntryItemNode, this)
		});
	}
};

TaskListPopup.prototype.__redrawList = function()
{
	this.__selectItem(this.currentTask.listValue);
};

TaskListPopup.prototype.__selectItem = function(itemId)
{
	for (var i = 0; i < this.itemNodes.length; i++)
	{
		var itemNode = this.itemNodes[i];
		var item = BX.data(itemNode, 'item');
		var isSelected = String(item.id) === String(itemId) || Boolean(item.values && item.values[itemId]);

		itemNode.setAttribute("aria-checked", isSelected ? "true" : "false");

		if (isSelected)
			BX.addClass(itemNode, "task-popup-list-item-selected");
		else
			BX.removeClass(itemNode, "task-popup-list-item-selected");
	}
};

TaskListPopup.prototype.__getEntryItemNode = function()
{
	for (var i = 0; i < this.itemNodes.length; i++)
	{
		if (this.itemNodes[i].getAttribute("aria-checked") === "true")
			return this.itemNodes[i];
	}

	return this.itemNodes.length > 0 ? this.itemNodes[0] : null;
};

TaskListPopup.prototype.__getTask = function(taskId, bindElement, currentValues, params)
{
	if (!BX.type.isNumber(taskId))
		return null;

	this.tasksData[taskId] = {
		id : taskId,
		bindElement : bindElement,
		listItem : {},
		onPopupChange : params.events && params.events.onPopupChange && BX.type.isFunction(params.events.onPopupChange) ? params.events.onPopupChange : null,
		onPopupClose : params.events && params.events.onPopupClose && BX.type.isFunction(params.events.onPopupClose) ? params.events.onPopupClose : null
	};

	if (typeof(currentValues) === "object")
	{
		for (var prop in currentValues)
		{
			this.tasksData[taskId][prop] = currentValues[prop];
		}
	}
	else
	{
		this.tasksData[taskId].listValue = currentValues;
	}

	if (typeof(this.tasksData[taskId]["listValue"]) !== "undefined")
	{
		for (var i = 0; i < this.items.length; i++)
		{
			if (this.items[i].id === this.tasksData[taskId].listValue)
			{
				this.tasksData[taskId].listItem = this.items[i];
				break;
			}
		}
	}

	return this.tasksData[taskId];
};

TaskListPopup.prototype.__onItemClick = function(event)
{
	if (this.obj.currentTask.listValue != this.listItem.id)
	{
		this.obj.currentTask.listValue = this.listItem.id;
		this.obj.currentTask.listItem = this.listItem;
		if (this.obj.currentTask.onPopupChange)
			this.obj.currentTask.onPopupChange();
	}

	this.obj.popupWindow.close();

	BX.PreventDefault(event);
};

TaskListPopup.prototype.__onPopupContentKeyDown = function(event)
{
	if (event.key !== "Tab")
		return;

	this.popupWindow.close();

	BX.PreventDefault(event);
};

TaskListPopup.prototype.__onPopupClose = function(popupWindow)
{
	this.focusReturnPending = this.__isFocusReturnNeeded();

	if (this.focusZone !== null)
		this.focusZone.deactivate();

	if (this.currentTask.onPopupClose)
		this.currentTask.onPopupClose();
};

// The focus is returned here and not in __onPopupClose: the focus trap deactivates between
// the two events, restoring the focus on its own, and would win over an earlier call.
TaskListPopup.prototype.__onPopupAfterClose = function(popupWindow)
{
	if (!this.focusReturnPending)
		return;

	this.focusReturnPending = false;
	this.currentTask.bindElement.focus();
};

TaskListPopup.prototype.__isFocusReturnNeeded = function()
{
	if (this.focusReturnSuppressed)
		return false;

	var activeElement = document.activeElement;
	var focusIsLost = !activeElement
		|| activeElement === document.body
		|| activeElement === document.documentElement
		|| activeElement.tabIndex < 0;

	return focusIsLost || this.popupWindow.getPopupContainer().contains(activeElement);
};

/* ===================================================Priority Popup ===============================================================*/
var TaskPriorityPopup = function()
{
	TaskPriorityPopup.superclass.constructor.apply(this, [
		"priority",
		"priority",
		BX.message("TASKS_PRIORITY_V2"),
		[
			{ id : 0, name : BX.message("TASKS_COMMON_NO"), className : "low", values: {'0': true, '1': true} },
			{ id : 2, name : BX.message("TASKS_COMMON_YES"), className : "high" }
		],
		{}
	]);
};
BX.extend(TaskPriorityPopup, TaskListPopup);

/* ===================================================Public Priority Popup Method====================================================*/
BX.TaskPriorityPopup = {

	popup : null,
	show : function(taskId, bindElement, currentValue, params)
	{
		if (this.popup === null)
		{
			this.popup = new TaskPriorityPopup();
		}

		this.popup.show(taskId, bindElement, currentValue, params);
	}
};


/*=======================================================Simple Grade Popup===========================================================*/
var TaskGradeSimplePopup = function(popupId)
{
	TaskGradeSimplePopup.superclass.constructor.apply(this, [
		popupId,
		"grade",
		BX.message("TASKS_MARK_MSGVER_1"),
		[
			{ id : "NULL", name : BX.message("TASKS_MARK_NONE"), className : "none" },
			{ id : "P", name : BX.message("TASKS_MARK_P_MSGVER_1"), className : "plus" },
			{ id : "N", name : BX.message("TASKS_MARK_N_MSGVER_1"), className : "minus" }
		],
		{}
	]);
};

BX.extend(TaskGradeSimplePopup, TaskListPopup);

/* ================================================== Public Popup Method ======================================================================*/
BX.TaskGradePopup = {

	simplePopup : null,

	show : function(taskId, bindElement, currentValues, params)
	{
		if (this.simplePopup == null)
		{
			this.simplePopup = new TaskGradeSimplePopup("grade-simple");
		}
		this.simplePopup.show(taskId, bindElement, currentValues, params);
	}
};

})(window);