/* eslint-disable */

BX.namespace("BX.Crm");

if(typeof BX.Crm.EntityEditorRecurring === "undefined")
{
	BX.Crm.EntityEditorRecurring = function()
	{
		BX.Crm.EntityEditorRecurring.superclass.constructor.apply(this);
	};

	BX.extend(BX.Crm.EntityEditorRecurring, BX.Crm.EntityEditorSubsection);
	BX.Crm.EntityEditorRecurring.prototype.initialize =  function(id, settings)
	{
		BX.Crm.EntityEditorRecurring.superclass.initialize.call(this, id, settings);
		var data = this._schemeElement.getData();
		this._schemeFieldData = BX.prop.getObject(data, 'fieldData', {});
		this._enableRecurring = BX.prop.getBoolean(this._schemeElement._settings, "enableRecurring", true);
		this._recurringModel = this._model.getField(this.getName());
	};

	BX.Crm.EntityEditorRecurring.prototype.initializeFromModel =  function()
	{
		BX.Crm.EntityEditorRecurring.superclass.initializeFromModel.call(this);
		var _this = this;
		for (var i = 0, length = this._fields.length; i < length; i++)
		{
			this._fields[i].getValue = function(name){
				if (!BX.type.isNotEmptyString(name))
				{
					name = this.getName();
				}
				return _this.getRecurringFieldValue(name);
			};
		}
	};

	BX.Crm.EntityEditorRecurring.prototype.getRecurringModel =  function()
	{
		var parent = this.getParent();
		if (parent instanceof BX.Crm.EntityEditorRecurring)
		{
			return parent.getRecurringModel();
		}

		return this._recurringModel;
	};
	BX.Crm.EntityEditorRecurring.prototype.isContextMenuEnabled = function()
	{
		return BX.Crm.EntityEditorSubsection.superclass.isContextMenuEnabled.call(this);
	};
	BX.Crm.EntityEditorRecurring.prototype.isNeedToDisplay = function()
	{
		return false;
	};
	BX.Crm.EntityEditorRecurring.prototype.isRequired = function()
	{
		return this._schemeElement && this._schemeElement.isRequired();
	};
	BX.Crm.EntityEditorRecurring.prototype.prepareContextMenuItems = function()
	{
		var results = [];
		results.push({ value: "hide", text: this.getMessage("hide") });

		return results;
	};
	BX.Crm.EntityEditorRecurring.prototype.processContextMenuCommand = function(e, command)
	{
		if(command === "hide")
		{
			window.setTimeout(BX.delegate(this.hide, this), 500);
		}
		else if (this._parent && this._parent.hasAdditionalMenu())
		{
			this._parent.processChildAdditionalMenuCommand(this, command);
		}
		this.closeContextMenu();
	};
	BX.Crm.EntityEditorRecurring.prototype.isDragEnabled = function()
	{
		return BX.Crm.EntityEditorSubsection.superclass.isDragEnabled.call(this);
	};
	BX.Crm.EntityEditorRecurring.prototype.getDragObjectType = function()
	{
		return BX.UI.EditorDragObjectType.field;
	};
	BX.Crm.EntityEditorRecurring.prototype.hasContentToDisplay = function()
	{
		return true;
	};
	BX.Crm.EntityEditorRecurring.prototype.getRecurringMode =  function()
	{
		var parent = this.getParent();
		if (parent instanceof BX.Crm.EntityEditorRecurring)
		{
			return parent.getRecurringMode();
		}

		return this.getRecurringFieldValue('RECURRING[MODE]');
	};

	BX.Crm.EntityEditorRecurring.prototype.getMessage = function(name)
	{
		var m = BX.Crm.EntityEditorRecurring.messages;
		return m.hasOwnProperty(name) ? m[name] : name;
	};
	BX.Crm.EntityEditorRecurring.prototype.processChildControlChange = function(child, params)
	{
		var childName = child.getName();
		var refreshLayout = false;
		var previousValue = child.getValue();
		var changedValue = child.getRuntimeValue();
		if (previousValue !== changedValue)
		{
			switch (childName)
			{
				case 'RECURRING[MODE]':
				case 'RECURRING[MULTIPLE_TYPE_LIMIT]':
				case 'RECURRING[BEGINDATE_TYPE]':
				case 'RECURRING[CLOSEDATE_TYPE]':
					refreshLayout = true;
					break;
				case 'RECURRING[MULTIPLE_TYPE]':
					if (
						previousValue === this.getSchemeFieldValue('MULTIPLE_CUSTOM')
						|| changedValue === this.getSchemeFieldValue('MULTIPLE_CUSTOM')
					)
					{
						refreshLayout = true;
					}
			}
		}
		var recurringModel = this.getRecurringModel();
		this.setChangedValue(childName, changedValue, recurringModel);
		BX.Crm.EntityEditorRecurring.superclass.processChildControlChange.call(this, child, params);
		if (refreshLayout)
		{
			this.refreshLayout();
		}
	};

	BX.Crm.EntityEditorRecurring.prototype.setChangedValue = function(childName, value, model)
	{
		if (BX.Type.isArray(value) || !BX.Type.isObject(value))
		{
			model[childName] = value;
		}
		else // is object
		{
			for (const key in value)
			{
				if (value.hasOwnProperty(key))
				{
					this.setChangedValue(key, value[key], model);
				}
			}
		}
	};

	BX.Crm.EntityEditorRecurring.prototype.layout = function(options)
	{
		//Create wrapper
		this._contentContainer = BX.create("div");

		if (this.isMainSubsection())
		{
			this._contentContainer.classList.add("crm-entity-widget-content");
		}

		const isViewMode = this._mode === BX.UI.EntityEditorMode.view;
		this.ensureWrapperCreated();
		this.layoutTitle();

		this._wrapper.appendChild(this._contentContainer);

		if (isViewMode)
		{
			const viewNode = BX.create("div", {
				props:{
					className: "crm-entity-widget-content-block crm-entity-widget-content-block-click-editable"
				},
				children: [this.createTitleNode(this.getTitle())]
			});
			this._contentContainer.appendChild(viewNode);

			const textNode = BX.create("div");
			viewNode.appendChild(textNode);

			const layoutData = this._schemeElement.getData();
			if (this._schemeElement._promise instanceof BX.Promise)
			{
				this.loadViewText();
				this._schemeElement._promise.then(
					BX.proxy(function() {
						textNode.classList = "crm-entity-widget-content-block-inner";
						textNode.innerHTML = BX.util.htmlspecialchars(layoutData.view.text);
						this._schemeElement._promise = null;
					}, this)
				);
			}
			else if (BX.type.isNotEmptyString(layoutData.view.text))
			{
				textNode.classList = "crm-entity-widget-content-block-inner";
				textNode.innerHTML = layoutData.view.text;
			}

			if (this._enableRecurring)
			{
				BX.bind(textNode, "click", BX.delegate(this.toggle, this));
			}

			if (this.isContextMenuEnabled())
			{
				viewNode.appendChild(this.createContextMenuButton());
			}

			if (this.isDragEnabled())
			{
				viewNode.appendChild(this.createDragButton());
				this.initializeDragDropAbilities();
			}
		}
		else if (!this._enableRecurring)
		{
			const viewNode = BX.create("div", {
				props:{
					className: "crm-entity-widget-content-block"
				},
				children: [this.createTitleNode(this.getMessage('modeTitle'))]
			});

			const disabledField = BX.create("div",{
				props: {
					className:'crm-entity-widget-content-block-inner'
				},
				children:[
					BX.create("div",{
						type:"text",
						props: {
							className:'crm-entity-widget-content-input',
							disabled: "disabled"
						},
						text: this.getMessage('notRepeat'),
						events: {
							click: BX.delegate(this.showLicencePopup,this)
						}
					})
				]

			});
			viewNode.appendChild(disabledField);
			const lock = BX.create("button",{
				props: {
					className:'crm-entity-widget-content-block-locked-icon'
				},
				events: {
					click: BX.delegate(this.showLicencePopup,this)
				}
			});

			viewNode.appendChild(lock);
			this._contentContainer.appendChild(viewNode);
		}
		else
		{
			for (let i = 0, l = this._fields.length; i < l; i++)
			{
				this._fields[i].isDragEnabled = function(){
					return false;
				};

				this.layoutChild(this._fields[i]);
			}
		}
		//Layout fields

		this._addChildButton = this._createChildButton = null;
		this._hasLayout = true;
		this.registerLayout(options);
	};
	BX.Crm.EntityEditorRecurring.prototype.createTitleNode = function(title)
	{
		var titleNode = BX.create(
			"div",
			{
				attrs: { className: "crm-entity-widget-content-block-title" },
				children: [
					BX.create(
						"span",
						{
							attrs: { className: "crm-entity-widget-content-block-title-text" },
							text: title
						}
					)
				]
			}
		);

		return titleNode;
	};
	BX.Crm.EntityEditorRecurring.prototype.setChildVisible = function(field)
	{
		var value = false;
		var name = field.getName();
		var mode = this.getRecurringMode();
		if (name === 'RECURRING[MODE]')
		{
			value = true;
		}
		else if (mode === this.getSchemeFieldValue('SINGLE_EXECUTION'))
		{
			switch (name)
			{
				case 'SINGLE_PARAMS':
				case 'RECURRING[BEGINDATE_TYPE]':
				case 'RECURRING[CLOSEDATE_TYPE]':
				case 'SUBTITLE_NEW_ORDER_PARAMS':
				case 'NEW_BEGINDATE':
				case 'NEW_CLOSEDATE':
				case 'RECURRING[CATEGORY_ID]':
				case 'EMAIL_PARAMS':
				case 'DATES_PARAMS':
					value = true;
					break;
				case 'OFFSET_BEGINDATE':
					if (this.getRecurringFieldValue('RECURRING[BEGINDATE_TYPE]') === this.getSchemeFieldValue('CALCULATED_FIELD_VALUE'))
					{
						value = true;
					}
					break;
				case 'OFFSET_CLOSEDATE':
					if (this.getRecurringFieldValue('RECURRING[CLOSEDATE_TYPE]') === this.getSchemeFieldValue('CALCULATED_FIELD_VALUE'))
					{
						value = true;
					}
					break;
			}
		}
		else if (mode === this.getSchemeFieldValue('MULTIPLE_EXECUTION'))
		{
			switch (name)
			{
				case 'MULTIPLE_PARAMS':
				case 'RECURRING[MULTIPLE_TYPE]':
				case 'RECURRING[CATEGORY_ID]':
				case 'RECURRING[MULTIPLE_DATE_START]':
				case 'MULTIPLE_LIMIT':
				case 'RECURRING[MULTIPLE_TYPE_LIMIT]':
				case 'SUBTITLE_NEW_ORDER_PARAMS':
				case 'NEW_BEGINDATE':
				case 'NEW_CLOSEDATE':
				case 'RECURRING[BEGINDATE_TYPE]':
				case 'RECURRING[CLOSEDATE_TYPE]':
				case 'EMAIL_PARAMS':
				case 'DATES_PARAMS':
					value = true;
					break;
				case 'MULTIPLE_CUSTOM':
					if (this.getRecurringFieldValue('RECURRING[MULTIPLE_TYPE]') === this.getSchemeFieldValue('MULTIPLE_CUSTOM'))
					{
						value = true;
					}
					break;
				case 'RECURRING[MULTIPLE_DATE_LIMIT]':
					if (this.getRecurringFieldValue('RECURRING[MULTIPLE_TYPE_LIMIT]') === this.getSchemeFieldValue('LIMITED_BY_DATE'))
					{
						value = true;
					}
					break;
				case 'RECURRING[MULTIPLE_TIMES_LIMIT]':
					if (this.getRecurringFieldValue('RECURRING[MULTIPLE_TYPE_LIMIT]') === this.getSchemeFieldValue('LIMITED_BY_TIMES'))
					{
						value = true;
					}
					break;
				case 'OFFSET_BEGINDATE':
					if (this.getRecurringFieldValue('RECURRING[BEGINDATE_TYPE]') === this.getSchemeFieldValue('CALCULATED_FIELD_VALUE'))
					{
						value = true;
					}
					break;
				case 'OFFSET_CLOSEDATE':
					if (this.getRecurringFieldValue('RECURRING[CLOSEDATE_TYPE]') === this.getSchemeFieldValue('CALCULATED_FIELD_VALUE'))
					{
						value = true;
					}
					break;
			}
		}
		field.setVisible(value);
	};
	BX.Crm.EntityEditorRecurring.prototype.getRecurringFieldValue = function(name)
	{
		return BX.prop.get(this.getRecurringModel(), name)
	};
	BX.Crm.EntityEditorRecurring.prototype.getSchemeFieldValue = function(name)
	{
		return BX.prop.get(this._schemeFieldData, name, "")
	};
	BX.Crm.EntityEditorRecurring.prototype.isMainSubsection = function()
	{
		return !(this.getParent() instanceof BX.Crm.EntityEditorRecurring);
	};
	BX.Crm.EntityEditorRecurring.prototype.onBeforeSubmit = function()
	{
		if (this.isMainSubsection())
		{
			this._wrapper.appendChild(
				BX.create('input',{
					props:{
						type: 'hidden',
						name: 'IS_RECURRING',
						value: (this._model.getStringField('IS_RECURRING') === 'Y') ? 'Y' : 'N'
					}
				})
			);
		}
	};
	BX.Crm.EntityEditorRecurring.prototype.save = function()
	{
		if (this.isMainSubsection())
		{
			this._schemeElement._promise = new BX.Promise();
		}
	};
	BX.Crm.EntityEditorRecurring.prototype.loadViewText = function()
	{
		var data = this._schemeElement.getData();
		if (
			BX.type.isPlainObject(data.loaders)
			&& BX.type.isNotEmptyString(data.loaders["url"])
		)
		{
			BX.ajax(
				{
					url: data.loaders["url"],
					method: "POST",
					dataType: "json",
					data: {
						sessid : BX.bitrix_sessid(),
						entityId: this._model.getField('ID'),
						entityTypeId: this._model.getEntityTypeId(),
					},
					onsuccess: BX.delegate(this.onEntityHintLoad, this)
				}
			);
		}
	};

	BX.Crm.EntityEditorRecurring.prototype.onEntityHintLoad = function(result)
	{
		const entityData = result.data ?? null;

		if (!entityData)
		{
			return;
		}

		const { hint } = entityData;

		if (BX.type.isNotEmptyString(hint))
		{
			this._schemeElement._data.view.text = hint;
		}

		if (this._schemeElement._promise instanceof BX.Promise)
		{
			this._schemeElement._promise.fulfill();
			this._schemeElement._promise = null;
		}
	};

	BX.Crm.EntityEditorRecurring.prototype.showLicencePopup = function(e)
	{
		e.preventDefault();

		if(!top.BX || !top.BX.UI ||!top.BX.UI.InfoHelper)
		{
			return;
		}

		var layoutData = this._schemeElement.getData();
		var restrictionScript = layoutData.restrictScript;
		if (BX.type.isNotEmptyString(restrictionScript))
		{
			eval(restrictionScript);
		}
	};
	BX.Crm.EntityEditorRecurring.create = function(id, settings)
	{
		var self = new BX.Crm.EntityEditorRecurring();
		self.initialize(id, settings);
		return self;
	};
}