/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports,ui_vue3,booking_component_mixin_locMixin,booking_model_resources,booking_model_resourceTypes,booking_model_skuResourcesEditor,booking_component_uiTabs,booking_lib_currencyFormat,booking_component_avatar,booking_lib_sidePanelInstance,booking_provider_service_catalogServiceSkuService,main_core,booking_core,booking_lib_deepToRaw,booking_provider_service_resourceDialogService,ui_vue3_components_counter,ui_cnt,booking_component_button,main_core_events,ui_entitySelector,ui_vue3_vuex,ui_iconSet_api_vue,booking_const) {
	'use strict';

	// @vue/component
	const SkuResourcesEditorLayout = {
	  name: 'SkuResourcesEditorLayout',
	  template: `
		<div class="booking-sre-app__layout">
			<div class="booking-sre-app__wrapper">
				<slot name="header"/>
				<div class="booking-sre-app__content">
					<slot/>
				</div>
			</div>
			<slot name="footer"/>
		</div>
	`
	};

	// @vue/component
	const SaveButton = {
	  name: 'SaveButton',
	  components: {
	    UiButton: booking_component_button.Button
	  },
	  emits: ['click'],
	  setup() {
	    return {
	      ButtonSize: booking_component_button.ButtonSize,
	      ButtonColor: booking_component_button.ButtonColor
	    };
	  },
	  template: `
		<UiButton
			:text="loc('BOOKING_SRE_APP_SAVE_BUTTON')"
			:size="ButtonSize.LARGE"
			:color="ButtonColor.PRIMARY"
			noCaps
			useAirDesign
			@click="$emit('click')"
		/>
	`
	};

	// @vue/component
	const CancelButton = {
	  name: 'CancelButton',
	  components: {
	    UiButton: booking_component_button.Button
	  },
	  emits: ['click'],
	  setup() {
	    return {
	      ButtonSize: booking_component_button.ButtonSize,
	      ButtonColor: booking_component_button.ButtonColor
	    };
	  },
	  template: `
		<UiButton
			class="booking-sre-app__cancel-button"
			:text="loc('BOOKING_SRE_APP_CANCEL_BUTTON')"
			:size="ButtonSize.LARGE"
			:color="ButtonColor.LINK"
			noCaps
			@click="$emit('click')"
		/>
	`
	};

	// @vue/component
	const SkuResourcesEditorFooter = {
	  name: 'SkuResourcesEditorFooter',
	  components: {
	    SaveButton,
	    CancelButton
	  },
	  props: {
	    /** @type { SkuResourcesEditorParams } */
	    params: {
	      type: Object,
	      required: true
	    }
	  },
	  computed: {
	    skusResourcesEditorOptions() {
	      return this.$store.state[booking_const.Model.SkuResourcesEditor].options;
	    }
	  },
	  methods: {
	    closeEditor() {
	      main_core_events.EventEmitter.emit(booking_const.EventName.CloseSkuResourcesEditor);
	    },
	    async save() {
	      if (main_core.Type.isFunction(this.params.save)) {
	        if (!this.skusResourcesEditorOptions.canBeEmpty && (await this.validate()).invalid) {
	          return;
	        }
	        this.params.save({
	          resources: this.getResources()
	        });
	      }
	      this.closeEditor();
	    },
	    async validate() {
	      await this.$store.dispatch(`${booking_const.Model.SkuResourcesEditor}/updateInvalid`, {
	        invalidSku: false,
	        invalidResource: false
	      });
	      const hasInvalidResources = this.isResourcesValid();
	      const hasInvalidSkus = this.isSkusValid();
	      await this.$store.dispatch(`${booking_const.Model.SkuResourcesEditor}/updateInvalid`, {
	        invalidSku: hasInvalidSkus,
	        invalidResource: hasInvalidResources
	      });
	      await this.changeTab({
	        hasInvalidSkus,
	        hasInvalidResources
	      });
	      return {
	        invalid: hasInvalidResources || hasInvalidSkus
	      };
	    },
	    isResourcesValid() {
	      const skusSets = this.$store.state[booking_const.Model.SkuResourcesEditor].resourcesSkusMap.values();
	      for (const skusSet of skusSets) {
	        if (!(skusSet instanceof Set) || skusSet.size === 0) {
	          return true;
	        }
	      }
	      return false;
	    },
	    isSkusValid() {
	      const resourcesSets = this.$store.getters[`${booking_const.Model.SkuResourcesEditor}/skusResourcesMap`].values();
	      for (const resourcesSet of resourcesSets) {
	        if (!(resourcesSet instanceof Set) || resourcesSet.size === 0) {
	          return true;
	        }
	      }
	      return false;
	    },
	    async changeTab({
	      hasInvalidSkus = false,
	      hasInvalidResources = false
	    }) {
	      const activeTab = this.$store.state[booking_const.Model.SkuResourcesEditor].tab;
	      if (activeTab === booking_const.SkuResourcesEditorTab.Skus && hasInvalidResources && !hasInvalidSkus) {
	        await this.$store.dispatch(`${booking_const.Model.SkuResourcesEditor}/updateTab`, booking_const.SkuResourcesEditorTab.Resources);
	      } else if (activeTab === booking_const.SkuResourcesEditorTab.Resources && hasInvalidSkus && !hasInvalidResources) {
	        await this.$store.dispatch(`${booking_const.Model.SkuResourcesEditor}/updateTab`, booking_const.SkuResourcesEditorTab.Skus);
	      }
	    },
	    getResources() {
	      const resourcesSkusMap = this.$store.state[booking_const.Model.SkuResourcesEditor].resourcesSkusMap;
	      const resourcesMap = this.$store.state[booking_const.Model.SkuResourcesEditor].resources;
	      const skusMap = this.$store.state[booking_const.Model.SkuResourcesEditor].skus;
	      const resources = [];
	      for (const [resourceId, skusSet] of resourcesSkusMap) {
	        if (!resourcesMap.has(resourceId) || skusSet.size === 0 && !this.skusResourcesEditorOptions.canBeEmpty) {
	          continue;
	        }
	        const skus = [];
	        for (const skuId of skusSet) {
	          if (!skusMap.has(skuId)) {
	            continue;
	          }
	          skus.push(booking_lib_deepToRaw.deepToRaw(skusMap.get(skuId)));
	        }
	        const resource = booking_lib_deepToRaw.deepToRaw(resourcesMap.get(resourceId));
	        resource.skus = skus;
	        resources.push(resource);
	      }
	      return resources;
	    }
	  },
	  template: `
		<div class="booking-sre-app__footer">
			<SaveButton @click="save"/>
			<CancelButton @click="closeEditor"/>
		</div>
	`
	};

	// @vue/component
	const SkuResourcesEditorHeader = {
	  name: 'SkuResourcesEditorHeader',
	  props: {
	    title: {
	      type: String,
	      required: true
	    }
	  },
	  template: `
		<div class="booking-sre-app__header">
			{{ title }}
		</div>
	`
	};

	// @vue/component
	const SearchInput = {
	  name: 'SearchInput',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  props: {
	    modelValue: {
	      type: String,
	      default: ''
	    },
	    placeholderText: {
	      type: String,
	      default: ''
	    }
	  },
	  emits: ['update:modelValue'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  data() {
	    return {
	      searchDebounced: main_core.Runtime.debounce(this.search, 200, this)
	    };
	  },
	  methods: {
	    inputQuery(event) {
	      const query = event.target.value;
	      if (main_core.Type.isStringFilled(query)) {
	        this.searchDebounced(query);
	      } else {
	        this.search(query);
	      }
	    },
	    search(query) {
	      if (this.modelValue !== query) {
	        this.$emit('update:modelValue', query);
	      }
	    }
	  },
	  template: `
		<div class="booking-services-settings-popup__search-input_wrapper">
			<BIcon :name="Outline.SEARCH" :size="20" color="rgba(168, 173, 180, 1)"/>
			<input
				:value="modelValue"
				type="text"
				id="booking-services-settings-popup__search-input"
				class="booking-services-settings-popup__search-input"
				data-id="booking-services-settings-popup__search-input"
				:placeholder="placeholderText"
				@input="inputQuery"
			/>
		</div>
	`
	};

	// @vue/component
	const BaseItem = {
	  name: 'BaseItem',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    UiAvatar: booking_component_avatar.Avatar
	  },
	  props: {
	    selected: {
	      type: Boolean,
	      default: false
	    },
	    label: {
	      type: String,
	      required: true
	    },
	    name: {
	      type: String,
	      required: true
	    },
	    hasAvatar: {
	      type: Boolean,
	      default: false
	    },
	    avatar: {
	      type: String,
	      default: ''
	    },
	    invalid: {
	      type: Boolean,
	      default: false
	    },
	    invalidMessage: {
	      type: String,
	      default: ''
	    },
	    dataId: {
	      type: [String, Number],
	      default: ''
	    }
	  },
	  emits: ['update:selected', 'remove'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  computed: {
	    isChecked: {
	      get() {
	        return this.selected;
	      },
	      set(checked) {
	        this.$emit('update:selected', checked);
	      }
	    },
	    skusResourcesEditorOptions() {
	      return this.$store.state[booking_const.Model.SkuResourcesEditor].options;
	    }
	  },
	  template: `
		<div class="booking-services-settings-popup__base-item">
			<div class="booking-services-settings-popup__base-item__header">
				<div class="ui-form-row-inline">
					<label class="ui-ctl ui-ctl-checkbox">
						<input
							v-model="isChecked"
							:id="'booking-services-settings-checkbox' + dataId"
							:data-id="'booking-services-settings-checkbox' + dataId"
							type="checkbox"
							class="ui-ctl-element ui-ctl-checkbox booking-services-settings-popup__base-item__checkbox"
						/>
					</label>
				</div>
				<UiAvatar
					v-if="hasAvatar"
					:size="32"
					:userName="name"
					:userpicPath="avatar"
					baseColor="#B15EF5"
					class="booking-services-settings-popup__base-item__avatar"
				/>
				<h6 class="booking-services-settings-popup__base-item__title">{{ name }}</h6>
				<slot name="header"/>
				<BIcon
					v-if="skusResourcesEditorOptions.editMode"
					class="booking-sre-app__base-item__close-icon"
					:name="Outline.CROSS_L"
					:size="18"
					color="var(--ui-color-text-secondary)"
					@click="$emit('remove')"
				/>
			</div>
			<div class="booking-services-settings-popup__base-item__content" :class="{ '--invalid': invalid }">
				<label class="booking-services-settings-popup__base-item__text-on-frame booking-services-settings-popup__base-item__label">
					{{ label }}
				</label>
				<slot/>
				<span
					v-if="invalid"
					class="booking-services-settings-popup__base-item__text-on-frame booking-services-settings-popup__base-item__error-msg"
				>
					{{ invalidMessage }}
				</span>
			</div>
		</div>
	`
	};

	// @vue/component
	const SkusResourceSelector = {
	  name: 'SkusResourceSelector',
	  props: {
	    skuId: {
	      type: Number,
	      required: true
	    },
	    /**
	     * @type {number[]}
	     */
	    resourcesIds: {
	      type: Array,
	      required: true
	    }
	  },
	  emits: ['add', 'remove'],
	  computed: {
	    resourcesList() {
	      return this.$store.getters[`${booking_const.Model.SkuResourcesEditor}/resources`];
	    }
	  },
	  watch: {
	    resourcesIds(resourcesIds) {
	      this.updateSelectedItems(resourcesIds);
	    }
	  },
	  mounted() {
	    this.selector = this.createSelector();
	    this.mountSelector();
	  },
	  beforeUnmount() {
	    this.destroySelector();
	  },
	  methods: {
	    createSelector() {
	      const dialogOptions = {
	        context: 'bookingSkusResources',
	        width: 290,
	        height: 340,
	        dropdownMode: true,
	        compactView: true,
	        enableSearch: true,
	        cacheable: true,
	        showAvatars: true,
	        popupOptions: {
	          targetContainer: this.$root.$el.querySelector('.booking-sre-app__wrapper')
	        },
	        searchOptions: {
	          allowCreateItem: false
	        },
	        items: this.resourcesList.map(resource => {
	          var _resource$avatar;
	          return {
	            id: resource.id,
	            entityId: booking_const.EntitySelectorEntity.Resource,
	            tabs: booking_const.EntitySelectorEntity.Resource,
	            title: resource.name,
	            avatar: ((_resource$avatar = resource.avatar) == null ? void 0 : _resource$avatar.url) || '/bitrix/js/booking/application/sku-resources-editor/images/resource-icon.svg',
	            selected: this.resourcesIds.includes(resource.id)
	          };
	        }),
	        tabs: [{
	          id: booking_const.EntitySelectorEntity.Resource
	        }],
	        entities: [{
	          id: booking_const.EntitySelectorEntity.Resource,
	          dynamicLoad: false,
	          dynamicSearch: false
	        }],
	        preselectedItems: this.resourcesIds.map(id => [booking_const.EntitySelectorEntity.Resource, id]),
	        events: {
	          'Item:onSelect': event => {
	            this.select(event.getData().item.id);
	          },
	          'Item:onDeselect': event => {
	            this.deselect(event.getData().item.id);
	          }
	        }
	      };
	      const tagSelectionOptions = {
	        multiple: true,
	        textBoxWidth: 600,
	        showAddButton: true,
	        showCreateButton: false,
	        tagClickable: false,
	        showTextBox: false,
	        dialogOptions
	      };
	      return new ui_entitySelector.TagSelector(tagSelectionOptions);
	    },
	    mountSelector() {
	      this.selector.renderTo(this.$refs.resourcesSelector);
	      if (this.disabled) {
	        this.selector.setLocked(this.disabled);
	      }
	    },
	    destroySelector() {
	      this.selector.getDialog().destroy();
	      this.selector = null;
	      this.$refs.resourcesSelector.innerHTML = '';
	    },
	    select(resourceId) {
	      this.$emit('add', {
	        skuId: this.skuId,
	        resourceId
	      });
	    },
	    deselect(resourceId) {
	      this.$emit('remove', {
	        skuId: this.skuId,
	        resourceId
	      });
	    },
	    updateSelectedItems(resourcesIds) {
	      const items = this.selector.getDialog().getItems();
	      const selectedItemsIds = new Set(this.selector.getDialog().getSelectedItems().map(item => item.getId()));
	      for (const resourceId of resourcesIds) {
	        if (!selectedItemsIds.has(resourceId)) {
	          const selectorItem = items.find(item => item.getId() === resourceId);
	          if (selectorItem) {
	            selectorItem.select();
	          }
	        }
	      }
	    }
	  },
	  template: `
		<div
			ref="resourcesSelector"
			class="booking-sre-app--skus-view--resource-selector"
		></div>
	`
	};

	// @vue/component
	const SkusItem = {
	  name: 'SkusItem',
	  components: {
	    BaseItem,
	    SkusResourceSelector
	  },
	  props: {
	    /** @type{SkuInfo} */
	    sku: {
	      type: Object,
	      required: true
	    },
	    selected: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['update:selected', 'afterRemove', 'addResource', 'removeResource'],
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      getResourcesByIds: `${booking_const.Model.SkuResourcesEditor}/getResourcesByIds`,
	      skusResourcesMap: `${booking_const.Model.SkuResourcesEditor}/skusResourcesMap`
	    }),
	    resourcesIds() {
	      return [...(this.skusResourcesMap.get(this.sku.id) || [])];
	    },
	    price() {
	      return booking_lib_currencyFormat.currencyFormat.format(this.sku.currencyId, this.sku.price);
	    },
	    invalid() {
	      return this.$store.state[booking_const.Model.SkuResourcesEditor].invalidSku && this.resourcesIds.length === 0;
	    }
	  },
	  watch: {
	    invalid: {
	      handler(invalid) {
	        if (invalid) {
	          this.scrollToInvalid();
	        }
	      },
	      immediate: true
	    }
	  },
	  methods: {
	    scrollToInvalid() {
	      void this.$nextTick(() => {
	        var _this$$refs$sku, _this$$refs$sku$$el;
	        (_this$$refs$sku = this.$refs.sku) == null ? void 0 : (_this$$refs$sku$$el = _this$$refs$sku.$el) == null ? void 0 : _this$$refs$sku$$el.scrollIntoView(true, {
	          behavior: 'smooth',
	          block: 'center'
	        });
	      });
	    },
	    removeSku(skuId) {
	      void this.$store.dispatch(`${booking_const.Model.SkuResourcesEditor}/deleteSkuFromResources`, {
	        resourceIds: this.resourcesIds,
	        skuId
	      });
	      void this.$store.dispatch(`${booking_const.Model.SkuResourcesEditor}/deleteSku`, skuId);
	      this.$emit('afterRemove', skuId);
	    },
	    addResource({
	      resourceId,
	      skuId
	    }) {
	      void this.$store.dispatch(`${booking_const.Model.SkuResourcesEditor}/addSkuToResource`, {
	        resourceId,
	        sku: {
	          id: skuId,
	          name: this.sku.name
	        }
	      });
	    },
	    removeResource({
	      resourceId,
	      skuId
	    }) {
	      void this.$store.dispatch(`${booking_const.Model.SkuResourcesEditor}/deleteSkuFromResource`, {
	        resourceId,
	        skuId
	      });
	    }
	  },
	  template: `
		<BaseItem
			ref="sku"
			:selected
			:name="sku.name"
			:label="loc('BOOKING_SRE_SKU_RESOURCES_LABEL')"
			:dataId="sku.id"
			:invalid
			:invalidMessage="loc('BOOKING_SRE_RESOURCES_FOR_SKU_NOT_SELECTED')"
			@update:selected="$emit('update:selected', sku.id)"
			@remove="removeSku(sku.id)"
		>
			<template #header>
				<span class="booking-sre-app--sku-item--price" v-html="price"></span>
			</template>
			<SkusResourceSelector
				:skuId="sku.id"
				:resourcesIds="resourcesIds"
				@add="addResource"
				@remove="removeResource"
			/>
		</BaseItem>
	`
	};

	function getServicesCollection(resources) {
	  const skusMap = new Map();
	  for (const resource of resources) {
	    const skus = resource.skus;
	    for (const sku of skus) {
	      if (skusMap.has(sku.id)) {
	        const service = skusMap.get(sku.id);
	        service.resources.push(resource);
	      } else {
	        skusMap.set(sku.id, {
	          id: sku.id,
	          name: sku.name,
	          price: sku.price,
	          currencyId: sku.currencyId,
	          resources: [resource]
	        });
	      }
	    }
	  }
	  return [...skusMap.values()];
	}

	async function fetchResourcesBySkuIds(skus) {
	  const addSkusIds = new Set(skus.map(sku => sku.id));
	  const loadedSkus = (await loadResourcesBySkuIds(skus.map(sku => sku.id))).filter(sku => addSkusIds.has(sku.id));
	  const loadedSKusIds = new Set(loadedSkus.map(sku => sku.id));
	  await booking_core.Core.getStore().dispatch(`${booking_const.Model.SkuResourcesEditor}/addSkus`, [...loadedSkus, ...skus.filter(sku => !loadedSKusIds.has(sku.id))]);
	}
	async function loadResourcesBySkuIds(skuIds) {
	  const $store = booking_core.Core.getStore();
	  try {
	    await booking_provider_service_resourceDialogService.resourceDialogService.loadBySkuIds(skuIds, Math.round(Date.now() / 1000));
	    const resources = booking_lib_deepToRaw.deepToRaw($store.getters[`${booking_const.Model.Resources}/getBySkuIds`](skuIds));
	    await $store.dispatch(`${booking_const.Model.SkuResourcesEditor}/addResources`, resources);
	    return getServicesCollection(resources);
	  } catch (error) {
	    console.error('SkuResourcesEditor. Fetch resource error', error);
	    return [];
	  }
	}

	// @vue/component
	const SkusSelector = {
	  name: 'SkusSelector',
	  props: {
	    targetNode: {
	      type: HTMLElement,
	      required: true
	    },
	    skus: {
	      type: Array,
	      default: () => []
	    }
	  },
	  emits: ['close'],
	  data() {
	    return {
	      selected: []
	    };
	  },
	  computed: {
	    skusIds() {
	      return this.skus.map(({
	        id
	      }) => id);
	    },
	    catalogSkuEntityOptions() {
	      return this.$store.state[booking_const.Model.SkuResourcesEditor].options.catalogSkuEntityOptions;
	    }
	  },
	  created() {
	    this.dialog = this.createDialog();
	  },
	  mounted() {
	    this.dialog.show();
	  },
	  unmounted() {
	    var _this$dialog;
	    (_this$dialog = this.dialog) == null ? void 0 : _this$dialog.destroy();
	  },
	  methods: {
	    createDialog() {
	      return new ui_entitySelector.Dialog({
	        targetNode: this.targetNode,
	        context: 'bookingSkusSelector',
	        width: 290,
	        height: 450,
	        dropdownMode: true,
	        compactView: true,
	        enableSearch: true,
	        cacheable: true,
	        showAvatars: false,
	        multiple: false,
	        popupOptions: {
	          targetContainer: this.$root.$el.querySelector('.booking-sre-app__wrapper')
	        },
	        tagSelectorOptions: {
	          textBoxWidth: '100%'
	        },
	        searchOptions: {
	          allowCreateItem: true
	        },
	        entities: [{
	          id: booking_const.EntitySelectorEntity.Product,
	          dynamicLoad: true,
	          dynamicSearch: true,
	          options: this.catalogSkuEntityOptions
	        }],
	        undeselectedItems: this.skusIds.map(skuId => [booking_const.EntitySelectorEntity.Product, skuId]),
	        events: {
	          'Item:onSelect': event => {
	            this.select(event.getData().item);
	          },
	          'Item:onDeselect': event => {
	            this.deselected(event.getData().item.id);
	          },
	          'Search:onItemCreateAsync': event => {
	            return this.createService(event);
	          },
	          onLoad: event => {
	            var _event$getTarget;
	            this.removeSelected(((_event$getTarget = event.getTarget()) == null ? void 0 : _event$getTarget.getItems()) || []);
	          },
	          'SearchTab:onLoad': () => {
	            this.removeSelected(this.dialog.getItems());
	          },
	          onHide: () => this.beforeHide()
	        }
	      });
	    },
	    removeSelected(items) {
	      for (const item of items) {
	        if (this.skusIds.includes(item.getId())) {
	          item.setHidden(true);
	        }
	      }
	    },
	    select(item) {
	      if (this.selected.every(({
	        id
	      }) => id !== item.id)) {
	        const price = item.getCustomData().get('RAW_PRICE') || {
	          VALUE: 0,
	          CURRENCY: null
	        };
	        this.selected.push({
	          id: item.id,
	          name: item.title.text,
	          price: price.VALUE,
	          currencyId: price.CURRENCY,
	          resources: []
	        });
	      }
	    },
	    deselected(item) {
	      const itemId = item.id;
	      this.selected = this.selected.filter(({
	        id
	      }) => id !== itemId);
	    },
	    async createService(event) {
	      var _this$catalogSkuEntit;
	      const serviceName = event.getData().searchQuery.getQuery();
	      const iblockId = (_this$catalogSkuEntit = this.catalogSkuEntityOptions) == null ? void 0 : _this$catalogSkuEntit.iblockId;
	      const serviceId = await booking_provider_service_catalogServiceSkuService.catalogServiceSkuService.create(iblockId, serviceName);
	      const dialog = event.getTarget();
	      if (!main_core.Type.isNumber(serviceId)) {
	        return;
	      }
	      const blockId = this.catalogSkuEntityOptions.iblockId;
	      const url = new main_core.Uri(`/crm/catalog/${blockId}/product/${serviceId}/`).toString();
	      const item = dialog.addItem({
	        id: serviceId,
	        entityId: booking_const.EntitySelectorEntity.Product,
	        title: serviceName,
	        tabs: dialog.getRecentTab().getId(),
	        sort: 2,
	        link: url
	      });
	      if (item) {
	        item.select();
	        booking_lib_sidePanelInstance.SidePanelInstance.open(url);
	      }
	      dialog.hide();
	    },
	    async beforeHide() {
	      await this.addSku();
	      this.$emit('close');
	    },
	    async addSku() {
	      const sku = this.selected[0];
	      if (main_core.Type.isNil(sku == null ? void 0 : sku.id)) {
	        return;
	      }
	      await fetchResourcesBySkuIds([sku]);
	      const skusInfo = this.$store.getters[`${booking_const.Model.SkuResourcesEditor}/getSkusByIds`]([sku.id]);
	      const skuInfo = skusInfo[0];
	      if (main_core.Type.isNil(skuInfo)) {
	        return;
	      }
	      const skuIds = skusInfo.map(item => item.id);
	      skuInfo.resources.forEach(resource => {
	        this.$store.commit(`${booking_const.Model.SkuResourcesEditor}/addResourceSkus`, {
	          resourceId: resource.id,
	          skus: skuIds
	        });
	      });
	    }
	  },
	  template: '<div hidden="hidden"></div>'
	};

	// @vue/component
	const EmptyState = {
	  name: 'EmptyState',
	  components: {
	    SkusSelector,
	    UiButton: booking_component_button.Button
	  },
	  props: {
	    skuTitle: {
	      type: String,
	      default: null
	    }
	  },
	  setup() {
	    return {
	      AirButtonStyle: booking_component_button.AirButtonStyle,
	      ButtonSize: booking_component_button.ButtonSize
	    };
	  },
	  data() {
	    return {
	      shown: false
	    };
	  },
	  computed: {
	    buttonTitle() {
	      return this.loc('BOOKING_SERVICES_SETTINGS_EMPTY_STATE_ADD_BUTTON');
	    },
	    title() {
	      return this.skuTitle ? this.loc('BOOKING_SERVICES_SETTINGS_EMPTY_STATE_SEARCH_TITLE') : this.loc('BOOKING_SERVICES_SETTINGS_EMPTY_STATE_TITLE');
	    },
	    description() {
	      return this.skuTitle ? this.loc('BOOKING_SERVICES_SETTINGS_EMPTY_STATE_SEARCH_DESCRIPTION', {
	        '#SEARCH_TEXT#': this.skuTitle
	      }) : this.loc('BOOKING_SERVICES_SETTINGS_EMPTY_STATE_DESCRIPTION');
	    }
	  },
	  methods: {
	    toggleShown() {
	      this.shown = !this.shown;
	    }
	  },
	  template: `
		<div class="booking-sre-app--skus-view_empty-state">
			<div class="booking-sre-app--skus-view_empty-state-icon"></div>
			<div class="booking-sre-app--skus-view_empty-state-title">
				{{ title }}
			</div>
			<div class="booking-sre-app--skus-view_empty-state-description">
				{{ description }}
			</div>
			<div class="booking-sre-app--skus-view_empty-state-button">
				<UiButton
					ref="btn"
					:text="buttonTitle"
					:size="ButtonSize.SMALL"
					:style="AirButtonStyle.TINTED"
					icon="ui-btn-icon-add"
					iconPosition="left"
					noCaps
					useAirDesign
					@click="toggleShown"
				/>
				<SkusSelector
					v-if="shown"
					:targetNode="$refs.btn.$el"
					@close="shown = false"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const SkusBar = {
	  name: 'SkusBar',
	  components: {
	    BCounter: ui_vue3_components_counter.Counter
	  },
	  props: {
	    checked: {
	      type: Boolean,
	      default: false
	    },
	    servicesCount: {
	      type: Number,
	      default: 0
	    }
	  },
	  emits: ['update:checked'],
	  setup() {
	    return {
	      CounterStyle: ui_cnt.CounterStyle
	    };
	  },
	  template: `
		<div class="booking-sre-app--services-bar">
			<div class="ui-form-row-inline">
				<label class="ui-ctl ui-ctl-checkbox">
					<input
						:checked="checked"
						data-id="booking-sre-app--services-bar__select-all"
						type="checkbox"
						class="ui-ctl-element ui-ctl-checkbox"
						@change="$emit('update:checked')"
					/>
					<span class="booking-sre-app--services-bar__label">
						{{ loc('BOOKING_SRE_ALL_SERVICES_LABEL') }}
					</span>
				</label>
			</div>
			<BCounter
				:value="servicesCount"
				:maxValue="Infinity"
				:style="CounterStyle.FILLED_NO_ACCENT"
			/>
			<div class="booking-sre-app--services-bar__grow"></div>
			<slot name="button"></slot>
		</div>
	`
	};

	// @vue/component
	const AddSkusButton = {
	  name: 'AddServiceButton',
	  components: {
	    SkusSelector,
	    UiButton: booking_component_button.Button
	  },
	  props: {
	    skus: {
	      type: Array,
	      default: () => []
	    }
	  },
	  setup() {
	    return {
	      AirButtonStyle: booking_component_button.AirButtonStyle,
	      ButtonSize: booking_component_button.ButtonSize
	    };
	  },
	  data() {
	    return {
	      shownPopup: false
	    };
	  },
	  methods: {
	    togglePopup() {
	      this.shownPopup = !this.shownPopup;
	    }
	  },
	  template: `
		<div>
			<UiButton
				ref="btn"
				:text="loc('BOOKING_SRE_ADD_SKU_BUTTON')"
				:style="AirButtonStyle.OUTLINE"
				:size="ButtonSize.SMALL"
				noCaps
				useAirDesign
				@click="togglePopup"
			/>
			<SkusSelector
				v-if="shownPopup"
				:targetNode="$refs.btn.$el"
				:skus
				@close="shownPopup = false"
			/>
		</div>
	`
	};

	// @vue/component
	const BaseGroupActionBar = {
	  name: 'BaseGroupActionBar',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  props: {
	    count: {
	      type: Number,
	      required: true
	    }
	  },
	  emits: ['close'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  computed: {
	    title() {
	      return this.loc('BOOKING_SRE_GROUP_ACTION_BAR_TITLE', {
	        '#COUNT#': this.count
	      });
	    }
	  },
	  template: `
		<div class="booking-sku-resources-editor__base-group-action-bar">
			<div class="booking-sku-resources-editor__base-group-action-bar__title_wrapper">
				<span class="booking-sku-resources-editor__base-group-action-bar__title">{{ title }}</span>
				<BIcon
					class="booking-sku-resources-editor__base-group-action-bar__close-icon"
					:name="Outline.CROSS_L"
					:size="16"
					color="rgba(var(--ui-color-on-primary-rgb), 0.8)"
					@click="$emit('close')"
				/>
				<div class="booking-sku-resources-editor__divider-vertical"></div>
			</div>
			<slot/>
		</div>
	`
	};

	let dialog = null;

	// @vue/component
	const AddResourcesButton = {
	  name: 'AddResourcesButton',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  props: {
	    skus: {
	      type: Array,
	      default: () => []
	    }
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  data() {
	    return {
	      shown: false,
	      resourceIds: new Set()
	    };
	  },
	  computed: {
	    resourcesList() {
	      return this.$store.getters[`${booking_const.Model.SkuResourcesEditor}/resources`];
	    }
	  },
	  watch: {
	    shown(shown) {
	      if (shown) {
	        this.getDialog().show();
	      } else {
	        this.getDialog().hide();
	      }
	    }
	  },
	  unmounted() {
	    var _dialog;
	    (_dialog = dialog) == null ? void 0 : _dialog.destroy();
	    dialog = undefined;
	  },
	  methods: {
	    toggleDialog() {
	      this.shown = !this.shown;
	    },
	    getDialog() {
	      if (dialog instanceof ui_entitySelector.Dialog) {
	        return dialog;
	      }
	      dialog = new ui_entitySelector.Dialog({
	        id: 'booking-sre-app__add-resource-dialog',
	        targetNode: this.$refs.button,
	        width: 400,
	        enableSearch: true,
	        dropdownMode: true,
	        context: 'crmFormsBookingResourcesSelector',
	        multiple: true,
	        cacheable: true,
	        showAvatars: true,
	        entities: [{
	          id: booking_const.EntitySelectorEntity.Resource,
	          dynamicLoad: false,
	          dynamicSearch: false
	        }],
	        items: this.resourcesList.map(resource => {
	          var _resource$avatar;
	          return {
	            id: resource.id,
	            entityId: booking_const.EntitySelectorEntity.Resource,
	            tabs: booking_const.EntitySelectorEntity.Resource,
	            title: resource.name,
	            avatar: ((_resource$avatar = resource.avatar) == null ? void 0 : _resource$avatar.url) || '/bitrix/js/booking/application/sku-resources-editor/images/resource-icon.svg',
	            customData: resource
	          };
	        }),
	        tabs: [{
	          id: booking_const.EntitySelectorEntity.Resource,
	          stub: false
	        }],
	        searchOptions: {
	          allowCreateItem: false
	        },
	        events: {
	          onHide: () => {
	            this.shown = false;
	            this.updateSkusResources();
	          },
	          'Item:onSelect': event => {
	            this.resourceIds.add(event.getData().item.id);
	          },
	          'Item:onDeselect': event => {
	            this.resourceIds.delete(event.getData().item.id);
	          }
	        }
	      });
	      return dialog;
	    },
	    updateSkusResources() {
	      void this.$store.dispatch(`${booking_const.Model.SkuResourcesEditor}/addSkusToResources`, {
	        resourcesIds: [...this.resourceIds],
	        skus: this.skus.map(sku => {
	          return {
	            id: sku.id,
	            name: sku.name,
	            permissions: sku.permissions
	          };
	        })
	      });
	    }
	  },
	  template: `
		<div
			ref="button"
			class="booking-sre-app--add-resources-button"
			tabindex="0"
			role="button"
			@click="toggleDialog"
		>
			<BIcon :size="20" :name="Outline.SERVICES" color="rgb(var(--ui-color-on-primary-rgb))"/>
			<span class="booking-sre-app--add-resources-button__label">
				{{ loc('BOOKING_SRE_GROUP_ACTION_BAR_ADD_RESOURCES') }}
			</span>
		</div>
	`
	};

	// @vue/component
	const SkusGroupActionBar = {
	  name: 'SkusGroupActionBar',
	  components: {
	    AddResourcesButton,
	    BaseGroupActionBar
	  },
	  props: {
	    skus: {
	      type: Array,
	      default: () => []
	    }
	  },
	  emits: ['close'],
	  template: `
		<BaseGroupActionBar :count="skus.length" @close="$emit('close')">
			<AddResourcesButton :skus/>
		</BaseGroupActionBar>
	`
	};

	const BaseItemSkeleton = {
	  name: 'BaseItemSkeleton',
	  template: `
		<div class="booking-services-settings-popup__base-item">
			<div class="booking-sre__base-item__skeleton--row booking-sre__base-item__skeleton--header">
				<div
					class="booking-sre__base-item__skeleton--row"
					style="gap: 7px"
				>
					<div
						class="booking-sre__base-item__skeleton --circle"
						:style="{
							height: '15px',
							width: '15px',
						}"
					></div>
					<div
						class="booking-sre__base-item__skeleton --rectangle-rounded"
						:style="{
							height: '11px',
							width: '136px',
						}"
					></div>
				</div>
				<div
					class="booking-sre__base-item__skeleton--row"
					style="gap: 10px"
				>
					<div
						class="booking-sre__base-item__skeleton --rectangle-rounded"
						:style="{
							height: '11px',
							width: '51px',
						}"
					></div>
					<div
						class="booking-sre__base-item__skeleton --circle"
						:style="{
							height: '11px',
							width: '11px',
						}"
					></div>
				</div>
			</div>
			<div class="booking-services-settings-popup__base-item__content">
				<div class="booking-sre__base-item__skeleton--content">
					<div
						class="booking-sre__base-item__skeleton--row booking-sre__base-item__skeleton--content-row"
						style="gap: 5px;"
					>
						<div
							class="booking-sre__base-item__skeleton --rectangle"
							:style="{
								height: '28px',
								width: '111px',
							}"
						></div>
						<div
							class="booking-sre__base-item__skeleton --rectangle"
							:style="{
								height: '28px',
								width: '148px',
							}"
						></div>
						<div
							class="booking-sre__base-item__skeleton --rectangle"
							:style="{
								height: '28px',
								width: '136px',
							}"
						></div>
						<div
							class="booking-sre__base-item__skeleton --rectangle"
							:style="{
								height: '28px',
								width: '120px',
							}"
						></div>
					</div>
					<div
						class="booking-sre__base-item__skeleton--row booking-sre__base-item__skeleton--content-row"
						style="gap: 7px;"
					>
						<div
							class="booking-sre__base-item__skeleton --rectangle"
							:style="{
								height: '28px',
								width: '134px',
							}"
						></div>
						<div
							class="booking-sre__base-item__skeleton --rectangle-rounded"
							:style="{
								height: '10px',
								width: '90px',
							}"
						></div>
					</div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const SkusView = {
	  name: 'SkusView',
	  components: {
	    AddSkusButton,
	    SearchInput,
	    SkusGroupActionBar,
	    SkusItem,
	    SkusBar,
	    EmptyState,
	    BaseItemSkeleton
	  },
	  props: {
	    loading: {
	      type: Boolean,
	      default: false
	    }
	  },
	  data() {
	    return {
	      search: '',
	      selected: new Set()
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      getResourceById: `${booking_const.Model.Resources}/getById`,
	      skusResourcesMap: `${booking_const.Model.SkuResourcesEditor}/skusResourcesMap`,
	      skus: `${booking_const.Model.SkuResourcesEditor}/skus`,
	      getSkusByIds: `${booking_const.Model.SkuResourcesEditor}/getSkusByIds`
	    }),
	    skus() {
	      return this.getSkusByIds([...this.skusResourcesMap.keys()]);
	    },
	    skusList() {
	      if (!this.search) {
	        return this.skus;
	      }
	      const query = this.search.toLowerCase();
	      return this.skus.filter(sku => sku.name.toLowerCase().includes(query));
	    },
	    skusResourcesEditorOptions() {
	      return this.$store.state[booking_const.Model.SkuResourcesEditor].options;
	    }
	  },
	  methods: {
	    selectSku(skuId) {
	      if (this.selected.has(skuId)) {
	        this.selected.delete(skuId);
	      } else {
	        this.selected.add(skuId);
	      }
	    },
	    toggleAll() {
	      if (this.selected.size === this.skus.length) {
	        this.selected.clear();
	      } else {
	        this.skus.forEach(sku => this.selected.add(sku.id));
	      }
	    },
	    getSelectedSkus() {
	      return this.skus.filter(({
	        id
	      }) => this.selected.has(id));
	    }
	  },
	  template: `
		<div class="booking-services-settings-popup__services-view">
			<SkusGroupActionBar v-if="selected.size > 0" :skus="getSelectedSkus()" @close="selected.clear()"/>
			<SearchInput 
				v-model="search"
				:placeholder-text="loc('BOOKING_SERVICES_SETTINGS_POPUP_SEARCH_SKU_INPUT_PLACEHOLDER')"
			/>
			<SkusBar
				:checked="selected.size > 0 && (selected.size === skus.length)"
				:servicesCount="skus.length"
				@update:checked="toggleAll"
			>
				<template #button>
					<AddSkusButton
						v-if="skusResourcesEditorOptions.editMode && skusResourcesEditorOptions.catalogSkuEntityOptions"
						:skus
					/>
				</template>
			</SkusBar>
			<div class="booking-services-settings-popup__services-view__services-list">
				<template v-if="loading">
					<BaseItemSkeleton/>
					<BaseItemSkeleton/>
				</template>
				<SkusItem
					v-else-if="!loading && skusList.length > 0"
					v-for="sku of skusList"
					:key="sku.id"
					:sku="sku"
					:selected="selected.has(sku.id)"
					@update:selected="selectSku"
					@afterRemove="selected.delete($event)"
				/>
				<EmptyState
					v-else
					:sku-title="search"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const ResourcesSkuSelector = {
	  name: 'ResourcesSkuSelector',
	  props: {
	    resourceId: {
	      type: Number,
	      required: true
	    },
	    /** @type{number[]} */
	    selectedSkusIds: {
	      type: Array,
	      required: true
	    }
	  },
	  emits: ['add', 'remove'],
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      getSkuById: `${booking_const.Model.SkuResourcesEditor}/getSkuById`
	    })
	  },
	  watch: {
	    selectedSkusIds: {
	      handler(newSkusIds) {
	        this.updateSelectedItems(newSkusIds);
	      },
	      deep: true,
	      immediate: false
	    }
	  },
	  mounted() {
	    this.selector = this.createSelector();
	    this.mountSelector();
	  },
	  beforeUnmount() {
	    this.destroySelector();
	  },
	  methods: {
	    createSelector() {
	      const dialogOptions = {
	        context: 'bookingResourcesSkus',
	        width: 290,
	        height: 340,
	        dropdownMode: true,
	        compactView: true,
	        enableSearch: true,
	        cacheable: true,
	        showAvatars: true,
	        popupOptions: {
	          targetContainer: this.$root.$el.querySelector('.booking-sre-app__wrapper')
	        },
	        searchOptions: {
	          allowCreateItem: false
	        },
	        entities: [{
	          id: booking_const.EntitySelectorEntity.Product,
	          dynamicLoad: true,
	          dynamicSearch: true,
	          options: this.$store.state[booking_const.Model.SkuResourcesEditor].options.catalogSkuEntityOptions
	        }],
	        preselectedItems: this.selectedSkusIds.map(id => [booking_const.EntitySelectorEntity.Product, id]),
	        events: {
	          'Item:onSelect': event => {
	            this.select(event.getData().item);
	          },
	          'Item:onDeselect': event => {
	            this.deselect(event.getData().item.id);
	          }
	        }
	      };
	      const tagSelectionOptions = {
	        multiple: true,
	        textBoxWidth: 600,
	        showAddButton: true,
	        showCreateButton: false,
	        tagClickable: false,
	        showTextBox: false,
	        dialogOptions
	      };
	      return new ui_entitySelector.TagSelector(tagSelectionOptions);
	    },
	    mountSelector() {
	      this.selector.renderTo(this.$refs.skusSelector);
	      if (this.disabled) {
	        this.selector.setLocked(this.disabled);
	      }
	    },
	    destroySelector() {
	      this.selector.getDialog().destroy();
	      this.selector = null;
	      this.$refs.skusSelector.innerHTML = '';
	    },
	    select(item) {
	      const skuId = item.getId();
	      const price = item.getCustomData().get('RAW_PRICE') || {
	        VALUE: 0,
	        CURRENCY: null
	      };
	      const sku = this.getSkuById(skuId);
	      this.$emit('add', {
	        resourceId: this.resourceId,
	        sku: sku || {
	          id: skuId,
	          name: item.getTitle(),
	          price: price.VALUE,
	          currencyId: price.CURRENCY
	        }
	      });
	    },
	    deselect(skuId) {
	      this.$emit('remove', {
	        resourceId: this.resourceId,
	        skuId
	      });
	    },
	    // TODO: Logic for adding. What if need to delete?
	    updateSelectedItems(skusIds) {
	      const items = this.selector.getDialog().getItems();
	      const selectedItemsIds = new Set(this.selector.getDialog().getSelectedItems().map(item => item.id));
	      for (const skuId of skusIds) {
	        if (!selectedItemsIds.has(skuId)) {
	          const selectorItem = items.find(item => item.id === skuId);
	          if (selectorItem) {
	            selectorItem.select();
	          }
	        }
	      }
	    }
	  },
	  template: `
		<div
			ref="skusSelector"
			class="booking-services-settings-popup__resources-view__sku-selector"
		></div>
	`
	};

	// @vue/component
	const ResourcesItem = {
	  name: 'ResourcesItem',
	  components: {
	    BaseItem,
	    ResourcesSkuSelector
	  },
	  props: {
	    resourceId: {
	      type: Number,
	      required: true
	    },
	    selected: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['update:selected', 'afterRemove'],
	  computed: {
	    resource() {
	      return this.$store.state[booking_const.Model.SkuResourcesEditor].resources.get(this.resourceId);
	    },
	    resourcesSkusMap() {
	      return this.$store.state[booking_const.Model.SkuResourcesEditor].resourcesSkusMap;
	    },
	    avatar() {
	      var _this$resource$avatar;
	      return ((_this$resource$avatar = this.resource.avatar) == null ? void 0 : _this$resource$avatar.url) || '';
	    },
	    skusIds() {
	      return [...(this.resourcesSkusMap.get(this.resource.id) || [])];
	    },
	    invalid() {
	      return this.$store.state[booking_const.Model.SkuResourcesEditor].invalidResource && this.skusIds.length === 0;
	    }
	  },
	  watch: {
	    invalid: {
	      handler(invalid) {
	        if (invalid) {
	          this.scrollToInvalid();
	        }
	      },
	      immediate: true
	    }
	  },
	  methods: {
	    scrollToInvalid() {
	      void this.$nextTick(() => {
	        var _this$$refs$resource, _this$$refs$resource$;
	        (_this$$refs$resource = this.$refs.resource) == null ? void 0 : (_this$$refs$resource$ = _this$$refs$resource.$el) == null ? void 0 : _this$$refs$resource$.scrollIntoView(true, {
	          behavior: 'smooth',
	          block: 'center'
	        });
	      });
	    },
	    removeResource(resourceId) {
	      void this.$store.dispatch(`${booking_const.Model.SkuResourcesEditor}/deleteResource`, resourceId);
	      this.$emit('afterRemove', resourceId);
	    },
	    addSku({
	      resourceId,
	      sku
	    }) {
	      void this.$store.dispatch(`${booking_const.Model.SkuResourcesEditor}/addSkuToResource`, {
	        resourceId,
	        sku
	      });
	    },
	    removeSku({
	      resourceId,
	      skuId
	    }) {
	      void this.$store.dispatch(`${booking_const.Model.SkuResourcesEditor}/deleteSkuFromResource`, {
	        resourceId,
	        skuId
	      });
	    }
	  },
	  template: `
		<BaseItem
			ref="resource"
			:selected
			:name="resource.name"
			hasAvatar
			:avatar
			:label="loc('BOOKING_SRE_RESOURCE_SKUS_LABEL')"
			:dataId="resource.id"
			:invalid
			:invalidMessage="loc('BOOKING_SRE_SKUS_FOR_RESOURCE_NOT_SELECTED')"
			@update:selected="$emit('update:selected', resource.id)"
			@remove="removeResource(resource.id)"
		>
			<ResourcesSkuSelector
				:resourceId="resource.id"
				:selectedSkusIds="skusIds"
				@add="addSku"
				@remove="removeSku"
			/>
		</BaseItem>
	`
	};

	async function fetchResourcesByIds(resourceIds) {
	  await loadResourcesByIds(resourceIds);
	}
	async function loadResourcesByIds(resourceIds) {
	  const $store = booking_core.Core.getStore();
	  try {
	    const existingResources = $store.getters[`${booking_const.Model.Resources}/getByIds`](resourceIds);
	    const existingIds = new Set(existingResources.filter(resource => main_core.Type.isObject(resource) && 'id' in resource).map(resource => resource.id));
	    const idsToLoad = resourceIds.filter(id => !existingIds.has(id));
	    if (idsToLoad.length > 0) {
	      await booking_provider_service_resourceDialogService.resourceDialogService.loadByIds(idsToLoad, Math.round(Date.now() / 1000));
	    }
	    const allResources = booking_lib_deepToRaw.deepToRaw($store.getters[`${booking_const.Model.Resources}/getByIds`](resourceIds));
	    await $store.dispatch(`${booking_const.Model.SkuResourcesEditor}/addResources`, allResources);
	    await $store.dispatch(`${booking_const.Model.SkuResourcesEditor}/addSkus`, getServicesCollection(allResources));
	  } catch (error) {
	    console.error('SkuResourcesEditor. Fetch resource error', error);
	  }
	}

	// @vue/component
	const ResourcesSelector = {
	  name: 'ResourcesSelector',
	  props: {
	    targetNode: {
	      type: HTMLElement,
	      required: true
	    },
	    /** @type {number[]} */
	    resourcesIds: {
	      type: Array,
	      default: () => []
	    }
	  },
	  emits: ['close'],
	  data() {
	    return {
	      selected: []
	    };
	  },
	  created() {
	    this.createDialog();
	  },
	  mounted() {
	    this.dialog.show();
	  },
	  unmounted() {
	    var _this$dialog;
	    (_this$dialog = this.dialog) == null ? void 0 : _this$dialog.destroy();
	  },
	  methods: {
	    createDialog() {
	      this.dialog = new ui_entitySelector.Dialog({
	        targetNode: this.targetNode,
	        context: 'bookingResourcesSelector',
	        width: 290,
	        height: 340,
	        dropdownMode: true,
	        compactView: true,
	        enableSearch: true,
	        cacheable: true,
	        showAvatars: true,
	        multiple: false,
	        popupOptions: {
	          targetContainer: this.$root.$el.querySelector('.booking-sre-app__wrapper')
	        },
	        tagSelectorOptions: {
	          textBoxWidth: '100%'
	        },
	        searchOptions: {
	          allowCreateItem: false
	        },
	        entities: [{
	          id: booking_const.EntitySelectorEntity.Resource,
	          dynamicLoad: true,
	          dynamicSearch: true
	        }],
	        preselectedItems: this.resourcesIds.map(id => [booking_const.EntitySelectorEntity.Product, id]),
	        events: {
	          'Item:onSelect': event => {
	            this.select(event.getData().item);
	          },
	          onLoad: event => {
	            var _event$getTarget;
	            this.removeSelected(((_event$getTarget = event.getTarget()) == null ? void 0 : _event$getTarget.getItems()) || []);
	          },
	          'SearchTab:onLoad': () => {
	            this.removeSelected(this.dialog.getItems());
	          },
	          onHide: () => this.beforeHide()
	        }
	      });
	    },
	    removeSelected(items) {
	      for (const item of items) {
	        if (this.resourcesIds.includes(item.getId())) {
	          item.setHidden(true);
	        }
	      }
	    },
	    select(item) {
	      this.selected.push(item.getId());
	    },
	    async beforeHide() {
	      await this.addResource();
	      this.$emit('close');
	    },
	    async addResource() {
	      const resourceId = this.selected[0];
	      if (main_core.Type.isNil(resourceId)) {
	        return;
	      }
	      await fetchResourcesByIds(this.selected);
	      const skus = getServicesCollection(this.$store.getters[`${booking_const.Model.SkuResourcesEditor}/getResourcesByIds`]([resourceId]));
	      this.$store.commit(`${booking_const.Model.SkuResourcesEditor}/addResourceSkus`, {
	        resourceId,
	        skus: skus.map(sku => sku.id)
	      });
	    }
	  },
	  template: '<div hidden="hidden"></div>'
	};

	// @vue/component
	const EmptyState$1 = {
	  name: 'EmptyState',
	  components: {
	    ResourcesSelector,
	    UiButton: booking_component_button.Button
	  },
	  props: {
	    resourceTitle: {
	      type: String,
	      default: null
	    }
	  },
	  setup() {
	    return {
	      AirButtonStyle: booking_component_button.AirButtonStyle,
	      ButtonSize: booking_component_button.ButtonSize
	    };
	  },
	  data() {
	    return {
	      shownSelector: false
	    };
	  },
	  computed: {
	    buttonTitle() {
	      return this.loc('BOOKING_RESOURCES_SETTINGS_EMPTY_STATE_ADD_BUTTON');
	    },
	    title() {
	      return this.resourceTitle ? this.loc('BOOKING_RESOURCES_SETTINGS_EMPTY_STATE_SEARCH_TITLE') : this.loc('BOOKING_RESOURCES_SETTINGS_EMPTY_STATE_TITLE');
	    },
	    description() {
	      return this.resourceTitle ? this.loc('BOOKING_RESOURCES_SETTINGS_EMPTY_STATE_SEARCH_DESCRIPTION', {
	        '#SEARCH_TEXT#': this.resourceTitle
	      }) : this.loc('BOOKING_RESOURCES_SETTINGS_EMPTY_STATE_DESCRIPTION');
	    }
	  },
	  methods: {
	    toggleShownSelector() {
	      this.shownSelector = !this.shownSelector;
	    }
	  },
	  template: `
		<div class="booking-resources-settings__resources-view_empty-state">
				<div class="booking-resources-settings__resources-view_empty-state-icon"></div>
				<div class="booking-resources-settings__resources-view_empty-state-title">
					{{ title }}
				</div>
				<div class="booking-resources-settings__resources-view_empty-state-description">
					{{ description }}
				</div>
				<div class="booking-resources-settings__resources-view_empty-state-button">
					<UiButton
						ref="btn"
						:text="buttonTitle"
						:size="ButtonSize.SMALL"
						:style="AirButtonStyle.TINTED"
						icon="ui-btn-icon-add"
						iconPosition="left"
						noCaps
						useAirDesign
						@click="toggleShownSelector"
					/>
					<ResourcesSelector
						v-if="shownSelector"
						:targetNode="$refs.btn.$el"
						@close="shownSelector = false"
					/>
				</div>
		</div>
	`
	};

	// @vue/component
	const ResourcesBar = {
	  name: 'ResourcesBar',
	  components: {
	    BCounter: ui_vue3_components_counter.Counter
	  },
	  props: {
	    checked: {
	      type: Boolean,
	      default: false
	    },
	    resourcesCount: {
	      type: Number,
	      default: 0
	    }
	  },
	  emits: ['update:checked'],
	  setup() {
	    return {
	      CounterStyle: ui_cnt.CounterStyle
	    };
	  },
	  template: `
		<div class="booking-sre-app__resources-bar">
			<div class="ui-form-row-inline">
				<label class="ui-ctl ui-ctl-checkbox">
					<input
						:checked="checked"
						data-id="booking-sre-app__resources-bar__select-all"
						type="checkbox"
						class="ui-ctl-element ui-ctl-checkbox"
						@change="$emit('update:checked')"
					/>
					<span class="booking-sre-app__resources-bar__label">
						{{ loc('BOOKING_SRE_ALL_RESOURCES_LABEL') }}
					</span>
				</label>
			</div>
			<BCounter
				:value="resourcesCount"
				:maxValue="Infinity"
				:style="CounterStyle.FILLED_NO_ACCENT"
			/>
			<div class="booking-sre-app__resources-bar__grow"></div>
			<slot name="button"></slot>
		</div>
	`
	};

	// @vue/component
	const AddResourcesButton$1 = {
	  name: 'AddResourcesButton',
	  components: {
	    ResourcesSelector,
	    UiButton: booking_component_button.Button
	  },
	  setup() {
	    return {
	      AirButtonStyle: booking_component_button.AirButtonStyle,
	      ButtonSize: booking_component_button.ButtonSize
	    };
	  },
	  data() {
	    return {
	      shownPopup: false
	    };
	  },
	  computed: {
	    resourcesIds() {
	      return [...this.$store.state[booking_const.Model.SkuResourcesEditor].resourcesSkusMap.keys()];
	    }
	  },
	  methods: {
	    togglePopup() {
	      this.shownPopup = !this.shownPopup;
	    }
	  },
	  template: `
		<div>
			<UiButton
				ref="btn"
				:text="loc('BOOKING_SRE_ADD_RESOURCE_BUTTON')"
				:style="AirButtonStyle.OUTLINE"
				:size="ButtonSize.SMALL"
				noCaps
				useAirDesign
				@click="togglePopup"
			/>
			<ResourcesSelector
				v-if="shownPopup"
				:targetNode="$refs.btn.$el"
				:resourcesIds
				@close="shownPopup = false"
			/>
		</div>
	`
	};

	let dialog$1 = null;

	// @vue/component
	const AddSkusButton$1 = {
	  name: 'AddSkusButton',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  props: {
	    resources: {
	      type: Array,
	      default: () => []
	    }
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  data() {
	    return {
	      shown: false,
	      selectedSkus: new Map(),
	      initialSkuIds: new Set()
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      getSkuById: `${booking_const.Model.SkuResourcesEditor}/getSkuById`
	    }),
	    skus() {
	      return this.$store.getters[`${booking_const.Model.SkuResourcesEditor}/skus`];
	    }
	  },
	  watch: {
	    shown(shown) {
	      if (shown) {
	        this.getDialog().show();
	      } else {
	        this.getDialog().hide();
	      }
	    }
	  },
	  unmounted() {
	    var _dialog;
	    (_dialog = dialog$1) == null ? void 0 : _dialog.destroy();
	    dialog$1 = undefined;
	  },
	  methods: {
	    toggleDialog() {
	      this.shown = !this.shown;
	    },
	    getDialog() {
	      if (dialog$1 instanceof ui_entitySelector.Dialog) {
	        return dialog$1;
	      }
	      dialog$1 = new ui_entitySelector.Dialog({
	        id: 'booking-sre-app__add-sku-dialog',
	        targetNode: this.$refs.button,
	        width: 400,
	        enableSearch: true,
	        dropdownMode: true,
	        context: 'crmFormsBookingSkusSelector',
	        multiple: true,
	        cacheable: true,
	        showAvatars: true,
	        entities: [{
	          id: booking_const.EntitySelectorEntity.Product,
	          dynamicLoad: true,
	          dynamicSearch: true,
	          options: this.$store.state[booking_const.Model.SkuResourcesEditor].options.catalogSkuEntityOptions
	        }],
	        searchOptions: {
	          allowCreateItem: false
	        },
	        events: {
	          onHide: () => {
	            this.shown = false;
	            this.updateResourcesSkus();
	          },
	          'Item:onSelect': event => {
	            const item = event.getData().item;
	            this.selectedSkus.set(item.id, {
	              id: item.id,
	              name: item.title.text
	            });
	          },
	          'Item:onDeselect': event => {
	            this.selectedSkus.delete(event.getData().item.id);
	          }
	        }
	      });
	      return dialog$1;
	    },
	    updateResourcesSkus() {
	      const resourcesIds = this.resources.map(({
	        id
	      }) => id);
	      const skus = [...this.selectedSkus.values()];
	      if (skus.length > 0) {
	        void this.$store.dispatch(`${booking_const.Model.SkuResourcesEditor}/addSkusToResources`, {
	          resourcesIds,
	          skus
	        });
	      }
	    }
	  },
	  template: `
		<div
			ref="button"
			class="booking-sre-app__add-skus-button"
			tabindex="0"
			role="button"
			@click="toggleDialog"
		>
			<BIcon :size="20" :name="Outline.SERVICES" color="rgb(var(--ui-color-on-primary-rgb))"/>
			<span class="booking-sre-app__add-skus-button__label">
				{{ loc('BOOKING_SRE_GROUP_ACTION_BAR_ADD_SKUS') }}
			</span>
		</div>
	`
	};

	// @vue/component
	const ResourcesGroupActionBar = {
	  name: 'ResourcesGroupActionBar',
	  components: {
	    AddSkusButton: AddSkusButton$1,
	    BaseGroupActionBar
	  },
	  props: {
	    resources: {
	      type: Array,
	      default: () => []
	    }
	  },
	  emits: ['close'],
	  template: `
		<BaseGroupActionBar :count="resources.length" @close="$emit('close')">
			<AddSkusButton :resources />
		</BaseGroupActionBar>
	`
	};

	// @vue/component
	const ResourcesGroup = {
	  name: 'ResourcesGroup',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  props: {
	    selected: {
	      type: Set,
	      required: true
	    },
	    typeId: {
	      type: Number,
	      required: true
	    },
	    /** @type{number[]} */
	    resourcesIds: {
	      type: Array,
	      default: () => []
	    }
	  },
	  emits: ['selectGroup'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  data() {
	    return {
	      collapsed: false
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      getResourceTypeById: `${booking_const.Model.ResourceTypes}/getById`
	    }),
	    groupName() {
	      var _this$getResourceType;
	      return ((_this$getResourceType = this.getResourceTypeById(this.typeId)) == null ? void 0 : _this$getResourceType.name) || '';
	    },
	    isChecked: {
	      get() {
	        return this.resourcesIds.every(id => this.selected.has(id));
	      },
	      set() {
	        this.$emit('selectGroup', {
	          checked: !this.isChecked,
	          resourcesIds: this.resourcesIds
	        });
	      }
	    },
	    collapseLabel() {
	      return this.collapsed ? this.loc('BOOKING_SRE_RESOURCES_GROUP_EXPAND') : this.loc('BOOKING_SRE_RESOURCES_GROUP_COLLAPSE');
	    }
	  },
	  template: `
		<div class="booking-sre-app__resources-group">
			<div class="booking-sre-app__resources-group-header">
				<div class="booking-sre-app__resources-group-header-title">
					<div class="ui-form-row-inline">
						<label class="ui-ctl ui-ctl-checkbox">
							<input
								v-model="isChecked"
								:id="'booking-sre-resource-group-checkbox' + typeId"
								:data-id="'booking-sre-resource-group-checkbox' + typeId"
								type="checkbox"
								class="ui-ctl-element ui-ctl-checkbox booking-services-settings-popup__base-item__checkbox"
							/>
						</label>
					</div>
					<span class="booking-sre-app__resources_group-header--title">{{ groupName }}</span>
				</div>
				<div class="booking-sre-app__resources-group-header-actions">
					<div
						class="booking-sre-app__resources_group-header--collapse"
						@click="collapsed = !collapsed"
					>
						<span class="booking-sre-app__resources_group-header--collapse-label">{{ collapseLabel }}</span>
						<BIcon
							class="booking-sre-app__resources_group-header--collapse-icon"
							:class="{ '--expanded': collapsed }"
							:name="Outline.CHEVRON_TOP_L"
							:size="18"
							color="var(--ui-color-base-70)"
						/>
					</div>
				</div>
			</div>
			<Transition name="collapse">
				<div
					v-show="!collapsed"
					class="booking-sre-app__resources-group-content"
					:class="{ '--collapsed': collapsed }"
				>
					<slot :resourcesIds="resourcesIds"/>
				</div>
			</Transition>
		</div>
	`
	};

	// @vue/component
	const ResourcesView = {
	  name: 'ResourcesView',
	  components: {
	    AddResourcesButton: AddResourcesButton$1,
	    SearchInput,
	    ResourcesGroup,
	    ResourcesGroupActionBar,
	    ResourcesItem,
	    ResourcesBar,
	    EmptyState: EmptyState$1
	  },
	  data() {
	    return {
	      search: '',
	      selected: new Set()
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      getResourcesByIds: `${booking_const.Model.SkuResourcesEditor}/getResourcesByIds`
	    }),
	    resourcesSkusMap() {
	      return this.$store.state[booking_const.Model.SkuResourcesEditor].resourcesSkusMap;
	    },
	    resources() {
	      return this.getResourcesByIds([...this.resourcesSkusMap.keys()]);
	    },
	    resourcesList() {
	      if (!this.search) {
	        return this.resources;
	      }
	      const query = this.search.toLowerCase();
	      return this.resources.filter(resource => resource.name.toLowerCase().includes(query));
	    },
	    groupedResources() {
	      const groupedResources = new Map();
	      for (const resource of this.resourcesList) {
	        const resources = groupedResources.get(resource.typeId) || [];
	        resources.push(resource);
	        groupedResources.set(resource.typeId, resources);
	      }
	      return groupedResources;
	    },
	    skusResourcesEditorOptions() {
	      return this.$store.state[booking_const.Model.SkuResourcesEditor].options;
	    }
	  },
	  methods: {
	    selectResource(resourceId) {
	      if (this.selected.has(resourceId)) {
	        this.selected.delete(resourceId);
	      } else {
	        this.selected.add(resourceId);
	      }
	    },
	    toggleAll() {
	      if (this.selected.size === this.resources.length) {
	        this.selected.clear();
	      } else {
	        this.resources.forEach(resource => this.selected.add(resource.id));
	      }
	    },
	    toggleSelectGroup({
	      checked,
	      resourcesIds
	    }) {
	      if (checked) {
	        resourcesIds.forEach(id => this.selected.add(id));
	      } else {
	        resourcesIds.forEach(id => this.selected.delete(id));
	      }
	    },
	    getSelectedResources() {
	      return this.resources.filter(({
	        id
	      }) => this.selected.has(id));
	    }
	  },
	  template: `
		<div class="booking-sre-app__resources-view">
			<ResourcesGroupActionBar
				v-if="selected.size > 0"
				:resources="getSelectedResources()"
				@close="selected.clear()"
			/>
			<SearchInput 
				v-model="search"
				:placeholder-text="loc('BOOKING_SERVICES_SETTINGS_POPUP_SEARCH_RESOURCE_INPUT_PLACEHOLDER')"
			/>
			<ResourcesBar
				:checked="selected.size > 0 && (selected.size === resources.length)"
				:resourcesCount="resources.length"
				@update:checked="toggleAll"
			>
				<template #button>
					<AddResourcesButton
						v-if="skusResourcesEditorOptions.editMode"
					/>
				</template>
			</ResourcesBar>
			<div class="booking-sre-app__resources-view__resources-list">
				<template v-if="resourcesList.length > 0">
					<ResourcesGroup
						v-for="[typeId, resources] of groupedResources"
						:key="typeId"
						:selected="selected"
						:typeId="typeId"
						:resourcesIds="resources.map(({ id }) => id)"
						@selectGroup="toggleSelectGroup"
					>
						<div class="booking-sre-app__resources-view__resources-list">
							<ResourcesItem
								v-slot="{ resourcesIds }"
								v-for="resource of resources"
								:key="resource.id"
								:resourceId="resource.id"
								:selected="selected.has(resource.id)"
								@update:selected="selectResource"
								@afterRemove="selected.delete($event)"
							/>
						</div>
					</ResourcesGroup>
				</template>
				<EmptyState
					v-else
					:resource-title="search"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const SkuResourcesEditorSku = {
	  name: 'SkuResourcesEditorSku',
	  components: {
	    UiTabs: booking_component_uiTabs.UiTabs,
	    UiButton: booking_component_button.Button,
	    SkusView,
	    ResourcesView
	  },
	  props: {
	    description: {
	      type: String,
	      default: null
	    },
	    loading: {
	      type: Boolean,
	      default: false
	    }
	  },
	  computed: {
	    resourcesSkusMap() {
	      return this.$store.state[booking_const.Model.SkuResourcesEditor].resourcesSkusMap;
	    },
	    activeComponent: {
	      get() {
	        return this.$store.state[booking_const.Model.SkuResourcesEditor].tab;
	      },
	      set(tab) {
	        this.$store.commit(`${booking_const.Model.SkuResourcesEditor}/updateTab`, tab);
	      }
	    },
	    tabs() {
	      return [{
	        title: this.loc('BOOKING_SRE_TAB_SKUS_LABEL'),
	        componentName: booking_const.SkuResourcesEditorTab.Skus
	      }, {
	        title: this.loc('BOOKING_SRE_TAB_RESOURCES_LABEL'),
	        componentName: booking_const.SkuResourcesEditorTab.Resources
	      }];
	    },
	    resources() {
	      return this.$store.state[booking_const.Model.SkuResourcesEditor].resources;
	    }
	  },
	  watch: {
	    resourcesSkusMap: {
	      handler() {
	        this.$store.dispatch(`${booking_const.Model.SkuResourcesEditor}/updateInvalid`, {
	          invalidSku: false,
	          invalidResource: false
	        });
	      },
	      deep: true
	    }
	  },
	  template: `
		<div class="booking-sre-app__sku-settings">
			<div
				v-if="description"
				class="booking-sre-app__sku-settings_description"
			>
				{{ description }}
			</div>
			<div class="booking-sre-app__sku-settings-content">
				<UiTabs
					v-model:activeComponent="activeComponent"
					:tabsOptions="tabs"
				>
					<template #SkusView>
						<SkusView :loading/>
					</template>
					<template #ResourcesView>
						<ResourcesView/>
					</template>
				</UiTabs>
			</div>
		</div>
	`
	};

	// @vue/component
	const App = {
	  name: 'SkuResourcesEditorApp',
	  components: {
	    SkuResourcesEditorLayout,
	    SkuResourcesEditorHeader,
	    SkuResourcesEditorFooter,
	    SkuResourcesEditorSku
	  },
	  props: {
	    /**
	     * @type { SkuResourcesEditorParams }
	     */
	    params: {
	      type: Object,
	      required: true
	    }
	  },
	  data() {
	    return {
	      loading: false
	    };
	  },
	  created() {
	    this.setOptions();
	    void this.fetchResources();
	  },
	  methods: {
	    async fetchResources() {
	      this.loading = true;
	      this.$store.commit(`${booking_const.Model.SkuResourcesEditor}/setFetching`, true);
	      const resources = await this.params.loadData();
	      await this.$store.dispatch(`${booking_const.Model.SkuResourcesEditor}/setResources`, resources);
	      this.loading = false;
	      this.$store.commit(`${booking_const.Model.SkuResourcesEditor}/setFetching`, false);
	    },
	    setOptions() {
	      this.$store.commit(`${booking_const.Model.SkuResourcesEditor}/setOptions`, this.params.options);
	    }
	  },
	  template: `
		<SkuResourcesEditorLayout>
			<template #header>
				<SkuResourcesEditorHeader
					:title="params.title"
				/>
			</template>

			<SkuResourcesEditorSku
				:description="params.description"
				:loading
			/>

			<template #footer>
				<SkuResourcesEditorFooter :params/>
			</template>
		</SkuResourcesEditorLayout>
	`
	};

	let _ = t => t,
	  _t;
	var _width = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("width");
	var _application = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("application");
	var _params = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("params");
	var _mountContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mountContent");
	var _initCore = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initCore");
	var _makeContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("makeContainer");
	class SkuResourcesEditor {
	  constructor(params) {
	    Object.defineProperty(this, _makeContainer, {
	      value: _makeContainer2
	    });
	    Object.defineProperty(this, _initCore, {
	      value: _initCore2
	    });
	    Object.defineProperty(this, _mountContent, {
	      value: _mountContent2
	    });
	    Object.defineProperty(this, _application, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _params, {
	      writable: true,
	      value: void 0
	    });
	    const options = {
	      editMode: false,
	      canBeEmpty: false,
	      catalogSkuEntityOptions: null,
	      ...params.options
	    };
	    babelHelpers.classPrivateFieldLooseBase(this, _params)[_params] = {
	      ...params,
	      options
	    };
	  }
	  get name() {
	    return 'booking:sku-resources-editor';
	  }
	  open() {
	    booking_lib_sidePanelInstance.SidePanelInstance.open(this.name, {
	      width: babelHelpers.classPrivateFieldLooseBase(SkuResourcesEditor, _width)[_width],
	      cacheable: false,
	      events: {
	        onClose: this.closeSidePanel.bind(this)
	      },
	      contentCallback: async () => {
	        await babelHelpers.classPrivateFieldLooseBase(this, _initCore)[_initCore]();
	        this.subscribeEvents();
	        const container = babelHelpers.classPrivateFieldLooseBase(this, _makeContainer)[_makeContainer]();
	        babelHelpers.classPrivateFieldLooseBase(this, _mountContent)[_mountContent](container);
	        return container;
	      }
	    });
	  }
	  closeSidePanel() {
	    if (main_core.Type.isFunction(babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].save)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].save();
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _application)[_application].unmount();
	    babelHelpers.classPrivateFieldLooseBase(this, _application)[_application] = null;
	    booking_core.Core.removeDynamicModule(booking_const.Model.SkuResourcesEditor);
	    this.unsubscribeEvents();
	  }
	  close() {
	    booking_lib_sidePanelInstance.SidePanelInstance.close();
	  }
	  subscribeEvents() {
	    main_core.Event.EventEmitter.subscribe(booking_const.EventName.CloseSkuResourcesEditor, this.close);
	  }
	  unsubscribeEvents() {
	    main_core.Event.EventEmitter.unsubscribe(booking_const.EventName.CloseSkuResourcesEditor, this.close);
	  }
	}
	function _mountContent2(container) {
	  const application = ui_vue3.BitrixVue.createApp(App, {
	    ...booking_core.Core.getParams(),
	    params: babelHelpers.classPrivateFieldLooseBase(this, _params)[_params]
	  });
	  application.mixin(booking_component_mixin_locMixin.locMixin);
	  application.use(booking_core.Core.getStore());
	  application.mount(container);
	  babelHelpers.classPrivateFieldLooseBase(this, _application)[_application] = application;
	}
	async function _initCore2() {
	  try {
	    await booking_core.Core.init({
	      skipCoreModels: true,
	      skipPull: true
	    });
	    await booking_core.Core.addDynamicModule(booking_model_resources.Resources.create());
	    await booking_core.Core.addDynamicModule(booking_model_resourceTypes.ResourceTypes.create());
	    await booking_core.Core.addDynamicModule(booking_model_skuResourcesEditor.SkuResourcesEditorModel.create());
	  } catch (error) {
	    console.error('Init SkuResourcesEditor error', error);
	  }
	}
	function _makeContainer2() {
	  return main_core.Tag.render(_t || (_t = _`
			<div id="booking-sre-app" class="booking-sre-app"></div>
		`));
	}
	Object.defineProperty(SkuResourcesEditor, _width, {
	  writable: true,
	  value: 700
	});

	exports.SkuResourcesEditor = SkuResourcesEditor;

}((this.BX.Booking.Application = this.BX.Booking.Application || {}),BX.Vue3,BX.Booking.Component.Mixin,BX.Booking.Model,BX.Booking.Model,BX.Booking.Model,BX.Booking.Component,BX.Booking.Lib,BX.Booking.Component,BX.Booking.Lib,BX.Booking.Provider.Service,BX,BX.Booking,BX.Booking.Lib,BX.Booking.Provider.Service,BX.UI.Vue3.Components,BX.UI,BX.Booking.Component,BX.Event,BX.UI.EntitySelector,BX.Vue3.Vuex,BX.UI.IconSet,BX.Booking.Const));
//# sourceMappingURL=sku-resources-editor.bundle.js.map
