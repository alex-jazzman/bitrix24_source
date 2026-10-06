/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.UI = this.BX.Landing.UI || {};
(function (exports, main_core, landing_loc, landing_ui_form_baseform) {
'use strict';

/**
 * @memberOf BX.Landing.UI.Form
 */
var _templateObject;
var CardForm = /*#__PURE__*/function (_landing_ui_form_base) {
  function CardForm(options) {
    var _this;
    _this = _landing_ui_form_base.call(this, options) || this;
    _this.setEventNamespace('BX.Landing.UI.Form.CardForm');
    main_core.Dom.addClass(_this.layout, 'landing-ui-form-card');
    _this.onItemClick = main_core.Runtime.throttle(_this.onItemClick, 200, _this);
    _this.onRemoveItemClick = _this.onRemoveItemClick.bind(_this);
    _this.onHeaderKeyDown = _this.onHeaderKeyDown.bind(_this);
    _this.onDragButtonClick = _this.onDragButtonClick.bind(_this);
    _this.titleId = "landing-card-title-".concat(_this.id);
    _this.bodyId = "landing-card-body-".concat(_this.id);
    _this.wrapper = _this.getWrapper();
    _this.labelBindings = options.labelBindings;
    _this.preset = options.preset;
    var _this$selector$split = _this.selector.split('@');
    var _this$selector$split2 = babelHelpers.slicedToArray(_this$selector$split, 2);
    _this.oldIndex = _this$selector$split2[1];
    return _this;
  }
  babelHelpers.inherits(CardForm, _landing_ui_form_base);
  var _proto = CardForm.prototype;
  _proto.getWrapper = function getWrapper() {
    var wrapper = main_core.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-form-cards-item\">\n\t\t\t\t<div class=\"landing-ui-form-cards-item-inner\">\n\t\t\t\t\t<div\n\t\t\t\t\t\tclass=\"landing-ui-form-card-item-header\"\n\t\t\t\t\t\trole=\"button\"\n\t\t\t\t\t\ttabindex=\"0\"\n\t\t\t\t\t\taria-expanded=\"false\"\n\t\t\t\t\t\taria-controls=\"", "\"\n\t\t\t\t\t\taria-labelledby=\"", "\"\n\t\t\t\t\t>\n\t\t\t\t\t\t<div class=\"landing-ui-form-card-item-header-left\">\n\t\t\t\t\t\t\t<div class=\"landing-ui-form-card-item-header-left-inner\">\n\t\t\t\t\t\t\t\t<span\n\t\t\t\t\t\t\t\t\tclass=\"landing-ui-form-card-item-header-drag landing-ui-drag\"\n\t\t\t\t\t\t\t\t\trole=\"button\"\n\t\t\t\t\t\t\t\t\ttabindex=\"0\"\n\t\t\t\t\t\t\t\t\taria-label=\"", "\"\n\t\t\t\t\t\t\t\t\taria-keyshortcuts=\"Alt+ArrowUp Alt+ArrowDown\"\n\t\t\t\t\t\t\t\t></span>\n\t\t\t\t\t\t\t\t<span class=\"landing-ui-form-card-item-header-title\" id=\"", "\">", "</span>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t<div class=\"landing-ui-form-card-item-header-edit\" aria-hidden=\"true\">\n\t\t\t\t\t\t\t\t<span class=\"fa fa-pencil\"></span>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"landing-ui-form-card-item-header-right\">\n\t\t\t\t\t\t\t<button\n\t\t\t\t\t\t\t\ttype=\"button\"\n\t\t\t\t\t\t\t\tclass=\"landing-ui-form-card-item-header-remove\"\n\t\t\t\t\t\t\t\taria-label=\"", "\"\n\t\t\t\t\t\t\t>\n\t\t\t\t\t\t\t\t<span class=\"fa fa-remove\" aria-hidden=\"true\"></span>\n\t\t\t\t\t\t\t</button>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t\t", "\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t"])), this.bodyId, this.titleId, landing_loc.Loc.getMessage('LANDING_CARDS_FORM_DRAG_HANDLE_LABEL'), this.titleId, this.label, landing_loc.Loc.getMessage('LANDING_CARDS_FORM_REMOVE_LABEL'), this.getNode());
    this.header = wrapper.querySelector('.landing-ui-form-card-item-header');
    this.dragButton = wrapper.querySelector('.landing-ui-form-card-item-header-drag');
    this.removeButton = wrapper.querySelector('.landing-ui-form-card-item-header-remove');
    main_core.Event.bind(this.header, 'click', this.onItemClick);
    main_core.Event.bind(this.header, 'keydown', this.onHeaderKeyDown);
    main_core.Event.bind(this.dragButton, 'click', this.onDragButtonClick);
    main_core.Event.bind(this.removeButton, 'click', this.onRemoveItemClick);
    main_core.Dom.attr(this.getNode(), 'id', this.bodyId);
    this.setExpanded(false);
    return wrapper;
  };
  _proto.setExpanded = function setExpanded(expanded) {
    var body = this.getNode();
    main_core.Dom.attr(this.header, 'aria-expanded', expanded ? 'true' : 'false');

    // `inert` keeps the collapsed body measurable (height/transition unchanged)
    // while removing its fields from Tab order and the accessibility tree —
    // unlike `display:none`, which would break the expand animation.
    if (expanded) {
      body.removeAttribute('inert');
    } else {
      main_core.Dom.attr(body, 'inert', '');
    }
  };
  _proto.getTitleText = function getTitleText() {
    var titleNode = this.wrapper ? this.wrapper.querySelector('.landing-ui-form-card-item-header-title') : null;
    return titleNode ? titleNode.textContent : '';
  };
  _proto.onHeaderKeyDown = function onHeaderKeyDown(event) {
    if (event.target !== event.currentTarget) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      this.onItemClick(event);
    }
  }

  // eslint-disable-next-line class-methods-use-this
;
  _proto.onDragButtonClick = function onDragButtonClick(event) {
    event.preventDefault();
    event.stopPropagation();
  };
  _proto.onItemClick = function onItemClick(event) {
    event.preventDefault();
    if (main_core.Type.isDomNode(event.currentTarget)) {
      var target = event.currentTarget.closest('.landing-ui-form-cards-item');
      if (!main_core.Dom.hasClass(target, 'landing-ui-form-cards-item-expand')) {
        main_core.Dom.addClass(target, 'landing-ui-form-cards-item-expand');
        BX.Landing.Utils.onTransitionEnd(target).then(function () {
          main_core.Dom.style(target, {
            overflow: 'visible'
          });
        });
        main_core.Dom.style(target, {
          height: 'auto'
        });
        this.setExpanded(true);
      } else {
        main_core.Dom.removeClass(target, 'landing-ui-form-cards-item-expand');
        main_core.Dom.style(target, null);
        this.setExpanded(false);
      }
    }
  };
  _proto.onRemoveItemClick = function onRemoveItemClick(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.getLayout().closest('.landing-ui-disallow-remove')) {
      main_core.Dom.remove(this.wrapper);
      this.emit('onRemove');
    }
  };
  _proto.serialize = function serialize() {
    return this.fields.reduce(function (res, field) {
      var _field$selector$split = field.selector.split('@'),
        _field$selector$split2 = babelHelpers.slicedToArray(_field$selector$split, 1),
        index = _field$selector$split2[0];
      res[index] = field.getValue();
      return res;
    }, {});
  };
  _proto.getPreset = function getPreset() {
    return this.preset || null;
  };
  return CardForm;
}(landing_ui_form_baseform.BaseForm);
exports.CardForm = CardForm;
})(this.BX.Landing.UI.Form = this.BX.Landing.UI.Form || {}, BX, BX.Landing, BX.Landing.UI.Form);
//# sourceMappingURL=cardform.bundle.js.map
