/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
this.BX.UI.System = this.BX.UI.System || {};
(function (exports,main_core,ui_system_typography,ui_iconSet_api_core,ui_iconSet_outline,ui_system_typography_vue,ui_iconSet_api_vue) {
	'use strict';

	const AlertDesign = Object.freeze({
	  tinted: 'tinted',
	  tintedSuccess: 'tinted-success',
	  tintedWarning: 'tinted-warning',
	  tintedAlert: 'tinted-alert'
	});

	let _ = t => t,
	  _t,
	  _t2;
	var _design = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("design");
	var _leftImage = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("leftImage");
	var _hasCloseButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hasCloseButton");
	var _content = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("content");
	var _container = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("container");
	var _onCloseButtonClick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onCloseButtonClick");
	var _closeButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("closeButton");
	var _updateContainerDesignClassname = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateContainerDesignClassname");
	var _renderCloseButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderCloseButton");
	class Alert {
	  constructor(options = {}) {
	    var _options$events;
	    Object.defineProperty(this, _renderCloseButton, {
	      value: _renderCloseButton2
	    });
	    Object.defineProperty(this, _updateContainerDesignClassname, {
	      value: _updateContainerDesignClassname2
	    });
	    Object.defineProperty(this, _design, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _leftImage, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _hasCloseButton, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _content, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _container, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _onCloseButtonClick, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _closeButton, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _design)[_design] = AlertDesign.tinted;
	    if (options.design) {
	      this.design = options.design;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _hasCloseButton)[_hasCloseButton] = options.hasCloseButton === true;
	    babelHelpers.classPrivateFieldLooseBase(this, _content)[_content] = options.content || null;
	    babelHelpers.classPrivateFieldLooseBase(this, _leftImage)[_leftImage] = options.leftImage || null;
	    babelHelpers.classPrivateFieldLooseBase(this, _onCloseButtonClick)[_onCloseButtonClick] = ((_options$events = options.events) == null ? void 0 : _options$events.closeButtonClick) || null;
	  }
	  render() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _container)[_container]) {
	      return babelHelpers.classPrivateFieldLooseBase(this, _container)[_container].root;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _container)[_container] = main_core.Tag.render(_t || (_t = _`
			<div class="ui-system-alert ui-system-alert__scope">
				<div class="ui-system-alert-inner">
					<div class="ui-system-alert__left-image"></div>
					<div ref="content" class="ui-system-alert__content"></div>
				</div>
			</div>
		`));
	    this.design = babelHelpers.classPrivateFieldLooseBase(this, _design)[_design];
	    this.leftImage = babelHelpers.classPrivateFieldLooseBase(this, _leftImage)[_leftImage];
	    this.hasCloseButton = babelHelpers.classPrivateFieldLooseBase(this, _hasCloseButton)[_hasCloseButton];
	    this.content = babelHelpers.classPrivateFieldLooseBase(this, _content)[_content];
	    return babelHelpers.classPrivateFieldLooseBase(this, _container)[_container].root;
	  }
	  destroy() {
	    var _babelHelpers$classPr;
	    if (babelHelpers.classPrivateFieldLooseBase(this, _closeButton)[_closeButton] && babelHelpers.classPrivateFieldLooseBase(this, _onCloseButtonClick)[_onCloseButtonClick]) {
	      main_core.Event.unbind(babelHelpers.classPrivateFieldLooseBase(this, _closeButton)[_closeButton], 'click', babelHelpers.classPrivateFieldLooseBase(this, _onCloseButtonClick)[_onCloseButtonClick]);
	    }
	    if ((_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _container)[_container]) != null && _babelHelpers$classPr.root) {
	      main_core.Dom.remove(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container].root);
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _closeButton)[_closeButton] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _container)[_container] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _content)[_content] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _onCloseButtonClick)[_onCloseButtonClick] = null;
	  }
	  get content() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _content)[_content];
	  }
	  set content(content) {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _container)[_container]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _container)[_container].content.innerHTML = '';
	      if (main_core.Type.isString(content)) {
	        main_core.Dom.append(ui_system_typography.Text.render(content, {
	          size: '2xs'
	        }), babelHelpers.classPrivateFieldLooseBase(this, _container)[_container].content);
	      } else if (main_core.Type.isDomNode(content)) {
	        main_core.Dom.append(content, babelHelpers.classPrivateFieldLooseBase(this, _container)[_container].content);
	      }
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _content)[_content] = content;
	  }
	  get design() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _design)[_design];
	  }
	  set design(design) {
	    if (!Object.values(AlertDesign).includes(design)) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _updateContainerDesignClassname)[_updateContainerDesignClassname](design);
	    babelHelpers.classPrivateFieldLooseBase(this, _design)[_design] = design;
	  }
	  get leftImage() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _leftImage)[_leftImage];
	  }
	  set leftImage(image) {
	    var _babelHelpers$classPr2;
	    if ((_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _container)[_container]) != null && _babelHelpers$classPr2.root) {
	      if (image) {
	        main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container].root, '--ui-alert-left-image', `url(${main_core.Text.encode(image)})`);
	        main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container].root, '--has-left-image');
	      } else {
	        main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container].root, '--ui-alert-left-image', 'none');
	        main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container].root, '--has-left-image');
	      }
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _leftImage)[_leftImage] = image;
	  }
	  get hasCloseButton() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _hasCloseButton)[_hasCloseButton];
	  }
	  set hasCloseButton(value) {
	    var _babelHelpers$classPr3;
	    if ((_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _container)[_container]) != null && _babelHelpers$classPr3.root) {
	      if (value === true) {
	        if (!babelHelpers.classPrivateFieldLooseBase(this, _closeButton)[_closeButton]) {
	          babelHelpers.classPrivateFieldLooseBase(this, _closeButton)[_closeButton] = babelHelpers.classPrivateFieldLooseBase(this, _renderCloseButton)[_renderCloseButton]();
	        }
	        main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _closeButton)[_closeButton], babelHelpers.classPrivateFieldLooseBase(this, _container)[_container].root);
	        main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container].root, '--has-close-button');
	      } else {
	        if (babelHelpers.classPrivateFieldLooseBase(this, _closeButton)[_closeButton]) {
	          main_core.Dom.remove(babelHelpers.classPrivateFieldLooseBase(this, _closeButton)[_closeButton]);
	        }
	        main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container].root, '--has-close-button');
	      }
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _hasCloseButton)[_hasCloseButton] = value === true;
	  }
	  get onClose() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _onCloseButtonClick)[_onCloseButtonClick];
	  }
	  set onClose(callback) {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _closeButton)[_closeButton] && babelHelpers.classPrivateFieldLooseBase(this, _onCloseButtonClick)[_onCloseButtonClick]) {
	      main_core.Event.unbind(babelHelpers.classPrivateFieldLooseBase(this, _closeButton)[_closeButton], 'click', babelHelpers.classPrivateFieldLooseBase(this, _onCloseButtonClick)[_onCloseButtonClick]);
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _onCloseButtonClick)[_onCloseButtonClick] = main_core.Type.isFunction(callback) ? callback : null;
	    if (babelHelpers.classPrivateFieldLooseBase(this, _closeButton)[_closeButton] && babelHelpers.classPrivateFieldLooseBase(this, _onCloseButtonClick)[_onCloseButtonClick]) {
	      main_core.Event.bind(babelHelpers.classPrivateFieldLooseBase(this, _closeButton)[_closeButton], 'click', babelHelpers.classPrivateFieldLooseBase(this, _onCloseButtonClick)[_onCloseButtonClick]);
	    }
	  }
	  get container() {
	    var _babelHelpers$classPr4;
	    return ((_babelHelpers$classPr4 = babelHelpers.classPrivateFieldLooseBase(this, _container)[_container]) == null ? void 0 : _babelHelpers$classPr4.root) || null;
	  }
	}
	function _updateContainerDesignClassname2(design) {
	  var _babelHelpers$classPr5;
	  if ((_babelHelpers$classPr5 = babelHelpers.classPrivateFieldLooseBase(this, _container)[_container]) != null && _babelHelpers$classPr5.root) {
	    main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container].root, `--${babelHelpers.classPrivateFieldLooseBase(this, _design)[_design]}`);
	    main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container].root, `--${design}`);
	  }
	}
	function _renderCloseButton2() {
	  const icon = new ui_iconSet_api_core.Icon({
	    icon: ui_iconSet_api_core.Outline.CROSS_S,
	    size: 24
	  });
	  const button = main_core.Tag.render(_t2 || (_t2 = _`
			<button
				class="ui-system-alert__close-button --ui-hoverable"
				aria-label="${0}"
				title="${0}"
			>${0}</button>
		`), main_core.Text.encode(main_core.Loc.getMessage('UI_SYSTEM_ALERT_CLOSE_BUTTON_LABEL_ARIA')), main_core.Text.encode(main_core.Loc.getMessage('UI_SYSTEM_ALERT_CLOSE_BUTTON_LABEL_ARIA')), icon.render());
	  if (babelHelpers.classPrivateFieldLooseBase(this, _onCloseButtonClick)[_onCloseButtonClick]) {
	    main_core.Event.bind(button, 'click', babelHelpers.classPrivateFieldLooseBase(this, _onCloseButtonClick)[_onCloseButtonClick]);
	  }
	  return button;
	}

	const Alert$1 = {
	  name: 'Alert',
	  components: {
	    Text2Xs: ui_system_typography_vue.Text2Xs,
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  props: {
	    design: {
	      type: String,
	      required: false,
	      default: AlertDesign.tinted,
	      validator: value => {
	        return Object.values(AlertDesign).includes(value);
	      }
	    },
	    hasCloseButton: {
	      type: Boolean,
	      required: false,
	      default: false
	    },
	    leftImage: {
	      type: String,
	      required: false,
	      default: null
	    }
	  },
	  emits: ['closeButtonClick'],
	  computed: {
	    closeIcon() {
	      return ui_iconSet_api_vue.Outline.CROSS_S;
	    },
	    rootClasses() {
	      return ['ui-system-alert', 'ui-system-alert__scope', `--${this.design}`, {
	        '--has-close-button': this.hasCloseButton,
	        '--has-left-image': Boolean(this.leftImage)
	      }];
	    },
	    leftImageStyle() {
	      if (!this.leftImage) {
	        return {};
	      }
	      return {
	        '--ui-alert-left-image': `url(${this.leftImage})`
	      };
	    }
	  },
	  methods: {
	    handleCloseClick() {
	      this.$emit('closeButtonClick');
	    }
	  },
	  template: `
		<div :class="rootClasses" :style="leftImageStyle">
			<div class="ui-system-alert-inner">
				<div class="ui-system-alert__left-image"></div>
				<div class="ui-system-alert__content">
					<Text2Xs>
						<slot></slot>
					</Text2Xs>
				</div>
			</div>
			<button
				v-if="hasCloseButton"
				class="ui-system-alert__close-button --ui-hoverable"
				:aria-label="$Bitrix.Loc.getMessage('UI_SYSTEM_ALERT_CLOSE_BUTTON_LABEL_ARIA')"
				:title="closeButtonLabel"
				@click="handleCloseClick"
			>
				<BIcon :name="closeIcon" :size="24" />
			</button>
		</div>
	`
	};

	var vue = /*#__PURE__*/Object.freeze({
		Alert: Alert$1
	});

	exports.Vue = vue;
	exports.Alert = Alert;
	exports.AlertDesign = AlertDesign;

}((this.BX.UI.System.Alert = this.BX.UI.System.Alert || {}),BX,BX.UI.System.Typography,BX.UI.IconSet,BX,BX.UI.System.Typography.Vue,BX.UI.IconSet));
//# sourceMappingURL=alert.bundle.js.map
