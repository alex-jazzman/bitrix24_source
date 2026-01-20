/* eslint-disable */

BX.namespace("BX.Crm");

if(typeof BX.Crm.EntityEditorRecurringCustomRowField === "undefined")
{
	BX.Crm.EntityEditorRecurringCustomRowField = function()
	{
		BX.Crm.EntityEditorRecurringCustomRowField.superclass.constructor.apply(this);
		// this._currencyEditor = null;
		this._amountInput = null;
		this._selectInput = null;
		this._sumElement = null;
		this._selectContainer = null;
		this._inputWrapper = null;
		this._innerWrapper = null;
		this._selectedValue = "";
		this._selectClickHandler = BX.delegate(this.onSelectorClick, this);
		this._isMesureMenuOpened = false;
	};
	BX.extend(BX.Crm.EntityEditorRecurringCustomRowField, BX.Crm.EntityEditorField);
	BX.Crm.EntityEditorRecurringCustomRowField.prototype.getModeSwitchType = function(mode)
	{
		var result = BX.UI.EntityEditorModeSwitchType.common;
		if(mode === BX.UI.EntityEditorMode.edit)
		{
			result |= BX.UI.EntityEditorModeSwitchType.button|BX.UI.EntityEditorModeSwitchType.content;
		}

		return result;
	};
	BX.Crm.EntityEditorRecurringCustomRowField.prototype.getContentWrapper = function()
	{
		return this._innerWrapper;
	};
	BX.Crm.EntityEditorRecurringCustomRowField.prototype.focus = function()
	{
		if(this._amountInput)
		{
			BX.focus(this._amountInput);
			BX.Crm.EditorTextHelper.getCurrent().selectAll(this._amountInput);
		}
	};
	BX.Crm.EntityEditorRecurringCustomRowField.prototype.getValue = function(defaultValue)
	{
		if(!this._model)
		{
			return "";
		}

		return(
			this._model.getStringField(
				this.getAmountFieldName(),
				(defaultValue !== undefined ? defaultValue : "")
			)
		);
	};
	BX.Crm.EntityEditorRecurringCustomRowField.prototype.layout = function(options)
	{
		if(this._hasLayout)
		{
			return;
		}

		this.ensureWrapperCreated({ classNames: [ "crm-entity-widget-content-block-field-recurring-custom" ] });
		this.adjustWrapper();

		if(!this.isNeedToDisplay())
		{
			this.registerLayout(options);
			this._hasLayout = true;
			return;
		}

		var title = this.getTitle();
		var data = this.getData();

		var selectInputName = this.getSelectFieldName();
		this._selectedValue = this.getValue(selectInputName);
		var selectItems = BX.prop.getArray(BX.prop.getObject(data, "select"), "items");
		var selectName = '';
		if(!this._selectedValue)
		{
			var firstItem =  selectItems.length > 0 ? selectItems[0] : null;
			if(firstItem)
			{
				this._selectedValue = firstItem["VALUE"];
				selectName = firstItem["NAME"];
			}
		}
		else
		{
			selectName = this._editor.findOption(
				this._selectedValue,
				selectItems
			);
		}

		var amountInputName = this.getAmountFieldName();
		var amountValue = this.getValue(amountInputName);

		// this._amountValue = null;
		this._amountInput = null;
		this._selectInput = null;
		this._selectContainer = null;
		this._innerWrapper = null;
		this._sumElement = null;

		if(this._mode === BX.UI.EntityEditorMode.edit)
		{
			this._wrapper.appendChild(this.createTitleNode(title));

			this._amountInput = BX.create("input",
				{
					attrs:
						{
							className: "crm-entity-widget-content-input",
							name: amountInputName,
							type: "text",
							value: amountValue
						}
				}
			);
			BX.bind(this._amountInput, "input", this._changeHandler);

			this._selectInput = BX.create("input",
				{
					attrs:
						{
							name: selectInputName,
							type: "hidden",
							value: this._selectedValue
						}
				}
			);

			this._selectContainer = BX.create("div",
				{
					props: { className: "crm-entity-widget-content-select" },
					text: selectName
				}
			);
			BX.bind(this._selectContainer, "click", this._selectClickHandler);

			this._inputWrapper = BX.create("div",
				{
					props: { className: "crm-entity-widget-content-block-input-wrapper" },
					children:
						[
							this._amountInput,
							this._selectInput,
							BX.create('div',
								{
									props: { className: "crm-entity-widget-content-block-select" },
									children: [ this._selectContainer ]
								}
							)
						]
				}
			);

			this._innerWrapper = BX.create("div",
				{
					props: { className: "crm-entity-widget-content-block-inner crm-entity-widget-content-block-colums-input" },
					children: [ this._inputWrapper ]
				}
			);
		}

		this._wrapper.appendChild(this._innerWrapper);

		this.registerLayout(options);
		this._hasLayout = true;
	};
	BX.Crm.EntityEditorRecurringCustomRowField.prototype.doClearLayout = function(options)
	{
		BX.PopupMenu.destroy(this._id);
		this._amountInput = null;
		this._selectInput = null;
		this._sumElement = null;
		this._selectContainer = null;
		this._inputWrapper = null;
		this._innerWrapper = null;
	};
	BX.Crm.EntityEditorRecurringCustomRowField.prototype.getAmountFieldName = function()
	{
		return this._schemeElement.getDataStringParam("amount", "");
	};
	BX.Crm.EntityEditorRecurringCustomRowField.prototype.getSelectFieldName = function()
	{
		return BX.prop.getString(
			this._schemeElement.getDataObjectParam("select", {}),
			"name",
			""
		);
	};
	BX.Crm.EntityEditorRecurringCustomRowField.prototype.onSelectorClick = function (e)
	{
		this.openListMenu();
	};
	BX.Crm.EntityEditorRecurringCustomRowField.prototype.openListMenu = function()
	{
		if(this._isListMenuOpened)
		{
			return;
		}

		var data = this._schemeElement.getData();
		var selectList = BX.prop.getArray(BX.prop.getObject(data, "select"), "items"); //{NAME, VALUE}

		var key = 0;
		var menu = [];
		while (key < selectList.length)
		{
			menu.push(
				{
					text: selectList[key]["NAME"],
					value: selectList[key]["VALUE"],
					onclick: BX.delegate( this.onSelectItem, this)
				}
			);
			key++
		}

		BX.PopupMenu.show(
			this._id,
			this._selectContainer,
			menu,
			{
				angle: false, width: this._selectContainer.offsetWidth + 'px',
				events:
					{
						onPopupShow: BX.delegate( this.onListMenuOpen, this),
						onPopupClose: BX.delegate( this.onListMenuClose, this)
					}
			}
		);
		BX.PopupMenu.currentItem.popupWindow.setWidth(BX.pos(this._selectContainer)["width"]);
	};
	BX.Crm.EntityEditorRecurringCustomRowField.prototype.closeListMenu = function()
	{
		if(!this._isListMenuOpened)
		{
			return;
		}

		var menu = BX.PopupMenu.getMenuById(this._id);
		if(menu)
		{
			menu.popupWindow.close();
		}
	};
	BX.Crm.EntityEditorRecurringCustomRowField.prototype.onListMenuOpen = function()
	{
		BX.addClass(this._selectContainer, "active");
		this._isListMenuOpened = true;
	};
	BX.Crm.EntityEditorRecurringCustomRowField.prototype.onListMenuClose = function()
	{
		BX.PopupMenu.destroy(this._id);

		BX.removeClass(this._selectContainer, "active");
		this._isListMenuOpened = false;
	};
	BX.Crm.EntityEditorRecurringCustomRowField.prototype.onSelectItem = function(e, item)
	{
		this.closeListMenu();

		this._selectedValue = this._selectInput.value = item.value;
		this._selectContainer.innerHTML = BX.util.htmlspecialchars(item.text);

		this.markAsChanged(
			{
				fieldName: this.getSelectFieldName(),
				fieldValue: this._selectedValue
			}
		);
	};
	BX.Crm.EntityEditorRecurringCustomRowField.prototype.getRuntimeValue = function()
	{
		var data = [];
		if (this._mode === BX.UI.EntityEditorMode.edit)
		{
			if(this._amountInput)
			{
				data[this.getAmountFieldName()] = this._amountInput.value;
			}
			data[this.getSelectFieldName()] = this._selectedValue;

			return data;
		}
		return "";
	};
	BX.Crm.EntityEditorRecurringCustomRowField.prototype.save = function()
	{
		this._model.setField(
			this.getSelectFieldName(),
			this._selectedValue
		);

		if(this._amountInput)
		{
			this._model.setField(this.getAmountFieldName(), this._amountInput.value);
		}
	};
	BX.Crm.EntityEditorRecurringCustomRowField.create = function(id, settings)
	{
		var self = new BX.Crm.EntityEditorRecurringCustomRowField();
		self.initialize(id, settings);
		return self;
	}
}