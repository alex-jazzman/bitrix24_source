/* eslint-disable */
this.BX = this.BX || {};
(function (exports,main_core_events,main_core) {
	'use strict';

	var matcher = /^rgba? ?\((\d{1,3})[, ]+(\d{1,3})[, ]+(\d{1,3})([, ]+([\d\.]{1,5}))?\)$/i;
	function isRgbString(rgbString) {
	  return !!rgbString.match(matcher);
	}

	var matcherHex = /^#([\da-f]{3}){1,2}$/i;
	function isHex(hex) {
	  return !!hex.trim().match(matcherHex);
	}

	var matcherHsl = /^hsla?\((\d{1,3}), ?(\d{1,3})%, ?(\d{1,3})%(, ?([\d .]+))?\)/i;
	function isHslString(hsla) {
	  return !!hsla.trim().match(matcherHsl);
	}

	function hexToRgb(hex) {
	  if (hex.length === 4) {
	    var r = parseInt("0x".concat(hex[1]).concat(hex[1]), 16);
	    var g = parseInt("0x".concat(hex[2]).concat(hex[2]), 16);
	    var b = parseInt("0x".concat(hex[3]).concat(hex[3]), 16);
	    return {
	      r: r,
	      g: g,
	      b: b
	    };
	  }
	  if (hex.length === 7) {
	    var _r = parseInt("0x".concat(hex[1]).concat(hex[2]), 16);
	    var _g = parseInt("0x".concat(hex[3]).concat(hex[4]), 16);
	    var _b = parseInt("0x".concat(hex[5]).concat(hex[6]), 16);
	    return {
	      r: _r,
	      g: _g,
	      b: _b
	    };
	  }
	  return {
	    r: 255,
	    g: 255,
	    b: 255
	  };
	}

	function rgbToHsla(rgb) {
	  var r = rgb.r / 255;
	  var g = rgb.g / 255;
	  var b = rgb.b / 255;
	  var max = Math.max(r, g, b);
	  var min = Math.min(r, g, b);
	  var h,
	    s,
	    l = (max + min) / 2;
	  // let l = h;
	  // let s;

	  if (max === min) {
	    h = s = 0;
	  } else {
	    var d = max - min;
	    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	    switch (max) {
	      case r:
	        h = (g - b) / d + (g < b ? 6 : 0);
	        break;
	      case g:
	        h = (b - r) / d + 2;
	        break;
	      case b:
	        h = (r - g) / d + 4;
	        break;
	    }
	    h *= 0.6;
	  }
	  return {
	    h: Math.round(h * 100),
	    s: Math.round(s * 100),
	    l: Math.round(l * 100),
	    a: 'a' in rgb ? rgb.a : 1
	  };
	}

	// 	const v = Math.max(r, g, b);
	// 	const diff = v - Math.min(r, g, b);
	// 	const diffc = (c) => {
	// 		return (v - c) / 6 / diff + 1 / 2;
	// 	};
	//
	// 	if (diff === 0)
	// 	{
	// 		h = 0;
	// 		s = 0;
	// 	}
	// 	else
	// 	{
	// 		s = diff / v;
	// 		rdif = diffc(r);
	// 		gdif = diffc(g);
	// 		bdif = diffc(b);
	//
	// 		if (r === v)
	// 		{
	// 			h = bdif - gdif;
	// 		}
	// 		else if (g === v)
	// 		{
	// 			h = (1 / 3) + rdif - bdif;
	// 		}
	// 		else if (b === v)
	// 		{
	// 			h = (2 / 3) + gdif - rdif;
	// 		}
	//
	// 		if (h < 0)
	// 		{
	// 			h += 1;
	// 		}
	// 		else if (h > 1)
	// 		{
	// 			h -= 1;
	// 		}
	// 	}
	//
	// 	return {
	// 		h: h * 360,
	// 		s: s * 100,
	// 		l: v * 100,
	// 		a: rgb.a || 1,
	// 	};
	// }

	function hexToHsl(hex) {
	  var rgb = hexToRgb(hex.trim());
	  return rgbToHsla(rgb);
	}

	function rgbToHex(rgb) {
	  var r = rgb.r.toString(16);
	  var g = rgb.g.toString(16);
	  var b = rgb.b.toString(16);
	  if (r.length === 1) {
	    r = "0" + r;
	  }
	  if (g.length === 1) {
	    g = "0" + g;
	  }
	  if (b.length === 1) {
	    b = "0" + b;
	  }
	  return "#" + r + g + b;
	}

	function hslToRgb(hsl) {
	  // todo: a little not equal with reverce conversion :-/
	  // todo: f.e. hsl(73.53.50) it 166,195,60 and #a5c33c,
	  // todo: but in reverse #a5c33c => 165,195,60
	  // todo: because we save ColorValue in hsl can be some differences
	  var h = hsl.h;
	  var s = hsl.s / 100;
	  var l = hsl.l / 100;
	  var c = (1 - Math.abs(2 * l - 1)) * s;
	  var x = c * (1 - Math.abs(h / 60 % 2 - 1));
	  var m = l - c / 2;
	  var r = 0;
	  var g = 0;
	  var b = 0;
	  if (0 <= h && h < 60) {
	    r = c;
	    g = x;
	    b = 0;
	  } else if (60 <= h && h < 120) {
	    r = x;
	    g = c;
	    b = 0;
	  } else if (120 <= h && h < 180) {
	    r = 0;
	    g = c;
	    b = x;
	  } else if (180 <= h && h < 240) {
	    r = 0;
	    g = x;
	    b = c;
	  } else if (240 <= h && h < 300) {
	    r = x;
	    g = 0;
	    b = c;
	  } else if (300 <= h && h < 360) {
	    r = c;
	    g = 0;
	    b = x;
	  }
	  r = Math.round((r + m) * 255);
	  g = Math.round((g + m) * 255);
	  b = Math.round((b + m) * 255);
	  return {
	    r: r,
	    g: g,
	    b: b
	  };
	}

	function hslToHex(hsl) {
	  var rgb = hslToRgb(hsl);
	  return rgbToHex(rgb);
	}

	function rgbStringToHsla(rgbString) {
	  var matches = rgbString.trim().match(matcher);
	  if (matches.length > 0) {
	    return rgbToHsla({
	      r: main_core.Text.toNumber(matches[1]),
	      g: main_core.Text.toNumber(matches[2]),
	      b: main_core.Text.toNumber(matches[3]),
	      a: matches[5] ? main_core.Text.toNumber(matches[5]) : 1
	    });
	  }
	}

	function hslStringToHsl(hslString) {
	  var matches = hslString.trim().match(matcherHsl);
	  if (matches && matches.length > 0) {
	    return {
	      h: main_core.Text.toNumber(matches[1]),
	      s: main_core.Text.toNumber(matches[2]),
	      l: main_core.Text.toNumber(matches[3]),
	      a: matches[5] ? main_core.Text.toNumber(matches[5]) : 1
	    };
	  }
	}

	var matcher$1 = /^(var\()?((--[\w\d-]*?)(-opacity_([\d_]+)?)?)\)?$/i;
	function isCssVar(css) {
	  return !!css.trim().match(matcher$1);
	}
	function parseCssVar(css) {
	  var matches = css.trim().match(matcher$1);
	  if (!!matches) {
	    var cssVar = {
	      full: matches[2],
	      name: matches[3]
	    };
	    if (matches[3]) {
	      var cssVarWithOpacity = '--primary-opacity-0_';
	      var cssVarWithOpacity0 = '--primary-opacity-0';
	      if (matches[3].startsWith(cssVarWithOpacity0) && !matches[3].startsWith(cssVarWithOpacity)) {
	        cssVar.opacity = 0;
	      }
	      if (matches[3].startsWith(cssVarWithOpacity)) {
	        var newOpacity = matches[3].substr(cssVarWithOpacity.length);
	        if (newOpacity.length === 1 && newOpacity !== 0) {
	          newOpacity = newOpacity / 10;
	        }
	        if (newOpacity.length === 2) {
	          newOpacity = newOpacity / 100;
	        }
	        cssVar.opacity = newOpacity;
	      }
	    }
	    if (matches[5]) {
	      cssVar.opacity = +parseFloat(matches[5].replace('_', '.')).toFixed(1);
	    }
	    return cssVar;
	  }
	  return null;
	}

	var defaultColorValueOptions = {
	  h: 205,
	  s: 1,
	  l: 50,
	  a: 1
	};

	function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
	function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { babelHelpers.defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
	var ColorValue = /*#__PURE__*/function () {
	  /**
	   * For preserve differences between hsl->rgb and rgb->hsl conversions we can save hex
	   * @type {?string}
	   */

	  /**
	   * if set css variable value - save them in '--var-name' format
	   * @type {?string}
	   */

	  function ColorValue(value) {
	    babelHelpers.classCallCheck(this, ColorValue);
	    this.value = defaultColorValueOptions;
	    this.hex = null;
	    this.cssVar = null;
	    this.setValue(value);
	  }
	  babelHelpers.createClass(ColorValue, [{
	    key: "getName",
	    value: function getName() {
	      if (this.hex) {
	        return this.getHex() + '_' + this.getOpacity();
	      }
	      var _this$getHsl = this.getHsl(),
	        h = _this$getHsl.h,
	        s = _this$getHsl.s,
	        l = _this$getHsl.l;
	      return "".concat(h, "-").concat(s, "-").concat(l, "-").concat(this.getOpacity());
	    }
	  }, {
	    key: "setValue",
	    value: function setValue(value) {
	      if (main_core.Type.isObject(value)) {
	        if (value instanceof ColorValue) {
	          this.value = value.getHsla();
	          this.cssVar = value.getCssVar();
	          this.hex = value.getHexOriginal();
	        } else {
	          this.value = _objectSpread(_objectSpread({}, this.value), value);
	        }
	      }
	      if (main_core.Type.isString(value)) {
	        if (isHslString(value)) {
	          this.value = hslStringToHsl(value);
	        } else if (isHex(value)) {
	          this.value = _objectSpread(_objectSpread({}, hexToHsl(value)), {}, {
	            a: defaultColorValueOptions.a
	          });
	          this.hex = value;
	        } else if (isRgbString(value)) {
	          this.value = rgbStringToHsla(value);
	        } else if (isCssVar(value)) {
	          var cssVar = parseCssVar(value);
	          var cssPrimaryVarName = '--primary';
	          if (cssVar !== null) {
	            this.cssVar = cssVar.name;
	            if ('opacity' in cssVar) {
	              this.cssVar = cssPrimaryVarName;
	              this.setValue(main_core.Dom.style(document.documentElement, this.cssVar));
	              this.setOpacity(cssVar.opacity);
	            } else {
	              this.setValue(main_core.Dom.style(document.documentElement, this.cssVar));
	            }
	          }
	        }
	      }
	      this.value.h = Math.round(this.value.h);
	      this.value.s = Math.round(this.value.s);
	      this.value.l = Math.round(this.value.l);
	      this.value.a = this.value.a.toFixed(2);
	      var offsetFromCorrectValue = Math.round(this.value.a * 100 % 5);
	      if (offsetFromCorrectValue < 3) {
	        this.value.a = (this.value.a * 100 - offsetFromCorrectValue) / 100;
	      } else {
	        this.value.a = (this.value.a * 100 - offsetFromCorrectValue + 5) / 100;
	      }
	      return this;
	    }
	  }, {
	    key: "setOpacity",
	    value: function setOpacity(opacity) {
	      this.setValue({
	        a: opacity
	      });
	      return this;
	    }
	  }, {
	    key: "lighten",
	    value: function lighten(percent) {
	      this.value.l = Math.min(this.value.l + percent, 100);
	      this.hex = null;
	      return this;
	    }
	  }, {
	    key: "darken",
	    value: function darken(percent) {
	      this.value.l = Math.max(this.value.l - percent, 0);
	      this.hex = null;
	      return this;
	    }
	  }, {
	    key: "saturate",
	    value: function saturate(percent) {
	      this.value.s = Math.min(this.value.s + percent, 100);
	      this.hex = null;
	      return this;
	    }
	  }, {
	    key: "desaturate",
	    value: function desaturate(percent) {
	      this.value.s = Math.max(this.value.s - percent, 0);
	      this.hex = null;
	      return this;
	    }
	  }, {
	    key: "adjustHue",
	    value: function adjustHue(degree) {
	      this.value.h = (this.value.h + degree) % 360;
	      return this;
	    }
	  }, {
	    key: "getHsl",
	    value: function getHsl() {
	      return {
	        h: this.value.h,
	        s: this.value.s,
	        l: this.value.l
	      };
	    }
	  }, {
	    key: "getHsla",
	    value: function getHsla() {
	      var a = this.value.a || 1;
	      return {
	        h: this.value.h,
	        s: this.value.s,
	        l: this.value.l,
	        a: a
	      };
	    }
	    /**
	     * Return original hex-string or convert value to hex (w.o. alpha)
	     * @returns {string}
	     */
	  }, {
	    key: "getHex",
	    value: function getHex() {
	      return this.hex || hslToHex(this.value);
	    }
	    /**
	     * Return hex only if value created from hex-string
	     */
	  }, {
	    key: "getHexOriginal",
	    value: function getHexOriginal() {
	      return this.hex;
	    }
	  }, {
	    key: "getOpacity",
	    value: function getOpacity() {
	      var _this$value$a;
	      return (_this$value$a = this.value.a) !== null && _this$value$a !== void 0 ? _this$value$a : defaultColorValueOptions.a;
	    }
	  }, {
	    key: "getCssVar",
	    value: function getCssVar() {
	      return this.cssVar;
	    }
	    /**
	     * Get style string for set inline css var.
	     * Set hsla value or primary css var with opacity in format --var-name-opacity_12_3
	     * @returns {string}
	     */
	  }, {
	    key: "getStyleString",
	    value: function getStyleString() {
	      if (this.cssVar === null) {
	        if (this.hex && this.getOpacity() === defaultColorValueOptions.a) {
	          return this.hex;
	        }
	        var _this$value = this.value,
	          h = _this$value.h,
	          s = _this$value.s,
	          l = _this$value.l,
	          a = _this$value.a;
	        return "hsla(".concat(h, ", ").concat(s, "%, ").concat(l, "%, ").concat(a, ")");
	      } else {
	        var fullCssVar = this.cssVar;
	        if (this.value.a !== defaultColorValueOptions.a) {
	          fullCssVar = fullCssVar + '-opacity-' + String(this.value.a).replace('.', '_');
	        }
	        return "var(".concat(fullCssVar, ")");
	      }
	    }
	  }, {
	    key: "getStyleStringForOpacity",
	    value: function getStyleStringForOpacity() {
	      var _this$value2 = this.value,
	        h = _this$value2.h,
	        s = _this$value2.s,
	        l = _this$value2.l;
	      return "linear-gradient(to right, hsla(".concat(h, ", ").concat(s, "%, ").concat(l, "%, 0) 0%, hsla(").concat(h, ", ").concat(s, "%, ").concat(l, "%, 1) 100%)");
	    }
	  }, {
	    key: "getContrast",
	    /**
	     * Special formula for contrast. Not only color invert!
	     * @returns {string}
	     */
	    value: function getContrast() {
	      var k = 60;
	      // math h range to 0-2pi radian and add modifier by sinus
	      var rad = this.getHsl().h * Math.PI / 180;
	      k += Math.sin(rad) * 10 + 5; // 10 & 5 is approximate coefficients
	      // lighten by started light
	      var deltaL = k - 45 * this.getHsl().l / 100;
	      return new ColorValue(this.value).setValue({
	        l: (this.getHsl().l + deltaL) % 100
	      });
	    }
	    /**
	     * Special formula for lighten, good for dark and light colors
	     */
	  }, {
	    key: "getLighten",
	    value: function getLighten() {
	      var _this$getHsl2 = this.getHsl(),
	        h = _this$getHsl2.h,
	        s = _this$getHsl2.s,
	        l = _this$getHsl2.l;
	      if (s > 0) {
	        s += (l - 50) / 100 * 60;
	        s = Math.min(100, Math.max(0, l));
	      }
	      l += 10 + 20 * l / 100;
	      l = Math.min(100, l);
	      return new ColorValue({
	        h: h,
	        s: s,
	        l: l
	      });
	    }
	  }], [{
	    key: "compare",
	    value: function compare(color1, color2) {
	      return color1.getHsla().h === color2.getHsla().h && color1.getHsla().s === color2.getHsla().s && color1.getHsla().l === color2.getHsla().l && color1.getHsla().a === color2.getHsla().a && color1.cssVar === color2.cssVar;
	    }
	  }, {
	    key: "getMedian",
	    value: function getMedian(color1, color2) {
	      return new ColorValue({
	        h: (color1.getHsla().h + color2.getHsla().h) / 2,
	        s: (color1.getHsla().s + color2.getHsla().s) / 2,
	        l: (color1.getHsla().l + color2.getHsla().l) / 2,
	        a: (color1.getHsla().a + color2.getHsla().a) / 2
	      });
	    }
	  }]);
	  return ColorValue;
	}();

	/**
	 * ColorPicker for Theme site.
	 */
	var ColorPickerTheme = /*#__PURE__*/function (_EventEmitter) {
	  babelHelpers.inherits(ColorPickerTheme, _EventEmitter);
	  function ColorPickerTheme(node, allColors, currentColor) {
	    var _this;
	    var metrikaParams = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
	    babelHelpers.classCallCheck(this, ColorPickerTheme);
	    _this = babelHelpers.possibleConstructorReturn(this, babelHelpers.getPrototypeOf(ColorPickerTheme).call(this));
	    _this.setEventNamespace('BX.Landing.ColorPickerTheme');
	    _this.element = node;
	    _this.loader = new BX.Loader({
	      target: node,
	      size: 43
	    });
	    _this.input = _this.element.firstElementChild;
	    _this.allColors = allColors;
	    _this.currentColor = currentColor;
	    _this.initMetrika(metrikaParams);
	    _this.init();
	    return _this;
	  }
	  babelHelpers.createClass(ColorPickerTheme, [{
	    key: "initMetrika",
	    value: function initMetrika(metrikaParams) {
	      this.metrikaParams = metrikaParams;
	    }
	  }, {
	    key: "init",
	    value: function init() {
	      var _this2 = this;
	      var color = this.initPreviewColor();
	      var active = this.isActive();
	      this.element.style.backgroundColor = color;
	      this.element.dataset.value = color;
	      this.element.classList.add('landing-colorpicker-theme');
	      if (active) {
	        this.input.setAttribute('value', color);
	        this.element.classList.add('active');
	      }
	      this.colorField = new BX.Landing.UI.Field.ColorField({
	        subtype: 'color'
	      });
	      this.colorField.createPopup({
	        contentRoot: null,
	        isNeedCalcPopupOffset: false,
	        isNeedResetPopupWhenOpen: false,
	        analytics: this.getMetrikaParams()
	      });
	      this.colorField.colorPopup.subscribe('onHexColorPopupChange', function (e) {
	        _this2.onColorSelected(e.data);
	      });
	      this.colorField.colorPopup.subscribe('onPopupShow', function (e) {
	        _this2.loader.hide();
	      });
	      BX.bind(this.element, 'click', this.open.bind(this));
	    }
	  }, {
	    key: "initPreviewColor",
	    value: function initPreviewColor() {
	      var color;
	      if (this.currentColor) {
	        if (this.isHex(this.currentColor)) {
	          color = this.isBaseColor() ? ColorPickerTheme.DEFAULT_COLOR_PICKER_COLOR : this.currentColor;
	        } else {
	          color = ColorPickerTheme.DEFAULT_COLOR_PICKER_COLOR;
	        }
	      } else {
	        color = ColorPickerTheme.DEFAULT_COLOR_PICKER_COLOR;
	      }
	      return color;
	    }
	  }, {
	    key: "isActive",
	    value: function isActive() {
	      if (!this.isHex(this.currentColor)) {
	        return false;
	      }
	      return !this.isBaseColor();
	    }
	  }, {
	    key: "isBaseColor",
	    value: function isBaseColor() {
	      return this.allColors.includes(this.currentColor);
	    }
	  }, {
	    key: "getSelectedColor",
	    value: function getSelectedColor() {
	      var color;
	      if (this.element.dataset.value) {
	        color = this.element.dataset.value;
	      }
	      color = this.prepareColor(color);
	      if (!this.isHex(color)) {
	        color = '';
	      }
	      return color;
	    }
	  }, {
	    key: "onColorSelected",
	    value: function onColorSelected(color) {
	      this.element.classList.add('ui-colorpicker-selected');
	      this.element.dataset.value = color.substr(1);
	      this.element.style.backgroundColor = color;
	      var event = new main_core_events.BaseEvent({
	        data: {
	          color: color,
	          node: this.element
	        }
	      });
	      this.emit('onSelectColor', event);
	      this.emit('onSelectCustomColor', event);
	      this.input.setAttribute('value', color);
	    }
	  }, {
	    key: "open",
	    value: function open() {
	      this.loader.show();
	      this.colorField.colorPopup.setValue(new ColorValue(this.getSelectedColor()));
	      this.colorField.colorPopup.onPopupOpenClick(event, this.element);
	    }
	  }, {
	    key: "prepareColor",
	    value: function prepareColor(color) {
	      if (color[0] !== '#') {
	        color = '#' + color;
	      }
	      return color;
	    }
	  }, {
	    key: "isHex",
	    value: function isHex(color) {
	      var isCorrect = false;
	      if (color.length === 4 || color.length === 7) {
	        if (color.match(ColorPickerTheme.MATCH_HEX)) {
	          isCorrect = true;
	        }
	      }
	      return isCorrect;
	    }
	  }, {
	    key: "getMetrikaParams",
	    value: function getMetrikaParams() {
	      var _this$metrikaParams$p, _this$metrikaParams;
	      return {
	        category: 'settings',
	        c_sub_section: 'primary',
	        p1: (_this$metrikaParams$p = (_this$metrikaParams = this.metrikaParams) === null || _this$metrikaParams === void 0 ? void 0 : _this$metrikaParams.p1) !== null && _this$metrikaParams$p !== void 0 ? _this$metrikaParams$p : null
	      };
	    }
	  }]);
	  return ColorPickerTheme;
	}(main_core_events.EventEmitter);
	babelHelpers.defineProperty(ColorPickerTheme, "DEFAULT_COLOR_PICKER_COLOR", '#f25a8f');
	babelHelpers.defineProperty(ColorPickerTheme, "MATCH_HEX", /#?([0-9A-F]{3}){1,2}$/i);

	exports.ColorPickerTheme = ColorPickerTheme;

}((this.BX.Landing = this.BX.Landing || {}),BX.Event,BX));
//# sourceMappingURL=colorpickertheme.bundle.js.map
