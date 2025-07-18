/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.UI = this.BX.Landing.UI || {};
(function (exports,ui_designTokens,landing_loc,ui_draganddrop_draggable,landing_ui_panel_fieldspanel,landing_ui_component_listitem,landing_ui_component_actionpanel,landing_ui_field_textfield,main_core_events,landing_ui_form_formsettingsform,crm_form_fileLimit,crm_form_client,landing_ui_field_listsettingsfield,landing_ui_panel_separatorpanel,landing_pageobject,main_loader,landing_ui_field_productfield,calendar_resourcebookinguserfield,socnetlogdest,ui_hint,landing_ui_component_iconbutton,main_core,landing_ui_field_basefield) {
	'use strict';

	var _templateObject, _templateObject2;
	var RequisiteSettingsField = /*#__PURE__*/function (_BaseField) {
	  babelHelpers.inherits(RequisiteSettingsField, _BaseField);
	  function RequisiteSettingsField(options) {
	    var _this;
	    babelHelpers.classCallCheck(this, RequisiteSettingsField);
	    _this = babelHelpers.possibleConstructorReturn(this, babelHelpers.getPrototypeOf(RequisiteSettingsField).call(this, options));
	    _this.setEventNamespace('BX.Landing.UI.Field.FieldsListField.RequisiteSettingsField');
	    _this.subscribeFromOptions(options.events);
	    main_core.Dom.replace(_this.input, _this.getSettingsLayout());
	    return _this;
	  }
	  babelHelpers.createClass(RequisiteSettingsField, [{
	    key: "getOptions",
	    value: function getOptions() {
	      return this.options;
	    }
	  }, {
	    key: "getSettingsLayout",
	    value: function getSettingsLayout() {
	      var _this2 = this;
	      return this.cache.remember('settingsLayout', function () {
	        return main_core.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<div class=\"landing-ui-field-requisite-settings\">\n\t\t\t\t\t", "\n\t\t\t\t</div>\n\t\t\t"])), babelHelpers.toConsumableArray(_this2.getCheckboxTree().keys()).map(function (checkbox) {
	          return checkbox.layout;
	        }));
	      });
	    }
	  }, {
	    key: "getCheckboxTree",
	    value: function getCheckboxTree() {
	      var _this3 = this;
	      return this.cache.remember('checkboxTree', function () {
	        var requisites = _this3.getOptions().value;
	        return requisites.reduce(function (map, requisite) {
	          var fieldsCheckbox = new BX.Landing.UI.Field.Checkbox({
	            selector: "".concat(requisite.id, "_fields"),
	            compact: true,
	            items: requisite.fields.map(function (field) {
	              return {
	                name: field.label,
	                value: field.name,
	                checked: field.disabled !== false
	              };
	            }),
	            onChange: function onChange() {
	              _this3.emit('onChange');
	            }
	          });
	          var onFieldSettingsLinkClick = function onFieldSettingsLinkClick(event) {
	            event.preventDefault();
	            event.stopPropagation();
	            if (!categoryCheckbox.layout.contains(fieldsCheckbox.layout)) {
	              main_core.Dom.append(fieldsCheckbox.layout, categoryCheckbox.layout);
	            } else {
	              main_core.Dom.remove(fieldsCheckbox.layout);
	            }
	          };
	          var fieldSettingsLink = main_core.Tag.render(_templateObject2 || (_templateObject2 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t\t<span \n\t\t\t\t\t\tclass=\"ui-link ui-link-dashed\"\n\t\t\t\t\t\tonclick=\"", "\"\n\t\t\t\t\t>\n\t\t\t\t\t\t", "\n\t\t\t\t\t</span>\n\t\t\t\t"])), onFieldSettingsLinkClick, main_core.Loc.getMessage('LANDING_FIELDS_ITEM_REQUISITE_SETTINGS_FIELDS_LABEL'));
	          var categoryCheckbox = new BX.Landing.UI.Field.Checkbox({
	            selector: requisite.id,
	            compact: true,
	            items: [{
	              name: requisite.label,
	              value: requisite.id,
	              checked: requisite.disabled !== false
	            }],
	            onChange: function onChange() {
	              _this3.emit('onChange');
	              var labelLayout = categoryCheckbox.layout.querySelector('.landing-ui-field-checkbox-item-label');
	              if (categoryCheckbox.getValue().length > 0) {
	                main_core.Dom.append(fieldSettingsLink, labelLayout);
	              } else {
	                main_core.Dom.remove(fieldSettingsLink);
	                main_core.Dom.remove(fieldsCheckbox.layout);
	              }
	            }
	          });
	          if (requisite.disabled !== false) {
	            var labelLayout = categoryCheckbox.layout.querySelector('.landing-ui-field-checkbox-item-label');
	            main_core.Dom.append(fieldSettingsLink, labelLayout);
	          }
	          map.set(categoryCheckbox, fieldsCheckbox);
	          return map;
	        }, new Map());
	      });
	    }
	  }, {
	    key: "getValue",
	    value: function getValue() {
	      var _this4 = this;
	      var entries = babelHelpers.toConsumableArray(this.getCheckboxTree().entries());
	      return entries.reduce(function (acc, _ref, index) {
	        var _ref2 = babelHelpers.slicedToArray(_ref, 2),
	          categoryCheckbox = _ref2[0],
	          fieldsCheckbox = _ref2[1];
	        var fieldsValue = fieldsCheckbox.getValue();
	        acc.push({
	          id: categoryCheckbox.selector,
	          disabled: categoryCheckbox.getValue().length === 0,
	          fields: _this4.getOptions().value[index].fields.map(function (field) {
	            return {
	              name: field.name,
	              disabled: !fieldsValue.includes(field.name)
	            };
	          })
	        });
	        return acc;
	      }, []);
	    }
	  }]);
	  return RequisiteSettingsField;
	}(landing_ui_field_basefield.BaseField);

	var _templateObject$1, _templateObject2$1, _templateObject3, _templateObject4, _templateObject5;
	function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
	function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { babelHelpers.defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
	function _classPrivateMethodInitSpec(obj, privateSet) { _checkPrivateRedeclaration(obj, privateSet); privateSet.add(obj); }
	function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }
	var _getFieldsPanelAllowedTypes = /*#__PURE__*/new WeakSet();
	var FieldsListField = /*#__PURE__*/function (_BaseField) {
	  babelHelpers.inherits(FieldsListField, _BaseField);
	  function FieldsListField(options) {
	    var _this;
	    babelHelpers.classCallCheck(this, FieldsListField);
	    _this = babelHelpers.possibleConstructorReturn(this, babelHelpers.getPrototypeOf(FieldsListField).call(this, options));
	    _classPrivateMethodInitSpec(babelHelpers.assertThisInitialized(_this), _getFieldsPanelAllowedTypes);
	    _this.setEventNamespace('BX.Landing.UI.Field.FieldsListField');
	    _this.setLayoutClass('landing-ui-field-fields-list');
	    _this.onSelectFieldButtonClick = _this.onSelectFieldButtonClick.bind(babelHelpers.assertThisInitialized(_this));
	    _this.onSelectProductsButtonClick = _this.onSelectProductsButtonClick.bind(babelHelpers.assertThisInitialized(_this));
	    _this.onSelectSeparatorButtonClick = _this.onSelectSeparatorButtonClick.bind(babelHelpers.assertThisInitialized(_this));
	    _this.onItemRemove = _this.onItemRemove.bind(babelHelpers.assertThisInitialized(_this));
	    _this.onItemEdit = _this.onItemEdit.bind(babelHelpers.assertThisInitialized(_this));
	    _this.onDragEnd = _this.onDragEnd.bind(babelHelpers.assertThisInitialized(_this));
	    _this.onFormChange = _this.onFormChange.bind(babelHelpers.assertThisInitialized(_this));
	    _this.items = [];
	    _this.options.items.forEach(function (itemOptions) {
	      _this.addItem(itemOptions);
	    });
	    _this.actionPanel = new landing_ui_component_actionpanel.ActionPanel({
	      renderTo: _this.layout,
	      left: [{
	        id: 'selectField',
	        text: landing_loc.Loc.getMessage('LANDING_FIELDS_ADD_FIELD_BUTTON_TITLE'),
	        onClick: _this.onSelectFieldButtonClick
	      }],
	      right: [{
	        id: 'addProducts',
	        text: landing_loc.Loc.getMessage('LANDING_FIELDS_SELECT_PRODUCTS_BUTTON_TITLE'),
	        onClick: _this.onSelectProductsButtonClick
	      }, {
	        id: 'selectSeparator',
	        text: landing_loc.Loc.getMessage('LANDING_FIELDS_SELECT_SEPARATOR_BUTTON_TITLE'),
	        onClick: _this.onSelectSeparatorButtonClick
	      }]
	    });
	    _this.draggable = new ui_draganddrop_draggable.Draggable({
	      context: window.parent,
	      container: _this.getListContainer(),
	      draggable: '.landing-ui-component-list-item',
	      dragElement: '.landing-ui-button-icon-drag',
	      type: ui_draganddrop_draggable.Draggable.MOVE,
	      offset: {
	        y: -62
	      }
	    });
	    _this.draggable.subscribe('end', _this.onDragEnd);
	    return _this;
	  }
	  babelHelpers.createClass(FieldsListField, [{
	    key: "createInput",
	    value: function createInput() {
	      return this.getListContainer();
	    }
	  }, {
	    key: "getCrmFieldById",
	    value: function getCrmFieldById(id) {
	      return Object.values(this.options.crmFields).reduce(function (acc, category) {
	        return [].concat(babelHelpers.toConsumableArray(acc), babelHelpers.toConsumableArray(category.FIELDS));
	      }, []).find(function (currentField) {
	        return currentField.name === id;
	      });
	    }
	  }, {
	    key: "getCrmFieldCategoryById",
	    value: function getCrmFieldCategoryById(id) {
	      return this.options.crmFields[id];
	    }
	  }, {
	    key: "addItem",
	    value: function addItem(itemOptions) {
	      var _this2 = this;
	      return this.createItem(itemOptions).then(function (item) {
	        _this2.items.push(item);
	        main_core.Dom.append(item.getLayout(), _this2.getListContainer());
	      });
	    }
	  }, {
	    key: "prependItem",
	    value: function prependItem(itemOptions) {
	      var _this3 = this;
	      return this.createItem(itemOptions).then(function (item) {
	        _this3.items.unshift(item);
	        main_core.Dom.prepend(item.getLayout(), _this3.getListContainer());
	      });
	    }
	  }, {
	    key: "insertItemAfterIndex",
	    value: function insertItemAfterIndex(itemOptions, index) {
	      var _this4 = this;
	      return this.createItem(itemOptions).then(function (item) {
	        _this4.items.splice(index + 1, 0, item);
	        main_core.Dom.insertAfter(item.getLayout(), _this4.getListContainer().childNodes[index]);
	      });
	    }
	  }, {
	    key: "isFieldAvailable",
	    value: function isFieldAvailable(fieldId) {
	      if (main_core.Type.isStringFilled(fieldId)) {
	        if (fieldId.startsWith('product_')) {
	          return true;
	        }
	        return main_core.Type.isPlainObject(this.getCrmFieldById(fieldId));
	      }
	      return false;
	    }
	  }, {
	    key: "getFieldItemTitle",
	    value: function getFieldItemTitle(fieldId) {
	      if (this.isFieldAvailable(fieldId)) {
	        if (fieldId.startsWith('product_')) {
	          return landing_loc.Loc.getMessage('LANDING_FIELDS_LIST_FIELD_PRODUCTS_TITLE');
	        }
	        var crmField = this.getCrmFieldById(fieldId);
	        var crmFieldCategory = this.getCrmFieldCategoryById(crmField.entity_name);
	        return "".concat(crmField.caption, " \xB7 ").concat(crmFieldCategory.CAPTION);
	      }
	      return '';
	    }
	  }, {
	    key: "createCustomFieldController",
	    value: function createCustomFieldController(options) {
	      if (options.type === 'resourcebooking') {
	        var root = landing_pageobject.PageObject.getRootWindow();
	        var crmField = this.getCrmFieldById(options.id);
	        return root.BX.Calendar.ResourcebookingUserfield.initCrmFormFieldController({
	          field: _objectSpread(_objectSpread({}, options.sourceOptions), {}, {
	            dict: crmField,
	            node: main_core.Tag.render(_templateObject$1 || (_templateObject$1 = babelHelpers.taggedTemplateLiteral(["<div><div class=\"crm-webform-resourcebooking-wrap\"></div></div>"])))
	          })
	        });
	      }
	      if (options.type === 'booking' && BX.Booking) {
	        var BookingFieldController = BX.Booking.CrmForms.Settings;
	        return new BookingFieldController(options, this.data.formOptions);
	      }
	      return null;
	    }
	  }, {
	    key: "createItem",
	    value: function createItem(options) {
	      var listItemOptions = {
	        id: options.id,
	        type: options.type ? options.type : '',
	        content: options.content,
	        sourceOptions: _objectSpread({}, options),
	        draggable: true,
	        removable: true,
	        onRemove: this.onItemRemove,
	        onEdit: this.onItemEdit,
	        onFormChange: this.onFormChange,
	        form: this.createFieldSettingsForm(options)
	      };
	      if (!FieldsListField.isSeparator(options.id)) {
	        if (this.isFieldAvailable(options.id)) {
	          listItemOptions.title = this.getFieldItemTitle(options.id);
	          var crmField = this.getCrmFieldById(options.id);
	          listItemOptions.description = options.label || (crmField ? crmField.caption : '');
	          listItemOptions.editable = true;
	          listItemOptions.isSeparator = false;
	          listItemOptions.fieldController = this.createCustomFieldController(listItemOptions);
	          if (options.editing.supportAutocomplete) {
	            var autocompleteButton = new landing_ui_component_iconbutton.IconButton({
	              id: 'autocomplete',
	              type: function () {
	                if (options.autocomplete) {
	                  return landing_ui_component_iconbutton.IconButton.Types.user1Active;
	                }
	                return landing_ui_component_iconbutton.IconButton.Types.user1;
	              }(),
	              style: {
	                opacity: 1,
	                cursor: 'default'
	              },
	              title: function () {
	                if (options.autocomplete) {
	                  return landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_AUTOCOMPLETE_ENABLED');
	                }
	                return landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_AUTOCOMPLETE_DISABLED');
	              }()
	            });
	            listItemOptions.form.subscribe('onChange', function (event) {
	              if (event.getTarget().serialize().autocomplete) {
	                autocompleteButton.setType(landing_ui_component_iconbutton.IconButton.Types.user1Active);
	              } else {
	                autocompleteButton.setType(landing_ui_component_iconbutton.IconButton.Types.user1);
	              }
	            });
	            listItemOptions.actions = [autocompleteButton];
	          }
	          var _listItem = new landing_ui_component_listitem.ListItem(listItemOptions);
	          if (listItemOptions.fieldController) {
	            return new Promise(function (resolve) {
	              if (main_core.Type.isFunction(listItemOptions.fieldController.subscribe)) {
	                listItemOptions.fieldController.subscribe('afterInit', function (event) {
	                  options.booking.settings_data = event.getData().settings.data;
	                  resolve(_listItem);
	                });
	              } else {
	                resolve(_listItem);
	              }
	            });
	          }
	          return Promise.resolve(_listItem);
	        }
	        listItemOptions.editable = false;
	        listItemOptions.isSeparator = false;
	        listItemOptions.title = '';
	        listItemOptions.description = landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_FIELD_UNAVAILABLE');
	        listItemOptions.error = true;
	        var _listItem2 = new landing_ui_component_listitem.ListItem(listItemOptions);
	        return Promise.resolve(_listItem2);
	      }
	      listItemOptions.isSeparator = true;
	      listItemOptions.editable = !String(options.id).startsWith('hr_');
	      listItemOptions.title = FieldsListField.getSeparatorTitle(options.id);
	      if (main_core.Type.isString(options.label)) {
	        listItemOptions.description = options.label;
	      } else if (String(options.id).startsWith('hr_')) {
	        listItemOptions.description = FieldsListField.getSeparatorTitle(options.id);
	      } else {
	        var _crmField = this.getCrmFieldById(options.id);
	        if (main_core.Type.isPlainObject(_crmField) && main_core.Type.isString(_crmField.caption)) {
	          listItemOptions.description = _crmField.caption;
	        } else {
	          listItemOptions.description = '';
	        }
	      }
	      var listItem = new landing_ui_component_listitem.ListItem(listItemOptions);
	      return Promise.resolve(listItem);
	    }
	  }, {
	    key: "createCustomPriceDropdown",
	    value: function createCustomPriceDropdown(field) {
	      return new BX.Landing.UI.Field.Dropdown({
	        id: 'customPrice',
	        selector: 'customPrice',
	        items: [{
	          name: landing_loc.Loc.getMessage('LANDING_FIELDS_LIST_FIELD_PRODUCTS_ALLOW_CUSTOM_PRICE_NOT_SELECTED'),
	          value: null
	        }].concat(babelHelpers.toConsumableArray(field.items.map(function (item) {
	          return {
	            name: item.label,
	            value: item.value
	          };
	        }))),
	        content: field.items.reduce(function (acc, item) {
	          if (item.changeablePrice && acc === null) {
	            return item.value;
	          }
	          return acc;
	        }, null)
	      });
	    }
	  }, {
	    key: "createProductDefaultValueDropdown",
	    value: function createProductDefaultValueDropdown(field) {
	      var defaultValueField = new BX.Landing.UI.Field.Dropdown({
	        id: 'productDefaultValue',
	        selector: 'value',
	        title: landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_FORM_LIST_DEFAULT_VALUE_TITLE'),
	        content: field.value,
	        items: [{
	          label: landing_loc.Loc.getMessage('LANDING_FORM_DEFAULT_VALUE_NOT_SELECTED'),
	          value: null
	        }].concat(babelHelpers.toConsumableArray(field.items)).map(function (item) {
	          return {
	            name: item.label,
	            value: item.value
	          };
	        })
	      });
	      if (field.items.length > 0) {
	        defaultValueField.enable();
	      } else {
	        defaultValueField.disable();
	      }
	      return defaultValueField;
	    }
	  }, {
	    key: "createFileLimitationFields",
	    value: function createFileLimitationFields(field) {
	      var _this5 = this;
	      var limitationFields = [];
	      if (main_core.Type.isInteger(this.options.dictionary.defaultMaxFileFieldSizeMbValue)) {
	        var defaultSizeValue = this.options.dictionary.defaultMaxFileFieldSizeMbValue;
	        var lastSizeValue = field.maxSizeMb || defaultSizeValue;
	        if (lastSizeValue < 0) {
	          lastSizeValue = '';
	        }
	        var sizeField = new landing_ui_field_textfield.TextField({
	          id: 'maxSizeMb',
	          selector: 'maxSizeMb',
	          title: landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_FORM_MAX_FILE_SIZE'),
	          content: String(lastSizeValue),
	          textOnly: true,
	          help: landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_FORM_MAX_FILE_SIZE_HINT'),
	          onValueChange: function onValueChange(e) {
	            if (e.getValue() === '') {
	              return;
	            }
	            if (e.getValue() === lastSizeValue) return;
	            var value = Number(e.getValue());
	            if (Number.isNaN(value)) {
	              e.setValue(lastSizeValue);
	              return;
	            }
	            if (String(value) !== e.getValue()) {
	              e.setValue(String(value));
	              return;
	            }
	            field.maxSizeMb = value;
	            lastSizeValue = e.getValue();
	          }
	        });
	        var titleText = '';
	        var configureNodeText = landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_FORM_DAILY_FILE_LIMIT_CONFIGURE_FULL');
	        if (main_core.Type.isInteger(this.options.dictionary.dailyFileLimitSizeMbValue)) {
	          titleText = landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_FORM_DAILY_FILE_LIMIT_TITLE').replace('%size%', this.options.dictionary.dailyFileLimitSizeMbValue);
	          configureNodeText = landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_FORM_DAILY_FILE_LIMIT_CONFIGURE');
	        }
	        var dailyLimitTitleNode = main_core.Tag.render(_templateObject2$1 || (_templateObject2$1 = babelHelpers.taggedTemplateLiteral(["<span style=\"margin-right: 5px\">", "</span>\n\t\t\t"])), titleText);
	        var dailyLimitConfigureNode = main_core.Tag.render(_templateObject3 || (_templateObject3 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t\t<div class=\"landing-ui-field-fields-list-item-button\">", "</div>\n\t\t\t"])), configureNodeText);
	        var dailyLimitNode = main_core.Tag.render(_templateObject4 || (_templateObject4 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t\t<div class=\"ui-color-light ui-text-4\" style=\"margin-top: 4px\"> \n\t\t\t\t\t\t\t", "\n\t\t\t\t\t\t\t", "\n\t\t\t\t\t</div>\n\t\t\t"])), dailyLimitTitleNode, dailyLimitConfigureNode);
	        dailyLimitConfigureNode.addEventListener('click', function () {
	          crm_form_fileLimit.FileLimit.instance().subscribe('onSuccessLimitChanged', function (event) {
	            if (main_core.Type.isUndefined(event.data.limit)) return;
	            _this5.options.dictionary.dailyFileLimitSizeMbValue = event.data.limit;
	            if (main_core.Type.isInteger(event.data.limit)) {
	              dailyLimitTitleNode.innerText = landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_FORM_DAILY_FILE_LIMIT_TITLE').replace('%size%', event.data.limit);
	              dailyLimitConfigureNode.innerText = landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_FORM_DAILY_FILE_LIMIT_CONFIGURE');
	            }
	            if (main_core.Type.isNull(event.data.limit)) {
	              dailyLimitTitleNode.innerText = '';
	              dailyLimitConfigureNode.innerText = landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_FORM_DAILY_FILE_LIMIT_CONFIGURE_FULL');
	            }
	          }).open();
	        });
	        sizeField.getLayout().appendChild(dailyLimitNode);
	        limitationFields.push(sizeField);
	      }
	      if (main_core.Type.isArrayFilled(this.options.dictionary.contentTypes)) {
	        var selectedContentTypes = main_core.Type.isArrayFilled(field.contentTypes) ? field.contentTypes : ['any'];
	        var lastValue = selectedContentTypes;
	        var contentTypesField = new BX.Landing.UI.Field.Checkbox({
	          selector: 'contentTypes',
	          title: landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_FORM_ALLOWED_FILE_TYPE'),
	          value: selectedContentTypes,
	          items: [function () {
	            if (landing_loc.Loc.hasMessage('LANDING_FIELDS_ITEM_FORM_ALLOWED_ANY_FILE_TYPE')) {
	              return {
	                name: landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_FORM_ALLOWED_ANY_FILE_TYPE'),
	                value: 'any'
	              };
	            }
	            return undefined;
	          }()].concat(babelHelpers.toConsumableArray(this.options.dictionary.contentTypes.map(function (item) {
	            var hint = item.hint ? "<span class=\"ui-hint\" data-hint=\"".concat(main_core.Text.encode(item.hint), "\"></span>") : '';
	            return {
	              html: "<span style=\"display: flex; align-items: center;\">".concat(main_core.Text.encode(item.name), " ").concat(hint, "</span>"),
	              name: '',
	              value: item.id
	            };
	          }))),
	          onValueChange: function onValueChange() {
	            var value = contentTypesField.getValue();
	            if (value.includes('any')) {
	              if (lastValue.includes('any')) {
	                contentTypesField.setValue(value.filter(function (item) {
	                  return item !== 'any';
	                }));
	              } else {
	                contentTypesField.setValue(['any']);
	              }
	            }
	            lastValue = contentTypesField.getValue();
	          }
	        });
	        BX.UI.Hint.init(contentTypesField.getLayout());
	        limitationFields.push(contentTypesField);
	      }
	      return limitationFields;
	    }
	  }, {
	    key: "createDefaultValueField",
	    value: function createDefaultValueField(field) {
	      return new BX.Landing.UI.Field.Dropdown({
	        selector: 'value',
	        title: landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_FORM_LIST_DEFAULT_VALUE_TITLE'),
	        content: field.value,
	        items: [{
	          label: landing_loc.Loc.getMessage('LANDING_FORM_DEFAULT_VALUE_NOT_SELECTED'),
	          value: null
	        }].concat(babelHelpers.toConsumableArray(field.items)).map(function (item) {
	          return {
	            name: item.label,
	            value: item.value
	          };
	        })
	      });
	    } // eslint-disable-next-line class-methods-use-this
	  }, {
	    key: "createFieldSettingsForm",
	    value: function createFieldSettingsForm(field) {
	      var _this6 = this;
	      var fields = [];
	      var form = new landing_ui_form_formsettingsform.FormSettingsForm({
	        serializeModifier: function serializeModifier(value) {
	          var modifiedValue = _objectSpread({}, value);
	          if (Reflect.has(value, 'label')) {
	            modifiedValue.label = main_core.Text.decode(value.label);
	          }
	          if (Reflect.has(value, 'required')) {
	            modifiedValue.required = value.required.includes('required');
	          }
	          if (Reflect.has(value, 'multiple')) {
	            modifiedValue.multiple = value.multiple.includes('multiple');
	          }
	          if (Reflect.has(value, 'bigPic')) {
	            modifiedValue.bigPic = value.bigPic.includes('bigPic');
	          }
	          if (Reflect.has(value, 'value') && main_core.Type.isArrayFilled(value.items)) {
	            modifiedValue.items = modifiedValue.items.map(function (item) {
	              item.selected = value.value === item.value;
	              return item;
	            });
	          }
	          if (Reflect.has(value, 'products')) {
	            modifiedValue.items = main_core.Runtime.clone(value.products);
	            if (!main_core.Type.isPlainObject(modifiedValue.editing)) {
	              modifiedValue.editing = {};
	            }
	            if (Reflect.has(value, 'value') && main_core.Type.isArrayFilled(modifiedValue.items)) {
	              modifiedValue.items.forEach(function (item) {
	                item.selected = String(value.value) === String(item.value);
	              });
	            }
	            modifiedValue.editing.catalog = main_core.Runtime.clone(value.products);
	          }
	          if (Reflect.has(value, 'valueType')) {
	            if (!main_core.Type.isPlainObject(modifiedValue.editing)) {
	              modifiedValue.editing = {};
	            }
	            if (!main_core.Type.isPlainObject(modifiedValue.editing.editable)) {
	              modifiedValue.editing.editable = {};
	            }
	            modifiedValue.editing.editable.valueType = value.valueType;
	          }
	          if (main_core.Type.isArray(value.useCustomPrice)) {
	            modifiedValue.items.forEach(function (item) {
	              item.changeablePrice = value.useCustomPrice.includes('useCustomPrice') && String(item.value) === String(value.customPrice);
	            });
	            delete modifiedValue.customPrice;
	            delete modifiedValue.useCustomPrice;
	          }
	          if (main_core.Type.isArray(value.autocomplete)) {
	            modifiedValue.autocomplete = value.autocomplete.length > 0;
	          }
	          if (main_core.Type.isArrayFilled(value.contentTypes)) {
	            if (value.contentTypes.includes('any')) {
	              modifiedValue.contentTypes = [];
	            }
	          }
	          if (main_core.Type.isArray(value.requisite)) {
	            modifiedValue.requisite = {
	              presets: value.requisite
	            };
	          }
	          return modifiedValue;
	        }
	      });
	      if (field.type === 'product') {
	        fields.push(new landing_ui_field_productfield.ProductField({
	          title: landing_loc.Loc.getMessage('LANDING_FIELDS_LIST_FIELD_PRODUCTS_TITLE2'),
	          selector: 'products',
	          items: field.editing.catalog || [],
	          iblockId: this.options.dictionary.catalog.id,
	          onChange: function onChange() {
	            var oldCustomPrice = form.fields.get('customPrice');
	            var newCustomPrice = _this6.createCustomPriceDropdown(_objectSpread(_objectSpread({}, field), {}, {
	              items: form.serialize().items
	            }));
	            var useCustomPrice = field.items.some(function (item) {
	              return item.changeablePrice;
	            });
	            var useCustomPriceField = form.fields.get('useCustomPrice');
	            if (useCustomPrice || useCustomPriceField.getValue().includes('useCustomPrice')) {
	              main_core.Dom.style(newCustomPrice.getLayout(), 'display', null);
	            } else {
	              main_core.Dom.style(newCustomPrice.getLayout(), 'display', 'none');
	            }
	            newCustomPrice.setValue(oldCustomPrice.getValue());
	            form.replaceField(oldCustomPrice, newCustomPrice);
	            var oldDefaultValue = form.fields.get('productDefaultValue');
	            var newDefaultValue = _this6.createProductDefaultValueDropdown(_objectSpread(_objectSpread({}, field), {}, {
	              items: form.serialize().items
	            }));
	            form.replaceField(oldDefaultValue, newDefaultValue);
	          }
	        }));
	      }
	      if (field.editing.hasLabel) {
	        fields.push(new landing_ui_field_textfield.TextField({
	          selector: 'label',
	          title: landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_FORM_LABEL_FIELD_TITLE'),
	          content: field.label,
	          textOnly: true
	        }));
	      }
	      if (field.type === 'rq') {
	        fields.push(new RequisiteSettingsField({
	          selector: 'requisite',
	          title: landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_REQUISITE_SETTINGS_LABEL'),
	          value: field.requisite.presets
	        }));
	      }
	      if (field.editing.canBeRequired) {
	        fields.push(new BX.Landing.UI.Field.Checkbox({
	          selector: 'required',
	          compact: true,
	          items: [{
	            name: landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_FORM_REQUIRED_FIELD_TITLE'),
	            value: 'required'
	          }],
	          value: field.required ? ['required'] : []
	        }));
	      }
	      if (field.editing.canBeMultiple) {
	        fields.push(new BX.Landing.UI.Field.Checkbox({
	          selector: 'multiple',
	          compact: true,
	          items: [{
	            name: landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_FORM_MULTIPLE_FIELD_TITLE'),
	            value: 'multiple'
	          }],
	          value: field.multiple ? ['multiple'] : []
	        }));
	      }
	      if (field.editing.hasStringDefaultValue) {
	        fields.push(new landing_ui_field_textfield.TextField({
	          selector: 'value',
	          title: landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_FORM_DEFAULT_VALUE_FIELD_TITLE'),
	          content: field.value,
	          textOnly: true
	        }));
	      }
	      if (field.type === 'product') {
	        fields.push(new BX.Landing.UI.Field.Checkbox({
	          selector: 'bigPic',
	          compact: true,
	          items: [{
	            name: landing_loc.Loc.getMessage('LANDING_FIELDS_LIST_FIELD_PRODUCTS_SHOW_BIG_PICTURE'),
	            value: 'bigPic'
	          }],
	          value: field.bigPic ? ['bigPic'] : []
	        }));
	        var useCustomPrice = field.items.some(function (item) {
	          return item.changeablePrice;
	        });
	        var customPriceField = this.createCustomPriceDropdown(field);
	        if (useCustomPrice) {
	          main_core.Dom.style(customPriceField.getLayout(), 'display', null);
	        } else {
	          main_core.Dom.style(customPriceField.getLayout(), 'display', 'none');
	        }
	        fields.push(new BX.Landing.UI.Field.Checkbox({
	          id: 'useCustomPrice',
	          selector: 'useCustomPrice',
	          compact: true,
	          items: [{
	            name: landing_loc.Loc.getMessage('LANDING_FIELDS_LIST_FIELD_PRODUCTS_ALLOW_CUSTOM_PRICE'),
	            value: 'useCustomPrice'
	          }],
	          value: useCustomPrice ? ['useCustomPrice'] : [],
	          onChange: function onChange(checkbox) {
	            if (checkbox instanceof landing_ui_field_basefield.BaseField) {
	              var _customPriceField = form.fields.get('customPrice');
	              if (checkbox.getValue().includes('useCustomPrice')) {
	                main_core.Dom.style(_customPriceField.getLayout(), 'display', null);
	              } else {
	                main_core.Dom.style(_customPriceField.getLayout(), 'display', 'none');
	              }
	            }
	          }
	        }));
	        fields.push(customPriceField);
	        fields.push(this.createProductDefaultValueDropdown(field));
	      }
	      if (['list', 'radio', 'checkbox'].includes(field.type) && field.editing.items.length > 0) {
	        var defaultValueField = this.createDefaultValueField(field);
	        var listSettingsField = new landing_ui_field_listsettingsfield.ListSettingsField({
	          selector: 'items',
	          title: landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_FORM_LIST_SETTINGS_TITLE'),
	          items: function () {
	            return field.editing.items.map(function (item) {
	              var selectedItem = field.items.find(function (currentItem) {
	                return String(currentItem.value) === String(item.id);
	              });
	              var checked = !!selectedItem;
	              return {
	                name: checked ? selectedItem.label : item.value,
	                value: item.id,
	                checked: checked
	              };
	            });
	          }()
	        });
	        listSettingsField.subscribe('onChange', function () {
	          var currentDefaultValueField = form.fields.find(function (item) {
	            return item.selector === 'value';
	          });
	          form.replaceField(currentDefaultValueField, _this6.createDefaultValueField(_objectSpread(_objectSpread({}, field), {}, {
	            items: form.serialize().items,
	            value: currentDefaultValueField.getValue()
	          })));
	        });
	        fields.push(listSettingsField);
	        fields.push(defaultValueField);
	      }
	      if (main_core.Type.isPlainObject(field.editing) && main_core.Type.isArrayFilled(field.editing.valueTypes)) {
	        fields.push(new BX.Landing.UI.Field.Dropdown({
	          selector: 'valueType',
	          title: landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_FORM_VALUE_TYPE'),
	          content: field.editing.editable.valueType,
	          items: field.editing.valueTypes.map(function (item) {
	            return {
	              name: item.name,
	              value: item.id
	            };
	          })
	        }));
	      }
	      if (main_core.Text.toBoolean(field.editing.supportAutocomplete) === true) {
	        fields.push(new BX.Landing.UI.Field.Checkbox({
	          selector: 'autocomplete',
	          compact: true,
	          multiple: false,
	          items: [{
	            name: landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_ENABLE_AUTOCOMPLETE'),
	            html: main_core.Text.encode(landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_ENABLE_AUTOCOMPLETE')) + "<span \n\t\t\t\t\t\t\t\t\tclass=\"landing-ui-form-help\" \n\t\t\t\t\t\t\t\t\tstyle=\"margin: 0 0 0 5px;\"\n\t\t\t\t\t\t\t\t\tonclick=\"top.BX.Helper.show('redirect=detail&code=14611764'); return false;\"\n\t\t\t\t\t\t\t\t><a href=\"javascript: void();\"></a></span>",
	            value: 'autocomplete'
	          }],
	          value: field.autocomplete ? ['autocomplete'] : false
	        }));
	      }
	      if (main_core.Text.toBoolean(field.editing.hasHint) === true) {
	        fields.push(new landing_ui_field_textfield.TextField({
	          selector: 'hint',
	          title: landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_FORM_FIELD_HINT_TITLE'),
	          content: field.hint,
	          textOnly: true
	        }));
	      }
	      if (main_core.Text.toBoolean(field.editing.supportHintOnFocus) === true) {
	        fields.push(new BX.Landing.UI.Field.Checkbox({
	          selector: 'hintOnFocus',
	          compact: true,
	          multiple: false,
	          items: [{
	            name: landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_ENABLE_HINT_ON_FOCUS'),
	            value: 'hintOnFocus'
	          }],
	          value: field.hintOnFocus ? ['hintOnFocus'] : false
	        }));
	      }
	      if (field.type === 'file') {
	        var limitationFields = this.createFileLimitationFields(field);
	        limitationFields.forEach(function (item) {
	          fields.push(item);
	        });
	      }
	      fields.forEach(function (currentField) {
	        form.addField(currentField);
	      });
	      return form;
	    }
	  }, {
	    key: "getListContainer",
	    value: function getListContainer() {
	      return this.cache.remember('listContainer', function () {
	        return main_core.Tag.render(_templateObject5 || (_templateObject5 = babelHelpers.taggedTemplateLiteral(["<div class=\"landing-ui-field-fields-list-container\"></div>"])));
	      });
	    }
	  }, {
	    key: "onSelectFieldButtonClick",
	    value: function onSelectFieldButtonClick(event) {
	      var _this7 = this;
	      event.preventDefault();
	      landing_ui_panel_fieldspanel.FieldsPanel.getInstance({
	        isLeadEnabled: this.options.isLeadEnabled
	      }).show({
	        disabledFields: this.items.map(function (item) {
	          return item.options.id;
	        }),
	        allowedTypes: _classPrivateMethodGet(this, _getFieldsPanelAllowedTypes, _getFieldsPanelAllowedTypes2).call(this)
	      }).then(function (selectedFields) {
	        if (main_core.Type.isArrayFilled(selectedFields)) {
	          _this7.options.crmFields = landing_ui_panel_fieldspanel.FieldsPanel.getInstance().getOriginalCrmFields();
	          _this7.onFieldsSelect(selectedFields);
	        }
	      });
	    }
	  }, {
	    key: "onFieldsSelect",
	    value: function onFieldsSelect(selectedFields) {
	      var _this8 = this;
	      var preparingOptions = {
	        fields: selectedFields.map(function (fieldId) {
	          return {
	            name: fieldId
	          };
	        })
	      };
	      void this.showLoader();
	      crm_form_client.FormClient.getInstance().prepareOptions(this.options.formOptions, preparingOptions).then(function (result) {
	        void _this8.hideLoader();
	        return Promise.all(result.data.fields.map(function (field) {
	          return _this8.addItem(field);
	        }));
	      }).then(function () {
	        _this8.emit('onChange', {
	          skipPrepare: true
	        });
	      });
	    }
	  }, {
	    key: "getValue",
	    value: function getValue() {
	      return this.items.map(function (item) {
	        return item.getValue();
	      });
	    } // eslint-disable-next-line class-methods-use-this
	  }, {
	    key: "onSelectProductsButtonClick",
	    value: function onSelectProductsButtonClick(event) {
	      var _this9 = this;
	      event.preventDefault();
	      var preparingOptions = {
	        fields: [{
	          type: 'product'
	        }]
	      };
	      void this.showLoader();
	      crm_form_client.FormClient.getInstance().prepareOptions(this.options.formOptions, preparingOptions).then(function (result) {
	        void _this9.hideLoader();
	        var promises = result.data.fields.map(function (field) {
	          return _this9.addItem(field);
	        });
	        Promise.all(promises).then(function () {
	          _this9.emit('onChange', {
	            skipPrepare: true
	          });
	        });
	      });
	    }
	  }, {
	    key: "onSelectSeparatorButtonClick",
	    value: function onSelectSeparatorButtonClick(event) {
	      var _this10 = this;
	      event.preventDefault();
	      landing_ui_panel_separatorpanel.SeparatorPanel.getInstance().show().then(function (separator) {
	        var fields = [separator];
	        if (separator.type === 'page' && !_this10.items.find(function (item) {
	          return item.options.type === 'page';
	        })) {
	          fields.push(_objectSpread({}, fields[0]));
	        }
	        void _this10.showLoader();
	        crm_form_client.FormClient.getInstance().prepareOptions(_this10.options.formOptions, {
	          fields: fields
	        }).then(function (result) {
	          void _this10.hideLoader();
	          var separatorPromise = Promise.resolve();
	          if (separator.type === 'page' && !_this10.items.find(function (item) {
	            return item.options.type === 'page';
	          })) {
	            result.data.fields[0].label = landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_PAGE_TITLE').replace('#number#', 1);
	            result.data.fields[1].label = landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_PAGE_TITLE').replace('#number#', 2);
	            separatorPromise = Promise.all([_this10.prependItem(result.data.fields[0]), _this10.insertItemAfterIndex(result.data.fields[1], 1)]);
	          } else {
	            result.data.fields.forEach(function (field) {
	              var _field$id$split = field.id.split('_'),
	                _field$id$split2 = babelHelpers.slicedToArray(_field$id$split, 1),
	                type = _field$id$split2[0];
	              var count = _this10.items.filter(function (item) {
	                return item.options.id.startsWith(type);
	              }).length;
	              if (type === 'page') {
	                field.label = landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_PAGE_TITLE').replace('#number#', count + 1);
	              }
	              if (type === 'section') {
	                field.label = landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_SECTION_TITLE').replace('#number#', count + 1);
	              }
	              if (type === 'hr') {
	                field.label = landing_loc.Loc.getMessage('LANDING_FIELDS_ITEM_LINE_TITLE').replace('#number#', count + 1);
	              }
	              separatorPromise = _this10.addItem(field);
	            });
	          }
	          separatorPromise.then(function () {
	            _this10.emit('onChange', {
	              skipPrepare: true
	            });
	          });
	        });
	      });
	    }
	  }, {
	    key: "onItemRemove",
	    value: function onItemRemove(event) {
	      this.items = this.items.filter(function (item) {
	        return item !== event.getTarget();
	      });
	      this.emit('onChange', {
	        skipPrepare: true
	      });
	    }
	  }, {
	    key: "onItemEdit",
	    value: function onItemEdit(event) {
	      var _this11 = this;
	      var listItem = event.getTarget();
	      var _event$getTarget = event.getTarget(),
	        options = _event$getTarget.options;
	      if (options.fieldController) {
	        event.preventDefault();
	        options.fieldController.showSettingsPopup();
	        if (options.sourceOptions.settingsData) {
	          options.form.unsubscribe('onChange', listItem.onFormChange);
	          options.form.subscribe('onChange', listItem.onFormChange);
	          options.fieldController.settingsPopup.subscribeOnce('onClose', function () {
	            options.sourceOptions.settingsData = options.fieldController.getSettings();
	            options.form.emit('onChange');
	          });
	          return;
	        }
	        setTimeout(function () {
	          options.fieldController.settingsPopup.subscribeOnce('onClose', function () {
	            options.sourceOptions.booking.settings_data = options.fieldController.getSettings().data;

	            // eslint-disable-next-line camelcase
	            var settings_data = options.sourceOptions.booking.settings_data;
	            Object.keys(settings_data).forEach(function (key) {
	              if (main_core.Type.isArray(settings_data[key].value)) {
	                settings_data[key].value = settings_data[key].value.join('|');
	              }
	            });
	            _this11.emit('onChange', {
	              skipPrepare: true
	            });
	          });
	        }, 1000);
	      }
	    }
	  }, {
	    key: "onFormChange",
	    value: function onFormChange(event) {
	      this.emit('onChange', {
	        skipPrepare: true
	      });
	      var target = event.getTarget();
	      var value = target.getValue();
	      target.setDescription(value.label);
	    }
	  }, {
	    key: "onDragEnd",
	    value: function onDragEnd() {
	      var _this12 = this;
	      setTimeout(function () {
	        _this12.items = babelHelpers.toConsumableArray(_this12.getListContainer().children).map(function (itemNode) {
	          var itemNodeId = main_core.Dom.attr(itemNode, 'data-id');
	          return _this12.items.find(function (item) {
	            return item.options.id === itemNodeId;
	          });
	        });
	        _this12.emit('onChange', {
	          skipPrepare: true
	        });
	      });
	    }
	  }, {
	    key: "getLoader",
	    value: function getLoader() {
	      return this.cache.remember('loader', function () {
	        return new main_loader.Loader({
	          size: 50,
	          mode: 'inline',
	          offset: {
	            top: '5px',
	            left: '225px'
	          }
	        });
	      });
	    }
	  }, {
	    key: "showLoader",
	    value: function showLoader() {
	      var loader = this.getLoader();
	      var container = this.getListContainer();
	      main_core.Dom.append(loader.layout, container);
	      return loader.show(container);
	    }
	  }, {
	    key: "hideLoader",
	    value: function hideLoader() {
	      var loader = this.getLoader();
	      main_core.Dom.remove(loader.layout);
	      return loader.hide();
	    }
	  }], [{
	    key: "isSeparator",
	    value: function isSeparator(fieldId) {
	      if (main_core.Type.isStringFilled(fieldId)) {
	        return fieldId.startsWith('hr') || fieldId.startsWith('section') || fieldId.startsWith('page');
	      }
	      return false;
	    }
	  }, {
	    key: "getSeparatorTitle",
	    value: function getSeparatorTitle(fieldId) {
	      if (main_core.Type.isStringFilled(fieldId)) {
	        if (fieldId.startsWith('hr')) {
	          return landing_loc.Loc.getMessage('LANDING_SEPARATOR_SOLID_LINE');
	        }
	        if (fieldId.startsWith('section')) {
	          return landing_loc.Loc.getMessage('LANDING_SEPARATOR_HEADER');
	        }
	        if (fieldId.startsWith('page')) {
	          return landing_loc.Loc.getMessage('LANDING_SEPARATOR_PAGE');
	        }
	      }
	      return landing_loc.Loc.getMessage('LANDING_FIELDS_LIST_FIELD_SEPARATOR_TITLE');
	    }
	  }]);
	  return FieldsListField;
	}(landing_ui_field_basefield.BaseField);
	function _getFieldsPanelAllowedTypes2() {
	  return ['list', 'string', 'checkbox', 'date', 'text', 'typed_string', 'file', 'datetime', 'integer', 'double', 'enumeration', 'url', 'money', 'boolean', 'booking', 'resourcebooking', 'radio', 'bool', 'hr', 'br', 'phone', 'email', 'page', 'section'];
	}

	exports.FieldsListField = FieldsListField;

}((this.BX.Landing.UI.Field = this.BX.Landing.UI.Field || {}),BX,BX.Landing,BX.UI.DragAndDrop,BX.Landing.UI.Panel,BX.Landing.UI.Component,BX.Landing.UI.Component,BX.Landing.UI.Field,BX.Event,BX.Landing.UI.Form,BX.Crm.Form,BX.Crm.Form,BX.Landing.UI.Field,BX.Landing.UI.Panel,BX.Landing,BX,BX.Landing.Ui.Field,BX.Calendar,BX,BX,BX.Landing.UI.Component,BX,BX.Landing.UI.Field));
//# sourceMappingURL=fieldslistfield.bundle.js.map
