BX.namespace("BX.Crm");

if(typeof BX.Crm.EntityEditorDupManager === "undefined")
{
	BX.Crm.EntityEditorDupManager = function()
	{
		this._id = "";
		this._settings = null;
		this._groupInfos = null;

		this._isEnabled = false;
		this._serviceUrl = "";
		this._entityTypeName = "";
		this._form = null;
		this._controller = null;
	};
	BX.Crm.EntityEditorDupManager.prototype =
		{
			initialize: function(id, settings)
			{
				this._id = BX.type.isNotEmptyString(id) ? id : BX.util.getRandomString(4);
				this._settings = settings ? settings : {};

				this._isEnabled = BX.prop.getBoolean(this._settings, "enabled", "");
				if(!this._isEnabled)
				{
					return;
				}

				this._groupInfos = BX.prop.getObject(this._settings, "groups", {});

				this._serviceUrl = BX.prop.getString(this._settings, "serviceUrl", "");
				this._entityTypeName = BX.prop.getString(this._settings, "entityTypeName", "");
				this._form = BX.prop.get(this._settings, "form", null);
				this._ignoredItems = BX.prop.getArray(this._settings, 'ignoredItems', []);

				this._controller = BX.CrmDupController.create(
					this._id,
					{
						serviceUrl: this._serviceUrl,
						entityTypeName: this._entityTypeName,
						isSingleMode: BX.prop.getBoolean(settings, "isSingleMode", false),
						form: this._form,
						clientSearchBox: BX.prop.get(this._settings, 'clientSearchBox', null),
						enableEntitySelect: BX.prop.getBoolean(this._settings, 'enableEntitySelect', false),
						searcSummaryPosition: "right",
						ignoredItems: this._ignoredItems,
					}
				);
			},
			isEnabled: function()
			{
				return this._isEnabled;
			},
			isSingleMode: function ()
			{
				return this._controller.isSingleMode();
			},
			search: function()
			{
				this._controller.initialSearch();
			},
			getGroupInfo: function(groupId)
			{
				return this._groupInfos.hasOwnProperty(groupId) ? this._groupInfos[groupId] : null;
			},
			getGroup: function(groupId)
			{
				return this._isEnabled ? this._controller.getGroup(groupId) : null;
			},
			ensureGroupRegistered: function(groupId)
			{
				if(!this._isEnabled)
				{
					return null;
				}

				var group = this.getGroup(groupId);
				if(!group)
				{
					group = this._controller.registerGroup(groupId, this.getGroupInfo(groupId));
				}
				return group;
			},
			registerField: function(config)
			{
				if(!this._isEnabled)
				{
					return null;
				}

				var groupId = BX.prop.getString(config, "groupId", "");
				var field = BX.prop.getObject(config, "field", null);
				if(groupId === "" || !field)
				{
					return null;
				}

				var group = this.ensureGroupRegistered(groupId);
				if(!group)
				{
					return null;
				}

				return group.registerField(field);
			},
			unregisterField: function(config)
			{
				if(!this._isEnabled)
				{
					return;
				}

				var groupId = BX.prop.getString(config, "groupId", "");
				var field = BX.prop.getObject(config, "field", null);
				if(groupId === "" || !field)
				{
					return;
				}

				var group = this.getGroup(groupId);
				if(!group)
				{
					return;
				}

				group.unregisterField(field);
			}
		};
	BX.Crm.EntityEditorDupManager.create = function(id, settings)
	{
		var self = new BX.Crm.EntityEditorDupManager();
		self.initialize(id, settings);
		return self;
	};
}

if(typeof BX.Crm.EntityBizprocManager === "undefined")
{
	BX.Crm.EntityBizprocManager = function()
	{
		this._id = "";
		this._settings = {};
		this._moduleId = "";
		this._entity = "";
		this._documentType = "";
		this._autoExecuteType = 0;
		this._categoryId = null;

		this._containerId = null;
		this._fieldName = null;

		this._validParameters = null;
		this._formInput = null;

		this._editor = null;
		this._starter = null;
	};
	BX.Crm.EntityBizprocManager.prototype =
		{
			initialize: function(id, settings)
			{
				this._id = BX.type.isNotEmptyString(id) ? id : BX.util.getRandomString(4);
				this._settings = settings ? settings : {};
				this._hasParameters = BX.prop.getBoolean(this._settings, "hasParameters", false);
				this._autoExecuteType = BX.prop.getInteger(this._settings, "autoExecuteType", 0);
				this._categoryId = this.resolveCategoryId(BX.prop.get(this._settings, 'categoryId', null));
				this._containerId = BX.prop.getString(this._settings, "containerId", '');
				this._fieldName = BX.prop.getString(this._settings, "fieldName", '');
				this._contentNode = this._containerId ? BX(this._containerId) : null;

				if (this._hasParameters || this.canCheckAutoStartParameters())
				{
					this._starter = new BX.Bizproc.Starter({
						signedDocumentType: BX.prop.getString(this._settings, 'signedDocumentType', ''),
						signedDocumentId: BX.prop.getString(this._settings, 'signedDocumentId', ''),
						categoryId: this._categoryId,
					});
				}
			},
			/**
			 *
			 * @param {BX.Crm.EntityValidationResult} result
			 * @returns {BX.Promise}
			 */
			onBeforeSave: function(result)
			{
				var promise = new BX.Promise();

				var deferredWaiter = function()
				{
					window.setTimeout(
						BX.delegate(
							function()
							{
								promise.fulfill();
							},
							this
						),
						0
					);
				};

				if (
					this._validParameters !== null
					&& this.canCheckAutoStartParameters()
					&& this.getCurrentCategoryId() !== this._categoryId
				)
				{
					this._validParameters = null;
					if (this._formInput)
					{
						BX.remove(this._formInput);
						this._formInput = null;
					}
				}

				if(result.getStatus() && this._validParameters === null && this._starter)
				{
					var currentCategoryId = this.getCurrentCategoryId();

					try
					{
						var showPopup = () => {
							this._starter.showAutoStartParametersPopup(
								this._autoExecuteType,
								{
									categoryId: this.getCurrentCategoryId(),
									contentNode: this._contentNode,
									callback: this.onFillParameters.bind(this, promise)
								}
							);
							this._contentNode = null;
						};

						if (this.canCheckAutoStartParameters() && currentCategoryId !== this._categoryId)
						{
							this._starter.hasAutoStartParameters(
								this._autoExecuteType,
									{ categoryId: currentCategoryId }
							)
								.then((hasParameters) => {
									this._categoryId = currentCategoryId;
									this._hasParameters = hasParameters;

									if (hasParameters)
									{
										showPopup();

										return;
									}

									deferredWaiter();
								})
								.catch(() => {
									deferredWaiter();
								})
							;
						}
						else if (this._hasParameters)
						{
							showPopup();
						}
						else
						{
							deferredWaiter();
						}
					}
					catch (e)
					{
						if ('console' in window)
						{
							window.console.log('Error occurred when bizproc popup is going to show', e);
						}
						deferredWaiter();
					}
				}
				else
				{
					deferredWaiter();
				}

				return promise;
			},

			canCheckAutoStartParameters: function()
			{
				return (
					typeof BX.Bizproc !== 'undefined'
					&& BX.Bizproc.Starter
					&& BX.type.isFunction(BX.Bizproc.Starter.prototype.hasAutoStartParameters)
				);
			},

			onAfterSave: function()
			{
				this._validParameters = null;
			},

			getCurrentCategoryId: function()
			{
				if (!this._editor || !BX.type.isFunction(this._editor.getModel))
				{
					return this._categoryId;
				}

				var model = this._editor.getModel();
				if (!model || !BX.type.isFunction(model.getField))
				{
					return this._categoryId;
				}

				var value = model.getField('CATEGORY_ID', this._categoryId);

				return this.resolveCategoryId(value);
			},

			resolveCategoryId: function(value)
			{
				if (
					BX.Type.isNil(value)
					|| (BX.Type.isString(value) && !BX.Type.isStringFilled(value))
					|| (!BX.Type.isNumber(value) && !BX.Type.isString(value))
				)
				{
					return null;
				}

				var categoryId = parseInt(value, 10);

				return isNaN(categoryId) ? null : categoryId;
			},

			onFillParameters: function(promise, data)
			{
				this._validParameters = data ? data.parameters : null;

				if (!BX.Type.isString(this._validParameters))
				{
					this._validParameters = null;
					if (this._formInput)
					{
						BX.remove(this._formInput);
						this._formInput = null;
					}

					promise.fulfill();

					return;
				}

				if (!this._formInput && this._editor)
				{
					var form = this._editor.getFormElement();
					this._formInput = BX.create("input", { props: { type: "hidden", name: this._fieldName } });
					form.appendChild(this._formInput);
				}

				if (this._formInput)
				{
					this._formInput.value = this._validParameters;
				}

				promise.fulfill();
			}
		};
	if(typeof(BX.Crm.EntityBizprocManager.messages) === "undefined")
	{
		BX.Crm.EntityBizprocManager.messages = {};
	}
	BX.Crm.EntityBizprocManager.items = {};
	BX.Crm.EntityBizprocManager.create = function(id, settings)
	{
		var self = new BX.Crm.EntityBizprocManager();
		self.initialize(id, settings);
		this.items[id] = self;
		return self;
	};
}

if(typeof BX.Crm.EntityRestPlacementManager === "undefined")
{
	const PLACEMENT_SECTION_SELECTOR = '.crm-entity-section[data-tab-id^="tab_rest_"]';
	const PLACEMENT_LAYOUT_SELECTOR = ':scope > .app-frame-layout';
	const PLACEMENT_MIN_HEIGHT = 300;
	const PLACEMENT_FIT_DELAY = 100;
	const PLACEMENT_SETTLE_DELAY = 100;

	BX.Crm.EntityRestPlacementManager = function()
	{
		this._id = "";
		this._detailTabPlacement = "";

		this._editor = null;

		this._fitTimeout = null;
		this._settleTimeout = null;
		this._fitHandler = null;
		this._resizeHandler = null;
		this._documentClickHandler = null;
		this._placementObservers = [];
	};

	BX.Crm.EntityRestPlacementManager.items = {};
	BX.Crm.EntityRestPlacementManager.prototype = {
		initialize: function(id, settings)
		{
			this._id = BX.type.isNotEmptyString(id) ? id : BX.util.getRandomString(4);
			this._settings = settings ? settings : {};
			this._detailTabPlacement = this.getSetting("detail_tab_placement");

			var bottomButton = BX(this.getSetting("bottom_button_id"));
			if(bottomButton)
			{
				BX.bind(bottomButton, 'click', BX.proxy(this.openMarketplace, this));
			}

			this._fitHandler = BX.proxy(this.scheduleFit, this);
			this._resizeHandler = BX.proxy(this.onWindowResize, this);
			this._documentClickHandler = BX.proxy(this.onDocumentClick, this);

			BX.addCustomEvent(window, 'onEntityDetailsTabShow', this._fitHandler);
			BX.bind(window, 'resize', this._resizeHandler);
			BX.bind(document, 'click', this._documentClickHandler);
			BX.ready(BX.proxy(this.observePlacements, this));

			BX.defer(this.initializeInterface, this)();
		},

		observePlacements: function()
		{
			if(typeof MutationObserver === "undefined")
			{
				return;
			}

			var sections = document.querySelectorAll(PLACEMENT_SECTION_SELECTOR);
			for(var i = 0; i < sections.length; i++)
			{
				if(this.getPlacementLayout(sections[i]))
				{
					continue;
				}

				var observer = new MutationObserver(this._fitHandler);
				observer.observe(sections[i], { childList: true });

				this._placementObservers.push({ section: sections[i], observer: observer });
			}
		},

		stopObservingPlacement: function(section)
		{
			for(var i = this._placementObservers.length - 1; i >= 0; i--)
			{
				if(this._placementObservers[i].section === section)
				{
					this._placementObservers[i].observer.disconnect();
					this._placementObservers.splice(i, 1);
				}
			}
		},

		onWindowResize: function()
		{
			clearTimeout(this._fitTimeout);
			this._fitTimeout = setTimeout(this._fitHandler, PLACEMENT_FIT_DELAY);
		},

		onDocumentClick: function(event)
		{
			if(event.target && event.target.closest && event.target.closest('.app-update-close'))
			{
				this.scheduleFit();
			}
		},

		scheduleFit: function()
		{
			var fit = BX.proxy(this.fitPlacements, this);

			requestAnimationFrame(function()
			{
				requestAnimationFrame(fit);
			});

			clearTimeout(this._settleTimeout);
			this._settleTimeout = setTimeout(fit, PLACEMENT_SETTLE_DELAY);
		},

		fitPlacements: function()
		{
			var sections = document.querySelectorAll(PLACEMENT_SECTION_SELECTOR);
			for(var i = 0; i < sections.length; i++)
			{
				var layout = this.getPlacementLayout(sections[i]);
				if(layout)
				{
					this.stopObservingPlacement(sections[i]);
					this.fitPlacement(layout);
				}
			}
		},

		getPlacementLayout: function(section)
		{
			return section.querySelector(PLACEMENT_LAYOUT_SELECTOR);
		},

		fitPlacement: function(layout)
		{
			if(layout.dataset.appHeight === 'Y' || layout.offsetParent === null)
			{
				return;
			}

			if(layout.dataset.cardFit !== 'Y')
			{
				layout.dataset.cardFit = 'Y';

				if(layout.style.height !== '')
				{
					layout.dataset.appHeight = 'Y';

					return;
				}
			}

			var scroller = document.scrollingElement || document.documentElement;

			layout.style.height = window.innerHeight + 'px';
			var fitted = layout.offsetHeight - (scroller.scrollHeight - scroller.clientHeight);

			layout.style.height = Math.max(fitted, PLACEMENT_MIN_HEIGHT) + 'px';
		},

		openMarketplace: function()
		{
			BX.rest.Marketplace.open({
				PLACEMENT: this.getSetting("placement")
			});
		},

		getSetting: function(name)
		{
			return BX.prop.getString(this._settings, name, '')
		},

		initializeInterface: function()
		{
			if(!!BX.rest && !!BX.rest.AppLayout && this._detailTabPlacement !== '')
			{
				var PlacementInterface = BX.rest.AppLayout.initializePlacement(this._detailTabPlacement);

				var entityTypeId = this._editor._entityTypeId, entityId = this._editor._entityId;

				PlacementInterface.prototype.resizeWindow = function(params, cb)
				{
					var f = BX(this.params.layoutName);
					params.height = parseInt(params.height);

					if(!!params.height)
					{
						f.dataset.appHeight = 'Y';
						f.style.height = params.height + 'px';
					}

					var p = BX.pos(f);
					cb({width: p.width, height: p.height});
				};

				PlacementInterface.prototype.reloadData = function(params, cb)
				{
					BX.Crm.EntityEvent.fireUpdate(entityTypeId, entityId, '');
					cb();
				};
			}
		}
	};

	BX.Crm.EntityRestPlacementManager.create = function(id, settings)
	{
		var self = new BX.Crm.EntityRestPlacementManager();
		self.initialize(id, settings);
		this.items[id] = self;
		return self;
	};
}
