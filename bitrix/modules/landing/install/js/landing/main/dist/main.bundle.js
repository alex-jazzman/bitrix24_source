/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, landing_env, landing_loc, landing_ui_a11y, landing_ui_panel_content, landing_ui_panel_saveblock, landing_ui_panel_floatingnodepanel, landing_sliderhacks, landing_pageobject, landing_backend) {
  'use strict';
  var _templateObject, _templateObject2, _templateObject3, _templateObject4;
  function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
  function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
  function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
  function _classPrivateFieldInitSpec(e, t, a) { _checkPrivateRedeclaration(e, t), t.set(e, a); }
  function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
  function _classPrivateFieldGet(s, a) { return s.get(_assertClassBrand(s, a)); }
  function _classPrivateFieldSet(s, a, r) { return s.set(_assertClassBrand(s, a), r), r; }
  function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }

  var _postMessages = /*#__PURE__*/new WeakMap();
  var _currentMobileTop = /*#__PURE__*/new WeakMap();
  var _mouseEntered = /*#__PURE__*/new WeakMap();
  var _disableControls = /*#__PURE__*/new WeakMap();
  var _currentMousePosition = /*#__PURE__*/new WeakMap();
  var _blocksMobileTops = /*#__PURE__*/new WeakMap();
  var _ExternalControls_brand = /*#__PURE__*/new WeakSet();
  var ExternalControls = /*#__PURE__*/function () {
    function ExternalControls() {
      babelHelpers.classCallCheck(this, ExternalControls);
      /**
       * Registers all required listeners.
       */
      _classPrivateMethodInitSpec(this, _ExternalControls_brand);
      _classPrivateFieldInitSpec(this, _postMessages, {
        mode: 'mode',
        register: 'register',
        changeState: 'changestate',
        editorEnable: 'editorenable',
        showControls: 'showcontrols',
        showBlockControls: 'showblockcontrols',
        hideAll: 'hideall',
        backendAction: 'backendaction'
      });
      _classPrivateFieldInitSpec(this, _currentMobileTop, -1);
      _classPrivateFieldInitSpec(this, _mouseEntered, false);
      _classPrivateFieldInitSpec(this, _disableControls, false);
      _classPrivateFieldInitSpec(this, _currentMousePosition, 0);
      _classPrivateFieldInitSpec(this, _blocksMobileTops, []);
      if (Main.isExternalControlsEnabled() && landing_env.Env.getInstance().isBlockControlsEnabled()) {
        _assertClassBrand(_ExternalControls_brand, this, _registerListeners).call(this);
      }
    }
    return babelHelpers.createClass(ExternalControls, [{
      key: "onBackendAction",
      value:
      /**
       * Invokes when backend action occurred.
       */
      function onBackendAction(action, data) {
        _classPrivateFieldSet(_disableControls, this, false);
        this.postExternalCommand(_classPrivateFieldGet(_postMessages, this).backendAction, {
          action: action,
          data: data
        });
      }

      /**
       * Creates and returns Block object for sending to external window.
       *
       * @param {BX.Landing.} block
       * @return {Block}
       */
    }, {
      key: "isControlsExternal",
      value:
      /**
       * Checks that landing controls is external
       *
       * @return {boolean}
       */
      function isControlsExternal() {
        return main_core.Dom.hasClass(document.body, 'landing-ui-external-controls');
      }

      /**
       * Recalculates block tops.
       *
       * @param {boolean} resetMobileTop
       */
    }, {
      key: "recalculateTops",
      value: function recalculateTops(resetMobileTop) {
        var _this = this;
        _classPrivateFieldSet(_blocksMobileTops, this, []);
        if (resetMobileTop) {
          _classPrivateFieldSet(_currentMobileTop, this, -1);
        }
        babelHelpers.toConsumableArray(document.body.querySelectorAll('.block-wrapper')).map(function (block) {
          var blockRect = block.getBoundingClientRect();
          if (blockRect.height > 1)
            // hidden on mobile blocks
            {
              _classPrivateFieldGet(_blocksMobileTops, _this).push({
                blockId: parseInt(block.getAttribute('data-id')),
                top: blockRect.top,
                height: blockRect.height
              });
            }
        });
        this.onMobileMouseMove(_classPrivateFieldGet(_currentMousePosition, this));
      }

      /**
       * Recalculates block tops only if external controls are enabled.
       *
       * @param {boolean} resetMobileTop
       */
    }, {
      key: "recalculateTopsIfExternals",
      value: function recalculateTopsIfExternals(resetMobileTop) {
        if (this.isControlsExternal()) {
          this.recalculateTops(resetMobileTop);
        }
      }

      /**
       * Call when user moves mouse over the mobile page.
       *
       * @param {number} top
       */
    }, {
      key: "onMobileMouseMove",
      value: function onMobileMouseMove(top) {
        if (_classPrivateFieldGet(_disableControls, this) || !this.isControlsExternal()) {
          return;
        }
        if (top <= 0) {
          _classPrivateFieldSet(_currentMobileTop, this, -1);
          return;
        }
        _classPrivateFieldSet(_currentMousePosition, this, top);
        for (var i = 0, c = _classPrivateFieldGet(_blocksMobileTops, this).length; i < c; i++) {
          if (top >= _classPrivateFieldGet(_blocksMobileTops, this)[i]['top'] && (!_classPrivateFieldGet(_blocksMobileTops, this)[i + 1] || top < _classPrivateFieldGet(_blocksMobileTops, this)[i + 1]['top'])) {
            if (_classPrivateFieldGet(_blocksMobileTops, this)[i]['top'] !== _classPrivateFieldGet(_currentMobileTop, this)) {
              _classPrivateFieldSet(_currentMobileTop, this, _classPrivateFieldGet(_blocksMobileTops, this)[i]['top']);
              this.postExternalCommand(_classPrivateFieldGet(_postMessages, this).showControls, {
                blockId: _classPrivateFieldGet(_blocksMobileTops, this)[i]['blockId'],
                top: _classPrivateFieldGet(_blocksMobileTops, this)[i]['top'],
                height: _classPrivateFieldGet(_blocksMobileTops, this)[i]['height']
              });
            }
            break;
          }
        }
      }

      /**
       * Sends action with payload to parent window.
       *
       * @param {string} action
       * @param {Object} payload
       */
    }, {
      key: "postExternalCommand",
      value: function postExternalCommand(action, payload) {
        if (window.parent) {
          window.parent.postMessage({
            action: action,
            payload: payload
          }, window.location.origin);
        }
      }

      /**
       * Receives actions with payload from parent window.
       *
       * @param {string} action
       * @param {Object} payload
       */
    }, {
      key: "listenExternalCommands",
      value: function listenExternalCommands(action, payload) {
        var _this2 = this;
        var block = BX.Landing.PageObject.getBlocks().get(payload !== null && payload !== void 0 && payload.blockId ? payload.blockId : -1);
        if (payload !== null && payload !== void 0 && payload.blockId && !block) {
          return;
        }
        var successCallback = function successCallback() {
          setTimeout(function () {
            _classPrivateFieldSet(_currentMousePosition, _this2, 0);
            _this2.recalculateTops();
          }, 300);
        };
        switch (action) {
          case 'onDesignerBlockClick':
            {
              block.onDesignerBlockClick();
              break;
            }
          case 'onEditBlockClick':
            {
              block.onShowContentPanel();
              break;
            }
          case 'onStyleBlockClick':
            {
              block.onStyleShow();
              break;
            }
          case 'onSortDownBlockClick':
            {
              block.moveDown();
              successCallback();
              break;
            }
          case 'onSortUpBlockClick':
            {
              block.moveUp();
              successCallback();
              break;
            }
          case 'onRemoveBlockClick':
            {
              block.deleteBlock();
              break;
            }
          case 'onChangeStateBlockClick':
            {
              block.onStateChange();
              break;
            }
          case 'onCutBlockClick':
            {
              Main.getInstance().onCutBlock.bind(Main.getInstance(), block)();
              break;
            }
          case 'onCopyBlockClick':
            {
              Main.getInstance().onCopyBlock.bind(Main.getInstance(), block)();
              break;
            }
          case 'onPasteBlockClick':
            {
              Main.getInstance().onPasteBlock.bind(Main.getInstance(), block, function (blockId) {
                setTimeout(function () {
                  _assertClassBrand(_ExternalControls_brand, _this2, _registerNewBlock).call(_this2, blockId);
                }, 300);
              })();
              break;
            }
          case 'onFeedbackClick':
            {
              block.showFeedbackForm();
              break;
            }
          case 'onSaveInLibraryClick':
            {
              block.saveBlock();
              break;
            }
          case 'onHideEditorPanel':
            {
              BX.Landing.UI.Panel.EditorPanel.getInstance().hide();
              break;
            }
        }
      }
    }]);
  }();
  /**
   * Checks that element contains block
   * @param {HTMLElement} element
   * @return {boolean}
   */
  function _registerListeners() {
    var _this11 = this;
    setTimeout(function () {
      _assertClassBrand(_ExternalControls_brand, _this11, _registerBlocks).call(_this11);
    }, 0);

    // listening commands from outer frame
    window.addEventListener('message', function (event) {
      if (_this11.isControlsExternal()) {
        _this11.listenExternalCommands(event.data.action, event.data.payload);
      }
    });

    // catching the mouse and scrolling
    document.addEventListener('mouseenter', function (event) {
      _classPrivateFieldSet(_mouseEntered, _this11, true);
    });
    document.addEventListener('mouseleave', function (event) {
      _classPrivateFieldSet(_mouseEntered, _this11, false);
    });
    document.addEventListener('mousemove', function (event) {
      _this11.onMobileMouseMove(event.y);
    });
    document.addEventListener('scroll', function () {
      if (_classPrivateFieldGet(_mouseEntered, _this11)) {
        _this11.recalculateTopsIfExternals();
      }
    });

    // checking when external commands become enabled
    BX.addCustomEvent('BX.Landing.Main:changeControls', function (type, topInPercent) {
      if (type === 'internal') {
        _this11.postExternalCommand(_classPrivateFieldGet(_postMessages, _this11).hideAll, {});
      } else {
        // mode switching some time
        setTimeout(function () {
          _this11.recalculateTops(true);
        }, 400);
      }
    });

    // checking inline editor — enabled or disabled
    BX.addCustomEvent('BX.Landing.Editor:enable', function () {
      _classPrivateFieldSet(_disableControls, _this11, true);
      if (_this11.isControlsExternal()) {
        _this11.postExternalCommand(_classPrivateFieldGet(_postMessages, _this11).hideAll, {});
      }
    });
    BX.addCustomEvent('BX.Landing.Editor:disable', function () {
      _classPrivateFieldSet(_disableControls, _this11, false);
      _this11.recalculateTopsIfExternals(true);
    });

    // checking that new block was added and any block changed its active status
    BX.addCustomEvent('BX.Landing.Block:onAfterAdd', function (event) {
      setTimeout(function () {
        var blockData = event.getData();
        _assertClassBrand(_ExternalControls_brand, _this11, _registerNewBlock).call(_this11, blockData.id);
      }, 500);
    });
    BX.addCustomEvent('BX.Landing.Block:changeState', function (blockId, state) {
      _this11.postExternalCommand(_classPrivateFieldGet(_postMessages, _this11).changeState, {
        blockId: blockId,
        state: state
      });
    });

    // form's settings were opened and then closed
    BX.addCustomEvent('BX.Landing.Block:onFormSettingsOpen', function () {
      if (_this11.isControlsExternal()) {
        _this11.postExternalCommand(_classPrivateFieldGet(_postMessages, _this11).hideAll, {});
      }
      _classPrivateFieldSet(_disableControls, _this11, true);
    });
    BX.addCustomEvent('BX.Landing.Block:onFormSettingsClose', function (blockId) {
      // after form completely closed
      setTimeout(function () {
        _classPrivateFieldSet(_disableControls, _this11, false);
        _this11.recalculateTopsIfExternals(true);
      }, 400);
      _this11.postExternalCommand(_classPrivateFieldGet(_postMessages, _this11).hideAll, {});
    });
    BX.addCustomEvent('BX.Landing.Block:onAfterFormSave', function (blockId) {
      setTimeout(function () {
        _this11.postExternalCommand(_classPrivateFieldGet(_postMessages, _this11).backendAction, {
          action: 'Landing\\Block::saveForm',
          data: {
            block: blockId
          }
        });
      }, 1000);
    });
    BX.addCustomEvent('BX.Landing.Block:onBlockEditClose', function () {
      _classPrivateFieldSet(_disableControls, _this11, false);
      _this11.recalculateTopsIfExternals(true);
    });
    BX.addCustomEvent('BX.Landing.Block:onContentSave', this.recalculateTopsIfExternals.bind(this));
    BX.addCustomEvent('BX.Landing.Block:onDesignerBlockSave', this.recalculateTopsIfExternals.bind(this));
    BX.addCustomEvent('BX.Landing.Block:Card:add', this.recalculateTopsIfExternals.bind(this));
    BX.addCustomEvent('BX.Landing.Block:Card:remove', this.recalculateTopsIfExternals.bind(this));
    BX.addCustomEvent('BX.Landing.Block:afterRemove', this.recalculateTopsIfExternals.bind(this));
    BX.addCustomEvent('BX.Landing.Backend:action', this.onBackendAction.bind(this));
    BX.addCustomEvent('BX.Landing.Backend:batch', this.onBackendAction.bind(this));
  }
  function _createBlockObject(block) {
    return {
      id: parseInt(block.id),
      state: block.isEnabled(),
      permissions: {
        allowDesignBlock: block.isDesignBlockAllowed(),
        allowModifyStyles: block.isStyleModifyAllowed(),
        allowEditContent: block.isEditBlockAllowed(),
        allowSorting: block.isEditBlockAllowed(),
        allowRemove: block.isRemoveBlockAllowed(),
        allowChangeState: block.isChangeStateBlockAllowed(),
        allowPaste: block.isPasteBlockAllowed(),
        allowSaveInLibrary: block.isSaveBlockInLibraryAllowed()
      }
    };
  }
  /**
   * Registers all blocks on entire page.
   */
  function _registerBlocks() {
    var _this12 = this;
    var blocksCollection = BX.Landing.PageObject.getBlocks();
    var data = [];
    babelHelpers.toConsumableArray(blocksCollection).map(function (block) {
      return data.push(_assertClassBrand(_ExternalControls_brand, _this12, _createBlockObject).call(_this12, block));
    });
    this.postExternalCommand(_classPrivateFieldGet(_postMessages, this).register, {
      blocks: data
    });
  }
  /**
   * Registers new block.
   *
   * @param {number} blockId
   */
  function _registerNewBlock(blockId) {
    var block = BX.Landing.PageObject.getBlocks().get(blockId);
    if (block) {
      this.postExternalCommand(_classPrivateFieldGet(_postMessages, this).register, {
        blocks: [_assertClassBrand(_ExternalControls_brand, this, _createBlockObject).call(this, block)]
      });
      // because new block adding some time
      if (this.isControlsExternal()) {
        this.recalculateTops();
      } else {
        this.postExternalCommand(_classPrivateFieldGet(_postMessages, this).hideAll, {});
      }
    }
  }
  function hasBlock(element) {
    return !!element && !!element.querySelector('.block-wrapper');
  }

  /**
   * Checks that element contains "Add new Block" button
   * @param {HTMLElement} element
   * @return {boolean}
   */
  function hasCreateButton(element) {
    return !!element && !!element.querySelector('button[data-id="insert_first_block"]');
  }
  function onAnimationEnd(element, animationName) {
    return new Promise(function (resolve) {
      var _onAnimationEndListener = function onAnimationEndListener(event) {
        if (event.animationName === animationName) {
          resolve(event);
          main_core.Event.bind(element, 'animationend', _onAnimationEndListener);
        }
      };
      main_core.Event.bind(element, 'animationend', _onAnimationEndListener);
    });
  }
  function isEmpty(value) {
    if (main_core.Type.isNil(value)) {
      return true;
    }
    if (main_core.Type.isArrayLike(value)) {
      return !value.length;
    }
    if (main_core.Type.isObject(value)) {
      return Object.keys(value).length <= 0;
    }
    return true;
  }
  BX.Landing.getMode = function () {
    return 'edit';
  };
  function getBlocksGridRows(grid) {
    var cells = babelHelpers.toConsumableArray(grid.querySelectorAll('[role="gridcell"]')).filter(function (cell) {
      return cell.offsetParent !== null;
    });
    var rows = [];
    var currentTop = null;
    var currentRow = null;
    cells.forEach(function (cell) {
      var top = Math.round(cell.getBoundingClientRect().top);
      if (currentRow === null || Math.abs(top - currentTop) > 2) {
        currentRow = [];
        rows.push(currentRow);
        currentTop = top;
      }
      currentRow.push(cell);
    });
    return rows;
  }

  // 2D roving for the blocks grid: ArrowUp/Down move by visual row keeping the
  // column; ArrowLeft/Right (and Home/End) fall back to FocusZone linear order.
  function createBlocksGridNavigator(grid) {
    // Cache the computed row layout to avoid re-measuring every gridcell on each
    // arrow step. The set/order of cells changes on category switch, add/remove,
    // reorder and DnD (all childList mutations); a resize can reflow the column
    // count. Both drop the cache so the next step recomputes from live geometry.
    var rowsCache = null;
    var invalidateRowsCache = function invalidateRowsCache() {
      rowsCache = null;
    };
    new MutationObserver(invalidateRowsCache).observe(grid, {
      childList: true,
      subtree: true
    });
    window.addEventListener('resize', invalidateRowsCache);
    return function (direction, from, event) {
      if (!from || event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
        return null;
      }
      if (rowsCache === null) {
        rowsCache = getBlocksGridRows(grid);
      }
      var rows = rowsCache;
      var rowIndex = -1;
      var columnIndex = -1;
      rows.forEach(function (row, index) {
        var position = row.indexOf(from);
        if (position !== -1) {
          rowIndex = index;
          columnIndex = position;
        }
      });
      if (rowIndex === -1) {
        return null;
      }
      var targetRow = rows[rowIndex + (event.key === 'ArrowDown' ? 1 : -1)];
      if (!targetRow) {
        return null;
      }
      return targetRow[Math.min(columnIndex, targetRow.length - 1)] || null;
    };
  }

  /**
   * @memberOf BX.Landing
   */
  var Main = /*#__PURE__*/function (_main_core_events$Eve) {
    /**
     * Landing ID
     * @type {number}
     */

    function Main(id) {
      var _this3;
      babelHelpers.classCallCheck(this, Main);
      _this3 = _main_core_events$Eve.call(this) || this;
      _this3.setEventNamespace('BX.Landing.Main');
      var options = landing_env.Env.getInstance().getOptions();
      _this3.id = id;
      _this3.options = Object.freeze(options);
      _this3.blocks = _this3.options.blocks;
      _this3.currentBlock = null;
      _this3.isDesignBlockModeFlag = _this3.options["design_block"] === true;
      _this3.loadedDeps = {};
      _this3.cache = new main_core.Cache.MemoryCache();
      _this3.externalControls = new ExternalControls();
      _this3.onSliderFormLoaded = _this3.onSliderFormLoaded.bind(_this3);
      _this3.onBlockDelete = _this3.onBlockDelete.bind(_this3);
      BX.addCustomEvent('Landing.Block:onAfterDelete', _this3.onBlockDelete);
      _this3.adjustEmptyAreas();
      BX.Landing.UI.Panel.StatusPanel.setLastModified(options.lastModified);
      if (!_this3.isDesignBlockModeFlag) {
        BX.Landing.UI.Panel.StatusPanel.getInstance().show();
      }
      var pageType = landing_env.Env.getInstance().getType();
      if (pageType === Main.TYPE_KNOWLEDGE || pageType === Main.TYPE_GROUP) {
        var mainArea = document.querySelector('.landing-main');
        if (main_core.Type.isDomNode(mainArea)) {
          main_core.Dom.addClass(mainArea, 'landing-ui-collapse');
        }
      }
      return _this3;
    }
    babelHelpers.inherits(Main, _main_core_events$Eve);
    return babelHelpers.createClass(Main, [{
      key: "clear",
      value: function clear() {
        BX.removeCustomEvent('Landing.Block:onAfterDelete', this.onBlockDelete);
      }
    }, {
      key: "isCrmFormPage",
      value: function isCrmFormPage() {
        return landing_env.Env.getInstance().getSpecialType() === 'crm_forms';
      }
    }, {
      key: "isDesignBlockMode",
      value: function isDesignBlockMode() {
        return this.isDesignBlockModeFlag;
      }
    }, {
      key: "getSaveBlockPanel",
      value: function getSaveBlockPanel() {
        var panel = new landing_ui_panel_saveblock.SaveBlock('save_block_panel', {
          block: this.currentBlock
        });
        panel.layout.hidden = true;
        panel.content.hidden = false;
        main_core.Dom.append(panel.layout, window.parent.document.body);
        return panel;
      }
    }, {
      key: "getBlocksPanel",
      value: function getBlocksPanel() {
        var _this4 = this;
        return this.cache.remember('blockPanel', function () {
          var blocksPanel = _this4.createBlocksPanel();
          setTimeout(function () {
            if (blocksPanel.sidebarButtons.get(_this4.options.default_section)) {
              blocksPanel.sidebarButtons.get(_this4.options.default_section).layout.click();
            } else {
              babelHelpers.toConsumableArray(blocksPanel.sidebarButtons)[0].layout.click();
            }
          });
          blocksPanel.layout.hidden = true;
          blocksPanel.content.hidden = false;
          main_core.Dom.append(blocksPanel.layout, window.parent.document.body);
          return blocksPanel;
        });
      }
    }, {
      key: "getBlocksPanelContent",
      value: function getBlocksPanelContent() {
        return this.getBlocksPanel().content;
      }
    }, {
      key: "hideBlocksPanel",
      value: function hideBlocksPanel() {
        if (this.getBlocksPanel()) {
          return this.getBlocksPanel().hide();
        }
        return Promise.resolve();
      }
    }, {
      key: "getLayoutAreas",
      value: function getLayoutAreas() {
        return this.cache.remember('layoutAreas', function () {
          return [].concat(babelHelpers.toConsumableArray(document.body.querySelectorAll('.landing-header')), babelHelpers.toConsumableArray(document.body.querySelectorAll('.landing-sidebar')), babelHelpers.toConsumableArray(document.body.querySelectorAll('.landing-main')), babelHelpers.toConsumableArray(document.body.querySelectorAll('.landing-footer')));
        });
      }

      /**
       * Creates insert block button
       * @param {HTMLElement} area
       * @return {BX.Landing.UI.Button.Plus}
       */
    }, {
      key: "createInsertBlockButton",
      value: function createInsertBlockButton(area) {
        var button = new BX.Landing.UI.Button.Plus('insert_first_block', {
          text: landing_loc.Loc.getMessage('ACTION_BUTTON_CREATE')
        });
        button.on('click', this.showBlocksPanel.bind(this, null, area, button));
        button.on('mouseover', this.onCreateButtonMouseover.bind(this, area, button));
        button.on('mouseout', this.onCreateButtonMouseout.bind(this, area, button));
        return button;
      }
    }, {
      key: "onCreateButtonMouseover",
      value: function onCreateButtonMouseover(area, button) {
        if (main_core.Dom.hasClass(area, 'landing-header') || main_core.Dom.hasClass(area, 'landing-footer')) {
          var areas = this.getLayoutAreas();
          if (areas.length > 1) {
            var createText = landing_loc.Loc.getMessage('ACTION_BUTTON_CREATE');
            if (main_core.Dom.hasClass(area, 'landing-main')) {
              button.setText("".concat(createText, " ").concat(landing_loc.Loc.getMessage('LANDING_ADD_BLOCK_TO_MAIN')));
            }
            if (main_core.Dom.hasClass(area, 'landing-header')) {
              button.setText("".concat(createText, " ").concat(landing_loc.Loc.getMessage('LANDING_ADD_BLOCK_TO_HEADER')));
            }
            if (main_core.Dom.hasClass(area, 'landing-sidebar')) {
              button.setText("".concat(createText, " ").concat(landing_loc.Loc.getMessage('LANDING_ADD_BLOCK_TO_SIDEBAR')));
            }
            if (main_core.Dom.hasClass(area, 'landing-footer')) {
              button.setText("".concat(createText, " ").concat(landing_loc.Loc.getMessage('LANDING_ADD_BLOCK_TO_FOOTER')));
            }
            clearTimeout(this.fadeTimeout);
            this.fadeTimeout = setTimeout(function () {
              main_core.Dom.addClass(area, 'landing-area-highlight');
              areas.filter(function (currentArea) {
                return currentArea !== area;
              }).forEach(function (currentArea) {
                main_core.Dom.addClass(currentArea, 'landing-area-fade');
              });
            }, 400);
          }
        }
      }
    }, {
      key: "onCreateButtonMouseout",
      value: function onCreateButtonMouseout(area, button) {
        clearTimeout(this.fadeTimeout);
        if (main_core.Dom.hasClass(area, 'landing-header') || main_core.Dom.hasClass(area, 'landing-footer')) {
          var areas = this.getLayoutAreas();
          if (areas.length > 1) {
            button.setText(landing_loc.Loc.getMessage('ACTION_BUTTON_CREATE'));
            areas.forEach(function (currentArea) {
              main_core.Dom.removeClass(currentArea, 'landing-area-highlight');
              main_core.Dom.removeClass(currentArea, 'landing-area-fade');
            });
          }
        }
      }
    }, {
      key: "initEmptyArea",
      value: function initEmptyArea(area) {
        if (area) {
          area.innerHTML = '';
          main_core.Dom.append(this.createInsertBlockButton(area).layout, area);
          main_core.Dom.addClass(area, 'landing-empty');
        }
      }

      // eslint-disable-next-line class-methods-use-this
    }, {
      key: "destroyEmptyArea",
      value: function destroyEmptyArea(area) {
        if (area) {
          var button = area.querySelector('button[data-id="insert_first_block"]');
          if (button) {
            main_core.Dom.remove(button);
          }
          main_core.Dom.removeClass(area, 'landing-empty');
        }
      }

      /**
       * Adjusts areas
       */
    }, {
      key: "adjustEmptyAreas",
      value: function adjustEmptyAreas() {
        this.getLayoutAreas().filter(function (area) {
          return hasBlock(area) && hasCreateButton(area);
        }).forEach(this.destroyEmptyArea, this);
        this.getLayoutAreas().filter(function (area) {
          return !hasBlock(area) && !hasCreateButton(area);
        }).forEach(this.initEmptyArea, this);
        var main = document.body.querySelector('main.landing-edit-mode');
        var isAllEmpty = !this.getLayoutAreas().some(hasBlock);
        if (main) {
          if (isAllEmpty) {
            main_core.Dom.addClass(main, 'landing-empty');
            return;
          }
          main_core.Dom.removeClass(main, 'landing-empty');
        }
      }

      /**
       * Enables landing controls
       */
      // eslint-disable-next-line class-methods-use-this
    }, {
      key: "enableControls",
      value: function enableControls() {
        main_core.Dom.removeClass(document.body, 'landing-ui-hide-controls');
      }

      /**
       * Disables landing controls
       */
      // eslint-disable-next-line class-methods-use-this
    }, {
      key: "disableControls",
      value: function disableControls() {
        main_core.Dom.addClass(document.body, 'landing-ui-hide-controls');
      }

      /**
       * Checks that landing controls is enabled
       * @return {boolean}
       */
      // eslint-disable-next-line class-methods-use-this
    }, {
      key: "isControlsEnabled",
      value: function isControlsEnabled() {
        return !main_core.Dom.hasClass(document.body, 'landing-ui-hide-controls');
      }

      /**
       * Makes landing controls internal.
       */
      // eslint-disable-next-line class-methods-use-this
    }, {
      key: "makeControlsInternal",
      value: function makeControlsInternal() {
        BX.onCustomEvent('BX.Landing.Main:changeControls', ['internal', Main.topInPercent()]);
        main_core.Dom.removeClass(document.body, 'landing-ui-external-controls');
      }

      /**
       * Makes landing controls external.
       */
      // eslint-disable-next-line class-methods-use-this
    }, {
      key: "makeControlsExternal",
      value: function makeControlsExternal() {
        BX.onCustomEvent('BX.Landing.Main:changeControls', ['external', Main.topInPercent()]);
        main_core.Dom.addClass(document.body, 'landing-ui-external-controls');
      }

      /**
       * Checks that landing controls is external.
       * @return {boolean}
       */
      // eslint-disable-next-line class-methods-use-this
    }, {
      key: "isControlsExternal",
      value: function isControlsExternal() {
        return main_core.Dom.hasClass(document.body, 'landing-ui-external-controls');
      }

      /**
       * Set device code in body data-attribute.
       * @param {string} code
       */
    }, {
      key: "setDeviceCode",
      value: function setDeviceCode(code) {
        document.body.setAttribute('data-device', code);
      }

      /**
       * Get device code from body attribute.
       * @return {string}
       */
    }, {
      key: "getDeviceCode",
      value: function getDeviceCode() {
        return document.body.getAttribute('data-device');
      }

      /**
       * Set BX classes to mark this landing frame as mobile (touch) device
       */
    }, {
      key: "setTouchDevice",
      value: function setTouchDevice() {
        main_core.Dom.removeClass(document.documentElement, 'bx-no-touch');
        main_core.Dom.addClass(document.documentElement, 'bx-touch');
      }

      /**
       * Set BX classes to mark this landing frame as desktop (no touch) device
       */
    }, {
      key: "setNoTouchDevice",
      value: function setNoTouchDevice() {
        main_core.Dom.removeClass(document.documentElement, 'bx-touch');
        main_core.Dom.addClass(document.documentElement, 'bx-no-touch');
      }

      /**
       * Appends block
       * @param {addBlockResponse} data
       * @param {boolean} [withoutAnimation]
       * @returns {HTMLElement}
       */
    }, {
      key: "appendBlock",
      value: function appendBlock(data, withoutAnimation) {
        if (!this.isAllowedAppendBlock(data)) {
          return main_core.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral([""])));
        }
        var block = main_core.Tag.render(_templateObject2 || (_templateObject2 = babelHelpers.taggedTemplateLiteral(["", ""])), data.content);
        block.id = "block".concat(data.id);
        if (!withoutAnimation) {
          main_core.Dom.addClass(block, 'landing-ui-show');
          onAnimationEnd(block, 'showBlock').then(function () {
            main_core.Dom.removeClass(block, 'landing-ui-show');
          });
        }
        this.insertToBlocksFlow(block);
        return block;
      }

      /**
       * Check if the block can be appended
       * @param {addBlockResponse} data
       * @returns {boolean} - Returns true if the block can be appended, otherwise false
       */
    }, {
      key: "isAllowedAppendBlock",
      value: function isAllowedAppendBlock(data) {
        var _data$manifest$block$;
        var type = BX.Landing.Env.getInstance().getType().toLowerCase();
        var allowedBlockTypes = (_data$manifest$block$ = data.manifest.block.type) !== null && _data$manifest$block$ !== void 0 ? _data$manifest$block$ : [];
        if (type === 'mainpage' || allowedBlockTypes.includes('mainpage')) {
          if (main_core.Type.isString(allowedBlockTypes)) {
            allowedBlockTypes = [allowedBlockTypes];
          }
          if (!allowedBlockTypes.includes(type)) {
            return false;
          }
        }
        return true;
      }

      /**
       * Shows blocks list panel
       * @param {BX.Landing.Block} block
       * @param {HTMLElement} [area]
       * @param [button]
       * @param [insertBefore]
       */
    }, {
      key: "showBlocksPanel",
      value: function showBlocksPanel(block, area, button, insertBefore) {
        BX.UI.Analytics.sendData({
          tool: BX.Landing.Main.getAnalyticsCategoryByType(),
          category: 'widget_list',
          event: 'open_widget_list'
        });
        this.currentBlock = block;
        this.currentArea = area;
        this.insertBefore = insertBefore;
        BX.Landing.UI.Panel.EditorPanel.getInstance().hide();
        if (this.isCrmFormPage() || this.isControlsExternal()) {
          var rootWindow = landing_pageobject.PageObject.getRootWindow();
          main_core.Dom.append(this.getBlocksPanel().layout, rootWindow.document.body);
          main_core.Dom.append(this.getBlocksPanel().overlay, rootWindow.document.body);
        }
        this.getBlocksPanel().show();
        this.disableAddBlockButtons();
        if (!!area && !!button) {
          this.onCreateButtonMouseout(area, button);
        }
      }
    }, {
      key: "showSaveBlock",
      value: function showSaveBlock(block) {
        this.currentBlock = block;
        this.getSaveBlockPanel().show();
      }
    }, {
      key: "disableAddBlockButtons",
      value: function disableAddBlockButtons() {
        landing_pageobject.PageObject.getBlocks().forEach(function (block) {
          var panel = block.panels.get('create_action');
          if (panel) {
            var button = panel.buttons.get('insert_after');
            if (button) {
              button.disable();
            }
          }
        });
      }
    }, {
      key: "enableAddBlockButtons",
      value: function enableAddBlockButtons() {
        landing_pageobject.PageObject.getBlocks().forEach(function (block) {
          var panel = block.panels.get('create_action');
          if (panel) {
            var button = panel.buttons.get('insert_after');
            if (button) {
              button.enable();
            }
          }
        });
      }

      /**
       * Creates blocks list panel
       * @returns {BX.Landing.UI.Panel.Content}
       */
    }, {
      key: "createBlocksPanel",
      value: function createBlocksPanel() {
        var _this5 = this;
        var blocks = this.options.blocks;
        var categories = Object.keys(blocks);
        var panel = new landing_ui_panel_content.Content('blocks_panel', {
          title: landing_loc.Loc.getMessage('LANDING_CONTENT_BLOCKS_TITLE'),
          className: 'landing-ui-panel-block-list',
          scrollAnimation: true
        });
        main_core.Dom.attr(panel.content, {
          'role': 'grid',
          'aria-label': landing_loc.Loc.getMessage('LANDING_BLOCKS_LIST_GRID_LABEL')
        });
        this.setupBlocksGridFocusZone(panel.content);
        panel.subscribe('onCancel', function () {
          _this5.enableAddBlockButtons();
        });
        categories.forEach(function (categoryId) {
          var hasItems = !isEmpty(blocks[categoryId].items);
          var isPopular = categoryId === 'popular';
          var isSeparator = blocks[categoryId].separator;
          var isFavourite = categoryId === 'favourite';
          if (hasItems && !isPopular || isSeparator || isFavourite) {
            panel.appendSidebarButton(_this5.createBlockPanelSidebarButton(categoryId, blocks[categoryId]));
          }
        });
        panel.appendSidebarButton(new BX.Landing.UI.Button.SidebarButton('feedback_button', {
          className: 'landing-ui-button-sidebar-feedback',
          text: landing_loc.Loc.getMessage('LANDING_BLOCKS_LIST_FEEDBACK_BUTTON'),
          onClick: this.showFeedbackForm.bind(this)
        }));
        return panel;
      }

      // Roving-tabindex composite over the block cards grid: a single Tab stop
      // enters the grid, arrow keys move between gridcells. The FocusZone manages
      // only the cards (role="gridcell"); nested badge/remove buttons stay outside
      // the roving set and remain reachable within the focused cell. Card add/remove
      // on category switch is tracked by the FocusZone MutationObserver.
    }, {
      key: "setupBlocksGridFocusZone",
      value: function setupBlocksGridFocusZone(grid) {
        var _this6 = this;
        if (this.blocksGridFocusZone) {
          return this.blocksGridFocusZone;
        }
        this.blocksGridFocusZone = landing_ui_a11y.A11y.load().then(function (_ref) {
          var FocusZone = _ref.FocusZone;
          var focusZone = new FocusZone(grid, {
            focusInStrategy: 'first',
            focusableElementFilter: function focusableElementFilter(element) {
              return element.getAttribute('role') === 'gridcell';
            },
            getNextFocusable: createBlocksGridNavigator(grid)
          });
          focusZone.activate();
          return focusZone;
        }).catch(function (error) {
          _this6.blocksGridFocusZone = null;
          console.warn('Failed to init blocks grid focus zone', error);
          return null;
        });
        return this.blocksGridFocusZone;
      }

      /**
       * Shows feedback form
       * @param data
       */
    }, {
      key: "showSliderFeedbackForm",
      value: function showSliderFeedbackForm() {
        var _this7 = this;
        var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        main_core.Runtime.loadExtension('ui.feedback.form').then(function () {
          var data = {};
          data.bitrix24 = _this7.options.server_name;
          data.siteId = _this7.options.site_id;
          data.siteUrl = _this7.options.url;
          data.siteTemplate = _this7.options.xml_id;
          data.productType = _this7.options.productType || 'Undefined';
          data.typeproduct = function () {
            if (_this7.options.params.type === Main.TYPE_GROUP) {
              return 'KNOWLEDGE_GROUP';
            }
            return _this7.options.params.type;
          }();
          BX.UI.Feedback.Form.open({
            id: Math.random() + '',
            forms: _this7.getFeedbackFormOptions(),
            presets: data
          });
        });
      }

      /**
       * Gets feedback form options
       * @return {{id: string, sec: string, lang: string}}
       */
      // eslint-disable-next-line class-methods-use-this
    }, {
      key: "getFeedbackFormOptions",
      value: function getFeedbackFormOptions() {
        return [{
          zones: ['en', 'eu', 'in', 'uk'],
          id: 16,
          lang: 'en',
          sec: '3h483y'
        }, {
          zones: ['ru', 'by', 'kz'],
          id: 8,
          lang: 'ru',
          sec: 'x80yjw'
        }, {
          zones: ['ua'],
          id: 18,
          lang: 'ua',
          sec: 'd9e09o'
        }, {
          zones: ['la', 'co', 'mx'],
          id: 14,
          lang: 'la',
          sec: 'wu561i'
        }, {
          zones: ['de'],
          id: 10,
          lang: 'de',
          sec: 'eraz2q'
        }, {
          zones: ['com.br', 'br'],
          id: 12,
          lang: 'br',
          sec: 'r6wvge'
        }];
      }

      /**
       * Handles feedback loaded event
       */
    }, {
      key: "onSliderFormLoaded",
      value: function onSliderFormLoaded() {
        this.sliderFormLoader.hide();
      }

      /**
       * Shows feedback form for blocks list panel
       */
    }, {
      key: "showFeedbackForm",
      value: function showFeedbackForm() {
        this.showSliderFeedbackForm({
          target: 'blocksList'
        });
      }

      /**
       * Creates blocks list panel sidebar button
       * @param {string} category
       * @param {object} options
       * @returns {BX.Landing.UI.Button.SidebarButton}
       */
    }, {
      key: "createBlockPanelSidebarButton",
      value: function createBlockPanelSidebarButton(category, options) {
        return new BX.Landing.UI.Button.SidebarButton(category, {
          text: options.name,
          child: !options.separator,
          className: options.new ? 'landing-ui-new-section' : '',
          onClick: this.onBlocksListCategoryChange.bind(this, category)
        });
      }

      /**
       * Adds dynamically new block to the category.
       * @param {string} category Category code.
       * @param {{code: string, name: string, preview: string, section: Array<string>}} block Block data.
       */
    }, {
      key: "addNewBlockToCategory",
      value: function addNewBlockToCategory(category, block) {
        if (this.blocks[category]) {
          var blockCode = block['codeOriginal'] || block['code'];
          if (category === 'last') {
            if (!this.lastBlocks) {
              this.lastBlocks = Object.keys(this.blocks.last.items);
            }
            this.lastBlocks.unshift(blockCode);
          } else {
            this.blocks[category].items[blockCode] = block;
          }
          this.onBlocksListCategoryChange(category);
        }
      }
    }, {
      key: "removeBlockFromList",
      value: function removeBlockFromList(blockCode) {
        var removed = false;
        for (var category in this.blocks) {
          if (this.blocks[category].items[blockCode] !== undefined) {
            delete this.blocks[category].items[blockCode];
            removed = true;
          }
        }
        if (this.lastBlocks.indexOf(blockCode) !== -1) {
          this.lastBlocks.splice(this.lastBlocks.indexOf(blockCode), 1);
          removed = true;
        }

        // refresh panel
        if (removed) {
          var activeCategoryButton = this.getBlocksPanel().sidebarButtons.find(function (button) {
            return main_core.Dom.hasClass(button.layout, 'landing-ui-active');
          });
          if (activeCategoryButton) {
            this.onBlocksListCategoryChange(activeCategoryButton.id);
          }
        }
      }

      /**
       * Returns page's template code if exists.
       * @return {string|null}
       */
    }, {
      key: "getTemplateCode",
      value: function getTemplateCode() {
        var _landing_env$Env$getI = landing_env.Env.getInstance().getOptions(),
          tplCode = _landing_env$Env$getI.tplCode;
        if (tplCode.indexOf('@') > 0) {
          tplCode = tplCode.split('@')[1];
        }
        if (!tplCode || tplCode.length <= 0) {
          tplCode = null;
        }
        return tplCode;
      }

      /**
       * Handles event on blocks list category change
       * @param {string} category - Category id
       */
    }, {
      key: "onBlocksListCategoryChange",
      value: (function () {
        var _onBlocksListCategoryChange = babelHelpers.asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(category) {
          var _this8 = this;
          var templateCode, loader, blockCards, _t;
          return _regenerator().w(function (_context) {
            while (1) switch (_context.p = _context.n) {
              case 0:
                this.currentCategory = category;
                if (this.currentCategory === 'favourite') {
                  BX.UI.Analytics.sendData({
                    tool: BX.Landing.Main.getAnalyticsCategoryByType(),
                    category: 'widget_list',
                    event: 'open_favorites',
                    c_section: 'site_editor'
                  });
                }
                templateCode = this.getTemplateCode();
                this.getBlocksPanel().content.hidden = false;
                this.getBlocksPanel().sidebarButtons.forEach(function (button) {
                  var action = button.id === category ? 'add' : 'remove';
                  button.layout.classList[action]('landing-ui-active');
                });
                this.getBlocksPanel().content.innerHTML = '';
                loader = new BX.Loader({
                  target: this.getBlocksPanel().content,
                  size: 90
                });
                loader.show();
                _context.p = 1;
                _context.n = 2;
                return BX.Landing.Backend.getInstance().action('Landing::getFavouriteBlocks');
              case 2:
                this.favouriteBlocks = _context.v;
                _context.n = 4;
                break;
              case 3:
                _context.p = 3;
                _t = _context.v;
                console.warn('Failed to fetch favourite blocks', _t);
                this.favouriteBlocks = [];
              case 4:
                loader.hide();
                if (!(category === 'last')) {
                  _context.n = 5;
                  break;
                }
                if (!this.lastBlocks) {
                  this.lastBlocks = Object.keys(this.blocks.last.items);
                }
                this.lastBlocks = babelHelpers.toConsumableArray(new Set(this.lastBlocks));
                this.lastBlocks.forEach(function (blockKey) {
                  var block = _this8.getBlockFromRepository(blockKey);
                  if (block) {
                    block.currentCategory = category;
                    _this8.getBlocksPanel().appendCard(_this8.createBlockCard(blockKey, block));
                  }
                });
                return _context.a(2);
              case 5:
                if (!(category === 'favourite')) {
                  _context.n = 7;
                  break;
                }
                if (!this.favouriteBlocks) {
                  this.favouriteBlocks = Object.keys(this.blocks.favourite.items);
                }
                blockCards = [];
                this.favouriteBlocks = babelHelpers.toConsumableArray(new Set(this.favouriteBlocks));
                this.favouriteBlocks.forEach(function (blockKey) {
                  var block = _this8.getBlockFromRepository(blockKey);
                  if (block) {
                    block.currentCategory = category;
                    blockCards.push(_this8.createBlockCard(blockKey, block));
                  }
                });
                if (!(blockCards.length === 0)) {
                  _context.n = 6;
                  break;
                }
                main_core.Dom.append(this.createFavouriteCategoryEmptyState(), this.getBlocksPanelContent());
                return _context.a(2);
              case 6:
                blockCards.forEach(function (blockCard) {
                  _this8.getBlocksPanel().appendCard(blockCard);
                });
                return _context.a(2);
              case 7:
                Object.keys(this.blocks[category].items).forEach(function (blockKey) {
                  var block = _this8.blocks[category].items[blockKey];
                  var blockTplCode = block['tpl_code'] && block['tpl_code'].length > 0 ? block['tpl_code'] : null;
                  if (!templateCode || !blockTplCode || blockTplCode && blockTplCode === templateCode) {
                    block.currentCategory = category;
                    _this8.getBlocksPanel().appendCard(_this8.createBlockCard(blockKey, block));
                  }
                });
                if (this.getBlocksPanel().content.scrollTop) {
                  requestAnimationFrame(function () {
                    _this8.getBlocksPanel().content.scrollTop = 0;
                  });
                }
              case 8:
                return _context.a(2);
            }
          }, _callee, this, [[1, 3]]);
        }));
        function onBlocksListCategoryChange(_x) {
          return _onBlocksListCategoryChange.apply(this, arguments);
        }
        return onBlocksListCategoryChange;
      }() // eslint-disable-next-line consistent-return
      )
    }, {
      key: "getBlockFromRepository",
      value: function getBlockFromRepository(code) {
        var blocks = this.options.blocks;
        var categories = Object.keys(blocks);
        var category = categories.find(function (categoryId) {
          return code in blocks[categoryId].items;
        });
        if (category) {
          return blocks[category].items[code];
        }
      }

      /**
       * Handles copy block event
       * @param {BX.Landing.Block} block
       */
      // eslint-disable-next-line class-methods-use-this
    }, {
      key: "onCopyBlock",
      value: function onCopyBlock(block) {
        window.localStorage.landingBlockId = block.id;
        window.localStorage.landingBlockName = block.manifest.block.name;
        window.localStorage.landingBlockAction = 'copy';
        try {
          window.localStorage.requiredUserAction = JSON.stringify(block.requiredUserActionOptions);
        } catch (err) {
          window.localStorage.requiredUserAction = '';
        }
      }

      /**
       * Handles cut block event
       * @param {BX.Landing.Block} block
       */
      // eslint-disable-next-line class-methods-use-this
    }, {
      key: "onCutBlock",
      value: function onCutBlock(block) {
        window.localStorage.landingBlockId = block.id;
        window.localStorage.landingBlockName = block.manifest.block.name;
        window.localStorage.landingBlockAction = 'cut';
        try {
          window.localStorage.requiredUserAction = JSON.stringify(block.requiredUserActionOptions);
        } catch (err) {
          window.localStorage.requiredUserAction = '';
        }
        BX.Landing.PageObject.getBlocks().remove(block);
        main_core.Dom.remove(block.node);
        BX.onCustomEvent('Landing.Block:onAfterDelete', [block]);
      }

      /**
       * Handles paste block event
       * @param {BX.Landing.Block} block
       * @param {() => {}} callback
       */
    }, {
      key: "onPasteBlock",
      value: function onPasteBlock(block, callback) {
        var _this9 = this;
        if (window.localStorage.landingBlockId) {
          var action = 'Landing::copyBlock';
          if (window.localStorage.landingBlockAction === 'cut') {
            action = 'Landing::moveBlock';
          }
          var requestBody = {};
          requestBody[action] = {
            action: action,
            data: {
              lid: block.lid || BX.Landing.Main.getInstance().id,
              block: window.localStorage.landingBlockId,
              params: {
                AFTER_ID: block.id,
                RETURN_CONTENT: 'Y'
              }
            }
          };
          landing_backend.Backend.getInstance().batch(action, requestBody, {
            action: action
          }).then(function (res) {
            _this9.currentBlock = block;
            return _this9.addBlock(res[action].result.content, false, false, callback);
          });
        }
      }

      /**
       * Adds block from server response
       * @param {addBlockResponse} res
       * @param {boolean} [withoutAnimation = false]
       * @param {boolean} [insertBefore = false]
       * @param {() => {}} callback
       * @return {Promise<T>}
       */
    }, {
      key: "addBlock",
      value: function addBlock(res, withoutAnimation) {
        var insertBefore = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
        var callback = arguments.length > 3 ? arguments[3] : undefined;
        if (this.lastBlocks) {
          this.lastBlocks.unshift(res.manifest.codeOriginal || res.manifest.code);
        }
        var self = this;
        var block = this.appendBlock(res, withoutAnimation);
        return this.loadBlockDeps(res).then(function (blockRes) {
          self.currentBlock = null;
          self.currentArea = null;
          var blockId = parseInt(res.id);
          var allOldBlocks = BX.Landing.PageObject.getBlocks();
          if (allOldBlocks) {
            allOldBlocks.forEach(function (oldBlock) {
              if (oldBlock.id === blockId) {
                main_core.Dom.remove(oldBlock.node);
                BX.Landing.PageObject.getBlocks().remove(oldBlock);
              }
            });
          }

          // Init block entity
          void new BX.Landing.Block(block, {
            id: blockId,
            sections: res.sections,
            requiredUserAction: res.requiredUserAction,
            manifest: res.manifest,
            access: res.access,
            active: main_core.Text.toBoolean(res.active),
            php: res.php,
            designed: res.designed,
            anchor: res.anchor,
            dynamicParams: res.dynamicParams,
            repoId: res.repoId
          });
          return self.runBlockScripts(res).then(function () {
            if (callback) {
              callback(blockId);
            }
            return block;
          });
        }).catch(function (err) {
          console.warn(err);
        });
      }

      /**
       * Handles edd block event
       * @param {string} blockCode
       * @param {*} [restoreId]
       * @param {?boolean} [preventHistory = false]
       * @return {Promise<BX.Landing.Block>}
       */
    }, {
      key: "onAddBlock",
      value: function onAddBlock(blockCode, restoreId) {
        var _this0 = this;
        var preventHistory = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
        var id = main_core.Text.toNumber(restoreId);
        this.hideBlocksPanel();
        return this.showBlockLoader().then(this.loadBlock(blockCode, id, preventHistory)).then(function (res) {
          return new Promise(function (resolve) {
            setTimeout(function () {
              resolve(res);
            }, 500);
          });
        }).then(function (res) {
          res.manifest.codeOriginal = blockCode;
          var p = _this0.addBlock(res, false, _this0.insertBefore);
          _this0.insertBefore = false;
          _this0.adjustEmptyAreas();
          void _this0.hideBlockLoader();
          _this0.enableAddBlockButtons();
          BX.onCustomEvent('BX.Landing.Block:onAfterAdd', res);
          return p;
        });
      }

      /**
       * Inserts element to blocks flow.
       * Element can be inserted after current block or after last block
       * @param {HTMLElement} element
       */
    }, {
      key: "insertToBlocksFlow",
      value: function insertToBlocksFlow(element) {
        var isCurrentBlockAvailable = this.currentBlock && this.currentBlock.node && this.currentBlock.node.parentNode;
        if (isCurrentBlockAvailable && !this.insertBefore) {
          main_core.Dom.insertAfter(element, this.currentBlock.node);
          return;
        }
        if (isCurrentBlockAvailable && this.insertBefore) {
          main_core.Dom.insertBefore(element, this.currentBlock.node);
        }
        main_core.Dom.prepend(element, this.currentArea);
      }

      /**
       * Gets block loader
       * @return {HTMLElement}
       */
    }, {
      key: "getBlockLoader",
      value: function getBlockLoader() {
        if (!this.blockLoader) {
          this.blockLoader = new BX.Loader({
            size: 60
          });
          this.blockLoaderContainer = main_core.Dom.create('div', {
            props: {
              className: 'landing-block-loader-container'
            },
            children: [this.blockLoader.layout]
          });
        }
        return this.blockLoaderContainer;
      }

      /**
       * Shows block loader
       * @return {Function}
       */
    }, {
      key: "showBlockLoader",
      value: function showBlockLoader() {
        this.insertToBlocksFlow(this.getBlockLoader());
        this.blockLoader.show();
        return Promise.resolve();
      }

      /**
       * Hides block loader
       * @return {Function}
       */
    }, {
      key: "hideBlockLoader",
      value: function hideBlockLoader() {
        main_core.Dom.remove(this.getBlockLoader());
        this.blockLoader = null;
        return Promise.resolve();
      }

      /**
       * Loads block dependencies
       * @param {addBlockResponse} data
       * @returns {Promise<addBlockResponse>}
       */
    }, {
      key: "loadBlockDeps",
      value: function loadBlockDeps(data) {
        var _this1 = this;
        var ext = BX.processHTML(data.content_ext);
        if (BX.type.isArray(ext.SCRIPT)) {
          ext.SCRIPT = ext.SCRIPT.filter(function (item) {
            return !item.isInternal;
          });
        }
        if (BX.type.isObject(data.lang)) {
          landing_loc.Loc.setMessage(data.lang);
        }
        var loadedScripts = 0;
        var scriptsCount = data.js.length + ext.SCRIPT.length + ext.STYLE.length + data.css.length;
        var resPromise = null;
        if (!this.loadedDeps[data.manifest.code] && scriptsCount > 0) {
          resPromise = new Promise(function (resolve) {
            function onLoad() {
              loadedScripts += 1;
              if (loadedScripts === scriptsCount) {
                resolve(data);
              }
            }
            if (scriptsCount > loadedScripts) {
              // Load extensions files
              ext.SCRIPT.forEach(function (item) {
                if (!item.isInternal) {
                  BX.loadScript(item.JS, onLoad);
                }
              });
              ext.STYLE.forEach(function (item) {
                BX.loadScript(item, onLoad);
              });

              // Load block files
              data.css.forEach(function (item) {
                BX.loadScript(item, onLoad);
              });
              data.js.forEach(function (item) {
                BX.loadScript(item, onLoad);
              });
            } else {
              onLoad();
            }
            _this1.loadedDeps[data.manifest.code] = true;
          });
        } else {
          resPromise = Promise.resolve(data);
        }
        return resPromise.then(function (data) {
          if (BX.type.isArray(data.assetStrings)) {
            var head = document.head;
            data.assetStrings.forEach(function (string) {
              var element = main_core.Tag.render(_templateObject3 || (_templateObject3 = babelHelpers.taggedTemplateLiteral(["", ""])), string);
              main_core.Dom.insertAfter(element, head.lastChild);
            });
          }
          return data;
        });
      }

      /**
       * Executes block scripts
       * @param data
       * @return {Promise}
       */
      // eslint-disable-next-line class-methods-use-this
    }, {
      key: "runBlockScripts",
      value: function runBlockScripts(data) {
        return new Promise(function (resolve) {
          var scripts = BX.processHTML(data.content).SCRIPT;
          if (scripts.length) {
            BX.ajax.processScripts(scripts, undefined, function () {
              resolve(data);
            });
          } else {
            resolve(data);
          }
        });
      }

      /**
       * Load new block from server
       * @param {string} blockCode
       * @param {int} [restoreId]
       * @param {boolean} [preventHistory = false]
       * @returns {Function}
       */
    }, {
      key: "loadBlock",
      value: function loadBlock(blockCode, restoreId, preventHistory) {
        var _this10 = this;
        return function () {
          var lid = _this10.id;
          var siteId = _this10.options.site_id;
          if (_this10.currentBlock) {
            lid = _this10.currentBlock.lid;
            siteId = _this10.currentBlock.siteId;
          }
          if (_this10.currentArea) {
            lid = main_core.Dom.attr(_this10.currentArea, 'data-landing');
            siteId = main_core.Dom.attr(_this10.currentArea, 'data-site');
          }
          var requestBody = {
            lid: lid,
            siteId: siteId,
            preventHistory: preventHistory ? 1 : 0
          };
          var fields = {
            ACTIVE: 'Y',
            CODE: blockCode,
            AFTER_ID: _this10.currentBlock ? _this10.currentBlock.id : 0,
            RETURN_CONTENT: 'Y',
            CATEGORY: _this10.currentCategory
          };
          if (!main_core.Type.isBoolean(preventHistory) || preventHistory === false) {
            // Change history steps
            BX.Landing.History.getInstance().push();
          }
          if (!restoreId) {
            requestBody.fields = fields;
            return landing_backend.Backend.getInstance().action('Landing::addBlock', requestBody, {
              code: blockCode
            }).then(function (result) {
              if (_this10.insertBefore) {
                return landing_backend.Backend.getInstance().action('Landing::upBlock', {
                  lid: lid,
                  siteId: siteId,
                  block: result.id
                }).then(function () {
                  return result;
                });
              }
              return result;
            });
          }
          return landing_backend.Backend.getInstance().action('Block::getContent', {
            block: restoreId,
            lid: lid,
            fields: fields,
            editMode: 1
          }).then(function (res) {
            res.id = restoreId;
            return res;
          });
        };
      }

      /**
       * Creates block preview card
       * @param {string} blockKey - Block key (folder name)
       * @param {{name: string, [preview]: ?string, [new]: ?boolean}} block - Object with block data
       * @param {string} [mode]
       * @returns {BX.Landing.UI.Card.BlockPreviewCard}
       */
    }, {
      key: "createBlockCard",
      value: function createBlockCard(blockKey, block, mode) {
        return new BX.Landing.UI.Card.BlockPreviewCard({
          title: block.name,
          image: block.preview,
          code: blockKey,
          app_expired: block.app_expired,
          favorite: !!block.favorite,
          favoriteMy: !!block.favoriteMy,
          repo_id: block.repo_id,
          mode: mode,
          isNew: block.new === true,
          onClick: this.onAddBlock.bind(this, blockKey),
          currentCategory: block.currentCategory,
          role: 'gridcell',
          useFavouriteBadge: true,
          isFavorite: Array.isArray(this.favouriteBlocks) && this.favouriteBlocks.includes(blockKey)
        });
      }
    }, {
      key: "createFavouriteCategoryEmptyState",
      value: function createFavouriteCategoryEmptyState() {
        return main_core.Tag.render(_templateObject4 || (_templateObject4 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-favourite-category-empty-state text-center\">\n\t\t\t\t<img \n\t\t\t\t\tclass=\"landing-favourite-category-empty-state--image\" \n\t\t\t\t\tsrc=\"/bitrix/images/landing/empty-favourite.webp\"\n\t\t\t\t\tstyle=\"margin-bottom: 14px;\"\n\t\t\t\t/>\n\t\t\t\t<p \n\t\t\t\t\tclass=\"landing-favourite-category-empty-state--title\"\n\t\t\t\t\tstyle=\"color: #333333; font-weight: 500; font-size: 19px; line-height: 26px; margin-bottom: 10px;\"\n\t\t\t\t>\n\t\t\t\t\t", "\n\t\t\t\t</p>\n\t\t\t\t<p \n\t\t\t\t\tclass=\"landing-favourite-category-empty-state--text\"\n\t\t\t\t\tstyle=\"color: #414A56; font-weight: 400; font-size: 16px; line-height: 21px; max-width: 340px; margin: auto;\"\n\t\t\t\t>\n\t\t\t\t\t", "\n\t\t\t\t</p>\n\t\t\t</div>\n\t\t"])), landing_loc.Loc.getMessage('LANDING_SECTION_FAVOURITE_EMPTY_STATE_TITLE'), landing_loc.Loc.getMessage('LANDING_SECTION_FAVOURITE_EMPTY_STATE_TEXT'));
      }

      /**
       * Handles block delete event
       */
    }, {
      key: "onBlockDelete",
      value: function onBlockDelete(block) {
        if (!block.parent.querySelector('.block-wrapper')) {
          this.adjustEmptyAreas();
        }
      }

      /**
       * Shows page overlay
       */
      // eslint-disable-next-line class-methods-use-this
    }, {
      key: "showOverlay",
      value: function showOverlay() {
        var main = document.querySelector('main.landing-edit-mode');
        if (main) {
          main_core.Dom.addClass(main, 'landing-ui-overlay');
        }
      }

      /**
       * Hides page overlay
       */
      // eslint-disable-next-line class-methods-use-this
    }, {
      key: "hideOverlay",
      value: function hideOverlay() {
        var main = document.querySelector('main.landing-edit-mode');
        if (main) {
          main_core.Dom.removeClass(main, 'landing-ui-overlay');
        }
      }
    }, {
      key: "reloadSlider",
      value: function reloadSlider(url) {
        return landing_sliderhacks.SliderHacks.reloadSlider(url, window.parent);
      }
    }], [{
      key: "getMode",
      value: function getMode() {
        return 'edit';
      }
    }, {
      key: "createInstance",
      value: function createInstance(id) {
        var rootWindow = BX.Landing.PageObject.getRootWindow();
        if (rootWindow.BX.Landing.Main.instance) {
          rootWindow.BX.Landing.Main.instance.clear();
        }
        rootWindow.BX.Landing.Main.instance = new BX.Landing.Main(id);
      }
    }, {
      key: "getInstance",
      value: function getInstance() {
        var rootWindow = BX.Landing.PageObject.getRootWindow();
        rootWindow.BX.Reflection.namespace('BX.Landing.Main');
        if (rootWindow.BX.Landing.Main.instance) {
          return rootWindow.BX.Landing.Main.instance;
        }
        rootWindow.BX.Landing.Main.instance = new Main(-1);
        return rootWindow.BX.Landing.Main.instance;
      }

      /**
       * Returns true, if current page is Editor.
       * @return {boolean}
       */
    }, {
      key: "isEditorMode",
      value: function isEditorMode() {
        return main_core.Dom.hasClass(document.body, 'landing-editor');
      }

      /**
       * Returns true, if external controls is enabled.
       * @return {boolean}
       */
    }, {
      key: "isExternalControlsEnabled",
      value: function isExternalControlsEnabled() {
        return main_core.Dom.hasClass(document.body, 'enable-external-controls');
      }

      /**
       * Returns in percent scroll position of page.
       *
       * @return {number}
       */
    }, {
      key: "topInPercent",
      value: function topInPercent() {
        var scrollHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight);
        var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        return scrollTop / scrollHeight * 100;
      }

      /**
       * Maps site type to analytics category.
       *
       * @return {string}
       */
    }, {
      key: "getAnalyticsCategoryByType",
      value: function getAnalyticsCategoryByType() {
        var siteType = BX.Landing.Env.getInstance().getType();
        switch (siteType) {
          case 'STORE':
            return 'shop';
          case 'KNOWLEDGE':
          case 'GROUP':
            return 'kb';
          case 'VIBE':
            return 'vibe';
          default:
            return 'site';
        }
      }
    }]);
  }(main_core_events.EventEmitter);
  babelHelpers.defineProperty(Main, "TYPE_PAGE", 'PAGE');
  babelHelpers.defineProperty(Main, "TYPE_STORE", 'STORE');
  babelHelpers.defineProperty(Main, "TYPE_KNOWLEDGE", 'KNOWLEDGE');
  babelHelpers.defineProperty(Main, "TYPE_GROUP", 'GROUP');
  exports.Main = Main;
})(this.BX.Landing = this.BX.Landing || {}, BX, BX.Event, BX.Landing, BX.Landing, BX.Landing.UI, BX.Landing.UI.Panel, BX.Landing.UI.Panel, BX.Landing.UI.Panel, BX.Landing, BX.Landing, BX.Landing);
//# sourceMappingURL=main.bundle.js.map
