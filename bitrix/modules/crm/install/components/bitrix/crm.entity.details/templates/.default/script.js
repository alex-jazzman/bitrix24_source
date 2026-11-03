BX.namespace("BX.Crm");

//region MANAGER
if(typeof BX.Crm.EntityDetailManager === "undefined")
{
	BX.Crm.EntityDetailManager = function()
	{
		this._id = "";
		this._settings = {};
		this._container = null;
		this._entityTypeId = 0;
		this._entityId = 0;
		this._serviceUrl = "";
		this._tabManager = null;
		this._overlay = null;
		this._externalEventHandler = null;
		this._externalRequestData = null;
	};
	BX.Crm.EntityDetailManager.prototype =
	{
		initialize: function(id, settings)
		{
			this._id = BX.type.isNotEmptyString(id) ? id : BX.util.getRandomString(4);
			this._settings = settings ? settings : {};

			this._entityTypeId = BX.prop.getInteger(this._settings, "entityTypeId", 0);
			this._entityId = BX.prop.getInteger(this._settings, "entityId", 0);

			this._serviceUrl = BX.prop.getString(this._settings, "serviceUrl", "");

			this._container = BX(BX.prop.get(this._settings, "containerId"));

			this._tabManager = BX.Crm.EntityDetailTabManager.create(
				this._id,
				{
					container: BX(BX.prop.get(this._settings, "tabContainerId")),
					menuId: BX.prop.get(this._settings, "tabMenuContainerId"),
					data: BX.prop.getArray(this._settings, "tabs")
				}
			);

			if(this._entityId <= 0)
			{
				this._overlay = BX.create("div", { attrs: { className: "crm-entity-overlay" } });
				this._container.appendChild(this._overlay);

				if(window === window.top)
				{
					this._overlay.style.position = "absolute";
					this._overlay.style.top = this._overlay.style.left = this._overlay.style.right = "-15px";
				}
			}

			BX.addCustomEvent(window, "OpenEntityDetailTab", BX.delegate(this.onTabOpenRequest, this));
			this._externalRequestData = {};

			this._externalEventHandler = BX.delegate(this.onExternalEvent, this);
			BX.addCustomEvent(window, "onLocalStorageSet", this._externalEventHandler);
			BX.addCustomEvent(window, "BX.Crm.EntityEditor:onFailedValidation", this.onFailedValidation.bind(this));
			BX.addCustomEvent("onPullEvent-crm", this.onPullEventHandlerCrm.bind(this));

			this.doInitialize();
		},
		doInitialize: function()
		{
		},
		getId: function()
		{
			return this._id;
		},
		getMessage: function(name)
		{
			return BX.prop.getString(BX.Crm.EntityDetailManager.messages, name, name);
		},
		getEntityTypeId: function()
		{
			return this._entityTypeId;
		},
		getEntityTypeName: function()
		{
			return BX.CrmEntityType.resolveName(this._entityTypeId);
		},
		getEntityId: function()
		{
			return this._entityId;
		},
		getEntityListUrl: function(entityTypeName)
		{
			return BX.prop.getString(
				BX.Crm.EntityDetailManager.entityListUrls,
				entityTypeName,
				""
			);
		},
		getEntityCreateUrl: function(entityTypeName)
		{
			return BX.CrmEntityManager.getCurrent().getEntityCreateUrl(entityTypeName);
		},
		getTabManager: function()
		{
			return this._tabManager;
		},
		prepareCreationUrlParams: function(urlParams)
		{
		},
		onTabOpenRequest: function(tabName)
		{
			var item = this._tabManager.findItemById(tabName);
			if(item)
			{
				this._tabManager.selectItem(item);
			}
		},
		isTabButtonVisible: function(tabName)
		{
			const item = this._tabManager.findItemById(tabName);
			if (item)
			{
				return this._tabManager.isVisibleItemMenu(item);
			}

			return false;
		},
		getTabMenuItemContainer: function(tabName)
		{
			const item = this._tabManager.findItemById(tabName);
			if (item)
			{
				return item.getMenuContainer();
			}

			return null;
		},
		getTabFromMoreMenu: function(tabName)
		{
			const moreMenu = this._tabManager.getMoreMenu();
			if (moreMenu)
			{
				const menuItem = moreMenu.getMenuItem(tabName);
				const menuItemContainer = menuItem && menuItem.getContainer();
				if (BX.Type.isDomNode(menuItemContainer))
				{
					return menuItemContainer;
				}
			}

			return null;
		},
		processDetachOpenLine: function()
		{
			this._detetionConfirmDlgId = "entity_details_detach_open_line_confirm";
			const dlg =
				BX.Crm.ConfirmationDialog.get(this._detetionConfirmDlgId)
				?? BX.Crm.ConfirmationDialog.create(
					this._detetionConfirmDlgId,
					{
						title: this.getMessage('detachOpenLineDialogTitle'),
						content: this.getMessage('detachOpenLineDialogContent'),
						acceptButtonTitle: this.getMessage('detachContinueButton'),
						cancelButtonTitle: this.getMessage('detachCancelButton'),
					},
				);

			dlg.open().then(BX.delegate(this.onDetachOpenLineConfirm, this));
		},
		detachOpenLine: function()
		{
			if (this._serviceUrl === "")
			{
				throw "Crm.EntityDetailManager: The 'serviceUrl' parameter is not defined or empty.";
			}

			BX.ajax(
				{
					url: this._serviceUrl,
					method: "POST",
					dataType: "json",
					data:
						{
							"ACTION": "DETACH_OPEN_LINE",
							"ACTION_ENTITY_ID": this._entityId
						},
					onsuccess: BX.delegate(this.onDetachOpenLineSuccess, this)
				}
			);
		},
		processRemoval: function()
		{
			this._detetionConfirmDlgId = "entity_details_deletion_confirm";
			var dlg = BX.Crm.ConfirmationDialog.get(this._detetionConfirmDlgId);
			if(!dlg)
			{
				dlg = BX.Crm.ConfirmationDialog.create(
					this._detetionConfirmDlgId,
					{
						title: this.getMessage("deletionDialogTitle"),
						content: this.getMessage("deletionConfirmDialogContent")
					}
				);
			}
			dlg.open().then(BX.delegate(this.onRemovalConfirm, this));
		},
		remove: function()
		{
			if(this._serviceUrl === "")
			{
				throw "Crm.EntityDetailManager: The 'serviceUrl' parameter is not defined or empty.";
			}

			BX.ajax(
				{
					url: this._serviceUrl,
					method: "POST",
					dataType: "json",
					data:
					{
						"ACTION": "DELETE",
						"ACTION_ENTITY_TYPE_ID": this._entityTypeId,
						"ACTION_ENTITY_ID": this._entityId
					},
					onsuccess: BX.delegate(this.onRemovalRequestSuccess, this)
				}
			);
		},
		exclude: function ()
		{
			if(this._serviceUrl === "")
			{
				throw "Crm.EntityDetailManager: The 'serviceUrl' parameter is not defined or empty.";
			}

			BX.ajax(
				{
					url: this._serviceUrl,
					method: "POST",
					dataType: "json",
					data:
						{
							"ACTION": "EXCLUDE",
							"ACTION_ENTITY_TYPE_ID": this._entityTypeId,
							"ACTION_ENTITY_ID": this._entityId
						},
					onsuccess: BX.delegate(this.onExclusionRequestSuccess, this)
				}
			);
		},
		processExclusion: function()
		{
			this._exclusionConfirmDlgId = "entity_details_exclusion_confirm";
			var dlg = BX.Crm.ConfirmationDialog.get(this._exclusionConfirmDlgId);
			if(!dlg)
			{
				dlg = BX.Crm.ConfirmationDialog.create(
					this._exclusionConfirmDlgId,
					{
						title: this.getMessage("exclusionDialogTitle"),
						content: this.getMessage("exclusionConfirmDialogContent")
							+ ' <a href="javascript: top.BX.Helper.show(\'redirect=detail&code=7362845\');">'
							+ this.getMessage("exclusionConfirmDialogContentHelp")
							+ '</a>'
					}
				);
			}
			dlg.open().then(BX.delegate(this.onExclusionConfirm, this));
		},
		createEntity: function(entityTypeName, options)
		{
			var context = ("details_" + this.getEntityTypeName() + "_" + this.getEntityId() + "_" + BX.util.getRandomString(12)).toLowerCase();
			var urlParams = { external_context: context };
			this.prepareCreationUrlParams(urlParams);

			if (options)
			{
				var additionalUrlParams = BX.prop.getObject(options, "urlParams", null);
				if(additionalUrlParams)
				{
					urlParams = BX.mergeEx(urlParams, additionalUrlParams);
				}
			}

			BX.CrmEntityManager.createEntity(
				entityTypeName,
				{ urlParams: urlParams }
				).then(
					function(result)
					{
						this._externalRequestData[context] = { context: context, wnd: BX.prop.get(result, "wnd", null) };
					}.bind(this)
				);
		},
		createQuote: function(options)
		{
			this.createEntity(BX.CrmEntityType.names.quote, options);
		},
		createOrder: function()
		{
			this.createEntity(BX.CrmEntityType.names.order);
		},
		createInvoice: function()
		{
			this.createEntity(BX.CrmEntityType.names.invoice);
		},
		createDeal: function(options)
		{
			this.createEntity(BX.CrmEntityType.names.deal, options);
		},
		onRemovalConfirm: function(result)
		{
			if(BX.prop.getBoolean(result, "cancel", true))
			{
				return;
			}

			this.remove();
		},
		onDetachOpenLineConfirm: function(result)
		{
			if (BX.prop.getBoolean(result, "cancel", true))
			{
				return;
			}

			this.detachOpenLine();
		},
		extractUrlParamsFromEvent: function(callback)
		{
			return function(options)
			{
				if (options && options.data && options.data.urlParams)
				{
					options.urlParams = {
						...options.urlParams,
						...options.data.urlParams
					};
				}

				callback(options);
			};
		},
		onDetachOpenLineSuccess: function(result)
		{
			const isSuccess = BX.prop.getBoolean(result, "IS_SUCCESS", false);
			if (!isSuccess)
			{
				const error = BX.prop.getString(result, "ERROR", "") ?? 'error';

				BX.UI.Notification.Center.notify({
					content: error,
					position: 'top-right',
					autoHideDelay: 5000,
				});
			}
			else
			{
				window.location.reload()
				window.top.BX.UI.Notification.Center.notify({
					content: this.getMessage("detachOpenLineSuccess"),
					position: 'top-right',
					autoHideDelay: 5000,
				});
			}
		},
		onRemovalRequestSuccess: function(result)
		{
			var error = BX.prop.getString(result, "ERROR", "");
			if(error !== "")
			{
				var dlg = BX.Crm.NotificationDialog.create(
					"entity_details_deletion_error",
					{
						title: this.getMessage("deletionDialogTitle"),
						content: error
					}
				);
				dlg.open();
				return;
			}

			window.top.BX.UI.Notification.Center.notify(
				{
					autoHideDelay: 5000,
					content: this.getMessage("deletionWarning"),
					actions:
					[
						{
							title: this.getMessage("goToDetails"),
							events:
								{
									click:
										function(event, balloon, action)
										{
											balloon.close();

											//HACK: Try to get parent window from event for this window may be already deleted.
											var targetWindow = event.target.ownerDocument.defaultView;
											if(!targetWindow)
											{
												targetWindow = window;
											}

											if(targetWindow.BX.Helper)
											{
												targetWindow.BX.Helper.show("redirect=detail&code=8969825");
											}
										}
								}
						}
					]
				}
			);

			var current = BX.Crm.Page.getTopSlider();

			var eventParams = null;
			if(current)
			{
				eventParams = { "sliderUrl": current.getUrl() };
			}

			BX.Crm.EntityEvent.fireDelete(this._entityTypeId, this._entityId, "", eventParams);

			eventParams['id'] = this._entityId;
			BX.onCustomEvent(window, BX.Crm.EntityEvent.names.delete, [eventParams]);

			if(current)
			{
				window.setTimeout(function() { current.close(true); }, 100);
			}
			else
			{
				var listUrl = this.getEntityListUrl(BX.CrmEntityType.resolveName(this._entityTypeId));
				if(listUrl !== "")
				{
					window.location.href = listUrl;
				}
			}
		},
		onExclusionConfirm: function(result)
		{
			if(BX.prop.getBoolean(result, "cancel", true))
			{
				return;
			}

			this.exclude();
		},
		onExclusionRequestSuccess: function(result)
		{
			var error = BX.prop.getString(result, "ERROR", "");
			if(error !== "")
			{
				var dlg = BX.Crm.NotificationDialog.create(
					"entity_details_exclusion_error",
					{
						title: this.getMessage("exclusionDialogTitle"),
						content: error
					}
				);
				dlg.open();
				return;
			}

			var current = BX.Crm.Page.getTopSlider();

			var eventParams = null;
			if(current)
			{
				eventParams = { "sliderUrl": current.getUrl() };
			}

			BX.Crm.EntityEvent.fireDelete(this._entityTypeId, this._entityId, "", eventParams);

			eventParams['id'] = this._entityId;
			BX.onCustomEvent(window, BX.Crm.EntityEvent.names.delete, [eventParams]);

			if(current)
			{
				window.setTimeout(function() { current.close(true); }, 100);
			}
			else
			{
				var listUrl = this.getEntityListUrl(BX.CrmEntityType.resolveName(this._entityTypeId));
				if(listUrl !== "")
				{
					window.location.href = listUrl;
				}
			}
		},
		onExternalEvent: function(params)
		{
			var key = BX.prop.getString(params, "key", "");
			var data = BX.prop.getObject(params, "value", {});

			this.processExternalEvent(key, data);

			if(key === BX.Crm.EntityEvent.names.invalidate)
			{
				var entityId = BX.prop.getInteger(data, "entityId", 0);
				var entityTypeId = BX.prop.getInteger(data, "entityTypeId", 0);
				if(entityTypeId === this.getEntityTypeId() && entityId === this.getEntityId())
				{
					window.location.reload(true);
				}
				return;
			}

			if(key !== "onCrmEntityCreate")
			{
				return;
			}

			var context = BX.prop.getString(data, "context", "");
			var requestData = BX.prop.getObject(this._externalRequestData, context, null);
			if(!requestData)
			{
				return;
			}

			delete this._externalRequestData[context];

			var wnd = BX.prop.get(requestData, "wnd", null);
			if(wnd)
			{
				wnd.close();
			}
		},
		processExternalEvent: function(key, data)
		{
			return false;
		},
		/**
		 * @deprecated
		 */
		prepareAnalyticParams: function(action, contextParams)
		{
			return null;
		},
		onFailedValidation: function(sender, eventArgs)
		{
			if (
				typeof BX.Crm.EntityEditor === "undefined"
				|| !(sender instanceof BX.Crm.EntityEditor)
				|| sender.getEntityId() !== this.getEntityId()
			)
			{
				return;
			}

			var main = this._tabManager._items[0];
			if (main instanceof BX.Crm.EntityDetailTab && !main.isActive())
			{
				main.setActive(true);

				for(var i = 1, length = this._tabManager._items.length; i < length; i++)
				{
					var currentItem = this._tabManager._items[i];
					currentItem.setActive(false);
				}

				var field = eventArgs.getTopmostField();
				if(field)
				{
					setTimeout(function(){field.focus()}, 350);
				}
			}
		},
		onPullEventHandlerCrm: function(command, params)
		{
			const deleteItemTag = `ITEMUPDATED_${this.getEntityTypeName()}_${this.getEntityId()}`;
			if (
				deleteItemTag.toUpperCase() === command.toUpperCase()
				&& params.eventName.toUpperCase() === 'ITEMDELETED'
			)
			{
				window.setTimeout(() => window.location.reload(), 10);
			}
		},
	};
	BX.Crm.EntityDetailManager.items = {};
	BX.Crm.EntityDetailManager.get = function(id)
	{
		return (BX.type.isNotEmptyString(id) && this.items.hasOwnProperty(id)) ? this.items[id] : null;
	};

	if(typeof(BX.Crm.EntityDetailManager.entityListUrls) === "undefined")
	{
		BX.Crm.EntityDetailManager.entityListUrls = {};
	}

	if(typeof(BX.Crm.EntityDetailManager.messages) === "undefined")
	{
		BX.Crm.EntityDetailManager.messages = {};
	}
	BX.Crm.EntityDetailManager.create = function(id, settings)
	{
		var self = new BX.Crm.EntityDetailManager();
		self.initialize(id, settings);
		this.items[self.getId()] = self;
		return self;
	}
}
//endregion

//region LEAD MANAGER
if(typeof BX.Crm.LeadDetailManager === "undefined")
{
	BX.Crm.LeadDetailManager = function()
	{
		BX.Crm.LeadDetailManager.superclass.constructor.apply(this);
	};
	BX.extend(BX.Crm.LeadDetailManager, BX.Crm.EntityDetailManager);
	BX.Crm.LeadDetailManager.prototype.doInitialize = function()
	{
		BX.addCustomEvent(window, "Crm.EntityConverter.Converted", BX.delegate(this.onConversionComplete, this));
		BX.addCustomEvent(window, "Crm.EntityProgress.Saved", BX.delegate(this.onProgressSave, this));
		BX.addCustomEvent(window, "CrmCreateQuoteFromLead", this.extractUrlParamsFromEvent(this.createQuote.bind(this)).bind(this));
		BX.addCustomEvent(window, "CrmCreateOrderFromLead", BX.delegate(this.onCreateOrder, this));
	};
	BX.Crm.LeadDetailManager.prototype.processConversionCompletion = function(eventArgs)
	{
		if(window.top !== window)
		{
			//Slider mode
			window.setTimeout(function(){ window.location.reload(true); }, 0);
			return;
		}

		//Page mode
		var redirectUrl = BX.prop.getString(eventArgs, "redirectUrl", "");
		if(redirectUrl !== "" && !BX.prop.getBoolean(eventArgs, "isRedirected", false))
		{
			window.setTimeout(
				function(){ window.location.replace(redirectUrl); },
				0
			);
			eventArgs["isRedirected"] = true;
		}
	};
	BX.Crm.LeadDetailManager.prototype.processStatusSave = function(eventArgs)
	{
		var current = BX.prop.getString(eventArgs, "currentSemantics", "");
		var previous = BX.prop.getString(eventArgs, "previousSemantics", "");

		if(previous === current)
		{
			return;
		}

		if(previous === "success" || current === "success")
		{
			window.setTimeout(function(){ window.location.reload(true); }, 0);
		}
	};
	BX.Crm.LeadDetailManager.prototype.processExternalEvent = function(name, eventArgs)
	{
		if(name !== "onCrmEntityConvert")
		{
			return false;
		}

		if(BX.prop.getInteger(eventArgs, "entityTypeId", 0) !== BX.CrmEntityType.enumeration.lead
			|| BX.prop.getInteger(eventArgs, "entityId", 0) !== this.getEntityId()
		)
		{
			return false;
		}

		this.processConversionCompletion(eventArgs);
		return true;
	};
	BX.Crm.LeadDetailManager.prototype.onConversionComplete = function(sender, eventArgs)
	{
		if(BX.prop.getInteger(eventArgs, "entityTypeId", 0) !== BX.CrmEntityType.enumeration.lead
			|| BX.prop.getInteger(eventArgs, "entityId", 0) !== this.getEntityId()
		)
		{
			return;
		}

		this.processConversionCompletion(eventArgs);
	};
	BX.Crm.LeadDetailManager.prototype.onProgressSave = function(sender, eventArgs)
	{
		if(BX.prop.getInteger(eventArgs, "entityTypeId", 0) !== BX.CrmEntityType.enumeration.lead
			|| BX.prop.getInteger(eventArgs, "entityId", 0) !== this.getEntityId()
		)
		{
			return;
		}

		this.processStatusSave(eventArgs);

	};
	BX.Crm.LeadDetailManager.prototype.onCreateQuote = function(option)
	{
		this.createQuote(option);
	};
	BX.Crm.LeadDetailManager.prototype.onCreateOrder = function()
	{
		this.createOrder();
	};
	BX.Crm.LeadDetailManager.prototype.prepareCreationUrlParams = function(urlParams)
	{
		urlParams["lead_id"] = this.getEntityId();
	};
	BX.Crm.LeadDetailManager.create = function(id, settings)
	{
		var self = new BX.Crm.LeadDetailManager();
		self.initialize(id, settings);
		BX.Crm.EntityDetailManager.items[self.getId()] = self;
		return self;
	}
}
//endregion

//region CONTACT MANAGER
if(typeof BX.Crm.ContactDetailManager === "undefined")
{
	BX.Crm.ContactDetailManager = function()
	{
		BX.Crm.ContactDetailManager.superclass.constructor.apply(this);
	};
	BX.extend(BX.Crm.ContactDetailManager, BX.Crm.EntityDetailManager);
	BX.Crm.ContactDetailManager.prototype.doInitialize = function()
	{
		BX.addCustomEvent(window, "CrmCreateQuoteFromContact", this.extractUrlParamsFromEvent(this.createQuote.bind(this)).bind(this));
		BX.addCustomEvent(window, "CrmCreateInvoiceFromContact", BX.delegate(this.onCreateInvoice, this));
		BX.addCustomEvent(window, "CrmCreateDealFromContact", this.extractUrlParamsFromEvent(this.createDeal.bind(this)).bind(this));
		BX.addCustomEvent(window, "CrmCreateOrderFromContact", BX.delegate(this.onCreateOrder, this));
	};
	BX.Crm.ContactDetailManager.prototype.onCreateQuote = function(options)
	{
		this.createQuote(options);
	};
	BX.Crm.ContactDetailManager.prototype.onCreateOrder = function()
	{
		this.createOrder();
	};
	BX.Crm.ContactDetailManager.prototype.onCreateInvoice = function()
	{
		this.createInvoice();
	};
	BX.Crm.ContactDetailManager.prototype.onCreateDeal = function(options)
	{
		this.createDeal(options);
	};
	BX.Crm.ContactDetailManager.prototype.prepareCreationUrlParams = function(urlParams)
	{
		urlParams["contact_id"] = this.getEntityId();
	};
	BX.Crm.ContactDetailManager.create = function(id, settings)
	{
		var self = new BX.Crm.ContactDetailManager();
		self.initialize(id, settings);
		BX.Crm.EntityDetailManager.items[self.getId()] = self;
		return self;
	}
}
//endregion

//region COMPANY MANAGER
if(typeof BX.Crm.CompanyDetailManager === "undefined")
{
	BX.Crm.CompanyDetailManager = function()
	{
		BX.Crm.CompanyDetailManager.superclass.constructor.apply(this);
	};
	BX.extend(BX.Crm.CompanyDetailManager, BX.Crm.EntityDetailManager);
	BX.Crm.CompanyDetailManager.prototype.doInitialize = function()
	{
		BX.addCustomEvent(window, "CrmCreateQuoteFromCompany", this.extractUrlParamsFromEvent(this.createQuote.bind(this)).bind(this));
		BX.addCustomEvent(window, "CrmCreateInvoiceFromCompany", BX.delegate(this.onCreateInvoice, this));
		BX.addCustomEvent(window, "CrmCreateDealFromCompany", this.extractUrlParamsFromEvent(this.createDeal.bind(this)).bind(this));
		BX.addCustomEvent(window, "CrmCreateOrderFromCompany", BX.delegate(this.onCreateOrder, this));
	};
	BX.Crm.CompanyDetailManager.prototype.onCreateQuote = function(options)
	{
		this.createQuote(options);
	};
	BX.Crm.CompanyDetailManager.prototype.onCreateOrder = function()
	{
		this.createOrder();
	};
	BX.Crm.CompanyDetailManager.prototype.onCreateInvoice = function()
	{
		this.createInvoice();
	};
	BX.Crm.CompanyDetailManager.prototype.onCreateDeal = function(options)
	{
		this.createDeal(options);
	};
	BX.Crm.CompanyDetailManager.prototype.prepareCreationUrlParams = function(urlParams)
	{
		urlParams["company_id"] = this.getEntityId();
	};
	BX.Crm.CompanyDetailManager.create = function(id, settings)
	{
		var self = new BX.Crm.CompanyDetailManager();
		self.initialize(id, settings);
		BX.Crm.EntityDetailManager.items[self.getId()] = self;
		return self;
	}
}
//endregion

//region DEAL RECURRING MANAGER
if(typeof BX.Crm.DealRecurringDetailManager === "undefined")
{
	BX.Crm.DealRecurringDetailManager = function()
	{
		BX.Crm.DealRecurringDetailManager.superclass.constructor.apply(this);
	};
	BX.extend(BX.Crm.DealRecurringDetailManager, BX.Crm.EntityDetailManager);

	BX.Crm.DealRecurringDetailManager.prototype.doInitialize = function()
	{
		BX.addCustomEvent(window, "CrmDealRecurringExpose", BX.delegate(this.onExposeDeal, this));
	};
	BX.Crm.DealRecurringDetailManager.prototype.onExposeDeal = function(sender, eventArgs)
	{
		if(BX.prop.getInteger(eventArgs, "entityTypeId", 0) !== BX.CrmEntityType.enumeration.dealrecurring
			|| BX.prop.getInteger(eventArgs, "entityId", 0) !== this.getEntityId()
		)
		{
			return;
		}

		window.setTimeout(function(){ window.location.reload(true); }, 0);
	};
	BX.Crm.DealRecurringDetailManager.create = function(id, settings)
	{
		var self = new BX.Crm.DealRecurringDetailManager();
		self.initialize(id, settings);
		BX.Crm.EntityDetailManager.items[self.getId()] = self;
		return self;
	}
}
//endregion

//region DEAL MANAGER
if(typeof BX.Crm.DealDetailManager === "undefined")
{
	BX.Crm.DealDetailManager = function()
	{
		BX.Crm.DealDetailManager.superclass.constructor.apply(this);
	};
	BX.extend(BX.Crm.DealDetailManager, BX.Crm.EntityDetailManager);
	BX.Crm.DealDetailManager.prototype.doInitialize = function()
	{
		//Managed by DealConverter
		//BX.addCustomEvent(window, "CrmCreateQuoteFromDeal", BX.delegate(this.onCreateQuote, this));
	};
	BX.Crm.DealDetailManager.prototype.prepareCreationUrlParams = function(urlParams)
	{
		urlParams["deal_id"] = this.getEntityId();
	};
	BX.Crm.DealDetailManager.create = function(id, settings)
	{
		var self = new BX.Crm.DealDetailManager();
		self.initialize(id, settings);
		BX.Crm.EntityDetailManager.items[self.getId()] = self;
		return self;
	}
}
//endregion
//region ORDER MANAGER
if(typeof BX.Crm.OrderDetailManager === "undefined")
{
	BX.Crm.OrderDetailManager = function()
	{
		BX.Crm.OrderDetailManager.superclass.constructor.apply(this);
	};

	BX.extend(BX.Crm.OrderDetailManager, BX.Crm.EntityDetailManager);

	BX.Crm.OrderDetailManager.prototype.doInitialize = function()
	{
		BX.addCustomEvent(window, "Crm.EntityProgress.Saved", BX.delegate(this.onProgressSave, this));
		BX.addCustomEvent(window, "Crm.EntityProgress.onSaveBefore", BX.delegate(this.onProgressSaveBefore, this));
		this.subscribeToProductRowSummaryEvents();
		this._isProductListFocusing = false;
		this._cancelReason = "";
	};
	BX.Crm.OrderDetailManager.prototype.onProgressSave = function(sender, eventArgs)
	{
		if(BX.prop.getInteger(eventArgs, "entityTypeId", 0) !== BX.CrmEntityType.enumeration.order
			|| BX.prop.getInteger(eventArgs, "entityId", 0) !== this.getEntityId()
		)
		{
			return;
		}

		var requestData = BX.prop.getObject(eventArgs, "requestData", {});
		var error = BX.prop.getString(requestData, "ERROR", "");
		if (BX.type.isNotEmptyString(error))
		{
			var step = sender.getStepById(BX.prop.getString(requestData, "STATUS_ID", ""));
			if(step)
			{
				var stepIndex = sender.findStepInfoIndex(step.getId());
				if(stepIndex >= 0)
				{
					var stepInfo = sender._stepInfos[stepIndex];
					sender.adjustSteps(step.getIndex(), step.getBackgroundColor());
					sender.setCurrentStep(stepInfo);
				}
			}

			var dlg = BX.Crm.NotificationDialog.create(
				"entity_details_cancel_error",
				{
					title: BX.prop.getString(requestData, "ERROR_TITLE", ""),
					content: error
				}
			);
			dlg.open();
		}
	};
	BX.Crm.OrderDetailManager.prototype.onProgressSaveBefore = function(sender, eventArgs)
	{
		if(BX.prop.getString(eventArgs, "TYPE", "") !== BX.CrmEntityType.names.order
			|| BX.prop.getInteger(eventArgs, "ID", 0) !== this.getEntityId()
		)
		{
			return;
		}

		var self = BX.CrmOrderStatusManager.current;

		if (BX.type.isPlainObject(self.saveParams))
		{
			var entityId = this.getEntityId();

			for (var name in self.saveParams)
			{
				BX.CrmOrderStatusManager.statusInfoValues[entityId][name] = self.saveParams[name];
				eventArgs[name] = self.saveParams[name];
			}
		}

		eventArgs['STATE_SUCCESS'] = self.isSuccess ? "Y" : "N";
	};

	BX.Crm.OrderDetailManager.prototype.subscribeToProductRowSummaryEvents = function()
	{
		BX.addCustomEvent(window, "BX.UI.EntityEditorProductRowSummary:onDetailProductListLinkClick", () => {
			BX.onCustomEvent(window, "OpenEntityDetailTab", ['tab_products']);
		});

		const onFirstProductListFocusHandler = () => {
			const onProductListInitHandler = () => {
				BX.onCustomEvent(window, "onFocusToProductList");
			}
			BX.addCustomEvent(window, "crmOrderProductListInit", onProductListInitHandler);
			onProductListFocusHandler();
			const onAfterFocusHandler = () => {
				BX.removeCustomEvent("BX.UI.EntityEditorProductRowSummary:onAddNewRowInProductList", onFirstProductListFocusHandler);
				BX.addCustomEvent(window, "BX.UI.EntityEditorProductRowSummary:onAddNewRowInProductList", onProductListFocusHandler);

				BX.removeCustomEvent("crmOrderProductListInit", onProductListInitHandler);
				BX.removeCustomEvent("crmOrderProductListFocused", onAfterFocusHandler);
			}
			BX.addCustomEvent(window, "crmOrderProductListFocused", onAfterFocusHandler);
		};
		BX.addCustomEvent(window, "BX.UI.EntityEditorProductRowSummary:onAddNewRowInProductList", onFirstProductListFocusHandler);

		const onProductListFocusHandler = () => {
			if (this._isProductListFocusing)
			{
				return;
			}
			else
			{
				this._isProductListFocusing = true;
			}

			BX.onCustomEvent(window, "OpenEntityDetailTab", ['tab_products']);
			setTimeout(() => {
				BX.onCustomEvent(window, 'onFocusToProductList');
			}, 200);
		}

		BX.addCustomEvent(window, "crmOrderProductListFocused", () => {
			this._isProductListFocusing = false;
		});
	};

	BX.Crm.OrderDetailManager.prototype.getMessage = function(name)
	{
		var m = BX.Crm.OrderDetailManager.messages;
		return (m.hasOwnProperty(name)
				? m[name]
				: BX.Crm.OrderDetailManager.superclass.getMessage.apply(this, arguments)
		);
	};
	BX.Crm.OrderDetailManager.create = function(id, settings)
	{
		var self = new BX.Crm.OrderDetailManager();
		self.initialize(id, settings);
		BX.Crm.EntityDetailManager.items[self.getId()] = self;
		return self;
	}
}
//endregion
//region FACTORY
if(typeof BX.Crm.EntityDetailFactory === "undefined")
{
	BX.Crm.EntityDetailFactory =
	{
		create: function(id, settings)
		{
			var entityTypeId = BX.prop.getInteger(settings, "entityTypeId", BX.CrmEntityType.enumeration.undefined);
			if(entityTypeId === BX.CrmEntityType.enumeration.lead)
			{
				return BX.Crm.LeadDetailManager.create(id, settings);
			}
			else if(entityTypeId === BX.CrmEntityType.enumeration.dealrecurring)
			{
				return BX.Crm.DealRecurringDetailManager.create(id, settings);
			}
			else if(entityTypeId === BX.CrmEntityType.enumeration.deal)
			{
				return BX.Crm.DealDetailManager.create(id, settings);
			}
			else if(entityTypeId === BX.CrmEntityType.enumeration.contact)
			{
				return BX.Crm.ContactDetailManager.create(id, settings);
			}
			else if(entityTypeId === BX.CrmEntityType.enumeration.company)
			{
				return BX.Crm.CompanyDetailManager.create(id, settings);
			}
			else if(entityTypeId === BX.CrmEntityType.enumeration.order)
			{
				return BX.Crm.OrderDetailManager.create(id, settings);
			}

			return BX.Crm.EntityDetailManager.create(id, settings);
		}
	}
}
//endregion

//region TAB MANAGER
if(typeof BX.Crm.EntityDetailTabManager === "undefined")
{
	BX.Crm.EntityDetailTabManager = function()
	{
		this._id = "";
		this._container = null;
		this._items = null;
		this._menuManager = null;
	};
	BX.Crm.EntityDetailTabManager.prototype =
	{
		initialize: function(id, settings)
		{
			this._id = BX.type.isNotEmptyString(id) ? id : BX.util.getRandomString(4);
			settings = settings ? settings : {};

			this._container = BX.prop.getElementNode(settings, "container");

			var tabsById = {};
			BX.prop.getArray(settings, "data").forEach(function(itemData) {
				if (!tabsById[itemData['id']])
				{
					tabsById[itemData['id']] = itemData;
				}
			}.bind(this));

			this._menuManager = BX.Main.interfaceButtonsManager.getById(
				BX.prop.getString(settings, "menuId")
			);
			var firstItem = null;
			this._items = [];
			this._menuManager.getAllItems().forEach(function(item) {
				if (firstItem === null)
				{
					firstItem = item;
				}

				var itemData = tabsById[item.dataset.id];
				if (!itemData)
				{
					return;
				}

				this._items.push(BX.Crm.EntityDetailTab.create(
					itemData['id'],
					{
						manager: this,
						data: itemData,
						container: this._container.querySelector('[data-tab-id="' + itemData['id'] + '"]'),
						menuContainer: item
					}
				))
			}.bind(this));

			var activeItem = this._menuManager.getActive();
			if (activeItem['DATA_ID'] === 'main' && firstItem.dataset.id !== activeItem['DATA_ID'])
			{
				const firstItemData = this._menuManager.getItemData(firstItem);
				const script = firstItemData['ON_CLICK'];
				if (BX.type.isNotEmptyString(script))
				{
					eval(script);
				}
			}
		},
		getId: function()
		{
			return this._id;
		},
		findItemById: function(id)
		{
			for(var i = 0, length = this._items.length; i < length; i++)
			{
				var currentItem = this._items[i];
				if(currentItem.getId() === id)
				{
					return currentItem;
				}
			}
			return null;
		},
		selectItem: function(item)
		{
			// hack to recover scroll due to Chrome compositor cache bug:
			this._container.style.minHeight = '';
			var contentHeight = this._container.offsetHeight;
			if (!this._maxContentHeight || contentHeight > this._maxContentHeight)
			{
				this._maxContentHeight = contentHeight;
			}
			this._container.style.minHeight = this._maxContentHeight + 'px';

			for(var i = 0, length = this._items.length; i < length; i++)
			{
				var currentItem = this._items[i];
				currentItem.setActive(currentItem === item);
			}
		},
		processItemSelect: function(item)
		{
			this.selectItem(item);
		},
		isVisibleItemMenu: function(item)
		{
			const itemMenuContainer = item.getMenuContainer();
			if (itemMenuContainer)
			{
				return !this._menuManager.isDisabled(itemMenuContainer)
					&& this._menuManager.isVisibleItem(itemMenuContainer);
			}
			return false;
		},
		getTabMenuContainer: function()
		{
			return this._menuManager.itemsContainer;
		},
		getMoreButton: function()
		{
			return this._menuManager.getMoreButton();
		},
		getMoreMenu: function()
		{
			const moreMenu = this._menuManager.getMoreMenu();

			return moreMenu ? moreMenu : null;
		}
	};
	BX.Crm.EntityDetailTabManager.items = {};
	BX.Crm.EntityDetailTabManager.create = function(id, settings)
	{
		var self = new BX.Crm.EntityDetailTabManager();
		self.initialize(id, settings);
		this.items[self.getId()] = self;
		return self;
	}
}
//endregion

//region TAB
if(typeof BX.Crm.EntityDetailTab === "undefined")
{
	BX.Crm.EntityDetailTab = function()
	{
		this._id = "";
		this._data = {};
		this._manager = null;
		this._container = null;
		this._menuContainer = null;
		this.onMenuClick = this.onMenuClick.bind(this);

		this._isActive = false;
		this._isEnabled = false;
		this._loader = null;
	};
	BX.Crm.EntityDetailTab.prototype =
	{
		initialize: function(id, settings)
		{
			this._id = BX.type.isNotEmptyString(id) ? id : BX.util.getRandomString(4);

			settings = settings ? settings : {};
			this._data = BX.prop.getObject(settings, "data", {});
			this._manager = BX.prop.get(settings, "manager", null);
			this._container = BX.prop.getElementNode(settings, "container");
			this._menuContainer = BX.prop.getElementNode(settings, "menuContainer");

			this._isActive = BX.prop.getBoolean(this._data, "active", false);
			this._isEnabled = BX.prop.getBoolean(this._data, "enabled", true);

			BX.addCustomEvent(this._manager.getId() + '_click_' + this._id, this.onMenuClick);

			var loaderSettings = BX.prop.getObject(this._data, "loader", null);
			if(loaderSettings)
			{
				loaderSettings["tabId"] = this._id;
				loaderSettings["container"] = this._container;
				this._loader = BX.Crm.EditorTabLazyLoader.create(
					this._id,
					loaderSettings
				);
			}
		},
		getId: function()
		{
			return this._id;
		},
		getMenuContainer: function()
		{
			return this._menuContainer;
		},
		isEnabled: function()
		{
			return this._isEnabled;
		},
		isActive: function()
		{
			return this._isActive;
		},
		setActive: function(active)
		{
			active = !!active;
			if(this._isActive === active)
			{
				return;
			}

			this._isActive = active;

			if(this._isActive)
			{
				if(this._loader && !this._loader.isLoaded())
				{
					this._loader.load();
				}
				// setTimeout(BX.delegate(this.showTab, this), 10);
				this.showTab()
			}
			else
			{
				// setTimeout(BX.delegate(this.hideTab, this),220);
				this.hideTab()
			}
		},
		showTab: function ()
		{
			BX.addClass(this._container, "crm-entity-section-tab-content-show");
			BX.removeClass(this._container, "crm-entity-section-tab-content-hide");
			BX.addClass(this._menuContainer, "main-buttons-item-active");

			this._container.style.display = "";
			this._container.style.position = "absolute";
			this._container.style.top = 0;
			this._container.style.left = 0;
			this._container.style.width = "100%";

			var showTab = new BX.easing({
				duration : 350,
				start : { opacity: 0, translateX:100 },
				finish: { opacity: 100, translateX:0 },
				transition : BX.easing.makeEaseOut(BX.easing.transitions.quart),
				step: BX.delegate(
					function(state)
					{
						this._container.style.opacity = state.opacity / 100;
						this._container.style.transform = "translateX(" + state.translateX + "%)";
					},
					this
				),
				complete: BX.delegate(
					function()
					{
						BX.removeClass(this._container, "crm-entity-section-tab-content-show");
						this._container.style.cssText = "";

						let manager = this._manager;
						if (manager)
						{
							requestAnimationFrame(() => {
								requestAnimationFrame(() => {
									manager._container.style.minHeight = '';
								});
							});
						}

						BX.onCustomEvent(window, "onEntityDetailsTabShow", [ this ]);
					},
					this
				)
			});

			showTab.animate();

		},
		hideTab: function ()
		{
			BX.addClass(this._container, "crm-entity-section-tab-content-hide");
			BX.removeClass(this._container, "crm-entity-section-tab-content-show");
			BX.removeClass(this._menuContainer, "main-buttons-item-active");

			var hideTab = new BX.easing({
				duration : 350,
				start : { opacity: 100 },
				finish: { opacity: 0 },
				transition : BX.easing.makeEaseOut(BX.easing.transitions.quart),
				step: BX.delegate(function(state) { this._container.style.opacity = state.opacity / 100; }, this),
				complete: BX.delegate(
					function ()
					{
						this._container.style.display = "none";
						this._container.style.transform = "translateX(100%)";
						this._container.style.opacity = 0;
					},
					this
				)
			});

			hideTab.animate();

		},
		onMenuClick: function()
		{
			if (!this._isEnabled)
			{
				return;
			}
			if(this._loader && !this._loader.isLoaded())
			{
				this._loader.load();
			}
			this._manager.processItemSelect(this);
		}
	};
	BX.Crm.EntityDetailTab.create = function(id, settings)
	{
		var self = new BX.Crm.EntityDetailTab();
		self.initialize(id, settings);
		return self;
	}
}
//endregion

//region TAB LOADER
if(typeof(BX.Crm.EditorTabLazyLoader) === "undefined")
{
	BX.Crm.EditorTabLazyLoader = function()
	{
		this._id = "";
		this._settings = {};
		this._container = null;
		this._serviceUrl = "";
		this._tabId = "";
		this._params = {};

		this._isRequestRunning = false;
		this._isLoaded = false;
	};

	BX.Crm.EditorTabLazyLoader.prototype =
	{
		initialize: function(id, settings)
		{
			this._id = BX.type.isNotEmptyString(id) ? id : "crm_lf_disp_" + Math.random().toString().substring(2);
			this._settings = settings ? settings : {};

			this._container = BX(BX.prop.get(this._settings, "container", ""));
			if(!this._container)
			{
				throw "Error: Could not find container.";
			}

			this._tabId = BX.prop.getString(this._settings, "tabId", "");
			if(this._tabId === "")
			{
				throw "Error: Could not find tab id.";
			}

			this._params = BX.prop.getObject(this._settings, "componentData", {});

			this._ajaxComponentActionParams = BX.prop.getObject(this._params, "ajaxComponentActionParams", {});
			this._useAjaxComponentAction = BX.type.isNotEmptyObject(this._ajaxComponentActionParams);

			if (this._useAjaxComponentAction)
			{
				this._componentName = BX.prop.getString(this._ajaxComponentActionParams, "componentName", "");
				if(this._componentName === "")
				{
					throw "Error. Could not find component name.";
				}

				this._actionName = BX.prop.getString(this._ajaxComponentActionParams, "actionName", "");
				if(this._actionName === "")
				{
					throw "Error. Could not find action name.";
				}

				this._signedParameters = BX.prop.getString(this._ajaxComponentActionParams, "signedParameters", "");
				if(this._signedParameters === "")
				{
					throw "Error. Could not find signed parameters.";
				}

				this._template = BX.prop.getString(this._params, "template", "");
				if(this._template === "")
				{
					throw "Error. Could not find template.";
				}
			}
			else
			{
				this._serviceUrl = BX.prop.getString(this._settings, "serviceUrl", "");
				if(this._serviceUrl === "")
				{
					throw "Error. Could not find service url.";
				}
			}
		},
		getId: function()
		{
			return this._id;
		},
		isLoaded: function()
		{
			return this._isLoaded;
		},
		load: function()
		{
			if(this._isLoaded)
			{
				return;
			}

			var params = this._params;
			params["TAB_ID"] = this._tabId;
			this._startRequest(params);
		},
		_startRequest: function(request)
		{
			if(this._isRequestRunning)
			{
				return false;
			}

			this._isRequestRunning = true;

			if (this._useAjaxComponentAction)
			{
				BX.ajax.runComponentAction(this._componentName, this._actionName, {
					signedParameters: this._signedParameters,
					data: {
						template: this._template
					}
				}).then(this._onRequestSuccess.bind(this), this._onRequestFailure.bind(this));
			}
			else
			{
				BX.ajax({
						url: this._serviceUrl,
						method: "POST",
						dataType: "html",
						data:
							{
								"LOADER_ID": this._id,
								"PARAMS": request
							},
						onsuccess: BX.delegate(this._onRequestSuccess, this),
						onfailure: BX.delegate(this._onRequestFailure, this)
				});
			}

			return true;
		},
		_onRequestSuccess: function(data)
		{
			this._isRequestRunning = false;
			if (this._useAjaxComponentAction)
			{
				data = BX.prop.getObject(data, "data", {});
				data = BX.prop.getString(data, "html", null);
			}

			BX.html(this._container, data);
			this._isLoaded = true;
		},
		_onRequestFailure: function(data)
		{
			this._isRequestRunning = false;
			this._isLoaded = true;
		}
	};

	BX.Crm.EditorTabLazyLoader.items = {};
	BX.Crm.EditorTabLazyLoader.create = function(id, settings)
	{
		var self = new BX.Crm.EditorTabLazyLoader();
		self.initialize(id, settings);
		this.items[self.getId()] = self;
		return self;
	};
}
//endregion

//region Column splitter (CRM Entity Card Split)
/*
	Draggable divider between the two card columns (desktop only). Injects a wrapper on the column
	boundary holding the separator strip and the return control, and drives --crm-card-left (see
	style.css).
	Between the two minimums the boundary follows the pointer. Past a minimum the column stops being
	recomputed: its content freezes at the minimum width and the growing neighbour covers it (the
	overlap classes in style.css), and letting go there glides it to zero. The chosen ratio and the
	collapsed side are kept in the user's own portal settings, so they follow the person and not the
	browser: the same width comes back after the tab is closed and on any other machine that user
	signs in from. template.php prints the stored value into the page ahead of the card, which is why
	the first paint is already the right width instead of the default.
	Keyboard: arrows nudge, Home resets to default, End maximises the left column.

	Structure:
		.crm-entity-card-split                   wrapper, full height, carries the event handlers
			.crm-entity-card-split-handle        role=separator, the 11px strip; ::after is the grip
			.crm-entity-card-split-restore       the way back, collapsed state only
*/
(function() {
	"use strict";

	var CSS_VAR       = "--crm-card-left";
	var GRIP_VAR      = "--crm-card-split-grip-y";
	var RESTORE_VAR   = "--crm-card-split-restore-y";
	var LINE_H_VAR    = "--crm-card-split-line-h";
	// style.css sizes the frozen content from these, so the constants below stay the single source.
	var MIN_LEFT_VAR  = "--crm-card-split-min-left";
	var MIN_RIGHT_VAR = "--crm-card-split-min-right";
	var HOST_SELECTOR = ".crm-entity-section-info[data-tab-id='main']";
	var ROOT_CLASS    = "crm-entity-card-split";
	var LEFT_SELECTOR  = ".crm-entity-card-container";
	var RIGHT_SELECTOR = ".crm-entity-stream-container";
	var COLLAPSED_CLASS = {
		left:  "crm-entity-card-split--collapsed-left",
		right: "crm-entity-card-split--collapsed-right"
	};
	var OVERLAP_CLASS = {
		left:  "crm-entity-card-split--overlap-left",
		right: "crm-entity-card-split--overlap-right"
	};
	var SETTLING_CLASS = "crm-entity-card-split--settling";
	var GRIP_OFF_CLASS = "crm-entity-card-split--grip-off";
	/*
		Collapsed on the fields, the pointer has two boundaries to choose between - the section's edge
		and the strip - and this marks which one it is at. style.css cannot work it out on its own: the
		one honest test is which side of the strip the pointer is on, and CSS has no way to ask. Testing
		hover instead put the answer on the return control's own edges, and its bottom border became an
		invisible line the grip switched off at - measured on the stand, x 1440: grip off at y 213, on at
		y 218, with nothing to see there. PM: "\u043a\u0430\u043f\u043b\u044f \u043c\u043e\u0440\u0433\u0430\u0435\u0442 \u043d\u0430 \u0432\u043e\u043b\u043e\u0441\u0435 \u043f\u043e\u0434 \u043a\u043d\u043e\u043f\u043a\u043e\u0439".
	*/
	var EDGE_CLASS = "crm-entity-card-split--at-edge";
	// The hint's own wrappers; style.css owns their look and, on the outer one, the hint's width.
	var HINT_OPEN        = '<span class="' + ROOT_CLASS + '-hint">';
	var HINT_CLOSE       = "</span>";
	var HINT_TITLE_OPEN  = '<span class="' + ROOT_CLASS + '-hint-title">';
	var HINT_TITLE_CLOSE = "</span>";
	/*
		Where the width lives. OPTION_* name the portal setting the user owns — the store proper, the
		one that survives the browser and comes back on another machine. STATE_MESSAGE is the page
		message template.php prints it into so the card can be drawn at that width without waiting for
		a request. STORAGE_KEY is the tab-local store the splitter used before this, still read on the
		way in so nobody whose width was already set loses it on the first card after the update.
	*/
	var OPTION_CATEGORY = "crm";
	var OPTION_NAME     = "entity_card_split";
	var OPTION_VALUE    = "state";
	var STATE_MESSAGE   = "CRM_ENT_DETAIL_SPLIT_STATE";
	var STORAGE_KEY   = "crm-entity-card-split";
	var DEFAULT_RATIO = 41.6;
	var MIN_LEFT_PX   = 340;
	var MIN_RIGHT_PX  = 460;
	var STEP_PX       = 16;
	var SETTLE_MS     = 200;   // keep in step with the transition in style.css
	var CLICK_SLOP_PX = 4;     // travel past which a pointerup is a finished drag, not a click
	/*
		The teardrop's own height. It has to match .crm-entity-card-split-handle::after in style.css,
		which is where the size is tuned: 40 -> 46 with the owner's +15% (round 3). While this constant
		lagged behind, the grip sat 3px below the pointer it was supposed to be centred on and the clamp
		further down left 6px of it for the return control to paint over.
	*/
	var GRIP_H        = 46;
	/*
		How far above the pointer the teardrop rides (owner, round 3): it used to sit centred on the
		pointer, it now sits this much higher. At half the grip's own height the whole shape clears the
		pointer - its lower edge meets the tip - which is where the owner settled after 15 read as too
		little. Past that the two simply part company, so the number is a look, not a threshold. Applied here and not as a calc() on --crm-card-split-grip-y
		for two reasons: the clamp in gripToPointer compares the value against the return control's band,
		so a shift added after the fact would put those two back inside each other by exactly this much,
		and gripToVisibleMiddle - the keyboard, which has no pointer to sit above - would be lifted with it.
	*/
	var GRIP_LIFT     = 23;
	var RESTORE_H     = 38;    // AIR button, size L (--ui-btn-size-lg)
	var DESKTOP       = "(min-width: 769px)";
	var CALM          = "(prefers-reduced-motion: reduce)";
	/*
		Below 769px there is no room for two open columns, so the split stops being a range and
		becomes a toggle: one column takes the whole card, the other is folded to zero, and the
		separator still switches between them (v2.2). Without this the card stacked instead, and a
		column collapsed on a wide window came back on its own as soon as the window narrowed.

		SPLIT_MIN_PX is where that stops being worth doing. The return control has to keep a lane to
		itself — 54px beside the fields, 102px beside the stream, the timeline having filled the
		first 63px of that gutter with its own entry icons — and at some width the lane costs more
		than the content can spare. The adjacent a11y project measured this card at viewport 320:
		241px of card area, 201px per column once stacked, against 147px for a split one, and it
		reproduced text collapsing into a column of single letters at 186px. Below the floor the
		splitter therefore stands down and that project's reflow keeps the columns stacked.

		It lives here rather than in a media query so the width has one source: style.css enters the
		narrow band on the --narrow class, which only this file sets. That also means a card whose
		JS never ran keeps the plain stacking instead of half a split with no way to work it.
	*/
	var SPLIT_MIN_PX  = 360;
	var NARROW        = "(min-width: " + SPLIT_MIN_PX + "px) and (max-width: 768px)";
	var NARROW_CLASS  = "crm-entity-card-split--narrow";
	var NARROW_DEFAULT = "right";   // arriving in the narrow band, the stream is what folds away
	/*
		The lanes the collapsed rules in style.css keep for the return control, and the stream's
		gutter at rest. The narrow band freezes a column's content at the width it has while it owns
		the whole card, and these are what that width is short of — see syncFreezeWidths.
	*/
	var LANE_LEFT_PX  = 54;
	var LANE_RIGHT_PX = 102;
	var GUTTER_PX     = 63;
	/*
		The return control lines up with the timeline's action row ("Activity / Comment / …") — its
		leading icon is the mark to centre on. With the stream collapsed that row is display: none and
		has no box to measure, so the constant stands in: the row sits flush with the top of the host,
		and 22 is where the middle of its icon lands.
	*/
	var ANCHOR_SELECTOR = ".crm-entity-stream-section-new";
	var ANCHOR_MARK     = ".crm-entity-stream-section-icon";
	var ANCHOR_FALLBACK_Y = 22;
	var STICK_MARGIN  = 12;    // how far below the top of the screen the control parks once caught up to

	/*
		The names below live in the template's language file, and template.php publishes them into the
		page's messages. Each is read at the moment it is used, not when this object is built: this
		file is a head script and runs before that publication.
	*/
	function hintMarkup(title, text) {
		return HINT_OPEN + HINT_TITLE_OPEN + BX.util.htmlspecialchars(title) + HINT_TITLE_CLOSE
			+ BX.util.htmlspecialchars(text) + HINT_CLOSE;
	}

	var TEXT = {
		get separator() { return BX.message("CRM_ENT_DETAIL_SPLIT_SEPARATOR"); },
		expand: {
			get left()  { return BX.message("CRM_ENT_DETAIL_SPLIT_EXPAND_LEFT"); },
			get right() { return BX.message("CRM_ENT_DETAIL_SPLIT_EXPAND_RIGHT"); }
		},
		/*
			What the UI hint shows on hover: the accessible name says what the button does, this says
			what is behind it. Deliberately entity-neutral — the column header differs from card to
			card, and pulling that name out of the DOM is the fragile thing spec §10.3 warned about.

			The hint renders its content as HTML, so the phrases are escaped and the markup is ours. The
			first line is the column's name and reads as a heading, so it is a span of its own that
			style.css gives weight to, and the outer span is what carries the hint's width - ui.hint's own
			content box is shared by every hint on the page and cannot be narrowed from here (owner,
			2026-09-22). Both spans, no <h*> and no <br>: a heading level inside a tooltip is a landmark a
			screen reader would have to account for, and the blocks put the body on its own line anyway.
		*/
		hint: {
			get left() {
				return hintMarkup(
					BX.message("CRM_ENT_DETAIL_SPLIT_HINT_LEFT_TITLE"),
					BX.message("CRM_ENT_DETAIL_SPLIT_HINT_LEFT_TEXT")
				);
			},
			get right() {
				return hintMarkup(
					BX.message("CRM_ENT_DETAIL_SPLIT_HINT_RIGHT_TITLE"),
					BX.message("CRM_ENT_DETAIL_SPLIT_HINT_RIGHT_TEXT")
				);
			}
		}
	};

	/*
		Which column comes back, said in pictures. The left one is the icon design picked in Figma, but
		it only ships with ui 26.700.0, and ui.icon-set throws on a name it does not know — so on an
		older ui the look-alike from the same frame family stands in. Resolved when the button is built:
		this file is a head script and BX.UI.IconSet is not there yet while it is being parsed.
	*/
	var ICON_CANDIDATES = {
		left: ["o-crm-optional-not-accepted", "o-form"],
		right: ["o-timeline"]
	};
	var ICON = null;

	function iconExists(name) {
		var Icon = BX.UI && BX.UI.IconSet && BX.UI.IconSet.Icon;
		// Nothing to ask: let the button try, as it always did.
		if (!Icon || typeof Icon.validateParams !== "function") { return true; }
		return Icon.validateParams({ icon: name }) === null;
	}

	function resolveIcons() {
		var result = {};
		Object.keys(ICON_CANDIDATES).forEach(function(side) {
			var names = ICON_CANDIDATES[side];
			result[side] = names.filter(iconExists)[0] || names[names.length - 1];
		});
		return result;
	}

	/*
		The three bands of style.css: two open columns, the narrow toggle, and — below the floor —
		none of ours, where the a11y reflow stacks the card and the splitter stands down.
	*/
	function layoutMode() {
		if (window.matchMedia(DESKTOP).matches) { return "wide"; }
		if (window.matchMedia(NARROW).matches)  { return "narrow"; }
		return "stack";
	}

	/*
		Both stores hold the same text, so one reader serves them: whatever comes out is treated as
		untrusted, and every field is either recognised or replaced by its own default.
	*/
	function parseState(raw) {
		if (typeof raw !== "string" || raw === "") { return null; }
		try {
			/*
				v1 wrote a bare number into this key, and a tab left open across the rollout still holds
				one, so both shapes have to be readable.
			*/
			if (raw.charAt(0) !== "{") {
				var n = parseFloat(raw);
				return (isFinite(n) && n > 0 && n < 100)
					? { ratio: n, collapsed: null, narrow: NARROW_DEFAULT }
					: null;
			}
			var v = JSON.parse(raw);
			var ratio = parseFloat(v.ratio);
			return {
				ratio: (isFinite(ratio) && ratio > 0 && ratio < 100) ? ratio : DEFAULT_RATIO,
				collapsed: (v.collapsed === "left" || v.collapsed === "right") ? v.collapsed : null,
				// Absent from anything written before v2.2, so the band's own default stands in.
				narrow: (v.narrow === "left" || v.narrow === "right") ? v.narrow : NARROW_DEFAULT
			};
		} catch (e) { return null; }
	}

	/*
		The user's portal setting is the store, and it is already on the page: template.php prints it
		into the messages ahead of the card, so this reads a value that is there rather than asking for
		one and redrawing when the answer lands. Like the names above it is read at the moment it is
		used — this file is a head script and a value taken while it is being parsed would be nothing.

		The tab's old store is the fallback, not a second opinion: it answers only while the portal
		setting is still empty, which is the one open card of whoever had a width set before the
		update. As soon as that person moves the divider the setting exists and this line stops
		mattering.
	*/
	function readSaved() {
		var saved = parseState(BX.message(STATE_MESSAGE));
		if (saved) { return saved; }
		try {
			return parseState(window.sessionStorage.getItem(STORAGE_KEY));
		} catch (e) { return null; }
	}

	// Pure: clamp a desired left width (px) to [MIN_LEFT_PX .. hostWidth - MIN_RIGHT_PX].
	function clampLeftPx(pxLeft, hostWidth) {
		var maxLeft = hostWidth - MIN_RIGHT_PX;
		if (maxLeft < MIN_LEFT_PX) { return Math.max(0, maxLeft); }
		return Math.min(Math.max(pxLeft, MIN_LEFT_PX), maxLeft);
	}
	/*
		The two ends of the legal range. Asking clampLeftPx for an impossible width is also how the
		degenerate narrow desktop reports its real edges — on a card 769-800px wide there is no room
		for both minimums, and the left column is handed hostWidth - MIN_RIGHT_PX, already below its
		nominal 340. That is why v2's separate effectiveMin() is gone: it existed to offset a snap
		threshold from these edges, and there is no threshold any more — the edge itself is the point
		of no return.
	*/
	function minLeftPx(hostWidth) { return clampLeftPx(0, hostWidth); }
	function maxLeftPx(hostWidth) { return clampLeftPx(hostWidth, hostWidth); }

	function build(host) {
		if (host.querySelector("." + ROOT_CLASS)) { return null; }

		var root = document.createElement("div");
		root.className = ROOT_CLASS;

		var handle = document.createElement("div");
		handle.className = ROOT_CLASS + "-handle";
		handle.setAttribute("role", "separator");
		handle.setAttribute("aria-orientation", "vertical");
		handle.setAttribute("tabindex", "0");
		handle.setAttribute("aria-valuemin", "0");
		handle.setAttribute("aria-valuemax", "100");
		handle.setAttribute("aria-label", TEXT.separator);

		/*
			The box only positions; everything visible about the control is the AIR button inside it.
			Keeping them apart means none of the component's own box model has to be fought with.
		*/
		var restoreBox = document.createElement("div");
		restoreBox.className = ROOT_CLASS + "-restore";

		/*
			A stock AIR button, size L, rather than a hand-drawn circle. It is given no caption, so
			ui.buttons collapses it to icon-only by itself; the accessible name arrives as aria-label
			in syncSemantics, along with the icon for whichever column is away.
		*/
		ICON = ICON || resolveIcons();
		var button = new BX.UI.Button({
			useAirDesign: true,
			style: BX.UI.Button.AirStyle.FILLED_WHITE,
			size: BX.UI.Button.Size.LARGE,
			icon: ICON.left
		});
		var restore = button.render();
		/*
			ui.buttons leaves type unset, which resolves to submit. Nothing wraps the card in a form
			today, but the editor is free to start doing so, and a stray submit inside someone else's
			form is not a bug worth waiting for.
		*/
		restore.type = "button";
		/*
			The control exists only while a column is collapsed, so its state never flips: it is always
			the "expanded: false" half of the pair. The state has to live here at all because
			role=separator with aria-valuenow: 0 describes a divider, not a collapsed panel.
		*/
		restore.setAttribute("aria-expanded", "false");
		/*
			ui.hint reads the hint text once, inside initNode, and closes over it — but ours changes
			with the collapsed side. So the node is marked as already initialised and driven by hand
			below, and data-hint-no-icon keeps anything that does sweep the page from planting a
			question mark inside the button.
		*/
		restore.setAttribute("data-hint-no-icon", "");
		restore.setAttribute("data-hint-init", "y");
		restore.setAttribute("data-hint-html", "");
		restoreBox.appendChild(restore);

		root.appendChild(handle);
		root.appendChild(restoreBox);
		host.appendChild(root);
		return { root: root, handle: handle, restore: restore, button: button };
	}

	function wire(host) {
		if (host.__cardSplitWired) { return; }
		host.__cardSplitWired = true;

		var left  = host.querySelector(LEFT_SELECTOR);
		var right = host.querySelector(RIGHT_SELECTOR);
		if (!left || !right) { return; }

		// aria-controls needs ids and the template provides none, so mint them — template.php stays untouched.
		if (!left.id)  { left.id  = "crm-entity-card-split-col-left"; }
		if (!right.id) { right.id = "crm-entity-card-split-col-right"; }

		var parts = build(host);
		if (!parts) { return; }
		var root = parts.root, handle = parts.handle, restore = parts.restore, button = parts.button;

		var collapsed = null;          // null | "left" | "right"
		var shownIcon = null;          // which side's icon the return control is currently wearing
		var overlap = null;            // null | "left" | "right" | "both" — the frozen, clipped side(s)
		var ratio = DEFAULT_RATIO;     // remembered open width, never below the minimum
		/*
			The bands remember separately, because they remember different things: a ratio between
			two open columns on one side, which of two whole-card layouts is showing on the other.
			Kept apart mostly to stop a narrow gesture from writing the wide value — the clamp is
			degenerate below 800px, so anything it hands back would flatten the remembered width to
			a minimum the moment the window widened again.
		*/
		var mode = null;                        // "wide" | "narrow" | "stack"
		var wideCollapsed = null;               // null | "left" | "right"
		var narrowCollapsed = NARROW_DEFAULT;   // "left" | "right" — never null, the band has no open state
		var booted = false;                     // suppresses the write that setting up would otherwise make
		/*
			Collapsing takes a column's height out of the page, and when the survivor is the shorter
			of the two the document loses more than the reader was scrolled past — the browser clamps
			the scroll, and expanding never gives it back. Measured on a card with fields 1820 and a
			stream 2326 tall: at scroll 1700 a collapse landed on 1165, and the return left it there,
			535px above where the reader had been.

			So the offset is kept across the pair, and given back only if the clamp is still what is
			holding the page — a reader who scrolled off it while the column was away has chosen a
			position and must not be yanked out of it.

			"Still what is holding the page" is read as "still pinned to the bottom", not as "the
			number has not changed": the clamp lands the reader exactly at the end of the shortened
			document, and the page goes on settling for a few pixels afterwards (measured: snapshot
			1169.5, five pixels later 1164.5, which is the end of the document to the pixel). Bottom
			is a property that survives that drift; an equality check does not, and an epsilon big
			enough to cover it would start swallowing real scrolls.
		*/
		var scrollMemo = null;                  // { before } while a column is away

		/*
			Always a percentage, both ends included: 0% rather than 0px, so the settle interpolates
			between two values of the same kind instead of leaning on calc() interpolation.
		*/
		function setBoundary(pct) {
			host.style.setProperty(CSS_VAR, pct.toFixed(2) + "%");
			handle.setAttribute("aria-valuenow", String(Math.round(pct)));
		}
		function applyWidth() {
			setBoundary(collapsed === "left" ? 0 : (collapsed === "right" ? 100 : ratio));
		}
		/*
			"both" is the narrow band: there the gesture is a wipe between two finished layouts, so
			neither column may reflow while it travels — the one being uncovered no more than the one
			going under. The two classes address different columns, so holding both is not a conflict.
		*/
		function setOverlap(side) {
			if (overlap === side) { return; }
			/*
				In the narrow band the freeze widths are the card's own width, and the one taken while
				the mode was entered is measured before the timeline has finished laying the card out —
				at boot it read 14px wide, the vertical scrollbar not being there yet (the same reason
				a restored ratio lands a few pixels off, see decisions.md). Refreshing as the freeze
				goes on is the last moment it can be got right, and the only moment it matters.
			*/
			if (side && mode === "narrow") { syncFreezeWidths(); }
			overlap = side;
			host.classList.toggle(OVERLAP_CLASS.left,  side === "left"  || side === "both");
			host.classList.toggle(OVERLAP_CLASS.right, side === "right" || side === "both");
		}

		/*
			How far down the boundary line runs. The wrapper is as tall as the taller column, so left
			at full height the line overshoots the shorter one and ends in the empty strip beside it,
			marking a boundary where there is only one column left to see.

			Collapsed is the exception: nothing is being separated, and the strip is still the drag
			surface that brings the column back (spec §10.3), so the line stays its full height.
		*/
		/*
			Where a column's painted boxes actually stop. The fields column runs on past its last
			section card: under it sits a row of "Create section / Marketplace / Card layout"
			links with no background of its own. That row cannot be a constant — measured 56px on a
			wide column and 61px once the links wrap onto two lines — so the last painted box is found
			rather than assumed, and by having a background rather than by class, which keeps this out
			of the entity editor's naming.

			Only the fields column is worth scanning. The stream's own cards reach its edge (measured:
			15px), and it holds twice the nodes, so its box is both the honest answer and the cheap one.
		*/
		function paintedBottom(column) {
			var kids = column.querySelectorAll("*");
			var end = -Infinity;
			for (var i = 0; i < kids.length; i++) {
				var r = kids[i].getBoundingClientRect();
				if (r.height < 20) { continue; }
				var bg = window.getComputedStyle(kids[i]).backgroundColor;
				if (!bg || bg === "rgba(0, 0, 0, 0)" || bg === "transparent") { continue; }
				if (r.bottom > end) { end = r.bottom; }
			}
			return end === -Infinity ? column.getBoundingClientRect().bottom : end;
		}

		function syncLineHeight() {
			var top = host.getBoundingClientRect().top;
			var end;
			if (collapsed === "left") {
				end = right.getBoundingClientRect().bottom;   // fields are display: none, nothing to scan
			} else if (collapsed === "right") {
				end = paintedBottom(left);
			} else {
				end = Math.min(paintedBottom(left), right.getBoundingClientRect().bottom);
			}
			host.style.setProperty(LINE_H_VAR, Math.max(0, Math.round(end - top)) + "px");
		}

		/*
			Whatever actually scrolls the card. Usually the document of the card's own iframe, but the
			card also renders inside hosts that scroll an ancestor instead, so the nearest scrollable
			one wins and the document is the fallback.
		*/
		function scroller() {
			var n = host.parentElement;
			while (n && n !== document.documentElement) {
				var cs = window.getComputedStyle(n);
				if (/(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 1) { return n; }
				n = n.parentElement;
			}
			return document.scrollingElement || document.documentElement;
		}

		/*
			The percentage basis the boundary is expressed against: the host's content box, which is
			also what the columns take their width from. Reads the same as the border box wherever the
			host carries no padding, so it is safe either way.
		*/
		function hostInnerWidth() {
			var cs = window.getComputedStyle(host);
			var w = host.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
			return w > 0 ? w : host.getBoundingClientRect().width;
		}

		/*
			What the overlap rules in style.css freeze content at. In the wide band that is the pair
			of minimums the clamp works to, and they are constants. In the narrow band a column is
			either the whole card or gone, so it freezes at the width it has while it owns the card,
			less the lane the return control keeps — which makes it a function of the card's width
			and something to recompute on resize rather than set once.

			The stream gets the gutter added back because style.css sizes its frozen content as
			"minimum minus gutter"; the two together land on inner - LANE_RIGHT_PX, the width the
			collapsed rules actually give it.
		*/
		function syncFreezeWidths() {
			if (mode === "narrow") {
				var inner = hostInnerWidth();
				host.style.setProperty(MIN_LEFT_VAR,  Math.max(0, inner - LANE_LEFT_PX) + "px");
				host.style.setProperty(MIN_RIGHT_VAR, Math.max(0, inner - LANE_RIGHT_PX + GUTTER_PX) + "px");
				return;
			}
			host.style.setProperty(MIN_LEFT_VAR,  MIN_LEFT_PX + "px");
			host.style.setProperty(MIN_RIGHT_VAR, MIN_RIGHT_PX + "px");
		}

		/*
			The two ends of the gesture. Wide: the clamp's own edges. Narrow: the card's edges, since
			the only two legal boundaries there are 0 and the full width.
		*/
		function bounds(hostWidth) {
			if (mode === "narrow") { return { lo: 0, hi: hostWidth }; }
			return { lo: minLeftPx(hostWidth), hi: maxLeftPx(hostWidth) };
		}

		function syncSemantics() {
			host.classList.toggle(COLLAPSED_CLASS.left,  collapsed === "left");
			host.classList.toggle(COLLAPSED_CLASS.right, collapsed === "right");
			if (collapsed !== "right") { root.classList.remove(EDGE_CLASS); }
			if (collapsed) {
				// aria-controls needs ids and the template provides none, so wire() mints them first.
				restore.setAttribute("aria-controls", (collapsed === "left" ? left : right).id);
				restore.setAttribute("aria-label", TEXT.expand[collapsed]);
				restore.setAttribute("data-hint", TEXT.hint[collapsed]);
				// setIcon rebuilds the icon node, so only ask for it when the side actually changed.
				if (shownIcon !== collapsed) {
					button.setIcon(ICON[collapsed]);
					shownIcon = collapsed;
				}
			}
			// A separator that separates nothing is not worth a tab stop; arrows still reach it by bubbling.
			handle.setAttribute("tabindex", collapsed ? "-1" : "0");
			syncLineHeight();
		}

		/*
			The wrapper spans the whole main tab (~3200px), so neither the grip nor the return control
			can sit at a fixed offset and stay in view, and position: sticky is unavailable here (see
			style.css). Both are placed by hand: the grip rides GRIP_LIFT above the pointer while the
			mouse is on the strip, and on the middle of the visible band when there is no pointer to follow —
			from the keyboard, and for the return control, which has to hold that spot at all times.
		*/
		/*
			rootTop is for callers that have just written the boundary: they read it before the write, so
			this does not force a layout of the whole card on every pointer event.
		*/
		function gripToPointer(clientY, rootTop) {
			if (typeof rootTop !== "number") { rootTop = root.getBoundingClientRect().top; }
			var top = Math.round(clientY - rootTop - GRIP_H / 2 - GRIP_LIFT);
			/*
				Collapsed, the teardrop must not enter the return control's band. The control is opaque and
				paints over the grip, so an overlapping grip is drawn half behind it and reads as a shape
				poking out from under the button — the same cosmetic fault style.css just removed for a
				pointer ON the button, arriving instead from a pointer a few pixels off it. Measured before
				this clamp: hovering the strip 9px below the button put the grip at 208..248 against the
				button's 181..219, an 11px overlap.

				So it parks at whichever edge it came from and slides on once the pointer is past the
				control. Only while collapsed: with both columns open there is no control to avoid, and a
				drag clears `collapsed` on its first move, so the grip follows the pointer freely again the
				moment a drag begins.
			*/
			if (collapsed) {
				var restoreTop = parseFloat(root.style.getPropertyValue(RESTORE_VAR)) || 0;
				var restoreBottom = restoreTop + RESTORE_H;
				if (top < restoreBottom && top + GRIP_H > restoreTop) {
					var above = restoreTop - GRIP_H;
					var below = restoreBottom;
					/*
						Which edge it parks at is a matter of what fits, not only of where it came from. The
						control lives at the top of the card, so "above it" is usually off the card altogether -
						and showGrip would then switch the grip off, leaving the boundary bare exactly where the
						pointer is. Collapsed or open, the teardrop belongs on the boundary, so it takes the
						other side rather than none.
					*/
					if (top + GRIP_H / 2 < restoreTop + RESTORE_H / 2) {
						top = (above >= 0) ? above : below;
					} else {
						top = (below + GRIP_H <= lineBand()) ? below : above;
					}
				}
			}
			showGrip(top);
		}
		/*
			The band the teardrop is allowed into: the stretch the hairline covers, which syncLineHeight
			keeps on the overlap of the two columns. Both are drawn from the top of the strip, so the band
			is 0..lineH in the same coordinates the placement above works in.
		*/
		/*
			The boundary the pointer has chosen, by x alone: left of the strip is the section's edge, the
			strip itself and everything right of it is the strip. Deliberately blind to what is under the
			pointer - the return control sits across both zones, so anything that asks "what am I over"
			gains a horizontal edge the grip flips at, which is the defect this replaced.
		*/
		function markEdge(clientX) {
			root.classList.toggle(EDGE_CLASS,
				collapsed === "right" && clientX < root.getBoundingClientRect().left);
		}
		function lineBand() {
			var h = parseFloat(host.style.getPropertyValue(LINE_H_VAR));
			return (h > 0) ? h : root.getBoundingClientRect().height;
		}
		/*
			Outside that band the teardrop is switched off, not parked at its edge (owner, round 3). Above
			the start the columns have not met yet, so a grip there hangs over the top edge of the card
			dividing nothing - which is what it looked like on screen. Parking would be worse than hiding:
			the shape would stick to the edge while the pointer carried on, and a frozen affordance reads
			as broken rather than absent. The far end is the same line and gets the same rule.
		*/
		function showGrip(top) {
			root.classList.toggle(GRIP_OFF_CLASS, top < 0 || top + GRIP_H > lineBand());
			root.style.setProperty(GRIP_VAR, top + "px");
		}
		function gripToVisibleMiddle() {
			var r = root.getBoundingClientRect();
			var viewportH = window.innerHeight || document.documentElement.clientHeight;
			var top = Math.max(r.top, 0);
			var bottom = Math.min(r.bottom, viewportH);
			if (bottom <= top) { return; }
			var y = Math.round((top + bottom) / 2 - r.top - GRIP_H / 2);
			/*
				The keyboard has no pointer that could carry the grip out of the band, and here the grip is
				half the focus indicator (WCAG 2.4.7) - so this path is pulled back inside instead of
				switched off. Focus must never land on a separator that shows nothing.
			*/
			y = Math.min(Math.max(y, 0), Math.max(lineBand() - GRIP_H, 0));
			root.classList.remove(GRIP_OFF_CLASS);
			root.style.setProperty(GRIP_VAR, y + "px");
		}

		/*
			Where the return control lives: beside the timeline's action row, which is where attention
			already is at the moment a column disappears. Measured off that row's leading icon, or off
			the constant when the row is the thing that got collapsed and has no box left to measure.

			It then stays put — until the page scrolls far enough that its parking spot would leave the
			screen, at which point it stops at STICK_MARGIN below the top edge and rides along. Neither
			half alone is right on a card this tall: pinned to the row it disappears after a screenful
			of timeline, and pinned to the viewport it floats in the middle of nothing.
		*/
		function restoreToAnchor() {
			var r = root.getBoundingClientRect();
			var centre = ANCHOR_FALLBACK_Y;
			var anchor = host.querySelector(ANCHOR_SELECTOR);
			var mark = anchor && anchor.querySelector(ANCHOR_MARK);
			if (mark) {
				var m = mark.getBoundingClientRect();
				if (m.height > 0) { centre = m.top - r.top + m.height / 2; }
			}
			/*
				r.top goes negative as the card scrolls past the top edge, so STICK_MARGIN - r.top is
				the parking spot expressed in the wrapper's own coordinates. Below the card it stops
				too: a control hanging past the last entry of the timeline points at nothing.
			*/
			var top = Math.max(centre - RESTORE_H / 2, STICK_MARGIN - r.top);
			top = Math.min(top, Math.max(r.height - RESTORE_H - STICK_MARGIN, 0));
			root.style.setProperty(RESTORE_VAR, Math.round(top) + "px");
		}

		/*
			The control only moves while a column is away, so the listeners live exactly as long as that
			state does. Capture on scroll because the card can be scrolled by an ancestor rather than by
			the window itself; rAF because scroll fires far more often than the value can change. The
			grip needs neither — it is placed at the moment it appears.
		*/
		var viewportBound = false;
		var rafId = 0;
		function onViewportChange() {
			if (rafId) { return; }
			rafId = window.requestAnimationFrame(function() {
				rafId = 0;
				// In the narrow band the freeze widths are the card's width, so a resize moves them.
				if (mode === "narrow") { syncFreezeWidths(); }
				restoreToAnchor();
			});
		}
		function watchViewport(on) {
			if (on === viewportBound) { return; }
			viewportBound = on;
			var fn = on ? "addEventListener" : "removeEventListener";
			window[fn]("scroll", onViewportChange, true);
			window[fn]("resize", onViewportChange);
		}

		// Instant. Only the restore of a remembered collapse uses it — every live path glides instead.
		function setCollapsed(side) {
			if (collapsed === side) { return; }
			collapsed = side;
			applyWidth();
			syncSemantics();
			restoreToAnchor();
			watchViewport(!!side);
		}

		/*
			Crossing between the bands, without a reload: a resized window, or a slider opening onto a
			narrower card than the last one.

			Arriving in the narrow band, a column that was already folded stays folded — "collapsed
			stays collapsed" is the whole point of v2.2, and the side the user chose is a better guess
			than the default. Only a card that arrives with both columns open takes NARROW_DEFAULT.

			Going below the floor is the one place that rule does not hold: the collapse classes come
			off so the reflow can stack both columns. A column hidden by display: none inside a stacked
			card is not a collapsed panel, it is missing content — and down there the return control
			has no room to be the way back.
		*/
		function applyMode(next) {
			if (next === mode) { return; }
			var prev = mode;
			mode = next;
			host.classList.toggle(NARROW_CLASS, next === "narrow");
			// Measured against a layout that no longer exists once the band changes under it.
			scrollMemo = null;
			syncFreezeWidths();

			if (prev === "narrow" && collapsed) { narrowCollapsed = collapsed; }
			if (prev === "wide") { wideCollapsed = collapsed; }

			if (next === "narrow")    { setCollapsed(collapsed || narrowCollapsed); }
			else if (next === "wide") { setCollapsed(wideCollapsed); applyWidth(); }
			else                      { setCollapsed(null); }

			if (booted) { persist(); }
		}

		/*
			The glide. Everything that moves the boundary without a pointer on it goes through here: it
			turns the transition on for exactly one change and hands the tail work — dropping the
			freeze, committing the collapse — to the end of it.

			The end is a timer, not transitionend. That event fires per property per element (three
			elements, two properties), never fires when a value happens not to change, and does not
			arrive at all in a tab under automation, where a transition instead holds its property
			frozen at the start value (PROTOCOL, "measurement gotchas in a CDP tab"). A timer is
			deterministic, and dropping the class at the end is what releases the property in that tab.

			Under prefers-reduced-motion the whole thing degenerates into "apply, then finish", which
			is the instant settle the spec asks for.
		*/
		var settleTimer = 0;
		function settle(apply, done) {
			if (settleTimer) {
				window.clearTimeout(settleTimer);
				settleTimer = 0;
				host.classList.remove(SETTLING_CLASS);
			}
			if (window.matchMedia(CALM).matches) { apply(); done(); return; }
			host.classList.add(SETTLING_CLASS);
			apply();
			settleTimer = window.setTimeout(function() {
				settleTimer = 0;
				host.classList.remove(SETTLING_CLASS);
				done();
			}, SETTLE_MS + 40);
		}

		/*
			Collapse. The column glides to zero still frozen and clipped, so it slides under its
			neighbour instead of blinking out; display: none — which is what actually takes it out of
			the accessibility tree — lands only once it has arrived. Setting that up front would empty
			the column a fifth of a second before the box caught up.
		*/
		function collapseInto(side) {
			// Narrow: the neighbour is arriving at full width, not growing, so it must not reflow either.
			setOverlap(mode === "narrow" ? "both" : side);
			var column = side === "left" ? left : right;
			// Focus must never be left inside a column that is about to leave the accessibility tree.
			var rescueFocus = column.contains(document.activeElement);
			/*
				Wide only. The narrow band toggles between two whole-card layouts rather than hiding
				part of one, so there is no "the same page, minus a column" to come back to and an
				offset taken from the other layout would mean nothing here.
			*/
			var scrollWas = (mode === "narrow") ? null : scroller().scrollTop;
			settle(
				function() { setBoundary(side === "left" ? 0 : 100); },
				function() {
					setOverlap(null);
					collapsed = side;
					if (mode === "narrow") { narrowCollapsed = side; } else { wideCollapsed = side; }
					applyWidth();
					syncSemantics();
					restoreToAnchor();
					watchViewport(true);
					/*
						preventScroll on both hand-offs: the control sits wherever the viewport is, so
						scrolling it into view can only move the page, never help.
					*/
					if (rescueFocus) { restore.focus({ preventScroll: true }); }
					if (scrollWas !== null) { scrollMemo = { before: scrollWas }; }
					persist();
				}
			);
		}

		/*
			The way back. The collapsed class comes off first and the freeze goes on in the same tick,
			so the column reappears at its minimum width and travels out from under the neighbour
			without reflowing its contents on the way.
		*/
		function expandTo(targetRatio) {
			var side = collapsed;
			if (!side) { return; }
			/*
				Mirror of the rescue above: the return control goes away with the state that owns it,
				so focus has to move before it vanishes. The separator is where it belongs — same place
				on screen, and the arrows the user was about to press already work there.
			*/
			var refocus = (document.activeElement === restore);
			/*
				Decided here, before anything moves: once the column is back the document is its full
				height again and "pinned to the bottom" no longer means anything.
			*/
			var giveScrollBack = false;
			if (scrollMemo) {
				var sc0 = scroller();
				var maxNow = Math.max(0, sc0.scrollHeight - sc0.clientHeight);
				// At the end of the shortened page (the clamp still holds), or never moved at all.
				giveScrollBack = (maxNow - sc0.scrollTop <= 2) || (Math.abs(sc0.scrollTop - scrollMemo.before) <= 2);
			}
			collapsed = null;
			wideCollapsed = null;   // only ever reached in the wide band; the narrow one has no open state
			ratio = targetRatio;
			syncSemantics();
			if (refocus) { handle.focus({ preventScroll: true }); }
			watchViewport(false);
			setOverlap(side);
			settle(applyWidth, function() {
				setOverlap(null);
				// The page is its full height again, so the offset the clamp took is reachable once more.
				if (scrollMemo) {
					if (giveScrollBack) { scroller().scrollTop = scrollMemo.before; }
					scrollMemo = null;
				}
				persist();
			});
		}

		/*
			Three values, because the two bands remember different things and a card can be reopened in
			either. collapsed is the wide band's, narrow is the other one's, and whichever band is live
			reads its answer out of `collapsed` — below the floor neither is live and both keep what
			they last held.

			Written to the user's portal settings, and only from where a gesture has ended: a pointer
			let go, a collapse arrived, a key pressed, a band crossed. Never from the drag itself — the
			boundary moves a frame at a time and the store is not asked to keep up with it.

			The write is asynchronous and nothing here waits for it or reads it back. BX.userOptions
			batches the value, carries it in a cookie the next page load picks up, and sends it in the
			background; several nudges of an arrow key coalesce into one request. That is deliberate:
			the layout the user is looking at is the layout they set, and a request that fails must
			leave it exactly where it is rather than pull the column back to where it used to be.
		*/
		function persist() {
			if (!window.BX || !BX.userOptions) { return; }
			try {
				BX.userOptions.save(OPTION_CATEGORY, OPTION_NAME, OPTION_VALUE, JSON.stringify({
					ratio: +ratio.toFixed(2),
					collapsed: (mode === "wide")   ? collapsed : wideCollapsed,
					narrow:    (mode === "narrow") ? collapsed : narrowCollapsed
				}));
			} catch (e) {}
		}

		var dragging = false;
		var dragMoved = false;      // a drag that travelled is not a click on whatever it started on
		var dragStartX = 0;
		var fromCollapsed = false;  // this gesture began on a collapsed column

		/*
			Three phases of one gesture (spec §10.1). Between the minimums the boundary follows the
			pointer as it always did. Past a minimum the column stops being recomputed — the overlap
			class freezes its content and clips it — and only the visible width keeps shrinking. ratio
			stays parked on the minimum throughout, so it is at once the width a collapse remembers
			and the width a return lands on.
		*/
		function onMove(e) {
			if (!dragging) { return; }
			var rect = host.getBoundingClientRect();
			if (rect.width <= 0) { return; }
			var rootTop = root.getBoundingClientRect().top;
			/*
				Below the slop nothing happens at all — no un-collapse, no overlap, no ratio written.
				That is what makes a press on the return control a click, and what keeps a boundary
				already parked on its minimum from collapsing on a twitch now that the overlap starts
				on the first pixel past it. Every boundary on a narrow desktop is parked there: the
				clamp leaves exactly one legal width.
			*/
			if (!dragMoved) {
				if (Math.abs(e.clientX - dragStartX) <= CLICK_SLOP_PX) { return; }
				dragMoved = true;
			}
			if (collapsed) { leaveCollapseForDrag(); }

			var bx = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);

			if (mode === "narrow") {
				/*
					Two legal states and nothing in between, so this is a wipe, not a resize: both
					columns stay frozen at the width they hold while they own the card and the
					boundary simply travels across them. ratio is not touched — it belongs to the
					wide band, and the clamp down here is degenerate enough that anything it produced
					would flatten the remembered width on the way back up.
				*/
				setOverlap("both");
				setBoundary(bx / rect.width * 100);
				gripToPointer(e.clientY, rootTop);
				e.preventDefault();
				return;
			}

			var edges = bounds(rect.width);
			var lo = edges.lo;
			var hi = edges.hi;

			if (bx < lo) {
				setOverlap("left");
				ratio = lo / rect.width * 100;
				setBoundary(bx / rect.width * 100);
			} else if (bx > hi) {
				setOverlap("right");
				ratio = hi / rect.width * 100;
				setBoundary(bx / rect.width * 100);
			} else {
				/*
					Back inside the legal range, so the gesture stops counting as "pulled out of a
					collapse" and diving under a minimum again commits one as usual. Without releasing
					the latch here a user could not pull a column out and change their mind in one go.
				*/
				setOverlap(null);
				fromCollapsed = false;
				ratio = bx / rect.width * 100;
				applyWidth();
			}
			gripToPointer(e.clientY, rootTop);   // the pointer leaves the 11px strip while dragging
			e.preventDefault();
		}

		/*
			Dragging the return control leaves the collapsed state on the first move, but keeps the
			freeze: the column is still pinned at its minimum, merely emerging from under the neighbour.
		*/
		function leaveCollapseForDrag() {
			var side = collapsed;
			collapsed = null;
			syncSemantics();
			watchViewport(false);
			setOverlap(side);
		}

		function onUp(e) {
			if (!dragging) { return; }
			dragging = false;
			document.removeEventListener("pointermove", onMove);
			document.removeEventListener("pointerup", onUp);
			document.body.style.userSelect = "";
			// Never travelled: onMove did nothing, so there is nothing to commit or undo here either.
			if (!dragMoved || !overlap) { if (dragMoved) { persist(); } return; }
			/*
				The point of no return is the minimum itself, not a distance past it: what decides is
				whether the pointer was let go inside the overlap. Which way that resolves is the
				direction the gesture came from — pulling an open column under its neighbour commits
				the collapse, pulling a collapsed one out commits the return, and the return lands
				exactly on the minimum, which is where ratio has been parked all along.
			*/
			if (mode === "narrow") {
				/*
					Both ends of the narrow band are collapsed states, so there is no open width to
					come back to and the latch that resolves a wide gesture — which side it started
					from — has nothing to decide between. Nearness does it instead.
				*/
				var upRect = host.getBoundingClientRect();
				collapseInto((e.clientX - upRect.left) < upRect.width / 2 ? "left" : "right");
				return;
			}
			if (fromCollapsed) { settle(applyWidth, function() { setOverlap(null); persist(); }); }
			else { collapseInto(overlap); }
		}

		/*
			Nothing is excluded here: while collapsed the return control is also the drag surface (spec
			§10.3), so a press on it starts a drag like a press anywhere else on the wrapper. What tells
			the two apart afterwards is travel, not the target — see the click handler.
		*/
		root.addEventListener("pointerdown", function(e) {
			if (mode === "stack") { return; }
			dragging = true;
			dragMoved = false;
			dragStartX = e.clientX;
			fromCollapsed = !!collapsed;
			document.body.style.userSelect = "none";
			document.addEventListener("pointermove", onMove);
			document.addEventListener("pointerup", onUp);
			/*
				Suppressing the default is what stops the drag from selecting text — except on the
				return control, where it would also swallow the focus the button is entitled to, and
				with it the hand-off of focus to the separator when the column comes back.
			*/
			if (!e.target.closest("." + ROOT_CLASS + "-restore")) { e.preventDefault(); }
		});

		/*
			Unlike the drag and the arrows, which are positional and can only land on the minimum, this
			is "undo the collapse" — so it gives back the remembered width. That is what makes a ratio
			carried in from the stored state survive a collapse instead of being flattened to the minimum.
		*/
		root.addEventListener("click", function(e) {
			/*
				A drag that travelled always leaves collapsed at null before its click arrives — the
				first move releases the state, and a collapse only lands at the end of its settle — so
				this guard is also what keeps a finished drag from reading as a click on the control.
			*/
			if (mode === "stack" || !collapsed) { return; }
			if (!e.target.closest("." + ROOT_CLASS + "-restore")) { return; }
			// Narrow: there is no open width to give back, so the click hands the card to the other column.
			if (mode === "narrow") { collapseInto(collapsed === "left" ? "right" : "left"); return; }
			expandTo(ratio);
		});

		/*
			Bound to the wrapper, not the separator: while collapsed the separator leaves the tab order
			and the only focusable thing here is the return button, so the handler has to catch the event
			by bubbling to keep the arrows working.
		*/
		root.addEventListener("keydown", function(e) {
			if (mode === "stack") { return; }
			// Enter/Space on the return control is a click; let the browser dispatch it.
			if (e.target.closest("." + ROOT_CLASS + "-restore") && (e.key === "Enter" || e.key === " ")) { return; }

			var rect = host.getBoundingClientRect();
			if (rect.width <= 0) { return; }
			var edges = bounds(rect.width);
			var lo = edges.lo;
			var hi = edges.hi;
			var handled = true;

			if (mode === "narrow") {
				/*
					Two states, so the arrows read exactly as they do above — each one folds the column
					it points away from — except that here there is no stepping first. STEP_PX has
					nothing to move between when the only legal boundaries are the two edges. Pressing
					towards the column already folded is a no-op rather than a second collapse.
				*/
				var want = null;
				if (e.key === "ArrowLeft")       { want = "left"; }
				else if (e.key === "ArrowRight") { want = "right"; }
				else if (e.key === "End")        { want = "right"; }
				else if (e.key === "Home")       { want = NARROW_DEFAULT; }
				else                             { handled = false; }
				if (want && want !== collapsed)  { collapseInto(want); }
			}
			else if (collapsed) {
				/*
					Out of zero, the arrow pointing away from the collapsed side brings the column back
					to exactly its minimum — the mirror of the mouse, which cannot return it anywhere
					else either. Pushing further into the collapsed side stays a no-op, and Home still
					reaches the default from here.
				*/
				var out = collapsed === "left" ? "ArrowRight" : "ArrowLeft";
				if (e.key === out)         { expandTo((collapsed === "left" ? lo : hi) / rect.width * 100); }
				else if (e.key === "Home") { expandTo(DEFAULT_RATIO); }
				else                       { handled = false; }
			} else {
				var leftPx = ratio / 100 * rect.width;
				switch (e.key) {
					/*
						At its minimum the arrow has nowhere further to go, so one more press does what
						the mouse does at that same spot: it collapses. Once the capsule buttons are
						gone this is the entire keyboard path to a collapse (WCAG 2.1.1), and it gets
						there by mirroring the pointer rather than by adding a control — which is what
						spec §10.2 asks for after taking the buttons away.
					*/
					case "ArrowLeft":
						if (leftPx <= lo + 0.5) { collapseInto("left"); } else { setFromPx(leftPx - STEP_PX, rect); }
						break;
					case "ArrowRight":
						if (leftPx >= hi - 0.5) { collapseInto("right"); } else { setFromPx(leftPx + STEP_PX, rect); }
						break;
					case "Home": setFromPx(DEFAULT_RATIO / 100 * rect.width, rect); break;
					case "End":  setFromPx(hi, rect); break;
					default: handled = false;
				}
			}
			if (handled) { e.preventDefault(); gripToVisibleMiddle(); }
		});

		function setFromPx(pxLeft, rect) {
			if (rect.width <= 0) { return; }
			var target = clampLeftPx(pxLeft, rect.width) / rect.width * 100;
			if (collapsed) { expandTo(target); return; }
			setOverlap(null);
			ratio = target;
			applyWidth();
			persist();
		}

		root.addEventListener("dblclick", function(e) {
			if (mode === "stack") { return; }
			// Narrow: "back to the default" is the band's default side, there being no default ratio.
			if (mode === "narrow") {
				if (collapsed !== NARROW_DEFAULT) { collapseInto(NARROW_DEFAULT); }
				return;
			}
			if (collapsed) { expandTo(DEFAULT_RATIO); return; }
			ratio = DEFAULT_RATIO;
			applyWidth();
			persist();
		});

		/*
			The grip is invisible until hover or focus and is placed at that moment: at BX.ready the
			timeline has not laid out yet and any value computed now would be stale. On the mouse it
			then rides along the strip, which is how it behaved before the capsule replaced it; the
			keyboard has no pointer to follow, so it gets the middle of the visible band.
		*/
		// Collapsed too: the strip is still a drag surface there, so it still shows what it offers.
		root.addEventListener("pointermove", function(e) {
			if (!dragging) { markEdge(e.clientX); gripToPointer(e.clientY); }
		});
		// Leaving takes the mark with it, so a re-entry is never answered out of the last gesture.
		root.addEventListener("pointerleave", function() { root.classList.remove(EDGE_CLASS); });
		root.addEventListener("focusin", function() { gripToVisibleMiddle(); });

		/*
			The UI hint, driven by hand rather than through initNode: the text belongs to whichever
			column is away, and initNode would have captured only the one that was there first.
			data-hint is still kept current so the manager's own anchor check passes.
		*/
		if (BX.UI.Hint) {
			restore.addEventListener("mouseenter", function() {
				if (collapsed) { BX.UI.Hint.show(restore, TEXT.hint[collapsed], false, true); }
			});
			restore.addEventListener("mouseleave", function() { BX.UI.Hint.hide(restore); });
		}

		/*
			Applied before any interaction so the restored layout never flashes through the default one.
		*/
		/*
			The columns also change height on their own: the timeline loads more entries, a section is
			folded open, a drag rewraps their content. So the length is observed rather than recomputed
			at a handful of chosen moments. Setting a custom property on the host cannot resize either
			column, so the observer cannot feed itself.
		*/
		/*
			A drag resizes the columns on every frame, and paintedBottom walks the whole fields column,
			so while dragging the line is resynced at most once per SETTLE_MS, with a trailing call that
			catches the last width.
		*/
		var lineSyncTimer = 0;
		function onColumnsResize() {
			if (!dragging) { syncLineHeight(); return; }
			if (lineSyncTimer) { return; }
			lineSyncTimer = window.setTimeout(function() {
				lineSyncTimer = 0;
				syncLineHeight();
			}, SETTLE_MS);
		}
		if (window.ResizeObserver) {
			var lineObserver = new window.ResizeObserver(onColumnsResize);
			lineObserver.observe(left);
			lineObserver.observe(right);
		}

		var saved = readSaved();
		if (saved) {
			/*
				Clamped on the way in: a remembered ratio below the minimum would put the boundary
				inside the overlap zone with nothing frozen, leaving the column reflowed past its own
				limit — which is precisely the state the overlap model exists to prevent.

				Only meaningful for the wide band, and only clamped correctly there: below 800px the
				clamp has a single legal width, so a card opening narrow would flatten the remembered
				ratio to it. Reading it here and letting applyMode decide which band is live keeps the
				wide value intact across a narrow visit.
			*/
			var startWidth = hostInnerWidth();
			ratio = (startWidth > 0 && window.matchMedia(DESKTOP).matches)
				? clampLeftPx(saved.ratio / 100 * startWidth, startWidth) / startWidth * 100
				: saved.ratio;
			wideCollapsed = saved.collapsed;
			narrowCollapsed = saved.narrow;
		}
		applyWidth();
		syncSemantics();

		/*
			The band is a subscription, not a decision taken once: the window resizes, and a slider can
			open onto a narrower card than the one before it. addListener as well as addEventListener
			because this file is ES5 and still has to run where MediaQueryList is not an EventTarget.
		*/
		function onBandChange() { applyMode(layoutMode()); }
		[window.matchMedia(DESKTOP), window.matchMedia(NARROW)].forEach(function(mq) {
			if (mq.addEventListener) { mq.addEventListener("change", onBandChange); }
			else if (mq.addListener) { mq.addListener(onBandChange); }
		});

		applyMode(layoutMode());
		booted = true;   // from here on a band change is the user's business and gets written down
	}

	function init() {
		/*
			The way out of a collapsed column is a stock AIR button. Without ui.buttons there would be
			no way out at all, so the splitter stays out of the page entirely rather than becoming a
			trap — template.php loads the extension, this only guards against it going missing.

			No width check here any more: wire() runs at every width and applyMode decides what is
			live, because the card can cross a band without reloading. Below the floor that leaves an
			injected wrapper sitting at display: none — out of the tab order and out of the
			accessibility tree — which is the price of being able to come back up without a reload.
		*/
		if (!window.BX || !BX.UI || !BX.UI.Button) { return; }
		var hosts = document.querySelectorAll(HOST_SELECTOR);
		for (var i = 0; i < hosts.length; i++) {
			/*
				The splitter is an extra on top of the card, and it shares BX.ready with the code that
				builds the card itself. Whatever goes wrong here must not take the editor down with it.
			*/
			try { wire(hosts[i]); }
			catch (e) { console.error("crm.entity.details: column splitter disabled", e); }
		}
	}

	BX.ready(init);
})();
//endregion
