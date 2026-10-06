/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.UI = this.BX.Landing.UI || {};
(function (exports, landing_ui_field_textfield, main_core, ui_entitySelector) {
  'use strict';
  var _templateObject, _templateObject2;

  var LinkUrl = /*#__PURE__*/function (_landing_ui_field_tex) {
    function LinkUrl(data) {
      var _this;
      babelHelpers.classCallCheck(this, LinkUrl);
      _this = _landing_ui_field_tex.call(this, data) || this;

      /**
       * Href value matchers
       */
      _this.matchers = {
        catalogElement: new RegExp("^(product:)?#catalogElement([0-9]+)"),
        catalogSection: new RegExp("^(product:)?#catalogSection([0-9]+)"),
        catalog: new RegExp("^#Section([0-9]+)"),
        element: new RegExp("^#Element([0-9]+)"),
        block: new RegExp("^(block:)?#block([0-9]+)"),
        page: new RegExp("^(page:)?#landing([0-9]+)"),
        crmForm: new RegExp("^(form:)?#crmFormPopup([0-9]+)"),
        crmPhone: new RegExp("^(tel:)?#crmPhone([0-9]+)"),
        diskFile: new RegExp("^(file:)?#diskFile([0-9]+)"),
        user: new RegExp("^(user:)?#user([0-9]+)"),
        system: new RegExp("^#system_[a-z_-]+"),
        pageOld: new RegExp("^#landing([0-9]+)")
      };
      _this.typePostfix = {
        skype: '?chat'
      };
      _this.typeHrefs = {
        page: LinkUrl.TYPE_HREF_PAGE,
        block: LinkUrl.TYPE_HREF_BLOCK,
        form: LinkUrl.TYPE_HREF_CRM_FORM,
        product: LinkUrl.TYPE_HREF_PRODUCT,
        file: LinkUrl.TYPE_HREF_FILE,
        start: LinkUrl.TYPE_HREF_START,
        user: LinkUrl.TYPE_HREF_USER
      };
      main_core.Dom.addClass(_this.layout, "landing-ui-field-link-url");
      _this.requestOptions = data.options || {};
      _this.disableBlocks = main_core.Type.isBoolean(data.disableBlocks) ? data.disableBlocks : false;
      _this.disallowType = main_core.Type.isBoolean(data.disallowType) ? data.disallowType : false;
      _this.iblocks = main_core.Type.isArray(data.iblocks) ? data.iblocks : null;
      _this.allowedTypes = main_core.Type.isArray(data.allowedTypes) ? data.allowedTypes : [LinkUrl.TYPE_BLOCK, LinkUrl.TYPE_PAGE];
      if (_this.allowedTypes.length === 1) {
        _this.constantType = _this.allowedTypes[0];
        _this.constantTypeData = data.typeData;
      }
      _this.allowedCatalogEntityTypes = main_core.Type.isArray(data.allowedCatalogEntityTypes) ? data.allowedCatalogEntityTypes : null;
      _this.onInitHandler = main_core.Type.isFunction(data.onInit) ? data.onInit : function () {};
      _this.onNewPageHandler = main_core.Type.isFunction(data.onNewPage) ? data.onNewPage : function () {};
      _this.enableAreas = data.enableAreas;
      _this.customPlaceholder = data.customPlaceholder;
      _this.detailPageMode = data.detailPageMode === true;
      _this.sourceField = data.sourceField;
      _this.currentPageOnly = data.currentPageOnly;
      _this.panelTitle = data.panelTitle;
      _this.onListShow = _this.onListShow.bind(_this, _this.requestOptions);
      _this.onTypeChange = _this.onTypeChange.bind(_this);
      _this.onListItemClick = _this.onListItemClick.bind(_this);
      _this.popup = null;
      _this.dynamic = null;
      _this.value = null;
      _this.hrefTypeSwithcer = _this.createTypeSwitcher();
      _this.hrefTypeSwithcerValue = _this.getHrefStringType();
      _this.grid = _this.createGridLayout();
      _this.gridLeftCell = _this.grid.querySelector("[class*=\"left\"]");
      _this.gridCenterCell = _this.grid.querySelector("[class*=\"center\"]");
      _this.gridRightCell = _this.grid.querySelector("[class*=\"right\"]");
      main_core.Dom.remove(_this.hrefTypeSwithcer.header);
      main_core.Dom.append(_this.hrefTypeSwithcer.layout, _this.gridLeftCell);
      if (_this.getHrefStringType() === LinkUrl.TYPE_HREF_START) {
        _this.gridCenterCell.hidden = true;
        _this.gridRightCell.hidden = true;
      }
      main_core.Dom.append(_this.input, _this.gridCenterCell);
      main_core.Dom.append(_this.grid, _this.layout);
      if (data.settingMode) {
        main_core.Dom.addClass(_this.gridCenterCell, "setting-mode");
      }
      if (!main_core.Type.isUndefined(_this.constantType)) {
        _this.rightData = _this.getRightData();
        if (_this.rightData.button) {
          var button = _this.createCenterCellButton(_this.rightData.button);
          main_core.Dom.append(button.layout, _this.gridCenterCell);
        }
        _this.contentEditable = false;
      }
      _this.hrefTypeSwithcer.subscribe('onChange', function () {
        _this.rightData = _this.getRightData();
        _this.input.hidden = _this.rightData.hideInput === true;
        _this.gridCenterCell.hidden = false;
        _this.gridRightCell.hidden = false;
        var button;
        if (_this.rightData.button) {
          button = _this.createCenterCellButton(_this.rightData.button);
        }
        _this.emit('buildCenter', {
          button: button
        });
        _this.emit('selectAction', {
          hrefStringType: _this.getHrefStringType(),
          right: _this.rightData
        });
        if (_this.hrefTypeSwithcer.getValue() === LinkUrl.DELETE_TYPE_HREF) {
          _this.deleteTypeHref();
        }

        //clear input when type is changed
        if (_this.hrefTypeSwithcerValue !== _this.hrefTypeSwithcer.getValue()) {
          _this.input.innerHTML = '';
          _this.setValue("");
          _this.hrefTypeSwithcerValue = _this.hrefTypeSwithcer.getValue();
        }
        var typeData = _this.getTypeData(_this.hrefTypeSwithcer.getValue());
        _this.setEditPrevented(false);
        _this.contentEditable = typeData.contentEditable;
      });
      var type = _this.getHrefStringType();
      _this.setHrefPlaceholderByType(type);
      _this.setHrefTypeSwitcherValue(type);
      _this.removeHrefTypeFromHrefString();
      _this.makeDisplayedHrefValue();
      if (!main_core.Type.isUndefined(_this.constantType)) {
        if (_this.content === '') {
          _this.input.innerText = '';
          main_core.Dom.addClass(_this.input, "landing-ui-field-input-empty");
        }
      }
      if (_this.disallowType) {
        main_core.Dom.addClass(_this.gridLeftCell, "grid-dissallow");
      }
      return _this;
    }

    /**
     * Sets iblocks list
     * @param {{name: string, value: int|string}[]} iblocks
     */
    babelHelpers.inherits(LinkUrl, _landing_ui_field_tex);
    return babelHelpers.createClass(LinkUrl, [{
      key: "setIblocks",
      value: function setIblocks(iblocks) {
        this.iblocks = main_core.Type.isArray(iblocks) ? iblocks : null;
      }
    }, {
      key: "createCenterCellButton",
      value: function createCenterCellButton(data) {
        var actionClick;
        if (data.hasOwnProperty('action')) {
          actionClick = this.onListShow.bind(this, data.action);
        } else {
          actionClick = data.onclick;
        }
        var buttonClasses = "landing-ui-button-grid-center-cell ".concat(data.className || '');
        return new BX.Landing.UI.Button.BaseButton("center_cell_button", {
          className: buttonClasses,
          text: data.text,
          onClick: actionClick
        });
      }

      /**
       * Makes displayed value placeholder
       */
    }, {
      key: "makeDisplayedHrefValue",
      value: function makeDisplayedHrefValue() {
        var hrefValue = this.getValue();
        var placeholderType = this.getPlaceholderType();
        if (!main_core.Type.isUndefined(this.constantType)) {
          placeholderType = this.constantType;
        }
        var valuePromise;
        switch (placeholderType) {
          case LinkUrl.TYPE_BLOCK:
            valuePromise = this.getBlockData(hrefValue);
            break;
          case LinkUrl.TYPE_PAGE:
          case LinkUrl.TYPE_HREF_PAGE:
            valuePromise = this.getPageData(hrefValue);
            break;
          case LinkUrl.TYPE_CRM_FORM:
            valuePromise = this.getCrmFormData(hrefValue);
            break;
          case LinkUrl.TYPE_CRM_PHONE:
            valuePromise = this.getCrmPhoneData(hrefValue);
            break;
          case LinkUrl.TYPE_CATALOG_ELEMENT:
            valuePromise = this.getCatalogElementData(hrefValue);
            break;
          case LinkUrl.TYPE_CATALOG_SECTION:
            valuePromise = this.getCatalogSectionData(hrefValue);
            break;
          case LinkUrl.TYPE_DISK_FILE:
            valuePromise = this.getDiskFileData(hrefValue);
            break;
          case LinkUrl.TYPE_USER:
            valuePromise = this.getUserData(hrefValue);
            break;
          case LinkUrl.TYPE_SYSTEM:
            valuePromise = this.getSystemPage(hrefValue);
            break;
          case LinkUrl.TYPE_CATALOG:
            valuePromise = this.getCatalog(hrefValue);
            break;
        }
        if (valuePromise) {
          valuePromise.then(BX.Landing.Utils.proxy(this.createPlaceholder, this)).then(function (data) {
            this.setValue(data, true);
            if (!this.inited) {
              this.inited = true;
              this.onInitHandler();
            }
            return data;
          }.bind(this)).catch(function () {});
        }
      }

      /**
       * Gets placeholder data
       * @param {string} [hrefValue]
       * @return {Promise<Object>}
       */
    }, {
      key: "getPlaceholderData",
      value: function getPlaceholderData(hrefValue) {
        hrefValue = hrefValue || this.getValue();
        var placeholderType = this.getPlaceholderType(hrefValue);
        var valuePromise = Promise.resolve({});
        switch (placeholderType) {
          case LinkUrl.TYPE_BLOCK:
            valuePromise = this.getBlockData(hrefValue);
            break;
          case LinkUrl.TYPE_PAGE:
            valuePromise = this.getPageData(hrefValue);
            break;
          case LinkUrl.TYPE_CATALOG_ELEMENT:
            valuePromise = this.getCatalogElementData(hrefValue);
            break;
          case LinkUrl.TYPE_CATALOG_SECTION:
            valuePromise = this.getCatalogSectionData(hrefValue);
            break;
          case LinkUrl.TYPE_DISK_FILE:
            valuePromise = this.getDiskFileData(hrefValue);
            break;
          case LinkUrl.TYPE_USER:
            valuePromise = this.getUserData(hrefValue);
            break;
          case LinkUrl.TYPE_SYSTEM:
            valuePromise = this.getSystemPage(hrefValue);
            break;
        }
        return valuePromise;
      }

      /**
       * Removes type prefix from href value
       */
    }, {
      key: "removeHrefTypeFromHrefString",
      value: function removeHrefTypeFromHrefString() {
        var clearHref = this.getValue().replace(new RegExp(this.getHrefStringType(), "g"), "");
        this.setValue(clearHref, true);
      }

      /**
       * Sets type switcher value
       * @param type
       */
    }, {
      key: "setHrefTypeSwitcherValue",
      value: function setHrefTypeSwitcherValue(type) {
        if (type === LinkUrl.TYPE_HREF_START) {
          this.gridCenterCell.hidden = true;
          this.gridRightCell.hidden = true;
          this.emit('deleteAction');
        } else {
          this.gridCenterCell.hidden = false;
          this.gridRightCell.hidden = false;
        }
        this.hrefTypeSwithcer.setValue(type);
      }

      /**
       * Gets selected href type (From type switcher)
       * @return {string}
       */
    }, {
      key: "getSelectedHrefType",
      value: function getSelectedHrefType() {
        return this.hrefTypeSwithcer.getValue();
      }
    }, {
      key: "getRightData",
      value: function getRightData() {
        var type = this.hrefTypeSwithcer.getValue();
        if (!main_core.Type.isUndefined(this.constantType)) {
          type = this.constantType;
        }
        var data = this.getTypeData(type);
        var title = this.getRightTitle(data);
        var items = this.getRightItems(data);
        var button = this.getRightButton(data);
        var hideInput = this.getRightHideInput(data);
        var idPopup = '';
        return {
          title: title,
          items: items,
          hideInput: hideInput,
          button: button,
          idPopup: idPopup
        };
      }
    }, {
      key: "getRightTitle",
      value: function getRightTitle(data) {
        return data.title;
      }
    }, {
      key: "getRightItems",
      value: function getRightItems(data) {
        return data.items;
      }
    }, {
      key: "getRightHideInput",
      value: function getRightHideInput(data) {
        return data.hideInput;
      }
    }, {
      key: "getRightButton",
      value: function getRightButton(data) {
        return data.button;
      }
    }, {
      key: "getTypeData",
      value: function getTypeData(type) {
        if (!main_core.Type.isUndefined(this.constantTypeData)) {
          return this.constantTypeData;
        }
        var data = {};
        var buttonClasses = 'fa fa-chevron-right';
        switch (type) {
          case LinkUrl.TYPE_HREF_PAGE:
          case LinkUrl.TYPE_PAGE:
            data.title = BX.Landing.Loc.getMessage("LANDING_LINK_URL_TITLE_PAGE");
            data.items = {
              "_self": BX.Landing.Loc.getMessage("FIELD_LINK_TARGET_SELF"),
              "_blank": BX.Landing.Loc.getMessage("FIELD_LINK_TARGET_BLANK"),
              "_popup": BX.Landing.Loc.getMessage("FIELD_LINK_TARGET_POPUP")
            };
            data.button = {
              'className': buttonClasses,
              'text': '',
              'action': LinkUrl.TYPE_PAGE
            };
            data.hideInput = false;
            data.contentEditable = false;
            break;
          case LinkUrl.TYPE_HREF_BLOCK:
            data.title = BX.Landing.Loc.getMessage("LANDING_LINK_URL_TITLE_BLOCK");
            data.items = {
              "_self": BX.Landing.Loc.getMessage("FIELD_LINK_TARGET_SELF"),
              "_blank": BX.Landing.Loc.getMessage("FIELD_LINK_TARGET_BLANK"),
              "_popup": BX.Landing.Loc.getMessage("FIELD_LINK_TARGET_POPUP")
            };
            data.button = {
              'className': buttonClasses,
              'text': '',
              'action': LinkUrl.TYPE_BLOCK
            };
            data.hideInput = false;
            data.contentEditable = false;
            break;
          case LinkUrl.TYPE_HREF_CRM_FORM:
            data.title = BX.Landing.Loc.getMessage("LANDING_LINK_URL_TITLE_CRM_FORM");
            data.button = {
              'className': buttonClasses,
              'text': '',
              'action': LinkUrl.TYPE_CRM_FORM
            };
            data.hideInput = false;
            data.contentEditable = false;
            break;
          case LinkUrl.TYPE_HREF_PRODUCT:
          case LinkUrl.TYPE_CATALOG:
            data.title = BX.Landing.Loc.getMessage("LANDING_LINK_URL_TITLE_PRODUCT");
            data.button = {
              'className': buttonClasses,
              'text': '',
              'action': LinkUrl.TYPE_CATALOG_SECTION
            };
            data.hideInput = false;
            data.contentEditable = false;
            break;
          case LinkUrl.TYPE_HREF_TEL:
            data.title = BX.Landing.Loc.getMessage("LANDING_LINK_URL_TITLE_TEL");
            data.items = {
              "_blank": ''
            };
            data.button = {
              'className': buttonClasses,
              'text': '',
              'action': LinkUrl.TYPE_CRM_PHONE
            };
            data.contentEditable = true;
            data.hideInput = false;
            data.needValidate = 'phone';
            break;
          case LinkUrl.TYPE_HREF_SMS:
            data.title = BX.Landing.Loc.getMessage("LANDING_LINK_URL_TITLE_SMS");
            data.hideInput = false;
            data.needValidate = 'phone';
            data.contentEditable = true;
            break;
          case LinkUrl.TYPE_HREF_SKYPE:
            data.title = BX.Landing.Loc.getMessage("LANDING_LINK_URL_TITLE_SKYPE");
            data.hideInput = false;
            data.needValidate = 'skype';
            data.contentEditable = true;
            break;
          case LinkUrl.TYPE_HREF_MAILTO:
            data.title = BX.Landing.Loc.getMessage("LANDING_LINK_URL_TITLE_MAILTO");
            data.items = {
              "_blank": ""
            };
            data.hideInput = false;
            data.needValidate = 'mail';
            data.contentEditable = true;
            break;
          case LinkUrl.TYPE_HREF_LINK:
            data.title = BX.Landing.Loc.getMessage("LANDING_LINK_URL_TITLE_LINK");
            data.items = {
              "_self": BX.Landing.Loc.getMessage("FIELD_LINK_TARGET_SELF"),
              "_blank": BX.Landing.Loc.getMessage("FIELD_LINK_TARGET_BLANK"),
              "_popup": BX.Landing.Loc.getMessage("FIELD_LINK_TARGET_POPUP")
            };
            data.hideInput = false;
            data.contentEditable = true;
            break;
          case LinkUrl.TYPE_HREF_FILE:
            data.title = BX.Landing.Loc.getMessage("LANDING_LINK_URL_TITLE_FILE");
            data.items = {
              "_blank": ''
            };
            data.button = {
              'className': buttonClasses,
              'text': '',
              'onclick': this.onDiskFileShow.bind(this)
            };
            data.hideInput = false;
            data.contentEditable = false;
            break;
          case LinkUrl.TYPE_HREF_USER:
            data.title = BX.Landing.Loc.getMessage("LANDING_LINK_URL_TITLE_USER");
            data.button = {
              'className': buttonClasses,
              'text': '',
              'onclick': this.onUserListShow.bind(this)
            };
            data.hideInput = false;
            data.contentEditable = false;
            break;
        }
        return data;
      }

      /**
       * Get link type
       * @return {string}
       */
    }, {
      key: "getHrefStringType",
      value: function getHrefStringType() {
        var segment = this.getValueText();
        var type = LinkUrl.TYPE_HREF_START;
        if (!main_core.Type.isUndefined(this.constantType)) {
          return this.constantType;
        }
        var foundHrefStringType = this.matchHrefStringType(segment);
        if (foundHrefStringType !== null) {
          return foundHrefStringType;
        }

        //for blocks with default href="#"
        if (segment === '#') {
          return type;
        }
        var setHrefTypes = [LinkUrl.TYPE_HREF_START, LinkUrl.TYPE_HREF_PAGE, LinkUrl.TYPE_HREF_BLOCK, LinkUrl.TYPE_HREF_CRM_FORM, LinkUrl.TYPE_HREF_PRODUCT, LinkUrl.TYPE_HREF_TEL, LinkUrl.TYPE_HREF_SMS, LinkUrl.TYPE_HREF_MAILTO, LinkUrl.TYPE_HREF_SKYPE, LinkUrl.TYPE_HREF_FILE, LinkUrl.TYPE_HREF_USER];
        var isFindHrefType = setHrefTypes.some(function (hrefType) {
          return segment.includes(hrefType);
        });
        if (segment !== '' && segment !== '#' && !isFindHrefType) {
          return LinkUrl.TYPE_HREF_LINK;
        }
        var segmentType = BX.Landing.Utils.join(segment.split(":")[0], ":");
        if (segment.length !== segmentType.length) {
          switch (segmentType) {
            case LinkUrl.TYPE_HREF_PAGE:
              type = LinkUrl.TYPE_HREF_PAGE;
              break;
            case LinkUrl.TYPE_HREF_BLOCK:
              type = LinkUrl.TYPE_HREF_BLOCK;
              break;
            case LinkUrl.TYPE_HREF_CRM_FORM:
              type = LinkUrl.TYPE_HREF_CRM_FORM;
              break;
            case LinkUrl.TYPE_HREF_PRODUCT:
              type = LinkUrl.TYPE_HREF_PRODUCT;
              break;
            case LinkUrl.TYPE_HREF_TEL:
              type = LinkUrl.TYPE_HREF_TEL;
              break;
            case LinkUrl.TYPE_HREF_SMS:
              type = LinkUrl.TYPE_HREF_SMS;
              break;
            case LinkUrl.TYPE_HREF_SKYPE:
              type = LinkUrl.TYPE_HREF_SKYPE;
              break;
            case LinkUrl.TYPE_HREF_MAILTO:
              type = LinkUrl.TYPE_HREF_MAILTO;
              break;
            case LinkUrl.TYPE_HREF_LINK:
              type = LinkUrl.TYPE_HREF_LINK;
              break;
            case LinkUrl.TYPE_HREF_FILE:
              type = LinkUrl.TYPE_HREF_FILE;
              break;
            case LinkUrl.TYPE_HREF_USER:
              type = LinkUrl.TYPE_HREF_USER;
              break;
          }
        }
        return type;
      }

      /**
       * Match type href for old values
       * @param {string} value
       */
    }, {
      key: "matchHrefStringType",
      value: function matchHrefStringType(value) {
        if (this.matchers.catalogElement.test(value)) {
          return LinkUrl.TYPE_HREF_PRODUCT;
        }
        if (this.matchers.catalogSection.test(value)) {
          return LinkUrl.TYPE_HREF_PRODUCT;
        }
        if (this.matchers.block.test(value)) {
          return LinkUrl.TYPE_HREF_BLOCK;
        }
        if (this.matchers.pageOld.test(value)) {
          return LinkUrl.TYPE_HREF_PAGE;
        }
        if (this.matchers.crmForm.test(value)) {
          return LinkUrl.TYPE_HREF_CRM_FORM;
        }
        if (this.matchers.crmPhone.test(value)) {
          return LinkUrl.TYPE_HREF_TEL;
        }
        if (this.matchers.diskFile.test(value)) {
          return LinkUrl.TYPE_HREF_FILE;
        }
        return null;
      }

      /**
       * Sets placeholder by href type
       * @param {string} type
       */
    }, {
      key: "setHrefPlaceholderByType",
      value: function setHrefPlaceholderByType(type) {
        var placeholder = this.placeholder;
        switch (type) {
          case LinkUrl.TYPE_HREF_PAGE:
            placeholder = BX.Landing.Loc.getMessage("LANDING_LINK_URL_BUTTON_PAGE");
            break;
          case LinkUrl.TYPE_HREF_BLOCK:
            placeholder = BX.Landing.Loc.getMessage("LANDING_LINK_URL_BUTTON_BLOCK");
            break;
          case LinkUrl.TYPE_HREF_CRM_FORM:
            placeholder = BX.Landing.Loc.getMessage("LANDING_LINK_URL_BUTTON_CRM");
            break;
          case LinkUrl.TYPE_HREF_LINK:
            placeholder = BX.Landing.Loc.getMessage("LANDING_LINK_URL_PLACEHOLDER_URL");
            break;
          case LinkUrl.TYPE_HREF_TEL:
            placeholder = BX.Landing.Loc.getMessage("LANDING_LINK_URL_PLACEHOLDER_PHONE");
            break;
          case LinkUrl.TYPE_HREF_SKYPE:
            placeholder = BX.Landing.Loc.getMessage("LANDING_LINK_URL_PLACEHOLDER_SKYPE");
            break;
          case LinkUrl.TYPE_HREF_SMS:
            placeholder = BX.Landing.Loc.getMessage("LANDING_LINK_URL_PLACEHOLDER_PHONE");
            break;
          case LinkUrl.TYPE_HREF_MAILTO:
            placeholder = BX.Landing.Loc.getMessage("LANDING_LINK_URL_PLACEHOLDER_EMAIL");
            break;
          case LinkUrl.TYPE_HREF_FILE:
            placeholder = BX.Landing.Loc.getMessage("LANDING_LINK_URL_BUTTON_FILE");
            break;
          case LinkUrl.TYPE_HREF_USER:
            placeholder = BX.Landing.Loc.getMessage("LANDING_LINK_URL_BUTTON_USER");
            break;
          case LinkUrl.TYPE_HREF_PRODUCT:
            placeholder = BX.Landing.Loc.getMessage("LANDING_LINK_URL_BUTTON_PRODUCT");
            break;
          case LinkUrl.TYPE_CATALOG:
            placeholder = BX.Landing.Loc.getMessage("LANDING_LINK_URL_BUTTON_CATALOG");
            break;
          case LinkUrl.TYPE_PAGE:
            placeholder = BX.Landing.Loc.getMessage("LANDING_LINK_URL_BUTTON_PAGE_SHORT");
            break;
        }
        main_core.Dom.attr(this.input, "data-placeholder", placeholder);
      }

      /**
       * Gets placeholder type
       * @param {string} [hrefValue]
       * @return {string}
       */
    }, {
      key: "getPlaceholderType",
      value: function getPlaceholderType(hrefValue) {
        hrefValue = hrefValue || this.getValue();
        if (this.matchers.block.test(hrefValue)) {
          return LinkUrl.TYPE_BLOCK;
        }
        if (this.matchers.page.test(hrefValue)) {
          return LinkUrl.TYPE_PAGE;
        }
        if (this.matchers.crmForm.test(hrefValue)) {
          return LinkUrl.TYPE_CRM_FORM;
        }
        if (this.matchers.crmPhone.test(hrefValue)) {
          return LinkUrl.TYPE_CRM_PHONE;
        }
        if (this.matchers.catalogElement.test(hrefValue)) {
          return LinkUrl.TYPE_CATALOG_ELEMENT;
        }
        if (this.matchers.catalogSection.test(hrefValue)) {
          return LinkUrl.TYPE_CATALOG_SECTION;
        }
        if (this.matchers.diskFile.test(hrefValue)) {
          return LinkUrl.TYPE_DISK_FILE;
        }
        if (this.matchers.user.test(hrefValue)) {
          return LinkUrl.TYPE_USER;
        }
        if (this.matchers.system.test(hrefValue)) {
          return LinkUrl.TYPE_SYSTEM;
        }
        return LinkUrl.TYPE_HREF_LINK;
      }

      /**
       * Checks that this field contains url placeholder
       * @return {boolean}
       */
    }, {
      key: "containsPlaceholder",
      value: function containsPlaceholder() {
        return this.input.innerHTML.indexOf("span") !== -1;
      }

      /**
       * Creates field grid layout
       * @return {Element}
       */
    }, {
      key: "createGridLayout",
      value: function createGridLayout() {
        return main_core.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-field-link-url-grid --landing-ui-field-link-url__scope\">\n\t\t\t\t<div class=\"landing-ui-field-link-url-grid-left\"></div>\n\t\t\t\t\t<div class=\"landing-ui-field-link-url-grid-center\"></div>\n\t\t\t\t<div class=\"landing-ui-field-link-url-grid-right\"></div>\n\t\t\t</div>\n\t\t\t"], ["\n\t\t\t<div class=\\\"landing-ui-field-link-url-grid --landing-ui-field-link-url__scope\\\">\n\t\t\t\t<div class=\\\"landing-ui-field-link-url-grid-left\\\"></div>\n\t\t\t\t\t<div class=\\\"landing-ui-field-link-url-grid-center\\\"></div>\n\t\t\t\t<div class=\\\"landing-ui-field-link-url-grid-right\\\"></div>\n\t\t\t</div>\n\t\t\t"])));
      }
    }, {
      key: "onSelectHrefButtonClick",
      value: function onSelectHrefButtonClick() {
        this.popupActions.show();
      }

      /**
       * Creates type switcher dropdown
       * @return {BX.Landing.UI.Field.Dropdown}
       */
    }, {
      key: "createTypeSwitcher",
      value: function createTypeSwitcher() {
        //type = PAGE || STORE || KNOWLEDGE || GROUP || VIBE || SMN
        var type = BX.Landing.Env.getInstance().getType();
        var items = [{
          name: BX.Landing.Loc.getMessage("LANDING_LINK_URL_ACTION_SELECT"),
          value: LinkUrl.TYPE_HREF_START,
          hidden: true
        }, {
          name: BX.Landing.Loc.getMessage("LANDING_LINK_URL_ACTION_PAGE"),
          value: LinkUrl.TYPE_HREF_PAGE,
          className: 'landing-ui-field-link-url-select-action-item fas landing-ui-field-link-url-icon--b24',
          type: ['PAGE', 'STORE', 'KNOWLEDGE', 'GROUP', 'SMN']
        }, {
          name: BX.Landing.Loc.getMessage("LANDING_LINK_URL_ACTION_BLOCK"),
          value: LinkUrl.TYPE_HREF_BLOCK,
          className: 'landing-ui-field-link-url-select-action-item fas landing-ui-field-link-url-icon--b24',
          type: ['PAGE', 'STORE', 'KNOWLEDGE', 'GROUP', 'SMN']
        }, {
          name: BX.Landing.Loc.getMessage("LANDING_LINK_URL_ACTION_CRM"),
          value: LinkUrl.TYPE_HREF_CRM_FORM,
          className: 'landing-ui-field-link-url-select-action-item fas landing-ui-field-link-url-icon--crm',
          type: ['PAGE', 'STORE', 'KNOWLEDGE', 'GROUP', 'SMN']
        }, {
          name: BX.Landing.Loc.getMessage("LANDING_LINK_URL_ACTION_PRODUCT"),
          value: LinkUrl.TYPE_HREF_PRODUCT,
          className: 'landing-ui-field-link-url-select-action-item fas landing-ui-field-link-url-icon--product',
          type: 'STORE'
        }, {
          delimiter: true
        }, {
          name: BX.Landing.Loc.getMessage("LANDING_LINK_URL_ACTION_PHONE"),
          value: LinkUrl.TYPE_HREF_TEL,
          className: 'landing-ui-field-link-url-select-action-item fas landing-ui-field-link-url-icon--phone'
        }, {
          name: BX.Landing.Loc.getMessage("LANDING_LINK_URL_ACTION_SMS"),
          value: LinkUrl.TYPE_HREF_SMS,
          className: 'landing-ui-field-link-url-select-action-item fas landing-ui-field-link-url-icon--sms'
        }, {
          name: BX.Landing.Loc.getMessage("LANDING_LINK_URL_ACTION_EMAIL"),
          value: LinkUrl.TYPE_HREF_MAILTO,
          className: 'landing-ui-field-link-url-select-action-item fas landing-ui-field-link-url-icon--mailto'
        }, {
          name: BX.Landing.Loc.getMessage("LANDING_LINK_URL_ACTION_SKYPE"),
          value: LinkUrl.TYPE_HREF_SKYPE,
          className: 'landing-ui-field-link-url-select-action-item fas landing-ui-field-link-url-icon--skype'
        }, {
          delimiter: true
        }, {
          name: BX.Landing.Loc.getMessage("LANDING_LINK_URL_ACTION_LINK"),
          value: LinkUrl.TYPE_HREF_LINK,
          className: 'landing-ui-field-link-url-select-action-item fas landing-ui-field-link-url-icon--link'
        }, this.getFileItem(), {
          name: BX.Landing.Loc.getMessage("LANDING_LINK_URL_ACTION_USER"),
          value: LinkUrl.TYPE_HREF_USER,
          className: 'landing-ui-field-link-url-select-action-item fas landing-ui-field-link-url-icon--user',
          type: ['KNOWLEDGE', 'GROUP']
        }, {
          name: BX.Landing.Loc.getMessage("LANDING_LINK_URL_DELETE_ACTION"),
          value: LinkUrl.DELETE_TYPE_HREF,
          className: 'landing-ui-field-link-url-delete-action-item fas'
        }];
        var setItems = [];
        items.forEach(function (item) {
          if (item === null) {
            return;
          }
          if (!item.hasOwnProperty('type') || item.type === type || main_core.Type.isArray(item.type) && item.type.includes(type)) {
            setItems.push(item);
          }
        });
        if (!main_core.Type.isUndefined(this.constantType)) {
          if (this.constantType === LinkUrl.TYPE_CATALOG) {
            setItems = [{
              name: BX.Landing.Loc.getMessage("LANDING_LINK_URL_ACTION_SELECT_CATALOG"),
              value: this.constantType
            }];
          }
          if (this.constantType === LinkUrl.TYPE_PAGE) {
            setItems = [{
              name: BX.Landing.Loc.getMessage("LANDING_LINK_URL_ACTION_SELECT_PAGE"),
              value: this.constantType
            }];
          }
        }
        return new BX.Landing.UI.Field.Dropdown({
          items: setItems,
          onValueChange: this.onTypeChange,
          maxHeight: 1000,
          className: 'landing-ui-field-link-url-dropdown-href-type',
          classForTextNode: 'landing-ui-field-input-text'
        });
      }
    }, {
      key: "getFileItem",
      value: function getFileItem() {
        if (!BX.DiskFileDialog) {
          return null;
        }
        return {
          name: BX.Landing.Loc.getMessage("LANDING_LINK_URL_ACTION_FILE_MSGVER_1"),
          value: LinkUrl.TYPE_HREF_FILE,
          className: 'landing-ui-field-link-url-select-action-item fas landing-ui-field-link-url-icon--file',
          type: ['KNOWLEDGE', 'GROUP']
        };
      }

      /**
       * Handles link type change event
       * @param {BX.Landing.UI.Field.Dropdown} field
       */
    }, {
      key: "onTypeChange",
      value: function onTypeChange(field) {
        var type = field.getValue();
        switch (type) {
          case LinkUrl.TYPE_HREF_START:
          case LinkUrl.TYPE_HREF_PAGE:
          case LinkUrl.TYPE_HREF_BLOCK:
          case LinkUrl.TYPE_HREF_CRM_FORM:
          case LinkUrl.TYPE_HREF_PRODUCT:
          case LinkUrl.TYPE_HREF_LINK:
          case LinkUrl.TYPE_HREF_TEL:
          case LinkUrl.TYPE_HREF_SMS:
          case LinkUrl.TYPE_HREF_SKYPE:
          case LinkUrl.TYPE_HREF_MAILTO:
          case LinkUrl.TYPE_HREF_FILE:
          case LinkUrl.TYPE_HREF_USER:
        }
        this.setHrefPlaceholderByType(type);
      }

      /**
       * Gets block data
       * @param {string} block - (#block123)
       * @return {Promise<T>}
       */
    }, {
      key: "getBlockData",
      value: function getBlockData(block) {
        var blockId = block.match(/\d+/)[0];
        return BX.Landing.Backend.getInstance().getBlock({
          blockId: blockId
        }).then(function (result) {
          return result.type = "block", result;
        });
      }

      /**
       * Gets page data
       * @param {string} page - (#landing123)
       */
    }, {
      key: "getPageData",
      value: function getPageData(page) {
        var match = page.match(/\d+/);
        if (match !== null) {
          var pageId = match[0];
          return BX.Landing.Backend.getInstance().getLanding({
            landingId: pageId
          }).then(function (landing) {
            if (!landing) {
              if (BX.Text.toNumber(pageId) === 0) {
                this.onNewPageHandler();
                return {
                  type: "landing",
                  id: 0,
                  name: BX.Landing.Loc.getMessage('LANDING_LINK_PLACEHOLDER_NEW_PAGE'),
                  siteId: BX.Landing.Main.getInstance().options.site_id
                };
              } else {
                return null;
              }
            }
            return {
              type: "landing",
              id: landing.ID,
              name: landing.TITLE,
              siteId: landing.SITE_ID
            };
          }.bind(this));
        }
      }
    }, {
      key: "getCrmFormData",
      value: function getCrmFormData(value) {
        var formId = value.match(/\d+/)[0];
        return BX.Landing.Backend.getInstance().action("Form::getList").then(function (result) {
          var form = result.find(function (item) {
            return String(item.ID) === String(formId);
          });
          if (form) {
            return {
              type: "crmFormPopup",
              id: form.ID,
              name: form.NAME
            };
          }
          return null;
        }.bind(this));
      }
    }, {
      key: "getCrmPhoneData",
      value: function getCrmPhoneData(value) {
        return new Promise(function (resolve) {
          var phoneId = value.replace('tel:', '').replace('#crmPhone', '');
          var item = BX.Landing.Env.getInstance().getOptions().references.find(function (item) {
            return String(item.value) === String(phoneId);
          });
          if (item) {
            resolve({
              type: "crmPhone",
              id: item.value,
              name: item.text
            });
          } else {
            resolve(null);
          }
        }.bind(this));
      }

      /**
       * Gets system page data
       * @param {string} page - (#system_([a-z]))
       */
    }, {
      key: "getSystemPage",
      value: function getSystemPage(page) {
        return this.cache.remember(page, function () {
          var systemCode = this.content.replace("#system_", "");
          var systemPages = BX.Landing.Main.getInstance().options.syspages;
          if (systemCode in systemPages) {
            return Promise.resolve({
              type: "system",
              id: "_" + systemCode,
              name: systemPages[systemCode].name
            });
          }
          return Promise.reject();
        }.bind(this));
      }

      /**
       * Gets catalog element data
       * @param {string} element
       */
    }, {
      key: "getCatalogElementData",
      value: function getCatalogElementData(element) {
        return this.cache.remember(element, function () {
          var elementId = element.match(this.matchers.catalogElement)[2];
          if (!main_core.Type.isString(elementId)) {
            elementId = element.match(this.matchers.catalogElement)[1];
          }
          var requestBody = {
            elementId: elementId
          };
          return BX.Landing.Backend.getInstance().action("Utils::getCatalogElement", requestBody);
        }.bind(this));
      }

      /**
       * Gets catalog section data
       * @param {string} section
       */
    }, {
      key: "getCatalogSectionData",
      value: function getCatalogSectionData(section) {
        return this.cache.remember(section, function () {
          var sectionId = section.match(this.matchers.catalogSection)[2];
          if (!main_core.Type.isString(sectionId)) {
            sectionId = element.match(this.matchers.catalogSection)[1];
          }
          var requestBody = {
            sectionId: sectionId
          };
          return BX.Landing.Backend.getInstance().action("Utils::getCatalogSection", requestBody);
        }.bind(this));
      }
    }, {
      key: "getCatalog",
      value: function getCatalog(section) {
        if (section === '={$sectionId}' || section === 'selectActions:') {
          return null;
        }
        return this.cache.remember(section, function () {
          var matchRes;
          var id;
          var type;
          matchRes = section.match(this.matchers.catalog);
          if (matchRes === null) {
            matchRes = section.match(this.matchers.element);
            if (matchRes !== null) {
              type = 'Element';
            }
          } else {
            type = 'Section';
          }
          if (matchRes) {
            id = matchRes[1];
          }
          var requestBody = null;
          if (type === 'Section') {
            requestBody = {
              sectionId: id
            };
          }
          if (type === 'Element') {
            requestBody = {
              elementId: id
            };
          }
          if (requestBody === null) {
            return null;
          }
          var action = 'Utils::getCatalog' + type;
          return BX.Landing.Backend.getInstance().action(action, requestBody);
        }.bind(this));
      }

      /**
       * Gets disk file data.
       * @param {string} diskFile
       */
    }, {
      key: "getDiskFileData",
      value: function getDiskFileData(diskFile) {
        return this.cache.remember(diskFile, function () {
          var fileId = diskFile.replace("file:", "").replace("#diskFile", "");
          return BX.Landing.Backend.getInstance().action("Block::getFileDisk", {
            fileId: fileId
          }).then(function (result) {
            if (result) {
              return {
                type: LinkUrl.TYPE_DISK_FILE,
                id: result.ID,
                name: result.NAME
              };
            }
            return null;
          }.bind(this));
        }.bind(this));
      }

      /**
       * Gets user data.
       * @param {string} userData
       */
    }, {
      key: "getUserData",
      value: function getUserData(userData) {
        var userId = userData.replace("user:", "").replace("#user", "");
        return new Promise(function (resolve) {
          BX.ajax({
            url: '/bitrix/services/main/ajax.php?action=landing.api.user.getUserNameById',
            method: 'POST',
            dataType: 'json',
            data: {
              userId: userId
            },
            onsuccess: function onsuccess(result) {
              var response = {
                type: LinkUrl.TYPE_USER,
                id: userId,
                name: result.data
              };
              resolve(response);
            }
          });
        }.bind(this));
      }
    }, {
      key: "deleteTypeHref",
      value: function deleteTypeHref() {
        this.gridCenterCell.hidden = true;
        this.gridRightCell.hidden = true;
        this.setHrefTypeSwitcherValue(LinkUrl.TYPE_HREF_START);
        this.setHrefPlaceholderByType(LinkUrl.TYPE_HREF_START);
        this.emit('deleteAction');
      }
    }, {
      key: "onSelectButtonClick",
      value: function onSelectButtonClick() {
        if (this.allowedTypes.length === 1) {
          this.onListShow(this.allowedTypes[0]);
        }
      }
    }, {
      key: "onListShow",
      value: function onListShow(options, type) {
        if (this.popup) {
          this.popup.close();
        }
        if (type === LinkUrl.TYPE_CATALOG_SECTION || type === LinkUrl.TYPE_CATALOG) {
          var iblocks = this.iblocks;
          if (!main_core.Type.isArray(iblocks)) {
            iblocks = BX.Landing.Main.getInstance().options.iblocks;
          }
          void BX.Landing.UI.Panel.Catalog.getInstance().show(iblocks, this.allowedCatalogEntityTypes).then(this.onListItemClick);
          return;
        }
        options.enableAreas = this.enableAreas;
        options.dynamicMode = true;
        options.currentPageOnly = this.currentPageOnly;
        options.panelTitle = this.panelTitle;
        if (this.detailPageMode) {
          options.source = this.sourceField.getValue().source;
          void BX.Landing.UI.Panel.DetailPage.getInstance().show(options).then(this.onListItemClick);
        } else {
          var panel = BX.Landing.UI.Panel.URLList.getInstance();
          void panel.show(type, options).then(this.onListItemClick);
        }
      }
    }, {
      key: "onDiskFileShow",
      value: function onDiskFileShow() {
        var _this2 = this;
        if (this.popup) {
          this.popup.close();
        }
        parent.BX.Landing.Connector.Disk.openDialog({
          onSelect: function onSelect(fileId) {
            _this2.getDiskFileData("#diskFile" + fileId).then(function (data) {
              this.setValue(this.createPlaceholder(data), true);
            }.bind(_this2));
            _this2.setHrefTypeSwitcherValue(LinkUrl.TYPE_HREF_FILE);
          }
        });
      }
    }, {
      key: "onUserListShow",
      value: function onUserListShow() {
        this.dialog = new ui_entitySelector.Dialog({
          targetNode: this.input,
          enableSearch: true,
          context: 'MY_MODULE_CONTEXT',
          entities: [{
            id: LinkUrl.TYPE_USER
          }, {
            id: 'department'
          }],
          events: {
            'Item:onSelect': this.onSelectUser.bind(this)
          },
          multiple: false,
          popupOptions: {
            targetContainer: parent.document.body
          }
        });
        this.dialog.show();
      }
    }, {
      key: "onSelectUser",
      value: function onSelectUser() {
        var selectedItem = this.dialog.getSelectedItems()[0];
        var item = {
          'name': selectedItem.title.text,
          'type': LinkUrl.TYPE_USER,
          'id': selectedItem.id
        };
        this.setValue(this.createPlaceholder(item));
        BX.Landing.Utils.fireEvent(this.layout, "input");
        this.setHrefTypeSwitcherValue(item.type + ':');
      }

      /**
       * Checks that edit mode is prevented
       * @return {boolean}
       */
    }, {
      key: "isEditPrevented",
      value: function isEditPrevented() {
        if (!main_core.Type.isBoolean(this.editPrevented)) {
          this.editPrevented = this.containsPlaceholder();
        }
        return this.editPrevented;
      }

      /**
       * Sets edit prevented value
       * @param {boolean} value
       */
    }, {
      key: "setEditPrevented",
      value: function setEditPrevented(value) {
        this.editPrevented = value;
      }

      /**
       * Enables edit
       */
    }, {
      key: "enableEdit",
      value: function enableEdit() {
        if (!this.isEditPrevented()) {
          BX.Landing.UI.Field.Text.prototype.enableEdit.apply(this);
        }
      }

      /**
       * Creates internal url placeholder
       * @param {{[type]: string, [id]: string|number, name: string, [url]: string, [image]: string, [subType]: string, [chain]: string[]}} options
       * @returns {Element}
       */
    }, {
      key: "createPlaceholder",
      value: function createPlaceholder(options) {
        main_core.Dom.addClass(this.gridCenterCell, "--not-empty");
        if (main_core.Type.isString(options)) {
          return options;
        }
        var placeholder = main_core.Tag.render(_templateObject2 || (_templateObject2 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<span class=\"landing-ui-field-url-placeholder\">\n\t\t\t\t<span class=\"landing-ui-field-url-placeholder-preview\"></span>\n\t\t\t\t<span class=\"landing-ui-field-url-placeholder-text\">\n\t\t\t\t\t", "\n\t\t\t\t</span>\n\t\t\t\t<button\n\t\t\t\t\ttype=\"button\"\n\t\t\t\t\tclass=\"landing-ui-field-url-placeholder-delete\"\n\t\t\t\t\taria-label=\"", "\"\n\t\t\t\t></button>\n\t\t\t</span>\n\t\t"], ["\n\t\t\t<span class=\\\"landing-ui-field-url-placeholder\\\">\n\t\t\t\t<span class=\\\"landing-ui-field-url-placeholder-preview\\\"></span>\n\t\t\t\t<span class=\\\"landing-ui-field-url-placeholder-text\\\">\n\t\t\t\t\t", "\n\t\t\t\t</span>\n\t\t\t\t<button\n\t\t\t\t\ttype=\\\"button\\\"\n\t\t\t\t\tclass=\\\"landing-ui-field-url-placeholder-delete\\\"\n\t\t\t\t\taria-label=\\\"", "\\\"\n\t\t\t\t></button>\n\t\t\t</span>\n\t\t"])), BX.Landing.Utils.encodeDataValue(options.name), BX.Text.encode(BX.Landing.Loc.getMessage('LANDING_LINK_URL_PLACEHOLDER_DELETE')));
        var placeholderRemove = placeholder.querySelector("[class*=\"delete\"]");
        main_core.Event.bind(placeholderRemove, "click", this.onPlaceholderRemoveClick.bind(this));
        if (options.type === LinkUrl.TYPE_CATALOG) {
          options.chain.push(options.name);
          var title = BX.Landing.Utils.join(options.name, "\n", options.chain.join(' / '));
          main_core.Dom.attr(placeholder, {
            "data-dynamic": {
              type: BX.Landing.Utils.join(LinkUrl.TYPE_CATALOG, BX.Landing.Utils.capitalize(options.subType)),
              value: options.id
            },
            "data-placeholder": BX.Landing.Utils.join("#", options.type, BX.Landing.Utils.capitalize(options.subType), options.id),
            "data-url": BX.Landing.Utils.join("#", options.type, BX.Landing.Utils.capitalize(options.subType), options.id)
          });
          placeholder.setAttribute("title", title);
          return placeholder;
        }
        BX.Landing.Utils.attr(placeholder, {
          "data-placeholder": BX.Landing.Utils.join("#", options.type, options.id),
          "data-url": BX.Landing.Utils.join("#", options.type, options.id)
        });
        placeholder.setAttribute("title", options.name);
        return placeholder;
      }

      /**
       * Handles click event on placeholder remove button
       * @param event
       */
    }, {
      key: "onPlaceholderRemoveClick",
      value: function onPlaceholderRemoveClick(event) {
        main_core.Dom.removeClass(this.gridCenterCell, "--not-empty");
        this.setEditPrevented(false);
        this.enableEdit();
        main_core.Dom.remove(event.target.parentNode);
        this.setValue("");
        BX.Landing.Utils.fireEvent(this.layout, "input");
        this.onInputHandler(this.input.innerText);
        this.input.focus();
      }

      /**
       * Handles click event on catalog panel item
       * @param {object} item
       */
    }, {
      key: "onListItemClick",
      value: function onListItemClick(item) {
        var resultPromise = Promise.resolve(item);
        if (item.type === "block") {
          resultPromise = this.getBlockData("#block" + item.id);
        }
        resultPromise.then(function (item) {
          this.setValue(this.createPlaceholder(item));
          BX.Landing.Utils.fireEvent(this.layout, "input");
          this.setHrefTypeSwitcherValue(item.type + ':');
        }.bind(this));
      }
    }, {
      key: "getNewLabel",
      value: function getNewLabel() {
        if (!this.newLabel) {
          this.newLabel = main_core.Dom.create({
            tag: 'div',
            props: {
              className: 'landing-ui-field-link-new-label'
            },
            text: BX.Landing.Loc.getMessage('LANDING_LINK_NEW_PAGE_LABEL')
          });
        }
        return this.newLabel;
      }
    }, {
      key: "showNewLabel",
      value: function showNewLabel() {
        BX.Dom.style(this.gridCenterCell, {
          position: 'relative',
          overflow: 'visible'
        });
        BX.Dom.append(this.getNewLabel(), this.gridCenterCell);
      }
    }, {
      key: "hideNewLabel",
      value: function hideNewLabel() {
        BX.Dom.style(this.gridCenterCell, 'overflow', null);
        BX.Dom.remove(this.getNewLabel());
      }

      /**
       * Sets value
       * @param {object|string} value
       * @param {boolean} [preventEvent] - Prevents onChange event
       */
    }, {
      key: "setValue",
      value: function setValue(value, preventEvent) {
        if (main_core.Type.isObject(value) && !main_core.Type.isNil(value)) {
          this.disableEdit();
          this.setEditPrevented(true);
          this.input.innerHTML = "";
          main_core.Dom.append(value, this.input);
          var dataSet = value['dataset'];
          this.value = dataSet.placeholder;
          this.dynamic = dataSet.dynamic;
          if (this.value === '#landing0') {
            this.showNewLabel();
          } else {
            this.hideNewLabel();
          }
          if (!preventEvent) {
            this.onInputHandler(this.input.innerText);
          }
        } else if (!main_core.Type.isNil(value)) {
          this.setEditPrevented(false);
          this.input.innerText = this.getInputInnerText(value);
          this.value = null;
          this.dynamic = null;
          this.hideNewLabel();
        }
        if (!preventEvent) {
          if (main_core.Type.isString(this.value)) {
            this.getPlaceholderData(this.value).then(function (data) {
              this.onValueChangeHandler(data);
            }.bind(this)).catch(function () {});
            return;
          }
          this.onValueChangeHandler(null);
        }
      }

      /**
       * Gets dynamic data
       * @return {?object}
       */
    }, {
      key: "getDynamic",
      value: function getDynamic() {
        return this.dynamic;
      }

      /**
       * Gets value
       * @return {string}
       */
    }, {
      key: "getValue",
      value: function getValue() {
        var valueText = this.value ? this.value : this.input.innerText;
        var selectedHrefType = this.getSelectedHrefType();
        this.validateValue(valueText);
        this.prepareInputField(this.hrefTypeSwithcer.getValue(), valueText);
        if (valueText === '') {
          if (selectedHrefType === 'catalog' || selectedHrefType === 'landing') {
            return '';
          }
          return LinkUrl.TYPE_HREF_START;
        }
        if (selectedHrefType === LinkUrl.TYPE_HREF_SKYPE && !valueText.includes(this.typePostfix.skype)) {
          valueText = valueText + this.typePostfix.skype;
        }
        if (valueText.startsWith(selectedHrefType)) {
          return valueText;
        }
        if (!main_core.Type.isUndefined(this.constantType)) {
          if (this.constantType === LinkUrl.TYPE_CATALOG) {
            if (this.matchers.catalogElement.test(valueText) || this.matchers.catalogSection.test(valueText) || this.matchers.catalog.test(valueText) || this.matchers.element.test(valueText)) {
              return valueText;
            }
            return '';
          }
          if (this.constantType === LinkUrl.TYPE_PAGE) {
            return LinkUrl.TYPE_HREF_PAGE + valueText;
          }
        }
        return selectedHrefType + valueText;
      }

      /**
       * Gets value text
       * @return {string}
       */
    }, {
      key: "getValueText",
      value: function getValueText() {
        return this.value ? this.value : this.input.innerText;
      }
    }, {
      key: "validateValue",
      value: function validateValue(value) {
        if (value.indexOf(':') !== -1) {
          value = value.slice(value.indexOf(':') + 1);
        }
        var setRegs = [];
        setRegs['phoneExtended'] = /(^[\d+][\d-\s]{3,25}\d$)|#crmPhone\d+/;
        setRegs['phone'] = /^[\d+][\d-\s]{3,25}\d$/;
        setRegs['mail'] = /^\S+@\S+[.]\S+$/i;
        setRegs['skype'] = /^[a-z\d-.:]{6,32}$/i;
        var type = this.hrefTypeSwithcer.getValue();
        var data = this.getTypeData(type);
        var readyToSave = true;
        if (data.needValidate) {
          var reg;
          switch (type) {
            case LinkUrl.TYPE_HREF_TEL:
              reg = setRegs['phoneExtended'];
              break;
            case LinkUrl.TYPE_HREF_SMS:
              reg = setRegs['phone'];
              break;
            case LinkUrl.TYPE_HREF_MAILTO:
              reg = setRegs['mail'];
              break;
            case LinkUrl.TYPE_HREF_SKYPE:
              reg = setRegs['skype'];
              break;
          }
          if (reg) {
            if (value.length > 0) {
              var isValid = reg.test(value);
              if (isValid) {
                main_core.Dom.removeClass(this.gridCenterCell, "--validate-incorrect");
                main_core.Dom.addClass(this.gridCenterCell, "--validate-correct");
              } else {
                main_core.Dom.removeClass(this.gridCenterCell, "--validate-correct");
                main_core.Dom.addClass(this.gridCenterCell, "--validate-incorrect");
                readyToSave = false;
              }
            } else {
              main_core.Dom.removeClass(this.gridCenterCell, "--validate-correct");
              main_core.Dom.removeClass(this.gridCenterCell, "--validate-incorrect");
            }
          }
        } else {
          main_core.Dom.removeClass(this.gridCenterCell, "--validate-correct");
          main_core.Dom.removeClass(this.gridCenterCell, "--validate-incorrect");
        }
        this.emit('readyToSave', {
          readyToSave: readyToSave
        });
      }
    }, {
      key: "prepareInputField",
      value: function prepareInputField(hrefType, inputValue) {
        //if empty field
        var allowedHrefTypes = [LinkUrl.TYPE_HREF_PAGE, LinkUrl.TYPE_HREF_BLOCK, LinkUrl.TYPE_HREF_CRM_FORM, LinkUrl.TYPE_HREF_FILE, LinkUrl.TYPE_HREF_USER, LinkUrl.TYPE_HREF_PRODUCT, LinkUrl.TYPE_CATALOG, LinkUrl.TYPE_PAGE];
        if (inputValue === '' && allowedHrefTypes.includes(hrefType)) {
          main_core.Dom.addClass(this.input, "landing-ui-field-input-empty");
        } else {
          main_core.Dom.removeClass(this.input, "landing-ui-field-input-empty");
        }
      }
    }, {
      key: "getInputInnerText",
      value: function getInputInnerText(value) {
        return this.prepareInputInnerText(value.toString().trim());
      }
    }, {
      key: "prepareInputInnerText",
      value: function prepareInputInnerText(value) {
        if (this.getSelectedHrefType() === LinkUrl.TYPE_HREF_SKYPE && value.includes(this.typePostfix.skype)) {
          value = value.replace(this.typePostfix.skype, '');
        }
        return value;
      }
    }]);
  }(landing_ui_field_textfield.Text);
  babelHelpers.defineProperty(LinkUrl, "TYPE_BLOCK", "block");
  babelHelpers.defineProperty(LinkUrl, "TYPE_PAGE", "landing");
  babelHelpers.defineProperty(LinkUrl, "TYPE_CRM_FORM", "crmFormPopup");
  babelHelpers.defineProperty(LinkUrl, "TYPE_CRM_PHONE", "crmPhone");
  babelHelpers.defineProperty(LinkUrl, "TYPE_SYSTEM", "system");
  babelHelpers.defineProperty(LinkUrl, "TYPE_CATALOG", "catalog");
  babelHelpers.defineProperty(LinkUrl, "TYPE_CATALOG_ELEMENT", "element");
  babelHelpers.defineProperty(LinkUrl, "TYPE_CATALOG_SECTION", "section");
  babelHelpers.defineProperty(LinkUrl, "TYPE_DISK_FILE", "diskFile");
  babelHelpers.defineProperty(LinkUrl, "TYPE_USER", "user");
  babelHelpers.defineProperty(LinkUrl, "TYPE_HREF_START", "selectActions:");
  babelHelpers.defineProperty(LinkUrl, "TYPE_HREF_PAGE", "page:");
  babelHelpers.defineProperty(LinkUrl, "TYPE_HREF_BLOCK", "block:");
  babelHelpers.defineProperty(LinkUrl, "TYPE_HREF_CRM_FORM", "form:");
  babelHelpers.defineProperty(LinkUrl, "TYPE_HREF_PRODUCT", "product:");
  babelHelpers.defineProperty(LinkUrl, "TYPE_HREF_TEL", "tel:");
  babelHelpers.defineProperty(LinkUrl, "TYPE_HREF_SMS", "sms:");
  babelHelpers.defineProperty(LinkUrl, "TYPE_HREF_MAILTO", "mailto:");
  babelHelpers.defineProperty(LinkUrl, "TYPE_HREF_SKYPE", "skype:");
  babelHelpers.defineProperty(LinkUrl, "TYPE_HREF_LINK", "");
  babelHelpers.defineProperty(LinkUrl, "TYPE_HREF_FILE", "file:");
  babelHelpers.defineProperty(LinkUrl, "TYPE_HREF_USER", "user:");
  babelHelpers.defineProperty(LinkUrl, "DELETE_TYPE_HREF", "deleteTypeHref");
  exports.LinkUrl = LinkUrl;
})(this.BX.Landing.UI.Field = this.BX.Landing.UI.Field || {}, BX.Landing.UI.Field, BX, BX.UI.EntitySelector);
//# sourceMappingURL=linkurl.bundle.js.map
