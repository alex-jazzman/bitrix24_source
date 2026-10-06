/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
(function (exports, main_core, landing_loc, landing_env, landing_main, landing_backend, landing_menu_menuitem, landing_ui_form_menuform, landing_ui_panel_stylepanel, landing_ui_a11y) {
  'use strict';
  var _templateObject, _templateObject2, _templateObject3, _templateObject4, _templateObject5, _templateObject6, _templateObject7, _templateObject8, _templateObject9;
  function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
  function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { babelHelpers.defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }

  function buildTree(root, selector) {
    var parent = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var depth = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
    return babelHelpers.toConsumableArray(root.querySelectorAll(selector)).filter(function (element) {
      return element.parentElement.closest(selector) === parent;
    }).map(function (element) {
      var newDepth = depth + 1;
      return {
        layout: element,
        children: buildTree(element, selector, element, newDepth),
        depth: depth
      };
    });
  }
  function makeFlatTree(tree) {
    var acc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    tree.forEach(function (item) {
      acc.push(item);
      makeFlatTree(item.children, acc);
    });
    return acc;
  }
  function getNodeClass(type) {
    if (type === 'link') {
      return BX.Landing.Node.Link;
    }
    if (type === 'img') {
      return BX.Landing.Node.Img;
    }
    if (type === 'icon') {
      return BX.Landing.Node.Icon;
    }
    if (type === 'embed') {
      return BX.Landing.Node.Embed;
    }
    if (type === 'map') {
      return BX.Landing.Node.Map;
    }
    if (type === 'component') {
      return BX.Landing.Node.Component;
    }
    return BX.Landing.Node.Text;
  }
  function decorateTreeSemantics(root) {
    main_core.Dom.attr(root, {
      role: 'tree',
      'aria-label': landing_loc.Loc.getMessage('LANDING_MENU_TREE_LABEL')
    });
    decorateGroup(root, 1);
  }
  function decorateGroup(container, level) {
    var items = babelHelpers.toConsumableArray(container.children).filter(function (li) {
      return li.tagName === 'LI' && li.querySelector(':scope > a');
    });
    babelHelpers.toConsumableArray(container.children).forEach(function (li) {
      if (li.tagName !== 'LI') {
        return;
      }
      main_core.Dom.attr(li, 'role', 'none');
      var link = li.querySelector(':scope > a');
      var childList = li.querySelector(':scope > ul');
      var hasChildItems = childList && babelHelpers.toConsumableArray(childList.children).some(function (node) {
        return node.tagName === 'LI' && node.querySelector(':scope > a');
      });
      if (link) {
        main_core.Dom.attr(link, {
          role: 'treeitem',
          'aria-level': String(level),
          'aria-setsize': String(items.length),
          'aria-posinset': String(items.indexOf(li) + 1)
        });
        if (hasChildItems) {
          if (!childList.id) {
            childList.id = main_core.Text.getRandom();
          }
          main_core.Dom.attr(link, {
            'aria-expanded': 'true',
            'aria-owns': childList.id
          });
        } else {
          link.removeAttribute('aria-expanded');
        }
      }
      if (hasChildItems) {
        main_core.Dom.attr(childList, 'role', 'group');
        decorateGroup(childList, level + 1);
      }
    });
  }
  function createTreeFocusNavigator() {
    return function getNextFocusable(direction, from, event) {
      if (!main_core.Type.isDomNode(from)) {
        return null;
      }
      var li = from.closest('li');
      if (!li) {
        return null;
      }
      if (event.key === 'ArrowRight') {
        var group = li.querySelector(':scope > ul[role="group"]');
        return group ? group.querySelector(':scope > li > a[role="treeitem"]') : null;
      }
      if (event.key === 'ArrowLeft') {
        var parentGroup = li.parentElement;
        var parentLi = parentGroup ? parentGroup.closest('li') : null;
        return parentLi ? parentLi.querySelector(':scope > a[role="treeitem"]') : null;
      }
      return null;
    };
  }

  /**
   * @memberOf BX.Landing.Menu
   */
  var Menu = /*#__PURE__*/function (_main_core$Event$Even) {
    function Menu() {
      var _this;
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      babelHelpers.classCallCheck(this, Menu);
      _this = _main_core$Event$Even.call(this, options) || this;
      _this.setEventNamespace('BX.Landing.Menu.Menu');
      _this.code = options.code;
      _this.root = options.root;
      _this.block = options.block;
      _this.manifest = Object.freeze(_objectSpread({}, options.manifest));
      _this.cache = new main_core.Cache.MemoryCache();
      if (landing_env.Env.getInstance().getType() === 'KNOWLEDGE' || landing_env.Env.getInstance().getType() === 'GROUP') {
        if (main_core.Dom.hasClass(_this.root.nextElementSibling, 'landing-menu-add')) {
          main_core.Dom.remove(_this.root.nextElementSibling);
        }
        main_core.Dom.addClass(_this.root, 'landing-menu-root-list');
        main_core.Dom.insertAfter(_this.getAddPageLayout(), _this.root);
      }
      decorateTreeSemantics(_this.root);
      _this.focusZone = null;
      _this.setupTreeFocusZone();
      main_core.Event.bind(_this.root, 'click', function (event) {
        if (!landing_ui_panel_stylepanel.StylePanel.getInstance().isShown() && event.target.nodeName === 'A') {
          event.preventDefault();
          var href = main_core.Dom.attr(event.target, 'href');
          var hrefPagePrefix = 'page:';
          if (href.startsWith(hrefPagePrefix)) {
            href = href.replace(hrefPagePrefix, '');
          }
          if (href.startsWith('#landing')) {
            var pageId = main_core.Text.toNumber(href.replace('#landing', ''));
            _this.reloadPage(pageId);
          }
        }
      });
      return _this;
    }
    babelHelpers.inherits(Menu, _main_core$Event$Even);
    return babelHelpers.createClass(Menu, [{
      key: "setupTreeFocusZone",
      value: function setupTreeFocusZone() {
        var _this2 = this;
        var root = this.root;
        landing_ui_a11y.A11y.load().then(function (_ref) {
          var FocusZone = _ref.FocusZone;
          if (root !== _this2.root) {
            return;
          }
          if (_this2.focusZone) {
            _this2.focusZone.deactivate();
          }
          _this2.focusZone = new FocusZone(root, {
            getNextFocusable: createTreeFocusNavigator(),
            focusInStrategy: 'first'
          });
          _this2.focusZone.activate();
        }).catch(function () {});
      }
    }, {
      key: "createMenuItem",
      value: function createMenuItem(options) {
        var _this3 = this;
        var nodes = new BX.Landing.Collection.NodeCollection();
        Object.entries(this.manifest.nodes).forEach(function (_ref2) {
          var _ref3 = babelHelpers.slicedToArray(_ref2, 2),
            code = _ref3[0],
            nodeManifest = _ref3[1];
          var nodeElements = babelHelpers.toConsumableArray(options.layout.querySelectorAll(code)).filter(function (nodeElement) {
            var elementParent = nodeElement.closest(_this3.manifest.item);
            return elementParent === options.layout;
          });
          if (nodeElements.length > 0) {
            var NodeClass = getNodeClass(nodeManifest.type);
            nodeElements.forEach(function (nodeElement) {
              nodes.push(new NodeClass({
                node: nodeElement,
                manifest: _objectSpread(_objectSpread({}, nodeManifest), {}, {
                  allowInlineEdit: false,
                  menuMode: true
                })
              }));
            });
          }
        });
        return new landing_menu_menuitem.MenuItem({
          layout: options.layout,
          children: options.children.map(function (itemOptions, index) {
            return _this3.createMenuItem(_objectSpread(_objectSpread({}, itemOptions), {}, {
              index: index
            }));
          }),
          selector: "".concat(this.manifest.item, "@").concat(options.index),
          depth: options.depth,
          nodes: nodes
        });
      }
    }, {
      key: "getTree",
      value: function getTree() {
        var _this4 = this;
        var item = this.manifest.item;
        return buildTree(this.root, item).map(function (options, index) {
          return _this4.createMenuItem(_objectSpread(_objectSpread({}, options), {}, {
            index: index
          }));
        });
      }
    }, {
      key: "getFlatTree",
      value: function getFlatTree() {
        return makeFlatTree(this.getTree());
      }
    }, {
      key: "getForm",
      value: function getForm() {
        return new landing_ui_form_menuform.MenuForm({
          title: landing_loc.Loc.getMessage('LANDING_MENU_TITLE'),
          type: 'menu',
          code: this.code,
          forms: this.getFlatTree().map(function (item) {
            return item.getForm();
          })
        });
      }
    }, {
      key: "getAddPageButton",
      value: function getAddPageButton() {
        var _this5 = this;
        return this.cache.remember('addPageButton', function () {
          return main_core.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<button \n\t\t\t\t\tclass=\"ui-btn ui-btn-light-border ui-btn-icon-add ui-btn-round landing-ui-menu-add-button\"\n\t\t\t\t\tonclick=\"", "\"\n\t\t\t\t\t>\n\t\t\t\t\t", "\n\t\t\t\t</button>\n\t\t\t"])), _this5.onAddPageButtonClick.bind(_this5), landing_loc.Loc.getMessage('LANDING_MENU_CREATE_NEW_PAGE'));
        });
      }
    }, {
      key: "onAddPageTextInputKeydown",
      value: function onAddPageTextInputKeydown(event) {
        if (event.keyCode === 13) {
          this.addPage();
        }
      }
    }, {
      key: "addPage",
      value: function addPage() {
        var _this6 = this;
        var input = this.getAddPageInput();
        var value = input.value;
        input.value = '';
        input.focus();
        if (main_core.Type.isStringFilled(value)) {
          var code = BX.translit(value, {
            change_case: 'L',
            replace_space: '-',
            replace_other: ''
          });
          var backend = landing_backend.Backend.getInstance();
          backend.createPage({
            title: value,
            menuCode: this.code,
            blockId: this.block,
            code: code
          }).then(function (id) {
            var li = _this6.createLi({
              text: value,
              href: "#landing".concat(id),
              target: '_self',
              children: []
            });
            main_core.Dom.append(li, _this6.root);
            decorateTreeSemantics(_this6.root);
            main_core.Dom.remove(_this6.getAddPageField());
            main_core.Dom.removeClass(_this6.root, 'landing-menu-root-list-with-field');
            main_core.Dom.removeClass(_this6.getAddPageLayout(), 'landing-menu-add-with-background');
            _this6.reloadPage(id);
          });
        }
      }

      // eslint-disable-next-line class-methods-use-this
    }, {
      key: "reloadPage",
      value: function reloadPage(id) {
        var main = landing_main.Main.getInstance();
        var url = landing_env.Env.getInstance().getLandingEditorUrl({
          landing: id
        });
        void main.reloadSlider(url);
      }
    }, {
      key: "getAddPageInput",
      value: function getAddPageInput() {
        var _this7 = this;
        return this.cache.remember('addPageTextInput', function () {
          return main_core.Tag.render(_templateObject2 || (_templateObject2 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<input \n\t\t\t\t\ttype=\"text\" \n\t\t\t\t\tclass=\"landing-menu-add-field-input\"\n\t\t\t\t\tplaceholder=\"", "\"\n\t\t\t\t\tonkeydown=\"", "\"\n\t\t\t\t\t>\n\t\t\t"])), landing_loc.Loc.getMessage('LANDING_MENU_CREATE_NEW_PAGE'), _this7.onAddPageTextInputKeydown.bind(_this7));
        });
      }
    }, {
      key: "onAddPageInputCloseButtonClick",
      value: function onAddPageInputCloseButtonClick(event) {
        event.preventDefault();
        var input = this.getAddPageInput();
        input.value = '';
        main_core.Dom.removeClass(this.root, 'landing-menu-root-list-with-field');
        main_core.Dom.removeClass(this.getAddPageLayout(), 'landing-menu-add-with-background');
        main_core.Dom.remove(this.getAddPageField());
        main_core.Dom.append(this.getAddPageButton(), this.getAddPageLayout());
      }
    }, {
      key: "getAddPageInputCloseButton",
      value: function getAddPageInputCloseButton() {
        var _this8 = this;
        return this.cache.remember('addPageInputCloseButton', function () {
          return main_core.Tag.render(_templateObject3 || (_templateObject3 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<span \n\t\t\t\t\tclass=\"landing-menu-add-field-close\"\n\t\t\t\t\tonclick=\"", "\"\n\t\t\t\t\ttitle=\"", "\"\n\t\t\t\t\t>\n\t\t\t\t</span>\n\t\t\t"])), _this8.onAddPageInputCloseButtonClick.bind(_this8), landing_loc.Loc.getMessage('LANDING_MENU_CLOSE_BUTTON_LABEL'));
        });
      }
    }, {
      key: "getAddPageInputApplyButton",
      value: function getAddPageInputApplyButton() {
        var _this9 = this;
        return this.cache.remember('addPageInputApplyButton', function () {
          return main_core.Tag.render(_templateObject4 || (_templateObject4 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<span \n\t\t\t\t\tclass=\"landing-menu-add-field-apply\"\n\t\t\t\t\tonclick=\"", "\"\n\t\t\t\t\ttitle=\"", "\"\n\t\t\t\t\t>\n\t\t\t\t</span>\n\t\t\t"])), _this9.onAddPageInputApplyButtonClick.bind(_this9), landing_loc.Loc.getMessage('LANDING_MENU_APPLY_BUTTON_LABEL'));
        });
      }
    }, {
      key: "onAddPageInputApplyButtonClick",
      value: function onAddPageInputApplyButtonClick(event) {
        event.preventDefault();
        this.addPage();
      }
    }, {
      key: "getAddPageField",
      value: function getAddPageField() {
        var _this0 = this;
        return this.cache.remember('addPageInput', function () {
          return main_core.Tag.render(_templateObject5 || (_templateObject5 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<div class=\"landing-menu-add-field\">\n\t\t\t\t\t", "\n\t\t\t\t\t", "\n\t\t\t\t\t", "\n\t\t\t\t</div>\n\t\t\t"])), _this0.getAddPageInput(), _this0.getAddPageInputApplyButton(), _this0.getAddPageInputCloseButton());
        });
      }
    }, {
      key: "getAddPageLayout",
      value: function getAddPageLayout() {
        var _this1 = this;
        return this.cache.remember('addPageLayout', function () {
          return main_core.Tag.render(_templateObject6 || (_templateObject6 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<div class=\"landing-menu-add\">\n\t\t\t\t\t", "\n\t\t\t\t</div>\n\t\t\t"])), _this1.getAddPageButton());
        });
      }
    }, {
      key: "onAddPageButtonClick",
      value: function onAddPageButtonClick(event) {
        event.preventDefault();
        main_core.Dom.addClass(this.root, 'landing-menu-root-list-with-field');
        main_core.Dom.addClass(this.getAddPageLayout(), 'landing-menu-add-with-background');
        main_core.Dom.prepend(this.getAddPageField(), this.getAddPageLayout());
        main_core.Dom.remove(this.getAddPageButton());
        this.getAddPageInput().focus();
      }
    }, {
      key: "createList",
      value: function createList(items) {
        var _this10 = this;
        var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'root';
        var ulClassName = this.manifest[type].ulClassName;
        return main_core.Tag.render(_templateObject7 || (_templateObject7 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<ul class=\"", "\">", "</ul>\n\t\t"])), ulClassName, items.map(function (item) {
          return _this10.createLi(item, type);
        }));
      }
    }, {
      key: "createA",
      value: function createA(item) {
        var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'root';
        var aClassName = this.manifest[type].aClassName;
        return main_core.Tag.render(_templateObject8 || (_templateObject8 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<a class=\"", "\" href=\"", "\" target=\"", "\">", "</a>\n\t\t"])), aClassName, item.href, item.target, main_core.Text.encode(item.text));
      }
    }, {
      key: "createLi",
      value: function createLi(item) {
        var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'root';
        var liClassName = this.manifest[type].liClassName;
        return main_core.Tag.render(_templateObject9 || (_templateObject9 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<li class=\"", "\">\n\t\t\t\t", "\n\t\t\t\t", "\n\t\t\t</li>\n\t\t"])), liClassName, this.createA(item, type), item.children ? this.createList(item.children, 'children') : undefined);
      }
    }, {
      key: "rebuild",
      value: function rebuild(items) {
        var newList = this.createList(items);
        decorateTreeSemantics(newList);
        main_core.Dom.replace(this.root, newList);
        this.root = newList;
        this.setupTreeFocusZone();
      }
    }], [{
      key: "prefetchLandings",
      value:
      /**
       * Prefetches all site landings into Backend cache before menu forms are built.
       * Deduplicates concurrent calls within the same editor session.
       * block.js calls this statically before getEditForms() for blocks with menu nodes,
       * so this method must ship together with block.js (see ticket 247221/250505).
       */
      function prefetchLandings() {
        if (Menu.prefetchLandingsPromise !== null) {
          return Menu.prefetchLandingsPromise;
        }
        Menu.prefetchLandingsPromise = landing_backend.Backend.getInstance().getLandings({
          siteId: landing_env.Env.getInstance().getSiteId()
        }).then(function () {}).catch(function (error) {
          Menu.prefetchLandingsPromise = null;
          throw error;
        });
        return Menu.prefetchLandingsPromise;
      }
    }]);
  }(main_core.Event.EventEmitter);
  babelHelpers.defineProperty(Menu, "prefetchLandingsPromise", null);
  exports.Menu = Menu;
})(this.BX.Landing.Menu = this.BX.Landing.Menu || {}, BX, BX.Landing, BX.Landing, BX.Landing, BX.Landing, BX.Landing.Menu, BX.Landing.UI.Form, BX.Landing.UI.Panel, BX.Landing.UI);
//# sourceMappingURL=menu.bundle.js.map
