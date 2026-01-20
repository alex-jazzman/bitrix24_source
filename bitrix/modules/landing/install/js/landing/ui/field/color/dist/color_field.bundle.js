/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.UI = this.BX.Landing.UI || {};
(function (exports,landing_ui_field_basefield,landing_ui_field_textfield,main_popup,ui_fonts_opensans,ui_designTokens,main_core_events,landing_ui_field_image,landing_backend,landing_env,landing_pageobject,main_core) {
	'use strict';

	const matcher = /^rgba? ?\((\d{1,3})[, ]+(\d{1,3})[, ]+(\d{1,3})([, ]+([\d\.]{1,5}))?\)$/i;
	function isRgbString(rgbString) {
	  return !!rgbString.match(matcher);
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
	    const r = parseInt(`0x${hex[1]}${hex[1]}`, 16);
	    const g = parseInt(`0x${hex[2]}${hex[2]}`, 16);
	    const b = parseInt(`0x${hex[3]}${hex[3]}`, 16);
	    return {
	      r,
	      g,
	      b
	    };
	  }
	  if (hex.length === 7) {
	    const r = parseInt(`0x${hex[1]}${hex[2]}`, 16);
	    const g = parseInt(`0x${hex[3]}${hex[4]}`, 16);
	    const b = parseInt(`0x${hex[5]}${hex[6]}`, 16);
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
	  let matches = rgbString.trim().match(matcher);
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

	const matcher$1 = /^(var\()?((--[\w\d-]*?)(-opacity_([\d_]+)?)?)\)?$/i;
	function isCssVar(css) {
	  return !!css.trim().match(matcher$1);
	}
	function parseCssVar(css) {
	  const matches = css.trim().match(matcher$1);
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

	class ColorValue {
	  /**
	   * For preserve differences between hsl->rgb and rgb->hsl conversions we can save hex
	   * @type {?string}
	   */

	  /**
	   * if set css variable value - save them in '--var-name' format
	   * @type {?string}
	   */

	  constructor(value) {
	    this.value = defaultColorValueOptions;
	    this.hex = null;
	    this.cssVar = null;
	    this.setValue(value);
	  }
	  getName() {
	    if (this.hex) {
	      return this.getHex() + '_' + this.getOpacity();
	    }
	    const {
	      h,
	      s,
	      l
	    } = this.getHsl();
	    return `${h}-${s}-${l}-${this.getOpacity()}`;
	  }
	  setValue(value) {
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
	  }
	  setOpacity(opacity) {
	    this.setValue({
	      a: opacity
	    });
	    return this;
	  }
	  lighten(percent) {
	    this.value.l = Math.min(this.value.l + percent, 100);
	    this.hex = null;
	    return this;
	  }
	  darken(percent) {
	    this.value.l = Math.max(this.value.l - percent, 0);
	    this.hex = null;
	    return this;
	  }
	  saturate(percent) {
	    this.value.s = Math.min(this.value.s + percent, 100);
	    this.hex = null;
	    return this;
	  }
	  desaturate(percent) {
	    this.value.s = Math.max(this.value.s - percent, 0);
	    this.hex = null;
	    return this;
	  }
	  adjustHue(degree) {
	    this.value.h = (this.value.h + degree) % 360;
	    return this;
	  }
	  getHsl() {
	    return {
	      h: this.value.h,
	      s: this.value.s,
	      l: this.value.l
	    };
	  }
	  getHsla() {
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
	   */
	  getHex() {
	    return this.hex || hslToHex(this.value);
	  }

	  /**
	   * Return hex only if value created from hex-string
	   */
	  getHexOriginal() {
	    return this.hex;
	  }
	  getOpacity() {
	    var _this$value$a;
	    return (_this$value$a = this.value.a) != null ? _this$value$a : defaultColorValueOptions.a;
	  }
	  getCssVar() {
	    return this.cssVar;
	  }

	  /**
	   * Get style string for set inline css var.
	   * Set hsla value or primary css var with opacity in format --var-name-opacity_12_3
	   * @returns {string}
	   */
	  getStyleString() {
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
	      return `hsla(${h}, ${s}%, ${l}%, ${a})`;
	    } else {
	      let fullCssVar = this.cssVar;
	      if (this.value.a !== defaultColorValueOptions.a) {
	        fullCssVar = fullCssVar + '-opacity-' + String(this.value.a).replace('.', '_');
	      }
	      return `var(${fullCssVar})`;
	    }
	  }
	  getStyleStringForOpacity() {
	    const {
	      h,
	      s,
	      l
	    } = this.value;
	    return `linear-gradient(to right, hsla(${h}, ${s}%, ${l}%, 0) 0%, hsla(${h}, ${s}%, ${l}%, 1) 100%)`;
	  }
	  static compare(color1, color2) {
	    return color1.getHsla().h === color2.getHsla().h && color1.getHsla().s === color2.getHsla().s && color1.getHsla().l === color2.getHsla().l && color1.getHsla().a === color2.getHsla().a && color1.cssVar === color2.cssVar;
	  }
	  static getMedian(color1, color2) {
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
	   */
	  getContrast() {
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
	   */
	  getLighten() {
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
	  }
	}

	let _ = t => t,
	  _t;
	class BaseControl extends main_core_events.EventEmitter {
	  constructor(options) {
	    super();
	    this.cache = new main_core.Cache.MemoryCache();
	  }
	  getLayout() {
	    return this.cache.remember('layout', () => {
	      return this.buildLayout();
	    });
	  }
	  buildLayout() {
	    return main_core.Tag.render(_t || (_t = _`
			<div class="landing-ui-field-base-control">
				Base control
			</div>
		`));
	  }
	  getValue() {
	    return this.cache.remember('value', () => {
	      return new ColorValue();
	    });
	  }
	  isNeedSetValue(value) {
	    return value !== this.getValue();
	  }
	  setValue(value) {
	    this.cache.set('value', value);
	  }
	  onChange(event) {
	    this.cache.delete('value');
	    this.emit('onChange', {
	      color: this.getValue()
	    });
	  }
	  setActive() {
	    main_core.Dom.addClass(this.getLayout(), BaseControl.ACTIVE_CLASS);
	  }
	  unsetActive() {
	    main_core.Dom.removeClass(this.getLayout(), BaseControl.ACTIVE_CLASS);
	  }
	  isActive() {
	    return main_core.Dom.hasClass(this.getLayout(), BaseControl.ACTIVE_CLASS);
	  }
	}
	BaseControl.ACTIVE_CLASS = 'active';

	let _$1 = t => t,
	  _t$1,
	  _t2,
	  _t3,
	  _t4;
	class Hex extends BaseControl {
	  constructor() {
	    super();
	    this.setEventNamespace('BX.Landing.UI.Field.Color.Hex');
	    this.onInput = main_core.Runtime.debounce(this.onInput.bind(this), 300);
	    this.previewMode = false;
	  }
	  buildLayout() {
	    main_core.Event.bind(this.getInput(), 'input', this.onInput);
	    this.adjustColors(Hex.DEFAULT_COLOR, Hex.DEFAULT_BG);
	    const modeClass = this.previewMode ? '--preview' : '--base';
	    return main_core.Tag.render(_t$1 || (_t$1 = _$1`
			<div class="landing-ui-field-color-hex ${0}">
				${0}
				${0}
				${0}
			</div>
		`), modeClass, this.getPreview(), this.getInput(), this.previewMode ? this.getButton() : '');
	  }
	  getPreview() {
	    return this.cache.remember('preview', () => {
	      return main_core.Tag.render(_t2 || (_t2 = _$1`<div class="landing-ui-field-color-hex-preview"></div>`));
	    });
	  }
	  getInput() {
	    return this.cache.remember('input', () => {
	      return main_core.Tag.render(_t3 || (_t3 = _$1`<input type="text" name="hexInput" value="${0}" class="landing-ui-field-color-hex-input">`), Hex.DEFAULT_TEXT);
	    });
	  }
	  onInput() {
	    let value = this.getInput().value.replaceAll(/[^\da-f]/gi, '');
	    value = value.slice(0, 6);
	    this.getInput().value = `#${value.toLowerCase()}`;
	    if (this.getInput().value.length === 7) {
	      this.emit('onValidInput', {
	        value
	      });
	    }
	    this.onChange();
	  }
	  onChange(event) {
	    const color = this.getInput().value.length === 7 && isHex(this.getInput().value) ? new ColorValue(this.getInput().value) : null;
	    this.setValue(color);
	    this.cache.delete('value');
	    this.emit('onChange', {
	      color
	    });
	  }
	  adjustColors(textColor, bgColor) {
	    if (this.previewMode === true) {
	      main_core.Dom.style(this.getInput(), 'color', textColor);
	      main_core.Dom.style(this.getButton(), 'fill', textColor);
	      main_core.Dom.style(this.getInput(), 'background', 'transparent');
	      main_core.Dom.style(this.getPreview(), 'display', 'none');
	    } else {
	      main_core.Dom.style(this.getPreview(), 'background-color', bgColor);
	    }
	  }
	  focus() {
	    if (this.getValue() === null) {
	      this.getInput().value = '#';
	    }
	    this.getInput().focus();
	  }
	  unFocus() {
	    this.getInput().blur();
	  }
	  getValue() {
	    return this.cache.remember('value', () => {
	      return this.getInput().value === Hex.DEFAULT_TEXT ? null : new ColorValue(this.getInput().value);
	    });
	  }
	  setValue(value) {
	    // todo: set checking in always controls?
	    if (this.isNeedSetValue(value)) {
	      super.setValue(value);
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
	  }
	  setActive() {
	    main_core.Dom.addClass(this.getInput(), Hex.ACTIVE_CLASS);
	  }
	  unsetActive() {
	    main_core.Dom.removeClass(this.getInput(), Hex.ACTIVE_CLASS);
	  }
	  isActive() {
	    return main_core.Dom.hasClass(this.getInput(), Hex.ACTIVE_CLASS);
	  }
	  setPreviewMode(preview) {
	    this.previewMode = preview;
	  }
	  isPreviewMode() {
	    return Boolean(this.previewMode);
	  }
	  getButton() {
	    return this.cache.remember('editButton', () => {
	      return main_core.Tag.render(_t4 || (_t4 = _$1`
				<svg class="landing-ui-field-color-hex-preview-btn" width="9" height="9" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M7.108 0l1.588 1.604L2.486 7.8.896 6.194 7.108 0zM.006 8.49a.166.166 0 00.041.158.161.161 0 00.16.042l1.774-.478L.484 6.715.006 8.49z"
						fill-rule="evenodd"/>
				</svg>
			`));
	    });
	  }
	}
	Hex.DEFAULT_TEXT = '#hex';
	Hex.DEFAULT_COLOR = '#000000';
	Hex.DEFAULT_BG = '#eeeeee';

	let _$2 = t => t,
	  _t$2,
	  _t2$1;
	class Spectrum extends BaseControl {
	  constructor(options) {
	    super();
	    this.setEventNamespace('BX.Landing.UI.Field.Color.Spectrum');
	    this.onPickerDragStart = this.onPickerDragStart.bind(this);
	    this.onPickerDragMove = this.onPickerDragMove.bind(this);
	    this.onPickerDragEnd = this.onPickerDragEnd.bind(this);
	    this.onScroll = this.onScroll.bind(this);
	    this.scrollContext = options.contentRoot;
	    main_core.Event.bind(this.getLayout(), 'mousedown', this.onPickerDragStart);
	  }
	  buildLayout() {
	    return main_core.Tag.render(_t$2 || (_t$2 = _$2`
			<div class="landing-ui-field-color-spectrum">
				${0}
			</div>
		`), this.getPicker());
	  }
	  getPicker() {
	    return this.cache.remember('picker', () => {
	      return main_core.Tag.render(_t2$1 || (_t2$1 = _$2`<div class="landing-ui-field-color-spectrum-picker"></div>`));
	    });
	  }
	  getPickerPos() {
	    return {
	      x: main_core.Text.toNumber(main_core.Dom.style(this.getPicker(), 'left')),
	      y: main_core.Text.toNumber(main_core.Dom.style(this.getPicker(), 'top'))
	    };
	  }
	  onPickerDragStart(event) {
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
	  }
	  onPickerDragMove(event) {
	    if (event.target === this.getPicker()) {
	      return;
	    }
	    this.setPickerPos(event.pageX, event.pageY);
	    this.onChange();
	  }
	  onPickerDragEnd() {
	    const documentBody = this.getLayout().ownerDocument.body;
	    main_core.Event.unbind(this.scrollContext, 'scroll', this.onScroll);
	    main_core.Event.unbind(this.getLayout(), 'mousemove', this.onPickerDragMove);
	    main_core.Event.unbind(this.getLayout(), 'mouseup', this.onPickerDragEnd);
	    main_core.Dom.removeClass(documentBody, 'landing-ui-field-color-draggable');
	    this.emit('onPickerDragEnd', {
	      color: this.getValue()
	    });
	  }
	  onScroll() {
	    this.cache.delete('layoutSize');
	  }
	  getLayoutRect() {
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
	   */
	  setPickerPos(x, y) {
	    const {
	      width,
	      height,
	      top,
	      left
	    } = this.getLayoutRect();
	    let leftToSet = Math.min(Math.max(x - left, 0), width);
	    leftToSet = leftToSet > width / Spectrum.HUE_RANGE * Spectrum.HUE_RANGE_GRAY_THRESHOLD ? width / Spectrum.HUE_RANGE * Spectrum.HUE_RANGE_GRAY_MIDDLE : leftToSet;
	    main_core.Dom.style(this.getPicker(), {
	      left: `${leftToSet}px`,
	      top: `${Math.min(Math.max(y - top, 0), height)}px`
	    });
	  }
	  getValue() {
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
	  }
	  setValue(value) {
	    super.setValue(value);
	    if (value !== null && Spectrum.isSpectrumValue(value)) {
	      // in first set value we can't match bounding client rect (layout not render). Then, use percents
	      const {
	        h,
	        s,
	        l
	      } = value.getHsl();
	      const left = s === 0 ? Spectrum.HUE_RANGE_GRAY_MIDDLE / Spectrum.HUE_RANGE * 100 : h / Spectrum.HUE_RANGE * 100;
	      main_core.Dom.style(this.getPicker(), 'left', `${left}%`);
	      const top = 100 - l;
	      main_core.Dom.style(this.getPicker(), 'top', `${top}%`);
	      this.showPicker();
	    } else {
	      this.hidePicker();
	    }
	  }
	  hidePicker() {
	    main_core.Dom.addClass(this.getPicker(), Spectrum.HIDE_CLASS);
	  }
	  showPicker() {
	    main_core.Dom.removeClass(this.getPicker(), Spectrum.HIDE_CLASS);
	  }
	  isActive() {
	    return this.getValue() !== null && Spectrum.isSpectrumValue(this.getValue());
	  }
	  static isSpectrumValue(value) {
	    return value !== null && (value.getHsl().s === Spectrum.DEFAULT_SATURATION || value.getHsl().s === 0);
	  }
	}
	Spectrum.DEFAULT_SATURATION = 100;
	Spectrum.HUE_RANGE = 375;
	Spectrum.HUE_RANGE_GRAY_THRESHOLD = 360;
	Spectrum.HUE_RANGE_GRAY_MIDDLE = 367;
	Spectrum.HIDE_CLASS = 'hidden';

	let _$3 = t => t,
	  _t$3;
	class Primary extends main_core_events.EventEmitter {
	  // todo: layout or control?
	  constructor(options = {}) {
	    super();
	    this.cache = new main_core.Cache.MemoryCache();
	    this.setEventNamespace('BX.Landing.UI.Field.Color.Primary');
	    main_core.Event.bind(this.getLayout(), 'click', () => this.onClick());
	    if (options.content && options.content === 'var(--primary)') {
	      this.setActive();
	    }
	  }
	  getLayout() {
	    return this.cache.remember('layout', () => {
	      return main_core.Tag.render(_t$3 || (_t$3 = _$3`
				<div class="landing-ui-field-color-primary">
					<i class="landing-ui-field-color-primary-preview"></i>
					<span class="landing-ui-field-color-primary-text">
						${0}
					</span>
				</div>
			`), main_core.Loc.getMessage('LANDING_FIELD_COLOR-PRIMARY_TITLE'));
	    });
	  }
	  getValue() {
	    return this.cache.remember('value', () => {
	      return new ColorValue(Primary.CSS_VAR);
	    });
	  }
	  onClick() {
	    this.setActive();
	    this.emit('onChange', {
	      color: this.getValue()
	    });
	  }
	  setActive() {
	    main_core.Dom.addClass(this.getLayout(), Primary.ACTIVE_CLASS);
	  }
	  unsetActive() {
	    main_core.Dom.removeClass(this.getLayout(), Primary.ACTIVE_CLASS);
	  }
	  isActive() {
	    return main_core.Dom.hasClass(this.getLayout(), Primary.ACTIVE_CLASS);
	  }
	  isPrimaryValue(value) {
	    return value !== null && this.getValue().getCssVar() === value.getCssVar();
	  }
	}
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

	class GradientValue {
	  constructor(value) {
	    this.value = {
	      from: new ColorValue('#ffffff'),
	      to: new ColorValue(Primary.CSS_VAR),
	      angle: GradientValue.DEFAULT_ANGLE,
	      type: GradientValue.DEFAULT_TYPE
	    };
	    this.setValue(value);
	  }
	  getName() {
	    return this.value.from.getName() + '_' + this.value.to.getName() + '_' + this.getAngle() + '_' + this.getType();
	  }

	  // todo: parse grad string?
	  setValue(value) {
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
	  }
	  setOpacity(opacity) {
	    this.value.from.setOpacity(opacity);
	    this.value.to.setOpacity(opacity);
	    return this;
	  }
	  parseGradientString(value) {
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
	  }
	  getFrom() {
	    return this.value.from;
	  }
	  getTo() {
	    return this.value.to;
	  }
	  getAngle() {
	    return this.value.angle;
	  }
	  setAngle(angle) {
	    if (main_core.Type.isNumber(angle)) {
	      this.value.angle = Math.min(Math.max(angle, 0), 360);
	    }
	    return this;
	  }
	  getType() {
	    return this.value.type;
	  }
	  setType(type) {
	    if (type === GradientValue.TYPE_RADIAL || type === GradientValue.TYPE_LINEAR) {
	      this.value.type = type;
	    }
	    return this;
	  }
	  getOpacity() {
	    var _ref;
	    return (_ref = (this.value.from.getOpacity() + this.value.to.getOpacity()) / 2) != null ? _ref : defaultColorValueOptions.a;
	  }
	  getStyleString() {
	    const angle = this.value.angle;
	    const type = this.value.type;
	    const fromString = this.value.from.getStyleString();
	    const toString = this.value.to.getStyleString();
	    return type === 'linear' ? `linear-gradient(${angle}deg, ${fromString} 0%, ${toString} 100%)` : `radial-gradient(circle farthest-side at 50% 50%, ${fromString} 0%, ${toString} 100%)`;
	  }
	  getStyleStringForOpacity() {
	    return `radial-gradient(at top left, ${this.value.from.getHex()}, transparent)` + `, radial-gradient(at bottom left, ${this.value.to.getHex()}, transparent)`;
	  }
	  static compare(value1, value2, full = true) {
	    const base = ColorValue.compare(value1.getFrom(), value2.getFrom()) && ColorValue.compare(value1.getTo(), value2.getTo()) || ColorValue.compare(value1.getTo(), value2.getFrom()) && ColorValue.compare(value1.getFrom(), value2.getTo());
	    const ext = full ? value1.getAngle() === value2.getAngle() && value1.getType() === value2.getType() : true;
	    return base && ext;
	  }
	}
	GradientValue.TYPE_RADIAL = 'radial';
	GradientValue.TYPE_LINEAR = 'linear';
	GradientValue.DEFAULT_ANGLE = 180;
	GradientValue.DEFAULT_TYPE = 'linear';

	const defaultType = 'color';
	const gradientType = 'gradient';

	class Generator {
	  static getDefaultPresets() {
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
	  }
	  static getPrimaryColorPreset() {
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
	  }
	  static getGradientByColorOptions(options) {
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
	  }
	}
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

	let _$4 = t => t,
	  _t$4,
	  _t2$2;
	class Preset extends main_core_events.EventEmitter {
	  constructor(options) {
	    super();
	    this.cache = new main_core.Cache.MemoryCache();
	    this.setEventNamespace('BX.Landing.UI.Field.Color.Preset');
	    this.id = options.id;
	    this.type = options.type || defaultType;
	    this.items = options.items;
	    this.activeItem = null;
	  }
	  getId() {
	    return this.id;
	  }
	  getGradientPreset() {
	    const options = this.type === gradientType ? {
	      type: gradientType,
	      items: this.items
	    } : Generator.getGradientByColorOptions({
	      items: this.items
	    });
	    return new Preset(options);
	  }
	  getLayout() {
	    return this.cache.remember('layout', () => {
	      return main_core.Tag.render(_t$4 || (_t$4 = _$4`
				<div class="landing-ui-field-color-preset">
					${0}
				</div>
			`), this.items.map(item => {
	        return this.getItemLayout(item.getName());
	      }));
	    });
	  }
	  getItemLayout(name) {
	    return this.cache.remember(name, () => {
	      const color = this.getItemByName(name);
	      const style = main_core.Type.isString(color) ? color : color.getStyleString();
	      const item = main_core.Tag.render(_t2$2 || (_t2$2 = _$4`
				<div
					class="landing-ui-field-color-preset-item"
					style="background: ${0}"
					data-name="${0}"
				></div>
			`), style, name);
	      main_core.Event.bind(item, 'click', this.onItemClick.bind(this));
	      return item;
	    });
	  }
	  getItemByName(name) {
	    return this.items.find(item => name === item.getName()) || null;
	  }
	  isPresetValue(value) {
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
	  }
	  onItemClick(event) {
	    this.setActiveItem(event.currentTarget.dataset.name);
	    let value = null;
	    if (this.activeItem !== null) {
	      value = this.activeItem instanceof GradientValue ? new GradientValue(this.activeItem) : new ColorValue(this.activeItem);
	    }
	    this.emit('onChange', {
	      color: value
	    });
	  }
	  setActiveItem(name) {
	    this.activeItem = this.getItemByName(name);
	    this.items.forEach(item => {
	      const itemName = item.getName();
	      if (name === itemName) {
	        main_core.Dom.addClass(this.getItemLayout(itemName), Preset.ACTIVE_CLASS);
	      } else {
	        main_core.Dom.removeClass(this.getItemLayout(itemName), Preset.ACTIVE_CLASS);
	      }
	    });
	  }
	  setActiveValue(value) {
	    if (value !== null) {
	      if (value instanceof GradientValue) {
	        this.setActiveItem(new GradientValue(value).setAngle(GradientValue.DEFAULT_ANGLE).setType(GradientValue.DEFAULT_TYPE).getName());
	      } else {
	        this.setActiveItem(new ColorValue(value).setOpacity(1).getName());
	      }
	    }
	  }
	  setActiveHex(hexValue) {
	    this.items.forEach(item => {
	      const hexItem = item.getHex();
	      if (hexValue === hexItem) {
	        this.setActiveItem(item.getName());
	      }
	    });
	  }
	  unsetActive() {
	    this.items.forEach(item => {
	      main_core.Dom.removeClass(this.getItemLayout(item.getName()), Preset.ACTIVE_CLASS);
	    });
	  }
	  isActive() {
	    return this.items.some(item => {
	      return main_core.Dom.hasClass(this.getItemLayout(item.getName()), Preset.ACTIVE_CLASS);
	    });
	  }
	}
	Preset.ACTIVE_CLASS = 'active';

	let _$5 = t => t,
	  _t$5,
	  _t2$3,
	  _t3$1,
	  _t4$1,
	  _t5;
	class PresetCollection extends main_core_events.EventEmitter {
	  constructor(options) {
	    super();
	    this.presets = {};
	    this.activeId = null;
	    this.cache = new main_core.Cache.MemoryCache();
	    this.setEventNamespace('BX.Landing.UI.Field.Color.PresetCollection');
	    this.popupId = 'presets-popup_' + main_core.Text.getRandom();
	    this.popupTargetContainer = options.contentRoot;
	    this.onPresetClick = this.onPresetClick.bind(this);
	    main_core.Event.bind(this.getOpenButton(), 'click', () => {
	      this.getPopup().toggle();
	    });
	    this.onPresetChangeGlobal = this.onPresetChangeGlobal.bind(this);
	    main_core_events.EventEmitter.subscribe('BX.Landing.UI.Field.Color.PresetCollection:onChange', this.onPresetChangeGlobal);
	  }
	  addDefaultPresets() {
	    this.addPreset(Generator.getPrimaryColorPreset());
	    Generator.getDefaultPresets().map(item => {
	      this.addPreset(item);
	    });
	  }
	  addPreset(options) {
	    this.cache.delete('popupLayout');
	    if (!Object.keys(this.presets).length || !(options.id in this.presets)) {
	      this.presets[options.id] = options;
	    }
	  }
	  getGlobalActiveId() {
	    return PresetCollection.globalActiveId;
	  }
	  getActiveId() {
	    return this.getGlobalActiveId() || this.getDefaultPreset().getId();
	  }
	  getActivePreset() {
	    return this.getPresetById(this.getActiveId());
	  }
	  getDefaultPreset() {
	    return Object.keys(this.presets).length ? this.getPresetById(Object.keys(this.presets)[0]) : null;
	  }
	  getPresetById(id) {
	    if (id in this.presets) {
	      return this.cache.remember(id, () => new Preset(this.presets[id]));
	    } else {
	      return null;
	    }
	  }
	  getAllPresets() {
	    return Object.keys(this.presets).map(id => this.getPresetById(id)).filter(Boolean);
	  }
	  getPresetByItemValue(value) {
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
	  }
	  getLayout() {
	    return this.cache.remember('value', () => {
	      return main_core.Tag.render(_t$5 || (_t$5 = _$5`
				<div class="landing-ui-field-color-presets">
					<div class="landing-ui-field-color-presets-left">
						<span class="landing-ui-field-color-presets-title">
							${0}
						</span>
					</div>
					<div class="landing-ui-field-color-presets-right">${0}</div>
				</div>
			`), main_core.Loc.getMessage('LANDING_FIELD_COLOR-PRESETS_TITLE'), this.getOpenButton());
	    });
	  }
	  getOpenButton() {
	    return this.cache.remember('openButton', () => {
	      return main_core.Tag.render(_t2$3 || (_t2$3 = _$5`<span class="landing-ui-field-color-presets-open">
				${0}
			</span>`), main_core.Loc.getMessage('LANDING_FIELD_COLOR-PRESETS_MORE'));
	    });
	  }
	  getTitleContainer() {
	    return this.cache.remember('titleContainer', () => {
	      return this.getLayout().querySelector('.landing-ui-field-color-presets-left');
	    });
	  }
	  getPopup() {
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
	  }
	  getPopupLayout() {
	    return this.cache.remember('popupLayout', () => {
	      const layouts = main_core.Tag.render(_t3$1 || (_t3$1 = _$5`<div class="landing-ui-field-color-presets-popup">
				<div class="landing-ui-field-color-presets-popup-title">
					${0}
				</div>
				<div class="landing-ui-field-color-presets-popup-inner"></div>
			</div>`), main_core.Loc.getMessage('LANDING_FIELD_COLOR-PRESETS_MORE_COLORS'));
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
	  }
	  getPresetLayout(presetId) {
	    return this.cache.remember(presetId + 'layout', () => {
	      return main_core.Tag.render(_t4$1 || (_t4$1 = _$5`
				<div class="landing-ui-field-color-presets-preset" data-id="${0}">
					${0}
				</div>
			`), presetId, this.presets[presetId].items.map(item => {
	        return main_core.Tag.render(_t5 || (_t5 = _$5`<div
								class="landing-ui-field-color-presets-preset-item"
								style="background: ${0}"
							></div>`), main_core.Type.isString(item) ? item : item.getStyleString());
	      }));
	    });
	  }
	  onPresetClick(event) {
	    this.getPopup().close();
	    this.setActiveItem(event.currentTarget.dataset.id);
	    this.emit('onChange', {
	      presetId: this.getActiveId()
	    });
	  }
	  onPresetChangeGlobal(event) {
	    if (event.getData().presetId !== this.activeId) {
	      this.setActiveItem(event.getData().presetId);
	      this.emit('onChange', event);
	    }
	  }
	  setActiveItem(presetId) {
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
	  }
	  unsetActive() {
	    for (const presetId in this.presets) {
	      main_core.Dom.removeClass(this.getPresetLayout(presetId), PresetCollection.ACTIVE_CLASS);
	    }
	  }
	}
	PresetCollection.globalActiveId = null;
	PresetCollection.ACTIVE_CLASS = 'active';

	let _$6 = t => t,
	  _t$6,
	  _t2$4;
	class Recent extends main_core_events.EventEmitter {
	  constructor() {
	    super();
	    this.cache = new main_core.Cache.MemoryCache();
	    this.setEventNamespace('BX.Landing.UI.Field.Color.Recent');
	  }
	  getLayout() {
	    return this.getLayoutContainer();
	  }
	  getLayoutContainer() {
	    return this.cache.remember('layout', () => {
	      return main_core.Tag.render(_t$6 || (_t$6 = _$6`<div class="landing-ui-field-color-recent"></div>`));
	    });
	  }
	  static initItems() {
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
	  }
	  buildItemsLayout(activeHex = null) {
	    if (activeHex) {
	      this.activeHex = activeHex;
	    }
	    main_core.Dom.clean(this.getLayoutContainer());
	    this.itemElements = [];
	    Recent.items.forEach(item => {
	      if (isHex(item)) {
	        const isActive = this.activeHex === item;
	        const itemLayout = main_core.Tag.render(_t2$4 || (_t2$4 = _$6`
					<div 
						class="landing-ui-field-color-recent-item${0}"
						style="background:${0}"
						data-value="${0}"
					></div>
				`), isActive ? ' active' : '', item, item);
	        this.itemElements.push(itemLayout);
	        main_core.Event.bind(itemLayout, 'click', () => this.onItemClick(event, itemLayout));
	        main_core.Dom.append(itemLayout, this.getLayoutContainer());
	      }
	    });
	    return this;
	  }
	  onItemClick(event, clickedElement) {
	    this.itemElements.forEach(el => BX.Dom.removeClass(el, 'active'));
	    BX.Dom.addClass(clickedElement, 'active');
	    this.activeHex = clickedElement.dataset.value;
	    this.emit('onChange', {
	      hex: event.currentTarget.dataset.value
	    });
	  }
	  addItem(hex) {
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
	  }
	  saveItems() {
	    if (Recent.items.length > 0) {
	      BX.userOptions.save('landing', Recent.USER_OPTION_NAME, 'items', Recent.items);
	    }
	    return this;
	  }
	}
	Recent.USER_OPTION_NAME = 'color_field_recent_colors';
	Recent.MAX_ITEMS = 24;
	Recent.items = [];
	Recent.itemsLoaded = false;

	let _$7 = t => t,
	  _t$7,
	  _t2$5,
	  _t3$2,
	  _t4$2,
	  _t5$1,
	  _t6,
	  _t7,
	  _t8;
	class Favourite extends main_core_events.EventEmitter {
	  constructor() {
	    super();
	    this.setEventNamespace('BX.Landing.UI.Field.Color.Favourite');
	    this.cache = new main_core.Cache.MemoryCache();
	    this.itemsContainer = null;
	    this.isEditMode = false;
	    this.activeHex = null;
	    this.itemElements = [];
	    this.buttonChange = null;
	    this.buttonSave = null;
	  }
	  getLayout() {
	    return this.getLayoutContainer();
	  }
	  getLayoutContainer() {
	    this.buttonChange = main_core.Tag.render(_t$7 || (_t$7 = _$7`
			<div class="landing-ui-field-color-favourite-head-button-change">
				${0}
			</div>
		`), main_core.Loc.getMessage('LANDING_FIELD_COLOR_FAVOURITES_BUTTON_CHANGE'));
	    this.buttonSave = main_core.Tag.render(_t2$5 || (_t2$5 = _$7`
			<div class="landing-ui-field-color-favourite-head-button-save" hidden>
				${0}
			</div>
		`), main_core.Loc.getMessage('LANDING_FIELD_COLOR_FAVOURITES_BUTTON_SAVE'));
	    main_core.Event.bind(this.buttonChange, 'click', () => this.onChangeButtonClick());
	    main_core.Event.bind(this.buttonSave, 'click', () => this.onSaveButtonClick());
	    return this.cache.remember('layout', () => {
	      this.itemsContainer = main_core.Tag.render(_t3$2 || (_t3$2 = _$7`<div class="landing-ui-field-color-favourite-colors view-mode"></div>`));
	      main_core.Dom.append(this.getItemsLayout(), this.itemsContainer);
	      return main_core.Tag.render(_t4$2 || (_t4$2 = _$7`
				<div>
					<div class="landing-ui-field-color-favourite-head">
						<div class="landing-ui-field-color-favourite-head-title">
							${0}
						</div>
						<div class="landing-ui-field-color-favourite-head-buttons">
							${0}
							${0}
						</div>
					</div>
					${0}
				</div>
			`), main_core.Loc.getMessage('LANDING_FIELD_COLOR_FAVOURITES_TITLE'), this.buttonChange, this.buttonSave, this.itemsContainer);
	    });
	  }
	  static initItems() {
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
	  }
	  getItemsLayout(activeHex = null) {
	    const itemLayoutButtonAdd = main_core.Tag.render(_t5$1 || (_t5$1 = _$7`
			<div class="landing-ui-field-color-favourite-item-container">
				<div class="landing-ui-field-color-favourite-item-add"></div>
			</div>
		`));
	    main_core.Event.bind(itemLayoutButtonAdd, 'click', () => this.onAddButtonClick());
	    if (activeHex) {
	      this.setActiveHex(activeHex);
	    }
	    this.itemElements = [];
	    const itemsContainer = main_core.Tag.render(_t6 || (_t6 = _$7`<div class="landing-ui-field-color-favourite-items-container"></div>`));
	    main_core.Dom.append(itemLayoutButtonAdd, itemsContainer);
	    Favourite.items.forEach(item => {
	      if (isHex(item)) {
	        const isActive = this.activeHex === item;
	        const removeButton = main_core.Tag.render(_t7 || (_t7 = _$7`
					<div class="landing-ui-field-color-favourite-item-remove-button"${0}></div>
				`), this.isEditMode ? '' : ' hidden');
	        const itemLayout = main_core.Tag.render(_t8 || (_t8 = _$7`
					<div class="landing-ui-field-color-favourite-item-container ${0}">
						<div 
							class="landing-ui-field-color-favourite-item"
							style="background:${0}"
							data-value="${0}"
						></div>
						${0}
					</div>
				`), isActive ? ' active' : '', item, item, removeButton);
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
	  }
	  buildItemsLayout(activeHex = null) {
	    if (activeHex) {
	      this.setActiveHex(activeHex);
	    }
	    if (this.itemsContainer) {
	      main_core.Dom.clean(this.itemsContainer);
	      main_core.Dom.append(this.getItemsLayout(), this.itemsContainer);
	    }
	  }
	  onItemClick(event, clickedElement) {
	    this.itemElements.forEach(el => BX.Dom.removeClass(el, 'active'));
	    BX.Dom.addClass(clickedElement, 'active');
	    this.setActiveHex(clickedElement.dataset.value);
	    this.emit('onSelectColor', {
	      hex: event.currentTarget.dataset.value
	    });
	  }
	  onAddButtonClick() {
	    if (this.activeHex !== null) {
	      this.addItem(this.activeHex);
	    }
	    this.emit('onAddColor', {
	      hex: this.activeHex
	    });
	  }
	  onRemoveButtonClick(event, hex) {
	    event.stopPropagation();
	    this.removeItem(hex);
	    this.emit('onRemoveColor', {
	      hex
	    });
	  }
	  onChangeButtonClick() {
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
	  }
	  onSaveButtonClick() {
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
	  }
	  addItem(hex) {
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
	  }
	  removeItem(hex) {
	    if (isHex(hex)) {
	      const index = Favourite.items.indexOf(hex);
	      if (index !== -1) {
	        Favourite.items.splice(index, 1);
	      }
	      this.buildItemsLayout();
	      this.saveItems();
	    }
	    return this;
	  }
	  saveItems() {
	    if (Favourite.items.length > 0) {
	      BX.userOptions.save('landing', Favourite.USER_OPTION_NAME, 'items', Favourite.items);
	    }
	    return this;
	  }
	  setActiveHex(hex) {
	    this.activeHex = hex;
	  }
	}
	Favourite.USER_OPTION_NAME = 'color_field_favourite_colors';
	Favourite.MAX_ITEMS = 80;
	Favourite.items = [];
	Favourite.itemsLoaded = false;
	Favourite.MODE_CLASSES = {
	  VIEW: 'view-mode',
	  EDIT: 'edit-mode'
	};

	let _$8 = t => t,
	  _t$8,
	  _t2$6,
	  _t3$3,
	  _t4$3,
	  _t5$2,
	  _t6$1,
	  _t7$1,
	  _t8$1,
	  _t9;
	class ColorPopup extends BaseControl {
	  constructor(options) {
	    super();

	    //todo: check for inline twice call

	    this.options = options;
	    this.hexPreview = options.hexPreview;
	    this.isHexPreviewMode = options.hexPreviewMode;
	    this.isNeedCalcPopupOffset = options.isNeedCalcPopupOffset;
	    this.isNeedResetPopupWhenOpen = options.isNeedResetPopupWhenOpen;
	    this.popupId = `colorpopup_${main_core.Text.getRandom()}`;
	    this.popupTargetContainer = options.contentRoot;
	    this.activeTab = ColorPopup.TABS.RECENT;
	    if (this.hexPreview) {
	      this.bindElement = this.hexPreview.getLayout();
	      this.hexPreview.subscribe('onValidInput', this.onHexPreviewValidInput.bind(this));
	    }
	    if (this.options.bindElement) {
	      this.bindElement = this.options.bindElement;
	    }
	    if (this.options.bindElement) {
	      this.targetContainer = this.options.targetContainer;
	    }
	    this.tabButtons = {};
	    this.tabContents = {};
	    this.init();
	    this.initAnalytics(options.analytics);
	  }
	  init() {
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
	  }
	  initAnalytics(options) {
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
	  }
	  getPopup() {
	    let offsetLeft = 0;
	    let offsetTop = 3;
	    const popupWidth = 287;
	    const editorPanelCurrentElement = BX.Landing.UI.Panel.EditorPanel.getInstance().currentElement;
	    if (editorPanelCurrentElement !== null && editorPanelCurrentElement.ownerDocument !== BX.Landing.PageObject.getRootWindow().document && !this.hexPreview) {
	      offsetTop -= 66;
	    }
	    if (this.bindElement && this.isNeedCalcPopupOffset !== false) {
	      const layoutClientRect = this.bindElement.getBoundingClientRect();
	      const panelWidth = 320;
	      const panelPaddingRight = 12;
	      offsetLeft = panelWidth - popupWidth - panelPaddingRight - layoutClientRect.x;
	    }
	    return this.cache.remember('popup', () => {
	      var _this$popupTargetCont;
	      return main_popup.PopupManager.create({
	        id: this.popupId,
	        className: 'landing-ui-field-color-popup',
	        autoHide: true,
	        autoHideHandler: event => {
	          const target = event.target;
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
	        contentPadding: 16,
	        width: popupWidth,
	        offsetTop,
	        offsetLeft,
	        content: this.getPopupContent(),
	        closeByEsc: true,
	        targetContainer: (_this$popupTargetCont = this.popupTargetContainer) != null ? _this$popupTargetCont : null,
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
	  }
	  getPopupContent() {
	    var _this$colorPickerPopu;
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
	    const tabButtonsRow = main_core.Tag.render(_t$8 || (_t$8 = _$8`
			<div class="landing-ui-field-color-popup-tabs"></div>
		`));
	    tabNames.forEach(tab => {
	      const btn = main_core.Tag.render(_t2$6 || (_t2$6 = _$8`
				<button 
					class="landing-ui-field-color-popup-tab-btn"
					data-tab="${0}"
					type="button"
				>${0}</button>
			`), tab.key, tab.label);
	      BX.Dom.append(btn, tabButtonsRow);
	      this.tabButtons[tab.key] = btn;
	      main_core.Event.bind(btn, 'click', () => this.setActiveTab(tab.key, true));
	    });
	    const recentTab = main_core.Tag.render(_t3$3 || (_t3$3 = _$8`
			<div class="landing-ui-field-color-popup-container-recent">
				${0}
			</div>
		`), this.recent.getLayout());
	    const spectrumTab = main_core.Tag.render(_t4$3 || (_t4$3 = _$8`
			<div class="landing-ui-field-color-popup-container-spectrum" hidden>
				${0}
			</div>
		`), this.spectrum.getLayout());
	    const presetsTab = main_core.Tag.render(_t5$2 || (_t5$2 = _$8`
			<div class="landing-ui-field-color-popup-container-presets" hidden>
				${0}
			</div>
		`), this.getPresetsLayout());
	    this.tabContents = {
	      recent: recentTab,
	      spectrum: spectrumTab,
	      preset: presetsTab
	    };
	    const favouriteColors = main_core.Tag.render(_t6$1 || (_t6$1 = _$8`
			<div class="landing-ui-field-color-popup-favourite-colors">
				${0}
			</div>
		`), this.favourite.getLayout());
	    if (!this.hexPreview) {
	      this.colorPickerPopup = this.getColorPickerPopupLayout();
	      main_core.Event.bind(this.colorPickerPopup, 'input', this.onColorPopupInput.bind(this));
	    }
	    const content = main_core.Tag.render(_t7$1 || (_t7$1 = _$8`
			<div class="landing-ui-field-color-popup-container">
				${0}
				${0}
				${0}
				${0}
				${0}
				${0}
			</div>
		`), (_this$colorPickerPopu = this.colorPickerPopup) != null ? _this$colorPickerPopu : null, tabButtonsRow, recentTab, spectrumTab, presetsTab, favouriteColors);
	    main_core.Event.bind(content, 'click', event => {
	      event.preventDefault();
	      event.stopPropagation();
	    });
	    this.setActiveTab(this.activeTab);
	    return content;
	  }
	  onPopupOpenClick(event, bindElement = null) {
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
	  }
	  resetPopupValue() {
	    this.resetColorPickerPopupValue();
	    this.unsetActivePresets();
	    this.recent.buildItemsLayout(ColorPopup.HEX_DEFAULT_TEXT);
	    this.favourite.buildItemsLayout(ColorPopup.HEX_DEFAULT_TEXT);
	    this.spectrum.hidePicker();
	  }
	  onChangeColor(color) {
	    this.emit('onColorPopupChange', color);
	    if (!this.hexPreview) {
	      const hex = main_core.Type.isString(color) && isHex(color) ? color : color && main_core.Type.isFunction(color.getHex) ? color.getHex() : null;
	      this.updateColorPickerPopup(hex);
	      this.emit('onHexColorPopupChange', hex);
	    }
	  }
	  setValue(value) {
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
	  }
	  setHexValue(hexValue) {
	    this.setValue(new ColorValue(hexValue));
	  }
	  getValue() {
	    return this.spectrum.getValue();
	  }
	  getPresetsLayout() {
	    return main_core.Tag.render(_t8$1 || (_t8$1 = _$8`
			<div class="landing-ui-field-color-presets-list">
				${0}
			</div>
		`), this.presets.map(preset => preset.getLayout()));
	  }
	  getColorPickerPopupLayout() {
	    this.colorPickerPopupId = `colorpicket_${main_core.Text.getRandom()}`;
	    let value = ColorPopup.HEX_DEFAULT_TEXT;
	    let bgValue = '#eeeeee';
	    if (this.currentHexValue) {
	      value = this.currentHexValue;
	      bgValue = this.currentHexValue;
	    }
	    return main_core.Tag.render(_t9 || (_t9 = _$8`
			<div class="landing-ui-field-color-popup-picker">
				<div class="landing-ui-field-color-popup-picker-preview" style="background-color: ${0};"></div>
				<input id="${0}" type="text" value="${0}" class="landing-ui-field-color-popup-picker-input">
			</div>
		`), bgValue, this.colorPickerPopupId, value);
	  }
	  updateColorPickerPopup(hex) {
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
	  }
	  resetColorPickerPopupValue() {
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
	  }
	  onColorPopupInput() {
	    const input = this.colorPickerPopup.querySelector('.landing-ui-field-color-popup-picker-input');
	    if (this.colorPopupInputTimeout) {
	      clearTimeout(this.colorPopupInputTimeout);
	    }
	    this.colorPopupInputTimeout = setTimeout(() => {
	      let value = input.value.replaceAll(/[^\da-f]/gi, '');
	      value = value.slice(0, 6);
	      const hex = `#${value.toLowerCase()}`;
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
	        input.focus();
	      }
	    }, 333);
	  }
	  setActiveTab(tabKey, isUserClick = false) {
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
	  }
	  onHexChange(event) {
	    this.unsetActivePresets();
	    const color = event.getData().color;
	    if (color) {
	      this.recent.addItem(color.getHex());
	    }
	    this.setValue(color);
	    this.onChange(event);
	  }
	  onSpectrumChange(event) {
	    const color = event.getData().color;
	    this.unsetActivePresets();
	    this.hex.unFocus();
	    this.setValue(color);
	    this.onChangeColor(color);
	  }
	  onSpectrumDragStart(event) {
	    landing_pageobject.PageObject.getRootWindow().document.activeElement.blur();
	  }
	  onSpectrumDragEnd(event) {
	    this.sendAnalytics(ColorPopup.ANALYTICS.EVENTS.SELECT_COLOR, {
	      type: ColorPopup.ANALYTICS.TYPE_COLORS.SPECTRUM
	    });
	    const color = event.getData().color;
	    this.recent.addItem(color.getHex());
	  }
	  onPresetChange(event) {
	    this.sendAnalytics(ColorPopup.ANALYTICS.EVENTS.SELECT_COLOR, {
	      type: ColorPopup.ANALYTICS.TYPE_COLORS.PRESET
	    });
	    const presetId = event.target.id;
	    this.unsetActivePresets(presetId);
	    const color = event.getData().color;
	    this.recent.addItem(color.getHex());
	    this.setValue(color);
	    this.onChangeColor(color);
	  }
	  onRecentChange(event) {
	    this.sendAnalytics(ColorPopup.ANALYTICS.EVENTS.SELECT_COLOR, {
	      type: ColorPopup.ANALYTICS.TYPE_COLORS.RECENT
	    });
	    this.unsetActivePresets();
	    const color = new ColorValue(event.getData().hex);
	    this.setValue(color);
	    this.onChangeColor(color);
	  }
	  unsetActivePresets(presetId = null) {
	    this.presets.forEach(preset => {
	      if (presetId !== preset.id) {
	        preset.unsetActive();
	      }
	    });
	  }
	  onFavouriteSelect(event) {
	    this.sendAnalytics(ColorPopup.ANALYTICS.EVENTS.SELECT_COLOR, {
	      type: ColorPopup.ANALYTICS.TYPE_COLORS.MY
	    });
	    this.unsetActivePresets();
	    const favouriteColor = new ColorValue(event.getData().hex);
	    const color = event.getData().hex;
	    this.recent.addItem(color);
	    this.setValue(favouriteColor);
	    this.onChangeColor(favouriteColor);
	  }
	  onAddFavouriteColor(event) {
	    this.sendAnalytics(ColorPopup.ANALYTICS.EVENTS.ADD_MY_COLOR);
	  }
	  onHexPreviewValidInput(event) {
	    const color = event.getData().value;
	    if (color) {
	      this.recent.addItem(`#${color}`);
	      this.recent.buildItemsLayout();
	      this.sendAnalytics(ColorPopup.ANALYTICS.EVENTS.SELECT_COLOR, {
	        type: ColorPopup.ANALYTICS.TYPE_COLORS.HEX
	      });
	    }
	  }
	  onRemoveFavouriteColor(event) {}
	  onEditFavouriteColors(event) {}
	  onSaveFavouriteColors(event) {}
	  getAnalyticsCategory() {
	    return this.analyticsCategory;
	  }
	  getAnalyticsCSubSection() {
	    return this.analyticsCSubSection;
	  }
	  getAnalyticsCElement() {
	    var _this$analyticsCEleme;
	    return (_this$analyticsCEleme = this.analyticsCElement) != null ? _this$analyticsCEleme : null;
	  }
	  getAnalyticsP1() {
	    var _this$analyticsP;
	    return (_this$analyticsP = this.analyticsP1) != null ? _this$analyticsP : null;
	  }
	  sendAnalytics(event, params = {}) {
	    const analyticsData = {
	      event,
	      tool: BX.Landing.Main.getAnalyticsCategoryByType(),
	      category: (params == null ? void 0 : params.category) || this.getAnalyticsCategory(),
	      c_sub_section: (params == null ? void 0 : params.c_sub_section) || this.getAnalyticsCSubSection(),
	      p1: (params == null ? void 0 : params.p1) || this.getAnalyticsP1()
	    };
	    if (params && params.type) {
	      analyticsData.type = params.type;
	    }
	    const cElement = this.getAnalyticsCElement();
	    if (cElement !== null) {
	      analyticsData.c_element = cElement;
	    }
	    BX.UI.Analytics.sendData(analyticsData);
	  }
	}
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

	let _$9 = t => t,
	  _t$9;
	class BaseProcessor extends main_core_events.EventEmitter {
	  constructor(options) {
	    super();
	    this.cache = new main_core.Cache.MemoryCache();
	    this.property = 'color';
	    this.options = options;
	    this.pseudoClass = null;
	    this.setEventNamespace('BX.Landing.UI.Field.Processor.BaseProcessor');
	  }
	  getProperty() {
	    return main_core.Type.isArray(this.property) ? this.property : [this.property];
	  }
	  getVariableName() {
	    return main_core.Type.isArray(this.variableName) ? this.variableName : [this.variableName];
	  }
	  isNullValue(value) {
	    return main_core.Type.isNull(value);
	  }
	  getNullValue() {
	    return new ColorValue();
	  }
	  getPseudoClass() {
	    return this.pseudoClass;
	  }
	  getLayout() {
	    return this.cache.remember('layout', () => {
	      return this.buildLayout();
	    });
	  }
	  buildLayout() {
	    return main_core.Tag.render(_t$9 || (_t$9 = _$9`<div>Base processor</div>`));
	  }
	  getClassName() {
	    return [this.className];
	  }
	  getValue() {}
	  getStyle() {
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
	   */
	  setProcessorValue(value) {
	    // Just get last css variable
	    const processorProperty = this.getVariableName()[this.getVariableName().length - 1];
	    this.cache.delete('value');
	    this.setValue(value[processorProperty]);
	  }

	  /**
	   * Set old-type value by computedStyle
	   * @param value {string: string} | null
	   */
	  setDefaultValue(value) {
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
	  }
	  setValue(value) {}
	  unsetActive() {}
	  onChange() {
	    this.cache.delete('value');
	    this.emit('onChange');
	  }
	  defineActiveControl(items, currentNode) {}
	  setActiveControl(controlName) {}
	  prepareProcessorValue(processorValue, defaultValue, data) {
	    return processorValue;
	  }
	}

	let _$a = t => t,
	  _t$a;
	class Colorpicker extends BaseControl {
	  constructor(options) {
	    super();
	    this.options = options;
	    this.setEventNamespace('BX.Landing.UI.Field.Color.Colorpicker');
	    this.popupId = `colorpicker_popup_${main_core.Text.getRandom()}`;
	    this.popupTargetContainer = options.contentRoot;
	    this.isHexPreviewMode = options.hexPreviewMode;
	    this.hexPreview = new Hex();
	    if (options.hexPreviewMode === true) {
	      this.hexPreview.setPreviewMode(true);
	    }
	    this.options.hexPreview = this.hexPreview;

	    // popup
	    this.colorPopup = new ColorPopup(this.options);
	    this.colorPopup.subscribe('onColorPopupChange', this.onColorPopupChange.bind(this));
	    this.hex = new Hex();
	    this.spectrum = new Spectrum(options);
	    this.presetCollection = new PresetCollection(options);
	    this.presetCollection.addDefaultPresets();
	    this.presets = this.presetCollection.getAllPresets();

	    // end popup

	    this.initLoader();
	    main_core.Event.bind(this.hexPreview.getLayout(), 'click', event => {
	      if (!this.colorPopup.getPopup().isShown()) {
	        BX.Dom.style(this.hexPreview.getButton(), 'opacity', '.5');
	        this.loader.show();
	      }
	      this.colorPopup.onPopupOpenClick(event);
	    });
	    this.colorPopup.subscribe('onPopupShow', e => {
	      this.loader.hide();
	      BX.Dom.style(this.hexPreview.getButton(), 'opacity', '1');
	    });
	    this.hexPreview.subscribe('onValidInput', this.onValidInput.bind(this));
	    this.hexPreview.subscribe('onChange', this.onHexChange.bind(this));
	    this.tabButtons = {};
	    this.tabContents = {};
	  }
	  initLoader() {
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
	  }
	  buildLayout() {
	    return main_core.Tag.render(_t$a || (_t$a = _$a`
			<div class="landing-ui-field-color-colorpicker">
				${0}
			</div>
		`), this.hexPreview.getLayout());
	  }
	  getHexPreviewObject() {
	    return this.hexPreview;
	  }
	  getValue() {
	    return this.cache.remember('value', () => {
	      return this.spectrum.getValue();
	    });
	  }
	  onColorPopupChange(event) {
	    const color = event.getData();
	    if (color) {
	      this.setValue(color);
	    }
	    this.onChange(new main_core_events.BaseEvent({
	      data: {
	        color
	      }
	    }));
	  }
	  onHexChange(event) {
	    const color = event.getData().color;
	    this.setValue(color);
	    this.onChange(event);
	  }
	  onValidInput(event) {
	    const color = `#${event.getData().value}`;
	    if (color) {
	      this.emit('onValidInput', {
	        color
	      });
	    }
	  }
	  setValue(value) {
	    if (this.isNeedSetValue(value)) {
	      super.setValue(value);
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
	  }
	  setActivity(value) {
	    if (value !== null) {
	      if (this.spectrum.isActive()) {
	        this.hex.unsetActive();
	      } else {
	        this.hex.setActive();
	      }
	      this.hexPreview.setActive();
	    }
	  }
	  unsetActive() {
	    this.hex.unsetActive();
	    this.hexPreview.unsetActive();
	  }
	  isActive() {
	    return this.hex.isActive() || this.hexPreview.isActive();
	  }
	}
	Colorpicker.TABS = {
	  RECENT: 'recent',
	  SPECTRUM: 'spectrum',
	  PRESET: 'preset'
	};

	let _$b = t => t,
	  _t$b,
	  _t2$7;
	class ColorSet extends BaseControl {
	  constructor(options) {
	    super();
	    this.options = options;
	    this.setEventNamespace('BX.Landing.UI.Field.Color.ColorSet');
	    this.colorpicker = new Colorpicker(options);
	    this.colorpicker.subscribe('onChange', event => {
	      this.preset.unsetActive();
	      const color = event.getData().color;
	      if (this.preset.isPresetValue(color)) {
	        this.preset.setActiveValue(color);
	        this.colorpicker.unsetActive();
	      }
	      this.onChange(event);
	    });
	    this.presets = new PresetCollection(options);
	    this.presets.subscribe('onChange', event => {
	      this.setPreset(this.presets.getPresetById(event.getData().presetId));
	    });
	    this.presets.addDefaultPresets();
	    const preset = this.presets.getActivePreset();
	    if (preset) {
	      this.setPreset(preset);
	    }
	  }
	  buildLayout() {
	    return main_core.Tag.render(_t$b || (_t$b = _$b`
			<div class="landing-ui-field-color-colorset">
				<div class="landing-ui-field-color-colorset-bottom">
					${0}
				</div>
			</div>
		`), this.colorpicker.getLayout());
	  }
	  getTitleLayout() {
	    return this.cache.remember('titleLayout', () => {
	      return this.getLayout().querySelector('.landing-ui-field-color-colorset-title');
	    });
	  }
	  getPresetContainer() {
	    return this.cache.remember('presetContainer', () => {
	      return main_core.Tag.render(_t2$7 || (_t2$7 = _$b`<div class="landing-ui-field-color-colorset-preset-container"></div>`));
	    });
	  }
	  setPreset(preset) {
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
	  }
	  getPreset() {
	    return this.preset;
	  }
	  getPresetsCollection() {
	    return this.presets;
	  }
	  onPresetItemChange(event) {
	    this.colorpicker.setValue(event.getData().color);
	    this.colorpicker.unsetActive();
	    this.onChange(event);
	  }
	  onChange(event) {
	    this.cache.set('value', event.getData().color);
	    this.emit('onChange', event);
	  }
	  getValue() {
	    return this.cache.remember('value', () => {
	      return this.colorpicker.getValue();
	    });
	  }
	  setValue(value) {
	    if (this.isNeedSetValue(value)) {
	      super.setValue(value);
	      this.colorpicker.setValue(value);
	      const activePreset = this.presets.getGlobalActiveId() ? this.presets.getPresetById(this.presets.getGlobalActiveId()) : this.presets.getPresetByItemValue(value);
	      if (activePreset !== null) {
	        this.setPreset(activePreset);
	        this.presets.setActiveItem(activePreset.getId());
	      }
	    }
	  }
	  unsetActive() {
	    this.preset.unsetActive();
	    this.colorpicker.unsetActive();
	  }
	  isActive() {
	    return this.preset.isActive() || this.colorpicker.isActive();
	  }
	  setColorFromContent() {
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
	  }
	}

	let _$c = t => t,
	  _t$c,
	  _t2$8,
	  _t3$4;
	class Opacity extends BaseControl {
	  constructor(options) {
	    super();
	    this.setEventNamespace('BX.Landing.UI.Field.Color.Opacity');
	    this.defaultOpacity = main_core.Type.isObject(options) && Reflect.has(options, 'defaultOpacity') ? options.defaultOpacity : Opacity.DEFAULT_OPACITY;
	    this.document = landing_pageobject.PageObject.getRootWindow().document;
	    this.onPickerDragStart = this.onPickerDragStart.bind(this);
	    this.onPickerDragMove = this.onPickerDragMove.bind(this);
	    this.onPickerDragEnd = this.onPickerDragEnd.bind(this);
	    this.layout = this.getLayout();
	    this.pickerControl = this.layout.querySelector('.landing-ui-field-color-opacity');
	    this.rangeControl = this.layout.querySelector('.landing-ui-field-color-opacity-range-output');
	    this.arrowsUp = this.rangeControl.querySelector('.landing-ui-field-color-opacity-range-output-arrows-up');
	    this.arrowsDown = this.rangeControl.querySelector('.landing-ui-field-color-opacity-range-output-arrows-down');
	    this.rangeInput = this.rangeControl.querySelector('.landing-ui-field-color-opacity-range-output-input');
	    main_core.Event.bind(this.arrowsUp, 'click', this.onArrowClick.bind(this, 'up'));
	    main_core.Event.bind(this.arrowsDown, 'click', this.onArrowClick.bind(this, 'down'));
	    main_core.Event.bind(this.pickerControl, 'mousedown', this.onPickerDragStart);
	  }
	  buildLayout() {
	    const defaultOpacityValue = this.defaultOpacity * 100;
	    const layout = main_core.Tag.render(_t$c || (_t$c = _$c`
			<div class="landing-ui-field-color-opacity-container">
				<div class="landing-ui-field-color-opacity">
					${0}
					${0}
				</div>
				<div class="landing-ui-field-color-opacity-range-output">
					<div 
						class="landing-ui-field-color-opacity-range-output-input"
						title="${0}">
						${0}
					</div>
					<div class="landing-ui-field-color-opacity-range-output-arrows">
						<div class="landing-ui-field-color-opacity-range-output-arrows-up"></div>
						<div class="landing-ui-field-color-opacity-range-output-arrows-down"></div>
					</div>
				</div>
			</div>
		`), this.getPicker(), this.getColorLayout(), defaultOpacityValue, defaultOpacityValue);
	    this.setPickerPosByOpacity(this.defaultOpacity);
	    return layout;
	  }
	  onPickerDragStart(event) {
	    if (event.ctrlKey || event.metaKey || event.button) {
	      return;
	    }
	    main_core.Event.bind(this.document, 'mousemove', this.onPickerDragMove);
	    main_core.Event.bind(this.document, 'mouseup', this.onPickerDragEnd);
	    main_core.Dom.addClass(this.document.body, 'landing-ui-field-color-draggable');
	    this.onPickerDragMove(event);
	  }
	  onPickerDragMove(event) {
	    if (event.target === this.getPicker()) {
	      return;
	    }
	    this.setPickerPos(event.pageX);
	    this.onChange();
	    this.onRangeControlChange();
	  }
	  onPickerDragEnd() {
	    main_core.Event.unbind(this.document, 'mousemove', this.onPickerDragMove);
	    main_core.Event.unbind(this.document, 'mouseup', this.onPickerDragEnd);
	    main_core.Dom.removeClass(this.document.body, 'landing-ui-field-color-draggable');
	  }

	  /**
	   * Set picker by absolute page coords
	   * @param x
	   */
	  setPickerPos(x) {
	    const leftPos = Math.max(Math.min(x - this.getLayoutRect().left, this.getLayoutRect().width), 0);
	    main_core.Dom.style(this.getPicker(), {
	      left: `${leftPos}px`
	    });
	  }
	  setPickerPosByOpacity(opacity) {
	    opacity = Math.min(1, Math.max(0, opacity));
	    main_core.Dom.style(this.getPicker(), {
	      left: `${opacity * 100}%`
	    });
	  }
	  getLayoutRect() {
	    return this.cache.remember('layoutSize', () => {
	      const layoutRect = this.pickerControl.getBoundingClientRect();
	      return {
	        width: layoutRect.width,
	        left: layoutRect.left
	      };
	    });
	  }
	  getColorLayout() {
	    return this.cache.remember('colorLayout', () => {
	      return main_core.Tag.render(_t2$8 || (_t2$8 = _$c`
				<div class="landing-ui-field-color-opacity-color"></div>
			`));
	    });
	  }
	  getPicker() {
	    return this.cache.remember('picker', () => {
	      return main_core.Tag.render(_t3$4 || (_t3$4 = _$c`
				<div class="landing-ui-field-color-opacity-picker">
					<div class="landing-ui-field-color-opacity-picker-item">
						<div class="landing-ui-field-color-opacity-picker-item-circle"></div>
					</div>
				</div>`));
	    });
	  }
	  getDefaultValue() {
	    return this.cache.remember('default', () => {
	      return new ColorValue(Opacity.DEFAULT_COLOR).setOpacity(this.defaultOpacity);
	    });
	  }
	  getValue() {
	    return this.cache.remember('value', () => {
	      const pickerLeft = main_core.Text.toNumber(main_core.Dom.style(this.getPicker(), 'left'));
	      const layoutWidth = main_core.Text.toNumber(this.pickerControl.getBoundingClientRect().width);
	      return this.getDefaultValue().setOpacity(pickerLeft / layoutWidth);
	    });
	  }
	  setValue(value) {
	    const valueToSet = !main_core.Type.isNull(value) ? value : this.getDefaultValue();
	    super.setValue(valueToSet);
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
	  }
	  onRangeControlChange() {
	    const opacity = parseInt(this.getValue().getOpacity() * 100);
	    this.rangeInput.title = opacity;
	    this.rangeInput.innerHTML = opacity;
	  }
	  onArrowClick(arrowName) {
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
	      left: `${leftPos}px`
	    });
	    this.onChange();
	  }
	}
	Opacity.DEFAULT_COLOR = '#cccccc';
	Opacity.DEFAULT_OPACITY = 1;

	let _$d = t => t,
	  _t$d,
	  _t2$9,
	  _t3$5,
	  _t4$4,
	  _t5$3,
	  _t6$2;
	class Tabs extends main_core_events.EventEmitter {
	  constructor() {
	    super();
	    this.setEventNamespace('BX.Landing.UI.Field.Color.Tabs');
	    this.tabs = [];
	    this.cache = new main_core.Cache.MemoryCache();
	    this.multiple = true;
	    this.isBig = false;
	    this.onToggle = this.onToggle.bind(this);
	  }
	  setMultiple(multiple) {
	    this.multiple = multiple;
	    return this;
	  }
	  setBig(big) {
	    this.isBig = big;
	    this.multiple = false;
	    return this;
	  }
	  appendTab(id, title, items) {
	    const tab = new Tab({
	      id: id,
	      title: title,
	      items: main_core.Type.isArray(items) ? items : [items]
	    });
	    this.tabs.push(tab);
	    this.bindEvents(tab);
	    this.cache.delete('layout');
	    return this;
	  }
	  prependTab(id, title, items) {
	    const tab = new Tab({
	      id: id,
	      title: title,
	      items: main_core.Type.isArray(items) || [items]
	    });
	    this.tabs.unshift(tab);
	    this.bindEvents(tab);
	    this.cache.delete('layout');
	    return this;
	  }
	  bindEvents(tab) {
	    tab.subscribe('onToggle', this.onToggle);
	    tab.subscribe('onShow', this.onToggle);
	    tab.subscribe('onHide', this.onToggle);
	  }
	  onToggle(event) {
	    this.emit('onToggle', event);
	  }
	  showTab(id) {
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
	  }
	  getTabById(id) {
	    return this.tabs.find(tab => {
	      return tab.id === id;
	    });
	  }
	  getLayout() {
	    return this.cache.remember('layout', () => {
	      const additional = this.isBig ? ' landing-ui-field-color-tabs--big' : '';
	      const layout = main_core.Tag.render(_t$d || (_t$d = _$d`<div class="landing-ui-field-color-tabs${0}"></div>`), additional);
	      if (this.isBig) {
	        const head = main_core.Tag.render(_t2$9 || (_t2$9 = _$d`
					<div class="landing-ui-field-color-tabs-head landing-ui-field-color-tabs-head--big"></div>
				`));
	        const content = main_core.Tag.render(_t3$5 || (_t3$5 = _$d`
					<div class="landing-ui-field-color-tabs-content landing-ui-field-color-tabs-content--big"></div>
				`));
	        this.tabs.forEach(tab => {
	          main_core.Dom.append(tab.getTitle(), head);
	          main_core.Dom.append(tab.getLayout(), content);
	        });
	        main_core.Dom.append(head, layout);
	        main_core.Dom.append(content, layout);
	      } else {
	        this.tabs.forEach(tab => {
	          const tabLayout = main_core.Tag.render(_t4$4 || (_t4$4 = _$d`<div class="landing-ui-field-color-tabs-tab">
						${0}${0}
					</div>`), tab.getTitle(), tab.getLayout());
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
	      return layout;
	    });
	  }
	}
	class Tab extends main_core_events.EventEmitter {
	  constructor(options) {
	    super();
	    this.id = options.id;
	    this.title = options.title;
	    this.items = options.items;
	    this.cache = new main_core.Cache.MemoryCache();
	  }
	  getId() {
	    return this.id;
	  }
	  getTitle() {
	    return this.cache.remember('title', () => {
	      return main_core.Tag.render(_t5$3 || (_t5$3 = _$d`
				<span class="landing-ui-field-color-tabs-tab-toggler">
					<span class="landing-ui-field-color-tabs-tab-toggler-icon"></span>
					<span class="landing-ui-field-color-tabs-tab-toggler-name">${0}</span>
				</span>
			`), this.title);
	    });
	  }
	  getLayout() {
	    return this.cache.remember('layout', () => {
	      return main_core.Tag.render(_t6$2 || (_t6$2 = _$d`
				<div class="landing-ui-field-color-tabs-tab-content">
					${0}
				</div>
			`), this.items.map(item => item.getLayout()));
	    });
	  }
	  toggle() {
	    main_core.Dom.toggleClass(this.getLayout(), Tab.SHOW_CLASS);
	    main_core.Dom.toggleClass(this.getTitle(), Tab.SHOW_CLASS);
	    this.emit('onToggle', {
	      tab: this.title
	    });
	    return this;
	  }
	  show() {
	    main_core.Dom.addClass(this.getLayout(), Tab.SHOW_CLASS);
	    main_core.Dom.addClass(this.getTitle(), Tab.SHOW_CLASS);
	    this.emit('onShow', {
	      tab: this.title
	    });
	    return this;
	  }
	  hide() {
	    main_core.Dom.removeClass(this.getLayout(), Tab.SHOW_CLASS);
	    main_core.Dom.removeClass(this.getTitle(), Tab.SHOW_CLASS);
	    this.emit('onHide', {
	      tab: this.title
	    });
	    return this;
	  }
	}
	Tab.SHOW_CLASS = 'show';

	let _$e = t => t,
	  _t$e;
	class Zeroing extends main_core_events.EventEmitter {
	  constructor(options) {
	    super();
	    this.options = options;
	    this.cache = new main_core.Cache.MemoryCache();
	    this.setEventNamespace('BX.Landing.UI.Field.Color.Zeroing');
	    main_core.Event.bind(this.getLayout(), 'click', () => this.onClick());
	  }
	  getLayout() {
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
	      return main_core.Tag.render(_t$e || (_t$e = _$e`<div class="landing-ui-field-color-zeroing">
				<div class="landing-ui-field-color-zeroing-preview">
					<div class="landing-ui-field-color-zeroing-state"></div>
				</div>
				<span class="landing-ui-field-color-primary-text">
					${0}
				</span>
			</div>`), main_core.Loc.getMessage(textCode));
	    });
	  }
	  onClick() {
	    this.emit('onChange', {
	      color: null
	    });
	  }
	  setActive() {
	    main_core.Dom.addClass(this.getLayout(), Zeroing.ACTIVE_CLASS);
	  }
	  unsetActive() {
	    main_core.Dom.removeClass(this.getLayout(), Zeroing.ACTIVE_CLASS);
	  }
	  isActive() {
	    return main_core.Dom.hasClass(this.getLayout(), Zeroing.ACTIVE_CLASS);
	  }
	}
	Zeroing.ACTIVE_CLASS = 'active';

	let _$f = t => t,
	  _t$f;
	class Color extends BaseProcessor {
	  constructor(options) {
	    super(options);
	    this.setEventNamespace('BX.Landing.UI.Field.Processor.Color');
	    this.property = 'color';
	    this.variableName = '--color';
	    this.className = 'g-color';
	    this.colorSet = new ColorSet(options);
	    this.colorSet.subscribe('onChange', this.onColorSetChange.bind(this));
	    this.opacity = new Opacity();
	    this.opacity.subscribe('onChange', this.onOpacityChange.bind(this));
	    const zeroingOptions = {
	      styleNode: options.styleNode
	    };
	    this.zeroing = new Zeroing(zeroingOptions);
	    this.zeroing.subscribe('onChange', this.onZeroingChange.bind(this));
	    this.primary = new Primary(options);
	    this.primary.subscribe('onChange', this.onPrimaryChange.bind(this));
	    this.tabs = new Tabs().appendTab('Opacity', main_core.Loc.getMessage('LANDING_FIELD_COLOR-TAB_OPACITY'), this.opacity);
	  }
	  isNullValue(value) {
	    return value === null || value === 'none' || value === 'rgba(0, 0, 0, 0)';
	  }
	  getNullValue() {
	    return new ColorValue('rgba(0, 0, 0, 0)');
	  }
	  buildLayout() {
	    return main_core.Tag.render(_t$f || (_t$f = _$f`
			<div class="landing-ui-field-color-color">
				${0}
				${0}
				${0}
				${0}
			</div>
		`), this.colorSet.getLayout(), this.primary.getLayout(), this.zeroing.getLayout(), this.tabs.getLayout());
	  }
	  onColorSetChange(event) {
	    this.primary.unsetActive();
	    this.zeroing.unsetActive();
	    const color = event.getData().color;
	    if (color !== null) {
	      color.setOpacity(this.opacity.getValue().getOpacity());
	    }
	    this.opacity.setValue(color);
	    this.onChange();
	  }
	  onOpacityChange() {
	    this.onChange();
	  }
	  onPrimaryChange(event) {
	    this.colorSet.setValue(event.getData().color);
	    this.onColorSetChange(event);
	    this.colorSet.unsetActive();
	    this.zeroing.unsetActive();
	    this.primary.setActive();
	  }
	  onZeroingChange(event) {
	    this.colorSet.unsetActive();
	    this.primary.unsetActive();
	    this.zeroing.setActive();
	    this.setValue(event.getData().color);
	    // todo: need reload computed props and reinit
	    this.onChange(event);
	  }
	  unsetActive() {
	    this.colorSet.unsetActive();
	    this.primary.unsetActive();
	  }
	  setValue(value) {
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
	  }
	  getValue() {
	    return this.cache.remember('value', () => {
	      const value = this.primary.isActive() ? this.primary.getValue() : this.colorSet.getValue();
	      return value === null ? null : value.setOpacity(this.opacity.getValue().getOpacity());
	    });
	  }
	  setDefaultValue(value) {
	    this.zeroing.setActive();
	    if (!main_core.Type.isNull(value)) {
	      this.colorSet.colorpicker.hex.setActive();
	    }
	    super.setDefaultValue(value);
	  }
	  setActiveControl(controlName) {
	    if (controlName === 'primary') {
	      this.primary.setActive();
	    }
	    if (controlName === 'hex') {
	      this.colorSet.colorpicker.hexPreview.setActive();
	    }
	  }
	  defineActiveControl(items, styleNode) {
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
	  }
	}
	Color.PRIMARY_VAR = 'var(--primary)';

	class ColorHover extends Color {
	  constructor(options) {
	    super(options);
	    this.setEventNamespace('BX.Landing.UI.Field.Processor.ColorHover');
	    this.property = 'color';
	    this.variableName = '--color-hover';
	    this.className = 'g-color--hover';
	    this.pseudoClass = ':hover';
	  }
	}

	let _$g = t => t,
	  _t$g,
	  _t2$a,
	  _t3$6,
	  _t4$5,
	  _t5$4,
	  _t6$3,
	  _t7$2;
	class Gradient extends BaseControl {
	  constructor(options) {
	    super();
	    this.ROTATE_STEP = 45;
	    this.setEventNamespace('BX.Landing.UI.Field.Color.Gradient');
	    this.options = options;
	    this.options.hexPreviewMode = true;
	    this.popupId = `gradient_popup_${main_core.Text.getRandom()}`;
	    this.popupTargetContainer = options.contentRoot;
	    this.colorpickerFrom = new Colorpicker(this.options);
	    this.colorpickerFrom.subscribe('onChange', event => {
	      this.onColorChange(event.getData().color, null);
	    });
	    this.colorpickerTo = new Colorpicker(this.options);
	    this.colorpickerTo.subscribe('onChange', event => {
	      this.onColorChange(null, event.getData().color);
	    });
	    main_core.Event.bind(this.getPopupButton(), 'click', this.onPopupOpen.bind(this));
	    main_core.Event.bind(this.getRotateButton(), 'click', this.onRotate.bind(this));
	    main_core.Event.bind(this.getSwitchTypeButton(), 'click', this.onSwitchType.bind(this));
	    main_core.Event.bind(this.getSwapButton(), 'click', this.onSwap.bind(this));
	    this.preset = null;
	  }
	  onColorChange(fromValue, toValue) {
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
	  }
	  onPopupOpen() {
	    this.getPopup().toggle();
	  }
	  onRotate(event) {
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
	  }
	  onSwitchType(event) {
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
	  }
	  onSwap(event) {
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
	  }
	  static disableButton(button) {
	    main_core.Dom.addClass(button, Gradient.DISABLE_CLASS);
	  }
	  static enableButton(button) {
	    main_core.Dom.removeClass(button, Gradient.DISABLE_CLASS);
	  }
	  static isButtonEnable(button) {
	    return !main_core.Dom.hasClass(button, Gradient.DISABLE_CLASS);
	  }
	  correctColorpickerColors() {
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
	  }
	  getPopup() {
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
	  }
	  getPopupContent() {
	    return this.cache.remember('popupContainer', () => {
	      return main_core.Tag.render(_t$g || (_t$g = _$g`
				<div class="landing-ui-field-color-gradient-preset-popup-container">
					${0}
					${0}
				</div>
			`), this.getRotateButton(), this.getSwapButton());
	    });
	  }
	  buildLayout() {
	    if (this.preset) {
	      main_core.Dom.clean(this.getPresetContainer());
	      main_core.Dom.append(this.preset.getLayout(), this.getPresetContainer());
	    }
	    return main_core.Tag.render(_t2$a || (_t2$a = _$g`
			<div class="landing-ui-field-color-gradient">
				<div class="landing-ui-field-color-gradient-container-main">
					${0}
					<div class="landing-ui-field-color-gradient-container">
						<div class="landing-ui-field-color-gradient-from">${0}</div>
						${0}
						<div class="landing-ui-field-color-gradient-to">${0}</div>
					</div>
				</div>
				<div class="landing-ui-field-color-gradient-switch-type-container">
					${0}
				</div>
			</div>
		`), this.getPresetContainer(), this.colorpickerFrom.getLayout(), this.getPopupButton(), this.colorpickerTo.getLayout(), this.getSwitchTypeButton());
	  }
	  getContainerLayout() {
	    // todo: do better after change vyorstka
	    return this.getLayout().querySelector('.landing-ui-field-color-gradient-container');
	  }
	  getPresetContainer() {
	    return this.cache.remember('presetContainer', () => {
	      return main_core.Tag.render(_t3$6 || (_t3$6 = _$g`<div class="landing-ui-field-color-gradient-preset-container"></div>`));
	    });
	  }
	  getPopupButton() {
	    return this.cache.remember('popupButton', () => {
	      return main_core.Tag.render(_t4$5 || (_t4$5 = _$g`<span class="landing-ui-field-color-gradient-open-popup"></span>`));
	    });
	  }
	  getSwitchTypeButton() {
	    return this.cache.remember('switchTypeButton', () => {
	      return main_core.Tag.render(_t5$4 || (_t5$4 = _$g`
				<span
					class="landing-ui-field-color-gradient-switch-type"
					title="${0}"
				></span>
			`), main_core.Loc.getMessage('LANDING_FIELD_COLOR-GRADIENT_SWITCH_TYPE'));
	    });
	  }
	  getRotateButton() {
	    return this.cache.remember('rotateButton', () => {
	      return main_core.Tag.render(_t6$3 || (_t6$3 = _$g`
				<span
					class="landing-ui-field-color-gradient-rotate"
					title="${0}"
				></span>
			`), main_core.Loc.getMessage('LANDING_FIELD_COLOR-GRADIENT_ROTATE'));
	    });
	  }
	  getSwapButton() {
	    return this.cache.remember('swapButton', () => {
	      return main_core.Tag.render(_t7$2 || (_t7$2 = _$g`
				<span
					class="landing-ui-field-color-gradient-swap"
					title="${0}"
				></span>
			`), main_core.Loc.getMessage('LANDING_FIELD_COLOR-GRADIENT_SWAP'));
	    });
	  }
	  setPreset(preset) {
	    this.preset = preset;
	    this.preset.unsetActive();
	    this.preset.subscribe('onChange', event => {
	      this.setValue(event.getData().color);
	      this.unsetColorpickerActive();
	      this.onChange(event);
	    });
	    main_core.Dom.clean(this.getPresetContainer());
	    main_core.Dom.append(preset.getLayout(), this.getPresetContainer());
	  }
	  getPreset() {
	    return this.preset;
	  }
	  getValue() {
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
	  }
	  setValue(value) {
	    super.setValue(value);
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
	      main_core.Dom.style(this.getRotateButton(), 'transform', `rotate(${value.getAngle()}deg)`);
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
	  }
	  onChange(event) {
	    this.cache.delete('value');
	    this.emit('onChange', {
	      gradient: this.getValue()
	    });
	  }
	  setActive() {
	    const value = this.getValue();
	    if (this.preset.isPresetValue(value)) {
	      this.preset.setActiveValue(value);
	      this.unsetColorpickerActive();
	    } else {
	      this.preset.unsetActive();
	      this.setColorpickerActive();
	    }
	  }
	  unsetActive() {
	    this.preset.unsetActive();
	    this.unsetColorpickerActive();
	  }
	  setColorpickerActive() {
	    main_core.Dom.addClass(this.getContainerLayout(), Gradient.ACTIVE_CLASS);
	  }
	  unsetColorpickerActive() {
	    this.colorpickerFrom.unsetActive();
	    this.colorpickerTo.unsetActive();
	    main_core.Dom.removeClass(this.getContainerLayout(), Gradient.ACTIVE_CLASS);
	  }
	}
	Gradient.DISABLE_CLASS = 'disable';

	class BgColor extends Color {
	  constructor(options) {
	    super(options);
	    this.setEventNamespace('BX.Landing.UI.Field.Processor.BgColor');
	    this.property = ['background-image', 'background-color'];
	    this.variableName = '--bg';
	    this.className = 'g-bg';
	    this.activeControl = null;
	    this.gradient = new Gradient(options);
	    this.gradient.subscribe('onChange', this.onGradientChange.bind(this));
	    this.tabs.prependTab('Gradient', main_core.Loc.getMessage('LANDING_FIELD_COLOR-TAB_GRADIENT'), this.gradient);
	    this.setGradientPreset(this.colorSet.getPreset());
	    this.colorSet.subscribe('onPresetChange', event => {
	      this.setGradientPreset(event.getData().preset);
	    });
	    this.tabs.subscribe('onToggle', this.onTabsToggle.bind(this));
	  }
	  setGradientPreset(preset) {
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
	  }
	  onColorSetChange(event) {
	    this.activeControl = this.colorSet;
	    this.gradient.unsetActive();
	    super.onColorSetChange(event);
	  }
	  onGradientChange(event) {
	    this.activeControl = this.gradient;
	    this.colorSet.unsetActive();
	    const gradValue = event.getData().gradient;
	    if (gradValue !== null) {
	      this.opacity.setValue(gradValue.setOpacity(this.opacity.getValue().getOpacity()));
	    }
	    this.onChange();
	  }
	  onOverlayOpacityChange() {
	    this.onChange();
	  }
	  onTabsToggle() {
	    this.gradient.getPopup().close();
	  }
	  unsetActive() {
	    this.colorSet.unsetActive();
	    this.gradient.unsetActive();
	    this.primary.unsetActive();
	  }
	  setValue(value) {
	    this.colorSet.setValue(null);
	    this.gradient.setValue(null);
	    this.unsetActive();
	    this.activeControl = null;
	    if (main_core.Type.isNil(value)) ; else if (isRgbString(value) || isHex(value) || isHslString(value) || isCssVar(value)) {
	      super.setValue(value);
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
	  }
	  getValue() {
	    return this.cache.remember('value', () => {
	      if (this.activeControl === null) {
	        return null;
	      }
	      if (this.activeControl === this.gradient) {
	        const gradValue = this.gradient.getValue();
	        return gradValue === null ? gradValue : gradValue.setOpacity(this.opacity.getValue().getOpacity());
	      }
	      return super.getValue();
	    });
	  }
	}

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
	  return new RegExp(`^${matcherGradientString},${matcherBgString}`);
	}

	class BgImageValue {
	  constructor(value) {
	    // todo: add 2x, file ids
	    this.value = defaultBgImageValueOptions;
	    this.setValue(value);
	  }
	  getName() {
	    return `
			${this.value.url.replace(/[^\w\d]/g, '')}_${this.value.size}_${this.value.attachment}
		`;
	  }
	  setValue(value) {
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
	  }
	  parseBgString(string) {
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
	  }
	  setOpacity(opacity) {
	    // todo: what for image?

	    return this;
	  }
	  setUrl(value) {
	    this.setValue({
	      url: value
	    });
	    return this;
	  }
	  setUrl2x(value) {
	    this.setValue({
	      url2x: value
	    });
	    return this;
	  }
	  setFileId(value) {
	    this.setValue({
	      fileId: value
	    });
	    return this;
	  }
	  setFileId2x(value) {
	    this.setValue({
	      fileId2x: value
	    });
	    return this;
	  }
	  setSize(value) {
	    this.setValue({
	      size: value
	    });
	    return this;
	  }
	  setAttachment(value) {
	    this.setValue({
	      attachment: value
	    });
	    return this;
	  }
	  setOverlay(value) {
	    this.setValue({
	      overlay: value
	    });
	    return this;
	  }
	  getUrl() {
	    return this.value.url;
	  }
	  getUrl2x() {
	    return this.value.url2x;
	  }
	  getFileId() {
	    return this.value.fileId;
	  }
	  getFileId2x() {
	    return this.value.fileId2x;
	  }
	  getSize() {
	    return this.value.size;
	  }
	  getAttachment(needBool = false) {
	    return needBool ? this.value.attachment === 'fixed' : this.value.attachment;
	  }
	  getOverlay() {
	    return this.value.overlay;
	  }
	  getOpacity() {
	    // todo: how image can have opacity?
	    return 1;
	  }
	  getStyleString() {
	    let style = '';
	    if (this.value.overlay !== null) {
	      style = `linear-gradient(${this.value.overlay.getStyleString()},${this.value.overlay.getStyleString()})`;
	    }

	    // todo: what if url is null
	    const {
	      url,
	      url2x,
	      size,
	      attachment
	    } = this.value;
	    const endString = `center / ${size} ${attachment}`;
	    if (url !== null) {
	      style = style.length ? style + ',' : '';
	      if (url2x !== null) {
	        style += `-webkit-image-set(url('${url}') 1x, url('${url2x}') 2x) ${endString},`;
	        style += `image-set(url('${url}') 1x, url('${url2x}') 2x) ${endString},`;
	      }
	      style += `url('${url}') ${endString}`;
	    }
	    return style;
	  }
	  getStyleStringForOpacity() {
	    // todo: how image can have opacity?
	    return '';
	  }
	  static getSizeItemsForButtons() {
	    return [{
	      name: main_core.Loc.getMessage('LANDING_FIELD_COLOR-BG_COVER'),
	      value: 'cover'
	    }, {
	      name: main_core.Loc.getMessage('LANDING_FIELD_COLOR-BG_MOSAIC'),
	      value: 'auto'
	    }];
	  }
	  static getAttachmentValueByBool(value) {
	    return value ? 'fixed' : 'scroll';
	  }
	}

	let _$h = t => t,
	  _t$h;
	class Image extends BaseControl {
	  // todo: move to type

	  constructor(options) {
	    super();
	    this.setEventNamespace('BX.Landing.UI.Field.Color.Image');
	    this.options = options;
	    this.imgField = new landing_ui_field_image.Image({
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
	        block: this.options.block.id
	      },
	      contentRoot: this.options.contentRoot
	    });
	    this.imgField.subscribe('change', this.onImageChange.bind(this));
	    this.sizeField = new BX.Landing.UI.Field.Dropdown({
	      id: 'landing_ui_color_image_size_' + main_core.Text.getRandom().toLowerCase(),
	      title: main_core.Loc.getMessage('LANDING_FIELD_COLOR-BG_SIZE_TITLE'),
	      className: 'landing-ui-field-color-image-size',
	      items: BgImageValue.getSizeItemsForButtons(),
	      onChange: this.onSizeChange.bind(this),
	      contentRoot: this.options.contentRoot
	    });
	    this.attachmentField = new BX.Landing.UI.Field.Checkbox({
	      id: 'landing_ui_color_image_attach_' + main_core.Text.getRandom().toLowerCase(),
	      className: 'landing-ui-field-color-image-attachment',
	      multiple: false,
	      compact: true,
	      items: [{
	        name: main_core.Loc.getMessage('LANDING_FIELD_COLOR-BG_FIXED'),
	        value: 'fixed'
	      }],
	      onChange: this.onAttachmentChange.bind(this),
	      value: [this.getAttachmentValue()]
	    });
	  }
	  buildLayout() {
	    return main_core.Tag.render(_t$h || (_t$h = _$h`
			<div class="landing-ui-field-color-image">
				${0}
				${0}
				${0}
			</div>
		`), this.imgField.getLayout(), this.sizeField.getLayout(), this.attachmentField.getLayout());
	  }
	  onImageChange(event) {
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
	  }
	  saveNode(value) {
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
	  }
	  onSizeChange(size) {
	    if (main_core.Type.isString(size)) {
	      const value = this.getValue() || new BgImageValue();
	      value.setSize(size);
	      this.setValue(value);
	      this.onChange();
	    }
	  }
	  onAttachmentChange(event) {
	    if (event instanceof main_core_events.BaseEvent) {
	      const value = this.getValue() || new BgImageValue();
	      value.setAttachment(BgImageValue.getAttachmentValueByBool(this.attachmentField.getValue()));
	      this.setValue(value);
	      this.onChange();
	    }
	  }
	  onChange(event) {
	    this.cache.delete('value');
	    this.emit('onChange', {
	      data: {
	        image: this.getValue()
	      }
	    });
	  }
	  getValue() {
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
	  }
	  setValue(value) {
	    if (this.isNeedSetValue(value)) {
	      // todo: can delete prev image
	      super.setValue(value);
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
	  }
	  setActive() {
	    main_core.Dom.addClass(this.imgField.getLayout(), Image.ACTIVE_CLASS);
	  }
	  unsetActive() {
	    main_core.Dom.removeClass(this.imgField.getLayout(), Image.ACTIVE_CLASS);
	  }
	  getAttachmentValue() {
	    if (this.options && this.options.block && this.options.block.content && main_core.Dom.hasClass(this.options.block.content, 'g-bg-image')) {
	      const blockContentStyle = window.getComputedStyle(this.options.block.content);
	      const bgAttachmentValue = blockContentStyle.getPropertyValue('background-attachment');
	      return bgAttachmentValue.includes('fixed') ? 'fixed' : 'scroll';
	    }
	    return 'scroll';
	  }
	  getSizeValue() {
	    if (this.options && this.options.block && this.options.block.content && main_core.Dom.hasClass(this.options.block.content, 'g-bg-image')) {
	      const blockContentStyle = window.getComputedStyle(this.options.block.content);
	      const bgSizeValue = blockContentStyle.getPropertyValue('background-size');
	      return bgSizeValue.includes('cover') ? 'cover' : 'auto';
	    }
	    return 'cover';
	  }
	}

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

	let _$i = t => t,
	  _t$i;
	class Bg extends BgColor {
	  constructor(options) {
	    super(options);
	    this.setEventNamespace('BX.Landing.UI.Field.Processor.Bg');
	    this.styleNode = options.styleNode;
	    this.parentVariableName = this.variableName;
	    this.variableName = [this.parentVariableName, Bg.BG_URL_VAR, Bg.BG_URL_2X_VAR, Bg.BG_OVERLAY_VAR, Bg.BG_SIZE_VAR, Bg.BG_ATTACHMENT_VAR, Bg.BG_IMAGE];
	    this.parentClassName = this.className;
	    this.className = 'g-bg-image';
	    this.image = new Image(options);
	    this.image.subscribe('onChange', this.onImageChange.bind(this));
	    this.overlay = new ColorSet(options);
	    this.overlay.subscribe('onChange', this.onOverlayColorChange.bind(this));
	    this.overlayOpacity = new Opacity({
	      defaultOpacity: 0.5
	    });
	    this.overlayOpacity.subscribe('onChange', this.onOverlayOpacityChange.bind(this));
	    this.overlayPrimary = new Primary();
	    this.overlayPrimary.subscribe('onChange', this.onOverlayPrimaryChange.bind(this));
	    const overlayZeroingOptions = {
	      textCode: 'LANDING_FIELD_COLOR_OVERLAY_ZEROING_TITLE_2',
	      styleNode: options.styleNode
	    };
	    this.overlayZeroing = new Zeroing(overlayZeroingOptions);
	    this.overlayZeroing.subscribe('onChange', this.overlayZeroingChange.bind(this));
	    this.imageTabs = new Tabs().appendTab('Overlay', main_core.Loc.getMessage('LANDING_FIELD_COLOR-BG_OVERLAY'), [this.overlay, this.overlayPrimary, this.overlayZeroing, this.overlayOpacity]);
	    this.bigTabs = new Tabs().setBig(true).appendTab('Color', main_core.Loc.getMessage('LANDING_FIELD_COLOR-BG_COLOR'), [this.colorSet, this.primary, this.zeroing, this.tabs]).appendTab('Image', main_core.Loc.getMessage('LANDING_FIELD_COLOR-BG_IMAGE'), [this.image, this.imageTabs]);
	  }
	  buildLayout() {
	    return main_core.Tag.render(_t$i || (_t$i = _$i`
			<div class="landing-ui-field-color-color">
				${0}
			</div>
		`), this.bigTabs.getLayout());
	  }
	  onColorSetChange(event) {
	    this.image.unsetActive();
	    this.overlay.unsetActive();
	    super.onColorSetChange(event);
	  }
	  onGradientChange(event) {
	    this.image.unsetActive();
	    this.overlay.unsetActive();
	    super.onGradientChange(event);
	  }
	  onImageChange() {
	    // todo: can drop image from b_landing_file after change
	    this.unsetActive();
	    this.activeControl = this.image;
	    this.image.setActive();
	    this.modifyStyleNode(this.styleNode);
	  }
	  onOverlayChange(event) {
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
	  }
	  onOverlayOpacityChange() {
	    this.modifyStyleNode(this.styleNode);
	  }
	  onOverlayColorChange(event) {
	    this.overlayPrimary.unsetActive();
	    this.overlayZeroing.unsetActive();
	    this.onOverlayChange(event);
	  }
	  onOverlayPrimaryChange(event) {
	    this.overlay.unsetActive();
	    this.overlayZeroing.unsetActive();
	    this.onOverlayChange(event);
	  }
	  overlayZeroingChange(event) {
	    this.overlay.unsetActive();
	    this.overlayPrimary.unsetActive();
	    this.overlayZeroing.setActive();
	    this.onOverlayChange(event);
	  }
	  unsetActive() {
	    super.unsetActive();
	    this.image.unsetActive();
	  }

	  /**
	   * Set value by new format
	   */
	  setProcessorValue(value) {
	    this.cache.delete('value');
	    this.setValue(value);
	  }
	  setValue(value) {
	    this.image.setValue(null);
	    this.bigTabs.showTab('Color');
	    if (main_core.Type.isNull(value)) {
	      super.setValue(value);
	    } else if (main_core.Type.isString(value)) {
	      super.setValue(value);
	    } else if (this.parentVariableName in value && main_core.Type.isString(value[this.parentVariableName])) {
	      super.setValue(value[this.parentVariableName]);
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
	  getValue() {
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
	        return super.getValue();
	      }
	    });
	  }
	  getClassName() {
	    const value = this.getValue();
	    if (value === null || value instanceof ColorValue || value instanceof GradientValue) {
	      return [this.parentClassName];
	    }
	    return [this.className];
	  }

	  // todo: what about fileid?
	  getStyle() {
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
	      image = value.getUrl() ? `url('${value.getUrl()}')` : '';
	      image2x = value.getUrl2x() ? `url('${value.getUrl2x()}')` : '';
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
	  }
	  modifyStyleNode(styleNode) {
	    main_core.Dom.style(styleNode.getNode()[0], Bg.BG_IMAGE, '');
	    this.onChange();
	  }
	  prepareProcessorValue(processorValue, defaultValue) {
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
	  }
	}
	Bg.BG_URL_VAR = '--bg-url';
	Bg.BG_URL_2X_VAR = '--bg-url-2x';
	Bg.BG_OVERLAY_VAR = '--bg-overlay';
	Bg.BG_SIZE_VAR = '--bg-size';
	Bg.BG_ATTACHMENT_VAR = '--bg-attachment';
	Bg.BG_IMAGE = 'background-image';

	class BorderColor extends Color {
	  constructor(options) {
	    super(options);
	    this.setEventNamespace('BX.Landing.UI.Field.Processor.BorderColor');
	    this.property = 'border-color';
	    this.variableName = '--border-color';
	    this.className = 'g-border-color';
	  }
	}

	class BorderColorHover extends Color {
	  constructor(options) {
	    super(options);
	    this.setEventNamespace('BX.Landing.UI.Field.Processor.BorderColorHover');
	    this.property = 'border-color';
	    this.variableName = '--border-color--hover';
	    this.className = 'g-border-color--hover';
	    this.pseudoClass = ':hover';
	  }
	}

	class BgColorHover extends BgColor {
	  constructor(options) {
	    super(options);
	    this.setEventNamespace('BX.Landing.UI.Field.Processor.BgColorHover');
	    this.property = ['background-image', 'background-color'];
	    this.variableName = '--bg-hover';
	    this.className = 'g-bg--hover';
	    this.pseudoClass = ':hover';
	  }
	}

	class BgColorAfter extends BgColor {
	  constructor(options) {
	    super(options);
	    this.setEventNamespace('BX.Landing.UI.Field.Processor.BgColorAfter');
	    this.property = ['background-image', 'background-color'];
	    this.variableName = '--bg--after';
	    this.className = 'g-bg--after';
	    this.pseudoClass = ':after';
	    const opacityValue = this.getValue() || new ColorValue();
	    this.opacity.setValue(opacityValue.setOpacity(0.5));
	    this.tabs.showTab('Opacity');
	  }
	}

	class BgColorBefore extends BgColor {
	  constructor(options) {
	    super(options);
	    this.setEventNamespace('BX.Landing.UI.Field.Processor.BgColorBefore');
	    this.property = ['background-image', 'background-color'];
	    this.variableName = '--bg--before';
	    this.className = 'g-bg--before';
	    this.pseudoClass = ':before';
	    const opacityValue = this.getValue() || new ColorValue();
	    this.opacity.setValue(opacityValue.setOpacity(0.5));
	    this.tabs.showTab('Opacity');
	  }
	}

	class NavbarColor extends Color {
	  constructor(options) {
	    super(options);
	    this.setEventNamespace('BX.Landing.UI.Field.Processor.NavbarColor');
	    this.property = 'color';
	    this.variableName = '--navbar-color';
	    this.className = 'u-navbar-color';
	  }
	}

	class NavbarColorHover extends Color {
	  constructor(options) {
	    super(options);
	    this.setEventNamespace('BX.Landing.UI.Field.Processor.NavbarColorHover');
	    this.property = 'color';
	    this.variableName = '--navbar-color--hover';
	    this.className = 'u-navbar-color--hover';
	    this.pseudoClass = ':hover';
	  }
	}

	class NavbarColorFixMoment extends Color {
	  constructor(options) {
	    super(options);
	    this.setEventNamespace('BX.Landing.UI.Field.Processor.NavbarColorFixMoment');
	    this.property = 'color';
	    this.variableName = '--navbar-color--fix-moment';
	    this.className = 'u-navbar-color--fix-moment';
	  }
	}

	class NavbarColorFixMomentHover extends Color {
	  constructor(options) {
	    super(options);
	    this.setEventNamespace('BX.Landing.UI.Field.Processor.NavbarColorFixMomentHover');
	    this.property = 'color';
	    this.variableName = '--navbar-color--fix-moment--hover';
	    this.className = 'u-navbar-color--fix-moment--hover';
	    this.pseudoClass = ':hover';
	  }
	}

	class NavbarBgColor extends Color {
	  constructor(options) {
	    super(options);
	    this.setEventNamespace('BX.Landing.UI.Field.Processor.NavbarBgColor');
	    this.property = 'background-color';
	    this.variableName = '--navbar-bg-color';
	    this.className = 'u-navbar-bg';
	  }
	}

	class NavbarBgColorHover extends Color {
	  constructor(options) {
	    super(options);
	    this.setEventNamespace('BX.Landing.UI.Field.Processor.NavbarBgColorHover');
	    this.property = 'background-color';
	    this.variableName = '--navbar-bg-color--hover';
	    this.className = 'u-navbar-bg--hover';
	    this.pseudoClass = ':hover';
	  }
	}

	class BorderColorTop extends Color {
	  constructor(options) {
	    super(options);
	    this.setEventNamespace('BX.Landing.UI.Field.Processor.BorderColorTop');
	    this.property = 'border-top-color';
	    this.variableName = '--border-color-top';
	    this.className = 'g-border-color-top';
	  }
	}

	class FillColor extends Color {
	  constructor(options) {
	    super(options);
	    this.setEventNamespace('BX.Landing.UI.Field.Processor.FillColor');
	    this.property = 'fill';
	    this.pseudoClass = ':before';
	    this.variableName = '--fill-first';
	    this.className = 'g-fill-first';
	  }
	}

	class FillColorSecond extends Color {
	  constructor(options) {
	    super(options);
	    this.setEventNamespace('BX.Landing.UI.Field.Processor.FillColorSecond');
	    this.property = 'fill';
	    this.pseudoClass = ':after';
	    this.variableName = '--fill-second';
	    this.className = 'g-fill-second';
	  }
	}

	class ButtonColor extends Color {
	  constructor(options) {
	    super(options);
	    this.setEventNamespace('BX.Landing.UI.Field.Processor.ButtonColor');
	    this.property = 'background-color';
	    // order is important! Base variable must be last. Hack :-/
	    this.variableName = [ButtonColor.COLOR_CONTRAST_VAR, ButtonColor.COLOR_HOVER_VAR, ButtonColor.COLOR_LIGHT_VAR, ButtonColor.COLOR_VAR];
	    this.className = 'g-button-color'; //todo: ?
	  }

	  getStyle() {
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
	  }
	}
	ButtonColor.COLOR_CONTRAST_VAR = '--button-color-contrast';
	ButtonColor.COLOR_HOVER_VAR = '--button-color-hover';
	ButtonColor.COLOR_LIGHT_VAR = '--button-color-light';
	ButtonColor.COLOR_VAR = '--button-color';

	class NavbarCollapseBgColor extends Color {
	  constructor(options) {
	    super(options);
	    this.setEventNamespace('BX.Landing.UI.Field.Processor.NavbarCollapseBgColor');
	    this.property = 'background-color';
	    this.variableName = '--navbar-collapse-bg-color';
	    this.className = 'u-navbar-collapse-bg';
	  }
	}

	class ColorField extends landing_ui_field_basefield.BaseField {
	  constructor(options) {
	    super(options);
	    this.items = 'items' in options && options.items ? options.items : [];
	    this.postfix = typeof options.postfix === 'string' ? options.postfix : '';
	    this.frame = typeof options.frame === 'object' ? options.frame : null;
	    const processorOptions = {
	      block: options.block,
	      style: options.style,
	      styleNode: options.styleNode,
	      selector: options.selector,
	      contentRoot: this.contentRoot,
	      content: options.content
	    };
	    this.changeHandler = typeof options.onChange === "function" ? options.onChange : () => {};
	    this.valueChangeHandler = typeof options.onValueChange === "function" ? options.onValueChange : () => {};

	    // todo: rename "subtype"
	    switch (options.subtype) {
	      case 'color':
	        this.processor = new Color(processorOptions);
	        break;
	      case 'color-hover':
	        this.processor = new ColorHover(processorOptions);
	        break;
	      case 'bg':
	        this.processor = new Bg(processorOptions);
	        break;
	      case 'bg-color':
	        this.processor = new BgColor(processorOptions);
	        break;
	      case 'bg-color-hover':
	        this.processor = new BgColorHover(processorOptions);
	        break;
	      case 'bg-color-after':
	        this.processor = new BgColorAfter(processorOptions);
	        break;
	      case 'bg-color-before':
	        this.processor = new BgColorBefore(processorOptions);
	        break;
	      case 'border-color':
	        this.processor = new BorderColor(processorOptions);
	        break;
	      case 'border-color-hover':
	        this.processor = new BorderColorHover(processorOptions);
	        break;
	      case 'border-color-top':
	        this.processor = new BorderColorTop(processorOptions);
	        break;
	      case 'navbar-color':
	        this.processor = new NavbarColor(processorOptions);
	        break;
	      case 'navbar-color-hover':
	        this.processor = new NavbarColorHover(processorOptions);
	        break;
	      case 'navbar-color-fix-moment':
	        this.processor = new NavbarColorFixMoment(processorOptions);
	        break;
	      case 'navbar-color-fix-moment-hover':
	        this.processor = new NavbarColorFixMomentHover(processorOptions);
	        break;
	      case 'navbar-bg-color':
	        this.processor = new NavbarBgColor(processorOptions);
	        break;
	      case 'navbar-bg-color-hover':
	        this.processor = new NavbarBgColorHover(processorOptions);
	        break;
	      case 'navbar-collapse-bg-color':
	        this.processor = new NavbarCollapseBgColor(processorOptions);
	        break;
	      case 'fill-color':
	        this.processor = new FillColor(processorOptions);
	        break;
	      case 'fill-color-second':
	        this.processor = new FillColorSecond(processorOptions);
	        break;
	      case 'button-color':
	        this.processor = new ButtonColor(processorOptions);
	        break;
	      default:
	        break;
	    }
	    if (!this.processor) {
	      return;
	    }
	    this.property = this.processor.getProperty()[this.processor.getProperty().length - 1];
	    this.processor.getClassName().forEach(item => this.items.push({
	      name: item,
	      value: item
	    }));

	    // todo: what a input?
	    main_core.Dom.remove(this.input);
	    this.layout.classList.add("landing-ui-field-color");
	    main_core.Dom.append(this.processor.getLayout(), this.layout);
	    this.processor.subscribe('onChange', this.onChange.bind(this));
	  }
	  getInlineProperties() {
	    return this.processor.getVariableName();
	  }
	  prepareInlineProperties(props) {
	    props.push('background-image');
	    return props;
	  }
	  getComputedProperties() {
	    return this.processor.getProperty();
	  }
	  getPseudoElement() {
	    return this.processor.getPseudoClass();
	  }
	  onChange() {
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
	  }
	  getValue() {
	    return this.processor.getValue() || this.processor.getNullValue();
	  }
	  setValue(value) {
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
	  }
	  onFrameLoad() {
	    // todo: now not work with "group select", can use just any node from elements. If group - need forEach
	    const value = this.data.styleNode.getValue(true);
	    this.setValue(value.style);
	  }
	  createPopup(options) {
	    this.colorPopup = new ColorPopup(options);
	  }
	}

	exports.ColorField = ColorField;

}((this.BX.Landing.UI.Field = this.BX.Landing.UI.Field || {}),BX.Landing.UI.Field,BX.Landing.UI.Field,BX.Main,BX,BX,BX.Event,BX.Landing.UI.Field,BX.Landing,BX.Landing,BX.Landing,BX));
//# sourceMappingURL=color_field.bundle.js.map
