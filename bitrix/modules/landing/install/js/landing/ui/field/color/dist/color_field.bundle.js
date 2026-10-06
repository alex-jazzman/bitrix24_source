/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.UI = this.BX.Landing.UI || {};
(function (exports, main_core, landing_ui_field_basefield, landing_ui_field_textfield, main_popup, main_core_events, landing_pageobject, ui_designTokens, ui_fonts_opensans, landing_backend, landing_ui_field_image, landing_env) {
  'use strict';
	var _templateObject, _templateObject2, _templateObject3, _templateObject4, _templateObject5, _templateObject6, _templateObject7, _templateObject8, _templateObject9, _templateObject0, _templateObject1, _templateObject10, _templateObject11, _templateObject12, _templateObject13, _templateObject14, _templateObject15, _templateObject16, _templateObject17, _templateObject18, _templateObject19, _templateObject20, _templateObject21, _templateObject22, _templateObject23, _templateObject24, _templateObject25, _templateObject26, _templateObject27, _templateObject28, _templateObject29, _templateObject30, _templateObject31, _templateObject32, _templateObject33, _templateObject34, _templateObject35, _templateObject36, _templateObject37, _templateObject38, _templateObject39, _templateObject40, _templateObject41, _templateObject42, _templateObject43, _templateObject44, _templateObject45, _templateObject46, _templateObject47, _templateObject48, _templateObject49, _templateObject50, _templateObject51, _templateObject52, _templateObject53, _templateObject54, _templateObject55, _templateObject56;

  const matcher$1 = /^rgba? ?\((\d{1,3})[, ]+(\d{1,3})[, ]+(\d{1,3})([, ]+([\d\.]{1,5}))?\)$/i;
  function isRgbString(rgbString) {
    return !!rgbString.match(matcher$1);
  }
  const matcherHex = /^#([\da-f]{3}){1,2}$/i;
  function isHex(hex) {
    return !!hex.trim().match(matcherHex);
  }
  const matcherHsl = /^hsla?\((\d{1,3}), ?(\d{1,3})%, ?(\d{1,3})%(, ?([\d .]+))?\)/i;
  function isHslString(hsla) {
    return !!hsla.trim().match(matcherHsl);
  }
  function hexToRgb(hex) {
    if (hex.length === 4) {
      const r = parseInt("0x".concat(hex[1]).concat(hex[1]), 16);
      const g = parseInt("0x".concat(hex[2]).concat(hex[2]), 16);
      const b = parseInt("0x".concat(hex[3]).concat(hex[3]), 16);
      return {
        r,
        g,
        b
      };
    }
    if (hex.length === 7) {
      const r = parseInt("0x".concat(hex[1]).concat(hex[2]), 16);
      const g = parseInt("0x".concat(hex[3]).concat(hex[4]), 16);
      const b = parseInt("0x".concat(hex[5]).concat(hex[6]), 16);
      return {
        r,
        g,
        b
      };
    }
    return {
      r: 255,
      g: 255,
      b: 255
    };
  }
  function rgbToHsla(rgb) {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h,
      s,
      l = (max + min) / 2;
    // let l = h;
    // let s;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
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
    const rgb = hexToRgb(hex.trim());
    return rgbToHsla(rgb);
  }
  function rgbToHex(rgb) {
    let r = rgb.r.toString(16);
    let g = rgb.g.toString(16);
    let b = rgb.b.toString(16);
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
    const h = hsl.h;
    const s = hsl.s / 100;
    const l = hsl.l / 100;
    let c = (1 - Math.abs(2 * l - 1)) * s;
    let x = c * (1 - Math.abs(h / 60 % 2 - 1));
    let m = l - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;
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
    const rgb = hslToRgb(hsl);
    return rgbToHex(rgb);
  }
  function rgbStringToHsla(rgbString) {
    let matches = rgbString.trim().match(matcher$1);
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
    let matches = hslString.trim().match(matcherHsl);
    if (matches && matches.length > 0) {
      return {
        h: main_core.Text.toNumber(matches[1]),
        s: main_core.Text.toNumber(matches[2]),
        l: main_core.Text.toNumber(matches[3]),
        a: matches[5] ? main_core.Text.toNumber(matches[5]) : 1
      };
    }
  }
  const matcher = /^(var\()?((--[\w\d-]*?)(-opacity_([\d_]+)?)?)\)?$/i;
  function isCssVar(css) {
    return !!css.trim().match(matcher);
  }
  function parseCssVar(css) {
    const matches = css.trim().match(matcher);
    if (!!matches) {
      const cssVar = {
        full: matches[2],
        name: matches[3]
      };
      if (matches[3]) {
        const cssVarWithOpacity = '--primary-opacity-0_';
        const cssVarWithOpacity0 = '--primary-opacity-0';
        if (matches[3].startsWith(cssVarWithOpacity0) && !matches[3].startsWith(cssVarWithOpacity)) {
          cssVar.opacity = 0;
        }
        if (matches[3].startsWith(cssVarWithOpacity)) {
          let newOpacity = matches[3].substr(cssVarWithOpacity.length);
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
  const defaultColorValueOptions = {
    h: 205,
    s: 1,
    l: 50,
    a: 1
  };
  const defaultBgImageSize = 'cover';
  const defaultBgImageAttachment = 'scroll';
  const defaultOverlay = null;
  const defaultBgImageValueOptions = {
    url: null,
    size: defaultBgImageSize,
    attachment: defaultBgImageAttachment,
    overlay: defaultOverlay
  };
  let ColorValue = /*#__PURE__*/function () {
    /**
     * For preserve differences between hsl->rgb and rgb->hsl conversions we can save hex
     * @type {?string}
     */

    /**
     * if set css variable value - save them in '--var-name' format
     * @type {?string}
     */

    function ColorValue(value) {
      this.value = defaultColorValueOptions;
      this.hex = null;
      this.cssVar = null;
      this.setValue(value);
    }
    var _proto = ColorValue.prototype;
    _proto.getName = function getName() {
      if (this.hex) {
        return this.getHex() + '_' + this.getOpacity();
      }
      const {
        h,
        s,
        l
      } = this.getHsl();
      return "".concat(h, "-").concat(s, "-").concat(l, "-").concat(this.getOpacity());
    };
    _proto.setValue = function setValue(value) {
      if (main_core.Type.isObject(value)) {
        if (value instanceof ColorValue) {
          this.value = value.getHsla();
          this.cssVar = value.getCssVar();
          this.hex = value.getHexOriginal();
        } else {
          this.value = {
            ...this.value,
            ...value
          };
        }
      }
      if (main_core.Type.isString(value)) {
        if (isHslString(value)) {
          this.value = hslStringToHsl(value);
        } else if (isHex(value)) {
          this.value = {
            ...hexToHsl(value),
            a: defaultColorValueOptions.a
          };
          this.hex = value;
        } else if (isRgbString(value)) {
          this.value = rgbStringToHsla(value);
        } else if (isCssVar(value)) {
          const cssVar = parseCssVar(value);
          const cssPrimaryVarName = '--primary';
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
      const offsetFromCorrectValue = Math.round(this.value.a * 100 % 5);
      if (offsetFromCorrectValue < 3) {
        this.value.a = (this.value.a * 100 - offsetFromCorrectValue) / 100;
      } else {
        this.value.a = (this.value.a * 100 - offsetFromCorrectValue + 5) / 100;
      }
      return this;
    };
    _proto.setOpacity = function setOpacity(opacity) {
      this.setValue({
        a: opacity
      });
      return this;
    };
    _proto.lighten = function lighten(percent) {
      this.value.l = Math.min(this.value.l + percent, 100);
      this.hex = null;
      return this;
    };
    _proto.darken = function darken(percent) {
      this.value.l = Math.max(this.value.l - percent, 0);
      this.hex = null;
      return this;
    };
    _proto.saturate = function saturate(percent) {
      this.value.s = Math.min(this.value.s + percent, 100);
      this.hex = null;
      return this;
    };
    _proto.desaturate = function desaturate(percent) {
      this.value.s = Math.max(this.value.s - percent, 0);
      this.hex = null;
      return this;
    };
    _proto.adjustHue = function adjustHue(degree) {
      this.value.h = (this.value.h + degree) % 360;
      return this;
    };
    _proto.getHsl = function getHsl() {
      return {
        h: this.value.h,
        s: this.value.s,
        l: this.value.l
      };
    };
    _proto.getHsla = function getHsla() {
      const a = this.value.a || 1;
      return {
        h: this.value.h,
        s: this.value.s,
        l: this.value.l,
        a
      };
    }

    /**
     * Return original hex-string or convert value to hex (w.o. alpha)
     * @returns {string}
     */;
    _proto.getHex = function getHex() {
      return this.hex || hslToHex(this.value);
    }

    /**
     * Return hex only if value created from hex-string
     */;
    _proto.getHexOriginal = function getHexOriginal() {
      return this.hex;
    };
    _proto.getOpacity = function getOpacity() {
      return this.value.a ?? defaultColorValueOptions.a;
    };
    _proto.getCssVar = function getCssVar() {
      return this.cssVar;
    }

    /**
     * Get style string for set inline css var.
     * Set hsla value or primary css var with opacity in format --var-name-opacity_12_3
     * @returns {string}
     */;
    _proto.getStyleString = function getStyleString() {
      if (this.cssVar === null) {
        if (this.hex && this.getOpacity() === defaultColorValueOptions.a) {
          return this.hex;
        }
        const {
          h,
          s,
          l,
          a
        } = this.value;
        return "hsla(".concat(h, ", ").concat(s, "%, ").concat(l, "%, ").concat(a, ")");
      } else {
        let fullCssVar = this.cssVar;
        if (this.value.a !== defaultColorValueOptions.a) {
          fullCssVar = fullCssVar + '-opacity-' + String(this.value.a).replace('.', '_');
        }
        return "var(".concat(fullCssVar, ")");
      }
    };
    _proto.getStyleStringForOpacity = function getStyleStringForOpacity() {
      const {
        h,
        s,
        l
      } = this.value;
      return "linear-gradient(to right, hsla(".concat(h, ", ").concat(s, "%, ").concat(l, "%, 0) 0%, hsla(").concat(h, ", ").concat(s, "%, ").concat(l, "%, 1) 100%)");
    };
    ColorValue.compare = function compare(color1, color2) {
      return color1.getHsla().h === color2.getHsla().h && color1.getHsla().s === color2.getHsla().s && color1.getHsla().l === color2.getHsla().l && color1.getHsla().a === color2.getHsla().a && color1.cssVar === color2.cssVar;
    };
    ColorValue.getMedian = function getMedian(color1, color2) {
      return new ColorValue({
        h: (color1.getHsla().h + color2.getHsla().h) / 2,
        s: (color1.getHsla().s + color2.getHsla().s) / 2,
        l: (color1.getHsla().l + color2.getHsla().l) / 2,
        a: (color1.getHsla().a + color2.getHsla().a) / 2
      });
    }

    /**
     * Special formula for contrast. Not only color invert!
     * @returns {string}
     */;
    _proto.getContrast = function getContrast() {
      let k = 60;
      // math h range to 0-2pi radian and add modifier by sinus
      let rad = this.getHsl().h * Math.PI / 180;
      k += Math.sin(rad) * 10 + 5; // 10 & 5 is approximate coefficients
      // lighten by started light
      let deltaL = k - 45 * this.getHsl().l / 100;
      return new ColorValue(this.value).setValue({
        l: (this.getHsl().l + deltaL) % 100
      });
    }

    /**
     * Special formula for lighten, good for dark and light colors
     */;
    _proto.getLighten = function getLighten() {
      let {
        h,
        s,
        l
      } = this.getHsl();
      if (s > 0) {
        s += (l - 50) / 100 * 60;
        s = Math.min(100, Math.max(0, l));
      }
      l += 10 + 20 * l / 100;
      l = Math.min(100, l);
      return new ColorValue({
        h,
        s,
        l
      });
    };
    return ColorValue;
  }();
  let BaseControl = /*#__PURE__*/function (_main_core_events$Eve) {
    function BaseControl(options) {
      var _this;
      _this = _main_core_events$Eve.call(this) || this;
      _this.cache = new main_core.Cache.MemoryCache();
      return _this;
    }
    babelHelpers.inherits(BaseControl, _main_core_events$Eve);
    var _proto2 = BaseControl.prototype;
    _proto2.getLayout = function getLayout() {
      return this.cache.remember('layout', () => {
        return this.buildLayout();
      });
    };
    _proto2.buildLayout = function buildLayout() {
      return main_core.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-field-base-control\">\n\t\t\t\tBase control\n\t\t\t</div>\n\t\t"])));
    };
    _proto2.getValue = function getValue() {
      return this.cache.remember('value', () => {
        return new ColorValue();
      });
    };
    _proto2.isNeedSetValue = function isNeedSetValue(value) {
      return value !== this.getValue();
    };
    _proto2.setValue = function setValue(value) {
      this.cache.set('value', value);
    };
    _proto2.onChange = function onChange(event) {
      this.cache.delete('value');
      this.emit('onChange', {
        color: this.getValue()
      });
    };
    _proto2.setActive = function setActive() {
      main_core.Dom.addClass(this.getLayout(), BaseControl.ACTIVE_CLASS);
    };
    _proto2.unsetActive = function unsetActive() {
      main_core.Dom.removeClass(this.getLayout(), BaseControl.ACTIVE_CLASS);
    };
    _proto2.isActive = function isActive() {
      return main_core.Dom.hasClass(this.getLayout(), BaseControl.ACTIVE_CLASS);
    };
    return BaseControl;
  }(main_core_events.EventEmitter);
  BaseControl.ACTIVE_CLASS = 'active';
  let Hex = /*#__PURE__*/function (_BaseControl2) {
    function Hex() {
      var _this2;
      _this2 = _BaseControl2.call(this) || this;
      _this2.setEventNamespace('BX.Landing.UI.Field.Color.Hex');
      _this2.onInput = main_core.Runtime.debounce(_this2.onInput.bind(_this2), 300);
      _this2.previewMode = false;
      return _this2;
    }
    babelHelpers.inherits(Hex, _BaseControl2);
    var _proto3 = Hex.prototype;
    _proto3.buildLayout = function buildLayout() {
      main_core.Event.bind(this.getInput(), 'input', this.onInput);
      this.adjustColors(Hex.DEFAULT_COLOR, Hex.DEFAULT_BG);
      const modeClass = this.previewMode ? '--preview' : '--base';
      return main_core.Tag.render(_templateObject2 || (_templateObject2 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-field-color-hex ", "\">\n\t\t\t\t", "\n\t\t\t\t", "\n\t\t\t\t", "\n\t\t\t</div>\n\t\t"])), modeClass, this.getPreview(), this.getInput(), this.previewMode ? this.getButton() : '');
    };
    _proto3.getPreview = function getPreview() {
      return this.cache.remember('preview', () => {
        return main_core.Tag.render(_templateObject3 || (_templateObject3 = babelHelpers.taggedTemplateLiteral(["<div class=\"landing-ui-field-color-hex-preview\"></div>"])));
      });
    };
    _proto3.getInput = function getInput() {
      return this.cache.remember('input', () => {
        const input = main_core.Tag.render(_templateObject4 || (_templateObject4 = babelHelpers.taggedTemplateLiteral(["<input type=\"text\" name=\"hexInput\" value=\"", "\" class=\"landing-ui-field-color-hex-input\">"])), Hex.DEFAULT_TEXT);
        main_core.Dom.attr(input, 'aria-label', main_core.Loc.getMessage('LANDING_FIELD_COLOR_HEX_INPUT_LABEL'));
        return input;
      });
    };
    _proto3.onInput = function onInput() {
      let value = this.getInput().value.replaceAll(/[^\da-f]/gi, '');
      value = value.slice(0, 6);
      this.getInput().value = "#".concat(value.toLowerCase());
      if (this.getInput().value.length === 7) {
        this.emit('onValidInput', {
          value
        });
      }
      this.onChange();
    };
    _proto3.onChange = function onChange(event) {
      const color = this.getInput().value.length === 7 && isHex(this.getInput().value) ? new ColorValue(this.getInput().value) : null;
      this.setValue(color);
      this.cache.delete('value');
      this.emit('onChange', {
        color
      });
    };
    _proto3.adjustColors = function adjustColors(textColor, bgColor) {
      if (this.previewMode === true) {
        main_core.Dom.style(this.getInput(), 'color', textColor);
        main_core.Dom.style(this.getButton(), 'fill', textColor);
        main_core.Dom.style(this.getInput(), 'background', 'transparent');
        main_core.Dom.style(this.getPreview(), 'display', 'none');
      } else {
        main_core.Dom.style(this.getPreview(), 'background-color', bgColor);
      }
    };
    _proto3.focus = function focus() {
      if (this.getValue() === null) {
        this.getInput().value = '#';
      }
      this.getInput().focus();
    };
    _proto3.unFocus = function unFocus() {
      this.getInput().blur();
    };
    _proto3.getValue = function getValue() {
      return this.cache.remember('value', () => {
        return this.getInput().value === Hex.DEFAULT_TEXT ? null : new ColorValue(this.getInput().value);
      });
    };
    _proto3.setValue = function setValue(value) {
      // todo: set checking in always controls?
      if (this.isNeedSetValue(value)) {
        _BaseControl2.prototype.setValue.call(this, value);
        if (value === null) {
          this.adjustColors(Hex.DEFAULT_COLOR, Hex.DEFAULT_BG);
          this.unsetActive();
        } else {
          this.adjustColors(value.getContrast().getHex(), value.getHex());
          this.setActive();
        }
        if (landing_pageobject.PageObject.getRootWindow().document.activeElement !== this.getInput()) {
          this.getInput().value = value === null ? Hex.DEFAULT_TEXT : value.getHex();
        }
        this.emit('onSetValue', {
          color: value === null ? Hex.DEFAULT_BG : value.getHex()
        });
      }
    };
    _proto3.setActive = function setActive() {
      main_core.Dom.addClass(this.getInput(), Hex.ACTIVE_CLASS);
    };
    _proto3.unsetActive = function unsetActive() {
      main_core.Dom.removeClass(this.getInput(), Hex.ACTIVE_CLASS);
    };
    _proto3.isActive = function isActive() {
      return main_core.Dom.hasClass(this.getInput(), Hex.ACTIVE_CLASS);
    };
    _proto3.setPreviewMode = function setPreviewMode(preview) {
      this.previewMode = preview;
    };
    _proto3.isPreviewMode = function isPreviewMode() {
      return Boolean(this.previewMode);
    };
    _proto3.getButton = function getButton() {
      return this.cache.remember('editButton', () => {
        return main_core.Tag.render(_templateObject5 || (_templateObject5 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<svg class=\"landing-ui-field-color-hex-preview-btn\" width=\"9\" height=\"9\" xmlns=\"http://www.w3.org/2000/svg\">\n\t\t\t\t\t<path\n\t\t\t\t\t\td=\"M7.108 0l1.588 1.604L2.486 7.8.896 6.194 7.108 0zM.006 8.49a.166.166 0 00.041.158.161.161 0 00.16.042l1.774-.478L.484 6.715.006 8.49z\"\n\t\t\t\t\t\tfill-rule=\"evenodd\"/>\n\t\t\t\t</svg>\n\t\t\t"])));
      });
    };
    return Hex;
  }(BaseControl);
  Hex.DEFAULT_TEXT = '#hex';
  Hex.DEFAULT_COLOR = '#000000';
  Hex.DEFAULT_BG = '#eeeeee';
  let Spectrum = /*#__PURE__*/function (_BaseControl3) {
    function Spectrum(options) {
      var _this3;
      _this3 = _BaseControl3.call(this) || this;
      _this3.setEventNamespace('BX.Landing.UI.Field.Color.Spectrum');
      _this3.onPickerDragStart = _this3.onPickerDragStart.bind(_this3);
      _this3.onPickerDragMove = _this3.onPickerDragMove.bind(_this3);
      _this3.onPickerDragEnd = _this3.onPickerDragEnd.bind(_this3);
      _this3.onScroll = _this3.onScroll.bind(_this3);
      _this3.scrollContext = options.contentRoot;
      main_core.Event.bind(_this3.getLayout(), 'mousedown', _this3.onPickerDragStart);
      return _this3;
    }
    babelHelpers.inherits(Spectrum, _BaseControl3);
    var _proto4 = Spectrum.prototype;
    _proto4.buildLayout = function buildLayout() {
      return main_core.Tag.render(_templateObject6 || (_templateObject6 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-field-color-spectrum\">\n\t\t\t\t", "\n\t\t\t</div>\n\t\t"])), this.getPicker());
    };
    _proto4.getPicker = function getPicker() {
      return this.cache.remember('picker', () => {
        return main_core.Tag.render(_templateObject7 || (_templateObject7 = babelHelpers.taggedTemplateLiteral(["<div class=\"landing-ui-field-color-spectrum-picker\"></div>"])));
      });
    };
    _proto4.getPickerPos = function getPickerPos() {
      return {
        x: main_core.Text.toNumber(main_core.Dom.style(this.getPicker(), 'left')),
        y: main_core.Text.toNumber(main_core.Dom.style(this.getPicker(), 'top'))
      };
    };
    _proto4.onPickerDragStart = function onPickerDragStart(event) {
      if (event.ctrlKey || event.metaKey || event.button) {
        return;
      }
      const documentBody = this.getLayout().ownerDocument.body;
      main_core.Event.bind(this.scrollContext, 'scroll', this.onScroll);
      main_core.Event.bind(this.getLayout(), 'mousemove', this.onPickerDragMove);
      main_core.Event.bind(this.getLayout(), 'mouseup', this.onPickerDragEnd);
      main_core.Dom.addClass(documentBody, 'landing-ui-field-color-draggable');
      this.onScroll();
      this.showPicker();
      this.emit('onPickerDragStart', {
        color: this.getValue()
      });
      this.onPickerDragMove(event);
    };
    _proto4.onPickerDragMove = function onPickerDragMove(event) {
      if (event.target === this.getPicker()) {
        return;
      }
      this.setPickerPos(event.pageX, event.pageY);
      this.onChange();
    };
    _proto4.onPickerDragEnd = function onPickerDragEnd() {
      const documentBody = this.getLayout().ownerDocument.body;
      main_core.Event.unbind(this.scrollContext, 'scroll', this.onScroll);
      main_core.Event.unbind(this.getLayout(), 'mousemove', this.onPickerDragMove);
      main_core.Event.unbind(this.getLayout(), 'mouseup', this.onPickerDragEnd);
      main_core.Dom.removeClass(documentBody, 'landing-ui-field-color-draggable');
      this.emit('onPickerDragEnd', {
        color: this.getValue()
      });
    };
    _proto4.onScroll = function onScroll() {
      this.cache.delete('layoutSize');
    };
    _proto4.getLayoutRect = function getLayoutRect() {
      const ownerDocument = this.getLayout().ownerDocument;
      return this.cache.remember('layoutSize', () => {
        const layoutRect = this.getLayout().getBoundingClientRect();
        const scrollTop = ownerDocument.documentElement.scrollTop || 0;
        return {
          width: layoutRect.width,
          height: layoutRect.height,
          left: layoutRect.left,
          top: layoutRect.top + scrollTop
        };
      });
    }

    /**
     * Set picker by absolut page coords
     * @param x
     * @param y
     */;
    _proto4.setPickerPos = function setPickerPos(x, y) {
      const {
        width,
        height,
        top,
        left
      } = this.getLayoutRect();
      let leftToSet = Math.min(Math.max(x - left, 0), width);
      leftToSet = leftToSet > width / Spectrum.HUE_RANGE * Spectrum.HUE_RANGE_GRAY_THRESHOLD ? width / Spectrum.HUE_RANGE * Spectrum.HUE_RANGE_GRAY_MIDDLE : leftToSet;
      main_core.Dom.style(this.getPicker(), {
        left: "".concat(leftToSet, "px"),
        top: "".concat(Math.min(Math.max(y - top, 0), height), "px")
      });
    };
    _proto4.getValue = function getValue() {
      return this.cache.remember('value', () => {
        if (main_core.Dom.hasClass(this.getPicker(), Spectrum.HIDE_CLASS)) {
          return null;
        }
        const layoutWidth = this.getLayout().getBoundingClientRect().width;
        const h = this.getPickerPos().x / layoutWidth * Spectrum.HUE_RANGE;
        const layoutHeight = this.getLayout().getBoundingClientRect().height;
        const l = (1 - this.getPickerPos().y / layoutHeight) * 100;
        if (isNaN(h) || isNaN(l)) {
          return null;
        }
        return new ColorValue({
          h: Math.min(h, Spectrum.HUE_RANGE_GRAY_THRESHOLD),
          s: h >= Spectrum.HUE_RANGE_GRAY_THRESHOLD ? 0 : Spectrum.DEFAULT_SATURATION,
          l
        });
      });
    };
    _proto4.setValue = function setValue(value) {
      _BaseControl3.prototype.setValue.call(this, value);
      if (value !== null && Spectrum.isSpectrumValue(value)) {
        // in first set value we can't match bounding client rect (layout not render). Then, use percents
        const {
          h,
          s,
          l
        } = value.getHsl();
        const left = s === 0 ? Spectrum.HUE_RANGE_GRAY_MIDDLE / Spectrum.HUE_RANGE * 100 : h / Spectrum.HUE_RANGE * 100;
        main_core.Dom.style(this.getPicker(), 'left', "".concat(left, "%"));
        const top = 100 - l;
        main_core.Dom.style(this.getPicker(), 'top', "".concat(top, "%"));
        this.showPicker();
      } else {
        this.hidePicker();
      }
    };
    _proto4.hidePicker = function hidePicker() {
      main_core.Dom.addClass(this.getPicker(), Spectrum.HIDE_CLASS);
    };
    _proto4.showPicker = function showPicker() {
      main_core.Dom.removeClass(this.getPicker(), Spectrum.HIDE_CLASS);
    };
    _proto4.isActive = function isActive() {
      return this.getValue() !== null && Spectrum.isSpectrumValue(this.getValue());
    };
    Spectrum.isSpectrumValue = function isSpectrumValue(value) {
      return value !== null && (value.getHsl().s === Spectrum.DEFAULT_SATURATION || value.getHsl().s === 0);
    };
    return Spectrum;
  }(BaseControl);
  Spectrum.DEFAULT_SATURATION = 100;
  Spectrum.HUE_RANGE = 375;
  Spectrum.HUE_RANGE_GRAY_THRESHOLD = 360;
  Spectrum.HUE_RANGE_GRAY_MIDDLE = 367;
  Spectrum.HIDE_CLASS = 'hidden';
  let Primary = /*#__PURE__*/function (_main_core_events$Eve2) {
    // todo: layout or control?
    function Primary(options = {}) {
      var _this4;
      _this4 = _main_core_events$Eve2.call(this) || this;
      _this4.cache = new main_core.Cache.MemoryCache();
      _this4.setEventNamespace('BX.Landing.UI.Field.Color.Primary');
      main_core.Event.bind(_this4.getLayout(), 'click', () => _this4.onClick());
      main_core.Event.bind(_this4.getLayout(), 'keydown', _this4.onKeyDown.bind(_this4));
      if (options.content && options.content === 'var(--primary)') {
        _this4.setActive();
      }
      return _this4;
    }
    babelHelpers.inherits(Primary, _main_core_events$Eve2);
    var _proto5 = Primary.prototype;
    _proto5.getLayout = function getLayout() {
      return this.cache.remember('layout', () => {
        return main_core.Tag.render(_templateObject8 || (_templateObject8 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<div\n\t\t\t\t\tclass=\"landing-ui-field-color-primary\"\n\t\t\t\t\trole=\"button\"\n\t\t\t\t\ttabindex=\"0\"\n\t\t\t\t\taria-pressed=\"false\"\n\t\t\t\t>\n\t\t\t\t\t<i class=\"landing-ui-field-color-primary-preview\"></i>\n\t\t\t\t\t<span class=\"landing-ui-field-color-primary-text\">\n\t\t\t\t\t\t", "\n\t\t\t\t\t</span>\n\t\t\t\t</div>\n\t\t\t"])), main_core.Loc.getMessage('LANDING_FIELD_COLOR-PRIMARY_TITLE'));
      });
    };
    _proto5.onKeyDown = function onKeyDown(event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.onClick();
      }
    };
    _proto5.getValue = function getValue() {
      return this.cache.remember('value', () => {
        return new ColorValue(Primary.CSS_VAR);
      });
    };
    _proto5.onClick = function onClick() {
      this.setActive();
      this.emit('onChange', {
        color: this.getValue()
      });
    };
    _proto5.setActive = function setActive() {
      main_core.Dom.addClass(this.getLayout(), Primary.ACTIVE_CLASS);
      main_core.Dom.attr(this.getLayout(), 'aria-pressed', 'true');
    };
    _proto5.unsetActive = function unsetActive() {
      main_core.Dom.removeClass(this.getLayout(), Primary.ACTIVE_CLASS);
      main_core.Dom.attr(this.getLayout(), 'aria-pressed', 'false');
    };
    _proto5.isActive = function isActive() {
      return main_core.Dom.hasClass(this.getLayout(), Primary.ACTIVE_CLASS);
    };
    _proto5.isPrimaryValue = function isPrimaryValue(value) {
      return value !== null && this.getValue().getCssVar() === value.getCssVar();
    };
    return Primary;
  }(main_core_events.EventEmitter);
  Primary.ACTIVE_CLASS = 'active';
  Primary.CSS_VAR = '--primary';
  function regexpWoStartEnd(regexp) {
    return new RegExp(regexpToString(regexp));
  }
  function regexpToString(regexp) {
    return regexp.source.replace(/(^\^)|(\$$)/g, '');
  }
  const matcherGradient = /^(linear|radial)-gradient\(.*\)$/i;
  const matcherGradientAngle = /^(linear|radial)-gradient\(.*?((\d)+deg).*?\)$/ig;
  const hexMatcher = regexpToString(matcherHex);
  const matcherGradientColors = new RegExp('((rgba|hsla)?\\([\\d% .,]+\\)|transparent|' + hexMatcher + ')+', 'ig');
  // todo: whooooouuuu, is so not-good

  // todo: add hex greaident match

  // todo: for tests
  // "linear-gradient(45deg, rgb(71, 155, 255) 0%, rgb(0, 207, 78) 100%)"
  // "linear-gradient(45deg, #123321 0%, #543asdbd 100%)"
  // "linear-gradient(rgb(71, 155, 255) 0%, rgb(0, 207, 78) 100%)"
  // "radial-gradient(circle farthest-side, rgb(34, 148, 215), rgb(39, 82, 150))"

  function isGradientString(rgbString) {
    return !!rgbString.trim().match(matcherGradient);
  }
  let GradientValue = /*#__PURE__*/function () {
    function GradientValue(value) {
      this.value = {
        from: new ColorValue('#ffffff'),
        to: new ColorValue(Primary.CSS_VAR),
        angle: GradientValue.DEFAULT_ANGLE,
        type: GradientValue.DEFAULT_TYPE
      };
      this.setValue(value);
    }
    var _proto6 = GradientValue.prototype;
    _proto6.getName = function getName() {
      return this.value.from.getName() + '_' + this.value.to.getName() + '_' + this.getAngle() + '_' + this.getType();
    }

    // todo: parse grad string?
;
    _proto6.setValue = function setValue(value) {
      if (main_core.Type.isObject(value)) {
        if (value instanceof GradientValue) {
          this.value.from = new ColorValue(value.getFrom());
          this.value.to = new ColorValue(value.getTo());
          this.value.angle = value.getAngle();
          this.value.type = value.getType();
        } else {
          if ('from' in value) {
            this.value.from = new ColorValue(value.from);
          }
          if ('to' in value) {
            this.value.to = new ColorValue(value.to);
          }
          if ('angle' in value) {
            this.value.angle = main_core.Text.toNumber(value.angle);
          }
          if ('type' in value) {
            this.value.type = value.type;
          }
        }
      } else if (main_core.Type.isString(value) && isGradientString(value)) {
        this.parseGradientString(value);
      }
      return this;
    };
    _proto6.setOpacity = function setOpacity(opacity) {
      this.value.from.setOpacity(opacity);
      this.value.to.setOpacity(opacity);
      return this;
    };
    _proto6.parseGradientString = function parseGradientString(value) {
      const typeMatches = value.trim().match(matcherGradient);
      if (!!typeMatches) {
        this.setValue({
          type: typeMatches[1]
        });
      }
      const angleMatches = value.trim().match(matcherGradientAngle);
      if (!!angleMatches) {
        this.setValue({
          angle: angleMatches[2]
        });
      }
      const colorMatches = value.trim().match(matcherGradientColors);
      if (colorMatches && colorMatches.length > 0) {
        this.setValue({
          from: new ColorValue(colorMatches[0])
        });
        this.setValue({
          to: new ColorValue(colorMatches[colorMatches.length - 1])
        });
      }
    };
    _proto6.getFrom = function getFrom() {
      return this.value.from;
    };
    _proto6.getTo = function getTo() {
      return this.value.to;
    };
    _proto6.getAngle = function getAngle() {
      return this.value.angle;
    };
    _proto6.setAngle = function setAngle(angle) {
      if (main_core.Type.isNumber(angle)) {
        this.value.angle = Math.min(Math.max(angle, 0), 360);
      }
      return this;
    };
    _proto6.getType = function getType() {
      return this.value.type;
    };
    _proto6.setType = function setType(type) {
      if (type === GradientValue.TYPE_RADIAL || type === GradientValue.TYPE_LINEAR) {
        this.value.type = type;
      }
      return this;
    };
    _proto6.getOpacity = function getOpacity() {
      return (this.value.from.getOpacity() + this.value.to.getOpacity()) / 2 ?? defaultColorValueOptions.a;
    };
    _proto6.getStyleString = function getStyleString() {
      const angle = this.value.angle;
      const type = this.value.type;
      const fromString = this.value.from.getStyleString();
      const toString = this.value.to.getStyleString();
      return type === 'linear' ? "linear-gradient(".concat(angle, "deg, ").concat(fromString, " 0%, ").concat(toString, " 100%)") : "radial-gradient(circle farthest-side at 50% 50%, ".concat(fromString, " 0%, ").concat(toString, " 100%)");
    };
    _proto6.getStyleStringForOpacity = function getStyleStringForOpacity() {
      return "radial-gradient(at top left, ".concat(this.value.from.getHex(), ", transparent)") + ", radial-gradient(at bottom left, ".concat(this.value.to.getHex(), ", transparent)");
    };
    GradientValue.compare = function compare(value1, value2, full = true) {
      const base = ColorValue.compare(value1.getFrom(), value2.getFrom()) && ColorValue.compare(value1.getTo(), value2.getTo()) || ColorValue.compare(value1.getTo(), value2.getFrom()) && ColorValue.compare(value1.getFrom(), value2.getTo());
      const ext = full ? value1.getAngle() === value2.getAngle() && value1.getType() === value2.getType() : true;
      return base && ext;
    };
    return GradientValue;
  }();
  GradientValue.TYPE_RADIAL = 'radial';
  GradientValue.TYPE_LINEAR = 'linear';
  GradientValue.DEFAULT_ANGLE = 180;
  GradientValue.DEFAULT_TYPE = 'linear';
  const defaultType = 'color';
  const gradientType = 'gradient';
  let Generator = /*#__PURE__*/function () {
    function Generator() {}
    Generator.getDefaultPresets = function getDefaultPresets() {
      return Generator.cache.remember('default', () => {
        const presets = [];
        Generator.defaultPresets.forEach(preset => {
          presets.push({
            id: preset.id,
            type: 'color',
            items: preset.items.map(item => new ColorValue(hexToHsl(item)))
          });
        });
        return presets;
      });
    };
    Generator.getPrimaryColorPreset = function getPrimaryColorPreset() {
      return this.cache.remember('primary', () => {
        const preset = {
          id: 'defaultPrimary',
          items: []
        };
        const primary = new ColorValue(main_core.Dom.style(document.documentElement, '--primary').trim());
        preset.items.push(new ColorValue(primary));
        if (primary.getHsl().s <= 10) {
          const lBeforeCount = primary.getHsl().l > 50 ? Math.ceil(primary.getHsl().l / 100 * 5) : Math.floor(primary.getHsl().l / 100 * 5);
          const lAfterCount = 5 - lBeforeCount;
          const deltaLBefore = primary.getHsl().l / (lBeforeCount + 1);
          const deltaLAfter = (100 - primary.getHsl().l) / (lAfterCount + 1);
          for (let i = 1; i <= lBeforeCount; i++) {
            preset.items.push(new ColorValue(primary).darken(deltaLBefore * i));
          }
          for (let ii = 1; ii <= lAfterCount; ii++) {
            preset.items.push(new ColorValue(primary).lighten(deltaLAfter * ii));
          }
          const deltaBitrixL = 15;
          const deltaBitrixS = 15;
          const bitrixColor = new ColorValue(Generator.BITRIX_COLOR);
          preset.items[6] = new ColorValue(bitrixColor);
          preset.items[7] = new ColorValue(bitrixColor.darken(deltaBitrixL).saturate(deltaBitrixS));
          preset.items[8] = new ColorValue(bitrixColor.darken(deltaBitrixL).saturate(deltaBitrixS));
          bitrixColor.lighten(deltaBitrixL * 2).desaturate(deltaBitrixS * 2);
          preset.items[9] = new ColorValue(bitrixColor.lighten(deltaBitrixL).desaturate(deltaBitrixS));
          preset.items[10] = new ColorValue(bitrixColor.lighten(deltaBitrixL).desaturate(deltaBitrixS));
          bitrixColor.darken(deltaBitrixL * 2).saturate(deltaBitrixS * 2);
          preset.items[11] = new ColorValue(bitrixColor).adjustHue(180);
        } else {
          const deltaL = (90 - primary.getHsl().l) / 3;
          const deltaL2 = (primary.getHsl().l - 10) / 3;
          const deltaS = (90 - primary.getHsl().s) / 3;
          const deltaS2 = (primary.getHsl().s - 10) / 3;
          preset.items[1] = new ColorValue(primary.darken(deltaL2).saturate(deltaS));
          preset.items[2] = new ColorValue(primary.darken(deltaL2).saturate(deltaS));
          preset.items[3] = new ColorValue(primary.darken(deltaL2).saturate(deltaS));
          primary.lighten(deltaL2 * 3).desaturate(deltaS * 3);
          preset.items[4] = new ColorValue(primary.desaturate(deltaS2).lighten(deltaL));
          preset.items[5] = new ColorValue(primary.desaturate(deltaS2).lighten(deltaL));
          preset.items[11] = new ColorValue(primary.desaturate(deltaS2).lighten(deltaL));
          primary.saturate(deltaS2 * 3).darken(deltaL * 3);
          preset.items[7] = new ColorValue(primary.adjustHue(40));
          preset.items[8] = new ColorValue(primary.adjustHue(-80));
          preset.items[9] = new ColorValue(primary.adjustHue(180));
          preset.items[6] = new ColorValue(primary.adjustHue(40));
          preset.items[10] = new ColorValue(primary.adjustHue(40));
        }
        return preset;
      });
    };
    Generator.getGradientByColorOptions = function getGradientByColorOptions(options) {
      const items = [];
      const pairs = [[1, 2], [1, 4], [5, 12], [1, 8], [8, 9], [1, 9], [10, 7], [7, 11]];
      pairs.forEach(pair => {
        items.push(new GradientValue({
          from: new ColorValue(options.items[pair[0] - 1]),
          to: new ColorValue(options.items[pair[1] - 1]),
          angle: GradientValue.DEFAULT_ANGLE,
          type: GradientValue.DEFAULT_TYPE
        }));
      });
      return {
        type: gradientType,
        items: items
      };
    };
    return Generator;
  }();
  Generator.BITRIX_COLOR = '#2fc6f6';
  Generator.cache = new main_core.Cache.MemoryCache();
  Generator.defaultPresets = [{
    id: 'blackAndWhite',
    items: ['#ffffff', '#f2f2f2', '#dbdbdb', '#b5b5b5', '#919191', '#808080', '#6e6e6e', '#5c5c5c', '#4a4a4a', '#242424', '#171717', '#000000']
  }, {
    id: 'agency',
    items: ['#ff6366', '#40191a', '#803233', '#bf4b4d', '#e65a5c', '#ffc1c2', '#363643', '#57dca3', '#ee76ba', '#ffa864', '#eaeaec', '#fadbdc'
    // '#ff6366', '#2b2b2b', '#595959', '#858585', '#ff4245', '#ffc1c2',
    // '#3d3d3d', '#33ffa7', '#ff66bd', '#ffa864', '#ebebeb', '#ffd6d8',
    ]
  }, {
    id: 'accounting',
    items: ['#a5c33c', '#384215', '#6f8228', '#8fa834', '#b0cf40', '#dae6ae', '#4c4c4c', '#5d84e6', '#cd506b', '#fe6466', '#dfdfdf', '#e9f0cf'
    // '#c8ff00', '#445700', '#84a800', '#acdb00', '#cbff0f', '#e8ff94',
    // '#4c4c4c', '#4278ff', '#ff1f4f', '#ff6164', '#dfdfdf', '#f2ffc2',
    ]
  }, {
    id: 'app',
    items: ['#4fd2c2', '#1f524c', '#379187', '#46b8aa', '#54dece', '#c8f1ec', '#6639b6', '#e81c62', '#9a69ca', '#6279d8', '#ffc337', '#e9faf8'
    // '#24ffe5', '#383838', '#636363', '#808080', '#33ffe7', '#b8fff7',
    // '#5800f0', '#ff055d', '#999999', '#3d64ff', '#ffc337', '#e5fffc',
    ]
  }, {
    id: 'architecture',
    items: ['#c94645', '#4a1919', '#8a2f2f', '#b03c3c', '#d64949', '#eec3c3', '#363643', '#446d90', '#a13773', '#c98145', '#eaeaec', '#f9e8e7'
    // '#ff0f0f', '#303030', '#5c5c5c', '#757575', '#ff1f1f', '#ffb3b3',
    // '#3d3d3d', '#6b6b6b', '#6b6b6b', '#ff7b0f', '#ebebeb', '#ffe2e0',
    ]
  }, {
    id: 'business',
    items: ['#3949a0', '#232c61', '#313e87', '#3e4fad', '#556ced', '#d8d7dc', '#14122c', '#1d1937', '#a03949', '#2f295a', '#c87014', '#f4f4f5'
    // '#6e6e6e', '#424242', '#5c5c5c', '#757575', '#425fff', '#d9d9d9',
    // '#1f1f1f', '#292929', '#6e6e6e', '#424242', '#db7100', '#f5f5f5',
    ]
  }, {
    id: 'charity',
    items: ['#f5f219', '#f58419', '#f5cc19', '#a8e32a', '#f9f76a', '#fcfbb6', '#000000', '#262e37', '#74797f', '#e569b1', '#edeef0', '#fefedf'
    // '#fffb0f', '#ff830f', '#ffd30f', '#b3ff0f', '#fffc66', '#fffeb3',
    // '#000000', '#2e2e2e', '#7a7a7a', '#ff4db5', '#f0f0f0', '#ffffe0',
    ]
  }, {
    id: 'construction',
    items: ['#f7b70b', '#382a02', '#785905', '#b88907', '#dea509', '#fdf1d1', '#111111', '#a3a3a3', '#f7410b', '#f70b4b', '#d6dde9', '#fef9ea'
    // '#ffbc05', '#382900', '#805e00', '#bd8a00', '#e6a800', '#fff3d1',
    // '#111111', '#a3a3a3', '#ff3f05', '#ff0548', '#e0e0e0', '#fffaeb',
    ]
  }, {
    id: 'consulting',
    items: ['#21a79b', '#38afa5', '#14665f', '#1c8c83', '#30f2e2', '#a9ddd9', '#ec4672', '#58d400', '#f0ac00', '#2d6faf', '#2da721', '#e6f5f4'
    // '#00c7b6', '#00e6d2', '#007a70', '#00a89a', '#24ffed', '#c2c2c2',
    // '#ff3369', '#58d400', '#f0ac00', '#006edb', '#11c700', '#ededed',
    ]
  }, {
    id: 'corporate',
    items: ['#6ab8ee', '#31556e', '#4e86ad', '#5fa3d4', '#70c1fa', '#d2e9f8', '#36e2c0', '#ffaa3c', '#ee6a76', '#ffa468', '#5feb99', '#ebf4fb'
    // '#57b9ff', '#4f4f4f', '#7d7d7d', '#33aaff', '#6bc1ff', '#ccebff',
    // '#1affd1', '#ffaa3c', '#ff5765', '#ffa468', '#4dff97', '#e5f4ff',
    ]
  }, {
    id: 'courses',
    items: ['#6bda95', '#2c593d', '#4b9969', '#5ebf83', '#70e69d', '#c2f0d3', '#31556e', '#ff947d', '#738ed3', '#f791ab', '#ffb67d', '#e2f8eb'
    // '#47ff8e', '#424242', '#737373', '#8f8f8f', '#57ff97', '#b3ffcf',
    // '#4f4f4f', '#ff947d', '#477bff', '#ff8aa7', '#ffb67d', '#dbffea',
    ]
  }, {
    id: 'event',
    items: ['#f73859', '#380d14', '#781c2b', '#b82a42', '#de334f', '#fdbbc6', '#151726', '#ffb553', '#30d59b', '#b265e0', '#edeef0', '#ffeaed'
    // '#ff2e51', '#47000c', '#940019', '#e00025', '#ff143c', '#ffb8c4',
    // '#1f1f1f', '#ffb553', '#05ffa8', '#bc47ff', '#f0f0f0', '#ffeaed',
    ]
  }, {
    id: 'gym',
    items: ['#6b7de0', '#2f3661', '#4d5aa1', '#5f6fc7', '#7284ed', '#e4e8fa', '#333333', '#ffd367', '#a37fe8', '#e06b7d', '#6dc1e0', '#f4f6fd'
    // '#4d67ff', '#474747', '#787878', '#949494', '#6179ff', '#e0e6ff',
    // '#333333', '#ffd367', '#9c66ff', '#ff4d67', '#4dcfff', '#f0f3ff',
    ]
  }, {
    id: 'lawyer',
    items: ['#e74c3c', '#69231b', '#a8382c', '#cf4536', '#f55240', '#f9d0cb', '#4e4353', '#5a505e', '#e7863c', '#38a27f', '#e2e1e3', '#fdeeec'
    // '#ff3a24', '#850d00', '#d61500', '#ff1e05', '#ff4c38', '#ffcdc7',
    // '#4a4a4a', '#575757', '#ff8324', '#6e6e6e', '#e3e3e3', '#ffedeb',
    ]
  }, {
    id: 'photography',
    items: ['#f7a700', '#382600', '#785200', '#b87d00', '#de9800', '#fde8ba', '#333333', '#0b5aa0', '#e93d18', '#06c4ed', '#3672a8', '#fff6e3'
    // '#f7a700', '#382600', '#785200', '#b87d00', '#de9800', '#ffe8b8',
    // '#333333', '#005cad', '#ff2f00', '#00c8f5', '#0078e0', '#fff6e3',
    ]
  }, {
    id: 'restaurant',
    items: ['#e6125d', '#660829', '#a60d43', '#cc1052', '#f21361', '#facfde', '#0eb88e', '#00946f', '#e04292', '#9b12e6', '#bfde00', '#fef2f6'
    // '#fa0057', '#700027', '#b3003e', '#db004d', '#ff055d', '#ffccde',
    // '#00c795', '#00946f', '#ff2491', '#a200fa', '#bfde00', '#fff0f5',
    ]
  }, {
    id: 'shipping',
    items: ['#ff0000', '#400000', '#800000', '#bf0000', '#e60000', '#ffb4b4', '#333333', '#ff822a', '#d63986', '#00ac6b', '#ffb800', '#fff3f3'
    // '#ff0000', '#400000', '#800000', '#bf0000', '#e60000', '#ffb4b4',
    // '#333333', '#ff822a', '#ff0f83', '#00ac6b', '#ffb800', '#fff3f3',
    ]
  }, {
    id: 'spa',
    items: ['#9dba04', '#313b01', '#667a02', '#86a103', '#a6c704', '#e4ecb9', '#ba7c04', '#cf54bb', '#049dba', '#1d7094', '#eead2f', '#f2f6dd'
    // '#9dbd00', '#333d00', '#667a00', '#88a300', '#aacc00', '#f2ffa8',
    // '#bd7e00', '#ff24da', '#009dbd', '#007db3', '#ffb41f', '#f8ffd6',
    ]
  }, {
    id: 'travel',
    items: ['#ee4136', '#6e1f19', '#ad3128', '#d43c31', '#fa4639', '#fef1f0', '#31353e', '#3e434d', '#ee8036', '#428abc', '#eaebec', '#c3c4c7'
    // '#ff3224', '#850900', '#d60e00', '#ff1605', '#ff4133', '#fff1f0',
    // '#383838', '#454545', '#ff7b24', '#808080', '#ebebeb', '#c4c4c4',
    ]
  }, {
    id: 'wedding',
    items: ['#d65779', '#572431', '#963e55', '#bd4d6b', '#e35d81', '#f7dfe5', '#af58a7', '#6bc34b', '#ec8c60', '#50a098', '#57b9d6', '#fdf4f6'
    // '#ff2e66', '#3d3d3d', '#6b6b6b', '#858585', '#ff4275', '#ffd6e0',
    // '#858585', '#4fff0f', '#ff854d', '#787878', '#2eceff', '#fff0f3',
    ]
  }];
  let Preset = /*#__PURE__*/function (_main_core_events$Eve3) {
    function Preset(options) {
      var _this5;
      _this5 = _main_core_events$Eve3.call(this) || this;
      _this5.cache = new main_core.Cache.MemoryCache();
      _this5.setEventNamespace('BX.Landing.UI.Field.Color.Preset');
      _this5.id = options.id;
      _this5.type = options.type || defaultType;
      _this5.items = options.items;
      _this5.activeItem = null;
      return _this5;
    }
    babelHelpers.inherits(Preset, _main_core_events$Eve3);
    var _proto7 = Preset.prototype;
    _proto7.getId = function getId() {
      return this.id;
    };
    _proto7.getGradientPreset = function getGradientPreset() {
      const options = this.type === gradientType ? {
        type: gradientType,
        items: this.items
      } : Generator.getGradientByColorOptions({
        items: this.items
      });
      return new Preset(options);
    };
    _proto7.getLayout = function getLayout() {
      return this.cache.remember('layout', () => {
        return main_core.Tag.render(_templateObject9 || (_templateObject9 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<div class=\"landing-ui-field-color-preset\">\n\t\t\t\t\t", "\n\t\t\t\t</div>\n\t\t\t"])), this.items.map(item => {
          return this.getItemLayout(item.getName());
        }));
      });
    };
    _proto7.getItemLayout = function getItemLayout(name) {
      return this.cache.remember(name, () => {
        const color = this.getItemByName(name);
        const style = main_core.Type.isString(color) ? color : color.getStyleString();
        const item = main_core.Tag.render(_templateObject0 || (_templateObject0 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<div\n\t\t\t\t\tclass=\"landing-ui-field-color-preset-item\"\n\t\t\t\t\tstyle=\"background: ", "\"\n\t\t\t\t\tdata-name=\"", "\"\n\t\t\t\t></div>\n\t\t\t"])), style, name);
        main_core.Event.bind(item, 'click', this.onItemClick.bind(this));
        return item;
      });
    };
    _proto7.getItemByName = function getItemByName(name) {
      return this.items.find(item => name === item.getName()) || null;
    };
    _proto7.isPresetValue = function isPresetValue(value) {
      if (value === null) {
        return false;
      }
      return this.items.some(item => {
        if (item instanceof ColorValue && value instanceof ColorValue) {
          return ColorValue.compare(item, new ColorValue(value).setOpacity(1));
        } else if (item instanceof GradientValue && value instanceof GradientValue) {
          return GradientValue.compare(item, value, false);
        }
        return false;
      });
    };
    _proto7.onItemClick = function onItemClick(event) {
      this.setActiveItem(event.currentTarget.dataset.name);
      let value = null;
      if (this.activeItem !== null) {
        value = this.activeItem instanceof GradientValue ? new GradientValue(this.activeItem) : new ColorValue(this.activeItem);
      }
      this.emit('onChange', {
        color: value
      });
    };
    _proto7.setActiveItem = function setActiveItem(name) {
      this.activeItem = this.getItemByName(name);
      this.items.forEach(item => {
        const itemName = item.getName();
        if (name === itemName) {
          main_core.Dom.addClass(this.getItemLayout(itemName), Preset.ACTIVE_CLASS);
        } else {
          main_core.Dom.removeClass(this.getItemLayout(itemName), Preset.ACTIVE_CLASS);
        }
      });
    };
    _proto7.setActiveValue = function setActiveValue(value) {
      if (value !== null) {
        if (value instanceof GradientValue) {
          this.setActiveItem(new GradientValue(value).setAngle(GradientValue.DEFAULT_ANGLE).setType(GradientValue.DEFAULT_TYPE).getName());
        } else {
          this.setActiveItem(new ColorValue(value).setOpacity(1).getName());
        }
      }
    };
    _proto7.setActiveHex = function setActiveHex(hexValue) {
      this.items.forEach(item => {
        const hexItem = item.getHex();
        if (hexValue === hexItem) {
          this.setActiveItem(item.getName());
        }
      });
    };
    _proto7.unsetActive = function unsetActive() {
      this.items.forEach(item => {
        main_core.Dom.removeClass(this.getItemLayout(item.getName()), Preset.ACTIVE_CLASS);
      });
    };
    _proto7.isActive = function isActive() {
      return this.items.some(item => {
        return main_core.Dom.hasClass(this.getItemLayout(item.getName()), Preset.ACTIVE_CLASS);
      });
    };
    return Preset;
  }(main_core_events.EventEmitter);
  Preset.ACTIVE_CLASS = 'active';
  let PresetCollection = /*#__PURE__*/function (_main_core_events$Eve4) {
    function PresetCollection(options) {
      var _this6;
      _this6 = _main_core_events$Eve4.call(this) || this;
      _this6.presets = {};
      _this6.activeId = null;
      _this6.cache = new main_core.Cache.MemoryCache();
      _this6.setEventNamespace('BX.Landing.UI.Field.Color.PresetCollection');
      _this6.popupId = 'presets-popup_' + main_core.Text.getRandom();
      _this6.popupTargetContainer = options.contentRoot;
      _this6.onPresetClick = _this6.onPresetClick.bind(_this6);
      main_core.Event.bind(_this6.getOpenButton(), 'click', () => {
        _this6.getPopup().toggle();
      });
      _this6.onPresetChangeGlobal = _this6.onPresetChangeGlobal.bind(_this6);
      main_core_events.EventEmitter.subscribe('BX.Landing.UI.Field.Color.PresetCollection:onChange', _this6.onPresetChangeGlobal);
      return _this6;
    }
    babelHelpers.inherits(PresetCollection, _main_core_events$Eve4);
    var _proto8 = PresetCollection.prototype;
    _proto8.addDefaultPresets = function addDefaultPresets() {
      this.addPreset(Generator.getPrimaryColorPreset());
      Generator.getDefaultPresets().map(item => {
        this.addPreset(item);
      });
    };
    _proto8.addPreset = function addPreset(options) {
      this.cache.delete('popupLayout');
      if (!Object.keys(this.presets).length || !(options.id in this.presets)) {
        this.presets[options.id] = options;
      }
    };
    _proto8.getGlobalActiveId = function getGlobalActiveId() {
      return PresetCollection.globalActiveId;
    };
    _proto8.getActiveId = function getActiveId() {
      return this.getGlobalActiveId() || this.getDefaultPreset().getId();
    };
    _proto8.getActivePreset = function getActivePreset() {
      return this.getPresetById(this.getActiveId());
    };
    _proto8.getDefaultPreset = function getDefaultPreset() {
      return Object.keys(this.presets).length ? this.getPresetById(Object.keys(this.presets)[0]) : null;
    };
    _proto8.getPresetById = function getPresetById(id) {
      if (id in this.presets) {
        return this.cache.remember(id, () => new Preset(this.presets[id]));
      } else {
        return null;
      }
    };
    _proto8.getAllPresets = function getAllPresets() {
      return Object.keys(this.presets).map(id => this.getPresetById(id)).filter(Boolean);
    };
    _proto8.getPresetByItemValue = function getPresetByItemValue(value) {
      if (value === null) {
        return null;
      }
      for (let id in this.presets) {
        const preset = this.getPresetById(id);
        if (preset && value instanceof ColorValue) {
          if (preset.isPresetValue(value)) {
            return preset;
          }
        } else if (preset && value instanceof GradientValue) {
          if (preset.getGradientPreset().isPresetValue(value)) {
            return preset;
          }
        }
      }
      return null;
    };
    _proto8.getLayout = function getLayout() {
      return this.cache.remember('value', () => {
        return main_core.Tag.render(_templateObject1 || (_templateObject1 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<div class=\"landing-ui-field-color-presets\">\n\t\t\t\t\t<div class=\"landing-ui-field-color-presets-left\">\n\t\t\t\t\t\t<span class=\"landing-ui-field-color-presets-title\">\n\t\t\t\t\t\t\t", "\n\t\t\t\t\t\t</span>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"landing-ui-field-color-presets-right\">", "</div>\n\t\t\t\t</div>\n\t\t\t"])), main_core.Loc.getMessage('LANDING_FIELD_COLOR-PRESETS_TITLE'), this.getOpenButton());
      });
    };
    _proto8.getOpenButton = function getOpenButton() {
      return this.cache.remember('openButton', () => {
        return main_core.Tag.render(_templateObject10 || (_templateObject10 = babelHelpers.taggedTemplateLiteral(["<span class=\"landing-ui-field-color-presets-open\">\n\t\t\t\t", "\n\t\t\t</span>"])), main_core.Loc.getMessage('LANDING_FIELD_COLOR-PRESETS_MORE'));
      });
    };
    _proto8.getTitleContainer = function getTitleContainer() {
      return this.cache.remember('titleContainer', () => {
        return this.getLayout().querySelector('.landing-ui-field-color-presets-left');
      });
    };
    _proto8.getPopup = function getPopup() {
      // todo: bind to event target? or need button
      return this.cache.remember('popup', () => {
        return main_popup.PopupManager.create({
          id: this.popupId,
          className: 'presets-popup',
          autoHide: true,
          bindElement: this.getOpenButton(),
          bindOptions: {
            forceTop: true,
            forceLeft: true
          },
          width: 280,
          offsetLeft: -200,
          content: this.getPopupLayout(),
          closeByEsc: true,
          targetContainer: this.popupTargetContainer
        });
      });
    };
    _proto8.getPopupLayout = function getPopupLayout() {
      return this.cache.remember('popupLayout', () => {
        const layouts = main_core.Tag.render(_templateObject11 || (_templateObject11 = babelHelpers.taggedTemplateLiteral(["<div class=\"landing-ui-field-color-presets-popup\">\n\t\t\t\t<div class=\"landing-ui-field-color-presets-popup-title\">\n\t\t\t\t\t", "\n\t\t\t\t</div>\n\t\t\t\t<div class=\"landing-ui-field-color-presets-popup-inner\"></div>\n\t\t\t</div>"])), main_core.Loc.getMessage('LANDING_FIELD_COLOR-PRESETS_MORE_COLORS'));
        const innerLayouts = layouts.querySelector('.landing-ui-field-color-presets-popup-inner');
        for (const presetId in this.presets) {
          const layout = this.getPresetLayout(presetId);
          if (presetId === this.getActiveId()) {
            main_core.Dom.addClass(layout, PresetCollection.ACTIVE_CLASS);
            this.activeId = presetId;
          }
          main_core.Event.bind(layout, 'click', this.onPresetClick);
          main_core.Dom.append(layout, innerLayouts);
        }
        return layouts;
      });
    };
    _proto8.getPresetLayout = function getPresetLayout(presetId) {
      return this.cache.remember(presetId + 'layout', () => {
        return main_core.Tag.render(_templateObject12 || (_templateObject12 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<div class=\"landing-ui-field-color-presets-preset\" data-id=\"", "\">\n\t\t\t\t\t", "\n\t\t\t\t</div>\n\t\t\t"])), presetId, this.presets[presetId].items.map(item => {
          return main_core.Tag.render(_templateObject13 || (_templateObject13 = babelHelpers.taggedTemplateLiteral(["<div\n\t\t\t\t\t\t\t\tclass=\"landing-ui-field-color-presets-preset-item\"\n\t\t\t\t\t\t\t\tstyle=\"background: ", "\"\n\t\t\t\t\t\t\t></div>"])), main_core.Type.isString(item) ? item : item.getStyleString());
        }));
      });
    };
    _proto8.onPresetClick = function onPresetClick(event) {
      this.getPopup().close();
      this.setActiveItem(event.currentTarget.dataset.id);
      this.emit('onChange', {
        presetId: this.getActiveId()
      });
    };
    _proto8.onPresetChangeGlobal = function onPresetChangeGlobal(event) {
      if (event.getData().presetId !== this.activeId) {
        this.setActiveItem(event.getData().presetId);
        this.emit('onChange', event);
      }
    };
    _proto8.setActiveItem = function setActiveItem(presetId) {
      if (presetId !== null && presetId !== this.activeId) {
        PresetCollection.globalActiveId = presetId;
        this.activeId = presetId;
        for (const id in this.presets) {
          main_core.Dom.removeClass(this.getPresetLayout(id), PresetCollection.ACTIVE_CLASS);
          if (id === presetId) {
            main_core.Dom.addClass(this.getPresetLayout(id), PresetCollection.ACTIVE_CLASS);
          }
        }
      }
    };
    _proto8.unsetActive = function unsetActive() {
      for (const presetId in this.presets) {
        main_core.Dom.removeClass(this.getPresetLayout(presetId), PresetCollection.ACTIVE_CLASS);
      }
    };
    return PresetCollection;
  }(main_core_events.EventEmitter);
  PresetCollection.globalActiveId = null;
  PresetCollection.ACTIVE_CLASS = 'active';
  let Recent = /*#__PURE__*/function (_main_core_events$Eve5) {
    function Recent() {
      var _this7;
      _this7 = _main_core_events$Eve5.call(this) || this;
      _this7.cache = new main_core.Cache.MemoryCache();
      _this7.setEventNamespace('BX.Landing.UI.Field.Color.Recent');
      return _this7;
    }
    babelHelpers.inherits(Recent, _main_core_events$Eve5);
    var _proto9 = Recent.prototype;
    _proto9.getLayout = function getLayout() {
      return this.getLayoutContainer();
    };
    _proto9.getLayoutContainer = function getLayoutContainer() {
      return this.cache.remember('layout', () => {
        return main_core.Tag.render(_templateObject14 || (_templateObject14 = babelHelpers.taggedTemplateLiteral(["<div class=\"landing-ui-field-color-recent\"></div>"])));
      });
    };
    Recent.initItems = function initItems() {
      return new Promise(resolve => {
        if (Recent.itemsLoaded) {
          resolve();
        } else {
          landing_backend.Backend.getInstance().action('Utils::getUserOption', {
            name: Recent.USER_OPTION_NAME
          }).then(result => {
            if (result && main_core.Type.isString(result.items)) {
              Recent.items = [];
              result.items.split(',').forEach(item => {
                if (isHex(item) && Recent.items.length < Recent.MAX_ITEMS) {
                  Recent.items.push(item);
                }
              });
              Recent.itemsLoaded = true;
            }
            resolve();
          });
        }
      });
    };
    _proto9.buildItemsLayout = function buildItemsLayout(activeHex = null) {
      if (activeHex) {
        this.activeHex = activeHex;
      }
      main_core.Dom.clean(this.getLayoutContainer());
      this.itemElements = [];
      Recent.items.forEach(item => {
        if (isHex(item)) {
          const isActive = this.activeHex === item;
          const itemLayout = main_core.Tag.render(_templateObject15 || (_templateObject15 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t\t<div \n\t\t\t\t\t\tclass=\"landing-ui-field-color-recent-item", "\"\n\t\t\t\t\t\tstyle=\"background:", "\"\n\t\t\t\t\t\tdata-value=\"", "\"\n\t\t\t\t\t></div>\n\t\t\t\t"])), isActive ? ' active' : '', item, item);
          this.itemElements.push(itemLayout);
          main_core.Event.bind(itemLayout, 'click', () => this.onItemClick(event, itemLayout));
          main_core.Dom.append(itemLayout, this.getLayoutContainer());
        }
      });
      return this;
    };
    _proto9.onItemClick = function onItemClick(event, clickedElement) {
      this.itemElements.forEach(el => BX.Dom.removeClass(el, 'active'));
      BX.Dom.addClass(clickedElement, 'active');
      this.activeHex = clickedElement.dataset.value;
      this.emit('onChange', {
        hex: event.currentTarget.dataset.value
      });
    };
    _proto9.addItem = function addItem(hex) {
      if (isHex(hex)) {
        const pos = Recent.items.indexOf(hex);
        if (pos !== -1) {
          Recent.items.splice(pos, 1);
        }
        Recent.items.unshift(hex);
        if (Recent.items.length > Recent.MAX_ITEMS) {
          Recent.items.splice(Recent.MAX_ITEMS);
        }
        this.buildItemsLayout();
        this.saveItems();
      }
      return this;
    };
    _proto9.saveItems = function saveItems() {
      if (Recent.items.length > 0) {
        BX.userOptions.save('landing', Recent.USER_OPTION_NAME, 'items', Recent.items);
      }
      return this;
    };
    return Recent;
  }(main_core_events.EventEmitter);
  Recent.USER_OPTION_NAME = 'color_field_recent_colors';
  Recent.MAX_ITEMS = 24;
  Recent.items = [];
  Recent.itemsLoaded = false;
  let Favourite = /*#__PURE__*/function (_main_core_events$Eve6) {
    function Favourite() {
      var _this8;
      _this8 = _main_core_events$Eve6.call(this) || this;
      _this8.setEventNamespace('BX.Landing.UI.Field.Color.Favourite');
      _this8.cache = new main_core.Cache.MemoryCache();
      _this8.itemsContainer = null;
      _this8.isEditMode = false;
      _this8.activeHex = null;
      _this8.itemElements = [];
      _this8.buttonChange = null;
      _this8.buttonSave = null;
      return _this8;
    }
    babelHelpers.inherits(Favourite, _main_core_events$Eve6);
    var _proto0 = Favourite.prototype;
    _proto0.getLayout = function getLayout() {
      return this.getLayoutContainer();
    };
    _proto0.getLayoutContainer = function getLayoutContainer() {
      this.buttonChange = main_core.Tag.render(_templateObject16 || (_templateObject16 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-field-color-favourite-head-button-change\">\n\t\t\t\t", "\n\t\t\t</div>\n\t\t"])), main_core.Loc.getMessage('LANDING_FIELD_COLOR_FAVOURITES_BUTTON_CHANGE'));
      this.buttonSave = main_core.Tag.render(_templateObject17 || (_templateObject17 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-field-color-favourite-head-button-save\" hidden>\n\t\t\t\t", "\n\t\t\t</div>\n\t\t"])), main_core.Loc.getMessage('LANDING_FIELD_COLOR_FAVOURITES_BUTTON_SAVE'));
      main_core.Event.bind(this.buttonChange, 'click', () => this.onChangeButtonClick());
      main_core.Event.bind(this.buttonSave, 'click', () => this.onSaveButtonClick());
      return this.cache.remember('layout', () => {
        this.itemsContainer = main_core.Tag.render(_templateObject18 || (_templateObject18 = babelHelpers.taggedTemplateLiteral(["<div class=\"landing-ui-field-color-favourite-colors view-mode\"></div>"])));
        main_core.Dom.append(this.getItemsLayout(), this.itemsContainer);
        return main_core.Tag.render(_templateObject19 || (_templateObject19 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<div>\n\t\t\t\t\t<div class=\"landing-ui-field-color-favourite-head\">\n\t\t\t\t\t\t<div class=\"landing-ui-field-color-favourite-head-title\">\n\t\t\t\t\t\t\t", "\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"landing-ui-field-color-favourite-head-buttons\">\n\t\t\t\t\t\t\t", "\n\t\t\t\t\t\t\t", "\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t\t", "\n\t\t\t\t</div>\n\t\t\t"])), main_core.Loc.getMessage('LANDING_FIELD_COLOR_FAVOURITES_TITLE'), this.buttonChange, this.buttonSave, this.itemsContainer);
      });
    };
    Favourite.initItems = function initItems() {
      return new Promise(resolve => {
        if (Favourite.itemsLoaded) {
          resolve();
        } else {
          landing_backend.Backend.getInstance().action('Utils::getUserOption', {
            name: Favourite.USER_OPTION_NAME
          }).then(result => {
            if (result && main_core.Type.isString(result.items)) {
              Favourite.items = [];
              result.items.split(',').forEach(item => {
                if (isHex(item) && Favourite.items.length < Favourite.MAX_ITEMS) {
                  Favourite.items.push(item);
                }
              });
              Favourite.itemsLoaded = true;
            }
            resolve();
          }).catch(() => {
            resolve();
          });
        }
      });
    };
    _proto0.getItemsLayout = function getItemsLayout(activeHex = null) {
      const itemLayoutButtonAdd = main_core.Tag.render(_templateObject20 || (_templateObject20 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-field-color-favourite-item-container\">\n\t\t\t\t<div class=\"landing-ui-field-color-favourite-item-add\"></div>\n\t\t\t</div>\n\t\t"])));
      main_core.Event.bind(itemLayoutButtonAdd, 'click', () => this.onAddButtonClick());
      if (activeHex) {
        this.setActiveHex(activeHex);
      }
      this.itemElements = [];
      const itemsContainer = main_core.Tag.render(_templateObject21 || (_templateObject21 = babelHelpers.taggedTemplateLiteral(["<div class=\"landing-ui-field-color-favourite-items-container\"></div>"])));
      main_core.Dom.append(itemLayoutButtonAdd, itemsContainer);
      Favourite.items.forEach(item => {
        if (isHex(item)) {
          const isActive = this.activeHex === item;
          const removeButton = main_core.Tag.render(_templateObject22 || (_templateObject22 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t\t<div class=\"landing-ui-field-color-favourite-item-remove-button\"", "></div>\n\t\t\t\t"])), this.isEditMode ? '' : ' hidden');
          const itemLayout = main_core.Tag.render(_templateObject23 || (_templateObject23 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t\t<div class=\"landing-ui-field-color-favourite-item-container ", "\">\n\t\t\t\t\t\t<div \n\t\t\t\t\t\t\tclass=\"landing-ui-field-color-favourite-item\"\n\t\t\t\t\t\t\tstyle=\"background:", "\"\n\t\t\t\t\t\t\tdata-value=\"", "\"\n\t\t\t\t\t\t></div>\n\t\t\t\t\t\t", "\n\t\t\t\t\t</div>\n\t\t\t\t"])), isActive ? ' active' : '', item, item, removeButton);
          this.itemElements.push(itemLayout);
          const colorItem = itemLayout.querySelector('.landing-ui-field-color-favourite-item');
          if (colorItem) {
            main_core.Event.bind(colorItem, 'click', event => this.onItemClick(event, itemLayout));
          }
          if (removeButton) {
            main_core.Event.bind(removeButton, 'click', event => this.onRemoveButtonClick(event, item, itemLayout));
          }
          main_core.Dom.append(itemLayout, itemsContainer);
        }
      });
      return itemsContainer;
    };
    _proto0.buildItemsLayout = function buildItemsLayout(activeHex = null) {
      if (activeHex) {
        this.setActiveHex(activeHex);
      }
      if (this.itemsContainer) {
        main_core.Dom.clean(this.itemsContainer);
        main_core.Dom.append(this.getItemsLayout(), this.itemsContainer);
      }
    };
    _proto0.onItemClick = function onItemClick(event, clickedElement) {
      this.itemElements.forEach(el => BX.Dom.removeClass(el, 'active'));
      BX.Dom.addClass(clickedElement, 'active');
      this.setActiveHex(clickedElement.dataset.value);
      this.emit('onSelectColor', {
        hex: event.currentTarget.dataset.value
      });
    };
    _proto0.onAddButtonClick = function onAddButtonClick() {
      if (this.activeHex !== null) {
        this.addItem(this.activeHex);
      }
      this.emit('onAddColor', {
        hex: this.activeHex
      });
    };
    _proto0.onRemoveButtonClick = function onRemoveButtonClick(event, hex) {
      event.stopPropagation();
      this.removeItem(hex);
      this.emit('onRemoveColor', {
        hex
      });
    };
    _proto0.onChangeButtonClick = function onChangeButtonClick() {
      this.emit('onEditColors');
      this.isEditMode = true;
      BX.Dom.removeClass(this.itemsContainer, Favourite.MODE_CLASSES.VIEW);
      BX.Dom.addClass(this.itemsContainer, Favourite.MODE_CLASSES.EDIT);
      if (this.buttonChange && this.buttonSave) {
        this.buttonChange.setAttribute('hidden', 'true');
        this.buttonSave.removeAttribute('hidden');
      }
      const removeButtons = this.itemsContainer ? this.itemsContainer.querySelectorAll('.landing-ui-field-color-favourite-item-remove-button') : [];
      removeButtons.forEach(btn => btn.removeAttribute('hidden'));
    };
    _proto0.onSaveButtonClick = function onSaveButtonClick() {
      this.emit('onSaveColors');
      this.isEditMode = false;
      BX.Dom.addClass(this.itemsContainer, Favourite.MODE_CLASSES.VIEW);
      BX.Dom.removeClass(this.itemsContainer, Favourite.MODE_CLASSES.EDIT);
      if (this.buttonChange && this.buttonSave) {
        this.buttonSave.setAttribute('hidden', 'true');
        this.buttonChange.removeAttribute('hidden');
      }
      const removeButtons = this.itemsContainer ? this.itemsContainer.querySelectorAll('.landing-ui-field-color-favourite-item-remove-button') : [];
      removeButtons.forEach(btn => btn.setAttribute('hidden', ''));
    };
    _proto0.addItem = function addItem(hex) {
      if (isHex(hex)) {
        const pos = Favourite.items.indexOf(hex);
        if (pos !== -1) {
          Favourite.items.splice(pos, 1);
        }
        Favourite.items.unshift(hex);
        if (Favourite.items.length > Favourite.MAX_ITEMS) {
          Favourite.items.splice(Favourite.MAX_ITEMS);
        }
        this.buildItemsLayout(hex);
        this.saveItems();
      }
      return this;
    };
    _proto0.removeItem = function removeItem(hex) {
      if (isHex(hex)) {
        const index = Favourite.items.indexOf(hex);
        if (index !== -1) {
          Favourite.items.splice(index, 1);
        }
        this.buildItemsLayout();
        this.saveItems();
      }
      return this;
    };
    _proto0.saveItems = function saveItems() {
      if (Favourite.items.length > 0) {
        BX.userOptions.save('landing', Favourite.USER_OPTION_NAME, 'items', Favourite.items);
      }
      return this;
    };
    _proto0.setActiveHex = function setActiveHex(hex) {
      this.activeHex = hex;
    };
    return Favourite;
  }(main_core_events.EventEmitter);
  Favourite.USER_OPTION_NAME = 'color_field_favourite_colors';
  Favourite.MAX_ITEMS = 80;
  Favourite.items = [];
  Favourite.itemsLoaded = false;
  Favourite.MODE_CLASSES = {
    VIEW: 'view-mode',
    EDIT: 'edit-mode'
  };
  let ColorPopup = /*#__PURE__*/function (_BaseControl4) {
    function ColorPopup(options) {
      var _this9;
      _this9 = _BaseControl4.call(this) || this;

      //todo: check for inline twice call

      _this9.options = options;
      _this9.hexPreview = options.hexPreview;
      _this9.isHexPreviewMode = options.hexPreviewMode;
      _this9.isNeedCalcPopupOffset = options.isNeedCalcPopupOffset;
      _this9.isNeedResetPopupWhenOpen = options.isNeedResetPopupWhenOpen;
      _this9.popupId = "colorpopup_".concat(main_core.Text.getRandom());
      _this9.popupTargetContainer = options.contentRoot;
      _this9.activeTab = ColorPopup.TABS.RECENT;
      if (_this9.hexPreview) {
        _this9.bindElement = _this9.hexPreview.getLayout();
        _this9.hexPreview.subscribe('onValidInput', _this9.onHexPreviewValidInput.bind(_this9));
      }
      if (_this9.options.bindElement) {
        _this9.bindElement = _this9.options.bindElement;
      }
      if (_this9.options.bindElement) {
        _this9.targetContainer = _this9.options.targetContainer;
      }
      _this9.tabButtons = {};
      _this9.tabContents = {};
      _this9.init();
      _this9.initAnalytics(options.analytics);
      return _this9;
    }
    babelHelpers.inherits(ColorPopup, _BaseControl4);
    var _proto1 = ColorPopup.prototype;
    _proto1.init = function init() {
      this.hex = new Hex();
      this.hex.subscribe('onChange', this.onHexChange.bind(this));
      this.recent = new Recent();
      this.recent.subscribe('onChange', this.onRecentChange.bind(this));
      this.spectrum = new Spectrum(this.options);
      this.spectrum.subscribe('onChange', this.onSpectrumChange.bind(this));
      this.spectrum.subscribe('onPickerDragStart', this.onSpectrumDragStart.bind(this));
      this.spectrum.subscribe('onPickerDragEnd', this.onSpectrumDragEnd.bind(this));
      this.presetCollection = new PresetCollection(this.options);
      this.presetCollection.addDefaultPresets();
      this.presets = this.presetCollection.getAllPresets();
      this.presets.forEach(preset => {
        preset.subscribe('onChange', this.onPresetChange.bind(this));
      });
      this.favourite = new Favourite();
      this.favourite.subscribe('onSelectColor', this.onFavouriteSelect.bind(this));
      this.favourite.subscribe('onAddColor', this.onAddFavouriteColor.bind(this));
      this.favourite.subscribe('onRemoveColor', this.onRemoveFavouriteColor.bind(this));
      this.favourite.subscribe('onEditColors', this.onEditFavouriteColors.bind(this));
      this.favourite.subscribe('onSaveColors', this.onSaveFavouriteColors.bind(this));
    };
    _proto1.initAnalytics = function initAnalytics(options) {
      this.analyticsCategory = ColorPopup.ANALYTICS.CATEGORY_DESIGN;
      if (this.hexPreview) {
        this.analyticsCElement = this.isHexPreviewMode ? ColorPopup.ANALYTICS.COLOR_TYPE_GRADIENT : ColorPopup.ANALYTICS.COLOR_TYPE_SOLID;
      }
      this.analyticsCSubSection = this.options.style;
      if (options) {
        if (options.category) {
          this.analyticsCategory = options.category;
        }
        if (options.c_sub_section) {
          this.analyticsCSubSection = options.c_sub_section;
        }
        if (options.p1) {
          this.analyticsP1 = options.p1;
        }
      }
    };
    _proto1.getPopup = function getPopup() {
      let offsetLeft = 0;
      let offsetTop = 3;
      const popupWidth = 287;
      const bindElementRectX = this.bindElement.getBoundingClientRect().x;
      const editorPanelCurrentElement = BX.Landing.UI.Panel.EditorPanel.getInstance().currentElement;
      if (editorPanelCurrentElement !== null && editorPanelCurrentElement.ownerDocument !== BX.Landing.PageObject.getRootWindow().document && !this.hexPreview) {
        offsetTop -= 66;
        const rootBodyWidth = BX.Landing.PageObject.getRootWindow().document.body.clientWidth;
        const editorBodyWidth = editorPanelCurrentElement.ownerDocument.body.clientWidth;
        const semiDiff = (rootBodyWidth - editorBodyWidth) / 2;
        const padding = 10;
        const maxAllowPopupRectX = editorBodyWidth + semiDiff - (popupWidth + padding);
        offsetLeft -= semiDiff;
        if (bindElementRectX > maxAllowPopupRectX) {
          offsetLeft -= bindElementRectX - maxAllowPopupRectX;
        }
      }
      if (this.bindElement && this.isNeedCalcPopupOffset !== false) {
        const panelWidth = 320;
        const panelPaddingRight = 12;
        offsetLeft = panelWidth - popupWidth - panelPaddingRight - bindElementRectX;
      }
      return this.cache.remember('popup', () => {
        return main_popup.PopupManager.create({
          id: this.popupId,
          className: 'landing-ui-field-color-popup',
          autoHide: true,
          autoHideHandler: event => {
            const target = event.target;
            if (target && target.closest('.popup-window-content') && !target.closest('.landing-ui-field-color-popup-picker-input')) {
              this.emit('onPopupClick');
            }
            if (!this.hexPreview) {
              return !(target && target.closest('.popup-window-content'));
            }
            return target !== this.hexPreview.getInput() && !this.getPopup().contentContainer.contains(target);
          },
          bindElement: this.bindElement,
          bindOptions: {
            forceTop: true,
            forceLeft: true
          },
          padding: 0,
          contentPadding: 0,
          width: popupWidth,
          offsetTop,
          offsetLeft,
          content: this.getPopupContent(),
          closeByEsc: true,
          targetContainer: this.popupTargetContainer ?? null,
          events: {
            onPopupClose: () => {
              this.favourite.onSaveButtonClick();
              this.emit('onPopupClose');
            },
            onPopupShow: () => {
              this.emit('onPopupShow');
            }
          }
        });
      });
    };
    _proto1.getPopupContent = function getPopupContent() {
      const tabNames = [{
        key: ColorPopup.TABS.RECENT,
        label: main_core.Loc.getMessage('LANDING_FIELD_COLOR_TAB_RECENT')
      }, {
        key: ColorPopup.TABS.SPECTRUM,
        label: main_core.Loc.getMessage('LANDING_FIELD_COLOR_TAB_SPECTRUM')
      }, {
        key: ColorPopup.TABS.PRESET,
        label: main_core.Loc.getMessage('LANDING_FIELD_COLOR_TAB_PRESETS')
      }];
      const tabButtonsRow = main_core.Tag.render(_templateObject24 || (_templateObject24 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-field-color-popup-tabs\"></div>\n\t\t"])));
      tabNames.forEach(tab => {
        const btn = main_core.Tag.render(_templateObject25 || (_templateObject25 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<button \n\t\t\t\t\tclass=\"landing-ui-field-color-popup-tab-btn\"\n\t\t\t\t\tdata-tab=\"", "\"\n\t\t\t\t\ttype=\"button\"\n\t\t\t\t>", "</button>\n\t\t\t"])), tab.key, tab.label);
        BX.Dom.append(btn, tabButtonsRow);
        this.tabButtons[tab.key] = btn;
        main_core.Event.bind(btn, 'click', () => this.setActiveTab(tab.key, true));
      });
      const recentTab = main_core.Tag.render(_templateObject26 || (_templateObject26 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-field-color-popup-container-recent\">\n\t\t\t\t", "\n\t\t\t</div>\n\t\t"])), this.recent.getLayout());
      const spectrumTab = main_core.Tag.render(_templateObject27 || (_templateObject27 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-field-color-popup-container-spectrum\" hidden>\n\t\t\t\t", "\n\t\t\t</div>\n\t\t"])), this.spectrum.getLayout());
      const presetsTab = main_core.Tag.render(_templateObject28 || (_templateObject28 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-field-color-popup-container-presets\" hidden>\n\t\t\t\t", "\n\t\t\t</div>\n\t\t"])), this.getPresetsLayout());
      this.tabContents = {
        recent: recentTab,
        spectrum: spectrumTab,
        preset: presetsTab
      };
      const favouriteColors = main_core.Tag.render(_templateObject29 || (_templateObject29 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-field-color-popup-favourite-colors\">\n\t\t\t\t", "\n\t\t\t</div>\n\t\t"])), this.favourite.getLayout());
      if (!this.hexPreview) {
        this.colorPickerPopup = this.getColorPickerPopupLayout();
        main_core.Event.bind(this.colorPickerPopup, 'input', this.onColorPopupInput.bind(this));
      }
      const content = main_core.Tag.render(_templateObject30 || (_templateObject30 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-field-color-popup-container\">\n\t\t\t\t", "\n\t\t\t\t", "\n\t\t\t\t", "\n\t\t\t\t", "\n\t\t\t\t", "\n\t\t\t\t", "\n\t\t\t</div>\n\t\t"])), this.colorPickerPopup ?? null, tabButtonsRow, recentTab, spectrumTab, presetsTab, favouriteColors);
      main_core.Event.bind(content, 'click', event => {
        event.preventDefault();
        event.stopPropagation();
      });
      this.setActiveTab(this.activeTab);
      return content;
    };
    _proto1.onPopupOpenClick = function onPopupOpenClick(event, bindElement = null) {
      if (bindElement !== null) {
        this.bindElement = bindElement;
      }
      if (!this.hexPreview && this.isNeedResetPopupWhenOpen !== false) {
        this.resetPopupValue();
      }
      Promise.all([Recent.initItems(), Favourite.initItems()]).then(() => {
        const popup = this.getPopup();
        if (this.hexPreview && !popup.isShown()) {
          if (event.target === this.hexPreview.getLayout()) {
            this.setActiveTab(ColorPopup.TABS.RECENT);
          }
          if (event.target === this.hexPreview.getInput()) {
            this.setActiveTab(ColorPopup.TABS.SPECTRUM);
          }
        }
        if (Recent.items.length === 0) {
          this.setActiveTab(ColorPopup.TABS.PRESET);
        }
        if (!popup.isShown()) {
          this.sendAnalytics(ColorPopup.ANALYTICS.EVENTS.OPEN_POPUP);
          popup.show();
          this.hex.focus();
        }
        this.recent.buildItemsLayout();
        this.favourite.buildItemsLayout();
      });
    };
    _proto1.resetPopupValue = function resetPopupValue() {
      this.resetColorPickerPopupValue();
      this.unsetActivePresets();
      this.recent.buildItemsLayout(ColorPopup.HEX_DEFAULT_TEXT);
      this.favourite.buildItemsLayout(ColorPopup.HEX_DEFAULT_TEXT);
      this.spectrum.hidePicker();
    };
    _proto1.onChangeColor = function onChangeColor(color) {
      this.emit('onColorPopupChange', color);
      if (!this.hexPreview) {
        const hex = main_core.Type.isString(color) && isHex(color) ? color : color && main_core.Type.isFunction(color.getHex) ? color.getHex() : null;
        this.updateColorPickerPopup(hex);
        this.emit('onHexColorPopupChange', hex);
      }
    };
    _proto1.setValue = function setValue(value) {
      if (!value) {
        return;
      }
      this.spectrum.setValue(value);
      this.hex.setValue(value);
      const hexValue = value.getHex();
      this.currentHexValue = hexValue;
      this.presets.forEach(preset => {
        preset.setActiveHex(hexValue);
      });
      this.recent.buildItemsLayout(hexValue);
      this.favourite.buildItemsLayout(hexValue);
      this.updateColorPickerPopup(hexValue);
    };
    _proto1.setHexValue = function setHexValue(hexValue) {
      this.setValue(new ColorValue(hexValue));
    };
    _proto1.getValue = function getValue() {
      return this.spectrum.getValue();
    };
    _proto1.getPresetsLayout = function getPresetsLayout() {
      return main_core.Tag.render(_templateObject31 || (_templateObject31 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-field-color-presets-list\">\n\t\t\t\t", "\n\t\t\t</div>\n\t\t"])), this.presets.map(preset => preset.getLayout()));
    };
    _proto1.getColorPickerPopupLayout = function getColorPickerPopupLayout() {
      this.colorPickerPopupId = "colorpicket_".concat(main_core.Text.getRandom());
      let value = ColorPopup.HEX_DEFAULT_TEXT;
      let bgValue = '#eeeeee';
      if (this.currentHexValue) {
        value = this.currentHexValue;
        bgValue = this.currentHexValue;
      }
      return main_core.Tag.render(_templateObject32 || (_templateObject32 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-field-color-popup-picker\">\n\t\t\t\t<div class=\"landing-ui-field-color-popup-picker-preview\" style=\"background-color: ", ";\"></div>\n\t\t\t\t<input id=\"", "\" type=\"text\" value=\"", "\" class=\"landing-ui-field-color-popup-picker-input\">\n\t\t\t</div>\n\t\t"])), bgValue, this.colorPickerPopupId, value);
    };
    _proto1.updateColorPickerPopup = function updateColorPickerPopup(hex) {
      if (!this.colorPickerPopup) {
        return;
      }
      const preview = this.colorPickerPopup.querySelector('.landing-ui-field-color-popup-picker-preview');
      if (preview) {
        BX.Dom.style(preview, 'background-color', hex);
      }
      const input = this.colorPickerPopup.querySelector('.landing-ui-field-color-popup-picker-input');
      if (input) {
        input.value = hex;
      }
    };
    _proto1.resetColorPickerPopupValue = function resetColorPickerPopupValue() {
      if (!this.colorPickerPopup) {
        return;
      }
      const preview = this.colorPickerPopup.querySelector('.landing-ui-field-color-popup-picker-preview');
      if (preview) {
        BX.Dom.style(preview, 'background-color', '#eeeeee');
      }
      const input = this.colorPickerPopup.querySelector('.landing-ui-field-color-popup-picker-input');
      if (input) {
        input.value = ColorPopup.HEX_DEFAULT_TEXT;
      }
    };
    _proto1.onColorPopupInput = function onColorPopupInput() {
      const input = this.colorPickerPopup.querySelector('.landing-ui-field-color-popup-picker-input');
      if (this.colorPopupInputTimeout) {
        clearTimeout(this.colorPopupInputTimeout);
      }
      this.colorPopupInputTimeout = setTimeout(() => {
        let value = input.value.replaceAll(/[^\da-f]/gi, '');
        value = value.slice(0, 6);
        const hex = "#".concat(value.toLowerCase());
        input.value = hex;
        const hexRegex = /^#([\da-f]{6})$/;
        if (hexRegex.test(hex)) {
          this.sendAnalytics(ColorPopup.ANALYTICS.EVENTS.SELECT_COLOR, {
            type: ColorPopup.ANALYTICS.TYPE_COLORS.HEX
          });
          const color = new ColorValue(hex);
          this.recent.addItem(hex);
          this.recent.buildItemsLayout();
          this.setValue(color);
          this.onChangeColor(hex);
        }
      }, 333);
    };
    _proto1.setActiveTab = function setActiveTab(tabKey, isUserClick = false) {
      if (isUserClick === true && tabKey !== this.activeTab) {
        this.sendAnalytics(ColorPopup.ANALYTICS.EVENTS.CHANGE_TAB, {
          type: tabKey
        });
      }
      this.activeTab = tabKey;
      if (this.activeTab === ColorPopup.TABS.RECENT) {
        this.recent.buildItemsLayout();
      }
      Object.entries(this.tabContents).forEach(([key, node]) => {
        node.hidden = key !== tabKey;
      });
      Object.entries(this.tabButtons).forEach(([key, btn]) => {
        if (key === tabKey) {
          BX.Dom.addClass(btn, 'active');
        } else {
          BX.Dom.removeClass(btn, 'active');
        }
      });
    };
    _proto1.onHexChange = function onHexChange(event) {
      this.unsetActivePresets();
      const color = event.getData().color;
      if (color) {
        this.recent.addItem(color.getHex());
      }
      this.setValue(color);
      this.onChange(event);
    };
    _proto1.onSpectrumChange = function onSpectrumChange(event) {
      const color = event.getData().color;
      this.unsetActivePresets();
      this.hex.unFocus();
      this.setValue(color);
      this.onChangeColor(color);
    };
    _proto1.onSpectrumDragStart = function onSpectrumDragStart(event) {
      landing_pageobject.PageObject.getRootWindow().document.activeElement.blur();
    };
    _proto1.onSpectrumDragEnd = function onSpectrumDragEnd(event) {
      this.sendAnalytics(ColorPopup.ANALYTICS.EVENTS.SELECT_COLOR, {
        type: ColorPopup.ANALYTICS.TYPE_COLORS.SPECTRUM
      });
      const color = event.getData().color;
      this.recent.addItem(color.getHex());
    };
    _proto1.onPresetChange = function onPresetChange(event) {
      this.sendAnalytics(ColorPopup.ANALYTICS.EVENTS.SELECT_COLOR, {
        type: ColorPopup.ANALYTICS.TYPE_COLORS.PRESET
      });
      const presetId = event.target.id;
      this.unsetActivePresets(presetId);
      const color = event.getData().color;
      this.recent.addItem(color.getHex());
      this.setValue(color);
      this.onChangeColor(color);
    };
    _proto1.onRecentChange = function onRecentChange(event) {
      this.sendAnalytics(ColorPopup.ANALYTICS.EVENTS.SELECT_COLOR, {
        type: ColorPopup.ANALYTICS.TYPE_COLORS.RECENT
      });
      this.unsetActivePresets();
      const color = new ColorValue(event.getData().hex);
      this.setValue(color);
      this.onChangeColor(color);
    };
    _proto1.unsetActivePresets = function unsetActivePresets(presetId = null) {
      this.presets.forEach(preset => {
        if (presetId !== preset.id) {
          preset.unsetActive();
        }
      });
    };
    _proto1.onFavouriteSelect = function onFavouriteSelect(event) {
      this.sendAnalytics(ColorPopup.ANALYTICS.EVENTS.SELECT_COLOR, {
        type: ColorPopup.ANALYTICS.TYPE_COLORS.MY
      });
      this.unsetActivePresets();
      const favouriteColor = new ColorValue(event.getData().hex);
      const color = event.getData().hex;
      this.recent.addItem(color);
      this.setValue(favouriteColor);
      this.onChangeColor(favouriteColor);
    };
    _proto1.onAddFavouriteColor = function onAddFavouriteColor(event) {
      this.sendAnalytics(ColorPopup.ANALYTICS.EVENTS.ADD_MY_COLOR);
    };
    _proto1.onHexPreviewValidInput = function onHexPreviewValidInput(event) {
      const color = event.getData().value;
      if (color) {
        this.recent.addItem("#".concat(color));
        this.recent.buildItemsLayout();
        this.sendAnalytics(ColorPopup.ANALYTICS.EVENTS.SELECT_COLOR, {
          type: ColorPopup.ANALYTICS.TYPE_COLORS.HEX
        });
      }
    };
    _proto1.onRemoveFavouriteColor = function onRemoveFavouriteColor(event) {};
    _proto1.onEditFavouriteColors = function onEditFavouriteColors(event) {};
    _proto1.onSaveFavouriteColors = function onSaveFavouriteColors(event) {};
    _proto1.getAnalyticsCategory = function getAnalyticsCategory() {
      return this.analyticsCategory;
    };
    _proto1.getAnalyticsCSubSection = function getAnalyticsCSubSection() {
      return this.analyticsCSubSection;
    };
    _proto1.getAnalyticsCElement = function getAnalyticsCElement() {
      return this.analyticsCElement ?? null;
    };
    _proto1.getAnalyticsP1 = function getAnalyticsP1() {
      return this.analyticsP1 ?? null;
    };
    _proto1.sendAnalytics = function sendAnalytics(event, params = {}) {
      const analyticsData = {
        event,
        tool: BX.Landing.Main.getAnalyticsCategoryByType(),
        category: params?.category || this.getAnalyticsCategory(),
        c_sub_section: params?.c_sub_section || this.getAnalyticsCSubSection(),
        p1: params?.p1 || this.getAnalyticsP1()
      };
      if (params && params.type) {
        analyticsData.type = params.type;
      }
      const cElement = this.getAnalyticsCElement();
      if (cElement !== null) {
        analyticsData.c_element = cElement;
      }
      BX.UI.Analytics.sendData(analyticsData);
    };
    return ColorPopup;
  }(BaseControl);
  ColorPopup.TABS = {
    RECENT: 'recent',
    SPECTRUM: 'spectrum',
    PRESET: 'preset'
  };
  ColorPopup.ANALYTICS = {
    CATEGORY_DESIGN: 'design_slider',
    COLOR_TYPE_GRADIENT: 'gradient',
    COLOR_TYPE_SOLID: 'solid',
    EVENTS: {
      OPEN_POPUP: 'open_color_popup',
      CHANGE_TAB: 'change_color_tab',
      SELECT_COLOR: 'select_color',
      ADD_MY_COLOR: 'add_my_color'
    },
    TYPE_COLORS: {
      RECENT: 'recent',
      SPECTRUM: 'spectrum',
      PRESET: 'preset',
      MY: 'my',
      HEX: 'hex'
    }
  };
  ColorPopup.HEX_DEFAULT_TEXT = '#hex';
  let BaseProcessor = /*#__PURE__*/function (_main_core_events$Eve7) {
    function BaseProcessor(options) {
      var _this0;
      _this0 = _main_core_events$Eve7.call(this) || this;
      _this0.cache = new main_core.Cache.MemoryCache();
      _this0.property = 'color';
      _this0.options = options;
      _this0.pseudoClass = null;
      _this0.setEventNamespace('BX.Landing.UI.Field.Processor.BaseProcessor');
      return _this0;
    }
    babelHelpers.inherits(BaseProcessor, _main_core_events$Eve7);
    var _proto10 = BaseProcessor.prototype;
    _proto10.getProperty = function getProperty() {
      return main_core.Type.isArray(this.property) ? this.property : [this.property];
    };
    _proto10.getVariableName = function getVariableName() {
      return main_core.Type.isArray(this.variableName) ? this.variableName : [this.variableName];
    };
    _proto10.isNullValue = function isNullValue(value) {
      return main_core.Type.isNull(value);
    };
    _proto10.getNullValue = function getNullValue() {
      return new ColorValue();
    };
    _proto10.getPseudoClass = function getPseudoClass() {
      return this.pseudoClass;
    };
    _proto10.getLayout = function getLayout() {
      return this.cache.remember('layout', () => {
        return this.buildLayout();
      });
    };
    _proto10.buildLayout = function buildLayout() {
      return main_core.Tag.render(_templateObject33 || (_templateObject33 = babelHelpers.taggedTemplateLiteral(["<div>Base processor</div>"])));
    };
    _proto10.getClassName = function getClassName() {
      return [this.className];
    };
    _proto10.getValue = function getValue() {};
    _proto10.getStyle = function getStyle() {
      if (main_core.Type.isNull(this.getValue())) {
        return {
          [this.getVariableName()]: null
        };
      }
      return {
        [this.getVariableName()]: this.getValue().getStyleString()
      };
    }

    /**
     * Set value by new format
     * @param value {string: string}
     */;
    _proto10.setProcessorValue = function setProcessorValue(value) {
      // Just get last css variable
      const processorProperty = this.getVariableName()[this.getVariableName().length - 1];
      this.cache.delete('value');
      this.setValue(value[processorProperty]);
    }

    /**
     * Set old-type value by computedStyle
     * @param value {string: string} | null
     */;
    _proto10.setDefaultValue = function setDefaultValue(value) {
      if (!main_core.Type.isNull(value)) {
        const inlineProperty = this.getProperty()[this.getProperty().length - 1];
        if (inlineProperty in value) {
          this.setValue(value[inlineProperty]);
          this.cache.delete('value');
          this.unsetActive();
          return;
        }
      }
      this.setValue(null);
      this.cache.set('value', null);
    };
    _proto10.setValue = function setValue(value) {};
    _proto10.unsetActive = function unsetActive() {};
    _proto10.onChange = function onChange() {
      this.cache.delete('value');
      this.emit('onChange');
    };
    _proto10.defineActiveControl = function defineActiveControl(items, currentNode) {};
    _proto10.setActiveControl = function setActiveControl(controlName) {};
    _proto10.prepareProcessorValue = function prepareProcessorValue(processorValue, defaultValue, data) {
      return processorValue;
    };
    return BaseProcessor;
  }(main_core_events.EventEmitter);
  let Colorpicker = /*#__PURE__*/function (_BaseControl5) {
    function Colorpicker(options) {
      var _this1;
      _this1 = _BaseControl5.call(this) || this;
      _this1.options = options;
      _this1.setEventNamespace('BX.Landing.UI.Field.Color.Colorpicker');
      _this1.popupId = "colorpicker_popup_".concat(main_core.Text.getRandom());
      _this1.popupTargetContainer = options.contentRoot;
      _this1.isHexPreviewMode = options.hexPreviewMode;
      _this1.hexPreview = new Hex();
      if (options.hexPreviewMode === true) {
        _this1.hexPreview.setPreviewMode(true);
      }
      _this1.options.hexPreview = _this1.hexPreview;

      // popup
      _this1.colorPopup = new ColorPopup(_this1.options);
      _this1.colorPopup.subscribe('onColorPopupChange', _this1.onColorPopupChange.bind(_this1));
      _this1.hex = new Hex();
      _this1.spectrum = new Spectrum(options);
      _this1.presetCollection = new PresetCollection(options);
      _this1.presetCollection.addDefaultPresets();
      _this1.presets = _this1.presetCollection.getAllPresets();

      // end popup

      _this1.initLoader();
      main_core.Event.bind(_this1.hexPreview.getLayout(), 'click', event => {
        if (!_this1.colorPopup.getPopup().isShown()) {
          BX.Dom.style(_this1.hexPreview.getButton(), 'opacity', '.5');
          _this1.loader.show();
        }
        _this1.colorPopup.onPopupOpenClick(event);
      });
      _this1.colorPopup.subscribe('onPopupShow', e => {
        _this1.loader.hide();
        BX.Dom.style(_this1.hexPreview.getButton(), 'opacity', '1');
      });
      _this1.hexPreview.subscribe('onValidInput', _this1.onValidInput.bind(_this1));
      _this1.hexPreview.subscribe('onChange', _this1.onHexChange.bind(_this1));
      _this1.tabButtons = {};
      _this1.tabContents = {};
      return _this1;
    }
    babelHelpers.inherits(Colorpicker, _BaseControl5);
    var _proto11 = Colorpicker.prototype;
    _proto11.initLoader = function initLoader() {
      this.loader = new BX.Loader({
        target: this.hexPreview.getLayout()
      });
      const loaderNode = this.loader.layout;
      if (loaderNode) {
        BX.Dom.style(loaderNode, 'width', '28px');
        BX.Dom.style(loaderNode, 'height', '28px');
        BX.Dom.style(loaderNode, 'left', 'unset');
        BX.Dom.style(loaderNode, 'right', '0');
        BX.Dom.style(loaderNode, 'transform', 'translate(0, -50%)');
      }
    };
    _proto11.buildLayout = function buildLayout() {
      return main_core.Tag.render(_templateObject34 || (_templateObject34 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-field-color-colorpicker\">\n\t\t\t\t", "\n\t\t\t</div>\n\t\t"])), this.hexPreview.getLayout());
    };
    _proto11.getHexPreviewObject = function getHexPreviewObject() {
      return this.hexPreview;
    };
    _proto11.getValue = function getValue() {
      return this.cache.remember('value', () => {
        return this.spectrum.getValue();
      });
    };
    _proto11.onColorPopupChange = function onColorPopupChange(event) {
      const color = event.getData();
      if (color) {
        this.setValue(color);
      }
      this.onChange(new main_core_events.BaseEvent({
        data: {
          color
        }
      }));
    };
    _proto11.onHexChange = function onHexChange(event) {
      const color = event.getData().color;
      this.setValue(color);
      this.onChange(event);
    };
    _proto11.onValidInput = function onValidInput(event) {
      const color = "#".concat(event.getData().value);
      if (color) {
        this.emit('onValidInput', {
          color
        });
      }
    };
    _proto11.setValue = function setValue(value) {
      if (this.isNeedSetValue(value)) {
        _BaseControl5.prototype.setValue.call(this, value);
        this.spectrum.setValue(value);
        this.hex.setValue(value);
        this.hexPreview.setValue(value);
        this.colorPopup.setValue(value);
        if (value) {
          const hexValue = value.getHex();
          this.presets.forEach(preset => {
            preset.setActiveHex(hexValue);
          });
        }
      }
      this.setActivity(value);
    };
    _proto11.setActivity = function setActivity(value) {
      if (value !== null) {
        if (this.spectrum.isActive()) {
          this.hex.unsetActive();
        } else {
          this.hex.setActive();
        }
        this.hexPreview.setActive();
      }
    };
    _proto11.unsetActive = function unsetActive() {
      this.hex.unsetActive();
      this.hexPreview.unsetActive();
    };
    _proto11.isActive = function isActive() {
      return this.hex.isActive() || this.hexPreview.isActive();
    };
    return Colorpicker;
  }(BaseControl);
  Colorpicker.TABS = {
    RECENT: 'recent',
    SPECTRUM: 'spectrum',
    PRESET: 'preset'
  };
  let ColorSet = /*#__PURE__*/function (_BaseControl6) {
    function ColorSet(options) {
      var _this10;
      _this10 = _BaseControl6.call(this) || this;
      _this10.options = options;
      _this10.setEventNamespace('BX.Landing.UI.Field.Color.ColorSet');
      _this10.colorpicker = new Colorpicker(options);
      _this10.colorpicker.subscribe('onChange', event => {
        _this10.preset.unsetActive();
        const color = event.getData().color;
        if (_this10.preset.isPresetValue(color)) {
          _this10.preset.setActiveValue(color);
          _this10.colorpicker.unsetActive();
        }
        _this10.onChange(event);
      });
      _this10.presets = new PresetCollection(options);
      _this10.presets.subscribe('onChange', event => {
        _this10.setPreset(_this10.presets.getPresetById(event.getData().presetId));
      });
      _this10.presets.addDefaultPresets();
      const preset = _this10.presets.getActivePreset();
      if (preset) {
        _this10.setPreset(preset);
      }
      return _this10;
    }
    babelHelpers.inherits(ColorSet, _BaseControl6);
    var _proto12 = ColorSet.prototype;
    _proto12.buildLayout = function buildLayout() {
      return main_core.Tag.render(_templateObject35 || (_templateObject35 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-field-color-colorset\">\n\t\t\t\t<div class=\"landing-ui-field-color-colorset-bottom\">\n\t\t\t\t\t", "\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t"])), this.colorpicker.getLayout());
    };
    _proto12.getTitleLayout = function getTitleLayout() {
      return this.cache.remember('titleLayout', () => {
        return this.getLayout().querySelector('.landing-ui-field-color-colorset-title');
      });
    };
    _proto12.getPresetContainer = function getPresetContainer() {
      return this.cache.remember('presetContainer', () => {
        return main_core.Tag.render(_templateObject36 || (_templateObject36 = babelHelpers.taggedTemplateLiteral(["<div class=\"landing-ui-field-color-colorset-preset-container\"></div>"])));
      });
    };
    _proto12.setPreset = function setPreset(preset) {
      this.preset = preset;
      this.preset.unsetActive();
      if (this.getValue() !== null && this.preset.isPresetValue(this.getValue())) {
        this.unsetActive();
        this.preset.setActiveValue(this.getValue());
      } else {
        this.unsetActive();
        this.colorpicker.setValue(this.getValue());
      }
      if (this.getValue() === null && this.options.content) {
        this.setColorFromContent();
      }
      this.preset.subscribe('onChange', event => {
        this.onPresetItemChange(event);
      });
      main_core.Dom.clean(this.getPresetContainer());
      main_core.Dom.append(preset.getLayout(), this.getPresetContainer());
      this.emit('onPresetChange', {
        preset
      });
    };
    _proto12.getPreset = function getPreset() {
      return this.preset;
    };
    _proto12.getPresetsCollection = function getPresetsCollection() {
      return this.presets;
    };
    _proto12.onPresetItemChange = function onPresetItemChange(event) {
      this.colorpicker.setValue(event.getData().color);
      this.colorpicker.unsetActive();
      this.onChange(event);
    };
    _proto12.onChange = function onChange(event) {
      this.cache.set('value', event.getData().color);
      this.emit('onChange', event);
    };
    _proto12.getValue = function getValue() {
      return this.cache.remember('value', () => {
        return this.colorpicker.getValue();
      });
    };
    _proto12.setValue = function setValue(value) {
      if (this.isNeedSetValue(value)) {
        _BaseControl6.prototype.setValue.call(this, value);
        this.colorpicker.setValue(value);
        const activePreset = this.presets.getGlobalActiveId() ? this.presets.getPresetById(this.presets.getGlobalActiveId()) : this.presets.getPresetByItemValue(value);
        if (activePreset !== null) {
          this.setPreset(activePreset);
          this.presets.setActiveItem(activePreset.getId());
        }
      }
    };
    _proto12.unsetActive = function unsetActive() {
      this.preset.unsetActive();
      this.colorpicker.unsetActive();
    };
    _proto12.isActive = function isActive() {
      return this.preset.isActive() || this.colorpicker.isActive();
    };
    _proto12.setColorFromContent = function setColorFromContent() {
      const contentValue = this.options.content;
      let contentHslColor = '';
      if (contentValue.startsWith('#')) {
        contentHslColor = hexToHsl(contentValue);
      }
      if (contentValue.startsWith('hsl')) {
        contentHslColor = hslStringToHsl(contentValue);
      }
      if (main_core.Type.isObject(contentHslColor)) {
        const contentColorValue = new ColorValue({
          h: contentHslColor.h,
          s: contentHslColor.s,
          l: contentHslColor.l,
          a: contentHslColor.a
        });
        this.unsetActive();
        this.colorpicker.setValue(contentColorValue);
      }
    };
    return ColorSet;
  }(BaseControl);
  let Opacity = /*#__PURE__*/function (_BaseControl7) {
    function Opacity(options) {
      var _this11;
      _this11 = _BaseControl7.call(this) || this;
      _this11.setEventNamespace('BX.Landing.UI.Field.Color.Opacity');
      _this11.defaultOpacity = main_core.Type.isObject(options) && Reflect.has(options, 'defaultOpacity') ? options.defaultOpacity : Opacity.DEFAULT_OPACITY;
      _this11.document = landing_pageobject.PageObject.getRootWindow().document;
      _this11.onPickerDragStart = _this11.onPickerDragStart.bind(_this11);
      _this11.onPickerDragMove = _this11.onPickerDragMove.bind(_this11);
      _this11.onPickerDragEnd = _this11.onPickerDragEnd.bind(_this11);
      _this11.layout = _this11.getLayout();
      _this11.pickerControl = _this11.layout.querySelector('.landing-ui-field-color-opacity');
      _this11.rangeControl = _this11.layout.querySelector('.landing-ui-field-color-opacity-range-output');
      _this11.arrowsUp = _this11.rangeControl.querySelector('.landing-ui-field-color-opacity-range-output-arrows-up');
      _this11.arrowsDown = _this11.rangeControl.querySelector('.landing-ui-field-color-opacity-range-output-arrows-down');
      _this11.rangeInput = _this11.rangeControl.querySelector('.landing-ui-field-color-opacity-range-output-input');
      main_core.Event.bind(_this11.arrowsUp, 'click', _this11.onArrowClick.bind(_this11, 'up'));
      main_core.Event.bind(_this11.arrowsDown, 'click', _this11.onArrowClick.bind(_this11, 'down'));
      main_core.Event.bind(_this11.pickerControl, 'mousedown', _this11.onPickerDragStart);
      const defaultPercent = parseInt(_this11.defaultOpacity * 100);
      main_core.Dom.attr(_this11.pickerControl, {
        'role': 'slider',
        'tabindex': 0,
        'aria-orientation': 'horizontal',
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-valuenow': defaultPercent,
        'aria-valuetext': "".concat(defaultPercent, "%"),
        'aria-label': main_core.Loc.getMessage('LANDING_FIELD_COLOR-TAB_OPACITY')
      });
      main_core.Event.bind(_this11.pickerControl, 'keydown', _this11.onSliderKeydown.bind(_this11));
      return _this11;
    }
    babelHelpers.inherits(Opacity, _BaseControl7);
    var _proto13 = Opacity.prototype;
    _proto13.buildLayout = function buildLayout() {
      const defaultOpacityValue = this.defaultOpacity * 100;
      const layout = main_core.Tag.render(_templateObject37 || (_templateObject37 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-field-color-opacity-container\">\n\t\t\t\t<div class=\"landing-ui-field-color-opacity\">\n\t\t\t\t\t", "\n\t\t\t\t\t", "\n\t\t\t\t</div>\n\t\t\t\t<div class=\"landing-ui-field-color-opacity-range-output\">\n\t\t\t\t\t<div \n\t\t\t\t\t\tclass=\"landing-ui-field-color-opacity-range-output-input\"\n\t\t\t\t\t\ttitle=\"", "\">\n\t\t\t\t\t\t", "\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"landing-ui-field-color-opacity-range-output-arrows\">\n\t\t\t\t\t\t<div class=\"landing-ui-field-color-opacity-range-output-arrows-up\"></div>\n\t\t\t\t\t\t<div class=\"landing-ui-field-color-opacity-range-output-arrows-down\"></div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t"])), this.getPicker(), this.getColorLayout(), defaultOpacityValue, defaultOpacityValue);
      this.setPickerPosByOpacity(this.defaultOpacity);
      return layout;
    };
    _proto13.onPickerDragStart = function onPickerDragStart(event) {
      if (event.ctrlKey || event.metaKey || event.button) {
        return;
      }
      main_core.Event.bind(this.document, 'mousemove', this.onPickerDragMove);
      main_core.Event.bind(this.document, 'mouseup', this.onPickerDragEnd);
      main_core.Dom.addClass(this.document.body, 'landing-ui-field-color-draggable');
      this.onPickerDragMove(event);
    };
    _proto13.onPickerDragMove = function onPickerDragMove(event) {
      if (event.target === this.getPicker()) {
        return;
      }
      this.setPickerPos(event.pageX);
      this.onChange();
      this.onRangeControlChange();
    };
    _proto13.onPickerDragEnd = function onPickerDragEnd() {
      main_core.Event.unbind(this.document, 'mousemove', this.onPickerDragMove);
      main_core.Event.unbind(this.document, 'mouseup', this.onPickerDragEnd);
      main_core.Dom.removeClass(this.document.body, 'landing-ui-field-color-draggable');
    }

    /**
     * Set picker by absolute page coords
     * @param x
     */;
    _proto13.setPickerPos = function setPickerPos(x) {
      const leftPos = Math.max(Math.min(x - this.getLayoutRect().left, this.getLayoutRect().width), 0);
      main_core.Dom.style(this.getPicker(), {
        left: "".concat(leftPos, "px")
      });
    };
    _proto13.setPickerPosByOpacity = function setPickerPosByOpacity(opacity) {
      opacity = Math.min(1, Math.max(0, opacity));
      main_core.Dom.style(this.getPicker(), {
        left: "".concat(opacity * 100, "%")
      });
    };
    _proto13.getLayoutRect = function getLayoutRect() {
      return this.cache.remember('layoutSize', () => {
        const layoutRect = this.pickerControl.getBoundingClientRect();
        return {
          width: layoutRect.width,
          left: layoutRect.left
        };
      });
    };
    _proto13.getColorLayout = function getColorLayout() {
      return this.cache.remember('colorLayout', () => {
        return main_core.Tag.render(_templateObject38 || (_templateObject38 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<div class=\"landing-ui-field-color-opacity-color\"></div>\n\t\t\t"])));
      });
    };
    _proto13.getPicker = function getPicker() {
      return this.cache.remember('picker', () => {
        return main_core.Tag.render(_templateObject39 || (_templateObject39 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<div class=\"landing-ui-field-color-opacity-picker\">\n\t\t\t\t\t<div class=\"landing-ui-field-color-opacity-picker-item\">\n\t\t\t\t\t\t<div class=\"landing-ui-field-color-opacity-picker-item-circle\"></div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>"])));
      });
    };
    _proto13.getDefaultValue = function getDefaultValue() {
      return this.cache.remember('default', () => {
        return new ColorValue(Opacity.DEFAULT_COLOR).setOpacity(this.defaultOpacity);
      });
    };
    _proto13.getValue = function getValue() {
      return this.cache.remember('value', () => {
        const pickerLeft = main_core.Text.toNumber(main_core.Dom.style(this.getPicker(), 'left'));
        const layoutWidth = main_core.Text.toNumber(this.pickerControl.getBoundingClientRect().width);
        return this.getDefaultValue().setOpacity(pickerLeft / layoutWidth);
      });
    };
    _proto13.setValue = function setValue(value) {
      const valueToSet = !main_core.Type.isNull(value) ? value : this.getDefaultValue();
      _BaseControl7.prototype.setValue.call(this, valueToSet);
      if (!main_core.Type.isNull(value)) {
        main_core.Dom.style(this.getColorLayout(), {
          background: valueToSet.getStyleStringForOpacity()
        });
        this.setPickerPosByOpacity(valueToSet.getOpacity());
        this.onRangeControlChange();
      } else {
        main_core.Dom.style(this.getColorLayout(), {
          background: 'none'
        });
      }
    };
    _proto13.onRangeControlChange = function onRangeControlChange() {
      const opacity = parseInt(this.getValue().getOpacity() * 100);
      this.rangeInput.title = opacity;
      this.rangeInput.innerHTML = opacity;
      this.updateSliderAria();
    };
    _proto13.updateSliderAria = function updateSliderAria() {
      if (!this.pickerControl) {
        return;
      }
      const percent = parseInt(this.getValue().getOpacity() * 100);
      if (Number.isNaN(percent)) {
        // Detached or not yet laid out: keep the last valid aria value.
        return;
      }
      main_core.Dom.attr(this.pickerControl, {
        'aria-valuenow': percent,
        'aria-valuetext': "".concat(percent, "%")
      });
    };
    _proto13.onSliderKeydown = function onSliderKeydown(event) {
      let handled = true;
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          this.onArrowClick('up');
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          this.onArrowClick('down');
          break;
        case 'Home':
          this.setOpacityByPercent(0);
          break;
        case 'End':
          this.setOpacityByPercent(100);
          break;
        default:
          handled = false;
          break;
      }
      if (handled) {
        event.preventDefault();
      }
    };
    _proto13.setOpacityByPercent = function setOpacityByPercent(percent) {
      percent = Math.min(100, Math.max(0, parseInt(percent)));
      this.rangeInput.title = percent;
      this.rangeInput.innerHTML = percent;
      const width = this.pickerControl.getBoundingClientRect().width;
      main_core.Dom.style(this.getPicker(), {
        left: "".concat(width * (percent / 100), "px")
      });
      this.onChange();
      this.updateSliderAria();
    };
    _proto13.onArrowClick = function onArrowClick(arrowName) {
      let newOpacityInputValue;
      const opacity = this.getValue().getOpacity();
      const opacityInputValue = parseInt(opacity * 100);
      if (arrowName === 'up') {
        if (opacityInputValue < 100) {
          newOpacityInputValue = (opacityInputValue + 5) / 100;
        } else {
          newOpacityInputValue = opacityInputValue / 100;
        }
      }
      if (arrowName === 'down') {
        if (opacityInputValue > 0) {
          newOpacityInputValue = (opacityInputValue - 5) / 100;
        } else {
          newOpacityInputValue = opacityInputValue / 100;
        }
      }
      this.rangeInput.title = parseInt(newOpacityInputValue * 100);
      this.rangeInput.innerHTML = parseInt(newOpacityInputValue * 100);
      const width = this.pickerControl.getBoundingClientRect().width;
      const leftPos = width - width * (1 - newOpacityInputValue);
      main_core.Dom.style(this.getPicker(), {
        left: "".concat(leftPos, "px")
      });
      this.onChange();
      this.updateSliderAria();
    };
    return Opacity;
  }(BaseControl);
  Opacity.DEFAULT_COLOR = '#cccccc';
  Opacity.DEFAULT_OPACITY = 1;
  let Tabs = /*#__PURE__*/function (_main_core_events$Eve8) {
    function Tabs() {
      var _this12;
      _this12 = _main_core_events$Eve8.call(this) || this;
      _this12.setEventNamespace('BX.Landing.UI.Field.Color.Tabs');
      _this12.tabs = [];
      _this12.cache = new main_core.Cache.MemoryCache();
      _this12.multiple = true;
      _this12.isBig = false;
      _this12.onToggle = _this12.onToggle.bind(_this12);
      return _this12;
    }
    babelHelpers.inherits(Tabs, _main_core_events$Eve8);
    var _proto14 = Tabs.prototype;
    _proto14.setMultiple = function setMultiple(multiple) {
      this.multiple = multiple;
      return this;
    };
    _proto14.setBig = function setBig(big) {
      this.isBig = big;
      this.multiple = false;
      return this;
    };
    _proto14.appendTab = function appendTab(id, title, items) {
      const tab = new Tab({
        id: id,
        title: title,
        items: main_core.Type.isArray(items) ? items : [items]
      });
      tab.setBig(this.isBig);
      this.tabs.push(tab);
      this.bindEvents(tab);
      this.cache.delete('layout');
      return this;
    };
    _proto14.prependTab = function prependTab(id, title, items) {
      const tab = new Tab({
        id: id,
        title: title,
        items: main_core.Type.isArray(items) || [items]
      });
      tab.setBig(this.isBig);
      this.tabs.unshift(tab);
      this.bindEvents(tab);
      this.cache.delete('layout');
      return this;
    };
    _proto14.bindEvents = function bindEvents(tab) {
      tab.subscribe('onToggle', this.onToggle);
      tab.subscribe('onShow', this.onToggle);
      tab.subscribe('onHide', this.onToggle);
    };
    _proto14.onToggle = function onToggle(event) {
      this.emit('onToggle', event);
    };
    _proto14.showTab = function showTab(id) {
      if (!this.multiple) {
        this.tabs.forEach(tab => {
          tab.hide();
        });
      }
      const tab = this.getTabById(id);
      if (tab) {
        tab.show();
      }
      return this;
    };
    _proto14.getTabById = function getTabById(id) {
      return this.tabs.find(tab => {
        return tab.id === id;
      });
    };
    _proto14.getLayout = function getLayout() {
      return this.cache.remember('layout', () => {
        const additional = this.isBig ? ' landing-ui-field-color-tabs--big' : '';
        const layout = main_core.Tag.render(_templateObject40 || (_templateObject40 = babelHelpers.taggedTemplateLiteral(["<div class=\"landing-ui-field-color-tabs", "\"></div>"])), additional);
        if (this.isBig) {
          const head = main_core.Tag.render(_templateObject41 || (_templateObject41 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t\t<div class=\"landing-ui-field-color-tabs-head landing-ui-field-color-tabs-head--big\"></div>\n\t\t\t\t"])));
          const content = main_core.Tag.render(_templateObject42 || (_templateObject42 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t\t<div class=\"landing-ui-field-color-tabs-content landing-ui-field-color-tabs-content--big\"></div>\n\t\t\t\t"])));
          this.tabs.forEach(tab => {
            main_core.Dom.append(tab.getTitle(), head);
            main_core.Dom.append(tab.getLayout(), content);
          });
          main_core.Dom.append(head, layout);
          main_core.Dom.append(content, layout);
        } else {
          this.tabs.forEach(tab => {
            const tabLayout = main_core.Tag.render(_templateObject43 || (_templateObject43 = babelHelpers.taggedTemplateLiteral(["<div class=\"landing-ui-field-color-tabs-tab\">\n\t\t\t\t\t\t", "", "\n\t\t\t\t\t</div>"])), tab.getTitle(), tab.getLayout());
            main_core.Dom.append(tabLayout, layout);
          });
        }

        // events
        this.tabs.forEach(tab => {
          main_core.Event.bind(tab.getTitle(), 'click', () => {
            if (!this.multiple) {
              this.tabs.forEach(tab => {
                tab.hide();
              });
            }
            tab.toggle();
          });
        });
        this.setupAccessibility(layout);
        return layout;
      });
    };
    _proto14.setupAccessibility = function setupAccessibility(layout) {
      if (this.isBig) {
        const head = layout.querySelector('.landing-ui-field-color-tabs-head');
        if (head) {
          main_core.Dom.attr(head, 'role', 'tablist');
          if (this.tabs.length > 1) {
            main_core.Dom.attr(head, 'aria-orientation', 'horizontal');
          }
        }
      }
      this.tabs.forEach(tab => {
        tab.setupAccessibility();
        main_core.Event.bind(tab.getTitle(), 'keydown', event => this.onTogglerKeydown(event, tab));
      });

      // Ensure the exclusive tablist stays keyboard-reachable even before any
      // tab is selected: the first tab keeps a roving tabindex of 0.
      if (this.isBig && !this.tabs.some(tab => tab.isShown()) && this.tabs.length > 0) {
        main_core.Dom.attr(this.tabs[0].getTitle(), 'tabindex', '0');
      }
    };
    _proto14.onTogglerKeydown = function onTogglerKeydown(event, tab) {
      if (this.isBig) {
        this.onBigTabKeydown(event, tab);
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        tab.toggle();
      }
    };
    _proto14.onBigTabKeydown = function onBigTabKeydown(event, tab) {
      const activate = targetTab => {
        this.tabs.forEach(item => item.hide());
        targetTab.show();
        targetTab.getTitle().focus();
      };
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate(tab);
        return;
      }
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        return;
      }
      event.preventDefault();
      const index = this.tabs.indexOf(tab);
      let nextIndex = index;
      if (event.key === 'ArrowLeft') {
        nextIndex = (index - 1 + this.tabs.length) % this.tabs.length;
      } else if (event.key === 'ArrowRight') {
        nextIndex = (index + 1) % this.tabs.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = this.tabs.length - 1;
      }
      activate(this.tabs[nextIndex]);
    };
    return Tabs;
  }(main_core_events.EventEmitter);
  let Tab = /*#__PURE__*/function (_main_core_events$Eve9) {
    function Tab(options) {
      var _this13;
      _this13 = _main_core_events$Eve9.call(this) || this;
      _this13.id = options.id;
      _this13.title = options.title;
      _this13.items = options.items;
      _this13.cache = new main_core.Cache.MemoryCache();
      _this13.isBig = false;
      _this13.togglerId = "landing-color-tab-toggler-".concat(main_core.Text.getRandom());
      _this13.contentId = "landing-color-tab-content-".concat(main_core.Text.getRandom());
      return _this13;
    }
    babelHelpers.inherits(Tab, _main_core_events$Eve9);
    var _proto15 = Tab.prototype;
    _proto15.setBig = function setBig(isBig) {
      this.isBig = isBig;
      return this;
    };
    _proto15.getId = function getId() {
      return this.id;
    };
    _proto15.isShown = function isShown() {
      return main_core.Dom.hasClass(this.getLayout(), Tab.SHOW_CLASS);
    };
    _proto15.getTitle = function getTitle() {
      return this.cache.remember('title', () => {
        return main_core.Tag.render(_templateObject44 || (_templateObject44 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<span class=\"landing-ui-field-color-tabs-tab-toggler\" id=\"", "\">\n\t\t\t\t\t<span class=\"landing-ui-field-color-tabs-tab-toggler-icon\"></span>\n\t\t\t\t\t<span class=\"landing-ui-field-color-tabs-tab-toggler-name\">", "</span>\n\t\t\t\t</span>\n\t\t\t"])), this.togglerId, this.title);
      });
    };
    _proto15.getLayout = function getLayout() {
      return this.cache.remember('layout', () => {
        return main_core.Tag.render(_templateObject45 || (_templateObject45 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<div class=\"landing-ui-field-color-tabs-tab-content\" id=\"", "\">\n\t\t\t\t\t", "\n\t\t\t\t</div>\n\t\t\t"])), this.contentId, this.items.map(item => item.getLayout()));
      });
    };
    _proto15.setupAccessibility = function setupAccessibility() {
      const toggler = this.getTitle();
      const content = this.getLayout();
      if (this.isBig) {
        main_core.Dom.attr(toggler, {
          'role': 'tab',
          'tabindex': '-1',
          'aria-controls': this.contentId
        });
        main_core.Dom.attr(content, {
          'role': 'tabpanel',
          'aria-labelledby': this.togglerId
        });
      } else {
        main_core.Dom.attr(toggler, {
          'role': 'button',
          'tabindex': '0',
          'aria-controls': this.contentId
        });
        main_core.Dom.attr(content, {
          'role': 'region',
          'aria-labelledby': this.togglerId
        });
      }
      this.syncAriaState();
    };
    _proto15.syncAriaState = function syncAriaState() {
      const shown = this.isShown();
      const toggler = this.getTitle();
      const content = this.getLayout();
      if (this.isBig) {
        main_core.Dom.attr(toggler, 'aria-selected', shown ? 'true' : 'false');
        main_core.Dom.attr(toggler, 'tabindex', shown ? '0' : '-1');
      } else {
        main_core.Dom.attr(toggler, 'aria-expanded', shown ? 'true' : 'false');
      }

      // `inert` keeps collapsed content measurable (layout unchanged) while
      // removing its descendants from Tab order and the accessibility tree —
      // unlike `display:none`, which would zero the opacity slider width.
      if (shown) {
        content.removeAttribute('inert');
      } else {
        main_core.Dom.attr(content, 'inert', '');
      }
    };
    _proto15.toggle = function toggle() {
      main_core.Dom.toggleClass(this.getLayout(), Tab.SHOW_CLASS);
      main_core.Dom.toggleClass(this.getTitle(), Tab.SHOW_CLASS);
      this.syncAriaState();
      this.emit('onToggle', {
        tab: this.title
      });
      return this;
    };
    _proto15.show = function show() {
      main_core.Dom.addClass(this.getLayout(), Tab.SHOW_CLASS);
      main_core.Dom.addClass(this.getTitle(), Tab.SHOW_CLASS);
      this.syncAriaState();
      this.emit('onShow', {
        tab: this.title
      });
      return this;
    };
    _proto15.hide = function hide() {
      main_core.Dom.removeClass(this.getLayout(), Tab.SHOW_CLASS);
      main_core.Dom.removeClass(this.getTitle(), Tab.SHOW_CLASS);
      this.syncAriaState();
      this.emit('onHide', {
        tab: this.title
      });
      return this;
    };
    return Tab;
  }(main_core_events.EventEmitter);
  Tab.SHOW_CLASS = 'show';
  let Zeroing = /*#__PURE__*/function (_main_core_events$Eve0) {
    function Zeroing(options) {
      var _this14;
      _this14 = _main_core_events$Eve0.call(this) || this;
      _this14.options = options;
      _this14.cache = new main_core.Cache.MemoryCache();
      _this14.setEventNamespace('BX.Landing.UI.Field.Color.Zeroing');
      main_core.Event.bind(_this14.getLayout(), 'click', () => _this14.onClick());
      main_core.Event.bind(_this14.getLayout(), 'keydown', _this14.onKeyDown.bind(_this14));
      return _this14;
    }
    babelHelpers.inherits(Zeroing, _main_core_events$Eve0);
    var _proto16 = Zeroing.prototype;
    _proto16.getLayout = function getLayout() {
      let textCode = 'LANDING_FIELD_COLOR-ZEROING_TITLE_2';
      if (this.options) {
        if (!this.options.styleNode) {
          return null;
        }
        if (this.options.textCode) {
          textCode = this.options.textCode;
        }
      }
      return this.cache.remember('layout', () => {
        return main_core.Tag.render(_templateObject46 || (_templateObject46 = babelHelpers.taggedTemplateLiteral(["<div\n\t\t\t\tclass=\"landing-ui-field-color-zeroing\"\n\t\t\t\trole=\"button\"\n\t\t\t\ttabindex=\"0\"\n\t\t\t\taria-pressed=\"false\"\n\t\t\t>\n\t\t\t\t<div class=\"landing-ui-field-color-zeroing-preview\">\n\t\t\t\t\t<div class=\"landing-ui-field-color-zeroing-state\"></div>\n\t\t\t\t</div>\n\t\t\t\t<span class=\"landing-ui-field-color-primary-text\">\n\t\t\t\t\t", "\n\t\t\t\t</span>\n\t\t\t</div>"])), main_core.Loc.getMessage(textCode));
      });
    };
    _proto16.onClick = function onClick() {
      this.emit('onChange', {
        color: null
      });
    };
    _proto16.onKeyDown = function onKeyDown(event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.onClick();
      }
    };
    _proto16.setActive = function setActive() {
      main_core.Dom.addClass(this.getLayout(), Zeroing.ACTIVE_CLASS);
      main_core.Dom.attr(this.getLayout(), 'aria-pressed', 'true');
    };
    _proto16.unsetActive = function unsetActive() {
      main_core.Dom.removeClass(this.getLayout(), Zeroing.ACTIVE_CLASS);
      main_core.Dom.attr(this.getLayout(), 'aria-pressed', 'false');
    };
    _proto16.isActive = function isActive() {
      return main_core.Dom.hasClass(this.getLayout(), Zeroing.ACTIVE_CLASS);
    };
    return Zeroing;
  }(main_core_events.EventEmitter);
  Zeroing.ACTIVE_CLASS = 'active';
  let Color = /*#__PURE__*/function (_BaseProcessor) {
    function Color(options) {
      var _this15;
      _this15 = _BaseProcessor.call(this, options) || this;
      _this15.setEventNamespace('BX.Landing.UI.Field.Processor.Color');
      _this15.property = 'color';
      _this15.variableName = '--color';
      _this15.className = 'g-color';
      _this15.colorSet = new ColorSet(options);
      _this15.colorSet.subscribe('onChange', _this15.onColorSetChange.bind(_this15));
      _this15.opacity = new Opacity();
      _this15.opacity.subscribe('onChange', _this15.onOpacityChange.bind(_this15));
      const zeroingOptions = {
        styleNode: options.styleNode
      };
      _this15.zeroing = new Zeroing(zeroingOptions);
      _this15.zeroing.subscribe('onChange', _this15.onZeroingChange.bind(_this15));
      _this15.primary = new Primary(options);
      _this15.primary.subscribe('onChange', _this15.onPrimaryChange.bind(_this15));
      _this15.tabs = new Tabs().appendTab('Opacity', main_core.Loc.getMessage('LANDING_FIELD_COLOR-TAB_OPACITY'), _this15.opacity);
      return _this15;
    }
    babelHelpers.inherits(Color, _BaseProcessor);
    var _proto17 = Color.prototype;
    _proto17.isNullValue = function isNullValue(value) {
      return value === null || value === 'none' || value === 'rgba(0, 0, 0, 0)';
    };
    _proto17.getNullValue = function getNullValue() {
      return new ColorValue('rgba(0, 0, 0, 0)');
    };
    _proto17.buildLayout = function buildLayout() {
      return main_core.Tag.render(_templateObject47 || (_templateObject47 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-field-color-color\">\n\t\t\t\t", "\n\t\t\t\t", "\n\t\t\t\t", "\n\t\t\t\t", "\n\t\t\t</div>\n\t\t"])), this.colorSet.getLayout(), this.primary.getLayout(), this.zeroing.getLayout(), this.tabs.getLayout());
    };
    _proto17.onColorSetChange = function onColorSetChange(event) {
      this.primary.unsetActive();
      this.zeroing.unsetActive();
      const color = event.getData().color;
      if (color !== null) {
        color.setOpacity(this.opacity.getValue().getOpacity());
      }
      this.opacity.setValue(color);
      this.onChange();
    };
    _proto17.onOpacityChange = function onOpacityChange() {
      this.onChange();
    };
    _proto17.onPrimaryChange = function onPrimaryChange(event) {
      this.colorSet.setValue(event.getData().color);
      this.onColorSetChange(event);
      this.colorSet.unsetActive();
      this.zeroing.unsetActive();
      this.primary.setActive();
    };
    _proto17.onZeroingChange = function onZeroingChange(event) {
      this.colorSet.unsetActive();
      this.primary.unsetActive();
      this.zeroing.setActive();
      this.setValue(event.getData().color);
      // todo: need reload computed props and reinit
      this.onChange(event);
    };
    _proto17.unsetActive = function unsetActive() {
      this.colorSet.unsetActive();
      this.primary.unsetActive();
    };
    _proto17.setValue = function setValue(value) {
      const valueObj = value !== null ? new ColorValue(value) : null;
      this.colorSet.setValue(valueObj);
      this.opacity.setValue(valueObj);

      // todo: what about opacity in primary?
      if (this.primary.isPrimaryValue(valueObj)) {
        this.primary.setActive();
        this.colorSet.unsetActive();
      }
      if (value !== null && valueObj.getOpacity() < 1) {
        this.tabs.showTab('Opacity');
      }
    };
    _proto17.getValue = function getValue() {
      return this.cache.remember('value', () => {
        const value = this.primary.isActive() ? this.primary.getValue() : this.colorSet.getValue();
        return value === null ? null : value.setOpacity(this.opacity.getValue().getOpacity());
      });
    };
    _proto17.setDefaultValue = function setDefaultValue(value) {
      this.zeroing.setActive();
      if (!main_core.Type.isNull(value)) {
        this.colorSet.colorpicker.hex.setActive();
      }
      _BaseProcessor.prototype.setDefaultValue.call(this, value);
    };
    _proto17.setActiveControl = function setActiveControl(controlName) {
      if (controlName === 'primary') {
        this.primary.setActive();
      }
      if (controlName === 'hex') {
        this.colorSet.colorpicker.hexPreview.setActive();
      }
    };
    _proto17.defineActiveControl = function defineActiveControl(items, styleNode) {
      if (!main_core.Type.isUndefined(styleNode)) {
        let oldClass;
        let activeControl;
        const node = styleNode.getNode();
        if (node.length > 0) {
          items.forEach(item => {
            if (main_core.Dom.hasClass(node[0], item.value)) {
              oldClass = item.value;
            }
          });
          if (oldClass) {
            const reg = /g-[a-z]+-[a-z0-9-]+/i;
            const found = oldClass.match(reg);
            if (found) {
              const reg = /primary/i;
              const found = oldClass.match(reg);
              this.zeroing.unsetActive();
              if (found) {
                activeControl = 'primary';
              } else {
                activeControl = 'hex';
              }
            }
          }
          if (activeControl) {
            this.setActiveControl(activeControl);
          }
        }
      }
    };
    return Color;
  }(BaseProcessor);
  Color.PRIMARY_VAR = 'var(--primary)';
  let ColorHover = /*#__PURE__*/function (_Color2) {
    function ColorHover(options) {
      var _this16;
      _this16 = _Color2.call(this, options) || this;
      _this16.setEventNamespace('BX.Landing.UI.Field.Processor.ColorHover');
      _this16.property = 'color';
      _this16.variableName = '--color-hover';
      _this16.className = 'g-color--hover';
      _this16.pseudoClass = ':hover';
      return _this16;
    }
    babelHelpers.inherits(ColorHover, _Color2);
    return ColorHover;
  }(Color);
  let Gradient = /*#__PURE__*/function (_BaseControl8) {
    function Gradient(options) {
      var _this17;
      _this17 = _BaseControl8.call(this) || this;
      _this17.ROTATE_STEP = 45;
      _this17.setEventNamespace('BX.Landing.UI.Field.Color.Gradient');
      _this17.options = options;
      _this17.popupId = "gradient_popup_".concat(main_core.Text.getRandom());
      _this17.popupTargetContainer = options.contentRoot;
      const colorPickerOptions = {
        ..._this17.options,
        hexPreviewMode: true
      };
      _this17.colorpickerFrom = new Colorpicker({
        ...colorPickerOptions
      });
      _this17.colorpickerFrom.subscribe('onChange', event => {
        _this17.onColorChange(event.getData().color, null);
      });
      _this17.colorpickerTo = new Colorpicker({
        ...colorPickerOptions
      });
      _this17.colorpickerTo.subscribe('onChange', event => {
        _this17.onColorChange(null, event.getData().color);
      });
      main_core.Event.bind(_this17.getPopupButton(), 'click', _this17.onPopupOpen.bind(_this17));
      main_core.Event.bind(_this17.getRotateButton(), 'click', _this17.onRotate.bind(_this17));
      main_core.Event.bind(_this17.getSwitchTypeButton(), 'click', _this17.onSwitchType.bind(_this17));
      main_core.Event.bind(_this17.getSwapButton(), 'click', _this17.onSwap.bind(_this17));
      _this17.preset = null;
      return _this17;
    }
    babelHelpers.inherits(Gradient, _BaseControl8);
    var _proto18 = Gradient.prototype;
    _proto18.onColorChange = function onColorChange(fromValue, toValue) {
      if (fromValue === null && toValue === null) {
        return;
      }
      const valueToSet = this.getValue() || new GradientValue();
      const fromValueToSet = fromValue || valueToSet.getFrom() || new GradientValue().getFrom();
      const toValueToSet = toValue || valueToSet.getTo() || new GradientValue().getTo();
      valueToSet.setValue({
        from: fromValueToSet,
        to: toValueToSet
      });
      this.setValue(valueToSet);
      this.preset.unsetActive();
      this.onChange();
    };
    _proto18.onPopupOpen = function onPopupOpen() {
      this.getPopup().toggle();
    };
    _proto18.onRotate = function onRotate(event) {
      // todo: not set colorpicker active
      if (!Gradient.isButtonEnable(event.target)) {
        return;
      }
      const value = this.getValue();
      if (value !== null) {
        value.setValue({
          angle: (value.getAngle() + this.ROTATE_STEP) % 360
        });
        this.setValue(value);
        this.onChange();
      }
      this.getPopup().close();
    };
    _proto18.onSwitchType = function onSwitchType(event) {
      // todo: not set colorpicker active
      if (!Gradient.isButtonEnable(event.target)) {
        return;
      }
      const value = this.getValue();
      if (value !== null) {
        if (value.getType() === GradientValue.TYPE_LINEAR) {
          value.setValue({
            type: GradientValue.TYPE_RADIAL
          });
          Gradient.disableButton(this.getRotateButton());
        } else {
          value.setValue({
            type: GradientValue.TYPE_LINEAR
          });
          Gradient.enableButton(this.getRotateButton());
        }
        this.setValue(value);
        this.onChange();
      }
      this.getPopup().close();
    };
    _proto18.onSwap = function onSwap(event) {
      // todo: not set colorpicker active
      if (!Gradient.isButtonEnable(event.target)) {
        return;
      }
      const value = this.getValue();
      if (value !== null) {
        value.setValue({
          to: value.getFrom(),
          from: value.getTo()
        });
        this.setValue(value);
        this.onChange();
      }
      this.getPopup().close();
    };
    Gradient.disableButton = function disableButton(button) {
      main_core.Dom.addClass(button, Gradient.DISABLE_CLASS);
    };
    Gradient.enableButton = function enableButton(button) {
      main_core.Dom.removeClass(button, Gradient.DISABLE_CLASS);
    };
    Gradient.isButtonEnable = function isButtonEnable(button) {
      return !main_core.Dom.hasClass(button, Gradient.DISABLE_CLASS);
    };
    _proto18.correctColorpickerColors = function correctColorpickerColors() {
      const value = this.getValue();
      if (value !== null) {
        const angle = value.getAngle();
        const hexFrom = this.colorpickerFrom.getHexPreviewObject();
        const hexTo = this.colorpickerTo.getHexPreviewObject();
        const colorFrom = value.getFrom();
        const colorTo = value.getTo();
        if (value.getType() === GradientValue.TYPE_LINEAR) {
          if (angle === 270 || angle === 90) {
            const median = ColorValue.getMedian(colorFrom, colorTo).getContrast().getHex();
            hexFrom.adjustColors(median, 'transparent');
            hexTo.adjustColors(median, 'transparent');
          } else if (angle >= 135 && angle <= 225) {
            hexFrom.adjustColors(colorFrom.getContrast().getHex(), 'transparent');
            hexTo.adjustColors(colorTo.getContrast().getHex(), 'transparent');
          } else {
            hexFrom.adjustColors(colorTo.getContrast().getHex(), 'transparent');
            hexTo.adjustColors(colorFrom.getContrast().getHex(), 'transparent');
          }
        } else if (value.getType() === GradientValue.TYPE_RADIAL) {
          hexFrom.adjustColors(colorTo.getContrast().getHex(), 'transparent');
          hexTo.adjustColors(colorTo.getContrast().getHex(), 'transparent');
        }
      }
    };
    _proto18.getPopup = function getPopup() {
      return this.cache.remember('popup', () => {
        return main_popup.PopupManager.create({
          id: this.popupId,
          className: 'landing-ui-field-color-gradient-preset-popup',
          autoHide: true,
          bindElement: this.getPopupButton(),
          bindOptions: {
            forceTop: true,
            forceLeft: true
          },
          offsetLeft: 15,
          angle: {
            offset: -5
          },
          padding: 0,
          contentPadding: 7,
          content: this.getPopupContent(),
          closeByEsc: true,
          targetContainer: this.popupTargetContainer
        });
      });
    };
    _proto18.getPopupContent = function getPopupContent() {
      return this.cache.remember('popupContainer', () => {
        return main_core.Tag.render(_templateObject48 || (_templateObject48 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<div class=\"landing-ui-field-color-gradient-preset-popup-container\">\n\t\t\t\t\t", "\n\t\t\t\t\t", "\n\t\t\t\t</div>\n\t\t\t"])), this.getRotateButton(), this.getSwapButton());
      });
    };
    _proto18.buildLayout = function buildLayout() {
      if (this.preset) {
        main_core.Dom.clean(this.getPresetContainer());
        main_core.Dom.append(this.preset.getLayout(), this.getPresetContainer());
      }
      return main_core.Tag.render(_templateObject49 || (_templateObject49 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-field-color-gradient\">\n\t\t\t\t<div class=\"landing-ui-field-color-gradient-container-main\">\n\t\t\t\t\t", "\n\t\t\t\t\t<div class=\"landing-ui-field-color-gradient-container\">\n\t\t\t\t\t\t<div class=\"landing-ui-field-color-gradient-from\">", "</div>\n\t\t\t\t\t\t", "\n\t\t\t\t\t\t<div class=\"landing-ui-field-color-gradient-to\">", "</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"landing-ui-field-color-gradient-switch-type-container\">\n\t\t\t\t\t", "\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t"])), this.getPresetContainer(), this.colorpickerFrom.getLayout(), this.getPopupButton(), this.colorpickerTo.getLayout(), this.getSwitchTypeButton());
    };
    _proto18.getContainerLayout = function getContainerLayout() {
      // todo: do better after change vyorstka
      return this.getLayout().querySelector('.landing-ui-field-color-gradient-container');
    };
    _proto18.getPresetContainer = function getPresetContainer() {
      return this.cache.remember('presetContainer', () => {
        return main_core.Tag.render(_templateObject50 || (_templateObject50 = babelHelpers.taggedTemplateLiteral(["<div class=\"landing-ui-field-color-gradient-preset-container\"></div>"])));
      });
    };
    _proto18.getPopupButton = function getPopupButton() {
      return this.cache.remember('popupButton', () => {
        return main_core.Tag.render(_templateObject51 || (_templateObject51 = babelHelpers.taggedTemplateLiteral(["<span class=\"landing-ui-field-color-gradient-open-popup\"></span>"])));
      });
    };
    _proto18.getSwitchTypeButton = function getSwitchTypeButton() {
      return this.cache.remember('switchTypeButton', () => {
        return main_core.Tag.render(_templateObject52 || (_templateObject52 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<span\n\t\t\t\t\tclass=\"landing-ui-field-color-gradient-switch-type\"\n\t\t\t\t\ttitle=\"", "\"\n\t\t\t\t></span>\n\t\t\t"])), main_core.Loc.getMessage('LANDING_FIELD_COLOR-GRADIENT_SWITCH_TYPE'));
      });
    };
    _proto18.getRotateButton = function getRotateButton() {
      return this.cache.remember('rotateButton', () => {
        return main_core.Tag.render(_templateObject53 || (_templateObject53 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<span\n\t\t\t\t\tclass=\"landing-ui-field-color-gradient-rotate\"\n\t\t\t\t\ttitle=\"", "\"\n\t\t\t\t></span>\n\t\t\t"])), main_core.Loc.getMessage('LANDING_FIELD_COLOR-GRADIENT_ROTATE'));
      });
    };
    _proto18.getSwapButton = function getSwapButton() {
      return this.cache.remember('swapButton', () => {
        return main_core.Tag.render(_templateObject54 || (_templateObject54 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<span\n\t\t\t\t\tclass=\"landing-ui-field-color-gradient-swap\"\n\t\t\t\t\ttitle=\"", "\"\n\t\t\t\t></span>\n\t\t\t"])), main_core.Loc.getMessage('LANDING_FIELD_COLOR-GRADIENT_SWAP'));
      });
    };
    _proto18.setPreset = function setPreset(preset) {
      this.preset = preset;
      this.preset.unsetActive();
      this.preset.subscribe('onChange', event => {
        this.setValue(event.getData().color);
        this.unsetColorpickerActive();
        this.onChange(event);
      });
      main_core.Dom.clean(this.getPresetContainer());
      main_core.Dom.append(preset.getLayout(), this.getPresetContainer());
    };
    _proto18.getPreset = function getPreset() {
      return this.preset;
    };
    _proto18.getValue = function getValue() {
      return this.cache.remember('value', () => {
        if (this.colorpickerFrom.getValue() === null || this.colorpickerTo.getValue() === null) {
          return null;
        }
        let rotate = this.getRotateButton().dataset.rotate;
        rotate = rotate ? main_core.Text.toNumber(rotate) : 0;
        const type = this.getSwitchTypeButton().dataset.type || GradientValue.TYPE_LINEAR;
        return new GradientValue({
          from: this.colorpickerFrom.getValue(),
          to: this.colorpickerTo.getValue(),
          angle: rotate,
          type
        });
      });
    };
    _proto18.setValue = function setValue(value) {
      _BaseControl8.prototype.setValue.call(this, value);
      if (value === null) {
        this.colorpickerFrom.setValue(null);
        this.colorpickerTo.setValue(null);
        this.unsetActive();
        main_core.Dom.style(this.getContainerLayout(), 'background', new GradientValue().getStyleString());
        Gradient.disableButton(this.getRotateButton());
        Gradient.disableButton(this.getSwitchTypeButton());
        Gradient.disableButton(this.getSwapButton());
      } else {
        // todo: how set default type and rotation?
        this.colorpickerFrom.setValue(value.getFrom());
        this.colorpickerTo.setValue(value.getTo());
        this.correctColorpickerColors();
        this.getRotateButton().dataset.rotate = value.getAngle();
        this.getSwitchTypeButton().dataset.type = value.getType();
        main_core.Dom.style(this.getRotateButton(), 'transform', "rotate(".concat(value.getAngle(), "deg)"));
        main_core.Dom.style(this.getContainerLayout(), 'background', this.getValue().getStyleString());
        Gradient.enableButton(this.getSwitchTypeButton());
        Gradient.enableButton(this.getSwapButton());
        if (value.getType() === GradientValue.TYPE_RADIAL) {
          Gradient.disableButton(this.getRotateButton());
          this.getSwitchTypeButton().innerText = main_core.Loc.getMessage('LANDING_FIELD_COLOR-GRADIENT_DO_LINEAR');
        } else {
          Gradient.enableButton(this.getRotateButton());
          this.getSwitchTypeButton().innerText = main_core.Loc.getMessage('LANDING_FIELD_COLOR-GRADIENT_DO_RADIAL');
        }
        this.setActive();
      }
    };
    _proto18.onChange = function onChange(event) {
      this.cache.delete('value');
      this.emit('onChange', {
        gradient: this.getValue()
      });
    };
    _proto18.setActive = function setActive() {
      const value = this.getValue();
      if (this.preset.isPresetValue(value)) {
        this.preset.setActiveValue(value);
        this.unsetColorpickerActive();
      } else {
        this.preset.unsetActive();
        this.setColorpickerActive();
      }
    };
    _proto18.unsetActive = function unsetActive() {
      this.preset.unsetActive();
      this.unsetColorpickerActive();
    };
    _proto18.setColorpickerActive = function setColorpickerActive() {
      main_core.Dom.addClass(this.getContainerLayout(), Gradient.ACTIVE_CLASS);
    };
    _proto18.unsetColorpickerActive = function unsetColorpickerActive() {
      this.colorpickerFrom.unsetActive();
      this.colorpickerTo.unsetActive();
      main_core.Dom.removeClass(this.getContainerLayout(), Gradient.ACTIVE_CLASS);
    };
    return Gradient;
  }(BaseControl);
  Gradient.DISABLE_CLASS = 'disable';
  let BgColor = /*#__PURE__*/function (_Color3) {
    function BgColor(options) {
      var _this18;
      _this18 = _Color3.call(this, options) || this;
      _this18.setEventNamespace('BX.Landing.UI.Field.Processor.BgColor');
      _this18.property = ['background-image', 'background-color'];
      _this18.variableName = '--bg';
      _this18.className = 'g-bg';
      _this18.activeControl = null;
      _this18.gradient = new Gradient(options);
      _this18.gradient.subscribe('onChange', _this18.onGradientChange.bind(_this18));
      _this18.tabs.prependTab('Gradient', main_core.Loc.getMessage('LANDING_FIELD_COLOR-TAB_GRADIENT'), _this18.gradient);
      _this18.setGradientPreset(_this18.colorSet.getPreset());
      _this18.colorSet.subscribe('onPresetChange', event => {
        _this18.setGradientPreset(event.getData().preset);
      });
      _this18.tabs.subscribe('onToggle', _this18.onTabsToggle.bind(_this18));
      return _this18;
    }
    babelHelpers.inherits(BgColor, _Color3);
    var _proto19 = BgColor.prototype;
    _proto19.setGradientPreset = function setGradientPreset(preset) {
      const gradientPreset = preset.getGradientPreset();
      this.gradient.setPreset(gradientPreset);
      gradientPreset.subscribe('onChange', () => {
        this.activeControl = this.gradient;
        this.onChange();
      });
      const value = this.getValue();
      if (value !== null && value instanceof GradientValue && this.gradient.getPreset().isPresetValue(value)) {
        this.colorSet.getPreset().unsetActive();
        this.gradient.getPreset().setActiveValue(value);
        this.gradient.unsetColorpickerActive();
      }
    };
    _proto19.onColorSetChange = function onColorSetChange(event) {
      this.activeControl = this.colorSet;
      this.gradient.unsetActive();
      _Color3.prototype.onColorSetChange.call(this, event);
    };
    _proto19.onGradientChange = function onGradientChange(event) {
      this.activeControl = this.gradient;
      this.colorSet.unsetActive();
      const gradValue = event.getData().gradient;
      if (gradValue !== null) {
        this.opacity.setValue(gradValue.setOpacity(this.opacity.getValue().getOpacity()));
      }
      this.onChange();
    };
    _proto19.onOverlayOpacityChange = function onOverlayOpacityChange() {
      this.onChange();
    };
    _proto19.onTabsToggle = function onTabsToggle() {
      this.gradient.getPopup().close();
    };
    _proto19.unsetActive = function unsetActive() {
      this.colorSet.unsetActive();
      this.gradient.unsetActive();
      this.primary.unsetActive();
    };
    _proto19.setValue = function setValue(value) {
      this.colorSet.setValue(null);
      this.gradient.setValue(null);
      this.unsetActive();
      this.activeControl = null;
      if (main_core.Type.isNil(value)) ;else if (isRgbString(value) || isHex(value) || isHslString(value) || isCssVar(value)) {
        _Color3.prototype.setValue.call(this, value);
        this.activeControl = this.colorSet;
      } else if (isGradientString(value)) {
        this.activeControl = this.gradient;
        const gradientValue = new GradientValue(value);
        this.gradient.setValue(gradientValue);
        this.opacity.setValue(gradientValue);
        const presets = this.colorSet.getPresetsCollection();
        const activePreset = presets.getGlobalActiveId() ? presets.getPresetById(presets.getGlobalActiveId()) : presets.getPresetByItemValue(gradientValue);
        if (activePreset !== null && activePreset !== this.colorSet.getPreset()) {
          this.colorSet.setPreset(activePreset);
          this.setGradientPreset(activePreset);
        }
        this.tabs.showTab('Gradient');
        if (gradientValue.getOpacity() < 1) {
          this.tabs.showTab('Opacity');
        }
      }
    };
    _proto19.getValue = function getValue() {
      return this.cache.remember('value', () => {
        if (this.activeControl === null) {
          return null;
        }
        if (this.activeControl === this.gradient) {
          const gradValue = this.gradient.getValue();
          return gradValue === null ? gradValue : gradValue.setOpacity(this.opacity.getValue().getOpacity());
        }
        return _Color3.prototype.getValue.call(this);
      });
    };
    return BgColor;
  }(Color);
  const matcherBgImage = /url\(['"]?([^ '"]*)['"]?\)([\w \/]*)/i;
  function isBgImageString(bgImage) {
    if (!!bgImage.trim().match(matcherBgImage)) {
      return true;
    }
    return !!bgImage.trim().match(getMatcherWithOverlay());
  }
  function getMatcherWithOverlay() {
    const matcherBgString = regexpToString(matcherBgImage);
    const matcherGradientString = regexpToString(matcherGradient);
    return new RegExp("^".concat(matcherGradientString, ",").concat(matcherBgString));
  }
  let BgImageValue = /*#__PURE__*/function () {
    function BgImageValue(value) {
      // todo: add 2x, file ids
      this.value = defaultBgImageValueOptions;
      this.setValue(value);
    }
    var _proto20 = BgImageValue.prototype;
    _proto20.getName = function getName() {
      return "\n\t\t\t".concat(this.value.url.replace(/[^\w\d]/g, ''), "_").concat(this.value.size, "_").concat(this.value.attachment, "\n\t\t");
    };
    _proto20.setValue = function setValue(value) {
      if (main_core.Type.isObject(value)) {
        if (value instanceof BgImageValue) {
          // todo: add 2x and file IDs
          this.value.url = value.getUrl();
          this.value.url2x = value.getUrl2x();
          this.value.fileId = value.getFileId();
          this.value.fileId2x = value.getFileId2x();
          this.value.size = value.getSize();
          this.value.attachment = value.getAttachment();
        } else {
          this.value = {
            ...this.value,
            ...value
          };
        }
      }
      if (main_core.Type.isString(value) && isBgImageString(value)) {
        this.parseBgString(value);
      }
      return this;
    };
    _proto20.parseBgString = function parseBgString(string) {
      // todo: check matcher for 2x
      const options = defaultBgImageValueOptions;
      const matchesBg = string.trim().match(regexpWoStartEnd(matcherBgImage));
      if (!!matchesBg) {
        options.url = matchesBg[1];
        options.size = matchesBg[2].indexOf('auto') === -1 ? defaultBgImageSize : 'auto';
        options.attachment = matchesBg[2].indexOf('fixed') === -1 ? defaultBgImageAttachment : 'fixed';
      }
      const matchesOverlay = string.trim().match(regexpWoStartEnd(matcherGradientColors));
      if (!!string.trim().match(regexpWoStartEnd(matcherGradient)) && !!matchesOverlay) {
        options.overlay = new ColorValue(matchesOverlay[0]);
      }
      this.setValue(options);
    };
    _proto20.setOpacity = function setOpacity(opacity) {
      // todo: what for image?

      return this;
    };
    _proto20.setUrl = function setUrl(value) {
      this.setValue({
        url: value
      });
      return this;
    };
    _proto20.setUrl2x = function setUrl2x(value) {
      this.setValue({
        url2x: value
      });
      return this;
    };
    _proto20.setFileId = function setFileId(value) {
      this.setValue({
        fileId: value
      });
      return this;
    };
    _proto20.setFileId2x = function setFileId2x(value) {
      this.setValue({
        fileId2x: value
      });
      return this;
    };
    _proto20.setSize = function setSize(value) {
      this.setValue({
        size: value
      });
      return this;
    };
    _proto20.setAttachment = function setAttachment(value) {
      this.setValue({
        attachment: value
      });
      return this;
    };
    _proto20.setOverlay = function setOverlay(value) {
      this.setValue({
        overlay: value
      });
      return this;
    };
    _proto20.getUrl = function getUrl() {
      return this.value.url;
    };
    _proto20.getUrl2x = function getUrl2x() {
      return this.value.url2x;
    };
    _proto20.getFileId = function getFileId() {
      return this.value.fileId;
    };
    _proto20.getFileId2x = function getFileId2x() {
      return this.value.fileId2x;
    };
    _proto20.getSize = function getSize() {
      return this.value.size;
    };
    _proto20.getAttachment = function getAttachment(needBool = false) {
      return needBool ? this.value.attachment === 'fixed' : this.value.attachment;
    };
    _proto20.getOverlay = function getOverlay() {
      return this.value.overlay;
    };
    _proto20.getOpacity = function getOpacity() {
      // todo: how image can have opacity?
      return 1;
    };
    _proto20.getStyleString = function getStyleString() {
      let style = '';
      if (this.value.overlay !== null) {
        style = "linear-gradient(".concat(this.value.overlay.getStyleString(), ",").concat(this.value.overlay.getStyleString(), ")");
      }

      // todo: what if url is null
      const {
        url,
        url2x,
        size,
        attachment
      } = this.value;
      const endString = "center / ".concat(size, " ").concat(attachment);
      if (url !== null) {
        style = style.length ? style + ',' : '';
        if (url2x !== null) {
          style += "-webkit-image-set(url('".concat(url, "') 1x, url('").concat(url2x, "') 2x) ").concat(endString, ",");
          style += "image-set(url('".concat(url, "') 1x, url('").concat(url2x, "') 2x) ").concat(endString, ",");
        }
        style += "url('".concat(url, "') ").concat(endString);
      }
      return style;
    };
    _proto20.getStyleStringForOpacity = function getStyleStringForOpacity() {
      // todo: how image can have opacity?
      return '';
    };
    BgImageValue.getSizeItemsForButtons = function getSizeItemsForButtons() {
      return [{
        name: main_core.Loc.getMessage('LANDING_FIELD_COLOR-BG_COVER'),
        value: 'cover'
      }, {
        name: main_core.Loc.getMessage('LANDING_FIELD_COLOR-BG_MOSAIC'),
        value: 'auto'
      }];
    };
    BgImageValue.getAttachmentValueByBool = function getAttachmentValueByBool(value) {
      return value ? 'fixed' : 'scroll';
    };
    return BgImageValue;
  }();
  let Image = /*#__PURE__*/function (_BaseControl9) {
    // todo: move to type

    function Image(options) {
      var _this19;
      _this19 = _BaseControl9.call(this) || this;
      _this19.setEventNamespace('BX.Landing.UI.Field.Color.Image');
      _this19.options = options;
      _this19.imgField = new landing_ui_field_image.Image({
        id: 'landing_ui_color_image_' + main_core.Text.getRandom().toLowerCase(),
        className: 'landing-ui-field-color-image-image',
        contextType: landing_ui_field_image.Image.CONTEXT_TYPE_STYLE,
        compactMode: true,
        disableLink: true,
        disableAltField: true,
        allowClear: true,
        isAiImageAvailable: landing_env.Env.getInstance().getOptions()['ai_image_available'],
        isAiImageActive: landing_env.Env.getInstance().getOptions()['ai_image_active'],
        aiUnactiveInfoCode: landing_env.Env.getInstance().getOptions()['ai_unactive_info_code'],
        dimensions: {
          width: 1920
        },
        uploadParams: {
          action: "Block::uploadFile",
          block: _this19.options.block.id
        },
        contentRoot: _this19.options.contentRoot
      });
      _this19.imgField.subscribe('change', _this19.onImageChange.bind(_this19));
      _this19.sizeField = new BX.Landing.UI.Field.Dropdown({
        id: 'landing_ui_color_image_size_' + main_core.Text.getRandom().toLowerCase(),
        title: main_core.Loc.getMessage('LANDING_FIELD_COLOR-BG_SIZE_TITLE'),
        className: 'landing-ui-field-color-image-size',
        items: BgImageValue.getSizeItemsForButtons(),
        onChange: _this19.onSizeChange.bind(_this19),
        contentRoot: _this19.options.contentRoot
      });
      _this19.attachmentField = new BX.Landing.UI.Field.Checkbox({
        id: 'landing_ui_color_image_attach_' + main_core.Text.getRandom().toLowerCase(),
        className: 'landing-ui-field-color-image-attachment',
        multiple: false,
        compact: true,
        items: [{
          name: main_core.Loc.getMessage('LANDING_FIELD_COLOR-BG_FIXED'),
          value: 'fixed'
        }],
        onChange: _this19.onAttachmentChange.bind(_this19),
        value: [_this19.getAttachmentValue()]
      });
      return _this19;
    }
    babelHelpers.inherits(Image, _BaseControl9);
    var _proto21 = Image.prototype;
    _proto21.buildLayout = function buildLayout() {
      return main_core.Tag.render(_templateObject55 || (_templateObject55 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-field-color-image\">\n\t\t\t\t", "\n\t\t\t\t", "\n\t\t\t\t", "\n\t\t\t</div>\n\t\t"])), this.imgField.getLayout(), this.sizeField.getLayout(), this.attachmentField.getLayout());
    };
    _proto21.onImageChange = function onImageChange(event) {
      const value = this.getValue() || new BgImageValue();
      if (event.getData().value.src) {
        value.setUrl(event.getData().value.src);
        value.setFileId(event.getData().value.id);
        if (event.getData().value.src2x) {
          value.setUrl2x(event.getData().value.src2x);
          value.setFileId2x(event.getData().value.id2x);
        }
      } else {
        value.setUrl(null);
        value.setFileId(null);
        value.setUrl2x(null);
        value.setFileId2x(null);
      }
      this.setValue(value);
      this.onChange();
      this.saveNode(value);
    };
    _proto21.saveNode = function saveNode(value) {
      const style = this.options.styleNode;
      const block = this.options.block;
      let selector;
      if (style.selector === block.selector || style.selector === block.makeAbsoluteSelector(block.selector)) {
        selector = '#wrapper';
      } else if (!style.isSelectGroup()) {
        selector = BX.Landing.Utils.join(style.selector.split("@")[0], "@", style.getElementIndex(style.getNode()[0]));
      } else {
        selector = style.selector.split("@")[0];
      }
      const data = {
        [selector]: {}
      };
      data[selector].id = value.getFileId() || -1;
      data[selector].id2x = value.getFileId2x() || -1;
      landing_backend.Backend.getInstance().action("Landing\\Block::updateNodes", {
        lid: this.options.block.lid,
        block: this.options.block.id,
        data: data
      });
    };
    _proto21.onSizeChange = function onSizeChange(size) {
      if (main_core.Type.isString(size)) {
        const value = this.getValue() || new BgImageValue();
        value.setSize(size);
        this.setValue(value);
        this.onChange();
      }
    };
    _proto21.onAttachmentChange = function onAttachmentChange(event) {
      if (event instanceof main_core_events.BaseEvent) {
        const value = this.getValue() || new BgImageValue();
        value.setAttachment(BgImageValue.getAttachmentValueByBool(this.attachmentField.getValue()));
        this.setValue(value);
        this.onChange();
      }
    };
    _proto21.onChange = function onChange(event) {
      this.cache.delete('value');
      this.emit('onChange', {
        data: {
          image: this.getValue()
        }
      });
    };
    _proto21.getValue = function getValue() {
      // todo: get size and attachement from controls
      return this.cache.remember('value', () => {
        const imgValue = this.imgField.getValue();
        const url = imgValue.src;
        if (url === null) {
          return null;
        } else {
          const value = new BgImageValue({
            url: url,
            fileId: imgValue.id
          });
          if (imgValue.src2x) {
            value.setUrl2x(imgValue.src2x);
            value.setFileId2x(imgValue.fileId2x);
          }
          const size = this.sizeField.getValue();
          if (size !== null) {
            value.setSize(size);
          }
          value.setAttachment(BgImageValue.getAttachmentValueByBool(this.attachmentField.getValue()));

          // todo: set overlay

          return value;
        }
      });
    };
    _proto21.setValue = function setValue(value) {
      if (this.isNeedSetValue(value)) {
        // todo: can delete prev image
        _BaseControl9.prototype.setValue.call(this, value);
        if (value === null) {
          this.imgField.setValue({
            src: ''
          }, true);
          // todo: what set size and attachement?
        } else {
          if (value.getUrl() !== null) {
            this.setActive();
          }
          const imgFieldValue = {
            type: 'image',
            src: value.getUrl(),
            id: value.getFileId()
          };
          if (value.getUrl2x()) {
            imgFieldValue.src2x = value.getUrl2x();
            imgFieldValue.id2x = value.getFileId2x();
          }
          this.imgField.setValue(imgFieldValue, true);
          this.sizeField.setValue(this.getSizeValue(), true);
          this.attachmentField.setValue([this.getAttachmentValue()]);
        }
      }
    };
    _proto21.setActive = function setActive() {
      main_core.Dom.addClass(this.imgField.getLayout(), Image.ACTIVE_CLASS);
    };
    _proto21.unsetActive = function unsetActive() {
      main_core.Dom.removeClass(this.imgField.getLayout(), Image.ACTIVE_CLASS);
    };
    _proto21.getAttachmentValue = function getAttachmentValue() {
      if (this.options && this.options.block && this.options.block.content && main_core.Dom.hasClass(this.options.block.content, 'g-bg-image')) {
        const blockContentStyle = window.getComputedStyle(this.options.block.content);
        const bgAttachmentValue = blockContentStyle.getPropertyValue('background-attachment');
        return bgAttachmentValue.includes('fixed') ? 'fixed' : 'scroll';
      }
      return 'scroll';
    };
    _proto21.getSizeValue = function getSizeValue() {
      if (this.options && this.options.block && this.options.block.content && main_core.Dom.hasClass(this.options.block.content, 'g-bg-image')) {
        const blockContentStyle = window.getComputedStyle(this.options.block.content);
        const bgSizeValue = blockContentStyle.getPropertyValue('background-size');
        return bgSizeValue.includes('cover') ? 'cover' : 'auto';
      }
      return 'cover';
    };
    return Image;
  }(BaseControl);
  function rgbaStringToRgbString(str) {
    const regRgba = /\d{1,3}(\.\d+)?/g;
    const rgba = str.match(regRgba);
    const r = rgba[0] ? rgba[0] : null;
    const g = rgba[1] ? rgba[1] : null;
    const b = rgba[2] ? rgba[2] : null;
    if (r === null || g === null || b === null) {
      return null;
    }
    return createRgbString(r, g, b);
  }
  function createRgbString(r, g, b) {
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  let Bg = /*#__PURE__*/function (_BgColor) {
    function Bg(options) {
      var _this20;
      _this20 = _BgColor.call(this, options) || this;
      _this20.setEventNamespace('BX.Landing.UI.Field.Processor.Bg');
      _this20.styleNode = options.styleNode;
      _this20.parentVariableName = _this20.variableName;
      _this20.variableName = [_this20.parentVariableName, Bg.BG_URL_VAR, Bg.BG_URL_2X_VAR, Bg.BG_OVERLAY_VAR, Bg.BG_SIZE_VAR, Bg.BG_ATTACHMENT_VAR, Bg.BG_IMAGE];
      _this20.parentClassName = _this20.className;
      _this20.className = 'g-bg-image';
      _this20.image = new Image(options);
      _this20.image.subscribe('onChange', _this20.onImageChange.bind(_this20));
      _this20.overlay = new ColorSet(options);
      _this20.overlay.subscribe('onChange', _this20.onOverlayColorChange.bind(_this20));
      _this20.overlayOpacity = new Opacity({
        defaultOpacity: 0.5
      });
      _this20.overlayOpacity.subscribe('onChange', _this20.onOverlayOpacityChange.bind(_this20));
      _this20.overlayPrimary = new Primary();
      _this20.overlayPrimary.subscribe('onChange', _this20.onOverlayPrimaryChange.bind(_this20));
      const overlayZeroingOptions = {
        textCode: 'LANDING_FIELD_COLOR_OVERLAY_ZEROING_TITLE_2',
        styleNode: options.styleNode
      };
      _this20.overlayZeroing = new Zeroing(overlayZeroingOptions);
      _this20.overlayZeroing.subscribe('onChange', _this20.overlayZeroingChange.bind(_this20));
      _this20.imageTabs = new Tabs().appendTab('Overlay', main_core.Loc.getMessage('LANDING_FIELD_COLOR-BG_OVERLAY'), [_this20.overlay, _this20.overlayPrimary, _this20.overlayZeroing, _this20.overlayOpacity]);
      _this20.bigTabs = new Tabs().setBig(true).appendTab('Color', main_core.Loc.getMessage('LANDING_FIELD_COLOR-BG_COLOR'), [_this20.colorSet, _this20.primary, _this20.zeroing, _this20.tabs]).appendTab('Image', main_core.Loc.getMessage('LANDING_FIELD_COLOR-BG_IMAGE'), [_this20.image, _this20.imageTabs]);
      return _this20;
    }
    babelHelpers.inherits(Bg, _BgColor);
    var _proto22 = Bg.prototype;
    _proto22.buildLayout = function buildLayout() {
      return main_core.Tag.render(_templateObject56 || (_templateObject56 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"landing-ui-field-color-color\">\n\t\t\t\t", "\n\t\t\t</div>\n\t\t"])), this.bigTabs.getLayout());
    };
    _proto22.onColorSetChange = function onColorSetChange(event) {
      this.image.unsetActive();
      this.overlay.unsetActive();
      _BgColor.prototype.onColorSetChange.call(this, event);
    };
    _proto22.onGradientChange = function onGradientChange(event) {
      this.image.unsetActive();
      this.overlay.unsetActive();
      _BgColor.prototype.onGradientChange.call(this, event);
    };
    _proto22.onImageChange = function onImageChange() {
      // todo: can drop image from b_landing_file after change
      this.unsetActive();
      this.activeControl = this.image;
      this.image.setActive();
      this.modifyStyleNode(this.styleNode);
    };
    _proto22.onOverlayChange = function onOverlayChange(event) {
      const overlayValue = event.getData().color;
      if (overlayValue !== null) {
        overlayValue.setOpacity(this.overlayOpacity.getValue().getOpacity());
      }
      this.overlayOpacity.setValue(overlayValue);
      const imageValue = this.image.getValue();
      if (imageValue !== null) {
        this.image.setValue(imageValue.setOverlay(overlayValue));
        this.activeControl = this.image;
        this.image.setActive();
        this.colorSet.unsetActive();
        this.gradient.unsetActive();
      }
      this.modifyStyleNode(this.styleNode);
    };
    _proto22.onOverlayOpacityChange = function onOverlayOpacityChange() {
      this.modifyStyleNode(this.styleNode);
    };
    _proto22.onOverlayColorChange = function onOverlayColorChange(event) {
      this.overlayPrimary.unsetActive();
      this.overlayZeroing.unsetActive();
      this.onOverlayChange(event);
    };
    _proto22.onOverlayPrimaryChange = function onOverlayPrimaryChange(event) {
      this.overlay.unsetActive();
      this.overlayZeroing.unsetActive();
      this.onOverlayChange(event);
    };
    _proto22.overlayZeroingChange = function overlayZeroingChange(event) {
      this.overlay.unsetActive();
      this.overlayPrimary.unsetActive();
      this.overlayZeroing.setActive();
      this.onOverlayChange(event);
    };
    _proto22.unsetActive = function unsetActive() {
      _BgColor.prototype.unsetActive.call(this);
      this.image.unsetActive();
    }

    /**
     * Set value by new format
     */;
    _proto22.setProcessorValue = function setProcessorValue(value) {
      this.cache.delete('value');
      this.setValue(value);
    };
    _proto22.setValue = function setValue(value) {
      this.image.setValue(null);
      this.bigTabs.showTab('Color');
      if (main_core.Type.isNull(value)) {
        _BgColor.prototype.setValue.call(this, value);
      } else if (main_core.Type.isString(value)) {
        _BgColor.prototype.setValue.call(this, value);
      } else if (this.parentVariableName in value && main_core.Type.isString(value[this.parentVariableName])) {
        _BgColor.prototype.setValue.call(this, value[this.parentVariableName]);
      } else if (main_core.Type.isObject(value)) {
        // todo: super.setValue null?
        const bgValue = new BgImageValue();
        if (Bg.BG_URL_VAR in value) {
          bgValue.setUrl(value[Bg.BG_URL_VAR].replace(/url\(["']/i, '').replace(/['"]\)/i, ''));
        }
        if (Bg.BG_URL_2X_VAR in value) {
          bgValue.setUrl2x(value[Bg.BG_URL_2X_VAR].replace(/url\(["']/i, '').replace(/['"]\)/i, ''));
        }
        if (Bg.BG_SIZE_VAR in value) {
          bgValue.setSize(value[Bg.BG_SIZE_VAR]);
        }
        if (Bg.BG_ATTACHMENT_VAR in value) {
          bgValue.setAttachment(value[Bg.BG_ATTACHMENT_VAR]);
        }
        if (Bg.BG_OVERLAY_VAR in value) {
          bgValue.setOverlay(new ColorValue(value[Bg.BG_OVERLAY_VAR]));
        }
        this.image.setValue(bgValue);
        this.bigTabs.showTab('Image');
        this.activeControl = this.image;
        this.imageTabs.showTab('Overlay');
        if (Bg.BG_OVERLAY_VAR in value) {
          const overlayValue = new ColorValue(value[Bg.BG_OVERLAY_VAR]);
          this.overlay.setValue(overlayValue);
          this.overlayOpacity.setValue(overlayValue);
          if (value[Bg.BG_OVERLAY_VAR].startsWith('var(--primary') || value['isPrimaryBasedColor'] === true) {
            this.overlayPrimary.setActive();
            this.overlay.unsetActive();
          }
        } else {
          this.overlayZeroing.setActive();
        }
      }
    }

    // todo: create base value instead interface. In this case can return ALL types, color, grad, bg
;
    _proto22.getValue = function getValue() {
      return this.cache.remember('value', () => {
        if (this.activeControl === this.image) {
          const imageValue = this.image.getValue();
          let overlayValue;
          let isActive = false;
          if (this.overlay.isActive()) {
            overlayValue = this.overlay.getValue();
            isActive = true;
          }
          if (this.overlayPrimary.isActive()) {
            overlayValue = this.overlayPrimary.getValue();
            isActive = true;
          }
          if (this.overlayZeroing.isActive()) {
            overlayValue = null;
          }
          if (imageValue !== null && overlayValue !== null && isActive) {
            overlayValue.setOpacity(this.overlayOpacity.getValue().getOpacity());
            imageValue.setOverlay(overlayValue);
          }
          return imageValue;
        } else {
          return _BgColor.prototype.getValue.call(this);
        }
      });
    };
    _proto22.getClassName = function getClassName() {
      const value = this.getValue();
      if (value === null || value instanceof ColorValue || value instanceof GradientValue) {
        return [this.parentClassName];
      }
      return [this.className];
    }

    // todo: what about fileid?
;
    _proto22.getStyle = function getStyle() {
      if (this.getValue() === null) {
        // todo: not null, but what?
        return {
          [this.parentVariableName]: null,
          [Bg.BG_URL_VAR]: null,
          [Bg.BG_URL_2X_VAR]: null,
          [Bg.BG_OVERLAY_VAR]: null,
          [Bg.BG_SIZE_VAR]: null,
          [Bg.BG_ATTACHMENT_VAR]: null
        };
      }
      const value = this.getValue();
      let color = null;
      let image = null;
      let image2x = null;
      let overlay = null;
      let size = null;
      let attachment = null;
      const backgroundImage = '';
      if (value instanceof ColorValue || value instanceof GradientValue) {
        // todo: need change class if not a image?
        color = value.getStyleString();
      } else {
        image = value.getUrl() ? "url('".concat(value.getUrl(), "')") : '';
        image2x = value.getUrl2x() ? "url('".concat(value.getUrl2x(), "')") : '';
        overlay = value.getOverlay() ? value.getOverlay().getStyleString() : 'rgba(0, 0, 0, 0)';
        size = value.getSize();
        attachment = value.getAttachment();
      }
      return {
        [this.parentVariableName]: color,
        [Bg.BG_URL_VAR]: image,
        [Bg.BG_URL_2X_VAR]: image2x ? image2x : image,
        [Bg.BG_OVERLAY_VAR]: overlay,
        [Bg.BG_SIZE_VAR]: size,
        [Bg.BG_ATTACHMENT_VAR]: attachment,
        [Bg.BG_IMAGE]: backgroundImage
      };
    };
    _proto22.modifyStyleNode = function modifyStyleNode(styleNode) {
      main_core.Dom.style(styleNode.getNode()[0], Bg.BG_IMAGE, '');
      this.onChange();
    };
    _proto22.prepareProcessorValue = function prepareProcessorValue(processorValue, defaultValue) {
      if (defaultValue && defaultValue.hasOwnProperty(Bg.BG_IMAGE)) {
        const regUrl = /url\(/i;
        const searchUrl = defaultValue[Bg.BG_IMAGE].match(regUrl);
        if (searchUrl !== null) {
          processorValue[Bg.BG_IMAGE] = '';
          processorValue[Bg.BG_SIZE_VAR] = defaultBgImageSize;
          processorValue[Bg.BG_ATTACHMENT_VAR] = defaultBgImageAttachment;
          const regUrl = /image-set\(url\(/i;
          const searchUrl = defaultValue[Bg.BG_IMAGE].match(regUrl);
          if (searchUrl !== null) {
            const regSearchUrl = /["'](https?:\/)?\/[\S]*["']/gi;
            const search = defaultValue[Bg.BG_IMAGE].match(regSearchUrl);
            if (search) {
              const regReplace = /["']/g;
              processorValue[Bg.BG_URL_VAR] = search[0].replaceAll(regReplace, '');
              if (search.length === 2) {
                processorValue[Bg.BG_URL_2X_VAR] = search[1].replaceAll(regReplace, '');
              } else {
                processorValue[Bg.BG_URL_2X_VAR] = search[0].replaceAll(regReplace, '');
              }
            }
          } else {
            processorValue[Bg.BG_URL_VAR] = defaultValue[Bg.BG_IMAGE];
            processorValue[Bg.BG_URL_2X_VAR] = defaultValue[Bg.BG_IMAGE];
          }
          const computedStyleNode = getComputedStyle(this.styleNode.getNode()[0], ':after');
          if (!processorValue[Bg.BG_OVERLAY_VAR]) {
            processorValue[Bg.BG_OVERLAY_VAR] = computedStyleNode.backgroundColor;
          }
          const currentColorRgb = rgbaStringToRgbString(computedStyleNode.backgroundColor);
          const primaryColorRgb = rgbaStringToRgbString(computedStyleNode.getPropertyValue('--primary-opacity-0'));
          if (currentColorRgb !== null && primaryColorRgb !== null && currentColorRgb === primaryColorRgb) {
            processorValue['isPrimaryBasedColor'] = true;
          }
        }
      }
      return processorValue;
    };
    return Bg;
  }(BgColor);
  Bg.BG_URL_VAR = '--bg-url';
  Bg.BG_URL_2X_VAR = '--bg-url-2x';
  Bg.BG_OVERLAY_VAR = '--bg-overlay';
  Bg.BG_SIZE_VAR = '--bg-size';
  Bg.BG_ATTACHMENT_VAR = '--bg-attachment';
  Bg.BG_IMAGE = 'background-image';
  let BorderColor = /*#__PURE__*/function (_Color4) {
    function BorderColor(options) {
      var _this21;
      _this21 = _Color4.call(this, options) || this;
      _this21.setEventNamespace('BX.Landing.UI.Field.Processor.BorderColor');
      _this21.property = 'border-color';
      _this21.variableName = '--border-color';
      _this21.className = 'g-border-color';
      return _this21;
    }
    babelHelpers.inherits(BorderColor, _Color4);
    return BorderColor;
  }(Color);
  let BorderColorHover = /*#__PURE__*/function (_Color5) {
    function BorderColorHover(options) {
      var _this22;
      _this22 = _Color5.call(this, options) || this;
      _this22.setEventNamespace('BX.Landing.UI.Field.Processor.BorderColorHover');
      _this22.property = 'border-color';
      _this22.variableName = '--border-color--hover';
      _this22.className = 'g-border-color--hover';
      _this22.pseudoClass = ':hover';
      return _this22;
    }
    babelHelpers.inherits(BorderColorHover, _Color5);
    return BorderColorHover;
  }(Color);
  let BgColorHover = /*#__PURE__*/function (_BgColor2) {
    function BgColorHover(options) {
      var _this23;
      _this23 = _BgColor2.call(this, options) || this;
      _this23.setEventNamespace('BX.Landing.UI.Field.Processor.BgColorHover');
      _this23.property = ['background-image', 'background-color'];
      _this23.variableName = '--bg-hover';
      _this23.className = 'g-bg--hover';
      _this23.pseudoClass = ':hover';
      return _this23;
    }
    babelHelpers.inherits(BgColorHover, _BgColor2);
    return BgColorHover;
  }(BgColor);
  let BgColorAfter = /*#__PURE__*/function (_BgColor3) {
    function BgColorAfter(options) {
      var _this24;
      _this24 = _BgColor3.call(this, options) || this;
      _this24.setEventNamespace('BX.Landing.UI.Field.Processor.BgColorAfter');
      _this24.property = ['background-image', 'background-color'];
      _this24.variableName = '--bg--after';
      _this24.className = 'g-bg--after';
      _this24.pseudoClass = ':after';
      const opacityValue = _this24.getValue() || new ColorValue();
      _this24.opacity.setValue(opacityValue.setOpacity(0.5));
      _this24.tabs.showTab('Opacity');
      return _this24;
    }
    babelHelpers.inherits(BgColorAfter, _BgColor3);
    return BgColorAfter;
  }(BgColor);
  let BgColorBefore = /*#__PURE__*/function (_BgColor4) {
    function BgColorBefore(options) {
      var _this25;
      _this25 = _BgColor4.call(this, options) || this;
      _this25.setEventNamespace('BX.Landing.UI.Field.Processor.BgColorBefore');
      _this25.property = ['background-image', 'background-color'];
      _this25.variableName = '--bg--before';
      _this25.className = 'g-bg--before';
      _this25.pseudoClass = ':before';
      const opacityValue = _this25.getValue() || new ColorValue();
      _this25.opacity.setValue(opacityValue.setOpacity(0.5));
      _this25.tabs.showTab('Opacity');
      return _this25;
    }
    babelHelpers.inherits(BgColorBefore, _BgColor4);
    return BgColorBefore;
  }(BgColor);
  let NavbarColor = /*#__PURE__*/function (_Color6) {
    function NavbarColor(options) {
      var _this26;
      _this26 = _Color6.call(this, options) || this;
      _this26.setEventNamespace('BX.Landing.UI.Field.Processor.NavbarColor');
      _this26.property = 'color';
      _this26.variableName = '--navbar-color';
      _this26.className = 'u-navbar-color';
      return _this26;
    }
    babelHelpers.inherits(NavbarColor, _Color6);
    return NavbarColor;
  }(Color);
  let NavbarColorHover = /*#__PURE__*/function (_Color7) {
    function NavbarColorHover(options) {
      var _this27;
      _this27 = _Color7.call(this, options) || this;
      _this27.setEventNamespace('BX.Landing.UI.Field.Processor.NavbarColorHover');
      _this27.property = 'color';
      _this27.variableName = '--navbar-color--hover';
      _this27.className = 'u-navbar-color--hover';
      _this27.pseudoClass = ':hover';
      return _this27;
    }
    babelHelpers.inherits(NavbarColorHover, _Color7);
    return NavbarColorHover;
  }(Color);
  let NavbarColorFixMoment = /*#__PURE__*/function (_Color8) {
    function NavbarColorFixMoment(options) {
      var _this28;
      _this28 = _Color8.call(this, options) || this;
      _this28.setEventNamespace('BX.Landing.UI.Field.Processor.NavbarColorFixMoment');
      _this28.property = 'color';
      _this28.variableName = '--navbar-color--fix-moment';
      _this28.className = 'u-navbar-color--fix-moment';
      return _this28;
    }
    babelHelpers.inherits(NavbarColorFixMoment, _Color8);
    return NavbarColorFixMoment;
  }(Color);
  let NavbarColorFixMomentHover = /*#__PURE__*/function (_Color9) {
    function NavbarColorFixMomentHover(options) {
      var _this29;
      _this29 = _Color9.call(this, options) || this;
      _this29.setEventNamespace('BX.Landing.UI.Field.Processor.NavbarColorFixMomentHover');
      _this29.property = 'color';
      _this29.variableName = '--navbar-color--fix-moment--hover';
      _this29.className = 'u-navbar-color--fix-moment--hover';
      _this29.pseudoClass = ':hover';
      return _this29;
    }
    babelHelpers.inherits(NavbarColorFixMomentHover, _Color9);
    return NavbarColorFixMomentHover;
  }(Color);
  let NavbarBgColor = /*#__PURE__*/function (_Color0) {
    function NavbarBgColor(options) {
      var _this30;
      _this30 = _Color0.call(this, options) || this;
      _this30.setEventNamespace('BX.Landing.UI.Field.Processor.NavbarBgColor');
      _this30.property = 'background-color';
      _this30.variableName = '--navbar-bg-color';
      _this30.className = 'u-navbar-bg';
      return _this30;
    }
    babelHelpers.inherits(NavbarBgColor, _Color0);
    return NavbarBgColor;
  }(Color);
  let NavbarBgColorHover = /*#__PURE__*/function (_Color1) {
    function NavbarBgColorHover(options) {
      var _this31;
      _this31 = _Color1.call(this, options) || this;
      _this31.setEventNamespace('BX.Landing.UI.Field.Processor.NavbarBgColorHover');
      _this31.property = 'background-color';
      _this31.variableName = '--navbar-bg-color--hover';
      _this31.className = 'u-navbar-bg--hover';
      _this31.pseudoClass = ':hover';
      return _this31;
    }
    babelHelpers.inherits(NavbarBgColorHover, _Color1);
    return NavbarBgColorHover;
  }(Color);
  let BorderColorTop = /*#__PURE__*/function (_Color10) {
    function BorderColorTop(options) {
      var _this32;
      _this32 = _Color10.call(this, options) || this;
      _this32.setEventNamespace('BX.Landing.UI.Field.Processor.BorderColorTop');
      _this32.property = 'border-top-color';
      _this32.variableName = '--border-color-top';
      _this32.className = 'g-border-color-top';
      return _this32;
    }
    babelHelpers.inherits(BorderColorTop, _Color10);
    return BorderColorTop;
  }(Color);
  let FillColor = /*#__PURE__*/function (_Color11) {
    function FillColor(options) {
      var _this33;
      _this33 = _Color11.call(this, options) || this;
      _this33.setEventNamespace('BX.Landing.UI.Field.Processor.FillColor');
      _this33.property = 'fill';
      _this33.pseudoClass = ':before';
      _this33.variableName = '--fill-first';
      _this33.className = 'g-fill-first';
      return _this33;
    }
    babelHelpers.inherits(FillColor, _Color11);
    return FillColor;
  }(Color);
  let FillColorSecond = /*#__PURE__*/function (_Color12) {
    function FillColorSecond(options) {
      var _this34;
      _this34 = _Color12.call(this, options) || this;
      _this34.setEventNamespace('BX.Landing.UI.Field.Processor.FillColorSecond');
      _this34.property = 'fill';
      _this34.pseudoClass = ':after';
      _this34.variableName = '--fill-second';
      _this34.className = 'g-fill-second';
      return _this34;
    }
    babelHelpers.inherits(FillColorSecond, _Color12);
    return FillColorSecond;
  }(Color);
  let ButtonColor = /*#__PURE__*/function (_Color13) {
    function ButtonColor(options) {
      var _this35;
      _this35 = _Color13.call(this, options) || this;
      _this35.setEventNamespace('BX.Landing.UI.Field.Processor.ButtonColor');
      _this35.property = 'background-color';
      // order is important! Base variable must be last. Hack :-/
      _this35.variableName = [ButtonColor.COLOR_CONTRAST_VAR, ButtonColor.COLOR_HOVER_VAR, ButtonColor.COLOR_LIGHT_VAR, ButtonColor.COLOR_VAR];
      _this35.className = 'g-button-color'; //todo: ?
      return _this35;
    }
    babelHelpers.inherits(ButtonColor, _Color13);
    var _proto23 = ButtonColor.prototype;
    _proto23.getStyle = function getStyle() {
      if (this.getValue() === null) {
        return {
          [ButtonColor.COLOR_CONTRAST_VAR]: null,
          [ButtonColor.COLOR_HOVER_VAR]: null,
          [ButtonColor.COLOR_LIGHT_VAR]: null,
          [ButtonColor.COLOR_VAR]: null
        };
      }
      const value = this.getValue();
      const valueContrast = value.getContrast().lighten(10);
      const valueHover = new ColorValue(value).lighten(10);
      const valueLight = value.getLighten();
      return {
        [ButtonColor.COLOR_CONTRAST_VAR]: valueContrast.getStyleString(),
        [ButtonColor.COLOR_HOVER_VAR]: valueHover.getStyleString(),
        [ButtonColor.COLOR_LIGHT_VAR]: valueLight.getStyleString(),
        [ButtonColor.COLOR_VAR]: value.getStyleString()
      };
    };
    return ButtonColor;
  }(Color);
  ButtonColor.COLOR_CONTRAST_VAR = '--button-color-contrast';
  ButtonColor.COLOR_HOVER_VAR = '--button-color-hover';
  ButtonColor.COLOR_LIGHT_VAR = '--button-color-light';
  ButtonColor.COLOR_VAR = '--button-color';
  let NavbarCollapseBgColor = /*#__PURE__*/function (_Color14) {
    function NavbarCollapseBgColor(options) {
      var _this36;
      _this36 = _Color14.call(this, options) || this;
      _this36.setEventNamespace('BX.Landing.UI.Field.Processor.NavbarCollapseBgColor');
      _this36.property = 'background-color';
      _this36.variableName = '--navbar-collapse-bg-color';
      _this36.className = 'u-navbar-collapse-bg';
      return _this36;
    }
    babelHelpers.inherits(NavbarCollapseBgColor, _Color14);
    return NavbarCollapseBgColor;
  }(Color);
  let ColorField = /*#__PURE__*/function (_landing_ui_field_bas) {
    function ColorField(options) {
      var _this37;
      _this37 = _landing_ui_field_bas.call(this, options) || this;
      _this37.items = 'items' in options && options.items ? options.items : [];
      _this37.postfix = typeof options.postfix === 'string' ? options.postfix : '';
      _this37.frame = typeof options.frame === 'object' ? options.frame : null;
      const processorOptions = {
        block: options.block,
        style: options.style,
        styleNode: options.styleNode,
        selector: options.selector,
        contentRoot: _this37.contentRoot,
        content: options.content
      };
      _this37.changeHandler = typeof options.onChange === "function" ? options.onChange : () => {};
      _this37.valueChangeHandler = typeof options.onValueChange === "function" ? options.onValueChange : () => {};

      // todo: rename "subtype"
      switch (options.subtype) {
        case 'color':
          _this37.processor = new Color(processorOptions);
          break;
        case 'color-hover':
          _this37.processor = new ColorHover(processorOptions);
          break;
        case 'bg':
          _this37.processor = new Bg(processorOptions);
          break;
        case 'bg-color':
          _this37.processor = new BgColor(processorOptions);
          break;
        case 'bg-color-hover':
          _this37.processor = new BgColorHover(processorOptions);
          break;
        case 'bg-color-after':
          _this37.processor = new BgColorAfter(processorOptions);
          break;
        case 'bg-color-before':
          _this37.processor = new BgColorBefore(processorOptions);
          break;
        case 'border-color':
          _this37.processor = new BorderColor(processorOptions);
          break;
        case 'border-color-hover':
          _this37.processor = new BorderColorHover(processorOptions);
          break;
        case 'border-color-top':
          _this37.processor = new BorderColorTop(processorOptions);
          break;
        case 'navbar-color':
          _this37.processor = new NavbarColor(processorOptions);
          break;
        case 'navbar-color-hover':
          _this37.processor = new NavbarColorHover(processorOptions);
          break;
        case 'navbar-color-fix-moment':
          _this37.processor = new NavbarColorFixMoment(processorOptions);
          break;
        case 'navbar-color-fix-moment-hover':
          _this37.processor = new NavbarColorFixMomentHover(processorOptions);
          break;
        case 'navbar-bg-color':
          _this37.processor = new NavbarBgColor(processorOptions);
          break;
        case 'navbar-bg-color-hover':
          _this37.processor = new NavbarBgColorHover(processorOptions);
          break;
        case 'navbar-collapse-bg-color':
          _this37.processor = new NavbarCollapseBgColor(processorOptions);
          break;
        case 'fill-color':
          _this37.processor = new FillColor(processorOptions);
          break;
        case 'fill-color-second':
          _this37.processor = new FillColorSecond(processorOptions);
          break;
        case 'button-color':
          _this37.processor = new ButtonColor(processorOptions);
          break;
      }
      if (!_this37.processor) {
        return babelHelpers.assertThisInitialized(_this37);
      }
      _this37.property = _this37.processor.getProperty()[_this37.processor.getProperty().length - 1];
      _this37.processor.getClassName().forEach(item => _this37.items.push({
        name: item,
        value: item
      }));

      // todo: what a input?
      main_core.Dom.remove(_this37.input);
      _this37.layout.classList.add("landing-ui-field-color");
      main_core.Dom.append(_this37.processor.getLayout(), _this37.layout);
      _this37.processor.subscribe('onChange', _this37.onChange.bind(_this37));
      return _this37;
    }
    babelHelpers.inherits(ColorField, _landing_ui_field_bas);
    var _proto24 = ColorField.prototype;
    _proto24.getInlineProperties = function getInlineProperties() {
      return this.processor.getVariableName();
    };
    _proto24.prepareInlineProperties = function prepareInlineProperties(props) {
      props.push('background-image');
      return props;
    };
    _proto24.getComputedProperties = function getComputedProperties() {
      return this.processor.getProperty();
    };
    _proto24.getPseudoElement = function getPseudoElement() {
      return this.processor.getPseudoClass();
    };
    _proto24.onChange = function onChange() {
      this.changeHandler({
        className: this.processor.getClassName(),
        style: this.processor.getStyle()
      }, this.items, this.postfix, this.property);

      // add fake text field for correctly getValue() in handler
      const value = this.getValue();
      let content = '';
      if (value instanceof ColorValue) {
        content = value.getStyleString();
      } else if (value instanceof BgImageValue) {
        content = value.getUrl();
      } else if (value instanceof GradientValue) {
        content = value.getStyleString();
      }
      this.valueChangeHandler(new landing_ui_field_textfield.TextField({
        selector: this.selector,
        attribute: this.attribute,
        content: content,
        textOnly: true
      }));
      this.emit('onChange');
    };
    _proto24.getValue = function getValue() {
      return this.processor.getValue() || this.processor.getNullValue();
    };
    _proto24.setValue = function setValue(value) {
      let processorValue = null;
      // now for multiple properties get just last value. Maybe, need object-like values
      this.prepareInlineProperties(this.getInlineProperties()).forEach(prop => {
        if (prop in value && !this.processor.isNullValue(value[prop])) {
          if (!main_core.Type.isObject(processorValue)) {
            processorValue = {};
          }
          processorValue[prop] = value[prop];
        }
      });
      let defaultValue = null;
      this.getComputedProperties().forEach(prop => {
        if (prop in value && !this.processor.isNullValue(value[prop])) {
          if (!main_core.Type.isObject(defaultValue)) {
            defaultValue = {};
          }
          defaultValue[prop] = value[prop];
        }
      });
      processorValue = this.processor.prepareProcessorValue(processorValue, defaultValue);
      if (processorValue !== null) {
        this.processor.setProcessorValue(processorValue);
      } else {
        this.processor.setDefaultValue(defaultValue);
        this.processor.defineActiveControl(this.items, this.data.styleNode);
      }
    };
    _proto24.onFrameLoad = function onFrameLoad() {
      // todo: now not work with "group select", can use just any node from elements. If group - need forEach
      const value = this.data.styleNode.getValue(true);
      this.setValue(value.style);
    };
    _proto24.createPopup = function createPopup(options) {
      this.colorPopup = new ColorPopup(options);
    };
    return ColorField;
  }(landing_ui_field_basefield.BaseField);
  exports.ColorField = ColorField;
})(this.BX.Landing.UI.Field = this.BX.Landing.UI.Field || {}, BX, BX.Landing.UI.Field, BX.Landing.UI.Field, BX.Main, BX.Event, BX.Landing, window, BX, BX.Landing, BX.Landing.UI.Field, BX.Landing);
//# sourceMappingURL=color_field.bundle.js.map