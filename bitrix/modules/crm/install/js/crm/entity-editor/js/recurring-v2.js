/* eslint-disable no-underscore-dangle */

BX.namespace('BX.Crm');

if (BX.Type.isUndefined(BX.Crm.EntityEditorRecurringV2))
{
	BX.Crm.EntityEditorRecurringV2 = function()
	{
		BX.Crm.EntityEditorRecurringV2.superclass.constructor.apply(this);
	};

	BX.extend(BX.Crm.EntityEditorRecurringV2, BX.Crm.EntityEditorSubsection);
	BX.Crm.EntityEditorRecurringV2.prototype.initialize = function(id, settings)
	{
		BX.Crm.EntityEditorRecurringV2.superclass.initialize.call(this, id, settings);

		const data = this._schemeElement.getData();
		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-pseudo-private
		this._schemeFieldData = BX.prop.getObject(data, 'fieldData', {});
		this.enableRecurring = BX.prop.getBoolean(
			this._schemeElement._settings,
			'enableRecurring',
			true,
		);
		this.recurringModel = this._model.getField(this.getName());

		const { _entityTypeId: entityTypeId, _entityId: entityId } = settings.editor;

		const changeHandler = (input) => {
			const recurringModel = this.getRecurringModel();
			this.setChangedValue(input.name, input.value, recurringModel);
			this._changeHandler();
		};

		this.recurringField = BX.Crm.Field.Recurring.create(
			entityTypeId,
			entityId,
			changeHandler,
			{
				isCategoriesEnabled: data.isCategoriesEnabled ?? false,
				categories: data.categories ?? [],
			},
		);
	};

	BX.Crm.EntityEditorRecurringV2.prototype.initializeFromModel = function()
	{
		BX.Crm.EntityEditorRecurringV2.superclass.initializeFromModel.call(this);

		if (this.recurringModel)
		{
			const model = this._model.getField(this.getName());
			Object.keys(this.recurringModel).forEach((fieldName) => {
				this.recurringModel[fieldName] = model[fieldName];
			});
		}
	};

	BX.Crm.EntityEditorRecurringV2.prototype.getRecurringModel = function()
	{
		return this.recurringModel;
	};

	BX.Crm.EntityEditorRecurringV2.prototype.isContextMenuEnabled = function()
	{
		return BX.Crm.EntityEditorSubsection.superclass.isContextMenuEnabled.call(this);
	};

	BX.Crm.EntityEditorRecurringV2.prototype.isNeedToDisplay = function()
	{
		return false;
	};

	BX.Crm.EntityEditorRecurringV2.prototype.isRequired = function()
	{
		return this._schemeElement?.isRequired();
	};

	BX.Crm.EntityEditorRecurringV2.prototype.prepareContextMenuItems = function()
	{
		const results = [];
		results.push({ value: 'hide', text: this.getMessage('hide') });

		return results;
	};

	BX.Crm.EntityEditorRecurringV2.prototype.processContextMenuCommand = function(e, command)
	{
		if (command === 'hide')
		{
			window.setTimeout(BX.delegate(this.hide, this), 500);
		}
		else if (this._parent?.hasAdditionalMenu())
		{
			this._parent.processChildAdditionalMenuCommand(this, command);
		}

		this.closeContextMenu();
	};

	BX.Crm.EntityEditorRecurringV2.prototype.isDragEnabled = function()
	{
		return BX.Crm.EntityEditorSubsection.superclass.isDragEnabled.call(this);
	};

	BX.Crm.EntityEditorRecurringV2.prototype.getDragObjectType = function()
	{
		return BX.UI.EditorDragObjectType.field;
	};

	BX.Crm.EntityEditorRecurringV2.prototype.hasContentToDisplay = function()
	{
		return true;
	};

	BX.Crm.EntityEditorRecurringV2.prototype.getRecurringMode = function()
	{
		return this.getRecurringFieldValue('RECURRING[MODE]');
	};

	BX.Crm.EntityEditorRecurringV2.prototype.getMessage = function(name)
	{
		return BX.Crm.EntityEditorRecurringV2.messages[name] ?? name;
	};

	BX.Crm.EntityEditorRecurringV2.prototype.setChangedValue = function(childName, value, model)
	{
		if (BX.Type.isArray(value) || !BX.Type.isObject(value))
		{
			// eslint-disable-next-line no-param-reassign
			model[childName] = value;
		}
		else
		{
			Object.keys(value).forEach((key) => {
				if (Object.hasOwn(value, key))
				{
					this.setChangedValue(key, value[key], model);
				}
			});
		}
	};

	BX.Crm.EntityEditorRecurringV2.prototype.layout = function(options)
	{
		this.contentContainer = BX.Tag.render`<div class="crm-entity-widget-content"></div>`;

		const isViewMode = this._mode === BX.UI.EntityEditorMode.view;
		this.ensureWrapperCreated();
		this.layoutTitle();

		BX.Dom.append(this.contentContainer, this._wrapper);

		if (!this.enableRecurring)
		{
			const viewNode = BX.Tag.render`
				<div class="crm-entity-widget-content-block">
					${this.createTitleNode(this.getMessage('modeTitle'))}
					<div class="crm-entity-widget-content-block-inner">
						<div class="crm-entity-widget-content-input" disabled="disabled" onclick="${this.showLicencePopup.bind(this)}">
							${this.getMessage('notRepeat')}
						</div>
					</div>
					<button class="crm-entity-widget-content-block-locked-icon" onclick="${this.showLicencePopup.bind(this)}"></button>
				</div>
			`;

			BX.Dom.append(viewNode, this.contentContainer);
		}
		else if (isViewMode)
		{
			const viewNode = BX.Tag.render`
				<div class="crm-entity-widget-content-block crm-entity-widget-content-block-click-editable">
					${this.createTitleNode(this.getTitle())}
				</div>
			`;

			BX.Dom.append(viewNode, this.contentContainer);

			const textNode = BX.Tag.render`<div></div>`;
			BX.Dom.append(textNode, viewNode);

			const layoutData = this._schemeElement.getData();
			if (this._schemeElement._promise instanceof BX.Promise)
			{
				this.loadViewText();
				void this._schemeElement._promise.then(() => {
					BX.Dom.addClass(textNode, 'crm-entity-widget-content-block-inner');
					textNode.innerHTML = BX.util.htmlspecialchars(layoutData.view.text);
					// eslint-disable-next-line @bitrix24/bitrix24-rules/no-pseudo-private
					this._schemeElement._promise = null;
				});
			}
			else if (BX.type.isNotEmptyString(layoutData.view.text))
			{
				BX.Dom.addClass(textNode, 'crm-entity-widget-content-block-inner');
				textNode.innerHTML = layoutData.view.text;
			}

			BX.Event.bind(textNode, 'click', this.toggle.bind(this));

			if (this.isContextMenuEnabled())
			{
				BX.Dom.append(this.createContextMenuButton(), viewNode);
			}

			if (this.isDragEnabled())
			{
				BX.Dom.append(this.createDragButton(), viewNode);
				this.initializeDragDropAbilities();
			}
		}
		else
		{
			this.recurringField.setData(this.getRecurringModel());
			this.innerWrapper = this.recurringField.getLayout();

			BX.Dom.append(this.innerWrapper, this.contentContainer);
		}

		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-pseudo-private
		this._addChildButton = null;
		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-pseudo-private
		this._createChildButton = null;
		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-pseudo-private
		this._hasLayout = true;

		this.registerLayout(options);
	};

	BX.Crm.EntityEditorRecurringV2.prototype.createTitleNode = function(title)
	{
		return BX.Tag.render`
			<div class="crm-entity-widget-content-block-title">
				<span class="crm-entity-widget-content-block-title-text">${title}</span>
			</div>
		`;
	};

	BX.Crm.EntityEditorRecurringV2.prototype.getRecurringFieldValue = function(name)
	{
		return BX.prop.get(this.getRecurringModel(), name);
	};

	BX.Crm.EntityEditorRecurringV2.prototype.isEditMode = function()
	{
		// eslint-disable-next-line no-underscore-dangle
		return this._mode === BX.UI.EntityEditorMode.edit;
	};

	BX.Crm.EntityEditorRecurringV2.prototype.getSchemeFieldValue = function(name)
	{
		return BX.prop.get(this._schemeFieldData, name, '');
	};

	BX.Crm.EntityEditorRecurringV2.prototype.onBeforeSubmit = function()
	{
		const value = (this._model.getStringField('IS_RECURRING') === 'Y') ? 'Y' : 'N';
		const input = BX.Tag.render`
			<input type="hidden" name="IS_RECURRING" value="${value}">
		`;

		BX.Dom.append(input, this._wrapper);
	};

	BX.Crm.EntityEditorRecurringV2.prototype.save = function()
	{
		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-pseudo-private
		this._schemeElement._promise = new BX.Promise();
	};

	BX.Crm.EntityEditorRecurringV2.prototype.loadViewText = function()
	{
		const data = this._schemeElement.getData();

		if (BX.type.isPlainObject(data.loaders) && BX.type.isNotEmptyString(data.loaders.url))
		{
			BX.ajax({
				url: data.loaders.url,
				method: 'POST',
				dataType: 'json',
				data: {
					sessid : BX.bitrix_sessid(),
					entityId: this._model.getField('ID'),
					entityTypeId: this._model.getEntityTypeId(),
				},
				onsuccess: this.onEntityHintLoad.bind(this),
			});
		}
	};

	BX.Crm.EntityEditorRecurringV2.prototype.onEntityHintLoad = function(result)
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
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-pseudo-private
			this._schemeElement._promise = null;
		}
	};

	BX.Crm.EntityEditorRecurringV2.prototype.showLicencePopup = function(e)
	{
		e.preventDefault();

		if (!top.BX || !top.BX.UI || !top.BX.UI.InfoHelper)
		{
			return;
		}

		const layoutData = this._schemeElement.getData();
		const restrictionScript = layoutData.restrictScript;
		if (BX.type.isNotEmptyString(restrictionScript))
		{
			eval(restrictionScript);
		}
	};

	BX.Crm.EntityEditorRecurringV2.create = function(id, settings)
	{
		const self = new BX.Crm.EntityEditorRecurringV2();
		self.initialize(id, settings);

		return self;
	};
}
