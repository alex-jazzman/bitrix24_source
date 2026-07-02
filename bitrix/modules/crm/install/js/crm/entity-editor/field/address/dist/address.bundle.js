/* eslint-disable */
this.BX = this.BX || {};
(function (exports, crm_entityEditor_field_address_base, main_core, main_core_events) {
	'use strict';

	class EntityEditorAddressField extends BX.Crm.EntityEditorField {
		constructor() {
			super();
			this._field = null;
			this._isMultiple = null;
			this._autocompleteEnabled = false;
			this._restrictionsCallback = null;
		}
		initialize(id, settings) {
			super.initialize(id, settings);
			let params = this._schemeElement.getData();
			this._isMultiple = BX.prop.getBoolean(params, "multiple", false);
			this._autocompleteEnabled = BX.prop.getBoolean(params, "autocompleteEnabled", false);
			if (!this._autocompleteEnabled) {
				this._restrictionsCallback = BX.prop.getString(params, "featureRestrictionCallback", '');
			}
			settings = main_core.Type.isPlainObject(settings) ? settings : {};
			settings.crmCompatibilityMode = true;
			settings.enableAutocomplete = this._autocompleteEnabled;
			settings.hideDefaultAddressType = this._isMultiple; // hide for multiple addresses only
			settings.showAddressTypeInViewMode = this._isMultiple; //for multiple addresses only
			settings.addressZoneConfig = BX.prop.getObject(params, "addressZoneConfig", {});
			settings.countryId = 0;
			settings.defaultAddressTypeByCategory = BX.prop.getInteger(params, "defaultAddressTypeByCategory", 0);
			this._field = crm_entityEditor_field_address_base.EntityEditorBaseAddressField.create(id, settings);
			this._field.setMultiple(this._isMultiple);
			if (this._isMultiple) {
				this._field.setTypesList(BX.prop.getObject(params, "types", {}));
			}
			main_core_events.EventEmitter.subscribe(this._field, 'onUpdate', this.onAddressListUpdate.bind(this));
			main_core_events.EventEmitter.subscribe(this._field, 'onStartLoadAddress', this.onStartLoadAddress.bind(this));
			main_core_events.EventEmitter.subscribe(this._field, 'onAddressLoaded', this.onAddressLoaded.bind(this));
			main_core_events.EventEmitter.subscribe(this._field, 'onAddressDataInputting', this.onAddressDataInputting.bind(this));
			main_core_events.EventEmitter.subscribe(this._field, 'onError', this.onError.bind(this));
			this.initializeFromModel();
		}
		setupFromModel(model, options) {
			super.setupFromModel(model, options);
			this.initializeFromModel();
		}
		initializeFromModel() {
			this.setAddressList(this.getValue(this._isMultiple ? {} : ""));
		}
		setAddressList(addressList) {
			if (this._field.setValue(addressList)) {
				this.refreshLayout();
			}
		}
		getCountryId() {
			return this._field.getCountryId();
		}
		setCountryId(countryId) {
			this._field.setCountryId(countryId);
		}
		layout(options) {
			if (this._hasLayout) {
				return;
			}
			this.ensureWrapperCreated({
				classNames: ["crm-entity-widget-content-block-field-address"]
			});
			this.adjustWrapper();
			if (!this.isNeedToDisplay()) {
				this.registerLayout(options);
				this._hasLayout = true;
				return;
			}
			if (this.isDragEnabled()) {
				main_core.Dom.append(this.createDragButton(), this._wrapper);
			}
			main_core.Dom.append(this.createTitleNode(this.getTitle()), this._wrapper);
			if (!this.hasValue() && this._mode === BX.UI.EntityEditorMode.view) {
				main_core.Dom.append(main_core.Tag.render`
					<div class="ui-entity-editor-content-block" onclick="${this.onViewModeClick.bind(this)}">
						${BX.UI.EntityEditorField.messages.isEmpty}
					</div>`, this._wrapper);
			} else {
				let fieldContainer = this._field.layout(this._mode === BX.UI.EntityEditorMode.edit);
				fieldContainer.classList.add('ui-entity-editor-content-block');
				if (this._mode === BX.UI.EntityEditorMode.view) {
					main_core.Event.bind(fieldContainer, 'click', this.onViewModeClick.bind(this));
				}
				main_core.Dom.append(fieldContainer, this._wrapper);
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
		reset() {
			super.reset();
			this.initializeFromModel();
		}
		doClearLayout(options) {
			if (BX.prop.getBoolean(options, "release", false)) {
				this._field.release();
			} else {
				this._field.resetView();
			}
		}
		hasContentToDisplay() {
			return this.hasValue();
		}
		hasValue() {
			if (!main_core.Type.isObject(this._field)) {
				return false;
			}
			return this._isMultiple ? !!this._field.getValue().filter(item => main_core.Type.isStringFilled(item.value)).length : !!this._field.getValue();
		}
		createTitleMarker() {
			if (this._mode === BX.Crm.EntityEditorMode.view) {
				return null;
			}
			if (this._restrictionsCallback && this._restrictionsCallback.length) {
				let lockIcon = main_core.Tag.render` <span class="tariff-lock"></span>`;
				lockIcon.setAttribute('onclick', this._restrictionsCallback);
				return lockIcon;
			}
			return super.createTitleMarker();
		}
		rollback() {
			this.initializeFromModel();
		}
		save() {
			if (this.isVirtual()) {
				return;
			}
			if (!main_core.Type.isDomNode(this._wrapper)) {
				return;
			}
			if (this._isMultiple) {
				let fieldNamePrefix = this.getName();
				for (let address of this._field.getValue()) {
					let type = address.type;
					let value = address.value;
					let name = `${fieldNamePrefix}[${type}]`;
					let node = main_core.Tag.render`<input type="hidden">`;
					node.name = name;
					node.value = value;
					main_core.Dom.append(node, this._wrapper);
				}
			} else {
				let address = this._field.getValue();
				let node = main_core.Tag.render`<input type="hidden">`;
				node.name = this.getName();
				node.value = address ? address : "";
				main_core.Dom.append(node, this._wrapper);
			}
		}
		onViewModeClick() {
			if (!this.getEditor().isReadOnly()) {
				this.switchToSingleEditMode();
			}
		}
		onAddressListUpdate(event) {
			this.markAsChanged();
		}
		onStartLoadAddress() {
			let toolPanel = this.getEditor()._toolPanel;
			if (toolPanel) {
				toolPanel.setLocked(true);
			}
		}
		onAddressLoaded() {
			let toolPanel = this.getEditor()._toolPanel;
			if (toolPanel) {
				toolPanel.setLocked(false);
			}
		}
		onAddressDataInputting() {
			this.markAsChanged();
		}
		onError(event) {
			const data = event.getData();
			this.showError(data.error);
			const toolPanel = this.getEditor()._toolPanel;
			if (toolPanel) {
				toolPanel.setLocked(false);
			}
		}
		static create(id, settings) {
			let self = new this(id, settings);
			self.initialize(id, settings);
			return self;
		}
	}

	exports.EntityEditorAddressField = EntityEditorAddressField;

})(this.BX.Crm = this.BX.Crm || {}, BX.Crm, BX, BX.Event);
//# sourceMappingURL=address.bundle.js.map
