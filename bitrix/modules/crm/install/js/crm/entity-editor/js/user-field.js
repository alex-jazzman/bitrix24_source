BX.namespace("BX.Crm");

//region USER FIELD
if(typeof BX.Crm.EntityUserFieldType === "undefined")
{
	/**
	 * @deprecated
	 */
	BX.Crm.EntityUserFieldType = BX.UI.EntityUserFieldType;
}

if(typeof BX.Crm.EntityUserFieldManager === "undefined")
{
	/**
	 * @deprecated
	 */
	BX.Crm.EntityUserFieldManager = BX.UI.EntityUserFieldManager;
}

if(typeof BX.Crm.EntityUserFieldLayoutLoader === "undefined")
{
	/**
	 * @deprecated
	 */
	BX.Crm.EntityUserFieldLayoutLoader = BX.UI.EntityUserFieldLayoutLoader;
}

if(typeof BX.Crm.EntityEditorUserFieldConfigurator === "undefined")
{
	/**
	 * @extends BX.UI.EntityEditorUserFieldConfigurator
	 */
	BX.Crm.EntityEditorUserFieldConfigurator = function()
	{
		BX.Crm.EntityEditorUserFieldConfigurator.superclass.constructor.apply(this);
		this._visibilityConfigurator = null;
		this._aiFillPolicy = null;
		this._aiFillPolicySettings = null;
		this._aiFillPolicyCheckBox = null;
		this._aiFillPolicyContainer = null;
		this._aiFillPolicySavedState = true;
	};
	BX.extend(BX.Crm.EntityEditorUserFieldConfigurator, BX.UI.EntityEditorUserFieldConfigurator);
	BX.Crm.EntityEditorUserFieldConfigurator.prototype.doInitialize = function()
	{
		BX.Crm.EntityEditorUserFieldConfigurator.superclass.doInitialize.apply(this);
		if (this.getEditor().canChangeCommonConfiguration())
		{
			this._visibilityConfigurator = BX.prop.get(this._settings, "visibilityConfigurator", null);

			if (this._field)
			{
				this._aiFillPolicy = BX.prop.getObject(this._field.getData(), "aiFillPolicy", null);
				this._aiFillPolicySavedState = BX.prop.getBoolean(this._aiFillPolicy, "enabled", true);
			}
			else if (this.canManageFields())
			{
				this._aiFillPolicySettings = this.getEditor().getAiFillPolicySettings();
			}
		}
	};
	/**
	 * Creating a field from the card. The capability comes from the server through the user field manager
	 * of the editor and is a capability of its own: changing the common layout never grants it.
	 */
	BX.Crm.EntityEditorUserFieldConfigurator.prototype.canManageFields = function()
	{
		var userFieldManager = this.getEditor().getUserFieldManager();

		return !!userFieldManager && userFieldManager.isCreationEnabled();
	};
	BX.Crm.EntityEditorUserFieldConfigurator.prototype.getOptionContainer = function()
	{
		this._optionWrapper = BX.Crm.EntityEditorUserFieldConfigurator.superclass.getOptionContainer.apply(this);

		var isNew = (this._field === null);
		//region AI fill policy
		if (this.isAiFillPolicyAvailable())
		{
			this._aiFillPolicyCheckBox = this.createOption(
				{ caption: this.getMessage("aiFillPolicy") }
			);
			this._aiFillPolicyCheckBox.setAttribute("data-testid", "crm-entity-editor-ai-fill-policy-checkbox");
			this._aiFillPolicyCheckBox.checked = this._aiFillPolicySavedState;
			// createOption returns the checkbox and appends its own row last: the row is what gets hidden
			this._aiFillPolicyContainer = this._optionWrapper.lastElementChild;

			if (this._isTimeEnabledCheckBox)
			{
				BX.bind(
					this._isTimeEnabledCheckBox,
					"change",
					BX.delegate(this.adjustAiFillPolicyVisibility, this)
				);
			}
		}
		//endregion

		//region Use timezone
		if(this._typeId === "datetime")
		{
			this._useTimezoneCheckBox = this.createOption(
				{ caption: BX.UI.EntityEditorFieldConfigurator.messages['useTimezone']}
			);

			this._useTimezoneCheckBox.checked = isNew
				? false
				: (this._field.getFieldSettings().USE_TIMEZONE === 'Y');
		}
		//endregion

		//region Visibility configurator
		if (this._visibilityConfigurator) {
			this._visibilityUserFieldCheckbox = this.createOption(
				{
					caption: this._visibilityConfigurator.getTitle(),
					containerSettings: {style: {alignItems: "center"}},
					elements: this._visibilityConfigurator.getButton().prepareLayout(),
					wrapperClass: 'crm-entity-widget-content-block-field-container-block'
				});
			this._visibilityUserFieldCheckbox.checked = this._visibilityConfigurator.isCustomized();
			this._visibilityConfigurator.setSwitchCheckBox(this._visibilityUserFieldCheckbox);
			this._visibilityConfigurator.setEnabled(this._visibilityUserFieldCheckbox.checked);
			this._visibilityConfigurator.adjust();
		}
		//endregion

		return this._optionWrapper;
	};
	//region AI fill policy state
	BX.Crm.EntityEditorUserFieldConfigurator.prototype.isAiFillPolicyAvailable = function()
	{
		if (this._field)
		{
			return BX.prop.getBoolean(this._aiFillPolicy, "available", false);
		}

		return this.isAiFillPolicySupportedForType(this.getAiFillPolicyTypeId());
	};
	BX.Crm.EntityEditorUserFieldConfigurator.prototype.getAiFillPolicyTypeId = function()
	{
		// a new datetime field with the time switched off is saved as a date one, the policy follows the saved type
		if (this._field === null && this._typeId === "datetime")
		{
			return (this._isTimeEnabledCheckBox && this._isTimeEnabledCheckBox.checked) ? "datetime" : "date";
		}

		return this._typeId;
	};
	BX.Crm.EntityEditorUserFieldConfigurator.prototype.adjustAiFillPolicyVisibility = function()
	{
		if (!this._aiFillPolicyContainer)
		{
			return;
		}

		if (this.isAiFillPolicyAvailable())
		{
			BX.show(this._aiFillPolicyContainer);
		}
		else
		{
			BX.hide(this._aiFillPolicyContainer);
		}
	};
	BX.Crm.EntityEditorUserFieldConfigurator.prototype.isAiFillPolicySupportedForType = function(typeId)
	{
		return BX.prop.getBoolean(this._aiFillPolicySettings, "available", false)
			&& BX.util.in_array(typeId, BX.prop.getArray(this._aiFillPolicySettings, "supportedTypes", []));
	};
	BX.Crm.EntityEditorUserFieldConfigurator.prototype.isAiFillPolicyChanged = function()
	{
		return this._aiFillPolicyCheckBox !== null
			&& this.isAiFillPolicyAvailable()
			&& this._aiFillPolicyCheckBox.checked !== this._aiFillPolicySavedState;
	};
	BX.Crm.EntityEditorUserFieldConfigurator.prototype.isAiFillPolicyEnabled = function()
	{
		return this._aiFillPolicyCheckBox
			? this._aiFillPolicyCheckBox.checked
			: this._aiFillPolicySavedState;
	};
	BX.Crm.EntityEditorUserFieldConfigurator.prototype.getSavedAiFillPolicyState = function()
	{
		return this._aiFillPolicySavedState;
	};
	BX.Crm.EntityEditorUserFieldConfigurator.prototype.setAiFillPolicyState = function(isEnabled)
	{
		this._aiFillPolicySavedState = isEnabled;
		if (this._aiFillPolicyCheckBox)
		{
			this._aiFillPolicyCheckBox.checked = isEnabled;
		}
	};
	BX.Crm.EntityEditorUserFieldConfigurator.prototype.setAiFillPolicyBusy = function(isBusy)
	{
		if (this._aiFillPolicyCheckBox)
		{
			this._aiFillPolicyCheckBox.disabled = isBusy;

			if (isBusy)
			{
				// "disabled" alone reads as "unavailable", so the reason for it is announced
				BX.UI.Accessibility.LiveAnnouncer.announce(
					this.getMessage("aiFillPolicySaving")
						.replace(/#OPTION#/gi, () => this.getMessage("aiFillPolicy")),
					"polite"
				);
			}
		}
	};
	BX.Crm.EntityEditorUserFieldConfigurator.prototype.onAiFillPolicySaveError = function(response)
	{
		if (this._aiFillPolicyCheckBox)
		{
			this._aiFillPolicyCheckBox.checked = this._aiFillPolicySavedState;
		}

		var errors = BX.prop.getArray(response, "errors", []);
		var message = errors.length > 0 ? BX.prop.getString(errors[0], "message", "") : "";
		if (message === "")
		{
			message = BX.message("UI_ENTITY_EDITOR_SAVE_ERROR_CONTENT");
		}

		BX.UI.Notification.Center.notify(
			{
				content: BX.util.htmlspecialchars(message),
				position: "top-center",
				autoHideDelay: 10000
			}
		);

		// the notification balloon has no live region, so the error and the reverted state are announced here
		BX.UI.Accessibility.LiveAnnouncer.announce(
			this.getMessage(
				this._aiFillPolicySavedState ? "aiFillPolicySaveErrorRevertOn" : "aiFillPolicySaveErrorRevertOff"
			)
				.replace(/#OPTION#/gi, () => this.getMessage("aiFillPolicy"))
				.replace(/#ERROR#/gi, () => message),
			"assertive"
		);
	};
	//endregion
	BX.Crm.EntityEditorUserFieldConfigurator.prototype.getMessage = function(name)
	{
		var m = BX.Crm.EntityEditorUserFieldConfigurator.messages;
		return (m.hasOwnProperty(name)
				? m[name]
				: name
		);
	};

	BX.Crm.EntityEditorUserFieldConfigurator.create = function(id, settings)
	{
		var self = new BX.Crm.EntityEditorUserFieldConfigurator();
		self.initialize(id, settings);
		return self;
	};
	BX.onCustomEvent(window, "BX.Crm.EntityEditorUserFieldConfigurator:onDefine");
}

if(typeof BX.Crm.EntityEditorUserFieldListItem === "undefined")
{
	/**
	 * @deprecated
	 */
	BX.Crm.EntityEditorUserFieldListItem = BX.UI.EntityEditorUserFieldListItem;
}

if(typeof BX.Crm.EntityEditorUserField === "undefined")
{
	/**
	 * @extends BX.UI.EntityEditorUserField
	 */
	BX.Crm.EntityEditorUserField = function()
	{
		BX.Crm.EntityEditorUserField.superclass.constructor.apply(this);
	};

	BX.extend(BX.Crm.EntityEditorUserField, BX.UI.EntityEditorUserField);
	BX.Crm.EntityEditorUserField.prototype.getMessage = function(name)
	{
		var m = BX.Crm.EntityEditorUserField.messages;
		return (m.hasOwnProperty(name)
				? m[name]
				: BX.Crm.EntityEditorUserField.superclass.getMessage.apply(this, arguments)
		);
	};
	BX.Crm.EntityEditorUserField.prototype.getOptions = function()
	{
		return this._schemeElement.getDataParam("options", {});
	};
	BX.Crm.EntityEditorUserField.prototype.doGetEditPriority = function()
	{
		return (BX.prop.get(BX.prop.getObject(this.getFieldInfo(), "SETTINGS"), "DEFAULT_VALUE")
				? BX.UI.EntityEditorPriority.high
				: BX.UI.EntityEditorPriority.normal
		);
	};
	BX.Crm.EntityEditorUserField.prototype.doClearLayout = function(options)
	{
		this._innerWrapper = null;
		this.removeExternalEventsHandlers();
	};
	BX.Crm.EntityEditorUserField.prototype.addExternalEventsHandlers = function()
	{
		this.removeExternalEventsHandlers();
		// Handler could be called by UF to trigger _changeHandler in complicated cases
		BX.addCustomEvent(window, "onCrmEntityEditorUserFieldExternalChanged", BX.proxy(this.userFieldExternalChangedHandler, this));
		BX.addCustomEvent(window, "onCrmEntityEditorUserFieldSetValidator", BX.proxy(this.userFieldSetValidatorHandler, this));
	};
	BX.Crm.EntityEditorUserField.prototype.removeExternalEventsHandlers = function()
	{
		BX.removeCustomEvent(window, "onCrmEntityEditorUserFieldExternalChanged", BX.proxy(this.userFieldExternalChangedHandler, this));
		BX.removeCustomEvent(window, "onCrmEntityEditorUserFieldSetValidator", BX.proxy(this.userFieldSetValidatorHandler, this));
	};
	BX.Crm.EntityEditorUserField.prototype.release = function()
	{
		this.removeExternalEventsHandlers();
	};
	//region Context Menu
	BX.Crm.EntityEditorUserField.prototype.processContextMenuCommand = function(e, command)
	{
		if(command === "moveAddrToRequisite")
		{
			this.showUfAddrConverterPopup();
		}

		BX.Crm.EntityEditorUserField.superclass.processContextMenuCommand.apply(this, [e, command]);
	};
	BX.Crm.EntityEditorUserField.prototype.showUfAddrConverterPopup = function()
	{
		var fieldInfo = this.getFieldInfo();

		var popupId = "crmUfAddrConvPopup_" + fieldInfo["ENTITY_ID"] + "_" +
			fieldInfo["ENTITY_VALUE_ID"] + "_" + fieldInfo["FIELD"];
		var popupContentHtml = this.getMessage("moveAddrToRequisiteHtml");
		var bindElement = window.body/*this.getWrapper()*/;
		var wrapperNode = this.getWrapper();

		var popup  = BX.Main.PopupManager.create(
			popupId,
			bindElement,
			{
				cacheable: false,
				closeIcon: true,
				offsetLeft: 15,
				lightShadow: true,
				overlay: true,
				titleBar: this.getMessage("moveAddrToRequisite"),
				draggable: true,
				/*autoHide: true,*/
				closeByEsc: true,
				/*bindOptions: { forceBindPosition: false },*/
				maxHeight: window.innerHeight - 50,
				width: wrapperNode.clientWidth/*width: bindElement.clientWidth*/,
				content: popupContentHtml,
				buttons: [
					new BX.UI.Button({
						text: this.getMessage("moveAddrToRequisiteBtnStart"),
						className: "ui-btn ui-btn-primary",
						events:
							{
								click: function()
								{
									popup.close();
									var responseHandler = function(response)
									{
										var status = BX.prop.getString(response, "status", "");
										var data = BX.prop.getObject(response, "data", {});
										var messages = [];
										var errors;
										var i;

										if (status === "error")
										{
											errors = BX.prop.getArray(response, "errors", []);
											for (i = 0; i < errors.length; i++)
											{
												messages.push(BX.prop.getString(errors[i], "message"));
											}
										}

										if (messages.length > 0)
										{
											BX.UI.Notification.Center.notify(
												{
													content: messages.join("<br>"),
													position: "top-center",
													autoHideDelay: 10000
												}
											);
										}
										else
										{
											this.hide();
											BX.UI.Notification.Center.notify(
												{
													content: this.getMessage("moveAddrToRequisiteStartSuccess"),
													position: "top-center",
													autoHideDelay: 10000
												}
											);
										}
									}.bind(this);
									BX.ajax.runAction(
										'crm.requisite.converter.ufAddressConvert',
										{
											data: {
												entityTypeId: fieldInfo["ENTITY_ID"],
												fieldName: fieldInfo["FIELD"]
											}
										}
									).then(responseHandler, responseHandler);
								}.bind(this)
							}
					}),
					new BX.UI.Button({
						text: this.getMessage("moveAddrToRequisiteBtnCancel"),
						className: "ui-btn ui-btn-link",
						events:
							{
								click: function()
								{
									popup.close();
								}.bind(this)
							}
					})
				]
			}
		);
		popup.show();
	};
	BX.Crm.EntityEditorUserField.prototype.prepareContextMenuItems = function()
	{
		var results = BX.Crm.EntityEditorUserField.superclass.prepareContextMenuItems.apply(this);

		var options = this.getOptions();
		if (BX.type.isPlainObject(options)
			&& options.hasOwnProperty("canActivateUfAddressConverter")
			&& options["canActivateUfAddressConverter"] === "Y")
		{
			results.push({ value: "moveAddrToRequisite", text: this.getMessage("moveAddrToRequisite") });
		}

		return results;
	};
	//endregion Context Menu
	BX.Crm.EntityEditorUserField.create = function(id, settings)
	{
		var self = new BX.Crm.EntityEditorUserField();
		self.initialize(id, settings);
		return self;
	};
	if(typeof(BX.Crm.EntityEditorUserField.messages) === "undefined")
	{
		BX.Crm.EntityEditorUserField.messages = {};
	}
}

//endregion

if(typeof(BX.Crm.UserFieldTypeMenu) === "undefined")
{
	/**
	 * @deprecated
	 */
	BX.Crm.UserFieldTypeMenu = BX.UI.UserFieldTypeMenu;
}

if(typeof(BX.Crm.UserFieldTypeMenuItem) === "undefined")
{
	/**
	 * @deprecated
	 */
	BX.Crm.UserFieldTypeMenuItem = BX.UI.UserFieldTypeMenuItem;
}

