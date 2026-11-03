/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, main_popup) {
	'use strict';

	/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */


	// A div or span with role="button" gets no click of its own from Enter or Space, unlike a real
	// button, so the key has to raise one. Going through click() rather than calling the handler keeps
	// a single path for both devices: the handlers read event.target, and a click raised on the
	// container binds the menu to the field instead of to whichever inner div the mouse happened to hit.
	//
	// The depth is module-local rather than shared with ui.entity-editor: this extension declares no
	// dependency on it, and reaching for BX.UI.EntityEditorControl from here would create an undeclared
	// one. Activation and the menu it opens run in one synchronous call, so the flag is still raised
	// while the menu decides whether to take a focus trap.
	let keyboardActivationDepth = 0;
	function activateOnKey(event) {
		if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') {
			return false;
		}

		// Space would otherwise scroll the card out from under the control.
		event.preventDefault();
		keyboardActivationDepth++;
		try {
			event.currentTarget.click();
		} finally {
			keyboardActivationDepth--;
		}
		return true;
	}
	function isKeyboardActivation() {
		return keyboardActivationDepth > 0;
	}
	class EntityEditorBaseAddressField {
		initialize(id, settings) {
			this._id = BX.type.isNotEmptyString(id) ? id : BX.util.getRandomString(4);
			this._isMultiple = false;
			this._settings = settings ? settings : {};
			this._typesList = [];
			this._availableTypesIds = [];
			this._allowedTypeIds = [];
			this._addressList = [];
			this._wrapper = null;
			this._isEditMode = true;
			this._showFirstItemOnly = BX.prop.getBoolean(settings, 'showFirstItemOnly', false);
			this._enableAutocomplete = BX.prop.getBoolean(settings, 'enableAutocomplete', true);
			this._hideDefaultAddressType = BX.prop.getBoolean(this._settings, 'hideDefaultAddressType', false);
			this._showAddressTypeInViewMode = BX.prop.getBoolean(this._settings, 'showAddressTypeInViewMode', false);
			this._addrZoneConfig = BX.prop.getObject(this._settings, 'addressZoneConfig', {});
			this._countryId = BX.prop.getInteger(this._settings, 'countryId', BX.prop.getInteger(this._addrZoneConfig, "countryId", 0));
			this._defaultAddressType = BX.prop.getInteger(this._settings, 'defaultAddressTypeByCategory', 0);
			if (this._defaultAddressType <= 0) {
				this._defaultAddressType = BX.prop.getInteger(this._addrZoneConfig, 'defaultAddressType', 0);
			}
			this.updateAllowedTypes();
		}
		setMultiple(isMultiple) {
			this._isMultiple = !!isMultiple;
		}
		setValue(value) {
			if (this._isMultiple) {
				let items = main_core.Type.isPlainObject(value) ? value : {};
				let types = Object.keys(items);
				let isSame = this._addressList.length > 0 && types.length == this._addressList.length;
				if (isSame) {
					for (let addressItem of this._addressList) {
						let type = addressItem.getType();
						if (!items.hasOwnProperty(type) || items[type] !== addressItem.getValue()) {
							isSame = false;
							break;
						}
					}
				}
				if (
				// if new value is empty and old value has only one empty element
				!isSame && !types.length && this._addressList.length === 1 && !this._addressList[0].getValue().length) {
					isSame = true;
				}
				if (isSame) {
					return false; // update is not required
				}
				this.removeAllAddresses();
				for (let type of types) {
					this.addAddress(type, items[type]);
				}
				if (!types.length) {
					this.addAddress(this.getDefaultType(), null);
				}
			} else {
				this.removeAllAddresses();
				let address = main_core.Type.isStringFilled(value) ? value : null;
				this.addAddress(null, address);
			}
			return true;
		}
		getValue() {
			if (this._isMultiple) {
				let result = [];
				for (let addressItem of this._addressList) {
					let value = addressItem.getValue();
					if (main_core.Type.isString(value)) {
						result.push({
							type: addressItem.getType(),
							value
						});
					}
				}
				return result;
			} else {
				if (this._addressList && this._addressList[0] && main_core.Type.isString(this._addressList[0].getValue())) {
					return this._addressList[0].getValue();
				}
				return null;
			}
		}
		setTypesList(list) {
			this._typesList = [];
			if (main_core.Type.isPlainObject(list)) {
				for (let id of Object.keys(list)) {
					this._typesList.push(list[id]);
				}
			}
			this.initAvailableTypes();
		}
		getTypesList() {
			let types = [];
			for (let item of this._typesList) {
				let value = BX.prop.getString(item, "ID", "");
				let name = BX.prop.getString(item, "DESCRIPTION", "");
				types.push({
					name: name,
					value: value
				});
			}
			return types;
		}
		setAllowedTypes(typeIds) {
			this._allowedTypeIds = [];
			if (main_core.Type.isArray(typeIds)) {
				this._allowedTypeIds = typeIds;
			}
		}
		getAllowedTypes() {
			return this._allowedTypeIds;
		}
		setCountryId(countryId) {
			let needUpdateAllowedTypes = false;
			countryId = parseInt(countryId);
			if (this._countryId !== countryId) {
				needUpdateAllowedTypes = true;
			}
			this._countryId = countryId;
			if (needUpdateAllowedTypes) {
				this.updateAllowedTypes();
			}
		}
		getCountryId() {
			return this._countryId;
		}
		getAddressZoneConfig() {
			return this._addrZoneConfig;
		}
		getValueTypes() {
			let result = [];
			for (let addressItem of this._addressList) {
				let addressType = parseInt(addressItem.getType());
				if (result.indexOf(addressType) < 0) {
					result.push(addressType);
				}
			}
			return result;
		}
		updateAllowedTypes() {
			let allowedTypeList = [];
			let typeValues = this.getValueTypes();
			let countryId = this.getCountryId();
			let config = this.getAddressZoneConfig();
			if (main_core.Type.isPlainObject(config)) {
				if (config.hasOwnProperty("currentZoneAddressTypes") && main_core.Type.isArray(config["currentZoneAddressTypes"])) {
					let i;
					let typeId;
					let curZoneAddrTypes = config["currentZoneAddressTypes"];
					for (i = 0; i < curZoneAddrTypes.length; i++) {
						typeId = parseInt(curZoneAddrTypes[i]);
						if (allowedTypeList.indexOf(typeId) < 0) {
							allowedTypeList.push(typeId);
						}
					}
					if (countryId > 0 && config.hasOwnProperty("countryAddressTypeMap") && main_core.Type.isPlainObject(config["countryAddressTypeMap"]) && config["countryAddressTypeMap"].hasOwnProperty(countryId) && main_core.Type.isArray(config["countryAddressTypeMap"][countryId])) {
						let addrTypeMap = config["countryAddressTypeMap"][countryId];
						for (i = 0; i < addrTypeMap.length; i++) {
							typeId = parseInt(addrTypeMap[i]);
							if (allowedTypeList.indexOf(typeId) < 0) {
								allowedTypeList.push(typeId);
							}
						}
					}
					for (i = 0; i < typeValues.length; i++) {
						typeId = parseInt(typeValues[i]);
						if (allowedTypeList.indexOf(typeId) < 0) {
							allowedTypeList.push(typeId);
						}
					}
				}
			}
			this._allowedTypeIds = allowedTypeList;
			for (let addressItem of this._addressList) {
				addressItem.setAllowedTypesIds([...this._allowedTypeIds]);
			}
		}
		getDefaultType() {
			const defaultAddressTypeId = this._defaultAddressType.toString();
			if (defaultAddressTypeId > 0 && this._availableTypesIds.includes(defaultAddressTypeId) && this._allowedTypeIds.includes(main_core.Text.toInteger(defaultAddressTypeId))) {
				return defaultAddressTypeId;
			}
			for (const allowedTypeId of this._allowedTypeIds) {
				const strAllowedTypeId = allowedTypeId.toString();
				if (this._availableTypesIds.includes(strAllowedTypeId)) {
					const type = this._typesList.find(typeValue => {
						return typeValue.ID === strAllowedTypeId;
					});
					return type?.ID ?? null;
				}
			}
			return null;
		}
		layout(isEditMode) {
			this._isEditMode = isEditMode;
			this._wrapper = main_core.Tag.render`<div class="crm-address-control-wrap ${this._isEditMode ? 'crm-address-control-wrap-edit' : ''}"></div>`;
			this.refreshLayout();
			return this._wrapper;
		}
		refreshLayout() {
			main_core.Dom.clean(this._wrapper);
			let addrCounter = true;
			for (let addressItem of this._addressList) {
				addressItem.setEditMode(this._isEditMode);
				if (!this._isEditMode && this._showFirstItemOnly && addrCounter > 1) {
					let showMore = main_core.Tag.render`
					<span class="ui-link ui-link-secondary ui-link-dotted" onmouseup="${this.onShowMoreMouseUp.bind(this)}"
						>
						${main_core.Loc.getMessage('CRM_ADDRESS_SHOW_ALL')}
					</span>`;
					main_core.Dom.append(showMore, this._wrapper);
					break;
				} else {
					main_core.Dom.append(addressItem.layout(), this._wrapper);
				}
				addrCounter++;
			}
			if (this._isEditMode && this._isMultiple && !main_core.Type.isNull(this.getDefaultType())) {
				let crmCompatibilityMode = BX.prop.getBoolean(this._settings, 'crmCompatibilityMode', false);
				let addButtonWrapClass = crmCompatibilityMode ? 'crm-entity-widget-content-block-add-field' : 'ui-entity-widget-content-block-add-field';
				let addButtonClass = crmCompatibilityMode ? 'crm-entity-widget-content-add-field' : 'ui-entity-editor-content-add-lnk';
				// Bare span with a click handler, like the togglers above: no tab stop, no role (2.1.1).
				// Its own visible text is the accessible name.
				main_core.Dom.append(main_core.Tag.render`
				<div class="${addButtonWrapClass}"><span class="${addButtonClass}"
					role="button" tabindex="0"
					onclick="${this.onAddNewAddress.bind(this)}"
					onkeydown="${this.onActivationKeyDown.bind(this)}">${main_core.Loc.getMessage('CRM_ADDRESS_ADD')}</span></div>
			`, this._wrapper);
			}
		}
		onActivationKeyDown(event) {
			activateOnKey(event);
		}
		release() {
			main_core.Dom.clean(this._wrapper);
			this.removeAllAddresses();
		}
		removeAllAddresses() {
			let ids = this._addressList.map(item => item.getId());
			for (let id of ids) {
				this.removeAddress(id);
			}
		}
		addAddress(type, value = null) {
			let addressItem = new AddressItem(main_core.Text.getRandom(8), {
				typesList: this.getTypesList(),
				availableTypesIds: [...this._availableTypesIds],
				allowedTypesIds: [...this._allowedTypeIds],
				canChangeType: this._isMultiple,
				enableAutocomplete: this._enableAutocomplete,
				showAddressTypeInViewMode: this._isMultiple && this._showAddressTypeInViewMode,
				type,
				value
			});
			addressItem.subscribe('onUpdateAddress', this.onUpdateAddress.bind(this));
			addressItem.subscribe('onUpdateAddressType', this.onUpdateAddressType.bind(this));
			addressItem.subscribe('onDelete', this.onDeleteAddress.bind(this));
			addressItem.subscribe('onStartLoadAddress', this.onStartLoadAddress.bind(this));
			addressItem.subscribe('onAddressLoaded', this.onAddressLoaded.bind(this));
			addressItem.subscribe('onAddressDataInputting', this.onAddressDataInputting.bind(this));
			addressItem.subscribe('onError', this.onError.bind(this));
			addressItem.subscribe('onCopyAddress', this.onCopyAddress.bind(this));
			this.updateAvailableTypes(type, null);
			this._addressList.push(addressItem);
			this.updateAllowedTypes();
			this.updateTypeSelectorVisibility(this._addressList.length > 1);
			return addressItem;
		}
		removeAddress(id) {
			let addressItem = this.getAddressById(id);
			if (addressItem) {
				let type = addressItem.getType();
				this._addressList.splice(this._addressList.indexOf(addressItem), 1);
				this.updateAvailableTypes(null, type);
				this.updateAllowedTypes();
				this.updateTypeSelectorVisibility(this._addressList.length > 1);
				addressItem.destroy();
			}
		}
		getAddressById(id) {
			return this._addressList.filter(item => item.getId() === id).reduce((prev, item) => prev ? prev : item, null);
		}
		initAvailableTypes() {
			this._availableTypesIds = [];
			for (let type of this._typesList) {
				this._availableTypesIds.push(BX.prop.getString(type, "ID", ""));
			}
		}
		updateAvailableTypes(removedType, addedType) {
			if (!main_core.Type.isNull(addedType) && this._availableTypesIds.indexOf(addedType) < 0) {
				this._availableTypesIds.push(addedType);
			}
			if (!main_core.Type.isNull(removedType) && this._availableTypesIds.indexOf(removedType) >= 0) {
				this._availableTypesIds.splice(this._availableTypesIds.indexOf(removedType), 1);
			}
			for (let addressItem of this._addressList) {
				addressItem.setAvailableTypesIds([...this._availableTypesIds]);
			}
		}
		updateTypeSelectorVisibility(showTypeSelector) {
			if (!this._hideDefaultAddressType) {
				return;
			}
			for (let addressItem of this._addressList) {
				addressItem.setTypeSelectorVisibility(showTypeSelector);
			}
		}
		emitUpdateEvent() {
			main_core_events.EventEmitter.emit(this, 'onUpdate', {
				value: this.getValue()
			});
		}
		onAddNewAddress() {
			const addressItem = this.addAddress(this.getDefaultType());
			this.refreshLayout();

			// refreshLayout() rebuilds the block through Dom.clean(), and the "Add" link that has just
			// been activated goes with it. Removing a focused node drops the focus to <body> on the
			// spot - no rendering update needed, unlike hiding one - so a keyboard visitor would land
			// nowhere. They are put into the address they have just created instead.
			addressItem.focusFirstField();
		}
		onUpdateAddress(event) {
			this.emitUpdateEvent();
		}
		onDeleteAddress(event) {
			let data = event.getData();
			let id = data.id;
			if (this._addressList.length <= 1) {
				// should be at least one address, so just clear it
				let addressItem = this.getAddressById(id);
				if (addressItem) {
					addressItem.clearValue();
				}
				return;
			}
			this.removeAddress(id);
			this.refreshLayout();
		}
		onUpdateAddressType(event) {
			let data = event.getData();
			let prevType = data.prevType;
			let type = data.type;
			this.updateAvailableTypes(type, prevType);
			this.updateAllowedTypes();
			this.emitUpdateEvent();
		}
		onShowMoreMouseUp(event) {
			event.stopPropagation(); // cancel switching client to edit mode
			this._showFirstItemOnly = false;
			this.refreshLayout();
			return false;
		}
		onStartLoadAddress(event) {
			main_core_events.EventEmitter.emit(this, 'onStartLoadAddress');
		}
		onAddressLoaded(event) {
			main_core_events.EventEmitter.emit(this, 'onAddressLoaded');
		}
		onAddressDataInputting(event) {
			main_core_events.EventEmitter.emit(this, 'onAddressDataInputting');
		}
		onError(event) {
			main_core_events.EventEmitter.emit(this, 'onError', event);
		}
		onCopyAddress(event) {
			const data = event.getData();
			let sourceAddress = this.getAddressById(data.sourceId);
			if (!sourceAddress) {
				return;
			}
			const sourceAddressData = sourceAddress.getValue();
			if (!sourceAddressData.length) {
				return;
			}
			for (let i = 0; i < data.destinationTypes.length; i++) {
				const type = data.destinationTypes[i];
				let destinationAddress = this._addressList.filter(item => item.getType() == type).reduce((prev, cur) => prev ? prev : cur, null);
				if (destinationAddress) {
					destinationAddress.setValue(sourceAddressData);
				} else {
					destinationAddress = this.addAddress(type, sourceAddressData);
				}
				destinationAddress.markAsNew();
				this.refreshLayout();
			}
			this.emitUpdateEvent();
		}
		resetView() {
			for (const addressItem of this._addressList) {
				addressItem.resetView();
			}
		}
		static create(id, settings) {
			let self = new EntityEditorBaseAddressField();
			self.initialize(id, settings);
			return self;
		}
	}
	class AddressItem extends main_core_events.EventEmitter {
		constructor(id, settings) {
			super();
			this.setEventNamespace('BX.Crm.AddressItem');
			this._id = id;
			this._value = BX.prop.getString(settings, 'value', "");
			this._isTypesMenuOpened = false;
			this._typesList = BX.prop.getArray(settings, 'typesList', []);
			this._availableTypesIds = BX.prop.getArray(settings, 'availableTypesIds', []);
			this._allowedTypesIds = BX.prop.getArray(settings, 'allowedTypesIds', []);
			this._canChangeType = BX.prop.getBoolean(settings, 'canChangeType', false);
			this.typesMenuId = 'address_type_menu_' + this._id;
			this._type = BX.prop.getString(settings, 'type', "");
			this._isEditMode = true;
			this._isTypeSelectorVisible = BX.prop.getBoolean(settings, 'isTypeSelectorVisible', true);
			this._isAutocompleteEnabled = BX.prop.getBoolean(settings, 'enableAutocomplete', true);
			this._showAddressTypeInViewMode = BX.prop.getBoolean(settings, 'showAddressTypeInViewMode', true);
			this._showDetails = !this._isAutocompleteEnabled || BX.prop.getBoolean(settings, 'showDetails', false);
			this._isLoading = false;
			this._icon = null;
			this._isDropdownLoading = false;
			this._addressWidget = null;
			this._wrapper = null;
			this._domNodes = {};
			this._selectedCopyDestinations = [];
			this._isLocationModuleInstalled = !main_core.Type.isUndefined(BX.Location) && !main_core.Type.isUndefined(BX.Location.Core) && !main_core.Type.isUndefined(BX.Location.Widget);
			this.initializeAddressWidget();
		}
		initializeAddressWidget() {
			if (!this._isLocationModuleInstalled) {
				return;
			}
			let value = this.getValue();
			let address = null;
			if (main_core.Type.isStringFilled(value)) {
				try {
					address = new BX.Location.Core.Address(JSON.parse(value));
				} catch (e) {}
			}
			let widgetFactory = new BX.Location.Widget.Factory();
			this._addressWidget = widgetFactory.createAddressWidget({
				address: address,
				mode: this._isEditMode ? BX.Location.Core.ControlMode.edit : BX.Location.Core.ControlMode.view,
				popupBindOptions: {
					position: 'right'
				}
			});
			this._addressWidget.subscribeOnStateChangedEvent(this.onAddressWidgetChangedState.bind(this));
			this._addressWidget.subscribeOnAddressChangedEvent(this.onAddressChanged.bind(this));
			this._addressWidget.subscribeOnFeatureEvent(this.onFeatureEvent.bind(this));
			this._addressWidget.subscribeOnErrorEvent(this.onError.bind(this));
		}
		getId() {
			return this._id;
		}
		getType() {
			return this._type;
		}
		getValue() {
			return this._value;
		}
		setValue(value) {
			this.destroy();
			this._value = value;
			this.initializeAddressWidget();
		}
		markAsNew() {
			let address = this.getAddress();
			if (address) {
				address.id = 0;
				address.clearLinks();
			}
			this._value = address ? address.toJson() : '';
		}
		setEditMode(isEditMode) {
			this._isEditMode = !!isEditMode;
			if (!main_core.Type.isNull(this._addressWidget)) {
				this._addressWidget.mode = isEditMode ? BX.Location.Core.ControlMode.edit : BX.Location.Core.ControlMode.view;
			}
		}
		setAvailableTypesIds(ids) {
			this._availableTypesIds = ids;
		}
		setAllowedTypesIds(ids) {
			this._allowedTypesIds = ids;
		}
		getTypeListByIds(ids) {
			let result = [];
			if (main_core.Type.isArray(ids) && ids.length > 0) {
				let typeMap = {};
				for (let item of this._typesList) {
					typeMap["a" + item.value] = item;
				}
				for (let typeId of ids) {
					let index = "a" + typeId;
					if (typeMap.hasOwnProperty(index)) {
						result.push(typeMap[index]);
					}
				}
			}
			return result;
		}
		layout() {
			if (main_core.Type.isNull(this._addressWidget)) {
				this._wrapper = main_core.Tag.render`<div>Location module is not installed</div>`;
				return this._wrapper;
			}
			let addressWidgetParams = {};
			const addressString = this.convertAddressToString(this.getAddress());
			if (this._isEditMode) {
				this._wrapper = this.getEditHtml(addressString);
				addressWidgetParams.mode = BX.Location.Core.ControlMode.edit;
				addressWidgetParams.inputNode = this._domNodes.searchInput;
				addressWidgetParams.mapBindElement = this._domNodes.searchInput;
				addressWidgetParams.fieldsContainer = this._domNodes.detailsContainer;
				addressWidgetParams.controlWrapper = this._domNodes.addressContainer;
			} else {
				this._wrapper = this.getViewHtml(addressString);
				addressWidgetParams.mode = BX.Location.Core.ControlMode.view;
				addressWidgetParams.mapBindElement = this._wrapper;
			}
			addressWidgetParams.controlWrapper = this._domNodes.addressContainer;
			this._addressWidget.render(addressWidgetParams);
			return this._wrapper;
		}
		openTypesMenu(bindElement) {
			if (this._isTypesMenuOpened) {
				return;
			}
			let menu = [];
			let allowedTypes = [...this._allowedTypesIds];
			let selectedTypeId = parseInt(this._type);
			if (allowedTypes.indexOf(selectedTypeId) < 0) {
				allowedTypes.push(selectedTypeId);
			}
			for (let item of this.getTypeListByIds(allowedTypes)) {
				let selected = selectedTypeId === parseInt(item.value);
				if (this._availableTypesIds.indexOf(item.value) < 0 && !selected) {
					continue;
				}
				menu.push({
					text: item.name,
					value: item.value,
					//className: selected ? "menu-popup-item-accept" : "menu-popup-item-none",
					onclick: this.onChangeType.bind(this)
				});
			}

			/*
				Opening from the keyboard would throw the card to the top: MenuNavigation focuses the
				first item on the menu's own onShow, before the popup has been positioned - measured,
				the item still sits at document 0,0 at that moment - and MenuItem.focus() passes
				preventScroll: false, so the browser scrolls that far-away item into view while the menu
				stays anchored to its button, off screen. The jump is synchronous inside show() and the
				popup is positioned in document coordinates, so putting the scroll back the moment show()
				returns leaves the menu exactly where it belongs. The cause itself is in main.popup
				(menu-navigation.ts, menu-item.ts) and is out of this ticket's reach.
			*/
			const scroller = document.scrollingElement;
			const scrollTop = scroller ? scroller.scrollTop : 0;
			main_popup.MenuManager.show(this.typesMenuId, bindElement, menu, {
				angle: false,
				cacheable: false,
				/*
					Without a focus trap the menu opens with focus left behind on the selector:
					MenuNavigation moves focus onto the first item only while Menu.getFocusTrap()
					is not null, items keep tabindex="-1", and the arrow keys scroll the card
					instead of walking the menu. The portal-wide ui.a11y "useFocusTrapInDialogs"
					switch is on for dev clones and off for client portals, so it is passed here
					explicitly - with the very value Menu itself uses when that switch is on.
						Only for keyboard activation: passing an object bypasses the whole of
					Popup.shouldUseFocusTrapByDefault(), including its exception for text inputs,
					so on the mouse path the decision is left to the popup itself.
				*/
				...(isKeyboardActivation() ? {
					focusTrap: {
						initialFocus: 'container'
					}
				} : {}),
				events: {
					onPopupShow: () => {
						this._isTypesMenuOpened = true;
						this.setSelectorExpanded(this._domNodes.addressTypeSelector, true);
					},
					onPopupClose: () => {
						this._isTypesMenuOpened = false;
						this.setSelectorExpanded(this._domNodes.addressTypeSelector, false);
					}
				}
			});
			if (scroller) {
				scroller.scrollTop = scrollTop;
			}
			let createdMenu = main_popup.MenuManager.getMenuById(this.typesMenuId);
			if (createdMenu && main_core.Type.isDomNode(this._domNodes.addressTypeSelector) && this._domNodes.addressTypeSelector.offsetWidth > 200) {
				createdMenu.getPopupWindow().setWidth(this._domNodes.addressTypeSelector.offsetWidth);
			}
		}
		closeTypesMenu() {
			let menu = main_popup.MenuManager.getMenuById(this.typesMenuId);
			if (menu) {
				menu.close();
			}
		}
		setTypeSelectorVisibility(visible) {
			this._isTypeSelectorVisible = !!visible;
		}
		getEditHtml(addressString) {
			this._domNodes.typeName = main_core.Tag.render`<div class="ui-ctl-element"></div>`;
			this._domNodes.searchInput = main_core.Tag.render`
			<input type="text" class="ui-ctl-element ui-ctl-textbox" value="${addressString}" ${this._isAutocompleteEnabled ? '' : 'readonly'}>`;
			this._domNodes.icon = main_core.Tag.render`<span></span>`;
			this._domNodes.addressContainer = main_core.Tag.render`
		<div class="crm-address-search-control-block">
			<div class="ui-ctl ui-ctl-w100 ui-ctl-after-icon">
				${this._domNodes.icon}
				${this._domNodes.searchInput}
			</div>
		</div>`;
			this._domNodes.detailsContainer = main_core.Tag.render`
			<div class="location-fields-control-block"></div>`;
			if (this._canChangeType) {
				if (this._isTypeSelectorVisible) {
					this._domNodes.addressTypeSelector = main_core.Tag.render`
					<div class="ui-ctl ui-ctl-inline ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w25"
						role="button" tabindex="0" aria-haspopup="menu" aria-expanded="false"
						onclick="${this.onToggleTypesMenu.bind(this)}"
						onkeydown="${this.onActivationKeyDown.bind(this)}">
						<div class="ui-ctl-after ui-ctl-icon-angle"></div>
						${this._domNodes.typeName}
					</div>`;
					this._domNodes.addressTypeContainer = null;
					main_core.Dom.addClass(this._domNodes.addressContainer, ['ui-ctl-inline', 'ui-ctl-w75']);
					this._domNodes.addressContainer = main_core.Tag.render`
					<div class="ui-ctl-inline ui-ctl-w100">
						${this._domNodes.addressTypeSelector}
						${this._domNodes.addressContainer}
					</div>
				`;
				} else {
					// The type selector opens a popup menu on click, but it is built out of plain divs:
					// no tab stop, no role, no focusable child, so the field could be neither reached
					// nor opened from the keyboard - 2.1.1 Keyboard. It is declared a button the same
					// way the editor's own list field is (ui.entity-editor, EntityEditorList).
					this._domNodes.addressTypeSelector = main_core.Tag.render`
					<div class="ui-ctl ui-ctl-w100 ui-ctl-after-icon ui-ctl-dropdown"
						role="button" tabindex="0" aria-haspopup="menu" aria-expanded="false"
						onclick="${this.onToggleTypesMenu.bind(this)}"
						onkeydown="${this.onActivationKeyDown.bind(this)}">
						<div class="ui-ctl-after ui-ctl-icon-angle"></div>
						${this._domNodes.typeName}
					</div>`;
					this._domNodes.addressTypeContainer = main_core.Tag.render`
					<div class="location-fields-control-block crm-address-type-block">
						<div class="ui-entity-editor-content-block ui-entity-editor-field-text">
							<div class="ui-entity-editor-block-title">
								<label class="ui-entity-editor-block-title-text">${main_core.Loc.getMessage('CRM_ADDRESS_TYPE')}</label>
							</div>
							${this._domNodes.addressTypeSelector}
						</div>
					</div>`;
				}
				this.refreshTypeName();
			}
			this.refreshIcon();

			// The toggler is the only way into the detail fields, and once the collapsed block stops
			// handing out tab stops (address.css) it is the only way in from the keyboard too, so it
			// has to be reachable itself. It discloses inline content rather than a popup: that is
			// aria-expanded without aria-haspopup.
			this._domNodes.detailsToggler = main_core.Tag.render`<span class="ui-link ui-link-secondary ui-entity-editor-block-title-link"
				role="button" tabindex="0" aria-expanded="false"
				onclick="${this.onToggleDetailsVisibility.bind(this)}"
				onkeydown="${this.onActivationKeyDown.bind(this)}"></span>`;
			if (this._canChangeType) {
				// Same span-with-onclick as the toggler next to it. This one opens a dialog, hence
				// aria-haspopup; refreshCopyButtonVisibility() hides it with display: none when there
				// is no address to copy, which already keeps it out of the tab order.
				this._domNodes.copyButton = main_core.Tag.render`<span class="ui-link ui-link-secondary ui-entity-editor-block-title-link"
					role="button" tabindex="0" aria-haspopup="dialog" aria-expanded="false"
					onclick="${this.onCopyButtonClick.bind(this)}"
					onkeydown="${this.onActivationKeyDown.bind(this)}">${main_core.Loc.getMessage('CRM_ADDRESS_COPY1')}</span>`;
			}
			this.refreshCopyButtonVisibility();
			this.setDetailsVisibility(this._showDetails);
			let result = main_core.Tag.render`
			<div class="crm-address-control-item">
				<div class="crm-address-control-mode-switch">
					${this._domNodes.copyButton ? this._domNodes.copyButton : ''}
					${this._domNodes.detailsToggler}
				</div>
				${this._domNodes.addressContainer}
				${this._domNodes.detailsContainer}
			</div>`;
			if (this._canChangeType && main_core.Type.isDomNode(this._domNodes.addressTypeContainer)) {
				main_core.Dom.append(this._domNodes.addressTypeContainer, result);
			}
			return result;
		}
		getViewHtml(addressString) {
			this._domNodes.addressContainer = main_core.Tag.render`
			<div class="ui-entity-editor-content-block-text">
				<span class="ui-link ui-link-dark ui-link-dotted">${addressString}</span>
			</div>`;
			let addressType = '';
			if (this._showAddressTypeInViewMode) {
				let typeName = this._typesList.filter(item => item.value == this._type).map(item => item.name).join('');
				addressType = main_core.Tag.render`<span class="ui-link ui-link-secondary">${main_core.Text.encode(typeName)}:</span>`;
			}
			return main_core.Tag.render`
			<div class="crm-address-control-item">
				${addressType}
				${this._domNodes.addressContainer}
			</div>`;
		}
		refreshTypeName() {
			if (main_core.Type.isDomNode(this._domNodes.typeName)) {
				let typeName = this._typesList.filter(item => item.value === this._type).map(item => item.name).join('');
				this._domNodes.typeName.textContent = typeName;
				this._domNodes.typeName.title = typeName;
				this.refreshTypeSelectorLabel(typeName);
			}
		}
		refreshTypeSelectorLabel(typeName) {
			if (!main_core.Type.isDomNode(this._domNodes.addressTypeSelector)) {
				return;
			}

			// The chosen type is rendered inside the button and the caption above is a <label> with no
			// "for", so the name carries the caption too - spelled out inside the phrase rather than
			// substituted from CRM_ADDRESS_TYPE, which would reach the translator as "#TITLE#: #VALUE#"
			// with nothing to translate (rule 2 of the localization checklist).
			// Substitution goes through Loc, not String.replace(): the latter reads "$&", "$`" and "$'"
			// in a type name as backreferences.
			this._domNodes.addressTypeSelector.setAttribute('aria-label', main_core.Loc.getMessage('CRM_ADDRESS_TYPE_ARIA_LABEL', {
				'#VALUE#': typeName
			}));
		}
		refreshIcon() {
			let newIcon = this.getNewIcon();
			if (this._icon !== newIcon) {
				let node = this._domNodes.icon;
				if (main_core.Type.isDomNode(node)) {
					let newNode;
					if (newIcon === 'loading') {
						newNode = main_core.Tag.render`<span class="ui-ctl-after ui-ctl-icon-loader"></span>`;
					} else {
						if (newIcon === 'clear') {
							newNode = main_core.Tag.render`<button type="button" class="ui-ctl-after ui-ctl-icon-clear" onclick="${this.onDelete.bind(this)}"></button>`;
						} else if (newIcon === 'search') {
							newNode = main_core.Tag.render`<span class="ui-ctl-after ${this._isAutocompleteEnabled ? 'ui-ctl-icon-search' : ''}"></span>`;
						}
					}
					main_core.Dom.replace(node, newNode);
					this._domNodes.icon = newNode;
				}
				this._icon = newIcon;
			}
		}
		getNewIcon() {
			if (this._isLoading) {
				return 'loading';
			} else {
				return this.getAddress() ? 'clear' : 'search';
			}
		}
		refreshCopyButtonVisibility() {
			let node = this._domNodes.copyButton;
			if (main_core.Type.isDomNode(node)) {
				let isVisible = !!this.getAddress();
				main_core.Dom.style(node, 'display', isVisible ? '' : 'none');
			}
		}
		convertAddressToString(address) {
			if (!address) {
				return '';
			}
			return address.toString(this.getAddressFormat());
		}
		getAddress() {
			return main_core.Type.isNull(this._addressWidget) ? null : this._addressWidget.address;
		}
		getAddressFormat() {
			return main_core.Type.isNull(this._addressWidget) ? null : this._addressWidget.addressFormat;
		}
		clearValue() {
			if (!main_core.Type.isNull(this._addressWidget)) {
				this._addressWidget.resetView();
				this._addressWidget.address = null;
			}
			if (main_core.Type.isDomNode(this._domNodes.searchInput)) {
				this._domNodes.searchInput.value = '';
			}
			this._value = "";
			this._isLoading = false;
			this.refreshIcon();
			this.refreshCopyButtonVisibility();
		}
		setDetailsVisibility(visible) {
			this._showDetails = !!visible;
			if (this._showDetails) {
				main_core.Dom.addClass(this._domNodes.detailsContainer, 'visible');
				if (main_core.Type.isDomNode(this._domNodes.detailsToggler)) {
					this._domNodes.detailsToggler.textContent = main_core.Loc.getMessage('CRM_ADDRESS_MODE_SHORT_MSGVER_1');
					this.setSelectorExpanded(this._domNodes.detailsToggler, true);
				}
				if (this._canChangeType) {
					main_core.Dom.addClass(this._domNodes.addressTypeContainer, 'visible');
				}
			} else {
				main_core.Dom.removeClass(this._domNodes.detailsContainer, 'visible');
				if (main_core.Type.isDomNode(this._domNodes.detailsToggler)) {
					this._domNodes.detailsToggler.textContent = main_core.Loc.getMessage('CRM_ADDRESS_MODE_DETAILED_MSGVER_1');
					this.setSelectorExpanded(this._domNodes.detailsToggler, false);
				}
				if (this._canChangeType) {
					main_core.Dom.removeClass(this._domNodes.addressTypeContainer, 'visible');
				}
			}
		}
		showCopyDestinationPopup() {
			let popup = main_popup.PopupManager.create({
				id: this._id + '_copy_dst_popup',
				cacheable: false,
				autoHide: true,
				titleBar: main_core.Loc.getMessage('CRM_ADDRESS_COPY_TITLE'),
				content: this.getCopyDestinationLayout(),
				closeIcon: true,
				closeByEsc: true,
				buttons: [new BX.UI.Button({
					id: 'copy',
					text: main_core.Loc.getMessage('CRM_ADDRESS_COPY2'),
					color: BX.UI.Button.Color.PRIMARY,
					state: BX.UI.ButtonState.DISABLED,
					onclick: button => {
						button.getContext().close();
						this.emit('onCopyAddress', {
							sourceId: this.getId(),
							destinationTypes: this._selectedCopyDestinations
						});
					}
				})],
				events: {
					onPopupShow: () => this.setSelectorExpanded(this._domNodes.copyButton, true),
					onPopupClose: () => this.setSelectorExpanded(this._domNodes.copyButton, false)
				}
			});
			popup.show();
		}
		getCopyDestinationLayout() {
			let types = this.getTypeListByIds(this._allowedTypesIds).filter(item => item.value !== this._type);
			return main_core.Tag.render`
			<div>
				<div class="ui-title-7">${main_core.Loc.getMessage('CRM_ADDRESS_COPY_TO')}</div>
				<div>
					${types.map(item => main_core.Tag.render`
					<div class="ui-ctl ui-ctl-w100 ui-ctl-checkbox ui-ctl-xs">
					<label>
					<input onclick="${this.onChangeCopyDestination.bind(this)}" type="checkbox" value="${item.value}">
						<span class="ui-ctl-label-text">${main_core.Text.encode(item.name)}</span>
					</label>
					</div>
					`)}
				</div>
			</div>
		`;
		}
		destroy() {
			if (!main_core.Type.isNull(this._addressWidget)) {
				this._addressWidget.destroy();
			}
		}
		onActivationKeyDown(event) {
			activateOnKey(event);
		}
		setSelectorExpanded(node, isExpanded) {
			if (main_core.Type.isDomNode(node)) {
				node.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
			}
		}
		onToggleDetailsVisibility() {
			this.setDetailsVisibility(!this._showDetails);
		}
		focusFirstField() {
			// The address line, not the first tab stop of the item: the copy and "in detail" links are
			// rendered above it, and landing on those after adding an address would say nothing about
			// what has just appeared. Read-only when autocomplete is off - still focusable, and the
			// detail fields are the very next stops.
			if (main_core.Type.isDomNode(this._domNodes.searchInput)) {
				this._domNodes.searchInput.focus();
			}
		}
		onDelete() {
			this.clearValue();
			this.emit('onUpdateAddress', {
				id: this.getId(),
				value: this.getValue()
			});
		}
		onCopyButtonClick() {
			this.showCopyDestinationPopup();
		}
		onChangeCopyDestination(e) {
			let input = e.target;
			let value = input ? input.value : null;
			let isChecked = input ? input.checked : false;
			if (isChecked && this._selectedCopyDestinations.indexOf(value) < 0) {
				this._selectedCopyDestinations.push(value);
			}
			if (!isChecked && this._selectedCopyDestinations.indexOf(value) >= 0) {
				this._selectedCopyDestinations.splice(this._selectedCopyDestinations.indexOf(value), 1);
			}
			let popup = main_popup.PopupManager.getPopupById(this._id + '_copy_dst_popup');
			if (popup) {
				let button = popup.getButton('copy');
				if (button) {
					button.setDisabled(!this._selectedCopyDestinations.length);
				}
			}
		}
		onToggleTypesMenu(event) {
			if (this._isTypesMenuOpened) {
				this.closeTypesMenu();
			} else {
				this.openTypesMenu(event.target);
			}
		}
		onChangeType(e, item) {
			this.closeTypesMenu();
			if (this._type !== item.value) {
				let prevType = this._type;
				this._type = item.value;
				this.refreshTypeName();
				this.emit('onUpdateAddressType', {
					id: this.getId(),
					type: this.getType(),
					prevType
				});
			}
		}
		onAddressWidgetChangedState(event) {
			let data = event.getData(),
				state = data.state;
			let wasLoading = this._isLoading;
			this.computeIsLoading();
			if (wasLoading !== this._isLoading) {
				this.refreshIcon();
				this.refreshCopyButtonVisibility();
			}
			if (state === BX.Location.Widget.State.DATA_LOADING) {
				this.emit('onStartLoadAddress', {
					id: this.getId()
				});
			} else if (state === BX.Location.Widget.State.DATA_LOADED) {
				this.emit('onAddressLoaded', {
					id: this.getId()
				});
			} else if (state === BX.Location.Widget.State.DATA_INPUTTING) {
				this.emit('onAddressDataInputting', {
					id: this.getId()
				});
			}
		}
		onAddressChanged(event) {
			this._isLoading = false;
			let data = event.getData();
			this._value = main_core.Type.isObject(data.address) ? data.address.toJson() : '';
			this.refreshIcon();
			this.refreshCopyButtonVisibility();
			this.emit('onUpdateAddress', {
				id: this.getId(),
				value: this.getValue()
			});
		}
		onFeatureEvent(event) {
			let data = event.getData();
			if (data.feature instanceof BX.Location.Widget.AutocompleteFeature) {
				this._isDropdownLoading = data.eventCode === BX.Location.Widget.AutocompleteFeature.searchStartedEvent;
				let wasLoading = this._isLoading;
				this.computeIsLoading();
				if (wasLoading !== this._isLoading) {
					this.refreshIcon();
					this.refreshCopyButtonVisibility();
				}
			}
		}
		onError(event) {
			const data = event.getData();
			const errors = data.errors;
			let errorMessage = errors.map(error => error.message + (error.code.length ? `${error.code}` : '')).join(', ');
			this._isLoading = false;
			this.refreshIcon();
			this.refreshCopyButtonVisibility();
			this.emit('onError', {
				id: this.getId(),
				error: errorMessage
			});
		}
		computeIsLoading() {
			this._isLoading = this._addressWidget.state === BX.Location.Widget.State.DATA_LOADING || this._isDropdownLoading;
		}
		resetView() {
			this._addressWidget.resetView();
		}
	}

	exports.EntityEditorBaseAddressField = EntityEditorBaseAddressField;

})(this.BX.Crm = this.BX.Crm || {}, BX, BX.Event, BX.Main);
//# sourceMappingURL=address.bundle.js.map
