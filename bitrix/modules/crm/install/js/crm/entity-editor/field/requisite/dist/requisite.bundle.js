/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, ui_dialogs_messagebox, ui_entityEditor, crm_common, crm_entityEditor, crm_entityEditor_field_requisite_autocomplete, main_popup, main_loader, ui_dropdown, crm_entityEditor_field_address, crm_entityEditor_field_address_base) {
	'use strict';

	class RequisiteList extends main_core_events.EventEmitter {
		constructor() {
			super();
			this.setEventNamespace('BX.Crm.EntityEditorRequisiteField.RequisiteList');
			this._items = [];
			this.CHANGE_EVENT = 'onChange';
		}
		initialize(value, settings) {
			if (!main_core.Type.isArray(value)) {
				value = [];
			}
			for (let item of value) {
				let listItem = RequisiteListItem.create(item);
				this._items.push(listItem);
			}
		}
		getList() {
			return this._items.filter(item => !item.isDeleted());
		}
		getListWithDeleted() {
			return this._items;
		}
		isEmpty() {
			return !this.getList().length;
		}
		getSelected() {
			let selectedId = this.getSelectedId();
			return this.getById(selectedId);
		}
		getSelectedId() {
			let list = this.getList();
			if (!list.length) {
				return null;
			}
			for (let index = 0; index < list.length; index++) {
				let requisite = list[index];
				if (requisite.isSelected()) {
					return index;
				}
			}
			return 0; // first element by default
		}
		getById(id) {
			let list = this.getList();
			if (null === id) {
				return null;
			}
			if (id >= 0 && id < list.length) {
				return list[id];
			}
			return null;
		}
		getByRequisiteId(requisiteId) {
			let list = this.getList();
			return list.filter(item => item.getRequisiteId() == requisiteId).reduce((prev, current) => current, null);
		}
		setSelected(requisiteId, bankDetailsId) {
			let requisite = this.getById(requisiteId);
			if (requisite) {
				for (let item of this.getList()) {
					let selected = item === requisite;
					item.setSelected(selected);
					if (selected) {
						item.setSelectedBankDetails(main_core.Type.isNull(bankDetailsId) ? requisite.getSelectedBankDetailId() : bankDetailsId);
					}
				}
				this.notifyListChanged();
			}
		}
		getNewRequisiteId() {
			let maxExistedId = this.getList().reduce((prevId, item) => {
				let requisiteId = item.getRequisiteIdAsString();
				let match = requisiteId ? requisiteId.match(RequisiteListItem.newRequisitePattern) : false;
				let currentId = match && match[1] ? match[1] : -1;
				return Math.max(prevId, currentId);
			}, -1);
			return 'n' + (parseInt(maxExistedId) + 1);
		}
		indexOf(item) {
			return this._items.indexOf(item);
		}
		add(item) {
			this._items.push(item);
			if (!item.isAddressOnly()) {
				this.setSelected(this._items.indexOf(item));
			} else {
				this.notifyListChanged();
			}
		}
		remove(item) {
			let index = this._items.indexOf(item);
			if (index >= 0) {
				this._items.splice(index, 1);
			}
			this.notifyListChanged();
		}
		removePostponed(item) {
			let index = this._items.indexOf(item);
			if (index >= 0) {
				item.setDeleted(true);
			}
			this.notifyListChanged();
		}
		hide(item) {
			let index = this._items.indexOf(item);
			if (index >= 0) {
				item.setAddressOnly(true);
				item.setChanged(true);
			}
			this.notifyListChanged();
		}
		unhide(item) {
			let index = this._items.indexOf(item);
			if (index >= 0) {
				item.setAddressOnly(false);
				item.setChanged(true);
			}
			this.notifyListChanged();
		}
		notifyListChanged() {
			this.emit(this.CHANGE_EVENT);
		}
		exportToModel() {
			let result = [];
			for (let item of this._items) {
				let exportedItem = item.exportToModel();
				result.push({
					...exportedItem
				});
			}
			return result;
		}
		static create(value, settings) {
			let self = new RequisiteList();
			self.initialize(value, settings);
			return self;
		}
	}
	class RequisiteListItem {
		constructor() {
			this._data = null;
		}
		initialize(value, settings) {
			if (main_core.Type.isPlainObject(value)) {
				this._data = {
					...value
				};
				this._data.isNew = false;
				this._data.isChanged = false;
				this._data.isDeleted = false;
				this._data.isAddressOnly = false;
				this._data.formData = {};
				this._data.addressData = {};
				if (!main_core.Type.isPlainObject(this._data.autocompleteState)) {
					this._data.autocompleteState = {};
				}
			} else {
				// new empty requisite
				this._data = {
					isNew: true,
					isChanged: false,
					isDeleted: false,
					isAddressOnly: false,
					selected: false,
					presetId: null,
					requisiteId: BX.prop.getString(settings, 'newRequisiteId', 'n0'),
					requisiteData: '',
					requisiteDataSign: '',
					bankDetails: [],
					bankDetailIdSelected: 0,
					addressList: {},
					value: {},
					title: '',
					subtitle: '',
					autocompleteState: {},
					formData: {},
					addressData: {}
				};
				let extraData = BX.prop.getObject(settings, 'newRequisiteExtraFields', {});
				this._data = {
					...this._data,
					...extraData
				};
			}
			this._data.initialAddressDdta = null;
			this.prepareViewData(this._data);
		}
		prepareViewData() {
			try {
				this._data.value = this._data.requisiteData ? JSON.parse(this._data.requisiteData) : {};
			} catch (e) {
				this._data.value = {};
			}
			if (main_core.Type.isPlainObject(this._data.value) && main_core.Type.isPlainObject(this._data.value.viewData)) {
				this._data.title = this._data.value.viewData.title;
				this._data.subtitle = this._data.value.viewData.subtitle;
			}
			if (this.getRequisiteIdAsString().match(RequisiteListItem.newRequisitePattern))
				// was new requisite
				{
					let newRequisiteId = BX.prop.getNumber(this.getFields(), 'ID', 0);
					if (newRequisiteId > 0)
						// if new requisite was saved
						{
							this.setRequisiteId(newRequisiteId);
						}
				}
			this.setAddressOnly(BX.prop.getString(this.getFields(), 'ADDRESS_ONLY', 'N') === 'Y');
			this._data.bankDetails = [];
			if (main_core.Type.isPlainObject(this._data.value) && main_core.Type.isArray(this._data.value.bankDetailViewDataList)) {
				this._data.bankDetails = this.prepareBankDetailsList(this._data.value.bankDetailViewDataList);
			}
			this._data.addressList = {
				...BX.prop.getObject(this.getFields(), 'RQ_ADDR', {})
			};
		}
		prepareBankDetailsList(bankDetails) {
			let result = [];
			for (let bankDetailsItem of bankDetails) {
				if (bankDetailsItem.deleted) {
					continue; // Deleted items should not be shown
				}
				if (main_core.Type.isPlainObject(bankDetailsItem.viewData)) {
					let item = {
						'title': bankDetailsItem.viewData.title,
						'id': bankDetailsItem.pseudoId,
						'value': '',
						'selected': !!bankDetailsItem.selected
					};
					if (main_core.Type.isArray(bankDetailsItem.viewData.fields) && bankDetailsItem.viewData.fields.length) {
						item.value = bankDetailsItem.viewData.fields.filter(item => main_core.Type.isStringFilled(item.textValue)).map(item => item.title + ': ' + item.textValue).join(', ');
					}
					if (!item.value.length) {
						item.value = item.title;
					}
					result.push(item);
				}
			}
			return result;
		}
		isSelected() {
			if (!this._data.hasOwnProperty('justSelected')) {
				return BX.prop.getBoolean(this._data, 'selected', false);
			}
			return BX.prop.getBoolean(this._data, 'justSelected', false);
		}
		isChanged() {
			return BX.prop.getBoolean(this._data, 'isChanged', false);
		}
		setChanged(changed) {
			this._data.isChanged = !!changed;
		}
		isNew() {
			return BX.prop.getBoolean(this._data, 'isNew', false);
		}
		setNew(isNew) {
			this._data.isNew = !!isNew;
		}
		getSelectedBankDetailId() {
			let selectedBankDetailId = BX.prop.getInteger(this._data, 'selectedBankDetailId', -1);
			if (selectedBankDetailId !== -1) {
				return selectedBankDetailId;
			}
			selectedBankDetailId = this.getBankDetails().reduce((selected, item, index) => {
				return item.selected ? index : selected;
			}, -1);
			this._data.selectedBankDetailId = selectedBankDetailId;
			return selectedBankDetailId > -1 ? selectedBankDetailId : 0;
		}
		getBankDetailById(bankDetailId) {
			let list = this.getBankDetails();
			if (null === bankDetailId) {
				return null;
			}
			if (bankDetailId >= 0 && bankDetailId < list.length) {
				return list[bankDetailId];
			}
			return null;
		}
		getBankDetailByBankDetailId(bankDetailId) {
			let list = this.getBankDetails();
			if (null === bankDetailId) {
				return null;
			}
			return list.filter(item => item.id == bankDetailId).reduce((prev, current) => current, null);
		}
		getTitle() {
			return BX.prop.getString(this._data, 'title', "");
		}
		getSubtitle() {
			return BX.prop.getString(this._data, 'subtitle', "");
		}
		getPresetId() {
			return BX.prop.getString(this._data, 'presetId', "0");
		}
		getPresetCountryId() {
			return BX.prop.getString(this._data, 'presetCountryId', "0");
		}
		getBankDetails() {
			return BX.prop.getArray(this._data, 'bankDetails', []);
		}
		getRequisiteId() {
			return this._data.requisiteId;
		}
		getRequisiteIdAsString() {
			let requisiteId = this.getRequisiteId();
			requisiteId = main_core.Type.isNumber(requisiteId) ? String(requisiteId) : requisiteId;
			return main_core.Type.isStringFilled(requisiteId) ? requisiteId : '';
		}
		getRequisiteData() {
			return this._data.requisiteData;
		}
		getRequisiteDataSign() {
			return this._data.requisiteDataSign;
		}
		getFields() {
			if (main_core.Type.isPlainObject(this._data.value) && main_core.Type.isPlainObject(this._data.value.fields)) {
				return {
					...this._data.value.fields
				};
			}
			return {};
		}
		getAutocompleteData() {
			let result = null;
			let autocompleteState = this.getAutocompleteState();
			let selectedAutocompleteItem = BX.prop.getObject(autocompleteState, 'currentItem', null);
			if (main_core.Type.isPlainObject(selectedAutocompleteItem)) {
				result = {
					title: BX.prop.getString(selectedAutocompleteItem, 'title', ''),
					subTitle: BX.prop.getString(selectedAutocompleteItem, 'subTitle', '')
				};
			} else if (!main_core.Type.isUndefined(this._data.value.viewData) && main_core.Type.isArray(this._data.value.viewData.fields)) {
				let fields = this._data.value.viewData.fields;
				result = {
					title: main_core.Type.isStringFilled(this._data.title) ? this._data.title : '',
					subTitle: fields.filter(item => item.name === 'RQ_INN' && item.textValue.length).map(item => item.title + ' ' + item.textValue).join('')
				};
			}
			return result;
		}
		setAutocompleteState(state) {
			this._data.autocompleteState = main_core.Type.isPlainObject(state) ? state : {};
		}
		getAutocompleteState() {
			return this._data.autocompleteState;
		}
		getAddressList() {
			return this._data.addressList;
		}
		setAddressList(addressList) {
			this._data.addressList = addressList;
		}
		setInitialAddressData(addressData) {
			this._data.initialAddressDdta = addressData;
		}
		getAddressesForSave() {
			let oldAddressTypes = main_core.Type.isPlainObject(this._data.initialAddressDdta) ? Object.keys(this._data.initialAddressDdta) : [];
			let addresses = {};
			for (let type of oldAddressTypes) {
				addresses[type] = "";
			}
			let addressData = this.getAddressData();
			for (let type in addressData) {
				if (addressData.hasOwnProperty(type) && addressData[type].length) {
					addresses[type] = addressData[type];
				}
			}
			for (let type in addresses) {
				if (main_core.Type.isString(addresses[type]) && addresses[type] === "") {
					addresses[type] = {
						DELETED: 'Y'
					};
				}
			}
			return addresses;
		}
		setRequisiteId(requisiteId) {
			this._data.requisiteId = requisiteId;
		}
		setPresetId(presetId) {
			this._data.presetId = presetId;
		}
		setPresetCountryId(presetCountryId) {
			this._data.presetCountryId = presetCountryId;
		}
		setSelected(selected) {
			this._data.selected = !!selected;
			this._data.justSelected = !!selected;
		}
		setRequisiteData(requisiteData, requisiteDataSign) {
			this._data.requisiteData = requisiteData;
			if (main_core.Type.isStringFilled(requisiteDataSign)) {
				this._data.requisiteDataSign = requisiteDataSign;
			}
			this.prepareViewData();
		}
		setDeleted(isDeleted) {
			this._data.isDeleted = !!isDeleted;
		}
		isDeleted() {
			return this._data.isDeleted;
		}
		setAddressOnly(isAddressOnly) {
			this._data.isAddressOnly = !!isAddressOnly;
			this.setFormData({
				...this.getFormData(),
				'ADDRESS_ONLY': isAddressOnly ? 'Y' : 'N'
			});
		}
		isAddressOnly() {
			return this._data.isAddressOnly;
		}
		isEmptyFormData() {
			return Object.keys(this._data.formData).length <= 0;
		}
		getFormData() {
			return this._data.formData;
		}
		setFormData(formData) {
			this._data.formData = formData;
		}
		clearFormData() {
			this.setFormData({});
		}
		isEmptyAddressData() {
			return Object.keys(this._data.addressData).length <= 0;
		}
		getAddressData() {
			return this._data.addressData;
		}
		setAddressData(addressData) {
			this._data.addressData = addressData;
		}
		clearAddressData() {
			this.setAddressData({});
		}
		setSelectedBankDetails(bankDetailsId) {
			if (!main_core.Type.isArray(this._data.bankDetails)) {
				return;
			}
			if (main_core.Type.isNull(bankDetailsId)) {
				bankDetailsId = 0; // first item by default
			}
			for (let index = 0; index < this._data.bankDetails.length; index++) {
				this._data.bankDetails[index].selected = index === bankDetailsId;
			}
			this._data.selectedBankDetailId = bankDetailsId;
		}
		clearSelectedBankDetails() {
			if (!main_core.Type.isArray(this._data.bankDetails)) {
				return;
			}
			for (let index = 0; index < this._data.bankDetails.length; index++) {
				this._data.bankDetails[index].selected = false;
			}
		}
		exportToModel() {
			let exportedItem = {
				...this._data
			};
			delete exportedItem.value;
			delete exportedItem.addressList;
			delete exportedItem.bankDetails;
			delete exportedItem.initialAddressDdta;
			delete exportedItem.isAddressOnly;
			return exportedItem;
		}
		static create(value, settings) {
			let self = new RequisiteListItem();
			self.initialize(value, settings);
			return self;
		}
	}
	RequisiteListItem.newRequisitePattern = /n([0-9]+)/;

	class EntityEditorRequisiteEditor {
		constructor() {
			this._requisiteList = null;
			this._entityTypeId = null;
			this._entityId = null;
			this._entityCategoryId = null;
			this._permissionToken = null;
			this._contextId = null;
			this._mode = BX.UI.EntityEditorMode.view;
			this.currentSliderRequisiste = null;
		}
		initialize(id, settings) {
			this._entityTypeId = BX.prop.getInteger(settings, 'entityTypeId', 0);
			this._entityId = BX.prop.getInteger(settings, 'entityId', 0);
			this._entityCategoryId = BX.prop.getInteger(settings, 'entityCategoryId', null);
			this._contextId = BX.prop.getString(settings, 'contextId', "");
			this._requisiteEditUrl = BX.prop.getString(settings, 'requisiteEditUrl', "");
			this._permissionToken = BX.prop.getString(settings, 'permissionToken', null);
			this._onExternalEventListener = this.onExternalEvent.bind(this);
			main_core_events.EventEmitter.subscribe('onLocalStorageSet', this._onExternalEventListener);
		}
		setRequisiteList(requisiteList) {
			this._requisiteList = requisiteList;
		}
		setMode(mode) {
			this._mode = mode;
		}
		open(requisite, options = {}) {
			if (!(requisite instanceof RequisiteListItem)) {
				return;
			}
			this.currentSliderRequisiste = requisite;
			let sliderOptions = {
				width: 950,
				cacheable: false,
				allowChangeHistory: false,
				requestMethod: 'post',
				requestParams: this.prepareSliderRequestParams(requisite, options)
			};
			BX.Crm.Page.openSlider(this.getSliderUrl(requisite), sliderOptions);
		}
		deleteRequisite(id) {
			let requisite = this._requisiteList.getById(id);
			if (requisite) {
				let postData = {
					...this.prepareSliderRequestParams(requisite)
				};
				postData.sessid = BX.bitrix_sessid();
				postData.mode = 'delete';
				postData.ACTION = 'SAVE';
				BX.ajax.post(this.getSliderUrl(requisite), postData, data => {
					try {
						let json = JSON.parse(data);
						if (main_core.Type.isStringFilled(json.ERROR)) {
							this.showError(json.ERROR);
						} else {
							let selectedRequisite = this._requisiteList.getSelected();
							let selectedRemoved = selectedRequisite === requisite;
							this._requisiteList.remove(requisite);
							main_core_events.EventEmitter.emit(this, 'onAfterDeleteRequisite', {
								selectedRemoved
							});
						}
					} catch (e) {}
				});
			}
		}
		showError(errorMessage) {
			ui_dialogs_messagebox.MessageBox.alert(errorMessage, main_core.Loc.getMessage('REQUISITE_LIST_ITEM_ERROR_CAPTION'));
		}
		getSliderUrl(requisite) {
			let requisiteId = requisite.getRequisiteId();
			let urlParams = {
				etype: this._entityTypeId,
				eid: this._entityId,
				external_context_id: this._contextId
			};
			let presetId = requisite.getPresetId();
			if (presetId > 0) {
				urlParams["pid"] = presetId;
			}
			if (!main_core.Type.isNull(this._entityCategoryId)) {
				urlParams.cid = this._entityCategoryId;
			}
			return BX.util.add_url_param(this.getRequisiteEditUrl(requisiteId), urlParams);
		}
		prepareSliderRequestParams(requisite, options = {}) {
			let requestParams = {};
			let requisiteData = requisite.getRequisiteData();
			if (requisite.isChanged() && main_core.Type.isString(requisiteData) && requisiteData.length) {
				requestParams['externalData'] = {
					'data': requisiteData,
					'sign': requisite.getRequisiteDataSign()
				};
			}
			if (requisite.isSelected()) {
				let autocompleteState = requisite.getAutocompleteState();
				if (Object.keys(autocompleteState).length) {
					requestParams['AUTOCOMPLETE'] = JSON.stringify(autocompleteState);
					requestParams['useFormData'] = 'Y';
				}
			}
			if (!requisite.isEmptyFormData()) {
				requestParams = {
					...requestParams,
					...requisite.getFormData()
				};
			}
			if (!requisite.isEmptyAddressData()) {
				requestParams = {
					...requestParams,
					...{
						RQ_ADDR: requisite.getAddressesForSave()
					}
				};
			}
			requestParams['mode'] = requisite.isNew() ? 'create' : 'edit';
			if (this.isViewMode()) {
				requestParams['doSave'] = 'Y';
			}
			if (BX.prop.getBoolean(options, 'addBankDetailsItem', false)) {
				requestParams['addBankDetailsItem'] = 'Y';
			}
			let overriddenPresetId = BX.prop.getInteger(options, 'overriddenPresetId', 0);
			if (overriddenPresetId > 0) {
				requestParams['PRESET_ID'] = overriddenPresetId;
				requestParams['useFormData'] = 'Y';
			}
			if (!main_core.Type.isNull(this._permissionToken)) {
				requestParams['permissionToken'] = this._permissionToken;
			}
			return requestParams;
		}
		getRequisiteEditUrl(requisiteId) {
			return this._requisiteEditUrl.replace(/#requisite_id#/gi, requisiteId);
		}
		getSignRequisitePromise(requisite) {
			let postData = this.prepareSliderRequestParams(requisite);
			postData.sessid = BX.bitrix_sessid();
			postData.PRESET_ID = requisite.getPresetId();
			postData.useFormData = 'Y';
			postData.ACTION = 'SAVE';
			return BX.ajax.promise({
				method: 'post',
				dataType: 'json',
				url: this.getSliderUrl(requisite),
				data: postData
			});
		}
		isViewMode() {
			return this._mode === BX.UI.EntityEditorMode.view;
		}
		release() {
			main_core_events.EventEmitter.unsubscribe('onLocalStorageSet', this._onExternalEventListener);
		}
		onExternalEvent(event) {
			let dataArray = event.getData();
			if (!main_core.Type.isArray(dataArray)) {
				return;
			}
			let data = dataArray[0];
			let eventName = BX.prop.getString(data, "key", "");
			if (eventName !== "BX.Crm.RequisiteSliderDetails:onCancelEdit" && eventName !== "BX.Crm.RequisiteSliderDetails:onSave") {
				return;
			}
			let value = BX.prop.getObject(data, "value", {});
			let contextId = BX.prop.getString(value, "contextId", "");
			if (contextId !== this._contextId) {
				return;
			}
			if (eventName === "BX.Crm.RequisiteSliderDetails:onCancelEdit") {
				this.currentSliderRequisiste = null;
			}
			if (eventName === "BX.Crm.RequisiteSliderDetails:onSave") {
				let requisite = this.currentSliderRequisiste;
				if (main_core.Type.isObject(requisite)) {
					if (main_core.Type.isString(value.requisiteData)) {
						requisite.setRequisiteData(value.requisiteData, value.requisiteDataSign);
						requisite.setAutocompleteState({});
						requisite.clearFormData();
						requisite.clearAddressData();
					}
					if (main_core.Type.isString(value.presetId)) {
						requisite.setPresetId(value.presetId);
					}
					if (main_core.Type.isString(value.presetCountryId)) {
						requisite.setPresetCountryId(value.presetCountryId);
					}
					if (this.isViewMode()) {
						requisite.setNew(false);
					} else {
						requisite.setChanged(true);
					}
					requisite.setDeleted(false);
					if (this._requisiteList.indexOf(requisite) < 0) {
						this._requisiteList.add(requisite);
					} else {
						this._requisiteList.notifyListChanged();
					}
					this.currentSliderRequisiste = null;
					main_core_events.EventEmitter.emit(this, 'onAfterEditRequisite');
				}
			}
		}
		static create(id, settings) {
			let self = new EntityEditorRequisiteEditor();
			self.initialize(id, settings);
			return self;
		}
	}

	class EntityEditorRequisiteController extends BX.Crm.EntityEditorController {
		constructor() {
			super();
			this._requisiteList = null;
			this._requisiteEditor = null;
			this._requisiteFieldId = null;
			this._requisiteField = null;
			this._requisiteInitData = null;
			this._addressFieldId = null;
			this._addressField = null;
			this._isLoading = false;
			this._formInputsWrapper = null;
			this._enableRequisiteSelection = false;
		}
		doInitialize() {
			super.doInitialize();
			this._requisiteFieldId = this.getConfigStringParam("requisiteFieldId", "");
			this._addressFieldId = this.getConfigStringParam("addressFieldId", "");
			this.saveRequisiteInitData();
			main_core_events.EventEmitter.subscribe(this._editor, 'onFieldInit', this.onFieldInit.bind(this));
			this.initRequisiteEditor();
			this.initRequisiteList();
			let selectedItem = BX.prop.getObject(this.getConfig(), "requisiteBinding", {});
			if (!main_core.Type.isUndefined(selectedItem.REQUISITE_ID) && !main_core.Type.isUndefined(selectedItem.BANK_DETAIL_ID)) {
				let requisite = this._requisiteList.getByRequisiteId(selectedItem.REQUISITE_ID);
				if (requisite) {
					let bankDetail = selectedItem.BANK_DETAIL_ID > 0 ? requisite.getBankDetailByBankDetailId(selectedItem.BANK_DETAIL_ID) : null;
					this._requisiteList.setSelected(this._requisiteList.indexOf(requisite), bankDetail ? requisite.getBankDetails().indexOf(bankDetail) : null);
				}
			}
			this._enableRequisiteSelection = BX.prop.getString(this._config, 'enableRequisiteSelection', false);
		}
		initRequisiteList() {
			this._requisiteList = RequisiteList.create(this._requisiteInitData);
			this._requisiteList.subscribe(this._requisiteList.CHANGE_EVENT, this.onChangeRequisites.bind(this));
			this._requisiteEditor.setRequisiteList(this._requisiteList);
		}
		initRequisiteEditor() {
			this._requisiteEditor = EntityEditorRequisiteEditor.create(this._id + '_rq_editor', {
				entityTypeId: this._editor.getEntityTypeId(),
				entityId: this._editor.getEntityId(),
				contextId: this._editor.getContextId(),
				requisiteEditUrl: this._editor.getRequisiteEditUrl('#requisite_id#'),
				permissionToken: this.getConfigStringParam('permissionToken', null),
				entityCategoryId: BX.prop.getString(this.getConfig(), 'entityCategoryId', 0)
			});
			main_core_events.EventEmitter.subscribe(this._requisiteEditor, 'onAfterEditRequisite', this.onRequisiteEditorAfterEdit.bind(this));
			main_core_events.EventEmitter.subscribe(this._requisiteEditor, 'onAfterDeleteRequisite', this.onRequisiteEditorAfterDelete.bind(this));
		}
		initRequisiteField() {
			if (this._requisiteField) {
				this._requisiteField.setRequisites(this._requisiteList);
				this._requisiteField.setSelectModeEnabled(this._enableRequisiteSelection);
			}
		}
		initAddressField() {
			if (this._addressField) {
				let countryId = 0;
				let addressList = {};
				let selectedRequisite = this._requisiteList ? this._requisiteList.getSelected() : null;
				if (selectedRequisite) {
					countryId = selectedRequisite.getPresetCountryId();
					let requisiteAddressList = selectedRequisite.getAddressList();
					for (let type in requisiteAddressList) {
						if (requisiteAddressList.hasOwnProperty(type) && BX.prop.getString(requisiteAddressList[type], 'DELETED', 'N') !== 'Y') {
							addressList[type] = requisiteAddressList[type];
						}
					}
				}
				this._addressField.setCountryId(countryId);
				this._addressField.setAddressList(addressList);
			}
		}
		setSelectModeEnabled(enableRequisiteSelection) {
			if (this._enableRequisiteSelection !== enableRequisiteSelection) {
				this._enableRequisiteSelection = enableRequisiteSelection;
				if (this._requisiteField) {
					this._requisiteField.setSelectModeEnabled(this._enableRequisiteSelection);
				}
			}
		}
		saveRequisiteInitData() {
			this._requisiteInitData = this.getRequisiteFieldValue();
		}
		validate(result) {
			let promises = [];
			for (let requisite of this._requisiteList.getList()) {
				if (!requisite.isChanged()) {
					continue;
				}
				if (requisite.isEmptyFormData() && requisite.isEmptyAddressData()) {
					continue;
				}
				let signPromise = this.signRequisiteFields(requisite);
				signPromise.then(data => {
					let error = BX.prop.getString(data, 'ERROR', '');
					let entityDataObj = BX.prop.getObject(data, 'ENTITY_DATA', {});
					let entityData = BX.prop.getString(entityDataObj, 'REQUISITE_DATA', "");
					let entityDataSign = BX.prop.getString(entityDataObj, 'REQUISITE_DATA_SIGN', "");
					if (main_core.Type.isStringFilled(error)) {
						result.addError(BX.Crm.EntityValidationError.create({
							field: this.getFirstEditModeField()
						}));
						this.showError(error);
					} else if (main_core.Type.isStringFilled(entityData) && main_core.Type.isStringFilled(entityDataSign)) {
						requisite.setRequisiteData(entityData, entityDataSign);
						requisite.clearFormData();
						requisite.clearAddressData();
					} else {
						result.addError(BX.Crm.EntityValidationError.create({
							field: this.getFirstEditModeField()
						}));
						this.showError(main_core.Loc.getMessage('CRM_EDITOR_SAVE_ERROR_CONTENT'));
					}
					return true;
				}, () => {
					result.addError(BX.Crm.EntityValidationError.create({
						field: this.getFirstEditModeField()
					}));
					this.showError(main_core.Loc.getMessage('CRM_EDITOR_SAVE_ERROR_CONTENT'));
					return new Promise((resolve, reject) => {
						resolve();
					});
				});
				promises.push(signPromise);
			}
			return promises.length > 0 ? Promise.all(promises) : null;
		}
		setSelectedRequisite(requisiteId, bankDetailId) {
			let entityId = this._editor.getEntityId();
			if (!entityId) {
				// impossible situation, but...
				return;
			}
			let newSelectedRequisite = this._requisiteList.getById(requisiteId);
			if (!newSelectedRequisite || newSelectedRequisite.isNew()) {
				// impossible situation too
				return;
			}
			this._requisiteList.setSelected(requisiteId, bankDetailId);
			let selectedBankDetail = newSelectedRequisite.getBankDetailById(newSelectedRequisite.getSelectedBankDetailId());
			let selectedBankDetailId = main_core.Type.isNull(selectedBankDetail) ? null : selectedBankDetail.id;
			this.startLoading();
			BX.ajax.runAction('crm.requisite.settings.setSelectedEntityRequisite', {
				data: {
					entityTypeId: this._editor.getEntityTypeId(),
					entityId: entityId,
					requisiteId: newSelectedRequisite.getRequisiteId(),
					bankDetailId: selectedBankDetailId
				}
			}).then(() => {
				this.stopLoading();
			}, () => {
				this.stopLoading();
			});
		}
		openEditor(requisite, options = {}) {
			this.setRequisiteInitAddrData(requisite);
			this._requisiteEditor.setMode(this._editor.getMode());
			this._requisiteEditor.open(requisite, options);
		}
		isViewMode() {
			return this._editor.getMode() === BX.Crm.EntityEditorMode.view;
		}
		setRequisiteInitAddrData(requisite) {
			let requisiteId = requisite.getRequisiteId();
			let rawRequisite = this._requisiteInitData.filter(item => item.requisiteId === requisiteId).reduce((prev, current) => current, null);
			if (main_core.Type.isPlainObject(rawRequisite)) {
				try {
					let requisiteData = JSON.parse(rawRequisite.requisiteData);
					let requisiteFields = BX.prop.getObject(requisiteData, 'fields', {});
					let addressData = BX.prop.getObject(requisiteFields, 'RQ_ADDR', null);
					requisite.setInitialAddressData(addressData);
				} catch (e) {
					requisite.setInitAddrData(null);
				}
			}
		}
		getFirstEditModeField() {
			if (this._requisiteField && this._requisiteField._mode === BX.Crm.EntityEditorMode.edit) {
				return this._requisiteField;
			}
			if (this._addressField && this._addressField._mode === BX.Crm.EntityEditorMode.edit) {
				return this._addressField;
			}
			return null;
		}
		updateRequisiteFieldModel() {
			let modelValue = this._requisiteList.exportToModel();
			if (this._requisiteField) {
				this._model.setField(this._requisiteFieldId, modelValue);
			}
			this.saveRequisiteInitData([...modelValue]);
		}
		getRequisiteFieldValue() {
			if (!this._requisiteFieldId) {
				return [];
			}
			return this._model.getField(this._requisiteFieldId, []);
		}
		addEditorFormInputs() {
			this._formInputsWrapper = main_core.Tag.render`<div></div>`;
			main_core.Dom.append(this._formInputsWrapper, this._editor.getFormElement());
			for (let requisite of this._requisiteList.getListWithDeleted()) {
				if (requisite.isDeleted()) {
					main_core.Dom.append(main_core.Tag.render`<input type="hidden" name="REQUISITES[${requisite.getRequisiteId()}][DELETED]" value="Y" >`, this._formInputsWrapper);
					continue;
				}
				if (!requisite.isChanged()) {
					continue;
				}
				let dataInput = main_core.Tag.render`<input type="hidden" name="REQUISITES[${requisite.getRequisiteId()}][DATA]" value="${main_core.Tag.safe`${requisite.getRequisiteData()}`}" >`;
				let signInput = main_core.Tag.render`<input type="hidden" name="REQUISITES[${requisite.getRequisiteId()}][SIGN]" value="${requisite.getRequisiteDataSign()}" >`;
				main_core.Dom.append(dataInput, this._formInputsWrapper);
				main_core.Dom.append(signInput, this._formInputsWrapper);
			}
		}
		removeEditorFormInputs() {
			if (main_core.Type.isDomNode(this._formInputsWrapper)) {
				main_core.Dom.remove(this._formInputsWrapper);
				this._formInputsWrapper = null;
			}
		}
		markFieldsAsChanged() {
			if (this._requisiteField) {
				this._requisiteField.markAsChanged();
			}
			if (this._addressField) {
				this._addressField.markAsChanged();
			}
		}
		rollback() {
			this.initRequisiteList();
			this.initRequisiteField();
			this.initAddressField();
			this.updateRequisiteFieldModel();
		}
		isLoading() {
			return !!this._isLoading;
		}
		startLoading() {
			this._isLoading = true;
		}
		stopLoading() {
			this._isLoading = false;
		}
		showError(errorMessage) {
			ui_dialogs_messagebox.MessageBox.alert(errorMessage, main_core.Loc.getMessage('REQUISITE_LIST_ITEM_ERROR_CAPTION'));
		}
		prepareRequisiteByEventData(eventData) {
			let requisite = this._requisiteList.getById(eventData.id);
			if (!requisite) {
				const extraFields = {
					selected: this._requisiteList.isEmpty(),
					presetId: eventData.defaultPresetId
				};
				if (main_core.Type.isPlainObject(eventData.data)) {
					if (eventData.data.title) {
						extraFields.title = eventData.data.title;
					}
					if (eventData.data.subtitle) {
						extraFields.subtitle = eventData.data.subtitle;
					}
				}
				if (eventData.hasOwnProperty('autocompleteState')) {
					extraFields.autocompleteState = eventData.autocompleteState;
				}
				requisite = RequisiteListItem.create(null, {
					'newRequisiteId': this._requisiteList.getNewRequisiteId(),
					'newRequisiteExtraFields': extraFields
				});
			} else {
				if (eventData.hasOwnProperty('autocompleteState')) {
					requisite.setAutocompleteState(eventData.autocompleteState);
				}
				if (main_core.Type.isPlainObject(eventData.data)) {
					if (eventData.data.title) {
						requisite._data.title = eventData.data.title;
					}
					if (eventData.data.subtitle) {
						requisite._data.subtitle = eventData.data.subtitle;
					}
				}
			}
			return requisite;
		}
		getDefaultPresetId() {
			if (this._requisiteField) {
				return this._requisiteField.getDefaultPresetId();
			} else
				// if requisiteField is hidden
				{
					let schemeElement = this._editor.getScheme().getAvailableElements().filter(item => item.getName() === this._requisiteFieldId).reduce((prev, current) => current, null);
					if (!schemeElement) {
						return null;
					}
					for (let preset of BX.prop.getArray(schemeElement.getData(), "presets", [])) {
						if (preset.IS_DEFAULT) {
							return preset.VALUE;
						}
					}
				}
			return null;
		}
		signRequisiteFields(requisite) {
			this.setRequisiteInitAddrData(requisite);
			this._requisiteEditor.setMode(this._editor.getMode());
			return this._requisiteEditor.getSignRequisitePromise(requisite);
		}
		release() {
			if (this._requisiteEditor) {
				this._requisiteEditor.release();
			}
		}
		onFieldInit(event) {
			let eventData = event.getData();
			let field = eventData.field;
			if (field) {
				let fieldId = field.getId();
				if (main_core.Type.isStringFilled(this._requisiteFieldId) && fieldId === this._requisiteFieldId) {
					this._requisiteField = field;
					this.initRequisiteField();
					main_core_events.EventEmitter.subscribe(this._requisiteField, 'onEditNew', this.onEditNewRequisite.bind(this));
					main_core_events.EventEmitter.subscribe(this._requisiteField, 'onEditExisted', this.onEditExistedRequisite.bind(this));
					main_core_events.EventEmitter.subscribe(this._requisiteField, 'onFinishAutocomplete', this.onFinishRequisiteAutocomplete.bind(this));
					main_core_events.EventEmitter.subscribe(this._requisiteField, 'onClearAutocomplete', this.onClearRequisiteAutocomplete.bind(this));
					main_core_events.EventEmitter.subscribe(this._requisiteField, 'onSetDefault', this.onSetDefaultRequisite.bind(this));
					main_core_events.EventEmitter.subscribe(this._requisiteField, 'onDelete', this.onDeleteRequisite.bind(this));
					main_core_events.EventEmitter.subscribe(this._requisiteField, 'onHide', this.onHideRequisite.bind(this));
				}
				if (main_core.Type.isStringFilled(this._addressFieldId) && fieldId === this._addressFieldId) {
					this._addressField = field;
					this.initAddressField();
					main_core_events.EventEmitter.subscribe(this._addressField, 'onAddressListUpdate', this.onAddressListUpdate.bind(this));
				}
			}
		}
		onEditNewRequisite(event) {
			let params = event.getData();
			params.selected = this._requisiteList.isEmpty();
			let requisite = RequisiteListItem.create(null, {
				'newRequisiteId': this._requisiteList.getNewRequisiteId(),
				'newRequisiteExtraFields': params
			});
			requisite.setRequisiteId(this._requisiteList.getNewRequisiteId());
			this.openEditor(requisite);
		}
		onEditExistedRequisite(event) {
			let params = event.getData();
			let requisite = this._requisiteList.getById(params.id);
			if (requisite) {
				let options = BX.prop.getObject(params, 'options', {});
				if (main_core.Type.isPlainObject(options.autocompleteState)) {
					requisite.setAutocompleteState(options.autocompleteState);
				}
				let editorOptions = {};
				if (main_core.Type.isPlainObject(options.editorOptions)) {
					editorOptions = options.editorOptions;
				}
				this.openEditor(requisite, editorOptions);
			}
		}
		onClearRequisiteAutocomplete(event) {
			let params = event.getData();
			let requisite = this._requisiteList.getById(params.id);
			if (requisite) {
				requisite.clearFormData();
			}
		}
		onFinishRequisiteAutocomplete(event) {
			const eventData = event.getData();
			const requisite = this.prepareRequisiteByEventData(eventData);
			const formData = BX.prop.getObject(BX.prop.getObject(eventData, 'data', {}), 'fields', {});
			if (formData.hasOwnProperty('RQ_ADDR')) {
				if (main_core.Type.isPlainObject(formData.RQ_ADDR)) {
					let oldAddr = requisite.getAddressList();
					oldAddr = main_core.Type.isPlainObject(oldAddr) ? oldAddr : {};
					const addr = {
						...oldAddr,
						...formData.RQ_ADDR
					};
					requisite.setAddressData(addr);
					requisite.setAddressList(addr);
				}
				delete formData.RQ_ADDR;
			}
			requisite.setFormData(formData);
			requisite.setChanged(true);
			requisite.setDeleted(false);
			const presetId = BX.prop.getInteger(formData, 'PRESET_ID', 0);
			if (presetId > 0) {
				requisite.setPresetId(presetId);
			}
			const presetCountryId = BX.prop.getInteger(formData, 'PRESET_COUNTRY_ID', 0);
			if (presetCountryId > 0) {
				requisite.setPresetCountryId(presetCountryId);
			}
			if (this._requisiteList.indexOf(requisite) < 0) {
				this._requisiteList.add(requisite);
			} else {
				this._requisiteList.notifyListChanged();
			}
			if (requisite.isAddressOnly()) {
				this._requisiteList.unhide(requisite);
			}
		}
		onSetDefaultRequisite(event) {
			const eventData = event.getData();
			const id = eventData.id;
			const bankDetailId = eventData.bankDetailId;
			if (this._addressField && this._addressField.isChanged()) {
				this._editor.cancel();
				return false; // have to save address first
			}
			this.setSelectedRequisite(id, bankDetailId);
			this.updateRequisiteFieldModel();
			return true;
		}
		onDeleteRequisite(event) {
			let params = event.getData();
			let requisite = this._requisiteList.getById(params.id);
			if (requisite) {
				this.setRequisiteInitAddrData(requisite);
			}
			if (params.postponed) {
				this._requisiteList.removePostponed(requisite);
			} else {
				this._requisiteEditor.setMode(this._editor.getMode());
				this._requisiteEditor.deleteRequisite(params.id);
			}
		}
		onHideRequisite(event) {
			let params = event.getData();
			let requisite = this._requisiteList.getById(params.id);
			if (requisite) {
				this._requisiteList.hide(requisite);
			}
		}
		onChangeRequisites() {
			this.initAddressField();
		}
		onAddressListUpdate(event) {
			let eventData = event.getData();
			eventData.id = this._requisiteList.getSelectedId();
			eventData.defaultPresetId = this.getDefaultPresetId();
			let requisite = this.prepareRequisiteByEventData(eventData);
			let addresses = {};
			let isEmptyAddress = true;
			for (let address of eventData.value) {
				addresses[address.type] = address.value;
				if (main_core.Type.isStringFilled(address.value)) {
					isEmptyAddress = false;
				}
			}
			requisite.setAddressData(addresses);
			requisite.setAddressList(addresses);
			requisite.setChanged(true);
			if (!isEmptyAddress) {
				requisite.setDeleted(false);
			}
			if (this._requisiteList.indexOf(requisite) < 0) {
				if (!isEmptyAddress) {
					requisite.setAddressOnly(true);
					this._requisiteList.add(requisite);
				}
			} else {
				//  remove requisite if address is empty and requisite contain only address
				if (isEmptyAddress && requisite.isAddressOnly()) {
					this._requisiteList.removePostponed(requisite);
				}
				this._requisiteList.notifyListChanged();
			}
		}
		onBeforeSubmit() {
			super.onBeforeSubmit();
			this.addEditorFormInputs();
		}
		onBeforesSaveControl(data) {
			if (!data.hasOwnProperty('REQUISITES')) {
				data['REQUISITES'] = {};
			}
			for (let requisite of this._requisiteList.getListWithDeleted()) {
				if (!requisite.isChanged() && !requisite.isDeleted()) {
					continue;
				}
				let requisiteData = {};
				if (requisite.isDeleted()) {
					requisiteData['DELETED'] = 'Y';
				} else {
					requisiteData['DATA'] = requisite.getRequisiteData();
					requisiteData['SIGN'] = requisite.getRequisiteDataSign();
				}
				data['REQUISITES'][requisite.getRequisiteId()] = requisiteData;
			}
			if (this._enableRequisiteSelection) {
				const selectedRequisite = this._requisiteList.getSelected();
				let selectedRequisiteId = null;
				let selectedBankDetailId = null;
				if (selectedRequisite) {
					selectedRequisiteId = selectedRequisite.getRequisiteId();
					const selectedBankDetail = selectedRequisite.getBankDetailById(selectedRequisite.getSelectedBankDetailId());
					selectedBankDetailId = main_core.Type.isNull(selectedBankDetail) ? null : selectedBankDetail.id;
				}
				data['REQUISITES']['BINDING'] = {
					requisiteId: selectedRequisiteId,
					bankDetailId: selectedBankDetailId
				};
			}
			return data;
		}
		onAfterSave() {
			super.onAfterSave();
			this.saveRequisiteInitData(this.getRequisiteFieldValue());
			this.initRequisiteList();
			this.initRequisiteField();
			this.initAddressField();
			this.removeEditorFormInputs();
		}
		onRequisiteEditorAfterEdit() {
			if (this.isViewMode()) {
				this.updateRequisiteFieldModel();
			}
			this.markFieldsAsChanged();
		}
		onRequisiteEditorAfterDelete(event) {
			let data = event.getData();
			let isEmptyRequisitesList = this._requisiteList.isEmpty();
			if (!isEmptyRequisitesList && data.selectedRemoved) {
				// set new default requisite
				this.setSelectedRequisite(0, 0);
			}
			this.updateRequisiteFieldModel();
		}
		static create(id, settings) {
			let self = new EntityEditorRequisiteController();
			self.initialize(id, settings);
			return self;
		}
	}

	class PresetMenu extends main_core_events.EventEmitter {
		constructor(id, presetList) {
			super();
			this.setEventNamespace('BX.Crm.RequisitePresetMenu');
			this._isShown = false;
			this.menuId = id;
			this.presetList = presetList;
		}
		toggle(bindElement) {
			if (this._isShown) {
				this.close();
			} else if (bindElement) {
				this.show(bindElement);
			}
		}
		show(bindElement) {
			if (this._isShown) {
				return;
			}
			if (!this.presetList || !this.presetList.length) {
				ui_dialogs_messagebox.MessageBox.alert(main_core.Loc.getMessage('REQUISITE_LIST_EMPTY_PRESET_LIST'), main_core.Loc.getMessage('REQUISITE_LIST_ITEM_ERROR_CAPTION'));
				return;
			}
			let menu = [];
			for (let item of this.presetList) {
				menu.push({
					text: main_core.Text.encode(item.name),
					value: item.value,
					onclick: this.onSelect.bind(this, item)
				});
			}
			main_popup.MenuManager.show(this.menuId, bindElement, menu, {
				angle: false,
				cacheable: false,
				events: {
					onPopupShow: () => {
						this._isShown = true;
					},
					onPopupClose: () => {
						this._isShown = false;
					}
				}
			});
		}
		close() {
			if (!this._isShown) {
				return;
			}
			let menu = main_popup.MenuManager.getMenuById(this.menuId);
			if (menu) {
				menu.popupWindow.close();
			}
		}
		isShown() {
			return this._isShown;
		}
		onSelect(item) {
			this.close();
			this.emit('onSelect', item);
		}
	}

	class EntityEditorRequisiteTooltip {
		initialize(id, settings) {
			this._id = BX.type.isNotEmptyString(id) ? id : BX.util.getRandomString(4);
			this._settings = settings ? settings : {};
			this._padding = BX.prop.getInteger(this._settings, 'padding', 20);
			this._showTimer = false;
			this._closeTimer = false;
			this._closeTimeout = BX.prop.getInteger(this._settings, 'closeTimeout', 700);
			this._showTimeout = BX.prop.getInteger(this._settings, 'showTimeout', 500);
			this._popupId = this._id + '_popup';
			this._isReadonly = BX.prop.getBoolean(this._settings, 'readonly', true);
			this._canChangeDefaultRequisite = BX.prop.getBoolean(this._settings, 'canChangeDefaultRequisite', true);
			this._bindElement = null;
			this._wrapper = null;
			this._requisiteList = null;
			this._isLoading = false;
			this._changeRequisistesHandler = this.onChangeRequisites.bind(this);
			this.presetMenu = new PresetMenu(this._id + '_preset_menu', BX.prop.getArray(this._settings, 'presets', []));
			this.presetMenu.subscribe('onSelect', this.onAddRequisite.bind(this));
		}
		static create(id, settings) {
			let self = new EntityEditorRequisiteTooltip();
			self.initialize(id, settings);
			return self;
		}
		setRequisites(requisiteList) {
			this._requisiteList = requisiteList;
			requisiteList.unsubscribe(requisiteList.CHANGE_EVENT, this._changeRequisistesHandler);
			requisiteList.subscribe(requisiteList.CHANGE_EVENT, this._changeRequisistesHandler);
			this.refreshLayout();
		}
		setBindElement(bindElement, wrapper) {
			this._bindElement = bindElement;
			if (!main_core.Type.isDomNode(wrapper)) {
				wrapper = this._bindElement.parentNode ? this._bindElement.parentNode : null;
			}
			this._wrapper = wrapper;
		}
		setLoading(isLoading) {
			this._isLoading = !!isLoading;
			this.refreshLayout();
		}
		show() {
			this.cancelCloseDebounced();
			let success = false;
			if (this._requisiteList && !this._requisiteList.isEmpty()) {
				let popup = main_popup.PopupManager.create({
					id: this._popupId,
					cacheable: false,
					autoHide: true,
					padding: this._padding,
					contentPadding: 0,
					content: this.getLayout(),
					closeByEsc: true
				});
				popup.show();
				this.adjustPosition();
				success = true;
			}
			main_core_events.EventEmitter.emit(this, 'onShow', {
				success
			});
		}
		showDebounced(delayMultiplier = false) {
			delayMultiplier = parseInt(delayMultiplier) > 0 ? parseInt(delayMultiplier) : 1;
			this.cancelShowDebounced();
			this.cancelCloseDebounced();
			this._showTimer = setTimeout(this.show.bind(this), this._showTimeout * delayMultiplier);
		}
		cancelShowDebounced() {
			clearTimeout(this._showTimer);
		}
		closeDebounced(delayMultiplier = false) {
			this.cancelShowDebounced();
			delayMultiplier = parseInt(delayMultiplier) > 0 ? parseInt(delayMultiplier) : 1;
			this.cancelCloseDebounced();
			this._closeTimer = setTimeout(this.close.bind(this), this._closeTimeout * delayMultiplier);
		}
		cancelCloseDebounced() {
			clearTimeout(this._closeTimer);
		}
		adjustPosition() {
			let popup = main_popup.PopupManager.getPopupById(this._popupId);
			if (!popup || !popup.isShown() || !main_core.Type.isDomNode(this._bindElement) || !main_core.Type.isDomNode(this._wrapper)) {
				return;
			}
			const wrapperRect = this._wrapper.getBoundingClientRect();
			const itemRect = this._bindElement.getBoundingClientRect();
			let offsetLeft = wrapperRect.width - (itemRect.left - wrapperRect.left);
			let offsetTop = itemRect.height / 2 + this._padding;
			let angleOffset = itemRect.height / 2;
			const popupWidth = popup.getPopupContainer().offsetWidth;
			const popupHeight = popup.getPopupContainer().offsetHeight;
			const popupBottom = itemRect.top + popupHeight;
			const clientWidth = document.documentElement.clientWidth;
			const clientHeight = document.documentElement.clientHeight;

			// let's try to fit a popup to the browser viewport
			const exceeded = popupBottom - clientHeight;
			if (exceeded > 0) {
				let roundOffset = Math.ceil(exceeded / itemRect.height) * itemRect.height;
				if (roundOffset > itemRect.top) {
					// it cannot be higher than the browser viewport.
					roundOffset -= Math.ceil((roundOffset - itemRect.top) / itemRect.height) * itemRect.height;
				}
				if (itemRect.bottom > popupBottom - roundOffset) {
					// let's sync bottom boundaries.
					roundOffset -= itemRect.bottom - (popupBottom - roundOffset) + this._padding;
				}
				offsetTop += roundOffset;
				angleOffset += roundOffset + this._padding;
			}
			popup.setBindElement(this._bindElement);
			if (wrapperRect.left + offsetLeft + popupWidth <= clientWidth) {
				popup.setAngle({
					position: 'left',
					offset: angleOffset
				});
				offsetLeft += popup.angle ? popup.angle.element.offsetWidth : 0;
				offsetTop += popup.angle ? Math.ceil(popup.angle.element.offsetHeight / 2) : 0;
				popup.setOffset({
					offsetLeft: offsetLeft,
					offsetTop: -offsetTop
				});
			} else {
				popup.setAngle(true);
			}
			popup.adjustPosition();
		}
		close() {
			let popup = main_popup.PopupManager.getPopupById(this._popupId);
			popup ? popup.close() : null;
			this.presetMenu.close();
		}
		removeDebouncedEvents() {
			this.cancelCloseDebounced();
			this.cancelShowDebounced();
		}
		refreshLayout() {
			let popup = main_popup.PopupManager.getPopupById(this._popupId);
			if (popup) {
				popup.setContent(this.getLayout());
			}
		}
		getLayout() {
			if (this._isLoading) {
				let loader = new main_loader.Loader();
				let container = main_core.Tag.render`<div class="crm-rq-wrapper crm-rq-wrapper-loading"></div>`;
				loader.show(container);
				return container;
			}
			let requisites = main_core.Type.isNull(this._requisiteList) ? [] : this._requisiteList.getList();
			let renderRequisiteEditButtonNode = id => {
				if (this._isReadonly) {
					return main_core.Tag.render`
				<div class="crm-rq-org-requisite-btn-container">
					<span class="ui-link ui-link-secondary" onclick="${this.onEditRequisite.bind(this, id)}">${main_core.Loc.getMessage('REQUISITE_TOOLTIP_SHOW_DETAILS')}</span>
				</div>
				`;
				} else {
					return main_core.Tag.render`
				<div class="crm-rq-org-requisite-btn-container">
					<span class="ui-link ui-link-secondary" onclick="${this.onEditRequisite.bind(this, id)}">${main_core.Loc.getMessage('REQUISITE_TOOLTIP_EDIT')}</span>
					<span class="ui-link ui-link-secondary" data-requisite-id="${id}" onclick="${this.onDeleteRequisite.bind(this)}">${main_core.Loc.getMessage('REQUISITE_TOOLTIP_DELETE')}</span>
					<span class="ui-link ui-link-secondary" onclick="${this.onAddBankDetails.bind(this, id)}">${main_core.Loc.getMessage('REQUISITE_TOOLTIP_ADD_BANK_DETAILS')}</span>
				</div>
				`;
				}
			};
			let renderRequisiteBankDetails = (requisite, id) => {
				let bandDetails = requisite.getBankDetails();
				let selectedBankDetailId = requisite.getSelectedBankDetailId();
				return bandDetails.length ? main_core.Tag.render`
					<div class="crm-rq-org-requisite-container">
						<div class="crm-rq-org-requisite-title">${main_core.Loc.getMessage('REQUISITE_TOOLTIP_BANK_DETAILS_TITLE')}</div>
						<div class="crm-rq-org-requisite-list">
							${bandDetails.map((bankDetail, index) => main_core.Tag.render`
								<label class="crm-rq-org-requisite-item" onclick="${this.onSetSelectedBankDetails.bind(this)}">
									<input type="radio" data-requisite-id="${id}" data-bankdetails-id="${index}" class="crm-rq-org-requisite-btn" ${requisite.isSelected() && index === selectedBankDetailId ? ' checked' : ''} ${this._canChangeDefaultRequisite ? '' : ' disabled'}>
									<span class="crm-rq-org-requisite-info">${main_core.Text.encode(bankDetail.value)}</span>
								</label>`)}
						</div>
						${renderRequisiteEditButtonNode(id)}
					</div>` : renderRequisiteEditButtonNode(id);
			};
			return main_core.Tag.render`
		<div class="crm-rq-wrapper"
			onmouseenter="${this.onMouseEnter.bind(this)}"
			onmouseleave="${this.onMouseLeave.bind(this)}">
			<div class="crm-rq-org-list">
				${requisites.map((requisite, index) => main_core.Tag.render`
					<div class="crm-rq-org-item${requisite.isSelected() ? ' crm-rq-org-item-selected' : ''}" onclick="${this.onSetSelectedRequisite.bind(this, index)}">
						<div class="crm-rq-org-info-container">
							<div class="crm-rq-org-name">${main_core.Text.encode(requisite.getTitle())}</div>
							${requisite.getSubtitle().length ? main_core.Tag.render`<div class="crm-rq-org-description">${main_core.Text.encode(requisite.getSubtitle())}</div>` : ''}
							${renderRequisiteBankDetails(requisite, index)}
						</div>
					</div>
				`)}
			</div>
			${this._isReadonly ? '' : main_core.Tag.render`<div class="crm-rq-btn-container">
				<span class="crm-rq-add-rq" onclick="${this.onStartAddRequisite.bind(this)}">
					<span class="ui-btn crm-rq-btn ui-btn-icon-custom ui-btn-primary ui-btn-round"></span> ${main_core.Loc.getMessage('REQUISITE_TOOLTIP_ADD')}
				</span>
			</div>`}
		</div>`;
		}
		setSelectedRequisite(id, bankDetailId) {
			let newSelectedRequisite = this._requisiteList.getById(id);
			if (!newSelectedRequisite) {
				return false;
			}
			let selectedRequisite = this._requisiteList.getSelected();
			if (id === this._requisiteList.getSelectedId())
				// selected the same requisite
				{
					let selectedBankDetails = selectedRequisite.getBankDetails();
					if (selectedBankDetails.length) {
						for (let index = 0; index < selectedBankDetails.length; index++) {
							let bankDetails = selectedBankDetails[index];
							if (main_core.Type.isObject(bankDetails) && bankDetails.selected) {
								if (index === bankDetailId || main_core.Type.isNull(bankDetailId)) {
									return false; // selected same requisite and bank details
								}
							}
						}
					} else {
						return false; // requisite already selected and hasn't bank details
					}
				}
			main_core_events.EventEmitter.emit(this, 'onSetSelectedRequisite', {
				id,
				bankDetailId
			});
			return true;
		}
		onMouseEnter() {
			this.cancelCloseDebounced();
		}
		onMouseLeave() {
			if (!this.presetMenu.isShown()) {
				this.closeDebounced(1.5);
			}
		}
		onStartAddRequisite(event) {
			event.stopPropagation();
			this.presetMenu.toggle(event.target);
		}
		onAddRequisite(event) {
			let data = event.getData();
			this.close();
			main_core_events.EventEmitter.emit(this, 'onAddRequisite', {
				presetId: data.value
			});
		}
		onEditRequisite(id, event) {
			event.stopPropagation();
			this.close();
			main_core_events.EventEmitter.emit(this, 'onEditRequisite', {
				id
			});
		}
		onDeleteRequisite(event) {
			event.stopPropagation();
			let element = event.target;
			if (main_core.Type.isDomNode(element)) {
				let id = element.getAttribute('data-requisite-id');
				main_core_events.EventEmitter.emit(this, 'onDeleteRequisite', {
					id
				});
			}
		}
		onAddBankDetails(requisiteId, event) {
			event.stopPropagation();
			this.close();
			main_core_events.EventEmitter.emit(this, 'onAddBankDetails', {
				requisiteId
			});
		}
		onSetSelectedRequisite(id) {
			if (this._canChangeDefaultRequisite) {
				this.setSelectedRequisite(id, null);
			}
			return false;
		}
		onSetSelectedBankDetails(event) {
			event.stopPropagation();
			let element = event.target;
			if (this._canChangeDefaultRequisite && main_core.Type.isDomNode(element)) {
				if (element.nodeName.toString().toLowerCase() !== 'input') {
					element = element.querySelector('input');
					if (!main_core.Type.isDomNode(element)) {
						return;
					}
				}
				element.checked = false;
				let id = parseInt(element.getAttribute('data-requisite-id'));
				let bankDetailsId = parseInt(element.getAttribute('data-bankdetails-id'));
				this.setSelectedRequisite(id, bankDetailsId);
			}
			return false;
		}
		onChangeRequisites(event) {
			this.refreshLayout();
		}
	}

	class EntityEditorRequisiteField extends BX.Crm.EntityEditorField {
		constructor() {
			super();
			this._domNodes = {};
			this._requisiteList = null;
			this.presetMenu = null;
			this._autocomplete = null;
			this._tooltip = null;
			this.isSearchMode = true;
			this.requisitesDropdown = null;
			this.bankDetailsDropdown = null;
			this.selectModeEnabled = false;
			this._changeRequisistesHandler = this.onChangeRequisites.bind(this);
		}
		static create(id, settings) {
			let self = new this(id, settings);
			self.initialize(id, settings);
			return self;
		}
		doInitialize() {
			this._autocomplete = crm_entityEditor_field_requisite_autocomplete.RequisiteAutocompleteField.create(this.getName(), {
				searchAction: 'crm.requisite.entity.search',
				canAddRequisite: true,
				feedbackFormParams: BX.prop.getObject(this._schemeElement.getData(), "feedback_form", {}),
				enabled: true,
				showFeedbackLink: false
			});
			this._autocomplete.subscribe('onSelectValue', this.onSelectAutocompleteValue.bind(this));
			this._autocomplete.subscribe('onCreateNewItem', this.onAddRequisiteFromAutocomplete.bind(this));
			this._autocomplete.subscribe('onClear', this.onClearAutocompleteValue.bind(this));
			this._autocomplete.subscribe('onInstallDefaultApp', this.onInstallDefaultApp.bind(this));
			main_core_events.EventEmitter.subscribe("BX.Crm.RequisiteAutocomplete:onAfterInstallDefaultApp", this.onInstallDefaultAppGlobal.bind(this));
			this.presetMenu = new PresetMenu(this.getName() + '_requisite_preset_menu', this.getPresetList());
			this.presetMenu.subscribe('onSelect', this.onAddRequisiteFromMenu.bind(this));
			const isReadonly = this.getEditor().isReadOnly();
			this._tooltip = EntityEditorRequisiteTooltip.create(this.getName() + '_requisite_details', {
				readonly: isReadonly,
				canChangeDefaultRequisite: !isReadonly,
				presets: this.getPresetList()
			});
			main_core_events.EventEmitter.subscribe(this._tooltip, 'onAddRequisite', this.onAddRequisiteFromTooltip.bind(this));
			main_core_events.EventEmitter.subscribe(this._tooltip, 'onEditRequisite', this.onEditRequisite.bind(this));
			main_core_events.EventEmitter.subscribe(this._tooltip, 'onDeleteRequisite', this.onDeleteRequisite.bind(this));
			main_core_events.EventEmitter.subscribe(this._tooltip, 'onAddBankDetails', this.onAddBankDetails.bind(this));
			main_core_events.EventEmitter.subscribe(this._tooltip, 'onSetSelectedRequisite', this.onSetSelectedRequisite.bind(this));
			this.updateAutocompletePlaceholder();
			this.updateAutocompeteClientResolverPlacementParams();
			main_core_events.EventEmitter.emit(this.getEditor(), 'onFieldInit', {
				field: this
			});
			const schemeElementData = this.getSchemeElement().getData();
			if (schemeElementData.hasOwnProperty('isEditMode') && schemeElementData['isEditMode'] === true) {
				schemeElementData['isEditMode'] = false;
				if (this.getEditor().getMode() === BX.UI.EntityEditorMode.edit) {
					setTimeout(() => {
						this.editDefaultRequisite();
					});
				}
			}
		}
		setSelectModeEnabled(selectModeEnabled) {
			if (this.selectModeEnabled !== selectModeEnabled) {
				this.selectModeEnabled = selectModeEnabled;
				if (this.isSelectModeEnabled()) {
					this.isSearchMode = false;
				}
				this.refreshLayoutParts();
			}
		}
		isSelectModeEnabled() {
			return this.selectModeEnabled && this.hasRequisites() && this.getRequisites().getList().length > 0;
		}
		setRequisites(requisiteList) {
			const hasRequisites = this.hasRequisites();
			const vasEmpty = hasRequisites && this.getRequisites().isEmpty();
			this._requisiteList = requisiteList;
			requisiteList.unsubscribe(requisiteList.CHANGE_EVENT, this._changeRequisistesHandler);
			requisiteList.subscribe(requisiteList.CHANGE_EVENT, this._changeRequisistesHandler);
			this._tooltip.setRequisites(requisiteList);
			if (hasRequisites && !vasEmpty && !this.getRequisites().isEmpty()) {
				this.refreshLayoutParts();
			} else {
				this.refreshLayout();
			}
		}
		getRequisites() {
			return this._requisiteList;
		}
		hasRequisites() {
			return main_core.Type.isObject(this._requisiteList);
		}
		isSingleMode() {
			if (!this.hasRequisites()) {
				return true;
			}
			return this.getRequisites().getList().length <= 1;
		}
		getTitle() {
			let title = super.getTitle();
			if (this.hasRequisites() && !this.isSingleMode()) {
				let selectedRequisite = this.hasRequisites() ? this.getRequisites().getSelected() : null;
				let selectedPresetId = selectedRequisite ? selectedRequisite.getPresetId() : null;
				if (selectedRequisite && selectedPresetId) {
					let selectedPresetName = this.getPresetList().reduce((name, item) => item.value === selectedPresetId ? item.name : name, '');
					if (selectedPresetName.length) {
						title += ' (' + selectedPresetName + ')';
					}
				}
			}
			return title;
		}
		createTitleActionControls() {
			const actions = [];
			if (this._mode !== BX.UI.EntityEditorMode.edit) {
				return actions;
			}
			if (this.isAutocompleteEnabled() && this.selectModeEnabled) {
				if (this.isSearchMode) {
					actions.push(main_core.Tag.render`
					<span class="ui-link ui-link-secondary ui-entity-editor-block-title-link"
						onclick="${this.toggleSearchMode.bind(this)}">${main_core.Loc.getMessage('REQUISITE_LABEL_DETAILS_SELECT')}</span>`);
				} else {
					const title = this.getClientResolverTitle();
					actions.push(main_core.Tag.render`
					<span class="ui-link ui-link-secondary ui-entity-editor-block-title-link"
						onclick="${this.toggleSearchMode.bind(this)}">${title}</span>`);
				}
			}
			if (this.hasRequisites()) {
				actions.push(main_core.Tag.render`
				<span class="ui-link ui-link-secondary ui-entity-editor-block-title-link"
				 	onclick="${this.editDefaultRequisite.bind(this)}">${main_core.Loc.getMessage('REQUISITE_LABEL_DETAILS_TEXT')}</span>`);
			}
			return actions;
		}
		toggleSearchMode() {
			this.isSearchMode = !this.isSearchMode;
			this.refreshLayoutParts();
		}
		isNeedToDisplay(options) {
			return this.hasRequisites() && super.isNeedToDisplay(options);
		}
		layout(options) {
			if (this._hasLayout) {
				return;
			}
			this._domNodes = {};
			this.ensureWrapperCreated({
				classNames: ["crm-entity-widget-content-block-field-requisites"]
			});
			this.adjustWrapper();
			this.bindWrapperEvents();
			if (!this.isNeedToDisplay()) {
				this.registerLayout(options);
				this._hasLayout = true;
				return;
			}
			if (this.isDragEnabled()) {
				main_core.Dom.append(this.createDragButton(), this._wrapper);
			}
			main_core.Dom.append(this.createTitleNode(this.getTitle()), this._wrapper);
			if (this._mode === BX.UI.EntityEditorMode.edit) {
				this._domNodes.addButton = this.renderAddButton();
				this._domNodes.autocompleteForm = this.renderAutocompleteForm();
				this._domNodes.requisiteSelectForm = this.renderRequisiteSelectForm();
				this._domNodes.bankDetailSelectForm = this.renderBankDetailSelectForm();
				main_core.Dom.append(this._domNodes.autocompleteForm, this._wrapper);
				main_core.Dom.append(this._domNodes.requisiteSelectForm, this._wrapper);
				main_core.Dom.append(this._domNodes.bankDetailSelectForm, this._wrapper);
				main_core.Dom.append(this._domNodes.addButton, this._wrapper);
				this.adjustNodesVisibility();
				this.updateRequisitesDropdown();
				this.updateBankDetailsDropdown();
				this.updateRequisiteSelectorValue();
				this.updateBankDetailsSelectorValue();
			} else
				// if(this._mode === BX.UI.EntityEditorMode.view)
				{
					main_core.Dom.append(this.renderSelectedRequisite(), this._wrapper);
				}
			if (this.isContextMenuEnabled()) {
				this._wrapper.appendChild(this.createContextMenuButton());
			}
			if (this.isDragEnabled()) {
				this.initializeDragDropAbilities();
			}
			this.registerLayout(options);
			this._hasLayout = true;
		}
		bindWrapperEvents() {
			if (!this.wrapperMouseEnterHandler) {
				this.wrapperMouseEnterHandler = this.onFieldMouseEnter.bind(this);
			}
			if (!this.wrapperMouseLeaveHandler) {
				this.wrapperMouseLeaveHandler = this.onFieldMouseLeave.bind(this);
			}
			main_core.Event.unbind(this._wrapper, 'mouseenter', this.wrapperMouseEnterHandler);
			main_core.Event.unbind(this._wrapper, 'mouseleave', this.wrapperMouseLeaveHandler);
			main_core.Event.bind(this._wrapper, 'mouseenter', this.wrapperMouseEnterHandler);
			main_core.Event.bind(this._wrapper, 'mouseleave', this.wrapperMouseLeaveHandler);
		}
		refreshLayoutParts() {
			this.updateSelectedRequisiteText();
			this.refreshTitleLayout();
			this.updateAutocompleteState();
			this.adjustNodesVisibility();
			this.updateRequisitesDropdown();
			this.updateBankDetailsDropdown();
			this.updateRequisiteSelectorValue();
			this.updateBankDetailsSelectorValue();
		}
		hasContentToDisplay() {
			return this.hasValue();
		}
		hasValue() {
			if (!this.hasRequisites()) {
				return false;
			}
			let list = this.getRequisites().getList();
			if (list.length > 1) {
				return true;
			}
			// if list contains only one item, it shouldn't be hidden:
			return list.length === 1 && !list[0].isAddressOnly();
		}
		isAutocompleteEnabled() {
			if (!this.hasRequisites() || this.getRequisites().isEmpty() || this.getRequisites().getSelected().isAddressOnly()) {
				return !!this.getClientResolverPropForPreset(this.getSelectedPresetId());
			}
			return true;
		}
		renderSelectedRequisite() {
			this._domNodes.selectedRequisiteView = main_core.Tag.render`<span></span>`;
			this.updateSelectedRequisiteText();
			this.updateAutocompleteState();
			let container = main_core.Tag.render`
			<div class="ui-entity-editor-content-block" 
				onclick="${this.onViewStringClick.bind(this)}"
				onmouseenter="${this.onViewStringMouseEnter.bind(this)}">
					${this._domNodes.selectedRequisiteView}
			</div>`;
			this._tooltip.setBindElement(container, this.getEditor().getFormElement());
			return container;
		}
		updateSelectedRequisiteText() {
			if (!this._domNodes.selectedRequisiteView) {
				return;
			}
			let selectedRequisite = this.hasRequisites() && this.getRequisites().getSelected();
			if (this.hasValue() && selectedRequisite && selectedRequisite.getTitle().length) {
				this._domNodes.selectedRequisiteView.classList.add('ui-link', 'ui-link-dark', 'ui-link-dotted');
				this._domNodes.selectedRequisiteView.textContent = selectedRequisite.getTitle();
			} else {
				this._domNodes.selectedRequisiteView.classList.remove('ui-link', 'ui-link-dark', 'ui-link-dotted');
				this._domNodes.selectedRequisiteView.textContent = BX.UI.EntityEditorField.messages.isEmpty;
			}
		}
		renderAddButton() {
			return main_core.Tag.render`
			<div class="ui-entity-editor-content-block crm-entity-widget-content-block-requisites">
				<span class="crm-entity-widget-client-requisites-add-btn" onclick="${this.toggleNewRequisitePresetMenu.bind(this)}">${main_core.Loc.getMessage('CRM_EDITOR_ADD')}</span>
			</div>`;
		}
		renderAutocompleteForm() {
			const autocompleteContainer = main_core.Tag.render`
			<div class="crm-entity-widget-content-block-field-container crm-entity-widget-content-block-field-requisites"></div>`;
			const hasResolvers = !!this.getClientResolverPropForPreset(this.getSelectedPresetId());
			this._autocomplete.setEnabled(hasResolvers);
			this._autocomplete.layout(autocompleteContainer);
			this.updateAutocompleteState();
			return main_core.Tag.render`
			<div class="ui-entity-editor-content-block">
				${autocompleteContainer}
				<div class="crm-entity-widget-content-block-add-field">
					<span class="crm-entity-widget-content-add-field" onclick="${this.toggleNewRequisitePresetMenu.bind(this)}">${main_core.Loc.getMessage('CRM_EDITOR_ADD')}</span>
				</div>
			</div>`;
		}
		renderRequisiteSelectForm() {
			let isOpen = false;
			const toggleDropdown = () => {
				if (this.requisitesDropdown) {
					if (!isOpen) {
						this.requisitesDropdown.showPopupWindow();
					} else {
						this.requisitesDropdown.destroyPopupWindow();
					}
					isOpen = !isOpen;
				}
			};
			const selectInput = main_core.Tag.render`<div class="ui-ctl-element" onclick="${toggleDropdown}"></div>`;
			const selectContainer = main_core.Tag.render`
			<div class="crm-entity-widget-content-block-field-container crm-entity-widget-content-block-field-requisites">
				<div class="ui-ctl ui-ctl-w100 ui-ctl-after-icon">
					<button class="ui-ctl-after ui-ctl-icon-angle" onclick="${toggleDropdown}"></button>
					${selectInput}
				</div>			
			</div>`;
			this.requisitesDropdown = new BX.UI.Dropdown({
				targetElement: selectInput,
				items: [],
				isDisabled: true,
				events: {
					onSelect: this.onRequisiteSelect.bind(this)
				}
			});
			return main_core.Tag.render`
			<div class="ui-entity-editor-content-block">
				${selectContainer}
				<div class="crm-entity-widget-content-block-add-field">
					<span class="crm-entity-widget-content-add-field" onclick="${this.toggleNewRequisitePresetMenu.bind(this)}">${main_core.Loc.getMessage('CRM_EDITOR_ADD_REQUISITE')}</span>
				</div>
			</div>`;
		}
		renderBankDetailSelectForm() {
			let isOpen = false;
			const toggleDropdown = () => {
				if (this.bankDetailsDropdown) {
					if (!isOpen) {
						this.bankDetailsDropdown.showPopupWindow();
					} else {
						this.bankDetailsDropdown.destroyPopupWindow();
					}
					isOpen = !isOpen;
				}
			};
			const selectInput = main_core.Tag.render`<div class="ui-ctl-element" onclick="${toggleDropdown}"></div>`;
			this._domNodes.bankDetailsSelectContainer = main_core.Tag.render`
			<div class="crm-entity-widget-content-block-field-container crm-entity-widget-content-block-field-requisites">
				<div class="ui-ctl ui-ctl-w100 ui-ctl-after-icon">
					<button class="ui-ctl-after ui-ctl-icon-angle" onclick="${toggleDropdown}"></button>
					${selectInput}
				</div>			
			</div>`;
			this.bankDetailsDropdown = new BX.UI.Dropdown({
				targetElement: selectInput,
				items: [],
				isDisabled: true,
				events: {
					onSelect: this.onBankDetailSelect.bind(this)
				}
			});
			return main_core.Tag.render`
			<div class="ui-entity-editor-content-block">
				${this._domNodes.bankDetailsSelectContainer}
				<div class="crm-entity-widget-content-block-add-field">
					<span class="crm-entity-widget-content-add-field" onclick="${this.onAddBankDetailsClick.bind(this)}">${main_core.Loc.getMessage('CRM_EDITOR_ADD_BANK_DETAILS')}</span>
				</div>
			</div>`;
		}
		updateAutocompleteState() {
			let autocompleteValue = null;
			const selectedRequisite = this.hasRequisites() ? this.getRequisites().getSelected() : null;
			if (selectedRequisite && !selectedRequisite.isAddressOnly()) {
				autocompleteValue = selectedRequisite.getAutocompleteData();
			}
			this._autocomplete.setCurrentItem(autocompleteValue);
			this._autocomplete.setContext(this.getAutocompleteContext());
		}
		updateAutocompletePlaceholder() {
			const clientResolverPropTitle = this.getClientResolverTitle();
			this._autocomplete.setEnabled(!!clientResolverPropTitle);
			this._autocomplete.setPlaceholderText(clientResolverPropTitle);
		}
		updateAutocompeteClientResolverPlacementParams() {
			this._autocomplete.setClientResolverPlacementParams(this.getClientResolverPlacementParams());
		}
		getClientResolverPlacementParams() {
			const clientResolverProp = this.getClientResolverPropForPreset(this.getSelectedPresetId());
			return clientResolverProp ? {
				"isPlacement": BX.prop.getString(clientResolverProp, "IS_PLACEMENT", "N") === "Y",
				"numberOfPlacements": BX.prop.getArray(clientResolverProp, "PLACEMENTS", []).length,
				"countryId": BX.prop.getInteger(clientResolverProp, "COUNTRY_ID", 0),
				"defaultAppInfo": BX.prop.getObject(clientResolverProp, "DEFAULT_APP_INFO", {})
			} : {};
		}
		getClientResolverTitle() {
			let title = "";
			const clientResolverProp = this.getClientResolverPropForPreset(this.getSelectedPresetId());
			title = BX.prop.getString(clientResolverProp, "TITLE", "");
			const isPlacement = BX.prop.getString(clientResolverProp, 'IS_PLACEMENT', 'N') === 'Y';
			if (!isPlacement && main_core.Type.isStringFilled(title)) {
				const modifiedTitle = main_core.Loc.getMessage('REQUISITE_AUTOCOMPLETE_FILL_IN_01', {
					'#FIELD_NAME#': title
				});
				if (main_core.Type.isStringFilled(modifiedTitle)) {
					title = modifiedTitle;
				}
			}
			return title;
		}
		adjustNodesVisibility() {
			if (!this._domNodes.autocompleteForm || !this._domNodes.requisiteSelectForm || !this._domNodes.bankDetailSelectForm || !this._domNodes.addButton) {
				return;
			}
			if (this.isSearchMode && this.isAutocompleteEnabled()) {
				this._domNodes.autocompleteForm.style.display = '';
				this._domNodes.requisiteSelectForm.style.display = 'none';
				this._domNodes.addButton.style.display = 'none';
				this._domNodes.bankDetailSelectForm.style.display = 'none';
			} else if (this.isSelectModeEnabled() && this.hasRequisites() && (this.getRequisites().getList().length > 1 || this.getRequisites().getList().length > 0 && !this.getRequisites().getSelected().isAddressOnly())) {
				this._domNodes.autocompleteForm.style.display = 'none';
				this._domNodes.requisiteSelectForm.style.display = '';
				this._domNodes.bankDetailSelectForm.style.display = '';
				this._domNodes.addButton.style.display = 'none';
				if (this._domNodes.bankDetailsSelectContainer) {
					const bankDetails = this.getRequisites().getSelected().getBankDetails();
					if (!bankDetails.length) {
						this._domNodes.bankDetailsSelectContainer.style.display = 'none';
					} else {
						this._domNodes.bankDetailsSelectContainer.style.display = '';
					}
				}
			} else {
				this._domNodes.autocompleteForm.style.display = 'none';
				this._domNodes.requisiteSelectForm.style.display = 'none';
				this._domNodes.addButton.style.display = '';
				this._domNodes.bankDetailSelectForm.style.display = 'none';
			}
		}
		getSelectedRequisiteTitle() {
			let title = '';
			if (!this.hasRequisites()) {
				return title;
			}
			const selectedRequisite = this.getRequisites().getSelected();
			if (selectedRequisite) {
				title = selectedRequisite.getTitle();
			}
			return title;
		}
		updateRequisiteSelectorValue() {
			if (!this.requisitesDropdown || !this.requisitesDropdown.targetElement) {
				return;
			}
			this.requisitesDropdown.targetElement.innerText = this.getSelectedRequisiteTitle();
		}
		updateBankDetailsSelectorValue() {
			if (!this.bankDetailsDropdown || !this.bankDetailsDropdown.targetElement) {
				return;
			}
			this.bankDetailsDropdown.targetElement.innerText = this.getSelectedBankDetailTitle();
		}
		getSelectedBankDetailTitle() {
			let title = '';
			if (!this.hasRequisites()) {
				return title;
			}
			const selectedRequisite = this.getRequisites().getSelected();
			if (selectedRequisite) {
				const bankDetail = selectedRequisite.getBankDetailById(selectedRequisite.getSelectedBankDetailId());
				if (bankDetail && bankDetail.title) {
					title = bankDetail.title;
				}
			}
			return title;
		}
		getDefaultPresetId() {
			for (let preset of BX.prop.getArray(this._schemeElement.getData(), "presets", [])) {
				if (preset.IS_DEFAULT) {
					return preset.VALUE;
				}
			}
			return null;
		}
		getSelectedPresetId() {
			let selectedRequisite = this.hasRequisites() ? this.getRequisites().getSelected() : null;
			if (selectedRequisite) {
				return selectedRequisite.getPresetId();
			}
			return this.getDefaultPresetId();
		}
		getClientResolverPropForPreset(presetId) {
			for (let preset of BX.prop.getArray(this._schemeElement.getData(), "presets", [])) {
				if (preset.VALUE === presetId) {
					return BX.prop.get(preset, 'CLIENT_RESOLVER_PROP', null);
				}
			}
			return null;
		}
		getAutocompleteContext() {
			return {
				presetId: this.getSelectedPresetId()
			};
		}
		toggleNewRequisitePresetMenu(e) {
			this.presetMenu.toggle(e.target);
		}
		getPresetList() {
			let presets = [];
			for (let item of BX.prop.getArray(this._schemeElement.getData(), "presets")) {
				let value = BX.prop.getString(item, "VALUE", 0);
				let name = BX.prop.getString(item, "NAME", value);
				presets.push({
					name: name,
					value: value
				});
			}
			return presets;
		}
		addRequisite(params) {
			main_core_events.EventEmitter.emit(this, 'onEditNew', params);
		}
		editRequisite(id, options) {
			main_core_events.EventEmitter.emit(this, 'onEditExisted', {
				id,
				options
			});
		}
		deleteRequisite(id) {
			this._tooltip.removeDebouncedEvents();
			this._tooltip.close();
			main_core_events.EventEmitter.emit(this, 'onDelete', {
				id,
				postponed: this._mode === BX.UI.EntityEditorMode.edit
			});
		}
		hideRequisite(id) {
			this.markAsChanged();
			this._autocomplete.setCurrentItem(null);
			main_core_events.EventEmitter.emit(this, 'onHide', {
				id
			});
		}
		showDeleteConfirmation(requisiteId) {
			BX.Crm.EditorAuxiliaryDialog.create("delete_requisite_confirmation", {
				title: main_core.Loc.getMessage('REQUISITE_LIST_ITEM_DELETE_CONFIRMATION_TITLE'),
				content: main_core.Loc.getMessage('REQUISITE_LIST_ITEM_DELETE_CONFIRMATION_CONTENT'),
				buttons: [{
					id: "yes",
					type: BX.Crm.DialogButtonType.accept,
					text: main_core.Loc.getMessage("CRM_EDITOR_YES"),
					callback: button => {
						button.getDialog().close();
						this.markAsChanged();
						this.deleteRequisite(requisiteId);
					}
				}, {
					id: "no",
					type: BX.Crm.DialogButtonType.cancel,
					text: main_core.Loc.getMessage("CRM_EDITOR_NO"),
					callback: button => {
						button.getDialog().close();
					}
				}]
			}).open();
		}
		showClearConfirmation(requisiteId) {
			BX.Crm.EditorAuxiliaryDialog.create("hide_requisite_confirmation", {
				title: main_core.Loc.getMessage('REQUISITE_LIST_ITEM_HIDE_CONFIRMATION_TITLE'),
				content: main_core.Loc.getMessage('REQUISITE_LIST_ITEM_HIDE_CONFIRMATION_CONTENT'),
				buttons: [{
					id: "yes",
					type: BX.Crm.DialogButtonType.accept,
					text: main_core.Loc.getMessage("CRM_EDITOR_YES"),
					callback: button => {
						button.getDialog().close();
						this.hideRequisite(requisiteId);
					}
				}, {
					id: "no",
					type: BX.Crm.DialogButtonType.cancel,
					text: main_core.Loc.getMessage("CRM_EDITOR_NO"),
					callback: button => {
						button.getDialog().close();
					}
				}]
			}).open();
		}
		editDefaultRequisite() {
			let selectedRequisiteId = this.hasRequisites() ? this.getRequisites().getSelectedId() : null;
			if (null !== selectedRequisiteId) {
				this.editRequisite(selectedRequisiteId, {
					autocompleteState: this._autocomplete.getState()
				});
			} else {
				this.addRequisite({
					presetId: this.getDefaultPresetId(),
					autocompleteState: this._autocomplete.getState()
				});
			}
		}
		onChangeRequisites() {
			if (this._domNodes && main_core.Type.isDomNode(this._domNodes.addButton) && this._domNodes.addButton.style.display !== 'none' || this.hasRequisites() && this.getRequisites().isEmpty() || this.hasRequisites() && this.getRequisites().getSelected().isAddressOnly()) {
				// this.refreshLayout();
				this.refreshLayoutParts();
			} else {
				this.refreshLayoutParts();
			}
			this.updateAutocompletePlaceholder();
			this.updateAutocompeteClientResolverPlacementParams();
		}
		updateRequisitesDropdown() {
			if (!this.requisitesDropdown) {
				return;
			}
			const items = [];
			if (this.hasRequisites()) {
				this.getRequisites().getList().forEach((requisiteItem, index) => {
					items.push({
						id: requisiteItem.getRequisiteId(),
						title: requisiteItem.getTitle(),
						subTitle: requisiteItem.getSubtitle(),
						index
					});
				});
			}
			this.requisitesDropdown.setItems(items);
		}
		updateBankDetailsDropdown() {
			if (!this.bankDetailsDropdown) {
				return;
			}
			const items = [];
			if (this.hasRequisites() && this.getRequisites().getSelected()) {
				const bankDetails = this.getRequisites().getSelected().getBankDetails();
				if (bankDetails.length) {
					bankDetails.forEach((bankDetail, index) => {
						items.push({
							id: bankDetail.id,
							title: bankDetail.title,
							subTitle: bankDetail.value,
							index
						});
					});
				}
			}
			this.bankDetailsDropdown.setItems(items);
		}
		onRequisiteSelect(sender, {
			index
		}) {
			if (!this.hasRequisites()) {
				return;
			}
			if (index !== undefined) {
				const selectedRequisiteId = Number(this.getRequisites().getSelectedId());
				if (selectedRequisiteId !== index) {
					this.getRequisites().setSelected(index);
					this.markAsChanged();
				}
			}
			if (this.requisitesDropdown) {
				this.requisitesDropdown.getPopupWindow().close();
			}
		}
		onBankDetailSelect(sender, {
			index
		}) {
			if (!this.hasRequisites() || !this.bankDetailsDropdown) {
				return;
			}
			if (index !== undefined) {
				const selectedRequisiteId = Number(this.getRequisites().getSelectedId());
				const selectedBankDetailId = Number(this.getRequisites().getSelected().getSelectedBankDetailId());
				if (selectedBankDetailId !== index) {
					this.getRequisites().setSelected(selectedRequisiteId, index);
					this.markAsChanged();
				}
			}
			this.bankDetailsDropdown.getPopupWindow().close();
		}
		onAddRequisiteFromMenu(event) {
			let data = event.getData();
			const selectedRequisite = this.hasRequisites() ? this.getRequisites().getSelected() : null;
			// if hidden requisite is selected, it will be used instead of new:
			if (null !== selectedRequisite && selectedRequisite.isAddressOnly()) {
				this.editRequisite(this.getRequisites().getSelectedId(), {
					editorOptions: {
						overriddenPresetId: data.value
					}
				});
			} else {
				this.addRequisite({
					presetId: data.value
				});
			}
		}
		onAddRequisiteFromTooltip(event) {
			this.addRequisite(event.getData());
		}
		onAddRequisiteFromAutocomplete() {
			this.editDefaultRequisite();
		}
		onEditRequisite(event) {
			let eventData = event.getData();
			this.editRequisite(eventData.id, {
				autocompleteState: this._autocomplete.getState()
			});
		}
		onDeleteRequisite(event) {
			let eventData = event.getData();
			this.showDeleteConfirmation(eventData.id);
		}
		onAddBankDetails(event) {
			let eventData = event.getData();
			this.editRequisite(eventData.requisiteId, {
				editorOptions: {
					addBankDetailsItem: true
				},
				autocompleteState: this._autocomplete.getState()
			});
		}
		onSelectAutocompleteValue(event) {
			let data = event.getData();
			this.markAsChanged();
			this._autocomplete.setLoading(true);
			if (this.selectModeEnabled) {
				this.isSearchMode = false;
			}
			const selectedRequisiteId = this.hasRequisites() ? this.getRequisites().getSelectedId() : null;
			main_core_events.EventEmitter.emit(this, 'onFinishAutocomplete', {
				id: selectedRequisiteId,
				defaultPresetId: this.getDefaultPresetId(),
				autocompleteState: this._autocomplete.getState(),
				data
			});
		}
		onClearAutocompleteValue() {
			let selectedRequisiteId = this.hasRequisites() ? this.getRequisites().getSelectedId() : null;
			if (null !== selectedRequisiteId) {
				let selectedRequisite = this.getRequisites().getSelected();
				let hasAddresses = false;
				let addresses = selectedRequisite.getAddressList();
				for (let addressType in addresses) {
					if (addresses.hasOwnProperty(addressType) && main_core.Type.isStringFilled(addresses[addressType])) {
						hasAddresses = true;
						break;
					}
				}
				if (hasAddresses) {
					this.showClearConfirmation(selectedRequisiteId);
				} else {
					this.showDeleteConfirmation(selectedRequisiteId);
				}
			}
		}
		onInstallDefaultApp() {
			BX.onGlobalCustomEvent("BX.Crm.RequisiteAutocomplete:onAfterInstallDefaultApp");
		}
		onInstallDefaultAppGlobal() {
			BX.ajax.runAction('crm.requisite.schemedata.getRequisitesSchemeData', {
				data: {
					entityTypeId: this.getEditor().getEntityTypeId()
				}
			}).then(data => {
				if (main_core.Type.isPlainObject(data) && data.hasOwnProperty("data") && main_core.Type.isPlainObject(data["data"])) {
					this._schemeElement.setData(data["data"]);
					this.updateAutocompletePlaceholder();
					this.updateAutocompeteClientResolverPlacementParams();
				}
			});
		}
		onViewStringClick() {
			if (!this.getEditor().isReadOnly()) {
				this._tooltip.removeDebouncedEvents();
				this._tooltip.close();
				this.switchToSingleEditMode();
			}
		}
		onViewStringMouseEnter() {
			if (this._mode === BX.UI.EntityEditorMode.view && this.hasValue()) {
				this._tooltip.showDebounced();
			}
		}
		onSetSelectedRequisite(event) {
			let eventData = event.getData();
			if (!this.getEditor().isReadOnly()) {
				main_core_events.EventEmitter.emit(this, 'onSetDefault', eventData);
			}
			return false;
		}
		onFieldMouseEnter() {
			if (this._mode === BX.UI.EntityEditorMode.view && this.hasValue()) {
				this._tooltip.showDebounced(5);
			}
		}
		onFieldMouseLeave() {
			this._tooltip.closeDebounced();
			this._tooltip.cancelShowDebounced();
		}
		onAddBankDetailsClick(event) {
			event.preventDefault();
			let selectedRequisiteId = this.hasRequisites() ? this.getRequisites().getSelectedId() : null;
			if (null !== selectedRequisiteId) {
				this.editRequisite(selectedRequisiteId, {
					autocompleteState: this._autocomplete.getState(),
					editorOptions: {
						addBankDetailsItem: true
					}
				});
			}
		}
	}

	class EntityEditorRequisiteAddressField extends crm_entityEditor_field_address.EntityEditorAddressField {
		initialize(id, settings) {
			super.initialize(id, settings);
			main_core_events.EventEmitter.emit(this.getEditor(), 'onFieldInit', {
				field: this
			});
		}
		rollback() {
			// rollback will be executed in requisite controller
		}
		reset() {
			// reset will be executed in requisite controller
		}
		onAddressListUpdate(event) {
			super.onAddressListUpdate(event);
			main_core_events.EventEmitter.emit(this, 'onAddressListUpdate', event);
		}
		static create(id, settings) {
			let self = new this(id, settings);
			self.initialize(id, settings);
			return self;
		}
	}

	class EntityEditorClientRequisites {
		constructor() {
			this._id = "";
			this._entityInfo = null;
			this._fieldsParams = null;
			this._loaderConfig = null;
			this._addressConfig = null;
			this._requisiteList = null;
			this._requisiteEditor = null;
			this._permissionToken = null;
			this._readonly = true;
			this._requisiteEditUrl = null;
			this._addressContainer = null;
			this._formElement = null;
			this._showTooltipOnEntityLoad = false;
		}
		initialize(id, settings) {
			this._id = BX.type.isNotEmptyString(id) ? id : BX.util.getRandomString(4);
			this.setEntity(BX.prop.get(settings, "entityInfo", null), false);
			if (!this._entityInfo) {
				throw "EntityEditorClientRequisites: EntityInfo must be instance of BX.CrmEntityInfo";
			}
			this._fieldsParams = BX.prop.get(settings, "fieldsParams", null);
			if (!this._fieldsParams) {
				throw "EntityEditorClientRequisites: Fields params are undefined";
			}
			this._addressConfig = BX.prop.getObject(this._fieldsParams, 'ADDRESS', null);
			this._requisitesConfig = BX.prop.getObject(this._fieldsParams, 'REQUISITES', null);
			if (this._requisiteList) {
				let selectedItem = BX.prop.getObject(settings, "requisiteBinding", null);
				if (selectedItem && !main_core.Type.isUndefined(selectedItem.REQUISITE_ID) && !main_core.Type.isUndefined(selectedItem.BANK_DETAIL_ID)) {
					let requisite = this._requisiteList.getByRequisiteId(selectedItem.REQUISITE_ID);
					if (requisite) {
						let bankDetail = selectedItem.BANK_DETAIL_ID > 0 ? requisite.getBankDetailByBankDetailId(selectedItem.BANK_DETAIL_ID) : null;
						this._requisiteList.setSelected(this._requisiteList.indexOf(requisite), bankDetail ? requisite.getBankDetails().indexOf(bankDetail) : null);
					}
				}
			}
			this._loaderConfig = BX.prop.getObject(settings, 'loaderConfig', null);
			this._readonly = BX.prop.getBoolean(settings, "readonly", true);
			this._canChangeDefaultRequisite = BX.prop.getBoolean(settings, "canChangeDefaultRequisite", true);
			this._requisiteEditUrl = BX.prop.getString(settings, "requisiteEditUrl", null);
			this._formElement = BX.prop.get(settings, "formElement", null);
			this._permissionToken = BX.prop.getString(settings, "permissionToken", null);
			if (BX.prop.getBoolean(settings, "enableTooltip", true) && !main_core.Type.isNull(this._requisitesConfig)) {
				this._tooltip = EntityEditorRequisiteTooltip.create(this._id + '_client_requisite_details', {
					readonly: this._readonly,
					canChangeDefaultRequisite: this._canChangeDefaultRequisite,
					presets: this.getRequisitesPresetList()
				});
			}
			this._requisiteEditor = EntityEditorRequisiteEditor.create(this._id + '_rq_editor', {
				entityTypeId: this._entityInfo.getTypeId(),
				entityId: this._entityInfo.getId(),
				contextId: BX.prop.getString(settings, "contextId", ""),
				requisiteEditUrl: this._requisiteEditUrl,
				permissionToken: this._permissionToken
			});
			this._requisiteEditor.setRequisiteList(this._requisiteList);
			main_core_events.EventEmitter.subscribe(this._requisiteEditor, 'onAfterEditRequisite', this.onRequisiteEditorAfterEdit.bind(this));
			main_core_events.EventEmitter.subscribe(this._requisiteEditor, 'onAfterDeleteRequisite', this.onRequisiteEditorAfterDelete.bind(this));
			if (this._tooltip) {
				main_core_events.EventEmitter.subscribe(this._tooltip, 'onAddRequisite', this.onEditNewRequisite.bind(this));
				main_core_events.EventEmitter.subscribe(this._tooltip, 'onEditRequisite', this.onEditExistedRequisite.bind(this));
				main_core_events.EventEmitter.subscribe(this._tooltip, 'onDeleteRequisite', this.onDeleteRequisite.bind(this));
				main_core_events.EventEmitter.subscribe(this._tooltip, 'onAddBankDetails', this.onAddBankDetails.bind(this));
				main_core_events.EventEmitter.subscribe(this._tooltip, 'onSetSelectedRequisite', this.onSetSelectedRequisite.bind(this));
				main_core_events.EventEmitter.subscribe(this._tooltip, 'onShow', this.onShowTooltip.bind(this));
			}
		}
		setEntity(entityInfo, emitNotification) {
			this._entityInfo = entityInfo;
			if (this._entityInfo.hasEditRequisiteData()) {
				this._requisiteList = RequisiteList.create(this._entityInfo.getRequisites());
			}
			if (emitNotification) {
				this.onChangeRequisiteList();
			}
		}
		addressLayout(container) {
			if (!main_core.Type.isDomNode(container)) {
				return;
			}
			this._addressContainer = main_core.Tag.render`<div class="crm-entity-widget-client-address"></div>`;
			main_core.Dom.append(this._addressContainer, container);
			this.doAddressLayout();
		}
		doAddressLayout() {
			if (!main_core.Type.isDomNode(this._addressContainer)) {
				return;
			}
			main_core.Dom.clean(this._addressContainer);
			if (!main_core.Type.isNull(this._addressConfig)) {
				if (this._entityInfo.hasEditRequisiteData()) {
					let defaultRequisite = this._requisiteList.getSelected();
					let addressValue = defaultRequisite ? defaultRequisite.getAddressList() : null;
					if (!main_core.Type.isNull(addressValue) && Object.keys(addressValue).length) {
						let countryId = 0;
						if (defaultRequisite) {
							countryId = parseInt(defaultRequisite.getPresetCountryId());
						}
						this._addressField = crm_entityEditor_field_address_base.EntityEditorBaseAddressField.create(this._entityInfo.getId(), {
							showFirstItemOnly: true,
							showAddressTypeInViewMode: true,
							addressZoneConfig: BX.prop.getObject(this._addressConfig, "addressZoneConfig", {}),
							countryId: countryId,
							defaultAddressTypeByCategory: BX.prop.getInteger(this._addressConfig, "defaultAddressTypeByCategory", 0)
						});
						this._addressField.setMultiple(true);
						this._addressField.setTypesList(BX.prop.getObject(this._addressConfig, "types", {}));
						this._addressField.setValue(addressValue);
						main_core.Dom.append(this._addressField.layout(false), this._addressContainer);
					}
				} else {
					let showAddressLink = main_core.Tag.render`
				<span class="ui-link ui-link-secondary ui-link-dotted" onmouseup="${this.onLoadAddressMouseUp.bind(this)}">
					${main_core.Loc.getMessage('CLIENT_REQUISITES_ADDRESS_SHOW_ADDRESS')}
				</span>`;
					main_core.Dom.append(showAddressLink, this._addressContainer);
				}
			}
		}
		showTooltip(bindElement) {
			if (!this._tooltip) {
				return;
			}
			if (this._entityInfo.hasEditRequisiteData()) {
				this._tooltip.setRequisites(this._requisiteList);
				if (this.isRequisiteAddressOnly()) {
					return;
				}
			}
			this._tooltip.setBindElement(bindElement, this._formElement);
			this._tooltip.showDebounced();
		}
		closeTooltip() {
			if (!this._tooltip) {
				return;
			}
			this._tooltip.closeDebounced();
			this._tooltip.cancelShowDebounced();
			this._showTooltipOnEntityLoad = false;
		}
		release() {
			if (this._addressField) {
				this._addressField.release();
			}
			if (this._tooltip) {
				this._tooltip.close();
				this._tooltip.removeDebouncedEvents();
			}
			if (this._requisiteEditor) {
				this._requisiteEditor.release();
			}
		}
		loadEntity() {
			if (!this._loaderConfig) {
				return;
			}
			if (main_core.Type.isDomNode(this._addressContainer)) {
				let loader = new main_loader.Loader({
					size: 19,
					mode: 'inline'
				});
				main_core.Dom.clean(this._addressContainer);
				loader.show(this._addressContainer);
			}
			BX.CrmDataLoader.create(this._id, {
				serviceUrl: this._loaderConfig["url"],
				action: this._loaderConfig["action"],
				params: {
					"ENTITY_TYPE_NAME": this._entityInfo.getTypeName(),
					"ENTITY_ID": this._entityInfo.getId(),
					"NORMALIZE_MULTIFIELDS": "Y"
				}
			}).load(this.onEntityInfoLoad.bind(this));
		}
		getRequisitesPresetList() {
			if (main_core.Type.isNull(this._requisitesConfig)) {
				return [];
			}
			let presets = [];
			for (let item of BX.prop.getArray(this._requisitesConfig, "presets")) {
				let value = BX.prop.getString(item, "VALUE", 0);
				let name = BX.prop.getString(item, "NAME", value);
				presets.push({
					name: name,
					value: value
				});
			}
			return presets;
		}
		deleteRequisite(id) {
			if (this._tooltip) {
				this._tooltip.removeDebouncedEvents();
				this._tooltip.close();
			}
			this._requisiteEditor.deleteRequisite(id);
		}
		isRequisiteAddressOnly() {
			let list = this._requisiteList.getList();
			return list.length === 1 && list[0].isAddressOnly();
		}
		onLoadAddressMouseUp(event) {
			event.stopPropagation(); // cancel switching client to edit mode
			this.loadEntity();
		}
		onEntityInfoLoad(sender, result) {
			var entityData = BX.prop.getObject(result, "DATA", null);
			if (entityData) {
				this.setEntity(BX.CrmEntityInfo.create(entityData), true);
				if (this._tooltip && this._showTooltipOnEntityLoad) {
					if (!this.isRequisiteAddressOnly()) {
						this._tooltip.show();
					}
					this._showTooltipOnEntityLoad = false;
				}
			}
		}
		onEditNewRequisite(event) {
			let params = event.getData();
			params.selected = this._requisiteList.isEmpty();
			let requisite = RequisiteListItem.create(null, {
				'newRequisiteId': this._requisiteList.getNewRequisiteId(),
				'newRequisiteExtraFields': params
			});
			requisite.setRequisiteId(this._requisiteList.getNewRequisiteId());
			this._requisiteEditor.open(requisite);
		}
		onEditExistedRequisite(event) {
			let params = event.getData();
			let requisite = this._requisiteList.getById(params.id);
			if (requisite) {
				this._requisiteEditor.open(requisite, {});
			}
		}
		onDeleteRequisite(event) {
			let eventData = event.getData();
			BX.Crm.EditorAuxiliaryDialog.create("delete_requisite_confirmation", {
				title: main_core.Loc.getMessage('REQUISITE_LIST_ITEM_DELETE_CONFIRMATION_TITLE'),
				content: main_core.Loc.getMessage('REQUISITE_LIST_ITEM_DELETE_CONFIRMATION_CONTENT'),
				buttons: [{
					id: "yes",
					type: BX.Crm.DialogButtonType.accept,
					text: main_core.Loc.getMessage("CRM_EDITOR_YES"),
					callback: button => {
						button.getDialog().close();
						this.deleteRequisite(eventData.id);
					}
				}, {
					id: "no",
					type: BX.Crm.DialogButtonType.cancel,
					text: main_core.Loc.getMessage("CRM_EDITOR_NO"),
					callback: button => {
						button.getDialog().close();
					}
				}]
			}).open();
		}
		onAddBankDetails(event) {
			let eventData = event.getData();
			let requisite = this._requisiteList.getById(eventData.requisiteId);
			if (requisite) {
				this._requisiteEditor.open(requisite, {
					addBankDetailsItem: true
				});
			}
		}
		onSetSelectedRequisite(event) {
			let eventData = event.getData();
			this._requisiteList.setSelected(eventData.id, eventData.bankDetailId);
			this.doAddressLayout();
			let newSelectedRequisite = this._requisiteList.getSelected();
			if (newSelectedRequisite) {
				let selectedBankDetail = newSelectedRequisite.getBankDetailById(newSelectedRequisite.getSelectedBankDetailId());
				let selectedBankDetailId = main_core.Type.isNull(selectedBankDetail) ? 0 : selectedBankDetail.id;
				main_core_events.EventEmitter.emit(this, 'onSetSelectedRequisite', {
					requisiteId: newSelectedRequisite.getRequisiteId(),
					bankDetailId: selectedBankDetailId
				});
			}
		}
		onRequisiteEditorAfterEdit(event) {
			this.onChangeRequisiteList();
		}
		onRequisiteEditorAfterDelete(event) {
			this.onChangeRequisiteList();
		}
		onChangeRequisiteList() {
			this.doAddressLayout();
			if (this._tooltip) {
				this._tooltip.setRequisites(this._requisiteList);
				this._tooltip.setLoading(false);
			}
			this._requisiteEditor.setRequisiteList(this._requisiteList);
			let requisiteList = this._requisiteList ? this._requisiteList.exportToModel() : null;
			this._entityInfo.setRequisites(requisiteList);
			main_core_events.EventEmitter.emit(this, 'onChangeRequisiteList', {
				entityTypeName: this._entityInfo.getTypeName(),
				entityId: this._entityInfo.getId(),
				requisites: this._requisiteList.exportToModel()
			});
		}
		onShowTooltip() {
			if (!this._entityInfo.hasEditRequisiteData()) {
				if (this._tooltip) {
					this._tooltip.close();
					this._showTooltipOnEntityLoad = true;
				}
				this.loadEntity();
			} else if (this.isRequisiteAddressOnly()) {
				this._tooltip.close();
			}
		}
		static create(id, settings) {
			let self = new EntityEditorClientRequisites();
			self.initialize(id, settings);
			return self;
		}
	}

	exports.EntityEditorClientRequisites = EntityEditorClientRequisites;
	exports.EntityEditorRequisiteAddressField = EntityEditorRequisiteAddressField;
	exports.EntityEditorRequisiteController = EntityEditorRequisiteController;
	exports.EntityEditorRequisiteEditor = EntityEditorRequisiteEditor;
	exports.EntityEditorRequisiteField = EntityEditorRequisiteField;
	exports.EntityEditorRequisiteTooltip = EntityEditorRequisiteTooltip;
	exports.RequisiteList = RequisiteList;

})(this.BX.Crm = this.BX.Crm || {}, BX, BX.Event, BX.UI.Dialogs, BX, BX, BX, BX.Crm, BX.Main, BX, BX, BX.Crm, BX.Crm);
//# sourceMappingURL=requisite.bundle.js.map
