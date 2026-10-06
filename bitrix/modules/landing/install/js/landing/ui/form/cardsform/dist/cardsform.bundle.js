/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.UI = this.BX.Landing.UI || {};
(function (exports, landing_ui_form_baseform, landing_ui_collection_formcollection, landing_loc, landing_ui_a11y, landing_ui_panel_content, main_core, landing_ui_form_cardform, ui_draganddrop_draggable, landing_pageobject, main_core_events, landing_ui_field_textfield) {
  'use strict';
  function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
  function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { babelHelpers.defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }

  var CardsForm = /*#__PURE__*/function (_landing_ui_form_base) {
    function CardsForm() {
      var _this;
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      babelHelpers.classCallCheck(this, CardsForm);
      _this = _landing_ui_form_base.call(this, options) || this;
      main_core.Dom.addClass(_this.layout, 'landing-ui-form-cards');
      _this.type = 'cards';
      _this.code = options.code;
      _this.id = "".concat(_this.code.replace('.', ''), "-").concat(main_core.Text.getRandom());
      _this.presets = options.presets;
      _this.childForms = new landing_ui_collection_formcollection.FormCollection();
      _this.presetForm = new landing_ui_collection_formcollection.FormCollection();
      _this.sync = options.sync;
      _this.forms = options.forms;
      _this.wheelEventName = window.onwheel ? 'wheel' : 'mousewheel';
      _this.onFormRemove = _this.onFormRemove.bind(_this);
      _this.onAddCardClick = _this.onAddCardClick.bind(_this);
      _this.onMouseWheel = _this.onMouseWheel.bind(_this);
      _this.onDragEnd = _this.onDragEnd.bind(_this);
      _this.onDragHandleKeyDown = _this.onDragHandleKeyDown.bind(_this);
      _this.addButton = _this.createAddButton();
      _this.draggable = new ui_draganddrop_draggable.Draggable({
        container: _this.body,
        context: parent.window,
        draggable: '.landing-ui-form-cards-item',
        dragElement: '.landing-ui-form-card-item-header-drag',
        type: ui_draganddrop_draggable.Draggable.MOVE,
        offset: {
          y: -65
        }
      });
      _this.draggable.subscribe('end', _this.onDragEnd);
      main_core.Event.bind(_this.body, 'keydown', _this.onDragHandleKeyDown);
      setTimeout(function () {
        _this.value = _this.serialize();
      });
      _this.adjustLastFormState();
      main_core.Dom.append(_this.addButton.layout, _this.footer);
      return _this;
    }
    babelHelpers.inherits(CardsForm, _landing_ui_form_base);
    return babelHelpers.createClass(CardsForm, [{
      key: "createAddButton",
      value: function createAddButton() {
        return new BX.Landing.UI.Button.BaseButton("add-card-".concat(main_core.Text.getRandom()), {
          className: 'landing-ui-card-add-button',
          text: landing_loc.Loc.getMessage('LANDING_CARDS_FORM_ADD_BUTTON'),
          onClick: this.onAddCardClick
        });
      }
    }, {
      key: "onFormRemove",
      value: function onFormRemove(event) {
        this.childForms.remove(event.getTarget());
        this.sortForms();
        this.adjustLastFormState();
      }
    }, {
      key: "onDragEnd",
      value: function onDragEnd() {
        var _this2 = this;
        // @todo: Need add sort:end event for Draggable
        setTimeout(function () {
          _this2.sortForms();
        });
      }
    }, {
      key: "sortForms",
      value: function sortForms() {
        var children = babelHelpers.toConsumableArray(this.body.children);
        this.childForms.sort(function (a, b) {
          var aIndex = parseInt(children.indexOf(a.wrapper));
          var bIndex = parseInt(children.indexOf(b.wrapper));
          return aIndex < bIndex ? -1 : 1;
        });
        this.childForms.forEach(function (form, index) {
          var _form$selector$split = form.selector.split('@'),
            _form$selector$split2 = babelHelpers.slicedToArray(_form$selector$split, 1),
            code = _form$selector$split2[0];
          form.selector = "".concat(code, "@").concat(index);
        });
      }
    }, {
      key: "onDragHandleKeyDown",
      value: function onDragHandleKeyDown(event) {
        if (!event.altKey || event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
          return;
        }
        var handle = event.target.closest('.landing-ui-form-card-item-header-drag');
        if (!handle) {
          return;
        }
        var wrapper = handle.closest('.landing-ui-form-cards-item');
        var form = wrapper ? this.childForms.find(function (item) {
          return item.wrapper === wrapper;
        }) : null;
        if (!form) {
          return;
        }
        event.preventDefault();
        this.moveCard(form, event.key === 'ArrowUp' ? 'up' : 'down');
      }
    }, {
      key: "moveCard",
      value: function moveCard(form, direction) {
        var items = this.getVisibleForms();
        var sourceElement = form.wrapper;
        var index = items.indexOf(sourceElement);
        if (index === -1) {
          return;
        }
        var targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= items.length) {
          this.announceCardMove(form, direction, false);
          return;
        }
        var targetElement = items[targetIndex];
        if (direction === 'up') {
          main_core.Dom.insertBefore(sourceElement, targetElement);
        } else {
          main_core.Dom.insertAfter(sourceElement, targetElement);
        }
        this.sortForms();
        this.draggable.invalidateCache();
        var handle = sourceElement.querySelector('.landing-ui-form-card-item-header-drag');
        if (handle) {
          handle.focus();
        }
        this.announceCardMove(form, direction, true);
      }

      // eslint-disable-next-line class-methods-use-this
    }, {
      key: "announceCardMove",
      value: function announceCardMove(form, direction, moved) {
        var title = form.getTitleText();
        var phraseCode;
        if (moved) {
          phraseCode = direction === 'up' ? 'LANDING_CARDS_FORM_MOVED_UP' : 'LANDING_CARDS_FORM_MOVED_DOWN';
        } else {
          phraseCode = direction === 'up' ? 'LANDING_CARDS_FORM_MOVE_BLOCKED_TOP' : 'LANDING_CARDS_FORM_MOVE_BLOCKED_BOTTOM';
        }
        landing_ui_a11y.A11y.announce(landing_loc.Loc.getMessage(phraseCode).replace('#TITLE#', function () {
          return title;
        }));
      }
    }, {
      key: "addChildForm",
      value: function addChildForm(form) {
        this.childForms.add(form);
        form.subscribe('onRemove', this.onFormRemove);
        main_core.Dom.append(form.wrapper, this.body);
        this.adjustLastFormState();
      }
    }, {
      key: "addPresetForm",
      value: function addPresetForm(form) {
        this.presetForm.add(form);
        form.wrapper.hidden = true;
        main_core.Dom.append(form.wrapper, this.body);
        this.adjustLastFormState();
      }
    }, {
      key: "onAddCardClick",
      value: function onAddCardClick() {
        if (main_core.Type.isPlainObject(this.presets) && Object.keys(this.presets).length > 0) {
          this.showPresetsPopup();
        } else {
          this.addCardFromFirst();
        }
      }
    }, {
      key: "onPresetItemClick",
      value: function onPresetItemClick(presetId) {
        var preset = this.presets[presetId];
        var newForm = this.presetForm.find(function (form) {
          return form.preset.id === presetId;
        }).clone();
        newForm.selector = "".concat(newForm.selector.split('@')[0], "@").concat(this.childForms.length);
        newForm.oldIndex = this.childForms.length;
        newForm.preset = main_core.Runtime.clone(preset);
        newForm.preset.id = presetId;
        this.addChildForm(newForm);
        this.adjustLastFormState();
        this.popup.close();
        if (main_core.Type.isPlainObject(preset.values)) {
          newForm.fields.forEach(function (field) {
            var code = field.selector.split('@')[0];
            if (code in preset.values) {
              field.setValue(preset.values[code]);
              if (field instanceof landing_ui_field_textfield.TextField) {
                BX.fireEvent(field.input, 'input');
              }
            }
            if (main_core.Type.isArray(preset.disallow)) {
              var isDisallow = !!preset.disallow.find(function (fieldCode) {
                return code === fieldCode;
              });
              if (isDisallow) {
                field.layout.hidden = true;
              }
            }
          });
        }
      }
    }, {
      key: "showPresetsPopup",
      value: function showPresetsPopup() {
        var _this3 = this;
        if (this.popup) {
          CardsForm.popups.map(function (popup) {
            popup.popupWindow.close();
            popup.popupWindow.destroy();
          });
        }
        this.popup = new BX.PopupMenuWindow({
          id: 'cards_list_' + main_core.Text.getRandom(),
          bindElement: this.addButton.layout,
          items: Object.keys(this.presets).map(function (preset) {
            return {
              html: _this3.presets[preset].name,
              className: 'landing-ui-form-cards-preset-popup-item menu-popup-no-icon',
              onclick: _this3.onPresetItemClick.bind(_this3, preset)
            };
          }),
          autoHide: true,
          maxHeight: 176,
          minHeight: 87
        });
        CardsForm.popups.push(this.popup);
        main_core.Event.bind(this.popup.popupWindow.popupContainer, 'mouseover', this.onMouseOver.bind(this));
        main_core.Event.bind(this.popup.popupWindow.popupContainer, 'mouseleave', this.onMouseLeave.bind(this));
        var rootWindow = landing_pageobject.PageObject.getRootWindow();
        main_core.Event.bind(rootWindow.document, 'click', this.onDocumentClick.bind(this));
        main_core.Dom.append(this.popup.popupWindow.popupContainer, this.addButton.layout.closest('.landing-ui-panel-content-body-content'));
        this.popup.popupWindow.show();
        this.adjustPopupPosition();
      }
    }, {
      key: "onMouseOver",
      value: function onMouseOver() {
        var container = this.popup.popupWindow.getPopupContainer();
        main_core.Event.bind(container, this.wheelEventName, this.onMouseWheel, true);
        main_core.Event.bind(container, 'touchmove', this.onMouseWheel, true);
      }
    }, {
      key: "onMouseLeave",
      value: function onMouseLeave() {
        var container = this.popup.popupWindow.getPopupContainer();
        main_core.Event.unbind(container, this.wheelEventName, this.onMouseWheel, true);
        main_core.Event.unbind(container, 'touchmove', this.onMouseWheel, true);
      }
    }, {
      key: "onMouseWheel",
      value: function onMouseWheel(event) {
        var _this4 = this;
        event.stopPropagation();
        event.preventDefault();
        var delta = landing_ui_panel_content.Content.getDeltaFromEvent(event);
        var _this$popup$popupWind = this.popup.popupWindow.getContentContainer(),
          scrollTop = _this$popup$popupWind.scrollTop;
        requestAnimationFrame(function () {
          _this4.popup.popupWindow.contentContainer.scrollTop = scrollTop - delta.y;
        });
      }
    }, {
      key: "onDocumentClick",
      value: function onDocumentClick(event) {
        if (this.popup.popupWindow && !main_core.Dom.hasClass(event.target, 'landing-ui-button-text') && !main_core.Dom.hasClass(event.target, 'landing-ui-card-add-button')) {
          this.popup.popupWindow.close();
        }
      }
    }, {
      key: "adjustPopupPosition",
      value: function adjustPopupPosition() {
        var _this5 = this;
        if (this.popup.popupWindow) {
          requestAnimationFrame(function () {
            var offsetParent = _this5.addButton.layout.closest('.landing-ui-panel-content-body-content');
            var buttonTop = BX.Landing.Utils.offsetTop(_this5.addButton.layout, offsetParent);
            var buttonLeft = BX.Landing.Utils.offsetLeft(_this5.addButton.layout, offsetParent);
            var buttonRect = _this5.addButton.layout.getBoundingClientRect();
            var popupRect = _this5.popup.popupWindow.popupContainer.getBoundingClientRect();
            var yOffset = 14;
            _this5.popup.popupWindow.popupContainer.style.top = "".concat(buttonTop + buttonRect.height + yOffset, "px");
            _this5.popup.popupWindow.popupContainer.style.left = "".concat(buttonLeft - popupRect.width / 2 + buttonRect.width / 2, "px");
            _this5.popup.popupWindow.setAngle({
              offset: 83,
              position: 'top'
            });
          });
        }
      }
    }, {
      key: "addCardFromFirst",
      value: function addCardFromFirst() {
        var newData = main_core.Runtime.clone(this.childForms[0].data);
        var newSelector = "".concat(newData.selector.split('@')[0], "@").concat(this.childForms.length);
        newData.selector = newSelector;
        var newForm = this.childForms[0].clone(newData);
        newForm.oldIndex = this.childForms.length;
        newForm.selector = newSelector;
        this.addChildForm(newForm);
        this.adjustLastFormState();
      }
    }, {
      key: "resetCardFields",
      value: function resetCardFields(form) {
        if (!main_core.Type.isObject(form)) {
          return;
        }
        form.fields.forEach(function (field) {
          if (main_core.Type.isFunction(field.reset)) {
            field.reset();
          }
        });
      }
    }, {
      key: "getVisibleForms",
      value: function getVisibleForms() {
        return babelHelpers.toConsumableArray(this.body.children).filter(function (item) {
          return !item.hidden;
        });
      }
    }, {
      key: "adjustLastFormState",
      value: function adjustLastFormState() {
        var visibleItems = this.getVisibleForms();
        if (visibleItems.length === 1) {
          main_core.Dom.addClass(visibleItems[0], 'landing-ui-disallow-remove');
          return;
        }
        babelHelpers.toConsumableArray(visibleItems).forEach(function (item) {
          main_core.Dom.removeClass(item, 'landing-ui-disallow-remove');
        });
      }
    }, {
      key: "serialize",
      value: function serialize() {
        return this.childForms.map(function (form) {
          return form.serialize();
        });
      }

      /**
       * Gets indexes map
       * @return {Object}
       */
    }, {
      key: "getIndexesMap",
      value: function getIndexesMap() {
        return this.childForms.reduce(function (acc, form, index) {
          return _objectSpread(_objectSpread({}, acc), {}, babelHelpers.defineProperty({}, index, form.oldIndex));
        }, {});
      }
    }, {
      key: "getUsedPresets",
      value: function getUsedPresets() {
        return this.childForms.reduce(function (acc, form) {
          if (main_core.Type.isPlainObject(form.preset)) {
            var _form$selector$split3 = form.selector.split('@'),
              _form$selector$split4 = babelHelpers.slicedToArray(_form$selector$split3, 2),
              index = _form$selector$split4[1];
            acc[index] = form.preset.id;
          }
          return acc;
        }, {});
      }
    }, {
      key: "isChanged",
      value: function isChanged() {
        return JSON.stringify(this.value) !== JSON.stringify(this.serialize());
      }
    }]);
  }(landing_ui_form_baseform.BaseForm);
  babelHelpers.defineProperty(CardsForm, "popups", []);
  exports.CardsForm = CardsForm;
})(this.BX.Landing.UI.Form = this.BX.Landing.UI.Form || {}, BX.Landing.UI.Form, BX.Landing.UI.Collection, BX.Landing, BX.Landing.UI, BX.Landing.UI.Panel, BX, BX.Landing.UI.Form, BX.UI.DragAndDrop, BX.Landing, BX.Event, BX.Landing.UI.Field);
//# sourceMappingURL=cardsform.bundle.js.map