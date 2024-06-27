/* eslint-disable */
this.BX = this.BX || {};
this.BX.MyWebstor = this.BX.MyWebstor || {};
(function (exports,main_core,main_core_events) {
    'use strict';

    function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
    function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { babelHelpers.defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
    var LazyLoader = /*#__PURE__*/function () {
      function LazyLoader(id, settings) {
        babelHelpers.classCallCheck(this, LazyLoader);
        this.id = main_core.Type.isStringFilled(id) ? id : main_core.Text.getRandom();
        this.settings = main_core.Type.isObjectLike(settings) ? settings : {};
        this.container = this.settings.container;
        if (!this.container) {
          throw "Error: Could not find container.";
        }
        this.serviceUrl = this.settings.serviceUrl || "";
        if (!main_core.Type.isStringFilled(this.serviceUrl)) {
          throw "Error. Could not find service url.";
        }
        this.tabId = this.settings.tabId || "";
        if (!main_core.Type.isStringFilled(this.tabId)) {
          throw "Error: Could not find tab id.";
        }
        this.params = main_core.Type.isObjectLike(this.settings.componentData) ? this.settings.componentData : {};
        this.isRequestRunning = false;
        this.loaded = false;
      }
      babelHelpers.createClass(LazyLoader, [{
        key: "isLoaded",
        value: function isLoaded() {
          return this.loaded;
        }
      }, {
        key: "load",
        value: function load() {
          if (!this.isLoaded()) {
            this.startRequest(_objectSpread(_objectSpread({}, this.params), {
              TABID: this.tabId
            }));
          }
        }
      }, {
        key: "startRequest",
        value: function startRequest(params) {
          if (this.isRequestRunning) {
            return false;
          }
          this.isRequestRunning = true;
          BX.ajax({
            url: this.serviceUrl,
            method: "POST",
            dataType: "html",
            data: {
              LOADERID: this.id,
              PARAMS: params
            },
            onsuccess: this.onRequestSuccess.bind(this),
            onfailure: this.onRequestFailure.bind(this)
          });
          return true;
        }
      }, {
        key: "onRequestSuccess",
        value: function onRequestSuccess(data) {
          this.isRequestRunning = false;
          this.container.innerHTML = data;
          this.loaded = true;
        }
      }, {
        key: "onRequestFailure",
        value: function onRequestFailure() {
          this.isRequestRunning = false;
          this.loaded = true;
        }
      }]);
      return LazyLoader;
    }();

    function ownKeys$1(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
    function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$1(Object(source), !0).forEach(function (key) { babelHelpers.defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$1(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
    var Tab = /*#__PURE__*/function () {
      function Tab(id, settings) {
        babelHelpers.classCallCheck(this, Tab);
        this.id = main_core.Type.isStringFilled(id) ? id : main_core.Text.getRandom();
        this.settings = main_core.Type.isObjectLike(settings) ? settings : {};
        this.data = main_core.Type.isObjectLike(this.settings.data) ? this.settings.data : {};
        this.manager = settings.manager || null;
        this.container = this.settings.container;
        this.menuContainer = this.settings.menuContainer;
        this.active = main_core.Type.isBoolean(this.data.active) ? this.data.active : false;
        this.enabled = main_core.Type.isBoolean(this.data.enabled) ? this.data.enabled : true;
        main_core.Event.bind(this.menuContainer.querySelector("a.catalog-entity-section-tab-link"), "click", this.onMenuClick.bind(this));
        this.loader = null;
        if (main_core.Type.isObjectLike(this.data.loader)) {
          this.loader = new LazyLoader(this.id, _objectSpread$1(_objectSpread$1({}, this.data.loader), {
            tabId: this.id,
            container: this.container
          }));
        }
      }
      babelHelpers.createClass(Tab, [{
        key: "getId",
        value: function getId() {
          return this.id;
        }
      }, {
        key: "isEnabled",
        value: function isEnabled() {
          return this.enabled;
        }
      }, {
        key: "isActive",
        value: function isActive() {
          return this.active;
        }
      }, {
        key: "setActive",
        value: function setActive(active) {
          active = !!active;
          if (this.isActive() === active) {
            return;
          }
          this.active = active;
          if (this.isActive()) {
            this.showTab();
          } else {
            this.hideTab();
          }
        }
      }, {
        key: "showTab",
        value: function showTab() {
          var _this = this;
          main_core.Dom.addClass(this.container, "catalog-entity-section-tab-content-show");
          main_core.Dom.removeClass(this.container, "catalog-entity-section-tab-content-hide");
          main_core.Dom.addClass(this.menuContainer, "catalog-entity-section-tab-current");
          this.container.style.display = "";
          this.container.style.position = "absolute";
          this.container.style.top = 0;
          this.container.style.left = 0;
          this.container.style.width = "100%";
          new BX.easing({
            duration: 350,
            start: {
              opacity: 0,
              translateX: 100
            },
            finish: {
              opacity: 100,
              translateX: 0
            },
            transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
            step: function step(state) {
              _this.container.style.opacity = state.opacity / 100;
              _this.container.style.transform = "translateX(" + state.translateX + "%)";
            },
            complete: function complete() {
              main_core.Dom.removeClass(_this.container, "catalog-entity-section-tab-content-show");
              _this.container.style.cssText = "";
              BX.onCustomEvent(window, "onEntityDetailsTabShow", [_this]);
            }
          }).animate();
        }
      }, {
        key: "hideTab",
        value: function hideTab() {
          var _this2 = this;
          main_core.Dom.addClass(this.container, "catalog-entity-section-tab-content-hide");
          main_core.Dom.removeClass(this.container, "catalog-entity-section-tab-content-show");
          main_core.Dom.removeClass(this.menuContainer, "catalog-entity-section-tab-current");
          new BX.easing({
            duration: 350,
            start: {
              opacity: 100
            },
            finish: {
              opacity: 0
            },
            transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
            step: function step(state) {
              _this2.container.style.opacity = state.opacity / 100;
            },
            complete: function complete() {
              _this2.container.style.display = "none";
              _this2.container.style.transform = "translateX(100%)";
              _this2.container.style.opacity = 0;
            }
          }).animate();
        }
      }, {
        key: "onMenuClick",
        value: function onMenuClick(event) {
          if (this.isEnabled()) {
            if (this.loader && !this.loader.isLoaded()) {
              this.loader.load();
            }
            this.manager.selectItem(this);
          }
          event.preventDefault();
        }
      }]);
      return Tab;
    }();

    var TabManager = /*#__PURE__*/function () {
      function TabManager(id, settings) {
        var _this = this;
        babelHelpers.classCallCheck(this, TabManager);
        this.id = main_core.Type.isStringFilled(id) ? id : main_core.Text.getRandom();
        this.settings = main_core.Type.isObjectLike(settings) ? settings : {};
        this.container = this.settings.container;
        this.menuContainer = this.settings.menuContainer;
        this.items = [];
        if (main_core.Type.isArray(this.settings.data)) {
          this.settings.data.forEach(function (item) {
            _this.items.push(new Tab(item.id, {
              manager: _this,
              data: item,
              container: _this.container.querySelector('[data-tab-id="' + item.id + '"]'),
              menuContainer: _this.menuContainer.querySelector('[data-tab-id="' + item.id + '"]')
            }));
          });
        }
        main_core_events.EventEmitter.subscribe("BX.MyWebstor.HMS.TabManager:onOpenTab", function (event) {
          var tabId = event.data.tabId;
          var item = _this.findItemById(tabId);
          if (item) {
            _this.selectItem(item);
          }
        });
        var activeItem = this.items.find(function (item) {
          return item.isActive();
        });
        if (activeItem) {
          if (activeItem.loader && !activeItem.loader.isLoaded()) activeItem.loader.load();
          activeItem.active = false;
          this.selectItem(activeItem);
        }
      }
      babelHelpers.createClass(TabManager, [{
        key: "findItemById",
        value: function findItemById(id) {
          return this.items.find(function (item) {
            return item.id === id;
          }) || null;
        }
      }, {
        key: "selectItem",
        value: function selectItem(item) {
          main_core_events.EventEmitter.emit("BX.MyWebstor.HMS.TabManager:onSelectItem", {
            tabId: item.id
          });
          this.items.forEach(function (current) {
            return current.setActive(current === item);
          });
        }
      }]);
      return TabManager;
    }();

    exports.TabManager = TabManager;

}((this.BX.MyWebstor.HMS = this.BX.MyWebstor.HMS || {}),BX,BX.Event));
