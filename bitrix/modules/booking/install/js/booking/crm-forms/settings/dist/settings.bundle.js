/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports,main_loader,booking_application_skuResourcesEditor,booking_provider_service_crmFormService,main_core_events,booking_const,main_core,ui_entitySelector) {
	'use strict';

	var _resourcesById = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("resourcesById");
	var _isLoaded = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isLoaded");
	class ResourceStore {
	  constructor() {
	    Object.defineProperty(this, _isLoaded, {
	      value: _isLoaded2
	    });
	    Object.defineProperty(this, _resourcesById, {
	      writable: true,
	      value: new Map()
	    });
	  }
	  async ensure(ids) {
	    if (ids.length === 0) {
	      return;
	    }
	    const needToLoadIds = ids.filter(id => !babelHelpers.classPrivateFieldLooseBase(this, _isLoaded)[_isLoaded](id));
	    if (needToLoadIds.length === 0) {
	      return;
	    }
	    const loaded = await booking_provider_service_crmFormService.crmFormService.getResources(needToLoadIds);
	    for (const resource of loaded) {
	      babelHelpers.classPrivateFieldLooseBase(this, _resourcesById)[_resourcesById].set(resource.id, resource);
	    }
	  }
	  getByIds(ids) {
	    return ids.map(id => babelHelpers.classPrivateFieldLooseBase(this, _resourcesById)[_resourcesById].get(id)).filter(Boolean);
	  }
	  getAll() {
	    return [...babelHelpers.classPrivateFieldLooseBase(this, _resourcesById)[_resourcesById].values()];
	  }
	}
	function _isLoaded2(id) {
	  return babelHelpers.classPrivateFieldLooseBase(this, _resourcesById)[_resourcesById].has(id);
	}
	const resourceStore = new ResourceStore();

	const defaultBookingForm = {
	  resourceIds: [],
	  label: main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_FIELD_LABEL_DEFAULT'),
	  isVisibleHint: true,
	  hint: main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_HINT_DEFAULT_VALUE'),
	  hasSlotsAllAvailableResources: false
	};
	const defaultSkuBookingForm = {
	  resources: [],
	  skuLabel: main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_SKU_FIELD_LABEL_DEFAULT'),
	  skuTextHeader: main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_SKU_FIELD_PLACEHOLDER_DEFAULT_VALUE'),
	  isVisibleSkuHint: true,
	  skuHint: ''
	};
	const defaultBookingDefaultForm = {
	  ...defaultBookingForm,
	  resourceIds: [],
	  textHeader: main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_FIELD_PLACEHOLDER_DEFAULT_VALUE')
	};
	const defaultBookingAutoSelectionForm = {
	  ...defaultBookingForm,
	  resourceIds: [],
	  hasSlotsAllAvailableResources: false,
	  textHeader: main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_FIELD_PLACEHOLDER_AUTO_SELECT_DEFAULT_VALUE')
	};

	var _isAutoSelectionOn = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isAutoSelectionOn");
	var _settingsData = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("settingsData");
	var _isTemplateWithSkus = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isTemplateWithSkus");
	var _getAutoSelectionFormByTemplate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getAutoSelectionFormByTemplate");
	var _getDefaultFormByTemplate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDefaultFormByTemplate");
	class BookingSettingsDataModel {
	  constructor(settingsData, isAutoSelectionOn, _templateId) {
	    Object.defineProperty(this, _getDefaultFormByTemplate, {
	      value: _getDefaultFormByTemplate2
	    });
	    Object.defineProperty(this, _getAutoSelectionFormByTemplate, {
	      value: _getAutoSelectionFormByTemplate2
	    });
	    Object.defineProperty(this, _isTemplateWithSkus, {
	      value: _isTemplateWithSkus2
	    });
	    Object.defineProperty(this, _isAutoSelectionOn, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _settingsData, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _isAutoSelectionOn)[_isAutoSelectionOn] = isAutoSelectionOn;
	    const autoSelectionData = settingsData[booking_const.CrmFormSettingsDataPropName.autoSelection] || babelHelpers.classPrivateFieldLooseBase(this, _getAutoSelectionFormByTemplate)[_getAutoSelectionFormByTemplate](_templateId);
	    const defaultData = settingsData[booking_const.CrmFormSettingsDataPropName.default] || babelHelpers.classPrivateFieldLooseBase(this, _getDefaultFormByTemplate)[_getDefaultFormByTemplate](_templateId);
	    babelHelpers.classPrivateFieldLooseBase(this, _settingsData)[_settingsData] = {
	      [booking_const.CrmFormSettingsDataPropName.isAutoSelectionOn]: isAutoSelectionOn,
	      [booking_const.CrmFormSettingsDataPropName.autoSelection]: autoSelectionData,
	      [booking_const.CrmFormSettingsDataPropName.default]: defaultData
	    };
	  }
	  get dataSettingsProperty() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _isAutoSelectionOn)[_isAutoSelectionOn] ? booking_const.CrmFormSettingsDataPropName.autoSelection : booking_const.CrmFormSettingsDataPropName.default;
	  }
	  setSettingsData(patch = {}) {
	    Object.assign(babelHelpers.classPrivateFieldLooseBase(this, _settingsData)[_settingsData][this.dataSettingsProperty], patch);
	  }
	  get settingsData() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _settingsData)[_settingsData];
	  }
	  get form() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _settingsData)[_settingsData][this.dataSettingsProperty];
	  }
	}
	function _isTemplateWithSkus2(templateId) {
	  return booking_const.CrmFormTemplatesWithSku.includes(templateId);
	}
	function _getAutoSelectionFormByTemplate2(templateId) {
	  const form = defaultBookingAutoSelectionForm;
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isTemplateWithSkus)[_isTemplateWithSkus](templateId)) {
	    return {
	      ...form,
	      ...defaultSkuBookingForm
	    };
	  }
	  return form;
	}
	function _getDefaultFormByTemplate2(templateId) {
	  let form = {
	    ...defaultBookingDefaultForm
	  };
	  if (templateId === booking_const.CrmFormTemplateId.BookingAnyResource || templateId === booking_const.CrmFormTemplateId.BookingAnyResourceSku) {
	    form.hasSlotsAllAvailableResources = true;
	  }
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isTemplateWithSkus)[_isTemplateWithSkus](templateId)) {
	    form = {
	      ...form,
	      ...defaultSkuBookingForm
	    };
	  }
	  return form;
	}

	var _field = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("field");
	class BookingBaseField {
	  constructor(field) {
	    Object.defineProperty(this, _field, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _field)[_field] = field;
	  }
	  getValue() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _field)[_field].getValue();
	  }
	  setValue(value) {
	    babelHelpers.classPrivateFieldLooseBase(this, _field)[_field].setValue(value);
	  }
	  getField() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _field)[_field];
	  }
	  getLayout() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _field)[_field].layout;
	  }
	}

	const DATA_HINT = 'data-hint';
	const DATA_HINT_NO_ICON = 'data-hint-no-icon';
	var _disabled = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("disabled");
	var _addItem = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("addItem");
	var _updateLayoutDataAttrs = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateLayoutDataAttrs");
	class HasSlotsAllAvailableResourcesField extends BookingBaseField {
	  constructor(value, onChange, _disabled2 = false) {
	    super(new BX.Landing.UI.Field.Checkbox({
	      selector: 'hasSlotsAllAvailableResources',
	      compact: true,
	      multiple: false,
	      items: []
	    }));
	    Object.defineProperty(this, _updateLayoutDataAttrs, {
	      value: _updateLayoutDataAttrs2
	    });
	    Object.defineProperty(this, _addItem, {
	      value: _addItem2
	    });
	    Object.defineProperty(this, _disabled, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _addItem)[_addItem](_disabled2);
	    babelHelpers.classPrivateFieldLooseBase(this, _disabled)[_disabled] = _disabled2;
	    if (main_core.Type.isFunction(onChange)) {
	      this.getField().subscribe('onChange', () => {
	        onChange(Boolean(this.getField().getValue()));
	      });
	    }
	    this.setValue(value);
	  }
	  setValue(value) {
	    super.setValue(value ? ['hasSlotsAllAvailableResources'] : false);
	  }
	  getLayout() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _updateLayoutDataAttrs)[_updateLayoutDataAttrs](super.getLayout());
	  }
	}
	function _addItem2(disabled = false) {
	  const hintMessage = main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_SHOW_SLOTS_ALL_AVAILABLE_RESOURCES_HELP_HINT', {
	    '#NBSP# ': '&nbsp;'
	  });
	  this.getField().addItem({
	    name: main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_SHOW_SLOTS_ALL_AVAILABLE_RESOURCES'),
	    html: `
				${main_core.Text.encode(main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_SHOW_SLOTS_ALL_AVAILABLE_RESOURCES'))}
				<span
					class="landing-ui-form-help booking--crm-forms-settins--show-slots-all-available-resources-help-hint"
					title=""
					${DATA_HINT}="${hintMessage}"
					onclick="return false;"
				>
					<div></div>
				</span>
			`,
	    value: 'hasSlotsAllAvailableResources',
	    disabled
	  });
	}
	function _updateLayoutDataAttrs2(layout) {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _disabled)[_disabled]) {
	    layout.setAttribute(DATA_HINT, main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_SHOW_SLOTS_ALL_AVAILABLE_RESOURCES_DISABLED_HINT'));
	    layout.setAttribute(DATA_HINT_NO_ICON, true);
	  } else {
	    layout.removeAttribute(DATA_HINT);
	    layout.removeAttribute(DATA_HINT_NO_ICON);
	  }
	  return layout;
	}

	class HintField extends BookingBaseField {
	  constructor(value, onChange) {
	    super(new BX.Landing.UI.Field.Text({
	      title: main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_HINT_LABEL'),
	      textOnly: true,
	      content: value
	    }));
	    if (main_core.Type.isFunction(onChange)) {
	      this.getField().subscribe('onChange', () => onChange(this.getValue() || ''));
	    }
	    this.setValue(value);
	  }
	  setValue(value) {
	    super.setValue(value);
	  }
	}

	class HintVisibilityField extends BookingBaseField {
	  constructor(value, onChange) {
	    super(new BX.Landing.UI.Field.Checkbox({
	      selector: 'isVisibleHint',
	      compact: true,
	      multiple: false,
	      items: [{
	        name: main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_IS_VISIBLE_HINT_LABEL'),
	        value: 'isVisibleHint'
	      }]
	    }));
	    if (main_core.Type.isFunction(onChange)) {
	      this.getField().subscribe('onChange', () => onChange(Boolean(this.getValue())));
	    }
	    this.setValue(value);
	  }
	  setValue(value) {
	    super.setValue(value ? ['isVisibleHint'] : false);
	  }
	}

	class LabelField extends BookingBaseField {
	  constructor(value, onChange) {
	    super(new BX.Landing.UI.Field.Text({
	      title: main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_FIELD_LABEL'),
	      textOnly: true,
	      content: value
	    }));
	    if (main_core.Type.isFunction(onChange)) {
	      this.getField().subscribe('onChange', () => onChange(this.getValue() || ''));
	    }
	    this.setValue(value);
	  }
	  setValue(value) {
	    super.setValue(value);
	  }
	}

	class PlaceholderField extends BookingBaseField {
	  constructor(value, onChange) {
	    super(new BX.Landing.UI.Field.Text({
	      title: main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_FIELD_PLACEHOLDER'),
	      textOnly: true,
	      content: value
	    }));
	    if (main_core.Type.isFunction(onChange)) {
	      this.getField().subscribe('onChange', () => onChange(this.getValue() || ''));
	    }
	    this.setValue(value);
	  }
	  setValue(value) {
	    super.setValue(value);
	  }
	}

	var _editor = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("editor");
	var _catalogSkuEntityOptions = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("catalogSkuEntityOptions");
	var _onUpdateResources = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onUpdateResources");
	var _loadResourcesTypes = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("loadResourcesTypes");
	class SkusResourcesManager {
	  constructor(catalogSkuEntityOptions, onUpdateResources) {
	    Object.defineProperty(this, _loadResourcesTypes, {
	      value: _loadResourcesTypes2
	    });
	    Object.defineProperty(this, _editor, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _catalogSkuEntityOptions, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _onUpdateResources, {
	      writable: true,
	      value: Function
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _catalogSkuEntityOptions)[_catalogSkuEntityOptions] = catalogSkuEntityOptions;
	    babelHelpers.classPrivateFieldLooseBase(this, _onUpdateResources)[_onUpdateResources] = onUpdateResources;
	  }
	  open(resources) {
	    babelHelpers.classPrivateFieldLooseBase(this, _editor)[_editor] = new booking_application_skuResourcesEditor.SkuResourcesEditor({
	      title: main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_SKUS_RESOURCES_EDITOR_TITLE'),
	      description: main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_SKUS_RESOURCES_EDITOR_DESCRIPTION'),
	      options: {
	        editMode: true,
	        catalogSkuEntityOptions: babelHelpers.classPrivateFieldLooseBase(this, _catalogSkuEntityOptions)[_catalogSkuEntityOptions]
	      },
	      loadData: () => this.loadResources(resources),
	      save: data => this.saveResources(data)
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _editor)[_editor].open();
	  }
	  async loadResources(resources) {
	    await babelHelpers.classPrivateFieldLooseBase(this, _loadResourcesTypes)[_loadResourcesTypes]();
	    return booking_provider_service_crmFormService.crmFormService.getResourceSkuRelations(resources);
	  }
	  async saveResources(data = []) {
	    if (main_core.Type.isNil(data) || !main_core.Type.isArray(data.resources)) {
	      return;
	    }
	    const resources = data.resources.map(({
	      id,
	      skus
	    }) => {
	      return {
	        id,
	        skus: skus.map(sku => sku.id)
	      };
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _onUpdateResources)[_onUpdateResources](resources);
	  }
	}
	async function _loadResourcesTypes2() {
	  await booking_provider_service_crmFormService.crmFormService.getResourceTypeList();
	}

	let _ = t => t,
	  _t,
	  _t2,
	  _t3;
	var _skusEditorButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("skusEditorButton");
	var _getResources = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getResources");
	var _getBodyContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getBodyContainer");
	var _onUpdateResources$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onUpdateResources");
	var _skuResourcesManager = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("skuResourcesManager");
	var _skusAndResourcesCounterClassName = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("skusAndResourcesCounterClassName");
	var _skusCounterClassName = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("skusCounterClassName");
	var _resourcesCounterClassName = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("resourcesCounterClassName");
	var _showSkusResourcesEditor = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showSkusResourcesEditor");
	var _onUpdate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onUpdate");
	class SkusAndResourcesField {
	  constructor(options) {
	    Object.defineProperty(this, _onUpdate, {
	      value: _onUpdate2
	    });
	    Object.defineProperty(this, _showSkusResourcesEditor, {
	      value: _showSkusResourcesEditor2
	    });
	    Object.defineProperty(this, _resourcesCounterClassName, {
	      get: _get_resourcesCounterClassName,
	      set: void 0
	    });
	    Object.defineProperty(this, _skusCounterClassName, {
	      get: _get_skusCounterClassName,
	      set: void 0
	    });
	    Object.defineProperty(this, _skusAndResourcesCounterClassName, {
	      get: _get_skusAndResourcesCounterClassName,
	      set: void 0
	    });
	    Object.defineProperty(this, _skusEditorButton, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _getResources, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _getBodyContainer, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _onUpdateResources$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _skuResourcesManager, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _skuResourcesManager)[_skuResourcesManager] = new SkusResourcesManager(options.catalogSkuEntityOptions, babelHelpers.classPrivateFieldLooseBase(this, _onUpdate)[_onUpdate].bind(this));
	    babelHelpers.classPrivateFieldLooseBase(this, _getBodyContainer)[_getBodyContainer] = options.getBodyContainer;
	    babelHelpers.classPrivateFieldLooseBase(this, _getResources)[_getResources] = options.getResources;
	    babelHelpers.classPrivateFieldLooseBase(this, _onUpdateResources$1)[_onUpdateResources$1] = options.onUpdateResources;
	  }
	  render(isEmpty = false) {
	    const buttonLabel = isEmpty ? main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_SKUS_FIELD_ADD_BUTTON') : main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_SKUS_FIELD_CHANGE_BUTTON');
	    babelHelpers.classPrivateFieldLooseBase(this, _skusEditorButton)[_skusEditorButton] = main_core.Tag.render(_t || (_t = _`
			<button
				id="booking--crm-forms--services-editor-button"
				type="button"
				class="btn btn-primary g-btn-size-l"
				onclick="${0}"
			>
				${0}
			</button>
		`), babelHelpers.classPrivateFieldLooseBase(this, _showSkusResourcesEditor)[_showSkusResourcesEditor].bind(this), buttonLabel);
	    return main_core.Tag.render(_t2 || (_t2 = _`
			<div class="landing-ui-field d-flex">
				<div class="flex-grow-1">
					<div class="g-line-height-1_7 g-font-size-18 g-font-weight-500 g-color-gray-dark-v2">
						${0}
					</div>
					<div class="${0}">
						<div class="${0}"></div>
						<span>&#8226;</span>
						<div class="${0}"></div>
					</div>
				</div>
				<div style="align-self: flex-end">
					${0}
				</div>
			</div>
		`), main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_SKUS_FIELD_LABEL'), babelHelpers.classPrivateFieldLooseBase(this, _skusAndResourcesCounterClassName)[_skusAndResourcesCounterClassName], babelHelpers.classPrivateFieldLooseBase(this, _skusCounterClassName)[_skusCounterClassName], babelHelpers.classPrivateFieldLooseBase(this, _resourcesCounterClassName)[_resourcesCounterClassName], babelHelpers.classPrivateFieldLooseBase(this, _skusEditorButton)[_skusEditorButton]);
	  }
	  updateCounter() {
	    const counterEl = babelHelpers.classPrivateFieldLooseBase(this, _getBodyContainer)[_getBodyContainer]().querySelector(`.${babelHelpers.classPrivateFieldLooseBase(this, _skusAndResourcesCounterClassName)[_skusAndResourcesCounterClassName]}`);
	    if (!main_core.Type.isDomNode(counterEl)) {
	      return;
	    }
	    const resources = babelHelpers.classPrivateFieldLooseBase(this, _getResources)[_getResources]();
	    const skus = resources.reduce((skusSet, {
	      skus: skuIds
	    }) => {
	      skuIds.forEach(skuId => skusSet.add(skuId));
	      return skusSet;
	    }, new Set());
	    if (skus.size === 0 && resources.length === 0) {
	      counterEl.innerText = main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_SKUS_FIELD_EMPTY');
	      return;
	    }
	    const skusCount = main_core.Loc.getMessagePlural('BOOKING_CRM_FORMS_SETTINGS_SKUS_COUNT', skus.size, {
	      '#COUNT#': skus.size
	    });
	    const resourcesCount = main_core.Loc.getMessagePlural('BOOKING_CRM_FORMS_SETTINGS_RESOURCES_COUNT', resources.length, {
	      '#COUNT#': resources.length
	    });
	    const counterContent = main_core.Tag.render(_t3 || (_t3 = _`
			<div class="${0}">
				<div>${0}</div>
				<span>&#8226;</span>
				<div>${0}</div>
			</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _skusAndResourcesCounterClassName)[_skusAndResourcesCounterClassName], skusCount, resourcesCount);
	    main_core.Dom.replace(counterEl, counterContent);
	  }
	}
	function _get_skusAndResourcesCounterClassName() {
	  return 'crm-form--booking-skus-and-resources-count';
	}
	function _get_skusCounterClassName() {
	  return 'crm-form--booking-skus-count';
	}
	function _get_resourcesCounterClassName() {
	  return 'crm-form--booking-resources-count';
	}
	function _showSkusResourcesEditor2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _skuResourcesManager)[_skuResourcesManager].open(babelHelpers.classPrivateFieldLooseBase(this, _getResources)[_getResources]());
	}
	function _onUpdate2(resources) {
	  babelHelpers.classPrivateFieldLooseBase(this, _onUpdateResources$1)[_onUpdateResources$1](resources);
	  this.updateCounter();
	}

	class ContentHeader extends ui_entitySelector.BaseHeader {
	  constructor(...props) {
	    super(...props);
	    this.getContainer();
	  }
	  render() {
	    return this.options.content;
	  }
	}

	let _$1 = t => t,
	  _t$1;
	var _resources = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("resources");
	var _onClose = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onClose");
	var _onSave = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onSave");
	var _add = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("add");
	var _close = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("close");
	var _handleOnTagAdd = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleOnTagAdd");
	var _handleOnTagRemove = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleOnTagRemove");
	var _onResourceToggle = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onResourceToggle");
	class ResourceSelectorDialogFooter extends ui_entitySelector.BaseFooter {
	  constructor(tab, options) {
	    super(tab, options);
	    Object.defineProperty(this, _onResourceToggle, {
	      value: _onResourceToggle2
	    });
	    Object.defineProperty(this, _handleOnTagRemove, {
	      value: _handleOnTagRemove2
	    });
	    Object.defineProperty(this, _handleOnTagAdd, {
	      value: _handleOnTagAdd2
	    });
	    Object.defineProperty(this, _close, {
	      value: _close2
	    });
	    Object.defineProperty(this, _add, {
	      value: _add2
	    });
	    Object.defineProperty(this, _resources, {
	      writable: true,
	      value: []
	    });
	    Object.defineProperty(this, _onClose, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _onSave, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _resources)[_resources] = [];
	    babelHelpers.classPrivateFieldLooseBase(this, _onClose)[_onClose] = options.onClose || null;
	    babelHelpers.classPrivateFieldLooseBase(this, _onSave)[_onSave] = options.onSave || null;
	    this.getDialog().subscribe('Item:onSelect', babelHelpers.classPrivateFieldLooseBase(this, _handleOnTagAdd)[_handleOnTagAdd].bind(this));
	    this.getDialog().subscribe('Item:onDeselect', babelHelpers.classPrivateFieldLooseBase(this, _handleOnTagRemove)[_handleOnTagRemove].bind(this));
	  }
	  render() {
	    const {
	      footer,
	      footerAddButton,
	      footerCloseButton
	    } = main_core.Tag.render(_t$1 || (_t$1 = _$1`
			<div ref="footer" class="crm-forms--booking--resource-selector-dialog__footer">
				<button
					ref="footerAddButton"
					class="ui-btn ui-btn ui-btn-sm ui-btn-primary ui-btn-round crm-forms--booking--resource-selector-dialog__footer-btn-width"
				>
					${0}
				</button>
				<button ref="footerCloseButton" class="ui-btn ui-btn ui-btn-sm ui-btn-light-border ui-btn-round crm-forms--booking--resource-selector-dialog__footer-btn-width">
					${0}
				</button>
			</div>
		`), main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCE_SELECTOR_DIALOG_ADD_BUTTON'), main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCE_SELECTOR_DIALOG_CANCEL_BUTTON'));
	    this.footerAddButton = footerAddButton;
	    main_core.Event.bind(footerAddButton, 'click', babelHelpers.classPrivateFieldLooseBase(this, _add)[_add].bind(this));
	    this.footerCloseButton = footerCloseButton;
	    main_core.Event.bind(this.footerCloseButton, 'click', babelHelpers.classPrivateFieldLooseBase(this, _close)[_close].bind(this));
	    return footer;
	  }
	  get resourcesCount() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _resources)[_resources].length;
	  }
	  destroyDialog() {
	    main_core.Event.unbindAll(this.footerAddButton, 'click');
	    main_core.Event.unbindAll(this.footerCloseButton, 'click');
	    this.getDialog().destroy();
	  }
	}
	function _add2() {
	  const resources = this.dialog.getSelectedItems();
	  const resourceIds = resources.map(resource => resource.id);
	  if (main_core.Type.isFunction(babelHelpers.classPrivateFieldLooseBase(this, _onSave)[_onSave])) {
	    babelHelpers.classPrivateFieldLooseBase(this, _onSave)[_onSave]({
	      resourceIds
	    });
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _close)[_close]();
	}
	function _close2() {
	  var _this$dialog;
	  if (main_core.Type.isFunction(babelHelpers.classPrivateFieldLooseBase(this, _onClose)[_onClose])) {
	    babelHelpers.classPrivateFieldLooseBase(this, _onClose)[_onClose]();
	  }
	  (_this$dialog = this.dialog) == null ? void 0 : _this$dialog.hide();
	}
	function _handleOnTagAdd2(event) {
	  const {
	    item
	  } = event.getData();
	  babelHelpers.classPrivateFieldLooseBase(this, _onResourceToggle)[_onResourceToggle](item, true);
	}
	function _handleOnTagRemove2(event) {
	  const {
	    item
	  } = event.getData();
	  babelHelpers.classPrivateFieldLooseBase(this, _onResourceToggle)[_onResourceToggle](item, false);
	}
	function _onResourceToggle2(item, isSelected = false) {
	  if (isSelected) {
	    babelHelpers.classPrivateFieldLooseBase(this, _resources)[_resources] = [...babelHelpers.classPrivateFieldLooseBase(this, _resources)[_resources], item];
	  } else {
	    babelHelpers.classPrivateFieldLooseBase(this, _resources)[_resources] = babelHelpers.classPrivateFieldLooseBase(this, _resources)[_resources].filter(resource => resource.id !== item.id);
	  }
	}

	var _selector = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("selector");
	var _targetNode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("targetNode");
	var _selectedIds = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("selectedIds");
	var _selectedItems = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("selectedItems");
	var _onClose$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onClose");
	var _onSave$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onSave");
	var _changeSelected = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("changeSelected");
	class ResourcesSelector {
	  constructor(options) {
	    Object.defineProperty(this, _changeSelected, {
	      value: _changeSelected2
	    });
	    Object.defineProperty(this, _selector, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _targetNode, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _selectedIds, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _selectedItems, {
	      writable: true,
	      value: []
	    });
	    Object.defineProperty(this, _onClose$1, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _onSave$1, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _targetNode)[_targetNode] = options.targetNode;
	    babelHelpers.classPrivateFieldLooseBase(this, _selectedIds)[_selectedIds] = options.selectedIds || [];
	    babelHelpers.classPrivateFieldLooseBase(this, _selectedItems)[_selectedItems] = [];
	    babelHelpers.classPrivateFieldLooseBase(this, _onClose$1)[_onClose$1] = options.onClose;
	    babelHelpers.classPrivateFieldLooseBase(this, _onSave$1)[_onSave$1] = options.onSave;
	  }
	  getSelectedItems() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _selectedItems)[_selectedItems];
	  }
	  createSelector() {
	    babelHelpers.classPrivateFieldLooseBase(this, _selector)[_selector] = new ui_entitySelector.Dialog({
	      id: 'crm-forms--booking--booking-setting--resources-selector',
	      preselectedItems: babelHelpers.classPrivateFieldLooseBase(this, _selectedIds)[_selectedIds].map(id => [booking_const.EntitySelectorEntity.Resource, id]),
	      width: 400,
	      enableSearch: true,
	      dropdownMode: true,
	      context: 'crmFormsBookingResourcesSelector',
	      multiple: true,
	      cacheable: true,
	      showAvatars: false,
	      footer: ResourceSelectorDialogFooter,
	      footerOptions: {
	        onSave: babelHelpers.classPrivateFieldLooseBase(this, _onSave$1)[_onSave$1],
	        onClose: babelHelpers.classPrivateFieldLooseBase(this, _onClose$1)[_onClose$1]
	      },
	      entities: [{
	        id: booking_const.EntitySelectorEntity.Resource,
	        dynamicLoad: true,
	        dynamicSearch: true
	      }],
	      searchOptions: {
	        allowCreateItem: false
	      },
	      popupOptions: {
	        overlay: {
	          opacity: 40
	        }
	      },
	      events: {
	        onHide: this.hide.bind(this),
	        onLoad: babelHelpers.classPrivateFieldLooseBase(this, _changeSelected)[_changeSelected].bind(this)
	      }
	    });
	    return babelHelpers.classPrivateFieldLooseBase(this, _selector)[_selector];
	  }
	  getSelectedIds() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _selectedItems)[_selectedItems].map(({
	      id
	    }) => id);
	  }
	  hide() {
	    if (main_core.Type.isFunction(babelHelpers.classPrivateFieldLooseBase(this, _onClose$1)[_onClose$1])) {
	      babelHelpers.classPrivateFieldLooseBase(this, _onClose$1)[_onClose$1]();
	    }
	  }
	}
	function _changeSelected2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _selectedItems)[_selectedItems] = babelHelpers.classPrivateFieldLooseBase(this, _selector)[_selector].getSelectedItems();
	}

	let _$2 = t => t,
	  _t$2,
	  _t2$1,
	  _t3$1;
	const subHeaderClassName = 'crm-form--booking--resources-manager--header-resources-section';
	var _targetNode$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("targetNode");
	var _selectedIds$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("selectedIds");
	var _resourcesIds = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("resourcesIds");
	var _loadingResources = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("loadingResources");
	var _options = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("options");
	var _btnDeleteResources = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("btnDeleteResources");
	var _btnChangeResources = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("btnChangeResources");
	var _initDialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initDialog");
	var _selectItem = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("selectItem");
	var _deselectItem = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("deselectItem");
	var _deleteResources = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("deleteResources");
	var _appendEmptyState = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("appendEmptyState");
	var _removeEmptyState = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("removeEmptyState");
	var _updateResourcesCount = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateResourcesCount");
	var _loadResources = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("loadResources");
	var _addSelectedItems = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("addSelectedItems");
	var _setLoadingResources = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setLoadingResources");
	var _setResourceIds = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setResourceIds");
	var _openResourceSelector = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openResourceSelector");
	var _saveResourceSelector = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("saveResourceSelector");
	var _closeResourceSelector = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("closeResourceSelector");
	var _getHeaderContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getHeaderContent");
	var _appendSubHeaderContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("appendSubHeaderContent");
	var _showDeleteButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showDeleteButton");
	var _hideDeleteButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hideDeleteButton");
	var _removeSubHeadContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("removeSubHeadContent");
	class ResourcesManager {
	  constructor(options) {
	    Object.defineProperty(this, _removeSubHeadContent, {
	      value: _removeSubHeadContent2
	    });
	    Object.defineProperty(this, _hideDeleteButton, {
	      value: _hideDeleteButton2
	    });
	    Object.defineProperty(this, _showDeleteButton, {
	      value: _showDeleteButton2
	    });
	    Object.defineProperty(this, _appendSubHeaderContent, {
	      value: _appendSubHeaderContent2
	    });
	    Object.defineProperty(this, _getHeaderContent, {
	      value: _getHeaderContent2
	    });
	    Object.defineProperty(this, _closeResourceSelector, {
	      value: _closeResourceSelector2
	    });
	    Object.defineProperty(this, _saveResourceSelector, {
	      value: _saveResourceSelector2
	    });
	    Object.defineProperty(this, _openResourceSelector, {
	      value: _openResourceSelector2
	    });
	    Object.defineProperty(this, _setResourceIds, {
	      value: _setResourceIds2
	    });
	    Object.defineProperty(this, _setLoadingResources, {
	      value: _setLoadingResources2
	    });
	    Object.defineProperty(this, _addSelectedItems, {
	      value: _addSelectedItems2
	    });
	    Object.defineProperty(this, _loadResources, {
	      value: _loadResources2
	    });
	    Object.defineProperty(this, _updateResourcesCount, {
	      value: _updateResourcesCount2
	    });
	    Object.defineProperty(this, _removeEmptyState, {
	      value: _removeEmptyState2
	    });
	    Object.defineProperty(this, _appendEmptyState, {
	      value: _appendEmptyState2
	    });
	    Object.defineProperty(this, _deleteResources, {
	      value: _deleteResources2
	    });
	    Object.defineProperty(this, _deselectItem, {
	      value: _deselectItem2
	    });
	    Object.defineProperty(this, _selectItem, {
	      value: _selectItem2
	    });
	    Object.defineProperty(this, _initDialog, {
	      value: _initDialog2
	    });
	    this.dialog = null;
	    Object.defineProperty(this, _targetNode$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _selectedIds$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _resourcesIds, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _loadingResources, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _options, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _btnDeleteResources, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _btnChangeResources, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _resourcesIds)[_resourcesIds] = options.selectedIds || [];
	    babelHelpers.classPrivateFieldLooseBase(this, _selectedIds$1)[_selectedIds$1] = [];
	    babelHelpers.classPrivateFieldLooseBase(this, _targetNode$1)[_targetNode$1] = options.target;
	    babelHelpers.classPrivateFieldLooseBase(this, _options)[_options] = options;
	  }
	  async show() {
	    if (!this.dialog) {
	      babelHelpers.classPrivateFieldLooseBase(this, _initDialog)[_initDialog]();
	      await babelHelpers.classPrivateFieldLooseBase(this, _loadResources)[_loadResources](babelHelpers.classPrivateFieldLooseBase(this, _resourcesIds)[_resourcesIds]);
	      const renderInitialContent = babelHelpers.classPrivateFieldLooseBase(this, _resourcesIds)[_resourcesIds].length > 0 ? babelHelpers.classPrivateFieldLooseBase(this, _addSelectedItems)[_addSelectedItems].bind(this) : babelHelpers.classPrivateFieldLooseBase(this, _appendEmptyState)[_appendEmptyState].bind(this);
	      renderInitialContent();
	    }
	    this.dialog.show();
	    main_core.Event.bind(document, 'scroll', this.adjustPosition, true);
	  }
	  close() {
	    if (this.dialog) {
	      babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].onUpdateResourceIds(babelHelpers.classPrivateFieldLooseBase(this, _resourcesIds)[_resourcesIds]);
	      if (main_core.Type.isFunction(babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].onClose)) {
	        babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].onClose(babelHelpers.classPrivateFieldLooseBase(this, _resourcesIds)[_resourcesIds]);
	      }
	      this.dialog.destroy();
	      main_core.Event.unbind(document, 'scroll', this.adjustPosition, true);
	    }
	  }
	  adjustPosition() {
	    if (this.dialog) {
	      this.dialog.adjustPosition();
	    }
	  }
	  get selectedResources() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _resourcesIds)[_resourcesIds].length === 0) {
	      return [];
	    }
	    return resourceStore.getByIds(babelHelpers.classPrivateFieldLooseBase(this, _resourcesIds)[_resourcesIds]);
	  }
	}
	function _initDialog2() {
	  this.dialog = new ui_entitySelector.Dialog({
	    targetNode: babelHelpers.classPrivateFieldLooseBase(this, _targetNode$1)[_targetNode$1],
	    id: 'booking-crm-form-resource-selector',
	    height: Math.max(window.innerHeight - 300, 500),
	    width: 356,
	    offsetLeft: babelHelpers.classPrivateFieldLooseBase(this, _targetNode$1)[_targetNode$1].offsetWidth + 5,
	    offsetTop: -300,
	    addTagOnSelect: false,
	    showAvatars: false,
	    focusOnFirst: false,
	    dropdownMode: true,
	    enableSearch: true,
	    searchOptions: {
	      allowCreateItem: false
	    },
	    header: ContentHeader,
	    headerOptions: {
	      content: babelHelpers.classPrivateFieldLooseBase(this, _getHeaderContent)[_getHeaderContent]()
	    },
	    popupOptions: {
	      className: 'crm-form--booking--resource-manager-popup',
	      angle: {
	        position: 'left'
	      }
	    },
	    tagSelectorOptions: {
	      textBoxWidth: '90%',
	      placeholder: main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCE_MANAGER_SEARCH_PLACEHOLDER')
	    },
	    events: {
	      onHide: () => {
	        var _babelHelpers$classPr, _babelHelpers$classPr2;
	        return (_babelHelpers$classPr = (_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _options)[_options]).onClose) == null ? void 0 : _babelHelpers$classPr.call(_babelHelpers$classPr2, babelHelpers.classPrivateFieldLooseBase(this, _resourcesIds)[_resourcesIds]);
	      },
	      'Item:onSelect': event => {
	        babelHelpers.classPrivateFieldLooseBase(this, _selectItem)[_selectItem](event.getData().item);
	      },
	      'Item:onDeselect': event => {
	        babelHelpers.classPrivateFieldLooseBase(this, _deselectItem)[_deselectItem](event.getData().item);
	      }
	    }
	  });
	  if (babelHelpers.classPrivateFieldLooseBase(this, _resourcesIds)[_resourcesIds].length > 0) {
	    babelHelpers.classPrivateFieldLooseBase(this, _appendSubHeaderContent)[_appendSubHeaderContent]();
	  }
	  this.dialog.removeItems();
	}
	function _selectItem2(item) {
	  babelHelpers.classPrivateFieldLooseBase(this, _selectedIds$1)[_selectedIds$1].push(item.id);
	  if (babelHelpers.classPrivateFieldLooseBase(this, _selectedIds$1)[_selectedIds$1].length > 0) {
	    babelHelpers.classPrivateFieldLooseBase(this, _showDeleteButton)[_showDeleteButton]();
	  }
	}
	function _deselectItem2(item) {
	  babelHelpers.classPrivateFieldLooseBase(this, _selectedIds$1)[_selectedIds$1] = babelHelpers.classPrivateFieldLooseBase(this, _selectedIds$1)[_selectedIds$1].filter(id => id !== item.id);
	  if (babelHelpers.classPrivateFieldLooseBase(this, _selectedIds$1)[_selectedIds$1].length === 0) {
	    babelHelpers.classPrivateFieldLooseBase(this, _hideDeleteButton)[_hideDeleteButton]();
	  }
	}
	function _deleteResources2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _selectedIds$1)[_selectedIds$1].length === 0) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _setResourceIds)[_setResourceIds](babelHelpers.classPrivateFieldLooseBase(this, _resourcesIds)[_resourcesIds].filter(id => !babelHelpers.classPrivateFieldLooseBase(this, _selectedIds$1)[_selectedIds$1].includes(id)));
	  babelHelpers.classPrivateFieldLooseBase(this, _selectedIds$1)[_selectedIds$1] = [];
	  babelHelpers.classPrivateFieldLooseBase(this, _hideDeleteButton)[_hideDeleteButton]();
	}
	function _appendEmptyState2() {
	  const container = this.dialog.getPopup().getContentContainer();
	  if (main_core.Type.isDomNode(container.querySelector('.crm-forms--booking--resources-manager-empty-state'))) {
	    return;
	  }
	  const emptyState = main_core.Tag.render(_t$2 || (_t$2 = _$2`
			<div class="crm-forms--booking--resources-manager-empty-state d-flex h-100 w-100 justify-content-center">
				<div class="d-flex flex-column align-items-center p-4">
					<div class="mb-3 crm-forms--booking--resources-manager-empty-state_icon"></div>
					<div class="mb-3 crm-forms--booking--resources-manager-empty-state_title fw-medium fs-6 lh-base">
						${0}
					</div>
					<div class="mb-3 crm-forms--booking--resources-manager-empty-state_text fw-normal">
						${0}
					</div>
					<div>
						<button
							class="btn btn-primary g-btn-size-l crm-forms--booking--resources-manager__empty-state-btn-add"
							type="button"
							onclick="${0}"
						>
							${0}
						</button>
					</div>
				</div>
			</div>
		`), main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCE_MANAGER_EMPTY_TITLE'), main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCE_MANAGER_EMPTY_MESSAGE'), babelHelpers.classPrivateFieldLooseBase(this, _openResourceSelector)[_openResourceSelector].bind(this), main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCE_MANAGER_ADD_RESOURCES_BUTTON'));
	  main_core.Dom.insertBefore(emptyState, container.querySelector('.ui-selector-items'));
	}
	function _removeEmptyState2() {
	  const emptyStateEl = this.dialog.getPopup().getContentContainer().querySelector('.crm-forms--booking--resources-manager-empty-state');
	  removeElement(emptyStateEl);
	}
	function _updateResourcesCount2(resourcesCount) {
	  const resourcesCountEl = this.dialog.getPopup().getContentContainer().querySelector('.crm-form--booking--resources-manager--header-resources-count');
	  if (main_core.Type.isDomNode(resourcesCountEl)) {
	    resourcesCountEl.innerText = resourcesCount;
	  }
	}
	async function _loadResources2(ids) {
	  if (ids.length === 0) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _setLoadingResources)[_setLoadingResources](true);
	  await resourceStore.ensure(ids);
	  babelHelpers.classPrivateFieldLooseBase(this, _setLoadingResources)[_setLoadingResources](false);
	}
	function _addSelectedItems2() {
	  this.dialog.removeItems();
	  const resources = resourceStore.getByIds(babelHelpers.classPrivateFieldLooseBase(this, _resourcesIds)[_resourcesIds]);
	  for (const resource of resources) {
	    this.dialog.addItem({
	      id: resource.id,
	      entityId: booking_const.EntitySelectorEntity.Resource,
	      title: resource.name,
	      subtitle: resource.typeName,
	      tabs: booking_const.EntitySelectorTab.Recent
	    });
	  }
	}
	function _setLoadingResources2(loading) {
	  babelHelpers.classPrivateFieldLooseBase(this, _loadingResources)[_loadingResources] = loading;
	  if (babelHelpers.classPrivateFieldLooseBase(this, _loadingResources)[_loadingResources]) {
	    this.dialog.showLoader();
	  } else {
	    this.dialog.hideLoader();
	  }
	}
	function _setResourceIds2(selectedIds) {
	  babelHelpers.classPrivateFieldLooseBase(this, _resourcesIds)[_resourcesIds] = selectedIds;
	  babelHelpers.classPrivateFieldLooseBase(this, _addSelectedItems)[_addSelectedItems]();
	  babelHelpers.classPrivateFieldLooseBase(this, _updateResourcesCount)[_updateResourcesCount](selectedIds.length);
	  babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].onUpdateResourceIds(selectedIds);
	  if (selectedIds.length > 0) {
	    babelHelpers.classPrivateFieldLooseBase(this, _appendSubHeaderContent)[_appendSubHeaderContent]();
	    babelHelpers.classPrivateFieldLooseBase(this, _removeEmptyState)[_removeEmptyState]();
	  } else {
	    babelHelpers.classPrivateFieldLooseBase(this, _appendEmptyState)[_appendEmptyState]();
	    babelHelpers.classPrivateFieldLooseBase(this, _removeSubHeadContent)[_removeSubHeadContent]();
	  }
	}
	function _openResourceSelector2(event) {
	  const resourceSelector = new ResourcesSelector({
	    targetNode: (event == null ? void 0 : event.target) || null,
	    selectedIds: babelHelpers.classPrivateFieldLooseBase(this, _resourcesIds)[_resourcesIds],
	    onSave: babelHelpers.classPrivateFieldLooseBase(this, _saveResourceSelector)[_saveResourceSelector].bind(this),
	    onClose: babelHelpers.classPrivateFieldLooseBase(this, _closeResourceSelector)[_closeResourceSelector].bind(this)
	  }).createSelector();
	  this.dialog.freeze();
	  resourceSelector.show();
	}
	async function _saveResourceSelector2({
	  resourceIds
	}) {
	  await babelHelpers.classPrivateFieldLooseBase(this, _loadResources)[_loadResources](resourceIds);
	  babelHelpers.classPrivateFieldLooseBase(this, _setResourceIds)[_setResourceIds](resourceIds);
	}
	function _closeResourceSelector2() {
	  this.dialog.unfreeze();
	}
	function _getHeaderContent2() {
	  return main_core.Tag.render(_t2$1 || (_t2$1 = _$2`
			<div class="w-100 pt-3 px-3">
				<div class="d-flex align-items-end w-100">
					<h5 class="flex-grow-1">
						${0}
					</h5>
					<div
						class="landing-ui-button-icon-remove" 
						role="button"
						tabindex="0"
						onclick="${0}"
					></div>
				</div>
			</div>
		`), main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCE_MANAGER_HEADER_TITLE'), this.close.bind(this));
	}
	function _appendSubHeaderContent2() {
	  if (this.dialog.getPopup().getPopupContainer().querySelector(`.${subHeaderClassName}`)) {
	    return;
	  }
	  const buttonChangeResourcesLabel = main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCE_MANAGER_HEADER_ADD_RESOURCES_BUTTON', {
	    '#PLUS#': '+'
	  });
	  const buttonDeleteResourcesLabel = main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCE_MANAGER_HEADER_DELETE_RESOURCES_BUTTON', {
	    '#ICON#': '×'
	  });
	  const resourcesCount = main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCE_MANAGER_RESOURCES_COUNT', {
	    '#COUNT#': `<span class="crm-form--booking--resources-manager--header-resources-count">${babelHelpers.classPrivateFieldLooseBase(this, _resourcesIds)[_resourcesIds].length}</span>`
	  });
	  const {
	    root,
	    btnDeleteResources,
	    btnChangeResources
	  } = main_core.Tag.render(_t3$1 || (_t3$1 = _$2`
			<div class="${0} d-flex align-items-center">
				<div class="crm-form--booking--resources-manager--header-resources flex-grow-1">
					<span class="pr-2 crm-form--booking--resources-manager--header-resources-title">
						${0}
					</span>
				</div>
				<div>
					<button
						ref="btnDeleteResources"
						class="crm-form--booking--resources-manager--header__btn --none btn btn-outline-danger g-btn-size-sm"
						type="button"
						onclick="${0}"
					>
						${0}
					</button>
					<button
						ref="btnChangeResources"
						class="crm-form--booking--resources-manager--header__btn btn btn-primary g-btn-size-sm"
						type="button"
						onclick="${0}"
					>
						${0}
					</button>
				</div>
			</div>
		`), subHeaderClassName, resourcesCount, babelHelpers.classPrivateFieldLooseBase(this, _deleteResources)[_deleteResources].bind(this), buttonDeleteResourcesLabel, babelHelpers.classPrivateFieldLooseBase(this, _openResourceSelector)[_openResourceSelector].bind(this), buttonChangeResourcesLabel);
	  babelHelpers.classPrivateFieldLooseBase(this, _btnChangeResources)[_btnChangeResources] = btnChangeResources;
	  babelHelpers.classPrivateFieldLooseBase(this, _btnDeleteResources)[_btnDeleteResources] = btnDeleteResources;
	  const searchEl = this.dialog.getPopup().getPopupContainer().querySelector('.ui-selector-search');
	  main_core.Dom.insertAfter(root, searchEl);
	}
	function _showDeleteButton2() {
	  if (main_core.Type.isDomNode(babelHelpers.classPrivateFieldLooseBase(this, _btnDeleteResources)[_btnDeleteResources]) && main_core.Type.isDomNode(babelHelpers.classPrivateFieldLooseBase(this, _btnChangeResources)[_btnChangeResources])) {
	    main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _btnChangeResources)[_btnChangeResources], '--none');
	    main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _btnDeleteResources)[_btnDeleteResources], '--none');
	  }
	}
	function _hideDeleteButton2() {
	  if (main_core.Type.isDomNode(babelHelpers.classPrivateFieldLooseBase(this, _btnDeleteResources)[_btnDeleteResources]) && main_core.Type.isDomNode(babelHelpers.classPrivateFieldLooseBase(this, _btnChangeResources)[_btnChangeResources])) {
	    main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _btnChangeResources)[_btnChangeResources], '--none');
	    main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _btnDeleteResources)[_btnDeleteResources], '--none');
	  }
	}
	function _removeSubHeadContent2() {
	  const subHeadEl = document.querySelector(`.${subHeaderClassName}`);
	  removeElement(subHeadEl);
	}
	function removeElement(el) {
	  if (main_core.Type.isDomNode(el)) {
	    main_core.Dom.remove(el);
	  }
	}

	let _$3 = t => t,
	  _t$3,
	  _t2$2;
	var _getResourceIds = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getResourceIds");
	var _getBodyContainer$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getBodyContainer");
	var _onUpdateResourceIds = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onUpdateResourceIds");
	var _resourcesManagerButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("resourcesManagerButton");
	var _counterClassName = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("counterClassName");
	var _showResourcesManager = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showResourcesManager");
	var _updateResourceManagerButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateResourceManagerButton");
	class ResourcesField {
	  constructor({
	    getResourceIds,
	    onUpdateResourceIds,
	    getBodyContainer
	  }) {
	    Object.defineProperty(this, _updateResourceManagerButton, {
	      value: _updateResourceManagerButton2
	    });
	    Object.defineProperty(this, _showResourcesManager, {
	      value: _showResourcesManager2
	    });
	    Object.defineProperty(this, _counterClassName, {
	      get: _get_counterClassName,
	      set: void 0
	    });
	    Object.defineProperty(this, _getResourceIds, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _getBodyContainer$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _onUpdateResourceIds, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _resourcesManagerButton, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _getBodyContainer$1)[_getBodyContainer$1] = getBodyContainer;
	    babelHelpers.classPrivateFieldLooseBase(this, _getResourceIds)[_getResourceIds] = getResourceIds;
	    babelHelpers.classPrivateFieldLooseBase(this, _onUpdateResourceIds)[_onUpdateResourceIds] = onUpdateResourceIds;
	  }
	  render() {
	    const buttonLabel = babelHelpers.classPrivateFieldLooseBase(this, _getResourceIds)[_getResourceIds]().length > 0 ? main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCES_FIELD_CHANGE_BUTTON') : main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCES_FIELD_ADD_BUTTON');
	    babelHelpers.classPrivateFieldLooseBase(this, _resourcesManagerButton)[_resourcesManagerButton] = main_core.Tag.render(_t$3 || (_t$3 = _$3`
			<button
				id="booking--crm-forms--resource-manager-button"
				type="button"
				class="btn btn-primary g-btn-size-l"
				onclick="${0}"
			>
				${0}
			</button>
		`), babelHelpers.classPrivateFieldLooseBase(this, _showResourcesManager)[_showResourcesManager].bind(this), buttonLabel);
	    return main_core.Tag.render(_t2$2 || (_t2$2 = _$3`
			<div class="landing-ui-field d-flex">
				<div class="flex-grow-1">
					<div class="g-line-height-1_7 g-font-size-18 g-font-weight-500 g-color-gray-dark-v2">
						${0}
					</div>
					<div class="crm-form--booking-resources-count"></div>
				</div>
				<div style="align-self: flex-end">
					${0}
				</div>
			</div>
		`), main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCES_FIELD_LABEL'), babelHelpers.classPrivateFieldLooseBase(this, _resourcesManagerButton)[_resourcesManagerButton]);
	  }
	  updateCounter() {
	    const counterEl = (babelHelpers.classPrivateFieldLooseBase(this, _getBodyContainer$1)[_getBodyContainer$1]() || document).querySelector(`.${babelHelpers.classPrivateFieldLooseBase(this, _counterClassName)[_counterClassName]}`);
	    if (main_core.Type.isDomNode(counterEl)) {
	      counterEl.innerText = babelHelpers.classPrivateFieldLooseBase(this, _getResourceIds)[_getResourceIds]().length > 0 ? main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCES_FIELD_TEXT', {
	        '#COUNT#': babelHelpers.classPrivateFieldLooseBase(this, _getResourceIds)[_getResourceIds]().length
	      }) : main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCES_FIELD_EMPTY');
	    }
	  }
	}
	function _get_counterClassName() {
	  return 'crm-form--booking-resources-count';
	}
	function _showResourcesManager2() {
	  const resourcesManager = new ResourcesManager({
	    target: babelHelpers.classPrivateFieldLooseBase(this, _resourcesManagerButton)[_resourcesManagerButton],
	    selectedIds: babelHelpers.classPrivateFieldLooseBase(this, _getResourceIds)[_getResourceIds](),
	    onUpdateResourceIds: resourceIds => {
	      babelHelpers.classPrivateFieldLooseBase(this, _onUpdateResourceIds)[_onUpdateResourceIds](resourceIds);
	      this.updateCounter();
	      babelHelpers.classPrivateFieldLooseBase(this, _updateResourceManagerButton)[_updateResourceManagerButton]();
	    }
	  });
	  resourcesManager.show();
	}
	function _updateResourceManagerButton2() {
	  if (main_core.Type.isDomNode(babelHelpers.classPrivateFieldLooseBase(this, _resourcesManagerButton)[_resourcesManagerButton])) {
	    babelHelpers.classPrivateFieldLooseBase(this, _resourcesManagerButton)[_resourcesManagerButton].innerText = babelHelpers.classPrivateFieldLooseBase(this, _getResourceIds)[_getResourceIds]().length > 0 ? main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCES_FIELD_CHANGE_BUTTON') : main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCES_FIELD_ADD_BUTTON');
	  }
	}

	let _$4 = t => t,
	  _t$4;
	var _options$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("options");
	var _layout = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("layout");
	var _bookingSettingsDataModel = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bookingSettingsDataModel");
	var _isAutoSelectionOn$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isAutoSelectionOn");
	var _templateId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("templateId");
	var _resourceLoader = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("resourceLoader");
	var _loadingResources$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("loadingResources");
	var _catalogSkuEntityOptions$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("catalogSkuEntityOptions");
	var _managerField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("managerField");
	var _initFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initFields");
	var _templateWithSkus = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("templateWithSkus");
	var _loadResources$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("loadResources");
	var _loadSkus = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("loadSkus");
	var _setLoadingResources$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setLoadingResources");
	var _filterAvailableResourceIds = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("filterAvailableResourceIds");
	var _getHeaderContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getHeaderContainer");
	var _getBodyContainer$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getBodyContainer");
	var _renderContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderContent");
	var _renderSkuField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderSkuField");
	var _renderResourceField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderResourceField");
	var _getResourceIds$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getResourceIds");
	var _getResources$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getResources");
	var _setResourceIds$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setResourceIds");
	var _setResources = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setResources");
	var _renderLabelField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderLabelField");
	var _renderPlaceholderField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderPlaceholderField");
	var _renderHintField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderHintField");
	var _renderIsVisibleHint = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderIsVisibleHint");
	var _renderHasSlotsAllAvailableResources = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderHasSlotsAllAvailableResources");
	var _renderSkuLabelField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderSkuLabelField");
	var _renderSkuPlaceholderField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderSkuPlaceholderField");
	var _renderSkuHintField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderSkuHintField");
	var _renderIsVisibleSkuHint = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderIsVisibleSkuHint");
	var _updateSettings = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateSettings");
	class BookingSettingsPopup extends main_core_events.EventEmitter {
	  constructor({
	    listItemOptions,
	    isAutoSelectionOn,
	    templateId
	  }) {
	    super();
	    Object.defineProperty(this, _updateSettings, {
	      value: _updateSettings2
	    });
	    Object.defineProperty(this, _renderIsVisibleSkuHint, {
	      value: _renderIsVisibleSkuHint2
	    });
	    Object.defineProperty(this, _renderSkuHintField, {
	      value: _renderSkuHintField2
	    });
	    Object.defineProperty(this, _renderSkuPlaceholderField, {
	      value: _renderSkuPlaceholderField2
	    });
	    Object.defineProperty(this, _renderSkuLabelField, {
	      value: _renderSkuLabelField2
	    });
	    Object.defineProperty(this, _renderHasSlotsAllAvailableResources, {
	      value: _renderHasSlotsAllAvailableResources2
	    });
	    Object.defineProperty(this, _renderIsVisibleHint, {
	      value: _renderIsVisibleHint2
	    });
	    Object.defineProperty(this, _renderHintField, {
	      value: _renderHintField2
	    });
	    Object.defineProperty(this, _renderPlaceholderField, {
	      value: _renderPlaceholderField2
	    });
	    Object.defineProperty(this, _renderLabelField, {
	      value: _renderLabelField2
	    });
	    Object.defineProperty(this, _setResources, {
	      value: _setResources2
	    });
	    Object.defineProperty(this, _setResourceIds$1, {
	      value: _setResourceIds2$1
	    });
	    Object.defineProperty(this, _getResources$1, {
	      value: _getResources2
	    });
	    Object.defineProperty(this, _getResourceIds$1, {
	      value: _getResourceIds2
	    });
	    Object.defineProperty(this, _renderResourceField, {
	      value: _renderResourceField2
	    });
	    Object.defineProperty(this, _renderSkuField, {
	      value: _renderSkuField2
	    });
	    Object.defineProperty(this, _renderContent, {
	      value: _renderContent2
	    });
	    Object.defineProperty(this, _getBodyContainer$2, {
	      value: _getBodyContainer2
	    });
	    Object.defineProperty(this, _getHeaderContainer, {
	      value: _getHeaderContainer2
	    });
	    Object.defineProperty(this, _filterAvailableResourceIds, {
	      value: _filterAvailableResourceIds2
	    });
	    Object.defineProperty(this, _setLoadingResources$1, {
	      value: _setLoadingResources2$1
	    });
	    Object.defineProperty(this, _loadSkus, {
	      value: _loadSkus2
	    });
	    Object.defineProperty(this, _loadResources$1, {
	      value: _loadResources2$1
	    });
	    Object.defineProperty(this, _templateWithSkus, {
	      get: _get_templateWithSkus,
	      set: void 0
	    });
	    Object.defineProperty(this, _initFields, {
	      value: _initFields2
	    });
	    Object.defineProperty(this, _options$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _layout, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _bookingSettingsDataModel, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _isAutoSelectionOn$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _templateId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _resourceLoader, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _loadingResources$1, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _catalogSkuEntityOptions$1, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _managerField, {
	      writable: true,
	      value: void 0
	    });
	    this.setEventNamespace('BX.Booking.CrmForm.PublicForm.BookingSettingsPopup');
	    babelHelpers.classPrivateFieldLooseBase(this, _options$1)[_options$1] = listItemOptions;
	    babelHelpers.classPrivateFieldLooseBase(this, _isAutoSelectionOn$1)[_isAutoSelectionOn$1] = isAutoSelectionOn;
	    babelHelpers.classPrivateFieldLooseBase(this, _templateId)[_templateId] = templateId;
	    babelHelpers.classPrivateFieldLooseBase(this, _bookingSettingsDataModel)[_bookingSettingsDataModel] = new BookingSettingsDataModel(listItemOptions.sourceOptions.settingsData || {}, isAutoSelectionOn, templateId);
	    babelHelpers.classPrivateFieldLooseBase(this, _initFields)[_initFields](babelHelpers.classPrivateFieldLooseBase(this, _bookingSettingsDataModel)[_bookingSettingsDataModel].form);
	  }
	  async show() {
	    await babelHelpers.classPrivateFieldLooseBase(this, _loadResources$1)[_loadResources$1](babelHelpers.classPrivateFieldLooseBase(this, _getResourceIds$1)[_getResourceIds$1]());
	    if (babelHelpers.classPrivateFieldLooseBase(this, _templateWithSkus)[_templateWithSkus]) {
	      await babelHelpers.classPrivateFieldLooseBase(this, _loadSkus)[_loadSkus]();
	    }
	    const container = babelHelpers.classPrivateFieldLooseBase(this, _getBodyContainer$2)[_getBodyContainer$2]();
	    main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _renderContent)[_renderContent](), container);
	    BX.UI.Hint.init(container);
	    babelHelpers.classPrivateFieldLooseBase(this, _managerField)[_managerField].updateCounter();
	    main_core.Dom.style(container, 'display', 'block');
	  }
	  close() {
	    const container = babelHelpers.classPrivateFieldLooseBase(this, _getBodyContainer$2)[_getBodyContainer$2]();
	    this.emit('onClose');
	    main_core.Dom.style(container, 'display', 'none');
	    main_core.Dom.clean(container);
	  }
	  getSettings() {
	    babelHelpers.classPrivateFieldLooseBase(this, _updateSettings)[_updateSettings]();
	    return babelHelpers.classPrivateFieldLooseBase(this, _options$1)[_options$1].sourceOptions.settingsData;
	  }
	}
	function _initFields2(settingsData) {
	  const changeField = field => {
	    babelHelpers.classPrivateFieldLooseBase(this, _updateSettings)[_updateSettings](field);
	  };
	  babelHelpers.classPrivateFieldLooseBase(this, _layout)[_layout] = {};
	  babelHelpers.classPrivateFieldLooseBase(this, _layout)[_layout].label = new LabelField(settingsData.label || '', label => changeField({
	    label
	  }));
	  babelHelpers.classPrivateFieldLooseBase(this, _layout)[_layout].placeholder = new PlaceholderField(settingsData.textHeader || '', textHeader => changeField({
	    textHeader
	  }));
	  babelHelpers.classPrivateFieldLooseBase(this, _layout)[_layout].hint = new HintField(settingsData.hint || '', hint => changeField({
	    hint
	  }));
	  babelHelpers.classPrivateFieldLooseBase(this, _layout)[_layout].isVisibleHint = new HintVisibilityField(Boolean(settingsData == null ? void 0 : settingsData.isVisibleHint), isVisibleHint => changeField({
	    isVisibleHint
	  }));
	  babelHelpers.classPrivateFieldLooseBase(this, _layout)[_layout].hasSlotsAllAvailableResources = new HasSlotsAllAvailableResourcesField(Boolean(settingsData == null ? void 0 : settingsData.hasSlotsAllAvailableResources), hasSlotsAllAvailableResources => changeField({
	    hasSlotsAllAvailableResources
	  }), babelHelpers.classPrivateFieldLooseBase(this, _isAutoSelectionOn$1)[_isAutoSelectionOn$1]);
	  babelHelpers.classPrivateFieldLooseBase(this, _layout)[_layout].sku = {};
	  babelHelpers.classPrivateFieldLooseBase(this, _layout)[_layout].sku.label = new LabelField(settingsData.skuLabel || '', skuLabel => changeField({
	    skuLabel
	  }));
	  babelHelpers.classPrivateFieldLooseBase(this, _layout)[_layout].sku.placeholder = new PlaceholderField(settingsData.skuTextHeader || '', skuTextHeader => changeField({
	    skuTextHeader
	  }));
	  babelHelpers.classPrivateFieldLooseBase(this, _layout)[_layout].sku.hint = new HintField(settingsData.skuHint || '', skuHint => changeField({
	    skuHint
	  }));
	  babelHelpers.classPrivateFieldLooseBase(this, _layout)[_layout].sku.isVisibleHint = new HintVisibilityField(Boolean(settingsData == null ? void 0 : settingsData.isVisibleSkuHint), isVisibleSkuHint => changeField({
	    isVisibleSkuHint
	  }));
	}
	function _get_templateWithSkus() {
	  return booking_const.CrmFormTemplatesWithSku.includes(babelHelpers.classPrivateFieldLooseBase(this, _templateId)[_templateId]);
	}
	async function _loadResources2$1(ids) {
	  if (ids.length === 0) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _setLoadingResources$1)[_setLoadingResources$1](true);
	  await resourceStore.ensure(babelHelpers.classPrivateFieldLooseBase(this, _getResourceIds$1)[_getResourceIds$1]());
	  babelHelpers.classPrivateFieldLooseBase(this, _setResourceIds$1)[_setResourceIds$1](babelHelpers.classPrivateFieldLooseBase(this, _filterAvailableResourceIds)[_filterAvailableResourceIds](ids));
	  babelHelpers.classPrivateFieldLooseBase(this, _setLoadingResources$1)[_setLoadingResources$1](false);
	}
	async function _loadSkus2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _setLoadingResources$1)[_setLoadingResources$1](true);
	  babelHelpers.classPrivateFieldLooseBase(this, _catalogSkuEntityOptions$1)[_catalogSkuEntityOptions$1] = await booking_provider_service_crmFormService.crmFormService.getCatalogSkuEntityOptions();
	  babelHelpers.classPrivateFieldLooseBase(this, _setLoadingResources$1)[_setLoadingResources$1](false);
	}
	function _setLoadingResources2$1(loading) {
	  const container = babelHelpers.classPrivateFieldLooseBase(this, _getHeaderContainer)[_getHeaderContainer]();
	  babelHelpers.classPrivateFieldLooseBase(this, _loadingResources$1)[_loadingResources$1] = loading;
	  if (babelHelpers.classPrivateFieldLooseBase(this, _loadingResources$1)[_loadingResources$1]) {
	    var _babelHelpers$classPr, _babelHelpers$classPr2;
	    (_babelHelpers$classPr2 = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _resourceLoader))[_resourceLoader]) != null ? _babelHelpers$classPr2 : _babelHelpers$classPr[_resourceLoader] = new main_loader.Loader({
	      size: 40
	    });
	    main_core.Dom.style(container, 'opacity', 0.8);
	    void babelHelpers.classPrivateFieldLooseBase(this, _resourceLoader)[_resourceLoader].show(container);
	  } else {
	    main_core.Dom.style(container, 'opacity', 1);
	    void babelHelpers.classPrivateFieldLooseBase(this, _resourceLoader)[_resourceLoader].hide();
	  }
	}
	function _filterAvailableResourceIds2(ids) {
	  const availableResources = resourceStore.getAll();
	  const availableResourceIds = new Set(availableResources.map(resource => resource.id));
	  return ids.filter(id => availableResourceIds.has(id));
	}
	function _getHeaderContainer2() {
	  return document.querySelector(`.landing-ui-component-list-item[data-id="${babelHelpers.classPrivateFieldLooseBase(this, _options$1)[_options$1].id}"] .landing-ui-component-list-item-header`);
	}
	function _getBodyContainer2() {
	  return document.querySelector(`.landing-ui-component-list-item[data-id="${babelHelpers.classPrivateFieldLooseBase(this, _options$1)[_options$1].id}"] .landing-ui-component-list-item-body`);
	}
	function _renderContent2() {
	  return main_core.Tag.render(_t$4 || (_t$4 = _$4`
			<div class="landing-ui-form landing-ui-form-form-settings booking-crm-forms-settings">
				<div class="landing-ui-form-description"></div>
				${0}
				${0}
				${0}
				${0}
				${0}
				${0}
				${0}
				${0}
				${0}
				${0}
				${0}
			</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _templateWithSkus)[_templateWithSkus] ? babelHelpers.classPrivateFieldLooseBase(this, _renderSkuField)[_renderSkuField]() : babelHelpers.classPrivateFieldLooseBase(this, _renderResourceField)[_renderResourceField](), babelHelpers.classPrivateFieldLooseBase(this, _renderSkuLabelField)[_renderSkuLabelField](), babelHelpers.classPrivateFieldLooseBase(this, _renderSkuPlaceholderField)[_renderSkuPlaceholderField](), babelHelpers.classPrivateFieldLooseBase(this, _renderSkuHintField)[_renderSkuHintField](), babelHelpers.classPrivateFieldLooseBase(this, _renderIsVisibleSkuHint)[_renderIsVisibleSkuHint](), babelHelpers.classPrivateFieldLooseBase(this, _templateWithSkus)[_templateWithSkus] ? '<div class="booking-crm-forms-settings-field-divider"></div>' : '', babelHelpers.classPrivateFieldLooseBase(this, _renderLabelField)[_renderLabelField](), babelHelpers.classPrivateFieldLooseBase(this, _renderPlaceholderField)[_renderPlaceholderField](), babelHelpers.classPrivateFieldLooseBase(this, _renderHintField)[_renderHintField](), babelHelpers.classPrivateFieldLooseBase(this, _renderIsVisibleHint)[_renderIsVisibleHint](), babelHelpers.classPrivateFieldLooseBase(this, _renderHasSlotsAllAvailableResources)[_renderHasSlotsAllAvailableResources]());
	}
	function _renderSkuField2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _managerField)[_managerField] = new SkusAndResourcesField({
	    catalogSkuEntityOptions: babelHelpers.classPrivateFieldLooseBase(this, _catalogSkuEntityOptions$1)[_catalogSkuEntityOptions$1],
	    getResources: babelHelpers.classPrivateFieldLooseBase(this, _getResources$1)[_getResources$1].bind(this),
	    getBodyContainer: babelHelpers.classPrivateFieldLooseBase(this, _getBodyContainer$2)[_getBodyContainer$2].bind(this),
	    onUpdateResources: resources => {
	      babelHelpers.classPrivateFieldLooseBase(this, _setResources)[_setResources](resources);
	      babelHelpers.classPrivateFieldLooseBase(this, _updateSettings)[_updateSettings]();
	    }
	  });
	  return babelHelpers.classPrivateFieldLooseBase(this, _managerField)[_managerField].render();
	}
	function _renderResourceField2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _managerField)[_managerField] = new ResourcesField({
	    getResourceIds: babelHelpers.classPrivateFieldLooseBase(this, _getResourceIds$1)[_getResourceIds$1].bind(this),
	    getBodyContainer: babelHelpers.classPrivateFieldLooseBase(this, _getBodyContainer$2)[_getBodyContainer$2].bind(this),
	    onUpdateResourceIds: resourceIds => {
	      babelHelpers.classPrivateFieldLooseBase(this, _setResourceIds$1)[_setResourceIds$1](resourceIds);
	      babelHelpers.classPrivateFieldLooseBase(this, _updateSettings)[_updateSettings]();
	    }
	  });
	  return babelHelpers.classPrivateFieldLooseBase(this, _managerField)[_managerField].render();
	}
	function _getResourceIds2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _bookingSettingsDataModel)[_bookingSettingsDataModel].form.resourceIds;
	}
	function _getResources2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _bookingSettingsDataModel)[_bookingSettingsDataModel].form.resources;
	}
	function _setResourceIds2$1(resourceIds) {
	  babelHelpers.classPrivateFieldLooseBase(this, _bookingSettingsDataModel)[_bookingSettingsDataModel].setSettingsData({
	    resourceIds: main_core.Type.isArray(resourceIds) ? resourceIds : []
	  });
	  babelHelpers.classPrivateFieldLooseBase(this, _updateSettings)[_updateSettings]();
	}
	function _setResources2(resources) {
	  babelHelpers.classPrivateFieldLooseBase(this, _bookingSettingsDataModel)[_bookingSettingsDataModel].setSettingsData({
	    resources: main_core.Type.isArray(resources) ? resources : []
	  });
	  babelHelpers.classPrivateFieldLooseBase(this, _updateSettings)[_updateSettings]();
	}
	function _renderLabelField2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _layout)[_layout].label.getLayout();
	}
	function _renderPlaceholderField2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _layout)[_layout].placeholder.getLayout();
	}
	function _renderHintField2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isAutoSelectionOn$1)[_isAutoSelectionOn$1] && !babelHelpers.classPrivateFieldLooseBase(this, _bookingSettingsDataModel)[_bookingSettingsDataModel].form.hint) {
	    babelHelpers.classPrivateFieldLooseBase(this, _layout)[_layout].hint.setValue(main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_HINT_DEFAULT_VALUE'));
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _layout)[_layout].hint.getLayout();
	}
	function _renderIsVisibleHint2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _layout)[_layout].isVisibleHint.getLayout();
	}
	function _renderHasSlotsAllAvailableResources2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _layout)[_layout].hasSlotsAllAvailableResources.getLayout();
	}
	function _renderSkuLabelField2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _templateWithSkus)[_templateWithSkus]) {
	    return null;
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _layout)[_layout].sku.label.getLayout();
	}
	function _renderSkuPlaceholderField2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _templateWithSkus)[_templateWithSkus]) {
	    return null;
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _layout)[_layout].sku.placeholder.getLayout();
	}
	function _renderSkuHintField2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _templateWithSkus)[_templateWithSkus]) {
	    return null;
	  }
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isAutoSelectionOn$1)[_isAutoSelectionOn$1] && !babelHelpers.classPrivateFieldLooseBase(this, _bookingSettingsDataModel)[_bookingSettingsDataModel].form.skuHint) {
	    babelHelpers.classPrivateFieldLooseBase(this, _layout)[_layout].sku.hint.setValue('');
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _layout)[_layout].sku.hint.getLayout();
	}
	function _renderIsVisibleSkuHint2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _layout)[_layout].sku.isVisibleHint.getLayout();
	}
	function _updateSettings2(settings = null) {
	  babelHelpers.classPrivateFieldLooseBase(this, _bookingSettingsDataModel)[_bookingSettingsDataModel].setSettingsData(settings);
	  babelHelpers.classPrivateFieldLooseBase(this, _options$1)[_options$1].sourceOptions.settingsData = {
	    ...babelHelpers.classPrivateFieldLooseBase(this, _options$1)[_options$1].sourceOptions.settingsData,
	    isAutoSelectionOn: babelHelpers.classPrivateFieldLooseBase(this, _isAutoSelectionOn$1)[_isAutoSelectionOn$1],
	    ...babelHelpers.classPrivateFieldLooseBase(this, _bookingSettingsDataModel)[_bookingSettingsDataModel].settingsData
	  };
	  this.emit('onChange');
	  babelHelpers.classPrivateFieldLooseBase(this, _options$1)[_options$1].form.emit('onChange');
	}

	var _isAutoSelectionOn$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isAutoSelectionOn");
	var _options$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("options");
	class Settings {
	  constructor(listItemOptions, formOptions = {}) {
	    var _formOptions$bookingR;
	    Object.defineProperty(this, _isAutoSelectionOn$2, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _options$2, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _options$2)[_options$2] = listItemOptions;
	    babelHelpers.classPrivateFieldLooseBase(this, _isAutoSelectionOn$2)[_isAutoSelectionOn$2] = Boolean(formOptions == null ? void 0 : (_formOptions$bookingR = formOptions.bookingResourceAutoSelection) == null ? void 0 : _formOptions$bookingR.use);
	    this.settingsPopup = new BookingSettingsPopup({
	      listItemOptions,
	      isAutoSelectionOn: babelHelpers.classPrivateFieldLooseBase(this, _isAutoSelectionOn$2)[_isAutoSelectionOn$2],
	      templateId: formOptions == null ? void 0 : formOptions.templateId
	    });
	  }
	  getSettings() {
	    return this.settingsPopup.getSettings();
	  }
	  showSettingsPopup() {
	    const isToolDisabled = main_core.Extension.getSettings('booking.crm-forms.settings').isToolDisabled;
	    if (isToolDisabled) {
	      main_core.Runtime.loadExtension('ui.info-helper').then(({
	        InfoHelper
	      }) => {
	        InfoHelper.show('limit_v2_booking_off');
	      }).catch(err => {
	        console.error(err);
	      });
	      return;
	    }
	    const container = document.querySelector(`.landing-ui-component-list-item[data-id="${babelHelpers.classPrivateFieldLooseBase(this, _options$2)[_options$2].id}"] .landing-ui-component-list-item-body`);
	    if (main_core.Dom.style(container, 'display') === 'block') {
	      this.settingsPopup.close();
	    } else {
	      this.settingsPopup.show();
	    }
	  }
	}

	exports.Settings = Settings;

}((this.BX.Booking.CrmForms = this.BX.Booking.CrmForms || {}),BX,BX.Booking.Application,BX.Booking.Provider.Service,BX.Event,BX.Booking.Const,BX,BX.UI.EntitySelector));
//# sourceMappingURL=settings.bundle.js.map
