/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, crm_entitySelector) {
	'use strict';

	/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */

	const DEFAULT_COUNTRY_CODE = 'XX';

	/**
	 * @memberOf BX.Crm
	 */
	class PhoneNumberInputFieldConfigurator extends BX.UI.EntityEditorFieldConfigurator {
		#countrySelector = null;
		destroy() {
			if (this.#countrySelector) {
				this.#countrySelector.destroy();
			}
		}

		// region overridden methods from BX.UI.EntityEditorFieldConfigurator ----------------------------------------------
		/**
		 * @override
		 */
		layoutInternal() {
			main_core.Dom.append(this.getInputContainer(), this._wrapper);
			if (this._typeId === 'list') {
				this.layoutInnerConfigurator(this._field.getInnerConfig(), this._field.getItems());
			}
			main_core.Dom.append(this.getOptionContainer(), this._wrapper);
			if (this._typeId === 'multifield' || this._typeId === 'client_light') {
				main_core.Dom.append(this.getCountrySelectContent(), this._wrapper); // NEW: country selector added
			}
			main_core.Dom.append(main_core.Tag.render`<hr class="ui-entity-editor-line">`, this._wrapper);
			main_core.Dom.append(this.getButtonContainer(), this._wrapper);
		}
		prepareSaveParams(...args) {
			const params = super.prepareSaveParams(this, args);

			// add selected value
			if (this.#countrySelector) {
				const items = this.#countrySelector.getDialog().getSelectedItems();
				if (items.length <= 1) {
					params.defaultCountry = main_core.Type.isArrayFilled(items) ? items[0].id : DEFAULT_COUNTRY_CODE;
					this.#getSchemeElementOptions().defaultCountry = params.defaultCountry;
				}
			}
			return params;
		}
		// endregion -------------------------------------------------------------------------------------------------------

		getCountrySelectContent() {
			const wrapper = main_core.Tag.render`
			<div class="ui-entity-editor-content-block">
				<div class="ui-entity-editor-block-title">
					<span class="ui-entity-editor-block-title-text">
						${main_core.Loc.getMessage('CRM_PHONE_NUMBER_INPUT_FIELD_CONFIGURATOR_TITLE')}
					</span>
				</div>
			</div>
		`;
			main_core.Dom.append(this.#getSelectContainer(), wrapper);
			return wrapper;
		}
		#getSelectContainer() {
			const selectContainer = main_core.Tag.render`
			<div class="ui-entity-editor-content-block crm-entity-country-tag-selector"></div>
		`;
			this.#getCountrySelector().renderTo(selectContainer);
			return selectContainer;
		}
		#getCountrySelector() {
			if (!this.#countrySelector) {
				this.#countrySelector = new crm_entitySelector.TagSelector({
					textBoxWidth: '100%',
					tagMaxWidth: 270,
					placeholder: main_core.Loc.getMessage('CRM_PHONE_NUMBER_INPUT_FIELD_CONFIGURATOR_PLACEHOLDER'),
					multiple: false,
					dialogOptions: {
						width: 425,
						multiple: false,
						showAvatars: true,
						dropdownMode: true,
						preselectedItems: [['country', this.#getDefaultCountry()]],
						entities: [{
							id: 'country'
						}],
						events: {
							onFirstShow: event => {
								const popupContainer = event.getTarget().getPopup().getContentContainer();
								if (main_core.Type.isDomNode(popupContainer)) {
									main_core.Dom.addClass(popupContainer, 'crm-entity-country-tag-selector-popup');
								}
							}
						}
					}
				});
			}
			return this.#countrySelector;
		}
		#getDefaultCountry() {
			const {
				defaultCountry
			} = this.#getSchemeElementOptions();
			if (main_core.Type.isStringFilled(defaultCountry)) {
				return defaultCountry;
			}
			return DEFAULT_COUNTRY_CODE;
		}
		#getSchemeElementOptions() {
			return this?._field?.getSchemeElement()?._options;
		}
		static create(id, settings) {
			const self = new this();
			self.initialize(id, settings);
			return self;
		}
	}

	const DEFAULT_ADDRESS_TYPE_ID = '11'; // \Bitrix\Crm\EntityAddressType::Delivery

	class RequisiteAddressFieldConfigurator extends BX.UI.EntityEditorFieldConfigurator {
		#addressTypeSelect = null;
		#allAddressTypes = null;
		#suitableAddressTypes = null;
		static create(id, settings) {
			const self = new this();
			self.initialize(id, settings);
			return self;
		}
		layoutInternal() {
			super.layoutInternal();

			// eslint-disable-next-line no-underscore-dangle
			const wrapper = this._wrapper;
			const hr = wrapper.querySelector('hr');
			main_core.Dom.insertBefore(this.#getDefaultAddressTypeSetterContainer(), hr);
		}
		prepareSaveParams(...args) {
			const params = super.prepareSaveParams(this, args);
			const newDefaultAddressTypeId = this.#getAddressTypeSelectValue();
			if (!this.#isValidAddressType(newDefaultAddressTypeId)) {
				return params;
			}
			this.#setDefaultAddressTypeToSchemeOptions(newDefaultAddressTypeId);
			params.defaultAddressType = newDefaultAddressTypeId;
			return params;
		}
		#setDefaultAddressTypeToSchemeOptions(defaultAddressTypeId) {
			const schemeOptions = this.#getSchemeOptions();
			if (schemeOptions) {
				schemeOptions.defaultAddressType = defaultAddressTypeId;
			}
		}
		#getDefaultAddressTypeSetterContainer() {
			const title = main_core.Loc.getMessage('CRM_REQUISITE_DEFAULT_ADDRESS_TYPE_TITLE');
			const wrapper = main_core.Tag.render`
			<div class="ui-entity-editor-content-block">
				<div class="ui-entity-editor-block-title">
					<span class="ui-entity-editor-block-title-text">
						${main_core.Text.encode(title)}
					</span>
				</div>
			</div>
		`;
			const selectContainer = main_core.Tag.render`<div class="ui-entity-editor-content-block crm-default-requisite-address-type"></div>`;
			main_core.Dom.append(this.#getAddressTypeSelect(), selectContainer);
			main_core.Dom.append(selectContainer, wrapper);
			return wrapper;
		}
		#getAddressTypeSelect() {
			if (!this.#addressTypeSelect) {
				this.#addressTypeSelect = main_core.Tag.render`<select class="main-ui-control main-enum-dialog-input" name="display"></select>`;
				this.#getPreparedAddressTypesForOptions().forEach(addressType => {
					const option = main_core.Tag.render`
					<option value="${main_core.Text.encode(addressType.value)}">
						${main_core.Text.encode(addressType.label)}
					</option>
				`;
					main_core.Dom.append(option, this.#addressTypeSelect);
				});
				this.#addressTypeSelect.value = this.#getDefaultAddressType();
			}
			return this.#addressTypeSelect;
		}
		#getDefaultAddressType() {
			const {
				defaultAddressType: optionAddressTypeId
			} = this.#getSchemeOptions() ?? {};
			if (this.#isValidAddressType(optionAddressTypeId)) {
				return optionAddressTypeId;
			}
			const {
				defaultAddressType: schemeDefaultAddressTypeId
			} = this.#getAddressZoneConfig() ?? {};
			if (this.#isValidAddressType(schemeDefaultAddressTypeId)) {
				return schemeDefaultAddressTypeId;
			}
			return DEFAULT_ADDRESS_TYPE_ID;
		}
		#getPreparedAddressTypesForOptions() {
			const options = [];
			const suitableAddressTypes = this.#getSuitableAddressTypes();
			suitableAddressTypes.forEach(addressType => {
				options.push({
					value: addressType.ID,
					label: addressType.DESCRIPTION
				});
			});
			return options;
		}
		#getAddressTypeSelectValue() {
			return this.#getAddressTypeSelect().value;
		}
		#isValidAddressType(addressTypeId) {
			return main_core.Type.isStringFilled(addressTypeId) && this.#getSuitableAddressTypes().has(addressTypeId);
		}
		#getAllAddressTypes() {
			if (!this.#allAddressTypes) {
				this.#allAddressTypes = new Map();
				const {
					types: allAddressTypes
				} = this.#getSchemeData() ?? {};
				if (allAddressTypes) {
					Object.values(allAddressTypes).forEach(addressType => {
						this.#allAddressTypes.set(addressType.ID, addressType);
					});
				}
			}
			return this.#allAddressTypes;
		}
		#getSuitableAddressTypes() {
			if (!this.#suitableAddressTypes) {
				this.#suitableAddressTypes = new Map();
				const {
					currentZoneAddressTypes
				} = this.#getAddressZoneConfig() ?? {};
				if (currentZoneAddressTypes) {
					currentZoneAddressTypes.forEach(addressTypeId => {
						const addressType = this.#getAllAddressTypes().get(addressTypeId);
						if (addressType) {
							this.#suitableAddressTypes.set(addressType.ID, addressType);
						}
					});
				}
			}
			return this.#suitableAddressTypes;
		}
		#getSchemeData() {
			return this.#getSchemeElement()?.getData();
		}
		#getSchemeOptions() {
			return this.#getSchemeElement()?.getOptions();
		}
		#getSchemeElement() {
			return this.getField()?.getSchemeElement();
		}
		#getAddressZoneConfig() {
			return this.#getSchemeData()?.addressZoneConfig;
		}
	}

	/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */


	/**
	 * @memberOf BX.Crm
	 */
	class EntityConfigurationManager extends BX.UI.EntityConfigurationManager {
		static PHONE_NUMBER_FIELDS = ['PHONE', 'CLIENT', 'COMPANY', 'CONTACT', 'MYCOMPANY_ID'];
		static REQUISITE_ADDRESS_FIELDS = ['ADDRESS'];

		/**
		 * @param {Object} params
		 * @param {Object} parent
		 *
		 * @returns {BX.UI.EntityEditorFieldConfigurator}
		 *
		 * @override
		 */
		getSimpleFieldConfigurator(params, parent) {
			if (!main_core.Type.isPlainObject(params)) {
				throw new TypeError('EntityConfigurationManager: The "params" argument must be object.');
			}
			let typeId = '';
			const {
				field: child,
				mandatoryConfigurator
			} = params;
			if (child) {
				typeId = child.getType();
				child.setVisible(false);
			} else {
				typeId = BX.prop.get(params, 'typeId', BX.UI.EntityUserFieldType.string);
			}
			const fieldConfiguratorOptions = {
				editor: this._editor,
				schemeElement: null,
				model: parent._model,
				mode: BX.UI.EntityEditorMode.edit,
				parent,
				typeId,
				field: child,
				mandatoryConfigurator
			};

			// override for 'PHONE', 'CLIENT', 'COMPANY', 'CONTACT' fields:
			// add additional option to set up default country phone code
			if (EntityConfigurationManager.PHONE_NUMBER_FIELDS.includes(child.getId())) {
				this._fieldConfigurator = PhoneNumberInputFieldConfigurator.create('', fieldConfiguratorOptions);
			} else if (EntityConfigurationManager.REQUISITE_ADDRESS_FIELDS.includes(child.getId()) && typeId === 'requisite_address') {
				this._fieldConfigurator = RequisiteAddressFieldConfigurator.create('', fieldConfiguratorOptions);
			} else {
				this._fieldConfigurator = BX.UI.EntityEditorFieldConfigurator.create('', fieldConfiguratorOptions);
			}
			return this._fieldConfigurator;
		}

		/**
		 * @param {Object} params
		 * @param {Object} parent
		 *
		 * @returns { BX.UI.EntityEditorUserFieldConfigurator}
		 *
		 * @override
		 */
		getUserFieldConfigurator(params, parent) {
			if (!main_core.Type.isPlainObject(params)) {
				throw 'EntityConfigurationManager: The "params" argument must be object.';
			}
			let typeId = '';
			let field = BX.prop.get(params, 'field', null);
			if (field) {
				if (!(field instanceof BX.UI.EntityEditorUserField)) {
					throw 'EntityConfigurationManager: The "field" param must be EntityEditorUserField.';
				}
				typeId = field.getFieldType();
				field.setVisible(false);
			} else {
				typeId = BX.prop.get(params, 'typeId', BX.UI.EntityUserFieldType.string);
			}
			let tooltipConfigurator = null;
			if (params?.enableTooltipConfigurator) {
				tooltipConfigurator = new BX.UI.EntityEditorUfConfigurators.TooltipConfigurator(this.id, this._editor, field);
			}
			if (typeId === 'resourcebooking') {
				let options = {
					parent,
					typeId,
					field,
					tooltipConfigurator,
					editor: this._editor,
					schemeElement: null,
					model: parent.getModel(),
					mode: BX.UI.EntityEditorMode.edit,
					showAlways: true,
					enableMandatoryControl: BX.prop.getBoolean(params, 'enableMandatoryControl', true),
					mandatoryConfigurator: params.mandatoryConfigurator
				};
				if (BX.Calendar && BX.type.isFunction(BX.Calendar.ResourcebookingUserfield)) {
					return BX.Calendar.ResourcebookingUserfield.getCrmFieldConfigurator('', options);
				} else if (BX.Calendar && BX.Calendar.UserField && BX.Calendar.UserField.EntityEditorUserFieldConfigurator) {
					return BX.Calendar.UserField.EntityEditorUserFieldConfigurator.create('', options);
				}
			} else {
				return BX.Crm.EntityEditorUserFieldConfigurator.create('', {
					parent,
					typeId,
					field,
					tooltipConfigurator,
					editor: this._editor,
					schemeElement: null,
					model: parent.getModel(),
					mode: BX.UI.EntityEditorMode.edit,
					mandatoryConfigurator: params.mandatoryConfigurator,
					visibilityConfigurator: params.visibilityConfigurator,
					showAlways: true
				});
			}
		}
		getTypeInfos() {
			let typeInfos = super.getTypeInfos();
			let ufAddRestriction = this._editor.getRestriction('userFieldAdd');
			let ufResourceBookingRestriction = this._editor.getRestriction('userFieldResourceBooking');
			if (ufAddRestriction && !ufAddRestriction['isPermitted'] && ufAddRestriction['restrictionCallback']) {
				for (let i = 0, length = typeInfos.length; i < length; i++) {
					typeInfos[i].callback = function () {
						eval(ufAddRestriction['restrictionCallback']);
					};
				}
			} else if (ufResourceBookingRestriction && !ufResourceBookingRestriction['isPermitted'] && ufResourceBookingRestriction['restrictionCallback']) {
				for (let j = 0; j < typeInfos.length; j++) {
					if (typeInfos[j].name === 'resourcebooking') {
						typeInfos[j].callback = function () {
							eval(ufResourceBookingRestriction['restrictionCallback']);
						};
					}
				}
			}
			return typeInfos;
		}
		static create(id, settings) {
			const self = new this();
			self.initialize(id, settings);
			return self;
		}
	}

	exports.EntityConfigurationManager = EntityConfigurationManager;

})(this.BX.Crm = this.BX.Crm || {}, BX, BX.Crm.EntitySelectorEx);
//# sourceMappingURL=field-configurator.bundle.js.map
