/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, intranet_widgetLoader) {
	'use strict';

	function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
	function _classPrivateFieldInitSpec(e, t, a) { _checkPrivateRedeclaration(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldGet(s, a) { return s.get(_assertClassBrand(s, a)); }
	function _classPrivateFieldSet(s, a, r) { return s.set(_assertClassBrand(s, a), r), r; }
	function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	var _widgetLoader = /*#__PURE__*/new WeakMap();
	var _isBitrix = /*#__PURE__*/new WeakMap();
	var _isAdmin = /*#__PURE__*/new WeakMap();
	var _isRequisite = /*#__PURE__*/new WeakMap();
	var _isMainPageAvailable = /*#__PURE__*/new WeakMap();
	var _node = /*#__PURE__*/new WeakMap();
	var _SettingsWidgetLoader_brand = /*#__PURE__*/new WeakSet();
	class SettingsWidgetLoader {
	  constructor(params) {
	    _classPrivateMethodInitSpec(this, _SettingsWidgetLoader_brand);
	    _classPrivateFieldInitSpec(this, _widgetLoader, void 0);
	    _classPrivateFieldInitSpec(this, _isBitrix, false);
	    _classPrivateFieldInitSpec(this, _isAdmin, false);
	    _classPrivateFieldInitSpec(this, _isRequisite, false);
	    _classPrivateFieldInitSpec(this, _isMainPageAvailable, false);
	    _classPrivateFieldInitSpec(this, _node, false);
	    _classPrivateFieldSet(_isBitrix, this, params['isBitrix24']);
	    _classPrivateFieldSet(_isAdmin, this, params['isAdmin']);
	    _classPrivateFieldSet(_isRequisite, this, params['isRequisite']);
	    _classPrivateFieldSet(_isMainPageAvailable, this, params['isMainPageAvailable']);
	  }
	  showOnce(node) {
	    _classPrivateFieldSet(_node, this, node);
	    const popup = _assertClassBrand(_SettingsWidgetLoader_brand, this, _getWidgetLoader).call(this).getPopup();
	    popup.show();
	    const popupContainer = popup.getPopupContainer();
	    if (popupContainer.getBoundingClientRect().left < 30) {
	      popupContainer.style.left = '30px';
	    }
	    (typeof BX.Intranet.SettingsWidget !== 'undefined' ? Promise.resolve() : _assertClassBrand(_SettingsWidgetLoader_brand, this, _load).call(this)).then(() => {
	      if (typeof BX.Intranet.SettingsWidget !== 'undefined') {
	        BX.Intranet.SettingsWidget.bindAndShow(node);
	      }
	    });
	  }
	  static init(options) {
	    if (!_assertClassBrand(SettingsWidgetLoader, this, _instance)._) {
	      _instance._ = _assertClassBrand(SettingsWidgetLoader, this, new this(options));
	    }
	    return _assertClassBrand(SettingsWidgetLoader, this, _instance)._;
	  }
	}
	function _getWidgetLoader() {
	  if (_classPrivateFieldGet(_widgetLoader, this)) {
	    return _classPrivateFieldGet(_widgetLoader, this);
	  }
	  const widgetLoader = new intranet_widgetLoader.WidgetLoader({
	    id: "bx-settings-header-popup",
	    bindElement: _classPrivateFieldGet(_node, this),
	    width: 374
	  });
	  widgetLoader.addHeaderSkeleton();
	  if (_classPrivateFieldGet(_isRequisite, this)) {
	    widgetLoader.addItemSkeleton(22);
	  }
	  if (_classPrivateFieldGet(_isMainPageAvailable, this)) {
	    widgetLoader.addItemSkeleton(22);
	  }
	  if (_classPrivateFieldGet(_isAdmin, this)) {
	    widgetLoader.addSplitItemSkeleton(22);
	  }
	  if (_classPrivateFieldGet(_isBitrix, this)) {
	    widgetLoader.addItemSkeleton(22);
	  }
	  widgetLoader.addItemSkeleton(22);
	  widgetLoader.addFooterSkeleton();
	  _classPrivateFieldSet(_widgetLoader, this, widgetLoader);
	  return _classPrivateFieldGet(_widgetLoader, this);
	}
	function _load() {
	  return new Promise(resolve => {
	    main_core.ajax.runComponentAction('bitrix:intranet.settings.widget', 'getWidgetComponent', {
	      mode: 'class'
	    }).then(response => {
	      return new Promise(resolve => {
	        const loadCss = response.data.assets ? response.data.assets.css : [];
	        const loadJs = response.data.assets ? response.data.assets.js : [];
	        BX.load(loadCss, () => {
	          BX.loadScript(loadJs, () => {
	            main_core.Runtime.html(null, response.data.html).then(resolve);
	          });
	        });
	      });
	    }).then(() => {
	      if (typeof BX.Intranet.SettingsWidget !== 'undefined') {
	        setTimeout(() => {
	          BX.Intranet.SettingsWidget.bindWidget(_assertClassBrand(_SettingsWidgetLoader_brand, this, _getWidgetLoader).call(this));
	          resolve();
	        }, 0);
	      }
	    });
	  });
	}
	var _instance = {
	  _: void 0
	};

	exports.SettingsWidgetLoader = SettingsWidgetLoader;

})(this.BX.Intranet = this.BX.Intranet || {}, BX, BX.Intranet);
//# sourceMappingURL=script.js.map
