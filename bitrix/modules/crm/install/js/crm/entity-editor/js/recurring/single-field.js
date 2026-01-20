/* eslint-disable */

BX.namespace("BX.Crm");

if(typeof BX.Crm.EntityEditorRecurringSingleField === "undefined")
{
	BX.Crm.EntityEditorRecurringSingleField = function()
	{
		BX.Crm.EntityEditorRecurringSingleField.superclass.constructor.apply(this);
		this._dateInput = null;
	};
	BX.extend(BX.Crm.EntityEditorRecurringSingleField, BX.Crm.EntityEditorRecurringCustomRowField);

	BX.Crm.EntityEditorRecurringSingleField.prototype.layout = function(options)
	{
		if(this._hasLayout)
		{
			return;
		}

		this.ensureWrapperCreated({ classNames: [ "crm-entity-widget-content-block-field-recurring-single" ] });
		this.adjustWrapper();

		if(!this.isNeedToDisplay())
		{
			this.registerLayout(options);
			this._hasLayout = true;
			return;
		}

		var data = this.getData();

		var amountInputName = this.getAmountFieldName();
		var amountValue = this.getValue(amountInputName);
		var selectInputName = this.getSelectFieldName();
		this._selectedValue = this.getValue(selectInputName);
		var dateInputName = this.getDateFieldName();
		this._dateValue = this.getValue(dateInputName);

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
		this._amountInput = null;
		this._selectInput = null;
		this._selectContainer = null;
		this._innerWrapper = null;
		this._sumElement = null;

		if(this._mode === BX.UI.EntityEditorMode.edit)
		{
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

			this._dateInput = BX.create('input',{
				style:{
					display:'inline-block'
				},
				props:{
					name: dateInputName,
					className:'crm-entity-widget-content-input crm-entity-widget-content-input-date',
					value: this._dateValue
				},
				events: {
					click: function(){
						BX.calendar({node: this, field: this, bTime: false})
					},
					change: BX.delegate(
						function(e){
							this.markAsChanged();
						}, this)
				}
			});

			BX.bind(this._selectContainer, "click", this._selectClickHandler);

			const children = [];
			if (this.getModel()._entityTypeId !== BX.CrmEntityType.names.deal)
			{
				children.push(BX.create('span',{ text: this.getMessage('before')}));
			}
			children.push(
				this._amountInput,
				this._selectInput,
				BX.create('div',
					{
						props: { className: "crm-entity-widget-content-block-select" },
						children: [ this._selectContainer ]
					}
				),
				BX.create('span',{ text: this.getMessage('until')}),
				this._dateInput,
			);

			this._inputWrapper = BX.create('div', {
				props: { className: 'crm-entity-widget-content-block-input-wrapper' },
				children,
			});

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
	BX.Crm.EntityEditorRecurringCustomRowField.prototype.getDateFieldName = function()
	{
		return this._schemeElement.getDataStringParam("date", "");
	};
	BX.Crm.EntityEditorRecurringSingleField.prototype.getRuntimeValue = function()
	{
		var data = [];
		if (this._mode === BX.UI.EntityEditorMode.edit)
		{
			if(this._amountInput)
			{
				data[this.getAmountFieldName()] = this._amountInput.value;
			}
			data[this.getSelectFieldName()] = this._selectedValue;
			data[this.getDateFieldName()] = this._dateInput.value;

			return data;
		}
		return "";
	};
	BX.Crm.EntityEditorRecurringSingleField.prototype.save = function()
	{
		var data = this._schemeElement.getData();
		this._model.setField(
			BX.prop.getString(BX.prop.getObject(data, "select"), "name"),
			this._selectedValue
		);

		if(this._amountInput)
		{
			this._model.setField(BX.prop.getString(data, "amount"), this._amountInput.value);
		}
		if(this._dateInput)
		{
			this._model.setField(BX.prop.getString(data, "date"), this._dateInput.value);
		}
	};
	BX.Crm.EntityEditorRecurringSingleField.prototype.getMessage = function(name)
	{
		var m = BX.Crm.EntityEditorRecurringSingleField.messages;
		return m.hasOwnProperty(name) ? m[name] : name;
	};
	BX.Crm.EntityEditorRecurringSingleField.create = function(id, settings)
	{
		var self = new BX.Crm.EntityEditorRecurringSingleField();
		self.initialize(id, settings);
		return self;
	}
}