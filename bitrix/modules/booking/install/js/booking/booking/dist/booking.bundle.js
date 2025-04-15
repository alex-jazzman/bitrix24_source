/* eslint-disable */
this.BX = this.BX || {};
(function (exports,booking_component_mixin_locMixin,main_loader,booking_provider_service_mainPageService,booking_provider_service_dictionaryService,booking_provider_service_calendarService,main_core_events,ui_counterpanel,ui_cnt,ui_vue3_components_richLoc,booking_lib_drag,ui_notificationManager,booking_provider_service_bookingActionsService,booking_component_loader,booking_component_actionsPopup,booking_lib_mousePosition,booking_component_timeSelector,booking_component_notePopup,ui_vue3_directives_hint,ui_iconSet_crm,booking_lib_dealHelper,booking_component_counter,booking_lib_isRealId,booking_component_popup,booking_lib_checkBookingIntersection,booking_model_bookings,booking_model_clients,booking_lib_grid,booking_lib_inInterval,booking_lib_range,booking_core,ui_datePicker,booking_lib_removeBooking,booking_lib_currencyFormat,booking_component_statisticsPopup,ui_dialogs_messagebox,ui_hint,booking_provider_service_resourcesService,ui_iconSet_actions,booking_resourceCreationWizard,booking_provider_service_resourceDialogService,booking_lib_resources,booking_lib_resourcesDateCache,main_popup,ui_iconSet_api_vue,ui_iconSet_main,booking_provider_service_optionService,booking_lib_helpDesk,booking_lib_busySlots,ui_entitySelector,booking_lib_limit,booking_provider_service_bookingService,booking_provider_service_clientService,ui_ears,main_date,booking_lib_duration,booking_component_clientPopup,booking_component_button,booking_lib_analytics,ui_autoLaunch,ui_vue3_vuex,main_core,ui_vue3,ui_bannerDispatcher,booking_lib_resolvable,booking_const,booking_lib_ahaMoments) {
	'use strict';

	const cellHeight = 50;
	const cellHeightProperty = '--booking-off-hours-cell-height';
	const classCollapse = '--booking-booking-collapse';
	const classExpand = '--booking-booking-expand';
	var _animation = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("animation");
	var _container = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("container");
	var _content = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("content");
	var _gridWrap = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("gridWrap");
	var _fromHour = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("fromHour");
	var _toHour = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("toHour");
	class ExpandOffHours {
	  constructor() {
	    Object.defineProperty(this, _toHour, {
	      get: _get_toHour,
	      set: void 0
	    });
	    Object.defineProperty(this, _fromHour, {
	      get: _get_fromHour,
	      set: void 0
	    });
	    Object.defineProperty(this, _gridWrap, {
	      get: _get_gridWrap,
	      set: void 0
	    });
	    Object.defineProperty(this, _content, {
	      get: _get_content,
	      set: void 0
	    });
	    Object.defineProperty(this, _container, {
	      get: _get_container,
	      set: void 0
	    });
	    Object.defineProperty(this, _animation, {
	      writable: true,
	      value: void 0
	    });
	  }
	  expand({
	    keepScroll
	  }) {
	    main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container], classCollapse);
	    main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container], classExpand);
	    this.animate(0, cellHeight, keepScroll);
	  }
	  collapse() {
	    main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container], classExpand);
	    main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container], classCollapse);
	    this.animate(cellHeight, 0, true);
	  }
	  animate(fromHeight, toHeight, keepScroll = false) {
	    var _babelHelpers$classPr;
	    const savedScrollTop = babelHelpers.classPrivateFieldLooseBase(this, _gridWrap)[_gridWrap].scrollTop;
	    const savedScrollHeight = babelHelpers.classPrivateFieldLooseBase(this, _gridWrap)[_gridWrap].scrollHeight;
	    const topCellsCoefficient = babelHelpers.classPrivateFieldLooseBase(this, _fromHour)[_fromHour] / (24 - (babelHelpers.classPrivateFieldLooseBase(this, _toHour)[_toHour] - babelHelpers.classPrivateFieldLooseBase(this, _fromHour)[_fromHour]));
	    (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _animation)[_animation]) == null ? void 0 : _babelHelpers$classPr.stop();
	    babelHelpers.classPrivateFieldLooseBase(this, _animation)[_animation] = new BX.easing({
	      duration: 200,
	      start: {
	        height: fromHeight
	      },
	      finish: {
	        height: toHeight
	      },
	      step: ({
	        height
	      }) => {
	        main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _content)[_content], cellHeightProperty, `calc(var(--zoom) * ${height}px)`);
	        if (keepScroll) {
	          const heightChange = babelHelpers.classPrivateFieldLooseBase(this, _gridWrap)[_gridWrap].scrollHeight - savedScrollHeight;
	          babelHelpers.classPrivateFieldLooseBase(this, _gridWrap)[_gridWrap].scrollTop = savedScrollTop + heightChange * topCellsCoefficient;
	        }
	      }
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _animation)[_animation].animate();
	  }
	  setExpanded(isExpanded) {
	    const savedScrollTop = babelHelpers.classPrivateFieldLooseBase(this, _gridWrap)[_gridWrap].scrollTop;
	    const savedScrollHeight = babelHelpers.classPrivateFieldLooseBase(this, _gridWrap)[_gridWrap].scrollHeight;
	    const topCellsCoefficient = babelHelpers.classPrivateFieldLooseBase(this, _fromHour)[_fromHour] / (24 - (babelHelpers.classPrivateFieldLooseBase(this, _toHour)[_toHour] - babelHelpers.classPrivateFieldLooseBase(this, _fromHour)[_fromHour]));
	    const height = isExpanded ? cellHeight : 0;
	    const className = isExpanded ? classExpand : classCollapse;
	    main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container], [classCollapse, classExpand]);
	    main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container], className);
	    main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _content)[_content], cellHeightProperty, `calc(var(--zoom) * ${height}px)`);
	    const heightChange = babelHelpers.classPrivateFieldLooseBase(this, _gridWrap)[_gridWrap].scrollHeight - savedScrollHeight;
	    babelHelpers.classPrivateFieldLooseBase(this, _gridWrap)[_gridWrap].scrollTop = savedScrollTop + heightChange * topCellsCoefficient;
	    void booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/setOffHoursExpanded`, isExpanded);
	  }
	}
	function _get_container() {
	  return booking_core.Core.getParams().container;
	}
	function _get_content() {
	  return BX('booking-content');
	}
	function _get_gridWrap() {
	  return BX('booking-booking-grid-wrap');
	}
	function _get_fromHour() {
	  return booking_core.Core.getStore().getters['interface/fromHour'];
	}
	function _get_toHour() {
	  return booking_core.Core.getStore().getters['interface/toHour'];
	}
	const expandOffHours = new ExpandOffHours();

	const FilterPreset = Object.freeze({
	  NotConfirmed: 'booking-filter-preset-unconfirmed',
	  Delayed: 'booking-filter-preset-delayed',
	  CreatedByMe: 'booking-filter-preset-created-by-me'
	});
	const FilterField = Object.freeze({
	  CreatedBy: 'CREATED_BY',
	  Contact: 'CONTACT',
	  Company: 'COMPANY',
	  Resource: 'RESOURCE',
	  Confirmed: 'CONFIRMED',
	  Delayed: 'DELAYED'
	});
	const Filter = {
	  emits: ['apply', 'clear'],
	  props: {
	    filterId: {
	      type: String,
	      required: true
	    }
	  },
	  data() {
	    return {
	      filter: null
	    };
	  },
	  created() {
	    this.filter = BX.Main.filterManager.getById(this.filterId);
	    main_core_events.EventEmitter.subscribe('BX.Main.Filter:beforeApply', this.onBeforeApply);
	  },
	  methods: {
	    onBeforeApply(event) {
	      const [filterId] = event.getData();
	      if (filterId !== this.filterId) {
	        return;
	      }
	      if (this.isFilterEmpty()) {
	        this.$emit('clear');
	      } else {
	        this.$emit('apply');
	      }
	    },
	    setPresetId(presetId) {
	      if (this.getPresetId() === presetId) {
	        return;
	      }
	      this.filter.getApi().setFilter({
	        preset_id: presetId
	      });
	    },
	    getPresetId() {
	      const preset = this.filter.getPreset().getCurrentPresetId();
	      return preset === 'tmp_filter' ? null : preset;
	    },
	    isFilterEmpty() {
	      return Object.keys(this.getFields()).length === 0;
	    },
	    getFields() {
	      const booleanFields = [FilterField.Confirmed, FilterField.Delayed];
	      const arrayFields = [FilterField.Company, FilterField.Contact, FilterField.CreatedBy, FilterField.Resource];
	      const filterFields = this.filter.getFilterFieldsValues();
	      const fields = booleanFields.filter(field => ['Y', 'N'].includes(filterFields[field])).reduce((acc, field) => ({
	        ...acc,
	        [field]: filterFields[field]
	      }), {});
	      arrayFields.forEach(field => {
	        var _filterFields$field;
	        if (((_filterFields$field = filterFields[field]) == null ? void 0 : _filterFields$field.length) > 0) {
	          fields[field] = filterFields[field];
	        }
	      });
	      return fields;
	    }
	  },
	  template: `
		<div></div>
	`
	};

	const CounterItem = Object.freeze({
	  NotConfirmed: 'not-confirmed',
	  Delayed: 'delayed'
	});
	const CountersPanel = {
	  emits: ['activeItem'],
	  props: {
	    target: HTMLElement
	  },
	  mounted() {
	    this.addCounterPanel();
	    main_core_events.EventEmitter.subscribe('BX.UI.CounterPanel.Item:activate', this.onActiveItem);
	    main_core_events.EventEmitter.subscribe('BX.UI.CounterPanel.Item:deactivate', this.onActiveItem);
	  },
	  computed: ui_vue3_vuex.mapGetters({
	    counters: 'counters/get'
	  }),
	  methods: {
	    setItem(itemId) {
	      if (this.getActiveItem() === itemId) {
	        return;
	      }
	      Object.values(CounterItem).forEach(id => this.counterPanel.getItemById(id).deactivate());
	      const item = this.counterPanel.getItemById(itemId);
	      item == null ? void 0 : item.activate();
	    },
	    addCounterPanel() {
	      this.counterPanel = new ui_counterpanel.CounterPanel({
	        target: this.target,
	        items: [{
	          id: CounterItem.NotConfirmed,
	          title: this.loc('BOOKING_BOOKING_COUNTER_PANEL_NOT_CONFIRMED'),
	          value: this.counters.unConfirmed,
	          color: getFieldName(ui_cnt.CounterColor, ui_cnt.CounterColor.THEME)
	        }, {
	          id: CounterItem.Delayed,
	          title: this.loc('BOOKING_BOOKING_COUNTER_PANEL_DELAYED'),
	          value: this.counters.delayed
	        }]
	      });
	      this.counterPanel.init();
	    },
	    onActiveItem() {
	      this.$emit('activeItem', this.getActiveItem());
	    },
	    getActiveItem() {
	      var _this$counterPanel$ge, _this$counterPanel$ge2;
	      return (_this$counterPanel$ge = (_this$counterPanel$ge2 = this.counterPanel.getItems().find(({
	        isActive
	      }) => isActive)) == null ? void 0 : _this$counterPanel$ge2.id) != null ? _this$counterPanel$ge : null;
	    }
	  },
	  watch: {
	    counters(counters) {
	      this.counterPanel.getItems().forEach(item => {
	        if (item.id === CounterItem.NotConfirmed) {
	          item.updateColor(getFieldName(ui_cnt.CounterColor, ui_cnt.CounterColor.DANGER));
	          item.updateValue(counters.unConfirmed);
	        }
	        if (item.id === CounterItem.Delayed) {
	          item.updateColor(getFieldName(ui_cnt.CounterColor, ui_cnt.CounterColor.DANGER));
	          item.updateValue(counters.delayed);
	        }
	      });
	    }
	  },
	  template: `
		<div></div>
	`
	};
	const getFieldName = (obj, field) => Object.entries(obj).find(([, value]) => value === field)[0];

	const Statistics = {
	  props: {
	    value: {
	      type: Number,
	      required: true
	    },
	    valueFormatted: {
	      type: String,
	      required: true
	    },
	    increasedValue: {
	      type: Number,
	      required: true
	    },
	    increasedValueFormatted: {
	      type: String,
	      required: true
	    },
	    popupId: {
	      type: String,
	      required: true
	    },
	    title: {
	      type: String,
	      required: true
	    },
	    rows: {
	      type: Array,
	      required: true
	    },
	    button: {
	      type: Object,
	      required: false
	    }
	  },
	  data() {
	    return {
	      isPopupShown: false
	    };
	  },
	  methods: {
	    onMouseEnter() {
	      this.clearTimeouts();
	      this.showTimeout = setTimeout(() => this.showPopup(), 100);
	    },
	    onMouseLeave() {
	      main_core.Event.unbind(document, 'mouseover', this.updateHoverElement);
	      main_core.Event.bind(document, 'mouseover', this.updateHoverElement);
	      this.clearTimeouts();
	      if (!this.button) {
	        this.closePopup();
	        return;
	      }
	      this.closeTimeout = setTimeout(() => {
	        var _this$popupContainer;
	        this.popupContainer = document.getElementById(this.popupId);
	        if (!((_this$popupContainer = this.popupContainer) != null && _this$popupContainer.contains(this.hoverElement)) && !this.$refs.container.contains(this.hoverElement)) {
	          this.closePopup();
	        }
	        if (this.popupContainer) {
	          main_core.Event.unbind(this.popupContainer, 'mouseleave', this.onMouseLeave);
	          main_core.Event.bind(this.popupContainer, 'mouseleave', this.onMouseLeave);
	        }
	      }, 100);
	    },
	    updateHoverElement(event) {
	      this.hoverElement = event.target;
	    },
	    showPopup() {
	      this.clearTimeouts();
	      this.isPopupShown = true;
	    },
	    closePopup() {
	      this.clearTimeouts();
	      this.isPopupShown = false;
	      main_core.Event.unbind(this.popupContainer, 'mouseleave', this.onMouseLeave);
	      main_core.Event.unbind(document, 'mouseover', this.updateHoverElement);
	    },
	    clearTimeouts() {
	      clearTimeout(this.closeTimeout);
	      clearTimeout(this.showTimeout);
	    },
	    close() {
	      this.closePopup();
	      this.$emit('close');
	    }
	  },
	  watch: {
	    value() {
	      var _this$$refs$animation;
	      (_this$$refs$animation = this.$refs.animation) == null ? void 0 : _this$$refs$animation.replaceWith(this.$refs.animation);
	    }
	  },
	  components: {
	    StatisticsPopup: booking_component_statisticsPopup.StatisticsPopup
	  },
	  template: `
		<div class="booking-toolbar-after-title-info-profit-container" ref="container">
			<div
				v-html="valueFormatted"
				class="booking-toolbar-after-title-info-profit"
				@click="showPopup"
				@mouseenter="onMouseEnter"
				@mouseleave="onMouseLeave"
			></div>
			<div
				v-if="increasedValue > 0"
				v-html="increasedValueFormatted"
				class="booking-toolbar-after-title-profit-increased"
				ref="animation"
			></div>
		</div>
		<StatisticsPopup
			v-if="isPopupShown"
			:popupId="popupId"
			:bindElement="$refs.container"
			:title="title"
			:rows="rows"
			:button="button"
			@close="close"
		/>
	`
	};

	const Clients = {
	  data() {
	    return {
	      increasedValue: 0
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      totalNewClientsToday: `${booking_const.Model.Interface}/totalNewClientsToday`,
	      totalClients: `${booking_const.Model.Interface}/totalClients`
	    }),
	    popupId() {
	      return 'booking-booking-after-title-clients-popup';
	    },
	    title() {
	      return this.loc('BOOKING_BOOKING_AFTER_TITLE_CLIENTS_POPUP_TITLE');
	    },
	    rows() {
	      return [{
	        title: this.loc('BOOKING_BOOKING_AFTER_TITLE_CLIENTS_POPUP_TOTAL_CLIENTS_TODAY'),
	        value: `+${this.totalNewClientsToday}`
	      }, {
	        title: this.loc('BOOKING_BOOKING_AFTER_TITLE_CLIENTS_POPUP_TOTAL_CLIENTS'),
	        value: `<div>${this.totalClients}</div>`
	      }];
	    },
	    button() {
	      return {
	        title: this.loc('BOOKING_BOOKING_CLIENTS_LIST'),
	        click: () => BX.SidePanel.Instance.open('/crm/contact/list/')
	      };
	    },
	    clientsProfitFormatted() {
	      return main_core.Loc.getMessagePlural('BOOKING_BOOKING_PLUS_NUM_CLIENTS', this.totalNewClientsToday, {
	        '#NUM#': this.totalNewClientsToday
	      });
	    },
	    increasedValueFormatted() {
	      return main_core.Loc.getMessagePlural('BOOKING_BOOKING_PLUS_NUM_CLIENTS', this.increasedValue, {
	        '#NUM#': this.increasedValue
	      });
	    }
	  },
	  watch: {
	    totalNewClientsToday(newValue, previousValue) {
	      this.increasedValue = newValue - previousValue;
	    }
	  },
	  components: {
	    Statistics
	  },
	  template: `
		<Statistics
			:value="totalNewClientsToday"
			:valueFormatted="clientsProfitFormatted"
			:increasedValue="increasedValue"
			:increasedValueFormatted="increasedValueFormatted"
			:popupId="popupId"
			:title="title"
			:rows="rows"
			:button="button"
		/>
	`
	};

	const Profit = {
	  data() {
	    return {
	      increasedValue: 0
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      moneyStatistics: `${booking_const.Model.Interface}/moneyStatistics`
	    }),
	    popupId() {
	      return 'booking-booking-after-title-profit-popup';
	    },
	    title() {
	      return this.loc('BOOKING_BOOKING_AFTER_TITLE_PROFIT_POPUP_TITLE');
	    },
	    rows() {
	      var _this$moneyStatistics, _this$moneyStatistics2, _this$moneyStatistics3, _this$moneyStatistics4;
	      const otherCurrencies = (_this$moneyStatistics = (_this$moneyStatistics2 = this.moneyStatistics) == null ? void 0 : (_this$moneyStatistics3 = _this$moneyStatistics2.month) == null ? void 0 : (_this$moneyStatistics4 = _this$moneyStatistics3.filter(({
	        currencyId
	      }) => currencyId !== this.baseCurrencyId)) == null ? void 0 : _this$moneyStatistics4.map(({
	        currencyId
	      }) => currencyId)) != null ? _this$moneyStatistics : [];
	      return [this.getTodayRow(this.baseCurrencyId), ...otherCurrencies.map(currencyId => this.getTodayRow(currencyId)), this.getMonthRow(this.baseCurrencyId), ...otherCurrencies.map(currencyId => this.getMonthRow(currencyId))];
	    },
	    todayProfit() {
	      return this.getTodayProfit(this.moneyStatistics);
	    },
	    todayProfitFormatted() {
	      return this.formatTodayProfit(this.todayProfit);
	    },
	    increasedValueFormatted() {
	      return this.formatTodayProfit(this.increasedValue);
	    },
	    baseCurrencyId() {
	      return booking_lib_currencyFormat.currencyFormat.getBaseCurrencyId();
	    }
	  },
	  methods: {
	    getTodayRow(currencyId) {
	      const title = this.loc('BOOKING_BOOKING_AFTER_TITLE_PROFIT_POPUP_TOTAL_TODAY');
	      return {
	        title: currencyId === this.baseCurrencyId ? title : '',
	        value: `+${this.getTodayProfitFormatted(currencyId)}`
	      };
	    },
	    getMonthRow(currencyId) {
	      const title = this.loc('BOOKING_BOOKING_AFTER_TITLE_PROFIT_POPUP_MONTH', {
	        '#MONTH#': main_date.DateTimeFormat.format('f')
	      });
	      return {
	        title: currencyId === this.baseCurrencyId ? title : '',
	        value: `<div>${this.getMonthProfitFormatted(currencyId)}</div>`
	      };
	    },
	    getTodayProfitFormatted(currency) {
	      var _this$moneyStatistics5, _this$moneyStatistics6, _statistics$opportuni;
	      const statistics = (_this$moneyStatistics5 = this.moneyStatistics) == null ? void 0 : (_this$moneyStatistics6 = _this$moneyStatistics5.today) == null ? void 0 : _this$moneyStatistics6.find(({
	        currencyId
	      }) => currencyId === currency);
	      const profit = (_statistics$opportuni = statistics == null ? void 0 : statistics.opportunity) != null ? _statistics$opportuni : 0;
	      return booking_lib_currencyFormat.currencyFormat.format(currency, profit);
	    },
	    getMonthProfitFormatted(currency) {
	      var _this$moneyStatistics7, _this$moneyStatistics8, _statistics$opportuni2;
	      const statistics = (_this$moneyStatistics7 = this.moneyStatistics) == null ? void 0 : (_this$moneyStatistics8 = _this$moneyStatistics7.month) == null ? void 0 : _this$moneyStatistics8.find(({
	        currencyId
	      }) => currencyId === currency);
	      const profit = (_statistics$opportuni2 = statistics == null ? void 0 : statistics.opportunity) != null ? _statistics$opportuni2 : 0;
	      return booking_lib_currencyFormat.currencyFormat.format(currency, profit);
	    },
	    getTodayProfit(statistics) {
	      var _statistics$today, _statistic$opportunit;
	      const statistic = statistics == null ? void 0 : (_statistics$today = statistics.today) == null ? void 0 : _statistics$today.find(({
	        currencyId
	      }) => currencyId === this.baseCurrencyId);
	      return (_statistic$opportunit = statistic == null ? void 0 : statistic.opportunity) != null ? _statistic$opportunit : 0;
	    },
	    formatTodayProfit(profit) {
	      return `+ <span>${booking_lib_currencyFormat.currencyFormat.format(this.baseCurrencyId, profit)}</span>`;
	    }
	  },
	  watch: {
	    moneyStatistics(newValue, previousValue) {
	      this.increasedValue = this.getTodayProfit(newValue) - this.getTodayProfit(previousValue);
	    }
	  },
	  components: {
	    Statistics
	  },
	  template: `
		<Statistics
			:value="todayProfit"
			:valueFormatted="todayProfitFormatted"
			:increasedValue="increasedValue"
			:increasedValueFormatted="increasedValueFormatted"
			:popupId="popupId"
			:title="title"
			:rows="rows"
		/>
	`
	};

	const AfterTitle = {
	  computed: {
	    dateFormatted() {
	      const format = main_date.DateTimeFormat.getFormat('DAY_SHORT_MONTH_FORMAT');
	      return main_date.DateTimeFormat.format(format, Date.now() / 1000);
	    }
	  },
	  components: {
	    Clients,
	    Profit
	  },
	  template: `
		<div class="booking-toolbar-after-title">
			<div class="booking-toolbar-after-title-date" ref="date">
				{{ dateFormatted }}
			</div>
			<div class="booking-toolbar-after-title-info">
				<Clients/>
				<Profit/>
			</div>
		</div>
	`
	};

	const OffHours = {
	  props: {
	    bottom: {
	      type: Boolean,
	      default: false
	    }
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      offHoursHover: 'interface/offHoursHover',
	      offHoursExpanded: 'interface/offHoursExpanded',
	      fromHour: 'interface/fromHour',
	      toHour: 'interface/toHour'
	    }),
	    fromFormatted() {
	      if (this.bottom) {
	        return this.formatHour(this.toHour);
	      }
	      return this.formatHour(0);
	    },
	    toFormatted() {
	      if (this.bottom) {
	        return this.formatHour(24);
	      }
	      return this.formatHour(this.fromHour);
	    }
	  },
	  methods: {
	    formatHour(hour) {
	      const timeFormat = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
	      const timestamp = new Date().setHours(hour, 0) / 1000;
	      return main_date.DateTimeFormat.format(timeFormat, timestamp);
	    },
	    animateOffHours({
	      keepScroll
	    }) {
	      if (this.offHoursExpanded) {
	        expandOffHours.collapse();
	      } else {
	        expandOffHours.expand({
	          keepScroll
	        });
	      }
	      void this.$store.dispatch('interface/setOffHoursExpanded', !this.offHoursExpanded);
	    }
	  },
	  template: `
		<div
			class="booking-booking-off-hours"
			:class="{'--hover': offHoursHover, '--bottom': bottom, '--top': !bottom}"
			@click="animateOffHours({ keepScroll: bottom })"
			@mouseenter="$store.dispatch('interface/setOffHoursHover', true)"
			@mouseleave="$store.dispatch('interface/setOffHoursHover', false)"
		>
			<div class="booking-booking-off-hours-border"></div>
			<span>{{ fromFormatted }}</span>
			<span>{{ toFormatted }}</span>
		</div>
	`
	};

	const HelpPopup = {
	  name: 'HelpPopup',
	  components: {
	    RichLoc: ui_vue3_components_richLoc.RichLoc,
	    StickyPopup: booking_component_popup.StickyPopup
	  },
	  emits: ['close'],
	  props: {
	    bindElement: {
	      type: HTMLElement,
	      required: true
	    }
	  },
	  computed: {
	    popupId() {
	      return 'booking-quick-filter-help-popup';
	    },
	    config() {
	      return {
	        className: 'booking-quick-filter-help-popup',
	        bindElement: this.bindElement,
	        offsetLeft: this.bindElement.offsetWidth,
	        offsetTop: this.bindElement.offsetHeight,
	        maxWidth: 220
	      };
	    }
	  },
	  methods: {
	    closePopup() {
	      this.$emit('close');
	    }
	  },
	  template: `
		<StickyPopup
			:id="popupId"
			:config="config"
			@close="closePopup"
		>
			<div class="booking-quick-filter-help-popup-content">
				<div class="booking-quick-filter-help-popup-icon-container">
					<div class="booking-quick-filter-help-popup-icon"></div>
				</div>
				<div class="booking-quick-filter-help-popup-description">
					<RichLoc :text="loc('BOOKING_QUICK_FILTER_HELP_MSGVER_1')" placeholder="[bold]">
						<template #bold="{ text }">
							<span>{{ text }}</span>
						</template>
					</RichLoc>
				</div>
			</div>
		</StickyPopup>
	`
	};

	const QuickFilter = {
	  props: {
	    hour: {
	      type: Number,
	      required: true
	    }
	  },
	  data() {
	    return {
	      IconSet: ui_iconSet_api_vue.Set,
	      isHelpPopupShown: false
	    };
	  },
	  computed: {
	    active() {
	      return this.hour in this.$store.getters[`${booking_const.Model.Interface}/quickFilter`].active;
	    },
	    hovered() {
	      return this.hour in this.$store.getters[`${booking_const.Model.Interface}/quickFilter`].hovered;
	    }
	  },
	  methods: {
	    onClick() {
	      this.closeHelpPopup();
	      if (this.active) {
	        void this.$store.dispatch(`${booking_const.Model.Interface}/deactivateQuickFilter`, this.hour);
	      } else {
	        void this.$store.dispatch(`${booking_const.Model.Interface}/activateQuickFilter`, this.hour);
	      }
	    },
	    hover() {
	      this.helpPopupTimeout = setTimeout(() => this.showHelpPopup(), 1000);
	      void this.$store.dispatch(`${booking_const.Model.Interface}/hoverQuickFilter`, this.hour);
	    },
	    flee() {
	      this.closeHelpPopup();
	      void this.$store.dispatch(`${booking_const.Model.Interface}/fleeQuickFilter`, this.hour);
	    },
	    showHelpPopup() {
	      this.isHelpPopupShown = true;
	    },
	    closeHelpPopup() {
	      clearTimeout(this.helpPopupTimeout);
	      this.isHelpPopupShown = false;
	    }
	  },
	  components: {
	    Icon: ui_iconSet_api_vue.BIcon,
	    HelpPopup
	  },
	  template: `
		<div
			class="booking-booking-quick-filter-container"
			:class="{'--hover': hovered || active, '--active': active}"
		>
			<div
				class="booking-booking-quick-filter"
				@mouseenter="hover"
				@mouseleave="flee"
				@click="onClick"
			>
				<Icon :name="active ? IconSet.CROSS_25 : IconSet.FUNNEL"/>
			</div>
			<HelpPopup
				v-if="isHelpPopupShown"
				:bindElement="$el"
				@close="closeHelpPopup"
			/>
		</div>
	`
	};

	const LeftPanel = {
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      offHoursHover: 'interface/offHoursHover',
	      offHoursExpanded: 'interface/offHoursExpanded',
	      fromHour: 'interface/fromHour',
	      toHour: 'interface/toHour'
	    }),
	    panelHours() {
	      const timeFormat = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
	      const lastHour = this.offHoursExpanded ? 24 : this.toHour;
	      return booking_lib_range.range(0, 24).map(hour => {
	        const timestamp = new Date().setHours(hour, 0) / 1000;
	        return {
	          value: hour,
	          formatted: main_date.DateTimeFormat.format(timeFormat, timestamp),
	          offHours: hour < this.fromHour || hour >= this.toHour,
	          last: hour === lastHour
	        };
	      });
	    }
	  },
	  components: {
	    OffHours,
	    QuickFilter
	  },
	  template: `
		<div class="booking-booking-grid-left-panel-container">
			<div class="booking-booking-grid-left-panel">
				<OffHours/>
				<OffHours :bottom="true"/>
				<template v-for="hour of panelHours" :key="hour.value">
					<div
						v-if="hour.last"
						class="booking-booking-grid-left-panel-time-text"
					>
						{{ hour.formatted }}
					</div>
					<div
						v-if="hour.value !== 24"
						class="booking-booking-grid-left-panel-time"
						:class="{'--off-hours': hour.offHours}"
					>
						<div class="booking-booking-grid-left-panel-time-text">
							{{ hour.formatted }}
						</div>
						<QuickFilter :hour="hour.value"/>
					</div>
				</template>
			</div>
		</div>
	`
	};

	const NowLine = {
	  data() {
	    return {
	      visible: true
	    };
	  },
	  mounted() {
	    this.updateNowLine();
	    setInterval(() => this.updateNowLine(), 1000);
	  },
	  computed: ui_vue3_vuex.mapGetters({
	    zoom: `${booking_const.Model.Interface}/zoom`,
	    selectedDateTs: `${booking_const.Model.Interface}/selectedDateTs`,
	    offHoursExpanded: `${booking_const.Model.Interface}/offHoursExpanded`,
	    fromHour: `${booking_const.Model.Interface}/fromHour`,
	    toHour: `${booking_const.Model.Interface}/toHour`,
	    offset: `${booking_const.Model.Interface}/offset`
	  }),
	  methods: {
	    setVisible(visible) {
	      this.visible = visible;
	      this.updateNowLine();
	    },
	    updateNowLine() {
	      const now = new Date(Date.now() + this.offset);
	      const hourHeight = 50 * this.zoom;
	      const fromMinutes = this.fromHour * 60;
	      const nowMinutes = now.getHours() * 60 + now.getMinutes();
	      const toHour = this.offHoursExpanded ? 24 : this.toHour;
	      const toMinutes = Math.min(toHour * 60 + 21, nowMinutes);
	      const top = (toMinutes - fromMinutes) * (hourHeight / 60);
	      main_core.Dom.style(this.$refs.nowLine, 'top', `${top}px`);
	      const timeFormat = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
	      const timeFormatted = main_date.DateTimeFormat.format(timeFormat, now.getTime() / 1000);
	      if (timeFormatted !== this.$refs.nowText.innerText) {
	        this.$refs.nowText.innerText = timeFormatted;
	      }
	      const date = new Date(this.selectedDateTs + this.offset);
	      const visible = this.visible && Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) === Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
	      main_core.Dom.style(this.$refs.nowLine, 'display', visible ? '' : 'none');
	    }
	  },
	  watch: {
	    selectedDateTs() {
	      this.updateNowLine();
	    },
	    zoom() {
	      this.updateNowLine();
	    },
	    offHoursExpanded(offHoursExpanded) {
	      const now = new Date();
	      const nowMinutes = now.getHours() * 60 + now.getMinutes();
	      if (nowMinutes < this.toHour * 60) {
	        return;
	      }
	      this.setVisible(!offHoursExpanded);
	      setTimeout(() => this.setVisible(true), 200);
	    }
	  },
	  template: `
		<div class="booking-booking-grid-now-line" ref="nowLine">
			<div class="booking-booking-grid-now-line-text" ref="nowText"></div>
		</div>
	`
	};

	const BookingClient = {
	  name: 'BookingActionsPopupClient',
	  emits: ['freeze', 'unfreeze'],
	  props: {
	    bookingId: {
	      type: [Number, String],
	      required: true
	    }
	  },
	  computed: {
	    booking() {
	      return this.$store.getters['bookings/getById'](this.bookingId);
	    }
	  },
	  methods: {
	    async addClients({
	      clients
	    }) {
	      await booking_provider_service_bookingService.bookingService.update({
	        id: this.booking.id,
	        clients
	      });
	    },
	    async updateClients({
	      clients
	    }) {
	      await booking_provider_service_bookingService.bookingService.update({
	        id: this.booking.id,
	        clients
	      });
	    },
	    async updateNote({
	      note
	    }) {
	      await booking_provider_service_bookingService.bookingService.update({
	        id: this.booking.id,
	        note
	      });
	    }
	  },
	  components: {
	    Client: booking_component_actionsPopup.Client
	  },
	  template: `
		<Client
			:id="bookingId"
			:clients="booking.clients"
			:primaryClientData="booking.primaryClient"
			:note="booking.note"
			:dataId="bookingId"
			dataElementPrefix="booking"
			@freeze="$emit('freeze')"
			@unfreeze="$emit('unfreeze')"
			@addClients="addClients"
			@updateClients="updateClients"
			@updateNote="updateNote"
		/>
	`
	};

	const BookingDeal = {
	  name: 'BookingActionsPopupDeal',
	  emits: ['freeze', 'unfreeze'],
	  props: {
	    bookingId: {
	      type: [Number, String],
	      required: true
	    }
	  },
	  setup(props) {
	    const dealHelper = new booking_lib_dealHelper.DealHelper(props.bookingId);
	    return {
	      dealHelper
	    };
	  },
	  computed: {
	    booking() {
	      return this.$store.getters[`${booking_const.Model.Bookings}/getById`](this.bookingId);
	    },
	    deal() {
	      var _this$booking$externa, _this$booking$externa2;
	      return (_this$booking$externa = (_this$booking$externa2 = this.booking.externalData) == null ? void 0 : _this$booking$externa2.find(data => data.entityTypeId === booking_const.CrmEntity.Deal)) != null ? _this$booking$externa : null;
	    }
	  },
	  components: {
	    Deal: booking_component_actionsPopup.Deal
	  },
	  template: `
		<Deal
			:deal="deal"
			:dealHelper="dealHelper"
			:dataId="booking.id"
			dataElementPrefix="booking"
			@freeze="$emit('freeze')"
			@unfreeze="$emit('unfreeze')"
		/>
	`
	};

	const BookingDocument = {
	  name: 'BookingActionsPopupDocument',
	  props: {
	    bookingId: {
	      type: [Number, String],
	      required: true
	    }
	  },
	  data() {
	    return {
	      isLoading: true
	    };
	  },
	  async mounted() {
	    await booking_provider_service_bookingActionsService.bookingActionsService.getDocData();
	    this.isLoading = false;
	  },
	  components: {
	    Document: booking_component_actionsPopup.Document
	  },
	  template: `
		<Document
			:id="bookingId"
			:loading="isLoading"
			disabled
		/>
	`
	};

	const BookingMessage = {
	  name: 'BookingActionsPopupMessage',
	  emits: ['freeze', 'unfreeze'],
	  props: {
	    bookingId: {
	      type: Number,
	      required: true
	    }
	  },
	  data() {
	    return {
	      isLoading: true,
	      isPrimaryClientIdUpdated: false
	    };
	  },
	  mounted() {
	    void this.fetchMessageData();
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      isCurrentSenderAvailable: `${booking_const.Model.Interface}/isCurrentSenderAvailable`
	    }),
	    menuId() {
	      return `booking-message-menu-${this.bookingId}`;
	    },
	    booking() {
	      return this.$store.getters['bookings/getById'](this.bookingId);
	    },
	    client() {
	      const clientData = this.booking.primaryClient;
	      return clientData ? this.$store.getters['clients/getByClientData'](clientData) : null;
	    },
	    clientId() {
	      var _this$booking$primary;
	      return (_this$booking$primary = this.booking.primaryClient) == null ? void 0 : _this$booking$primary.id;
	    },
	    updatedAt() {
	      return this.booking.updatedAt;
	    }
	  },
	  watch: {
	    clientId() {
	      this.isPrimaryClientIdUpdated = true;
	    },
	    updatedAt() {
	      if (this.isPrimaryClientIdUpdated && this.isCurrentSenderAvailable) {
	        void this.fetchMessageData();
	        this.isPrimaryClientIdUpdated = false;
	      }
	    }
	  },
	  methods: {
	    async sendMessage({
	      notificationType
	    }) {
	      try {
	        await booking_provider_service_bookingActionsService.bookingActionsService.sendMessage(this.bookingId, notificationType);
	        void this.fetchMessageData();
	      } catch (result) {
	        if (main_core.Type.isArrayFilled(result.errors)) {
	          ui_notificationManager.Notifier.notify({
	            id: 'booking-message-send-error',
	            text: result.errors[0].message
	          });
	        }
	      }
	    },
	    async fetchMessageData() {
	      this.isLoading = true;
	      await booking_provider_service_bookingActionsService.bookingActionsService.getMessageData(this.bookingId);
	      this.isLoading = false;
	    }
	  },
	  components: {
	    Message: booking_component_actionsPopup.Message
	  },
	  template: `
		<Message
			:id="bookingId"
			:clientData="booking.primaryClient"
			:loading="isLoading"
			:dataId="bookingId"
			dataElementPrefix="booking"
			@open="$emit('freeze')"
			@close="$emit('unfreeze')"
			@updateNotificationType="sendMessage"
		/>
	`
	};

	const BookingConfirmation = {
	  emits: ['freeze', 'unfreeze'],
	  name: 'BookingActionsPopupConfirmation',
	  props: {
	    bookingId: {
	      type: [Number, String],
	      required: true
	    }
	  },
	  computed: {
	    booking() {
	      return this.$store.getters[`${booking_const.Model.Bookings}/getById`](this.bookingId);
	    }
	  },
	  methods: {
	    updateConfirmationStatus({
	      isConfirmed
	    }) {
	      void booking_provider_service_bookingService.bookingService.update({
	        id: this.booking.id,
	        isConfirmed
	      });
	    }
	  },
	  components: {
	    Confirmation: booking_component_actionsPopup.Confirmation
	  },
	  template: `
		<Confirmation
			:id="bookingId"
			:isConfirmed="booking.isConfirmed"
			:counters="booking.counters"
			:dataId="booking.id"
			dataElementPrefix="booking"
			@open="$emit('freeze')"
			@close="$emit('unfreeze')"
			@updateConfirmationStatus="updateConfirmationStatus"
		/>
	`
	};

	const BookingVisit = {
	  emits: ['freeze', 'unfreeze'],
	  name: 'BookingActionsPopupVisit',
	  props: {
	    bookingId: {
	      type: [Number, String],
	      required: true
	    }
	  },
	  computed: {
	    booking() {
	      return this.$store.getters[`${booking_const.Model.Bookings}/getById`](this.bookingId);
	    }
	  },
	  methods: {
	    updateVisitStatus({
	      visitStatus
	    }) {
	      void booking_provider_service_bookingService.bookingService.update({
	        id: this.booking.id,
	        visitStatus
	      });
	    }
	  },
	  components: {
	    Icon: ui_iconSet_api_vue.BIcon,
	    Loader: booking_component_loader.Loader,
	    Visit: booking_component_actionsPopup.Visit
	  },
	  template: `
		<Visit
			:id="booking.id"
			:visitStatus="booking.visitStatus"
			:dataId="booking.id"
			dataElementPrefix="booking"
			:hasClients="booking.clients.length > 0"
			@freeze="$emit('freeze')"
			@unfreeze="$emit('unfreeze')"
			@update:visitStatus="updateVisitStatus"
		/>
	`
	};

	// @vue/component
	const Overbooking = {
	  name: 'BookingActionsPopupOverbooking',
	  components: {
	    Icon: ui_iconSet_api_vue.BIcon
	  },
	  directives: {
	    hint: ui_vue3_directives_hint.hint
	  },
	  emits: ['close'],
	  props: {
	    bookingId: {
	      type: [Number, String],
	      required: true
	    },
	    resourceId: {
	      type: Number,
	      required: true
	    },
	    disabled: {
	      type: Boolean,
	      default: false
	    }
	  },
	  setup() {
	    const plusIcon = ui_iconSet_api_vue.Set.PLUS_20;
	    const plusIconSize = 20;
	    const plusIconColor = 'var(--ui-color-palette-gray-20)';
	    return {
	      plusIcon,
	      plusIconSize,
	      plusIconColor
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      getBookingById: `${booking_const.Model.Bookings}/getById`,
	      dictionary: `${booking_const.Model.Dictionary}/getBookingVisitStatuses`,
	      isFeatureEnabled: `${booking_const.Model.Interface}/isFeatureEnabled`,
	      timezone: `${booking_const.Model.Interface}/timezone`,
	      embedItems: `${booking_const.Model.Interface}/embedItems`
	    }),
	    booking() {
	      return this.getBookingById(this.bookingId);
	    },
	    hasOverbookingHint() {
	      if (!this.disabled) {
	        return undefined;
	      }
	      return {
	        text: this.loc('BB_ACTIONS_POPUP_OVERBOOKING_DISABLED_HINT')
	      };
	    },
	    clients() {
	      const clients = this.embedItems.filter(item => {
	        return item.entityTypeId === 'CONTACT' || item.entityTypeId === 'COMPANY';
	      });
	      return clients.map(item => {
	        return {
	          id: item.value,
	          type: {
	            code: item.entityTypeId,
	            module: item.moduleId
	          }
	        };
	      });
	    }
	  },
	  methods: {
	    async addOverbooking() {
	      if (this.disabled) {
	        return;
	      }
	      if (!this.isFeatureEnabled) {
	        booking_lib_limit.limit.show();
	        return;
	      }
	      const overbooking = {
	        ...this.booking,
	        id: main_core.Text.getRandom(10),
	        clients: this.clients,
	        counter: 0,
	        counters: [],
	        createdAt: Date.now(),
	        externalData: this.embedItems,
	        isConfirmed: false,
	        name: null,
	        note: null,
	        resourcesIds: [this.resourceId],
	        primaryClient: undefined,
	        rrule: null,
	        timezoneFrom: this.timezone,
	        timezoneTo: this.timezone,
	        updatedAt: Date.now(),
	        visitStatus: this.dictionary.Unknown
	      };
	      delete overbooking.name;
	      await this.addCreatedFromEmbedBooking(overbooking.id);
	      const result = await booking_provider_service_bookingService.bookingService.add(overbooking);
	      if (result.success && result.booking) {
	        booking_lib_analytics.BookingAnalytics.sendAddBooking({
	          isOverbooking: true
	        });
	        await this.addCreatedFromEmbedBooking(result.booking.id);
	      }
	      this.$emit('close');
	    },
	    async addCreatedFromEmbedBooking(id) {
	      await this.$store.dispatch(`${booking_const.Model.Interface}/addCreatedFromEmbedBooking`, id);
	    }
	  },
	  template: `
		<div
			v-hint="hasOverbookingHint"
			class="booking-actions-popup__item-overbooking-button"
			:class="{'--disabled': disabled}"
			role="button"
			tabindex="0"
			@click="addOverbooking"
		>
			<Icon :name="plusIcon" :size="plusIconSize" :color="plusIconColor"/>
			<div class="booking-actions-popup__item-overbooking-label">
				{{ loc('BB_ACTIONS_POPUP_OVERBOOKING_LABEL') }}
			</div>
		</div>
	`
	};

	const Waitlist = {
	  name: 'BookingActionsPopupWaitlist',
	  props: {
	    bookingId: {
	      type: [Number, String],
	      required: true
	    }
	  },
	  components: {
	    Icon: ui_iconSet_api_vue.BIcon
	  },
	  computed: {
	    clockIcon() {
	      return ui_iconSet_api_vue.Set.BLACK_CLOCK;
	    },
	    clockIconSize() {
	      return 20;
	    },
	    clockIconColor() {
	      return 'var(--ui-color-palette-gray-20)';
	    }
	  },
	  template: `
		<div class="booking-actions-popup__item-waitlist-icon --end">
			<Icon :name="clockIcon" :size="clockIconSize" :color="clockIconColor"/>
			<div class="booking-actions-popup__item-waitlist-label">
				{{loc('BB_ACTIONS_POPUP_OVERBOOKING_LIST')}}
			</div>
		</div>
	`
	};

	function BookingRemoveBtn(props, {
	  emit
	}) {
	  const bookingId = props.bookingId;
	  const removeBooking = () => {
	    emit('close');
	    new booking_lib_removeBooking.RemoveBooking(bookingId);
	  };
	  return ui_vue3.h(booking_component_actionsPopup.RemoveButton, {
	    dataId: bookingId,
	    dataElementPrefix: 'booking',
	    onRemove: removeBooking
	  });
	}
	const bookingRemoveBtnProps = ['bookingId'];
	BookingRemoveBtn.props = bookingRemoveBtnProps;
	BookingRemoveBtn.emits = ['close'];

	const ActionsPopupActionEnum = Object.freeze({
	  client: 'client',
	  confirmation: 'confirmation',
	  deal: 'deal',
	  document: 'document',
	  fullForm: 'fullForm',
	  message: 'message',
	  visit: 'visit',
	  overbooking: 'overbooking',
	  remove: 'remove',
	  waitList: 'waitList'
	});

	// @vue/component
	const BookingActionsPopup = {
	  name: 'BookingActionsPopup',
	  emits: ['close'],
	  props: {
	    bindElement: {
	      type: HTMLElement,
	      required: true
	    },
	    bookingId: {
	      type: [Number, String],
	      required: true
	    },
	    resourceId: {
	      type: Number,
	      required: true
	    },
	    /**
	     * @type ActionsPopupOptions
	     */
	    options: {
	      type: Object,
	      default: null
	    }
	  },
	  data() {
	    return {
	      soonTmp: false
	    };
	  },
	  computed: {
	    config() {
	      return {
	        offsetLeft: this.bindElement.offsetWidth,
	        offsetTop: -200
	      };
	    },
	    contentStructure() {
	      return [{
	        id: ActionsPopupActionEnum.client,
	        props: {
	          bookingId: this.bookingId
	        },
	        component: BookingClient
	      }, [{
	        id: ActionsPopupActionEnum.deal,
	        props: {
	          bookingId: this.bookingId
	        },
	        component: BookingDeal
	      }, {
	        id: ActionsPopupActionEnum.document,
	        props: {
	          bookingId: this.bookingId
	        },
	        component: BookingDocument
	      }], {
	        id: ActionsPopupActionEnum.message,
	        props: {
	          bookingId: this.bookingId
	        },
	        component: BookingMessage
	      }, {
	        id: ActionsPopupActionEnum.confirmation,
	        props: {
	          bookingId: this.bookingId
	        },
	        component: BookingConfirmation
	      }, {
	        id: ActionsPopupActionEnum.visit,
	        props: {
	          bookingId: this.bookingId
	        },
	        component: BookingVisit
	      }, {
	        id: ActionsPopupActionEnum.fullForm,
	        props: {
	          bookingId: this.bookingId
	        },
	        component: booking_component_actionsPopup.FullForm
	      }];
	    },
	    booking() {
	      return this.$store.getters['bookings/getById'](this.bookingId);
	    }
	  },
	  components: {
	    ActionsPopup: booking_component_actionsPopup.ActionsPopup,
	    BookingClient,
	    BookingDeal,
	    BookingDocument,
	    BookingMessage,
	    BookingConfirmation,
	    BookingVisit,
	    FullForm: booking_component_actionsPopup.FullForm,
	    Overbooking,
	    Waitlist,
	    BookingRemoveBtn
	  },
	  template: `
		<ActionsPopup
			:popupId="bookingId"
			:bindElement="bindElement"
			:contentStructure="contentStructure"
			:popupOptions="config"
			@close="$emit('close')"
		>
			<template #footer>
				<Overbooking
					v-if="!options?.overbooking?.hidden"
					:bookingId
					:resourceId
					:disabled="Boolean(options?.overbooking?.disabled)"
					@close="$emit('close')"
				/>
				<template v-if="soonTmp">
					<Waitlist :bookingId/>
				</template>
				<BookingRemoveBtn :bookingId @close="$emit('close')"/>
			</template>
		</ActionsPopup>
	`
	};

	const Actions = {
	  name: 'BookingActions',
	  props: {
	    bookingId: {
	      type: [Number, String],
	      required: true
	    },
	    resourceId: {
	      type: Number,
	      required: true
	    },
	    actionsPopupOptions: {
	      type: Object,
	      default: null
	    }
	  },
	  data() {
	    return {
	      showPopup: false
	    };
	  },
	  mounted() {
	    if (this.isEditingBookingMode && this.editingBookingId === this.bookingId) {
	      this.showPopup = true;
	    }
	  },
	  computed: ui_vue3_vuex.mapGetters({
	    editingBookingId: `${booking_const.Model.Interface}/editingBookingId`,
	    isEditingBookingMode: `${booking_const.Model.Interface}/isEditingBookingMode`
	  }),
	  methods: {
	    clickHandler() {
	      this.showPopup = true;
	    }
	  },
	  components: {
	    BookingActionsPopup
	  },
	  template: `
		<div 
			ref="node"
			class="booking-booking-booking-actions"
			data-element="booking-booking-actions-button"
			:data-id="bookingId"
			:data-resource-id="resourceId"
			@click="clickHandler"
		>
			<div class="booking-booking-booking-actions-inner">
				<div class="ui-icon-set --chevron-down"></div>
			</div>
		</div>
		<BookingActionsPopup
			v-if="showPopup"
			:bookingId
			:bindElement="this.$refs.node"
			:resourceId
			:options="actionsPopupOptions"
			@close="showPopup = false"
		/>
	`
	};

	const AddClient = {
	  props: {
	    bookingId: {
	      type: [Number, String],
	      required: true
	    },
	    resourceId: {
	      type: Number,
	      required: true
	    },
	    expired: {
	      type: Boolean,
	      default: false
	    }
	  },
	  data() {
	    return {
	      showPopup: false
	    };
	  },
	  mounted() {
	    if (booking_lib_isRealId.isRealId(this.bookingId)) {
	      booking_lib_ahaMoments.ahaMoments.setBookingForAhaMoment(this.bookingId);
	    }
	    if (booking_lib_ahaMoments.ahaMoments.shouldShow(booking_const.AhaMoment.AddClient, {
	      bookingId: this.bookingId
	    })) {
	      void this.showAhaMoment();
	    }
	  },
	  computed: ui_vue3_vuex.mapGetters({
	    providerModuleId: `${booking_const.Model.Clients}/providerModuleId`,
	    isFeatureEnabled: `${booking_const.Model.Interface}/isFeatureEnabled`
	  }),
	  methods: {
	    clickHandler() {
	      if (!this.isFeatureEnabled) {
	        booking_lib_limit.limit.show();
	        return;
	      }
	      this.showPopup = true;
	    },
	    async addClientsToBook(clients) {
	      const booking = this.$store.getters[`${booking_const.Model.Bookings}/getById`](this.bookingId);
	      await booking_provider_service_bookingService.bookingService.update({
	        id: booking.id,
	        clients
	      });
	    },
	    async showAhaMoment() {
	      await booking_lib_ahaMoments.ahaMoments.show({
	        id: 'booking-add-client',
	        title: this.loc('BOOKING_AHA_ADD_CLIENT_TITLE'),
	        text: this.loc('BOOKING_AHA_ADD_CLIENT_TEXT'),
	        article: booking_const.HelpDesk.AhaAddClient,
	        target: this.$refs.button
	      });
	      booking_lib_ahaMoments.ahaMoments.setShown(booking_const.AhaMoment.AddClient);
	    }
	  },
	  components: {
	    ClientPopup: booking_component_clientPopup.ClientPopup
	  },
	  template: `
		<div
			v-if="providerModuleId"
			class="booking-booking-booking-add-client"
			:class="{ '--expired': expired }"
			data-element="booking-add-client-button"
			:data-id="bookingId"
			:data-resource-id="resourceId"
			ref="button"
			@click="clickHandler"
		>
			{{ loc('BOOKING_BOOKING_PLUS_CLIENT') }}
		</div>
		<ClientPopup
			v-if="showPopup"
			:bindElement="this.$refs.button"
			:offset-top="-100"
			:offset-left="this.$refs.button.offsetWidth + 10"
			@create="addClientsToBook"
			@close="showPopup = false"
		/>
	`
	};

	const ChangeTimePopup = {
	  name: 'ChangeTimePopup',
	  emits: ['close'],
	  props: {
	    bookingId: {
	      type: [Number, String],
	      required: true
	    },
	    resourceId: {
	      type: Number,
	      required: true
	    },
	    targetNode: {
	      type: HTMLElement,
	      required: true
	    }
	  },
	  data() {
	    return {
	      ButtonSize: booking_component_button.ButtonSize,
	      ButtonColor: booking_component_button.ButtonColor,
	      ButtonIcon: booking_component_button.ButtonIcon,
	      fromTs: 0,
	      toTs: 0,
	      duration: 0
	    };
	  },
	  created() {
	    this.fromTs = this.booking.dateFromTs;
	    this.toTs = this.booking.dateToTs;
	    this.duration = this.toTs - this.fromTs;
	  },
	  mounted() {
	    main_core.Event.bind(document, 'scroll', this.adjustPosition, true);
	  },
	  beforeUnmount() {
	    main_core.Event.unbind(document, 'scroll', this.adjustPosition, true);
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      selectedDateTs: `${booking_const.Model.Interface}/selectedDateTs`
	    }),
	    popupId() {
	      return `booking-change-time-popup-${this.bookingId}`;
	    },
	    config() {
	      return {
	        className: 'booking-booking-change-time-popup',
	        bindElement: this.targetNode,
	        offsetTop: -10,
	        bindOptions: {
	          forceBindPosition: true,
	          position: 'top'
	        },
	        angle: {
	          offset: this.targetNode.offsetWidth / 2
	        }
	      };
	    },
	    isBusy() {
	      const bookingId = this.bookingId;
	      const bookings = this.bookings.filter(({
	        id,
	        dateToTs,
	        dateFromTs
	      }) => {
	        if (id !== bookingId && this.overbookingMap.has(id)) {
	          var _resourceIntersection;
	          const overbooking = this.overbookingMap.get(id);
	          const resourceIntersections = overbooking.items.find(item => item.resourceId === this.resourceId);
	          const intersections = (resourceIntersections == null ? void 0 : (_resourceIntersection = resourceIntersections.intersections) == null ? void 0 : _resourceIntersection.filter(intersection => {
	            return intersection.id !== bookingId && intersection.dateToTs > this.fromTs && this.toTs > intersection.dateFromTs;
	          })) || [];
	          if (resourceIntersections && intersections.length === 0) {
	            return false;
	          }
	        }
	        return id !== bookingId && dateToTs > this.fromTs && this.toTs > dateFromTs;
	      });
	      return bookings.length > 0;
	    },
	    bookings() {
	      return this.$store.getters[`${booking_const.Model.Bookings}/getByDateAndResources`](this.selectedDateTs, this.booking.resourcesIds);
	    },
	    booking() {
	      return this.$store.getters['bookings/getById'](this.bookingId);
	    },
	    overbookingMap() {
	      return this.$store.getters[`${booking_const.Model.Bookings}/overbookingMap`];
	    }
	  },
	  methods: {
	    adjustPosition() {
	      this.$refs.popup.adjustPosition();
	      this.$refs.timeFrom.adjustMenuPosition();
	      this.$refs.timeTo.adjustMenuPosition();
	    },
	    closePopup() {
	      const tsChanged = this.booking.dateFromTs !== this.fromTs || this.booking.dateToTs !== this.toTs;
	      if (!this.isBusy && tsChanged) {
	        void booking_provider_service_bookingService.bookingService.update({
	          id: this.booking.id,
	          dateFromTs: this.fromTs,
	          dateToTs: this.toTs,
	          timezoneFrom: this.booking.timezoneFrom,
	          timezoneTo: this.booking.timezoneTo
	        });
	      }
	      this.$emit('close');
	    },
	    freeze() {
	      this.$refs.popup.getPopupInstance().setAutoHide(false);
	    },
	    unfreeze() {
	      this.$refs.popup.getPopupInstance().setAutoHide(true);
	    }
	  },
	  watch: {
	    fromTs() {
	      this.toTs = this.fromTs + this.duration;
	    },
	    toTs() {
	      if (this.toTs <= this.fromTs) {
	        this.fromTs = this.toTs - this.duration;
	      }
	      this.duration = this.toTs - this.fromTs;
	    },
	    isBusy() {
	      setTimeout(() => this.adjustPosition(), 0);
	    }
	  },
	  components: {
	    Popup: booking_component_popup.Popup,
	    TimeSelector: booking_component_timeSelector.TimeSelector,
	    Button: booking_component_button.Button
	  },
	  template: `
		<Popup
			:id="popupId"
			:config="config"
			@close="closePopup"
			ref="popup"
		>
			<div class="booking-booking-change-time-popup-content">
				<div class="booking-booking-change-time-popup-main">
					<TimeSelector
						v-model="fromTs"
						:hasError="isBusy"
						data-element="booking-change-time-from"
						:data-ts="fromTs"
						:data-booking-id="bookingId"
						ref="timeFrom"
						@freeze="freeze"
						@unfreeze="unfreeze"
						@enterSave="closePopup"
					/>
					<div class="booking-booking-change-time-popup-separator"></div>
					<TimeSelector
						v-model="toTs"
						:hasError="isBusy"
						:minTs="fromTs"
						data-element="booking-change-time-to"
						:data-ts="toTs"
						:data-booking-id="bookingId"
						ref="timeTo"
						@freeze="freeze"
						@unfreeze="unfreeze"
						@enterSave="closePopup"
					/>
					<Button
						class="booking-booking-change-time-popup-button"
						:size="ButtonIcon.MEDIUM"
						:color="ButtonColor.PRIMARY"
						:icon="ButtonIcon.DONE"
						:disabled="isBusy"
						@click="closePopup"
					/>
				</div>
				<div v-if="isBusy" class="booking-booking-change-time-popup-error">
					{{ loc('BOOKING_BOOKING_TIME_IS_NOT_AVAILABLE') }}
				</div>
			</div>
		</Popup>
	`
	};

	const BookingTime = {
	  props: {
	    bookingId: {
	      type: [Number, String],
	      required: true
	    },
	    resourceId: {
	      type: Number,
	      required: true
	    },
	    dateFromTs: {
	      type: Number,
	      required: true
	    },
	    dateToTs: {
	      type: Number,
	      required: true
	    }
	  },
	  data() {
	    return {
	      showPopup: false
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      offset: `${booking_const.Model.Interface}/offset`,
	      isFeatureEnabled: `${booking_const.Model.Interface}/isFeatureEnabled`
	    }),
	    booking() {
	      return this.$store.getters['bookings/getById'](this.bookingId);
	    },
	    timeFormatted() {
	      const timeFormat = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
	      return this.loc('BOOKING_BOOKING_TIME_RANGE', {
	        '#FROM#': main_date.DateTimeFormat.format(timeFormat, (this.dateFromTs + this.offset) / 1000),
	        '#TO#': main_date.DateTimeFormat.format(timeFormat, (this.dateToTs + this.offset) / 1000)
	      });
	    }
	  },
	  methods: {
	    clickHandler() {
	      if (!this.isFeatureEnabled) {
	        return;
	      }
	      this.showPopup = true;
	    },
	    closePopup() {
	      this.showPopup = false;
	    }
	  },
	  components: {
	    ChangeTimePopup
	  },
	  template: `
		<div
			class="booking-booking-booking-time"
			:class="{'--lock': !isFeatureEnabled}"
			data-element="booking-booking-time"
			:data-booking-id="bookingId"
			:data-resource-id="resourceId"
			:data-from="booking.dateFromTs"
			:data-to="booking.dateToTs"
			ref="time"
			@click="clickHandler"
		>
			{{ timeFormatted }}
		</div>
		<ChangeTimePopup
			v-if="showPopup"
			:bookingId="bookingId"
			:resourceId="resourceId"
			:targetNode="$refs.time"
			@close="closePopup"
		/>
	`
	};

	const Name = {
	  props: {
	    bookingId: {
	      type: [Number, String],
	      required: true
	    },
	    resourceId: {
	      type: Number,
	      required: true
	    }
	  },
	  computed: {
	    booking() {
	      return this.$store.getters[`${booking_const.Model.Bookings}/getById`](this.bookingId);
	    },
	    client() {
	      const clientData = this.booking.primaryClient;
	      return clientData ? this.$store.getters[`${booking_const.Model.Clients}/getByClientData`](clientData) : null;
	    },
	    bookingName() {
	      var _this$client;
	      return ((_this$client = this.client) == null ? void 0 : _this$client.name) || this.booking.name || this.loc('BOOKING_BOOKING_DEFAULT_BOOKING_NAME');
	    }
	  },
	  template: `
		<div
			class="booking-booking-booking-name"
			:title="bookingName"
			data-element="booking-booking-name"
			:data-id="bookingId"
			:data-resource-id="resourceId"
		>
			{{ bookingName }}
		</div>
	`
	};

	const Note = {
	  props: {
	    bookingId: {
	      type: [Number, String],
	      required: true
	    },
	    bindElement: {
	      type: Function,
	      required: true
	    }
	  },
	  data() {
	    return {
	      isPopupShown: false,
	      isEditMode: false
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      isFeatureEnabled: `${booking_const.Model.Interface}/isFeatureEnabled`
	    }),
	    booking() {
	      return this.$store.getters[`${booking_const.Model.Bookings}/getById`](this.bookingId);
	    },
	    hasNote() {
	      return Boolean(this.booking.note);
	    }
	  },
	  methods: {
	    showViewPopup() {
	      if (this.isPopupShown || !this.hasNote) {
	        return;
	      }
	      this.isEditMode = false;
	      this.isPopupShown = true;
	    },
	    closeViewPopup() {
	      if (this.isEditMode) {
	        return;
	      }
	      this.isPopupShown = false;
	    },
	    showEditPopup() {
	      this.isEditMode = true;
	      this.isPopupShown = true;
	    },
	    closeEditPopup() {
	      if (!this.isEditMode) {
	        return;
	      }
	      this.isPopupShown = false;
	    },
	    async saveBookingNote({
	      note
	    }) {
	      await booking_provider_service_bookingService.bookingService.update({
	        id: this.booking.id,
	        note
	      });
	    }
	  },
	  components: {
	    NotePopup: booking_component_notePopup.NotePopup
	  },
	  template: `
		<div class="booking-booking-booking-note">
			<div
				class="booking-booking-booking-note-button"
				:class="{'--has-note': hasNote}"
				data-element="booking-booking-note-button"
				:data-id="bookingId"
				@click="showEditPopup"
			>
				<div class="ui-icon-set --note"></div>
			</div>
		</div>
		<NotePopup
			v-if="isPopupShown"
			:isEditMode="isEditMode && isFeatureEnabled"
			:id="bookingId"
			:text="booking.note"
			:bindElement="bindElement"
			:dataId="bookingId"
			dataElementPrefix="booking"
			@close="closeEditPopup"
			@save="saveBookingNote"
		/>
	`
	};

	const Profit$1 = {
	  props: {
	    bookingId: {
	      type: [Number, String],
	      required: true
	    },
	    resourceId: {
	      type: Number,
	      required: true
	    }
	  },
	  computed: {
	    booking() {
	      return this.$store.getters[`${booking_const.Model.Bookings}/getById`](this.bookingId);
	    },
	    deal() {
	      var _this$booking$externa, _this$booking$externa2;
	      return (_this$booking$externa = (_this$booking$externa2 = this.booking.externalData) == null ? void 0 : _this$booking$externa2.find(data => data.entityTypeId === booking_const.CrmEntity.Deal)) != null ? _this$booking$externa : null;
	    }
	  },
	  template: `
		<div
			v-if="deal"
			class="booking-booking-booking-profit"
			data-element="booking-booking-profit"
			:data-id="bookingId"
			:data-resource-id="resourceId"
			:data-profit="deal.data.opportunity"
			v-html="deal.data.formattedOpportunity"
		></div>
	`
	};

	const Communication = {
	  name: 'BookingCommunication',
	  directives: {
	    hint: ui_vue3_directives_hint.hint
	  },
	  components: {
	    Icon: ui_iconSet_api_vue.BIcon
	  },
	  setup() {
	    return {
	      IconSet: ui_iconSet_api_vue.Set
	    };
	  },
	  computed: {
	    soonHint() {
	      return {
	        text: this.loc('BOOKING_BOOKING_SOON_HINT'),
	        popupOptions: {
	          offsetLeft: -60
	        }
	      };
	    }
	  },
	  template: `
		<div v-hint="soonHint" class="booking-booking-booking-communication">
			<Icon :name="IconSet.TELEPHONY_HANDSET_1"/>
			<Icon :name="IconSet.CHATS_2"/>
		</div>
	`
	};

	const CrmButton = {
	  props: {
	    bookingId: [Number, String],
	    required: true
	  },
	  data() {
	    return {
	      IconSet: ui_iconSet_api_vue.Set
	    };
	  },
	  created() {
	    this.dealHelper = new booking_lib_dealHelper.DealHelper(this.bookingId);
	  },
	  computed: {
	    hasDeal() {
	      return this.dealHelper.hasDeal();
	    },
	    isFeatureEnabled() {
	      return this.$store.getters[`${booking_const.Model.Interface}/isFeatureEnabled`];
	    }
	  },
	  methods: {
	    onClick() {
	      if (!this.isFeatureEnabled) {
	        void booking_lib_limit.limit.show();
	        return;
	      }
	      if (this.hasDeal) {
	        this.dealHelper.openDeal();
	      } else {
	        this.dealHelper.createDeal();
	      }
	    }
	  },
	  components: {
	    Icon: ui_iconSet_api_vue.BIcon
	  },
	  template: `
		<Icon
			:name="IconSet.CRM_LETTERS"
			class="booking-booking-booking-crm-button"
			:class="{'--no-deal': !hasDeal}"
			data-element="booking-crm-button"
			:data-booking-id="bookingId"
			@click="onClick"
		/>
	`
	};

	const Counter = {
	  props: {
	    bookingId: {
	      type: [Number, String],
	      required: true
	    }
	  },
	  computed: {
	    booking() {
	      return this.$store.getters[`${booking_const.Model.Bookings}/getById`](this.bookingId);
	    },
	    counterOptions() {
	      return Object.freeze({
	        color: booking_component_counter.CounterColor.DANGER,
	        size: booking_component_counter.CounterSize.LARGE
	      });
	    }
	  },
	  components: {
	    UiCounter: booking_component_counter.Counter
	  },
	  template: `
		<UiCounter
			v-if="booking.counter > 0"
			:value="booking.counter"
			:color="counterOptions.color"
			:size="counterOptions.size"
			border
			counter-class="booking--counter"
		/>
	`
	};

	const DisabledPopup = {
	  emits: ['close'],
	  props: {
	    bookingId: {
	      type: [Number, String],
	      required: true
	    },
	    resourceId: {
	      type: Number,
	      required: true
	    },
	    bindElement: {
	      type: Function,
	      required: true
	    }
	  },
	  mounted() {
	    this.adjustPosition();
	    setTimeout(() => this.closePopup(), 3000);
	    main_core.Event.bind(document, 'scroll', this.adjustPosition, true);
	  },
	  beforeUnmount() {
	    main_core.Event.unbind(document, 'scroll', this.adjustPosition, true);
	  },
	  computed: {
	    popupId() {
	      return `booking-booking-disabled-popup-${this.bookingId}-${this.resourceId}`;
	    },
	    config() {
	      return {
	        className: 'booking-booking-disabled-popup',
	        bindElement: this.bindElement(),
	        width: this.bindElement().offsetWidth,
	        offsetTop: -10,
	        bindOptions: {
	          forceBindPosition: true,
	          position: 'top'
	        },
	        autoHide: true,
	        darkMode: true
	      };
	    }
	  },
	  methods: {
	    adjustPosition() {
	      this.$refs.popup.adjustPosition();
	    },
	    closePopup() {
	      this.$emit('close');
	    }
	  },
	  components: {
	    Popup: booking_component_popup.Popup
	  },
	  template: `
		<Popup
			:id="popupId"
			:config="config"
			ref="popup"
			@close="closePopup"
		>
			<div class="booking-booking-disabled-popup-content">
				{{ loc('BOOKING_BOOKING_YOU_CANNOT_EDIT_THIS_BOOKING') }}
			</div>
		</Popup>
	`
	};

	// @vue/component
	const ResizeDirection = Object.freeze({
	  From: -1,
	  None: 0,
	  To: 1
	});
	const minDuration = booking_lib_duration.Duration.getUnitDurations().i * 5;
	const minInitialDuration = booking_lib_duration.Duration.getUnitDurations().i * 15;
	const Resize = {
	  name: 'BookingResize',
	  props: {
	    bookingId: {
	      type: [Number, String],
	      required: true
	    },
	    resourceId: {
	      type: Number,
	      required: true
	    }
	  },
	  setup() {
	    const tooltipTop = null;
	    const tooltipBottom = null;
	    return {
	      tooltipTop,
	      tooltipBottom
	    };
	  },
	  data() {
	    return {
	      resizeDirection: ResizeDirection.None,
	      resizeFromTs: null,
	      resizeToTs: null
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      selectedDateTs: `${booking_const.Model.Interface}/selectedDateTs`,
	      overbookingMap: `${booking_const.Model.Bookings}/overbookingMap`
	    }),
	    booking() {
	      return this.$store.getters[`${booking_const.Model.Bookings}/getById`](this.bookingId);
	    },
	    limits() {
	      return {
	        fromTs: new Date(this.selectedDateTs).setHours(0, 0, 0, 0),
	        toTs: new Date(this.selectedDateTs).setHours(24, 0, 0, 0)
	      };
	    },
	    initialHeight() {
	      return booking_lib_grid.grid.calculateHeight(this.booking.dateFromTs, this.booking.dateToTs);
	    },
	    initialDuration() {
	      return Math.max(this.booking.dateToTs - this.booking.dateFromTs, minInitialDuration);
	    },
	    dateFromTsRounded() {
	      return this.roundTimestamp(this.resizeFromTs);
	    },
	    dateToTsRounded() {
	      return this.roundTimestamp(this.resizeToTs);
	    },
	    closestOnFrom() {
	      return this.colliding.reduce((closest, {
	        toTs
	      }) => {
	        return closest < toTs && toTs <= this.booking.dateFromTs ? toTs : closest;
	      }, 0);
	    },
	    closestOnTo() {
	      return this.colliding.reduce((closest, {
	        fromTs
	      }) => {
	        return this.booking.dateToTs <= fromTs && fromTs < closest ? fromTs : closest;
	      }, Infinity);
	    },
	    excludeBookings() {
	      // return when overbooking option disabled
	      // 	return [this.bookingId];
	      const overbookingMap = this.overbookingMap;
	      return booking => {
	        if (booking.id === this.bookingId) {
	          return true;
	        }
	        const overbooking = overbookingMap.get(booking.id);
	        const resourcesIds = this.booking.resourcesIds;
	        return !overbooking || overbooking.items.every(item => !resourcesIds.includes(item.resourceId));
	      };
	    },
	    colliding() {
	      return this.$store.getters[`${booking_const.Model.Interface}/getColliding`](this.booking.resourcesIds, this.excludeBookings);
	    },
	    hasIntersections() {
	      return this.booking.resourcesIds.length > 1;
	    }
	  },
	  methods: {
	    createPopup(options) {
	      return new main_popup.Popup({
	        autoHide: true,
	        cacheable: true,
	        darkMode: true,
	        ...options
	      });
	    },
	    showTooltipTop(options) {
	      if (!this.tooltipTop) {
	        this.tooltipTop = this.createPopup({
	          id: `resize-top-${this.bookingId}-${this.resourceId}`,
	          bindElement: this.$refs.bookingResizeTop,
	          bindOptions: {
	            position: 'bottom'
	          },
	          offsetLeft: this.$refs.bookingResizeTop.offsetWidth / 2,
	          content: this.loc('BOOKING_RESIZE_GRID_LIMIT'),
	          ...options
	        });
	      } else if (options != null && options.content) {
	        this.tooltipTop.setContent(options.content);
	      }
	      this.tooltipTop.show();
	    },
	    showTooltipBottom(options) {
	      if (!this.tooltipBottom) {
	        this.tooltipBottom = this.createPopup({
	          id: `resize-bottom-${this.bookingId}-${this.resourceId}`,
	          bindElement: this.$refs.bookingResizeBottom,
	          bindOptions: {
	            position: 'bottom'
	          },
	          offsetLeft: this.$refs.bookingResizeBottom.offsetWidth / 2,
	          content: this.loc('BOOKING_RESIZE_GRID_LIMIT'),
	          ...options
	        });
	      } else if (options != null && options.content) {
	        this.tooltipBottom.setContent(options.content);
	      }
	      this.tooltipBottom.show();
	    },
	    hideTooltips() {
	      var _this$tooltipTop, _this$tooltipBottom;
	      (_this$tooltipTop = this.tooltipTop) == null ? void 0 : _this$tooltipTop.close == null ? void 0 : _this$tooltipTop.close();
	      (_this$tooltipBottom = this.tooltipBottom) == null ? void 0 : _this$tooltipBottom.close == null ? void 0 : _this$tooltipBottom.close();
	    },
	    onMouseDown(event) {
	      const direction = main_core.Dom.hasClass(event.target, '--from') ? ResizeDirection.From : ResizeDirection.To;
	      void this.startResize(direction);
	    },
	    async startResize(direction = ResizeDirection.To) {
	      main_core.Dom.style(document.body, 'user-select', 'none');
	      main_core.Event.bind(window, 'mouseup', this.endResize);
	      main_core.Event.bind(window, 'pointermove', this.resize);
	      this.resizeDirection = direction;
	      void this.updateIds(this.bookingId, this.resourceId);
	    },
	    resize(event) {
	      if (!this.resizeDirection) {
	        return;
	      }
	      const resizeHeight = this.resizeDirection === ResizeDirection.To ? event.clientY - this.$el.getBoundingClientRect().top : this.$el.getBoundingClientRect().bottom - event.clientY;
	      const duration = resizeHeight * this.initialDuration / this.initialHeight;
	      const newDuration = Math.max(duration, minDuration);
	      if (this.resizeDirection === ResizeDirection.To) {
	        const resizeToTs = this.booking.dateFromTs + newDuration;
	        const toTs = Math.min(resizeToTs, this.limits.toTs);
	        this.manageToLimitNotification(resizeToTs, toTs);
	        this.resizeFromTs = this.booking.dateFromTs;
	        this.resizeToTs = Math.min(toTs, this.closestOnTo);
	      } else {
	        const resizeFromTs = this.booking.dateToTs - newDuration;
	        const fromTs = Math.max(resizeFromTs, this.limits.fromTs);
	        this.manageFromLimitNotification(resizeFromTs, fromTs);
	        this.resizeFromTs = Math.max(fromTs, this.closestOnFrom);
	        this.resizeToTs = this.booking.dateToTs;
	      }
	      this.$emit('update', this.resizeFromTs, this.resizeToTs);
	    },
	    async endResize() {
	      this.resizeBooking();
	      this.hideTooltips();
	      main_core.Dom.style(document.body, 'user-select', '');
	      main_core.Event.unbind(window, 'mouseup', this.endResize);
	      main_core.Event.unbind(window, 'pointermove', this.resize);
	      this.$emit('update', null, null);
	      await this.updateIds(null, null);
	    },
	    manageFromLimitNotification(resizeFromTs, fromTs) {
	      const colliding = this.colliding.filter(({
	        toTs
	      }) => toTs === this.closestOnFrom);
	      if (resizeFromTs < this.limits.fromTs) {
	        this.showTooltipTop({
	          content: this.loc('BOOKING_RESIZE_GRID_LIMIT')
	        });
	        return;
	      }
	      if (fromTs < this.closestOnFrom) {
	        if (this.checkClosestByIntersection(colliding)) {
	          this.showTooltipTop({
	            content: this.loc('BOOKING_RESIZE_INTERSECTIONS_LIMIT')
	          });
	          return;
	        }
	        this.showTooltipTop({
	          content: this.loc('BOOKING_RESIZE_LIMIT')
	        });
	        return;
	      }
	      this.hideTooltips();
	    },
	    manageToLimitNotification(resizeToTs, toTs) {
	      const colliding = this.colliding.filter(({
	        fromTs
	      }) => fromTs === this.closestOnTo);
	      if (resizeToTs > this.limits.toTs) {
	        this.showTooltipBottom({
	          content: this.loc('BOOKING_RESIZE_GRID_LIMIT')
	        });
	        return;
	      }
	      if (toTs > this.closestOnTo) {
	        if (this.checkClosestByIntersection(colliding)) {
	          this.showTooltipBottom({
	            content: this.loc('BOOKING_RESIZE_INTERSECTIONS_LIMIT')
	          });
	          return;
	        }
	        this.showTooltipBottom({
	          content: this.loc('BOOKING_RESIZE_LIMIT')
	        });
	        return;
	      }
	      this.hideTooltips();
	    },
	    checkClosestByIntersection(colliding) {
	      return this.hasIntersections && (colliding.length === 1 || colliding.filter(coll => coll.resourcesIds[0] !== this.resourceId).length >= 2);
	    },
	    async updateIds(bookingId, resourceId) {
	      await Promise.all([this.$store.dispatch(`${booking_const.Model.Interface}/setResizedBookingId`, bookingId), this.$store.dispatch(`${booking_const.Model.Interface}/setDraggedBookingResourceId`, resourceId)]);
	      void booking_lib_busySlots.busySlots.loadBusySlots();
	    },
	    resizeBooking() {
	      if (!this.dateFromTsRounded || !this.dateToTsRounded) {
	        return;
	      }
	      if (this.dateFromTsRounded === this.booking.dateFromTs && this.dateToTsRounded === this.booking.dateToTs) {
	        return;
	      }
	      const id = this.bookingId;
	      const booking = {
	        id,
	        dateFromTs: this.dateFromTsRounded,
	        dateToTs: this.dateToTsRounded,
	        timezoneFrom: this.booking.timezoneFrom,
	        timezoneTo: this.booking.timezoneTo
	      };
	      if (!booking_lib_isRealId.isRealId(this.bookingId)) {
	        void this.$store.dispatch(`${booking_const.Model.Bookings}/update`, {
	          id,
	          booking
	        });
	        return;
	      }
	      void booking_provider_service_bookingService.bookingService.update({
	        id,
	        ...booking
	      });
	    },
	    roundTimestamp(timestamp) {
	      const fiveMinutes = booking_lib_duration.Duration.getUnitDurations().i * 5;
	      return Math.round(timestamp / fiveMinutes) * fiveMinutes;
	    }
	  },
	  template: `
		<div>
			<div ref="bookingResizeTop" class="booking-booking-resize --from" @mousedown="onMouseDown"></div>
			<div ref="bookingResizeBottom" class="booking-booking-resize --to" @mousedown="onMouseDown"></div>
		</div>
	`
	};

	const BookingWidth = 280;

	const BookingBase = {
	  name: 'BookingBase',
	  props: {
	    bookingId: {
	      type: [Number, String],
	      required: true
	    },
	    resourceId: {
	      type: Number,
	      required: true
	    },
	    nowTs: {
	      type: Number,
	      required: true
	    },
	    width: {
	      type: Number,
	      default: BookingWidth
	    },
	    leftOffset: {
	      type: Number,
	      default: 0
	    },
	    bookingClass: {
	      type: [String, Object, Array],
	      default: ''
	    },
	    bookingStyle: {
	      type: [String, Object, Array],
	      default: ''
	    }
	  },
	  data() {
	    return {
	      visible: true,
	      isDisabledPopupShown: false,
	      resizeFromTs: null,
	      resizeToTs: null
	    };
	  },
	  mounted() {
	    this.updateVisibility();
	    this.updateVisibilityDuringTransition();
	    setTimeout(() => {
	      if (!this.isReal && booking_lib_mousePosition.mousePosition.isMousePressed()) {
	        void this.$refs.resize.startResize();
	      }
	    }, 200);
	  },
	  beforeUnmount() {
	    var _this$booking;
	    if (this.deletingBookings[this.bookingId] || !((_this$booking = this.booking) != null && _this$booking.resourcesIds.includes(this.resourceId))) {
	      this.$el.remove();
	    }
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      resourcesIds: `${booking_const.Model.Interface}/resourcesIds`,
	      zoom: `${booking_const.Model.Interface}/zoom`,
	      scroll: `${booking_const.Model.Interface}/scroll`,
	      draggedBookingId: `${booking_const.Model.Interface}/draggedBookingId`,
	      editingBookingId: `${booking_const.Model.Interface}/editingBookingId`,
	      isEditingBookingMode: `${booking_const.Model.Interface}/isEditingBookingMode`,
	      deletingBookings: `${booking_const.Model.Interface}/deletingBookings`
	    }),
	    isReal() {
	      return booking_lib_isRealId.isRealId(this.bookingId);
	    },
	    booking() {
	      return this.$store.getters[`${booking_const.Model.Bookings}/getById`](this.bookingId);
	    },
	    client() {
	      const clientData = this.booking.primaryClient;
	      return clientData ? this.$store.getters[`${booking_const.Model.Clients}/getByClientData`](clientData) : null;
	    },
	    left() {
	      return booking_lib_grid.grid.calculateLeft(this.resourceId);
	    },
	    top() {
	      return booking_lib_grid.grid.calculateTop(this.dateFromTs);
	    },
	    height() {
	      return booking_lib_grid.grid.calculateHeight(this.dateFromTs, this.dateToTs);
	    },
	    realHeight() {
	      return booking_lib_grid.grid.calculateRealHeight(this.dateFromTs, this.dateToTs);
	    },
	    dateFromTs() {
	      var _this$resizeFromTs;
	      return (_this$resizeFromTs = this.resizeFromTs) != null ? _this$resizeFromTs : this.booking.dateFromTs;
	    },
	    dateToTs() {
	      var _this$resizeToTs;
	      return (_this$resizeToTs = this.resizeToTs) != null ? _this$resizeToTs : this.booking.dateToTs;
	    },
	    dateFromTsRounded() {
	      var _this$roundTimestamp;
	      return (_this$roundTimestamp = this.roundTimestamp(this.resizeFromTs)) != null ? _this$roundTimestamp : this.dateFromTs;
	    },
	    dateToTsRounded() {
	      var _this$roundTimestamp2;
	      return (_this$roundTimestamp2 = this.roundTimestamp(this.resizeToTs)) != null ? _this$roundTimestamp2 : this.dateToTs;
	    },
	    disabled() {
	      return this.isEditingBookingMode && this.editingBookingId !== this.bookingId;
	    },
	    counterOptions() {
	      return Object.freeze({
	        color: booking_component_counter.CounterColor.DANGER,
	        size: booking_component_counter.CounterSize.LARGE
	      });
	    },
	    bookingOffset() {
	      return this.leftOffset * this.zoom;
	    },
	    isExpiredBooking() {
	      return this.booking.dateToTs < this.nowTs;
	    }
	  },
	  methods: {
	    updateVisibilityDuringTransition() {
	      var _this$animation;
	      (_this$animation = this.animation) == null ? void 0 : _this$animation.stop();
	      // eslint-disable-next-line new-cap
	      this.animation = new BX.easing({
	        duration: 200,
	        start: {},
	        finish: {},
	        step: this.updateVisibility
	      });
	      this.animation.animate();
	    },
	    updateVisibility() {
	      if (!this.$el) {
	        return;
	      }
	      const rect = this.$el.getBoundingClientRect();
	      this.visible = rect.right > 0 && rect.left < window.innerWidth;
	    },
	    onNoteMouseEnter() {
	      this.showNoteTimeout = setTimeout(() => this.$refs.note.showViewPopup(), 100);
	    },
	    onNoteMouseLeave() {
	      clearTimeout(this.showNoteTimeout);
	      this.$refs.note.closeViewPopup();
	    },
	    onClick(event) {
	      if (this.disabled) {
	        this.isDisabledPopupShown = true;
	        event.stopPropagation();
	      }
	    },
	    resizeUpdate(resizeFromTs, resizeToTs) {
	      this.resizeFromTs = resizeFromTs;
	      this.resizeToTs = resizeToTs;
	    },
	    roundTimestamp(timestamp) {
	      const fiveMinutes = booking_lib_duration.Duration.getUnitDurations().i * 5;
	      return timestamp ? Math.round(timestamp / fiveMinutes) * fiveMinutes : null;
	    }
	  },
	  watch: {
	    scroll() {
	      this.updateVisibility();
	    },
	    zoom() {
	      this.updateVisibility();
	    },
	    resourcesIds() {
	      this.updateVisibilityDuringTransition();
	    },
	    visible(visible) {
	      if (visible) {
	        return;
	      }
	      setTimeout(() => {
	        this.updateVisibility();
	      }, 2000);
	    }
	  },
	  components: {
	    AddClient,
	    BookingTime,
	    Actions,
	    Name,
	    Note,
	    Profit: Profit$1,
	    Communication,
	    CrmButton,
	    Counter,
	    DisabledPopup,
	    Resize
	  },
	  template: `
		<div
			class="booking-booking-booking"
			data-element="booking-booking"
			:data-id="bookingId"
			:data-resource-id="resourceId"
			:style="[bookingStyle, {
				'--left': left + bookingOffset + 'px',
				'--top': top + 'px',
				'--height': height + 'px',
				'--width': width + 'px',
			}].flat(1)"
			:class="[bookingClass, {
				'--not-real': !isReal,
				'--zoom-is-less-than-08': zoom < 0.8,
				'--compact-mode': realHeight < 40 || zoom < 0.8,
				'--small': realHeight <= 15,
				'--long': realHeight >= 65,
				'--disabled': disabled,
				'--confirmed': booking.isConfirmed,
				'--expired': isExpiredBooking,
				'--resizing': resizeFromTs && resizeToTs,
				'--no-pointer-events': draggedBookingId > 0 && draggedBookingId !== bookingId,
			}].flat(1)"
			@click.capture="onClick"
		>
			<div v-if="visible" class="booking-booking-booking-padding">
				<div class="booking-booking-booking-inner">
					<div class="booking-booking-booking-content">
						<div class="booking-booking-booking-content-row">
							<div
								class="booking-booking-booking-name-container"
								@mouseenter="onNoteMouseEnter"
								@mouseleave="onNoteMouseLeave"
								@click="$refs.note.showViewPopup()"
							>
								<Name :bookingId="bookingId" :resourceId="resourceId"/>
								<Note
									:bookingId="bookingId"
									:bindElement="() => $el"
									ref="note"
								/>
							</div>
							<BookingTime
								:bookingId="bookingId"
								:resourceId="resourceId"
								:dateFromTs="dateFromTsRounded"
								:dateToTs="dateToTsRounded"
							/>
							<Profit :bookingId="bookingId" :resourceId="resourceId"/>
						</div>
						<div class="booking-booking-booking-content-row --lower">
							<BookingTime
								:bookingId="bookingId"
								:resourceId="resourceId"
								:dateFromTs="dateFromTsRounded"
								:dateToTs="dateToTsRounded"
							/>
							<div v-if="client" class="booking-booking-booking-buttons">
								<Communication/>
								<CrmButton :bookingId="bookingId"/>
							</div>
							<AddClient
								v-else
								:bookingId="bookingId"
								:resourceId="resourceId"
								:expired="isExpiredBooking"
							/>
						</div>
					</div>
					<slot name="actions">
						<Actions :bookingId="bookingId" :resourceId="resourceId"/>
					</slot>
				</div>
			</div>
			<Resize
				v-if="!disabled"
				:bookingId="bookingId"
				:resourceId="resourceId"
				ref="resize"
				@update="resizeUpdate"
			/>
			<Counter :bookingId="bookingId"/>
			<DisabledPopup
				v-if="isDisabledPopupShown"
				:bookingId="bookingId"
				:resourceId="resourceId"
				:bindElement="() => $el"
				@close="isDisabledPopupShown = false"
			/>
			<slot/>
		</div>
	`
	};

	function getOverbookingFreeSpace({
	  booking,
	  colliding,
	  selectedDateTs,
	  draggedBookingResourcesIds
	}) {
	  const minTs = new Date(selectedDateTs).setHours(0, 0, 0, 0);
	  const maxTs = new Date(selectedDateTs).setHours(24, 0, 0, 0);
	  const freeSpace = {
	    fromTs: minTs,
	    toTs: maxTs
	  };
	  if (draggedBookingResourcesIds.length > 1) {
	    const bookingColliding = colliding.find(({
	      fromTs
	    }) => fromTs === booking.dateFromTs);
	    if (bookingColliding && draggedBookingResourcesIds.every(id => bookingColliding.resourcesIds.includes(id))) {
	      return null;
	    }
	  }
	  for (const {
	    fromTs,
	    toTs
	  } of colliding) {
	    if (toTs <= booking.dateFromTs) {
	      freeSpace.fromTs = Math.max(freeSpace.fromTs, toTs);
	    }
	    if (booking.dateToTs <= fromTs) {
	      freeSpace.toTs = Math.min(freeSpace.toTs, fromTs);
	    }
	  }
	  if (freeSpace.fromTs === minTs && freeSpace.toTs === maxTs) {
	    return null;
	  }
	  return freeSpace;
	}
	function findTimeForDroppedBooking(freeSpace, booking, droppedBooking) {
	  const duration = droppedBooking.dateToTs - droppedBooking.dateFromTs;
	  if (booking.dateFromTs >= freeSpace.fromTs && booking.dateFromTs + duration <= freeSpace.toTs) {
	    return {
	      dateFromTs: booking.dateFromTs,
	      dateToTs: booking.dateFromTs + duration
	    };
	  }
	  if (booking.dateToTs - duration >= freeSpace.fromTs && booking.dateToTs <= freeSpace.toTs) {
	    return {
	      dateFromTs: booking.dateToTs - duration,
	      dateToTs: booking.dateToTs
	    };
	  }
	  return {
	    dateFromTs: freeSpace.fromTs,
	    dateToTs: freeSpace.fromTs + duration
	  };
	}

	function countBookingWidth(overlappingBookings) {
	  const overlappingBookingsCount = overlappingBookings.length > 0 ? overlappingBookings.length : 1;
	  return BookingWidth / overlappingBookingsCount;
	}
	function countBookingLeftOffset({
	  bookingId,
	  bookingWidth,
	  overlappingBookings
	}) {
	  let index = overlappingBookings.indexOf(bookingId);
	  if (index === -1) {
	    index = 0;
	  }
	  return bookingWidth * index;
	}

	// @vue/component
	const Booking = {
	  name: 'Booking',
	  props: {
	    bookingId: {
	      type: [Number, String],
	      required: true
	    },
	    resourceId: {
	      type: Number,
	      required: true
	    },
	    nowTs: {
	      type: Number,
	      required: true
	    },
	    /**
	     * @param {BookingUiGroup[]} bookingUiGroups
	     */
	    bookingUiGroups: {
	      type: Array,
	      default: () => []
	    }
	  },
	  data() {
	    return {
	      dropArea: false,
	      freeSpace: null
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      getBookingById: `${booking_const.Model.Bookings}/getById`,
	      overbookingMap: `${booking_const.Model.Bookings}/overbookingMap`,
	      selectedDateTs: `${booking_const.Model.Interface}/selectedDateTs`,
	      deletingBookings: `${booking_const.Model.Interface}/deletingBookings`,
	      draggedBookingId: `${booking_const.Model.Interface}/draggedBookingId`,
	      editingBookingId: `${booking_const.Model.Interface}/editingBookingId`,
	      isBookingCreatedFromEmbed: `${booking_const.Model.Interface}/isBookingCreatedFromEmbed`
	    }),
	    booking() {
	      return this.getBookingById(this.bookingId);
	    },
	    deletingBookings() {
	      return Object.values(this.$store.getters[`${booking_const.Model.Interface}/deletingBookings`]);
	    },
	    overbooking() {
	      return this.overbookingMap.get(this.bookingId) || null;
	    },
	    overbookingInResource() {
	      var _this$overbooking, _this$overbooking$ite;
	      return ((_this$overbooking = this.overbooking) == null ? void 0 : (_this$overbooking$ite = _this$overbooking.items) == null ? void 0 : _this$overbooking$ite.find(item => item.resourceId === this.resourceId)) || null;
	    },
	    hasOverbooking() {
	      var _this$overbookingInRe;
	      return (((_this$overbookingInRe = this.overbookingInResource) == null ? void 0 : _this$overbookingInRe.intersections) || []).some(({
	        id
	      }) => !this.deletingBookings.includes(id));
	    },
	    isShifted() {
	      return this.hasOverbooking && main_core.Type.isPlainObject(this.overbookingInResource) && this.overbookingInResource.shifted;
	    },
	    overlappingBookings() {
	      var _this$bookingUiGroups;
	      const bookingId = !this.isShifted || !this.hasOverbooking ? this.bookingId : this.overbookingDependencies[0];
	      return ((_this$bookingUiGroups = this.bookingUiGroups.find(({
	        bookingIds
	      }) => bookingIds.includes(bookingId))) == null ? void 0 : _this$bookingUiGroups.bookingIds) || [];
	    },
	    overbookingDependencies() {
	      var _this$overbookingInRe2;
	      return (((_this$overbookingInRe2 = this.overbookingInResource) == null ? void 0 : _this$overbookingInRe2.intersections) || []).map(({
	        id
	      }) => id);
	    },
	    bookingWidth() {
	      if (this.hasOverbooking) {
	        return countBookingWidth(this.overlappingBookings) / 2;
	      }
	      return countBookingWidth(this.overlappingBookings);
	    },
	    leftOffset() {
	      if (this.isShifted) {
	        const bookingId = this.overbookingDependencies[0];
	        const leftOffset = countBookingLeftOffset({
	          bookingId,
	          bookingWidth: this.bookingWidth,
	          overlappingBookings: this.overlappingBookings
	        });
	        return leftOffset * 2 + this.bookingWidth;
	      }
	      return countBookingLeftOffset({
	        bookingId: this.booking.id,
	        bookingWidth: this.hasOverbooking ? this.bookingWidth * 2 : this.bookingWidth,
	        overlappingBookings: this.overlappingBookings
	      });
	    },
	    actionsPopupOptions() {
	      return {
	        overbooking: {
	          disabled: this.overbooking !== null
	        }
	      };
	    },
	    realBooking() {
	      return main_core.Type.isNumber(this.bookingId);
	    },
	    hasAccent() {
	      return this.editingBookingId === this.bookingId || this.isBookingCreatedFromEmbed(this.bookingId);
	    }
	  },
	  methods: {
	    dragMouseEnter() {
	      if (this.dropArea) {
	        return;
	      }
	      const draggedBookingId = this.draggedBookingId;
	      if (draggedBookingId === null) {
	        return;
	      }
	      const draggedBooking = this.getBookingById(draggedBookingId);
	      const bookingDuration = this.booking.dateToTs - this.booking.dateFromTs;
	      const draggedBookingDuration = draggedBooking.dateToTs - draggedBooking.dateFromTs;
	      if (bookingDuration >= draggedBookingDuration && draggedBooking.resourcesIds.length <= 1) {
	        this.freeSpace = {
	          fromTs: this.booking.dateFromTs,
	          toTs: this.booking.dateToTs,
	          resourcesIds: this.booking.resourcesIds
	        };
	        this.dropArea = true;
	        return;
	      }
	      const excludeBookingFn = booking => {
	        if (booking.id === this.draggedBookingId) {
	          return true;
	        }
	        const overbooking = this.overbookingMap.get(booking.id);
	        const resourceId = this.resourceId;
	        return !overbooking || overbooking.items.some(item => item.resourceId === resourceId);
	      };
	      const colliding = this.$store.getters[`${booking_const.Model.Interface}/getColliding`](this.resourceId, excludeBookingFn);
	      if (colliding.length === 0) {
	        this.freeSpace = {
	          fromTs: this.booking.dateFromTs,
	          toTs: this.booking.dateToTs,
	          resourcesIds: this.booking.resourcesIds
	        };
	        this.dropArea = true;
	        return;
	      }
	      const freeSpace = getOverbookingFreeSpace({
	        booking: this.booking,
	        colliding,
	        selectedDateTs: this.selectedDateTs,
	        draggedBookingResourcesIds: draggedBooking.resourcesIds
	      });
	      this.freeSpace = freeSpace;
	      this.dropArea = freeSpace && freeSpace.toTs - freeSpace.fromTs >= draggedBookingDuration;
	    },
	    dragMouseLeave() {
	      this.dropArea = false;
	      this.freeSpace = null;
	    },
	    dropBooking() {
	      const id = this.draggedBookingId;
	      if (!id || !this.freeSpace) {
	        return;
	      }
	      const droppedBooking = this.getBookingById(id);
	      const {
	        dateFromTs,
	        dateToTs
	      } = findTimeForDroppedBooking(this.freeSpace, this.booking, droppedBooking);
	      const overbooking = {
	        id,
	        dateFromTs,
	        dateToTs,
	        timezoneFrom: droppedBooking.timezoneFrom,
	        timezoneTo: droppedBooking.timezoneTo,
	        resourcesIds: [...new Set([this.resourceId, ...droppedBooking.resourcesIds.slice(1, droppedBooking.resourcesIds.length)])]
	      };
	      if (!booking_lib_isRealId.isRealId(id)) {
	        void this.$store.dispatch(`${booking_const.Model.Bookings}/update`, {
	          id,
	          booking: overbooking
	        });
	        return;
	      }
	      void booking_provider_service_bookingService.bookingService.update({
	        id,
	        ...overbooking
	      });
	    },
	    startDropHandler() {
	      main_core.Event.bind(this.$el, 'mousemove', this.dragMouseEnter, {
	        capture: true
	      });
	      main_core.Event.bind(this.$el, 'mouseleave', this.dragMouseLeave, {
	        capture: true
	      });
	      main_core.Event.bind(this.$el, 'mouseup', this.dropBooking, {
	        capture: true
	      });
	    },
	    stopDropHandler() {
	      this.dropArea = false;
	      this.freeSpace = null;
	      main_core.Event.unbind(this.$el, 'mousemove', this.dragMouseEnter, {
	        capture: true
	      });
	      main_core.Event.unbind(this.$el, 'mouseleave', this.dragMouseLeave, {
	        capture: true
	      });
	      main_core.Event.unbind(this.$el, 'mouseup', this.dropBooking, {
	        capture: true
	      });
	    }
	  },
	  watch: {
	    draggedBookingId(draggedBookingId) {
	      if (draggedBookingId === this.bookingId || this.hasOverbooking) {
	        return;
	      }
	      if (draggedBookingId === null) {
	        this.stopDropHandler();
	      } else {
	        this.startDropHandler();
	      }
	    }
	  },
	  components: {
	    BookingBase,
	    Actions
	  },
	  template: `
		<BookingBase
			:bookingId
			:resourceId
			:nowTs
			:leftOffset
			:bookingClass="{
				'--short': overlappingBookings.length > 1,
				'--overbooking': hasOverbooking,
				'--shifted': isShifted && !realBooking,
				'--drop-area': dropArea,
				'--accent': hasAccent,
			}"
			:width="bookingWidth"
		>
			<template #actions>
				<Actions
					:bookingId
					:resourceId
					:actionsPopupOptions
				/>
			</template>
			<div class="booking--booking-pseudo-overbooking"></div>
		</BookingBase>
	`
	};

	const BusyPopup = {
	  emits: ['close'],
	  props: {
	    busySlot: {
	      type: Object,
	      required: true
	    }
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      offset: `${booking_const.Model.Interface}/offset`,
	      mousePosition: `${booking_const.Model.Interface}/mousePosition`
	    }),
	    resource() {
	      const resourceId = this.busySlot.type === booking_const.BusySlot.Intersection ? this.busySlot.intersectingResourceId : this.busySlot.resourceId;
	      return this.$store.getters[`${booking_const.Model.Resources}/getById`](resourceId);
	    },
	    popupId() {
	      return `booking-booking-busy-popup-${this.busySlot.resourceId}`;
	    },
	    config() {
	      const width = 200;
	      const angleLeft = main_popup.Popup.getOption('angleMinBottom');
	      const angleOffset = width / 2 - angleLeft;
	      return {
	        bindElement: this.mousePosition,
	        width,
	        background: '#2878ca',
	        offsetTop: -5,
	        offsetLeft: -angleOffset + angleLeft,
	        bindOptions: {
	          forceBindPosition: true,
	          position: 'top'
	        },
	        angle: {
	          offset: angleOffset,
	          position: 'bottom'
	        },
	        angleBorderRadius: '4px 0',
	        autoHide: false
	      };
	    },
	    textFormatted() {
	      const timeFormat = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
	      const messageId = this.busySlot.type === booking_const.BusySlot.Intersection ? 'BOOKING_BOOKING_INTERSECTING_RESOURCE_IS_BUSY' : 'BOOKING_BOOKING_RESOURCE_IS_BUSY';
	      return this.loc(messageId, {
	        '#RESOURCE#': this.resource.name,
	        '#TIME_FROM#': main_date.DateTimeFormat.format(timeFormat, (this.busySlot.fromTs + this.offset) / 1000),
	        '#TIME_TO#': main_date.DateTimeFormat.format(timeFormat, (this.busySlot.toTs + this.offset) / 1000)
	      });
	    }
	  },
	  methods: {
	    adjustPosition() {
	      var _this$$refs$popup;
	      const popup = (_this$$refs$popup = this.$refs.popup) == null ? void 0 : _this$$refs$popup.getPopupInstance();
	      if (!popup) {
	        return;
	      }
	      popup.setBindElement(this.mousePosition);
	      popup.adjustPosition();
	    },
	    closePopup() {
	      this.$emit('close');
	    }
	  },
	  watch: {
	    mousePosition: {
	      handler() {
	        this.adjustPosition();
	      },
	      deep: true
	    }
	  },
	  components: {
	    Popup: booking_component_popup.Popup
	  },
	  template: `
		<Popup
			:id="popupId"
			:config="config"
			ref="popup"
			@close="closePopup"
		>
			<div class="booking-booking-busy-popup">
				{{ textFormatted }}
			</div>
		</Popup>
	`
	};

	const {
	  mapGetters: mapInterfaceGetters
	} = ui_vue3_vuex.createNamespacedHelpers(booking_const.Model.Interface);
	const BookingBusySlotClassName = 'booking-booking-busy-slot';
	const BusySlot = {
	  name: 'BusySlot',
	  props: {
	    busySlot: {
	      type: Object,
	      required: true
	    }
	  },
	  setup() {
	    return {
	      BookingBusySlotClassName
	    };
	  },
	  data() {
	    return {
	      isPopupShown: false
	    };
	  },
	  computed: {
	    ...mapInterfaceGetters({
	      disabledBusySlots: 'disabledBusySlots',
	      isFilterMode: 'isFilterMode',
	      isEditingBookingMode: 'isEditingBookingMode',
	      isDragMode: 'isDragMode'
	    }),
	    isDisabled() {
	      const isDragOffHours = this.isDragMode && this.busySlot.type === booking_const.BusySlot.OffHours;
	      if (this.isFilterMode || isDragOffHours) {
	        return true;
	      }
	      return this.busySlot.id in this.disabledBusySlots;
	    },
	    left() {
	      return booking_lib_grid.grid.calculateLeft(this.busySlot.resourceId);
	    },
	    top() {
	      return booking_lib_grid.grid.calculateTop(this.busySlot.fromTs);
	    },
	    height() {
	      return booking_lib_grid.grid.calculateHeight(this.busySlot.fromTs, this.busySlot.toTs);
	    }
	  },
	  methods: {
	    onClick() {
	      if (this.isFilterMode || this.isEditingBookingMode || this.busySlot.type === booking_const.BusySlot.Intersection) {
	        return;
	      }
	      void this.$store.dispatch(`${booking_const.Model.Interface}/addDisabledBusySlot`, this.busySlot);
	    },
	    onMouseEnter() {
	      clearTimeout(this.showTimeout);
	      this.showTimeout = setTimeout(() => this.showPopup(), 300);
	      main_core.Event.unbind(document, 'mousemove', this.onMouseMove);
	      main_core.Event.bind(document, 'mousemove', this.onMouseMove);
	    },
	    onMouseMove(event) {
	      if (this.cursorInsideContainer(event.target)) {
	        this.updatePopup(event);
	      } else {
	        main_core.Event.unbind(document, 'mousemove', this.onMouseMove);
	        this.closePopup();
	      }
	    },
	    onMouseLeave(event) {
	      var _event$relatedTarget, _event$relatedTarget$;
	      if ((_event$relatedTarget = event.relatedTarget) != null && (_event$relatedTarget$ = _event$relatedTarget.closest('.popup-window')) != null && _event$relatedTarget$.querySelector('.booking-booking-busy-popup')) {
	        return;
	      }
	      main_core.Event.unbind(document, 'mousemove', this.onMouseMove);
	      this.closePopup();
	    },
	    cursorInsideContainer(eventTarget) {
	      return !main_core.Type.isNull(eventTarget) && main_core.Dom.hasClass(eventTarget, this.BookingBusySlotClassName);
	    },
	    updatePopup(event) {
	      var _this$$refs$container, _this$showTimeout;
	      const rect = (_this$$refs$container = this.$refs.container) == null ? void 0 : _this$$refs$container.getBoundingClientRect();
	      if (this.isDragMode || !rect || event.clientY > rect.top + rect.height || event.clientY < rect.top || event.clientX < rect.left || event.clientX > rect.left + rect.width) {
	        this.closePopup();
	        return;
	      }
	      (_this$showTimeout = this.showTimeout) != null ? _this$showTimeout : this.showTimeout = setTimeout(() => this.showPopup(), 300);
	    },
	    showPopup() {
	      this.isPopupShown = true;
	    },
	    closePopup() {
	      clearTimeout(this.showTimeout);
	      this.showTimeout = null;
	      this.isPopupShown = false;
	    }
	  },
	  components: {
	    BusyPopup
	  },
	  template: `
		<div
			v-if="left >= 0"
			:class="[BookingBusySlotClassName, {
				'--disabled': isDisabled,
			}]"
			:style="{
				'--left': left + 'px',
				'--top': top + 'px',
				'--height': height + 'px',
			}"
			data-element="booking-busy-slot"
			:data-id="busySlot.resourceId"
			:data-from="busySlot.fromTs"
			:data-to="busySlot.toTs"
			ref="container"
			@click.stop="onClick"
			@mouseenter.stop="onMouseEnter"
			@mouseleave.stop="onMouseLeave"
		></div>
		<BusyPopup
			v-if="isPopupShown"
			:busySlot="busySlot"
			@close="closePopup"
		/>
	`
	};

	/**
	 * @typedef {Object} Cell
	 * @property {string} id
	 * @property {number} fromTs
	 * @property {number} toTs
	 * @property {number} resourceId
	 * @property {boolean} boundedToBottom
	 */
	const BaseCell = {
	  props: {
	    /** @type {Cell} */
	    cell: {
	      type: Object,
	      required: true
	    },
	    className: {
	      type: [String, Object],
	      default: ''
	    }
	  },
	  components: {
	    Icon: ui_iconSet_api_vue.BIcon
	  },
	  data() {
	    return {
	      IconSet: ui_iconSet_api_vue.Set
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      selectedCells: `${booking_const.Model.Interface}/selectedCells`,
	      zoom: `${booking_const.Model.Interface}/zoom`,
	      intersections: `${booking_const.Model.Interface}/intersections`,
	      timezone: `${booking_const.Model.Interface}/timezone`,
	      offset: `${booking_const.Model.Interface}/offset`,
	      isFeatureEnabled: `${booking_const.Model.Interface}/isFeatureEnabled`,
	      draggedBookingId: `${booking_const.Model.Interface}/draggedBookingId`,
	      embedItems: `${booking_const.Model.Interface}/embedItems`
	    }),
	    selected() {
	      return this.cell.id in this.selectedCells;
	    },
	    hasSelectedCells() {
	      return Object.keys(this.selectedCells).length > 0;
	    },
	    timeFormatted() {
	      const timeFormat = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
	      return this.loc('BOOKING_BOOKING_TIME_RANGE', {
	        '#FROM#': main_date.DateTimeFormat.format(timeFormat, (this.cell.fromTs + this.offset) / 1000),
	        '#TO#': main_date.DateTimeFormat.format(timeFormat, (this.cell.toTs + this.offset) / 1000)
	      });
	    },
	    height() {
	      return booking_lib_grid.grid.calculateRealHeight(this.cell.fromTs, this.cell.toTs);
	    },
	    externalData() {
	      return this.embedItems;
	    },
	    clients() {
	      const clients = this.embedItems.filter(item => {
	        return item.entityTypeId === 'CONTACT' || item.entityTypeId === 'COMPANY';
	      });
	      return clients.map(item => {
	        return {
	          id: item.value,
	          type: {
	            code: item.entityTypeId,
	            module: item.moduleId
	          }
	        };
	      });
	    }
	  },
	  methods: {
	    onCellSelected({
	      target: {
	        checked
	      }
	    }) {
	      if (!this.isFeatureEnabled) {
	        booking_lib_limit.limit.show();
	        return;
	      }
	      if (checked) {
	        this.$store.dispatch(`${booking_const.Model.Interface}/addSelectedCell`, this.cell);
	      } else {
	        this.$store.dispatch(`${booking_const.Model.Interface}/removeSelectedCell`, this.cell);
	      }
	    },
	    onMouseDown() {
	      var _this$intersections$, _this$intersections$t;
	      if (!this.isFeatureEnabled) {
	        void booking_lib_limit.limit.show();
	        return;
	      }
	      void this.$store.dispatch(`${booking_const.Model.Interface}/setHoveredCell`, null);
	      this.creatingBookingId = `tmp-id-${Date.now()}-${Math.random()}`;
	      void this.$store.dispatch(`${booking_const.Model.Interface}/addQuickFilterIgnoredBookingId`, this.creatingBookingId);
	      void this.$store.dispatch(`${booking_const.Model.Bookings}/add`, {
	        id: this.creatingBookingId,
	        dateFromTs: this.cell.fromTs,
	        dateToTs: this.cell.toTs,
	        resourcesIds: [...new Set([this.cell.resourceId, ...((_this$intersections$ = this.intersections[0]) != null ? _this$intersections$ : []), ...((_this$intersections$t = this.intersections[this.cell.resourceId]) != null ? _this$intersections$t : [])])],
	        timezoneFrom: this.timezone,
	        timezoneTo: this.timezone,
	        externalData: this.externalData,
	        clients: this.clients
	      });
	      void this.addCreatedFromEmbedBooking(this.creatingBookingId);
	      main_core.Event.bind(window, 'mouseup', this.addBooking);
	    },
	    addBooking() {
	      main_core.Event.unbind(window, 'mouseup', this.addBooking);
	      if (!this.isFeatureEnabled) {
	        void booking_lib_limit.limit.show();
	        return;
	      }
	      setTimeout(async () => {
	        const creatingBooking = this.$store.getters[`${booking_const.Model.Bookings}/getById`](this.creatingBookingId);
	        const result = await booking_provider_service_bookingService.bookingService.add(creatingBooking);
	        if (result.success && result.booking) {
	          const overbookingMap = this.$store.getters[`${booking_const.Model.Bookings}/overbookingMap`];
	          booking_lib_analytics.BookingAnalytics.sendAddBooking({
	            isOverbooking: Boolean(overbookingMap == null ? void 0 : overbookingMap.has == null ? void 0 : overbookingMap.has(result.booking.id))
	          });
	          await this.addCreatedFromEmbedBooking(result.booking.id);
	        }
	      });
	    },
	    async addCreatedFromEmbedBooking(id) {
	      await this.$store.dispatch(`${booking_const.Model.Interface}/addCreatedFromEmbedBooking`, id);
	    }
	  },
	  template: `
		<div
			class="booking-booking-base-cell"
			:class="[className, {
				'--selected': selected,
				'--bounded-to-bottom': cell.boundedToBottom,
				'--height-is-less-than-40': height < 40,
				'--compact-mode': height < 40 || zoom < 0.8,
				'--small': height <= 12.5,
			}]"
			:style="{
				'--height': height + 'px',
			}"
			data-element="booking-base-cell"
			:data-resource-id="cell.resourceId"
			:data-from="cell.fromTs"
			:data-to="cell.toTs"
			:data-selected="selected"
		>
			<div class="booking-booking-grid-cell-padding">
				<div class="booking-booking-grid-cell-inner">
					<label
						class="booking-booking-grid-cell-time"
						data-element="booking-grid-cell-select-label"
					>
						<span class="booking-booking-grid-cell-time-inner">
							<input
								v-if="!draggedBookingId"
								class="booking-booking-grid-cell-checkbox"
								type="checkbox"
								:checked="selected"
								@change="onCellSelected"
							>
							<span data-element="booking-grid-cell-time">
								{{ timeFormatted }}
							</span>
						</span>
					</label>
					<div
						v-if="!hasSelectedCells && !draggedBookingId"
						class="booking-booking-grid-cell-select-button-container"
						ref="button"
					>
						<div
							class="booking-booking-grid-cell-select-button"
							:class="{'--lock': !isFeatureEnabled}"
							data-element="booking-grid-cell-add-button"
							@mousedown="onMouseDown"
						>
							<div class="booking-booking-grid-cell-select-button-text">
								{{ loc('BOOKING_BOOKING_SELECT') }}
								<Icon v-if="!isFeatureEnabled" :name="IconSet.LOCK" />
							</div>
							<div class="ui-icon-set --chevron-right"></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`
	};

	/**
	 * @typedef {Object} Cell
	 * @property {string} id
	 * @property {number} fromTs
	 * @property {number} toTs
	 * @property {number} resourceId
	 * @property {boolean} boundedToBottom
	 */
	const Cell = {
	  props: {
	    /** @type {Cell} */
	    cell: {
	      type: Object,
	      required: true
	    }
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      overbookingMap: `${booking_const.Model.Bookings}/overbookingMap`
	    }),
	    overbookingPositionsInCell() {
	      const resourceId = this.cell.resourceId;
	      const cellTimespan = {
	        dateFromTs: this.cell.fromTs,
	        dateToTs: this.cell.toTs
	      };
	      const positions = [];
	      for (const [, overbooking] of this.overbookingMap) {
	        const resourceOverbooking = overbooking.items.find(item => item.resourceId === resourceId);
	        if (resourceOverbooking && booking_lib_checkBookingIntersection.checkBookingIntersection(overbooking.booking, cellTimespan) && !positions.includes(resourceOverbooking == null ? void 0 : resourceOverbooking.shifted)) {
	          positions.push(resourceOverbooking == null ? void 0 : resourceOverbooking.shifted);
	        }
	        if (positions.length > 2) {
	          break;
	        }
	      }
	      return positions;
	    },
	    left() {
	      const left = booking_lib_grid.grid.calculateLeft(this.cell.resourceId);
	      const overbookingPositions = this.overbookingPositionsInCell;
	      if (overbookingPositions.length > 1) {
	        return -1;
	      }
	      if (overbookingPositions.length === 0 || overbookingPositions[0]) {
	        return left;
	      }
	      return left + booking_lib_grid.grid.calculateWidth(this.width);
	    },
	    top() {
	      return booking_lib_grid.grid.calculateTop(this.cell.fromTs);
	    },
	    height() {
	      return booking_lib_grid.grid.calculateHeight(this.cell.fromTs, this.cell.toTs);
	    },
	    width() {
	      return this.overbookingPositionsInCell.length === 0 ? 280 : 280 / 2;
	    }
	  },
	  components: {
	    BaseCell
	  },
	  template: `
		<div
			v-if="left >= 0"
			class="booking-booking-selected-cell"
			:style="{
				'--left': left + 'px',
				'--top': top + 'px',
				'--height': height + 'px',
				'--width': width + 'px',
			}"
			@mouseleave="$store.dispatch('interface/setHoveredCell', null)"
		>
			<BaseCell
				:cell="cell"
				:className="{ '--overbooking': overbookingPositionsInCell.length > 0 }"
			/>
		</div>
	`
	};

	const QuickFilterLine = {
	  props: {
	    hour: {
	      type: Number,
	      required: true
	    }
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      selectedDateTs: `${booking_const.Model.Interface}/selectedDateTs`,
	      resourcesIds: `${booking_const.Model.Interface}/resourcesIds`
	    }),
	    top() {
	      return booking_lib_grid.grid.calculateTop(this.fromTs);
	    },
	    width() {
	      return this.resourcesIds.length * 280;
	    },
	    fromTs() {
	      return new Date(this.selectedDateTs).setHours(this.hour);
	    }
	  },
	  template: `
		<div
			class="booking-booking-quick-filter-line"
			:style="{
				'--top': top + 'px',
				'--width': width + 'px',
			}"
		></div>
	`
	};

	const MinUiBookingDurationMs = 15 * 60 * 1000;

	function getBookingUiSlot({
	  dateFromTs,
	  dateToTs
	}) {
	  const duration = dateToTs - dateFromTs;
	  return [dateFromTs, duration < MinUiBookingDurationMs ? dateFromTs + MinUiBookingDurationMs : dateToTs];
	}
	function createBookingModelUi(resourceId, booking, overbookingMapItem) {
	  var _overbookingMapItem$i;
	  return {
	    ...booking,
	    resourcesIds: [resourceId],
	    uiSlot: getBookingUiSlot(booking),
	    overbooking: overbookingMapItem == null ? void 0 : (_overbookingMapItem$i = overbookingMapItem.items) == null ? void 0 : _overbookingMapItem$i.some(item => {
	      return item.resourceId === resourceId && item.shifted;
	    })
	  };
	}
	function splitBookingsByResourceId(bookings) {
	  const resourceBookingsMap = new Map();
	  for (const booking of bookings) {
	    var _booking$resourcesIds;
	    const resourceId = ((_booking$resourcesIds = booking.resourcesIds) == null ? void 0 : _booking$resourcesIds[0]) || 0;
	    let resourceBookings = [];
	    if (resourceBookingsMap.has(resourceId)) {
	      resourceBookings = resourceBookingsMap.get(resourceId) || [];
	    }
	    resourceBookings.push(booking);
	    resourceBookingsMap.set(resourceId, resourceBookings);
	  }
	  return resourceBookingsMap;
	}
	function groupBookingUis(bookings) {
	  const groups = [];
	  if (bookings.length === 0) {
	    return groups;
	  }
	  let group = {
	    slot: [0, 0],
	    bookingIds: []
	  };
	  bookings.filter(booking => !booking.overbooking).map(booking => {
	    return {
	      id: booking.id,
	      uiSlot: booking.uiSlot
	    };
	  }).sort((a, b) => a.uiSlot[0] - b.uiSlot[0]).forEach(booking => {
	    if (group.bookingIds.length === 0) {
	      group.slot = [booking.uiSlot[0], booking.uiSlot[1]];
	    } else if (booking_lib_inInterval.inInterval(booking.uiSlot[0], group.slot)) {
	      group.slot[1] = booking.uiSlot[1];
	    } else {
	      groups.push(group);
	      group = {
	        slot: [booking.uiSlot[0], booking.uiSlot[1]],
	        bookingIds: []
	      };
	    }
	    group.bookingIds.push(booking.id);
	  });
	  groups.push(group);
	  return groups;
	}
	function getResourceBookingUiGroups(resourceBookingsMap) {
	  const resourceBookingUiGroups = new Map();
	  if (resourceBookingsMap instanceof Map) {
	    [...resourceBookingsMap.keys()].forEach(resourceId => {
	      const bookingGroups = groupBookingUis(resourceBookingsMap.get(resourceId) || []);
	      resourceBookingUiGroups.set(resourceId, bookingGroups);
	    });
	  }
	  return resourceBookingUiGroups;
	}

	const {
	  mapGetters: mapBookingsGetters
	} = ui_vue3_vuex.createNamespacedHelpers(booking_const.Model.Bookings);
	const {
	  mapGetters: mapInterfaceGetters$1
	} = ui_vue3_vuex.createNamespacedHelpers(booking_const.Model.Interface);
	const Bookings = {
	  name: 'Bookings',
	  data() {
	    return {
	      nowTs: Date.now()
	    };
	  },
	  computed: {
	    ...mapBookingsGetters({
	      overbookingMap: 'overbookingMap'
	    }),
	    ...mapInterfaceGetters$1({
	      resourcesIds: 'resourcesIds',
	      selectedDateTs: 'selectedDateTs',
	      isFilterMode: 'isFilterMode',
	      filteredBookingsIds: 'filteredBookingsIds',
	      selectedCells: 'selectedCells',
	      hoveredCell: 'hoveredCell',
	      busySlots: 'busySlots',
	      quickFilter: 'quickFilter',
	      isFeatureEnabled: 'isFeatureEnabled',
	      editingBookingId: 'editingBookingId',
	      embedItems: 'embedItems'
	    }),
	    resourcesHash() {
	      const resources = this.$store.getters[`${booking_const.Model.Resources}/getByIds`](this.resourcesIds).map(({
	        id,
	        slotRanges
	      }) => ({
	        id,
	        slotRanges
	      }));
	      return JSON.stringify(resources);
	    },
	    bookingsHash() {
	      const bookings = this.bookings.map(({
	        id,
	        dateFromTs,
	        dateToTs
	      }) => ({
	        id,
	        dateFromTs,
	        dateToTs
	      }));
	      return JSON.stringify(bookings);
	    },
	    bookings() {
	      const dateTs = this.selectedDateTs;
	      let bookings = [];
	      if (this.isFilterMode) {
	        bookings = this.$store.getters[`${booking_const.Model.Bookings}/getByDateAndIds`](dateTs, this.filteredBookingsIds);
	      } else {
	        bookings = this.$store.getters[`${booking_const.Model.Bookings}/getByDateAndResources`](dateTs, this.resourcesIds);
	      }
	      return bookings.flatMap(booking => {
	        return booking.resourcesIds.filter(resourceId => this.resourcesIds.includes(resourceId)).map(resourceId => {
	          return createBookingModelUi(resourceId, booking, this.overbookingMap.get(booking.id));
	        });
	      });
	    },
	    cells() {
	      const cells = [...Object.values(this.selectedCells), this.hoveredCell];
	      const dateFromTs = this.selectedDateTs;
	      const dateToTs = new Date(dateFromTs).setDate(new Date(dateFromTs).getDate() + 1);
	      return cells.filter(cell => cell && cell.toTs > dateFromTs && dateToTs > cell.fromTs);
	    },
	    quickFilterHours() {
	      const activeHours = new Set(Object.values(this.quickFilter.active));
	      return Object.values(this.quickFilter.hovered).filter(hour => !activeHours.has(hour));
	    },
	    resourceBookings() {
	      return splitBookingsByResourceId(this.bookings);
	    },
	    resourceBookingsUiGroupsMap() {
	      return getResourceBookingUiGroups(this.resourceBookings);
	    },
	    embedEditingMode() {
	      var _this$embedItems$leng, _this$embedItems;
	      return this.isFeatureEnabled && (this.editingBookingId > 0 || ((_this$embedItems$leng = (_this$embedItems = this.embedItems) == null ? void 0 : _this$embedItems.length) != null ? _this$embedItems$leng : 0) > 0);
	    }
	  },
	  mounted() {
	    this.startInterval();
	    if (this.isFeatureEnabled) {
	      const dataId = this.editingBookingId ? `[data-id="${this.editingBookingId}"]` : '';
	      this.dragManager = new booking_lib_drag.Drag({
	        container: this.$el.parentElement,
	        draggable: `.booking-booking-booking${dataId}`
	      });
	    }
	  },
	  beforeUnmount() {
	    var _this$dragManager;
	    (_this$dragManager = this.dragManager) == null ? void 0 : _this$dragManager.destroy();
	  },
	  methods: {
	    generateBookingKey(booking) {
	      return `${booking.id}-${booking.resourcesIds[0]}`;
	    },
	    getBookingUiGroupsByResourceId(resourceId) {
	      return this.resourceBookingsUiGroupsMap.get(resourceId) || [];
	    },
	    startInterval() {
	      setInterval(() => {
	        this.nowTs = Date.now();
	      }, 5 * 1000);
	    }
	  },
	  watch: {
	    selectedDateTs() {
	      void booking_lib_busySlots.busySlots.loadBusySlots();
	    },
	    bookingsHash() {
	      void booking_lib_busySlots.busySlots.loadBusySlots();
	    },
	    resourcesHash() {
	      void booking_lib_busySlots.busySlots.loadBusySlots();
	    },
	    overbookingMap() {
	      void booking_lib_busySlots.busySlots.loadBusySlots();
	    }
	  },
	  components: {
	    Booking,
	    BusySlot,
	    Cell,
	    QuickFilterLine
	  },
	  template: `
		<div
			class="booking-booking-bookings"
			:class="{
				'embed-editing-mode': embedEditingMode,
			}"
		>
			<TransitionGroup name="booking-transition-booking">
				<template v-for="booking of bookings" :key="generateBookingKey(booking)">
					<Booking
						:bookingId="booking.id"
						:resourceId="booking.resourcesIds[0]"
						:nowTs
						:bookingUiGroups="getBookingUiGroupsByResourceId(booking.resourcesIds[0])"
					/>
				</template>
			</TransitionGroup>
			<template v-for="busySlot of busySlots" :key="busySlot.id">
				<BusySlot
					:busySlot="busySlot"
				/>
			</template>
			<template v-for="cell of cells" :key="cell.id">
				<Cell
					:cell="cell"
				/>
			</template>
			<template v-for="hour of quickFilterHours" :key="hour">
				<QuickFilterLine
					:hour="hour"
				/>
			</template>
		</div>
	`
	};

	const halfHour = 30 * 60 * 1000;
	const Cell$1 = {
	  name: 'Cell',
	  props: {
	    /** @type {CellDto} */
	    cell: {
	      type: Object,
	      required: true
	    }
	  },
	  data() {
	    return {
	      halfOffset: 0
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      overbookingMap: `${booking_const.Model.Bookings}/overbookingMap`,
	      isFilterMode: `${booking_const.Model.Interface}/isFilterMode`,
	      isEditingBookingMode: `${booking_const.Model.Interface}/isEditingBookingMode`,
	      draggedBookingId: `${booking_const.Model.Interface}/draggedBookingId`,
	      resizedBookingId: `${booking_const.Model.Interface}/resizedBookingId`,
	      quickFilter: `${booking_const.Model.Interface}/quickFilter`
	    }),
	    isAvailable() {
	      if (this.isFilterMode || this.resizedBookingId || this.isEditingBookingMode && !this.draggedBookingId) {
	        return false;
	      }
	      const {
	        fromTs,
	        toTs
	      } = this.freeSpace;
	      const cellFromTs = this.cell.fromTs;
	      const cellHalfTs = this.cell.fromTs + halfHour;
	      return (toTs > cellFromTs || toTs > cellHalfTs) && toTs - fromTs >= this.duration;
	    },
	    fromTs() {
	      return Math.min(this.freeSpace.toTs - this.duration, this.cell.fromTs) + this.halfOffset;
	    },
	    toTs() {
	      return this.fromTs + this.duration;
	    },
	    duration() {
	      if (this.draggedBooking) {
	        return this.draggedBooking.dateToTs - this.draggedBooking.dateFromTs;
	      }
	      return this.cell.toTs - this.cell.fromTs;
	    },
	    draggedBooking() {
	      var _this$$store$getters;
	      return (_this$$store$getters = this.$store.getters[`${booking_const.Model.Bookings}/getById`](this.draggedBookingId)) != null ? _this$$store$getters : null;
	    },
	    freeSpace() {
	      let maxFrom = 0;
	      let minTo = Infinity;
	      for (const {
	        fromTs,
	        toTs
	      } of this.colliding) {
	        if (this.cell.fromTs + halfHour > fromTs && this.cell.fromTs + halfHour < toTs) {
	          maxFrom = toTs;
	          minTo = fromTs;
	          break;
	        }
	        if (toTs <= this.cell.fromTs + halfHour) {
	          maxFrom = Math.max(maxFrom, toTs);
	        }
	        if (fromTs >= this.cell.fromTs + halfHour) {
	          minTo = Math.min(minTo, fromTs);
	        }
	      }
	      return {
	        fromTs: maxFrom,
	        toTs: minTo
	      };
	    },
	    colliding() {
	      return this.$store.getters[`${booking_const.Model.Interface}/getColliding`](this.cell.resourceId, this.excludeBookingColliding);
	    },
	    quickFilterHovered() {
	      return this.cell.minutes / 60 in this.quickFilter.hovered;
	    },
	    quickFilterActive() {
	      return this.cell.minutes / 60 in this.quickFilter.active;
	    }
	  },
	  methods: {
	    excludeBookingColliding(booking) {
	      if (booking.id === this.draggedBookingId) {
	        return true;
	      }
	      const resourceId = this.cell.resourceId;
	      const overbooking = this.overbookingMap.get(booking.id);
	      return overbooking && overbooking.items.some(item => item.resourceId === resourceId);
	    },
	    mouseEnterHandler(event) {
	      this.updateHalfHour(event);
	    },
	    mouseLeaveHandler(event) {
	      var _event$relatedTarget, _nextHoveredCell$data;
	      const nextHoveredCell = (_event$relatedTarget = event.relatedTarget) == null ? void 0 : _event$relatedTarget.closest('.booking-booking-base-cell');
	      if (!nextHoveredCell || (nextHoveredCell == null ? void 0 : (_nextHoveredCell$data = nextHoveredCell.dataset) == null ? void 0 : _nextHoveredCell$data.selected) === 'true') {
	        void this.$store.dispatch(`${booking_const.Model.Interface}/setHoveredCell`, null);
	      }
	    },
	    mouseMoveHandler(event) {
	      this.updateHalfHour(event);
	    },
	    updateHalfHour(event) {
	      var _this$$refs$button;
	      if ((_this$$refs$button = this.$refs.button) != null && _this$$refs$button.contains(event.target)) {
	        return;
	      }
	      this.halfOffset = 0;
	      const clientY = event.clientY - window.scrollY;
	      const rect = this.$el.getBoundingClientRect();
	      const bottomHalf = clientY > (rect.top + rect.top + rect.height) / 2;
	      const canSubtractHalfHour = this.fromTs >= this.freeSpace.fromTs;
	      const canAddHalfHour = this.toTs + halfHour <= this.freeSpace.toTs;
	      if (bottomHalf && canAddHalfHour || !bottomHalf && !canSubtractHalfHour) {
	        this.halfOffset = halfHour;
	      }
	      if (!bottomHalf && !canSubtractHalfHour && this.freeSpace.fromTs - this.cell.fromTs > 0) {
	        this.halfOffset = this.freeSpace.fromTs - this.cell.fromTs;
	      }
	      if (!bottomHalf && canSubtractHalfHour || bottomHalf && !canAddHalfHour) {
	        this.halfOffset = 0;
	      }
	      const offsetNotMatchesHalf = bottomHalf === (this.halfOffset === 0);
	      if (this.duration <= halfHour && offsetNotMatchesHalf) {
	        this.clearCell(event);
	        return;
	      }
	      this.hoverCell({
	        id: `${this.cell.resourceId}-${this.fromTs}-${this.toTs}`,
	        fromTs: this.fromTs,
	        toTs: this.toTs,
	        resourceId: this.cell.resourceId,
	        boundedToBottom: this.toTs === this.freeSpace.toTs
	      });
	    },
	    clearCell(event) {
	      var _event$relatedTarget2, _nextHoveredCell$data2;
	      const nextHoveredCell = (_event$relatedTarget2 = event.relatedTarget) == null ? void 0 : _event$relatedTarget2.closest('.booking-booking-base-cell');
	      if (!nextHoveredCell || (nextHoveredCell == null ? void 0 : (_nextHoveredCell$data2 = nextHoveredCell.dataset) == null ? void 0 : _nextHoveredCell$data2.selected) === 'true') {
	        void this.$store.dispatch(`${booking_const.Model.Interface}/setHoveredCell`, null);
	      }
	    },
	    hoverCell(cell) {
	      void this.$store.dispatch(`${booking_const.Model.Interface}/setHoveredCell`, null);
	      if (this.isAvailable) {
	        void this.$store.dispatch(`${booking_const.Model.Interface}/setHoveredCell`, cell);
	      }
	    }
	  },
	  watch: {
	    draggedBookingId() {
	      if (!this.draggedBookingId) {
	        void this.$store.dispatch(`${booking_const.Model.Interface}/setHoveredCell`, null);
	      }
	    }
	  },
	  template: `
		<div
			class="booking-booking-grid-cell"
			:class="{
				'--quick-filter-hovered': quickFilterHovered,
				'--quick-filter-active': quickFilterActive,
			}"
			data-element="booking-grid-cell"
			:data-resource-id="cell.resourceId"
			:data-from="cell.fromTs"
			:data-to="cell.toTs"
			@mouseenter="mouseEnterHandler"
			@mouseleave="mouseLeaveHandler"
			@mousemove="mouseMoveHandler"
		></div>
	`
	};

	const OffHours$1 = {
	  props: {
	    bottom: {
	      type: Boolean,
	      default: false
	    }
	  },
	  computed: ui_vue3_vuex.mapGetters({
	    offHoursHover: `${booking_const.Model.Interface}/offHoursHover`,
	    offHoursExpanded: `${booking_const.Model.Interface}/offHoursExpanded`
	  }),
	  methods: {
	    animateOffHours({
	      keepScroll
	    }) {
	      if (this.offHoursExpanded) {
	        expandOffHours.collapse();
	      } else {
	        expandOffHours.expand({
	          keepScroll
	        });
	      }
	      void this.$store.dispatch(`${booking_const.Model.Interface}/setOffHoursExpanded`, !this.offHoursExpanded);
	    }
	  },
	  template: `
		<div class="booking-booking-grid-padding">
			<div
				class="booking-booking-column-off-hours"
				:class="{'--bottom': bottom, '--hover': offHoursHover}"
				@click="animateOffHours({ keepScroll: bottom })"
				@mouseenter="$store.dispatch('interface/setOffHoursHover', true)"
				@mouseleave="$store.dispatch('interface/setOffHoursHover', false)"
			></div>
		</div>
	`
	};

	const {
	  mapGetters: mapInterfaceGetters$2
	} = ui_vue3_vuex.createNamespacedHelpers(booking_const.Model.Interface);
	const Column = {
	  props: {
	    resourceId: Number
	  },
	  data() {
	    return {
	      visible: true
	    };
	  },
	  mounted() {
	    this.updateVisibility();
	    this.updateVisibilityDuringTransition();
	  },
	  computed: {
	    ...mapInterfaceGetters$2({
	      resourcesIds: 'resourcesIds',
	      zoom: 'zoom',
	      scroll: 'scroll',
	      selectedDateTs: 'selectedDateTs',
	      offHoursHover: 'offHoursHover',
	      offHoursExpanded: 'offHoursExpanded',
	      fromHour: 'fromHour',
	      toHour: 'toHour',
	      offset: 'offset'
	    }),
	    resource() {
	      return this.$store.getters['resources/getById'](this.resourceId);
	    },
	    fromMinutes() {
	      return this.fromHour * 60;
	    },
	    toMinutes() {
	      return this.toHour * 60;
	    },
	    slotSize() {
	      var _this$resource$slotRa, _this$resource$slotRa2;
	      return (_this$resource$slotRa = (_this$resource$slotRa2 = this.resource.slotRanges[0]) == null ? void 0 : _this$resource$slotRa2.slotSize) != null ? _this$resource$slotRa : 60;
	    },
	    offHoursTopCells() {
	      return this.cells.filter(it => it.minutes < this.fromMinutes);
	    },
	    workTimeCells() {
	      return this.cells.filter(it => it.minutes >= this.fromMinutes && it.minutes < this.toMinutes);
	    },
	    offHoursBottomCells() {
	      return this.cells.filter(it => it.minutes >= this.toMinutes);
	    },
	    cells() {
	      const hour = 3600 * 1000;
	      const from = this.selectedDateTs;
	      const to = new Date(from).setDate(new Date(from).getDate() + 1);
	      return booking_lib_range.range(from, to - hour, hour).map(fromTs => {
	        const toTs = fromTs + this.slotSize * 60 * 1000;
	        return {
	          id: `${this.resource.id}-${fromTs}-${toTs}`,
	          fromTs,
	          toTs,
	          minutes: new Date(fromTs + this.offset).getHours() * 60,
	          resourceId: this.resource.id
	        };
	      });
	    }
	  },
	  methods: {
	    updateVisibilityDuringTransition() {
	      var _this$animation;
	      (_this$animation = this.animation) == null ? void 0 : _this$animation.stop();
	      this.animation = new BX.easing({
	        duration: 200,
	        start: {},
	        finish: {},
	        step: this.updateVisibility
	      });
	      this.animation.animate();
	    },
	    updateVisibility() {
	      const rect = this.$el.getBoundingClientRect();
	      this.visible = rect.right > 0 && rect.left < window.innerWidth;
	    }
	  },
	  watch: {
	    scroll() {
	      this.updateVisibility();
	    },
	    zoom() {
	      this.updateVisibility();
	    },
	    resourcesIds() {
	      this.updateVisibilityDuringTransition();
	    }
	  },
	  components: {
	    Cell: Cell$1,
	    OffHours: OffHours$1
	  },
	  template: `
		<div
			class="booking-booking-grid-column"
			data-element="booking-grid-column"
			:data-id="resourceId"
		>
			<template v-if="visible">
				<OffHours/>
				<div class="booking-booking-grid-off-hours-cells">
					<Cell v-for="cell of offHoursTopCells" :key="cell.id" :cell="cell"/>
				</div>
				<Cell v-for="cell of workTimeCells" :key="cell.id" :cell="cell"/>
				<div class="booking-booking-grid-off-hours-cells --bottom">
					<Cell v-for="cell of offHoursBottomCells" :key="cell.id" :cell="cell"/>
				</div>
				<OffHours :bottom="true"/>
			</template>
		</div>
	`
	};

	let _ = t => t,
	  _t;
	const duration = 200;
	const counterPanelScopeClass = 'ui-counter-panel__scope';
	const darkThemeClass = 'bitrix24-dark-theme';
	var _slider = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("slider");
	var _overlay = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("overlay");
	var _handleSliderClose = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleSliderClose");
	var _renderOverlay = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderOverlay");
	var _appContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("appContainer");
	var _appHeader = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("appHeader");
	var _counterPanel = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("counterPanel");
	var _appContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("appContent");
	var _appContentPaddingBottomElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("appContentPaddingBottomElement");
	var _imBar = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("imBar");
	var _imBarWidth = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("imBarWidth");
	var _isExpanded = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isExpanded");
	var _getInset = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getInset");
	var _animate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("animate");
	var _applyMaximizedStyles = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("applyMaximizedStyles");
	var _applyMinimizedStyles = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("applyMinimizedStyles");
	class Maximize {
	  constructor({
	    onOverlayClick
	  }) {
	    Object.defineProperty(this, _applyMinimizedStyles, {
	      value: _applyMinimizedStyles2
	    });
	    Object.defineProperty(this, _applyMaximizedStyles, {
	      value: _applyMaximizedStyles2
	    });
	    Object.defineProperty(this, _animate, {
	      value: _animate2
	    });
	    Object.defineProperty(this, _getInset, {
	      value: _getInset2
	    });
	    Object.defineProperty(this, _isExpanded, {
	      get: _get_isExpanded,
	      set: void 0
	    });
	    Object.defineProperty(this, _imBarWidth, {
	      get: _get_imBarWidth,
	      set: void 0
	    });
	    Object.defineProperty(this, _imBar, {
	      get: _get_imBar,
	      set: void 0
	    });
	    Object.defineProperty(this, _appContentPaddingBottomElement, {
	      get: _get_appContentPaddingBottomElement,
	      set: void 0
	    });
	    Object.defineProperty(this, _appContent, {
	      get: _get_appContent,
	      set: void 0
	    });
	    Object.defineProperty(this, _counterPanel, {
	      get: _get_counterPanel,
	      set: void 0
	    });
	    Object.defineProperty(this, _appHeader, {
	      get: _get_appHeader,
	      set: void 0
	    });
	    Object.defineProperty(this, _appContainer, {
	      get: _get_appContainer,
	      set: void 0
	    });
	    Object.defineProperty(this, _renderOverlay, {
	      value: _renderOverlay2
	    });
	    Object.defineProperty(this, _handleSliderClose, {
	      value: _handleSliderClose2
	    });
	    Object.defineProperty(this, _slider, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _overlay, {
	      writable: true,
	      value: void 0
	    });
	    this.onOverlayClick = onOverlayClick;
	    babelHelpers.classPrivateFieldLooseBase(this, _slider)[_slider] = new (BX.SidePanel.Manager.getSliderClass())('');
	    babelHelpers.classPrivateFieldLooseBase(this, _overlay)[_overlay] = babelHelpers.classPrivateFieldLooseBase(this, _renderOverlay)[_renderOverlay]();
	    if (top.BX) {
	      this.handleSliderClose = babelHelpers.classPrivateFieldLooseBase(this, _handleSliderClose)[_handleSliderClose].bind(this);
	      top.BX.Event.EventEmitter.subscribe('SidePanel.Slider:onCloseComplete', this.handleSliderClose);
	      top.BX.Event.EventEmitter.subscribe('SidePanel.Slider:onDestroy', this.handleSliderClose);
	    }
	  }
	  async maximize() {
	    await booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/setExpanded`, true);
	    babelHelpers.classPrivateFieldLooseBase(this, _slider)[_slider].applyHacks();
	    BX.SidePanel.Instance.disablePageScrollbar();
	    const start = babelHelpers.classPrivateFieldLooseBase(this, _getInset)[_getInset](babelHelpers.classPrivateFieldLooseBase(this, _appContainer)[_appContainer]);
	    main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _appContainer)[_appContainer], 'position', 'fixed');
	    main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _appContainer)[_appContainer], 'inset', '0 0 0 0');
	    const finish = babelHelpers.classPrivateFieldLooseBase(this, _getInset)[_getInset](babelHelpers.classPrivateFieldLooseBase(this, _appContainer)[_appContainer]);
	    babelHelpers.classPrivateFieldLooseBase(this, _applyMaximizedStyles)[_applyMaximizedStyles]();
	    main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _overlay)[_overlay], '--closing');
	    main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _overlay)[_overlay], '--opening');
	    main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _overlay)[_overlay], document.body);
	    await babelHelpers.classPrivateFieldLooseBase(this, _animate)[_animate](start, finish);
	  }
	  async minimize() {
	    await booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/setExpanded`, false);
	    babelHelpers.classPrivateFieldLooseBase(this, _slider)[_slider].resetHacks();
	    BX.SidePanel.Instance.enablePageScrollbar();
	    const start = babelHelpers.classPrivateFieldLooseBase(this, _getInset)[_getInset](babelHelpers.classPrivateFieldLooseBase(this, _appContainer)[_appContainer]);
	    main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _appContainer)[_appContainer], 'position', null);
	    const finish = babelHelpers.classPrivateFieldLooseBase(this, _getInset)[_getInset](babelHelpers.classPrivateFieldLooseBase(this, _appContainer)[_appContainer]);
	    babelHelpers.classPrivateFieldLooseBase(this, _applyMinimizedStyles)[_applyMinimizedStyles]();
	    main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _overlay)[_overlay], '--opening');
	    main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _overlay)[_overlay], '--closing');
	    main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _appContainer)[_appContainer], 'position', 'fixed');
	    await babelHelpers.classPrivateFieldLooseBase(this, _animate)[_animate](start, finish);
	    main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _appContainer)[_appContainer], 'position', null);
	    main_core.Dom.remove(babelHelpers.classPrivateFieldLooseBase(this, _overlay)[_overlay]);
	  }
	}
	function _handleSliderClose2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isExpanded)[_isExpanded]) {
	    babelHelpers.classPrivateFieldLooseBase(this, _slider)[_slider].applyHacks();
	    BX.SidePanel.Instance.disablePageScrollbar();
	  }
	}
	function _renderOverlay2() {
	  return main_core.Tag.render(_t || (_t = _`
			<div class="booking-booking-overlay" onclick="${0}"></div>
		`), this.onOverlayClick);
	}
	function _get_appContainer() {
	  return BX('content-table');
	}
	function _get_appHeader() {
	  return document.querySelector('.page-header');
	}
	function _get_counterPanel() {
	  return booking_core.Core.getParams().counterPanelContainer.firstElementChild;
	}
	function _get_appContent() {
	  return BX('workarea-content');
	}
	function _get_appContentPaddingBottomElement() {
	  var _BX;
	  return (_BX = BX('workarea')) == null ? void 0 : _BX.parentElement;
	}
	function _get_imBar() {
	  return BX('bx-im-bar');
	}
	function _get_imBarWidth() {
	  return window.innerWidth - babelHelpers.classPrivateFieldLooseBase(this, _imBar)[_imBar].getBoundingClientRect().left;
	}
	function _get_isExpanded() {
	  return booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/expanded`];
	}
	function _getInset2(container) {
	  const rect = container.getBoundingClientRect();
	  return {
	    left: rect.left,
	    top: rect.top,
	    right: window.innerWidth - (rect.left + rect.width),
	    bottom: window.innerHeight - (rect.top + rect.height)
	  };
	}
	function _animate2(start, finish) {
	  return new Promise(complete => new BX.easing({
	    duration,
	    start,
	    finish,
	    step: ({
	      top,
	      right,
	      bottom,
	      left
	    }) => {
	      main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _appContainer)[_appContainer], 'inset', `${top}px ${right}px ${bottom}px ${left}px`);
	    },
	    complete
	  }).animate());
	}
	function _applyMaximizedStyles2() {
	  main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _counterPanel)[_counterPanel], counterPanelScopeClass);
	  main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _appContainer)[_appContainer], darkThemeClass);
	  main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _appContainer)[_appContainer], 'height', 'initial');
	  main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _appContainer)[_appContainer], 'position', 'fixed');
	  main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _appContainer)[_appContainer], 'clip-path', `inset(0 ${babelHelpers.classPrivateFieldLooseBase(this, _imBarWidth)[_imBarWidth]}px 0 0)`);
	  main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _appContainer)[_appContainer], 'background', 'var(--ui-color-palette-white-base)');
	  main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _appHeader)[_appHeader], 'border-bottom', '1px solid var(--ui-color-base-10)');
	  main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _appHeader)[_appHeader], 'max-width', '100%');
	  main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _appHeader)[_appHeader].parentElement, 'padding-right', `${babelHelpers.classPrivateFieldLooseBase(this, _imBarWidth)[_imBarWidth]}px`);
	  main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _appContent)[_appContent], 'margin', 0);
	  main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _appContent)[_appContent], 'border-radius', 0);
	  main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _appContentPaddingBottomElement)[_appContentPaddingBottomElement], 'padding-bottom', 0);
	  main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _appContentPaddingBottomElement)[_appContentPaddingBottomElement], 'padding-right', `${babelHelpers.classPrivateFieldLooseBase(this, _imBarWidth)[_imBarWidth]}px`);
	  main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _overlay)[_overlay], '--right', `${babelHelpers.classPrivateFieldLooseBase(this, _imBarWidth)[_imBarWidth]}px`);
	  BX.ZIndexManager.register(babelHelpers.classPrivateFieldLooseBase(this, _appContainer)[_appContainer], {
	    overlay: babelHelpers.classPrivateFieldLooseBase(this, _overlay)[_overlay]
	  });
	}
	function _applyMinimizedStyles2() {
	  main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _counterPanel)[_counterPanel], counterPanelScopeClass);
	  main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _appContainer)[_appContainer], darkThemeClass);
	  main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _appContainer)[_appContainer], 'position', null);
	  main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _appContainer)[_appContainer], 'clip-path', null);
	  main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _appContainer)[_appContainer], 'background', null);
	  main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _appHeader)[_appHeader], 'border-bottom', null);
	  main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _appHeader)[_appHeader], 'max-width', null);
	  main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _appHeader)[_appHeader].parentElement, 'padding-right', null);
	  main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _appContent)[_appContent], 'margin', null);
	  main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _appContent)[_appContent], 'border-radius', null);
	  main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _appContentPaddingBottomElement)[_appContentPaddingBottomElement], 'padding-bottom', null);
	  main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _appContentPaddingBottomElement)[_appContentPaddingBottomElement], 'padding-right', null);
	  BX.ZIndexManager.unregister(babelHelpers.classPrivateFieldLooseBase(this, _appContainer)[_appContainer]);
	}

	const ScalePanel = {
	  props: {
	    getColumnsContainer: Function
	  },
	  data() {
	    return {
	      isSlider: booking_core.Core.getParams().isSlider,
	      maximize: new Maximize({
	        onOverlayClick: () => this.collapse()
	      }),
	      desiredZoom: this.$store.getters['interface/zoom'],
	      minZoom: 0.5,
	      maxZoom: 1
	    };
	  },
	  mounted() {
	    if (location.hash === '#maximize') {
	      void this.maximize.maximize();
	    }
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      zoom: 'interface/zoom',
	      expanded: 'interface/expanded'
	    }),
	    zoomFormatted() {
	      return this.loc('BOOKING_BOOKING_ZOOM_PERCENT', {
	        '#PERCENT#': Math.round(this.zoom * 100)
	      });
	    }
	  },
	  methods: {
	    expand(event) {
	      if (location.hash === '#maximize' || this.isAnyModifierKeyPressed(event)) {
	        void this.maximize.maximize();
	      } else {
	        window.open(`${location.href}#maximize`, '_blank').focus();
	      }
	    },
	    isAnyModifierKeyPressed(event) {
	      return event.altKey || event.shiftKey || event.ctrlKey || event.metaKey;
	    },
	    collapse() {
	      void this.maximize.minimize();
	    },
	    fitToScreen() {
	      const sidebarPadding = 260;
	      const view = this.getColumnsContainer();
	      const zoomCoefficient = (view.offsetWidth - sidebarPadding) / (view.scrollWidth - sidebarPadding);
	      const newZoom = Math.floor(this.zoom * zoomCoefficient * 10) / 10;
	      this.zoomInto(newZoom);
	    },
	    zoomInto(zoomInto) {
	      var _this$animation;
	      if (Number.isNaN(zoomInto)) {
	        return;
	      }
	      const noTransitionClass = '--booking-booking-no-transition';
	      const container = booking_core.Core.getParams().container;
	      const maxAnimationDuration = 400;
	      this.desiredZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoomInto));
	      if (this.zoom === this.desiredZoom) {
	        return;
	      }
	      (_this$animation = this.animation) == null ? void 0 : _this$animation.stop();
	      main_core.Dom.addClass(container, noTransitionClass);
	      this.animation = new BX.easing({
	        duration: Math.abs(this.zoom - this.desiredZoom) / this.minZoom * maxAnimationDuration,
	        start: {
	          zoom: this.zoom * 100
	        },
	        finish: {
	          zoom: this.desiredZoom * 100
	        },
	        step: ({
	          zoom
	        }) => this.$store.dispatch('interface/setZoom', zoom / 100),
	        complete: () => main_core.Dom.removeClass(container, noTransitionClass)
	      });
	      this.animation.animate();
	    },
	    async onMouseDown(direction) {
	      main_core.Event.unbind(window, 'mouseup', this.onMouseUp);
	      main_core.Event.bind(window, 'mouseup', this.onMouseUp);
	      this.mouseDown = true;
	      await new Promise(resolve => setTimeout(resolve, 50));
	      if (this.mouseDown) {
	        clearInterval(this.zoomInterval);
	        this.zoomInterval = setInterval(() => this.zoomInto(this.desiredZoom + direction * 0.1), 40);
	      }
	    },
	    onMouseUp() {
	      this.mouseDown = false;
	      if (this.desiredZoom > this.zoom) {
	        this.desiredZoom = Math.ceil(this.zoom * 10) / 10;
	      }
	      if (this.desiredZoom < this.zoom) {
	        this.desiredZoom = Math.floor(this.zoom * 10) / 10;
	      }
	      this.zoomInto(this.desiredZoom);
	      clearInterval(this.zoomInterval);
	      main_core.Event.unbind(window, 'mouseup', this.onMouseUp);
	    },
	    async showAhaMoment() {
	      booking_lib_ahaMoments.ahaMoments.setPopupShown(booking_const.AhaMoment.ExpandGrid);
	      await booking_lib_ahaMoments.ahaMoments.show({
	        id: 'booking-expand-grid',
	        title: this.loc('BOOKING_AHA_EXPAND_GRID_TITLE'),
	        text: this.loc('BOOKING_AHA_EXPAND_GRID_TEXT'),
	        article: booking_const.HelpDesk.AhaExpandGrid,
	        target: this.$refs.expand,
	        top: true
	      });
	      booking_lib_ahaMoments.ahaMoments.setShown(booking_const.AhaMoment.ExpandGrid);
	    }
	  },
	  template: `
		<div class="booking-booking-grid-scale-panel">
			<div v-if="!isSlider" class="booking-booking-grid-scale-panel-full-screen" ref="expand">
				<div v-if="expanded" class="ui-icon-set --collapse-diagonal" @click="collapse"></div>
				<div v-else class="ui-icon-set --expand-diagonal" @click="expand"></div>
			</div>
			<div class="booking-booking-grid-scale-panel-fit-to-screen">
				<div class="booking-booking-grid-scale-panel-fit-to-screen-text" @click="fitToScreen">
					{{ loc('BOOKING_BOOKING_SHOW_ALL') }}
				</div>
			</div>
			<div class="booking-booking-grid-scale-panel-change">
				<div
					class="ui-icon-set --minus-30"
					:class="{'--disabled': zoom <= minZoom}"
					@click="zoomInto(desiredZoom - 0.1)"
					@mousedown="onMouseDown(-1)"
				></div>
				<div v-html="zoomFormatted" class="booking-booking-grid-scale-panel-zoom"></div>
				<div
					class="ui-icon-set --plus-30"
					:class="{'--disabled': zoom >= maxZoom}"
					@click="zoomInto(desiredZoom + 0.1)"
					@mousedown="onMouseDown(1)"
				></div>
			</div>
		</div>
	`
	};

	const {
	  mapGetters: mapInterfaceGetters$3
	} = ui_vue3_vuex.createNamespacedHelpers(booking_const.Model.Interface);
	const Calendar = {
	  data() {
	    return {
	      expanded: true
	    };
	  },
	  created() {
	    this.datePicker = new ui_datePicker.DatePicker({
	      selectedDates: [this.selectedDateTs],
	      inline: true,
	      hideHeader: true
	    });
	    this.setViewDate();
	    this.datePicker.subscribe(ui_datePicker.DatePickerEvent.SELECT, event => {
	      const date = event.getData().date;
	      const selectedDate = this.createDateFromUtc(date);
	      void this.$store.dispatch(`${booking_const.Model.Interface}/setSelectedDateTs`, selectedDate.getTime());
	      this.setViewDate();
	    });
	  },
	  mounted() {
	    this.datePicker.setTargetNode(this.$refs.datePicker);
	    this.datePicker.show();
	  },
	  beforeUnmount() {
	    this.datePicker.destroy();
	  },
	  computed: {
	    ...mapInterfaceGetters$3({
	      filteredMarks: 'filteredMarks',
	      freeMarks: 'freeMarks',
	      isFilterMode: 'isFilterMode',
	      getCounterMarks: 'getCounterMarks',
	      offset: 'offset'
	    }),
	    selectedDateTs() {
	      return this.$store.getters[`${booking_const.Model.Interface}/selectedDateTs`] + this.offset;
	    },
	    viewDateTs() {
	      return this.$store.getters[`${booking_const.Model.Interface}/viewDateTs`] + this.offset;
	    },
	    counterMarks() {
	      if (this.isFilterMode) {
	        return this.getCounterMarks(this.filteredMarks);
	      }
	      return this.getCounterMarks();
	    },
	    formattedDate() {
	      const format = this.expanded ? this.loc('BOOKING_MONTH_YEAR_FORMAT') : main_date.DateTimeFormat.getFormat('LONG_DATE_FORMAT');
	      const timestamp = this.expanded ? this.viewDateTs / 1000 : this.selectedDateTs / 1000;
	      return main_date.DateTimeFormat.format(format, timestamp);
	    }
	  },
	  methods: {
	    onCollapseClick() {
	      this.expanded = !this.expanded;
	    },
	    onPreviousClick() {
	      if (this.expanded) {
	        this.previousMonth();
	      } else {
	        this.previousDate();
	      }
	    },
	    onNextClick() {
	      if (this.expanded) {
	        this.nextMonth();
	      } else {
	        this.nextDate();
	      }
	    },
	    previousDate() {
	      const selectedDate = this.datePicker.getSelectedDate() || this.datePicker.getToday();
	      this.datePicker.selectDate(ui_datePicker.getNextDate(selectedDate, 'day', -1));
	      this.setViewDate();
	    },
	    nextDate() {
	      const selectedDate = this.datePicker.getSelectedDate() || this.datePicker.getToday();
	      this.datePicker.selectDate(ui_datePicker.getNextDate(selectedDate, 'day'));
	      this.setViewDate();
	    },
	    previousMonth() {
	      const viewDate = this.datePicker.getViewDate();
	      this.datePicker.setViewDate(ui_datePicker.getNextDate(viewDate, 'month', -1));
	      this.setViewDate();
	    },
	    nextMonth() {
	      const viewDate = this.datePicker.getViewDate();
	      this.datePicker.setViewDate(ui_datePicker.getNextDate(viewDate, 'month'));
	      this.setViewDate();
	    },
	    setViewDate() {
	      const viewDate = this.createDateFromUtc(this.datePicker.getViewDate());
	      const viewDateTs = viewDate.setDate(1);
	      void this.$store.dispatch(`${booking_const.Model.Interface}/setViewDateTs`, viewDateTs);
	    },
	    createDateFromUtc(date) {
	      return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
	    },
	    updateMarks() {
	      if (this.isFilterMode) {
	        this.setFilterMarks();
	      } else {
	        this.setFreeMarks();
	      }
	      this.setCounterMarks();
	    },
	    setFreeMarks() {
	      const bgColorFree = 'rgba(var(--ui-color-background-success-rgb), 0.7)';
	      const dates = this.prepareDates(this.freeMarks);
	      this.datePicker.setDayColors([{
	        matcher: dates,
	        bgColor: bgColorFree
	      }]);
	    },
	    setFilterMarks() {
	      const bgColorFilter = 'rgba(var(--ui-color-primary-rgb), 0.20)';
	      const dates = this.prepareDates(this.filteredMarks);
	      this.datePicker.setDayColors([{
	        matcher: dates,
	        bgColor: bgColorFilter
	      }]);
	    },
	    setCounterMarks() {
	      const dates = this.prepareDates(this.counterMarks);
	      this.datePicker.setDayMarks([{
	        matcher: dates,
	        bgColor: 'red'
	      }]);
	    },
	    prepareDates(dates) {
	      return dates.map(markDate => {
	        const date = main_date.DateTimeFormat.parse(markDate, false, booking_const.DateFormat.ServerParse);
	        return this.prepareTimestamp(date.getTime());
	      });
	    },
	    prepareTimestamp(timestamp) {
	      const dateFormat = main_date.DateTimeFormat.getFormat('FORMAT_DATE');
	      return main_date.DateTimeFormat.format(dateFormat, timestamp / 1000);
	    }
	  },
	  watch: {
	    selectedDateTs(selectedDateTs) {
	      this.datePicker.selectDate(ui_datePicker.createDate(selectedDateTs));
	      this.updateMarks();
	    },
	    filteredMarks() {
	      this.updateMarks();
	    },
	    freeMarks() {
	      this.updateMarks();
	    },
	    counterMarks() {
	      this.setCounterMarks();
	    },
	    isFilterMode() {
	      this.updateMarks();
	    }
	  },
	  template: `
		<div class="booking-booking-sidebar-calendar">
			<div class="booking-booking-sidebar-calendar-header">
				<div class="booking-booking-sidebar-calendar-button" @click="onPreviousClick">
					<div class="ui-icon-set --chevron-left"></div>
				</div>
				<div class="booking-booking-sidebar-calendar-title">
					{{ formattedDate }}
				</div>
				<div class="booking-booking-sidebar-calendar-button" @click="onNextClick">
					<div class="ui-icon-set --chevron-right"></div>
				</div>
				<div class="booking-booking-sidebar-calendar-button --collapse" @click="onCollapseClick">
					<div v-if="expanded" class="ui-icon-set --collapse"></div>
					<div v-else class="ui-icon-set --expand-1"></div>
				</div>
			</div>
			<div
				class="booking-booking-sidebar-calendar-date-picker"
				:class="{'--expanded': expanded}"
				ref="datePicker"
			></div>
		</div>
	`
	};

	const Sidebar = {
	  components: {
	    Calendar
	  },
	  template: `
		<div class="booking-booking-sidebar">
			<Calendar/>
		</div>
	`
	};

	const DragDelete = {
	  data() {
	    return {
	      IconSet: ui_iconSet_api_vue.Set
	    };
	  },
	  computed: ui_vue3_vuex.mapGetters({
	    draggedBookingId: `${booking_const.Model.Interface}/draggedBookingId`
	  }),
	  methods: {
	    onMouseUp() {
	      new booking_lib_removeBooking.RemoveBooking(this.draggedBookingId);
	    }
	  },
	  components: {
	    Icon: ui_iconSet_api_vue.BIcon
	  },
	  template: `
		<div v-if="draggedBookingId" class="booking-booking-drag-delete">
			<div
				class="booking-booking-drag-delete-button"
				data-element="booking-drag-delete"
				@mouseup.capture="onMouseUp"
			>
				<Icon :name="IconSet.TRASH_BIN"/>
				<div class="booking-booking-drag-delete-button-text">
					{{ loc('BOOKING_BOOKING_DRAG_DELETE') }}
				</div>
			</div>
		</div>
	`
	};

	const Grid = {
	  data() {
	    return {
	      scrolledToBooking: false
	    };
	  },
	  mounted() {
	    this.ears = new ui_ears.Ears({
	      container: this.$refs.columnsContainer,
	      smallSize: true,
	      className: 'booking-booking-grid-columns-ears'
	    }).init();
	    main_core.Event.EventEmitter.subscribe('BX.Main.Popup:onAfterClose', this.tryShowAhaMoment);
	    main_core.Event.EventEmitter.subscribe('BX.Main.Popup:onDestroy', this.tryShowAhaMoment);
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      resourcesIds: `${booking_const.Model.Interface}/resourcesIds`,
	      scroll: `${booking_const.Model.Interface}/scroll`,
	      editingBookingId: `${booking_const.Model.Interface}/editingBookingId`
	    }),
	    editingBooking() {
	      var _this$$store$getters$;
	      return (_this$$store$getters$ = this.$store.getters['bookings/getById'](this.editingBookingId)) != null ? _this$$store$getters$ : null;
	    }
	  },
	  methods: {
	    updateEars() {
	      this.ears.toggleEars();
	      this.tryShowAhaMoment();
	    },
	    areEarsShown() {
	      const shownClass = 'ui-ear-show';
	      return main_core.Dom.hasClass(this.ears.getRightEar(), shownClass) || main_core.Dom.hasClass(this.ears.getLeftEar(), shownClass);
	    },
	    scrollToEditingBooking() {
	      if (!this.editingBooking || this.scrolledToBooking) {
	        return;
	      }
	      const top = booking_lib_grid.grid.calculateTop(this.editingBooking.dateFromTs);
	      const height = booking_lib_grid.grid.calculateHeight(this.editingBooking.dateFromTs, this.editingBooking.dateToTs);
	      this.$refs.inner.scrollTop = top + height / 2 + this.$refs.inner.offsetHeight / 2;
	      this.scrolledToBooking = true;
	    },
	    tryShowAhaMoment() {
	      if (this.areEarsShown() && booking_lib_ahaMoments.ahaMoments.shouldShow(booking_const.AhaMoment.ExpandGrid)) {
	        main_core.Event.EventEmitter.unsubscribe('BX.Main.Popup:onAfterClose', this.tryShowAhaMoment);
	        main_core.Event.EventEmitter.unsubscribe('BX.Main.Popup:onDestroy', this.tryShowAhaMoment);
	        void this.$refs.scalePanel.showAhaMoment();
	      }
	    }
	  },
	  watch: {
	    scroll(value) {
	      this.$refs.columnsContainer.scrollLeft = value;
	    },
	    editingBooking() {
	      this.scrollToEditingBooking();
	    }
	  },
	  components: {
	    LeftPanel,
	    NowLine,
	    Column,
	    Bookings,
	    ScalePanel,
	    Sidebar,
	    DragDelete
	  },
	  template: `
		<div class="booking-booking-grid">
			<div
				id="booking-booking-grid-wrap"
				class="booking-booking-grid-inner --vertical-scroll-bar"
				ref="inner"
			>
				<LeftPanel/>
				<NowLine/>
				<div
					id="booking-booking-grid-columns"
					class="booking-booking-grid-columns --horizontal-scroll-bar"
					ref="columnsContainer"
					@scroll="$store.dispatch('interface/setScroll', $refs.columnsContainer.scrollLeft)"
				>
					<Bookings/>
					<TransitionGroup
						name="booking-transition-resource"
						@after-leave="updateEars"
						@after-enter="updateEars"
					>
						<template v-for="resourceId of resourcesIds" :key="resourceId">
							<Column :resourceId="resourceId"/>
						</template>
					</TransitionGroup>
				</div>
			</div>
			<ScalePanel
				:getColumnsContainer="() => $refs.columnsContainer"
				ref="scalePanel"
			/>
			<DragDelete/>
		</div>
		<Sidebar/>
	`
	};

	const MIN_CHARGE = 0;
	const MAX_CHARGE = 12;
	const CHARGE_COLOR = 'var(--ui-color-primary-alt)';
	const EMPTY_COLOR = 'var(--ui-color-background-secondary)';
	const BATTERY_ICON_HEIGHT = 14;
	const BATTERY_ICON_WIDTH = 27;
	const BatteryIcon = {
	  name: 'BatteryIcon',
	  props: {
	    percent: {
	      type: Number,
	      default: 0
	    },
	    dataId: {
	      type: [String, Number],
	      default: ''
	    },
	    height: {
	      type: Number,
	      default: BATTERY_ICON_HEIGHT
	    },
	    width: {
	      type: Number,
	      default: BATTERY_ICON_WIDTH
	    }
	  },
	  mounted() {
	    this.repaint();
	  },
	  methods: {
	    getCharge(percent) {
	      if (percent <= 0) {
	        return MIN_CHARGE;
	      }
	      if (percent >= 100) {
	        return MAX_CHARGE;
	      }
	      return Math.round(percent * MAX_CHARGE * 0.01);
	    },
	    repaint() {
	      var _this$$refs$iconBatt;
	      const rects = ((_this$$refs$iconBatt = this.$refs['icon-battery-charge']) == null ? void 0 : _this$$refs$iconBatt.children) || [];
	      const charge = this.getCharge(this.percent);
	      let index = 1;
	      for (const rect of rects) {
	        rect.setAttribute('fill', index > charge ? EMPTY_COLOR : CHARGE_COLOR);
	        index++;
	      }
	    }
	  },
	  watch: {
	    percent: {
	      handler() {
	        this.repaint();
	      }
	    }
	  },
	  template: `
		<div :data-id="dataId" :data-percent="percent" data-element="booking-resource-workload-percent">
			<svg id="booking--battery-icon" :width="width" :height="height" viewBox="0 0 27 14" fill="none"
				 xmlns="http://www.w3.org/2000/svg">
				<rect width="23.2875" height="13.8" rx="4" fill="white"/>
				<rect x="22.6871" y="0.6" width="12.6" height="22.0875" rx="3.4" transform="rotate(90 22.6871 0.6)" stroke="#C9CCD0" stroke-width="1.2"/>
				<g ref="icon-battery-charge" id="booking--battery-icon-charge" clip-path="url(#clip0_5003_187951)">
					<rect x="2.58789" y="2.5875" width="1.50917" height="10" fill="#EDEEF0"/>
					<rect x="4.09766" y="2.5875" width="1.50917" height="10" fill="#EDEEF0"/>
					<rect x="5.60547" y="2.5875" width="1.50917" height="10" fill="#EDEEF0"/>
					<rect x="7.11523" y="2.5875" width="1.50917" height="10" fill="#EDEEF0"/>
					<rect x="8.625" y="2.5875" width="1.50917" height="10" fill="#EDEEF0"/>
					<rect x="10.1328" y="2.5875" width="1.50917" height="10" fill="#EDEEF0"/>
					<rect x="11.6426" y="2.5875" width="1.50917" height="10" fill="#EDEEF0"/>
					<rect x="13.1523" y="2.5875" width="1.50917" height="10" fill="#EDEEF0"/>
					<rect x="14.6621" y="2.5875" width="1.50917" height="10" fill="#EDEEF0"/>
					<rect x="16.1699" y="2.5875" width="1.50917" height="10" fill="#EDEEF0"/>
					<rect x="17.6797" y="2.5875" width="1.50917" height="10" fill="#EDEEF0"/>
					<rect x="19.1895" y="2.5875" width="1.50917" height="10" fill="#EDEEF0"/>
				</g>
				<g clip-path="url(#clip1_5003_187951)">
					<ellipse cx="23.102" cy="6.89999" rx="2.9" ry="3.48" transform="rotate(90 23.102 6.89999)" fill="#C9CCD0"/>
				</g>
				<defs>
					<clipPath id="clip0_5003_187951">
						<rect x="2.58789" y="2.5875" width="18.1125" height="8.625" rx="1.5" fill="white"/>
					</clipPath>
					<clipPath id="clip1_5003_187951">
						<rect width="6.9" height="2.15625" fill="white" transform="translate(26.7383 3.45) rotate(90)"/>
					</clipPath>
				</defs>
			</svg>
		</div>
	`
	};

	const WorkloadPopup = {
	  emits: ['close'],
	  props: {
	    resourceId: {
	      type: Number,
	      required: true
	    },
	    slotsCount: {
	      type: Number,
	      required: true
	    },
	    bookingCount: {
	      type: Number,
	      required: true
	    },
	    workLoadPercent: {
	      type: Number,
	      required: true
	    },
	    bindElement: {
	      type: HTMLElement,
	      required: true
	    }
	  },
	  computed: {
	    popupId() {
	      return 'booking-booking-resource-workload-popup';
	    },
	    title() {
	      return this.loc('BOOKING_BOOKING_RESOURCE_WORKLOAD_POPUP_TITLE');
	    },
	    rows() {
	      return [{
	        title: this.loc('BOOKING_BOOKING_RESOURCE_WORKLOAD_SLOTS_BOOKED'),
	        value: this.slotsBookedFormatted,
	        dataset: {
	          element: 'booking-resource-workload-popup-count',
	          resourceId: this.resourceId,
	          bookedCount: this.bookingCount,
	          totalCount: this.slotsCount
	        }
	      }, {
	        title: this.loc('BOOKING_BOOKING_RESOURCE_WORKLOAD'),
	        value: this.workLoadPercentFormatted,
	        dataset: {
	          element: 'booking-resource-workload-popup-percent',
	          resourceId: this.resourceId,
	          percent: this.workLoadPercent
	        }
	      }];
	    },
	    slotsBookedFormatted() {
	      return this.loc('BOOKING_BOOKING_RESOURCE_WORKLOAD_BOOKED_FROM_SLOTS_COUNT', {
	        '#BOOKED#': this.bookingCount,
	        '#SLOTS_COUNT#': this.slotsCount
	      });
	    },
	    workLoadPercentFormatted() {
	      return this.loc('BOOKING_BOOKING_RESOURCE_WORKLOAD_PERCENT', {
	        '#PERCENT#': this.workLoadPercent
	      });
	    }
	  },
	  components: {
	    StatisticsPopup: booking_component_statisticsPopup.StatisticsPopup
	  },
	  template: `
		<StatisticsPopup
			:popupId="popupId"
			:bindElement="bindElement"
			:title="title"
			:rows="rows"
			:dataset="{
				id: resourceId,
				element: 'booking-resource-workload-popup',
			}"
			@close="$emit('close')"
		/>
	`
	};

	const ResourceWorkload = {
	  name: 'ResourceWorkload',
	  props: {
	    resourceId: {
	      type: Number,
	      required: true
	    },
	    scale: {
	      type: Number,
	      default: 1
	    },
	    isGrid: {
	      type: Boolean,
	      default: false
	    }
	  },
	  data() {
	    return {
	      isPopupShown: false
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      selectedDateTs: 'interface/selectedDateTs',
	      fromHour: 'interface/fromHour',
	      toHour: 'interface/toHour'
	    }),
	    workLoadPercent() {
	      if (this.slotsCount === 0) {
	        return 0;
	      }
	      return Math.round(this.bookingCount / this.slotsCount * 100);
	    },
	    bookingCount() {
	      return this.bookings.length;
	    },
	    slotsCount() {
	      var _this$resource$slotRa;
	      const selectedDate = new Date(this.selectedDateTs);
	      const selectedWeekDay = booking_const.DateFormat.WeekDays[selectedDate.getDay()];
	      const slotRanges = booking_lib_busySlots.busySlots.filterSlotRanges(this.resource.slotRanges.filter(slotRange => {
	        return slotRange.weekDays.includes(selectedWeekDay);
	      }));
	      const slotSize = (_this$resource$slotRa = this.resource.slotRanges[0].slotSize) != null ? _this$resource$slotRa : 60;
	      return Math.floor(slotRanges.reduce((sum, slotRange) => {
	        return sum + (slotRange.to - slotRange.from) / slotSize;
	      }, 0));
	    },
	    bookings() {
	      const dateTs = this.selectedDateTs;
	      return this.$store.getters[`${booking_const.Model.Bookings}/getByDateAndResources`](dateTs, [this.resourceId]);
	    },
	    resource() {
	      return this.$store.getters['resources/getById'](this.resourceId);
	    },
	    batteryIconOptions() {
	      return {
	        height: Math.round(BATTERY_ICON_HEIGHT * this.scale),
	        width: Math.round(BATTERY_ICON_WIDTH * this.scale)
	      };
	    },
	    bookingsCount() {
	      return this.bookings.length;
	    }
	  },
	  methods: {
	    onMouseEnter() {
	      this.showTimeout = setTimeout(() => this.showPopup(), 100);
	    },
	    onMouseLeave() {
	      clearTimeout(this.showTimeout);
	      this.closePopup();
	    },
	    showPopup() {
	      this.isPopupShown = true;
	    },
	    closePopup() {
	      this.isPopupShown = false;
	    },
	    async showAhaMoment() {
	      booking_lib_ahaMoments.ahaMoments.setPopupShown(booking_const.AhaMoment.ResourceWorkload);
	      await booking_lib_ahaMoments.ahaMoments.show({
	        id: 'booking-resource-workload',
	        title: this.loc('BOOKING_AHA_RESOURCE_WORKLOAD_TITLE'),
	        text: this.loc('BOOKING_AHA_RESOURCE_WORKLOAD_TEXT'),
	        article: booking_const.HelpDesk.AhaResourceWorkload,
	        target: this.$refs.container
	      });
	      booking_lib_ahaMoments.ahaMoments.setShown(booking_const.AhaMoment.ResourceWorkload);
	    }
	  },
	  watch: {
	    bookingsCount(newCount, previousCount) {
	      if (this.isGrid && newCount > previousCount && booking_lib_ahaMoments.ahaMoments.shouldShow(booking_const.AhaMoment.ResourceWorkload)) {
	        void this.showAhaMoment();
	      }
	    }
	  },
	  components: {
	    BatteryIcon,
	    WorkloadPopup
	  },
	  template: `
		<div
			class="booking-booking-header-resource-workload"
			data-element="booking-resource-workload"
			:data-id="resourceId"
			ref="container"
			@click="showPopup"
			@mouseenter="onMouseEnter"
			@mouseleave="onMouseLeave"
		>
			<BatteryIcon 
				:percent="workLoadPercent"
				:data-id="resourceId"
				:height="batteryIconOptions.height"
				:width="batteryIconOptions.width"
			/>
		</div>
		<WorkloadPopup
			v-if="isPopupShown"
			:resourceId="resourceId"
			:slotsCount="slotsCount"
			:bookingCount="bookingCount"
			:workLoadPercent="workLoadPercent"
			:bindElement="$refs.container"
			@close="closePopup"
		/>
	`
	};

	const ResourceMenu = {
	  name: 'ResourceMenu',
	  props: {
	    resourceId: {
	      type: Number,
	      required: true
	    }
	  },
	  data() {
	    return {
	      menuPopup: null
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      favoritesIds: `${booking_const.Model.Favorites}/get`,
	      isEditingBookingMode: `${booking_const.Model.Interface}/isEditingBookingMode`,
	      isFeatureEnabled: `${booking_const.Model.Interface}/isFeatureEnabled`
	    }),
	    popupId() {
	      return `resource-menu-${this.resourceId || 'new'}`;
	    }
	  },
	  created() {
	    this.hint = BX.UI.Hint.createInstance({
	      popupParameters: {}
	    });
	  },
	  unmounted() {
	    if (this.menuPopup) {
	      this.destroy();
	    }
	  },
	  methods: {
	    openMenu() {
	      var _this$menuPopup, _this$menuPopup$popup;
	      if ((_this$menuPopup = this.menuPopup) != null && (_this$menuPopup$popup = _this$menuPopup.popupWindow) != null && _this$menuPopup$popup.isShown()) {
	        this.destroy();
	        return;
	      }
	      const menuButton = this.$refs['menu-button'];
	      this.menuPopup = main_popup.MenuManager.create(this.popupId, menuButton, this.getMenuItems(), {
	        className: 'booking-resource-menu-popup',
	        closeByEsc: true,
	        autoHide: true,
	        offsetTop: -3,
	        offsetLeft: menuButton.offsetWidth - 6,
	        angle: true,
	        cacheable: true,
	        events: {
	          onDestroy: () => this.unbindScrollEvent()
	        }
	      });
	      this.menuPopup.show();
	      this.bindScrollEvent();
	    },
	    getMenuItems() {
	      return [
	      // {
	      // 	html: `<span>${this.loc('BOOKING_RESOURCE_MENU_ADD_BOOKING')}</span>`,
	      // 	onclick: () => this.destroy(),
	      // },
	      {
	        html: `<span>${this.loc('BOOKING_RESOURCE_MENU_EDIT_RESOURCE')}</span>`,
	        className: this.isFeatureEnabled ? 'menu-popup-item menu-popup-no-icon' : 'menu-popup-item --lock',
	        onclick: async () => {
	          if (!this.isFeatureEnabled) {
	            booking_lib_limit.limit.show();
	            return;
	          }
	          const wizard = new booking_resourceCreationWizard.ResourceCreationWizard();
	          this.editResource(this.resourceId, wizard);
	          this.destroy();
	        }
	      },
	      // {
	      // 	html: `<span>${this.loc('BOOKING_RESOURCE_MENU_EDIT_NOTIFY')}</span>`,
	      // 	onclick: () => this.destroy(),
	      // },
	      // {
	      // 	html: `<span>${this.loc('BOOKING_RESOURCE_MENU_CREATE_COPY')}</span>`,
	      // 	onclick: () => this.destroy(),
	      // },
	      // {
	      // 	html: '<span></span>',
	      // 	disabled: true,
	      // 	className: 'menu-item-divider',
	      // },
	      {
	        html: `<span>${this.loc('BOOKING_RESOURCE_MENU_HIDE')}</span>`,
	        onclick: async () => {
	          this.destroy();
	          await this.hideResource(this.resourceId);
	        }
	      }, {
	        html: `<span class="alert-text">${this.loc('BOOKING_RESOURCE_MENU_DELETE')}</span>`,
	        onclick: async () => {
	          this.destroy();
	          await this.deleteResource(this.resourceId);
	        }
	      }];
	    },
	    destroy() {
	      main_popup.MenuManager.destroy(this.popupId);
	      this.unbindScrollEvent();
	    },
	    bindScrollEvent() {
	      main_core.Event.bind(document, 'scroll', this.adjustPosition, {
	        capture: true
	      });
	    },
	    unbindScrollEvent() {
	      main_core.Event.unbind(document, 'scroll', this.adjustPosition, {
	        capture: true
	      });
	    },
	    adjustPosition() {
	      var _this$menuPopup2, _this$menuPopup2$popu;
	      (_this$menuPopup2 = this.menuPopup) == null ? void 0 : (_this$menuPopup2$popu = _this$menuPopup2.popupWindow) == null ? void 0 : _this$menuPopup2$popu.adjustPosition();
	    },
	    async editResource(resourceId, wizard) {
	      wizard.open(resourceId);
	    },
	    async hideResource(resourceId) {
	      const ids = [...this.favoritesIds];
	      const index = this.favoritesIds.indexOf(resourceId);
	      if (index === -1) {
	        return;
	      }
	      ids.splice(index, 1);
	      await booking_lib_resources.hideResources(ids);
	    },
	    async deleteResource(resourceId) {
	      const confirmed = await this.confirmDelete(resourceId);
	      if (confirmed) {
	        await booking_provider_service_resourcesService.resourceService.delete(resourceId);
	      }
	    },
	    async confirmDelete(resourceId) {
	      const disabled = await booking_provider_service_resourcesService.resourceService.hasBookings(resourceId);
	      return new Promise(resolve => {
	        const messageBox = ui_dialogs_messagebox.MessageBox.create({
	          message: main_core.Loc.getMessage('BOOKING_RESOURCE_CONFIRM_DELETE'),
	          yesCaption: main_core.Loc.getMessage('BOOKING_RESOURCE_CONFIRM_DELETE_YES'),
	          modal: true,
	          buttons: ui_dialogs_messagebox.MessageBoxButtons.YES_CANCEL,
	          onYes: () => {
	            messageBox.close();
	            resolve(true);
	          },
	          onCancel: () => {
	            messageBox.close();
	            resolve(false);
	          }
	        });
	        if (disabled) {
	          const popup = messageBox.getPopupWindow();
	          popup.subscribe('onAfterShow', () => {
	            const yesButton = messageBox.getYesButton();
	            yesButton.setDisabled(true);
	            main_core.Event.bind(yesButton.getContainer(), 'mouseenter', () => {
	              this.hint.show(yesButton.getContainer(), main_core.Loc.getMessage('BOOKING_RESOURCE_CONFIRM_DELETE_HINT'), true);
	            });
	            main_core.Event.bind(yesButton.getContainer(), 'mouseleave', () => {
	              this.hint.hide(yesButton.getContainer());
	            });
	          });
	        }
	        messageBox.show();
	      });
	    }
	  },
	  template: `
		<button ref="menu-button" class="ui-icon-set --more" @click="openMenu"></button>
	`
	};

	const Resource = {
	  props: {
	    resourceId: {
	      type: Number,
	      required: true
	    }
	  },
	  data() {
	    return {
	      visible: true
	    };
	  },
	  mounted() {
	    this.updateVisibility();
	    this.updateVisibilityDuringTransition();
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      resourcesIds: `${booking_const.Model.Interface}/resourcesIds`,
	      zoom: `${booking_const.Model.Interface}/zoom`,
	      scroll: `${booking_const.Model.Interface}/scroll`,
	      selectedDateTs: `${booking_const.Model.Interface}/selectedDateTs`
	    }),
	    resource() {
	      return this.$store.getters[`${booking_const.Model.Resources}/getById`](this.resourceId);
	    },
	    resourceType() {
	      return this.$store.getters[`${booking_const.Model.ResourceTypes}/getById`](this.resource.typeId);
	    },
	    profit() {
	      const currencyId = booking_lib_currencyFormat.currencyFormat.getBaseCurrencyId();
	      const deals = this.bookings.map(({
	        externalData
	      }) => {
	        var _externalData$find;
	        return (_externalData$find = externalData == null ? void 0 : externalData.find(data => data.entityTypeId === booking_const.CrmEntity.Deal)) != null ? _externalData$find : null;
	      }).filter(deal => {
	        var _deal$data;
	        return (deal == null ? void 0 : (_deal$data = deal.data) == null ? void 0 : _deal$data.currencyId) === currencyId;
	      });
	      if (deals.length === 0) {
	        return '';
	      }
	      const uniqueDeals = [...new Map(deals.map(it => [it.value, it])).values()];
	      const profit = uniqueDeals.reduce((sum, deal) => sum + deal.data.opportunity, 0);
	      return booking_lib_currencyFormat.currencyFormat.format(currencyId, profit);
	    },
	    bookings() {
	      return this.$store.getters[`${booking_const.Model.Bookings}/getByDateAndResources`](this.selectedDateTs, [this.resourceId]);
	    }
	  },
	  methods: {
	    updateVisibilityDuringTransition() {
	      var _this$animation;
	      (_this$animation = this.animation) == null ? void 0 : _this$animation.stop();
	      this.animation = new BX.easing({
	        duration: 200,
	        start: {},
	        finish: {},
	        step: this.updateVisibility
	      });
	      this.animation.animate();
	    },
	    updateVisibility() {
	      if (!this.$refs.container) {
	        return;
	      }
	      const rect = this.$refs.container.getBoundingClientRect();
	      this.visible = rect.right > 0 && rect.left < window.innerWidth;
	    }
	  },
	  watch: {
	    scroll() {
	      this.updateVisibility();
	    },
	    zoom() {
	      this.updateVisibility();
	    },
	    resourcesIds() {
	      this.updateVisibilityDuringTransition();
	    }
	  },
	  components: {
	    ResourceMenu,
	    ResourceWorkload
	  },
	  template: `
		<div
			class="booking-booking-header-resource"
			data-element="booking-resource"
			:data-id="resourceId"
			ref="container"
		>
			<template v-if="visible">
				<ResourceWorkload
					:resourceId="resourceId"
					:scale="zoom"
					:isGrid="true"
				/>
				<div class="booking-booking-header-resource-title">
					<div class="booking-booking-header-resource-name" :title="resource.name">
						{{ resource.name }}
					</div>
					<div class="booking-booking-header-resource-type" :title="resourceType.name">
						{{ resourceType.name }}
					</div>
				</div>
				<div class="booking-booking-header-resource-profit" v-html="profit"></div>
				<div class="booking-booking-header-resource-actions">
					<ResourceMenu :resource-id/>
				</div>
			</template>
		</div>
	`
	};

	const AddResourceButton = {
	  data() {
	    return {
	      IconSet: ui_iconSet_api_vue.Set,
	      hovered: false
	    };
	  },
	  computed: ui_vue3_vuex.mapGetters({
	    isLoaded: `${booking_const.Model.Interface}/isLoaded`,
	    isFeatureEnabled: `${booking_const.Model.Interface}/isFeatureEnabled`
	  }),
	  methods: {
	    async addResource() {
	      if (!this.isFeatureEnabled) {
	        await booking_lib_limit.limit.show();
	        return;
	      }
	      new booking_resourceCreationWizard.ResourceCreationWizard().open();
	      booking_lib_analytics.RcwAnalytics.sendClickAddResource();
	    },
	    async showAhaMoment() {
	      await booking_lib_ahaMoments.ahaMoments.show({
	        id: 'booking-add-resource',
	        title: this.loc('BOOKING_AHA_ADD_RESOURCES_TITLE'),
	        text: this.loc('BOOKING_AHA_ADD_RESOURCES_TEXT'),
	        article: booking_const.HelpDesk.AhaAddResource,
	        target: this.$refs.button
	      });
	      booking_lib_ahaMoments.ahaMoments.setShown(booking_const.AhaMoment.AddResource);
	    }
	  },
	  watch: {
	    isLoaded() {
	      if (booking_lib_ahaMoments.ahaMoments.shouldShow(booking_const.AhaMoment.AddResource)) {
	        void this.showAhaMoment();
	      }
	    }
	  },
	  components: {
	    Icon: ui_iconSet_api_vue.BIcon
	  },
	  template: `
		<div
			class="booking-booking-header-add-resource-icon-container"
			:class="{ '--hover': hovered }"
			@click="addResource"
			@mouseenter="hovered = true"
			@mouseleave="hovered = false"
		>
			<div
				class="booking-booking-header-add-resource-icon"
				:class="{'--lock': !isFeatureEnabled}"
			>
				<Icon v-if="isFeatureEnabled" :name="IconSet.PLUS_20"/>
				<Icon v-else :name="IconSet.LOCK" :size="16"/>
			</div>
		</div>
		<div
			class="booking-booking-header-add-resource"
			:class="{ '--hover': hovered }"
			ref="button"
			@click="addResource"
			@mouseenter="hovered = true"
			@mouseleave="hovered = false"
		>
			<div class="booking-booking-header-add-resource-text">
				{{ loc('BOOKING_BOOKING_ADD_RESOURCE') }}
			</div>
		</div>
	`
	};

	class ContentHeader extends ui_entitySelector.BaseHeader {
	  constructor(...props) {
	    super(...props);
	    this.getContainer();
	  }
	  render() {
	    return this.options.content;
	  }
	}

	const ResourceTypes = {
	  emits: ['update:modelValue'],
	  data() {
	    return {
	      selectedTypes: {}
	    };
	  },
	  computed: ui_vue3_vuex.mapGetters({
	    resourceTypes: 'resourceTypes/get'
	  }),
	  methods: {
	    selectAll() {
	      Object.keys(this.selectedTypes).forEach(typeId => {
	        this.selectedTypes[typeId] = true;
	      });
	    },
	    deselectAll() {
	      Object.keys(this.selectedTypes).forEach(typeId => {
	        this.selectedTypes[typeId] = false;
	      });
	    }
	  },
	  watch: {
	    resourceTypes(resourceTypes) {
	      resourceTypes.forEach(resourceType => {
	        var _this$selectedTypes, _resourceType$id, _this$selectedTypes$_;
	        (_this$selectedTypes$_ = (_this$selectedTypes = this.selectedTypes)[_resourceType$id = resourceType.id]) != null ? _this$selectedTypes$_ : _this$selectedTypes[_resourceType$id] = true;
	      });
	    },
	    selectedTypes: {
	      handler() {
	        this.$emit('update:modelValue', this.selectedTypes);
	      },
	      deep: true
	    }
	  },
	  template: `
		<div class="booking-booking-resources-dialog-header-types">
			<div class="booking-booking-resources-dialog-header-header">
				<div class="booking-booking-resources-dialog-header-title">
					{{ loc('BOOKING_BOOKING_RESOURCES_DIALOG_RESOURCE_TYPES') }}
				</div>
				<div
					class="booking-booking-resources-dialog-header-button"
					data-element="booking-resources-dialog-select-all-types-button"
					@click="selectAll"
				>
					{{ loc('BOOKING_BOOKING_RESOURCES_DIALOG_SELECT_ALL') }}
				</div>
				<div
					class="booking-booking-resources-dialog-header-button"
					data-element="booking-resources-dialog-deselect-all-types-button"
					@click="deselectAll"
				>
					{{ loc('BOOKING_BOOKING_RESOURCES_DIALOG_DESELECT_ALL') }}
				</div>
			</div>
			<div class="booking-booking-resources-dialog-header-items">
				<template v-for="resourceType of resourceTypes" :key="resourceType.id">
					<label
						class="booking-booking-resources-dialog-header-item"
						data-element="booking-resources-dialog-type"
						:data-id="resourceType.id"
						:data-selected="selectedTypes[resourceType.id]"
					>
						<span
							class="booking-booking-resources-dialog-header-item-text"
							data-element="booking-resources-dialog-type-name"
							:data-id="resourceType.id"
						>
							{{ resourceType.name }}
						</span>
						<input type="checkbox" v-model="selectedTypes[resourceType.id]">
					</label>
				</template>
			</div>
		</div>
	`
	};

	const Resize$1 = {
	  emits: ['startResize', 'endResize'],
	  props: {
	    getNode: {
	      type: Function,
	      required: true
	    }
	  },
	  data() {
	    return {
	      isResized: false,
	      startMouseY: 0,
	      startHeight: 0
	    };
	  },
	  methods: {
	    startResize(event) {
	      this.$emit('startResize');
	      main_core.Dom.style(document.body, 'user-select', 'none');
	      main_core.Event.bind(window, 'mouseup', this.endResize);
	      main_core.Event.bind(window, 'pointermove', this.resize);
	      this.isResized = true;
	      this.startMouseY = event.clientY;
	      this.startHeight = this.getNode().offsetHeight;
	    },
	    resize(event) {
	      if (!this.isResized) {
	        return;
	      }
	      event.preventDefault();
	      const minHeight = 110;
	      const maxHeight = 180;
	      const height = this.startHeight + event.clientY - this.startMouseY;
	      const newHeight = Math.min(maxHeight, Math.max(height, minHeight));
	      main_core.Dom.style(this.getNode(), 'max-height', `${newHeight}px`);
	    },
	    endResize() {
	      this.$emit('endResize');
	      main_core.Dom.style(document.body, 'user-select', '');
	      main_core.Event.unbind(window, 'mouseup', this.endResize);
	      main_core.Event.unbind(window, 'pointermove', this.resize);
	      this.isResized = false;
	    }
	  },
	  template: `
		<div
			class="booking-booking-resources-dialog-header-resize"
			@mousedown="startResize"
		></div>
	`
	};

	const Search = {
	  emits: ['search'],
	  data() {
	    return {
	      searchDebounced: main_core.Runtime.debounce(this.search, 200, this),
	      query: ''
	    };
	  },
	  computed: {
	    searchIcon() {
	      return ui_iconSet_api_vue.Set.SEARCH_2;
	    }
	  },
	  methods: {
	    onInput(event) {
	      const query = event.target.value;
	      this.query = query;
	      if (main_core.Type.isStringFilled(query)) {
	        this.searchDebounced(query);
	      } else {
	        this.search(query);
	      }
	    },
	    search(query) {
	      if (this.query === query) {
	        this.$emit('search', query);
	      }
	    }
	  },
	  components: {
	    Icon: ui_iconSet_api_vue.BIcon
	  },
	  template: `
		<div class="booking-booking-resources-dialog-header-input-container">
			<input
				class="booking-booking-resources-dialog-header-input"
				:placeholder="loc('BOOKING_BOOKING_RESOURCES_DIALOG_SEARCH')"
				data-element="booking-resources-dialog-search-input"
				@input="onInput"
			>
			<div class="booking-booking-resources-dialog-header-input-icon">
				<Icon :name="searchIcon"/>
			</div>
		</div>
	`
	};

	const DialogHeader = {
	  emits: ['update:modelValue', 'search', 'startResize', 'endResize', 'selectAll', 'deselectAll'],
	  data() {
	    return {
	      selectedTypes: {}
	    };
	  },
	  computed: ui_vue3_vuex.mapGetters({
	    resources: 'resources/get'
	  }),
	  watch: {
	    selectedTypes: {
	      handler() {
	        this.$emit('update:modelValue', this.selectedTypes);
	      },
	      deep: true
	    }
	  },
	  components: {
	    ResourceTypes,
	    Resize: Resize$1,
	    Search
	  },
	  template: `
		<div class="booking-booking-resources-dialog-header" ref="header">
			<ResourceTypes
				ref="resourceTypes"
				v-model="selectedTypes"
			/>
			<Resize
				:getNode="() => this.$refs.resourceTypes.$el"
				@startResize="$emit('startResize')"
				@endResize="$emit('endResize')"
			/>
			<div class="booking-booking-resources-dialog-header-resources">
				<div class="booking-booking-resources-dialog-header-header">
					<div class="booking-booking-resources-dialog-header-title">
						{{ loc('BOOKING_BOOKING_RESOURCES_DIALOG_RESOURCES') }}
					</div>
					<div
						class="booking-booking-resources-dialog-header-button"
						data-element="booking-resources-dialog-select-all-button"
						@click="$emit('selectAll')"
					>
						{{ loc('BOOKING_BOOKING_RESOURCES_DIALOG_SELECT_ALL') }}
					</div>
					<div
						class="booking-booking-resources-dialog-header-button"
						data-element="booking-resources-dialog-deselect-all-button"
						@click="$emit('deselectAll')"
					>
						{{ loc('BOOKING_BOOKING_RESOURCES_DIALOG_DESELECT_ALL') }}
					</div>
				</div>
				<Search @search="(query) => this.$emit('search', query)"/>
			</div>
		</div>
	`
	};

	class ContentFooter extends ui_entitySelector.BaseFooter {
	  constructor(...props) {
	    super(...props);
	    this.getContainer();
	  }
	  render() {
	    return this.options.content;
	  }
	}

	const DialogFooter = {
	  name: 'DialogFooter',
	  emits: ['reset'],
	  computed: {
	    buttonSettings() {
	      return Object.freeze({
	        size: booking_component_button.ButtonSize.SMALL,
	        color: booking_component_button.ButtonColor.LINK
	      });
	    },
	    buttonLabel() {
	      return this.loc('BOOKING_BOOKING_RESOURCES_DIALOG_RESET');
	    }
	  },
	  components: {
	    UiButton: booking_component_button.Button
	  },
	  template: `
		<div class="booking--booking--select-resources-dialog-footer">
			<UiButton
				:size="buttonSettings.size"
				:color="buttonSettings.color"
				:text="buttonLabel"
				button-class="booking--booking--select-resources-dialog-footer__button"
				@click="$emit('reset')"
			/>
		</div>
	`
	};

	const SelectResources = {
	  data() {
	    return {
	      dialogFilled: false,
	      query: '',
	      saveItemsDebounce: main_core.Runtime.debounce(this.saveItems, 10, this),
	      workloadRefs: {},
	      selectedTypes: {}
	    };
	  },
	  mounted() {
	    this.dialog = new ui_entitySelector.Dialog({
	      context: 'BOOKING',
	      targetNode: this.$refs.button,
	      width: 340,
	      height: Math.min(window.innerHeight - 280, 600),
	      offsetLeft: 4,
	      dropdownMode: true,
	      preselectedItems: this.favoritesIds.map(resourceId => [booking_const.EntitySelectorEntity.Resource, resourceId]),
	      items: this.resources.map(resource => this.getItemOptions(resource)),
	      entities: [{
	        id: booking_const.EntitySelectorEntity.Resource
	      }],
	      events: {
	        onShow: this.onShow,
	        'Item:onSelect': this.saveItemsDebounce,
	        'Item:onDeselect': this.saveItemsDebounce
	      },
	      header: ContentHeader,
	      headerOptions: {
	        content: this.$refs.dialogHeader.$el
	      },
	      footer: ContentFooter,
	      footerOptions: {
	        content: this.$refs.dialogFooter.$el
	      }
	    });
	    main_core.Event.bind(this.dialog.getRecentTab().getContainer(), 'scroll', this.loadOnScroll);
	    main_core.Event.EventEmitter.subscribe('BX.Main.Popup:onAfterClose', this.tryShowAhaMoment);
	    main_core.Event.EventEmitter.subscribe('BX.Main.Popup:onDestroy', this.tryShowAhaMoment);
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      selectedDateTs: `${booking_const.Model.Interface}/selectedDateTs`,
	      favoritesIds: `${booking_const.Model.Favorites}/get`,
	      resources: `${booking_const.Model.Resources}/get`,
	      isFilterMode: `${booking_const.Model.Interface}/isFilterMode`,
	      isEditingBookingMode: `${booking_const.Model.Interface}/isEditingBookingMode`,
	      isLoaded: `${booking_const.Model.Interface}/isLoaded`,
	      mainResources: `${booking_const.Model.MainResources}/resources`
	    }),
	    mainResourceIds() {
	      return new Set(this.mainResources);
	    },
	    isDefaultState() {
	      return this.mainResourceIds.size === this.favoritesIds.length && this.favoritesIds.every(id => this.mainResourceIds.has(id));
	    }
	  },
	  methods: {
	    showDialog() {
	      this.updateItems();
	      void this.loadMainResources();
	      this.dialog.show();
	    },
	    async onShow() {
	      if (this.dialogFilled) {
	        void this.loadOnScroll();
	        return;
	      }
	      this.dialogFilled = true;
	      await booking_provider_service_resourceDialogService.resourceDialogService.fillDialog(this.selectedDateTs / 1000);
	    },
	    async loadOnScroll() {
	      const container = this.dialog.getRecentTab().getContainer();
	      const scrollTop = container.scrollTop;
	      const maxScroll = container.scrollHeight - container.offsetHeight;
	      if (scrollTop + 10 >= maxScroll) {
	        const loadedResourcesIds = booking_lib_resourcesDateCache.resourcesDateCache.getIdsByDateTs(this.selectedDateTs / 1000);
	        const resourcesIds = this.resources.map(resource => resource.id);
	        const idsToLoad = resourcesIds.filter(id => !loadedResourcesIds.includes(id)).slice(0, booking_const.Limit.ResourcesDialog);
	        await booking_provider_service_resourceDialogService.resourceDialogService.loadByIds(idsToLoad, this.selectedDateTs / 1000);
	        this.updateItems();
	      }
	    },
	    async loadMainResources() {
	      await booking_provider_service_resourceDialogService.resourceDialogService.getMainResources();
	    },
	    updateItems() {
	      this.dialog.getItems().forEach(item => {
	        const id = item.getId();
	        const workload = this.workloadRefs[id];
	        const isHidden = this.isItemHidden(id);
	        const isSelected = this.isItemSelected(id);
	        item.getNodes().forEach(node => {
	          const avatarContainer = node.getAvatarContainer();
	          main_core.Dom.style(avatarContainer, 'width', 'max-content');
	          main_core.Dom.style(avatarContainer, 'height', 'max-content');
	          main_core.Dom.append(workload, avatarContainer);
	        });
	        item.setHidden(isHidden);
	        if (!item.isSelected() && isSelected) {
	          item.select();
	        }
	        if (item.isSelected() && !isSelected) {
	          item.deselect();
	        }
	      });
	    },
	    saveItems() {
	      void booking_lib_resources.hideResources(this.dialog.getSelectedItems().map(item => item.id));
	    },
	    addItems(resources) {
	      const itemsOptions = resources.reduce((acc, resource) => ({
	        ...acc,
	        [resource.id]: this.getItemOptions(resource)
	      }), {});
	      Object.values(itemsOptions).forEach(itemOptions => this.dialog.addItem(itemOptions));
	      const itemsIds = this.dialog.getItems().map(item => item.getId()).filter(id => itemsOptions[id]);
	      this.dialog.removeItems();
	      itemsIds.forEach(id => this.dialog.addItem(itemsOptions[id]));

	      // I don't know why, but tab is being removed after this.dialog.removeItems();
	      const tab = this.dialog.getActiveTab();
	      if (tab) {
	        tab.getContainer().append(tab.getRootNode().getChildrenContainer());
	        tab.render();
	      }
	      this.updateItems();
	      if (main_core.Type.isStringFilled(this.query)) {
	        void this.search(this.query);
	      }
	    },
	    getItemOptions(resource) {
	      return {
	        id: resource.id,
	        entityId: booking_const.EntitySelectorEntity.Resource,
	        title: resource.name,
	        subtitle: this.getResourceType(resource.typeId).name,
	        avatarOptions: {
	          bgImage: 'none',
	          borderRadius: '0'
	        },
	        tabs: booking_const.EntitySelectorTab.Recent,
	        selected: this.isItemSelected(resource.id),
	        hidden: this.isItemHidden(resource.id),
	        nodeAttributes: {
	          'data-id': resource.id,
	          'data-element': 'booking-select-resources-dialog-item'
	        }
	      };
	    },
	    isItemSelected(id) {
	      return this.favoritesIds.includes(id);
	    },
	    isItemHidden(id) {
	      const loadedResourcesIds = booking_lib_resourcesDateCache.resourcesDateCache.getIdsByDateTs(this.selectedDateTs / 1000);
	      const resource = this.getResource(id);
	      const visible = loadedResourcesIds.includes(id) && resource && this.selectedTypes[resource.typeId];
	      return !visible;
	    },
	    getResource(id) {
	      return this.$store.getters['resources/getById'](id);
	    },
	    getResourceType(id) {
	      return this.$store.getters['resourceTypes/getById'](id);
	    },
	    async search(query) {
	      this.query = query;
	      this.dialog.search(this.query);
	      this.updateItems();
	      this.dialog.getSearchTab().getStub().hide();
	      this.dialog.getSearchTab().getSearchLoader().show();
	      await booking_provider_service_resourceDialogService.resourceDialogService.doSearch(this.query, this.selectedDateTs / 1000);
	      this.dialog.search(this.query);
	      this.updateItems();
	      this.dialog.getSearchTab().getSearchLoader().hide();
	      if (this.dialog.getSearchTab().isEmptyResult()) {
	        this.dialog.getSearchTab().getStub().show();
	      }
	    },
	    startResize() {
	      this.dialog.freeze();
	    },
	    endResize() {
	      setTimeout(() => this.dialog.unfreeze());
	    },
	    selectAll() {
	      this.dialog.getItems().forEach(item => {
	        if (!item.isHidden()) {
	          item.select();
	        }
	      });
	    },
	    deselectAll() {
	      this.dialog.getItems().forEach(item => {
	        if (!item.isHidden()) {
	          item.deselect();
	        }
	      });
	    },
	    setWorkloadRef(element, id) {
	      this.workloadRefs[id] = element;
	    },
	    tryShowAhaMoment() {
	      if (booking_lib_ahaMoments.ahaMoments.shouldShow(booking_const.AhaMoment.SelectResources)) {
	        main_core.Event.EventEmitter.unsubscribe('BX.Main.Popup:onAfterClose', this.tryShowAhaMoment);
	        main_core.Event.EventEmitter.unsubscribe('BX.Main.Popup:onDestroy', this.tryShowAhaMoment);
	        void this.showAhaMoment();
	      }
	    },
	    async showAhaMoment() {
	      await booking_lib_ahaMoments.ahaMoments.show({
	        id: 'booking-select-resources',
	        title: this.loc('BOOKING_AHA_SELECT_RESOURCES_TITLE'),
	        text: this.loc('BOOKING_AHA_SELECT_RESOURCES_TEXT'),
	        article: booking_const.HelpDesk.AhaSelectResources,
	        target: this.$refs.button
	      });
	      booking_lib_ahaMoments.ahaMoments.setShown(booking_const.AhaMoment.SelectResources);
	    },
	    reset() {
	      const mainResourceIds = this.mainResourceIds;
	      this.dialog.getItems().forEach(item => {
	        if (mainResourceIds.has(item.id)) {
	          item.select();
	        } else {
	          item.deselect();
	        }
	      });
	    }
	  },
	  watch: {
	    favoritesIds() {
	      this.updateItems();
	    },
	    resources: {
	      handler(resources) {
	        setTimeout(() => this.addItems(resources));
	        booking_provider_service_resourceDialogService.resourceDialogService.clearMainResourcesCache();
	      },
	      deep: true
	    },
	    selectedTypes: {
	      handler() {
	        this.updateItems();
	      },
	      deep: true
	    },
	    isLoaded() {
	      this.tryShowAhaMoment();
	    }
	  },
	  components: {
	    DialogHeader,
	    DialogFooter,
	    ResourceWorkload
	  },
	  template: `
		<div
			class="booking-booking-select-resources"
			:class="{'--disabled': isFilterMode}"
			data-element="booking-select-resources"
			ref="button"
			@click="showDialog"
		>
			<div class="ui-icon-set --funnel"></div>
		</div>
		<DialogHeader
			ref="dialogHeader"
			v-model="selectedTypes"
			@search="search"
			@startResize="startResize"
			@endResize="endResize"
			@selectAll="selectAll"
			@deselectAll="deselectAll"
		/>
		<DialogFooter
			v-show="dialogFilled && !isDefaultState"
			ref="dialogFooter"
			@reset="reset"
		/>
		<div class="booking-booking-select-resources-workload-container">
			<template v-for="resource of resources">
				<span class="booking-booking-select-resources-workload" :ref="(el) => setWorkloadRef(el, resource.id)">
					<ResourceWorkload :resourceId="resource.id"/>
				</span>
			</template>
		</div>
	`
	};

	const Header = {
	  computed: ui_vue3_vuex.mapGetters({
	    resourcesIds: `${booking_const.Model.Interface}/resourcesIds`,
	    scroll: `${booking_const.Model.Interface}/scroll`,
	    isEditingBookingMode: `${booking_const.Model.Interface}/isEditingBookingMode`
	  }),
	  watch: {
	    scroll(value) {
	      this.$refs.inner.scrollLeft = value;
	    }
	  },
	  components: {
	    Resource,
	    AddResourceButton,
	    SelectResources
	  },
	  template: `
		<div class="booking-booking-header">
			<SelectResources/>
			<div
				class="booking-booking-header-inner"
				ref="inner"
				@scroll="$store.dispatch('interface/setScroll', $refs.inner.scrollLeft)"
			>
				<TransitionGroup name="booking-transition-resource">
					<template v-for="resourceId of resourcesIds" :key="resourceId">
						<Resource :resourceId="resourceId"/>
					</template>
				</TransitionGroup>
				<AddResourceButton v-if="!isEditingBookingMode"/>
			</div>
		</div>
	`
	};

	const Multiple = {
	  emits: ['change'],
	  props: {
	    resourceId: {
	      type: Number,
	      required: true
	    }
	  },
	  data() {
	    return {
	      isSelected: false,
	      selectedItems: []
	    };
	  },
	  mounted() {
	    this.selector = this.createSelector();
	  },
	  unmounted() {
	    this.selector.destroy();
	    this.selector = null;
	  },
	  methods: {
	    createSelector() {
	      var _this$intersections$t;
	      const selectedIds = (_this$intersections$t = this.intersections[this.resourceId]) != null ? _this$intersections$t : [];
	      return new ui_entitySelector.Dialog({
	        id: `booking-intersection-selector-resource-${this.resourceId}`,
	        targetNode: this.$refs.intersectionField,
	        preselectedItems: selectedIds.map(id => [booking_const.EntitySelectorEntity.Resource, id]),
	        width: 400,
	        enableSearch: true,
	        dropdownMode: true,
	        context: 'bookingResourceIntersection',
	        multiple: true,
	        cacheable: true,
	        showAvatars: false,
	        entities: [{
	          id: booking_const.EntitySelectorEntity.Resource,
	          dynamicLoad: true,
	          dynamicSearch: true
	        }],
	        searchOptions: {
	          allowCreateItem: false,
	          footerOptions: {
	            label: this.loc('BOOKING_BOOKING_ADD_INTERSECTION_DIALOG_SEARCH_FOOTER')
	          }
	        },
	        events: {
	          onHide: this.changeSelected.bind(this),
	          onLoad: this.changeSelected.bind(this)
	        }
	      });
	    },
	    showSelector() {
	      if (this.isFeatureEnabled) {
	        this.selector.show();
	      } else {
	        void booking_lib_limit.limit.show();
	      }
	    },
	    changeSelected() {
	      this.selectedItems = this.selector.getSelectedItems();
	      this.isSelected = this.selectedItems.length > 0;
	      const selectedIds = this.selectedItems.map(item => item.id);
	      this.$emit('change', selectedIds, this.resourceId);
	    },
	    handleRemove(itemId) {
	      this.selector.getItem([booking_const.EntitySelectorEntity.Resource, itemId]).deselect();
	      this.changeSelected();
	    }
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      intersections: `${booking_const.Model.Interface}/intersections`,
	      isFeatureEnabled: `${booking_const.Model.Interface}/isFeatureEnabled`,
	      resources: `${booking_const.Model.Resources}/get`
	    }),
	    resourcesIds() {
	      return this.resources.map(({
	        id
	      }) => id);
	    },
	    firstItemTitle() {
	      return this.selectedItems.length > 0 ? this.selectedItems[0].title : '';
	    },
	    remainingItemsCount() {
	      return this.selectedItems.length > 1 ? this.selectedItems.length - 1 : 0;
	    }
	  },
	  watch: {
	    resourcesIds(resourcesIds, previousResourcesIds) {
	      if (resourcesIds.join(',') === previousResourcesIds.join(',')) {
	        return;
	      }
	      const deletedIds = previousResourcesIds.filter(id => !resourcesIds.includes(id));
	      const newIds = resourcesIds.filter(id => !previousResourcesIds.includes(id));
	      deletedIds.forEach(id => {
	        const item = this.selector.getItem([booking_const.EntitySelectorEntity.Resource, id]);
	        this.selector.removeItem(item);
	      });
	      newIds.forEach(id => {
	        const resource = this.$store.getters[`${booking_const.Model.Resources}/getById`](id);
	        const resourceType = this.$store.getters[`${booking_const.Model.ResourceTypes}/getById`](resource.typeId);
	        this.selector.addItem({
	          id,
	          entityId: booking_const.EntitySelectorEntity.Resource,
	          title: resource.name,
	          subtitle: resourceType.name,
	          tabs: booking_const.EntitySelectorTab.Recent
	        });
	      });
	      this.changeSelected();
	    },
	    resources: {
	      handler() {
	        this.selector.getItems().forEach(item => {
	          const resource = this.$store.getters[`${booking_const.Model.Resources}/getById`](item.getId());
	          if (!resource) {
	            return;
	          }
	          const resourceType = this.$store.getters[`${booking_const.Model.ResourceTypes}/getById`](resource.typeId);
	          item.setTitle(resource.name);
	          item.setSubtitle(resourceType.name);
	        });
	        this.selector.getTagSelector().getTags().forEach(tag => {
	          const resource = this.$store.getters[`${booking_const.Model.Resources}/getById`](tag.getId());
	          if (!resource) {
	            return;
	          }
	          tag.setTitle(resource.name);
	          tag.render();
	        });
	        this.selectedItems = this.selector.getSelectedItems();
	      },
	      deep: true
	    }
	  },
	  template: `
		<div
			ref="intersectionField"
			class="booking-booking-intersections-resource"
			:data-id="'booking-booking-intersections-resource-' + resourceId"
		>
			<template v-if="isSelected">
				<div
					ref="selectorItemContainer"
					class="booking-booking-intersections-resource-container"
				>
					<div
						v-if="selectedItems.length > 0"
						class="bbi-resource-selector-item bbi-resource-selector-tag"
					>
						<div class="bbi-resource-selector-tag-content" :title="firstItemTitle">
							<div class="bbi-resource-selector-tag-title">{{ firstItemTitle }}</div>
						</div>
						<div 
							class="bbi-resource-selector-tag-remove"
							@click="handleRemove(selectedItems[0].id)"
							:data-id="'bbi-resource-selector-tag-remove-' + resourceId"
						></div>
					</div>
					<div
						v-if="remainingItemsCount > 0"
						class="bbi-resource-selector-item bbi-resource-selector-tag --count"
						@click="showSelector"
						:data-id="'bbi-resource-selector-tag-count-' + resourceId"
					>
						<div class="bbi-resource-selector-tag-content">
							<div class="bbi-resource-selector-tag-title --count">+{{ remainingItemsCount }}</div>
						</div>
					</div>
					<div>
						<span
							class="bbi-resource-selector-item bbi-resource-selector-add-button"
							@click="showSelector"
							:data-id="'bbi-resource-selector-add-button' + resourceId"
						>
							<span class="bbi-resource-selector-add-button-caption">
								{{ loc('BOOKING_BOOKING_INTERSECTION_BUTTON_MORE') }}
							</span>
						</span>
					</div>
				</div>
			</template>
			<template v-else>
				<span
					ref="selectorButton"
					class="bbi-resource-selector-item bbi-resource-selector-add-button"
					@click="showSelector"
					:data-id="'bbi-resource-selector-add-button' + resourceId"
				>
					<span class="bbi-resource-selector-add-button-caption">
						{{ loc('BOOKING_BOOKING_INTERSECTION_BUTTON') }}
					</span>
				</span>
			</template>
		</div>
	`
	};

	const Single = {
	  emits: ['change'],
	  created() {
	    this.selector = this.createSelector();
	    if (!this.isFeatureEnabled) {
	      this.selector.lock();
	    }
	  },
	  mounted() {
	    this.mountSelector();
	    main_core.Event.EventEmitter.subscribe('BX.Main.Popup:onAfterClose', this.tryShowAhaMoment);
	    main_core.Event.EventEmitter.subscribe('BX.Main.Popup:onDestroy', this.tryShowAhaMoment);
	  },
	  beforeUnmount() {
	    this.destroySelector();
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      isEditingBookingMode: `${booking_const.Model.Interface}/isEditingBookingMode`,
	      intersections: `${booking_const.Model.Interface}/intersections`,
	      isLoaded: `${booking_const.Model.Interface}/isLoaded`,
	      isFeatureEnabled: `${booking_const.Model.Interface}/isFeatureEnabled`,
	      resources: `${booking_const.Model.Resources}/get`
	    }),
	    resourcesIds() {
	      return this.resources.map(({
	        id
	      }) => id);
	    }
	  },
	  methods: {
	    createSelector() {
	      return new ui_entitySelector.TagSelector({
	        multiple: true,
	        addButtonCaption: this.loc('BOOKING_BOOKING_ADD_INTERSECTION'),
	        showCreateButton: false,
	        maxHeight: 50,
	        dialogOptions: {
	          header: this.loc('BOOKING_BOOKING_ADD_INTERSECTION_DIALOG_HEADER'),
	          context: 'bookingResourceIntersection',
	          width: 290,
	          height: 340,
	          dropdownMode: true,
	          enableSearch: true,
	          cacheable: true,
	          showAvatars: false,
	          entities: [{
	            id: booking_const.EntitySelectorEntity.Resource,
	            dynamicLoad: true,
	            dynamicSearch: true
	          }],
	          searchOptions: {
	            allowCreateItem: false,
	            footerOptions: {
	              label: this.loc('BOOKING_BOOKING_ADD_INTERSECTION_DIALOG_SEARCH_FOOTER')
	            }
	          }
	        },
	        events: {
	          onAfterTagAdd: this.onSelectorChange,
	          onAfterTagRemove: this.onSelectorChange
	        }
	      });
	    },
	    onSelectorChange() {
	      const selectedIds = this.selector.getDialog().getSelectedItems().map(({
	        id
	      }) => id);
	      this.$emit('change', selectedIds);
	    },
	    mountSelector() {
	      this.selector.renderTo(this.$refs.intersectionField);
	    },
	    destroySelector() {
	      this.selector.getDialog().destroy();
	      this.selector = null;
	      this.$refs.intersectionField.innerHTML = '';
	    },
	    getResource(id) {
	      return this.$store.getters['resources/getById'](id);
	    },
	    getResourceType(id) {
	      return this.$store.getters['resourceTypes/getById'](id);
	    },
	    tryShowAhaMoment() {
	      if (booking_lib_ahaMoments.ahaMoments.shouldShow(booking_const.AhaMoment.ResourceIntersection) && this.selector) {
	        main_core.Event.EventEmitter.unsubscribe('BX.Main.Popup:onAfterClose', this.tryShowAhaMoment);
	        main_core.Event.EventEmitter.unsubscribe('BX.Main.Popup:onDestroy', this.tryShowAhaMoment);
	        void this.showAhaMoment();
	      }
	    },
	    async showAhaMoment() {
	      await booking_lib_ahaMoments.ahaMoments.show({
	        id: 'booking-resource-intersection',
	        title: this.loc('BOOKING_AHA_RESOURCE_INTERSECTION_TITLE'),
	        text: this.loc('BOOKING_AHA_RESOURCE_INTERSECTION_TEXT'),
	        article: booking_const.HelpDesk.AhaResourceIntersection,
	        target: this.selector.getAddButton()
	      });
	      booking_lib_ahaMoments.ahaMoments.setShown(booking_const.AhaMoment.ResourceIntersection);
	    },
	    click() {
	      if (!this.isFeatureEnabled) {
	        void booking_lib_limit.limit.show();
	      }
	    }
	  },
	  watch: {
	    intersections(intersections) {
	      var _intersections$;
	      if (!this.isEditingBookingMode) {
	        return;
	      }
	      const resourcesIds = (_intersections$ = intersections[0]) != null ? _intersections$ : [];
	      resourcesIds.forEach(id => {
	        const resource = this.getResource(id);
	        this.selector.getDialog().addItem({
	          id: resource.id,
	          entityId: booking_const.EntitySelectorEntity.Resource,
	          title: resource.name,
	          subtitle: this.getResourceType(resource.typeId).name,
	          selected: true
	        });
	      });
	    },
	    isLoaded() {
	      this.tryShowAhaMoment();
	    },
	    resourcesIds(resourcesIds, previousResourcesIds) {
	      if (resourcesIds.join(',') === previousResourcesIds.join(',')) {
	        return;
	      }
	      const deletedIds = previousResourcesIds.filter(id => !resourcesIds.includes(id));
	      const newIds = resourcesIds.filter(id => !previousResourcesIds.includes(id));
	      deletedIds.forEach(id => {
	        const item = this.selector.getDialog().getItem([booking_const.EntitySelectorEntity.Resource, id]);
	        this.selector.getDialog().removeItem(item);
	        const tag = this.selector.getTags().find(it => it.getId() === id);
	        tag == null ? void 0 : tag.remove();
	      });
	      newIds.forEach(id => {
	        const resource = this.$store.getters[`${booking_const.Model.Resources}/getById`](id);
	        const resourceType = this.$store.getters[`${booking_const.Model.ResourceTypes}/getById`](resource.typeId);
	        this.selector.getDialog().addItem({
	          id,
	          entityId: booking_const.EntitySelectorEntity.Resource,
	          title: resource.name,
	          subtitle: resourceType.name,
	          tabs: booking_const.EntitySelectorTab.Recent
	        });
	      });
	      this.onSelectorChange();
	      this.tryShowAhaMoment();
	    },
	    resources: {
	      handler() {
	        this.selector.getDialog().getItems().forEach(item => {
	          const resource = this.$store.getters[`${booking_const.Model.Resources}/getById`](item.getId());
	          if (!resource) {
	            return;
	          }
	          const resourceType = this.$store.getters[`${booking_const.Model.ResourceTypes}/getById`](resource.typeId);
	          item.setTitle(resource.name);
	          item.setSubtitle(resourceType.name);
	        });
	        this.selector.getTags().forEach(tag => {
	          const resource = this.$store.getters[`${booking_const.Model.Resources}/getById`](tag.getId());
	          if (!resource) {
	            return;
	          }
	          tag.setTitle(resource.name);
	          tag.render();
	        });
	      },
	      deep: true
	    }
	  },
	  template: `
		<div
			ref="intersectionField"
			class="booking-booking-intersections-line"
			data-id="booking-booking-intersections-line"
			@click="click"
		></div>
	`
	};

	const Intersections = {
	  components: {
	    Icon: ui_iconSet_api_vue.BIcon,
	    Multiple,
	    Single
	  },
	  data() {
	    return {
	      IconSet: ui_iconSet_api_vue.Set,
	      intersectionModeMenuItemId: 'booking-intersection-menu-mode'
	    };
	  },
	  mounted() {
	    this.menu = main_popup.MenuManager.create('booking-intersection-menu', this.$refs.intersectionMenu, this.getMenuItems(), {
	      closeByEsc: true,
	      autoHide: true,
	      cacheable: true
	    });
	  },
	  unmounted() {
	    this.menu.destroy();
	    this.menu = null;
	  },
	  methods: {
	    showMenu() {
	      if (this.isFeatureEnabled) {
	        this.menu.show();
	      } else {
	        void booking_lib_limit.limit.show();
	      }
	    },
	    getMenuItems() {
	      return [this.getIntersectionForAllItem(), {
	        delimiter: true
	      }, this.getHelpDeskItem()];
	    },
	    getIntersectionForAllItem() {
	      return {
	        id: this.intersectionModeMenuItemId,
	        dataset: {
	          id: this.intersectionModeMenuItemId
	        },
	        text: this.loc('BOOKING_BOOKING_INTERSECTION_MENU_ALL'),
	        className: this.isIntersectionForAll ? 'menu-popup-item menu-popup-item-accept' : 'menu-popup-item menu-popup-no-icon',
	        onclick: () => {
	          this.menu.close();
	          const value = !this.isIntersectionForAll;
	          void this.$store.dispatch(`${booking_const.Model.Interface}/setIntersectionMode`, value);
	          void booking_provider_service_optionService.optionService.setBool(booking_const.Option.IntersectionForAll, value);
	        }
	      };
	    },
	    getHelpDeskItem() {
	      return {
	        id: 'booking-intersection-menu-info',
	        dataset: {
	          id: 'booking-intersection-menu-info'
	        },
	        text: this.loc('BOOKING_BOOKING_INTERSECTION_MENU_HOW'),
	        onclick: () => {
	          booking_lib_helpDesk.helpDesk.show(booking_const.HelpDesk.Intersection.code, booking_const.HelpDesk.Intersection.anchorCode);
	        }
	      };
	    },
	    async showIntersections(selectedResourceIds, resourceId = 0) {
	      const intersections = {
	        ...(resourceId === 0 ? {} : this.intersections),
	        [resourceId]: selectedResourceIds
	      };
	      await this.$store.dispatch(`${booking_const.Model.Interface}/setIntersections`, intersections);
	      await booking_lib_busySlots.busySlots.loadBusySlots();
	    },
	    toggleMenuItemActivityState(item) {
	      main_core.Dom.toggleClass(item.getContainer(), 'menu-popup-item-accept');
	      main_core.Dom.toggleClass(item.getContainer(), 'menu-popup-no-icon');
	    },
	    updateScroll() {
	      if (this.$refs.inner) {
	        this.$refs.inner.scrollLeft = this.scroll;
	      }
	    }
	  },
	  watch: {
	    async isIntersectionForAll() {
	      await this.$store.dispatch(`${booking_const.Model.Interface}/setIntersections`, {});
	      this.updateScroll();
	      await booking_lib_busySlots.busySlots.loadBusySlots();
	      this.toggleMenuItemActivityState(this.menu.getMenuItem(this.intersectionModeMenuItemId));
	    },
	    scroll() {
	      this.updateScroll();
	    }
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      resourcesIds: `${booking_const.Model.Interface}/resourcesIds`,
	      isFilterMode: `${booking_const.Model.Interface}/isFilterMode`,
	      isEditingBookingMode: `${booking_const.Model.Interface}/isEditingBookingMode`,
	      intersections: `${booking_const.Model.Interface}/intersections`,
	      isIntersectionForAll: `${booking_const.Model.Interface}/isIntersectionForAll`,
	      scroll: `${booking_const.Model.Interface}/scroll`,
	      isLoaded: `${booking_const.Model.Interface}/isLoaded`,
	      isFeatureEnabled: `${booking_const.Model.Interface}/isFeatureEnabled`
	    }),
	    hasIntersections() {
	      return Object.values(this.intersections).some(resourcesIds => resourcesIds.length > 0);
	    },
	    disabled() {
	      return !this.isLoaded || this.isFilterMode || this.isEditingBookingMode;
	    }
	  },
	  template: `
		<div class="booking-booking-intersections" :class="{'--disabled': disabled}">
			<div
				ref="intersectionMenu"
				class="booking-booking-intersections-left-panel"
				:class="{'--active': hasIntersections}"
				@click="showMenu"
				data-id="booking-intersections-left-panel-menu"
			>
				<div class="ui-icon-set --double-rhombus"></div>
				<div v-if="!isFeatureEnabled" class="booking-lock-icon-container">
					<Icon :name="IconSet.LOCK"/>
				</div>
			</div>
			<Single v-if="isIntersectionForAll" @change="showIntersections"/>
			<template v-else>
				<div
					ref="inner"
					class="booking-booking-intersections-inner"
					@scroll="$store.dispatch('interface/setScroll', $refs.inner.scrollLeft)"
				>
					<div class="booking-booking-intersections-row">
						<div class="booking-booking-intersections-row-inner">
							<template v-for="resourceId of resourcesIds" :key="resourceId">
								<Multiple :resourceId="resourceId" @change="showIntersections"/>
							</template>
						</div>
					</div>
					<div class="booking-booking-intersections-inner-blank"></div>
				</div>
			</template>
		</div>
	`
	};

	const BaseComponent = {
	  data() {
	    return {
	      DateTimeFormat: main_date.DateTimeFormat
	    };
	  },
	  computed: ui_vue3_vuex.mapGetters({
	    fromHour: 'interface/fromHour',
	    toHour: 'interface/toHour',
	    zoom: 'interface/zoom'
	  }),
	  components: {
	    Header,
	    Intersections,
	    Grid
	  },
	  template: `
		<div
			id="booking-content"
			class="booking"
			:style="{
				'--from-hour': fromHour,
				'--to-hour': toHour,
				'--zoom': zoom,
			}"
			:class="{
				'--zoom-is-less-than-07': zoom < 0.7,
				'--zoom-is-less-than-08': zoom < 0.8,
				'--am-pm-mode': DateTimeFormat.isAmPmMode(),
			}"
		>
			<Header/>
			<Intersections/>
			<Grid/>
		</div>
	`
	};

	const BookingMultipleButton = {
	  name: 'BookingMultipleButton',
	  emits: ['book'],
	  props: {
	    fetching: Boolean
	  },
	  computed: {
	    text() {
	      return this.loc('BOOKING_MULTI_BUTTON_LABEL');
	    },
	    size() {
	      return booking_component_button.ButtonSize.SMALL;
	    },
	    color() {
	      return booking_component_button.ButtonColor.SUCCESS;
	    }
	  },
	  components: {
	    UiButton: booking_component_button.Button
	  },
	  template: `
		<UiButton
			:text
			:size
			:color
			:waiting="fetching"
			@click="$emit('book')"
		/>
	`
	};

	// @vue/component
	const MultiBookingItem = {
	  name: 'MultiBookingItem',
	  components: {
	    UiButton: booking_component_button.Button
	  },
	  emits: ['remove-selected'],
	  props: {
	    id: {
	      type: String,
	      required: true
	    },
	    fromTs: {
	      type: Number,
	      required: true
	    },
	    toTs: {
	      type: Number,
	      required: true
	    },
	    resourceId: {
	      type: Number,
	      required: true
	    }
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      offset: `${booking_const.Model.Interface}/offset`
	    }),
	    label() {
	      return this.loc('BOOKING_MULTI_ITEM_TITLE', {
	        '#DATE#': main_date.DateTimeFormat.format('d M H:i', (this.fromTs + this.offset) / 1000),
	        '#DURATION#': new booking_lib_duration.Duration(this.toTs - this.fromTs).format()
	      });
	    },
	    buttonColor() {
	      return booking_component_button.ButtonColor.LINK;
	    },
	    buttonSize() {
	      return booking_component_button.ButtonSize.EXTRA_SMALL;
	    }
	  },
	  template: `
		<div class="booking--multi-booking--book">
			<label>
				{{ label }}
			</label>
			<button
				:class="[buttonSize, buttonColor, 'ui-btn ui-icon-set --cross-20']"
				type="button"
				@click="$emit('remove-selected', this.id)">
			</button>
		</div>
	`
	};

	// @vue/component
	const MultiBookingItemsList = {
	  name: 'MultiBookingItemsList',
	  components: {
	    MultiBookingItem
	  },
	  emits: ['remove-selected'],
	  computed: {
	    selectedCells() {
	      return this.$store.getters[`${booking_const.Model.Interface}/selectedCells`];
	    },
	    selectedCellsCount() {
	      return Object.keys(this.selectedCells).length;
	    }
	  },
	  mounted() {
	    this.ears = new ui_ears.Ears({
	      container: this.$refs.wrapper,
	      smallSize: true,
	      className: 'booking--multi-booking--items-ears',
	      noScrollbar: true
	    }).init();
	  },
	  watch: {
	    selectedCellsCount: {
	      handler() {
	        setTimeout(() => this.ears.toggleEars(), 0);
	      }
	    }
	  },
	  template: `
		<div class="booking--multi-booking--book-list">
			<div ref="wrapper" class="booking--multi-booking--books-wrapper">
				<MultiBookingItem
					v-for="cell in selectedCells"
					:key="cell.id"
					:id="cell.id"
					:from-ts="cell.fromTs"
					:to-ts="cell.toTs"
					:resource-id="cell.resourceId"
					@remove-selected="$emit('remove-selected', $event)"/>
			</div>
		</div>
	`
	};

	const AddClientButton = {
	  name: 'AddClientButton',
	  emits: ['update:model-value'],
	  props: {
	    modelValue: {
	      type: Array,
	      required: true
	    }
	  },
	  data() {
	    return {
	      isPopupShown: false
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      getByClientData: `${booking_const.Model.Clients}/getByClientData`
	    }),
	    color() {
	      return booking_component_button.ButtonColor.LINK;
	    },
	    size() {
	      return booking_component_button.ButtonSize.EXTRA_SMALL;
	    },
	    label() {
	      var _this$modelValue$find;
	      if (this.modelValue.length === 0) {
	        return this.loc('BOOKING_MULTI_CLIENT');
	      }
	      return this.loc('BOOKING_MULTI_CLIENT_WHIT_NAME', {
	        '#NAME#': ((_this$modelValue$find = this.modelValue.find(client => client.name)) == null ? void 0 : _this$modelValue$find.name) || ''
	      });
	    },
	    currentClient() {
	      if (this.modelValue.length === 0) {
	        return null;
	      }
	      return {
	        contact: this.findClientByType(booking_const.CrmEntity.Contact),
	        company: this.findClientByType(booking_const.CrmEntity.Company)
	      };
	    }
	  },
	  methods: {
	    createClients(clients) {
	      const clientsData = clients.map(client => this.getByClientData(client));
	      this.$emit('update:model-value', clientsData);
	    },
	    findClientByType(clientTypeCode) {
	      return this.modelValue.find(({
	        type
	      }) => type.code === clientTypeCode);
	    }
	  },
	  components: {
	    ClientPopup: booking_component_clientPopup.ClientPopup
	  },
	  template: `
		<button
			:class="['ui-btn', 'booking--multi-booking--client-button', color, size]"
			type="button"
			ref="button"
			@click="isPopupShown = !isPopupShown"
		>
			<i class="ui-icon-set --customer-card"></i>
			<span>{{ label }}</span>
		</button>
		<ClientPopup
			v-if="isPopupShown"
			:bind-element="$refs.button"
			:currentClient
			@create="createClients"
			@close="isPopupShown = false"/>
	`
	};

	const CancelButton = {
	  name: 'CancelButton',
	  emits: ['click'],
	  setup() {
	    return {
	      color: booking_component_button.ButtonColor.LINK,
	      size: booking_component_button.ButtonSize.EXTRA_SMALL
	    };
	  },
	  template: `
		<button
			:class="['ui-btn', 'booking--multi-booking--cancel-button', color, size]"
			type="button"
			ref="button"
			@click="$emit('click')"
		>
			<i
				class="ui-icon-set --cross-25"
				style="--ui-icon-set__icon-base-color: rgba(var(--ui-color-palette-white-base-rgb), 0.3);--ui-icon-set__icon-size: var(--ui-size-2xl)"></i>
		</button>
	`
	};

	const MultiBooking = {
	  name: 'MultiBooking',
	  data() {
	    return {
	      fetching: false,
	      clients: [],
	      externalData: []
	    };
	  },
	  async beforeMount() {
	    this.clients = [];
	    this.externalData = [];
	    if (this.embedItems.length === 0) {
	      return;
	    }
	    const embedContact = this.embedItems.find(item => item.entityTypeId === booking_const.CrmEntity.Contact);
	    const embedCompany = this.embedItems.find(item => item.entityTypeId === booking_const.CrmEntity.Company);
	    const embedDeal = this.embedItems.find(item => item.entityTypeId === booking_const.CrmEntity.Deal);
	    if (embedContact) {
	      const contact = await booking_provider_service_clientService.clientService.getContactById(Number(embedContact.value));
	      if (contact) {
	        this.clients.push(contact);
	      }
	    }
	    if (embedCompany) {
	      const company = await booking_provider_service_clientService.clientService.getCompanyById(Number(embedCompany.value));
	      if (company) {
	        this.clients.push(company);
	      }
	    }
	    if (embedDeal) {
	      this.externalData.push(embedDeal);
	    }
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      selectedCells: `${booking_const.Model.Interface}/selectedCells`,
	      timezone: `${booking_const.Model.Interface}/timezone`,
	      embedItems: `${booking_const.Model.Interface}/embedItems`
	    })
	  },
	  methods: {
	    removeSelected(id) {
	      if (Object.hasOwnProperty.call(this.selectedCells, id)) {
	        this.$store.dispatch(`${booking_const.Model.Interface}/removeSelectedCell`, this.selectedCells[id]);
	      }
	    },
	    async book() {
	      const bookings = this.getBookings();
	      if (bookings.length === 0) {
	        return;
	      }
	      this.fetching = true;
	      await this.addCreatedFromEmbedBooking(bookings);
	      const bookingList = await booking_provider_service_bookingService.bookingService.addList(bookings);
	      booking_lib_analytics.BookingAnalytics.sendAddMultiBookings(bookingList.map(({
	        id
	      }) => id));
	      await this.addCreatedFromEmbedBooking(bookingList);
	      this.fetching = false;
	      this.showNotification(bookingList);
	      await this.closeMultiBooking();
	    },
	    getBookings() {
	      return Object.values(this.selectedCells).map(cell => ({
	        id: `tmp-id-${Date.now()}-${Math.random()}`,
	        dateFromTs: cell.fromTs,
	        dateToTs: cell.toTs,
	        resourcesIds: [cell.resourceId],
	        timezoneFrom: this.timezone,
	        timezoneTo: this.timezone,
	        externalData: this.externalData,
	        clients: this.clients
	      }));
	    },
	    showNotification(bookingList) {
	      const bookingQuantity = bookingList.length;
	      const balloon = BX.UI.Notification.Center.notify({
	        id: main_core.Text.getRandom(),
	        content: main_core.Loc.getMessagePlural('BOOKING_MULTI_CREATED', bookingQuantity, {
	          '#QUANTITY#': bookingQuantity
	        }),
	        actions: [{
	          title: this.loc('BOOKING_MULTI_CREATED_CANCEL'),
	          events: {
	            click: () => this.reset(bookingList, balloon)
	          }
	        }]
	      });
	    },
	    async reset(bookingList, balloon) {
	      await booking_provider_service_bookingService.bookingService.deleteList(bookingList.map(({
	        id
	      }) => id));
	      balloon == null ? void 0 : balloon.close();
	    },
	    async closeMultiBooking() {
	      await this.$store.dispatch(`${booking_const.Model.Interface}/clearSelectedCells`);
	    },
	    addCreatedFromEmbedBooking(bookings) {
	      this.$store.dispatch(`${booking_const.Model.Interface}/addCreatedFromEmbedBooking`, bookings.map(({
	        id
	      }) => id));
	    }
	  },
	  components: {
	    BookingMultipleButton,
	    MultiBookingItemsList,
	    AddClientButton,
	    CancelButton
	  },
	  template: `
		<Teleport to="#uiToolbarContainer" defer>
			<div class="booking--multi-booking--bar">
				<BookingMultipleButton :fetching @book="book"/>
				<MultiBookingItemsList @remove-selected="removeSelected"/>
				<div class="booking--multi-booking--divider-vertical"></div>
				<AddClientButton v-model="clients"/>
				<div class="booking--multi-booking--space"></div>
				<div class="booking--multi-booking--close">
					<div class="booking--multi-booking--divider-vertical"></div>
					<CancelButton @click="closeMultiBooking"/>
				</div>
			</div>
		</Teleport>
	`
	};

	const Banner = {
	  data() {
	    return {
	      isBannerShown: false,
	      bannerComponent: null
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      canTurnOnDemo: `${booking_const.Model.Interface}/canTurnOnDemo`
	    })
	  },
	  mounted() {
	    if (booking_lib_ahaMoments.ahaMoments.shouldShow(booking_const.AhaMoment.Banner)) {
	      void this.showBanner();
	    }
	  },
	  methods: {
	    async showBanner() {
	      ui_bannerDispatcher.BannerDispatcher.critical.toQueue(async onDone => {
	        const {
	          PromoBanner
	        } = await main_core.Runtime.loadExtension('booking.component.promo-banner');
	        this.bannerComponent = ui_vue3.shallowRef(PromoBanner);
	        this.isBannerShown = true;
	        this.setShown();
	        this.bannerClosed = new booking_lib_resolvable.Resolvable();
	        await this.bannerClosed;
	        onDone();
	      });
	    },
	    closeBanner() {
	      this.isBannerShown = false;
	      this.bannerClosed.resolve();
	    },
	    setShown() {
	      booking_lib_ahaMoments.ahaMoments.setShown(booking_const.AhaMoment.Banner);
	      booking_lib_analytics.BannerAnalytics.sendShowPopup();
	    },
	    buttonClick() {
	      booking_lib_analytics.BannerAnalytics.sendClickEnable();
	    }
	  },
	  template: `
		<component
			v-if="isBannerShown"
			:is="bannerComponent"
			:canTurnOnDemo="canTurnOnDemo"
			@buttonClick="buttonClick"
			@close="closeBanner"
		/>
	`
	};

	const Trial = {
	  data() {
	    return {
	      isBannerShown: false,
	      bannerComponent: null
	    };
	  },
	  watch: {
	    isShownTrialPopup() {
	      if (booking_lib_ahaMoments.ahaMoments.shouldShow(booking_const.AhaMoment.TrialBanner)) {
	        if (!ui_autoLaunch.AutoLauncher.isEnabled()) {
	          ui_autoLaunch.AutoLauncher.enable();
	        }
	        void this.showBanner();
	      }
	    }
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      isShownTrialPopup: `${booking_const.Model.Interface}/isShownTrialPopup`
	    })
	  },
	  methods: {
	    async showBanner() {
	      ui_bannerDispatcher.BannerDispatcher.critical.toQueue(async onDone => {
	        const {
	          TrialBanner
	        } = await main_core.Runtime.loadExtension('booking.component.trial-banner');
	        this.bannerComponent = ui_vue3.shallowRef(TrialBanner);
	        this.isBannerShown = true;
	        this.bannerClosed = new booking_lib_resolvable.Resolvable();
	        await this.bannerClosed;
	        onDone();
	      });
	    },
	    closeBanner() {
	      this.isBannerShown = false;
	      booking_lib_ahaMoments.ahaMoments.setShown(booking_const.AhaMoment.TrialBanner);
	      this.bannerClosed.resolve();
	    }
	  },
	  template: `
		<component v-if="isBannerShown" :is="bannerComponent" @close="closeBanner"/>
	`
	};

	const App = {
	  name: 'BookingApp',
	  props: {
	    afterTitleContainer: HTMLElement,
	    counterPanelContainer: HTMLElement,
	    filterId: String
	  },
	  data() {
	    return {
	      loader: new main_loader.Loader()
	    };
	  },
	  beforeMount() {
	    booking_lib_mousePosition.mousePosition.init();
	  },
	  async mounted() {
	    this.showLoader();
	    expandOffHours.setExpanded(true);
	    this.addAfterTitle();
	    booking_lib_analytics.SectionAnalytics.sendOpenSection();
	    await Promise.all([booking_provider_service_dictionaryService.dictionaryService.fetchData(), this.fetchPage(this.isEditingBookingMode ? 0 : this.selectedDateTs / 1000)]);
	    void this.$store.dispatch(`${booking_const.Model.Interface}/setIsLoaded`, true);
	  },
	  beforeUnmount() {
	    booking_lib_mousePosition.mousePosition.destroy();
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      selectedDateTs: `${booking_const.Model.Interface}/selectedDateTs`,
	      viewDateTs: `${booking_const.Model.Interface}/viewDateTs`,
	      isFilterMode: `${booking_const.Model.Interface}/isFilterMode`,
	      filteredBookingsIds: `${booking_const.Model.Interface}/filteredBookingsIds`,
	      selectedCells: `${booking_const.Model.Interface}/selectedCells`,
	      resourcesIds: `${booking_const.Model.Favorites}/get`,
	      extraResourcesIds: `${booking_const.Model.Interface}/extraResourcesIds`,
	      bookings: `${booking_const.Model.Bookings}/get`,
	      intersections: `${booking_const.Model.Interface}/intersections`,
	      editingBookingId: `${booking_const.Model.Interface}/editingBookingId`,
	      isEditingBookingMode: `${booking_const.Model.Interface}/isEditingBookingMode`,
	      offset: `${booking_const.Model.Interface}/offset`
	    }),
	    hasSelectedCells() {
	      return Object.keys(this.selectedCells).length > 0;
	    },
	    editingBooking() {
	      var _this$$store$getters$;
	      return (_this$$store$getters$ = this.$store.getters['bookings/getById'](this.editingBookingId)) != null ? _this$$store$getters$ : null;
	    }
	  },
	  methods: {
	    async fetchPage(dateTs = 0) {
	      this.showLoader();
	      await booking_provider_service_mainPageService.mainPageService.fetchData(dateTs);
	      if (this.extraResourcesIds.length > 0) {
	        await booking_provider_service_resourceDialogService.resourceDialogService.loadByIds(this.extraResourcesIds, this.selectedDateTs / 1000);
	      }
	      this.hideLoader();
	    },
	    onActiveItem(counterItem) {
	      if (this.ignoreConterPanel) {
	        return;
	      }
	      this.$refs.filter.setPresetId(this.getPresetIdByCounterItem(counterItem));
	    },
	    async applyFilter() {
	      const presetId = this.$refs.filter.getPresetId();
	      const fields = this.$refs.filter.getFields();
	      this.setCounterItem(this.getCounterItemByPresetId(presetId));
	      this.showLoader();
	      await Promise.all([this.$store.dispatch(`${booking_const.Model.Interface}/setFilterMode`, true), this.updateMarks(), booking_provider_service_bookingService.bookingService.filter(fields)]);
	      this.hideLoader();
	    },
	    async clearFilter() {
	      this.setCounterItem(null);
	      booking_provider_service_calendarService.calendarService.clearFilterCache();
	      booking_provider_service_bookingService.bookingService.clearFilterCache();
	      void Promise.all([this.$store.dispatch(`${booking_const.Model.Interface}/setResourcesIds`, this.resourcesIds), this.$store.dispatch(`${booking_const.Model.Interface}/setFilterMode`, false), this.$store.dispatch(`${booking_const.Model.Interface}/setFilteredBookingsIds`, []), this.$store.dispatch(`${booking_const.Model.Interface}/setFilteredMarks`, [])]);
	      this.hideLoader();
	    },
	    setCounterItem(item) {
	      this.ignoreConterPanel = true;
	      setTimeout(() => {
	        this.ignoreConterPanel = false;
	      }, 0);
	      this.$refs.countersPanel.setItem(item);
	    },
	    getCounterItemByPresetId(presetId) {
	      return {
	        [FilterPreset.NotConfirmed]: CounterItem.NotConfirmed,
	        [FilterPreset.Delayed]: CounterItem.Delayed
	      }[presetId];
	    },
	    getPresetIdByCounterItem(counterItem) {
	      return {
	        [CounterItem.NotConfirmed]: FilterPreset.NotConfirmed,
	        [CounterItem.Delayed]: FilterPreset.Delayed
	      }[counterItem];
	    },
	    addAfterTitle() {
	      this.afterTitleContainer.append(this.$refs.afterTitle.$el);
	    },
	    showResourcesWithBookings() {
	      const resourcesIds = this.$store.getters[`${booking_const.Model.Bookings}/getByDateAndIds`](this.selectedDateTs, this.filteredBookingsIds).map(booking => booking.resourcesIds[0]).filter((value, index, array) => array.indexOf(value) === index);
	      void this.$store.dispatch(`${booking_const.Model.Interface}/setResourcesIds`, resourcesIds);
	    },
	    async updateMarks() {
	      if (this.isFilterMode) {
	        await this.updateFilterMarks();
	      } else {
	        await Promise.all([this.updateFreeMarks(), this.updateCounterMarks()]);
	      }
	    },
	    async updateFreeMarks() {
	      const resources = this.resourcesIds.map(id => {
	        var _this$intersections$, _this$intersections$i;
	        return [id, ...((_this$intersections$ = this.intersections[0]) != null ? _this$intersections$ : []), ...((_this$intersections$i = this.intersections[id]) != null ? _this$intersections$i : [])];
	      });
	      await this.$store.dispatch(`${booking_const.Model.Interface}/setFreeMarks`, []);
	      await booking_provider_service_calendarService.calendarService.loadMarks(this.viewDateTs, resources);
	    },
	    async updateFilterMarks() {
	      const fields = this.$refs.filter.getFields();
	      await this.$store.dispatch(`${booking_const.Model.Interface}/setFilteredMarks`, []);
	      await booking_provider_service_calendarService.calendarService.loadFilterMarks(fields);
	    },
	    async updateCounterMarks() {
	      await booking_provider_service_calendarService.calendarService.loadCounterMarks(this.viewDateTs);
	    },
	    showLoader() {
	      void this.loader.show(this.$refs.baseComponent.$el);
	    },
	    hideLoader() {
	      void this.loader.hide();
	    }
	  },
	  watch: {
	    selectedDateTs() {
	      if (this.isFilterMode) {
	        void this.applyFilter();
	      } else {
	        void this.fetchPage(this.selectedDateTs / 1000);
	      }
	    },
	    filteredBookingsIds() {
	      if (this.isFilterMode) {
	        this.showResourcesWithBookings();
	      }
	    },
	    isFilterMode(isFilterMode) {
	      if (!isFilterMode) {
	        void this.fetchPage(this.selectedDateTs / 1000);
	      }
	    },
	    viewDateTs() {
	      void this.updateMarks();
	    },
	    resourcesIds() {
	      void this.updateMarks();
	    },
	    intersections() {
	      void this.updateMarks();
	    },
	    editingBooking(booking) {
	      var _booking$resourcesIds, _booking$resourcesIds2;
	      const additionalResourcesIds = (_booking$resourcesIds = booking == null ? void 0 : (_booking$resourcesIds2 = booking.resourcesIds) == null ? void 0 : _booking$resourcesIds2.slice(1)) != null ? _booking$resourcesIds : [];
	      if (additionalResourcesIds.length > 0) {
	        void this.$store.dispatch(`${booking_const.Model.Interface}/setIntersections`, {
	          0: additionalResourcesIds
	        });
	      }
	    }
	  },
	  components: {
	    BaseComponent,
	    AfterTitle,
	    Filter,
	    CountersPanel,
	    MultiBooking,
	    Banner,
	    Trial
	  },
	  template: `
		<div>
			<MultiBooking v-if="hasSelectedCells"/>
			<AfterTitle ref="afterTitle"/>
			<Filter
				:filterId="filterId"
				ref="filter"
				@apply="applyFilter"
				@clear="clearFilter"
			/>
			<CountersPanel
				:target="counterPanelContainer"
				ref="countersPanel"
				@activeItem="onActiveItem"
			/>
			<BaseComponent ref="baseComponent"/>
			<Banner/>
			<Trial/>
		</div>
	`
	};

	var _mountApplication = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mountApplication");
	class Booking$1 {
	  constructor(params) {
	    Object.defineProperty(this, _mountApplication, {
	      value: _mountApplication2
	    });
	    booking_core.Core.setParams(params);
	    void babelHelpers.classPrivateFieldLooseBase(this, _mountApplication)[_mountApplication]();
	  }
	}
	async function _mountApplication2() {
	  await booking_core.Core.init();
	  const application = ui_vue3.BitrixVue.createApp(App, booking_core.Core.getParams());
	  application.mixin(booking_component_mixin_locMixin.locMixin);
	  application.use(booking_core.Core.getStore());
	  application.mount(booking_core.Core.getParams().container);
	}

	exports.Booking = Booking$1;

}((this.BX.Booking = this.BX.Booking || {}),BX.Booking.Component.Mixin,BX,BX.Booking.Provider.Service,BX.Booking.Provider.Service,BX.Booking.Provider.Service,BX.Event,BX.UI,BX.UI,BX.UI.Vue3.Components,BX.Booking.Lib,BX.UI.NotificationManager,BX.Booking.Provider.Service,BX.Booking.Component,BX.Booking.Component,BX.Booking.Lib,BX.Booking.Component,BX.Booking.Component,BX.Vue3.Directives,BX,BX.Booking.Lib,BX.Booking.Component,BX.Booking.Lib,BX.Booking.Component,BX.Booking.Lib,BX.Booking.Model,BX.Booking.Model,BX.Booking.Lib,BX.Booking.Lib,BX.Booking.Lib,BX.Booking,BX.UI.DatePicker,BX.Booking.Lib,BX.Booking.Lib,BX.Booking.Component,BX.UI.Dialogs,BX,BX.Booking.Provider.Service,BX,BX.Booking,BX.Booking.Provider.Service,BX.Booking.Lib,BX.Booking.Lib,BX.Main,BX.UI.IconSet,BX,BX.Booking.Provider.Service,BX.Booking.Lib,BX.Booking.Lib,BX.UI.EntitySelector,BX.Booking.Lib,BX.Booking.Provider.Service,BX.Booking.Provider.Service,BX.UI,BX.Main,BX.Booking.Lib,BX.Booking.Component,BX.Booking.Component,BX.Booking.Lib,BX.UI.AutoLaunch,BX.Vue3.Vuex,BX,BX.Vue3,BX.UI,BX.Booking.Lib,BX.Booking.Const,BX.Booking.Lib));
//# sourceMappingURL=booking.bundle.js.map
