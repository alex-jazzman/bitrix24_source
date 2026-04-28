/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports,booking_const,booking_lib_segments,main_core,ui_datePicker,booking_lib_slotRanges,main_date,main_loader,booking_component_mixin_locMixin) {
	'use strict';

	const ALL_RESOURCES_ID = -1;
	const AllResource = {
	  id: ALL_RESOURCES_ID,
	  name: '',
	  typeName: '',
	  slotRanges: []
	};
	const DayIndexDict = Object.freeze({
	  Sun: 0,
	  Mon: 1,
	  Tue: 2,
	  Wed: 3,
	  Thu: 4,
	  Fri: 5,
	  Sat: 6
	});

	function mapDtoToResource(resourcesDto) {
	  return resourcesDto.map(dto => {
	    return {
	      ...dto,
	      slotRanges: dto.slotRanges.map(slotRange => {
	        return {
	          ...slotRange,
	          weekDays: slotRange.weekDays.map(weekDay => DayIndexDict[weekDay])
	        };
	      })
	    };
	  });
	}
	function mapResourcesToFormData(resources) {
	  const fd = new FormData();
	  resources.forEach((resource, index) => {
	    fd.append(`resources[${index}][id]`, resource.id);
	    for (const sku of resource.skus) {
	      fd.append(`resources[${index}][skus][]`, sku);
	    }
	  });
	  return fd;
	}

	let occupancyInstance = null;
	function createOccupancy(runAction) {
	  if (occupancyInstance instanceof Occupancy) {
	    return occupancyInstance;
	  }
	  occupancyInstance = new Occupancy(runAction);
	  return occupancyInstance;
	}
	var _runAction = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("runAction");
	var _timezone = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("timezone");
	var _resources = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("resources");
	var _requestCache = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("requestCache");
	var _requestedResourcesIds = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("requestedResourcesIds");
	var _occupancy = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("occupancy");
	var _requestOccupancy = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("requestOccupancy");
	var _getPromises = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPromises");
	var _calculateOccupancy = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("calculateOccupancy");
	class Occupancy {
	  constructor(runAction) {
	    Object.defineProperty(this, _calculateOccupancy, {
	      value: _calculateOccupancy2
	    });
	    Object.defineProperty(this, _getPromises, {
	      value: _getPromises2
	    });
	    Object.defineProperty(this, _requestOccupancy, {
	      value: _requestOccupancy2
	    });
	    Object.defineProperty(this, _runAction, {
	      writable: true,
	      value: () => {}
	    });
	    Object.defineProperty(this, _timezone, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _resources, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _requestCache, {
	      writable: true,
	      value: {}
	    });
	    Object.defineProperty(this, _requestedResourcesIds, {
	      writable: true,
	      value: {}
	    });
	    Object.defineProperty(this, _occupancy, {
	      writable: true,
	      value: {}
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _runAction)[_runAction] = runAction;
	  }
	  setResources(resources) {
	    babelHelpers.classPrivateFieldLooseBase(this, _resources)[_resources] = resources;
	    return this;
	  }
	  setTimezone(timezone) {
	    babelHelpers.classPrivateFieldLooseBase(this, _timezone)[_timezone] = timezone;
	    return this;
	  }
	  async getOccupancy(ids, dateTs) {
	    const requestedResourcesIds = babelHelpers.classPrivateFieldLooseBase(this, _requestedResourcesIds)[_requestedResourcesIds][dateTs];
	    const unrequestedResourcesIds = ids.filter(id => !(requestedResourcesIds != null && requestedResourcesIds.has(id)));
	    if (unrequestedResourcesIds.length > 0) {
	      var _babelHelpers$classPr, _babelHelpers$classPr2;
	      const request = babelHelpers.classPrivateFieldLooseBase(this, _requestOccupancy)[_requestOccupancy](unrequestedResourcesIds, dateTs);
	      (_babelHelpers$classPr2 = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _requestCache)[_requestCache])[dateTs]) != null ? _babelHelpers$classPr2 : _babelHelpers$classPr[dateTs] = {};
	      unrequestedResourcesIds.forEach(resourceId => {
	        babelHelpers.classPrivateFieldLooseBase(this, _requestCache)[_requestCache][dateTs][resourceId] = request;
	      });
	    }
	    await Promise.all(babelHelpers.classPrivateFieldLooseBase(this, _getPromises)[_getPromises](ids, dateTs));
	    return babelHelpers.classPrivateFieldLooseBase(this, _calculateOccupancy)[_calculateOccupancy](ids, dateTs);
	  }
	  clearCache() {
	    babelHelpers.classPrivateFieldLooseBase(this, _requestCache)[_requestCache] = {};
	    babelHelpers.classPrivateFieldLooseBase(this, _requestedResourcesIds)[_requestedResourcesIds] = {};
	  }
	}
	async function _requestOccupancy2(ids, dateTs) {
	  var _babelHelpers$classPr3, _babelHelpers$classPr4, _babelHelpers$classPr5, _babelHelpers$classPr6;
	  (_babelHelpers$classPr4 = (_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _occupancy)[_occupancy])[dateTs]) != null ? _babelHelpers$classPr4 : _babelHelpers$classPr3[dateTs] = {};
	  (_babelHelpers$classPr6 = (_babelHelpers$classPr5 = babelHelpers.classPrivateFieldLooseBase(this, _requestedResourcesIds)[_requestedResourcesIds])[dateTs]) != null ? _babelHelpers$classPr6 : _babelHelpers$classPr5[dateTs] = new Set();
	  ids.forEach(resourceId => {
	    var _babelHelpers$classPr7, _babelHelpers$classPr8;
	    (_babelHelpers$classPr8 = (_babelHelpers$classPr7 = babelHelpers.classPrivateFieldLooseBase(this, _occupancy)[_occupancy][dateTs])[resourceId]) != null ? _babelHelpers$classPr8 : _babelHelpers$classPr7[resourceId] = [];
	    babelHelpers.classPrivateFieldLooseBase(this, _requestedResourcesIds)[_requestedResourcesIds][dateTs].add(resourceId);
	  });
	  const {
	    data: occupancy
	  } = await babelHelpers.classPrivateFieldLooseBase(this, _runAction)[_runAction]('booking.api_v1.CrmForm.PublicForm.getOccupancy', {
	    data: {
	      ids,
	      dateTs: Math.floor(dateTs / 1000)
	    }
	  });
	  occupancy.forEach(({
	    resourcesIds,
	    fromTs,
	    toTs
	  }) => {
	    resourcesIds.forEach(resourceId => {
	      var _babelHelpers$classPr9;
	      (_babelHelpers$classPr9 = babelHelpers.classPrivateFieldLooseBase(this, _occupancy)[_occupancy][dateTs][resourceId]) == null ? void 0 : _babelHelpers$classPr9.push({
	        fromTs,
	        toTs,
	        resourcesIds
	      });
	    });
	  });
	}
	function _getPromises2(ids, dateTs) {
	  return Object.keys(babelHelpers.classPrivateFieldLooseBase(this, _requestCache)[_requestCache][dateTs]).filter(resourceId => ids.includes(Number(resourceId))).map(resourceId => babelHelpers.classPrivateFieldLooseBase(this, _requestCache)[_requestCache][dateTs][resourceId]);
	}
	function _calculateOccupancy2(resourcesIds, dateTs) {
	  const segments = new booking_lib_segments.Segments([[dateTs, new Date(dateTs).setDate(new Date(dateTs).getDate() + 1)]]);
	  const resource = babelHelpers.classPrivateFieldLooseBase(this, _resources)[_resources].find(({
	    id
	  }) => id === resourcesIds[0]);
	  const selectedWeekDay = booking_const.DateFormat.WeekDays[new Date(dateTs).getDay()];
	  booking_lib_slotRanges.SlotRanges.applyTimezone(resource.slotRanges, dateTs, babelHelpers.classPrivateFieldLooseBase(this, _timezone)[_timezone]).filter(slotRange => slotRange.weekDays.includes(selectedWeekDay)).forEach(slotRange => segments.subtract([new Date(dateTs).setMinutes(slotRange.from), new Date(dateTs).setMinutes(slotRange.to)]));
	  return resourcesIds.flatMap(resourceId => babelHelpers.classPrivateFieldLooseBase(this, _occupancy)[_occupancy][dateTs][resourceId]).map(({
	    fromTs,
	    toTs,
	    resourcesIds: slotResourcesIds
	  }) => {
	    return {
	      fromTs: fromTs * 1000,
	      toTs: toTs * 1000,
	      resourcesIds: slotResourcesIds
	    };
	  });
	}

	function formatPrice(sku) {
	  var _split;
	  if (typeof sku.price !== 'number' || Number.isNaN(sku.price)) {
	    return '';
	  }
	  const currency = ((_split = (sku.currencyFormat || '').split(' ')) == null ? void 0 : _split[1]) || '';
	  return `${sku.price} ${currency}`;
	}

	// @vue/component
	const SkuSelector = {
	  name: 'SkuSelector',
	  props: {
	    skus: {
	      type: Array,
	      required: true
	    }
	  },
	  emits: ['select'],
	  methods: {
	    formatPrice(sku) {
	      return formatPrice(sku);
	    }
	  },
	  template: `
		<div class="booking--crm-forms--resource-selector">
			<div
				v-for="(sku) in skus"
				:key="sku.id"
				class="b24-form-control-list-selector-item booking--crm-forms--resource-selector-resource"
				@click="$emit('select', sku)"
			>
				<div class="booking--crm-forms--skus-selector-sku">
					<div class="booking--crm-forms--skus-selector-sku-name">
						{{ sku.name }}
					</div>
					<div class="booking--crm-forms--skus-selector-sku-price" v-html="formatPrice(sku)"></div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const SkuQuantity = {
	  name: 'SkuQuantity',
	  props: {
	    sku: {
	      type: Object,
	      required: true
	    }
	  },
	  methods: {
	    formatPrice() {
	      return formatPrice(this.sku);
	    }
	  },
	  template: `
		<div class="booking-crm-forms-field-sku-selector-quantity">
			<div class="b24-form-control-product-price booking-crm-forms-field-sku-selector-quantity-price">
				<div class="b24-form-control-product-price-current" v-html="formatPrice()"></div>
			</div>
		</div>
	`
	};

	// @vue/component
	const SkuSelectBlock = {
	  name: 'SkuSelectBlock',
	  components: {
	    SkuSelector,
	    SkuQuantity
	  },
	  props: {
	    skuId: {
	      type: Number,
	      required: true
	    },
	    resourcesWithSkus: {
	      type: Array,
	      required: true
	    },
	    settingsData: {
	      type: Object,
	      required: true
	    },
	    dependencies: {
	      type: Object,
	      required: true
	    },
	    fetching: {
	      type: Boolean,
	      default: false
	    },
	    errorMessage: {
	      type: String,
	      default: ''
	    },
	    hasErrors: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['update:skuId'],
	  data() {
	    return {
	      dropdownOpened: false
	    };
	  },
	  computed: {
	    skus() {
	      const skusMap = new Map();
	      this.resourcesWithSkus.forEach(({
	        skus
	      }) => {
	        skus.forEach(sku => {
	          if (!skusMap.has(sku.id)) {
	            skusMap.set(sku.id, sku);
	          }
	        });
	      });
	      return [...skusMap.values()];
	    },
	    label() {
	      var _this$settingsData;
	      return ((_this$settingsData = this.settingsData) == null ? void 0 : _this$settingsData.skuLabel) || '';
	    },
	    sku() {
	      var _this$skus;
	      return ((_this$skus = this.skus) == null ? void 0 : _this$skus.find(sku => sku.id === this.skuId)) || null;
	    },
	    skuName() {
	      var _this$sku;
	      return ((_this$sku = this.sku) == null ? void 0 : _this$sku.name) || '';
	    },
	    placeholder() {
	      var _this$settingsData2;
	      return `${((_this$settingsData2 = this.settingsData) == null ? void 0 : _this$settingsData2.skuTextHeader) || ''} *`;
	    },
	    hint() {
	      var _this$settingsData3, _this$settingsData4;
	      return {
	        text: ((_this$settingsData3 = this.settingsData) == null ? void 0 : _this$settingsData3.skuHint) || '',
	        visible: Boolean((_this$settingsData4 = this.settingsData) == null ? void 0 : _this$settingsData4.isVisibleSkuHint)
	      };
	    },
	    fieldItemDropdownComponent() {
	      return this.dependencies.mixinDropdown.components['field-item-dropdown'];
	    }
	  },
	  watch: {
	    dropdownOpened(opened) {
	      if (opened) {
	        main_core.Event.bind(window, 'click', this.handleClickOutOfSelector, true);
	      } else {
	        main_core.Event.unbind(window, 'click', this.handleClickOutOfSelector, true);
	      }
	    }
	  },
	  unmounted() {
	    main_core.Event.unbind(window, 'click', this.handleClickOutOfSelector, true);
	  },
	  methods: {
	    handleClickOutOfSelector(e) {
	      var _this$$refs$dropdown$, _this$$refs$tagSelect;
	      if ((_this$$refs$dropdown$ = this.$refs.dropdown.$el) != null && _this$$refs$dropdown$.contains(e.target) || (_this$$refs$tagSelect = this.$refs.tagSelector) != null && _this$$refs$tagSelect.contains(e.target)) {
	        return;
	      }
	      this.closeDropdown();
	    },
	    toggleDropdown() {
	      if (this.dropdownOpened) {
	        this.closeDropdown();
	        return;
	      }
	      if (this.fetching) {
	        return;
	      }
	      this.dropdownOpened = true;
	    },
	    closeDropdown() {
	      setTimeout(() => {
	        this.dropdownOpened = false;
	      }, 0);
	    },
	    setSku(sku) {
	      this.$emit('update:skuId', sku.id);
	      this.closeDropdown();
	    }
	  },
	  template: `
		<div
			class="booking-crm-forms-field"
			:class="{
				'--error': false,
			}"
		>
			<div class="b24-form-field-layout-section booking-crm-forms-field-title">
				{{ label }}
			</div>
			<div
				ref="tagSelector"
				class="booking-crm-forms-field-sku-selector b24-form-control-string"
				:class="{
					'--disabled': fetching,
				}"
			>
				<div
					class="b24-form-control-container b24-form-control-icon-after booking-crm-forms-field-sku-selector-container"
					@click="toggleDropdown"
				>
					<input
						name="skuName"
						type="text"
						readonly
						:placeholder="placeholder"
						:value="skuName"
						class="b24-form-control booking--crm-forms--field-tag-selector-input"
						@click.capture.stop.prevent="toggleDropdown"
					/>
					<div class="booking--crm-forms--field-tag-selector-input-icon"></div>
				</div>
			</div>
			<component
				v-if="dropdownOpened"
				ref="dropdown"
				:is="fieldItemDropdownComponent"
				:marginTop="0"
				:visible="dropdownOpened"
				:title="label"
				@close="closeDropdown()"
			>
				<SkuSelector :skus="skus" @select="setSku"/>
			</component>
			<SkuQuantity v-if="sku" :sku="sku"/>
			<div class="b24-form-control-alert-message" style="top: 75px">{{ errorMessage }}</div>
			<div v-if="hint.visible" class="booking--crm-forms--field-hint">
				<div class="booking--crm-forms--field-hint-text">{{ hint.text }}</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const ResourceSelector = {
	  name: 'ResourceSelector',
	  props: {
	    resources: {
	      type: Array,
	      default: () => []
	    }
	  },
	  emits: ['select'],
	  template: `
		<div class="booking--crm-forms--resource-selector">
			<div
				v-for="(resource) in resources"
				:key="resource.id"
				class="b24-form-control-list-selector-item booking--crm-forms--resource-selector-resource"
				@click="$emit('select', resource)"
			>
				<div>
					<div class="booking--crm-forms--time-selector-block-resource-name">
						{{ resource.name }}
					</div>
					<div class="booking--crm-forms--time-selector-block-resource-type-name">
						{{ resource.typeName }}
					</div>
				</div>
			</div>
		</div>
	`
	};

	// eslint-disable-next-line no-unused-vars

	// @vue/component
	const ResourceSelectBlock = {
	  name: 'ResourceSelectBlock',
	  components: {
	    ResourceSelector
	  },
	  props: {
	    resourceId: {
	      type: Number,
	      required: true
	    },
	    /**
	     * @type {Resource[]}
	     */
	    resources: {
	      type: Array,
	      required: true
	    },
	    settingsData: {
	      type: Object,
	      required: true
	    },
	    fetching: {
	      type: Boolean,
	      default: false
	    },
	    errorMessage: {
	      type: String,
	      default: ''
	    },
	    hasErrors: {
	      type: Boolean,
	      default: false
	    },
	    dependencies: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['update:resourceId'],
	  data() {
	    return {
	      dropdownOpened: false
	    };
	  },
	  computed: {
	    label() {
	      var _this$settingsData;
	      return ((_this$settingsData = this.settingsData) == null ? void 0 : _this$settingsData.label) || '';
	    },
	    placeholder() {
	      var _this$settingsData2;
	      return `${((_this$settingsData2 = this.settingsData) == null ? void 0 : _this$settingsData2.textHeader) || ''} *`;
	    },
	    resource() {
	      return this.resources.find(resource => resource.id === this.resourceId);
	    },
	    resourceName() {
	      var _this$resource;
	      return ((_this$resource = this.resource) == null ? void 0 : _this$resource.name) || '';
	    },
	    hint() {
	      var _this$settingsData3, _this$settingsData4;
	      return {
	        text: ((_this$settingsData3 = this.settingsData) == null ? void 0 : _this$settingsData3.hint) || '',
	        visible: Boolean((_this$settingsData4 = this.settingsData) == null ? void 0 : _this$settingsData4.isVisibleHint)
	      };
	    },
	    fieldItemDropdownComponent() {
	      return this.dependencies.mixinDropdown.components['field-item-dropdown'];
	    }
	  },
	  watch: {
	    dropdownOpened(opened) {
	      if (opened) {
	        main_core.Event.bind(window, 'click', this.handleClickOutOfSelector, true);
	      } else {
	        main_core.Event.unbind(window, 'click', this.handleClickOutOfSelector, true);
	      }
	    }
	  },
	  unmounted() {
	    main_core.Event.unbind(window, 'click', this.handleClickOutOfSelector, true);
	  },
	  methods: {
	    handleClickOutOfSelector(e) {
	      var _this$$refs$dropdown$, _this$$refs$tagSelect;
	      if ((_this$$refs$dropdown$ = this.$refs.dropdown.$el) != null && _this$$refs$dropdown$.contains(e.target) || (_this$$refs$tagSelect = this.$refs.tagSelector) != null && _this$$refs$tagSelect.contains(e.target)) {
	        return;
	      }
	      this.closeDropdown();
	    },
	    toggleDropdown() {
	      if (this.dropdownOpened) {
	        this.closeDropdown();
	        return;
	      }
	      if (this.fetching) {
	        return;
	      }
	      this.dropdownOpened = true;
	    },
	    closeDropdown() {
	      setTimeout(() => {
	        this.dropdownOpened = false;
	      }, 0);
	    },
	    setResource(resource) {
	      this.$emit('update:resourceId', resource.id);
	      if (this.dropdownOpened) {
	        this.closeDropdown();
	      }
	    }
	  },
	  template: `
		<div
			class="booking-crm-forms-field"
			:class="{
				'--error': hasErrors,
			}"
		>
			<div class="b24-form-field-layout-section booking-crm-forms-field-title">
				{{ label }}
			</div>
			<div
				ref="tagSelector"
				class="booking-crm-forms-field-tag-selector b24-form-control-string"
				:class="{
					'--disabled': fetching,
				}"
			>
				<div
					class="b24-form-control-container b24-form-control-icon-after"
					@click="toggleDropdown"
				>
					<input
						name="resourceName"
						type="text"
						readonly
						:placeholder="placeholder"
						:value="resourceName"
						class="b24-form-control booking--crm-forms--field-tag-selector-input"
						@click.capture.stop.prevent="toggleDropdown"
					/>
					<div class="booking--crm-forms--field-tag-selector-input-icon"></div>
				</div>
			</div>
			<div class="b24-form-control-alert-message" style="top: 75px">{{ errorMessage }}</div>
			<component
				v-if="dropdownOpened"
				ref="dropdown"
				:is="fieldItemDropdownComponent"
				:marginTop="0"
				:visible="dropdownOpened"
				:title="label"
				@close="closeDropdown()"
			>
				<ResourceSelector :resources="resources" @select="setResource"/>
			</component>
			<div v-if="hint.visible" class="booking--crm-forms--field-hint">
				<div class="booking--crm-forms--field-hint-text">{{ hint.text }}</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const CalendarBlock = {
	  name: 'CalendarBlock',
	  mixins: [booking_component_mixin_locMixin.locMixin],
	  props: {
	    date: {
	      type: Date,
	      default: null
	    },
	    resource: {
	      type: Object,
	      required: true
	    },
	    titleOnly: {
	      type: Boolean,
	      default: false
	    },
	    hasError: {
	      type: Boolean,
	      default: false
	    },
	    errorMessage: {
	      type: String,
	      default: ''
	    }
	  },
	  emits: ['updateDate'],
	  data() {
	    return {
	      viewDate: null,
	      disabledPrevMonth: true
	    };
	  },
	  computed: {
	    formattedViewDate() {
	      return main_date.DateTimeFormat.format('f Y', this.viewDate);
	    },
	    title() {
	      if (this.date !== null && this.titleOnly) {
	        return this.loc('BOOKING_CRM_FORMS_FIELD_TIME_TITLE', {
	          '#DATE#': main_date.DateTimeFormat.format(this.loc('DAY_MONTH_FORMAT'), this.date)
	        });
	      }
	      return this.loc('BOOKING_CRM_FORMS_FIELD_DATE_TIME_TITLE');
	    }
	  },
	  watch: {
	    date(nextDate, prevDate) {
	      if (!(nextDate instanceof Date) || !(prevDate instanceof Date) || nextDate === prevDate || !this.datePicker) {
	        return;
	      }
	      this.datePicker.selectDate(nextDate);
	    }
	  },
	  created() {
	    this.viewDate = this.date;
	    const selectedDates = this.date instanceof Date ? [this.date.getTime()] : [];
	    this.datePicker = new ui_datePicker.DatePicker({
	      selectedDates,
	      startDate: new Date(),
	      inline: true,
	      hideHeader: true
	    });
	    this.datePicker.subscribe(ui_datePicker.DatePickerEvent.SELECT, event => {
	      const date = event.getData().date;
	      const selectedDate = this.toDateFromUtc(date);
	      this.setViewDate();
	      if (selectedDate !== this.date) {
	        this.$emit('updateDate', selectedDate);
	      }
	    });
	  },
	  mounted() {
	    this.datePicker.setTargetNode(this.$refs.datePicker);
	    this.datePicker.show();
	  },
	  beforeUnmount() {
	    this.datePicker.destroy();
	  },
	  methods: {
	    setPreviousMonth() {
	      const viewDate = this.datePicker.getViewDate();
	      if (this.checkPastDate()) {
	        this.updateDisabledPrevMonth();
	        return;
	      }
	      this.datePicker.setViewDate(ui_datePicker.getNextDate(viewDate, 'month', -1));
	      this.setViewDate();
	    },
	    setNextMonth() {
	      const viewDate = this.datePicker.getViewDate();
	      this.updateDisabledPrevMonth();
	      this.datePicker.setViewDate(ui_datePicker.getNextDate(viewDate, 'month'));
	      this.setViewDate();
	    },
	    setViewDate() {
	      this.viewDate = this.toDateFromUtc(this.datePicker.getViewDate());
	      this.updateDisabledPrevMonth();
	    },
	    toDateFromUtc(date) {
	      return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
	    },
	    updateDisabledPrevMonth() {
	      this.disabledPrevMonth = this.checkPastDate();
	    },
	    checkPastDate() {
	      const viewDate = this.datePicker.getViewDate();
	      const today = new Date();
	      return viewDate.getMonth() <= today.getMonth() && viewDate.getYear() <= today.getYear();
	    }
	  },
	  template: `
		<div
			class="booking-crm-forms-field booking--crm-forms--calendar-block"
			:class="{
				'--error': hasError,
			}"
		>
			<div class="b24-form-field-layout-section booking-crm-forms-field-title">{{ title }}</div>
			<div
				v-if="hasError"
				class="b24-form-control-alert-message"
				style="top: 30px"
			>
				{{ errorMessage }}
			</div>
			<div v-show="!titleOnly" class="booking--crm-forms--calendar-block-content">
				<div class="booking--crm-forms--calendar-block-datepicker-header">
					<div class="booking--crm-forms--calendar-block-datepicker-header-title">
						{{ formattedViewDate }}
					</div>
					<div
						class="booking--crm-forms--calendar-block-datepicker-header-button --left"
						:class="{ '--disabled': disabledPrevMonth }"
						@click="setPreviousMonth"
					>
						<div class="booking--crm-forms--calendar-block-datepicker-icon --chevron-left"></div>
					</div>
					<div
						class="booking--crm-forms--calendar-block-datepicker-header-button --right"
						@click="setNextMonth"
					>
						<div class="booking--crm-forms--calendar-block-datepicker-icon --chevron-right"></div>
					</div>
				</div>
				<div ref="datePicker" class="booking--crm-forms--calendar-block-datepicker"></div>
			</div>
		</div>
	`
	};

	const MAX_STEP_MINUTES = 30;
	const SLOT_START_OFFSET_MINUTES = 3;
	var _date = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("date");
	var _resourceOccupancies = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("resourceOccupancies");
	var _slotRanges = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("slotRanges");
	var _resourceId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("resourceId");
	var _timezone$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("timezone");
	var _timeFormat = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("timeFormat");
	var _occupancies = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("occupancies");
	var _convertMinutesToTs = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("convertMinutesToTs");
	var _roundSlotStart = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("roundSlotStart");
	var _createSlot = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createSlot");
	var _checkIsOccupiedSlot = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("checkIsOccupiedSlot");
	var _getOccupiedSlot = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getOccupiedSlot");
	var _getOccupancyBorderSlots = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getOccupancyBorderSlots");
	class SlotsCreator {
	  constructor(params) {
	    Object.defineProperty(this, _getOccupancyBorderSlots, {
	      value: _getOccupancyBorderSlots2
	    });
	    Object.defineProperty(this, _getOccupiedSlot, {
	      value: _getOccupiedSlot2
	    });
	    Object.defineProperty(this, _checkIsOccupiedSlot, {
	      value: _checkIsOccupiedSlot2
	    });
	    Object.defineProperty(this, _createSlot, {
	      value: _createSlot2
	    });
	    Object.defineProperty(this, _roundSlotStart, {
	      value: _roundSlotStart2
	    });
	    Object.defineProperty(this, _convertMinutesToTs, {
	      value: _convertMinutesToTs2
	    });
	    Object.defineProperty(this, _occupancies, {
	      get: _get_occupancies,
	      set: void 0
	    });
	    Object.defineProperty(this, _timeFormat, {
	      get: _get_timeFormat,
	      set: void 0
	    });
	    Object.defineProperty(this, _date, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _resourceOccupancies, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _slotRanges, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _resourceId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _timezone$1, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _date)[_date] = params.date;
	    babelHelpers.classPrivateFieldLooseBase(this, _resourceOccupancies)[_resourceOccupancies] = params.resourceOccupancy || [];
	    babelHelpers.classPrivateFieldLooseBase(this, _slotRanges)[_slotRanges] = params.slotRanges;
	    babelHelpers.classPrivateFieldLooseBase(this, _resourceId)[_resourceId] = params.resourceId || null;
	    babelHelpers.classPrivateFieldLooseBase(this, _timezone$1)[_timezone$1] = params.timezone;
	  }
	  calcResourceSlots() {
	    const nowTs = Date.now();
	    const slots = [];
	    booking_lib_slotRanges.SlotRanges.applyTimezone(babelHelpers.classPrivateFieldLooseBase(this, _slotRanges)[_slotRanges], babelHelpers.classPrivateFieldLooseBase(this, _date)[_date].getTime(), babelHelpers.classPrivateFieldLooseBase(this, _timezone$1)[_timezone$1]).filter(slotRange => slotRange.weekDays.includes(babelHelpers.classPrivateFieldLooseBase(this, _date)[_date].getDay())).sort((a, b) => a.from - b.from).forEach(slotRange => {
	      const slotsFromTs = new Set();
	      const slotDurationMs = slotRange.slotSize * 60 * 1000;
	      const step = slotRange.slotSize < MAX_STEP_MINUTES ? slotRange.slotSize : MAX_STEP_MINUTES;
	      const stepDurationMs = step * 60 * 1000;
	      let fromTs = babelHelpers.classPrivateFieldLooseBase(this, _convertMinutesToTs)[_convertMinutesToTs](babelHelpers.classPrivateFieldLooseBase(this, _date)[_date], slotRange.from);
	      if (fromTs < nowTs) {
	        fromTs = babelHelpers.classPrivateFieldLooseBase(this, _roundSlotStart)[_roundSlotStart](nowTs, step);
	      }
	      const rangeTs = [fromTs, babelHelpers.classPrivateFieldLooseBase(this, _convertMinutesToTs)[_convertMinutesToTs](babelHelpers.classPrivateFieldLooseBase(this, _date)[_date], slotRange.to)];
	      const slotOutOfRange = (slotFromTs, slotToTs) => {
	        return slotFromTs <= nowTs || slotFromTs < rangeTs[0] || slotToTs > rangeTs[1];
	      };
	      while (fromTs < rangeTs[1]) {
	        const toTs = fromTs + slotDurationMs;
	        if (slotOutOfRange(fromTs, toTs)) {
	          fromTs += stepDurationMs;
	          continue;
	        }
	        if (babelHelpers.classPrivateFieldLooseBase(this, _checkIsOccupiedSlot)[_checkIsOccupiedSlot](fromTs, toTs)) {
	          babelHelpers.classPrivateFieldLooseBase(this, _getOccupancyBorderSlots)[_getOccupancyBorderSlots](fromTs, toTs, slotDurationMs, slotOutOfRange).forEach(slotFromTs => slotsFromTs.add(slotFromTs));
	          fromTs += stepDurationMs;
	          continue;
	        }
	        slotsFromTs.add(fromTs);
	        fromTs += stepDurationMs;
	      }
	      [...slotsFromTs].forEach(slotFromTs => {
	        slots.push(babelHelpers.classPrivateFieldLooseBase(this, _createSlot)[_createSlot](slotFromTs, slotDurationMs));
	      });
	    });
	    return slots;
	  }
	}
	function _get_timeFormat() {
	  const isAmPmMode = new Intl.DateTimeFormat(navigator.language, {
	    hour: 'numeric'
	  }).resolvedOptions().hour12;
	  return isAmPmMode ? 'h:i a' : 'H:i';
	}
	function _get_occupancies() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _resourceId)[_resourceId] === null ? babelHelpers.classPrivateFieldLooseBase(this, _resourceOccupancies)[_resourceOccupancies] : babelHelpers.classPrivateFieldLooseBase(this, _resourceOccupancies)[_resourceOccupancies].filter(({
	    resourcesIds
	  }) => resourcesIds.includes(babelHelpers.classPrivateFieldLooseBase(this, _resourceId)[_resourceId]));
	}
	function _convertMinutesToTs2(date, minutes) {
	  const d = new Date(date);
	  d.setHours(0, 0, 0, 0);
	  d.setMinutes(minutes);
	  return d.getTime();
	}
	function _roundSlotStart2(slotStartTs, slotDurationMinutes) {
	  const slotStartDate = new Date(slotStartTs);
	  let k = Math.ceil(slotStartDate.getMinutes() / slotDurationMinutes);
	  if (k * slotDurationMinutes - slotStartDate.getMinutes() <= SLOT_START_OFFSET_MINUTES) {
	    k += 1;
	  }
	  const roundedDate = new Date(slotStartDate);
	  roundedDate.setMinutes(k * slotDurationMinutes);
	  slotStartDate.setMinutes(roundedDate.getMinutes());
	  return slotStartDate.getTime();
	}
	function _createSlot2(fromTs, duration) {
	  return {
	    fromTs,
	    toTs: fromTs + duration,
	    label: main_date.DateTimeFormat.format(babelHelpers.classPrivateFieldLooseBase(this, _timeFormat)[_timeFormat], new Date(fromTs))
	  };
	}
	function _checkIsOccupiedSlot2(fromTs, toTs) {
	  return babelHelpers.classPrivateFieldLooseBase(this, _occupancies)[_occupancies].some(occupancy => {
	    return fromTs >= occupancy.fromTs && fromTs < occupancy.toTs || toTs > occupancy.fromTs && toTs <= occupancy.toTs;
	  });
	}
	function _getOccupiedSlot2(slot, resourceOccupancy) {
	  return resourceOccupancy.find(occupancy => {
	    return slot.fromTs >= occupancy.fromTs && slot.fromTs < occupancy.toTs || slot.toTs > occupancy.fromTs && slot.toTs <= occupancy.toTs;
	  });
	}
	function _getOccupancyBorderSlots2(fromTs, toTs, slotSizeTs, slotOutOfRange) {
	  const borderSlotsFromTs = [];
	  const occupiedSlot = babelHelpers.classPrivateFieldLooseBase(this, _getOccupiedSlot)[_getOccupiedSlot]({
	    fromTs,
	    toTs
	  }, babelHelpers.classPrivateFieldLooseBase(this, _occupancies)[_occupancies]);
	  if (!occupiedSlot) {
	    return borderSlotsFromTs;
	  }
	  const leftSlot = [occupiedSlot.fromTs - slotSizeTs, occupiedSlot.fromTs];
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _checkIsOccupiedSlot)[_checkIsOccupiedSlot](leftSlot[0], leftSlot[1]) && !slotOutOfRange(leftSlot[0], leftSlot[1])) {
	    borderSlotsFromTs.push(leftSlot[0]);
	  }
	  const rightSlot = [occupiedSlot.toTs, occupiedSlot.toTs + slotSizeTs];
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _checkIsOccupiedSlot)[_checkIsOccupiedSlot](rightSlot[0], rightSlot[1]) && !slotOutOfRange(rightSlot[0], rightSlot[1])) {
	    borderSlotsFromTs.push(rightSlot[0]);
	  }
	  return borderSlotsFromTs;
	}

	// @vue/component
	const ResourceSlotsUiBlock = {
	  name: 'ResourceSlotsUiBlock',
	  mixins: [booking_component_mixin_locMixin.locMixin],
	  props: {
	    /**
	     * @type {ResourceSlot|null}
	     */
	    slot: {
	      type: Object,
	      default: null
	    },
	    date: {
	      type: Date,
	      required: true
	    },
	    /**
	     * @type {Resource}
	     */
	    resource: {
	      type: Object,
	      required: true
	    },
	    resourceSlots: {
	      type: Array,
	      default: () => []
	    },
	    loading: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['select'],
	  data() {
	    return {
	      showedMore: false
	    };
	  },
	  computed: {
	    formatDate() {
	      return main_date.DateTimeFormat.format(this.loc('DAY_MONTH_FORMAT'), this.date);
	    },
	    title() {
	      return this.loc('BOOKING_CRM_FORMS_FIELD_TIME_TITLE', {
	        '#DATE#': this.formatDate
	      });
	    },
	    emptySlotsMessage() {
	      const day = this.date.getDay();
	      if (this.resource.slotRanges.every(({
	        weekDays
	      }) => !weekDays.includes(day))) {
	        return this.loc('BOOKING_CRM_FORMS_RESOURCE_RESOURCE_NOT_WORKING_MESSAGE');
	      }
	      return this.loc('BOOKING_CRM_FORMS_RESOURCE_NO_SLOTS_MESSAGE', {
	        '#BR#': '<br />'
	      });
	    },
	    hasResourceAvatar() {
	      var _this$resource;
	      return Boolean((_this$resource = this.resource) == null ? void 0 : _this$resource.avatarUrl);
	    },
	    resourceAvatarUrl() {
	      return this.hasResourceAvatar ? this.resource.avatarUrl : '/bitrix/js/booking/crm-forms/field/images/resource-icon.svg';
	    },
	    resourceDescription() {
	      var _this$resource2;
	      return ((_this$resource2 = this.resource) == null ? void 0 : _this$resource2.description) || '';
	    },
	    shortResourceDescription() {
	      const SHORT_SIZE = 150 - this.more.length;
	      if (this.showedMore || this.resourceDescription < SHORT_SIZE) {
	        return this.resourceDescription;
	      }
	      const words = this.resourceDescription.split(' ');
	      let description = '';
	      for (const word of words) {
	        if (description.length + word.length > SHORT_SIZE) {
	          break;
	        }
	        description += `${word} `;
	      }
	      return description.trim();
	    },
	    more() {
	      return this.loc('BOOKING_CRM_FORMS_RESOURCE_DESCRIPTION_MORE');
	    }
	  },
	  watch: {
	    loading: {
	      handler(loading) {
	        if (loading) {
	          var _this$loader;
	          (_this$loader = this.loader) == null ? void 0 : _this$loader.show == null ? void 0 : _this$loader.show(this.$refs.slotsContainer);
	        } else {
	          var _this$loader2;
	          (_this$loader2 = this.loader) == null ? void 0 : _this$loader2.hide == null ? void 0 : _this$loader2.hide();
	        }
	      },
	      immediate: true
	    }
	  },
	  beforeMount() {
	    this.loader = new main_loader.Loader({
	      target: this.$refs.slotsContainer,
	      size: 60
	    });
	  },
	  methods: {
	    selectSlot(slot) {
	      const payload = {
	        date: this.date,
	        resource: this.resource,
	        slot
	      };
	      this.$emit('select', payload);
	    }
	  },
	  template: `
		<div class="booking-crm-forms-field booking--crm-forms--resource-slots">
			<slot name="title"/>
			<div class="booking--crm-forms--time-selector-block-header">
				<div class="booking--crm-forms--time-selector-block-resource">
					<div class="booking--crm-forms--resource-avatar">
						<img
							class="booking--crm-forms--resource-avatar-image"
							:src="resourceAvatarUrl"
							alt="Resource avatar"
							draggable="false"
						/>
					</div>
					<div class="booking--crm-forms--resource-info">
						<div class="booking--crm-forms--resource-name">
							{{ resource.name }}
						</div>
						<div class="booking--crm-forms--resource-type-name">
							{{ resource.typeName }}
						</div>
					</div>
				</div>
			</div>
			<div v-if="shortResourceDescription" class="booking--crm-forms--field-description-text">
				{{ shortResourceDescription }}
				<span
					v-if="shortResourceDescription.length < resourceDescription.length"
					class="booking--crm-forms--field-description-text-more"
					@click="showedMore = true"
				>
					{{ more }}
				</span>
			</div>
			<div ref="slotsContainer" class="booking--crm-forms--resource-slots__slot-list-wrapper">
				<div v-show="!loading" class="booking--crm-forms--resource-slots__slot-list">
					<div
						v-for="resourceSlot in resourceSlots"
						:key="resourceSlot"
						class="booking--crm-forms-time-selector-block-time-list-item booking--crm-forms--resource-slots__slot"
						:class="{
							'--selected': slot !== null && resourceSlot.fromTs === slot.fromTs
						}"
						@click="selectSlot(resourceSlot)"
					>
						<span>{{ resourceSlot.label }}</span>
					</div>
					<template v-if="resourceSlots.length === 0">
						<div class="booking--crm-forms--resource-slots__empty-slots">
							<div
								class="booking--crm-forms--resource-slots__empty-slots-message"
								v-html="emptySlotsMessage"
							>
							</div>
						</div>
					</template>
				</div>
				<div class="booking--crm-forms--time-selector-block-header__button">
					<slot name="changeDateBtn" :date="date" :resource="resource"/>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const TimeSelectorBlock = {
	  name: 'TimeSelectorBlock',
	  components: {
	    ResourceSlotsUiBlock
	  },
	  mixins: [booking_component_mixin_locMixin.locMixin],
	  inject: ['isPreview'],
	  props: {
	    slot: {
	      type: Object,
	      default: null
	    },
	    /**
	     * @type {Resource}
	     */
	    resource: {
	      type: Object,
	      default: null
	    },
	    /**
	     * @type {Resource[]}
	     */
	    resources: {
	      type: Array,
	      default: () => []
	    },
	    date: {
	      type: Date,
	      required: true
	    },
	    fetching: {
	      type: Boolean,
	      default: false
	    },
	    showChangeDateButton: {
	      type: Boolean,
	      default: false
	    },
	    runAction: {
	      type: Function,
	      required: true
	    },
	    timezone: {
	      type: String,
	      required: true
	    }
	  },
	  emits: ['update:slot', 'update:fetching', 'showCalendar'],
	  data() {
	    return {
	      resourceOccupancy: []
	    };
	  },
	  computed: {
	    resourceSlots() {
	      var _this$resource;
	      const slotsCreator = new SlotsCreator({
	        date: this.date,
	        slotRanges: ((_this$resource = this.resource) == null ? void 0 : _this$resource.slotRanges) || [],
	        resourceOccupancy: this.resourceOccupancy || [],
	        timezone: this.timezone
	      });
	      return slotsCreator.calcResourceSlots();
	    }
	  },
	  watch: {
	    date: {
	      handler(date) {
	        if (date instanceof Date && !this.isPreview) {
	          void this.fetchOccupancy();
	        }
	      },
	      immediate: true
	    },
	    resource: {
	      handler() {
	        if (!this.isPreview) {
	          void this.fetchOccupancy();
	        }
	      }
	    }
	  },
	  created() {
	    this.initOccupancy();
	  },
	  methods: {
	    initOccupancy() {
	      if (this.occupancy instanceof Occupancy) {
	        return;
	      }
	      this.occupancy = createOccupancy(this.runAction);
	      this.occupancy.setResources(this.resources);
	      this.occupancy.setTimezone(this.timezone);
	    },
	    async fetchOccupancy() {
	      if (!this.date || this.fetching || this.resource === null) {
	        return;
	      }
	      if (!this.occupancy) {
	        this.initOccupancy();
	      }
	      this.$emit('update:fetching', true);
	      try {
	        const response = await this.occupancy.getOccupancy([this.resource.id], this.date.getTime());
	        this.resourceOccupancy = response || [];
	      } catch (error) {
	        console.error('Booking.CrmForms. GetOccupancy error', error);
	      } finally {
	        this.$emit('update:fetching', false);
	      }
	    },
	    changeSlot({
	      slot
	    }) {
	      this.$emit('update:slot', slot);
	    },
	    changeDate() {
	      this.$emit('showCalendar');
	    }
	  },
	  template: `
		<ResourceSlotsUiBlock
			:slot="slot"
			:resource="resource"
			:date="date"
			:resourceSlots="resourceSlots"
			:loading="fetching"
			@select="changeSlot"
		>
			<template #changeDateBtn>
				<button
					v-if="showChangeDateButton"
					type="button"
					class="booking--crm-forms--change-date-btn"
					@click="changeDate"
				>
					{{ loc('BOOKING_CRM_FORMS_CHANGE_DATE_BUTTON_CAPTION') }}
				</button>
			</template>
		</ResourceSlotsUiBlock>
	`
	};

	const DELAY = 300;

	// @vue/component
	const AvailableSlotsBlock = {
	  name: 'AvailableSlotsBlock',
	  components: {
	    ResourceSlotsUiBlock
	  },
	  mixins: [booking_component_mixin_locMixin.locMixin],
	  inject: ['isPreview'],
	  props: {
	    date: {
	      type: Date,
	      required: true
	    },
	    resources: {
	      type: Array,
	      required: true
	    },
	    runAction: {
	      type: Function,
	      required: true
	    },
	    timezone: {
	      type: String,
	      required: true
	    }
	  },
	  emits: ['update:form', 'update:resourceId'],
	  data() {
	    return {
	      fetching: false,
	      selectedResourceId: null,
	      visibleResourcesCount: 3,
	      resourceOccupancy: [],
	      resourcesSlots: []
	    };
	  },
	  computed: {
	    availableResource() {
	      return this.resourcesSlots.filter(({
	        slots
	      }) => slots.length > 0);
	    },
	    visibleResources() {
	      return this.availableResource.slice(0, this.visibleResourcesCount);
	    },
	    emptyResourcesSlotsMessage() {
	      return this.loc('BOOKING_CRM_FORMS_RESOURCE_NO_SLOTS_MESSAGE', {
	        '#BR#': '<br />'
	      });
	    }
	  },
	  watch: {
	    date: {
	      handler(date) {
	        if (date instanceof Date && !this.isPreview) {
	          void this.fetchAvailableSlots();
	        }
	      },
	      immediate: true
	    },
	    fetching: {
	      handler(fetching) {
	        var _this$loader2;
	        if (fetching) {
	          var _this$loader;
	          (_this$loader = this.loader) == null ? void 0 : _this$loader.show(this.$refs.resources);
	          return;
	        }
	        (_this$loader2 = this.loader) == null ? void 0 : _this$loader2.hide();
	      },
	      immediate: true
	    }
	  },
	  created() {
	    this.initOccupancy();
	  },
	  beforeMount() {
	    this.loader = new main_loader.Loader({
	      target: this.$refs.resources,
	      size: 60
	    });
	  },
	  methods: {
	    initOccupancy() {
	      if (this.occupancy instanceof Occupancy) {
	        return;
	      }
	      this.occupancy = createOccupancy(this.runAction);
	      this.occupancy.setResources(this.resources);
	      this.occupancy.setTimezone(this.timezone);
	    },
	    async fetchAvailableSlots() {
	      this.fetching = true;
	      if (!this.occupancy) {
	        this.initOccupancy();
	      }
	      try {
	        const resourcesIds = this.resources.map(resource => resource.id);
	        const response = await this.occupancy.getOccupancy(resourcesIds, this.date.getTime());
	        this.resourceOccupancy = response || [];
	        this.setResourcesSlots();
	      } catch (error) {
	        console.error('Booking.CrmForms. GetOccupancy for resources error', error);
	      } finally {
	        this.fetching = false;
	      }
	    },
	    setResourcesSlots() {
	      this.resourcesSlots = this.resources.map(resource => {
	        const resourceId = resource.id;
	        const resourceOccupancies = this.resourceOccupancy;
	        const slotsCreator = new SlotsCreator({
	          date: this.date,
	          slotRanges: resource.slotRanges,
	          resourceOccupancy: resourceOccupancies,
	          resourceId,
	          timezone: this.timezone
	        });
	        return {
	          resourceId,
	          resource,
	          slots: slotsCreator.calcResourceSlots()
	        };
	      }).sort((a, b) => b.slots.length - a.slots.length);
	    },
	    showMore() {
	      this.visibleResourcesCount += 3;
	    },
	    changeDate(resourceId) {
	      this.selectedResourceId = resourceId;
	      setTimeout(() => {
	        this.$emit('update:form', {
	          resourceId
	        });
	      }, DELAY);
	    },
	    selectSlot({
	      resource,
	      slot
	    }) {
	      this.selectedResourceId = resource.id;
	      setTimeout(() => {
	        this.$emit('update:form', {
	          resourceId: resource.id,
	          slot
	        });
	      }, DELAY);
	    }
	  },
	  template: `
		<div ref="resources" class="booking--crm-forms--field-group">
			<template v-show="!fetching">
				<ResourceSlotsUiBlock
					v-for="resource in visibleResources"
					:key="resource.resourceId"
					:date="date"
					:resource="resource.resource"
					:resourceSlots="resource.slots"
					:class="{
						'--fade': selectedResourceId !== null && selectedResourceId !== resource.resourceId,
					}"
					@select="selectSlot"
				>
					<template #changeDateBtn>
						<button
							type="button"
							class="booking--crm-forms--change-date-btn"
							@click="changeDate(resource.resourceId)"
						>
							{{ loc('BOOKING_CRM_FORMS_CHANGE_DATE_BUTTON_CAPTION') }}
						</button>
					</template>
				</ResourceSlotsUiBlock>
			</template>
			<template v-if="!fetching && visibleResources.length === 0">
				<p
					class="booking--crm-forms--available-slots-block__empty-slots"
					v-html="emptyResourcesSlotsMessage"
				></p>
			</template>
			<template v-if="resources.length > 0 && visibleResources.length > 0 && visibleResourcesCount < availableResource.length">
				<div class="booking--crm-forms--field-group--available-slots-block__footer">
					<button
						type="button"
						class="booking--crm-forms--change-date-btn booking--crm-forms--field-group--available-slots-block__btn-show-more"
						@click="showMore"
					>
						{{ loc('BOOKING_CRM_FORMS_SHOW_MORE_SLOTS') }}
					</button>
				</div>
			</template>
		</div>
	`
	};

	// @vue/component
	const Field = {
	  name: 'CrmFormBookingField',
	  components: {
	    AvailableSlotsBlock,
	    CalendarBlock,
	    ResourceSelectBlock,
	    SkuSelectBlock,
	    TimeSelectorBlock
	  },
	  mixins: [booking_component_mixin_locMixin.locMixin],
	  provide() {
	    return {
	      isPreview: this.isPreview
	    };
	  },
	  props: {
	    field: {
	      type: Object,
	      required: true
	    },
	    runAction: {
	      type: Function,
	      required: true
	    },
	    dependencies: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['change'],
	  data() {
	    return {
	      form: {
	        skuId: 0,
	        resourceId: 0,
	        date: null,
	        dateTs: 0,
	        slot: null
	      },
	      resources: [],
	      resourceIds: [],
	      resourcesWithSkus: [],
	      fetchingResources: false,
	      fetchingOccupancy: false,
	      fetchingAutoSelectionResource: false,
	      visibleCalendar: false,
	      occupancy: null
	    };
	  },
	  computed: {
	    timezone() {
	      return Intl.DateTimeFormat().resolvedOptions().timeZone;
	    },
	    isPreview() {
	      return this.$root.form.editMode || window.location.pathname.indexOf('/sites/site/') === 0;
	    },
	    isAutoSelectionOn() {
	      var _this$field, _this$field$options, _this$field$options$s;
	      return Boolean((_this$field = this.field) == null ? void 0 : (_this$field$options = _this$field.options) == null ? void 0 : (_this$field$options$s = _this$field$options.settingsData) == null ? void 0 : _this$field$options$s.isAutoSelectionOn);
	    },
	    settingsData() {
	      var _this$field2, _this$field2$options, _this$field3, _this$field3$options, _this$field3$options$, _this$field4, _this$field4$options, _this$field4$options$;
	      const defaultSettingsData = {
	        label: this.loc('BOOKING_CRM_FORMS_DEFAULT_RESOURCE_FIELD_LABEL'),
	        textHeader: this.loc('BOOKING_CRM_FORMS_DEFAULT_RESOURCE_FIELD_PLACEHOLDER'),
	        hint: this.loc('BOOKING_CRM_FORMS_DEFAULT_RESOURCE_FIELD_HINT'),
	        isVisibleHint: true,
	        skuLabel: this.loc('BOOKING_CRM_FORMS_DEFAULT_SKU_FIELD_LABEL'),
	        skuTextHeader: this.loc('BOOKING_CRM_FORMS_DEFAULT_SKU_FIELD_PLACEHOLDER')
	      };
	      if (this.isPreview && Array.isArray((_this$field2 = this.field) == null ? void 0 : (_this$field2$options = _this$field2.options) == null ? void 0 : _this$field2$options.settingsData)) {
	        return defaultSettingsData;
	      }
	      const result = this.isAutoSelectionOn ? (_this$field3 = this.field) == null ? void 0 : (_this$field3$options = _this$field3.options) == null ? void 0 : (_this$field3$options$ = _this$field3$options.settingsData) == null ? void 0 : _this$field3$options$.autoSelection : (_this$field4 = this.field) == null ? void 0 : (_this$field4$options = _this$field4.options) == null ? void 0 : (_this$field4$options$ = _this$field4$options.settingsData) == null ? void 0 : _this$field4$options$.default;
	      return main_core.Type.isObject(result) ? result : defaultSettingsData;
	    },
	    hasSlotsAllAvailableResources() {
	      var _this$settingsData;
	      return !this.isAutoSelectionOn && ((_this$settingsData = this.settingsData) == null ? void 0 : _this$settingsData.hasSlotsAllAvailableResources);
	    },
	    isFieldWithSkus() {
	      var _this$resourceSkuRela;
	      return ((_this$resourceSkuRela = this.resourceSkuRelations) == null ? void 0 : _this$resourceSkuRela.length) > 0;
	    },
	    hasSkuFieldInPreview() {
	      var _this$field5, _this$field5$options, _this$field5$options$, _this$field6, _this$field6$options, _this$field6$options$, _settingsData$resourc;
	      if (!this.isPreview) {
	        return false;
	      }
	      const settingsData = this.isAutoSelectionOn ? (_this$field5 = this.field) == null ? void 0 : (_this$field5$options = _this$field5.options) == null ? void 0 : (_this$field5$options$ = _this$field5$options.settingsData) == null ? void 0 : _this$field5$options$.autoSelection : (_this$field6 = this.field) == null ? void 0 : (_this$field6$options = _this$field6.options) == null ? void 0 : (_this$field6$options$ = _this$field6$options.settingsData) == null ? void 0 : _this$field6$options$.default;
	      return (settingsData == null ? void 0 : settingsData.skuLabel) || (settingsData == null ? void 0 : settingsData.skuTextHeader) || (settingsData == null ? void 0 : settingsData.skuHint) || (settingsData == null ? void 0 : settingsData.isVisibleSkuHint) || (settingsData == null ? void 0 : (_settingsData$resourc = settingsData.resources) == null ? void 0 : _settingsData$resourc.length) > 0;
	    },
	    fetching() {
	      return this.fetchingResources || this.fetchingOccupancy || this.fetchingAutoSelectionResource;
	    },
	    resource() {
	      if (!this.form.resourceId) {
	        return null;
	      }
	      return this.resources.find(resource => resource.id === this.form.resourceId) || null;
	    },
	    realResources() {
	      return this.hasSlotsAllAvailableResources ? this.resources.filter(({
	        id
	      }) => id !== AllResource.id) : this.resources;
	    },
	    value() {
	      if (!this.form.slot || !this.form.resourceId) {
	        return null;
	      }
	      let resources = [];
	      if (this.isFieldWithSkus) {
	        resources = [{
	          id: this.form.resourceId,
	          skus: [{
	            id: this.form.skuId
	          }]
	        }];
	      } else {
	        resources = [{
	          id: this.form.resourceId
	        }];
	      }
	      return {
	        resources,
	        dateFromTs: this.form.slot.fromTs / 1000,
	        dateToTs: this.form.slot.toTs / 1000,
	        timezone: this.timezone
	      };
	    },
	    resourceSkuRelations() {
	      var _this$settingsData2;
	      return ((_this$settingsData2 = this.settingsData) == null ? void 0 : _this$settingsData2.resources) || [];
	    },
	    errorMessage() {
	      return this.field.messages.get('fieldErrorRequired');
	    },
	    hasErrors() {
	      return this.field.validated && !this.field.focused && !this.field.valid();
	    },
	    hasTitleOnlyInCalendar() {
	      return this.form.date && !this.visibleCalendar && this.form.resourceId && this.isAutoSelectionOn;
	    },
	    showedCalendarBlock() {
	      return this.form.resourceId && !this.form.date || this.form.date !== null || this.visibleCalendar;
	    },
	    showedSlotsBlock() {
	      return !this.isPreview && this.hasSlotsAllAvailableResources && this.form.resourceId === AllResource.id && this.resources.length > 0 && this.form.date !== null;
	    },
	    showedTimeSelectorBlock() {
	      return !this.isPreview && this.form.resourceId > 0 && this.realResources.length > 0 && this.form.date !== null;
	    }
	  },
	  watch: {
	    '$root.form.sent': {
	      handler(next, prev) {
	        this.tryUnbindCompleteScreen();
	        if (next && !prev) {
	          main_core.Event.bind(window, 'click', this.subscribeCompleteScreen, true);
	        }
	      }
	    }
	  },
	  created() {
	    this.initField();
	  },
	  async mounted() {
	    if (!this.isPreview) {
	      await this.loadData();
	    }
	    main_core.Event.bind(window, 'click', this.handleFocus, true);
	  },
	  beforeUnmount() {
	    main_core.Event.unbind(window, 'click', this.handleFocus, true);
	  },
	  methods: {
	    initField() {
	      var _this$settingsData3;
	      this.resourceIds = ((_this$settingsData3 = this.settingsData) == null ? void 0 : _this$settingsData3.resourceIds) || [];
	      this.occupancyManager = createOccupancy(this.runAction);
	      this.occupancyManager.setTimezone(this.timezone);
	      this.form.skuId = 0;
	      this.form.resourceId = this.hasSlotsAllAvailableResources ? AllResource.id : 0;
	      this.form.date = new Date();
	      this.form.slot = null;
	    },
	    async loadData() {
	      if (this.isFieldWithSkus) {
	        await this.loadResourceSkuRelationsData();
	      } else {
	        await this.loadResourcesData();
	      }
	    },
	    async resetForm() {
	      this.initField();
	      this.field.validated = false;
	      this.occupancyManager.clearCache();
	      await this.loadData();
	    },
	    handleFocus({
	      target
	    }) {
	      this.field.focused = this.$el.contains(target);
	    },
	    onSelectorChange() {
	      this.updateValue();
	    },
	    updateValue() {
	      if (this.form.resourceId || this.form.slot) {
	        this.field.validated = false;
	      }
	      this.$emit('change', this.value);
	    },
	    async loadResourceSkuRelationsData() {
	      try {
	        this.fetchingResources = true;
	        const formData = mapResourcesToFormData(this.settingsData.resources || []);
	        const response = await this.runAction('booking.api_v1.CrmForm.PublicForm.getResourcesWithSkus', {
	          data: formData
	        });
	        this.resourcesWithSkus = (response == null ? void 0 : response.data) || [];
	      } catch (error) {
	        console.error('Load resource sku relations error', error);
	      } finally {
	        this.fetchingResources = false;
	      }
	    },
	    async loadResourcesData() {
	      const promises = [this.loadResources()];
	      if (this.isAutoSelectionOn) {
	        promises.push(this.fetchAutoSelectionData());
	      }
	      await Promise.all(promises);
	    },
	    async fetchAutoSelectionData() {
	      try {
	        this.fetchingAutoSelectionResource = true;
	        const formData = new FormData();
	        formData.append('timezone', this.timezone);
	        this.resourceIds.forEach(resourceId => {
	          formData.append('resourceIds[]', resourceId);
	        });
	        const response = await this.runAction('booking.api_v1.CrmForm.PublicForm.getAutoSelectionData', {
	          data: formData
	        });
	        if (main_core.Type.isPlainObject(response == null ? void 0 : response.data)) {
	          this.form.resourceId = response.data.resourceId || 0;
	          this.form.date = response.data.date ? new Date(response.data.date) : null;
	        }
	      } catch (error) {
	        console.error('RunAction getAutoSelectionData error', error);
	      } finally {
	        this.fetchingAutoSelectionResource = false;
	      }
	    },
	    async loadResources() {
	      try {
	        this.fetchingResources = true;
	        const response = await this.runAction('booking.api_v1.CrmForm.PublicForm.getResources', {
	          data: {
	            ids: this.resourceIds
	          }
	        });
	        this.setResources(mapDtoToResource(response.data || []));
	        if (this.occupancyManager instanceof Occupancy) {
	          this.occupancyManager.setResources(this.resources);
	        }
	      } catch (error) {
	        console.error('Load resource error', error);
	      } finally {
	        this.fetchingResources = false;
	      }
	    },
	    changeDate() {
	      if (this.isPreview) {
	        return;
	      }
	      this.visibleCalendar = true;
	    },
	    setResourceIdsBySkuId(skuId) {
	      const resourceIds = new Set();
	      for (const resource of this.resourcesWithSkus) {
	        if (resource.skus.some(({
	          id
	        }) => id === skuId)) {
	          resourceIds.add(resource.id);
	        }
	      }
	      this.resourceIds = [...resourceIds];
	    },
	    async setSku(skuId) {
	      this.form.skuId = skuId;
	      this.setResourceIdsBySkuId(skuId);
	      await this.loadResourcesData();
	    },
	    setResource(resourceId) {
	      this.form.resourceId = resourceId;
	      this.form.slot = null;
	    },
	    setResources(resources) {
	      const resourceIds = this.resourceIds || [];
	      const artificialResources = [];
	      if (this.hasSlotsAllAvailableResources) {
	        artificialResources.push({
	          ...AllResource,
	          name: this.loc('BOOKING_CRM_FORMS_ALL_RESOURCES_LABEL')
	        });
	      }
	      this.resources = [...artificialResources, ...resources.filter(({
	        id
	      }) => resourceIds.includes(id))];
	    },
	    setDate(date) {
	      this.form.date = date;
	      this.form.slot = null;
	    },
	    setSlot(selectedSlot) {
	      this.form.slot = selectedSlot;
	      this.updateValue();
	    },
	    updateForm(formPatch) {
	      this.form = {
	        ...this.form,
	        ...formPatch
	      };
	      this.updateValue();
	    },
	    subscribeCompleteScreen(e) {
	      if (e.target.tagName.toLowerCase() !== 'button') {
	        return;
	      }
	      this.resetForm();
	    },
	    tryUnbindCompleteScreen() {
	      main_core.Event.unbind(window, 'click', this.subscribeCompleteScreen, true);
	    }
	  },
	  template: `
		<div class="booking-crm-forms-field-container">
			<SkuSelectBlock
				v-if="hasSkuFieldInPreview || isFieldWithSkus"
				:skuId="form.skuId"
				:resourcesWithSkus="resourcesWithSkus"
				:settingsData="settingsData"
				:dependencies="dependencies"
				@update:skuId="setSku"
			/>
			<ResourceSelectBlock
				v-if="isPreview || (isFieldWithSkus && form.skuId > 0) || !isFieldWithSkus"
				:resourceId="form.resourceId"
				:resources="resources"
				:settingsData="settingsData"
				:errorMessage="errorMessage"
				:hasErrors="hasErrors && form.resourceId <= 0"
				:fetching="fetchingAutoSelectionResource || fetchingResources || fetchingOccupancy"
				:dependencies="dependencies"
				@update:resourceId="setResource"
			/>
			<template v-if="(isFieldWithSkus && form.skuId > 0) || !isFieldWithSkus">
				<CalendarBlock
					v-if="!isPreview && showedCalendarBlock"
					:resource="resource"
					:date="form.date"
					:titleOnly="hasTitleOnlyInCalendar"
					:hasError="hasErrors && form.slot === null"
					:errorMessage="errorMessage"
					@updateDate="setDate"
				/>
				<AvailableSlotsBlock
					v-if="showedSlotsBlock"
					:date="form.date"
					:resources="realResources"
					:runAction="runAction"
					:timezone="timezone"
					@update:form="updateForm"
				/>
				<TimeSelectorBlock
					v-if="showedTimeSelectorBlock"
					:slot="form.slot"
					:resource="resource"
					:resources="realResources"
					:date="form.date"
					:runAction="runAction"
					:fetching="fetchingOccupancy"
					:timezone="timezone"
					:showChangeDateButton="hasTitleOnlyInCalendar"
					@update:fetching="fetchingOccupancy = $event"
					@update:slot="setSlot"
					@showCalendar="visibleCalendar = true"
				/>
			</template>
		</div>
	`
	};

	exports.Field = Field;

}((this.BX.Booking.CrmForms = this.BX.Booking.CrmForms || {}),BX.Booking.Const,BX.Booking.Lib,BX,BX.UI.DatePicker,BX.Booking.Lib,BX.Main,BX,BX.Booking.Component.Mixin));
//# sourceMappingURL=field.bundle.js.map
