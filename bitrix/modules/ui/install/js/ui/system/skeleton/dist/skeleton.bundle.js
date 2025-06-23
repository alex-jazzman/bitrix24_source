/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
(function (exports,main_core) {
	'use strict';

	let _ = t => t,
	  _t;
	var _params = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("params");
	var _getStyleString = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getStyleString");
	class Line {
	  constructor(params) {
	    Object.defineProperty(this, _getStyleString, {
	      value: _getStyleString2
	    });
	    Object.defineProperty(this, _params, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _params)[_params] = {
	      height: 24,
	      borderRadius: 12,
	      ...params,
	      width: main_core.Type.isUndefined(params.width) ? null : params.width
	    };
	  }
	  render() {
	    const style = babelHelpers.classPrivateFieldLooseBase(this, _getStyleString)[_getStyleString]();
	    const classNames = ['ui-skeleton-line', babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].className].filter(Boolean).join(' ');
	    return main_core.Tag.render(_t || (_t = _`<div class="${0}" style="${0}"></div>`), classNames, style);
	  }
	}
	function _getStyleString2() {
	  const widthValue = babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].width === null ? '100%' : `${babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].width}px`;
	  return [`width: ${widthValue}`, `height: ${babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].height}px`, `border-radius: ${babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].borderRadius}px`].join('; ');
	}

	let _$1 = t => t,
	  _t$1;
	var _params$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("params");
	var _getStyleString$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getStyleString");
	class Circle {
	  constructor(params = {}) {
	    Object.defineProperty(this, _getStyleString$1, {
	      value: _getStyleString2$1
	    });
	    Object.defineProperty(this, _params$1, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _params$1)[_params$1] = {
	      size: 40,
	      ...params
	    };
	  }
	  render() {
	    const style = babelHelpers.classPrivateFieldLooseBase(this, _getStyleString$1)[_getStyleString$1]();
	    const classNames = ['ui-skeleton-circle', babelHelpers.classPrivateFieldLooseBase(this, _params$1)[_params$1].className].filter(Boolean).join(' ');
	    return main_core.Tag.render(_t$1 || (_t$1 = _$1`<div class="${0}" style="${0}"></div>`), classNames, style);
	  }
	}
	function _getStyleString2$1() {
	  return [`width: ${babelHelpers.classPrivateFieldLooseBase(this, _params$1)[_params$1].size}px`, `height: ${babelHelpers.classPrivateFieldLooseBase(this, _params$1)[_params$1].size}px`].join('; ');
	}

	exports.Line = Line;
	exports.Circle = Circle;

}((this.BX.UI.System = this.BX.UI.System || {}),BX));
//# sourceMappingURL=skeleton.bundle.js.map
