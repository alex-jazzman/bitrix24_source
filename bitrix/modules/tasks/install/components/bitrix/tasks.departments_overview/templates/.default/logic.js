'use strict';

if (typeof(BX.FilterEntitySelector) === "undefined")
{
	BX.FilterEntitySelector = function() {
		this._id = "";
		this._settings = {};
		this._fieldId = "";
		this._control = null;
		this._selector = null;

		this._inputKeyPressHandler = BX.delegate(this.keypress, this);
	};

	BX.FilterEntitySelector.prototype =
		{
			initialize: function(id, settings) {
				this._id = id;
				this._settings = settings ? settings : {};
				this._fieldId = this.getSetting("fieldId", "");

				BX.addCustomEvent(window, "BX.Main.Filter:customEntityFocus", BX.delegate(this.onCustomEntitySelectorOpen, this));
				BX.addCustomEvent(window, "BX.Main.Filter:customEntityBlur", BX.delegate(this.onCustomEntitySelectorClose, this));

			},
			getId: function() {
				return this._id;
			},
			getSetting: function(name, defaultval) {
				return this._settings.hasOwnProperty(name) ? this._settings[name] : defaultval;
			},
			keypress: function(e) {
				//e.target.value
			},
			open: function(field, query) {
				this._selector = new BX.Tasks.Integration.Socialnetwork.NetworkSelector({
					scope: field,
					id: this.getId() + "-selector",
					mode: this.getSetting("mode"),
					query: false,
					useSearch: true,
					useAdd: false,
					parent: this,
					popupOffsetTop: 5,
					popupOffsetLeft: 40
				});
				this._selector.bindEvent("item-selected", BX.delegate(function(data) {
					this._control.setData(BX.util.htmlspecialcharsback(data.nameFormatted), data.id);
					if (!this.getSetting("multi"))
					{
						this._selector.close();
					}
				}, this));
				this._selector.open();
			},
			close: function() {
				if (this._selector)
				{
					this._selector.close();
				}
			},
			onCustomEntitySelectorOpen: function(control) {
				this._control = control;

				//BX.bind(control.field, "keyup", this._inputKeyPressHandler);

				if (this._fieldId !== control.getId())
				{
					this._selector = null;
					this.close();
				}
				else
				{
					this._selector = control;
					this.open(control.field);
				}
			},
			onCustomEntitySelectorClose: function(control) {
				if (this._fieldId !== control.getId())
				{
					this.close();
					//BX.unbind(control.field, "keyup", this._inputKeyPressHandler);
				}
			}
		};
	BX.FilterEntitySelector.closeAll = function() {
		for (var k in this.items)
		{
			if (this.items.hasOwnProperty(k))
			{
				this.items[k].close();
			}
		}
	};
	BX.FilterEntitySelector.items = {};
	BX.FilterEntitySelector.create = function(id, settings) {
		var self = new BX.FilterEntitySelector(id, settings);
		self.initialize(id, settings);
		this.items[self.getId()] = self;
		return self;
	};
}

(function(){

	BX.namespace('Tasks.Component');

	if(typeof BX.Tasks.Component.TasksDepartmentsOverview != 'undefined')
	{
		return;
	}

	/**
	 * Main js controller for this template
	 */
	BX.Tasks.Component.TasksDepartmentsOverview = BX.Tasks.Component.extend({
		sys: {
			code: 'departments-overview'
		},
		methods: {
			construct: function()
			{
				this.callConstruct(BX.Tasks.Component);
				this.departmentFilterFocus = null;
				this.departmentFilterFocusResetTimeout = null;
				this.departmentFilterApplication = null;
				this.clearAnalyticsParams();
			},

			clearAnalyticsParams: function()
			{
				BX.Runtime.loadExtension('main.core')
					.then(({ Uri }) => {
						const uri = new Uri(window.location.href);

						const section = uri.getQueryParam('ta_sec');
						if (section)
						{
							uri.removeQueryParam('ta_cat', 'ta_sec', 'ta_sub', 'ta_el', 'p1', 'p2', 'p3', 'p4', 'p5');

							window.history.replaceState(null, null, uri.toString());
						}
					});
			},

			bindEvents: function()
			{
				BX.addCustomEvent('BX.Main.Filter:apply', this.onFilterApply.bind(this));
				BX.addCustomEvent(window, 'BX.Main.Filter:beforeApply', this.onFilterBeforeApply.bind(this));
				BX.addCustomEvent('SidePanel.Slider:onClose', this.onSliderClose.bind(this));

				var filterId = this.option('filterId');
				var scope = this.scope();

				scope.addEventListener('click', BX.delegate(function(event) {
					var button = event.target.closest && event.target.closest('button.js-id-department');
					if (!button || !scope.contains(button))
					{
						return;
					}

					event.stopPropagation();

					var filter = BX.Main.filterManager.getById(filterId);
					if (!filter || !(filter instanceof BX.Main.Filter))
					{
						return;
					}

					var focusData = this.rememberDepartmentFilterFocus(event, button);
					var filterApi = filter.getApi();
					filterApi.setFields({'UF_DEPARTMENT': {0: button.dataset.departmentId}});

					this.departmentFilterApplication = focusData;
					try
					{
						filterApi.apply();
						if (focusData)
						{
							focusData.trackFocusChanges = true;
						}
					}
					catch (error)
					{
						this.clearDepartmentFilterFocus(focusData);
						throw error;
					}
					finally
					{
						this.departmentFilterApplication = null;
					}
				}, this), true);
			},

			rememberDepartmentFilterFocus: function(event, button)
			{
				this.clearDepartmentFilterFocus();

				if (event.detail !== 0)
				{
					return null;
				}

				var focusData = {
					departmentId: button.dataset.departmentId,
					userId: button.dataset.userId,
					departmentName: button.textContent.trim(),
					button: button,
					focusMoved: false,
					trackFocusChanges: false,
					onFocusIn: null,
					onUserInteraction: null,
					onWindowBlur: null
				};
				focusData.onFocusIn = function(focusEvent) {
					if (focusData.trackFocusChanges && focusEvent.target !== focusData.button)
					{
						focusData.focusMoved = true;
					}
				};
				focusData.onUserInteraction = function(interactionEvent) {
					if (focusData.trackFocusChanges && interactionEvent.target !== focusData.button)
					{
						focusData.focusMoved = true;
					}
				};
				focusData.onWindowBlur = function() {
					if (focusData.trackFocusChanges)
					{
						focusData.focusMoved = true;
					}
				};

				this.departmentFilterFocus = focusData;
				document.addEventListener('focusin', focusData.onFocusIn, true);
				document.addEventListener('keydown', focusData.onUserInteraction, true);
				document.addEventListener('pointerdown', focusData.onUserInteraction, true);
				window.addEventListener('blur', focusData.onWindowBlur);

				var status = this.scope().querySelector('.tasks-departments-overview-status');
				if (status)
				{
					status.textContent = '';
				}

				this.departmentFilterFocusResetTimeout = window.setTimeout(BX.delegate(function() {
					if (this.departmentFilterFocus === focusData)
					{
						this.clearDepartmentFilterFocus(focusData);
					}
				}, this), 60000);

				return focusData;
			},

			clearDepartmentFilterFocus: function(focusData)
			{
				if (focusData && this.departmentFilterFocus !== focusData)
				{
					return;
				}

				var currentFocusData = this.departmentFilterFocus;
				this.departmentFilterFocus = null;
				window.clearTimeout(this.departmentFilterFocusResetTimeout);
				this.departmentFilterFocusResetTimeout = null;

				if (currentFocusData && currentFocusData.onFocusIn)
				{
					document.removeEventListener('focusin', currentFocusData.onFocusIn, true);
					document.removeEventListener('keydown', currentFocusData.onUserInteraction, true);
					document.removeEventListener('pointerdown', currentFocusData.onUserInteraction, true);
					window.removeEventListener('blur', currentFocusData.onWindowBlur);
				}
			},

			onFilterBeforeApply: function(filterId, action, filter, promise)
			{
				var focusData = this.departmentFilterApplication;
				if (
					!focusData
					|| this.departmentFilterFocus !== focusData
					|| filterId !== this.option('filterId')
					|| !promise
					|| typeof promise.then !== 'function'
				)
				{
					return;
				}

				promise.then(
					BX.delegate(function() {
						this.restoreDepartmentFilterFocus(focusData);
					}, this),
					BX.delegate(function() {
						this.clearDepartmentFilterFocus(focusData);
					}, this)
				);
			},

			restoreDepartmentFilterFocus: function(focusData)
			{
				if (this.departmentFilterFocus !== focusData)
				{
					return;
				}

				var shouldRestoreFocus = !focusData.focusMoved;
				this.clearDepartmentFilterFocus(focusData);

				var scope = this.scope();
				var status = scope.querySelector('.tasks-departments-overview-status');

				if (status)
				{
					var statusMessage = BX.message('TASKS_DEPARTMENTS_OVERVIEW_FILTER_APPLIED') || '#DEPARTMENT#';
					status.textContent = statusMessage
						.replace('#DEPARTMENT#', function() {
							return focusData.departmentName;
						});
				}

				if (shouldRestoreFocus)
				{
					var target = scope.querySelector(
						'.js-id-department[data-department-id="' + focusData.departmentId + '"]'
						+ '[data-user-id="' + focusData.userId + '"]'
					);

					if (!target)
					{
						target = scope.querySelector('.js-id-departments-overview-grid');
					}

					if (target)
					{
						target.focus({preventScroll: true});
					}
				}
			},

			onFilterApply: function()
			{
				if (this.option('taskLimitExceeded'))
				{
					BX.UI.InfoHelper.show('limit_tasks_supervisor_view', {
						isLimit: true,
						limitAnalyticsLabels: {
							module: 'tasks',
							source: 'filter'
						}
					});
				}
			},

			onSliderClose: function(event)
			{
				if (event.getSlider().getUrl() === 'ui:info_helper')
				{
					window.location.href = this.option('pathToTasks');
				}
			}
		}
	});

	// may be some sub-controllers here...

}).call(this);
