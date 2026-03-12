/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.UI = this.BX.Landing.UI || {};
(function (exports,main_core,landing_ui_panel_iconpanel,landing_ui_field_image,landing_ui_card_iconoptionscard) {
	'use strict';

	function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
	function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { babelHelpers.defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

	/**
	 * @memberOf BX.Landing.UI.Field
	 */
	var Icon = /*#__PURE__*/function (_Image) {
	  babelHelpers.inherits(Icon, _Image);
	  function Icon(data) {
	    var _this;
	    babelHelpers.classCallCheck(this, Icon);
	    _this = babelHelpers.possibleConstructorReturn(this, babelHelpers.getPrototypeOf(Icon).call(this, data));
	    _this.uploadButton.layout.innerText = BX.Landing.Loc.getMessage("LANDING_ICONS_FIELD_BUTTON_REPLACE");
	    _this.editButton.layout.hidden = true;
	    _this.clearButton.layout.hidden = true;
	    _this.dropzone.removeEventListener("dragover", _this.onDragOver);
	    _this.dropzone.removeEventListener("dragleave", _this.onDragLeave);
	    _this.dropzone.removeEventListener("drop", _this.onDrop);
	    _this.preview.removeEventListener("dragenter", _this.onImageDragEnter);
	    _this.options = new landing_ui_card_iconoptionscard.IconOptionsCard();
	    main_core.Dom.append(_this.options.getLayout(), _this.right);
	    _this.onOptionClick = _this.onOptionClick.bind(babelHelpers.assertThisInitialized(_this));
	    _this.options.subscribe('onChange', _this.onOptionClick);
	    var sourceClassList = _this.content.classList;
	    var newClassList = [];
	    landing_ui_panel_iconpanel.IconPanel.getLibraries().then(function (libraries) {
	      if (libraries.length === 0) {
	        this.uploadButton.disable();
	      } else {
	        libraries.forEach(function (library) {
	          library.categories.forEach(function (category) {
	            category.items.forEach(function (item) {
	              var itemClasses = '';
	              if (main_core.Type.isObject(item)) {
	                itemClasses = item.options.join(' ');
	              } else {
	                itemClasses = item;
	              }
	              var iconClasses = itemClasses.split(" ");
	              iconClasses.forEach(function (iconClass) {
	                if (sourceClassList.indexOf(iconClass) !== -1 && newClassList.indexOf(iconClass) === -1) {
	                  newClassList.push(iconClass);
	                }
	              });
	            });
	          });
	        });
	        this.icon.innerHTML = "<span class=\"test " + newClassList.join(" ") + "\"></span>";
	      }
	      this.options.setOptionsByItem(newClassList);
	    }.bind(babelHelpers.assertThisInitialized(_this)));
	    return _this;
	  }
	  babelHelpers.createClass(Icon, [{
	    key: "onUploadClick",
	    value: function onUploadClick(event) {
	      var _this2 = this;
	      event.preventDefault();
	      landing_ui_panel_iconpanel.IconPanel.getInstance().show().then(function (result) {
	        _this2.options.setOptions(result.iconOptions, result.iconClassName);
	        _this2.setValue({
	          type: "icon",
	          classList: result.iconClassName.split(" ")
	        });
	      });
	    }
	  }, {
	    key: "onOptionClick",
	    value: function onOptionClick(event) {
	      var classList = event.getData().option.split(' ');
	      this.setValue({
	        type: 'icon',
	        classList: classList
	      });
	    }
	    /**
	     * Checks whether the current value differs from the stored one.
	     *
	     * @returns {boolean} True if the value has changed, false otherwise.
	     */
	  }, {
	    key: "isChanged",
	    value: function isChanged() {
	      var previous = this.prepareValue(this.content);
	      var current = this.prepareValue(this.getValue());
	      return !this.isEqual(previous, current);
	    }
	    /**
	     * Compares two objects by value.
	     * Assumes objects are already normalized.
	     *
	     * @param {Object} a
	     * @param {Object} b
	     * @returns {boolean}
	     */
	  }, {
	    key: "isEqual",
	    value: function isEqual(a, b) {
	      return JSON.stringify(a) === JSON.stringify(b);
	    }
	    /**
	     * Prepares a value for comparison:
	     * - clones the object
	     * - normalizes classList
	     * - normalizes url
	     *
	     * @param {Object} value
	     * @returns {Object}
	     */
	  }, {
	    key: "prepareValue",
	    value: function prepareValue(value) {
	      var prepared = BX.Landing.Utils.clone(value);
	      prepared.classList = this.normalizeClassList(prepared.classList);
	      prepared.url = this.normalizeUrl(prepared.url);
	      return prepared;
	    }
	    /**
	     * Normalizes a CSS class list:
	     * - converts string to array
	     * - ensures array type
	     * - adds selector class if missing
	     * - removes duplicates
	     * - sorts alphabetically
	     *
	     * @param {string|string[]|null|undefined} classList
	     * @returns {string[]}
	     */
	  }, {
	    key: "normalizeClassList",
	    value: function normalizeClassList(classList) {
	      var list = classList;
	      if (main_core.Type.isString(list)) {
	        list = list.split(' ');
	      }
	      if (!Array.isArray(list)) {
	        list = [];
	      }
	      this.addSelectorClass(list);
	      return BX.Landing.Utils.arrayUnique(list).sort();
	    }
	    /**
	     * Adds a class extracted from this.selector into the class list.
	     *
	     * Example:
	     *  ".button@hover" -> "button"
	     *
	     * @param {string[]} classList
	     * @returns {void}
	     */
	  }, {
	    key: "addSelectorClass",
	    value: function addSelectorClass(classList) {
	      if (!this.selector) {
	        return;
	      }
	      var selectorClass = this.selector.split('@')[0].replace('.', '');
	      if (selectorClass && !classList.includes(selectorClass)) {
	        classList.push(selectorClass);
	      }
	    }
	    /**
	     * Normalizes a URL value into a predictable object structure.
	     *
	     * @param {string|Object|null|undefined} url
	     * @returns {Object} Normalized URL object
	     */
	  }, {
	    key: "normalizeUrl",
	    value: function normalizeUrl(url) {
	      var value = url;
	      if (main_core.Type.isString(value)) {
	        value = BX.Landing.Utils.decodeDataValue(value);
	      }
	      if (!main_core.Type.isPlainObject(value)) {
	        return this.getEmptyUrl();
	      }
	      var result = _objectSpread(_objectSpread({}, this.getEmptyUrl()), {}, {
	        enabled: true
	      }, value);
	      if (result.href === '' || result.href === '#') {
	        result.enabled = false;
	      }
	      return result;
	    }
	    /**
	     * Returns an empty (disabled) URL object.
	     *
	     * @returns {{ text: string, href: string, target: string, enabled: boolean }}
	     */
	  }, {
	    key: "getEmptyUrl",
	    value: function getEmptyUrl() {
	      return {
	        text: '',
	        href: '',
	        target: '',
	        enabled: false
	      };
	    }
	  }, {
	    key: "getValue",
	    value: function getValue() {
	      var classList = this.classList;
	      if (this.selector) {
	        var selectorClassname = this.selector.split("@")[0].replace(".", "");
	        classList = main_core.Runtime.clone(this.classList).concat([selectorClassname]);
	        classList = BX.Landing.Utils.arrayUnique(classList);
	      }
	      return {
	        type: "icon",
	        src: "",
	        id: -1,
	        alt: "",
	        classList: classList,
	        url: Object.assign({}, this.url.getValue(), {
	          enabled: true
	        })
	      };
	    }
	  }, {
	    key: "reset",
	    value: function reset() {
	      this.setValue({
	        type: "icon",
	        src: "",
	        id: -1,
	        alt: "",
	        classList: [],
	        url: ''
	      });
	    }
	  }]);
	  return Icon;
	}(landing_ui_field_image.Image);

	exports.Icon = Icon;

}((this.BX.Landing.UI.Field = this.BX.Landing.UI.Field || {}),BX,BX.Landing.UI.Panel,BX.Landing.UI.Field,BX.Landing.UI.Card));
//# sourceMappingURL=icon.bundle.js.map
