/* eslint-disable */
this.BX = this.BX || {};
(function (exports,main_core) {
	'use strict';

	/**
	 * @namespace {BX.UI}
	 */
	class AlertColor {}
	AlertColor.DEFAULT = 'ui-alert-default';
	AlertColor.DANGER = 'ui-alert-danger';
	AlertColor.SUCCESS = 'ui-alert-success';
	AlertColor.WARNING = 'ui-alert-warning';
	AlertColor.PRIMARY = 'ui-alert-primary';
	AlertColor.INFO = 'ui-alert-info';

	/**
	 * @namespace {BX.UI}
	 */
	class AlertSize {}
	AlertSize.MD = 'ui-alert-md';
	AlertSize.XS = 'ui-alert-xs';

	/**
	 * @namespace {BX.UI}
	 */
	class AlertIcon {}
	AlertIcon.NONE = '';
	AlertIcon.INFO = 'ui-alert-icon-info';
	AlertIcon.WARNING = 'ui-alert-icon-warning';
	AlertIcon.DANGER = 'ui-alert-icon-danger';
	AlertIcon.FORBIDDEN = 'ui-alert-icon-forbidden';

	let _ = t => t,
	  _t;
	var _text = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("text");
	var _color = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("color");
	var _size = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("size");
	var _icon = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("icon");
	var _closeBtn = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("closeBtn");
	var _animated = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("animated");
	var _customClass = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("customClass");
	var _beforeMessageHtml = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("beforeMessageHtml");
	var _afterMessageHtml = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("afterMessageHtml");
	var _container = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("container");
	var _textContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("textContainer");
	var _classList = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("classList");
	var _closeNode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("closeNode");
	var _handleCloseBtnClick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleCloseBtnClick");
	var _setClassList = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setClassList");
	var _getClassList = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getClassList");
	class Alert {
	  constructor(options) {
	    Object.defineProperty(this, _getClassList, {
	      value: _getClassList2
	    });
	    Object.defineProperty(this, _setClassList, {
	      value: _setClassList2
	    });
	    Object.defineProperty(this, _handleCloseBtnClick, {
	      value: _handleCloseBtnClick2
	    });
	    Object.defineProperty(this, _text, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _color, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _size, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _icon, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _closeBtn, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _animated, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _customClass, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _beforeMessageHtml, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _afterMessageHtml, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _container, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _textContainer, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _classList, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _closeNode, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _text)[_text] = options.text;
	    babelHelpers.classPrivateFieldLooseBase(this, _color)[_color] = options.color;
	    babelHelpers.classPrivateFieldLooseBase(this, _size)[_size] = options.size;
	    babelHelpers.classPrivateFieldLooseBase(this, _icon)[_icon] = options.icon;
	    babelHelpers.classPrivateFieldLooseBase(this, _closeBtn)[_closeBtn] = options.closeBtn === true;
	    babelHelpers.classPrivateFieldLooseBase(this, _animated)[_animated] = options.animated === true;
	    babelHelpers.classPrivateFieldLooseBase(this, _customClass)[_customClass] = options.customClass;
	    babelHelpers.classPrivateFieldLooseBase(this, _beforeMessageHtml)[_beforeMessageHtml] = main_core.Type.isElementNode(options.beforeMessageHtml) ? options.beforeMessageHtml : undefined;
	    babelHelpers.classPrivateFieldLooseBase(this, _afterMessageHtml)[_afterMessageHtml] = main_core.Type.isElementNode(options.afterMessageHtml) ? options.afterMessageHtml : undefined;
	    this.setText(babelHelpers.classPrivateFieldLooseBase(this, _text)[_text]);
	    this.setSize(babelHelpers.classPrivateFieldLooseBase(this, _size)[_size]);
	    this.setIcon(babelHelpers.classPrivateFieldLooseBase(this, _icon)[_icon]);
	    this.setColor(babelHelpers.classPrivateFieldLooseBase(this, _color)[_color]);
	    this.setCloseBtn(babelHelpers.classPrivateFieldLooseBase(this, _closeBtn)[_closeBtn]);
	    this.setCustomClass(babelHelpers.classPrivateFieldLooseBase(this, _customClass)[_customClass]);
	  }

	  // region COLOR
	  setColor(color) {
	    babelHelpers.classPrivateFieldLooseBase(this, _color)[_color] = color;
	    babelHelpers.classPrivateFieldLooseBase(this, _setClassList)[_setClassList]();
	  }
	  getColor() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _color)[_color];
	  }

	  // endregion

	  // region SIZE
	  setSize(size) {
	    babelHelpers.classPrivateFieldLooseBase(this, _size)[_size] = size;
	    babelHelpers.classPrivateFieldLooseBase(this, _setClassList)[_setClassList]();
	  }
	  getSize() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _size)[_size];
	  }

	  // endregion

	  // region ICON
	  setIcon(icon) {
	    babelHelpers.classPrivateFieldLooseBase(this, _icon)[_icon] = icon;
	    babelHelpers.classPrivateFieldLooseBase(this, _setClassList)[_setClassList]();
	  }
	  getIcon() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _icon)[_icon];
	  }

	  // endregion

	  // region TEXT
	  setText(text) {
	    if (main_core.Type.isStringFilled(text)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _text)[_text] = text;
	      this.getTextContainer().innerHTML = text;
	    }
	  }
	  getText() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _text)[_text];
	  }
	  getTextContainer() {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _textContainer)[_textContainer]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _textContainer)[_textContainer] = main_core.Dom.create('span', {
	        props: {
	          className: 'ui-alert-message'
	        },
	        html: babelHelpers.classPrivateFieldLooseBase(this, _text)[_text]
	      });
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _textContainer)[_textContainer];
	  }

	  // endregion

	  // region CLOSE BTN
	  setCloseBtn(closeBtn) {
	    babelHelpers.classPrivateFieldLooseBase(this, _closeBtn)[_closeBtn] = closeBtn;
	  }
	  getCloseBtn() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _closeBtn)[_closeBtn] !== true) {
	      return undefined;
	    }
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _closeNode)[_closeNode] && babelHelpers.classPrivateFieldLooseBase(this, _closeBtn)[_closeBtn] === true) {
	      babelHelpers.classPrivateFieldLooseBase(this, _closeNode)[_closeNode] = main_core.Dom.create('span', {
	        props: {
	          className: 'ui-alert-close-btn'
	        },
	        events: {
	          click: babelHelpers.classPrivateFieldLooseBase(this, _handleCloseBtnClick)[_handleCloseBtnClick].bind(this)
	        }
	      });
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _closeNode)[_closeNode];
	  }
	  // endregion

	  // region Custom HTML
	  setBeforeMessageHtml(element) {
	    if (main_core.Type.isElementNode(element) && element !== false) {
	      babelHelpers.classPrivateFieldLooseBase(this, _beforeMessageHtml)[_beforeMessageHtml] = element;
	    }
	  }
	  getBeforeMessageHtml() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _beforeMessageHtml)[_beforeMessageHtml];
	  }
	  setAfterMessageHtml(element) {
	    if (main_core.Type.isElementNode(element) && element !== false) {
	      babelHelpers.classPrivateFieldLooseBase(this, _afterMessageHtml)[_afterMessageHtml] = element;
	    }
	  }
	  getAfterMessageHtml() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _afterMessageHtml)[_afterMessageHtml];
	  }

	  // endregion

	  // region CUSTOM CLASS
	  setCustomClass(customClass) {
	    babelHelpers.classPrivateFieldLooseBase(this, _customClass)[_customClass] = customClass;
	    this.updateClassList();
	  }
	  getCustomClass() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _customClass)[_customClass];
	  }

	  // endregion

	  // region CLASS LIST

	  updateClassList() {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _container)[_container]) {
	      this.getContainer();
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _container)[_container].setAttribute('class', babelHelpers.classPrivateFieldLooseBase(this, _classList)[_classList]);
	  }

	  // endregion

	  // region ANIMATION
	  animateOpening() {
	    main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container], {
	      overflow: 'hidden',
	      height: 0,
	      paddingTop: 0,
	      paddingBottom: 0,
	      marginBottom: 0,
	      opacity: 0
	    });
	    setTimeout(() => {
	      main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container], {
	        overflow: 'hidden',
	        height: `${babelHelpers.classPrivateFieldLooseBase(this, _container)[_container].scrollHeight}px`,
	        paddingTop: null,
	        paddingBottom: null,
	        marginBottom: null,
	        opacity: null
	      });
	      main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container], {
	        height: null
	      });
	    }, 10);
	    setTimeout(() => {
	      main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container], {
	        height: null
	      });
	    }, 200);
	  }
	  animateClosing() {
	    main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container], {
	      overflow: 'hidden'
	    });
	    const alertWrapPos = main_core.Dom.getPosition(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container]);
	    main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container], {
	      height: `${alertWrapPos.height}px`
	    });
	    setTimeout(() => {
	      main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container], {
	        height: 0,
	        paddingTop: 0,
	        paddingBottom: 0,
	        marginBottom: 0,
	        opacity: 0
	      });
	    }, 10);
	    setTimeout(() => {
	      main_core.Dom.remove(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container]);
	    }, 260);
	  }

	  // endregion

	  show() {
	    this.animateOpening();
	  }
	  hide() {
	    this.animateClosing();
	  }
	  getContainer() {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _container)[_container]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _container)[_container] = main_core.Tag.render(_t || (_t = _`<div class="${0}">${0}</div>`), babelHelpers.classPrivateFieldLooseBase(this, _getClassList)[_getClassList](), this.getTextContainer());
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _animated)[_animated] === true) {
	      this.animateOpening();
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _closeBtn)[_closeBtn] === true) {
	      main_core.Dom.append(this.getCloseBtn(), babelHelpers.classPrivateFieldLooseBase(this, _container)[_container]);
	    }
	    if (main_core.Type.isElementNode(babelHelpers.classPrivateFieldLooseBase(this, _beforeMessageHtml)[_beforeMessageHtml])) {
	      main_core.Dom.prepend(this.getBeforeMessageHtml(), this.getTextContainer());
	    }
	    if (main_core.Type.isElementNode(babelHelpers.classPrivateFieldLooseBase(this, _afterMessageHtml)[_afterMessageHtml])) {
	      main_core.Dom.append(this.getAfterMessageHtml(), this.getTextContainer());
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _container)[_container];
	  }
	  render() {
	    return this.getContainer();
	  }
	  renderTo(node) {
	    if (main_core.Type.isDomNode(node)) {
	      main_core.Dom.append(this.getContainer(), node);
	      return this.getContainer();
	    }
	    return null;
	  }
	  destroy() {
	    main_core.Dom.remove(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container]);
	    babelHelpers.classPrivateFieldLooseBase(this, _container)[_container] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _textContainer)[_textContainer] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _closeNode)[_closeNode] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _beforeMessageHtml)[_beforeMessageHtml] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _afterMessageHtml)[_afterMessageHtml] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _classList)[_classList] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _text)[_text] = null;
	  }
	}
	function _handleCloseBtnClick2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _animated)[_animated] === true) {
	    this.animateClosing();
	  } else {
	    main_core.Dom.remove(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container]);
	  }
	}
	function _setClassList2() {
	  const classList = ['ui-alert'];
	  classList.push(this.getColor(), this.getSize(), this.getIcon(), this.getCustomClass());
	  babelHelpers.classPrivateFieldLooseBase(this, _classList)[_classList] = classList.filter(val => val).join(' ').trim();
	  this.updateClassList();
	}
	function _getClassList2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _classList)[_classList];
	}
	Alert.Color = AlertColor;
	Alert.Size = AlertSize;
	Alert.Icon = AlertIcon;

	exports.Alert = Alert;
	exports.AlertColor = AlertColor;
	exports.AlertSize = AlertSize;
	exports.AlertIcon = AlertIcon;

}((this.BX.UI = this.BX.UI || {}),BX));
//# sourceMappingURL=alert.bundle.js.map
